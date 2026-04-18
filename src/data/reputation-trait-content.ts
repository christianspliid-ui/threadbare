/**
 * Reputation Trait Content — 17 trait definitions for the reach-polarity reputation system.
 *
 * 16 reach reputations (8 reaches × 2 polarities) + 1 power renown.
 * Each carries a ReputationEffects payload consumed by encounter pipeline, social system,
 * disposition engine, and prose enrichment.
 *
 * Polarity follows the axiological value pair for each reach:
 *   positive = virtue pole (mercy, asceticism, honesty, tradition, loyalty, revelation, preservation, sacrifice)
 *   negative = flaw pole (ruthlessness, extravagance, cunning, novelty, ambition, discretion, transformation, survival)
 *
 * Design doc: Docs/plans/2026-03-31-reputation-trait-system-design.md
 */

import type { TraitDefinitionProperties, ReputationEffects } from '../types/traits';
import type { ReachDomain } from '../types/traits';
import {
  REPUTATION_SCOPE_LOCAL,
  REPUTATION_SCOPE_REGIONAL,
  REPUTATION_SCOPE_WORLD,
} from './agent-behavior-constants';

// ─── Helper Types ──────────────────────────────────────────────────

interface ReputationTraitNode {
  id: string;
  type: 'trait';
  name: string;
  properties: TraitDefinitionProperties;
}

// ─── Scope shorthand ───────────────────────────────────────────────

const SCOPE: [number, number, number] = [
  REPUTATION_SCOPE_LOCAL,
  REPUTATION_SCOPE_REGIONAL,
  REPUTATION_SCOPE_WORLD,
];

// ─── Trait Definitions ─────────────────────────────────────────────

