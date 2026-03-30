// @vitest-environment jsdom
/**
 * WIRE-01 verification: notification hex click → camera animation chain.
 *
 * Verifies that useNotificationNavigation correctly dispatches 'hex' targets
 * to the onFocusHex callback with the correct col/row values.
 *
 * The full chain is:
 *   ToastStack/AlertBar click → onNavigate(target) → handleNotificationNavigate
 *   → useNotificationNavigation dispatch → case 'hex': deps.onFocusHex(target.col, target.row)
 *   → GameView.tsx:429 onFocusHex → hexMapRef.current.centerOn(px.x, -px.y, scale)
 *   → HexMapV2 imperative handle → animateCameraTo(canvas, zoom, x, y, scale, JUMP_TO_DURATION_MS)
 */
import { describe, it, expect, vi } from 'vitest';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
import type { NavigationTarget } from '../../../types/notification';

// useNotificationNavigation is a React hook using useCallback.
// renderHook is needed to call it in the hook rules environment.
import { renderHook } from '@testing-library/react';

describe('useNotificationNavigation — WIRE-01 camera chain', () => {
  it('calls onFocusHex with correct col/row when target kind is hex', () => {
    const onSelectAgent = vi.fn();
    const onFocusHex = vi.fn();

    const { result } = renderHook(() =>
      useNotificationNavigation({ onSelectAgent, onFocusHex })
    );

    const target: NavigationTarget = { kind: 'hex', col: 5, row: 3 };
    result.current(target);

    expect(onFocusHex).toHaveBeenCalledOnce();
    expect(onFocusHex).toHaveBeenCalledWith(5, 3);
    expect(onSelectAgent).not.toHaveBeenCalled();
  });

  it('does not call onFocusHex for agent targets', () => {
    const onSelectAgent = vi.fn();
    const onFocusHex = vi.fn();

    const { result } = renderHook(() =>
      useNotificationNavigation({ onSelectAgent, onFocusHex })
    );

    const target: NavigationTarget = { kind: 'agent', agentId: 'agent.alice' };
    result.current(target);

    expect(onFocusHex).not.toHaveBeenCalled();
    expect(onSelectAgent).toHaveBeenCalledWith('agent.alice');
  });

  it('onFocusHex callback signature matches GameView usage (col: number, row: number)', () => {
    // Type-level check: the function should accept exactly (col: number, row: number).
    // If this compiles and the hook returns a function that accepts NavigationTarget,
    // the chain is type-safe end-to-end.
    const onFocusHex = vi.fn<[col: number, row: number], void>();
    const onSelectAgent = vi.fn();

    const { result } = renderHook(() =>
      useNotificationNavigation({ onSelectAgent, onFocusHex })
    );

    expect(typeof result.current).toBe('function');

    // Dispatch a hex target — verifies runtime dispatch works correctly
    result.current({ kind: 'hex', col: 0, row: 0 });
    expect(onFocusHex).toHaveBeenCalledWith(0, 0);
  });

  it('returns the same callback reference across re-renders (memoized)', () => {
    const onSelectAgent = vi.fn();
    const onFocusHex = vi.fn();

    const { result, rerender } = renderHook(() =>
      useNotificationNavigation({ onSelectAgent, onFocusHex })
    );

    const firstRef = result.current;
    rerender();
    // useCallback with stable deps should return the same reference
    expect(result.current).toBe(firstRef);
  });
});
