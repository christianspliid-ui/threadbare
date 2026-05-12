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

export default function Codex() {
  const categories = useMemo(() => getCodexCategories(), []);
  const allEntries = useMemo(() => getAllCodexEntries(), []);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id ?? 'divine');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [starterOnly, setStarterOnly] = useState(false);

  const starterCount = useMemo(
    () => allEntries.filter((entry) => entry.isStarter === true).length,
    [allEntries],
  );

  const filteredEntries = useMemo(() => {
    let entries = allEntries.filter(e => e.category === selectedCategory);
    if (starterOnly) {
      entries = entries.filter(e => e.isStarter === true);
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
  }, [allEntries, selectedCategory, selectedSubcategory, searchQuery, starterOnly]);

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

        {/* Back to game link */}
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
                {searchQuery ? 'No entries match your search.' : 'No entries in this category.'}
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
