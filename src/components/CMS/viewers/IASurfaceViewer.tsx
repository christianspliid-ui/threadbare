/**
 * IASurfaceViewer — read-only inspector for the IA manifest (src/data/ia-manifest.ts).
 *
 * Three-panel layout: filter bar → surface list → detail panel.
 * Surfaces show view/mount badges, reader count, first state_path.
 * Detail shows full reads[] table, optional_readers, notes, and "Open this surface" button.
 */

import { useState, useMemo } from 'react';
import type { IASurface, SurfaceView, SurfaceMount } from '../../../data/ia-manifest';

// ── Badge colors ──────────────────────────────────────────────

const VIEW_COLORS: Record<SurfaceView, string> = {
  start:      '#166534',
  ascendant:  '#581c87',
  game:       '#1e3a8a',
  codex:      '#92400e',
  styleguide: '#134e4a',
  cms:        '#57534e',
};

const MOUNT_COLORS: Record<SurfaceMount, string> = {
  always:  '#166534',
  modal:   '#7c2d12',
  drillin: '#1e3a8a',
};

// ── Props ─────────────────────────────────────────────────────

interface Props {
  data: IASurface[];
  searchQuery?: string;
  selectedKey: string | number | null;
  onSelectItem: (key: string | number) => void;
}

// ── Component ─────────────────────────────────────────────────

