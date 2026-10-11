import { useCallback, useEffect, useRef, useState } from 'react';
import type { HexCoord } from '../../../types';
import { INTERACTION_CONSTANTS } from './HexRaycaster';

function coordKey(coord: HexCoord | null): string | null {
  return coord ? `${coord.col},${coord.row}` : null;
}

/**
 * Hover-tooltip timing for the hex map.
 *
 * `tooltipHex` trails `hoveredHex` by `TOOLTIP_HOVER_DELAY_MS`: the highlight
 * follows the pointer at once, the HTML tooltip only once the pointer rests.
 *
 * THR-1818 — `suppressTooltip()` (called on every map click) hides the tooltip
 * and cancels a pending one, and keeps it hidden while the pointer stays on the
 * hex it was over. Before this, a click opened the detail column and the old
 * tooltip stayed drawn on top of it, or a pending timer drew it a beat later.
 * The suppression lifts the moment the pointer reaches a different hex, or
 * leaves the map.
 */
export function useHexTooltipDelay(hoveredHex: HexCoord | null): {
  tooltipHex: HexCoord | null;
  suppressTooltip: () => void;
} {
  const [tooltipHex, setTooltipHex] = useState<HexCoord | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedKeyRef = useRef<string | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  hoveredKeyRef.current = coordKey(hoveredHex);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();
    const key = coordKey(hoveredHex);
    if (key !== suppressedKeyRef.current) suppressedKeyRef.current = null;
    if (hoveredHex === null || key === suppressedKeyRef.current) {
      setTooltipHex(null);
    } else {
      timerRef.current = setTimeout(() => {
        setTooltipHex(hoveredHex);
        timerRef.current = null;
      }, INTERACTION_CONSTANTS.TOOLTIP_HOVER_DELAY_MS);
    }
    return clearTimer;
  }, [hoveredHex]);

  const suppressTooltip = useCallback(() => {
    clearTimer();
    suppressedKeyRef.current = hoveredKeyRef.current;
    setTooltipHex(null);
  }, []);

  return { tooltipHex, suppressTooltip };
}
