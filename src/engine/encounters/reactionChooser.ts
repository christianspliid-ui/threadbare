/**
 * Autonomous in-encounter reaction chooser (THR-530).
 *
 * The one genuinely new subsystem of the Agent Personality & Moral Drift project:
 * a **deterministic, profile-aligned chooser** that replaces the `reactions[0]`
 * default for non-player, non-threaded agents. Given an agent's live moral axes
 * and a list of authored aftermath reactions, it ranks the reactions by how well
 * each option's inferred reach-pole agrees with the agent's standing, and picks
 * the best match ("strong & legible" → near-argmax with a deterministic
 * lowest-index tie-break). When no reaction carries a discernible moral signal —
 * or the agent has no profile / is morally neutral — it reports `aligned: false`
 * so the caller falls back to the authored `reactions[0]` (today's behavior).
 *
 * ─── Why infer the pole from effects (verify-the-noun) ──────────────────────────
 * `EncounterAftermathReaction` carries no explicit moral-axis field (unlike the
 * player-facing `AuthoredChoiceCard`, which got `moralAxis`/`pole`/`magnitude` in
 * THR-528). So the lean is inferred from the canonical reach-polarity signals
 * already present in authored effects:
 *   • `reputation_tally` with a valid `${reach}.positive` / `${reach}.negative`
 *     key → ±1 vote on that reach's axis (virtue / vice).
 *   • actor-self `reputation_score` delta → sign(delta) vote on the encounter's
 *     primary reach (a reaction the actor is well/ill-regarded for leans
 *     virtue/vice on the reach they acted in).
 * Off-axis tally keys (e.g. `cg.watch_work`) and faction/other-agent–targeted
 * effects carry no personal moral signal and are ignored. Reactions whose effects
 * are all signal-free score 0 and the chooser fails soft to `reactions[0]`.
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────────────────
 * Pure arithmetic over stored numbers. Argmax with a lowest-array-index tie-break.
 * No PRNG, no clock, no Math.random.
 *
 * ─── Tunability (NFP #1) ────────────────────────────────────────────────────────
 * `PERSONALITY_REACTION_WEIGHT` scales every option's score (kill-criteria lever).
 */
import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';
import type { EncounterAftermathReaction } from '../../types/unifiedAction';
import type { ArchetypeDrift } from '../../types/gameState';
import type { AxiologicalProfile } from '../../types/agent';
import type { WorldGraph } from '../graph';
import { CANONICAL_AXES, reachToAxisId } from '../../types/axisRegistry';
import { driftDeltaFor, liveAxisPosition } from './driftAccumulator';

/** Strictly-positive alignment below this magnitude counts as "no signal" (float-noise floor). */
const SIGNAL_EPSILON = 1e-9;

const REACH_SET: ReadonlySet<string> = new Set(REACH_DOMAINS);

/** Agent live moral position per reach, on the legacy ±1 scale (virtue +1, vice −1, 0 neutral). */
export type AxisLeans = Partial<Record<ReachDomain, number>>;

/** A reaction's inferred signed lean per reach (positive = virtue pole, negative = vice pole). */
export type ReactionLean = Partial<Record<ReachDomain, number>>;

/** The dominant axis a chosen reaction tilts toward — drives optional drift application. */
export interface ReactionDominant {
  readonly reach: ReachDomain;
  readonly pole: 'virtue' | 'vice';
}

export interface ReactionChoice {
  /** Index into the input `reactions` array of the selected reaction. */
  readonly chosenIndex: number;
  readonly reaction: EncounterAftermathReaction;
  /**
   * True when the chooser actively preferred a reaction by profile alignment
   * (a strictly-positive best score). False means "no moral signal / neutral
   * agent" — the caller should treat this as the authored `reactions[0]` default.
   */
  readonly aligned: boolean;
  /** Per-option alignment scores, parallel to the input `reactions` array. For the trace (NFP #2). */
  readonly scores: readonly number[];
  /** Dominant axis of the chosen reaction, or null when the chosen reaction has no inferable lean. */
  readonly dominant: ReactionDominant | null;
}

/**
 * Read an agent's live moral position on each canonical axis: their standing
 * `AxiologicalProfile` value (baseline) plus current temporary drift, clamped to
 * the ±1 scale. Returns null when the agent has no profile (fail-soft: treated as
 * "no personality" → no alignment → caller uses `reactions[0]`).
 */
