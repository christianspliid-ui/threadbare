/**
 * THR-2103 — art-led pass, slice 7: the picture a list row leads with.
 *
 * - `rowVisual` draws a picture for a person, place, faction, army or relic, and none for a
 *   hex, an area, an encounter, a journey or a receipt (the row keeps its kind icon).
 * - A mortal the god does not yet recognise draws the silhouette tier (Law 8); a known one
 *   draws their portrait. A node gone from the graph draws the designed tile (Law 4).
 * - A place on a known hex draws its landscape; without tiles, its glyph tile.
 * - The Chronicle's entry picture is the first linked name that has one (decision 2); the
 *   Ledger rows carry the mortal's face; Find's world rows carry pictures and its cards none.
 * - The heading table: every shape is a registry idea, and every `null` row is a heading
 *   decision 7 names.
 * - The harvest's echo pictures read the same helper (one path, Law 3).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  agentRowVisuals,
  hoverRowVisual,
  rowVisual,
  toastRowVisuals,
  type RowVisualContext,
} from '../rowVisual';
import { chronicleEntryVisuals } from '../ledgerRail';
import { echoVisual } from '../ceremonyVisuals';
import { LIST_HEADING_ICONS, LIST_NO_IDEA_HEADINGS, type ListHeadingId } from '../../../data/view-content';
import { ICON_REGISTRY } from '../../../data/icons/iconRegistry';
import type { FamiliarityMap } from '../../../types/familiarity';
import type { HexTile } from '../../../types';
import type { ChronicleEntry } from '../../../types/narrative';
import type { GameState } from '../../../types/gameState';
import type { EchoDefinition } from '../../../types/echo';

const PORTRAIT = '/portraits/ilsa.png';

function world(familiar: boolean): RowVisualContext {
  const graph = new WorldGraph();
  graph.addNode({ id: 'ilsa', type: 'actor', name: 'Ilsa Venn', properties: { actorType: 'individual', portraitAssetPath: PORTRAIT } });
  graph.addNode({ id: 'harrow', type: 'location', name: 'Harrow', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 3 } });
  graph.addNode({ id: 'compact', type: 'actor', name: 'The Iron Compact', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'crown', type: 'artifact', name: 'The Thorn Crown', properties: { subcategory: 'relics_talismans' } });
  const familiarityMap = (familiar ? new Map([['ilsa', 1]]) : new Map()) as unknown as FamiliarityMap;
  return { graph, familiarityMap };
}

const tiles = [{ coord: { col: 2, row: 3 }, terrain: 'plains' }] as unknown as HexTile[];

describe('THR-2103 rowVisual (S7.1)', () => {
  it('a mortal the god knows shows their face; a stranger shows the silhouette tier (Law 8)', () => {
    const known = rowVisual(world(true), { kind: 'agent', id: 'ilsa' });
    expect(known?.tier).toBe('art');
    expect(known?.src).toBe(PORTRAIT);
    expect(known?.alt).toBe('Ilsa Venn');
    const stranger = rowVisual(world(false), { kind: 'agent', id: 'ilsa' });
    expect(stranger?.tier).toBe('fallback');
    expect(stranger?.src).toBeUndefined();
  });

  it('places, factions, armies and relics each draw a picture', () => {
    const ctx = world(true);
    expect(rowVisual(ctx, { kind: 'location', id: 'harrow' })?.kind).toBe('location');
    expect(rowVisual(ctx, { kind: 'faction', id: 'compact' })?.kind).toBe('faction');
    expect(rowVisual(ctx, { kind: 'artifact', id: 'crown' })?.kind).toBe('artifact');
    expect(rowVisual(ctx, { kind: 'army', id: 'army-1', name: 'The Ash Host' })?.kind).toBe('army');
  });

  it('a place draws its landscape on a known hex, else its glyph tile (Law 4)', () => {
    expect(rowVisual({ ...world(true), tiles }, { kind: 'location', id: 'harrow' })?.tier).toBe('art');
    expect(rowVisual(world(true), { kind: 'location', id: 'harrow' })?.tier).toBe('fallback');
  });

  it('a hex, an area, an encounter, a journey or a receipt draws no picture', () => {
    const ctx = world(true);
    for (const kind of ['hex', 'area', 'encounter', 'journey', 'receipt'] as const) {
      expect(rowVisual(ctx, { kind, id: 'x' })).toBeNull();
    }
  });

  it('a node gone from the graph draws the designed tile under the row name, never throws', () => {
    const v = rowVisual(world(true), { kind: 'agent', id: 'gone', name: 'Old Tam' });
    expect(v?.tier).toBe('fallback');
    expect(v?.alt).toBe('Old Tam');
    expect(rowVisual({ graph: null }, { kind: 'location', id: 'gone' })?.tier).toBe('fallback');
  });

  it('the digest, toast and hover helpers resolve through the same gate', () => {
    const ctx = world(false);
    const digest = agentRowVisuals(ctx, [{ agentId: 'ilsa' }, { agentId: 'ilsa' }]);
    expect(Object.keys(digest)).toEqual(['ilsa']);
    expect(digest.ilsa?.tier).toBe('fallback');
    const toasts = toastRowVisuals(world(true), [
      { id: 't1', navigationTarget: { kind: 'agent', agentId: 'ilsa' } },
      { id: 't2', navigationTarget: { kind: 'hex', col: 1, row: 1 } },
      { id: 't3' },
    ]);
    expect(toasts.t1?.src).toBe(PORTRAIT);
    expect('t2' in toasts).toBe(false);
    expect('t3' in toasts).toBe(false);
    expect(hoverRowVisual(world(true), { kind: 'faction', id: 'compact' })?.kind).toBe('faction');
    expect(hoverRowVisual(world(true), { kind: 'action_template', id: 'x' })).toBeNull();
  });
});

describe('THR-2103 Chronicle entry pictures (decision 2)', () => {
  const entry = (id: string, segments?: ChronicleEntry['segments']): ChronicleEntry =>
    ({ id, title: 't', tick: 1, prose: 'p', segments } as unknown as ChronicleEntry);

  it('takes the first linked name that has a picture, and skips entries with none', () => {
    const visuals = chronicleEntryVisuals([
      entry('e1', [
        { text: 'At ' },
        { text: 'the hills', ref: { kind: 'hex', id: '1,1' } },
        { text: ' ' },
        { text: 'Ilsa Venn', ref: { kind: 'agent', id: 'ilsa' } },
        { text: 'Harrow', ref: { kind: 'location', id: 'harrow' } },
      ]),
      entry('e2'),
      entry('e3', [{ text: 'plain words' }]),
    ], world(true));
    expect(visuals.e1?.alt).toBe('Ilsa Venn');
    expect(visuals.e1?.src).toBe(PORTRAIT);
    expect('e2' in visuals).toBe(false);
    expect('e3' in visuals).toBe(false);
  });
});

describe('THR-2103 heading shapes (S7.3, decision 7)', () => {
  it('every shape is a registry idea', () => {
    for (const [id, icon] of Object.entries(LIST_HEADING_ICONS)) {
      if (icon === null) continue;
      expect(ICON_REGISTRY[icon], `${id} → ${icon}`).toBeTruthy();
    }
  });

  it('every null row is a heading decision 7 names, and every named heading is null', () => {
    const nulls = (Object.keys(LIST_HEADING_ICONS) as ListHeadingId[]).filter(id => LIST_HEADING_ICONS[id] === null);
    expect([...nulls].sort()).toEqual([...LIST_NO_IDEA_HEADINGS].sort());
    expect([...LIST_NO_IDEA_HEADINGS].sort()).toEqual([
      'beforeYouWoke',
      'digestOther',
      'doomSubheadings',
      'findPowers',
      'findRecent',
      'mandateSubheadings',
      'notablesLocal',
      'notablesRulers',
      'recentOmens',
      'threadsSources',
    ]);
  });

  it('the titles the Done-when reads carry their shapes', () => {
    expect(LIST_HEADING_ICONS.chronicle).toBe('chronicle');
    expect(LIST_HEADING_ICONS.notablesTitle).toBe('notables');
    expect(LIST_HEADING_ICONS.threadsTitle).toBe('threads');
  });
});

describe('THR-2103 one path (Law 3)', () => {
  it('a harvest legacy echo and a list row agree on a mortal the god does not know', () => {
    const ctx = world(false);
    const state = { graph: ctx.graph, familiarityMap: ctx.familiarityMap, tiles: [] } as unknown as GameState;
    const def = { id: 'e1', echoType: 'legacy', originNodeId: 'ilsa', name: 'Ilsa Venn' } as EchoDefinition;
    expect(echoVisual(state, def)?.tier).toBe(rowVisual(ctx, { kind: 'agent', id: 'ilsa' })?.tier);
  });
});
