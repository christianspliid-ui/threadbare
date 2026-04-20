import inspirationContentJson from './inspiration-content.json';

export type InspirationSourceType = 'file' | 'url' | 'directory-entry';

export interface InspirationContent {
  body: string;
  contentHash: string;
  id: string;
  ingestedAt: string;
  sourcePath?: string;
  sourceType: InspirationSourceType;
  sourceUrl?: string;
  title: string;
}

export const INSPIRATION_CONTENT: InspirationContent[] = inspirationContentJson as InspirationContent[];

