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
 * branching encounters.
 *
 * **Playback (THR-1650).** The vision is a scene, not a silent grant: Witness opens the
 * source encounter in the encounter veil with **The First** as its actor, through
 * {@link prepareDeliveryEncounter} — the non-debug sibling of `prepareDebugEncounterSpawn`.
 * A delivery beat whose source cannot bind The First ({@link bindDeliverySubject}) is
 * never offered; the encounter's own aftermath runs through the veil against The First,
 * so `resolvePendingBeat` no longer runs the template's fallback reactions against the god.
 *
 * Load-bearing decision (matches the rest of the beat system): a delivery beat is
 * NOT a new node type. It is a `BeatDefinition` descriptor whose `templateId` is the
 * id of an already-registered branching encounter template. No content is duplicated.
 */

import type { BeatDefinition } from '../types/ascendantBeat';
import type { GameState } from '../types/gameState';
import type { ClearanceGateRuntimeState } from '../types/contentShells';
import type { EncounterNotification } from '../types/encounterVisibility';
import type { ThreadEdgeProperties } from '../types/influence';
import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';
import { VISIBILITY_BY_POSITION } from '../types/encounterVisibility';
import { LOCATION_BRANCHING_ENCOUNTER_TEMPLATES, getUnifiedTemplateById } from '../data/unified-action-templates';
import { getLocationType, isDrawable } from './encounterCache';
import { getAgentLocationId } from './graphQueries';
import { resolveToParentLocation } from './sublocationShape';
import { buildEncounterNotification } from './encounterVisibility';
import { prepareEncounterSupportBundle, type EncounterBinderContext } from './encounterSupportBundle';
import { initializeClearanceGates } from './clearanceGate';
import { createUnifiedAction } from './unifiedActionLifecycle';
import { mulberry32 } from '../lib/prng';
import { ASCENDANT_BEAT_POOL, BEAT_KIND_WEIGHTS } from '../data/ascendant-beat-content';

/** Stable prefix for every delivery beat id. A beat id is `${PREFIX}${templateId}`. */
export const DELIVERY_BEAT_ID_PREFIX = 'beat.delivery.';

/**
 * Target share of an unbiased first cadence draw that lands on *some* delivery beat
 * (a divine vision). NFP #1 — the tuning knob: raise it for more frequent visions,
 * lower it for rarer. THR-1771: the share used to be a by-product of a hand-set
 * per-beat weight and the delivery count, so it drifted (the comment said ~23 beats
 * and ~10%; the catalogue grew to 84 and ~20%). 0.2 keeps today's measured share.
 */
export const DELIVERY_FIRST_DRAW_SHARE = 0.2;

/**
 * Unbiased draw mass of the static base pool (intro/invest/select): Σ kind weight ×
 * per-beat weight over `ASCENDANT_BEAT_POOL`, every beat eligible and identity bias 1.
 */
export const BASE_POOL_FIRST_DRAW_MASS = ASCENDANT_BEAT_POOL.reduce(
  (sum, b) => sum + (BEAT_KIND_WEIGHTS[b.kind] ?? 1) * (b.weight ?? 1),
  0,
);

/**
 * Per-beat draw weight for delivery beats (multiplies `BEAT_KIND_WEIGHTS.delivery`
 * in `drawFromPool`), derived — never hand-set — so the whole delivery group carries
 * {@link DELIVERY_FIRST_DRAW_SHARE} of an unbiased first draw however many deliverable
 * branching encounters the catalogue holds:
 * `share × baseMass / ((1 − share) × count × kindWeight)`. Fail-soft: an empty
 * catalogue (count 0) yields 0 — there is nothing to weight.
 */
export function deliveryBeatWeightFor(deliverableCount: number): number {
  const kindWeight = BEAT_KIND_WEIGHTS.delivery ?? 1;
  if (deliverableCount <= 0 || kindWeight <= 0 || DELIVERY_FIRST_DRAW_SHARE >= 1) return 0;
  return (DELIVERY_FIRST_DRAW_SHARE * BASE_POOL_FIRST_DRAW_MASS)
    / ((1 - DELIVERY_FIRST_DRAW_SHARE) * deliverableCount * kindWeight);
}

