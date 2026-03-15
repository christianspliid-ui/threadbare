import { describe, it, expect } from 'vitest';
import type { ToastItem } from '../../../types/notification';
import { toastStackTestHelpers } from '../ToastStack';

describe('ToastStack helpers', () => {
  it('formats count badge for collapsed toasts', () => {
    expect(toastStackTestHelpers.formatCount(3)).toBe('×3');
  });

  it('returns empty string for count of 1', () => {
    expect(toastStackTestHelpers.formatCount(1)).toBe('');
  });

  it('filters expired toasts', () => {
    const toasts: ToastItem[] = [
      { id: 't1', message: 'A', count: 1, createdTick: 1, expiresAt: 500 },
      { id: 't2', message: 'B', count: 1, createdTick: 2, expiresAt: 2000 },
    ];
    const active = toastStackTestHelpers.filterActive(toasts, 1000);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('t2');
  });
});
