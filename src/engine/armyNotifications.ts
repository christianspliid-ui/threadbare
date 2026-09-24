/**
 * armyNotifications.ts — war news, reported where the war happens (THR-1564).
 *
 * Each war writer (army raised, army broken up, army fraying, battle joined, siege
 * laid, battle or siege ended, town changing hands) calls `reportWar` at the site of
 * the event. `reportWar` judges visibility there — before the aftermath removes the
 * loser — builds one line in the game's register, and pushes one `TickEvent` into
 * `state.tickEvents`. `phaseNarrative` promotes the lines at ≥ 0.8 significance into
 * the chronicle the same tick.
 *
 * **Nothing here reads a trace.** Until THR-1564 this module was a phase that built the
 * war lines by reading the trace buffer, and traces are off unless the debug panel is
 * open — so in normal play the player was never told a war was happening. The traces
 * at every war site stay as they were: they are the debug layer. `war.reported` is the
 * debug count of this module's work.
 *
 * Plan doc: Docs/plans/2026-09-24-thr-1564-war-news-from-state.md
 *
 * How loud (the plan's loudness table, decided with a veto invited):
 *   - beginnings (raised, joined, laid, broken up) → chronicle when threaded, quiet otherwise;
 *   - a battle or siege ending → chronicle, threaded or not (lever below);
 *   - a town changing hands → chronicle, flat;
 *   - an army fraying → recorded, never shown.
 *
 * NFP #1 (tunability): every significance is a named constant; strangers' endings have a lever.
 * NFP #2 (inspectability): `war.reported` per call; events carry `refs` and `factionId`.
 * NFP #3 (determinism): ids are `evt_war_<kind>_<subject>_<tick>`; no draws.
 * NFP #4 (fail-soft): a missing `tickEvents`, node or name degrades to less; `reportWar` never throws.
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { WorldRef } from '../types/worldRef';
import type { BattleResolutionType, BattleState } from '../types/battle';
import type { WarNewsKind } from '../types/traces/war-traces';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';
import { getThreadedAgents, getFactionMembershipEdges } from './graphQueries';
import { REALM_TERRITORY_EVENT_SIGNIFICANCE } from '../data/realm-content';

export type { WarNewsKind } from '../types/traces/war-traces';

// ── Significance constants ───────────────────────────────────────────────────

/** A war line that reaches the chronicle (`phaseNarrative` promotes at ≥ 0.8). */
export const WAR_NEWS_CHRONICLE_SIGNIFICANCE = 0.85;

/** A war line recorded in the event stream but not shown in the chronicle. */
export const WAR_NEWS_QUIET_SIGNIFICANCE = 0.2;

/** An army fraying: recorded for a threaded army, never shown. */
export const WAR_NEWS_ATTRITION_SIGNIFICANCE = 0.5;

/**
 * The loudness lever. `true`: every battle's and siege's ending reaches the chronicle,
 * threaded or not (a war among strangers reaches you as chronicle — rulebook). `false`
 * puts strangers' endings back to quiet. The plan's kill criterion flips it if
 * strangers' endings exceed three a day on a large map.
 */
export const WAR_NEWS_STRANGERS_ENDINGS_IN_CHRONICLE = true;

// ── The generic words (fail-soft fallbacks, never ids) ───────────────────────

const GENERIC_FACTION = 'a nameless host';
const GENERIC_TOWN = 'a town';
const GENERIC_PLACE = 'an unnamed field';

// ── The news ─────────────────────────────────────────────────────────────────

/**
 * One side of a war event, captured while its nodes still exist. Names are read at
 * capture time, so a line about an army that the aftermath has since removed still
 * names it.
 */
export interface WarSide {
  armyId?: string;
  factionId?: string;
  commanderId?: string;
  factionName?: string;
  commanderName?: string;
}

