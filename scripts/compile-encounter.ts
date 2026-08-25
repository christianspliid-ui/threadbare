/**
 * `compile:encounter` — content package in, configured game content out. THR-1246.
 *
 * Director ask (Christian, chat, 2026-08-25): take the authoring agent's output
 * and configure it as game content mechanically, so agent context is spent on
 * content substance instead of schema ceremony. The agent fills an
 * `EncounterContentPackage` (JSON — prose verbatim, hands, aftermath, support
 * bundle; see `encounterPackage.ts` and the skill's
 * `reference/encounter-package-format.md`); this command does the rest:
 *
 *   1. validates (unknown top-level keys are loud errors; semantic hand /
 *      envelope / aftermath rules from the shipped authoring constants);
 *   2. writes `src/data/encounters/<slug>.ts` — prose byte-identical, the
 *      literal annotated with `UnifiedActionTemplate` so `check:typecheck` is
 *      the deep validator, `locationSubtypes` derived, `consequenceDraw`
 *      stamped from the binding draw (THR-1145);
 *   3. writes `src/data/encounters/__tests__/<slug>.test.ts` with expected
 *      values baked from the package;
 *   4. registers the template in `UNIFIED_ACTION_TEMPLATES` and (unless the
 *      package opts out, per the THR-733 group-exclusive note)
 *      `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` — idempotently.
 *
 * The compiled file is the canonical, hand-editable artifact from then on —
 * this is a configurator, not a build step: nothing regenerates the file
 * behind an editor's back, and no freshness gate binds package to output.
 *
 * Usage:
 *   npm run compile:encounter -- Docs/plans/encounters/<slug>.package.json
 *   npm run compile:encounter -- <path> --dry-run     # print, write nothing
 *   npm run compile:encounter -- <path> --force       # overwrite existing files
 *
 * After compiling, the normal gates still own correctness:
 *   npm run check:typecheck                      (deep field validation)
 *   npx vitest run src/data/encounters/__tests__/<slug>.test.ts
 *   npm run check:encounter -- <templateId>      (composition contract)
 *   npm run check:encounter-live -- <templateId> (blocks arrive in a world)
 *
 * Exit codes:
 *   0  compiled (or dry-run printed)
 *   1  bad arguments, unreadable package, or validation violations
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import {
  REGISTRATION_FILE_RELPATH,
  assembleTemplate,
  deriveConstName,
  emitEncounterModule,
  emitEncounterTest,
  encounterPackageViolations,
  registerTemplateInSource,
  unknownPackageKeys,
  type EncounterContentPackage,
} from '../src/data/content-eval/encounterPackage';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const force = argv.includes('--force');
const packagePath = argv.find(arg => !arg.startsWith('--'));

if (!packagePath) {
  console.error(
    'Usage: npm run compile:encounter -- <package.json> [--dry-run] [--force]',
  );
  process.exit(1);
}

// ─── Read + validate ─────────────────────────────────────────────────

let parsed: unknown;
try {
  parsed = JSON.parse(readFileSync(packagePath, 'utf8'));
} catch (error) {
  console.error(`Cannot read '${packagePath}': ${(error as Error).message}`);
  process.exit(1);
}

if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  console.error('The package must be a JSON object.');
  process.exit(1);
}

const unknown = unknownPackageKeys(parsed);
if (unknown.length > 0) {
  console.error('Unknown top-level package key(s) — refusing to guess:');
  for (const key of unknown) console.error(`  ✗ ${key}`);
  console.error("  (allowed: slug, doc, constName, registerInLocationCache, template)");
  process.exit(1);
}

const pkg = parsed as EncounterContentPackage;
const violations = encounterPackageViolations(pkg);
if (violations.length > 0) {
  console.error(`Package has ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`  ✗ ${violation}`);
  process.exit(1);
}

// ─── Compile ─────────────────────────────────────────────────────────

const assembled = assembleTemplate(pkg);
const constName = pkg.constName ?? deriveConstName(pkg.slug);
const moduleSource = emitEncounterModule(pkg);
const testSource = emitEncounterTest(pkg);

const modulePath = path.join('src', 'data', 'encounters', `${pkg.slug}.ts`);
const testPath = path.join('src', 'data', 'encounters', '__tests__', `${pkg.slug}.test.ts`);

const registrationSource = readFileSync(REGISTRATION_FILE_RELPATH, 'utf8');
const registration = registerTemplateInSource(registrationSource, pkg);

// ─── Write (or print) ────────────────────────────────────────────────

if (dryRun) {
  console.log(`── ${modulePath} ──`);
  console.log(moduleSource);
  console.log(`── ${testPath} ──`);
  console.log(testSource);
  console.log(
    `── ${REGISTRATION_FILE_RELPATH}: would add ${
      registration.changed.length > 0 ? registration.changed.join(' + ') : 'nothing (already registered)'
    } ──`,
  );
  process.exit(0);
}

for (const [target, label] of [
  [modulePath, 'encounter module'],
  [testPath, 'structural test'],
] as const) {
  if (existsSync(target) && !force) {
    console.error(
      `${target} already exists — the compiled file is the canonical, hand-editable `
        + 'artifact, so overwriting it may discard hand edits. Re-run with --force if '
        + 'that is intended.',
    );
    process.exit(1);
  }
  void label;
}

mkdirSync(path.dirname(testPath), { recursive: true });
writeFileSync(modulePath, moduleSource, 'utf8');
writeFileSync(testPath, testSource, 'utf8');
if (registration.changed.length > 0) {
  writeFileSync(REGISTRATION_FILE_RELPATH, registration.source, 'utf8');
}

// ─── Report ──────────────────────────────────────────────────────────

console.log('');
console.log('══════════════════════════════════════════════════════════════');
console.log('  compile:encounter');
console.log('══════════════════════════════════════════════════════════════');
console.log(`  template   ${assembled.id}`);
console.log(`  const      ${constName}`);
console.log(`  wrote      ${modulePath}`);
console.log(`  wrote      ${testPath}`);
console.log(
  `  registered ${
    registration.changed.length > 0
      ? registration.changed.join(' + ')
      : 'nothing new (already registered)'
  }`,
);
console.log(`  stamped    consequenceDraw: [${(assembled.consequenceDraw ?? []).join(', ')}]`);
console.log('');
console.log('  The compiled file is now the canonical artifact — hand-edit it');
console.log('  freely; nothing regenerates it behind you. Still owed:');
console.log('    npm run check:typecheck        (deep field validation)');
console.log(`    npx vitest run ${testPath}`);
console.log(`    npm run check:encounter -- ${assembled.id}`);
console.log(`    npm run check:encounter-live -- ${assembled.id}`);
console.log('══════════════════════════════════════════════════════════════');
console.log('');
