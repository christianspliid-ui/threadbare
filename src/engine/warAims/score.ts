/**
 * warAims/score.ts — the richest enemy town in reach (THR-1933 § Engine 3).
 *
 * Candidates: every settlement whose tax holder is an enemy (`isEnemyFaction`), that the
 * army's faction may attack (`hallBarsAttack` — no own hall town unless it was taken
 * from it), that is not a ruin, and that is **in reach**: the army has a march path to
 * it and it lies within `WAR_AIM_MAX_REACH_HEXES` (plus a supply line from it when
 * `WAR_AIM_REQUIRE_SUPPLY_REACH` is on — off since the kill criterion fired).
 *
 *   score = value × (1 + bonuses) ÷ (1 + hexes / WAR_AIM_HALF_VALUE_HEXES)
 *
 * ×`WAR_AIM_REVENGE_FOCUS` for a revenge army on the town of the faction it holds its
 * grievance against. Highest score wins; ties by fewer hexes, then id. No candidate →
 * the army holds. Deterministic: no random draw (NFP #3).
 */

import type { GameState } from '../../types/gameState';
import type { ArmyObjective, WarAimCandidate, WarAimReason } from '../../types/army';
import type { HexCoord } from '../../types';
import { hexDistance } from '../../lib/hexMath';
import { resolveSupplyLine } from '../armySupply';
import { findAllShortestPaths } from '../pathfinding';
import { RUINED_SETTLEMENT_PROSPERITY_FLOOR } from '../../data/strategic-action-constants';
import {
  WAR_AIM_HALF_VALUE_HEXES,
  WAR_AIM_MAX_REACH_HEXES,
  WAR_AIM_BONUS_FEEDS_STAPLE,
  WAR_AIM_REVENGE_FOCUS,
  WAR_AIM_TOP_CANDIDATES,
  WAR_AIM_REQUIRE_SUPPLY_REACH,
} from '../../data/war-aims-constants';
import { isEnemyFaction, hallBarsAttack, mayBesiege } from './enemy';
import { townValueFor, feedsLackingStaple, scarceStaplesOf, monopolyBonusFor } from './townValue';
import { placeTierLocationOf, type WarAimContext } from './context';

export interface ScoredTown extends WarAimCandidate {
  reason: Exclude<WarAimReason, 'defence'>;
  reasonResourceId?: string;
}

export interface WarAimPick {
  /** The conquer objective, or null when the army holds. */
  objective: ArmyObjective | null;
  /** Every in-reach enemy town scored, best first. */
  scored: ScoredTown[];
  /** Enemy-held towns left out because they were out of reach. */
  outOfReach: number;
  /** Enemy factions that hold any settlement. */
  enemiesKnown: number;
  /** The fewest-hex in-reach candidate (the "not just the nearest" predicate). */
  nearestEnemyTownId: string | null;
}

/**
 * Locations an army can march to: one single-source path run from exactly where it
 * stands — the same start `phaseArmyMovement` paths from, so an army in a sublocation
 * (a warhost raised in a hall) reaches nothing and holds rather than taking a target it
 * can never march to — plus its place-tier Location. Null when it stands nowhere pathable.
 */
export function marchableFrom(ctx: WarAimContext, armyId: string): ReadonlySet<string> | null {
  const start = ctx.graph.getOutgoingEdges(armyId, 'located_at')[0]?.target;
  if (!start || ctx.graph.getNode(start)?.type !== 'location') return null;
  try {
    const out = new Set<string>(findAllShortestPaths(ctx.graph, armyId, start).keys());
    out.add(start);
    const place = placeTierLocationOf(ctx.graph, armyId);
    if (place) out.add(place);
    return out;
  } catch {
    return null; // fail-soft: no reach rather than a thrown tick
  }
}

export interface PickOptions {
  /** Revenge: towns held by this faction score ×`WAR_AIM_REVENGE_FOCUS`. */
  grievanceFactionId?: string | null;
}

function isRuin(prosperity: unknown): boolean {
  return typeof prosperity === 'number' && prosperity <= RUINED_SETTLEMENT_PROSPERITY_FLOOR;
}

