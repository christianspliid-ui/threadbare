/**
 * Ubiquitous Language Dashboard.
 *
 * Route: ?view=ul
 * Reads `src/data/ul-dashboard.generated.json` (committed; refreshed by
 * `npm run generate-ul-dashboard`). Pattern follows `Codex.tsx` —
 * three-zone shell with sidebar, central table, and detail pane.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  SHARDS,
  TERMS,
  ULData,
  DriftStatus,
  getDriftSignals,
  isDriftStatusFresh,
} from './ulDashboardData';
import type { ULShardId, ULTerm } from './ulDashboardData';
import {
  DRIFT_STATUS_FRESHNESS_WARN_DAYS,
  DRIFT_UNAVAILABLE_HINT,
  TOPBAR_HEIGHT_PX,
} from '../../data/ul-dashboard-constants';
import { ULSidebar, type ShardFilter } from './ULSidebar';
import type { SidebarFilterState } from './ULSidebar';
import { ULSearchBox } from './ULSearchBox';
import { ULTermTable } from './ULTermTable';
import { ULDetailPane } from './ULDetailPane';
import { searchTerms } from './ulSearch';

const INITIAL_FILTERS: SidebarFilterState = {
  contentAdjacentOnly: false,
  hasDriftOnly: false,
};

export default function UbiquitousLanguageDashboard() {
  const [activeShard, setActiveShard] = useState<ShardFilter>('all');
  const [filters, setFilters] = useState<SidebarFilterState>(INITIAL_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const shardTermCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const shard of SHARDS) counts[shard.id] = 0;
    for (const term of TERMS) counts[term.shardId] = (counts[term.shardId] ?? 0) + 1;
    return counts as Record<ULShardId, number>;
  }, []);

  const filteredTerms = useMemo(() => {
    let pool: ULTerm[] = [...TERMS];
    if (activeShard !== 'all') {
      pool = pool.filter((t) => t.shardId === activeShard);
    }
    if (filters.contentAdjacentOnly) {
      pool = pool.filter((t) => t.contentAdjacent);
    }
    if (filters.hasDriftOnly) {
      pool = pool.filter((t) => {
        const signals = getDriftSignals(t);
        return signals.isStale || signals.openProposals.length > 0;
      });
    }
    return searchTerms(pool, searchQuery);
  }, [activeShard, filters, searchQuery]);

  const selectedTerm = useMemo<ULTerm | null>(() => {
    if (!selectedKey) return null;
    return (
      TERMS.find((t) => `${t.shardId}#${t.slug}` === selectedKey) ?? null
    );
  }, [selectedKey]);

  const handleSelectTerm = useCallback((term: ULTerm) => {
    setSelectedKey(`${term.shardId}#${term.slug}`);
  }, []);

  const handleWikilinkClick = useCallback((termName: string) => {
    const lower = termName.toLowerCase();
    const target =
      TERMS.find((t) => t.name.toLowerCase() === lower) ??
      TERMS.find((t) =>
        t.name.toLowerCase().replace(/\s*\([^)]*\)\s*$/, '') === lower,
      ) ??
      TERMS.find((t) =>
        t.aliases.some((a) => a.toLowerCase() === lower),
      ) ??
      null;
    if (!target) return;
    setActiveShard(target.shardId);
    setSelectedKey(`${target.shardId}#${target.slug}`);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
    setActiveShard('all');
  }, []);

  const driftFreshness = useMemo(
    () => isDriftStatusFresh(DRIFT_STATUS_FRESHNESS_WARN_DAYS),
    [],
  );
  const driftStatusLabel = !DriftStatus.generatedAt
    ? 'unavailable'
    : driftFreshness.fresh
      ? 'fresh'
      : 'stale';

  const generatedAtLabel = useMemo(() => {
    const ts = ULData.generatedAt;
    if (!ts) return 'unknown';
    return new Date(ts).toISOString().slice(0, 16).replace('T', ' ');
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-abyss)',
        color: 'var(--text-primary)',
      }}
    >
      <header
        className="flex items-center gap-4 px-4 flex-shrink-0"
        style={{
          height: `${TOPBAR_HEIGHT_PX}px`,
          backgroundColor: 'var(--bg-deep)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-base)',
            color: 'var(--accent-gold)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Ubiquitous Language
        </h1>
        <ULSearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredTerms.length}
          totalCount={TERMS.length}
        />
        <a
          href="?view=game"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-gold-dim)',
            textDecoration: 'none',
          }}
        >
          Back to Game
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ULSidebar
          shards={SHARDS}
          activeShard={activeShard}
          onSelectShard={setActiveShard}
          filters={filters}
          onChangeFilters={setFilters}
          totalTermCount={TERMS.length}
          shardTermCounts={shardTermCounts}
        />
        <ULTermTable
          terms={filteredTerms}
          selectedKey={selectedKey}
          onSelect={handleSelectTerm}
          onClearFilters={handleClearFilters}
        />
        <ULDetailPane
          term={selectedTerm}
          onWikilinkClick={handleWikilinkClick}
        />
      </div>

      <footer
        className="flex-shrink-0 flex items-center gap-4 px-4 py-2"
        style={{
          backgroundColor: 'var(--bg-deep)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        <span>Generated {generatedAtLabel}</span>
        <span>•</span>
        <details style={{ display: 'inline' }}>
          <summary style={{ cursor: 'pointer' }}>
            ({ULData.warnings.length}) build warnings
          </summary>
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              padding: 'var(--space-2)',
              marginTop: 'var(--space-2)',
              backgroundColor: 'var(--bg-abyss)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {ULData.warnings.length === 0 ? (
              <em>No warnings.</em>
            ) : (
              ULData.warnings.map((w, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <code style={{ color: 'var(--accent-gold-dim)' }}>{w.kind}</code>{' '}
                  <code>
                    {w.shardId}#{w.termSlug}
                  </code>
                  : {w.detail}
                </div>
              ))
            )}
          </div>
        </details>
        <span>•</span>
        <span title={driftStatusLabel === 'unavailable' ? DRIFT_UNAVAILABLE_HINT : undefined}>
          Drift status: {driftStatusLabel}
        </span>
      </footer>
    </div>
  );
}
