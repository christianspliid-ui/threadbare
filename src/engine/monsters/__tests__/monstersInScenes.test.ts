/**
 * THR-1545 — Monsters M2: monsters in scenes (plan doc
 * `Docs/plans/2026-09-23-monsters-as-opponents.md` § Engine 4 + § Encounter templates).
 *
 * Covers the slice's Done-when: the `matchProperty` cast binding (and that it never
 * materializes), the liveness filter on every spec, the scored-binder routing, the
 * `requiresLiveMonster` draw gate on both draw paths, `{target:family}`, and the
 * rewritten `monster.hunt.named_elite` — its return seed, and both death windows.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { prepareEncounterSupportBundle } from '../../encounterSupportBundle';
import { filterByPrerequisites } from '../../encounterFilterPipeline';
import { generateUnifiedCandidates } from '../../unifiedCandidates';
import { liveLairMonsterAt, hasLiveLairMonsterAt } from '../liveMonster';
import { enrichProse, resolveSceneTargetContext, type NarrativeContext } from '../../proseEnrichment';
import { evaluateEncounterSeeds } from '../../encounterSeeding';
import { applyEncounterAftermathReaction } from '../../encounterAftermath';
import { executeStepResult, resolveUncontestedStep } from '../../unifiedActionResolution';
import { createSimulationRuntime } from '../../simulationRuntime';
import { resetUnifiedActionCounter } from '../../unifiedActionLifecycle';
import { createBindingIndex } from '../../binding/bindingRegistry';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { FIGHT_END_BRANCHES } from '../../fights/fightOutcome';
import { MONSTER_HUNT_NAMED_ELITE } from '../../../data/monster-encounter-content';
import { FIGHT_LAIR_CONFRONT } from '../../../data/encounters/fight-lair-confront';
import { MONSTER_FAMILIES } from '../../../data/monster-families';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import type { EncounterCacheEntry } from '../../encounterCache';
import type { GameState } from '../../../types/gameState';
import type { EncounterSupportBinding } from '../../../types/encounter';
import type {
  EncounterAftermathReaction,
  PendingEncounterSeed,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';

const HUNT_ID = 'monster.hunt.named_elite';
const TICK = 100;
const midRng = () => 0.5;

// ─── Fixture ────────────────────────────────────────────────────

function baseState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    pendingEncounterSeeds: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
    pendingQuintessenceEvents: [],
    effectStates: new Map(),
    ...overrides,
  } as unknown as GameState;
}

const MONSTER_STATE = {
  family: 'beast', dread: 'fair', might: 'steep', nerveReach: 'heart', clashReach: 'iron',
  clockSize: 4, clockFilled: 0, clockUpdatedTick: 0, temperShown: false,
};

/**
 * A major lair holding its named monster, a place inside the lair, a hunter standing
 * in the lair, and a settlement elsewhere. `elite: false` leaves the lair without one.
 */
function lairWorld(opts: { elite?: boolean; eliteDeceased?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'lair', type: 'location', name: 'The Black Den',
    properties: {
      locationSubtype: 'lair', locationType: 'lair', lairTier: 'major', hexCol: 3, hexRow: 3,
      ...(opts.elite === false ? {} : { namedEliteId: 'beast' }),
    },
  });
  graph.addNode({
    id: 'lair-cave', type: 'location', name: 'Inner Cave',
    properties: { parentLocationId: 'lair', sublocationTypeId: 'sublocation-type.cave', hexCol: 3, hexRow: 3 },
  });
  graph.addEdge({ id: 'e.lair.cave', source: 'lair', target: 'lair-cave', type: 'contains', properties: {} });
  graph.addNode({
    id: 'town', type: 'location', name: 'Millbrook',
    properties: { locationSubtype: 'village', hexCol: 8, hexRow: 8 },
  });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 14, heart: 14, eye: 14 },
      axiologicalProfile: { courage_prudence: 0.8 },
    },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'lair', type: 'located_at', properties: {} });
  if (opts.elite !== false) {
    graph.addNode({
      id: 'beast', type: 'actor', name: 'Grakk the Hollow',
      properties: {
        actorType: 'individual', isMonsterElite: true, monsterState: { ...MONSTER_STATE },
        domainCapabilities: { iron: 10 },
        ...(opts.eliteDeceased ? { deceased: true } : {}),
      },
    });
    graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'lair', type: 'located_at', properties: {} });
  }
  return graph;
}

