/**
 * layoutContract — the lock on the 1440p layout contract (THR-1819).
 *
 * Reads `index.css` the way `dialogContextTokens.test.ts` does and checks five
 * things: CSS ↔ TS parity per tier, the type scale's steps, the root step-up
 * block, the map-share budget at the three designed screens, and the tier edges.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  CINZEL_MIN_PX,
  FRAME_MAP_SHARE_MIN,
  FRAME_MAP_SHARE_MIN_INSPECTOR,
  FRAME_TOKENS_PX,
  LAYOUT_BREAKPOINTS_PX,
  MEASURE_PROSE_EM,
  MODAL_MAX_HEIGHT_VH,
  ROOT_FONT_STEP,
  TEXT_TOKENS_REM,
  TYPE_FLOOR_PX,
  TYPE_MIN_STEP_PX,
  TYPE_SCALE_REM,
  layoutTierFor,
  mapShare,
  remToPx,
  rootFontPx,
  type FrameTokens,
  type LayoutTier,
} from '../layoutContract';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../../../index.css'), 'utf8');

/** The body of the first `{ … }` after `start`, braces balanced. */
function blockAfter(start: number): string {
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error('unbalanced block');
}

/** The `:root { … }` declarations for a tier: the base `:root` in `@layer base`, or the `@media (min-width: N)` block's. */
function rootBlock(tier: LayoutTier): string {
  if (tier === 'base') {
    const at = css.indexOf('@layer base');
    const rootAt = css.indexOf(':root', at);
    return blockAfter(rootAt);
  }
  const marker = `@media (min-width: ${LAYOUT_BREAKPOINTS_PX[tier]}px) {`;
  const at = css.indexOf(marker);
  if (at < 0) throw new Error(`missing ${marker}`);
  const media = blockAfter(at);
  const rootAt = media.indexOf(':root');
  if (rootAt < 0) throw new Error(`no :root in ${marker}`);
  const open = media.indexOf('{', rootAt);
  return media.slice(open + 1, media.indexOf('}', open));
}

function decl(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'));
  return m?.[1].trim();
}

const TIERS: LayoutTier[] = ['base', 'fhd', 'qhd', 'uwqhd'];
const FRAME_NAMES = Object.keys(FRAME_TOKENS_PX.base) as (keyof FrameTokens)[];

describe('layoutContract — CSS ↔ TS parity', () => {
  for (const tier of TIERS) {
    it(`every frame token matches index.css at ${tier}`, () => {
      const block = rootBlock(tier);
      for (const name of FRAME_NAMES) {
        expect(decl(block, name), `${name} at ${tier}`).toBe(`${FRAME_TOKENS_PX[tier][name]}px`);
      }
    });
  }

  it('text-container tokens, the prose measure and the modal cap match', () => {
    const base = rootBlock('base');
    expect(decl(base, '--tooltip-max-w')).toBe(`${TEXT_TOKENS_REM.tooltipMaxW}rem`);
    expect(decl(base, '--hovercard-w')).toBe(`${TEXT_TOKENS_REM.hovercardW}rem`);
    expect(decl(base, '--toast-w')).toBe(`${TEXT_TOKENS_REM.toastW}rem`);
    expect(decl(base, '--stage-compact-w')).toBe(`${TEXT_TOKENS_REM.stageCompactW}rem`);
    expect(decl(base, '--dialog-s-w')).toBe(`${TEXT_TOKENS_REM.dialogSW}rem`);
    expect(decl(base, '--dialog-m-w')).toBe(`${TEXT_TOKENS_REM.dialogMW}rem`);
    expect(decl(rootBlock('fhd'), '--panel-padding')).toBe(`${TEXT_TOKENS_REM.panelPaddingFhd}rem`);
    expect(decl(base, '--measure-prose')).toBe(`${MEASURE_PROSE_EM}em`);
    expect(decl(base, '--modal-max-h')).toBe(`${MODAL_MAX_HEIGHT_VH}vh`);
  });

  it('the six --text-* steps match TYPE_SCALE_REM', () => {
    const base = rootBlock('base');
    for (const [step, rem] of Object.entries(TYPE_SCALE_REM)) {
      expect(decl(base, `--text-${step}`), `--text-${step}`).toBe(`${rem}rem`);
    }
  });

  it('the retired right-sidebar token is gone (replaced by --rail-right-w)', () => {
    // Spelled in two parts so a repo grep for the retired name comes back empty.
    expect(css).not.toContain(['--sidebar', 'width'].join('-'));
  });
});

