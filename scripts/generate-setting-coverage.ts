/**
 * generate-setting-coverage — THR-884.
 *
 * Emits `Docs/canon/setting-coverage.generated.md`: the settings × reach coverage
 * matrix, plus per-family nudge-hand composition.
 *
 * **Why a generated artifact and not a test.** A corpus gap is not a failure — it is
 * a fact about what has been written so far, and the useful response is to write the
 * missing scene, not to fail the build. The matrix makes gaps (a starving `urban`
 * cell) and hand monotony (a family whose every encounter deals the same card mix)
 * visible at build time instead of in play. Floors stay **advisory and unset** until
 * Christian sets them — this is a visibility tool, not a quota (plan § Risks).
 *
 * Reads the live drawable pool (`UNIFIED_ACTION_TEMPLATES`), so it measures what the
 * engine can actually deal rather than what the content files declare.
 *
 * Usage:
 *   npm run generate-setting-coverage          # write the doc
 *   npm run generate-setting-coverage:check    # regenerate + diff vs committed (advisory)
 */

import * as fs from 'fs';
import * as path from 'path';

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { REACH_DOMAINS } from '../src/types/traits';
import {
  SETTING_CLASSES,
  SETTING_CLASS_MAP,
  settingClassForSubtype,
  type SettingClass,
} from '../src/data/settingClasses';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';

// ─── Tunable constants (NFP #1) ───────────────────────────────────────────────

const OUTPUT_REL = 'Docs/canon/setting-coverage.generated.md';

/**
 * Cells at or below this count are flagged in the report's gap list. Advisory only —
 * nothing fails on it. Raise it when the corpus is dense enough that a low cell is
 * genuinely surprising rather than simply un-written.
 */
const THIN_CELL_THRESHOLD = 2;

/** A family's hand is flagged monotonous when one card kind is at least this share. */
const MONOTONY_SHARE = 0.6;

/** Families with fewer than this many carded encounters are too small to judge. */
const MIN_FAMILY_SIZE_FOR_MONOTONY = 3;

// ─── Card-kind taxonomy ──────────────────────────────────────────────────────

/**
 * The observable kinds a nudge card falls into *today*. Deliberately derived from
 * fields that already exist rather than from the 21-type design palette: Ticket B
 * (THR-885) owns that palette, and a report keyed on types nothing yet emits would
 * be a table of zeroes — the dead-vocabulary shape THR-844 warns about. When the
 * palette lands, this function is the one place to widen.
 */
type CardKind = 'rider' | 'trait' | 'sphere' | 'free' | 'push';

function cardKind(nudge: {
  rider?: unknown; requiredTrait?: string; sphere?: string; essenceCost: number;
}): CardKind {
  if (nudge.rider) return 'rider';
  if (nudge.requiredTrait) return 'trait';
  if (nudge.sphere) return 'sphere';
  if (nudge.essenceCost <= 0) return 'free';
  return 'push';
}

const CARD_KINDS: readonly CardKind[] = ['push', 'rider', 'sphere', 'trait', 'free'];

// ─── Aggregation ─────────────────────────────────────────────────────────────

/**
 * Family key for a template id. `encounter.guild.brokered_peace` → `encounter.guild`;
 * a two-segment id keeps its first segment. Ids are dot-namespaced by convention, so
 * this groups the way the content files are organised without a hand-kept table.
 */
function familyOf(id: string): string {
  const parts = id.split('.');
  return parts.length > 2 ? parts.slice(0, 2).join('.') : (parts[0] ?? id);
}

interface Cell { count: number; templateIds: string[] }

function isDrawable(t: UnifiedActionTemplate): boolean {
  return (t.locationSubtypes?.length ?? 0) > 0;
}

/**
 * Which classes a template is drawable in.
 *
 * Read off `locationSubtypes` — the field the encounter cache actually filters on —
 * rather than off the advisory `settings`. That way a template placed the old way
 * (exact subtypes, no envelope) still counts, and the matrix reports the pool the
 * engine can deal instead of the pool that happens to have been migrated.
 */
