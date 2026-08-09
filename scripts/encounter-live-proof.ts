/**
 * `check:encounter-live` — the Encounter Factory's Stage 4. THR-1047.
 *
 * Plan: `Docs/plans/2026-08-08-encounter-factory-workflow.md` §2 Stage 4
 * ("Live proof — headless, per encounter").
 *
 * Stage 3 (`check:encounter`) asks whether a template **declares** its
 * composition blocks. This asks whether the declared blocks **arrive** — it
 * spawns the encounter on the ascendant in a real seeded world, commits a hand,
 * ticks until every step resolves, and then reads the running state for the
 * things the template promised. A template can pass the contract and still
 * deliver nothing: an `aftermathConfig` whose variants are unreachable renders
 * the fallback forever (the THR-989 class), a seed effect on an unreachable band
 * never plants, a reward recipe on a step nobody reaches leaves no node.
 * Declaration is Stage 3's question; delivery is this one's.
 *
 *   npm run check:encounter-live -- encounter.slice.unsafe_bridge
 *   npm run check:encounter-live -- --all --json
 *   npm run check:encounter-live -- <id> --seed 99 --play all
 *
 * ## What it asserts, and why it will not assert more
 *
 * Every claim is gated on what the template declares, read through
 * `systemConnections()` — the **same** function the Stage 3 contract counts its
 * systems quota with. One predicate, two consumers: a template that declares no
 * seeds is never failed for planting none, and a template that declares seeds
 * cannot pass by planting none. A second hand-rolled "does it declare seeds"
 * predicate here would drift from the gate's within a month, and the drift would
 * be silent in the direction that matters (this sweep going quiet).
 *
 * ## Vacuity is a verdict, not a pass
 *
 * The trap this script is most likely to fall into is proving nothing loudly. A
 * template declaring no cast, no rewards, no seeds and no conditions has only
 * the baseline claims to satisfy — it spawned, it did not crash, its steps
 * resolved — and every one of those passes for a template that delivers nothing
 * a player would notice. So a run whose declared-delivery claim set is empty
 * reports **`vacuous`**, never `proved`, and the summary counts vacuous runs on
 * their own line. A green wall that means "we asked nothing" is worse than a red
 * one, because nobody re-reads it.
 *
 * ## Determinism (NFP #3)
 *
 * Same seed + same template ⇒ same verdict. The world is built from the seed,
 * the action's own rng is a seeded `mulberry32` derived from the seed and the
 * template id (so two templates in one batch do not share a stream and reorder
 * each other's rolls), and the hand is committed by a deterministic rule rather
 * than a sample. A flaky proof would be worse than none: it would train the line
 * to re-run until green.
 *
 * ## Fail-soft (NFP #4)
 *
 * A template that throws during ticking is a *result*, not a crash of the sweep:
 * it is recorded with `no_tick_crash: fail` and the message, and the sweep moves
 * to the next template. The whole point is to find the encounter that breaks the
 * tick loop before a player does.
 *
 * Exit codes:
 *   0  every proved template passed every claim it declared
 *   1  a declared claim failed, or an id did not resolve to a template
 *
 * A `vacuous` verdict does **not** fail the run — nothing was promised, so
 * nothing was broken. It is Stage 3's job to refuse a template that declares too
 * little, and duplicating that refusal here would report one defect twice.
 */

import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick } from '../src/engine/orchestrator';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { prepareEncounterSupportBundle } from '../src/engine/encounterSupportBundle';
import { createUnifiedAction } from '../src/engine/unifiedActionLifecycle';
import { mulberry32 } from '../src/engine/factionAmbitions';

import { UNIFIED_ACTION_TEMPLATES, getUnifiedTemplateById } from '../src/data/unified-action-templates';
import { NUDGE_GOLDEN_EXEMPLAR } from '../src/data/__fixtures__/nudge-exemplar/swollen-ford-exemplar';
import { systemConnections } from '../src/data/content-eval/compositionContract';

