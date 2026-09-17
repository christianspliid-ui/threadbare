/**
 * Build-time generator for the Ubiquitous Language dashboard (`?view=ul`).
 *
 * Reads the seven shards in `Docs/ubiquitous-language/`, parses each `### Term`
 * block, and emits a typed JSON snapshot at `src/data/ul-dashboard.generated.json`
 * that the dashboard consumes. Build-step warnings are preserved into the JSON
 * `warnings[]` array (rendered in the dashboard footer) and printed to stderr.
 *
 * Mirrors the esbuild bundling + CLI pattern of `scripts/mirror-ul.ts`.
 *
 * Output is deterministic: same shard sources in, byte-identical JSON out. This
 * artifact carried a wall-clock `generatedAt` until THR-714. `check:generated-
 * freshness` ignored it as volatile, but git does not — so two PRs that each ran
 * `npm run prebuild` produced different blobs and conflicted on every cascade
 * merge, which under strict branch protection stalls armed auto-merges with no
 * failure signal (`gh pr update-branch` no-ops on DIRTY). Do not reintroduce a
 * per-run field here; a generated artifact that changes without its inputs
 * changing is a merge hazard, not a freshness signal.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA_VERSION = 1;

export type ULShardId =
  | 'cosmology'
  | 'agents'
  | 'encounters'
  | 'traits'
  | 'prose'
  | 'graph'
  | 'coordination'
  | 'process';

/**
 * `rejected` and `deprecated` carry opposite histories and the same instruction:
 * `deprecated` was canonical and has been retired (kept so historical records
 * resolve), `rejected` was considered and refused and was never admitted. A
 * rejected term is recorded precisely because it is tempting enough to be
 * reintroduced by a later session reading an exploratory draft (THR-991).
 */
export type ULTermStatus =
  | 'canonical'
  | 'proposed'
  | 'deprecated'
  | 'rejected'
  | 'retired'
  | 'unknown';

/**
 * The status words a `**Status:**` line may begin with. `retired` joined the set
 * at THR-1470: the Encounters shard had carried `**Status:** retired (THR-108; …)`
 * since THR-1339 and the README tally counted it as its own row, while this
 * parser degraded it to `unknown` — a real status the dashboard could not show.
 */
const STATUS_WORDS: ReadonlySet<string> = new Set([
  'canonical',
  'proposed',
  'deprecated',
  'rejected',
  'retired',
]);

/**
 * Parse a `**Status:**` value into its leading status word and the note that
 * follows it (THR-1470).
 *
 * The **annotated form is the recommended one** — `**Status:** canonical (seated
 * 2026-09-03, THR-1390)` records when and why a term was seated, which a bare
 * `canonical` cannot. Until THR-1470 the parser exact-matched bare words only,
 * so the better authoring lost: ten seated terms rendered status-less on
 * `?view=ul` and each emitted two warnings (impediment rows 958, 966).
 *
 * Membership predicate: any value that *begins with* a status word, followed by
 * end-of-line, whitespace, an opening parenthesis or a dash/colon separator,
 * parses to that status. The remainder — with one leading separator and one
 * whole-value parenthetical pair stripped — is the note; `null` when empty.
 * `canonical-ish` and `weird-status` do not begin with a status word in this
 * sense and stay `unknown`.
 */
export function parseStatusValue(
  rawValue: string,
): { status: ULTermStatus; note: string | null } {
  const trimmed = rawValue.trim();
  const match = trimmed.match(/^([A-Za-z]+)(?=$|[\s(—–:,])(.*)$/s);
  if (!match) return { status: 'unknown', note: null };
  const word = match[1].toLowerCase();
  if (!STATUS_WORDS.has(word)) return { status: 'unknown', note: null };

  let rest = match[2].trim();
  // One leading separator: `canonical — seated in …`, `canonical: …`.
  rest = rest.replace(/^[—–\-:,]\s*/, '').trim();
  // One whole-value parenthetical pair: `(seated by THR-1380 …)` → `seated by …`.
  if (rest.startsWith('(') && rest.endsWith(')') && isSingleParenGroup(rest)) {
    rest = rest.slice(1, -1).trim();
  }
  return { status: word as ULTermStatus, note: rest.length > 0 ? rest : null };
}

/** True when the outer `(`…`)` of `value` are one matched pair, not `(a) (b)`. */
function isSingleParenGroup(value: string): boolean {
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0 && i < value.length - 1) return false;
    }
  }
  return depth === 0;
}

export interface ULShard {
  id: ULShardId;
  filename: string;
  title: string;
  contentAdjacent: boolean;
  termCount: number;
  blurb: string;
}

