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
}

export function EssencePanel({ pool, maxEssence, primarySphere, secondarySphere }: EssencePanelProps) {
  const totalEssence = SPHERE_NAMES.reduce((sum, s) => sum + pool[s], 0);

  // Sort: primary first, secondary second, then by amount descending
  const sorted = [...SPHERE_NAMES].sort((a, b) => {
    if (a === primarySphere) return -1;
    if (b === primarySphere) return 1;
    if (a === secondarySphere) return -1;
    if (b === secondarySphere) return 1;
    return pool[b] - pool[a];
  });

  return (
    <div className="bg-stone-700/80 border border-amber-700/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Tooltip id="ui.essence_panel">
          <h2
            className="text-sm font-bold text-amber-100 uppercase tracking-widest"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            Divine Essence
          </h2>
        </Tooltip>
        <span className="text-xs text-amber-400/60 font-mono">
          {totalEssence.toFixed(1)} / {(maxEssence * 8).toFixed(0)}
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((sphere) => {
          const value = pool[sphere];
          const pct = Math.min((value / maxEssence) * 100, 100);
          const isPrimary = sphere === primarySphere;
          const isSecondary = sphere === secondarySphere;
          const color = getSphereColor(sphere);

          return (
            <div key={sphere} className="flex items-center gap-2">
              <SphereIcon sphereName={sphere} size="1rem" className="w-5 text-center" />
              <div className="flex-1 h-3 rounded-full bg-stone-800/80 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}cc, ${color})`,
                    boxShadow: value > 0 ? `0 0 6px ${color}66` : 'none',
                  }}
                />
              </div>
              <span
                className="text-xs w-10 text-right font-mono"
                style={{ color: isPrimary || isSecondary ? color : 'rgba(217, 189, 147, 0.5)' }}
              >
                {value.toFixed(1)}
              </span>
              {isPrimary && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-800/40 text-amber-300/80">1st</span>
              )}
              {isSecondary && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-600/60 text-amber-400/60">2nd</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
