import { useEffect } from 'react';
import { SPEED_STEPS } from '../SimulationControls';
import { mapLensForKey, type MapLensId } from '../../../data/map-lenses';
import { TOP_BAR_KEYS } from '../../../data/top-bar-keys';
import { LEDGER_RAIL_HOTKEY, NEEDS_YOU_HOTKEY } from '../../../data/frame-registry';

interface UseTopBarHotkeysProps {
  running: boolean;
  speed: number;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onStep: () => void;
  onMoveClick?: () => void;
  /** THR-1750 — toggle a map lens by its registry key (`1`–`5`, THR-1831). */
  onToggleLens?: (lens: MapLensId) => void;
  /** THR-1893 — the Ledger rail's key (`LEDGER_RAIL_HOTKEY`, frame plan § F10). */
  onLedgerKey?: () => void;
  /** THR-1875 — Needs you's key (`NEEDS_YOU_HOTKEY`); the handler does nothing while the pill is hidden. */
  onNeedsYouKey?: () => void;
}

function isInputActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.hasAttribute('contenteditable');
}

/**
 * THR-2167 — the controls Space activates natively (or by their own key handler). When one
 * holds *keyboard* focus, Space belongs to it: toggling the clock too made one keypress do
 * two things. A control focused by a mouse click (not `:focus-visible`) keeps the old
 * contract — Space runs the clock, and its `preventDefault` stops the native press — so
 * clicking a lens and then pressing Space still pauses. Controls with their own Space
 * handler (`role="button"` divs such as Doom) call `preventDefault`, which the hotkey
 * honours whatever the focus modality.
 */
const ACTIVATABLE_SELECTOR = 'button, a[href], select, summary, [role="button"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="switch"], [role="option"]';

export function isActivatableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  const control = (target as Element).closest(ACTIVATABLE_SELECTOR);
  if (!control) return false;
  try {
    return (target as Element).matches(':focus-visible');
  } catch {
    // No `:focus-visible` support: treat the focus as keyboard focus (the safe reading —
    // the focused control gets its own key).
    return true;
  }
}

export function useTopBarHotkeys({ running, speed, onToggle, onSpeedChange, onStep, onMoveClick, onToggleLens, onLedgerKey, onNeedsYouKey }: UseTopBarHotkeysProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputActive()) return;

      // THR-1750 — map lens keys come from the lens registry, never a hard-coded digit.
      const lens = !e.ctrlKey && !e.metaKey && !e.altKey ? mapLensForKey(e.key) : undefined;
      if (lens && onToggleLens) {
        onToggleLens(lens.id);
        return;
      }

      // THR-1900 — the keys this hook answers are one list, checked against the map's keys.
      if (!TOP_BAR_KEYS.includes(e.key)) return;

      // THR-1893 — the frame's keys come from its registry entries, never a literal here.
      if (e.key.toLowerCase() === LEDGER_RAIL_HOTKEY) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) onLedgerKey?.();
        return;
      }
      if (e.key.toLowerCase() === NEEDS_YOU_HOTKEY) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) onNeedsYouKey?.();
        return;
      }

      switch (e.key) {
        case ' ': {
          // THR-2167: Space on a focused control is that control's press, not the clock's.
          if (e.defaultPrevented || isActivatableTarget(e.target)) return;
          e.preventDefault();
          onToggle();
          break;
        }
        case '+':
        case '=': {
          const idx = SPEED_STEPS.indexOf(speed);
          const next = SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)];
          if (next !== undefined && next !== speed) onSpeedChange(next);
          break;
        }
        case '-': {
          const idx = SPEED_STEPS.indexOf(speed);
          const prev = SPEED_STEPS[Math.max(idx - 1, 0)];
          if (prev !== undefined && prev !== speed) onSpeedChange(prev);
          break;
        }
        case '.': {
          if (!running) onStep();
          break;
        }
        case 'm':
        case 'M': {
          onMoveClick?.();
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [running, speed, onToggle, onSpeedChange, onStep, onMoveClick, onToggleLens, onLedgerKey, onNeedsYouKey]);
}
