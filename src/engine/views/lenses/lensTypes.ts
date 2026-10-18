/**
 * lensTypes — the shapes a hex lens hands the map (THR-1822 § D11, refined by THR-1878 § D4).
 *
 * THR-1822 typed the hover line as a string; Law 21 needs names that can route, so a
 * line is a list of segments and a name is a segment with its ref. Recorded in the
 * THR-1878 plan under THR-1822's kill criterion 4 ("revise the type, never bypass").
 *
 * Every field is serialisable: no Map, no function, no graph node.
 */
import type { MapLensId } from '../../../data/map-lenses';
import type { MapMarkerKind } from '../../../data/map-markers';
import type { WorldRef } from '../../../types/worldRef';

/** "col,row". */
export type LensHexKey = string;

export interface LensLineSegment {
  text: string;
  /** What the words name, when they name a thing (a mortal, a place); null for plain words. */
  ref: WorldRef | null;
}

export interface LensLine {
  segments: LensLineSegment[];
}

export type LensMarkTone = 'first' | 'retinue' | 'watched' | 'trouble' | 'caravan' | 'threat';

export interface LensMark {
  /** A `MAP_MARKERS` key whose lens is this lens. */
  kind: MapMarkerKind;
  hexKey: LensHexKey;
  /** Arrows and roads end here. */
  toHexKey?: LensHexKey;
  /** What the mark is about (the mortal, the rival's target, the route's end). */
  ref?: WorldRef;
  /** For `agentStep` marks: the agent node the agent layer draws one step up. */
  agentId?: string;
  /** For `agentStep` marks: the name tag under the medallion. */
  tag?: string;
  tone: LensMarkTone;
  /** Roads only: the route's volume, read for line width; never rendered as text. */
  weight?: number;
}

/** The view model of every lens drawn by the generic hex layer (all lenses but Dominion). */
export interface HexLensVM {
  lensId: Exclude<MapLensId, 'dominion'>;
  /** The hexes in focus; every other land hex is dimmed. Sorted. */
  lit: LensHexKey[];
  marks: LensMark[];
  /** One line per thing on the hex, at most LENS_HOVER_MAX_LINES (an overflow line counts). */
  hover: Record<LensHexKey, LensLine[]>;
  legend: { head: string; lines: string[] };
  /** Shown in the legend when the lens has nothing to light. */
  emptyLine: string | null;
}

/** Lines per hex in the hover tier; more read as the lens's overflow line. NFP #1. */
export const LENS_HOVER_MAX_LINES = 4;

/** A line of plain words. */
export function plainLine(text: string): LensLine {
  return { segments: [{ text, ref: null }] };
}

/** The line as one string, for tests and debug readers. */
export function lensLineText(line: LensLine): string {
  return line.segments.map(s => s.text).join('');
}

/** The typed fallback: nothing lit, nothing marked, the lens says so in words. */
export function emptyHexLensVM(
  lensId: HexLensVM['lensId'],
  head: string,
  lines: readonly string[],
  emptyLine: string,
): HexLensVM {
  return { lensId, lit: [], marks: [], hover: {}, legend: { head, lines: [...lines] }, emptyLine };
}
