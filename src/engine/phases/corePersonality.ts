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
 *     (worldgen agents at tick 1, born-later agents at their first tick).
 *     Emits a `core_personality` / `seeded` trace once per agent.
 *  2. **Emergence** — per continuum, tracks a hysteresis held-state on
 *     `node.properties.coreEmergent` and emits `emerge` / `fade` traces on
 *     crossings. (Granting actual Core emergent *traits* is the content slice;
 *     the trait defs do not exist yet, so this slice only records the crossing.)
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
import type { CoreProfile } from '../../types/coreRegistry';
import { CORE_CONTINUA } from '../../types/coreRegistry';
import { seedCoreProfile, coreBendContributions, coreValue } from '../core/coreMechanics';
import {
  CORE_EMERGENCE_VIRTUE_THRESHOLD,
  CORE_EMERGENCE_VICE_THRESHOLD,
  CORE_EMERGENCE_VIRTUE_RELEASE,
  CORE_EMERGENCE_VICE_RELEASE,
  CORE_BEND_QUINTESSENCE_THRESHOLD,
} from '../core/coreConstants';
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

// ─── Core processing ───────────────────────────────────────────────

export interface CorePersonalityResult {
  seeded: number;
  emerged: number;
  faded: number;
  bent: number;
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
  const result: CorePersonalityResult = { seeded: 0, emerged: 0, faded: 0, bent: 0 };

  const actors = graph
    .getNodesByType('actor')
    .filter((n) => n.properties?.actorType === 'individual' && n.properties?.deceased !== true);
  if (actors.length === 0) return result;

  for (const actor of actors) {
    if (actor.id === state.ascendantId) continue; // Core is a mortal layer.

    try {
      const props = actor.properties as Record<string, unknown>;
      const actorName = (actor.name as string | undefined) ?? actor.id;

      // ── 1. Seed (idempotent) ──
      let core = props.coreProfile as CoreProfile | undefined;
      if (!core) {
        core = seedCoreProfile(mulberry32(agentSeed(state.seed, actor.id)));
        props.coreProfile = core;
        result.seeded++;
        trace(tick, actor.id, 'seeded', `${actorName} Core baseline drawn`, { core });
      }

      // ── 2. Emergence hysteresis ──
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
          trace(tick, actor.id, 'emerge', `${actorName} is becoming ${continuum.virtue.word}`,
            { continuumId: continuum.continuumId, side: 'virtue', word: continuum.virtue.word, position: pos });
        } else if (held.has(virtueKey) && pos < CORE_EMERGENCE_VIRTUE_RELEASE) {
          held.delete(virtueKey); heldChanged = true; result.faded++;
          trace(tick, actor.id, 'fade', `${actorName} is no longer ${continuum.virtue.word}`,
            { continuumId: continuum.continuumId, side: 'virtue', word: continuum.virtue.word, position: pos });
        }

        // Vice pole
        if (pos <= CORE_EMERGENCE_VICE_THRESHOLD && !held.has(viceKey)) {
          held.add(viceKey); heldChanged = true; result.emerged++;
          trace(tick, actor.id, 'emerge', `${actorName} is becoming ${continuum.vice.word}`,
            { continuumId: continuum.continuumId, side: 'vice', word: continuum.vice.word, position: pos });
        } else if (held.has(viceKey) && pos > CORE_EMERGENCE_VICE_RELEASE) {
          held.delete(viceKey); heldChanged = true; result.faded++;
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
