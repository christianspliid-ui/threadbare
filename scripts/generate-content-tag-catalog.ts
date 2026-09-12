/**
 * generate-content-tag-catalog — THR-1486, slice 2 of THR-1481.
 *
 * Renders the closed tag vocabulary (`src/data/content-tags.ts`) as the authoring
 * reference every content pipeline reads: one table per axis, each tag with its
 * description and a bearer count per content kind.
 *
 * Output: `.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md`,
 * referenced by the undertaking and attachment pipelines rather than copied into them —
 * one file, three readers, no drift between them.
 *
 * **The DEAD badge is the point of generating this rather than writing it.** A tag with
 * {@link CONTENT_TAG_DEAD_BEARERS} bearers is a query nothing can answer: an author who
 * writes it gets an empty pool and no error. Six tags ship DEAD on purpose — they are
 * seated on a `tagFilters` query site that has no bearer yet, which is a real hole in
 * the corpus and one this page is the only surface that shows. The weekly retro deletes
 * or fills them under the sunset rule; badging is what makes that possible, and hiding
 * them behind a seating rule is what made them invisible for as long as they were.
 *
 * Like its content-object sibling this generator boots **no world** — content is
 * authored, not minted — so it costs about a second and is cheap enough to sit under
 * `check:generated-freshness` as a blocking gate.
 *
 * Fail-soft (NFP #4): a catalog that throws on import takes its own census row to
 * UNKNOWN rather than taking the page down.
 *
 * Usage:
 *   npm run generate-content-tag-catalog
 *   npm run generate-content-tag-catalog:check
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  CONTENT_TAGS,
  CONTENT_TAG_DEAD_BEARERS,
  CONTENT_TAG_MIN_BEARERS,
  contentTagsOnAxis,
  type ContentTagDef,
} from '../src/data/content-tags';
import { CONTENT_OBJECT_KINDS, type ContentObjectKindId, type ContentTagAxis } from '../src/data/content-objects';
import { authoredTags, effectiveTags, entriesOfKind } from '../src/data/contentCatalogs';

// ─── Tunable constants (NFP #1) ─────────────────────────────────────────────

/** Axis render order — cosmology first, then what the thing is, then what it is about. */
export const AXIS_ORDER: readonly ContentTagAxis[] = ['reach', 'sphere', 'form', 'family', 'polarity'];

/** One line per axis, so the page explains its own grouping to an authoring agent. */
const AXIS_BLURB: Readonly<Record<ContentTagAxis, string>> = {
  reach: 'The eight Reaches. **Derived** from `REACH_DOMAINS` — never restate them here. Projected from a typed `reach` field wherever the kind has one.',
  sphere: 'The twelve Spheres. **Derived** from `SPHERE_NAMES`. Projected from `sphereAffinity` on the kinds whose registry row names it.',
  form: 'What the thing *is* — its shape in a mortal\'s hands. Authored.',
  family: 'What class of story-object it belongs to, and what walk of life it comes from. Authored, and the widest axis by design.',
  polarity: 'Whether the thing is good or ill to carry. The two words the condition proxy-event classifier already reads.',
};

const OUTPUT_REL = path.join('.claude', 'skills', 'encounter-pipeline', 'reference', 'content-tag-catalog.generated.md');

// ─── Census ─────────────────────────────────────────────────────────────────

export interface TagView {
  readonly def: ContentTagDef;
  /** Bearer count per kind — authored only, since a projected tag is not an authoring choice. */
  readonly perKind: ReadonlyMap<ContentObjectKindId, number>;
  readonly authoredTotal: number;
  /** Bearers including projection — what a query would actually match. */
  readonly effectiveTotal: number;
  readonly dead: boolean;
}

