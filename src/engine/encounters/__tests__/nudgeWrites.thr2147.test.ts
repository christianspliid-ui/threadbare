/**
 * THR-2147 (plan THR-2146 E3) — a played card's write reaches the Aftermath.
 *
 * Each test plays a real library card through the real dispatcher and asserts
 * two things: a `nudgeWrites` record exists, and `buildNudgeWriteChanges` turns
 * it into a chip naming the mortal and the thing. A removal that finds nothing
 * records nothing (Law 56), and `hidden_mark` never records.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { dispatchNudgeCommitments } from '../nudgeDispatch';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import { buildNudgeWriteChanges } from '../../views/stage/buildNudgeWriteChanges';
import { buildFightChipWorld } from '../../views/stage/chipCollaborators';
import { PLAY_PROFILES } from '../../../data/nudge-card-library';
import { allSpellDefinitionNodes } from '../../../data/spell-templates';
import { allStrainConditionNodes } from '../../../data/strain-conditions';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { buildSpellLibrary } from '../../spellGenerator/spellLibrary';
import { createDoomClockState } from '../../doomClock';
import type { GameState } from '../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction } from '../../../types/unifiedAction';

const ACTOR = 'actor-elara';
const TICK = 50;

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ACTOR, type: 'actor', name: 'Elara', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-hold', type: 'location', name: 'The Hold', properties: { hexCol: 4, hexRow: 4 } });
  graph.addEdge({ id: 'elara_at_hold', source: ACTOR, target: 'loc-hold', type: 'located_at', properties: {} });
  graph.addNode({ id: 'trait.condition.wounded', type: 'trait', name: 'Wounded', properties: {} });
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
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
    hiddenMarks: [], emittedOmens: [], plantedCompulsions: [],
    regionalDetectionPressure: [],
  } as unknown as GameState;
}

function wound(state: GameState, edgeId = 'elara_wounded'): void {
  state.graph.addEdge({
    id: edgeId, source: ACTOR, target: 'trait.condition.wounded', type: 'has_trait',
    properties: { appliedAt: TICK - 1 },
  });
}

const ACTION = {
  actionId: 'ua_test', actorId: ACTOR, templateId: 'enc.test', targetId: ACTOR,
  scale: 'personal', source: 'agent',
  startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
  resolved: true, outcome: 'success', stepOutcomes: [],
} as unknown as UnifiedAction;

/** The library card as an authored step option, exactly as the deal mints it. */
function libraryCard(libraryCardId: string): StepNudge {
  const profile = PLAY_PROFILES[libraryCardId];
  if (!profile) throw new Error(`no play profile for ${libraryCardId}`);
  return {
    id: `dealt.${libraryCardId}`,
    libraryCardId,
    name: libraryCardId,
    essenceCost: profile.essenceCost,
    forecastDelta: profile.forecastDelta,
    effectLine: profile.effectLine,
    ...(profile.grants ? { grants: profile.grants } : {}),
  } as StepNudge;
}

function play(state: GameState, card: StepNudge, runtime: SimulationRuntime) {
  const step = { nudges: [card] } as Pick<ActionStep, 'nudges'>;
  return dispatchNudgeCommitments(state, ACTION, step, [card.id], TICK, runtime);
}

