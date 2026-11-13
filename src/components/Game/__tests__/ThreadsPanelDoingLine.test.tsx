// @vitest-environment jsdom
/**
 * The roster's doing-line (THR-1434): what each mortal is in the middle of, in
 * words — the work as a phrase plus the progress or the trouble word; what they
 * hold, "and more" rather than a count; nothing at all when nothing is under way.
 * Every arm carries its absence; no numeral anywhere on the line.
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadsPanel, THREAD_STORY_LINE_MAX_LINES } from '../ThreadsPanel';
import type { ThreadedNode, SustainedControlNode } from '../../../engine/retinue';
import type { AgentStrategicSummary } from '../../../engine/strategicPresentation';
import type { AppointmentBadgeModel } from '../appointmentBadgeModel';

const noop = () => {};

/** THR-2193 — a story line wraps and clamps at the cap (Law 57) rather than cutting to one line. */
function expectClamped(el: HTMLElement) {
  expect(THREAD_STORY_LINE_MAX_LINES).toBeGreaterThanOrEqual(2);
  expect(el.style.getPropertyValue('-webkit-line-clamp') || String((el.style as unknown as Record<string, unknown>).WebkitLineClamp ?? ''))
    .toBe(String(THREAD_STORY_LINE_MAX_LINES));
  expect(el.style.overflow).toBe('hidden');
  expect(el.classList.contains('truncate')).toBe(false);
}

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
    calling: { title: 'Trader', titleKey: 'trader', icon: 'trader', color: '#c9a55c' } as AgentStrategicSummary['calling'],
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
        progressFraction: 0.45, word: 'under way', verb: 'establish',
        phrase: 'raising a company', doingLine: 'raising a company — under way', troubleWord: null,
      } as unknown as AgentStrategicSummary['activeProject'],
    })]]));
    const line = screen.getByTestId('thread-doing-line');
    expect(line.textContent).toContain('raising a company');
    // THR-1962: the word is its own non-shrinking span, so truncation never eats it.
    const word = screen.getByTestId('thread-doing-word');
    expect(word.textContent).toContain('— under way');
    expect(word.style.flexShrink).toBe('0');
    expect(line.textContent).not.toMatch(/\d/);
  });

  it('shows the trouble word when the work has halted', () => {
    const a = agent('a2', 'Ashara');
    renderRoster([a], new Map([[a.id, summary(a.id, {
      activeProject: {
        displayName: 'Ashara works at the Old Ruin.', progressFraction: 0.2, word: 'going badly', verb: 'observe',
        phrase: 'watching the Old Ruin', doingLine: 'watching the Old Ruin — going badly', troubleWord: 'going badly',
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

  it('THR-2193: the doing phrase wraps up to the story-line cap instead of cutting; the word still never shrinks', () => {
    const a = agent('a5', 'Oswen');
    renderRoster([a], new Map([[a.id, summary(a.id, {
      activeProject: {
        displayName: 'Oswen is raising a palisade at Wraithwood.', progressFraction: 0.9, word: 'all or nothing', verb: 'establish',
        phrase: 'raising a palisade at Wraithwood', doingLine: 'raising a palisade at Wraithwood — all or nothing', troubleWord: null,
      } as unknown as AgentStrategicSummary['activeProject'],
    })]]));
    const line = screen.getByTestId('thread-doing-line');
    const phrase = screen.getByTestId('thread-doing-phrase');
    expect(phrase.textContent).toBe('raising a palisade at Wraithwood');
    expectClamped(phrase);
    expect(line.querySelector('.truncate')).toBeNull();
    expect(line.classList.contains('truncate')).toBe(false);
    const word = screen.getByTestId('thread-doing-word');
    expect(word.style.flexShrink).toBe('0');
    expect(word.style.whiteSpace).toBe('nowrap');
  });

  it('THR-2193: the no-active-work fallback ("holds … and more") carries the same clamp', () => {
    const a = agent('a6', 'Vessa');
    renderRoster([a], new Map([[a.id, summary(a.id, {
      controlCount: 3,
      primaryControl: { displayName: 'Hold the Mill', targetName: 'the Old Mill', healthLabel: 'firm' },
    })]]));
    const phrase = screen.getByTestId('thread-doing-phrase');
    expect(phrase.textContent).toContain('holds the Old Mill and more');
    expectClamped(phrase);
    expect(screen.getByTestId('thread-doing-line').querySelector('.truncate')).toBeNull();
  });

  it('THR-2193: the stakes/result and appointment lines wrap with the same clamp, and the tooltip text is unchanged', () => {
    const a = agent('a7', 'Oswen');
    const result = 'Kael Thornweaver made the host welcome, and the hall remembered the kindness through the winter.';
    render(
      <ThreadsPanel
        threadedNodes={[a]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        encounterStakesLines={new Map([[a.id, { text: result, kind: 'result' as const }]])}
        appointmentBadges={new Map([[a.id, {
          text: 'keeps a promise at The Crossroads · in four days', desc: 'far off', placeId: 'loc-x', seedId: 's1',
          readout: { regime: 'far', broken: false },
        } as unknown as AppointmentBadgeModel]])}
      />,
    );
    const stakesLine = screen.getByTestId('thread-stakes-line');
    const stakesText = screen.getByTestId('thread-stakes-text');
    expect(stakesText.textContent).toBe(result);
    expectClamped(stakesText);
    expect(stakesLine.classList.contains('truncate')).toBe(false);
    expect(stakesLine.querySelector('.truncate')).toBeNull();

    const apptLine = screen.getByTestId('thread-appointment-line');
    expectClamped(screen.getByTestId('thread-appointment-text'));
    expect(apptLine.classList.contains('truncate')).toBe(false);
    expect(apptLine.querySelector('.truncate')).toBeNull();
  });

  it('THR-2193: the location claim-status and sustained-control status lines carry the same clamp', () => {
    const loc = {
      id: 'loc-1', name: 'Thornwall', tier: 1, tierName: 'Touched', category: 'location', threadEdgeId: 'thread-l1',
      attentionMode: 'auto_resolve', courtPosition: null, hexCol: 5, hexRow: 3, prosperityLabel: 'Modest',
      controllingFaction: null,
    } as unknown as ThreadedNode;
    const control = (category: 'location' | 'hex', extra: Partial<SustainedControlNode>): SustainedControlNode => ({
      category, effectId: `eff-${category}`, templateId: 'hex.claim_dominion', displayName: 'Iron Hold',
      hexCol: 5, hexRow: 3, perTickCostTotal: 2, perTickIncomeTotal: 0, netFlow: -2, ticksActive: 12,
      lapseRisk: 'safe', runwayTicks: 50, primarySphere: 'force', ...extra,
    } as SustainedControlNode);
    render(
      <ThreadsPanel
        threadedNodes={[loc]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        sustainedControls={[control('location', { targetNodeId: 'loc-1' }), control('hex', {})]}
      />,
    );
    // The Locations section starts collapsed; open it. (The safe Hexes section's status line is checked below.)
    fireEvent.click(screen.getByText('Locations · 1'));
    if (!screen.queryByTestId('sustained-status-line')) fireEvent.click(screen.getByText(/^Hexes/));
    const claim = screen.getByTestId('location-claim-status');
    expectClamped(claim);
    expect(claim.classList.contains('truncate')).toBe(false);
    const status = screen.getByTestId('sustained-status-line');
    expectClamped(status);
    expect(status.classList.contains('truncate')).toBe(false);
  });

  it('renders no doing-line at all for a mortal with no work and nothing held', () => {
    const a = agent('a4', 'Maerin');
    renderRoster([a], new Map([[a.id, summary(a.id, { recentCompletions: 1 })]]));
    expect(screen.queryByTestId('thread-doing-line')).toBeNull();
    expect(screen.queryByText(/idle/i)).toBeNull();
  });
});
