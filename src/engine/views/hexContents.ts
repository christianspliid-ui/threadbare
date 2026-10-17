/**
 * hexContents — one hex → contents index for the whole map (THR-1822 § D6).
 *
 * Every surface that asks "what is on this hex" reads this one answer, so the
 * two rules that answer "who is here" today (HexDetailView's own scan and
 * `useHexZoomData`) collapse into one by construction once those surfaces move.
 *
 * Slice 1 fills people, Locations and Places:
 * - **People:** exactly `buildHexActorIndex`'s rule — living individuals, their
 *   `locationId` resolved to its Location via `resolveToParentLocation`.
 * - **Locations:** `getLocationNodes` (the outer tier), never a bare
 *   `getNodesByType('location')`, which returns both tiers.
 * - **Places:** each Location's `getVisibleSubLocations` (a hidden Place is absent).
 *
 * THR-1876 fills the land page's rows (plan § D16 S1):
 * - **Armies:** army groups (`isArmyGroupNode`) standing at a place on the hex.
 * - **Artifacts:** artifacts lying at a place on the hex (`located_at`; a held one travels with its holder).
 * - **Lairs:** Locations whose subtype is `lair`.
 * - **Ruins:** discovered ruins (`ruinMagnitude`, never an undiscovered one), plus — once
 *   the hex's ruins layer is revealed (`GameState.hexRevelation[key].ruins`) — its
 *   discovered sites: the non-hidden Places inside its Locations. HexChronicle computed
 *   that list but GameView never passed `hexRevelation`, so this is its first production read.
 * - **Halls:** factions with a `guild_hall` at a place on the hex.
 * - **Resources:** the hex's resources aggregated across its Locations (HexChronicle's rule).
 * - **Covenants:** the god's own active controls targeting the hex.
 */
import { buildHexActorIndex, hexKey as toHexKey, type HexKey } from '../hexActorIndex';
import { getLocationNodes, resolveToParentLocation } from '../sublocationShape';
import { getVisibleSubLocations } from '../viewLevel';
import { isArmyGroupNode } from '../groupShape';
import { readView, type ViewSelector } from './readView';
import { aggregateHexResources } from './subjects/landProse';
import type { RefRow } from './types';
import type { GraphNode } from '../../types/graph';

/** One resource the hex yields, from the Location that holds the most of it. */
export interface HexResourceVM {
  /** The resource type key — a surface words it (`RESOURCE_LABELS`), never prints it. */
  type: string;
  quantity: number;
  renewable: boolean;
  /** The Location the row links to. */
  at: RefRow | null;
}

/** One of the god's covenants on the hex. */
export interface HexCovenantVM {
  effectId: string;
  /** The covenant's ongoing prose (`narrativeTemplates.active`). */
  title: string;
}

export interface HexContentsVM {
  hexKey: HexKey;
  col: number;
  row: number;
  /** Living individuals on the hex, in actor order. */
  people: RefRow[];
  /** Locations (outer tier) on the hex. */
  locations: RefRow[];
  /** Visible Places (inner tier) inside those Locations. */
  places: RefRow[];
  armies: RefRow[];
  artifacts: RefRow[];
  lairs: RefRow[];
  ruins: RefRow[];
  /** Factions holding a hall here; `hallAt` names the place. */
  halls: Array<RefRow & { hallAt: string }>;
  resources: HexResourceVM[];
  covenants: HexCovenantVM[];
}

export type HexContentsIndexVM = Record<HexKey, HexContentsVM>;

function parseHexKey(key: HexKey): { col: number; row: number } | null {
  const [c, r] = key.split(',');
  const col = Number(c);
  const row = Number(r);
  return Number.isFinite(col) && Number.isFinite(row) ? { col, row } : null;
}

function emptyHex(key: HexKey): HexContentsVM {
  const at = parseHexKey(key) ?? { col: 0, row: 0 };
  return {
    hexKey: key, col: at.col, row: at.row, people: [], locations: [], places: [],
    armies: [], artifacts: [], lairs: [], ruins: [], halls: [], resources: [], covenants: [],
  };
}

function hexOfLocation(loc: GraphNode | undefined): HexKey | null {
  const col = loc?.properties.hexCol as number | undefined;
  const row = loc?.properties.hexRow as number | undefined;
  return col == null || row == null ? null : toHexKey(col, row);
}

