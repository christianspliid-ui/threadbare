import { TERRAIN_PALETTE } from '../palette/terrainPalette';

export const TERRAIN_TEXTURE_LAB_STORAGE_KEY = 'terrain-texture-lab.v1';

export const TERRAIN_TEXTURE_LAB_CONSTANTS = {
  HEX_RADIUS: 78,
  PANEL_WIDTH: 380,
  CAMERA_Z: 400,
  PIXEL_RATIO_CAP: 2,
  DEFAULT_SEED: 42,
  DEFAULT_TIME_SCALE: 1,
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

export function getRecipeOption(recipeId: TerrainRecipeId) {
  return TERRAIN_RECIPE_OPTIONS.find(option => option.id === recipeId) ?? TERRAIN_RECIPE_OPTIONS[0];
}
