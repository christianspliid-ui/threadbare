/**
 * Unified Action Templates — all 108+ templates in one format.
 *
 * ═══════════════════════════════════════════════════════════════════
 * SOURCE OF TRUTH: This file owns the canonical list of all action
 * templates. Old files (action-template-content.ts, encounter-content.ts)
 * are preserved but deprecated.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Templates are organized into three categories:
 *   action.*   — single-step CRUD actions (36 total, 4 per reach × 9 reaches)
 *   encounter.* — multi-step encounter templates (10+ templates)
 *   divine.*   — divine interventions for the ascendant (8 total)
 */

import type { UnifiedActionTemplate, ActionStep, ActionScale } from '../types/unifiedAction';
import type { ActorType } from '../types/graph';
import { ACTION_TEMPLATES, type ActionTemplateData } from './action-template-content';
import { ENCOUNTER_TEMPLATES } from './encounter-content';
import { ENCOUNTER_TYPE_MOTIVATIONS, type EncounterTemplate, type EncounterStep } from '../types/encounter';
import { DECAY_CONSTANTS } from '../engine/decayCurve';
import { INTERVENTION_DEFINITIONS } from './dream-content';

// ─── Migration: ActionTemplateData → UnifiedActionTemplate ─────────

/**
 * Infer ActionScale from actor affinities.
 * faction/settlement actors operate at regional scale;
 * individual actors operate at personal scale.
 */
function inferScaleFromActorAffinities(affinities?: string[]): ActionScale {
  if (!affinities || affinities.length === 0) return 'regional';
  if (affinities.includes('faction') || affinities.includes('settlement')) return 'regional';
  if (affinities.includes('individual')) return 'personal';
  return 'regional';
}

/**
 * Map encounterType to a CRUD classification.
 */
function encounterTypeToCrud(
  encounterType: string,
): 'create' | 'read' | 'update' | 'delete' {
  switch (encounterType) {
    case 'create':
    case 'hire':
    case 'build':
      return 'create';
    case 'explore':
    case 'acquire':
    case 'steal':
    case 'trade':
      return 'read';
    case 'duel':
      return 'delete';
    default: // assist, lead, and any future types
      return 'update';
  }
}

/**
 * Convert an EncounterStep to an ActionStep.
 * EncounterStep difficulty is on 0–100 scale; ActionStep uses 0–1.
 */
function migrateEncounterStep(step: EncounterStep): ActionStep {
  return {
    reach: step.reach,
    duration: { min: 1, max: 2 },
    difficulty: step.difficulty / 100,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
    narrativeTemplate: step.narrative,
  };
}

/**
 * Convert an old ActionTemplateData (1-step CRUD action) to a UnifiedActionTemplate.
 */
export function migrateActionTemplate(old: ActionTemplateData): UnifiedActionTemplate {
  const affinities = old.actorAffinities as ActorType[] | undefined;
  const scale = inferScaleFromActorAffinities(old.actorAffinities);

  return {
    id: old.id,
    name: old.name,
    reach: old.reach,
    crudType: old.crudType,
    scale,
    steps: [
      {
        reach: old.reach,
        duration: { min: old.durationRange.min, max: old.durationRange.max },
        difficulty: old.difficulty,
        onSuccess: old.onSuccess,
        onFailure: old.onFailure,
        failBehavior: 'fail_action',
      },
    ],
    apCost: 1,
    actorAffinities: affinities ?? ['individual', 'faction'],
    locationSubtypes: old.locationSubtypes,
    sphereAffinity: old.sphereAffinity as UnifiedActionTemplate['sphereAffinity'],
    motivations: old.motivations,
    narrativeTemplates: {
      initiation: old.narrativeTemplates.initiation,
      success: old.narrativeTemplates.success,
      failure: old.narrativeTemplates.failure,
    },
  };
}

/**
 * Convert an EncounterTemplate (multi-step) to a UnifiedActionTemplate.
 */
export function migrateEncounterTemplate(old: EncounterTemplate): UnifiedActionTemplate {
  const crudType = encounterTypeToCrud(old.encounterType);
  const motivations = ENCOUNTER_TYPE_MOTIVATIONS[old.encounterType] ?? old.motivations;

  // Use first step for initiation narrative, last step for success/failure
  const firstStep = old.steps[0];
  const lastStep = old.steps[old.steps.length - 1];

  return {
    id: old.id,
    name: old.name,
    reach: old.reachPrimary,
    crudType,
    scale: 'local',
    steps: old.steps.map(migrateEncounterStep),
    apCost: 1,
    actorAffinities: ['individual'],
    locationSubtypes: [
      ...old.locationTypes,
      ...(old.sublocationTypes ?? []),
    ],
    sphereAffinity: old.sphereAffinity,
    motivations,
    narrativeTemplates: {
      initiation: firstStep?.narrative ?? `${old.name} begins.`,
      success: lastStep?.onSuccess.narrative ?? `${old.name} succeeds.`,
      failure: lastStep?.onFailure.narrative ?? `${old.name} fails.`,
    },
  };
}

