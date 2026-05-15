// src/engine/initiativeCandidates.ts
// Generates scored InitiativeCandidates for an agent in the decision pipeline (THR-51).
// Pure: reads graph state, emits candidates + rejection log. Never mutates.
//
// Direction convention: 'left' = first word in axis name = positive pole (+1.0)
//                       'right' = second word in axis name = negative pole (-1.0)

import type { WorldGraph } from './graph';
import type { InitiativeCandidate, InitiativeTemplate } from '../types/initiative';
import type { AxiologicalProfile } from '../types/agent';
import { INITIATIVE_TEMPLATES } from '../data/initiative-templates';
import { AMBITION_TEMPLATES, REACTIVE_AMBITION_TEMPLATES } from '../data/ambition-templates';
import {
  INITIATIVE_COOLDOWN_TICKS,
  INITIATIVE_MAX_SCORE,
  INITIATIVE_AMBITION_ALIGNMENT_BONUS,
  INITIATIVE_WEALTH_SURPLUS_BONUS,
  INITIATIVE_MIN_WEALTH_FLOOR,
} from '../data/initiative-constants';
import {
  ENABLE_MENTORSHIP,
  MENTOR_MIN_TIER,
  APPRENTICE_MIN_TIER,
  APPRENTICE_MAX_TIER,
} from '../data/mentorship-constants';
import { computeCapability, computeTier } from './domainCapability';
import { getAgentsAtLocation } from './graphQueries';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';

// ─── Settlement Hierarchy ────────────────────────────────────────────
// Each tier includes itself and everything above it.

const SETTLEMENT_HIERARCHY = ['hamlet', 'village', 'town', 'city', 'capital'] as const;

function meetsSubtypeRequirement(locationSubtype: string, required: string): boolean {
  const locIdx = SETTLEMENT_HIERARCHY.indexOf(locationSubtype as typeof SETTLEMENT_HIERARCHY[number]);
  const reqIdx = SETTLEMENT_HIERARCHY.indexOf(required as typeof SETTLEMENT_HIERARCHY[number]);
  if (reqIdx === -1) return true;
  if (locIdx === -1) return false;
  return locIdx >= reqIdx;
}

// ─── Ambition Category → Initiative Category Alignment ───────────────
// Which ambition categories unlock the bonus for each initiative category.

const AMBITION_CATEGORY_ALIGNMENT: Record<InitiativeTemplate['category'], string[]> = {
  founding:  ['dominion', 'legacy'],
  social:    ['legacy', 'survival'],
  religious: ['devotion'],
  espionage: ['vengeance', 'dominion'],
  quest:     ['discovery', 'dominion'],
};

const ALL_AMBITION_TEMPLATES = [...AMBITION_TEMPLATES, ...REACTIVE_AMBITION_TEMPLATES];

// ─── Main Export ─────────────────────────────────────────────────────

export interface InitiativeCandidateResult {
  candidates: InitiativeCandidate[];
  rejections: { templateId: string; reason: string }[];
}

/**
 * Generate scored initiative candidates for one agent.
 *
 * @param graph - World graph
 * @param agentId - Agent to evaluate
 * @param locationId - Agent's current located_at target (may be sublocation)
 * @param tick - Current tick
 * @param activeAmbitionTemplateIds - Template IDs of agent's active ambitions
 */
