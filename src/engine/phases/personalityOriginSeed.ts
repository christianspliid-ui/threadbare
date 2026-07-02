/**
 * Phase: personality_origin_seed (THR-561).
 *
 * The "who they were born as" layer of the personality stack — the origin-vignette
 * consumer the content library (`data/origin-vignettes.ts`, THR-539) was authored for.
 * Each tick, any mortal individual not yet origin-seeded has a handful of pre-history
 * vignettes drawn deterministically and their signed contributions laid onto the
 * reach-axis **baseline** (`AxiologicalProfile`), together with any `axisContributions`
 * carried by the agent's permanent traits. The drawn vignette ids are recorded on
 * `node.properties.originVignettes` for the character sheet (THR wave-2 #8) and prose.
 *
 * The seeded baseline is exactly what the emergence phase (`personalityTraitEmerge`,
 * THR-527) reads as `profile[valuePair]`; this phase is registered `beforePhase` it so
 * a newly-seeded baseline is visible the same tick it is drawn.
 *
 * ─── Additive, not destructive (NFP #6) ─────────────────────────
 * Vignettes are laid *onto* the generated baseline, never replacing it — mirroring the
 * Core layer's "authored character over the generated spread" principle
 * (`core/coreMechanics.ts`). An agent with no matching vignettes keeps its generated
 * baseline unchanged (the "born neutral" fail-soft, expressed against the generated
 * baseline rather than a hard reset).
 *
 * ─── Determinism (NFP #3) ────────────────────────────────────────
 * Seeding uses a per-agent `mulberry32(hash(worldSeed, agentId))` so the same world
 * seed reproduces the same baseline regardless of *when* the agent is first seen
 * (worldgen agents at tick 1, born-later agents at their first tick). No `Math.random`.
 *
 * ─── Tracing (NFP #2) ────────────────────────────────────────────
 * ONE aggregate `personality_origin_seeded` trace per tick carrying the count — never
 * one-per-agent. The bulk tick-1 seeding touches every mortal at once (~hundreds); a
 * per-agent trace there would flood the 2000-entry trace ring buffer and evict
 * unrelated traces (the buffer-overflow flakiness class — see `Docs/impediments.md`).
 * Per-agent provenance stays inspectable on `node.properties.originVignettes`.
 *
 * ─── Fail-soft (NFP #4) ──────────────────────────────────────────
 * | Failure case                       | Fallback                                  |
 * |------------------------------------|-------------------------------------------|
 * | Agent already origin-seeded         | Skip (idempotent)                        |
 * | Empty vignette pool                 | Mark seeded, baseline unchanged           |
 * | Axis id not in the registry         | Skip that contribution, count unknown_axis|
 * | The ascendant (player)              | Skipped — personality is a mortal layer   |
 * | Any throw                           | Caught per-agent; tick loop never breaks  |
 */
import type { GameState } from '../../types/gameState';
import type { EnginePhase } from '../phaseRegistry';
import type { WorldGraph } from '../graph';
import type { AxiologicalProfile } from '../../types/agent';
import type { TraitDefinitionProperties, TraitAssignmentProperties } from '../../types/traits';
import { getTraitsForNode } from '../traits';
import { computeOriginBaseline, type AxisContributionMap } from '../personality/originBaseline';
import { emitTrace } from '../traceBuffer';
import type { PersonalityOriginSeededTrace } from '../../types/trace';

// ─── Per-agent seeded PRNG (mirrors corePersonality) ───────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of an agent id, mixed with the world seed. */
function agentSeed(worldSeed: number, agentId: string): number {
  let h = worldSeed | 0;
  for (let i = 0; i < agentId.length; i++) {
    h = Math.imul(h ^ agentId.charCodeAt(i), 0x01000193);
  }
  return h | 0;
}

// ─── Trait contribution collection ─────────────────────────────────

/**
 * Collect the `axisContributions` maps from an agent's **permanent** traits (those
 * whose assignment is not a finite countdown). At birth this is typically empty;
 * permanent formative-mark traits (a later slice) slot in here without re-plumbing.
 */
