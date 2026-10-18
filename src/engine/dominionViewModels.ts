/**
 * dominionViewModels.ts — prepared Dominion data for the screen (THR-1750 § E3).
 *
 * The view-model seam (THR-1822): the sheets, the legend, the hex tooltip and the
 * lens read these shapes and never the graph. Pure; every missing input reads as
 * "show nothing" (null) or Foreign, never a throw.
 */

import type { WorldGraph } from './graph';
import type { ControlEffect } from '../types/controlEffect';
import type { SphereName } from '../types';
import type { DominionBand } from '../data/dominion-content';
import { DOMINION_BAND_WORDS, DOMINION_BAND_LINES } from '../data/dominion-content';
import {
  DOMINION_TEND_LINES,
  DOMINION_HEX_LINE,
  DOMINION_PRESSURE_LINE,
  DOMINION_PRESSURE_LINE_MIN,
  DOMINION_TOOLTIP_IDS,
  dominionBandTooltipId,
} from '../data/dominion-ui-content';
import { dominionOf, buildTendingIndex, isTended, placeOf, type TendedBy } from './dominion';
import { getSpherePoints, rankSpherePoints } from './spherePoints';
import { SPHERE_NAMES } from '../types';
import { DOMINION_OPPOSITION_WEIGHT } from '../data/dominion-content';
import { MAX_SPHERE_SCORE, type SphereAffinity } from '../types/sphereAffinity';
import { SPHERE_OPPOSITES } from './cosmology';
import { isValidSphereAffinity } from './sphereAffinity';
import { frontierEdges, isTurfBand, type DominionHexProjection, type DominionDropBadge, type HexKey } from './dominionProjection';

export interface DominionSheetVM {
  band: DominionBand;
  /** The band word ("Held"). */
  word: string;
  /** The band's one line ("Yours, and holding. …"). */
  line: string;
  /** Who tends the ground, or what happens untended; null when there is nothing to say. */
  tendLine: string | null;
  /** CSS colour for the band word: the god's sphere bright, `--negative` for Hostile. */
  sphereColorVar: string;
  /** The band word's tooltip (`ui.dominion.<band>`). */
  tooltipId: string;
  /** The header's tooltip (`ui.dominion`). */
  headerTooltipId: string;
}

/** The god's primary sphere by bought points, or null with none. */
export function godPrimarySphere(graph: WorldGraph, ascendantId: string | null | undefined): SphereName | null {
  if (!ascendantId) return null;
  try {
    const god = graph.getNode(ascendantId);
    if (!god) return null;
    return rankSpherePoints(getSpherePoints(god.properties))[0] ?? null;
  } catch {
    return null;
  }
}

/** The colour a band word is drawn in. */
export function dominionBandColorVar(band: DominionBand, godSphere: SphereName | null): string {
  if (band === 'hostile') return 'var(--negative)';
  if (band === 'foreign' || !godSphere) return 'var(--text-secondary)';
  return `var(--sphere-${godSphere}-bright)`;
}

const TEND_ORDER: readonly TendedBy[] = ['seat', 'claim', 'carry', 'anointed'];

/** The name of the threaded mortal who carries this place, highest tier first. */
function carrierName(graph: WorldGraph, ascendantId: string, placeId: string): string | undefined {
  let best: { name: string; tier: number; id: string } | undefined;
  for (const e of graph.getOutgoingEdges(ascendantId, 'thread')) {
    const tier = Number(e.properties?.tier ?? 0);
    if (tier < 1 || placeOf(graph, e.target)?.id !== placeId) continue;
    const name = graph.getNode(e.target)?.name ?? '';
    if (!best || tier > best.tier || (tier === best.tier && e.target < best.id)) best = { name, tier, id: e.target };
  }
  return best?.name;
}

/** The anointed faction holding this place, lowest id first. */
function anointedFactionName(graph: WorldGraph, ascendantId: string, placeId: string): string | undefined {
  const names: Array<{ id: string; name: string }> = [];
  for (const e of graph.getIncomingEdges(placeId, 'controls')) {
    const f = graph.getNode(e.source);
    if (!f || f.properties.actorType !== 'faction' || f.properties.dissolved) continue;
    const chosen = f.properties.chosen as { byAscendantId?: string } | undefined;
    if (!chosen || (chosen.byAscendantId && chosen.byAscendantId !== ascendantId)) continue;
    names.push({ id: f.id, name: f.name ?? '' });
  }
  names.sort((a, b) => (a.id < b.id ? -1 : 1));
  return names[0]?.name;
}

