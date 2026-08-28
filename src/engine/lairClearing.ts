/**
 * Lair Clearing — THR-1319.
 *
 * The missing half of the lair lifecycle. Lairs seed, escalate, and spread; until
 * this module nothing the world did ever pushed back, because `cleared_lair` had no
 * writer anywhere in `src/` outside test fixtures. Eight readers were waiting on a
 * state the world could not enter — `armyAttrition`'s "cleared lairs don't punish
 * armies" branch, `HexSidebar`'s Cleared Lair block, the cleared icon and its fill
 * colour, `locationSoundKey`, `prose-layer-content`, `wandererStrategicPack`'s
 * wilderness target list, and `lairEscalation`'s whole reinfestation branch.
 *
 * ## Why mortals on the hex, and not an army
 *
 * `clearedByFactionId` reads like an army was meant to do this, and the first design
 * followed that. Measured on seed 42 / medium at tick 168 (a full run): the world holds
 * **1 army against 36 lairs**. A clearing path gated on army colocation would have been
 * a writer with no live caller — the exact defect this ticket exists to close, rebuilt
 * one layer down.
 *
 * Mortal presence is the abundant signal. Measured at tick 120: **18 mortals standing on
 * 2 lair hexes** (11 and 7), recurring every escalation. So the clearer is the ordinary
 * population that has to live beside the thing.
 *
 * Note the presence test is *hex-level*, not `located_at` the lair node. Measured at the
 * node: 10 occupants, all of them the lairs' own `isMonsterElite` bosses, and **zero**
 * mortals — nobody stands inside the den. Hex granularity is also what the awareness
 * model already commits to ("if an agent can see a hex, they can see everything on it").
 *
 * ## Worn down, not one-shot
 *
 * Clearing accumulates `clearingProgress` across escalations rather than resolving in
 * one check. Three reasons: a legendary den should cost sustained pressure, the value is
 * inspectable mid-siege (NFP #2), and it makes lair escalation **positional** instead of
 * purely temporal — a den beside a village gets worn down while it is still minor, and
 * one in true wilderness escalates unopposed because nobody is there to press it.
 *
 * NFP #1 Tunability: every threshold below is a named export.
 * NFP #2 Inspectability: progress is a readable property; traces on press and on clear.
 * NFP #3 Determinism: no randomness — presence and progress are pure functions of state.
 * NFP #4 Fail-soft: missing coordinates, absent nodes, unknown tier → skip that lair.
 */

import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { LairTier } from '../types/monster';
import type { WorldGraph } from './graph';
import { resolveLocationToHex } from './encounterAwareness';
import { isAgentGone } from './groups/groupQueries';
import { emitTrace } from './traceBuffer';

// ─── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/**
 * Fewest mortals on the hex that count as a press at all.
 *
 * A lone traveller and a lone traveller's friend do not take a den. Three is the
 * smallest number the world reads as a party — one above the `minGroupMembers: 2`
 * that the authored Den Assault confrontation asks of a company.
 */
export const LAIR_CLEARING_MIN_CHALLENGERS = 3;

/**
 * Most mortals on the hex that can count toward one press.
 *
 * Without a ceiling a city sharing a lair's hex erases it on the first escalation and
 * the whole tier ladder stops meaning anything. The cap says a war party presses a den;
 * a population does not press harder by being larger.
 */
export const LAIR_CLEARING_MAX_CHALLENGERS = 6;

/**
 * Pressure a lair must absorb before it falls, by tier.
 *
 * Calibrated against the measured world, not chosen for roundness. Escalation runs every
 * 25 ticks and a run reaches twilight around tick 168, so a lair gets ~6 escalations of
 * life. At the cap (6 challengers) that is: minor on the first press, major on the
 * second, legendary on the third. At the floor (3 challengers) legendary needs five —
 * about 125 ticks of a village holding its ground, which is a siege, not a formality.
 */
export const LAIR_CLEARING_RESISTANCE: Record<LairTier, number> = {
  minor: 4,
  major: 8,
  legendary: 14,
};

// ─── Presence ────────────────────────────────────────────────────────────────

/** A mortal pressing a lair, and the faction (if any) the press can be credited to. */
interface Challenger {
  readonly node: GraphNode;
  readonly factionId: string | undefined;
}

/**
 * True when this actor can press a lair.
 *
 * Excludes the dead, the lairs' own bosses, and armies. `isMonsterElite` is the flag the
 * elite writer actually sets — an earlier pass of this module filtered on `isMonster`,
 * which no producer writes, so every boss read as a challenger and each lair counted its
 * own garrison toward its own fall.
 */
function isChallenger(node: GraphNode): boolean {
  if (isAgentGone(node)) return false;
  const props = node.properties as Record<string, unknown>;
  if (props.isMonsterElite === true) return false;
  if (props.armyState != null) return false;
  return true;
}

/** Faction this actor belongs to, if any — used only to credit the clearing. */
function factionOf(graph: WorldGraph, agentId: string): string | undefined {
  return graph.getOutgoingEdges(agentId, 'member_of')[0]?.target;
}

/**
 * Index every challenger in the world by the hex they resolve to.
 *
 * Built once per pass rather than per lair: the per-lair form is agents × lairs
 * (368 × 29 on a medium map, every escalation), and this is agents + lairs.
 */
