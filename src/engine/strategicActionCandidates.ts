// src/engine/strategicActionCandidates.ts
//
// Generate ambition-driven strategic candidates from active ambitions + world state.
// Pure function: returns candidates and rejections, never mutates the graph.
//
// NFP #2 (Inspectability): Returns rejection reasons alongside valid candidates.
// NFP #3 (Determinism): Uses the provided seeded RNG for all tie-breaking.
// NFP #4 (Fail-soft): Missing targets → rejection, not crash.

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type {
  StrategicActionCandidate,
  StrategicActionTemplate,
  StrategicCandidateRejection,
  StrategicGenerationReason,
  StrategicRuntimeState,
} from '../types/strategicAction';
import type { AmbitionStrategicProfile } from '../types/strategicAction';
import type { AmbitionTemplate } from '../types/ambition';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import { GRIEVANCE_AMBITION_TEMPLATES } from '../data/ambition-templates';
import { MERCHANT_STRATEGIC_TEMPLATES } from '../data/strategic-packs/merchantStrategicPack';
import { BUILDER_STRATEGIC_TEMPLATES } from '../data/strategic-packs/builderStrategicPack';
import { SCHOLAR_STRATEGIC_TEMPLATES } from '../data/strategic-packs/scholarStrategicPack';
import { ZEALOT_STRATEGIC_TEMPLATES } from '../data/strategic-packs/zealotStrategicPack';
import { COURT_STRATEGIC_TEMPLATES } from '../data/strategic-packs/courtStrategicPack';
import { WARLORD_STRATEGIC_TEMPLATES } from '../data/strategic-packs/warlordStrategicPack';
import { WANDERER_STRATEGIC_TEMPLATES } from '../data/strategic-packs/wandererStrategicPack';
import { FACTORY_STRATEGIC_TEMPLATES } from '../data/strategic-packs/factory/index';
import {
  STRATEGIC_MAX_CANDIDATES_PER_ACTOR,
  STRATEGIC_MAX_CANDIDATES_PER_AMBITION,
  UNDERTAKING_MAX_ACTIVE_PER_ACTOR,
  STRATEGIC_VERB_IMPACT,
  STRATEGIC_VERB_IMPACT_DEFAULT,
  STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS,
  STRATEGIC_TARGET_SCAN_CAPS,
  STRATEGIC_TARGET_UNRESOLVED_HEX_DISTANCE,
} from '../data/strategic-action-constants';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { getAgentLocationId, getFactionMembershipEdges } from './graphQueries';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import { scoreRoutePairBalance, ROUTE_FORMATION_BALANCE_BIAS } from './tradeRoute';
import { getSublocationNodes } from './sublocationShape';
import { getGroupKind } from './groupShape';
import { getGroupPosition } from './groups/groupQueries';
import type { ReachDomain } from '../types/traits';
import { findEligibleApprentices, MENTORSHIP_TEMPLATE_ID } from './mentorshipUndertaking';
import { evaluateRemoteAnchorGate, ANCHOR_CAST_KEY } from './binding/remoteAnchor';
import type { UndertakingObjectHandle, UndertakingObjectTypeId } from '../types/strategicAction';
import {
  getUndertakingObjectType,
  enumerateObjectHandles,
  objectPlaceNodeId,
} from '../data/undertaking-objects';
import { ownershipOf, ownershipSatisfies, readObjectTier } from './undertakingResolver';
import { getCellTemplate } from '../data/undertaking-cells';
import { UNDERTAKING_MODEL, type UndertakingModel } from '../data/strategic-action-constants';
import type { AmbitionStrategicProfile as StrategicProfileForCells } from '../types/strategicAction';
import { evaluateMotiveGate } from './undertakingMotive';

// ─── Template Registry ──────────────────────────────────────────────
// All strategic templates by ID. Scales as new packs are added.

const TEMPLATE_REGISTRY = new Map<string, StrategicActionTemplate>();
const ALL_PACKS: readonly (readonly StrategicActionTemplate[])[] = [
  MERCHANT_STRATEGIC_TEMPLATES,
  BUILDER_STRATEGIC_TEMPLATES,
  SCHOLAR_STRATEGIC_TEMPLATES,
  ZEALOT_STRATEGIC_TEMPLATES,
  COURT_STRATEGIC_TEMPLATES,
  WARLORD_STRATEGIC_TEMPLATES,
  WANDERER_STRATEGIC_TEMPLATES,
  // The undertaking factory's output (THR-1300 slice 3) — compiled packages, never a
  // hand-written pack. Joined last so a factory template cannot shadow an authored id.
  FACTORY_STRATEGIC_TEMPLATES,
];
for (const pack of ALL_PACKS) {
  for (const t of pack) {
    TEMPLATE_REGISTRY.set(t.id, t);
  }
}

export function getStrategicTemplate(id: string): StrategicActionTemplate | undefined {
  // Cells are resolvable by id at all times (a project started under the cells model
  // must always find its template); they are walked only under that model.
  return TEMPLATE_REGISTRY.get(id) ?? getCellTemplate(id);
}

