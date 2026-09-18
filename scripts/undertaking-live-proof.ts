/**
 * `check:undertaking-live` — the non-vacuous live proof for one undertaking
 * template (THR-1300 slice 3; the `encounter-live-proof.ts` sibling, THR-1246/1132).
 *
 * The contract (`check:undertaking`) proves a template is *well-formed*. This proves
 * it *runs*: in a real seeded world, started through the review lever
 * (`startUndertakingForReview` — the same path `?undertaking=` and the CLI use, so a
 * proof and a browser repro agree), driven with the real `runTick` until the project
 * reaches a terminal status, with every claim read off durable state (the graph, the
 * history, `state.tickEvents`) and, where nothing durable exists, the trace buffer —
 * never off the template. A trace's *absence* decides no claim (THR-1514): the ring is
 * bounded and its harvest can miss, and the one fail branch that inferred from absence
 * minted a false engine bug (THR-1510).
 *
 * ## Claims
 *
 * Baseline (every template, every run):
 *   started · no_tick_crash · terminal · moment_started
 * Delivery (gated on the template's **write set**, `undertakingWriteSet()` — one
 * predicate shared with the contract, so a template that declares nothing is never
 * failed for delivering nothing, and one that declares a write cannot pass by
 * delivering none):
 *   checkpoint_rolled · cast_bound · creation_effect · mutation_object ·
 *   christened · harm_recorded
 *
 * ## Verdict
 *   proved   — no claim failed and at least one *delivery* claim passed
 *   failed   — a claim failed
 *   vacuous  — nothing failed but nothing was delivered either: the template
 *              declares no write set, or every declared write sits on a band this
 *              run did not reach. Not green. Pin a band (`--band`) or widen the seed.
 *
 * ## Determinism
 * Same seed + same template ⇒ same verdict. The actor is the first autonomous
 * individual (sorted by id) the lever can start the template on; the lever's own
 * rng derives from the world seed.
 *
 * ## The pinned band
 * A run pins the `success` band by default (`DEFAULT_PINNED_BAND`, the `?outcome=`
 * lever): the proof asks whether the declared write set *can* land, and a run the
 * dice ended at `failure` answers nothing about that. How often the dice land there
 * is the census's question. `--band none` runs the checkpoints unpinned; any other
 * band reviews that band's effects.
 *
 * Usage:
 *   npm run check:undertaking-live -- strategic_cultivate_informant
 *   npm run check:undertaking-live -- <id> --seed 99 --band success_at_cost --json
 *   npm run check:undertaking-live -- <id> <id2> --seed 42 --seed 99     # matrix
 *   npm run check:undertaking-live -- <id> --band none                   # dice as rolled
 *
 * Exit codes: 0 every run proved · 1 any run failed or vacuous · 2 bad arguments.
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick } from '../src/engine/orchestrator';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { clearTraces, enableTracing } from '../src/engine/traceBuffer';
import { getStrategicTemplate, getAllStrategicTemplates } from '../src/engine/strategicActionCandidates';
import { UNDERTAKING_CELL_TEMPLATES } from '../src/data/undertaking-cells';
import { describeContentQuery } from '../src/engine/contentQuery';
import { isAutonomousDecisionActor } from '../src/engine/strategicKindReachability';
import {
  clearUndertakingBandPin,
  setUndertakingBandPin,
  startUndertakingForReview,
} from '../src/engine/undertakingReviewLevers';
import { enqueueUndertakingMoments } from '../src/engine/undertakingMoments';
import { getGroupKind } from '../src/engine/groupShape';
import { isPlaceNode, resolveToParentLocation } from '../src/engine/sublocationShape';
import { getAgentLocation } from '../src/engine/graphQueries';
import { undertakingWriteSet } from '../src/data/content-eval/undertakingContract';
import { STRATEGIC_CATALYST_REACTION_ID, STRATEGIC_CATALYST_SEED_CHANCE, STRATEGIC_CATALYST_SEED_DELAY_TICKS } from '../src/data/strategic-action-constants';
import type { GameState } from '../src/types/gameState';
import type { StrategicActionTemplate, StrategicProjectRuntime } from '../src/types/strategicAction';
import type { StepOutcome } from '../src/types/unifiedAction';
import type { TraceEntry } from '../src/types/trace';
import type { PendingEncounterSeed } from '../src/types/unifiedAction';
import { SeedConsumptionLedger } from './seed-consumption-ledger.js';
import { createRingHarvester } from './ring-harvest.js';

// ─── Constants ────────────────────────────────────────────────────

/** Default world seed. Matches the CLI's, so a proof and a `npm run cli` repro agree. */
export const DEFAULT_SEED = 42;
/** Ticks run before the lever fires, so residence and spotlight are settled. */
export const WARMUP_TICKS = 2;
/** Upper bound on ticks driven after the start — a T3 undertaking completes well inside it. */
export const MAX_RUN_TICKS = 240;
/** How many autonomous individuals to offer the lever before declaring no actor could start it. */
export const MAX_ACTOR_ATTEMPTS = 80;
export const DEFAULT_MAP: MapSizePreset = 'medium';
/** The band a run pins unless `--band` says otherwise (`--band none` leaves the dice alone). */
export const DEFAULT_PINNED_BAND: StepOutcome = 'success';
/**
 * Ticks driven past terminal status when the completion rolled a catalyst (THR-1497):
 * the seed comes due `STRATEGIC_CATALYST_SEED_DELAY_TICKS` after planting, and the
 * proof used to stop the instant the project left `active`, so the `catalyst_seeded`
 * claim could never see its own site fire. The delay plus a margin for the seed
 * phase's own ordering within a tick.
 */
