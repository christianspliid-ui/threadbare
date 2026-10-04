// Census reader (THR-1672): the substrate for spells as divine gifts and found tomes.
// Read-only; one world per seed, medium map, unattended (no player, no First), default scenario.
//
// Usage:
//   npx esbuild Docs/audits/2026-09-25-living-world-data/readers/spell-gifts-tomes.ts --bundle --platform=node \
//     --format=esm --outfile=.cache/spell-gifts-tomes.mjs --external:fs --external:path
//   node .cache/spell-gifts-tomes.mjs [seeds=42,99,7] [ticks=150] [out.json]
//
// A. Generated items in the world at the final tick: by origin, by subcategory/slot, and for
//    tomes, whether the holder / maker is a caster and how many spells they know.
// B. Spell holding: casters, knows_spell / wielded counts, how many mortals have a free spell slot.
// C. The ascendant node's sphere-bearing properties (what a god's teaching could key on).
// D. (THR-1672 re-run) Tick-0 divine pool coverage — the share of individuals a god could
//    teach something — and the kill-criteria reads: most spells known by one mortal, and
//    the share of individuals who know a spell from a book.
import * as fs from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { isCaster } from '../../../../src/engine/casterIdentity';
import { SLOT_CAPS } from '../../../../src/data/attachment-slot-constants';
import type { GameState } from '../../../../src/types/gameState';
import { pickDivineSpell } from '../../../../src/engine/spellGrant';

const seeds = (process.argv[2] ?? '42,99,7').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 150);
const OUT_PATH = process.argv[4];

type P = Record<string, unknown>;
const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const out: P = { ticks: TICKS, map: 'medium', scenario: 'default' };

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const rt = createSimulationRuntime();
  const pr = MAP_SIZE_PRESETS.medium;
  let { state } = initializeGameState(
    generateArchetypes(4, seed)[0], 'C', createBalancedCosmology(), seed, pr.cols, pr.rows,
  ) as { state: GameState };
  // D. tick-0 divine pool coverage (before any tick runs).
  const g0 = state.graph;
  const ascId = state.ascendantId;
  const ind0 = g0.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
  const teachable0 = ind0.filter(a => pickDivineSpell(g0, ascId, a.id, Number(state.seed ?? seed)) !== null).length;
  for (let i = 0; i < TICKS; i++) state = runTick(state, [], rt);
  const g = state.graph;

  const actors = g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
  const spellsKnown = (id: string) => g.getOutgoingEdges(id, 'knows_spell').length;
  const spellsWielded = (id: string) => g.getOutgoingEdges(id, 'has_trait')
    .filter(e => g.getNode(e.target)?.properties.subcategory === 'spell').length;

  // A. generated items
  const byOrigin: Record<string, number> = {};
  const bySub: Record<string, number> = {};
  const tomes: P[] = [];
  for (const n of g.getNodesByType('artifact')) {
    if (n.properties.origin !== 'generated') continue;
    const gen = (n.properties.generated ?? {}) as P;
    inc(byOrigin, String(gen.origin ?? n.properties.source ?? '?'));
    const sub = String(n.properties.subcategory ?? gen.subcategory ?? gen.slot ?? '?');
    inc(bySub, sub);
    const holder = g.getIncomingEdges(n.id, 'possesses')[0]?.source;
    const tags = (n.properties.tags ?? []) as string[];
    if (sub.includes('tome') || tags.includes('#tome')) {
      tomes.push({
        id: n.id, name: n.name, holder, maker: n.properties.makerId ?? n.properties.craftedBy,
        holderIsCaster: holder ? isCaster(g, holder) : null,
        holderKnows: holder ? spellsKnown(holder) : null,
      });
    }
  }

  // B. spell holding
  const casters = actors.filter(a => isCaster(g, a.id));
  const knowers = actors.filter(a => spellsKnown(a.id) > 0);
  const nonCasterKnowers = knowers.filter(a => !isCaster(g, a.id)).length;
  const fullSlots = actors.filter(a => spellsWielded(a.id) >= (SLOT_CAPS.spell ?? 3)).length;
  const wieldHist: Record<string, number> = {};
  for (const a of knowers) inc(wieldHist, String(spellsWielded(a.id)));
  const knowsSources: Record<string, number> = {};
  for (const a of knowers) for (const e of g.getOutgoingEdges(a.id, 'knows_spell')) inc(knowsSources, String(e.properties.source ?? '?'));

  // C. ascendant node
  const asc = g.getNodesByType('ascendant')[0] ?? g.getNodesByType('actor').find(n => n.properties.actorType === 'ascendant');
  const ascSphereProps: P = {};
  if (asc) for (const [k, v] of Object.entries(asc.properties)) if (/sphere|domain|reach/i.test(k)) ascSphereProps[k] = v;

  out[String(seed)] = {
    individuals: actors.length,
    generatedItems: { byOrigin, bySub, tomes: tomes.length, tomeSample: tomes.slice(0, 6) },
    spells: {
      casters: casters.length, knowers: knowers.length, nonCasterKnowers, fullSlots, wieldHist, knowsSources,
      casterRoles: casters.reduce((m, a) => { inc(m, String(a.properties.npcRole ?? '?')); return m; }, {} as Record<string, number>),
    },
    ascendant: asc ? { id: asc.id, type: asc.type, props: ascSphereProps } : null,
    thr1672: {
      divinePoolCoverageTick0: ind0.length > 0 ? Number((teachable0 / ind0.length).toFixed(3)) : 0,
      maxKnownByOneMortal: Math.max(0, ...actors.map(a => spellsKnown(a.id))),
      tomeTaughtKnowerShare: actors.length > 0
        ? Number((actors.filter(a => g.getOutgoingEdges(a.id, 'knows_spell').some(e => e.properties.source === 'tome')).length / actors.length).toFixed(3))
        : 0,
      nonCasterTomeKnowers: actors.filter(a => !isCaster(g, a.id) && g.getOutgoingEdges(a.id, 'knows_spell').some(e => e.properties.source === 'tome')).length,
    },
  };
  console.log(seed, JSON.stringify(out[String(seed)]));
}
if (OUT_PATH) fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
