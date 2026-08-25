/**
 * The Repertoire — nudge card library data model. THR-887.
 *
 * Three nested things, and keeping them distinct is the whole design:
 *
 * - a **type** is the player-facing vocabulary word (Boost, Veil, Gambit) — 21 of
 *   them, learned once and never again;
 * - a **family** is every member card sharing a type — the unit progression
 *   deepens;
 * - a **member** is one concrete library card: the thing dealt into a hand.
 *
 * Progression is *variation, not power* (plan Decision 7.2): a milestone grants a
 * new member of a family the god already plays, so late-run hands hold cards an
 * early-run god has never seen while every hand stays a decision.
 *
 * **Structure and content are separate tables in this file, joined at assembly.**
 * `title` and `quote` stayed optional on {@link NudgeCardMember} through THR-887,
 * when a member with no title was a real, dealable, fully-gated card rendering
 * through {@link cardDisplayTitle}'s keyword fallback. THR-1178 authored every
 * member (see {@link CARD_CONTENT}), so the fallback is now a safety net rather
 * than the normal path — but the fields stay optional and the fallback stays,
 * because the alternative is a schema change that makes adding a member a
 * two-file edit. `unauthoredCardCount() === 0` is pinned by test, so an
 * unauthored member is a named CI failure instead of a silent keyword card.
 *
 * Plan: `Docs/plans/2026-07-30-nudge-card-repertoire.md`
 * Wiki: `public/nudge-cards-reference.html` (declares this file as a freshness source)
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { HungerId } from '../types/hunger';
import type {
  DealContextTag,
  EncounterAftermathReactionEffect,
  NudgeCostChannels,
  NudgeRider,
  StepOutcome,
} from '../types/unifiedAction';

// ─── Card types (the 21 keywords) ────────────────────────────────────

/**
 * The player-facing vocabulary. One word per row of the wiki page's type table —
 * that table and this union are the same list, and the freshness gate is what
 * keeps them the same list.
 */
export type NudgeCardTypeId =
  | 'boost'
  | 'heavy_hand'
  | 'insurance'
  | 'mercy'
  | 'gambit'
  | 'side_bet'
  | 'long_game'
  | 'whisper'
  | 'trait_card'
  | 'signature'
  | 'bargain'
  | 'undertow'
  | 'stumble'
  | 'kindled_ambition'
  | 'omen'
  | 'cache'
  | 'balm'
  | 'veil'
  | 'favor'
  | 'fellowship'
  | 'compulsion';

/**
 * Build status of a type's *engine mechanics* — not of its content.
 *
 * `impl` the mechanic is shipped and a card of this type resolves today;
 * `design` specced (THR-885) with the host system live but the card path unbuilt;
 * `open` direction agreed, design pending. Mirrors the wiki page's badges.
 */
export type NudgeCardTypeStatus = 'impl' | 'design' | 'open';

export interface NudgeCardType {
  readonly id: NudgeCardTypeId;
  /** Player-facing keyword, as printed on the card. */
  readonly keyword: string;
  /** One line: what a card of this type does, mechanically. */
  readonly effectShape: string;
  /** The decision it puts in front of the player. */
  readonly decision: string;
  /** The one system that owns the effect — never a second path to the same place. */
  readonly hostSystem: string;
  readonly status: NudgeCardTypeStatus;
}