export function computeAxisLeans(
  graph: WorldGraph,
  archetypeDrift: readonly ArchetypeDrift[],
  agentId: string,
): AxisLeans | null {
  const node = graph.getNode(agentId);
  const profile = node?.properties?.axiologicalProfile as AxiologicalProfile | undefined;
  if (!profile) return null;

  const leans: AxisLeans = {};
  let any = false;
  for (const axis of CANONICAL_AXES) {
    const baseline = profile[axis.valuePair];
    if (typeof baseline !== 'number') continue;
    const delta = driftDeltaFor(archetypeDrift as ArchetypeDrift[], agentId, reachToAxisId(axis.reachDomain));
    leans[axis.reachDomain] = liveAxisPosition(baseline, delta);
    any = true;
  }
  return any ? leans : null;
}

/** Parse a `${reach}.positive` / `${reach}.negative` tally key into a reach + signed direction, or null. */
function parseReachPolarityKey(key: string): { reach: ReachDomain; sign: number } | null {
  const dot = key.indexOf('.');
  if (dot <= 0) return null;
  const reach = key.slice(0, dot);
  const polarity = key.slice(dot + 1);
  if (!REACH_SET.has(reach)) return null;
  if (polarity === 'positive') return { reach: reach as ReachDomain, sign: 1 };
  if (polarity === 'negative') return { reach: reach as ReachDomain, sign: -1 };
  return null;
}

/**
 * Infer a reaction's signed moral lean per reach from its authored effects.
 * Only personal, actor-self moral signals are counted (see module doc).
 */
export function inferReactionLean(
  reaction: EncounterAftermathReaction,
  primaryReach: ReachDomain | undefined,
): ReactionLean {
  const lean: ReactionLean = {};
  const add = (reach: ReachDomain, vote: number): void => {
    lean[reach] = (lean[reach] ?? 0) + vote;
  };

  for (const effect of reaction.effects) {
    // Faction- or other-agent–targeted effects describe someone else, not the actor's moral lean.
    const e = effect as Partial<{ targetFactionId: string; targetAgentId: string }>;
    if (e.targetFactionId || e.targetAgentId) continue;

    if (effect.kind === 'reputation_tally') {
      const parsed = parseReachPolarityKey(effect.key);
      if (parsed) add(parsed.reach, parsed.sign);
      continue;
    }
    if (effect.kind === 'reputation_score' && primaryReach) {
      if (effect.delta > 0) add(primaryReach, 1);
      else if (effect.delta < 0) add(primaryReach, -1);
      continue;
    }
  }
  return lean;
}

/** Alignment score = Σ_reach reactionLean(reach) · agentLean(reach) · weight. */
export function scoreReaction(lean: ReactionLean, agentLeans: AxisLeans, weight: number): number {
  let score = 0;
  for (const reach of REACH_DOMAINS) {
    const rl = lean[reach];
    const al = agentLeans[reach];
    if (rl === undefined || al === undefined) continue;
    score += rl * al;
  }
  return score * weight;
}

/** The dominant (largest-magnitude) reach of a lean map, as a pole. Null when the map is empty/flat. */
function dominantOf(lean: ReactionLean): ReactionDominant | null {
  let best: ReactionDominant | null = null;
  let bestMag = 0;
  for (const reach of REACH_DOMAINS) {
    const v = lean[reach];
    if (v === undefined || v === 0) continue;
    const mag = Math.abs(v);
    if (mag > bestMag) {
      bestMag = mag;
      best = { reach, pole: v > 0 ? 'virtue' : 'vice' };
    }
  }
  return best;
}

/**
 * Rank authored aftermath reactions by profile alignment and pick the best match.
 *
 * Deterministic: argmax of the per-option score with a lowest-index tie-break.
 * Returns `aligned: false` (and `chosenIndex: 0`) when no option scores strictly
 * positive — i.e. no moral signal or a neutral agent — so the caller falls back
 * to the authored `reactions[0]`.
 */
export function chooseAlignedReaction(
  reactions: readonly EncounterAftermathReaction[],
  agentLeans: AxisLeans,
  primaryReach: ReachDomain | undefined,
  weight: number,
): ReactionChoice {
  // Caller guarantees a non-empty array; guard anyway for fail-soft.
  if (reactions.length === 0) {
    return { chosenIndex: 0, reaction: reactions[0], aligned: false, scores: [], dominant: null };
  }

  const leans = reactions.map((r) => inferReactionLean(r, primaryReach));
  const scores = leans.map((lean) => scoreReaction(lean, agentLeans, weight));

  let bestIndex = 0;
  let bestScore = scores[0];
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestIndex = i; // strict `>` keeps the lowest index on ties (deterministic)
    }
  }

  const aligned = bestScore > SIGNAL_EPSILON;
  const chosenIndex = aligned ? bestIndex : 0;
  return {
    chosenIndex,
    reaction: reactions[chosenIndex],
    aligned,
    scores,
    dominant: aligned ? dominantOf(leans[chosenIndex]) : null,
  };
}
