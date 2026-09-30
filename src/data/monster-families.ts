/**
 * Monster families — the eight fighting cards a lair's elite can be minted with
 * (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Content).
 *
 * A monster is a class of Mortal, not a new node type: `createNamedElite` writes a
 * `monsterState` bag and a temper trait edge, both read from the family row picked
 * by the lair's `dominantSphere`. A foundation-sphere lair has no monster faction and
 * no family of its own, so it falls back to `MONSTER_FAMILY_FALLBACK` (the Force
 * family) and the mint traces `fellBack: true`.
 *
 * The mechanics columns are fixed by THR-1268. The card lines are GAME register —
 * one plain line each, read on the lair card and by `{target:family}` (M2).
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                          | Default                   | Purpose                                              |
 * |-------------------------------|---------------------------|------------------------------------------------------|
 * | MONSTER_CLOCK_BY_TIER         | { major: 4, legendary: 5 } | clock size at mint, and after legendary hardening   |
 * | MONSTER_LEGENDARY_DREAD_STEP  | 1                         | words Dread rises at legendary (capped at severe)    |
 * | MONSTER_FAMILY_FALLBACK       | 'beast'                   | family for a foundation-sphere (or sphere-less) lair |
 * | MONSTER_FELLED_CLEARING_PRESSURE | 0.5                    | × legendary resistance added when a legendary lair's monster falls (THR-1546) |
 * | MONSTER_DRIVEN_OFF_CLEARING_PROGRESS | 1                  | clearing progress from driving the monster off (THR-1546) |
 */

import type { FightTemper, FightRatingWord } from '../types/fight';
import type { MonsterApexId, MonsterFamilyId } from '../types/monster';
import type { ReachDomain } from '../types/traits';
import type { CreationSphereName } from '../types/index';

/** One family row. */
export interface MonsterFamily {
  readonly id: MonsterFamilyId;
  readonly sphere: CreationSphereName;
  /** The card line — what the creature is, in one plain line. */
  readonly cardLine: string;
  readonly nerveReach: ReachDomain;
  readonly clashReach: ReachDomain;
  readonly dread: FightRatingWord;
  readonly might: FightRatingWord;
  readonly temper: FightTemper;
}

/** Clock size by lair tier (THR-1531 numbers; legendary is THR-1268's +1 over major). */
export const MONSTER_CLOCK_BY_TIER: Readonly<{ major: number; legendary: number }> = {
  major: 4,
  legendary: 5,
};

/** How many words Dread rises when the lair goes legendary. Capped at `severe`. */
export const MONSTER_LEGENDARY_DREAD_STEP = 1;

/** The family a lair without a creation sphere mints. */
export const MONSTER_FAMILY_FALLBACK: MonsterFamilyId = 'beast';

/**
 * Felling a **legendary** lair's monster adds this fraction of
 * `LAIR_CLEARING_RESISTANCE.legendary` to the lair's `clearingProgress` (THR-1546).
 * The den does not fall with its beast: its monster faction remains (THR-767's raider
 * question). Kill criterion: if a lone fight plus one presence pass clears a legendary
 * lair, halve this.
 */
export const MONSTER_FELLED_CLEARING_PRESSURE = 0.5;

/** Clearing progress a fighter earns by driving a lair's monster off (THR-1546). */
export const MONSTER_DRIVEN_OFF_CLEARING_PROGRESS = 1;

/** The eight families, keyed by id. */
export const MONSTER_FAMILIES: Readonly<Record<MonsterFamilyId, MonsterFamily>> = {
  beast: {
    id: 'beast', sphere: 'force', cardLine: 'a beast of claw and hunger',
    nerveReach: 'heart', clashReach: 'iron', dread: 'fair', might: 'steep', temper: 'berserk',
  },
  golem: {
    id: 'golem', sphere: 'matter', cardLine: 'a thing of stone that does not tire',
    nerveReach: 'heart', clashReach: 'stone', dread: 'fair', might: 'steep', temper: 'stubborn',
  },
  stormkin: {
    id: 'stormkin', sphere: 'energy', cardLine: 'a crackling storm-creature that strikes like lightning',
    nerveReach: 'heart', clashReach: 'star', dread: 'steep', might: 'fair', temper: 'skittish',
  },
  behemoth: {
    id: 'behemoth', sphere: 'life', cardLine: 'a great beast grown far too large',
    nerveReach: 'heart', clashReach: 'iron', dread: 'fair', might: 'steep', temper: 'stubborn',
  },
  mindthing: {
    id: 'mindthing', sphere: 'mind', cardLine: 'a creature that reaches into your thoughts',
    nerveReach: 'veil', clashReach: 'eye', dread: 'steep', might: 'fair', temper: 'bargainer',
  },
  wraith: {
    id: 'wraith', sphere: 'spirit', cardLine: 'a restless dead thing that drains the living',
    nerveReach: 'veil', clashReach: 'veil', dread: 'severe', might: 'gentle', temper: 'skittish',
  },
  echo: {
    id: 'echo', sphere: 'time', cardLine: 'a creature caught in a moment that keeps repeating',
    nerveReach: 'star', clashReach: 'eye', dread: 'steep', might: 'fair', temper: 'bargainer',
  },
  blight: {
    id: 'blight', sphere: 'entropy', cardLine: 'a walking rot that spreads where it goes',
    nerveReach: 'stone', clashReach: 'iron', dread: 'steep', might: 'fair', temper: 'berserk',
  },
};

