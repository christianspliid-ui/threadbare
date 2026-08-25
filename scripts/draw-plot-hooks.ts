/**
 * `draw:hooks` — the Encounter Factory's brief-stage rolls. THR-1147, THR-1224.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § Other tables.
 * Contract for the dice: `nudge-authoring-spec.md` § *The Seed Dice*.
 *
 * Prints the story seeds a brief rolls, so the premise starts from the project's
 * own inspiration corpus rather than from whatever the author reached for last
 * time. The author takes one, or blends two, and records which on the brief.
 *
 * Since THR-1224 the same command also rolls **the five Seed Dice** — stake
 * shape, opposition + motive, disposition, the agent's role, and scale. They
 * live here rather than in a command of their own because they are rolled at the
 * same moment, for the same slot, off the same seed: a brief that gets its hook
 * without its dice is the unrolled encounter the dice exist to prevent, and two
 * commands is one command a hurried author skips.
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
import {
  DISPOSITION_NOT_APPLICABLE,
  STAKE_FACES,
  THEME_NATURAL_SHAPES,
  rollSeedDice,
  seedDiceCatalogViolations,
  type StakeShape,
} from '../src/data/content-eval/seedDice';

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
const violations = [...plotHookCatalogViolations(), ...seedDiceCatalogViolations()];
if (violations.length > 0) {
  console.error('Brief-stage catalog has violations:');
  for (const violation of violations) console.error(`  ✗ ${violation}`);
  process.exit(1);
}

/** Shapes a hook's themes suggest, in the stake die's canonical order. */
function shapesForThemes(themes: readonly string[]): readonly StakeShape[] {
  const suggested = new Set<StakeShape>();
  for (const theme of themes) {
    for (const shape of THEME_NATURAL_SHAPES[theme as keyof typeof THEME_NATURAL_SHAPES] ?? []) {
      suggested.add(shape);
    }
  }
  return STAKE_FACES.map(face => face.id).filter(id => suggested.has(id));
}

// ─── Coverage mode ───────────────────────────────────────────────────

if (wantsCoverage) {
  const used = PLOT_HOOKS.filter(hook => hook.usedBy.length > 0);
  const unused = PLOT_HOOKS.filter(hook => hook.usedBy.length === 0);

  // ── Shape columns (THR-1224) ──────────────────────────────────────
  //
  // What the spent hooks have been pulling the corpus *toward*, derived from
  // each hook's themes through the stake die's suggestion table.
  //
  // Deliberately measured off the themes rather than off the encounters: no
  // template records the stake shape it was written to, and adding a field for
  // one would turn an advisory axis into a binding one by the back door (the
  // spec's tier table puts the theme→shape suggestion at *advisory*). So this
  // reports the pull, not the outcome — a shape with no spent hook behind it is
  // one nothing has even been nudged toward, which is the skew worth seeing.
  const shapeSpend = new Map<StakeShape, number>(STAKE_FACES.map(face => [face.id, 0]));
  for (const hook of used) {
    for (const shape of shapesForThemes(hook.themes)) {
      shapeSpend.set(shape, (shapeSpend.get(shape) ?? 0) + hook.usedBy.length);
    }
  }

  if (wantsJson) {
    console.log(
      JSON.stringify(
        {
          total: PLOT_HOOKS.length,
          used: used.length,
          unused: unused.length,
          spent: used.map(hook => ({
            id: hook.id,
            usedBy: hook.usedBy,
            suggestedShapes: shapesForThemes(hook.themes),
          })),
          shapeSpend: Object.fromEntries(shapeSpend),
          shapesNeverSuggested: [...shapeSpend].filter(([, n]) => n === 0).map(([shape]) => shape),
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
    console.log(`      shapes: ${shapesForThemes(hook.themes).join(' · ') || '—'}`);
  }
  console.log('');
  console.log(`  ${unused.length} never drawn. Damping is ${PLOT_HOOK_REUSE_DAMPING} per use.`);
  console.log('');
  console.log('  ── Stake-shape pull (from spent hooks\' themes) ──');
  for (const face of STAKE_FACES) {
    const spend = shapeSpend.get(face.id) ?? 0;
    console.log(`  ${spend === 0 ? '·' : '▸'} ${face.label.padEnd(18)} ${spend}`);
  }
  console.log('');
  console.log('  A shape at 0 is one nothing spent has even leaned toward. The');
  console.log('  suggestion is advisory — the stake die is what actually rolls.');
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

// The five dice are seeded off the brief slug alone, so they are stable across
// `--count` and `--reach` — the hook offers change, the slot's shape does not.
// Themes come from the offered hooks so the advisory suggestion is printed for
// whichever one the author takes; they never weight the stake roll itself.
const dice = rollSeedDice({
  briefSeed,
  themes: [...new Set(rolled.flatMap(hook => hook.themes))],
});

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
          suggestedShapes: shapesForThemes(hook.themes),
        })),
        seedDice: {
          p3Shape: dice.stake.id,
          p2Must: dice.stake.p2Must,
          closingFormat: dice.stake.closingFormat,
          needsNamedOwner: dice.stake.needsNamedOwner,
          suggestedShapes: dice.suggestedShapes,
          opposition: dice.opposition.id,
          motive: dice.motive,
          activity: dice.activity ?? null,
          disposition: dice.disposition ?? DISPOSITION_NOT_APPLICABLE,
          agentRole: dice.agentRole.id,
          scale: dice.scale,
        },
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
  console.log(`      suggests: ${shapesForThemes(hook.themes).join(' · ') || '—'}`);
  console.log(`      ${hook.source}`);
  console.log('');
}