/**
 * The work ids an ambition profile offers under a model (THR-1392 slice 2) — the one
 * reader every consumer of `strategicProfile.templateIds` goes through. Cells lead
 * so the per-ambition cap cannot starve them (the THR-1388 ordering lesson).
 */
export function profileWorkIds(profile: StrategicProfileForCells, model: UndertakingModel = UNDERTAKING_MODEL): readonly string[] {
  if (model !== 'cells') return profile.templateIds;
  return [...(profile.cells ?? []), ...profile.templateIds];
}

/**
 * Cells already traced unreachable in this world — once per world per cell (NFP #2:
 * a cell nobody can ever take is the new "variant that never fires", and one line
 * says it). Keyed weakly on the graph so a new world starts clean and nothing leaks.
 */
const CELLS_TRACED_UNREACHABLE = new WeakMap<WorldGraph, Set<string>>();

function traceCellUnreachableOnce(
  graph: WorldGraph,
  template: StrategicActionTemplate,
  reason: 'no_object_exists' | 'no_owned_object',
  tick: number,
): void {
  if (!template.undertakingVerb || !template.objectTypeId) return;
  let seen = CELLS_TRACED_UNREACHABLE.get(graph);
  if (!seen) { seen = new Set(); CELLS_TRACED_UNREACHABLE.set(graph, seen); }
  const key = `${template.id}:${reason}`;
  if (seen.has(key)) return;
  seen.add(key);
  emitTrace({
    category: 'undertaking_cell_unreachable',
    tick,
    verb: template.undertakingVerb,
    objectTypeId: template.objectTypeId,
    reason,
    summary: `${template.id}: ${reason === 'no_object_exists' ? 'no object of the type exists' : 'no object under the ownership rule'}`,
  });
}

export function getAllStrategicTemplates(): StrategicActionTemplate[] {
  return Array.from(TEMPLATE_REGISTRY.values());
}

// ─── Candidate Generation ───────────────────────────────────────────

export interface StrategicCandidateGenerationResult {
  candidates: StrategicActionCandidate[];
  rejections: StrategicCandidateRejection[];
}

/**
 * Generate strategic action candidates for an actor based on their active ambitions.
 *
 * @param graph - World graph
 * @param actorId - The actor to generate candidates for
 * @param activeAmbitionTemplateIds - Template IDs of the actor's active ambitions
 * @param strategicState - Current runtime state (projects, controls, history)
 * @param tick - Current game tick
 * @param rng - Seeded PRNG for deterministic tie-breaking
 */
/**
 * The generation gates a review start may skip (THR-1300 slice 2) — a closed list.
 * `ambition_profile` is satisfied by the caller passing the ambitions whose profiles
 * name the template; `active_cap` and `motive_gate` are skipped inside the walk.
 */
export type ReviewBypassableGate = 'ambition_profile' | 'active_cap' | 'motive_gate';

/**
 * A review start's narrowing of the ordinary walk (THR-1300 slice 2). The walk is
 * the same — same helpers, same refusals, same candidate shape — restricted to one
 * template, with the named gates skipped and, for a destroy, the targets ordered so
 * one with an owner comes first: a destroy with no victim is the vacuous proof the
 * live-proof stage must not launder.
 */
export interface ReviewCandidateOptions {
  readonly templateId: string;
  readonly targetId?: string;
  readonly bypass: ReadonlySet<ReviewBypassableGate>;
  readonly preferOwnedTarget: boolean;
}

/** Ambition template ids whose strategic profile names `templateId` — the third registration, read back. */
export function profiledAmbitionIdsFor(templateId: string): string[] {
  return [...AMBITION_TEMPLATES, ...GRIEVANCE_AMBITION_TEMPLATES]
    .filter(a => a.strategicProfile && profileWorkIds(a.strategicProfile).includes(templateId))
    .map(a => a.id);
}