function actorSpecTemplate(
  spec: Record<string, unknown>,
  extra: Partial<UnifiedActionTemplate> = {},
): UnifiedActionTemplate {
  return {
    id: 'test.cast', name: 'Cast Test', rarityTier: 1, intrinsicTier: 'background',
    reach: 'iron', crudType: 'update', scale: 'local', apCost: 1, steps: [],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'i', success: 's', failure: 'f' },
    supportBundle: [{ kind: 'actor', delivery: 'lazy-materialize-on-trigger', persistence: 'scene-only', supportRole: 'guard', spawnNpcRole: 'guard', ...spec }],
    ...extra,
  } as unknown as UnifiedActionTemplate;
}

const BEAST_SPEC = { key: 'beast', matchProperty: { key: 'isMonsterElite', value: true } };

function huntAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_hunt', actorId: 'hero', templateId: HUNT_ID, targetId: 'lair',
    scale: 'local', source: 'agent',
    startTick: 90, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function runStep(state: GameState, a: UnifiedAction, tpl: UnifiedActionTemplate, outcome: StepOutcome): UnifiedAction {
  return executeStepResult(
    a, tpl, outcome, [], state, midRng, state.tick,
    { capability: 0.5, probability: 0.5, roll: 50 },
  ).updatedAction;
}

const tracesOf = (category: string) =>
  getTraces().filter((t) => t.category === category) as unknown as Array<Record<string, any>>;

beforeEach(() => { clearTraces(); enableTracing(); resetUnifiedActionCounter(); });
afterEach(() => { clearTraces(); disableTracing(); FIGHT_END_BRANCHES.length = 0; });

// ─── Cast binding ───────────────────────────────────────────────

describe('matchProperty binds the living monster and never materializes', () => {
  it('binds the monster standing at the encounter location', () => {
    const state = baseState(lairWorld());
    const bindings = prepareEncounterSupportBundle(state, actorSpecTemplate(BEAST_SPEC), 'lair');
    expect(bindings).toEqual([expect.objectContaining({ key: 'beast', nodeId: 'beast', reused: true })]);
  });

  it('a place inside the lair anchors to the lair and still binds the monster', () => {
    const state = baseState(lairWorld());
    const bindings = prepareEncounterSupportBundle(state, actorSpecTemplate(BEAST_SPEC), 'lair-cave');
    expect(bindings.map(b => b.nodeId)).toEqual(['beast']);
  });

  it('no monster present: the key stays unbound and nothing is minted, whatever the delivery', () => {
    for (const delivery of ['lazy-materialize-on-trigger', 'pre-seeded'] as const) {
      const graph = lairWorld({ elite: false });
      const nodesBefore = graph.getNodesByType('actor').length;
      const bindings = prepareEncounterSupportBundle(baseState(graph), actorSpecTemplate({ ...BEAST_SPEC, delivery }), 'lair');
      expect(bindings).toEqual([]);
      expect(graph.getNodesByType('actor').length).toBe(nodesBefore);
    }
  });

  it('a scored-binder template with a matchProperty spec binds the monster through the legacy route', () => {
    const state = baseState(lairWorld());
    const binder = { census: null, index: createBindingIndex(), bindings: [], actorId: 'hero' };
    const bindings = prepareEncounterSupportBundle(
      state, actorSpecTemplate(BEAST_SPEC, { useScoredBinder: true }), 'lair', undefined, binder,
    );
    expect(bindings.map(b => b.nodeId)).toEqual(['beast']);
    // The legacy route writes no ledger row.
    expect(binder.bindings).toHaveLength(0);
  });
});

