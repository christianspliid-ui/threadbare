/**
 * Typed loader for the build-generated UL dashboard JSON. Provides indexed
 * lookups (by term, by shard, by alias) so components don't recompute them.
 *
 * The JSON is committed at `src/data/ul-dashboard.generated.json`; the
 * generator script (`scripts/generate-ul-dashboard-data.ts`) refreshes it. If
 * the JSON is missing at build time, vite-build fails loud (the import
 * resolves at compile time). At runtime the dashboard renders an empty state.
 */

import dashboardData from '../../data/ul-dashboard.generated.json';
import driftStatusData from '../../data/drift-scan-status.json';

export type ULShardId =
  | 'cosmology'
  | 'agents'
  | 'encounters'
  | 'prose'
  | 'graph'
  | 'coordination'
  | 'process';

export type ULTermStatus = 'canonical' | 'proposed' | 'deprecated' | 'unknown';

export interface ULShard {
  id: ULShardId;
  filename: string;
  title: string;
  contentAdjacent: boolean;
  termCount: number;
  blurb: string;
}

export interface ULSeeAlsoLink {
  raw: string;
  termName: string;
  resolvedSlug: string | null;
}

export interface ULTerm {
  shardId: ULShardId;
  slug: string;
  name: string;
  aliases: string[];
  status: ULTermStatus;
  oneLiner: string;
  body: string;
  seeAlso: ULSeeAlsoLink[];
  sourcePath: string;
  contentAdjacent: boolean;
}

export interface ULGenerationWarning {
  kind: string;
  shardId: ULShardId;
  termSlug: string;
  detail: string;
}

export interface ULDashboardData {
  schemaVersion: number;
  generatedAt: string;
  shards: ULShard[];
  terms: ULTerm[];
  warnings: ULGenerationWarning[];
}

export interface DriftScanStatus {
  schemaVersion: number;
  generatedAt: string | null;
  staleCanonical: { shardId: string; termSlug: string; lastSeenAgo: number }[];
  usedUncanonical: {
    candidate: string;
    occurrences: number;
    suggestedShardId?: string;
  }[];
  openProposals: { termSlug: string; linearId: string; state: string }[];
}

export const ULData: ULDashboardData = dashboardData as ULDashboardData;
export const DriftStatus: DriftScanStatus = driftStatusData as DriftScanStatus;

/** Stable shard order, mirroring the README. */
export const SHARDS: readonly ULShard[] = ULData.shards;
export const TERMS: readonly ULTerm[] = ULData.terms;

const TERMS_BY_KEY = new Map<string, ULTerm>();
for (const term of TERMS) {
  TERMS_BY_KEY.set(`${term.shardId}#${term.slug}`, term);
}

export function getTerm(shardId: ULShardId, slug: string): ULTerm | null {
  return TERMS_BY_KEY.get(`${shardId}#${slug}`) ?? null;
}

export function getTermByCompositeKey(key: string): ULTerm | null {
  return TERMS_BY_KEY.get(key) ?? null;
}

export interface ULDriftSignals {
  isStale: boolean;
  staleAgeDays: number | null;
  uncanonicalForSlug: { candidate: string; occurrences: number }[];
  openProposals: { linearId: string; state: string }[];
}

const STALE_BY_SLUG = new Map<string, number>();
for (const entry of DriftStatus.staleCanonical) {
  STALE_BY_SLUG.set(`${entry.shardId}#${entry.termSlug}`, entry.lastSeenAgo);
}

const PROPOSALS_BY_SLUG = new Map<
  string,
  { linearId: string; state: string }[]
>();
for (const entry of DriftStatus.openProposals) {
  const list = PROPOSALS_BY_SLUG.get(entry.termSlug) ?? [];
  list.push({ linearId: entry.linearId, state: entry.state });
  PROPOSALS_BY_SLUG.set(entry.termSlug, list);
}

export function getDriftSignals(term: ULTerm): ULDriftSignals {
  const compositeKey = `${term.shardId}#${term.slug}`;
  const staleAgeDays = STALE_BY_SLUG.get(compositeKey) ?? null;
  return {
    isStale: staleAgeDays !== null,
    staleAgeDays,
    uncanonicalForSlug: [],
    openProposals: PROPOSALS_BY_SLUG.get(term.slug) ?? [],
  };
}

export function isDriftStatusFresh(
  warnDays: number,
  now: Date = new Date(),
): { fresh: boolean; ageDays: number | null } {
  if (!DriftStatus.generatedAt) return { fresh: false, ageDays: null };
  const generated = new Date(DriftStatus.generatedAt).getTime();
  if (Number.isNaN(generated)) return { fresh: false, ageDays: null };
  const ageDays = Math.floor((now.getTime() - generated) / (1000 * 60 * 60 * 24));
  return { fresh: ageDays <= warnDays, ageDays };
}
