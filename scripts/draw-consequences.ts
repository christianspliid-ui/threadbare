/**
 * `draw:consequences` — the Encounter Factory's brief-stage draw. THR-1145.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § The
 * Consequence Draw.
 *
 * Prints the consequence hand a template id draws, plus the concrete effect
 * kinds that satisfy each drawn family. The pipeline's brief stage runs this and
 * carries the hand into the brief, so an author starts from a rolled set of
 * primitives rather than from habit.
 *
 * The draw is a pure function of `(templateId, reach, rarityTier)`, so running
 * this twice prints the same hand — which is also what makes a recorded hand
 * checkable. `check:encounter` recomputes it and fails a mismatch.
 *
 * Usage:
 *   npm run draw:consequences -- encounter.slice.unsafe_bridge
 *   npm run draw:consequences -- encounter.camp.ward_the_camp --reach veil --rarity 2
 *   npm run draw:consequences -- <id> --reach heart --json
 *
 * `--reach` / `--rarity` are required for an id that is not in the live catalog
 * (the normal case at brief time — the template does not exist yet). For an id
 * that *is* live, they default to the template's own declared values and an
 * explicit flag overrides them, which is how you preview the hand a retune would
 * produce before committing to it.
 *
 * Exit codes:
 *   0  a hand was drawn
 *   1  bad arguments, or an unknown id with no `--reach` given
 */

import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { REACH_DOMAINS, type ReachDomain } from '../src/types/traits';
import type { RarityTier } from '../src/types/rarity';
import {
  CONSEQUENCE_FAMILY_EFFECT_KINDS,
  CONSEQUENCE_FAMILY_WEIGHTS,
  CONSEQUENCE_FORMATIVE_MIN_TIER,
  consequenceHandSize,
  drawConsequenceHand,
} from '../src/data/content-eval/consequenceDraw';

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const wantsJson = argv.includes('--json');

function flag(name: string): string | undefined {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return argv[index + 1];
}

const positional = argv.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  // Drop a value that belongs to the flag before it.
  const previous = argv[index - 1];
  return !(previous === '--reach' || previous === '--rarity');
});

const templateId = positional[0];
if (!templateId) {
  console.error(
    'Usage: npm run draw:consequences -- <templateId> [--reach <reach>] [--rarity 1|2|3|4] [--json]',
  );
  process.exit(1);
}

// ─── Resolve reach + rarity ──────────────────────────────────────────

const live = UNIFIED_ACTION_TEMPLATES.find(t => t.id === templateId);

const reachArg = flag('reach');
if (reachArg !== undefined && !(REACH_DOMAINS as readonly string[]).includes(reachArg)) {
  console.error(`Unknown reach '${reachArg}'. One of: ${REACH_DOMAINS.join(', ')}`);
  process.exit(1);
}
const reach = (reachArg as ReachDomain | undefined) ?? live?.reach;
if (!reach) {
  console.error(
    `'${templateId}' is not a live template, so --reach is required. `
      + `One of: ${REACH_DOMAINS.join(', ')}`,
  );
  process.exit(1);
}

const rarityArg = flag('rarity');
const parsedRarity = rarityArg === undefined ? undefined : Number(rarityArg);
if (parsedRarity !== undefined && ![1, 2, 3, 4].includes(parsedRarity)) {
  console.error(`Unknown rarity '${rarityArg}'. One of: 1, 2, 3, 4`);
  process.exit(1);
}
const rarityTier = (parsedRarity as RarityTier | undefined) ?? live?.rarityTier ?? 1;

// ─── Draw ────────────────────────────────────────────────────────────

const hand = drawConsequenceHand({ templateId, reach, rarityTier });

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        templateId,
        reach,
        rarityTier,
        live: live !== undefined,
        handSize: consequenceHandSize(rarityTier),
        hand,
        effectKinds: Object.fromEntries(
          hand.map(family => [family, CONSEQUENCE_FAMILY_EFFECT_KINDS[family]]),
        ),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log('');
console.log('══════════════════════════════════════════════════════════════');
console.log('  The Consequence Draw');
console.log('══════════════════════════════════════════════════════════════');
console.log(`  template  ${templateId}${live ? '' : '  (not in the live catalog)'}`);
console.log(`  reach     ${reach}${reachArg ? '  (from --reach)' : ''}`);
console.log(`  rarity    ${rarityTier}${rarityArg ? '  (from --rarity)' : ''}`);
console.log(`  hand      ${hand.length} of ${consequenceHandSize(rarityTier)} drawn`);
if (rarityTier < CONSEQUENCE_FORMATIVE_MIN_TIER) {
  console.log(`            ('formative' is ineligible under rarity ${CONSEQUENCE_FORMATIVE_MIN_TIER})`);
}
console.log('');

for (const family of hand) {
  const weight = CONSEQUENCE_FAMILY_WEIGHTS[family][reach];
  console.log(`  ▸ ${family}   [weight ${weight} in ${reach}]`);
  console.log(`      wire one of: ${CONSEQUENCE_FAMILY_EFFECT_KINDS[family].join(', ')}`);
  if (family === 'place') console.log('      …with a location target (targetLocationId)');
  console.log('');
}

console.log('  Every drawn family must be wired in context. If one genuinely fights');
console.log('  the fiction, take the ONE recorded swap — `consequenceSwap: { from, to,');
console.log('  reason }` — and record the hand you were held to in `consequenceDraw`.');
console.log('══════════════════════════════════════════════════════════════');
console.log('');