export const NUDGE_CARD_TYPES: readonly NudgeCardType[] = [
  {
    id: 'boost',
    keyword: 'Boost',
    effectShape: 'Success chance up, priced fairly',
    decision: 'Do I want this to go well?',
    hostSystem: 'Resolution',
    status: 'impl',
  },
  {
    id: 'heavy_hand',
    keyword: 'Heavy hand',
    effectShape: 'Large boost + detection pressure rises',
    decision: 'Power now, attention later',
    hostSystem: 'Stealth & detection',
    status: 'impl',
  },
  {
    id: 'insurance',
    keyword: 'Insurance',
    effectShape: 'Outcome cannot land worse than success at a cost',
    decision: 'Buy the floor, not the ceiling',
    hostSystem: 'Riders (floor_at_cost)',
    status: 'impl',
  },
  {
    id: 'mercy',
    keyword: 'Mercy',
    effectShape: 'Critical failure becomes ordinary failure',
    decision: 'Cheap disaster-proofing',
    hostSystem: 'Riders (no_crit_fail)',
    status: 'impl',
  },
  {
    id: 'gambit',
    keyword: 'Gambit',
    effectShape: 'Middling outcomes vanish — very well or badly',
    decision: 'Double or nothing',
    hostSystem: 'Riders (all_or_nothing)',
    status: 'impl',
  },
  {
    id: 'side_bet',
    keyword: 'Side-bet',
    effectShape: 'Modest boost + a worldly extra, win or lose',
    decision: 'Value beyond this moment',
    hostSystem: 'Per-card aftermath',
    status: 'impl',
  },
  {
    id: 'long_game',
    keyword: 'Long game',
    effectShape: 'Plants a trait or hidden mark future encounters fire on',
    decision: 'Sacrifice now for story later',
    hostSystem: 'Traits trigger layer',
    status: 'impl',
  },
  {
    id: 'whisper',
    keyword: 'Whisper',
    effectShape: "Reveals a hidden factor or the next step's demand",
    decision: 'Pay to see before you spend',
    hostSystem: 'Intelligence',
    status: 'impl',
  },
  {
    id: 'trait_card',
    keyword: 'Trait card',
    effectShape: 'Free; exists because of who this mortal is',
    decision: 'Character as resource',
    hostSystem: 'Agent traits',
    status: 'impl',
  },
  {
    id: 'signature',
    keyword: 'Signature',
    effectShape: "Keyed to the god's spheres — discounted in-sphere",
    decision: 'Your divine identity shapes your hand',
    hostSystem: 'Spheres',
    status: 'impl',
  },
  {
    id: 'bargain',
    keyword: 'Bargain',
    effectShape: 'No essence — paid in doom, detection, or obligation',
    decision: 'Free power, priced elsewhere',
    hostSystem: 'Doom / detection / favors',
    status: 'impl',
  },
  {
    id: 'undertow',
    keyword: 'Undertow',
    effectShape: "Strong boost through an ugly method; shifts the mortal's values",
    decision: 'Effective, and it changes who they are',
    hostSystem: 'Pole-shift (WS6)',
    status: 'impl',
  },
  {
    id: 'stumble',
    keyword: 'Stumble',
    effectShape: "Physics turns against the scene's opposition",
    decision: 'Weaken them instead of strengthening yours',
    hostSystem: 'Encounter cast',
    status: 'impl',
  },
  {
    id: 'kindled_ambition',
    keyword: 'Kindled ambition',
    effectShape: 'The mortal wakes wanting something lasting',
    decision: 'Give them a drive, not a bonus',
    hostSystem: 'Ambitions',
    status: 'impl',
  },
  {
    id: 'omen',
    keyword: 'Omen',
    effectShape: 'Future encounter draws bend toward what this uncovered',
    decision: 'Steer the story, not the roll',
    hostSystem: 'Omens',
    status: 'impl',
  },
  {
    id: 'cache',
    keyword: 'Cache',
    effectShape: 'Something is left for them to find; ships with the item built',
    decision: 'A keepsake that persists',
    hostSystem: 'Attachments & items',
    status: 'impl',
  },
  {
    id: 'balm',
    keyword: 'Balm',
    effectShape: 'Removes one condition (wound, fever, dread)',
    decision: 'End a suffering directly',
    hostSystem: 'Effects & conditions',
    status: 'impl',
  },
  {
    id: 'veil',
    keyword: 'Veil',
    effectShape: 'Same help, unwitnessed — no detection, invisible to rivals',
    decision: 'Pay extra for silence',
    hostSystem: 'Stealth + rival scans',
    status: 'impl',
  },
  {
    id: 'favor',
    keyword: 'Favor',
    effectShape: 'Creates or calls in a favor owed',
    decision: 'Debts as currency',
    hostSystem: 'Secrets & favors',
    status: 'impl',
  },
  {
    id: 'fellowship',
    keyword: 'Fellowship',
    effectShape: "Steadies or strains the traveling group's bond",
    decision: 'The company, not the individual',
    hostSystem: 'Groups & cohesion',
    status: 'impl',
  },
  {
    id: 'compulsion',
    keyword: 'Compulsion',
    effectShape: "A dream-sent urge shaping the mortal's next decision",
    decision: 'Steer them, not the world',
    // THR-886: the urge is a per-agent decision bias folded into `phaseAgentDecision`'s
    // existing scoring, NOT the premonition candidate menu — Christian's 2026-08-09
    // ruling kept the pick-one-of-three vision on the god's own premonition turn.
    hostSystem: 'Agent decision bias',
    status: 'impl',
  },
];

const TYPES_BY_ID: ReadonlyMap<NudgeCardTypeId, NudgeCardType> = new Map(
  NUDGE_CARD_TYPES.map((t) => [t.id, t]),
);

/** Type row for an id, or `undefined` for an id that is not a card type. */
export function nudgeCardType(id: string): NudgeCardType | undefined {
  return TYPES_BY_ID.get(id as NudgeCardTypeId);
}

// ─── Sphere signatures ───────────────────────────────────────────────

/**
 * Types every god holds regardless of sphere. The floor that guarantees a hand
 * is playable on turn one, and the reason an off-sphere god is never handless.
 */
export const UNIVERSAL_CORE_TYPES: readonly NudgeCardTypeId[] = [
  'boost',
  'insurance',
  'mercy',
  'trait_card',
];

