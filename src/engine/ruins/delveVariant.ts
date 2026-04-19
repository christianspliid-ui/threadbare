/**
 * Delve encounter variant — PR 4 of the Ruins Layer (THR-152).
 *
 * Three new tick phases:
 *   phaseDelveAdmission   — admits or queues agents with located clues at ruin hexes
 *   phaseDelveProgression — advances each active delve by one beat per tick cadence
 *   phaseDelveEmergence   — resolves the final beat: consequence roll + PR-5 handoff
 *
 * PR-5 reads `pendingEmergenceDecision` to execute ruin transformation.
 * This phase only sets the pending decision and emits the `ruins.delve_success` /
 * `ruins.delve_partial` / `ruins.delve_fail` traces.
 *
 * Fail-soft: all mutations are wrapped in try/catch so a bad delve state never
 * crashes the tick loop.
 */

import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import type { ReachDomain } from '../../types/traits';
import { emitTrace } from '../traceBuffer';
import { computeCapability } from '../domainCapability';
import { gatherNarrativeContext, enrichProse } from '../proseEnrichment';
import { consumeCluesOnConvergence } from './clueLifecycle';
import { resolveDelveProseEntry } from '../../data/ruins-delve-content';
import {
  MAX_SAGA_DELVES_CONCURRENT,
  MAX_MAJOR_DELVES_CONCURRENT,
  MAX_MINOR_DELVES_CONCURRENT,
  DELVE_ADMISSION_RETRY_INTERVAL,
  DELVE_ADMISSION_EXPIRY_TICKS,
  DELVE_BEAT_DURATION_MINOR,
  DELVE_BEAT_DURATION_MAJOR,
  DELVE_BEAT_DURATION_SAGA,
  EMERGENCE_DECISION_TIMEOUT_TICKS,
  DELVE_CONSEQUENCE_CATASTROPHIC_WEIGHT,
  DELVE_CONSEQUENCE_SCARRED_WEIGHT,
  DELVE_CONSEQUENCE_MARKED_WEIGHT,
  DELVE_CONSEQUENCE_TRIUMPHANT_WEIGHT,
  DELVE_CONSEQUENCE_TRANSFORMED_WEIGHT,
  DELVE_ABORT_ESSENCE_REFUND_FRACTION,
  SAGA_MAGNITUDE_THRESHOLD,
  RUIN_MAGNITUDE_MINOR_MAX,
} from './constants';
import type {
  ActiveDelve,
  DelveQueueEntry,
  DelveBeatRecord,
  DelveBeatName,
  DelveBeatOutcome,
  DelveConsequenceRoll,
  DelveScale,
  RuinArchetype,
  PendingEmergenceDecision,
} from './delveTypes';
import { DELVE_BEAT_NAMES, MINOR_BEAT_NAMES } from './delveTypes';
import { transformRuinConsequence, type EmergenceChoice } from './ruinTransformation';
import type { SimulationRuntime } from '../simulationRuntime';

// ── Helpers ───────────────────────────────────────────────────────────────────

function newDelveId(agentId: string, ruinId: string, tick: number): string {
  return `delve_${agentId}_${ruinId}_${tick}`;
}

function scaleFromMagnitude(mag: number): DelveScale {
  if (mag >= SAGA_MAGNITUDE_THRESHOLD) return 'saga';
  if (mag > RUIN_MAGNITUDE_MINOR_MAX) return 'major';
  return 'minor';
}

function totalBeatsForScale(scale: DelveScale): number {
  return scale === 'minor' ? 2 : 5;
}

function beatDurationForScale(scale: DelveScale): number {
  if (scale === 'saga')  return DELVE_BEAT_DURATION_SAGA;
  if (scale === 'major') return DELVE_BEAT_DURATION_MAJOR;
  return DELVE_BEAT_DURATION_MINOR;
}

function beatNameForIndex(scale: DelveScale, index: number): DelveBeatName {
  if (scale === 'minor') return MINOR_BEAT_NAMES[index - 1] ?? 'Egress';
  return DELVE_BEAT_NAMES[index - 1] ?? 'Egress';
}

/**
 * Derive the archetype from a ruin's properties.
 * Falls back to 'vault' if the stored archetype is not one of the three v1 variants.
 */