describe('no spec ever binds a deceased node', () => {
  it('a felled monster\'s body is not cast as the beast', () => {
    const state = baseState(lairWorld({ eliteDeceased: true }));
    expect(prepareEncounterSupportBundle(state, actorSpecTemplate(BEAST_SPEC), 'lair')).toEqual([]);
  });

  it('a dead mortal holding the reusable role is not cast; a living one is', () => {
    const graph = lairWorld({ elite: false });
    graph.addNode({ id: 'dead-guard', type: 'actor', name: 'Dead Guard', properties: { actorType: 'individual', npcRole: 'guard', deceased: true } });
    graph.addEdge({ id: 'e.dg.at', source: 'dead-guard', target: 'town', type: 'located_at', properties: {} });
    const tpl = actorSpecTemplate({ key: 'guard', reuseNpcRoles: ['guard'], delivery: 'pre-seeded' });
    expect(prepareEncounterSupportBundle(baseState(graph), tpl, 'town')).toEqual([]);

    graph.addNode({ id: 'live-guard', type: 'actor', name: 'Live Guard', properties: { actorType: 'individual', npcRole: 'guard' } });
    graph.addEdge({ id: 'e.lg.at', source: 'live-guard', target: 'town', type: 'located_at', properties: {} });
    expect(prepareEncounterSupportBundle(baseState(graph), tpl, 'town').map(b => b.nodeId)).toEqual(['live-guard']);
  });

  it('a dead actor carrying the support role is not reused', () => {
    const graph = lairWorld({ elite: false });
    graph.addNode({ id: 'dead-sup', type: 'actor', name: 'Old Guard', properties: { actorType: 'individual', encounterSupportRole: 'guard', status: 'dead' } });
    graph.addEdge({ id: 'e.ds.at', source: 'dead-sup', target: 'town', type: 'located_at', properties: {} });
    const bindings = prepareEncounterSupportBundle(baseState(graph), actorSpecTemplate({ key: 'guard' }), 'town');
    expect(bindings).toHaveLength(1);
    expect(bindings[0].nodeId).not.toBe('dead-sup');
    expect(bindings[0].reused).toBe(false);
  });
});

describe('the role-match branches never bind a monster', () => {
  it('a monster carrying the reusable role or the support role is passed over', () => {
    const graph = lairWorld();
    const beast = graph.getNode('beast')!;
    beast.properties.npcRole = 'guard';
    beast.properties.encounterSupportRole = 'guard';
    const tpl = actorSpecTemplate({ key: 'guard', reuseNpcRoles: ['guard'], delivery: 'pre-seeded' });
    expect(prepareEncounterSupportBundle(baseState(graph), tpl, 'lair')).toEqual([]);
  });
});

// ─── The draw gate ──────────────────────────────────────────────

describe('requiresLiveMonster hides the hunt where there is no living monster', () => {
  it('the hunt template declares the gate and the cast', () => {
    const tpl = getUnifiedTemplateById(HUNT_ID)!;
    expect(tpl.requiresLiveMonster).toBe(true);
    expect(tpl.supportBundle).toEqual([expect.objectContaining({ key: 'beast', matchProperty: { key: 'isMonsterElite', value: true } })]);
  });

  it('liveLairMonsterAt: the lair and a place inside it resolve; a dead, absent or cleared elite does not', () => {
    expect(liveLairMonsterAt(lairWorld(), 'lair')?.id).toBe('beast');
    expect(liveLairMonsterAt(lairWorld(), 'lair-cave')?.id).toBe('beast');
    expect(hasLiveLairMonsterAt(lairWorld({ eliteDeceased: true }), 'lair')).toBe(false);
    expect(hasLiveLairMonsterAt(lairWorld({ elite: false }), 'lair')).toBe(false);
    expect(hasLiveLairMonsterAt(lairWorld(), 'town')).toBe(false);
    expect(hasLiveLairMonsterAt(lairWorld(), 'nowhere')).toBe(false);
    const cleared = lairWorld();
    cleared.getNode('lair')!.properties.locationSubtype = 'cleared_lair';
    expect(hasLiveLairMonsterAt(cleared, 'lair')).toBe(false);
    const dangling = lairWorld();
    dangling.getNode('lair')!.properties.namedEliteId = 'ghost';
    expect(hasLiveLairMonsterAt(dangling, 'lair')).toBe(false);
  });

  const entry = (locationId: string) => ({ templateId: HUNT_ID, locationId, sublocationId: null } as unknown as EncounterCacheEntry);

  it('filter pipeline: offered at a lair with a living elite, hidden at a dead or absent one', () => {
    const kept = (graph: WorldGraph) => filterByPrerequisites([entry('lair')], 'hero', graph).length;
    expect(kept(lairWorld())).toBe(1);
    expect(kept(lairWorld({ eliteDeceased: true }))).toBe(0);
    expect(kept(lairWorld({ elite: false }))).toBe(0);
  });

  it('unified candidates: the same gate on the array-scored path', () => {
    const offered = (graph: WorldGraph) =>
      generateUnifiedCandidates(graph, 'hero', 'lair', [MONSTER_HUNT_NAMED_ELITE]).map(c => c.templateId);
    expect(offered(lairWorld())).toEqual([HUNT_ID]);
    expect(offered(lairWorld({ eliteDeceased: true }))).toEqual([]);
    expect(offered(lairWorld({ elite: false }))).toEqual([]);
  });
});

