import { mulberry32 } from '../../../../lib/prng';
import {
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS,
} from '../terrainTextureLabPresets';
import {
  getTerrainTextureLabHexCenter,
  isPointInsideTerrainTextureHex,
  type TerrainTextureLabPoint,
} from '../terrainTextureLabLayout';
import type { TerrainTextureLabVignetteZoneRule } from '../terrainTextureLabVignettePrototype';
import type { TerrainTexturePreviewHex } from '../terrainTextureLabPresets';
import { getFillerProfile, weightedModelUrl } from './FillerProfiles';

export interface FillerInstance {
  x: number;
  y: number;
  scale: number;
  yawDegrees: number;
  modelUrl: string;
  visibilityState: 0 | 1 | 2;
}

export interface VignetteResolveTrace {
  type: 'vignette.resolve';
  hexId: string;
  terrainType: string;
  fillerInstanceCount: number;
  buildTimeMs: number;
}

export interface ResolvedHexFiller {
  hexId: string;
  terrainType: string;
  instances: FillerInstance[];
  trace: VignetteResolveTrace;
}

interface ScatterPoint extends TerrainTextureLabPoint {
  scale: number;
  mode: 'free_fill' | 'soft_fill';
}

const HEX_AREA = (3 * Math.sqrt(3) * TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS) / 2;

function isInsideAnyKeepout(point: TerrainTextureLabPoint, keepouts: TerrainTextureLabVignetteZoneRule[]): boolean {
  for (const zone of keepouts) {
    const dx = point.x - zone.center.x;
    const dy = point.y - zone.center.y;
    if (dx * dx + dy * dy <= zone.radius * zone.radius) return true;
  }
  return false;
}

function violatesMinSpacing(point: TerrainTextureLabPoint, existing: TerrainTextureLabPoint[], minSpacing: number): boolean {
  const minSq = minSpacing * minSpacing;
  for (const other of existing) {
    const dx = point.x - other.x;
    const dy = point.y - other.y;
    if (dx * dx + dy * dy < minSq) return true;
  }
  return false;
}

function sampleFreeFill(
  rng: () => number,
  targetCount: number,
  hexCenter: TerrainTextureLabPoint,
  blockedZones: TerrainTextureLabVignetteZoneRule[],
  existingPoints: TerrainTextureLabPoint[],
  scaleMin: number,
  scaleMax: number,
  minSpacing: number,
): ScatterPoint[] {
  const results: ScatterPoint[] = [];
  const allPoints = [...existingPoints];
  const r = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS;
  const h = r * Math.sqrt(3) * 0.5;
  const maxAttempts = Math.max(targetCount * 24, 240);

  for (let attempt = 0; attempt < maxAttempts && results.length < targetCount; attempt++) {
    const point: TerrainTextureLabPoint = {
      x: hexCenter.x + (rng() * 2 - 1) * r,
      y: hexCenter.y + (rng() * 2 - 1) * h,
    };
    if (!isPointInsideTerrainTextureHex(point, hexCenter)) continue;
    if (isInsideAnyKeepout(point, blockedZones)) continue;
    if (violatesMinSpacing(point, allPoints, minSpacing)) continue;

    const scale = scaleMin + rng() * (scaleMax - scaleMin);
    results.push({ ...point, scale, mode: 'free_fill' });
    allPoints.push(point);
  }
  return results;
}

function sampleSoftFill(
  rng: () => number,
  hexCenter: TerrainTextureLabPoint,
  zone: TerrainTextureLabVignetteZoneRule,
  existingPoints: TerrainTextureLabPoint[],
  densityScale: number,
  softDensity: number,
  scaleMin: number,
  scaleMax: number,
  minSpacing: number,
): ScatterPoint[] {
  const zoneArea = Math.PI * zone.radius * zone.radius;
  const fraction = zoneArea / HEX_AREA;
  const exact = softDensity * fraction * densityScale;
  const targetCount = Math.floor(exact) + (rng() < (exact % 1) ? 1 : 0);
  if (targetCount <= 0) return [];

  const results: ScatterPoint[] = [];
  const allPoints = [...existingPoints];
  const maxAttempts = Math.max(targetCount * 20, 48);

  for (let attempt = 0; attempt < maxAttempts && results.length < targetCount; attempt++) {
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng()) * zone.radius;
    const point: TerrainTextureLabPoint = {
      x: zone.center.x + Math.cos(angle) * radius,
      y: zone.center.y + Math.sin(angle) * radius,
    };
    if (!isPointInsideTerrainTextureHex(point, hexCenter)) continue;
    if (violatesMinSpacing(point, allPoints, minSpacing)) continue;

    const scale = scaleMin + rng() * (scaleMax - scaleMin);
    results.push({ ...point, scale, mode: 'soft_fill' });
    allPoints.push(point);
  }
  return results;
}

