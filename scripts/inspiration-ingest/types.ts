export type InspirationSourceType = 'file' | 'url' | 'directory-entry';

export interface RawInspirationSource {
  body: string;
  sourcePath?: string;
  sourceType: InspirationSourceType;
  sourceUrl?: string;
  suggestedTitle?: string;
}

export interface InspirationContentRecord {
  body: string;
  contentHash: string;
  id: string;
  ingestedAt: string;
  sourcePath?: string;
  sourceType: InspirationSourceType;
  sourceUrl?: string;
  title: string;
}

export interface IngestionResult {
  created: number;
  records: InspirationContentRecord[];
  total: number;
  updated: number;
}

