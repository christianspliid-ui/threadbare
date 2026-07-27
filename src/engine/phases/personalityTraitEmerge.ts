/**
 * Phase: personality_trait_emerge (THR-527).
 *
 * The "who they currently are" layer of the personality stack. Each tick, for
 * every mortal agent and every canonical moral axis, reads the agent's live axis
 * position and grants/releases the matching emergent personality trait at the
 * hysteresis thresholds. Crystallization fires a "becoming" beat
 * ("Kael has become Greedy.").
 *
 * ─── Live position (verify-the-noun) ───────────────────────────
 * Reads the **unified live position** = clamp(baseline + drift) per axis (THR-559),
 * the single canonical formula shared with the reaction chooser — not the baseline
 * alone. Baseline lives on the `AxiologicalProfile` (`node.properties`) on the
 * signed ±1 scale (virtue +1, vice −1); temporary drift lives in
 * `state.archetypeDrift`, keyed by the canonical axis id. The signed live value is
 * converted to the canonical 0–1 axis scale (0.5 neutral) via the registry's
 * `signedToCanonical01`, and the thresholds are expressed there — so this phase is
 * scale-stable if internal storage ever migrates.
 *
 * ─── Constants (NFP #1) ─────────────────────────────────────────
 * Imported from `personality-trait-content.ts`.
 *
 * ─── Tracing (NFP #2) ───────────────────────────────────────────
 * Emits `personality_trait_emerged` traces on both grant and release.
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────
 * Pure threshold checks — no PRNG.
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────
 * | Failure case                       | Fallback                              |
 * |------------------------------------|---------------------------------------|
 * | Agent missing axiologicalProfile   | Skip agent (no axes processed)        |
 * | Axis has no trait ids registered   | Skip that axis                        |
 * | Trait def node missing for a grant | Skip grant, emit warning trace        |
 * | The ascendant (player)             | Skipped — personality is a mortal layer|
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { EnginePhase } from '../phaseRegistry';
import type { WorldGraph } from '../graph';
import type { AxiologicalProfile } from '../../types/agent';
import { CANONICAL_AXES, reachToAxisId, signedToCanonical01 } from '../../types/axisRegistry';
import { driftDeltaFor, liveAxisPosition } from '../encounters/driftAccumulator';
import { assignTrait, removeTrait, getTraitsForNode } from '../traits';
import { emitTrace } from '../traceBuffer';
import type { PersonalityTraitEmergedTrace } from '../../types/trace';
import {
  PERSONALITY_TRAIT_DEFINITIONS,
  PERSONALITY_TRAIT_BY_AXIS,
  PERSONALITY_TRAIT_VIRTUE_THRESHOLD,
  PERSONALITY_TRAIT_VICE_THRESHOLD,
  PERSONALITY_TRAIT_VIRTUE_RELEASE,
  PERSONALITY_TRAIT_VICE_RELEASE,
} from '../../data/personality-trait-content';

// ─── Trait Node Initialization ─────────────────────────────────────

/**
 * Ensure the personality trait definition nodes exist in this graph. Graph-aware
 * (no module singleton) so trait nodes don't leak across test sessions — mirrors
 * `phaseEncounterTraits.ensureTraitNodes`.
 */
function ensurePersonalityTraitNodes(graph: WorldGraph): void {
  // Per-node check, not a first-node short-circuit (THR-809) — the old
  // `getNode(first.id)` early return permanently skipped the rest if any
  // foreign path minted that one id first.
  for (const node of PERSONALITY_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) graph.addNode(node);
  }
}

// ─── Core processing ───────────────────────────────────────────────

export interface PersonalityEmergenceResult {
  events: TickEvent[];
  granted: number;
  released: number;
}

/**
 * Walk every mortal agent × canonical axis; grant/release emergent personality
 * traits at the hysteresis thresholds. Mutates the graph in place (trait edges);
 * returns the "becoming" tick events plus counters for inspectability.
 */
