/**
 * THR-2149 — the sheet says what grew (plan
 * `Docs/plans/2026-11-02-thr-2143-the-sheet-says-what-grew.md` § S2): a recent gain
 * marks its reach tile, Nature reads the axis words, and a meeting lean is a chip.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { EncounterAftermathChange } from '../../../types/unifiedAction';
import type { CardsSection, ChipsSection, Section } from '../../../types/detailPage';
import type { FormativeOutcome } from '../../../types/meetingEncounter';
import { REACH_DOMAINS } from '../../../types/traits';
import { composeSections } from '../../detailPageGenerator';
import { recentReachGrowth, SHEET_GAIN_MARK_WINDOW_TICKS } from '../reachGrowthMarks';
import { meetingLeans, natureValueWord } from '../../agentDetail';
import { gainMarkLabel } from '../subjects/personRows';
import { growthSentence } from '../../aftermathWords';
import { containsNumeral } from '../../aftermathWords';

const ASC = 'asc';

function growth(actionId: string, domain: string, applied: number, actorId = 'kael'): EncounterAftermathChange {
  const s = growthSentence({ actorName: 'Kael', domain, applied, tierCrossed: false });
  return {
    id: `${actionId}:step:0:growth:${domain}`,
    kind: 'growth',
    title: `${domain} grew`,
    detail: s.detail,
    polarity: 'gain',
    stateNoun: s.stateNoun,
    direction: s.direction,
    magnitude: s.magnitude,
    actorId,
  };
}

function record(actionId: string, resolvedTick: number, changes: EncounterAftermathChange[], templateName = 'The Pilgrim Way'): ChapterRecord {
  return {
    actionId,
    templateId: 'tpl',
    templateName,
    actorId: 'kael',
    actorName: 'Kael',
    targetId: 'kael',
    targetName: 'Kael',
    scale: 'personal',
    startTick: resolvedTick - 5,
    resolvedTick,
    resolved: true,
    threaded: true,
    participants: [],
    openingProse: '',
    steps: [],
    aftermathSummary: { encounterId: actionId, outcome: 'success', overview: '', changes },
  } as unknown as ChapterRecord;
}

function outcome(valuePair: FormativeOutcome['valuePair'], writtenPole: 'a' | 'b', shift: number): FormativeOutcome {
  return { testIndex: 0, templateId: 't', valuePair, netLean: writtenPole, playedNudgeIds: [], band: 'success', writtenPole, shift, quintessenceErosion: 0, essenceSpent: 0, prose: '' } as unknown as FormativeOutcome;
}

function world(opts: { archive?: ChapterRecord[]; outcomes?: FormativeOutcome[]; profile?: Record<string, number> } = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual', npcRole: 'smith', axiologicalProfile: opts.profile ?? { honesty_cunning: 0.6, courage_prudence: 0.3 } } });
  graph.addEdge({ id: 'at1', source: 'kael', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({
    id: 'th1', source: ASC, target: 'kael', type: 'thread',
    properties: { tier: 1, courtPosition: 'the_first', ...(opts.outcomes ? { meetingChoiceRecord: { formativeOutcomes: opts.outcomes } } : {}) },
  });
  return {
    graph,
    ascendantId: ASC,
    tick: 400,
    seed: 42,
    tiles: [],
    recentEvents: [],
    familiarityMap: new Map([['kael', 0.9]]),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: opts.archive ?? [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
  } as unknown as GameState;
}

function sections(state: GameState): Section[] {
  return composeSections('actor', { nodeId: 'kael', pageKind: 'actor', graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state });
}

describe('recentReachGrowth (THR-2149 E3)', () => {
  it('returns the newest growth per reach inside the window', () => {
    const archive = [
      record('a1', 380, [growth('a1', 'stone', 0.02)], 'Old Road'),
      record('a2', 390, [growth('a2', 'stone', 0.1)], 'The Pilgrim Way'),
      record('a3', 395, [growth('a3', 'eye', 0.3)]),
    ];
    const marks = recentReachGrowth(archive, 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS);
    expect(marks.get('stone')).toMatchObject({ steps: 2, band: 'clearly', chapterTitle: 'The Pilgrim Way', resolvedTick: 390 });
    expect(marks.get('eye')).toMatchObject({ steps: 3, band: 'greatly' });
    expect(marks.size).toBe(2);
  });

  it('marks nothing outside the window, for another actor, or with no archive', () => {
    const archive = [
      record('a1', 400 - SHEET_GAIN_MARK_WINDOW_TICKS - 1, [growth('a1', 'stone', 0.1)]),
      record('a2', 399, [growth('a2', 'iron', 0.1, 'someone_else')]),
      record('a3', 401, [growth('a3', 'gold', 0.1)]),
    ];
    expect(recentReachGrowth(archive, 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS).size).toBe(0);
    expect(recentReachGrowth(undefined, 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS).size).toBe(0);
  });

  it('reads one ▲ and no band word for a growth with no magnitude', () => {
    const bare = { ...growth('a1', 'star', 0.1), magnitude: undefined };
    const marks = recentReachGrowth([record('a1', 399, [bare])], 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS);
    expect(marks.get('star')).toMatchObject({ steps: 1, band: '' });
  });

  it('an authored growth line with no magnitude never shrinks the measured mark in the same chapter', () => {
    // The ending's authored changes ride after the engine's measured `:growth:<reach>` change.
    const authored = { ...growth('a1', 'iron', 0.1), id: 'toll.iron_tested', magnitude: undefined };
    const marks = recentReachGrowth([record('a1', 390, [growth('a1', 'iron', 0.1), authored])], 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS);
    expect(marks.get('iron')).toMatchObject({ steps: 2, band: 'clearly' });
  });

  it('the hover says when, how much, where, and why the word held — with no numeral', () => {
    const mark = recentReachGrowth([record('a1', 376, [growth('a1', 'stone', 0.1)])], 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS).get('stone')!;
    const label = gainMarkLabel(mark, 400);
    expect(label).toBe('Grew clearly two days ago, in The Pilgrim Way. A word spans a wide range, so it can hold through a gain.');
    expect(containsNumeral(label)).toBe(false);
    expect(gainMarkLabel({ ...mark, band: '', resolvedTick: 398 }, 400)).toBe('Grew less than a day ago, in The Pilgrim Way. A word spans a wide range, so it can hold through a gain.');
  });

  it('a tier-crossing gain gets the same hover — it never claims the word moved or held', () => {
    // storyWeight 'beat' is a reach-share tier, not the sheet word's capability tier.
    const plain = growth('a1', 'stone', 0.1);
    const crossing = { ...plain, storyWeight: 'beat' as const };
    const at = (c: typeof plain) => gainMarkLabel(recentReachGrowth([record('a1', 376, [c])], 'kael', 400, SHEET_GAIN_MARK_WINDOW_TICKS).get('stone')!, 400);
    expect(at(crossing)).toBe(at(plain));
  });
});

describe('Nature words and meeting leans (THR-2149 E4)', () => {
  it('Nature reads the axis registry pole words, keeping the intensity prefix', () => {
    expect(natureValueWord('honesty_cunning', 0.6)).toBe('Fair');
    expect(natureValueWord('honesty_cunning', -0.9)).toBe('Deeply Scheming');
    expect(natureValueWord('honesty_cunning', 0.3)).toBe('Somewhat Fair');
    // A pair no reach axis owns keeps its own words.
    expect(natureValueWord('courage_prudence', 0.6)).toBe('Courageous');
    // The lean on that pair uses the fate line's word, so the chip and the line agree.
    const state = world({ outcomes: [outcome('courage_prudence', 'b', -0.3)] });
    expect(meetingLeans(state.graph, 'kael')).toEqual([{ pair: 'courage_prudence', word: 'Prudent' }]);
  });

  it('meetingLeans reads the pole each test wrote, in the axis word', () => {
    const state = world({ outcomes: [outcome('honesty_cunning', 'b', -0.3), outcome('loyalty_ambition', 'a', 0.3), outcome('mercy_ruthlessness', 'a', 0)] });
    expect(meetingLeans(state.graph, 'kael')).toEqual([
      { pair: 'honesty_cunning', word: 'Scheming' },
      { pair: 'loyalty_ambition', word: 'Loyal' },
    ]);
    expect(meetingLeans(world().graph, 'kael')).toEqual([]);
  });

  it('Nature adds a lean chip that is never the lead, and only when the word is not shown', () => {
    const state = world({ outcomes: [outcome('honesty_cunning', 'b', -0.3), outcome('courage_prudence', 'a', 0.3)] });
    const nature = sections(state).find(s => s.typeId === 'nature') as ChipsSection;
    const labels = nature.chips.map(c => c.label);
    expect(labels[0]).toBe('Fair above all');
    expect(labels).toContain('leaning Scheming');
    expect(nature.chips.find(c => c.label === 'leaning Scheming')).toMatchObject({ dataKey: { attribute: 'lean', value: 'Scheming' } });
    expect(nature.chips.find(c => c.label === 'leaning Scheming')?.lead).toBeUndefined();
    // "Somewhat Courageous" is already shown, so the Courage lean adds no chip.
    expect(labels.filter(l => l.startsWith('leaning'))).toEqual(['leaning Scheming']);
    expect(labels.join(' ')).not.toMatch(/Honest|Cunning/);
  });
});

describe('the reach tile mark (THR-2149 U3)', () => {
  it('a reach that grew in the window carries its ▲ mark; an old gain does not', () => {
    const fresh = world({ archive: [record('a1', 390, REACH_DOMAINS.map(d => growth('a1', d, 0.1)))] });
    const tiles = (sections(fresh).find(s => s.typeId === 'domains') as CardsSection).tiles;
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect(tile.mark?.steps).toBe(2);
      expect(tile.mark?.heading).toBe(`${tile.title} grew`);
      expect(tile.mark?.label).toContain('The Pilgrim Way');
    }
    const stale = world({ archive: [record('a1', 300, REACH_DOMAINS.map(d => growth('a1', d, 0.1)))] });
    const staleTiles = (sections(stale).find(s => s.typeId === 'domains') as CardsSection).tiles;
    expect(staleTiles.every(t => t.mark === undefined)).toBe(true);
  });
});
