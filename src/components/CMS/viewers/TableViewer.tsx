/**
 * TableViewer — sortable, filterable table for arrays of typed objects.
 *
 * Handles ~60% of CMS content. Supports:
 * - Column sorting (click header)
 * - Row filtering via search query
 * - Click-to-select rows for detail panel
 * - Badge/tag/boolean/number cell renderers
 * - Nested property paths (e.g. 'value.name', 'steps.length')
 */

import { useState, useMemo } from 'react';
import type { ColumnDef } from '../types';

interface Props {
  data: unknown[];
  columns: ColumnDef[];
  searchQuery?: string;
  searchFields?: string[];
  selectedKey: string | number | null;
  onSelectItem: (key: string | number) => void;
}

export function TableViewer({ data, columns, searchQuery, searchFields, selectedKey, onSelectItem }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filter
  const filtered = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return data;
    const q = searchQuery.toLowerCase();
    const fields = searchFields ?? columns.map(c => c.key);
    return data.filter(item =>
      fields.some(field => {
        const val = getNestedValue(item, field);
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(q));
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, searchFields, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getNestedValue(a, sortKey);
      const bv = getNestedValue(b, sortKey);
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  if (columns.length === 0) {
    return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
  }

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr>
          {columns.map(col => (
            <th
              key={col.key}
              onClick={() => col.sortable !== false && handleSort(col.key)}
              className="text-left px-2 py-1.5 font-semibold cursor-pointer select-none"
              style={{
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-subtle)',
                width: col.width,
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--bg-abyss)',
                zIndex: 1,
              }}
            >
              {col.label}
              {sortKey === col.key && (
                <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((item, idx) => {
          const isSelected = selectedKey === idx;
          return (
            <tr
              key={idx}
              onClick={() => onSelectItem(idx)}
              className="cursor-pointer transition-colors"
              style={{
                backgroundColor: isSelected ? 'rgba(212, 160, 64, 0.08)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              {columns.map(col => (
                <td key={col.key} className="px-2 py-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <CellValue value={getNestedValue(item, col.key)} render={col.render} badgeColors={col.badgeColors} />
                </td>
              ))}
            </tr>
          );
        })}
        {sorted.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="px-2 py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              No matching items
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ── Cell Renderer ─────────────────────────────────────────────

function CellValue({ value, render, badgeColors }: { value: unknown; render?: string; badgeColors?: Record<string, string> }) {
  if (value == null) return <span style={{ opacity: 0.3 }}>--</span>;

  switch (render) {
    case 'badge': {
      const text = String(value);
      const color = badgeColors?.[text];
      return (
        <span
          className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: color ? `${color}22` : 'rgba(255,255,255,0.08)',
            color: color ?? 'var(--text-secondary)',
            border: `1px solid ${color ? `${color}44` : 'rgba(255,255,255,0.12)'}`,
          }}
        >
          {text}
        </span>
      );
    }
    case 'tags': {
      const items = Array.isArray(value) ? value : [value];
      return (
        <span className="flex flex-wrap gap-1">
          {items.slice(0, 5).map((v, i) => (
            <span
              key={i}
              className="inline-block px-1 py-0.5 rounded text-xs"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
            >
              {String(v)}
            </span>
          ))}
          {items.length > 5 && (
            <span style={{ color: 'var(--text-muted)' }}>+{items.length - 5}</span>
          )}
        </span>
      );
    }
    case 'boolean':
      return <span>{value ? '\u2705' : '\u274C'}</span>;
    case 'number':
      return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(value)}</span>;
    case 'json':
      return <span style={{ color: 'var(--text-muted)' }}>{JSON.stringify(value)}</span>;
    case 'prose':
      return <span className="italic" style={{ color: 'var(--text-secondary)' }}>{String(value).slice(0, 80)}</span>;
    default:
      return <span>{String(value).slice(0, 120)}</span>;
  }
}

// ── Nested Value Resolver ─────────────────────────────────────

function getNestedValue(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined;
    if (Array.isArray(current) && key === 'length') return current.length;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
