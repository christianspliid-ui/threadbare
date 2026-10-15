/**
 * THR-1723 — the runner end to end with a fake `fetch`. No test makes a network call.
 * The key never appears in any log line, error or written output.
 */
import { describe, expect, it, vi } from 'vitest';
import type { UnifiedActionTemplate } from '../../src/types/unifiedAction';
import { buildEncounterState } from '../content-judgments/encounterState';
import { parseRunnerArgs, runEncounterCoverage, type RunnerIO } from '../content-judgments/runner';
import { judge, JevAuthError, readApiKey } from '../content-judgments/jevClient';
import { PLACEHOLDER_THRESHOLDS, type EncounterCoverageArtifact } from '../content-judgments/coverageRollup';

const FAKE_KEY = 'tsk-FIXTURE-KEY-must-never-print-4242';

const template = (id: string, prose: string) => ({
  id, name: `Title ${id}`, description: prose, reach: 'iron', steps: [],
}) as unknown as UnifiedActionTemplate;

const states = [
  buildEncounterState(template('enc.b', 'A duel at dawn over a stolen horse.'), undefined),
  buildEncounterState(template('enc.a', 'A bridge to be mended before the floods.'), undefined),
];

function okResponse(): Response {
  const c = (pick: string) => ({ type: 'choice', choice: pick, probabilities: { [pick]: 0.9, none: 0.1 }, confidence: 0.9 });
  return new Response(JSON.stringify({
    model: 'jev-1.13.0',
    answers: { reach: c('iron'), reach_rev: c('iron'), activity: c('duel'), activity_rev: c('duel'), walk_of_life: c('combat') },
    usage: { input_tokens: 1000, output_tokens: 0 },
  }), { status: 200 });
}

function harness(overrides: Partial<RunnerIO> = {}) {
  const logs: string[] = [];
  const written: string[] = [];
  const io: RunnerIO = {
    env: { TYPESAFE_API_KEY: FAKE_KEY },
    log: line => logs.push(line),
    fetchImpl: vi.fn(async () => okResponse()) as unknown as typeof fetch,
    sleep: async () => {},
    now: () => new Date('2026-10-15T00:00:00.000Z'),
    sourceCommit: () => 'deadbeef',
    readPrevious: () => null,
    readCalibrationLabels: () => [],
    writeOutputs: (json, md) => { written.push(json, md); return ['a.json', 'a.md']; },
    publish: () => true,
    ...overrides,
  };
  return { io, logs, written };
}

const args = (argv: string[] = []) => parseRunnerArgs(argv);

