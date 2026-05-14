import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';
import { Button } from '../../shared/Button';
import { Card } from '../../shared/Card';
import { TerrainTextureLabCanvas } from './TerrainTextureLabCanvas';
import {
  getDefaultTerrainTextureLabConfigs,
  getDefaultTerrainTextureLabViewSettings,
  getDefaultTerrainTextureLabVignetteSettings,
  getRecipeOption,
  LAB_TERRAIN_ORDER,
  parseTerrainTextureLabConfigs,
  parseTerrainTextureLabViewSettings,
  parseTerrainTextureLabVignetteSettings,
  serializeTerrainTextureLabConfigs,
  serializeTerrainTextureLabViewSettings,
  serializeTerrainTextureLabVignetteSettings,
  TERRAIN_TEXTURE_LAB_BUILTIN_MODELS,
  TERRAIN_RECIPE_OPTIONS,
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_STORAGE_KEY,
  TERRAIN_TEXTURE_PREVIEW_HEXES,
  TERRAIN_TEXTURE_LAB_VIGNETTE_STORAGE_KEY,
  TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY,
  type LabTerrainKey,
  type TerrainTextureLabModelDefinition,
  type TerrainTextureLabModelPlacement,
  type TerrainTextureLabConfig,
  type TerrainTextureLabViewSettings,
  type TerrainTextureLabVignetteSettings,
} from './terrainTextureLabPresets';
import { buildTerrainTextureLabVignettePrototype } from './terrainTextureLabVignettePrototype';
import type { TerrainTextureLabVignetteZoneRule } from './terrainTextureLabVignettePrototype';
import { resolveAllHexFiller } from './vignette/VignetteResolver';
import type { ResolvedHexFiller } from './vignette/VignetteResolver';
import { FILLER_PROFILE_TERRAIN_TYPES } from './vignette/FillerProfiles';
import { VignetteDebugOverlay } from './vignette/VignetteDebugOverlay';
import { getTerrainTextureLabHexCenter } from './terrainTextureLabLayout';

