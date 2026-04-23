import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runInspirationIngest } from '../inspiration-ingest/runIngest';

const TEMP_DIRS: string[] = [];

async function makeTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'threadbare-ingest-test-'));
  TEMP_DIRS.push(tempDir);
  return tempDir;
}

describe('inspiration ingest scaffold', () => {
  afterEach(async () => {
    await Promise.all(
      TEMP_DIRS.splice(0, TEMP_DIRS.length).map((dirPath) => fs.rm(dirPath, { force: true, recursive: true })),
    );
  });

  it('ingests file + re-ingests idempotently + ingests directory recursively', async () => {
    const tempDir = await makeTempDir();
    const dataFilePath = path.join(tempDir, 'inspiration-content.json');
    const singleFilePath = path.join(tempDir, 'single.md');
    const directoryRoot = path.join(tempDir, 'batch');
    const nestedDirectory = path.join(directoryRoot, 'nested');

    await fs.mkdir(nestedDirectory, { recursive: true });
    await fs.writeFile(
      singleFilePath,
      '# Forge Notes\n\nSteel cools slower in the valley forge.\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(directoryRoot, 'entry-a.md'),
      '# Dawn Ledger\n\nThe first bell rings before sunrise.\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(nestedDirectory, 'entry-b.md'),
      '# Gloam Sketch\n\nLantern oil burns blue in wet weather.\n',
      'utf8',
    );

    const firstRun = await runInspirationIngest(singleFilePath, {
      dataFilePath,
      nowIso: '2026-04-20T12:00:00.000Z',
    });
    expect(firstRun.created).toBe(1);
    expect(firstRun.total).toBe(1);

    const secondRun = await runInspirationIngest(singleFilePath, {
      dataFilePath,
      nowIso: '2026-04-20T13:00:00.000Z',
    });
    expect(secondRun.created).toBe(0);
    expect(secondRun.total).toBe(1);
    expect(secondRun.updated).toBe(1);

    const directoryRun = await runInspirationIngest(directoryRoot, {
      dataFilePath,
      nowIso: '2026-04-20T14:00:00.000Z',
    });
    expect(directoryRun.created).toBe(2);
    expect(directoryRun.total).toBe(3);

    const rawStore = await fs.readFile(dataFilePath, 'utf8');
    const parsedStore = JSON.parse(rawStore) as Array<{ sourceType: string; title: string }>;
    expect(parsedStore).toHaveLength(3);
    expect(parsedStore.map((entry) => entry.title).sort((a, b) => a.localeCompare(b))).toEqual([
      'Dawn Ledger',
      'Forge Notes',
      'Gloam Sketch',
    ]);
    expect(parsedStore.filter((entry) => entry.sourceType === 'directory-entry')).toHaveLength(2);
  });
});

