// Initiative template definitions (THR-51).
// direction: 'left' = first word in axis name (positive values, e.g. loyalty, honesty, sacrifice)
// direction: 'right' = second word in axis name (negative values, e.g. ambition, cunning, survival)

import type { InitiativeTemplate } from '../types/initiative';

export const INITIATIVE_TEMPLATES: readonly InitiativeTemplate[] = [
  {
    id: 'initiative.found-organization',
    name: 'Found Organization',
    category: 'founding',
    description: 'Invest savings and charisma to establish a formal guild, order, or company at the location.',
    minWealth: 25,
    wealthCost: 20,
    requiredReaches: { heart: 2, gold: 1 },
    requiredAxiologicalBias: {
      axis: 'loyalty_ambition',
      direction: 'right',
      minStrength: 0.3,
    },
    locationFilter: {
      requiredSubtype: 'town',
      minPopulation: 4,
    },
    baseDuration: 10,
    durationVariance: 2,
    checkInterval: 3,
    failureConditions: [
      { type: 'wealth_below', threshold: 5 },
      { type: 'agent_leaves_location' },
      { type: 'agent_dies' },
    ],
    outcomes: [
      { type: 'create_faction' },
      { type: 'create_sublocation', sublocationTypeId: 'sublocation-type.guild-hall' },
    ],
    motivations: [
      { axis: 'loyalty_ambition', direction: 'right', weight: 0.8 },
      { axis: 'asceticism_extravagance', direction: 'right', weight: 0.3 },
    ],
  },

  {
    id: 'initiative.recruit-party',
    name: 'Recruit Party',
    category: 'social',
    description: 'Forge bonds of mutual trust with nearby agents, forming a loyal group of companions.',
    minWealth: 5,
    wealthCost: 3,
    requiredReaches: { heart: 1 },
    requiredAxiologicalBias: {
      axis: 'loyalty_ambition',
      direction: 'left',
      minStrength: 0.2,
    },
    locationFilter: {
      minPopulation: 3,
    },
    baseDuration: 6,
    durationVariance: 2,
    checkInterval: 2,
    failureConditions: [
      { type: 'agent_dies' },
    ],
    outcomes: [
      { type: 'create_bonds', bondBasis: 'sworn_ally', count: 3, radius: 1 },
    ],
    motivations: [
      { axis: 'loyalty_ambition', direction: 'left', weight: 0.7 },
      { axis: 'courage_prudence', direction: 'left', weight: 0.3 },
    ],
  },

  {
    id: 'initiative.organize-festival',
    name: 'Organize Festival',
    category: 'social',
    description: 'Throw a grand celebration that fills the settlement with social energy and goodwill for several days.',
    minWealth: 12,
    wealthCost: 10,
    requiredReaches: { heart: 2 },
    requiredAxiologicalBias: {
      axis: 'asceticism_extravagance',
      direction: 'right',
      minStrength: 0.2,
    },
    locationFilter: {
      minPopulation: 3,
    },
    baseDuration: 5,
    durationVariance: 1,
    checkInterval: 2,
    failureConditions: [
      { type: 'wealth_below', threshold: 3 },
      { type: 'agent_leaves_location' },
    ],
    outcomes: [
      { type: 'temporary_location_boost', property: 'festivalBoost', value: 0.5, duration: 10 },
    ],
    motivations: [
      { axis: 'asceticism_extravagance', direction: 'right', weight: 0.7 },
      { axis: 'loyalty_ambition', direction: 'left', weight: 0.3 },
    ],
  },

  {
    id: 'initiative.consecrate-holy-site',
    name: 'Consecrate Holy Site',
    category: 'religious',
    description: 'Transform a place of power through prolonged ritual, creating a sphere-aligned shrine sublocation.',
    minWealth: 15,
    wealthCost: 12,
    requiredReaches: { star: 2, veil: 1 },
    requiredAxiologicalBias: {
      axis: 'sacrifice_survival',
      direction: 'left',
      minStrength: 0.3,
    },
    baseDuration: 8,
    durationVariance: 2,
    checkInterval: 3,
    failureConditions: [
      { type: 'agent_leaves_location' },
      { type: 'agent_dies' },
      { type: 'location_destroyed' },
    ],
    outcomes: [
      { type: 'create_sublocation', sublocationTypeId: 'sublocation-type.shrine' },
    ],
    motivations: [
      { axis: 'sacrifice_survival', direction: 'left', weight: 0.8 },
      { axis: 'tradition_novelty', direction: 'left', weight: 0.4 },
    ],
    sphereAffinity: 'star',
  },

  {
    id: 'initiative.commission-quest',
    name: 'Commission Quest',
    category: 'quest',
    description: 'Post a standing offer of reward, seeding a quest encounter that any nearby agent can attempt.',
    minWealth: 10,
    wealthCost: 8,
    requiredReaches: { gold: 1 },
    requiredAxiologicalBias: {
      axis: 'loyalty_ambition',
      direction: 'right',
      minStrength: 0.15,
    },
    baseDuration: 4,
    durationVariance: 1,
    checkInterval: 2,
    failureConditions: [
      { type: 'wealth_below', threshold: 2 },
      { type: 'agent_dies' },
    ],
    outcomes: [
      { type: 'spawn_encounter', templateId: 'commissioned-quest.generic' },
    ],
    motivations: [
      { axis: 'loyalty_ambition', direction: 'right', weight: 0.6 },
      { axis: 'asceticism_extravagance', direction: 'right', weight: 0.4 },
    ],
  },

  {
    id: 'initiative.establish-spy-network',
    name: 'Establish Spy Network',
    category: 'espionage',
    description: 'Bribe informants and plant eyes throughout a city, creating an ongoing intelligence-gathering operation.',
    minWealth: 20,
    wealthCost: 18,
    requiredReaches: { shadow: 3, eye: 2 },
    requiredAxiologicalBias: {
      axis: 'honesty_cunning',
      direction: 'right',
      minStrength: 0.4,
    },
    locationFilter: {
      requiredSubtype: 'city',
    },
    baseDuration: 10,
    durationVariance: 2,
    checkInterval: 3,
    failureConditions: [
      { type: 'wealth_below', threshold: 5 },
      { type: 'agent_leaves_location' },
      { type: 'agent_dies' },
      { type: 'disrupted_by_encounter', encounterTypes: ['investigation', 'interrogation'] },
    ],
    outcomes: [
      { type: 'create_edge', edgeType: 'relates_to', edgeBasis: 'espionage', targetFilter: 'current_location' },
      { type: 'record_intelligence', intelligenceType: 'spy_network_established' },
    ],
    motivations: [
      { axis: 'honesty_cunning', direction: 'right', weight: 0.8 },
      { axis: 'revelation_discretion', direction: 'right', weight: 0.4 },
    ],
    sphereAffinity: 'shadow',
  },
];

export const INITIATIVE_TEMPLATE_MAP = new Map<string, InitiativeTemplate>(
  INITIATIVE_TEMPLATES.map(t => [t.id, t])
);
