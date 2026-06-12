#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

type Severity = 'error' | 'warn';

type Finding = {
  check: string;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
};

type CandidateMode = 'paths' | 'staged' | 'all';

type SectionRange = {
  heading: string;
  startLine: number;
  endLine: number;
  body: string[];
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLANS_ROOT = path.join(repoRoot, 'Docs', 'plans');
const TEMPLATE_PATH = path.join(PLANS_ROOT, '_template.md');
const PLAN_DOC_PREFIX = 'Docs/plans/';
const PLAN_DOC_GLOB = 'Docs/plans/*.md';
const REQUIRED_NFP_COUNT = 7;
const REQUIRED_COORDINATION_KEYS = [
  'Suggested model',
  'Parallel-safe with',
  'Mutex with',
  'Codex review',
  'Files to touch',
] as const;
const HIGH_IMPACT_FILES = [
  'src/engine/graph.ts',
  'src/types/index.ts',
  'src/types/gameState.ts',
  'src/types/traits.ts',
  'src/engine/traceBuffer.ts',
] as const;
const STRICT_FLAG = '--strict';
const HEADING_PATTERN = /^## /u;
const TABLE_ROW_PATTERN = /^\|.*\|$/u;
const CHECKBOX_PATTERN = /^- \[[ xX]\] /u;
const N_A_PATTERN = /^([A-Za-z ]+: )?N\/A — .+/u;
const FRONTMATTER_RULES = [
  /^> \*\*title:\*\* .+/mu,
  /^> \*\*linear_issue:\*\* THR-\d+/mu,
  /^> \*\*author:\*\* .+/mu,
  /^> \*\*created:\*\* \d{4}-\d{2}-\d{2}/mu,
  /^> \*\*three_pillars:\*\* .+/mu,
] as const;
const HARD_CODED_REQUIRED_HEADINGS = [
  '## Why this is load-bearing',
  '## Engine pillar',
  '## Content pillar',
  '## UI pillar',
  '## Wiring',
  '## Constants table',
  '## Tracing',
  '## Fail-soft table',
  '## Three-pillar check',
  '## Vision audit',
  '## Rulebook impact',
  '## NFP-compliance table',
  '## Done when',
  '## Coordination block',
  '## Notes for the executor',
] as const;
const PLAN_DOC_SKIP_PATTERNS = [
  /\/_template\.md$/u,
  /\/wiring-checklist\.md$/u,
  /\/README\.md$/u,
  /-brainstorm\.md$/u,
  /-grill-me\.md$/u,
] as const;

function normalizeRepoPath(value: string): string {
  return value.trim().replaceAll('\\', '/');
}

function toAbsolutePath(inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
}

function runGit(args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function safeRunGit(args: string[]): string {
  try {
    return runGit(args);
  } catch {
    return '';
  }
}

function parsePorcelainLine(rawLine: string): string[] {
  if (!rawLine || rawLine.length < 4) return [];
  const payload = rawLine.slice(3).trim();
  if (!payload) return [];
  if (payload.includes(' -> ')) {
    const parts = payload.split(' -> ');
    return [normalizeRepoPath(parts[parts.length - 1] ?? '')].filter(Boolean);
  }
  return [normalizeRepoPath(payload)];
}

function parseNewlinePaths(raw: string): string[] {
  return raw
    .split(/\r?\n/u)
    .map((line) => normalizeRepoPath(line))
    .filter((line) => line.length > 0);
}

function collectCandidateFilesFromGit(): string[] {
  const staged = parseNewlinePaths(safeRunGit(['diff', '--name-only', '--cached', '--diff-filter=ACMR']));
  if (staged.length > 0) {
    return staged;
  }

  const porcelain = safeRunGit(['status', '--porcelain']);
  const statusPaths = porcelain
    .split(/\r?\n/u)
    .flatMap((line) => parsePorcelainLine(line))
    .filter((line) => line.length > 0);
  if (statusPaths.length > 0) {
    return statusPaths;
  }

  const lastCommitPaths = parseNewlinePaths(
    safeRunGit(['diff-tree', '--no-commit-id', '--name-only', '-r', '--diff-filter=ACMR', 'HEAD']),
  );
  if (lastCommitPaths.length > 0) {
    return lastCommitPaths;
  }

  return parseNewlinePaths(safeRunGit(['show', '--pretty=', '--name-only', '--diff-filter=ACMR', 'HEAD']));
}

function collectAllPlanFiles(): string[] {
  if (!fs.existsSync(PLANS_ROOT)) {
    return [];
  }

  return fs
    .readdirSync(PLANS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => normalizeRepoPath(path.join('Docs', 'plans', entry.name)));
}

function shouldSkipPlanDoc(repoPath: string): boolean {
  return PLAN_DOC_SKIP_PATTERNS.some((pattern) => pattern.test(`/${repoPath}`));
}

function addFinding(findings: Finding[], finding: Finding): void {
  findings.push(finding);
}

function findLineNumber(lines: string[], matcher: (line: string) => boolean, fallback = 1): number {
  const index = lines.findIndex(matcher);
  return index >= 0 ? index + 1 : fallback;
}

function isMarkdownTable(lines: string[]): boolean {
  const tableLines = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (tableLines.length === 1 && /^_?None\._?$/u.test(tableLines[0])) {
    return true;
  }
  if (tableLines.length === 1 && N_A_PATTERN.test(tableLines[0])) {
    return true;
  }
  return tableLines.filter((line) => TABLE_ROW_PATTERN.test(line)).length >= 2;
}

function hasFencedTsBlock(lines: string[]): boolean {
  return lines.some((line, index) => {
    if (!/^```ts\s*$/u.test(line.trim())) {
      return false;
    }
    return lines.slice(index + 1).some((candidate) => /^```\s*$/u.test(candidate.trim()));
  });
}

function buildSectionRanges(lines: string[]): Map<string, SectionRange> {
  const headings = lines
    .map((line, index) => ({ line, index }))
    .filter((entry) => HEADING_PATTERN.test(entry.line));
  const ranges = new Map<string, SectionRange>();

  headings.forEach((heading, index) => {
    const nextHeadingIndex = headings[index + 1]?.index ?? lines.length;
    ranges.set(heading.line.trim(), {
      heading: heading.line.trim(),
      startLine: heading.index + 1,
      endLine: nextHeadingIndex,
      body: lines.slice(heading.index + 1, nextHeadingIndex),
    });
  });

  return ranges;
}

function extractTemplateHeadings(findings: Finding[]): Set<string> {
  try {
    const templateText = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    return new Set(
      templateText
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => HEADING_PATTERN.test(line)),
    );
  } catch (error) {
    addFinding(findings, {
      check: 'linter-setup',
      severity: 'warn',
      file: 'Docs/plans/_template.md',
      line: 1,
      message: `Template load failed; using hardcoded heading list instead: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    return new Set(HARD_CODED_REQUIRED_HEADINGS);
  }
}

function checkFrontmatter(file: string, text: string, lines: string[], findings: Finding[]): void {
  if (FRONTMATTER_RULES.every((pattern) => pattern.test(text))) {
    return;
  }

  addFinding(findings, {
    check: 'frontmatter',
    severity: 'error',
    file,
    line: 1,
    message: 'Missing required title / linear_issue / author / created / three_pillars metadata block.',
  });

  if (!/^> \*\*three_pillars:\*\*/mu.test(text)) {
    addFinding(findings, {
      check: 'frontmatter',
      severity: 'error',
      file,
      line: findLineNumber(lines, (line) => /^> \*\*title:\*\*/u.test(line), 1),
      message: 'Missing `three_pillars` metadata line.',
    });
  }
}

function checkRequiredHeadings(
  file: string,
  lines: string[],
  findings: Finding[],
  templateHeadings: Set<string>,
): Map<string, SectionRange> {
  const sections = buildSectionRanges(lines);
  for (const heading of templateHeadings) {
    if (heading === '## Blast Radius') {
      continue;
    }
    if (!sections.has(heading)) {
      addFinding(findings, {
        check: 'required-heading',
        severity: 'error',
        file,
        line: lines.length,
        message: `Missing required section heading: ${heading}`,
      });
    }
  }
  return sections;
}

function sectionHasMeaningfulContent(section: SectionRange | undefined): boolean {
  if (!section) {
    return false;
  }
  const contentLines = section.body.map((line) => line.trim()).filter((line) => line.length > 0);
  if (contentLines.length === 0) {
    return false;
  }
  if (contentLines.some((line) => N_A_PATTERN.test(line))) {
    return true;
  }
  return contentLines.some((line) => !line.startsWith('*') && !line.startsWith('<!--'));
}

function checkPillarSections(file: string, sections: Map<string, SectionRange>, findings: Finding[]): void {
  const pillars = [
    ['engine-pillar', '## Engine pillar'],
    ['content-pillar', '## Content pillar'],
    ['ui-pillar', '## UI pillar'],
  ] as const;

  for (const [check, heading] of pillars) {
    const section = sections.get(heading);
    if (!section) {
      addFinding(findings, {
        check,
        severity: 'error',
        file,
        line: 1,
        message: `Missing ${heading} section.`,
      });
      continue;
    }
    if (!sectionHasMeaningfulContent(section)) {
      addFinding(findings, {
        check: 'pillar-content',
        severity: 'error',
        file,
        line: section.startLine,
        message: `${heading} must contain content or an \`N/A — <reason>\` line.`,
      });
    }
  }
}

