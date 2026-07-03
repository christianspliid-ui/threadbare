/**
 * KPI Harness constants (THR-457).
 *
 * THR-571 retune encodes the creative verdict (Christian, 2026-07-03): target
 * ~55–65% total success, with the remaining failures converted to story — no
 * outcome reads as dead air. Clean success is a *skill signal*, not the bulk;
 * at-cost is the texture of the world; each critical tail must still fire so the
 * dice can astonish; failure that leaves no story artifact is the real defect.
 */

/** failure+critical_failure share above this = red. THR-571: 0.35 → 0.40 (failure 35–45% is fine *if converted to story*). */
export const KPI_FAILURE_RATE_MAX = 0.40;
/** critical_failure share above this = red (ceiling — a catastrophe every action is not drama). */
export const KPI_CRITFAIL_RATE_MAX = 0.05;
/** clean success share below this = red. THR-571: 0.40 → 0.20 (clean success is a skill signal, not the bulk). */
export const KPI_CLEAN_SUCCESS_MIN = 0.20;
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
/** Total success (success + success_at_cost + critical_success) floor — the verdict band's lower edge. */
export const KPI_TOTAL_SUCCESS_MIN = 0.55;
/** Total success ceiling — above this the world is too easy and stops reading as pressure. */
export const KPI_TOTAL_SUCCESS_MAX = 0.65;
/** success_at_cost share floor — at-cost is the texture of the world, it should be common. */
export const KPI_AT_COST_SHARE_MIN = 0.25;
/** success_at_cost share ceiling — above this, "won but…" stops feeling earned. */
export const KPI_AT_COST_SHARE_MAX = 0.45;
/** Each critical tail (success and failure) must fire at least this often — "the dice can still astonish". */
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
