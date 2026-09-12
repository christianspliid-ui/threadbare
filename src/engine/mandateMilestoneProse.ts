/**
 * Mandate milestone prose resolution — THR-1197.
 *
 * The authored strings live in the 12 mandate JSON files under `src/data/mandates/`,
 * keyed `{mandate_id}.{transition}` by the loader. This module is the production
 * consumer of that map: it turns a live mandate id plus a stage transition into the
 * authored line, and falls back to caller-supplied generated text whenever no line
 * was written for that mandate (NFP #4 — resolution never throws).
 *
 * Why a keyed map rather than a field on `MandateDefinition`: remembrance
 * (`runtimeKind: 'sphere_growth'`) mandates are generated at runtime by
 * `generateRememberedMandate` and never pass through the loader, so a
 * `milestoneProse` field would be structurally `undefined` on every mandate a live
 * game creates. A field that is always empty reads as "this mandate has no prose"
 * when the truth is "this mandate family has no authored prose at all". The keyed
 * map keeps one source of truth (the JSON) and leaves the miss explicit and
 * traceable at the call site via `ResolvedMilestoneProse.authored`.
 *
 * THR-1198 closed the gap this module was built ahead of. The fork — does a run's
 * spine come from what the god remembers, or from a named campaign the world
 * offers — was ruled for remembrance, so the authored prose is now keyed to the
 * two ids a live game actually mints and the template prose was retired with
 * `generateMandate`. See `src/data/mandate-remembrance-prose.ts` for the content
 * and the two-table rationale.
 */

import { MANDATE_MILESTONE_PROSE } from '../data/mandate-content';
import type { SphereName } from '../types/index';
import type { MandateStage } from '../types/mandate';

/** The four authored transitions every mandate JSON is required to carry. */
export type MandateProseTransition =
  | 'setup_to_escalation'
  | 'escalation_to_culmination'
  | 'completed'
  | 'failed';

/** Lookup result. `authored` records whether the content supplied the text. */
export interface ResolvedMilestoneProse {
  text: string;
  authored: boolean;
  /**
   * The key that produced `text`, or `undefined` on the fallback branch. Traced
   * so a run that narrates from the sphere family rather than the god's own
   * Hunger is visible as such rather than indistinguishable from an exact hit
   * (NFP #2).
   */
  key?: string;
}

const STAGE_ORDER: MandateStage[] = ['setup', 'escalation', 'culmination'];
const MANDATE_ID_NAMESPACE = 'mandate.';

/**
 * Strip the `mandate.` namespace the JSON ids carry — the loader keys prose
 * without it. An id lacking the prefix passes through unchanged.
 */
function toProseKeyPrefix(mandateId: string): string {
  return mandateId.startsWith(MANDATE_ID_NAMESPACE)
    ? mandateId.slice(MANDATE_ID_NAMESPACE.length)
    : mandateId;
}

/**
 * Which authored transition a stage change represents, or `undefined` for a
 * non-advance (same stage, or a backwards move) so callers emit nothing.
 *
 * A `setup` → `culmination` jump is reachable: a sphere-growth mandate that passes
 * three checkpoints in one tick moves two stages at once. It reads as the later
 * transition, because that is the threshold the world actually crossed.
 */
export function transitionForStageChange(
  from: MandateStage,
  to: MandateStage,
): MandateProseTransition | undefined {
  const fromIndex = STAGE_ORDER.indexOf(from);
  const toIndex = STAGE_ORDER.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || toIndex <= fromIndex) return undefined;
  return toIndex >= STAGE_ORDER.indexOf('culmination')
    ? 'escalation_to_culmination'
    : 'setup_to_escalation';
}

/** The sphere-family key a remembrance mandate falls back to. */
function sphereFamilyKey(
  primarySphere: SphereName,
  transition: MandateProseTransition,
): string {
  return `remembrance.sphere.${primarySphere}.${transition}`;
}

function lookup(key: string): string | undefined {
  const text = MANDATE_MILESTONE_PROSE[key];
  return typeof text === 'string' && text.length > 0 ? text : undefined;
}

/**
 * Resolve the authored line for `{mandateId}.{transition}`, falling back to
 * `fallback` when nothing was authored for this mandate.
 *
 * Two authored branches, tried in order:
 *
 * 1. The mandate's own id — `remembrance.{hunger}` on the identity path, which is
 *    what every real playthrough holds.
 * 2. `primarySphere`'s family, when given. This is what carries the identity-less
 *    path (`remembrance.{primary}_{secondary}`): its key space is 132 ordered
 *    pairs, so it is authored per primary sphere — 12 rows covering all 132 —
 *    rather than per pair. Passing the sphere from the live `MandateDefinition`
 *    keeps the derivation out of id string-parsing, where a Hunger named after a
 *    sphere would one day collide.
 *
 * Never throws (NFP #4): an id with nothing authored on either branch narrates
 * from `fallback`, and the caller's trace records which branch won.
 */
export function resolveMilestoneProse(
  mandateId: string,
  transition: MandateProseTransition,
  fallback: string,
  primarySphere?: SphereName,
): ResolvedMilestoneProse {
  const exactKey = `${toProseKeyPrefix(mandateId)}.${transition}`;
  const exact = lookup(exactKey);
  if (exact) return { text: exact, authored: true, key: exactKey };

  if (primarySphere) {
    const familyKey = sphereFamilyKey(primarySphere, transition);
    const family = lookup(familyKey);
    if (family) return { text: family, authored: true, key: familyKey };
  }

  return { text: fallback, authored: false };
}
