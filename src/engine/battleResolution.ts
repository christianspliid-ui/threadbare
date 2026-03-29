/**
 * Battle Resolution — TB-073 Phase 3.
 *
 * Handles battle creation, per-tick processing, momentum shifts, and resolution.
 * Battles are graph nodes that armies participate in via `participates_in` edges.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 3
 * NFP: Determinism (momentum calculation deterministic, spotlight uses seeded PRNG),
 *       Inspectability (BattleTrace), Fail-soft (max duration forces resolution).
 */

import type { GameState } from '../types/gameState';
import type { BattleState, BattleResolutionType } from '../types/battle';
import type { ArmyState } from '../types/army';
import {
  BATTLE_RESOLUTION_THRESHOLD,
  FIELD_BATTLE_SPOTLIGHT_INTERVAL,
  FIELD_BATTLE_MAX_DURATION,
  BATTLE_COMBAT_ATTRITION,
  SIZE_MOMENTUM_SCALE,
  BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE,
} from '../types/battle';
import { ARMY_SIZE_HEADCOUNT } from '../types/army';
import { emitTrace } from './traceBuffer';

// ─── PRNG ───────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Initial Momentum ───────────────────────────────────────────────────

/**
 * Calculate initial battle momentum from army sizes.
 *
 * Uses log2 compression so a 2:1 advantage gives +1 momentum, 4:1 gives +2.
 * Clamped so spotlights always matter (at least 2 momentum of space).
 * Positive = attacker advantage, negative = defender advantage.
 * Deterministic — no PRNG.
 */
export function calculateInitialMomentum(
  attackerHeadcount: number,
  defenderHeadcount: number,
  defenderModifier: number = 1,
): number {
  if (defenderHeadcount <= 0 || attackerHeadcount <= 0) return 0;

  const effectiveDefender = defenderHeadcount * defenderModifier;
  const sizeRatio = attackerHeadcount / effectiveDefender;

  // log2 compression: 2:1 = +1.5, 4:1 = +3, 1:2 = -1.5
  const rawMomentum = Math.log2(sizeRatio) * SIZE_MOMENTUM_SCALE;

  // Clamp so spotlights always matter
  const maxInitial = BATTLE_RESOLUTION_THRESHOLD - 2;
  return Math.max(-maxInitial, Math.min(maxInitial, rawMomentum));
}

// ─── Battle Creation ────────────────────────────────────────────────────

/**
 * Create a battle node when two hostile armies are at the same hex.
 * Returns the battle node ID.
 */