function checkWiringSection(
  file: string,
  text: string,
  sections: Map<string, SectionRange>,
  findings: Finding[],
): void {
  const section = sections.get('## Wiring');
  if (!section) {
    addFinding(findings, {
      check: 'wiring',
      severity: 'error',
      file,
      line: 1,
      message: 'Missing `## Wiring` section.',
    });
    return;
  }
  if (!text.includes('Docs/plans/wiring-checklist.md')) {
    addFinding(findings, {
      check: 'wiring',
      severity: 'error',
      file,
      line: section.startLine,
      message: 'Plan doc must reference `Docs/plans/wiring-checklist.md`.',
    });
  }
}

function checkTableSection(
  file: string,
  sections: Map<string, SectionRange>,
  heading: string,
  check: string,
  findings: Finding[],
): void {
  const section = sections.get(heading);
  if (!section) {
    addFinding(findings, {
      check,
      severity: 'error',
      file,
      line: 1,
      message: `Missing ${heading} section.`,
    });
    return;
  }
  if (!isMarkdownTable(section.body)) {
    addFinding(findings, {
      check,
      severity: 'error',
      file,
      line: section.startLine,
      message: `${heading} must contain a markdown table or an explicit \`N/A — <reason>\` / \`_None._\` line.`,
    });
  }
}

