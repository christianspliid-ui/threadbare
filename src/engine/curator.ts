/**
 * Curator Scoring Module
 *
 * Ranks shaping-eligible encounters and selects which ones produce thread tugs.
 * The rest are demoted to silent auto-resolve (go to digest).
 */

import {
  MAX_CONCURRENT_TUGS,
  FOMO_OVERFLOW_RATIO,
  TICKS_PER_DAY,
} from '../data/attention-constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CurationCandidate {
  encounterId: string;
  actionId?: string;
  agentId: string;
  /** dormant agents are never eligible — only these three */
  courtPosition: 'the_first' | 'retinue' | 'watched';
  threatRating: 'trivial' | 'easy' | 'moderate' | 'hard' | 'deadly';
  reachPrimary: string; // ReachDomain
  isChainStage: boolean;
  isFinalChainStage: boolean;
  factionThreadCount: number;
  matchesAmbition: boolean;
}

export interface ScoredCandidate {
  candidate: CurationCandidate;
  score: number;
}

export interface CurationResult {
  selected: ScoredCandidate[];
  demoted: ScoredCandidate[];
}

// ── Scoring weights ───────────────────────────────────────────────────────────

/** Weight: court position contribution to score */
const W_COURT = 0.3;
/** Weight: threat severity contribution to score */
const W_THREAT = 0.15;
/** Weight: chain progress contribution to score */
const W_CHAIN = 0.2;
/** Weight: agent recency penalty (negative = more recent hurts more) */
const W_RECENCY = -0.15;
/** Weight: reach variety bonus/penalty */
const W_REACH = 0.1;
/** Weight: faction relevance contribution */
const W_FACTION = 0.1;
/** Weight: ambition alignment contribution */
const W_AMBITION = 0.1;

/** Denominator for faction relevance normalisation */
const FACTION_THREAD_SATURATION = 5;

// ── Value maps ────────────────────────────────────────────────────────────────

const COURT_VALUE: Record<CurationCandidate['courtPosition'], number> = {
  the_first: 1.0,
  retinue: 0.7,
  watched: 0.3,
};

const THREAT_VALUE: Record<CurationCandidate['threatRating'], number> = {
  trivial: 0.1,
  easy: 0.3,
  moderate: 0.5,
  hard: 0.8,
  deadly: 1.0,
};

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Score and partition curation candidates into selected (thread tugs) and
 * demoted (silent auto-resolve → digest).
 *
 * @param candidates         Shaping-eligible encounters this tick
 * @param lastTugAgentTicks  agentId → tick of most recent tug for that agent
 * @param lastTugReach       ReachDomain of the most recent tug (or null if none)
 * @param currentTick        Current simulation tick
 * @param sustainableRate    Sustainable events per day (used to compute max tugs)
 * @param rng                Seeded PRNG (for tiebreaking — adds ≤ 0.001 to score)
 */
export function scoreCurationCandidates(
  candidates: CurationCandidate[],
  lastTugAgentTicks: Map<string, number>,
  lastTugReach: string | null,
  currentTick: number,
  sustainableRate: number,
  rng: () => number,
): CurationResult {
  if (candidates.length === 0) {
    return { selected: [], demoted: [] };
  }

  // Max tugs this tick: ceil((sustainableRate * FOMO_OVERFLOW_RATIO) / TICKS_PER_DAY), capped at MAX_CONCURRENT_TUGS
  const rawMax = Math.ceil((sustainableRate * FOMO_OVERFLOW_RATIO) / TICKS_PER_DAY);
  const maxTugs = Math.min(rawMax, MAX_CONCURRENT_TUGS);

  // Score each candidate
  const scored = candidates.map((c) => {
    let score = 0;

    // Court position
    score += W_COURT * COURT_VALUE[c.courtPosition];

    // Threat severity
    score += W_THREAT * THREAT_VALUE[c.threatRating];

    // Chain progress: final stage = 1.0, mid-chain = 0.5, none = 0
    if (c.isFinalChainStage) {
      score += W_CHAIN * 1.0;
    } else if (c.isChainStage) {
      score += W_CHAIN * 0.5;
    }
    // else: 0 — no chain contribution

    // Agent recency penalty: 1 - (ticksSinceLast / TICKS_PER_DAY)
    // Higher penalty when the agent had a recent tug (ticksSinceLast is small).
    // W_RECENCY is negative so the product adds a negative contribution.
    const lastTugTick = lastTugAgentTicks.get(c.agentId);
    if (lastTugTick !== undefined) {
      const ticksSinceLast = currentTick - lastTugTick;
      const recencyFactor = 1 - ticksSinceLast / TICKS_PER_DAY;
      score += W_RECENCY * recencyFactor;
    }
    // No prior tug → no recency penalty

    // Reach variety: same reach = -1.0, different = +0.5
    if (lastTugReach !== null) {
      if (c.reachPrimary === lastTugReach) {
        score += W_REACH * -1.0;
      } else {
        score += W_REACH * 0.5;
      }
    }

    // Faction relevance: min(1.0, factionThreadCount / FACTION_THREAD_SATURATION)
    const factionFactor = Math.min(1.0, c.factionThreadCount / FACTION_THREAD_SATURATION);
    score += W_FACTION * factionFactor;

    // Ambition alignment
    if (c.matchesAmbition) {
      score += W_AMBITION * 1.0;
    }

    // Tiny PRNG tiebreaker
    score += rng() * 0.001;

    return { candidate: c, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, maxTugs);
  const demoted = scored.slice(maxTugs);

  return { selected, demoted };
}