/** The whole map's index. World-keyed: people move every tick. */
export const hexContentsIndexSelector: ViewSelector<void, HexContentsIndexVM> = {
  id: 'hexContentsIndex',
  invalidation: 'world',
  key: () => '',
  fallback: () => ({}),
  build(ctx) {
    const graph = ctx.graph;
    const index: HexContentsIndexVM = {};
    const at = (key: HexKey): HexContentsVM => (index[key] ??= emptyHex(key));
    const locationsByHex = new Map<HexKey, GraphNode[]>();

    for (const loc of getLocationNodes(graph)) {
      const key = hexOfLocation(loc);
      if (!key) continue;
      const hex = at(key);
      hex.locations.push({ ref: { kind: 'location', id: loc.id }, name: loc.name });
      (locationsByHex.get(key) ?? locationsByHex.set(key, []).get(key)!).push(loc);
      if (loc.properties.locationSubtype === 'lair') hex.lairs.push({ ref: { kind: 'location', id: loc.id }, name: loc.name });
      if (typeof loc.properties.ruinMagnitude === 'number' && loc.properties.discovered !== false) {
        hex.ruins.push({ ref: { kind: 'location', id: loc.id }, name: loc.name });
      }
      for (const place of getVisibleSubLocations(graph, loc.id)) {
        hex.places.push({ ref: { kind: 'sublocation', id: place.id }, name: place.name });
      }
    }

    for (const [key, ids] of buildHexActorIndex(graph).byHex) {
      const hex = at(key);
      for (const id of ids) {
        const n = graph.getNode(id);
        if (n) hex.people.push({ ref: { kind: 'agent', id }, name: n.name });
      }
    }

    // Armies, artifacts and halls: whatever stands `located_at` a place on the hex.
    const placeHex = (targetId: string): HexKey | null => hexOfLocation(resolveToParentLocation(graph, graph.getNode(targetId)));
    for (const actor of graph.getNodesByType('actor')) {
      if (isArmyGroupNode(actor)) {
        const e = graph.getOutgoingEdges(actor.id, 'located_at')[0];
        const key = e ? placeHex(e.target) : null;
        if (key) at(key).armies.push({ ref: { kind: 'army', id: actor.id }, name: actor.name });
      } else if (actor.properties.actorType === 'faction') {
        for (const e of graph.getOutgoingEdges(actor.id, 'located_at')) {
          if ((e.properties.role as string | undefined) !== 'guild_hall') continue;
          const key = placeHex(e.target);
          if (key) at(key).halls.push({ ref: { kind: 'faction', id: actor.id }, name: actor.name, hallAt: graph.getNode(e.target)?.name ?? '' });
        }
      }
    }
    for (const type of ['artifact', 'artifact_legendary'] as const) {
      for (const art of graph.getNodesByType(type)) {
        const e = graph.getOutgoingEdges(art.id, 'located_at')[0];
        const key = e ? placeHex(e.target) : null;
        if (key) at(key).artifacts.push({ ref: { kind: 'artifact', id: art.id }, name: art.name });
      }
    }

    // Resources (HexChronicle's aggregation) and revealed discovered sites.
    for (const [key, locs] of locationsByHex) {
      const hex = at(key);
      for (const [type, inst] of aggregateHexResources(locs)) {
        const holder = locs.find(l => (l.properties.resources as Record<string, { quantity: number }> | undefined)?.[type]?.quantity === inst.quantity);
        hex.resources.push({ type, quantity: inst.quantity, renewable: inst.renewable, at: holder ? { ref: { kind: 'location', id: holder.id }, name: holder.name } : null });
      }
      if (ctx.state.hexRevelation?.[key]?.ruins) {
        for (const place of hex.places) {
          if (!hex.ruins.some(r => r.ref.id === place.ref.id)) hex.ruins.push(place);
        }
      }
    }

    // The god's own covenants on each hex.
    for (const e of ctx.state.controlEffects ?? []) {
      if (!e.active || e.ownerId !== ctx.ascendantId) continue;
      if (e.targetHexCol == null || e.targetHexRow == null) continue;
      at(toHexKey(e.targetHexCol, e.targetHexRow)).covenants.push({ effectId: e.effectId, title: e.narrativeTemplates.active });
    }
    return index;
  },
};

export interface HexContentsArgs {
  /** `col,row` */
  hexKey: HexKey;
}

/** One hex's contents, read off the cached index. An empty hex is an empty row set. */
export const hexContentsSelector: ViewSelector<HexContentsArgs, HexContentsVM> = {
  id: 'hexContents',
  invalidation: 'world',
  key: (args) => args.hexKey,
  fallback: (args) => emptyHex(args.hexKey),
  build(ctx, { hexKey }) {
    const index = readView(ctx.runtime, ctx.state, hexContentsIndexSelector, undefined, ctx.tiles);
    return index[hexKey] ?? emptyHex(hexKey);
  },
};