// ─── The Seed Dice ───────────────────────────────────────────────────

console.log('──────────────────────────────────────────────────────────────');
console.log('  The Seed Dice');
console.log('──────────────────────────────────────────────────────────────');
// The per-hook `suggests:` lines above carry the theme→shape table; repeating
// their union here would print all eight shapes on any multi-hook draw, which
// says nothing. What is worth one line is whether the roll *agrees* with the
// hooks on offer — and a roll that does not is the die earning its keep, not a
// conflict to resolve.
const agreesWithAHook = dice.suggestedShapes.includes(dice.stake.id);
console.log(
  `  p3Shape:     ${dice.stake.id}`
    + (dice.suggestedShapes.length === 0
      ? ''
      : agreesWithAHook
        ? '   (an offered hook\'s themes suggest this shape too)'
        : '   (no offered hook suggests this — the die is breaking the default)'),
);
console.log(`               P2 must establish ${dice.stake.p2Must}`);
console.log(`               closing: ${dice.stake.closingFormat}`);
if (dice.stake.needsNamedOwner) {
  console.log('               this shape needs a named person to own the problem');
}
console.log(
  `  opposition:  ${dice.opposition.label} (motive: ${dice.motive})`
    + (dice.activity === undefined
      ? '  ·  activity: authored — the list describes people, not weather'
      : `  ·  activity: ${dice.activity}`),
);
console.log(
  `  disposition: ${dice.disposition ?? DISPOSITION_NOT_APPLICABLE}`
    + (dice.disposition === undefined ? '  (no willed opposition)' : ''),
);
console.log(
  `  agentRole:   ${dice.agentRole.label}`
    + (dice.agentRole.note === undefined ? '' : `  — e.g. ${dice.agentRole.note}`),
);
console.log(`  scale:       ${dice.scale}`);
console.log('');
console.log('  Rolls propose, design disposes. Record these five on the brief');
console.log('  beside `plotHookTaken`. A shape may compound once (Opportunity +');
console.log('  Contest); a third shape means P2 is overloaded.');
console.log('');

console.log('  Take ONE as the premise\'s starting point, or blend two. Record');
console.log('  `plotHookRolled` (all offered ids) and `plotHookTaken` on the brief.');
console.log('  The hook is a starting point, not a contract — the finished encounter');
console.log('  is never checked against it. Drifting away from it is allowed and');
console.log('  expected; not recording the roll is not.');
console.log('');
console.log(`  Note: ${PLOT_HOOK_NUMBERING_NOTE}`);
console.log('══════════════════════════════════════════════════════════════');
console.log('');