export function generateInitiativeCandidates(
  graph: WorldGraph,
  agentId: string,
  locationId: string,
  tick: number,
  activeAmbitionTemplateIds: readonly string[],
): InitiativeCandidateResult {
  const candidates: InitiativeCandidate[] = [];
  const rejections: { templateId: string; reason: string }[] = [];

  const agentNode = graph.getNode(agentId);
  if (!agentNode) return { candidates, rejections };

  const props = agentNode.properties as Record<string, unknown>;

  // Global checks — these skip ALL templates if they fail.

  // 1. Agent must not have an active initiative in progress.
  if (props.activeInitiative != null) {
    return { candidates, rejections };
  }

  // 2. Wealth floor — agents in survival mode ignore initiatives.
  const wealth = (props.wealth as number | undefined) ?? 0;
  if (wealth < INITIATIVE_MIN_WEALTH_FLOOR) {
    return { candidates, rejections };
  }

  // 3. Cooldown — minimum ticks since last initiative completed.
  const lastCompletedTick = (props.lastInitiativeCompletedTick as number | undefined) ?? -9999;
  if (tick - lastCompletedTick < INITIATIVE_COOLDOWN_TICKS) {
    return { candidates, rejections };
  }

  // Resolve to the parent location for spatial checks (agent may be at sublocation).
  const locationNode = graph.getNode(locationId);
  const parentLocationId = (locationNode?.properties.parentLocationId as string | undefined) ?? locationId;
  const resolvedLocationNode = graph.getNode(parentLocationId);
  const locationSubtype = (resolvedLocationNode?.properties.locationSubtype as string | undefined) ?? '';

  const axiologicalProfile = (props.axiologicalProfile as AxiologicalProfile | undefined) ?? {} as AxiologicalProfile;
  const inspireBonus = (props.initiativeInspireBonus as number | undefined) ?? 0;

  // Pre-compute ambition categories for bonus check.
  const activeAmbitionCategories = new Set<string>();
  for (const templateId of activeAmbitionTemplateIds) {
    const template = ALL_AMBITION_TEMPLATES.find(t => t.id === templateId);
    if (template) activeAmbitionCategories.add(template.category);
  }

  // Per-template evaluation.
  for (const template of INITIATIVE_TEMPLATES) {
    const reject = (reason: string) => rejections.push({ templateId: template.id, reason });

    // ── Train Apprentice (THR-75) — isolated branch ───────────────
    // Mentorship has dynamic Reach prerequisites: the mentor must be MENTOR_MIN_TIER+
    // in *some* Reach AND have a colocated eligible apprentice in that same Reach.
    // Domain and apprentice are selected at edge-creation time in phaseMentorship.
    if (template.id === 'initiative.train-apprentice') {
      if (!ENABLE_MENTORSHIP) {
        reject('mentorship disabled (ENABLE_MENTORSHIP=false)');
        continue;
      }

      const colocated = getAgentsAtLocation(graph, parentLocationId).filter(a => a.id !== agentId);
      let mentorshipEligible = false;

      for (const domain of REACH_DOMAINS) {
        const mentorTier = computeTier(computeCapability(graph, agentId, domain));
        if (mentorTier < MENTOR_MIN_TIER) continue;

        // Look for an eligible apprentice colocated and not already mentored in this domain
        for (const candidateAppr of colocated) {
          if (candidateAppr.properties.actorType !== 'individual') continue;
          // Ascendants are excluded from apprentice eligibility (content choice, not special-case)
          if (candidateAppr.properties.actorType === 'ascendant') continue;
          const apprTier = computeTier(computeCapability(graph, candidateAppr.id, domain));
          if (apprTier < APPRENTICE_MIN_TIER || apprTier > APPRENTICE_MAX_TIER) continue;
          // Skip if apprentice already has an active mentors edge (in any domain)
          const existing = graph.getIncomingEdges(candidateAppr.id, 'mentors');
          const activeExisting = existing.some(e => {
            const phase = e.properties.phase as string | undefined;
            return phase === 'offered' || phase === 'training';
          });
          if (activeExisting) continue;
          mentorshipEligible = true;
          break;
        }
        if (mentorshipEligible) break;
      }

      if (!mentorshipEligible) {
        reject('no eligible apprentice colocated, or no Reach at MENTOR_MIN_TIER');
        continue;
      }

      // Scoring: axiological + ambition alignment + one-time mentorship-inspire bonus
      const axiologicalScore = computeAxiologicalScore(axiologicalProfile, template);
      const aligned = AMBITION_CATEGORY_ALIGNMENT[template.category] ?? [];
      const ambitionBonus = aligned.some(cat => activeAmbitionCategories.has(cat))
        ? INITIATIVE_AMBITION_ALIGNMENT_BONUS
        : 0;

      const mentorshipInspireBonus = (props.mentorshipInspireBonus as number | undefined) ?? 0;
      const totalInspire = inspireBonus + mentorshipInspireBonus;

      const finalScore = Math.min(
        INITIATIVE_MAX_SCORE,
        axiologicalScore + ambitionBonus + totalInspire,
      );

      candidates.push({
        templateId: template.id,
        template,
        agentId,
        locationId: parentLocationId,
        axiologicalScore,
        ambitionBonus,
        wealthSurplusBonus: 0,
        inspireBonus: totalInspire,
        finalScore,
      });
      continue;
    }

    // Wealth gate.
    if (wealth < template.minWealth) {
      reject(`wealth ${wealth} < minWealth ${template.minWealth}`);
      continue;
    }

    // Reach requirements.
    if (template.requiredReaches) {
      let passed = true;
      for (const [domain, requiredTier] of Object.entries(template.requiredReaches) as [ReachDomain, number][]) {
        const tier = computeTier(computeCapability(graph, agentId, domain));
        if (tier < requiredTier) {
          reject(`${domain} tier ${tier} < required ${requiredTier}`);
          passed = false;
          break;
        }
      }
      if (!passed) continue;
    }

    // Axiological bias gate.
    if (template.requiredAxiologicalBias) {
      const { axis, direction, minStrength } = template.requiredAxiologicalBias;
      const axisValue = axiologicalProfile[axis] ?? 0;
      // 'left' = first word = positive pole, 'right' = second word = negative pole
      const passes = direction === 'left'
        ? axisValue >= minStrength
        : axisValue <= -minStrength;
      if (!passes) {
        reject(`${axis} direction=${direction} value=${axisValue.toFixed(2)} < minStrength=${minStrength}`);
        continue;
      }
    }

    // Location filter.
    if (template.locationFilter) {
      const filter = template.locationFilter;

      if (filter.requiredSubtype && !meetsSubtypeRequirement(locationSubtype, filter.requiredSubtype)) {
        reject(`locationSubtype '${locationSubtype}' does not meet '${filter.requiredSubtype}'`);
        continue;
      }

      if (filter.minPopulation != null) {
        const agentsHere = getAgentsAtLocation(graph, parentLocationId);
        // Count all agents except the initiative-taker themselves.
        const others = agentsHere.filter(a => a.id !== agentId);
        if (others.length + 1 < filter.minPopulation) {
          reject(`population ${others.length + 1} < minPopulation ${filter.minPopulation}`);
          continue;
        }
      }

      if (filter.requiredSublocationTypeId) {
        const sublocations = graph.getOutgoingEdges(parentLocationId, 'contains')
          .map(e => graph.getNode(e.target))
          .filter(n => n != null && n.type === 'location');
        const hasSubloc = sublocations.some(
          n => n!.properties.sublocationTypeId === filter.requiredSublocationTypeId,
        );
        if (!hasSubloc) {
          reject(`no sublocation of type '${filter.requiredSublocationTypeId}' at location`);
          continue;
        }
      }
    }

    // Scoring.
    const axiologicalScore = computeAxiologicalScore(axiologicalProfile, template);

    const aligned = AMBITION_CATEGORY_ALIGNMENT[template.category] ?? [];
    const ambitionBonus = aligned.some(cat => activeAmbitionCategories.has(cat))
      ? INITIATIVE_AMBITION_ALIGNMENT_BONUS
      : 0;

    const wealthSurplusBonus = Math.min(
      INITIATIVE_WEALTH_SURPLUS_BONUS,
      INITIATIVE_WEALTH_SURPLUS_BONUS * (wealth - template.minWealth) / 100,
    );

    const finalScore = Math.min(
      INITIATIVE_MAX_SCORE,
      axiologicalScore + ambitionBonus + wealthSurplusBonus + inspireBonus,
    );

    candidates.push({
      templateId: template.id,
      template,
      agentId,
      locationId: parentLocationId,
      axiologicalScore,
      ambitionBonus,
      wealthSurplusBonus,
      inspireBonus,
      finalScore,
    });
  }

  // Sort descending by finalScore.
  candidates.sort((a, b) => b.finalScore - a.finalScore);

  return { candidates, rejections };
}

// ─── Scoring Helpers ─────────────────────────────────────────────────

function computeAxiologicalScore(
  profile: AxiologicalProfile,
  template: InitiativeTemplate,
): number {
  if (template.motivations.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const motivation of template.motivations) {
    const axisValue = profile[motivation.axis] ?? 0;
    // left = first word = positive pole; right = second word = negative pole
    const directionValue = motivation.direction === 'left' ? axisValue : -axisValue;
    weightedSum += Math.max(0, directionValue) * motivation.weight;
    totalWeight += motivation.weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
