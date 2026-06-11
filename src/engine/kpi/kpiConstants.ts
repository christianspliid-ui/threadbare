/**
 * KPI Harness constants (THR-457).
 * All threshold defaults are first-guess targets — THR-451/452/453 will retune them.
 */

/** failure+critical_failure share above this = red */
export const KPI_FAILURE_RATE_MAX = 0.35;
/** critical_failure share above this = red */
export const KPI_CRITFAIL_RATE_MAX = 0.05;
/** clean success share below this = red */
export const KPI_CLEAN_SUCCESS_MIN = 0.40;
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
/** batch report seed set */
export const KPI_REPORT_SEEDS: number[] = [42, 99, 7];
/** batch report run length in ticks */
export const KPI_REPORT_TICKS = 120;
/** relative band around red threshold rendered amber (e.g. 0.15 = ±15% of threshold) */
export const KPI_AMBER_BAND = 0.15;