/**
 * The tend line for a place (§ Decided 4): who holds it, or — on Touched or better
 * ground nobody tends — that it will slip back. Foreign and Hostile ground have
 * nothing of the god's to lose, so they get no line.
 */
export function dominionTendLine(
  graph: WorldGraph,
  ascendantId: string,
  placeId: string,
  band: DominionBand,
  controlEffects: readonly ControlEffect[] | undefined,
): string | null {
  try {
    const index = buildTendingIndex(graph, ascendantId, controlEffects, id => dominionOf(graph, ascendantId, id).band);
    const by = isTended(index, placeId);
    if (!by) return isTurfBand(band) ? DOMINION_TEND_LINES.untended : null;
    const first = TEND_ORDER.find(t => by.includes(t)) ?? by[0];
    if (first === 'seat') return DOMINION_TEND_LINES.seat;
    if (first === 'claim') return DOMINION_TEND_LINES.claim;
    if (first === 'carry') {
      const name = carrierName(graph, ascendantId, placeId);
      return name ? DOMINION_TEND_LINES.mortal.replace('{name}', name) : DOMINION_TEND_LINES.unnamed;
    }
    const faction = anointedFactionName(graph, ascendantId, placeId);
    return faction ? DOMINION_TEND_LINES.faction.replace('{faction}', faction) : DOMINION_TEND_LINES.unnamed;
  } catch {
    return null;
  }
}

/**
 * The band box / row for any sheet. Null with no god, or for an object the read does
 * not answer for (the box then renders nothing). `withTend` asks for the tend line —
 * place pages only; the mortal row and the faction and artifact boxes omit it.
 */
export function dominionSheetVM(
  graph: WorldGraph | null | undefined,
  ascendantId: string | null | undefined,
  objectId: string | null | undefined,
  controlEffects?: readonly ControlEffect[],
  withTend = false,
): DominionSheetVM | null {
  if (!graph || !ascendantId || !objectId || !graph.getNode(objectId)) return null;
  try {
    const read = dominionOf(graph, ascendantId, objectId);
    if (read.reason.kind === 'unknown') return null; // no god, missing, error, or a kind the read does not answer
    const band = read.band;
    let tendLine: string | null = null;
    if (withTend) {
      const place = placeOf(graph, objectId);
      if (place) tendLine = dominionTendLine(graph, ascendantId, place.id, band, controlEffects);
    }
    return {
      band,
      word: DOMINION_BAND_WORDS[band],
      line: DOMINION_BAND_LINES[band],
      tendLine,
      sphereColorVar: dominionBandColorVar(band, godPrimarySphere(graph, ascendantId)),
      tooltipId: dominionBandTooltipId(band),
      headerTooltipId: DOMINION_TOOLTIP_IDS.term,
    };
  } catch {
    return null;
  }
}

// ─── The lens ────────────────────────────────────────────────────────

export interface DominionLensHexVM {
  key: HexKey;
  band: DominionBand;
  frontier: boolean;
  meetsHostile: boolean;
  placeId: string | null;
}

export interface DominionLensVM {
  on: boolean;
  hexes: DominionLensHexVM[];
  /** Frontier edges for the mesh: the turf hex, the neighbour direction, the weight. */
  edges: Array<{ key: HexKey; dir: number; meetsHostile: boolean }>;
  godSphere: SphereName | null;
  drops: DominionDropBadge[];
}

/** The prepared lens for HexMapV2. `projection` null (lens off) gives no hexes. */
export function dominionLensVM(
  projection: DominionHexProjection | null,
  godSphere: SphereName | null,
  drops: readonly DominionDropBadge[],
  on: boolean,
): DominionLensVM {
  if (!on || !projection) return { on, hexes: [], edges: [], godSphere, drops: [...drops] };
  const edges = frontierEdges(projection);
  const frontierHex = new Map<HexKey, boolean>();
  for (const e of edges) frontierHex.set(e.a, (frontierHex.get(e.a) ?? false) || e.meetsHostile);
  const hexes: DominionLensHexVM[] = [];
  for (const [key, band] of projection.hexBand) {
    hexes.push({
      key,
      band,
      frontier: frontierHex.has(key),
      meetsHostile: frontierHex.get(key) ?? false,
      placeId: projection.hexPlaceId.get(key) ?? null,
    });
  }
  return {
    on,
    hexes,
    edges: edges.map(e => ({ key: e.a, dir: e.dir, meetsHostile: e.meetsHostile })),
    godSphere,
    drops: [...drops],
  };
}

