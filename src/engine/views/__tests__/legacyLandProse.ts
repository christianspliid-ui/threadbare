/**
 * HexChronicle's land prose memos, copied verbatim (THR-1876 § D7.3 golden test).
 *
 * The bodies of `HexChronicle.tsx`'s `landProse1/2`, `hexResources`, `resourceProse`,
 * `geoRegionLayers`, `sortedSpheres`, `dominant/secondarySphereProse`, `soulAffinityProse`,
 * `soulSecondaryProse`, `historyLayers`, `etymologyLayers` and `explorationHooks` memos at
 * main `5dcfa32d`, with `useMemo` removed and the render order of each chapter kept. This
 * is the "before"; `landProse.ts` is the "after"; the golden test holds them equal.
 * Do not "fix" anything here — it is the reference, not code.
 */
import type { TerrainType, SphereName } from '../../../types';
import type { GraphNode } from '../../../types/graph';
import type { WorldGraph } from '../../graph';
import type { SphereInfluence } from '../../hexZoom';
import type { HexRegionData } from '../../hexRegion';
import type { ResourceInstance } from '../../../types/resource';
import { getAbundanceLabel } from '../../../types/resource';
import { BIOME_PROSE, SPHERE_LOCATION_PROSE } from '../../../data/prose-layer-content';
import { RESOURCE_PROSE } from '../../../data/resource-content';
import { SOUL_PROSE, SOUL_SECONDARY_PROSE, type HexSoulLevel } from '../../../data/hexSoulProse';
import { historicalCultureResolver, regionEtymologyResolver, geographicRegionResolver } from '../../proseResolvers';
import { elapsedLabel } from '../../aftermathWords';
import { mulberry32 } from '../../../lib/prng';
import { buildExplorationHooks } from '../../explorationHooks';

function pickFromArray<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  const rng = mulberry32(seed);
  return arr[Math.floor(rng() * arr.length)];
}

function pickTwoFromArray(arr: string[], seed: number): [string, string | undefined] {
  if (arr.length === 0) return ['', undefined];
  if (arr.length === 1) return [arr[0], undefined];
  const rng = mulberry32(seed);
  const idx1 = Math.floor(rng() * arr.length);
  let idx2 = Math.floor(rng() * (arr.length - 1));
  if (idx2 >= idx1) idx2++;
  return [arr[idx1], arr[idx2]];
}

function stripLeadingThe(name: string): string {
  return name.replace(/^The\s+/i, '');
}

function getSoulLevel(value: number): HexSoulLevel {
  if (value >= 0.7) return 'dominant';
  if (value >= 0.4) return 'strong';
  if (value >= 0.2) return 'moderate';
  return 'weak';
}

const FALLBACK_TERRAIN_PROSE = 'An unremarkable stretch of land, waiting for someone to give it meaning.';

export interface LegacyLandInput {
  terrain: TerrainType;
  hexCol: number;
  hexRow: number;
  seed: number;
  sphereInfluence: SphereInfluence | null;
  regionData: HexRegionData | null;
  locations: GraphNode[];
  graph: WorldGraph;
  surveyPeopleProse?: string;
  surveyPeopleProseTick?: number;
  tick?: number;
}

