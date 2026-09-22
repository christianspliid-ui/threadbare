// @vitest-environment jsdom
/**
 * THR-1448 — the hold line on the mortal sheet's Faction strand.
 *
 * *keeps Ashford for the Realm of the Vael · grip firm*: the town and the Realm are
 * doors (the one router, THR-1482), the grip is a word (Law 13), a hold in unclaimed
 * wilds reads with no Realm, and a keeper with no faction card still gets the strand.
 *
 * These stand in for the contractual 1920×1080 capture where no unattended run can
 * produce one (impediments #546, #574): they cover that the line reached the surface
 * with the right words and doors; they do not cover what only pixels can.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverviewTab } from '../OverviewTab';
import type { AgentInfoCardData } from '../../../../engine/agentDetail';
import type { KnowledgeLevel } from '../../../../types/familiarity';

function card(overrides: Partial<AgentInfoCardData> = {}, knowledgeLevel: KnowledgeLevel = 'known'): AgentInfoCardData {
  return {
    id: 'actor_keeper',
    name: 'Sera Goldvein',
    locationId: 'loc_ashford',
    locationName: 'Ashford',
    knowledgeLevel,
    factionName: 'Realm of the Vael',
    factionRank: 'Subject',
    factionReputation: 0.2,
    holdTownName: 'Ashford',
    holdTownId: 'loc_ashford',
    holdRealmName: 'Realm of the Vael',
    holdRealmNodeId: 'faction_realm',
    holdGripWord: 'firm',
    ...overrides,
  } as AgentInfoCardData;
}

describe('OverviewTab — the hold line (THR-1448)', () => {
  it('reads keeps <town> for <Realm> · grip <word>, with both doors wired', () => {
    const onOpenEntity = vi.fn();
    const onOpenFaction = vi.fn();
    render(<OverviewTab card={card()} onOpenEntity={onOpenEntity} onOpenFaction={onOpenFaction} />);

    const line = screen.getByTestId('hold-line');
    expect(line.textContent).toBe('keeps Ashford for Realm of the Vael · grip firm');

    fireEvent.click(screen.getByTestId('hold-town-link'));
    expect(onOpenEntity).toHaveBeenCalledWith('loc_ashford');
    fireEvent.click(screen.getByTestId('hold-realm-link'));
    expect(onOpenFaction).toHaveBeenCalledWith('faction_realm', 'Realm of the Vael');
  });

  it('a hold in unclaimed wilds reads with no Realm', () => {
    render(<OverviewTab card={card({ holdRealmName: undefined, holdRealmNodeId: undefined, holdGripWord: 'slipping' })} />);
    expect(screen.getByTestId('hold-line').textContent).toBe('keeps Ashford · grip slipping');
    expect(screen.queryByTestId('hold-realm-link')).toBeNull();
  });

  it('the grip is a word, never a number — the Faction section carries no digits', () => {
    render(<OverviewTab card={card({ holdGripWord: 'failing' })} />);
    const section = screen.getByTestId('hold-line').closest('section')!;
    expect(section.textContent).toMatch(/grip failing/);
    expect(section.textContent).not.toMatch(/\d/);
  });

  it('a keeper with no faction card still gets the strand, with the hold line alone', () => {
    render(<OverviewTab card={card({ factionName: undefined, factionRank: undefined, factionReputation: undefined })} />);
    expect(screen.getByRole('heading', { name: 'Faction' })).toBeTruthy();
    expect(screen.getByTestId('hold-line').textContent).toBe('keeps Ashford for Realm of the Vael · grip firm');
  });

  it('no hold, no line — the strand is exactly what it was', () => {
    render(<OverviewTab card={card({ holdTownName: undefined, holdTownId: undefined, holdRealmName: undefined, holdRealmNodeId: undefined, holdGripWord: undefined })} />);
    expect(screen.queryByTestId('hold-line')).toBeNull();
    expect(screen.getByText('Subject')).toBeTruthy();
  });

  it('is knowledge-gated with the rest of the strand — a stranger sees nothing', () => {
    render(<OverviewTab card={card({}, 'stranger')} />);
    expect(screen.queryByTestId('hold-line')).toBeNull();
  });

  it('degrades to plain text on a surface that cannot route', () => {
    render(<OverviewTab card={card()} />);
    expect(screen.getByTestId('hold-town-link').tagName).toBe('SPAN');
    expect(screen.getByTestId('hold-realm-link').tagName).toBe('SPAN');
  });
});
