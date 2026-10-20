/**
 * War aims (THR-1933, slice S1) — armies march only on enemies, defend first, and
 * otherwise march on the enemy town worth most to their purse.
 *
 * Plan: `Docs/plans/2026-10-15-thr-1933-war-aims.md`. Decisions: THR-1868 (the rule),
 * kept by Christian 2026-10-15.
 *
 * - `aimArmy(state, armyId)` — one army's objective, written in place. Called by
 *   `spawnArmy` at the raise and by the daily re-aim.
 * - `reaimArmies(state, getProjection)` — first inside `phaseArmyMovement`, once a day
 *   (`WAR_AIM_REAIM_INTERVAL_TICKS`), in army id order. Skips armies in a battle or
 *   siege and a notable's campaign army. Order: a threat inside the defence radius →
 *   defend it; else a still-valid conquer target in reach is kept (no churn mid-march);
 *   else `pickWarAim`, which may hold.
 *
 * Writes: `armyState.objective` (+ `reason`, `source`), `armyState.holdReason`,
 * `armyState.warAimCandidates`, clears `movementState` on a change so movement paths to
 * the new target the same tick, and the `territorial_expansion` / `revenge` ambition's
 * `targetNodeId`.
 *
 * NFP #3: no random draw — argmax with id ties. NFP #4: each army is wrapped in its own
 * try/catch; a missing hex or faction keeps the army's objective as it was.
 */

import type { GameState } from '../types/gameState';
import type { ArmyObjective, ArmyState } from '../types/army';
import type { HexCoord } from '../types';
import type { WorldGraph } from './graph';
import type { RealmProjection } from './realmProjection';
import { buildRealmProjection } from './realmProjection';
import { emitTrace } from './traceBuffer';
import { FACTION_PURSE_ENABLED } from '../data/faction-purse-constants';
import { WAR_AIMS_ENABLED, WAR_AIM_REAIM_INTERVAL_TICKS } from '../data/war-aims-constants';
import { RIVALRY_SENTIMENT_THRESHOLD } from '../types/factionAction';
import { buildWarAimContext, hexOfActor, placeTierLocationOf, type WarAimContext } from './warAims/context';
import { pickWarAim, stillEnemyTarget, inReach, marchableFrom, topCandidates, type WarAimPick } from './warAims/score';
import { findThreatToDefend, type DefenceTarget } from './warAims/defence';
import { campaignTargetOf, isEnemyFaction } from './warAims/enemy';
import { aimResourceAmbitions } from './warAims/resourceAim';

export type RealmProjectionSource = () => RealmProjection;

export type ReaimWhy = 'threat' | 'target_no_longer_enemy' | 'target_out_of_reach' | 'target_taken' | 'no_objective';

/** Ambition types whose army's conquer target becomes the ambition's own target. */
const TARGETED_AMBITIONS: ReadonlySet<string> = new Set(['territorial_expansion', 'revenge']);

function factionOf(graph: WorldGraph, armyId: string): string | undefined {
  return graph.getOutgoingEdges(armyId, 'member_of')[0]?.target;
}

/** The faction ambition an army pursues (not a campaign composition), or undefined. */
function ambitionOf(graph: WorldGraph, armyId: string) {
  for (const e of graph.getOutgoingEdges(armyId, 'pursues')) {
    const amb = graph.getNode(e.target);
    if (amb && !amb.properties.compositionId) return amb;
  }
  return undefined;
}

/**
 * The faction a revenge ambition holds its grievance against when the ambition names
 * none: the enemy this faction has the worst `relates_to` sentiment toward (ties by
 * id). Null when there is none. A revenge that names its lord (`grievanceSourceId`,
 * written when a town defects — THR-1957) aims at that lord instead (`pickFor`).
 */
export function grievanceFactionOf(graph: WorldGraph, factionId: string): string | null {
  let worst: { id: string; s: number } | null = null;
  for (const e of graph.getOutgoingEdges(factionId, 'relates_to')) {
    const s = e.properties.sentiment;
    if (typeof s !== 'number' || s >= RIVALRY_SENTIMENT_THRESHOLD) continue;
    if (!isEnemyFaction(graph, factionId, e.target)) continue;
    if (!worst || s < worst.s || (s === worst.s && e.target < worst.id)) worst = { id: e.target, s };
  }
  return worst?.id ?? null;
}

function sameObjective(a: ArmyObjective | null | undefined, b: ArmyObjective | null): boolean {
  if (!a || !b) return !a && !b;
  return a.type === b.type && a.targetNodeId === b.targetNodeId;
}

