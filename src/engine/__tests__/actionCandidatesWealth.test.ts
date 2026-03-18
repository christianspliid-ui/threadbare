import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateActionCandidates } from '../actionCandidates';
import { ACTION_TEMPLATES } from '../../data/action-template-content';

// ─── Economic AI tuning tests — minWealthRequired gate ─────────────────────

function makeGraph(actorWealth: number): { graph: WorldGraph; actorId: string; locationId: string } {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc.town',
    type: 'location',
    name: 'Ironhaven',
    properties: { locationSubtype: 'town' },
  });
  graph.addNode({
    id: 'actor.guild',
    type: 'actor',
    name: 'The Guild',
    properties: {
      actorType: 'faction',
      wealth: actorWealth,
      axiologicalProfile: {},
      domainCapabilities: {},
    },
  });
  graph.addEdge({
    id: 'edge.at',
    source: 'actor.guild',
    target: 'loc.town',
    type: 'located_at',
    properties: {},
  });
  return { graph, actorId: 'actor.guild', locationId: 'loc.town' };
}

describe('generateActionCandidates wealth gate', () => {
  it('includes non-wealth-gated actions regardless of wealth', () => {
    const { graph, actorId, locationId } = makeGraph(0);
    const candidates = generateActionCandidates(graph, actorId, locationId);
    // Actions without minWealthRequired should always appear
    const nonGated = ACTION_TEMPLATES.filter(t => t.minWealthRequired === undefined);
    for (const template of nonGated) {
      expect(candidates.some(c => c.templateId === template.id)).toBe(true);
    }
  });

  it('excludes wealth-gated actions when actor has insufficient wealth', () => {
    const { graph, actorId, locationId } = makeGraph(0);
    const candidates = generateActionCandidates(graph, actorId, locationId);
    const gated = ACTION_TEMPLATES.filter(t => t.minWealthRequired !== undefined);
    for (const template of gated) {
      expect(candidates.some(c => c.templateId === template.id)).toBe(false);
    }
  });

  it('includes wealth-gated actions when actor meets the threshold', () => {
    // Max possible wealth: all gates should be open
    const { graph, actorId, locationId } = makeGraph(100);
    const candidates = generateActionCandidates(graph, actorId, locationId);
    const gated = ACTION_TEMPLATES.filter(t => t.minWealthRequired !== undefined);
    for (const template of gated) {
      expect(candidates.some(c => c.templateId === template.id)).toBe(true);
    }
  });

  it('hire-mercenaries requires wealth >= 10', () => {
    const { graph, actorId, locationId } = makeGraph(9);
    const candidates9 = generateActionCandidates(graph, actorId, locationId);
    expect(candidates9.some(c => c.templateId === 'action.gold.hire-mercenaries')).toBe(false);

    // Bump wealth to 10
    graph.getNode('actor.guild')!.properties.wealth = 10;
    const candidates10 = generateActionCandidates(graph, actorId, locationId);
    expect(candidates10.some(c => c.templateId === 'action.gold.hire-mercenaries')).toBe(true);
  });

  it('commission-assassination requires wealth >= 15', () => {
    const { graph, actorId, locationId } = makeGraph(14);
    const candidates = generateActionCandidates(graph, actorId, locationId);
    expect(candidates.some(c => c.templateId === 'action.gold.commission-assassination')).toBe(false);

    graph.getNode('actor.guild')!.properties.wealth = 15;
    const candidates2 = generateActionCandidates(graph, actorId, locationId);
    expect(candidates2.some(c => c.templateId === 'action.gold.commission-assassination')).toBe(true);
  });

  it('establish-monopoly requires wealth >= 25', () => {
    const { graph, actorId, locationId } = makeGraph(24);
    const candidatesBefore = generateActionCandidates(graph, actorId, locationId);
    expect(candidatesBefore.some(c => c.templateId === 'action.gold.establish-monopoly')).toBe(false);

    graph.getNode('actor.guild')!.properties.wealth = 25;
    const candidatesAfter = generateActionCandidates(graph, actorId, locationId);
    expect(candidatesAfter.some(c => c.templateId === 'action.gold.establish-monopoly')).toBe(true);
  });

  it('actor without wealth property is treated as wealth 0', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc.town',
      type: 'location',
      name: 'Town',
      properties: { locationSubtype: 'town' },
    });
    graph.addNode({
      id: 'actor.poor',
      type: 'actor',
      name: 'Poor Actor',
      properties: {
        actorType: 'individual',
        // No wealth property
        axiologicalProfile: {},
      },
    });
    const candidates = generateActionCandidates(graph, 'actor.poor', 'loc.town');
    // Gated actions should not appear
    const gatedIds = ACTION_TEMPLATES
      .filter(t => t.minWealthRequired !== undefined)
      .map(t => t.id);
    for (const id of gatedIds) {
      expect(candidates.some(c => c.templateId === id)).toBe(false);
    }
  });
});

