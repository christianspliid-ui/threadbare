import type { CSSProperties } from 'react';
import { TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS } from '../terrainTextureLabPresets';

const DENSITY_PRESETS = [
  { label: 'Sparse', value: 0.35 },
  { label: 'Light', value: 0.6 },
  { label: 'Default', value: TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.DEFAULT_DENSITY_SCALE },
  { label: 'Dense', value: 1.4 },
] as const;

const CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
};

const PRESET_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  flexWrap: 'wrap',
};

const LABEL_STYLE: CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
};

interface VignetteDebugOverlayProps {
  showChunkBounds: boolean;
  showLandmarkBounds: boolean;
  densityScale: number;
  fillerInstanceCount: number;
  landmarkInstanceCount: number;
  landmarkBatchCount: number;
  onShowChunkBoundsChange: (value: boolean) => void;
  onShowLandmarkBoundsChange: (value: boolean) => void;
  onDensityScaleChange: (value: number) => void;
}

export function VignetteDebugOverlay({
  showChunkBounds,
  showLandmarkBounds,
  densityScale,
  fillerInstanceCount,
  landmarkInstanceCount,
  landmarkBatchCount,
  onShowChunkBoundsChange,
  onShowLandmarkBoundsChange,
  onDensityScaleChange,
}: VignetteDebugOverlayProps) {
  return (
    <div style={CONTAINER_STYLE}>
      <div style={ROW_STYLE}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showChunkBounds}
            onChange={e => onShowChunkBoundsChange(e.target.checked)}
          />
          <span style={LABEL_STYLE}>Filler bounds</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showLandmarkBounds}
            onChange={e => onShowLandmarkBoundsChange(e.target.checked)}
          />
          <span style={LABEL_STYLE}>Landmark bounds</span>
        </label>
      </div>
      <div style={ROW_STYLE}>
        <span style={LABEL_STYLE}>
          Filler: {fillerInstanceCount} · Landmarks: {landmarkInstanceCount} ({landmarkBatchCount} batches)
        </span>
      </div>
      <div style={ROW_STYLE}>
        <span style={LABEL_STYLE}>Density:</span>
        <div style={PRESET_ROW_STYLE}>
          {DENSITY_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => onDensityScaleChange(preset.value)}
              style={{
                padding: '2px 8px',
                fontSize: 'var(--text-xs)',
                background: Math.abs(densityScale - preset.value) < 0.01
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-2)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
