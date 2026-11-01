/**
 * THR-2100 — the art-led Stage (plan `Docs/plans/2026-11-01-thr-2100-art-led-stage.md`).
 *
 * S4.1: one face per moment, `StageVM.subjectVisual`, knowledge-gated like the mortal's page.
 * S4.2: the label-icon table names only registry shapes, and every empty row waits on THR-2104.
 * S4.3: a relic gained or lost tiles with its painting and routes to the relic's page.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { buildViewContext } from '../viewContext';
import { buildStageView, fallbackStageView, type StageMomentInput } from '../stage/stageView';
import { buildChipIconResolver } from '../stage/chipCollaborators';
import { FAMILIARITY_THRESHOLDS } from '../../../types/familiarity';
import { getAttachmentArtUrl } from '../../../data/artifact-category-art';
import { STAGE_LABEL_ICONS, STAGE_NO_IDEA_LABELS, type StageLabelKey } from '../../../data/stage-content';
import { ICON_REGISTRY } from '../../../data/icons/iconRegistry';

const PORTRAIT = '/assets/portraits/test-maren.png';

function makeState(familiarity?: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'millbrook', type: 'location', name: 'Millbrook', properties: { hexCol: 13, hexRow: 9 } });
  graph.addNode({ id: 'maren', type: 'actor', name: 'Maren Ashfold', properties: { actorType: 'individual', portraitAssetPath: PORTRAIT } });
  graph.addEdge({ id: 'e1', type: 'located_at', source: 'maren', target: 'millbrook', properties: {} });
  const familiarityMap = new Map<string, number>(familiarity === undefined ? [] : [['maren', familiarity]]);
  return { graph, ascendantId: 'asc', tick: 5, tiles: [], familiarityMap } as unknown as GameState;
}

const beat = (o: Partial<StageMomentInput> = {}): StageMomentInput => ({ kind: 'story-beat', hasArt: false, hasCast: false, ...o });

describe('THR-2100 S4.1 — one face on the Stage', () => {
  it('a known mortal draws their portrait', () => {
    const vm = buildStageView(buildViewContext(null, makeState(FAMILIARITY_THRESHOLDS.recognised)), beat({ subjectAgentId: 'maren' }));
    expect(vm.subjectVisual?.tier).toBe('art');
    expect(vm.subjectVisual?.src).toBe(PORTRAIT);
    expect(vm.subjectVisual?.alt).toContain('Maren Ashfold');
  });

  it('a mortal below recognised draws the silhouette, as on their page (Law 8)', () => {
    const vm = buildStageView(buildViewContext(null, makeState(0)), beat({ subjectAgentId: 'maren' }));
    expect(vm.subjectVisual?.tier).toBe('fallback');
    expect(vm.subjectVisual?.src).toBeUndefined();
  });

  it('a familiarity rise between two openings re-resolves the face from silhouette to art', () => {
    const state = makeState(0);
    const first = buildStageView(buildViewContext(null, state), beat({ subjectAgentId: 'maren' }));
    (state.familiarityMap as Map<string, number>).set('maren', FAMILIARITY_THRESHOLDS.recognised);
    const second = buildStageView(buildViewContext(null, state), beat({ subjectAgentId: 'maren' }));
    expect(first.subjectVisual?.tier).toBe('fallback');
    expect(second.subjectVisual?.tier).toBe('art');
  });

  it('no subject, a missing node, or the fallback view: no face (fail-soft)', () => {
    const c = buildViewContext(null, makeState(1));
    expect(buildStageView(c, beat()).subjectVisual).toBeNull();
    expect(buildStageView(c, beat({ subjectAgentId: 'nobody' })).subjectVisual).toBeNull();
    expect(fallbackStageView(beat({ subjectAgentId: 'maren' })).subjectVisual).toBeNull();
  });
});

describe('THR-2100 S4.2 — Stage label icons', () => {
  it('every named shape is a registry idea', () => {
    for (const [key, name] of Object.entries(STAGE_LABEL_ICONS)) {
      if (name) expect(ICON_REGISTRY[name], key).toBeDefined();
    }
  });

  it('the empty rows are exactly the labels waiting on the icon pick (THR-2104)', () => {
    const empty = (Object.keys(STAGE_LABEL_ICONS) as StageLabelKey[]).filter(k => STAGE_LABEL_ICONS[k] === null);
    expect([...empty].sort()).toEqual([...STAGE_NO_IDEA_LABELS].sort());
  });
});

describe('THR-2100 S4.3 — a relic chip draws its painting', () => {
  function relicGraph(subcategory?: string): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({ id: 'reward_arms_bronze_spear', type: 'attachment', name: 'The Ember Blade', properties: subcategory ? { subcategory } : {} } as never);
    return graph;
  }

  it('an attachment with a plate tiles as art and routes to the attachment page', () => {
    const icon = buildChipIconResolver(relicGraph('arms'))({ text: 'The Ember Blade', entityId: 'reward_arms_bronze_spear', visualKind: 'attachment' } as never);
    expect(icon).toEqual({
      entityId: 'reward_arms_bronze_spear',
      kind: 'artifact',
      name: 'The Ember Blade',
      src: getAttachmentArtUrl('reward_arms_bronze_spear', 'arms'),
      routeKind: 'attachment',
    });
  });

  it('an attachment with no plate keeps no tile, as before', () => {
    expect(buildChipIconResolver(relicGraph())({ text: 'A trinket', entityId: 'reward_arms_bronze_spear', visualKind: 'attachment' } as never)).toBeUndefined();
  });
});
