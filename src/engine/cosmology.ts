import { FORCE_NAMES, type CosmologyProfile, type ForceName } from '../types';

export function createBalancedCosmology(): CosmologyProfile {
  const weight = 1.0 / FORCE_NAMES.length;
  return Object.fromEntries(FORCE_NAMES.map(f => [f, weight])) as CosmologyProfile;
}

export function normalizeCosmology(profile: CosmologyProfile): CosmologyProfile {
  const sum = FORCE_NAMES.reduce((s, f) => s + profile[f], 0);
  if (sum === 0) return createBalancedCosmology();
  return Object.fromEntries(
    FORCE_NAMES.map(f => [f, profile[f] / sum])
  ) as CosmologyProfile;
}

export function adjustForce(
  profile: CosmologyProfile,
  force: ForceName,
  newValue: number
): CosmologyProfile {
  const clamped = Math.max(0, Math.min(1, newValue));
  const remaining = 1.0 - clamped;
  const othersSum = FORCE_NAMES
    .filter(f => f !== force)
    .reduce((s, f) => s + profile[f], 0);

  const result = { ...profile, [force]: clamped };
  if (othersSum === 0) {
    const share = remaining / (FORCE_NAMES.length - 1);
    FORCE_NAMES.filter(f => f !== force).forEach(f => { result[f] = share; });
  } else {
    FORCE_NAMES.filter(f => f !== force).forEach(f => {
      result[f] = (profile[f] / othersSum) * remaining;
    });
  }
  return result;
}

export const FORCE_ALLIES: Record<ForceName, ForceName | null> = {
  aether: 'umbra',
  umbra: 'aether',
  verdance: 'terra',
  terra: 'verdance',
  ignis: null,
};

export const FORCE_OPPOSITES: Record<ForceName, ForceName | null> = {
  aether: 'terra',
  terra: 'aether',
  verdance: 'umbra',
  umbra: 'verdance',
  ignis: null,
};

export const COSMOLOGY_PRESETS: Record<string, CosmologyProfile> = {
  balanced:          { aether: 0.20, verdance: 0.20, ignis: 0.20, umbra: 0.20, terra: 0.20 },
  arcane_dominance:  { aether: 0.40, verdance: 0.10, ignis: 0.15, umbra: 0.25, terra: 0.10 },
  wild_growth:       { aether: 0.10, verdance: 0.40, ignis: 0.10, umbra: 0.10, terra: 0.30 },
  scorched:          { aether: 0.10, verdance: 0.05, ignis: 0.45, umbra: 0.15, terra: 0.25 },
  shadowed:          { aether: 0.20, verdance: 0.10, ignis: 0.10, umbra: 0.45, terra: 0.15 },
  fortress_world:    { aether: 0.10, verdance: 0.15, ignis: 0.15, umbra: 0.10, terra: 0.50 },
};