/**
 * Sphere → the types it signs. **First-cut mapping** (plan Decision 7.1) —
 * iterated on the wiki page, which is why it is one table and not scattered
 * per-card `sphere` fields.
 *
 * `order` signs Insurance and `energy` signs Boost even though both are also
 * universal core: that is the "⁺" in the design. The type is common; the
 * *signature member* of it (see {@link NUDGE_CARD_LIBRARY}) is not.
 */
export const SPHERE_SIGNATURES: Readonly<Record<SphereName, readonly NudgeCardTypeId[]>> = {
  chaos: ['gambit', 'stumble'],
  order: ['favor', 'insurance'],
  light: ['whisper'],
  darkness: ['veil', 'undertow'],
  force: ['heavy_hand'],
  matter: ['cache'],
  energy: ['boost'],
  life: ['balm'],
  mind: ['compulsion'],
  spirit: ['kindled_ambition'],
  time: ['omen'],
  entropy: ['bargain'],
};

// ─── Members ─────────────────────────────────────────────────────────

/**
 * How a member card enters a god's repertoire.
 *
 * `milestone` names an id in `GameState.unlockedActionIds` — the *existing*
 * ascendant-progression grant set that `unlock_action` already writes and
 * `StepNudge.requiredUnlock` already reads. Riding it is deliberate: a second
 * unlock ledger would be a parallel path to a place that already has an owner.
 *
 * `god_trait` is the THR-791 hook, stubbed behind the same interface — the
 * resolver reads it today and finds nothing, because god-earned traits do not
 * exist yet. When wave 3 lands it starts resolving with no call-site change.
 */
export type NudgeCardUnlock =
  | { readonly kind: 'starting' }
  | { readonly kind: 'milestone'; readonly unlockActionId: string }
  | { readonly kind: 'god_trait'; readonly traitId: string }
  | {
      /**
       * Earned by *practice in a sphere* — `threshold` lifetime essence drawn
       * through `sphere`, read off `GameState.essenceEarnedBySphere` (THR-1180).
       *
       * Deepening, never re-keying. The identity floor still decides which
       * families a god may touch at all, so an attunement member on a sphere
       * this god does not hold stays locked no matter how attuned they are
       * elsewhere — `memberAccess` runs before `isMemberUnlocked` and answers
       * a different question. THR-870's score-keyed *access* pivot stays parked.
       */
      readonly kind: 'sphere_attunement';
      readonly sphere: SphereName;
      /** A mark from `SPHERE_ATTUNEMENT_THRESHOLDS`; pinned to that table by test. */
      readonly threshold: number;
    };

export interface NudgeCardMember {
  /** Library id. Stable — an echo card from a previous run names one of these. */
  readonly id: string;
  readonly typeId: NudgeCardTypeId;
  /**
   * Sphere that signs this member. Absent ⇒ common pool: held by every god,
   * never discounted, never locked.
   */
  readonly sphere?: SphereName;
  /**
   * Hunger that grants this member as a starting unique. Absent ⇒ not a hunger
   * unique. Exactly one member per hunger carries this (asserted by test).
   */
  readonly hunger?: HungerId;
  /** How it is earned. Absent ⇒ `{ kind: 'starting' }`. */
  readonly unlock?: NudgeCardUnlock;
  /** Two or three generic words. Absent until authored under THR-883. */
  readonly title?: string;
  /** The card's only prose — one short serif line. Absent until authored. */
  readonly quote?: string;
  /** Image-library tag; absent ⇒ falls back to the type's generic art. */
  readonly imageTag?: string;
}

/**
 * The library. Every card any god can ever hold.
 *
 * Composition, in the order the sections appear below:
 * 1. universal core — one member per {@link UNIVERSAL_CORE_TYPES} entry;
 * 2. sphere signatures — one member per (sphere, signature type) pair, derived
 *    from {@link SPHERE_SIGNATURES} so the two cannot drift;
 * 3. hunger uniques — one per live hunger, named by {@link HUNGER_UNIQUE_CARDS};
 * 4. variation members — family deepening earned mid-run.
 *
 * Sections 1–2 are *generated* from the constant tables rather than typed out.
 * A hand-written duplicate of a table that already exists is a drift surface,
 * and this file's whole job is to be the place the tables agree.
 */
function coreMember(typeId: NudgeCardTypeId): NudgeCardMember {
  return { id: `card.${typeId}.core`, typeId, unlock: { kind: 'starting' } };
}

function signatureMember(sphere: SphereName, typeId: NudgeCardTypeId): NudgeCardMember {
  return {
    id: `card.${typeId}.signature.${sphere}`,
    typeId,
    sphere,
    unlock: { kind: 'starting' },
  };
}

