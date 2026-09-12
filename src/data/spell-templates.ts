/**
 * Spell Templates — initial spell content composed from effect primitives.
 *
 * These 5 spells are the worked examples from the design doc.
 * Each demonstrates different combinations of effects, costs, and backlash.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { SpellTemplate } from '../types/effects';

export const SPELL_TEMPLATES: SpellTemplate[] = [
  // ─── T2: Veilwalk ───────────────────────────────────────────────
  {
    id: 'spell_veilwalk',
    name: 'Veilwalk',
    tier: 2,
    tags: ['#veil', '#arcane'],
    sphereAffinity: 'spirit',
    flavorText: 'The caster slips between the folds of reality, emerging elsewhere.',
    mechanicalSummary: 'Teleport 3 hexes + brief shadow bonus. Costs veil drain. Backlash: random displacement.',
    censusTag: { scale: 'local' },
    prerequisites: { minReach: { veil: 0.20 } },
    effects: [
      { type: 'teleport', target: 'self', range: 3 },
      { type: 'duration', ticks: 3, reach: 'shadow', value: 0.05, destroyOnExpiry: true },
    ],
    cost: { type: 'reach_drain', reach: 'veil', amount: 0.03 },
    cooldownTicks: 30,
    backlash: {
      trigger: 'failure',
      probability: 0.5,
      severity: 'minor',
      effect: { type: 'forced_move', target: 'other_agent', direction: 'random', hexes: 1 },
      narrativeTemplate: 'The veil tears — {actor} stumbles through to the wrong place.',
    },
    targeting: { type: 'self' },
  },

  // ─── T3: Soulfire ───────────────────────────────────────────────
  {
    id: 'spell_soulfire',
    name: 'Soulfire',
    tier: 3,
    tags: ['#combat', '#star'],
    sphereAffinity: 'energy',
    flavorText: 'Cosmic fire courses through the caster, turning martial skill into stellar wrath.',
    mechanicalSummary: 'Swap iron→star for combat + stacking star bonus. Costs doom + heart drain. Backlash: star decay.',
    censusTag: { scale: 'personal' },
    prerequisites: { minReach: { star: 0.30, iron: 0.15 } },
    effects: [
      { type: 'modify_rules', scope: { scope: 'self' }, rule: 'encounter_reach_override', value: { from: 'iron', to: 'star' }, ticks: 8 },
      { type: 'stacking', reach: 'star', valuePerStack: 0.03, maxStacks: 4, stackOn: 'combat_success' },
    ],
    cost: { type: 'multi', costs: [
      { type: 'doom_increase', amount: 5 },
      { type: 'reach_drain', reach: 'heart', amount: 0.04 },
    ]},
    cooldownTicks: 40,
    backlash: {
      trigger: 'critical_failure',
      probability: 0.8,
      severity: 'major',
      effect: { type: 'decay', reach: 'star', startValue: 0, changePerTick: -0.02, limitValue: -0.10, destroyAtLimit: true },
      narrativeTemplate: 'The soulfire turns inward — {actor} feels their star essence fading.',
    },
    targeting: { type: 'self' },
  },

  // ─── T3: Pact of the Hollow Crown ──────────────────────────────
  {
    id: 'spell_hollow_crown',
    name: 'Pact of the Hollow Crown',
    tier: 3,
    tags: ['#social', '#shadow'],
    sphereAffinity: 'mind',
    flavorText: 'Dark charisma radiates outward, weakening rivals and empowering the caster in negotiations.',
    mechanicalSummary: 'Aura -gold on enemies + conditional +gold in social. Costs relationship + paranoia. Backlash: blessings transferred.',
    censusTag: { scale: 'local' },
    prerequisites: { minReach: { gold: 0.25, shadow: 0.20 } },
    effects: [
      { type: 'aura', radius: 1, target: 'enemies', reach: 'gold', value: -0.08 },
      { type: 'conditional', condition: 'in_social', reach: 'gold', value: 0.12 },
    ],
    cost: { type: 'multi', costs: [
      { type: 'relationship_damage', target: 'nearest_ally', amount: 30 },
      { type: 'condition_inflict', template: 'paranoia_whispers' },
    ]},
    cooldownTicks: 60,
    backlash: {
      trigger: 'failure',
      probability: 0.6,
      severity: 'major',
      effect: { type: 'transfer', what: 'condition', tags: ['blessing'], from: 'self', to: 'target' },
      narrativeTemplate: "The crown's shadow recoils — {actor}'s blessings flow to their enemy.",
    },
    targeting: { type: 'agent', range: 2, filter: 'enemy' },
  },

  // ─── T3: Crystal Gate ───────────────────────────────────────────
  {
    id: 'spell_crystal_gate',
    name: 'Crystal Gate',
    tier: 3,
    tags: ['#veil', '#crystal', '#arcane'],
    sphereAffinity: 'spirit',
    flavorText: 'A wayfinder crystal shatters, opening a portal to any point on the map.',
    mechanicalSummary: 'Unlimited-range teleport. Consumes a wayfinder crystal. Backlash: random destination.',
    censusTag: { scale: 'regional' },
    prerequisites: { minReach: { veil: 0.35 }, requiredAttachment: 'wayfinder_crystal' },
    effects: [
      { type: 'teleport', target: 'self', range: 'unlimited', destination: 'target_hex' },
    ],
    cost: { type: 'attachment_consume', tag: 'wayfinder_crystal' },
    cooldownTicks: 50,
    backlash: {
      trigger: 'failure',
      probability: 0.3,
      severity: 'major',
      effect: { type: 'teleport', target: 'self', range: 'unlimited', destination: 'random' },
      narrativeTemplate: 'The crystal shatters mid-transit — {actor} emerges somewhere unexpected.',
    },
    targeting: { type: 'hex', range: 999 },
  },

  // ─── T4: Last Breath ───────────────────────────────────────────
  {
    id: 'spell_last_breath',
    name: 'Last Breath',
    tier: 4,
    tags: ['#healing', '#star'],
    sphereAffinity: 'life',
    flavorText: 'The caster reaches across the threshold of death to pull an ally back.',
    mechanicalSummary: 'Dispel death condition + temporary iron weakness. Costs doom + star drain + exhaustion. Backlash: star decay.',
    censusTag: { scale: 'local' },
    prerequisites: { minReach: { star: 0.40, heart: 0.30 } },
    effects: [
      { type: 'dispel', target: 'condition', tags: ['dead'] },
      { type: 'duration', ticks: 30, reach: 'iron', value: -0.10, destroyOnExpiry: true },
    ],
    cost: { type: 'multi', costs: [
      { type: 'doom_increase', amount: 20 },
      { type: 'reach_drain', reach: 'star', amount: 0.10 },
      { type: 'tick_exhaust', ticks: 15 },
    ]},
    cooldownTicks: 200,
    backlash: {
      trigger: 'failure',
      probability: 1.0,
      severity: 'catastrophic',
      effect: { type: 'duration', ticks: 50, reach: 'star', value: -0.15, destroyOnExpiry: true },
      narrativeTemplate: "Death notices the attempt. {actor}'s connection to the stars dims.",
    },
    targeting: { type: 'agent', range: 0, filter: 'ally' },
  },
];

/** Lookup spell by ID */
export function getSpellTemplate(id: string): SpellTemplate | undefined {
  return SPELL_TEMPLATES.find(s => s.id === id);
}

