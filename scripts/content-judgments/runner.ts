/**
 * The encounter coverage run, as a function (THR-1723). `scripts/judge-encounters.ts` is
 * the thin CLI wrapper; tests drive this directly with a fake `fetch` and fake I/O, so no
 * test ever makes a network call.
 *
 * Order of operations, each a fail-soft row of the plan's table:
 *   1. build every blind state (no key needed);
 *   2. `--dry-run` prints one state and its question set, then stops — no network;
 *   3. no key → print the skip line, exit 0, write nothing;
 *   4. estimate input tokens; refuse above the ceiling unless `--force`;
 *   5. reuse cached rows, ask the rest at `RUN_CONCURRENCY`;
 *   6. a 401 stops the run and writes nothing; a failed row is kept with its error;
 *   7. write the artifact and report, mark `partial` above the error share.
 */
import {
  CONTENT_JUDGMENTS_DOCTRINE,
  ENCOUNTER_COVERAGE_QUESTIONS_VERSION,
  ESTIMATE_CHARS_PER_TOKEN,
  JEV_MODEL,
  JEV_PRICE_PER_MTOK_USD,
  RUN_CONCURRENCY,
  RUN_MAX_INPUT_TOKENS,
  RUN_PARTIAL_ERROR_SHARE,
  TYPESAFE_KEY_ENV,
} from './constants';
import type { BuiltEncounterState } from './encounterState';
import { buildBaseQuestions, buildQuestionsForEntry } from './encounterQuestions';
import { judge, JevAuthError, readApiKey, redact } from './jevClient';
import {
  calibrateThresholds,
  errorRow,
  PLACEHOLDER_THRESHOLDS,
  renderReport,
  reusableRow,
  rowFromAnswers,
  selectCalibrationSample,
  type CalibrationLabel,
  type EncounterCoverageArtifact,
  type EncounterJudgmentRow,
} from './coverageRollup';

export interface RunnerArgs {
  dryRun: boolean;
  limit: number | null;
  force: boolean;
  publish: boolean;
  calibrationPath: string | null;
}

export function parseRunnerArgs(argv: readonly string[]): RunnerArgs {
  const args: RunnerArgs = { dryRun: false, limit: null, force: false, publish: true, calibrationPath: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--no-publish') args.publish = false;
    else if (a === '--limit' && i + 1 < argv.length) {
      const n = Number(argv[++i]);
      args.limit = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    } else if (a === '--calibration' && i + 1 < argv.length) args.calibrationPath = argv[++i];
  }
  return args;
}

export interface RunnerIO {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly log: (line: string) => void;
  readonly fetchImpl?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now: () => Date;
  readonly sourceCommit: () => string;
  /** The previous artifact from `origin/ops`, or null when absent / unreadable. */
  readonly readPrevious: () => EncounterCoverageArtifact | null;
  readonly readCalibrationLabels: (path: string) => CalibrationLabel[];
  /** Write the artifact JSON and report markdown; returns the paths written. */
  readonly writeOutputs: (artifactJson: string, reportMd: string) => string[];
  /** Publish the written paths to `ops`; returns false on failure. */
  readonly publish: (paths: string[]) => boolean;
}

export interface RunnerResult {
  exitCode: number;
  artifact: EncounterCoverageArtifact | null;
}

/** Characters → tokens for the pre-run estimate. */
export function estimateInputTokens(states: readonly BuiltEncounterState[]): number {
  let chars = 0;
  for (const s of states) {
    chars += JSON.stringify(s.state).length + JSON.stringify(buildQuestionsForEntry(s.declared.familyTags)).length;
  }
  return Math.ceil(chars / ESTIMATE_CHARS_PER_TOKEN);
}

async function pool<T>(items: readonly T[], size: number, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await work(item);
    }
  });
  await Promise.all(lanes);
}

