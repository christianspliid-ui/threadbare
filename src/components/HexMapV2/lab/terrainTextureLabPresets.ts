import { TERRAIN_PALETTE } from '../palette/terrainPalette';

export const TERRAIN_TEXTURE_LAB_STORAGE_KEY = 'terrain-texture-lab.v1';
export const TERRAIN_TEXTURE_LAB_VIEW_STORAGE_KEY = 'terrain-texture-lab.view.v1';
export const TERRAIN_TEXTURE_LAB_VIGNETTE_STORAGE_KEY = 'terrain-texture-lab.vignette.v1';

export const TERRAIN_TEXTURE_LAB_CONSTANTS = {
  HEX_RADIUS: 78,
  PANEL_WIDTH: 380,
  PIXEL_RATIO_CAP: 2,
  DEFAULT_SEED: 42,
  DEFAULT_TIME_SCALE: 1,
  MODEL_LAYER_Z: 2,
  MODEL_TARGET_FOOTPRINT_RADIUS: 48,
  DEFAULT_MODEL_SCALE: 1,
  DEFAULT_MODEL_HEIGHT_OFFSET: 0,
  DEFAULT_MODEL_ROTATION_DEGREES: 0,
  CAMERA_FOV_DEGREES: 38,
  CAMERA_FIT_MARGIN: 1.35,
  MIN_CAMERA_TILT_DEGREES: 0,
  MAX_CAMERA_TILT_DEGREES: 78,
  DEFAULT_CAMERA_TILT_DEGREES: 42,
  MIN_CAMERA_ROTATION_DEGREES: -180,
  MAX_CAMERA_ROTATION_DEGREES: 180,
  DEFAULT_CAMERA_ROTATION_DEGREES: -32,
  MIN_CAMERA_ZOOM: 0.75,
  MAX_CAMERA_ZOOM: 20,
  DEFAULT_CAMERA_ZOOM: 1,
} as const;

export const TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS = {
  SLOT_RING_RADIUS_FRACTION: 0.44,
  ZONE_RADIUS_CENTER_FRACTION: 0.2,
  ZONE_RADIUS_RING_FRACTION: 0.14,
  FOREST_FREE_DENSITY_PER_HEX: 110,
  FOREST_SOFT_DENSITY_PER_HEX: 28,
  FOREST_FREE_MIN_SPACING_FRACTION: 0.11,
  FOREST_SOFT_MIN_SPACING_FRACTION: 0.14,
  FOREST_FREE_SCALE_MIN: 5.8,
  FOREST_FREE_SCALE_MAX: 8.1,
  FOREST_SOFT_SCALE_MIN: 3.8,
  FOREST_SOFT_SCALE_MAX: 5.4,
  DEFAULT_DENSITY_SCALE: 1,
  MIN_DENSITY_SCALE: 0.25,
  MAX_DENSITY_SCALE: 1.6,
  DEFAULT_LANDMARK_MODEL_ID: 'builtin-village',
  LANDMARK_CLICK_RADIUS_PX: 28,
  MOUNTAIN_FREE_DENSITY_PER_HEX: 45,
  MOUNTAIN_SOFT_DENSITY_PER_HEX: 12,
  MOUNTAIN_FREE_MIN_SPACING_FRACTION: 0.13,
  MOUNTAIN_SOFT_MIN_SPACING_FRACTION: 0.16,
  MOUNTAIN_FREE_SCALE_MIN: 4.5,
  MOUNTAIN_FREE_SCALE_MAX: 7.5,
  MOUNTAIN_SOFT_SCALE_MIN: 3.0,
  MOUNTAIN_SOFT_SCALE_MAX: 5.0,
  DEFAULT_MOUNTAIN_LANDMARK_MODEL_ID: 'builtin-mountain-temple',
} as const;

