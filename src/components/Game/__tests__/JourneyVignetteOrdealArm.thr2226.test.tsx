// @vitest-environment jsdom
//
// THR-2226 — the Ordeal spends essence and rolls the run's climax, so it is armed, then
// fired (UI Law 48): picking a lean only arms it; "Let the Ordeal answer" pays and rolls.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { JOURNEY_CONTINUE_LABEL, ORDEAL_COMMIT_LABEL, ORDEAL_PICK_PROMPT } from '../../../data/ui-content';
import type { JourneyVignetteData, OrdealOutcome } from '../../../types/journeyEngine';

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

function renderOrdeal(outcome: OrdealOutcome | null = 'triumph') {
  const onChoice = vi.fn();
  const onClose = vi.fn();
  const onOrdealCommit = vi.fn(() => outcome);
  render(
    <JourneyVignetteModal
      open
      onClose={onClose}
      onChoice={onChoice}
      onOrdealCommit={onOrdealCommit}
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

  it('a commit the pool cannot pay leaves the choices up', () => {
    renderOrdeal(null);
    fireEvent.click(screen.getByText('Pour everything into the thread'));
    fireEvent.click(screen.getByTestId('ordeal-commit'));
    expect(screen.queryByTestId('journey-consequence')).toBeNull();
    expect(screen.getByText('Step back')).toBeTruthy();
  });
});