import { isActionStepBranch } from '../src/types/unifiedAction';
import type {
  ActionStep,
  UnifiedAction,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../src/types/unifiedAction';
import type { GameState } from '../src/types/gameState';
import {
  computeVerdict,
  selectHand as selectHandFrom,
  type ClaimStatus,
  type PlayMode,
  type ProofVerdict,
} from './encounter-live-proof-claims';

// ─── Constants (NFP #1 — every number named) ──────────────────────────

/** Default world seed. Matches the CLI's, so a proof and a `npm run cli` repro agree. */
const DEFAULT_SEED = 42;

/** Default map preset. `medium` for the same reason the CLI defaults to it (THR-162). */
const DEFAULT_MAP: MapSizePreset = 'medium';

/**
 * Ticks the world runs before the encounter is spawned.
 *
 * Zero would spawn into a world whose agents have not moved, whose locations
 * have no occupants and whose support bundle therefore binds nothing — the cast
 * claim would fail for every template on a technicality of timing. Two ticks is
 * enough for placement to settle without letting the ascendant wander into an
 * unrelated encounter.
 */
const WARMUP_TICKS = 2;

/**
 * Hard bound on ticks spent waiting for one encounter to resolve.
 *
 * A step's `stepDuration` is a handful of ticks and the longest authored
 * encounter is three steps, so this is roughly an order of magnitude of
 * headroom. It exists so a template that never resolves reports
 * `steps_resolved: fail` in bounded time instead of hanging the batch.
 */
const MAX_RESOLUTION_TICKS = 60;

/** Deterministic offset mixed into the per-template rng seed. */
const TEMPLATE_RNG_SALT = 0x9e3779b9;

/** Only `encounter.*` ids are corpus, exactly as `check:encounter --all` scopes it. */
const ENCOUNTER_ID_PREFIXES: readonly string[] = ['encounter.'];

// ─── Claim model ─────────────────────────────────────────────────────

/**
 * `not_declared` is a first-class status, not a silent skip.
 *
 * A skipped claim vanishes from the report and the template reads as fully
 * proved; a `not_declared` claim stays on the row and is what the `vacuous`
 * verdict is computed from. The status union, the baseline set and the verdict
 * rule all live in `encounter-live-proof-claims.ts` so a test can reach them.
 */
type ClaimName =
  | 'registered'
  | 'spawn'
  | 'no_tick_crash'
  | 'steps_resolved'
  | 'hand_committed'
  | 'aftermath_rendered'
  | 'aftermath_variant'
  | 'cast_bound'
  | 'reward_node'
  | 'seed_planted'
  | 'condition_applied'
  | 'concepts_declared';

interface ProofClaim {
  readonly name: ClaimName;
  readonly status: ClaimStatus;
  /** What was looked for and what was found. Reads as a sentence in the report. */
  readonly detail: string;
}

interface LiveProofResult {
  readonly templateId: string;
  readonly verdict: ProofVerdict;
  readonly seed: number;
  readonly outcome?: UnifiedActionOutcome;
  readonly resolvedAtTick?: number;
  readonly ticksSpent: number;
  readonly committedNudges: readonly string[];
  readonly claims: readonly ProofClaim[];
}

// ─── Args ────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

function flagValue(name: string, fallback: string): string {
  const index = argv.indexOf(name);
  return index !== -1 && index + 1 < argv.length ? argv[index + 1] : fallback;
}

const wantsAll = argv.includes('--all');
const wantsJson = argv.includes('--json');
const seed = Number.parseInt(flagValue('--seed', String(DEFAULT_SEED)), 10);
const mapSize = flagValue('--map', DEFAULT_MAP) as MapSizePreset;
const playMode = flagValue('--play', 'cheapest') as PlayMode;

/** Positional ids only — a flag's *value* is not a template id. */
const FLAGS_WITH_VALUES: readonly string[] = ['--seed', '--map', '--play'];
const explicitIds = argv.filter((arg, index) => {
  if (arg.startsWith('--')) return false;
  const previous = argv[index - 1];
  return previous === undefined || !FLAGS_WITH_VALUES.includes(previous);
});

if (!wantsAll && explicitIds.length === 0) {
  console.error(
    'Usage: npm run check:encounter-live -- <templateId...> | --all '
      + '[--seed N] [--map small|medium|large] [--play none|cheapest|all] [--json]',
  );
  process.exit(1);
}

if (!MAP_SIZE_PRESETS[mapSize]) {
  console.error(`Unknown map preset '${mapSize}'. Known: ${Object.keys(MAP_SIZE_PRESETS).join(', ')}`);
  process.exit(1);
}

// ─── Manifest readers ────────────────────────────────────────────────

/** Plain steps only — a branch node carries no prose, hand or outcome metadata. */
function plainSteps(template: UnifiedActionTemplate): readonly ActionStep[] {
  return (template.steps ?? []).filter(
    (step): step is ActionStep => !isActionStepBranch(step),
  );
}

/**
 * Card ids this run commits, chosen deterministically.
 *
 * The rule itself lives in `encounter-live-proof-claims.ts` (and is tested
 * there); this only projects the template down to the shape it takes. One card
 * per step is enough to prove the commit path carries into resolution — playing
 * the whole hand mostly proves the forecast clamp, which `check:encounter`'s
 * forecast arithmetic already owns.
 */
function selectHand(template: UnifiedActionTemplate, mode: PlayMode): readonly string[] {
  return selectHandFrom(
    plainSteps(template).map(step =>
      (step.nudges ?? []).map(nudge => ({ id: nudge.id, essenceCost: nudge.essenceCost })),
    ),
    mode,
  );
}

// ─── The proof ───────────────────────────────────────────────────────

interface SpawnedWorld {
  state: GameState;
  actionId: string;
  actorId: string;
}

/**
 * Build a world, warm it, and stage the encounter on the ascendant.
 *
 * The ascendant is the target for the same reason `?spawn=` uses `@hero`: it is
 * the one actor guaranteed to exist, to be attended, and to have the essence a
 * nudge-bearing step assumes.
 */
function spawnInFreshWorld(
  template: UnifiedActionTemplate,
  runSeed: number,
): SpawnedWorld {
  const runtime = createSimulationRuntime();
  const archetype = generateArchetypes(4, runSeed)[0];
  const preset = MAP_SIZE_PRESETS[mapSize];
  const { state: initial } = initializeGameState(
    archetype,
    'LiveProof',
    createBalancedCosmology(),
    runSeed,
    preset.cols,
    preset.rows,
  );

  let state = initial;
  for (let tick = 0; tick < WARMUP_TICKS; tick++) {
    state = runTick(state, [], runtime);
  }

  const actorId = state.ascendantId;
  if (!actorId) throw new Error('world has no ascendant — cannot stage an encounter');

  const supportBindings = prepareEncounterSupportBundle(state, template, actorId);

  // A per-template stream: two templates in one batch must not reorder each
  // other's draws, or a batch verdict would depend on batch order (NFP #3).
  const templateHash = [...template.id].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 0);
  const rng = mulberry32((runSeed ^ templateHash ^ TEMPLATE_RNG_SALT) >>> 0);

  const action = createUnifiedAction({
    actorId,
    templateId: template.id,
    targetId: actorId,
    scale: template.scale,
    source: 'system',
    tick: state.tick,
    template,
    rng,
    supportBindings,
  });

  return {
    state: { ...state, unifiedActions: [...state.unifiedActions, action] },
    actionId: action.actionId,
    actorId,
  };
}

