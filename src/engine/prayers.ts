/**
 * Prayers and the faithful (THR-1935 S1).
 *
 * A hungry town on the god's own ground prays. A god that answers — a successful
 * player cast of a card flagged `answers_prayer` — pushes its Dominion there by
 * `ANSWERED_PRAYER_DOMINION_PRESSURE`. If the town then recovers (loses its Restless
 * chip) within `PRAYER_RECOVERY_WINDOW_DAYS`, it keeps faith: a `faithfulCommunity`
 * essence source whose faith rides its bread (`essenceEconomyBridge` scores the
 * town's staples for it) and lapses at `FAITHFUL_LAPSE_SANCTITY`. An ignored prayer
 * puts the town first on the rival's raid list for `PRAYER_SLIGHT_DAYS`.
 *
 * Graph shape (no new node or edge types, Vision #4 — no god id on the town):
 * - a prayer is an `event` node (`eventKind: 'prayer'`) with `occurred_at` → town;
 * - the answer is the god's `participated_in` edge to the prayer (`role: 'answered'`);
 * - the faith is the god's `controls` edge to the town, which hosts the source bag.
 * The town keeps only its own clocks: `lastPrayerTick`, `prayerSlightedUntilTick`, and
 * `activePrayerId` (its open or answered prayer, so the daily pass reads it in O(1)).
 *
 * NFP: #1 every number in `data/prayer-constants.ts`; #2 prayers are graph events
 * with a status, seven trace categories, `__DEBUG.getPrayers` / `getFaithful`; #3 no
 * draw — settlements in id order, variants keyed by id and tick, ties to the lower
 * id; #4 every town's pass is caught on its own and a missing input skips its write.
 *
 * Plan: Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md § Engine 1–5.
 */
import type { GameState, TickEvent } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';
import type { SpherePressureEvent, PressureSource } from '../types/sphereAffinity';
import type { EncounterAftermathChange } from '../types/unifiedAction';
import type { EssenceSource } from '../types/essenceSource';
import { emitTrace } from './traceBuffer';
import { getLocationNodes, resolveToParentLocation } from './sublocationShape';
import { bandAtLeast, dominionOf } from './dominion';
import { getSpherePoints, rankSpherePoints } from './spherePoints';
import { splitByPoints } from './phaseDominion';
import { heldSources, readEssenceSource } from './essenceSources';
import { writeEssenceSource } from './essenceSourceWrite';
import { isPressureSettlement, largestInput, readUnrestInputs } from './unrestPressure/inputs';
import { isRestlessPlace } from './unrestPressure/bands';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  PRAYER_ENABLED,
  PRAYER_MIN_BAND,
  PRAYER_ANSWER_WINDOW_DAYS,
  PRAYER_COOLDOWN_DAYS,
  PRAYER_MAX_OPEN,
  PRAYER_GOD_GAP_DAYS,
  ANSWERED_PRAYER_DOMINION_PRESSURE,
  UNBIDDEN_AID_DOMINION_PRESSURE,
  PRAYER_RECOVERY_WINDOW_DAYS,
  FAITHFUL_COMMUNITY_MAX,
  FAITHFUL_INITIAL_SANCTITY,
  FAITHFUL_WAVERING_SANCTITY,
  FAITHFUL_LAPSE_SANCTITY,
  PRAYER_SLIGHT_DAYS,
  STARVE_FAITHFUL_SANCTITY_DRAIN,
  PRAYER_CHRONICLE_SIGNIFICANCE,
  ANSWERS_PRAYER_FLAG,
} from '../data/prayer-constants';
import {
  PRAYER_LINES,
  FAITH_KEPT_LINE,
  FAITH_WAVERING_LINE,
  PRAYER_ANSWER_HINT,
  PRAYER_DAYS_LEFT_WORDS,
  PRAYER_GOD_FALLBACK,
  PRAYER_RIVAL_FALLBACK,
  PRAYER_RECEIPT_TITLES,
  type PrayerLineKey,
} from '../data/prayer-content';

// ─── Shape ───────────────────────────────────────────────────────────