function archetypeFromRuinProps(props: Record<string, unknown>): RuinArchetype {
  const raw = props.archetype as string | undefined;
  if (raw === 'vault' || raw === 'temple' || raw === 'battlefield') return raw;
  // Derive from sphere if archetype not stored
  const sphere = props.sphereAlignment as string | undefined;
  if (!sphere) return 'vault';
  if (['iron', 'force', 'matter', 'entropy', 'order'].includes(sphere)) return 'battlefield';
  if (['spirit', 'life', 'light', 'chaos'].includes(sphere)) return 'temple';
  return 'vault';
}

/**
 * Map ruin archetype to the primary Reach used for capability checks.
 * Vault  → eye  (knowledge / perception)
 * Temple → veil (spiritual attunement)
 * Battlefield → iron (force / endurance)
 */
function reachForArchetype(archetype: RuinArchetype): ReachDomain {
  switch (archetype) {
    case 'vault':       return 'eye';
    case 'temple':      return 'veil';
    case 'battlefield': return 'iron';
  }
}

/** Resolve the hex position for a location node (handles sublocation parent-lookup). */
function hexOfLocation(
  graph: WorldGraph,
  locationId: string,
): { col: number; row: number } | null {
  const node = graph.getNode(locationId);
  if (!node) return null;
  let col = node.properties.hexCol as number | undefined;
  let row = node.properties.hexRow as number | undefined;
  if (col === undefined && node.properties.parentLocationId) {
    const parent = graph.getNode(node.properties.parentLocationId as string);
    if (parent) {
      col = parent.properties.hexCol as number | undefined;
      row = parent.properties.hexRow as number | undefined;
    }
  }
  return col !== undefined && row !== undefined ? { col, row } : null;
}

/** Resolve the hex an agent occupies. */
function agentHex(graph: WorldGraph, agentId: string): { col: number; row: number } | null {
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locEdges.length === 0) return null;
  return hexOfLocation(graph, locEdges[0].target);
}

/** True when a delve is already active or queued for (agentId, ruinId). */
function delveAlreadyActive(state: GameState, agentId: string, ruinId: string): boolean {
  const active = state.activeDelves ?? [];
  const queued = state.delveAdmissionQueue ?? [];
  return (
    active.some(d => d.agentId === agentId && d.ruinId === ruinId && !d.aborted) ||
    queued.some(q => q.agentId === agentId && q.ruinId === ruinId)
  );
}

// ── Concurrent delve counts ───────────────────────────────────────────────────

function activeDelveCounts(active: ActiveDelve[]): { saga: number; major: number; minor: number } {
  return active.filter(d => !d.aborted).reduce(
    (acc, d) => { acc[d.delveScale]++; return acc; },
    { saga: 0, major: 0, minor: 0 },
  );
}

/** Returns the blocking reason if scale caps prevent admission, otherwise null. */
function admissionBlockedReason(
  scale: DelveScale,
  counts: { saga: number; major: number; minor: number },
): 'saga_active' | 'major_cap' | 'minor_cap' | null {
  if (scale === 'saga') {
    return counts.saga >= MAX_SAGA_DELVES_CONCURRENT ? 'saga_active' : null;
  }
  if (scale === 'major') {
    if (counts.saga > 0) return 'saga_active';
    return counts.major >= MAX_MAJOR_DELVES_CONCURRENT ? 'major_cap' : null;
  }
  // minor
  return counts.minor >= MAX_MINOR_DELVES_CONCURRENT ? 'minor_cap' : null;
}

// ── Beat resolution ───────────────────────────────────────────────────────────

/**
 * Difficulty for a single beat (0–1).
 * Minor: 0.1 + 0.4×mag; major: 0.2 + 0.5×mag; saga: 0.3 + 0.5×mag.
 */
function beatDifficulty(scale: DelveScale, ruinMagnitude: number, beatIndex: number): number {
  const base = scale === 'saga' ? 0.3 : scale === 'major' ? 0.2 : 0.1;
  const slope = scale === 'minor' ? 0.4 : 0.5;
  // Later beats are slightly harder
  const progressMod = (beatIndex - 1) * 0.04;
  return Math.min(0.9, base + slope * ruinMagnitude + progressMod);
}

/** Derive DelveBeatOutcome from roll vs difficulty. */
function resolveBeatOutcome(roll: number, threshold: number): DelveBeatOutcome {
  if (roll >= threshold + 0.1) return 'advanced';
  if (roll >= threshold - 0.1) return 'partial';
  return 'stalled';
}

// ── Consequence roll ──────────────────────────────────────────────────────────

