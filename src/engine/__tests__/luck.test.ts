/**
 * Luck protection — the marble bag and the Legendary deadline (`engine/luck.ts`,
 * Game Design Laws § I, `Docs/game-design/laws.md`).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  drawLuckRoll,
  isLegendaryDue,
  isLuckProtected,
  legendaryDeadline,
  luckBagRoll,
  luckBagSlice,
  readLuckState,
  recordLegendaryWin,
} from '../luck';
import { resolveStepCore, type StepCoreInput } from '../stepResolutionCore';
import {
  LUCK_BAG_SLICES,
  LEGENDARY_DEADLINE_MIN_WINS,
  LEGENDARY_DEADLINE_MAX_WINS,
} from '../../data/luck-constants';

const SEED = 4242;

function world(threadFrom: string | null = 'asc_player'): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc_player', type: 'actor', name: 'Player God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'asc_rival', type: 'actor', name: 'Rival God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  if (threadFrom) graph.addEdge({ id: 'thread_hero', source: threadFrom, target: 'hero', type: 'thread', properties: {} });
  return graph;
}

describe('the marble bag (Laws 4, 8)', () => {
  it('deals every slice exactly once per bag', () => {
    for (let bag = 0; bag < 6; bag++) {
      const slices = new Set<number>();
      for (let i = 0; i < LUCK_BAG_SLICES; i++) slices.add(luckBagSlice(SEED, 'hero', bag * LUCK_BAG_SLICES + i));
      expect(slices.size).toBe(LUCK_BAG_SLICES);
    }
  });

  it('keeps each roll on the d100 and inside its slice', () => {
    const width = 100 / LUCK_BAG_SLICES;
    for (let n = 0; n < 200; n++) {
      const roll = luckBagRoll(SEED, 'hero', n);
      const slice = luckBagSlice(SEED, 'hero', n);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(100);
      expect(roll).toBeGreaterThan(slice * width);
      expect(roll).toBeLessThanOrEqual((slice + 1) * width);
    }
  });

  it('is replayable from the seed and the count alone, and differs per mortal', () => {
    const a = Array.from({ length: 30 }, (_, n) => luckBagRoll(SEED, 'hero', n));
    const b = Array.from({ length: 30 }, (_, n) => luckBagRoll(SEED, 'hero', n));
    const other = Array.from({ length: 30 }, (_, n) => luckBagRoll(SEED, 'someone_else', n));
    expect(a).toEqual(b);
    expect(other).not.toEqual(a);
  });

  it('at steady odds, delivers the forecast exactly over every full bag and caps the losing streak', () => {
    // At even odds (threshold 50) every bag holds exactly half winning slices.
    let longest = 0;
    let run = 0;
    for (let bag = 0; bag < 200; bag++) {
      let wins = 0;
      for (let i = 0; i < LUCK_BAG_SLICES; i++) {
        const won = luckBagRoll(SEED, 'hero', bag * LUCK_BAG_SLICES + i) <= 50;
        if (won) { wins++; run = 0; } else { run++; longest = Math.max(longest, run); }
      }
      expect(wins).toBe(LUCK_BAG_SLICES / 2);
    }
    // Losing slices at the end of one bag plus the start of the next — never more.
    expect(longest).toBeLessThanOrEqual(LUCK_BAG_SLICES);
  });
});

describe('who is protected (Law 4)', () => {
  it('protects a mortal threaded by the player\'s ascendant only', () => {
    expect(isLuckProtected(world('asc_player'), 'asc_player', 'hero')).toBe(true);
    expect(isLuckProtected(world('asc_rival'), 'asc_player', 'hero')).toBe(false);
    expect(isLuckProtected(world(null), 'asc_player', 'hero')).toBe(false);
    expect(isLuckProtected(world('asc_player'), undefined, 'hero')).toBe(false);
  });

  it('deals from the bag and advances the count for a protected mortal; plain dice for anyone else', () => {
    const graph = world('asc_player');
    const first = drawLuckRoll(graph, SEED, 'asc_player', 'hero', 1);
    expect(first).toBe(luckBagRoll(SEED, 'hero', 0));
    expect(readLuckState(graph.getNode('hero')).bagDraws).toBe(1);
    expect(drawLuckRoll(graph, SEED, 'asc_player', 'hero', 2)).toBe(luckBagRoll(SEED, 'hero', 1));

    const rival = world('asc_rival');
    expect(drawLuckRoll(rival, SEED, 'asc_player', 'hero', 1)).toBeUndefined();
    expect(readLuckState(rival.getNode('hero')).bagDraws).toBe(0);
  });
});

describe('the bag keeps the shared stream aligned (NFP #3)', () => {
  const input: StepCoreInput = {
    actorId: 'hero',
    reach: 'iron',
    capability: 0.5,
    difficulty: 0.5,
    actionModifiers: 0,
    testShapers: undefined,
    variancePolicy: 'agent',
    quintessencePolicy: 'none',
    tick: 1,
    sourceLabel: 'unified_action',
  };

  function countingRng(): { rng: () => number; calls: () => number } {
    let n = 0;
    return { rng: () => { n++; return 0.37; }, calls: () => n };
  }

  it('spends exactly one draw with or without a luck roll, and rolls the dealt value', () => {
    const plain = countingRng();
    const plainCore = resolveStepCore(input, plain.rng);
    const bagged = countingRng();
    const baggedCore = resolveStepCore({ ...input, luckRoll: 88 }, bagged.rng);
    expect(bagged.calls()).toBe(plain.calls());
    expect(plainCore.roll).toBe(38);
    expect(baggedCore.roll).toBe(88);
  });
});

describe('the hidden Legendary deadline (Laws 3, 5)', () => {
  it('fixes each cycle\'s deadline inside the window, deterministically', () => {
    for (let cycle = 0; cycle < 50; cycle++) {
      const d = legendaryDeadline(SEED, 'hero', cycle);
      expect(d).toBeGreaterThanOrEqual(LEGENDARY_DEADLINE_MIN_WINS);
      expect(d).toBeLessThanOrEqual(LEGENDARY_DEADLINE_MAX_WINS);
      expect(legendaryDeadline(SEED, 'hero', cycle)).toBe(d);
    }
  });

  it('comes due on the deadline win, and a Legendary starts a new cycle', () => {
    const graph = world('asc_player');
    const deadline = legendaryDeadline(SEED, 'hero', 0);
    for (let win = 1; win < deadline; win++) {
      expect(isLegendaryDue(graph, SEED, 'asc_player', 'hero')).toBe(false);
      recordLegendaryWin(graph, SEED, 'asc_player', 'hero', 1, false, win);
    }
    expect(isLegendaryDue(graph, SEED, 'asc_player', 'hero')).toBe(true);
    recordLegendaryWin(graph, SEED, 'asc_player', 'hero', 4, true, deadline);
    expect(readLuckState(graph.getNode('hero'))).toEqual({ bagDraws: 0, winsSinceLegendary: 0, legendaryCycle: 1 });
    expect(isLegendaryDue(graph, SEED, 'asc_player', 'hero')).toBe(false);
  });

  it('never applies to a mortal the player does not hold', () => {
    const graph = world('asc_rival');
    for (let win = 0; win < LEGENDARY_DEADLINE_MAX_WINS + 5; win++) recordLegendaryWin(graph, SEED, 'asc_player', 'hero', 1, false, win);
    expect(isLegendaryDue(graph, SEED, 'asc_player', 'hero')).toBe(false);
  });
});
