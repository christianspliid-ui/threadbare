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
 * | CONDITION_SHAKEN_DURATION      | 18      | Ticks (1.5 game days)               |
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
 * (template gating). All seven below are declared with `satisfies` rather than the
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
 * | CONDITION_STANDING_WELCOME_DURATION | 120     | Ticks (10 game days)          |
 * | LOCATION_IMPASSABLE_MULTIPLIER      | 8       | Soft-block movement tax        |
 *
 * Five of the seven are things that happen *to* a place and read negative;
 * `standing_welcome` (THR-1175) is the first that a person earns and the first
 * that reads positive, and `tended_shrine` (THR-1130 batch 3) is the second —
 * the state a shrine is left in when a gift goes down properly and something
 * answers. It is also the first location condition written through `$here`
 * rather than `$target`, which is what makes it reachable from a rite an agent
 * performs on themselves. It exists because a gratitude beat was expressing "a roof
 * that opens for them" as an `owes_favor` edge owed by the *town* — schema-illegal
 * and, worse, uncollectable, since every favour consumer is individual-shaped.
 * The condition is the honest shape of that fiction, and the gate is what makes
 * it pay off.
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties, ReachDomain } from '../types/traits';

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

/**
 * Duration for shaken condition (1.5 game days) — THR-1475.
 *
 * THR-1472 added the `shaken` template and its writers but no duration row, and
 * the gap was invisible because **the fallback is permanence, not a default**:
 * `CONDITION_DEFAULT_DURATION_TICKS` is `0`, and `0` means indefinite (the edge
 * simply omits `ticksRemaining`, which is the only field `decayConditions` counts
 * down). So `slice.snow_on_the_pass` — which grants it with no `durationOverride`
 * — was giving a mortal a permanent loss of nerve. Found while deriving the term
 * for this ticket's effect line: the reading came out "Lasts until it lifts" for a
 * condition that never lifts, which is the sort of thing only a words-producer
 * reading the data ever notices.
 *
 * 18 ticks mirrors `CONDITION_INSPIRED_DURATION` deliberately: inspired is buoyed
 * nerve and shaken is lost nerve, the same register read from either end, and a
 * condition pair that recovers at different rates needs a reason to. Shorter than
 * `grieving` (72) because that is a thing that happened to a life and this is a
 * thing that happened to an evening.
 */
export const CONDITION_SHAKEN_DURATION = 18;

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
 * Stones somebody is keeping (12 game days) — THR-1483.
 *
 * `tended_shrine` shipped with THR-1130 batch 3 and **no duration row at all**,
 * which is not a default but permanence: `CONDITION_DEFAULT_DURATION_TICKS` is
 * `0`, and `0` omits `ticksRemaining`, the only field `decayConditions` counts
 * down. So every gift left at a shrine was keeping it tended forever.
 *
 * Twelve days sits between `under_watch` (7) and `plague_scare` (14) on purpose.
 * The noun is *lately* — "gifts have been left at these stones lately" — so the
 * term has to be short enough that neglect shows inside a season, and long enough
 * that a traveller coming back over the same rise still finds it kept. A shrine
 * that stayed tended on one offering forever would make the second offering
 * meaningless, which is the failure mode a permanent condition always has.
 */
export const CONDITION_TENDED_SHRINE_DURATION = 144;

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

// ─── Location Condition Step Modifiers — THR-1483 ───────────────────────────
//
// Reader #3, and the one that closes THR-1483. The movement tax above answers
// "what does this place cost to *reach*"; this table answers "what does this
// place cost to *work in*" — an additive, per-reach term on any step resolved at
// the location, collected by `collectLocationConditionContributions`
// (`engine/resolutionModifiers.ts`) beside the terrain and faction terms that
// already read the same `locationId`.
//
// It exists because two conditions had a state nothing read. `under_watch`'s own
// definition comment claimed *"the readers are the movement tax and the gate"*
// and both were false — it carries no tax by design (being observed does not
// lengthen the road) and no shipped `requiredTargetTraits` gate ever named it. A
// chip may not promise what the engine cannot enact (director ruling 2026-09-12),
// so the choice was a reader or retirement, and both of these are written by live
// content.
//
// Deliberately **not** `domainContributions`: that bag is a node's own capability,
// walked by `computeRawScore` for the actor. A place has no capability to move
// (THR-1143) — what a place has is an effect on work done there, which is a
// different question with a different reader. Keeping them separate is what lets
// `conditionEffectLine` assert the two are disjoint rather than hope so.

