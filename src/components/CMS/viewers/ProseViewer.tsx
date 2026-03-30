/**
 * ProseViewer — grouped display of prose template banks.
 *
 * Features:
 * - Groups by key
 * - Highlights {placeholder} variables in gold
 * - Searchable across all prose strings
 */

import { useMemo } from 'react';

interface Props {
  data: Record<string, string | string[]>;
  searchQuery?: string;
}

export function ProseViewer({ data, searchQuery }: Props) {
  const keys = useMemo(() => {
    let ks = Object.keys(data);
    if (searchQuery && searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      ks = ks.filter(k => {
        if (k.toLowerCase().includes(q)) return true;
        const val = data[k];
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(q));
        return false;
      });
    }
    return ks;
  }, [data, searchQuery]);

  return (
    <div className="space-y-4">
      {keys.map(key => {
        const value = data[key];
        const lines = Array.isArray(value) ? value : [value];

        return (
          <div key={key}>
            <h3
              className="text-xs font-semibold mb-1 px-1"
              style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}
            >
              {key}
              <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                ({lines.length})
              </span>
            </h3>
            <div
              className="rounded p-2 space-y-1"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)' }}
            >
              {lines.map((line, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <HighlightedProse text={String(line)} />
                </p>
              ))}
            </div>
          </div>
        );
      })}
      {keys.length === 0 && (
        <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          No matching prose
        </div>
      )}
    </div>
  );
}

/** Highlights {placeholder} tokens in gold */
function HighlightedProse({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]+\})/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('{') && part.endsWith('}') ? (
          <span
            key={i}
            className="font-mono px-0.5 rounded"
            style={{
              color: 'var(--accent-gold)',
              backgroundColor: 'rgba(212, 160, 64, 0.1)',
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
