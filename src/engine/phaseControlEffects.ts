/**
 * Phase Control Effects — tick sustained divine effects with per-tick costs.
 *
 * Runs after phaseEssence (so income is credited first).
 *
 * Algorithm:
 *   1. Collect all active ControlEffects from GameState.controlEffects[]
 *   2. Sort by establishedTick ascending (oldest first for payment)
 *   3. For each effect (oldest first):
 *      a. Check sustainThreshold → lapse with 'threshold_failed' if condition fails
 *      b. Debit perTickCost from essencePool → mark for lapse if insufficient
 *      c. Apply perTickMutations (queued as pendingHexMutations)
 *      d. Apply perTickGraphOps (not implemented until TB-045)
 *      e. Credit perTickIncome to essencePool
 *      f. Increment ticksActive
 *      g. Emit ControlEffectTickTrace
 *   4. Lapse all marked effects in LIFO order (newest first)
 *      - Set active=false, lapseReason='essence_depleted'
 *      - Emit ControlEffectLapseTrace + TickEvent
 *   5. Return updated { controlEffects, essencePool, pendingHexMutations, tickEvents }
 *
 * NFP compliance:
 *   #1 Tunability: constants from controlEffect.ts
 *   #2 Inspectability: ControlEffectTickTrace + ControlEffectLapseTrace per effect
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: missing fields → graceful defaults, never throws
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { EssencePool } from '../types/influence';
import { executeGraphOps } from './graphOpExecutor';
import type { GraphOpContext } from '../types/graphOp';
import type { HexMutation } from '../types/hexMutation';
import type { ControlEffect, LapseReason } from '../types/controlEffect';
import type { SphereName } from '../types/index';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { CONTROL_PRESSURE_PER_TICK } from '../types/sphereAffinity';
import { emitTrace } from './traceBuffer';
import { getUpkeepStatus, applyCoLocatedThreadAura } from './ascendantPrimitives';
import { mulberry32 } from '../lib/prng';
import { hashString } from './factionAmbitions';
import { MAX_SPHERE_SCORE } from '../types/sphereAffinity';
import type { SphereAffinity } from '../types/sphereAffinity';
import { RIFT_LEAK_SIGNIFICANCE } from '../data/game-config';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Per-tick income from a 'Tap the Source' control effect */
export const TAP_SOURCE_BASE_INCOME = 0.8;

/** Per-tick cost for sustaining a 'Tap the Source' control effect */
export const TAP_SOURCE_SUSTAIN_COST = 0.2;

/** Multiplier from resource deposit quality to income rate */
export const CLAIM_RESOURCE_INCOME_MULTIPLIER = 1.0;

/**
 * PRNG seed offset for the per-tick rift leak roll (THR-551). Combined with
 * `state.seed`, `state.tick`, and a hash of the effect id so each rift rolls an
 * independent, deterministic, replayable stream (same seed+tick+effect → same
 * roll). Distinct offset keeps it decorrelated from other per-tick PRNG streams.
 */
export const RIFT_LEAK_SEED_OFFSET = 53;

/** Sphere `entropy` is the chaos/decay creation sphere a rift leak channels. */
const RIFT_LEAK_PRESSURE_SPHERE: SphereName = 'entropy';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let nextEventCounter = 0;
/** Reset per-tick control effects event counter. Called by orchestrator.resetEventCounters() at tick start. */
export function resetControlEffectsCounter(): void {
  nextEventCounter = 0;
}
function nextEventId(tick: number): string {
  return `ctrl_evt_${tick}_${nextEventCounter++}`;
}

/**
 * Check a sustain threshold against hex tile or location state.
 * Returns true if threshold is satisfied (effect should remain active).
 */