const DELIVERABLE_BRANCHING_TEMPLATES = LOCATION_BRANCHING_ENCOUNTER_TEMPLATES
  .filter(isDeliverableBranchingEncounter);

/**
 * The live per-beat delivery weight (see {@link deliveryBeatWeightFor}). Per-beat
 * eligibility beyond dedup — binding The First (THR-1650) — still withholds beats at
 * draw time, so the realised share is at most the target.
 */
export const DELIVERY_BEAT_WEIGHT = deliveryBeatWeightFor(DELIVERABLE_BRANCHING_TEMPLATES.length);

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
  // THR-1526: a seed-only sequel (`drawable: false`) would otherwise run as a divine
  // vision beat with its fallback reactions — the same untrue scene by a third route.
  return isDrawable(template) && Array.isArray(template.steps) && template.steps.length > 0;
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
export const ALL_DELIVERY_BEATS: readonly BeatDefinition[] = DELIVERABLE_BRANCHING_TEMPLATES
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

// ─── Playback: Witness opens the scene on The First (THR-1650) ──────────────

/** Why a delivery beat cannot be played on The First. Mirrors `BeatDeliveryTrace.reason`. */
export type DeliveryBindFailure = 'no_first' | 'no_anchor' | 'ineligible' | 'template_missing';

/** Result of {@link bindDeliverySubject}. */
export type DeliveryBinding =
  | { readonly ok: true; readonly subjectId: string; readonly anchorLocationId: string; readonly template: UnifiedActionTemplate }
  | { readonly ok: false; readonly reason: DeliveryBindFailure; readonly subjectId: string | null };

/**
 * The First — the actor on the ascendant's `thread` edge at `courtPosition: 'the_first'`.
 * Null when no First is bonded (or the edge points at something that is not an actor).
 */
export function findDeliverySubject(state: GameState): string | null {
  const ascendantId = state.ascendantId;
  if (!ascendantId) return null;
  try {
    const edge = state.graph.getOutgoingEdges(ascendantId, 'thread').find(e =>
      (e.properties as { courtPosition?: string }).courtPosition === 'the_first'
      && state.graph.getNode(e.target)?.type === 'actor');
    return edge?.target ?? null;
  } catch {
    return null;
  }
}

/**
 * Can this delivery beat's source encounter be played with The First as its actor?
 *
 * "Bind" is deliberately structural, not the mortal-pathing prerequisites (reputation
 * tiers, marks, court position) — sidestepping those is the whole point of a divine
 * vision (THR-506). It asks the questions whose failure would make the scene untrue:
 * - **no_first** — no First is bonded, so there is no one for the vision to fall on.
 * - **no_anchor** — The First stands nowhere the encounter can anchor to.
 * - **ineligible** — the encounter is set at a kind of place (its `locationSubtypes`)
 *   and The First is not at one. A template that declares no subtypes is place-agnostic.
 *
 * Pure; fail-soft (a thrown lookup reads as `no_anchor`, never an exception).
 */
export function bindDeliverySubject(state: GameState, templateId: string): DeliveryBinding {
  const template = getUnifiedTemplateById(templateId);
  const subjectId = findDeliverySubject(state);
  if (!template) return { ok: false, reason: 'template_missing', subjectId };
  if (!subjectId) return { ok: false, reason: 'no_first', subjectId: null };
  try {
    const anchorLocationId = getAgentLocationId(state.graph, subjectId);
    if (!anchorLocationId) return { ok: false, reason: 'no_anchor', subjectId };
    const subtypes: readonly string[] = template.locationSubtypes ?? [];
    if (subtypes.length > 0) {
      const place = resolveToParentLocation(state.graph, state.graph.getNode(anchorLocationId));
      const locationType = place ? getLocationType(state.graph, place.id) : undefined;
      if (!locationType || !subtypes.includes(locationType)) {
        return { ok: false, reason: 'ineligible', subjectId };
      }
    }
    return { ok: true, subjectId, anchorLocationId, template };
  } catch {
    return { ok: false, reason: 'no_anchor', subjectId };
  }
}

