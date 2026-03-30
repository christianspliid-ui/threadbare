/**
 * ConfigManager — grouped, searchable, editable viewer for game-design constants.
 *
 * Features:
 * - Collapsible groups with constant counts
 * - Inline editing with range validation
 * - Dirty-state tracking with save/reset
 * - Search across constant names, descriptions, and usedBy
 * - Source file and formula reference display
 */

import { useState, useMemo, useCallback } from 'react';
import type { TunableGroup, TunableConstant } from '../types';

interface Props {
  groups: TunableGroup[];
  searchQuery?: string;
}

interface EditState {
  /** key = "groupId::exportName" */
  [key: string]: string;
}

function editKey(groupId: string, exportName: string): string {
  return `${groupId}::${exportName}`;
}

export function ConfigManager({ groups, searchQuery }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<EditState>({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Filter groups and constants by search query
  const filtered = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map(g => ({
        ...g,
        constants: g.constants.filter(c =>
          c.exportName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.usedBy ?? '').toLowerCase().includes(q) ||
          c.sourceFile.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.constants.length > 0);
  }, [groups, searchQuery]);

  const dirtyCount = Object.keys(edits).length;

  const handleEdit = useCallback((groupId: string, c: TunableConstant, raw: string) => {
    const key = editKey(groupId, c.exportName);
    // If the raw value matches the original, remove from edits
    const original = String(c.value);
    if (raw === original) {
      setEdits(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setEdits(prev => ({ ...prev, [key]: raw }));
    }
  }, []);

  const handleReset = useCallback(() => {
    setEdits({});
    setSaveResult(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      // Build the payload: array of { sourceFile, exportName, newValue }
      const changes: Array<{ sourceFile: string; exportName: string; newValue: string }> = [];
      for (const g of groups) {
        for (const c of g.constants) {
          const key = editKey(g.id, c.exportName);
          if (key in edits) {
            changes.push({
              sourceFile: c.sourceFile,
              exportName: c.exportName,
              newValue: edits[key],
            });
          }
        }
      }
      const res = await fetch('/__config-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveResult({ ok: true, message: `Saved ${changes.length} constant${changes.length !== 1 ? 's' : ''}. HMR will reload.` });
        setEdits({});
      } else {
        setSaveResult({ ok: false, message: data.error ?? 'Unknown error' });
      }
    } catch (err) {
      setSaveResult({ ok: false, message: String(err) });
    } finally {
      setSaving(false);
    }
  }, [groups, edits]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex-none flex items-center gap-3 px-4 py-2"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.reduce((s, g) => s + g.constants.length, 0)} constants in {filtered.length} groups
        </span>
        <div className="flex-1" />
        {dirtyCount > 0 && (
          <>
            <span className="text-xs font-semibold" style={{ color: 'var(--accent-gold)' }}>
              {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleReset}
              className="px-2 py-0.5 text-xs rounded"
              style={{
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
              }}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-0.5 text-xs rounded font-semibold"
              style={{
                backgroundColor: 'var(--accent-gold)',
                color: 'var(--bg-abyss)',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save to Source'}
            </button>
          </>
        )}
        {saveResult && (
          <span
            className="text-xs"
            style={{ color: saveResult.ok ? '#4ade80' : '#f87171' }}
          >
            {saveResult.message}
          </span>
        )}
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {filtered.map(group => (
          <GroupSection
            key={group.id}
            group={group}
            isCollapsed={collapsed.has(group.id)}
            onToggle={() => toggle(group.id)}
            edits={edits}
            onEdit={handleEdit}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-xs py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No constants match the search query.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Group Section ───────────────────────────────────────────────────────

function GroupSection({
  group,
  isCollapsed,
  onToggle,
  edits,
  onEdit,
}: {
  group: TunableGroup;
  isCollapsed: boolean;
  onToggle: () => void;
  edits: EditState;
  onEdit: (groupId: string, c: TunableConstant, raw: string) => void;
}) {
  const dirtyInGroup = group.constants.filter(
    c => editKey(group.id, c.exportName) in edits
  ).length;

  return (
    <div className="mb-4">
      {/* Group header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-2 px-1 text-left"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span
          className="text-[10px] transition-transform"
          style={{
            color: 'var(--text-muted)',
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          &#9660;
        </span>
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}
        >
          {group.label}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          ({group.constants.length})
        </span>
        {dirtyInGroup > 0 && (
          <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-gold)' }}>
            {dirtyInGroup} changed
          </span>
        )}
        <span className="flex-1" />
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {group.description}
        </span>
      </button>

      {/* Constants table */}
      {!isCollapsed && (
        <table className="w-full text-xs border-collapse mt-1">
          <thead>
            <tr>
              <th className="text-left px-2 py-1 font-semibold" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '240px' }}>
                Constant
              </th>
              <th className="text-left px-2 py-1 font-semibold" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100px' }}>
                Value
              </th>
              <th className="text-left px-2 py-1 font-semibold" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100px' }}>
                Range
              </th>
              <th className="text-left px-2 py-1 font-semibold" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                Description
              </th>
              <th className="text-left px-2 py-1 font-semibold" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '200px' }}>
                Used By
              </th>
            </tr>
          </thead>
          <tbody>
            {group.constants.map(c => (
              <ConstantRow
                key={c.exportName}
                c={c}
                groupId={group.id}
                editValue={edits[editKey(group.id, c.exportName)]}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Constant Row ────────────────────────────────────────────────────────

function ConstantRow({
  c,
  groupId,
  editValue,
  onEdit,
}: {
  c: TunableConstant;
  groupId: string;
  editValue?: string;
  onEdit: (groupId: string, c: TunableConstant, raw: string) => void;
}) {
  const isDirty = editValue !== undefined;
  const displayValue = editValue ?? String(c.value);

  // Validate against range
  let validationError: string | null = null;
  if (isDirty && c.type === 'number' && c.range) {
    const num = Number(editValue);
    if (isNaN(num)) {
      validationError = 'Not a number';
    } else if (num < c.range[0] || num > c.range[1]) {
      validationError = `Outside range [${c.range[0]}, ${c.range[1]}]`;
    }
  }

  return (
    <tr
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        backgroundColor: isDirty ? 'rgba(234,179,8,0.06)' : 'transparent',
      }}
    >
      {/* Name */}
      <td className="px-2 py-1.5">
        <span className="font-mono text-[11px]" style={{ color: isDirty ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
          {c.exportName}
        </span>
        <div className="text-[9px] font-mono" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          {c.sourceFile}
        </div>
      </td>

      {/* Editable value */}
      <td className="px-2 py-1.5">
        {c.type === 'boolean' ? (
          <select
            value={displayValue}
            onChange={e => onEdit(groupId, c, e.target.value)}
            className="w-full text-xs font-mono px-1 py-0.5 rounded"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: isDirty ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <div>
            <input
              type={c.type === 'number' ? 'number' : 'text'}
              value={displayValue}
              onChange={e => onEdit(groupId, c, e.target.value)}
              step={c.type === 'number' ? 'any' : undefined}
              className="w-full text-xs font-mono px-1 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: validationError
                  ? '1px solid #f87171'
                  : isDirty
                    ? '1px solid var(--accent-gold)'
                    : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            {validationError && (
              <div className="text-[9px] mt-0.5" style={{ color: '#f87171' }}>
                {validationError}
              </div>
            )}
          </div>
        )}
      </td>

      {/* Range */}
      <td className="px-2 py-1.5 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {c.range ? `[${c.range[0]}, ${c.range[1]}]` : c.type === 'boolean' ? 'true/false' : '—'}
      </td>

      {/* Description */}
      <td className="px-2 py-1.5" style={{ color: 'var(--text-muted)' }}>
        {c.description}
      </td>

      {/* Used By */}
      <td className="px-2 py-1.5 font-mono text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        {c.usedBy ?? '—'}
      </td>
    </tr>
  );
}
