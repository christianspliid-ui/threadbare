/**
 * KPI Harness constants (THR-457).
 *
 * THR-571 retune encodes the creative verdict (Christian, 2026-07-03): target
 * ~55–65% total success, with the remaining failures converted to story — no
 * outcome reads as dead air. Clean success is a *skill signal*, not the bulk;
 * at-cost is the texture of the world; each critical tail must still fire so the
 * dice can astonish; failure that leaves no story artifact is the real defect.
 *
 * THR-571 U1 re-band (design gate, Christian via Cowork PM 2026-07-04):
 * "Option 1 — accept the capability-poor world." The acting population is
 * capability-poor by design, so `success_at_cost` (scrape-through) is the DOMINANT,
 * expected success texture — not a failure state. Clean/critical success are the
 * RARE things a god *notices* (signal bands, not bulk targets). The bands below are
 * fit empirically against seeds 42/99/7 × 120t so each still *means* something —
 * see the commit body / Linear closeout for the measured baseline table.
 */

/**
 * failure+critical_failure share above this = red. THR-571 U1 re-band: 0.40 → 0.50.
 * This is the honest complement of `KPI_TOTAL_SUCCESS_MIN` (0.50): total_success +
 * failure_rate ≡ 1, so "success stays roughly half-to-two-thirds" (Christian) means
 * failure may run up to half. A tighter ceiling would red out runs that legitimately
 * pass total_success_min. Every failure still converts to story (failure_story_rate ≥ 0.90).
 */
export const KPI_FAILURE_RATE_MAX = 0.50;
/**
 * critical_failure share above this = red (ceiling — a catastrophe every action is not drama).
 * THR-571 U1 re-band: 0.05 → 0.15. E2 un-gated the crit-failure tail, which lands at 5–14%
 * across the baseline seeds. Christian's gate: "crit_failure at 5–14% is fine; if 14% reads
 * too hot in play that's a separate severity/floor lever, not a gate change." The old 0.05
 * ceiling predated the un-gating and reds out the accepted range, so it rises to encode the verdict.
 */
export const KPI_CRITFAIL_RATE_MAX = 0.15;
/**
 * clean success share below this = red. THR-571 U1 re-band: 0.20 → 0.03, and the rate is now
 * the LIFETIME counter (cleanSuccessTotal/resolvedActionsTotal), not the windowed snapshot.
 * Clean success is a rare skill signal in a capability-poor world (measured 6–7.5% lifetime
 * across the baseline seeds); a 0.03 floor still means something (clears at ~2× margin) while
 * flagging a world where genuine capability never expresses. Windowed, this read 0% purely from
 * small-window variance — the reason the design gate moved it to a lifetime counter.
 */
export const KPI_CLEAN_SUCCESS_MIN = 0.03;
/**
 * critical success (lifetime) advisory floor — report-but-don't-gate. THR-571 U1 re-band:
 * crit_success is a fluke of brilliance from an incapable actor (measured 0.7–1.6% lifetime),
 * too rare to clear a nonzero gate with margin on every seed. Per the design gate, rather than
 * fake-green it at a floor of 0, it is ADVISORY: the row is computed and shown so a drop to
 * literal 0 is visible, but it does not fail the run. Revisit to a hard gate only if a
 * capability-lift upstream (design-gate Option 2) raises the tail.
 */
export const KPI_CRIT_SUCCESS_MIN = 0.005;
/** any single template above this selection share = red */
export const KPI_TEMPLATE_TOP_SHARE_MAX = 0.08;
/** normalized Shannon entropy below this = amber */
export const KPI_TEMPLATE_ENTROPY_MIN = 0.70;
/** branching fires per 30 ticks below this = red */
export const KPI_BRANCHING_FIRE_MIN_PER_30T = 1;
/** threaded-agent beats per 10 ticks below this = amber */
export const KPI_THREADED_BEAT_MIN_PER_10T = 1;
/** funnel counter memory bound — stop adding new keys beyond this */
export const KPI_FUNNEL_MAX_TEMPLATES = 512;

// ─── THR-571: Outcome-ladder verdict thresholds ────────────────────
/**
 * Total success (success + success_at_cost + critical_success) floor — the verdict band's lower edge.
 * THR-571 U1 re-band: 0.55 → 0.50 to cover the seed-7 dip while keeping the "half-to-two-thirds"
 * intent (Christian's gate item 2). Complements `KPI_FAILURE_RATE_MAX` (0.50).
 */
