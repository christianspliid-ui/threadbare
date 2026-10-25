/**
 * The four diversity measures (THR-1866, THR-1923 plan § Done when).
 *
 * Shared by the debug bridge (`getSettlementDiversity`) and the heavy test, so both judge
 * the same thing:
 *
 * 1. **Sizes stay spread** — the population CV does not drop by more than
 *    `DIVERSITY_SIZE_CV_TOLERANCE` from day 1 to day 100.
 * 2. **Building mixes differ** — more than `DIVERSITY_DISTINCT_PAIR_MIN` of same-tier pairs
 *    share less than half their buildings (Jaccard < 0.5).
 * 3. **Traits many and rare** — distinct trait sets ≥ `DIVERSITY_COMBOS_MIN_SHARE` of the
 *    settlements, and no single trait on more than `DIVERSITY_TOP_TRAIT_MAX` of them.
 * 4. **No convergence** — from day 50 to day 150 the CV, the distinct-pair share and the
 *    combination count do not fall past their tolerances.
 *
 * The economic traits are read from state directly (the buildings standing, the land's
 * food per worked hex, the routes at a market, the happiness term) rather than from the
 * `has_trait` edges, so a world that never ran the trait phase — the settling run, a
 * headless probe — measures the same.
 *
 * Pure (NFP #3).
 */
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import {
  BREADBASKET_ENTER,
  MARKET_TOWN_ENTER,
  DIVERSITY_SIZE_CV_TOLERANCE,
  DIVERSITY_DISTINCT_PAIR_MIN,
  DIVERSITY_TOP_TRAIT_MAX,
  DIVERSITY_COMBOS_MIN_SHARE,
  DIVERSITY_DISTINCT_DRIFT_TOLERANCE,
  DIVERSITY_COMBOS_DRIFT_TOLERANCE,
} from '../../data/settlement-economy-constants';
import { getEconomySettlements } from './land';
import { readBuildings, isIdle } from './building';
import { readSurplusRoutes } from './surplusRoutes';

/** The happiness at or below which the prototype counted a settlement Restless. */
const RESTLESS_HAPPINESS = -2;

export interface DiversitySnapshot {
  readonly day: number;
  readonly settlements: number;
  readonly sizeCv: number;
  readonly tiers: Readonly<Record<string, number>>;
  /** Share of same-tier pairs sharing less than half their buildings. */
  readonly distinctShare: number;
  readonly pairs: number;
  readonly combos: number;
  readonly topTrait: string | null;
  readonly topTraitShare: number;
  readonly routes: number;
  readonly population: number;
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** The economic traits a settlement qualifies for today, by short id. */
export function economicTraitsOf(graph: WorldGraph, node: GraphNode, routeCount?: number): Set<string> {
  const out = new Set<string>();
  const buildings = readBuildings(graph, node.id).filter(b => !isIdle(b));
  for (const b of buildings) if (b.def.trait) out.add(b.def.trait.slice(b.def.trait.lastIndexOf('.') + 1));
  const worked = Math.max(1, num(node.properties.workedHexes));
  if (num(node.properties.landFood) / worked >= BREADBASKET_ENTER) out.add('breadbasket');
  const routes = routeCount ?? readSurplusRoutes(graph).filter(r => r.source === node.id || r.target === node.id).length;
  if (buildings.some(b => b.def.id === 'market') && routes >= MARKET_TOWN_ENTER) out.add('market_town');
  if (typeof node.properties.economyHappiness === 'number' && node.properties.economyHappiness <= RESTLESS_HAPPINESS) out.add('restless');
  return out;
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / union.size;
}

/** One snapshot of the four measures' inputs. */
export function measureDiversity(graph: WorldGraph, day: number): DiversitySnapshot {
  const settlements = getEconomySettlements(graph);
  const routes = readSurplusRoutes(graph);
  const touching = new Map<string, number>();
  for (const r of routes) {
    touching.set(r.source, (touching.get(r.source) ?? 0) + 1);
    touching.set(r.target, (touching.get(r.target) ?? 0) + 1);
  }
  const rows = settlements.map(s => ({
    id: s.id,
    pop: Math.max(1, num(s.properties.population)),
    tier: typeof s.properties.targetTier === 'string' ? s.properties.targetTier : String(s.properties.locationSubtype),
    buildings: new Set(readBuildings(graph, s.id).map(b => b.def.id)),
    traits: economicTraitsOf(graph, s, touching.get(s.id) ?? 0),
  }));
  const n = rows.length;
  const pops = rows.map(r => r.pop);
  const mean = n > 0 ? pops.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n > 0 ? Math.sqrt(pops.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : 0;
  const tiers: Record<string, number> = {};
  for (const r of rows) tiers[r.tier] = (tiers[r.tier] ?? 0) + 1;
  let pairs = 0;
  let distinct = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rows[i].tier !== rows[j].tier) continue;
      pairs++;
      if (jaccard(rows[i].buildings, rows[j].buildings) < 0.5) distinct++;
    }
  }
  const combos = new Set(rows.map(r => [...r.traits].sort().join('+'))).size;
  const count = new Map<string, number>();
  for (const r of rows) for (const t of r.traits) count.set(t, (count.get(t) ?? 0) + 1);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  return {
    day,
    settlements: n,
    sizeCv: mean > 0 ? sd / mean : 0,
    tiers,
    distinctShare: pairs > 0 ? distinct / pairs : 1,
    pairs,
    combos,
    topTrait: top ? top[0] : null,
    topTraitShare: top && n > 0 ? top[1] / n : 0,
    routes: routes.length,
    population: pops.reduce((a, b) => a + b, 0),
  };
}

