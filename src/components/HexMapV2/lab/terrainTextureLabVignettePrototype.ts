import { mulberry32 } from '../../../lib/prng';
import {
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS,
  type TerrainTextureLabModelDefinition,
  type TerrainTextureLabModelPlacement,
  type TerrainTextureLabVignetteSettings,
  type TerrainTexturePreviewHex,
} from './terrainTextureLabPresets';
import {
  getTerrainTextureLabAllSlotPositions,
  getTerrainTextureLabPreviewHexCenter,
  isPointInsideTerrainTextureHex,
  type TerrainTextureLabPoint,
  type TerrainTextureLabVignetteSlot,
} from './terrainTextureLabLayout';

export type TerrainTextureLabZoneMode = 'hard_keepout' | 'soft_fill' | 'free_fill';

export interface TerrainTextureLabVignetteZoneRule {
  id: string;
  hexId: string;
  slot: TerrainTextureLabVignetteSlot;
  mode: TerrainTextureLabZoneMode;
  center: TerrainTextureLabPoint;
  radius: number;
}

export interface TerrainTextureLabVignetteSlotAnchor {
  id: string;
  hexId: string;
  slot: TerrainTextureLabVignetteSlot;
  position: TerrainTextureLabPoint;
  occupied: boolean;
}

export interface TerrainTextureLabVignetteDebugDot {
  id: string;
  hexId: string;
  mode: Exclude<TerrainTextureLabZoneMode, 'hard_keepout'>;
  position: TerrainTextureLabPoint;
  scale: number;
}

export interface TerrainTextureLabVignetteClickTarget {
  id: string;
  hexId: string;
  label: string;
  slot: TerrainTextureLabVignetteSlot;
  modelId: string;
  position: TerrainTextureLabPoint;
  radiusPx: number;
}

export interface TerrainTextureLabVignettePrototypeSummary {
  targetHexIds: string[];
  autoPlacementCount: number;
  fillerPlacementCount: number;
  zoneCount: number;
  scopeLabel: string;
}

export interface TerrainTextureLabVignettePrototypeResult {
  autoPlacements: TerrainTextureLabModelPlacement[];
  slotAnchors: TerrainTextureLabVignetteSlotAnchor[];
  zoneRules: TerrainTextureLabVignetteZoneRule[];
  fillerDots: TerrainTextureLabVignetteDebugDot[];
  clickTargets: TerrainTextureLabVignetteClickTarget[];
  summary: TerrainTextureLabVignettePrototypeSummary;
}

interface FillerCandidate extends TerrainTextureLabPoint {
  scale: number;
  mode: Exclude<TerrainTextureLabZoneMode, 'hard_keepout'>;
}

const ALL_RING_SLOTS: TerrainTextureLabVignetteSlot[] = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];
const HEX_AREA = (3 * Math.sqrt(3) * TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS) / 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getForestTreeModels(models: TerrainTextureLabModelDefinition[]): TerrainTextureLabModelDefinition[] {
  const explicitTrees = models.filter(model => /oak|elm|birch|tree/i.test(model.id) || /oak|elm|birch|tree/i.test(model.label));
  if (explicitTrees.length > 0) return explicitTrees;
  return models.filter(model => /forest/i.test(model.id) === false);
}

function chooseLandmarkModel(
  models: TerrainTextureLabModelDefinition[],
  requestedId: string,
): TerrainTextureLabModelDefinition | null {
  return models.find(model => model.id === requestedId)
    ?? models.find(model => /village/i.test(model.id))
    ?? models.find(model => /town/i.test(model.id))
    ?? models.find(model => /city/i.test(model.id))
    ?? null;
}