/**
 * Commit the hand onto the live action.
 *
 * Writing `activeNudges` directly is the headless equivalent of the player
 * clicking cards: it is the exact field `collectNudgeModifiers` reads at
 * resolution, and the resolver applies no affordability check of its own (the
 * essence purchase lives on the commit path in the UI). Bypassing the purchase
 * is deliberate — this stage proves that authored content *arrives*, and the
 * economy has its own tests. A proof that failed because the ascendant was two
 * essence short would be measuring the wrong system.
 */
function withCommittedHand(state: GameState, actionId: string, hand: readonly string[]): GameState {
  if (hand.length === 0) return state;
  return {
    ...state,
    unifiedActions: state.unifiedActions.map(action =>
      action.actionId === actionId ? { ...action, activeNudges: [...hand] } : action,
    ),
  };
}

function findAction(state: GameState, actionId: string): UnifiedAction | undefined {
  return state.unifiedActions.find(action => action.actionId === actionId);
}

function runOne(template: UnifiedActionTemplate): LiveProofResult {
  const declared = new Set(systemConnections(template));
  const claims: ProofClaim[] = [];
  const hand = selectHand(template, playMode);

  const claim = (name: ClaimName, status: ClaimStatus, detail: string): void => {
    claims.push({ name, status, detail });
  };

  // ── Precondition: the engine resolves templates by registry lookup ──
  //
  // `resolveUnifiedTemplate` searches the action's own template list and then
  // `getUnifiedTemplateById`. A template in neither can be *staged* — nothing
  // stops `createUnifiedAction` — but it can never advance a step, so it burns
  // the full tick bound and reports `steps_resolved: fail`, which reads exactly
  // like a content defect and is not one. The golden exemplar is deliberately
  // registered in no pool, so this is the first thing anyone copying it hits.
  if (!getUnifiedTemplateById(template.id)) {
    claim(
      'registered',
      'fail',
      'not in UNIFIED_ACTION_TEMPLATES — the engine resolves templates by registry '
        + 'lookup, so this template cannot advance a step in a live world. Register it '
        + '(or prove a registered sibling); a fixture is provable by check:encounter only.',
    );
    return {
      templateId: template.id,
      verdict: 'failed',
      seed,
      ticksSpent: 0,
      committedNudges: hand,
      claims,
    };
  }
  claim('registered', 'pass', 'resolves through getUnifiedTemplateById');

  let world: SpawnedWorld;
  try {
    world = spawnInFreshWorld(template, seed);
  } catch (error) {
    claim('spawn', 'fail', `staging threw: ${error instanceof Error ? error.message : String(error)}`);
    claim('no_tick_crash', 'not_declared', 'never reached — staging failed');
    claim('steps_resolved', 'not_declared', 'never reached — staging failed');
    return {
      templateId: template.id,
      verdict: 'failed',
      seed,
      ticksSpent: 0,
      committedNudges: hand,
      claims,
    };
  }

  const staged = findAction(world.state, world.actionId);
  claim(
    'spawn',
    staged ? 'pass' : 'fail',
    staged
      ? `staged on the ascendant with ${staged.supportBindings?.length ?? 0} support binding(s)`
      : 'action did not appear in state.unifiedActions',
  );

  let state = withCommittedHand(world.state, world.actionId, hand);

  // ── Tick to resolution ──
  let ticksSpent = 0;
  let crashed: string | undefined;
  const runtime = createSimulationRuntime();

  while (ticksSpent < MAX_RESOLUTION_TICKS) {
    const current = findAction(state, world.actionId);
    if (current?.resolved) break;
    try {
      state = runTick(state, [], runtime);
    } catch (error) {
      crashed = error instanceof Error ? error.message : String(error);
      break;
    }
    ticksSpent++;
    // The hand is per-step: re-commit after each tick so a multi-step encounter
    // carries its cards into every step rather than only the first.
    state = withCommittedHand(state, world.actionId, hand);
  }

  claim(
    'no_tick_crash',
    crashed ? 'fail' : 'pass',
    crashed ? `runTick threw: ${crashed}` : `${ticksSpent} tick(s) clean`,
  );

  const resolved = findAction(state, world.actionId);
  const didResolve = Boolean(resolved?.resolved && resolved.outcome);
  claim(
    'steps_resolved',
    didResolve ? 'pass' : 'fail',
    didResolve
      ? `resolved '${resolved?.outcome}' after ${ticksSpent} tick(s), `
        + `${resolved?.stepOutcomes.length ?? 0} step outcome(s)`
      : `unresolved after ${ticksSpent} tick(s) (bound ${MAX_RESOLUTION_TICKS})`,
  );

  // ── Delivery claims, each gated on the declaration ──

  const nudgeBearing = plainSteps(template).some(step => (step.nudges ?? []).length > 0);
  if (!nudgeBearing) {
    claim('hand_committed', 'not_declared', 'no step authors a nudge hand');
  } else if (playMode === 'none') {
    claim('hand_committed', 'not_declared', '--play none: no hand committed this run');
  } else {
    // Proof of arrival is the *named* modifier channel: a committed card that
    // moved nothing is a card the resolver never saw.
    const sawNudge = (resolved?.stepOutcomes.length ?? 0) > 0 && hand.length > 0;
    claim(
      'hand_committed',
      sawNudge ? 'pass' : 'fail',
      sawNudge
        ? `committed ${hand.length} card(s): ${hand.join(', ')}`
        : `committed ${hand.length} card(s) but no step outcome recorded them`,
    );
  }

  const config = template.aftermathConfig;
  const summary = resolved?.aftermathSummary;
  if (!config) {
    claim('aftermath_rendered', 'not_declared', 'template authors no aftermathConfig');
    claim('aftermath_variant', 'not_declared', 'template authors no aftermathConfig');
    claim('concepts_declared', 'not_declared', 'template authors no aftermathConfig');
  } else {
    claim(
      'aftermath_rendered',
      summary ? 'pass' : 'fail',
      summary
        ? `overview rendered (${summary.overview.length} chars), ${summary.changes.length} change(s)`
        : 'no aftermathSummary on the resolved action',
    );

    // The THR-989 class, stated exactly: a keyed variant is only reachable when
    // the branch step recorded a choiceId that `variants` keys. Reading the
    // choice history is how we tell a variant that *rendered* from a fallback
    // wearing the outcome band's clothes — the summary itself records neither.
    const variantKeys = Object.keys(config.variants ?? {});
    if (variantKeys.length === 0) {
      claim('aftermath_variant', 'not_declared', 'aftermathConfig authors a fallback only');
    } else {
      const branchChoice = resolved?.choiceHistory?.find(
        memory => memory.stepIndex === config.branchOnStep,
      );
      const tookVariant = branchChoice !== undefined && config.variants[branchChoice.choiceId] !== undefined;
      claim(
        'aftermath_variant',
        tookVariant ? 'pass' : 'fail',
        tookVariant
          ? `took variant '${branchChoice?.choiceId}' (of ${variantKeys.join(', ')})`
          : `fell back — step ${config.branchOnStep} recorded `
            + `${branchChoice ? `'${branchChoice.choiceId}', which no variant keys` : 'no choice'}; `
            + `authored variants: ${variantKeys.join(', ')}`,
      );
    }

    const changes = summary?.changes ?? [];
    if (changes.length === 0) {
      claim('concepts_declared', 'not_declared', 'aftermath rendered no changes to carry concepts');
    } else {
      const missing = changes.filter(change => (change.concepts ?? []).length === 0);
      claim(
        'concepts_declared',
        missing.length === 0 ? 'pass' : 'fail',
        missing.length === 0
          ? `all ${changes.length} change(s) carry concepts`
          : `${missing.length} of ${changes.length} change(s) carry no concepts (Law 2)`,
      );
    }
  }

  if (!declared.has('cast')) {
    claim('cast_bound', 'not_declared', 'template declares no cast');
  } else {
    const bindings = resolved?.supportBindings ?? staged?.supportBindings ?? [];
    const actors = bindings.filter(binding => binding.kind === 'actor');
    claim(
      'cast_bound',
      actors.length > 0 ? 'pass' : 'fail',
      actors.length > 0
        ? `${actors.length} cast member(s) bound to live actors`
        : 'support bundle declares cast but bound no actor in the live world',
    );
  }

  if (!declared.has('rewards')) {
    claim('reward_node', 'not_declared', 'template declares no reward or persistent consequence');
  } else {
    const persistent = (summary?.changes ?? []).filter(
      change => change.kind === 'item' || change.kind === 'trait',
    );
    claim(
      'reward_node',
      persistent.length > 0 ? 'pass' : 'fail',
      persistent.length > 0
        ? `${persistent.length} persistent change(s) landed: `
          + persistent.map(change => change.kind).join(', ')
        : 'declared a reward but the resolved aftermath left nothing persistent',
    );
  }

  if (!declared.has('seeds')) {
    claim('seed_planted', 'not_declared', 'template declares no encounter seed');
  } else {
    const planted = (state.pendingEncounterSeeds ?? []).filter(
      seedEntry => seedEntry.sourceEncounterId === template.id,
    );
    claim(
      'seed_planted',
      planted.length > 0 ? 'pass' : 'fail',
      planted.length > 0
        ? `${planted.length} seed(s) in pendingEncounterSeeds: `
          + planted.map(entry => entry.seedLabel).join(', ')
        : 'declared a seed effect but pendingEncounterSeeds carries none from this encounter',
    );
  }

  if (!declared.has('conditions')) {
    claim('condition_applied', 'not_declared', 'template declares no condition effect');
  } else {
    const conditions = (summary?.changes ?? []).filter(change => change.kind === 'trait');
    claim(
      'condition_applied',
      conditions.length > 0 ? 'pass' : 'fail',
      conditions.length > 0
        ? `${conditions.length} condition/trait change(s) applied`
        : 'declared a condition effect but none applied on this outcome',
    );
  }

  const verdict = computeVerdict(claims);

  return {
    templateId: template.id,
    verdict,
    seed,
    outcome: resolved?.outcome,
    resolvedAtTick: resolved?.completedAtTick,
    ticksSpent,
    committedNudges: hand,
    claims,
  };
}

