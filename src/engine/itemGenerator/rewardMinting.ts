/**
 * `tryGeneratedReward` — the item generator's second minting point: found things in the
 * reward draw (THR-1626).
 *
 * Plan: `Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md` § Engine pillar.
 *
 * `drawSeededReward` calls this once, after the pool has picked an authored item and
 * only on a prize draw. On an eligible pick a share roll (`GENERATED_REWARD_SHARE_BY_BAND`)
 * may hand the recipient a freshly generated `found` thing instead — dressed by this
 * world's dead, its disasters and its monsters, and carrying every tag the recipe asked
 * for. Where the generator cannot honour the recipe, the authored item stands.
 *
 * - **After the pick** (Lane decision): the pool, its weights, the bad-outcome flip and
 *   the draw roll are untouched, so the recipe still decides the band and the theme.
 * - **The recipe is honoured** (Lane decision): the item must carry every tag in the
 *   recipe's `tagFilters`, or the authored item stands (`no_fit`).
 * - **Never one idea on repeat** (Lane decision): substitute only when at least
 *   `ITEM_GEN_REWARD_MIN_FIT_CORES` `found` cores can carry those tags at the band.
 *
 * **Determinism (NFP #3).** The roll and the item each run on their own hashed stream; the
 * draw's `rng` is never consumed, so with the share at 0 (or the switch off) every world
 * is identical to one without this module.
 *
 * **Fail-soft (NFP #4).** Never throws: every failure leaves the authored item in place.
 */

import type { WorldGraph } from '../graph';
import type { ContentQuerySite } from '../../types/contentQuery';
import type { TraceEntry } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { mulberry32 } from '../../lib/prng';
import { hashSeed } from '../naming/workNames';
import { ITEM_GEN_CORES, coreCanCarryTags } from '../../data/item-generator-cores';
import {
  GENERATED_REWARD_SHARE_BY_BAND, ITEM_GEN_REWARD_ENABLED, ITEM_GEN_REWARD_FIT_ATTEMPTS,
  ITEM_GEN_REWARD_ID_PREFIX, ITEM_GEN_REWARD_MIN_FIT_CORES,
} from '../../data/item-generator-tables';
import { isGeneratedRewardForced } from '../debugGeneratedRewardPin';
import { buildItemWorldContext, itemGenHistoryFromGraph } from './worldContext';
import { generateValidItem, mintGeneratedItem } from './mintGeneratedItem';
import type { GeneratedItem } from './types';

export interface GeneratedRewardRequest {
  readonly graph: WorldGraph;
  readonly seed: number;
  readonly tick: number;
  readonly recipientId: string;
  /** What the pool picked. */
  readonly drawnTemplateId: string;
  /** The effective recipe's `tagFilters` (empty = none). */
  readonly requiredTags: readonly string[];
  readonly site: ContentQuerySite;
}

/** The shape `instantiateReward` returns, restated so this module needs no runtime import of the pool. */
export interface GeneratedRewardInstantiation {
  readonly instanceId: string;
  readonly edgeId: string;
  readonly category: 'possession';
  readonly displayName: string;
}

export type GeneratedRewardSkip =
  | 'disabled' | 'not_eligible' | 'kept_by_roll' | 'too_few_cores' | 'no_fit' | 'generator_refused' | 'mint_failed';

export type GeneratedRewardResult =
  | { readonly substituted: true; readonly instantiation: GeneratedRewardInstantiation; readonly item: GeneratedItem; readonly band: 2 | 3 }
  | { readonly substituted: false; readonly reason: GeneratedRewardSkip };

/** The band a pick would be generated at, or null when the pick is not eligible. */
export function generatedRewardBand(graph: WorldGraph, drawnTemplateId: string): 2 | 3 | null {
  const node = graph.getNode(drawnTemplateId);
  // Companions and agreements are registry-backed (no node); Legendaries are their own
  // node type; a service grants something else; a trait is never an item.
  if (!node || node.type !== 'artifact') return null;
  if (node.properties.rewardMode === 'service') return null;
  const tier = node.properties.tier;
  if (typeof tier !== 'number') return null;
  if (tier !== 2 && tier !== 3) return null;
  return GENERATED_REWARD_SHARE_BY_BAND[tier] > 0 ? tier : null;
}

/** `found` cores that can carry `tags` at `band` — the two-core floor counts these. */
export function foundCoresCarrying(tags: readonly string[], band: 2 | 3): string[] {
  return ITEM_GEN_CORES
    .filter(c => c.origins.includes('found') && c.bands.includes(band) && coreCanCarryTags(c, tags))
    .map(c => c.id);
}

/** The share roll's own stream (plan § PRNG callouts). */
export function generatedRewardRoll(seed: number, tick: number, recipientId: string, drawnTemplateId: string): number {
  return mulberry32(hashSeed(`gen_reward:${seed}:${tick}:${recipientId}:${drawnTemplateId}`))();
}

/** Every tag present — the reward draw's own ALL-of rule (`rewardCandidateMatchesTags`). */
function carriesAll(itemTags: readonly string[], required: readonly string[]): boolean {
  return required.every(t => itemTags.includes(t));
}