export const CATALYST_SETTLE_TICKS = STRATEGIC_CATALYST_SEED_DELAY_TICKS + 3;

const BASELINE_CLAIMS: readonly string[] = ['started', 'no_tick_crash', 'terminal', 'moment_started'];
const BANDS: readonly StepOutcome[] = ['critical_success', 'success', 'success_at_cost', 'near_miss', 'failure', 'critical_failure'];

export type ClaimStatus = 'pass' | 'fail' | 'not_declared';
export type ProofVerdict = 'proved' | 'failed' | 'vacuous';

export interface Claim {
  readonly name: string;
  readonly status: ClaimStatus;
  readonly detail: string;
}

export interface ProofRun {
  readonly templateId: string;
  readonly seed: number;
  readonly actorId?: string;
  readonly projectId?: string;
  readonly ticksRun: number;
  readonly finalStatus?: StrategicProjectRuntime['status'];
  readonly claims: readonly Claim[];
  readonly verdict: ProofVerdict;
}

export function computeVerdict(claims: readonly Claim[]): ProofVerdict {
  if (claims.some(c => c.status === 'fail')) return 'failed';
  const delivery = claims.filter(c => !BASELINE_CLAIMS.includes(c.name));
  const declared = delivery.some(c => c.status !== 'not_declared');
  const proved = delivery.some(c => c.status === 'pass');
  return declared && proved ? 'proved' : 'vacuous';
}

// ─── World ────────────────────────────────────────────────────────

function buildWorld(seed: number, map: MapSizePreset): { state: GameState; runtime: ReturnType<typeof createSimulationRuntime> } {
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS[map];
  const { state: initial } = initializeGameState(archetype, 'LiveProof', createBalancedCosmology(), seed, preset.cols, preset.rows);
  let state = initial;
  for (let t = 0; t < WARMUP_TICKS; t++) state = runTick(state, [], runtime);
  return { state, runtime };
}

// ─── One run ──────────────────────────────────────────────────────

