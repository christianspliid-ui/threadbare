/**
 * CMS Header — title, global search, and stats.
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { CONTENT_REGISTRY, getCategories, getTotalItemCount } from './registry';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectEntry: (id: string) => void;
}

export function CMSHeader({ searchQuery, onSearchChange, onSelectEntry }: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => getCategories(), []);

  // Global search results
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return CONTENT_REGISTRY.filter(entry => {
      if (entry.label.toLowerCase().includes(q)) return true;
      if (entry.description.toLowerCase().includes(q)) return true;
      if (entry.id.toLowerCase().includes(q)) return true;
      // Search within data items
      if (entry.searchFields && Array.isArray(entry.data)) {
        return (entry.data as Record<string, unknown>[]).some(item =>
          entry.searchFields!.some(field => {
            const val = getNestedValue(item, field);
            return typeof val === 'string' && val.toLowerCase().includes(q);
          })
        );
      }
      return false;
    });
  }, [searchQuery]);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const totalItems = useMemo(() => getTotalItemCount(), []);

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 flex-none"
      style={{
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Title */}
      <h1
        className="text-lg tracking-wide whitespace-nowrap"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}
      >
        Content Browser
      </h1>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search content... (Ctrl+K)"
          className="w-full px-3 py-1.5 rounded text-sm"
          style={{
            backgroundColor: 'var(--bg-surface, #1a1a2e)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        {focused && searchResults.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded shadow-lg z-50 max-h-64 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-deep)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {searchResults.map(entry => (
              <button
                key={entry.id}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onMouseDown={() => {
                  onSelectEntry(entry.id);
                  onSearchChange('');
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {entry.category}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{entry.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{categories.length} categories</span>
        <span>{CONTENT_REGISTRY.length} datasets</span>
        <span>~{totalItems} items</span>
      </div>
    </div>
  );
}

/** Resolve nested property path like 'value.name' */
function getNestedValue(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
