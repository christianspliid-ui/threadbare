import React, { useState } from 'react';
import { SphereIcon } from '../../shared/SphereIcon';
import { getSphereColor } from '../../../data/sphereIcons';
import { SPHERE_COPY } from '../../../data/ascendant-bar-content';
import type { SphereName } from '../../../types';
import type { EssenceRowView } from './selectors';
import styles from './styles.module.css';

const TREND_COLOR: Record<string, string> = {
  rising: 'var(--positive)',
  steady: 'var(--text-secondary)',
  ebbing: 'var(--negative)',
};

const TREND_ARROW: Record<string, string> = {
  rising: '↑', steady: '—', ebbing: '↓',
};

interface EssenceRowProps {
  row: EssenceRowView;
}

function EssenceRow({ row }: EssenceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getSphereColor(row.sphere);
  const sphereCopy = SPHERE_COPY[row.sphere as SphereName];
  const trendColor = TREND_COLOR[row.trend];
  const arrow = TREND_ARROW[row.trend];

  // Normalize level: treat up to 10 as max for fill bar display
  const fillPct = Math.min(100, (row.level / 10) * 100);

  return (
    <div>
      <div
        className={styles.essenceRow}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v); }}
        aria-expanded={expanded}
      >
        <SphereIcon sphere={row.sphere} size={16} />
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: row.isPrimary ? 'var(--text-primary)' : row.isSecondary ? 'var(--text-secondary)' : 'var(--text-muted)',
          minWidth: 60,
        }}>
          {sphereCopy?.label ?? row.sphere}
        </span>
        <div className={styles.essenceFillBar}>
          <div style={{
            height: '100%', width: `${fillPct}%`,
            background: color,
            opacity: row.isPrimary ? 1 : row.isSecondary ? 0.75 : 0.5,
            transition: 'width 0.4s ease-out',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: trendColor, minWidth: 16 }}>
          {arrow}
        </span>
      </div>
      {expanded && sphereCopy && (
        <div style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
          padding: '4px 6px 4px 30px',
        }}>
          {sphereCopy.role}
        </div>
      )}
    </div>
  );
}

interface EssenceBlockProps {
  rows: EssenceRowView[];
}

export function EssenceBlock({ rows }: EssenceBlockProps) {
  if (rows.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--text-muted)' }}>
        No essence gathered yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map((row) => <EssenceRow key={row.sphere} row={row} />)}
    </div>
  );
}
