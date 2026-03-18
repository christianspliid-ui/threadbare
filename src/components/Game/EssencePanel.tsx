import { useMemo, useRef, useEffect, useState } from 'react';
import { SPHERE_NAMES, type SphereName } from '../../types';
import type { EssencePool } from '../../types/influence';
import { SphereIcon } from '../shared/SphereIcon';
import { Tooltip } from '../shared/Tooltip';
import { getSphereColor } from '../../data/sphereIcons';

interface EssencePanelProps {
  pool: EssencePool;
  maxEssence: number;
  primarySphere: SphereName;
  secondarySphere: SphereName;
  income?: EssencePool;
  compact?: boolean;
}

export function EssencePanel({ pool, maxEssence, primarySphere, secondarySphere, income, compact }: EssencePanelProps) {
  const totalEssence = SPHERE_NAMES.reduce((sum, s) => sum + pool[s], 0);

  // RC-050: Memoize sphere sorting to avoid recomputing on every render
  const sorted = useMemo(() => [...SPHERE_NAMES].sort((a, b) => {
    if (a === primarySphere) return -1;
    if (b === primarySphere) return 1;
    if (a === secondarySphere) return -1;
    if (b === secondarySphere) return 1;
    return pool[b] - pool[a];
  }), [pool, primarySphere, secondarySphere]);

  // Track previous essence pool and trigger pulse on value changes
  const prevPoolRef = useRef<Record<string, number>>({});
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newPulsing = new Set<string>();
    for (const [id, val] of Object.entries(pool)) {
      if (prevPoolRef.current[id] !== undefined && prevPoolRef.current[id] !== val) {
        newPulsing.add(id);
      }
    }
    prevPoolRef.current = { ...pool };
    if (newPulsing.size > 0) {
      setPulsingIds(newPulsing);
      const timer = setTimeout(() => setPulsingIds(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [pool]);

  if (compact) {
    return (
      <Tooltip
        id="ui.essence_panel"
        label={`Total: ${totalEssence.toFixed(1)} / ${(maxEssence * 8).toFixed(0)}`}
      >
        <div className="flex items-center gap-2">
          {sorted.map((sphere) => {
            const value = pool[sphere];
            const isPrimary = sphere === primarySphere;
            const isSecondary = sphere === secondarySphere;
            if (value < 0.5 && !isPrimary && !isSecondary) return null;

            const color = getSphereColor(sphere);
            const net = income?.[sphere] ?? null;
            const incomeSign = net !== null && Math.abs(net) >= 0.05 ? (net >= 0 ? '+' : '−') : null;
            const incomeAbs = net !== null ? Math.abs(net).toFixed(1) : null;

            return (
              <div
                key={sphere}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors${pulsingIds.has(sphere) ? ' pulse-gold' : ''}`}
                style={{
                  background: 'var(--bg-raised)',
                  border: `1px solid ${isPrimary ? `${color}40` : 'transparent'}`,
                  opacity: isPrimary ? 1 : isSecondary ? 0.9 : 0.7,
                }}
              >
                <SphereIcon sphereName={sphere} size="0.8rem" className="w-3.5 text-center" />
                <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                  {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
                </span>
                {incomeSign && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: net! >= 0 ? 'var(--positive)' : 'var(--negative)',
                      lineHeight: 1,
                    }}
                  >
                    {incomeSign}{incomeAbs}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Tooltip>
    );
  }

  return (
    <div className="panel-glass space-y-2" style={{ padding: 'var(--panel-padding)' }}>
      <div className="flex items-center justify-between">
        <Tooltip id="ui.essence_panel">
          <h2
            className="font-bold uppercase tracking-widest"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            Divine Essence
          </h2>
        </Tooltip>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {totalEssence.toFixed(1)} / {(maxEssence * 8).toFixed(0)}
        </span>
      </div>

      <div className="space-y-1">
        {sorted.map((sphere) => {
          const value = pool[sphere];
          const isPrimary = sphere === primarySphere;
          const isSecondary = sphere === secondarySphere;
          // IA-004: Hide spheres with negligible essence (< 0.5) unless primary/secondary
          if (value < 0.5 && !isPrimary && !isSecondary) return null;

          const pct = Math.min((value / maxEssence) * 100, 100);
          const color = getSphereColor(sphere);

          return (
            <div key={sphere} className="flex items-center gap-2">
              <SphereIcon sphereName={sphere} size="1rem" className="w-5 text-center" />
              <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-raised)' }}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out${pulsingIds.has(sphere) ? ' pulse-gold' : ''}`}
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    // Primary sphere gets glow effect; secondary and others don't
                    boxShadow: isPrimary ? `0 0 8px ${color}80` : value > 0 ? `0 0 6px ${color}66` : 'none',
                  }}
                />
              </div>
              <span
                className="w-10 text-right font-mono"
                style={{
                  fontSize: 'var(--text-xs)',
                  color,
                  // Primary: full opacity, secondary: reduced opacity, others: dim
                  opacity: isPrimary ? 1 : isSecondary ? 0.85 : 0.6,
                }}
              >
                {value.toFixed(1)}
              </span>
              {isPrimary && (
                <span style={{ fontSize: 'var(--text-xs)', padding: '0.375rem 0.375rem', borderRadius: '0.25rem', backgroundColor: 'var(--accent-gold-dim)', color: 'var(--text-primary)' }}>1st</span>
              )}
              {isSecondary && (
                <span style={{ fontSize: 'var(--text-xs)', padding: '0.375rem 0.375rem', borderRadius: '0.25rem', backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}>2nd</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
