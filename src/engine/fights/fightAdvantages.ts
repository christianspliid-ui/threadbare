/**
 * Advantages the world lends a fighter (THR-1543, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §11, THR-1532, THR-1271).
 *
 * *Fight advantage* (UL): an edge from the world, in the everyday sense — an old
 * wound, a secret, a favour, a company at your side. Never a graph **Edge**.
 *
 * Three halves, kept apart on purpose:
 *
 *  - `readFightAdvantages` — **pure**. Reads the graph once, at fight start, and
 *    returns the advantages as named terms. The attended forecast calls it from the
 *    UI (plan doc §3b), so it writes nothing: a forecast drawn ten times spends
 *    nothing.
 *  - `fightAdvantageModifiers` — which of a fight's advantages bear on *this* step,
 *    as named modifiers with no hidden number.
 *  - `spendFavourAtFightStart` / `spendSecretAfterClash` — the two costs, paid only
 *    by the fight handler inside `executeStepResult`, and only through the writers
 *    the rest of the game already uses (`redeemFavor`, the secret reveal). A spent
 *    favour is **redeemed** and a spent secret **revealed**; neither edge is ever
 *    removed — the world remembers that someone was owed, and what was known. An
 *    appointment's promise is never touched.
 */

import type { GameState, TickEvent } from '../../types/gameState';
import type { GraphEdge } from '../../types/graph';
import type { KnowsSecretOfEdgeProperties } from '../../types/secretsFavors';
import type { FightAdvantage, FightNamedModifier, FightRole, FightState } from '../../types/fight';
import type { WorldGraph } from '../graph';
import {
  FIGHT_ADVANTAGE_BLESSED,
  FIGHT_ADVANTAGE_CURSED,
  FIGHT_ADVANTAGE_KEYS,
  FIGHT_ADVANTAGE_LABELS,
  FIGHT_ADVANTAGE_OLD_WOUND,
  FIGHT_ADVANTAGE_SECRET,
  FIGHT_ADVANTAGE_STORIED,
  FIGHT_ADVANTAGE_STORIED_MIN_LEVEL,
  FIGHT_ALLY_ASSIST,
  FIGHT_ALLY_MAX,
  FIGHT_BLESSED_CONDITION_ID,
  FIGHT_CURSED_CONDITION_ID,
} from '../../data/fight-constants';
import { ARTIFACT_CURSED_TRAIT_ID, ARTIFACT_STORIED_TRAIT_ID } from '../../data/artifact-trait-content';
import { isAgentGone } from '../groups/groupQueries';
import { isLiveFavorEdge, redeemFavor } from '../leverageOps';
import { isAppointmentFavour } from '../appointments';
import { applySecretRevelationConsequences } from '../secretsFavorsConsequences';
import { isInjuryProvenance } from '../undertakingMotive';
import { agentHexOf, getCompanyMembersAtHex } from './fightAllies';

function label(key: string, names: { opponent?: string; ally?: string } = {}): string {
  return (FIGHT_ADVANTAGE_LABELS[key] ?? key)
    .replace(/\{opponent\}/g, names.opponent ?? 'the foe')
    .replace(/\{ally\}/g, names.ally ?? 'An ally');
}

function hasCondition(graph: WorldGraph, agentId: string, conditionTraitId: string): boolean {
  return graph.getOutgoingEdges(agentId, 'has_trait').some((e) => e.target === conditionTraitId);
}

/** The things a fighter carries: possessed or bonded. */
function carriedThings(graph: WorldGraph, fighterId: string): string[] {
  return [
    ...graph.getOutgoingEdges(fighterId, 'possesses'),
    ...graph.getOutgoingEdges(fighterId, 'bonded_to'),
  ].map((e) => e.target);
}

function storiedLevel(graph: WorldGraph, artifactId: string): number {
  const edge = graph.getEdge(`e.has_trait.${artifactId}.${ARTIFACT_STORIED_TRAIT_ID}`);
  if (!edge) return 0;
  const level = edge.properties?.level;
  return typeof level === 'number' && Number.isFinite(level) ? level : 1;
}

function carriesCursedThing(graph: WorldGraph, fighterId: string): boolean {
  return carriedThings(graph, fighterId).some(
    (id) => graph.getEdge(`e.has_trait.${id}.${ARTIFACT_CURSED_TRAIT_ID}`) !== undefined,
  );
}

