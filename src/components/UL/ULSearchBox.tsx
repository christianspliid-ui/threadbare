import { useEffect, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from '../../data/ul-dashboard-constants';

interface ULSearchBoxProps {
  value: string;
  onChange: (next: string) => void;
  resultCount: number;
  totalCount: number;
}

/**
 * Debounced search input. Echoes the keystrokes to local state immediately
 * for input feel, then propagates to the parent on `SEARCH_DEBOUNCE_MS`.
 */
export function ULSearchBox({
  value,
  onChange,
  resultCount,
  totalCount,
}: ULSearchBoxProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const handle = window.setTimeout(() => onChange(draft), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draft, value, onChange]);

  return (
    <div className="flex items-center gap-3 flex-1">
      <input
        type="text"
        placeholder="Search across all shards..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 max-w-md px-3 py-1.5 rounded-md"
        style={{
          fontSize: 'var(--text-sm)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        data-testid="ul-search-input"
      />
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        {resultCount} of {totalCount} terms
      </span>
    </div>
  );
}
