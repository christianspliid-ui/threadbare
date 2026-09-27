/**
 * `buildItemWorldContext` — what the live world can tell the item generator (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Systems design
 * (`worldContext.ts`). The prototype faked its world; this reads the real one:
 *
 * - **the maker** — name, first name, pronoun (from `gender`);
 * - **the maker's faction** (`member_of`), with its definition's reach leanings;
 * - **the place** — the work's site if named, else where the maker stands, resolved to
 *   the settlement tier (`resolveToParentLocation`);
 * - **the maker's culture** (`belongs_to`).
 *
 * Every field optional: a missing faction, place or culture makes the lines that name it
 * ineligible, and nothing names a missing thing (fail-soft, NFP #4).
 *
 * **Not read yet: the past.** Dead notables with deeds, named disasters and monster hosts
 * dress the `found` origin, which has no live minting point until reward draws carry
 * generated items (THR-1626). A masterwork never needs a past, so the live context leaves
 * those tables empty and the review path uses `reviewWorld.ts`.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { getActorCultures, getAgentLocationId, getFactionMembershipEdges } from '../graphQueries';
import { resolveToParentLocation } from '../sublocationShape';
import { itemGenFactionFromDefinition } from './reviewWorld';
import type { ItemGenCulture, ItemGenFaction, ItemGenHistory, ItemGenMaker, ItemGenPlace, ItemWorldContext, Pronoun } from './types';
import type { GeneratedItemProvenance } from './types';
import { emptyItemGenHistory } from './generateItem';

// TODO(THR-1637): read dead notables, chronicle events and monster hosts for the found origin.

function pronounOf(node: GraphNode): Pronoun {
  const g = String(node.properties?.gender ?? '').toLowerCase();
  return g === 'female' ? 'she' : g === 'male' ? 'he' : 'they';
}

function placeOf(node: GraphNode | undefined): ItemGenPlace | null {
  if (!node || !node.name) return null;
  const p = node.properties ?? {};
  const terrain = (p.terrain ?? p.biome ?? p.terrainType) as string | undefined;
  return { id: node.id, name: node.name, ...(terrain ? { terrain } : {}), spheres: {} };
}

function cultureOf(node: GraphNode): ItemGenCulture {
  const name = node.name ?? 'the old people';
  const adj = name.replace(/^the\s+/i, '');
  return { id: node.id, name: /^the\s/i.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name, adj, spheres: {} };
}

function factionOf(node: GraphNode): ItemGenFaction {
  const defId = (node.properties?.factionDefId as string | undefined) ?? null;
  return itemGenFactionFromDefinition(node.id, defId, node.name);
}

/** The live world as the generator sees it, around one maker (and optionally a named site). */
export function buildItemWorldContext(graph: WorldGraph, opts: { makerId?: string | null; placeId?: string | null }): ItemWorldContext {
  const factions: Record<string, ItemGenFaction> = {};
  const places: Record<string, ItemGenPlace> = {};
  const cultures: Record<string, ItemGenCulture> = {};
  let maker: ItemGenMaker | null = null;

  const makerNode = opts.makerId ? graph.getNode(opts.makerId) : undefined;
  if (makerNode) {
    const factionEdge = getFactionMembershipEdges(graph, makerNode.id)[0];
    const factionNode = factionEdge ? graph.getNode(factionEdge.target) : undefined;
    if (factionNode) factions[factionNode.id] = factionOf(factionNode);

    const siteId = opts.placeId ?? getAgentLocationId(graph, makerNode.id) ?? null;
    const place = placeOf(resolveToParentLocation(graph, siteId ? graph.getNode(siteId) : undefined));
    if (place) places[place.id] = place;

    const cultureNode = getActorCultures(graph, makerNode.id)[0]?.culture;
    if (cultureNode?.name) cultures[cultureNode.id] = cultureOf(cultureNode);

    const name = makerNode.name ?? 'a maker';
    maker = {
      id: makerNode.id, name, first: name.split(/\s+/)[0] ?? name, pronoun: pronounOf(makerNode),
      factionId: factionNode?.id ?? null, placeId: place?.id ?? null, cultureId: cultureNode?.name ? cultureNode.id : null,
    };
  }
  return { maker, factions, places, cultures, heroes: {}, events: {}, monsters: {} };
}

/** Every generated item already in this world. */
export function getGeneratedItemNodes(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('artifact').filter(n => n.properties?.origin === 'generated');
}

/** What this world has already made — the repeat decays read it, so a core's second appearance leans to its other idea. */
export function itemGenHistoryFromGraph(graph: WorldGraph): ItemGenHistory {
  const history = emptyItemGenHistory();
  for (const n of getGeneratedItemNodes(graph)) {
    const g = n.properties.generated as GeneratedItemProvenance | undefined;
    if (!g) continue;
    history.core[g.coreId] = (history.core[g.coreId] ?? 0) + 1;
    history.signature[`${g.coreId}:${g.signatureId}`] = (history.signature[`${g.coreId}:${g.signatureId}`] ?? 0) + 1;
    if (g.formId) history.form[g.formId] = (history.form[g.formId] ?? 0) + 1;
    if (n.name) history.names.add(n.name);
  }
  return history;
}
