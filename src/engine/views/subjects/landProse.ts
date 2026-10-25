/**
 * The land page's prose — HexChronicle's *The Land*, *The Soul* and *The Ruins* blocks,
 * lifted out of the component's `useMemo`s into pure functions (THR-1876 § D7.3).
 *
 * **Output unchanged.** Every pick keeps HexChronicle's own seeds and its own string hash
 * (`hashString` below is HexChronicle's, not `detailPageResolvers.ts`'s — the two differ,
 * and unifying them would change every land's text). `landProse.golden.test.ts` pins the
 * paragraphs for three generated hexes against a verbatim copy of the old memos.
 *
 * Keyword markup (`**Mind**`) is returned as-is; the land resolvers turn it into linked
 * terms for the prose shape. These functions return paragraphs, in reading order — an
 * empty block is an empty list.
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
import { geographicRegionResolver, historicalCultureResolver, regionEtymologyResolver } from '../../proseResolvers';
import { elapsedLabel } from '../../aftermathWords';
import { mulberry32 } from '../../../lib/prng';
import { buildExplorationHooks } from '../../explorationHooks';
import { isWaterTerrain } from '../../coastline';

// ── HexChronicle's helpers, unchanged ───────────────────────────────

/** Seeded pick from an array — deterministic, same seed = same result. */
function pickFromArray<T>(arr: readonly T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  const rng = mulberry32(seed);
  return arr[Math.floor(rng() * arr.length)];
}

/** Pick two distinct items from an array using seeded PRNG. */
function pickTwoFromArray(arr: readonly string[], seed: number): [string, string | undefined] {
  if (arr.length === 0) return ['', undefined];
  if (arr.length === 1) return [arr[0], undefined];
  const rng = mulberry32(seed);
  const idx1 = Math.floor(rng() * arr.length);
  let idx2 = Math.floor(rng() * (arr.length - 1));
  if (idx2 >= idx1) idx2++;
  return [arr[idx1], arr[idx2]];
}

/** Strip leading "The " from a name to avoid "The The X" constructions. */
function stripLeadingThe(name: string): string {
  return name.replace(/^The\s+/i, '');
}

/** Map a sphereInfluence value (0-1) to SOUL_PROSE intensity level (HexChronicle's thresholds). */
function getSoulLevel(value: number): HexSoulLevel {
  if (value >= 0.7) return 'dominant';
  if (value >= 0.4) return 'strong';
  if (value >= 0.2) return 'moderate';
  return 'weak';
}

/** HexChronicle's land fallback, word for word. */
export const FALLBACK_TERRAIN_PROSE = 'An unremarkable stretch of land, waiting for someone to give it meaning.';

// ── Input ───────────────────────────────────────────────────────────

/** What the three blocks read. Every field is what HexChronicle was handed as a prop. */
export interface LandProseInput {
  terrain: TerrainType;
  col: number;
  row: number;
  /** The world seed (`GameState.seed`). */
  seed: number;
  sphereInfluence: SphereInfluence | null;
  regionData: HexRegionData | null;
  /** `getLocationsInHex` — both tiers, as HexChronicle received them. */
  locations: readonly GraphNode[];
  graph: WorldGraph;
  /** The latest `survey_completed` event's band on this hex, if surveyed. */
  survey?: { prose: string; tick: number } | null;
  tick: number;
}

/** HexChronicle's per-hex seed. */
export function landHexSeed(seed: number, col: number, row: number): number {
  return seed + col * 1000 + row;
}

/** The hex's resources, aggregated across its locations, largest first (HexChronicle's `hexResources`). */
export function aggregateHexResources(locations: readonly GraphNode[]): Array<[string, { quantity: number; renewable: boolean }]> {
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
  return Object.entries(aggregated).sort((a, b) => b[1].quantity - a[1].quantity);
}

/** The two biome paragraphs (HexChronicle's `[landProse1, landProse2]`). */
export function biomeParagraphs(terrain: TerrainType, hexSeed: number): [string, string | undefined] {
  const templates = BIOME_PROSE[terrain];
  if (!templates || templates.length === 0) return [FALLBACK_TERRAIN_PROSE, undefined];
  return pickTwoFromArray(templates, hexSeed);
}

/**
 * *The Land*: two biome paragraphs, the geographic-region prose, the resource prose, and —
 * when the land has been surveyed — the survey band with "— surveyed … ago".
 */
