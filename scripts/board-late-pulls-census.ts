/**
 * Board late-pulls census — THR-2073 Done-when evidence (CLI / headless, THR-688 rule C).
 *
 * THR-2073 carried the scorer's late additive pulls onto the live board's context lean
 * (`BOARD_LATE_PULL_WEIGHT`). None of them fired on an uncast headless world, so this
 * census casts the god's steering verbs itself, every `CAST_EVERY` ticks on a rotating
 * set of mortals, writing exactly what each verb's handler writes:
 *   - Mark the Ground — `explorationAttraction += MARK_GROUND_ATTRACTION_STRENGTH` on the
 *     target's hex (`hexActionBridge` 'hex.mark_ground', applied by `phaseHexState`);
 *   - Draw Together — the `convergePull*` window on every mortal within
 *     `DRAW_TOGETHER_RADIUS_HEXES` of the anchor (`graphOpExecutor` draw_together). The
 *     census skips the verb's threaded-only filter: a headless world threads almost no one;
 *   - Whisper Intuition — `divineHunch` on the target's incoming thread edge
 *     (`hexActionBridge` 'hex.whisper_intuition'); a target with no thread edge gets a
 *     census-only one, so the hunch has somewhere to live.
 *
 * Tallied on the boards of the targeted mortals only. For each verb's term, on boards
 * where the term varies across the encounters, it counts how often the winner holds
 * the board's highest value of it, against the share of encounters that do (the
 * chance a winner would hold it by luck). Run once as shipped and once with
 * `BOARD_LATE_PULL_WEIGHT` set to 0 locally (the pre-THR-2073 board); the weight is
 * printed from the import. Kill line: the undertaking share of non-idle verdicts moves
 * by no more than 1 point between the arms.
 *
 * Usage:
 *   npm run census:board-late-pulls                         # seeds 42,99,7 × 240 ticks, medium
 *   npm run census:board-late-pulls -- --seeds 42 --ticks 120
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime, touchWorld } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { resolveAgentHex } from '../src/engine/relocationIntent';
import { hexDistance } from '../src/lib/hexMath';
import { isAgentGone } from '../src/engine/groups/groupQueries';
import {
  BOARD_LATE_PULL_WEIGHT,
  MARK_GROUND_ATTRACTION_STRENGTH,
  WHISPER_INTUITION_HUNCH_STRENGTH,
  WHISPER_INTUITION_DURATION_TICKS,
} from '../src/data/agent-behavior-constants';
import { DRAW_TOGETHER_DURATION_TICKS, DRAW_TOGETHER_RADIUS_HEXES } from '../src/data/group-constants';
import type { BoardContextTerm } from '../src/types/trace';
import type { GameState } from '../src/types';

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 240);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

/** Cast cadence and how many mortals each verb targets per cast. */
const CAST_EVERY = 10;
const TARGETS_PER_VERB = 4;

type Verb = 'mark' | 'draw' | 'whisper';
const VERB_TERM: Record<Verb, BoardContextTerm> = { mark: 'attraction', draw: 'convergence', whisper: 'hunch' };
const VERBS: readonly Verb[] = ['mark', 'draw', 'whisper'];

interface TopEntry {
  family?: string;
  contextTerms?: Partial<Record<BoardContextTerm, number>>;
}

let verdicts = 0;
let idle = 0;
let encounters = 0;
let undertakings = 0;
const mixed: Record<Verb, number> = { mark: 0, draw: 0, whisper: 0 };
const won: Record<Verb, number> = { mark: 0, draw: 0, whisper: 0 };
const share: Record<Verb, number> = { mark: 0, draw: 0, whisper: 0 };
const casts: Record<Verb, number> = { mark: 0, draw: 0, whisper: 0 };

const term = (e: TopEntry | undefined, k: BoardContextTerm) => e?.contextTerms?.[k] ?? 0;

/** Living, placed individuals, in id order (deterministic). */
function mortals(state: GameState): string[] {
  return state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' && !isAgentGone(n) && resolveAgentHex(state.graph, n.id))
    .map(n => n.id)
    .sort();
}

