import fs from 'node:fs';
import path from 'node:path';
import { IA_SURFACES } from '../src/data/ia-manifest';

type MountKind = 'always' | 'modal' | 'drillin';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const TSX_EXTENSION = '.tsx';
const GAME_VIEW_PATH = 'src/components/Game/GameView.tsx';
const NONE_PREFIX = '(none';
const STATE_PATH_NOT_APPLICABLE = 'n/a';

interface ReaderResult {
  failed: boolean;
  warned: boolean;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toSlashPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function collectFiles(rootDir: string, extensions: Set<string>): string[] {
  const entries = fs.readdirSync(rootDir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name)))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function getDefinitionPatterns(componentName: string): RegExp[] {
  const escapedName = escapeForRegex(componentName);
  return [
    new RegExp(`export\\s+default\\s+function\\s+${escapedName}\\b`),
    new RegExp(`export\\s+function\\s+${escapedName}\\b`),
    new RegExp(`export\\s+const\\s+${escapedName}\\s*[:=]`),
    new RegExp(`export\\s+\\{[^\\}]*\\b${escapedName}\\b`),
  ];
}

function hasDefaultExportAlias(componentName: string, content: string): boolean {
  const escapedName = escapeForRegex(componentName);
  const constPattern = new RegExp(`const\\s+${escapedName}\\s*[:=]`);
  const defaultExportPattern = new RegExp(`export\\s+default\\s+${escapedName}\\b`);
  return constPattern.test(content) && defaultExportPattern.test(content);
}

function findDefinitionMatches(
  componentName: string,
  files: string[],
  fileContents: Map<string, string>,
): string[] {
  const patterns = getDefinitionPatterns(componentName);
  return files.filter((filePath) => {
    const content = fileContents.get(filePath);
    if (!content) {
      return false;
    }

    if (patterns.some((pattern) => pattern.test(content))) {
      return true;
    }

    return hasDefaultExportAlias(componentName, content);
  });
}

function getShortestPath(paths: string[]): string {
  return paths.slice().sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
}

function shouldSkipStatePathCheck(statePath: string): boolean {
  const normalized = statePath.trim().toLowerCase();
  return normalized.startsWith(NONE_PREFIX) || normalized === STATE_PATH_NOT_APPLICABLE;
}

function isReaderMounted(componentName: string, mountFiles: string[], fileContents: Map<string, string>): boolean {
  const marker = `<${componentName}`;
  return mountFiles.some((filePath) => fileContents.get(filePath)?.includes(marker));
}

function formatSection(label: string, messages: string[]): string {
  const lines = [`${label} (${messages.length}):`];
  for (const message of messages) {
    lines.push(`  - ${message}`);
  }
  return lines.join('\n');
}

function main(): void {
  const repoRoot = process.cwd();
  const componentsDir = path.resolve(repoRoot, 'src/components');

  if (!fs.existsSync(componentsDir)) {
    console.error(`Missing components directory at ${toSlashPath(path.relative(repoRoot, componentsDir))}`);
    process.exit(1);
  }

  const componentSourceFiles = collectFiles(componentsDir, SOURCE_EXTENSIONS);
  const mountSourceFiles = componentSourceFiles.filter((filePath) => path.extname(filePath) === TSX_EXTENSION);
  const gameViewFile = path.resolve(repoRoot, GAME_VIEW_PATH);

  const fileContents = new Map<string, string>();
  for (const filePath of componentSourceFiles) {
    fileContents.set(filePath, fs.readFileSync(filePath, 'utf8'));
  }

  if (fs.existsSync(gameViewFile) && !fileContents.has(gameViewFile)) {
    fileContents.set(gameViewFile, fs.readFileSync(gameViewFile, 'utf8'));
  }

  let readerCount = 0;
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;
  const failMessages: string[] = [];
  const warnMessages: string[] = [];

  for (const surface of IA_SURFACES) {
    for (const reader of surface.reads) {
      readerCount += 1;
      const result: ReaderResult = { failed: false, warned: false };
      const componentName = reader.reader;
      const matches = findDefinitionMatches(componentName, componentSourceFiles, fileContents);

      if (matches.length === 0) {
        result.failed = true;
        failMessages.push(`component "${componentName}" not found for surface "${surface.surface}"`);
      }

      const mountKind = surface.mount as MountKind;
      const mountFiles = mountKind === 'always' ? [gameViewFile] : mountSourceFiles;
      if (!isReaderMounted(componentName, mountFiles, fileContents)) {
        result.failed = true;
        failMessages.push(
          `component "${componentName}" never rendered as JSX for surface "${surface.surface}" (mount=${mountKind})`,
        );
      }

      if (!shouldSkipStatePathCheck(reader.state_path) && matches.length > 0) {
        const targetFile = getShortestPath(matches);
        const content = fileContents.get(targetFile) ?? '';
        const statePathLiteral = reader.state_path;
        const terminalSegment = statePathLiteral.split('.').at(-1) ?? statePathLiteral;

        if (!content.includes(statePathLiteral) && !content.includes(terminalSegment)) {
          result.warned = true;
          const relativePath = toSlashPath(path.relative(repoRoot, targetFile));
          warnMessages.push(
            `state_path "${statePathLiteral}" not referenced in ${relativePath} (may be prop-drilled)`,
          );
        }
      }

      if (result.failed) {
        failCount += 1;
      } else if (result.warned) {
        warnCount += 1;
      } else {
        passCount += 1;
      }
    }
  }

  console.log(formatSection('FAIL', failMessages));
  console.log('');
  console.log(formatSection('WARN', warnMessages));
  console.log('');
  console.log(
    `Surfaces: ${IA_SURFACES.length}  Readers: ${readerCount}  PASS: ${passCount}  FAIL: ${failCount}  WARN: ${warnCount}`,
  );

  process.exit(failCount > 0 ? 1 : 0);
}

main();
