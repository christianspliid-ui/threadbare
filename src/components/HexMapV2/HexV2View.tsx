import { useRef, useState, useCallback } from 'react';
import type { HexCoord, HexTile } from '../../types';
import type { HexMapV2Handle } from './HexMapV2';
import HexMapV2 from './HexMapV2';

interface HexV2ViewProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  seed: number;
}

/**
 * Minimal game chrome for the `?view=hexv2` route.
 *
 * Phase 1: topbar + full-width Three.js canvas. No sidebar, no simulation.
 * Later phases will progressively add chrome as the renderer matures.
 *
 * Layout: h-screen flex flex-col overflow-hidden (viewport contract per CLAUDE.md).
 */
export function HexV2View({ tiles, cols, rows, seed }: HexV2ViewProps) {
  const mapRef = useRef<HexMapV2Handle>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [hoveredHex, setHoveredHex]   = useState<HexCoord | null>(null);

  const handleHexClick = useCallback((coord: HexCoord) => {
    setSelectedHex(prev =>
      prev?.col === coord.col && prev?.row === coord.row ? null : coord,
    );
  }, []);

  const handleHexHover = useCallback((coord: HexCoord | null) => {
    setHoveredHex(coord);
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden grain"
      style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-primary)' }}
    >
      {/* ── Topbar (game chrome) ── */}
      <div
        className="w-full flex items-center flex-shrink-0 z-30"
        style={{
          background:   'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))',
          borderBottom: '1px solid rgba(212,160,64,0.3)',
          height:       'var(--topbar-height)',
          minHeight:    'var(--topbar-height)',
          paddingLeft:  'var(--topbar-padding-x, 16px)',
          paddingRight: 'var(--topbar-padding-x, 16px)',
          gap:          '12px',
        }}
      >
        <span
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'var(--text-lg)',
            color:         'var(--accent-gold)',
            letterSpacing: '0.08em',
            fontWeight:    600,
          }}
        >
          Renderer V2
        </span>

        <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {tiles.length.toLocaleString()} hexes · seed {seed}
        </span>

        {selectedHex && (
          <>
            <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Selected: ({selectedHex.col}, {selectedHex.row})
            </span>
          </>
        )}

        {hoveredHex && (
          <>
            <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Hover: ({hoveredHex.col}, {hoveredHex.row})
            </span>
          </>
        )}
      </div>

      {/* ── Map canvas (fills remaining space) ── */}
      <div className="flex-1 overflow-hidden">
        <HexMapV2
          ref={mapRef}
          tiles={tiles}
          cols={cols}
          rows={rows}
          seed={seed}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          onHexClick={handleHexClick}
          onHexHover={handleHexHover}
        />
      </div>
    </div>
  );
}
