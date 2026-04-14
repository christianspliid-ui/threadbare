import { describe, it, expect } from 'vitest';
import { scoreCurationCandidates } from '../curator';
import type { CurationCandidate } from '../curator';
import { MAX_CONCURRENT_TUGS } from '../../data/attention-constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCandidate(
  agentId: string,
  overrides: Partial<CurationCandidate> = {},
): CurationCandidate {
  return {
    encounterId:      `enc_${agentId}`,
    actionId:         `act_${agentId}`,
    agentId,
    courtPosition:    'retinue',
    threatRating:     'moderate',
    reachPrimary:     'iron',
    isChainStage:     false,
    isFinalChainStage:false,
    factionThreadCount: 0,
    matchesAmbition:  false,
    ...overrides,
  };
}

/** Deterministic PRNG that always returns the same value (no tiebreaking variance). */
const deterministicRng = () => 0.5;

// ── Empty / trivial cases ────────────────────────────────────────────────────

describe('scoreCurationCandidates — empty input', () => {
  it('returns empty selected and demoted arrays when no candidates', () => {
    const result = scoreCurationCandidates([], new Map(), null, 0, 6, deterministicRng);
    expect(result.selected).toHaveLength(0);
    expect(result.demoted).toHaveLength(0);
  });
});

// ── Selection cap ─────────────────────────────────────────────────────────────

describe('scoreCurationCandidates — cap enforcement', () => {
  it('selects at most MAX_CONCURRENT_TUGS candidates', () => {
    const candidates = Array.from({ length: MAX_CONCURRENT_TUGS + 5 }, (_, i) =>
      makeCandidate(`agent_${i}`),
    );
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 6, deterministicRng);
    expect(result.selected.length).toBeLessThanOrEqual(MAX_CONCURRENT_TUGS);
  });

  it('demotes candidates beyond the cap', () => {
    const candidates = Array.from({ length: MAX_CONCURRENT_TUGS + 3 }, (_, i) =>
      makeCandidate(`agent_${i}`),
    );
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 6, deterministicRng);
    expect(result.selected.length + result.demoted.length).toBe(candidates.length);
  });

  it('all candidates selected when fewer than budget', () => {
    const candidates = [makeCandidate('a'), makeCandidate('b')];
    // sustainableRate=100 → maxTugs = min(ceil(100*1.4/12), MAX_CONCURRENT_TUGS) = MAX_CONCURRENT_TUGS
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 100, deterministicRng);
    expect(result.selected).toHaveLength(2);
    expect(result.demoted).toHaveLength(0);
  });
});

// ── Court position ordering ───────────────────────────────────────────────────

describe('scoreCurationCandidates — court position scoring', () => {
  it('the_first ranks above retinue and watched', () => {
    const candidates = [
      makeCandidate('watched_agent',   { courtPosition: 'watched' }),
      makeCandidate('first_agent',     { courtPosition: 'the_first' }),
      makeCandidate('retinue_agent',   { courtPosition: 'retinue' }),
    ];
    // sustainableRate=100 → large budget; all selected; check score ordering
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 100, deterministicRng);
    // Selected is sorted desc by score; first_agent should be index 0
    expect(result.selected[0].candidate.agentId).toBe('first_agent');
  });
});

// ── Threat ordering ───────────────────────────────────────────────────────────

describe('scoreCurationCandidates — threat rating', () => {
  it('deadly threat ranks above trivial threat', () => {
    const candidates = [
      makeCandidate('trivial_enc', { threatRating: 'trivial', agentId: 'trivial_enc' }),
      makeCandidate('deadly_enc',  { threatRating: 'deadly',  agentId: 'deadly_enc' }),
    ];
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 100, deterministicRng);
    expect(result.selected[0].candidate.agentId).toBe('deadly_enc');
  });
});

// ── Recency penalty ───────────────────────────────────────────────────────────

