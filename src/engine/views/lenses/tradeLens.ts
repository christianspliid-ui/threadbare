/**
 * tradeLens — the Trade lens's view model (THR-1898; THR-1878 plan § D4, lens 4).
 *
 * Focus: every hex on a known trade road — the cube line between the route's two ends,
 * ends included (`hexLine`), for each `trades_with` route with at least one end on a
 * hex the player has explored. Marks: one `road` per route (caravan gold, `threat` red
 * when threatened, `weight` = its volume for the line width — geometry, never text).
 *
 * Hover, on each end's hex, from that end's side: the road words the plain hex tooltip
 * showed (THR-670, moved here as sentences, PC-6) — "A road to Hesk Crossing, carrying
 * grain and salt." plus "It is blockaded." / "It is fading." and "Threatened." — then
 * one line for the two ends' prosperity and scarce goods, as words (never a number).
 *
 * Pure and deterministic: routes sorted by edge id; hexes and lines sorted.
 */
import type { GraphNode } from '../../../types/graph';
import { hexKey } from '../../../lib/hexKey';
import { hexLine } from '../../../lib/hexMath';
import { TRADE_LENS_WORDS } from '../../../data/view-content';
import { RESOURCE_DEFINITIONS } from '../../../data/resource-content';
import { getProsperityTier } from '../../phaseProsperity';
import { readTradeRouteProps, laneTraffic, isLaneTrafficEnabled } from '../../tradeRoute';
import type { ViewContext } from '../viewContext';
import { isHexKnown } from '../knowledge';
import {
  LENS_HOVER_MAX_LINES,
  plainLine,
  type HexLensVM,
  type LensLine,
  type LensLineSegment,
  type LensMark,
} from './lensTypes';

interface PlaceEnd {
  node: GraphNode;
  col: number;
  row: number;
  key: string;
  name: string;
}

function endOf(ctx: ViewContext, id: string): PlaceEnd | null {
  const node = ctx.graph.getNode(id);
  if (!node) return null;
  const col = node.properties.hexCol as number | undefined;
  const row = node.properties.hexRow as number | undefined;
  if (col === undefined || row === undefined) return null;
  return { node, col, row, key: hexKey(col, row), name: node.name || TRADE_LENS_WORDS.farMarket };
}

/** A good's display name: the resource definition's, or the id in plain words. */
export function goodWord(id: string): string {
  const name = RESOURCE_DEFINITIONS[id]?.name;
  return (name ?? id.replace(/_/g, ' ')).toLowerCase();
}

/** "grain", "grain and salt", "grain, salt and iron". */
export function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function placeRef(end: PlaceEnd): LensLineSegment['ref'] {
  return end.node.name ? { kind: 'location', id: end.node.id, name: end.node.name } : null;
}

/** "Millbrook is prosperous" / "… is struggling and short of iron"; null with no prosperity. */
function endClause(end: PlaceEnd): LensLineSegment[] | null {
  const p = end.node.properties.prosperity;
  if (typeof p !== 'number') return null;
  const tier = getProsperityTier(p).toLowerCase();
  const resources = (end.node.properties.resources ?? {}) as Record<string, { stockTier?: string }>;
  const scarce = Object.keys(resources).filter(id => resources[id]?.stockTier === 'scarce').sort().map(goodWord);
  const [before, after] = TRADE_LENS_WORDS.endTier.split('{place}');
  const segs: LensLineSegment[] = [];
  if (before) segs.push({ text: before, ref: null });
  segs.push({ text: end.name, ref: placeRef(end) });
  let tail = (after ?? '').replace('{tier}', tier);
  if (scarce.length > 0) tail += TRADE_LENS_WORDS.endShort.replace('{goods}', joinWords(scarce));
  segs.push({ text: tail, ref: null });
  return segs;
}

