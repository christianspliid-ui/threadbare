/**
 * The step cast — a caster reaches for a spell when the odds turn bad
 * (THR-1670, the power runtime S2).
 *
 * `resolveCast` (S1) is the one resolver for every cast. This module is the half
 * before it: *does the mortal cast on this step, and with what?* It is pure — it
 * reads the graph and writes nothing — so the attended forecast and the roll can
 * both ask, and both get the same answer (lane decision 2: the decision reads no
 * nudge; only the roll that follows is the god's to bend).
 *
 * The pieces, in the order `decideStepCast` (in `unifiedActionResolution.ts`,
 * which owns the pre-card probability) calls them:
 *
 *   1. `findStepCastSpell` — the fitting spell: a *wielded*, *deliberate* spell
 *      whose arena fits the step (`encounter` on a non-fight step of its
 *      `castReach`; `fight` on a clash). Highest tier, then id. Then the gates the
 *      resolver would refuse on — sealed, cooldown, prerequisite, cost, target —
 *      so a mortal never "decides" to cast a spell that cannot go off.
 *   2. `castThresholdForMortal` — courage against prudence.
 *   3. `stepCastRecordFor` — cast when the pre-card probability is below it.
 *
 * Returns `null` when the roller wields no deliberate spell at all — the case for
 * nearly every step in the world — so nothing is recorded and nothing is traced.
 *
 * Plan doc: Docs/plans/2026-09-29-thr-1571-power-runtime.md § S2.1
 */

import type { GameState } from '../types/gameState';
import type { SpellTemplate } from '../types/effects';
import type { ReachDomain } from '../types/traits';
import type { StepCastDeclinedReason, StepCastRecord } from '../types/unifiedAction';
import { getSpellTemplate, spellAgencyOf } from '../data/spell-templates';
import { castStepBonusForTier, castThresholdFor } from '../data/spell-casting-constants';
import { COOLDOWN_MINIMUM_TICKS } from '../data/effect-constants';
import { castCooldownKey, canPayCosts, checkPrerequisites } from './spellActivation';
import { isSpellSuppressedFor } from './effects/effectSuppression';
import { resolveCastTarget } from './spellCasting';
import { readLiveAxisLean } from './encounters/branchDecision';
import { emitTrace } from './traceBuffer';

/** What kind of step a cast is being considered for. */
export interface StepCastSite {
  /** The reach the step tests (a fight's clash reach, after the card). */
  readonly reach: ReachDomain;
  /** The fight role, when the step is a fight exchange. */
  readonly fightRole?: 'nerve' | 'clash';
  /** The node the step is about — a fight's opponent, or the action's target. */
  readonly targetNodeId?: string;
}

/** A spell's arena fits a step (§ S2.1). Map arenas never fit one. */
export function spellFitsStep(spell: SpellTemplate, site: StepCastSite): boolean {
  if (spell.arena === 'encounter') return !site.fightRole && spell.castReach === site.reach;
  if (spell.arena === 'fight') return site.fightRole === 'clash';
  return false;
}

