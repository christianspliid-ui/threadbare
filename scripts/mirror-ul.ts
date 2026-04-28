import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OBSIDIAN_ENV_VAR = 'OBSIDIAN_VAULT_PATH';
const SOURCE_DIR = 'Docs/ubiquitous-language';
const TARGET_DIR_NAME = 'Ubiquitous-Language';
const PROJECT_VAULT_DIRNAME = 'TheFantasyWorldSimulator';
const README_FILE = 'README.md';
const INDEX_FILE = 'Index.md';
const LOG_FILE = 'log.md';

const MIRROR_SECTION_HEADING = '## Ubiquitous Language';
const MIRROR_INDEX_ENTRY =
  '- [[Ubiquitous-Language/README|Ubiquitous Language Index]] - Auto-mirrored glossary shards from `Docs/ubiquitous-language/`.';

const MISSING_VAULT_MESSAGE = [
  'MIRROR-UL ERROR: OBSIDIAN_VAULT_PATH is not configured.',
  'Set OBSIDIAN_VAULT_PATH in .claude/settings.local.json and retry.',
  'Example: { "env": { "OBSIDIAN_VAULT_PATH": "C:\\\\Users\\\\chris\\\\Dev\\\\Obsidian" } }',
].join('\n');

interface RewriteResult {
  rewritten: string;
  rewriteCount: number;
  warnings: string[];
}

function slugifyHeading(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=\[\]{}|\\;:'",.<>/?]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function prettifyAnchor(anchor: string): string {
  return anchor
    .split('-')
    .map((part) =>
      part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(' ');
}

function normalizeDisplay(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/\s+/g, ' ');
}

function parseShardOrder(readmeContent: string): string[] {
  const shardFiles: string[] = [];
  const regex = /\|\s*\[([^\]]+\.md)\]\(\.\/[^)]+\)\s*\|/g;

  for (const match of readmeContent.matchAll(regex)) {
    const file = match[1];
    if (file && !shardFiles.includes(file)) {
      shardFiles.push(file);
    }
  }

  return shardFiles;
}

function parseContentAdjacentFlags(readmeContent: string): Map<string, boolean> {
  const flags = new Map<string, boolean>();
  const lines = readmeContent.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith('| [')) {
      continue;
    }
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length < 5) {
      continue;
    }
    const shardCell = parts[1];
    const marker = parts[3];
    const fileMatch = shardCell.match(/\[([^\]]+\.md)\]/);
    if (!fileMatch) {
      continue;
    }
    flags.set(fileMatch[1], marker.includes('✅'));
  }

  return flags;
}

function extractHeadings(content: string): Map<string, string> {
  const headingMap = new Map<string, string>();
  const headingRegex = /^#{1,6}\s+(.+)$/gm;

  for (const match of content.matchAll(headingRegex)) {
    const heading = match[1].trim();
    const slug = slugifyHeading(heading);
    if (slug && !headingMap.has(slug)) {
      headingMap.set(slug, heading);
    }
  }

  return headingMap;
}