/**
 * Hunger → its one unique starting card (plan Decision 7.3).
 *
 * **Keyed on the live {@link HungerId} union, which has ten members.** The plan
 * doc and the wiki page both say twelve, naming `haunt` and `illuminate`; those
 * two hungers do not exist in the type system, and minting them here would mean
 * inventing a `HungerDefinition` — perception style, emotional tone, reach bias,
 * dilemma tags — that worldgen and the remembrance flow would then seed against.
 * That is a design decision, not an implementation detail, so it is filed rather
 * than guessed: THR-891. `Record<HungerId, …>` means this map cannot silently
 * fall behind whatever that ticket decides.
 *
 * Type assignment is **first-cut**, exactly as {@link SPHERE_SIGNATURES} is, and
 * is iterated on the wiki page. Only `witness` and `sever` are pinned by the
 * plan text ("a Witness gets *Seen*"; "a Sever god holds the game's only
 * mid-encounter bond-cutting card").
 */
export const HUNGER_UNIQUE_CARDS: Readonly<Record<HungerId, string>> = {
  witness: 'card.whisper.hunger.witness',
  kindle: 'card.kindled_ambition.hunger.kindle',
  sever: 'card.long_game.hunger.sever',
  bind: 'card.favor.hunger.bind',
  consume: 'card.undertow.hunger.consume',
  gather: 'card.cache.hunger.gather',
  preserve: 'card.insurance.hunger.preserve',
  reclaim: 'card.balm.hunger.reclaim',
  reshape: 'card.stumble.hunger.reshape',
  wander: 'card.omen.hunger.wander',
  // THR-891 — the two hungers added to `HungerId` when it was reconciled with
  // the remembrance catalog. Both types are picked from the *existing* table
  // above rather than minted, and each is the closest read of its hunger's
  // already-blessed mandate:
  //   haunt      → its mandate is "influence through dreams, omens, and unseen
  //                presence"; `compulsion` is "a dream-sent urge shaping the
  //                mortal's next decision". Near-verbatim.
  //   illuminate → its mandate is to "make the invisible visible", its court a
  //                beacon with "no shadows"; `heavy_hand` is the library's one
  //                card whose defining trade is acting conspicuously
  //                (detection pressure rises) — the exact inverse of `veil`,
  //                as Illuminate is the inverse of a concealment god.
  haunt: 'card.compulsion.hunger.haunt',
  illuminate: 'card.heavy_hand.hunger.illuminate',
};

/**
 * The type each hunger unique belongs to, derived from its own id so the two
 * cannot disagree. A hunger-unique id is `card.<typeId>.hunger.<hungerId>`;
 * this reads the type back out rather than restating it.
 */
function hungerMember(hunger: HungerId, id: string): NudgeCardMember {
  const typeId = id.slice('card.'.length, id.indexOf('.hunger.')) as NudgeCardTypeId;
  return { id, typeId, hunger, unlock: { kind: 'starting' } };
}

/**
 * Members earned during a run — the progression surface (plan Decision 7.2).
 *
 * Each is a *sibling* of a card the god already plays: same verb, different
 * twist. None is strictly stronger, which is the design constraint that keeps
 * a late-run hand interesting rather than solved.
 *
 * Kept small and hand-written on purpose: unlike the core and signature
 * sections there is no table these can be derived from, and each new entry is a
 * deliberate content decision made against the milestone that grants it.
 */
const VARIATION_MEMBERS: readonly NudgeCardMember[] = [
  {
    id: 'card.boost.variation.patient',
    typeId: 'boost',
    unlock: { kind: 'milestone', unlockActionId: 'divine.rekindle_thread' },
  },
  {
    id: 'card.insurance.variation.shared',
    typeId: 'insurance',
    unlock: { kind: 'milestone', unlockActionId: 'divine.rekindle_thread' },
  },
  {
    id: 'card.mercy.variation.witnessed',
    typeId: 'mercy',
    // THR-791 hook: god-earned traits do not exist yet, so this resolves to
    // "locked" today and starts resolving when wave 3 lands. Deliberately live
    // rather than commented out — an unlock path with no exerciser is a path
    // nobody notices has broken.
    unlock: { kind: 'god_trait', traitId: 'god.merciful' },
  },

  // ─── Attunement members (THR-1180) ─────────────────────────────────
  //
  // The `sphere_attunement` channel's exercisers. Three, not zero, and that is
  // the whole reason they are here: the `god_trait` member above is tolerated
  // inert because THR-791 will come and claim it, and this channel has no
  // future owner but us — shipping the kind with nothing gated on it would mean
  // nobody notices the day it stops resolving (plan § the live-layer trap).
  //
  // Each is signed by the sphere it is attuned to, which is not redundant: the
  // `sphere` field gates *access* (does this god hold darkness at all) and the
  // unlock gates *depth* (have they worked 20 essence through it). A god who
  // holds the sphere but has not practiced it sees the family without this
  // member; a god who has practiced a sphere they do not hold sees neither.
  //
  // Two sit at the first mark and one at the second, so both rows of
  // `SPHERE_ATTUNEMENT_THRESHOLDS` have an exerciser — an unreachable second
  // row is the same inert path one table cell further in.
  {
    id: 'card.gambit.attunement.chaos',
    typeId: 'gambit',
    sphere: 'chaos',
    unlock: { kind: 'sphere_attunement', sphere: 'chaos', threshold: 20 },
  },
  {
    id: 'card.veil.attunement.darkness',
    typeId: 'veil',
    sphere: 'darkness',
    unlock: { kind: 'sphere_attunement', sphere: 'darkness', threshold: 20 },
  },
  {
    id: 'card.whisper.attunement.light',
    typeId: 'whisper',
    sphere: 'light',
    unlock: { kind: 'sphere_attunement', sphere: 'light', threshold: 60 },
  },
];

