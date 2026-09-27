/**
 * Cast value drift (THR-1651) — what Oneiric Sending and Divine Compulsion
 * actually do to a mortal.
 *
 * Before this, `divine.dream` and `divine.persuade` wrote an `apply_influence`
 * entry with no `valueDrifts`, so `buildValueOverlay`, the agent re-score and
 * the motive receipt's divine term all computed nothing: the casts did nothing.
 *
 * The drift cannot be static template data — it depends on the caster's primary
 * reach and on which way the target already leans — so the template carries a
 * `valueDriftRule` and this pure function resolves it. Two callers share it:
 * the `apply_influence` executor (the write) and `processPlayerReceipts` (the
 * line the player reads), so the receipt can never describe a different drift
 * from the one written.
 *
 * Pure and deterministic (NFP #3): reads the graph, never writes, no PRNG.
 * Fail-soft (NFP #4): a caster with no reach affinities or an unknown target
 * resolves to a no-drift outcome, never a throw.
 */

import type { WorldGraph } from './graph';
import type { CastValueDriftRule, InfluencePayload } from '../types/graphOp';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { isActionStepBranch } from '../types/unifiedAction';
import type { ValuePair } from '../types/agent';
import type { ReachDomain } from '../types/traits';
import { REACH_VALUE_PAIR } from '../types/agent';
import { getAscendantPrimaryReach } from './ascendantExpression';
import { getCurrentStrength } from './decayCurve';
import { durationLabel } from './aftermathWords';
import type { DivineInfluenceEntry } from '../types/dream';

export type CastDriftOutcome =
  /** A drift resolved and will be (or was) written. */
  | 'drift'
  /** `own_lean` on a target sitting at exactly 0 on the pair — the dream finds nothing to hold. */
  | 'no_lean'
  /** The caster has no reach affinities, so there is no pair to drift. */
  | 'no_reach';

export interface CastDriftResolution {
  readonly outcome: CastDriftOutcome;
  /** The caster's primary reach, when one resolved. */
  readonly reach: ReachDomain | null;
  /** The value pair bound to that reach, when one resolved. */
  readonly pair: ValuePair | null;
  /** The target's base lean on the pair before the cast (0 when unknown). */
  readonly lean: number;
  /** Signed drift to write; 0 unless `outcome === 'drift'`. */
  readonly drift: number;
}

/**
 * Resolve a cast's value drift against the caster and target as they stand.
 *
 * The lean read is the target's **base** `axiologicalProfile`, never the
 * divine overlay — "the direction the mortal already leans" is who they are,
 * not who a previous cast has nudged them toward. That also makes the answer
 * stable across the resolution → receipt gap within a tick, since influences
 * never write the base profile.
 */
export function resolveCastValueDrift(
  graph: WorldGraph,
  casterId: string,
  targetId: string,
  rule: CastValueDriftRule,
): CastDriftResolution {
  const reach = getAscendantPrimaryReach(graph, casterId) ?? null;
  const pair = reach ? REACH_VALUE_PAIR[reach] ?? null : null;
  const profile = graph.getNode(targetId)?.properties?.axiologicalProfile as
    | Partial<Record<ValuePair, number>>
    | undefined;
  const rawLean = pair ? profile?.[pair] : undefined;
  const lean = typeof rawLean === 'number' && Number.isFinite(rawLean) ? rawLean : 0;

  if (!reach || !pair) {
    return { outcome: 'no_reach', reach, pair, lean, drift: 0 };
  }

  if (rule.direction === 'first_pole') {
    return { outcome: 'drift', reach, pair, lean, drift: Math.abs(rule.magnitude) };
  }

  if (lean === 0) {
    return { outcome: 'no_lean', reach, pair, lean, drift: 0 };
  }
  return { outcome: 'drift', reach, pair, lean, drift: Math.sign(lean) * Math.abs(rule.magnitude) };
}

/**
 * The first `apply_influence` payload in a template's concrete steps that carries
 * a `valueDriftRule` — how a reader recognises a value-drifting cast without a
 * template-id list. Branch steps are skipped; they carry no ops of their own.
 */
export function findValueDriftInfluence(
  template: Pick<UnifiedActionTemplate, 'steps'>,
): InfluencePayload | undefined {
  for (const step of template.steps ?? []) {
    if (isActionStepBranch(step)) continue;
    const op = (step.onSuccess ?? []).find((o) => o.op === 'apply_influence' && o.influence?.valueDriftRule);
    if (op?.influence) return op.influence;
  }
  return undefined;
}

/**
 * The word for the pole a signed drift on `pair` pushes toward — the pair id's
 * own halves (`mercy_ruthlessness` → `mercy` / `ruthlessness`), positive first,
 * matching `ARCHETYPE_NAMES` ordering. Every `ValuePair` is two single words.
 */
export function valuePoleWord(pair: ValuePair, drift: number): string {
  const [positive, negative] = pair.split('_');
  return drift >= 0 ? positive : (negative ?? positive);
}

/** One live divine influence on a mortal, as the debug bridge reports it (THR-1651). */
export interface ActiveInfluenceReading {
  readonly id: string;
  readonly interventionType: string;
  readonly sphere: string;
  readonly tickApplied: number;
  readonly valueDrifts: Readonly<Record<string, number>>;
  /** Live decay strength in (0, initialStrength] — what the overlay multiplies drifts by. */
  readonly strength: number;
  readonly ticksRemaining: number;
  /** Time left as the player reads it (`durationLabel`), never ticks (Law 13). */
  readonly durationLabel: string;
}

/**
 * The target's `divineInfluences` that are still live at `tick` — the same
 * strength test `buildValueOverlay` applies, so this lists exactly what is still
 * steering the mortal. Fail-soft: an unknown node reads as none.
 */
export function describeActiveInfluences(
  graph: WorldGraph,
  targetId: string,
  tick: number,
): ActiveInfluenceReading[] {
  const entries = (graph.getNode(targetId)?.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];
  const out: ActiveInfluenceReading[] = [];
  for (const e of entries) {
    const strength = getCurrentStrength({
      initialStrength: e.initialStrength,
      decayRate: e.decayRate,
      minimumStrength: e.minimumStrength,
      maxDuration: e.maxDuration,
      tickApplied: e.tickApplied,
    }, tick);
    if (strength <= 0) continue;
    const ticksRemaining = Math.max(0, e.tickApplied + e.maxDuration - tick);
    out.push({
      id: e.id,
      interventionType: e.interventionType,
      sphere: e.sphere,
      tickApplied: e.tickApplied,
      valueDrifts: { ...(e.valueDrifts ?? {}) },
      strength,
      ticksRemaining,
      durationLabel: durationLabel(ticksRemaining),
    });
  }
  return out;
}
