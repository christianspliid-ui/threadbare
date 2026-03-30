// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BondOverlay } from '../BondOverlay';
import { WorldGraph } from '../../../../engine/graph';

function makeGraphWithBonds(): WorldGraph {
  const g = new WorldGraph();
  // Agents
  g.addNode({ id: 'a1', type: 'actor', name: 'Mira', properties: {} });
  g.addNode({ id: 'a2', type: 'actor', name: 'Kael', properties: { movementTargetCol: 3, movementTargetRow: 4 } });
  // Locations
  g.addNode({ id: 'loc1', type: 'location', name: 'Market', properties: { hexCol: 1, hexRow: 2 } });
  g.addNode({ id: 'loc2', type: 'location', name: 'Fort', properties: { hexCol: 5, hexRow: 3 } });
  // Place agents at locations
  g.addEdge({ id: 'at-1', source: 'a1', target: 'loc1', type: 'located_at', properties: {} });
  g.addEdge({ id: 'at-2', source: 'a2', target: 'loc2', type: 'located_at', properties: {} });
  // Bond between agents
  g.addEdge({
    id: 'bond-1',
    source: 'a1',
    target: 'a2',
    type: 'relates_to',
    properties: { trust: 0.6, sentiment: 0.4, strength: 0.7, basis: 'trade' },
  });
  return g;
}

// Helper to query SVG elements inside the overlay
function queryOverlay(container: HTMLElement) {
  return {
    overlay: container.querySelector('[data-testid="bond-overlay"]'),
    bondLines: container.querySelectorAll('[data-testid="bond-line"]'),
    vectors: container.querySelectorAll('[data-testid="decision-vector"]'),
  };
}

describe('BondOverlay', () => {
  it('renders bond lines between agents with relates_to edges', () => {
    const g = makeGraphWithBonds();
    const { container } = render(
      <svg>
        <BondOverlay
          graph={g}
          hexSize={30}
          visibleAgents={['a1', 'a2']}
          showBonds={true}
          showDecisionVectors={false}
        />
      </svg>,
    );
    const { bondLines } = queryOverlay(container);
    expect(bondLines.length).toBe(1);
    // Green color for positive trust
    expect(bondLines[0].getAttribute('stroke')).toBe('#10b981');
  });

  it('does not render bond lines when showBonds is false', () => {
    const g = makeGraphWithBonds();
    const { container } = render(
      <svg>
        <BondOverlay
          graph={g}
          hexSize={30}
          visibleAgents={['a1', 'a2']}
          showBonds={false}
          showDecisionVectors={false}
        />
      </svg>,
    );
    // No overlay rendered at all when both toggles are off and no data
    const { overlay } = queryOverlay(container);
    expect(overlay).toBeNull();
  });

  it('renders decision vectors for agents with movement targets', () => {
    const g = makeGraphWithBonds();
    const { container } = render(
      <svg>
        <BondOverlay
          graph={g}
          hexSize={30}
          visibleAgents={['a1', 'a2']}
          showBonds={false}
          showDecisionVectors={true}
        />
      </svg>,
    );
    const { vectors } = queryOverlay(container);
    // Only a2 has movementTargetCol/Row
    expect(vectors.length).toBe(1);
  });

  it('only shows bonds between visible agents', () => {
    const g = makeGraphWithBonds();
    const { container } = render(
      <svg>
        <BondOverlay
          graph={g}
          hexSize={30}
          visibleAgents={['a1']}
          showBonds={true}
          showDecisionVectors={false}
        />
      </svg>,
    );
    // a2 is not in visibleAgents, so bond line should not render
    const { overlay } = queryOverlay(container);
    expect(overlay).toBeNull();
  });
});