/**
 * Roll the delve consequence based on scale, magnitude, and accumulated partials.
 * More partials → heavier toward scarred/catastrophic.
 * Saga scale → higher Catastrophic and Transformed weights.
 */
export function rollDelveConsequence(
  scale: DelveScale,
  ruinMagnitude: number,
  partialCount: number,
  rng: () => number,
): DelveConsequenceRoll {
  let catW  = DELVE_CONSEQUENCE_CATASTROPHIC_WEIGHT;
  let scarW = DELVE_CONSEQUENCE_SCARRED_WEIGHT;
  let markW = DELVE_CONSEQUENCE_MARKED_WEIGHT;
  let triW  = DELVE_CONSEQUENCE_TRIUMPHANT_WEIGHT;
  let transW = DELVE_CONSEQUENCE_TRANSFORMED_WEIGHT;

  // Partials push weight toward scarred
  const partialPenalty = Math.min(0.15, partialCount * 0.04);
  scarW += partialPenalty;
  triW  -= partialPenalty * 0.5;
  transW -= partialPenalty * 0.5;

  // Saga scale: more extreme outcomes
  if (scale === 'saga') {
    catW   += 0.05 * ruinMagnitude;
    transW += 0.05 * ruinMagnitude;
    markW  -= 0.05 * ruinMagnitude;
    triW   -= 0.05 * ruinMagnitude;
  }

  // Normalize
  const total = catW + scarW + markW + triW + transW;
  const norm = total > 0 ? 1 / total : 1;
  catW *= norm; scarW *= norm; markW *= norm; triW *= norm; transW *= norm;

  const roll = rng();
  let cumulative = 0;
  if ((cumulative += catW)  >= roll) return 'catastrophic';
  if ((cumulative += scarW) >= roll) return 'scarred';
  if ((cumulative += markW) >= roll) return 'marked';
  if ((cumulative += triW)  >= roll) return 'triumphant';
  return 'transformed';
}

// ── Phase: Delve Admission ────────────────────────────────────────────────────

/**
 * Phase 6.656: Delve Admission
 *
 * For every non-ruined agent at an elder_ruin hex who carries a 'located' clue
 * pointing at that ruin (and has no active/queued delve for it), attempt admission.
 * Scale caps → queue with expiry if blocked.
 *
 * Also processes the retry queue: re-attempt admission for queued entries each
 * DELVE_ADMISSION_RETRY_INTERVAL ticks; drop entries past their expiry.
 */