export type WarNews =
  | { kind: 'army_raised'; side: WarSide; placeId?: string }
  | { kind: 'army_disbanded'; side: WarSide }
  | { kind: 'army_fraying'; side: WarSide; severity: 'fraying' | 'breaking' }
  | { kind: 'battle_joined'; battleId: string; attacker: WarSide; defender: WarSide; placeId?: string }
  | { kind: 'siege_laid'; siegeId: string; attacker: WarSide; defender: WarSide; townId: string }
  | {
    kind: 'battle_ended';
    battleId: string;
    capture: BattleNewsCapture;
    resolution: BattleResolutionType;
  }
  | {
    kind: 'territory_changed';
    outcome: 'taken' | 'claimed' | 'vacated';
    locationId: string;
    fromFactionId: string | null;
    toFactionId: string | null;
  }
  // No production caller (the breach writer has none yet — not THR-1564's to wire).
  | { kind: 'siege_breach'; siegeId: string; townId: string };

/**
 * What a battle's ending line needs, read **before** `applyAftermath` — which disbands
 * the loser, may kill its commander and, on a conquest, hands the town to the victor.
 * Visibility is judged here for the same reason: a threaded mortal's army that loses
 * must still read as threaded.
 */
export interface BattleNewsCapture {
  battleType: BattleState['battleType'];
  attacker: WarSide;
  defender: WarSide;
  placeId?: string;
  placeName?: string;
  townId?: string;
  townName?: string;
  /** The town's faction holder before the aftermath (sieges). */
  holderBefore: string | null;
  threaded: boolean;
}

// ── Capture helpers ─────────────────────────────────────────────────────────

function nodeName(graph: WorldGraph, id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  const name = graph.getNode(id)?.name;
  return typeof name === 'string' && name.length > 0 ? name : undefined;
}

/** Read an army's side — its faction and commander — while the army still exists. */
export function captureArmySide(state: GameState, armyId: string): WarSide {
  const graph = state.graph;
  const factionId = graph.getOutgoingEdges(armyId, 'member_of')[0]?.target;
  const commanderId = graph.getOutgoingEdges(armyId, 'commanded_by')[0]?.target;
  return {
    armyId,
    factionId,
    commanderId,
    factionName: nodeName(graph, factionId),
    commanderName: nodeName(graph, commanderId),
  };
}

/** The faction (not a mortal's strategic hold) that holds a town, or null. */
export function townHolder(graph: WorldGraph, townId: string): string | null {
  for (const edge of graph.getIncomingEdges(townId, 'controls')) {
    if (graph.getNode(edge.source)?.properties.actorType === 'faction') return edge.source;
  }
  return null;
}

/** A besieged town's side: its holder, with no army and no commander. */
export function captureTownSide(state: GameState, townId: string): WarSide {
  const holder = townHolder(state.graph, townId);
  return holder ? { factionId: holder, factionName: nodeName(state.graph, holder) } : {};
}

/**
 * Capture a battle or siege for its ending line. Call before `applyAftermath`.
 * Fail-soft: returns null on a missing battle node or a throw.
 */
export function captureBattleForNews(state: GameState, battleNodeId: string): BattleNewsCapture | null {
  try {
    const graph = state.graph;
    const battleNode = graph.getNode(battleNodeId);
    const bs = battleNode?.properties.battleState as BattleState | undefined;
    if (!bs) return null;

    const attacker = captureArmySide(state, bs.attackerArmyId);
    const isSiege = bs.battleType === 'siege';
    const townId = isSiege ? bs.settlementId ?? bs.defenderArmyId : undefined;
    const defender = isSiege && townId ? captureTownSide(state, townId) : captureArmySide(state, bs.defenderArmyId);
    const placeId = graph.getOutgoingEdges(battleNodeId, 'located_at')[0]?.target;

    return {
      battleType: bs.battleType,
      attacker,
      defender,
      placeId,
      placeName: nodeName(graph, placeId),
      townId,
      townName: nodeName(graph, townId),
      holderBefore: townId ? townHolder(graph, townId) : null,
      threaded: isWarThreaded(state, [attacker, defender]),
    };
  } catch {
    return null;
  }
}

// ── Visibility ───────────────────────────────────────────────────────────────

/**
 * Build a Set of agent IDs that the ascendant has thread connections to.
 * Includes direct threads and members of threaded agents' factions.
 * NFP #4: Returns empty set if ascendantId is missing.
 */
