// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThreadsPanel } from '../ThreadsPanel';
import type { ThreadedNode } from '../../../engine/retinue';
import type { BalanceEvent } from '../../../types/balanceEval';
import type { EncounterNotification } from '../../../types/encounterVisibility';
import { selectEncounterBadges } from '../encounterBadgeModel';

function makeNotification(overrides: Partial<EncounterNotification> = {}): EncounterNotification {
  return {
    id: 'notif-1',
    agentId: 'agent-1',
    agentName: 'Seraphel',
    courtPosition: 'retinue',
    encounterId: 'enc.plague',
    encounterName: 'Plague Outbreak',
    prose: 'The sickness spreads.',
    choices: [],
    createdTick: 10,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
    ...overrides,
  };
}

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
    threadStrength: 1.0,
    locationId: 'loc-1',
    locationName: 'Thornwall',
    activityLabel: 'Idling',
    portraitUrl: null,
    primaryDomain: 'iron',
    factionName: 'Iron Brotherhood',
    championEffectId: null,
    championTemplateId: null,
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

function makeEncounterDecision(overrides?: Partial<BalanceEvent>): BalanceEvent {
  return {
    seq: 1,
    tick: 10,
    kind: 'encounter_decision',
    agentId: 'agent-1',
    sourceSystem: 'planner',
    decisionType: 'idle',
    filterCacheSize: 12,
    candidatesAfterCooldown: 3,
    ...overrides,
  };
}

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
    // THR-664: the location line is gone from agent rows — it duplicates the
    // detail panel, and the row needs the space for the encounter badge.
    expect(screen.queryByText(/Thornwall/)).toBeNull();
  });

  it('no longer renders the encounter-pool button or the action chip (THR-664)', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent({ activityLabel: 'Going to Green-shroud' })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        agentEncounterDecisions={new Map([['agent-1', makeEncounterDecision()]])}
      />
    );

    // Both moved to the agent detail panel; the row's encounter affordance is the badge.
    expect(screen.queryByTestId('encounter-pool-button')).toBeNull();
    expect(screen.queryByText(/^Pool /)).toBeNull();
    expect(screen.queryByText('Going to Green-shroud')).toBeNull();
  });

  it('renders an encounter badge on the row a pending notification anchors to (THR-664)', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        encounterBadges={selectEncounterBadges([makeNotification({ stepIndex: 1, totalSteps: 3 })])}
        onOpenEncounterBadge={noop}
      />
    );

    const badge = screen.getByTestId('thread-encounter-badge');
    expect(badge.getAttribute('data-encounter-badge-kind')).toBe('encounter');
    expect(badge.getAttribute('aria-label')).toContain('Plague Outbreak');
    expect(badge.getAttribute('aria-label')).toContain('step 2 of 3');
  });

  it('renders no badge when nothing is pending', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        encounterBadges={selectEncounterBadges([makeNotification({ viewed: true })])}
        onOpenEncounterBadge={noop}
      />
    );

    expect(screen.queryByTestId('thread-encounter-badge')).toBeNull();
  });

  it('opens the encounter without selecting the row when the badge is clicked', () => {
    const onNodeSelect = vi.fn();
    const onOpenEncounterBadge = vi.fn();
    const notif = makeNotification();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={onNodeSelect}
        onCenterOnHex={noop}
        encounterBadges={selectEncounterBadges([notif])}
        onOpenEncounterBadge={onOpenEncounterBadge}
      />
    );

    fireEvent.click(screen.getByTestId('thread-encounter-badge'));

    expect(onOpenEncounterBadge).toHaveBeenCalledTimes(1);
    expect(onOpenEncounterBadge.mock.calls[0][0].primary).toBe(notif);
    // The badge click must not fall through to row selection.
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  it('marks a concluded encounter as aftermath until it is read', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        encounterBadges={selectEncounterBadges([makeNotification({ kind: 'aftermath' })])}
        onOpenEncounterBadge={noop}
      />
    );

    const badge = screen.getByTestId('thread-encounter-badge');
    expect(badge.getAttribute('data-encounter-badge-kind')).toBe('aftermath');
    expect(badge.getAttribute('aria-label')).toContain('concluded');
  });

  it('badges both threaded participants of a two-agent encounter', () => {
    const notif = makeNotification({ participantIds: ['agent-1', 'agent-2'] });
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent(), makeAgent({ id: 'agent-2', name: 'Kael' })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        encounterBadges={selectEncounterBadges([notif])}
        onOpenEncounterBadge={noop}
      />
    );

    expect(screen.getAllByTestId('thread-encounter-badge')).toHaveLength(2);
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

  it('selected row has aria-selected set', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId="agent-1"
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    const row = screen.getByTestId('thread-entry');
    expect(row.getAttribute('aria-selected')).toBe('true');
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

// ─── THR-418: SustainedControl sections ───────────────────────────────────────

describe('ThreadsPanel sustained controls (THR-418)', () => {
  function makeSustainedHex(overrides?: Partial<Parameters<typeof ThreadsPanel>[0]['sustainedControls']> extends (infer U)[] | undefined ? U : never) {
    return {
      category: 'hex' as const,
      effectId: 'eff-hex-1',
      templateId: 'hex.claim_dominion',
      displayName: 'Iron Hold',
      hexCol: 5,
      hexRow: 3,
      perTickCostTotal: 2,
      perTickIncomeTotal: 0,
      netFlow: -2,
      ticksActive: 12,
      lapseRisk: 'safe' as const,
      runwayTicks: 50,
      primarySphere: 'force' as const,
      ...overrides,
    };
  }

  function makeSustainedSource(overrides?: Partial<Parameters<typeof ThreadsPanel>[0]['sustainedControls']> extends (infer U)[] | undefined ? U : never) {
    return {
      category: 'source' as const,
      effectId: 'eff-src-1',
      templateId: 'sub.sanctify',
      displayName: 'the Spring of Withered Light',
      hexCol: 5,
      hexRow: 3,
      targetNodeId: 'sub.spring',
      perTickCostTotal: 1,
      perTickIncomeTotal: 0,
      netFlow: -1,
      ticksActive: 4,
      lapseRisk: 'critical' as const,
      runwayTicks: 1,
      primarySphere: 'spirit' as const,
      ...overrides,
    };
  }

  it('renders Hexes section when sustainedControls includes a hex row', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        sustainedControls={[makeSustainedHex()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByTestId('threads-section-header-hex')).toBeTruthy();
    expect(screen.getByText('Hexes (1)')).toBeTruthy();
  });

  it('renders Sources section when sustainedControls includes a source row', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        sustainedControls={[makeSustainedSource()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByTestId('threads-section-header-source')).toBeTruthy();
  });

  it('section auto-expands when any row has non-safe risk', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        sustainedControls={[makeSustainedSource()]} // critical
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // Section body visible immediately because lapseRisk !== 'safe'
    expect(screen.getByTestId('threads-section-body-source')).toBeTruthy();
    expect(screen.getByTestId('sustained-control-row')).toBeTruthy();
  });

  it('safe-only section starts collapsed and can be expanded', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        sustainedControls={[makeSustainedHex()]} // safe
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.queryByTestId('sustained-control-row')).toBeNull();
    fireEvent.click(screen.getByTestId('threads-section-header-hex'));
    expect(screen.getByTestId('sustained-control-row')).toBeTruthy();
  });

  it('renders the prose status label corresponding to the lapse risk', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        sustainedControls={[makeSustainedSource()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // sub.sanctify + critical = 'The ground stirs against you.'
    expect(screen.getByText(/The ground stirs against you\./)).toBeTruthy();
  });

  it('falls back to __default__ status label for unknown template ids', () => {
    // Use a non-safe risk so the section auto-expands and we don't have to click.
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        sustainedControls={[makeSustainedHex({ templateId: 'hex.unknown_template', lapseRisk: 'tightening' as const })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    // __default__ + tightening = 'Holding.'
    expect(screen.getByText(/Holding\./)).toBeTruthy();
  });

  it('renders champion chip on agent rows with championTemplateId', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent({
          championEffectId: 'eff-anoint-1',
          championTemplateId: 'action.anoint-champion',
        })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    const chip = screen.getByTestId('champion-chip');
    expect(chip).toBeTruthy();
    expect(chip.textContent ?? '').toContain('Anointed');
  });

  it('champion chip click invokes onChampionChipClick with the agent id', () => {
    const onChampion = vi.fn();
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent({
          championEffectId: 'eff-anoint-1',
          championTemplateId: 'action.anoint-champion',
        })]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
        onChampionChipClick={onChampion}
      />
    );
    fireEvent.click(screen.getByTestId('champion-chip'));
    expect(onChampion).toHaveBeenCalledWith('agent-1');
  });

  it('no champion chip when championTemplateId is null', () => {
    render(
      <ThreadsPanel
        threadedNodes={[makeAgent()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.queryByTestId('champion-chip')).toBeNull();
  });

  it('still shows "No Threads" empty state when both threads and sustained controls are empty', () => {
    render(
      <ThreadsPanel
        threadedNodes={[]}
        sustainedControls={[]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.getByText('No Threads')).toBeTruthy();
  });

  it('hides empty state when threads are empty but sustained controls exist', () => {
    render(
      <ThreadsPanel
        threadedNodes={[]}
        sustainedControls={[makeSustainedHex()]}
        selectedNodeId={null}
        onNodeSelect={noop}
        onCenterOnHex={noop}
      />
    );
    expect(screen.queryByText('No Threads')).toBeNull();
    expect(screen.getByText('Hexes (1)')).toBeTruthy();
  });
});