export function buildViews(): { views: TagView[]; unknownKinds: string[] } {
  const authoredCounts = new Map<string, Map<ContentObjectKindId, number>>();
  const effectiveCounts = new Map<string, number>();
  const unknownKinds: string[] = [];

  for (const kind of CONTENT_OBJECT_KINDS) {
    let entries;
    try {
      entries = entriesOfKind(kind.id);
    } catch (err) {
      unknownKinds.push(`${kind.id}: ${(err as Error).message}`);
      continue;
    }
    for (const entry of entries) {
      for (const tag of authoredTags(entry)) {
        const perKind = authoredCounts.get(tag) ?? new Map<ContentObjectKindId, number>();
        perKind.set(kind.id, (perKind.get(kind.id) ?? 0) + 1);
        authoredCounts.set(tag, perKind);
      }
      for (const tag of effectiveTags(kind.id, entry)) {
        effectiveCounts.set(tag, (effectiveCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const views = CONTENT_TAGS.map(def => {
    const perKind = authoredCounts.get(def.tag) ?? new Map<ContentObjectKindId, number>();
    const authoredTotal = [...perKind.values()].reduce((a, b) => a + b, 0);
    const effectiveTotal = effectiveCounts.get(def.tag) ?? 0;
    return { def, perKind, authoredTotal, effectiveTotal, dead: effectiveTotal <= CONTENT_TAG_DEAD_BEARERS };
  });
  return { views, unknownKinds };
}

// ─── Render ─────────────────────────────────────────────────────────────────

function bearersText(view: TagView): string {
  if (view.perKind.size === 0) return '—';
  return [...view.perKind.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([kind, n]) => `${kind.replace(/_template$/, '')} ${n}`)
    .join(' · ');
}

function renderMarkdown(views: readonly TagView[], unknownKinds: readonly string[]): string {
  const dead = views.filter(v => v.dead);
  const L: string[] = [];
  L.push('<!-- GENERATED by `npm run generate-content-tag-catalog` — do not hand-edit. Vocabulary: `src/data/content-tags.ts` -->');
  L.push('');
  L.push('# Content tag catalog');
  L.push('');
  L.push(
    `The closed vocabulary an author may hang on a piece of content — ${views.length} tags across ${AXIS_ORDER.length} axes. ` +
      'A tag not on this page is not a tag: `contentTags.test.ts` fails any catalog entry carrying a spelling that is not seated in `src/data/content-tags.ts`, ' +
      'and the attachment gate (`npm run check:attachment -- --all`) fails it by name before the test does.',
  );
  L.push('');
  L.push('**Reading the counts.** *Bearers* is how many entries of each kind **author** the tag. *Matched* is how many a query would actually hit, which is higher wherever the kind projects the axis from a typed field (an encounter\'s `reach`, a power\'s `sphereAffinity`) — projection beats authoring, so a projected tag is never written by hand.');
  L.push('');
  L.push('**Adding a tag is a design-session decision**, recorded on `Docs/canon/content-objects.md`. The seating rule the migration used, for reference: a spelling survives with ≥1 runtime reader **or** ≥ ' + CONTENT_TAG_MIN_BEARERS + ' bearers.');
  L.push('');

  L.push('## Dead tags');
  L.push('');
  if (dead.length === 0) {
    L.push(`No dead tags: every seated tag is worn by at least one entry above the \`CONTENT_TAG_DEAD_BEARERS\` threshold (${CONTENT_TAG_DEAD_BEARERS}).`);
  } else {
    L.push(
      `**${dead.length} tag(s) match nothing.** A query naming one of these resolves an empty set and the author sees no error — which is why they are badged rather than quietly seated. ` +
        'The weekly retro either authors a bearer or deletes the tag (the sunset rule). Two different holes sit in this table and the last column tells them apart: an *authored* tag with no bearer is a query site asking for content nobody wrote, which is a hole in the corpus; a *derived* tag with no bearer is a cosmology word the corpus has simply not reached yet, which is not a defect and is never deleted.',
    );
    L.push('');
    L.push('| Tag | Axis | Why it is dead |');
    L.push('|---|---|---|');
    for (const v of dead) {
      const why =
        v.def.axis === 'reach' || v.def.axis === 'sphere'
          ? 'derived from the cosmology — no entry has reached it yet; not deletable'
          : 'a `tagFilters` query site asks for it and no entry wears it';
      L.push(`| \`${v.def.tag}\` | ${v.def.axis} | ${why} |`);
    }
  }
  L.push('');

  if (unknownKinds.length > 0) {
    L.push('## UNKNOWN');
    L.push('');
    L.push('A catalog threw on census; its counts are missing from every table below.');
    L.push('');
    for (const u of unknownKinds) L.push(`- \`${u}\``);
    L.push('');
  }

  for (const axis of AXIS_ORDER) {
    const onAxis = views.filter(v => v.def.axis === axis);
    L.push(`## ${axis}`);
    L.push('');
    L.push(AXIS_BLURB[axis]);
    L.push('');
    L.push(`**${onAxis.length} tags.**`);
    L.push('');
    L.push('| Tag | What it means | Bearers | Matched | |');
    L.push('|---|---|---|---|---|');
    for (const v of onAxis) {
      L.push(
        `| \`${v.def.tag}\` | ${v.def.description} | ${bearersText(v)} | ${v.effectiveTotal} | ${v.dead ? '**DEAD**' : ''} |`,
      );
    }
    L.push('');
  }

  L.push('## Kinds and their required axes');
  L.push('');
  L.push('An entry of a kind must carry every axis its registry row requires. The column grows only when the whole corpus of that kind already satisfies the axis, so a required axis never ships red.');
  L.push('');
  L.push('| Kind | Required axes | Projections (axis ← typed field) |');
  L.push('|---|---|---|');
  for (const kind of CONTENT_OBJECT_KINDS) {
    const axes = kind.requiredAxes.length ? kind.requiredAxes.map(a => `\`${a}\``).join(' ') : '—';
    const projections = Object.entries(kind.projections).length
      ? Object.entries(kind.projections).map(([a, f]) => `\`${a}\` ← \`${f}\``).join(' · ')
      : '—';
    L.push(`| \`${kind.id}\` | ${axes} | ${projections} |`);
  }
  L.push('');
  return L.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const check = process.argv.includes('--check');
  const repoRoot = process.cwd();
  const { views, unknownKinds } = buildViews();
  const md = renderMarkdown(views, unknownKinds);
  const outPath = path.join(repoRoot, OUTPUT_REL);

  if (check) {
    const fresh = fs.existsSync(outPath) && fs.readFileSync(outPath, 'utf-8').trim() === md.trim();
    if (!fresh) {
      console.error(`[generate-content-tag-catalog] --check: ${OUTPUT_REL} STALE. Run \`npm run generate-content-tag-catalog\`.`);
      process.exit(1);
    }
    console.log(`[generate-content-tag-catalog] --check: up to date — ${views.length} tags, ${views.filter(v => v.dead).length} DEAD.`);
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(
    `[generate-content-tag-catalog] wrote ${OUTPUT_REL} — ${views.length} tags across ${AXIS_ORDER.length} axes, ${views.filter(v => v.dead).length} DEAD.`,
  );
}

// Only generate when this module is the entry point — `content-census.ts` imports
// `buildViews` for the DEAD-tag half of the weekly hygiene report, and an
// unguarded `main()` would make *reading* the census write the catalog as a side
// effect (THR-686's hazard, exactly).
//
// Gated on the entry file's basename rather than `import.meta.url`, because
// `esbuild --bundle` rewrites `import.meta.url` to the bundle's own path and the
// usual guard evaluates true inside a bundle.
const entryBasename = path.basename(process.argv[1] ?? '');
if (entryBasename.startsWith('generate-content-tag-catalog')) {
  main();
}