export function generateStrategicCandidates(
  graph: WorldGraph,
  actorId: string,
  activeAmbitionTemplateIds: string[],
  strategicState: StrategicRuntimeState | undefined,
  tick: number,
  rng: () => number,
  review?: ReviewCandidateOptions,
  /** The undertaking model to walk under; defaults to the flag. A test may pass `cells`. */
  model: UndertakingModel = UNDERTAKING_MODEL,
): StrategicCandidateGenerationResult {
  const candidates: StrategicActionCandidate[] = [];
  const rejections: StrategicCandidateRejection[] = [];

  const actor = graph.getNode(actorId);
  if (!actor) return { candidates, rejections };

  const locationId = getAgentLocationId(graph, actorId);
  if (!locationId) return { candidates, rejections };

  const actorHex = resolveLocationToHex(graph, locationId);

  // Source endpoint for route-formation balance scoring. getAgentLocationId returns
  // the same `located_at` target that createTradeRoute uses as the route's source,
  // so the bias reads the exact node the route would form from (fail-soft: undefined
  // → zero bias). Fetched once per actor since it is constant across candidates.
  const sourceLocationNode = graph.getNode(locationId);

  // A mortal's hands: how many undertakings they already have running (THR-1387).
  // Counted once per actor, before the template walk, so every template this pass
  // sees the same number. Read from the accumulated strategic state the caller
  // passes — the same source `project_already_active` reads — so a start earlier in
  // the same tick counts.
  const activeCount = strategicState?.projects.filter(
    p => p.actorId === actorId && p.status === 'active',
  ).length ?? 0;

  // Collect active ambitions with strategic profiles
  for (const ambitionTemplateId of activeAmbitionTemplateIds) {
    const ambitionTemplate = findAmbitionTemplate(ambitionTemplateId);
    if (!ambitionTemplate?.strategicProfile) continue;

    const profile = ambitionTemplate.strategicProfile;
    let ambitionCandidateCount = 0;

    const workIds = profileWorkIds(profile, model);
    for (const templateId of workIds) {
      if (ambitionCandidateCount >= STRATEGIC_MAX_CANDIDATES_PER_AMBITION) break;
      if (candidates.length >= STRATEGIC_MAX_CANDIDATES_PER_ACTOR) break;

      const template = getStrategicTemplate(templateId);
      if (!template) {
        rejections.push({ templateId, reason: 'template_not_found' });
        continue;
      }

      // At the cap, no undertaking is offered at all — refused here, at proposal,
      // never by marking the mortal busy (the substrate plan's addendum: an
      // undertaking runs beside encounters, and the busy-gate would stop those too).
      // Checked before every other gate so the refusal names the real reason: a
      // mortal at the cap with a valid target is refused for the cap, not for the
      // target. Same shape as `no_eligible_apprentice` — a decision nobody can act
      // on is not a decision (THR-1292 §3).
      if (review && templateId !== review.templateId) continue;
      if (activeCount >= UNDERTAKING_MAX_ACTIVE_PER_ACTOR && !review?.bypass.has('active_cap')) {
        rejections.push({ templateId, reason: `active_cap:${activeCount}` });
        continue;
      }

      // Check resource affordability
      if (template.resourceHint?.reachFloor) {
        const unmet = checkReachFloors(actor, template.resourceHint.reachFloor);
        if (unmet) {
          rejections.push({ templateId, reason: `reach_floor_unmet:${unmet}` });
          continue;
        }
      }

      // Check if actor already has an active project for this template
      if (strategicState?.projects.some(
        p => p.actorId === actorId && p.templateId === templateId && p.status === 'active',
      )) {
        rejections.push({ templateId, reason: 'project_already_active' });
        continue;
      }

      // A mentorship with nobody to teach is not a decision (THR-1292 §3).
      // Mirrors the THR-1286 control gate: refuse at proposal time rather than
      // starting an undertaking the bootstrap must immediately fail. The retired
      // pipeline checked eligibility here *and* again in the phase, from two
      // copies that had already drifted — this is the single copy.
      if (template.id === MENTORSHIP_TEMPLATE_ID
        && findEligibleApprentices(graph, actorId).length === 0) {
        rejections.push({ templateId, reason: 'no_eligible_apprentice' });
        continue;
      }

      // Find valid targets. For the `object` rule (THR-1392) the handle each target
      // stands for rides beside the node — an edge object has no node of its own.
      const objectHandles = new Map<string, UndertakingObjectHandle>();
      const objectSweep = { enumerated: 0 };
      let targets = findValidTargets(graph, actorId, template, locationId, actorHex, objectHandles, objectSweep);
      if (review?.targetId) targets = targets.filter(t => t.id === review.targetId);
      if (review?.preferOwnedTarget) {
        // Owned first, stable otherwise: the motive gate already knows how to count
        // owners, so the ordering reads the same answer it would refuse on.
        const owned = new Map(targets.map(t => [t.id, evaluateMotiveGate(graph, actorId, t.id, template).ownerCount > 0]));
        targets = [...targets].sort((a, b) => Number(owned.get(b.id)) - Number(owned.get(a.id)));
      }
      if (targets.length === 0) {
        if (template.targetRule.type === 'object') {
          // The cell's own refusal (THR-1392): distinguishes a world with no such
          // object from one where every object of the type fails the ownership rule.
          traceCellUnreachableOnce(graph, template, objectSweep.enumerated === 0 ? 'no_object_exists' : 'no_owned_object', tick);
          rejections.push({ templateId, reason: `no_object_in_range:${template.targetRule.objectTypeId}` });
        } else {
          rejections.push({ templateId, reason: 'no_valid_targets' });
        }
        continue;
      }

      // Generate a candidate for the best targets (cap per-template to ensure variety)
      const maxPerTemplate = Math.min(2, Math.max(1, Math.floor(STRATEGIC_MAX_CANDIDATES_PER_AMBITION / Math.max(1, workIds.length))));
      let templateCandidateCount = 0;
      for (const target of targets) {
        if (templateCandidateCount >= maxPerTemplate) break;
        if (ambitionCandidateCount >= STRATEGIC_MAX_CANDIDATES_PER_AMBITION) break;
        if (candidates.length >= STRATEGIC_MAX_CANDIDATES_PER_ACTOR) break;

        // Check variety: skip if recent history has this template+target combo
        const recentDuplicate = strategicState?.history.some(
          h => h.actorId === actorId
            && h.templateId === templateId
            && h.targetNodeId === target.id
            && (tick - h.tick) < 24,
        );
        if (recentDuplicate) {
          rejections.push({ templateId, reason: `recent_duplicate:${target.id}` });
          continue;
        }

        // Control claims that cannot do anything are not worth a decision (THR-1286).
        const controlGate = evaluateControlClaimGate(template, strategicState, actorId, target.id, tick);
        if (controlGate) {
          rejections.push({ templateId, reason: `${controlGate.reason}:${target.id}` });
          emitTrace({
            category: 'strategic_control_lifecycle',
            tick,
            actorId,
            targetNodeId: target.id,
            event: controlGate.event,
            cooldownRemaining: controlGate.cooldownRemaining,
            summary: `Control claim declined (${controlGate.event}): ${templateId} → ${target.id}`,
          } as TraceEntry);
          continue;
        }

        // A destroy verb needs a reason (THR-1297 §2). Refused at proposal time, for
        // the same reason as the two gates below it: an undertaking nobody can justify
        // is not a decision, and a razing with no quarrel behind it teaches the player
        // that the world's violence is weather. The gate is opt-in — a template with
        // no `motiveGate` passes untouched, which is every template but the raid.
        //
        // The refusal reaches a trace through the board trace's `refusals` field
        // rather than a trace of its own — the same route `no_eligible_apprentice`
        // takes, and one the plan's "no new trace categories" rule already assumes.
        // A second synthetic board trace per refused target would double-report the
        // same fact and describe a board (`candidatesGenerated: 0`) that never existed.
        //
        // Two reasons, not one: "nobody holds this" and "the actor has no quarrel with
        // whoever does" are different worlds and want different fixes. Both share the
        // `no_motive` prefix so a sweep can match either.
        const objectHandle = objectHandles.get(target.id);
        const motiveGate = evaluateMotiveGate(graph, actorId, target.id, template, objectHandle);
        if (!motiveGate.allowed && !review?.bypass.has('motive_gate')) {
          const reason = motiveGate.ownerCount === 0
            ? `no_motive_unowned:${target.id}`
            : `no_motive:${target.id}`;
          rejections.push({ templateId, reason });
          continue;
        }

        const targetHex = resolveLocationToHex(graph, target.id);
        const travelDist = actorHex && targetHex
          ? hexDistance(actorHex, targetHex)
          : 0;

        // A remote undertaking must reach through something the agent commands
        // (THR-1296 §6). Refused at proposal time, exactly like `no_eligible_apprentice`
        // above and for the same reason: an undertaking nobody can foot is not a
        // decision, and starting one only to stall it at the first checkpoint teaches
        // the player that their armies are decorative.
        const anchorGate = evaluateRemoteAnchorGate(
          graph, actorId, targetHex, travelDist, template.remote === true,
        );
        if (!anchorGate.allowed) {
          rejections.push({ templateId, reason: `no_remote_anchor:${target.id}` });
          emitTrace({
            category: 'binding_decision',
            tick,
            agentId: actorId,
            projectId: `candidate_${templateId}_${target.id}`,
            castKey: ANCHOR_CAST_KEY,
            stepIndex: 0,
            mode: 'refused',
            refusedReason: 'no_remote_anchor',
            rows: [],
            rowsConsidered: 0,
            summary:
              `${templateId} → ${target.id} refused: ${travelDist} hexes from ${actorId}, ` +
              'no commanded entity within anchor range of the site',
          });
          continue;
        }

        const generationReason = determineGenerationReason(
          template, profile, strategicState, actorId, target.id,
        );

        const candidate: StrategicActionCandidate = {
          candidateId: `strat_${templateId}_${target.id}_${tick}`,
          templateId,
          ambitionId: ambitionTemplateId,
          actorId,
          verb: template.verb,
          executionMode: template.executionMode,
          behaviorFamily: template.behaviorFamily,
          displayName: template.displayName,
          targetNodeId: target.id,
          targetHex: targetHex ?? undefined,
          // The object the cell acts on (THR-1392); absent on every legacy rule.
          objectHandle,
          objectTypeId: objectHandle && template.targetRule.type === 'object'
            ? template.targetRule.objectTypeId as UndertakingObjectTypeId
            : undefined,
          // The object's tier at proposal (slice 2): difficulty and payoff scale on it.
          objectTier: objectHandle && template.targetRule.type === 'object'
            ? readObjectTier(graph, getUndertakingObjectType(template.targetRule.objectTypeId)!, objectHandle, tick)
            : undefined,
          anchorNodeId: anchorGate.anchorNodeId,
          // The victim the motive gate already named (THR-1298). Stamped here because
          // this is the one point where the gate's answer is still in scope — by
          // completion time the undertaking has mutated the very ownership this was
          // read from, so re-deriving it there reads the world after the harm.
          victimAgentId: motiveGate.ownerId,
          scoreComponents: {
            ambitionAlignment: computeAmbitionAlignment(template, profile),
            blockerRelief: 0, // Computed in scoring phase with full context
            worldImpact: Math.min(1, computeWorldImpact(template)
              + computeRouteFormationBias(template, sourceLocationNode, target)),
            catalystValue: template.catalystEncounterIds?.length ? 0.5 : 0,
            roleFit: computeRoleFit(actor, template),
            controlPressure: computeControlPressure(template, strategicState, actorId, target.id),
            travelPenalty: Math.min(1, travelDist / 10),
            varietyPenalty: 0, // Computed in scoring phase with board context
          },
          finalScore: 0, // Computed by strategicActionScoring
          generationReason,
        };

        candidates.push(candidate);
        ambitionCandidateCount++;
        templateCandidateCount++;
      }
    }
  }

  return { candidates, rejections };
}

