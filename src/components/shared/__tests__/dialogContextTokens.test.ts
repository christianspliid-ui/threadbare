/**
 * dialogContextTokens — the Law 45 lock on the dialogue-context palettes (THR-1586).
 *
 * Parses `index.css` and measures, on both gradient stops of each new context
 * ground: the context text at full and dim alpha, the accent at the accent-text
 * alpha, and the neutral text tokens (`--text-primary/-secondary/-tertiary/-muted`,
 * `--accent-gold`) that the surfaces' children keep using. Every tone must clear
 * `DIALOG_CONTRAST_FLOOR`. Measured on the composed colour, as THR-1010 measured
 * the veil — a token that reads as "the text colour" can still paint at 2.5:1
 * once an alpha sits on it.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../../../index.css'), 'utf8');

/** WCAG AA floor for body text (Law 45). */
const DIALOG_CONTRAST_FLOOR = 4.5;
/** Law 32 as clarified 2026-10-02: a sanctioned variant set's lightest stop stays ≤ this luminance. */
const DIALOG_GROUND_LUMINANCE_CEILING = 0.02;

type Rgb = [number, number, number];

function token(name: string): string {
  // Line-anchored: comments quote token names followed by a colon ("--veil-gold-rgb: one value").
  const m = css.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'));
  if (!m) throw new Error(`token ${name} missing from index.css`);
  return m[1].trim();
}

function hex(h: string): Rgb {
  const v = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as Rgb;
}

/** `R G B` channels, following one `var(--x-rgb)` indirection. */
function channels(name: string): Rgb {
  let v = token(name);
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) v = token(ref[1]);
  return v.split(/\s+/).map(Number) as Rgb;
}

function alpha(name: string): number {
  return Number(token(name));
}

function stops(bgName: string): Rgb[] {
  const found = token(bgName).match(/#[0-9a-fA-F]{6}/g);
  if (!found || found.length !== 2) throw new Error(`${bgName}: expected two hex stops`);
  return found.map(hex);
}

function lin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function composite(fg: Rgb, a: number, bg: Rgb): Rgb {
  return fg.map((c, i) => c * a + bg[i] * (1 - a)) as Rgb;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const CONTEXTS = ['story', 'elder', 'gain'] as const;
const NEUTRAL_TONES = ['--text-primary', '--text-secondary', '--text-tertiary', '--text-muted', '--accent-gold'];

describe('dialogue-context palettes clear Law 45 on both stops (THR-1586)', () => {
  for (const ctx of CONTEXTS) {
    describe(ctx, () => {
      const ground = stops(`--dialog-${ctx}-bg`);
      const text = channels(`--dialog-${ctx}-text-rgb`);
      const accent = channels(`--dialog-${ctx}-accent-rgb`);

      const tones: Array<[string, (bg: Rgb) => Rgb]> = [
        ['context text', () => text],
        ['context text × dim', (bg) => composite(text, alpha('--dialog-text-dim-alpha'), bg)],
        ['accent × accent-text', (bg) => composite(accent, alpha('--dialog-accent-text-alpha'), bg)],
        ['accent', () => accent],
        ...NEUTRAL_TONES.map((t): [string, (bg: Rgb) => Rgb] => [t, () => hex(token(t))]),
      ];

      for (const [label, tone] of tones) {
        it(`${label} ≥ ${DIALOG_CONTRAST_FLOOR}:1`, () => {
          for (const bg of ground) {
            expect(contrast(tone(bg), bg)).toBeGreaterThanOrEqual(DIALOG_CONTRAST_FLOOR);
          }
        });
      }

      it(`lightest stop stays near-black (Law 32, L ≤ ${DIALOG_GROUND_LUMINANCE_CEILING})`, () => {
        expect(Math.max(...ground.map(luminance))).toBeLessThanOrEqual(DIALOG_GROUND_LUMINANCE_CEILING);
      });
    });
  }

  it('gain borrows the one game gold rather than declaring a second', () => {
    expect(token('--dialog-gain-accent-rgb')).toBe('var(--veil-gold-rgb)');
  });

  it('each context class sets the panel properties from its own tokens', () => {
    for (const ctx of CONTEXTS) {
      const block = css.match(new RegExp(`\\.dialog-ctx-${ctx}\\s*\\{([^}]+)\\}`));
      expect(block, `.dialog-ctx-${ctx}`).toBeTruthy();
      for (const prop of ['--dlg-bg', '--dlg-text', '--dlg-text-dim', '--dlg-accent', '--dlg-accent-text', '--dlg-rule', '--dlg-border', '--dlg-inset']) {
        expect(block![1]).toContain(`${prop}:`);
      }
      expect(block![1]).toContain(`--dialog-${ctx}-`);
    }
  });
});
