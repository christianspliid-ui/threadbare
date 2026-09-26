// THR-1590: why the social generator's candidates never fire. A/B on the engine's own
// filter: for every located individual at sampled ticks, build the social entries exactly as
// phaseAgentDecision does, then run `runFilterPipeline` on
//   (A) the engine's order  [...nearbyCacheEntries, ...dynamicSocialEntries]
//   (B) social entries alone
// and count how many social entries survive each stage. A survives-B / dies-A gap is the
// positional cap cut (`MAX_SCORED_CANDIDATES` filled from the head; cf. THR-814's
// `personallyOffered` reserve, which the social generator does not set).
// Usage: node .cache/social-cap.mjs <seeds> <ticks> <sampleEvery>
import { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { deriveCosmologyFromIdentity } from '../../../../src/engine/remembrance';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { generateSocialCandidates } from '../../../../src/engine/socialEncounterGeneration';
import { runFilterPipeline } from '../../../../src/engine/encounterFilterPipeline';
import { getAgentLocationId } from '../../../../src/engine/graphQueries';
import { resolveLocationToHex } from '../../../../src/engine/encounterAwareness';
import { MAX_AWARENESS_HOPS, EDGE_HEX_AWARENESS_BONUS } from '../../../../src/data/agent-behavior-constants';

const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 60);
const EVERY = Number(process.argv[4] ?? 20);
const RANGE = MAX_AWARENESS_HOPS + EDGE_HEX_AWARENESS_BONUS + 1;
const { cols, rows } = MAP_SIZE_PRESETS.medium;

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  const runtime = createSimulationRuntime();
  const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
  let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium') as any;
  devSeedTheFirst(state); devSeedAscendantTestPackage(state);
  for (let i = 1; i <= TICKS; i++) {
    state = runTick(state, [], runtime);
    if (i % EVERY !== 0) continue;
    const cache = (runtime as any).encounterCache; const dm = (runtime as any).distanceMatrix;
    const agg = { agents: 0, withSocial: 0, socialEntries: 0, A_afterCap: 0, B_afterPrereq: 0, B_afterCap: 0, A_agentsAnySocialSurvive: 0, B_agentsAnySocialSurvive: 0 };
    for (const n of state.graph.getNodesByType('actor')) {
      if (n.properties?.actorType !== 'individual' || n.properties?.spotlightTier === 'ambient') continue;
      const loc = getAgentLocationId(state.graph, n.id); if (!loc) continue;
      agg.agents++;
      const social = generateSocialCandidates(state.graph, n.id, loc, dm);
      if (!social.length) continue;
      agg.withSocial++; agg.socialEntries += social.length;
      const ids = new Set(social.map(e => e.templateId + '|' + (e.targetAgentId ?? '')));
      const hex = resolveLocationToHex(state.graph, loc);
      const nearby = hex ? cache.getEntriesNearHex(hex.col, hex.row, RANGE) : cache.getAllEntries();
      const count = (r: any) => (r.candidates as any[]).filter(c => ids.has(c.templateId + '|' + (c.targetAgentId ?? ''))).length;
      const a = runFilterPipeline([...nearby, ...social], n.id, loc, state.graph, state.tick, cols, rows);
      const b = runFilterPipeline(social, n.id, loc, state.graph, state.tick, cols, rows);
      const ac = count(a), bc = count(b);
      agg.A_afterCap += ac; agg.B_afterCap += bc;
      // B is social-only, so its stage count is the social count; A's stage counts mix pools.
      agg.B_afterPrereq += (b.trace as any)?.afterPrerequisites ?? 0;
      if (ac) agg.A_agentsAnySocialSurvive++; if (bc) agg.B_agentsAnySocialSurvive++;
    }
    console.log(`seed ${seed} t${state.tick}: ${JSON.stringify(agg)}`);
  }
}
