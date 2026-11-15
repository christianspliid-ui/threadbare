// @vitest-environment jsdom
//
// THR-2226 — the Ordeal spends essence and rolls the run's climax, so it is armed, then
// fired (UI Law 48): picking a lean only arms it; "Let the Ordeal answer" pays and rolls.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { JOURNEY_CONTINUE_LABEL, ORDEAL_COMMIT_LABEL, ORDEAL_PICK_PROMPT } from '../../../data/ui-content';
import type { CommittedOrdeal, JourneyVignetteData, OrdealOutcome } from '../../../types/journeyEngine';

const vignette: JourneyVignetteData = {
  agentId: 'agent.first',
  agentName: 'Kael Thornweaver',
  phase: 'ordeal',
  doomClockPercent: 0.8,
  beatIndex: 6,
  templateId: 'ordeal_test',
  variantKey: 'default',
  setupProse: 'The trial opens.',
  tensionProse: 'Everything rests on this.',
  choices: [
    {
      id: 'pour',
      text: 'Pour everything into the thread',
      effects: {
        interventionType: 'coercive',
        essenceCost: 5,
        consequenceProse: 'Fallback line.',
        consequenceByOutcome: { triumph: 'They rise.', scraped_through: 'They hold.', broken: 'They fall.' },
      },
    },
    {
      id: 'back',
      text: 'Step back',
      effects: { interventionType: 'withdrawn', consequenceProse: 'They stand alone.' },
    },
  ],
  stateSnapshot: {} as JourneyVignetteData['stateSnapshot'],
  isOrdeal: true,
  tick: 360,
} as JourneyVignetteData;

function renderOrdeal(outcome: OrdealOutcome | null = 'triumph', committedOrdeal: CommittedOrdeal | null = null) {
  const onChoice = vi.fn();
  const onClose = vi.fn();
  const onOrdealCommit = vi.fn((choiceId: string): CommittedOrdeal | null => (outcome ? { choiceId, outcome } : null));
  render(
    <JourneyVignetteModal
      open
      onClose={onClose}
      onChoice={onChoice}
      onOrdealCommit={onOrdealCommit}
      committedOrdeal={committedOrdeal}
      vignette={vignette}
      essenceAvailable={20}
    />,
  );
  return { onChoice, onClose, onOrdealCommit };
}

describe('the Ordeal is armed, then fired (THR-2226, Law 48)', () => {
  it('a pick arms the lean without spending or rolling', () => {
    const { onOrdealCommit, onChoice } = renderOrdeal();
    const commit = screen.getByTestId('ordeal-commit');
    expect(commit).toHaveProperty('disabled', true);
    expect(commit.textContent).toBe(ORDEAL_PICK_PROMPT);

    fireEvent.click(screen.getByText('Pour everything into the thread'));
    expect(onOrdealCommit).not.toHaveBeenCalled();
    expect(onChoice).not.toHaveBeenCalled();
    expect(screen.getByText('Pour everything into the thread').closest('button')?.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('ordeal-commit').textContent).toBe(ORDEAL_COMMIT_LABEL);
  });

  it('a second pick re-arms; the commit fires the armed lean once and shows the rolled line', () => {
    const { onOrdealCommit, onChoice } = renderOrdeal('broken');
    fireEvent.click(screen.getByText('Step back'));
    fireEvent.click(screen.getByText('Pour everything into the thread'));
    fireEvent.click(screen.getByTestId('ordeal-commit'));

    expect(onOrdealCommit).toHaveBeenCalledTimes(1);
    expect(onOrdealCommit).toHaveBeenCalledWith('pour');
    expect(screen.getByTestId('journey-consequence').textContent).toContain('They fall.');

    fireEvent.click(screen.getByText(JOURNEY_CONTINUE_LABEL));
    expect(onChoice).toHaveBeenCalledWith('pour');
  });

  it('Escape on an armed Ordeal takes back the lean and never rolls or closes it', () => {
    const { onOrdealCommit, onChoice, onClose } = renderOrdeal();
    fireEvent.click(screen.getByText('Pour everything into the thread'));
    expect(screen.getByTestId('ordeal-commit').textContent).toBe(ORDEAL_COMMIT_LABEL);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
    expect(onOrdealCommit).not.toHaveBeenCalled();
    expect(onChoice).not.toHaveBeenCalled();
    expect(screen.getByTestId('ordeal-commit').textContent).toBe(ORDEAL_PICK_PROMPT);
  });

  it('Escape with nothing armed sets the Ordeal aside: no roll, no charge, no close (review cycle 4)', () => {
    const onSetAside = vi.fn();
    const onOrdealCommit = vi.fn((choiceId: string): CommittedOrdeal | null => ({ choiceId, outcome: 'triumph' }));
    const onChoice = vi.fn();
    const onClose = vi.fn();
    render(
      <JourneyVignetteModal
        open
        onClose={onClose}
        onChoice={onChoice}
        onOrdealCommit={onOrdealCommit}
        onSetAside={onSetAside}
        vignette={vignette}
        essenceAvailable={20}
      />,
    );
    // An armed lean is the top layer: the first Escape takes it back, nothing else.
    fireEvent.click(screen.getByText('Pour everything into the thread'));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(onSetAside).not.toHaveBeenCalled();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(onSetAside).toHaveBeenCalledTimes(1);
    expect(onOrdealCommit).not.toHaveBeenCalled();
    expect(onChoice).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a host with no set-aside: Escape with nothing armed rolls the step-back and shows its result; the next Escape closes', () => {
    const { onOrdealCommit, onChoice, onClose } = renderOrdeal('scraped_through');
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    expect(onOrdealCommit).toHaveBeenCalledTimes(1);
    expect(onOrdealCommit).toHaveBeenCalledWith('back');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('journey-consequence').textContent).toContain('They stand alone.');

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(onChoice).toHaveBeenCalledWith('back');
    expect(onOrdealCommit).toHaveBeenCalledTimes(1);
  });

  it('a vision remounted after its roll opens on the stored result, with no choices to buy again', () => {
    const { onOrdealCommit, onChoice } = renderOrdeal('triumph', { choiceId: 'pour', outcome: 'broken' });
    expect(screen.getByTestId('journey-consequence').textContent).toContain('They fall.');
    expect(screen.queryByTestId('ordeal-commit')).toBeNull();
    expect(onOrdealCommit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(JOURNEY_CONTINUE_LABEL));
    expect(onChoice).toHaveBeenCalledWith('pour');
  });

  it('the result line follows the lean the host committed, not the one re-armed', () => {
    const onOrdealCommit = vi.fn((): CommittedOrdeal => ({ choiceId: 'pour', outcome: 'scraped_through' }));
    render(
      <JourneyVignetteModal open onClose={vi.fn()} onChoice={vi.fn()} onOrdealCommit={onOrdealCommit} vignette={vignette} essenceAvailable={20} />,
    );
    fireEvent.click(screen.getByText('Step back'));
    fireEvent.click(screen.getByTestId('ordeal-commit'));
    expect(screen.getByTestId('journey-consequence').textContent).toContain('They hold.');
  });

  it('a commit the pool cannot pay leaves the choices up', () => {
    renderOrdeal(null);
    fireEvent.click(screen.getByText('Pour everything into the thread'));
    fireEvent.click(screen.getByTestId('ordeal-commit'));
    expect(screen.queryByTestId('journey-consequence')).toBeNull();
    expect(screen.getByText('Step back')).toBeTruthy();
  });
});
