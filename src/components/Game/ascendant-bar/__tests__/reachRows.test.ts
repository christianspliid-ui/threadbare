/**
 * Contract tests for the Ascendant Bar's Reaches readout (THR-613 Slice 3a, §5.D).
 *
 * The invariant that matters: the tier word the player reads in the bar is derived from
 * the same `getAscendantProgress` read the Deepening beat trips on, so the readout and
 * the beat cannot drift apart. These tests pin that, the two-permanent-domain shape, and
 * the fail-soft empty case.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import { selectReachRows } from '../selectors';
import { getAscendantProgress } from '../../../../engine/phaseAscendantProgression';
import { getNarrativeLabel } from '../../../../engine/domainCapability';
import { createInitialAscendantBeatState } from '../../../../engine/ascendantBeat';
import { deepeningBeatIdForReach } from '../../../../data/player-progression';
import type { GameState } from '../../../../types/gameState';
import type { ReachDomain } from '../../../../types/traits';
import type { PendingBeat } from '../../../../types/ascendantBeat';

function barState(opts: {
  domainAffinities?: Partial<Record<ReachDomain, number>>;
  domainCapabilities?: Partial<Record<ReachDomain, number>>;
  pending?: PendingBeat | null;
  omitAscendant?: boolean;
}): GameState {
  const graph = new WorldGraph();
  if (!opts.omitAscendant) {
    graph.addNode({
      id: 'asc-1',
      type: 'actor',
      name: 'The God',
      properties: {
        actorType: 'ascendant',
        domainAffinities: opts.domainAffinities ?? { iron: 5, gold: 3 },
        ...(opts.domainCapabilities ? { domainCapabilities: opts.domainCapabilities } : {}),
      },
    });
  }
  return {
    tick: 10,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    ascendantBeats: {
      ...createInitialAscendantBeatState(),
      spineCursor: -1,
      pending: opts.pending ?? null,
    },
  } as unknown as GameState;
}

describe('selectReachRows — the two permanent domains', () => {
  it('returns exactly the ranked primary + secondary reach', () => {
    const rows = selectReachRows(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    expect(rows.map(r => r.reach)).toEqual(['iron', 'gold']);
    expect(rows.map(r => r.rank)).toEqual(['primary', 'secondary']);
  });

  it('names each reach with authored copy, not the raw id', () => {
    const rows = selectReachRows(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    expect(rows[0].label).toBe('Iron');
    expect(rows[1].label).toBe('Gold');
    for (const row of rows) expect(row.body.length).toBeGreaterThan(0);
  });

  it('reads the same tier the engine reports — the bar cannot drift from the beat', () => {
    const state = barState({ domainCapabilities: { iron: 8, gold: 3 } });
    const rows = selectReachRows(state);
    const progress = getAscendantProgress(state)!;
    for (const row of rows) {
      const engineReach = progress.reaches.find(r => r.reach === row.reach)!;
      expect(row.tierWord).toBe(getNarrativeLabel(engineReach.reach, engineReach.tier));
    }
  });

  it('renders the tier as a prose word, never a number', () => {
    const rows = selectReachRows(barState({ domainCapabilities: { iron: 8, gold: 3 } }));
    for (const row of rows) {
      expect(row.tierWord).not.toMatch(/\d/);
      expect(row.tierWord.length).toBeGreaterThan(0);
    }
  });

  it('flags the reach whose Deepening beat is pending', () => {
    const pending = {
      beatId: deepeningBeatIdForReach('iron'),
      kind: 'deepening',
      offeredTurn: 10,
    } as unknown as PendingBeat;
    const rows = selectReachRows(
      barState({ domainAffinities: { iron: 5, gold: 3 }, pending }),
    );
    expect(rows.find(r => r.reach === 'iron')!.pendingDeepening).toBe(true);
    expect(rows.find(r => r.reach === 'gold')!.pendingDeepening).toBe(false);
  });

  it('fail-soft: returns [] when there is no ascendant node', () => {
    expect(selectReachRows(barState({ omitAscendant: true }))).toEqual([]);
  });
});
