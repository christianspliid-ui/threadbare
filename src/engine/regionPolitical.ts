/**
 * regionPolitical.ts — Political region grouping (province/domain assignment).
 *
 * Reads geographic regions (from regionDetection.ts) and province data (from worldgen)
 * to assign each land hex to a province (smallest administrative unit) and a domain
 * (culture-group-level, groups all provinces of the same culture).
 *
 * Political hierarchy: Domain → Province → Hex → Location
 *
 * Algorithm:
 *   1. One worldgen province = one ProvinceRegion.
 *      Province hexes collected from provinceIds flat array.
 *   2. Domain grouping: provinces with same non-null cultureId form one domain.
 *      Wilderness provinces (cultureId=null) have no domain parent.
 *   3. Build hexProvinceId and hexDomainId lookup maps from assignments.
 *   4. Generate culture-flavoured province names and domain names from seeded PRNG.
 *
 * NFP #1 Tunability: All magic numbers are named constants.
 * NFP #2 Inspectability: hexProvinceId and hexDomainId maps give O(1) per-hex lookup.
 * NFP #3 Determinism: Uses mulberry32 seeded PRNG for names.
 * NFP #4 Fail-soft: Provinces with no hexes produce empty-hex ProvinceRegions (still valid).
 */

import type { HexCoord } from '../types';
import type { RegionCluster, ProvinceRegion, DomainRegion } from './regionTypes';
import type { Province } from './worldgen/types';
import { hexKey, hexKeyFromCoord } from '../lib/hexKey';

// ─── Province name vocabulary (NFP #1: Tunability) ───────────────────────────
//
// Province proper names are culture-flavoured: a chaos culture's provinces feel
// different from an order culture's. Each foundation bias has its own adjective
// and noun pool. Wilderness provinces fall back to the generic pool.

interface ProvinceVocab { adjectives: string[]; nouns: string[] }

const PROVINCE_VOCAB_BY_FOUNDATION: Record<string, ProvinceVocab> = {
  chaos: {
    adjectives: ['Storm', 'Wild', 'Raging', 'Broken', 'Untamed', 'Fevered', 'Shifting'],
    nouns:      ['breach', 'run', 'scar', 'surge', 'fray', 'break', 'tumult'],
  },
  order: {
    adjectives: ['Stone', 'Iron', 'High', 'Strong', 'True', 'Warden', 'Steadfast'],
    nouns:      ['gate', 'keep', 'hold', 'watch', 'ward', 'mark', 'post'],
  },
  light: {
    adjectives: ['Bright', 'Sun', 'Open', 'Clear', 'Dawn', 'Radiant', 'Fair'],
    nouns:      ['haven', 'vale', 'shore', 'glade', 'reach', 'crossing', 'field'],
  },
  darkness: {
    adjectives: ['Dark', 'Shadow', 'Veiled', 'Deep', 'Grey', 'Hollow', 'Ashen'],
    nouns:      ['moor', 'fen', 'hollow', 'mere', 'shroud', 'haunt', 'den'],
  },
};

/** Fallback pool used for wilderness provinces or unknown foundations */
const PROVINCE_VOCAB_DEFAULT: ProvinceVocab = {
  adjectives: ['Stone', 'East', 'West', 'North', 'South', 'Grey', 'Black', 'Red', 'Green',
               'Iron', 'High', 'Low', 'Deep', 'Far', 'Old', 'New', 'Wild', 'Great', 'Dark',
               'Bright', 'Silver', 'Gold', 'Swift', 'Slow', 'Storm', 'Frost', 'Sun', 'Moon'],
  nouns:      ['mark', 'march', 'vale', 'ford', 'wick', 'hold', 'keep', 'gate', 'heath',
               'moor', 'field', 'wood', 'ridge', 'crest', 'peak', 'bay', 'shore', 'haven',
               'stead', 'bridge', 'cross', 'hall', 'fen', 'glen', 'mere', 'tor', 'burn'],
};

// ─── Domain name vocabulary ───────────────────────────────────────────────────

const DOMAIN_NOUNS = [
  'realm', 'dominion', 'throne', 'crown', 'lands', 'hold', 'empire', 'domain',
  'sovereignty', 'principality', 'duchy', 'march', 'kingdom',
];

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

