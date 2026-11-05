/**
 * The crown — the smoothed loyalty trend (THR-2170). Pure. The daily pass in
 * `crown.ts` writes it to the `sworn_to` edge; `fealtySentences.trendClause` reads it.
 */

import { LOYALTY_TREND_EMA_ALPHA } from '../../data/crown-constants';

/**
 * THR-2170 — fold one day's net loyalty change into the smoothed trend. Pure; the
 * crown's daily pass writes the result to the edge. A missing prior seeds from today.
 */
export function nextLoyaltyTrend(prior: number | undefined, todaySum: number): number {
  if (typeof prior !== 'number' || !Number.isFinite(prior)) return todaySum * LOYALTY_TREND_EMA_ALPHA;
  return prior + LOYALTY_TREND_EMA_ALPHA * (todaySum - prior);
}
