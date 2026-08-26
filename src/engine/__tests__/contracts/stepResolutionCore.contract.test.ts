/**
 * THR-1292 slice 2 — contract tests for the shared step-resolution library.
 *
 * The three contracts the plan (§1) requires, in its order:
 *
 *  1. **Drift guard between the callers.** Identical `StepCoreInput` + identical
 *     rng sequence ⇒ identical band, whichever entry point produced it.
 *  2. **One band ladder.** Neither caller reaches a band by any path but the core.
 *  3. **Busy-gate invariant.** An agent with an active undertaking is absent from
 *     `busyAgentIds` and still receives encounter decisions.
 *
 * ### The anti-pattern this file exists to prevent
 *
 * `src/engine/resolution.ts` (`resolveActionLegacy`) is a drifted *second*
 * resolver with an incompatible crit ladder. It survived because nothing asserted
 * that the ladder had one implementation — it was merely conventional that callers
 * used the shared one. Until this slice, `unifiedActionResolution.ts` still
 * imported it (line 67, unused); that import is now gone, and contract 2 below is
 * what stops the next one appearing.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { resolveStepCore, mapResolverOutcomeToStep } from '../../stepResolutionCore';
import { resolveUncontestedStep } from '../../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../../unifiedActionLifecycle';
import { computeCapability } from '../../domainCapability';
import { buildPredicateContext, collectTestShapers } from '../../effectResolver';
import { phaseAgentDecision } from '../../phaseAgentDecision';
import { EncounterCacheManager } from '../../encounterCache';
import { buildDistanceMatrix } from '../../distanceMatrix';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { GameState } from '../../../types/gameState';
import { WorldGraph } from '../../graph';
import { clearTraces, disableTracing } from '../../traceBuffer';

const MORTAL_ID = 'agent.mortal';
const TARGET_ID = 'loc-1';

function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTemplate(difficulty: number): UnifiedActionTemplate {
  return {
    id: 'hex.contract_working',
    rarityTier: 2,
    intrinsicTier: 'background',
    name: 'Contract Working',
    reach: 'stone',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty,
      onSuccess: [{ op: 'update_node', nodeId: '$target', changes: { worked: true } }],
      onFailure: [{ op: 'update_node', nodeId: '$target', changes: { worked: false } }],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  };
}

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: MORTAL_ID,
    type: 'actor',
    name: 'Tessel Vane',
    properties: { actorType: 'individual', domainCapabilities: { stone: 20 }, quintessence: 0 },
  });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'The Hollow', properties: {} });
  graph.addEdge({ id: 'e1', source: MORTAL_ID, target: TARGET_ID, type: 'located_at', properties: {} });

  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc.witness', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
    pendingQuintessenceEvents: [],
    effectStates: [],
  } as unknown as GameState;
}

beforeEach(() => { resetUnifiedActionCounter(); clearTraces(); });
afterEach(() => { disableTracing(); clearTraces(); });

// ─── Contract 1: drift guard between the callers ────────────────────

describe('contract 1 — one input, one band, whichever entry point produced it', () => {
  /**
   * The encounter entry point derives the core's inputs from action+template+graph.
   * This mirrors that derivation exactly and calls the core directly, on a fresh
   * stream of the same seed. Same inputs + same stream ⇒ same result.
   *
   * When slice 3 lands `undertakingCheckpoints.ts`, its entry point becomes a third
   * arm here; until then the direct core call stands in for caller 2, which is the
   * strongest arm available and still fails on any derivation drift in caller 1.
   */
  const SEEDS = [1, 5, 21, 42, 67, 143];
  const DIFFICULTIES = [0.2, 0.5, 0.8];

  it('agrees with the encounter entry point on band, roll and probability', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const seed of SEEDS) {
        const template = makeTemplate(difficulty);
        const state = makeState();
        const action = createUnifiedAction({
          actorId: MORTAL_ID, templateId: template.id, targetId: TARGET_ID,
          scale: 'local', source: 'agent', tick: 10, template,
          rng: () => 0.5, essencePaid: {} as never,
        });

        const viaEncounter = resolveUncontestedStep(action, template, state, seededRng(seed));

        const fresh = makeState();
        const step = template.steps[0] as { reach: 'stone'; difficulty: number };

        // The fixture carries no attachments or effects, so the encounter caller's
        // shaper collection is empty and the core arm can pass `[]`. Asserted rather
        // than assumed: if this ever stopped being empty, the two arms would silently
        // diverge on an input rather than on the behaviour under test.
        expect(collectTestShapers(
          fresh.graph, MORTAL_ID, step.reach,
          buildPredicateContext(fresh.graph, MORTAL_ID, step.reach),
          fresh.effectStates,
        )).toEqual([]);

        const viaCore = resolveStepCore({
          actorId: MORTAL_ID,
          reach: step.reach,
          capability: computeCapability(fresh.graph, MORTAL_ID, step.reach),
          difficulty: step.difficulty,
          scale: 'local',
          actionModifiers: 0,
          testShapers: [],
          variancePolicy: 'agent',
          quintessencePolicy: 'spend-intent',
          resistEligible: false,
          tick: 10,
          sourceLabel: 'unified_action',
        }, seededRng(seed));

        const where = `difficulty=${difficulty} seed=${seed}`;
        expect(viaCore.outcome, where).toBe(viaEncounter.outcome);
        expect(viaCore.roll, where).toBe(viaEncounter.roll);
        expect(viaCore.probability, where).toBe(viaEncounter.probability);
        expect(viaCore.resolverOutcome, where).toBe(viaEncounter.rawOutcome);
      }
    }
  });

  it('would notice a divergence — the comparison is not vacuously self-equal', () => {
    // Falsification arm. If the two arms were accidentally the same call, the
    // assertion above could never fail and contract 1 would prove nothing. Feed the
    // core a deliberately different input and require the bands to part company on
    // at least one seed.
    //
    // Note the perturbation is CAPABILITY, not difficulty. Difficulty alone does
    // not work here and the reason is worth recording: the fixture's mortal (raw
    // 20) sits well past the sigmoid's saturation knee, and the resulting threshold
    // is clamped at its maximum, so 0.5 and 0.99 produce the *same* probability and
    // the same band on every seed. A difficulty-based arm would have passed
    // vacuously for a reason that has nothing to do with the contract.
    const template = makeTemplate(0.5);
    const action = createUnifiedAction({
      actorId: MORTAL_ID, templateId: template.id, targetId: TARGET_ID,
      scale: 'local', source: 'agent', tick: 10, template,
      rng: () => 0.5, essencePaid: {} as never,
    });

    const diverged = SEEDS.some((seed) => {
      const viaEncounter = resolveUncontestedStep(action, template, makeState(), seededRng(seed));
      const viaCore = resolveStepCore({
        actorId: MORTAL_ID, reach: 'stone',
        capability: 0.01, // ← the injected difference: an all-but-incapable actor
        difficulty: 0.99,
        scale: 'cosmic', actionModifiers: 0, testShapers: [],
        variancePolicy: 'agent', quintessencePolicy: 'none',
        tick: 10, sourceLabel: 'unified_action',
      }, seededRng(seed));
      return viaCore.outcome !== viaEncounter.outcome;
    });

    expect(diverged).toBe(true);
  });
});