/** Write an army's objective, hold reason and candidates; clear its march when the target changed. */
function writeAim(
  graph: WorldGraph,
  armyId: string,
  objective: ArmyObjective | null,
  pick: WarAimPick | null,
): boolean {
  const node = graph.getNode(armyId);
  const armyState = node?.properties.armyState as ArmyState | undefined;
  if (!node || !armyState) return false;
  const changed = !sameObjective(armyState.objective, objective);
  const next: ArmyState = {
    ...armyState,
    objective,
    holdReason: objective ? null : 'no_enemy_in_reach',
    ...(pick ? { warAimCandidates: topCandidates(pick.scored) } : {}),
  };
  graph.updateNode(armyId, {
    properties: changed ? { armyState: next, movementState: undefined } : { armyState: next },
  });
  return changed;
}

/** Point the army's territorial/revenge ambition at its conquer target. */
function writeAmbitionTarget(graph: WorldGraph, armyId: string, objective: ArmyObjective | null): void {
  if (!objective || objective.type !== 'conquer') return;
  const amb = ambitionOf(graph, armyId);
  if (!amb || !TARGETED_AMBITIONS.has(String(amb.properties.ambitionType))) return;
  if (amb.properties.targetNodeId === objective.targetNodeId) return;
  graph.updateNode(amb.id, { properties: { targetNodeId: objective.targetNodeId } });
}

function tracePicked(state: GameState, armyId: string, factionId: string, pick: WarAimPick): void {
  const best = pick.scored[0];
  if (pick.objective && best) {
    emitTrace({
      tick: state.tick,
      category: 'war.aim.picked',
      summary: `${state.graph.getNode(armyId)?.name ?? armyId} aims at ${state.graph.getNode(best.townId)?.name ?? best.townId} (${best.reason}, score ${best.score.toFixed(2)} of ${pick.scored.length})`,
      armyId,
      factionId,
      townId: best.townId,
      reason: best.reason,
      value: best.value,
      bonuses: best.bonuses,
      hexes: best.hexes,
      score: best.score,
      candidates: pick.scored.length,
      nearestEnemyTownId: pick.nearestEnemyTownId,
    });
  } else {
    emitTrace({
      tick: state.tick,
      category: 'war.aim.hold',
      summary: `${state.graph.getNode(armyId)?.name ?? armyId} holds: no enemy town in reach (${pick.outOfReach} out of reach)`,
      armyId,
      factionId,
      enemiesKnown: pick.enemiesKnown,
      outOfReach: pick.outOfReach,
    });
  }
}

/** Pick by value for one army; the revenge focus reads the army's ambition. */
function pickFor(state: GameState, ctx: WarAimContext, armyId: string, factionId: string, armyHex: HexCoord): WarAimPick {
  const amb = ambitionOf(state.graph, armyId);
  // THR-1957: a revenge the ambition names (a town that defected) aims at that lord
  // while it is still an enemy; otherwise the worst-sentiment enemy, as before.
  const named = amb?.properties.grievanceSourceId;
  const grievanceFactionId = amb?.properties.ambitionType === 'revenge'
    ? (typeof named === 'string' && isEnemyFaction(state.graph, factionId, named)
      ? named
      : grievanceFactionOf(state.graph, factionId))
    : null;
  return pickWarAim(state, ctx, factionId, armyHex, { grievanceFactionId }, marchableFrom(ctx, armyId));
}

function contextFor(state: GameState, getProjection?: RealmProjectionSource): WarAimContext {
  let hexRealmId: ReadonlyMap<string, string> = new Map();
  try {
    hexRealmId = (getProjection ? getProjection() : buildRealmProjection(state.graph, state.tiles ?? [])).hexRealmId;
  } catch {
    // fail-soft: without a projection the tax holder falls back to the strongest controller
  }
  return buildWarAimContext(state.graph, hexRealmId);
}

/**
 * Aim a freshly raised army (called by `spawnArmy`). Defence first, else value; writes
 * the objective (or the hold) and the ambition target. Returns the objective.
 */
export function aimNewArmy(state: GameState, armyId: string, getProjection?: RealmProjectionSource): ArmyObjective | null {
  const graph = state.graph;
  const factionId = factionOf(graph, armyId);
  const armyHex = hexOfActor(graph, armyId);
  if (!factionId || !armyHex) return null;
  const defence = findThreatToDefend(graph, armyId, factionId, armyHex);
  if (defence) {
    writeAim(graph, armyId, defence.objective, null);
    traceDefend(state, armyId, factionId, defence);
    return defence.objective;
  }
  const ctx = contextFor(state, getProjection);
  const pick = pickFor(state, ctx, armyId, factionId, armyHex);
  writeAim(graph, armyId, pick.objective, pick);
  writeAmbitionTarget(graph, armyId, pick.objective);
  tracePicked(state, armyId, factionId, pick);
  return pick.objective;
}