export const REPUTATION_TRAIT_DEFINITIONS: ReputationTraitNode[] = [
  // ═══════════════════════════════════════════════════════════════
  // IRON — mercy / ruthlessness
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.iron.positive',
    type: 'trait',
    name: 'Feared Champion',
    properties: {
      subcategory: 'reputation',
      description: 'Known for martial prowess wielded with honor — respected by warriors, feared by aggressors.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { iron: 0.10, heart: 0.05 },
      tags: ['#iron', '#reputation', '#positive', '#martial', '#honor'],
      flavorText: 'Soldiers straighten when the champion passes. Even rivals salute.',
      reputationEffects: {
        reactions: [
          { target: 'guard', effect: 'defer', magnitude: 0.4 },
          { target: 'commoner', effect: 'reverence', magnitude: 0.3 },
          { target: 'monster', effect: 'avoid', magnitude: 0.2 },
          { target: 'faction_rival', effect: 'challenge', magnitude: 0.3 },
        ],
        encounterGates: { unlocks: ['reputation.iron.warlords_tribute'], blocks: [] },
        scoringModifiers: { iron: 0.15, heart: 0.05 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.iron.negative',
    type: 'trait',
    name: 'Brutal Thug',
    properties: {
      subcategory: 'reputation',
      description: 'Known for senseless violence — feared by the weak, hunted by the just.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { iron: 0.10, heart: -0.10 },
      tags: ['#iron', '#reputation', '#negative', '#martial', '#violence'],
      flavorText: 'People scatter at the sound of heavy boots. Blood follows this one.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'flee', magnitude: 0.5 },
          { target: 'merchant', effect: 'flee', magnitude: 0.3 },
          { target: 'guard', effect: 'hostility', magnitude: 0.4 },
          { target: 'criminal', effect: 'approach', magnitude: 0.3 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { iron: 0.15, heart: -0.20 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // GOLD — asceticism / extravagance
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.gold.positive',
    type: 'trait',
    name: 'Generous Patron',
    properties: {
      subcategory: 'reputation',
      description: 'Known for shared prosperity — trusted by merchants, sought by the needy.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { gold: 0.10, heart: 0.05 },
      tags: ['#gold', '#reputation', '#positive', '#economic', '#generosity'],
      flavorText: 'Where the patron trades, markets thrive. Coin follows goodwill.',
      reputationEffects: {
        reactions: [
          { target: 'merchant', effect: 'discount', magnitude: 0.3 },
          { target: 'commoner', effect: 'approach', magnitude: 0.4 },
          { target: 'faction_ally', effect: 'recruit', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { gold: 0.15, heart: 0.05 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.gold.negative',
    type: 'trait',
    name: 'Ruthless Profiteer',
    properties: {
      subcategory: 'reputation',
      description: 'Known for exploitation and greed — feared by debtors, courted by the desperate.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { gold: 0.15, heart: -0.10 },
      tags: ['#gold', '#reputation', '#negative', '#economic', '#exploitation'],
      flavorText: 'Every deal leaves one party poorer. The profiteer never blinks.',
      reputationEffects: {
        reactions: [
          { target: 'merchant', effect: 'price_gouge', magnitude: 0.3 },
          { target: 'commoner', effect: 'avoid', magnitude: 0.3 },
          { target: 'criminal', effect: 'approach', magnitude: 0.2 },
          { target: 'faction_rival', effect: 'hostility', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { gold: 0.15, heart: -0.15 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SHADOW — honesty / cunning
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.shadow.positive',
    type: 'trait',
    name: 'Enigmatic',
    properties: {
      subcategory: 'reputation',
      description: 'Known for useful discretion — alluring mystery that draws the curious and repels the careless.',
      importance: 0.6,
      maxLevel: 3,
      visibility: 'discoverable',
      domainContributions: { shadow: 0.10, eye: 0.05 },
      tags: ['#shadow', '#reputation', '#positive', '#stealth', '#discretion'],
      flavorText: 'Nobody knows their real name. Everybody wants to.',
      reputationEffects: {
        reactions: [
          { target: 'scholar', effect: 'approach', magnitude: 0.3 },
          { target: 'commoner', effect: 'avoid', magnitude: 0.2 },
          { target: 'faction_ally', effect: 'recruit', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { shadow: 0.10, eye: 0.10 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.shadow.negative',
    type: 'trait',
    name: 'Infamous',
    properties: {
      subcategory: 'reputation',
      description: 'Known for criminal cunning — the underworld opens its doors, the lawful close theirs.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { shadow: 0.10, heart: -0.10 },
      tags: ['#shadow', '#reputation', '#negative', '#stealth', '#criminal'],
      flavorText: 'Wanted posters multiply. Fences open their back doors.',
      reputationEffects: {
        reactions: [
          { target: 'guard', effect: 'hostility', magnitude: 0.4 },
          { target: 'criminal', effect: 'approach', magnitude: 0.4 },
          { target: 'merchant', effect: 'avoid', magnitude: 0.3 },
          { target: 'commoner', effect: 'flee', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: ['reputation.shadow.shadow_court_audience'] },
        scoringModifiers: { shadow: 0.15, heart: -0.15 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // VEIL — tradition / novelty
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.veil.positive',
    type: 'trait',
    name: 'Arcane Sage',
    properties: {
      subcategory: 'reputation',
      description: 'Known for protective and illuminating magic — sought by scholars, trusted by the fearful.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { veil: 0.10, eye: 0.05 },
      tags: ['#veil', '#reputation', '#positive', '#magic', '#wisdom'],
      flavorText: 'The sage\'s tower glows softly at night. People feel safer for it.',
      reputationEffects: {
        reactions: [
          { target: 'scholar', effect: 'approach', magnitude: 0.4 },
          { target: 'commoner', effect: 'reverence', magnitude: 0.2 },
          { target: 'priest', effect: 'approach', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: ['reputation.veil.the_veiled_consultation'], blocks: [] },
        scoringModifiers: { veil: 0.15, eye: 0.05 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.veil.negative',
    type: 'trait',
    name: 'Dangerous Sorcerer',
    properties: {
      subcategory: 'reputation',
      description: 'Known for reckless or frightening magic — power that warps and terrifies.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { veil: 0.15, heart: -0.10 },
      tags: ['#veil', '#reputation', '#negative', '#magic', '#danger'],
      flavorText: 'The air crackles. Animals bolt. Even the wind seems afraid.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'flee', magnitude: 0.4 },
          { target: 'guard', effect: 'avoid', magnitude: 0.3 },
          { target: 'scholar', effect: 'approach', magnitude: 0.2 },
          { target: 'monster', effect: 'avoid', magnitude: 0.3 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { veil: 0.15, heart: -0.15 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // HEART — loyalty / ambition
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.heart.positive',
    type: 'trait',
    name: 'Beloved',
    properties: {
      subcategory: 'reputation',
      description: 'Known for genuine warmth — people flock to them, factions recruit them, strangers trust them.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { heart: 0.15 },
      tags: ['#heart', '#reputation', '#positive', '#social', '#warmth'],
      flavorText: 'Children run to greet them. Even cynics soften.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'approach', magnitude: 0.5 },
          { target: 'merchant', effect: 'discount', magnitude: 0.2 },
          { target: 'faction_ally', effect: 'recruit', magnitude: 0.3 },
          { target: 'faction_rival', effect: 'approach', magnitude: 0.1 },
        ],
        encounterGates: { unlocks: ['reputation.heart.pilgrims_offering'], blocks: [] },
        scoringModifiers: { heart: 0.20 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.heart.negative',
    type: 'trait',
    name: 'Manipulator',
    properties: {
      subcategory: 'reputation',
      description: 'Known for emotional exploitation — charming on the surface, hollow underneath.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'discoverable',
      domainContributions: { heart: 0.05, shadow: 0.05 },
      tags: ['#heart', '#reputation', '#negative', '#social', '#manipulation'],
      flavorText: 'Their smile never reaches their eyes. Former allies warn newcomers.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'avoid', magnitude: 0.3 },
          { target: 'faction_rival', effect: 'hostility', magnitude: 0.4 },
          { target: 'criminal', effect: 'approach', magnitude: 0.2 },
          { target: 'guard', effect: 'avoid', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: ['reputation.heart.pilgrims_offering'] },
        scoringModifiers: { heart: -0.10, shadow: 0.10 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // EYE — revelation / discretion
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.eye.positive',
    type: 'trait',
    name: 'Oracle',
    properties: {
      subcategory: 'reputation',
      description: 'Known for illuminating knowledge — sought as advisor, trusted with secrets.',
      importance: 0.6,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { eye: 0.15 },
      tags: ['#eye', '#reputation', '#positive', '#knowledge', '#wisdom'],
      flavorText: 'Their counsel is worth more than gold. They see what others miss.',
      reputationEffects: {
        reactions: [
          { target: 'scholar', effect: 'approach', magnitude: 0.4 },
          { target: 'faction_ally', effect: 'recruit', magnitude: 0.3 },
          { target: 'commoner', effect: 'reverence', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: ['reputation.veil.the_veiled_consultation'], blocks: [] },
        scoringModifiers: { eye: 0.15 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.eye.negative',
    type: 'trait',
    name: 'Spy',
    properties: {
      subcategory: 'reputation',
      description: 'Known for invasive knowledge — knows things they shouldn\'t, never trusted with confidence.',
      importance: 0.6,
      maxLevel: 3,
      visibility: 'discoverable',
      domainContributions: { eye: 0.10, shadow: 0.05 },
      tags: ['#eye', '#reputation', '#negative', '#knowledge', '#espionage'],
      flavorText: 'Conversations stop when they enter. Doors close. Curtains draw.',
      reputationEffects: {
        reactions: [
          { target: 'faction_rival', effect: 'hostility', magnitude: 0.4 },
          { target: 'commoner', effect: 'avoid', magnitude: 0.3 },
          { target: 'criminal', effect: 'approach', magnitude: 0.3 },
          { target: 'guard', effect: 'avoid', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { eye: 0.10, shadow: 0.10 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // STONE — preservation / transformation
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.stone.positive',
    type: 'trait',
    name: 'Steadfast Builder',
    properties: {
      subcategory: 'reputation',
      description: 'Known for reliability and community building — trusted foundation of any settlement.',
      importance: 0.6,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { stone: 0.15, heart: 0.05 },
      tags: ['#stone', '#reputation', '#positive', '#infrastructure', '#trust'],
      flavorText: 'What they build endures. Foundations laid by their hand do not crack.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'approach', magnitude: 0.3 },
          { target: 'merchant', effect: 'discount', magnitude: 0.2 },
          { target: 'faction_ally', effect: 'recruit', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: ['reputation.stone.the_stones_judgement'], blocks: [] },
        scoringModifiers: { stone: 0.15, heart: 0.05 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.stone.negative',
    type: 'trait',
    name: 'Immovable Tyrant',
    properties: {
      subcategory: 'reputation',
      description: 'Known for crushing change and enforcing rigid order — stability at the cost of freedom.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { stone: 0.10, heart: -0.10 },
      tags: ['#stone', '#reputation', '#negative', '#infrastructure', '#tyranny'],
      flavorText: 'Nothing changes under their rule. Nothing is allowed to.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'flee', magnitude: 0.3 },
          { target: 'guard', effect: 'defer', magnitude: 0.3 },
          { target: 'faction_rival', effect: 'hostility', magnitude: 0.4 },
          { target: 'criminal', effect: 'avoid', magnitude: 0.3 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { stone: 0.15, heart: -0.15 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // STAR — sacrifice / survival
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.star.positive',
    type: 'trait',
    name: 'Blessed',
    properties: {
      subcategory: 'reputation',
      description: 'Known for divine favor and selfless devotion — inspires faith, draws pilgrims.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { star: 0.15, heart: 0.05 },
      tags: ['#star', '#reputation', '#positive', '#divine', '#devotion'],
      flavorText: 'Light seems to follow them. The faithful kneel unbidden.',
      reputationEffects: {
        reactions: [
          { target: 'priest', effect: 'reverence', magnitude: 0.4 },
          { target: 'commoner', effect: 'reverence', magnitude: 0.3 },
          { target: 'monster', effect: 'avoid', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { star: 0.15, heart: 0.05 },
        scopeByLevel: SCOPE,
      },
    },
  },
  {
    id: 'trait.reputation.star.negative',
    type: 'trait',
    name: 'Zealot',
    properties: {
      subcategory: 'reputation',
      description: 'Known for dangerous conviction — fervent belief that brooks no dissent.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { star: 0.10, heart: -0.10 },
      tags: ['#star', '#reputation', '#negative', '#divine', '#fanaticism'],
      flavorText: 'Their prayers sound like threats. Even the gods might flinch.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'flee', magnitude: 0.3 },
          { target: 'priest', effect: 'hostility', magnitude: 0.3 },
          { target: 'faction_rival', effect: 'hostility', magnitude: 0.4 },
          { target: 'guard', effect: 'avoid', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: { star: 0.15, heart: -0.15 },
        scopeByLevel: SCOPE,
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // POWER RENOWN — derived from max capability tier
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'trait.reputation.power.renown',
    type: 'trait',
    name: 'Renowned',
    properties: {
      subcategory: 'reputation',
      description: 'Known for sheer capability — raw power commands attention regardless of how it is used.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: {},
      tags: ['#power', '#reputation', '#renown'],
      flavorText: 'When they speak, the room listens. Not from love or fear — from gravity.',
      reputationEffects: {
        reactions: [
          { target: 'commoner', effect: 'defer', magnitude: 0.3 },
          { target: 'guard', effect: 'defer', magnitude: 0.2 },
          { target: 'faction_ally', effect: 'recruit', magnitude: 0.3 },
          { target: 'monster', effect: 'avoid', magnitude: 0.2 },
        ],
        encounterGates: { unlocks: [], blocks: [] },
        scoringModifiers: {},
        scopeByLevel: SCOPE,
      },
    },
  },
];

// ─── Lookup Helpers ────────────────────────────────────────────────

/** Map of trait ID → definition for fast lookup */
export const REPUTATION_TRAIT_MAP: ReadonlyMap<string, ReputationTraitNode> = new Map(
  REPUTATION_TRAIT_DEFINITIONS.map(t => [t.id, t]),
);

/** Get the reputation trait ID for a given reach and polarity */
export function getReputationTraitId(reach: ReachDomain, polarity: 'positive' | 'negative'): string {
  return `trait.reputation.${reach}.${polarity}`;
}

/** All 16 reach-polarity trait IDs (excludes power renown) */
export const REACH_REPUTATION_TRAIT_IDS: readonly string[] = REPUTATION_TRAIT_DEFINITIONS
  .filter(t => t.id !== 'trait.reputation.power.renown')
  .map(t => t.id);