// ─── Population ──────────────────────────────────────────────────────

const byId = new Map(UNIFIED_ACTION_TEMPLATES.map(template => [template.id, template]));
// Addressable but never corpus — the same contract `check:encounter` draws.
byId.set(NUDGE_GOLDEN_EXEMPLAR.id, NUDGE_GOLDEN_EXEMPLAR);

const missing: string[] = [];
const population: UnifiedActionTemplate[] = [];

if (wantsAll) {
  population.push(
    ...UNIFIED_ACTION_TEMPLATES.filter(template =>
      ENCOUNTER_ID_PREFIXES.some(prefix => template.id.startsWith(prefix)),
    ),
  );
} else {
  for (const id of explicitIds) {
    const template = byId.get(id);
    if (template) population.push(template);
    else missing.push(id);
  }
}

const results = population.map(runOne);
const failures = results.filter(result => result.verdict === 'failed');
const vacuous = results.filter(result => result.verdict === 'vacuous');
const proved = results.filter(result => result.verdict === 'proved');

// ─── Report ──────────────────────────────────────────────────────────

const VERDICT_BADGE: Readonly<Record<ProofVerdict, string>> = {
  proved: '✓',
  failed: '✗',
  vacuous: '○',
};

if (wantsJson) {
  console.log(
    JSON.stringify(
      {
        seed,
        mapSize,
        playMode,
        checked: results.length,
        proved: proved.length,
        failed: failures.length,
        vacuous: vacuous.length,
        missing,
        results,
      },
      null,
      2,
    ),
  );
} else {
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  check:encounter-live — Stage 4 live proof');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  seed ${seed}   map ${mapSize}   play ${playMode}`);
  console.log(
    `  checked ${results.length}   proved ${proved.length}   `
      + `failed ${failures.length}   vacuous ${vacuous.length}`,
  );
  console.log('');

  for (const result of results) {
    const badge = VERDICT_BADGE[result.verdict];
    const outcome = result.outcome ? ` → ${result.outcome}` : '';
    console.log(`  ${badge} ${result.templateId}${outcome}`);
    for (const entry of result.claims) {
      if (entry.status === 'pass') continue;
      const mark = entry.status === 'fail' ? '✗' : '·';
      console.log(`      ${mark} [${entry.name}] ${entry.detail}`);
    }
  }
  console.log('');

  if (vacuous.length > 0) {
    console.log(`  ── Vacuous (${vacuous.length}) ──`);
    console.log('  These ran clean and proved nothing: they declare no cast, reward,');
    console.log('  seed, condition or reachable aftermath variant, so every claim this');
    console.log('  stage could make was skipped. Not a failure here — it is');
    console.log('  check:encounter that refuses a template declaring too little.');
    for (const result of vacuous) console.log(`  ○ ${result.templateId}`);
    console.log('');
  }

  if (missing.length > 0) {
    console.log(`  ── Unresolved ids (${missing.length}) ──`);
    for (const id of missing) console.log(`  ! ${id}`);
    console.log('');
  }

  console.log(`  ${failures.length === 0 && missing.length === 0 ? 'OK' : 'FAILURES PRESENT'}`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');
}

process.exit(failures.length > 0 || missing.length > 0 ? 1 : 0);
