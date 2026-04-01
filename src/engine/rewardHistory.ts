/**
 * Reward History Ring Buffer
 *
 * Module-level ring buffer for recent reward events, purpose-built for
 * reward/condition debugging. Unlike the trace buffer (capped at 500,
 * cleared each tick), entries here persist for the session.
 *
 * Called from orchestrator on each reward draw or empty-pool event.
 * Exposed via window.__DEBUG.getRecentRewards().
 */

// ─── Constants ──────────────────────────────────────────────────

/** Maximum entries retained. FIFO eviction beyond this cap. */
export const REWARD_HISTORY_CAP = 200;

// ─── Types ──────────────────────────────────────────────────────

export interface RewardHistoryEntry {
  tick: number;
  agentId: string;
  agentName: string;
  encounterId: string;
  /** null when pool was empty — no reward drawn */
  templateId: string | null;
  templateName: string | null;
  instanceId: string | null;
  category: string | null;
  tier: number | null;
  isBadOutcome: boolean;
  poolSize: number;
  roll: number | null;
}

// ─── Storage ────────────────────────────────────────────────────

const _entries: RewardHistoryEntry[] = [];

// ─── API ────────────────────────────────────────────────────────

/** Record a reward event (draw or empty pool). Evicts oldest if cap exceeded. */
export function recordReward(entry: RewardHistoryEntry): void {
  _entries.push(entry);
  if (_entries.length > REWARD_HISTORY_CAP) {
    _entries.shift();
  }
}

/** Get the last n reward entries (default: all retained entries). */
export function getRecentRewards(n?: number): readonly RewardHistoryEntry[] {
  if (n === undefined || n >= _entries.length) return [..._entries];
  return _entries.slice(-n);
}

/** Clear all entries. Called on game reset. */
export function clearRewardHistory(): void {
  _entries.length = 0;
}