// ─── Target Finding ─────────────────────────────────────────────────

/**
 * Resolve any target node to the hex it stands on (NFP #4, fail-soft → null).
 *
 * Locations and sublocations resolve directly; `resolveLocationToHex` already walks
 * `parentLocationId` upward. An **actor** carries no `hexCol`/`hexRow` of its own, so it
 * resolves through its `located_at` target first — without that hop every actor-valued
 * target would read as unresolvable and the ordering would degrade to insertion order,
 * which is the defect this exists to fix.
 */
function resolveTargetHex(graph: WorldGraph, node: GraphNode): { col: number; row: number } | null {
  if (node.type === 'actor') {
    // A group-family node carries no `located_at` of its own — the groups system
    // derives a company's position from its leader, and failing that from any living
    // member (`groupQueries.ts` header). Without this branch every company resolved to
    // `null` here and sorted last under `STRATEGIC_TARGET_UNRESOLVED_HEX_DISTANCE`, so
    // the `group_node` rule's proximity ordering would silently degrade to insertion
    // order — reintroducing the exact defect THR-1310 fixed, for the one target shape
    // that arrived after it (THR-1309).
    const locId = getGroupKind(node) !== undefined
      ? getGroupPosition(graph, node.id)
      : getAgentLocationId(graph, node.id);
    return locId ? resolveLocationToHex(graph, locId) : null;
  }
  return resolveLocationToHex(graph, node.id);
}

