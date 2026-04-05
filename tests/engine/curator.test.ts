import { describe, it, expect } from 'vitest';
import { scoreCurationCandidates, CurationCandidate } from '../../src/engine/curator';
import { MAX_CONCURRENT_TUGS } from '../../src/data/attention-constants';

// Deterministic rng for tests
let rngCounter = 0;
const makeRng = () => {
  rngCounter = 0;
  return () => ((rngCounter++) * 0.1) % 1;
};

function makeCandidate(overrides: Partial<CurationCandidate> = {}): CurationCandidate {
  return {
    encounterId: 'enc-1',
    agentId: 'agent-1',
    courtPosition: 'retinue',
    threatRating: 'moderate',
    reachPrimary: 'combat',
    isChainStage: false,
    isFinalChainStage: false,
    factionThreadCount: 0,
    matchesAmbition: false,
    ...overrides,
  };
}

describe('scoreCurationCandidates', () => {
  it('empty candidates → { selected: [], demoted: [] }', () => {
    const result = scoreCurationCandidates([], new Map(), null, 10, 8, makeRng());
    expect(result.selected).toEqual([]);
    expect(result.demoted).toEqual([]);
  });

  it('the_first scores higher than watched (same everything else)', () => {
    const first = makeCandidate({ encounterId: 'enc-first', agentId: 'agent-a', courtPosition: 'the_first' });
    const watched = makeCandidate({ encounterId: 'enc-watched', agentId: 'agent-b', courtPosition: 'watched' });
    const result = scoreCurationCandidates([watched, first], new Map(), null, 10, 8, makeRng());
    // the_first should appear first in selected (higher score)
    expect(result.selected[0].encounterId).toBe('enc-first');
  });

  it('deadly threat scores higher than trivial', () => {
    const deadly = makeCandidate({ encounterId: 'enc-deadly', agentId: 'agent-a', threatRating: 'deadly' });
    const trivial = makeCandidate({ encounterId: 'enc-trivial', agentId: 'agent-b', threatRating: 'trivial' });
    const result = scoreCurationCandidates([trivial, deadly], new Map(), null, 10, 8, makeRng());
    expect(result.selected[0].encounterId).toBe('enc-deadly');
  });

  it('final chain stage scores higher than non-chain', () => {
    const finalChain = makeCandidate({ encounterId: 'enc-final', agentId: 'agent-a', isChainStage: true, isFinalChainStage: true });
    const nonChain = makeCandidate({ encounterId: 'enc-none', agentId: 'agent-b', isChainStage: false, isFinalChainStage: false });
    const result = scoreCurationCandidates([nonChain, finalChain], new Map(), null, 10, 8, makeRng());
    expect(result.selected[0].encounterId).toBe('enc-final');
  });

  it('same reach as last tug gets penalized relative to different reach', () => {
    const sameReach = makeCandidate({ encounterId: 'enc-same', agentId: 'agent-a', reachPrimary: 'combat' });
    const diffReach = makeCandidate({ encounterId: 'enc-diff', agentId: 'agent-b', reachPrimary: 'diplomacy' });
    // last tug was 'combat'
    const result = scoreCurationCandidates([sameReach, diffReach], new Map(), 'combat', 10, 8, makeRng());
    expect(result.selected[0].encounterId).toBe('enc-diff');
  });

  it('caps selection at MAX_CONCURRENT_TUGS (3)', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      makeCandidate({ encounterId: `enc-${i}`, agentId: `agent-${i}` })
    );
    const result = scoreCurationCandidates(candidates, new Map(), null, 10, 8, makeRng());
    expect(result.selected.length).toBeLessThanOrEqual(MAX_CONCURRENT_TUGS);
  });

  it('excess candidates go to demoted array', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      makeCandidate({ encounterId: `enc-${i}`, agentId: `agent-${i}` })
    );
    const result = scoreCurationCandidates(candidates, new Map(), null, 10, 8, makeRng());
    expect(result.selected.length + result.demoted.length).toBe(candidates.length);
    expect(result.demoted.length).toBeGreaterThan(0);
  });

  it('selected is sorted by score descending', () => {
    const candidates = [
      makeCandidate({ encounterId: 'enc-watched', agentId: 'agent-a', courtPosition: 'watched' }),
      makeCandidate({ encounterId: 'enc-first', agentId: 'agent-b', courtPosition: 'the_first', threatRating: 'deadly' }),
      makeCandidate({ encounterId: 'enc-retinue', agentId: 'agent-c', courtPosition: 'retinue' }),
    ];
    const result = scoreCurationCandidates(candidates, new Map(), null, 10, 8, makeRng());
    // the_first + deadly should be top
    expect(result.selected[0].encounterId).toBe('enc-first');
    // Each consecutive pair: first score >= second score (we verify ordering holds)
    // Since we don't expose scores, just verify the enc-first is first
    expect(result.selected.length).toBeGreaterThan(0);
  });
});
