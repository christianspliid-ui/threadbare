/**
 * hexTooltipProse.ts — Generates atmospheric prose for hex tile tooltips.
 *
 * Pure function. Deterministic: same inputs always produce the same output.
 * Composes terrain feel, geo-param modifiers, overlay context, and memory
 * framing into 1-3 sentences of impersonal, atmospheric description.
 */

import type { TerrainType, LocationSubtype } from '../types';
import type { HexVisibilityState, StaleSnapshot } from '../types/visibility';

// ── Terrain base phrases ──────────────────────────────────────────────────────
// One evocative sentence fragment per terrain type. Ends WITHOUT a period —
// the composer appends punctuation after optional geo modifiers.

const TERRAIN_PROSE: Record<TerrainType, string> = {
  // Water
  ocean: 'Open waters stretch to the horizon',
  deep_ocean: 'Dark waters run deep and fathomless here',
  tropical_ocean: 'Warm tropical waters glimmer beneath the light',
  coastal_shallows: 'Shallow waters lap against the nearby shore',
  coast: 'The land meets the sea along a weathered shore',
  lake: 'Still waters mirror the sky above',
  river: 'A river cuts through the surrounding terrain',
  reef: 'Coral formations break the surface of shallow waters',
  // Lowlands
  grassland: 'Grasslands stretch onward, stirred by the wind',
  farmland: 'Tilled fields and farmsteads mark the land',
  savanna: 'Dry savanna spreads beneath a wide sky',
  steppe: 'Windswept steppe runs flat to the horizon',
  floodplain: 'Low-lying floodplains follow the nearby waterways',
  // Forest
  temperate_forest: 'Temperate woodland covers the land in a leafy canopy',
  dense_forest: 'Dense forest crowds close, dark beneath the canopy',
  boreal_forest: 'Boreal forest stands tall and silent',
  jungle: 'Thick jungle presses in from all sides, alive with sound',
  tropical_forest: 'Tropical forest rises in layered green profusion',
  evergreen_forest: 'Evergreen forest mantles the land in dark green',
  light_forest: 'Scattered trees dot the landscape, casting dappled shade',
  dead_forest: 'Bare trunks stand like bones against the sky',
  // Wet
  swamp: 'Murky swampland pools between gnarled roots',
  marsh: 'Reeds and standing water mark these marshlands',
  moor_bog: 'Boggy moor stretches out, treacherous underfoot',
  // Elevated
  hills: 'Rolling hills rise and fall across the terrain',
  mountains: 'Mountains rear up, stone and shadow against the sky',
  high_mountains: 'Towering peaks pierce the clouds',
  plateau: 'A broad plateau stands elevated above the surrounds',
  badlands: 'Eroded badlands carve the earth into jagged ridges',
  mountain_pass: 'A narrow pass threads between looming peaks',
  forested_hills: 'Forested hills ripple across the landscape',
  // Special
  great_home_trees: 'Ancient trees of impossible scale dominate the land',
  broken_lands: 'The earth here is fractured and unstable',
  oasis: 'Green life clusters around a hidden water source',
  // Extreme
  desert: 'Barren desert stretches in every direction',
  rocky_desert: 'Rocky desert sprawls in sun-baked desolation',
  sand_dunes: 'Shifting sand dunes roll like frozen waves',
  tundra: 'Frozen tundra extends under a pale sky',
  glacier: 'Ancient ice grinds slowly across the land',
  volcano: 'Volcanic rock and ash scar the tortured earth',
  arctic: 'An arctic wasteland of ice and cutting wind',
  snow_fields: 'Endless snow blankets the silent landscape',
};

// ── Geo modifier ──────────────────────────────────────────────────────────────
// Returns a short atmospheric clause when any geo param is at an extreme.
// Moderate/mid values produce nothing — the terrain phrase is enough.

function geoModifier(elevation: number, temperature: number, moisture: number): string {
  const parts: string[] = [];

  if (elevation >= 0.6) parts.push('high above the surrounding land');
  else if (elevation < 0.25) parts.push('low in a sheltered basin');

  if (temperature < 0.3) parts.push('the air bites with cold');
  else if (temperature >= 0.7) parts.push('heat shimmers above the ground');

  if (moisture < 0.3) parts.push('the earth parched and dry');
  else if (moisture >= 0.7) parts.push('moisture hangs heavy in the air');

  if (parts.length === 0) return '';
  const joined = parts.join(', ');
  return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
}

// ── Overlay phrases ───────────────────────────────────────────────────────────
// One sentence per location subtype describing the settlement or structure.

const OVERLAY_PROSE: Record<LocationSubtype, string> = {
  hamlet: 'A small hamlet clusters at the roadside.',
  town: 'A town has taken root here.',
  city: 'A city rises from the landscape.',
  capital: 'A great capital dominates the surrounding land.',
  camp: 'A makeshift camp marks a temporary presence.',
  farmland: 'Cultivated fields spread across the terrain.',
  castle: 'A castle commands the surrounding terrain.',
  fort: 'A fortification stands watch over the approaches.',
  tower: 'A watchtower rises above the surroundings.',
  shrine: 'A shrine stands in quiet reverence.',
  temple: 'A temple rises in solemn grandeur.',
  mining: 'Mining works scar the hillside.',
  ruins: 'Crumbling ruins hint at what once stood here.',
  ruined_tower: 'A ruined tower leans against the sky.',
  ruined_city: 'The broken walls of a fallen city spread across the land.',
  ruined_village: 'The remains of a village lie scattered and overgrown.',
  battleground: 'The earth is scarred by past conflict.',
  oasis: 'An oasis offers shelter and water.',
  unexplored_poi: 'Something of interest lies here, not yet explored.',
  wilderness: '',
};

// ── Main prose builder ────────────────────────────────────────────────────────

export function buildHexTooltipProse(
  terrain: TerrainType,
  elevation: number,
  temperature: number,
  moisture: number,
  visibility: HexVisibilityState,
  locationSubtype?: LocationSubtype,
  snapshot?: StaleSnapshot,
): string {
  const base = TERRAIN_PROSE[terrain] ?? terrain;
  const geo = geoModifier(elevation, temperature, moisture);

  if (visibility === 'visible') {
    const overlay =
      locationSubtype && locationSubtype !== 'wilderness'
        ? OVERLAY_PROSE[locationSubtype] ?? ''
        : '';
    return [base + '.', geo, overlay].filter(Boolean).join(' ');
  }

  if (visibility === 'remembered') {
    // Location names from snapshot take priority
    if (snapshot && snapshot.locationNames.length > 0) {
      const names = snapshot.locationNames.join(' and ');
      const locationLine =
        snapshot.locationNames.length === 1
          ? `${names} was last seen here.`
          : `${names} were last seen here.`;
      return [base + '.', geo, locationLine].filter(Boolean).join(' ');
    }

    // Overlay without snapshot names (location still exists in graph)
    if (locationSubtype && locationSubtype !== 'wilderness') {
      const overlay = OVERLAY_PROSE[locationSubtype] ?? '';
      return [base + '.', geo, overlay, 'The memory grows distant.']
        .filter(Boolean)
        .join(' ');
    }

    // Plain terrain, remembered
    return [base + '.', geo, 'The memory grows distant.']
      .filter(Boolean)
      .join(' ');
  }

  // Unexplored — no tooltip rendered, but return empty for safety
  return '';
}
