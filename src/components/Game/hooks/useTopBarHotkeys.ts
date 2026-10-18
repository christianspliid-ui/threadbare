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
