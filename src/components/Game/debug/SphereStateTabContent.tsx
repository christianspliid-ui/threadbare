import React from 'react';
import type { SphereAggregate } from '../../../types/worldSoul';
import { SPHERE_ICONS } from '../../../data/sphereIcons';
import { SPHERE_TOOLTIPS } from '../../../data/sphereTooltips';
import { MAX_SPHERE_SCORE } from '../../../types/sphereAffinity';

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: '32px 16px',
  textAlign: 'center',
  color: 'var(--text-primary)',
  opacity: 0.4,
  fontSize: 'var(--text-xs)',
};

const DETAIL_AREA_STYLE: React.CSSProperties = {
  padding: '12px',
  fontSize: 'var(--text-xs)',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
  lineHeight: 1.5,
};

const DETAIL_ROW_STYLE: React.CSSProperties = {
  marginBottom: '6px',
  display: 'flex',
  gap: '8px',
};

const DETAIL_LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-muted)',
  minWidth: '120px',
  fontWeight: 500,
};

const DETAIL_VALUE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
  flex: 1,
};

export interface SphereStateTabContentProps {
  aggregate?: SphereAggregate;
}

export function SphereStateTabContent({ aggregate }: SphereStateTabContentProps) {
  if (!aggregate) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        No sphere aggregate yet. Run a tick to compute.
      </div>
    );
  }

  const spheres = Object.keys(SPHERE_ICONS) as Array<keyof typeof SPHERE_ICONS>;
  const sortedSpheres = [...spheres].sort(
    (a, b) => (aggregate.totalBySphere[b] ?? 0) - (aggregate.totalBySphere[a] ?? 0),
  );

  return (
    <div style={{ ...DETAIL_AREA_STYLE, padding: '16px' }}>
      <div style={{ marginBottom: '16px', padding: '10px', background: 'var(--bg-raised)', borderRadius: '4px' }}>
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Dominant:</span>
          <span style={{
            ...DETAIL_VALUE_STYLE,
            color: aggregate.dominantSphere
              ? SPHERE_ICONS[aggregate.dominantSphere]?.color ?? DETAIL_VALUE_STYLE.color
              : DETAIL_VALUE_STYLE.color,
            fontWeight: 600,
          }}>
            {aggregate.dominantSphere ?? '—'}
          </span>
        </div>
        <div style={{ ...DETAIL_ROW_STYLE, marginBottom: '4px' }}>
          <span style={DETAIL_LABEL_STYLE}>Entity count:</span>
          <span style={DETAIL_VALUE_STYLE}>{aggregate.entityCount}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedSpheres.map(sphere => {
          const total = aggregate.totalBySphere[sphere] ?? 0;
          const avgScore = aggregate.entityCount > 0 ? total / aggregate.entityCount : 0;
          const color = SPHERE_ICONS[sphere]?.color ?? '#888';
          const tooltip = SPHERE_TOOLTIPS[sphere];
          const barPct = Math.min(100, (avgScore / MAX_SPHERE_SCORE) * 100);
          const isDominant = aggregate.dominantSphere === sphere;

          return (
            <div key={sphere} title={tooltip}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)',
                  color,
                  fontWeight: isDominant ? 700 : 400,
                  textTransform: 'capitalize',
                }}>
                  {isDominant ? '★ ' : ''}{sphere}
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}>
                  total: {total} | avg: {avgScore.toFixed(2)}
                </span>
              </div>
              <div style={{
                height: '6px',
                background: 'var(--bg-raised)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: color,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                  opacity: isDominant ? 1 : 0.65,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