/**
 * Order a scanned target set by hex distance from the acting agent, then cap it.
 *
 * **This is the THR-1310 fix.** Every scanning rule used to `.slice(0, N)` a set in
 * worldgen insertion order — the same order for every agent on the map — so the cap
 * kept the *oldest* N candidates rather than the *nearest* N, and near sites were
 * discarded before `travelPenalty` could ever score them. Sorting first makes the cap
 * keep what is close.
 *
 * Distance only *orders*; it is never a score and never an exclusion. `travelPenalty`
 * remains the sole place distance is priced (THR-1310 scope: "honouring the existing
 * `travelPenalty` rather than duplicating it"), so a far target that is the only target
 * still gets proposed — and still gets penalised downstream exactly as before.
 *
 * NFP #3 (Determinism): ties break on node id, so the same world yields the same order
 * regardless of engine sort stability. NFP #4 (Fail-soft): an unresolvable hex sorts
 * last rather than being dropped, and an unresolvable *actor* hex disables ordering
 * altogether rather than scrambling it.
 *
 * Exported for focused tests (NFP #2), matching `computeRouteFormationBias`'s precedent.
 */
export function orderTargetsByProximity(
  graph: WorldGraph,
  targets: GraphNode[],
  actorHex: { col: number; row: number } | null,
  cap: number,
): GraphNode[] {
  if (!actorHex) return targets.slice(0, cap);

  const withDistance = targets.map(node => {
    const hex = resolveTargetHex(graph, node);
    return {
      node,
      distance: hex
        ? hexDistance(actorHex, hex)
        : STRATEGIC_TARGET_UNRESOLVED_HEX_DISTANCE,
    };
  });

  withDistance.sort((a, b) =>
    a.distance !== b.distance
      ? a.distance - b.distance
      : a.node.id.localeCompare(b.node.id));

  return withDistance.slice(0, cap).map(entry => entry.node);
}

