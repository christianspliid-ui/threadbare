/**
 * Complication Selection Pipeline — THR-20
 *
 * Selects a ComplicationResult for failure-tier step outcomes.
 * Called from computeOutcomeConsequence() when a ComplicationContext is provided.
 *
 * Pipeline:
 *   1. Determine severity from outcome tier
 *   2. Build candidate pool (filter by severity + requirements)
 *   3. Score candidates (reach affinity, omen synergy, stacking penalties, doom bonus)
 *   4. Weighted PRNG selection from top N candidates
 *   5. Fill prose placeholders
 *   6. Return ComplicationResult (or null on empty pool / minor-weight miss)
 *
 * ─── Fail-soft ──────────────────────────────────────────────────────
 * | Failure case                        | Fallback                                  |
 * |-------------------------------------|-------------------------------------------|
 * | No candidates pass requirement filter | Return null (no complication)           |
 * | success_at_cost PRNG roll > weight  | Return null (no complication)             |
 * | Edge/node lookup fails in prose fill| Use placeholder literal e.g. "(unknown)"  |
 */

import type {
  ComplicationTemplate,
  ComplicationContext,
  ComplicationResult,
  ComplicationSeverity,
  ComplicationCategory,
} from '../types/complication';
import {
  COMPLICATION_MINOR_WEIGHT,
  COMPLICATION_REACH_AFFINITY_SCORE,
  COMPLICATION_REACH_SECONDARY_SCORE,
  COMPLICATION_OMEN_SYNERGY_BONUS,
  COMPLICATION_DIMINISHING_PENALTY,
  COMPLICATION_DOOM_CONVERGENCE_BONUS,
  COMPLICATION_TOP_CANDIDATES,
} from '../types/complication';
import type { StepOutcome } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import { COMPLICATION_TEMPLATES } from '../data/complication-templates';

// ─── Omen → Complication category mapping ────────────────────────────────────

/**
 * Maps active omen categories to the complication categories they boost.
 * A doom_echo omen increases the chance of worsening_convergence complications.
 * A sphere_surge omen increases location_fallout and rival_attention complications.
 * A cultural omen increases witness, broken_trust, and debt complications.
 * A seasonal omen increases scar, partial_progress, and collateral_success complications.
 */
const OMEN_CATEGORY_SYNERGY: Record<string, ComplicationCategory[]> = {
  doom_echo: ['worsening_convergence', 'rival_attention'],
  sphere_surge: ['location_fallout', 'worsening_convergence'],
  cultural: ['witness', 'broken_trust', 'debt'],
  seasonal: ['scar', 'partial_progress', 'collateral_success'],
};

// ─── Severity mapping ─────────────────────────────────────────────────────────

export function determineSeverity(outcome: StepOutcome): ComplicationSeverity | null {
  switch (outcome) {
    case 'success_at_cost': return 'minor';
    case 'failure':         return 'standard';
    case 'critical_failure': return 'severe';
    default:                return null; // success tiers: no complication
  }
}

// ─── Requirement checker ──────────────────────────────────────────────────────

