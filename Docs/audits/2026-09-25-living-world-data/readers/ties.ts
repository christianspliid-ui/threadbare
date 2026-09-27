// Reader (THR-1630 S1): the people web at t0, and whether seeded bonds reach ambitions.
// Read-only. One pass per seed, medium map, unattended (no player, no First).
// Usage: bundle with esbuild to .cache/ties.mjs, then: node .cache/ties.mjs [seeds=42,99] [ticks=200]
// Prints the S1 gate: co-resident tied pairs, mutual + origin stamps, favours, secrets,
// home-Realm memberships; then ms/tick t21..N, deciders at tN, and bond-scored re-evals.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { isAutonomousDecisionActor } from '../../../../src/engine/decisionTier';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import { LOCATION_CLASSES } from '../../../../src/data/world-objects';
import type { GameState } from '../../../../src/types/gameState';
import type { WorldGraph } from '../../../../src/engine/graph';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const SEEDED = new Set(['kin', 'friendship', 'rivalry']);
const SETTLEMENT = new Set<string>(LOCATION_CLASSES.settlement);

const settlementOf = (g: WorldGraph, actorId: string): string | undefined => {
  const at = g.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  const node = at ? g.getNode(at) : undefined;
  if (!node) return undefined;
  const parent = node.properties.parentLocationId;
  return typeof parent === 'string' ? parent : node.id;
};

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); clearTraces(); enableTracing();
  const pr = MAP_SIZE_PRESETS['medium'];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows) as { state: GameState };
  const g = state.graph;

  const heroes = g.getNodesByType('actor').filter(n => /^ind_\d+$/.test(n.id)).map(n => n.id).sort();
  const rel = g.getEdgesByType('relates_to').filter(e =>
    g.getNode(e.source)?.properties.actorType === 'individual' && g.getNode(e.target)?.properties.actorType === 'individual');
  const seeded = rel.filter(e => e.properties.origin === 'worldgen');
  const key = (a: string, b: string, basis: unknown) => `${a}|${b}|${String(basis)}`;
  const keys = new Set(seeded.map(e => key(e.source, e.target, e.properties.basis)));
  const mutual = seeded.filter(e => keys.has(key(e.target, e.source, e.properties.basis))).length;
  const pairs = new Set<string>();
  let coResidentPairs = 0;
  for (const e of seeded) {
    const p = [e.source, e.target].sort().join('|') + '|' + String(e.properties.basis);
    if (pairs.has(p)) continue;
    pairs.add(p);
    const sa = settlementOf(g, e.source); const sb = settlementOf(g, e.target);
    if (sa && sa === sb) coResidentPairs++;
  }
  const byBasis: Record<string, number> = {};
  for (const e of seeded) byBasis[String(e.properties.basis)] = (byBasis[String(e.properties.basis)] ?? 0) + 0.5;

  // The gate's tie count: each hero's seeded kin/friend/rival partners who live in a
  // settlement — the hero's own, or (for a hero living outside one) the nearest one.
  const isSettlement = (id: string | undefined) => !!id && SETTLEMENT.has(String(g.getNode(id)?.properties.locationSubtype ?? ''));
  let heroTies = 0; let heroesWithPool = 0;
  for (const h of heroes) {
    const home = settlementOf(g, h);
    const ties = g.getOutgoingEdges(h, 'relates_to')
      .filter(e => e.properties.origin === 'worldgen' && SEEDED.has(String(e.properties.basis)))
      .filter(e => { const s = settlementOf(g, e.target); return isSettlement(s) && (!isSettlement(home) || s === home); });
    if (ties.length > 0) heroesWithPool++;
    heroTies += ties.length;
  }

  const withMembership = heroes.filter(h => g.getOutgoingEdges(h, 'member_of').length > 0);
  const favorsOwed = g.getEdgesByType('owes_favor').length;
  const heroesOwing = withMembership.filter(h => g.getOutgoingEdges(h, 'owes_favor').length > 0).length;
  const secrets = g.getEdgesByType('knows_secret_of').length;

  // Home-Realm check: a hero standing in a settlement held by a Realm is a member of it.
  const realmIds = new Set(g.getNodesByType('actor').filter(n => n.properties.factionClass === 'realm').map(n => n.id));
  let homeHeld = 0; let homeMismatch = 0;
  for (const h of heroes) {
    const s = settlementOf(g, h);
    if (!s || !getLocationNodes(g).some(n => n.id === s)) continue;
    const holder = g.getIncomingEdges(s, 'controls').filter(e => realmIds.has(e.source)).sort((a, b) => (a.id < b.id ? -1 : 1))[0]?.source;
    const realmMembership = g.getOutgoingEdges(h, 'member_of').find(e => realmIds.has(e.target));
    if (!holder || !realmMembership) continue;
    homeHeld++;
    if (realmMembership.target !== holder) homeMismatch++;
  }

  console.log(`seed ${seed} t0: heroes ${heroes.length} · person relates_to ${rel.length} (seeded ${seeded.length}, mutual ${mutual})`
    + ` · seeded pairs ${pairs.size} by basis ${JSON.stringify(byBasis)} · co-resident pairs ${coResidentPairs}`
    + ` · hero ties to neighbours ${heroTies} over ${heroesWithPool} heroes with a pool (gate ≥ ${2 * heroesWithPool})`
    + ` · owes_favor ${favorsOwed} (heroes owing ${heroesOwing}/${withMembership.length}) · knows_secret_of ${secrets}`
    + ` · hostile_to ${g.getEdgesByType('hostile_to').length} · home-held heroes ${homeHeld}, off-home ${homeMismatch}`);

  // Run: ms/tick after warm-up, deciders at the end, re-evaluations that scored a seeded bond.
  let bondScored = 0; let bondScoredSeeded = 0; let totalMs = 0; let measured = 0;
  for (let t = 1; t <= TICKS; t++) {
    const t0 = performance.now();
    state = runTick(state);
    const dt = performance.now() - t0;
    if (t > 20) { totalMs += dt; measured++; }
    for (const tr of getTraces() as ReadonlyArray<Record<string, unknown>>) {
      if (typeof tr.bondsMatched === 'number' && tr.bondsMatched > 0) {
        bondScored++;
        const bases = tr.bondBases as string[] | undefined;
        if (bases?.some(b => SEEDED.has(b))) bondScoredSeeded++;
      }
    }
    clearTraces();
  }
  const deciders = state.graph.getNodesByType('actor').filter(n => isAutonomousDecisionActor(n)).length;
  console.log(`seed ${seed} t${TICKS}: ms/tick t21..${TICKS} ${(totalMs / Math.max(measured, 1)).toFixed(1)} · deciders ${deciders}`
    + ` · re-evals scoring a bond ${bondScored} (with a seeded basis ${bondScoredSeeded})`);
}
