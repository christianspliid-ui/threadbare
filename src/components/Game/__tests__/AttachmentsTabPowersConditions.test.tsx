// @vitest-environment jsdom
/**
 * The dormant kinds I, on the sheet (THR-1429) — the UI pillar's evidence.
 *
 * This is the sanctioned `jsdom-render` substitution for the browser-verify capture
 * (`Docs/canon/verification-gates.md` § Browser-verify): an unattended run cannot start
 * a dev server, so the contract is discharged by asserting the rendered DOM for **every
 * face the change produces, plus absence where the element should not render**.
 *
 * It renders `AttachmentsTab` — the sheet that is actually mounted (`AgentProfileModal`
 * → this tab). The plan named `AgentDetailPanel`, which has no JSX mount anywhere in
 * `src/`, so a reader built there would have been unreachable; impediment #981.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentsTab } from '../tabs/AttachmentsTab';
import type { AgentInfoCardData } from '../../../engine/agentDetail';
import type { AttachmentFullEntry } from '../../../engine/agentAttachments';

const spell = (over: Partial<AttachmentFullEntry> = {}): AttachmentFullEntry => ({
  id: 'power.spell.spell_veilwalk',
  name: 'Veilwalk',
  subcategory: 'spell',
  tier: 2,
  mechanicalSummary: 'Slip between the folds of reality.',
  tags: [],
  slotTag: 'spell',
  powerClass: 'spell',
  ...over,
});

const curse = (over: Partial<AttachmentFullEntry> = {}): AttachmentFullEntry => ({
  id: 'reward_npc_10_38_reward_condition_nightmares',
  name: 'Nightmares',
  subcategory: 'curse',
  tier: 1,
  mechanicalSummary: 'Sleep gives nothing back.',
  tags: ['#curse'],
  slotTag: 'curse',
  ticksRemaining: 19,
  totalTicks: 24,
  sign: 'curse',
  ...over,
});

function card(over: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return { name: 'Morthane', ...over } as AgentInfoCardData;
}

describe('the sheet says what a mortal knows, carries, and is under', () => {
  it('renders a learned spell in the Spells section with its class word', () => {
    render(<AttachmentsTab card={card({ giftsAndBurdens: [spell()] })} />);
    expect(screen.getByTestId('attachments-slot-spell')).toBeTruthy();
    expect(screen.getByText('✨ Veilwalk')).toBeTruthy();
    // Law 14 — the class is a word on the row, so a spell is not mistaken for a gift.
    expect(screen.getByText(/Spell · /)).toBeTruthy();
  });

  it('files a spell under Powers, not Agreements', () => {
    // The split used to key on `subcategory === 'bestowed_power'` alone, which would
    // have filed every learned spell under Agreements — the section for marks and
    // favours. `powerClass` is what tells the two Power classes apart now.
    render(<AttachmentsTab card={card({ giftsAndBurdens: [spell()] })} />);
    expect(screen.queryByTestId('attachments-slot-agreement')).toBeNull();
  });

  it('shows a Sealed line on a bound power, and none on a free one', () => {
    const { unmount } = render(<AttachmentsTab card={card({ giftsAndBurdens: [spell({ sealed: true })] })} />);
    expect(screen.getByTestId('attachment-sealed-power.spell.spell_veilwalk').textContent)
      .toContain('will not answer');
    unmount();

    // Absence where it should not render — the half that makes the assertion mean something.
    render(<AttachmentsTab card={card({ giftsAndBurdens: [spell()] })} />);
    expect(screen.queryByTestId('attachment-sealed-power.spell.spell_veilwalk')).toBeNull();
  });

  it('names the culprit on a curse when the bearer knows it', () => {
    render(<AttachmentsTab card={card({ afflictions: [curse({ inflictedByName: 'Umbra' })] })} />);
    const line = screen.getByTestId('attachment-sign-reward_npc_10_38_reward_condition_nightmares');
    expect(line.textContent).toContain('A cursing');
    expect(line.textContent).toContain("Umbra's doing");
  });

  it('says "someone\'s doing" when the bearer cannot name them', () => {
    // The seen-harm rule (THR-1383) said on the sheet: an anonymous curse reads as
    // anonymous, rather than rendering nothing and looking like an ordinary affliction.
    render(<AttachmentsTab card={card({ afflictions: [curse()] })} />);
    const line = screen.getByTestId('attachment-sign-reward_npc_10_38_reward_condition_nightmares');
    expect(line.textContent).toContain("someone's doing");
    expect(line.textContent).not.toContain('undefined');
  });

  it('reads a blessing as a gift, not an affliction', () => {
    render(<AttachmentsTab card={card({
      afflictions: [curse({ id: 'b1', name: 'Dawn-Kissed', subcategory: 'blessing', slotTag: 'blessing', tags: ['#blessing'], sign: 'blessing', inflictedByName: 'Umbra' })],
    })} />);
    expect(screen.getByTestId('attachment-sign-b1').textContent).toContain('A blessing — Umbra saw to it');
  });

  it('shows a Knows row for a spell learned and not carried', () => {
    render(<AttachmentsTab card={card({
      knownSpells: [{ id: 'power.spell.spell_soulfire', name: 'Soulfire', tradition: 'energy' }],
    })} />);
    expect(screen.getByTestId('attachments-known-spells')).toBeTruthy();
    expect(screen.getByTestId('known-spell-power.spell.spell_soulfire').textContent).toContain('Soulfire');
    expect(screen.getByText('energy')).toBeTruthy();
  });

  it('states the spell cap as a phrase, never a bare numeral (Law 13)', () => {
    render(<AttachmentsTab card={card({
      knownSpells: [{ id: 's1', name: 'Soulfire', tradition: 'energy' }],
    })} />);
    // The Knows heading carries no count at all — what is *known* is uncapped, and the
    // tooltip says what holds the carried ones rather than printing the number.
    expect(screen.getByText('Knows')).toBeTruthy();
    expect(screen.queryByText(/Knows \(\d/)).toBeNull();
  });

  it('still renders the empty state when a mortal has nothing at all', () => {
    render(<AttachmentsTab card={card()} />);
    expect(screen.getByText(/carries no known possessions/)).toBeTruthy();
  });

  it('does NOT show the empty state for a mortal who only knows a spell', () => {
    // The regression the empty-state guard invites: `knownSpells` is not part of
    // `allItems`, so a mortal whose only Power is one they cannot currently carry
    // would have been told they carry nothing while the Knows section rendered below it.
    render(<AttachmentsTab card={card({ knownSpells: [{ id: 's1', name: 'Soulfire', tradition: 'energy' }] })} />);
    expect(screen.queryByText(/carries no known possessions/)).toBeNull();
    expect(screen.getByTestId('attachments-known-spells')).toBeTruthy();
  });
});