/**
 * One apex card — an elite of an existing family that has grown into something only
 * an expert should face (THR-1682, plan doc `Docs/plans/2026-09-29-thr-1627-content-above-novice.md`
 * § D3). Rated `severe` Dread and `severe` Might, so it demands
 * `FIGHT_RATING_DIFFICULTY.severe` (0.65) — window fit 0.79, the expert band.
 */
export interface MonsterApexCard {
  readonly id: MonsterApexId;
  readonly family: MonsterFamilyId;
  /** The apex's own card line — GAME register, one plain line. */
  readonly cardLine: string;
  readonly dread: FightRatingWord;
  readonly might: FightRatingWord;
}

/**
 * The apex cards, keyed by the family they grow from. A family with a row here does
 * not take the one-word Dread step when its lair goes legendary: its elite becomes
 * the apex instead (`hardenMonsterCard`). Families without a row harden as before.
 *
 * Two families, chosen because a stone thing and an overgrown beast are the two whose
 * fiction reads most plainly as "older and bigger", and whose clash reaches (stone,
 * iron) are the ones an expert fighter trains. Masters are out of scope (§ D5):
 * `severe` is the top word, so no card reaches a master's window.
 */
export const MONSTER_APEX_CARDS: Readonly<Partial<Record<MonsterFamilyId, MonsterApexCard>>> = {
  golem: {
    id: 'golem.colossus', family: 'golem',
    cardLine: 'a stone colossus older than the hills it walks',
    dread: 'severe', might: 'severe',
  },
  behemoth: {
    id: 'behemoth.ancient', family: 'behemoth',
    cardLine: 'an ancient behemoth the land has fed for a hundred years',
    dread: 'severe', might: 'severe',
  },
};

/** Every apex card, in table order. */
export const MONSTER_APEX_CARD_LIST: readonly MonsterApexCard[] =
  Object.values(MONSTER_APEX_CARDS).filter((c): c is MonsterApexCard => c !== undefined);

/**
 * The card line a monster shows: its apex's line when it has grown into one, else its
 * family's. Fail-soft: an unknown apex or family reads the family line, then undefined.
 */
export function monsterCardLine(state: { family?: unknown; apex?: unknown } | undefined): string | undefined {
  if (!state) return undefined;
  const apex = MONSTER_APEX_CARD_LIST.find(c => c.id === state.apex);
  if (apex) return apex.cardLine;
  return typeof state.family === 'string'
    ? MONSTER_FAMILIES[state.family as MonsterFamilyId]?.cardLine
    : undefined;
}

/** Every family id, in table order. */
export const MONSTER_FAMILY_IDS: readonly MonsterFamilyId[] = Object.keys(MONSTER_FAMILIES) as MonsterFamilyId[];

/**
 * The family a lair of this sphere mints, and whether it fell back. Deterministic:
 * a creation sphere names its family; anything else (a foundation sphere, a missing
 * or malformed value) is the fallback.
 */
export function monsterFamilyForSphere(sphere: unknown): { family: MonsterFamily; fellBack: boolean } {
  if (typeof sphere === 'string') {
    for (const id of MONSTER_FAMILY_IDS) {
      const family = MONSTER_FAMILIES[id];
      if (family.sphere === sphere) return { family, fellBack: false };
    }
  }
  return { family: MONSTER_FAMILIES[MONSTER_FAMILY_FALLBACK], fellBack: true };
}
