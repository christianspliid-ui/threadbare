import { describe, it, expect, vi } from 'vitest';
import { alertBarTestHelpers } from '../AlertBar';
import { ICON_FOR_ALERT } from '../../../data/icons/conceptIcons';

describe('AlertBar helpers (THR-1906 — carved icons)', () => {
  it('maps alert kinds to their ICON_FOR_ALERT entry', () => {
    for (const [kind, icon] of Object.entries(ICON_FOR_ALERT)) {
      expect(alertBarTestHelpers.getIcon(kind as keyof typeof ICON_FOR_ALERT)).toBe(icon);
    }
  });

  it('draws the fallback mark for an unknown kind, and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(alertBarTestHelpers.getIcon('unknown' as never)).toBe('fallback');
    warn.mockRestore();
  });
});
