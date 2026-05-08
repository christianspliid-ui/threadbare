/**
 * THR-345 (G3) — Encounter content lint runner.
 *
 * Wraps the existing Zod validator with five new authoring rules (R1–R5)
 * defined in Docs/plans/2026-05-07-thr-G3-content-lint-spec.md.
 *
 *   npm run lint:encounter-content              -> adapter + good fixtures, exit 0 expected
 *   npm run lint:encounter-content -- --include-bad  -> also lint bad fixtures (diagnostic)
 *
 * Exit code 0 iff no errors. Warnings (R5) never block.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import {
  formatIssue,
  lintEncounterContract,
  summarize,
  type GraphRegistry,
  type LintIssue,
} from '../src/data/encounter-content-lint';
import {
  GOOD_FIXTURES,
  BAD_FIXTURES,
} from '../src/data/__fixtures__/encounter-content-lint';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { adaptUnifiedActionTemplateToEncounterContract } from '../src/engine/encounter-contract-adapter';

interface CliOptions {
  readonly includeBad: boolean;
}

function parseArgs(argv: readonly string[]): CliOptions {
  return { includeBad: argv.includes('--include-bad') };
}

const ID_LITERAL_REGEX = /\bid:\s*['"]([A-Za-z0-9_.\-:/]+)['"]/g;
const SCAN_SKIP_DIRS = new Set(['__tests__', '__fixtures__', 'node_modules', '.cache']);

function scanContentIds(rootDir: string): ReadonlySet<string> {
  const ids = new Set<string>();
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SCAN_SKIP_DIRS.has(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        let text: string;
        try {
          text = fs.readFileSync(fullPath, 'utf-8');
        } catch {
          continue;
        }
        for (const match of text.matchAll(ID_LITERAL_REGEX)) {
          ids.add(match[1]);
        }
      }
    }
  };
  walk(rootDir);
  return ids;
}

function loadGraphRegistry(repoRoot: string): GraphRegistry {
  const worldModelPath = path.join(repoRoot, 'src', 'data', 'world-model.json');
  let nodeIds: Set<string>;
  try {
    const raw = fs.readFileSync(worldModelPath, 'utf-8');
    const parsed = JSON.parse(raw) as { nodes?: ReadonlyArray<{ id?: string }> };
    nodeIds = new Set(
      (parsed.nodes ?? [])
        .map((n) => n.id)
        .filter((id): id is string => typeof id === 'string'),
    );
  } catch (err) {
    console.error(`encounter-content-lint: failed to read world-model.json — ${(err as Error).message}`);
    process.exit(1);
  }

  const contentIds = scanContentIds(path.join(repoRoot, 'src', 'data'));
  return { nodeIds, contentIds };
}

function lintFixtures(
  registry: GraphRegistry,
  options: CliOptions,
): readonly LintIssue[] {
  const issues: LintIssue[] = [];
  for (const fx of GOOD_FIXTURES) {
    const fxIssues = lintEncounterContract(fx.contract, registry, fx.name);
    issues.push(...fxIssues);
  }
  if (options.includeBad) {
    for (const fx of BAD_FIXTURES) {
      const fxIssues = lintEncounterContract(fx.contract, registry, fx.name);
      issues.push(...fxIssues);
    }
  }
  return issues;
}

interface AdapterRunResult {
  readonly issues: readonly LintIssue[];
  readonly skippedAdapterFailures: readonly string[];
}

function lintAdapterOutput(registry: GraphRegistry): AdapterRunResult {
  const issues: LintIssue[] = [];
  const skippedAdapterFailures: string[] = [];
  for (const template of UNIFIED_ACTION_TEMPLATES) {
    let contract;
    try {
      contract = adaptUnifiedActionTemplateToEncounterContract(template);
    } catch {
      // Pre-existing template data quality issue — adapter cannot translate.
      // Tracked separately; do not block the lint per spec §8.
      skippedAdapterFailures.push(template.id);
      continue;
    }
    const fxIssues = lintEncounterContract(contract, registry, `adapter:${template.id}`);
    issues.push(...fxIssues);
  }
  return { issues, skippedAdapterFailures };
}

function main(argv: readonly string[]): number {
  const options = parseArgs(argv);
  const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
  const registry = loadGraphRegistry(repoRoot);

  const adapterRun = lintAdapterOutput(registry);
  const fixtureIssues = lintFixtures(registry, options);
  const allIssues = [...adapterRun.issues, ...fixtureIssues];

  for (const issue of allIssues) {
    console.log(formatIssue(issue));
  }

  const adapterCount = UNIFIED_ACTION_TEMPLATES.length - adapterRun.skippedAdapterFailures.length;
  const fixtureCount = GOOD_FIXTURES.length + (options.includeBad ? BAD_FIXTURES.length : 0);
  const totalContracts = adapterCount + fixtureCount;
  const { errors, warnings } = summarize(allIssues);

  console.log('');
  if (adapterRun.skippedAdapterFailures.length > 0) {
    console.log(
      `encounter-content-lint: skipped ${adapterRun.skippedAdapterFailures.length} ` +
        `templates whose adapter output is pre-existing-invalid — see THR-366. ` +
        `First few: ${adapterRun.skippedAdapterFailures.slice(0, 3).join(', ')}`,
    );
  }
  console.log(
    `encounter-content-lint: scanned ${totalContracts} contracts ` +
      `(${adapterCount} adapter, ${fixtureCount} fixtures) | ${errors} errors | ${warnings} warnings`,
  );

  return errors > 0 ? 1 : 0;
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('lint-encounter-content.mjs') ||
  process.argv[1]?.endsWith('lint-encounter-content.ts');

if (isMain) {
  process.exit(main(process.argv.slice(2)));
}

export { loadGraphRegistry, scanContentIds };
