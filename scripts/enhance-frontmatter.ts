import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * enhance-frontmatter.ts
 *
 * Adds missing frontmatter fields (status, updated, created) to hand-curated
 * vault files. Never touches auto-generated folders owned by generate-vault.ts.
 *
 * Usage:
 *   npm run enhance-frontmatter            # apply changes
 *   npm run enhance-frontmatter:dry        # preview without writing
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Directories to scan (relative to vault root). */
const SCAN_DIRS = ['Systems', 'Brainstorms'];

/** Standalone root .md files to process (relative to vault root). */
const STANDALONE_FILES = [
  'CLAUDE.md',
  'Systems Overview.md',
  'Agent Teams Guide.md',
  'Product Strategy.md',
  'Build Status.md',
  'Tiered Backstory Generation.md',
];

/** Line-count thresholds for auto-detecting status. */
const STATUS_STUB_THRESHOLD = 20;
const STATUS_COMPLETE_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Return the file's filesystem mtime formatted as YYYY-MM-DD. */
function getFileMtime(filePath: string): string {
  const stat = fs.statSync(filePath);
  return formatDate(stat.mtime);
}

/**
 * Try to get the date of the first git commit that added this file.
 * Falls back to filesystem mtime if git history is unavailable.
 */
function getGitCreatedDate(filePath: string): string {
  try {
    const result = execSync(
      `git log --follow --diff-filter=A --format=%ai -- "${filePath}"`,
      { encoding: 'utf-8', timeout: 10_000 }
    ).trim();

    if (result) {
      // git format %ai gives "2024-01-15 10:30:00 -0500" — take the date part
      const datePart = result.split('\n').pop()!.split(' ')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
  } catch {
    // git not available or file not tracked — fall through
  }
  return getFileMtime(filePath);
}

/** Infer a status value based on the body line count. */
function inferStatus(bodyLineCount: number): string {
  if (bodyLineCount < STATUS_STUB_THRESHOLD) return 'stub';
  if (bodyLineCount >= STATUS_COMPLETE_THRESHOLD) return 'complete';
  return 'draft';
}

// ---------------------------------------------------------------------------
// Frontmatter parsing / serialization
// ---------------------------------------------------------------------------

interface ParsedFile {
  /** Original frontmatter fields (empty object if no frontmatter block). */
  fields: Record<string, string>;
  /** The file body after the closing `---`. */
  body: string;
  /** Whether the file originally had a frontmatter block. */
  hadFrontmatter: boolean;
  /** Raw ordered keys to preserve field ordering on write-back. */
  orderedKeys: string[];
}

function parseFrontmatter(content: string): ParsedFile {
  const lines = content.split('\n');

  if (lines[0]?.trim() !== '---') {
    return { fields: {}, body: content, hadFrontmatter: false, orderedKeys: [] };
  }

  // Find the closing ---
  let closingIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIdx = i;
      break;
    }
  }

  if (closingIdx === -1) {
    // Malformed — treat as no frontmatter
    return { fields: {}, body: content, hadFrontmatter: false, orderedKeys: [] };
  }

  const yamlLines = lines.slice(1, closingIdx);
  const body = lines.slice(closingIdx + 1).join('\n');
  const fields: Record<string, string> = {};
  const orderedKeys: string[] = [];

  let currentKey = '';
  let currentValue = '';

  for (const line of yamlLines) {
    // Continuation line (starts with whitespace and follows a key)
    if (/^\s+/.test(line) && currentKey) {
      currentValue += '\n' + line;
      continue;
    }

    // Flush previous key
    if (currentKey) {
      fields[currentKey] = currentValue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      currentKey = line.slice(0, colonIdx).trim();
      currentValue = line.slice(colonIdx + 1).trim();
      orderedKeys.push(currentKey);
    } else {
      currentKey = '';
      currentValue = '';
    }
  }

  // Flush last key
  if (currentKey) {
    fields[currentKey] = currentValue;
  }

  return { fields, body, hadFrontmatter: true, orderedKeys };
}