function buildThreadedAgentSet(state: GameState): Set<string> {
  const set = new Set<string>();
  if (!state.ascendantId) return set;

  const threaded = getThreadedAgents(state.graph, state.ascendantId);
  for (const agent of threaded) {
    set.add(agent.id);
    // Also include the agent's faction members as "indirectly threaded"
    // THR-74: faction targets only — companions reach the set through their own thread.
    const memEdges = getFactionMembershipEdges(state.graph, agent.id);
    for (const edge of memEdges) {
      const factionMembers = state.graph.getIncomingEdges(edge.target, 'member_of');
      for (const memEdge of factionMembers) {
        set.add(memEdge.source);
      }
    }
  }

  return set;
}

/**
 * Check if any member of the given faction is in the threaded agent set.
 * NFP #4: Returns false if factionId not found.
 */
function checkFactionThreaded(
  state: GameState,
  factionId: string,
  threadedAgents: Set<string>,
): boolean {
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  for (const edge of memberEdges) {
    if (threadedAgents.has(edge.source)) return true;
  }
  return false;
}

/**
 * A war event is *threaded* when any side's commander is in the threaded set or any
 * side's faction is threaded. Judge it while the sides still exist.
 */
export function isWarThreaded(state: GameState, sides: readonly WarSide[]): boolean {
  if (!state.ascendantId) return false;
  const threadedAgents = buildThreadedAgentSet(state);
  if (threadedAgents.size === 0) return false;
  for (const side of sides) {
    if (side.commanderId && threadedAgents.has(side.commanderId)) return true;
    if (side.factionId && checkFactionThreaded(state, side.factionId, threadedAgents)) return true;
  }
  return false;
}

// ── The lines (§ Content: GAME register, no numbers, names as refs) ──────────

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function factionWord(side: WarSide): string {
  return side.factionName ?? GENERIC_FACTION;
}

