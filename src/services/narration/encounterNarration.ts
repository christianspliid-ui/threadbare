// -- Encounter UI narration adapter ---------------------------------
// Implements the D3 interface spec in
// `Docs/plans/2026-05-05-tts-encounter-ui-spec.md` as a thin adapter over
// the existing NarrationService / useNarration surfaces (THR-348).
//
// The spec's five lines, and where each is honoured below:
//   1. speakEncounter(text, voice, options) => Promise<TtsHandle>
//   2. voice is a Kokoro voice id; encounter default is ENCOUNTER_NARRATION_VOICE
//   3. TtsHandle.cancel() stops playback, aborts generation, leaves state ready
//   4. EncounterTtsContext is metadata only — never reaches synthesis
//   5. Failures fail-soft: rejected promise, no synchronous throw

import { useCallback, useMemo } from 'react';
import { getNarrationService } from './NarrationService';
import { useNarration } from './useNarration';
import {
  ENCOUNTER_NARRATION_MAX_SECTIONS,
  ENCOUNTER_NARRATION_MAX_SECTION_LENGTH,
  ENCOUNTER_NARRATION_VOICE,
  NARRATION_ENABLED,
  NARRATION_SPEED,
} from './narrationConstants';

/**
 * Optional metadata about the scene being narrated. Spec line 4: this is
 * inert — it is never passed to the synthesis backend, so narration stays
 * deterministic for a given (text, voice, speed).
 */
export interface EncounterTtsContext {
  encounterId?: string;
  stepId?: string;
  actorId?: string;
  threadTier?: string;
}

export interface SpeakEncounterOptions {
  speed?: number;
  context?: EncounterTtsContext;
  /** 'single' narrates one block; 'sections' paces paragraph by paragraph. */
  mode?: 'single' | 'sections';
}

/** Handle over one dispatched utterance (spec line 3). */
export interface TtsHandle {
  /** Generation id owning playback at dispatch time. */
  readonly id: number;
  /** Resolves when generation finishes or the utterance is cancelled. */
  readonly done: Promise<void>;
  /**
   * Stop playback and abort in-flight generation. Idempotent, and a no-op
   * once a *different* utterance has taken over playback.
   */
  cancel(): void;
}

/** Reason a speakEncounter call could not dispatch. Never thrown synchronously. */
export class EncounterNarrationError extends Error {
  // Declared and assigned explicitly — `erasableSyntaxOnly` forbids
  // TypeScript constructor parameter properties.
  readonly reason: 'disabled' | 'empty-text' | 'backend-unavailable';

  constructor(
    message: string,
    reason: 'disabled' | 'empty-text' | 'backend-unavailable',
  ) {
    super(message);
    this.name = 'EncounterNarrationError';
    this.reason = reason;
  }
}

/**
 * Normalise arbitrary prose into the section list the backend accepts:
 * trimmed, blank-dropped, per-section length clamped, and capped in count.
 * Exported for tests — pure, no service access.
 */
export function toNarrationSections(
  text: string | readonly string[],
  mode: 'single' | 'sections' = 'sections',
): string[] {
  const raw = Array.isArray(text) ? [...text] : [String(text)];
  const split = mode === 'sections'
    ? raw.flatMap(block => String(block).split(/\n{2,}/))
    : [raw.join(' ')];

  const sections = split
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map(s => (s.length > ENCOUNTER_NARRATION_MAX_SECTION_LENGTH
      ? s.slice(0, ENCOUNTER_NARRATION_MAX_SECTION_LENGTH)
      : s));

  return sections.slice(0, ENCOUNTER_NARRATION_MAX_SECTIONS);
}

/**
 * Narrate encounter prose in the Kokoro encounter voice (spec line 1).
 *
 * Resolves as soon as the utterance is *dispatched* — not when playback ends
 * — so the returned handle can still abort in-flight generation, which is
 * what spec line 3 requires of `cancel()`. Await `handle.done` for completion.
 *
 * Fail-soft (spec line 5): every failure path rejects; nothing throws
 * synchronously, and the encounter UI is never left non-interactive.
 */
export async function speakEncounter(
  text: string | readonly string[],
  voice: string = ENCOUNTER_NARRATION_VOICE,
  options: SpeakEncounterOptions = {},
): Promise<TtsHandle> {
  if (!NARRATION_ENABLED) {
    throw new EncounterNarrationError('Narration is disabled.', 'disabled');
  }

  const sections = toNarrationSections(text, options.mode ?? 'sections');
  if (sections.length === 0) {
    throw new EncounterNarrationError('No narratable prose supplied.', 'empty-text');
  }

  const service = getNarrationService();
  // `context` is deliberately unused: spec line 4 keeps it metadata-only.
  const speed = options.speed ?? NARRATION_SPEED;

  // Dispatch without awaiting — speakSections runs its guards and bumps the
  // generation id synchronously, so the id below is this utterance's own.
  const done = service.speakSections(sections, voice, speed).catch((err) => {
    console.warn('[EncounterNarration] speak failed:', err);
  });
  const id = service.currentUtteranceId;

  if (!service.isSpeaking && service.status !== 'ready') {
    throw new EncounterNarrationError(
      `Narration backend unavailable (status: ${service.status}).`,
      'backend-unavailable',
    );
  }

  return {
    id,
    done,
    cancel() {
      // Only stop if this utterance still owns playback — a stale handle
      // must not silence narration that started after it.
      if (getNarrationService().currentUtteranceId === id) {
        getNarrationService().stop();
      }
    },
  };
}

export interface EncounterNarrationApi {
  /** True iff narration is enabled and not in terminal error. */
  readonly enabled: boolean;
  /** True while audio is actively playing. */
  readonly isSpeaking: boolean;
  /** True while a backend is initialising. */
  readonly isLoading: boolean;
  /** True when a backend exists but the model still needs opting into. */
  readonly needsOptIn: boolean;
  /** True when narration can actually be started right now. */
  readonly canNarrate: boolean;
  /** Begin the opt-in model download (~92MB, worker backend). */
  enable(): Promise<void>;
  /** Speak a single block of prose. Cancels any in-flight narration. */
  speak(text: string): Promise<void>;
  /** Speak encounter prose, returning the cancellable handle (D3 spec). */
  speakEncounter(
    text: string | readonly string[],
    options?: SpeakEncounterOptions,
  ): Promise<TtsHandle>;
  /** Stop any in-flight narration. Idempotent. */
  stop(): void;
}

export function useEncounterNarration(): EncounterNarrationApi {
  const {
    enabled, isSpeaking, isLoading, isAvailable, status, speak, stop, initWorker,
  } = useNarration();

  const speakEncounterBound = useCallback(
    (text: string | readonly string[], options?: SpeakEncounterOptions) =>
      speakEncounter(text, ENCOUNTER_NARRATION_VOICE, options),
    [],
  );

  // `isAvailable` means a backend was found but the model is not loaded yet;
  // `idle` means narration never probed. Neither can speak.
  const needsOptIn = Boolean(enabled && isAvailable);
  const canNarrate = Boolean(enabled && status !== 'idle' && !isAvailable);

  return useMemo(() => ({
    enabled,
    isSpeaking,
    isLoading,
    needsOptIn,
    canNarrate,
    enable: initWorker,
    speak,
    speakEncounter: speakEncounterBound,
    stop,
  }), [
    enabled, isSpeaking, isLoading, needsOptIn, canNarrate,
    initWorker, speak, speakEncounterBound, stop,
  ]);
}
