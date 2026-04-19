/**
 * Ruin Transformation — PR 5 of the Ruins Layer (THR-153).
 *
 * Consumes `pendingEmergenceDecision` (produced by PR 4's phaseDelveEmergence)
 * plus an emergence choice (Let / Claim / Bargain / Corrupt), mutates the graph
 * to either promote the ruin into a `place_of_power` location OR replace it
 * with a `ruins.scar` sublocation, seeds the holder edge, and awards elder
 * essence through the refactored `awardElderEssence` core.
 *
 * See Docs/plans/2026-04-19-pr5-ruin-transformation.md § 2.1 for the authoritative
 * 7-row outcome matrix that drives this module.
 *
 * NFP compliance:
 *   #1 Tunability: every threshold lives in ../../engine/ruins/constants.ts
 *   #2 Inspectability: emits ruins.ruin_transformed + ruins.elder_essence_awarded +
 *                      ruins.pop_holder_changed traces
 *   #3 Determinism: pure over (state, input, rng) — no module-scope state
 *   #4 Fail-soft: every branch wrapped in a single try/catch; on failure we
 *                 clear pendingEmergenceDecision and emit ruins.emergence_orphaned
 */

import type { GameState } from '../../types/gameState';
import type { GraphEdge, GraphNode } from '../../types/graph';
import type { SphereName } from '../../types/index';
import type { ChronicleEntry } from '../../types/narrative';
import type { EssencePool } from '../../types/influence';
import type { SimulationRuntime } from '../simulationRuntime';
import { touchWorld, touchStructure } from '../simulationRuntime';
import { emitTrace } from '../traceBuffer';
import { awardElderEssence, type EssenceAwardSource } from '../elderEssenceReward';
import {
  ELDER_SITE_ESSENCE_REWARD,
} from '../../data/agent-behavior-constants';
import {
  POP_ESSENCE_PER_TICK_MIN,
  POP_ESSENCE_PER_TICK_MAX,
  POP_STREAM_DECAY_WINDOW_TICKS,
  POP_CLAIM_COST_MULTIPLIER,
  POP_CORRUPT_UP_FRONT_COST,
  TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
  CONSUMED_ELDER_ESSENCE_MULTIPLIER,
  CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER,
} from './constants';
import type { DelveConsequenceRoll, RuinArchetype } from './delveTypes';
import { resolveTransformationProse } from '../../data/prose/ruinsTransformation';
import { gatherNarrativeContext, enrichProse } from '../proseEnrichment';

// ── Public types ────────────────────────────────────────────────────────────

export type EmergenceChoice = 'let' | 'claim' | 'bargain' | 'corrupt';

export interface TransformRuinInput {
  readonly ruinId: string;
  readonly delveId: string;
  readonly agentId: string;
  readonly emergenceChoice: EmergenceChoice;
  readonly consequenceRoll: DelveConsequenceRoll;
  readonly ruinMagnitude: number;
  readonly sphereAlignment: string;
  /** God that invoked the Emergence action (player-god for v1). Empty string for auto-fire. */
  readonly actingGodId: string;
}

export interface TransformRuinResult {
  readonly newLocationId?: string;       // set when PoP is created
  readonly newScarSublocationId?: string; // set when consumed
  readonly holderId?: string;
  readonly essenceDeltas: Partial<Record<SphereName, number>>;
  readonly totalEssence: number;
  /** Essence debited from the acting god's pool (Claim / Corrupt costs). */
  readonly essenceCost: number;
  readonly chronicleEntry?: ChronicleEntry;
  readonly failed?: true;
  readonly failureReason?: string;
}

// ── Outcome matrix ──────────────────────────────────────────────────────────

interface MatrixRow {
  readonly ruinFate: 'transformed' | 'consumed';
  readonly holder: 'none' | 'agent' | 'god';
  readonly essenceMultiplier: number;
  readonly essenceCostFactor: number;
  readonly corruptMark: boolean;
  readonly bargainFavor: boolean;
  readonly essenceSource: EssenceAwardSource;
}