export function landParagraphs(input: LandProseInput): string[] {
  const hexSeed = landHexSeed(input.seed, input.col, input.row);
  const out: string[] = [];
  const [p1, p2] = biomeParagraphs(input.terrain, hexSeed);
  out.push(p1);
  if (p2) out.push(p2);

  if (input.regionData?.regionId) {
    const geo = geographicRegionResolver(input.regionData.regionId, input.graph, hexSeed);
    if (geo.length > 0) out.push(geo[0].text);
  }

  const resources = aggregateHexResources(input.locations);
  if (resources.length > 0) {
    const [topType, topInst] = resources[0];
    const proseSet = RESOURCE_PROSE[topType];
    if (proseSet) {
      const abundance = getAbundanceLabel(topInst.quantity);
      const templates = abundance === 'abundant' || abundance === 'moderate' ? proseSet.abundant : proseSet.scarce;
      const pick = pickFromArray([...templates], hexSeed + 300);
      if (pick) out.push(pick);
    }
  }

  if (input.survey?.prose) {
    out.push(input.survey.prose);
    out.push(`— surveyed ${elapsedLabel(input.tick - input.survey.tick)} ago`);
  }
  return out;
}

/** The hex's spheres, strongest first, zeros dropped (HexChronicle's `sortedSpheres`). */
export function sortedHexSpheres(sphereInfluence: SphereInfluence | null): Array<[SphereName, number]> {
  if (!sphereInfluence) return [];
  const entries = Object.entries(sphereInfluence) as [SphereName, number][];
  return entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
}

/**
 * *The Soul*: the dominant and secondary sphere prose, then the soul-affinity paragraph
 * (with its secondary sentence joined by one space, as HexChronicle rendered it).
 */
export function soulParagraphs(input: LandProseInput): string[] {
  const hexSeed = landHexSeed(input.seed, input.col, input.row);
  const sorted = sortedHexSpheres(input.sphereInfluence);
  const dominant = sorted.length > 0 ? sorted[0] : null;
  const secondary = sorted.length > 1 ? sorted[1] : null;
  const out: string[] = [];

  if (dominant) {
    const templates = SPHERE_LOCATION_PROSE[dominant[0]];
    const pick = templates ? pickFromArray(templates, hexSeed + 100) : undefined;
    if (pick) out.push(pick);
  }
  if (secondary && secondary[1] >= 0.2) {
    const templates = SPHERE_LOCATION_PROSE[secondary[0]];
    const pick = templates ? pickFromArray(templates, hexSeed + 200) : undefined;
    if (pick) out.push(pick);
  }
  if (dominant && dominant[1] >= 0.1) {
    const affinity = SOUL_PROSE[dominant[0]]?.[getSoulLevel(dominant[1])] ?? null;
    if (affinity) {
      const second = secondary && secondary[1] >= 0.2 ? (SOUL_SECONDARY_PROSE[secondary[0]] ?? null) : null;
      out.push(second ? `${affinity} ${second}` : affinity);
    }
  }
  return out;
}

/**
 * *The Ruins*: history, etymology, the legacy quote and the exploration hooks — only where
 * the land's Area records a historical culture (HexChronicle rendered the block only then).
 */
export function ruinsParagraphs(input: LandProseInput): string[] {
  const region = input.regionData;
  if (!region?.historicalCulture) return [];
  const out: string[] = [];
  const history = historicalCultureResolver(region.regionId, input.graph, input.seed);
  if (history.length > 0 && history[0]?.text) out.push(history[0].text);
  const etymology = regionEtymologyResolver(region.regionId, input.graph, input.seed);
  if (etymology.length > 0 && etymology[0]?.text) out.push(etymology[0].text);
  if (region.historicalCulture.legacyFlavor) {
    out.push(`“${region.historicalCulture.legacyFlavor}” ~ ${stripLeadingThe(region.historicalCulture.name)}`);
  }
  // A water hex keeps its Area's culture, quote and history (the territory is the culture's),
  // but its ruins lie under the water (THR-2021).
  const underwater = isWaterTerrain(input.terrain);
  for (const hook of buildExplorationHooks(region.historicalCulture.ruinDescriptors, underwater)) out.push(hook);
  return out;
}
