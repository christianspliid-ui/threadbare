/**
 * Condition Trait Content Package — transient condition traits applied
 * during encounter outcomes.
 *
 * Conditions use ticksRemaining for automatic decay via conditionDecay.ts.
 * Duration is set at assignment time, not in the definition.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                          | Default | Purpose                             |
 * |-------------------------------|---------|-------------------------------------|
 * | CONDITION_WOUNDED_DURATION     | 24      | Ticks (2 game days)                 |
 * | CONDITION_INSPIRED_DURATION    | 18      | Ticks (1.5 game days)               |
 * | CONDITION_TERRIFIED_DURATION   | 12      | Ticks (1 game day)                  |
 * | CONDITION_BLESSED_DURATION     | 36      | Ticks (3 game days)                 |
 * | CONDITION_CURSED_DURATION      | 36      | Ticks (3 game days)                 |
 * | CONDITION_EXHAUSTED_DURATION   | 12      | Ticks (1 game day)                  |
 * | CONDITION_GRIEVING_DURATION    | 72      | Ticks (6 game days)                 |
 *
 * ─── Location conditions (THR-1143) ─────────────────────────────
 * The same family, carried by a **place** instead of a person: a pass closed for
 * the season, a town under a plague scare, a square under watch. Nothing about
 * the mechanism changes — the `has_trait` edge, the `ticksRemaining` counter and
 * the `decayConditions` expiry path are identical, because a condition was never
 * an agent concept, only ever an agent *use* of one.
 *
 * They are deliberately part of `CONDITION_TRAIT_DEFINITIONS` rather than a new
 * family: that list is what `seedEncounterTraitDefinitions` inserts at world init
 * (THR-809) and what `attachmentTemplateIndex` resolves tooltips from, so they
 * arrive seeded and hoverable without a second registration path (UI Law 3).
 *
 * `domainContributions` is deliberately **empty** rather than omitted — those are
 * read off an *agent's* traits to move that agent's capability, and a place has no
 * capability to move. A location condition's readers are the two in
 * `LOCATION_CONDITION_MOVEMENT_TAX` (movement cost) and `requiredTargetTraits`
 * (template gating). The five below are declared with `satisfies` rather than the
 * `as` cast the personal set uses, so the required-field contract is actually
 * checked at authoring time instead of asserted past.
 *
 * | Name                                | Default | Purpose                       |
 * |-------------------------------------|---------|-------------------------------|
 * | CONDITION_PASS_CLOSED_DURATION      | 360     | Ticks (30 game days — a season)|
 * | CONDITION_FESTIVAL_DURATION         | 36      | Ticks (3 game days)           |
 * | CONDITION_PLAGUE_SCARE_DURATION     | 168     | Ticks (14 game days)          |
 * | CONDITION_UNDER_WATCH_DURATION      | 84      | Ticks (7 game days)           |
 * | CONDITION_HARVEST_BLIGHT_DURATION   | 480     | Ticks (40 game days)          |
 * | LOCATION_IMPASSABLE_MULTIPLIER      | 8       | Soft-block movement tax        |
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';

// ─── Duration Constants (ticks) ─────────────────────────────────────────────

/** Duration for wounded condition (2 game days) */
export const CONDITION_WOUNDED_DURATION = 24;

/** Duration for inspired condition (1.5 game days) */
export const CONDITION_INSPIRED_DURATION = 18;

/** Duration for terrified condition (1 game day) */
export const CONDITION_TERRIFIED_DURATION = 12;

/** Duration for blessed condition (3 game days) */
export const CONDITION_BLESSED_DURATION = 36;

/** Duration for cursed condition (3 game days) */
export const CONDITION_CURSED_DURATION = 36;

/** Duration for exhausted condition (1 game day) */
export const CONDITION_EXHAUSTED_DURATION = 12;

/**
 * Duration for grieving condition (6 game days) — THR-1171.
 *
 * The longest of the personal set on purpose: the others are things that happen
 * *to* a body and wear off as it recovers, and this one is a thing that happened
 * to a life. An encounter that wants a shorter or longer grief passes a
 * `durationOverride` (apotheosis' declined endings run far past this), so this
 * number is the default weight of an ordinary loss, not a ceiling.
 */
export const CONDITION_GRIEVING_DURATION = 72;

// ─── Location Condition Durations (ticks) — THR-1143 ────────────────────────
// A place's conditions run on the world's clock, not a person's, so these are an
// order of magnitude longer than the personal set above: a season, not an evening.

/** A pass shut by weather or rockfall — one season (30 game days). */
export const CONDITION_PASS_CLOSED_DURATION = 360;

/** A festival in full swing (3 game days). */
export const CONDITION_FESTIVAL_DURATION = 36;

/** Fear of plague keeping travellers out (14 game days). */
export const CONDITION_PLAGUE_SCARE_DURATION = 168;

/** Somebody's eyes on this place (7 game days). */
export const CONDITION_UNDER_WATCH_DURATION = 84;

