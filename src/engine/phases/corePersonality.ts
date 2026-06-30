/**
 * Phase: core_personality (THR-542, slice 1 — Engine foundation).
 *
 * The Core is the foundation personality layer beneath the 8 reach moral axes:
 * five plain virtue↔vice continuums of *who an agent fundamentally is*
 * (`coreRegistry.ts`). This phase owns the runtime lifecycle of that layer:
 *
 *  1. **Seed** — any mortal individual without a `coreProfile` gets one drawn
 *     deterministically from `hash(worldSeed, agentId)`, so the same world seed
 *     reproduces the same Core regardless of *when* the agent is first seen
 *     (worldgen agents at tick 1, born-later agents at their first tick). The
 *     draw is the central-limit PRNG baseline with authored Core origin-vignettes
 *     laid on top (THR-544, `seedCoreProfileWithVignettes`); the applied vignette
 *     ids are recorded on `node.properties.coreOriginVignettes`. Emits ONE
 *     aggregate `core_personality` / `seeded` trace per tick carrying the count —
 *     never one-per-agent. The bulk tick-1 seeding touches every mortal at once
 *     (~hundreds); a per-agent trace there would flood the 2000-entry trace ring
 *     buffer and evict unrelated traces (the buffer-overflow flakiness class —
 *     see `Docs/impediments.md`). Per-agent `coreProfile` stays inspectable on
 *     the node itself.
 *  2. **Emergence** — per continuum, tracks a hysteresis held-state on
 *     `node.properties.coreEmergent`, grants/releases the matching Core emergent
 *     *trait* node (THR-544, `core-trait-content.ts`), and emits `emerge` / `fade`
 *     traces on crossings. Born-extreme agents get their Core trait granted
 *     silently at the seeding tick (a graph edge, not a trace — no tick-1 burst).
 *  3. **Bend** — for agents whose normalized Quintessence is below the bend
 *     threshold, emits `bend` traces showing the Core's directional nudge on
 *     coupled reach axes. (Applying the nudge to reach drift is the consuming
 *     slice; the foundation provides the mechanic + inspectable trace.)
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────
 * Seeding uses a per-agent `mulberry32(hash(seed, id))`. No `Math.random`.
 *
 * ─── Tracing (NFP #2) ───────────────────────────────────────────
 * All events emit the single `core_personality` category, discriminated by
 * `details.kind` (seeded | emerge | fade | bend).
 *
 * ─── Fail-soft (NFP #4) ─────────────────────────────────────────
 * | Failure case                       | Fallback                               |
 * |------------------------------------|----------------------------------------|
 * | Agent already has a coreProfile     | Skip seeding (idempotent)             |
 * | Agent missing quintessence/Max      | Skip bend for that agent (no nudge)    |
 * | quintessenceMax <= 0                | Skip bend (avoid divide-by-zero)       |
 * | The ascendant (player)              | Skipped — Core is a mortal layer       |
 * | Any throw                           | Caught per-agent; tick loop never breaks|
 */
import type { GameState } from '../../types/gameState';
import type { EnginePhase } from '../phaseRegistry';
import type { WorldGraph } from '../graph';
import type { CoreProfile } from '../../types/coreRegistry';
import { CORE_CONTINUA } from '../../types/coreRegistry';
import { seedCoreProfileWithVignettes, coreBendContributions, coreValue } from '../core/coreMechanics';
import {
  CORE_EMERGENCE_VIRTUE_THRESHOLD,
  CORE_EMERGENCE_VICE_THRESHOLD,
  CORE_EMERGENCE_VIRTUE_RELEASE,
  CORE_EMERGENCE_VICE_RELEASE,
  CORE_BEND_QUINTESSENCE_THRESHOLD,
} from '../core/coreConstants';
import { CORE_TRAIT_DEFINITIONS, CORE_TRAIT_BY_CONTINUUM } from '../../data/core-trait-content';
import { assignTrait, removeTrait } from '../traits';
import { emitTrace } from '../traceBuffer';
import type { CorePersonalityTrace } from '../../types/trace';

// ─── Per-agent seeded PRNG ─────────────────────────────────────────

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

// ─── Trace helper ──────────────────────────────────────────────────

function trace(tick: number, actorId: string, kind: string, summary: string, details: Record<string, unknown>): void {
  const entry: Omit<CorePersonalityTrace, 'id' | 'timestamp'> = {
    category: 'core_personality',
    tick,
    actorId,
    summary,
    details: { kind, ...details },
  };
  emitTrace(entry);
}

// ─── Core trait nodes (graph-aware, no module singleton) ───────────

