/**
 * THR-2103 (art-led pass, slice 7, S7.1) — the picture a list row leads with.
 *
 * Plan: `Docs/plans/2026-11-01-thr-2103-art-led-lists.md` § S7.1. One helper for every list
 * row that names a person, place, faction, army or relic: the Chronicle, Notables, Threads,
 * Read the Threads, toasts, Find and the hover card. The hosts resolve here and hand the
 * components a descriptor, so no list component reads the graph for its pictures, and the
 * knowledge gate (Law 8) and the place terrain read live in one function (Law 3). The
 * ceremonies' `echoVisual` reads its node through here too.
 *
 * Pure reads, never a write; render-time only, never in a tick phase. Fail-soft: a kind
 * with no picture returns null (the row keeps its kind icon), a node gone from the graph
 * draws the resolver's designed tile, and nothing throws (NFP #4).
 */
import type { WorldGraph } from '../graph';
import type { FamiliarityMap } from '../../types/familiarity';
import type { HexTile, TerrainType } from '../../types';
import { isWorldRefKind, type WorldRefKind } from '../../types/worldRef';
import type { NavigationTarget } from '../../types/notification';
import { fromNavigationTarget } from '../../types/worldRefAdapters';
import { getFamiliarity, getKnowledgeLevel } from '../familiarity';
import { locationHex } from '../effects/castRelocation';
import { getHexSphereInfluence } from '../hexZoom';
import {
  resolveEntityVisual,
  type EntityVisualDescriptor,
  type EntityVisualKind,
  type ResolveEntityVisualOpts,
} from './entityVisualResolver';

/** What `rowVisual` reads: the graph, what the god knows of each mortal, and (optionally) the map tiles. */
export interface RowVisualContext {
  graph: WorldGraph | null | undefined;
  familiarityMap?: FamiliarityMap | null;
  /** The map's tiles, so a place draws its landscape; absent ⇒ the place's designed glyph tile (Law 4). */
  tiles?: readonly HexTile[] | null;
  /**
   * Also score a place's landscape by its hex's sphere influence, as its page does. A scan of
   * the hex's locations per row, so only a one-picture caller (a harvest echo) asks for it.
   */
  withSphereInfluence?: boolean;
}

/** The subject a row names. `name` overrides the node's name for the alt text. */
export interface RowVisualRef {
  kind: WorldRefKind;
  id: string;
  name?: string;
}

/**
 * Which ref kinds draw a picture, and the visual kind each draws as. Every other kind (hex,
 * area, encounter, journey, receipt) has no picture: the row keeps its kind icon.
 */
export const ROW_VISUAL_KIND: Readonly<Partial<Record<WorldRefKind, EntityVisualKind>>> = {
  agent: 'agent',
  companion: 'companion',
  location: 'location',
  sublocation: 'sublocation',
  faction: 'faction',
  army: 'army',
  artifact: 'artifact',
  attachment: 'artifact',
};

/** The person kinds the knowledge gate reads (Law 8); a dressed row draws them as a circle. */
const GATED_KINDS: ReadonlySet<EntityVisualKind> = new Set<EntityVisualKind>(['agent', 'companion']);

/** True when a row's picture is a person and draws as a circle (S7.2). */
export function isPersonRowVisual(visual: EntityVisualDescriptor | null | undefined): boolean {
  return !!visual && (visual.kind === 'agent' || visual.kind === 'avatar' || visual.kind === 'npc-role' || visual.kind === 'companion' || visual.kind === 'monster');
}

// A tile lookup per tiles array: the array is replaced, not mutated, when the map changes.
const terrainIndexCache = new WeakMap<readonly HexTile[], Map<string, TerrainType>>();

function terrainAt(tiles: readonly HexTile[], col: number, row: number): TerrainType | undefined {
  let index = terrainIndexCache.get(tiles);
  if (!index) {
    index = new Map();
    for (const t of tiles) index.set(`${t.coord.col},${t.coord.row}`, t.terrain);
    terrainIndexCache.set(tiles, index);
  }
  return index.get(`${col},${row}`);
}