function distanceSquared(a: TerrainTextureLabPoint, b: TerrainTextureLabPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function isInsideCircle(point: TerrainTextureLabPoint, center: TerrainTextureLabPoint, radius: number): boolean {
  return distanceSquared(point, center) <= radius * radius;
}

function isInsideAnyKeepout(point: TerrainTextureLabPoint, keepouts: TerrainTextureLabVignetteZoneRule[]): boolean {
  return keepouts.some(zone => isInsideCircle(point, zone.center, zone.radius));
}

function violatesMinSpacing(point: TerrainTextureLabPoint, existing: TerrainTextureLabPoint[], minSpacing: number): boolean {
  const minDistanceSquared = minSpacing * minSpacing;
  return existing.some(other => distanceSquared(point, other) < minDistanceSquared);
}

function samplePointInsideHex(
  rng: () => number,
  center: TerrainTextureLabPoint,
): TerrainTextureLabPoint {
  const minX = center.x - TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS;
  const maxX = center.x + TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS;
  const minY = center.y - TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * Math.sqrt(3) * 0.5;
  const maxY = center.y + TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * Math.sqrt(3) * 0.5;

  return {
    x: minX + rng() * (maxX - minX),
    y: minY + rng() * (maxY - minY),
  };
}

function sampleFreeFillCandidates(
  rng: () => number,
  targetCount: number,
  hexCenter: TerrainTextureLabPoint,
  blockedZones: TerrainTextureLabVignetteZoneRule[],
  existingPoints: TerrainTextureLabPoint[],
): FillerCandidate[] {
  const results: FillerCandidate[] = [];
  const allPoints = [...existingPoints];
  const minSpacing = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_FREE_MIN_SPACING_FRACTION;
  const maxAttempts = Math.max(targetCount * 24, 240);

  for (let attempt = 0; attempt < maxAttempts && results.length < targetCount; attempt++) {
    const point = samplePointInsideHex(rng, hexCenter);
    if (!isPointInsideTerrainTextureHex(point, hexCenter)) continue;
    if (isInsideAnyKeepout(point, blockedZones)) continue;
    if (violatesMinSpacing(point, allPoints, minSpacing)) continue;

    const scale = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_FREE_SCALE_MIN
      + rng() * (TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_FREE_SCALE_MAX - TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_FREE_SCALE_MIN);

    results.push({ ...point, scale, mode: 'free_fill' });
    allPoints.push(point);
  }

  return results;
}

function sampleSoftFillCandidates(
  rng: () => number,
  hexCenter: TerrainTextureLabPoint,
  zone: TerrainTextureLabVignetteZoneRule,
  existingPoints: TerrainTextureLabPoint[],
  densityScale: number,
): FillerCandidate[] {
  const zoneArea = Math.PI * zone.radius * zone.radius;
  const equivalentHexFraction = zoneArea / HEX_AREA;
  const exactTargetCount = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_SOFT_DENSITY_PER_HEX * equivalentHexFraction * densityScale;
  const targetCount = Math.floor(exactTargetCount) + (rng() < (exactTargetCount % 1) ? 1 : 0);
  if (targetCount <= 0) return [];

  const results: FillerCandidate[] = [];
  const allPoints = [...existingPoints];
  const minSpacing = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_SOFT_MIN_SPACING_FRACTION;
  const maxAttempts = Math.max(targetCount * 20, 48);

  for (let attempt = 0; attempt < maxAttempts && results.length < targetCount; attempt++) {
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng()) * zone.radius;
    const point = {
      x: zone.center.x + Math.cos(angle) * radius,
      y: zone.center.y + Math.sin(angle) * radius,
    };

    if (!isPointInsideTerrainTextureHex(point, hexCenter)) continue;
    if (violatesMinSpacing(point, allPoints, minSpacing)) continue;

    const scale = TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_SOFT_SCALE_MIN
      + rng() * (TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_SOFT_SCALE_MAX - TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_SOFT_SCALE_MIN);

    results.push({ ...point, scale, mode: 'soft_fill' });
    allPoints.push(point);
  }

  return results;
}

function getScopeHexes(
  previewHexes: TerrainTexturePreviewHex[],
  selectedHexId: string | null,
  scope: TerrainTextureLabVignetteSettings['scope'],
): TerrainTexturePreviewHex[] {
  const forests = previewHexes.filter(hex => hex.terrainKey === 'temperate_forest');
  if (scope === 'all_forests') return forests;
  const selectedForest = forests.find(hex => hex.id === selectedHexId);
  return selectedForest ? [selectedForest] : forests.slice(0, 1);
}

