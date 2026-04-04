import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Directories that are NOT part of the Obsidian vault.
 * Everything else at the project root that contains .md files is considered
 * a vault folder (unless it starts with '.' or is in this set).
 */
const SKIP_DIRS = new Set([
  'node_modules',
  'src',
  'scripts',
  'dist',
  '.git',
  '.claude',
  '.agents',
  '.planning',
  '.superpowers',
  '.ai-codex',
  '.cache',
  '.pytest_cache',
  'Docs',
  'Design',
  'public',
  'coverage',
]);

/**
 * Root-level .md files that belong in the "Infrastructure" group rather than
 * being listed as ungrouped vault pages.
 */
const INFRASTRUCTURE_FILES = new Set([
  'Index.md',
  'CLAUDE.md',
  'Vault Log.md',
]);

/**
 * Files to exclude entirely from the index (not vault content).
 */
const EXCLUDE_FILES = new Set([
  'README.md',
  'AGENTS.md',
  'CHANGELOG.md',
]);

/**
 * Preferred display order for top-level groups. Any group not listed here
 * appears alphabetically after these.
 */
const GROUP_ORDER = [
  'Systems',
  'Cosmology',
  'Domains',
  'Actions',
  'Actors',
  'Cultures',
  'Magic',
  'Terrain',
  'Locations',
  'Traits',
  'Relationships',
  'World Objects',
  'Brainstorms',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VaultPage {
  /** Absolute path to the .md file */
  filePath: string;
  /** Filename without extension — used as wikilink target */
  wikiName: string;
  /** The H1 heading text (human-readable name) */
  title: string;
  /** Short summary extracted from blockquote or first paragraph */
  summary: string;
  /** Top-level folder the file lives in (e.g. "Cosmology", "Actions") */
  group: string;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract the first `> blockquote` line after the heading, or the first
 * non-empty, non-heading, non-frontmatter line.
 */
function extractSummary(content: string): string {
  // Strip frontmatter
  let body = content;
  if (body.startsWith('---')) {
    const endIdx = body.indexOf('---', 3);
    if (endIdx !== -1) {
      body = body.slice(endIdx + 3);
    }
  }

  const lines = body.split('\n');
  let pastHeading = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Skip headings
    if (line.startsWith('#')) {
      pastHeading = true;
      continue;
    }

    // Blockquote — preferred summary source
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '').trim();
      if (text) return truncate(text, 200);
      continue;
    }

    // First non-empty content line after the heading
    if (pastHeading && !line.startsWith('-') && !line.startsWith('|')) {
      return truncate(line, 200);
    }
  }

  return '';
}

/**
 * Extract the H1 heading from the file content.
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

// ---------------------------------------------------------------------------
// Filesystem scanning
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .md files under `dir`.
 */
function collectMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Determine whether a top-level directory is a vault content folder.
 */