// ─── Authored content (THR-1178 workstream B) ────────────────────────

/**
 * The authored face of one library card: what the player reads.
 *
 * Kept as a **separate table keyed by member id** rather than as fields on the
 * member literals, because sections 1–2 of the library are generated from
 * {@link UNIVERSAL_CORE_TYPES} and {@link SPHERE_SIGNATURES} and must stay
 * generated — hand-typing those members to hang prose on them would reintroduce
 * exactly the drift surface this file exists to remove. Content joins the
 * structure at assembly time instead (see {@link withContent}).
 */
interface NudgeCardContent {
  /** Two to four generic words. Interactive-plain: no metaphor, no ambiguity. */
  readonly title: string;
  /** The card's only prose — one short line. A dry aphorism is the ceiling. */
  readonly quote: string;
  /** Image-library tag; omitted ⇒ the type's generic art. */
  readonly imageTag?: string;
}

/**
 * Every card face, authored under the locked THR-883 format (THR-1178).
 *
 * Three rules govern every entry and are worth restating where they are broken:
 *
 * 1. **Genericity.** A face must read correctly wherever its type deals. A title
 *    or quote that only lands in one scene is a defect, not a flourish — scene
 *    grounding is the *prose's* job, and the card's job is the rule.
 * 2. **Sphere voice.** A signature member reads as its sphere's mode of power:
 *    an `omen` card sounds like time, a `compulsion` card like mind. A recolored
 *    boost is a miss, and this table is where that is caught.
 * 3. **Imperative titles — verb + noun** (Prose Doctrine v2, THR-1224). The
 *    title is a label, and a label's job is to be unmistakable; v2 makes the
 *    *shape* explicit. "Widen The Swing", never "The Wider Swing" — a card
 *    names the god's move, so it opens with the move. Four words is the budget
 *    (`NUDGE_WORD_BUDGETS.name`); `doctrineV2Checks.ts` reports the shape at
 *    warn level, and its `IMPERATIVE_VERB_LEXICON` is where a verb it does not
 *    yet know gets added.
 *
 *    All 37 members were renamed to this shape in one pass. **Ids did not move**
 *    — every template referencing a member by `libraryCardId` was untouched,
 *    which is exactly why the rename was safe to do in bulk.
 *
 * The `quote` is now **dead data on every surface**: v2 retires the flavor quote
 * by name, `StepNudge.fiction` is deprecated, and no card face draws either. The
 * field stays required here because `unauthoredCardCount()` reads it to prove a
 * member has an authored face, so removing it is a schema change and rides THR-1225
 * rather than being smuggled into a rename pass.
 *
 * `imageTag` is deliberately absent throughout: the image library has no card
 * rows to bind to, and minting art slots is owned elsewhere (THR-832/THR-1170).
 * Every face therefore falls back to its type's generic art, which is the
 * documented chain, not a gap.
 */
