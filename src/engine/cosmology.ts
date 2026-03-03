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

// Cosmology sphere allies and opposites (for future magic system)
export const SPHERE_ALLIES: Record<SphereName, SphereName | null> = {
  force: 'matter',
  matter: 'force',
  energy: 'life',
  life: 'energy',
  mind: 'spirit',
  spirit: 'mind',
  time: 'entropy',
  entropy: 'time',
};

export const SPHERE_OPPOSITES: Record<SphereName, SphereName | null> = {
  force: 'energy',
  matter: 'spirit',
  energy: 'force',
  life: 'entropy',
  mind: 'time',
  spirit: 'matter',
  time: 'mind',
  entropy: 'life',
};

export const COSMOLOGY_PRESETS: Record<string, CosmologyProfile> = {
  balanced: {
    force: 0.125,
    matter: 0.125,
    energy: 0.125,
    life: 0.125,
    mind: 0.125,
    spirit: 0.125,
    time: 0.125,
    entropy: 0.125,
  },
  elemental_dominance: {
    force: 0.20,
    matter: 0.20,
    energy: 0.25,
    life: 0.10,
    mind: 0.08,
    spirit: 0.08,
    time: 0.04,
    entropy: 0.05,
  },
  living_world: {
    force: 0.10,
    matter: 0.12,
    energy: 0.10,
    life: 0.30,
    mind: 0.12,
    spirit: 0.15,
    time: 0.08,
    entropy: 0.03,
  },
  mystic_realm: {
    force: 0.08,
    matter: 0.05,
    energy: 0.12,
    life: 0.10,
    mind: 0.25,
    spirit: 0.28,
    time: 0.10,
    entropy: 0.02,
  },
  entropic: {
    force: 0.12,
    matter: 0.08,
    energy: 0.15,
    life: 0.05,
    mind: 0.08,
    spirit: 0.08,
    time: 0.12,
    entropy: 0.32,
  },
  material: {
    force: 0.22,
    matter: 0.35,
    energy: 0.12,
    life: 0.08,
    mind: 0.08,
    spirit: 0.08,
    time: 0.04,
    entropy: 0.03,
  },
};
