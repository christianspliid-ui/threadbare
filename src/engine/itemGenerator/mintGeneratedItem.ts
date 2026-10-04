/**
 * `mintGeneratedItem` — the one writer of generated items (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Systems design
 * (`mintGeneratedItem.ts`) and § Graph nodes / edges. Builds the node from a
 * `GeneratedItem` (the prototype's `toNode`), adds it, hands it to its holder, stamps
 * Storied at the requested level (and Cursed when its catch is a curse), and emits
 * `item.generated`. Used by `mintMasterwork` and by the debug lever.
 *
 * A generated item is an ordinary `artifact` node with the possession property bag the
 * reward catalog already uses, plus `properties.origin = 'generated'` and one
 * `properties.generated` bag — no new node or edge type.
 */

import type { WorldGraph } from '../graph';
import { emitTrace } from '../traceBuffer';
import { assignArtifactTrait } from '../artifactTraits';
import { ARTIFACT_CURSED_TRAIT_ID, ARTIFACT_STORIED_TRAIT_ID } from '../../data/artifact-trait-content';
import { ITEM_GEN_MAX_REROLLS, STORIED_START_LEVEL_FOUND_BY_BAND, STORIED_START_LEVEL_MASTERWORK } from '../../data/item-generator-tables';
import { tryGenerate } from './generateItem';
import { onItemAcquired } from '../spellGrant';
import { validateGeneratedItem } from './validateGeneratedItem';
import type { GenerateItemRefusal } from './generateItem';
import type { GeneratedItem, GeneratedItemProvenance, ItemGenRequest } from './types';

/** A generated item plus the rerolls it took to pass the validator. */
export interface ValidGeneratedItem {
  readonly item: GeneratedItem;
  readonly rerolls: number;
}

export type GenerateValidItemResult =
  | { ok: true; item: GeneratedItem; rerolls: number }
  | { ok: false; reason: GenerateItemRefusal | 'validator_exhausted'; lastProblems: string[] };

/**
 * Generate an item that passes the honest-vocabulary validator, rerolling with seed key
 * suffix `:r<k>` up to `ITEM_GEN_MAX_REROLLS`. A shipped core should never need a reroll
 * (the gate test proves it); the path exists for NFP #4.
 */
export function generateValidItem(req: ItemGenRequest): GenerateValidItemResult {
  let lastProblems: string[] = [];
  for (let k = 0; k <= ITEM_GEN_MAX_REROLLS; k++) {
    const seedKey = k === 0 ? req.seedKey : `${req.seedKey}:r${k}`;
    const r = tryGenerate({ ...req, seedKey });
    if (typeof r === 'string') return { ok: false, reason: r, lastProblems: [] };
    const problems = validateGeneratedItem(r);
    if (problems.length === 0) return { ok: true, item: r, rerolls: k };
    lastProblems = problems;
  }
  return { ok: false, reason: 'validator_exhausted', lastProblems };
}

/** The Storied level a generated item is born at. */
export function storiedStartLevel(item: Pick<GeneratedItem, 'origin' | 'band'>): number {
  return item.origin === 'masterwork' ? STORIED_START_LEVEL_MASTERWORK : STORIED_START_LEVEL_FOUND_BY_BAND[item.band];
}

/** A plain numeric line for debug readers — the sheet never shows it (Law 13). */
function mechanicalSummary(item: GeneratedItem): string {
  return item.effects.map(e => {
    switch (e.type) {
      case 'passive': return `${e.value > 0 ? '+' : ''}${e.value} ${e.reach} roll`;
      case 'conditional': return `${e.value > 0 ? '+' : ''}${e.value} ${e.reach} ${e.condition}`;
      case 'stat_contribution': return Object.entries(e.contributions).map(([r, v]) => `${r} capability ${(v ?? 0) > 0 ? '+' : ''}${v}`).join(' / ');
      default: return e.type;
    }
  }).join(' · ');
}

