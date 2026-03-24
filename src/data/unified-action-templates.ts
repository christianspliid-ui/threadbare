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

// ─── Location Action Templates ────────────────────────────────────
//
// Divine actions targeting location nodes (keeps, markets, shrines, etc.).
// targetCategories: ['location'] — only appears when a location is focused.

const LOCATION_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  {
    id: 'loc.ward',
    name: 'Ward',
    reach: 'rune',
    crudType: 'create',
    scale: 'regional',
    steps: [{
      reach: 'rune',
      duration: { min: 2, max: 4 },
      difficulty: 0.25,
      onSuccess: [
        { op: 'update_node', nodeId: '$target', changes: { magicalSaturation: '+0.15' } },
      ],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 3,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'order',
    targetCategories: ['location'],
    motivations: ['courage_prudence', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'weaves protective runes into the foundations of this place',
      success: 'the ward takes hold — unseen forces now guard this site',
      failure: 'the runes fray before setting; the ward does not hold',
    },
  },
  {
    id: 'loc.place_of_power',
    name: 'Place of Power',
    reach: 'rune',
    crudType: 'create',
    scale: 'regional',
    steps: [{
      reach: 'rune',
      duration: { min: 3, max: 5 },
      difficulty: 0.35,
      onSuccess: [
        { op: 'update_node', nodeId: '$target', changes: { magicalSaturation: '+0.30' } },
      ],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 5,
    actorAffinities: ['ascendant'],
    targetCategories: ['location'],
    motivations: ['loyalty_ambition', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'channels divine essence into the ley lines beneath this location',
      success: 'a place of power awakens — essence flows freely here',
      failure: 'the ley lines resist; the consecration fades',
    },
  },
  {
    id: 'loc.incite_unrest',
    name: 'Incite Unrest',
    reach: 'shadow',
    crudType: 'update',
    scale: 'regional',
    steps: [{
      reach: 'shadow',
      duration: { min: 2, max: 3 },
      difficulty: 0.30,
      onSuccess: [
        { op: 'update_node', nodeId: '$target', changes: { unrest: '+20' } },
      ],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 2,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'chaos',
    targetCategories: ['location'],
    motivations: ['mercy_ruthlessness', 'humility_pride'],
    narrativeTemplates: {
      initiation: 'stirs whispers of grievance through this settlement',
      success: 'tensions rise; the people begin to question their rulers',
      failure: 'the whispers are dismissed; order holds',
    },
  },
  {
    id: 'loc.fortify',
    name: 'Fortify',
    reach: 'iron',
    crudType: 'update',
    scale: 'regional',
    steps: [{
      reach: 'iron',
      duration: { min: 2, max: 4 },
      difficulty: 0.30,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 4,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'force',
    targetCategories: ['location'],
    targetSubtypes: ['keep', 'fortress', 'stronghold', 'watchtower', 'garrison'],
    motivations: ['courage_prudence', 'humility_pride'],
    narrativeTemplates: {
      initiation: 'breathes martial purpose into the walls of this fortification',
      success: 'the defenses are strengthened by divine will',
      failure: 'the blessing dissipates; the stones remain unchanged',
    },
  },
];

// ─── Attachment Action Templates ───────────────────────────────────
//
// Divine actions targeting artifact nodes (items, relics, etc.).
// targetCategories: ['artifact'] or ['artifact_legendary'].

const ATTACHMENT_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  {
    id: 'artifact.enchant',
    name: 'Enchant',
    reach: 'rune',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'rune',
      duration: { min: 2, max: 3 },
      difficulty: 0.30,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 4,
    actorAffinities: ['ascendant'],
    targetCategories: ['artifact'],
    motivations: ['loyalty_ambition', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'traces runes of power upon this artifact',
      success: 'the enchantment sets — power flows through the object',
      failure: 'the runes fade before they can bind',
    },
  },
  {
    id: 'artifact.attune',
    name: 'Attune',
    reach: 'heart',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 2 },
      difficulty: 0.20,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 2,
    actorAffinities: ['ascendant'],
    targetCategories: ['artifact'],
    motivations: ['loyalty_ambition', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'harmonizes this artifact with the divine sphere',
      success: 'the artifact resonates with new alignment',
      failure: 'the attunement fails; the artifact resists',
    },
  },
  {
    id: 'artifact.nullify',
    name: 'Nullify',
    reach: 'void',
    crudType: 'delete',
    scale: 'local',
    steps: [{
      reach: 'void',
      duration: { min: 1, max: 2 },
      difficulty: 0.25,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 3,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'void',
    targetCategories: ['artifact', 'artifact_legendary'],
    motivations: ['tradition_novelty', 'courage_prudence'],
    narrativeTemplates: {
      initiation: 'unravels the enchantments bound to this artifact',
      success: 'the magic drains away; the artifact is mundane once more',
      failure: 'the enchantments hold against the nullification',
    },
  },
  {
    id: 'artifact.curse',
    name: 'Curse',
    reach: 'shadow',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'shadow',
      duration: { min: 1, max: 3 },
      difficulty: 0.35,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 3,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'chaos',
    targetCategories: ['artifact', 'artifact_legendary'],
    motivations: ['mercy_ruthlessness', 'humility_pride'],
    narrativeTemplates: {
      initiation: 'binds a curse of misfortune to this object',
      success: 'the curse takes hold — ill fate clings to whoever carries it',
      failure: 'the curse fails to bind; the object remains unchanged',
    },
  },
];

// ─── Sublocation Action Templates ─────────────────────────────────
//
// Divine actions targeting sublocation nodes (shrines, ruins, etc.).
// Note: sublocations use nodeType 'location' with a sublocationCategory subtype.

const SUBLOCATION_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  {
    id: 'sub.sanctify',
    name: 'Sanctify',
    reach: 'rune',
    crudType: 'create',
    scale: 'local',
    steps: [{
      reach: 'rune',
      duration: { min: 2, max: 3 },
      difficulty: 0.25,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 4,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'spirit',
    targetCategories: ['sublocation'],
    targetSubtypes: ['shrine', 'temple', 'ruin', 'cave'],
    motivations: ['tradition_novelty', 'loyalty_ambition'],
    narrativeTemplates: {
      initiation: 'consecrates this ground to divine purpose',
      success: 'the site is sanctified — the divine presence is felt here',
      failure: 'the consecration fails; the ground remains inert',
    },
  },
  {
    id: 'sub.trap',
    name: 'Trap',
    reach: 'shadow',
    crudType: 'create',
    scale: 'local',
    steps: [{
      reach: 'shadow',
      duration: { min: 1, max: 2 },
      difficulty: 0.30,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 2,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'chaos',
    targetCategories: ['sublocation'],
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    narrativeTemplates: {
      initiation: 'lays a divine snare within this place',
      success: 'the trap is set — unseen and patient',
      failure: 'the snare unravels before it can be anchored',
    },
  },
  {
    id: 'sub.vision',
    name: 'Vision',
    reach: 'heart',
    crudType: 'read',
    scale: 'local',
    steps: [{
      reach: 'heart',
      duration: { min: 1, max: 1 },
      difficulty: 0.15,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 1,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'mind',
    targetCategories: ['sublocation'],
    motivations: ['loyalty_ambition', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'casts divine sight into the hidden depths of this place',
      success: 'the vision opens — secrets are revealed',
      failure: 'the place resists divine scrutiny; it remains opaque',
    },
  },
];

// ─── Hex Action Templates ──────────────────────────────────────────
//
// Divine actions targeting hex tiles directly.
// targetCategories: ['hex'] — only appears when a hex tile is focused.
// Resolution: hexActionBridge converts these into HexMutation[] (not GraphOps)
// because hexes are not graph nodes.

const HEX_ACTION_TEMPLATES: UnifiedActionTemplate[] = [
  {
    id: 'hex.sense_threads',
    name: 'Sense Threads',
    reach: 'eye',
    crudType: 'read',
    scale: 'cosmic',
    steps: [{
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: 0.0,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
    }],
    apCost: 0,
    // Base cost: 0.5 essence. Resolution priority:
    // 1. Pay from area sphere influence (highest sphere first, descending)
    // 2. If area cannot cover, pay 2× cost (1.0) from player's essence pool (highest first, descending)
    essenceCost: 0.5,
    actorAffinities: ['ascendant'],
    targetCategories: ['hex'],
    motivations: [],
    narrativeTemplates: {
      initiation: 'reaches out to feel the threads of essence woven through this land',
      success: 'the sphere energies reveal themselves — currents of power made visible to divine sight',
      failure: 'the threads remain elusive, only fragments of the weave can be sensed',
    },
  },
  {
    id: 'hex.bless_land',
    name: 'Bless the Land',
    reach: 'star',
    crudType: 'create',
    scale: 'regional',
    steps: [{
      reach: 'star',
      duration: { min: 2, max: 4 },
      difficulty: 0.30,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 3,
    actorAffinities: ['ascendant'],
    targetCategories: ['hex'],
    motivations: ['tradition_novelty', 'sacrifice_survival'],
    narrativeTemplates: {
      initiation: 'extends divine favor over this land',
      success: 'the earth drinks in the blessing — life stirs beneath the soil',
      failure: 'the land resists the divine touch; the blessing scatters',
    },
  },
  {
    id: 'hex.corrupt_land',
    name: 'Corrupt the Land',
    reach: 'veil',
    crudType: 'delete',
    scale: 'regional',
    steps: [{
      reach: 'veil',
      duration: { min: 3, max: 5 },
      difficulty: 0.40,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 4,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'entropy',
    targetCategories: ['hex'],
    motivations: ['mercy_ruthlessness', 'humility_pride'],
    narrativeTemplates: {
      initiation: 'reaches into the foundations of this land with corrupting intent',
      success: 'darkness seeps into the soil — the land begins to wither',
      failure: 'the land holds firm against the corruption',
    },
  },
  {
    id: 'hex.survey',
    name: 'Survey Territory',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    steps: [{
      reach: 'eye',
      duration: { min: 1, max: 1 },
      difficulty: 0.10,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'continue_weakened',
    }],
    apCost: 1,
    essenceCost: 0,
    actorAffinities: ['ascendant'],
    targetCategories: ['hex'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'casts divine sight across this territory',
      success: 'the land reveals its secrets — features, resources, and dwellers become clear',
      failure: 'the land is shrouded; divine sight gains only fragments',
    },
  },
  {
    id: 'hex.seed_life',
    name: 'Seed Life',
    reach: 'flesh',
    crudType: 'create',
    scale: 'regional',
    steps: [{
      reach: 'flesh',
      duration: { min: 4, max: 8 },
      difficulty: 0.50,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    essenceCost: 6,
    actorAffinities: ['ascendant'],
    sphereAffinity: 'life',
    targetCategories: ['hex'],
    targetSubtypes: [
      'desert', 'rocky_desert', 'tundra', 'badlands', 'dead_forest',
      'broken_lands', 'sand_dunes', 'moor_bog',
    ],
    motivations: ['mercy_ruthlessness', 'tradition_novelty'],
    narrativeTemplates: {
      initiation: 'pours vital essence into this barren ground',
      success: 'life takes root where none grew before — green tendrils pierce dead earth',
      failure: 'the land is too far gone; the seeds of life cannot find purchase',
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
  ...LOCATION_ACTION_TEMPLATES,
  ...ATTACHMENT_ACTION_TEMPLATES,
  ...SUBLOCATION_ACTION_TEMPLATES,
  ...HEX_ACTION_TEMPLATES,
];

/**
 * Look up a template by its ID. Returns undefined if not found.
 */
export function getUnifiedTemplateById(id: string): UnifiedActionTemplate | undefined {
  return UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);
}