/** A live, unrevealed secret the fighter holds about the opponent, the heaviest first. */
function liveSecretEdge(graph: WorldGraph, fighterId: string, opponentId: string): GraphEdge | undefined {
  const edges = graph.getOutgoingEdges(fighterId, 'knows_secret_of')
    .filter((e) => e.target === opponentId && e.properties?.revealed !== true);
  if (edges.length === 0) return undefined;
  return edges.reduce((a, b) => (
    ((b.properties.magnitude as number) ?? 0) > ((a.properties.magnitude as number) ?? 0) ? b : a
  ));
}

/**
 * A favour the fighter can call in: owed to them by a living mortal on their hex,
 * live, and not an appointment's promise. Never the opponent, never someone
 * already counted as an ally.
 */
function callableFavourEdge(
  graph: WorldGraph,
  fighterId: string,
  opponentId: string | null,
  alreadyAllies: ReadonlySet<string>,
): GraphEdge | undefined {
  const hex = agentHexOf(graph, fighterId);
  if (!hex) return undefined;
  const edges = graph.getIncomingEdges(fighterId, 'owes_favor')
    .filter((e) => isLiveFavorEdge(e.properties) && !isAppointmentFavour(e))
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const edge of edges) {
    const debtorId = edge.source;
    if (debtorId === fighterId || debtorId === opponentId || alreadyAllies.has(debtorId)) continue;
    if (isAgentGone(graph.getNode(debtorId))) continue;
    const at = agentHexOf(graph, debtorId);
    if (at && at.col === hex.col && at.row === hex.row) return edge;
  }
  return undefined;
}

/**
 * The advantages a fighter brings to a fight against `opponentId` — read once, at
 * fight start (plan doc §11). Pure: nothing is spent here.
 *
 * Deterministic order (the table's): old wound, their secret, company allies (join
 * order, capped at `FIGHT_ALLY_MAX`), a favour called, Storied arms, Blessed,
 * Cursed. Fail-soft: a throw anywhere reads as no advantages.
 */