export function phaseDelveAdmission(state: GameState): Partial<GameState> {
  const { graph, tick } = state;
  const active   = [...(state.activeDelves ?? [])];
  const queue    = [...(state.delveAdmissionQueue ?? [])];

  try {
    // ── 1. Process the existing retry queue ──────────────────────────────
    const stillQueued: DelveQueueEntry[] = [];
    const toAttempt: DelveQueueEntry[] = [];

    for (const entry of queue) {
      if (tick >= entry.admissionExpiresTick) {
        emitTrace({
          category: 'ruins.delve_blocked',
          tick,
          agentId: entry.agentId,
          ruinId: entry.ruinId,
          delveScale: entry.delveScale,
          admissionBlockedReason: entry.admissionBlockedReason,
          queuePosition: 0,
          admissionExpires: entry.admissionExpiresTick,
          summary: `Delve admission expired for ${entry.agentId} → ${entry.ruinId}`,
        });
        continue; // drop
      }
      if (tick % DELVE_ADMISSION_RETRY_INTERVAL === 0) {
        toAttempt.push(entry);
      } else {
        stillQueued.push(entry);
      }
    }

    for (const entry of toAttempt) {
      const counts = activeDelveCounts(active);
      const blocked = admissionBlockedReason(entry.delveScale, counts);
      if (blocked) {
        stillQueued.push({ ...entry, admissionBlockedReason: blocked });
      } else {
        admitDelve(entry.agentId, entry.ruinId, entry.ruinMagnitude, entry.delveScale, active, graph, tick);
      }
    }

    // ── 2. Scan for new admissions ────────────────────────────────────────
    const agentNodes = graph.getNodesByType('actor');

    for (const agentNode of agentNodes) {
      const agentId = agentNode.id;
      const hex = agentHex(graph, agentId);
      if (!hex) continue;

      // Find elder_ruin locations at this hex
      const ruinNodes = graph.getNodesByType('location').filter(n => {
        const props = n.properties as Record<string, unknown>;
        if (props.locationType !== 'elder_ruin') return false;
        const nHexCol = props.hexCol as number | undefined;
        const nHexRow = props.hexRow as number | undefined;
        return nHexCol === hex.col && nHexRow === hex.row;
      });

      for (const ruinNode of ruinNodes) {
        const ruinId = ruinNode.id;
        if (delveAlreadyActive({ ...state, activeDelves: active, delveAdmissionQueue: stillQueued }, agentId, ruinId)) continue;

        // Check for a 'located' clue pointing at this ruin
        const clueEdge = graph.getOutgoingEdges(agentId, 'knows_clue_of').find(e => {
          if (e.target !== ruinId) return false;
          const cp = e.properties as Record<string, unknown>;
          return cp.precision === 'located' && !cp.consumed;
        });
        if (!clueEdge) continue;

        const props = ruinNode.properties as Record<string, unknown>;
        const ruinMagnitude = (typeof props.ruinMagnitude === 'number' ? props.ruinMagnitude : 0.5);
        const scale = scaleFromMagnitude(ruinMagnitude);
        const counts = activeDelveCounts(active);
        const blocked = admissionBlockedReason(scale, counts);

        if (blocked) {
          stillQueued.push({
            agentId,
            ruinId,
            ruinMagnitude,
            delveScale: scale,
            queuedTick: tick,
            admissionExpiresTick: tick + DELVE_ADMISSION_EXPIRY_TICKS,
            admissionBlockedReason: blocked,
          });
          emitTrace({
            category: 'ruins.delve_blocked',
            tick,
            agentId,
            ruinId,
            delveScale: scale,
            admissionBlockedReason: blocked,
            queuePosition: stillQueued.length,
            admissionExpires: tick + DELVE_ADMISSION_EXPIRY_TICKS,
            summary: `Delve blocked for ${agentId} → ${ruinId} (${blocked})`,
          });
        } else {
          admitDelve(agentId, ruinId, ruinMagnitude, scale, active, graph, tick);
        }
      }
    }

    return { activeDelves: active, delveAdmissionQueue: stillQueued };
  } catch {
    return {}; // fail-soft
  }
}

/** Mutates `active` in place: creates a new ActiveDelve and emits admission trace. */
function admitDelve(
  agentId: string,
  ruinId: string,
  ruinMagnitude: number,
  scale: DelveScale,
  active: ActiveDelve[],
  graph: WorldGraph,
  tick: number,
): void {
  const delveId = newDelveId(agentId, ruinId, tick);
  const ruinNode = graph.getNode(ruinId);
  const props = ruinNode?.properties as Record<string, unknown> ?? {};
  const sphereAlignment = (props.sphereAlignment as string | undefined) ?? '';
  const archetype = archetypeFromRuinProps(props);
  const totalBeats = totalBeatsForScale(scale);
  const beatDuration = beatDurationForScale(scale);

  // Consume clue edges
  consumeCluesOnConvergence(ruinId, graph, tick, delveId);

  const delve: ActiveDelve = {
    delveId,
    agentId,
    ruinId,
    ruinMagnitude,
    sphereAlignment,
    archetype,
    delveScale: scale,
    beatIndex: 0,
    totalBeats,
    startedTick: tick,
    nextBeatTick: tick + 1,
    beatHistory: [],
    partialCount: 0,
    aborted: false,
  };

  active.push(delve);

  emitTrace({
    category: 'ruins.delve_admitted',
    tick,
    delveId,
    agentId,
    ruinId,
    delveScale: scale,
    concurrentCountsAtAdmission: activeDelveCounts(active),
    summary: `Delve admitted: ${agentId} → ${ruinId} (${scale}, ${totalBeats} beats)`,
  });

  emitTrace({
    category: 'ruins.delve_start',
    tick,
    delveId,
    agentId,
    ruinId,
    delveScale: scale,
    ruinMagnitude,
    sphereAlignment,
    archetype,
    summary: `Delve started: ${agentId} begins ${scale} delve at ${ruinId}`,
  });
}

// ── Phase: Delve Progression ──────────────────────────────────────────────────

/**
 * Phase 6.657: Delve Progression
 *
 * For each active non-aborted delve, when tick >= nextBeatTick, resolve the next beat:
 *   - Roll agent capability vs ruin difficulty
 *   - Pull prose from the content table (with enrichProse substitution)
 *   - Advance beatIndex; schedule the next beat
 *   - Chronicle entry per beat (dual-voice)
 *
 * Stalled outcomes do NOT terminate the delve — they delay it one beat duration.
 */
