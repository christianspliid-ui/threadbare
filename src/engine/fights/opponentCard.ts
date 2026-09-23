/**
 * The opponent card — what a fight step is rated against (THR-1537, plan doc
 * `Docs/plans/2026-09-23-fight-block.md` §2).
 *
 * Three sources, tried in order:
 *   1. `monsterState` — the card a monster carries on its node (minted by plan doc
 *      3; until then no node carries it, and tests use a hand-written fixture).
 *   2. **derived** — a mortal opponent's card, read from their raw clash-reach
 *      score (THR-1264). Raw rather than capability, because capability
 *      saturates near 1.0 and would rate every seasoned fighter the same.
 *   3. **default** — `FIGHT_DEFAULT_CARD`, for a missing node (fail-soft).
 *
 * Pure: reading a card writes nothing. The attended forecast reads it from the
 * UI (plan doc §3b), so a forecast drawn ten times must change nothing.
 */

import type { WorldGraph } from '../graph';
import type {
  FightRatingWord,
  FightTemper,
  OpponentCard,
} from '../../types/fight';
import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';
import { computeRawScore } from '../domainCapability';
import {
  FIGHT_CLOCK_RECOVERY_TICKS,
  FIGHT_DEFAULT_CARD,
  FIGHT_DEFAULT_CLASH_REACH,
  FIGHT_DEFAULT_TEMPER,
  FIGHT_DERIVED_DREAD_OFFSET,
  FIGHT_DERIVED_MIGHT_BANDS,
  FIGHT_DERIVED_MIGHT_FLOOR,
  FIGHT_FAME_DREAD_STEP,
  FIGHT_FAME_REPUTATION_MIN,
  FIGHT_MORTAL_CLOCK,
  FIGHT_RATING_WORDS,
  FIGHT_TEMPER_TRAIT_PREFIX,
} from '../../data/fight-constants';

const TEMPERS: readonly FightTemper[] = ['stubborn', 'berserk', 'skittish', 'bargainer'];

/** An unknown word reads `fair` (fail-soft table: malformed `monsterState`). */
export function toRatingWord(value: unknown): FightRatingWord {
  return typeof value === 'string' && (FIGHT_RATING_WORDS as readonly string[]).includes(value)
    ? (value as FightRatingWord)
    : 'fair';
}

/** Walk `steps` words along the rating ladder, clamped at both ends. */
export function shiftRatingWord(word: FightRatingWord, steps: number): FightRatingWord {
  const index = FIGHT_RATING_WORDS.indexOf(word);
  const next = Math.max(0, Math.min(FIGHT_RATING_WORDS.length - 1, index + steps));
  return FIGHT_RATING_WORDS[next];
}

/** A mortal opponent's Might, from the raw score (highest band first). */
export function deriveMightWord(rawScore: number): FightRatingWord {
  for (const band of FIGHT_DERIVED_MIGHT_BANDS) {
    if (rawScore >= band.minRaw) return band.word;
  }
  return FIGHT_DERIVED_MIGHT_FLOOR;
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toReach(value: unknown): ReachDomain | undefined {
  return typeof value === 'string' && (REACH_DOMAINS as readonly string[]).includes(value)
    ? (value as ReachDomain)
    : undefined;
}

/**
 * The opponent's temper, from a `trait.temper.*` trait edge. Default stubborn.
 * Edges are walked in id order, so a node carrying two tempers reads the same
 * one every time (NFP #3).
 */
export function readTemper(graph: WorldGraph, opponentId: string): FightTemper {
  const edges = [...graph.getOutgoingEdges(opponentId, 'has_trait')]
    .sort((a, b) => a.target.localeCompare(b.target));
  for (const edge of edges) {
    if (!edge.target.startsWith(FIGHT_TEMPER_TRAIT_PREFIX)) continue;
    const temper = edge.target.slice(FIGHT_TEMPER_TRAIT_PREFIX.length);
    if ((TEMPERS as readonly string[]).includes(temper)) return temper as FightTemper;
  }
  return FIGHT_DEFAULT_TEMPER;
}

/**
 * Clock segments recovered since the clock was last written — lazy, so there is
 * no per-tick phase and no per-tick cost (plan doc §5).
 */
export function recoveredSegments(tick: number, clockUpdatedTick: number | undefined): number {
  if (clockUpdatedTick === undefined || !Number.isFinite(clockUpdatedTick)) return 0;
  const elapsed = tick - clockUpdatedTick;
  if (elapsed <= 0) return 0;
  return Math.floor(elapsed / FIGHT_CLOCK_RECOVERY_TICKS);
}

/** The card a node without one fights as. */
export function defaultOpponentCard(opponentId: string | null): OpponentCard {
  return {
    opponentId,
    dread: FIGHT_DEFAULT_CARD.dread,
    might: FIGHT_DEFAULT_CARD.might,
    clockSize: FIGHT_DEFAULT_CARD.clockSize,
    clockFilled: 0,
    temper: FIGHT_DEFAULT_TEMPER,
    persistent: false,
    source: 'default',
  };
}

/**
 * Read an opponent's card at `tick` (plan doc §2).
 *
 * Fail-soft on every field: an unknown word reads `fair`, a non-finite clock value
 * reads 0, and the clock is clamped to `[0, clockSize]`.
 */
export function readOpponentCard(
  graph: WorldGraph,
  opponentId: string | null | undefined,
  tick: number,
): OpponentCard {
  const node = opponentId ? graph.getNode(opponentId) : undefined;
  if (!opponentId || !node) return defaultOpponentCard(opponentId ?? null);

  const temper = readTemper(graph, opponentId);
  const bag = node.properties.monsterState;
  if (bag && typeof bag === 'object') {
    const state = bag as Record<string, unknown>;
    const clockSize = Math.max(1, Math.floor(finiteOr(state.clockSize, FIGHT_DEFAULT_CARD.clockSize)));
    const stored = finiteOr(state.clockFilled, 0);
    const recovered = recoveredSegments(
      tick,
      typeof state.clockUpdatedTick === 'number' ? state.clockUpdatedTick : undefined,
    );
    const clockFilled = Math.max(0, Math.min(clockSize, stored - recovered));
    return {
      opponentId,
      dread: toRatingWord(state.dread),
      might: toRatingWord(state.might),
      nerveReach: toReach(state.nerveReach),
      clashReach: toReach(state.clashReach),
      clockSize,
      clockFilled,
      // A card's own temper wins over the trait: plan doc 3 writes it there.
      temper: typeof state.temper === 'string' && (TEMPERS as readonly string[]).includes(state.temper)
        ? (state.temper as FightTemper)
        : temper,
      persistent: true,
      source: 'monsterState',
    };
  }

  // A mortal opponent: derived from the raw clash-reach score (THR-1264).
  const might = deriveMightWord(computeRawScore(graph, opponentId, FIGHT_DEFAULT_CLASH_REACH));
  const reputation = finiteOr(node.properties.reputationScore, 0);
  const famous = reputation >= FIGHT_FAME_REPUTATION_MIN;
  const dread = shiftRatingWord(
    might,
    FIGHT_DERIVED_DREAD_OFFSET + (famous ? FIGHT_FAME_DREAD_STEP : 0),
  );
  return {
    opponentId,
    dread,
    might,
    clockSize: FIGHT_MORTAL_CLOCK,
    clockFilled: 0,
    temper,
    persistent: false,
    source: 'derived',
  };
}