/** The deliberate spells a mortal wields (`has_trait` to a spell definition node), sorted by id. */
export function wieldedDeliberateSpells(state: Pick<GameState, 'graph'>, casterId: string): SpellTemplate[] {
  const out: SpellTemplate[] = [];
  for (const edge of state.graph.getOutgoingEdges(casterId, 'has_trait')) {
    const node = state.graph.getNode(edge.target);
    if (node?.properties.subcategory !== 'spell') continue;
    const templateId = node.properties.spellTemplateId;
    const spell = typeof templateId === 'string' ? getSpellTemplate(templateId) : undefined;
    if (spell && spellAgencyOf(spell) === 'deliberate') out.push(spell);
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** Highest tier first, then id — the plan's one tie-break (NFP #3). */
function byTierThenId(a: SpellTemplate, b: SpellTemplate): number {
  return b.tier - a.tier || a.id.localeCompare(b.id);
}

/** Why this caster could not cast this spell right now, or null when nothing stands in the way. */
function gateFor(
  state: GameState,
  casterId: string,
  spell: SpellTemplate,
  site: StepCastSite,
): StepCastDeclinedReason | null {
  const last = state.castCooldowns?.get(castCooldownKey(casterId, spell.id));
  if (last !== undefined && state.tick - last < Math.max(spell.cooldownTicks, COOLDOWN_MINIMUM_TICKS)) {
    return 'cooldown';
  }
  if (!checkPrerequisites(state.graph, casterId, spell).met) return 'prerequisite';
  if (!canPayCosts(state.graph, casterId, spell.cost).canPay) return 'cost';
  if (spell.targeting.type === 'agent'
    && !resolveCastTarget(state.graph, casterId, spell, site.targetNodeId).targetId) {
    return 'no_target';
  }
  return null;
}

/**
 * The spell a mortal would cast on this step, or why none can go off. `null` when
 * they wield no deliberate spell at all (nothing to record).
 */
export function findStepCastSpell(
  state: GameState,
  casterId: string,
  site: StepCastSite,
): { spell: SpellTemplate } | { declined: StepCastDeclinedReason; spell?: SpellTemplate } | null {
  const wielded = wieldedDeliberateSpells(state, casterId);
  if (wielded.length === 0) return null;
  const fitting = wielded.filter(s => spellFitsStep(s, site)).sort(byTierThenId);
  if (fitting.length === 0) return { declined: 'no_fitting_spell' };
  if (isSpellSuppressedFor(state.graph, casterId, state.effectStates)) {
    return { declined: 'sealed', spell: fitting[0] };
  }
  let firstReason: StepCastDeclinedReason | null = null;
  for (const spell of fitting) {
    const reason = gateFor(state, casterId, spell, site);
    if (reason === null) return { spell };
    firstReason ??= reason;
  }
  return { declined: firstReason ?? 'no_fitting_spell', spell: fitting[0] };
}

/** The mortal's cast threshold, read off their live courage lean (as the fight's nerve step reads it). */
export function castThresholdForMortal(state: GameState, casterId: string): number {
  let lean = 0;
  try {
    lean = readLiveAxisLean(state, casterId, 'courage_prudence');
  } catch {
    lean = 0; // NFP #4 — an unreadable profile is a neutral one
  }
  return castThresholdFor(lean);
}

/**
 * The step cast record, given the pre-card probability. The caller computes that
 * probability (it owns the step derivation) and only when a spell could go off, so
 * a mortal with no fitting spell costs one edge walk.
 */
export function stepCastRecordFor(
  state: GameState,
  casterId: string,
  site: StepCastSite,
  preCardProbability: () => number,
): StepCastRecord | null {
  const found = findStepCastSpell(state, casterId, site);
  if (!found) return null;
  const threshold = castThresholdForMortal(state, casterId);
  if ('declined' in found) {
    return {
      decision: 'declined',
      casterId,
      ...(found.spell ? { spellId: found.spell.id } : {}),
      threshold,
      declinedReason: found.declined,
    };
  }
  const p = preCardProbability();
  const { targetId, filterRejected } = resolveCastTarget(state.graph, casterId, found.spell, site.targetNodeId);
  const base = {
    casterId, spellId: found.spell.id, ...(targetId ? { targetId } : {}),
    ...(filterRejected ? { filterRejected } : {}), threshold, preCardProbability: p,
  };
  if (!(p < threshold)) return { decision: 'declined', ...base, declinedReason: 'odds_good' };
  return { decision: 'cast', ...base, bonus: castStepBonusForTier(found.spell.tier) };
}

/** `spell.cast_decided` — once per step where a caster could cast (§ Tracing). */
export function traceStepCastDecided(
  tick: number,
  actionId: string,
  stepIndex: number,
  record: StepCastRecord,
): void {
  try {
    emitTrace({
      category: 'spell.cast_decided',
      tick,
      agentId: record.casterId,
      actionId,
      stepIndex,
      casterId: record.casterId,
      spellId: record.spellId ?? '',
      ...(record.preCardProbability !== undefined ? { preCardProbability: record.preCardProbability } : {}),
      threshold: record.threshold,
      decision: record.decision,
      ...(record.declinedReason ? { declinedReason: record.declinedReason } : {}),
      summary: record.decision === 'cast'
        ? `${record.casterId} reaches for ${record.spellId} (P=${(record.preCardProbability ?? 0).toFixed(2)} < ${record.threshold.toFixed(2)})`
        : `${record.casterId} does not cast${record.spellId ? ` ${record.spellId}` : ''}: ${record.declinedReason}`,
    });
  } catch {
    /* NFP #4 */
  }
}
