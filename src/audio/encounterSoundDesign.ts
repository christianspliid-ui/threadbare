/**
 * Encounter sound design — Moment 1 tension reveal + Moment 2 registration cues.
 *
 * THR-346 (Encounter UI post-v1 H1). Spec:
 *   - Docs/plans/2026-05-04-encounter-ui-canonical.md §3.3 — Moment 1 cue table
 *   - Docs/plans/2026-05-04-encounter-ui-canonical.md §4.1 — effect-kind spheres
 *   - Docs/plans/2026-05-04-encounter-ui-canonical.md §4.3 #3 — first-registration gate
 *
 * Every cue is synthesized through the Web Audio API. Nothing is sampled and no
 * audio asset ships with this module, so there is no missing-asset failure mode
 * to degrade through — the only degradation is "no AudioContext", which this
 * module treats as silence rather than an error (NFP #4, fail-soft).
 *
 * Timing authority is the Web Audio clock, not React. `beginTensionReveal()`
 * schedules the whole inhale + thrum envelope up front at absolute context
 * times, so the cues land on the §3.3 table's millisecond boundaries regardless
 * of render jitter or a busy main thread.
 *
 * Mute follows the existing UI channel (`isUiMuted`), which is what
 * `AudioMaster.muteAll()` drives — so the master mute toggle already covers
 * these cues with no additional wiring.
 */
import {
  ENCOUNTER_CELLO_ROOT_HZ,
  ENCOUNTER_CUE_MASTER_GAIN,
  ENCOUNTER_INHALE_DB,
  ENCOUNTER_INHALE_DURATION_MS,
  ENCOUNTER_INHALE_LOWPASS_HZ,
  ENCOUNTER_REGISTRATION_ATTACK_MS,
  ENCOUNTER_REGISTRATION_DB,
  ENCOUNTER_REGISTRATION_DECAY_MS,
  ENCOUNTER_REGISTRATION_SEMITONES,
  ENCOUNTER_RELEASE_DB,
  ENCOUNTER_RESOLVE_ATTACK_MS,
  ENCOUNTER_RESOLVE_DB,
  ENCOUNTER_RESOLVE_DECAY_MS,
  ENCOUNTER_RESOLVE_DURATION_MS,
  ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER,
  ENCOUNTER_RESOLVE_SEMITONES,
  ENCOUNTER_RESOLVE_SEMITONES_FALLBACK,
  ENCOUNTER_THRUM_LOWPASS_HZ,
  ENCOUNTER_THRUM_PEAK_DB,
  ENCOUNTER_THRUM_PEAK_MS,
  ENCOUNTER_THRUM_RELEASE_MS,
  ENCOUNTER_THRUM_START_MS,
} from './audioConstants';
import { getUiVolume, isUiMuted } from './UiChannel';

// ── Pure helpers (exported for test — no AudioContext required) ──────

/** dBFS → linear gain. -28dB ≈ 0.0398, 0dB = 1. */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/** Semitone offset → frequency ratio. 12 semitones = 2×. */
export function semitonesToRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/**
 * Frequency of the sphere-tinted struck-string resolve note for a reach.
 * Unknown reaches fall back to the root rather than throwing (NFP #4).
 */
export function resolveNoteFrequency(reach: string): number {
  const semitones =
    ENCOUNTER_RESOLVE_SEMITONES[reach] ?? ENCOUNTER_RESOLVE_SEMITONES_FALLBACK;
  return (
    ENCOUNTER_CELLO_ROOT_HZ *
    ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER *
    semitonesToRatio(semitones)
  );
}

/** Frequency of the Moment 2 registration cue for an effect kind. */
export function registrationCueFrequency(kind: string): number {
  const semitones =
    ENCOUNTER_REGISTRATION_SEMITONES[kind] ?? ENCOUNTER_RESOLVE_SEMITONES_FALLBACK;
  return (
    ENCOUNTER_CELLO_ROOT_HZ *
    ENCOUNTER_RESOLVE_OCTAVE_MULTIPLIER *
    semitonesToRatio(semitones)
  );
}

// ── Context management (fail-soft) ───────────────────────────────────

type AudioContextFactory = () => AudioContext | null;

const defaultFactory: AudioContextFactory = () => {
  const Ctor =
    typeof window !== 'undefined'
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)
      : undefined;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
};