export interface DominionHexLineVM {
  band: DominionBand;
  /** "Held ground, by Hesk Crossing" — or "Held ground" past every town's reach. */
  text: string;
  /** The text before the place name, so the name can render as a link (Law 21). */
  prefix: string;
  placeId: string | null;
  placeName: string | null;
  tooltipId: string;
  /**
   * THR-1878 (THR-1830 § 5) — why the band here may move: "Pressed by a power of
   * Entropy; your Life holds here." Null when no opposing pole weighs enough at the
   * lending place, or there is no lending place, no god, or no scores. Additive:
   * callers that predate it ignore it.
   */
  pressure?: string | null;
}

function sphereWord(s: SphereName): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The pressure clause for a lending place (plan THR-1878 § D4): over the spheres the
 * god holds that have an opposite, weigh the opposing pole by Dominion's own
 * opposition weight; take the heaviest (ties: the god's primary sphere, then sphere
 * order); below DOMINION_PRESSURE_LINE_MIN there is no clause.
 */
export function dominionPressureClause(
  graph: WorldGraph,
  placeId: string | null,
  ascendantId: string | null | undefined,
): string | null {
  if (!placeId || !ascendantId) return null;
  try {
    const bag = graph.getNode(placeId)?.properties.sphereAffinity;
    if (!isValidSphereAffinity(bag)) return null;
    const scores = (bag as SphereAffinity).scores;
    const points = getSpherePoints(graph.getNode(ascendantId)?.properties);
    const primary = rankSpherePoints(points)[0] ?? null;
    let best: { g: SphereName; w: number } | null = null;
    const order = primary ? [primary, ...SPHERE_NAMES.filter(s => s !== primary)] : [...SPHERE_NAMES];
    for (const g of order) {
      if ((points[g] ?? 0) <= 0) continue;
      const opp = SPHERE_OPPOSITES[g];
      if (!opp) continue;
      const w = (DOMINION_OPPOSITION_WEIGHT[g] ?? 0) * Math.max(0, scores[opp] ?? 0) / MAX_SPHERE_SCORE;
      if (!best || w > best.w) best = { g, w };
    }
    if (!best || best.w < DOMINION_PRESSURE_LINE_MIN) return null;
    const opp = SPHERE_OPPOSITES[best.g] as SphereName;
    const template = (scores[best.g] ?? 0) >= (scores[opp] ?? 0) ? DOMINION_PRESSURE_LINE.holds : DOMINION_PRESSURE_LINE.giving;
    return template.replace('{opposite}', sphereWord(opp)).replace('{sphere}', sphereWord(best.g));
  } catch {
    return null;
  }
}

/**
 * The hex-tooltip line while the lens is on. Null for water or an unknown hex.
 * With `ascendantId`, the line carries the pressure clause (THR-1878).
 */
export function dominionHexLineVM(
  graph: WorldGraph,
  projection: DominionHexProjection | null,
  key: HexKey,
  ascendantId?: string | null,
): DominionHexLineVM | null {
  const band = projection?.hexBand.get(key);
  if (!projection || !band) return null;
  const word = DOMINION_BAND_WORDS[band];
  const placeId = projection.hexPlaceId.get(key) ?? null;
  const placeName = placeId ? graph.getNode(placeId)?.name || null : null;
  if (!placeId || !placeName) {
    const text = DOMINION_HEX_LINE.terrain.replace('{band}', word);
    return { band, text, prefix: text, placeId: null, placeName: null, tooltipId: dominionBandTooltipId(band), ...(ascendantId === undefined ? {} : { pressure: null }) };
  }
  const text = DOMINION_HEX_LINE.byPlace.replace('{band}', word).replace('{place}', placeName);
  const prefix = DOMINION_HEX_LINE.byPlace.split('{place}')[0].replace('{band}', word);
  const pressure = ascendantId === undefined ? undefined : dominionPressureClause(graph, placeId, ascendantId);
  return {
    band, text, prefix, placeId, placeName, tooltipId: dominionBandTooltipId(band),
    ...(pressure === undefined ? {} : { pressure }),
  };
}