function matrixRow(roll: DelveConsequenceRoll, choice: EmergenceChoice): MatrixRow {
  if (roll === 'catastrophic') {
    return {
      ruinFate: 'consumed',
      holder: 'none',
      essenceMultiplier: CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER,
      essenceCostFactor: 0,
      corruptMark: false,
      bargainFavor: false,
      essenceSource: 'ruin_catastrophic',
    };
  }
  if (roll === 'scarred' || roll === 'marked') {
    return {
      ruinFate: 'consumed',
      holder: 'none',
      essenceMultiplier: CONSUMED_ELDER_ESSENCE_MULTIPLIER,
      essenceCostFactor: 0,
      corruptMark: false,
      bargainFavor: false,
      essenceSource: 'ruin_consumed',
    };
  }
  if (roll === 'triumphant') {
    return {
      ruinFate: 'consumed',
      holder: 'none',
      essenceMultiplier: TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
      essenceCostFactor: 0,
      corruptMark: false,
      bargainFavor: false,
      essenceSource: 'ruin_consumed',
    };
  }
  // roll === 'transformed' — PoP forms. Branch by choice.
  switch (choice) {
    case 'claim':
      return {
        ruinFate: 'transformed',
        holder: 'god',
        essenceMultiplier: TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
        essenceCostFactor: POP_CLAIM_COST_MULTIPLIER,
        corruptMark: false,
        bargainFavor: false,
        essenceSource: 'ruin_transformed',
      };
    case 'bargain':
      return {
        ruinFate: 'transformed',
        holder: 'agent',
        essenceMultiplier: TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
        essenceCostFactor: 0,
        corruptMark: false,
        bargainFavor: true,
        essenceSource: 'ruin_transformed',
      };
    case 'corrupt':
      return {
        ruinFate: 'transformed',
        holder: 'agent',
        essenceMultiplier: TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
        essenceCostFactor: 0,
        corruptMark: true,
        bargainFavor: false,
        essenceSource: 'ruin_transformed',
      };
    case 'let':
    default:
      return {
        ruinFate: 'transformed',
        holder: 'agent',
        essenceMultiplier: TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
        essenceCostFactor: 0,
        corruptMark: false,
        bargainFavor: false,
        essenceSource: 'ruin_transformed',
      };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function archetypeFromProps(props: Record<string, unknown>): RuinArchetype {
  const raw = props.archetype as string | undefined;
  if (raw === 'vault' || raw === 'temple' || raw === 'battlefield') return raw;
  const sphere = props.sphereAlignment as string | undefined;
  if (!sphere) return 'vault';
  if (['iron', 'force', 'matter', 'entropy', 'order'].includes(sphere)) return 'battlefield';
  if (['spirit', 'life', 'light', 'chaos'].includes(sphere)) return 'temple';
  return 'vault';
}

function hexOfLocation(
  state: GameState,
  locationId: string,
): { col: number; row: number } | null {
  const node = state.graph.getNode(locationId);
  if (!node) return null;
  const col = node.properties.hexCol as number | undefined;
  const row = node.properties.hexRow as number | undefined;
  if (col === undefined || row === undefined) {
    const parentId = node.properties.parentLocationId as string | undefined;
    if (parentId) return hexOfLocation(state, parentId);
    return null;
  }
  return { col, row };
}

function popEssencePerTick(ruinMagnitude: number): number {
  const safe = Number.isFinite(ruinMagnitude) ? Math.max(0, ruinMagnitude) : 0;
  const raw = Math.ceil(safe * (POP_ESSENCE_PER_TICK_MAX + 1));
  return Math.max(POP_ESSENCE_PER_TICK_MIN, Math.min(POP_ESSENCE_PER_TICK_MAX, raw));
}

function debitEssence(
  pool: EssencePool,
  amount: number,
  preferSphere: SphereName | undefined,
): { pool: EssencePool; actual: number } {
  if (amount <= 0 || !Number.isFinite(amount)) return { pool, actual: 0 };
  const next: EssencePool = { ...pool };
  let remaining = amount;
  const order: SphereName[] = preferSphere
    ? [preferSphere, ...(Object.keys(next) as SphereName[]).filter(k => k !== preferSphere)]
    : (Object.keys(next) as SphereName[]);
  for (const s of order) {
    if (remaining <= 0) break;
    const have = next[s] ?? 0;
    const take = Math.min(have, remaining);
    next[s] = have - take;
    remaining -= take;
  }
  return { pool: next, actual: amount - remaining };
}

// ── Public API ─────────────────────────────────────────────────────────────

export function transformRuinConsequence(
  state: GameState,
  input: TransformRuinInput,
  runtime?: SimulationRuntime,
): TransformRuinResult & { patch: Partial<GameState> } {
  const { graph, tick } = state;

  try {
    const row = matrixRow(input.consequenceRoll, input.emergenceChoice);
    const ruinNode = graph.getNode(input.ruinId);
    if (!ruinNode) {
      emitTrace({
        category: 'ruins.emergence_orphaned',
        tick,
        delveId: input.delveId,
        ruinId: input.ruinId,
        summary: `Emergence aborted: ruin ${input.ruinId} no longer exists`,
      } as any);
      return {
        essenceDeltas: {},
        totalEssence: 0,
        essenceCost: 0,
        failed: true,
        failureReason: 'ruin_missing',
        patch: { pendingEmergenceDecision: undefined },
      };
    }

    const archetype = archetypeFromProps(ruinNode.properties as Record<string, unknown>);
    const hex = hexOfLocation(state, input.ruinId);
    const sphere = (input.sphereAlignment as SphereName) || 'spirit';

    // ── 1. Essence award ─────────────────────────────────────────────────
    const amount = ELDER_SITE_ESSENCE_REWARD * row.essenceMultiplier;
    const reward = awardElderEssence({
      ascendantId: input.actingGodId,
      amount,
      distributionMode:
        row.essenceSource === 'ruin_transformed' ? 'foundation_spread' : 'single_sphere',
      sphere: row.essenceSource === 'ruin_transformed' ? undefined : sphere,
      source: row.essenceSource,
      tick,
      essencePool: state.essencePool,
    });

    // ── 2. Apply reward + debit essence cost ─────────────────────────────
    let essencePool: EssencePool = { ...state.essencePool };
    for (const [s, delta] of Object.entries(reward.deltas) as [SphereName, number][]) {
      if (delta === undefined) continue;
      essencePool[s] = (essencePool[s] ?? 0) + delta;
    }
    let essenceCost = 0;
    if (input.emergenceChoice === 'claim' && row.ruinFate === 'transformed') {
      const cost = input.ruinMagnitude * row.essenceCostFactor;
      const { pool, actual } = debitEssence(essencePool, cost, sphere);
      essencePool = pool;
      essenceCost = actual;
    } else if (input.emergenceChoice === 'corrupt' && row.ruinFate === 'transformed') {
      const { pool, actual } = debitEssence(essencePool, POP_CORRUPT_UP_FRONT_COST, 'darkness');
      essencePool = pool;
      essenceCost = actual;
    }

    // ── 3. Graph mutations ───────────────────────────────────────────────
    let newLocationId: string | undefined;
    let newScarSublocationId: string | undefined;
    let holderId: string | undefined;

    if (row.ruinFate === 'transformed') {
      const perTick = popEssencePerTick(input.ruinMagnitude);
      graph.updateNode(input.ruinId, {
        properties: {
          ...ruinNode.properties,
          locationSubtype: 'place_of_power',
          locationType: 'place_of_power',
          popEssencePerTick: perTick,
          popSphere: sphere,
          popCreatedTick: tick,
          popStreamDecayCountdown: POP_STREAM_DECAY_WINDOW_TICKS,
          popStreamDecayCountdownMax: POP_STREAM_DECAY_WINDOW_TICKS,
          transformedFromRuinId: input.ruinId,
          transformedAtTick: tick,
          ruinMagnitude: 0,
        },
      });
      newLocationId = input.ruinId;

      if (row.holder === 'god' && input.actingGodId) {
        holderId = input.actingGodId;
      } else if (row.holder === 'agent') {
        holderId = input.agentId;
      }
      if (holderId) {
        const edgeId = `edge-pop-hold-${input.ruinId}-${tick}`;
        const edge: GraphEdge = {
          id: edgeId,
          source: holderId,
          target: input.ruinId,
          type: 'holds_place_of_power',
          properties: {
            heldSinceTick: tick,
            holderType: row.holder === 'god' ? 'god' : 'actor',
            corruptMark: row.corruptMark,
            bargainFavor: row.bargainFavor,
            sphere,
          },
        };
        try { graph.addEdge(edge); } catch { /* fail-soft */ }
        emitTrace({
          category: 'ruins.pop_holder_changed',
          tick,
          popId: input.ruinId,
          previousHolderId: null,
          newHolderId: holderId,
          holderType: row.holder === 'god' ? 'god' : 'actor',
          reason: 'emergence',
          summary: `PoP holder set: ${holderId} (${row.holder})`,
        } as any);
      }
    } else {
      const scarId = `sublocation.ruins-scar.${input.ruinId}.${tick}`;
      const scarNode: GraphNode = {
        id: scarId,
        type: 'location',
        name: `Scar of ${ruinNode.name}`,
        properties: {
          sublocationTypeId: 'ruins.scar',
          parentLocationId: input.ruinId,
          hexCol: hex?.col,
          hexRow: hex?.row,
          archetype,
          sphereAlignment: sphere,
          transformedFromRuinId: input.ruinId,
          consumedAtTick: tick,
          consequenceRoll: input.consequenceRoll,
        },
      };
      try {
        graph.addNode(scarNode);
        graph.addEdge({
          id: `edge-scar-${input.ruinId}-${tick}`,
          source: input.ruinId,
          target: scarId,
          type: 'contains',
          properties: {},
        });
        newScarSublocationId = scarId;
      } catch {
        emitTrace({
          category: 'ruins.schema_drift',
          tick,
          ruinId: input.ruinId,
          summary: `Failed to create ruins.scar sublocation for ${input.ruinId}`,
        } as any);
      }

      graph.updateNode(input.ruinId, {
        properties: {
          ...ruinNode.properties,
          locationSubtype: 'ruins',
          locationType: 'ruins',
          ruinMagnitude: 0,
          consumedAtTick: tick,
        },
      });
    }

    // ── 4. Transformation trace ─────────────────────────────────────────
    emitTrace({
      category: 'ruins.ruin_transformed',
      tick,
      delveId: input.delveId,
      agentId: input.agentId,
      ruinId: input.ruinId,
      outcome: row.ruinFate,
      newPlaceOfPowerId: newLocationId,
      newScarSublocationId,
      emergenceChoice: input.emergenceChoice,
      consequenceRoll: input.consequenceRoll,
      essenceCost,
      summary: `Ruin ${row.ruinFate}: ${input.ruinId} (${input.consequenceRoll} / ${input.emergenceChoice})`,
    } as any);

    // ── 5. Chronicle entry ──────────────────────────────────────────────
    const ctx = gatherNarrativeContext(
      graph, input.agentId, undefined, undefined, undefined, state, tick,
    );
    const proseEntry = resolveTransformationProse(archetype, row.ruinFate);
    const poet = enrichProse(proseEntry.poet, ctx);
    const witness = proseEntry.witness.map(w => enrichProse(w, ctx));
    const agentNode = graph.getNode(input.agentId);
    const agentName = agentNode?.name ?? input.agentId;
    const chronicleEntry: ChronicleEntry = {
      id: `chronicle_ruin_transform_${input.delveId}`,
      tier: 'chronicle',
      title: row.ruinFate === 'transformed'
        ? `${agentName}: A Place of Power Emerges`
        : `${agentName}: A Scar Remains`,
      prose: poet,
      poetProse: poet,
      witnessFacts: witness,
      promptContext: {
        actors: [agentName],
        location: input.ruinId,
        sphere,
        mood: row.ruinFate === 'transformed' ? 'triumphant' : 'somber',
      },
      tick,
    };

    // ── 6. Cache invalidation ───────────────────────────────────────────
    if (runtime) {
      touchWorld(runtime);
      touchStructure(runtime);
    }

    return {
      newLocationId,
      newScarSublocationId,
      holderId,
      essenceDeltas: reward.deltas,
      totalEssence: reward.totalReward,
      essenceCost,
      chronicleEntry,
      patch: {
        essencePool,
        pendingEmergenceDecision: undefined,
        chronicleEntries: [...state.chronicleEntries, chronicleEntry],
      },
    };
  } catch (err) {
    emitTrace({
      category: 'ruins.emergence_orphaned',
      tick: state.tick,
      delveId: input.delveId,
      ruinId: input.ruinId,
      summary: `Transformation failed: ${(err as Error).message ?? 'unknown'}`,
    } as any);
    return {
      essenceDeltas: {},
      totalEssence: 0,
      essenceCost: 0,
      failed: true,
      failureReason: 'exception',
      patch: { pendingEmergenceDecision: undefined },
    };
  }
}
