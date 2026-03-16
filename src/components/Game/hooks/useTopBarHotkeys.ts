import { useEffect } from 'react';
import { SPEED_STEPS } from '../SimulationControls';

interface UseTopBarHotkeysProps {
  running: boolean;
  speed: number;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onStep: () => void;
}

function isInputActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.hasAttribute('contenteditable');
}

export function useTopBarHotkeys({ running, speed, onToggle, onSpeedChange, onStep }: UseTopBarHotkeysProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputActive()) return;

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
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [running, speed, onToggle, onSpeedChange, onStep]);
}