function indexChallengersByHex(state: GameState): Map<string, Challenger[]> {
  const { graph } = state;
  const byHex = new Map<string, Challenger[]>();

  for (const actor of graph.getNodesByType('actor')) {
    if (!isChallenger(actor)) continue;

    const locationId = graph.getOutgoingEdges(actor.id, 'located_at')[0]?.target;
    if (!locationId) continue;

    // Resolves sublocation → parent → hex, so someone in a settlement's tavern still
    // counts as standing on the hex the den shares with them.
    const hex = resolveLocationToHex(graph, locationId);
    if (!hex) continue;

    const key = `${hex.col},${hex.row}`;
    const bucket = byHex.get(key);
    if (bucket) bucket.push({ node: actor, factionId: factionOf(graph, actor.id) });
    else byHex.set(key, [{ node: actor, factionId: factionOf(graph, actor.id) }]);
  }

  return byHex;
}

/**
 * The faction most represented among the challengers, ignoring the unaffiliated.
 *
 * Returns undefined when nobody pressing carries a membership — a clearing done by
 * unaffiliated wanderers is a real clearing that simply has no faction to credit, and
 * `clearedByFactionId` stays absent rather than being invented.
 */
function creditFaction(challengers: readonly Challenger[]): string | undefined {
  const tally = new Map<string, number>();
  for (const c of challengers) {
    if (!c.factionId) continue;
    tally.set(c.factionId, (tally.get(c.factionId) ?? 0) + 1);
  }

  let best: string | undefined;
  let bestCount = 0;
  for (const [factionId, count] of tally) {
    // Ties break on the lexically lower id so the credit is deterministic (NFP #3)
    // rather than dependent on graph iteration order.
    if (count > bestCount || (count === bestCount && best !== undefined && factionId < best)) {
      best = factionId;
      bestCount = count;
    }
  }
  return best;
}

// ─── The writer ──────────────────────────────────────────────────────────────

/**
 * Flip an active lair to `cleared_lair`. **The only writer of that subtype.**
 *
 * Subtype and `clearedAtTick` are written in one call because splitting them is the
 * documented failure mode: reinfestation gates on `tick - (clearedAtTick ?? 0)`, so a
 * lair cleared without a timestamp reads as cleared at tick 0 and is instantly eligible
 * to reinfest. Routing every clearing through here is what makes the pairing structural
 * instead of a rule each future caller has to remember.
 *
 * `name` is deliberately not passed. `updateNode` merges, so the lair keeps the name it
 * was born with across the transition — the persistence rule THR-1312 shipped, and the
 * reason `existingLairNames` reads both subtypes when it guards new spawns.
 *
 * The monster occupancy is dropped: a cleared den has no boss and hosts no faction. Its
 * accrued `sphereAffinity` is left untouched, because how deeply the site was steeped
 * when it fell is exactly what reinfestation reads afterwards.
 */
export function clearLair(
  state: GameState,
  lairNode: GraphNode,
  clearedByFactionId: string | undefined,
): void {
  const { graph, tick } = state;

  graph.updateNode(lairNode.id, {
    properties: {
      locationSubtype: 'cleared_lair',
      locationType: 'cleared_lair',
      clearedAtTick: tick,
      clearedByFactionId,
      monsterFactionId: undefined,
      namedEliteId: undefined,
      clearingProgress: undefined,
      lastEscalationTick: tick,
    },
  });

  emitTrace({
    category: 'faction_ambition',
    locationId: lairNode.id,
    factionId: clearedByFactionId,
    result: 'lair_cleared',
    summary: `Lair ${lairNode.id} ("${lairNode.name}") cleared at tick ${tick}`
      + `${clearedByFactionId ? ` by ${clearedByFactionId}` : ' by unaffiliated challengers'}`,
    tick,
  });
}

// ─── The pass ────────────────────────────────────────────────────────────────

/**
 * One clearing pass over every active lair. Called from `phaseLairEscalation`.
 *
 * Returns the ids of lairs cleared this pass, so the caller can invalidate structural
 * caches exactly when a subtype actually moved rather than on every escalation.
 */
export function resolveLairClearing(state: GameState): string[] {
  const { graph, tick } = state;

  const activeLairs = graph.getNodesByType('location').filter(
    n => n.properties.locationSubtype === 'lair',
  );
  if (activeLairs.length === 0) return [];

  const byHex = indexChallengersByHex(state);
  if (byHex.size === 0) return [];

  const cleared: string[] = [];

  for (const lairNode of activeLairs) {
    const props = lairNode.properties;

    const col = props.hexCol as number | undefined;
    const row = props.hexRow as number | undefined;
    if (col === undefined || row === undefined) continue; // fail-soft: unplaced lair

    const challengers = byHex.get(`${col},${row}`) ?? [];
    if (challengers.length < LAIR_CLEARING_MIN_CHALLENGERS) continue;

    const resistance = LAIR_CLEARING_RESISTANCE[props.lairTier as LairTier];
    if (typeof resistance !== 'number') continue; // fail-soft: unknown tier

    const press = Math.min(challengers.length, LAIR_CLEARING_MAX_CHALLENGERS);
    const progress = ((props.clearingProgress as number | undefined) ?? 0) + press;

    if (progress < resistance) {
      // Still standing. Record the pressure so the next escalation resumes the siege
      // instead of restarting it — this property is the whole reason clearing can be
      // gradual rather than a single lucky colocation.
      graph.updateNode(lairNode.id, { properties: { clearingProgress: progress } });
      emitTrace({
        category: 'faction_ambition',
        locationId: lairNode.id,
        result: 'lair_pressed',
        summary: `Lair ${lairNode.id} pressed by ${challengers.length} at tick ${tick}`
          + ` — progress ${progress}/${resistance}`,
        tick,
      });
      continue;
    }

    clearLair(state, lairNode, creditFaction(challengers));
    cleared.push(lairNode.id);
  }

  return cleared;
}
