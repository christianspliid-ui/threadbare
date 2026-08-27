/**
 * Binder three-mode evidence (THR-1296 § Done when, § Kill criteria).
 *
 * Answers the plan's degenerate-board kill criterion — *"one mode wins everywhere
 * regardless of scarcity"* — against **real generated worlds** rather than fixtures,
 * because a fixture that produces three modes proves only that the fixture was built
 * to produce three modes.
 *
 * ## Why a harness and not a live-run trace read
 *
 * The Done-when asks for `binding_decision` traces off a 150-tick run. The bind pass
 * fires only for templates that declare `cast`, and **no shipped template declares
 * one** — those rows are doc 2's content (THR-1297), and this plan deliberately ships
 * the seam unauthored so doc 2's first row fails an emptiness test on purpose. So a
 * live run at this slice emits zero decisions, and reading zero traces would be the
 * vacuous-probe shape: an empty population passing every assertion.
 *
 * This harness instead drives the *real* `resolveBinding` over the *real* world the
 * simulation built — real agents, real roles, real distances, real bonds.
 *
 * ## Conditioning on a choice, and why the unconditioned number lies
 *
 * A probe at a stage with nobody of that role within the horizon has only the mint
 * row on its board. Mint winning there is the board being **right**, not degenerate —
 * so an unconditioned "mint won 94% of probes" mostly measures how empty the map is
 * between settlements, and would fail a perfectly healthy board on any sparse world.
 * `rowsConsidered > 1` (read off the decision's own trace) marks the probes where a
 * real candidate was actually on the board, and the verdict conditions on those. That
 * is the difference between measuring the population and measuring the weights.
 *
 * Re-run this when the five weights are retuned. Live-run trace evidence lands with
 * the first authored cast row.
 *
 *   npx tsx scripts/measure-binder-modes.ts          (defaults: seeds 42,99 · 150 ticks)
 *   npx tsx scripts/measure-binder-modes.ts 42 30    (one seed, 30 ticks)
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit.ts';
import { runTick, resetEventCounter } from '../src/engine/orchestrator.ts';
import { createSimulationRuntime } from '../src/engine/simulationRuntime.ts';
import { generateArchetypes } from '../src/engine/ascendant.ts';
import { createBalancedCosmology } from '../src/engine/cosmology.ts';
import { buildRoleCensus, scarcity01, roleCount } from '../src/engine/binding/roleCensus.ts';
import { resolveBinding } from '../src/engine/binding/binder.ts';
import { clearTraces, enableTracing, getTraces } from '../src/engine/traceBuffer.ts';
import type { GameState } from '../src/types/gameState.ts';

const SEEDS = process.argv[2] ? [Number(process.argv[2])] : [42, 99];
const TICKS = process.argv[3] ? Number(process.argv[3]) : 150;
const STAGE_SAMPLES = 40;
const TAB = '\t';

function buildWorld(seed: number, ticks: number): GameState {
  resetEventCounter();
  clearTraces();
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS['medium'];
  const { state } = initializeGameState(
    archetype, 'BinderProbe', createBalancedCosmology(), seed, preset.cols, preset.rows,
  );
  let s = state;
  for (let t = 0; t < ticks; t++) s = runTick(s, [], runtime);
  return s;
}

interface Row {
  seed: number;
  role: string;
  holders: number;
  scarcity: number;
  reuse: number;
  modify: number;
  mint: number;
  refused: number;
  /** Probes where a real candidate was on the board — the only ones that are a choice. */
  contested: number;
  /** Of those, how many the mint row still won. */
  contestedMint: number;
}

