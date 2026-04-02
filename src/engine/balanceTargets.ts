/**
 * Balance Targets — versioned numeric expectations for the redesign.
 *
 * IMPORTANT: These are redesign targets, not current-baseline assertions.
 * The current game is expected to miss most of these; that is by design.
 * The "before" picture (current behavior) is captured by running balance-eval
 * before phase 2 changes land.
 *
 * Sources:
 *   Docs/plans/2026-04-02-encounter-redesign-guidelines.md (step success bands, pacing)
 *   Docs/plans/2026-04-02-phase1-balance-eval-foundation-plan.md (metric families)
 */

import type { BalanceTargets, BalanceMetricBand } from '../types/balanceEval';

// ─── Version ──────────────────────────────────────────────────────

/** Bump when target bands change materially. Stored in run summaries and exports. */
export const BALANCE_TARGETS_VERSION = '0.1.0-phase1';

// ─── Helpers ──────────────────────────────────────────────────────

function band(
  metricId: string,
  label: string,
  min: number,
  max: number,
  warnBelow?: number,
  warnAbove?: number,
  scope?: string,
  lowerIsBetter?: boolean,
): BalanceMetricBand {
  const b: BalanceMetricBand = { metricId, label, min, max };
  if (warnBelow !== undefined) b.warnBelow = warnBelow;
  if (warnAbove !== undefined) b.warnAbove = warnAbove;
  if (scope !== undefined) b.scope = scope;
  if (lowerIsBetter !== undefined) b.lowerIsBetter = lowerIsBetter;
  return b;
}

// ─── Default Targets ──────────────────────────────────────────────

