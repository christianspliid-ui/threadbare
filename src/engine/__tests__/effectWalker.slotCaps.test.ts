import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { collectAttachmentEffects, hasEffectsFormat } from '../effects/effectWalker';
import type { AttachmentEffect, EffectRuntimeState } from '../../types/effects';

// ─── Test Helpers ────────────────────────────────────────────────

function makeGraph(): WorldGraph { return new WorldGraph(); }

function addAgent(graph: WorldGraph, id: string) {
  graph.addNode({ id, type: 'actor', name: `Agent ${id}`, properties: { actorType: 'individual' } });
}

let ec = 0;
function eid() { return `e.slotcap.${++ec}`; }

beforeEach(() => { ec = 0; });

// ─── Node-backed Effects ─────────────────────────────────────────

describe('collectAttachmentEffects — inactive suppression', () => {
  it('active node-backed possession contributes effects', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'sword', type: 'artifact', name: 'Sword', properties: {
      effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'sword', type: 'possesses', properties: {} });

    const effects = collectAttachmentEffects(g, 'a1');
    expect(effects).toHaveLength(1);
    expect(effects[0].attachmentId).toBe('sword');
    expect(effects[0].effect.type).toBe('passive');
  });

  it('active: false possession contributes nothing', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'sword', type: 'artifact', name: 'Sword', properties: {
      effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'sword', type: 'possesses', properties: { active: false } });

    const effects = collectAttachmentEffects(g, 'a1');
    expect(effects).toHaveLength(0);
  });

  it('mixed active/inactive — only active contribute', () => {
    const g = makeGraph();
    addAgent(g, 'a1');

    g.addNode({ id: 'sword1', type: 'artifact', name: 'Active Sword', properties: {
      effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'sword1', type: 'possesses', properties: {} });

    g.addNode({ id: 'sword2', type: 'artifact', name: 'Inactive Sword', properties: {
      effects: [{ type: 'passive', reach: 'iron', value: 0.2 }] satisfies AttachmentEffect[],
    }});
    g.addEdge({ id: eid(), source: 'a1', target: 'sword2', type: 'possesses', properties: { active: false } });

    const effects = collectAttachmentEffects(g, 'a1');
    expect(effects).toHaveLength(1);
    expect(effects[0].attachmentName).toBe('Active Sword');
  });
});

// ─── Agreement Edge Effects ──────────────────────────────────────

describe('collectAttachmentEffects — agreement edges', () => {
  it('agreement edge contributes effects from edge.properties.effects', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });

    const edgeId = eid();
    g.addEdge({
      id: edgeId,
      source: 'a1', target: 'a2', type: 'relates_to',
      properties: {
        agreement: true,
        agreementName: 'Test Pact',
        tier: 2,
        effects: [{ type: 'social_modifier', targetFilter: 'ally', cooperationBias: 0.1 }] satisfies AttachmentEffect[],
      },
    });

    const effects = collectAttachmentEffects(g, 'a1');
    expect(effects).toHaveLength(1);
    expect(effects[0].attachmentId).toBe(edgeId);
    expect(effects[0].attachmentName).toBe('Test Pact');
    expect(effects[0].attachmentTier).toBe(2);
    expect(effects[0].effect.type).toBe('social_modifier');
  });

  it('agreement runtime state is read from effectStates.get(edge.id)', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });

    const edgeId = eid();
    g.addEdge({
      id: edgeId,
      source: 'a1', target: 'a2', type: 'relates_to',
      properties: {
        agreement: true,
        effects: [{ type: 'duration', ticks: 10, reach: 'iron', value: 0.05, destroyOnExpiry: false }] satisfies AttachmentEffect[],
      },
    });

    const states = new Map<string, EffectRuntimeState>();
    states.set(edgeId, { ticksRemaining: 5 });

    const effects = collectAttachmentEffects(g, 'a1', states);
    expect(effects).toHaveLength(1);
    expect(effects[0].runtimeState?.ticksRemaining).toBe(5);
  });

  it('inactive agreement edge contributes nothing', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });

    g.addEdge({
      id: eid(),
      source: 'a1', target: 'a2', type: 'relates_to',
      properties: {
        agreement: true,
        active: false,
        effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
      },
    });

    const effects = collectAttachmentEffects(g, 'a1');
    expect(effects).toHaveLength(0);
  });

  it('non-agreement relates_to edges are ignored', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });

    g.addEdge({
      id: eid(),
      source: 'a1', target: 'a2', type: 'relates_to',
      properties: {
        // No 'agreement' flag
        effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
      },
    });

    const effects = collectAttachmentEffects(g, 'a1');
    expect(effects).toHaveLength(0);
  });
});

// ─── hasEffectsFormat ────────────────────────────────────────────

describe('hasEffectsFormat — agreement detection', () => {
  it('returns true for agreement edges with effects', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });
    g.addEdge({
      id: eid(),
      source: 'a1', target: 'a2', type: 'relates_to',
      properties: {
        agreement: true,
        effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
      },
    });

    expect(hasEffectsFormat(g, 'a1')).toBe(true);
  });

  it('returns false for inactive agreement edges', () => {
    const g = makeGraph();
    addAgent(g, 'a1');
    g.addNode({ id: 'a2', type: 'actor', name: 'Agent B', properties: { actorType: 'individual' } });
    g.addEdge({
      id: eid(),
      source: 'a1', target: 'a2', type: 'relates_to',
      properties: {
        agreement: true,
        active: false,
        effects: [{ type: 'passive', reach: 'iron', value: 0.1 }] satisfies AttachmentEffect[],
      },
    });

    expect(hasEffectsFormat(g, 'a1')).toBe(false);
  });
});
