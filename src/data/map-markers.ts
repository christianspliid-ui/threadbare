/**
 * map-markers.ts — the one list of every kind of marker the map draws on top of
 * the land, plain or lens (THR-1878 plan § D5; plain rows by THR-1899).
 *
 * Law 58: a new marker kind is one row here. Sizes are screen pixels per zoom
 * band (THR-1831 § 4) — a sprite's world scale is `sizePx / k`, so a marker keeps
 * one steady size inside a band however far the camera zooms within it. `null`
 * hides the kind in that band; `'mesh'` means its own mesh sizes it, unchanged.
 *
 * Declaration order is legend order: a lens legend lists the `legend` entries of
 * every row whose `legendIn` names that lens, in the order the rows appear here.
 * Lens rows (medallion, destination, unrest, strife, scheme, drain, omen, lair,
 * road) join with their lenses (THR-1878 Lenses I, THR-1898 Lenses II).
 *
 * Named test: `src/data/__tests__/mapMarkers.coverage.test.ts`.
 */

import type { MapLensId } from './map-lenses';

/** ZOOM_TIER_THRESHOLDS bands: <1.5, 1.5–5, 5–15, ≥15. */
export type ZoomBand = 'fullWorld' | 'continental' | 'regional' | 'heroLocal';

export const ZOOM_BANDS: readonly ZoomBand[] = ['fullWorld', 'continental', 'regional', 'heroLocal'];

/** How a marker is drawn. Lens slices add kinds (badge, omenRing, arrow, road…). */
export type MapMarkerDraw =
  | 'portrait' | 'dot' | 'pip' | 'medallion' | 'badge' | 'omenRing' | 'arrow' | 'road' | 'agentStep' | 'sprite';

/** A semantic ink key; the renderer maps it to a token. */
export type MarkerInk =
  | 'faction' | 'court' | 'trouble' | 'caravan' | 'threat' | 'battle' | 'siege' | 'frontierGold';

export interface MarkerLegendEntry {
  /** "Battle", "The First", "Threatened road". */
  word: string;
  /** `ui.*` registry id (Laws 1, 17). */
  tooltipId: string;
  /** Which variant of the mark this entry shows (a court colour, a threatened road). */
  tone?: string;
}

export interface MapMarkerDef {
  /** null = the plain map. */
  lens: MapLensId | null;
  /** The draw kind in most bands. */
  draw: MapMarkerDraw;
  /** Bands that draw a different kind (a mortal is a dot far out and a portrait close in). */
  bandDraw?: Partial<Record<ZoomBand, MapMarkerDraw>>;
  /** Screen px per band (null = hidden in that band); 'mesh' = its own mesh sizes it. */
  sizePx: Record<ZoomBand, number | null> | 'mesh';
  /** The icon concept THR-1879 maps to a shape; null for portraits, dots, rings, roads. */
  icon: string | null;
  ink: MarkerInk;
  /** What this kind contributes to a legend (one entry, or one per variant). */
  legend: readonly MarkerLegendEntry[];
  /** The lenses whose legend shows it. A plain kind may join a lens's legend. */
  legendIn: readonly MapLensId[];
  /** Markers that place names step aside for (THR-1831 § 4). Medallions never move. */
  labelObstacle: 'always' | 'heroLocal' | 'never';
}

export type MapMarkerKind =
  | 'agent'
  | 'threadedAgent'
  | 'avatar'
  | 'army'
  | 'bandDrop'
  | 'battle'
  | 'siege';