// ─── {target:family} ────────────────────────────────────────────

function proseCtx(graph: WorldGraph, targetId: string): NarrativeContext {
  return {
    agentName: 'Hero', agentId: 'hero', archetypeId: 'a', cultureName: 'c', primaryReach: 'iron',
    titles: [], notableArtifacts: [], strongAllies: [], rivals: [],
    currentLocationName: 'The Black Den', completedPhases: [], beatHistory: [],
    pronouns: { they: 'they', them: 'them', their: 'their', s: '' },
    target: resolveSceneTargetContext(graph, 'hero', targetId),
  } as NarrativeContext;
}

describe('{target:family}', () => {
  const line = 'Inside, {target} is waiting.{?target_has_family} It is {target:family}.{/target_has_family}';

  it('resolves to the family card line for a monster target', () => {
    const out = enrichProse(line, proseCtx(lairWorld(), 'beast'));
    expect(out).toBe(`Inside, Grakk the Hollow is waiting. It is ${MONSTER_FAMILIES.beast.cardLine}.`);
    expect(enrichProse('{target:family}', proseCtx(lairWorld(), 'beast'))).toBe(MONSTER_FAMILIES.beast.cardLine);
  });

  it('strips cleanly for a mortal target, a place target and no target', () => {
    const graph = lairWorld();
    graph.addNode({ id: 'mortal', type: 'actor', name: 'Tam', properties: { actorType: 'individual' } });
    expect(enrichProse(line, proseCtx(graph, 'mortal'))).toBe('Inside, Tam is waiting.');
    expect(enrichProse(line, proseCtx(graph, 'town'))).toBe('Inside, Millbrook is waiting.');
    expect(enrichProse('[{target:family}]', proseCtx(graph, 'hero'))).toBe('[]');
  });

  it('fight.lair.confront opens with the family line', () => {
    const nerve = FIGHT_LAIR_CONFRONT.steps[0].narrativeTemplate!;
    expect(nerve).toContain('{target:family}');
    expect(enrichProse(nerve, proseCtx(lairWorld(), 'beast'))).toContain(MONSTER_FAMILIES.beast.cardLine);
  });
});

// ─── The hunt and its return seed ───────────────────────────────

const RETURN_ID = 'named_elite_creature_returns';
const variants = MONSTER_HUNT_NAMED_ELITE.aftermathConfig!.variants;
const reactionIds = (key: string) => (variants[key]?.reactions ?? []).map(r => r.id);

describe('monster.hunt.named_elite — the fight and its return seed', () => {
  it('its climax is a fight block against the cast beast', () => {
    const fight = MONSTER_HUNT_NAMED_ELITE.steps.filter(s => s.fightRole !== undefined);
    expect(fight.length).toBeGreaterThan(1);
    expect(fight.every(s => s.opponentRef === 'beast')).toBe(true);
    expect(MONSTER_HUNT_NAMED_ELITE.aftermathConfig!.branchOnStep).toBe(MONSTER_HUNT_NAMED_ELITE.steps.length);
  });

  it('the fight:overcome variant plants no return seed; every result that leaves the beast alive does', () => {
    expect(reactionIds('fight:overcome')).not.toContain(RETURN_ID);
    for (const r of ['driven_off', 'bargained', 'yielded', 'routed', 'struck_down', 'broke_off']) {
      expect(reactionIds(`fight:${r}`), r).toContain(RETURN_ID);
    }
  });

  it('the return seed inherits context', () => {
    const reaction = variants['fight:driven_off'].reactions!.find(r => r.id === RETURN_ID)!;
    expect(reaction.effects[0]).toMatchObject({ kind: 'encounter_seed', templateId: HUNT_ID, inheritContext: true });
  });

  it('the return seed is planted with the lair target and the beast binding, and spawns the hunt carrying both', () => {
    const graph = lairWorld();
    const runtime = createSimulationRuntime();
    const state = baseState(graph);
    const beastBinding = prepareEncounterSupportBundle(state, MONSTER_HUNT_NAMED_ELITE, 'lair');
    const source = huntAction({ resolved: true, supportBindings: beastBinding });
    const reaction = variants['fight:driven_off'].reactions!.find(r => r.id === RETURN_ID)! as EncounterAftermathReaction;

    const planted = applyEncounterAftermathReaction(state, source, reaction, TICK, runtime).state;
    const seed = planted.pendingEncounterSeeds![0];
    expect(seed).toMatchObject({ templateId: HUNT_ID, inheritedTargetId: 'lair' });
    expect(seed.inheritedBindings).toEqual([expect.objectContaining({ key: 'beast', nodeId: 'beast' })]);

    const spawnedState = evaluateEncounterSeeds(planted, seed.eligibleAfterTick, midRng);
    const spawned = spawnedState.unifiedActions.find(a => a.templateId === HUNT_ID)!;
    expect(spawned).toBeDefined();
    expect(spawned.targetId).toBe('lair');
    expect(spawned.supportBindings).toEqual([expect.objectContaining({ key: 'beast', nodeId: 'beast' })]);
  });
});