/**
 * mulberry32 PRNG — fast, deterministic, 32-bit output.
 * NFP #3: Same seed always produces same sequence.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generate a province proper name, flavoured by the controlling culture's foundation bias.
 * Format: "{Adjective}{noun}" (no space — e.g. "Stormbreak", "Brightford").
 */
function generateProvinceName(id: number, seed: number, foundationBias?: string): string {
  const rng = mulberry32(seed + id * 1777);
  const vocab = (foundationBias && PROVINCE_VOCAB_BY_FOUNDATION[foundationBias])
    ?? PROVINCE_VOCAB_DEFAULT;
  return pickRandom(vocab.adjectives, rng) + pickRandom(vocab.nouns, rng);
}

/**
 * Derive a short domain-label form from a full culture name.
 * Strips leading articles/phrases and truncates at " of the ".
 * Examples:
 *   "The Wild Storm of the Deepwood"      → "Wild Storm"
 *   "Children of the Shadow-Kept Mires"   → "Shadow-Kept Mires"
 *   "The Blade Heights"                    → "Blade Heights"
 *   "Stone-Set Iron"                       → "Stone-Set Iron"
 */
function toDomainShortName(cultureName: string): string {
  let s = cultureName;
  for (const prefix of ['Children of the ', 'Keepers of the ', 'The ']) {
    if (s.startsWith(prefix)) { s = s.slice(prefix.length); break; }
  }
  const ofTheIdx = s.indexOf(' of the ');
  if (ofTheIdx > 0) s = s.slice(0, ofTheIdx);
  return s;
}