function traceDefend(state: GameState, armyId: string, factionId: string, d: DefenceTarget): void {
  emitTrace({
    tick: state.tick,
    category: 'war.aim.defend',
    summary: `${state.graph.getNode(armyId)?.name ?? armyId} turns to defend ${state.graph.getNode(d.objective.targetNodeId)?.name ?? d.objective.targetNodeId}`,
    armyId,
    factionId,
    holdingId: d.objective.targetNodeId,
    againstArmyId: d.objective.againstArmyId ?? '',
    sworn: d.sworn,
    hexes: d.hexes,
  });
}

function traceReaim(state: GameState, armyId: string, from: ArmyObjective | null | undefined, to: ArmyObjective | null, why: ReaimWhy): void {
  emitTrace({
    tick: state.tick,
    category: 'war.aim.reaim',
    summary: `${state.graph.getNode(armyId)?.name ?? armyId} re-aims (${why}): ${from?.targetNodeId ?? 'none'} → ${to?.targetNodeId ?? 'none'}`,
    armyId,
    from: from ? { type: from.type, targetNodeId: from.targetNodeId } : null,
    to: to ? { type: to.type, targetNodeId: to.targetNodeId } : null,
    why,
  });
}

/** Whether an army is excluded from the re-aim: in a battle or siege, or a campaign army. */
function skipsReaim(graph: WorldGraph, armyId: string, armyState: ArmyState): boolean {
  if (graph.getOutgoingEdges(armyId, 'participates_in').length > 0) return true;
  if (armyState.objective?.source === 'agenda') return true;
  return campaignTargetOf(graph, armyId) !== undefined;
}

/** The daily re-aim. A no-op off the daily gate or with `WAR_AIMS_ENABLED` off. */
export function reaimArmies(state: GameState, getProjection?: RealmProjectionSource): void {
  if (!WAR_AIMS_ENABLED) return;
  if (state.tick % WAR_AIM_REAIM_INTERVAL_TICKS !== 0) return;
  const graph = state.graph;
  let ctx: WarAimContext | null = null;
  // THR-1955 — resource_acquisition ambitions take their target on the same daily gate.
  aimResourceAmbitions(state, () => (ctx ??= contextFor(state, getProjection)));
  const armies = graph.getNodesByType('actor')
    .filter(n => n.properties.armyState != null)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (armies.length === 0) return;

  if (!FACTION_PURSE_ENABLED) {
    emitTrace({
      tick: state.tick,
      category: 'war.aim.value_fallback',
      summary: 'War aims price towns by prosperity: the faction purse is switched off',
      reason: 'purse_disabled',
    });
  }

  for (const army of armies) {
    try {
      const armyState = army.properties.armyState as ArmyState;
      if (skipsReaim(graph, army.id, armyState)) continue;
      const factionId = factionOf(graph, army.id);
      const armyHex = hexOfActor(graph, army.id);
      if (!factionId || !armyHex) continue; // fail-soft: keep the objective as it was
      const current = armyState.objective;

      const defence = findThreatToDefend(graph, army.id, factionId, armyHex);
      if (defence) {
        if (writeAim(graph, army.id, defence.objective, null)) {
          traceReaim(state, army.id, current, defence.objective, 'threat');
          traceDefend(state, army.id, factionId, defence);
        }
        continue;
      }

      ctx ??= contextFor(state, getProjection);
      let why: ReaimWhy = 'no_objective';
      if (current?.type === 'conquer') {
        const here = placeTierLocationOf(graph, army.id);
        if (!ctx.towns.has(current.targetNodeId)) why = 'target_taken';
        else if (!stillEnemyTarget(ctx, factionId, current.targetNodeId)) why = 'target_no_longer_enemy';
        else if (!inReach(state, ctx, factionId, armyHex, current.targetNodeId, marchableFrom(ctx, army.id))) why = 'target_out_of_reach';
        else if (here !== current.targetNodeId) continue; // still valid, still marching: keep it
        else why = 'target_taken';
      }

      const pick = pickFor(state, ctx, army.id, factionId, armyHex);
      if (writeAim(graph, army.id, pick.objective, pick)) {
        traceReaim(state, army.id, current, pick.objective, why);
        tracePicked(state, army.id, factionId, pick);
      }
      writeAmbitionTarget(graph, army.id, pick.objective);
    } catch (err) {
      // fail-soft (NFP #4): this army keeps yesterday's objective; the rest re-aim.
      console.warn(`[war_aims] re-aim failed for ${army.id}; objective kept`, err);
    }
  }
}

/** Debug read: the army's objective, hold reason and last scored candidates. */
export function readWarAims(state: GameState, armyId: string) {
  const armyState = state.graph.getNode(armyId)?.properties.armyState as ArmyState | undefined;
  if (!armyState) return null;
  return {
    objective: armyState.objective ?? null,
    holdReason: armyState.holdReason ?? null,
    candidates: armyState.warAimCandidates ?? [],
  };
}