export function processPersonalityTraitEmergence(state: GameState): PersonalityEmergenceResult {
  const graph = state.graph;
  const tick = state.tick;
  const drift = state.archetypeDrift ?? []; // fail-soft: no drift array → baseline-only live position
  const events: TickEvent[] = [];
  let granted = 0;
  let released = 0;

  // Personality is a mortal-agent layer: individual actors only (no factions,
  // armies, or other collective 'actor' nodes), excluding the deceased.
  const actors = graph.getNodesByType('actor').filter(
    (n) => n.properties?.actorType === 'individual' && n.properties?.deceased !== true,
  );
  if (actors.length === 0) return { events, granted, released };

  ensurePersonalityTraitNodes(graph);

  for (const actor of actors) {
    // The player-god is excluded even though it is an individual actor.
    if (actor.id === state.ascendantId) continue;

    const profile = actor.properties?.axiologicalProfile as AxiologicalProfile | undefined;
    if (!profile) continue;

    // One edge read per agent; membership checked via a Set across all axes.
    const heldTraitIds = new Set(getTraitsForNode(graph, actor.id).map((e) => e.target));
    const actorName = (actor.name as string | undefined) ?? actor.id;

    for (const axis of CANONICAL_AXES) {
      const ids = PERSONALITY_TRAIT_BY_AXIS[axis.axisId];
      if (!ids) continue;

      // Unified live position = clamp(baseline + drift), converted to canonical
      // 0–1 (THR-559). Baseline from the profile; drift keyed by canonical axis id.
      const baseline = profile[axis.valuePair] ?? 0;
      const signed = liveAxisPosition(baseline, driftDeltaFor(drift, actor.id, reachToAxisId(axis.reachDomain)));
      const pos = signedToCanonical01(signed);

      const hasVirtue = heldTraitIds.has(ids.virtue);
      const hasVice = heldTraitIds.has(ids.vice);

      // ── Virtue pole ──
      if (pos >= PERSONALITY_TRAIT_VIRTUE_THRESHOLD && !hasVirtue) {
        if (grant(graph, actor.id, ids.virtue, `personality:${axis.axisId}:virtue`, tick)) {
          heldTraitIds.add(ids.virtue);
          granted++;
          events.push(
            becomingEvent(tick, actor.id, actorName, axis.axisId, axis.virtue.word, 'virtue'),
          );
          trace(tick, actor.id, actorName, axis.axisId, axis.virtue.word, 'grant', pos, signed, ids.virtue);
        }
      } else if (hasVirtue && pos < PERSONALITY_TRAIT_VIRTUE_RELEASE) {
        removeTrait(graph, actor.id, ids.virtue);
        heldTraitIds.delete(ids.virtue);
        released++;
        trace(tick, actor.id, actorName, axis.axisId, axis.virtue.word, 'release', pos, signed, ids.virtue);
      }

      // ── Vice pole ──
      if (pos <= PERSONALITY_TRAIT_VICE_THRESHOLD && !hasVice) {
        if (grant(graph, actor.id, ids.vice, `personality:${axis.axisId}:vice`, tick)) {
          heldTraitIds.add(ids.vice);
          granted++;
          events.push(
            becomingEvent(tick, actor.id, actorName, axis.axisId, axis.vice.word, 'vice'),
          );
          trace(tick, actor.id, actorName, axis.axisId, axis.vice.word, 'grant', pos, signed, ids.vice);
        }
      } else if (hasVice && pos > PERSONALITY_TRAIT_VICE_RELEASE) {
        removeTrait(graph, actor.id, ids.vice);
        heldTraitIds.delete(ids.vice);
        released++;
        trace(tick, actor.id, actorName, axis.axisId, axis.vice.word, 'release', pos, signed, ids.vice);
      }
    }
  }

  return { events, granted, released };
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Grant a trait; fail-soft if its definition node is missing. Returns success. */
function grant(
  graph: WorldGraph,
  actorId: string,
  traitId: string,
  source: string,
  tick: number,
): boolean {
  if (!graph.getNode(traitId)) {
    const warn: Omit<PersonalityTraitEmergedTrace, 'id' | 'timestamp'> = {
      category: 'personality_trait_emerged',
      tick,
      actorId,
      summary: `Missing personality trait def: ${traitId} — skipped grant`,
      details: { traitId, reason: 'missing_definition' },
    };
    emitTrace(warn);
    return false;
  }
  try {
    assignTrait(graph, actorId, traitId, { tick, source });
    return true;
  } catch {
    return false; // fail-soft — never break the tick loop
  }
}

function becomingEvent(
  tick: number,
  actorId: string,
  actorName: string,
  axisId: string,
  word: string,
  pole: 'virtue' | 'vice',
): TickEvent {
  return {
    id: `personality_trait_${tick}_${actorId}_${axisId}_${pole}`,
    tick,
    type: 'personality_trait_emerged',
    message: `${actorName} has become ${word}.`,
    significance: 0.5,
    actorId,
    // Surface the "becoming" beat to the player. A toast (not an alert) so distinct
    // becomings on the same tick are not collapsed by the alert icon+tick dedup, and
    // clicking it navigates to the agent (actorId → agent nav target). Routed to the
    // 'lifecycle' category (a character-defining milestone). Without this directive the
    // notification router silently drops the event (notificationRouter.ts).
    notification: { channel: 'toast' },
  };
}

function trace(
  tick: number,
  actorId: string,
  actorName: string,
  axisId: string,
  word: string,
  kind: 'grant' | 'release',
  position: number,
  profileValue: number,
  traitId: string,
): void {
  const entry: Omit<PersonalityTraitEmergedTrace, 'id' | 'timestamp'> = {
    category: 'personality_trait_emerged',
    tick,
    actorId,
    summary:
      kind === 'grant'
        ? `${actorName} became ${word} (${axisId} @ ${position.toFixed(2)})`
        : `${actorName} is no longer ${word} (${axisId} @ ${position.toFixed(2)})`,
    details: { axisId, word, kind, position, profileValue, traitId },
  };
  emitTrace(entry);
}

// ─── Phase descriptor ──────────────────────────────────────────────

export const personalityTraitEmergePhase: EnginePhase = {
  id: 'personality_trait_emerge',
  slot: 'post-economy',
  label: 'Personality Trait Emergence',
  run: (state) => {
    const { events } = processPersonalityTraitEmergence(state);
    if (events.length === 0) return {};
    return { tickEvents: [...state.tickEvents, ...events] };
  },
};
