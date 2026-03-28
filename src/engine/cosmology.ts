import { SPHERE_NAMES, type CosmologyProfile, type SphereName } from '../types';

export function createBalancedCosmology(): CosmologyProfile {
  const weight = 1.0 / SPHERE_NAMES.length;
  return Object.fromEntries(SPHERE_NAMES.map(s => [s, weight])) as CosmologyProfile;
}

export function normalizeCosmology(profile: CosmologyProfile): CosmologyProfile {
  const sum = SPHERE_NAMES.reduce((s, sp) => s + profile[sp], 0);
  if (sum === 0) return createBalancedCosmology();
  return Object.fromEntries(
    SPHERE_NAMES.map(sp => [sp, profile[sp] / sum])
  ) as CosmologyProfile;
}

export function adjustSphere(
  profile: CosmologyProfile,
  sphere: SphereName,
  newValue: number
): CosmologyProfile {
  const clamped = Math.max(0, Math.min(1, newValue));
  const remaining = 1.0 - clamped;
  const othersSum = SPHERE_NAMES
    .filter(s => s !== sphere)
    .reduce((s, sp) => s + profile[sp], 0);

  const result = { ...profile, [sphere]: clamped };
  if (othersSum === 0) {
    const share = remaining / (SPHERE_NAMES.length - 1);
    SPHERE_NAMES.filter(s => s !== sphere).forEach(s => { result[s] = share; });
  } else {
    SPHERE_NAMES.filter(s => s !== sphere).forEach(s => {
      result[s] = (profile[s] / othersSum) * remaining;
    });
  }
  return result;
}

// Cosmology sphere allies — adjacent pairs that defend each other.
// Foundation: chaos↔darkness (change-mystery bridge), order↔light (stability-illumination bridge)
// Creation: aligned with The Cosmological Pattern (quadrant bridges)
export const SPHERE_ALLIES: Record<SphereName, SphereName | null> = {
  // Foundation allies (cross-axis, moderate affinity)
  chaos: 'darkness',
  order: 'light',
  light: 'order',
  darkness: 'chaos',
  // Creation allies (quadrant bridges from The Cosmological Pattern)
  force: 'matter',
  matter: 'force',
  energy: 'life',
  life: 'energy',
  mind: 'spirit',
  spirit: 'mind',
  time: 'entropy',
  entropy: 'time',
};

// Cosmology sphere opposites — from The Cosmological Pattern.
// Foundation: chaos↔order (5/5), light↔darkness (5/5)
// Creation: force↔mind (3/5), life↔entropy (4/5), energy↔spirit (2/5), matter↔time (2/5)
export const SPHERE_OPPOSITES: Record<SphereName, SphereName | null> = {
  // Foundation opposites (maximum opposition 5/5)
  chaos: 'order',
  order: 'chaos',
  light: 'darkness',
  darkness: 'light',
  // Creation opposites (from The Cosmological Pattern)
  force: 'mind',
  matter: 'time',
  energy: 'spirit',
  life: 'entropy',
  mind: 'force',
  spirit: 'energy',
  time: 'matter',
  entropy: 'life',
};

/**
 * Sphere opposition lookup — symmetric pairs for resolution modifier pipeline.
 * Guaranteed non-null for all 12 spheres.
 */
export const SPHERE_OPPOSITIONS: Record<SphereName, SphereName> = {
  chaos: 'order',
  order: 'chaos',
  light: 'darkness',
  darkness: 'light',
  force: 'mind',
  matter: 'time',
  energy: 'spirit',
  life: 'entropy',
  mind: 'force',
  spirit: 'energy',
  time: 'matter',
  entropy: 'life',
};

export const COSMOLOGY_PRESETS: Record<string, CosmologyProfile> = {
  balanced: {
    chaos: 1/12, order: 1/12, light: 1/12, darkness: 1/12,
    force: 1/12, matter: 1/12, energy: 1/12, life: 1/12,
    mind: 1/12, spirit: 1/12, time: 1/12, entropy: 1/12,
  },
  elemental_dominance: {
    chaos: 0.04, order: 0.02, light: 0.04, darkness: 0.02,
    force: 0.14, matter: 0.14, energy: 0.18, life: 0.08,
    mind: 0.06, spirit: 0.06, time: 0.10, entropy: 0.12,
  },
  living_world: {
    chaos: 0.02, order: 0.06, light: 0.06, darkness: 0.02,
    force: 0.06, matter: 0.08, energy: 0.08, life: 0.22,
    mind: 0.10, spirit: 0.12, time: 0.08, entropy: 0.10,
  },
  mystic_realm: {
    chaos: 0.02, order: 0.04, light: 0.02, darkness: 0.08,
    force: 0.04, matter: 0.04, energy: 0.08, life: 0.06,
    mind: 0.18, spirit: 0.20, time: 0.14, entropy: 0.10,
  },
  entropic: {
    chaos: 0.08, order: 0.02, light: 0.02, darkness: 0.06,
    force: 0.08, matter: 0.04, energy: 0.10, life: 0.04,
    mind: 0.06, spirit: 0.04, time: 0.10, entropy: 0.36,
  },
  material: {
    chaos: 0.02, order: 0.08, light: 0.04, darkness: 0.02,
    force: 0.16, matter: 0.26, energy: 0.08, life: 0.06,
    mind: 0.06, spirit: 0.04, time: 0.10, entropy: 0.08,
  },
};
