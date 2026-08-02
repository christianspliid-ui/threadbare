// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Fake NarrationService ────────────────────────────────────────────
// Mirrors the real singleton's contract: speakSections bumps the generation
// id synchronously, `stop()` is idempotent, and status gates dispatch.

interface FakeService {
  status: string;
  isSpeaking: boolean;
  currentUtteranceId: number;
  speakSections: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

let fakeService: FakeService;

function makeFakeService(status = 'ready'): FakeService {
  const svc: FakeService = {
    status,
    isSpeaking: false,
    currentUtteranceId: 0,
    speakSections: vi.fn(async () => {}),
    stop: vi.fn(() => { svc.isSpeaking = false; }),
  };
  // Match the real service: the generation id advances synchronously when a
  // dispatch is accepted, before the returned promise settles.
  svc.speakSections.mockImplementation(async () => {
    if (svc.status !== 'ready' && svc.status !== 'speaking') return;
    svc.currentUtteranceId += 1;
    svc.isSpeaking = true;
  });
  return svc;
}

vi.mock('../NarrationService', () => ({
  getNarrationService: () => fakeService,
}));

vi.mock('../useNarration', () => ({
  useNarration: () => ({
    enabled: true,
    isSpeaking: false,
    isLoading: false,
    isAvailable: false,
    status: 'ready',
    speak: vi.fn(async () => {}),
    stop: vi.fn(),
    initWorker: vi.fn(async () => {}),
  }),
}));

import {
  EncounterNarrationError,
  speakEncounter,
  toNarrationSections,
  useEncounterNarration,
} from '../encounterNarration';
import {
  ENCOUNTER_NARRATION_MAX_SECTIONS,
  ENCOUNTER_NARRATION_MAX_SECTION_LENGTH,
  ENCOUNTER_NARRATION_VOICE,
} from '../narrationConstants';

beforeEach(() => {
  fakeService = makeFakeService();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('useEncounterNarration', () => {
  it('exposes the documented narration contract', () => {
    const { result } = renderHook(() => useEncounterNarration());

    expect(typeof result.current.enabled).toBe('boolean');
    expect(typeof result.current.isSpeaking).toBe('boolean');
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.speakEncounter).toBe('function');
    expect(typeof result.current.enable).toBe('function');
  });

  it('reports canNarrate when a backend is loaded and not merely available', () => {
    const { result } = renderHook(() => useEncounterNarration());
    expect(result.current.canNarrate).toBe(true);
    expect(result.current.needsOptIn).toBe(false);
  });
});

describe('toNarrationSections', () => {
  it('splits a string on blank lines and trims each section', () => {
    expect(toNarrationSections('One.\n\n  Two.  \n\nThree.')).toEqual(['One.', 'Two.', 'Three.']);
  });

  it('collapses an array into one block in single mode', () => {
    expect(toNarrationSections(['A.', 'B.'], 'single')).toEqual(['A. B.']);
  });

  it('drops blank and whitespace-only sections', () => {
    expect(toNarrationSections(['', '   ', 'Real.'])).toEqual(['Real.']);
  });

  it('caps section count', () => {
    const many = Array.from({ length: ENCOUNTER_NARRATION_MAX_SECTIONS + 5 }, (_, i) => `P${i}.`);
    expect(toNarrationSections(many)).toHaveLength(ENCOUNTER_NARRATION_MAX_SECTIONS);
  });

  it('clamps an over-long section rather than dropping it', () => {
    const long = 'x'.repeat(ENCOUNTER_NARRATION_MAX_SECTION_LENGTH + 500);
    const [only] = toNarrationSections([long]);
    expect(only).toHaveLength(ENCOUNTER_NARRATION_MAX_SECTION_LENGTH);
  });
});

describe('speakEncounter', () => {
  it('dispatches the prose to the backend in the canonical encounter voice', async () => {
    await speakEncounter(['First.', 'Second.']);

    expect(fakeService.speakSections).toHaveBeenCalledTimes(1);
    const [sections, voice] = fakeService.speakSections.mock.calls[0];
    expect(sections).toEqual(['First.', 'Second.']);
    expect(voice).toBe(ENCOUNTER_NARRATION_VOICE);
  });

  it('resolves before playback finishes so the handle can still cancel', async () => {
    const handle = await speakEncounter('Some prose.');
    expect(typeof handle.cancel).toBe('function');
    expect(handle.done).toBeInstanceOf(Promise);
    expect(handle.id).toBe(fakeService.currentUtteranceId);
  });

  it('cancel() stops playback while the handle still owns it', async () => {
    const handle = await speakEncounter('Some prose.');
    handle.cancel();
    expect(fakeService.stop).toHaveBeenCalledTimes(1);
  });

  it('cancel() is inert once a later utterance has taken over playback', async () => {
    const stale = await speakEncounter('First scene.');
    await speakEncounter('Second scene.');

    stale.cancel();

    // The second utterance owns playback — the stale handle must not silence it.
    expect(fakeService.stop).not.toHaveBeenCalled();
  });

  it('never affects synthesis with context metadata (spec line 4)', async () => {
    await speakEncounter('Prose.', undefined, {
      context: { encounterId: 'enc-1', stepId: 's-1', actorId: 'a-1', threadTier: 'strong' },
    });

    const args = fakeService.speakSections.mock.calls[0];
    // sections, voice, speed — and nothing else.
    expect(args).toHaveLength(3);
    expect(JSON.stringify(args)).not.toContain('enc-1');
  });

  it('rejects rather than throwing synchronously when prose is empty', async () => {
    const promise = speakEncounter(['', '   ']);
    await expect(promise).rejects.toBeInstanceOf(EncounterNarrationError);
    await expect(promise).rejects.toMatchObject({ reason: 'empty-text' });
    expect(fakeService.speakSections).not.toHaveBeenCalled();
  });

  it('rejects fail-soft when the backend cannot speak', async () => {
    fakeService = makeFakeService('available');

    const promise = speakEncounter('Prose.');
    await expect(promise).rejects.toMatchObject({ reason: 'backend-unavailable' });
    // Fail-soft: the rejection is the only signal; nothing is left playing.
    expect(fakeService.isSpeaking).toBe(false);
  });
});