function checkTracingSection(file: string, sections: Map<string, SectionRange>, findings: Finding[]): void {
  const section = sections.get('## Tracing');
  if (!section) {
    addFinding(findings, {
      check: 'tracing',
      severity: 'error',
      file,
      line: 1,
      message: 'Missing `## Tracing` section.',
    });
    return;
  }
  const trimmed = section.body.map((line) => line.trim()).filter(Boolean);
  if (trimmed.some((line) => N_A_PATTERN.test(line)) || hasFencedTsBlock(section.body)) {
    return;
  }
  addFinding(findings, {
    check: 'tracing',
    severity: 'error',
    file,
    line: section.startLine,
    message: 'Tracing section must include a fenced `ts` block or an explicit `N/A — <reason>` line.',
  });
}

function checkCheckboxSection(
  file: string,
  sections: Map<string, SectionRange>,
  heading: string,
  check: string,
  minCheckboxes: number,
  findings: Finding[],
): void {
  const section = sections.get(heading);
  if (!section) {
    addFinding(findings, {
      check,
      severity: 'error',
      file,
      line: 1,
      message: `Missing ${heading} section.`,
    });
    return;
  }
  const checkboxCount = section.body.filter((line) => CHECKBOX_PATTERN.test(line.trim())).length;
  if (checkboxCount < minCheckboxes) {
    addFinding(findings, {
      check,
      severity: 'error',
      file,
      line: section.startLine,
      message: `${heading} must contain at least ${minCheckboxes} checkbox line(s).`,
    });
  }
}

function checkNfpTable(file: string, sections: Map<string, SectionRange>, findings: Finding[]): void {
  const section = sections.get('## NFP-compliance table');
  if (!section) {
    addFinding(findings, {
      check: 'nfp-table',
      severity: 'error',
      file,
      line: 1,
      message: 'Missing `## NFP-compliance table` section.',
    });
    return;
  }
  const dataRows = section.body
    .map((line) => line.trim())
    .filter((line) => /^\|\s*[1-7]\./u.test(line));
  if (dataRows.length !== REQUIRED_NFP_COUNT) {
    addFinding(findings, {
      check: 'nfp-table',
      severity: 'error',
      file,
      line: section.startLine,
      message: `NFP-compliance table must contain exactly ${REQUIRED_NFP_COUNT} numbered rows.`,
    });
  }
}

function checkCoordinationBlock(file: string, sections: Map<string, SectionRange>, findings: Finding[]): void {
  const section = sections.get('## Coordination block');
  if (!section) {
    addFinding(findings, {
      check: 'coordination-block',
      severity: 'error',
      file,
      line: 1,
      message: 'Missing `## Coordination block` section.',
    });
    return;
  }
  const body = section.body.join('\n');
  for (const key of REQUIRED_COORDINATION_KEYS) {
    if (!body.includes(`**${key}:**`)) {
      addFinding(findings, {
        check: 'coordination-block',
        severity: 'error',
        file,
        line: section.startLine,
        message: `Coordination block missing required key: ${key}.`,
      });
    }
  }
}

function checkBlastRadiusConditional(
  file: string,
  text: string,
  sections: Map<string, SectionRange>,
  findings: Finding[],
): void {
  const mentionsHighImpactFile = HIGH_IMPACT_FILES.some((candidate) => text.includes(candidate) || file.includes(candidate));
  if (!mentionsHighImpactFile || sections.has('## Blast Radius')) {
    return;
  }
  addFinding(findings, {
    check: 'blast-radius-conditional',
    severity: 'warn',
    file,
    line: 1,
    message: 'Plan mentions a named high-impact file but has no `## Blast Radius` section.',
  });
}