export function phaseDelveProgression(state: GameState): Partial<GameState> {
  const { graph, tick } = state;
  const active = [...(state.activeDelves ?? [])];
  let chronicleEntries = [...state.chronicleEntries];

  try {
    for (const delve of active) {
      if (delve.aborted) continue;
      if (delve.beatIndex >= delve.totalBeats) continue; // fully resolved, waiting for emergence
      if (tick < delve.nextBeatTick) continue;

      const beatIndex = delve.beatIndex + 1;
      const beatName = beatNameForIndex(delve.delveScale, beatIndex);
      const reach = reachForArchetype(delve.archetype);
      const rawCap = computeCapability(graph, delve.agentId, reach);
      const threshold = beatDifficulty(delve.delveScale, delve.ruinMagnitude, beatIndex);

      // Small seeded swing (±0.1) — deterministic per delve + beat
      const swingHash = (hashStr(delve.delveId) ^ beatIndex) / 0x7fffffff;
      const swing = (swingHash % 0.2) - 0.1;
      const roll = Math.min(1, Math.max(0, rawCap + swing));

      const outcome = resolveBeatOutcome(roll, threshold);

      // Prose
      const rawEntry = resolveDelveProseEntry(delve.archetype, beatName, outcome);
      const ctx = gatherNarrativeContext(graph, delve.agentId, undefined, undefined, undefined, undefined, state, tick);
      const poet = enrichProse(rawEntry.poet, ctx);
      const witness = rawEntry.witness.map(w => enrichProse(w, ctx));

      const beatRecord: DelveBeatRecord = {
        beatIndex,
        beatName,
        outcome,
        poetProse: poet,
        witnessFacts: witness,
        capabilityRoll: roll,
        threshold,
        tick,
      };

      delve.beatHistory = [...delve.beatHistory, beatRecord];
      delve.beatIndex = beatIndex;
      if (outcome === 'partial') delve.partialCount++;

      const beatDur = beatDurationForScale(delve.delveScale);
      delve.nextBeatTick = tick + (outcome === 'stalled' ? beatDur * 2 : beatDur);

      emitTrace({
        category: 'ruins.delve_beat',
        tick,
        delveId: delve.delveId,
        agentId: delve.agentId,
        ruinId: delve.ruinId,
        beatIndex,
        beatName,
        beatOutcome: outcome === 'advanced' ? 'advanced' : outcome === 'partial' ? 'intervened' : 'stalled',
        poetProseSnippet: poet.slice(0, 120),
        witnessFacts: witness,
        summary: `Delve beat ${beatIndex}/${delve.totalBeats} — ${outcome} (roll ${roll.toFixed(2)} vs ${threshold.toFixed(2)})`,
      });

      emitTrace({
        category: 'ruins.delve_tick',
        tick,
        delveId: delve.delveId,
        agentId: delve.agentId,
        ruinId: delve.ruinId,
        beatIndex,
        beatName,
        outcome,
        capabilityRoll: roll,
        threshold,
        summary: `Delve tick: beat ${beatIndex} — ${outcome}`,
      });

      // Chronicle entry (dual-voice)
      const agentNode = graph.getNode(delve.agentId);
      const agentName = agentNode?.name ?? delve.agentId;
      chronicleEntries = [...chronicleEntries, {
        id: `delve_beat_${delve.delveId}_${beatIndex}`,
        tier: 'chronicle' as const,
        title: `${agentName}: ${beatName}`,
        prose: poet,
        poetProse: poet,
        witnessFacts: witness,
        promptContext: {
          actors: [agentName],
          location: delve.ruinId,
          sphere: (delve.sphereAlignment as import('../../types/index').SphereName) || 'spirit',
          mood: outcome === 'advanced' ? 'triumphant' : outcome === 'partial' ? 'cautious' : 'tense',
        },
        tick,
      }];
    }
  } catch {
    // fail-soft
  }

  return { activeDelves: active, chronicleEntries };
}

// ── Phase: Delve Emergence ────────────────────────────────────────────────────