export function buildTradeLens(ctx: ViewContext): HexLensVM {
  const legend = { head: TRADE_LENS_WORDS.legendHead, lines: [...TRADE_LENS_WORDS.legend] };
  const known = (key: string) => isHexKnown(ctx.state, key);
  const trafficOn = isLaneTrafficEnabled();

  const lit = new Set<string>();
  const marks: LensMark[] = [];
  const hover = new Map<string, { sort: string; lines: LensLine[] }[]>();
  const addLines = (key: string, sort: string, lines: LensLine[]) => {
    const list = hover.get(key) ?? [];
    list.push({ sort, lines });
    hover.set(key, list);
  };

  const edges = [...ctx.graph.getEdgesByType('trades_with')].sort((a, b) => a.id.localeCompare(b.id));
  for (const edge of edges) {
    const a = endOf(ctx, edge.source);
    const b = endOf(ctx, edge.target);
    if (!a || !b) continue; // a route end with no hex is skipped (as the plain map did)
    if (!known(a.key) && !known(b.key)) continue; // a road you know of

    const props = readTradeRouteProps(edge.properties);
    const threatened = edge.properties.threatened === true;
    const traffic = trafficOn ? laneTraffic(ctx.graph, edge, ctx.tick) : 'carrying';

    for (const h of hexLine({ col: a.col, row: a.row }, { col: b.col, row: b.row }, { includeEnds: true })) {
      const key = hexKey(h.col, h.row);
      if (known(key)) lit.add(key);
    }
    marks.push({
      kind: 'road',
      hexKey: a.key,
      toHexKey: b.key,
      tone: threatened ? 'threat' : 'caravan',
      weight: props.volume,
      ...(placeRef(b) ? { ref: placeRef(b)! } : {}),
    });

    const ends = [a, b].map(endClause);
    const endLine: LensLine | null = ends[0] && ends[1]
      ? { segments: [...ends[0], { text: '; ', ref: null }, ...ends[1], { text: '.', ref: null }] }
      : ends[0] ? { segments: [...ends[0], { text: '.', ref: null }] }
        : ends[1] ? { segments: [...ends[1], { text: '.', ref: null }] } : null;

    for (const [here, other] of [[a, b], [b, a]] as const) {
      if (!known(here.key)) continue;
      const goods = props.manifest.goods.map(goodWord);
      const template = goods.length > 0 ? TRADE_LENS_WORDS.road : TRADE_LENS_WORDS.roadLight;
      const [pre, post] = template.split('{place}');
      let tail = (post ?? '').replace('{goods}', joinWords(goods));
      if (traffic === 'suspended') tail += ` ${TRADE_LENS_WORDS.blockaded}`;
      else if (traffic === 'idle') tail += ` ${TRADE_LENS_WORDS.fading}`;
      const roadLine: LensLine = {
        segments: [
          ...(pre ? [{ text: pre, ref: null }] : []),
          { text: other.name, ref: placeRef(other) },
          { text: tail, ref: null },
        ],
      };
      const lines = [roadLine];
      if (threatened) lines.push(plainLine(TRADE_LENS_WORDS.threatened));
      if (endLine) lines.push(endLine);
      addLines(here.key, edge.id, lines);
    }
  }

  if (lit.size === 0) {
    return { lensId: 'trade', lit: [], marks: [], hover: {}, legend, emptyLine: TRADE_LENS_WORDS.empty };
  }

  const out: Record<string, LensLine[]> = {};
  for (const key of [...hover.keys()].sort()) {
    const lines = hover.get(key)!.sort((x, y) => x.sort.localeCompare(y.sort)).flatMap(g => g.lines);
    out[key] = lines.length <= LENS_HOVER_MAX_LINES
      ? lines
      : [...lines.slice(0, LENS_HOVER_MAX_LINES - 1), plainLine(TRADE_LENS_WORDS.overflow)];
  }

  return { lensId: 'trade', lit: [...lit].sort(), marks, hover: out, legend, emptyLine: null };
}
