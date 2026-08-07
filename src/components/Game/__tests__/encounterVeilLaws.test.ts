/**
 * encounterVeilLaws — machine gates for THR-1010's five law migrations.
 *
 * The Law Book's Enforcement clause says "a law a machine can check should
 * acquire its check in the same PR that first relies on it". Four of the five
 * here are checkable by reading source and `index.css`; the fifth (reduced
 * motion) is asserted in `EncounterVeil.test.tsx` where the component renders.
 *
 * These are source-shape gates on purpose. A snapshot of the rendered veil
 * would go green on a re-introduced `transition: all` — the property is legal
 * CSS and paints fine — which is exactly how the drift survived until the
 * 2026-08-06 review found it by reading the file.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoSrc = resolve(here, '../../..');

const read = (rel: string) => readFileSync(resolve(repoSrc, rel), 'utf8');

/**
 * Source with comments removed, for the "this literal must not appear" gates.
 *
 * Without this the gates fail on their own documentation: the migration
 * comments necessarily *quote* the drifted gold and the sub-floor token to
 * explain what was replaced and why. A gate that forbids naming the thing it
 * removed forces the next author to delete the explanation to go green, which
 * is the opposite of what it is for.
 *
 * Block comments (including JSX `{/* ... *​/}`) go first, then whole-line `//`
 * and continuation `*` lines — deliberately not touching inline trailing
 * comments, so nothing inside a string literal can be eaten by accident.
 */
const readCode = (rel: string): string =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('//') && !t.startsWith('*');
    })
    .join('\n');

const VEIL = 'components/Game/EncounterVeil.tsx';
const SHELL = 'components/Game/encounter-stage/shells/NudgePhaseShell.tsx';
const CSS = 'index.css';

// ── WCAG helpers ───────────────────────────────────────────────────

