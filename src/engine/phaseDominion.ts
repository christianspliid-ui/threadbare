/**
 * Phase: Dominion — the per-tick writers of the god's turf (THR-1748).
 *
 * Runs after `phaseControlEffects` and before `phaseSpherePressure`, so its pushes
 * resolve in the same tick as every other writer's:
 *   (a) enqueues the tending pushes — Claim, the seat, threaded mortals (THR-1762);
 *   (b) relaxes every untended place toward its seeded scores (neglect, THR-1763);
 *   (c) notes which writers touched each place this tick, for the band-change cause.
 *
 * `afterSpherePressure` runs right after `phaseSpherePressure`: it applies the seat
 * floor, diffs every place's band against last tick's, traces the changes and, once
 * a day, turns them into chronicle lines — one coalesced drop line, a line per place
 * that rose to Held or Sovereign, a line per sphere the god's power grew in (Law 49:
 * no toast, no interrupt).
 *
 * State: the phase's memory lives on the ascendant node as `dominionLedger` (graph-
 * held, no module singleton). Fail-soft throughout: a failed step skips that step.
 *
 * Plan: Docs/plans/2026-10-11-thr-1748-dominion-core.md § E3–E4, § Tick phases.
 */

import { SPHERE_NAMES, type SphereName } from '../types/index';
import type { GameState, TickEvent } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { SphereAffinity, SpherePressureEvent, PressureSource } from '../types/sphereAffinity';
import { MAX_SPHERE_SCORE, triangleCost } from '../types/sphereAffinity';
import type { DominionBandChangeCause } from '../types/traces/dominion-traces';
import { getLocationNodes } from './sublocationShape';
import { isValidSphereAffinity } from './sphereAffinity';
import { emitTrace } from './traceBuffer';
import { getSpherePoints, rankSpherePoints, type SpherePoints } from './spherePoints';
import {
  type DominionBand,
  type TendedBy,
  bandAtLeast,
  bearsBestowedGift,
  buildTendingIndex,
  dominionOf,
  isTended,
  placeOf,
} from './dominion';
import {
  DOMINION_BAND_RANK,
  DOMINION_BAND_WORDS,
  DOMINION_BESTOW_CARRY_TIER_STEP,
  DOMINION_CARRY_CAP_PER_PLACE,
  DOMINION_CHRONICLE_MAX_NAMES,
  DOMINION_CHRONICLE_SIGNIFICANCE,
  DOMINION_CHRONICLE_TEMPLATES,
  DOMINION_CLAIM_PRESSURE_PER_TICK,
  DOMINION_RISE_LINE_BANDS,
  DOMINION_SEAT_FLOOR_BAND,
  DOMINION_SEAT_PRESSURE_PER_TICK,
  DOMINION_SPHERE_WORDS,
  DOMINION_THREAD_CARRY_PER_TICK,
  DOMINION_UNTENDED_DECAY_PER_TICK,
  DOMINION_RAID_PLACES_PER_DAILY_BURST,
} from '../data/dominion-content';
import { TICKS_PER_DAY } from '../data/attention-constants';

// ─── The ledger (graph-held phase memory) ────────────────────────────

interface DominionDayDrop { placeId: string; from: DominionBand; to: DominionBand; cause: DominionBandChangeCause; rivalId?: string }

/** What the phase remembers between ticks, on the ascendant node. */
export interface DominionLedger {
  /** Each top-level place's band at the end of the last tick. */
  bands: Record<string, DominionBand>;
  /** Writers that touched each place this tick (set in phaseDominion, read after pressure). */
  causes: Record<string, DominionBandChangeCause>;
  /** The rival behind a `rival` cause this tick. */
  rivals: Record<string, string>;
  /** Drops and rises waiting for today's chronicle. */
  dayDrops: DominionDayDrop[];
  dayRises: Record<string, DominionBand>;
  /** The god's bought-sphere scores at the end of the last tick (power-line diff). */
  godScores: Partial<Record<SphereName, number>>;
  daySpheres: SphereName[];
  /** Raid throttle: the day and the landings made on it, all rivals together. */
  raidDay: number;
  raidLanded: number;
}

export const DOMINION_LEDGER_KEY = 'dominionLedger';