/**
 * Ensure the Core emergent-trait definition nodes exist in this graph. Graph-aware
 * (no module singleton) so trait nodes don't leak across test sessions — mirrors
 * `personalityTraitEmerge.ensurePersonalityTraitNodes`.
 */
function ensureCoreTraitNodes(graph: WorldGraph): void {
  const first = CORE_TRAIT_DEFINITIONS[0];
  if (!first) return;
  if (graph.getNode(first.id)) return;
  for (const node of CORE_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) graph.addNode(node);
  }
}

/**
 * Grant the Core trait node matching a held-set key (`continuumId:side`).
 * Silent (no trace) — the phase already owns the emerge/fade/aggregate traces;
 * the trait edge is the durable, inspectable record. Fail-soft: a missing def or
 * a throw is swallowed so the tick loop never breaks.
 */
function grantCoreTrait(graph: WorldGraph, actorId: string, key: string, tick: number): void {
  const traitId = coreTraitIdForKey(key);
  if (!traitId || !graph.getNode(traitId)) return;
  try {
    assignTrait(graph, actorId, traitId, { tick, source: `core:${key}` });
  } catch {
    // fail-soft
  }
}

/** Remove the Core trait node matching a held-set key. Fail-soft. */
function releaseCoreTrait(graph: WorldGraph, actorId: string, key: string): void {
  const traitId = coreTraitIdForKey(key);
  if (!traitId) return;
  try {
    removeTrait(graph, actorId, traitId);
  } catch {
    // fail-soft
  }
}

/** Map a held-set key (`<continuumId>:virtue|vice`) to its Core trait id. */
function coreTraitIdForKey(key: string): string | undefined {
  const sep = key.lastIndexOf(':');
  if (sep < 0) return undefined;
  const continuumId = key.slice(0, sep);
  const side = key.slice(sep + 1);
  const ids = CORE_TRAIT_BY_CONTINUUM[continuumId];
  if (!ids) return undefined;
  return side === 'virtue' ? ids.virtue : side === 'vice' ? ids.vice : undefined;
}

// ─── Core processing ───────────────────────────────────────────────

export interface CorePersonalityResult {
  seeded: number;
  emerged: number;
  faded: number;
  bent: number;
  /** Authored Core origin-vignettes applied across all agents seeded this tick. */
  vignettesApplied: number;
}

/**
 * Walk every mortal agent: seed missing Core baselines, track emergence
 * hysteresis, and emit bend traces under low Quintessence. Mutates the graph in
 * place (`coreProfile`, `coreEmergent` node properties); returns counters for
 * inspectability.
 */