export function resolveHexFiller(
  hex: TerrainTexturePreviewHex,
  zoneRules: TerrainTextureLabVignetteZoneRule[],
  seed: number,
  densityScale: number = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.DEFAULT_DENSITY_SCALE,
): ResolvedHexFiller {
  const t0 = performance.now();
  const profile = getFillerProfile(hex.terrainKey);
  if (!profile) {
    return {
      hexId: hex.id,
      terrainType: hex.terrainKey,
      instances: [],
      trace: { type: 'vignette.resolve', hexId: hex.id, terrainType: hex.terrainKey, fillerInstanceCount: 0, buildTimeMs: 0 },
    };
  }

  const hexCenter = getTerrainTextureLabHexCenter(hex.col, hex.row);
  const rng = mulberry32(seed + hex.col * 101 + hex.row * 211);

  const hexZones = zoneRules.filter(z => z.hexId === hex.id);
  const keepouts = hexZones.filter(z => z.mode === 'hard_keepout');
  const softZones = hexZones.filter(z => z.mode === 'soft_fill');
  const blockedForFree = [...keepouts, ...softZones];

  const r = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS;
  const clampedDensity = Math.max(
    TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.MIN_DENSITY_SCALE,
    Math.min(TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.MAX_DENSITY_SCALE, densityScale),
  );

  const freeTargetCount = Math.round(profile.densityFree * clampedDensity);
  const freeMinSpacing = r * profile.minSpacingFractionFree;
  const softMinSpacing = r * profile.minSpacingFractionSoft;

  const freePoints = sampleFreeFill(
    rng, freeTargetCount, hexCenter, blockedForFree, [],
    profile.scaleMinFree, profile.scaleMaxFree, freeMinSpacing,
  );

  const allPoints: ScatterPoint[] = [...freePoints];
  for (const zone of softZones) {
    const softPoints = sampleSoftFill(
      rng, hexCenter, zone,
      allPoints.map(p => ({ x: p.x, y: p.y })),
      clampedDensity, profile.densitySoft,
      profile.scaleMinSoft, profile.scaleMaxSoft, softMinSpacing,
    );
    allPoints.push(...softPoints);
  }

  const maxBatch = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.SCATTER_MAX_INSTANCES_PER_BATCH;
  const instances: FillerInstance[] = [];
  for (let i = 0; i < Math.min(allPoints.length, maxBatch); i++) {
    const pt = allPoints[i]!;
    instances.push({
      x: pt.x,
      y: pt.y,
      scale: pt.scale,
      yawDegrees: Math.round(rng() * 360 - 180),
      modelUrl: weightedModelUrl(profile, rng),
      visibilityState: 2,
    });
  }

  const buildTimeMs = performance.now() - t0;

  if (import.meta.env.DEV) {
    console.debug('[vignette.resolve]', { hexId: hex.id, terrainType: hex.terrainKey, fillerInstanceCount: instances.length, buildTimeMs });
  }

  return {
    hexId: hex.id,
    terrainType: hex.terrainKey,
    instances,
    trace: {
      type: 'vignette.resolve',
      hexId: hex.id,
      terrainType: hex.terrainKey,
      fillerInstanceCount: instances.length,
      buildTimeMs,
    },
  };
}

export function resolveAllHexFiller(
  hexes: TerrainTexturePreviewHex[],
  allZoneRules: TerrainTextureLabVignetteZoneRule[],
  seed: number,
  densityScale?: number,
): ResolvedHexFiller[] {
  return hexes
    .filter(hex => getFillerProfile(hex.terrainKey) !== null)
    .map(hex => resolveHexFiller(hex, allZoneRules, seed, densityScale));
}