export const TERRAIN_RECIPE_OPTIONS = [
  { id: 'grain', label: 'Grain', description: 'Layered fBm for subtle grass, soil, and lowland grain.' },
  { id: 'canopy', label: 'Canopy', description: 'Cellular clumps plus soft noise for forest canopy massing.' },
  { id: 'ridges', label: 'Ridges', description: 'Ridged fBm with striations for rock faces and mountain creases.' },
  { id: 'dunes', label: 'Dunes', description: 'Warped banding for wind-carved sand and dune rhythm.' },
  { id: 'ripples', label: 'Ripples', description: 'Animated wave bands with foam breakup for coasts and shallow water.' },
  { id: 'marsh', label: 'Marsh', description: 'Cell pools and muddy silt breakup for wetlands and bogs.' },
] as const;

export type TerrainRecipeId = typeof TERRAIN_RECIPE_OPTIONS[number]['id'];

export const LAB_TERRAIN_ORDER = [
  'grassland',
  'temperate_forest',
  'mountains',
  'mountain_plateau',
  'sand_dunes',
  'coast',
  'swamp',
] as const;

export type LabTerrainKey = typeof LAB_TERRAIN_ORDER[number];

export interface TerrainTextureLabConfig {
  label: string;
  recipe: TerrainRecipeId;
  description: string;
  baseColor: string;
  highlightColor: string;
  shadowColor: string;
  primaryScale: number;
  detailScale: number;
  warpScale: number;
  warpStrength: number;
  mixAmount: number;
  contrast: number;
  ridgeStrength: number;
  banding: number;
  animationSpeed: number;
}

export interface TerrainTexturePreviewHex {
  id: string;
  terrainKey: LabTerrainKey;
  col: number;
  row: number;
}

export interface TerrainTextureLabViewSettings {
  tiltDegrees: number;
  rotationDegrees: number;
  zoom: number;
}

export type TerrainTextureLabVignetteScope = 'selected_forest' | 'all_forests' | 'selected_mountain' | 'all_mountains';

export interface TerrainTextureLabVignetteSettings {
  enabled: boolean;
  scope: TerrainTextureLabVignetteScope;
  landmarkModelId: string;
  densityScale: number;
  showSlotAnchors: boolean;
  showZones: boolean;
  showFillerDots: boolean;
}

export interface TerrainTextureLabModelDefinition {
  id: string;
  label: string;
  sourceUrl: string;
  sourceKind: 'builtin' | 'url' | 'file';
  suggestedScale: number;
  suggestedHeightOffset: number;
  suggestedRotationDegrees: number;
}

export interface TerrainTextureLabModelPlacement {
  id: string;
  modelId: string;
  hexId: string;
  scale: number;
  heightOffset: number;
  rotationDegrees: number;
  /** Per-placement world position. When absent, falls back to hex center. */
  x?: number;
  y?: number;
}

export const TERRAIN_TEXTURE_PREVIEW_HEXES: TerrainTexturePreviewHex[] = [
  { id: 'grass-a', terrainKey: 'grassland', col: 0, row: 0 },
  { id: 'grass-b', terrainKey: 'grassland', col: 1, row: 0 },
  { id: 'forest-a', terrainKey: 'temperate_forest', col: 2, row: 0 },
  { id: 'forest-b', terrainKey: 'temperate_forest', col: 3, row: 0 },
  { id: 'mountain-a', terrainKey: 'mountains', col: 0, row: 1 },
  { id: 'coast-a', terrainKey: 'coast', col: 1, row: 1 },
  { id: 'coast-b', terrainKey: 'coast', col: 2, row: 1 },
  { id: 'swamp-a', terrainKey: 'swamp', col: 3, row: 1 },
  { id: 'desert-a', terrainKey: 'sand_dunes', col: 0, row: 2 },
  { id: 'desert-b', terrainKey: 'sand_dunes', col: 1, row: 2 },
  { id: 'swamp-b', terrainKey: 'swamp', col: 2, row: 2 },
  { id: 'mountain-b', terrainKey: 'mountains', col: 3, row: 2 },
  { id: 'plateau-a', terrainKey: 'mountain_plateau', col: 0, row: 3 },
  { id: 'plateau-b', terrainKey: 'mountain_plateau', col: 1, row: 3 },
] as const;

