/**
 * Delivery-beat adapter (THR-506)
 *
 * THR-452 found that ~0 of the ~30 hand-crafted branching encounters
 * (`src/data/encounters/`, registered as `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`)
 * ever fire in normal simulation: their prerequisites — reputation tiers, hidden
 * marks, court position, intel — are not matured by ambient mortal pathing. The
 * game's best content is unreachable.
 *
 * A *delivery beat* (the `delivery` BeatKind) sidesteps that path entirely. Instead
 * of waiting for a mortal to walk into the encounter's preconditions, the Director
 * **offers the encounter to the player-god directly, as a divine vision** — the beat
 * is the host shell and the branching encounter is the content it resolves into.
 *
 * This module is the *adapter*: it maps each branching `UnifiedActionTemplate` into a
 * lightweight delivery `BeatDefinition` the Director can schedule, and exposes the
 * eligibility filter that keeps the offered set to *currently-valid, not-yet-delivered*
 * branching encounters. The rich, player-facing offer→enter→resolve path is a
 * follow-up (TODO(THR-514)); a delivery beat's `templateId` already points at the
 * source encounter so that path — and the Director's traces today — name it.
 *
 * Load-bearing decision (matches the rest of the beat system): a delivery beat is
 * NOT a new node type. It is a `BeatDefinition` descriptor whose `templateId` is the
 * id of an already-registered branching encounter template. No content is duplicated.
 */

import type { BeatDefinition } from '../types/ascendantBeat';
import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { LOCATION_BRANCHING_ENCOUNTER_TEMPLATES } from '../data/unified-action-templates';

/** Stable prefix for every delivery beat id. A beat id is `${PREFIX}${templateId}`. */
export const DELIVERY_BEAT_ID_PREFIX = 'beat.delivery.';

/**
 * Per-beat draw weight for delivery beats (multiplies `BEAT_KIND_WEIGHTS.delivery`
 * in `drawFromPool`). NFP #1 — tunable.
 *
 * The base pool (intro/invest/select) carries a total weighted mass of ~44. With
 * ~23 delivery beats at kind-weight 2, a per-beat weight of 1 would give delivery a
 * mass of ~46 — over half of all natural draws, swamping the "occasional divine
 * vision" intent. Normalising each delivery beat down to {@link DELIVERY_BEAT_WEIGHT}
 * keeps the whole delivery group at ~10% of cadence draws (23 × 2 × 0.1 ≈ 4.6 of
 * ~48.6). Raise it to make divine visions more frequent; lower it to make them rarer.
 *
 * (Per-beat *eligibility* and identity biasing at draw time is a larger Director
 * change deferred to TODO(THR-516); until then the only live filter is dedup against
 * already-delivered beats — see {@link eligibleDeliveryBeats}.)
 */
export const DELIVERY_BEAT_WEIGHT = 0.1;

/** The delivery beat id that wraps a given source template. */
export function deliveryBeatIdFor(templateId: string): string {
  return `${DELIVERY_BEAT_ID_PREFIX}${templateId}`;
}

/** The source template id a delivery beat wraps, or null if `beatId` is not one. */
export function sourceTemplateIdOf(beatId: string): string | null {
  return beatId.startsWith(DELIVERY_BEAT_ID_PREFIX)
    ? beatId.slice(DELIVERY_BEAT_ID_PREFIX.length)
    : null;
}

/**
 * A branching encounter is *deliverable* if it is structurally a real multi-step
 * branching template (has at least one step). Fail-soft: a malformed catalogue
 * entry is silently excluded rather than offered as an empty divine vision.
 */
export function isDeliverableBranchingEncounter(template: UnifiedActionTemplate): boolean {
  return Array.isArray(template.steps) && template.steps.length > 0;
}

/**
 * Map one branching encounter template into a delivery `BeatDefinition`. Pure.
 * The beat carries `templateId` (so traces + the future resolution path name the
 * source) and a normalised draw `weight`; it grants no action card (delivery beats
 * deliver *content*, not capability — unlock_action grants belong to spine/selection
 * beats).
 */
export function branchingEncounterToDeliveryBeat(template: UnifiedActionTemplate): BeatDefinition {
  return {
    beatId: deliveryBeatIdFor(template.id),
    kind: 'delivery',
    trigger: { kind: 'cadence' },
    templateId: template.id,
    weight: DELIVERY_BEAT_WEIGHT,
  };
}

/**
 * Every delivery beat the adapter can produce, one per deliverable branching
 * encounter. Built once at module load from the registered branching catalogue.
 */
export const ALL_DELIVERY_BEATS: readonly BeatDefinition[] = LOCATION_BRANCHING_ENCOUNTER_TEMPLATES
  .filter(isDeliverableBranchingEncounter)
  .map(branchingEncounterToDeliveryBeat);

/** Look up a delivery beat by its id (for force-offer paths). */
export function getDeliveryBeatById(beatId: string): BeatDefinition | undefined {
  return ALL_DELIVERY_BEATS.find(b => b.beatId === beatId);
}

/**
 * The delivery beats *currently eligible* to be offered: every deliverable branching
 * encounter whose beat has not already been delivered this run (dedup against the
 * resolved-beat history). This is the live "eligibility filters to currently-valid
 * branching encounters" gate (THR-506) — it intentionally does NOT re-apply the
 * encounter's own mortal-pathing prerequisites (reputation/marks/court), because
 * sidestepping exactly those gates is the point of a divine-vision delivery.
 *
 * @param deliveredBeatIds beat ids already resolved (e.g. `history.map(h => h.beatId)`).
 */
export function eligibleDeliveryBeats(
  deliveredBeatIds: Iterable<string>,
): readonly BeatDefinition[] {
  const delivered = new Set(deliveredBeatIds);
  return ALL_DELIVERY_BEATS.filter(b => !delivered.has(b.beatId));
}