function isVaultFolder(name: string): boolean {
  if (name.startsWith('.')) return false;
  if (SKIP_DIRS.has(name)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Main logic
// ---------------------------------------------------------------------------

/**
 * The Obsidian vault lives at a different path than the project root.
 * Auto-generated content (Cosmology/, Traits/, etc.) exists at both locations,
 * but hand-curated content (Systems/, Brainstorms/) only exists in the vault.
 */
const OBSIDIAN_VAULT_ROOT = path.resolve(
  process.env.OBSIDIAN_VAULT_ROOT || 'C:/Users/chris/Dev/Obsidian/TheFantasyWorldSimulator'
);

interface RebuildIndexOptions {
  dryRun?: boolean;
  vaultRoot?: string;
}

export async function rebuildIndex(options: RebuildIndexOptions = {}) {
  const { dryRun = false, vaultRoot = process.cwd() } = options;

  console.log(`Scanning project root: ${vaultRoot}`);
  console.log(`Scanning Obsidian vault: ${OBSIDIAN_VAULT_ROOT}`);

  // 1. Discover vault folders from BOTH project root and Obsidian vault
  //    Auto-generated content lives at project root; hand-curated at Obsidian vault.
  const vaultFolderSet = new Set<string>();
  const folderSourceMap = new Map<string, string>(); // folder → source path

  for (const scanRoot of [vaultRoot, OBSIDIAN_VAULT_ROOT]) {
    if (!fs.existsSync(scanRoot)) continue;
    const entries = fs.readdirSync(scanRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && isVaultFolder(entry.name)) {
        const fullPath = path.join(scanRoot, entry.name);
        const mdFiles = collectMarkdownFiles(fullPath);
        if (mdFiles.length > 0 && !vaultFolderSet.has(entry.name)) {
          vaultFolderSet.add(entry.name);
          folderSourceMap.set(entry.name, scanRoot);
        }
      }
    }
  }

  const vaultFolders = [...vaultFolderSet].sort();
  console.log(`Found vault folders: ${vaultFolders.join(', ')}`);

  // 2. Collect all vault pages
  const pages: VaultPage[] = [];

  // Scan each vault folder from its source location
  for (const folder of vaultFolders) {
    const sourceRoot = folderSourceMap.get(folder) || vaultRoot;
    const folderPath = path.join(sourceRoot, folder);
    const mdFiles = collectMarkdownFiles(folderPath);

    for (const filePath of mdFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      const title = extractTitle(content) || filename;
      const summary = extractSummary(content);

      pages.push({
        filePath,
        wikiName: filename,
        title,
        summary,
        group: folder,
      });
    }
  }

  // Scan root-level .md files from Obsidian vault (non-infrastructure, non-excluded)
  const obsidianRootEntries = fs.existsSync(OBSIDIAN_VAULT_ROOT)
    ? fs.readdirSync(OBSIDIAN_VAULT_ROOT, { withFileTypes: true })
    : [];
  const rootMdFiles = obsidianRootEntries
    .filter(
      (e) =>
        e.isFile() &&
        e.name.endsWith('.md') &&
        !INFRASTRUCTURE_FILES.has(e.name) &&
        !EXCLUDE_FILES.has(e.name)
    )
    .map((e) => e.name);

  for (const filename of rootMdFiles) {
    const filePath = path.join(OBSIDIAN_VAULT_ROOT, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const baseName = path.basename(filename, '.md');
    const title = extractTitle(content) || baseName;
    const summary = extractSummary(content);

    pages.push({
      filePath,
      wikiName: baseName,
      title,
      summary,
      group: '_root',
    });
  }

  console.log(`Found ${pages.length} vault pages across ${vaultFolders.length} folders`);

  // 3. Group pages
  const groups = new Map<string, VaultPage[]>();

  for (const page of pages) {
    const existing = groups.get(page.group) || [];
    existing.push(page);
    groups.set(page.group, existing);
  }

  // Sort pages within each group alphabetically by title
  for (const [, groupPages] of groups) {
    groupPages.sort((a, b) => a.title.localeCompare(b.title));
  }

  // 4. Order the groups
  const orderedGroups: string[] = [];

  // First, groups in preferred order (if they exist)
  for (const name of GROUP_ORDER) {
    if (groups.has(name)) {
      orderedGroups.push(name);
    }
  }

  // Then remaining groups alphabetically (excluding _root and infrastructure)
  const remaining = [...groups.keys()]
    .filter((k) => k !== '_root' && !orderedGroups.includes(k))
    .sort();
  orderedGroups.push(...remaining);

  // 5. Generate the Index.md content
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push('tags: [index, hub, kb-infrastructure]');
  lines.push('aliases: [Domain Model, Knowledge Base Index]');
  lines.push('---');
  lines.push('');

  // Title and intro
  lines.push('# The Fantasy World Simulator \u2014 Knowledge Base');
  lines.push('');
  lines.push('> LLM-maintained index of all vault pages. Read this first to navigate the domain model.');
  lines.push('');

  // How to use
  lines.push('## How to Use This Vault');
  lines.push('');
  lines.push('- **LLM agents:** Read this index to find relevant pages, then drill into them via wikilinks');
  lines.push('- **Humans:** Browse via folder structure or Obsidian graph view');
  lines.push('- See [[Vault Log]] for recent changes');
  lines.push('- See [[CLAUDE]] for project context and architectural decisions');
  lines.push('');

  // Emit each group
  let totalPages = 0;
  for (const groupName of orderedGroups) {
    const groupPages = groups.get(groupName)!;
    totalPages += groupPages.length;

    lines.push(`## ${groupName} (${groupPages.length} pages)`);
    lines.push('');

    for (const page of groupPages) {
      const summaryPart = page.summary ? ` \u2014 ${page.summary}` : '';
      lines.push(`- [[${page.title}]]${summaryPart}`);
    }

    lines.push('');
  }

  // Root-level pages (if any)
  const rootPages = groups.get('_root');
  if (rootPages && rootPages.length > 0) {
    totalPages += rootPages.length;
    lines.push(`## Other (${rootPages.length} pages)`);
    lines.push('');
    for (const page of rootPages) {
      const summaryPart = page.summary ? ` \u2014 ${page.summary}` : '';
      lines.push(`- [[${page.title}]]${summaryPart}`);
    }
    lines.push('');
  }

  // Infrastructure section (always present, hardcoded)
  lines.push('## Infrastructure');
  lines.push('');
  lines.push('- [[Vault Log]] \u2014 Chronological record of vault changes');
  lines.push('- [[Index]] \u2014 This file');
  lines.push('- [[CLAUDE]] \u2014 Project context and agent instructions');
  lines.push('');

  const output = lines.join('\n');
  // Write to Obsidian vault (where hand-curated content lives)
  const outputPath = path.join(OBSIDIAN_VAULT_ROOT, 'Index.md');

  // 6. Summary
  console.log('');
  console.log(`Index generation plan:`);
  console.log(`  Groups: ${orderedGroups.length}`);
  console.log(`  Total pages indexed: ${totalPages}`);
  console.log(`  Output: ${outputPath}`);

  if (dryRun) {
    console.log('');
    console.log('(--dry-run: no files written)');
    console.log('');
    console.log('--- Preview ---');
    console.log(output);
    return;
  }

  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`\nIndex.md written (${totalPages} pages indexed)`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('rebuild-index.ts') ||
  process.argv[1]?.endsWith('rebuild-index.mjs')
) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  rebuildIndex({
    dryRun,
    vaultRoot: process.cwd(),
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
