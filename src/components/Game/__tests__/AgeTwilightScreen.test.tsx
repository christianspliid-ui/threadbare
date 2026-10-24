// @vitest-environment jsdom
/**
 * THR-1381 — the ceremony *The age ends*: it shows the beats the engine built, opens
 * through the home list, and its one button is the way to the harvest.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AgeTwilightScreen } from '../AgeTwilightScreen';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../../../engine/gameInit';
import { computeHarvest, startTwilight } from '../../../engine/cycleEnd';
import { buildTwilightBeats } from '../../../engine/twilight';
import { resolveInterrupts, type InterruptSnapshot } from '../interruptRegistry';
import { homedSurfaceFor } from '../../../data/homed-surfaces';

function twilightWorld() {
  const state = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
  devSeedTheFirst(state);
  const twilight = startTwilight({ ...state, doomDefinition: { ...state.doomDefinition, archetype: 'breach' } });
  return { state: twilight, beats: buildTwilightBeats(twilight, computeHarvest(twilight), twilight.cycle) };
}

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

describe('THR-1381 — AgeTwilightScreen', () => {
  it('renders the three beats as the engine built them, and the button continues', () => {
    const { state, beats } = twilightWorld();
    const onContinue = vi.fn();
    render(<AgeTwilightScreen beats={beats} gameState={state} primarySphere="life" remembered onContinue={onContinue} />);

    const ending = screen.getByTestId('age-twilight-ending');
    expect(within(ending).getByRole('heading', { level: 2 }).textContent).toBe('The Breach');
    expect(ending.textContent).toContain('A force from outside the world broke through its walls.');
    expect(ending.textContent).toContain('From here you watch; you cannot act.');

    expect(beats.first).toBeDefined();
    expect(screen.getByTestId('age-twilight-first').textContent).toBe(beats.first!.line);

    const memories = screen.getAllByTestId('age-twilight-memory').map(li => li.textContent);
    expect(memories).toEqual(beats.memories.map(m => m.summary));
    expect(memories.length).toBeGreaterThan(0);
    expect(memories.length).toBeLessThanOrEqual(3);
    expect(screen.getByTestId('age-twilight-memory-subline').textContent).toBe('The World-Soul keeps these.');

    // Law 13/14: no numerals on the ceremony.
    expect(screen.getByTestId('age-twilight').textContent).not.toMatch(/\d/);

    fireEvent.click(screen.getByTestId('age-twilight-continue'));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledWith();
  });

  it('says the memory will not be kept on the paths the harvest says so', () => {
    const { state, beats } = twilightWorld();
    render(<AgeTwilightScreen beats={beats} gameState={state} remembered={false} onContinue={() => undefined} />);
    expect(screen.getByTestId('age-twilight-memory-subline').textContent).toBe("This world's memory will not be kept.");
  });

  it('hides the First beat when there is no First', () => {
    const { state, beats } = twilightWorld();
    const { first: _first, ...rest } = beats;
    render(<AgeTwilightScreen beats={{ ...rest }} gameState={state} remembered onContinue={() => undefined} />);
    expect(screen.queryByTestId('age-twilight-first')).toBeNull();
  });

  it('is one entry in the home list: a ceremony that stops time, rendering while its beats wait', () => {
    expect(homedSurfaceFor('age-twilight')).toMatchObject({ home: 'ceremony', stopsTime: true, heldLine: 'The age is ending' });
    const r = resolveInterrupts({ ...closed, twilightPending: true });
    expect(r.rendering).toContain('age-twilight');
    expect(r.foreground).toBe('age-twilight');
    expect(r.anyOpen).toBe(true);
  });
});
