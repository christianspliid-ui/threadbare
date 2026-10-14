/**
 * check:god-card-progression (THR-1811) — every god card carries a valid `progression`
 * block that agrees with the beats that grant it. Logic: `src/engine/godCardProgressionCheck.ts`.
 *
 *   npm run check:god-card-progression
 *
 * Exits 1 on any failure; prints sphere × tier holes as warnings.
 */
import { checkGodCardProgression } from '../src/engine/godCardProgressionCheck';
import { godCards } from '../src/engine/godProgression';
import { ASCENDANT_SPINE } from '../src/data/ascendant-beat-content';
import { ASCENDANT_MILESTONE_BEATS } from '../src/data/ascendant-milestone-beats';
import { REACH_SIGNATURE_ID_BY_REACH } from '../src/data/reach-signature-content';

const report = checkGodCardProgression(godCards(), {
  spine: new Set(ASCENDANT_SPINE.flatMap(b => b.grantsActionIds ?? [])),
  milestone: new Set(ASCENDANT_MILESTONE_BEATS.flatMap(b => b.grantsActionIds ?? [])),
  signature: new Set(Object.values(REACH_SIGNATURE_ID_BY_REACH).filter((v): v is string => !!v)),
});

const c = report.counts;
console.log(`check-god-card-progression: ${report.cardCount} god cards — ${c.market} market / ${c.gift} gift / ${c.generic} generic; tiers ${c.byTier[1]} / ${c.byTier[2]} / ${c.byTier[3]} / ${c.byTier[4]}; gifts ${JSON.stringify(c.byGiftBy)}`);
for (const [flag, ids] of Object.entries(report.flags)) console.log(`  flag ${flag}: ${ids.length}`);
for (const w of report.warnings) console.log(`  warn: ${w}`);
if (report.failures.length > 0) {
  for (const f of report.failures) console.error(`  FAIL: ${f}`);
  console.error(`check-god-card-progression: FAIL — ${report.failures.length} problem(s).`);
  process.exit(1);
}
console.log('check-god-card-progression: OK');