export const KPI_TOTAL_SUCCESS_MIN = 0.50;
/** Total success ceiling — above this the world is too easy and stops reading as pressure. */
export const KPI_TOTAL_SUCCESS_MAX = 0.65;
/**
 * success_at_cost share floor — at-cost is the texture of the world, it should be common.
 * THR-571 U1 re-band: 0.25 → 0.30 (gate item 1: keep a ~0.30 floor).
 */
export const KPI_AT_COST_SHARE_MIN = 0.30;
/**
 * success_at_cost share ceiling. THR-571 U1 re-band: 0.45 → 0.70. This is the CORE re-band:
 * scrape-through owning the success mass is the *intended* texture of a capability-poor world,
 * not a defect (Christian's gate item 1). Measured at_cost is 47–58% across the baseline seeds.
 */
export const KPI_AT_COST_SHARE_MAX = 0.70;
/** The crit-FAILURE tail must fire at least this often — "the dice can still astonish". (Crit-success is advisory; see KPI_CRIT_SUCCESS_MIN.) */
export const KPI_CRIT_TAIL_MIN = 0.02;
/**
 * Share of failure/critical_failure outcomes that must leave ≥1 story artifact
 * (complication / pressure / seed / mark). THR-571 C1 produces the numerator; until
 * that post-pass lands, the rate is null and the threshold is skipped (fail-soft).
 */
export const KPI_FAILURE_STORY_MIN = 0.90;

/** batch report seed set */
export const KPI_REPORT_SEEDS: number[] = [42, 99, 7];
/** batch report run length in ticks */
export const KPI_REPORT_TICKS = 120;
/** relative band around red threshold rendered amber (e.g. 0.15 = ±15% of threshold) */
export const KPI_AMBER_BAND = 0.15;

// ─── THR-1578: forecast-window gauge (plan 2026-09-24-thr-1575-forecast-window § Constants) ───
/**
 * Proficiency band edges on the 0–1 capability scale: novice < 0.35 ≤ journeyman
 * < 0.65 ≤ expert < 0.85 ≤ master. KPI-internal bucket labels — never rendered to a
 * player, and not the Domain Capability tier words in `domain-words.ts`.
 */
export const PROFICIENCY_BAND_EDGES: readonly [number, number, number] = [0.35, 0.65, 0.85];
/** Level-success invariant: each covered band's success must sit inside [MIN − tol, MAX + tol]. */
export const KPI_BAND_SUCCESS_MIN = 0.50;
export const KPI_BAND_SUCCESS_MAX = 0.65;
/** Sampling slack on the level-success invariant. */
export const KPI_BAND_TOLERANCE = 0.05;
/** A band is asserted only with this many resolved free-choice engagements; below it is a coverage gap. */
export const KPI_BAND_MIN_ENGAGEMENTS = 30;
/** Look-ahead (ticks after a failure resolves) for the retry-after-failure KPI. */
export const RETRY_WINDOW_TICKS = 24;
/** Max share of failures followed by the same mortal re-engaging the same template within the look-ahead. */
export const KPI_RETRY_AFTER_FAILURE_MAX = 0.10;
/** Max p95 run of consecutive failed free-choice engagements per mortal. */
export const KPI_FAILURE_STREAK_P95_MAX = 4;
/** Min engagements for a mortal to count in the attempted-difficulty trend. */
export const KPI_TREND_MIN_ENGAGEMENTS = 5;
/** Max share of rolls sitting exactly on a scale floor (measured by `measure:roll-spread`). */
export const KPI_FLOOR_PINNED_MAX = 0.05;
/** Min share of free-choice engagements whose forecast was in the engagement window. */
export const KPI_IN_WINDOW_MIN = 0.60;
/** Max rise in idle-decision rate against the pre-change baseline (checked by S3/S4). */
export const KPI_IDLE_RATE_DELTA_MAX = 0.05;
/** Max mean |planner step P − resolver step P| on the parity sample (S2). */
export const KPI_FORECAST_PARITY_MAX = 0.02;
/**
 * Memory bound on the runtime's resolved-engagement log. A 300-tick medium world
 * resolves a few thousand; the band totals stay lifetime past the bound, only the
 * streak/retry/trend views window.
 */
export const ENGAGEMENT_LOG_MAX = 20000;
