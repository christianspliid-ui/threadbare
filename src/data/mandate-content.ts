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
// 4. SIMULATION-ACHIEVABLE MANDATES (3)
// ═══════════════════════════════════════════════════════════════════

/**
 * Threads of Fate — Relationships form between mortals.
 *
 * The autonomous simulation creates relates_to edges between actors (~30% between pairs).
 * The ascendant merely observes the web of destiny weaving itself.
 *
 * Affinities: mind (connection, understanding), spirit (shared bonds, destiny)
 */
const THREADS_OF_FATE: MandateTemplate = {
  id: 'mandate.threads_of_fate',
  type: 'simulation_achievable',
  name: 'Threads of Fate',
  description: 'Relationships form between mortals. Weave the web of destiny.',
  sphereAffinities: ['mind', 'spirit'],
  stages: [
    {
      stage: 'setup',
      description: '4 relationships form.',
      conditions: [
        {
          type: 'edge_count',
          description: '4+ relates_to edges',
          params: {
            edgeType: 'relates_to',
            minCount: 4,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: '8 relationships form.',
      conditions: [
        {
          type: 'edge_count',
          description: '8+ relates_to edges',
          params: {
            edgeType: 'relates_to',
            minCount: 8,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: '12 relationships form.',
      conditions: [
        {
          type: 'edge_count',
          description: '12+ relates_to edges',
          params: {
            edgeType: 'relates_to',
            minCount: 12,
          },
        },
      ],
    },
  ],
};

/**
 * The Gathering — Factions grow in strength and numbers.
 *
 * The autonomous simulation assigns member_of edges to ~70% of actors.
 * The ascendant guides how loyalty and affiliation take root.
 *
 * Affinities: force (unity, strength), spirit (shared purpose, commitment)
 */
const THE_GATHERING: MandateTemplate = {
  id: 'mandate.the_gathering',
  type: 'simulation_achievable',
  name: 'The Gathering',
  description: 'Factions grow in strength and numbers. Loyalty draws the faithful.',
  sphereAffinities: ['force', 'spirit'],
  stages: [
    {
      stage: 'setup',
      description: '3 faction memberships.',
      conditions: [
        {
          type: 'edge_count',
          description: '3+ member_of edges',
          params: {
            edgeType: 'member_of',
            minCount: 3,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: '5 faction memberships.',
      conditions: [
        {
          type: 'edge_count',
          description: '5+ member_of edges',
          params: {
            edgeType: 'member_of',
            minCount: 5,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: '8 faction memberships.',
      conditions: [
        {
          type: 'edge_count',
          description: '8+ member_of edges',
          params: {
            edgeType: 'member_of',
            minCount: 8,
          },
        },
      ],
    },
  ],
};

/**
 * Cultural Convergence — Cultures spread and take root.
 *
 * The autonomous simulation assigns belongs_to edges to actors via culture generation.
 * The ascendant watches identity become destiny as cultures flourish.
 *
 * Affinities: life (growth, identity), mind (culture, understanding)
 */
const CULTURAL_CONVERGENCE: MandateTemplate = {
  id: 'mandate.cultural_convergence',
  type: 'simulation_achievable',
  name: 'Cultural Convergence',
  description: 'Cultures spread and take root. Identity becomes destiny.',
  sphereAffinities: ['life', 'mind'],
  stages: [
    {
      stage: 'setup',
      description: '3 cultural bonds.',
      conditions: [
        {
          type: 'edge_count',
          description: '3+ belongs_to edges',
          params: {
            edgeType: 'belongs_to',
            minCount: 3,
          },
        },
      ],
    },
    {
      stage: 'escalation',
      description: '6 cultural bonds.',
      conditions: [
        {
          type: 'edge_count',
          description: '6+ belongs_to edges',
          params: {
            edgeType: 'belongs_to',
            minCount: 6,
          },
        },
      ],
    },
    {
      stage: 'culmination',
      description: '10 cultural bonds.',
      conditions: [
        {
          type: 'edge_count',
          description: '10+ belongs_to edges',
          params: {
            edgeType: 'belongs_to',
            minCount: 10,
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
 * Complete library of 12 mandate templates:
 * - 3 graph-state mandates (control, build, ally)
 * - 3 sphere dominance mandates (life, entropy, energy)
 * - 3 narrative mandates (champion, devoted circle, shadow sovereign)
 * - 3 simulation-achievable mandates (threads of fate, gathering, cultural convergence)
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

  // Simulation-Achievable (3)
  THREADS_OF_FATE,
  THE_GATHERING,
  CULTURAL_CONVERGENCE,
];

// ═══════════════════════════════════════════════════════════════════
// MANDATE_MILESTONE_PROSE EXPORT
// ═══════════════════════════════════════════════════════════════════

/**
 * Milestone prose entries for mandate stage transitions.
 *
 * Keys follow the pattern: {mandate_id}.{transition}
 * Transitions: setup_to_escalation, escalation_to_culmination, completed, failed
 *
 * Each entry is an atmospheric prose string describing the narrative moment
 * of the mandate's progression or failure. Threadbare aesthetic—dark world,
 * literary, the feeling of divine purpose being fulfilled or failing.
 *
 * Total: 12 mandates × 4 transitions = 48 entries (exceeds 40 minimum)
 */
export const MANDATE_MILESTONE_PROSE: Record<string, string> = {
  // ─────────────────────────────────────────────────────────────
  // DOMINION OF STONE (3 transitions × 4 = 12 entries so far)
  // ─────────────────────────────────────────────────────────────
  'dominion_of_stone.setup_to_escalation':
    'Stone answers the call. Two settlements bend their walls toward your will. The architecture shifts—support beams align like prayer.',

  'dominion_of_stone.escalation_to_culmination':
    'Four cities now pulse with your dominion. Their stones hum in unison, a chorus of matter aligned to purpose. The realm is becoming blueprint.',

  'dominion_of_stone.completed':
    'Five settlements stand as monuments to your reign. The world has been remade in stone and vision. You have shaped the very bones of the earth.',

  'dominion_of_stone.failed':
    'The stones slip from your grasp. Settlements refuse your dominion. The earth remembers older gods.',

  // ─────────────────────────────────────────────────────────────
  // THE BUILDER\'S LEGACY
  // ─────────────────────────────────────────────────────────────
  'builders_legacy.setup_to_escalation':
    'Your first monuments rise. Two structures stand—temples of intention and will. Time will judge whether they last.',

  'builders_legacy.escalation_to_culmination':
    'Five edifices now span the realm, each one a claim carved into the world. Your signature is written in architecture. Future ages will name these works.',

  'builders_legacy.completed':
    'Eight monuments endure—a legacy that will outlast kingdoms. Your creations have become landscape. Mortals will build upon your foundations for generations.',

  'builders_legacy.failed':
    'Your structures crumble into dust. The materials reject your vision. Creation was not yours to command after all.',

  // ─────────────────────────────────────────────────────────────
  // WEB OF ALLEGIANCE
  // ─────────────────────────────────────────────────────────────
  'web_of_allegiance.setup_to_escalation':
    'Two factions bind themselves to your cause. The threads of alliance form—fragile but real. Politics bends toward your will.',

  'web_of_allegiance.escalation_to_culmination':
    'Four nations now move as one. Regional blocs align beneath your vision. The web of allegiance becomes a net strong enough to catch destiny.',

  'web_of_allegiance.completed':
    'Six powers stand united under your purpose. The realm is bound by oath and thread. Division has yielded to the singular vision of your ascendancy.',

  'web_of_allegiance.failed':
    'The alliances shatter like glass. Trust breaks. The nations turn from your vision and remember their own hunger.',

  // ─────────────────────────────────────────────────────────────
  // TIDE OF LIFE
  // ─────────────────────────────────────────────────────────────
  'tide_of_life.setup_to_escalation':
    'Life blooms where it withered. Two regions flourish under your touch. Growth spreads like whispered prayer through barren soil.',

  'tide_of_life.escalation_to_culmination':
    'Four territories sing with vitality. Forests deepen their green. Animals return. The world remembers fertility. Life rides your current now.',

  'tide_of_life.completed':
    'Six regions blaze with the force of growth. The Tide of Life has become a torrent. Creation itself bends to your will. Entropy retreats before you.',

  'tide_of_life.failed':
    'The life force withdraws. Regions relapse into drought and silence. Your dominion over growth was illusory. The world is larger than you.',

  // ─────────────────────────────────────────────────────────────
  // THE ENTROPIC CASCADE
  // ─────────────────────────────────────────────────────────────
  'entropic_cascade.setup_to_escalation':
    'Two regions begin to fracture. Order unravels at its seams. The old structures feel the weight of dissolution. Change is coming.',

  'entropic_cascade.escalation_to_culmination':
    'Four territories crumble and transform. The cascade of entropy spreads—old kingdoms dissolve into possibility. Renewal rises from the ashes of decay.',

  'entropic_cascade.completed':
    'Five realms have been unmade and remade in your image. The Cascade is complete. What was is no longer. Entropy has baptized the world.',

  'entropic_cascade.failed':
    'The decay halts. Remnants of the old order reassert themselves. Your dissolution was incomplete. Order reassumes its throne.',

  // ─────────────────────────────────────────────────────────────
  // ILLUMINATION
  // ─────────────────────────────────────────────────────────────
  'illumination.setup_to_escalation':
    'One region is saturated in energy. Light blazes where shadow held dominion. Power radiates outward in waves of transformation.',

  'illumination.escalation_to_culmination':
    'Two territories burn bright with divine power. Energy courses through their bones. The realm begins to remember what radiance means.',

  'illumination.completed':
    'Four regions blaze with the force of pure energy. The world is illuminated end to end. Your light has become the only truth. Darkness yields.',

  'illumination.failed':
    'The radiance dims and fails. Shadows reclaim their territory. Your light was not steady enough to rewrite the sky.',

  // ─────────────────────────────────────────────────────────────
  // THE ASCENDANT\'S CHAMPION
  // ─────────────────────────────────────────────────────────────
  'ascendants_champion.setup_to_escalation':
    'One mortal rises beyond the veil. Demigod now, they bear your mark. The world begins to see that divinity can be granted.',

  'ascendants_champion.escalation_to_culmination':
    'One ascends to true divinity while three demigodsstand as proof of your power. Your champions multiply. The age of mortals is ending.',

  'ascendants_champion.completed':
    'Aspect tier is achieved. One of your champions now sits among the eternal. They are your eternal voice in the world. Immortality given and received.',

  'ascendants_champion.failed':
    'Your chosen ones fall back to lesser stations. Elevation slips through your fingers. Perhaps mortals were never meant to touch the divine.',

  // ─────────────────────────────────────────────────────────────
  // THE DEVOTED CIRCLE
  // ─────────────────────────────────────────────────────────────
  'devoted_circle.setup_to_escalation':
    'Two servants rise to demigod status. The circle begins to form. Devotion takes shape in flesh and purpose.',

  'devoted_circle.escalation_to_culmination':
    'Three of your disciples now stand as divine beings. The circle grows. Their devotion has become a force that bends reality.',

  'devoted_circle.completed':
    'Five divine servants stand around your throne. The Devoted Circle is complete. Their collective will becomes indistinguishable from your own.',

  'devoted_circle.failed':
    'The circle fractures before it forms. Your disciples resist ascension. Perhaps devotion cannot be cultivated by decree alone.',

  // ─────────────────────────────────────────────────────────────
  // THE SHADOW SOVEREIGN
  // ─────────────────────────────────────────────────────────────
  'shadow_sovereign.setup_to_escalation':
    'One shadow agent rises to divinity. They move through darkness unseen. Your hidden reach extends into realms of silence and secret.',

  'shadow_sovereign.escalation_to_culmination':
    'Two divine servants now work in shadow. Your web of influence spreads through the hidden paths. The Sovereign begins to take shape.',

  'shadow_sovereign.completed':
    'Three Aspect-tier agents serve you from the shadows. The Shadow Sovereign reigns supreme. Your power is the darkness itself—invisible, irresistible.',

  'shadow_sovereign.failed':
    'Your shadow agents are exposed and diminished. The darkness lifts. Your hidden dominion crumbles into the light.',

  // ─────────────────────────────────────────────────────────────
  // THREADS OF FATE
  // ─────────────────────────────────────────────────────────────
  'threads_of_fate.setup_to_escalation':
    'Four mortal hearts find each other. Relationships weave themselves into being. The fabric of destiny hums with new connection.',

  'threads_of_fate.escalation_to_culmination':
    'Eight bonds now link the mortals together. The web grows dense, stronger. Fate becomes tangible—something you can almost touch.',

  'threads_of_fate.completed':
    'Twelve threads bind mortals in intricate webs of relation. The tapestry of destiny is complete. All hearts are woven together now.',

  'threads_of_fate.failed':
    'The threads unravel. Hearts turn away from one another. Fate cannot be written if mortals refuse to listen.',

  // ─────────────────────────────────────────────────────────────
  // THE GATHERING
  // ─────────────────────────────────────────────────────────────
  'the_gathering.setup_to_escalation':
    'Three mortals answer the call to faction. Loyalty takes root in soil made fertile by vision. The first followers gather.',

  'the_gathering.escalation_to_culmination':
    'Five souls now wear the colors of allegiance. The factions swell with strength. Momentum builds—soon it will be unstoppable.',

  'the_gathering.completed':
    'Eight faithful stand pledged to faction and vision. The Gathering is complete. The movement has become a force of nature.',

  'the_gathering.failed':
    'The factions remain hollow. Mortals will not commit. Unity cannot be imposed—it must be earned through meaning.',

  // ─────────────────────────────────────────────────────────────
  // CULTURAL CONVERGENCE
  // ─────────────────────────────────────────────────────────────
  'cultural_convergence.setup_to_escalation':
    'Three mortals claim identity within new cultures. Belonging takes shape—a root deeper than flesh and blood.',

  'cultural_convergence.escalation_to_culmination':
    'Six souls now carry cultural identity. Heritage spreads through bloodlines and choice alike. Convergence is inevitable now.',

  'cultural_convergence.completed':
    'Ten cultural bonds trace themselves through the realm. Identity has become destiny. The Convergence is written into being itself.',

  'cultural_convergence.failed':
    'The cultures fail to take root. Identity remains fractured and scattered. People resist the shape you were trying to impose.',
};

