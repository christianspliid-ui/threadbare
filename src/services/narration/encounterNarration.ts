// -- Encounter UI narration adapter ---------------------------------
// 5-line spec consumed by encounter UI (Phase C/D components).
// Implementation in H3 (post-v1) wires real call sites; this file
// exists now so encounter UI can build against the contract.

import { useNarration } from './useNarration';

export interface EncounterNarrationApi {
  /** True iff narration is enabled and not in terminal error. */
  readonly enabled: boolean;
  /** True while audio is actively playing. */
  readonly isSpeaking: boolean;
  /** Speak a single block of prose. Cancels any in-flight narration. */
  speak(text: string): Promise<void>;
  /** Stop any in-flight narration. Idempotent. */
  stop(): void;
}

export function useEncounterNarration(): EncounterNarrationApi {
  const { enabled, isSpeaking, speak, stop } = useNarration();
  return { enabled, isSpeaking, speak, stop };
}