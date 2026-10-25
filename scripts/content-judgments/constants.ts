/**
 * Content-judgments runner constants (THR-1723, plan § Constants table).
 *
 * Every threshold, cap, price, option list and sample size of the encounter
 * coverage run is named here (NFP #1). Offline tooling only: nothing under
 * `src/` imports this file, and nothing in the shipped build calls TypeSafe.
 */

/**
 * Pinned model id; thresholds are tuned against it. A model change re-runs calibration.
 * Confirmed as the answering version by the first full run (THR-1850, 2026-10-15).
 */
export const JEV_MODEL = 'jev-1.13.0';

/** HTTP endpoint (docs.typesafe.ai/api.md, read 2026-10-15). */
export const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

/** Input price in USD per million tokens, for the cost line. Read from the docs 2026-10-14; update with the model. */
export const JEV_PRICE_PER_MTOK_USD = 0.042;

/** Bumped on any question-text, option or quoted-canon change; invalidates cached rows. */
export const ENCOUNTER_COVERAGE_QUESTIONS_VERSION = 2;

/**
 * FNV-1a of the base question set's JSON. `content-judgments-questions.test.ts` pins it, so
 * any change to a question, an option or a quoted canon or catalog line fails the test until
 * this fingerprint is updated and `ENCOUNTER_COVERAGE_QUESTIONS_VERSION` is bumped with it.
 */
export const ENCOUNTER_COVERAGE_QUESTIONS_FINGERPRINT = 'b4fe6785';

/** Output buffer for `git show` of the previous artifact (a full run is several MB). */
export const GIT_SHOW_MAX_BUFFER_BYTES = 64 * 1024 * 1024;

/** The doctrine version recorded on every artifact (content-judgments rule 3). */
export const CONTENT_JUDGMENTS_DOCTRINE = 'prose@2';

/** State cap in characters; keeps state + the longest question under Jev's 32k-token limit. */
export const ENCOUNTER_STATE_MAX_CHARS = 24_000;

/**
 * The nine seated activity words — the encounter kind's `encounterType` projected as tags
 * (`src/data/content-tags.ts`, THR-1641). `#trade` is seated as a walk of life and stays there.
 */
export const ACTIVITY_TAGS = [
  '#explore', '#assist', '#duel', '#lead', '#build', '#steal', '#create', '#acquire', '#hire',
] as const;

/**
 * Walk-of-life option list: every seated `family` word whose catalog line names a domain
 * of life rather than an object class, a trait class, a reputation or an errand family
 * (plan Decision 1). A judging list local to this run, not a tag axis.
 */
export const WALK_OF_LIFE_TAGS = [
  '#combat', '#knowledge', '#craft', '#healing', '#survival', '#stealth', '#social', '#trade',
  '#travel', '#discovery', '#territorial', '#wilderness', '#ruins', '#divine', '#arcane',
  '#nature', '#fate',
] as const;

/** The no-match option every Choice carries. */
export const NO_MATCH_OPTION = 'none';

/** Parallel requests. */
export const RUN_CONCURRENCY = 4;

/** Backoff attempts on 429 / 529 / network error before the row is kept as `error`. */
export const RUN_MAX_RETRIES = 5;

/** Exponential backoff base in milliseconds. */
export const RUN_BACKOFF_BASE_MS = 1_000;

/** Refuse a planned run above this input-token estimate unless `--force`. A guard, not a budget. */
export const RUN_MAX_INPUT_TOKENS = 5_000_000;

/** Characters per token used by the pre-run estimate. */
export const ESTIMATE_CHARS_PER_TOKEN = 4;

/** Above this share of errored rows the report is marked partial and the runner exits 1. */
export const RUN_PARTIAL_ERROR_SHARE = 0.1;

/** Calibration sample: this many entries per declared Reach (8 × 8 = 64). */
export const CALIBRATION_SAMPLE_PER_REACH = 8;

/** Agreement the confident band must reach. */
export const CALIBRATION_TARGET_AGREEMENT = 0.85;

/** The threshold must admit at least this share of the sample. */
export const CALIBRATION_MIN_ADMITTED_SHARE = 0.5;

/** Candidate-threshold grid step. */
export const CALIBRATION_STEP = 0.05;

/** Pre-calibration placeholder for Choice confidence; replaced by the calibrated value. */
export const DEFAULT_CHOICE_CONFIDENCE = 0.6;

/** Pre-calibration placeholder for Sphere Nouls. */
export const DEFAULT_SPHERE_YES = 0.7;

/** Pre-calibration placeholder for tag-fit Nouls. */
export const DEFAULT_TAG_FIT_NO = 0.3;

/*
 * Calibrated thresholds (THR-1850). Measured against `JEV_MODEL` and questions v1 on the
 * 64-entry sample, labelled by a blind Claude reader subagent; the tables are in the
 * `calibration` block of `origin/ops:Docs/ops/content-judgments/encounter-coverage.json`.
 * `null` = uncalibrated: no cut reached CALIBRATION_TARGET_AGREEMENT over
 * CALIBRATION_MIN_ADMITTED_SHARE of the sample, so every answer on that axis routes to review.
 * They apply when a run answers on `JEV_MODEL` and has no carried thresholds of its own.
 */

/** Reach: 88.6% agreement over 35 of 64 at 0.80. */
export const CALIBRATED_REACH_CONFIDENCE: number | null = 0.8;

/** Activity: uncalibrated — 85% first appears at 0.85, which admits only 47% of the sample. */
export const CALIBRATED_ACTIVITY_CONFIDENCE: number | null = null;

/** Walk of life: 86.7% agreement over 60 of 64 at 0.50. */
export const CALIBRATED_WALK_OF_LIFE_CONFIDENCE: number | null = 0.5;

/** Sphere yes: uncalibrated — agreement stays at 62–68% until the cut admits under a third of answers. */
export const CALIBRATED_SPHERE_YES: number | null = null;

/** Tag-fit no: 0.40 (87.5% at a 0.60 cut over 8 of 10 labelled tag fits — a thin sample). */
export const CALIBRATED_TAG_FIT_NO: number | null = 0.4;

/** When the thresholds above were measured. */
export const CALIBRATED_AT = '2026-10-15T11:57:24.635Z';

/** The question-set version the thresholds above were measured on; a bump makes them stale. */
export const CALIBRATED_QUESTIONS_VERSION = 1;

/** A grid cell below this count is "thin". */
export const COVERAGE_THIN_CELL = 3;

/** Share of confident `walk_of_life = none` answers that raises the possible-missing-theme finding. */
export const NO_MATCH_SHARE_FLAG = 0.15;

/** Probabilities are persisted rounded to this many decimal places. */
export const PROBABILITY_DECIMALS = 3;

/** Where the artifact and report live, on the `ops` branch (and in the worktree before publish). */
export const COVERAGE_OUTPUT_DIR = 'Docs/ops/content-judgments';
export const COVERAGE_ARTIFACT_FILE = 'encounter-coverage.json';
export const COVERAGE_REPORT_FILE = 'encounter-coverage.md';

/** The env var the key is read from. Never logged, never written. */
export const TYPESAFE_KEY_ENV = 'TYPESAFE_API_KEY';
