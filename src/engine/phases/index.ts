/**
 * Engine Phase Registry — THR-238
 *
 * Each entry registers a tick-loop phase with the orchestrator. The orchestrator
 * resolves the registry into a per-slot, topologically-sorted plan at module-load
 * time and walks it via `runRegisteredPhases(state, ctx, slot, PHASE_PLAN)` from
 * the appropriate slot anchors in `runTick`.
 *
 * Adding a new phase:
 *  1. Create `src/engine/phases/<id>.ts` exporting an `EnginePhase` descriptor.
 *  2. Import and add it to the `ENGINE_PHASES` array below.
 *  3. No edit to `orchestrator.ts` required — the slot anchor will pick it up.
 *
 * Validation: duplicate ids, cycles, unknown refs, and cross-slot dependencies all
 * throw at module load — caught by the unit tests in `__tests__/phaseRegistry.test.ts`
 * (which CI runs via `npm test`). Note `npx tsc --noEmit` is a no-op in this repo
 * (root tsconfig sets `files: []` — THR-686) and proves nothing; the type gate is
 * `npm run check:typecheck`.
 *
 * Land 1 (THR-238): registry skeleton lands empty. Land 2 onward populates it.
 */
import { buildPhasePlan, type EnginePhase } from '../phaseRegistry';
// Land 2 canary migrations.
import { emittedOmenDecayPhase } from './emittedOmenDecay';
// THR-886: sibling sweep for The Compulsion's per-agent urges.
import { plantedCompulsionDecayPhase } from './plantedCompulsionDecay';
import { reputationDecayPhase } from './reputationDecay';
// Land 3 sweep (THR-238): phases with clean (state) -> Partial<GameState> shape
// living between cleanly bracketed slot anchors. Phases that need orchestrator-local
// state (uaRng, decisionRng, nextEventId) and the Phase 2a.1 / 2a.4 inline blocks
// stay inline by design — see plan § "Phases explicitly out of scope".
import { doomPhase } from './doom';
import { ambitionProgressPhase } from './ambitionProgress';
import { factionAmbitionsPhase } from './factionAmbitions';
import { factionActionsPhase } from './factionActions';
import { schismResolutionPhase } from './schismResolution';
import { secretsFavorsPhase } from './secretsFavors';
import { clueDecayPhase } from './clueDecay';
import { ruinQuestHooksPhase } from './ruinQuestHooks';
import { delveAdmissionPhase } from './delveAdmission';
import { delveProgressionPhase } from './delveProgression';
import { delveEmergencePhase } from './delveEmergence';
import { popStreamsPhase } from './popStreams';
import { personalityOriginSeedPhase } from './personalityOriginSeed';
import { personalityTraitEmergePhase } from './personalityTraitEmerge';
import { corePersonalityPhase } from './corePersonality';
import { autonomousAftermathPhase } from './phaseAutonomousAftermath';
import { playerReceiptsPhase } from '../playerReceipts';
import { mandatePhase } from './mandate';
import { factionSuccessionPhase } from './factionSuccession';
import { resourceStockTiersPhase } from './resourceStockTiers';
import { routeEventsPhase } from './routeEvents';
import { armySupplyPhase } from './armySupply';
import { economicPowerPhase } from './economicPower';

export const ENGINE_PHASES: readonly EnginePhase[] = [
  // pre-doom
  doomPhase,
  // post-resolution
  autonomousAftermathPhase,
  playerReceiptsPhase, // THR-727: Divine Receipt — player action resolution feedback

  // post-doom
  emittedOmenDecayPhase,
  plantedCompulsionDecayPhase, // THR-886: The Compulsion's per-agent urges lapse

  // pre-economy
  reputationDecayPhase,
  resourceStockTiersPhase, // THR-615: derive stock tiers before prosperity reads resourceBalance
  // post-economy (chained via afterPhase to preserve inline order)
  routeEventsPhase, // THR-669: manifests -> route-event encounter seeds
  armySupplyPhase, // THR-626: supply lines over trade conduits -> starving-army anomalies
  economicPowerPhase, // THR-617: monopoly resolution + sphere drift from flows
  ambitionProgressPhase,
  factionAmbitionsPhase,
  factionActionsPhase,
  schismResolutionPhase,
  secretsFavorsPhase,
  clueDecayPhase,
  ruinQuestHooksPhase,
  delveAdmissionPhase,
  delveProgressionPhase,
  delveEmergencePhase,
  popStreamsPhase,
  personalityOriginSeedPhase,
  personalityTraitEmergePhase,
  corePersonalityPhase,
  // post-narrative
  mandatePhase,
  factionSuccessionPhase,
];

/** Slot-keyed, topo-sorted execution plan. Computed once at module load. */
export const PHASE_PLAN = buildPhasePlan(ENGINE_PHASES);
