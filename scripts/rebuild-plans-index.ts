import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// rebuild-plans-index — generated catalog of Docs/plans/*.md (THR-576)
//
// Docs/plans/ holds 500+ design docs with no index. "What's current?" is only
// answerable via Canon pages, which don't cover every domain — so agents
// triangulate and occasionally implement from superseded plans. This script
// emits an exhaustive, deterministic catalog under Docs/plans/INDEX.md: one
// line per plan (date, topic, linked Linear issue, superseded marker when a
// doc declares itself stale or is superseded by a later plan). Canon pages
// remain the curated "what's current" layer; this index is the fallback.
//
// Mirrors the scripts/rebuild-index.ts (vault) and generate-systems-inventory
// patterns: pure fs/path, deterministic output (no generation timestamp so the
// --check staleness comparison is stable), esbuild→node bundle, --dry-run.
// ---------------------------------------------------------------------------

const PLANS_DIR_REL = 'Docs/plans';
const OUTPUT_REL = 'Docs/plans/INDEX.md';
const LINEAR_ISSUE_BASE = 'https://linear.app/threadbare/issue';

/** Top-level .md files that are not design plans — excluded from the index. */
const EXCLUDE_FILES = new Set(['_template.md', 'INDEX.md']);

/** Status keywords that mark a plan as no longer current. */
const STALE_STATUS_RE = /\b(superseded|deprecated|rejected|obsolete|abandoned)\b/i;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlanDoc {
  /** Basename with extension, e.g. "2026-07-18-topic.md" — used as link + key */
  file: string;
  /** YYYY-MM-DD from the filename or front-matter, or null when undated */
  date: string | null;
  /** Human-readable title (H1 → `> **title:**` → filename slug) */
  title: string;
  /** Referenced Linear issue id (e.g. "THR-576"), or null */
  linear: string | null;
  /** Declared status field, trimmed to one short line, or null */
  status: string | null;
  /** True when this doc declares itself stale via its own status field */
  selfStale: boolean;
  /** Successor doc filename when this doc is superseded, or null */
  supersededBy: string | null;
  /** Filenames this doc declares it supersedes (structured refs only) */
  supersedes: string[];
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Split leading YAML/blockquote front-matter from the body (best-effort). */
function frontMatter(content: string): string {
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end !== -1) return content.slice(3, end);
  }
  return '';
}

function extractDate(file: string, content: string): string | null {
  const fromName = file.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (fromName) return fromName[1];
  // Front-matter `created:` or a `**Date:**` line.
  const created = content.match(/^created:\s*(\d{4}-\d{2}-\d{2})/m);
  if (created) return created[1];
  const dateLine = content.match(/^\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/m);
  if (dateLine) return dateLine[1];
  return null;
}

function extractTitle(file: string, content: string): string {
  const h1 = content.match(/^#\s+(.+?)\s*$/m);
  if (h1) return h1[1].trim();
  // Template skeleton: `> **title:** \`...\``
  const titleField = content.match(/^>\s*\*\*title:\*\*\s*`?([^`\n]+)`?/m);
  if (titleField) return titleField[1].trim();
  // Filename slug: drop date prefix + extension, spacify.
  const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  return slug.replace(/[-_]/g, ' ');
}

function extractLinear(content: string): string | null {
  // Prefer a structured linear_issue field (front-matter or blockquote).
  const field = content.match(/linear_issue:\**\s*(THR-\d+)/i);
  if (field) return field[1].toUpperCase();
  // Then an auto-close keyword.
  const keyword = content.match(/\b(?:Fixes|Closes|Resolves)\s+(THR-\d+)/i);
  if (keyword) return keyword[1].toUpperCase();
  // Fall back to the first THR reference anywhere in the doc.
  const any = content.match(/\bTHR-\d+/i);
  return any ? any[0].toUpperCase() : null;
}

function extractStatus(fm: string, content: string): string | null {
  const fmStatus = fm.match(/^status:\s*(.+?)\s*$/m);
  if (fmStatus) return truncate(fmStatus[1].trim(), 40);
  const line = content.match(/^\*\*Status:\*\*\s*(.+?)\s*$/m);
  if (line) return truncate(line[1].trim(), 40);
  return null;
}

/** Structured supersedes references → normalized filenames (best-effort). */
function extractSupersedes(fm: string, content: string, known: Set<string>): string[] {
  const refs = new Set<string>();
  // `**Supersedes:** <ref>` / `**Supersedes ...:** <ref>` lines.
  for (const m of content.matchAll(/^\*\*Supersedes[^:]*:\*\*\s*(.+?)\s*$/gm)) {
    for (const f of resolveRefs(m[1], known)) refs.add(f);
  }
  // Front-matter `supersedes: [a, b]` or `supersedes: a`.
  const fmLine = fm.match(/^supersedes:\s*(.+?)\s*$/m);
  if (fmLine) for (const f of resolveRefs(fmLine[1], known)) refs.add(f);
  return [...refs];
}

/** Pull known plan filenames out of a free-form reference string. */
function resolveRefs(raw: string, known: Set<string>): string[] {
  const out: string[] = [];
  // Tokens look like `2026-04-06-meet-the-first-redesign` (± backticks/.md).
  for (const tok of raw.matchAll(/[`'"\[\s]?(\d{4}-\d{2}-\d{2}-[a-z0-9-]+?)(?:\.md)?[`'"\],\s]/gi)) {
    const withExt = `${tok[1]}.md`;
    if (known.has(withExt)) out.push(withExt);
  }
  return out;
}