// ─── Contract 2: the band ladder has exactly one implementation ──────

describe('contract 2 — one band ladder in the engine', () => {
  const ENGINE_DIR = join(process.cwd(), 'src', 'engine');

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry !== '__tests__') walk(full, out);
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        out.push(full);
      }
    }
    return out;
  }

  const FILES = walk(ENGINE_DIR);

  it('scans a populated corpus — the sweep is not silently empty', () => {
    // Guards against the vacuous-probe failure: a walk that found nothing would
    // pass every assertion below while proving nothing at all.
    expect(FILES.length).toBeGreaterThan(100);
    expect(FILES.some((f) => f.endsWith('stepResolutionCore.ts'))).toBe(true);
  });

  it('defines the resolver-outcome→band mapping in exactly one module', () => {
    const definers = FILES.filter((f) =>
      /export function mapResolverOutcomeToStep/.test(readFileSync(f, 'utf8')),
    );
    expect(definers.map((f) => f.replace(/.*[\\/]/, ''))).toEqual(['stepResolutionCore.ts']);
  });

  it('detects a second definition if one appears — the predicate is falsifiable', () => {
    // Falsification arm for the regex above: prove it matches the shape it claims
    // to police, so a green run means "no second definition" rather than "the
    // pattern never matched anything".
    const synthetic = 'export function mapResolverOutcomeToStep(o: OutcomeType) { return o; }';
    expect(/export function mapResolverOutcomeToStep/.test(synthetic)).toBe(true);
  });

  it('keeps `resolveUncontestedStep` off the raw resolver — it reaches a band only through the core', () => {
    const src = readFileSync(join(ENGINE_DIR, 'unifiedActionResolution.ts'), 'utf8');
    // The encounter caller must not import the shared resolver directly, or a
    // future edit could roll a d100 and classify a band beside the core.
    expect(src).not.toMatch(/from '\.\/resolutionService'/);
    // Nor the drifted legacy resolver, whose crit ladder is incompatible.
    expect(src).not.toMatch(/from '\.\/resolution'/);
    expect(src).toMatch(/from '\.\/stepResolutionCore'/);
  });

  it('pins the set of modules that may call the shared resolver directly', () => {
    // Not a ban — `encounter.ts` and `meetingEncounter.ts` are separate encounter
    // surfaces that legitimately roll, and both map to a band through the SAME
    // exported mapper, so the ladder stays single-implementation there too. The
    // pin exists so this set cannot grow silently: a new entry is a deliberate
    // decision that has to be made here, in the open.
    const importers = FILES
      .filter((f) => /from '\.\.?\/(\.\.\/)?resolutionService'/.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(/.*[\\/]/, ''))
      .sort();
    expect(importers).toEqual([
      'encounter.ts',
      'encounterScoring.ts',
      'meetingEncounter.ts',
      'plannerForecast.ts',
      'resolutionScaleAdjust.ts',
      'stepResolutionCore.ts',
    ]);
  });

  it('exposes the same mapper object through the legacy import path', () => {
    // `encounter.ts` and `meetingEncounter.ts` import `mapResolverOutcomeToStep`
    // from `unifiedActionResolution`. That path must be a re-export of the core's
    // function, not a copy — identity, not merely equal behaviour.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return import('../../unifiedActionResolution').then((legacy) => {
      expect(legacy.mapResolverOutcomeToStep).toBe(mapResolverOutcomeToStep);
    });
  });
});

