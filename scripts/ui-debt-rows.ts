/**
 * ui-debt-rows — the rows of the UI-debt ratchet, as data (THR-1821).
 *
 * A row is one pattern of player-UI debt: a raw `<button>`, a colour literal, a
 * glyph drawn as an icon, a hand-built overlay. `scripts/check-ui-debt.ts` counts
 * every row across its scope and fails when any row's total rises above
 * `ui-debt-baseline.json`. Rows only go down.
 *
 * Registering a row is one entry in `UI_DEBT_ROWS` plus
 * `npm run check:ui-debt -- --update`. This module is pure — no I/O, no
 * TypeScript compiler — so tests import it without running the gate. The
 * script hands every detector a `CleanSource`: comments already removed, string
 * literals and style blocks already extracted.
 *
 * Plan: Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md
 * § "The UI-debt ratchet".
 */

/** One scanned file, comments removed, with the parts the detectors read. */
export interface CleanSource {
  /** Repo-relative, forward slashes. */
  path: string;
  /** Lower-case extension with the dot: `.ts`, `.tsx`, `.css`. */
  ext: string;
  /** The file's text with every comment removed. */
  text: string;
  /**
   * Every string the file writes: string literals, template-literal chunks and
   * JSX attribute strings (never JSX text). Empty for `.css`. Class-list
   * detectors read these, so an identifier named `shadow` or `rounded` never
   * counts.
   */
  strings: readonly string[];
  /** Style blocks: JS object literals, and CSS rule bodies. */
  blocks: readonly StyleBlock[];
}

/** One `{ … }` block's declarations. Keys keep their source spelling. */
export interface StyleBlock {
  /** `position` → `'fixed'`, `inset` → `0`, `pointer-events` → `none`. */
  props: Readonly<Record<string, string>>;
  /** Identifiers spread into the block (`...FULL_INSET`); JS only. */
  spreads: readonly string[];
}

export interface UiDebtRow {
  /** Stable; the baseline key. */
  id: string;
  /** The ticket that owns the burn-down. */
  owner: string;
  /** Why it is debt. */
  law: string;
  /** What to write instead, printed on failure. */
  sanctioned: string;
  /** Scan roots, repo-relative. */
  roots: readonly string[];
  /** Which files in the roots. */
  extensions: RegExp;
  /** Files that legitimately implement the pattern (the primitive itself). */
  homes: readonly RegExp[];
  /** Occurrences in one file. Comments are already removed. */
  count(source: CleanSource): number;
}

// ── Scope ────────────────────────────────────────────────────────────────

/** The player UI tree. */
export const UI_TREE_ROOTS = ['src/components', 'src/hooks', 'src/contexts'] as const;

/** Every scanned extension; each row narrows it. */
export const UI_TREE_EXTENSIONS = /\.(?:tsx?|css)$/;

/**
 * Non-player surfaces, excluded from every row. A pattern here is debt nobody
 * playing the game can see.
 */
export const UI_DEBT_EXCLUDED: readonly RegExp[] = [
  /(?:^|\/)__tests__\//, // tests draw fixtures, not surfaces
  /\.(?:test|spec)\.[cm]?[jt]sx?$/, // tests beside their module
  /\.stories\.[jt]sx?$/, // styleguide stories
  /^src\/components\/CMS\//, // the content editor — an authoring tool
  /^src\/components\/StyleGuide\//, // the styleguide renders the debt it documents
  /^src\/components\/UL\//, // the ubiquitous-language browser — a docs tool
  /^src\/components\/TaxonomyViewer\//, // the taxonomy browser — a docs tool
  /^src\/components\/Game\/debug\//, // the debug panel's parts
  /^src\/components\/HexMapV2\/lab\//, // the hex-map lab view
  /[^/]*[dD]ebug[^/]*$/, // DebugPanel.tsx, useDebugOpenModal.ts, meetingDebugState.ts
];

/** True when the repo-relative path is a non-player surface. */
export function isExcluded(relPath: string): boolean {
  return UI_DEBT_EXCLUDED.some((pattern) => pattern.test(relPath));
}

// ── Shared helpers ───────────────────────────────────────────────────────

function countMatches(text: string, pattern: RegExp): number {
  const global = pattern.flags.includes('g') ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  return text.match(global)?.length ?? 0;
}