let factory: AudioContextFactory = defaultFactory;
let ctx: AudioContext | null = null;
let ctxUnavailable = false;

/** Live nodes for the in-flight Moment 1 sequence, so reset can stop them. */
let activeNodes: AudioScheduledSourceNode[] = [];

/**
 * Latch for canonical UI spec §4.3 #3 — "Audio is cued only on the *first*
 * registration". Reset at the start of each tension reveal so every resolution
 * gets exactly one registration cue, no cumulative jingle.
 */
let registrationCueFired = false;

function getContext(): AudioContext | null {
  if (ctxUnavailable) return null;
  if (ctx) return ctx;
  // The guard belongs here rather than only inside the default factory: a
  // browser can refuse to construct a context (autoplay policy, exhausted
  // context budget), and that must read as silence, not as a thrown error
  // tearing down the visual sequence (NFP #4).
  try {
    ctx = factory();
  } catch {
    ctx = null;
  }
  if (!ctx) {
    ctxUnavailable = true;
    return null;
  }
  return ctx;
}

/**
 * Effective linear gain for a cue, folding in the UI channel volume and mute.
 * Returns 0 when muted, which callers treat as "skip scheduling entirely".
 */
function cueGain(db: number): number {
  if (isUiMuted()) return 0;
  return dbToGain(db) * getUiVolume() * ENCOUNTER_CUE_MASTER_GAIN;
}

function track(node: AudioScheduledSourceNode): void {
  activeNodes.push(node);
  node.onended = () => {
    activeNodes = activeNodes.filter((n) => n !== node);
  };
}

/** Short noise buffer used for the breath and the thread-release whisper. */
function makeNoiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// ── Moment 1 — tension reveal ────────────────────────────────────────

/**
 * Schedule the full Moment 1 cue bed: held breath, then the cello drone
 * swelling to its taut-beat peak and releasing.
 *
 * Called at commit. The resolve note is NOT scheduled here — it fires from
 * `playResolveNote()` at the resolving beat, because the chosen reach (and so
 * the note's sphere tint) is only known then.
 *
 * Safe to call repeatedly; a second call cancels the first.
 */
export function beginTensionReveal(): void {
  registrationCueFired = false;
  stopActiveNodes();

  const context = getContext();
  if (!context) return;

  try {
    void context.resume?.();
    const t0 = context.currentTime;

    // ── Inhale: held breath, mono center, low-passed at 800Hz ──
    const inhaleGain = cueGain(ENCOUNTER_INHALE_DB);
    if (inhaleGain > 0) {
      const seconds = ENCOUNTER_INHALE_DURATION_MS / 1000;
      const noise = context.createBufferSource();
      noise.buffer = makeNoiseBuffer(context, seconds);

      const lp = context.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = ENCOUNTER_INHALE_LOWPASS_HZ;

      const env = context.createGain();
      // Breath in, hold, and stop before the drone takes over.
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(inhaleGain, t0 + seconds * 0.55);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);

      noise.connect(lp).connect(env).connect(context.destination);
      noise.start(t0);
      noise.stop(t0 + seconds);
      track(noise);
    }

    // ── Thrum: cello drone, root only, no harmony ──
    const thrumGain = cueGain(ENCOUNTER_THRUM_PEAK_DB);
    if (thrumGain > 0) {
      const start = t0 + ENCOUNTER_THRUM_START_MS / 1000;
      const peak = t0 + ENCOUNTER_THRUM_PEAK_MS / 1000;
      const end = t0 + ENCOUNTER_THRUM_RELEASE_MS / 1000;

      // Sawtooth through a low low-pass reads as bowed; a sine reads as a test tone.
      const osc = context.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = ENCOUNTER_CELLO_ROOT_HZ;

      const lp = context.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = ENCOUNTER_THRUM_LOWPASS_HZ;

      const env = context.createGain();
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(thrumGain, peak);
      env.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(lp).connect(env).connect(context.destination);
      osc.start(start);
      osc.stop(end);
      track(osc);
    }
  } catch {
    // Any scheduling failure leaves the visual sequence untouched (NFP #4).
  }
}

/**
 * The sphere-tinted struck-string resolve node, plus the barely-audible
 * release the slackening threads emit. Fired at the resolving beat.
 */
