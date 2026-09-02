// @vitest-environment jsdom
/**
 * THR-1298 slice 7 — the two surfaces the reactive loop reaches the player through.
 *
 * **This file is the browser-verify evidence.** `preview_start` is refused in an
 * unattended run, which shuts the Playwright route too (it presumes a running server),
 * so the sanctioned substitution is jsdom render assertions on the real components —
 * `Browser-verify substitution: jsdom-render — unattended run, no startable dev server`
 * (`Docs/canon/verification-gates.md` § Browser-verify).
 *
 * The contract that route carries is *every face the change produces, plus absence
 * where the element should not render*. So each face below is asserted on the rendered
 * DOM, and each has its negative arm: a vendetta line and an ordinary drive with none, a
 * Blood section and an agent who has wronged nobody, a linked name and an unlinked one.
 *
 * UI Laws exercised here, checked against `Docs/design-system/laws.md`:
 *   Law 1  — the culprit and the other party render as concepts, not bare text.
 *   Law 13 — heat renders as `burning`/`hot`/`cooling`; the numeral never reaches the DOM.
 *   Law 14 — no raw key (`grievance_cooled`, `property_destroyed`) reaches the DOM.
 *   Law 16 — provenance is woven into a sentence, never a key:value strip.
 *   Law 21 — a named entity is clickable and routes by kind; no handler = plain text.
 *   Law 25 — a control that does nothing does not render (no handler → no button).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntentSection } from '../IntentSection';
import { BondsTab } from '../tabs/BondsTab';
import type { ActiveIntent, AgentInfoCardData, GrudgeSummary } from '../../../engine/agentDetail';

// ─── Fixtures ────────────────────────────────────────────────────

function intent(overrides: Partial<ActiveIntent> = {}): ActiveIntent {
  return {
    templateId: 'ambition_seek_revenge',
    displayName: 'Seek Revenge',
    category: 'dominion',
    priority: 'primary',
    completedMilestones: 0,
    requiredMilestones: 3,
    reachAffinity: { iron: 0.8 },
    ...overrides,
  };
}

/**
 * The exact shape the constructed CLI proof produced at tick 75 — a real mint, not an
 * invented one, so the rendered line is the line the engine actually feeds this surface.
 */
const VENDETTA: ActiveIntent = intent({
  mintedByLabel: "the razing of Wilderness (13, 6) — Oswen's work",
  grievance: { culpritId: 'ind_0', culpritName: 'Oswen', heatWord: 'burning' },
});

function card(overrides: Partial<AgentInfoCardData> = {}): AgentInfoCardData {
  return {
    id: 'agent.subject',
    name: 'Fael',
    locationId: 'loc_0',
    locationName: 'Thornhaven',
    knowledgeLevel: 'known',
    topBonds: [{ name: 'Maddis', strengthWord: 'close', sentiment: 'positive' }],
    ...overrides,
  } as AgentInfoCardData;
}

const GRUDGE: GrudgeSummary = {
  targetId: 'ind_0',
  targetName: 'Oswen',
  causeClause: 'an old wrong that never quite closed',
};

// ─── IntentSection — the provenance line ─────────────────────────