/**
 * The picture a row leads with, or null when its subject has none. People pass the god's
 * knowledge of them, so below `recognised` the row draws the silhouette (Law 8); a place
 * draws its landscape when the tiles are given, else its glyph tile.
 */
export function rowVisual(ctx: RowVisualContext, ref: RowVisualRef): EntityVisualDescriptor | null {
  const kind = ROW_VISUAL_KIND[ref.kind];
  if (!kind || !ref.id) return null;
  try {
    const graph = ctx.graph ?? null;
    const opts: ResolveEntityVisualOpts = {};
    if (GATED_KINDS.has(kind)) {
      const map = ctx.familiarityMap;
      const familiarity = map && typeof map.get === 'function' ? getFamiliarity(map, ref.id) : 0;
      opts.knowledgeLevel = getKnowledgeLevel(familiarity);
    }
    if ((kind === 'location' || kind === 'sublocation') && graph && ctx.tiles && ctx.tiles.length > 0) {
      const hex = locationHex(graph, ref.id);
      const terrain = hex ? terrainAt(ctx.tiles, hex.col, hex.row) : undefined;
      if (terrain !== undefined) opts.terrain = terrain;
      if (hex && ctx.withSphereInfluence) opts.sphereInfluence = getHexSphereInfluence(graph, hex.col, hex.row);
    }
    // A node the graph refines (a monster, a god, a sublocation named as a location) keeps
    // the resolver's own derivation. Armies, attachment templates and companions are not
    // kinds the derivation knows, so they, and a node gone from the graph, pass the kind.
    const node = graph?.getNode(ref.id) ?? null;
    const explicit = !node || kind === 'army' || kind === 'companion' || ref.kind === 'attachment';
    return resolveEntityVisual({ id: ref.id, kind: explicit ? kind : undefined, name: ref.name }, graph, opts);
  } catch {
    return null;
  }
}

/**
 * Every named mortal's face, keyed by id: the digest's rows (Read the Threads) and any other
 * list keyed by agent id. Each id resolves once however many rows name it.
 */
export function agentRowVisuals(
  ctx: RowVisualContext,
  rows: readonly { agentId: string; agentName?: string }[],
): Readonly<Record<string, EntityVisualDescriptor | null>> {
  const out: Record<string, EntityVisualDescriptor | null> = {};
  for (const row of rows) {
    if (!row.agentId || row.agentId in out) continue;
    out[row.agentId] = rowVisual(ctx, { kind: 'agent', id: row.agentId, name: row.agentName });
  }
  return out;
}

/**
 * Decision 4 — a toast's picture: the subject its click opens. Keyed by toast id; a toast
 * with no target, or a target kind with no picture (hex, encounter, receipt…), has no entry.
 */
export function toastRowVisuals(
  ctx: RowVisualContext,
  toasts: readonly { id: string; navigationTarget?: NavigationTarget }[],
): Readonly<Record<string, EntityVisualDescriptor | null>> {
  const out: Record<string, EntityVisualDescriptor | null> = {};
  for (const toast of toasts) {
    if (!toast.navigationTarget) continue;
    try {
      const ref = fromNavigationTarget(toast.navigationTarget);
      const visual = rowVisual(ctx, { kind: ref.kind, id: ref.id });
      if (visual) out[toast.id] = visual;
    } catch {
      // fail-soft: an unreadable target draws no picture
    }
  }
  return out;
}

/** Decision 5 — the hover card's subject picture, or null for a ref with none (a card, a codex row). */
export function hoverRowVisual(ctx: RowVisualContext, ref: unknown): EntityVisualDescriptor | null {
  if (!ref || typeof ref !== 'object') return null;
  const { kind, id, name } = ref as { kind?: unknown; id?: unknown; name?: unknown };
  if (typeof kind !== 'string' || typeof id !== 'string' || !isWorldRefKind(kind)) return null;
  return rowVisual(ctx, { kind, id, name: typeof name === 'string' ? name : undefined });
}
