/**
 * Attention & Notification Tier Constants
 *
 * All tunable numbers for the Attention Pool, Thread Tugs, Story Beat pacing,
 * Read-the-Threads action, Dormant Threads, Notable event thresholds, and
 * Ambient Activity icon rendering.
 *
 * Every number here appears in the CMS Configuration Manager (src/components/CMS/tunableConstants.ts).
 * Change game feel by editing values here — no logic rewrites needed.
 */

// ── Time Base ────────────────────────────────────────────────────────────────

export const TICKS_PER_DAY = 12;

// ── Attention Pool ───────────────────────────────────────────────────────────

/** Maximum attention the player can hold at once. */
export const ATTENTION_BASE_CAPACITY = 6;

/** Attention regenerated per tick when not at capacity. */
export const ATTENTION_BASE_REGEN = 0.4;

/** Pool fill fraction above which the pool is considered "Focused". */
export const ATTENTION_POOL_FOCUSED_THRESHOLD = 0.6;

/** Pool fill fraction above which the pool is considered "Busy". */
export const ATTENTION_POOL_BUSY_THRESHOLD = 0.3;

/** Pool fill fraction above which the pool is considered "Strained". */
export const ATTENTION_POOL_STRAINED_THRESHOLD = 0.1;

// ── Attention Costs ──────────────────────────────────────────────────────────

/** Attention cost for a moderate-difficulty attend action. */
export const ATTEND_COST_MODERATE = 1.0;

/** Attention cost for a hard-difficulty attend action. */
export const ATTEND_COST_HARD = 1.5;

/** Attention cost to attend a story beat. */
export const ATTEND_COST_STORY_BEAT = 2.0;

/** Attention cost per tick to sustain attention on a story phase. */
export const ATTEND_COST_STORY_PHASE = 0.5;

/** Attention cost to acknowledge a Notable event thread tug. */
export const ATTEND_COST_NOTABLE = 0.5;

/** Cost multiplier for attending the first agent in your court. */
export const COURT_COST_MULTIPLIER_FIRST = 0.5;

/** Cost multiplier for attending a retinue member. */
export const COURT_COST_MULTIPLIER_RETINUE = 1.0;

/** Cost multiplier for attending a watched (observed) agent. */
export const COURT_COST_MULTIPLIER_WATCHED = 1.5;

// ── Thread Tugs ──────────────────────────────────────────────────────────────

/** Ticks a thread tug lingers before expiring if not attended. */
export const THREAD_TUG_LINGER = 3;

/** Minimum ticks between successive attend actions on the same thread. */
export const ATTEND_COOLDOWN = 1;

/** Maximum thread tugs the player can have active simultaneously. */
export const MAX_CONCURRENT_TUGS = 3;

/** Pool fill ratio above which FOMO overflow warnings trigger (tugs > capacity). */
export const FOMO_OVERFLOW_RATIO = 1.4;

// ── Story Beat Pacing ────────────────────────────────────────────────────────

/** Ticks between story beat triggers on the same thread. */
export const STORY_BEAT_COOLDOWN = 12;

/** Maximum queued story beats before overflow policy applies. */
export const STORY_BEAT_QUEUE_MAX = 3;

/**
 * When true, story beats that overflow the queue are demoted to Notable events
 * rather than dropped silently.
 */
export const STORY_BEAT_QUEUE_OVERFLOW_DEMOTE = true;

// ── Read the Threads ─────────────────────────────────────────────────────────

/** Minimum ticks between uses of the Read the Threads action. */
export const READ_THREADS_COOLDOWN = 6;

/** Essence cost to read a 6-tick digest window. */
export const READ_THREADS_COST_6 = 2;

/** Essence cost to read a 12-tick digest window. */
export const READ_THREADS_COST_12 = 4;

/** Essence cost to read a 24-tick digest window. */
export const READ_THREADS_COST_24 = 8;

/** Essence cost to read a 36-tick digest window. */
export const READ_THREADS_COST_36 = 12;

