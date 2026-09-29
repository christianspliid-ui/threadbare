/**
 * Step-cast census — THR-1670 (power runtime S2).
 *
 * Runs a seeded world headlessly and harvests every `UnifiedAction.stepCasts`
 * record the roll wrote: how often a caster who *could* reach for a spell on a
 * step did, and why they did not when they did not. The plan's two kill criteria
 * read straight off it:
 *
 *   - casters cast on nearly every step (cast share of eligible steps above
 *     1 / cooldown) → the threshold is too generous;
 *   - casters never cast (zero casts in the run) → the threshold sits below every
 *     step the world produces.
 *
 * Two arms per seed, because today's seeded knowing gives every caster a
 * fate-woven spell (Height Anchor — no caster carries a sphere alignment, so no
 * tradition shelf applies) and a fate-woven spell is never cast:
 *
 *   - `natural` — the world as seeded. Expected: no deliberate wielders, no records.
 *   - `stamped` — every seeded caster also wields the two shipped deliberate
 *     spells whose arenas fit a step (Pact of the Hollow Crown, encounter/Gold;
 *     Soulfire, fight). Edges only: reaches are not raised, so a caster short of a
 *     spell's floor declines on `prerequisite`, as they would in play. This is the
 *     arm the kill criteria read until the generator (THR-1572) fills the shelf.
 *
 * Usage:
 *   esbuild scripts/census-step-casts.ts --bundle --platform=node --format=esm \
 *     --outfile=.cache/census-step-casts.mjs --external:fs --external:path \
 *     && node .cache/census-step-casts.mjs [--seeds 42,99] [--ticks 150] [--map medium]
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { isCaster } from '../src/engine/casterIdentity';
import { getSpellTemplate, spellDefinitionNode, spellDefinitionNodeId } from '../src/data/spell-templates';
import type { GameState } from '../src/types/gameState';
import type { StepCastRecord } from '../src/types/unifiedAction';

const argv = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const seeds = (arg('--seeds') ?? '42').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 150);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

/** The shipped deliberate spells whose arena can fit a step. */
const STAMPED_SPELLS = ['spell_hollow_crown', 'spell_soulfire'] as const;

function stampCasters(state: GameState): number {
  const graph = state.graph;
  let stamped = 0;
  for (const id of STAMPED_SPELLS) {
    const nodeId = spellDefinitionNodeId(id);
    if (!graph.getNode(nodeId)) graph.addNode(spellDefinitionNode(getSpellTemplate(id)!));
  }
  const casters = graph.getNodesByType('actor').filter(n => isCaster(graph, n.id)).map(n => n.id).sort();
  for (const actorId of casters) {
    for (const id of STAMPED_SPELLS) {
      const nodeId = spellDefinitionNodeId(id);
      if (graph.getOutgoingEdges(actorId, 'has_trait').some(e => e.target === nodeId)) continue;
      graph.addEdge({
        id: `has_trait_${actorId}_${nodeId}`, source: actorId, target: nodeId, type: 'has_trait',
        properties: { level: 1, acquiredTick: 0, ticksRemaining: null, source: 'census', visibility: 'discoverable', modifiers: {} },
      });
    }
    stamped++;
  }
  return stamped;
}

interface Result {
  casters: number;
  records: number;
  casts: number;
  landed: number;
  fizzled: number;
  refused: number;
  declined: Map<string, number>;
  bySpell: Map<string, number>;
  castersWhoCast: Set<string>;
  ms: number;
}

function run(seed: number, arm: 'natural' | 'stamped'): Result {
  resetEventCounter();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'StepCastCensus', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const casters = arm === 'stamped' ? stampCasters(state) : 0;

  const seen = new Map<string, StepCastRecord>();
  const harvest = () => {
    for (const action of state.unifiedActions ?? []) {
      for (const [step, record] of Object.entries(action.stepCasts ?? {})) {
        seen.set(`${action.actionId}:${step}`, record);
      }
    }
  };
  const t0 = performance.now();
  for (let i = 0; i < ticks; i++) {
    state = runTick(state, [], runtime);
    harvest();
  }
  const ms = performance.now() - t0;

  const r: Result = {
    casters, records: seen.size, casts: 0, landed: 0, fizzled: 0, refused: 0,
    declined: new Map(), bySpell: new Map(), castersWhoCast: new Set(), ms,
  };
  for (const rec of seen.values()) {
    if (rec.decision === 'cast') {
      r.casts++;
      if (rec.refused) r.refused++;
      else if (rec.landed) r.landed++;
      else r.fizzled++;
      r.bySpell.set(rec.spellId ?? '?', (r.bySpell.get(rec.spellId ?? '?') ?? 0) + 1);
      r.castersWhoCast.add(rec.casterId);
    } else {
      const reason = rec.declinedReason ?? '?';
      r.declined.set(reason, (r.declined.get(reason) ?? 0) + 1);
    }
  }
  return r;
}

console.log(`\nstep-cast census — map ${map}, ${ticks} ticks, seeds ${seeds.join(',')}`);
for (const seed of seeds) {
  for (const arm of ['natural', 'stamped'] as const) {
    const r = run(seed, arm);
    const eligible = r.records - (r.declined.get('no_fitting_spell') ?? 0);
    const share = eligible > 0 ? r.casts / eligible : 0;
    console.log(`\n── seed ${seed} · ${arm} ── ${r.ms.toFixed(0)} ms`);
    if (arm === 'stamped') console.log(`  casters stamped:          ${r.casters}`);
    console.log(`  step-cast records:        ${r.records}  (eligible — a fitting spell was wielded: ${eligible})`);
    console.log(`  cast:                     ${r.casts}  (landed ${r.landed}, fizzled ${r.fizzled}, refused at resolution ${r.refused}) by ${r.castersWhoCast.size} casters`);
    console.log(`  cast share of eligible:   ${(share * 100).toFixed(1)}%`);
    console.log(`  declined by reason:       ${[...r.declined].sort().map(([k, v]) => `${k}×${v}`).join(', ') || '(none)'}`);
    console.log(`  casts by spell:           ${[...r.bySpell].sort().map(([k, v]) => `${k}×${v}`).join(', ') || '(none)'}`);
    for (const id of STAMPED_SPELLS) {
      const cd = getSpellTemplate(id)!.cooldownTicks;
      console.log(`  kill check vs 1/cooldown (${id}, ${cd}t): ${(100 / cd).toFixed(1)}%`);
    }
  }
}