function classesFor(t: UnifiedActionTemplate): Set<SettingClass> {
  const out = new Set<SettingClass>();
  for (const subtype of t.locationSubtypes ?? []) {
    const cls = settingClassForSubtype(subtype);
    if (cls) out.add(cls);
  }
  return out;
}

// ─── Render ──────────────────────────────────────────────────────────────────

function renderMatrix(matrix: Record<string, Record<string, Cell>>, totals: Record<string, number>): string {
  const header = `| setting | ${REACH_DOMAINS.join(' | ')} | **total** |`;
  const sep = `|---|${REACH_DOMAINS.map(() => '---:').join('|')}|---:|`;
  const rows = SETTING_CLASSES.map(cls => {
    const cells = REACH_DOMAINS.map(r => String(matrix[cls][r].count));
    return `| \`${cls}\` | ${cells.join(' | ')} | **${totals[cls]}** |`;
  });
  return [header, sep, ...rows].join('\n');
}

function renderGaps(matrix: Record<string, Record<string, Cell>>): string {
  const thin: string[] = [];
  for (const cls of SETTING_CLASSES) {
    for (const reach of REACH_DOMAINS) {
      const { count } = matrix[cls][reach];
      if (count <= THIN_CELL_THRESHOLD) thin.push(`- \`${cls}\` × \`${reach}\` — ${count}`);
    }
  }
  if (thin.length === 0) return `_No cell at or below ${THIN_CELL_THRESHOLD}._`;
  return [
    `${thin.length} of ${SETTING_CLASSES.length * REACH_DOMAINS.length} cells sit at or below ${THIN_CELL_THRESHOLD} drawable templates.`,
    'Advisory — a thin cell is a scene not yet written, not a build failure.',
    '',
    ...thin,
  ].join('\n');
}

function renderFamilies(families: Map<string, { cards: number; kinds: Record<CardKind, number>; templates: number }>): string {
  const rows: string[] = [];
  const monotonous: string[] = [];
  const sorted = [...families.entries()].sort((a, b) => b[1].cards - a[1].cards);
  for (const [family, agg] of sorted) {
    if (agg.cards === 0) continue;
    const mix = CARD_KINDS.map(k => `${k} ${agg.kinds[k]}`).join(', ');
    rows.push(`| \`${family}\` | ${agg.templates} | ${agg.cards} | ${mix} |`);
    if (agg.templates >= MIN_FAMILY_SIZE_FOR_MONOTONY) {
      const top = CARD_KINDS.reduce((a, b) => (agg.kinds[a] >= agg.kinds[b] ? a : b));
      const share = agg.kinds[top] / agg.cards;
      if (share >= MONOTONY_SHARE) {
        monotonous.push(`- \`${family}\` — ${(share * 100).toFixed(0)}% \`${top}\` across ${agg.cards} cards`);
      }
    }
  }

  if (rows.length === 0) {
    return '_No family authors a nudge hand yet — the corpus is paused behind THR-883._';
  }

  const table = [
    '| family | carded templates | cards | composition |',
    '|---|---:|---:|---|',
    ...rows,
  ].join('\n');

  const monotonySection = monotonous.length === 0
    ? `\n\n_No family exceeds the ${(MONOTONY_SHARE * 100).toFixed(0)}% single-kind share._`
    : `\n\n**Hand monotony (advisory)** — one card kind dominates:\n\n${monotonous.join('\n')}`;

  return table + monotonySection;
}

