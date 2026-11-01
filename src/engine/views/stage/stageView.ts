/**
 * stageView — the Stage's view model and the lit-hex resolver (THR-1892; THR-1822 § D12
 * with plan THR-1877 § D9's refinements).
 *
 * The Stage plays one mortal's moment over the dimmed map with the moment's hex lit in a
 * window of open map. This selector answers, from the world alone, what the Stage shows
 * around the moment's own body: which hex is lit and why, what the camera frames, the
 * place tag over the window, the compact context line, the layout and the palette.
 *
 * **Lit-hex order** (THR-1829 § 4): the moment's own hex (an encounter header's) → the
 * subject agent's hex, where the map draws them (`movementState.currentHexPosition` on a
 * road, else `hexCol/hexRow`, else `located_at` with a Place resolved up to its
 * Location — the rule `map/agents.ts` uses) → the ruin's Location → null: nothing lit,
 * the whole map dims and the camera stays.
 *
 * **Place naming:** the Location the subject actually stands at, when it is on the lit
 * hex and discovered; else the land naming rule's pick — the hex's named Location, else
 * the land's name (a link to the land page). An undiscovered place is never named.
 *
 * Refinements over D12, each to keep one vocabulary: the kind is `StageHomedKind`, derived
 * from `HOMED_SURFACES`; the encounter's step / aftermath / watched view is a `phase`, not
 * three kinds; the palette is the list's palette name.
 *
 * Pure and read-only. World-keyed: people move every tick.
 */
import type { GraphNode } from '../../../types/graph';
import type { WorldRef } from '../../../types/worldRef';
import { homedSurfaceFor, type HomedSurfacePalette, type StageHomedKind } from '../../../data/homed-surfaces';
import { STAGE_WORDS } from '../../../data/view-content';
import { hexKey as toHexKey, type HexKey } from '../../hexActorIndex';
import { resolveToParentLocation } from '../../sublocationShape';
import type { WorldGraph } from '../../graph';
import { landNameFor, namedLocationOnHex } from '../subjects/landName';
import { isHexKnown } from '../knowledge';
import type { ViewContext } from '../viewContext';
import type { ViewSelector } from '../readView';
import type { RefRow } from '../types';
import { mortalFace, type EntityVisualDescriptor } from '../entityVisualResolver';

export type StageLitSource = 'beat' | 'agent_location' | 'ruin_location';
export type StageLayout = 'full' | 'compact';
export type StagePhase = 'step' | 'aftermath' | 'watched';

export interface StageMomentInput {
  kind: StageHomedKind;
  /** The moment's own hex, when its data carries one (a queued story beat, an encounter header). */
  hex?: { col: number; row: number } | null;
  /** Whose moment it is. */
  subjectAgentId?: string | null;
  /** The emergence dilemma's ruin. */
  ruinId?: string | null;
  /** A premonition's option places (THR-1897), in option order; an option without a Location passes null. */
  optionLocationIds?: readonly (string | null)[] | null;
  /** The encounter's step, aftermath or watched view; other kinds have none. */
  phase?: StagePhase | null;
  hasArt: boolean;
  hasCast: boolean;
}

export interface StageOptionVM {
  ref: WorldRef;
  hexKey: HexKey;
  /** The option's hex is in fog: its ring draws over the fog and reveals nothing. */
  ringOnly: boolean;
  /** Which option this is (its index in the premonition's options). */
  index: number;
  /** The option hex's name by the one naming rule, for the place tag while it is hovered. */
  place: RefRow;
}

export interface StageContextLineVM {
  subject: RefRow | null;
  place: RefRow | null;
  /** The whole line as plain text ("Maren Ashfold at Millbrook"), for tests and screen readers. */
  text: string;
}

export interface StageVM {
  kind: StageHomedKind;
  phase: StagePhase | null;
  palette: HomedSurfacePalette | null;
  litHex: HexKey | null;
  litSource: StageLitSource | null;
  /** Premonition places (S4); empty for every other kind. */
  options: StageOptionVM[];
  /** What the camera fits in the window: the lit hex (and, for a premonition, its options' places). */
  frame: HexKey[];
  /** The lit hex's name, as a link. Null when nothing is lit. */
  place: RefRow | null;
  /** "Millbrook · where it is happening"; null when nothing is lit. */
  placeTag: string | null;
  /** The words after the place's name in the tag (" · where it is happening"). */
  placeTagSuffix: string | null;
  subject: RefRow | null;
  /**
   * THR-2100 (S4.1) — the subject mortal's face, the one face every Stage moment draws.
   * Resolved here with the knowledge gate (`mortalFace`, the god rail's and the page's
   * gate), so a mortal below `recognised` is the silhouette on the Stage and on their page
   * alike (Law 8, PC-6). Null when the moment has no mortal subject.
   */
  subjectVisual: EntityVisualDescriptor | null;
  /** The compact header's line; null when it has neither a subject nor a place. */
  contextLine: StageContextLineVM | null;
  layout: StageLayout;
}