function measure(seed: number): Row[] {
  const state = buildWorld(seed, TICKS);
  enableTracing();
  const graph = state.graph;
  const census = buildRoleCensus(graph);

  const actors = graph
    .getNodesByType('actor')
    .filter(n => n.properties?.actorType === 'individual');
  const places = graph
    .getNodesByType('location')
    .filter(n => n.properties?.hexCol !== undefined);

  // Every role the world actually holds, so the sweep covers the MEASURED range
  // rather than a hand-picked pair that could be chosen to produce the answer.
  const roles = [...new Set(
    actors.map(a => a.properties?.npcRole as string | undefined).filter(Boolean) as string[],
  )].sort();

  const stride = Math.max(1, Math.floor(places.length / STAGE_SAMPLES));
  const stages = places.filter((_, i) => i % stride === 0);

  const rows: Row[] = [];

  for (const role of roles) {
    const tally = { reuse: 0, modify: 0, mint: 0, refused: 0 };
    let contested = 0;
    let contestedMint = 0;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const actor = actors[(i * 7) % actors.length];
      if (!actor) continue;

      clearTraces();
      const decision = resolveBinding(
        {
          projectId: `probe_${seed}_${role}_${stage.id}`,
          castKey: '$slot',
          stepIndex: 0,
          actorId: actor.id,
          acceptedRoles: [role],
          mintRole: role,
          stageNodeId: stage.id,
        },
        { graph, census, tick: state.tick, mintAvailable: true },
      );
      tally[decision.mode] += 1;

      const trace = getTraces().find(t => t.category === 'binding_decision') as
        { rowsConsidered?: number } | undefined;
      if ((trace?.rowsConsidered ?? 1) > 1) {
        contested++;
        if (decision.mode === 'mint') contestedMint++;
      }
    }

    rows.push({
      seed,
      role,
      holders: roleCount(census, role),
      scarcity: scarcity01(census, role),
      ...tally,
      contested,
      contestedMint,
    });
  }

  return rows;
}

const all: Row[] = [];
for (const seed of SEEDS) {
  process.stderr.write(`measuring seed ${seed} at ${TICKS} ticks…\n`);
  all.push(...measure(seed));
}

const HEADERS = [
  'seed', 'role', 'holders', 'scarcity', 'reuse', 'modify', 'mint', 'refused',
  'contested', 'contestedMint',
];
console.log(HEADERS.join(TAB));
for (const r of all) {
  console.log([
    r.seed, r.role, r.holders, r.scarcity.toFixed(3),
    r.reuse, r.modify, r.mint, r.refused, r.contested, r.contestedMint,
  ].join(TAB));
}

// ── Verdicts against the plan's kill criteria ──
const total = all.reduce(
  (a, r) => ({
    reuse: a.reuse + r.reuse, modify: a.modify + r.modify,
    mint: a.mint + r.mint, refused: a.refused + r.refused,
  }),
  { reuse: 0, modify: 0, mint: 0, refused: 0 },
);

const scarce = all.filter(r => r.scarcity >= 0.5);
const commodity = all.filter(r => r.scarcity < 0.5);
const share = (rs: Row[], k: 'reuse' | 'modify' | 'mint'): number => {
  const d = rs.reduce((a, r) => a + r.reuse + r.modify + r.mint, 0);
  return d === 0 ? 0 : rs.reduce((a, r) => a + r[k], 0) / d;
};
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;

const contested = all.reduce((a, r) => a + r.contested, 0);
const contestedMint = all.reduce((a, r) => a + r.contestedMint, 0);
const contestedMintShare = contested === 0 ? 0 : contestedMint / contested;

console.log('');
console.log(
  `totals${TAB}reuse=${total.reuse}${TAB}modify=${total.modify}` +
  `${TAB}mint=${total.mint}${TAB}refused=${total.refused}`,
);
console.log(
  `scarce roles    (scarcity>=0.5, n=${scarce.length}):  ` +
  `reuse=${pct(share(scarce, 'reuse'))}  modify=${pct(share(scarce, 'modify'))}  ` +
  `mint=${pct(share(scarce, 'mint'))}`,
);
console.log(
  `commodity roles (scarcity<0.5,  n=${commodity.length}): ` +
  `reuse=${pct(share(commodity, 'reuse'))}  modify=${pct(share(commodity, 'modify'))}  ` +
  `mint=${pct(share(commodity, 'mint'))}`,
);
console.log(
  `contested probes (a real candidate was on the board): ${contested} ` +
  `— mint still won ${pct(contestedMintShare)}`,
);

const allThree = total.reuse > 0 && total.modify > 0 && total.mint > 0;
const steers = share(scarce, 'reuse') > share(commodity, 'reuse')
  && share(commodity, 'mint') > share(scarce, 'mint');

console.log('');
console.log(`three-modes-occur: ${allThree ? 'PASS' : 'FAIL'}`);
console.log(`scarcity-steers:   ${steers ? 'PASS' : 'FAIL'}  (scarce→reuse, commodity→mint)`);
console.log(
  `not-degenerate:    ${contested > 0 && contestedMintShare < 0.9 ? 'PASS' : 'FAIL'}  ` +
  `(mint won ${pct(contestedMintShare)} of the ${contested} probes where a real candidate ` +
  `was on the board; uncontested probes are excluded because minting into an empty ` +
  `neighbourhood is the board being right, not degenerate)`,
);
