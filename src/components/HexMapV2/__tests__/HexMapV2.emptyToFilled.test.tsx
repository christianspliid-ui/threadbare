// @vitest-environment jsdom
/**
 * THR-1817 — HexMapV2 must not change its hook count when `tiles` goes from
 * empty to non-empty. Two `useMemo` label filters used to sit after the
 * empty-state early return, so the first non-empty render threw "Rendered more
 * hooks than during the previous render" and took the map down.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// HexMapV2's sprite modules paint textures at import time; jsdom's canvas has
// no 2D context. Hand back an inert one (every member is a no-op that returns
// itself). WebGL stays null, so the scene init takes its fail-soft path.
vi.hoisted(() => {
  const inert: unknown = new Proxy(function () {}, {
    get: (_t, prop) => (prop === Symbol.toPrimitive ? () => 0 : inert),
    apply: () => inert,
    set: () => true,
  });
  HTMLCanvasElement.prototype.getContext = function (type: string) {
    return type === '2d' ? inert : null;
  } as unknown as HTMLCanvasElement['getContext'];
});
import HexMapV2 from '../HexMapV2';
import type { HexTile } from '../../../types';

function makeTile(col: number, row: number): HexTile {
  return {
    coord: { col, row },
    terrain: 'grassland',
    geoParams: { elevation: 0.3, temperature: 0.5, moisture: 0.5 },
  } as unknown as HexTile;
}

const baseProps = {
  cols: 2,
  rows: 2,
  hoveredHex: null,
  selectedHex: null,
  onHexClick: () => {},
  onHexHover: () => {},
};

describe('HexMapV2 empty → filled (THR-1817)', () => {
  it('re-renders from an empty grid to a non-empty grid without throwing', () => {
    // jsdom has no WebGL: the scene init logs and fails soft. Silence it.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { rerender, container } = render(<HexMapV2 {...baseProps} tiles={[]} />);
      expect(container.textContent).toContain('The world has not yet been shaped.');

      const tiles = [makeTile(0, 0), makeTile(1, 0), makeTile(0, 1), makeTile(1, 1)];
      expect(() => rerender(<HexMapV2 {...baseProps} tiles={tiles} />)).not.toThrow();
      expect(container.textContent).not.toContain('The world has not yet been shaped.');

      const hookOrderErrors = errorSpy.mock.calls
        .map(args => args.map(String).join(' '))
        .filter(msg => /Rendered (more|fewer) hooks|change in the order of Hooks/.test(msg));
      expect(hookOrderErrors).toEqual([]);
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it('declares no hook after the empty-state return', () => {
    const src = readFileSync(resolve(__dirname, '../HexMapV2.tsx'), 'utf8');
    const emptyReturn = src.indexOf('if (tiles.length === 0) {');
    expect(emptyReturn).toBeGreaterThan(-1);
    const afterReturn = src.slice(emptyReturn);
    expect(afterReturn).not.toMatch(/\buse[A-Z]\w*\(/);
  });
});