type LitHex = { key: HexKey; source: StageLitSource } | null;

function hexOfLocation(node: GraphNode | undefined): HexKey | null {
  const col = node?.properties.hexCol;
  const row = node?.properties.hexRow;
  return typeof col === 'number' && typeof row === 'number' ? toHexKey(col, row) : null;
}

/** The Location (outer tier) an agent stands at: `located_at`, a Place resolved up. */
export function agentLocation(graph: WorldGraph, agentId: string | null | undefined): GraphNode | undefined {
  if (!agentId) return undefined;
  const edge = graph.getOutgoingEdges(agentId, 'located_at')[0];
  return edge ? resolveToParentLocation(graph, graph.getNode(edge.target)) : undefined;
}

/**
 * An agent's hex, where the map draws them (`map/agents.ts`): on a road its
 * `movementState.currentHexPosition` (`located_at` is stale while travelling), else its
 * own `hexCol/hexRow`, else its Location's hex.
 */
export function agentHex(graph: WorldGraph, agentId: string | null | undefined): HexKey | null {
  if (!agentId) return null;
  const node = graph.getNode(agentId);
  const moving = (node?.properties.movementState as { currentHexPosition?: { col: number; row: number } } | undefined)?.currentHexPosition;
  if (moving && Number.isFinite(moving.col) && Number.isFinite(moving.row)) return toHexKey(moving.col, moving.row);
  const own = hexOfLocation(node);
  if (own) return own;
  return hexOfLocation(agentLocation(graph, agentId));
}

/** A ruin's hex: the ruin is a Location (or a Place inside one). */
export function ruinHex(graph: WorldGraph, ruinId: string | null | undefined): HexKey | null {
  if (!ruinId) return null;
  return hexOfLocation(resolveToParentLocation(graph, graph.getNode(ruinId)));
}

function litHexFor(graph: WorldGraph, input: StageMomentInput): LitHex {
  const own = input.hex;
  if (own && Number.isFinite(own.col) && Number.isFinite(own.row)) return { key: toHexKey(own.col, own.row), source: 'beat' };
  // THR-1897 — the emergence dilemma is lit at its ruin, else its mortal (plan § D1 row 10).
  if (input.kind === 'emergence-dilemma') {
    const atRuinFirst = ruinHex(graph, input.ruinId);
    if (atRuinFirst) return { key: atRuinFirst, source: 'ruin_location' };
  }
  const atAgent = agentHex(graph, input.subjectAgentId);
  if (atAgent) return { key: atAgent, source: 'agent_location' };
  const atRuin = ruinHex(graph, input.ruinId);
  if (atRuin) return { key: atRuin, source: 'ruin_location' };
  return null;
}

/**
 * THR-1897 — a premonition's option places: each option's Location hex, ring-only when
 * the hex is unexplored. An option with no Location, or whose Location has no hex, lights
 * nothing (the others still do).
 */
function optionHexes(ctx: ViewContext, input: StageMomentInput): StageOptionVM[] {
  const ids = input.optionLocationIds ?? [];
  const out: StageOptionVM[] = [];
  ids.forEach((locationId, index) => {
    if (!locationId) return;
    const key = hexOfLocation(resolveToParentLocation(ctx.graph, ctx.graph.getNode(locationId)));
    if (!key) return;
    out.push({
      ref: { kind: 'location', id: locationId },
      hexKey: key,
      ringOnly: !isHexKnown(ctx.state, key),
      index,
      place: placeOfHex(ctx, key),
    });
  });
  return out;
}

/** THR-1822 D12 — what the Stage lights and what the camera frames. */
export function resolveMomentHexes(ctx: ViewContext, input: StageMomentInput): Pick<StageVM, 'litHex' | 'litSource' | 'options' | 'frame'> {
  const lit = litHexFor(ctx.graph, input);
  const options = optionHexes(ctx, input);
  // The lit hex first: the camera frames it alone when the options do not fit (§ D6).
  const frame = [...new Set([...(lit ? [lit.key] : []), ...options.map(o => o.hexKey)])];
  return {
    litHex: lit?.key ?? null,
    litSource: lit?.source ?? null,
    options,
    frame,
  };
}