/** Cast the three verbs on disjoint rotating targets; returns verb → targeted ids with their expiry. */
function cast(state: GameState, round: number, targeted: Map<string, { verb: Verb; until: number }>): GameState {
  const ids = mortals(state);
  if (ids.length === 0) return state;
  const tick = state.tick;
  const pick = (slot: number) => ids[(round * TARGETS_PER_VERB * VERBS.length + slot) % ids.length];
  let tiles = state.tiles;
  const ascId = state.graph.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant')?.id ?? 'census_ascendant';

  VERBS.forEach((verb, v) => {
    for (let t = 0; t < TARGETS_PER_VERB; t++) {
      const id = pick(v * TARGETS_PER_VERB + t);
      const hex = resolveAgentHex(state.graph, id);
      if (!hex) continue;
      casts[verb]++;
      if (verb === 'mark') {
        tiles = tiles.map(tile => (tile.coord.col === hex.col && tile.coord.row === hex.row
          ? { ...tile, explorationAttraction: Math.min(1, (tile.explorationAttraction ?? 0) + MARK_GROUND_ATTRACTION_STRENGTH) }
          : tile));
        targeted.set(id, { verb, until: tick + CAST_EVERY });
      } else if (verb === 'draw') {
        const until = tick + DRAW_TOGETHER_DURATION_TICKS;
        for (const other of ids) {
          const oh = resolveAgentHex(state.graph, other);
          if (!oh || hexDistance(oh, hex) > DRAW_TOGETHER_RADIUS_HEXES || targeted.has(other)) continue;
          state.graph.updateNode(other, { properties: { convergePullHexCol: hex.col, convergePullHexRow: hex.row, convergePullUntilTick: until } });
          targeted.set(other, { verb, until });
        }
      } else {
        let edge = state.graph.getIncomingEdges(id, 'thread')[0];
        if (!edge) {
          state.graph.addEdge({ id: `census_thread_${id}`, type: 'thread', source: ascId, target: id, properties: { censusOnly: true } });
          edge = state.graph.getIncomingEdges(id, 'thread')[0];
        }
        if (!edge) continue;
        const until = tick + WHISPER_INTUITION_DURATION_TICKS;
        state.graph.updateEdge(edge.id, { properties: { divineHunch: { strength: WHISPER_INTUITION_HUNCH_STRENGTH, expiresAtTick: until } } });
        targeted.set(id, { verb, until });
      }
    }
  });
  return { ...state, tiles };
}

for (const seed of seeds) {
  resetEventCounter();
  resetReputationTraitInit();
  enableTracing();
  try {
    const runtime = createSimulationRuntime();
    const preset = MAP_SIZE_PRESETS[map];
    const archetype = generateArchetypes(4, seed)[0];
    let { state } = initializeGameState(archetype, 'BoardLatePulls', createBalancedCosmology(), seed, preset.cols, preset.rows);
    const targeted = new Map<string, { verb: Verb; until: number }>();
    for (let i = 0; i < ticks; i++) {
      if (i % CAST_EVERY === 0) {
        for (const [id, t] of targeted) if (t.until <= state.tick) targeted.delete(id);
        state = cast(state, i / CAST_EVERY, targeted);
        touchWorld(runtime);
      }
      clearTraces();
      state = runTick(state, [], runtime);
      for (const t of getTraces()) {
        const a = t as unknown as Record<string, unknown>;
        if (a.category !== 'decision_board_comparison') continue;
        const target = targeted.get(String(a.agentId));
        if (!target) continue;
        verdicts++;
        const fam = String(a.boardFamily);
        if (fam === 'idle') { idle++; continue; }
        if (fam !== 'encounter') { undertakings++; continue; }
        encounters++;
        const top = (a.boardTop as TopEntry[] | undefined) ?? [];
        const encs = top.filter(e => e.family === 'encounter');
        const winner = top[0];
        for (const verb of VERBS) {
          const k = VERB_TERM[verb];
          const values = encs.map(e => term(e, k));
          const max = Math.max(...values);
          if (!(max > 0) || values.every(v => v === max)) continue;
          mixed[verb]++;
          share[verb] += values.filter(v => v === max).length / values.length;
          if (term(winner, k) === max) won[verb]++;
        }
      }
    }
  } finally {
    disableTracing();
  }
}

const pct = (n: number, d: number) => (d > 0 ? `${(100 * n / d).toFixed(1)}%` : 'n/a');

console.log(`BOARD_LATE_PULL_WEIGHT=${BOARD_LATE_PULL_WEIGHT} · seeds ${seeds.join(',')} × ${ticks} ticks · ${map} · cast every ${CAST_EVERY} × ${TARGETS_PER_VERB}/verb (pooled, targeted mortals only)`);
console.log(`casts mark=${casts.mark} draw=${casts.draw} whisper=${casts.whisper}`);
console.log(`verdicts=${verdicts} idle=${idle} encounter=${encounters} undertaking=${undertakings} undertakingShareNonIdle=${pct(undertakings, encounters + undertakings)}`);
for (const verb of VERBS) {
  console.log(`${verb.padEnd(8)} (${VERB_TERM[verb].padEnd(11)}) mixed boards ${String(mixed[verb]).padStart(5)} · winner holds the top pull ${pct(won[verb], mixed[verb]).padStart(6)} vs board share ${pct(share[verb], mixed[verb]).padStart(6)}`);
}
