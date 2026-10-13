import { useEffect } from 'react';
import { SPEED_STEPS } from '../SimulationControls';
import { mapLensForKey, type MapLensId } from '../../../data/map-lenses';

interface UseTopBarHotkeysProps {
  running: boolean;
  speed: number;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onStep: () => void;
  onMoveClick?: () => void;
  /** THR-1750 — toggle a map lens by its registry key (`1`–`5`, THR-1831). */
  onToggleLens?: (lens: MapLensId) => void;
}

function isInputActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.hasAttribute('contenteditable');
}

export function useTopBarHotkeys({ running, speed, onToggle, onSpeedChange, onStep, onMoveClick, onToggleLens }: UseTopBarHotkeysProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputActive()) return;

      // THR-1750 — map lens keys come from the lens registry, never a hard-coded digit.
      const lens = !e.ctrlKey && !e.metaKey && !e.altKey ? mapLensForKey(e.key) : undefined;
      if (lens && onToggleLens) {
        onToggleLens(lens.id);
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
  }, [running, speed, onToggle, onSpeedChange, onStep, onMoveClick, onToggleLens]);
}
