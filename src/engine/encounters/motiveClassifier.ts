/**
 * Motive classification — why is this mortal *here*?
 * THR-773 (WS0 engine substrate).
 *
 * A pure read over the THR-631 motive receipt the scorer already writes. It adds
 * no scoring term, mutates nothing, and takes no rng draw — it only names the
 * causality that was already computed, so the WS2 encounter header can say
 * "she chose this" rather than leaving the player to guess.
 *
 * Consumed by the WS2 header and exposed via `__DEBUG`.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
 */

import type { MotiveContribution, MotiveReceipt } from '../../types/foreshadowing';
import { MOTIVE_DOMINANT_SHARE } from '../../data/nudge-constants';

/**
 * Where the impulse for this encounter came from.
 *
 * - `divine` — the god's own hand: a player intervention or a god-sponsored seed.
 * - `mission` — assigned: an ambition or a faction's errand.
 * - `choice` — the mortal's own values and appetites decided it.
 * - `chance` — nothing dominant; they were simply there. The fallback.
 */
export type MotiveSource = 'choice' | 'mission' | 'chance' | 'divine';

/**
 * Receipt contribution kinds that read as *assigned* work rather than personal
 * appetite. An ambition is a standing commitment; reputation and bond pressure
 * is a debt owed to someone else.
 */
const MISSION_KINDS: ReadonlySet<MotiveContribution['kind']> = new Set([
  'ambition',
  'chain',
  'reputation',
  'bond',
]);

/** Contribution kinds that read as the mortal's own wanting. */
const CHOICE_KINDS: ReadonlySet<MotiveContribution['kind']> = new Set([
  'personality',
  'resonance',
  'doom_identity',
  'exploration',
  'rarity',
]);

/** Contribution kinds that mean a god's thumb was on the scale. */
const DIVINE_KINDS: ReadonlySet<MotiveContribution['kind']> = new Set([
  'divine',
  'mark',
  'hunch',
]);

/** Provenance signals that the action or its seed traces back to the player. */
export interface MotiveProvenance {
  /** The action was cast by the player, or seeded by a player intervention. */
  readonly playerSourced?: boolean;
  /** Seed provenance id, when the encounter grew from a god-sponsored seed. */
  readonly seedInterventionId?: string;
}

function shareOf(
  contributions: readonly MotiveContribution[],
  kinds: ReadonlySet<MotiveContribution['kind']>,
): number {
  let total = 0;
  for (const c of contributions) {
    if (kinds.has(c.kind)) total += Math.max(0, c.weight);
  }
  return total;
}

/**
 * Classify why this encounter is happening to this mortal.
 *
 * Order is deliberate and not a tie-break convenience: divine provenance wins
 * outright, because a god's intervention is the loudest fact about a scene even
 * when the mortal also wanted it. Below that, whichever of mission/choice
 * clears `MOTIVE_DOMINANT_SHARE` claims it; the larger share wins if both do.
 *
 * Fail-soft (NFP #4): a missing receipt, an empty contribution list, or a
 * receipt whose shares clear nothing all classify as `'chance'` — never throw,
 * never guess.
 */
export function classifyMotive(
  receipt: MotiveReceipt | null | undefined,
  provenance: MotiveProvenance = {},
): MotiveSource {
  if (provenance.playerSourced || provenance.seedInterventionId) return 'divine';

  const contributions = receipt?.contributions;
  if (!contributions || contributions.length === 0) return 'chance';

  if (shareOf(contributions, DIVINE_KINDS) >= MOTIVE_DOMINANT_SHARE) return 'divine';

  const mission = shareOf(contributions, MISSION_KINDS);
  const choice = shareOf(contributions, CHOICE_KINDS);

  const missionClaims = mission >= MOTIVE_DOMINANT_SHARE;
  const choiceClaims = choice >= MOTIVE_DOMINANT_SHARE;

  if (missionClaims && choiceClaims) return mission >= choice ? 'mission' : 'choice';
  if (missionClaims) return 'mission';
  if (choiceClaims) return 'choice';

  return 'chance';
}

/**
 * Read the motive receipt an agent node carries (THR-631 writes it as a plain
 * property). Fail-soft: anything that is not a receipt-shaped object reads as
 * absent.
 */
export function readMotiveReceipt(
  properties: Record<string, unknown> | undefined,
): MotiveReceipt | null {
  const raw = properties?.motiveReceipt;
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<MotiveReceipt>;
  return Array.isArray(candidate.contributions) ? (raw as MotiveReceipt) : null;
}
