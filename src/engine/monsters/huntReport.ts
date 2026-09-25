/**
 * The hunt ledger — what the CLI's `hunts` readout reports (THR-1560, plan doc
 * `Docs/plans/2026-09-23-hunts.md` § Debug inspection and § Slices H2).
 *
 * A hunt spans many ticks and its evidence is spread across traces that the ring
 * buffer does not keep for a 300-tick run, so a caller that drives ticks **harvests**
 * each tick into a {@link HuntLedger} and reads {@link describeHunts} at the end:
 *
 * - **founded** — every `cell.destroy.monster` project seen (any status), by project id;
 * - **tracked** — `hunt.tracked` traces;
 * - **planted** — the confront appointments, with the travel ticks the hunter faced
 *   at plant time (`computeAppointmentSlack`);
 * - **kept / missed** — `appointment_kept` / `appointment_missed` on a hunt seed, with
 *   each miss's reason (the lever the kill criterion reads);
 * - **out of scan** — reason-holders whose beast lies beyond the monster scan cap
 *   (`HUNT_TARGET_SCAN_CAP` nearest), read off the live world (expected 0).
 *
 * Pure over what it is handed; nothing is cached at module scope (a ledger is the
 * caller's). Fail-soft: an unreadable node reads as "not counted".
 */

import type { GameState } from '../../types/gameState';
import type { TraceEntry } from '../../types/trace';
import type { WorldGraph } from '../graph';
import { computeAppointmentSlack, readPlantedAppointment } from '../appointments';
import { getAgentLocationId } from '../graphQueries';
import { resolveLocationToHex } from '../encounterAwareness';
import { hexDistance } from '../../lib/hexMath';
import { isAgentGone } from '../groups/groupQueries';
import { isMonster } from './isMonster';
import { huntReason, isLiveMonster } from './hunts';
import { HUNT_TARGET_SCAN_CAP } from '../../data/strategic-action-constants';

/** The cell a hunt runs on, and the prefix its appointment seeds carry. */
export const HUNT_CELL_ID = 'cell.destroy.monster';
export const HUNT_SEED_PREFIX = `appointment_${HUNT_CELL_ID}_`;

export interface HuntLedger {
  readonly founded: Set<string>;
  tracked: number;
  readonly planted: { seedId: string; hunterId: string; tick: number; travelTicks: number | null }[];
  readonly kept: { seedId: string; hunterId: string; tick: number }[];
  readonly missed: { seedId: string; hunterId: string; tick: number; reason: string }[];
  /** Traces already counted, so a re-harvest of the same buffer never double-counts. */
  readonly seen: Set<string>;
}

export function createHuntLedger(): HuntLedger {
  return { founded: new Set(), tracked: 0, planted: [], kept: [], missed: [], seen: new Set() };
}

function traceKey(t: TraceEntry & Record<string, unknown>): string {
  return `${t.category}|${t.tick}|${String(t.seedId ?? '')}|${String(t.hunterId ?? '')}|${String(t.monsterId ?? '')}|${String(t.markEdgeId ?? '')}`;
}

/**
 * Fold one tick's evidence into the ledger: the live projects (founded), and the
 * given traces (tracked, planted, kept, missed). Call after every `runTick`, passing
 * the traces the tick emitted (or the whole buffer — the ledger de-duplicates).
 */
export function recordHuntTick(ledger: HuntLedger, state: GameState, traces: readonly TraceEntry[]): void {
  for (const p of state.strategicState?.projects ?? []) {
    if (p.templateId === HUNT_CELL_ID) ledger.founded.add(p.projectId);
  }
  for (const raw of traces) {
    const t = raw as TraceEntry & Record<string, unknown>;
    const key = traceKey(t);
    if (ledger.seen.has(key)) continue;
    const seedId = typeof t.seedId === 'string' ? t.seedId : '';
    const agentId = typeof t.agentId === 'string' ? t.agentId : '';
    if (t.category === 'hunt.tracked') {
      ledger.seen.add(key);
      ledger.tracked += 1;
    } else if (t.category === 'appointment_planted' && t.templateId === HUNT_CELL_ID && !t.refused) {
      ledger.seen.add(key);
      const seed = (state.pendingEncounterSeeds ?? []).find(s => s.seedId === seedId);
      const appointment = readPlantedAppointment(seed);
      const slack = appointment ? computeAppointmentSlack(state.graph, agentId, appointment, t.tick) : null;
      ledger.planted.push({
        seedId, hunterId: agentId, tick: t.tick,
        travelTicks: slack && Number.isFinite(slack.travelTicks) ? slack.travelTicks : null,
      });
    } else if (t.category === 'appointment_kept' && seedId.startsWith(HUNT_SEED_PREFIX)) {
      ledger.seen.add(key);
      ledger.kept.push({ seedId, hunterId: agentId, tick: t.tick });
    } else if (t.category === 'appointment_missed' && seedId.startsWith(HUNT_SEED_PREFIX)) {
      ledger.seen.add(key);
      ledger.missed.push({ seedId, hunterId: agentId, tick: t.tick, reason: String(t.reason ?? 'unknown') + (t.dropped ? ' (dropped)' : '') });
    }
  }
}