export async function runEncounterCoverage(
  allStates: readonly BuiltEncounterState[],
  args: RunnerArgs,
  io: RunnerIO,
): Promise<RunnerResult> {
  const states = [...allStates].sort((a, b) => a.id.localeCompare(b.id)).slice(0, args.limit ?? undefined);

  if (args.dryRun) {
    const first = states[0];
    if (!first) { io.log('judge:encounters: no Encounter-kind entries found'); return { exitCode: 0, artifact: null }; }
    io.log(`judge:encounters: dry run — ${states.length} entr${states.length === 1 ? 'y' : 'ies'} planned, no network call`);
    io.log(`estimated input tokens: ${estimateInputTokens(states)}`);
    io.log('--- state (blind) ---');
    io.log(JSON.stringify(first.state, null, 2));
    io.log(`--- questions (v${ENCOUNTER_COVERAGE_QUESTIONS_VERSION}) ---`);
    io.log(JSON.stringify(buildQuestionsForEntry(first.declared.familyTags), null, 2));
    return { exitCode: 0, artifact: null };
  }

  const apiKey = readApiKey(io.env);
  if (!apiKey) {
    io.log(`judge:encounters: skipped — ${TYPESAFE_KEY_ENV} is not set`);
    return { exitCode: 0, artifact: null };
  }

  // Read the labels before any paid call, so a bad path costs nothing.
  let labels: CalibrationLabel[] | null = null;
  if (args.calibrationPath) {
    try {
      labels = io.readCalibrationLabels(args.calibrationPath);
    } catch (err) {
      io.log(`judge:encounters: stopped — cannot read calibration labels at ${args.calibrationPath}: ${err instanceof Error ? err.message : String(err)}`);
      return { exitCode: 1, artifact: null };
    }
  }

  const previous = io.readPrevious();
  const startedAt = io.now();
  const rows = new Map<string, EncounterJudgmentRow>();
  const toAsk: BuiltEncounterState[] = [];
  for (const s of states) {
    const base = { id: s.id, contentHash: s.contentHash, truncated: s.truncated, declared: s.declared };
    if (Object.keys(s.state.encounter.text).length === 0) { rows.set(s.id, errorRow(base, 'no prose')); continue; }
    const cached = reusableRow(previous, s.id, s.contentHash, ENCOUNTER_COVERAGE_QUESTIONS_VERSION, JEV_MODEL);
    if (cached) rows.set(s.id, { ...cached, declared: s.declared, truncated: s.truncated });
    else toAsk.push(s);
  }
  const reusedRows = rows.size - [...rows.values()].filter(r => r.error === 'no prose').length;

  const estimate = estimateInputTokens(toAsk);
  if (estimate > RUN_MAX_INPUT_TOKENS && !args.force) {
    io.log(`judge:encounters: refused — estimated ${estimate} input tokens exceeds ${RUN_MAX_INPUT_TOKENS}; pass --force to run anyway`);
    return { exitCode: 1, artifact: null };
  }
  io.log(`judge:encounters: ${toAsk.length} to ask, ${reusedRows} reused, ~${estimate} input tokens`);

  let inputTokens = 0;
  let requests = 0;
  let answeredModel: string | null = null;
  let authFailed = false;
  await pool(toAsk, RUN_CONCURRENCY, async s => {
    if (authFailed) return;
    const base = { id: s.id, contentHash: s.contentHash, truncated: s.truncated, declared: s.declared };
    try {
      requests++;
      const res = await judge({
        apiKey,
        model: JEV_MODEL,
        state: s.state,
        questions: buildQuestionsForEntry(s.declared.familyTags),
        fetchImpl: io.fetchImpl,
        sleep: io.sleep,
      });
      inputTokens += res.usage?.input_tokens ?? 0;
      answeredModel ??= res.model;
      rows.set(s.id, rowFromAnswers(base, res.answers ?? {}));
    } catch (err) {
      if (err instanceof JevAuthError) { authFailed = true; return; }
      const message = err instanceof Error ? err.message : String(err);
      rows.set(s.id, errorRow(base, redact(message, apiKey)));
    }
  });

  if (authFailed) {
    io.log('judge:encounters: stopped — key rejected (401); nothing written');
    return { exitCode: 1, artifact: null };
  }

  const ordered = [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
  const errored = ordered.filter(r => r.error).length;
  const partial = ordered.length > 0 && errored / ordered.length > RUN_PARTIAL_ERROR_SHARE;
  const ranAt = io.now();

  const model = answeredModel ?? previous?.model ?? JEV_MODEL;
  // Thresholds were measured against one model and one question set; a change to either
  // drops them back to the placeholders until calibration runs again.
  const carry = previous !== null
    && previous.model === model
    && previous.questionsVersion === ENCOUNTER_COVERAGE_QUESTIONS_VERSION;
  let thresholds = carry && previous ? previous.thresholds : PLACEHOLDER_THRESHOLDS;
  let calibration = carry && previous ? previous.calibration : null;
  if (labels) {
    const result = calibrateThresholds(ordered, labels, ranAt.toISOString());
    thresholds = result.thresholds;
    calibration = {
      reader: 'blind Claude reader subagent',
      readerPrompt: '(see calibration labels file)',
      sampleIds: selectCalibrationSample(ordered),
      labels,
      tables: result.tables,
    };
  }

  const artifact: EncounterCoverageArtifact = {
    schema: 1,
    questionsVersion: ENCOUNTER_COVERAGE_QUESTIONS_VERSION,
    model,
    doctrine: CONTENT_JUDGMENTS_DOCTRINE,
    ranAt: ranAt.toISOString(),
    sourceCommit: io.sourceCommit(),
    partial,
    coldStart: previous === null,
    usage: {
      requests,
      inputTokens,
      usdEstimate: Number(((inputTokens / 1_000_000) * JEV_PRICE_PER_MTOK_USD).toFixed(4)),
      wallSeconds: Math.round((ranAt.getTime() - startedAt.getTime()) / 1000),
      reusedRows,
    },
    thresholds,
    questions: buildBaseQuestions(),
    rows: ordered,
    calibration,
  };

  const paths = io.writeOutputs(JSON.stringify(artifact, null, 2) + '\n', renderReport(artifact, previous));
  io.log(`judge:encounters: wrote ${paths.join(', ')}`);
  if (partial) io.log(`judge:encounters: PARTIAL — ${errored} of ${ordered.length} rows errored`);

  // A `--limit` run covers part of the corpus; publishing it would replace the full map
  // on `ops` and report every other finding as resolved. It stays local.
  if (args.publish && args.limit !== null) {
    io.log('judge:encounters: --limit run — written locally, not published to ops');
  } else if (args.publish && !io.publish(paths)) {
    io.log(`judge:encounters: publish failed — retry with: bash scripts/ops-publish.sh -m "content-judgments: encounter coverage" ${paths.join(' ')}`);
    return { exitCode: 1, artifact };
  }
  return { exitCode: partial ? 1 : 0, artifact };
}
