/**
 * Content-judgments runner constants (THR-1723, plan § Constants table).
 *
 * Every threshold, cap, price, option list and sample size of the encounter
 * coverage run is named here (NFP #1). Offline tooling only: nothing under
 * `src/` imports this file, and nothing in the shipped build calls TypeSafe.
 */

/** Pinned model id; thresholds are tuned against it. A model change re-runs calibration. */
export const JEV_MODEL = 'jev-1.13.0';

/** HTTP endpoint (docs.typesafe.ai/api.md, read 2026-10-15). */
export const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';

/** Input price in USD per million tokens, for the cost line. Read from the docs 2026-10-14; update with the model. */
export const JEV_PRICE_PER_MTOK_USD = 0.042;

/** Bumped on any question-text, option or quoted-canon change; invalidates cached rows. */
export const ENCOUNTER_COVERAGE_QUESTIONS_VERSION = 1;

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