function checkThreshold(
  threshold: ControlEffect['sustainThreshold'],
  state: GameState,
  effect: ControlEffect,
): boolean {
  if (!threshold) return true;

  if (threshold.target === 'hex') {
    const tile = state.tiles.find(
      t => t.coord.col === effect.targetHexCol && t.coord.row === effect.targetHexRow
    );
    if (!tile) return false; // Hex doesn't exist → fail threshold

    const fieldValue = (tile as Record<string, unknown>)[threshold.field] as number ?? 0;
    return compareOp(fieldValue, threshold.operator, threshold.value);
  }

  if (threshold.target === 'location') {
    if (!effect.targetNodeId) return false;
    const node = state.graph.getNode(effect.targetNodeId);
    if (!node) return false;
    const fieldValue = (node.properties[threshold.field] as number) ?? 0;
    return compareOp(fieldValue, threshold.operator, threshold.value);
  }

  // Unknown target type — fail-soft: treat as satisfied
  return true;
}

function compareOp(a: number, op: '>=' | '<=' | '>' | '<', b: number): boolean {
  switch (op) {
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '<': return a < b;
  }
}

// ─── Phase function ───────────────────────────────────────────────────────────

export function phaseControlEffects(state: GameState): Partial<GameState> {
  const effects = state.controlEffects ?? [];
  if (effects.length === 0) return {};

  // Deep copy mutable state
  const pool: EssencePool = { ...state.essencePool };
  const newEvents: TickEvent[] = [];
  const newMutations: HexMutation[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];

  // Separate active from already-lapsed
  const activeEffects = effects.filter(e => e.active);
  const inactiveEffects = effects.filter(e => !e.active);

  // Sort active by establishedTick ascending (oldest first for payment)
  const sorted = [...activeEffects].sort((a, b) => a.establishedTick - b.establishedTick);

  // Track which effects can't pay this tick
  const markedForLapse: Set<string> = new Set();
  const updatedEffects: ControlEffect[] = [];

  for (const effect of sorted) {
    // ─── Fail-soft: owner must still exist ───
    const ownerNode = state.graph.getNode(effect.ownerId);
    if (!ownerNode) {
      updatedEffects.push({
        ...effect,
        active: false,
        lapseReason: 'voluntarily_released',
      });
      newEvents.push({
        id: nextEventId(state.tick),
        tick: state.tick,
        type: 'control_effect_lapsed',
        message: effect.narrativeTemplates.lapsed,
        significance: 0.5,
        hexCoords: { col: effect.targetHexCol, row: effect.targetHexRow },
      });
      continue;
    }

    // ─── Step 3a: Threshold check ───
    if (effect.sustainThreshold) {
      const passed = checkThreshold(effect.sustainThreshold, state, effect);
      if (!passed) {
        // Lapse immediately — no essence charge
        updatedEffects.push({
          ...effect,
          active: false,
          lapseReason: 'threshold_failed',
        });

        emitTrace({
          tick: state.tick,
          category: 'control_effect',
          type: 'control_effect_lapsed',
          summary: `Control effect ${effect.templateId} lapsed: threshold failed`,
          effectId: effect.effectId,
          templateId: effect.templateId,
          targetHex: { col: effect.targetHexCol, row: effect.targetHexRow },
          lapseReason: 'threshold_failed' as LapseReason,
          totalTicksActive: effect.ticksActive,
          totalEssenceDrained: effect.perTickCost,
        } as any);

        newEvents.push({
          id: nextEventId(state.tick),
          tick: state.tick,
          type: 'control_effect_lapsed',
          message: effect.narrativeTemplates.lapsed,
          significance: 0.7,
          hexCoords: { col: effect.targetHexCol, row: effect.targetHexRow },
        });

        continue;
      }
    }

    // ─── Step 3a': Relic-upkeep substitute (THR-509) ───
    // A sustaining relic waives per-tick cost while it exists; if the relic was
    // destroyed, the effect lapses (no charge, like a threshold failure).
    const upkeepStatus = getUpkeepStatus(effect, state.graph);
    if (upkeepStatus === 'relic_lost') {
      updatedEffects.push({
        ...effect,
        active: false,
        lapseReason: 'upkeep_relic_destroyed',
      });

      emitTrace({
        tick: state.tick,
        category: 'control_effect',
        type: 'control_effect_lapsed',
        summary: `Control effect ${effect.templateId} lapsed: upkeep relic destroyed`,
        effectId: effect.effectId,
        templateId: effect.templateId,
        targetHex: { col: effect.targetHexCol, row: effect.targetHexRow },
        lapseReason: 'upkeep_relic_destroyed' as LapseReason,
        totalTicksActive: effect.ticksActive,
        totalEssenceDrained: effect.perTickCost,
      } as any);

      newEvents.push({
        id: nextEventId(state.tick),
        tick: state.tick,
        type: 'control_effect_lapsed',
        message: effect.narrativeTemplates.lapsed,
        significance: 0.7,
        hexCoords: { col: effect.targetHexCol, row: effect.targetHexRow },
      });

      continue;
    }
    const upkeepWaived = upkeepStatus === 'waived';

    // ─── Step 3b: Essence payment ───
    let canPay = true;
    const drained: Partial<Record<SphereName, number>> = {};

    if (!upkeepWaived) {
      for (const [sphere, cost] of Object.entries(effect.perTickCost)) {
        const s = sphere as SphereName;
        const amount = cost as number;
        if (amount <= 0) continue;

        if ((pool[s] ?? 0) >= amount) {
          pool[s] = (pool[s] ?? 0) - amount;
          drained[s] = amount;
        } else {
          canPay = false;
          // Refund any already-debited spheres this tick
          for (const [refundSphere, refundAmount] of Object.entries(drained)) {
            pool[refundSphere as SphereName] = (pool[refundSphere as SphereName] ?? 0) + (refundAmount as number);
          }
          break;
        }
      }
    }

    if (!canPay) {
      markedForLapse.add(effect.effectId);
      updatedEffects.push(effect); // Will be lapsed in LIFO pass
      continue;
    }

    // ─── Step 3c: Apply per-tick mutations ───
    for (const mut of effect.perTickMutations) {
      newMutations.push({
        col: effect.targetHexCol,
        row: effect.targetHexRow,
        field: mut.field,
        delta: mut.delta,
        source: `control:${effect.effectId}`,
      });
    }

    // ─── Step 3d: Apply per-tick graph ops ───
    if (effect.perTickGraphOps.length > 0) {
      const ctx: GraphOpContext = {
        actorId: effect.ownerId,
        targetId: effect.targetNodeId ?? `hex:${effect.targetHexCol},${effect.targetHexRow}`,
        locationId: effect.targetNodeId ?? '',
        tick: state.tick,
      };
      executeGraphOps(state.graph, [...effect.perTickGraphOps], ctx, {
        tick: state.tick,
        emitTrace: true,
      });
    }

    // ─── Step 3d': Apply per-tick co-located thread auras (THR-509) ───
    // Faith-spread and kin: advance every threaded agent co-located with the
    // effect's target node. No-op when the effect has no specific target node.
    if (effect.perTickThreadAuras && effect.perTickThreadAuras.length > 0 && effect.targetNodeId) {
      for (const aura of effect.perTickThreadAuras) {
        applyCoLocatedThreadAura(state.graph, effect.targetNodeId, effect.ownerId, aura, state.tick);
      }
    }

    // ─── Step 3d'': Per-tick sphere influence (THR-551 rift) ───
    // Amplify the target node's sphere via the canonical pressure system, up to a
    // cap. Additive to the generic CONTROL_PRESSURE_PER_TICK pushed in step 3h.
    // Deterministic (pressure only, no PRNG). Fail-soft: no node / no affinity → skip.
    if (effect.perTickSphereInfluence && effect.targetNodeId) {
      const inf = effect.perTickSphereInfluence;
      const infNode = state.graph.getNode(effect.targetNodeId);
      const affinity = infNode?.properties.sphereAffinity as SphereAffinity | undefined;
      const currentScore = affinity?.scores?.[inf.sphere] ?? 0;
      const effectiveCap = Math.min(inf.cap, MAX_SPHERE_SCORE);
      if (infNode && currentScore < effectiveCap && inf.magnitude > 0) {
        pressures.push({
          targetEntityId: effect.targetNodeId,
          sphere: inf.sphere,
          magnitude: inf.magnitude,
          source: 'control_effect',
          sourceId: effect.effectId,
        });
      }
    }

    // ─── Step 3e: Credit per-tick income ───
    const generated: Partial<Record<SphereName, number>> = {};
    if (effect.perTickIncome) {
      for (const [sphere, income] of Object.entries(effect.perTickIncome)) {
        const s = sphere as SphereName;
        const amount = income as number;
        if (amount > 0) {
          pool[s] = (pool[s] ?? 0) + amount;
          generated[s] = amount;
        }
      }
    }

    // ─── Step 3f: Increment ticksActive ───
    const updated: ControlEffect = {
      ...effect,
      ticksActive: effect.ticksActive + 1,
    };
    updatedEffects.push(updated);

    // ─── Step 3g: Emit tick trace ───
    emitTrace({
      tick: state.tick,
      category: 'control_effect',
      type: 'control_effect_tick',
      summary: `Control effect ${effect.templateId} ticked (${effect.ticksActive + 1} ticks active)`,
      effectId: effect.effectId,
      templateId: effect.templateId,
      targetHex: { col: effect.targetHexCol, row: effect.targetHexRow },
      essenceDrained: drained,
      essenceGenerated: generated,
      thresholdChecked: !!effect.sustainThreshold,
      thresholdPassed: true,
      active: true,
      ticksActive: effect.ticksActive + 1,
    } as any);

    // ─── Step 3h: Push sphere pressure per tick ───
    // For each sphere channeled by this effect (perTickCost keys), push a SpherePressureEvent.
    // targetEntityId: use the specific target node if available; else skip (fail-soft: no node = no pressure).
    // Only applies to sphere-tagged (non-zero cost) spheres — effects without sphere cost produce no pressure.
    if (effect.targetNodeId) {
      for (const [sphere, cost] of Object.entries(effect.perTickCost)) {
        const amount = cost as number;
        if (amount > 0) {
          pressures.push({
            targetEntityId: effect.targetNodeId,
            sphere: sphere as SphereName,
            magnitude: CONTROL_PRESSURE_PER_TICK,
            source: 'control_effect',
            sourceId: effect.effectId,
          });
        }
      }
    }

    // ─── Step 3i: Per-tick hostile leak roll (THR-551 rift downside) ───
    // A seeded per-tick roll may spill a chaos pulse into the rift's hex/location:
    // hex corruption + an entropy sphere pressure. The PRNG is derived from
    // seed+tick+effectId so the roll is deterministic and replayable (NFP #3).
    // A trace + tick event fire only WHEN the leak hits (rare) — no per-tick
    // no-op trace, keeping the buffer lean. Fail-soft: arithmetic only, no throws.
    if (effect.perTickLeak && effect.perTickLeak.chance > 0) {
      const leak = effect.perTickLeak;
      const leakRng = mulberry32(
        state.seed + state.tick * RIFT_LEAK_SEED_OFFSET + hashString(effect.effectId),
      );
      const roll = leakRng();
      if (roll < leak.chance) {
        // Chaos pulse: stain the hex with corruption.
        if (leak.corruption > 0) {
          newMutations.push({
            col: effect.targetHexCol,
            row: effect.targetHexRow,
            field: 'corruption',
            delta: leak.corruption,
            source: `rift_leak:${effect.effectId}`,
          });
        }
        // ...and push entropy pressure onto the location (chaos seeping in).
        if (effect.targetNodeId && leak.entropyPressure > 0) {
          pressures.push({
            targetEntityId: effect.targetNodeId,
            sphere: RIFT_LEAK_PRESSURE_SPHERE,
            magnitude: leak.entropyPressure,
            source: 'control_effect',
            sourceId: effect.effectId,
          });
        }

        emitTrace({
          tick: state.tick,
          category: 'ascendant.signature.rift_leak',
          effectId: effect.effectId,
          templateId: effect.templateId,
          ownerId: effect.ownerId,
          targetHex: { col: effect.targetHexCol, row: effect.targetHexRow },
          targetNodeId: effect.targetNodeId,
          chance: leak.chance,
          roll,
          corruption: leak.corruption,
          entropyPressure: leak.entropyPressure,
          summary: `rift leak: chaos pulse at (${effect.targetHexCol},${effect.targetHexRow}) [roll ${roll.toFixed(3)} < ${leak.chance.toFixed(3)}]`,
        } as any);

        newEvents.push({
          id: nextEventId(state.tick),
          tick: state.tick,
          type: 'narrative',
          message: 'A chaos pulse leaks through the rift, staining the land.',
          significance: RIFT_LEAK_SIGNIFICANCE,
          hexCoords: { col: effect.targetHexCol, row: effect.targetHexRow },
        });
      }
    }
  }

  // ─── Step 4: Lapse marked effects in LIFO order (newest first) ───
  if (markedForLapse.size > 0) {
    // Sort lapsing effects newest-first
    const toLapse = updatedEffects
      .filter(e => markedForLapse.has(e.effectId))
      .sort((a, b) => b.establishedTick - a.establishedTick);

    for (const effect of toLapse) {
      const idx = updatedEffects.findIndex(e => e.effectId === effect.effectId);
      if (idx >= 0) {
        updatedEffects[idx] = {
          ...effect,
          active: false,
          lapseReason: 'essence_depleted',
        };
      }

      emitTrace({
        tick: state.tick,
        category: 'control_effect',
        type: 'control_effect_lapsed',
        summary: `Control effect ${effect.templateId} lapsed: essence depleted`,
        effectId: effect.effectId,
        templateId: effect.templateId,
        targetHex: { col: effect.targetHexCol, row: effect.targetHexRow },
        lapseReason: 'essence_depleted' as LapseReason,
        totalTicksActive: effect.ticksActive,
        totalEssenceDrained: effect.perTickCost,
      } as any);

      newEvents.push({
        id: nextEventId(state.tick),
        tick: state.tick,
        type: 'control_effect_lapsed',
        message: effect.narrativeTemplates.lapsed,
        significance: 0.7,
        hexCoords: { col: effect.targetHexCol, row: effect.targetHexRow },
      });
    }
  }

  // Merge active/inactive
  const allEffects = [...updatedEffects, ...inactiveEffects];

  return {
    controlEffects: allEffects,
    essencePool: pool,
    pendingHexMutations: [...(state.pendingHexMutations ?? []), ...newMutations],
    tickEvents: [...state.tickEvents, ...newEvents],
    pendingSpherePressures: pressures,
  };
}

// ─── Essence Generation Extension ─────────────────────────────────────────────

/**
 * Compute additional essence generation from active control effects.
 * Called by computeEssenceGeneration (or its consumers) to include
 * control effect income in the total generation rate.
 */
export function computeControlEffectIncome(
  controlEffects: readonly ControlEffect[],
): Partial<Record<SphereName, number>> {
  const income: Partial<Record<SphereName, number>> = {};

  for (const effect of controlEffects) {
    if (!effect.active || !effect.perTickIncome) continue;
    for (const [sphere, amount] of Object.entries(effect.perTickIncome)) {
      const s = sphere as SphereName;
      income[s] = (income[s] ?? 0) + (amount as number);
    }
  }

  return income;
}
