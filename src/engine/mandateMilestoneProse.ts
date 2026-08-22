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
 * TODO(THR-1198): the 48 authored strings are keyed to the 12 template mandate ids,
 * and no live game instantiates one — both `gameInit` writers call
 * `generateRememberedMandate`, and `generateMandate` (the only route to a
 * `MANDATE_TEMPLATES` id) has no production caller. So every live resolution today
 * takes the fallback branch. The wiring is correct and waiting on content or a
 * design ruling, not on more engine work; watch the `mandate_milestone_prose` trace
 * for `authored: true` to know when that lands.
 */

import { MANDATE_MILESTONE_PROSE } from '../data/mandate-content';
import type { MandateStage } from '../types/mandate';

/** The four authored transitions every mandate JSON is required to carry. */
export type MandateProseTransition =
  | 'setup_to_escalation'
  | 'escalation_to_culmination'
  | 'completed'
  | 'failed';

/** Lookup result. `authored` records whether the JSON supplied the text. */
export interface ResolvedMilestoneProse {
  text: string;
  authored: boolean;
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

/**
 * Resolve the authored line for `{mandateId}.{transition}`, falling back to
 * `fallback` when nothing was authored for this mandate.
 */
export function resolveMilestoneProse(
  mandateId: string,
  transition: MandateProseTransition,
  fallback: string,
): ResolvedMilestoneProse {
  const key = `${toProseKeyPrefix(mandateId)}.${transition}`;
  const authored = MANDATE_MILESTONE_PROSE[key];
  if (typeof authored === 'string' && authored.length > 0) {
    return { text: authored, authored: true };
  }
  return { text: fallback, authored: false };
}
