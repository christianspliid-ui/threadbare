import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { TerrainTextureLabCanvas } from './TerrainTextureLabCanvas';
import {
  getDefaultTerrainTextureLabConfigs,
  getDefaultTerrainTextureLabViewSettings,
  getRecipeOption,
  LAB_TERRAIN_ORDER,
  parseTerrainTextureLabConfigs,
  parseTerrainTextureLabViewSettings,
  serializeTerrainTextureLabConfigs,
  serializeTerrainTextureLabViewSettings,
  TERRAIN_RECIPE_OPTIONS,
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_STORAGE_KEY,
  TERRAIN_TEXTURE_PREVIEW_HEXES,
  TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY,
  type LabTerrainKey,
  type TerrainTextureLabConfig,
  type TerrainTextureLabViewSettings,
} from './terrainTextureLabPresets';

const GLOBAL_CONTROL_STYLES: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) return Promise.resolve(false);
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

interface SliderFieldProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (next: number) => void;
}

function SliderField({ label, min, max, step, value, onChange }: SliderFieldProps) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label style={{ display: 'grid', gap: '6px' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          style={{ width: '48px', height: '36px', border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'transparent' }}
        />
        <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{value}</code>
      </div>
    </label>
  );
}

export function TerrainTextureLab() {
  const [configs, setConfigs] = useState<Record<LabTerrainKey, TerrainTextureLabConfig>>(() => {
    if (typeof window === 'undefined') return getDefaultTerrainTextureLabConfigs();
    const saved = window.localStorage.getItem(TERRAIN_TEXTURE_LAB_STORAGE_KEY);
    if (!saved) return getDefaultTerrainTextureLabConfigs();
    return parseTerrainTextureLabConfigs(saved) ?? getDefaultTerrainTextureLabConfigs();
  });
  const [selectedTerrain, setSelectedTerrain] = useState<LabTerrainKey>('grassland');
  const [seed, setSeed] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_SEED);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [globalTimeScale, setGlobalTimeScale] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_TIME_SCALE);
  const [viewSettings, setViewSettings] = useState<TerrainTextureLabViewSettings>(() => {
    if (typeof window === 'undefined') return getDefaultTerrainTextureLabViewSettings();
    const saved = window.localStorage.getItem(TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY);
    if (!saved) return getDefaultTerrainTextureLabViewSettings();
    return parseTerrainTextureLabViewSettings(saved) ?? getDefaultTerrainTextureLabViewSettings();
  });
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const selectedConfig = configs[selectedTerrain];
  const selectedRecipe = getRecipeOption(selectedConfig.recipe);
  const serializedConfigs = useMemo(() => serializeTerrainTextureLabConfigs(configs), [configs]);
  const serializedViewSettings = useMemo(() => serializeTerrainTextureLabViewSettings(viewSettings), [viewSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TERRAIN_TEXTURE_LAB_STORAGE_KEY, serializedConfigs);
  }, [serializedConfigs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY, serializedViewSettings);
  }, [serializedViewSettings]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timeout = window.setTimeout(() => setCopyState('idle'), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  function updateSelectedTerrain(nextPartial: Partial<TerrainTextureLabConfig>) {
    setConfigs(prev => ({
      ...prev,
      [selectedTerrain]: {
        ...prev[selectedTerrain],
        ...nextPartial,
      },
    }));
  }

  function updateViewSettings(nextPartial: Partial<TerrainTextureLabViewSettings>) {
    setViewSettings(prev => ({
      ...prev,
      ...nextPartial,
    }));
  }

  function resetSelectedTerrain() {
    const defaults = getDefaultTerrainTextureLabConfigs();
    setConfigs(prev => ({
      ...prev,
      [selectedTerrain]: defaults[selectedTerrain],
    }));
  }

  function resetAllTerrains() {
    setConfigs(getDefaultTerrainTextureLabConfigs());
    setSeed(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_SEED);
    setGlobalTimeScale(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_TIME_SCALE);
    setAnimationEnabled(true);
    setViewSettings(getDefaultTerrainTextureLabViewSettings());
  }

  async function handleCopyJson() {
    const success = await copyToClipboard(serializedConfigs);
    setCopyState(success ? 'copied' : 'failed');
  }

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `${TERRAIN_TEXTURE_LAB_CONSTANTS.PANEL_WIDTH}px minmax(0, 1fr)`,
        backgroundColor: 'var(--bg-abyss)',
        color: 'var(--text-primary)',
      }}
    >
      <aside
        className="grain"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.98))',
        }}
      >
        <div style={{ padding: 'var(--panel-padding)', borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Terrain Texture Lab</h1>
          <p style={{ marginTop: '8px', marginBottom: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Standalone WebGL playground for exploring terrain noise recipes before we touch the real hex map renderer.
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--panel-padding)', display: 'grid', gap: 'var(--space-4)' }}>
          <Card variant="glass">
            <Card.Header title="Terrain Presets" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {LAB_TERRAIN_ORDER.map((terrainKey) => {
                  const terrainConfig = configs[terrainKey];
                  const active = terrainKey === selectedTerrain;
                  return (
                    <button
                      key={terrainKey}
                      type="button"
                      onClick={() => setSelectedTerrain(terrainKey)}
                      className="interactive-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        backgroundColor: active ? 'rgba(212, 160, 64, 0.12)' : 'transparent',
                        borderColor: active ? 'var(--border-gold-strong)' : 'transparent',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '999px',
                          backgroundColor: terrainConfig.baseColor,
                          boxShadow: `0 0 0 1px ${terrainConfig.highlightColor}`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{terrainConfig.label}</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{getRecipeOption(terrainConfig.recipe).label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass">
            <Card.Header title="Selected Terrain" />
            <Card.Body scroll>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{selectedConfig.label}</h2>
                  <p style={{ marginTop: '8px', marginBottom: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    {selectedConfig.description}
                  </p>
                </div>

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Recipe</span>
                  <select
                    value={selectedConfig.recipe}
                    onChange={(event) => updateSelectedTerrain({ recipe: event.target.value as TerrainTextureLabConfig['recipe'] })}
                    style={{
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-raised)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {TERRAIN_RECIPE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{selectedRecipe.description}</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                  <ColorField label="Base" value={selectedConfig.baseColor} onChange={(baseColor) => updateSelectedTerrain({ baseColor })} />
                  <ColorField label="Highlight" value={selectedConfig.highlightColor} onChange={(highlightColor) => updateSelectedTerrain({ highlightColor })} />
                  <ColorField label="Shadow" value={selectedConfig.shadowColor} onChange={(shadowColor) => updateSelectedTerrain({ shadowColor })} />
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                  <SliderField label="Primary scale" min={0.6} max={5.5} step={0.05} value={selectedConfig.primaryScale} onChange={(primaryScale) => updateSelectedTerrain({ primaryScale })} />
                  <SliderField label="Detail scale" min={1.5} max={14} step={0.1} value={selectedConfig.detailScale} onChange={(detailScale) => updateSelectedTerrain({ detailScale })} />
                  <SliderField label="Warp scale" min={0.4} max={4} step={0.05} value={selectedConfig.warpScale} onChange={(warpScale) => updateSelectedTerrain({ warpScale })} />
                  <SliderField label="Warp strength" min={0} max={0.9} step={0.01} value={selectedConfig.warpStrength} onChange={(warpStrength) => updateSelectedTerrain({ warpStrength })} />
                  <SliderField label="Pattern mix" min={0} max={1} step={0.01} value={selectedConfig.mixAmount} onChange={(mixAmount) => updateSelectedTerrain({ mixAmount })} />
                  <SliderField label="Contrast" min={0.6} max={2.2} step={0.02} value={selectedConfig.contrast} onChange={(contrast) => updateSelectedTerrain({ contrast })} />
                  <SliderField label="Ridge sharpness" min={0} max={1} step={0.01} value={selectedConfig.ridgeStrength} onChange={(ridgeStrength) => updateSelectedTerrain({ ridgeStrength })} />
                  <SliderField label="Banding" min={0} max={1} step={0.01} value={selectedConfig.banding} onChange={(banding) => updateSelectedTerrain({ banding })} />
                  <SliderField label="Animation speed" min={0} max={1.4} step={0.01} value={selectedConfig.animationSpeed} onChange={(animationSpeed) => updateSelectedTerrain({ animationSpeed })} />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button variant="secondary" size="sm" onClick={resetSelectedTerrain}>Reset Terrain</Button>
                  <Button variant="ghost" size="sm" onClick={resetAllTerrains}>Reset All</Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass">
            <Card.Header title="Global Controls" />
            <Card.Body>
              <div style={GLOBAL_CONTROL_STYLES}>
                <SliderField label="Global seed" min={1} max={512} step={1} value={seed} onChange={(next) => setSeed(Math.round(next))} />
                <SliderField label="Time scale" min={0} max={2} step={0.05} value={globalTimeScale} onChange={(next) => setGlobalTimeScale(clamp(next, 0, 2))} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={animationEnabled}
                    onChange={(event) => setAnimationEnabled(event.target.checked)}
                  />
                  Animate preview
                </label>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass">
            <Card.Header title="Camera" />
            <Card.Body>
              <div style={GLOBAL_CONTROL_STYLES}>
                <SliderField
                  label="Tilt"
                  min={TERRAIN_TEXTURE_LAB_CONSTANTS.MIN_CAMERA_TILT_DEGREES}
                  max={TERRAIN_TEXTURE_LAB_CONSTANTS.MAX_CAMERA_TILT_DEGREES}
                  step={1}
                  value={viewSettings.tiltDegrees}
                  onChange={(tiltDegrees) => updateViewSettings({ tiltDegrees: Math.round(tiltDegrees) })}
                />
                <SliderField
                  label="Bearing"
                  min={TERRAIN_TEXTURE_LAB_CONSTANTS.MIN_CAMERA_ROTATION_DEGREES}
                  max={TERRAIN_TEXTURE_LAB_CONSTANTS.MAX_CAMERA_ROTATION_DEGREES}
                  step={1}
                  value={viewSettings.rotationDegrees}
                  onChange={(rotationDegrees) => updateViewSettings({ rotationDegrees: Math.round(rotationDegrees) })}
                />
                <SliderField
                  label="Zoom"
                  min={TERRAIN_TEXTURE_LAB_CONSTANTS.MIN_CAMERA_ZOOM}
                  max={TERRAIN_TEXTURE_LAB_CONSTANTS.MAX_CAMERA_ZOOM}
                  step={0.01}
                  value={viewSettings.zoom}
                  onChange={(zoom) => updateViewSettings({
                    zoom: clamp(
                      zoom,
                      TERRAIN_TEXTURE_LAB_CONSTANTS.MIN_CAMERA_ZOOM,
                      TERRAIN_TEXTURE_LAB_CONSTANTS.MAX_CAMERA_ZOOM,
                    ),
                  })}
                />
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                  Tilt changes the camera angle without touching the real hex renderer. Bearing rotates the view across the flat-top grid.
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass">
            <Card.Header title="Export & Notes" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="sm" onClick={handleCopyJson}>Copy JSON</Button>
                  <span style={{ alignSelf: 'center', color: copyState === 'failed' ? 'var(--negative)' : 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    {copyState === 'copied' && 'Copied current presets'}
                    {copyState === 'failed' && 'Clipboard write failed'}
                    {copyState === 'idle' && 'Autosaves to localStorage in this browser'}
                  </span>
                </div>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(34,34,40,0.75)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Pattern ideas in this lab:</strong>
                  <div>fBM layering for soft ground variation, ridged noise for rock, cellular breakup for canopy and marsh pools, and banded sine fields for dunes and ripples.</div>
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: '220px',
                    overflow: 'auto',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(10,10,14,0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: 1.4,
                  }}
                >
                  {serializedConfigs}
                </pre>
              </div>
            </Card.Body>
          </Card>
        </div>
      </aside>

      <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: 'var(--panel-padding)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Hex Preview Map</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Multiple sample hexes share the same terrain presets so repetition and breakup are easier to judge.
            </p>
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            `?view=terrain-lab`
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <TerrainTextureLabCanvas
            configs={configs}
            previewHexes={TERRAIN_TEXTURE_PREVIEW_HEXES}
            seed={seed}
            animationEnabled={animationEnabled}
            globalTimeScale={globalTimeScale}
            viewSettings={viewSettings}
          />
        </div>
      </main>
    </div>
  );
}