export function proveTemplate(templateId: string, seed: number, map: MapSizePreset, band?: StepOutcome): ProofRun {
  const template = getStrategicTemplate(templateId);
  if (!template) {
    return { templateId, seed, ticksRun: 0, claims: [{ name: 'started', status: 'fail', detail: `unknown template ${templateId}` }], verdict: 'failed' };
  }
  const writes = undertakingWriteSet(template);
  const claims: Claim[] = [];
  const { state: world, runtime } = buildWorld(seed, map);
  let state = world;

  enableTracing();
  clearTraces();
  // The trace buffer is a bounded ring, so every tick's traces are harvested into
  // `traces` before the next tick can evict them. Keyed on the monotonic emit count
  // (THR-1514): the ring renumbers ids after each eviction, so the old `id > lastSeen`
  // harvest stopped collecting once the ring filled. Created here, before the lever
  // fires, so the `strategic_action_started` trace is the first thing it sees.
  const harvester = createRingHarvester();
  const traces = harvester.traces;
  const harvest = () => { harvester.harvest(); };
  // The proof asks whether the declared write set *can* land, so the default run pins the
  // `success` band — the same lever `?outcome=` uses. Whether the dice land there often
  // enough is the census's question (`census:undertakings`), not this one's. `--band none`
  // runs the checkpoints unpinned.
  if (band) setUndertakingBandPin(templateId, band); else clearUndertakingBandPin(templateId);

  // Start: first autonomous individual (sorted by id) the lever accepts.
  const candidates = state.graph
    .getNodesByType('actor')
    .filter(isAutonomousDecisionActor)
    .map(n => n.id)
    .sort()
    .slice(0, MAX_ACTOR_ATTEMPTS);
  let actorId: string | undefined;
  let projectId: string | undefined;
  const refusals: string[] = [];
  for (const id of candidates) {
    const res = startUndertakingForReview(state, state.graph, id, templateId, {});
    if (res.ok && res.projectId) {
      actorId = id;
      projectId = res.projectId;
      state = {
        ...state,
        strategicState: res.strategicState ?? state.strategicState,
        pendingUndertakingMoments: res.moments
          ? enqueueUndertakingMoments(state.pendingUndertakingMoments, res.moments, state.tick)
          : state.pendingUndertakingMoments,
      };
      break;
    }
    refusals.push(`${id}: ${res.reason ?? 'refused'}${res.refusals?.length ? ` (${res.refusals.join(', ')})` : ''}`);
  }
  if (!actorId || !projectId) {
    claims.push({ name: 'started', status: 'fail', detail: `no actor could start it in ${candidates.length} attempts; last: ${refusals.slice(-3).join(' | ')}` });
    clearUndertakingBandPin(templateId);
    return { templateId, seed, ticksRun: 0, claims, verdict: 'failed' };
  }
  const startTick = state.tick;
  harvest();
  const startedTrace = traces.find(t =>
    t.category === 'strategic_action_started'
    && (t as { actorId?: string }).actorId === actorId
    && (t as { templateId?: string }).templateId === templateId
    && (t as { startedBy?: string }).startedBy === 'review_lever');
  const candidateId = (startedTrace as { candidateId?: string } | undefined)?.candidateId;
  claims.push({ name: 'started', status: startedTrace ? 'pass' : 'fail', detail: startedTrace ? `${actorId} started ${projectId} at tick ${startTick} via review lever` : 'no strategic_action_started trace for the project' });
  // A project's traces name it by projectId or by its candidate's id; the world-change
  // trace names only the actor, so it is matched by actor and tick window instead.
  const namesProject = (t: TraceEntry): boolean => {
    const keyed = t as { projectId?: string; candidateId?: string; actorId?: string; tick?: number };
    if (keyed.projectId === projectId || keyed.candidateId === projectId) return true;
    if (candidateId && (keyed.projectId === candidateId || keyed.candidateId === candidateId)) return true;
    return t.category === 'strategic_world_change' && keyed.actorId === actorId && (keyed.tick ?? -1) >= startTick;
  };

  // The seed ledger (THR-1514): what became of every seed is read off
  // `state.tickEvents` after every tick — the one durable record of a consumption —
  // so the `catalyst_seeded` claim below never has to infer anything from a trace
  // the ring evicted.
  const ledger = new SeedConsumptionLedger();
  ledger.observe(state);

  // Drive to terminal.
  let ticksRun = 0;
  let crashed: string | undefined;
  const project = (): StrategicProjectRuntime | undefined => state.strategicState?.projects.find(p => p.projectId === projectId);
  while (ticksRun < MAX_RUN_TICKS) {
    const p = project();
    if (!p || p.status !== 'active') break;
    try {
      state = runTick(state, [], runtime);
    } catch (err) {
      crashed = (err as Error).message;
      break;
    }
    ticksRun++;
    harvest();
    ledger.observe(state);
  }
  clearUndertakingBandPin(templateId);

  // Settle the catalyst (THR-1497). A completion that rolled one planted a seed due
  // `STRATEGIC_CATALYST_SEED_DELAY_TICKS` later; without these ticks the claim below
  // reads "the site was never reached" about a site the run never gave a chance to
  // be reached. Bounded, and only when a seed of this run's provenance is pending.
  const isThisRunsCatalyst = (s: PendingEncounterSeed): boolean =>
    s.sourceReactionId === STRATEGIC_CATALYST_REACTION_ID && s.targetAgentId === actorId && s.plantedTick >= startTick;
  const pendingCatalyst = (): boolean => (state.pendingEncounterSeeds ?? []).some(isThisRunsCatalyst);
  let settled = 0;
  while (!crashed && template.catalystQuery && pendingCatalyst() && settled < CATALYST_SETTLE_TICKS) {
    try {
      state = runTick(state, [], runtime);
    } catch (err) {
      crashed = (err as Error).message;
      break;
    }
    settled++;
    ticksRun++;
    harvest();
    ledger.observe(state);
  }

  const final = project();
  claims.push({ name: 'no_tick_crash', status: crashed ? 'fail' : 'pass', detail: crashed ?? `${ticksRun} ticks without a throw` });
  claims.push({
    name: 'terminal',
    status: final && final.status !== 'active' ? 'pass' : 'fail',
    detail: final ? `status ${final.status} after ${ticksRun} ticks` : 'project vanished from strategicState without a terminal status',
  });

  const forProject = <T extends TraceEntry>(category: T['category']) =>
    traces.filter(t => t.category === category && namesProject(t)) as T[];

  // Moments — the player-facing surface is the baseline, not a delivery claim.
  const momentTraces = traces.filter(t => t.category === 'moment_surface' && namesProject(t));
  const queued = (state.pendingUndertakingMoments ?? []).filter(m => (m as { projectId?: string }).projectId === projectId);
  claims.push({
    name: 'moment_started',
    status: momentTraces.length > 0 || queued.length > 0 ? 'pass' : 'fail',
    detail: `${momentTraces.length} moment_surface traces, ${queued.length} queued moments`,
  });

  // Delivery claims, each gated on the write set.
  const checkpoints = forProject<TraceEntry & { band?: string }>('undertaking_checkpoint');
  const rolled = checkpoints.filter(c => (c as { band?: string }).band);
  claims.push({
    name: 'checkpoint_rolled',
    status: template.executionMode === 'multi_tick_project' ? (rolled.length > 0 ? 'pass' : 'fail') : 'not_declared',
    detail: `${rolled.length} checkpoint(s) rolled${band ? ` (band pinned ${band})` : ''}: ${rolled.map(c => (c as { band?: string }).band).join(', ') || '—'}`,
  });

  if (writes.persistentCast.length > 0) {
    const bound = forProject<TraceEntry & { mode?: string; winnerNodeId?: string }>('binding_decision').filter(b => (b as { winnerNodeId?: string }).winnerNodeId);
    claims.push({ name: 'cast_bound', status: bound.length > 0 ? 'pass' : 'fail', detail: `${bound.length} binding(s) for must-persist slots ${writes.persistentCast.join(', ')}` });
  } else {
    claims.push({ name: 'cast_bound', status: 'not_declared', detail: 'no must-persist cast' });
  }

  const worldChanges = forProject<TraceEntry & { affectedNodeIds?: readonly string[]; christenedName?: string }>('strategic_world_change');
  const affected = worldChanges.flatMap(w => (w as { affectedNodeIds?: readonly string[] }).affectedNodeIds ?? []);
  if (writes.creationBands.length > 0) {
    const bandReached = rolled.map(c => (c as { band?: string }).band ?? '');
    const effectKeyFor = (b: string) => (b === 'critical_success' || b === 'success' ? 'onAdvance' : b === 'success_at_cost' || b === 'near_miss' ? 'onAtCost' : 'onCritFailure');
    const reachable = bandReached.some(b => (writes.creationBands as readonly string[]).includes(effectKeyFor(b)));
    claims.push({
      name: 'creation_effect',
      status: !reachable ? 'not_declared' : affected.length > 0 ? 'pass' : 'fail',
      detail: reachable ? `${affected.length} node(s) affected by creation effects on ${writes.creationBands.join('/')}` : `no rolled band landed on ${writes.creationBands.join('/')} — pin one with --band`,
    });
  } else {
    claims.push({ name: 'creation_effect', status: 'not_declared', detail: 'no creationEffects' });
  }

  if (writes.object && final?.status === 'completed') {
    // A cell's mutation is read off the **history entry** the completion wrote —
    // durable state, like the graph reads the per-hint claims make — not off the
    // trace ring, which a seeded world evicts many times per tick (the first draft of
    // this claim read the resolver's trace and measured nothing for that reason).
    // The entry's `graphOps` carry `<op>:ok` / `<op>:fail` from the semantic that ran.
    const entry = (state.strategicState?.history ?? [])
      .filter(h => h.actorId === actorId && h.templateId === templateId && h.tick >= startTick && h.outcome === 'completed')
      .sort((a, b) => b.tick - a.tick)[0];
    const ops = entry?.graphOps ?? [];
    const ok = ops.filter(o => o.endsWith(':ok'));
    const objectId = final?.objectHandle ? (final.objectHandle.kind === 'node' ? final.objectHandle.nodeId : final.objectHandle.edgeId) : '?';
    claims.push({
      name: 'mutation_object',
      status: ok.length > 0 ? 'pass' : 'fail',
      detail: ok.length > 0
        ? `${writes.object.verb} × ${writes.object.objectTypeId} on ${objectId} (${ok.join(', ')})`
        : ops.length > 0
          ? `the semantic ran and failed: ${ops.join(', ')}`
          : 'no completed history entry with a graph op for the project',
    });
  } else if (writes.mutation && final?.status === 'completed') {
    claims.push(mutationClaim(state, template, actorId, startTick, affected));
  } else {
    claims.push({ name: 'mutation_object', status: 'not_declared', detail: writes.mutation ? `mutationHint ${writes.mutation} fires on completion; run ended ${final?.status}` : 'no mutationHint' });
  }

  // Christening names a created *node*; an edge-only completion (a route, a mark) has nothing to name.
  const createdNode = affected.some(id => state.graph.getNode(id) !== undefined);
  if ((writes.kind || writes.object) && final?.status === 'completed' && createdNode) {
    const progress = forProject<TraceEntry & { christenedName?: string }>('strategic_project_progress');
    const christened = progress.find(p => (p as { christenedName?: string }).christenedName);
    claims.push({ name: 'christened', status: christened ? 'pass' : 'fail', detail: christened ? `"${(christened as { christenedName?: string }).christenedName}"` : `${writes.kind ? `kind ${writes.kind.kindId}` : `cell ${writes.object!.verb} × ${writes.object!.objectTypeId}`} completed and created a node without a christening` });
  } else {
    claims.push({ name: 'christened', status: 'not_declared', detail: !(writes.kind || writes.object) ? 'no kind row' : final?.status !== 'completed' ? `run ended ${final?.status}` : 'completion created no node to name (edge-only mutation)' });
  }

  if (writes.harmClass && final?.status === 'completed') {
    const harm = state.graph.getNodesByType('event').filter(n => n.id.includes(projectId!) && n.properties.harmClass === writes.harmClass);
    claims.push({ name: 'harm_recorded', status: harm.length > 0 ? 'pass' : 'fail', detail: harm.length > 0 ? `${harm[0].id} (${writes.harmClass})` : `no event node for ${writes.harmClass} — self-facing or ascendant-culprit outcomes record none` });
  } else {
    claims.push({ name: 'harm_recorded', status: 'not_declared', detail: writes.harmClass ? `run ended ${final?.status}` : 'no harmClass' });
  }

  // ── catalyst_seeded (THR-1489; reachable since THR-1497) ──
  //
  // Gated on the write set like every delivery claim above: a template declaring
  // no `catalystQuery` is `not_declared`, one that declares it must show the
  // query resolving at its own site.
  //
  // THR-1489 shipped this claim honestly `not_declared` on the whole corpus: every
  // carrier was a legacy-arm pack template the cells model never walks. THR-1497
  // put the catalyst on the cell (`UNDERTAKING_CELL_CATALYSTS`), made the seeding
  // site trace a catalyst seed at `undertaking_catalyst` instead of `encounter_seed`
  // (it had been a registered site nothing emitted), and gave this proof the settle
  // ticks the seed needs to come due. `catalystCorpusGap()` still prints the
  // reachable-carrier count on every run, so a regression to zero is loud.
  //
  // The roll is the dice's (`STRATEGIC_CATALYST_SEED_CHANCE`), read off the history
  // entry's `catalystSeeded` rather than inferred: a completion that did not roll
  // one is reported as such and not as a site that failed to fire, and is
  // `not_declared` for the verdict — the proof asks whether the wake *can* land,
  // and a missed roll answers nothing about that. Widen the seed to see it land.
  const catalystQuery = template.catalystQuery;
  if (!catalystQuery) {
    claims.push({
      name: 'catalyst_seeded',
      status: 'not_declared',
      detail: (template.catalystEncounterIds?.length ?? 0) > 0
        ? `catalysts named by ${template.catalystEncounterIds!.length} literal id(s), not by query`
        : 'no catalystQuery',
    });
  } else {
    const completion = (state.strategicState?.history ?? [])
      .find(h => h.actorId === actorId && h.templateId === templateId && h.tick >= startTick);
    const atSite = (category: string) => traces.filter(
      t => (t as { category?: string }).category === category
        && (t as { site?: string }).site === 'undertaking_catalyst'
        && (t as { actorId?: string }).actorId === actorId,
    );
    const resolvedAtSite = atSite('content.query_resolved');
    const emptyAtSite = atSite('content.query_empty');
    // Evidence, in order of authority (THR-1514):
    //   1. the seed's consumption event on `state.tickEvents` — `<seedId>_spawned`,
    //      `_family_ready` (withered: the query resolved empty), `_expired`, `_orphaned`
    //      — read by the ledger after every tick, so it is never evicted;
    //   2. the action the seed spawned (`spawnedFromSeedId`), which outlives the ring for
    //      `RESOLVED_ACTION_RETENTION_TICKS`;
    //   3. whatever `content.query_*` trace happened to survive the ring — a bonus
    //      detail, never a verdict. **The absence of a trace decides nothing**: the fail
    //      branch that once read "no query trace survived" as "withered" minted a false
    //      engine bug (THR-1510, impediment row 1049).
    const planted = ledger.all().filter(e => isThisRunsCatalyst(e.seed));
    const plantedCatalystIds = new Set(planted.map(e => e.seedId));
    const spawnedFromCatalyst = state.unifiedActions.find(a => a.spawnedFromSeedId !== undefined && plantedCatalystIds.has(a.spawnedFromSeedId));
    const spawnedEntry = planted.find(e => e.consumption === 'spawned');
    const witheredEntry = planted.find(e => e.consumption === 'family_ready');
    const discardedEntry = planted.find(e => e.consumption === 'expired' || e.consumption === 'orphaned');
    const leftUnexplained = planted.filter(e => e.left && !e.consumption);
    const stillPending = pendingCatalyst();
    const survivingTraces = (n: number, kind: string) => (n > 0 ? `; ${n} ${kind} trace(s) survived the ring` : '');
    if (final?.status !== 'completed') {
      claims.push({ name: 'catalyst_seeded', status: 'not_declared', detail: `run ended ${final?.status}; a catalyst is planted on completion only` });
    } else if (completion && !completion.catalystSeeded) {
      claims.push({
        name: 'catalyst_seeded',
        status: 'not_declared',
        detail: `the catalyst roll missed (STRATEGIC_CATALYST_SEED_CHANCE ${STRATEGIC_CATALYST_SEED_CHANCE}) — another --seed rolls it`,
      });
    } else if (spawnedEntry || spawnedFromCatalyst || resolvedAtSite.length > 0) {
      const picked = (resolvedAtSite[0] as { pickedId?: string } | undefined)?.pickedId
        ?? spawnedFromCatalyst?.templateId
        ?? '(the spawned action has already left unifiedActions; template id not retained)';
      const evidence = spawnedEntry
        ? `state.tickEvents ${spawnedEntry.seedId}_spawned at tick ${spawnedEntry.consumedTick}`
        : spawnedFromCatalyst
          ? `the spawned action names the seed (${spawnedFromCatalyst.spawnedFromSeedId})`
          : 'a surviving content.query_resolved trace';
      claims.push({
        name: 'catalyst_seeded',
        status: 'pass',
        detail: `${describeContentQuery(catalystQuery)} resolved at undertaking_catalyst → ${picked} `
          + `(${evidence}${survivingTraces(resolvedAtSite.length, 'query_resolved')}) after ${settled} settle tick(s)`,
      });
    } else if (witheredEntry) {
      claims.push({
        name: 'catalyst_seeded',
        status: 'fail',
        detail: `${describeContentQuery(catalystQuery)} resolved empty at undertaking_catalyst — judged at `
          + `${whereSeedWasJudged(state, witheredEntry.seed)}; the family has no member either place accepts `
          + `(state.tickEvents ${witheredEntry.seedId}_family_ready at tick ${witheredEntry.consumedTick}`
          + `${survivingTraces(emptyAtSite.length, 'query_empty')})`,
      });
    } else if (discardedEntry) {
      claims.push({
        name: 'catalyst_seeded',
        status: 'fail',
        detail: `the seed was discarded before its query ran — ${discardedEntry.consumption === 'orphaned'
          ? 'its target is no longer a live node'
          : 'it carried neither template, family nor query'} `
          + `(state.tickEvents ${discardedEntry.seedId}_${discardedEntry.consumption} at tick ${discardedEntry.consumedTick})`,
      });
    } else if (stillPending) {
      claims.push({
        name: 'catalyst_seeded',
        status: 'fail',
        detail: `declares ${describeContentQuery(catalystQuery)} and rolled a seed, still pending after ${settled} settle tick(s) — `
          + 'the actor was busy or the seed has not come due',
      });
    } else {
      // A seed that left `pendingEncounterSeeds` with no consumption event, or a
      // completion whose `catalystSeeded` never showed a seed pending at all. Neither is
      // evidence of a drop; both are reported as what they are — unknown.
      const unknown = leftUnexplained.length > 0
        ? `${leftUnexplained.map(e => e.seedId).join(', ')} left pendingEncounterSeeds within ${settled} settle tick(s) with no consumption event on state.tickEvents`
        : `the history entry records catalystSeeded but no seed of this run's provenance was ever observed pending`;
      claims.push({
        name: 'catalyst_seeded',
        status: 'fail',
        detail: `declares ${describeContentQuery(catalystQuery)}; ${unknown} — consumption UNKNOWN, not a drop: `
          + `read evaluateEncounterSeeds before inferring one (the actor now stands at ${whereActorStands(state, actorId)})`,
      });
    }
  }

  const verdict = computeVerdict(claims);
  return { templateId, seed, actorId, projectId, ticksRun, finalStatus: final?.status, claims, verdict };
}

