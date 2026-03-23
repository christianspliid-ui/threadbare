// ── useNarration React Hook ─────────────────────────────────────────
// Exposes NarrationService state to React components with automatic
// subscription management.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getNarrationService, type NarrationState } from './NarrationService';
import { NARRATION_ENABLED, NARRATION_SECTION_PAUSE } from './narrationConstants';

const DISABLED_STATE: NarrationState = { status: 'idle', loadProgress: 0, error: null };

export function useNarration() {
  const service = useRef(getNarrationService());
  const [state, setState] = useState<NarrationState>(() => {
    if (!NARRATION_ENABLED) return DISABLED_STATE;
    return service.current.getState();
  });

  // Subscribe to service state changes
  useEffect(() => {
    if (!NARRATION_ENABLED) return;
    const unsubscribe = service.current.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Probe the TTS server on mount so the button shows ready/error state
  useEffect(() => {
    if (!NARRATION_ENABLED) return;
    service.current.init();
  }, []);

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      if (service.current.isSpeaking) {
        service.current.stop();
      }
    };
  }, []);

  /** Initialize (probe TTS server). */
  const init = useCallback(async () => {
    if (!NARRATION_ENABLED) return;
    await service.current.init();
  }, []);

  /** Narrate text via the TTS server. */
  const speak = useCallback(async (text: string) => {
    if (!NARRATION_ENABLED) return;
    const svc = service.current;

    // CRITICAL: Create AudioContext NOW, during the user gesture (click).
    svc.ensureAudioContext();

    await svc.speak(text);
  }, []);

  /** Stop current narration. */
  const stop = useCallback(() => {
    service.current.stop();
  }, []);

  /**
   * Extract and concatenate chronicle text from a container element.
   * Reads innerText from .chronicle-prose paragraphs and joins with pauses.
   */
  const narrateChronicle = useCallback(async (containerEl: HTMLElement | null) => {
    if (!containerEl || !NARRATION_ENABLED) return;

    const proseElements = containerEl.querySelectorAll('.chronicle-prose');
    const texts: string[] = [];
    for (const el of proseElements) {
      const text = (el as HTMLElement).innerText?.trim();
      if (text) texts.push(text);
    }

    if (texts.length === 0) return;

    const fullText = texts.join(NARRATION_SECTION_PAUSE);
    await speak(fullText);
  }, [speak]);

  return {
    enabled: NARRATION_ENABLED,
    status: state.status,
    loadProgress: state.loadProgress,
    error: state.error,
    isSpeaking: state.status === 'speaking',
    isLoading: state.status === 'loading',
    init,
    speak,
    stop,
    narrateChronicle,
  };
}