/** The text each chapter rendered, paragraph by paragraph, in render order. */
export function legacyLandChapters(p: LegacyLandInput): { land: string[]; soul: string[]; ruins: string[] } {
  const { terrain, hexCol, hexRow, seed, sphereInfluence, regionData, locations, graph } = p;
  const hexSeed = seed + hexCol * 1000 + hexRow;

  const [landProse1, landProse2] = (() => {
    const templates = BIOME_PROSE[terrain];
    if (!templates || templates.length === 0) return [FALLBACK_TERRAIN_PROSE, undefined];
    return pickTwoFromArray(templates, hexSeed);
  })();

  const hexResources = (() => {
    const aggregated: Record<string, { quantity: number; renewable: boolean }> = {};
    for (const loc of locations) {
      const resources = loc.properties?.resources as Record<string, ResourceInstance> | undefined;
      if (!resources) continue;
      for (const [type, inst] of Object.entries(resources)) {
        if (inst.quantity <= 0) continue;
        if (!aggregated[type]) {
          aggregated[type] = { quantity: inst.quantity, renewable: inst.renewable };
        } else {
          aggregated[type].quantity = Math.max(aggregated[type].quantity, inst.quantity);
        }
      }
    }
    return Object.entries(aggregated)
      .sort((a, b) => b[1].quantity - a[1].quantity);
  })();

  const resourceProse = (() => {
    if (hexResources.length === 0) return null;
    const [topType, topInst] = hexResources[0];
    const proseSet = RESOURCE_PROSE[topType];
    if (!proseSet) return null;
    const abundance = getAbundanceLabel(topInst.quantity);
    const templates = abundance === 'abundant' || abundance === 'moderate'
      ? proseSet.abundant
      : proseSet.scarce;
    return pickFromArray([...templates], hexSeed + 300);
  })();

  const geoRegionLayers = (() => {
    if (!regionData?.regionId) return [];
    return geographicRegionResolver(regionData.regionId, graph, hexSeed);
  })();

  const sortedSpheres = (() => {
    if (!sphereInfluence) return [];
    const entries = Object.entries(sphereInfluence) as [SphereName, number][];
    return entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  })();
  const dominantSphere = sortedSpheres.length > 0 ? sortedSpheres[0] : null;
  const secondarySphere = sortedSpheres.length > 1 ? sortedSpheres[1] : null;

  const dominantSphereProse = (() => {
    if (!dominantSphere) return null;
    const templates = SPHERE_LOCATION_PROSE[dominantSphere[0]];
    if (!templates) return null;
    return pickFromArray(templates, hexSeed + 100);
  })();
  const secondarySphereProse = (() => {
    if (!secondarySphere || secondarySphere[1] < 0.2) return null;
    const templates = SPHERE_LOCATION_PROSE[secondarySphere[0]];
    if (!templates) return null;
    return pickFromArray(templates, hexSeed + 200);
  })();
  const soulAffinityProse = (() => {
    if (!dominantSphere || dominantSphere[1] < 0.1) return null;
    const level = getSoulLevel(dominantSphere[1]);
    return SOUL_PROSE[dominantSphere[0]]?.[level] ?? null;
  })();
  const soulSecondaryProse = (() => {
    if (!secondarySphere || secondarySphere[1] < 0.2) return null;
    return SOUL_SECONDARY_PROSE[secondarySphere[0]] ?? null;
  })();

  const historyLayers = !regionData?.regionId ? [] : historicalCultureResolver(regionData.regionId, graph, seed);
  const etymologyLayers = !regionData?.regionId ? [] : regionEtymologyResolver(regionData.regionId, graph, seed);
  const explorationHooks = buildExplorationHooks(regionData?.historicalCulture?.ruinDescriptors);

  // ─── THE LAND (render order) ───
  const land: string[] = [landProse1 as string];
  if (landProse2) land.push(landProse2);
  if (geoRegionLayers.length > 0) land.push(geoRegionLayers[0].text);
  if (resourceProse) land.push(resourceProse);
  // The survey band rendered under The People with its attribution caption.
  if (p.surveyPeopleProse) {
    land.push(p.surveyPeopleProse);
    if (p.surveyPeopleProseTick != null && p.tick != null) land.push(`— surveyed ${elapsedLabel(p.tick - p.surveyPeopleProseTick)} ago`);
  }

  // ─── THE SOUL ───
  const soul: string[] = [];
  if (dominantSphereProse) soul.push(dominantSphereProse);
  if (secondarySphereProse) soul.push(secondarySphereProse);
  if (soulAffinityProse) soul.push(soulSecondaryProse ? `${soulAffinityProse} ${soulSecondaryProse}` : soulAffinityProse);

  // ─── THE RUINS (only with a historical culture) ───
  const ruins: string[] = [];
  if (regionData?.historicalCulture) {
    if (historyLayers.length > 0 && historyLayers[0]?.text) ruins.push(historyLayers[0].text);
    if (etymologyLayers.length > 0 && etymologyLayers[0]?.text) ruins.push(etymologyLayers[0].text);
    if (regionData.historicalCulture.legacyFlavor) {
      ruins.push(`“${regionData.historicalCulture.legacyFlavor}” ~ ${stripLeadingThe(regionData.historicalCulture.name)}`);
    }
    for (const hook of explorationHooks) ruins.push(hook);
  }
  return { land, soul, ruins };
}
