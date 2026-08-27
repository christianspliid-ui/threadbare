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
import { REACTIVE_AMBITION_TEMPLATES } from '../data/ambition-templates';
import { MERCHANT_STRATEGIC_TEMPLATES } from '../data/strategic-packs/merchantStrategicPack';
import { BUILDER_STRATEGIC_TEMPLATES } from '../data/strategic-packs/builderStrategicPack';
import { SCHOLAR_STRATEGIC_TEMPLATES } from '../data/strategic-packs/scholarStrategicPack';
import { ZEALOT_STRATEGIC_TEMPLATES } from '../data/strategic-packs/zealotStrategicPack';
import { COURT_STRATEGIC_TEMPLATES } from '../data/strategic-packs/courtStrategicPack';
import { WARLORD_STRATEGIC_TEMPLATES } from '../data/strategic-packs/warlordStrategicPack';
import {
  STRATEGIC_MAX_CANDIDATES_PER_ACTOR,
  STRATEGIC_MAX_CANDIDATES_PER_AMBITION,
  STRATEGIC_VERB_IMPACT,
  STRATEGIC_VERB_IMPACT_DEFAULT,
  STRATEGIC_CONTROL_RECLAIM_COOLDOWN_TICKS,
} from '../data/strategic-action-constants';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';
import { getAgentLocationId, getFactionMembershipEdges } from './graphQueries';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import { scoreRoutePairBalance, ROUTE_FORMATION_BALANCE_BIAS } from './tradeRoute';
import { getSublocationNodes } from './sublocationShape';
import type { ReachDomain } from '../types/traits';
import { findEligibleApprentices, MENTORSHIP_TEMPLATE_ID } from './mentorshipUndertaking';
import { evaluateRemoteAnchorGate, ANCHOR_CAST_KEY } from './binding/remoteAnchor';

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
];
for (const pack of ALL_PACKS) {
  for (const t of pack) {
    TEMPLATE_REGISTRY.set(t.id, t);
  }
}

export function getStrategicTemplate(id: string): StrategicActionTemplate | undefined {
  return TEMPLATE_REGISTRY.get(id);
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
export function generateStrategicCandidates(
  graph: WorldGraph,
  actorId: string,
  activeAmbitionTemplateIds: string[],
  strategicState: StrategicRuntimeState | undefined,
  tick: number,
  rng: () => number,
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

  // Collect active ambitions with strategic profiles
  for (const ambitionTemplateId of activeAmbitionTemplateIds) {
    const ambitionTemplate = findAmbitionTemplate(ambitionTemplateId);
    if (!ambitionTemplate?.strategicProfile) continue;

    const profile = ambitionTemplate.strategicProfile;
    let ambitionCandidateCount = 0;

    for (const templateId of profile.templateIds) {
      if (ambitionCandidateCount >= STRATEGIC_MAX_CANDIDATES_PER_AMBITION) break;
      if (candidates.length >= STRATEGIC_MAX_CANDIDATES_PER_ACTOR) break;

      const template = TEMPLATE_REGISTRY.get(templateId);
      if (!template) {
        rejections.push({ templateId, reason: 'template_not_found' });
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

      // Find valid targets
      const targets = findValidTargets(graph, actorId, template, locationId);
      if (targets.length === 0) {
        rejections.push({ templateId, reason: 'no_valid_targets' });
        continue;
      }

      // Generate a candidate for the best targets (cap per-template to ensure variety)
      const maxPerTemplate = Math.min(2, Math.max(1, Math.floor(STRATEGIC_MAX_CANDIDATES_PER_AMBITION / profile.templateIds.length)));
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
          anchorNodeId: anchorGate.anchorNodeId,
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

function findValidTargets(
  graph: WorldGraph,
  actorId: string,
  template: StrategicActionTemplate,
  currentLocationId: string,
): GraphNode[] {
  const rule = template.targetRule;

  switch (rule.type) {
    case 'self':
      return [graph.getNode(actorId)].filter(Boolean) as GraphNode[];

    case 'any_location':
      return graph.getNodesByType('location').slice(0, 5);

    case 'location_subtype': {
      const allLocations = graph.getNodesByType('location');
      return allLocations.filter(loc => {
        const subtype = (loc.properties.locationSubtype ?? loc.properties.locationType) as string | undefined;
        return subtype && rule.subtypes.includes(subtype);
      }).slice(0, 8); // Cap to prevent explosion
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
      return allSublocations.filter(sub => {
        const typeId = sub.properties.sublocationTypeId as string | undefined;
        return typeId && rule.subtypeIds.includes(typeId);
      }).slice(0, 5);
    }

    case 'actor_with_trait': {
      return graph.getNodesByType('actor').filter(a => {
        const traits = a.properties.traits as string[] | undefined;
        return traits?.includes(rule.trait);
      }).slice(0, 5);
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
    ?? REACTIVE_AMBITION_TEMPLATES.find(t => t.id === templateId);
}