function permanentTraitContributions(graph: WorldGraph, actorId: string): AxisContributionMap[] {
  const out: AxisContributionMap[] = [];
  for (const edge of getTraitsForNode(graph, actorId)) {
    const assignment = edge.properties as unknown as TraitAssignmentProperties;
    // Temporary assignments (a finite tick countdown) are not part of the standing
    // baseline; null/undefined ticksRemaining = permanent.
    if (typeof assignment.ticksRemaining === 'number') continue;
    const def = graph.getNode(edge.target)?.properties as unknown as TraitDefinitionProperties | undefined;
    const contrib = def?.axisContributions;
    if (contrib && Object.keys(contrib).length > 0) out.push(contrib);
  }
  return out;
}

// ─── Result + processing ───────────────────────────────────────────

export interface OriginSeedResult {
  /** Agents seeded this tick. */
  seeded: number;
  /** Total origin vignettes applied across all agents seeded this tick. */
  vignettesApplied: number;
  /** Contributions skipped for referencing an axis id absent from the registry. */
  unknownAxes: number;
}

/**
 * Walk every mortal individual: for each not yet origin-seeded, draw origin vignettes
 * and lay their contributions (plus permanent-trait `axisContributions`) onto the
 * reach-axis baseline. Mutates the graph in place (`axiologicalProfile`,
 * `originVignettes`, `originVignettesSeeded` node properties); returns counters.
 */
export function processPersonalityOriginSeed(state: GameState): OriginSeedResult {
  const graph = state.graph;
  const tick = state.tick;
  const result: OriginSeedResult = { seeded: 0, vignettesApplied: 0, unknownAxes: 0 };

  const actors = graph
    .getNodesByType('actor')
    .filter((n) => n.properties?.actorType === 'individual' && n.properties?.deceased !== true);
  if (actors.length === 0) return result;

  for (const actor of actors) {
    if (actor.id === state.ascendantId) continue; // personality is a mortal layer.

    try {
      const props = actor.properties as Record<string, unknown>;
      if (props.originVignettesSeeded === true) continue; // idempotent.

      const existing = (props.axiologicalProfile as AxiologicalProfile | undefined) ?? ({} as AxiologicalProfile);
      const traitContribs = permanentTraitContributions(graph, actor.id);

      const computed = computeOriginBaseline(
        mulberry32(agentSeed(state.seed, actor.id)),
        existing,
        traitContribs,
      );

      props.axiologicalProfile = { ...existing, ...computed.profileUpdates } as AxiologicalProfile;
      if (computed.vignetteIds.length > 0) props.originVignettes = computed.vignetteIds;
      props.originVignettesSeeded = true;

      result.seeded++;
      result.vignettesApplied += computed.vignettesApplied;
      result.unknownAxes += computed.unknownAxes;
    } catch {
      // fail-soft — never break the tick loop on one agent's origin seeding.
    }
  }

  // One aggregate seeded trace per tick (keeps the bulk tick-1 burst off the ring buffer).
  if (result.seeded > 0) {
    trace(tick, 'seeded', `Origin baselines drawn for ${result.seeded} agent(s)`, {
      count: result.seeded,
      vignettesApplied: result.vignettesApplied,
    });
  }
  if (result.unknownAxes > 0) {
    trace(tick, 'unknown_axis', `${result.unknownAxes} origin contribution(s) skipped: unknown axis`, {
      count: result.unknownAxes,
    });
  }

  return result;
}

function trace(tick: number, kind: string, summary: string, details: Record<string, unknown>): void {
  const entry: Omit<PersonalityOriginSeededTrace, 'id' | 'timestamp'> = {
    category: 'personality_origin_seeded',
    tick,
    actorId: 'personality_origin_seed',
    summary,
    details: { kind, ...details },
  };
  emitTrace(entry);
}

// ─── Phase descriptor ──────────────────────────────────────────────

export const personalityOriginSeedPhase: EnginePhase = {
  id: 'personality_origin_seed',
  slot: 'post-economy',
  // Seed the baseline before the emergence phase reads it, so a freshly-seeded agent's
  // "who they were born as" is visible the same tick it is drawn.
  beforePhase: ['personality_trait_emerge'],
  label: 'Personality Origin Seeding',
  run: (state) => {
    processPersonalityOriginSeed(state);
    return {};
  },
};
