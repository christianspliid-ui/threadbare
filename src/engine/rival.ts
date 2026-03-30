/**
 * Rival God Generator — procedural cosmic adversary creation.
 */
import type { CosmologyProfile, SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type {
  RivalDefinition,
  RivalState,
  RivalBehavior,
  RivalAction,
} from '../types/rival';
import {
  RIVAL_NAME_PREFIXES,
  RIVAL_NAME_SUFFIXES,
  BEHAVIORS,
  BEHAVIOR_WEIGHTS,
  ACTION_TYPES,
} from '../data/rival-content';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRivals(
  playerAlignment: CosmologyProfile,
  seed: number,
): RivalDefinition[] {
  const rng = mulberry32(seed);
  const count = 2 + Math.floor(rng() * 3);

  const playerSphereRank = [...SPHERE_NAMES].sort(
    (a, b) => playerAlignment[b] - playerAlignment[a],
  );
  const playerTopSpheres = playerSphereRank.slice(0, 2);
  const opposingSpheres = playerSphereRank.slice(-4);

  const rivals: RivalDefinition[] = [];
  const usedPrefixes = new Set<number>();
  const usedSuffixes = new Set<number>();

  for (let i = 0; i < count; i++) {
    const primaryIndex = Math.floor(rng() * opposingSpheres.length);
    const primary = opposingSpheres[primaryIndex];

    const secondaryPool = SPHERE_NAMES.filter(
      s => s !== primary && !playerTopSpheres.includes(s),
    );
    const secondary = secondaryPool[Math.floor(rng() * secondaryPool.length)];

    const profile = buildOpposingProfile(primary, secondary, rng);
    const behavior = BEHAVIORS[Math.floor(rng() * BEHAVIORS.length)];

    let prefixIdx: number;
    do { prefixIdx = Math.floor(rng() * RIVAL_NAME_PREFIXES.length); }
    while (usedPrefixes.has(prefixIdx) && usedPrefixes.size < RIVAL_NAME_PREFIXES.length);
    usedPrefixes.add(prefixIdx);

    let suffixIdx: number;
    do { suffixIdx = Math.floor(rng() * RIVAL_NAME_SUFFIXES.length); }
    while (usedSuffixes.has(suffixIdx) && usedSuffixes.size < RIVAL_NAME_SUFFIXES.length);
    usedSuffixes.add(suffixIdx);

    const name = `${RIVAL_NAME_PREFIXES[prefixIdx]} ${RIVAL_NAME_SUFFIXES[suffixIdx]}`;

    rivals.push({
      id: `actor_rival_${i + 1}`,
      name,
      sphereAlignment: profile,
      behavior,
      oppositionStrength: 0.5 + rng() * 0.5,
      description: `A ${behavior} cosmic entity aligned with ${primary} and ${secondary}`,
      primarySphere: primary,
      secondarySphere: secondary,
    });
  }

  return rivals;
}

function buildOpposingProfile(
  primary: SphereName,
  secondary: SphereName,
  rng: () => number,
): CosmologyProfile {
  const profile: Record<string, number> = {};
  let remaining = 1.0;

  const primaryWeight = 0.30 + rng() * 0.15;
  profile[primary] = primaryWeight;
  remaining -= primaryWeight;

  const secondaryWeight = 0.15 + rng() * 0.10;
  profile[secondary] = secondaryWeight;
  remaining -= secondaryWeight;

  const others = SPHERE_NAMES.filter(s => s !== primary && s !== secondary);
  const shares: number[] = others.map(() => rng());
  const shareTotal = shares.reduce((s, v) => s + v, 0);
  others.forEach((sphere, i) => {
    profile[sphere] = (shares[i] / shareTotal) * remaining;
  });

  return profile as CosmologyProfile;
}

export function createRivalState(rivalId: string): RivalState {
  return {
    rivalId,
    active: true,
    interventionCount: 0,
    agentsControlled: 0,
    regionsInfluenced: [],
    hostilityToPlayer: 0.5,
    ticksSinceAction: 0,
  };
}

// ─── Rival AI Decision Loop ──────────────────────────────────────

export function selectRivalAction(
  rival: RivalDefinition,
  state: RivalState,
  deterministicRoll?: number,
): RivalAction {
  const weights = BEHAVIOR_WEIGHTS[rival.behavior];
  // @deprecated fallback — all production callers must pass deterministicRoll (seeded via RNG).
  // Math.random() here is a safety net only; it breaks determinism (NFP #3).
  const roll = deterministicRoll ?? Math.random();

  const adjustedWeights = { ...weights };
  if (state.hostilityToPlayer > 0.7) {
    adjustedWeights.attack += 0.15;
    adjustedWeights.wait = Math.max(0, adjustedWeights.wait - 0.15);
  }

  const total = ACTION_TYPES.reduce((s, t) => s + adjustedWeights[t], 0);

  let cumulative = 0;
  for (const actionType of ACTION_TYPES) {
    cumulative += adjustedWeights[actionType] / total;
    if (roll < cumulative) {
      return { type: actionType };
    }
  }

  return { type: 'wait' };
}

export function updateRivalState(
  state: RivalState,
  action: RivalAction,
): RivalState {
  const updated = { ...state, ticksSinceAction: 0 };

  switch (action.type) {
    case 'recruit':
      updated.agentsControlled++;
      break;
    case 'intervene':
      updated.interventionCount++;
      break;
    case 'expand':
      if (action.target && !updated.regionsInfluenced.includes(action.target)) {
        updated.regionsInfluenced = [...updated.regionsInfluenced, action.target];
      }
      break;
    case 'attack':
      updated.interventionCount++;
      updated.hostilityToPlayer = Math.min(1.0, updated.hostilityToPlayer + 0.05);
      break;
    case 'wait':
      break;
  }

  return updated;
}
