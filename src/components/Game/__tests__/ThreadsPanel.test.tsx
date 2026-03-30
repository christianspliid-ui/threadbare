// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadsPanel } from '../ThreadsPanel';
import type { ThreadedNode } from '../../../engine/retinue';

// ─── Test fixtures ─────────────────────────────────────────────────

function makeAgent(overrides?: Partial<Extract<ThreadedNode, { category: 'agent' }>>): Extract<ThreadedNode, { category: 'agent' }> {
  return {
    id: 'agent-1',
    name: 'Seraphel',
    tier: 2,
    tierName: 'Devoted',
    category: 'agent',
    threadEdgeId: 'thread-a1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    locationId: 'loc-1',
    locationName: 'Thornwall',
    activityLabel: 'Idling',
    portraitUrl: null,
    primaryDomain: 'iron',
    factionName: 'Iron Brotherhood',
    ...overrides,
  };
}

function makeLocation(overrides?: Partial<Extract<ThreadedNode, { category: 'location' }>>): Extract<ThreadedNode, { category: 'location' }> {
  return {
    id: 'loc-1',
    name: 'Thornwall',
    tier: 1,
    tierName: 'Touched',
    category: 'location',
    threadEdgeId: 'thread-l1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    hexCol: 5,
    hexRow: 3,
    prosperityLabel: 'Stable',
    controllingFaction: 'Iron Brotherhood',
    ...overrides,
  };
}

function makeFaction(overrides?: Partial<Extract<ThreadedNode, { category: 'faction' }>>): Extract<ThreadedNode, { category: 'faction' }> {
  return {
    id: 'faction-1',
    name: 'Iron Brotherhood',
    tier: 2,
    tierName: 'Devoted',
    category: 'faction',
    threadEdgeId: 'thread-f1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    dominantSphere: 'force',
    territoryCount: 7,
    memberCount: 12,
    ...overrides,
  };
}

function makeArmy(overrides?: Partial<Extract<ThreadedNode, { category: 'army' }>>): Extract<ThreadedNode, { category: 'army' }> {
  return {
    id: 'army-1',
    name: 'Third Legion',
    tier: 1,
    tierName: 'Touched',
    category: 'army',
    threadEdgeId: 'thread-ar1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    size: 500,
    objective: 'March north',
    factionName: 'Iron Brotherhood',
    locationName: 'Thornwall',
    ...overrides,
  };
}

function makeArtifact(overrides?: Partial<Extract<ThreadedNode, { category: 'artifact' }>>): Extract<ThreadedNode, { category: 'artifact' }> {
  return {
    id: 'artifact-1',
    name: 'Sword of Dawn',
    tier: 3,
    tierName: 'Champion',
    category: 'artifact',
    threadEdgeId: 'thread-art1',
    attentionMode: 'auto_resolve',
    courtPosition: null,
    bearerName: 'Seraphel',
    locationName: null,
    ...overrides,
  };
}

const noop = () => {};

// ─── Tests ────────────────────────────────────────────────────────

describe('ThreadsPanel', () => {
  it('renders "No Threads" empty state when threadedNodes is empty', () => {
    render(
      <ThreadsPanel
        threadedNodes={[]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('No Threads')).toBeTruthy();
    expect(screen.getByText(/threads of fate lie still/i)).toBeTruthy();
  });

  it('renders Agents section with correct count badge', () => {
    const nodes: ThreadedNode[] = [makeAgent(), makeAgent({ id: 'agent-2', name: 'Vardus' })];
    render(
      <ThreadsPanel
        threadedNodes={nodes}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // SectionHeading renders "Agents (2)"
    expect(screen.getByText('Agents (2)')).toBeTruthy();
  });

  it('renders compact rows with agent name and secondary info', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('Seraphel')).toBeTruthy();
    // Secondary info: "Thornwall · Idling"
    expect(screen.getByText(/Thornwall/)).toBeTruthy();
  });

  it('does not render sections with 0 entries', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Locations/Factions/Armies/Artifacts should not be rendered
    expect(screen.queryByText(/Locations/)).toBeNull();
    expect(screen.queryByText(/Factions/)).toBeNull();
    expect(screen.queryByText(/Armies/)).toBeNull();
    expect(screen.queryByText(/Artifacts/)).toBeNull();
  });

  it('Agents section is expanded by default', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // The agent row should be visible (section is expanded)
    expect(screen.getAllByTestId('thread-entry')).toHaveLength(1);
  });

  it('non-agent sections are collapsed by default', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeLocation()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Section header renders but rows are hidden (collapsed)
    expect(screen.getByText('Locations (1)')).toBeTruthy();
    expect(screen.queryByTestId('thread-entry')).toBeNull();
  });

  it('click on compact row calls onNodeSelect with correct nodeId and category', () => {
    const onNodeSelect = vi.fn();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={onNodeSelect}
        onCenterOnHex={noop}
      />
    );
    fireEvent.click(screen.getByTestId('thread-entry'));
    expect(onNodeSelect).toHaveBeenCalledWith('agent-1', 'agent');
  });

  it('eye icon click calls onCenterOnHex and does not trigger row select', () => {
    const onCenterOnHex = vi.fn();
    const onNodeSelect = vi.fn();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={onNodeSelect}
        onCenterOnHex={onCenterOnHex}
      />
    );
    const eyeButton = screen.getByLabelText('Center map on Seraphel');
    fireEvent.click(eyeButton);
    expect(onCenterOnHex).toHaveBeenCalledWith('loc-1');
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  it('selected row has ring-2 class applied', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId="agent-1"
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    const row = screen.getByTestId('thread-entry');
    expect(row.className).toContain('ring-2');
  });

  it('faction secondary info shows sphere alignment first when dominantSphere is non-null', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeFaction({ dominantSphere: 'flesh' })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Expand factions section first
    fireEvent.click(screen.getByText('Factions (1)'));
    const row = screen.getByTestId('thread-entry');
    // Secondary info should start with sphere alignment
    expect(row.textContent).toContain('flesh sphere');
  });

  it('renders multiple node type sections when present', () => {
    const nodes: ThreadedNode[] = [makeAgent(), makeFaction(), makeArtifact()];
    render(
      <ThreadsPanel
        threadedNodes={nodes}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('Agents (1)')).toBeTruthy();
    expect(screen.getByText('Factions (1)')).toBeTruthy();
    expect(screen.getByText('Artifacts (1)')).toBeTruthy();
  });

  it('clicking section header toggles collapse/expand', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeLocation()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Initially collapsed — no rows visible
    expect(screen.queryByTestId('thread-entry')).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByText('Locations (1)'));
    expect(screen.getByTestId('thread-entry')).toBeTruthy();

    // Click to collapse again
    fireEvent.click(screen.getByText('Locations (1)'));
    expect(screen.queryByTestId('thread-entry')).toBeNull();
  });
});
