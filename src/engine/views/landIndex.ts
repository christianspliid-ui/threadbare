/**
 * *In this land* — the land page's index of what the hex holds (THR-1822 § D9; THR-1827
 * call 17; THR-1876 § D7.3).
 *
 * Built from `hexContents` (one answer to "what is on this hex"). `People` and `Holder`
 * always render, with their empty lines; `Lair`, `Ruins`, `Halls`, `Resources` and
 * `Covenants` render only when present. Never folded by count (THR-1820).
 * Rows pass `knowledgeFilterFor(ctx, 'landIndex')` — OPEN today (THR-1822 § D5).
 */
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import { getLocationHolder } from '../realmHolder';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { getAbundanceLabel } from '../../types/resource';
import {
  IN_THIS_LAND_TITLE,
  LAND_INDEX_ALWAYS_ROWS,
  LAND_INDEX_EMPTY_LINES,
  LAND_INDEX_LABELS,
  LAND_INDEX_WHEN_PRESENT_ROWS,
  type LandIndexRowId,
} from '../../data/view-content';
import type { HexContentsVM } from './hexContents';
import type { RefRow } from './types';
import type { LandIndexRowVM, LandIndexVM, LinkRowVM } from './subjects/subjectTypes';
import { selectCovenantRows } from './subjects/godSheet';

function linkRow(row: RefRow, hexKey: string, fact = ''): LinkRowVM {
  return { ref: row.ref, name: row.name, fact, mapLocated: true, hexKey, staleFact: null };
}

function roleOf(graph: WorldGraph, id: string): string {
  const raw = (graph.getNode(id)?.properties.npcRole ?? graph.getNode(id)?.properties.role) as string | undefined;
  if (!raw) return '';
  const w = raw.replace(/[-_]+/g, ' ').trim();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** The rows of each kind, before the always / when-present rule. */
function rowsFor(id: LandIndexRowId, contents: HexContentsVM, state: GameState): LinkRowVM[] {
  const graph = state.graph;
  const key = contents.hexKey;
  switch (id) {
    case 'people':
      return contents.people.map(p => linkRow(p, key, roleOf(graph, p.ref.id)));
    case 'holder': {
      const seen = new Set<string>();
      const out: LinkRowVM[] = [];
      for (const loc of contents.locations) {
        const holder = getLocationHolder(graph, loc.ref.id);
        if (!holder || seen.has(holder.id)) continue;
        seen.add(holder.id);
        out.push(linkRow({ ref: { kind: 'faction', id: holder.id }, name: holder.name }, key, loc.name));
      }
      return out;
    }
    case 'lair':
      return contents.lairs.map(l => linkRow(l, key));
    case 'ruins':
      return contents.ruins.map(r => linkRow(r, key));
    case 'halls':
      return contents.halls.map(h => linkRow(h, key, h.hallAt));
    case 'resources':
      return contents.resources
        .filter(r => r.at)
        .map(r => linkRow(
          { ref: r.at!.ref, name: RESOURCE_DEFINITIONS[r.type]?.name ?? r.type.replace(/_/g, ' ') },
          key,
          getAbundanceLabel(r.quantity),
        ));
    case 'covenants': {
      const ids = new Set(contents.covenants.map(c => c.effectId));
      return selectCovenantRows(state)
        .filter(c => ids.has(c.effectId))
        .map(c => linkRow({ ref: { kind: 'hex', id: key, name: c.target }, name: c.title }, key, c.upkeepLine));
    }
  }
}

export function buildLandIndex(contents: HexContentsVM, state: GameState): LandIndexVM {
  const rows: LandIndexRowVM[] = [];
  for (const id of LAND_INDEX_ALWAYS_ROWS) {
    const r = rowsFor(id, contents, state);
    rows.push({ id, label: LAND_INDEX_LABELS[id], rows: r, emptyLine: r.length === 0 ? LAND_INDEX_EMPTY_LINES[id] : null });
  }
  for (const id of LAND_INDEX_WHEN_PRESENT_ROWS) {
    const r = rowsFor(id, contents, state);
    if (r.length > 0) rows.push({ id, label: LAND_INDEX_LABELS[id], rows: r, emptyLine: null });
  }
  return { hexKey: contents.hexKey, title: IN_THIS_LAND_TITLE, rows };
}
