/**
 * Mandate Content Package — All data-driven content for the divine mandate system.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change mandate templates,
 * conditions, and sphere affinities for the player's ascendant victory paths.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. MandateTemplate interface — extends MandateDefinition with sphere affinities
 * 2. Graph-State Mandates (3) — Dominion of Stone, Builder's Legacy, Web of Allegiance
 * 3. Sphere Dominance Mandates (3) — Tide of Life, Entropic Cascade, Illumination
 * 4. Narrative Mandates (3) — Ascendant's Champion, Devoted Circle, Shadow Sovereign
 * 5. MANDATE_TEMPLATES export
 *
 * All conditions use mechanically verifiable types: node_count, edge_count, sphere_weight, actor_tier.
 * No 'custom' type conditions permitted.
 */

import type { SphereName } from '../types/index';
import type { MandateDefinition } from '../types/mandate';

// ═══════════════════════════════════════════════════════════════════
// MandateTemplate Interface
// ═══════════════════════════════════════════════════════════════════

/**
 * Extended mandate definition that includes sphere affinities.
 * Sphere affinities indicate which spheres the mandate thematically aligns with,
 * and may influence reward generation or narrative resonance.
 */
export interface MandateTemplate extends MandateDefinition {
  sphereAffinities: SphereName[];
}

// ═══════════════════════════════════════════════════════════════════
// 1. GRAPH-STATE MANDATES (3)
// ═══════════════════════════════════════════════════════════════════

/**
 * Dominion of Stone — Control settlements across the realm.
 *
 * The ascendant must seize control of key settlements, demonstrating
 * dominion over the material world through architecture and infrastructure.
 *
 * Affinities: matter (earth, stone, physical form), force (power, domination)
 */
