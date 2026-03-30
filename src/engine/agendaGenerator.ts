/**
 * Agenda Generator — produces 2-4 contextual agenda options for a player intervention.
 *
 * Selection is contextual, not random. Filters and ranks agenda templates based on:
 * - Target agent's archetype (affinity match)
 * - Target agent's current values (skip already-maxed)
 * - Player's primary sphere (sphere-aligned agendas score higher)
 * - Intervention type (templates are pre-filtered by type)
 */

import type { InterventionType } from '../types/dream';
import type { AxiologicalProfile, ValuePair } from '../types/agent';
import type { SphereName } from '../types';
import { AGENDA_TEMPLATES, type AgendaTemplate } from '../data/agenda-content';

// ─── Constants ────────────────────────────────────────────────────
const MIN_AGENDAS = 2;
const MAX_AGENDAS = 4;
/** Value threshold: if profile is above this for left pole (or below -threshold for right), skip that agenda */
const VALUE_MAXED_THRESHOLD = 0.85;
/** Score bonus for archetype affinity match */
const ARCHETYPE_AFFINITY_BONUS = 3;
/** Score bonus for sphere alignment */
const SPHERE_ALIGNMENT_BONUS = 1;

// Sphere → reach mapping (which reaches align with which spheres)
const SPHERE_REACH_AFFINITY: Record<string, string[]> = {
  force: ['iron'],
  matter: ['stone'],
  energy: ['iron', 'star'],
  life: ['gold', 'heart'],
  mind: ['eye', 'shadow'],
  spirit: ['veil', 'heart'],
  time: ['star'],
  entropy: ['shadow', 'star'],
};

export interface GenerateAgendasInput {
  interventionType: InterventionType;
  targetArchetypeId: string;
  targetProfile: AxiologicalProfile;
  playerPrimarySphere: SphereName;
  seed: number;
}

/**
 * Generates 2-4 contextual agenda options for a player intervention.
 *
 * Algorithm:
 * 1. Fetch templates for the intervention type
 * 2. Filter out agendas for already-maxed values
 * 3. Score remaining agendas by archetype affinity + sphere alignment + value freedom
 * 4. Sort by score; tie-break deterministically with seed
 * 5. Return top 2-4
 */
export function generateAgendas(input: GenerateAgendasInput): AgendaTemplate[] {
  const { interventionType, targetArchetypeId, targetProfile, playerPrimarySphere, seed } = input;

  // Step 1: Get templates for this intervention type
  const candidates = AGENDA_TEMPLATES[interventionType] ?? [];
  if (candidates.length === 0) return [];

  // Step 2: Filter out agendas for already-maxed values
  const filtered = candidates.filter(tpl => {
    const currentValue = targetProfile[tpl.valuePair] ?? 0;
    if (tpl.valueDirection === 'left' && currentValue > VALUE_MAXED_THRESHOLD) return false;
    if (tpl.valueDirection === 'right' && currentValue < -VALUE_MAXED_THRESHOLD) return false;
    return true;
  });

  if (filtered.length <= MIN_AGENDAS) return filtered.length > 0 ? filtered : candidates.slice(0, MIN_AGENDAS);

  // Step 3: Score each agenda
  const scored = filtered.map(tpl => {
    let score = 0;
    // Archetype affinity
    if (tpl.archetypeAffinities.includes(targetArchetypeId)) {
      score += ARCHETYPE_AFFINITY_BONUS;
    }
    // Sphere alignment: check if agenda's reach matches player sphere
    const alignedReaches = SPHERE_REACH_AFFINITY[playerPrimarySphere] ?? [];
    if (alignedReaches.includes(tpl.reachBoost.reach)) {
      score += SPHERE_ALIGNMENT_BONUS;
    }
    // Slight bonus for values closer to 0 (more room to push)
    const currentValue = targetProfile[tpl.valuePair] ?? 0;
    score += (1 - Math.abs(currentValue)) * 0.5;

    return { template: tpl, score };
  });

  // Step 4: Sort by score descending, then use seed for deterministic selection among ties
  scored.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) > 0.01) return diff;
    // Tie-break with seed
    const hashA = Math.abs(simpleHash(a.template.id + seed)) % 1000;
    const hashB = Math.abs(simpleHash(b.template.id + seed)) % 1000;
    return hashB - hashA;
  });

  // Step 5: Pick top 2-4 (seed determines exact count)
  const count = MIN_AGENDAS + (Math.abs(seed) % (MAX_AGENDAS - MIN_AGENDAS + 1));
  return scored.slice(0, Math.min(count, scored.length)).map(s => s.template);
}

/** Simple string hash for deterministic tie-breaking */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}
