// @vitest-lane heavy — builds a small seeded world and drives the real elder-essence grant sites into the repertoire (THR-1753)
/**
 * Foundation discovery in a seeded run. THR-1753.
 *
 * Point-buy covers Creation spheres only (THR-1749), so the six Foundation-signed
 * card types — gambit, stumble, favor, whisper, veil, undertow — reach a god only
 * by *finding* elder magic (rulebook §5). This pins that each of the six has a
 * reachable grant path in a seeded world, through the code the game runs:
 *
 *   ruin transformation (`transformRuinConsequence`, a real ruin of the seeded map)
 *     → its patch carries `foundationSpheresFound`
 *     → `buildRepertoire` opens the found spheres at the secondary tier.
 *
 * And the negative the review gate caught: ordinary income pays every sphere a
 * 4% floor (`distributeBySpherePoints`), so a long ordinary run *earns* Foundation
 * essence without ever touching a ruin. That must find nothing.
 */

import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { computeElderEssenceReward, recordFoundationFinds } from '../elderEssenceReward';
import { transformRuinConsequence } from '../ruins/ruinTransformation';
import { buildRepertoire } from '../nudgeCardRepertoire';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';

const SEED = 42;
const TIMEOUT_MS = 120_000;

/** Written out, not read from `SPHERE_SIGNATURES`, so the test is not the table. */
const FOUNDATION_SIGNED = ['gambit', 'stumble', 'favor', 'whisper', 'veil', 'undertow'];
/** A god as Remembrance's point-buy now makes them: Creation spheres only. */
const CREATION_GOD = { primary: 'mind', secondary: 'life' } as const;

function seededWorld(ticks: number): GameState {
  resetEventCounter();
  resetDecisionCache();
  resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, SEED)[0];
  let { state } = initializeGameState(archetype, 'Discovery', createBalancedCosmology(), SEED, preset.cols, preset.rows);
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  return state;
}

function foundTypes(state: Pick<GameState, 'foundationSpheresFound'>): Set<string> {
  return new Set(
    buildRepertoire({ ...CREATION_GOD, discovered: state.foundationSpheresFound })
      .filter((e) => e.source === 'discovery')
      .map((e) => e.member.typeId),
  );
}

function firstElderRuin(state: GameState): string {
  const ruin = state.graph
    .getNodesByType('location')
    .find((n) => n.properties.locationSubtype === 'elder_ruin' || n.properties.locationType === 'elder_ruin');
  expect(ruin, 'the seeded world has no elder ruin to transform').toBeDefined();
  return ruin!.id;
}

describe('Foundation discovery in a seeded run (THR-1753)', () => {
  it('an ordinary run earns Foundation essence through income but finds nothing', () => {
    // Drain the pool below the cap so income actually lands (pools start at the
    // cap and clamp), then run long enough for the 4% floor to pass the 1-essence
    // find threshold many times over. The ledger rises; the find record does not.
    let state = seededWorld(0);
    for (const s of Object.keys(state.essencePool) as (keyof GameState['essencePool'])[]) {
      state.essencePool[s] = 1;
    }
    const runtime = createSimulationRuntime();
    for (let i = 0; i < 60; i++) state = runTick(state, [], runtime);

    const earnedFoundation =
      (state.essenceEarnedBySphere?.chaos ?? 0) + (state.essenceEarnedBySphere?.darkness ?? 0);
    expect(earnedFoundation, 'income never reached a Foundation sphere — the negative proves nothing').toBeGreaterThan(1);
    expect(state.foundationSpheresFound ?? []).toEqual([]);
    expect(foundTypes(state).size).toBe(0);
  }, TIMEOUT_MS);

  it('transforming a real ruin of the seeded map finds all four spheres and opens all six types', () => {
    const state = seededWorld(3);
    const ruinId = firstElderRuin(state);
    enableTracing();
    clearTraces();
    const result = transformRuinConsequence(state, {
      ruinId,
      delveId: 'delve.test',
      agentId: 'agent.none',
      emergenceChoice: 'let',
      consequenceRoll: 'transformed',
      ruinMagnitude: 0.5,
      sphereAlignment: 'spirit',
      actingGodId: '',
    });
    expect(result.failed).toBeUndefined();
    expect(result.patch.foundationSpheresFound).toEqual(['chaos', 'order', 'light', 'darkness']);

    const found = foundTypes(result.patch);
    for (const t of FOUNDATION_SIGNED) expect(found.has(t), t).toBe(true);

    const finds = getTraces().filter((t) => t.category === 'ruins.foundation_sphere_found');
    expect(finds.map((t) => (t as unknown as { sphere: string }).sphere)).toEqual([
      'chaos',
      'order',
      'light',
      'darkness',
    ]);
  }, TIMEOUT_MS);

  it('a consumed ruin of a Creation sphere finds nothing; of a Foundation sphere, only that one', () => {
    const state = seededWorld(3);
    const ruinId = firstElderRuin(state);
    const consume = (sphereAlignment: string) =>
      transformRuinConsequence(state, {
        ruinId,
        delveId: 'delve.test',
        agentId: 'agent.none',
        emergenceChoice: 'let',
        consequenceRoll: 'catastrophic', // the smallest award: a quarter, into one sphere
        ruinMagnitude: 0.5,
        sphereAlignment,
        actingGodId: '',
      });

    expect(consume('spirit').patch.foundationSpheresFound).toBeUndefined();

    const dark = consume('darkness').patch;
    expect(dark.foundationSpheresFound).toEqual(['darkness']);
    const found = foundTypes(dark);
    expect(found.has('veil')).toBe(true);
    expect(found.has('undertow')).toBe(true);
    expect(found.has('gambit')).toBe(false);
  }, TIMEOUT_MS);

  it('an elder hidden-site reveal finds all four; a non-elder one finds nothing', () => {
    const state = seededWorld(3);
    const site = { sublocationId: 's', sublocationName: 'Vault', hexCol: 0, hexRow: 0 };
    const elder = computeElderEssenceReward({ ...site, hasElderMagic: true }, state.tick);
    const plain = computeElderEssenceReward({ ...site, hasElderMagic: false }, state.tick);
    expect(recordFoundationFinds(undefined, plain.deltas, state.tick, 'hidden_site_reveal')).toBeUndefined();
    const found = recordFoundationFinds(undefined, elder.deltas, state.tick, 'hidden_site_reveal');
    expect(found).toEqual(['chaos', 'order', 'light', 'darkness']);
    // A second find of the same spheres is the same record, not a longer one.
    expect(recordFoundationFinds(found, elder.deltas, state.tick, 'hidden_site_reveal')).toBe(found);
  }, TIMEOUT_MS);
});