function rewriteIntraUlLinks(
  content: string,
  sourceFile: string,
  availableFiles: Set<string>,
  headingMapByFile: Map<string, Map<string, string>>
): RewriteResult {
  const warnings: string[] = [];
  let rewriteCount = 0;

  const rewritten = content.replace(
    /\[([^\]]+)\]\(\.\/([A-Za-z0-9-]+)\.md(?:#([^)\s]+))?\)/g,
    (fullMatch, label: string, targetBase: string, anchor: string | undefined) => {
      const targetFile = `${targetBase}.md`;
      if (!availableFiles.has(targetFile)) {
        return fullMatch;
      }

      const targetHeadingMap = headingMapByFile.get(targetFile);
      let headingLabel: string | null = null;

      if (anchor) {
        let decodedAnchor = anchor;
        try {
          decodedAnchor = decodeURIComponent(anchor);
        } catch {
          warnings.push(
            `[mirror-ul] warning: could not decode anchor "${anchor}" in ${sourceFile}`
          );
        }

        const slug = slugifyHeading(decodedAnchor);
        if (slug && targetHeadingMap?.has(slug)) {
          headingLabel = targetHeadingMap.get(slug) ?? null;
        } else {
          warnings.push(
            `[mirror-ul] warning: unresolved anchor "${anchor}" in ${sourceFile} -> ${targetFile}`
          );
          headingLabel = prettifyAnchor(decodedAnchor);
        }
      }

      const targetPage = `${TARGET_DIR_NAME}/${targetBase}`;
      const target = headingLabel ? `${targetPage}#${headingLabel}` : targetPage;

      const defaultLabel = headingLabel ?? targetBase;
      const needsAlias =
        normalizeDisplay(label) !== normalizeDisplay(defaultLabel) &&
        normalizeDisplay(label) !== normalizeDisplay(targetFile);

      rewriteCount += 1;
      if (needsAlias) {
        return `[[${target}|${label}]]`;
      }
      return `[[${target}]]`;
    }
  );

  return { rewritten, rewriteCount, warnings };
}

function buildFrontmatter(
  fileName: string,
  generatedDate: string,
  contentAdjacent: boolean
): string {
  const baseName = path.basename(fileName, '.md');
  const displayName = baseName === 'README' ? 'Index' : baseName.replace(/-/g, ' ');

  const aliases =
    baseName === 'README'
      ? ['"Ubiquitous Language Index"', '"UL Index"']
      : [`"UL ${displayName}"`, `"UL: ${displayName}"`];

  return [
    '---',
    'tags: [ubiquitous-language, glossary, generated]',
    `aliases: [${aliases.join(', ')}]`,
    'status: complete',
    `source: ${SOURCE_DIR}/${fileName}`,
    `last-generated: ${generatedDate}`,
    `content-adjacent: ${contentAdjacent}`,
    '---',
  ].join('\n');
}

function buildBanner(fileName: string): string {
  return [
    '> [!warning] Generated mirror',
    `> Generated mirror. Edit \`${SOURCE_DIR}/${fileName}\` in the repo, then rerun \`npm run mirror-ul\`.`,
  ].join('\n');
}

function resolveProjectVaultRoot(rawVaultPath: string): string {
  const normalized = path.resolve(rawVaultPath);

  if (path.basename(normalized) === PROJECT_VAULT_DIRNAME) {
    return normalized;
  }

  const nested = path.join(normalized, PROJECT_VAULT_DIRNAME);
  if (fs.existsSync(nested)) {
    return nested;
  }

  return normalized;
}

function ensureIndexEntry(projectVaultRoot: string, dryRun: boolean): boolean {
  const indexPath = path.join(projectVaultRoot, INDEX_FILE);
  if (!fs.existsSync(indexPath)) {
    console.warn(`[mirror-ul] warning: ${INDEX_FILE} not found at ${indexPath}; skipping index update`);
    return false;
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (indexContent.includes('[[Ubiquitous-Language/README')) {
    console.log('[mirror-ul] index update skipped (entry already present)');
    return false;
  }

  const snippet = `\n\n${MIRROR_SECTION_HEADING} (1 page)\n\n${MIRROR_INDEX_ENTRY}\n`;

  if (dryRun) {
    console.log(`[mirror-ul] dry-run index update: ${indexPath}`);
    return true;
  }

  fs.writeFileSync(indexPath, `${indexContent}${snippet}`, 'utf8');
  console.log('[mirror-ul] index updated: Ubiquitous-Language entry inserted');
  return true;
}

function appendVaultLog(
  projectVaultRoot: string,
  mirroredCount: number,
  dryRun: boolean
): boolean {
  const logPath = path.join(projectVaultRoot, LOG_FILE);
  if (!fs.existsSync(logPath)) {
    console.warn(`[mirror-ul] warning: ${LOG_FILE} not found at ${logPath}; skipping log append`);
    return false;
  }

  const entry = `- **work** | mirrored ubiquitous language shards to [[Ubiquitous-Language/README]] (${mirroredCount} files)`;

  if (dryRun) {
    console.log(`[mirror-ul] dry-run log append: ${entry}`);
    return true;
  }

  const current = fs.readFileSync(logPath, 'utf8');
  const needsLeadingNewline = current.length > 0 && !current.endsWith('\n');
  const prefix = needsLeadingNewline ? '\n' : '';
  fs.appendFileSync(logPath, `${prefix}${entry}\n`, 'utf8');
  console.log('[mirror-ul] log appended: 1 entry');
  return true;
}

export interface MirrorUlOptions {
  dryRun?: boolean;
}

export function mirrorUbiquitousLanguage(options: MirrorUlOptions = {}): void {
  const { dryRun = false } = options;
  const vaultPath = process.env[OBSIDIAN_ENV_VAR]?.trim();

  if (!vaultPath) {
    console.error(MISSING_VAULT_MESSAGE);
    process.exit(1);
  }

  const sourceRoot = path.join(process.cwd(), SOURCE_DIR);
  const readmePath = path.join(sourceRoot, README_FILE);

  if (!fs.existsSync(readmePath)) {
    console.error(`[mirror-ul] error: source README not found at ${readmePath}`);
    process.exit(1);
  }

  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const shardOrder = parseShardOrder(readmeContent);
  const expectedFiles = [...shardOrder, README_FILE];
  const contentAdjacent = parseContentAdjacentFlags(readmeContent);

  const availableFiles = new Set<string>();
  for (const file of expectedFiles) {
    const sourcePath = path.join(sourceRoot, file);
    if (fs.existsSync(sourcePath)) {
      availableFiles.add(file);
    } else {
      console.warn(`[mirror-ul] warning: missing source shard ${file}; skipping`);
    }
  }

  const headingMapByFile = new Map<string, Map<string, string>>();
  for (const file of availableFiles) {
    const sourcePath = path.join(sourceRoot, file);
    const content = fs.readFileSync(sourcePath, 'utf8');
    headingMapByFile.set(file, extractHeadings(content));
  }

  const projectVaultRoot = resolveProjectVaultRoot(vaultPath);
  const outputRoot = path.join(projectVaultRoot, TARGET_DIR_NAME);

  if (!dryRun) {
    fs.mkdirSync(outputRoot, { recursive: true });
  }

  const generatedDate = new Date().toISOString().split('T')[0];
  let mirroredCount = 0;
  const warnings: string[] = [];

  console.log(
    `[mirror-ul] reading ${availableFiles.size} files from ${SOURCE_DIR}`
  );

  for (const file of expectedFiles) {
    if (!availableFiles.has(file)) {
      continue;
    }

    const sourcePath = path.join(sourceRoot, file);
    const targetBase = path.basename(file, '.md');
    const targetPath = path.join(outputRoot, `${targetBase}.md`);

    const raw = fs.readFileSync(sourcePath, 'utf8');
    const rewrite = rewriteIntraUlLinks(raw, file, availableFiles, headingMapByFile);
    warnings.push(...rewrite.warnings);

    const frontmatter = buildFrontmatter(
      file,
      generatedDate,
      contentAdjacent.get(file) ?? false
    );
    const banner = buildBanner(file);
    const content = `${frontmatter}\n\n${banner}\n\n${rewrite.rewritten.trimEnd()}\n`;

    if (dryRun) {
      console.log(
        `[mirror-ul] dry-run ${file} -> ${targetPath} (${rewrite.rewriteCount} links rewritten)`
      );
    } else {
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(
        `[mirror-ul] ${file} -> ${targetPath} (${rewrite.rewriteCount} links rewritten)`
      );
    }

    mirroredCount += 1;
  }

  const indexChanged = ensureIndexEntry(projectVaultRoot, dryRun);
  appendVaultLog(projectVaultRoot, mirroredCount, dryRun);

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(warning);
    }
  }

  console.log(
    `[mirror-ul] done: mirrored ${mirroredCount} files${indexChanged ? ', index updated' : ''}`
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = path.resolve(fileURLToPath(import.meta.url));

if (invokedPath && invokedPath === modulePath) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  mirrorUbiquitousLanguage({ dryRun });
}