/**
 * The corpus-level reachability of the `undertaking_catalyst` query site (THR-1489).
 *
 * Printed on every run, not only when a claim fires. A `catalyst_seeded` reading
 * `not_declared` is indistinguishable — from the report alone — between "this
 * template chose not to use the primitive" and "no reachable template *can*",
 * and those want opposite responses. This line says which, in numbers, off the
 * live registry rather than off a comment that would rot.
 */
export function catalystCorpusGap(): {
  readonly carriers: number;
  readonly reachableCarriers: number;
  readonly note: string;
} {
  // Both arms, exactly as `undertakingPackageIndex` composes the corpus — packs
  // plus cells — so the denominator is the whole authored population and not
  // whichever half this script happened to import.
  const carriers = [...getAllStrategicTemplates(), ...UNDERTAKING_CELL_TEMPLATES]
    .filter(t => t.catalystQuery !== undefined);
  // Reachable = the arm the live model actually walks. A cell template carries a
  // `cellVariant`; a pack is reached only through a profile's `templateIds`,
  // which the cells model does not read.
  const reachableCarriers = carriers.filter(t => t.cellVariant !== undefined);
  return {
    carriers: carriers.length,
    reachableCarriers: reachableCarriers.length,
    note: reachableCarriers.length === 0 && carriers.length > 0
      ? `${carriers.length} template(s) declare catalystQuery and none is reachable under `
        + "UNDERTAKING_MODEL 'cells' — the undertaking_catalyst query site is dead on the "
        + 'live board (the THR-1497 shape, regressed: UNDERTAKING_CELL_CATALYSTS is empty)'
      : `${reachableCarriers.length} of ${carriers.length} catalystQuery carrier(s) reachable `
        + 'under the live undertaking model (cells, THR-1497)',
  };
}

