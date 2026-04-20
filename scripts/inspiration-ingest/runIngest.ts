import { normalizeInspirationSource } from './normalize';
import { loadRawInspirationSources } from './sources';
import type { IngestionResult, InspirationContentRecord } from './types';
import { writeInspirationRecords } from './writeInspiration';

interface RunOptions {
  dataFilePath?: string;
  nowIso?: string;
}

function applyTaggingHookStub(record: InspirationContentRecord): InspirationContentRecord {
  // TODO(THR-221-tagging): apply ontology tags once THR-220 is live.
  // Expected signature: applyOntologyTags(record) -> { archetypes, reaches, spheres }
  return record;
}

export async function runInspirationIngest(
  source: string,
  options: RunOptions = {},
): Promise<IngestionResult> {
  const ingestedAt = options.nowIso ?? new Date().toISOString();
  const rawSources = await loadRawInspirationSources(source);
  const normalizedRecords = rawSources
    .map((rawSource) => normalizeInspirationSource(rawSource, ingestedAt))
    .map((record) => applyTaggingHookStub(record));

  return writeInspirationRecords(normalizedRecords, { dataFilePath: options.dataFilePath });
}

