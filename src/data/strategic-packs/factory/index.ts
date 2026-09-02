/**
 * The factory pack (THR-1300 slice 3) — every template `compile:undertaking` emits.
 *
 * Factory output never edits a hand-written pack array: the compiler writes
 * `src/data/strategic-packs/factory/<slug>.ts` and registers the export here,
 * idempotently, and `strategicActionCandidates.ts` joins this aggregate into
 * `TEMPLATE_REGISTRY` beside the seven authored packs. Empty until the first
 * compiled package lands; the registration landmarks below are what the
 * compiler matches, so keep the shape.
 */
import type { StrategicActionTemplate } from '../../../types/strategicAction';

export const FACTORY_STRATEGIC_TEMPLATES: readonly StrategicActionTemplate[] = [
];