export function IASurfaceViewer({ data, searchQuery, selectedKey, onSelectItem }: Props) {
  const [viewFilter, setViewFilter] = useState<SurfaceView | 'all'>('all');
  const [mountFilter, setMountFilter] = useState<SurfaceMount | 'all'>('all');

  const filtered = useMemo(() => {
    let result = data;
    if (viewFilter !== 'all') result = result.filter(s => s.view === viewFilter);
    if (mountFilter !== 'all') result = result.filter(s => s.mount === mountFilter);
    if (searchQuery && searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.surface.toLowerCase().includes(q) ||
        s.reads.some(r => r.reader.toLowerCase().includes(q) || r.state_path.toLowerCase().includes(q)) ||
        (s.notes ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, viewFilter, mountFilter, searchQuery]);

  const selectedIdx = typeof selectedKey === 'number' ? selectedKey : null;
  const selectedSurface = selectedIdx !== null ? filtered[selectedIdx] ?? null : null;

  return (
    <div className="flex flex-col gap-0" style={{ height: '100%' }}>
      {/* Filter bar */}
      <FilterBar
        viewFilter={viewFilter}
        mountFilter={mountFilter}
        onViewFilter={setViewFilter}
        onMountFilter={setMountFilter}
        totalCount={data.length}
        filteredCount={filtered.length}
      />

      {/* Split: list + detail */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Surface list */}
        <div
          className="overflow-y-auto"
          style={{
            width: selectedSurface ? '50%' : '100%',
            borderRight: selectedSurface ? '1px solid var(--border-subtle)' : undefined,
            transition: 'width 0.15s ease',
          }}
        >
          <SurfaceList
            surfaces={filtered}
            selectedIdx={selectedIdx}
            onSelect={onSelectItem}
          />
        </div>

        {/* Detail panel */}
        {selectedSurface && (
          <div className="flex-1 overflow-y-auto">
            <SurfaceDetail
              surface={selectedSurface}
              onClose={() => onSelectItem(-1)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────

const VIEW_OPTIONS: Array<SurfaceView | 'all'> = ['all', 'start', 'ascendant', 'game', 'codex', 'styleguide', 'cms'];
const MOUNT_OPTIONS: Array<SurfaceMount | 'all'> = ['all', 'always', 'modal', 'drillin'];

function FilterBar({
  viewFilter, mountFilter, onViewFilter, onMountFilter, totalCount, filteredCount,
}: {
  viewFilter: SurfaceView | 'all';
  mountFilter: SurfaceMount | 'all';
  onViewFilter: (v: SurfaceView | 'all') => void;
  onMountFilter: (m: SurfaceMount | 'all') => void;
  totalCount: number;
  filteredCount: number;
}) {
  return (
    <div
      className="flex-none flex items-center gap-4 px-1 py-2 flex-wrap"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>view:</span>
        {VIEW_OPTIONS.map(v => (
          <Chip
            key={v}
            label={v}
            active={viewFilter === v}
            color={v === 'all' ? undefined : VIEW_COLORS[v as SurfaceView]}
            onClick={() => onViewFilter(v)}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>mount:</span>
        {MOUNT_OPTIONS.map(m => (
          <Chip
            key={m}
            label={m}
            active={mountFilter === m}
            color={m === 'all' ? undefined : MOUNT_COLORS[m as SurfaceMount]}
            onClick={() => onMountFilter(m)}
          />
        ))}
      </div>
      {filteredCount < totalCount && (
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {filteredCount} / {totalCount}
        </span>
      )}
    </div>
  );
}

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-0.5 rounded cursor-pointer"
      style={{
        backgroundColor: active
          ? (color ? `${color}33` : 'rgba(212,160,64,0.15)')
          : 'rgba(255,255,255,0.04)',
        color: active ? (color ?? 'var(--accent-gold)') : 'var(--text-muted)',
        border: `1px solid ${active ? (color ?? 'var(--accent-gold)') : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.1s ease',
      }}
    >
      {label}
    </button>
  );
}

// ── Surface List ──────────────────────────────────────────────

function SurfaceList({
  surfaces, selectedIdx, onSelect,
}: {
  surfaces: IASurface[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
}) {
  if (surfaces.length === 0) {
    return (
      <div className="p-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        No surfaces match the current filters.
      </div>
    );
  }

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr>
          {['Surface', 'View', 'Mount', 'Readers', 'State paths'].map(h => (
            <th
              key={h}
              className="text-left px-2 py-1.5 font-semibold"
              style={{
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-subtle)',
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--bg-abyss)',
                zIndex: 1,
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {surfaces.map((s, idx) => (
          <tr
            key={s.surface}
            onClick={() => onSelect(idx)}
            className="cursor-pointer"
            style={{
              backgroundColor: idx === selectedIdx ? 'rgba(212,160,64,0.08)' : 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            <td className="px-2 py-1.5 font-mono" style={{ color: 'var(--text-primary)' }}>
              {s.surface}
            </td>
            <td className="px-2 py-1.5">
              <Badge label={s.view} color={VIEW_COLORS[s.view]} />
            </td>
            <td className="px-2 py-1.5">
              <Badge label={s.mount} color={MOUNT_COLORS[s.mount]} />
            </td>
            <td className="px-2 py-1.5" style={{ color: 'var(--text-secondary)' }}>
              {s.reads.length}
            </td>
            <td className="px-2 py-1.5" style={{ color: 'var(--text-muted)', maxWidth: '200px' }}>
              <span className="truncate block" style={{ maxWidth: '200px' }}>
                {s.reads[0]?.state_path ?? '—'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Surface Detail ─────────────────────────────────────────────

function SurfaceDetail({ surface, onClose }: { surface: IASurface; onClose: () => void }) {
  const handleOpen = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!surface.openUrl) { e.preventDefault(); return; }
    if (!e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.location.href = surface.openUrl;
    }
    // ctrl/meta-click: let browser open new tab via href
  };

  return (
    <div className="px-4 py-3 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold font-mono" style={{ color: 'var(--accent-gold)' }}>
            {surface.surface}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge label={surface.view} color={VIEW_COLORS[surface.view]} />
            <Badge label={surface.mount} color={MOUNT_COLORS[surface.mount]} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Open button */}
          {surface.openUrl ? (
            <a
              href={surface.openUrl}
              onClick={handleOpen}
              className="text-xs px-3 py-1 rounded font-semibold"
              style={{
                backgroundColor: 'rgba(212,160,64,0.15)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(212,160,64,0.4)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Open this surface ↗
            </a>
          ) : (
            <span
              className="text-xs px-3 py-1 rounded"
              title="No live target configured for this surface"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'not-allowed',
              }}
            >
              Open this surface
            </span>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-0.5 rounded"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Notes */}
      {surface.notes && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          {surface.notes.trim()}
        </p>
      )}

      {/* Reads table */}
      <div>
        <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
          reads[] — {surface.reads.length} reader{surface.reads.length !== 1 ? 's' : ''}
        </h4>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {['Reader', 'State path', 'Visible when'].map(h => (
                <th
                  key={h}
                  className="text-left px-2 py-1 font-semibold"
                  style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {surface.reads.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="px-2 py-1 font-mono" style={{ color: 'var(--accent-gold)' }}>
                  {r.reader}
                </td>
                <td className="px-2 py-1 font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {r.state_path}
                </td>
                <td className="px-2 py-1" style={{ color: 'var(--text-muted)' }}>
                  {r.visible_when}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Optional readers */}
      {surface.optional_readers && surface.optional_readers.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            optional_readers
          </h4>
          <div className="flex flex-wrap gap-1">
            {surface.optional_readers.map(r => (
              <span
                key={r}
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}
