/**
 * RecordViewer — displays Record<string, T> data as key-value pairs.
 *
 * Keys listed on the left, values expandable on the right.
 * Handles ~20% of CMS content.
 */

import { useState, useMemo } from 'react';

interface Props {
  data: Record<string, unknown>;
  searchQuery?: string;
  selectedKey: string | null;
  onSelectItem: (key: string | number) => void;
}

export function RecordViewer({ data, searchQuery, selectedKey, onSelectItem }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const keys = useMemo(() => {
    let ks = Object.keys(data);
    if (searchQuery && searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      ks = ks.filter(k => {
        if (k.toLowerCase().includes(q)) return true;
        const val = data[k];
        return JSON.stringify(val).toLowerCase().includes(q);
      });
    }
    return ks;
  }, [data, searchQuery]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {keys.map(key => {
        const value = data[key];
        const isExpanded = expandedKeys.has(key);
        const isSelected = key === selectedKey;
        const isSimple = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

        return (
          <div
            key={key}
            className="rounded transition-colors"
            style={{
              backgroundColor: isSelected ? 'rgba(212, 160, 64, 0.08)' : 'transparent',
            }}
          >
            <button
              onClick={() => {
                onSelectItem(key);
                if (!isSimple) toggleExpand(key);
              }}
              className="w-full flex items-start gap-3 px-3 py-1.5 text-left text-xs"
            >
              {!isSimple && (
                <span
                  className="flex-none mt-0.5"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)',
                    transition: 'transform 150ms',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                  }}
                >
                  &#9654;
                </span>
              )}
              <span
                className="flex-none font-mono"
                style={{ color: 'var(--accent-gold)', minWidth: '140px' }}
              >
                {key}
              </span>
              {isSimple ? (
                <span style={{ color: 'var(--text-secondary)' }}>{String(value)}</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  {Array.isArray(value)
                    ? `[${value.length} items]`
                    : `{${Object.keys(value as object).length} keys}`}
                </span>
              )}
            </button>

            {isExpanded && !isSimple && (
              <div
                className="ml-8 mr-3 mb-2 p-2 rounded text-xs overflow-x-auto"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <pre
                  className="whitespace-pre-wrap break-words"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      })}
      {keys.length === 0 && (
        <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          No matching keys
        </div>
      )}
    </div>
  );
}
