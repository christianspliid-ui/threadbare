// ── ProseTtsButton (THR-348) ────────────────────────────────────────
// Small play/stop control that narrates a block of encounter prose in the
// Kokoro encounter voice. Consumes the D3 adapter in
// `src/services/narration/encounterNarration.ts`.
//
// Fail-soft by construction (D3 spec line 5): when narration is disabled,
// never probed, or in terminal error the button renders nothing at all, so
// the surrounding encounter UI is unchanged. A failed utterance logs a
// warning and restores the idle affordance — it never surfaces an error
// state into the scene.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Play, Square } from 'lucide-react';
import {
  useEncounterNarration,
  type EncounterTtsContext,
  type TtsHandle,
} from '../../../services/narration/encounterNarration';

/** Button edge length in px — matches the HexChronicle narrate control. */
const TTS_BUTTON_SIZE = 20;
/** Icon sizes, keyed to the button edge. */
const TTS_ICON_SIZE = 10;
const TTS_STOP_ICON_SIZE = 8;

export interface ProseTtsButtonProps {
  /**
   * Prose to narrate. An array is treated as ordered paragraphs; a string is
   * split on blank lines. Empty/whitespace content hides the button.
   */
  text: string | readonly string[];
  /** Optional inert scene metadata (D3 spec line 4 — never affects synthesis). */
  context?: EncounterTtsContext;
  /** Accessible label for the idle state. */
  label?: string;
  /** Extra styles merged onto the button. */
  style?: React.CSSProperties;
}

export function ProseTtsButton({
  text,
  context,
  label = 'Narrate this scene',
  style,
}: ProseTtsButtonProps) {
  const { enabled, isSpeaking, isLoading, needsOptIn, canNarrate, enable, speakEncounter, stop } =
    useEncounterNarration();
  const handleRef = useRef<TtsHandle | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // Cancel our own utterance if the scene unmounts mid-sentence — this is the
  // "closing the modal cancels playback" half of the D3 cancellation contract.
  useEffect(() => {
    return () => {
      handleRef.current?.cancel();
      handleRef.current = null;
    };
  }, []);

  // A new scene's prose supersedes the old one's audio.
  const textKey = Array.isArray(text) ? text.join(' ') : String(text);
  useEffect(() => {
    handleRef.current?.cancel();
    handleRef.current = null;
  }, [textKey]);

  const hasText = textKey.trim().length > 0;

  const onClick = useCallback(async () => {
    if (needsOptIn) {
      void enable();
      return;
    }
    if (isSpeaking) {
      handleRef.current?.cancel();
      handleRef.current = null;
      stop();
      return;
    }
    setDispatching(true);
    try {
      handleRef.current = await speakEncounter(text, { context });
    } catch (err) {
      // Fail-soft: the scene stays interactive; only the affordance resets.
      console.warn('[ProseTtsButton] narration unavailable:', err);
      handleRef.current = null;
    } finally {
      setDispatching(false);
    }
  }, [needsOptIn, enable, isSpeaking, stop, speakEncounter, text, context]);

  // Nothing to say, or nothing that can say it — render nothing.
  if (!enabled || !hasText) return null;
  if (!canNarrate && !needsOptIn) return null;

  const busy = isLoading || dispatching;
  const title = needsOptIn
    ? 'Download voice narration (~90MB)'
    : isSpeaking
      ? 'Stop narration'
      : busy
        ? 'Loading…'
        : label;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      data-testid="prose-tts-button"
      style={{
        width: TTS_BUTTON_SIZE,
        height: TTS_BUTTON_SIZE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '1px solid rgba(212, 175, 55, 0.28)',
        background: 'transparent',
        cursor: busy ? 'wait' : 'pointer',
        color: isSpeaking ? 'var(--accent-gold)' : 'var(--text-tertiary)',
        padding: 0,
        flexShrink: 0,
        transition: 'color 0.2s, border-color 0.2s',
        ...style,
      }}
    >
      {busy ? (
        <Loader2 size={TTS_ICON_SIZE} style={{ animation: 'spin 1s linear infinite' }} />
      ) : isSpeaking ? (
        <Square size={TTS_STOP_ICON_SIZE} />
      ) : (
        <Play size={TTS_ICON_SIZE} style={{ marginLeft: '1px' }} />
      )}
    </button>
  );
}