function lintFile(repoPath: string, templateHeadings: Set<string>, findings: Finding[]): void {
  const absPath = toAbsolutePath(repoPath);
  let text: string;
  try {
    text = fs.readFileSync(absPath, 'utf8');
  } catch (error) {
    addFinding(findings, {
      check: 'file-read',
      severity: 'warn',
      file: repoPath,
      line: 1,
      message: `Unable to read file: ${error instanceof Error ? error.message : String(error)}`,
    });
    return;
  }

  if (text.trim().length === 0) {
    addFinding(findings, {
      check: 'empty-file',
      severity: 'error',
      file: repoPath,
      line: 1,
      message: 'Plan doc is empty.',
    });
    return;
  }

  const lines = text.split(/\r?\n/u);
  checkFrontmatter(repoPath, text, lines, findings);
  const sections = checkRequiredHeadings(repoPath, lines, findings, templateHeadings);
  checkPillarSections(repoPath, sections, findings);
  checkWiringSection(repoPath, text, sections, findings);
  checkTableSection(repoPath, sections, '## Constants table', 'constants-table', findings);
  checkTracingSection(repoPath, sections, findings);
  checkTableSection(repoPath, sections, '## Fail-soft table', 'fail-soft-table', findings);
  checkCheckboxSection(repoPath, sections, '## Three-pillar check', 'three-pillar-check', 4, findings);
  checkCheckboxSection(repoPath, sections, '## Vision audit', 'vision-audit', 2, findings);
  checkCheckboxSection(repoPath, sections, '## Rulebook impact', 'rulebook-impact', 2, findings);
  checkNfpTable(repoPath, sections, findings);
  checkCheckboxSection(repoPath, sections, '## Done when', 'done-when', 1, findings);
  checkCoordinationBlock(repoPath, sections, findings);
  checkBlastRadiusConditional(repoPath, text, sections, findings);
}

function parseCli(argv: readonly string[]): { strict: boolean; mode: CandidateMode; paths: string[] } {
  let strict = false;
  let mode: CandidateMode = 'paths';
  const paths: string[] = [];

  for (const arg of argv) {
    if (arg === STRICT_FLAG) {
      strict = true;
      continue;
    }
    if (arg === '--staged') {
      mode = 'staged';
      continue;
    }
    if (arg === '--all') {
      mode = 'all';
      continue;
    }
    paths.push(normalizeRepoPath(arg));
  }

  return { strict, mode, paths };
}

function collectTargetFiles(mode: CandidateMode, cliPaths: string[]): string[] {
  const sourceFiles =
    mode === 'all'
      ? collectAllPlanFiles()
      : mode === 'staged'
        ? collectCandidateFilesFromGit()
        : cliPaths;

  const planDocs = sourceFiles
    .map((file) => normalizeRepoPath(file))
    .filter((file, index, all) => file.length > 0 && all.indexOf(file) === index)
    .filter((file) => file.startsWith(PLAN_DOC_PREFIX) && file.endsWith('.md'))
    .filter((file) => fs.existsSync(toAbsolutePath(file)));

  return planDocs.filter((file) => !shouldSkipPlanDoc(file));
}

function printFindings(findings: Finding[], strict: boolean): number {
  if (findings.length === 0) {
    console.log('lint:plan-doc passed (no findings).');
    return 0;
  }

  const errors = findings.filter((finding) => finding.severity === 'error');
  const warns = findings.filter((finding) => finding.severity === 'warn');

  for (const finding of findings) {
    const level = finding.severity.toUpperCase();
    const location = `${finding.file}${finding.line ? `:${finding.line}` : ''}`;
    console.log(`[${level}] ${finding.check} ${location} ${finding.message}`);
  }

  console.log(`lint:plan-doc completed for ${findings.length} finding(s) across ${errors.length} error(s) and ${warns.length} warning(s).`);
  return strict && errors.length > 0 ? 1 : 0;
}

function main(): number {
  const { strict, mode, paths } = parseCli(process.argv.slice(2));
  const targetFiles = collectTargetFiles(mode, paths);

  if (targetFiles.length === 0) {
    const reason = mode === 'all' ? `no files matched ${PLAN_DOC_GLOB}` : 'no candidate files found';
    console.log(`lint:plan-doc skipped (${reason}).`);
    return 0;
  }

  const findings: Finding[] = [];
  const templateHeadings = extractTemplateHeadings(findings);

  for (const file of targetFiles) {
    lintFile(file, templateHeadings, findings);
  }

  return printFindings(findings, strict);
}

process.exit(main());
