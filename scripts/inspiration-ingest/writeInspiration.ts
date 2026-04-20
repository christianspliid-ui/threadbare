import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { IngestionResult, InspirationContentRecord } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_INSPIRATION_DATA_PATH = path.resolve(
  __dirname,
  '../../src/data/inspiration-content.json',
);

interface WriteOptions {
  dataFilePath?: string;
}

async function readExistingRecords(dataFilePath: string): Promise<InspirationContentRecord[]> {
  try {
    const raw = await fs.readFile(dataFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Expected array in ${dataFilePath}`);
    }
    return parsed as InspirationContentRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function ensureParentDirectoryExists(filePath: string): Promise<void> {
  const parent = path.dirname(filePath);
  await fs.mkdir(parent, { recursive: true });
}

export async function writeInspirationRecords(
  incomingRecords: InspirationContentRecord[],
  options: WriteOptions = {},
): Promise<IngestionResult> {
  const dataFilePath = options.dataFilePath ?? DEFAULT_INSPIRATION_DATA_PATH;
  const existingRecords = await readExistingRecords(dataFilePath);
  const byHash = new Map(existingRecords.map((record) => [record.contentHash, record]));

  let created = 0;
  let updated = 0;

  for (const record of incomingRecords) {
    const prior = byHash.get(record.contentHash);
    if (prior) {
      byHash.set(record.contentHash, {
        ...prior,
        ingestedAt: record.ingestedAt,
        sourcePath: record.sourcePath ?? prior.sourcePath,
        sourceType: record.sourceType,
        sourceUrl: record.sourceUrl ?? prior.sourceUrl,
        title: record.title || prior.title,
      });
      updated += 1;
      continue;
    }

    byHash.set(record.contentHash, record);
    created += 1;
  }

  const records = [...byHash.values()].sort((a, b) => a.title.localeCompare(b.title));
  await ensureParentDirectoryExists(dataFilePath);
  await fs.writeFile(dataFilePath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  return {
    created,
    records,
    total: records.length,
    updated,
  };
}