function parseKey(key: HexKey): { col: number; row: number } {
  const [col, row] = key.split(',').map(Number);
  return { col, row };
}

/**
 * The lit hex's name: the subject's own Location when it is on this hex and discovered,
 * else the naming rule — the hex's named Location, else the land.
 */
export function placeOfHex(ctx: ViewContext, key: HexKey, subjectAgentId?: string | null): RefRow {
  const { col, row } = parseKey(key);
  const own = agentLocation(ctx.graph, subjectAgentId);
  if (own?.name && own.properties.discovered !== false && hexOfLocation(own) === key) {
    return { ref: { kind: 'location', id: own.id }, name: own.name };
  }
  const loc = namedLocationOnHex(ctx.graph, col, row);
  if (loc) return { ref: { kind: 'location', id: loc.id }, name: loc.name };
  return { ref: { kind: 'hex', id: key }, name: landNameFor(ctx.state, col, row) };
}

function subjectRow(graph: WorldGraph, agentId: string | null | undefined): RefRow | null {
  if (!agentId) return null;
  const node = graph.getNode(agentId);
  if (!node?.name) return null;
  return { ref: { kind: 'agent', id: agentId }, name: node.name };
}

/** "{subject} at {place}"; "{subject}"; "At {place}"; or no line. */
export function stageContextLine(subject: RefRow | null, place: RefRow | null): StageContextLineVM | null {
  if (!subject && !place) return null;
  const text = subject && place
    ? `${subject.name}${STAGE_WORDS.contextJoin}${place.name}`
    : subject
      ? subject.name
      : `${STAGE_WORDS.contextAtOnly}${place!.name}`;
  return { subject, place, text };
}

export function stageLayoutFor(input: Pick<StageMomentInput, 'hasArt' | 'hasCast'>): StageLayout {
  return input.hasArt || input.hasCast ? 'full' : 'compact';
}

function paletteOf(kind: StageHomedKind): HomedSurfacePalette | null {
  return (homedSurfaceFor(kind)?.palette as HomedSurfacePalette | undefined) ?? null;
}

export function buildStageView(ctx: ViewContext, input: StageMomentInput): StageVM {
  const hexes = resolveMomentHexes(ctx, input);
  const place = hexes.litHex ? placeOfHex(ctx, hexes.litHex, input.subjectAgentId) : null;
  const subject = subjectRow(ctx.graph, input.subjectAgentId);
  // A premonition's tag says where its mortal is (§ D5): "Millbrook · where Maren Ashfold is".
  const suffix = !place
    ? null
    : input.kind === 'premonition' && subject
      ? STAGE_WORDS.placeTagSubjectSuffix.replace('{subject}', subject.name)
      : STAGE_WORDS.placeTagSuffix;
  return {
    kind: input.kind,
    phase: input.phase ?? null,
    palette: paletteOf(input.kind),
    ...hexes,
    place,
    placeTag: place && suffix ? `${place.name}${suffix}` : null,
    placeTagSuffix: suffix,
    subject,
    subjectVisual: input.subjectAgentId ? mortalFace(ctx.graph, input.subjectAgentId, ctx.state.familiarityMap) : null,
    contextLine: stageContextLine(subject, place),
    layout: stageLayoutFor(input),
  };
}

/** Fail-soft: nothing lit, the layout from the moment's art and cast, the palette from the list. */
export function fallbackStageView(input: StageMomentInput): StageVM {
  return {
    kind: input.kind,
    phase: input.phase ?? null,
    palette: paletteOf(input.kind),
    litHex: null,
    litSource: null,
    options: [],
    frame: [],
    place: null,
    placeTag: null,
    placeTagSuffix: null,
    subject: null,
    subjectVisual: null,
    contextLine: null,
    layout: stageLayoutFor(input),
  };
}

export const stageViewSelector: ViewSelector<StageMomentInput, StageVM> = {
  id: 'stage',
  invalidation: 'world',
  key: (a) => [
    a.kind,
    a.phase ?? '',
    a.subjectAgentId ?? '',
    a.hex ? `${a.hex.col},${a.hex.row}` : '',
    a.ruinId ?? '',
    (a.optionLocationIds ?? []).map(id => id ?? '-').join(','),
    a.hasArt ? 'a' : '',
    a.hasCast ? 'c' : '',
  ].join('|'),
  build: buildStageView,
  fallback: (args) => fallbackStageView(args),
};
