/**
 * Rival God Generator — procedural cosmic adversary creation.
 */
import type { CosmologyProfile, SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type {
  RivalDefinition,
  RivalState,
  RivalAction,
} from '../types/rival';
import type { GameState, ActiveComposition } from '../types/gameState';
import type { Phase } from '../composition-dsl/schema';
import type { ThreadEdgeProperties } from '../types/influence';
import {
  RIVAL_NAME_PREFIXES,
  RIVAL_NAME_SUFFIXES,
  BEHAVIORS,
  BEHAVIOR_WEIGHTS,
  ACTION_TYPES,
} from '../data/rival-content';
import { IDENTITY_RIVAL_BIAS_WEIGHT } from '../types/doomIdentity';
import {
  RIVAL_MAX_ESCALATION_TIER,
  RIVAL_MAX_CONCURRENT_SCHEMES,
  RIVAL_SCHEME_LAUNCH_COOLDOWN_TICKS,
  RIVAL_SCHEME_PROBE_WEIGHT,
  RIVAL_ESCALATION_DOOM_WEIGHT,
  RIVAL_ESCALATION_ADVANCEMENT_WEIGHT,
  RIVAL_SCHEME_STOCK_SCAN_CAP,
} from '../data/rival-scheme-config';
import { readResources } from './resourceEconomy';
import {
  eligibleSchemeFamilies,
  type RivalSchemeFamily,
} from '../data/rival-schemes';

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
  /** Doom identity rival-behavior bias — weight deltas scaled by IDENTITY_RIVAL_BIAS_WEIGHT. */
  identityBias?: Partial<Record<string, number>>,
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
  // Apply doom identity bias (scaled; already bounded at source via data authoring)
  if (identityBias) {
    for (const actionType of ACTION_TYPES) {
      const delta = (identityBias[actionType] ?? 0) * IDENTITY_RIVAL_BIAS_WEIGHT;
      adjustedWeights[actionType] = Math.max(0, adjustedWeights[actionType] + delta);
    }
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

// ─── Rival Schemes (THR-66) ──────────────────────────────────────
//
// A scheme is a four-phase arc riding the THR-225 composition phase runner.
// The rival invests each tick to arm the next phase via world-flags; the
// runner activates armed phases; phaseRivalActions executes each phase's
// concrete move on activation. Selection, escalation, and the launch builder
// below are pure + deterministic (NFP #3): all randomness comes from the
// seeded rival rng passed in — no Math.random().

/** World-flag key helpers — the single source of truth for scheme flag names,
 *  shared by the launch builder and phaseRivalActions so they never drift. */
export const schemeFlags = {
  ready: (compositionId: string, phaseId: string) =>
    `scheme.${compositionId}.${phaseId}-ready`,
  moveDone: (compositionId: string, phaseId: string) =>
    `scheme.${compositionId}.${phaseId}-done`,
  invest: (compositionId: string) => `scheme.${compositionId}.invest`,
  counters: (compositionId: string) => `scheme.${compositionId}.counters`,
  stallUntil: (compositionId: string) => `scheme.${compositionId}.stall-until`,
  completedNoted: (compositionId: string) => `scheme.${compositionId}.completed-noted`,
} as const;

/**
 * Escalation tier (0..RIVAL_MAX_ESCALATION_TIER), a pure function of state.
 * Blends the doom-clock stage with a player-advancement proxy (highest thread
 * InfluenceTier). Fail-soft to doom-stage-only when no thread proxy is readable
 * (Step 0.3). Monotonic in both inputs → satisfies exit criterion 3.
 */
export function computeRivalEscalationTier(state: GameState): number {
  // Doom component: currentStage is 1..5 → normalize to 0..1.
  const stage = state.doomClock?.currentStage ?? 1;
  const doomComponent = Math.max(0, Math.min(1, (stage - 1) / 4));

  // Advancement proxy: highest InfluenceTier (0..4) across the ascendant's
  // thread edges → normalize to 0..1. Fail-soft to 0 if unreadable.
  let advancementComponent = 0;
  try {
    const ascendantId = state.ascendantId;
    if (ascendantId) {
      const threads = state.graph.getOutgoingEdges(ascendantId, 'thread');
      let maxTier = 0;
      for (const edge of threads) {
        const tier = (edge.properties as unknown as ThreadEdgeProperties)?.tier ?? 0;
        if (tier > maxTier) maxTier = tier;
      }
      advancementComponent = Math.max(0, Math.min(1, maxTier / 4));
    }
  } catch {
    advancementComponent = 0; // fail-soft to doom-stage-only
  }

  const blended =
    RIVAL_ESCALATION_DOOM_WEIGHT * doomComponent +
    RIVAL_ESCALATION_ADVANCEMENT_WEIGHT * advancementComponent;

  // Map 0..1 → 0..RIVAL_MAX_ESCALATION_TIER (integer, clamped).
  const tier = Math.floor(blended * (RIVAL_MAX_ESCALATION_TIER + 1));
  return Math.max(0, Math.min(RIVAL_MAX_ESCALATION_TIER, tier));
}

/**
 * True when the world carries the Mortal Economy stock substrate (THR-615) —
 * i.e. at least one location has a non-empty `resources` bag. Gates the economic
 * scheme family (THR-619), which reads and drains those stocks.
 *
 * Short-circuits on the first stocked location and scans at most
 * `RIVAL_SCHEME_STOCK_SCAN_CAP` locations, so the cost is bounded on large maps.
 * Fail-soft: any graph read failure reports `false` (family stays ineligible)
 * rather than throwing into the tick loop (NFP #4).
 */
export function worldHasResourceStocks(state: GameState): boolean {
  try {
    const locations = state.graph.getNodesByType('location');
    const scanLimit = Math.min(locations.length, RIVAL_SCHEME_STOCK_SCAN_CAP);
    for (let i = 0; i < scanLimit; i++) {
      const resources = readResources(locations[i].properties);
      for (const instance of Object.values(resources)) {
        if (instance && typeof instance.quantity === 'number') return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Decide whether a rival launches a scheme this action tick, and which family.
 * Returns the chosen family, or null (meaning: make a cheap probe move instead).
 * Pure — consumes the seeded rival rng stream.
 *
 * `worldHasStocks` (THR-619) and `worldHasPlayerSource` (THR-621) gate
 * substrate-dependent families; both default to `false` so a caller that has not
 * measured the world never launches one.
 */
export function selectRivalScheme(
  rival: RivalDefinition,
  rivalState: RivalState,
  escalationTier: number,
  launchTick: number,
  rng: () => number,
  worldHasStocks: boolean = false,
  worldHasPlayerSource: boolean = false,
): { family: RivalSchemeFamily | null; reason: string } {
  // Capacity gate.
  const activeCount = (rivalState.activeSchemeIds ?? []).length;
  const cap =
    RIVAL_MAX_CONCURRENT_SCHEMES[
      Math.min(escalationTier, RIVAL_MAX_CONCURRENT_SCHEMES.length - 1)
    ] ?? 1;
  if (activeCount >= cap) {
    return { family: null, reason: 'at-capacity' };
  }

  // Cadence gate.
  const lastLaunch = rivalState.lastSchemeLaunchTick;
  if (
    lastLaunch !== undefined &&
    launchTick - lastLaunch < RIVAL_SCHEME_LAUNCH_COOLDOWN_TICKS
  ) {
    return { family: null, reason: 'cooldown' };
  }

  // Eligibility.
  const eligible = eligibleSchemeFamilies(
    rival.behavior,
    escalationTier,
    worldHasStocks,
    worldHasPlayerSource,
  );
  if (eligible.length === 0) {
    return { family: null, reason: 'no-eligible-family' };
  }

  // Probe vs launch.
  if (rng() < RIVAL_SCHEME_PROBE_WEIGHT) {
    return { family: null, reason: 'probe' };
  }

  const pick = eligible[Math.floor(rng() * eligible.length)] ?? eligible[0];
  return { family: pick, reason: 'launch' };
}

/** The outcome of building a scheme launch — applied immutably by
 *  phaseRivalActions or in-place by the debug bridge. */
export interface SchemeLaunchPlan {
  composition: ActiveComposition;
  /** world-flag deltas to merge: phase-1 armed + invest counter reset. */
  worldFlagUpdates: Record<string, unknown>;
  /** rivalState with activeSchemeIds + lastSchemeLaunchTick updated. */
  updatedRivalState: RivalState;
}

function substituteSchemeProse(
  raw: string,
  rivalName: string,
  targetName: string,
): string {
  return raw
    .replace(/\{rival\}/g, rivalName)
    .replace(/\{location\}/g, targetName)
    .replace(/\{target\}/g, targetName);
}

/**
 * Build a scheme launch: a four-phase ActiveComposition attributed to the
 * rival, plus the world-flag deltas that arm phase 1. Pure — the seeded
 * variantRng picks one prose variant per beat and bakes it into the phase
 * rationale so the runner's Chronicle entry is attributed.
 */
export function buildRivalScheme(
  rival: RivalDefinition,
  rivalState: RivalState,
  family: RivalSchemeFamily,
  _escalationTier: number,
  launchTick: number,
  targetLocationId: string | undefined,
  targetLocationName: string | undefined,
  variantRng: () => number,
): SchemeLaunchPlan {
  const compositionId = `rival-scheme-${rival.id}-${family.id}-t${launchTick}`;
  const targetName = targetLocationName ?? 'the reach';

  const phases: Phase[] = family.beats.map((beat) => {
    const variants = beat.proseVariants;
    const chosen = variants[Math.floor(variantRng() * variants.length)] ?? variants[0];
    return {
      id: beat.phaseId,
      activatesAt: {
        op: 'world-flag',
        key: schemeFlags.ready(compositionId, beat.phaseId),
        value: true,
      },
      activates: [],
      rationale: substituteSchemeProse(chosen, rival.name, targetName),
    };
  });

  const composition: ActiveComposition = {
    compositionId,
    firedAtTick: launchTick,
    activatedPhaseIds: [],
    phaseActivationTicks: {},
    resolvedNodes: targetLocationId ? { target: targetLocationId } : {},
    status: 'active',
    lastEvaluationTick: launchTick,
    phases,
    sponsorRivalId: rival.id,
    schemeFamily: family.id,
  };

  const worldFlagUpdates: Record<string, unknown> = {
    [schemeFlags.ready(compositionId, family.beats[0].phaseId)]: true,
    [schemeFlags.invest(compositionId)]: 0,
  };

  const updatedRivalState: RivalState = {
    ...rivalState,
    activeSchemeIds: [...(rivalState.activeSchemeIds ?? []), compositionId],
    lastSchemeLaunchTick: launchTick,
  };

  return { composition, worldFlagUpdates, updatedRivalState };
}