// ─── The Power kind's node shape (THR-1429) ─────────────────────────
//
// A spell IS a graph node now: one **shared definition node per spell**, minted once
// at seeding, never one per bearer (THR-1395 — `traitShape.ts` deprecates the
// per-bearer node id). A mortal who *wields* the spell holds a `has_trait` edge to
// this node; one who merely *knows* it holds a `knows_spell` edge to the same node.
// Per-bearer state — when it was learned, where it came from — lives on the edge.
//
// The node deliberately carries **no `effects` array**. A cast resolves through
// `activateSpell` against the *template* (looked up by `spellTemplateId`), so the
// effects would be read by nobody here — and putting them on a node that many
// mortals share would hand the effect walker a shared attachment, where a suppression
// or a decay meant for one bearer would land on every bearer at once. The shape is
// the reason the seal is read off the bearer's own conditions rather than off this
// node's runtime state.

/** The id of the shared definition node for a spell template. */
export function spellDefinitionNodeId(spellTemplateId: string): string {
  return `power.spell.${spellTemplateId}`;
}

/** The definition-node shape for one spell template — the single writer of the Power kind's `spell` class. */
export function spellDefinitionNode(spell: SpellTemplate): {
  id: string;
  type: 'trait';
  name: string;
  properties: Record<string, unknown>;
} {
  return {
    id: spellDefinitionNodeId(spell.id),
    type: 'trait',
    name: spell.name,
    properties: {
      subcategory: 'spell',
      spellTemplateId: spell.id,
      sphereAffinity: spell.sphereAffinity,
      tier: spell.tier,
      tags: [...spell.tags],
      mechanicalSummary: spell.mechanicalSummary,
      flavorText: spell.flavorText,
      visibility: 'discoverable',
      maxLevel: 1,
    },
  };
}

/** Every spell definition node the world seeds — one per template, sorted by id (NFP #3). */
export function allSpellDefinitionNodes(): ReturnType<typeof spellDefinitionNode>[] {
  return [...SPELL_TEMPLATES]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(spellDefinitionNode);
}
