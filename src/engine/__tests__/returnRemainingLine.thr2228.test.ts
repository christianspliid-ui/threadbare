// THR-2228 (THR-2204 slice 3) — the Return names the last days. "Another mortal can carry
// your thread" appears only when the First slot opens again before the age ends (UI Law 56).
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { buildReturnRemainingLine, isFirstSlotOpenBeforeAgeEnds } from '../journeyEngine';
import { RETURN_OPEN_THREAD_CLAUSE } from '../../data/return-content';
import { TICKS_PER_DAY } from '../../data/attention-constants';

function godWith(firstPosition: string | null): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'god', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addEdge({
    id: 'thread_kael', source: 'god', target: 'kael', type: 'thread',
    properties: { courtPosition: firstPosition },
  });
  return graph;
}

describe('buildReturnRemainingLine (THR-2228)', () => {
  it('names the story and the time left in words, without the thread clause when no slot is open', () => {
    const line = buildReturnRemainingLine({ firstName: 'Kael Thornweaver', doomTicksRemaining: 3 * TICKS_PER_DAY, threadOpen: false });
    expect(line).toBe("Kael Thornweaver's story is told. The age has three days left.");
    expect(line).not.toContain(RETURN_OPEN_THREAD_CLAUSE.trim());
  });

  it('adds "Another mortal can carry your thread." only when a slot is open', () => {
    const line = buildReturnRemainingLine({ firstName: 'Kael Thornweaver', doomTicksRemaining: 3 * TICKS_PER_DAY, threadOpen: true });
    expect(line).toBe("Kael Thornweaver's story is told. The age has three days left. Another mortal can carry your thread.");
  });

  it('never prints a numeral, and an empty name reads "Your First" (PC-3)', () => {
    const line = buildReturnRemainingLine({ firstName: '', doomTicksRemaining: Number.NaN, threadOpen: false });
    expect(line.startsWith("Your First's story is told.")).toBe(true);
    expect(/\d/.test(line)).toBe(false);
  });
});

describe('isFirstSlotOpenBeforeAgeEnds (THR-2228)', () => {
  it('is open when the Return cleared the First and the cooldown ends before the Doom', () => {
    expect(isFirstSlotOpenBeforeAgeEnds(godWith(null), 'god', 5, 60)).toBe(true);
  });

  it('is closed when the cooldown outlasts the age', () => {
    expect(isFirstSlotOpenBeforeAgeEnds(godWith(null), 'god', 10, 8)).toBe(false);
  });

  it('is closed while the god still holds a First', () => {
    expect(isFirstSlotOpenBeforeAgeEnds(godWith('the_first'), 'god', 0, 60)).toBe(false);
  });
});