describe('judge:encounters runner (THR-1723)', () => {
  it('parses its flags', () => {
    expect(args(['--dry-run', '--limit', '3', '--force', '--no-publish'])).toEqual({
      dryRun: true, limit: 3, force: true, publish: false, calibrationPath: null,
    });
  });

  it('--dry-run --limit 1 prints one blind state and the question set, with no network call', async () => {
    const { io, logs, written } = harness();
    const res = await runEncounterCoverage(states, args(['--dry-run', '--limit', '1']), io);
    expect(res.exitCode).toBe(0);
    expect(io.fetchImpl).not.toHaveBeenCalled();
    expect(written).toHaveLength(0);
    const out = logs.join('\n');
    expect(out).toContain('1 entry planned, no network call');
    expect(out).toContain('Title enc.a'); // id-sorted: enc.a first
    expect(out).not.toContain('"enc.a"');
    expect(out).toContain('"reach_rev"');
  });

  it('skips cleanly when the key is unset: exit 0, nothing written, no request', async () => {
    const { io, logs, written } = harness({ env: {} });
    const res = await runEncounterCoverage(states, args(), io);
    expect(res.exitCode).toBe(0);
    expect(logs).toEqual(['judge:encounters: skipped — TYPESAFE_API_KEY is not set']);
    expect(written).toHaveLength(0);
    expect(io.fetchImpl).not.toHaveBeenCalled();
    expect(readApiKey({ TYPESAFE_API_KEY: '   ' })).toBeUndefined();
  });

  it('runs, persists rows id-ascending with usage, and never prints the key', async () => {
    const { io, logs, written } = harness();
    const res = await runEncounterCoverage(states, args(), io);
    expect(res.exitCode).toBe(0);
    const artifact = JSON.parse(written[0]) as EncounterCoverageArtifact;
    expect(artifact.rows.map(r => r.id)).toEqual(['enc.a', 'enc.b']);
    expect(artifact.usage).toMatchObject({ requests: 2, inputTokens: 2000, reusedRows: 0 });
    expect(artifact.model).toBe('jev-1.13.0');
    expect(artifact.coldStart).toBe(true);
    expect([...logs, ...written].join('\n')).not.toContain(FAKE_KEY);
    const call = (io.fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect((call[1].headers as Record<string, string>).Authorization).toBe(`Bearer ${FAKE_KEY}`);
  });

  it('reuses cached rows and only asks for the changed entry', async () => {
    const first = harness();
    await runEncounterCoverage(states, args(), first.io);
    const previous = JSON.parse(first.written[0]) as EncounterCoverageArtifact;
    const edited = [states[1], buildEncounterState(template('enc.b', 'An edited duel.'), undefined)];
    const second = harness({ readPrevious: () => previous });
    await runEncounterCoverage(edited, args(), second.io);
    expect(second.io.fetchImpl).toHaveBeenCalledTimes(1);
    const artifact = JSON.parse(second.written[0]) as EncounterCoverageArtifact;
    expect(artifact.usage.reusedRows).toBe(1);
  });

  it('keeps a failed row with a redacted error, and marks the run partial above the error share', async () => {
    const fetchImpl = vi.fn(async () => new Response(`bad request for ${FAKE_KEY}`, { status: 422 }));
    const publish = vi.fn(() => true);
    const { io, logs, written } = harness({ fetchImpl: fetchImpl as unknown as typeof fetch, publish });
    const res = await runEncounterCoverage(states, args(), io);
    expect(res.exitCode).toBe(1);
    expect(publish).not.toHaveBeenCalled();
    expect(logs.join('\n')).toContain('partial run — written locally, not published');
    const artifact = JSON.parse(written[0]) as EncounterCoverageArtifact;
    expect(artifact.partial).toBe(true);
    expect(artifact.rows[0].error).toContain('HTTP 422');
    expect([...logs, ...written].join('\n')).not.toContain(FAKE_KEY);
  });

  it('stops on 401 and writes nothing', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 401 }));
    const { io, logs, written } = harness({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await runEncounterCoverage(states, args(), io);
    expect(res.exitCode).toBe(1);
    expect(written).toHaveLength(0);
    expect(logs.join('\n')).toContain('key rejected');
  });

  it('refuses above the token ceiling unless --force', async () => {
    const big = Array.from({ length: 3 }, (_, i) =>
      buildEncounterState(template(`enc.${i}`, 'x '.repeat(12_000)), undefined, 24_000));
    const huge = Array.from({ length: 900 }, (_, i) => ({ ...big[i % 3], id: `enc.${i}` }));
    const refused = harness();
    expect((await runEncounterCoverage(huge, args(), refused.io)).exitCode).toBe(1);
    expect(refused.io.fetchImpl).not.toHaveBeenCalled();
    expect(refused.logs.join('\n')).toContain('pass --force');
  });

  it('never publishes a --limit run', async () => {
    const publish = vi.fn(() => true);
    const { io, logs, written } = harness({ publish });
    const res = await runEncounterCoverage(states, args(['--limit', '1']), io);
    expect(res.exitCode).toBe(0);
    expect(written).toHaveLength(2);
    expect(publish).not.toHaveBeenCalled();
    expect(logs.join('\n')).toContain('not published to ops');
  });

  it('reads calibration labels before any paid call, and stops on a bad path', async () => {
    const { io, logs, written } = harness({
      readCalibrationLabels: () => { throw new Error('ENOENT labels.jsn'); },
    });
    const res = await runEncounterCoverage(states, args(['--calibration', 'labels.jsn']), io);
    expect(res.exitCode).toBe(1);
    expect(io.fetchImpl).not.toHaveBeenCalled();
    expect(written).toHaveLength(0);
    expect(logs.join('\n')).toContain('cannot use calibration labels');
  });

  it('rejects a malformed labels file before any paid call', async () => {
    const { io, logs, written } = harness({ readCalibrationLabels: () => ({ labels: [] }) });
    const res = await runEncounterCoverage(states, args(['--calibration', 'labels.json']), io);
    expect(res.exitCode).toBe(1);
    expect(io.fetchImpl).not.toHaveBeenCalled();
    expect(written).toHaveLength(0);
    expect(logs.join('\n')).toContain('expected a JSON array of labels');
  });

  it('records the reader prompt from a { readerPrompt, labels } file in the calibration block (THR-1850)', async () => {
    const label = (id: string) => ({ id, reach: 'iron', activity: 'duel', walk_of_life: 'combat', spheres: {} });
    const { io } = harness({
      readCalibrationLabels: () => ({ readerPrompt: 'You are a blind reader.', labels: [label('enc.a'), label('enc.b')] }),
    });
    const res = await runEncounterCoverage(states, args(['--calibration', 'labels.json']), io);
    expect(res.exitCode).toBe(0);
    expect(res.artifact?.calibration?.readerPrompt).toBe('You are a blind reader.');
    expect(res.artifact?.calibration?.labels).toHaveLength(2);
    expect(res.artifact?.thresholds.calibratedAt).toBe('2026-10-15T00:00:00.000Z');
  });

  it('drops carried thresholds when the model or question version changed', async () => {
    const calibrated = { ...PLACEHOLDER_THRESHOLDS, reach: 0.42, calibratedAt: '2026-10-01T00:00:00.000Z' };
    const base = { questionsVersion: 1, model: 'jev-1.13.0', rows: [], thresholds: calibrated, calibration: null };
    const same = harness({ readPrevious: () => base as unknown as EncounterCoverageArtifact });
    expect((await runEncounterCoverage(states, args(), same.io)).artifact?.thresholds.reach).toBe(0.42);
    const moved = harness({ readPrevious: () => ({ ...base, model: 'jev-1.12.0' }) as unknown as EncounterCoverageArtifact });
    const res = await runEncounterCoverage(states, args(), moved.io);
    expect(res.artifact?.thresholds).toEqual(PLACEHOLDER_THRESHOLDS);
  });

  it('reports a failed publish with the retry command and exits 1', async () => {
    const { io, logs } = harness({ publish: () => false });
    const res = await runEncounterCoverage(states, args(), io);
    expect(res.exitCode).toBe(1);
    expect(logs.join('\n')).toContain('bash scripts/ops-publish.sh');
  });
});

