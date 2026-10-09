// @vitest-environment jsdom
//
// THR-1788 — the journey vignette footer names the story stage as a word ("The Call"), never the
// engine's beat index. "Beat 1 — Call" read to warm-playtest testers as "step 1 of the tutorial"
// (Law 13: a word, never a number). The modal portals to <body>, so assertions read the footer
// element itself, found through the screen queries, never RTL's empty `container`.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JourneyVignetteModal } from '../JourneyVignetteModal';
import { JOURNEY_STAGE_LABELS } from '../../../data/ui-content';
import type { JourneyVignetteData } from '../../../types/journeyEngine';
import type { CampbellianPhase } from '../../../types/influence';

const vignette: JourneyVignetteData = {
  agentId: 'agent.first',
  agentName: 'Kael Thornweaver',
  phase: 'call',
  doomClockPercent: 0.25,
  beatIndex: 0,
  templateId: 'journey.call.1',
  variantKey: 'default',
  setupProse: 'The road narrows where the elders would not walk.',
  tensionProse: 'He waits for a sign that is yours to give or withhold.',
  choices: [
    { id: 'choice.1', text: 'Send the sign.', effects: { interventionType: 'supportive' } },
  ],
  stateSnapshot: {} as JourneyVignetteData['stateSnapshot'],
  isOrdeal: false,
  tick: 25,
};

function renderFooter(overrides: Partial<JourneyVignetteData> = {}) {
  render(
    <JourneyVignetteModal
      open
      onClose={() => {}}
      onChoice={() => {}}
      vignette={{ ...vignette, ...overrides }}
    />,
  );
  return screen.getByTestId('journey-stage');
}

describe('JourneyVignetteModal footer — the stage is a word (THR-1788)', () => {
  it('reads "The Call" for beatIndex 0, phase call, and carries no digit', () => {
    const footer = renderFooter();
    expect(footer.textContent).toBe('The Call');
    expect(footer.textContent).not.toMatch(/\d/);
    expect(footer.textContent).not.toMatch(/Beat/);
    // The mortal's name stays in the footer beside the stage.
    expect(footer.parentElement?.textContent).toContain('Kael Thornweaver');
  });

  it('never surfaces the beat index, whatever it is', () => {
    const footer = renderFooter({ beatIndex: 3, phase: 'road_of_trials' });
    expect(footer.textContent).toBe('The Road of Trials');
    expect(footer.parentElement?.textContent).not.toMatch(/\d/);
  });

  it('names every Campbellian stage with its article', () => {
    const phases: CampbellianPhase[] = ['call', 'road_of_trials', 'crisis', 'ordeal', 'return'];
    for (const phase of phases) {
      expect(JOURNEY_STAGE_LABELS[phase]).toMatch(/^The [A-Z]/);
      expect(JOURNEY_STAGE_LABELS[phase]).not.toMatch(/\d|chapter/i);
    }
  });
});