function emptyLedger(): DominionLedger {
  return { bands: {}, causes: {}, rivals: {}, dayDrops: [], dayRises: {}, godScores: {}, daySpheres: [], raidDay: -1, raidLanded: 0 };
}

export function readDominionLedger(graph: WorldGraph, ascendantId: string): DominionLedger {
  const raw = graph.getNode(ascendantId)?.properties[DOMINION_LEDGER_KEY] as Partial<DominionLedger> | undefined;
  return { ...emptyLedger(), ...(raw && typeof raw === 'object' ? raw : {}) };
}

function writeLedger(graph: WorldGraph, ascendantId: string, ledger: DominionLedger): void {
  graph.updateNode(ascendantId, { properties: { [DOMINION_LEDGER_KEY]: ledger } });
}

/** The raid day a tick falls on. */
export function raidDayOf(tick: number): number {
  return Math.floor(tick / TICKS_PER_DAY);
}

/**
 * Raids still allowed today, all rivals together: one landing a day per
 * `DOMINION_RAID_PLACES_PER_DAILY_BURST` of the god's Touched-or-better places
 * (THR-1763), less the landings already made today.
 */
export function raidAllowanceLeft(graph: WorldGraph, ascendantId: string, tick: number, turfCount: number): number {
  const ledger = readDominionLedger(graph, ascendantId);
  const landed = ledger.raidDay === raidDayOf(tick) ? ledger.raidLanded : 0;
  return Math.max(0, Math.floor(turfCount / DOMINION_RAID_PLACES_PER_DAILY_BURST) - landed);
}