/**
 * Eyes on a place cost the quiet reaches (THR-1483).
 *
 * Shadow because that is what the condition has always said it does — *"Quiet
 * work here is harder and more likely to be seen"* — and what its own `#shadow`
 * tag declares. One reach, not a spread: being watched does not make you weaker
 * at carrying a beam or worse at arithmetic, it makes exactly the hidden work
 * harder, and a condition that dusted a penalty over everything would be a mood
 * rather than a mechanism.
 *
 * Sized against its neighbours (NFP #1): a shade heavier than
 * `HOSTILE_TERRITORY_PENALTY` (−0.05), because a watcher posted on *this* place
 * is more pointed than a banner you happen to be standing under, and well inside
 * `LOCATION_CONDITION_STEP_MODIFIER_CAP` so a bad corner of the map still
 * compounds to something survivable.
 */
export const LOCATION_WATCHED_SHADOW_PENALTY = -0.06;

/**
 * Kept stones answer (THR-1483).
 *
 * Veil is the ritual reach — magic, divination, the rite taking — and a shrine
 * that is being kept is the one place-state in the set that says a rite here has
 * been answered lately. The positive mirror of `under_watch`: same magnitude
 * band, one reach, on the axis the condition's `#sacred` tag already names.
 *
 * Smaller than the watch penalty on purpose. A place helping you is a gift and a
 * place working against you is a threat, and the asymmetry is the usual one —
 * losses should read louder than the equivalent gain.
 */
export const LOCATION_TENDED_SHRINE_VEIL_BONUS = 0.05;

// ─── The four minted location traits' effect rows (THR-790) ──────────────────
// These four are not inflicted by an aftermath; `phaseLocationTraits` mints them
// from the world's own scalars and releases them when the scalar recovers
// (thresholds in `location-trait-constants.ts`). Each carries at least one row in
// the tables below plus a pool row there, because a trait with no reader is the
// gate theatre THR-800 named — `CONDITION_IDS_WITHOUT_EFFECT` stays empty.

/**
 * Movement multiplier for *Welcoming* — a place worth the road. Below 1 on purpose:
 * the only location condition that makes a place *cheaper* to reach, mirroring
 * `LOCATION_CROWDED_MULTIPLIER` (1.2) from the other side. `conditionEffectLine`
 * reads a sub-unity tax as *"Travel through here costs less."*
 */
export const LOCATION_WELCOMING_MULTIPLIER = 0.85;

/**
 * Gold penalty on steps resolved in a *Lawless* place — contracts, ledgers and
 * terms mean less where nobody enforces them. The watch penalty's band.
 */
export const LOCATION_LAWLESS_GOLD_PENALTY = -0.05;

/**
 * Veil bonus on steps resolved where the veil is thin — the rite takes more easily.
 * The tended shrine's magnitude, on the same axis.
 */
export const LOCATION_VEIL_THIN_VEIL_BONUS = 0.05;

/**
 * Heart penalty on steps resolved on *Haunted* ground — people here do not open up.
 * A shade heavier than the watch penalty, well inside the step-modifier cap.
 */
export const LOCATION_HAUNTED_HEART_PENALTY = -0.06;

/**
 * Clamp on the summed location-condition term, mirroring `TERRAIN_MODIFIER_CAP`.
 *
 * Conditions **add** here rather than compounding the way movement taxes
 * multiply, because a step is one roll against one threshold and a place cannot
 * be allowed to decide it by sheer accumulation of bad seasons. At 0.10 the
 * worst-stacked location is worth about one tier of skill, which is a strong
 * thumb on the scale and not a verdict.
 */