function generateDomainName(
  cultureId: string,
  seed: number,
  idx: number,
  cultureName?: string,
): string {
  const rng = mulberry32(seed + idx * 3331 + cultureId.charCodeAt(0) * 17);
  const noun = pickRandom(DOMAIN_NOUNS, rng);
  if (cultureName) {
    const short = toDomainShortName(cultureName);
    return `${noun} of ${short}`;
  }
  // Fallback when no cultureNameMap provided
  const prefix = cultureId.length > 4
    ? cultureId.slice(0, 1).toUpperCase() + cultureId.slice(1, 4)
    : cultureId.slice(0, 1).toUpperCase() + cultureId.slice(1);
  return `${prefix} ${noun}`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Assign land hexes to provinces and domains.
 *
 * @param geographicRegions     - Geographic region clusters from detectRegionsBorderCost
 * @param _hexRegionId          - "col,row" -> geographic region id map (unused; reserved)
 * @param provinces             - Province array from WorldGenContext
 * @param provinceCapitalHexes  - Capital hex per province (same index as provinces)
 * @param provinceIds           - Flat Int16Array: provinceIds[row*cols+col] = id, -1=unassigned
 * @param cols                  - Grid width (for provinceIds index calculation)
 * @param seed                  - World seed for deterministic name generation
 * @param cultureNameMap        - Optional cultureId → full culture name (for domain naming)
 * @param cultureFoundationMap  - Optional cultureId → foundation bias (for province naming)
 */
export function assignPoliticalRegions(
  geographicRegions: RegionCluster[],
  _hexRegionId: Map<string, number>,
  provinces: Province[],
  provinceCapitalHexes: HexCoord[],
  provinceIds: Int16Array,
  cols: number,
  seed: number,
  cultureNameMap?: Map<string, string>,
  cultureFoundationMap?: Map<string, string>,
): {
  provinces: ProvinceRegion[];
  domains: DomainRegion[];
  hexProvinceId: Map<string, number>;
  hexDomainId: Map<string, number>;
} {
  // ── Step 1: Build province hex sets from provinceIds array ──────────────────

  const provinceHexSets = new Map<number, Set<string>>();
  for (let i = 0; i < provinces.length; i++) {
    provinceHexSets.set(i, new Set());
  }

  const totalHexes = provinceIds.length;
  for (let idx = 0; idx < totalHexes; idx++) {
    const provinceId = provinceIds[idx];
    if (provinceId < 0) continue;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    provinceHexSets.get(provinceId)?.add(hexKey(col, row));
  }

  // ── Step 2: Create one ProvinceRegion per worldgen province ────────────────

  const hexProvinceId = new Map<string, number>();
  const provinceRegions: ProvinceRegion[] = [];

  for (let pIdx = 0; pIdx < provinces.length; pIdx++) {
    const province = provinces[pIdx];
    const provinceHexSet = provinceHexSets.get(pIdx) ?? new Set<string>();
    const capitalHex = provinceCapitalHexes[pIdx] ?? province.capitalHex;

    const geographicRegionIds: number[] = [];
    const provinceHexes: HexCoord[] = [];

    for (const hk of provinceHexSet) {
      const commaIdx = hk.indexOf(',');
      const col = parseInt(hk.slice(0, commaIdx), 10);
      const row = parseInt(hk.slice(commaIdx + 1), 10);
      provinceHexes.push({ col, row });
      hexProvinceId.set(hk, pIdx);
    }

    for (const cluster of geographicRegions) {
      let inProvince = 0;
      for (const hex of cluster.hexes) {
        if (provinceHexSet.has(hexKeyFromCoord(hex))) inProvince++;
      }
      if (inProvince > 0 && inProvince >= cluster.hexes.length / 2) {
        geographicRegionIds.push(cluster.id);
      }
    }

    let centroid: { col: number; row: number };
    if (provinceHexes.length === 0) {
      centroid = { col: capitalHex.col, row: capitalHex.row };
    } else {
      const sumCol = provinceHexes.reduce((s, h) => s + h.col, 0);
      const sumRow = provinceHexes.reduce((s, h) => s + h.row, 0);
      const rawCol = sumCol / provinceHexes.length;
      const rawRow = sumRow / provinceHexes.length;
      let bestHex = provinceHexes[0];
      let bestDist = Infinity;
      for (const hex of provinceHexes) {
        const d = (hex.col - rawCol) ** 2 + (hex.row - rawRow) ** 2;
        if (d < bestDist) { bestDist = d; bestHex = hex; }
      }
      centroid = { col: bestHex.col, row: bestHex.row };
    }

    const foundationBias = province.cultureId
      ? cultureFoundationMap?.get(province.cultureId)
      : undefined;

    provinceRegions.push({
      id: pIdx,
      cultureId: province.cultureId,
      capitalHex,
      geographicRegionIds,
      hexes: provinceHexes,
      centroid,
      name: generateProvinceName(pIdx, seed, foundationBias),
    });
  }

  // ── Step 3: Group provinces by cultureId into domains ─────────────────────

  const hexDomainId = new Map<string, number>();
  const domainRegions: DomainRegion[] = [];

  const cultureGroups = new Map<string, number[]>();
  for (const pr of provinceRegions) {
    if (pr.cultureId === null) continue;
    if (!cultureGroups.has(pr.cultureId)) cultureGroups.set(pr.cultureId, []);
    cultureGroups.get(pr.cultureId)!.push(pr.id);
  }

  let domainIdx = 0;
  for (const [cultureId, provIds] of cultureGroups) {
    const sortedProvIds = [...provIds].sort((a, b) => a - b);
    const capitalProvince = provinceRegions.find(p => p.id === sortedProvIds[0])!;

    const centroidCols = sortedProvIds.map(pid => provinceRegions.find(p => p.id === pid)!.centroid.col);
    const centroidRows = sortedProvIds.map(pid => provinceRegions.find(p => p.id === pid)!.centroid.row);
    const meanCol = Math.round(centroidCols.reduce((s, c) => s + c, 0) / centroidCols.length);
    const meanRow = Math.round(centroidRows.reduce((s, r) => s + r, 0) / centroidRows.length);

    const domainId = domainIdx++;

    for (const provId of provIds) {
      const pr = provinceRegions.find(p => p.id === provId)!;
      for (const hex of pr.hexes) {
        hexDomainId.set(hexKeyFromCoord(hex), domainId);
      }
    }

    domainRegions.push({
      id: domainId,
      cultureId,
      capitalHex: capitalProvince.capitalHex,
      provinceIds: sortedProvIds,
      centroid: { col: meanCol, row: meanRow },
      name: generateDomainName(cultureId, seed, domainId, cultureNameMap?.get(cultureId)),
    });
  }

  return {
    provinces: provinceRegions,
    domains: domainRegions,
    hexProvinceId,
    hexDomainId,
  };
}