const CARD_CONTENT: Readonly<Record<string, NudgeCardContent>> = {
  // Universal core — the floor every god holds. Plainest voices in the library.
  'card.boost.core': {
    title: 'Press The Odds',
    quote: 'Most things fail by a margin.',
  },
  'card.insurance.core': {
    title: 'Buy The Floor',
    quote: 'Every plan should survive being wrong.',
  },
  'card.mercy.core': {
    title: 'Spare The Worst',
    quote: 'Failing is survivable. Some failures are not.',
  },
  'card.trait_card.core': {
    title: 'Draw On Character',
    quote: 'Character is the one resource nobody spends.',
  },

  // Sphere signatures — each reads as its sphere's mode of power.
  'card.gambit.signature.chaos': {
    title: 'Risk Everything',
    quote: 'Chaos has no use for the adequate.',
  },
  'card.stumble.signature.chaos': {
    title: 'Loosen Their Footing',
    quote: 'Every structure has one loose piece.',
  },
  'card.favor.signature.order': {
    title: 'Open The Ledger',
    quote: 'Order is only debt everyone agreed to honor.',
  },
  'card.insurance.signature.order': {
    title: 'Follow The Book',
    quote: 'Rules exist so the worst case has a name.',
  },
  'card.whisper.signature.light': {
    title: 'Show The Obvious',
    quote: 'Nothing was hidden. It was only unlit.',
  },
  'card.veil.signature.darkness': {
    title: 'Hide The Deed',
    quote: 'The kindest help leaves no fingerprints.',
  },
  'card.undertow.signature.darkness': {
    title: 'Offer The Easier Way',
    quote: 'It works. That is the problem.',
  },
  'card.heavy_hand.signature.force': {
    title: 'Throw Full Weight',
    quote: 'Subtlety is a choice. This is not it.',
  },
  'card.cache.signature.matter': {
    title: 'Find What Remains',
    quote: 'Matter keeps its promises longer than people do.',
  },
  'card.boost.signature.energy': {
    title: 'Rouse The Body',
    quote: 'Bodies hold more than they admit.',
  },
  'card.balm.signature.life': {
    title: 'Ease The Suffering',
    quote: 'Most suffering ends. This one ends sooner.',
  },
  'card.compulsion.signature.mind': {
    title: 'Plant An Urge',
    quote: 'By morning it feels like their own idea.',
  },
  'card.kindled_ambition.signature.spirit': {
    title: 'Kindle A Wanting',
    quote: 'A life turns on what it reaches for.',
  },
  'card.omen.signature.time': {
    title: 'Read The Pattern',
    quote: 'Nothing happens only once.',
  },
  'card.bargain.signature.entropy': {
    title: 'Pay It Elsewhere',
    quote: 'Nothing is free. Some prices are only slower.',
  },

  // Hunger uniques — each reads as its hunger's perception style.
  'card.whisper.hunger.witness': {
    title: 'Read The Architecture',
    quote: 'Every situation has an architecture. Most go unlooked at.',
  },
  'card.kindled_ambition.hunger.kindle': {
    title: 'Fan The Ember',
    quote: 'Some sparks only need the air.',
  },
  'card.long_game.hunger.sever': {
    title: 'Cut The Thread',
    quote: 'Not every tie was chosen. None are permanent.',
  },
  'card.favor.hunger.bind': {
    title: 'Bind A Debt',
    quote: 'Every civilization runs on who owes whom.',
  },
  'card.undertow.hunger.consume': {
    title: 'Take What Is There',
    quote: 'Strength does not care where it came from.',
  },
  'card.cache.hunger.gather': {
    title: 'Set Aside For Them',
    quote: 'Someone always put something by.',
  },
  'card.insurance.hunger.preserve': {
    title: 'Save What Remains',
    quote: 'Keeping is harder than making. Do it anyway.',
  },
  'card.balm.hunger.reclaim': {
    title: 'Mend What Broke',
    quote: 'Some wounds are only debts the body is carrying.',
  },
  'card.stumble.hunger.reshape': {
    title: 'Press The Weak Point',
    quote: 'Everything holds until the moment it does not.',
  },
  'card.omen.hunger.wander': {
    title: 'Call Them Onward',
    quote: 'Every road is asking to be followed.',
  },
  'card.compulsion.hunger.haunt': {
    title: 'Send A Dream',
    quote: 'Everyone is haunted. Few are visited on purpose.',
  },
  'card.heavy_hand.hunger.illuminate': {
    title: 'Light The Deed',
    quote: 'Let them see who did this.',
  },

  // Variation members — siblings of a card the god already plays.
  'card.boost.variation.patient': {
    title: 'Push Early',
    quote: 'Early pressure costs less than late force.',
  },
  'card.insurance.variation.shared': {
    title: 'Split The Cost',
    quote: 'A cost split is a cost survived.',
  },
  'card.mercy.variation.witnessed': {
    title: 'Send A Witness',
    quote: 'The worst hour is the one nobody sees.',
  },

  // Attunement members — each reads as *practice* in its sphere, not as a
  // stronger version of the signature it sits beside. That is the design
  // constraint the faces have to carry: attunement is depth, never power.
  'card.gambit.attunement.chaos': {
    title: 'Widen The Swing',
    quote: 'Practice does not make chaos safer. It makes it larger.',
  },
  'card.veil.attunement.darkness': {
    title: 'Clear The Traces',
    quote: 'A practiced hand leaves less than a careful one.',
  },
  'card.whisper.attunement.light': {
    title: 'Read The Whole Shape',
    quote: 'Long looking shows what one glance cannot.',
  },
};

/**
 * Join a structural member to its authored face.
 *
 * Fail-soft by omission: a member with no {@link CARD_CONTENT} row passes
 * through unchanged and still renders through {@link cardDisplayTitle}'s keyword
 * fallback. The `unauthoredCardCount() === 0` test is what makes that a
 * *visible* gap rather than a silent one — adding a library member without a
 * face fails CI by name, which is the intended friction.
 */