describe('scoreCurationCandidates — recency penalty', () => {
  it('agent with a very recent tug scores lower than fresh agent', () => {
    const currentTick = 10;
    const lastTugTicks = new Map([['agent_recent', 9]]); // 1 tick ago — high recency

    const candidates = [
      makeCandidate('agent_fresh',  {}),
      makeCandidate('agent_recent', {}),
    ];
    const result = scoreCurationCandidates(
      candidates, lastTugTicks, null, currentTick, 6, deterministicRng,
    );
    const scores = Object.fromEntries(
      result.selected.concat(result.demoted).map(s => [s.candidate.agentId, s.score]),
    );
    expect(scores['agent_fresh']).toBeGreaterThan(scores['agent_recent']);
  });

  it('no recency penalty when agent has never had a tug', () => {
    const candidates = [makeCandidate('new_agent')];
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 6, deterministicRng);
    // Score should just be base contributions; test that it runs without error
    expect(result.selected).toHaveLength(1);
    expect(result.selected[0].score).toBeGreaterThan(0);
  });
});

// ── Reach variety ─────────────────────────────────────────────────────────────

describe('scoreCurationCandidates — reach variety', () => {
  it('different reach earns bonus vs same reach', () => {
    const candidates = [
      makeCandidate('same_agent',      { reachPrimary: 'iron' }),
      makeCandidate('different_agent', { reachPrimary: 'heart' }),
    ];
    const lastTugReach = 'iron';
    const result = scoreCurationCandidates(
      candidates, new Map(), lastTugReach, 0, 6, deterministicRng,
    );
    const scores = Object.fromEntries(
      result.selected.concat(result.demoted).map(s => [s.candidate.agentId, s.score]),
    );
    expect(scores['different_agent']).toBeGreaterThan(scores['same_agent']);
  });

  it('no reach penalty or bonus when lastTugReach is null', () => {
    const candidates = [makeCandidate('agent')];
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 6, deterministicRng);
    expect(result.selected).toHaveLength(1);
  });
});

// ── Chain stage bonus ─────────────────────────────────────────────────────────

describe('scoreCurationCandidates — chain stage', () => {
  it('final chain stage scores higher than plain encounter', () => {
    const candidates = [
      makeCandidate('plain',       { isChainStage: false, isFinalChainStage: false }),
      makeCandidate('chain_final', { isChainStage: true,  isFinalChainStage: true }),
    ];
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 100, deterministicRng);
    expect(result.selected[0].candidate.agentId).toBe('chain_final');
  });

  it('mid-chain stage scores above plain but below final stage', () => {
    const candidates = [
      makeCandidate('plain',     { isChainStage: false, isFinalChainStage: false }),
      makeCandidate('mid_chain', { isChainStage: true,  isFinalChainStage: false }),
      makeCandidate('final',     { isChainStage: true,  isFinalChainStage: true }),
    ];
    // sustainableRate=100 → large budget; all selected; check score ordering
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 100, deterministicRng);
    // Selected is sorted descending by score: final > mid_chain > plain
    const ids = result.selected.map(s => s.candidate.agentId);
    const finalIdx   = ids.indexOf('final');
    const midIdx     = ids.indexOf('mid_chain');
    const plainIdx   = ids.indexOf('plain');
    expect(finalIdx).toBeLessThan(midIdx);
    expect(midIdx).toBeLessThan(plainIdx);
  });
});

// ── Ambition alignment ────────────────────────────────────────────────────────

describe('scoreCurationCandidates — ambition alignment', () => {
  it('ambition match increases score', () => {
    const candidates = [
      makeCandidate('no_ambition',  { matchesAmbition: false }),
      makeCandidate('has_ambition', { matchesAmbition: true }),
    ];
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 100, deterministicRng);
    expect(result.selected[0].candidate.agentId).toBe('has_ambition');
  });
});

// ── Score structure ───────────────────────────────────────────────────────────

describe('scoreCurationCandidates — result structure', () => {
  it('every result has a numeric score > 0', () => {
    const candidates = [makeCandidate('a'), makeCandidate('b'), makeCandidate('c')];
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 6, deterministicRng);
    for (const s of [...result.selected, ...result.demoted]) {
      expect(typeof s.score).toBe('number');
      expect(s.score).toBeGreaterThan(0);
    }
  });

  it('selected candidates all score >= every demoted candidate', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      makeCandidate(`a${i}`, { courtPosition: i < 3 ? 'the_first' : 'watched' }),
    );
    const result = scoreCurationCandidates(candidates, new Map(), null, 0, 6, deterministicRng);
    if (result.selected.length > 0 && result.demoted.length > 0) {
      const minSelected = Math.min(...result.selected.map(s => s.score));
      const maxDemoted  = Math.max(...result.demoted.map(s => s.score));
      expect(minSelected).toBeGreaterThanOrEqual(maxDemoted);
    }
  });
});
