/**
 * THR-2258 — Aftermath rows say what happened (cold playtest round 8).
 *
 * 1. A harmless reward drawn on a lost step is a BOON ("still came away with"),
 *    never a SCAR, and a condition reward links its template — a page that is
 *    still there after the clone has expired.
 * 2. A Mandate deed's cluster reads the same threshold as its "far".
 * 3. One attachment with two effects on the step's reach reads as one HELPS line.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { rewardSentence } from '../aftermathWords';
import { instantiateReward, rewardLinkTarget, REWARD_TEMPLATE_ID_PROPERTY } from '../rewardPool';
import { buildAftermathConsequences } from '../views/stage/buildAftermathConsequences';
import { buildSubjectPage } from '../views/subjects/subjectPage';
import { deriveContributionLines } from '../encounters/stepFactorLines';
import { mandateDeedForChapter } from '../unifiedActionResolution';
import { generateRememberedMandate } from '../mandateGenerator';
import { createMandateStateWith } from '../mandate';
import { ANOMALY_CONDITIONS } from '../../data/anomaly-reward-catalog';
import { REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { MANDATE_DEED_STRONG_POINTS } from '../../data/game-config';
import type { GameState } from '../../types/gameState';
import type { SphereAggregate } from '../../types/worldSoul';
import type { EncounterAftermathChange, UnifiedAction } from '../../types/unifiedAction';
import type { NamedModifierContribution } from '../resolutionModifiers';

const passthrough = {
  enrich: (text: string) => text,
  link: (id: string, text: string) => ({ id, segments: [{ text }] }),
};

const FOSSIL = 'anomaly_fossil_whispers';

function rewardGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'seren', type: 'actor', name: 'Seren', properties: {} });
  for (const node of [...ANOMALY_CONDITIONS, ...REWARD_POSSESSIONS]) {
    graph.addNode({ ...node, properties: { ...node.properties } });
  }
  return graph;
}

function pageState(graph: WorldGraph): GameState {
  return {
    graph,
    ascendantId: 'asc',
    tick: 40,
    seed: 42,
    tiles: [],
    recentEvents: [],
    familiarityMap: new Map(),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    strategicState: { projects: [], controls: [], history: [] },
  } as unknown as GameState;
}

/** The row `unifiedActionResolution` builds for a reward, from the same pieces. */
function rewardRow(args: { harmful: boolean; stepWon: boolean; graph: WorldGraph; instanceId: string }): EncounterAftermathChange {
  const gained = !args.harmful;
  const link = rewardLinkTarget(args.graph, args.instanceId);
  const sentence = rewardSentence({
    actorName: 'Seren',
    rewardName: 'Fossil Whispers',
    rewardId: link.entityId,
    visualKind: link.visualKind,
    gained,
    consolation: gained && !args.stepWon,
  });
  return {
    id: 'a1:step:0:item:Fossil Whispers',
    kind: 'item',
    title: gained ? 'A reward changed hands' : 'The scene cost something tangible',
    detail: sentence.detail,
    concepts: sentence.concepts,
    stateNoun: sentence.stateNoun,
    direction: sentence.direction,
    polarity: gained ? 'gain' : 'loss',
    ...(args.harmful ? { harmful: true, category: 'scar' as const } : {}),
  };
}

describe('THR-2258 — a consolation reward on a lost step is a BOON', () => {
  it('reads "still came away with", folds to BOON, and draws a gain glyph', () => {
    const graph = rewardGraph();
    const grant = instantiateReward(graph, FOSSIL, 'seren', 40)!;
    const [chip] = buildAftermathConsequences({
      changes: [rewardRow({ harmful: false, stepWon: false, graph, instanceId: grant.instanceId })],
      reactions: [],
      ...passthrough,
    });
    expect(chip.category).toBe('boon');
    expect(chip.delta?.direction).toBe('gain');
    expect(chip.sentenceText).toContain('Seren still came away with Fossil Whispers.');
    expect(chip.sentenceText).not.toMatch(/marked by/);
  });

  it('a won step still says "gained"', () => {
    expect(rewardSentence({ actorName: 'Seren', rewardName: 'Fossil Whispers', gained: true }).detail)
      .toBe('Seren gained Fossil Whispers.');
  });

  it('falsifying arm: a harmful draw on a lost step is still a SCAR', () => {
    const graph = rewardGraph();
    const grant = instantiateReward(graph, FOSSIL, 'seren', 40)!;
    const [chip] = buildAftermathConsequences({
      changes: [rewardRow({ harmful: true, stepWon: false, graph, instanceId: grant.instanceId })],
      reactions: [],
      ...passthrough,
    });
    expect(chip.category).toBe('scar');
    expect(chip.delta?.direction).toBe('loss');
  });
});