describe('THR-2147 — a played card’s write reaches the Aftermath', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });

  it('Balm on a Wounded mortal records exactly one write, and the chip names both', () => {
    const state = buildState();
    wound(state);
    const result = play(state, libraryCard('card.balm.signature.life'), runtime);
    expect(result.nudgeWrites).toEqual([{
      cardId: 'dealt.card.balm.signature.life',
      kind: 'remove_condition',
      targetId: ACTOR,
      refId: 'trait.condition.wounded',
    }]);
    const [chip, ...rest] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    expect(rest).toHaveLength(0);
    expect(chip.title).toBe('Wounded');
    expect(chip.detail).toBe('Elara is no longer wounded.');
    expect(chip.category).toBe('boon');
    expect(chip.stateNoun?.entityId).toBe('trait.condition.wounded');
  });

  it('a removal that found nothing records nothing (Law 56)', () => {
    const state = buildState(); // not wounded
    const result = play(state, libraryCard('card.balm.signature.life'), runtime);
    expect(result.nudgeWrites).toEqual([]);
  });

  it('Cache leaves an item the chip names', () => {
    const result = play(buildState(), libraryCard('card.cache.signature.matter'), runtime);
    expect(result.nudgeWrites).toHaveLength(1);
    const write = result.nudgeWrites[0];
    expect(write.kind).toBe('spawn_artifact');
    expect(result.state.graph.getNode(write.refId!)).toBeDefined();
    const [chip] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    const itemName = result.state.graph.getNode(write.refId!)!.name;
    expect(chip.kind).toBe('item');
    expect(chip.detail).toBe(`Elara finds ${itemName}.`);
  });

  it('Kindled Ambition wakes an ambition the chip names', () => {
    const result = play(buildState(), libraryCard('card.kindled_ambition.signature.spirit'), runtime);
    expect(result.nudgeWrites).toEqual([expect.objectContaining({
      kind: 'assign_ambition', targetId: ACTOR, refId: 'ambition_great_work',
    })]);
    const [chip] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    expect(chip.detail).toBe('A new ambition wakes in Elara: Build a Great Work.');
  });

  it('Compulsion plants an urge the chip names', () => {
    const result = play(buildState(), libraryCard('card.compulsion.signature.mind'), runtime);
    expect(result.nudgeWrites).toEqual([expect.objectContaining({
      kind: 'plant_compulsion', targetId: ACTOR, refId: 'explore',
    })]);
    const [chip] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    expect(chip.detail).toBe('An urge toward the open road takes root in Elara.');
  });

  it('Omen plants an omen the chip names on the mortal', () => {
    const result = play(buildState(), libraryCard('card.omen.signature.time'), runtime);
    expect(result.nudgeWrites).toEqual([expect.objectContaining({ kind: 'emit_omen', targetId: ACTOR })]);
    const [chip] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    expect(chip.detail).toBe('An omen bends what Elara meets next.');
  });

  it('Favour records a debt the chip names', () => {
    const result = play(buildState(), libraryCard('card.favor.signature.order'), runtime);
    expect(result.nudgeWrites).toEqual([expect.objectContaining({ kind: 'favor_creation', targetId: ACTOR })]);
    const [chip] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    expect(chip.detail).toBe('Elara owes a favour.');
  });

  it('Word Left Behind teaches a spell the chip names', () => {
    // The teaching seam needs the god, the spell definitions and a library to pick from.
    const state = buildState();
    const graph = state.graph;
    for (const node of allSpellDefinitionNodes()) if (!graph.getNode(node.id)) graph.addNode(node);
    for (const node of allStrainConditionNodes()) if (!graph.getNode(node.id)) graph.addNode(node);
    for (const node of CONDITION_TRAIT_DEFINITIONS) if (!graph.getNode(node.id)) graph.addNode(node);
    const elara = graph.getNode(ACTOR)!;
    elara.properties = {
      ...elara.properties,
      domainCapabilities: { iron: 60, gold: 60, shadow: 60, veil: 60, heart: 60, eye: 60, stone: 60, star: 60 },
      quintessence: 0.8, quintessenceMax: 1,
    };
    graph.addNode({ id: 'asc-1', name: 'The Quiet God', type: 'actor', properties: { actorType: 'ascendant', sphereAlignment: { primary: 'mind', secondary: 'life' } } });
    buildSpellLibrary(graph, 42);
    const taughtState = {
      ...state, ascendantId: 'asc-1', pendingEncounterSeeds: [],
      doomClock: createDoomClockState('erosion' as never, 1000),
    } as GameState;
    const result = play(taughtState, libraryCard('card.cache.variation.spirit'), runtime);
    expect(result.nudgeWrites).toHaveLength(1);
    const write = result.nudgeWrites[0];
    expect(write.kind).toBe('spell_grant');
    const spellName = result.state.graph.getNode(write.refId!)?.name;
    expect(spellName).toBeTruthy();
    const [chip] = buildNudgeWriteChanges(result.nudgeWrites, buildFightChipWorld(result.state.graph));
    expect(chip.detail).toBe(`Elara learns ${spellName}.`);
  });

  it('two Cache cards in one hand each leave their own item (no id collision)', () => {
    const state = buildState();
    const a = libraryCard('card.cache.signature.matter');
    const b = libraryCard('card.cache.hunger.gather');
    const step = { nudges: [a, b] } as Pick<ActionStep, 'nudges'>;
    const result = dispatchNudgeCommitments(state, ACTION, step, [a.id, b.id], TICK, runtime);
    expect(result.nudgeWrites.map((w) => w.cardId)).toEqual([a.id, b.id]);
    expect(new Set(result.nudgeWrites.map((w) => w.refId)).size).toBe(2);
  });

  it('a hidden mark is never recorded — the Long Game stays hidden', () => {
    const result = play(buildState(), libraryCard('card.long_game.hunger.sever'), runtime);
    expect(result.state.hiddenMarks?.length ?? 0).toBeGreaterThan(0);
    expect(result.nudgeWrites).toEqual([]);
  });

  it('a record whose mortal no longer resolves draws no chip (fail-open)', () => {
    const state = buildState();
    const chips = buildNudgeWriteChanges(
      [{ cardId: 'x', kind: 'remove_condition', targetId: 'gone', refId: 'trait.condition.wounded' }],
      buildFightChipWorld(state.graph),
    );
    expect(chips).toEqual([]);
  });
});
