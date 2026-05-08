// ── Encounter Narration Seam ────────────────────────────────────────
// Single import seam that encounter UI components (Phase C/D) call into.
// v1 body is a literal pass-through of `useNarration`. H3 (post-v1) will
// extend this seam — per-beat supersession discipline, hover-skip,
// prose-section sequencing — without touching any encounter component.
// See Docs/plans/2026-05-07-tts-encounter-discovery-report.md.

import { useNarration } from './useNarration';

export interface EncounterNarrationApi {
  enabled: boolean;
  isSpeaking: boolean;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export function useEncounterNarration(): EncounterNarrationApi {
  const { enabled, isSpeaking, speak, stop } = useNarration();
  return { enabled, isSpeaking, speak, stop };
}