export const DEFAULT_BALANCE_TARGETS: BalanceTargets = {
  version: BALANCE_TARGETS_VERSION,
  description:
    'Phase 1 redesign targets. The current game is expected to miss most of these. ' +
    'Run balance-eval before phase 2 to establish the before-state baseline.',
  bands: [
    // ── Step success rates by threat band ──
    // Source: encounter-redesign-guidelines.md §2 "Step-level success bands"
    // Semantics: min/max = fail boundary; warnBelow/warnAbove = pass boundary (inner ideal zone).
    // fail if actual < min or > max; warning if in [min, warnBelow) or (warnAbove, max]; pass if in [warnBelow, warnAbove].
    band('step_success_rate', 'Step success rate', 0.82, 0.97, 0.85, 0.95, 'trivial'),
    band('step_success_rate', 'Step success rate', 0.72, 0.88, 0.75, 0.85, 'easy'),
    band('step_success_rate', 'Step success rate', 0.55, 0.78, 0.60, 0.75, 'moderate'),
    band('step_success_rate', 'Step success rate', 0.35, 0.65, 0.40, 0.60, 'hard'),
    band('step_success_rate', 'Step success rate', 0.20, 0.50, 0.25, 0.45, 'deadly'),
    band('step_success_rate', 'Step success rate', 0.08, 0.30, 0.10, 0.25, 'epic'),

    // ── Encounter completion rates by threat band ──
    band('completion_rate', 'Encounter completion rate', 0.75, 0.98, 0.80, 0.95, 'trivial'),
    band('completion_rate', 'Encounter completion rate', 0.65, 0.90, 0.70, 0.85, 'easy'),
    band('completion_rate', 'Encounter completion rate', 0.45, 0.76, 0.50, 0.70, 'moderate'),
    band('completion_rate', 'Encounter completion rate', 0.25, 0.62, 0.30, 0.55, 'hard'),
    band('completion_rate', 'Encounter completion rate', 0.10, 0.48, 0.15, 0.40, 'deadly'),

    // ── Fail-forward share ──
    // Target: >60% of encounters should still produce a meaningful state change on failure.
    // In phase 1 this is proxied by completion rate; phase 2 will add explicit fail-forward tags.
    band('fail_forward_share', 'Fail-forward share of encounters', 0.55, 1.0, 0.60, undefined, undefined),

    // ── Critical failure share by threat band ──
    // Lower is better; crit failures should scale with threat
    band('crit_failure_share', 'Critical failure share', 0.0, 0.05, undefined, 0.04, 'trivial', true),
    band('crit_failure_share', 'Critical failure share', 0.0, 0.08, undefined, 0.07, 'easy', true),
    band('crit_failure_share', 'Critical failure share', 0.0, 0.12, undefined, 0.10, 'moderate', true),
    band('crit_failure_share', 'Critical failure share', 0.0, 0.18, undefined, 0.15, 'hard', true),
    band('crit_failure_share', 'Critical failure share', 0.0, 0.25, undefined, 0.22, 'deadly', true),

    // ── Quintessence loss per encounter by threat band ──
    // Source: encounter-redesign-guidelines.md §3 "Quintessence pacing" magnitudes table
    band('quintessence_loss_per_encounter', 'Avg quintessence loss per encounter', 0.0, 0.015, undefined, 0.012, 'trivial'),
    band('quintessence_loss_per_encounter', 'Avg quintessence loss per encounter', 0.003, 0.025, 0.005, 0.022, 'easy'),
    band('quintessence_loss_per_encounter', 'Avg quintessence loss per encounter', 0.008, 0.060, 0.010, 0.055, 'moderate'),
    band('quintessence_loss_per_encounter', 'Avg quintessence loss per encounter', 0.020, 0.120, 0.025, 0.110, 'hard'),
    band('quintessence_loss_per_encounter', 'Avg quintessence loss per encounter', 0.050, 0.250, 0.060, 0.230, 'deadly'),

    // ── Quintessence recovery per 100 ticks ──
    // Design target: 0.0003-0.0007/tick → 0.03-0.07 per 100 ticks
    // Current value (QUINTESSENCE_PASSIVE_REGEN = 0.002/tick) is ~6x too fast per the guideline.
    band('quintessence_recovery_per_100_ticks', 'Quintessence recovery per 100 ticks', 0.025, 0.08, 0.03, 0.07, undefined),

    // ── Reward cadence ──
    band('durable_rewards_per_100_encounters', 'Durable rewards per 100 encounters', 1.5, 9, 2, 8, undefined),
    band('consumable_rewards_per_100_encounters', 'Consumable rewards per 100 encounters', 12, 55, 15, 50, undefined),
    band('conditions_per_100_encounters', 'Conditions per 100 encounters', 3, 30, 5, 25, undefined),

    // ── Pacing milestones (in ticks) ──
    // Source: encounter-redesign-guidelines.md §3 "Target milestone cadence"
    // First meaningful reward: within 20-300 ticks of sim start
    band('time_to_first_reward', 'Time to first meaningful reward (ticks)', 15, 400, 20, 300, undefined),
    // First major setback: within 100-1800 ticks
    band('time_to_first_setback', 'Time to first major setback (ticks)', 80, 2500, 100, 1800, undefined),
    // First growth beat: within 20-600 ticks
    band('time_to_first_growth_beat', 'Time to first growth beat (ticks)', 15, 800, 20, 600, undefined),
  ],
};

// ─── Accessors ────────────────────────────────────────────────────

export function getDefaultBalanceTargets(): BalanceTargets {
  return DEFAULT_BALANCE_TARGETS;
}

/**
 * Get target bands for a specific metric id and optional scope.
 * Returns all matching bands (there may be multiple for different scopes).
 * If scope is undefined, returns all bands for that metricId.
 */
export function getTargetBands(metricId: string, scope?: string): BalanceMetricBand[] {
  return DEFAULT_BALANCE_TARGETS.bands.filter(b => {
    if (b.metricId !== metricId) return false;
    if (scope !== undefined && b.scope !== undefined && b.scope !== scope) return false;
    return true;
  });
}

/**
 * Get exactly one target band for a specific metric id and scope.
 * Returns null if no exact match.
 */
export function getTargetBand(metricId: string, scope: string): BalanceMetricBand | null {
  return DEFAULT_BALANCE_TARGETS.bands.find(
    b => b.metricId === metricId && b.scope === scope
  ) ?? null;
}