/**
 * Where an actor stands, resolved to the Location tier the seeding filter reads
 * (THR-1497) — so a withered catalyst names the subtype the family did not accept.
 */
function whereActorStands(state: GameState, actorId: string): string {
  const located = getAgentLocation(state.graph, actorId);
  if (!located) return 'nowhere';
  const location = resolveToParentLocation(state.graph, located);
  const subtypeOf = (n: { properties: Record<string, unknown> } | undefined) =>
    (n?.properties.locationSubtype ?? n?.properties.locationType ?? 'no subtype') as string;
  return location && location.id !== located.id
    ? `${located.id} (a Place in ${location.id}, ${subtypeOf(location)})`
    : `${located.id} (${subtypeOf(location ?? located)})`;
}

/**
 * The places the seeding site judged a withered seed at (THR-1511's order: the work's
 * own anchor first, the target's feet second), each with the subtype the family did
 * not accept. Read off the seed's `resolutionLocationId` and the target's `located_at`
 * — the same inputs `seedJudgedLocations` reads — so the sentence needs no trace.
 * The feet are read now rather than on the consumption tick; a target moves at most a
 * few ticks between the two.
 */
function whereSeedWasJudged(state: GameState, seed: PendingEncounterSeed): string {
  const feet = `feet ${whereActorStands(state, seed.targetAgentId)}`;
  if (!seed.resolutionLocationId) return feet;
  const anchorNode = resolveToParentLocation(state.graph, state.graph.getNode(seed.resolutionLocationId));
  if (!anchorNode) return `anchor ${seed.resolutionLocationId} (dangling), then ${feet}`;
  const subtype = (anchorNode.properties.locationSubtype ?? anchorNode.properties.locationType ?? 'no subtype') as string;
  return `anchor ${anchorNode.id} (${subtype}), then ${feet}`;
}