function findValidTargets(
  graph: WorldGraph,
  actorId: string,
  template: StrategicActionTemplate,
  currentLocationId: string,
  // THR-1310: the caller already resolved this once per actor; threading it through
  // keeps one source for where the agent stands rather than re-deriving it per template.
  actorHex: { col: number; row: number } | null,
  /** Out: the object handle behind each returned node, for the `object` rule (THR-1392). */
  objectHandles?: Map<string, UndertakingObjectHandle>,
  /** Out: how many objects of the type existed before the ownership rule (slice 2's unreachable reason). */
  objectSweep?: { enumerated: number },
): GraphNode[] {
  const rule = template.targetRule;

  switch (rule.type) {
    case 'object': {
      // Every object of the type in the world under the cell's ownership rule
      // (THR-1392). The registry's shape enumerates, the resolver's one ownership
      // read classifies, and the place node carries the handle out. An edge object
      // (a mark) is placed at its target; two marks on one subject collapse to the
      // first by edge id — deterministic, and the case is rare enough that slice 2's
      // cell enumeration can widen it if the census asks.
      const type = getUndertakingObjectType(rule.objectTypeId);
      if (!type) return [];
      const nodes: GraphNode[] = [];
      const seen = new Set<string>();
      const handles = enumerateObjectHandles(graph, type);
      if (objectSweep) objectSweep.enumerated = handles.length;
      for (const handle of handles) {
        const ownership = ownershipOf(graph, actorId, type, handle);
        if (!ownershipSatisfies(rule.ownership, ownership)) continue;
        // A `control` cell under `any` never targets what the actor already holds —
        // the resolver would refuse it at completion, so refuse it here, at proposal.
        if (template.undertakingVerb === 'control' && ownership === 'own') continue;
        const placeId = objectPlaceNodeId(graph, handle);
        const node = placeId ? graph.getNode(placeId) : undefined;
        if (!node || seen.has(node.id)) continue;
        seen.add(node.id);
        nodes.push(node);
        objectHandles?.set(node.id, handle);
      }
      return orderTargetsByProximity(graph, nodes, actorHex, STRATEGIC_TARGET_SCAN_CAPS.object);
    }

    case 'self':
      return [graph.getNode(actorId)].filter(Boolean) as GraphNode[];

    case 'any_location':
      return orderTargetsByProximity(
        graph,
        graph.getNodesByType('location'),
        actorHex,
        STRATEGIC_TARGET_SCAN_CAPS.any_location,
      );

    case 'location_subtype': {
      const allLocations = graph.getNodesByType('location');
      const matching = allLocations.filter(loc => {
        const subtype = (loc.properties.locationSubtype ?? loc.properties.locationType) as string | undefined;
        return subtype && rule.subtypes.includes(subtype);
      });
      // THR-1310: the cap keeps the nearest, not the first-minted. Shared by all seven
      // packs (53 templates), so this ordering is the whole sweep's blast radius.
      return orderTargetsByProximity(
        graph, matching, actorHex, STRATEGIC_TARGET_SCAN_CAPS.location_subtype,
      );
    }

    case 'faction': {
      // Find factions the actor is a member of.
      //
      // THR-1297 slice 1 fixed a live defect here: this read every outgoing `member_of`
      // edge raw, so an agent travelling in a company had that *company* returned as a
      // faction target — every faction-targeted undertaking could then be aimed at a
      // band of three wanderers. The wrapper filters the group family out.
      const memberEdges = getFactionMembershipEdges(graph, actorId);
      return memberEdges
        .map(e => graph.getNode(e.target))
        .filter(Boolean) as GraphNode[];
    }

    case 'trade_route': {
      // Find existing trade routes connected to actor's location
      const tradeEdges = [
        ...graph.getOutgoingEdges(currentLocationId, 'trades_with'),
        ...graph.getIncomingEdges(currentLocationId, 'trades_with'),
      ];
      return tradeEdges
        .map(e => graph.getNode(e.target === currentLocationId ? e.source : e.target))
        .filter(Boolean) as GraphNode[];
    }

    case 'sublocation_type': {
      // Find sublocations of the specified types.
      // THR-1183: was `getNodesByType('sublocation')`, which saw only the strategic mint
      // shape — every worldgen-minted sublocation (the overwhelming majority) was
      // invisible here, so this rule matched almost nothing on a normal map.
      const allSublocations = getSublocationNodes(graph);
      const matching = allSublocations.filter(sub => {
        const typeId = sub.properties.sublocationTypeId as string | undefined;
        return typeId && rule.subtypeIds.includes(typeId);
      });
      // THR-1310: same unbounded-scan shape as `location_subtype`. No shipped template
      // names this rule today, so the ordering is prophylactic — it stops the next pack
      // that reaches for it from re-inheriting the defect.
      return orderTargetsByProximity(
        graph, matching, actorHex, STRATEGIC_TARGET_SCAN_CAPS.sublocation_type,
      );
    }

    case 'actor_with_trait': {
      const matching = graph.getNodesByType('actor').filter(a => {
        const traits = a.properties.traits as string[] | undefined;
        return traits?.includes(rule.trait);
      });
      // THR-1310: actors resolve through `located_at` before their hex is known — see
      // `resolveTargetHex`. Also prophylactic; no shipped template names this rule.
      return orderTargetsByProximity(
        graph, matching, actorHex, STRATEGIC_TARGET_SCAN_CAPS.actor_with_trait,
      );
    }

    case 'colocated_actor': {
      // People standing where the actor stands. Deliberately *not* a graph-wide scan
      // sliced to five (`actor_with_trait`'s shape): a secret is held about someone
      // you have met, so the target set has to be the room rather than the world.
      const here = graph.getIncomingEdges(currentLocationId, 'located_at')
        .map(e => graph.getNode(e.source))
        .filter((n): n is GraphNode => !!n && n.type === 'actor' && n.id !== actorId);

      const roleFiltered = rule.roles && rule.roles.length > 0
        ? here.filter(n => {
            const role = n.properties.npcRole as string | undefined;
            return role !== undefined && rule.roles!.includes(role);
          })
        : here;

      // Narrow to people the actor already holds the named edge toward. Without this
      // a verb whose *resolution* requires a prior relationship gets offered against
      // whoever happens to be standing there, and refuses every time — selection and
      // resolution disagreeing silently, which reads as a dead verb rather than a
      // mis-targeted one.
      const edgeFiltered = rule.withEdgeFromActor
        ? roleFiltered.filter(n =>
            graph.getOutgoingEdges(actorId, rule.withEdgeFromActor!).some(e => e.target === n.id))
        : roleFiltered;

      // THR-1310: capped by the named constant, but deliberately *not* reordered —
      // every candidate here stands at `currentLocationId`, so all distances are 0 and
      // sorting would only churn the order for no gain.
      return edgeFiltered.slice(0, STRATEGIC_TARGET_SCAN_CAPS.colocated_actor);
    }

    case 'group_node': {
      // Group-family nodes, split by who commands them (THR-1309).
      //
      // No existing rule can see a company: it is an `actor` node with no `located_at`
      // edge of its own — position derives from its leader — so `colocated_actor` finds
      // nothing, `actor_with_trait` wants a trait companies never carry, and `self`
      // returns the commander rather than the band. Authoring the warband's update and
      // destroy against any of those would offer both verbs against targets that can
      // never satisfy them: `press_the_mark`'s failure exactly.
      //
      // `commanded_by` runs group → leader, so a commander's own bands are the sources
      // of that edge type *incoming* to them.
      const commandedIds = new Set(
        graph.getIncomingEdges(actorId, 'commanded_by').map(e => e.source),
      );

      const candidates = graph.getNodesByType('actor').filter(n => {
        if (getGroupKind(n) !== rule.groupKind) return false;
        // An inert node is not a target — neither to reinforce nor to break.
        if ((n.properties as Record<string, unknown>).groupStatus === 'disbanded') return false;
        return rule.ownership === 'commanded_by_actor'
          ? commandedIds.has(n.id)
          : !commandedIds.has(n.id);
      });

      // Proximity ordering matters chiefly for the `other_commander` arm — a commander
      // holds very few bands and all of them are equally theirs, while a rival needs
      // the *nearest* warband to be reachable at all. `resolveTargetHex` resolves a
      // group through `getGroupPosition` (leader, then any living member) precisely so
      // this rule inherits the THR-1310 fix rather than silently falling back to
      // insertion order.
      return orderTargetsByProximity(
        graph, candidates, actorHex, STRATEGIC_TARGET_SCAN_CAPS.group_node,
      );
    }

    case 'hex_region':
      // For now, just return the current location
      return [graph.getNode(currentLocationId)].filter(Boolean) as GraphNode[];

    default:
      return [];
  }
}

