import { useCallback, useEffect, type KeyboardEvent, type RefObject } from 'react';
import { FOCUSABLE_SELECTOR } from './focusableSelector';

/**
 * Law 50 — focus follows the surface: opening an overlay moves keyboard focus into
 * it, Tab cycles within it while modal, and closing returns focus to the invoking
 * element.
 *
 * One definition, two readers — the same shape as {@link FOCUSABLE_SELECTOR}:
 * - `Modal` owns the common case and calls this for every one of its consumers.
 * - `DetailModal` renders a *stack* of fixed-size panels with per-depth dimming and
 *   its own z-band, so it cannot take `Modal`'s layout (see the note there) — but it
 *   takes the contract from here rather than copying it.
 *
 * THR-1079 fixed focus in the primitive precisely so no consumer would hand-roll a
 * second focus trap, "which is itself the Law 26/27 defect". Extracting the contract
 * keeps that true for a consumer whose *layout* cannot compose: there is still exactly
 * one implementation of Law 50 in the codebase, and widening it is a change here.
 *
 * @param panelRef The element that owns the trap. Must carry `tabIndex={-1}` so it can
 *   take focus itself when it holds no focusable controls.
 * @param active Whether the dialog is currently present and should hold focus. Flipping
 *   this to `false` restores focus to the invoker, so an animating-out overlay hands
 *   focus back when it starts closing rather than when it finishes.
 */
export function useDialogFocus<T extends HTMLElement>(
  panelRef: RefObject<T | null>,
  active: boolean,
): { onKeyDown: (e: KeyboardEvent<T>) => void } {
  useEffect(() => {
    if (!active) return;

    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    if (panel) {
      // The panel itself is the fallback target, so an overlay with no controls
      // still takes focus off the page behind it.
      (panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel).focus();
    }

    return () => {
      // Fail-soft (NFP #4): the invoker may have unmounted while we were open —
      // a row that opened a sheet and was then filtered out of its list.
      if (invoker?.isConnected) invoker.focus();
    };
  }, [active, panelRef]);

  /**
   * Tab cycles within the overlay while modal. Scoped to the panel rather than the
   * document so stacked or nested overlays each trap their own subtree: they portal
   * to `document.body` independently, so an outer panel is not an ancestor of an
   * inner one and never sees its keystrokes.
   */
  const onKeyDown = useCallback(
    (e: KeyboardEvent<T>) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        // Nothing to cycle to; hold focus here rather than let it escape behind.
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [panelRef],
  );

  return { onKeyDown };
}
