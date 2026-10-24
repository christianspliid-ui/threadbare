// @vitest-environment jsdom
/**
 * THR-1381 fail-soft — the end-of-age ceremony throws while rendering: the host shows
 * `HomedSurfaceFallback` for `age-twilight`, and its Continue completes the Twilight, so
 * the harvest is reached (`twilight.fallback { cause: 'mount_failed' }`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GameState } from '../../../types/gameState';
import type { TwilightBeats } from '../../../engine/twilight';
import { failTwilight } from '../../../engine/twilight';
import { clearTraces, enableTracing, getTraces } from '../../../engine/traceBuffer';
import { resolveInterrupts, type InterruptSnapshot } from '../interruptRegistry';
import type { HomedSurfaceKind } from '../../../data/homed-surfaces';

vi.mock('../AgeTwilightScreen', () => ({
  AgeTwilightScreen: () => { throw new Error('the ceremony cannot mount'); },
}));

const { CeremonyHost } = await import('../hosts/CeremonyHost');

const closed: InterruptSnapshot = {
  interruptsSuppressed: false,
  encounterOpen: false,
  meetingPending: false,
  hasAscendantIdentity: true,
  premonitionPending: false,
  vignettePending: false,
  storyBeatPending: false,
  ascendantBeatEntered: false,
  choiceSetPending: false,
  emergenceDecisionPending: false,
  divineReceiptPending: false,
  momentPending: false,
  chapterLedgerOpen: false,
  courtOpen: false,
  popupQueued: false,
};

const BEATS: TwilightBeats = {
  godName: 'Ilmarra',
  ending: { kind: 'doom', archetype: 'breach', finalStageName: 'The Breach', title: 'The Breach', close: 'The age of Ilmarra ends.' },
  memories: [],
  fallbacks: [],
};

beforeEach(() => {
  enableTracing();
  clearTraces();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('THR-1381 — a ceremony that cannot mount still reaches the harvest', () => {
  it('shows the fallback for age-twilight; Continue completes the Twilight', () => {
    let state = { phase: 'twilight', tick: 120 } as unknown as GameState;
    // GameView's mapping: the end of the age is never set down, its Continue completes it.
    const onSkip = (kind: HomedSurfaceKind) => {
      if (kind === 'age-twilight') state = failTwilight(state, 'mount_failed');
    };
    render(
      <CeremonyHost
        gameState={state}
        archetype={{ sphereAlignment: { primary: 'life' } } as never}
        twilightBeats={BEATS}
        handleCompleteTwilight={() => undefined}
        harvestResult={null}
        handleWakeNewWorld={() => undefined}
        accountSaved={null}
        meetingState={null}
        ascendantIdentity={undefined}
        handleMeetingSpendEssence={() => undefined}
        handleMeetingComplete={() => undefined}
        handleMeetingClose={() => undefined}
        pendingRite={null}
        interruptResolution={resolveInterrupts({ ...closed, twilightPending: true })}
        handleRiteComplete={() => undefined}
        handleRiteWithoutHand={() => undefined}
        onHomedSurfaceSkip={onSkip}
      />,
    );
    const fallback = screen.getByTestId('homed-surface-fallback');
    expect(fallback.getAttribute('data-kind')).toBe('age-twilight');
    fireEvent.click(screen.getByTestId('homed-surface-fallback-continue'));
    expect(state.phase).toBe('harvest');
    expect(getTraces().filter(t => t.category === 'twilight.fallback').map(t => (t as { cause: string }).cause)).toEqual(['mount_failed']);
  });
});
