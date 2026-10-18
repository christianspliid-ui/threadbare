/**
 * The top bar's fit: one row, and a fixed order of what gives way (THR-1875, frame plan § F3).
 *
 * The bar measures its own overflow (`scrollWidth − clientWidth`). While it overflows it
 * applies the next step of `TOP_BAR_YIELD_ORDER`; when room returns it undoes the last
 * step, but only once the bar has the width that step needed plus
 * `TOP_BAR_YIELD_HYSTERESIS_PX`, so a one-pixel change never flips it. Nothing hides and
 * no control loses its word: each step moves text one hover away (Law 57).
 *
 * Pure; `topBarFit.test.tsx` drives it with stubbed widths.
 */
import { useLayoutEffect, useState, type RefObject } from 'react';
import { TOP_BAR_YIELD_ORDER, type TopBarYieldStep } from '../../../data/frame-registry';

/** Room needed beyond the exact fit before a yield step undoes. */
export const TOP_BAR_YIELD_HYSTERESIS_PX = 16;

export interface TopBarYieldState {
  /** Steps applied, in `TOP_BAR_YIELD_ORDER` order. */
  applied: number;
  /** The bar's `scrollWidth` when each applied step was taken: the width it needs to undo. */
  needAt: readonly number[];
}

export const INITIAL_TOP_BAR_YIELD: TopBarYieldState = { applied: 0, needAt: [] };

export interface TopBarMeasure {
  scrollWidth: number;
  clientWidth: number;
}

/** One step of the fit: apply the next yield on overflow, undo the last when room returns. */
export function stepTopBarYield(s: TopBarYieldState, m: TopBarMeasure): TopBarYieldState {
  const overflow = m.scrollWidth - m.clientWidth;
  if (overflow > 0.5 && s.applied < TOP_BAR_YIELD_ORDER.length) {
    return { applied: s.applied + 1, needAt: [...s.needAt, m.scrollWidth] };
  }
  if (overflow <= 0.5 && s.applied > 0) {
    const need = s.needAt[s.applied - 1] ?? Infinity;
    if (m.clientWidth >= need + TOP_BAR_YIELD_HYSTERESIS_PX) {
      return { applied: s.applied - 1, needAt: s.needAt.slice(0, -1) };
    }
  }
  return s;
}

/** The steps applied, by name. */
export function yieldedSteps(s: TopBarYieldState): TopBarYieldStep[] {
  return TOP_BAR_YIELD_ORDER.slice(0, s.applied);
}

/**
 * Measure the bar after each render and on resize, stepping the fit until it settles.
 * `contentKey` changes when what the bar shows changes (a reveal, a held name), so the
 * fit re-runs. Fail-soft: without a ResizeObserver it measures once per content change.
 */
export function useTopBarYield(barRef: RefObject<HTMLElement | null>, contentKey: string): TopBarYieldStep[] {
  const [state, setState] = useState<TopBarYieldState>(INITIAL_TOP_BAR_YIELD);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const measure = () => setState(prev => stepTopBarYield(prev, { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    // New content re-fits from no yield: a step taken for text that has since gone (the
    // direction line, a long held-by name) must not stay applied (review gate, THR-1875).
    // Layout effects run before paint, so the re-fit never flashes an overflowing bar.
    // From no yield: if steps were applied, `applied` changes and the effect below re-measures
    // the bar as it lays out without them; if none were, this measure is already the real one.
    setState(stepTopBarYield(INITIAL_TOP_BAR_YIELD, { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [barRef, contentKey]);

  // Each applied or undone step changes the layout: measure again until it settles.
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    setState(prev => stepTopBarYield(prev, { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  }, [barRef, state.applied]);

  return yieldedSteps(state);
}