/**
 * Maybe stand a generated `found` thing in for the pool's pick. Never throws; on any
 * `substituted: false` the caller instantiates the authored pick exactly as before.
 */
export function tryGeneratedReward(req: GeneratedRewardRequest): GeneratedRewardResult {
  try {
    if (!ITEM_GEN_REWARD_ENABLED) return { substituted: false, reason: 'disabled' };
    const band = generatedRewardBand(req.graph, req.drawnTemplateId);
    if (band === null) return { substituted: false, reason: 'not_eligible' };
    if (!req.graph.getNode(req.recipientId)) return { substituted: false, reason: 'not_eligible' };

    const forced = isGeneratedRewardForced();
    if (!forced && generatedRewardRoll(req.seed, req.tick, req.recipientId, req.drawnTemplateId) >= GENERATED_REWARD_SHARE_BY_BAND[band]) {
      return { substituted: false, reason: 'kept_by_roll' };
    }

    const requiredTags = [...req.requiredTags];
    const fitCores = foundCoresCarrying(requiredTags, band).length;
    const trace = (outcome: 'substituted' | 'too_few_cores' | 'no_fit' | 'generator_refused' | 'mint_failed', attempts: number, item: GeneratedItem | null, itemId: string | null) => {
      const recipient = req.graph.getNode(req.recipientId)?.name ?? req.recipientId;
      const authored = req.graph.getNode(req.drawnTemplateId)?.name ?? req.drawnTemplateId;
      emitTrace({
        category: 'reward.generated',
        tick: req.tick,
        agentId: req.recipientId,
        summary: outcome === 'substituted' && item
          ? `${recipient} was handed ${item.name} instead of ${authored}`
          : `${recipient} kept ${authored} — no generated thing stood in (${outcome})`,
        site: req.site,
        drawnTemplateId: req.drawnTemplateId,
        band,
        requiredTags,
        fitCores,
        outcome,
        itemId,
        attempts,
      } as TraceEntry);
    };

    if (fitCores < ITEM_GEN_REWARD_MIN_FIT_CORES) {
      trace('too_few_cores', 0, null, null);
      return { substituted: false, reason: 'too_few_cores' };
    }

    const world = buildItemWorldContext(req.graph, { past: true });
    const history = itemGenHistoryFromGraph(req.graph);
    const baseKey = `gen_item:${req.seed}:found:${req.recipientId}:${req.tick}:${req.drawnTemplateId}`;
    let fit: { item: GeneratedItem; rerolls: number } | null = null;
    let attempts = 0;
    let refused = false;
    for (let k = 0; k < ITEM_GEN_REWARD_FIT_ATTEMPTS; k++) {
      attempts = k + 1;
      const r = generateValidItem({ seedKey: `${baseKey}:f${k}`, band, origin: 'found', world, history, requiredTags });
      if (!r.ok) {
        // An item that missed a required tag is a miss for this key — try the next one.
        if (r.reason === 'missing_required_tags') { refused = false; continue; }
        // No eligible core (or line) is a property of this world, not of the seed key;
        // another attempt would refuse the same way.
        refused = true;
        if (r.reason !== 'validator_exhausted') break;
        continue;
      }
      refused = false;
      if (carriesAll(r.item.tags, requiredTags)) { fit = { item: r.item, rerolls: r.rerolls }; break; }
    }
    if (!fit) {
      const outcome = refused ? 'generator_refused' : 'no_fit';
      trace(outcome, attempts, null, null);
      return { substituted: false, reason: outcome };
    }

    const id = `${ITEM_GEN_REWARD_ID_PREFIX}${req.recipientId}_${req.tick}_${req.drawnTemplateId}`;
    const minted = mintGeneratedItem(req.graph, fit.item, {
      id,
      tick: req.tick,
      holderId: req.recipientId,
      rerolls: fit.rerolls,
      source: 'item_generator:found_reward',
      worldSeed: req.seed,
    });
    if (!minted) {
      trace('mint_failed', attempts, null, null);
      return { substituted: false, reason: 'mint_failed' };
    }
    // The slot resolver orders held things by when they were acquired, as it does a
    // cloned reward.
    const node = req.graph.getNode(minted);
    if (node) node.properties.acquiredTick = req.tick;
    trace('substituted', attempts, fit.item, minted);
    // THR-1672 — a forbidden book teaches on the way in; read the teaching back off the
    // reader's edge (Law 56) so the reward line can say what they learned.
    const taughtEdge = req.graph.getOutgoingEdges(req.recipientId, 'knows_spell').find(e => e.properties.viaItemId === minted);
    const taughtSpellName = taughtEdge ? req.graph.getNode(taughtEdge.target)?.name : undefined;
    return {
      substituted: true,
      band,
      item: fit.item,
      instantiation: {
        instanceId: minted, edgeId: `possesses_${req.recipientId}_${minted}`, category: 'possession', displayName: fit.item.name,
        ...(taughtSpellName ? { taughtSpellName } : {}),
      },
    };
  } catch {
    return { substituted: false, reason: 'mint_failed' };
  }
}
