import { FORCE_NAMES, type ForceVector, type ForceName, type TerrainType } from '../types';

const DOMINANCE_THRESHOLD = 0.25;
const SECONDARY_THRESHOLD = 0.20;

const BASE_TERRAIN: Record<ForceName, TerrainType> = {
  aether: 'crystal_wastes',
  verdance: 'deep_forest',
  ignis: 'scorched_plains',
  umbra: 'shadow_marsh',
  terra: 'stone_highlands',
};

const MODIFIED_TERRAIN: Record<ForceName, Partial<Record<ForceName, TerrainType>>> = {
  aether: { verdance: 'enchanted_grove', terra: 'runed_mountains' },
  verdance: { umbra: 'haunted_wood', ignis: 'volcanic_jungle' },
  ignis: { aether: 'lightning_fields', terra: 'forge_mountains' },
  umbra: { verdance: 'fungal_forest', aether: 'void_rift' },
  terra: { ignis: 'obsidian_peaks', umbra: 'buried_ruins' },
};

function getDominant(fv: ForceVector): { force: ForceName; value: number } {
  let best: ForceName = 'aether';
  let bestVal = -1;
  for (const f of FORCE_NAMES) {
    if (fv[f] > bestVal) { bestVal = fv[f]; best = f; }
  }
  return { force: best, value: bestVal };
}

function getSecondary(fv: ForceVector, dominant: ForceName): { force: ForceName; value: number } {
  let best: ForceName = FORCE_NAMES.find(f => f !== dominant)!;
  let bestVal = -1;
  for (const f of FORCE_NAMES) {
    if (f !== dominant && fv[f] > bestVal) { bestVal = fv[f]; best = f; }
  }
  return { force: best, value: bestVal };
}

export function classifyTerrain(fv: ForceVector): TerrainType {
  const dom = getDominant(fv);
  if (dom.value < DOMINANCE_THRESHOLD) return 'contested_ground';
  const sec = getSecondary(fv, dom.force);
  if (sec.value >= SECONDARY_THRESHOLD) {
    const modified = MODIFIED_TERRAIN[dom.force]?.[sec.force];
    if (modified) return modified;
  }
  return BASE_TERRAIN[dom.force];
}

export function deriveTileProperties(fv: ForceVector): {
  elevation: number; moisture: number; magicDensity: number;
} {
  const elevation = Math.min(1, Math.max(0,
    fv.terra * 0.7 + fv.ignis * 0.2 + fv.aether * 0.1 - fv.umbra * 0.1 - fv.verdance * 0.05
  ));
  const moisture = Math.min(1, Math.max(0,
    fv.verdance * 0.5 + fv.umbra * 0.3 - fv.ignis * 0.3 + fv.aether * 0.1 + fv.terra * 0.05
  ));
  const magicDensity = Math.min(1, Math.max(0,
    fv.aether * 0.5 + fv.umbra * 0.3 + fv.ignis * 0.1 + fv.verdance * 0.05 + fv.terra * 0.05
  ));
  return { elevation, moisture, magicDensity };
}