/** What {@link prepareDeliveryEncounter} minted for the caller to stage and open. */
export interface PreparedDeliveryEncounter {
  readonly success: boolean;
  readonly message: string;
  readonly reason?: DeliveryBindFailure | 'open_failed';
  readonly agent?: { readonly id: string; readonly name: string };
  readonly template?: UnifiedActionTemplate;
  readonly notification?: EncounterNotification;
  readonly unifiedAction?: UnifiedAction;
  readonly clearanceGateStates?: Map<string, ClearanceGateRuntimeState>;
}

/**
 * Mint the encounter a delivery beat plays: the non-debug sibling of
 * `prepareDebugEncounterSpawn` (THR-1650). It builds the `UnifiedAction`, the clearance
 * gates and the encounter notification exactly as that path does, for The First at where
 * The First stands — so the veil opens on a real encounter whose own aftermath runs
 * against the right actor.
 *
 * Unlike the debug path it never writes a `thread` edge (The First is already threaded),
 * never stamps a test avatar, and refuses — rather than improvises — when the source
 * cannot bind `subjectId` (see {@link bindDeliverySubject}). Pure over the graph: the
 * caller appends the action/notification/gates to state and opens the veil.
 */
export function prepareDeliveryEncounter(
  state: GameState,
  templateId: string,
  subjectId: string,
  options: { binder?: EncounterBinderContext } = {},
): PreparedDeliveryEncounter {
  const binding = bindDeliverySubject(state, templateId);
  if (!binding.ok) {
    return { success: false, reason: binding.reason, message: `Delivery '${templateId}' cannot bind The First (${binding.reason})` };
  }
  if (binding.subjectId !== subjectId) {
    // The vision falls on The First only; any other subject is a caller error.
    return { success: false, reason: 'no_first', message: `Delivery subject '${subjectId}' is not The First` };
  }
  try {
    const { template, anchorLocationId } = binding;
    const agentName = state.graph.getNode(subjectId)?.name ?? subjectId;
    const locationName = state.graph.getNode(anchorLocationId)?.name ?? 'unknown location';
    const threadEdge = state.ascendantId
      ? state.graph.getOutgoingEdges(state.ascendantId, 'thread').find(e => e.target === subjectId)
      : undefined;
    const threadProps = threadEdge?.properties as ThreadEdgeProperties | undefined;
    const courtPosition = threadProps?.courtPosition ?? 'the_first';
    const attentionMode = threadProps?.attentionMode ?? VISIBILITY_BY_POSITION[courtPosition].defaultAttentionMode;

    const supportBindings = prepareEncounterSupportBundle(
      state, template, anchorLocationId, undefined,
      options.binder ? { ...options.binder, actorId: subjectId } : undefined,
    );
    const gateInit = initializeClearanceGates(
      state.clearanceGateStates, template, supportBindings, anchorLocationId, state.tick,
    );
    const rng = mulberry32(state.seed + state.tick * 43 + subjectId.length);
    const action = createUnifiedAction({
      actorId: subjectId,
      templateId: template.id,
      targetId: anchorLocationId,
      scale: template.scale,
      source: 'system',
      tick: state.tick,
      template,
      rng,
      supportBindings,
      clearanceGateIds: gateInit.gateIds,
      targetProperties: state.graph.getNode(anchorLocationId)?.properties,
    });
    // unified_action metadata so the dedup key matches what phaseEncounterVisibility
    // generates next tick (the same reason the debug path gives).
    const notification = buildEncounterNotification(
      subjectId, agentName, template.id, template.name, locationName,
      courtPosition, attentionMode, state.tick,
      { sourceSystem: 'unified_action', stepIndex: 0, actionId: action.actionId },
    );
    if (!notification) {
      return { success: false, reason: 'open_failed', message: `Encounter visibility is disabled for ${agentName}` };
    }
    return {
      success: true,
      message: `Delivered '${template.name}' to ${agentName}`,
      agent: { id: subjectId, name: agentName },
      template,
      notification,
      unifiedAction: action,
      clearanceGateStates: gateInit.clearanceGateStates,
    };
  } catch (err) {
    return {
      success: false,
      reason: 'open_failed',
      message: `prepareDeliveryEncounter error (${templateId}): ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
