/**
 * ConstantsViewer — name/value/description table for standalone constants.
 *
 * Used for files that export individual numbers/strings (game-config, threat-content, etc.).
 * Handles ~10% of CMS content.
 */

import { useMemo } from 'react';
import type { ConstantEntry } from '../types';

interface Props {
  data: ConstantEntry[];
  searchQuery?: string;
}

export function ConstantsViewer({ data, searchQuery }: Props) {
  const filtered = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q) ||
      String(c.value).toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr>
          <th
            className="text-left px-2 py-1.5 font-semibold"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', width: '260px' }}
          >
            Constant
          </th>
          <th
            className="text-left px-2 py-1.5 font-semibold"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', width: '100px' }}
          >
            Value
          </th>
          <th
            className="text-left px-2 py-1.5 font-semibold"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(entry => (
          <tr key={entry.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--accent-gold)' }}>
              {entry.name}
            </td>
            <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(entry.value)}
            </td>
            <td className="px-2 py-1.5" style={{ color: 'var(--text-muted)' }}>
              {entry.description ?? ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatValue(v: unknown): string {
  if (typeof v === 'number') return v.toString();
  if (typeof v === 'string') return `"${v}"`;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return JSON.stringify(v);
}