const GLOBAL_CONTROL_STYLES: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const SIDEBAR_CARD_STYLE: CSSProperties = {
  flexShrink: 0,
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

function createClientId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value.toFixed(2)}
          onChange={(event) => {
            const n = Number(event.target.value);
            if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          style={{
            width: '70px',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-xs)',
            textAlign: 'right',
            padding: '2px 6px',
          }}
        />
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
  const fileUrlsRef = useRef<string[]>([]);
  const [configs, setConfigs] = useState<Record<LabTerrainKey, TerrainTextureLabConfig>>(() => {
    if (typeof window === 'undefined') return getDefaultTerrainTextureLabConfigs();
    const saved = window.localStorage.getItem(TERRAIN_TEXTURE_LAB_STORAGE_KEY);
    if (!saved) return getDefaultTerrainTextureLabConfigs();
    return parseTerrainTextureLabConfigs(saved) ?? getDefaultTerrainTextureLabConfigs();
  });
  const [selectedTerrain, setSelectedTerrain] = useState<LabTerrainKey>('grassland');
  const [models, setModels] = useState<TerrainTextureLabModelDefinition[]>(() => [...TERRAIN_TEXTURE_LAB_BUILTIN_MODELS]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(TERRAIN_TEXTURE_LAB_BUILTIN_MODELS[0]?.id ?? null);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(TERRAIN_TEXTURE_PREVIEW_HEXES[0]?.id ?? null);
  const [placements, setPlacements] = useState<TerrainTextureLabModelPlacement[]>([]);
  const [seed, setSeed] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_SEED);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [globalTimeScale, setGlobalTimeScale] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_TIME_SCALE);
  const [viewSettings, setViewSettings] = useState<TerrainTextureLabViewSettings>(() => {
    if (typeof window === 'undefined') return getDefaultTerrainTextureLabViewSettings();
    const saved = window.localStorage.getItem(TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY);
    if (!saved) return getDefaultTerrainTextureLabViewSettings();
    return parseTerrainTextureLabViewSettings(saved) ?? getDefaultTerrainTextureLabViewSettings();
  });
  const [vignetteSettings, setVignetteSettings] = useState<TerrainTextureLabVignetteSettings>(() => {
    if (typeof window === 'undefined') return getDefaultTerrainTextureLabVignetteSettings();
    const saved = window.localStorage.getItem(TERRAIN_TEXTURE_LAB_VIGNETTE_STORAGE_KEY);
    if (!saved) return getDefaultTerrainTextureLabVignetteSettings();
    return parseTerrainTextureLabVignetteSettings(saved) ?? getDefaultTerrainTextureLabVignetteSettings();
  });
  const [modelUrlDraft, setModelUrlDraft] = useState('/models/city.glb');
  const [placeOnHexClick, setPlaceOnHexClick] = useState(true);
  const [placementScale, setPlacementScale] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_SCALE);
  const [placementHeightOffset, setPlacementHeightOffset] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_HEIGHT_OFFSET);
  const [placementRotationDegrees, setPlacementRotationDegrees] = useState(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_ROTATION_DEGREES);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [selectedClickTargetId, setSelectedClickTargetId] = useState<string | null>(null);
  const [landmarkBatchCount, setLandmarkBatchCount] = useState(0);
  const [showClickTargetSpheres, setShowClickTargetSpheres] = useState(false);
  const [contextRestoreKey, setContextRestoreKey] = useState(0);
  const [lodTier, setLodTier] = useState('regional');
  const [priorityCapEnabled, setPriorityCapEnabled] = useState(false);
  const forceLossHandlerRef = useRef<{ forceLoss: () => void } | null>(null);

  const selectedConfig = configs[selectedTerrain];
  const selectedRecipe = getRecipeOption(selectedConfig.recipe);
  const selectedModel = selectedModelId ? models.find(model => model.id === selectedModelId) ?? null : null;
  const selectedHex = selectedHexId ? TERRAIN_TEXTURE_PREVIEW_HEXES.find(hex => hex.id === selectedHexId) ?? null : null;
  const serializedConfigs = useMemo(() => serializeTerrainTextureLabConfigs(configs), [configs]);
  const serializedViewSettings = useMemo(() => serializeTerrainTextureLabViewSettings(viewSettings), [viewSettings]);
  const serializedVignetteSettings = useMemo(() => serializeTerrainTextureLabVignetteSettings(vignetteSettings), [vignetteSettings]);
  const vignettePrototype = useMemo(() => buildTerrainTextureLabVignettePrototype(
    TERRAIN_TEXTURE_PREVIEW_HEXES,
    models,
    vignetteSettings,
    seed,
    selectedHexId,
  ), [models, vignetteSettings, seed, selectedHexId]);
  const combinedPlacements = useMemo(
    () => [...vignettePrototype.autoPlacements, ...placements],
    [placements, vignettePrototype.autoPlacements],
  );

  const fillerSpec = useMemo<ResolvedHexFiller[]>(() => {
    const fillerHexes = TERRAIN_TEXTURE_PREVIEW_HEXES.filter(hex =>
      FILLER_PROFILE_TERRAIN_TYPES.has(hex.terrainKey),
    );
    const scopedHexIds = new Set(vignettePrototype.zoneRules.map(z => z.hexId));
    const extraZones: TerrainTextureLabVignetteZoneRule[] = fillerHexes
      .filter(hex => !scopedHexIds.has(hex.id))
      .map(hex => {
        const center = getTerrainTextureLabHexCenter(hex.col, hex.row);
        return {
          id: `${hex.id}-zone-center-default`,
          hexId: hex.id,
          slot: 'CENTER' as const,
          mode: 'hard_keepout' as const,
          center,
          radius: TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.ZONE_RADIUS_CENTER_FRACTION,
        };
      });
    const allZoneRules = [...vignettePrototype.zoneRules, ...extraZones];
    return resolveAllHexFiller(fillerHexes, allZoneRules, seed, vignetteSettings.densityScale);
  }, [vignettePrototype.zoneRules, seed, vignetteSettings.densityScale]);
  const fillerInstanceCount = useMemo(
    () => fillerSpec.reduce((acc, h) => acc + h.instances.length, 0),
    [fillerSpec],
  );
  const selectedClickTarget = selectedClickTargetId
    ? vignettePrototype.clickTargets.find(target => target.id === selectedClickTargetId) ?? null
    : null;
  const vignetteLandmarkModels = useMemo(
    () => models.filter(model => !/tree|vignette/i.test(model.id) && !/tree|vignette/i.test(model.label)),
    [models],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TERRAIN_TEXTURE_LAB_STORAGE_KEY, serializedConfigs);
  }, [serializedConfigs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY, serializedViewSettings);
  }, [serializedViewSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TERRAIN_TEXTURE_LAB_VIGNETTE_STORAGE_KEY, serializedVignetteSettings);
  }, [serializedVignetteSettings]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timeout = window.setTimeout(() => setCopyState('idle'), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => {
    if (!selectedModel) return;
    setPlacementScale(selectedModel.suggestedScale);
    setPlacementHeightOffset(selectedModel.suggestedHeightOffset);
    setPlacementRotationDegrees(selectedModel.suggestedRotationDegrees);
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedClickTargetId) return;
    if (vignettePrototype.clickTargets.some(target => target.id === selectedClickTargetId)) return;
    setSelectedClickTargetId(null);
  }, [selectedClickTargetId, vignettePrototype.clickTargets]);

  useEffect(() => {
    return () => {
      for (const url of fileUrlsRef.current) URL.revokeObjectURL(url);
      fileUrlsRef.current = [];
    };
  }, []);

  // ── Console API: window.__TERRAIN_LAB ──
  useEffect(() => {
    const api = {
      /** List available hex IDs for placement */
      hexes: () => TERRAIN_TEXTURE_PREVIEW_HEXES.map(h => `${h.id} (${h.terrainKey})`),

      /** List available model IDs */
      models: () => models.map(m => `${m.id} — ${m.label}`),

      /** Place a model on a hex. Usage: place('forest-city-vignette', 'forest-a', {scale: 15}) */
      place: (modelIdFragment: string, hexId: string, opts?: { scale?: number; z?: number; yaw?: number }) => {
        const model = models.find(m => m.id.includes(modelIdFragment));
        if (!model) return `Model not found. Available: ${models.map(m => m.id).join(', ')}`;
        const hex = TERRAIN_TEXTURE_PREVIEW_HEXES.find(h => h.id === hexId);
        if (!hex) return `Hex not found. Available: ${TERRAIN_TEXTURE_PREVIEW_HEXES.map(h => h.id).join(', ')}`;
        const placement: TerrainTextureLabModelPlacement = {
          id: createClientId('placement'),
          modelId: model.id,
          hexId,
          scale: opts?.scale ?? model.suggestedScale,
          heightOffset: opts?.z ?? model.suggestedHeightOffset,
          rotationDegrees: opts?.yaw ?? model.suggestedRotationDegrees,
        };
        setPlacements(prev => [...prev, placement]);
        return `Placed ${model.label} on ${hexId} (scale ${placement.scale}, z ${placement.heightOffset}, yaw ${placement.rotationDegrees})`;
      },

      /** Clear all placements */
      clear: () => { setPlacements([]); return 'All placements cleared'; },

      /** Set camera. Usage: camera({tilt: 45, bearing: -30, zoom: 3}) */
      camera: (opts: { tilt?: number; bearing?: number; zoom?: number }) => {
        setViewSettings(prev => ({
          tiltDegrees: opts.tilt ?? prev.tiltDegrees,
          rotationDegrees: opts.bearing ?? prev.rotationDegrees,
          zoom: opts.zoom ?? prev.zoom,
        }));
        return `Camera updated`;
      },

      /** Toggle the procedural vignette prototype */
      prototype: (enabled?: boolean) => {
        const nextEnabled = enabled ?? !vignetteSettings.enabled;
        setVignetteSettings(prev => ({ ...prev, enabled: nextEnabled }));
        return `Vignette prototype ${nextEnabled ? 'enabled' : 'disabled'}`;
      },

      /** Set vignette scope: selected_forest | all_forests | selected_mountain | all_mountains */
      prototypeScope: (scope: TerrainTextureLabVignetteSettings['scope']) => {
        const validScopes = ['selected_forest', 'all_forests', 'selected_mountain', 'all_mountains'];
        if (!validScopes.includes(scope)) {
          return `Scope must be one of: ${validScopes.join(', ')}`;
        }
        setVignetteSettings(prev => ({ ...prev, scope }));
        return `Vignette scope set to ${scope}`;
      },

      /** Summary of the generated prototype vignette */
      prototypeSummary: () => vignettePrototype.summary,

      /** Quick vignette: clears + places forest-city on a forest hex */
      forestVignette: (hexId?: string, scale?: number) => {
        const targetHex = hexId ?? 'forest-a';
        setPlacements([]);
        setTimeout(() => {
          api.place('forest-city-vignette', targetHex, { scale: scale ?? 15.6 });
        }, 50);
        return `Forest vignette placed on ${targetHex}`;
      },

      /** List current placements */
      placements: () => placements.map(p => {
        const model = models.find(m => m.id === p.modelId);
        return `${model?.label ?? p.modelId} → ${p.hexId} (scale ${p.scale}, z ${p.heightOffset}, yaw ${p.rotationDegrees})`;
      }),

      /** Select a terrain preset for editing */
      selectTerrain: (key: string) => {
        const valid = LAB_TERRAIN_ORDER.includes(key as LabTerrainKey);
        if (!valid) return `Invalid. Options: ${LAB_TERRAIN_ORDER.join(', ')}`;
        setSelectedTerrain(key as LabTerrainKey);
        return `Selected ${key}`;
      },

      /** Programmatically select a landmark by its click-target id */
      selectLandmark: (id: string) => {
        const target = vignettePrototype.clickTargets.find(t => t.id === id);
        if (!target) return `Landmark not found: ${id}`;
        setSelectedClickTargetId(id);
        setSelectedHexId(target.hexId);
        return `Selected landmark ${id} on hex ${target.hexId}`;
      },

      /** Pan to the hex containing the landmark */
      gotoLandmark: (id: string) => {
        const target = vignettePrototype.clickTargets.find(t => t.id === id);
        if (!target) return `Landmark not found: ${id}`;
        setSelectedHexId(target.hexId);
        return `Moved to hex ${target.hexId}`;
      },

      /** Return current hover/selection state from the canvas selection state object */
      getSelectionState: () => {
        const canvasApi = (window as Record<string, unknown>).__TERRAIN_LAB as Record<string, unknown> | undefined;
        const selState = canvasApi?.selectionState as { getHovered?: () => unknown; getSelected?: () => unknown } | undefined;
        return {
          hovered: selState?.getHovered?.() ?? null,
          selected: selState?.getSelected?.() ?? null,
          selectedClickTargetId,
        };
      },

      /** Clear current hover and selection */
      clearSelection: () => {
        setSelectedClickTargetId(null);
        return 'Selection cleared';
      },

      help: () => [
        '__TERRAIN_LAB commands:',
        '  .hexes()                        — list hex IDs',
        '  .models()                       — list model IDs',
        '  .place(modelId, hexId, {opts})  — place model (scale, z, yaw)',
        '  .clear()                        — clear all placements',
        '  .camera({tilt, bearing, zoom})  — set camera',
        '  .prototype(enabled?)            — toggle slot-aware vignette pass',
        '  .prototypeScope(scope)          — selected_forest | all_forests | selected_mountain | all_mountains',
        '  .prototypeSummary()             — list current auto-vignette counts',
        '  .forestVignette(hexId?, scale?) — quick forest+city vignette',
        '  .placements()                   — list current placements',
        '  .selectTerrain(key)             — select terrain for editing',
        '  .selectLandmark(id)             — select a landmark by click-target id',
        '  .gotoLandmark(id)               — pan to a landmark hex',
        '  .getSelectionState()            — return current hover/selection',
        '  .clearSelection()               — clear landmark selection',
      ].join('\n'),
    };

    (window as Record<string, unknown>).__TERRAIN_LAB = api;
    return () => { delete (window as Record<string, unknown>).__TERRAIN_LAB; };
  });

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

  function updateVignetteSettings(nextPartial: Partial<TerrainTextureLabVignetteSettings>) {
    setVignetteSettings(prev => ({
      ...prev,
      ...nextPartial,
    }));
  }

  function revokeFileUrlIfNeeded(model: TerrainTextureLabModelDefinition) {
    if (model.sourceKind !== 'file') return;
    URL.revokeObjectURL(model.sourceUrl);
    fileUrlsRef.current = fileUrlsRef.current.filter(url => url !== model.sourceUrl);
  }

  function addModelFromUrl() {
    const normalized = modelUrlDraft.trim();
    if (!normalized) return;

    const label = normalized.split('/').pop() || 'Imported URL Model';
    const newModel: TerrainTextureLabModelDefinition = {
      id: createClientId('url-model'),
      label,
      sourceUrl: normalized,
      sourceKind: 'url',
      suggestedScale: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_SCALE,
      suggestedHeightOffset: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_HEIGHT_OFFSET,
      suggestedRotationDegrees: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_ROTATION_DEGREES,
    };

    setModels(prev => [...prev, newModel]);
    setSelectedModelId(newModel.id);
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    fileUrlsRef.current.push(objectUrl);

    const newModel: TerrainTextureLabModelDefinition = {
      id: createClientId('file-model'),
      label: file.name,
      sourceUrl: objectUrl,
      sourceKind: 'file',
      suggestedScale: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_SCALE,
      suggestedHeightOffset: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_HEIGHT_OFFSET,
      suggestedRotationDegrees: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_ROTATION_DEGREES,
    };

    setModels(prev => [...prev, newModel]);
    setSelectedModelId(newModel.id);
    event.target.value = '';
  }

  function removeModel(modelId: string) {
    const model = models.find(entry => entry.id === modelId);
    if (!model || model.sourceKind === 'builtin') return;

    revokeFileUrlIfNeeded(model);
    setModels(prev => prev.filter(entry => entry.id !== modelId));
    setPlacements(prev => prev.filter(placement => placement.modelId !== modelId));
    if (selectedModelId === modelId) {
      setSelectedModelId(TERRAIN_TEXTURE_LAB_BUILTIN_MODELS[0]?.id ?? null);
    }
  }

  function placeSelectedModelOnHex(hexId: string) {
    if (!selectedModelId) return;
    setPlacements(prev => [
      ...prev,
      {
        id: createClientId('placement'),
        modelId: selectedModelId,
        hexId,
        scale: placementScale,
        heightOffset: placementHeightOffset,
        rotationDegrees: placementRotationDegrees,
      },
    ]);
  }

  function handleHexSelect(hexId: string) {
    setSelectedClickTargetId(null);
    setSelectedHexId(hexId);
    if (placeOnHexClick && selectedModelId) placeSelectedModelOnHex(hexId);
  }

  function handleLandmarkSelect(targetId: string, hexId: string) {
    setSelectedClickTargetId(targetId || null);
    if (hexId) setSelectedHexId(hexId);
  }

  function clearPlacements() {
    setPlacements([]);
  }

  function removePlacement(placementId: string) {
    setPlacements(prev => prev.filter(placement => placement.id !== placementId));
  }

  function resetSelectedTerrain() {
    const defaults = getDefaultTerrainTextureLabConfigs();
    setConfigs(prev => ({
      ...prev,
      [selectedTerrain]: defaults[selectedTerrain],
    }));
  }

  function resetAllTerrains() {
    for (const model of models) {
      if (model.sourceKind === 'file') revokeFileUrlIfNeeded(model);
    }
    setConfigs(getDefaultTerrainTextureLabConfigs());
    setModels([...TERRAIN_TEXTURE_LAB_BUILTIN_MODELS]);
    setSelectedModelId(TERRAIN_TEXTURE_LAB_BUILTIN_MODELS[0]?.id ?? null);
    setSelectedHexId(TERRAIN_TEXTURE_PREVIEW_HEXES[0]?.id ?? null);
    setPlacements([]);
    setSeed(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_SEED);
    setGlobalTimeScale(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_TIME_SCALE);
    setAnimationEnabled(true);
    setViewSettings(getDefaultTerrainTextureLabViewSettings());
    setVignetteSettings(getDefaultTerrainTextureLabVignetteSettings());
    setModelUrlDraft('/models/city.glb');
    setPlaceOnHexClick(true);
    setPlacementScale(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_SCALE);
    setPlacementHeightOffset(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_HEIGHT_OFFSET);
    setPlacementRotationDegrees(TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_MODEL_ROTATION_DEGREES);
    setSelectedClickTargetId(null);
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
        minHeight: 0,
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
          minHeight: 0,
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
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            scrollbarGutter: 'stable',
            padding: 'var(--panel-padding)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
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

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
            <Card.Header title="Selected Terrain" />
            <Card.Body>
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

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={viewSettings.useImageTextures}
                    onChange={(event) => updateViewSettings({ useImageTextures: event.target.checked })}
                  />
                  Use Meshy image textures
                </label>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
            <Card.Header title="Vignette Prototype" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                  Slot-aware forest vignette pass: center landmark, soft-filled empty ring slots, and dense free-fill forest scatter. Manual placements still work on top.
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={vignetteSettings.enabled}
                    onChange={(event) => updateVignetteSettings({ enabled: event.target.checked })}
                  />
                  Enable forest vignette prototype
                </label>

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Scope</span>
                  <select
                    value={vignetteSettings.scope}
                    onChange={(event) => updateVignetteSettings({ scope: event.target.value as TerrainTextureLabVignetteSettings['scope'] })}
                    style={{
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-raised)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="selected_forest">Selected forest only</option>
                    <option value="all_forests">All forest sample hexes</option>
                    <option value="selected_mountain">Selected mountain only</option>
                    <option value="all_mountains">All mountain sample hexes</option>
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Landmark model</span>
                  <select
                    value={vignetteSettings.landmarkModelId}
                    onChange={(event) => updateVignetteSettings({ landmarkModelId: event.target.value })}
                    style={{
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-raised)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {vignetteLandmarkModels.map((model) => (
                      <option key={model.id} value={model.id}>{model.label}</option>
                    ))}
                  </select>
                </label>

                <SliderField
                  label="Density scale"
                  min={TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.MIN_DENSITY_SCALE}
                  max={TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.MAX_DENSITY_SCALE}
                  step={0.05}
                  value={vignetteSettings.densityScale}
                  onChange={(densityScale) => updateVignetteSettings({ densityScale })}
                />

                <div style={{ display: 'grid', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={vignetteSettings.showSlotAnchors}
                      onChange={(event) => updateVignetteSettings({ showSlotAnchors: event.target.checked })}
                    />
                    Show slot anchors
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={vignetteSettings.showZones}
                      onChange={(event) => updateVignetteSettings({ showZones: event.target.checked })}
                    />
                    Show zone rings
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={vignetteSettings.showFillerDots}
                      onChange={(event) => updateVignetteSettings({ showFillerDots: event.target.checked })}
                    />
                    Show filler dots
                  </label>
                </div>

                <VignetteDebugOverlay
                  showChunkBounds={vignetteSettings.showChunkBounds}
                  showLandmarkBounds={vignetteSettings.showLandmarkBounds}
                  showClickTargetSpheres={showClickTargetSpheres}
                  densityScale={vignetteSettings.densityScale}
                  fillerInstanceCount={fillerInstanceCount}
                  landmarkInstanceCount={combinedPlacements.length}
                  landmarkBatchCount={landmarkBatchCount}
                  lodTier={lodTier}
                  priorityCapEnabled={priorityCapEnabled}
                  onShowChunkBoundsChange={(showChunkBounds) => updateVignetteSettings({ showChunkBounds })}
                  onShowLandmarkBoundsChange={(showLandmarkBounds) => updateVignetteSettings({ showLandmarkBounds })}
                  onShowClickTargetSpheresChange={setShowClickTargetSpheres}
                  onDensityScaleChange={(densityScale) => updateVignetteSettings({ densityScale })}
                  onForceLoss={() => forceLossHandlerRef.current?.forceLoss()}
                  onPriorityCapChange={setPriorityCapEnabled}
                />

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(16,16,20,0.55)',
                    display: 'grid',
                    gap: '4px',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.5,
                  }}
                >
                  <div><strong style={{ color: 'var(--text-primary)' }}>Active scope:</strong> {vignettePrototype.summary.scopeLabel}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Target hexes:</strong> {vignettePrototype.summary.targetHexIds.join(', ') || 'none'}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Auto placements:</strong> {vignettePrototype.summary.autoPlacementCount}</div>
                  <div><strong style={{ color: 'var(--text-primary)' }}>Filler dots:</strong> {vignettePrototype.summary.fillerPlacementCount}</div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'rgba(10,10,14,0.8)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.5,
                  }}
                >
                  {selectedClickTarget ? (
                    <>
                      <strong style={{ color: 'var(--text-primary)' }}>Selected landmark:</strong> {selectedClickTarget.label}
                      <div>Hex {selectedClickTarget.hexId} · slot {selectedClickTarget.slot} · click radius {selectedClickTarget.radiusPx}px</div>
                    </>
                  ) : (
                    <>Click the generated village on the preview map to inspect the landmark target.</>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
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

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
            <Card.Header title="Model Import" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                  Blender MCP workflow: export a `.glb` into `public/models/`, then paste the URL here like `/models/my-fortress.glb`. For quick experiments, you can also pick a local `.glb` file directly.
                </div>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Model URL</span>
                  <input
                    type="text"
                    value={modelUrlDraft}
                    onChange={(event) => setModelUrlDraft(event.target.value)}
                    placeholder="/models/my-model.glb"
                    style={{
                      height: '38px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-raised)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button variant="secondary" size="sm" onClick={addModelFromUrl}>Add URL Model</Button>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '32px',
                      padding: '0 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="file"
                      accept=".glb,model/gltf-binary"
                      onChange={handleFileImport}
                      style={{ display: 'none' }}
                    />
                    Pick Local .glb
                  </label>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {models.map((model) => {
                    const isActive = model.id === selectedModelId;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModelId(model.id)}
                        className="interactive-row"
                        style={{
                          display: 'grid',
                          gap: '4px',
                          width: '100%',
                          backgroundColor: isActive ? 'rgba(212, 160, 64, 0.12)' : 'transparent',
                          borderColor: isActive ? 'var(--border-gold-strong)' : 'transparent',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{model.label}</strong>
                          {model.sourceKind !== 'builtin' && (
                            <span
                              onClick={(event) => {
                                event.stopPropagation();
                                removeModel(model.id);
                              }}
                              style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}
                            >
                              remove
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{model.sourceUrl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
            <Card.Header title="Model Placement" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                  {selectedHex ? `Selected hex: ${selectedHex.id} (${selectedHex.terrainKey})` : 'No hex selected yet.'}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={placeOnHexClick}
                    onChange={(event) => setPlaceOnHexClick(event.target.checked)}
                  />
                  Click preview hexes to place selected model
                </label>
                <SliderField
                  label="Model scale"
                  min={0.2}
                  max={50}
                  step={0.05}
                  value={placementScale}
                  onChange={(next) => setPlacementScale(next)}
                />
                <SliderField
                  label="Height offset"
                  min={-8}
                  max={24}
                  step={0.25}
                  value={placementHeightOffset}
                  onChange={(next) => setPlacementHeightOffset(next)}
                />
                <SliderField
                  label="Yaw"
                  min={-180}
                  max={180}
                  step={1}
                  value={placementRotationDegrees}
                  onChange={(next) => setPlacementRotationDegrees(Math.round(next))}
                />
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => selectedHexId && placeSelectedModelOnHex(selectedHexId)}
                    disabled={!selectedModelId || !selectedHexId}
                  >
                    Place On Selected Hex
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearPlacements} disabled={placements.length === 0}>
                    Clear Placements
                  </Button>
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {placements.length === 0 ? (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                      No placed models yet. Pick a model and click a hex in the preview.
                    </div>
                  ) : (
                    placements.map((placement) => {
                      const model = models.find(entry => entry.id === placement.modelId);
                      return (
                        <div
                          key={placement.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'rgba(16,16,20,0.55)',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                              {model?.label ?? placement.modelId}
                            </strong>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                              {placement.hexId} · scale {placement.scale.toFixed(2)} · z {placement.heightOffset.toFixed(2)} · yaw {placement.rotationDegrees}°
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removePlacement(placement.id)}>
                            Remove
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card variant="glass" style={SIDEBAR_CARD_STYLE}>
            <Card.Header title="Export & Notes" />
            <Card.Body>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="sm" onClick={handleCopyJson}>Copy JSON</Button>
                  <span style={{ alignSelf: 'center', color: copyState === 'failed' ? 'var(--negative)' : 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    {copyState === 'copied' && 'Copied current presets'}
                    {copyState === 'failed' && 'Clipboard write failed'}
                    {copyState === 'idle' && 'Autosaves terrain presets, camera settings, and vignette controls to localStorage in this browser'}
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
                    fontSize: 'var(--text-sm)',
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
            key={contextRestoreKey}
            configs={configs}
            previewHexes={TERRAIN_TEXTURE_PREVIEW_HEXES}
            models={models}
            placements={combinedPlacements}
            slotAnchors={vignetteSettings.showSlotAnchors ? vignettePrototype.slotAnchors : []}
            zoneRules={vignetteSettings.showZones ? vignettePrototype.zoneRules : []}
            fillerDots={vignetteSettings.showFillerDots ? vignettePrototype.fillerDots : []}
            clickTargets={vignettePrototype.clickTargets}
            fillerSpec={fillerSpec}
            showChunkBounds={vignetteSettings.showChunkBounds}
            showLandmarkBounds={vignetteSettings.showLandmarkBounds}
            showClickTargetSpheres={showClickTargetSpheres}
            selectedHexId={selectedHexId}
            selectedClickTargetId={selectedClickTargetId}
            seed={seed}
            animationEnabled={animationEnabled}
            globalTimeScale={globalTimeScale}
            viewSettings={viewSettings}
            onHexSelect={handleHexSelect}
            onLandmarkSelect={handleLandmarkSelect}
            onLandmarkLayerBuilt={setLandmarkBatchCount}
            onZoom={(delta) => setViewSettings(prev => ({
              ...prev,
              zoom: clamp(
                prev.zoom + delta,
                TERRAIN_TEXTURE_LAB_CONSTANTS.MIN_CAMERA_ZOOM,
                TERRAIN_TEXTURE_LAB_CONSTANTS.MAX_CAMERA_ZOOM,
              ),
            }))}
            priorityCapEnabled={priorityCapEnabled}
            onContextLost={() => { /* canvas will remount on restore */ }}
            onContextRestored={() => setContextRestoreKey(k => k + 1)}
            onContextLossHandlerReady={(handler) => { forceLossHandlerRef.current = handler; }}
            onLodTierChange={setLodTier}
          />
        </div>
      </main>
    </div>
  );
}
