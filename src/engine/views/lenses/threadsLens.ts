/**
 * threadsLens — the Threads lens's view model (THR-1878 plan § D4, lens 2).
 *
 * Focus: each mortal the god holds a `thread` to at court position the_first,
 * retinue or watched (dormant threads stay dark, matching the legend's three court
 * words), at its hex; plus the hex it is heading to when `movementState` carries a
 * destination, resolved to its place-tier Location (`resolveToParentLocation`).
 *
 * Marks: one `medallion` per mortal (the agent layer draws that mortal's own marker
 * one step up, with a name tag) and one `destination` arrow per moving mortal, in
 * the mortal's court tone. Hover: "Maren Ashfold, your First, is here, on her way to
 * Hesk Crossing." — names and places are ref segments (Law 21).
 *
 * Pure and deterministic: mortals sort by court order, then name, then id.
 * Nothing on an unexplored hex (`isHexKnown`, the seen floor's hex rule).
 */
import type { GraphNode } from '../../../types/graph';
import type { MovementState } from '../../../types/movement';
import { hexKey } from '../../../lib/hexKey';
import { resolveToParentLocation } from '../../sublocationShape';
import { THREADS_LENS_WORDS } from '../../../data/view-content';
import type { ViewContext } from '../viewContext';
import { nodeMapHex } from '../map/mapPosition';
import { isHexKnown } from '../knowledge';
import {
  LENS_HOVER_MAX_LINES,
  plainLine,
  type HexLensVM,
  type LensLine,
  type LensLineSegment,
  type LensMark,
  type LensMarkTone,
} from './lensTypes';

/** The court positions the Threads lens lights, in legend order. */
export const THREADS_LENS_COURTS = ['the_first', 'retinue', 'watched'] as const;
export type ThreadsLensCourt = (typeof THREADS_LENS_COURTS)[number];

const COURT_TONE: Record<ThreadsLensCourt, LensMarkTone> = {
  the_first: 'first',
  retinue: 'retinue',
  watched: 'watched',
};

interface ThreadedMortal {
  id: string;
  name: string;
  court: ThreadsLensCourt;
  hexKey: string;
  their: string;
  /** The place-tier Location the mortal stands at, for "from {place}". */
  herePlace: { id: string; name: string } | null;
  heading: { hexKey: string; placeId: string; placeName: string } | null;
}

function isCourt(v: unknown): v is ThreadsLensCourt {
  return typeof v === 'string' && (THREADS_LENS_COURTS as readonly string[]).includes(v);
}

/** "her" / "his"; "the" when the gender is unknown, so the line never guesses a pronoun. */
function theirOf(node: GraphNode): string {
  const g = String(node.properties.gender ?? '').toLowerCase();
  if (g === 'male' || g === 'm') return 'his';
  if (g === 'female' || g === 'f') return 'her';
  return THREADS_LENS_WORDS.unknownTheir;
}

function placeOfNode(ctx: ViewContext, node: GraphNode | undefined): { id: string; name: string } | null {
  if (!node) return null;
  const place = resolveToParentLocation(ctx.graph, node) ?? node;
  return place?.name ? { id: place.id, name: place.name } : null;
}

function readMortal(ctx: ViewContext, agentId: string, court: ThreadsLensCourt): ThreadedMortal | null {
  const graph = ctx.graph;
  const node = graph.getNode(agentId);
  if (!node) return null;
  const located = nodeMapHex(graph, node);
  const ms = node.properties.movementState as MovementState | undefined;
  // A mortal on a road stands on its road hex, as the agent layer draws it
  // (`views/map/agents.ts`); `located_at` moves only when the leg ends.
  const pos = ms?.currentHexPosition ?? located;
  if (!pos) return null;
  const key = hexKey(pos.col, pos.row);
  if (!isHexKnown(ctx.state, key)) return null;

  const locEdge = graph.getOutgoingEdges(node.id, 'located_at')[0];
  const herePlace = placeOfNode(ctx, locEdge ? graph.getNode(locEdge.target) : undefined);

  let heading: ThreadedMortal['heading'] = null;
  if (ms?.destinationId && (ms.movementQueue?.length ?? 0) > 0) {
    const dest = graph.getNode(ms.destinationId);
    const place = dest ? (resolveToParentLocation(graph, dest) ?? dest) : undefined;
    const destPos = place ? nodeMapHex(graph, place) : null;
    if (place && destPos && place.name) {
      const destKey = hexKey(destPos.col, destPos.row);
      if (destKey !== key && isHexKnown(ctx.state, destKey)) {
        heading = { hexKey: destKey, placeId: place.id, placeName: place.name };
      }
    }
  }

  return { id: node.id, name: node.name || '', court, hexKey: key, their: theirOf(node), herePlace, heading };
}