describe('THR-2258 — a condition reward links a page that outlives the condition', () => {
  it('links the template as an attachment, not the clone as an artifact', () => {
    const graph = rewardGraph();
    const grant = instantiateReward(graph, FOSSIL, 'seren', 40)!;
    expect(graph.getNode(grant.instanceId)?.properties[REWARD_TEMPLATE_ID_PROPERTY]).toBe(FOSSIL);
    expect(rewardLinkTarget(graph, grant.instanceId)).toEqual({ visualKind: 'attachment', entityId: FOSSIL });
  });

  it('the link opens a named page after the clone is gone, never "Unknown"', () => {
    const graph = rewardGraph();
    const grant = instantiateReward(graph, FOSSIL, 'seren', 40)!;
    const link = rewardLinkTarget(graph, grant.instanceId);
    graph.removeNode(grant.instanceId); // the condition ran out
    const page = buildSubjectPage(pageState(graph), { kind: link.visualKind, id: link.entityId, name: 'Fossil Whispers' } as never);
    expect(page.pageKind).not.toBe('missing');
    expect(page.header.name).toBe('Fossil Whispers');
  });

  it('falsifying arm: the old artifact route to the clone opens the missing page', () => {
    const graph = rewardGraph();
    const grant = instantiateReward(graph, FOSSIL, 'seren', 40)!;
    expect(buildSubjectPage(pageState(graph), { kind: 'artifact', id: grant.instanceId, name: 'Fossil Whispers' } as never).pageKind)
      .toBe('missing');
  });

  it('a held item still links its own instance as an artifact', () => {
    const graph = rewardGraph();
    const item = REWARD_POSSESSIONS.find(n => n.type === 'artifact')!;
    const grant = instantiateReward(graph, item.id, 'seren', 40)!;
    expect(rewardLinkTarget(graph, grant.instanceId)).toEqual({ visualKind: 'artifact', entityId: grant.instanceId });
  });
});

function aggregate(): SphereAggregate {
  const base = 100;
  return {
    totalBySphere: {
      force: base, matter: base, energy: base, life: base, mind: base, spirit: base,
      time: base, entropy: base, order: base, chaos: base, light: base, darkness: base,
    },
    dominantSphere: 'mind',
    entityCount: 12,
  };
}

function mandateState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: {} });
  graph.addEdge({ id: 'e1', source: 'asc', target: 'kael', type: 'thread', properties: {} } as never);
  const mandateDefinition = generateRememberedMandate({ alignment: { primary: 'mind', secondary: 'spirit' }, aggregate: aggregate() });
  return {
    graph,
    ascendantId: 'asc',
    tick: 0,
    mandateDefinition,
    mandateState: createMandateStateWith(mandateDefinition.id, 0, { checkpointResults: [], counterOmensEarned: 0, doomSeverityPenalties: 0 }),
    worldSoul: { aggregate: aggregate() },
  } as unknown as GameState;
}

function deedChip(spend: number) {
  const action = { actionId: 'ua_1', actorId: 'kael', templateId: 'enc.test', resolved: true, outcome: 'success', mandateSphereSpend: { mind: spend } } as unknown as UnifiedAction;
  const deed = mandateDeedForChapter(mandateState(), action, { sphereAffinity: 'mind' }, 'Kael', 40)!;
  const total = deed.credits.reduce((s, c) => s + c.points, 0);
  const [chip] = buildAftermathConsequences({ changes: [deed.change], reactions: [], ...passthrough });
  return { deed, total, chip };
}

describe('THR-2258 — a Mandate deed\'s "far" and its cluster agree', () => {
  it('a strong deed says "far" and draws more than one glyph', () => {
    const { deed, total, chip } = deedChip(MANDATE_DEED_STRONG_POINTS + 2);
    expect(total).toBeGreaterThanOrEqual(MANDATE_DEED_STRONG_POINTS);
    expect(deed.change.detail).toMatch(/ far /);
    expect(chip.delta?.count).toBeGreaterThan(1);
  });

  it('an ordinary deed has no "far" and draws one glyph', () => {
    const { deed, total, chip } = deedChip(0);
    expect(total).toBeLessThan(MANDATE_DEED_STRONG_POINTS);
    expect(deed.change.detail).not.toMatch(/ far /);
    expect(chip.delta?.count).toBe(1);
  });
});

describe('THR-2258 — one attachment, one HELPS line', () => {
  const horn = (value: number): NamedModifierContribution => ({ kind: 'effect', sourceId: 'rwd_horn', sourceName: 'Cracked Brass Horn', value });

  it('two effects from the same attachment merge and sum', () => {
    const lines = deriveContributionLines([horn(0.03), horn(0.02)], 'Seren');
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Cracked Brass Horn steadies Seren.');
    expect(lines[0].delta).toBeCloseTo(0.05, 9);
  });

  it('distinct sources keep their own lines, in first-seen order', () => {
    const other: NamedModifierContribution = { kind: 'effect', sourceId: 'rwd_lamp', sourceName: 'Oil Lamp', value: 0.04 };
    const lines = deriveContributionLines([horn(0.03), other, horn(0.02)], 'Seren');
    expect(lines.map(l => l.source)).toEqual(['effect:rwd_horn', 'effect:rwd_lamp']);
  });
});
