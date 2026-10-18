/**
 * The Inspector lab's subjects (THR-1876 § D12): one real example per page kind, picked
 * from the seeded world by a predicate, plus a few extra rows that make the plan's chain
 * (city → Place → person → faction) walkable in the lab.
 *
 * `INSPECTOR_LAB_SUBJECTS` is a `Record` over every page kind and `'missing'`, so a page
 * kind without a pick is a type error — and `labSubjects.test.ts` fails by name.
 */
import type { GameState } from '../../../../types/gameState';
import type { GraphNode } from '../../../../types/graph';
import type { PageLayoutKind } from '../../../../types/detailPage';
import type { InspectorSubject } from '../../../../engine/views/subjects/subjectPage';
import { resolveToParentLocation, isPlaceNode } from '../../../../engine/sublocationShape';
import { isArmyGroupNode } from '../../../../engine/groupShape';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../data/unified-action-templates';

export interface LabPick {
  /** The row's label in the lab. */
  label: string;
  pick: (state: GameState) => InspectorSubject | null;
  /** The labelled fallback when the world holds no example (Law 4 — never a blank cell). */
  fallback: string;
}

function theFirst(state: GameState): GraphNode | undefined {
  const graph = state.graph;
  const edge = graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.properties.courtPosition === 'the_first')
    ?? graph.getOutgoingEdges(state.ascendantId, 'thread')[0];
  return edge ? graph.getNode(edge.target) : undefined;
}

function firstPlace(state: GameState): GraphNode | undefined {
  const first = theFirst(state);
  const at = first ? state.graph.getOutgoingEdges(first.id, 'located_at')[0] : undefined;
  return at ? state.graph.getNode(at.target) : undefined;
}

function firstCity(state: GameState): GraphNode | undefined {
  const place = firstPlace(state);
  return place ? resolveToParentLocation(state.graph, place) : undefined;
}

function firstHex(state: GameState): { col: number; row: number } | null {
  const city = firstCity(state);
  const col = city?.properties.hexCol as number | undefined;
  const row = city?.properties.hexRow as number | undefined;
  return col != null && row != null ? { col, row } : null;
}

function peopleAt(state: GameState, placeId: string): number {
  return state.graph.getIncomingEdges(placeId, 'located_at').filter(e => state.graph.getNode(e.source)?.properties.actorType === 'individual').length;
}

export const INSPECTOR_LAB_SUBJECTS: Readonly<Record<PageLayoutKind | 'missing', LabPick>> = {
  actor: {
    label: 'Person — your First',
    pick: s => { const n = theFirst(s); return n ? { kind: 'agent', id: n.id, name: n.name } : null; },
    fallback: 'No First in this world yet',
  },
  place: {
    label: "Location — your First's city",
    pick: s => { const n = firstCity(s); return n ? { kind: 'location', id: n.id, name: n.name } : null; },
    fallback: 'No settlement in this world yet',
  },
  land: {
    label: "Land — your First's hex",
    pick: s => { const h = firstHex(s); return h ? { kind: 'hex', id: `${h.col},${h.row}` } : null; },
    fallback: 'No land in this world yet',
  },
  faction: {
    label: "Faction — your First's",
    pick: s => {
      const first = theFirst(s);
      const edge = first ? s.graph.getOutgoingEdges(first.id, 'member_of').find(e => s.graph.getNode(e.target)?.properties.actorType === 'faction') : undefined;
      const f = edge ? s.graph.getNode(edge.target) : s.graph.getNodesByType('actor').find(n => n.properties.actorType === 'faction');
      return f ? { kind: 'faction', id: f.id, name: f.name } : null;
    },
    fallback: 'No faction in this world yet',
  },
  group: {
    label: 'Army',
    pick: s => { const a = s.graph.getNodesByType('actor').find(isArmyGroupNode); return a ? { kind: 'army', id: a.id, name: a.name } : null; },
    fallback: 'No army in this world yet',
  },
  item: {
    label: 'Artifact — the legendary one, else any',
    pick: s => {
      const a = s.graph.getNodesByType('artifact_legendary')[0] ?? s.graph.getNodesByType('artifact')[0];
      return a ? { kind: 'artifact', id: a.id, name: a.name } : null;
    },
    fallback: 'No artifact in this world yet',
  },
  content: {
    label: 'Content — an action card',
    pick: () => { const t = UNIFIED_ACTION_TEMPLATES[0]; return t ? { kind: 'action_template', id: t.id, name: t.name } : null; },
    fallback: 'No action cards are written yet',
  },
  record: {
    label: 'Record — the latest chapter or receipt',
    pick: s => {
      const chapter = [...(s.chapterArchive ?? [])].sort((a, b) => b.resolvedTick - a.resolvedTick)[0];
      if (chapter) return { kind: 'encounter', id: chapter.actionId, name: chapter.templateName };
      const receipt = [...(s.playerActionReceipts ?? [])].sort((a, b) => b.resolvedTick - a.resolvedTick)[0];
      return receipt ? { kind: 'receipt', id: receipt.id, name: receipt.templateName } : null;
    },
    fallback: 'Nothing has happened yet',
  },
  event: {
    label: 'Record — a graph event',
    pick: s => {
      const e = [...s.graph.getNodesByType('event')].sort((a, b) => ((b.properties.tick as number) ?? 0) - ((a.properties.tick as number) ?? 0))[0];
      return e ? { kind: 'event-node', id: e.id, name: e.name } : null;
    },
    fallback: 'No event in this world yet',
  },
  god: {
    label: "The god's own page",
    pick: s => ({ kind: 'agent', id: s.ascendantId }),
    fallback: 'No god in this world',
  },
  missing: {
    label: 'Missing — a subject no longer in the world',
    pick: () => ({ kind: 'agent', id: 'inspector-lab-no-such-subject' }),
    fallback: '',
  },
};

/** Extra rows (same kinds, other examples) that make the chain walkable in the lab. */
export const INSPECTOR_LAB_EXTRA: readonly LabPick[] = [
  {
    label: "Place — inside your First's city, with people in it",
    pick: s => {
      const city = firstCity(s);
      const places = city ? s.graph.getOutgoingEdges(city.id, 'contains').map(e => s.graph.getNode(e.target)).filter((n): n is GraphNode => !!n && isPlaceNode(n) && n.properties.hidden !== true) : [];
      const best = places.sort((a, b) => peopleAt(s, b.id) - peopleAt(s, a.id))[0];
      return best ? { kind: 'sublocation', id: best.id, name: best.name } : null;
    },
    fallback: 'No Place inside the city',
  },
  {
    label: "Area — your First's",
    pick: s => {
      const h = firstHex(s);
      const tile = h ? s.tiles.find(t => t.coord.col === h.col && t.coord.row === h.row) : undefined;
      const area = tile?.regionId ? s.graph.getNode(tile.regionId) : undefined;
      return area ? { kind: 'area', id: area.id, name: area.name } : null;
    },
    fallback: 'No Area in this world',
  },
  {
    // THR-1910 (S2b): the attachment card's effect, duration, trigger and source rows.
    label: 'Attachment — a condition template, one with triggers when there is one',
    pick: s => {
      const conditions = s.graph.getNodesByType('trait').filter(n => n.properties.subcategory === 'condition');
      const withTriggers = conditions.find(n => Array.isArray(n.properties.effects) && (n.properties.effects as { type?: string }[]).some(e => e?.type === 'action_trigger'));
      const t = withTriggers ?? conditions[0];
      return t ? { kind: 'attachment', id: t.id, name: t.name } : null;
    },
    fallback: 'No condition template in this world',
  },
];
