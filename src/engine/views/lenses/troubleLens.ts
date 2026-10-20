/**
 * troubleLens — the Trouble lens's view model (THR-1898; THR-1878 plan § D4, lens 3).
 *
 * Lights a hex where something is going wrong, read from state the game already shows:
 *
 * - **Unrest** — the engine's per-Location value, the one "Incite Unrest" raises, read the
 *   two ways the game already tells it: a place-tier Location here carries the Lawless
 *   condition (the chip on its page), or the hex's mood bucket (`deriveMoodBucket`, the
 *   average the hex survey reads) is at or past `TROUBLE_UNREST_MIN_MOOD`.
 * - **Unrest, On the edge** (THR-1957) — a place carrying the On the edge chip says so
 *   in the band's words, naming the holder it may turn from; it replaces the Lawless line.
 * - **Hunger** (THR-1957) — a settlement hungry today (`hungerDays > 0`, the unrest
 *   pressure's counter): one red badge and the line. Restless alone never lights a hex.
 * - **Strife** — the conflict pulse (`deriveLocationActivities`' hex pulse, tense or
 *   volatile): mortals here arming or fighting.
 * - **Battles and sieges** — lit, but no badge: the plain map already draws their sprites,
 *   and the plain tooltip already says their words (PC-5).
 * - **Schemes and drains** — `buildRivalInfluenceMarkers`, the producer the retired rival
 *   rings read; the rival is named.
 * - **Lairs** — an undefeated lair (`locationSubtype: 'lair'` with a tier; a cleared lair
 *   has subtype `cleared_lair`).
 * - **Omens** — a local emitted omen lights every hex in its reach (`radius`, default
 *   `TROUBLE_OMEN_DEFAULT_RADIUS`) until it expires; the mark is the ring.
 *
 * Nothing on an unexplored hex (`isHexKnown`). Pure and deterministic: hexes and lines
 * are sorted; ties by kind order, then name, then id.
 */
import type { GraphNode } from '../../../types/graph';
import type { SphereName } from '../../../types';
import { hexKey } from '../../../lib/hexKey';
import { hexDistance } from '../../../lib/hexMath';
import { TROUBLE_LENS_WORDS } from '../../../data/view-content';
import { LOCATION_TRAIT_IDS } from '../../../data/location-trait-constants';
import { EMITTED_OMEN_LOCAL_DEFAULT_RADIUS } from '../../../data/game-config';
import type { MoodBucket } from '../../../data/survey-prose-tables';
import { getLocationNodes } from '../../sublocationShape';
import { judgedHolderOf } from '../../unrestPressure/bands';
import { isPressureSettlement, HUNGER_DAYS_PROP } from '../../unrestPressure/inputs';
import { deriveMoodBucket } from '../../surveyProseComposer';
import { deriveLocationActivities } from '../../deriveLocationActivities';
import { buildRivalInfluenceMarkers, buildRivalSchemeTargets } from '../../rivalInfluenceMarkers';
import { battleIndicatorForNode } from '../map/armiesAndBattles';
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

/** The mood at which a hex counts as Trouble for Unrest: past restless (unrest above 60 of 100). NFP #1. */
export const TROUBLE_UNREST_MIN_MOOD: MoodBucket = 'agitated';

/** Reach of a local omen whose scope gives no radius — the engine's own default, so the ring agrees with who acts on it. NFP #1. */
export const TROUBLE_OMEN_DEFAULT_RADIUS = EMITTED_OMEN_LOCAL_DEFAULT_RADIUS;

const MOOD_ORDER: readonly MoodBucket[] = ['calm', 'restless', 'agitated', 'boiling'];

/** The order a hex's hover lines are told in — the legend's order. */
const LINE_ORDER = ['unrest', 'hunger', 'strife', 'scheme', 'drain', 'omen', 'lair'] as const;
type LineKind = (typeof LINE_ORDER)[number];

interface HexEntry {
  lines: { kind: LineKind; sort: string; line: LensLine }[];
  /** Mark kinds on this hex (one badge per kind). */
  kinds: Set<string>;
}

function sphereWord(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Fill `{name}`-style slots; slots in `refs` become ref segments (Law 21). */
function fillLine(
  template: string,
  slots: Record<string, string>,
  refs: Record<string, LensLineSegment['ref']> = {},
): LensLine {
  const segments: LensLineSegment[] = [];
  const re = /\{(\w+)\}/g;
  let last = 0;
  for (let m = re.exec(template); m; m = re.exec(template)) {
    if (m.index > last) segments.push({ text: template.slice(last, m.index), ref: null });
    const key = m[1];
    segments.push({ text: slots[key] ?? '', ref: refs[key] ?? null });
    last = m.index + m[0].length;
  }
  if (last < template.length) segments.push({ text: template.slice(last), ref: null });
  // Merge adjacent plain segments so a line with no names is one segment.
  const merged: LensLineSegment[] = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.ref === null && seg.ref === null) prev.text += seg.text;
    else merged.push({ ...seg });
  }
  return { segments: merged };
}

