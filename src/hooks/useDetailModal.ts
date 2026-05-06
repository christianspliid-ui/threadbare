import type { DetailPage } from '../types/detailPage';
import {
  DETAIL_AMBIENT_DUCK_DB,
  DETAIL_BEAT_INDICATOR_OPACITY_PAUSED,
} from '../types/detailPage';
import { useDetailStack } from '../contexts/DetailModalStackContext';

/**
 * Hook for opening and closing detail modals from any encounter UI component.
 *
 * Consumers:
 * - Call `openDetail(page)` to push a new detail page onto the stack.
 * - Observe `isOpen` to dim the beat indicator (DETAIL_BEAT_INDICATOR_OPACITY_PAUSED)
 *   and duck ambient audio (DETAIL_AMBIENT_DUCK_DB) — encounter shell responsibility.
 * - ESC / ← are handled globally by DetailModalStackProvider; no per-component
 *   key bindings needed.
 */
export function useDetailModal() {
  const { push, pop, replace, stack, isOpen } = useDetailStack();

  return {
    /** Push a new detail page. Trail is auto-extended from the current top. */
    openDetail: (page: DetailPage) => push(page),
    /** Close the topmost detail page. */
    closeDetail: () => pop(),
    /** Replace the topmost detail page in-place. */
    replaceDetail: (page: DetailPage) => replace(page),
    /** Current detail page stack (oldest first). */
    stack,
    /** True when at least one detail page is open. */
    isOpen,
    /** Encounter shell contract: when open, dim the beat indicator to this opacity. */
    pausedBeatIndicatorOpacity: isOpen ? DETAIL_BEAT_INDICATOR_OPACITY_PAUSED : 1,
    /** Encounter shell contract: when open, duck ambient by this amount in dB. */
    ambientDuckDb: isOpen ? DETAIL_AMBIENT_DUCK_DB : 0,
  };
}
