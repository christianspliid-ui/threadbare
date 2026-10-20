/**
 * The town turns — the S2 daily pass (THR-1957, hunger and unrest S2; plan
 * `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md` § Engine 9–10, § Prose S2).
 *
 * Runs once a day after every settlement's S1 daily pass (so `hungerDays` is today's
 * everywhere, which the `fed` term reads), over settlements in id order:
 *
 * 1. **On the edge, entry** — the day a town gains the `on_the_edge` chip, one
 *    `town_on_the_edge` chronicle line (full-detail settlements only) and, when the god
 *    has a reason to hear of it, the event popup.
 * 2. **Rising** (`unrest ≥ RISING_THRESHOLD`, held, out of cooldown) — `rising.ts`. A
 *    town past the rising line has gone past choosing a lord, so the rising is tried
 *    before a defection on the same day.
 * 3. **Defection** (on the edge, held, out of cooldown) — `defection.ts`.
 *
 * Unheld towns never defect or rise; at the rising line they empty (the leave cadence
 * in `unrestPressure.ts`), and `noteEmptied` writes the line when the last person goes.
 *
 * **The popup gate** (the decision's words): only when a threaded mortal lives in the
 * town, or the god keeps a shrine there. The game has no shrine node; its shrine is an
 * essence source the god controls at the town or one of its Places, or its home seat.
 * Otherwise chronicle only (Law 13 — the world acts whether or not the god watches;
 * only the interrupt is gated).
 */
import type { GameState, TickEvent } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { ChronicleEntry } from '../../types/narrative';
import type { WorldGraph } from '../graph';
import type { RealmProjection } from '../realmProjection';
import type { EconomicChronicleTrigger } from '../../data/economic-chronicle-content';
import { emitTrace } from '../traceBuffer';
import { resolveEconomicChronicle, chronicleSeed } from '../economicChronicle';
import { buildCrownWorld, type CrownWorld } from '../crown/eligibility';
import { heldSources } from '../essenceSources';
import { resolveToParentLocation } from '../sublocationShape';
import { residesIn } from '../factionSplinter';
import { ECON_PHASE_SPOTLIGHT_CAP } from '../../data/resource-classes';
import { LOCATION_TRAIT_IDS } from '../../data/location-trait-constants';
import { RISING_THRESHOLD } from '../../data/unrest-pressure-constants';
import {
  ON_THE_EDGE_HELD_LINES,
  ON_THE_EDGE_UNHELD_LINES,
  type OnTheEdgeCause,
} from '../../data/unrest-chronicle-content';
import { placeHasTrait } from './bands';
import { readUnrestInputs, largestInput } from './inputs';
import {
  settlementHolders,
  onTurnCooldown,
  buildTownView,
  defectionChoice,
  applyDefection,
} from './defection';
import { applyRising } from './rising';

/** Settlement flag: the town bore `on_the_edge` at the last daily pass (to see the day it enters). */
export const WAS_ON_THE_EDGE_PROP = 'unrestWasOnTheEdge';
/**
 * Settlement property: the holder the turn pass judged today (the realm-border
 * tie-break included). The Fortunes row and the Trouble lens read it, so the lord they
 * name is the one whose `controls` would move (Law 56). Null for an unheld town.
 */
export const JUDGED_HOLDER_PROP = 'unrestHolderId';
/** Settlement flag: the `town_empties` line was written (once per town). */
export const EMPTIED_PROP = 'unrestEmptied';

export interface TurnHooks {
  /** The realm projection, for `taxHolderOf`'s border tie-break and the crown snapshot. */
  readonly getProjection?: () => RealmProjection | null;
  /** Called after any `controls` move or new faction (the map outline reads both). */
  readonly onStructure?: () => void;
}