function nodeHex(node: GraphNode): { col: number; row: number } | null {
  const col = Number(node.properties.hexCol);
  const row = Number(node.properties.hexRow);
  if (!Number.isFinite(col) || !Number.isFinite(row)) return null;
  return { col, row };
}

function isLawless(ctx: ViewContext, locId: string): boolean {
  return ctx.graph.getOutgoingEdges(locId, 'has_trait').some(e => e.target === LOCATION_TRAIT_IDS.lawless);
}

function isOnTheEdge(ctx: ViewContext, locId: string): boolean {
  return ctx.graph.getOutgoingEdges(locId, 'has_trait').some(e => e.target === LOCATION_TRAIT_IDS.onTheEdge);
}

function visibleHexKeys(ctx: ViewContext): ReadonlySet<string> {
  const map = ctx.state.visibilityMap;
  if (!map || typeof map.get !== 'function' || map.size === 0) {
    // Fog off or a test world: every hex is in view.
    return new Proxy(new Set<string>(), {
      get(target, prop) {
        if (prop === 'has') return () => true;
        return Reflect.get(target, prop);
      },
    }) as ReadonlySet<string>;
  }
  const keys = new Set<string>();
  for (const [key, entry] of map) if (entry.state === 'visible') keys.add(key);
  return keys;
}

