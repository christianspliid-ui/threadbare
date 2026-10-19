// Throwaway census for THR-1974 (design lane 2026-10-19). proto branch only — never merged.
// Measures, on main with the purse + crown + war aims + THR-1973 live:
//  1. each free company's income, fielded upkeep, and the price base the decision names
//     (30 days of max(income, upkeep)), next to today's affordableGift;
//  2. whether each company is a courting candidate of some realm (presence excludes armies);
//  3. a shadow wage ledger: if each realm that reaches a company had hired it at day 10 and
//     covered its unpaid upkeep every day, how low would the realm's purse go;
//  4. how many realms one hired company would tip into a Crown (2+ oaths).
import { initializeGameState, MAP_SIZE_PRESETS } from '../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../src/engine/cosmology';
import { generateArchetypes } from '../../src/engine/ascendant';
import { createSimulationRuntime } from '../../src/engine/simulationRuntime';
import { buildRealmProjection } from '../../src/engine/realmProjection';
import { buildCrownWorld } from '../../src/engine/crown/eligibility';
import { affordableGift } from '../../src/engine/crown/offer';
import { upkeepPerDayOf, upkeepOf } from '../../src/engine/factionPurse/upkeep';
import { readPurseDay } from '../../src/engine/factionPurse';
import { OATH_GIFT_DAYS } from '../../src/data/crown-constants';

const DAYS = 90;
const TPD = 12;
const HIRE_DAY = 10;
const seeds = [42, 99, 7];

function isMerc(p: Record<string, unknown>): boolean {
  const s = `${p.factionType ?? ''} ${p.factionDefId ?? ''}`.toLowerCase();
  return s.includes('mercenar');
}

for (const seed of seeds) {
  resetEventCounter();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  const runtime = createSimulationRuntime();
  let { state } = initializeGameState(archetype, 'hire', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const g = () => state.graph;
  const mercs = g().getNodesByType('actor').filter(n => n.properties.actorType === 'faction' && isMerc(n.properties as Record<string, unknown>)).map(n => n.id).sort();
  console.log(`\n=== seed ${seed}: ${mercs.length} free companies: ${mercs.join(', ')}`);

  // shadow ledger: realm → { company, shadowWealthDelta, minShadow, daysCovered, daysShort }
  const ledgers = new Map<string, { realm: string; company: string; spent: number; minShadow: number; short: number; covered: number; peakShare: number }>();
  const candidateDays = new Map<string, number>(); // company → days it was some realm's candidate
  const reachDays = new Map<string, number>();
  let crownTips = 0; let crownTipSamples = 0;

  for (let d = 1; d <= DAYS; d++) {
    for (let t = 0; t < TPD; t++) state = runTick(state, [], runtime);
    const proj = buildRealmProjection(g(), state.tiles);
    const world = buildCrownWorld(g(), state.tick, proj);
    for (const m of mercs) {
      if (!g().getNode(m)) continue;
      if ([...world.candidates.values()].some(c => c.includes(m))) candidateDays.set(m, (candidateDays.get(m) ?? 0) + 1);
      if ([...world.reach.values()].some(c => c.includes(m))) reachDays.set(m, (reachDays.get(m) ?? 0) + 1);
    }
    // Crown tip: realms holding exactly one oath that reach some company.
    if (d % 10 === 0) {
      for (const R of world.courtRealms) {
        const oaths = g().getIncomingEdges(R, 'sworn_to').length;
        if (oaths === 1 && (world.reach.get(R) ?? []).some(c => mercs.includes(c))) crownTips++;
        crownTipSamples++;
      }
    }
    if (d === HIRE_DAY) {
      // Each company is "hired" by the richest court realm that reaches it (the bidder most likely to win).
      for (const m of mercs) {
        const bidders = world.courtRealms.filter(R => (world.reach.get(R) ?? []).includes(m))
          .sort((a, b) => (world.fullIncome.get(b) ?? 0) - (world.fullIncome.get(a) ?? 0) || (a < b ? -1 : 1));
        const R = bidders[0];
        if (R) ledgers.set(m, { realm: R, company: m, spent: 0, minShadow: Infinity, short: 0, covered: 0, peakShare: 0 });
        console.log(`  hire@day${HIRE_DAY} ${m}: bidders=${bidders.length} → ${R ?? 'none'}`);
      }
    }
    if (d >= HIRE_DAY) {
      for (const L of ledgers.values()) {
        const company = g().getNode(L.company); const realm = g().getNode(L.realm);
        if (!company || !realm) continue;
        const day = readPurseDay(company);
        const unpaidIds = day?.armiesUnpaid ?? [];
        const shortfall = unpaidIds.reduce((s, id) => {
          const as = g().getNode(id)?.properties.armyState as { size?: string } | undefined;
          return s + upkeepOf(as?.size);
        }, 0);
        const realmWealth = Number(realm.properties.wealth ?? 0);
        const shadow = realmWealth - L.spent;
        if (shortfall > 0) {
          if (shadow >= shortfall) { L.spent += shortfall; L.covered++; } else { L.short++; }
        }
        L.minShadow = Math.min(L.minShadow, realmWealth - L.spent);
        const inc = world.fullIncome.get(L.realm) ?? 0;
        if (inc > 0) L.peakShare = Math.max(L.peakShare, shortfall / inc);
      }
    }
    if (d % 30 === 0 || d === 1) {
      for (const m of mercs) {
        const n = g().getNode(m);
        if (!n) { console.log(`  day ${d} ${m}: gone`); continue; }
        const inc = world.income.get(m) ?? 0;
        const up = upkeepPerDayOf(g(), m);
        const base = Math.max(inc, up > 0 ? up : upkeepOf('warband'));
        const sworn = g().getOutgoingEdges(m, 'sworn_to')[0];
        const realms = world.courtRealms.filter(R => (world.reach.get(R) ?? []).includes(m));
        const gifts = realms.map(R => affordableGift(world, m, R).toFixed(2));
        console.log(`  day ${d} ${m}: wealth=${Number(n.properties.wealth ?? 0).toFixed(1)} income=${inc.toFixed(2)} upkeep=${up.toFixed(1)} armies=${up > 0 ? 'yes' : 'no'} priceBase30d=${(OATH_GIFT_DAYS * base).toFixed(1)} todayGiftShare=[${gifts.join(',')}] reachedBy=${realms.length} presence=${world.presence.get(m)?.size ?? 0} sworn=${sworn ? `${sworn.target}(${sworn.properties.kind})` : 'no'}`);
      }
      const realmLine = world.courtRealms.map(R => `${R}: inc=${(world.fullIncome.get(R) ?? 0).toFixed(1)} w=${(world.wealth.get(R) ?? 0).toFixed(0)} ${world.means.get(R)} oaths=${g().getIncomingEdges(R, 'sworn_to').length}`).join(' | ');
      console.log(`  day ${d} realms: ${realmLine}`);
    }
  }
  for (const m of mercs) console.log(`  ${m}: candidate on ${candidateDays.get(m) ?? 0}/${DAYS} days, reached on ${reachDays.get(m) ?? 0}/${DAYS} days`);
  for (const L of ledgers.values()) {
    console.log(`  wages ${L.realm} ← ${L.company}: spent=${L.spent.toFixed(1)} over days ${HIRE_DAY}-${DAYS}; covered ${L.covered} days, could not cover ${L.short}; lowest shadow purse=${L.minShadow.toFixed(1)}; peak wage share of income=${(L.peakShare * 100).toFixed(0)}%`);
  }
  console.log(`  crown tip: ${crownTips}/${crownTipSamples} realm-samples hold exactly one oath and reach a company`);
}
