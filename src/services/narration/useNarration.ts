// ── useNarration React Hook ─────────────────────────────────────────
// Exposes NarrationService state to React components with automatic
// subscription management. Dual-mode: server or browser worker backend.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getNarrationService, type NarrationState } from './NarrationService';
import type { NarrationStatus } from './TtsBackend';
import { NARRATION_ENABLED } from './narrationConstants';

const DISABLED_STATE: NarrationState = {
  status: 'idle', loadProgress: 0, error: null, backendType: null,
};

export function useNarration() {
  const service = useRef(getNarrationService());
  const [state, setState] = useState<NarrationState>(() => {
    if (!NARRATION_ENABLED) return DISABLED_STATE;
    return service.current.getState();
  });

  useEffect(() => {
    if (!NARRATION_ENABLED) return;
    const unsubscribe = service.current.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // Auto-probe on mount (checks origin, probes server on localhost)
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

  const init = useCallback(async () => {
    if (!NARRATION_ENABLED) return;
    await service.current.init();
  }, []);

  /** Opt-in: download the ~92MB browser TTS model. */
  const initWorker = useCallback(async () => {
    if (!NARRATION_ENABLED) return;
    service.current.ensureAudioContext();
    await service.current.initWorker();
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!NARRATION_ENABLED) return;
    service.current.ensureAudioContext();
    await service.current.speak(text);
  }, []);

  const speakSections = useCallback(async (sections: string[]) => {
    if (!NARRATION_ENABLED) return;
    service.current.ensureAudioContext();
    await service.current.speakSections(sections);
  }, []);

  const stop = useCallback(() => {
    service.current.stop();
  }, []);

  const narrateChronicle = useCallback(async (containerEl: HTMLElement | null) => {
    if (!containerEl || !NARRATION_ENABLED) return;
    const proseElements = containerEl.querySelectorAll('.chronicle-prose');
    const sections: string[] = [];
    for (const el of proseElements) {
      const text = (el as HTMLElement).innerText?.trim();
      if (text) sections.push(text);
    }
    if (sections.length === 0) return;
    await speakSections(sections);
  }, [speakSections]);

  // Derived: enabled means feature flag is on AND status is not terminal error
  const enabled = NARRATION_ENABLED && state.status !== 'error';
  const status: NarrationStatus = state.status;

  return {
    enabled,
    status,
    backendType: state.backendType,
    loadProgress: state.loadProgress,
    error: state.error,
    isSpeaking: state.status === 'speaking',
    isLoading: state.status === 'loading',
    isAvailable: state.status === 'available',
    init,
    initWorker,
    speak,
    speakSections,
    stop,
    narrateChronicle,
  };
}