export const LOCATION_CONDITION_STEP_MODIFIER_CAP = 0.10;

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
      tags: ['#condition', '#negative'],
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

  {
    // THR-1472 — the same shape as `grieving` above, found the same way. Two
    // vertical-slice scars claimed a mortal came off a bad night "less sure of
    // themselves", backed only by a bare `quintessence_shift`: the engine wrote a
    // number and no word, so the chips reached for scene phrases instead — "the
    // nerve they came down with", "the nerve they walked in with". A tag the
    // player cannot read without remembering that encounter is not a state
    // (director ruling 2026-09-12), and the fix for a missing word is the word,
    // not better phrasing.
    //
    // Christian's own candidates were "Unsure", "Diffident", "Stressed".
    // `Shaken` is chosen over those three because it names the *event's residue*
    // rather than a temperament — a mortal is shaken by something and recovers,
    // which is what a duration-bearing condition models; "diffident" reads as who
    // they are, not what last night did to them.
    id: 'trait.condition.shaken',
    type: 'trait',
    name: 'Shaken',
    properties: {
      subcategory: 'condition',
      description: 'Their own judgement is the thing they trust least right now.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      // Lost nerve is not lost strength. It costs them where a decision has to be
      // made under someone's eye — `star` (holding a course) and `heart` (facing
      // people while unsure) — and deliberately leaves `iron` alone, which is what
      // separates this from `exhausted`.
      domainContributions: { star: -0.08, heart: -0.05 },
      tags: ['#condition', '#social', '#negative'],
      flavorText: 'They talk themselves through it twice before moving, and still move late.',
      censusTag: { scale: 'personal' },
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
      // A place has no capability to move, so this bag stays empty (THR-1143). Its
      // reader is the Shadow term in `LOCATION_CONDITION_STEP_MODIFIER` — THR-1483
      // gave it the one its comment used to claim. It carries no movement tax on
      // purpose: being observed changes what you can do in a place, not how long
      // it takes to walk in.
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
  // ── `trait.condition.location.standing_welcome` was here — deleted THR-1483 ──
  //
  // THR-1175 minted it as the first *positive* location condition; THR-1206
  // retired it on the director's ruling that reputation is the one concept for
  // "the social score between any two parties", so the Grateful Kin bands write a
  // `reputation_with` edge and the return-visit gate asks `requiredReputationWith`.
  // Plan: `Docs/plans/2026-08-23-thr-1206-reputation-unification.md`.
  //
  // THR-1206 left the definition registered under the THR-1177/1183 read-tolerance
  // pattern, so worlds saved before it could finish rendering their live edges in
  // words rather than as a raw id (UI Law 14). That window has closed: three weeks
  // with **zero writers**, and `CONDITION_STANDING_WELCOME_DURATION` (120 ticks,
  // 10 game days) is a twelfth of it — every edge minted under the old noun lapsed
  // long before this deletion, so read-tolerance now protects nothing and costs
  // two sweeps a special case.
  //
  // Verified rather than assumed, because the naive grep says otherwise: 14 hits
  // for the bare word survive in `encounters/vertical-slice.ts` and every one is a
  // comment or a **change id** (`slice.kin.a_standing_welcome`, `…_well`,
  // `…_dearly`) that merely shares the noun. The trait id itself has no writer.
  {
    // THR-1130 (retrofit batch 3) — the state a shrine is left in when a gift
    // goes down properly and something answers. Written because the `place`
    // family drawn for `encounter.shrine_offering` had no honest kind to land
    // on: `festival` and `under_watch` describe other things entirely, and
    // `standing_welcome` is retired to read-tolerance (zero writers, above).
    //
    // Class-honest across the template's whole envelope — `sacred`, `ruin` and
    // `wayside` — because the noun is the *stones*, not the building. A temple
    // forecourt, a shrine gone to ruin and a roadside cairn are all tended or
    // not tended by exactly the same test: has anyone given here lately, and
    // did it take.
    //
    // Positive and public, like `festival`: a traveller coming over the rise
    // can see a shrine that is being kept.
    //
    // THR-1483 gave it the mechanical half it shipped without. Its reader is the
    // Veil term in `LOCATION_CONDITION_STEP_MODIFIER` — kept stones answer, and
    // Veil is the ritual reach — plus a `CONDITION_DURATIONS` row it was also
    // missing, without which every offering tended the shrine permanently.
    id: 'trait.condition.location.tended_shrine',
    type: 'trait',
    name: 'A Tended Shrine',
    properties: {
      subcategory: 'condition',
      description: 'Gifts have been left at these stones lately and at least one of them was taken. The place is being kept, and it shows.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move, so this bag stays empty (THR-1143); the
      // reach term lives in `LOCATION_CONDITION_STEP_MODIFIER` instead.
      domainContributions: {},
      tags: ['#condition', '#location', '#sacred', '#positive'],
      flavorText: 'The hollow has not been empty in a season, and the moss has given up on it.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },

  // ─── Minted location traits (THR-790, traits wave 2 slice 1) ────────────
  // The first location conditions with a **producer from the world's own scalars**:
  // `phaseLocationTraits` mints each from a sustained reading (prosperity, unrest,
  // magical saturation, the dead) and releases it when the reading recovers, so
  // none carries a `CONDITION_DURATIONS` row — a minted trait has no term, it has a
  // cause. Same prefix, same subcategory, same `has_trait` edge as the six above,
  // which is what lets the movement tax, the step modifier, the target gate and the
  // location page read them with no new code. Thresholds and the pool rows live in
  // `location-trait-constants.ts`; the effect rows sit in the two tables below.
  {
    id: 'trait.condition.location.welcoming',
    type: 'trait',
    name: 'Welcoming',
    properties: {
      subcategory: 'condition',
      description: 'Long prosperity has opened this place. Doors stand ajar, the market runs late, and the road in feels shorter than it is.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the movement tax and the pool.
      domainContributions: {},
      tags: ['#condition', '#location', '#social', '#positive'],
      flavorText: 'Nobody here asks where you came from before they ask what you will drink.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.lawless',
    type: 'trait',
    name: 'Lawless',
    properties: {
      subcategory: 'condition',
      description: 'Unrest has held here so long that nobody enforces anything. Quiet work is easy and a contract is worth what the other party feels like.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the Gold step term and the pool.
      domainContributions: {},
      tags: ['#condition', '#location', '#shadow', '#negative'],
      flavorText: 'The watch-house has a new family living in it. They seem nice.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.veil_thin',
    type: 'trait',
    name: 'Veil-thin',
    properties: {
      subcategory: 'condition',
      description: 'Magic has soaked into the ground here and not drained away. Rites take more easily, and stranger things than rites come looking.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the Veil step term and the pool.
      domainContributions: {},
      tags: ['#condition', '#location', '#arcane', '#positive'],
      flavorText: 'Candles burn a little blue. The old woman at the well says they always have.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.location.haunted',
    type: 'trait',
    name: 'Haunted',
    properties: {
      subcategory: 'condition',
      description: 'Many died here where the veil was already thin, and something of them stayed. Travellers hurry through and the living do not open up.',
      importance: 0.9,
      maxLevel: 1,
      visibility: 'public',
      // A place has no capability to move; the readers are the movement tax, the Heart step term and the pool.
      domainContributions: {},
      tags: ['#condition', '#location', '#supernatural', '#negative'],
      flavorText: 'The names on the stones are fresh. Some of the stones are not.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  // THR-1548 — Scarred: the one fight wound that never heals (plan doc
  // `2026-09-23-defeat-and-victory.md` § Content). Written by the fight ending's
  // mauled face through `applyConditionToActor`, with the victor as the edge's
  // `inflictedBy` and a `scarredTick`; no duration, so it never expires. A
  // narrative mark: it moves no capability. `#scar` is its family, `#negative` its
  // polarity (so the applier's `damaged` proxy fires — a mauling is damage).
  {
    id: 'trait.scar.scarred',
    type: 'trait',
    name: 'Scarred',
    properties: {
      subcategory: 'scar',
      description: 'Struck down in a fight and lived. The wound closed; the mark did not.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: {},
      tags: ['#scar', '#combat', '#negative'],
      flavorText: 'An old wound, healed badly. They do not say who gave it.',
      censusTag: { scale: 'personal' },
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
  'trait.condition.shaken': CONDITION_SHAKEN_DURATION,
  // Location conditions (THR-1143)
  'trait.condition.location.pass_closed': CONDITION_PASS_CLOSED_DURATION,
  'trait.condition.location.festival': CONDITION_FESTIVAL_DURATION,
  'trait.condition.location.plague_scare': CONDITION_PLAGUE_SCARE_DURATION,
  'trait.condition.location.under_watch': CONDITION_UNDER_WATCH_DURATION,
  'trait.condition.location.harvest_blight': CONDITION_HARVEST_BLIGHT_DURATION,
  'trait.condition.location.tended_shrine': CONDITION_TENDED_SHRINE_DURATION,
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
 * The conditions that have **no live mechanical effect**, and therefore get no
 * effect line on a player surface. **Empty since THR-1483** — every shipped
 * condition now has a reader.
 *
 * THR-1475 opened it with three members, because `conditionEffectLine` then read
 * only two substrates — an agent condition's `domainContributions` (walked by
 * `computeRawScore`) and a place condition's entry in
 * `LOCATION_CONDITION_MOVEMENT_TAX` (read by `movementCost.ts`) — and three
 * location conditions had neither. They were listed rather than given a line
 * because the alternative was inventing one: *"quiet work here is likelier to be
 * seen"* is the obvious sentence for `under_watch` and it was **false**, since
 * nothing read the trait. A chip may not promise what the engine cannot enact
 * (director ruling, 2026-09-12).
 *
 * THR-1483 closed all three the only two honest ways. `under_watch` and
 * `tended_shrine` got the third substrate — `LOCATION_CONDITION_STEP_MODIFIER`,
 * read by `collectLocationConditionContributions` — so their sentences are now
 * derived from a term that really moves the roll. `standing_welcome` was deleted:
 * zero writers, and its read-tolerance window had long since lapsed.
 *
 * **The export stays.** It is not dead: `conditionEffectLine.test.ts` asserts in
 * both directions against it, and an empty list is what makes the *first*
 * direction cover every condition with no exceptions. A future condition that
 * genuinely ships ahead of its reader is added here for as long as that is true,
 * which re-arms the falsification arm automatically — and that arm checks all
 * three substrates, so an exemption can never be used to hide an effect that is
 * in fact derivable.
 */
export const CONDITION_IDS_WITHOUT_EFFECT: readonly string[] = [];

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
  // THR-790 — the two minted traits that change the road. *Welcoming* is the one
  // sub-unity row in the table (a place worth the road); *Haunted* is avoided the
  // way a plague town is. `lawless` and `veil_thin` carry no tax: what they change
  // is the work done in a place, so their reader is the step table below.
  'trait.condition.location.welcoming': LOCATION_WELCOMING_MULTIPLIER,
  'trait.condition.location.haunted': LOCATION_AVOIDED_MULTIPLIER,
  // `under_watch` and `tended_shrine` deliberately carry no tax: what a watcher or
  // a kept shrine changes is the work you do in a place, not how long it takes to
  // walk in. Their reader is `LOCATION_CONDITION_STEP_MODIFIER` below (THR-1483).
};

/**
 * Additive per-reach modifier on any step resolved **at** a location carrying the
 * condition — reader #3, and the substrate THR-1483 added.
 *
 * Read by `collectLocationConditionContributions` (`engine/resolutionModifiers.ts`),
 * which walks the location's own `has_trait` edges exactly the way the movement
 * tax does, so the term lifts by itself when the condition decays and there is no
 * second lifecycle to keep in step.
 *
 * A condition absent from this map tilts no step; that is the designed default,
 * not an omission, because most of what can happen to a place is not about the
 * work you came there to do. Tuning is editing this table (NFP #1).
 *
 * **Disjoint from `domainContributions` by construction**, and pinned that way by
 * `conditionEffectLine.test.ts`: no condition may carry both, so the two
 * reach-shaped substrates can be read together without any risk of double-count.
 */
export const LOCATION_CONDITION_STEP_MODIFIER: Record<
  string,
  Readonly<Partial<Record<ReachDomain, number>>>
> = {
  'trait.condition.location.under_watch': { shadow: LOCATION_WATCHED_SHADOW_PENALTY },
  'trait.condition.location.tended_shrine': { veil: LOCATION_TENDED_SHRINE_VEIL_BONUS },
  // THR-790 — the minted traits' step terms. Each names the one reach the fiction
  // moves: a lawless town devalues the contract, thin ground answers the rite,
  // haunted ground closes people's mouths. `welcoming` carries none — its effect
  // is the road (above) and the pool, not the roll.
  'trait.condition.location.lawless': { gold: LOCATION_LAWLESS_GOLD_PENALTY },
  'trait.condition.location.veil_thin': { veil: LOCATION_VEIL_THIN_VEIL_BONUS },
  'trait.condition.location.haunted': { heart: LOCATION_HAUNTED_HEART_PENALTY },
};