function render(): string {
  const drawable = UNIFIED_ACTION_TEMPLATES.filter(isDrawable);

  const matrix: Record<string, Record<string, Cell>> = {};
  for (const cls of SETTING_CLASSES) {
    matrix[cls] = {};
    for (const reach of REACH_DOMAINS) matrix[cls][reach] = { count: 0, templateIds: [] };
  }

  const totals: Record<string, number> = Object.fromEntries(SETTING_CLASSES.map(c => [c, 0]));
  let unclassed = 0;

  for (const t of drawable) {
    const classes = classesFor(t);
    if (classes.size === 0) { unclassed += 1; continue; }
    for (const cls of classes) {
      const cell = matrix[cls][t.reach];
      if (!cell) continue; // a reach outside REACH_DOMAINS — skip rather than throw
      cell.count += 1;
      cell.templateIds.push(t.id);
      totals[cls] += 1;
    }
  }

  const families = new Map<string, { cards: number; kinds: Record<CardKind, number>; templates: number }>();
  for (const t of UNIFIED_ACTION_TEMPLATES) {
    const cards = (t.steps ?? []).flatMap(s => ('nudges' in s ? (s.nudges ?? []) : []));
    if (cards.length === 0) continue;
    const key = familyOf(t.id);
    const agg = families.get(key)
      ?? { cards: 0, templates: 0, kinds: Object.fromEntries(CARD_KINDS.map(k => [k, 0])) as Record<CardKind, number> };
    agg.templates += 1;
    for (const card of cards) {
      agg.cards += 1;
      agg.kinds[cardKind(card)] += 1;
    }
    families.set(key, agg);
  }

  const envelopeMigrated = UNIFIED_ACTION_TEMPLATES.filter(t => (t.settings?.length ?? 0) > 0).length;

  return `<!-- GENERATED by \`npm run generate-setting-coverage\` — do not edit by hand. -->

# Setting Coverage Matrix

Generated from the live drawable pool. Regenerate with \`npm run generate-setting-coverage\`.

**What this is.** A visibility surface for encounter authoring (THR-884): which kinds
of place have scenes written for them, at which reach, and whether any family's nudge
hands have gone monotonous. Every threshold here is **advisory** — nothing in this
document fails a build. A thin cell is a scene not yet written.

## Pool

| | count |
|---|---:|
| templates in the pool | ${UNIFIED_ACTION_TEMPLATES.length} |
| drawable at ≥1 location subtype | ${drawable.length} |
| drawable but at no *authorable* subtype | ${unclassed} |
| declaring a setting envelope | ${envelopeMigrated} |

The third row counts templates placed only at worldgen overlay subtypes (wonders,
lairs, anomalies) that no setting class claims — see the scope note on
\`SETTING_CLASS_MAP\`. The fourth is the migration counter: it climbs as the corpus
moves from exact subtypes to declared envelopes.

## Settings × reach

Drawable-template count per cell. A template drawable in several classes is counted
in each — the question the matrix answers is "if a scene happens *here*, how much can
be dealt?", not "how many templates exist".

${renderMatrix(matrix, totals)}

## Thin cells

${renderGaps(matrix)}

## Per-family hand composition

Card kinds are derived from fields that exist today (rider / trait-gated /
sphere-gated / free / plain push). The 21-type design palette lands with THR-885;
this table widens then.

Family is read off the id's dot namespace (first two segments when there are three or
more, else the first). That is a proxy for authorial grouping, not a curated taxonomy
— read the monotony flag as "look here", not as a verdict.

${renderFamilies(families)}
`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const check = process.argv.includes('--check');
  const outPath = path.join(process.cwd(), OUTPUT_REL);
  const out = render();

  if (check) {
    // ADVISORY, mirroring generate-systems-inventory:check — a stale doc warns but
    // exits 0 so it can chain into check:process without breaking the advisory lint.
    const blocking = process.env.SETTING_COVERAGE_CHECK === 'blocking';
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : '';
    if (existing.trim() === out.trim()) {
      console.log('[generate-setting-coverage] --check: up to date.');
      process.exit(0);
    }
    console.warn(`[generate-setting-coverage] --check: ${OUTPUT_REL} is STALE. Run \`npm run generate-setting-coverage\`.`);
    process.exit(blocking ? 1 : 0);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf-8');
  console.log(`[generate-setting-coverage] wrote ${OUTPUT_REL}`);
}

main();