// ─── Score Component Helpers ────────────────────────────────────────

function computeAmbitionAlignment(
  template: StrategicActionTemplate,
  profile: AmbitionStrategicProfile,
): number {
  // Higher if the template's verb is earlier in the preferred verbs list
  const verbIndex = profile.preferredVerbs.indexOf(template.verb);
  if (verbIndex === -1) return 0.2;
  return 1.0 - (verbIndex * 0.15);
}

/**
 * Route-formation balance bias ∈ [0, ROUTE_FORMATION_BALANCE_BIAS] (Mortal Economy P2, THR-616).
 *
 * Rewards a candidate route between a surplus endpoint and a scarce one — a route
 * that wants to exist — so merchants prefer complementary partners over arbitrary
 * ones. Folded into the target-specific `worldImpact` component (a complementary
 * route reshapes the economy more). Returns 0 for non-route templates
 * (mutationHint ≠ create_trade_route) and when the source node is missing (fail-soft).
 * Exported for focused scoring tests (NFP #2 inspectability).
 */
export function computeRouteFormationBias(
  template: StrategicActionTemplate,
  sourceLocation: GraphNode | undefined,
  target: GraphNode,
): number {
  if (template.mutationHint?.type !== 'create_trade_route') return 0;
  if (!sourceLocation) return 0;
  return ROUTE_FORMATION_BALANCE_BIAS
    * scoreRoutePairBalance(sourceLocation.properties, target.properties);
}

// The verb-impact table moved to `strategic-action-constants` when the board
// began reading it as an undertaking's `payoffValue` fallback (THR-1292 §4). One
// table, two readers — a copy here would let the board and the scorer it is being
// measured against disagree about the same verb, invisibly in both files.
function computeWorldImpact(template: StrategicActionTemplate): number {
  return STRATEGIC_VERB_IMPACT[template.verb] ?? STRATEGIC_VERB_IMPACT_DEFAULT;
}