/** Did the completion's mutation leave the kind's object in the graph? Read by hint type. */
function mutationClaim(state: GameState, template: StrategicActionTemplate, actorId: string, startTick: number, affected: readonly string[]): Claim {
  const g = state.graph;
  const hint = template.mutationHint!;
  const since = (n: { properties: Record<string, unknown> }) => typeof n.properties.createdTick !== 'number' || (n.properties.createdTick as number) >= startTick;
  switch (hint.type) {
    case 'create_trade_route': {
      const routes = g.getOutgoingEdges(actorId).length;
      const edges = g.getEdgesByType('trades_with').filter(e => (e.properties?.establishedBy === actorId || e.properties?.createdBy === actorId));
      return { name: 'mutation_object', status: edges.length > 0 ? 'pass' : 'fail', detail: `${edges.length} trades_with edge(s) established by ${actorId} (actor has ${routes} out-edges)` };
    }
    case 'create_sublocation': {
      const made = g.getNodesByType('location').filter(n => isPlaceNode(n) && n.properties.createdBy === actorId && since(n));
      return { name: 'mutation_object', status: made.length > 0 ? 'pass' : 'fail', detail: made.length > 0 ? `${made[0].id} "${made[0].name}"` : 'no sublocation created by the actor' };
    }
    case 'create_location': {
      const made = g.getNodesByType('location').filter(n => !isPlaceNode(n) && n.properties.createdBy === actorId && since(n));
      return { name: 'mutation_object', status: made.length > 0 ? 'pass' : 'fail', detail: made.length > 0 ? `${made[0].id} "${made[0].name}"` : 'no place-tier location created by the actor' };
    }
    case 'create_group': {
      const groups = g.getNodesByType('actor').filter(n => getGroupKind(n) !== undefined && g.getOutgoingEdges(actorId).some(e => e.type === 'member_of' && e.target === n.id));
      return { name: 'mutation_object', status: groups.length > 0 ? 'pass' : 'fail', detail: groups.length > 0 ? `${groups[0].id} (${getGroupKind(groups[0])}) "${groups[0].name}"` : 'the actor is a member of no group' };
    }
    case 'record_intelligence': {
      const actor = g.getNode(actorId);
      const intel = (actor?.properties.strategicIntelligence as Record<string, number> | undefined) ?? {};
      const keys = Object.keys(intel);
      return { name: 'mutation_object', status: keys.length > 0 ? 'pass' : 'fail', detail: keys.length > 0 ? `strategicIntelligence ${keys.join(', ')}` : 'no strategicIntelligence on the actor' };
    }
    case 'mint_leverage_mark': {
      const marks = g.getOutgoingEdges(actorId).filter(e => e.type === 'knows_secret_of');
      return { name: 'mutation_object', status: marks.length > 0 ? 'pass' : 'fail', detail: marks.length > 0 ? `knows_secret_of → ${marks[0].target}` : 'the actor holds no leverage mark' };
    }
    case 'mint_masterwork': {
      const owned = g.getOutgoingEdges(actorId).filter(e => e.type === 'possesses').map(e => g.getNode(e.target)).filter(n => n?.type === 'artifact' && since(n));
      return { name: 'mutation_object', status: owned.length > 0 ? 'pass' : 'fail', detail: owned.length > 0 ? `${owned[0]!.id} "${owned[0]!.name}"` : 'no artifact possessed since the start' };
    }
    default:
      return { name: 'mutation_object', status: affected.length > 0 ? 'pass' : 'fail', detail: `${hint.type}: ${affected.length} node(s) affected by strategic_world_change` };
  }
}