/** Count one raid landing against today's allowance. */
export function recordRaidLanding(graph: WorldGraph, ascendantId: string, tick: number): void {
  const ledger = readDominionLedger(graph, ascendantId);
  const day = raidDayOf(tick);
  const landed = ledger.raidDay === day ? ledger.raidLanded : 0;
  writeLedger(graph, ascendantId, { ...ledger, raidDay: day, raidLanded: landed + 1 });
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Split `total` pressure across the bought spheres by points. */
export function splitByPoints(total: number, points: SpherePoints): Partial<Record<SphereName, number>> {
  let sum = 0;
  for (const s of SPHERE_NAMES) sum += Math.max(0, points[s] ?? 0);
  const out: Partial<Record<SphereName, number>> = {};
  if (sum <= 0 || total <= 0) return out;
  for (const s of SPHERE_NAMES) {
    const p = Math.max(0, points[s] ?? 0);
    if (p > 0) out[s] = total * (p / sum);
  }
  return out;
}

/** The scores a place was seeded with — recorded once, the floor neglect never crosses. */
export const DOMINION_SEEDED_SCORES_KEY = 'dominionSeededScores';

export function readSeededScores(node: GraphNode | undefined): Partial<Record<SphereName, number>> | undefined {
  const raw = node?.properties[DOMINION_SEEDED_SCORES_KEY];
  return raw && typeof raw === 'object' ? raw as Partial<Record<SphereName, number>> : undefined;
}

/** Record `dominionSeededScores` on every top-level place that lacks it. Returns how many. */
export function recordSeededScores(graph: WorldGraph): number {
  let n = 0;
  for (const place of getLocationNodes(graph)) {
    if (readSeededScores(place)) continue;
    const bag = place.properties.sphereAffinity;
    if (!isValidSphereAffinity(bag)) continue;
    const seeded: Partial<Record<SphereName, number>> = {};
    for (const s of SPHERE_NAMES) seeded[s] = (bag as SphereAffinity).scores[s] ?? 0;
    graph.updateNode(place.id, { properties: { [DOMINION_SEEDED_SCORES_KEY]: seeded } });
    n++;
  }
  return n;
}

/** Neglect owed against each sphere's current level, on the place node. */
export const DOMINION_NEGLECT_DEBT_KEY = 'dominionNeglectDebt';

/**
 * Relax one place's bought spheres toward their seeded scores by `decay` a tick
 * each (§ E4 neglect) — the mirror of building. Decay first eats the progress
 * toward the next level; past that it runs up a debt against the current level,
 * and the score drops a point only when the debt reaches that level's whole
 * triangle cost (what it cost to build). So a Held place slips over weeks, not on
 * its first untended tick. Nothing falls below the seed, and the opposing poles are
 * never touched (a broken pole never regrows). Pure.
 */
export function relaxTowardSeed(
  affinity: SphereAffinity,
  seeded: Partial<Record<SphereName, number>>,
  bought: readonly SphereName[],
  decay: number,
  debt: Partial<Record<SphereName, number>> = {},
): { updated: SphereAffinity; debt: Partial<Record<SphereName, number>>; touched: SphereName[]; dropped: SphereName[] } {
  const scores = { ...affinity.scores };
  const progress = { ...affinity.progress };
  const nextDebt: Partial<Record<SphereName, number>> = { ...debt };
  const touched: SphereName[] = [];
  const dropped: SphereName[] = [];
  for (const s of bought) {
    const floor = Math.max(0, seeded[s] ?? 0);
    const score = scores[s] ?? 0;
    const prog = progress[s] ?? 0;
    if (score < floor || (score === floor && prog <= 0)) {
      delete nextDebt[s];
      continue;
    }
    touched.push(s);
    const fromProgress = Math.min(Math.max(0, prog), decay);
    progress[s] = prog - fromProgress;
    const rest = decay - fromProgress;
    if (rest <= 0 || score <= floor) continue;
    const owed = (nextDebt[s] ?? 0) + rest;
    const levelCost = triangleCost(score);
    if (owed >= levelCost) {
      scores[s] = score - 1;
      progress[s] = 0;
      const carry = owed - levelCost;
      if (carry > 0 && score - 1 > floor) nextDebt[s] = carry;
      else delete nextDebt[s];
      dropped.push(s);
    } else {
      nextDebt[s] = owed;
    }
  }
  return { updated: { scores, progress }, debt: nextDebt, touched, dropped };
}

const CAUSE_BY_SOURCE: Partial<Record<PressureSource, DominionBandChangeCause>> = {
  rival: 'rival',
  doom: 'doom',
  claim: 'claim',
  seat: 'seat',
  carry: 'carry',
  divine_action: 'cast',
};

/** The cause rank when several writers touched a place — a hostile cause wins the line. */
const CAUSE_PRIORITY: readonly DominionBandChangeCause[] = ['rival', 'doom', 'neglect', 'cast', 'claim', 'seat', 'carry', 'other'];

function strongerCause(a: DominionBandChangeCause | undefined, b: DominionBandChangeCause): DominionBandChangeCause {
  if (!a) return b;
  return CAUSE_PRIORITY.indexOf(a) <= CAUSE_PRIORITY.indexOf(b) ? a : b;
}

function nameOf(graph: WorldGraph, id: string): string {
  const n = graph.getNode(id);
  return (typeof n?.name === 'string' && n.name) || (typeof n?.properties.name === 'string' && (n.properties.name as string)) || id;
}

// ─── Phase (before pressure) ─────────────────────────────────────────

/**
 * Enqueue the tending pushes, apply neglect, note this tick's writers per place.
 * Returns the extended `pendingSpherePressures`.
 */
export function phaseDominion(state: GameState): Partial<GameState> {
  const { graph, ascendantId } = state;
  const god = graph.getNode(ascendantId);
  if (!god) return {};
  const points = getSpherePoints(god.properties);
  const bought = rankSpherePoints(points);
  if (bought.length === 0) return {};

  const pressures: SpherePressureEvent[] = [];
  try {
    recordSeededScores(graph);
    const ledger = readDominionLedger(graph, ascendantId);
    const bandOf = (placeId: string): DominionBand => ledger.bands[placeId] ?? dominionOf(graph, ascendantId, placeId).band;
    const index = buildTendingIndex(graph, ascendantId, state.controlEffects, bandOf);
    const causes: Record<string, DominionBandChangeCause> = {};
    const rivals: Record<string, string> = {};

    // (a) Tending pushes.
    const push = (placeId: string, total: number, source: PressureSource, sourceId: string) => {
      for (const [s, m] of Object.entries(splitByPoints(total, points))) {
        if (m && m > 0) pressures.push({ targetEntityId: placeId, sphere: s as SphereName, magnitude: m, source, sourceId });
      }
    };
    const tendTrace = new Map<string, { by: TendedBy[]; pushed: Partial<Record<SphereName, number>>; capped: boolean }>();
    const noteTend = (placeId: string, by: TendedBy, total: number, capped = false) => {
      const t = tendTrace.get(placeId) ?? { by: [], pushed: {}, capped: false };
      if (!t.by.includes(by)) t.by.push(by);
      for (const [s, m] of Object.entries(splitByPoints(total, points))) t.pushed[s as SphereName] = (t.pushed[s as SphereName] ?? 0) + (m ?? 0);
      t.capped = t.capped || capped;
      tendTrace.set(placeId, t);
    };

    for (const [placeId, tendedBy] of index) {
      if (tendedBy.includes('claim')) {
        push(placeId, DOMINION_CLAIM_PRESSURE_PER_TICK, 'claim', ascendantId);
        noteTend(placeId, 'claim', DOMINION_CLAIM_PRESSURE_PER_TICK);
      }
      if (tendedBy.includes('seat')) {
        push(placeId, DOMINION_SEAT_PRESSURE_PER_TICK, 'seat', ascendantId);
        noteTend(placeId, 'seat', DOMINION_SEAT_PRESSURE_PER_TICK);
      }
    }

    // Threaded mortals carry the god's vector where they stand, capped per place.
    const carryByPlace = new Map<string, number>();
    for (const e of graph.getOutgoingEdges(ascendantId, 'thread')) {
      let tier = Math.round(Number(e.properties?.tier ?? 0));
      if (!Number.isFinite(tier) || tier < 1) continue;
      if (bearsBestowedGift(graph, e.target)) tier += DOMINION_BESTOW_CARRY_TIER_STEP;
      tier = Math.min(DOMINION_THREAD_CARRY_PER_TICK.length - 1, tier);
      const place = placeOf(graph, e.target);
      if (!place) continue;
      carryByPlace.set(place.id, (carryByPlace.get(place.id) ?? 0) + (DOMINION_THREAD_CARRY_PER_TICK[tier] ?? 0));
    }
    for (const [placeId, raw] of carryByPlace) {
      const capped = raw > DOMINION_CARRY_CAP_PER_PLACE;
      const total = Math.min(raw, DOMINION_CARRY_CAP_PER_PLACE);
      push(placeId, total, 'carry', ascendantId);
      noteTend(placeId, 'carry', total, capped);
    }
    for (const [placeId, t] of tendTrace) {
      // Anointed tending has no push of its own; it protects (neglect, raids).
      const by = [...t.by, ...(index.get(placeId)?.includes('anointed') ? ['anointed' as const] : [])];
      emitTrace({
        category: 'dominion.tend', tick: state.tick, placeId, by, pushed: t.pushed, capped: t.capped,
        summary: `${nameOf(graph, placeId)} tended by ${by.join(', ')}`,
      });
    }

    // (b) Neglect: every untended top-level place relaxes toward its seed (§ Decided 14).
    const neglected: string[] = [];
    const neglectDropped: string[] = [];
    for (const place of getLocationNodes(graph)) {
      const priorDebt = place.properties[DOMINION_NEGLECT_DEBT_KEY] as Partial<Record<SphereName, number>> | undefined;
      if (isTended(index, place.id)) {
        // Tending renews the hold: any neglect owed is forgiven.
        if (priorDebt && Object.keys(priorDebt).length > 0) graph.updateNode(place.id, { properties: { [DOMINION_NEGLECT_DEBT_KEY]: {} } });
        continue;
      }
      const seeded = readSeededScores(place);
      const bag = place.properties.sphereAffinity;
      if (!seeded || !isValidSphereAffinity(bag)) continue; // unknown floor → never decays
      const { updated, debt, touched, dropped } = relaxTowardSeed(
        bag as SphereAffinity, seeded, bought, DOMINION_UNTENDED_DECAY_PER_TICK, priorDebt ?? {},
      );
      if (touched.length === 0) continue;
      graph.updateNode(place.id, { properties: { sphereAffinity: updated, [DOMINION_NEGLECT_DEBT_KEY]: debt } });
      neglected.push(place.id);
      causes[place.id] = 'neglect';
      if (dropped.length > 0) neglectDropped.push(place.id);
    }
    if (neglected.length > 0) {
      emitTrace({
        category: 'dominion.neglect', tick: state.tick, placeIds: neglected, dropped: neglectDropped,
        summary: `${neglected.length} untended place(s) relaxed toward their seeds; ${neglectDropped.length} lost a point`,
      });
    }

    // (c) This tick's writers, per top-level place, for the band-change cause.
    for (const p of [...(state.pendingSpherePressures ?? []), ...pressures]) {
      const place = placeOf(graph, p.targetEntityId);
      if (!place) continue;
      const cause = CAUSE_BY_SOURCE[p.source] ?? 'other';
      causes[place.id] = strongerCause(causes[place.id], cause);
      if (p.source === 'rival') rivals[place.id] = p.sourceId;
    }
    writeLedger(graph, ascendantId, { ...ledger, causes, rivals });
  } catch {
    // Fail-soft: a failed Dominion pass costs this tick's tending, never the tick.
  }

  if (pressures.length === 0) return {};
  return { pendingSpherePressures: [...(state.pendingSpherePressures ?? []), ...pressures] };
}

// ─── After pressure ──────────────────────────────────────────────────

/**
 * Raise the seat's score in the god's primary sphere by the smallest whole step that
 * restores `DOMINION_SEAT_FLOOR_BAND`. Returns the place id when the clamp fired.
 */
export function applySeatFloor(graph: WorldGraph, ascendantId: string, tick: number): string | null {
  const god = graph.getNode(ascendantId);
  const seat = placeOf(graph, god?.properties.homeSeatLocationId as string | undefined);
  if (!god || !seat) return null;
  const before = dominionOf(graph, ascendantId, seat.id).band;
  if (bandAtLeast(before, DOMINION_SEAT_FLOOR_BAND)) return null;
  const primary = rankSpherePoints(getSpherePoints(god.properties))[0];
  const bag = seat.properties.sphereAffinity;
  if (!primary || !isValidSphereAffinity(bag)) return null;
  const scores = { ...(bag as SphereAffinity).scores };
  const progress = { ...(bag as SphereAffinity).progress };
  while ((scores[primary] ?? 0) < MAX_SPHERE_SCORE) {
    scores[primary] = (scores[primary] ?? 0) + 1;
    graph.updateNode(seat.id, { properties: { sphereAffinity: { scores, progress } } });
    if (bandAtLeast(dominionOf(graph, ascendantId, seat.id).band, DOMINION_SEAT_FLOOR_BAND)) break;
  }
  emitTrace({
    category: 'dominion.seat_floor', tick, placeId: seat.id, before, restoredSphere: primary,
    summary: `The seat ${nameOf(graph, seat.id)} was clamped back to ${DOMINION_SEAT_FLOOR_BAND}`,
  });
  return seat.id;
}

function formatList(names: string[]): string {
  const shown = names.slice(0, DOMINION_CHRONICLE_MAX_NAMES);
  const rest = names.length - shown.length;
  if (rest > 0) return `${shown.join(', ')} and others`;
  if (shown.length <= 1) return shown.join('');
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/** Today's chronicle lines from the ledger (pure over the ledger and names). */
export function composeDominionChronicle(
  ledger: Pick<DominionLedger, 'dayDrops' | 'dayRises' | 'daySpheres'>,
  name: (id: string) => string,
): string[] {
  const lines: string[] = [];
  // One drop line a day (Law 49): only places that were the god's (Touched or better).
  const drops = new Map<string, DominionDayDrop>();
  for (const d of ledger.dayDrops) {
    const prior = drops.get(d.placeId);
    drops.set(d.placeId, prior ? { ...d, from: prior.from } : d);
  }
  const real = [...drops.values()].filter(d => DOMINION_BAND_RANK[d.to] < DOMINION_BAND_RANK[d.from]);
  if (real.length === 1) {
    const d = real[0];
    lines.push(d.cause === 'rival' && d.rivalId
      ? DOMINION_CHRONICLE_TEMPLATES.dropRaid
        .replace('{rival}', name(d.rivalId)).replace('{place}', name(d.placeId)).replace('{to}', DOMINION_BAND_WORDS[d.to])
      : DOMINION_CHRONICLE_TEMPLATES.dropUntended
        .replace('{place}', name(d.placeId)).replace('{from}', DOMINION_BAND_WORDS[d.from]).replace('{to}', DOMINION_BAND_WORDS[d.to]));
  } else if (real.length > 1) {
    lines.push(DOMINION_CHRONICLE_TEMPLATES.dropMany
      .replace('{n}', String(real.length)).replace('{list}', formatList(real.map(d => name(d.placeId)))));
  }
  for (const [placeId, band] of Object.entries(ledger.dayRises)) {
    if (!DOMINION_RISE_LINE_BANDS.includes(band)) continue;
    lines.push(DOMINION_CHRONICLE_TEMPLATES.rise.replace('{place}', name(placeId)).replace('{to}', DOMINION_BAND_WORDS[band]));
  }
  for (const s of ledger.daySpheres) {
    lines.push(DOMINION_CHRONICLE_TEMPLATES.power.replace('{sphereWords}', DOMINION_SPHERE_WORDS[s] ?? s));
  }
  return lines;
}

/**
 * After `phaseSpherePressure`: seat floor, band diff and traces, and — on the day
 * boundary — the day's chronicle lines.
 */
export function afterSpherePressure(state: GameState): Partial<GameState> {
  const { graph, ascendantId } = state;
  const god = graph.getNode(ascendantId);
  if (!god) return {};
  const points = getSpherePoints(god.properties);
  const bought = rankSpherePoints(points);
  if (bought.length === 0) return {};

  const events: TickEvent[] = [];
  try {
    const ledger = readDominionLedger(graph, ascendantId);
    applySeatFloor(graph, ascendantId, state.tick);
    const first = Object.keys(ledger.bands).length === 0;

    const bands: Record<string, DominionBand> = {};
    const dayDrops = [...ledger.dayDrops];
    const dayRises = { ...ledger.dayRises };
    for (const place of getLocationNodes(graph)) {
      const read = dominionOf(graph, ascendantId, place.id);
      bands[place.id] = read.band;
      const from = ledger.bands[place.id];
      if (first || !from || from === read.band) continue;
      const cause = ledger.causes[place.id] ?? 'other';
      emitTrace({
        category: 'dominion.band_change', tick: state.tick, placeId: place.id, from, to: read.band, cause,
        match: read.reason.match, power: read.reason.power,
        summary: `${nameOf(graph, place.id)} ${from} → ${read.band} (${cause})`,
      });
      if (DOMINION_BAND_RANK[read.band] < DOMINION_BAND_RANK[from]) {
        if (bandAtLeast(from, 'touched')) dayDrops.push({ placeId: place.id, from, to: read.band, cause, rivalId: ledger.rivals[place.id] });
        delete dayRises[place.id];
      } else {
        dayRises[place.id] = read.band;
      }
    }

    // The god's power grew in a bought sphere → one line per sphere (coalesced daily).
    const godBag = god.properties.sphereAffinity;
    const godScores: Partial<Record<SphereName, number>> = {};
    const daySpheres = [...ledger.daySpheres];
    if (isValidSphereAffinity(godBag)) {
      for (const s of bought) {
        const now = (godBag as SphereAffinity).scores[s] ?? 0;
        godScores[s] = now;
        const was = ledger.godScores[s];
        if (!first && was !== undefined && now > was && !daySpheres.includes(s)) daySpheres.push(s);
      }
    }

    let next: DominionLedger = { ...ledger, bands, causes: {}, rivals: {}, dayDrops, dayRises, godScores, daySpheres };
    if (state.tick > 0 && state.tick % TICKS_PER_DAY === 0) {
      const lines = composeDominionChronicle(next, id => nameOf(graph, id));
      lines.forEach((message, i) => events.push({
        id: `dominion_evt_${state.tick}_${i}`,
        tick: state.tick,
        type: 'narrative',
        message,
        significance: DOMINION_CHRONICLE_SIGNIFICANCE,
      }));
      next = { ...next, dayDrops: [], dayRises: {}, daySpheres: [] };
    }
    writeLedger(graph, ascendantId, next);
  } catch {
    // Fail-soft: a failed diff costs this tick's lines, never the tick.
  }
  if (events.length === 0) return {};
  return { tickEvents: [...state.tickEvents, ...events] };
}