export function readFightAdvantages(
  state: Pick<GameState, 'graph'>,
  fighterId: string,
  opponentId: string | null,
): FightAdvantage[] {
  try {
    const graph = state.graph;
    if (!graph.getNode(fighterId)) return [];
    const opponentName = opponentId ? graph.getNode(opponentId)?.name : undefined;
    const out: FightAdvantage[] = [];

    if (opponentId) {
      const grudge = graph.getOutgoingEdges(fighterId, 'hostile_to')
        .find((e) => e.target === opponentId && isInjuryProvenance(e.properties as Record<string, unknown>));
      if (grudge) {
        out.push({
          key: FIGHT_ADVANTAGE_KEYS.oldWound,
          label: label(FIGHT_ADVANTAGE_KEYS.oldWound, { opponent: opponentName }),
          delta: FIGHT_ADVANTAGE_OLD_WOUND,
          appliesTo: 'clash',
          sourceId: grudge.id,
        });
      }
      const secret = liveSecretEdge(graph, fighterId, opponentId);
      if (secret) {
        out.push({
          key: FIGHT_ADVANTAGE_KEYS.secret,
          label: label(FIGHT_ADVANTAGE_KEYS.secret, { opponent: opponentName }),
          delta: FIGHT_ADVANTAGE_SECRET,
          appliesTo: 'first_behind_clash',
          sourceId: secret.id,
        });
      }
    }

    const company = getCompanyMembersAtHex(graph, fighterId, [opponentId]).slice(0, FIGHT_ALLY_MAX);
    const allies = new Set(company.map((m) => m.id));
    for (const member of company) {
      out.push({
        key: FIGHT_ADVANTAGE_KEYS.company,
        label: label(FIGHT_ADVANTAGE_KEYS.company, { ally: member.name }),
        delta: FIGHT_ALLY_ASSIST,
        appliesTo: 'clash',
        sourceId: member.id,
      });
    }

    const favour = callableFavourEdge(graph, fighterId, opponentId, allies);
    if (favour) {
      out.push({
        key: FIGHT_ADVANTAGE_KEYS.favour,
        label: label(FIGHT_ADVANTAGE_KEYS.favour, { ally: graph.getNode(favour.source)?.name }),
        delta: FIGHT_ALLY_ASSIST,
        appliesTo: 'clash',
        sourceId: favour.id,
      });
    }

    const storied = carriedThings(graph, fighterId)
      .find((id) => storiedLevel(graph, id) >= FIGHT_ADVANTAGE_STORIED_MIN_LEVEL);
    if (storied) {
      out.push({
        key: FIGHT_ADVANTAGE_KEYS.storied,
        label: label(FIGHT_ADVANTAGE_KEYS.storied),
        delta: FIGHT_ADVANTAGE_STORIED,
        appliesTo: 'nerve',
        sourceId: storied,
      });
    }

    if (hasCondition(graph, fighterId, FIGHT_BLESSED_CONDITION_ID)) {
      out.push({
        key: FIGHT_ADVANTAGE_KEYS.blessed,
        label: label(FIGHT_ADVANTAGE_KEYS.blessed),
        delta: FIGHT_ADVANTAGE_BLESSED,
        appliesTo: 'nerve',
      });
    }

    if (hasCondition(graph, fighterId, FIGHT_CURSED_CONDITION_ID) || carriesCursedThing(graph, fighterId)) {
      out.push({
        key: FIGHT_ADVANTAGE_KEYS.cursed,
        label: label(FIGHT_ADVANTAGE_KEYS.cursed),
        delta: FIGHT_ADVANTAGE_CURSED,
        appliesTo: 'clash',
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * The advantages that bear on this step, as named modifiers (plan doc §11). The
 * secret applies on the first clash where the fighter is behind — more wounding
 * exchanges taken than blows landed — and only while it is unspent.
 */
export function fightAdvantageModifiers(
  advantages: readonly FightAdvantage[],
  role: FightRole,
  fight: Pick<FightState, 'wounds' | 'blowsLanded'> | undefined,
): FightNamedModifier[] {
  const behind = fight ? fight.wounds > fight.blowsLanded : false;
  const out: FightNamedModifier[] = [];
  for (const adv of advantages) {
    const applies = adv.appliesTo === role
      || (adv.appliesTo === 'first_behind_clash' && role === 'clash' && behind && !adv.spent);
    if (applies && adv.delta !== 0) out.push({ name: `advantage:${adv.key}`, delta: adv.delta, label: adv.label });
  }
  return out;
}

/** Whether the secret advantage applied to the clash about to resolve (read before it lands). */
export function secretAppliesToClash(
  fight: Pick<FightState, 'advantages' | 'wounds' | 'blowsLanded'> | undefined,
): FightAdvantage | undefined {
  if (!fight || fight.wounds <= fight.blowsLanded) return undefined;
  return fight.advantages.find((a) => a.key === FIGHT_ADVANTAGE_KEYS.secret && !a.spent);
}

function markSpent(advantages: readonly FightAdvantage[], target: FightAdvantage): FightAdvantage[] {
  return advantages.map((a) => (a === target ? { ...a, spent: true } : a));
}

/**
 * Spend the favour advantage when the handler creates `fightState` — exactly once
 * per fight, through `redeemFavor` (plan doc §11). A favour already gone (redeemed
 * or broken elsewhere) is skipped: the advantage still applies, since it was read
 * at fight start (fail-soft table).
 */
export function spendFavourAtFightStart(
  state: Pick<GameState, 'graph'>,
  fighterId: string,
  advantages: readonly FightAdvantage[],
  tick: number,
  actionId: string,
): FightAdvantage[] {
  const favour = advantages.find((a) => a.key === FIGHT_ADVANTAGE_KEYS.favour && !a.spent);
  if (!favour?.sourceId) return [...advantages];
  // `redeemFavor` goes through `applyFavorRedemptionConsequences`, which traces
  // `favor_redeemed`; a favour already gone is refused there and skipped here.
  redeemFavor(state.graph, fighterId, favour.sourceId, tick, `fight:${actionId}`);
  return markSpent(advantages, favour);
}

/**
 * Spend the secret after the clash it applied to (plan doc §11): the fighter throws
 * it in the opponent's face. Revealed through the secret reveal path — the edge is
 * retained and stops being live, the "exposed mark". Returns the chronicle events
 * the reveal wrote.
 */
export function spendSecretAfterClash(
  state: GameState,
  fighterId: string,
  opponentId: string | null,
  advantages: readonly FightAdvantage[],
  applied: FightAdvantage,
): { advantages: FightAdvantage[]; events: TickEvent[] } {
  const spent = markSpent(advantages, applied);
  if (!applied.sourceId || !opponentId) return { advantages: spent, events: [] };
  const edge = state.graph.getEdge(applied.sourceId);
  if (!edge || edge.properties?.revealed === true) return { advantages: spent, events: [] };
  try {
    const before = state.tickEvents.length;
    const patch = applySecretRevelationConsequences(
      edge.properties as unknown as KnowsSecretOfEdgeProperties,
      edge.id,
      fighterId,
      opponentId,
      opponentId,
      state,
    );
    return { advantages: spent, events: (patch.tickEvents ?? []).slice(before) };
  } catch {
    return { advantages: spent, events: [] };
  }
}
