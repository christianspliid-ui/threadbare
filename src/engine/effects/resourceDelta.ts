/**
 * Resource Delta — one-shot resource mutation for encounter/reward resolution.
 *
 * Applies an immediate change to essence, quintessence, or doom.
 * Clamps to valid range and respects per-resource caps.
 *
 * Not ticked — fires once at resolution or reward time.
 *
 * TB-104 Phase 1B
 */

import type { ResourceDeltaEffect, ResourceDeltaAppliedTraceDetails } from '../../types/effects';
import {
  RESOURCE_DELTA_ESSENCE_CAP,
  RESOURCE_DELTA_QUINTESSENCE_CAP,
  RESOURCE_DELTA_DOOM_CAP,
} from '../../data/effect-constants';

export interface ResourceDeltaInput {
  essence?: number;
  quintessence?: number;
  quintessenceMax?: number;
  doom?: number;
  doomThreshold?: number;
}

export interface ResourceDeltaResult {
  applied: boolean;
  after: number;
  trace: ResourceDeltaAppliedTraceDetails;
}

const CAPS: Record<string, number> = {
  essence: RESOURCE_DELTA_ESSENCE_CAP,
  quintessence: RESOURCE_DELTA_QUINTESSENCE_CAP,
  doom: RESOURCE_DELTA_DOOM_CAP,
};

export function applyResourceDelta(
  effect: ResourceDeltaEffect,
  agentResources: ResourceDeltaInput,
  agentId: string,
  source: ResourceDeltaAppliedTraceDetails['source'],
  sourceAttachmentId?: string,
): ResourceDeltaResult {
  const cap = CAPS[effect.resource];
  if (cap === undefined) {
    return {
      applied: false,
      after: 0,
      trace: {
        actorId: agentId,
        resource: effect.resource,
        amount: effect.amount,
        before: 0,
        after: 0,
        source,
        sourceAttachmentId,
      },
    };
  }

  // Clamp delta magnitude to per-resource cap
  const clampedDelta = Math.sign(effect.amount) * Math.min(Math.abs(effect.amount), cap);

  let before: number;
  let max: number;

  switch (effect.resource) {
    case 'essence':
      before = agentResources.essence ?? 0;
      max = Infinity;
      break;
    case 'quintessence':
      before = agentResources.quintessence ?? 0;
      max = agentResources.quintessenceMax ?? Infinity;
      break;
    case 'doom':
      before = agentResources.doom ?? 0;
      max = agentResources.doomThreshold ?? Infinity;
      break;
  }

  const after = Math.max(0, Math.min(max, before + clampedDelta));

  return {
    applied: true,
    after,
    trace: {
      actorId: agentId,
      resource: effect.resource,
      amount: effect.amount,
      before,
      after,
      source,
      sourceAttachmentId,
    },
  };
}