export interface TurnOutput {
  readonly chronicleEntries: ChronicleEntry[];
  readonly events: TickEvent[];
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function nameOf(graph: WorldGraph, id: string | null | undefined): string {
  if (!id) return '';
  return graph.getNode(id)?.name || id;
}

function pick(lines: readonly string[], seed: number): string {
  return lines[Math.abs(seed | 0) % lines.length];
}

/** The settlements told in full detail today: the `ECON_PHASE_SPOTLIGHT_CAP` most prosperous. */
export function fullDetailIds(settlements: readonly GraphNode[]): Set<string> {
  const ordered = [...settlements].sort((a, b) => {
    const pa = num(a.properties.prosperity) ?? -1;
    const pb = num(b.properties.prosperity) ?? -1;
    if (pb !== pa) return pb - pa;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return new Set(ordered.slice(0, ECON_PHASE_SPOTLIGHT_CAP).map(n => n.id));
}

/** Does the god have a reason to be interrupted about this town? (the popup gate) */
export function godWatchesTown(state: GameState, townId: string): boolean {
  const graph = state.graph;
  const godId = state.ascendantId;
  if (!godId) return false;
  for (const e of graph.getOutgoingEdges(godId, 'thread')) {
    const pos = (e.properties as Record<string, unknown> | undefined)?.courtPosition;
    if (pos === 'dormant') continue;
    if (residesIn(graph, e.target, townId)) return true;
  }
  const atTown = (id: string | undefined): boolean =>
    !!id && resolveToParentLocation(graph, graph.getNode(id))?.id === townId;
  if (atTown(graph.getNode(godId)?.properties.homeSeatLocationId as string | undefined)) return true;
  try {
    return heldSources(graph, godId).some(h => atTown(h.host.id));
  } catch {
    return false;
  }
}

function causeOf(town: GraphNode): OnTheEdgeCause {
  const inputs = readUnrestInputs(town);
  const key = inputs ? largestInput(inputs) : null;
  return key === 'hunger' ? 'hunger' : key === 'siege' ? 'siege' : 'general';
}

function chronicle(
  state: GameState,
  trigger: EconomicChronicleTrigger,
  town: GraphNode,
  actorId: string | null,
  targetId: string | null,
  flavor?: string,
): { entry: ChronicleEntry; event: TickEvent } | null {
  const graph = state.graph;
  const res = resolveEconomicChronicle(
    trigger,
    {
      settlement: town.name,
      locationId: town.id,
      actor: actorId ? nameOf(graph, actorId) : undefined,
      actorId: actorId ?? undefined,
      target: targetId ? nameOf(graph, targetId) : undefined,
      targetId: targetId ?? undefined,
      flavor,
      hexCoords: typeof town.properties.hexCol === 'number' && typeof town.properties.hexRow === 'number'
        ? { col: town.properties.hexCol as number, row: town.properties.hexRow as number }
        : undefined,
    },
    state.tick,
    chronicleSeed(state.seed, `${town.id}|${trigger}`) + 1957,
  );
  if (!res) return null;
  return {
    event: res.tickEvent,
    entry: {
      id: res.chronicleChapter.id,
      tier: 'chronicle',
      title: res.chronicleChapter.title,
      prose: res.chronicleChapter.prose,
      promptContext: {
        actors: res.chronicleChapter.actorIds,
        location: town.name,
        sphere: 'matter',
        mood: 'political',
      },
      tick: state.tick,
    },
  };
}

function popupEvent(state: GameState, town: GraphNode, title: string, body: string, kind: string): TickEvent {
  return {
    id: `evt_unrest_${kind}_${town.id}_${state.tick}`,
    tick: state.tick,
    type: 'economic_chronicle' as TickEvent['type'],
    message: body,
    sphere: 'order',
    significance: 0.85,
    notification: { channel: 'popup', popup: { title, body } },
  };
}

/** Write the `town_empties` line once, the day an unheld town is down to its last person. */
export function noteEmptied(state: GameState, town: GraphNode, full: boolean, out: TurnOutput): void {
  if (town.properties[EMPTIED_PROP] === true) return;
  town.properties[EMPTIED_PROP] = true;
  if (!full) return;
  const c = chronicle(state, 'town_empties', town, null, null);
  if (c) { out.chronicleEntries.push(c.entry); out.events.push(c.event); }
}

/** The S2 daily pass over every settlement. */
export function runTownTurns(
  state: GameState,
  settlements: readonly GraphNode[],
  hooks: TurnHooks,
): TurnOutput {
  const graph = state.graph;
  const tick = state.tick;
  const out: TurnOutput = { chronicleEntries: [], events: [] };

  const onEdge = (t: GraphNode) => placeHasTrait(graph, t.id, LOCATION_TRAIT_IDS.onTheEdge);
  const atRising = (t: GraphNode) => (num(t.properties.unrest) ?? 0) >= RISING_THRESHOLD;
  const active = settlements.filter(t => onEdge(t) || atRising(t) || t.properties[WAS_ON_THE_EDGE_PROP] === true);
  if (active.length === 0) return out;

  let projection: RealmProjection | null = null;
  try { projection = hooks.getProjection?.() ?? null; } catch { projection = null; }
  const holders = settlementHolders(graph, projection?.hexRealmId);
  const full = fullDetailIds(settlements);
  let world: CrownWorld | null = null;
  const crownWorld = (): CrownWorld => (world ??= buildCrownWorld(graph, tick, projection));

  for (const town of active) {
    try {
      const edge = onEdge(town);
      const wasEdge = town.properties[WAS_ON_THE_EDGE_PROP] === true;
      if (edge !== wasEdge) town.properties[WAS_ON_THE_EDGE_PROP] = edge;
      const holderId = holders.get(town.id) ?? null;
      town.properties[JUDGED_HOLDER_PROP] = holderId;

      // 1. The day it enters On the edge.
      if (edge && !wasEdge) {
        const cause = causeOf(town);
        const lines = holderId ? ON_THE_EDGE_HELD_LINES[cause] : ON_THE_EDGE_UNHELD_LINES[cause];
        const flavor = pick(lines, chronicleSeed(state.seed, `${town.id}|edge|${tick}`))
          .replace(/\{settlement\}/g, town.name)
          .replace(/\{target\}/g, nameOf(graph, holderId));
        if (full.has(town.id)) {
          const c = chronicle(state, 'town_on_the_edge', town, holderId, null, flavor);
          if (c) { out.chronicleEntries.push(c.entry); out.events.push(c.event); }
        }
        if (godWatchesTown(state, town.id)) {
          out.events.push(popupEvent(state, town, `${town.name} is on the edge`, flavor, 'edge'));
        }
      }

      if (!holderId || onTurnCooldown(town, tick)) continue;

      // 2. Rising.
      if (atRising(town)) {
        const r = applyRising(state, town, holderId);
        emitTrace({
          tick,
          category: r.path === 'none' ? 'unrest.rising.no_one' : 'unrest.rising',
          summary: r.path === 'none'
            ? `${town.name} is ready to rise against ${nameOf(graph, holderId)}, but no one there leads it (${r.failReason ?? 'no_one'})`
            : `${town.name} rises against ${nameOf(graph, holderId)}: ${r.path === 'split' ? `${r.residentsMoved} members break away` : 'a resident founds a free town'} as ${nameOf(graph, r.newFactionId)}`,
          locationId: town.id,
          holderId,
          path: r.path,
          newFactionId: r.newFactionId,
          residentsMoved: r.residentsMoved,
          sackedBuildingId: r.sackedBuildingId,
        });
        if (r.path !== 'none' && r.newFactionId) {
          hooks.onStructure?.();
          world = null;
          holders.set(town.id, r.newFactionId);
          town.properties[JUDGED_HOLDER_PROP] = r.newFactionId;
          const c = chronicle(state, 'town_rises', town, r.newFactionId, holderId);
          if (c) {
            if (full.has(town.id)) { out.chronicleEntries.push(c.entry); out.events.push(c.event); }
            if (godWatchesTown(state, town.id)) {
              out.events.push(popupEvent(state, town, `${town.name} has risen`, c.entry.prose, 'rising'));
            }
          }
          continue;
        }
      }

      // 3. Defection.
      if (!edge) continue;
      const view = buildTownView(crownWorld(), holders, town);
      if (!view) continue;
      const choice = defectionChoice(view);
      const turned = choice ? applyDefection(state, town, holderId, choice.factionId) : false;
      emitTrace({
        tick,
        category: turned ? 'unrest.defect' : 'unrest.defect.considered',
        summary: turned && choice
          ? `${town.name} turns from ${nameOf(graph, holderId)} (${view.holder.view.toFixed(2)}) to ${nameOf(graph, choice.factionId)} (${choice.view.toFixed(2)})`
          : `${town.name} weighs its lords: holder ${nameOf(graph, holderId)} ${view.holder.view.toFixed(2)}, best ${view.candidates[0] ? `${nameOf(graph, view.candidates[0].factionId)} ${view.candidates[0].view.toFixed(2)}` : 'none'} — stays`,
        locationId: town.id,
        holderId,
        holderView: view.holder.view,
        best: view.candidates[0] ?? null,
        margin: view.candidates[0] ? view.candidates[0].view - view.holder.view : 0,
      });
      if (turned && choice) {
        hooks.onStructure?.();
        world = null;
        holders.set(town.id, choice.factionId);
        town.properties[JUDGED_HOLDER_PROP] = choice.factionId;
        if (full.has(town.id)) {
          const c = chronicle(state, 'town_defects', town, choice.factionId, holderId);
          if (c) { out.chronicleEntries.push(c.entry); out.events.push(c.event); }
        }
      }
    } catch (err) {
      console.warn(`[unrest] turn pass failed at ${town.id}; the town keeps its holder`, err);
    }
  }
  return out;
}
