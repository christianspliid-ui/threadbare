// @vitest-environment jsdom
//
// THR-2228 (THR-2204 slice 3) — the Return is a choice-less vision. It rendered no button,
// so only Escape closed it. It now names what the age has left and closes on "Go on".
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { RETURN_CLOSE_LABEL } from '../../../data/return-content';
import type { JourneyVignetteData } from '../../../types/journeyEngine';

const returnVision: JourneyVignetteData = {
  agentId: 'agent.first',
  agentName: 'Kael Thornweaver',
  phase: 'return',
  doomClockPercent: 0.95,
  beatIndex: 0,
  templateId: 'return_convergence',
  variantKey: 'vanishing',
  setupProse: 'Kael Thornweaver was simply gone.',
  tensionProse: 'The village kept his chair.',
  choices: [],
  stateSnapshot: {} as JourneyVignetteData['stateSnapshot'],
  isOrdeal: false,
  tick: 900,
  closeLabel: RETURN_CLOSE_LABEL,
  remainingLine: "Kael Thornweaver's story is told. The age has a season left. Another mortal can carry your thread.",
};

describe('the Return closes on "Go on" (THR-2228)', () => {
  it('shows the remaining line and a "Go on" button that closes the Stage', () => {
    const onClose = vi.fn();
    const onChoice = vi.fn();
    render(<JourneyVignetteModal open onClose={onClose} onChoice={onChoice} vignette={returnVision} />);

    expect(screen.getByTestId('return-remaining-line').textContent).toContain('The age has a season left.');
    const button = screen.getByTestId('journey-go-on');
    expect(button.textContent).toBe('Go on');

    fireEvent.click(button);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChoice).not.toHaveBeenCalled();
  });

  it('Escape still closes it', () => {
    const onClose = vi.fn();
    render(<JourneyVignetteModal open onClose={onClose} onChoice={vi.fn()} vignette={returnVision} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