export function playResolveNote(reach: string): void {
  const context = getContext();
  if (!context) return;

  try {
    void context.resume?.();
    const t0 = context.currentTime;

    const noteGain = cueGain(ENCOUNTER_RESOLVE_DB);
    if (noteGain > 0) {
      const attack = ENCOUNTER_RESOLVE_ATTACK_MS / 1000;
      const decay = ENCOUNTER_RESOLVE_DECAY_MS / 1000;

      const osc = context.createOscillator();
      // Triangle — a struck string, not a bowed one.
      osc.type = 'triangle';
      osc.frequency.value = resolveNoteFrequency(reach);

      const env = context.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(noteGain, t0 + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

      osc.connect(env).connect(context.destination);
      osc.start(t0);
      osc.stop(t0 + attack + decay);
      track(osc);
    }

    // ── Release: fingertip leaving wet thread ──
    const releaseGain = cueGain(ENCOUNTER_RELEASE_DB);
    if (releaseGain > 0) {
      const seconds = ENCOUNTER_RESOLVE_DURATION_MS / 1000;
      const noise = context.createBufferSource();
      noise.buffer = makeNoiseBuffer(context, seconds);

      const hp = context.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;

      const env = context.createGain();
      env.gain.setValueAtTime(releaseGain, t0);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);

      noise.connect(hp).connect(env).connect(context.destination);
      noise.start(t0);
      noise.stop(t0 + seconds);
      track(noise);
    }
  } catch {
    // Fail-soft.
  }
}

// ── Moment 2 — registration cues ─────────────────────────────────────

/**
 * Fire the Moment 2 registration cue for an effect kind.
 *
 * Canonical UI spec §4.3 #3: only the FIRST registration of a resolution is
 * cued — "Further effects land in the silence the resolve cue leaves behind.
 * No cumulative jingle." The latch is held here rather than in the sequencing
 * hook so the rule holds no matter which landing settles first, and whether or
 * not `useEffectSequencing` is the thing driving them.
 *
 * The latch resets on `beginTensionReveal()` (next resolution) or
 * `resetRegistrationCueLatch()`.
 */
export function playRegistrationCue(kind: string): void {
  if (registrationCueFired) return;
  registrationCueFired = true;

  const context = getContext();
  if (!context) return;

  try {
    void context.resume?.();
    const t0 = context.currentTime;

    const gain = cueGain(ENCOUNTER_REGISTRATION_DB);
    if (gain <= 0) return;

    const attack = ENCOUNTER_REGISTRATION_ATTACK_MS / 1000;
    const decay = ENCOUNTER_REGISTRATION_DECAY_MS / 1000;

    const osc = context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = registrationCueFrequency(kind);

    const env = context.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

    osc.connect(env).connect(context.destination);
    osc.start(t0);
    osc.stop(t0 + attack + decay);
    track(osc);
  } catch {
    // Fail-soft.
  }
}

/** True once a registration cue has fired for the current resolution. */
export function hasRegistrationCueFired(): boolean {
  return registrationCueFired;
}

/** Re-arm the first-registration gate without starting a new reveal. */
export function resetRegistrationCueLatch(): void {
  registrationCueFired = false;
}

// ── Teardown ─────────────────────────────────────────────────────────

function stopActiveNodes(): void {
  for (const node of activeNodes) {
    try {
      node.stop();
    } catch {
      // Already stopped, or never started — nothing to do.
    }
  }
  activeNodes = [];
}

/**
 * Stop every in-flight cue. Called when a reveal is cancelled or the
 * consuming component unmounts, so a torn-down encounter leaves no drone
 * hanging.
 */
export function endTensionReveal(): void {
  stopActiveNodes();
}

// ── Test seams ───────────────────────────────────────────────────────

/** Inject a fake AudioContext factory. Tests only. */
export function __setAudioContextFactory(next: AudioContextFactory | null): void {
  factory = next ?? defaultFactory;
  ctx = null;
  ctxUnavailable = false;
}

/** Reset all module state. Tests only. */
export function __resetEncounterSoundDesign(): void {
  stopActiveNodes();
  factory = defaultFactory;
  ctx = null;
  ctxUnavailable = false;
  registrationCueFired = false;
}
