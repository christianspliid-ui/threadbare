// @vitest-environment jsdom
/**
 * The roster's doing-line (THR-1434): what each mortal is in the middle of, in
 * words — the work as a phrase plus the progress or the trouble word; what they
 * hold, "and more" rather than a count; nothing at all when nothing is under way.
 * Every arm carries its absence; no numeral anywhere on the line.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThreadsPanel } from '../ThreadsPanel';
import type { ThreadedNode } from '../../../engine/retinue';
import type { AgentStrategicSummary } from '../../../engine/strategicPresentation';

const noop = () => {};

function agent(id: string, name: string): Extract<ThreadedNode, { category: 'agent' }> {
  return {
    id, name, tier: 2, tierName: 'Devoted', category: 'agent', threadEdgeId: `thread-${id}`,
    attentionMode: 'auto_resolve', courtPosition: null, threadStrength: 1, locationId: 'loc-1',
    locationName: 'Thornwall', activityLabel: 'Idling', portraitUrl: null, primaryDomain: 'iron',
    factionName: null, championEffectId: null, championTemplateId: null,
  } as unknown as Extract<ThreadedNode, { category: 'agent' }>;
}

function summary(agentId: string, overrides: Partial<AgentStrategicSummary>): AgentStrategicSummary {
  return {
    agentId,
    behaviorFamily: 'merchant-expansion',
    calling: { title: 'Trader', titleKey: 'trader', glyph: '⚖', color: '#c9a55c' } as AgentStrategicSummary['calling'],
    activeProject: null,
    controlCount: 0,
    primaryControl: null,
    recentCompletions: 0,
    ...overrides,
  };
}

function renderRoster(nodes: ThreadedNode[], summaries: Map<string, AgentStrategicSummary>) {
  return render(
    <ThreadsPanel
      threadedNodes={nodes}
      selectedNodeId={null}
      onNodeSelect={noop}
      onCenterOnHex={noop}
      agentStrategicSummaries={summaries}
    />,
  );
}

describe('the roster doing-line', () => {
  it('shows the work as a phrase with its progress word, and never a numeral', () => {
    const a = agent('a1', 'Oswen');
    renderRoster([a], new Map([[a.id, summary(a.id, {
      activeProject: {
        displayName: 'Oswen is raising a company at Thornwall, and the ground has begun to answer.',
        progressFraction: 0.45, progressLabel: 'underway', verb: 'establish',
        doingLine: 'raising a company — underway', troubleWord: null,
      } as unknown as AgentStrategicSummary['activeProject'],
    })]]));
    const line = screen.getByTestId('thread-doing-line');
    expect(line.textContent).toContain('raising a company — underway');
    expect(line.textContent).not.toMatch(/\d/);
  });

  it('shows the trouble word when the work has halted', () => {
    const a = agent('a2', 'Ashara');
    renderRoster([a], new Map([[a.id, summary(a.id, {
      activeProject: {
        displayName: 'Ashara works at the Old Ruin.', progressFraction: 0.2, progressLabel: 'just begun', verb: 'observe',
        doingLine: 'watching the Old Ruin — going badly', troubleWord: 'going badly',
      } as unknown as AgentStrategicSummary['activeProject'],
    })]]));
    expect(screen.getByTestId('thread-doing-line').textContent).toContain('going badly');
  });

  it('says what they hold, "and more" rather than a count, when nothing is under way', () => {
    const a = agent('a3', 'Vessa');
    renderRoster([a], new Map([[a.id, summary(a.id, {
      controlCount: 3,
      primaryControl: { displayName: 'Hold the Mill', targetName: 'the Old Mill', healthLabel: 'firm' },
    })]]));
    const line = screen.getByTestId('thread-doing-line');
    expect(line.textContent).toContain('holds the Old Mill and more');
    expect(line.textContent).not.toMatch(/\d|\+/);
  });

  it('renders no doing-line at all for a mortal with no work and nothing held', () => {
    const a = agent('a4', 'Maerin');
    renderRoster([a], new Map([[a.id, summary(a.id, { recentCompletions: 1 })]]));
    expect(screen.queryByTestId('thread-doing-line')).toBeNull();
    expect(screen.queryByText(/idle/i)).toBeNull();
  });
});