function serializeFrontmatter(
  fields: Record<string, string>,
  orderedKeys: string[]
): string {
  const lines = ['---'];

  // Write keys in their original order first, then any new keys appended
  const written = new Set<string>();
  for (const key of orderedKeys) {
    if (key in fields) {
      const value = fields[key];
      if (value.includes('\n')) {
        lines.push(`${key}:${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
      written.add(key);
    }
  }

  // Append new keys not in original order
  for (const key of Object.keys(fields)) {
    if (!written.has(key)) {
      const value = fields[key];
      if (value.includes('\n')) {
        lines.push(`${key}:${value}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
  }

  lines.push('---');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

interface FileChange {
  filePath: string;
  addedFields: string[];
  newContent: string;
}

function processFile(filePath: string): FileChange | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseFrontmatter(content);
  const addedFields: string[] = [];

  // Work on a copy of fields
  const fields = { ...parsed.fields };
  const orderedKeys = [...parsed.orderedKeys];

  // Count body lines (excluding leading blank lines)
  const bodyLines = parsed.body.replace(/^\n+/, '').split('\n');
  const bodyLineCount = bodyLines.filter((l) => l.trim().length > 0).length;

  // --- Add missing status ---
  if (!('status' in fields)) {
    fields['status'] = inferStatus(bodyLineCount);
    addedFields.push(`status: ${fields['status']}`);
  }

  // --- Add missing updated ---
  if (!('updated' in fields)) {
    fields['updated'] = getFileMtime(filePath);
    addedFields.push(`updated: ${fields['updated']}`);
  }

  // --- Add missing created ---
  if (!('created' in fields)) {
    fields['created'] = getGitCreatedDate(filePath);
    addedFields.push(`created: ${fields['created']}`);
  }

  if (addedFields.length === 0) {
    return null; // Nothing to change
  }

  // Build new content
  const frontmatter = serializeFrontmatter(fields, orderedKeys);
  const newContent = parsed.hadFrontmatter
    ? frontmatter + '\n' + parsed.body
    : frontmatter + '\n\n' + content;

  return { filePath, addedFields, newContent };
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function collectFiles(vaultRoot: string): string[] {
  const files: string[] = [];

  // Scan directories recursively
  for (const dir of SCAN_DIRS) {
    const dirPath = path.join(vaultRoot, dir);
    if (!fs.existsSync(dirPath)) {
      console.warn(`  Warning: directory not found: ${dir}/`);
      continue;
    }
    walkDir(dirPath, files);
  }

  // Standalone root files
  for (const file of STANDALONE_FILES) {
    const filePath = path.join(vaultRoot, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Warning: file not found: ${file}`);
      continue;
    }
    files.push(filePath);
  }

  return files;
}

function walkDir(dirPath: string, result: string[]): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, result);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      result.push(fullPath);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface EnhanceFrontmatterOptions {
  dryRun?: boolean;
  vaultRoot?: string;
}

export async function enhanceFrontmatter(
  options: EnhanceFrontmatterOptions = {}
) {
  const { dryRun = false, vaultRoot = process.cwd() } = options;

  console.log(`\nEnhance Frontmatter`);
  console.log(`Vault root: ${vaultRoot}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}\n`);

  // Discover files
  const files = collectFiles(vaultRoot);
  console.log(`Found ${files.length} files to check\n`);

  if (files.length === 0) {
    console.log('No files found. Check that the vault root is correct.');
    return;
  }

  // Process each file
  const changes: FileChange[] = [];
  let skipped = 0;

  for (const filePath of files) {
    const change = processFile(filePath);
    if (change) {
      changes.push(change);
    } else {
      skipped++;
    }
  }

  // Report
  if (changes.length === 0) {
    console.log('All files already have complete frontmatter. Nothing to do.');
    return;
  }

  console.log(
    `${changes.length} file(s) need updates, ${skipped} already complete:\n`
  );

  for (const change of changes) {
    const relPath = path.relative(vaultRoot, change.filePath);
    console.log(`  ${relPath}`);
    for (const field of change.addedFields) {
      console.log(`    + ${field}`);
    }
  }

  if (dryRun) {
    console.log('\n(--dry-run: no files written)');
    return;
  }

  // Write changes
  console.log('\nWriting changes...');
  for (const change of changes) {
    fs.writeFileSync(change.filePath, change.newContent, 'utf-8');
  }

  console.log(`\nDone: ${changes.length} file(s) updated.`);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('enhance-frontmatter.mjs') ||
  process.argv[1]?.endsWith('enhance-frontmatter.ts')
) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const vaultRoot = process.env.OBSIDIAN_VAULT_ROOT
    || 'C:/Users/chris/Dev/Obsidian/TheFantasyWorldSimulator';

  enhanceFrontmatter({
    dryRun,
    vaultRoot,
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}
