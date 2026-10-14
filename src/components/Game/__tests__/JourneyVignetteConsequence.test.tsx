// @vitest-environment jsdom
//
// THR-1854 — a journey choice is answered before the moment closes. Warm-round-2 testers
// clicked a choice, the modal vanished, and "did my choice do anything" went unanswered;
// the first choice also opened focused, which read as a remembered answer. The modal
// portals to <body>, so assertions go through the screen queries.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { JOURNEY_CONTINUE_LABEL } from '../../../data/ui-content';
import type { JourneyVignetteData } from '../../../types/journeyEngine';

const vignette: JourneyVignetteData = {
  agentId: 'agent.first',
  agentName: 'Kael Thornweaver',
  phase: 'road_of_trials',
  doomClockPercent: 0.3,
  beatIndex: 0,
  templateId: 'trials_temptation',
  variantKey: 'default',
  setupProse: 'A stranger offers a gleaming gift.',
  tensionProse: 'The gift has teeth.',
  choices: [
    {
      id: 'warn',
      text: 'Send a warning',
      effects: { interventionType: 'supportive', consequenceProse: 'The trap reveals itself.' },
    },
    {
      id: 'surge',
      text: 'Pour power down the thread',
      effects: { interventionType: 'coercive', essenceCost: 5, consequenceProse: 'Light pours through.' },
    },
    { id: 'away', text: 'Let them take it', effects: { interventionType: 'withdrawn' } },
  ],
  stateSnapshot: {} as JourneyVignetteData['stateSnapshot'],
  isOrdeal: false,
  tick: 30,
};

function renderModal(props: { essenceAvailable?: number } = {}) {
  const onChoice = vi.fn();
  const onClose = vi.fn();
  render(
    <JourneyVignetteModal open onClose={onClose} onChoice={onChoice} vignette={vignette} {...props} />,
  );
  return { onChoice, onClose };
}

describe('JourneyVignetteModal answers the click (THR-1854)', () => {
  it('shows the consequence line, and commits the choice only on Continue', () => {
    const { onChoice } = renderModal();
    fireEvent.click(screen.getByText('Send a warning'));

    expect(onChoice).not.toHaveBeenCalled();
    expect(screen.getByTestId('journey-consequence').textContent).toContain('The trap reveals itself.');
    // The other choices are gone: the moment has been answered.
    expect(screen.queryByText('Let them take it')).toBeNull();

    fireEvent.click(screen.getByText(JOURNEY_CONTINUE_LABEL));
    expect(onChoice).toHaveBeenCalledWith('warn');
  });

  it('a choice with no reply line commits at once', () => {
    const { onChoice } = renderModal();
    fireEvent.click(screen.getByText('Let them take it'));
    expect(onChoice).toHaveBeenCalledWith('away');
  });

  it('closing an answered moment commits the answer, not a withdrawal', () => {
    const { onChoice, onClose } = renderModal();
    fireEvent.click(screen.getByText('Send a warning'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(onChoice).toHaveBeenCalledWith('warn');
  });

  it('opens with focus on the scene, not on a choice', () => {
    renderModal();
    const active = document.activeElement as HTMLElement | null;
    expect(active?.tagName).not.toBe('BUTTON');
    expect(active?.getAttribute('aria-label')).toBe('The scene');
  });

  it('a choice the paying pool cannot cover is disabled and says why', () => {
    const { onChoice } = renderModal({ essenceAvailable: 2 });
    const surge = screen.getByText('Pour power down the thread').closest('button')!;
    expect(surge.disabled).toBe(true);
    expect(surge.textContent).toContain('not enough essence');
    fireEvent.click(surge);
    expect(onChoice).not.toHaveBeenCalled();
  });
});