/**
 * Phase 6.658: Delve Emergence
 *
 * Detects delves that have completed all beats (beatIndex === totalBeats) and
 * have no pending emergence decision yet.
 *
 * Rolls the consequence, emits outcome traces, and sets pendingEmergenceDecision
 * for PR-5 (EmergenceDilemmaModal + ruin transformation) to consume.
 *
 * Also handles auto-fire: if a pendingEmergenceDecision is past its autoFiresTick
 * and the player hasn't responded, it auto-resolves as 'let' and clears the pending state.
 */
export function phaseDelveEmergence(
  state: GameState,
  runtime?: SimulationRuntime,
): Partial<GameState> {
  const { tick } = state;
  const active = [...(state.activeDelves ?? [])];
  let pending = state.pendingEmergenceDecision;
  let pendingChanged = false;
  let autoFirePatch: Partial<GameState> = {};

  // ── Auto-fire expired pending decision ────────────────────────────────────
  if (pending && tick >= pending.autoFiresTick) {
    emitTrace({
      category: 'ruins.delve_emergence',
      tick,
      delveId: pending.delveId,
      agentId: pending.agentId,
      ruinId: pending.ruinId,
      emergenceChoice: 'let',
      consequenceRoll: pending.consequenceRoll,
      essenceCredited: 0,
      autoResolved: true,
      summary: `Emergence auto-fired (let) for delve ${pending.delveId}`,
    });
    // Fire the PR-5 transformation pipeline with emergenceChoice='let'.
    const auto = transformRuinConsequence(
      state,
      {
        ruinId: pending.ruinId,
        delveId: pending.delveId,
        agentId: pending.agentId,
        emergenceChoice: 'let',
        consequenceRoll: pending.consequenceRoll,
        ruinMagnitude: pending.ruinMagnitude,
        sphereAlignment: pending.sphereAlignment,
        actingGodId: '',
      },
      runtime,
    );
    autoFirePatch = auto.patch;

    // Mark delve as complete
    const idx = active.findIndex(d => d.delveId === pending!.delveId);
    if (idx !== -1) active[idx] = { ...active[idx], beatIndex: active[idx].totalBeats + 1 };
    pending = undefined;
    pendingChanged = true;
  }

  // ── Detect newly completed delves ─────────────────────────────────────────
  for (const delve of active) {
    if (delve.aborted) continue;
    if (delve.beatIndex < delve.totalBeats) continue;
    if (delve.beatIndex > delve.totalBeats) continue; // already past (processed)
    if (pending) continue; // one pending at a time

    // Roll consequence
    // Use a stable per-delve RNG seed so the roll is deterministic
    const seed = hashStr(delve.delveId + tick);
    const rng = seededRng(seed);
    const roll = rollDelveConsequence(delve.delveScale, delve.ruinMagnitude, delve.partialCount, rng);

    const isSuccess = roll === 'triumphant' || roll === 'transformed';
    const isPartial = roll === 'marked' || roll === 'scarred';
    // isFailure = catastrophic

    const outcomeCategory =
      isSuccess ? 'ruins.delve_success' as const :
      isPartial ? 'ruins.delve_partial' as const :
      'ruins.delve_fail' as const;

    const ctx = gatherNarrativeContext(state.graph, delve.agentId, undefined, undefined, undefined, undefined, state, tick);
    const agentNode = state.graph.getNode(delve.agentId);
    const agentName = agentNode?.name ?? delve.agentId;

    emitTrace({
      category: outcomeCategory,
      tick,
      delveId: delve.delveId,
      agentId: delve.agentId,
      ruinId: delve.ruinId,
      consequenceRoll: roll,
      delveScale: delve.delveScale,
      ruinMagnitude: delve.ruinMagnitude,
      summary: `Delve ${isSuccess ? 'succeeded' : isPartial ? 'partial' : 'failed'}: ${agentName} at ${delve.ruinId} — ${roll}`,
    });

    emitTrace({
      category: 'ruins.delve_consequence',
      tick,
      delveId: delve.delveId,
      agentId: delve.agentId,
      ruinId: delve.ruinId,
      roll,
      rollValue: rng(),
      summary: `Delve consequence: ${roll} for ${agentName}`,
    });

    // Set pending emergence decision (PR-5 will consume this)
    pending = {
      delveId: delve.delveId,
      agentId: delve.agentId,
      ruinId: delve.ruinId,
      ruinMagnitude: delve.ruinMagnitude,
      sphereAlignment: delve.sphereAlignment,
      consequenceRoll: roll,
      autoFiresTick: tick + EMERGENCE_DECISION_TIMEOUT_TICKS,
    };
    pendingChanged = true;

    // Advance beatIndex past totalBeats to mark "awaiting emergence"
    const idx = active.findIndex(d => d.delveId === delve.delveId);
    if (idx !== -1) active[idx] = { ...active[idx], beatIndex: delve.totalBeats + 1 };

    // Chronicle entry for the emergence
    // (The EmergenceDilemmaModal in PR-5 will add the full dual-voice chronicle on resolution)
  }

  const result: Partial<GameState> = { ...autoFirePatch, activeDelves: active };
  if (pendingChanged) result.pendingEmergenceDecision = pending;
  return result;
}

