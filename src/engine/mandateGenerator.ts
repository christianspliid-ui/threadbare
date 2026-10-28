/**
 * Mandate Generator — builds the mandate a run is played against.
 *
 * One producer: `generateRememberedMandate`. The run's spine is what the god
 * remembers (ruled 2026-09-11, THR-1198) — the player picks a Hunger in
 * remembrance, and the mandate is derived from its sphere alignment.
 *
 * This module also held `generateMandate`, a sphere-weighted PRNG selection over
 * the 12 `MANDATE_TEMPLATES`. It was retired by THR-1198: it had no production
 * caller, so the only route to a template-mandate id was its own tests. A named
 * campaign the world offers would be a second way of choosing what a run is
 * about, competing with the choice the player already made in remembrance. The
 * templates survive as a catalogue (CMS browser, `mandate.*` tooltips); nothing
 * instantiates one.
 */

import type { SphereName } from '../types/index';
import type { SphereAlignment } from '../types/influence';
import type {
  MandateCourtType,
  MandateDefinition,
  MandateSecondaryObjectiveDefinition,
} from '../types/mandate';
import type { SphereAggregate } from '../types/worldSoul';
import type { AscendantIdentity } from '../types/remembrance';

// ─── Constants (from central config) ─────────────────────────────────────

import {
  MANDATE_ABYSS_SECONDARY_TARGET,
  MANDATE_CHECKPOINT_THRESHOLDS,
  MANDATE_CIRCLE_SECONDARY_TARGET,
  MANDATE_HIGH_HOUSE_SECONDARY_TARGET,
  MANDATE_PRIMARY_TARGET_DELTA,
  MANDATE_SECONDARY_TARGET_DELTA,
  MANDATE_WEB_SECONDARY_TARGET,
} from '../data/game-config';

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
      `Raise ${formatSphereName(primarySphere)} and ${formatSphereName(secondarySphere)} in the world by your own hand before the doom clock closes`,
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
    // THR-2081: the target is points of the god's own making, set at the settle; the
    // words name the rule (only the god's doing counts), never a percentage.
    description: mandateDirection,
    stages: [
      {
        stage: 'setup',
        description: 'Establish the opening momentum before the first omen ripens.',
        conditions: [
          {
            type: 'custom',
            description: `By the ${checkpoints[0].label}: ${formatSphereName(primarySphere)} raised by your hand, on pace.`,
          },
          {
            type: 'custom',
            description: `By the ${checkpoints[0].label}: ${formatSphereName(secondarySphere)} raised by your hand, on pace.`,
          },
        ],
      },
      {
        stage: 'escalation',
        description: 'Hold the middle game as the world begins to answer back.',
        conditions: [
          {
            type: 'custom',
            description: `By the ${checkpoints[1].label}: ${formatSphereName(primarySphere)} and ${formatSphereName(secondarySphere)} raised by your hand, on pace.`,
          },
          {
            type: 'custom',
            description: `By the ${checkpoints[2].label}: ${formatSphereName(primarySphere)} and ${formatSphereName(secondarySphere)} raised by your hand, on pace.`,
          },
        ],
      },
      {
        stage: 'culmination',
        description: 'Enter the climax having bent the world toward your remembered pattern.',
        conditions: [
          {
            type: 'custom',
            description: `Your hand has raised ${formatSphereName(primarySphere)} far enough.`,
          },
          {
            type: 'custom',
            description: `Your hand has raised ${formatSphereName(secondarySphere)} far enough.`,
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
