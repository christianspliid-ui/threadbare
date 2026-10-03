// @vitest-environment jsdom
/**
 * ToastStack anchors to the map area, not the viewport (THR-1711 item 5).
 *
 * The stack was `fixed right-4 bottom-4`, so it sat over the right sidebar and
 * covered the Chronicle. GameView mounts it inside the map area's `relative`
 * box; `absolute` keeps it inside that box.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { ToastStack } from '../ToastStack';

describe('ToastStack — anchored inside the map area (THR-1711)', () => {
  it('positions absolutely, never fixed to the viewport', () => {
    render(
      <ToastStack
        toasts={[{ id: 't1', message: 'A road opens', count: 1, createdTick: 1, expiresAt: Date.now() + 10000 }]}
        onDismiss={vi.fn()}
      />,
    );
    const stack = screen.getByTestId('toast-stack');
    expect(stack.className.split(/\s+/)).toContain('absolute');
    expect(stack.className.split(/\s+/)).not.toContain('fixed');
  });

  it('GameView mounts it inside the relative map area, before the map', () => {
    // `absolute` is only correct while the mount stays inside the map's
    // `relative` box — pin that half of the contract too.
    const src = readFileSync(resolve(__dirname, '../GameView.tsx'), 'utf8');
    const mapArea = src.indexOf('{/* ── Center: map / hex zoom / location ── */}');
    const mount = src.indexOf('<ToastStack', mapArea);
    const map = src.indexOf('<HexMapV2', mapArea);
    expect(mapArea).toBeGreaterThan(-1);
    expect(mount).toBeGreaterThan(mapArea);
    expect(mount).toBeLessThan(map);
    expect(src.slice(mapArea, mount)).toMatch(/className="flex-1 overflow-hidden relative"/);
  });
});