export interface ULSeeAlsoLink {
  raw: string;
  termName: string;
  resolvedSlug: string | null;
}

export interface ULTerm {
  shardId: ULShardId;
  slug: string;
  name: string;
  aliases: string[];
  status: ULTermStatus;
  /**
   * The annotation after the status word — `seated by THR-1380 with the THR-1299
   * implementation` — or `null` for a bare status (THR-1470). Additive field;
   * `SCHEMA_VERSION` stays at 1 because no consumer breaks on its presence.
   */
  statusNote: string | null;
  oneLiner: string;
  body: string;
  seeAlso: ULSeeAlsoLink[];
  sourcePath: string;
  contentAdjacent: boolean;
}

export type ULGenerationWarningKind =
  | 'unresolved_see_also'
  | 'missing_status'
  | 'duplicate_slug'
  | 'malformed_aliases'
  | 'missing_one_liner';

export interface ULGenerationWarning {
  kind: ULGenerationWarningKind;
  shardId: ULShardId;
  termSlug: string;
  detail: string;
}

export interface ULDashboardData {
  schemaVersion: typeof SCHEMA_VERSION;
  shards: ULShard[];
  terms: ULTerm[];
  warnings: ULGenerationWarning[];
}

const SOURCE_DIR = 'Docs/ubiquitous-language';
const OUTPUT_FILE = 'src/data/ul-dashboard.generated.json';
const README_FILE = 'README.md';

const SHARD_FILE_TO_ID: Record<string, ULShardId> = {
  'Cosmology.md': 'cosmology',
  'Agents.md': 'agents',
  'Encounters.md': 'encounters',
  'Traits.md': 'traits',
  'Prose.md': 'prose',
  'Graph.md': 'graph',
  'Coordination.md': 'coordination',
  'Process.md': 'process',
};

/** GitHub-compatible heading slug. Mirrors the algorithm in `scripts/mirror-ul.ts`. */
export function slugifyHeading(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=\[\]{}|\\;:'",.<>/?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface ParsedReadme {
  shardOrder: string[];
  contentAdjacentByFile: Map<string, boolean>;
  oneLinersBySlug: Map<string, string>;
}

function parseReadme(readmeContent: string): ParsedReadme {
  const shardOrder: string[] = [];
  const contentAdjacentByFile = new Map<string, boolean>();
  const oneLinersBySlug = new Map<string, string>();

  const lines = readmeContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('| [')) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 5) {
        const fileMatch = parts[1].match(/\[([^\]]+\.md)\]/);
        if (fileMatch) {
          const file = fileMatch[1];
          if (!shardOrder.includes(file)) shardOrder.push(file);
          contentAdjacentByFile.set(file, parts[3].includes('✅'));
        }
      }
    }
    const indexMatch = line.match(
      /^- \*\*\[([^\]]+)\]\(\.\/([A-Za-z0-9-]+)\.md#([^)]+)\)\*\*\s*[—–-]\s*(.+)$/,
    );
    if (indexMatch) {
      const [, , shardBase, anchor, oneLiner] = indexMatch;
      const file = `${shardBase}.md`;
      const fullSlug = `${file}#${anchor.trim()}`;
      oneLinersBySlug.set(fullSlug, oneLiner.trim());
    }
  }

  return { shardOrder, contentAdjacentByFile, oneLinersBySlug };
}

interface RawTermBlock {
  name: string;
  bodyLines: string[];
}

function splitShardIntoTermBlocks(content: string): {
  intro: string;
  terms: RawTermBlock[];
} {
  const lines = content.split(/\r?\n/);
  const introLines: string[] = [];
  const terms: RawTermBlock[] = [];
  let current: RawTermBlock | null = null;
  let pastFirstHeading = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      pastFirstHeading = true;
      continue;
    }
    const termMatch = line.match(/^###\s+(.+?)\s*$/);
    if (termMatch) {
      if (current) terms.push(current);
      current = { name: termMatch[1].trim(), bodyLines: [] };
      continue;
    }
    if (current) {
      current.bodyLines.push(line);
    } else if (pastFirstHeading) {
      introLines.push(line);
    }
  }
  if (current) terms.push(current);

  const intro = introLines
    .join('\n')
    .replace(/^\s*---\s*$/gm, '')
    .trim()
    .split(/\n{2,}/)[0]
    ?.trim()
    ?? '';

  return { intro, terms };
}