function computeRoleFit(actor: GraphNode, template: StrategicActionTemplate): number {
  const domains = actor.properties.domainCapabilities as Record<string, number> | undefined;
  if (!domains) return 0.3;

  let fitSum = 0;
  let fitCount = 0;
  for (const [reach, weight] of Object.entries(template.reachProfile)) {
    const capability = domains[reach] ?? 0;
    fitSum += capability * (weight as number);
    fitCount++;
  }

  return fitCount > 0 ? Math.min(1, fitSum / fitCount) : 0.3;
}

/**
 * Decide whether a `control` claim is worth generating at all (THR-1286).
 *
 * Two shapes of claim can only waste the decision that picks them, because
 * `claimControl` refuses both with `already_controls`:
 *
 * - **`already_held`** — the actor still actively controls this target. Re-claiming is
 *   a no-op. (Whether upkeep *should* exist, and what it should mean, is the Proactive
 *   Agent Actions substrate question; declining a claim that provably cannot succeed
 *   does not answer it either way, and leaves any upkeep verb free to be added.)
 * - **`reclaim_refused`** — the actor let this target's stance collapse less than
 *   `STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS` ago. Read off the collapse history entry
 *   `retireControl` writes, since the record itself is retired on collapse.
 *
 * Returns null when the claim is legitimate. Fail-soft: no strategic state yet means
 * nothing is held and nothing has collapsed, so the claim passes.
 */
function evaluateControlClaimGate(
  template: StrategicActionTemplate,
  strategicState: StrategicRuntimeState | undefined,
  actorId: string,
  targetNodeId: string,
  tick: number,
): { reason: string; event: 'reclaim_refused' | 'already_held'; cooldownRemaining?: number } | null {
  if (template.verb !== 'control') return null;
  if (!strategicState) return null;

  const held = strategicState.controls.some(
    c => c.actorId === actorId && c.targetNodeId === targetNodeId && c.active,
  );
  if (held) return { reason: 'control_already_held', event: 'already_held' };

  // Most recent collapse of this actor's stance on this target
  let lastCollapseTick = -Infinity;
  for (const entry of strategicState.history) {
    if (entry.verb !== 'control') continue;
    if (entry.actorId !== actorId || entry.targetNodeId !== targetNodeId) continue;
    if (entry.outcome !== 'failed') continue;
    if (entry.tick > lastCollapseTick) lastCollapseTick = entry.tick;
  }

  const elapsed = tick - lastCollapseTick;
  if (elapsed < STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS) {
    return {
      reason: 'control_reclaim_cooldown',
      event: 'reclaim_refused',
      cooldownRemaining: STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS - elapsed,
    };
  }

  return null;
}

function computeControlPressure(
  template: StrategicActionTemplate,
  strategicState: StrategicRuntimeState | undefined,
  actorId: string,
  targetNodeId: string,
): number {
  if (template.verb !== 'control') return 0;
  if (!strategicState) return 0.5; // No state yet — moderate pressure to establish

  // Only a live stance carries upkeep pressure (THR-1286). Collapsed records are
  // retired on collapse, but a world saved before that fix can still carry one, and its
  // frozen `neglectTicks` would otherwise pin this at the maximum forever.
  const existingControl = strategicState.controls.find(
    c => c.actorId === actorId && c.targetNodeId === targetNodeId && c.active,
  );
  if (!existingControl) return 0.5;

  // Higher pressure when neglect is approaching grace threshold
  return Math.min(1, existingControl.neglectTicks / 8);
}

function checkReachFloors(
  actor: GraphNode,
  floors: Partial<Record<ReachDomain, number>>,
): string | null {
  const domains = actor.properties.domainCapabilities as Record<string, number> | undefined;
  if (!domains) return Object.keys(floors)[0] ?? null;

  for (const [reach, min] of Object.entries(floors)) {
    if ((domains[reach] ?? 0) < (min as number)) return reach;
  }
  return null;
}

function determineGenerationReason(
  template: StrategicActionTemplate,
  _profile: AmbitionStrategicProfile,
  strategicState: StrategicRuntimeState | undefined,
  actorId: string,
  targetNodeId: string,
): StrategicGenerationReason {
  // Control obligation check
  if (template.verb === 'control') {
    const existing = strategicState?.controls.find(
      c => c.actorId === actorId && c.targetNodeId === targetNodeId && c.active,
    );
    if (existing) return 'control_obligation';
  }

  // Unfinished project check
  if (strategicState?.projects.some(
    p => p.actorId === actorId && p.templateId === template.id && p.status === 'stalled',
  )) {
    return 'unfinished_work';
  }

  return 'ambition_progression';
}

export function findAmbitionTemplate(templateId: string): AmbitionTemplate | undefined {
  return AMBITION_TEMPLATES.find(t => t.id === templateId)
    ?? GRIEVANCE_AMBITION_TEMPLATES.find(t => t.id === templateId);
}