/** sRGB channel → linear. WCAG 2.x definition. */
function linearize(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite `fg` at `alpha` over an opaque `bg`, the way the browser does. */
function composite(
  fg: [number, number, number],
  alpha: number,
  bg: [number, number, number],
): [number, number, number] {
  return [
    fg[0] * alpha + bg[0] * (1 - alpha),
    fg[1] * alpha + bg[1] * (1 - alpha),
    fg[2] * alpha + bg[2] * (1 - alpha),
  ];
}

function parseHex(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a 6-digit hex: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Resolve a token's declared value out of the `:root` block in index.css.
 *
 * Comments are stripped first, and not as a nicety: a token's *documentation*
 * routinely names other tokens ("same pattern as --veil-gold-rgb: one value,
 * many alphas"), and an earlier comment mentioning a token would otherwise
 * shadow its real declaration and resolve to prose.
 */
function tokenValue(css: string, name: string): string {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(code);
  if (!m) throw new Error(`token --${name} not declared in index.css`);
  return m[1].trim();
}

/**
 * A veil text token as composited RGB over `--veil-void`. Accepts the two forms
 * the palette actually uses: an opaque hex, or `rgba(r, g, b, a)`.
 */
function resolveVeilText(css: string, name: string): [number, number, number] {
  const void_ = parseHex(tokenValue(css, 'veil-void'));
  const raw = tokenValue(css, name);
  const rgba = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/.exec(raw);
  if (rgba) {
    return composite(
      [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])],
      Number(rgba[4]),
      void_,
    );
  }
  return parseHex(raw);
}

// ── Law 30 — tokens only, one gold ─────────────────────────────────

describe('Law 30 — the ceremonial palette is tokens, and there is one gold', () => {
  it('declares the veil tokens in index.css', () => {
    const css = read(CSS);
    for (const token of [
      'veil-void',
      'veil-gold',
      'veil-gold-rgb',
      'veil-gold-dim',
      'veil-text-bright',
      'veil-text-warm',
      'veil-text-warm-dim',
      'veil-text-whisper',
      'veil-text-ghost',
      'veil-text-atmosphere',
    ]) {
      expect(() => tokenValue(css, token)).not.toThrow();
    }
  });

  it('resolves --veil-gold to the game-wide --accent-gold, so only one gold is live', () => {
    const css = read(CSS);
    expect(tokenValue(css, 'veil-gold')).toBe('var(--accent-gold)');
  });

  it('keeps --veil-gold-rgb in step with --accent-gold', () => {
    const css = read(CSS);
    const [r, g, b] = parseHex(tokenValue(css, 'accent-gold'));
    // Space-separated channels, the `rgb(... / a)` form the veil composes with.
    expect(tokenValue(css, 'veil-gold-rgb')).toBe(`${r} ${g} ${b}`);
  });

  it('leaves no hardcoded ceremonial hex in the veil or the nudge shell', () => {
    for (const file of [VEIL, SHELL]) {
      const src = readCode(file);
      // The pre-THR-1010 gold, and the three raw tone literals it travelled with.
      expect(src, `${file} still declares the drifted gold`).not.toMatch(/#d4af37/i);
      expect(src, `${file} still has raw gold rgba()`).not.toMatch(/rgba\(\s*212,\s*175,\s*55/);
      expect(src, `${file} still has raw warm rgba()`).not.toMatch(/rgba\(\s*212,\s*196,\s*158/);
      expect(src, `${file} still has raw whisper rgba()`).not.toMatch(/rgba\(\s*180,\s*170,\s*150/);
      expect(src, `${file} still has raw ghost rgba()`).not.toMatch(/rgba\(\s*160,\s*140,\s*130/);
    }
  });
});

// ── Law 41 — no `transition: all`, anywhere ────────────────────────

describe('Law 41 — transitions are property-scoped', () => {
  it('has no `transition: all` in the veil or the nudge shell', () => {
    for (const file of [VEIL, SHELL]) {
      const offenders = read(file)
        .split('\n')
        .map((line, i) => [i + 1, line] as const)
        .filter(([, line]) => /transition:\s*(['"`])?all\b/.test(line));
      expect(offenders, `${file} lines: ${offenders.map(([n]) => n).join(', ')}`).toEqual([]);
    }
  });
});

// ── Law 45 — information-bearing text meets AA ─────────────────────

describe('Law 45 — veil text tones meet WCAG AA against --veil-void', () => {
  const AA = 4.5;

  it.each([
    'veil-text-bright',
    'veil-text-warm',
    'veil-text-warm-dim',
    'veil-text-whisper',
    'veil-text-ghost',
  ])('%s is at least AA', (token) => {
    const css = read(CSS);
    const ratio = contrastRatio(
      resolveVeilText(css, token),
      parseHex(tokenValue(css, 'veil-void')),
    );
    expect(ratio, `--${token} measured ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA);
  });

  it('--veil-gold-text meets AA — gold carrying words is text, not decoration', () => {
    // Found only by measuring the *composed* surface: the veil's gold labels
    // are `--veil-gold` at a per-element alpha, so the source reads as "the
    // gold token" while painting 2.5:1. Law 45 does not exempt an accent.
    const css = read(CSS);
    const alpha = /--veil-gold-text:\s*rgb\(var\(--veil-gold-rgb\)\s*\/\s*([\d.]+)\)/.exec(
      css.replace(/\/\*[\s\S]*?\*\//g, ''),
    );
    expect(alpha, '--veil-gold-text must be the gold at a declared alpha').not.toBeNull();
    const gold = parseHex(tokenValue(css, 'accent-gold'));
    const void_ = parseHex(tokenValue(css, 'veil-void'));
    const ratio = contrastRatio(composite(gold, Number(alpha![1]), void_), void_);
    expect(ratio, `--veil-gold-text measured ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA);
  });

  it('keeps --veil-text-atmosphere below the floor, so it cannot be mistaken for an AA tone', () => {
    // Not a bug: Law 45 legalises sub-floor tones for pure atmosphere. The
    // assertion is that the *escape hatch stays visibly an escape hatch* — if
    // someone raises it to AA it should be merged into the tones above, not
    // left as a second name for the same thing.
    const css = read(CSS);
    const ratio = contrastRatio(
      resolveVeilText(css, 'veil-text-atmosphere'),
      parseHex(tokenValue(css, 'veil-void')),
    );
    expect(ratio).toBeLessThan(AA);
  });

  it('does not use the atmosphere tone for anything in the veil yet', () => {
    // It exists as the sanctioned home for a future decorative use. If a use
    // appears, this expectation is the prompt to justify it in review rather
    // than a reason to keep the tone unused forever.
    expect(readCode(VEIL)).not.toContain('--veil-text-atmosphere');
  });
});

// ── Law 46 / Law 23 — hit areas and focus rings ────────────────────

describe('Law 46 — small targets carry a >=24px hit area', () => {
  it('sizes the boost pip button to the same floor as the step navigator', () => {
    const src = read(VEIL);
    const hit = /const BOOST_PIP_MIN_HIT_PX = (\d+);/.exec(src);
    const dot = /const BOOST_PIP_DOT_PX = (\d+);/.exec(src);
    const step = /const STEP_NAV_MIN_HIT_PX = (\d+);/.exec(src);
    expect(hit).not.toBeNull();
    expect(dot).not.toBeNull();
    expect(Number(hit![1])).toBeGreaterThanOrEqual(24);
    expect(Number(hit![1])).toBe(Number(step![1]));
    // The visual dot stays small — the padding is what grew.
    expect(Number(dot![1])).toBeLessThan(Number(hit![1]));
  });
});

describe('Law 23 — :focus-visible is never suppressed', () => {
  it('has no inline `outline: none` left in src/components', () => {
    // Walked from the component tree rather than a hardcoded file list: a new
    // surface that reintroduces the pattern should fail here, not be missed
    // because the list was written before it existed (THR-688 rule A).
    const offenders = walkComponents().filter((f) =>
      /outline:\s*['"]none['"]/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders.map((f) => f.replace(repoSrc, ''))).toEqual([]);
  });

  it('declares the .focus-ring utility with focus-visible winning on order', () => {
    const css = read(CSS);
    const notVisible = css.indexOf('.focus-ring:focus:not(:focus-visible)');
    const visible = css.indexOf('.focus-ring:focus-visible');
    expect(notVisible).toBeGreaterThan(-1);
    expect(visible).toBeGreaterThan(-1);
    // Equal specificity — the later rule wins, so this ordering is the whole
    // mechanism, not a formatting preference.
    expect(visible).toBeGreaterThan(notVisible);
  });
});

function walkComponents(): string[] {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = resolve(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry)) out.push(full);
    }
  };
  walk(resolve(repoSrc, 'components'));
  return out;
}
