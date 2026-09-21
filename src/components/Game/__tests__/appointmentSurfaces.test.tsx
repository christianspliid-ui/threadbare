// @vitest-environment jsdom
/**
 * THR-1479 — the appointment's player surfaces, rendered through the real
 * components (the sanctioned jsdom-render substitution for an unattended run:
 * `Docs/canon/verification-gates.md` § Browser-verify).
 *
 * Every face the change produces, plus absence where the element must not
 * render: the thread row's clock line (and no line without an appointment), the
 * sheet's Bonds row in its live and broken readings (and the ordinary favour
 * reading untouched), the seeds debug tab's appointment and missed rows, and the
 * badge model's words. Laws 13/14 hold on every face: no numeral reaches the
 * text — the time is a duration word and the regime a phrase.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThreadsPanel } from '../ThreadsPanel';
import { BondsTab } from '../tabs/BondsTab';
import { EncounterSeedsTab } from '../debug/EncounterSeedsTab';
import { appointmentBadgeText, buildAppointmentBadges, type AppointmentBadgeModel } from '../appointmentBadgeModel';
import { WorldGraph } from '../../../engine/graph';
import { APPOINTMENT_FAVOUR_PROP, type AppointmentReadout } from '../../../engine/appointments';
import type { ThreadedNode } from '../../../engine/retinue';
import type { AgentInfoCardData, LeverageSummary } from '../../../engine/agentDetail';
import type { PendingEncounterSeed } from '../../../types/unifiedAction';

const noop = () => {};

function agent(id: string, name: string): Extract<ThreadedNode, { category: 'agent' }> {
  return {
    id, name, tier: 2, tierName: 'Devoted', category: 'agent', threadEdgeId: `thread-${id}`,
    attentionMode: 'auto_resolve', courtPosition: null, threadStrength: 1, locationId: 'loc-1',
    locationName: 'Thornwall', activityLabel: 'Idling', portraitUrl: null, primaryDomain: 'iron',
    factionName: null, championEffectId: null, championTemplateId: null,
  } as unknown as Extract<ThreadedNode, { category: 'agent' }>;
}

function readout(over: Partial<AppointmentReadout> = {}): AppointmentReadout {
  return {
    agentId: 'a1', agentName: 'Oswen', seedId: 'seed-1',
    seedLabel: 'A promise made at the crossroads falls due at the full moon.',
    placeId: 'loc-cross', placeName: 'The Crossroads',
    dueTick: 182, windowTicks: 12, slack: 40, travelTicks: 6, regime: 'far',
    leaveMargin: 6, counterpartyId: 'stranger', counterpartyName: 'The Stranger',
    favourEdgeId: 'f-appt', broken: false,
    ...over,
  };
}

function badge(over: Partial<AppointmentReadout> = {}, tick = 50): AppointmentBadgeModel {
  const r = readout(over);
  return { text: appointmentBadgeText(r, tick), desc: `${r.seedLabel} — far off`, placeId: r.placeId, seedId: r.seedId, readout: r };
}

describe('the thread row clock line', () => {
  it('renders "keeps a promise at <place> · in <time>" for a mortal holding an appointment, in words', () => {
    const a = agent('a1', 'Oswen');
    render(
      <ThreadsPanel threadedNodes={[a]} selectedNodeId={null} onNodeSelect={noop} onCenterOnHex={noop}
        appointmentBadges={new Map([[a.id, badge()]])} />,
    );
    const line = screen.getByTestId('thread-appointment-line');
    expect(line.textContent).toContain('keeps a promise at The Crossroads');
    expect(line.textContent).toContain('in two weeks');
    expect(line.textContent).not.toMatch(/\d/);
    expect(line.getAttribute('data-appointment-regime')).toBe('far');
  });

  it('renders the broken face after a miss', () => {
    const a = agent('a2', 'Ashara');
    render(
      <ThreadsPanel threadedNodes={[a]} selectedNodeId={null} onNodeSelect={noop} onCenterOnHex={noop}
        appointmentBadges={new Map([[a.id, badge({ broken: true, regime: 'lost' })]])} />,
    );
    expect(screen.getByTestId('thread-appointment-line').textContent).toContain('broke a promise at The Crossroads');
  });

  it('renders no clock line for a mortal holding no appointment', () => {
    const a = agent('a3', 'Maret');
    render(
      <ThreadsPanel threadedNodes={[a]} selectedNodeId={null} onNodeSelect={noop} onCenterOnHex={noop}
        appointmentBadges={new Map()} />,
    );
    expect(screen.queryByTestId('thread-appointment-line')).toBeNull();
  });
});

describe('the badge model — read off the seed queue, in words', () => {
  it('builds one badge per threaded holder from the real seeds, nearest due first', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Oswen', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc-cross', type: 'location', name: 'The Crossroads', properties: { hexCol: 4, hexRow: 0 } });
    graph.addNode({ id: 'loc-home', type: 'location', name: 'Home', properties: { hexCol: 0, hexRow: 0 } });
    graph.addEdge({ id: 'a1_at', source: 'a1', target: 'loc-home', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'f-appt', source: 'a1', target: 'loc-cross', type: 'owes_favor',
      properties: { grantedTick: 1, [APPOINTMENT_FAVOUR_PROP]: { seedId: 'seed-1', locationId: 'loc-cross', dueTick: 74 } } });
    const seed = {
      seedId: 'seed-1', sourceEncounterId: 'enc', sourceReactionId: 'rx', templateId: 'encounter.slice.full_moon_collection',
      targetAgentId: 'a1', eligibleAfterTick: 74, priority: 1, seedLabel: 'A promise falls due.', plantedTick: 10,
      appointment: { locationId: 'loc-cross', dueTick: 74, windowTicks: 12, missed: { seedLabel: 'x', query: { kind: 'encounter_template', tags: ['#crossroads_debt'] } }, favourEdgeId: 'f-appt' },
    } as PendingEncounterSeed;
    const badges = buildAppointmentBadges({ graph, tick: 50, pendingEncounterSeeds: [seed] }, ['a1', 'a-other'], () => ({ courage_prudence: 0, loyalty_ambition: 0 }));
    expect(badges.size).toBe(1);
    const b = badges.get('a1')!;
    expect(b.text).toBe('keeps a promise at The Crossroads · in two days');
    expect(b.desc).toContain('A promise falls due.');
    expect(b.text).not.toMatch(/\d/);
    expect(buildAppointmentBadges({ graph, tick: 50, pendingEncounterSeeds: [] }, ['a1'], () => ({ courage_prudence: 0, loyalty_ambition: 0 })).size).toBe(0);
  });
});

describe('the sheet Bonds row', () => {
  const emptyStrand = { secretsHeld: [], secretsAbout: [], favorsOwed: [], favorsOwedToMe: [] };
  const cardWith = (favorsOwed: unknown[]): AgentInfoCardData =>
    ({ name: 'Oswen', knowledgeLevel: 'known', leverage: { ...emptyStrand, favorsOwed } as LeverageSummary } as unknown as AgentInfoCardData);

  it('reads an appointment favour as the meeting it is', () => {
    render(<BondsTab card={cardWith([{
      counterpartyId: 'stranger', counterpartyName: 'The Stranger', magnitude: 0.5, context: 'appointment', isDebtor: true,
      appointment: { placeId: 'loc-cross', placeName: 'The Crossroads', dueTick: 182, broken: false },
    }])} />);
    const text = screen.getByTestId('modal-agreements').textContent ?? '';
    expect(text).toContain('They owe');
    expect(text).toContain('The Stranger');
    expect(text).toContain('a meeting at The Crossroads.');
    expect(text).not.toContain('broken');
  });

  it('reads a missed one as broken', () => {
    render(<BondsTab card={cardWith([{
      counterpartyId: 'stranger', counterpartyName: 'The Stranger', magnitude: 0.5, context: 'appointment', isDebtor: true,
      appointment: { placeId: 'loc-cross', placeName: 'The Crossroads', dueTick: 182, broken: true },
    }])} />);
    expect(screen.getByTestId('modal-agreements').textContent).toContain('a meeting at The Crossroads — broken.');
  });

  it('leaves an ordinary favour reading untouched', () => {
    render(<BondsTab card={cardWith([{
      counterpartyId: 'hask', counterpartyName: 'Hask', magnitude: 0.5, context: 'pressed', isDebtor: true,
    }])} />);
    const text = screen.getByTestId('modal-agreements').textContent ?? '';
    expect(text).toContain('They owe');
    expect(text).toContain(' a favour.');
    expect(text).not.toContain('meeting');
  });
});

describe('the seeds debug tab', () => {
  const base = {
    seedId: 'seed-abc123', sourceEncounterId: 'enc-xyz', sourceReactionId: 'rx-001',
    templateId: 'encounter.slice.full_moon_collection', targetAgentId: 'agent-001',
    eligibleAfterTick: 182, priority: 1, seedLabel: 'A promise falls due.', plantedTick: 50,
  };
  it('shows the appointment block on a placed seed, and nothing on a placeless one', () => {
    const placed = { ...base, appointment: { locationId: 'loc-crossroads', dueTick: 182, windowTicks: 12, counterpartyId: 'actor-stranger', missed: { seedLabel: 'x', query: { kind: 'encounter_template', tags: ['#crossroads_debt'] } } } } as PendingEncounterSeed;
    const { unmount } = render(<EncounterSeedsTab seeds={[placed]} currentTick={60} />);
    const row = screen.getByTestId('seed-appointment');
    expect(row.textContent).toContain('due 182');
    expect(row.textContent).toContain('#crossroads_debt');
    expect(screen.queryByTestId('seed-missed-appointment')).toBeNull();
    unmount();
    render(<EncounterSeedsTab seeds={[base as PendingEncounterSeed]} currentTick={60} />);
    expect(screen.queryByTestId('seed-appointment')).toBeNull();
  });
  it('shows the missed row on a converted seed', () => {
    const converted = { ...base, templateId: undefined, query: { kind: 'encounter_template', tags: ['#crossroads_debt'] }, missedAppointment: { locationId: 'loc-crossroads', dueTick: 182, reason: 'absent' } } as PendingEncounterSeed;
    render(<EncounterSeedsTab seeds={[converted]} currentTick={200} />);
    expect(screen.getByTestId('seed-missed-appointment').textContent).toContain('absent');
  });
});
