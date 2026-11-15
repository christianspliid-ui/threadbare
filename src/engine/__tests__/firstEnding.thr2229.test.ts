/**
 * THR-2229 — the ending tells what this god did with its First (plan
 * `Docs/plans/2026-11-14-thr-2204-put-the-god-in-the-climax.md` slice 4): Twilight
 * beat 2's Apotheosis and Ordeal lines, the harvest summary leading with the First,
 * the Return ending kept on the thread, and the Threads row's ending word.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../../types/gameState';
import type { ThreadEdgeProperties } from '../../types/influence';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../gameInit';
import { resetDecisionCache, resetEventCounter } from '../orchestrator';
import { getFirstId } from '../meetingEncounter';
import { computeHarvest, firstEndingFact, harvestSummary, readFirstStory, startTwilight } from '../cycleEnd';
import { apotheosisResultClass, buildTwilightBeats, firstFate, openTwilight, ordealHand } from '../twilight';
import { applyReturnOutcome } from '../returnEngine';
import { applyBeatChoice } from '../journeyEngine';
import { getThreadedNodes } from '../retinue';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { ORDEAL_LEAN_POUR, ORDEAL_LEAN_STEADY } from '../../types/journeyEngine';
import type { JourneyVignetteData } from '../../types/journeyEngine';

function newWorld(): GameState {
  resetEventCounter();
  resetDecisionCache();
  const state = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
  devSeedTheFirst(state);
  return state;
}

function firstEdge(state: GameState) {
  const id = getFirstId(state.graph, state.ascendantId)!;
  const edge = state.graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === id)!;
  return { id, edge, props: edge.properties as unknown as ThreadEdgeProperties };
}

function setEdge(state: GameState, patch: Partial<ThreadEdgeProperties>): void {
  const { edge } = firstEdge(state);
  state.graph.updateEdge(edge.id, { properties: { ...edge.properties, ...patch } as never });
}

function makeAspect(state: GameState, id: string): void {
  state.graph.addEdge({ id: `aspect_${id}`, type: 'aspect_of', source: state.ascendantId, target: id, properties: {} } as never);
}

beforeEach(() => {
  enableTracing();
  clearTraces();
});

describe('THR-2229 — Twilight beat 2 says what the god did', () => {
  it('no climax facts on the thread: the fate line only (old saves read as today)', () => {
    const state = newWorld();
    const first = firstFate(state)!;
    expect(first.lines ?? []).toEqual([]);
    expect(first.apotheosis).toBeUndefined();
    expect(first.ordeal).toBeUndefined();
  });

  it('an Ordeal outcome without the roll fields (pre-THR-2226 save) adds no line', () => {
    const state = newWorld();
    setEdge(state, { ordealOutcome: 'triumph' });
    expect(firstFate(state)!.lines ?? []).toEqual([]);
  });

  it('the Apotheosis line, then the Ordeal line, in that order', () => {
    const state = newWorld();
    const { id } = firstEdge(state);
    makeAspect(state, id);
    setEdge(state, {
      apotheosisBand: 'success', apotheosisGodPaid: true,
      ordealOutcome: 'scraped_through', ordealBand: 'near_miss', ordealGodPaid: false, ordealLean: 0,
    });
    const first = firstFate(state)!;
    expect(first.fate).toBe('aspect');
    expect(first.lines).toHaveLength(2);
    expect(first.lines![0]).toMatch(/^At the threshold you spent on \w+, and \w+ became your Aspect\.$/);
    expect(first.lines![1]).toBe(`At the Ordeal you stepped back, and ${first.name} scraped through.`);
    expect(first.apotheosis).toEqual({ band: 'success', godPaid: true, result: 'aspect' });
    expect(first.ordeal).toMatchObject({ outcome: 'scraped_through', godPaid: false, hand: 'alone' });
  });

  it('the god that never touched the threshold: the First stood alone', () => {
    const state = newWorld();
    setEdge(state, { apotheosisBand: 'failure', apotheosisGodPaid: false });
    const first = firstFate(state)!;
    expect(first.lines![0]).toMatch(new RegExp(`^At the threshold ${first.name} stood alone, and \\w+ fell back\\.$`));
  });

  it('a poured-in Ordeal that broke still shows the god\'s hand (Law 23)', () => {
    const state = newWorld();
    setEdge(state, { ordealOutcome: 'broken', ordealBand: 'failure', ordealGodPaid: true, ordealLean: ORDEAL_LEAN_POUR });
    const first = firstFate(state)!;
    expect(first.lines![0]).toMatch(/^At the Ordeal you poured yourself into the thread, and still \w+ broke\.$/);
  });

  it('pour, steady and stepping back read from the stored lean', () => {
    expect(ordealHand(ORDEAL_LEAN_POUR)).toBe('pour');
    expect(ordealHand(ORDEAL_LEAN_STEADY)).toBe('steady');
    expect(ordealHand(0)).toBe('alone');
    expect(ordealHand(undefined)).toBe('alone');
  });

  it('the Apotheosis band reads by pole: a success without Aspect is the withdrawal', () => {
    expect(apotheosisResultClass('success', true)).toBe('aspect');
    expect(apotheosisResultClass('success_at_cost', true)).toBe('aspect_at_cost');
    expect(apotheosisResultClass('success', false)).toBe('turned_away');
    expect(apotheosisResultClass('critical_failure', false)).toBe('fell_back');
  });

  it('the beat-2 facts are traced as twilight.first_lines', () => {
    const state = startTwilight(newWorld());
    setEdge(state, { apotheosisBand: 'success', apotheosisGodPaid: false, ordealOutcome: 'triumph', ordealGodPaid: true, ordealLean: ORDEAL_LEAN_STEADY });
    const out = openTwilight(state);
    expect(out.ok).toBe(true);
    const t = getTraces().filter(x => x.category === 'twilight.first_lines') as unknown as Array<{ apotheosis?: string; ordeal?: string }>;
    expect(t).toHaveLength(1);
    expect(t[0].apotheosis).toBe('success:turned_away:alone');
    expect(t[0].ordeal).toBe('triumph:steady');
  });

  it('a returned First is still found after the Return clears the court position', () => {
    const state = newWorld();
    const { id, edge } = firstEdge(state);
    const name = state.graph.getNode(id)!.name;
    const r = applyReturnOutcome(state.graph, id, name, state.ascendantId, 'vanishing', edge.id, state.tick);
    state.graph.updateEdge(edge.id, { properties: { ...edge.properties, ...r.threadUpdate } as never });
    expect(getFirstId(state.graph, state.ascendantId)).toBeNull();
    const first = buildTwilightBeats(state, computeHarvest(state), state.cycle).first;
    expect(first?.id).toBe(id);
    expect(first?.fate).toBe('lived');
  });
});

describe('THR-2229 — the Return ending is kept on the thread', () => {
  it('applyReturnOutcome writes returnEnding for every ending', () => {
    for (const outcome of ['loyal_ascension', 'sacrifice', 'vanishing', 'transcendence', 'usurper', 'monster'] as const) {
      const state = newWorld();
      const { id, edge } = firstEdge(state);
      const r = applyReturnOutcome(state.graph, id, 'X', state.ascendantId, outcome, edge.id, state.tick);
      expect(r.threadUpdate.returnEnding).toBe(outcome);
    }
  });
});

describe('THR-2229 — the Ordeal roll is kept on the thread', () => {
  it('applyBeatChoice writes the band, whether the god paid, and the lean', () => {
    const vignette = {
      isOrdeal: true, phase: 'ordeal', tick: 1, templateId: 'ordeal_x', variantKey: 'v', doomClockPercent: 0.7,
      stateSnapshot: {}, choices: [{ id: 'pour', text: 'Pour', effects: { interventionType: 'supportive', essenceCost: 5, ordealLean: ORDEAL_LEAN_POUR } }],
    } as unknown as JourneyVignetteData;
    const { updatedProps } = applyBeatChoice({} as ThreadEdgeProperties, vignette, 'pour', { band: 'success', outcome: 'triumph', godPaid: true });
    expect(updatedProps.ordealOutcome).toBe('triumph');
    expect(updatedProps.ordealBand).toBe('success');
    expect(updatedProps.ordealGodPaid).toBe(true);
    expect(updatedProps.ordealLean).toBe(ORDEAL_LEAN_POUR);
  });
});

describe('THR-2229 — the harvest summary leads with the First', () => {
  it('the First\'s story first, the most remembered name second', () => {
    const state = newWorld();
    const story = readFirstStory(state)!;
    expect(harvestSummary('somber', 'Nesrin', story)).toBe(`A somber age. ${story.name}'s story ended in the age's last days; Nesrin faded into memory.`);
  });

  it('the second clause drops when the most remembered name is the First', () => {
    const state = newWorld();
    const story = readFirstStory(state)!;
    expect(harvestSummary('triumphant', story.name, story)).toBe(`A triumphant age. ${story.name}'s story ended in the age's last days.`);
  });

  it('no First: today\'s line', () => {
    expect(harvestSummary('bittersweet', 'Nesrin', null)).toBe('A bittersweet age. Nesrin left a lasting mark.');
  });

  it('with two returned Firsts, the latest one is the story told', () => {
    const state = newWorld();
    const { id: oldId } = firstEdge(state);
    setEdge(state, { returnEnding: 'vanishing', courtPosition: null, beatHistory: [{ tick: 100 }] as never });
    const other = state.graph.getNodesByType('actor').find(n => n.id !== oldId && n.properties?.actorType === 'individual')!;
    state.graph.addEdge({
      id: 'thread_second_first', type: 'thread', source: state.ascendantId, target: other.id,
      properties: { tier: 2, returnEnding: 'sacrifice', courtPosition: null, beatHistory: [{ tick: 300 }] },
    } as never);
    expect(readFirstStory(state)!.id).toBe(other.id);
  });

  it('the Return ending names how the story ended', () => {
    const state = newWorld();
    setEdge(state, { returnEnding: 'vanishing' });
    expect(firstEndingFact(readFirstStory(state)!)).toMatch(/^when \w+ (was|were) simply gone$/);
    setEdge(state, { returnEnding: 'loyal_ascension' });
    expect(firstEndingFact(readFirstStory(state)!)).toBe('at your side');
  });

  it('computeHarvest\'s summary names the First', () => {
    const state = newWorld();
    const story = readFirstStory(state)!;
    expect(computeHarvest(state).chronicleSummary).toContain(`${story.name}'s story ended`);
  });
});

describe('THR-2229 — the Threads row reads the Return ending', () => {
  it('a vanished First reads "Gone", not a tier name or "Aspect"', () => {
    const state = newWorld();
    const { id } = firstEdge(state);
    makeAspect(state, id);
    setEdge(state, { returnEnding: 'vanishing', courtPosition: null });
    const row = getThreadedNodes(state.graph, state.ascendantId).find(n => n.id === id)!;
    expect(row.tierName).toBe('Gone');
    expect(row.endingWord).toBe('Gone');
  });

  it('a transcended First (now a spirit) keeps a row that reads "Transcended"', () => {
    const state = newWorld();
    const { id } = firstEdge(state);
    const node = state.graph.getNode(id)!;
    state.graph.updateNode(id, { properties: { ...node.properties, actorType: 'spirit' } });
    setEdge(state, { returnEnding: 'transcendence', courtPosition: null });
    const row = getThreadedNodes(state.graph, state.ascendantId).find(n => n.id === id);
    expect(row?.tierName).toBe('Transcended');
  });

  it('any other ending keeps the tier name', () => {
    const state = newWorld();
    const { id } = firstEdge(state);
    setEdge(state, { returnEnding: 'sacrifice', courtPosition: null });
    const row = getThreadedNodes(state.graph, state.ascendantId).find(n => n.id === id)!;
    expect(row.endingWord).toBeUndefined();
  });
});
