/**
 * THR-1821 — the UI-debt ratchet.
 *
 * Every detector gets a positive and a negative fixture, run through the same
 * comment-removing cleaner the gate uses. The verdict tests pin the decisions a
 * ratchet most often gets wrong: a run that cannot vouch for itself never
 * reports a floor, a halved row is suspect rather than progress, and
 * `--update` never raises a ceiling unless the row is named. The last block is
 * the negative control: one added `<button>` in a scoped file fails the check
 * and names the row, the sanctioned form and the file.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  classifyUiDebt,
  cleanCss,
  cleanScript,
  main,
  measure,
  parseFlags,
  serializeBaseline,
  updateRefusal,
  UI_DEBT_SUSPECT_DROP_MIN_BASELINE,
  type UiDebtFlags,
} from '../check-ui-debt.ts';
import {
  countColourFns,
  countEscapeListeners,
  countFontFaceLiterals,
  countGlyphIcons,
  countHandOverlays,
  countHexColours,
  countLiteralFontSizes,
  countLucideImports,
  countMonospace,
  countRadiusLiterals,
  countRawButtons,
  countShadowLiterals,
  countUppercase,
  isExcluded,
  UI_DEBT_ROWS,
  type CleanSource,
} from '../ui-debt-rows.ts';

const tsx = (code: string, file = 'src/components/Fixture.tsx'): CleanSource => cleanScript(ts, file, code);
const css = (code: string): CleanSource => cleanCss('src/components/fixture.css', code);

const CHECK: UiDebtFlags = { update: false, allowDrop: false, allowIncrease: [] };
const UPDATE: UiDebtFlags = { ...CHECK, update: true };

describe('the cleaner', () => {
  it('removes comments, so commented-out debt never counts', () => {
    const source = tsx(`// <button>old</button>\n/* color: #ff0000 */\nexport const A = () => <div>Don't stop</div>;`);
    expect(countRawButtons(source)).toBe(0);
    expect(countHexColours(source)).toBe(0);
    expect(source.text).toContain("Don't stop");
  });

  it('keeps JSX text out of the strings the class detectors read', () => {
    const source = tsx(`export const A = () => <p className="p-2">a shadow falls, rounded and grey</p>;`);
    expect(countShadowLiterals(source)).toBe(0);
    expect(countRadiusLiterals(source)).toBe(0);
  });

  it('refuses a file that does not parse', () => {
    expect(() => tsx('export const = ;')).toThrow(/does not parse/);
  });

  it('strips CSS block comments', () => {
    expect(countHexColours(css('/* #fff */ .a { color: var(--x); }'))).toBe(0);
  });
});

