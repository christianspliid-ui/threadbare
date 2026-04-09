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
import {
  STRATEGIC_MAX_CANDIDATES_PER_ACTOR,
  STRATEGIC_MAX_CANDIDATES_PER_AMBITION,
} from '../data/strategic-action-constants';
import { getAgentLocationId } from './graphQueries';
import { resolveLocationToHex } from './encounterAwareness';
import { hexDistance } from '../lib/hexMath';
import type { ReachDomain } from '../types/traits';

// ─── Template Registry ──────────────────────────────────────────────
// All strategic templates by ID. Scales as new packs are added.

const TEMPLATE_REGISTRY = new Map<string, StrategicActionTemplate>();
for (const t of MERCHANT_STRATEGIC_TEMPLATES) {
  TEMPLATE_REGISTRY.set(t.id, t);
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

        const targetHex = resolveLocationToHex(graph, target.id);
        const travelDist = actorHex && targetHex
          ? hexDistance(actorHex, targetHex)
          : 0;

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
          scoreComponents: {
            ambitionAlignment: computeAmbitionAlignment(template, profile),
            blockerRelief: 0, // Computed in scoring phase with full context
            worldImpact: computeWorldImpact(template),
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
      // Find factions the actor is a member of
      const memberEdges = graph.getOutgoingEdges(actorId, 'member_of');
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
      // Find sublocations of the specified types
      const allSublocations = graph.getNodesByType('sublocation');
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

function computeWorldImpact(template: StrategicActionTemplate): number {
  switch (template.verb) {
    case 'create': return 0.8;
    case 'destroy': return 0.7;
    case 'change': return 0.5;
    case 'control': return 0.6;
    case 'gather_info': return 0.3;
    default: return 0.3;
  }
}

function computeRoleFit(actor: GraphNode, template: StrategicActionTemplate): number {
  const domains = actor.properties.domainCapability as Record<string, number> | undefined;
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

function computeControlPressure(
  template: StrategicActionTemplate,
  strategicState: StrategicRuntimeState | undefined,
  actorId: string,
  targetNodeId: string,
): number {
  if (template.verb !== 'control') return 0;
  if (!strategicState) return 0.5; // No state yet — moderate pressure to establish

  const existingControl = strategicState.controls.find(
    c => c.actorId === actorId && c.targetNodeId === targetNodeId,
  );
  if (!existingControl) return 0.5;

  // Higher pressure when neglect is approaching grace threshold
  return Math.min(1, existingControl.neglectTicks / 8);
}

function checkReachFloors(
  actor: GraphNode,
  floors: Partial<Record<ReachDomain, number>>,
): string | null {
  const domains = actor.properties.domainCapability as Record<string, number> | undefined;
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

function findAmbitionTemplate(templateId: string): AmbitionTemplate | undefined {
  return AMBITION_TEMPLATES.find(t => t.id === templateId)
    ?? REACTIVE_AMBITION_TEMPLATES.find(t => t.id === templateId);
}