describe('IntentSection — vendetta provenance (THR-1298)', () => {
  it.each(['modal', 'panel'] as const)('renders the vendetta as one sentence (%s variant)', (variant) => {
    render(<IntentSection intents={[VENDETTA]} variant={variant} onOpenEntity={() => {}} />);

    expect(screen.getByText('burning')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Oswen — open profile/ })).toBeTruthy();
    // Law 16: the three facts read as prose, not as a label strip.
    expect(document.body.textContent).toContain("against Oswen, after the razing of Wilderness (13, 6) — Oswen's work");
  });

  // Law 13. Falsified by rendering `intent.grievance.heat` instead of `heatWord` — a
  // numeral then reaches the DOM and this arm fails while every other assertion passes.
  it('never puts the heat numeral or a raw key on the surface', () => {
    render(<IntentSection intents={[VENDETTA]} variant="modal" />);
    const text = document.body.textContent ?? '';

    expect(text).not.toMatch(/0\.\d/);
    expect(text).not.toContain('grievance');
    expect(text).not.toContain('culpritAgentId');
    expect(text).toContain('burning');
  });

  it.each(['burning', 'hot', 'cooling'] as const)('renders the %s band as its word', (heatWord) => {
    render(<IntentSection intents={[intent({ grievance: { culpritId: 'ind_0', culpritName: 'Oswen', heatWord } })]} variant="modal" />);
    expect(screen.getByText(heatWord)).toBeTruthy();
  });

  it('renders a world-minted want without a culprit as "Because of …"', () => {
    render(<IntentSection intents={[intent({ displayName: 'Rebuild from Ashes', mintedByLabel: 'the razing of Thornhall' })]} variant="modal" />);
    expect(screen.getByText('Because of the razing of Thornhall')).toBeTruthy();
  });

  // The absence arm the substitution contract requires.
  it('renders no provenance line at all for a self-chosen ambition', () => {
    const { container } = render(<IntentSection intents={[intent({ displayName: 'Conquer Territory' })]} variant="modal" />);
    const text = container.textContent ?? '';

    expect(text).toContain('Conquer Territory');
    expect(text).not.toContain('Because of');
    expect(text).not.toContain('against');
    for (const word of ['burning', 'hot', 'cooling']) expect(text).not.toContain(word);
  });

  // Law 21 / Law 25: no route means plain text, never an inert button.
  it('renders the culprit as plain text when the surface cannot open a profile', () => {
    render(<IntentSection intents={[VENDETTA]} variant="modal" />);

    expect(screen.getByText('Oswen')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Oswen/ })).toBeNull();
  });

  it('routes the culprit link to the culprit, not to the agent whose sheet is open', () => {
    const onOpenEntity = vi.fn();
    render(<IntentSection intents={[VENDETTA]} variant="modal" onOpenEntity={onOpenEntity} />);

    fireEvent.click(screen.getByRole('button', { name: /Oswen — open profile/ }));
    expect(onOpenEntity).toHaveBeenCalledWith('ind_0');
  });

  // Fail-soft: the culprit node can be gone (killed, purged). The drive still renders.
  it('renders a culprit-less vendetta as its heat alone', () => {
    render(<IntentSection intents={[intent({ grievance: { heatWord: 'cooling' } })]} variant="modal" />);

    expect(screen.getByText('cooling')).toBeTruthy();
    expect(document.body.textContent).not.toContain('against');
  });
});

// ─── BondsTab — the grudge line ──────────────────────────────────

describe('BondsTab — standing grudges (THR-1298)', () => {
  it('renders the Blood section as a sentence naming the party and the cause', () => {
    render(<BondsTab card={card({ grudges: [GRUDGE] })} onOpenEntity={() => {}} />);

    expect(screen.getByTestId('modal-grudges')).toBeTruthy();
    expect(screen.getByText('Blood')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Oswen — open profile/ })).toBeTruthy();
    expect(document.body.textContent)
      .toContain('There is blood between them and Oswen — an old wrong that never quite closed.');
  });

  // Law 14 — the enum on the edge is `grievance_cooled`; the player reads the clause.
  it('never renders the provenance enum', () => {
    render(<BondsTab card={card({ grudges: [GRUDGE] })} />);
    expect(document.body.textContent).not.toContain('grievance_cooled');
  });

  // The absence arm: no blood, no heading.
  it('renders no Blood section for an agent who has wronged nobody', () => {
    render(<BondsTab card={card()} />);

    expect(screen.queryByTestId('modal-grudges')).toBeNull();
    expect(screen.queryByText('Blood')).toBeNull();
  });

  it('renders one line per grudge, in the order the read model gave them', () => {
    render(<BondsTab card={card({ grudges: [
      GRUDGE,
      { targetId: 'ind_9', targetName: 'Bram', causeClause: 'a teaching that ended badly' },
    ] })} onOpenEntity={() => {}} />);

    const lines = screen.getByTestId('modal-grudges').querySelectorAll('p');
    expect(lines).toHaveLength(2);
    expect(lines[0].textContent).toContain('Oswen');
    expect(lines[1].textContent).toContain('Bram');
  });

  it('opens the other party from the grudge line', () => {
    const onOpenEntity = vi.fn();
    render(<BondsTab card={card({ grudges: [GRUDGE] })} onOpenEntity={onOpenEntity} />);

    fireEvent.click(screen.getByRole('button', { name: /Oswen — open profile/ }));
    expect(onOpenEntity).toHaveBeenCalledWith('ind_0');
  });

  // Blood is a *different* fact from a soured bond — both must be able to stand at once.
  it('leaves the Relationships section intact beside it', () => {
    render(<BondsTab card={card({ grudges: [GRUDGE] })} />);

    expect(screen.getByText('Relationships')).toBeTruthy();
    expect(screen.getByText('Maddis')).toBeTruthy();
    expect(screen.getByText('Blood')).toBeTruthy();
  });
});