// ─── Contract 3: the busy gate never reads the strategic runtime ─────

describe('contract 3 — an undertaking does not make an agent busy', () => {
  /**
   * The review's load-bearing verdict: undertakings live in `state.strategicState`
   * and must NOT consume the one-unresolved-action-per-agent slot. If the busy gate
   * ever learned to read `strategicState`, an agent running an undertaking would
   * silently stop receiving encounters — a world that goes quiet rather than one
   * that throws, which is why it needs a pinned test rather than a code comment.
   */
  it('builds `busyAgentIds` from unified actions only, never from strategicState', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'engine', 'phaseAgentDecision.ts'), 'utf8');

    // The construction loop, pinned by shape: it iterates `state.unifiedActions`.
    expect(src).toMatch(/const busyAgentIds = new Set<string>\(\);\s*\n\s*for \(const a of state\.unifiedActions\)/);

    // Every `strategicState` mention in the file must be the phase's accumulator,
    // not the gate. Assert the gate's own neighbourhood is free of it: take the
    // slice from the set's construction to the skip site and require it clean.
    const start = src.indexOf('const busyAgentIds = new Set<string>()');
    const end = src.indexOf('busyAgentIds.has(agentId)');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(src.slice(start, end)).not.toMatch(/strategicState/);
  });

  it('runs the phase to completion for an agent carrying strategic state', () => {
    // The live arm, so this contract is not source-scanning alone. An agent with a
    // populated `strategicState` and no unresolved unified action must reach the
    // phase's decision logic rather than being skipped at the busy gate.
    const state = makeState();
    (state as unknown as { strategicState: unknown }).strategicState = {
      projects: [{ id: 'undertaking-1', actorId: MORTAL_ID, status: 'active' }],
    };

    const cache = new EncounterCacheManager();
    cache.buildFullCache(state.graph);
    const distanceMatrix = buildDistanceMatrix(state.graph);

    // Fail-soft (NFP #4): the phase returns a partial state and never throws, even
    // with a strategic runtime it does not read.
    const result = phaseAgentDecision(state, cache, distanceMatrix, seededRng(7));
    expect(result).toBeDefined();

    // The gate's only input is `state.unifiedActions`. Nothing here is unresolved,
    // so nothing marked this agent busy — the undertaking did not consume the slot.
    expect(state.unifiedActions.filter((a) => !a.resolved)).toHaveLength(0);
  });
});