function possessive(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

/** "{Faction}'s army under {commander}" — the commander clause drops when unnamed. */
function armyPhrase(side: WarSide): string {
  const base = `${possessive(factionWord(side))} army`;
  return side.commanderName ? `${base} under ${side.commanderName}` : base;
}

/** The inputs of a battle's ending sentence. */
export interface BattleOutcomeInput {
  battleType: BattleState['battleType'];
  resolution: BattleResolutionType;
  attackerName?: string;
  defenderName?: string;
  placeName?: string;
  townName?: string;
}

/**
 * The one sentence for how a battle or siege ended.
 *
 * Shared by the war news (THR-1564) and the battle record THR-1528 writes for a
 * place's memory — both describe the same battle, so there is one builder. A siege that
 * *took* its town is not described here: the town-changes-hands line tells it.
 */
export function battleOutcomeSentence(input: BattleOutcomeInput): string {
  const attacker = input.attackerName ?? GENERIC_FACTION;
  const defender = input.defenderName ?? GENERIC_FACTION;
  const place = input.placeName ?? GENERIC_PLACE;

  if (input.battleType === 'siege') {
    const town = input.townName ?? GENERIC_TOWN;
    // The besiegers' army can break apart before its siege ends, taking its banner with
    // it. The siege is then told without them, never as "a nameless host".
    if (!input.attackerName) {
      switch (input.resolution) {
        case 'attacker_victory':
          return `${capitalize(town)} is broken into, but not held.`;
        case 'defender_victory':
          return `The siege of ${town} is lifted.`;
        case 'stalemate':
          return `The siege of ${town} ends in a standstill.`;
        case 'mutual_destruction':
          return `The siege of ${town} ends in ruin on both sides.`;
      }
    }
    switch (input.resolution) {
      case 'attacker_victory':
        return `${capitalize(attacker)} broke into ${town} but could not hold it.`;
      case 'defender_victory':
        return `${capitalize(town)} held against ${attacker}.`;
      case 'stalemate':
        return `The siege of ${town} by ${attacker} ends in a standstill.`;
      case 'mutual_destruction':
        return `${capitalize(attacker)} and the defenders of ${town} destroyed each other.`;
    }
  }

  switch (input.resolution) {
    case 'attacker_victory':
      return `${capitalize(attacker)} broke ${defender} at ${place}.`;
    case 'defender_victory':
      return `${capitalize(defender)} broke ${attacker} at ${place}.`;
    case 'stalemate':
      return `${capitalize(attacker)} and ${defender} fought to a standstill at ${place}.`;
    case 'mutual_destruction':
      return `${capitalize(attacker)} and ${defender} destroyed each other at ${place}.`;
  }
  return `${capitalize(attacker)} and ${defender} fought at ${place}.`;
}

// ── Refs ─────────────────────────────────────────────────────────────────────

function placeRef(graph: WorldGraph, id: string | null | undefined): WorldRef | null {
  if (!id) return null;
  const node = graph.getNode(id);
  if (!node || node.type !== 'location') return null;
  const kind = node.properties.parentLocationId ? 'sublocation' : 'location';
  return { kind, id, name: node.name };
}

function hexCoordsOf(graph: WorldGraph, id: string | null | undefined): { col: number; row: number } | undefined {
  if (!id) return undefined;
  const props = graph.getNode(id)?.properties;
  const col = props?.hexCol;
  const row = props?.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? { col, row } : undefined;
}

/** Refs for a line: the place first, then each side's faction and named commander. */
function buildRefs(
  graph: WorldGraph,
  placeId: string | null | undefined,
  sides: readonly WarSide[],
  factionTooltipId?: string,
): WorldRef[] {
  const refs: WorldRef[] = [];
  const seen = new Set<string>();
  const push = (ref: WorldRef | null): void => {
    if (!ref || seen.has(ref.id)) return;
    seen.add(ref.id);
    refs.push(ref);
  };
  push(placeRef(graph, placeId));
  for (const side of sides) {
    if (side.factionId && side.factionName) {
      push({ kind: 'faction', id: side.factionId, name: side.factionName, tooltipId: factionTooltipId });
    }
  }
  for (const side of sides) {
    if (side.commanderId && side.commanderName && graph.getNode(side.commanderId)) {
      push({ kind: 'agent', id: side.commanderId, name: side.commanderName });
    }
  }
  return refs;
}

// ── The reporter ─────────────────────────────────────────────────────────────

interface BuiltLine {
  subjectId: string;
  type: TickEvent['type'];
  message: string;
  significance: number;
  threaded: boolean;
  refs: WorldRef[];
  factionId?: string;
  actorId?: string;
  hexCoords?: { col: number; row: number };
}

/** The significance of a beginning: shown when threaded, quiet otherwise. */
function beginningSignificance(threaded: boolean): number {
  return threaded ? WAR_NEWS_CHRONICLE_SIGNIFICANCE : WAR_NEWS_QUIET_SIGNIFICANCE;
}

function buildLine(state: GameState, news: WarNews): BuiltLine | 'territory_line_instead' {
  const graph = state.graph;

  switch (news.kind) {
    case 'army_raised': {
      const threaded = isWarThreaded(state, [news.side]);
      const f = capitalize(factionWord(news.side));
      return {
        subjectId: news.side.armyId ?? news.side.factionId ?? 'army',
        type: 'army_mobilization',
        message: news.side.commanderName
          ? `${f} raises an army under ${news.side.commanderName}.`
          : `${f} raises an army.`,
        significance: beginningSignificance(threaded),
        threaded,
        refs: buildRefs(graph, news.placeId, [news.side]),
        factionId: news.side.factionId,
        actorId: news.side.commanderId,
        hexCoords: hexCoordsOf(graph, news.placeId),
      };
    }

    case 'army_disbanded': {
      const threaded = isWarThreaded(state, [news.side]);
      return {
        subjectId: news.side.armyId ?? 'army',
        type: 'army_disbanded',
        message: `${capitalize(armyPhrase(news.side))} breaks apart.`,
        significance: beginningSignificance(threaded),
        threaded,
        refs: buildRefs(graph, undefined, [news.side]),
        factionId: news.side.factionId,
        actorId: news.side.commanderId,
      };
    }

    case 'army_fraying': {
      const threaded = isWarThreaded(state, [news.side]);
      const phrase = capitalize(armyPhrase(news.side));
      return {
        subjectId: news.side.armyId ?? 'army',
        type: 'army_attrition',
        message: news.severity === 'breaking'
          ? `${phrase} is falling apart.`
          : `${phrase} is starting to fray.`,
        significance: threaded ? WAR_NEWS_ATTRITION_SIGNIFICANCE : WAR_NEWS_QUIET_SIGNIFICANCE,
        threaded,
        refs: buildRefs(graph, undefined, [news.side]),
        factionId: news.side.factionId,
        actorId: news.side.commanderId,
      };
    }

    case 'battle_joined': {
      const threaded = isWarThreaded(state, [news.attacker, news.defender]);
      const place = nodeName(graph, news.placeId) ?? GENERIC_PLACE;
      return {
        subjectId: news.battleId,
        type: 'battle_started',
        message: `${capitalize(factionWord(news.attacker))} and ${factionWord(news.defender)} meet in battle at ${place}.`,
        significance: beginningSignificance(threaded),
        threaded,
        refs: buildRefs(graph, news.placeId, [news.attacker, news.defender]),
        factionId: news.attacker.factionId,
        hexCoords: hexCoordsOf(graph, news.placeId),
      };
    }

    case 'siege_laid': {
      const threaded = isWarThreaded(state, [news.attacker, news.defender]);
      const town = nodeName(graph, news.townId) ?? GENERIC_TOWN;
      return {
        subjectId: news.siegeId,
        type: 'siege_established',
        message: `${capitalize(factionWord(news.attacker))} lays siege to ${town}.`,
        significance: beginningSignificance(threaded),
        threaded,
        refs: buildRefs(graph, news.townId, [news.attacker, news.defender]),
        factionId: news.attacker.factionId,
        hexCoords: hexCoordsOf(graph, news.townId),
      };
    }

    case 'battle_ended': {
      const c = news.capture;
      // One line per event: a siege that took its town is told by the territory line.
      if (c.townId && c.holderBefore !== townHolder(graph, c.townId)) return 'territory_line_instead';
      const placeId = c.townId ?? c.placeId;
      return {
        subjectId: news.battleId,
        type: 'battle_resolved',
        message: battleOutcomeSentence({
          battleType: c.battleType,
          resolution: news.resolution,
          attackerName: c.attacker.factionName,
          defenderName: c.defender.factionName,
          placeName: c.placeName,
          townName: c.townName,
        }),
        significance: c.threaded || WAR_NEWS_STRANGERS_ENDINGS_IN_CHRONICLE
          ? WAR_NEWS_CHRONICLE_SIGNIFICANCE
          : WAR_NEWS_QUIET_SIGNIFICANCE,
        threaded: c.threaded,
        refs: buildRefs(graph, placeId, [c.attacker, c.defender]),
        factionId: c.attacker.factionId ?? c.defender.factionId,
        hexCoords: hexCoordsOf(graph, placeId),
      };
    }

    case 'territory_changed': {
      const town = nodeName(graph, news.locationId) ?? GENERIC_TOWN;
      const to = nodeName(graph, news.toFactionId);
      const from = nodeName(graph, news.fromFactionId);
      const toSide: WarSide = { factionId: news.toFactionId ?? undefined, factionName: to };
      const fromSide: WarSide = { factionId: news.fromFactionId ?? undefined, factionName: from };
      const message = news.outcome === 'taken'
        ? `${capitalize(to ?? GENERIC_FACTION)} takes ${town} from ${from ?? GENERIC_FACTION}.`
        : news.outcome === 'claimed'
          ? `${capitalize(to ?? GENERIC_FACTION)} takes ${town}.`
          : `${capitalize(from ?? GENERIC_FACTION)} loses ${town}.`;
      const sides = news.fromFactionId && news.fromFactionId !== news.toFactionId
        ? [toSide, fromSide]
        : [toSide];
      // Flat, not thread-gated: a border moving is a fact about the world's shape.
      const threaded = isWarThreaded(state, sides);
      return {
        subjectId: news.locationId,
        type: 'realm_territory_change',
        message,
        significance: REALM_TERRITORY_EVENT_SIGNIFICANCE,
        threaded,
        refs: buildRefs(graph, news.locationId, sides, 'ui.realm'),
        factionId: news.toFactionId ?? news.fromFactionId ?? undefined,
        hexCoords: hexCoordsOf(graph, news.locationId),
      };
    }

    case 'siege_breach': {
      // The modifier-stripping headline beat (THR-628): what was **Fortified** is now **Breached**.
      const town = nodeName(graph, news.townId) ?? 'the settlement';
      return {
        subjectId: news.siegeId,
        type: 'siege_breach',
        message: `The walls of ${town} come down. What stood **Fortified** this morning is **Breached** by dusk — and everyone on both sides of the rubble knows what that means.`,
        significance: WAR_NEWS_CHRONICLE_SIGNIFICANCE,
        threaded: true,
        refs: buildRefs(graph, news.townId, []),
        hexCoords: hexCoordsOf(graph, news.townId),
      };
    }
  }
}

/**
 * Report one war event: judge visibility, build the line, push one `TickEvent` into
 * `state.tickEvents` in place. Returns the event id, or undefined when nothing was
 * written. Never throws — a failed report never breaks the war it reports.
 */
export function reportWar(state: GameState, news: WarNews): string | undefined {
  const tick = state.tick ?? 0;
  const trace = (fields: { threaded: boolean; eventId?: string; skipped?: 'no_tick_events' | 'territory_line_instead' | 'error'; error?: string }): void => {
    try {
      emitTrace({
        tick,
        category: 'war.reported',
        summary: fields.eventId
          ? `War news (${news.kind}${fields.threaded ? ', threaded' : ''}): ${fields.eventId}`
          : `War news (${news.kind}) not written: ${fields.skipped ?? 'unknown'}`,
        kind: news.kind,
        ...fields,
      });
    } catch { /* tracing never breaks the war */ }
  };

  try {
    // Worldgen and fixtures raise armies on a bare `{ graph, tick: 0 }` state.
    if (!Array.isArray(state.tickEvents)) {
      trace({ threaded: false, skipped: 'no_tick_events' });
      return undefined;
    }

    const line = buildLine(state, news);
    if (line === 'territory_line_instead') {
      trace({ threaded: news.kind === 'battle_ended' ? news.capture.threaded : false, skipped: 'territory_line_instead' });
      return undefined;
    }

    const baseId = `evt_war_${news.kind}_${line.subjectId}_${tick}`;
    let id = baseId;
    for (let n = 2; state.tickEvents.some(e => e.id === id); n++) id = `${baseId}_${n}`;

    const event: TickEvent = {
      id,
      tick,
      type: line.type,
      message: line.message,
      significance: line.significance,
      ...(line.actorId ? { actorId: line.actorId } : {}),
      ...(line.factionId ? { factionId: line.factionId } : {}),
      ...(line.hexCoords ? { hexCoords: line.hexCoords } : {}),
      refs: line.refs,
    };
    state.tickEvents.push(event);
    trace({ threaded: line.threaded, eventId: id });
    return id;
  } catch (err) {
    trace({ threaded: false, skipped: 'error', error: err instanceof Error ? err.message : String(err) });
    return undefined;
  }
}

/** The event types a war line can carry — for the debug bridge and tests. */
export const WAR_NEWS_EVENT_TYPES: ReadonlySet<TickEvent['type']> = new Set<TickEvent['type']>([
  'army_mobilization', 'army_disbanded', 'army_attrition', 'battle_started',
  'siege_established', 'battle_resolved', 'siege_breach', 'realm_territory_change',
]);

/** Every war line pushed so far this tick (debug and tests). */
export function getWarNewsEvents(state: Pick<GameState, 'tickEvents'>): TickEvent[] {
  return (state.tickEvents ?? []).filter(e => e.id.startsWith('evt_war_') && WAR_NEWS_EVENT_TYPES.has(e.type));
}

/** Used by `WarNewsKind` consumers that need the runtime list. */
export const WAR_NEWS_KINDS: readonly WarNewsKind[] = [
  'army_raised', 'army_disbanded', 'army_fraying', 'battle_joined',
  'siege_laid', 'battle_ended', 'territory_changed', 'siege_breach',
];
