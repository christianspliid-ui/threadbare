/**
 * `draw:hooks` — the Encounter Factory's brief-stage plot-hook roll. THR-1147.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § Other tables.
 *
 * Prints the story seeds a brief rolls, so the premise starts from the project's
 * own inspiration corpus rather than from whatever the author reached for last
 * time. The author takes one, or blends two, and records which on the brief.
 *
 * The roll is a pure function of `(briefSeed, reach)`, so running it twice prints
 * the same offers — which is what makes a recorded roll checkable by anyone who
 * doubts it. Unlike the consequence hand, the hook is **not binding**: nothing
 * downstream verifies the finished encounter resembles it.
 *
 * Usage:
 *   npm run draw:hooks -- retrofit-batch-2-ward-the-camp --reach veil
 *   npm run draw:hooks -- <briefSlug> --reach heart --count 5
 *   npm run draw:hooks -- <briefSlug> --reach star --json
 *   npm run draw:hooks -- --coverage          # which hooks the corpus has spent
 *
 * Exit codes:
 *   0  a roll was printed (or coverage was reported)
 *   1  bad arguments, or a catalog health violation
 */

import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import {
  PLOT_HOOKS,
  PLOT_HOOK_DRAW_COUNT,
  PLOT_HOOK_NUMBERING_NOTE,
  PLOT_HOOK_REUSE_DAMPING,
  drawPlotHooks,
  plotHookCatalogViolations,
  plotHookWeight,
} from '../src/data/content-eval/plotHooks';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');
const wantsCoverage = argv.includes('--coverage');

function flag(name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return argv[index + 1];
}

const positional = argv.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  const previous = argv[index - 1];
  return !(previous === '--reach' || previous === '--count');
});

// ─── Catalog health, first ───────────────────────────────────────────

// Checked before anything is printed: a roll off a broken catalog is worse than
// no roll, because it looks like a roll.
const violations = plotHookCatalogViolations();
if (violations.length > 0) {
  console.error('Plot-hook catalog has violations:');
  for (const violation of violations) console.error(`  ✗ ${violation}`);
  process.exit(1);
}

// ─── Coverage mode ───────────────────────────────────────────────────

if (wantsCoverage) {
  const used = PLOT_HOOKS.filter(hook => hook.usedBy.length > 0);
  const unused = PLOT_HOOKS.filter(hook => hook.usedBy.length === 0);

  if (wantsJson) {
    console.log(
      JSON.stringify(
        {
          total: PLOT_HOOKS.length,
          used: used.length,
          unused: unused.length,
          spent: used.map(hook => ({ id: hook.id, usedBy: hook.usedBy })),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  console.log('');
  console.log(`  Plot-hook coverage — ${used.length} of ${PLOT_HOOKS.length} hooks spent`);
  console.log('');
  for (const hook of used) {
    console.log(`  ▸ ${hook.id}  (${hook.usedBy.length}×)`);
    console.log(`      ${hook.usedBy.join(', ')}`);
  }
  console.log('');
  console.log(`  ${unused.length} never drawn. Damping is ${PLOT_HOOK_REUSE_DAMPING} per use.`);
  console.log('');
  process.exit(0);
}

// ─── Resolve the roll ────────────────────────────────────────────────

const briefSeed = positional[0];
if (!briefSeed) {
  console.error(
    'Usage: npm run draw:hooks -- <briefSeed> --reach <reach> [--count n] [--json]\n'
      + '       npm run draw:hooks -- --coverage',
  );
  process.exit(1);
}

const reachArg = flag('reach');
if (reachArg === undefined) {
  console.error(`--reach is required. One of: ${REACH_DOMAINS.join(', ')}`);
  process.exit(1);
}
if (!(REACH_DOMAINS as readonly string[]).includes(reachArg)) {
  console.error(`Unknown reach '${reachArg}'. One of: ${REACH_DOMAINS.join(', ')}`);
  process.exit(1);
}
const reach = reachArg as ReachDomain;

const countArg = flag('count');
const parsedCount = countArg === undefined ? undefined : Number(countArg);
if (parsedCount !== undefined && (!Number.isInteger(parsedCount) || parsedCount < 1)) {
  console.error(`--count must be a positive integer, got '${countArg}'`);
  process.exit(1);
}
const count = parsedCount ?? PLOT_HOOK_DRAW_COUNT;

const rolled = drawPlotHooks({ briefSeed, reach, count });

// ─── Print ───────────────────────────────────────────────────────────

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        briefSeed,
        reach,
        count,
        catalogSize: PLOT_HOOKS.length,
        rolled: rolled.map(hook => ({
          id: hook.id,
          catalogNumber: hook.catalogNumber,
          hook: hook.hook,
          themes: hook.themes,
          reaches: hook.reaches,
          source: hook.source,
          weight: plotHookWeight(hook, reach),
          timesUsed: hook.usedBy.length,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log('');
console.log('══════════════════════════════════════════════════════════════');
console.log('  The Plot-Hook Draw');
console.log('══════════════════════════════════════════════════════════════');
console.log(`  brief     ${briefSeed}`);
console.log(`  reach     ${reach}`);
console.log(`  rolled    ${rolled.length} of ${PLOT_HOOKS.length} hooks`);
console.log('');

for (const hook of rolled) {
  const number = hook.catalogNumber === undefined ? '' : `  (Hook #${hook.catalogNumber})`;
  const affinity = hook.reaches.includes(reach) ? 'affinity' : 'off-reach';
  console.log(`  ▸ ${hook.id}${number}`);
  console.log(`      ${hook.hook}`);
  console.log(
    `      themes: ${hook.themes.join(', ')}  ·  ${affinity}`
      + `  ·  weight ${plotHookWeight(hook, reach).toFixed(2)}`
      + (hook.usedBy.length > 0 ? `  ·  used ${hook.usedBy.length}×` : ''),
  );
  console.log(`      ${hook.source}`);
  console.log('');
}

console.log('  Take ONE as the premise\'s starting point, or blend two. Record');
console.log('  `plotHookRolled` (all offered ids) and `plotHookTaken` on the brief.');
console.log('  The hook is a starting point, not a contract — the finished encounter');
console.log('  is never checked against it. Drifting away from it is allowed and');
console.log('  expected; not recording the roll is not.');
console.log('');
console.log(`  Note: ${PLOT_HOOK_NUMBERING_NOTE}`);
console.log('══════════════════════════════════════════════════════════════');
console.log('');
