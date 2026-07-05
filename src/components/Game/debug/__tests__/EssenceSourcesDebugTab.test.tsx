// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EssenceSourcesDebugTab } from '../EssenceSourcesDebugTab';
import { WorldGraph } from '../../../../engine/graph';
import type { EssenceSource } from '../../../../types/essenceSource';

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc.witness', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });

  // A controlled, typed, flowering source (contributes income).
  const shrine: EssenceSource = { kind: 'shrine', sphereAffinity: 'spirit', sanctity: 0.8, tier: 'flowering', discoveredBy: 'asc.witness' };
  g.addNode({ id: 'loc.shrine', type: 'location', name: 'Martyr Shrine', properties: { essenceSource: shrine } });
  g.addEdge({ id: 'ctrl-1', source: 'asc.witness', target: 'loc.shrine', type: 'controls', properties: {} });

  // A latent (undiscovered) source — present in the world, not yet controlled.
  const latent: EssenceSource = { kind: 'placeOfPower', sphereAffinity: 'force', sanctity: 0, tier: 'dormant' };
  g.addNode({ id: 'loc.peak', type: 'location', name: 'Storm Peak', properties: { essenceSource: latent } });

  return g;
}

describe('EssenceSourcesDebugTab', () => {
  it('renders empty state when there is no graph', () => {
    render(<EssenceSourcesDebugTab currentTick={0} />);
    expect(screen.getByText('No live game state.')).toBeTruthy();
  });

  it('renders empty state when the world has no essence sources', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc.witness', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
    render(<EssenceSourcesDebugTab graph={g} currentTick={0} />);
    expect(screen.getByText('No essence sources in the world yet.')).toBeTruthy();
  });

  it('lists controlled, discovered, and latent sources with counts', () => {
    const g = makeGraph();
    const { container } = render(<EssenceSourcesDebugTab graph={g} currentTick={0} />);
    const text = container.textContent ?? '';
    expect(text).toContain('2 sources');
    expect(text).toContain('1 controlled');
    expect(text).toContain('1 latent');
    expect(text).toContain('Martyr Shrine');
    expect(text).toContain('Storm Peak');
    expect(text).toContain('flowering');
    expect(text).toContain('Latent');
  });

  it('shows typed source income for the controlled flowering source', () => {
    const g = makeGraph();
    const { container } = render(<EssenceSourcesDebugTab graph={g} currentTick={0} />);
    const text = container.textContent ?? '';
    // shrine base 0.4 × flowering 2.0 = 0.80/tick to spirit.
    expect(text).toContain('spirit +0.80/tick');
  });

  it('reports no income when only latent (uncontrolled) sources exist', () => {
    const g = new WorldGraph();
    g.addNode({ id: 'asc.witness', type: 'actor', name: 'The Witness', properties: { actorType: 'ascendant' } });
    const latent: EssenceSource = { kind: 'placeOfPower', sphereAffinity: 'force', sanctity: 0, tier: 'dormant' };
    g.addNode({ id: 'loc.peak', type: 'location', name: 'Storm Peak', properties: { essenceSource: latent } });
    render(<EssenceSourcesDebugTab graph={g} currentTick={0} />);
    expect(screen.getByText(/none \(no built, controlled sources\)/)).toBeTruthy();
  });
});