/**
 * Resolve a pending emergence decision with an explicit player choice.
 * Called from the EmergenceDilemmaModal on user confirm.
 *
 * Returns a GameState patch. Safe to spread into setState — clears the pending
 * decision, advances the delve past its final beat, and applies the
 * transformation pipeline's essence award + graph mutations.
 */
export function resolveEmergenceDecision(
  state: GameState,
  choice: EmergenceChoice,
  actingGodId: string = '',
  runtime?: SimulationRuntime,
): Partial<GameState> {
  const pending = state.pendingEmergenceDecision;
  if (!pending) return {};

  emitTrace({
    category: 'ruins.delve_emergence',
    tick: state.tick,
    delveId: pending.delveId,
    agentId: pending.agentId,
    ruinId: pending.ruinId,
    emergenceChoice: choice,
    consequenceRoll: pending.consequenceRoll,
    essenceCredited: 0, // actual amount lives in ruins.elder_essence_awarded
    autoResolved: false,
    summary: `Emergence resolved (${choice}) for delve ${pending.delveId}`,
  });

  const result = transformRuinConsequence(
    state,
    {
      ruinId: pending.ruinId,
      delveId: pending.delveId,
      agentId: pending.agentId,
      emergenceChoice: choice,
      consequenceRoll: pending.consequenceRoll,
      ruinMagnitude: pending.ruinMagnitude,
      sphereAlignment: pending.sphereAlignment,
      actingGodId,
    },
    runtime,
  );

  // Advance the delve past its final beat so the arc is considered closed.
  const active = [...(state.activeDelves ?? [])];
  const idx = active.findIndex(d => d.delveId === pending.delveId);
  if (idx !== -1) active[idx] = { ...active[idx], beatIndex: active[idx].totalBeats + 1 };

  return {
    ...result.patch,
    activeDelves: active,
  };
}

// ── Public: abort a delve ─────────────────────────────────────────────────────

/**
 * Abort an active delve and refund partial essence to the god.
 * Called from the UI abort control or from engine cleanup.
 *
 * Returns the updated GameState slice (activeDelves + essencePool).
 */
export function abortDelve(
  delveId: string,
  state: GameState,
): Partial<GameState> {
  const active = [...(state.activeDelves ?? [])];
  const idx = active.findIndex(d => d.delveId === delveId && !d.aborted);
  if (idx === -1) return {};

  const delve = active[idx];
  active[idx] = { ...delve, aborted: true, abortedTick: state.tick };

  // Refund: a small fraction of sphere-aligned essence
  const refundSphere = (delve.sphereAlignment as import('../../types/index').SphereName) || 'spirit';
  const refundAmount = Math.floor(
    delve.ruinMagnitude * 10 * DELVE_ABORT_ESSENCE_REFUND_FRACTION,
  );
  const essencePool = { ...state.essencePool };
  if (refundAmount > 0 && essencePool[refundSphere] !== undefined) {
    essencePool[refundSphere] = (essencePool[refundSphere] ?? 0) + refundAmount;
  }

  emitTrace({
    category: 'ruins.delve_aborted',
    tick: state.tick,
    delveId,
    agentId: delve.agentId,
    ruinId: delve.ruinId,
    beatAtAbort: delve.beatIndex,
    refundSphere,
    refundAmount,
    summary: `Delve aborted: ${delve.agentId} at ${delve.ruinId} (beat ${delve.beatIndex}/${delve.totalBeats}), refunded ${refundAmount} ${refundSphere}`,
  });

  return { activeDelves: active, essencePool };
}

// ── Utility ───────────────────────────────────────────────────────────────────

/** Djb2-style deterministic hash of a string → positive integer. */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return h >>> 0; // unsigned 32-bit
}

/** Minimal seeded LCG RNG — deterministic, not for security. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}
