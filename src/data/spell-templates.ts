/**
 * Spell Templates — initial spell content composed from effect primitives.
 *
 * These 5 spells are the worked examples from the design doc.
 * Each demonstrates different combinations of effects, costs, and backlash.
 *
 * Design doc: Docs/plans/2026-03-31-generic-effect-system-design.md
 */

import type { SpellTemplate, SpellAgency, AttachmentEffect } from '../types/effects';
import { isCarriedEffectStateless } from './spell-casting-constants';

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
    agency: 'deliberate',
    arena: 'map_travel',
    castProse: {
      landed: '{actor} steps through a fold in the air and is somewhere else.',
      fizzled: '{actor} reaches for the fold and finds only the road under their feet.',
    },
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
    agency: 'deliberate',
    arena: 'fight',
    castProse: {
      landed: "Starlight runs down {actor}'s arms, and every blow they strike burns.",
      fizzled: '{actor} calls the fire and it gutters, leaving only a warmth in the hands.',
    },
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
    agency: 'deliberate',
    arena: 'encounter',
    castReach: 'gold',
    castProse: {
      landed: "{actor} speaks with a borrowed crown's weight, and the room bends to it.",
      fizzled: "{actor} reaches for the crown's weight and finds only their own voice.",
    },
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
    agency: 'deliberate',
    arena: 'map_travel',
    castProse: {
      landed: 'The crystal breaks with a sound like a door, and {actor} walks through it.',
      fizzled: 'The crystal cracks, and the door it should have opened stays shut.',
    },
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
    agency: 'deliberate',
    arena: 'encounter',
    castReach: 'heart',
    castProse: {
      landed: '{actor} takes {target} by the hand and pulls them back across the threshold.',
      fizzled: '{actor} reaches across the threshold, and nothing takes their hand.',
    },
  },

  // ─── Fate-woven ports (THR-1571 S1.4) ──────────────────────────────
  //
  // Hand-ported from the spell prototype (THR-1232, "twenty generated spells" #1 and
  // #12) to prove the carried half: a fate-woven spell is never cast. It works while
  // it is carried — its `passiveEffects` ride the shared definition node, and the
  // effect walker applies them to every wielder — and it pays with what it carries:
  // a standing weakness and a chance to turn on the bearer when they fail badly.
  // Every primitive is stateless (lane decision 6). The generator (THR-1572) fills the
  // rest of the shelf.

  // ─── T2: The Wayfinding ─────────────────────────────────────────
  {
    id: 'spell_wayfinding',
    name: 'The Wayfinding',
    tier: 2,
    tags: ['#travel', '#discovery', '#arcane'],
    sphereAffinity: 'spirit',
    flavorText: 'The land speaks to the one who carries this working, and the next valley is never quite a stranger.',
    mechanicalSummary: 'Carried: every place within two hexes of an arrival goes on the map. Price: a little worse at Stone; a disaster may leave the bearer Grieving.',
    censusTag: { scale: 'personal' },
    prerequisites: {},
    effects: [],
    passiveEffects: [
      { type: 'reveal', target: 'hexes', range: 2 },
      { type: 'passive', reach: 'stone', value: -0.04 },
      {
        type: 'action_trigger',
        on: 'encounter_critical_failure',
        probability: 0.25,
        payload: { kind: 'condition_grant', conditionTraitId: 'trait.condition.grieving', durationTicks: 24 },
        narrativeTemplate: 'The land goes quiet in {actor}\'s head, and the silence is a kind of grief.',
      },
    ],
    cost: [],
    cooldownTicks: 0,
    targeting: { type: 'self' },
    agency: 'fate_woven',
    arena: 'map_sight',
  },

  // ─── T2: Height Anchor ──────────────────────────────────────────
  {
    id: 'spell_height_anchor',
    name: 'Height Anchor',
    tier: 2,
    tags: ['#combat', '#temporal', '#arcane'],
    sphereAffinity: 'time',
    flavorText: 'When a fight turns against the bearer, the moment catches them and holds, just long enough.',
    mechanicalSummary: 'Carried: in a fight, an exchange lost by a little counts as a near miss. Price: a little worse at Heart; a disaster may leave the bearer Exhausted.',
    censusTag: { scale: 'personal' },
    prerequisites: {},
    effects: [],
    passiveEffects: [
      { type: 'test_shaper', trigger: 'failure', steps: 1, condition: 'in_combat', maxMargin: 0.1 },
      { type: 'passive', reach: 'heart', value: -0.05 },
      {
        type: 'action_trigger',
        on: 'encounter_critical_failure',
        probability: 0.25,
        payload: { kind: 'condition_grant', conditionTraitId: 'trait.condition.exhausted', durationTicks: 24 },
        narrativeTemplate: 'The held moment lets go all at once, and {actor} is left spent.',
      },
    ],
    cost: [],
    cooldownTicks: 0,
    targeting: { type: 'self' },
    agency: 'fate_woven',
    arena: 'fight',
  },
];

/** THR-1571 — a spell's agency, authored or derived (deliberate when it has cast effects). */
export function spellAgencyOf(spell: Pick<SpellTemplate, 'agency' | 'effects'>): SpellAgency {
  return spell.agency ?? (spell.effects.length > 0 ? 'deliberate' : 'fate_woven');
}

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
// A deliberate spell's node carries **no `effects` array**: a cast resolves through
// `resolveCast` against the *template* (looked up by `spellTemplateId`).
//
// A fate-woven spell's node carries its `passiveEffects` as `effects` (THR-1571
// S1.4), so the effect walker applies them to every wielder through the `has_trait`
// edge it already walks. The node is shared by every bearer and `effectStates` is keyed
// by attachment id, so only **stateless** primitives may ride it — a stacking count or
// a charge would be one counter for the whole world (lane decision 6). A template that
// breaks the rule fails `spellTemplates.carried.test.ts` at build time; at runtime its
// node is minted without effects rather than shared-stateful. The same shape is why
// the seal is read off the bearer's own conditions rather than off this node's state.

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
      agency: spellAgencyOf(spell),
      ...(spell.arena ? { arena: spell.arena } : {}),
      ...(carriedEffectsOf(spell) ? { effects: carriedEffectsOf(spell) } : {}),
    },
  };
}

/**
 * The effects a fate-woven spell carries onto its shared node, or null. Null when the
 * spell is deliberate, has no passives, or holds a stateful primitive (the runtime
 * half of lane decision 6 — the data test is the build-time half).
 */
export function carriedEffectsOf(spell: SpellTemplate): AttachmentEffect[] | null {
  if (spellAgencyOf(spell) !== 'fate_woven') return null;
  const passives = spell.passiveEffects ?? [];
  if (passives.length === 0) return null;
  if (!passives.every(isCarriedEffectStateless)) {
    console.warn(`[spells] ${spell.id} carries a stateful primitive — minted without effects (THR-1571)`);
    return null;
  }
  return passives.map(e => ({ ...e }));
}

/** Every spell definition node the world seeds — one per template, sorted by id (NFP #3). */
export function allSpellDefinitionNodes(): ReturnType<typeof spellDefinitionNode>[] {
  return [...SPELL_TEMPLATES]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(spellDefinitionNode);
}