interface ParsedTermBody {
  aliases: string[];
  status: ULTermStatus;
  statusNote: string | null;
  seeAlsoRaw: string[];
  body: string;
  warnings: { kind: ULGenerationWarningKind; detail: string }[];
}

function parseTermBody(rawLines: string[]): ParsedTermBody {
  const warnings: { kind: ULGenerationWarningKind; detail: string }[] = [];
  let aliases: string[] = [];
  let status: ULTermStatus = 'unknown';
  let statusNote: string | null = null;
  let sawStatusLine = false;
  let seeAlsoRaw: string[] = [];
  const bodyLines: string[] = [];
  let metadataDone = false;

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed === '---') {
      metadataDone = true;
      break;
    }
    if (!metadataDone) {
      const aliasMatch = line.match(/^\*\*Aliases:\*\*\s*(.+)$/i);
      const seeMatch = line.match(/^\*\*Also see:\*\*\s*(.+)$/i);
      const statusMatch = line.match(/^\*\*Status:\*\*\s*(.+)$/i);
      if (aliasMatch) {
        aliases = aliasMatch[1]
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
        if (aliases.length === 0) {
          warnings.push({
            kind: 'malformed_aliases',
            detail: '`Aliases:` line present but parsed empty.',
          });
        }
        continue;
      }
      if (seeMatch) {
        const links: string[] = [];
        const linkRe = /\[\[([^\]]+)\]\]/g;
        let m: RegExpExecArray | null;
        while ((m = linkRe.exec(seeMatch[1])) !== null) {
          links.push(m[1].trim());
        }
        seeAlsoRaw = links;
        continue;
      }
      if (statusMatch) {
        sawStatusLine = true;
        const parsed = parseStatusValue(statusMatch[1]);
        status = parsed.status;
        statusNote = parsed.note;
        if (status === 'unknown') {
          warnings.push({
            kind: 'missing_status',
            detail: `Unrecognized status value "${statusMatch[1].trim()}".`,
          });
        }
        continue;
      }
      if (trimmed.length === 0) {
        // Blank line — could be the boundary between metadata and body.
        // We only flip metadataDone when we hit content that is clearly body.
        bodyLines.push(line);
        continue;
      }
      // First non-metadata, non-blank line ends the metadata section.
      metadataDone = true;
      bodyLines.push(line);
      continue;
    }
    bodyLines.push(line);
  }

  // Only when the line is genuinely absent. Before THR-1470 this keyed on the
  // degraded `unknown` status, so an unrecognized value fired *both* warnings
  // and the spurious second one buried the genuine missing-line cases.
  if (!sawStatusLine) {
    warnings.push({ kind: 'missing_status', detail: 'No `**Status:**` line found.' });
  }

  // Trim leading and trailing blank lines from body.
  while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift();
  while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();

  return {
    aliases,
    status,
    statusNote,
    seeAlsoRaw,
    body: bodyLines.join('\n'),
    warnings,
  };
}

function parseSeeAlsoLink(
  raw: string,
): { termName: string; aliasOverride: string | null } {
  const pipeIdx = raw.indexOf('|');
  if (pipeIdx >= 0) {
    return {
      termName: raw.slice(0, pipeIdx).trim(),
      aliasOverride: raw.slice(pipeIdx + 1).trim() || null,
    };
  }
  return { termName: raw.trim(), aliasOverride: null };
}

export interface GenerateOptions {
  sourceRoot: string;
  outputPath?: string;
  dryRun?: boolean;
}