describe('both death windows', () => {
  const beastSeed = (bindings: EncounterSupportBinding[]): PendingEncounterSeed => ({
    seedId: 'seed_hunt_return', sourceEncounterId: HUNT_ID, sourceReactionId: RETURN_ID,
    templateId: HUNT_ID, targetAgentId: 'hero', eligibleAfterTick: TICK, priority: 1.1,
    seedLabel: 'The named beast has been seen again', plantedTick: TICK - 35,
    inheritedTargetId: 'lair', inheritedBindings: bindings,
  });

  /** Spawn the hunt from its return seed, then resolve its tracking step. */
  function spawnAndTrack(graph: WorldGraph, killBeforeSpawn: boolean): { state: GameState; action: UnifiedAction } {
    const bindings = prepareEncounterSupportBundle(baseState(graph), MONSTER_HUNT_NAMED_ELITE, 'lair');
    expect(bindings.map(b => b.nodeId)).toEqual(['beast']);
    if (killBeforeSpawn) graph.getNode('beast')!.properties.deceased = true;
    const seeded = evaluateEncounterSeeds(baseState(graph, { pendingEncounterSeeds: [beastSeed(bindings)] }), TICK, midRng);
    const spawned = seeded.unifiedActions.find(a => a.templateId === HUNT_ID)!;
    expect(spawned.targetId).toBe('lair');
    const state = baseState(graph);
    const tracked = runStep(state, { ...spawned, stepProgress: 1, stepDuration: 1 }, MONSTER_HUNT_NAMED_ELITE, 'success');
    expect(tracked.resolved).toBe(false);
    expect(MONSTER_HUNT_NAMED_ELITE.steps[tracked.currentStep].fightRole).toBe('nerve');
    return { state, action: tracked };
  }

  it('a beast that died before the seed spawned arrives unbound and the fight ends no_opponent', () => {
    const graph = lairWorld();
    const { state, action } = spawnAndTrack(graph, true);
    expect(action.supportBindings ?? []).toEqual([]);
    const r = resolveUncontestedStep(action, MONSTER_HUNT_NAMED_ELITE, state, () => { throw new Error('rolled'); });
    expect(r.fightEnd).toEqual({ reason: 'no_opponent' });
  });

  it('a beast that died after the spawn ends the fight opponent_gone', () => {
    const graph = lairWorld();
    const { state, action } = spawnAndTrack(graph, false);
    expect(action.supportBindings).toEqual([expect.objectContaining({ key: 'beast', nodeId: 'beast' })]);
    graph.getNode('beast')!.properties.deceased = true;
    const r = resolveUncontestedStep(action, MONSTER_HUNT_NAMED_ELITE, state, midRng);
    expect(r.fightEnd).toEqual({ reason: 'opponent_gone' });
  });

  it('control: a living beast is fought — the fight step names it as the opponent', () => {
    const graph = lairWorld();
    const { state, action } = spawnAndTrack(graph, false);
    const r = resolveUncontestedStep(action, MONSTER_HUNT_NAMED_ELITE, state, midRng);
    expect(r.fightEnd).toBeUndefined();
    const steps = tracesOf('fight.step');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].opponentId).toBe('beast');
  });
});
