/**
 * Contract tests for the Ascendant Bar's Signatures readout (THR-613 Slice 3b, §5.B).
 *
 * The invariant that matters: the three legible states partition the eight reach
 * signatures exactly by (a) whether the reach is one of the god's permanent domains
 * — the same `getAscendantProgress` read the Reaches readout uses — and (b) whether
 * the signature's id has been earned into `unlockedActionIds`. These tests pin that
 * partition, the every-reach-covered completeness, the yours-first ordering, and the
 * fail-soft empty case.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../../engine/graph';
import { selectSignaturePaths } from '../selectors';
import { createInitialAscendantBeatState } from '../../../../engine/ascendantBeat';
import { REACH_SIGNATURE_ID_BY_REACH } from '../../../../data/reach-signature-content';
import type { GameState } from '../../../../types/gameState';
import type { ReachDomain } from '../../../../types/traits';

function barState(opts: {
  domainAffinities?: Partial<Record<ReachDomain, number>>;
  unlockedActionIds?: string[];
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
      },
    });
  }
  return {
    tick: 10,
    seed: 42,
    ascendantId: 'asc-1',
    graph,
    unlockedActionIds: opts.unlockedActionIds ?? [],
    ascendantBeats: {
      ...createInitialAscendantBeatState(),
      spineCursor: -1,
      pending: null,
    },
  } as unknown as GameState;
}

describe('selectSignaturePaths — three-state legibility', () => {
  it('covers all eight reach signatures exactly once', () => {
    const paths = selectSignaturePaths(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    const reaches = paths.map((p) => p.reach).sort();
    const allReaches = Object.keys(REACH_SIGNATURE_ID_BY_REACH).sort();
    expect(reaches).toEqual(allReaches);
    expect(reaches.length).toBe(8);
  });

  it('an in-domain signature not yet earned is acquirable; earned is available', () => {
    const ironId = REACH_SIGNATURE_ID_BY_REACH.iron!;
    const paths = selectSignaturePaths(
      barState({ domainAffinities: { iron: 5, gold: 3 }, unlockedActionIds: [ironId] }),
    );
    expect(paths.find((p) => p.reach === 'iron')!.state).toBe('available');
    expect(paths.find((p) => p.reach === 'gold')!.state).toBe('acquirable');
  });

  it('a signature of a reach outside the domains is locked this incarnation', () => {
    const paths = selectSignaturePaths(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    // Every reach that is not iron/gold must be locked_incarnation.
    for (const p of paths) {
      if (p.reach === 'iron' || p.reach === 'gold') {
        expect(p.state).not.toBe('locked_incarnation');
      } else {
        expect(p.state).toBe('locked_incarnation');
      }
    }
  });

  it('flags the primary reach (rank 0) and only it', () => {
    const paths = selectSignaturePaths(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    expect(paths.filter((p) => p.isPrimary).map((p) => p.reach)).toEqual(['iron']);
  });

  it('orders your paths first (primary first), then locked paths', () => {
    const paths = selectSignaturePaths(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    // First two are the god's own domains, primary (iron) before secondary (gold).
    expect(paths[0].reach).toBe('iron');
    expect(paths[1].reach).toBe('gold');
    // The rest are all locked-this-incarnation.
    for (const p of paths.slice(2)) expect(p.state).toBe('locked_incarnation');
  });

  it('names each signature with authored copy, not the raw reach id', () => {
    const paths = selectSignaturePaths(barState({ domainAffinities: { iron: 5, gold: 3 } }));
    const iron = paths.find((p) => p.reach === 'iron')!;
    expect(iron.reachLabel).toBe('Iron');
    expect(iron.name.length).toBeGreaterThan(0);
    expect(iron.name).not.toBe('iron');
  });

  it('handles a three-domain god (worldgen ships 2–3 domains)', () => {
    const paths = selectSignaturePaths(
      barState({ domainAffinities: { eye: 4, veil: 3, shadow: 2 } }),
    );
    const yours = paths.filter((p) => p.state !== 'locked_incarnation').map((p) => p.reach);
    expect(yours.sort()).toEqual(['eye', 'shadow', 'veil']);
  });

  it('fail-soft: returns [] when there is no ascendant node', () => {
    expect(selectSignaturePaths(barState({ omitAscendant: true }))).toEqual([]);
  });
});