export interface MintGeneratedItemOptions {
  /** The node id to mint under (`gen_…`). */
  readonly id: string;
  readonly tick: number;
  /** Who holds it (a `possesses` edge); omit to mint an unheld thing. */
  readonly holderId?: string | null;
  /** Who made it (`craftedBy`) — a masterwork's maker. */
  readonly makerId?: string | null;
  readonly placeId?: string | null;
  readonly rerolls?: number;
  /** Tags on the `possesses` edge (a masterwork keeps its `masterwork` tag). */
  readonly edgeTags?: readonly string[];
  /** Trace/source word for the trait stamps. */
  readonly source?: string;
  /** THR-1672 — the world seed, for a teaching book's hashed pick. */
  readonly worldSeed?: number;
}

/**
 * Mint a generated item into the graph. Returns the node id, or `null` when the node
 * could not be written (an id collision, a missing holder) — the caller falls back.
 * Never throws.
 */
export function mintGeneratedItem(graph: WorldGraph, item: GeneratedItem, opts: MintGeneratedItemOptions): string | null {
  try {
    if (graph.getNode(opts.id)) return null;
    if (opts.holderId && !graph.getNode(opts.holderId)) return null;
    const provenanceBag: GeneratedItemProvenance = {
      origin: item.origin, coreId: item.coreId, signatureId: item.signatureId, band: item.band, seedKey: item.seedKey,
      formId: item.formId, catchIndexes: [...item.catchIndexes], catchNotes: [...item.catchNotes],
      provenanceConcepts: [...item.concepts], makerId: opts.makerId ?? null, rerolls: opts.rerolls ?? 0,
    };
    graph.addNode({
      id: opts.id,
      type: 'artifact',
      name: item.name,
      properties: {
        attachmentCategory: 'possession',
        subcategory: item.kind,
        slotTag: item.slotTag,
        tier: item.band,
        tags: [...item.tags],
        mechanicalSummary: mechanicalSummary(item),
        lossCondition: item.lossCondition,
        effects: [...item.effects],
        // What it is: the look, then its story. The sheet's prose block renders this.
        flavorText: `${item.look} ${item.provenance}`,
        sphereAffinity: item.sphere,
        createdTick: opts.tick,
        ...(opts.makerId ? { craftedBy: opts.makerId } : {}),
        origin: 'generated',
        generated: provenanceBag,
      },
    });
    if (opts.holderId) {
      graph.addEdge({
        id: `possesses_${opts.holderId}_${opts.id}`,
        source: opts.holderId,
        target: opts.id,
        type: 'possesses',
        properties: { modifiers: {}, tags: [...(opts.edgeTags ?? [])] },
      });
    }

    const source = opts.source ?? `item_generator:${item.origin}`;
    const storiedLevel = storiedStartLevel(item);
    assignArtifactTrait(graph, opts.id, ARTIFACT_STORIED_TRAIT_ID, { tick: opts.tick, source, level: storiedLevel });
    if (item.cursed) assignArtifactTrait(graph, opts.id, ARTIFACT_CURSED_TRAIT_ID, { tick: opts.tick, source });

    emitTrace({
      category: 'item.generated',
      tick: opts.tick,
      agentId: opts.holderId ?? undefined,
      summary: `${item.name} was ${item.origin === 'masterwork' ? 'made' : 'found'} — ${item.coreLabel} (${item.signatureId}), ${item.band === 2 ? 'Storied' : item.band === 3 ? 'Mythic' : 'Legendary'}`,
      itemId: opts.id,
      name: item.name,
      origin: item.origin,
      coreId: item.coreId,
      signatureId: item.signatureId,
      band: item.band,
      seedKey: item.seedKey,
      makerId: opts.makerId ?? null,
      placeId: opts.placeId ?? null,
      sphere: item.sphere,
      reach: item.reach,
      effectCount: item.effects.length,
      catchCount: item.catchIndexes.length,
      rerolls: opts.rerolls ?? 0,
      storiedLevel,
    });

    // THR-1672 — a forbidden book teaches whoever comes to hold it. A masterwork's
    // maker does not learn from the book they wrote; the next holder does.
    if (opts.holderId && opts.holderId !== opts.makerId) {
      onItemAcquired(graph, opts.holderId, opts.id, opts.tick, 'minted', opts.worldSeed ?? 0);
    }
    return opts.id;
  } catch {
    // Leave no half-minted thing behind: the caller's fallback mints its own node.
    try { if (graph.getNode(opts.id)) graph.removeNode(opts.id); } catch { /* fail-soft */ }
    return null;
  }
}