export function buildDashboardData(opts: { sourceRoot: string }): ULDashboardData {
  const sourceRoot = opts.sourceRoot;
  const readmePath = path.join(sourceRoot, README_FILE);
  if (!fs.existsSync(readmePath)) {
    throw new Error(`[generate-ul-dashboard-data] missing README: ${readmePath}`);
  }
  const readme = parseReadme(fs.readFileSync(readmePath, 'utf8'));

  const shards: ULShard[] = [];
  const terms: ULTerm[] = [];
  const warnings: ULGenerationWarning[] = [];
  const slugByTermName = new Map<string, { slug: string; shardId: ULShardId }>();
  const slugSeen = new Set<string>();

  for (const file of readme.shardOrder) {
    const id = SHARD_FILE_TO_ID[file];
    if (!id) {
      // Unknown shard file in README table — skip silently; the README is
      // authoritative for the dashboard's shard set.
      continue;
    }
    const filePath = path.join(sourceRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `[generate-ul-dashboard-data] shard file missing: ${filePath}`,
      );
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const { intro, terms: rawTerms } = splitShardIntoTermBlocks(content);
    const contentAdjacent = readme.contentAdjacentByFile.get(file) ?? false;

    const shardTitle = path.basename(file, '.md');
    shards.push({
      id,
      filename: file,
      title: shardTitle,
      contentAdjacent,
      termCount: rawTerms.length,
      blurb: intro,
    });

    for (const raw of rawTerms) {
      const slug = slugifyHeading(raw.name);
      if (!slug) continue;

      if (slugSeen.has(`${id}#${slug}`)) {
        warnings.push({
          kind: 'duplicate_slug',
          shardId: id,
          termSlug: slug,
          detail: `Duplicate slug "${slug}" within ${file}.`,
        });
        continue;
      }
      slugSeen.add(`${id}#${slug}`);

      const parsed = parseTermBody(raw.bodyLines);
      const oneLinerKey = `${file}#${slug}`;
      let oneLiner = readme.oneLinersBySlug.get(oneLinerKey) ?? '';
      if (!oneLiner) {
        const firstSentence = parsed.body
          .replace(/\n+/g, ' ')
          .split(/(?<=[.!?])\s+/)[0]
          ?.trim();
        oneLiner = firstSentence ?? '';
        if (!oneLiner) {
          warnings.push({
            kind: 'missing_one_liner',
            shardId: id,
            termSlug: slug,
            detail: 'No README one-liner and empty body fallback.',
          });
        }
      }

      const seeAlsoLinks: ULSeeAlsoLink[] = parsed.seeAlsoRaw.map((raw) => {
        const { termName } = parseSeeAlsoLink(raw);
        return { raw, termName, resolvedSlug: null };
      });

      slugByTermName.set(raw.name.toLowerCase(), { slug, shardId: id });
      // Bare-name match: "IPK (Instant Prose Kernel)" also matches `[[IPK]]`.
      const bareName = raw.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
      if (bareName && bareName !== raw.name) {
        slugByTermName.set(bareName.toLowerCase(), { slug, shardId: id });
      }
      for (const alias of parsed.aliases) {
        slugByTermName.set(alias.toLowerCase(), { slug, shardId: id });
      }

      terms.push({
        shardId: id,
        slug,
        name: raw.name,
        aliases: parsed.aliases,
        status: parsed.status,
        statusNote: parsed.statusNote,
        oneLiner,
        body: parsed.body,
        seeAlso: seeAlsoLinks,
        sourcePath: `${SOURCE_DIR}/${file}#${slug}`,
        contentAdjacent,
      });

      for (const w of parsed.warnings) {
        warnings.push({
          kind: w.kind,
          shardId: id,
          termSlug: slug,
          detail: w.detail,
        });
      }
    }
  }

  // Resolve See-Also links now that all terms are known.
  for (const term of terms) {
    for (const link of term.seeAlso) {
      const resolved = slugByTermName.get(link.termName.toLowerCase());
      if (resolved) {
        link.resolvedSlug = `${resolved.shardId}#${resolved.slug}`;
      } else {
        warnings.push({
          kind: 'unresolved_see_also',
          shardId: term.shardId,
          termSlug: term.slug,
          detail: `See-Also "${link.termName}" did not resolve to a known term.`,
        });
      }
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    shards,
    terms,
    warnings,
  };
}

export function generateDashboardData(opts: GenerateOptions): ULDashboardData {
  const data = buildDashboardData({ sourceRoot: opts.sourceRoot });
  const outputPath = opts.outputPath ?? path.join(process.cwd(), OUTPUT_FILE);

  const serialized = `${JSON.stringify(data, null, 2)}\n`;

  if (opts.dryRun) {
    console.log(
      `[generate-ul-dashboard-data] dry-run: would write ${outputPath} ` +
        `(${data.terms.length} terms across ${data.shards.length} shards, ` +
        `${data.warnings.length} warnings)`,
    );
  } else {
    fs.writeFileSync(outputPath, serialized, 'utf8');
    console.log(
      `[generate-ul-dashboard-data] wrote ${outputPath} ` +
        `(${data.terms.length} terms across ${data.shards.length} shards)`,
    );
  }

  if (data.warnings.length > 0) {
    for (const warning of data.warnings) {
      console.warn(
        `[generate-ul-dashboard-data] warning ${warning.kind} ${warning.shardId}#${warning.termSlug}: ${warning.detail}`,
      );
    }
  }

  return data;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = path.resolve(fileURLToPath(import.meta.url));
if (invokedPath && invokedPath === modulePath) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sourceRoot = path.join(process.cwd(), SOURCE_DIR);
  generateDashboardData({ sourceRoot, dryRun });
}