describe('action.gold.establish-monopoly template', () => {
  it('has correct properties', () => {
    const t = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly');
    expect(t).toBeDefined();
    expect(t!.reach).toBe('gold');
    expect(t!.crudType).toBe('create');
    expect(t!.minWealthRequired).toBe(25);
    expect(t!.difficulty).toBeGreaterThanOrEqual(0.5);
    expect(t!.difficulty).toBeLessThanOrEqual(1);
  });

  it('motivations include asceticism_extravagance and humility_pride', () => {
    const t = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly')!;
    expect(t.motivations).toContain('asceticism_extravagance');
    expect(t.motivations).toContain('humility_pride');
  });

  it('success ops update location and deduct wealth', () => {
    const t = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly')!;
    const locationUpdate = t.onSuccess.find(op => op.op === 'update_node' && (op as any).nodeId === '$location');
    expect(locationUpdate).toBeDefined();
    const actorUpdate = t.onSuccess.find(op => op.op === 'update_node' && (op as any).nodeId === '$actor');
    expect(actorUpdate).toBeDefined();
    expect((actorUpdate as any).changes.wealth).toBeLessThan(0); // costs wealth
  });

  it('failure ops damage reputation', () => {
    const t = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly')!;
    const actorUpdate = t.onFailure.find(op => op.op === 'update_node' && (op as any).nodeId === '$actor');
    expect((actorUpdate as any).changes.reputation).toBeLessThan(0);
  });

  it('narrative templates are non-empty prose strings', () => {
    const t = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly')!;
    expect(t.narrativeTemplates.initiation.length).toBeGreaterThan(10);
    expect(t.narrativeTemplates.success.length).toBeGreaterThan(10);
    expect(t.narrativeTemplates.failure.length).toBeGreaterThan(10);
  });

  it('wealth cost is -0.25 (WEALTH_MONOPOLY_COST on 0-100 scale)', () => {
    const t = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly')!;
    const actorUpdate = t.onSuccess.find(op => op.op === 'update_node' && (op as any).nodeId === '$actor') as any;
    expect(actorUpdate.changes.wealth).toBe(-0.25);
  });
});

describe('minWealthRequired constant contracts', () => {
  it('all 5 wealth-spending gold templates have minWealthRequired set', () => {
    const spendingIds = [
      'action.gold.hire-mercenaries',
      'action.gold.commission-assassination',
      'action.gold.buy-influence',
      'action.gold.fund-construction',
      'action.gold.establish-monopoly',
    ];
    for (const id of spendingIds) {
      const t = ACTION_TEMPLATES.find(t => t.id === id);
      expect(t, `${id} not found`).toBeDefined();
      expect(t!.minWealthRequired, `${id} missing minWealthRequired`).toBeDefined();
      expect(t!.minWealthRequired!).toBeGreaterThan(0);
    }
  });

  it('monopoly costs more than any other wealth-gated action', () => {
    const costs = ACTION_TEMPLATES
      .filter(t => t.minWealthRequired !== undefined)
      .map(t => t.minWealthRequired!);
    const maxCost = Math.max(...costs);
    const monopoly = ACTION_TEMPLATES.find(t => t.id === 'action.gold.establish-monopoly')!;
    expect(monopoly.minWealthRequired).toBe(maxCost);
  });
});
