/**
 * Agreement edge shape — the one reader every agreement consumer goes through (THR-1920).
 *
 * Agreements are `relates_to` edges, and two writers put them on the graph in two shapes:
 *
 * - **Flat** — `instantiateAgreementReward` (`rewardPool.ts`), the path every encounter
 *   `attachment_grant` of an `agreement.*` template takes: `agreement: true`, with
 *   `agreementType`, `tier`, `tags`, `terms` and `ticksRemaining` as siblings on the edge.
 * - **Nested** — the dev fixture in `gameInit.ts` (and any save written from it):
 *   `agreement: { type, tier, tags, terms, fulfillmentCondition, ticksRemaining }`.
 *
 * Readers used to cast `properties.agreement` to an object and read `.type`, which is
 * `undefined` on `true` — so no encounter-granted debt ever counted toward debt-laden and
 * every one was labelled a pact. `readAgreement` accepts both shapes and returns the nested
 * one. Neither writer changes (NFP 6): saved games of either shape keep reading.
 *
 * Pure, fail-soft: a non-agreement edge or a malformed one returns `null`, never throws.
 */

import type { AgreementProperties, AgreementType, AttachmentTier } from '../types/attachments';

/** Which writer's shape the edge carries — the debt counter's direction rule keys on it. */
export type AgreementShape = 'flat' | 'nested';

export interface ReadAgreement extends Partial<AgreementProperties> {
  shape: AgreementShape;
  /** Flat shape only: the tick the reward writer stamped. Its `ticksRemaining` is the full term from here. */
  acquiredTick?: number;
  /** `false` when the edge carries `active: false`. */
  active: boolean;
}

/**
 * Has this agreement stopped binding at `tick`?
 *
 * Nothing on the graph counts an agreement edge's `ticksRemaining` down or removes the edge when
 * its term ends, so the flat reward shape's term is read here instead: the writer stamps
 * `acquiredTick` and the full term, and the agreement lapses once `tick` reaches their sum.
 * A null term never lapses. The nested shape carries no acquisition tick, so only `active`
 * can lapse it — its behaviour is unchanged.
 */
export function agreementLapsed(agreement: ReadAgreement, tick: number): boolean {
  if (!agreement.active) return true;
  if (agreement.shape !== 'flat') return false;
  const term = agreement.ticksRemaining;
  if (term == null || agreement.acquiredTick == null) return false;
  return tick >= agreement.acquiredTick + term;
}

/**
 * Read an edge's agreement in the nested shape, whichever shape it was written in.
 * Returns `null` when the edge is not an agreement (`agreement` absent or falsy).
 */
export function readAgreement(props: Record<string, unknown> | undefined): ReadAgreement | null {
  if (!props) return null;
  const raw = props.agreement;
  if (!raw) return null;

  const active = props.active !== false;

  if (typeof raw === 'object') {
    return { ...(raw as Partial<AgreementProperties>), shape: 'nested', active };
  }

  // Flat shape: the fields live beside `agreement: true` on the edge itself.
  return {
    shape: 'flat',
    active,
    acquiredTick: typeof props.acquiredTick === 'number' ? props.acquiredTick : undefined,
    type: typeof props.agreementType === 'string' ? (props.agreementType as AgreementType) : undefined,
    tier: typeof props.tier === 'number' ? (props.tier as AttachmentTier) : undefined,
    tags: Array.isArray(props.tags) ? (props.tags as string[]) : undefined,
    terms: typeof props.terms === 'string' ? props.terms : undefined,
    fulfillmentCondition: typeof props.fulfillmentCondition === 'string' ? props.fulfillmentCondition : undefined,
    ticksRemaining: typeof props.ticksRemaining === 'number' ? props.ticksRemaining : null,
  };
}
