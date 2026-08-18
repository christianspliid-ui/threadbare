// @vitest-environment jsdom
// jsdom for `localStorage` (the UI channel's mute store) and `window`. Note it
// still provides no Web Audio implementation — that is exactly the fail-soft
// path these tests exercise, with a fake context injected where scheduling
// itself is under test.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  __resetEncounterSoundDesign,
  __setAudioContextFactory,
  beginTensionReveal,
  dbToGain,
  endTensionReveal,
  playResolveNote,
  resolveNoteFrequency,
  semitonesToRatio,
} from '../encounterSoundDesign';
import {
  ENCOUNTER_CELLO_ROOT_HZ,
  ENCOUNTER_INHALE_DB,
  ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER,
  ENCOUNTER_THRUM_PEAK_DB,
} from '../audioConstants';
import { __resetUiChannel, muteUi, unmuteUi } from '../UiChannel';

/**
 * A minimal AudioContext double. Records which node types were created and
 * which sources were started, so the tests can assert scheduling without a
 * real Web Audio implementation (jsdom has none).
 */
function makeFakeContext() {
  const started: Array<{ type: string; frequency: number | null }> = [];
  const gainRamps: number[] = [];

  const makeParam = (initial = 0) => ({
    value: initial,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn((v: number) => {
      gainRamps.push(v);
    }),
  });

  const connectable = <T extends object>(node: T) =>
    Object.assign(node, { connect: vi.fn((dest: unknown) => dest) });

  const context = {
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(),
    createBuffer: (channels: number, frames: number, rate: number) => ({
      getChannelData: () => new Float32Array(frames),
      length: frames,
      sampleRate: rate,
      numberOfChannels: channels,
    }),
    createBufferSource: () =>
      connectable({
        buffer: null as unknown,
        start: vi.fn(() => started.push({ type: 'noise', frequency: null })),
        stop: vi.fn(),
        onended: null as null | (() => void),
      }),
    createOscillator: () => {
      const osc = connectable({
        type: 'sine',
        frequency: makeParam(0),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as null | (() => void),
      });
      osc.start = vi.fn(() =>
        started.push({ type: osc.type, frequency: osc.frequency.value }),
      );
      return osc;
    },
    createBiquadFilter: () =>
      connectable({ type: 'lowpass', frequency: makeParam(0) }),
    createGain: () => connectable({ gain: makeParam(1) }),
  };

  return { context, started, gainRamps };
}

describe('encounterSoundDesign — pure helpers', () => {
  it('converts dBFS to linear gain', () => {
    expect(dbToGain(0)).toBeCloseTo(1, 6);
    // -6dB is the canonical half-amplitude point.
    expect(dbToGain(-6)).toBeCloseTo(0.5012, 3);
    // The two spec levels from canonical UI spec §3.3.
    expect(dbToGain(ENCOUNTER_INHALE_DB)).toBeCloseTo(0.0398, 4);
    expect(dbToGain(ENCOUNTER_THRUM_PEAK_DB)).toBeCloseTo(0.1585, 4);
  });

  it('converts semitones to frequency ratios', () => {
    expect(semitonesToRatio(0)).toBe(1);
    expect(semitonesToRatio(12)).toBeCloseTo(2, 6);
    expect(semitonesToRatio(7)).toBeCloseTo(1.4983, 4); // perfect fifth
  });

  it('tints the resolve note per the three spec-named reaches', () => {
    const base = ENCOUNTER_CELLO_ROOT_HZ * ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER;
    // Spec §3.3: "low fourth on Iron, open fifth on Eye, soft minor third on Heart".
    expect(resolveNoteFrequency('iron')).toBeCloseTo(base * semitonesToRatio(5), 4);
    expect(resolveNoteFrequency('eye')).toBeCloseTo(base * semitonesToRatio(7), 4);
    expect(resolveNoteFrequency('heart')).toBeCloseTo(base * semitonesToRatio(3), 4);
  });

  it('gives every reach a distinct resolve note', () => {
    const reaches = [
      'iron',
      'stone',
      'eye',
      'gold',
      'veil',
      'heart',
      'star',
      'shadow',
      'quintessence',
    ];
    const freqs = reaches.map((r) => Math.round(resolveNoteFrequency(r) * 100));
    expect(new Set(freqs).size).toBe(reaches.length);
  });

  it('falls back to the root for an unknown reach rather than throwing', () => {
    const base = ENCOUNTER_CELLO_ROOT_HZ * ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER;
    expect(resolveNoteFrequency('not_a_reach')).toBeCloseTo(base, 4);
  });

});

describe('encounterSoundDesign — fail-soft', () => {
  beforeEach(() => {
    __resetEncounterSoundDesign();
    __resetUiChannel();
  });
  afterEach(() => {
    __resetEncounterSoundDesign();
    __resetUiChannel();
  });

  it('no-ops silently when no AudioContext is available', () => {
    __setAudioContextFactory(() => null);
    expect(() => beginTensionReveal()).not.toThrow();
    expect(() => playResolveNote('iron')).not.toThrow();
    expect(() => endTensionReveal()).not.toThrow();
  });

  it('no-ops silently when the AudioContext constructor throws', () => {
    __setAudioContextFactory(() => {
      throw new Error('blocked by autoplay policy');
    });
    expect(() => beginTensionReveal()).not.toThrow();
    expect(() => playResolveNote('eye')).not.toThrow();
  });

  it('survives a node-scheduling failure mid-sequence', () => {
    const { context } = makeFakeContext();
    context.createOscillator = () => {
      throw new Error('node budget exhausted');
    };
    __setAudioContextFactory(() => context as unknown as AudioContext);
    expect(() => beginTensionReveal()).not.toThrow();
    expect(() => playResolveNote('heart')).not.toThrow();
  });
});

describe('encounterSoundDesign — Moment 1 scheduling', () => {
  beforeEach(() => {
    __resetEncounterSoundDesign();
    __resetUiChannel();
    unmuteUi();
  });
  afterEach(() => {
    __resetEncounterSoundDesign();
    __resetUiChannel();
  });

  it('schedules the inhale breath and the cello drone at commit', () => {
    const { context, started } = makeFakeContext();
    __setAudioContextFactory(() => context as unknown as AudioContext);

    beginTensionReveal();

    // One noise source (the held breath) and one oscillator (the drone).
    expect(started.filter((s) => s.type === 'noise')).toHaveLength(1);
    const drone = started.filter((s) => s.type === 'sawtooth');
    expect(drone).toHaveLength(1);
    // Spec §3.3: "Root only, no harmony" — the drone sits at the cello root.
    expect(drone[0].frequency).toBeCloseTo(ENCOUNTER_CELLO_ROOT_HZ, 2);
  });

  it('plays a sphere-tinted struck-string note at the resolve beat', () => {
    const { context, started } = makeFakeContext();
    __setAudioContextFactory(() => context as unknown as AudioContext);

    playResolveNote('eye');

    const struck = started.filter((s) => s.type === 'triangle');
    expect(struck).toHaveLength(1);
    expect(struck[0].frequency).toBeCloseTo(resolveNoteFrequency('eye'), 2);
    // Plus the barely-audible slackening-thread release.
    expect(started.filter((s) => s.type === 'noise')).toHaveLength(1);
  });

  it('schedules nothing while the UI channel is muted', () => {
    const { context, started } = makeFakeContext();
    __setAudioContextFactory(() => context as unknown as AudioContext);

    muteUi();
    beginTensionReveal();
    playResolveNote('iron');

    expect(started).toHaveLength(0);
  });
});