export function processCorePersonality(state: GameState): CorePersonalityResult {
  const graph = state.graph;
  const tick = state.tick;
  const result: CorePersonalityResult = { seeded: 0, emerged: 0, faded: 0, bent: 0, vignettesApplied: 0 };

  const actors = graph
    .getNodesByType('actor')
    .filter((n) => n.properties?.actorType === 'individual' && n.properties?.deceased !== true);
  if (actors.length === 0) return result;

  // Core emergent-trait defs must exist before any grant fires (born-extreme or
  // later transition). Graph-aware so they don't leak across test sessions.
  ensureCoreTraitNodes(graph);

  for (const actor of actors) {
    if (actor.id === state.ascendantId) continue; // Core is a mortal layer.

    try {
      const props = actor.properties as Record<string, unknown>;
      const actorName = (actor.name as string | undefined) ?? actor.id;

      // ── 1. Seed (idempotent) ──
      // No per-agent trace here — the bulk tick-1 seeding would emit hundreds at
      // once and wrap the trace ring buffer (buffer-overflow flakiness class).
      // One aggregate `seeded` trace is emitted after the loop instead.
      let core = props.coreProfile as CoreProfile | undefined;
      let justSeeded = false;
      if (!core) {
        const seeded = seedCoreProfileWithVignettes(mulberry32(agentSeed(state.seed, actor.id)));
        core = seeded.profile;
        props.coreProfile = core;
        // Record the authored vignettes that shaped this Core, for inspectability
        // and downstream prose (the pre-history that seeded the character).
        if (seeded.vignetteIds.length > 0) props.coreOriginVignettes = seeded.vignetteIds;
        result.seeded++;
        result.vignettesApplied += seeded.vignetteIds.length;
        justSeeded = true;
      }

      // ── 2. Emergence hysteresis ──
      // On the seeding tick, *initialize* the held set from the born position
      // silently: an agent born at an extreme isn't "becoming" anything, and
      // emitting a per-agent emerge trace for every born-extreme agent would
      // re-introduce a tick-1 trace burst. Only genuine later transitions (from
      // drift/marks in subsequent slices) emit emerge/fade traces.
      if (justSeeded) {
        const born: string[] = [];
        for (const continuum of CORE_CONTINUA) {
          const pos = coreValue(core, continuum.continuumId);
          if (pos >= CORE_EMERGENCE_VIRTUE_THRESHOLD) born.push(`${continuum.continuumId}:virtue`);
          else if (pos <= CORE_EMERGENCE_VICE_THRESHOLD) born.push(`${continuum.continuumId}:vice`);
        }
        if (born.length > 0) {
          props.coreEmergent = born;
          // Grant the matching Core trait nodes silently — a born-extreme agent
          // *has* the trait from birth (it isn't "becoming" anything), and trait
          // edges are graph mutations, not traces, so no tick-1 burst risk.
          for (const key of born) grantCoreTrait(graph, actor.id, key, tick);
        }
        // Skip bend on the seeding tick too — first transition window opens next tick.
        continue;
      }

      const held = new Set<string>(
        Array.isArray(props.coreEmergent) ? (props.coreEmergent as string[]) : [],
      );
      let heldChanged = false;
      for (const continuum of CORE_CONTINUA) {
        const pos = coreValue(core, continuum.continuumId);
        const virtueKey = `${continuum.continuumId}:virtue`;
        const viceKey = `${continuum.continuumId}:vice`;

        // Virtue pole
        if (pos >= CORE_EMERGENCE_VIRTUE_THRESHOLD && !held.has(virtueKey)) {
          held.add(virtueKey); heldChanged = true; result.emerged++;
          grantCoreTrait(graph, actor.id, virtueKey, tick);
          trace(tick, actor.id, 'emerge', `${actorName} is becoming ${continuum.virtue.word}`,
            { continuumId: continuum.continuumId, side: 'virtue', word: continuum.virtue.word, position: pos });
        } else if (held.has(virtueKey) && pos < CORE_EMERGENCE_VIRTUE_RELEASE) {
          held.delete(virtueKey); heldChanged = true; result.faded++;
          releaseCoreTrait(graph, actor.id, virtueKey);
          trace(tick, actor.id, 'fade', `${actorName} is no longer ${continuum.virtue.word}`,
            { continuumId: continuum.continuumId, side: 'virtue', word: continuum.virtue.word, position: pos });
        }

        // Vice pole
        if (pos <= CORE_EMERGENCE_VICE_THRESHOLD && !held.has(viceKey)) {
          held.add(viceKey); heldChanged = true; result.emerged++;
          grantCoreTrait(graph, actor.id, viceKey, tick);
          trace(tick, actor.id, 'emerge', `${actorName} is becoming ${continuum.vice.word}`,
            { continuumId: continuum.continuumId, side: 'vice', word: continuum.vice.word, position: pos });
        } else if (held.has(viceKey) && pos > CORE_EMERGENCE_VICE_RELEASE) {
          held.delete(viceKey); heldChanged = true; result.faded++;
          releaseCoreTrait(graph, actor.id, viceKey);
          trace(tick, actor.id, 'fade', `${actorName} is no longer ${continuum.vice.word}`,
            { continuumId: continuum.continuumId, side: 'vice', word: continuum.vice.word, position: pos });
        }
      }
      if (heldChanged) props.coreEmergent = [...held];

      // ── 3. Bend (under low Quintessence) ──
      const quintessence = props.quintessence as number | undefined;
      const quintessenceMax = props.quintessenceMax as number | undefined;
      if (typeof quintessence === 'number' && typeof quintessenceMax === 'number' && quintessenceMax > 0) {
        const quintessenceNorm = quintessence / quintessenceMax;
        if (quintessenceNorm < CORE_BEND_QUINTESSENCE_THRESHOLD) {
          for (const c of coreBendContributions(core, quintessenceNorm)) {
            result.bent++;
            trace(tick, actor.id, 'bend',
              `${actorName} bends ${c.reach} by ${c.nudge.toFixed(3)} (${c.continuumId})`,
              { reach: c.reach, continuumId: c.continuumId, nudge: c.nudge, quintessenceNorm });
          }
        }
      }
    } catch {
      // fail-soft — never break the tick loop on one agent's Core processing.
    }
  }

  // One aggregate seeded trace per tick (keeps the burst off the ring buffer).
  if (result.seeded > 0) {
    trace(tick, 'core_personality', 'seeded', `Core baselines drawn for ${result.seeded} agent(s)`, {
      count: result.seeded,
      vignettesApplied: result.vignettesApplied,
    });
  }

  return result;
}

// ─── Phase descriptor ──────────────────────────────────────────────

export const corePersonalityPhase: EnginePhase = {
  id: 'core_personality',
  slot: 'post-economy',
  label: 'Core Personality',
  run: (state) => {
    processCorePersonality(state);
    return {};
  },
};
