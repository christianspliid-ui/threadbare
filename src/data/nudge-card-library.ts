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
 * **This file is structure, not prose.** `title` and `quote` are optional and
 * deliberately absent: card content is authored under THR-883, which is paused
 * until the authoring format locks. A member with no title is a real, dealable,
 * fully-gated card that renders through {@link cardDisplayTitle}'s fallback —
 * so the engine, the gating, and the liveness tests all land now and the prose
 * arrives later without a schema change.
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
    status: 'design',
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
    status: 'design',
  },
  {
    id: 'whisper',
    keyword: 'Whisper',
    effectShape: "Reveals a hidden factor or the next step's demand",
    decision: 'Pay to see before you spend',
    hostSystem: 'Intelligence',
    status: 'open',
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
    status: 'design',
  },
  {
    id: 'stumble',
    keyword: 'Stumble',
    effectShape: "Physics turns against the scene's opposition",
    decision: 'Weaken them instead of strengthening yours',
    hostSystem: 'Encounter cast',
    status: 'design',
  },
  {
    id: 'kindled_ambition',
    keyword: 'Kindled ambition',
    effectShape: 'The mortal wakes wanting something lasting',
    decision: 'Give them a drive, not a bonus',
    hostSystem: 'Ambitions',
    status: 'design',
  },
  {
    id: 'omen',
    keyword: 'Omen',
    effectShape: 'Future encounter draws bend toward what this uncovered',
    decision: 'Steer the story, not the roll',
    hostSystem: 'Omens',
    status: 'design',
  },
  {
    id: 'cache',
    keyword: 'Cache',
    effectShape: 'Something is left for them to find; ships with the item built',
    decision: 'A keepsake that persists',
    hostSystem: 'Attachments & items',
    status: 'design',
  },
  {
    id: 'balm',
    keyword: 'Balm',
    effectShape: 'Removes one condition (wound, fever, dread)',
    decision: 'End a suffering directly',
    hostSystem: 'Effects & conditions',
    status: 'design',
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
    hostSystem: 'Premonition / compulsion',
    status: 'design',
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

export const NUDGE_CARD_LIBRARY: readonly NudgeCardMember[] = [
  ...UNIVERSAL_CORE_TYPES.map(coreMember),
  ...SPHERE_NAMES.flatMap((sphere) =>
    SPHERE_SIGNATURES[sphere].map((typeId) => signatureMember(sphere, typeId)),
  ),
  ...(Object.entries(HUNGER_UNIQUE_CARDS) as readonly [HungerId, string][]).map(
    ([hunger, id]) => hungerMember(hunger, id),
  ),
  ...VARIATION_MEMBERS,
];

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
 * legible*, not blank and not a crash. It reads as its own keyword until
 * THR-883 gives it a name.
 */
export function cardDisplayTitle(member: NudgeCardMember): string {
  return member.title ?? nudgeCardType(member.typeId)?.keyword ?? member.typeId;
}

/**
 * Count of members still awaiting authored content — the THR-883 backlog, as a
 * number the wiki page and any content sweep can read rather than estimate.
 */
export function unauthoredCardCount(): number {
  return NUDGE_CARD_LIBRARY.filter((m) => m.title === undefined || m.quote === undefined).length;
}
