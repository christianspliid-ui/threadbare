/**
 * dialogSize — the lock on the dialog size tiers (THR-1820, Law 57).
 *
 * 1. `DIALOG_SIZE_FALLBACK` equals the `:root` values in `index.css`, so a panel
 *    drawn without the stylesheet lays out at the same widths (fail-soft).
 * 2. Every `DIALOG_SIZE_SURFACES` entry's file passes a `size` from its registered
 *    tiers and no `maxWidth` on its `<Modal` / `<RevealCard` tags.
 * 3. `dialogSizeStyle` clamps to the viewport and gives XL a fixed height.
 * 4. The ratchet's `modal-maxwidth` detector counts multi-line tags and skips sub-components.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  BEAT_MODAL_M_MIN_CARDS,
  DIALOG_GUTTER_FALLBACK,
  DIALOG_SIZES,
  DIALOG_SIZE_DEFAULT,
  DIALOG_SIZE_FALLBACK,
  DIALOG_SIZE_SURFACES,
  DIALOG_SIZE_WIDTH_VAR,
  dialogSizeStyle,
  isDialogSize,
} from '../dialogSize';
import { countDialogFreeWidths } from '../../../../scripts/ui-debt-rows';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(here, '../..');
const css = readFileSync(resolve(here, '../../../index.css'), 'utf8');

/** The base `:root` block inside `@layer base`. */
function baseRoot(): string {
  const at = css.indexOf(':root', css.indexOf('@layer base'));
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error('unbalanced :root');
}

function decl(block: string, name: string): string | undefined {
  return block.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'))?.[1].trim();
}

describe('dialogSize — fallbacks pinned to index.css', () => {
  const root = baseRoot();
  for (const size of DIALOG_SIZES) {
    it(`${size}: ${DIALOG_SIZE_WIDTH_VAR[size]} equals its fallback`, () => {
      expect(decl(root, DIALOG_SIZE_WIDTH_VAR[size])).toBe(DIALOG_SIZE_FALLBACK[size]);
    });
  }
  it('the gutter fallback equals --dialog-gutter', () => {
    expect(decl(root, '--dialog-gutter')).toBe(DIALOG_GUTTER_FALLBACK);
  });
  it('S and M are rem text containers, declared once (not restated per tier)', () => {
    expect(DIALOG_SIZE_FALLBACK.s.endsWith('rem')).toBe(true);
    expect(DIALOG_SIZE_FALLBACK.m.endsWith('rem')).toBe(true);
    expect(css.match(/--dialog-s-w:/g)).toHaveLength(1);
    expect(css.match(/--dialog-m-w:/g)).toHaveLength(1);
  });
});

/** Every opening `<Modal` / `<RevealCard` tag in a source, `<` to its `>`. */
function dialogTags(source: string): string[] {
  const tags: string[] = [];
  for (const m of source.matchAll(/<(?:Modal|RevealCard)(?=[\s/>])/g)) {
    const start = m.index ?? 0;
    let depth = 0;
    for (let i = start + m[0].length; i < source.length; i++) {
      const ch = source[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) { tags.push(source.slice(start, i + 1)); break; }
    }
  }
  return tags;
}

describe('dialogSize — DIALOG_SIZE_SURFACES agrees with the source', () => {
  it('lists each surface once', () => {
    const names = DIALOG_SIZE_SURFACES.map((s) => s.surface);
    expect(new Set(names).size).toBe(names.length);
  });

  for (const entry of DIALOG_SIZE_SURFACES) {
    it(`${entry.surface} (${entry.file}) passes a registered size and no maxWidth`, () => {
      const source = readFileSync(resolve(componentsDir, entry.file), 'utf8');
      const tags = dialogTags(source);
      expect(tags.length, 'a dialog tag').toBeGreaterThan(0);
      for (const tag of tags) {
        expect(tag, 'no free width').not.toMatch(/\bmaxWidth=/);
        const literal = tag.match(/\bsize="([a-z]+)"/)?.[1];
        if (literal) {
          expect(entry.sizes).toContain(literal);
        } else {
          // A computed tier (the gift modal) must still pass `size={…}`.
          expect(tag, 'size prop').toMatch(/\bsize=\{/);
        }
      }
    });
  }
});

describe('dialogSize — styles', () => {
  it('clamps every tier to the viewport less two gutters', () => {
    for (const size of DIALOG_SIZES) {
      const width = String(dialogSizeStyle(size).width);
      expect(width).toContain(`var(${DIALOG_SIZE_WIDTH_VAR[size]}, ${DIALOG_SIZE_FALLBACK[size]})`);
      expect(width).toContain('calc(100vw - 2 * var(--dialog-gutter');
      expect(dialogSizeStyle(size).maxHeight).toBe('var(--modal-max-h, 85vh)');
    }
  });
  it('only XL fixes its height', () => {
    expect(dialogSizeStyle('xl').height).toBe('var(--modal-max-h, 85vh)');
    for (const size of ['s', 'm', 'l'] as const) expect(dialogSizeStyle(size).height).toBeUndefined();
  });
  it('an unknown size draws as the default', () => {
    expect(isDialogSize('huge')).toBe(false);
    expect(dialogSizeStyle('huge' as never)).toEqual(dialogSizeStyle(DIALOG_SIZE_DEFAULT));
  });
  it('gifts take M from three cards', () => {
    expect(BEAT_MODAL_M_MIN_CARDS).toBe(3);
  });
});

describe('ui-debt row modal-maxwidth', () => {
  it('counts multi-line tags, ignores Modal.Header and tiered tags', () => {
    const src = [
      '<Modal open onClose={() => x > 1} maxWidth={600}>',
      '<Modal.Header maxWidth={1}>t</Modal.Header>',
      '<RevealCard',
      '  open',
      '  maxWidth={BOND}',
      '>',
      '<Modal size="m">',
    ].join('\n');
    expect(countDialogFreeWidths(src)).toBe(2);
  });
});