export function createBattleNode(
  state: GameState,
  attackerArmyId: string,
  defenderArmyId: string,
  hexId: string,
): string | null {
  const graph = state.graph;
  const attackerNode = graph.getNode(attackerArmyId);
  const defenderNode = graph.getNode(defenderArmyId);
  const hexNode = graph.getNode(hexId);

  if (!attackerNode || !defenderNode || !hexNode) return null;

  const attackerState = attackerNode.properties.armyState as ArmyState | undefined;
  const defenderState = defenderNode.properties.armyState as ArmyState | undefined;

  if (!attackerState || !defenderState) return null;

  const initialMomentum = calculateInitialMomentum(
    attackerState.headcount,
    defenderState.headcount,
  );

  const battleId = `battle_${attackerArmyId}_${defenderArmyId}_${state.tick}`;

  const battleState: BattleState = {
    battleType: 'field_battle',
    momentum: initialMomentum,
    backgroundProse: `The armies clash near ${hexNode.name}.`,
    spotlightHistory: [],
    ticksSinceLastSpotlight: 0,
    startedTick: state.tick,
    initialMomentumOffset: initialMomentum,
    attackerArmyId,
    defenderArmyId,
  };

  try {
    // Create battle actor node
    graph.addNode({
      id: battleId,
      type: 'actor',
      name: `Battle at ${hexNode.name}`,
      properties: {
        actorType: 'group',
        battleState,
      },
    });

    // participates_in: attacker → battle
    graph.addEdge({
      id: `e_participates_${attackerArmyId}_${battleId}`,
      source: attackerArmyId,
      target: battleId,
      type: 'participates_in',
      properties: { role: 'attacker', joinedTick: state.tick },
    });

    // participates_in: defender → battle
    graph.addEdge({
      id: `e_participates_${defenderArmyId}_${battleId}`,
      source: defenderArmyId,
      target: battleId,
      type: 'participates_in',
      properties: { role: 'defender', joinedTick: state.tick },
    });

    // located_at: battle → hex
    graph.addEdge({
      id: `e_located_at_${battleId}`,
      source: battleId,
      target: hexId,
      type: 'located_at',
      properties: {},
    });

    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Battle started at ${hexNode.name}: ${attackerNode.name} vs ${defenderNode.name} (momentum: ${initialMomentum.toFixed(1)})`,
      event: 'battle_started',
      battleId,
      attackerArmyId,
      defenderArmyId,
      hexId,
      momentum: initialMomentum,
    });

    return battleId;
  } catch (err) {
    try { graph.removeNode(battleId); } catch { /* cleanup */ }
    return null;
  }
}

// ─── Battle Ticking ─────────────────────────────────────────────────────

/**
 * Process one tick of an active battle.
 *
 * 1. Apply combat attrition to both armies
 * 2. Apply per-tick momentum drift (attacker loses slight momentum over time)
 * 3. Check spotlight eligibility
 * 4. If spotlight due, shift momentum
 * 5. Check resolution conditions
 */
export function tickBattle(state: GameState, battleNodeId: string): void {
  const graph = state.graph;
  const battleNode = graph.getNode(battleNodeId);
  if (!battleNode) return;

  const bs = battleNode.properties.battleState as BattleState;
  if (!bs) return;

  const ticksElapsed = state.tick - bs.startedTick;

  // Get participating armies
  const attackerNode = graph.getNode(bs.attackerArmyId);
  const defenderNode = graph.getNode(bs.defenderArmyId);

  // If either army is gone, resolve immediately
  if (!attackerNode || !defenderNode) {
    const resolutionType: BattleResolutionType = !attackerNode && !defenderNode
      ? 'mutual_destruction'
      : !attackerNode ? 'defender_victory' : 'attacker_victory';
    resolveBattle(state, battleNodeId, resolutionType);
    return;
  }

  const attackerState = attackerNode.properties.armyState as ArmyState;
  const defenderState = defenderNode.properties.armyState as ArmyState;

  // 1. Apply combat attrition to both armies
  const newAttackerQ = Math.max(0, attackerState.quintessence - BATTLE_COMBAT_ATTRITION);
  const newDefenderQ = Math.max(0, defenderState.quintessence - BATTLE_COMBAT_ATTRITION);

  graph.updateNode(bs.attackerArmyId, {
    properties: {
      ...attackerNode.properties,
      armyState: { ...attackerState, quintessence: newAttackerQ },
    },
  });
  graph.updateNode(bs.defenderArmyId, {
    properties: {
      ...defenderNode.properties,
      armyState: { ...defenderState, quintessence: newDefenderQ },
    },
  });

  // 2. Spotlight processing
  let momentumShift = 0;
  const newTicksSinceSpotlight = bs.ticksSinceLastSpotlight + 1;

  if (newTicksSinceSpotlight >= FIELD_BATTLE_SPOTLIGHT_INTERVAL) {
    // Spawn a spotlight — simplified: apply a momentum shift based on seeded PRNG
    const rng = mulberry32(state.seed + state.tick * 59 + battleNodeId.length);
    // Roll determines which side gains advantage this tick
    const roll = rng();
    if (roll < 0.4) {
      momentumShift = BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE; // attacker gains
    } else if (roll < 0.8) {
      momentumShift = -BATTLE_MOMENTUM_PER_SPOTLIGHT_BASE; // defender gains
    }
    // 20% chance of no shift (stalemate tick)
  }

  const newMomentum = bs.momentum + momentumShift;
  const newSpotlightHistory = momentumShift !== 0
    ? [...bs.spotlightHistory, `tick_${state.tick}_shift_${momentumShift > 0 ? 'attacker' : 'defender'}`]
    : bs.spotlightHistory;

  // Update battle state
  const updatedBattleState: BattleState = {
    ...bs,
    momentum: newMomentum,
    ticksSinceLastSpotlight: momentumShift !== 0 ? 0 : newTicksSinceSpotlight,
    spotlightHistory: newSpotlightHistory,
  };

  graph.updateNode(battleNodeId, {
    properties: { ...battleNode.properties, battleState: updatedBattleState },
  });

  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Battle tick at ${battleNode.name}: momentum ${bs.momentum.toFixed(1)}→${newMomentum.toFixed(1)}`,
    event: 'battle_tick',
    battleId: battleNodeId,
    momentum: newMomentum,
    momentumShift,
    ticksElapsed,
    attackerQ: newAttackerQ,
    defenderQ: newDefenderQ,
  });

  // 3. Check resolution conditions
  if (Math.abs(newMomentum) >= BATTLE_RESOLUTION_THRESHOLD) {
    const resolutionType: BattleResolutionType = newMomentum > 0
      ? 'attacker_victory' : 'defender_victory';
    resolveBattle(state, battleNodeId, resolutionType);
    return;
  }

  // Max duration check
  if (ticksElapsed >= FIELD_BATTLE_MAX_DURATION) {
    const resolutionType: BattleResolutionType =
      Math.abs(newMomentum) < 2 ? 'stalemate'
        : newMomentum > 0 ? 'attacker_victory' : 'defender_victory';
    resolveBattle(state, battleNodeId, resolutionType);
    return;
  }

  // Army collapse check
  if (newAttackerQ <= 0 && newDefenderQ <= 0) {
    resolveBattle(state, battleNodeId, 'mutual_destruction');
  } else if (newAttackerQ <= 0) {
    resolveBattle(state, battleNodeId, 'defender_victory');
  } else if (newDefenderQ <= 0) {
    resolveBattle(state, battleNodeId, 'attacker_victory');
  }
}