export const MAP_MARKERS: Record<MapMarkerKind, MapMarkerDef> = {
  /** A mortal the map draws who is not threaded (a group); faction colour. */
  agent: {
    lens: null,
    draw: 'dot',
    bandDraw: { heroLocal: 'portrait' },
    sizePx: { fullWorld: null, continental: 10, regional: 14, heroLocal: 48 },
    icon: null,
    ink: 'faction',
    legend: [],
    legendIn: [],
    labelObstacle: 'heroLocal',
  },
  /** A mortal you hold a thread to — "you can always find your own". */
  threadedAgent: {
    lens: null,
    draw: 'medallion',
    bandDraw: { fullWorld: 'pip', heroLocal: 'portrait' },
    sizePx: { fullWorld: 12, continental: 32, regional: 40, heroLocal: 64 },
    icon: null,
    ink: 'court',
    legend: [],
    legendIn: [],
    labelObstacle: 'always',
  },
  /** The god's avatar: keeps its 82 px close-up and its sphere ring. */
  avatar: {
    lens: null,
    draw: 'medallion',
    bandDraw: { fullWorld: 'pip', heroLocal: 'portrait' },
    sizePx: { fullWorld: 12, continental: 32, regional: 40, heroLocal: 82 },
    icon: null,
    ink: 'court',
    legend: [],
    legendIn: [],
    labelObstacle: 'always',
  },
  /** Listed so the list is whole; sized by ArmyLayer as today. */
  army: {
    lens: null,
    draw: 'sprite',
    sizePx: 'mesh',
    icon: null,
    ink: 'faction',
    legend: [],
    legendIn: [],
    labelObstacle: 'never',
  },
  /** The Dominion band-drop badge (THR-1750); sized by its own mesh. */
  bandDrop: {
    lens: null,
    draw: 'badge',
    sizePx: 'mesh',
    icon: null,
    ink: 'frontierGold',
    legend: [],
    legendIn: [],
    labelObstacle: 'never',
  },
  /** A field battle. Joins the Trouble legend when Lenses II adds 'trouble'. */
  battle: {
    lens: null,
    draw: 'sprite',
    sizePx: 'mesh',
    icon: null,
    ink: 'battle',
    legend: [{ word: 'Battle', tooltipId: 'ui.battle' }],
    legendIn: [],
    labelObstacle: 'never',
  },
  /** A siege. The tooltip `ui.siege` reads "Under siege": it names the town's state. */
  siege: {
    lens: null,
    draw: 'sprite',
    sizePx: 'mesh',
    icon: null,
    ink: 'siege',
    legend: [{ word: 'Siege', tooltipId: 'ui.siege' }],
    legendIn: [],
    labelObstacle: 'never',
  },
};

/** The kinds in declaration (legend) order. */
export const MAP_MARKER_KINDS = Object.keys(MAP_MARKERS) as MapMarkerKind[];

/** Screen px for a kind in a band, or null when hidden there or sized by its mesh. */
export function markerSizePx(kind: MapMarkerKind, band: ZoomBand): number | null {
  const def = MAP_MARKERS[kind];
  if (!def || def.sizePx === 'mesh') return null;
  return def.sizePx[band];
}

/** The draw kind for a marker kind in a band. */
export function markerDrawIn(kind: MapMarkerKind, band: ZoomBand): MapMarkerDraw {
  const def = MAP_MARKERS[kind];
  return def.bandDraw?.[band] ?? def.draw;
}

/** Whether a kind is a label obstacle in a band. */
export function isLabelObstacleIn(kind: MapMarkerKind, band: ZoomBand): boolean {
  const rule = MAP_MARKERS[kind]?.labelObstacle;
  return rule === 'always' || (rule === 'heroLocal' && band === 'heroLocal');
}

/** A lens legend's mark rows: every entry of every row whose `legendIn` names the lens, in list order. */
export function legendEntriesFor(lens: MapLensId): MarkerLegendEntry[] {
  const out: MarkerLegendEntry[] = [];
  for (const kind of MAP_MARKER_KINDS) {
    const def = MAP_MARKERS[kind];
    if (def.legendIn.includes(lens)) out.push(...def.legend);
  }
  return out;
}

/** The marker kind an agent sprite is drawn as. */
export function agentMarkerKind(agent: { isAvatar?: boolean; isThreaded?: boolean }): MapMarkerKind {
  if (agent.isAvatar) return 'avatar';
  if (agent.isThreaded) return 'threadedAgent';
  return 'agent';
}
