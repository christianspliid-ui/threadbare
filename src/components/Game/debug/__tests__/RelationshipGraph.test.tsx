// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelationshipGraph } from '../RelationshipGraph';
import { WorldGraph } from '../../../../engine/graph';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent-1', type: 'actor', name: 'Mira', properties: {} });
  g.addNode({ id: 'agent-2', type: 'actor', name: 'Kael', properties: {} });
  g.addNode({ id: 'agent-3', type: 'actor', name: 'Fen', properties: {} });
  g.addNode({ id: 'faction-1', type: 'actor', name: 'Merchant Guild', properties: { actorType: 'faction' } });
  return g;
}

describe('RelationshipGraph', () => {
  it('renders empty state when no relationships exist', () => {
    const g = makeGraph();
    render(<RelationshipGraph agentId="agent-1" graph={g} />);
    expect(screen.getByTestId('relationship-graph').textContent).toContain('No relationships');
  });

  it('shows outgoing relates_to edges with trust, sentiment, strength', () => {
    const g = makeGraph();
    g.addEdge({
      id: 'rel-1',
      source: 'agent-1',
      target: 'agent-2',
      type: 'relates_to',
      properties: { trust: 0.72, sentiment: 0.55, strength: 0.8, basis: 'trade' },
    });
    render(<RelationshipGraph agentId="agent-1" graph={g} />);
    const container = screen.getByTestId('relationship-graph');
    expect(container.textContent).toContain('Kael');
    expect(container.textContent).toContain('0.72');
    expect(container.textContent).toContain('0.55');
    expect(container.textContent).toContain('0.80');
    expect(container.textContent).toContain('trade');
  });

  it('classifies bonds correctly (strong_positive, hostile, neutral, stranger)', () => {
    const g = makeGraph();
    // Strong positive: trust >= 0.5, strength > 0.1
    g.addEdge({
      id: 'rel-strong',
      source: 'agent-1',
      target: 'agent-2',
      type: 'relates_to',
      properties: { trust: 0.7, sentiment: 0.5, strength: 0.8, basis: 'alliance' },
    });
    // Hostile: trust <= -0.3, strength > 0.1
    g.addEdge({
      id: 'rel-hostile',
      source: 'agent-1',
      target: 'agent-3',
      type: 'relates_to',
      properties: { trust: -0.5, sentiment: -0.4, strength: 0.6, basis: 'rivalry' },
    });
    render(<RelationshipGraph agentId="agent-1" graph={g} />);
    const classifications = screen.getAllByTestId('bond-classification');
    const labels = classifications.map((el) => el.textContent);
    expect(labels).toContain('Strong Positive');
    expect(labels).toContain('Hostile');
  });

  it('shows incoming edges when no outgoing edge exists for that agent', () => {
    const g = makeGraph();
    g.addEdge({
      id: 'rel-in',
      source: 'agent-2',
      target: 'agent-1',
      type: 'relates_to',
      properties: { trust: 0.3, sentiment: 0.2, strength: 0.4, basis: 'acquaintance' },
    });
    render(<RelationshipGraph agentId="agent-1" graph={g} />);
    expect(screen.getByTestId('relationship-graph').textContent).toContain('Kael');
  });

  it('shows faction memberships with rank title', () => {
    const g = makeGraph();
    g.addEdge({
      id: 'mem-1',
      source: 'agent-1',
      target: 'faction-1',
      type: 'member_of',
      properties: { rank: 0.7 },
    });
    render(<RelationshipGraph agentId="agent-1" graph={g} />);
    const container = screen.getByTestId('relationship-graph');
    expect(container.textContent).toContain('Merchant Guild');
    expect(container.textContent).toContain('Officer');
  });

  it('does not duplicate edges when both directions exist', () => {
    const g = makeGraph();
    g.addEdge({
      id: 'rel-out',
      source: 'agent-1',
      target: 'agent-2',
      type: 'relates_to',
      properties: { trust: 0.5, sentiment: 0.3, strength: 0.6, basis: 'trade' },
    });
    g.addEdge({
      id: 'rel-in',
      source: 'agent-2',
      target: 'agent-1',
      type: 'relates_to',
      properties: { trust: 0.4, sentiment: 0.2, strength: 0.5, basis: 'trade' },
    });
    render(<RelationshipGraph agentId="agent-1" graph={g} />);
    const entries = screen.getAllByTestId('relationship-entry');
    // Should only show one entry for Kael (outgoing takes priority)
    expect(entries.length).toBe(1);
  });
});