// ─── CLI ──────────────────────────────────────────────────────────

function parseArgs(argv: readonly string[]) {
  const ids: string[] = [];
  const seeds: number[] = [];
  let map: MapSizePreset = DEFAULT_MAP;
  let band: StepOutcome | undefined = DEFAULT_PINNED_BAND;
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--seed') { seeds.push(Number(argv[++i])); continue; }
    if (a === '--map') { map = argv[++i] as MapSizePreset; continue; }
    if (a === '--band') { const b = argv[++i]; band = b === 'none' ? undefined : (b as StepOutcome); continue; }
    if (a === '--json') { json = true; continue; }
    if (a.startsWith('--')) { console.error(`unknown flag ${a}`); process.exit(2); }
    ids.push(a);
  }
  if (ids.length === 0) { console.error('Usage: npm run check:undertaking-live -- <templateId>... [--seed N]... [--map small|medium|large] [--band <outcome>] [--json]'); process.exit(2); }
  if (seeds.some(s => !Number.isFinite(s))) { console.error('--seed needs a number'); process.exit(2); }
  if (band && !BANDS.includes(band)) { console.error(`--band must be one of ${BANDS.join(', ')}`); process.exit(2); }
  if (!(map in MAP_SIZE_PRESETS)) { console.error(`--map must be one of ${Object.keys(MAP_SIZE_PRESETS).join(', ')}`); process.exit(2); }
  return { ids, seeds: seeds.length ? seeds : [DEFAULT_SEED], map, band, json };
}