/** Whether `townId` is a valid conquer target for `factionId` right now (re-aim keep test). */
export function stillEnemyTarget(ctx: WarAimContext, factionId: string, townId: string): boolean {
  const town = ctx.towns.get(townId);
  if (!town || !town.holderId) return false;
  if (!isEnemyFaction(ctx.graph, factionId, town.holderId)) return false;
  if (hallBarsAttack(ctx.graph, factionId, townId)) return false;
  // The siege start names the holder by the first `controls` edge, which can differ from
  // the tax holder; a town the army could reach but never besiege is no target.
  const siegeHolder = ctx.graph.getIncomingEdges(townId, 'controls')[0]?.source;
  if (!mayBesiege(ctx.graph, factionId, siegeHolder, townId)) return false;
  return !isRuin(town.node.properties.prosperity);
}

/**
 * Whether `townId` is in reach of an army at `armyHex` for `factionId`: within the hex
 * backstop and, given `marchable` (`marchableFrom`), on a march path. Null `marchable`
 * skips the path test (a caller with no army, e.g. a planner).
 */
export function inReach(
  state: GameState,
  ctx: WarAimContext,
  factionId: string,
  armyHex: HexCoord,
  townId: string,
  marchable: ReadonlySet<string> | null = null,
): boolean {
  const town = ctx.towns.get(townId);
  if (!town) return false;
  if (hexDistance(armyHex, town.hex) > WAR_AIM_MAX_REACH_HEXES) return false;
  if (marchable && !marchable.has(townId)) return false;
  if (!WAR_AIM_REQUIRE_SUPPLY_REACH) return true;
  try {
    return resolveSupplyLine(state, townId, factionId).hostId !== null;
  } catch {
    return false; // fail-soft: an unwalkable town is out of reach
  }
}

export function pickWarAim(
  state: GameState,
  ctx: WarAimContext,
  factionId: string,
  armyHex: HexCoord,
  opts: PickOptions = {},
  marchable: ReadonlySet<string> | null = null,
): WarAimPick {
  const scarce = scarceStaplesOf(ctx, factionId);
  const enemies = new Set<string>();
  const scored: ScoredTown[] = [];
  let outOfReach = 0;

  for (const town of ctx.towns.values()) {
    if (!town.holderId || !stillEnemyTarget(ctx, factionId, town.node.id)) continue;
    enemies.add(town.holderId);
    if (!inReach(state, ctx, factionId, armyHex, town.node.id, marchable)) { outOfReach++; continue; }

    const hexes = hexDistance(armyHex, town.hex);
    const value = townValueFor(ctx, town.node.id);
    const staple = feedsLackingStaple(ctx, town.node.id, scarce);
    const monopoly = monopolyBonusFor(ctx, factionId, town.node.id);
    const bonuses = monopoly + (staple ? WAR_AIM_BONUS_FEEDS_STAPLE : 0);
    let score = value * (1 + bonuses) / (1 + hexes / WAR_AIM_HALF_VALUE_HEXES);
    if (opts.grievanceFactionId && town.holderId === opts.grievanceFactionId) score *= WAR_AIM_REVENGE_FOCUS;
    scored.push({
      townId: town.node.id,
      value,
      bonuses,
      hexes,
      score,
      inReach: true,
      reason: staple ? 'feeds_staple' : 'richest',
      ...(staple ? { reasonResourceId: staple } : {}),
    });
  }

  scored.sort((a, b) => b.score - a.score || a.hexes - b.hexes || (a.townId < b.townId ? -1 : a.townId > b.townId ? 1 : 0));
  let nearest: ScoredTown | null = null;
  for (const s of scored) {
    if (!nearest || s.hexes < nearest.hexes || (s.hexes === nearest.hexes && s.townId < nearest.townId)) nearest = s;
  }

  const best = scored[0];
  const objective: ArmyObjective | null = best
    ? {
      type: 'conquer',
      targetNodeId: best.townId,
      estimatedAttrition: 0,
      reason: best.reason,
      ...(best.reasonResourceId ? { reasonResourceId: best.reasonResourceId } : {}),
      source: 'war_aim',
    }
    : null;
  return { objective, scored, outOfReach, enemiesKnown: enemies.size, nearestEnemyTownId: nearest?.townId ?? null };
}

/** The top scored towns, stripped to the debug shape stored on the army. */
export function topCandidates(scored: readonly ScoredTown[]): WarAimCandidate[] {
  return scored.slice(0, WAR_AIM_TOP_CANDIDATES)
    .map(({ townId, value, bonuses, hexes, score, inReach: r }) => ({ townId, value, bonuses, hexes, score, inReach: r }));
}