/** Split a template on `{name}` and `{place}` so the names render as ref segments. */
function fill(
  template: string,
  slots: { name: string; court: string; their: string; place?: string },
  nameRef: LensLineSegment['ref'],
  placeRef: LensLineSegment['ref'],
): LensLine {
  // A mortal with no name is named by its court phrase, so the court clause is dropped
  // ("Whom you watch is here.", never "Whom you watch, whom you watch, is here.").
  const t = slots.court ? template : template.replace(', {court},', '');
  const filled = t.replace('{court}', slots.court).replace('{their}', slots.their);
  const segments: LensLineSegment[] = [];
  const re = /\{name\}|\{place\}/g;
  let last = 0;
  for (let m = re.exec(filled); m; m = re.exec(filled)) {
    if (m.index > last) segments.push({ text: filled.slice(last, m.index), ref: null });
    if (m[0] === '{name}') segments.push({ text: slots.name, ref: nameRef });
    else segments.push({ text: slots.place ?? '', ref: placeRef });
    last = m.index + m[0].length;
  }
  if (last < filled.length) segments.push({ text: filled.slice(last), ref: null });
  return { segments };
}

function capLines(lines: LensLine[]): LensLine[] {
  if (lines.length <= LENS_HOVER_MAX_LINES) return lines;
  return [...lines.slice(0, LENS_HOVER_MAX_LINES - 1), plainLine(THREADS_LENS_WORDS.overflow)];
}

export function buildThreadsLens(ctx: ViewContext): HexLensVM {
  const legend = { head: THREADS_LENS_WORDS.legendHead, lines: [...THREADS_LENS_WORDS.legend] };
  const mortals: ThreadedMortal[] = [];
  if (ctx.ascendantId) {
    for (const edge of ctx.graph.getOutgoingEdges(ctx.ascendantId, 'thread')) {
      const court = (edge.properties as Record<string, unknown>)['courtPosition'];
      if (!isCourt(court)) continue;
      const m = readMortal(ctx, edge.target, court);
      if (m) mortals.push(m);
    }
  }
  const courtRank = (c: ThreadsLensCourt) => THREADS_LENS_COURTS.indexOf(c);
  mortals.sort((a, b) =>
    courtRank(a.court) - courtRank(b.court) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  if (mortals.length === 0) {
    return { lensId: 'threads', lit: [], marks: [], hover: {}, legend, emptyLine: THREADS_LENS_WORDS.empty };
  }

  const lit = new Set<string>();
  const marks: LensMark[] = [];
  const hover: Record<string, LensLine[]> = {};
  const addLine = (key: string, line: LensLine) => { (hover[key] ??= []).push(line); };

  for (const m of mortals) {
    const tone = COURT_TONE[m.court];
    const nameRef = { kind: 'agent' as const, id: m.id, name: m.name };
    const displayName = m.name || THREADS_LENS_WORDS.courtTag[m.court];
    const court = m.name ? THREADS_LENS_WORDS.court[m.court] : '';
    lit.add(m.hexKey);
    marks.push({ kind: 'medallion', hexKey: m.hexKey, agentId: m.id, tag: displayName, tone, ref: nameRef });

    if (m.heading) {
      const placeRef = { kind: 'location' as const, id: m.heading.placeId, name: m.heading.placeName };
      lit.add(m.heading.hexKey);
      marks.push({ kind: 'destination', hexKey: m.hexKey, toHexKey: m.heading.hexKey, tone, ref: placeRef, agentId: m.id });
      addLine(m.hexKey, fill(THREADS_LENS_WORDS.hereHeading,
        { name: displayName, court, their: m.their, place: m.heading.placeName }, nameRef, placeRef));
      const fromRef = m.herePlace ? { kind: 'location' as const, id: m.herePlace.id, name: m.herePlace.name } : null;
      addLine(m.heading.hexKey, m.herePlace
        ? fill(THREADS_LENS_WORDS.arriving, { name: displayName, court, their: m.their, place: m.herePlace.name }, nameRef, fromRef)
        : fill(THREADS_LENS_WORDS.arrivingNoPlace, { name: displayName, court, their: m.their }, nameRef, null));
    } else {
      addLine(m.hexKey, fill(THREADS_LENS_WORDS.here, { name: displayName, court, their: m.their }, nameRef, null));
    }
  }

  const cappedHover: Record<string, LensLine[]> = {};
  for (const key of Object.keys(hover).sort()) cappedHover[key] = capLines(hover[key]);

  return { lensId: 'threads', lit: [...lit].sort(), marks, hover: cappedHover, legend, emptyLine: null };
}