describe('detectors', () => {
  it('raw-button: counts <button>, not <Button>', () => {
    expect(countRawButtons(tsx('export const A = () => <button onClick={f}>x</button>;'))).toBe(1);
    expect(countRawButtons(tsx('export const A = () => <Button onClick={f}>x</Button>;'))).toBe(0);
  });

  it('colour-hex: counts hex literals, not HTML entities', () => {
    expect(countHexColours(tsx(`export const c = { color: '#d4a843', bg: '#fff' };`))).toBe(2);
    expect(countHexColours(tsx('export const A = () => <span>&#9670;</span>;'))).toBe(0);
  });

  it('colour-fn: counts a numeric rgb(), not rgb(var(--x) / 0.4)', () => {
    expect(countColourFns(tsx(`export const c = 'rgba(0, 0, 0, 0.5)';`))).toBe(1);
    expect(countColourFns(tsx(`export const c = 'rgb(var(--x) / 0.4)';`))).toBe(0);
  });

  it('glyph-icon: counts literal and escaped glyphs, not arrows or punctuation', () => {
    expect(countGlyphIcons('◆ ✦')).toBe(2);
    expect(countGlyphIcons('\\u{1F441}')).toBe(1);
    expect(countGlyphIcons('&#x2715;')).toBe(1);
    expect(countGlyphIcons('\\uD83D\\uDC41')).toBe(1);
    expect(countGlyphIcons('&#9670;')).toBe(1);
    expect(countGlyphIcons('→ · — … 2×')).toBe(0);
  });

  it('lucide-import: counts an import from lucide-react only', () => {
    expect(countLucideImports(tsx(`import { X } from 'lucide-react';\nexport const a = X;`))).toBe(1);
    expect(countLucideImports(tsx(`import { X } from './lucide-wrapper';\nexport const a = X;`))).toBe(0);
  });

  it('hand-overlay: counts fixed inset-0, absolute inset-0 z-50, and a fixed full-cover style', () => {
    expect(countHandOverlays(tsx('export const A = () => <div className="fixed inset-0 bg-black/60" />;'))).toBe(1);
    expect(countHandOverlays(tsx('export const A = () => <div className="absolute inset-0 z-50" />;'))).toBe(1);
    expect(countHandOverlays(tsx(`export const s = { position: 'fixed', inset: 0, zIndex: 60 };`))).toBe(1);
    expect(countHandOverlays(tsx(`export const s = { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 };`))).toBe(1);
    expect(countHandOverlays(tsx(`export const s = { position: 'fixed', ...FULL_INSET };`))).toBe(1);
    expect(countHandOverlays(css('.veil { position: fixed; inset: 0; }'))).toBe(1);
  });

  it('hand-overlay: a click-through layer, a low z and a partial cover do not count', () => {
    expect(countHandOverlays(tsx('export const A = () => <div className="fixed inset-0 pointer-events-none" />;'))).toBe(0);
    expect(countHandOverlays(tsx('export const A = () => <div className="absolute inset-0 z-10" />;'))).toBe(0);
    expect(countHandOverlays(tsx(`export const s = { position: 'fixed', inset: 0, pointerEvents: 'none' };`))).toBe(0);
    expect(countHandOverlays(tsx(`export const s = { position: 'fixed', top: 0, right: 0 };`))).toBe(0);
  });

  it('escape-listener: counts a window keydown listener in a file that handles Escape', () => {
    const handles = `window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });`;
    expect(countEscapeListeners(tsx(handles, 'src/hooks/useX.ts'))).toBe(1);
    const other = `window.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });`;
    expect(countEscapeListeners(tsx(other, 'src/hooks/useX.ts'))).toBe(0);
  });

  it('radius-literal: counts literal radii and default-scale classes; tokens and shapes are legal', () => {
    expect(countRadiusLiterals(tsx(`export const s = { borderRadius: 6 };`))).toBe(1);
    expect(countRadiusLiterals(tsx(`export const s = { borderRadius: open ? 4 : 0 };`))).toBe(1);
    expect(countRadiusLiterals(tsx('export const A = () => <div className="rounded-lg rounded-t-md rounded" />;'))).toBe(3);
    expect(countRadiusLiterals(css('.a { border-radius: 4px; }'))).toBe(1);
    expect(countRadiusLiterals(tsx(`export const s = { borderRadius: 'var(--radius-panel)' };`))).toBe(0);
    expect(countRadiusLiterals(tsx(`export const s = { borderRadius: '50%' }; export const t = { borderRadius: 0 };`))).toBe(0);
    expect(countRadiusLiterals(tsx('export const A = () => <div className="rounded-full rounded-none rounded-panel" />;'))).toBe(0);
    expect(countRadiusLiterals(css('.a { border-radius: var(--panel-radius); }'))).toBe(0);
    expect(countRadiusLiterals(tsx(`export const s = { borderRadius: 'var(--radius-md)' };`))).toBe(1);
  });

  it('shadow-literal: counts literal shadows; tokens, none and glowShadow() are legal', () => {
    expect(countShadowLiterals(tsx(`export const s = { boxShadow: '0 4px 16px rgba(0,0,0,0.4)' };`))).toBe(1);
    expect(countShadowLiterals(tsx('export const A = () => <div className="shadow-lg" />;'))).toBe(1);
    expect(countShadowLiterals(tsx(`export const s = { boxShadow: 'var(--shadow-panel)' };`))).toBe(0);
    expect(countShadowLiterals(tsx(`export const s = { boxShadow: glowShadow(c, 'soft') };`))).toBe(0);
    expect(countShadowLiterals(tsx('export const A = () => <div className="shadow-black/50 drop-shadow-md" />;'))).toBe(0);
    // The Shadow Reach's id is not a class; the bare utility in a class list is.
    expect(countShadowLiterals(tsx(`export const isShadow = (r: string) => r === 'shadow';`))).toBe(0);
    expect(countShadowLiterals(tsx('export const A = () => <div className="p-2 shadow" />;'))).toBe(1);
    // Tailwind's default scale through var() is not one of our tokens.
    expect(countShadowLiterals(tsx(`export const s = { boxShadow: 'var(--shadow-lg)' };`))).toBe(1);
  });

  it('uppercase and monospace', () => {
    expect(countUppercase(tsx('export const A = () => <h2 className="uppercase" />;'))).toBe(1);
    expect(countUppercase(tsx('export const A = () => <h2 className="normal-case" />;'))).toBe(0);
    expect(countMonospace(tsx(`export const s = { fontFamily: 'monospace' };`))).toBe(1);
    expect(countMonospace(tsx('export const A = () => <span className="tabular-nums" />;'))).toBe(0);
  });

  it('font-face-literal: one per string or CSS font-family naming a face', () => {
    expect(countFontFaceLiterals(tsx(`export const s = { fontFamily: 'Georgia, serif' };`))).toBe(1);
    expect(countFontFaceLiterals(css('.a { font-family: Cinzel, serif; }'))).toBe(1);
    expect(countFontFaceLiterals(tsx(`export const s = { fontFamily: 'var(--font-prose)' };`))).toBe(0);
    expect(countFontFaceLiterals(tsx(`export const s = 'Interrupt';`))).toBe(0);
  });

  it('literal-font-size: counts bare numbers, quoted lengths, arbitrary and over-scale classes, undefined tokens', () => {
    expect(countLiteralFontSizes(tsx(`export const s = { fontSize: 12 };`))).toBe(1);
    expect(countLiteralFontSizes(tsx(`export const s = { fontSize: compact ? '11px' : 'var(--text-sm)' };`))).toBe(1);
    expect(countLiteralFontSizes(tsx(`export const s = { fontSize: 'var(--text-2xs)' };`))).toBe(1);
    expect(countLiteralFontSizes(tsx('export const A = () => <p className="text-[13px] text-4xl" />;'))).toBe(2);
    expect(countLiteralFontSizes(css('.a { font-size: 0.8rem; }'))).toBe(1);
  });

  it('literal-font-size: scale tokens, em, named constants, templates and SVG attributes stay legal', () => {
    expect(countLiteralFontSizes(tsx(`export const s = { fontSize: 'var(--text-sm)' };`))).toBe(0);
    expect(countLiteralFontSizes(tsx(`export const s = { fontSize: '0.9em' };`))).toBe(0);
    expect(countLiteralFontSizes(tsx(`export const s = { fontSize: GLYPH_FONT_PX };`))).toBe(0);
    expect(countLiteralFontSizes(tsx('export const s = { fontSize: `${n}px` };'))).toBe(0);
    expect(countLiteralFontSizes(tsx('export const A = () => <text fontSize={12}>x</text>;'))).toBe(0);
    expect(countLiteralFontSizes(tsx('export const A = () => <p className="text-2xl" />;'))).toBe(0);
  });
});