function withContent(member: NudgeCardMember): NudgeCardMember {
  const content = CARD_CONTENT[member.id];
  return content === undefined ? member : { ...member, ...content };
}

export const NUDGE_CARD_LIBRARY: readonly NudgeCardMember[] = [
  ...UNIVERSAL_CORE_TYPES.map(coreMember),
  ...SPHERE_NAMES.flatMap((sphere) =>
    SPHERE_SIGNATURES[sphere].map((typeId) => signatureMember(sphere, typeId)),
  ),
  ...(Object.entries(HUNGER_UNIQUE_CARDS) as readonly [HungerId, string][]).map(
    ([hunger, id]) => hungerMember(hunger, id),
  ),
  ...VARIATION_MEMBERS,
].map(withContent);

const MEMBERS_BY_ID: ReadonlyMap<string, NudgeCardMember> = new Map(
  NUDGE_CARD_LIBRARY.map((m) => [m.id, m]),
);

/** Library card for an id, or `undefined` for an id that is not in the library. */
export function nudgeCardMember(id: string): NudgeCardMember | undefined {
  return MEMBERS_BY_ID.get(id);
}

/** Every member of one family, in library order. */
export function nudgeCardFamily(typeId: NudgeCardTypeId): readonly NudgeCardMember[] {
  return NUDGE_CARD_LIBRARY.filter((m) => m.typeId === typeId);
}

/**
 * What to print on a card that has no authored title yet — the type's keyword.
 *
 * Fail-soft in the sense that matters: an unauthored card is *dealable and
 * legible*, not blank and not a crash. It reads as its own keyword.
 *
 * Since THR-1178 every library member is authored, so this fallback no longer
 * fires for shipped content — it exists for the member added tomorrow before
 * its face is written. Kept (rather than collapsed to `member.title`) because
 * the alternative makes adding a card a two-file edit whose half-done state
 * renders blank instead of legible.
 */
export function cardDisplayTitle(member: NudgeCardMember): string {
  return member.title ?? nudgeCardType(member.typeId)?.keyword ?? member.typeId;
}

/**
 * Count of members still awaiting authored content.
 *
 * **Zero since THR-1178, and pinned there by test.** It stays as a live gauge
 * rather than a retired counter: it is what makes adding an unauthored member a
 * named CI failure instead of a card that silently deals as its own keyword.
 */
export function unauthoredCardCount(): number {
  return NUDGE_CARD_LIBRARY.filter((m) => m.title === undefined || m.quote === undefined).length;
}

// ─── Play profiles — the mechanics a dealt card plays with (THR-1247) ──

/**
 * What a library member *does* when the Repertoire deals it into a hand.
 *
 * Until THR-1247 a member carried a face ({@link CARD_CONTENT}) and nothing
 * else: every number a card played with — cost, odds, rider, alternate price,
 * world grant — lived on a per-encounter authored `StepNudge`, which is why
 * dealing was impossible and why authoring a hand was the most expensive part
 * of writing an encounter. This table is the missing half.
 *
 * **A profile is generic by the same law as the face.** No scene-bespoke
 * targets, no numbers tuned for one encounter's difficulty. A grant that needs
 * something to point at (Cache's item, Balm's condition) uses the THR-885
 * deal-time binding model — a typed selector resolved when the card is dealt,
 * and **binding failure means the card is not dealt** rather than dealt broken.
 *
 * Profiles are authored per member, once, instead of per encounter, every time.
 * That is the entire cost argument of the dealt-hand design.
 */
export interface NudgeCardPlayProfile {
  /** Pre-discount essence price. Repertoire and signature discounts apply on top, as today. */
  readonly essenceCost: number;
  /** Named forecast contribution. `0` for a pure-rider or pure-grant card. */
  readonly forecastDelta: number;
  /** Band rider, for the insurance / mercy / gambit families. */
  readonly rider?: NudgeRider;
  /** Prices paid outside the essence pool — the Heavy Hand, the Veil, the Bargain. */
  readonly costs?: NudgeCostChannels;
  /** World changes, in the existing aftermath effect vocabulary (THR-885/1179). */
  readonly grants?: readonly EncounterAftermathReactionEffect[];
  /**
   * When this member is *relevant*. The dealer scores a member up when a tag
   * here matches one the step declared, which is how a Might-testing step tends
   * to be dealt cards that bear on force without any of it being hardcoded.
   *
   * Absent ⇒ the member is universally relevant and scores on sphere and
   * provenance alone — the right shape for the universal core.
   */
  readonly contextTags?: readonly DealContextTag[];
}