describe('layoutContract — the type scale', () => {
  const steps = Object.values(TYPE_SCALE_REM).map((rem) => rem * 16);

  it('adjacent steps differ by at least TYPE_MIN_STEP_PX at a 16 px root', () => {
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i] - steps[i - 1]).toBeGreaterThanOrEqual(TYPE_MIN_STEP_PX);
    }
  });

  it('the floor, the prose step and the Cinzel minimum sit where the contract says', () => {
    expect(TYPE_SCALE_REM.xs * 16).toBe(TYPE_FLOOR_PX);
    const names = Object.keys(TYPE_SCALE_REM);
    expect(names.indexOf('base')).toBe(names.indexOf('sm') + 1);
    expect(TYPE_SCALE_REM.lg * 16).toBe(CINZEL_MIN_PX);
  });

  it('the body default is UI text and the prose shorthands run at 1.6', () => {
    expect(css).toMatch(/body\s*\{[^}]*font-size:\s*var\(--text-sm\)/);
    expect(decl(rootBlock('base'), '--type-body-prose')).toMatch(/var\(--text-base\)\/1\.6\b/);
    expect(decl(rootBlock('base'), '--type-flavor')).toMatch(/var\(--text-base\)\/1\.6\b/);
  });
});

describe('layoutContract — the root step-up', () => {
  it('the stylesheet carries the guarded 112.5% step', () => {
    const marker = `@media (min-width: ${ROOT_FONT_STEP.minWidthPx}px) and (min-height: ${ROOT_FONT_STEP.minHeightPx}px)`;
    const at = css.indexOf(marker);
    expect(at, marker).toBeGreaterThan(-1);
    const body = blockAfter(at);
    expect(body).toMatch(new RegExp(`html\\s*\\{\\s*font-size:\\s*${ROOT_FONT_STEP.scale * 100}%`));
  });
});

describe('layoutContract — the map-share budget', () => {
  const screens: { w: number; h: number }[] = [
    { w: 1920, h: 1080 },
    { w: 2560, h: 1440 },
    { w: 3440, h: 1440 },
  ];
  for (const screen of screens) {
    const t = FRAME_TOKENS_PX[layoutTierFor(screen.w)];
    const top = t['--topbar-height'];
    it(`${screen.w}×${screen.h}: both rails open ≥ FRAME_MAP_SHARE_MIN`, () => {
      expect(mapShare(screen, t['--rail-left-w'] + t['--rail-right-w'], top)).toBeGreaterThanOrEqual(FRAME_MAP_SHARE_MIN);
    });
    it(`${screen.w}×${screen.h}: rail + strip + docked Inspector ≥ FRAME_MAP_SHARE_MIN_INSPECTOR`, () => {
      const cols = t['--rail-left-w'] + t['--rail-strip-w'] + t['--inspector-w'];
      expect(mapShare(screen, cols, top)).toBeGreaterThanOrEqual(FRAME_MAP_SHARE_MIN_INSPECTOR);
    });
  }

  it('reproduces the plan’s 1080p figure (0.627)', () => {
    expect(mapShare({ w: 1920, h: 1080 }, 660, 48)).toBeCloseTo(0.627, 3);
  });
});

describe('layoutContract — tiers and fail-soft', () => {
  it('layoutTierFor reads the tier edges', () => {
    expect(layoutTierFor(1919)).toBe('base');
    expect(layoutTierFor(1920)).toBe('fhd');
    expect(layoutTierFor(2560)).toBe('qhd');
    expect(layoutTierFor(3440)).toBe('uwqhd');
    expect(layoutTierFor(Number.NaN)).toBe('base');
  });

  it('rootFontPx falls back to 16 outside a styled DOM', () => {
    expect(rootFontPx()).toBe(16);
    expect(remToPx(17.5)).toBe(280);
  });
});
