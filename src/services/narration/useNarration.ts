// ── useNarration React Hook ─────────────────────────────────────────
// Exposes NarrationService state to React components with automatic
// subscription management.

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { getNarrationService, type NarrationState } from './NarrationService';
import { NARRATION_ENABLED, NARRATION_SECTION_PAUSE } from './narrationConstants';

const DISABLED_STATE: NarrationState = { status: 'idle', loadProgress: 0, error: null };

export function useNarration() {
  const service = useRef(getNarrationService());

  const state = useSyncExternalStore(
    useCallback((cb) => {
      if (!NARRATION_ENABLED) return () => {};
      return service.current.subscribe(cb);
    }, []),
    useCallback(() => {
      if (!NARRATION_ENABLED) return DISABLED_STATE;
      return service.current.getState();
    }, []),
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop playback if component unmounts while speaking
      if (service.current.isSpeaking) {
        service.current.stop();
      }
    };
  }, []);

  /** Initialize the model (call from user gesture for AudioContext). */
  const init = useCallback(async () => {
    if (!NARRATION_ENABLED) return;
    await service.current.init();
  }, []);

  /** Narrate text. If model isn't loaded yet, loads it first. */
  const speak = useCallback(async (text: string) => {
    if (!NARRATION_ENABLED) return;
    const svc = service.current;
    if (svc.status === 'idle' || svc.status === 'error') {
      await svc.init();
      // Wait for ready, then speak
      const unsubscribe = svc.subscribe((s) => {
        if (s.status === 'ready') {
          unsubscribe();
          svc.speak(text);
        }
      });
      return;
    }
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