const DOMINION_OF_STONE: MandateTemplate = {
  id: 'mandate.dominion_of_stone',
  type: 'graph_state',
  name: 'Dominion of Stone',
  description: 'Control settlements across the realm. Establish architectural supremacy.',
  sphereAffinities: ['matter', 'force'],
  stages: [
    {
      stage: 'setup',
      description: 'Seize control of 2 settlements.',
      conditions: [
        {
          type: 'node_count',
          description: 'Control at least 2 settlements (settlement nodes with 2+ controls edges)',
          params: {
            nodeType: 'settlement',
            edgeType: 'controls',
            edgeTarget: 'player',
            minCount: 2,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Control 4 settlements, expanding architectural influence.',
      conditions: [
        {
          type: 'node_count',
          description: 'Control at least 4 settlements',
          params: {
            nodeType: 'settlement',
            edgeType: 'controls',
            edgeTarget: 'player',
            minCount: 4,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Achieve absolute dominion: control 5 settlements and reshape the political map.',
      conditions: [
        {
          type: 'node_count',
          description: 'Control at least 5 settlements',
          params: {
            nodeType: 'settlement',
            edgeType: 'controls',
            edgeTarget: 'player',
            minCount: 5,
          },
        },
      ],
    },
  ],
};

/**
 * The Builder's Legacy — Construct monuments and infrastructure.
 *
 * The ascendant leaves behind a legacy of creation—temples, roads, and structures
 * that endure across ages.
 *
 * Affinities: matter (physical creation), energy (the force of transformation)
 */
const THE_BUILDERS_LEGACY: MandateTemplate = {
  id: 'mandate.builders_legacy',
  type: 'graph_state',
  name: "The Builder's Legacy",
  description: 'Create lasting structures. Leave monuments to your divine engineering.',
  sphereAffinities: ['matter', 'energy'],
  stages: [
    {
      stage: 'setup',
      description: 'Construct 2 structures or buildings.',
      conditions: [
        {
          type: 'edge_count',
          description: 'Create at least 2 structures (constructed_by edges)',
          params: {
            edgeType: 'constructed_by',
            minCount: 2,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Construct 5 structures, establishing a network of divine presence.',
      conditions: [
        {
          type: 'edge_count',
          description: 'Create at least 5 structures',
          params: {
            edgeType: 'constructed_by',
            minCount: 5,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Complete 8 structures, cementing your legacy across generations.',
      conditions: [
        {
          type: 'edge_count',
          description: 'Create at least 8 structures',
          params: {
            edgeType: 'constructed_by',
            minCount: 8,
          },
        },
      ],
    },
  ],
};

/**
 * Web of Allegiance — Form deep alliances across factions.
 *
 * The ascendant weaves bonds of loyalty and mutual interest, creating
 * a network of allies united by shared vision.
 *
 * Affinities: mind (strategy, diplomacy), spirit (shared purpose, commitment)
 */
const WEB_OF_ALLEGIANCE: MandateTemplate = {
  id: 'mandate.web_of_allegiance',
  type: 'graph_state',
  name: 'Web of Allegiance',
  description: 'Form deep alliances. Unite factions under a shared vision.',
  sphereAffinities: ['mind', 'spirit'],
  stages: [
    {
      stage: 'setup',
      description: 'Establish 2 formal alliances.',
      conditions: [
        {
          type: 'edge_count',
          description: 'Form at least 2 alliances (allied_with edges)',
          params: {
            edgeType: 'allied_with',
            minCount: 2,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Establish 4 alliances, creating regional blocs.',
      conditions: [
        {
          type: 'edge_count',
          description: 'Form at least 4 alliances',
          params: {
            edgeType: 'allied_with',
            minCount: 4,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Achieve 6 alliances, uniting the realm in collective purpose.',
      conditions: [
        {
          type: 'edge_count',
          description: 'Form at least 6 alliances',
          params: {
            edgeType: 'allied_with',
            minCount: 6,
          },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 2. SPHERE DOMINANCE MANDATES (3)
// ═══════════════════════════════════════════════════════════════════

/**
 * Tide of Life — Life influence spreads and strengthens across regions.
 *
 * The ascendant channels life energy, causing growth and vitality to flourish
 * in multiple corners of the realm.
 *
 * Target Sphere: life
 * Affinities: life (growth, vitality, renewal)
 */
const TIDE_OF_LIFE: MandateTemplate = {
  id: 'mandate.tide_of_life',
  type: 'sphere_dominance',
  name: 'Tide of Life',
  description: 'Life influence spreads across the realm. Nurture growth and vitality.',
  targetSphere: 'life',
  sphereAffinities: ['life'],
  stages: [
    {
      stage: 'setup',
      description: 'Life reaches 30% influence in at least 2 regions.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Life sphere influence at 0.3+ in 2+ regions',
          params: {
            sphere: 'life',
            minWeight: 0.3,
            minRegions: 2,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Life reaches 40% influence in at least 4 regions.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Life sphere influence at 0.4+ in 4+ regions',
          params: {
            sphere: 'life',
            minWeight: 0.4,
            minRegions: 4,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Life reaches 50% influence in at least 6 regions. Vitality dominates.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Life sphere influence at 0.5+ in 6+ regions',
          params: {
            sphere: 'life',
            minWeight: 0.5,
            minRegions: 6,
          },
        },
      ],
    },
  ],
};

/**
 * The Entropic Cascade — Entropy spreads, breaking down old order.
 *
 * The ascendant embraces dissolution and transformation, letting entropy
 * dissolve outdated structures and make room for renewal.
 *
 * Target Sphere: entropy
 * Affinities: entropy (decay, transformation, change)
 */
const THE_ENTROPIC_CASCADE: MandateTemplate = {
  id: 'mandate.entropic_cascade',
  type: 'sphere_dominance',
  name: 'The Entropic Cascade',
  description: 'Entropy dominates. Dissolve the old and remake the world.',
  targetSphere: 'entropy',
  sphereAffinities: ['entropy'],
  stages: [
    {
      stage: 'setup',
      description: 'Entropy reaches 30% influence in at least 2 regions.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Entropy sphere influence at 0.3+ in 2+ regions',
          params: {
            sphere: 'entropy',
            minWeight: 0.3,
            minRegions: 2,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Entropy reaches 40% influence in at least 4 regions.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Entropy sphere influence at 0.4+ in 4+ regions',
          params: {
            sphere: 'entropy',
            minWeight: 0.4,
            minRegions: 4,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Entropy reaches 50% influence in at least 5 regions. Dissolution is complete.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Entropy sphere influence at 0.5+ in 5+ regions',
          params: {
            sphere: 'entropy',
            minWeight: 0.5,
            minRegions: 5,
          },
        },
      ],
    },
  ],
};

/**
 * Illumination — Energy saturates the world, blazing with power.
 *
 * The ascendant channels raw energy, illuminating the realm with divine
 * power and transformation.
 *
 * Target Sphere: energy
 * Affinities: energy (transformation, power, radiance)
 */
const ILLUMINATION: MandateTemplate = {
  id: 'mandate.illumination',
  type: 'sphere_dominance',
  name: 'Illumination',
  description: 'Energy saturates the realm. Blaze with divine power.',
  targetSphere: 'energy',
  sphereAffinities: ['energy'],
  stages: [
    {
      stage: 'setup',
      description: 'Energy reaches 50% influence in at least 1 region.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Energy sphere influence at 0.5+ in 1+ region',
          params: {
            sphere: 'energy',
            minWeight: 0.5,
            minRegions: 1,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Energy reaches 60% influence in at least 2 regions.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Energy sphere influence at 0.6+ in 2+ regions',
          params: {
            sphere: 'energy',
            minWeight: 0.6,
            minRegions: 2,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Energy reaches 70% influence in at least 4 regions. The realm burns bright.',
      conditions: [
        {
          type: 'sphere_weight',
          description: 'Energy sphere influence at 0.7+ in 4+ regions',
          params: {
            sphere: 'energy',
            minWeight: 0.7,
            minRegions: 4,
          },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 3. NARRATIVE MANDATES (3)
// ═══════════════════════════════════════════════════════════════════

/**
 * The Ascendant's Champion — Raise an agent to Aspect tier.
 *
 * The ascendant identifies and elevates a champion to divine status,
 * creating a permanent agent of their will.
 *
 * Affinities: spirit (elevation, transcendence), mind (wisdom, selection)
 */
const THE_ASCENDANTS_CHAMPION: MandateTemplate = {
  id: 'mandate.ascendants_champion',
  type: 'narrative',
  name: "The Ascendant's Champion",
  description: 'Raise an agent to Aspect tier. Elevate a mortal to divine status.',
  sphereAffinities: ['spirit', 'mind'],
  stages: [
    {
      stage: 'setup',
      description: 'Elevate 1 agent to Demigod tier (tier 2).',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 1 worshipper at tier 2 (Demigod) or higher',
          params: {
            minTier: 2,
            minCount: 1,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Elevate 1 agent to Divine tier (tier 3) AND have 3 agents at Demigod tier.',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 1 worshipper at tier 3 (Divine) or higher',
          params: {
            minTier: 3,
            minCount: 1,
          },
        },
        {
          type: 'actor_tier',
          description: 'At least 3 worshippers at tier 2 (Demigod) or higher',
          params: {
            minTier: 2,
            minCount: 3,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Elevate 1 agent to Aspect tier (tier 4), cementing their immortality.',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 1 worshipper at tier 4 (Aspect)',
          params: {
            minTier: 4,
            minCount: 1,
          },
        },
      ],
    },
  ],
};

/**
 * The Devoted Circle — Build a circle of 5 highly devoted agents.
 *
 * The ascendant cultivates a devoted circle of high-tier followers,
 * spreading their influence through a network of faithful servants.
 *
 * Affinities: ALL 8 spheres (universal devotion encompasses all cosmic forces)
 */
const THE_DEVOTED_CIRCLE: MandateTemplate = {
  id: 'mandate.devoted_circle',
  type: 'narrative',
  name: 'The Devoted Circle',
  description: 'Build a circle of 5 devoted agents. Establish universal devotion.',
  sphereAffinities: ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'],
  stages: [
    {
      stage: 'setup',
      description: 'Elevate 2 agents to Demigod tier (tier 2).',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 2 worshippers at tier 2 (Demigod) or higher',
          params: {
            minTier: 2,
            minCount: 2,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Elevate 3 agents to Divine tier (tier 3).',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 3 worshippers at tier 3 (Divine) or higher',
          params: {
            minTier: 3,
            minCount: 3,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Elevate 5 agents to Divine tier (tier 3). Your circle is complete.',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 5 worshippers at tier 3 (Divine) or higher',
          params: {
            minTier: 3,
            minCount: 5,
          },
        },
      ],
    },
  ],
};

/**
 * The Shadow Sovereign — Cultivate high-tier agents in stealth and shadow.
 *
 * The ascendant works through shadow, elevating agents who operate
 * in darkness and secrecy.
 *
 * Affinities: time (hidden histories, secret timelines), entropy (dissolution, the hidden dark)
 */
const THE_SHADOW_SOVEREIGN: MandateTemplate = {
  id: 'mandate.shadow_sovereign',
  type: 'narrative',
  name: 'The Shadow Sovereign',
  description: 'Cultivate high-tier agents in shadow. Rule through hidden power.',
  sphereAffinities: ['time', 'entropy'],
  stages: [
    {
      stage: 'setup',
      description: 'Elevate 1 agent to Divine tier (tier 3).',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 1 worshipper at tier 3 (Divine) or higher',
          params: {
            minTier: 3,
            minCount: 1,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: 'Elevate 2 agents to Divine tier (tier 3).',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 2 worshippers at tier 3 (Divine) or higher',
          params: {
            minTier: 3,
            minCount: 2,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: 'Elevate 3 agents to Aspect tier (tier 4). Absolute shadowy dominion.',
      conditions: [
        {
          type: 'actor_tier',
          description: 'At least 3 worshippers at tier 4 (Aspect) or higher',
          params: {
            minTier: 4,
            minCount: 3,
          },
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// MANDATE_TEMPLATES EXPORT
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete library of 9 mandate templates:
 * - 3 graph-state mandates (control, build, ally)
 * - 3 sphere dominance mandates (life, entropy, energy)
 * - 3 narrative mandates (champion, devoted circle, shadow sovereign)
 *
 * Each template is fully specified with conditions, descriptions, and sphere affinities.
 * Conditions use only mechanically verifiable types: node_count, edge_count, sphere_weight, actor_tier.
 */
export const MANDATE_TEMPLATES: MandateTemplate[] = [
  // Graph-State (3)
  DOMINION_OF_STONE,
  THE_BUILDERS_LEGACY,
  WEB_OF_ALLEGIANCE,

  // Sphere Dominance (3)
  TIDE_OF_LIFE,
  THE_ENTROPIC_CASCADE,
  ILLUMINATION,

  // Narrative (3)
  THE_ASCENDANTS_CHAMPION,
  THE_DEVOTED_CIRCLE,
  THE_SHADOW_SOVEREIGN,
];
