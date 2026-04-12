/**
 * Mandate Generator — Sphere-weighted PRNG mandate selection.
 *
 * Uses seeded PRNG (mulberry32) to deterministically select a mandate template
 * based on weighted probabilities derived from ascendant sphere alignment.
 *
 * Weights:
 * - PRIMARY_WEIGHT = 3: template includes alignment.primary
 * - SECONDARY_WEIGHT = 2: template includes alignment.secondary
 * - BASE_WEIGHT = 1: no match (all templates are eligible)
 * - SIMULATION_ACHIEVABLE_MULTIPLIER = 2: simulation_achievable type gets 2x boost
 *
 * Selection uses weighted random based on these scores.
 */

import type { CosmologyProfile, SphereName } from '../types/index';
import type { SphereAlignment } from '../types/influence';
import type {
  MandateCourtType,
  MandateDefinition,
  MandateSecondaryObjectiveDefinition,
} from '../types/mandate';
import type { SphereAggregate } from '../types/worldSoul';
import type { AscendantIdentity } from '../types/remembrance';
import type { MandateTemplate } from '../data/mandate-content';
import { MANDATE_TEMPLATES } from '../data/mandate-content';

// ─── Constants (from central config) ─────────────────────────────────────

import {
  MANDATE_PRIMARY_WEIGHT as PRIMARY_WEIGHT,
  MANDATE_SECONDARY_WEIGHT as SECONDARY_WEIGHT,
  MANDATE_BASE_WEIGHT as BASE_WEIGHT,
  MANDATE_ACHIEVABLE_MULTIPLIER as SIMULATION_ACHIEVABLE_MULTIPLIER,
  MANDATE_ABYSS_SECONDARY_TARGET,
  MANDATE_CHECKPOINT_THRESHOLDS,
  MANDATE_CIRCLE_SECONDARY_TARGET,
  MANDATE_HIGH_HOUSE_SECONDARY_TARGET,
  MANDATE_PRIMARY_TARGET_DELTA,
  MANDATE_SECONDARY_TARGET_DELTA,
  MANDATE_WEB_SECONDARY_TARGET,
} from '../data/game-config';

// ─── Seeded PRNG (same as orchestrator.ts) ────────────────────────────────

