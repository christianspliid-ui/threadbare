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
  compact?: boolean;
}

export function EssencePanel({ pool, maxEssence, primarySphere, secondarySphere, compact }: EssencePanelProps) {
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
      <div className="flex items-center gap-3 flex-shrink-0">
        <Tooltip id="ui.essence_panel">
          <span
            className="font-bold uppercase tracking-widest flex-shrink-0"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            Essence
          </span>
        </Tooltip>
        <div className="flex items-center gap-2.5">
          {sorted.map((sphere) => {
            const value = pool[sphere];
            const isPrimary = sphere === primarySphere;
            const isSecondary = sphere === secondarySphere;
            if (value < 0.5 && !isPrimary && !isSecondary) return null;
            const color = getSphereColor(sphere);
            const pct = Math.min((value / maxEssence) * 100, 100);
            return (
              <div key={sphere} className="flex items-center gap-1">
                <SphereIcon sphereName={sphere} size="0.875rem" className="w-4 text-center" />
                <div className="w-10 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-raised)' }}>
                  <div
                    className={`h-full rounded-full transition-all duration-500${pulsingIds.has(sphere) ? ' pulse-gold' : ''}`}
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}cc, ${color})`,
                      boxShadow: isPrimary ? `0 0 6px ${color}80` : 'none',
                    }}
                  />
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color,
                    opacity: isPrimary ? 1 : isSecondary ? 0.85 : 0.6,
                    minWidth: '2.2rem',
                    textAlign: 'right',
                  }}
                >
                  {value.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
        <span className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {totalEssence.toFixed(0)}/{(maxEssence * 8).toFixed(0)}
        </span>
      </div>
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