// ─── Divine Intervention Templates ───────────────────────────────

/**
 * The 8 divine intervention types as UnifiedActionTemplates.
 * Each has cosmic scale, ascendant-only affinity, and uses
 * apply_influence GraphOp to encode effects as data.
 */
const DIVINE_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  {
    id: 'divine.dream',
    name: 'Dream',
    reach: 'heart',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'dream',
          sphere: 'mind',
          ...DECAY_CONSTANTS.dream,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.dream.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'mind',
    motivations: [],
    narrativeTemplates: {
      initiation: 'reaches into the sleeping mind',
      success: 'the dream takes hold, reshaping desire from within',
      failure: 'the mind resists the divine intrusion',
    },
  },
  {
    id: 'divine.persuade',
    name: 'Persuade',
    reach: 'heart',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'persuade',
          sphere: 'spirit',
          ...DECAY_CONSTANTS.persuade,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.persuade.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'spirit',
    motivations: [],
    narrativeTemplates: {
      initiation: 'whispers divine conviction into a mortal soul',
      success: 'the mortal feels a sudden certainty of purpose',
      failure: 'the mortal\'s will proves unyielding',
    },
  },
  {
    id: 'divine.deceive',
    name: 'Deceive',
    reach: 'shadow',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'shadow',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'deceive',
          sphere: 'mind',
          ...DECAY_CONSTANTS.deceive,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.deceive.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'mind',
    motivations: [],
    narrativeTemplates: {
      initiation: 'weaves a veil of falsehood across mortal perception',
      success: 'the mortal sees what the divine wills them to see',
      failure: 'the mortal\'s discernment pierces the veil',
    },
  },
  {
    id: 'divine.intimidate',
    name: 'Intimidate',
    reach: 'iron',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'intimidate',
          sphere: 'force',
          ...DECAY_CONSTANTS.intimidate,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.intimidate.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'force',
    motivations: [],
    narrativeTemplates: {
      initiation: 'presses divine force upon a mortal will',
      success: 'fear runs cold through the mortal\'s veins',
      failure: 'the mortal stands unbowed against divine pressure',
    },
  },
  {
    id: 'divine.inspire',
    name: 'Inspire',
    reach: 'heart',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'inspire_intervention',
          sphere: 'life',
          ...DECAY_CONSTANTS.inspire_intervention,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.inspire_intervention.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'life',
    motivations: [],
    narrativeTemplates: {
      initiation: 'kindles divine fire within a mortal spirit',
      success: 'the mortal burns with sudden, inexplicable purpose',
      failure: 'the spark finds no purchase in this cold heart',
    },
  },
  {
    id: 'divine.coincidence',
    name: 'Coincidence',
    reach: 'time',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'time',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'coincidence',
          sphere: 'time',
          ...DECAY_CONSTANTS.coincidence,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.coincidence.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'time',
    motivations: [],
    narrativeTemplates: {
      initiation: 'arranges the threads of fate into unlikely alignment',
      success: 'what seems chance is divine architecture',
      failure: 'the threads of fate resist manipulation',
    },
  },
  {
    id: 'divine.omen',
    name: 'Omen',
    reach: 'stone',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'omen',
          sphere: 'spirit',
          ...DECAY_CONSTANTS.omen,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.omen.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'spirit',
    motivations: [],
    narrativeTemplates: {
      initiation: 'plants a symbol in the world\'s fabric for mortal eyes',
      success: 'the mortal reads the sign and feels its pull',
      failure: 'the sign passes unseen or misread',
    },
  },
  {
    id: 'divine.afflict_bless',
    name: 'Afflict/Bless',
    reach: 'life',
    crudType: 'update',
    scale: 'cosmic',
    steps: [{
      reach: 'life',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [{
        op: 'apply_influence',
        target: '$target',
        influence: {
          interventionType: 'afflict_bless',
          sphere: 'life',
          ...DECAY_CONSTANTS.afflict_bless,
        },
      }],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: INTERVENTION_DEFINITIONS.afflict_bless.baseCost,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'life',
    motivations: [],
    narrativeTemplates: {
      initiation: 'reaches into mortal flesh to alter its condition',
      success: 'the divine touch reshapes body and spirit alike',
      failure: 'the mortal constitution repels the divine touch',
    },
  },
];

// ─── Unified Template Registry ────────────────────────────────────

/**
 * All templates in unified format.
 * Migration functions are applied eagerly at module load time.
 */
export const UNIFIED_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  ...ACTION_TEMPLATES.map(migrateActionTemplate),
  ...ENCOUNTER_TEMPLATES.map(migrateEncounterTemplate),
  ...DIVINE_ACTION_TEMPLATES,
];

/**
 * Look up a template by its ID. Returns undefined if not found.
 */
export function getUnifiedTemplateById(id: string): UnifiedActionTemplate | undefined {
  return UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
}