// ─── Battle Resolution ──────────────────────────────────────────────────

/**
 * Resolve a battle: determine outcome, remove battle node, emit trace.
 * Aftermath (destruction, commander fate) is handled by battleAftermath.ts (M2-06).
 */
export function resolveBattle(
  state: GameState,
  battleNodeId: string,
  resolutionType: BattleResolutionType,
): void {
  const graph = state.graph;
  const battleNode = graph.getNode(battleNodeId);
  if (!battleNode) return;

  const bs = battleNode.properties.battleState as BattleState;

  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Battle "${battleNode.name}" resolved: ${resolutionType} (final momentum: ${bs.momentum.toFixed(1)})`,
    event: 'battle_resolved',
    battleId: battleNodeId,
    resolutionType,
    finalMomentum: bs.momentum,
    ticksElapsed: state.tick - bs.startedTick,
    spotlightCount: bs.spotlightHistory.length,
    attackerArmyId: bs.attackerArmyId,
    defenderArmyId: bs.defenderArmyId,
  });

  // Remove battle node (cleans up participates_in and located_at edges)
  graph.removeNode(battleNodeId);
}

// ─── Battle Detection Phase ─────────────────────────────────────────────

/**
 * Detect hostile army colocations and create battle nodes.
 * Runs after phaseMovement and phaseArmyAttrition, before phaseColocationDetection.
 *
 * Two armies are hostile if they belong to different factions.
 */
export function phaseBattleDetection(state: GameState): void {
  const graph = state.graph;

  // Find all armies and group by location
  const armyNodes = graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null);

  const armiesByLocation = new Map<string, string[]>();
  for (const army of armyNodes) {
    // Skip armies already in a battle
    const battleEdges = graph.getOutgoingEdges(army.id, 'participates_in');
    if (battleEdges.length > 0) continue;

    const locEdges = graph.getOutgoingEdges(army.id, 'located_at');
    const locId = locEdges[0]?.target;
    if (!locId) continue;

    if (!armiesByLocation.has(locId)) armiesByLocation.set(locId, []);
    armiesByLocation.get(locId)!.push(army.id);
  }

  // Check for hostile pairs at each location
  for (const [hexId, armyIds] of armiesByLocation) {
    if (armyIds.length < 2) continue;

    for (let i = 0; i < armyIds.length; i++) {
      for (let j = i + 1; j < armyIds.length; j++) {
        const armyA = armyIds[i];
        const armyB = armyIds[j];

        if (areHostile(state, armyA, armyB)) {
          // Attacker = army that moved more recently (higher raisedTick or arrived later)
          const stateA = graph.getNode(armyA)?.properties.armyState as ArmyState | undefined;
          const stateB = graph.getNode(armyB)?.properties.armyState as ArmyState | undefined;
          const attackerId = (stateA?.raisedTick ?? 0) >= (stateB?.raisedTick ?? 0) ? armyA : armyB;
          const defenderId = attackerId === armyA ? armyB : armyA;

          createBattleNode(state, attackerId, defenderId, hexId);
        }
      }
    }
  }
}

/**
 * Check if two armies are hostile (belong to different factions).
 */
function areHostile(state: GameState, armyA: string, armyB: string): boolean {
  const graph = state.graph;
  const factionA = graph.getOutgoingEdges(armyA, 'member_of')[0]?.target;
  const factionB = graph.getOutgoingEdges(armyB, 'member_of')[0]?.target;

  // Different factions = hostile (simplified — no alliance system yet)
  if (!factionA || !factionB) return false;
  return factionA !== factionB;
}

// ─── Battle Tick Phase ──────────────────────────────────────────────────

/**
 * Tick all active battles. Runs each tick.
 */
export function phaseBattleTick(state: GameState): void {
  const battleNodes = state.graph.getNodesByType('actor')
    .filter(n => n.properties.battleState != null);

  for (const battle of battleNodes) {
    tickBattle(state, battle.id);
  }
}
