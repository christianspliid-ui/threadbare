/**
 * Build-time generator for the Ubiquitous Language dashboard (`?view=ul`).
 *
 * Reads the seven shards in `Docs/ubiquitous-language/`, parses each `### Term`
 * block, and emits a typed JSON snapshot at `src/data/ul-dashboard.generated.json`
 * that the dashboard consumes. Build-step warnings are preserved into the JSON
 * `warnings[]` array (rendered in the dashboard footer) and printed to stderr.
 *
 * Mirrors the esbuild bundling + CLI pattern of `scripts/mirror-ul.ts`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA_VERSION = 1;

export type ULShardId =
  | 'cosmology'
  | 'agents'
  | 'encounters'
  | 'prose'
  | 'graph'
  | 'coordination'
  | 'process';

export type ULTermStatus = 'canonical' | 'proposed' | 'deprecated' | 'unknown';

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
  generatedAt: string;
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
  seeAlsoRaw: string[];
  body: string;
  warnings: { kind: ULGenerationWarningKind; detail: string }[];
}

function parseTermBody(rawLines: string[]): ParsedTermBody {
  const warnings: { kind: ULGenerationWarningKind; detail: string }[] = [];
  let aliases: string[] = [];
  let status: ULTermStatus = 'unknown';
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
        const raw = statusMatch[1].trim().toLowerCase();
        if (raw === 'canonical' || raw === 'proposed' || raw === 'deprecated') {
          status = raw;
        } else {
          status = 'unknown';
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

  if (status === 'unknown') {
    warnings.push({ kind: 'missing_status', detail: 'No `**Status:**` line found.' });
  }

  // Trim leading and trailing blank lines from body.
  while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift();
  while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop();

  return { aliases, status, seeAlsoRaw, body: bodyLines.join('\n'), warnings };
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
    generatedAt: new Date().toISOString(),
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
