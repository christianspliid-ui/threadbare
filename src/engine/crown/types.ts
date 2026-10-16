/**
 * The crown — shapes (THR-1932). Plan: `Docs/plans/2026-10-15-thr-1932-crown.md` § 3.
 *
 * One edge carries the whole oath: `sworn_to`, vassal → liege. These are its properties.
 */

export type OathKind = 'persuaded' | 'bought' | 'coerced';

/** The six things that move loyalty, in table order (the break-reason tie order). */
export type LoyaltyReason =
  | 'liege_wealthy'
  | 'liege_strained'
  | 'liege_destitute'
  | 'holding_lost'
  | 'outgrown'
  | 'rival_offer';

export const LOYALTY_REASON_ORDER: readonly LoyaltyReason[] = [
  'liege_wealthy',
  'liege_strained',
  'liege_destitute',
  'holding_lost',
  'outgrown',
  'rival_offer',
];

export interface LoyaltyDelta {
  reason: LoyaltyReason;
  amount: number;
}

export interface SwornToEdgeProperties {
  kind: OathKind;
  /** FEALTY_TAX_SHARE at swearing. */
  taxShare: number;
  /** 0–1, worded with the reputation ladder; below OATH_BREAK_THRESHOLD the oath breaks. */
  loyalty: number;
  swornTick: number;
  /** Coin moved liege → vassal when the oath was bought; 0 otherwise. */
  giftPaid: number;
  /** The last daily pass: what moved loyalty and by how much. */
  lastLoyaltyDay: { tick: number; deltas: LoyaltyDelta[] } | null;
  /** Losses inside OATH_BREAK_REASON_WINDOW_DAYS, trimmed each pass — names a break's reason. */
  recentLosses: { tick: number; reason: LoyaltyReason; amount: number }[];
  /** Fealty tax paid over the oath's life (the break trace reports it). */
  taxPaidTotal: number;
  /** The tax paid on the last pay day. */
  taxPaidToday: number;
  /** Tick of the last loyalty pass (holding_lost reads conquests after it). */
  lastPassTick: number;
}

/** One offer's four inputs and its score (the trace and the debug tab read these). */
export interface OfferParts {
  protection: number;
  gift: number;
  standing: number;
  pride: number;
  score: number;
  threat: number;
}