export function buildTerrainTextureLabVignettePrototype(
  previewHexes: TerrainTexturePreviewHex[],
  models: TerrainTextureLabModelDefinition[],
  settings: TerrainTextureLabVignetteSettings,
  seed: number,
  selectedHexId: string | null,
): TerrainTextureLabVignettePrototypeResult {
  const targetHexes = settings.enabled
    ? getScopeHexes(previewHexes, selectedHexId, settings.scope)
    : [];
  const landmarkModel = chooseLandmarkModel(models, settings.landmarkModelId);
  const treeModels = getForestTreeModels(models);

  const autoPlacements: TerrainTextureLabModelPlacement[] = [];
  const slotAnchors: TerrainTextureLabVignetteSlotAnchor[] = [];
  const zoneRules: TerrainTextureLabVignetteZoneRule[] = [];
  const fillerDots: TerrainTextureLabVignetteDebugDot[] = [];
  const clickTargets: TerrainTextureLabVignetteClickTarget[] = [];

  for (let hexIndex = 0; hexIndex < targetHexes.length; hexIndex++) {
    const previewHex = targetHexes[hexIndex];
    const rng = mulberry32(seed + previewHex.col * 101 + previewHex.row * 211 + hexIndex * 17);
    const center = getTerrainTextureLabPreviewHexCenter(previewHex);
    const slotPositions = getTerrainTextureLabAllSlotPositions(center);
    const hardKeepoutRadius = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.ZONE_RADIUS_CENTER_FRACTION;
    const softFillRadius = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.ZONE_RADIUS_RING_FRACTION;

    slotAnchors.push({
      id: `${previewHex.id}-slot-center`,
      hexId: previewHex.id,
      slot: 'CENTER',
      position: slotPositions.CENTER,
      occupied: true,
    });
    zoneRules.push({
      id: `${previewHex.id}-zone-center`,
      hexId: previewHex.id,
      slot: 'CENTER',
      mode: 'hard_keepout',
      center: slotPositions.CENTER,
      radius: hardKeepoutRadius,
    });

    for (const slot of ALL_RING_SLOTS) {
      slotAnchors.push({
        id: `${previewHex.id}-slot-${slot.toLowerCase()}`,
        hexId: previewHex.id,
        slot,
        position: slotPositions[slot],
        occupied: false,
      });
      zoneRules.push({
        id: `${previewHex.id}-zone-${slot.toLowerCase()}`,
        hexId: previewHex.id,
        slot,
        mode: 'soft_fill',
        center: slotPositions[slot],
        radius: softFillRadius,
      });
    }

    if (landmarkModel) {
      autoPlacements.push({
        id: `${previewHex.id}-landmark`,
        modelId: landmarkModel.id,
        hexId: previewHex.id,
        scale: landmarkModel.suggestedScale,
        heightOffset: landmarkModel.suggestedHeightOffset,
        rotationDegrees: landmarkModel.suggestedRotationDegrees,
      });
      clickTargets.push({
        id: `${previewHex.id}-target-center`,
        hexId: previewHex.id,
        label: `${landmarkModel.label} on ${previewHex.id}`,
        slot: 'CENTER',
        modelId: landmarkModel.id,
        position: slotPositions.CENTER,
        radiusPx: TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.LANDMARK_CLICK_RADIUS_PX,
      });
    }

    const occupiedPoints: TerrainTextureLabPoint[] = [slotPositions.CENTER];
    const keepouts = zoneRules.filter(zone => zone.hexId === previewHex.id && zone.mode === 'hard_keepout');
    const softFillZones = zoneRules.filter(zone => zone.hexId === previewHex.id && zone.mode === 'soft_fill');
    const densityScale = clamp(
      settings.densityScale,
      TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.MIN_DENSITY_SCALE,
      TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.MAX_DENSITY_SCALE,
    );
    const freeTargetCount = Math.round(TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.FOREST_FREE_DENSITY_PER_HEX * densityScale);
    const freeCandidates = sampleFreeFillCandidates(rng, freeTargetCount, center, [...keepouts, ...softFillZones], occupiedPoints);
    const allCandidates: FillerCandidate[] = [...freeCandidates];

    for (const zone of softFillZones) {
      const softCandidates = sampleSoftFillCandidates(
        rng,
        center,
        zone,
        [slotPositions.CENTER, ...allCandidates.map(candidate => ({ x: candidate.x, y: candidate.y }))],
        densityScale,
      );
      allCandidates.push(...softCandidates);
    }

    for (let index = 0; index < allCandidates.length; index++) {
      const candidate = allCandidates[index];
      fillerDots.push({
        id: `${previewHex.id}-dot-${index}`,
        hexId: previewHex.id,
        mode: candidate.mode,
        position: { x: candidate.x, y: candidate.y },
        scale: candidate.scale,
      });

      if (treeModels.length === 0) continue;
      const treeModel = treeModels[Math.floor(rng() * treeModels.length)] ?? treeModels[0];
      autoPlacements.push({
        id: `${previewHex.id}-filler-${index}`,
        modelId: treeModel.id,
        hexId: previewHex.id,
        scale: candidate.scale,
        heightOffset: treeModel.suggestedHeightOffset,
        rotationDegrees: Math.round(rng() * 360 - 180),
      });
    }
  }

  return {
    autoPlacements,
    slotAnchors,
    zoneRules,
    fillerDots,
    clickTargets,
    summary: {
      targetHexIds: targetHexes.map(hex => hex.id),
      autoPlacementCount: autoPlacements.length,
      fillerPlacementCount: fillerDots.length,
      zoneCount: zoneRules.length,
      scopeLabel: settings.scope === 'all_forests' ? 'All forest sample hexes' : 'Selected forest sample hex',
    },
  };
}