const isMain = typeof process !== 'undefined' && process.argv[1] !== undefined && /undertaking-live-proof/.test(process.argv[1]);
if (isMain) {
  const { ids, seeds, map, band, json } = parseArgs(process.argv.slice(2));
  const runs: ProofRun[] = [];
  for (const id of ids) for (const seed of seeds) runs.push(proveTemplate(id, seed, map, band));
  const catalystGap = catalystCorpusGap();
  if (json) {
    console.log(JSON.stringify({ runs, catalystGap }, null, 2));
  } else {
    // Printed before the runs, not after: a reader scanning a wall of
    // `catalyst_seeded · no catalystQuery` rows needs to know *why* they all
    // read that way before they read them (THR-1489).
    console.log(`  catalyst query site — ${catalystGap.note}`);
    console.log('');
    for (const r of runs) {
      const mark = r.verdict === 'proved' ? '✓' : r.verdict === 'failed' ? '✗' : '○';
      console.log(`${mark} ${r.templateId} seed ${r.seed} — ${r.verdict}${r.actorId ? ` (actor ${r.actorId}, ${r.ticksRun} ticks, ${r.finalStatus})` : ''}`);
      for (const c of r.claims) {
        const cm = c.status === 'pass' ? '✓' : c.status === 'fail' ? '✗' : '·';
        console.log(`   ${cm} ${c.name.padEnd(18)} ${c.detail}`);
      }
    }
  }
  const bad = runs.filter(r => r.verdict !== 'proved');
  if (bad.length > 0) {
    console.error(`\n${bad.length}/${runs.length} run(s) not proved (${bad.map(r => `${r.templateId}@${r.seed}:${r.verdict}`).join(', ')})`);
    process.exit(1);
  }
  (json ? console.error : console.log)(`\nall ${runs.length} run(s) proved`);
}
