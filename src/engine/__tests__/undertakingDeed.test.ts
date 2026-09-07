/**
 * The deed by verb and object (THR-1434) — named once at the producer, carried on
 * the history entry and the completion event, rendered by the ledger.
 *
 * Two arms: the namer against a bare graph (every branch — a made thing, a thing
 * acted on, a kind with no page), and the producer in the real pipeline (an instant
 * cell started through the review lever writes its history entry with the deed).
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { describeDeed, worldRefKindOf } from '../undertakingDeed';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { startUndertakingForReview } from '../undertakingReviewLevers';
import { UNDERTAKING_CELL_TEMPLATES } from '../../data/undertaking-cells';
import type { StrategicActionCandidate } from '../../types/strategicAction';

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'ind_kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  g.addNode({ id: 'fac_iron', type: 'actor', name: 'the Iron Brotherhood', properties: { actorType: 'faction' } });
  g.addNode({ id: 'loc_dunmar', type: 'location', name: 'Dunmar', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  g.addNode({ id: 'loc_dunmar_mill', type: 'location', name: 'the Old Mill', properties: { locationSubtype: 'mill', parentLocationId: 'loc_dunmar' } });
  g.addNode({ id: 'route_salt', type: 'location', name: 'the Saltway', properties: { locationSubtype: 'trade_route', hexCol: 2, hexRow: 2 } });
  return g;
}

const cand = (templateId: string, extra: Partial<StrategicActionCandidate> = {}) =>
  ({ templateId, actorId: 'ind_kael', ...extra }) as unknown as StrategicActionCandidate;

describe('describeDeed — the namer', () => {
  it('a made thing is the deed\'s object, linked as a place: "Founded the Saltway"', () => {
    const g = graph();
    const deed = describeDeed(g, cand('cell.create.route', { objectTypeId: 'route' }), undefined, 'route_salt');
    expect(deed).toMatchObject({ verb: 'create', word: 'Founded', objectName: 'the Saltway', phrase: 'Founded the Saltway' });
    expect(deed!.objectRef).toEqual({ kind: 'location', id: 'route_salt', name: 'the Saltway' });
  });

  it('a thing acted on is the handle\'s object; a room links as a sublocation', () => {
    const g = graph();
    const deed = describeDeed(g, cand('cell.control_seize.place', { objectTypeId: 'place', objectHandle: { kind: 'node', nodeId: 'loc_dunmar_mill' } }), undefined, undefined);
    expect(deed?.phrase).toBe('Seized the Old Mill');
    expect(deed?.objectRef?.kind).toBe('sublocation');
  });

  it('a kind with no page is named, never linked; the plot slays', () => {
    const g = graph();
    const deed = describeDeed(g, cand('cell.destroy.mortal', { objectTypeId: 'mortal', objectHandle: { kind: 'node', nodeId: 'ind_kael' } }), undefined, undefined);
    expect(deed?.phrase).toBe('Slew Kael');
    // A person has a page (the sheet) — linked as an agent.
    expect(deed?.objectRef?.kind).toBe('agent');
    expect(worldRefKindOf(g.getNode('fac_iron'))).toBe('faction');
    expect(worldRefKindOf(undefined)).toBeNull();
  });

  it('a template-model completion has no deed', () => {
    expect(describeDeed(graph(), cand('strategic_build_warehouse'), undefined, undefined)).toBeUndefined();
  });
});

describe('the producer — an instant cell through the real pipeline', () => {
  it('writes its history entry with the deed and the deed carries the cell\'s verb', () => {
    const archetype = generateArchetypes(4, 42)[0];
    const preset = MAP_SIZE_PRESETS.small;
    const { state } = initializeGameState(archetype, 'deed', createBalancedCosmology(), 42, preset.cols, preset.rows);
    const instant = UNDERTAKING_CELL_TEMPLATES.find(t => t.executionMode === 'instant' && t.cellVariant === 'observe' && t.objectTypeId === 'area');
    expect(instant, 'no instant observe cell — the fixture assumption is stale').toBeDefined();
    const started = startUndertakingForReview(state, state.graph, 'ind_0', instant!.id);
    expect(started.ok, started.message).toBe(true);
    const entry = started.strategicState?.history.find(h => h.actorId === 'ind_0' && h.templateId === instant!.id);
    expect(entry, 'no history entry for the instant cell').toBeDefined();
    expect(entry!.deed).toBeDefined();
    expect(entry!.deed!.verb).toBe('observe');
    expect(entry!.deed!.phrase.startsWith(entry!.deed!.word)).toBe(true);
    expect(entry!.deed!.phrase).not.toMatch(/cell\./);
  });
});
