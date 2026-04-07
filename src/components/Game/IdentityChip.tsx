import { useMemo, useEffect, useState } from 'react';
import type { SphereName } from '../../types';
import { SphereIcon } from '../shared/SphereIcon';
import { Tooltip } from '../shared/Tooltip';
import { getOriginPortraitUrl } from '../../data/avatar-portrait-assets';

interface IdentityChipProps {
  avatarName: string;
  archetypeTitle: string;
  cycle: number;
  sphereColor: string;
  primarySphere: SphereName;
  originFragmentId: string;
  onClick: () => void;
}

export function IdentityChip({
  avatarName, archetypeTitle, cycle, sphereColor, primarySphere, originFragmentId, onClick,
}: IdentityChipProps) {
  const accentStyle = useMemo(() => ({
    width: '3px',
    alignSelf: 'stretch',
    backgroundColor: sphereColor,
    borderRadius: '0.125rem',
    boxShadow: `0 0 8px ${sphereColor}60`,
    flexShrink: 0,
  }), [sphereColor]);

  const [thumbDataUrl, setThumbDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!originFragmentId) return;
    setThumbDataUrl(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 56; // 2x for retina
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Cover crop from head region
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = img.height * 0.1;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      setThumbDataUrl(canvas.toDataURL());
    };
    img.onerror = () => {};
    img.src = getOriginPortraitUrl(originFragmentId);
  }, [originFragmentId]);

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
          {/* Line 1: portrait thumbnail + avatar name */}
          <div className="flex items-center gap-1.5">
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '28px', height: '28px' }}>
              {thumbDataUrl ? (
                <img
                  src={thumbDataUrl}
                  alt=""
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `2px solid ${sphereColor}`,
                  }}
                />
              ) : (
                <SphereIcon sphereName={primarySphere} size="1.25rem" />
              )}
            </div>
            <span
              className="topbar-compact-hide"
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

        </div>
      </button>
    </Tooltip>
  );
}
