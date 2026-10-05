/**
 * One-click remembrance choice (THR-1716 U4).
 *
 * Before THR-1716 every picture screen took a click to zoom and a second click to
 * confirm. Now one click chooses: the chosen picture takes the enlarged composition
 * the zoom used to show, and the screen holds briefly before it moves on. During
 * the hold, "Choose again" and Escape return to the row (Law 23). Arrow keys move
 * focus along the row and Enter chooses — the row's pictures are native buttons.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { REMEMBRANCE_CHOOSE_AGAIN } from '../../data/ui-content';

/** How long the chosen stirring picture holds, with "Choose again", before the flow moves on. */
export const STIRRING_CHOSEN_HOLD_MS = 1200;
/** Same, for the drive screen. */
export const DRIVE_CHOSEN_HOLD_MS = 1000;
/** Delay from choosing an origin to the naming field appearing. */
export const ORIGIN_NAMING_REVEAL_MS = 600;
/** Delay from choosing a hunger to the court step appearing. */
export const TRANSFORMATION_COURT_REVEAL_MS = 700;

/** Marks a picture in a choice row, for arrow-key focus movement. */
export const CHOICE_ATTR = 'data-remembrance-choice';

interface UseRemembranceChoiceOptions<T> {
  /** How long the chosen state holds before `onHoldEnd` fires. */
  holdMs: number;
  /** Fires once when the hold ends without an undo. */
  onHoldEnd: (item: T) => void;
  /**
   * True: the hold end commits the choice — no undo after it (stirring, drive,
   * whose `onHoldEnd` advances the flow). False: the choice stays undoable until
   * the screen's own Continue (origin, transformation).
   */
  lockOnHoldEnd: boolean;
  /** Escape / "Choose again" are ignored while this is false. Defaults to true. */
  undoable?: boolean;
}

export interface RemembranceChoice<T> {
  chosen: T | null;
  /** The hold has run out for the current choice. */
  holdEnded: boolean;
  choose: (item: T) => void;
  chooseAgain: () => void;
}

export function useRemembranceChoice<T>({
  holdMs,
  onHoldEnd,
  lockOnHoldEnd,
  undoable = true,
}: UseRemembranceChoiceOptions<T>): RemembranceChoice<T> {
  const [chosen, setChosen] = useState<T | null>(null);
  const [holdEnded, setHoldEnded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockedRef = useRef(false);
  const onHoldEndRef = useRef(onHoldEnd);
  onHoldEndRef.current = onHoldEnd;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const choose = useCallback((item: T) => {
    if (lockedRef.current) return;
    clearTimer();
    setChosen(item);
    setHoldEnded(false);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (lockOnHoldEnd) lockedRef.current = true;
      setHoldEnded(true);
      onHoldEndRef.current(item);
    }, holdMs);
  }, [clearTimer, holdMs, lockOnHoldEnd]);

  const chooseAgain = useCallback(() => {
    if (lockedRef.current || !undoable) return;
    clearTimer();
    setChosen(null);
    setHoldEnded(false);
  }, [clearTimer, undoable]);

  // A hold timer never outlives the screen.
  useEffect(() => clearTimer, [clearTimer]);

  // Escape undoes while a choice is up and still undoable (Law 23).
  useEffect(() => {
    if (chosen === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || lockedRef.current || !undoable) return;
      e.preventDefault();
      chooseAgain();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chosen, chooseAgain, undoable]);

  return { chosen, holdEnded, choose, chooseAgain };
}

/** Left/Right move focus along a row of `CHOICE_ATTR` pictures; Enter clicks the focused one natively. */
export function handleChoiceRowKeyDown(e: ReactKeyboardEvent<HTMLElement>): void {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(`[${CHOICE_ATTR}]`));
  if (buttons.length === 0) return;
  const at = buttons.indexOf(document.activeElement as HTMLElement);
  const step = e.key === 'ArrowRight' ? 1 : -1;
  const next = at < 0 ? 0 : (at + step + buttons.length) % buttons.length;
  e.preventDefault();
  buttons[next].focus();
}

/** The "Choose again" text button shown while a choice holds. */
export function ChooseAgainButton({ onClick, color = 'rgba(160,140,180,0.6)' }: { onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="remembrance-choose-again"
      className="remembrance-choice cursor-pointer"
      style={{
        background: 'transparent',
        border: 'none',
        padding: '8px 12px',
        fontFamily: 'var(--font-prose)',
        fontStyle: 'italic',
        fontSize: '1rem',
        color,
        letterSpacing: '0.08em',
        transition: 'color 0.3s ease',
      }}
    >
      {REMEMBRANCE_CHOOSE_AGAIN}
    </button>
  );
}