export const TERRAIN_TEXTURE_LAB_BUILTIN_MODELS: TerrainTextureLabModelDefinition[] = [
  {
    id: 'builtin-city',
    label: 'City (builtin)',
    sourceUrl: '/models/city.glb',
    sourceKind: 'builtin',
    suggestedScale: 5.4,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-town',
    label: 'Town (builtin)',
    sourceUrl: '/models/town.glb',
    sourceKind: 'builtin',
    suggestedScale: 3.3,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-village',
    label: 'Village (builtin)',
    sourceUrl: '/models/village.glb',
    sourceKind: 'builtin',
    suggestedScale: 2.9,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-forest-city-vignette',
    label: 'Forest City Vignette (builtin)',
    sourceUrl: '/models/forest-city-vignette.glb',
    sourceKind: 'builtin',
    suggestedScale: 15.6,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-deciduous-oak',
    label: 'Oak Tree (builtin)',
    sourceUrl: '/models/deciduous-oak.glb',
    sourceKind: 'builtin',
    suggestedScale: 8,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-deciduous-elm',
    label: 'Elm Tree (builtin)',
    sourceUrl: '/models/deciduous-elm.glb',
    sourceKind: 'builtin',
    suggestedScale: 8,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-deciduous-birch',
    label: 'Birch Tree (builtin)',
    sourceUrl: '/models/deciduous-birch.glb',
    sourceKind: 'builtin',
    suggestedScale: 8,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-mountain-plateau-vignette',
    label: 'Mountain Plateau Vignette (builtin)',
    sourceUrl: '/models/mountain-plateau-vignette.glb',
    sourceKind: 'builtin',
    suggestedScale: 15.6,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-mountain-temple',
    label: 'Mountain Temple (builtin)',
    sourceUrl: '/models/mountain-temple.glb',
    sourceKind: 'builtin',
    suggestedScale: 2.8,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-cairn-stones',
    label: 'Cairn Stones (builtin)',
    sourceUrl: '/models/cairn-stones.glb',
    sourceKind: 'builtin',
    suggestedScale: 6,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
  {
    id: 'builtin-rock-outcrop',
    label: 'Rock Outcrop (builtin)',
    sourceUrl: '/models/rock-outcrop.glb',
    sourceKind: 'builtin',
    suggestedScale: 7,
    suggestedHeightOffset: 0,
    suggestedRotationDegrees: 0,
  },
] as const;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function channelToHex(value: number): string {
  return Math.round(clamp01(value) * 255).toString(16).padStart(2, '0');
}

function normalizeHex(hex: string): string {
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toUpperCase();
  return '#888888';
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  return [
    parseInt(normalized.slice(1, 3), 16) / 255,
    parseInt(normalized.slice(3, 5), 16) / 255,
    parseInt(normalized.slice(5, 7), 16) / 255,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`.toUpperCase();
}

function shiftHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(
      r + (1 - r) * amount,
      g + (1 - g) * amount,
      b + (1 - b) * amount,
    );
  }

  const strength = Math.abs(amount);
  return rgbToHex(
    r * (1 - strength),
    g * (1 - strength),
    b * (1 - strength),
  );
}

function createConfig(
  label: string,
  recipe: TerrainRecipeId,
  description: string,
  baseColor: string,
  overrides: Partial<Omit<TerrainTextureLabConfig, 'label' | 'recipe' | 'description' | 'baseColor' | 'highlightColor' | 'shadowColor'>> = {},
): TerrainTextureLabConfig {
  return {
    label,
    recipe,
    description,
    baseColor,
    highlightColor: shiftHex(baseColor, 0.22),
    shadowColor: shiftHex(baseColor, -0.32),
    primaryScale: 2.4,
    detailScale: 5.8,
    warpScale: 1.2,
    warpStrength: 0.28,
    mixAmount: 0.68,
    contrast: 1.18,
    ridgeStrength: 0.55,
    banding: 0.28,
    animationSpeed: 0.45,
    ...overrides,
  };
}

function validateRecipe(value: unknown): value is TerrainRecipeId {
  return TERRAIN_RECIPE_OPTIONS.some(option => option.id === value);
}

function validateConfig(value: unknown): value is TerrainTextureLabConfig {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<TerrainTextureLabConfig>;
  return typeof candidate.label === 'string'
    && typeof candidate.description === 'string'
    && typeof candidate.baseColor === 'string'
    && typeof candidate.highlightColor === 'string'
    && typeof candidate.shadowColor === 'string'
    && validateRecipe(candidate.recipe)
    && typeof candidate.primaryScale === 'number'
    && typeof candidate.detailScale === 'number'
    && typeof candidate.warpScale === 'number'
    && typeof candidate.warpStrength === 'number'
    && typeof candidate.mixAmount === 'number'
    && typeof candidate.contrast === 'number'
    && typeof candidate.ridgeStrength === 'number'
    && typeof candidate.banding === 'number'
    && typeof candidate.animationSpeed === 'number';
}

export function getDefaultTerrainTextureLabConfigs(): Record<LabTerrainKey, TerrainTextureLabConfig> {
  return {
    grassland: createConfig(
      'Grassland',
      'grain',
      'Subtle lowland grain with soft value shifts and almost no obvious tiling.',
      TERRAIN_PALETTE.grassland,
      {
        primaryScale: 2.1,
        detailScale: 6.8,
        warpScale: 1.0,
        warpStrength: 0.18,
        mixAmount: 0.56,
        contrast: 1.06,
        ridgeStrength: 0.18,
        banding: 0.14,
        animationSpeed: 0.08,
      },
    ),
    temperate_forest: createConfig(
      'Temperate Forest',
      'canopy',
      'Mottled canopy clumps with darker pockets and softened breakup between crowns.',
      TERRAIN_PALETTE.temperate_forest,
      {
        primaryScale: 2.6,
        detailScale: 7.4,
        warpScale: 1.7,
        warpStrength: 0.34,
        mixAmount: 0.72,
        contrast: 1.24,
        ridgeStrength: 0.42,
        banding: 0.12,
        animationSpeed: 0.06,
      },
    ),
    mountains: createConfig(
      'Mountains',
      'ridges',
      'Ridged fractal noise with directional striations to suggest stone faces and scree.',
      TERRAIN_PALETTE.mountains,
      {
        primaryScale: 3.0,
        detailScale: 10.6,
        warpScale: 1.25,
        warpStrength: 0.22,
        mixAmount: 0.82,
        contrast: 1.36,
        ridgeStrength: 0.86,
        banding: 0.44,
        animationSpeed: 0.02,
      },
    ),
    mountain_plateau: createConfig(
      'Mountain Plateau',
      'ridges',
      'Broad grey stone with weathered cracks and subtle lichen breakup.',
      '#787880',
      {
        primaryScale: 2.2,
        detailScale: 8.4,
        warpScale: 1.6,
        warpStrength: 0.3,
        mixAmount: 0.74,
        contrast: 1.18,
        ridgeStrength: 0.62,
        banding: 0.28,
        animationSpeed: 0.01,
      },
    ),
    sand_dunes: createConfig(
      'Sand Dunes',
      'dunes',
      'Band-driven dunes warped by low-frequency noise to keep the flow organic.',
      TERRAIN_PALETTE.sand_dunes,
      {
        primaryScale: 1.8,
        detailScale: 8.8,
        warpScale: 1.4,
        warpStrength: 0.48,
        mixAmount: 0.76,
        contrast: 1.22,
        ridgeStrength: 0.32,
        banding: 0.92,
        animationSpeed: 0.04,
      },
    ),
    coast: createConfig(
      'Coast Water',
      'ripples',
      'Animated wave bands with cellular breakup for foam and shoreline churn.',
      '#5098D0',
      {
        primaryScale: 2.3,
        detailScale: 12.0,
        warpScale: 1.6,
        warpStrength: 0.42,
        mixAmount: 0.74,
        contrast: 1.2,
        ridgeStrength: 0.46,
        banding: 0.86,
        animationSpeed: 0.75,
      },
    ),
    swamp: createConfig(
      'Swamp',
      'marsh',
      'Wetland pools, muddy silt, and patchy dark water gathered into soft cells.',
      TERRAIN_PALETTE.swamp,
      {
        primaryScale: 2.0,
        detailScale: 7.8,
        warpScale: 1.8,
        warpStrength: 0.52,
        mixAmount: 0.8,
        contrast: 1.18,
        ridgeStrength: 0.38,
        banding: 0.3,
        animationSpeed: 0.18,
      },
    ),
  };
}

export function serializeTerrainTextureLabConfigs(configs: Record<LabTerrainKey, TerrainTextureLabConfig>): string {
  return JSON.stringify(configs, null, 2);
}

export function getDefaultTerrainTextureLabViewSettings(): TerrainTextureLabViewSettings {
  return {
    tiltDegrees: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_CAMERA_TILT_DEGREES,
    rotationDegrees: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_CAMERA_ROTATION_DEGREES,
    zoom: TERRAIN_TEXTURE_LAB_CONSTANTS.DEFAULT_CAMERA_ZOOM,
  };
}

export function serializeTerrainTextureLabViewSettings(settings: TerrainTextureLabViewSettings): string {
  return JSON.stringify(settings);
}

export function getDefaultTerrainTextureLabVignetteSettings(): TerrainTextureLabVignetteSettings {
  return {
    enabled: true,
    scope: 'selected_forest',
    landmarkModelId: TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.DEFAULT_LANDMARK_MODEL_ID,
    densityScale: TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.DEFAULT_DENSITY_SCALE,
    showSlotAnchors: true,
    showZones: false,
    showFillerDots: false,
  };
}

export function serializeTerrainTextureLabVignetteSettings(settings: TerrainTextureLabVignetteSettings): string {
  return JSON.stringify(settings);
}

export function parseTerrainTextureLabConfigs(raw: string): Record<LabTerrainKey, TerrainTextureLabConfig> | null {
  try {
    const parsed = JSON.parse(raw) as Partial<Record<LabTerrainKey, TerrainTextureLabConfig>>;
    const next = {} as Record<LabTerrainKey, TerrainTextureLabConfig>;

    for (const key of LAB_TERRAIN_ORDER) {
      const config = parsed[key];
      if (!validateConfig(config)) return null;
      next[key] = {
        ...config,
        baseColor: normalizeHex(config.baseColor),
        highlightColor: normalizeHex(config.highlightColor),
        shadowColor: normalizeHex(config.shadowColor),
      };
    }

    return next;
  } catch {
    return null;
  }
}

export function parseTerrainTextureLabViewSettings(raw: string): TerrainTextureLabViewSettings | null {
  try {
    const parsed = JSON.parse(raw) as Partial<TerrainTextureLabViewSettings>;
    if (
      typeof parsed.tiltDegrees !== 'number'
      || typeof parsed.rotationDegrees !== 'number'
      || typeof parsed.zoom !== 'number'
    ) {
      return null;
    }

    return {
      tiltDegrees: parsed.tiltDegrees,
      rotationDegrees: parsed.rotationDegrees,
      zoom: parsed.zoom,
    };
  } catch {
    return null;
  }
}

export function parseTerrainTextureLabVignetteSettings(raw: string): TerrainTextureLabVignetteSettings | null {
  try {
    const parsed = JSON.parse(raw) as Partial<TerrainTextureLabVignetteSettings>;
    const validScopes: TerrainTextureLabVignetteScope[] = ['selected_forest', 'all_forests', 'selected_mountain', 'all_mountains'];
    if (
      typeof parsed.enabled !== 'boolean'
      || !validScopes.includes(parsed.scope as TerrainTextureLabVignetteScope)
      || typeof parsed.landmarkModelId !== 'string'
      || typeof parsed.densityScale !== 'number'
      || typeof parsed.showSlotAnchors !== 'boolean'
      || typeof parsed.showZones !== 'boolean'
      || typeof parsed.showFillerDots !== 'boolean'
    ) {
      return null;
    }

    return {
      enabled: parsed.enabled,
      scope: parsed.scope,
      landmarkModelId: parsed.landmarkModelId,
      densityScale: parsed.densityScale,
      showSlotAnchors: parsed.showSlotAnchors,
      showZones: parsed.showZones,
      showFillerDots: parsed.showFillerDots,
    };
  } catch {
    return null;
  }
}

export function getRecipeOption(recipeId: TerrainRecipeId) {
  return TERRAIN_RECIPE_OPTIONS.find(option => option.id === recipeId) ?? TERRAIN_RECIPE_OPTIONS[0];
}
