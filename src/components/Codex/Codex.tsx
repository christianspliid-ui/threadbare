/**
 * Codex — browsable game content catalog.
 *
 * Route: ?view=codex
 * Player-facing encyclopedia showing divine actions, possessions, conditions,
 * agreements, and mortal actions with prose, glyphs, and tier colors.
 */

import { useState, useMemo, useCallback } from 'react';
import { getAllCodexEntries, getCodexCategories } from './codexRegistry';
import type { CodexEntry } from './codexRegistry';
import { CodexSidebar } from './CodexSidebar';
import { CodexCard } from './CodexCard';
import { CodexDetailPanel } from './CodexDetailPanel';
import {
  codexEntryRunState,
  CODEX_RUN_STATE_FILTERS,
  type CodexRunContext,
  type CodexRunState,
  type CodexRunStateFilter,
} from './codexRunState';

interface CodexProps {
  /**
   * Live incarnation context (THR-613 Slice 3b-tail). When present, every ascendant card
   * carries a Held / Within-reach / Another-life badge and a state filter appears. Absent
   * for the standalone `?view=codex` route → the plain catalog, unchanged.
   */
  runContext?: CodexRunContext | null;
  /** Pre-select a state filter when opening (the character-sheet deep-link passes `acquirable`). */
  initialStateFilter?: CodexRunStateFilter;
  /** Rendered inside the game as an overlay: swaps "Back to Game" for a Close button. */
  embedded?: boolean;
  onClose?: () => void;
}

export default function Codex({
  runContext = null,
  initialStateFilter = 'all',
  embedded = false,
  onClose,
}: CodexProps = {}) {
  const categories = useMemo(() => getCodexCategories(), []);
  const allEntries = useMemo(() => getAllCodexEntries(), []);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? 'divine');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [starterOnly, setStarterOnly] = useState(false);
  const [stateFilter, setStateFilter] = useState<CodexRunStateFilter>(initialStateFilter);

  // Per-entry incarnation state, keyed by id. Empty when there is no live ascendant.
  const runStateById = useMemo(() => {
    const map = new Map<string, CodexRunState | null>();
    if (!runContext) return map;
    for (const entry of allEntries) map.set(entry.id, codexEntryRunState(entry, runContext));
    return map;
  }, [allEntries, runContext]);

  const starterCount = useMemo(
    () => allEntries.filter((entry) => entry.isStarter === true).length,
    [allEntries],
  );

  const filteredEntries = useMemo(() => {
    let entries = allEntries.filter(e => e.category === selectedCategory);
    if (starterOnly) {
      entries = entries.filter(e => e.isStarter === true);
    }
    // Incarnation state filter — only meaningful with a live ascendant. `all` is a no-op.
    if (runContext && stateFilter !== 'all') {
      entries = entries.filter(e => runStateById.get(e.id) === stateFilter);
    }
    if (selectedSubcategory) {
      entries = entries.filter(e => e.subcategory === selectedSubcategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return entries;
  }, [allEntries, selectedCategory, selectedSubcategory, searchQuery, starterOnly, runContext, stateFilter, runStateById]);

  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return allEntries.find(e => e.id === selectedEntryId) ?? null;
  }, [allEntries, selectedEntryId]);

  const handleSelectCategory = useCallback((catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory(null);
    setSelectedEntryId(null);
  }, []);

  const handleSelectSubcategory = useCallback((catId: string, subId: string | null) => {
    setSelectedCategory(catId);
    setSelectedSubcategory(subId);
    setSelectedEntryId(null);
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-primary)' }}
    >
      {/* Top bar */}
      <header
        className="flex items-center gap-4 px-4 flex-shrink-0"
        style={{
          height: '48px',
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
          Codex
        </h1>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md"
            style={{
              fontSize: 'var(--text-sm)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        {/* Stats */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filteredEntries.length} of {allEntries.length} entries
        </div>
        <button
          type="button"
          onClick={() => setStarterOnly(prev => !prev)}
          style={{
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)',
            padding: '3px 10px',
            fontSize: 'var(--text-xs)',
            color: starterOnly ? 'var(--accent-gold)' : 'var(--text-muted)',
            backgroundColor: starterOnly ? 'var(--accent-gold-glow)' : 'var(--bg-surface)',
          }}
        >
          Starter ({starterCount})
        </button>

        {/* Close (embedded overlay) or back-to-game link (standalone route) */}
        {embedded ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close codex"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-gold-dim)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close ✕
          </button>
        ) : (
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
        )}
      </header>

      {/* Incarnation state filter (THR-613 Slice 3b-tail) — only with a live ascendant. */}
      {runContext && (
        <div
          className="flex items-center gap-2 px-4 flex-shrink-0"
          style={{
            height: '38px',
            backgroundColor: 'var(--bg-deep)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: 4 }}>
            This incarnation
          </span>
          {CODEX_RUN_STATE_FILTERS.map((f) => {
            const active = stateFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStateFilter(f.id)}
                data-state-filter={f.id}
                aria-pressed={active}
                style={{
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  padding: '3px 10px',
                  fontSize: 'var(--text-xs)',
                  color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
                  backgroundColor: active ? 'var(--accent-gold-glow)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <CodexSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
        />

        {/* Card grid */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Category title */}
          <div className="mb-4">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
              }}
            >
              {categories.find(c => c.id === selectedCategory)?.label ?? selectedCategory}
              {selectedSubcategory && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  {' \u203A '}{filteredEntries[0]?.subtitle?.split('\u00B7')[0]?.trim() ?? selectedSubcategory}
                </span>
              )}
            </h2>
          </div>

          {/* Grid */}
          {filteredEntries.length === 0 ? (
            <div
              className="flex items-center justify-center"
              style={{ minHeight: '200px', color: 'var(--text-muted)' }}
            >
              <p style={{ fontSize: 'var(--text-sm)' }}>
                {searchQuery
                  ? 'No entries match your search.'
                  : runContext && stateFilter !== 'all'
                    ? 'No paths here in this state.'
                    : 'No entries in this category.'}
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {filteredEntries.map(entry => (
                <CodexCard
                  key={entry.id}
                  entry={entry}
                  isSelected={entry.id === selectedEntryId}
                  runState={runContext ? runStateById.get(entry.id) : undefined}
                  onClick={() => setSelectedEntryId(
                    entry.id === selectedEntryId ? null : entry.id
                  )}
                />
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        <CodexDetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntryId(null)}
        />
      </div>
    </div>
  );
}
