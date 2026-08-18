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
  | { readonly kind: 'god_trait'; readonly traitId: string };

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
 * 3. **Interactive-plain titles.** The title is a label; its job is to be
 *    unmistakable. The quote is the one element allowed a dry line.
 *
 * `imageTag` is deliberately absent throughout: the image library has no card
 * rows to bind to, and minting art slots is owned elsewhere (THR-832/THR-1170).
 * Every face therefore falls back to its type's generic art, which is the
 * documented chain, not a gap.
 */
const CARD_CONTENT: Readonly<Record<string, NudgeCardContent>> = {
  // Universal core — the floor every god holds. Plainest voices in the library.
  'card.boost.core': {
    title: 'A Little More',
    quote: 'Most things fail by a margin.',
  },
  'card.insurance.core': {
    title: 'Buy The Floor',
    quote: 'Every plan should survive being wrong.',
  },
  'card.mercy.core': {
    title: 'Not The Worst',
    quote: 'Failing is survivable. Some failures are not.',
  },
  'card.trait_card.core': {
    title: 'Who They Are',
    quote: 'Character is the one resource nobody spends.',
  },

  // Sphere signatures — each reads as its sphere's mode of power.
  'card.gambit.signature.chaos': {
    title: 'No Middle Ground',
    quote: 'Chaos has no use for the adequate.',
  },
  'card.stumble.signature.chaos': {
    title: 'Something Gives Way',
    quote: 'Every structure has one loose piece.',
  },
  'card.favor.signature.order': {
    title: 'The Ledger Opens',
    quote: 'Order is only debt everyone agreed to honor.',
  },
  'card.insurance.signature.order': {
    title: 'By The Book',
    quote: 'Rules exist so the worst case has a name.',
  },
  'card.whisper.signature.light': {
    title: 'Plain Sight',
    quote: 'Nothing was hidden. It was only unlit.',
  },
  'card.veil.signature.darkness': {
    title: 'No One Saw',
    quote: 'The kindest help leaves no fingerprints.',
  },
  'card.undertow.signature.darkness': {
    title: 'The Easier Way',
    quote: 'It works. That is the problem.',
  },
  'card.heavy_hand.signature.force': {
    title: 'Full Weight',
    quote: 'Subtlety is a choice. This is not it.',
  },
  'card.cache.signature.matter': {
    title: 'Left Behind',
    quote: 'Matter keeps its promises longer than people do.',
  },
  'card.boost.signature.energy': {
    title: 'A Sudden Surge',
    quote: 'Bodies hold more than they admit.',
  },
  'card.balm.signature.life': {
    title: 'It Passes',
    quote: 'Most suffering ends. This one ends sooner.',
  },
  'card.compulsion.signature.mind': {
    title: 'An Urge In Sleep',
    quote: 'By morning it feels like their own idea.',
  },
  'card.kindled_ambition.signature.spirit': {
    title: 'Something To Want',
    quote: 'A life turns on what it reaches for.',
  },
  'card.omen.signature.time': {
    title: 'This Has Happened',
    quote: 'Nothing happens only once.',
  },
  'card.bargain.signature.entropy': {
    title: 'Pay It Elsewhere',
    quote: 'Nothing is free. Some prices are only slower.',
  },

  // Hunger uniques — each reads as its hunger's perception style.
  'card.whisper.hunger.witness': {
    title: 'Seen Plainly',
    quote: 'Every situation has an architecture. Most go unlooked at.',
  },
  'card.kindled_ambition.hunger.kindle': {
    title: 'The Ember Takes',
    quote: 'Some sparks only need the air.',
  },
  'card.long_game.hunger.sever': {
    title: 'The Thread Cut',
    quote: 'Not every tie was chosen. None are permanent.',
  },
  'card.favor.hunger.bind': {
    title: 'A Debt Written',
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
    title: 'Nothing More Lost',
    quote: 'Keeping is harder than making. Do it anyway.',
  },
  'card.balm.hunger.reclaim': {
    title: 'Made Whole Again',
    quote: 'Some wounds are only debts the body is carrying.',
  },
  'card.stumble.hunger.reshape': {
    title: 'The Right Pressure',
    quote: 'Everything holds until the moment it does not.',
  },
  'card.omen.hunger.wander': {
    title: 'Something Further On',
    quote: 'Every road is asking to be followed.',
  },
  'card.compulsion.hunger.haunt': {
    title: 'A Dream Not Theirs',
    quote: 'Everyone is haunted. Few are visited on purpose.',
  },
  'card.heavy_hand.hunger.illuminate': {
    title: 'In Full View',
    quote: 'Let them see who did this.',
  },

  // Variation members — siblings of a card the god already plays.
  'card.boost.variation.patient': {
    title: 'The Slow Push',
    quote: 'Early pressure costs less than late force.',
  },
  'card.insurance.variation.shared': {
    title: 'Carried Between Them',
    quote: 'A cost split is a cost survived.',
  },
  'card.mercy.variation.witnessed': {
    title: 'Someone Was There',
    quote: 'The worst hour is the one nobody sees.',
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
