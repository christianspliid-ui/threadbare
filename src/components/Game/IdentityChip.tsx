import { useMemo } from 'react';
import type { SphereName } from '../../types';
import { SphereIcon } from '../shared/SphereIcon';
import { Tooltip } from '../shared/Tooltip';

interface IdentityChipProps {
  avatarName: string;
  archetypeTitle: string;
  cycle: number;
  sphereColor: string;
  primarySphere: SphereName;
  onClick: () => void;
}

export function IdentityChip({
  avatarName, archetypeTitle, cycle, sphereColor, primarySphere, onClick,
}: IdentityChipProps) {
  const accentStyle = useMemo(() => ({
    width: '3px',
    alignSelf: 'stretch',
    backgroundColor: sphereColor,
    borderRadius: '0.125rem',
    boxShadow: `0 0 8px ${sphereColor}60`,
    flexShrink: 0,
  }), [sphereColor]);

  return (
    <Tooltip label={`Cycle ${cycle}`} desc={`${archetypeTitle} — Cycle ${cycle}`}>
      <button
        onClick={onClick}
        className="flex items-center gap-2 pr-2 rounded transition-colors hover:bg-[var(--bg-raised)]"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem 0.25rem 0' }}
      >
        {/* Sphere-colored accent bar */}
        <div style={accentStyle} />

        <div className="text-left">
          {/* Line 1: sphere icon + avatar name */}
          <div className="flex items-center gap-1">
            <SphereIcon sphereName={primarySphere} size="0.75rem" />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.04em',
              }}
            >
              {avatarName}
            </span>
          </div>

          {/* Line 2: archetype title */}
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              marginTop: '0.1rem',
            }}
          >
            {archetypeTitle}
          </div>
        </div>
      </button>
    </Tooltip>
  );
}