/**
 * Mulberry32 PRNG factory.
 * Same implementation as orchestrator.ts to ensure consistency.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Remembrance-driven mandate generation ──────────────────────────────────

export interface RememberedMandateOptions {
  alignment: SphereAlignment;
  aggregate: SphereAggregate;
  identity?: Pick<
    AscendantIdentity,
    'courtType' | 'mandateDirection' | 'hungerId' | 'hungerName'
  > | null;
}

const OMEN_LABELS = ['First Omen', 'Second Omen', 'Third Omen', 'Final Omen'] as const;

function formatSphereName(sphere: SphereName): string {
  if (!sphere) return 'Unknown';
  return sphere.charAt(0).toUpperCase() + sphere.slice(1);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildSecondaryObjective(
  courtType: MandateCourtType | null | undefined,
): MandateSecondaryObjectiveDefinition | undefined {
  switch (courtType) {
    case 'web':
      return {
        type: 'web_relationships',
        label: 'Web of Threads',
        description: `Hold ${MANDATE_WEB_SECONDARY_TARGET} live threads in your court network.`,
        target: MANDATE_WEB_SECONDARY_TARGET,
      };
    case 'circle':
      return {
        type: 'circle_retinue',
        label: 'Gathered Circle',
        description: `Maintain ${MANDATE_CIRCLE_SECONDARY_TARGET} mortal agents within your circle.`,
        target: MANDATE_CIRCLE_SECONDARY_TARGET,
      };
    case 'high_house':
      return {
        type: 'high_house_settlements',
        label: 'Seat of Rule',
        description: `Anchor ${MANDATE_HIGH_HOUSE_SECONDARY_TARGET} settlements beneath your court.`,
        target: MANDATE_HIGH_HOUSE_SECONDARY_TARGET,
      };
    case 'abyss':
      return {
        type: 'abyss_anomalies',
        label: 'Marked Depths',
        description: `Extend your reach across ${MANDATE_ABYSS_SECONDARY_TARGET} anomalous or ruined sites.`,
        target: MANDATE_ABYSS_SECONDARY_TARGET,
      };
    default:
      return undefined;
  }
}

export function generateRememberedMandate({
  alignment,
  aggregate,
  identity,
}: RememberedMandateOptions): MandateDefinition {
  const primarySphere = alignment.primary;
  const secondarySphere = alignment.secondary;
  const primaryBaseline = aggregate.totalBySphere[primarySphere] ?? 0;
  const secondaryBaseline = aggregate.totalBySphere[secondarySphere] ?? 0;
  const checkpoints = MANDATE_CHECKPOINT_THRESHOLDS.map((threshold, index) => ({
    index,
    doomProgressThreshold: threshold,
    label: OMEN_LABELS[index],
    description: `${OMEN_LABELS[index]} must find ${formatSphereName(primarySphere)} and ${formatSphereName(secondarySphere)} still rising.`,
    requiredPrimaryDelta: MANDATE_PRIMARY_TARGET_DELTA * threshold,
    requiredSecondaryDelta: MANDATE_SECONDARY_TARGET_DELTA * threshold,
  }));
  const mandateDirection = ensureSentence(
    identity?.mandateDirection ??
      `Raise the global strength of ${formatSphereName(primarySphere)} and ${formatSphereName(secondarySphere)} before the doom clock closes`,
  );

  return {
    id: identity?.hungerId
      ? `mandate.remembrance.${identity.hungerId.split('.').pop()}`
      : `mandate.remembrance.${primarySphere}_${secondarySphere}`,
    type: 'sphere_dominance',
    runtimeKind: 'sphere_growth',
    name: identity?.hungerName
      ? `${identity.hungerName} Ascendancy`
      : `${formatSphereName(primarySphere)} Ascendancy`,
    description: `${mandateDirection} Increase ${formatSphereName(primarySphere)} by ${formatPercent(MANDATE_PRIMARY_TARGET_DELTA)} and ${formatSphereName(secondarySphere)} by ${formatPercent(MANDATE_SECONDARY_TARGET_DELTA)} before doom expires.`,
    stages: [
      {
        stage: 'setup',
        description: 'Establish the opening momentum before the first omen ripens.',
        conditions: [
          {
            type: 'custom',
            description: `By ${formatPercent(checkpoints[0].doomProgressThreshold)} doom: ${formatSphereName(primarySphere)} +${formatPercent(checkpoints[0].requiredPrimaryDelta)}.`,
          },
          {
            type: 'custom',
            description: `By ${formatPercent(checkpoints[0].doomProgressThreshold)} doom: ${formatSphereName(secondarySphere)} +${formatPercent(checkpoints[0].requiredSecondaryDelta)}.`,
          },
        ],
      },
      {
        stage: 'escalation',
        description: 'Hold the middle game as the world begins to answer back.',
        conditions: [
          {
            type: 'custom',
            description: `By ${formatPercent(checkpoints[1].doomProgressThreshold)} doom: ${formatSphereName(primarySphere)} +${formatPercent(checkpoints[1].requiredPrimaryDelta)} and ${formatSphereName(secondarySphere)} +${formatPercent(checkpoints[1].requiredSecondaryDelta)}.`,
          },
          {
            type: 'custom',
            description: `By ${formatPercent(checkpoints[2].doomProgressThreshold)} doom: ${formatSphereName(primarySphere)} +${formatPercent(checkpoints[2].requiredPrimaryDelta)} and ${formatSphereName(secondarySphere)} +${formatPercent(checkpoints[2].requiredSecondaryDelta)}.`,
          },
        ],
      },
      {
        stage: 'culmination',
        description: 'Enter the climax having bent the world toward your remembered pattern.',
        conditions: [
          {
            type: 'custom',
            description: `Raise global ${formatSphereName(primarySphere)} strength by ${formatPercent(MANDATE_PRIMARY_TARGET_DELTA)}.`,
          },
          {
            type: 'custom',
            description: `Raise global ${formatSphereName(secondarySphere)} strength by ${formatPercent(MANDATE_SECONDARY_TARGET_DELTA)}.`,
          },
        ],
      },
    ],
    targetSphere: primarySphere,
    primarySphere,
    secondarySphere,
    primaryBaseline,
    secondaryBaseline,
    primaryTargetDelta: MANDATE_PRIMARY_TARGET_DELTA,
    secondaryTargetDelta: MANDATE_SECONDARY_TARGET_DELTA,
    courtType: identity?.courtType ?? undefined,
    mandateDirection: identity?.mandateDirection,
    checkpoints,
    secondaryObjective: buildSecondaryObjective(identity?.courtType),
  };
}

// ─── Mandate Generator ─────────────────────────────────────────────────────

/**
 * Score a single mandate template based on sphere alignment.
 *
 * Returns the highest weight matched:
 * - PRIMARY_WEIGHT (3) if template includes alignment.primary
 * - SECONDARY_WEIGHT (2) if template includes alignment.secondary
 * - BASE_WEIGHT (1) otherwise
 *
 * Simulation-achievable mandates receive a 2x multiplier to increase selection likelihood.
 */
function scoreTemplate(
  template: MandateTemplate,
  alignment: SphereAlignment,
): number {
  const { primary, secondary } = alignment;
  const { sphereAffinities, type } = template;

  // Compute base weight
  let baseWeight: number;
  if (sphereAffinities.includes(primary)) {
    baseWeight = PRIMARY_WEIGHT;
  } else if (sphereAffinities.includes(secondary)) {
    baseWeight = SECONDARY_WEIGHT;
  } else {
    baseWeight = BASE_WEIGHT;
  }

  // Apply simulation_achievable multiplier
  if (type === 'simulation_achievable') {
    return baseWeight * SIMULATION_ACHIEVABLE_MULTIPLIER;
  }

  return baseWeight;
}

/**
 * Generate a mandate template selection using seeded PRNG with sphere weighting.
 *
 * Deterministic: same (seed, alignment) → same mandate
 * Weighted by sphere affinity: life-primary ascendants favor life mandates
 *
 * @param cosmology Player's sphere profile (unused in current implementation, reserved for future)
 * @param alignment Primary and secondary sphere alignment
 * @param seed Seed for PRNG (e.g., worldSeed + activeTick)
 * @returns Selected MandateTemplate
 */
export function generateMandate(
  cosmology: CosmologyProfile,
  alignment: SphereAlignment,
  seed: number,
): MandateTemplate {
  // Compute scores for all templates
  const scores = MANDATE_TEMPLATES.map((template) =>
    scoreTemplate(template, alignment),
  );

  // Compute cumulative weights for weighted selection
  const cumulativeWeights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < scores.length; i++) {
    totalWeight += scores[i];
    cumulativeWeights.push(totalWeight);
  }

  // Generate random value [0, totalWeight)
  const rng = mulberry32(seed);
  const randomValue = rng() * totalWeight;

  // Find the selected template by cumulative weight
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (randomValue < cumulativeWeights[i]) {
      return MANDATE_TEMPLATES[i];
    }
  }

  // Fallback (should never reach, but safety net)
  return MANDATE_TEMPLATES[0];
}
