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
 * writes it gets an empty pool and no error. The weekly retro deletes or fills them under
 * the sunset rule; badging is what makes that possible, and hiding them behind a seating
 * rule is what made them invisible for as long as they were.
 *
 * **The badge says which of three holes it is** (THR-1496). The six family tags that
 * shipped DEAD were all *asked for* — seated on a `tagFilters` query site with no bearer.
 * THR-1496 repointed every one of those query sites at live content, which left the tags
 * asked for by nothing and worn by nothing. That is a different verdict with a different
 * action ("delete" rather than "author a bearer"), so {@link askedForTags} computes it
 * instead of the table asserting a premise that a content repair can quietly falsify —
 * which is exactly what happened to the sentence this replaced.
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

/**
 * Which dead tags some query site still asks for (THR-1496).
 *
 * **Why a text scan is the right instrument here, and only here.** This is asked only of
 * tags with zero bearers, and a tag with zero bearers appears in no catalog entry — so
 * every occurrence left under `src/data` (outside the vocabulary file that seats it) is a
 * site *asking* for it. That removes the usual objection to grepping for a literal: there
 * is no authored-tag noise to filter out, because there is no authored tag. The
 * alternative — importing the template corpus to walk `tagFilters` — would see reward
 * recipes only, and a tag can also be asked for by an encounter seed query, a
 * `condition_remove` payload or a `tag_immunity`, so the precise-looking instrument would
 * in fact be the narrower one.
 *
 * Fail-soft (NFP #4): an unreadable tree reports "asked for" for everything, which is the
 * conservative direction — it proposes authoring a bearer rather than deleting vocabulary.
 */
function askedForTags(repoRoot: string, deadTags: readonly string[]): ReadonlySet<string> {
  const out = new Set<string>();
  if (deadTags.length === 0) return out;

  const seatingFile = path.join('src', 'data', 'content-tags.ts');
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      // `__tests__` is excluded on purpose: a test that *names* a dead tag — the
      // seating rule's `READER_ONLY` allowlist does exactly this — is bookkeeping
      // about the tag, not a site asking for it. Counting it would make every dead
      // tag permanently "asked for" by the very list that tracks its deadness.
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__') walk(full);
      } else if (entry.name.endsWith('.ts')) files.push(full);
    }
  };

  try {
    walk(path.join(repoRoot, 'src', 'data'));
  } catch {
    // Tree unreadable — every dead tag is reported as asked-for (see fail-soft above).
    for (const t of deadTags) out.add(t);
    return out;
  }

  for (const file of files) {
    if (file.endsWith(seatingFile)) continue;
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    for (const tag of deadTags) {
      // Quoted, so `#supply` does not match `#supply_line` or a word in prose.
      if (text.includes(`'${tag}'`) || text.includes(`"${tag}"`)) out.add(tag);
    }
  }
  return out;
}

function renderMarkdown(
  views: readonly TagView[],
  unknownKinds: readonly string[],
  askedFor: ReadonlySet<string>,
): string {
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
        'The weekly retro either authors a bearer or deletes the tag (the sunset rule), and the last column says **which**, because the three holes want three different answers. ' +
        'A *derived* tag with no bearer is a cosmology word the corpus has simply not reached yet: not a defect, never deleted. ' +
        'An *asked-for* tag with no bearer is a query site wanting content nobody wrote — a hole in the corpus, and the case for authoring a bearer. ' +
        'An *orphaned* tag is asked for by nothing and worn by nothing: it is vocabulary with no reader and no bearer, which is the sunset rule\'s own deletion predicate.',
    );
    L.push('');
    L.push('| Tag | Axis | Why it is dead |');
    L.push('|---|---|---|');
    for (const v of dead) {
      const why =
        v.def.axis === 'reach' || v.def.axis === 'sphere'
          ? 'derived from the cosmology — no entry has reached it yet; not deletable'
          : askedFor.has(v.def.tag)
            ? 'a query site asks for it and no entry wears it — author a bearer, or repoint the query'
            : 'orphaned — no query site asks for it and no entry wears it; deletable under the sunset rule';
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
  const askedFor = askedForTags(repoRoot, views.filter(v => v.dead).map(v => v.def.tag));
  const md = renderMarkdown(views, unknownKinds, askedFor);
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