/** Ticks of events kept in the digest buffer before being pruned. */
export const DIGEST_BUFFER_RETENTION = 48;

// ── Dormant Threads ──────────────────────────────────────────────────────────

/** Essence multiplier applied to dormant thread maintenance each tick. */
export const DORMANT_ESSENCE_MULTIPLIER = 0.5;

/** Attention cost to send an active thread dormant. */
export const DORMANT_ACTIVATION_COST = 2;

/** Attention cost to reactivate a dormant thread. */
export const DORMANT_REACTIVATION_COST = 4;

/** Minimum ticks between dormant ↔ active transitions on the same thread. */
export const DORMANT_REACTIVATION_COOLDOWN = 3;

// ── Notable Thresholds ───────────────────────────────────────────────────────

/** Quintessence loss fraction that qualifies an event as Notable. */
export const NOTABLE_QUINTESSENCE_LOSS = 0.3;

/** Reputation delta magnitude that qualifies an event as Notable. */
export const NOTABLE_REPUTATION_DELTA = 0.3;

/** Whether losing an attachment always qualifies as a Notable event. */
export const NOTABLE_ATTACHMENT_LOSS = true;

/** Whether agent tier promotion always qualifies as a Notable event. */
export const NOTABLE_TIER_PROMOTION = true;

/** Whether completing an encounter chain always qualifies as a Notable event. */
export const NOTABLE_CHAIN_COMPLETION = true;

// ── Ambient Activity Icons ───────────────────────────────────────────────────

/** Pixel radius of ambient activity icons on the hex map. */
export const ACTIVITY_ICON_SIZE = 7;

/** Opacity for background (non-player) activity icons. */
export const ACTIVITY_ICON_OPACITY_BACKGROUND = 0.4;

/** Opacity for shaping-tier activity icons. */
export const ACTIVITY_ICON_OPACITY_SHAPING = 0.6;

/** Opacity for story-tier activity icons. */
export const ACTIVITY_ICON_OPACITY_STORY = 0.8;

/** Animation pulse period in seconds for activity icons. */
export const ACTIVITY_ICON_PULSE_PERIOD = 1.75;

/** Camera zoom level below which activity icons are hidden. Regional zoom keeps them readable without map spam. */
export const ACTIVITY_ICON_ZOOM_HIDE_THRESHOLD = 5;

// ── Story-so-far Digest ───────────────────────────────────────────────────────

/** Lookback window in ticks for the story-so-far digest composition (3 game days). */
export const STORY_DIGEST_LOOKBACK_TICKS = 36;

/** Maximum beats included in a composed story digest. */
export const STORY_DIGEST_MAX_BEATS = 5;

/** Minimum beats required to render a story (below this shows empty state). */
export const STORY_DIGEST_MIN_BEATS = 2;

/** Maximum cached ThreadStoryComposition entries per runtime (LRU). */
export const STORY_DIGEST_CACHE_SIZE = 32;

/** Beat significance weight: isNotable flag. */
export const BEAT_SIG_NOTABLE = 0.40;

/** Beat significance weight: capability delta magnitude. */
export const BEAT_SIG_CAPABILITY = 0.15;

/** Beat significance weight: attachment gained/lost. */
export const BEAT_SIG_ATTACHMENT = 0.15;

/** Beat significance weight: quintessence delta magnitude. */
export const BEAT_SIG_QUINTESSENCE = 0.15;

/** Beat significance weight: recency boost (decays linearly over lookback window). */
export const BEAT_SIG_RECENCY = 0.15;

/** Minimum significance score to classify a beat as `pivot` (else `compound`). */
export const BEAT_SIG_PIVOT_MIN = 0.55;

/** Faction obligation older than this tick count becomes a `faction_debt` tension. */
export const TENSION_DEBT_AGE_TICKS = 24;

/** Master feature flag: false reverts ThreadDetailView to RecentActivityLog. */
export const STORY_SO_FAR_DIGEST_ENABLED = true;
