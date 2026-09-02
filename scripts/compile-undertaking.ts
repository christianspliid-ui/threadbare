/**
 * `compile:undertaking` — content package in, configured undertaking out. THR-1300
 * slice 3, the `compile-encounter.ts` sibling (THR-1246).
 *
 * The authoring agent fills an `UndertakingContentPackage` (JSON — the real
 * `StrategicActionTemplate` plus `kind`, `profiles`, `docComment`; see
 * `src/data/content-eval/undertakingPackage.ts` and the skill's
 * `reference/undertaking-package-format.md`); this command does the rest:
 *
 *   1. validates (unknown top-level keys are loud; `kind.role` legal for the verb;
 *      profiles exist; a row-less kind opens only on its first destroy);
 *   2. writes `src/data/strategic-packs/factory/<slug>.ts` — prose byte-identical,
 *      the literal annotated with the real type so `check:typecheck` is the deep
 *      validator — and `factory/__tests__/<slug>.test.ts`;
 *   3. registers the export in `FACTORY_STRATEGIC_TEMPLATES`, the id in the named
 *      kind row's column (`undertaking-kinds.ts`) and in each named ambition's
 *      `strategicProfile.templateIds` — all idempotently.
 *
 * The compiled file is the canonical, hand-editable artifact from then on: a
 * configurator, not a build step. After compiling, the gates own correctness:
 *   npm run check:typecheck · npm run check:undertaking -- <id> ·
 *   npm run check:undertaking-live -- <id> · npx vitest run <the emitted test>
 *
 * Usage:
 *   npm run compile:undertaking -- Docs/plans/undertakings/<slug>.package.json
 *   npm run compile:undertaking -- <path> --dry-run     # print, write nothing
 *   npm run compile:undertaking -- <path> --force       # overwrite an existing module
 *
 * Exit codes: 0 compiled (or dry-run printed) · 1 bad arguments, unreadable package,
 * or validation violations.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  AMBITION_TEMPLATES_FILE_RELPATH,
  FACTORY_DIR_RELPATH,
  FACTORY_INDEX_FILE_RELPATH,
  KIND_ROWS_FILE_RELPATH,
  emitUndertakingModule,
  emitUndertakingTest,
  registerInFactoryIndex,
  registerInKindRows,
  registerInProfiles,
  undertakingPackageViolations,
  unknownUndertakingPackageKeys,
  type UndertakingContentPackage,
} from '../src/data/content-eval/undertakingPackage';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const force = argv.includes('--force');
const packagePath = argv.find(a => !a.startsWith('--'));

if (!packagePath) {
  console.error('Usage: npm run compile:undertaking -- <package.json> [--dry-run] [--force]');
  process.exit(1);
}
if (!existsSync(packagePath)) {
  console.error(`compile:undertaking: no such file ${packagePath}`);
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(packagePath, 'utf8'));
} catch (err) {
  console.error(`compile:undertaking: ${packagePath} is not valid JSON — ${(err as Error).message}`);
  process.exit(1);
}
if (!parsed || typeof parsed !== 'object') {
  console.error('compile:undertaking: the package must be a JSON object');
  process.exit(1);
}

const unknown = unknownUndertakingPackageKeys(parsed as object);
if (unknown.length > 0) {
  console.error(`compile:undertaking: unknown top-level key(s): ${unknown.join(', ')}`);
  process.exit(1);
}
const pkg = parsed as UndertakingContentPackage;
const violations = undertakingPackageViolations(pkg);
if (violations.length > 0) {
  console.error('compile:undertaking: the package is not compilable:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

const moduleSource = emitUndertakingModule(pkg);
const testSource = emitUndertakingTest(pkg);
const modulePath = path.join(FACTORY_DIR_RELPATH, `${pkg.slug}.ts`);
const testPath = path.join(FACTORY_DIR_RELPATH, '__tests__', `${pkg.slug}.test.ts`);

const index = registerInFactoryIndex(readFileSync(FACTORY_INDEX_FILE_RELPATH, 'utf8'), pkg);
const rows = registerInKindRows(readFileSync(KIND_ROWS_FILE_RELPATH, 'utf8'), pkg);
const profiles = registerInProfiles(readFileSync(AMBITION_TEMPLATES_FILE_RELPATH, 'utf8'), pkg);

if (dryRun) {
  console.log(`── ${modulePath} ──\n${moduleSource}`);
  console.log(`── ${testPath} ──\n${testSource}`);
  console.log(`── registration ── factory index: ${index.changed ? 'would change' : 'already registered'} · kind row: ${rows.changed ? 'would change' : 'already registered'} · profiles: ${profiles.changed ? 'would change' : 'already registered'}`);
  process.exit(0);
}

if (existsSync(modulePath) && !force) {
  console.error(`compile:undertaking: ${modulePath} exists — pass --force to overwrite (the compiled file is hand-editable; do not clobber edits by accident)`);
  process.exit(1);
}

mkdirSync(path.dirname(testPath), { recursive: true });
writeFileSync(modulePath, moduleSource, 'utf8');
writeFileSync(testPath, testSource, 'utf8');
if (index.changed) writeFileSync(FACTORY_INDEX_FILE_RELPATH, index.source, 'utf8');
if (rows.changed) writeFileSync(KIND_ROWS_FILE_RELPATH, rows.source, 'utf8');
if (profiles.changed) writeFileSync(AMBITION_TEMPLATES_FILE_RELPATH, profiles.source, 'utf8');

console.log(`compile:undertaking: wrote ${modulePath} and ${testPath}`);
console.log(`  factory index: ${index.changed ? 'registered' : 'already registered'} · kind row ${pkg.kind.kindId}.${pkg.kind.role}: ${rows.changed ? 'registered' : 'already registered'} · profiles: ${profiles.changed ? 'registered' : 'already registered'}`);
console.log('  next: npm run check:typecheck · npm run check:undertaking -- ' + pkg.template.id + ' · npm run check:undertaking-live -- ' + pkg.template.id);
