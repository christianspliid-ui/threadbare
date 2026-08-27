// @vitest-environment jsdom
//
// Render evidence for the UI pillar of THR-1292 §3 (initiative retirement).
//
// **Browser-verify substitution: jsdom-render — unattended run, no startable dev
// server.** `preview_start` is refused in scheduled runs (impediments #546, #574),
// which also shuts the Playwright route since it presumes a running server. Per
// CLAUDE.md § Definition of Done → Browser-verify, the sanctioned substitution is
// render assertions on the real components: every face the change produces, plus
// absence where the element must not render.
//
// The two surfaces are the AgentDetailPanel card (was "Active Initiative") and the
// LocationView agent-row chip. Both used to read `activeInitiative` off the node;
// both now read the `activeUndertakings` projection.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentDetailPanel } from '../AgentDetailPanel';
import type { AgentDetail, ActiveUndertakingSummary } from '../../../engine/agentDetail';
import { getUndertakingProgressWord, UNDERTAKING_PROGRESS_WORDS } from '../../../data/domain-words';

// ─── Fixture ─────────────────────────────────────────────────────────

function makeDetail(
  activeUndertakings?: readonly ActiveUndertakingSummary[],
): AgentDetail {
  return {
    id: 'agent.1',
    name: 'Kael the Scorned',
    tier: 3,
    tierName: 'Devoted',
    locationId: 'loc.1',
    locationName: 'Ashvale',
    factionName: null,
    archetype: null,
    profile: {} as AgentDetail['profile'],
    domainCapabilities: {
      iron: 7, gold: 2, shadow: 5, veil: 3, heart: 4, eye: 1, stone: 3, star: 2, flesh: 1,
    } as AgentDetail['domainCapabilities'],
    topValues: [],
    topBonds: [],
    cooperationStrategy: 'tit-for-tat',
    reputationScore: 0.65,
    recentInteractions: [],
    activeUndertakings,
  } as unknown as AgentDetail;
}

function makeUndertaking(
  overrides: Partial<ActiveUndertakingSummary> = {},
): ActiveUndertakingSummary {
  return {
    projectId: 'proj_1',
    templateId: 'strategic_found_order',
    displayName: 'Found Order',
    percentComplete: 45,
    halts: 0,
    escalated: false,
    ...overrides,
  };
}

function renderPanel(detail: AgentDetail) {
  return render(
    <AgentDetailPanel
      detail={detail}
      onBack={vi.fn()}
      onViewPsyche={vi.fn()}
      onIntervene={vi.fn()}
      onLocationClick={vi.fn()}
    />,
  );
}

// ─── The card renders ────────────────────────────────────────────────

describe('AgentDetailPanel — undertaking card', () => {
  it('renders the undertaking name and the Undertaking label', () => {
    renderPanel(makeDetail([makeUndertaking()]));
    expect(screen.getByText('Found Order')).toBeTruthy();
    expect(screen.getByText('Undertaking')).toBeTruthy();
  });

  it('renders progress as a WORD, never a numeral (UI Law)', () => {
    renderPanel(makeDetail([makeUndertaking({ percentComplete: 45 })]));
    expect(screen.getByText('Halfway')).toBeTruthy();
    // The retired card printed `45%`. Assert that face is gone, not merely that the
    // word is present — a card rendering both would pass a word-only assertion.
    expect(screen.queryByText('45%')).toBeNull();
    expect(screen.queryByText(/^\d+%$/)).toBeNull();
  });

  it('renders every progress band as its own word', () => {
    for (const [i, word] of UNDERTAKING_PROGRESS_WORDS.entries()) {
      const pct = i * 20 + 10;
      const { unmount } = renderPanel(makeDetail([makeUndertaking({ percentComplete: pct })]));
      expect(getUndertakingProgressWord(pct)).toBe(word);
      expect(screen.getByText(word)).toBeTruthy();
      unmount();
    }
  });

  it('renders one card per undertaking — the shape is a list, not a single slot', () => {
    renderPanel(makeDetail([
      makeUndertaking({ projectId: 'p1', displayName: 'Found Order' }),
      makeUndertaking({ projectId: 'p2', displayName: 'Organize Festival' }),
    ]));
    expect(screen.getByText('Found Order')).toBeTruthy();
    expect(screen.getByText('Organize Festival')).toBeTruthy();
    expect(screen.getAllByText('Undertaking')).toHaveLength(2);
  });
});

// ─── Trouble reads as a sentence ─────────────────────────────────────

describe('AgentDetailPanel — trouble state', () => {
  it('says nothing about trouble when there is none', () => {
    renderPanel(makeDetail([makeUndertaking({ halts: 0 })]));
    expect(screen.queryByText(/Not going to plan/)).toBeNull();
    expect(screen.queryByText(/Doubled down/)).toBeNull();
  });

  it('reports a halting undertaking in words, not a halt count', () => {
    renderPanel(makeDetail([makeUndertaking({ halts: 2 })]));
    expect(screen.getByText('Not going to plan.')).toBeTruthy();
    // The ratchet count is a mechanic; the player should not read "2".
    expect(screen.queryByText(/\b2 halts?\b/)).toBeNull();
  });

  it('distinguishes an escalated undertaking that is failing again', () => {
    renderPanel(makeDetail([makeUndertaking({ halts: 2, escalated: true })]));
    expect(
      screen.getByText('Doubled down after setbacks — and it is going badly again.'),
    ).toBeTruthy();
    expect(screen.queryByText('Not going to plan.')).toBeNull();
  });
});

// ─── Absence ─────────────────────────────────────────────────────────

describe('AgentDetailPanel — absence', () => {
  it('renders no card when the agent has no undertakings', () => {
    renderPanel(makeDetail(undefined));
    expect(screen.queryByText('Undertaking')).toBeNull();
  });

  it('renders no card for an empty list', () => {
    renderPanel(makeDetail([]));
    expect(screen.queryByText('Undertaking')).toBeNull();
  });

  // The retired surface is gone from the DOM, not merely relabelled.
  it('never renders the retired Initiative label', () => {
    renderPanel(makeDetail([makeUndertaking()]));
    expect(screen.queryByText('Initiative')).toBeNull();
  });
});