/** A failed harvest whose hunger outlasts the season (40 game days). */
export const CONDITION_HARVEST_BLIGHT_DURATION = 480;

/**
 * Movement multiplier for a place that is closed rather than merely costly.
 *
 * A **soft** block on purpose (NFP #4): a hard block can strand an agent whose
 * only route home runs through the pass, and a stranded agent is a dead corner of
 * the simulation. At ×8 the crossing is a decision with a price, which is what a
 * closed pass should be — the season, not a wall.
 */
export const LOCATION_IMPASSABLE_MULTIPLIER = 8;

/** Mild deterrent — a place people are avoiding, not one they cannot enter. */
export const LOCATION_AVOIDED_MULTIPLIER = 1.6;

/** A place drawing a crowd: slower going, but people are coming anyway. */
export const LOCATION_CROWDED_MULTIPLIER = 1.2;

// ─── Trait Definition Nodes ─────────────────────────────────────────────────

export const CONDITION_TRAIT_DEFINITIONS: GraphNode[] = [
  {
    id: 'trait.condition.wounded',
    type: 'trait',
    name: 'Wounded',
    properties: {
      subcategory: 'condition',
      description: 'Suffering from injuries sustained in conflict. Combat effectiveness reduced.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.08, stone: -0.04 },
      tags: ['#condition', '#combat', '#negative'],
      flavorText: 'Blood seeps through hastily bound cloth, a reminder that flesh is fragile.',
      censusTag: { scale: 'personal' },
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.inspired',
    type: 'trait',
    name: 'Inspired',
    properties: {
      subcategory: 'condition',
      description: 'Buoyed by a triumph of the spirit. Social and creative endeavors flourish.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { heart: 0.08, star: 0.04 },
      tags: ['#condition', '#social', '#positive'],
      flavorText: 'A fire burns behind their eyes — the kind that lights other fires.',
      censusTag: { scale: 'personal' },
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.terrified',
    type: 'trait',
    name: 'Terrified',
    properties: {
      subcategory: 'condition',
      description: 'Gripped by fear from a harrowing encounter. Avoids danger at all costs.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.06, shadow: 0.04 },
      tags: ['#condition', '#combat', '#negative'],
      flavorText: 'Every shadow hides a threat. Every silence hides a scream.',
      censusTag: { scale: 'personal' },
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.blessed',
    type: 'trait',
    name: 'Blessed',
    properties: {
      subcategory: 'condition',
      description: 'Touched by divine favor. Fortune bends in their direction.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { star: 0.10, heart: 0.04 },
      tags: ['#condition', '#divine', '#positive'],
      flavorText: 'Light follows them — not the blinding kind, but the kind that opens doors.',
      censusTag: { scale: 'personal' },
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.cursed',
    type: 'trait',
    name: 'Cursed',
    properties: {
      subcategory: 'condition',
      description: 'Marked by malign forces. Misfortune clings to every endeavor.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { star: -0.08, gold: -0.06 },
      tags: ['#condition', '#mystical', '#negative'],
      flavorText: 'The world tilts against them in small, cruel ways.',
      censusTag: { scale: 'personal' },
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.exhausted',
    type: 'trait',
    name: 'Exhausted',
    properties: {
      subcategory: 'condition',
      description: 'Pushed beyond their limits. Everything takes more effort.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { iron: -0.04, eye: -0.04, stone: -0.04 },
      tags: ['#condition', '#general', '#negative'],
      flavorText: 'Their limbs carry the weight of a world that will not let them rest.',
      censusTag: { scale: 'personal' },
    } as TraitDefinitionProperties,
  },
  {
    // THR-1171 — the vocabulary genuinely lacked a word for loss with no body to
    // bury, and two independent encounters reached for it before it existed
    // (apotheosis' declined endings, and THR-733's company drama, which worked
    // around the gap by claiming `wounded` and moving the grief into prose).
    // Two authors reaching for the same missing word is a gap, not two slips.
    id: 'trait.condition.grieving',
    type: 'trait',
    name: 'Grieving',
    properties: {
      subcategory: 'condition',
      description: 'Carrying a loss. Attention goes where the absence is, not where the work is.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'public',
      // Grief does not weaken the body — it takes the attention off the room and
      // the steadiness out of dealing with people. `heart` and `eye` carry that;
      // `iron` deliberately does not, which is what separates this from `wounded`.
      domainContributions: { heart: -0.08, eye: -0.05 },
      tags: ['#condition', '#social', '#negative'],
      flavorText: 'They keep turning to say something to someone who is not there.',
      censusTag: { scale: 'personal' },
      // `satisfies`, not the `as` cast the six above use — the location set
      // already made this switch (see the header note) so the required-field
      // contract is checked at authoring time rather than asserted past. A new
      // entry has no legacy to preserve, and the cast is what let the header's
      // own claim about `grieving` go unchecked in the first place (THR-1171).
    } satisfies TraitDefinitionProperties,
  },

  // ─── Location conditions (THR-1143) ───────────────────────────────────────
  // Carried by a place. `censusTag.scale` is 'local' — the census counts these
  // against the world's state, not against any person's.
  {
    id: 'trait.condition.location.pass_closed',
    type: 'trait',
    name: 'Closed for the Season',
    properties: {
      subcategory: 'condition',
      description: 'Snow, rockfall or flood has shut the way through. Crossing costs dearly, and most turn back.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the movement tax and the gate.
      domainContributions: {},
      tags: ['#condition', '#location', '#travel', '#negative'],
      flavorText: 'The road is still there under all of it. That is the cruel part.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.festival',
    type: 'trait',
    name: 'Festival',
    properties: {
      subcategory: 'condition',
      description: 'The place is given over to a celebration. Crowds slow the streets and loosen the usual rules.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the movement tax and the gate.
      domainContributions: {},
      tags: ['#condition', '#location', '#social', '#positive'],
      flavorText: 'For three days nobody asks what anyone does for a living.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.plague_scare',
    type: 'trait',
    name: 'Plague Scare',
    properties: {
      subcategory: 'condition',
      description: 'Word of sickness has spread here, true or not. Travellers route around it and doors stay shut.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the movement tax and the gate.
      domainContributions: {},
      tags: ['#condition', '#location', '#fear', '#negative'],
      flavorText: 'Nobody has counted the dead. Everybody has heard the number.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.under_watch',
    type: 'trait',
    name: 'Under Watch',
    properties: {
      subcategory: 'condition',
      description: 'Someone is keeping eyes on this place. Quiet work here is harder and more likely to be seen.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'discoverable',
      // A place has no capability to move; the readers are the movement tax and the gate.
      domainContributions: {},
      tags: ['#condition', '#location', '#shadow', '#negative'],
      flavorText: 'The same face at the same corner, three mornings running.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.harvest_blight',
    type: 'trait',
    name: 'Blighted Harvest',
    properties: {
      subcategory: 'condition',
      description: 'The fields here have failed. Food is short, prices climb, and the hunger outlasts the season.',
      importance: 0.9,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the movement tax and the gate.
      domainContributions: {},
      tags: ['#condition', '#location', '#economic', '#negative'],
      flavorText: 'The grain came up black. They burned the field and prayed over the ash.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
];

/** Map of condition trait IDs to their default durations */
export const CONDITION_DURATIONS: Record<string, number> = {
  'trait.condition.wounded': CONDITION_WOUNDED_DURATION,
  'trait.condition.inspired': CONDITION_INSPIRED_DURATION,
  'trait.condition.terrified': CONDITION_TERRIFIED_DURATION,
  'trait.condition.blessed': CONDITION_BLESSED_DURATION,
  'trait.condition.cursed': CONDITION_CURSED_DURATION,
  'trait.condition.exhausted': CONDITION_EXHAUSTED_DURATION,
  'trait.condition.grieving': CONDITION_GRIEVING_DURATION,
  // Location conditions (THR-1143)
  'trait.condition.location.pass_closed': CONDITION_PASS_CLOSED_DURATION,
  'trait.condition.location.festival': CONDITION_FESTIVAL_DURATION,
  'trait.condition.location.plague_scare': CONDITION_PLAGUE_SCARE_DURATION,
  'trait.condition.location.under_watch': CONDITION_UNDER_WATCH_DURATION,
  'trait.condition.location.harvest_blight': CONDITION_HARVEST_BLIGHT_DURATION,
};

/**
 * The location-condition ids, as a set — the membership predicate for "is this
 * condition a property of a place?" (THR-1143).
 *
 * Derived from `CONDITION_TRAIT_DEFINITIONS` rather than hand-listed, so adding a
 * definition cannot leave this behind. Prefix-keyed because the id namespace is
 * the declaration: `trait.condition.location.*` is a place's, everything else is
 * a person's.
 */
export const LOCATION_CONDITION_ID_PREFIX = 'trait.condition.location.';

export const LOCATION_CONDITION_IDS: readonly string[] = CONDITION_TRAIT_DEFINITIONS
  .map(node => node.id)
  .filter(id => id.startsWith(LOCATION_CONDITION_ID_PREFIX));

/**
 * Movement multiplier per location condition — the tunable half of reader #2.
 *
 * A condition absent from this map costs nothing to travel through; that is the
 * designed default, not an omission, because most of what can happen to a place
 * is not about the road. Tuning travel feel is editing this table (NFP #1).
 */
export const LOCATION_CONDITION_MOVEMENT_TAX: Record<string, number> = {
  'trait.condition.location.pass_closed': LOCATION_IMPASSABLE_MULTIPLIER,
  'trait.condition.location.plague_scare': LOCATION_AVOIDED_MULTIPLIER,
  'trait.condition.location.harvest_blight': LOCATION_AVOIDED_MULTIPLIER,
  'trait.condition.location.festival': LOCATION_CROWDED_MULTIPLIER,
  // `under_watch` deliberately carries no tax: being observed changes what you can
  // do in a place, not how long it takes to walk in. Its reader is the gate.
};