describe('scope and homes', () => {
  it('excludes tests and the dev surfaces', () => {
    expect(isExcluded('src/components/__tests__/A.test.tsx')).toBe(true);
    expect(isExcluded('src/components/Game/DebugPanel.tsx')).toBe(true);
    expect(isExcluded('src/components/StyleGuide/Section.tsx')).toBe(true);
    expect(isExcluded('src/components/HexMapV2/lab/Lab.tsx')).toBe(true);
    expect(isExcluded('src/components/Game/GameView.tsx')).toBe(false);
  });

  it('exempts a row home: Button.tsx may draw a <button>', () => {
    const row = UI_DEBT_ROWS.find((r) => r.id === 'raw-button');
    expect(row?.homes.some((home) => home.test('src/components/shared/Button.tsx'))).toBe(true);
    expect(row?.homes.some((home) => home.test('src/components/Game/Foo.tsx'))).toBe(false);
  });

  it('HexMapV2 .ts colour data is exempt from the colour rows only; its .tsx still counts', () => {
    const hex = UI_DEBT_ROWS.find((r) => r.id === 'colour-hex');
    expect(hex?.homes.some((h) => h.test('src/components/HexMapV2/palette.ts'))).toBe(true);
    expect(hex?.homes.some((h) => h.test('src/components/HexMapV2/Overlay.tsx'))).toBe(false);
  });

  it('row ids are unique', () => {
    const ids = UI_DEBT_ROWS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('classifyUiDebt', () => {
  const base = { a: 100, b: 20 };

  it('unchanged and decrease pass', () => {
    const v = classifyUiDebt({ unverifiable: null, measured: { a: 100, b: 18 }, baseline: base }, CHECK);
    expect(v.kind === 'rows' && v.failing).toBe(false);
    expect(v.kind === 'rows' && v.rows.map((r) => r.kind)).toEqual(['unchanged', 'decrease']);
  });

  it('increase fails', () => {
    const v = classifyUiDebt({ unverifiable: null, measured: { a: 101, b: 20 }, baseline: base }, CHECK);
    expect(v.kind === 'rows' && v.failing).toBe(true);
    expect(v.kind === 'rows' && v.rows[0]?.kind).toBe('increase');
  });

  it('a halved row is suspect, unless --allow-drop; a small baseline may drop freely', () => {
    const v = classifyUiDebt({ unverifiable: null, measured: { a: 40, b: 20 }, baseline: base }, CHECK);
    expect(v.kind === 'rows' && v.rows[0]?.kind).toBe('suspect-drop');
    expect(v.kind === 'rows' && v.failing).toBe(true);
    const allowed = classifyUiDebt({ unverifiable: null, measured: { a: 40, b: 20 }, baseline: base }, { ...CHECK, allowDrop: true });
    expect(allowed.kind === 'rows' && allowed.rows[0]?.kind).toBe('decrease');
    const small = UI_DEBT_SUSPECT_DROP_MIN_BASELINE - 1;
    const free = classifyUiDebt({ unverifiable: null, measured: { c: 1 }, baseline: { c: small } }, CHECK);
    expect(free.kind === 'rows' && free.rows[0]?.kind).toBe('decrease');
  });

  it('a row with no baseline is unregistered; a baseline with no row is orphan — both fail', () => {
    const v = classifyUiDebt({ unverifiable: null, measured: { a: 100, z: 3 }, baseline: base }, CHECK);
    expect(v.kind === 'rows' && v.rows.map((r) => `${r.id}:${r.kind}`)).toEqual(['a:unchanged', 'z:unregistered-row', 'b:orphan-row']);
    expect(v.kind === 'rows' && v.failing).toBe(true);
  });

  it('unverifiable and no-baseline come first', () => {
    expect(classifyUiDebt({ unverifiable: 'root empty', measured: {}, baseline: base }, CHECK).kind).toBe('unverifiable');
    expect(classifyUiDebt({ unverifiable: null, measured: { a: 1 }, baseline: null }, CHECK).kind).toBe('no-baseline');
  });
});

describe('--update', () => {
  const base = { a: 100, b: 20 };

  it('refuses to raise a row unless it is named with --allow-increase', () => {
    const v = classifyUiDebt({ unverifiable: null, measured: { a: 103, b: 20 }, baseline: base }, UPDATE);
    expect(updateRefusal(v, UPDATE)).toMatch(/refusing to raise a \(100 → 103\)/);
    expect(updateRefusal(v, { ...UPDATE, allowIncrease: ['a'] })).toBeNull();
    expect(parseFlags(['--update', '--allow-increase=a']).allowIncrease).toEqual(['a']);
  });

  it('refuses on an unverifiable run and on a suspect drop', () => {
    expect(updateRefusal(classifyUiDebt({ unverifiable: 'x', measured: {}, baseline: base }, UPDATE), UPDATE)).toMatch(/unverifiable/);
    const drop = classifyUiDebt({ unverifiable: null, measured: { a: 10, b: 20 }, baseline: base }, UPDATE);
    expect(updateRefusal(drop, UPDATE)).toMatch(/suspect drop on a/);
  });

  it('writes new rows, drops orphans, and sorts keys', () => {
    const v = classifyUiDebt({ unverifiable: null, measured: { a: 90, z: 2 }, baseline: base }, UPDATE);
    expect(updateRefusal(v, UPDATE)).toBeNull();
    const json = JSON.parse(
      serializeBaseline({ unverifiable: null, totals: { z: 2, a: 90 }, perFile: { z: { 'f.tsx': 2 }, a: {} }, files: 1 }),
    );
    expect(Object.keys(json.rows)).toEqual(['a', 'z']);
    expect(json.rows.z).toEqual({ total: 2, perFile: { 'f.tsx': 2 } });
  });
});

describe('measure and main on a fixture tree', () => {
  let root: string;
  const write = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content, 'utf8');
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-debt-'));
    write('src/components/Panel.tsx', 'export const P = () => <button>ok</button>;\n');
    write('src/components/shared/Button.tsx', 'export const B = () => <button>home</button>;\n');
    write('src/hooks/useThing.ts', 'export const useThing = () => 1;\n');
    write('src/contexts/Ctx.tsx', 'export const C = () => null;\n');
    write('src/data/table.ts', 'export const T = [1];\n');
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('counts per file and skips the home', () => {
    const m = measure(ts, UI_DEBT_ROWS, root);
    expect(m.unverifiable).toBeNull();
    expect(m.totals['raw-button']).toBe(1);
    expect(m.perFile['raw-button']).toEqual({ 'src/components/Panel.tsx': 1 });
  });

  it('an empty root is unverifiable', () => {
    fs.rmSync(path.join(root, 'src/contexts'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/contexts'));
    expect(measure(ts, UI_DEBT_ROWS, root).unverifiable).toMatch(/src\/contexts has zero files/);
  });

  it('negative control: one added <button> fails and names raw-button, Button / IconButton and the file', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.join(' '));
    });
    expect(await main(['--update'], root)).toBe(0);
    expect(await main([], root)).toBe(0);

    write('src/components/Panel.tsx', 'export const P = () => <div><button>ok</button><button>new</button></div>;\n');
    expect(await main([], root)).toBe(1);
    const out = errors.join('\n');
    expect(out).toContain('raw-button');
    expect(out).toContain('Button / IconButton');
    expect(out).toContain('src/components/Panel.tsx: 1 → 2 (+1)');
  });
});