export type MeasureVerdict = 'PASS' | 'FAIL' | 'PENDING';

export interface DiversityVerdict {
  readonly sizesSpread: MeasureVerdict;
  readonly buildingMixesDistinct: MeasureVerdict;
  readonly traitsManyAndRare: MeasureVerdict;
  readonly noConvergence: MeasureVerdict;
  readonly allPass: boolean;
}

/**
 * Judge the four measures from snapshots at day 1, 50, 100 and now (day ≥ 150 for
 * measure 4). A measure whose snapshots are missing reads PENDING.
 */
export function judgeDiversity(
  snapshots: { day1?: DiversitySnapshot; day50?: DiversitySnapshot; day100?: DiversitySnapshot; now: DiversitySnapshot },
): DiversityVerdict {
  const { day1, day50, day100, now } = snapshots;
  const sizesSpread: MeasureVerdict = day1 && day100
    ? (day100.sizeCv >= day1.sizeCv - DIVERSITY_SIZE_CV_TOLERANCE ? 'PASS' : 'FAIL')
    : 'PENDING';
  const buildingMixesDistinct: MeasureVerdict = now.distinctShare > DIVERSITY_DISTINCT_PAIR_MIN ? 'PASS' : 'FAIL';
  const traitsManyAndRare: MeasureVerdict =
    now.combos >= now.settlements * DIVERSITY_COMBOS_MIN_SHARE && now.topTraitShare < DIVERSITY_TOP_TRAIT_MAX ? 'PASS' : 'FAIL';
  const noConvergence: MeasureVerdict = day50 && now.day >= 150
    ? (now.sizeCv >= day50.sizeCv - DIVERSITY_SIZE_CV_TOLERANCE
      && now.distinctShare >= day50.distinctShare - DIVERSITY_DISTINCT_DRIFT_TOLERANCE
      && now.combos >= day50.combos - DIVERSITY_COMBOS_DRIFT_TOLERANCE ? 'PASS' : 'FAIL')
    : 'PENDING';
  return {
    sizesSpread,
    buildingMixesDistinct,
    traitsManyAndRare,
    noConvergence,
    allPass: [sizesSpread, buildingMixesDistinct, traitsManyAndRare, noConvergence].every(v => v === 'PASS'),
  };
}
