/**
 * TreeViewer — collapsible hierarchy for nested data.
 *
 * Primary use: SUBTYPE_SUBLOCATION_MAP (location subtypes → sublocation types).
 * Each top-level key is a collapsible node; children are its values.
 */

import { useState, useMemo } from 'react';

interface Props {
  data: Record<string, unknown[]>;
  searchQuery?: string;
  onSelectItem: (key: string | number) => void;
}

export function TreeViewer({ data, searchQuery, onSelectItem }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const keys = useMemo(() => {
    let ks = Object.keys(data);
    if (searchQuery && searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      ks = ks.filter(k => {
        if (k.toLowerCase().includes(q)) return true;
        const children = data[k];
        if (Array.isArray(children)) {
          return children.some(child => JSON.stringify(child).toLowerCase().includes(q));
        }
        return false;
      });
    }
    return ks;
  }, [data, searchQuery]);

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {keys.map(key => {
        const children = data[key];
        const isExpanded = expanded.has(key);
        const childCount = Array.isArray(children) ? children.length : 0;

        return (
          <div key={key}>
            {/* Parent node */}
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors"
              style={{ backgroundColor: isExpanded ? 'rgba(212, 160, 64, 0.05)' : 'transparent' }}
            >
              <span
                style={{
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  transition: 'transform 150ms',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                }}
              >
                &#9654;
              </span>
              <span className="font-mono" style={{ color: 'var(--accent-gold)' }}>
                {key}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                ({childCount} {childCount === 1 ? 'sublocation' : 'sublocations'})
              </span>
            </button>

            {/* Children */}
            {isExpanded && Array.isArray(children) && (
              <div className="ml-6 border-l border-dashed" style={{ borderColor: 'var(--border-subtle)' }}>
                {children.map((child, i) => {
                  const childObj = child as Record<string, unknown>;
                  const childName = childObj.name ?? childObj.id ?? `Item ${i}`;
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectItem(`${key}.${i}`)}
                      className="w-full flex items-start gap-2 px-3 py-1 text-xs text-left"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="flex-none mt-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-gold)', opacity: 0.4 }} />
                      <div>
                        <span className="font-medium">{String(childName)}</span>
                        {childObj.motivations && Array.isArray(childObj.motivations) && (
                          <div className="flex gap-1 mt-0.5">
                            {(childObj.motivations as Array<{ left: string; right: string; weight: number }>).map((m, mi) => (
                              <span
                                key={mi}
                                className="px-1 rounded text-xs"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}
                              >
                                {m.left}/{m.right} ({m.weight})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {keys.length === 0 && (
        <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          No matching items
        </div>
      )}
    </div>
  );
}
