/**
 * Encounter coverage run — judge every Encounter-kind entry with Jev (THR-1723).
 *
 * Offline authoring tooling. Never imported by `src/`, never bundled into the app.
 *
 * Usage:
 *   npm run judge:encounters -- --dry-run --limit 1   # one blind state + its questions, no network
 *   npm run judge:encounters                          # full run (needs TYPESAFE_API_KEY), publishes to ops
 *   npm run judge:encounters -- --no-publish          # write Docs/ops/content-judgments/ only
 *   npm run judge:encounters -- --force               # run past the input-token ceiling
 *   npm run judge:encounters -- --calibration <labels.json>   # set thresholds from reader labels
 *
 * Plan: Docs/plans/2026-10-14-thr-1723-encounter-coverage-map.md
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { entriesOfKind } from '../src/data/contentCatalogs';
import { collectAuthoredProse } from '../src/engine/content-eval/collectAuthoredProse';
import type { UnifiedActionTemplate } from '../src/types/unifiedAction';
import { buildEncounterState } from './content-judgments/encounterState';
import { parseRunnerArgs, runEncounterCoverage } from './content-judgments/runner';
import type { EncounterCoverageArtifact } from './content-judgments/coverageRollup';
import {
  COVERAGE_ARTIFACT_FILE,
  COVERAGE_OUTPUT_DIR,
  COVERAGE_REPORT_FILE,
  GIT_SHOW_MAX_BUFFER_BYTES,
} from './content-judgments/constants';

function git(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: GIT_SHOW_MAX_BUFFER_BYTES,
  }).trim();
}

function buildStates() {
  const collected = new Map<string, Record<string, string>>();
  for (const e of collectAuthoredProse()) {
    if (e.contentType === 'encounter' && !collected.has(e.entryId)) collected.set(e.entryId, e.fields);
  }
  return entriesOfKind('encounter_template').map(entry =>
    buildEncounterState(entry as unknown as UnifiedActionTemplate, collected.get(entry.id)));
}

async function main(): Promise<void> {
  const args = parseRunnerArgs(process.argv.slice(2));
  const artifactPath = `${COVERAGE_OUTPUT_DIR}/${COVERAGE_ARTIFACT_FILE}`;
  const reportPath = `${COVERAGE_OUTPUT_DIR}/${COVERAGE_REPORT_FILE}`;

  const result = await runEncounterCoverage(buildStates(), args, {
    env: process.env,
    log: line => console.log(line),
    now: () => new Date(),
    sourceCommit: () => { try { return git(['rev-parse', 'HEAD']); } catch { return 'unknown'; } },
    readPrevious: () => {
      try {
        git(['fetch', 'origin', 'ops', '--quiet']);
      } catch {
        // offline: fall through to whatever origin/ops already holds
      }
      try {
        return JSON.parse(git(['show', `origin/ops:${artifactPath}`])) as EncounterCoverageArtifact;
      } catch {
        return null;
      }
    },
    readCalibrationLabels: p => JSON.parse(fs.readFileSync(p, 'utf8')) as unknown,
    writeOutputs: (json, md) => {
      fs.mkdirSync(COVERAGE_OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(path.join(COVERAGE_OUTPUT_DIR, COVERAGE_ARTIFACT_FILE), json);
      fs.writeFileSync(path.join(COVERAGE_OUTPUT_DIR, COVERAGE_REPORT_FILE), md);
      return [artifactPath, reportPath];
    },
    publish: paths => {
      try {
        execFileSync('bash', ['scripts/ops-publish.sh', '-m', 'content-judgments: encounter coverage run', ...paths], { stdio: 'inherit' });
        return true;
      } catch {
        return false;
      }
    },
  });
  process.exitCode = result.exitCode;
}

main().catch(err => {
  // Never echo the environment; the message is built without the key (jevClient redacts).
  console.error(`judge:encounters: failed — ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
