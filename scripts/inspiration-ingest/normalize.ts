import * as path from 'node:path';

import { createContentHash } from './hash';
import type { InspirationContentRecord, RawInspirationSource } from './types';

const SOURCE_TITLE_FALLBACK = 'Untitled inspiration';

function firstMarkdownHeading(value: string): string | undefined {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  for (const line of lines) {
    const headingMatch = line.match(/^#\s+(.+?)\s*$/);
    if (headingMatch && headingMatch[1]) {
      return headingMatch[1].trim();
    }
  }
  return undefined;
}

function titleFromSource(source: RawInspirationSource): string {
  if (source.sourcePath) {
    const fileName = path.basename(source.sourcePath);
    return fileName.replace(path.extname(fileName), '');
  }

  if (source.sourceUrl) {
    try {
      const parsed = new URL(source.sourceUrl);
      const pathFragment = parsed.pathname.split('/').filter(Boolean).at(-1);
      return pathFragment || parsed.hostname;
    } catch {
      return source.sourceUrl;
    }
  }

  return SOURCE_TITLE_FALLBACK;
}

function normalizeBody(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildRecordId(contentHash: string): string {
  return `inspiration.${contentHash.slice(0, 12)}`;
}

export function normalizeInspirationSource(
  source: RawInspirationSource,
  ingestedAt: string,
): InspirationContentRecord {
  const body = normalizeBody(source.body);
  const title = firstMarkdownHeading(body) ?? source.suggestedTitle ?? titleFromSource(source);
  const contentHash = createContentHash(body);

  return {
    body,
    contentHash,
    id: buildRecordId(contentHash),
    ingestedAt,
    sourcePath: source.sourcePath,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    title,
  };
}