/** Where an actor stands, as a hex. */
function actorHex(graph: WorldGraph, actorId: string): { col: number; row: number } | null {
  const loc = getAgentLocationId(graph, actorId);
  return loc ? resolveLocationToHex(graph, loc) : null;
}

/** One reason-holder whose beast the monster scan would not show them. */
export interface OutOfScanHolder {
  readonly hunterId: string;
  readonly monsterId: string;
  readonly reason: string;
  /** The beast's rank among the hunter's living monsters by distance (1 = nearest). */
  readonly rank: number;
}

/**
 * Every mortal holding a hunt reason whose beast falls outside the `HUNT_TARGET_SCAN_CAP`
 * nearest living monsters — the scan the candidate walk cuts before any gate. The plan
 * expects zero; a non-zero count is the kill criterion's "raise the cap".
 */
export function reasonHoldersOutsideScan(graph: WorldGraph, cap = HUNT_TARGET_SCAN_CAP): OutOfScanHolder[] {
  const out: OutOfScanHolder[] = [];
  const actors = graph.getNodesByType('actor');
  const monsters = actors.filter(n => isLiveMonster(n))
    .map(n => ({ id: n.id, hex: actorHex(graph, n.id) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (monsters.length <= cap) return out;
  for (const hunter of actors) {
    if (hunter.properties.actorType !== 'individual' || isMonster(hunter) || isAgentGone(hunter)) continue;
    const reasons = monsters
      .map(m => ({ m, reason: huntReason(graph, hunter.id, m.id) }))
      .filter((x): x is { m: typeof monsters[number]; reason: NonNullable<ReturnType<typeof huntReason>> } => x.reason !== null);
    if (reasons.length === 0) continue;
    const here = actorHex(graph, hunter.id);
    const ranked = [...monsters].sort((a, b) => {
      const da = here && a.hex ? hexDistance(here, a.hex) : Number.MAX_SAFE_INTEGER;
      const db = here && b.hex ? hexDistance(here, b.hex) : Number.MAX_SAFE_INTEGER;
      return da - db || a.id.localeCompare(b.id);
    });
    for (const { m, reason } of reasons) {
      const rank = ranked.findIndex(x => x.id === m.id) + 1;
      if (rank > cap) out.push({ hunterId: hunter.id, monsterId: m.id, reason, rank });
    }
  }
  return out;
}

export interface HuntReport {
  readonly livingMonsters: number;
  readonly founded: number;
  readonly activeHunts: number;
  readonly tracked: number;
  readonly planted: number;
  readonly kept: number;
  readonly missed: number;
  readonly missReasons: Readonly<Record<string, number>>;
  /** Travel ticks the hunter faced at plant time — min / median / max, or null when none were priced. */
  readonly travelTicks: { min: number; median: number; max: number } | null;
  readonly outOfScan: readonly OutOfScanHolder[];
}

/** The readout: the ledger's totals plus the live world's monster and scan counts. */
export function describeHunts(state: GameState, ledger: HuntLedger): HuntReport {
  const graph = state.graph;
  const livingMonsters = graph.getNodesByType('actor').filter(n => isLiveMonster(n)).length;
  const activeHunts = (state.strategicState?.projects ?? []).filter(p => p.templateId === HUNT_CELL_ID && p.status === 'active').length;
  const missReasons: Record<string, number> = {};
  for (const m of ledger.missed) missReasons[m.reason] = (missReasons[m.reason] ?? 0) + 1;
  const travel = ledger.planted.map(p => p.travelTicks).filter((x): x is number => x !== null).sort((a, b) => a - b);
  return {
    livingMonsters,
    founded: ledger.founded.size,
    activeHunts,
    tracked: ledger.tracked,
    planted: ledger.planted.length,
    kept: ledger.kept.length,
    missed: ledger.missed.length,
    missReasons,
    travelTicks: travel.length ? { min: travel[0], median: travel[Math.floor(travel.length / 2)], max: travel[travel.length - 1] } : null,
    outOfScan: reasonHoldersOutsideScan(graph),
  };
}