function countInStrings(strings: readonly string[], pattern: RegExp): number {
  let total = 0;
  for (const s of strings) total += countMatches(s, pattern);
  return total;
}

/** A value with its quotes and surrounding space removed. */
function unquote(value: string): string {
  return value.trim().replace(/^(['"`])(.*)\1$/s, '$2').trim();
}

/** Prop lookup by any of its spellings (camelCase in JS, kebab-case in CSS). */
function prop(block: StyleBlock, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = block.props[name];
    if (value !== undefined) return value;
  }
  return undefined;
}

/**
 * Each declaration of `name` in the text, as `[propertyName, value]`. The value
 * runs to the first top-level `,` `;` `}` or line end, so a ternary or a call
 * with commas inside parentheses stays one value.
 */
export function declarationValues(text: string, names: readonly string[]): string[] {
  const values: string[] = [];
  const pattern = new RegExp(`(?<![\\w-])(?:${names.join('|')})\\s*:`, 'g');
  for (const match of text.matchAll(pattern)) {
    let i = (match.index ?? 0) + match[0].length;
    let depth = 0;
    let quote: string | null = null;
    const start = i;
    for (; i < text.length; i += 1) {
      const ch = text[i];
      if (quote) {
        if (ch === '\\') i += 1;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') quote = ch;
      else if (ch === '(' || ch === '[' || ch === '{') depth += 1;
      else if (ch === ')' || ch === ']' || ch === '}') {
        if (depth === 0) break;
        depth -= 1;
      } else if (depth === 0 && (ch === ',' || ch === ';' || ch === '\n')) break;
    }
    values.push(text.slice(start, i).trim());
  }
  return values;
}

// ── Detectors (exported for the fixture tests) ───────────────────────────

/** `raw-button` — a raw `<button>` element. */
export function countRawButtons(source: CleanSource): number {
  return countMatches(source.text, /<button\b/g);
}

/**
 * `colour-hex` — a hex colour literal. The look-behind skips HTML entities
 * (`&#9670;`) and ids; the look-ahead skips `#abc-def` anchors.
 */
export const HEX_COLOUR = /(?<![&\w#])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b(?![-\w])/gi;
export function countHexColours(source: CleanSource): number {
  return countMatches(source.text, HEX_COLOUR);
}

/** `colour-fn` — `rgb()`/`hsl()` with a numeric first argument. `rgb(var(--x-rgb) / 0.4)` stays legal. */
export const COLOUR_FN = /\b(?:rgba?|hsla?)\(\s*\d/g;
export function countColourFns(source: CleanSource): number {
  return countMatches(source.text, COLOUR_FN);
}

/**
 * Code-point ranges drawn as icons: Misc Technical, Geometric Shapes, Misc
 * Symbols, Dingbats, Misc Symbols and Arrows, and the emoji planes. Arrows
 * (U+2190–21FF), punctuation and `×` are typography and stay out.
 */
export const GLYPH_ICON_RANGES: readonly (readonly [number, number])[] = [
  [0x2300, 0x23ff],
  [0x25a0, 0x25ff],
  [0x2600, 0x26ff],
  [0x2700, 0x27bf],
  [0x2b00, 0x2bff],
  [0x1f000, 0x1faff],
];

export function isGlyphIcon(codePoint: number): boolean {
  return GLYPH_ICON_RANGES.some(([lo, hi]) => codePoint >= lo && codePoint <= hi);
}

/**
 * Glyph icons in text, whether literal or escaped: `\uXXXX` (surrogate pairs
 * joined), `\u{XXXXX}`, `&#xHHHH;`, `&#DDDD;`. VS16 and ZWJ are outside the
 * ranges, so an emoji sequence counts once per pictograph.
 */
export function countGlyphIcons(text: string): number {
  let total = 0;
  for (const ch of text) {
    if (isGlyphIcon(ch.codePointAt(0) ?? 0)) total += 1;
  }
  const escape = /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})(?:\\u([0-9a-fA-F]{4}))?|&#x([0-9a-fA-F]{1,6});|&#(\d{1,7});/g;
  for (const m of text.matchAll(escape)) {
    let cp: number;
    if (m[1] !== undefined) cp = parseInt(m[1], 16);
    else if (m[2] !== undefined) {
      const hi = parseInt(m[2], 16);
      const lo = m[3] !== undefined ? parseInt(m[3], 16) : -1;
      if (hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff) {
        cp = (hi - 0xd800) * 0x400 + (lo - 0xdc00) + 0x10000;
      } else {
        // Not a pair: score the first escape alone, and the second one too.
        if (isGlyphIcon(hi)) total += 1;
        if (lo >= 0 && isGlyphIcon(lo)) total += 1;
        continue;
      }
    } else if (m[4] !== undefined) cp = parseInt(m[4], 16);
    else cp = parseInt(m[5] ?? '0', 10);
    if (isGlyphIcon(cp)) total += 1;
  }
  return total;
}

/** `lucide-import` — lucide on a player surface. */
export function countLucideImports(source: CleanSource): number {
  return countMatches(source.text, /from\s+['"]lucide-react['"]/g);
}

const CLASS_TOKEN_SPLIT = /\s+/;

/** True when a class list (or a fragment of one) holds every token. */
function hasClasses(tokens: readonly string[], ...wanted: string[]): boolean {
  return wanted.every((w) => tokens.includes(w));
}

/** A `z-40`-or-higher class (`z-40`, `z-50`, `z-[60]`), any variant prefix. */
function hasHighZ(tokens: readonly string[]): boolean {
  return tokens.some((t) => {
    const m = /(?:^|:)z-(?:(\d+)|\[(\d+)\])$/.exec(t);
    return m !== null && Number(m[1] ?? m[2]) >= 40;
  });
}

function isZero(value: string | undefined): boolean {
  return value !== undefined && /^0(?:px|rem|%)?$/.test(unquote(value));
}

/**
 * `hand-overlay` — a full-cover layer built by hand: (a) a class string with
 * `fixed` and `inset-0`; (b) a class string with `absolute`, `inset-0` and a
 * `z-40`+ class; (c) a style block with `position: fixed` and full-cover
 * offsets (`inset: 0`, all four sides 0, or a spread named `*INSET*`). A layer
 * that lets clicks through (`pointer-events-none`) is decoration and does not
 * count.
 */
export function countHandOverlays(source: CleanSource): number {
  let total = 0;
  for (const s of source.strings) {
    const tokens = s.split(CLASS_TOKEN_SPLIT).filter(Boolean);
    if (!tokens.includes('inset-0') || tokens.includes('pointer-events-none')) continue;
    if (tokens.includes('fixed') || (tokens.includes('absolute') && hasHighZ(tokens))) total += 1;
  }
  for (const block of source.blocks) {
    if (unquote(prop(block, 'position') ?? '') !== 'fixed') continue;
    if (unquote(prop(block, 'pointerEvents', 'pointer-events') ?? '') === 'none') continue;
    const fullCover =
      isZero(prop(block, 'inset')) ||
      ['top', 'right', 'bottom', 'left'].every((side) => isZero(prop(block, side))) ||
      block.spreads.some((name) => /INSET/i.test(name));
    if (fullCover) total += 1;
  }
  return total;
}

/** `escape-listener` — a `keydown` listener on window/document in a file that handles Escape. */
export function countEscapeListeners(source: CleanSource): number {
  if (!/\bEscape\b/.test(source.text)) return 0;
  return countMatches(source.text, /\b(?:window|document)\.addEventListener\(\s*['"`]keydown['"`]/g);
}

/** Radius values the token set sanctions, plus the two shapes. */
const LEGAL_RADIUS = /^(?:var\(--radius-[a-z]+\)|var\(--panel-radius\)|0(?:px)?|50%)$/;

/** Tailwind default-scale radius classes, any side; `rounded-full`/`-none` and tokens stay legal. */
export const TAILWIND_RADIUS =
  /(?<![\w-])rounded(?:-(?:t|r|b|l|s|e|x|y|tl|tr|br|bl|ss|se|es|ee))?(?:-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|\[[^\]\s]*\]))?(?![\w-])/g;

/** `radius-literal` — a radius not on the token set. */
export function countRadiusLiterals(source: CleanSource): number {
  let total = 0;
  for (const value of declarationValues(source.text, ['borderRadius', 'border-radius'])) {
    if (!LEGAL_RADIUS.test(unquote(value))) total += 1;
  }
  return total + countInStrings(source.strings, TAILWIND_RADIUS);
}

/** Tailwind default-scale shadow classes. `shadow-black/50` (a colour) and `drop-shadow-*` do not count. */
export const TAILWIND_SHADOW = /(?<![\w-])shadow(?:-(?:2xs|xs|sm|md|lg|xl|2xl|inner|\[[^\]\s]*\]))?(?![\w-])/g;

/** `shadow-literal` — a shadow not on the token set. */
export function countShadowLiterals(source: CleanSource): number {
  let total = 0;
  for (const value of declarationValues(source.text, ['boxShadow', 'box-shadow'])) {
    const v = unquote(value);
    if (!/^(?:var\(--shadow-|none\b|glowShadow\()/.test(v)) total += 1;
  }
  return total + countInStrings(source.strings, TAILWIND_SHADOW);
}

/** `uppercase` — capitals by transform (class, `textTransform`, CSS). */
export function countUppercase(source: CleanSource): number {
  return countMatches(source.text, /\buppercase\b/g);
}

/** `monospace` — monospace on a player surface. */
export function countMonospace(source: CleanSource): number {
  return countMatches(source.text, /\bfont-mono\b|\bmonospace\b|var\(--font-mono\)/g);
}

/** Faces that belong in the font tokens only. */
export const NAMED_FACES = /\b(?:Georgia|Palatino|Book Antiqua|Times New Roman|Cinzel|Alegreya|Arial|Helvetica|Inter|Segoe UI)\b/;

/** `font-face-literal` — one per string literal or CSS `font-family` naming a face. */
export function countFontFaceLiterals(source: CleanSource): number {
  if (source.ext === '.css') {
    return declarationValues(source.text, ['font-family']).filter((v) => NAMED_FACES.test(v)).length;
  }
  return source.strings.filter((s) => NAMED_FACES.test(s)).length;
}

/** The type scale's defined steps (`--text-2xs` is NOT one — THR-1819). */
const TYPE_SCALE_VAR = /var\(--text-(?:xs|sm|base|lg|xl|2xl)\)/g;
const LENGTH = /\d(?:px|rem|pt|vw|vh)\b/;

/**
 * `literal-font-size` (THR-1819 § 11, registered by S1 from its comment on
 * THR-1821) — a font size not expressed through the type scale. Once per
 * declaration: a JS `fontSize:` value that, after removing the scale's
 * `var(--text-*)` references, still holds a bare number or a quoted length (or
 * an undefined `--text-*` token); a CSS `font-size:` likewise; a Tailwind
 * arbitrary `text-[<n>px|rem]`; a Tailwind size above the scale. Not counted:
 * `em`/`%`, named constants, computed templates, SVG `fontSize=` attributes.
 */
export function countLiteralFontSizes(source: CleanSource): number {
  let total = 0;
  const names = source.ext === '.css' ? ['font-size'] : ['fontSize', 'font-size'];
  for (const raw of declarationValues(source.text, names)) {
    const value = raw.replace(TYPE_SCALE_VAR, '');
    if (/var\(--text-/.test(value)) {
      total += 1;
      continue;
    }
    const quoted = [...value.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/gs)].map((m) => m[2] ?? '');
    if (quoted.some((q) => !q.includes('${') && LENGTH.test(q))) {
      total += 1;
      continue;
    }
    if (source.ext === '.css') {
      if (LENGTH.test(value)) total += 1;
      continue;
    }
    const bare = value.replace(/(['"`])(?:\\.|(?!\1).)*\1/gs, '');
    if (/(?<![\w.$])\d+(?:\.\d+)?(?![\w%.])/.test(bare)) total += 1;
  }
  total += countInStrings(source.strings, /(?<![\w-])text-\[\d*\.?\d+(?:px|rem)\]/g);
  total += countInStrings(source.strings, /(?<![\w-])text-(?:[3-9]xl)(?![\w-])/g);
  return total;
}

// ── The rows ─────────────────────────────────────────────────────────────

const ALL_UI = UI_TREE_ROOTS;
const HOME = (file: string) => new RegExp(`^src/components/shared/${file.replace('.', '\\.')}$`);

/** WebGL colour data: HexMapV2's `.ts` modules (its `.tsx` HTML overlays still count). */
const HEXMAP_COLOUR_DATA = /^src\/components\/HexMapV2\/.*\.ts$/;

export const UI_DEBT_ROWS: readonly UiDebtRow[] = [
  {
    id: 'raw-button',
    owner: 'THR-1821',
    law: 'Laws 26, 27',
    sanctioned: 'Button / IconButton (Tabs.Tab, Chip when they land)',
    roots: ALL_UI,
    extensions: /\.tsx$/,
    homes: [HOME('Button.tsx'), HOME('IconButton.tsx')],
    count: countRawButtons,
  },
  {
    id: 'colour-hex',
    owner: 'THR-1821',
    law: 'Law 30',
    sanctioned: 'var(--token)',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [HEXMAP_COLOUR_DATA],
    count: countHexColours,
  },
  {
    id: 'colour-fn',
    owner: 'THR-1821',
    law: 'Law 30',
    sanctioned: 'a token, or rgb(var(--x-rgb) / a)',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [HEXMAP_COLOUR_DATA],
    count: countColourFns,
  },
  {
    id: 'glyph-icon',
    owner: 'THR-1821 / THR-1834',
    law: 'Laws 9–12',
    sanctioned: 'Icon',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    // Law 15's sanctioned magnitude languages draw glyphs on purpose.
    homes: [HOME('DeltaCluster.tsx'), HOME('OddsPips.tsx')],
    count: (source) => countGlyphIcons(source.text),
  },
  {
    id: 'glyph-icon-data',
    owner: 'THR-1821 / THR-1834',
    law: 'Laws 9–12',
    sanctioned: 'an IconName in the table',
    roots: ['src/data'],
    extensions: /\.tsx?$/,
    homes: [],
    count: (source) => countGlyphIcons(source.text),
  },
  {
    id: 'lucide-import',
    owner: 'THR-1834',
    law: 'Law 9',
    sanctioned: 'Icon',
    roots: ALL_UI,
    extensions: /\.tsx?$/,
    homes: [],
    count: countLucideImports,
  },
  {
    id: 'hand-overlay',
    owner: 'THR-1821',
    law: 'Laws 23, 35',
    sanctioned: 'Overlay / Modal',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [HOME('Modal.tsx'), HOME('Overlay.tsx')],
    count: countHandOverlays,
  },
  {
    id: 'escape-listener',
    owner: 'THR-1821',
    law: 'Laws 23, 50',
    sanctioned: 'Overlay, or useEscapeLayer with a named band',
    roots: ALL_UI,
    extensions: /\.tsx?$/,
    homes: [HOME('useEscapeLayer.ts')],
    count: countEscapeListeners,
  },
  {
    id: 'radius-literal',
    owner: 'THR-1821',
    law: 'Laws 27, 30',
    sanctioned: 'var(--radius-page|panel|control|chip) or rounded-panel etc.',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [],
    count: countRadiusLiterals,
  },
  {
    id: 'shadow-literal',
    owner: 'THR-1821',
    law: 'Laws 27, 30',
    sanctioned: 'var(--shadow-*), shadow-panel etc., glowShadow()',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [],
    count: countShadowLiterals,
  },
  {
    id: 'uppercase',
    owner: 'THR-1833',
    law: 'type system',
    sanctioned: 'sentence case (Alegreya Sans 700 labels)',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [],
    count: countUppercase,
  },
  {
    id: 'monospace',
    owner: 'THR-1833',
    law: 'type system',
    sanctioned: 'Alegreya Sans with tabular-nums',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [],
    count: countMonospace,
  },
  {
    id: 'font-face-literal',
    owner: 'THR-1833',
    law: 'type system',
    sanctioned: 'var(--font-display|body|prose)',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [],
    count: countFontFaceLiterals,
  },
  {
    id: 'literal-font-size',
    owner: 'THR-1819',
    law: 'type system (the type scale, THR-1819)',
    sanctioned: 'var(--text-xs|sm|base|lg|xl|2xl)',
    roots: ALL_UI,
    extensions: UI_TREE_EXTENSIONS,
    homes: [],
    count: countLiteralFontSizes,
  },
];