export function buildTroubleLens(ctx: ViewContext): HexLensVM {
  const legend = troubleLegend(ctx);
  const byHex = new Map<string, HexEntry>();
  const lit = new Set<string>();
  const marks: LensMark[] = [];

  const entry = (key: string): HexEntry => {
    let e = byHex.get(key);
    if (!e) { e = { lines: [], kinds: new Set() }; byHex.set(key, e); }
    return e;
  };
  const known = (key: string) => isHexKnown(ctx.state, key);
  const addMark = (mark: LensMark) => {
    const e = entry(mark.hexKey);
    if (e.kinds.has(mark.kind)) return;
    e.kinds.add(mark.kind);
    marks.push(mark);
  };

  // ── Unrest: Lawless places, then the hex mood ──
  const lawlessHexes = new Set<string>();
  for (const loc of getLocationNodes(ctx.graph)) {
    const edge = isOnTheEdge(ctx, loc.id);
    if (!edge && !isLawless(ctx, loc.id)) continue;
    const pos = nodeHex(loc);
    if (!pos) continue;
    const key = hexKey(pos.col, pos.row);
    if (!known(key)) continue;
    lawlessHexes.add(key);
    lit.add(key);
    const place = loc.name || '';
    const placeRef: LensLineSegment['ref'] = { kind: 'location', id: loc.id, name: place };
    let line: LensLine;
    if (edge) {
      const holderId = judgedHolderOf(ctx.graph, loc.id);
      const holder = holderId ? (ctx.graph.getNode(holderId)?.name || '') : '';
      line = holderId && holder
        ? fillLine(TROUBLE_LENS_WORDS.unrestOnTheEdgeHeld, { place, holder }, { place: placeRef, holder: { kind: 'faction', id: holderId, name: holder } })
        : fillLine(TROUBLE_LENS_WORDS.unrestOnTheEdgeUnheld, { place }, { place: placeRef });
    } else {
      line = fillLine(TROUBLE_LENS_WORDS.unrestLawless, { place }, { place: placeRef });
    }
    entry(key).lines.push({
      kind: 'unrest',
      sort: `${place}|${loc.id}`,
      line,
    });
    addMark({ kind: 'unrest', hexKey: key, tone: 'trouble', ref: { kind: 'location', id: loc.id, name: place } });
  }
  const moodHexes = new Set<string>();
  for (const loc of getLocationNodes(ctx.graph)) {
    const pos = nodeHex(loc);
    if (!pos) continue;
    const key = hexKey(pos.col, pos.row);
    if (moodHexes.has(key) || lawlessHexes.has(key)) continue;
    moodHexes.add(key);
    if (!known(key)) continue;
    const mood = deriveMoodBucket(ctx.graph, pos.col, pos.row);
    if (!mood || MOOD_ORDER.indexOf(mood) < MOOD_ORDER.indexOf(TROUBLE_UNREST_MIN_MOOD)) continue;
    const words = TROUBLE_LENS_WORDS.unrestMood as Partial<Record<MoodBucket, string>>;
    const text = words[mood];
    if (!text) continue;
    lit.add(key);
    entry(key).lines.push({ kind: 'unrest', sort: '', line: plainLine(text) });
    addMark({ kind: 'unrest', hexKey: key, tone: 'trouble' });
  }

  // ── Hunger: a settlement that cannot feed its people today ──
  for (const loc of getLocationNodes(ctx.graph)) {
    if (!isPressureSettlement(loc)) continue;
    const days = loc.properties[HUNGER_DAYS_PROP];
    if (typeof days !== 'number' || !(days > 0)) continue;
    const pos = nodeHex(loc);
    if (!pos) continue;
    const key = hexKey(pos.col, pos.row);
    if (!known(key)) continue;
    lit.add(key);
    const place = loc.name || '';
    const ref: LensLineSegment['ref'] = { kind: 'location', id: loc.id, name: place };
    entry(key).lines.push({
      kind: 'hunger',
      sort: `${place}|${loc.id}`,
      line: fillLine(TROUBLE_LENS_WORDS.hunger, { place }, { place: ref }),
    });
    addMark({ kind: 'hunger', hexKey: key, tone: 'trouble', ref: ref ?? undefined });
  }

  // ── Strife: the conflict pulse ──
  try {
    const { hexPulses } = deriveLocationActivities({
      graph: ctx.graph,
      unifiedActions: ctx.state.unifiedActions ?? [],
      familiarityMap: ctx.state.familiarityMap ?? new Map(),
      visibleHexKeys: visibleHexKeys(ctx),
      tick: ctx.tick,
      omenState: ctx.state.omenState,
    });
    for (const [key, summary] of [...hexPulses.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      if (summary.pulse !== 'tense' && summary.pulse !== 'volatile') continue;
      if (!known(key)) continue;
      lit.add(key);
      entry(key).lines.push({ kind: 'strife', sort: '', line: plainLine(TROUBLE_LENS_WORDS.strife[summary.pulse]) });
      addMark({ kind: 'strife', hexKey: key, tone: 'trouble' });
    }
  } catch {
    // NFP #4: the activity read is a UI derivation; a failure leaves Strife dark.
  }

  // ── Battles and sieges: lit only (the plain map draws them and tells them) ──
  for (const node of ctx.graph.getNodesByType('actor')) {
    if (node.properties.battleState == null) continue;
    const row = battleIndicatorForNode(ctx.graph, node);
    if (!row) continue;
    const key = hexKey(row.hexCol, row.hexRow);
    if (known(key)) lit.add(key);
  }

  // ── Schemes and drains: the rival is named ──
  const rivals = ctx.state.rivalDefinitions ?? [];
  const rivalName = new Map(rivals.map(r => [r.id, r.name]));
  const schemeTargets = buildRivalSchemeTargets(ctx.state.activeCompositions, ctx.state.worldFlags);
  for (const m of buildRivalInfluenceMarkers(ctx.graph, rivals, schemeTargets)) {
    const key = hexKey(m.col, m.row);
    if (!known(key)) continue;
    const place = ctx.graph.getNode(m.targetId)?.name || '';
    const rival = rivalName.get(m.rivalId) || TROUBLE_LENS_WORDS.rivalFallback;
    // Rivals are not graph nodes and `WorldRefKind` has no rival kind, so the rival is
    // named in words (THR-1699's gap closed) with no ref; the hover tier does not route.
    const rivalRef: LensLineSegment['ref'] = null;
    const placeRef: LensLineSegment['ref'] = { kind: 'location', id: m.targetId, name: place };
    const kind: LineKind = m.reason === 'scheme' ? 'scheme' : 'drain';
    const template = m.reason === 'scheme'
      ? TROUBLE_LENS_WORDS.scheme
      : m.reason === 'source_desecrated' ? TROUBLE_LENS_WORDS.drainDesecrated : TROUBLE_LENS_WORDS.drainContested;
    lit.add(key);
    entry(key).lines.push({
      kind,
      sort: `${rival}|${place}|${m.targetId}`,
      line: fillLine(template, { rival, place }, { rival: rivalRef, place: placeRef }),
    });
    addMark({ kind, hexKey: key, tone: 'trouble', ref: placeRef ?? undefined });
  }

  // ── Omens: a local omen's reach, until it expires ──
  const tiles = ctx.tiles;
  for (const omen of [...(ctx.state.emittedOmens ?? [])].sort((a, b) => a.omenId.localeCompare(b.omenId))) {
    if (omen.scope.kind !== 'local') continue;
    if (omen.expiresTick <= ctx.tick) continue;
    const centre = { col: omen.scope.hexCol, row: omen.scope.hexRow };
    const radius = Math.max(0, omen.scope.radius ?? TROUBLE_OMEN_DEFAULT_RADIUS);
    const reach: string[] = [];
    if (tiles.length > 0) {
      for (const t of tiles) {
        if (hexDistance(centre, t.coord) <= radius) reach.push(hexKey(t.coord.col, t.coord.row));
      }
    } else {
      reach.push(hexKey(centre.col, centre.row));
    }
    const sphere = omen.sphereAlignment as SphereName | undefined;
    const line = sphere
      ? plainLine(TROUBLE_LENS_WORDS.omenSphere.replace('{sphere}', sphereWord(sphere)))
      : plainLine(TROUBLE_LENS_WORDS.omenPlain);
    let anyKnown = false;
    for (const key of reach.sort()) {
      if (!known(key)) continue;
      anyKnown = true;
      lit.add(key);
      const e = entry(key);
      if (!e.lines.some(l => l.kind === 'omen')) e.lines.push({ kind: 'omen', sort: omen.omenId, line });
    }
    const centreKey = hexKey(centre.col, centre.row);
    if (anyKnown && known(centreKey)) {
      addMark({ kind: 'omen', hexKey: centreKey, tone: 'trouble', radius });
    }
  }

  // ── Lairs: undefeated ──
  for (const loc of getLocationNodes(ctx.graph)) {
    if (loc.properties.locationSubtype !== 'lair') continue;
    const tier = loc.properties.lairTier as keyof typeof TROUBLE_LENS_WORDS.lair | undefined;
    if (!tier || !(tier in TROUBLE_LENS_WORDS.lair)) continue;
    const pos = nodeHex(loc);
    if (!pos) continue;
    const key = hexKey(pos.col, pos.row);
    if (!known(key)) continue;
    const place = loc.name || '';
    const ref: LensLineSegment['ref'] = { kind: 'location', id: loc.id, name: place };
    lit.add(key);
    entry(key).lines.push({
      kind: 'lair',
      sort: `${place}|${loc.id}`,
      line: fillLine(TROUBLE_LENS_WORDS.lair[tier], { place }, { place: ref }),
    });
    addMark({ kind: 'lair', hexKey: key, tone: 'trouble', ref: ref ?? undefined });
  }

  if (lit.size === 0) {
    return { lensId: 'trouble', lit: [], marks: [], hover: {}, legend, emptyLine: TROUBLE_LENS_WORDS.empty };
  }

  const hover: Record<string, LensLine[]> = {};
  for (const key of [...byHex.keys()].sort()) {
    const lines = byHex.get(key)!.lines
      .slice()
      .sort((a, b) => LINE_ORDER.indexOf(a.kind) - LINE_ORDER.indexOf(b.kind) || a.sort.localeCompare(b.sort))
      .map(l => l.line);
    if (lines.length === 0) continue;
    hover[key] = lines.length <= LENS_HOVER_MAX_LINES
      ? lines
      : [...lines.slice(0, LENS_HOVER_MAX_LINES - 1), plainLine(TROUBLE_LENS_WORDS.overflow)];
  }

  const markOrder = (k: string) => LINE_ORDER.indexOf(k as LineKind);
  marks.sort((a, b) => a.hexKey.localeCompare(b.hexKey) || markOrder(a.kind) - markOrder(b.kind));

  return { lensId: 'trouble', lit: [...lit].sort(), marks, hover, legend, emptyLine: null };
}

/** "Trouble · Doom: Signs" — the doom part is the stage the doom bar shows, with its tooltip. */
function troubleLegend(ctx: ViewContext): HexLensVM['legend'] {
  const lines = [...TROUBLE_LENS_WORDS.legend];
  const def = ctx.state.doomDefinition;
  const stage = ctx.state.doomClock?.currentStage;
  const stageName = def?.stages?.[(stage ?? 1) - 1]?.name ?? def?.stages?.[0]?.name;
  if (!stageName) return { head: TROUBLE_LENS_WORDS.legendHead, lines };
  return {
    head: TROUBLE_LENS_WORDS.legendHead,
    lines,
    headNote: { text: TROUBLE_LENS_WORDS.doomHead.replace('{stage}', stageName), tooltipId: TROUBLE_DOOM_TOOLTIP_ID },
  };
}

/** The doom bar's own tooltip, carried by "Doom: {stage}" in the legend head. */
export const TROUBLE_DOOM_TOOLTIP_ID = 'ui.doom_bar';