describe('jevClient (THR-1723)', () => {
  it('backs off on 429 and 529, then succeeds', async () => {
    const sleeps: number[] = [];
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 529 }))
      .mockResolvedValueOnce(okResponse());
    const res = await judge({
      apiKey: FAKE_KEY, model: 'jev-1.13.0', state: {}, questions: {},
      fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async ms => { sleeps.push(ms); }, backoffBaseMs: 10,
    });
    expect(res.model).toBe('jev-1.13.0');
    expect(sleeps).toEqual([10, 20]);
  });

  it('gives up after the retry budget with a key-free message', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error(`socket closed ${FAKE_KEY}`); });
    const err = await judge({
      apiKey: FAKE_KEY, model: 'm', state: {}, questions: {},
      fetchImpl: fetchImpl as unknown as typeof fetch, sleep: async () => {}, maxRetries: 2,
    }).catch(e => e as Error);
    expect(err.message).toContain('after 3 attempts');
    expect(err.message).not.toContain(FAKE_KEY);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('throws JevAuthError on 401', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 401 }));
    await expect(judge({
      apiKey: FAKE_KEY, model: 'm', state: {}, questions: {}, fetchImpl: fetchImpl as unknown as typeof fetch,
    })).rejects.toBeInstanceOf(JevAuthError);
  });
});