function extractSupersededByField(fm: string, known: Set<string>): string | null {
  const m = fm.match(/^superseded_by:\s*(.+?)\s*$/m);
  if (!m) return null;
  const resolved = resolveRefs(m[1] + ' ', known);
  return resolved[0] ?? null;
}

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + '…';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Options {
  dryRun?: boolean;
  check?: boolean;
}

export function rebuildPlansIndex(options: Options = {}): void {
  const { dryRun = false, check = false } = options;
  const repoRoot = process.cwd();
  const plansDir = path.join(repoRoot, PLANS_DIR_REL);

  const files = fs
    .readdirSync(plansDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md') && !EXCLUDE_FILES.has(e.name))
    .map((e) => e.name)
    .sort();

  const known = new Set(files);

  // First pass: parse every doc.
  const docs: PlanDoc[] = files.map((file) => {
    const content = fs.readFileSync(path.join(plansDir, file), 'utf-8');
    const fm = frontMatter(content);
    const status = extractStatus(fm, content);
    return {
      file,
      date: extractDate(file, content),
      title: extractTitle(file, content),
      linear: extractLinear(content),
      status,
      selfStale: (status !== null && STALE_STATUS_RE.test(status)) || !!fm.match(/^status:.*\b(superseded|deprecated)\b/im),
      supersededBy: extractSupersededByField(fm, known),
      supersedes: extractSupersedes(fm, content, known),
    };
  });

  // Second pass: back-fill supersededBy from other docs' structured supersedes refs.
  const byFile = new Map(docs.map((d) => [d.file, d]));
  for (const doc of docs) {
    for (const target of doc.supersedes) {
      const t = byFile.get(target);
      if (t && !t.supersededBy) t.supersededBy = doc.file;
    }
  }

  // Group by year-month (YYYY-MM); undated bucketed separately.
  const groups = new Map<string, PlanDoc[]>();
  const undated: PlanDoc[] = [];
  for (const doc of docs) {
    if (!doc.date) {
      undated.push(doc);
      continue;
    }
    const ym = doc.date.slice(0, 7);
    (groups.get(ym) ?? groups.set(ym, []).get(ym)!).push(doc);
  }
  // Newest month first; within a month, newest date first then filename.
  const orderedMonths = [...groups.keys()].sort().reverse();
  for (const ym of orderedMonths) {
    groups.get(ym)!.sort((a, b) => (b.date! === a.date! ? a.file.localeCompare(b.file) : b.date!.localeCompare(a.date!)));
  }
  undated.sort((a, b) => a.file.localeCompare(b.file));

  const staleCount = docs.filter((d) => d.selfStale || d.supersededBy).length;
  const out = render(docs.length, staleCount, orderedMonths, groups, undated);
  const outPath = path.join(repoRoot, OUTPUT_REL);

  if (check) {
    // Advisory by default (mirrors generate-systems-inventory:check): a stale
    // index warns but exits 0 so it chains into check:process without breaking
    // the advisory lint. Flip to blocking with PLANS_INDEX_CHECK=blocking.
    const blocking = process.env.PLANS_INDEX_CHECK === 'blocking';
    const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf-8') : '';
    if (existing.trim() === out.trim()) {
      console.log('[rebuild-plans-index] --check: up to date.');
      process.exit(0);
    }
    console.warn(`[rebuild-plans-index] --check: ${OUTPUT_REL} is STALE. Run \`npm run rebuild-plans-index\`.`);
    process.exit(blocking ? 1 : 0);
  }

  if (dryRun) {
    console.log(`[rebuild-plans-index] --dry-run: ${docs.length} plans, ${staleCount} superseded/stale. No files written.`);
    console.log('\n--- Preview (first 40 lines) ---');
    console.log(out.split('\n').slice(0, 40).join('\n'));
    return;
  }

  fs.writeFileSync(outPath, out, 'utf-8');
  console.log(`[rebuild-plans-index] wrote ${OUTPUT_REL} — ${docs.length} plans across ${orderedMonths.length} months (${staleCount} superseded/stale, ${undated.length} undated).`);
}

function render(
  total: number,
  staleCount: number,
  orderedMonths: string[],
  groups: Map<string, PlanDoc[]>,
  undated: PlanDoc[],
): string {
  const L: string[] = [];
  L.push('---');
  L.push('tags: [index, generated, plans-catalog]');
  L.push('---');
  L.push('');
  L.push('# Docs/plans — Generated Index');
  L.push('');
  L.push('> Exhaustive catalog of every design plan under `Docs/plans/`, newest first.');
  L.push('> **Do not edit by hand** — regenerate with `npm run rebuild-plans-index` (`:dry` to preview).');
  L.push('>');
  L.push('> Canon pages (`Docs/canon/`) remain the curated "what is current" layer; this index is the exhaustive fallback catalog underneath. A ⚠️ marker means the plan declares itself stale or is superseded by a later plan — prefer the successor.');
  L.push('');
  L.push(`_${total} plans indexed · ${staleCount} superseded/stale · generated by \`scripts/rebuild-plans-index.ts\`._`);
  L.push('');

  for (const ym of orderedMonths) {
    const monthDocs = groups.get(ym)!;
    L.push(`## ${ym} (${monthDocs.length})`);
    L.push('');
    for (const doc of monthDocs) L.push(renderLine(doc));
    L.push('');
  }

  if (undated.length > 0) {
    L.push(`## Reference / undated (${undated.length})`);
    L.push('');
    for (const doc of undated) L.push(renderLine(doc));
    L.push('');
  }

  return L.join('\n');
}

function renderLine(doc: PlanDoc): string {
  const parts: string[] = [];
  parts.push(`**${doc.date ?? '—'}**`);
  parts.push(`[${escapePipes(doc.title)}](${encodeURI(doc.file)})`);
  if (doc.linear) parts.push(`[${doc.linear}](${LINEAR_ISSUE_BASE}/${doc.linear})`);
  if (doc.supersededBy) {
    const t = byTitle(doc.supersededBy);
    parts.push(`⚠️ superseded by [${escapePipes(t)}](${encodeURI(doc.supersededBy)})`);
  } else if (doc.selfStale) {
    parts.push(`⚠️ ${doc.status ?? 'stale'}`);
  } else if (doc.status) {
    parts.push(`_${escapePipes(doc.status)}_`);
  }
  return `- ${parts.join(' · ')}`;
}

// Successor titles aren't threaded through render; show the filename slug.
function byTitle(file: string): string {
  return file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '').replace(/[-_]/g, ' ');
}

function escapePipes(text: string): string {
  return text.replace(/\|/g, '\\|');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('rebuild-plans-index.ts') ||
  process.argv[1]?.endsWith('rebuild-plans-index.mjs')
) {
  const args = process.argv.slice(2);
  rebuildPlansIndex({ dryRun: args.includes('--dry-run'), check: args.includes('--check') });
}