export const PRAYER_EVENT_KIND = 'prayer';
export const LAST_PRAYER_TICK_PROP = 'lastPrayerTick';
export const PRAYER_SLIGHTED_UNTIL_PROP = 'prayerSlightedUntilTick';
export const ACTIVE_PRAYER_PROP = 'activePrayerId';
/** On the god node: the tick it last heard a prayer open (the season gap reads it). */
export const LAST_GOD_PRAYER_TICK_PROP = 'lastPrayerOpenedTick';
/** The `controls` edge the faith wrote, so a lapse removes that edge and no other. */
export const FAITH_CONTROLS_EDGE_PROP = 'faithControlsEdgeId';

export type PrayerStatus = 'open' | 'answered' | 'unanswered' | 'recovered' | 'unrecovered';

export interface PrayerRecord {
  eventId: string;
  townId: string;
  status: PrayerStatus;
  openedTick: number;
  closesTick: number;
  answeredTick: number | null;
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function isPrayerEvent(node: GraphNode | undefined): node is GraphNode {
  return !!node && node.type === 'event' && node.properties?.eventKind === PRAYER_EVENT_KIND;
}

function recordOf(node: GraphNode): PrayerRecord {
  const p = node.properties;
  return {
    eventId: node.id,
    townId: typeof p.townId === 'string' ? p.townId : '',
    status: (p.status as PrayerStatus) ?? 'open',
    openedTick: num(p.openedTick) ?? 0,
    closesTick: num(p.closesTick) ?? 0,
    answeredTick: num(p.answeredTick) ?? null,
  };
}

/** The town's open or answered prayer, if any. */
export function activePrayerOf(graph: WorldGraph, townId: string): PrayerRecord | null {
  const id = graph.getNode(townId)?.properties?.[ACTIVE_PRAYER_PROP];
  if (typeof id !== 'string') return null;
  const node = graph.getNode(id);
  if (!isPrayerEvent(node)) return null;
  const rec = recordOf(node);
  return rec.status === 'open' || rec.status === 'answered' ? rec : null;
}

/** Every prayer ever opened, in id order (debug and the Economy tab). */
export function listPrayers(graph: WorldGraph): PrayerRecord[] {
  const out: PrayerRecord[] = [];
  for (const town of getLocationNodes(graph)) {
    for (const e of graph.getIncomingEdges(town.id, 'occurred_at')) {
      const node = graph.getNode(e.source);
      if (isPrayerEvent(node)) out.push(recordOf(node));
    }
  }
  return out.sort((a, b) => (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0));
}

/** The god's primary sphere by bought points — the pool its upkeep comes from. */
export function godPrimaryByPoints(graph: WorldGraph, godId: string): SphereName | null {
  return rankSpherePoints(getSpherePoints(graph.getNode(godId)?.properties))[0] ?? null;
}

/** Is this settlement Restless with hunger as its largest unrest input (ties go to hunger)? */
export function isHungryForPrayer(graph: WorldGraph, town: GraphNode | undefined): boolean {
  if (!isPressureSettlement(town)) return false;
  if (!isRestlessPlace(graph, town.id)) return false;
  const inputs = readUnrestInputs(town);
  return !!inputs && largestInput(inputs) === 'hunger';
}

function cooldownClear(town: GraphNode, tick: number): boolean {
  const last = num(town.properties?.[LAST_PRAYER_TICK_PROP]);
  return last === undefined || tick - last >= PRAYER_COOLDOWN_DAYS * TICKS_PER_DAY;
}

function onGodsGround(graph: WorldGraph, godId: string, townId: string): boolean {
  return bandAtLeast(dominionOf(graph, godId, townId).band, PRAYER_MIN_BAND);
}

// ─── Words ───────────────────────────────────────────────────────────

/** Deterministic variant pick (NFP #3): a stable hash of id and tick, never a draw. */
function variant(lines: readonly string[], key: string, tick: number): string {
  if (lines.length <= 1) return lines[0] ?? '';
  let h = tick;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return lines[Math.abs(h) % lines.length];
}

function fill(template: string, slots: { town?: string; god?: string; rival?: string }): string | null {
  if (!slots.town) return null; // no town name → the line is dropped (Law 14)
  const out = template
    .replace(/\{town\}/g, slots.town)
    .replace(/\{god\}/g, slots.god || PRAYER_GOD_FALLBACK)
    .replace(/\{rival\}/g, slots.rival || PRAYER_RIVAL_FALLBACK);
  return /\{[a-z]+\}/.test(out) ? null : out;
}

function sentenceStart(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function godName(graph: WorldGraph, godId: string): string | undefined {
  const n = graph.getNode(godId)?.name;
  return n && n.trim() ? n : undefined;
}

/** One of the § Prose tables lines, slots filled, or null when it cannot be said. */
export function prayerLine(
  key: PrayerLineKey,
  slots: { town?: string; god?: string; rival?: string },
  seedKey: string,
  tick: number,
): string | null {
  const line = fill(variant(PRAYER_LINES[key], seedKey, tick), slots);
  return line ? sentenceStart(line) : null;
}

/** Days left on an open prayer, in words (Law 13). Null on a broken window. */
export function daysLeftWords(closesTick: number, tick: number): string | null {
  const ticksLeft = closesTick - tick;
  if (!(ticksLeft > 0)) return null;
  const days = Math.floor(ticksLeft / TICKS_PER_DAY);
  return PRAYER_DAYS_LEFT_WORDS[Math.min(days, PRAYER_DAYS_LEFT_WORDS.length - 1)] ?? null;
}

/** A faithful town's line, the same on the place page and the Covenants list. */
export function faithLine(townName: string | undefined, sanctity: number): string | null {
  if (!townName) return null;
  const template = sanctity < FAITHFUL_WAVERING_SANCTITY ? FAITH_WAVERING_LINE : FAITH_KEPT_LINE;
  return fill(template, { town: townName });
}

export interface PlacePrayerView {
  kind: 'prayer' | 'faith';
  /** The main sentence (prayer line or faith line). */
  line: string;
  /** Open prayer only: what answers it and the deadline, in words. */
  hint: string | null;
  wavering: boolean;
  /** The god's name as the line spells it, so the surface can link it (Law 21). */
  godName: string | null;
}

/**
 * The place page's prayer / faith slot: an open prayer to this god, else the faith
 * line when the town keeps faith with it, else null. Pure; reads written state only.
 */
export function placePrayerView(graph: WorldGraph, godId: string, townId: string, tick: number): PlacePrayerView | null {
  try {
    const town = graph.getNode(townId);
    if (!town) return null;
    const active = activePrayerOf(graph, townId);
    if (active && active.status === 'open') {
      const line = prayerLine('prays', { town: town.name, god: godName(graph, godId) }, active.eventId, active.openedTick);
      if (!line) return null;
      const days = daysLeftWords(active.closesTick, tick);
      return { kind: 'prayer', line, hint: days ? `${PRAYER_ANSWER_HINT} ${days}` : PRAYER_ANSWER_HINT, wavering: false, godName: godName(graph, godId) ?? null };
    }
    const src = readEssenceSource(town.properties);
    const controlled = graph.getOutgoingEdges(godId, 'controls').some(e => e.target === townId);
    if (src?.kind === 'faithfulCommunity' && controlled) {
      const sanctity = Number.isFinite(src.sanctity) ? src.sanctity : 0;
      const line = faithLine(town.name, sanctity);
      if (!line) return null;
      return { kind: 'faith', line, hint: null, wavering: sanctity < FAITHFUL_WAVERING_SANCTITY, godName: null };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── The daily phase ─────────────────────────────────────────────────

function chronicle(
  events: TickEvent[],
  tick: number,
  town: GraphNode,
  message: string | null,
  idStem: string,
  alert = false,
): void {
  if (!message) return;
  const col = num(town.properties?.hexCol);
  const row = num(town.properties?.hexRow);
  events.push({
    id: `prayer_evt_${idStem}_${tick}`,
    tick,
    type: 'narrative',
    message,
    significance: PRAYER_CHRONICLE_SIGNIFICANCE,
    ...(col !== undefined && row !== undefined ? { hexCoords: { col, row } } : {}),
    ...(alert ? { notification: { channel: 'alert' as const } } : {}),
  });
}

/** The rival named on an ignored prayer: the first rival by id (no draw). */
function answeringRival(state: GameState): { id: string; name: string } | null {
  const rivals = [...(state.rivalDefinitions ?? [])].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return rivals[0] ? { id: rivals[0].id, name: rivals[0].name } : null;
}

/**
 * Open a prayer at a town for the player's god. `forced` skips the gate (the
 * `__DEBUG.forcePrayer` review lever); the cooldown still starts. Returns the event
 * id, or null when the town already has an active prayer or is gone.
 */
export function openPrayer(
  state: Pick<GameState, 'graph' | 'ascendantId' | 'tick'>,
  townId: string,
  events: TickEvent[],
  forced = false,
): string | null {
  const { graph, ascendantId, tick } = state;
  const town = graph.getNode(townId);
  if (!town || activePrayerOf(graph, townId)) return null;
  const eventId = `prayer_${townId}_${tick}`;
  if (graph.getNode(eventId)) return null;
  const closesTick = tick + PRAYER_ANSWER_WINDOW_DAYS * TICKS_PER_DAY;
  const sphere = godPrimaryByPoints(graph, ascendantId);
  graph.addNode({
    id: eventId,
    type: 'event',
    name: `Prayer at ${town.name}`,
    properties: {
      eventKind: PRAYER_EVENT_KIND,
      eventType: PRAYER_EVENT_KIND,
      tick,
      townId,
      openedTick: tick,
      closesTick,
      status: 'open' satisfies PrayerStatus,
      ...(sphere ? { sphere } : {}),
    },
  });
  graph.addEdge({ id: `occurred_at_${eventId}`, source: eventId, target: townId, type: 'occurred_at', properties: { tick } });
  graph.updateNode(townId, { properties: { [LAST_PRAYER_TICK_PROP]: tick, [ACTIVE_PRAYER_PROP]: eventId } });
  if (graph.getNode(ascendantId)) graph.updateNode(ascendantId, { properties: { [LAST_GOD_PRAYER_TICK_PROP]: tick } });

  const inputs = readUnrestInputs(town);
  emitTrace({
    category: 'prayer.opened',
    tick,
    summary: `${town.name} prays to the god for bread (closes tick ${closesTick}${forced ? ', forced' : ''})`,
    townId,
    eventId,
    band: dominionOf(graph, ascendantId, townId).band,
    unrest: num(town.properties?.unrest) ?? 0,
    hunger: inputs?.hunger ?? 0,
    largestInput: inputs && largestInput(inputs) === 'hunger' ? 'hunger' : null,
    closesTick,
    forced,
  });
  chronicle(events, tick, town, prayerLine('prays', { town: town.name, god: godName(graph, ascendantId) }, eventId, tick), `open_${townId}`, true);
  return eventId;
}

function setPrayerStatus(graph: WorldGraph, eventId: string, status: PrayerStatus, extra: Record<string, unknown> = {}): void {
  graph.updateNode(eventId, { properties: { status, ...extra } });
}

function clearActive(graph: WorldGraph, townId: string): void {
  graph.updateNode(townId, { properties: { [ACTIVE_PRAYER_PROP]: undefined } });
}

/** Faithful towns the god controls now (a lapsed one frees its slot). */
export function faithfulCount(graph: WorldGraph, godId: string): number {
  return heldSources(graph, godId).filter(({ src }) => src.kind === 'faithfulCommunity').length;
}

type FormOutcome = { formed: true } | { formed: false; skipped: 'cap' | 'hosts_source' | 'helper_failed' };

/** Write the faithful source on a recovered town through the consecrate helper. */
export function formFaithful(graph: WorldGraph, godId: string, townId: string, tick: number): FormOutcome {
  const town = graph.getNode(townId);
  if (readEssenceSource(town?.properties)) return { formed: false, skipped: 'hosts_source' };
  if (faithfulCount(graph, godId) >= FAITHFUL_COMMUNITY_MAX) return { formed: false, skipped: 'cap' };
  const sphere = godPrimaryByPoints(graph, godId);
  if (!sphere) return { formed: false, skipped: 'helper_failed' };
  const res = writeEssenceSource(graph, {
    hostId: townId,
    actorId: godId,
    sphere,
    kind: 'faithfulCommunity',
    sanctity: FAITHFUL_INITIAL_SANCTITY,
    tick,
  });
  if (!res.success) {
    console.warn(`[prayers] faithful source on ${townId} failed: ${res.error}`);
    return { formed: false, skipped: 'helper_failed' };
  }
  if (res.createdId) graph.updateNode(townId, { properties: { [FAITH_CONTROLS_EDGE_PROP]: res.createdId } });
  return { formed: true };
}

/** One town's daily settling pass: close an open or answered prayer. Opening is the phase's second pass. */
function dailyTown(state: GameState, town: GraphNode, events: TickEvent[]): void {
  const { graph, ascendantId, tick } = state;
  const god = godName(graph, ascendantId);
  const active = activePrayerOf(graph, town.id);

  if (active?.status === 'open') {
    if (tick < active.closesTick) return;
    // The window closed unanswered: the rival answers instead.
    setPrayerStatus(graph, active.eventId, 'unanswered', { closedTick: tick });
    clearActive(graph, town.id);
    graph.updateNode(town.id, { properties: { [PRAYER_SLIGHTED_UNTIL_PROP]: tick + PRAYER_SLIGHT_DAYS * TICKS_PER_DAY } });
    emitTrace({
      category: 'prayer.closed', tick,
      summary: `${town.name}'s prayer went unanswered; it is first on the rival's list`,
      townId: town.id, eventId: active.eventId, status: 'unanswered', faithFormed: false, skipped: null,
    });
    const rival = answeringRival(state);
    chronicle(events, tick, town, prayerLine('unanswered', { town: town.name, god, rival: rival?.name }, active.eventId, tick), `unanswered_${town.id}`);
    return;
  }

  if (active?.status === 'answered') {
    const answeredTick = active.answeredTick ?? active.openedTick;
    const recovered = !isRestlessPlace(graph, town.id);
    if (recovered) {
      const outcome = formFaithful(graph, ascendantId, town.id, tick);
      setPrayerStatus(graph, active.eventId, 'recovered', { closedTick: tick });
      clearActive(graph, town.id);
      emitTrace({
        category: 'prayer.closed', tick,
        summary: outcome.formed
          ? `${town.name} recovered and keeps faith with the god`
          : `${town.name} recovered; no faithful town (${outcome.skipped})`,
        townId: town.id, eventId: active.eventId, status: 'recovered',
        faithFormed: outcome.formed, skipped: outcome.formed ? null : outcome.skipped,
      });
      chronicle(events, tick, town,
        prayerLine(outcome.formed ? 'faith_formed' : 'thanks_only', { town: town.name, god }, active.eventId, tick),
        `recovered_${town.id}`);
      return;
    }
    if (tick - answeredTick > PRAYER_RECOVERY_WINDOW_DAYS * TICKS_PER_DAY) {
      setPrayerStatus(graph, active.eventId, 'unrecovered', { closedTick: tick });
      clearActive(graph, town.id);
      emitTrace({
        category: 'prayer.closed', tick,
        summary: `${town.name} was answered but did not recover in time`,
        townId: town.id, eventId: active.eventId, status: 'unrecovered', faithFormed: false, skipped: null,
      });
      chronicle(events, tick, town, prayerLine('unrecovered', { town: town.name, god }, active.eventId, tick), `unrecovered_${town.id}`);
    }
    return;
  }

}

/**
 * The four-part gate: hungry and Restless, cooldown clear, not already faithful, on the
 * god's ground. A town with an active prayer never passes.
 */
export function passesPrayerGate(graph: WorldGraph, godId: string, town: GraphNode, tick: number): boolean {
  if (activePrayerOf(graph, town.id)) return false;
  if (!isHungryForPrayer(graph, town)) return false;
  if (!cooldownClear(town, tick)) return false;
  if (readEssenceSource(town.properties)?.kind === 'faithfulCommunity'
    && graph.getOutgoingEdges(godId, 'controls').some(e => e.target === town.id)) {
    // A town that already keeps faith asks nothing more; its faith rides its bread.
    return false;
  }
  return onGodsGround(graph, godId, town.id);
}

/** Prayers the god has open now. */
export function openPrayerCount(graph: WorldGraph): number {
  return listPrayers(graph).filter(p => p.status === 'open').length;
}

/** Whether the god can hear a new prayer today: under `PRAYER_MAX_OPEN` and a season since the last. */
export function godCanHear(graph: WorldGraph, godId: string, tick: number): boolean {
  if (openPrayerCount(graph) >= PRAYER_MAX_OPEN) return false;
  const last = num(graph.getNode(godId)?.properties?.[LAST_GOD_PRAYER_TICK_PROP]);
  return last === undefined || tick - last >= PRAYER_GOD_GAP_DAYS * TICKS_PER_DAY;
}

/**
 * The hungriest of the day's gate-passing towns: largest `unrestInputs.hunger`, ties to
 * the lower id. No draw (calibration ruling 2026-10-17).
 */
export function pickHungriest(towns: readonly GraphNode[]): GraphNode | null {
  let best: GraphNode | null = null;
  let bestHunger = -Infinity;
  for (const town of towns) {
    const hunger = readUnrestInputs(town)?.hunger ?? 0;
    if (hunger > bestHunger || (hunger === bestHunger && best && town.id < best.id)) {
      best = town;
      bestHunger = hunger;
    }
  }
  return best;
}

/** A faithful town whose faith ran out turns away: the bag and the god's `controls` edge go. */
function lapseFaithful(state: GameState, events: TickEvent[]): number {
  const { graph, ascendantId, tick } = state;
  let lapsed = 0;
  for (const { host, src } of heldSources(graph, ascendantId)) {
    if (src.kind !== 'faithfulCommunity') continue;
    const sanctity = Number.isFinite(src.sanctity) ? src.sanctity : 0;
    if (sanctity > FAITHFUL_LAPSE_SANCTITY) continue;
    removeFaithful(graph, ascendantId, host.id);
    lapsed++;
    emitTrace({
      category: 'prayer.faith_lapsed', tick,
      summary: `${host.name}'s faithful turned away (faith ${sanctity.toFixed(2)})`,
      townId: host.id, sanctityBefore: sanctity, sanctityAfter: 0, cause: 'hunger', rivalId: null,
    });
    chronicle(events, tick, host, prayerLine('lapsed', { town: host.name, god: godName(graph, ascendantId) }, host.id, tick), `lapsed_${host.id}`);
  }
  return lapsed;
}

function removeFaithful(graph: WorldGraph, godId: string, hostId: string): void {
  const edgeId = graph.getNode(hostId)?.properties?.[FAITH_CONTROLS_EDGE_PROP];
  graph.updateNode(hostId, { properties: { essenceSource: undefined, [FAITH_CONTROLS_EDGE_PROP]: undefined } });
  // Only the edge the faith wrote: a control the god held before stays.
  for (const e of graph.getOutgoingEdges(godId, 'controls')) {
    if (e.target === hostId && e.id === edgeId) graph.removeEdge(e.id);
  }
}

/**
 * Phase: prayer (daily, after `location_trait` so it reads the day's Restless chip).
 * The faith lapse runs every tick, so a town leaves the Covenants list in the tick its
 * faith runs out (Law 56).
 */
export function phasePrayers(state: GameState): Partial<GameState> {
  if (!PRAYER_ENABLED) return {};
  const { graph, ascendantId, tick } = state;
  if (!graph.getNode(ascendantId)) return {};
  const events: TickEvent[] = [];
  try {
    lapseFaithful(state, events);
  } catch {
    // Fail-soft: a failed lapse pass retries next tick.
  }
  if (tick % TICKS_PER_DAY === 0) {
    const towns = getLocationNodes(graph)
      .filter(isPressureSettlement)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    // Pass one: settle every town's open or answered prayer.
    for (const town of towns) {
      try {
        dailyTown(state, town, events);
      } catch {
        // Fail-soft: one town's failure skips that town.
      }
    }
    // Pass two: the god hears at most one new prayer, the hungriest gate-passing town's.
    try {
      if (godCanHear(graph, ascendantId, tick)) {
        const passing = towns.filter(t => {
          try { return passesPrayerGate(graph, ascendantId, t, tick); } catch { return false; }
        });
        const chosen = pickHungriest(passing);
        if (chosen) openPrayer(state, chosen.id, events);
      }
    } catch {
      // Fail-soft: no prayer opens today.
    }
  }
  if (events.length === 0) return {};
  return { tickEvents: [...state.tickEvents, ...events] };
}

// ─── The answer (cast resolution hook) ───────────────────────────────

export interface PrayerCastResult {
  pressures: SpherePressureEvent[];
  change: EncounterAftermathChange | null;
}

const NONE: PrayerCastResult = { pressures: [], change: null };

function pushSplit(
  graph: WorldGraph,
  godId: string,
  placeId: string,
  total: number,
  source: PressureSource,
  sourceId: string,
): { pressures: SpherePressureEvent[]; split: Partial<Record<SphereName, number>> } {
  const points = getSpherePoints(graph.getNode(godId)?.properties);
  let split = splitByPoints(total, points);
  if (Object.keys(split).length === 0) {
    const primary = godPrimaryByPoints(graph, godId);
    split = primary ? { [primary]: total } : {};
  }
  const pressures: SpherePressureEvent[] = [];
  for (const [s, m] of Object.entries(split)) {
    if (m && m > 0) pressures.push({ targetEntityId: placeId, sphere: s as SphereName, magnitude: m, source, sourceId });
  }
  return { pressures, split };
}

/** Does this template carry the `answers_prayer` flag? */
export function answersPrayer(template: { progression?: { flags?: readonly string[] } } | undefined): boolean {
  return !!template?.progression?.flags?.includes(ANSWERS_PRAYER_FLAG);
}

/**
 * A successful player cast of an answering card on a settlement: answer its open
 * prayer (push 2, `participated_in` god → prayer), or — no prayer, hungry and off
 * the god's ground, cooldown clear — give unbidden aid (push 1, sets the cooldown).
 * Returns the pushes and the receipt line. Fail-soft: any miss returns nothing.
 */
export function resolvePrayerCast(
  state: Pick<GameState, 'graph' | 'ascendantId' | 'tick'>,
  cast: { templateId: string; actionId: string; targetId: string | undefined; success: boolean; isPlayerCast: boolean },
  template: { progression?: { flags?: readonly string[] } } | undefined,
): PrayerCastResult {
  if (!PRAYER_ENABLED || !cast.success || !cast.isPlayerCast || !cast.targetId) return NONE;
  if (!answersPrayer(template)) return NONE;
  try {
    const { graph, ascendantId, tick } = state;
    const node = graph.getNode(cast.targetId);
    const town = isPressureSettlement(node) ? node : resolveToParentLocation(graph, node);
    if (!isPressureSettlement(town)) return NONE;
    const god = godName(graph, ascendantId);
    const active = activePrayerOf(graph, town.id);

    if (active) {
      if (active.status !== 'open') return NONE; // a second answer does nothing more
      graph.addEdge({
        id: `participated_in_${ascendantId}_${active.eventId}`,
        source: ascendantId, target: active.eventId, type: 'participated_in',
        properties: { role: 'answered', tick, actionId: cast.actionId },
      });
      setPrayerStatus(graph, active.eventId, 'answered', { answeredTick: tick });
      const { pressures, split } = pushSplit(graph, ascendantId, town.id, ANSWERED_PRAYER_DOMINION_PRESSURE, 'prayer_answered', cast.actionId);
      emitTrace({
        category: 'prayer.answered', tick,
        summary: `The god answered ${town.name}'s prayer with ${cast.templateId}`,
        townId: town.id, eventId: active.eventId, templateId: cast.templateId, actionId: cast.actionId,
        pressure: ANSWERED_PRAYER_DOMINION_PRESSURE, split,
      });
      return { pressures, change: receiptChange('answered', town, god, cast.actionId, tick) };
    }

    // Unbidden aid: the same hunger gate, below the band, cooldown clear.
    if (!isHungryForPrayer(graph, town) || !cooldownClear(town, tick)) return NONE;
    if (onGodsGround(graph, ascendantId, town.id)) return NONE;
    graph.updateNode(town.id, { properties: { [LAST_PRAYER_TICK_PROP]: tick } });
    const { pressures, split } = pushSplit(graph, ascendantId, town.id, UNBIDDEN_AID_DOMINION_PRESSURE, 'unbidden_aid', cast.actionId);
    emitTrace({
      category: 'prayer.unbidden', tick,
      summary: `The god fed ${town.name} unasked, off its ground`,
      townId: town.id, eventId: null, templateId: cast.templateId, actionId: cast.actionId,
      pressure: UNBIDDEN_AID_DOMINION_PRESSURE, split,
    });
    return { pressures, change: receiptChange('unbidden', town, god, cast.actionId, tick) };
  } catch {
    return NONE;
  }
}

function receiptChange(
  kind: 'answered' | 'unbidden',
  town: GraphNode,
  god: string | undefined,
  actionId: string,
  tick: number,
): EncounterAftermathChange | null {
  const detail = prayerLine(kind, { town: town.name, god }, town.id, tick);
  if (!detail) return null;
  return {
    id: `${actionId}:prayer:${kind}`,
    kind: 'future_hook',
    title: PRAYER_RECEIPT_TITLES[kind],
    detail,
    polarity: 'info',
    subjectId: town.id,
    stateNoun: { text: town.name, entityId: town.id, visualKind: 'location', visualName: town.name },
  };
}

// ─── The rival's answer ──────────────────────────────────────────────

/** Is this town still first on the rival's list? */
export function isSlighted(node: GraphNode | undefined, tick: number): boolean {
  const until = num(node?.properties?.[PRAYER_SLIGHTED_UNTIL_PROP]);
  return until !== undefined && tick < until;
}

/**
 * The slighted town among `candidates`, ties to the lower id. Consumes no draw, so a
 * world with no slight draws exactly as before (plan § PRNG callouts).
 */
export function pickSlightedTown(candidates: readonly GraphNode[], tick: number): GraphNode | undefined {
  if (!PRAYER_ENABLED) return undefined;
  let best: GraphNode | undefined;
  for (const n of candidates) {
    if (!isSlighted(n, tick)) continue;
    if (!best || n.id < best.id) best = n;
  }
  return best;
}

/** The slight clears on its first landing. */
export function landOnSlightedTown(graph: WorldGraph, townId: string, rivalId: string, via: 'raid' | 'scheme', tick: number): void {
  graph.updateNode(townId, { properties: { [PRAYER_SLIGHTED_UNTIL_PROP]: undefined } });
  emitTrace({
    category: 'prayer.slight_landed', tick,
    summary: `${rivalId} landed first on ${townId}, whose prayer went unanswered`,
    townId, rivalId, via,
  });
}

/**
 * The `starve-faithful` crack: drain the target's faith when it keeps faith with the
 * player's god. Returns the chronicle line, or null when there is no faith to starve.
 */
export function starveFaithful(
  state: Pick<GameState, 'graph' | 'ascendantId' | 'tick'>,
  townId: string,
  rival: { id: string; name: string },
): TickEvent | null {
  if (!PRAYER_ENABLED) return null;
  const { graph, ascendantId, tick } = state;
  const host = graph.getNode(townId);
  const src = readEssenceSource(host?.properties);
  if (!host || src?.kind !== 'faithfulCommunity') return null;
  if (!graph.getOutgoingEdges(ascendantId, 'controls').some(e => e.target === townId)) return null;
  const before = Number.isFinite(src.sanctity) ? src.sanctity : 0;
  const after = Math.max(0, before - STARVE_FAITHFUL_SANCTITY_DRAIN);
  const next: EssenceSource = { ...src, sanctity: after };
  graph.updateNode(townId, { properties: { essenceSource: next } });
  emitTrace({
    category: 'prayer.faith_starved', tick,
    summary: `${rival.name} starved ${host.name}'s faith (${before.toFixed(2)} → ${after.toFixed(2)})`,
    townId, sanctityBefore: before, sanctityAfter: after, cause: 'rival_scheme', rivalId: rival.id,
  });
  const events: TickEvent[] = [];
  chronicle(events, tick, host, prayerLine('starved', { town: host.name, rival: rival.name }, townId, tick), `starved_${townId}`);
  return events[0] ?? null;
}

// ─── Debug reads ─────────────────────────────────────────────────────

export interface FaithfulRecord {
  townId: string;
  sanctity: number;
  wavering: boolean;
  sphere: SphereName | null;
}

export function listFaithful(graph: WorldGraph, godId: string): FaithfulRecord[] {
  return heldSources(graph, godId)
    .filter(({ src }) => src.kind === 'faithfulCommunity')
    .map(({ host, src }) => {
      const sanctity = Number.isFinite(src.sanctity) ? src.sanctity : 0;
      return { townId: host.id, sanctity, wavering: sanctity < FAITHFUL_WAVERING_SANCTITY, sphere: src.sphereAffinity ?? null };
    })
    .sort((a, b) => (a.townId < b.townId ? -1 : 1));
}