/**
 * Play profiles, keyed by member id exactly as {@link CARD_CONTENT} is.
 *
 * **Two reference entries only, deliberately (THR-1247 scope).** The engine
 * ticket ships the path; the corpus — a profile and fragments for every member
 * — is THR-1248, which is blocked by this and authors into this table. The two
 * chosen exercise both access paths the dealer must handle: `card.boost.core`
 * is universal core (held by every god, never sphere-gated, the floor that
 * keeps the deal pool from ever being empty), and `card.veil.signature.darkness`
 * is a sphere signature (held only by a darkness-aligned god, discounted for
 * them, and carrying an alternate cost channel rather than a large odds delta).
 *
 * A member with a profile but no {@link BAND_FRAGMENTS} row is **undealable**
 * and named by `validateRepertoire()` — see that report's `unpayableProfiles`.
 * That is the payoff-at-every-band law applied library-side: a card the god
 * plays must be traceable in the prose of how it landed.
 */
export const PLAY_PROFILES: Readonly<Record<string, NudgeCardPlayProfile>> = {
  // Universal core. Plainest possible mechanics: it costs a little and it moves
  // the odds, which is the whole of what Boost promises.
  'card.boost.core': {
    essenceCost: 2,
    forecastDelta: 0.1,
  },
  // Darkness signature. Pays in visibility rather than in odds — the Veil buys
  // cover, and cover is not the same currency as luck.
  'card.veil.signature.darkness': {
    essenceCost: 1,
    forecastDelta: 0.06,
    costs: { detectionDelta: -2 },
    contextTags: ['shadow', 'social', 'peril'],
  },
};

/**
 * Per-member band prose — what the god's influence *looked like* in each band.
 *
 * Authored once per member here rather than once per card per encounter, which
 * is the same trade the profiles make. Two rules govern every entry:
 *
 * 1. **Every member carries at least one failure-band fragment**, and a member
 *    whose profile moves the odds by `NUDGE_BIG_DELTA` or more carries both.
 *    A hand that only narrates its wins teaches the player the god's touch is free.
 * 2. **Fragments are generic and enrichment-grounded** — written to `{actor}` /
 *    `{they}` and scene-neutral nouns, describing the *influence landing or
 *    misfiring*, never the scene's furniture. The genericity test that governs
 *    a card face applies here verbatim: a fragment that only reads correctly in
 *    one encounter is a defect, because this one will be appended in forty.
 *
 * Appended through the existing `collectNudgeBandProse` path, so a dealt card's
 * payoff prose reaches the player by exactly the route an authored card's does.
 */
export const BAND_FRAGMENTS: Readonly<Record<string, Partial<Record<StepOutcome, string>>>> = {
  'card.boost.core': {
    critical_success: 'The margin was never in doubt; something had leaned on it.',
    success: 'The odds had been quietly widened, and {they} walked through the gap.',
    success_at_cost: 'The push landed, but it had to be paid for somewhere.',
    near_miss: 'The pressure was there, and it was not quite enough.',
    failure: 'Whatever leaned on the moment leaned the wrong way.',
    critical_failure: 'The help arrived, and made the fall further.',
  },
  'card.veil.signature.darkness': {
    critical_success: 'Nobody could afterwards say who had been there at all.',
    success: 'The dark held where it was asked to hold.',
    success_at_cost: 'The cover held; something else was left uncovered.',
    near_miss: 'The shadow thinned at the worst possible moment.',
    failure: 'The dark drew the eye it was meant to turn aside.',
  },
};

/** Play profile for a member id, or `undefined` for a member with none. */
export function nudgeCardPlayProfile(id: string): NudgeCardPlayProfile | undefined {
  return PLAY_PROFILES[id];
}

/** Band fragments for a member id, or `undefined` for a member with none. */
export function nudgeCardBandFragments(
  id: string,
): Partial<Record<StepOutcome, string>> | undefined {
  return BAND_FRAGMENTS[id];
}

/**
 * Count of library members carrying a play profile — the members the dealer
 * could deal if nothing else stood in the way.
 *
 * Mirrors {@link unauthoredCardCount} as a live gauge rather than a pass/fail:
 * while the corpus lands (THR-1248) this climbs toward `NUDGE_CARD_LIBRARY.length`,
 * and the test that pins it moves with the corpus. Reading it is how a caller
 * tells "the dealer had nothing to offer" from "the dealer chose nothing".
 */
export function profiledCardCount(): number {
  return NUDGE_CARD_LIBRARY.filter((m) => PLAY_PROFILES[m.id] !== undefined).length;
}

/**
 * Members that are dealable *at all*: a play profile, and at least one band
 * fragment to pay it off with.
 *
 * The dealer's candidate universe, before any repertoire or context filtering.
 * A profile with no fragments is excluded here rather than dealt with silent
 * prose — see {@link BAND_FRAGMENTS} rule 1.
 */
export function dealableMembers(): readonly NudgeCardMember[] {
  return NUDGE_CARD_LIBRARY.filter(
    (m) =>
      PLAY_PROFILES[m.id] !== undefined && Object.keys(BAND_FRAGMENTS[m.id] ?? {}).length > 0,
  );
}