function requirementsMet(
  template: ComplicationTemplate,
  ctx: ComplicationContext,
): boolean {
  const req = template.requires;
  if (!req) return true;

  if (req.witnessesPresent && ctx.presentAgentIds.length === 0) return false;
  if (req.factionRelationship && ctx.factionIds.length === 0) return false;
  if (req.minDoomStage !== undefined && ctx.doomStage < req.minDoomStage) return false;
  if (req.activeOmenCategory && ctx.activeOmenCategory !== req.activeOmenCategory) return false;
  if (req.atSettlement && !ctx.atSettlement) return false;
  if (req.hasAttachmentType) {
    const hasIt = ctx.existingAttachments.some(id => id.includes(req.hasAttachmentType!));
    if (!hasIt) return false;
  }
  if (req.reachIn && !req.reachIn.includes(ctx.template.reach)) return false;

  return true;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreCandidate(
  template: ComplicationTemplate,
  ctx: ComplicationContext,
): number {
  let score = 0;

  // Reach affinity
  if (template.reachAffinity.length === 0) {
    // Universal template — secondary score
    score += COMPLICATION_REACH_SECONDARY_SCORE;
  } else if (template.reachAffinity[0] === ctx.template.reach) {
    // Primary reach match
    score += COMPLICATION_REACH_AFFINITY_SCORE;
  } else if (template.reachAffinity.includes(ctx.template.reach)) {
    // Secondary reach match
    score += COMPLICATION_REACH_SECONDARY_SCORE;
  } else {
    // No affinity for this reach — still eligible but lowest base score
    score += COMPLICATION_REACH_SECONDARY_SCORE * 0.5;
  }

  // Omen synergy bonus
  if (ctx.activeOmenCategory) {
    const synergyCategories = OMEN_CATEGORY_SYNERGY[ctx.activeOmenCategory] ?? [];
    if (synergyCategories.includes(template.category)) {
      score += COMPLICATION_OMEN_SYNERGY_BONUS;
    }
  }

  // Scar stacking penalty — discourage repeat scars
  if (template.category === 'scar') {
    const activeScarCount = ctx.existingAttachments.filter(id =>
      id.includes('shaken') || id.includes('wounded') || id.includes('humiliated') || id.includes('haunted'),
    ).length;
    if (activeScarCount >= 1) {
      score += COMPLICATION_DIMINISHING_PENALTY * activeScarCount;
    }
  }

  // Location fallout diminishing returns when unrest is already high
  if (template.category === 'location_fallout') {
    // unrest is 0-100; at 70+ apply penalty
    if (ctx.locationUnrest >= 70) {
      score += COMPLICATION_DIMINISHING_PENALTY;
    }
  }

  // Worsening convergence doom bonus
  if (template.category === 'worsening_convergence' && ctx.doomStage >= 3) {
    score += COMPLICATION_DOOM_CONVERGENCE_BONUS;
  }

  // Generic diminishing penalty for same-category complication already active
  // (excludes scar, which has its own logic above)
  if (template.category !== 'scar') {
    const activeSameCategory = ctx.existingAttachments.filter(id =>
      id.startsWith(`complication.${template.category}`),
    ).length;
    if (activeSameCategory >= 1) {
      score += COMPLICATION_DIMINISHING_PENALTY;
    }
  }

  return Math.max(0, score);
}

// ─── Prose placeholder filler ─────────────────────────────────────────────────

function fillProse(
  template: string,
  ctx: ComplicationContext,
  rng: () => number,
): string {
  const actorNode = ctx.graph.getNode(ctx.action.actorId);
  const actorName = actorNode?.name ?? 'The agent';

  // Simple pronoun: default to 'their' (neutral)
  const possessive = 'their';

  // Location name
  const locationNode = ctx.locationId ? ctx.graph.getNode(ctx.locationId) : undefined;
  const locationName = locationNode?.name ?? 'the area';

  // Witness: pick a random present agent
  let witnessName = 'a bystander';
  if (ctx.presentAgentIds.length > 0) {
    const idx = Math.floor(rng() * ctx.presentAgentIds.length);
    const witnessNode = ctx.graph.getNode(ctx.presentAgentIds[idx]);
    witnessName = witnessNode?.name ?? 'a bystander';
  }

  // Faction: pick first faction
  let factionName = 'the faction';
  if (ctx.factionIds.length > 0) {
    const factionNode = ctx.graph.getNode(ctx.factionIds[0]);
    factionName = factionNode?.name ?? 'the faction';
  }

  // Omen atmosphere phrase
  let omenAtmosphere = '';
  if (ctx.activeOmenCategory === 'doom_echo') omenAtmosphere = 'the weight of approaching doom';
  else if (ctx.activeOmenCategory === 'sphere_surge') omenAtmosphere = 'surging cosmic energies';
  else if (ctx.activeOmenCategory === 'cultural') omenAtmosphere = 'shifting social currents';
  else if (ctx.activeOmenCategory === 'seasonal') omenAtmosphere = 'the turning of the season';

  return template
    .replace(/\{name\}/g, actorName)
    .replace(/\{possessive\}/g, possessive)
    .replace(/\{location\}/g, locationName)
    .replace(/\{witness\}/g, witnessName)
    .replace(/\{faction\}/g, factionName)
    .replace(/\{omen_atmosphere\}/g, omenAtmosphere || 'unseen forces');
}

// ─── Weighted selection ────────────────────────────────────────────────────────

/**
 * Weighted PRNG selection. Given a list of (template, score) pairs,
 * selects one proportional to scores.
 */
function weightedSelect<T extends { score: number; template: ComplicationTemplate }>(
  candidates: T[],
  rng: () => number,
): T | null {
  if (candidates.length === 0) return null;
  const total = candidates.reduce((sum, c) => sum + Math.max(c.score, 0.01), 0);
  const roll = rng() * total;
  let cumulative = 0;
  for (const c of candidates) {
    cumulative += Math.max(c.score, 0.01);
    if (roll <= cumulative) return c;
  }
  return candidates[candidates.length - 1];
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Select and return a ComplicationResult for the given outcome + context.
 * Returns null when:
 * - Outcome is not a failure tier
 * - No templates match requirements
 * - success_at_cost probability roll fails (COMPLICATION_MINOR_WEIGHT)
 */
export function selectComplication(
  outcome: StepOutcome,
  ctx: ComplicationContext,
): ComplicationResult | null {
  const severity = determineSeverity(outcome);
  if (!severity) return null;

  // success_at_cost: probabilistic — only COMPLICATION_MINOR_WEIGHT fraction of the time
  if (severity === 'minor' && ctx.rng() > COMPLICATION_MINOR_WEIGHT) {
    return null;
  }

  // 1. Filter: severity + requirements
  const eligible = COMPLICATION_TEMPLATES.filter(
    t => t.severity === severity && requirementsMet(t, ctx),
  );

  if (eligible.length === 0) {
    emitTrace({
      tick: ctx.action.startTick,
      category: 'complication_selection',
      actionId: ctx.action.actionId,
      actorId: ctx.action.actorId,
      stepIndex: ctx.stepIndex,
      outcome,
      severity,
      candidates: [],
      selected: 'none',
      reason: 'no_eligible_templates',
      summary: `Complication: no eligible templates for ${outcome} (${severity})`,
    });
    return null;
  }

  // 2. Score all eligible templates
  const scored = eligible.map(template => ({
    template,
    score: scoreCandidate(template, ctx),
  }));

  // 3. Sort descending, take top N
  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, COMPLICATION_TOP_CANDIDATES);

  // 4. Weighted selection from top N
  const selected = weightedSelect(topCandidates, ctx.rng);
  if (!selected) return null;

  // 5. Emit selection trace
  const reasonParts: string[] = [];
  if (ctx.activeOmenCategory && OMEN_CATEGORY_SYNERGY[ctx.activeOmenCategory]?.includes(selected.template.category)) {
    reasonParts.push('omen_synergy');
  }
  if (selected.template.reachAffinity.includes(ctx.template.reach)) {
    reasonParts.push('reach_affinity');
  }
  if (ctx.doomStage >= 3 && selected.template.category === 'worsening_convergence') {
    reasonParts.push('doom_bonus');
  }
  const reason = reasonParts.join(',') || 'scored_selection';

  emitTrace({
    tick: ctx.action.startTick,
    category: 'complication_selection',
    actionId: ctx.action.actionId,
    actorId: ctx.action.actorId,
    stepIndex: ctx.stepIndex,
    outcome,
    severity,
    candidates: topCandidates.map(c => ({ templateId: c.template.id, score: c.score })),
    selected: selected.template.id,
    reason,
    summary: `Complication selected: "${selected.template.name}" (${selected.template.category}/${severity}) for ${outcome}`,
  });

  // 6. Fill prose
  if (selected.template.proseTemplates.length === 0) {
    return null; // Template is malformed; fail-soft
  }
  const proseIdx = Math.floor(ctx.rng() * selected.template.proseTemplates.length);
  const rawProse = selected.template.proseTemplates[proseIdx];
  const prose = fillProse(rawProse, ctx, ctx.rng);

  return {
    templateId: selected.template.id,
    category: selected.template.category,
    severity: selected.template.severity,
    prose,
    effects: selected.template.effects,
    narrativeTag: `complication_${selected.template.category}`,
    significanceBoost: selected.template.significanceBoost,
    name: selected.template.name,
  };
}
