/**
 * The Inspector's keys (THR-1911, plan § D3): `W` cycles the size; Alt+← and Alt+→ walk
 * the history. Esc is not here — it goes through the escape stack (`useEscapeLayer`), so
 * an armed card or a dialog above the Inspector takes it first.
 *
 * `W` is declared once, in `INSPECTOR_HOTKEYS` (`top-bar-keys.ts`), and spread into
 * `TOP_BAR_KEYS`, so the key-overlap test covers it. The Alt+arrow pair is modifier-
 * qualified: the map's pan keys ignore any key pressed with Alt (`useMapHotkeys`).
 * Skipped while an input has focus.
 */
import { useEffect, useRef } from 'react';
import { INSPECTOR_HOTKEYS, INSPECTOR_HISTORY_KEYS } from '../../../data/top-bar-keys';

function isInputActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.hasAttribute('contenteditable');
}

export interface InspectorHotkeyHandlers {
  open: boolean;
  onCycleSize: () => void;
  onBack: () => void;
  onForward: () => void;
}

export function useInspectorHotkeys(handlers: InspectorHotkeyHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const h = ref.current;
      if (!h.open || e.defaultPrevented || isInputActive()) return;
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === INSPECTOR_HISTORY_KEYS.back) {
          e.preventDefault();
          h.onBack();
        } else if (e.key === INSPECTOR_HISTORY_KEYS.forward) {
          e.preventDefault();
          h.onForward();
        }
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      if (INSPECTOR_HOTKEYS.includes(e.key)) {
        e.preventDefault();
        h.onCycleSize();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
