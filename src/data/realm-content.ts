/**
 * Realm content — the words and the definition a nation is made of (THR-1155).
 *
 * A **Realm** is the game's word for a nation (alias *nation*, THR-1453). It is not a
 * new kind of thing: it is a Faction — an `actor · actorType: 'faction'` node — minted
 * per culture domain at worldgen with a *dynamic* faction definition, a seat, a culture
 * edge and a court ladder, holding its Locations through `controls`. Everything a
 * faction can do, a Realm does; the only discriminator is `factionClass: 'realm'` on
 * the node.
 *
 * Three things live here together because they are one package — the name a Realm is
 * given, the ladder a mortal climbs inside it, and the definition that makes both
 * reachable by the faction machinery:
 *
 * 1. **Naming** (`REALM_DOMAIN_NOUNS`, {@link generateRealmName}) — moved here from
 *    `regionPolitical.ts`, which still calls it for the map's domain label. One
 *    generator, so the label over the border and the Realm's own name are the same
 *    string by construction and cannot drift.
 * 2. **The court ladder** ({@link REALM_RANK_LADDER}) — *stranger · subject · yeoman ·
 *    sworn · thane · counsel*. Six slots where the guild ladders have four; the same
 *    `FactionRankTier` shape, so `factionReputation`'s rank walk and the `Respected+`
 *    gates read it unchanged. (*Freeholder* was the first draft's third rank and is
 *    rejected: *Freehold* is the UL's word for the `owns` edge — THR-1314 — and a court
 *    rank must not overload it.)
 * 3. **The definition** ({@link buildRealmDefinition}) — minted into
 *    `GameState.dynamicFactionDefinitions` at worldgen through the same door
 *    `strategic_found_order` uses (THR-1322), so `getFactionDefinition` resolves a
 *    Realm exactly as it resolves an authored guild. **Realms are never added to the
 *    static `FACTION_DEFINITIONS` catalogue** — that map is what the game *ships with*,
 *    and a Realm is what a *world* has.
 *
 * A word on *holds*: a Realm **holds** the towns its `controls` edges point at. That is
 * plain prose pending UL arbitration (THR-1453 / THR-1449) — no code identifier here
 * says `hold`, and a Realm never has *holdings*, which is the `owns` edge's noun. The
 * field is `heldLocations`.
 *
 * NFP #1: every number below is a named constant. NFP #3: `generateRealmName` is a pure
 * function of (cultureId, seed, index) and draws from no shared stream.
 */

import type { FactionDefinition, FactionRankTier } from '../types/faction';
import type { ReachDomain } from '../types/traits';
import { FACTION_REPUTATION_DECAY_PER_TICK } from './faction-constants';

// ─── The Faction kind's classes ───────────────────────────────────────────────

/**
 * What kind of faction a faction node is, stamped as `factionClass` by its minter.
 *
 * The Faction world-object kind is one node shape with several classes, exactly as the
 * Location kind is (THR-1394). `realm` is the one this file mints; the rest name the
 * minters that already exist so the discriminator is total rather than "realm and
 * everything else".
 */
export const FACTION_CLASSES = ['realm', 'guild', 'order', 'cult', 'monster', 'founded'] as const;

export type FactionClass = typeof FACTION_CLASSES[number];

/** `factionDefId` shape for a minted Realm — `realm.<cultureId>`. */
export const REALM_DEFINITION_ID_PREFIX = 'realm.';

/** The `factionClass` a Realm's node carries. */
export const REALM_FACTION_CLASS: FactionClass = 'realm';

// ─── The political map's reach (THR-1155 § Engine C) ──────────────────────────

/**
 * How many hexes from a town it holds a Realm's border reaches.
 *
 * Beyond it the hex is **unclaimed** and draws no border — wilderness is real, and a
 * nation is as large as the ground its towns can hold rather than as large as the
 * culture region it was drawn inside. Lowering this is how a designer makes the map
 * emptier; raising it makes neighbours touch. The kill criterion is interleaving: if
 * two Realms' borders read as noise, this halves before any smoothing is invented
 * (smoothing is a new design, not a tuning).
 */
export const REALM_FILL_RADIUS = 3;

/**
 * Which Realm takes a hex equidistant from two Realms' held towns.
 *
 * `'more_held_locations'` — the Realm holding more Locations absorbs the contested
 * march, and an exact tie there goes to the lower faction id. Recorded as a constant
 * because it is a game decision (the larger nation wins the borderland) rather than an
 * implementation detail, and because a future `'fewer_held_locations'` is a legible
 * knob for a world where small nations cling harder.
 */
export const REALM_TIEBREAK = 'more_held_locations' as const;

// ─── Conquest (THR-1155 § Engine E) ───────────────────────────────────────────

/**
 * The siege-victory severity at which the victor's faction **takes** the town.
 *
 * `'total'` is today's vacuum threshold, so this constant changes nothing on the way
 * in: the same sack that used to empty a town now hands it over. A designer who wants
 * a lesser victory to move the border sets `'major'` here and the border starts moving
 * at roughly three times the rate — which is the whole knob, because conquest is the
 * only runtime producer of a faction's `controls` edge.
 */
export const REALM_CONQUEST_SEVERITY = 'total' as const;

// ─── The words the player reads (THR-1155 § UI) ───────────────────────────────

/**
 * The headword. Never *kingdom*, *domain* or *province* on a player surface except
 * inside a Realm's own name (THR-1453, *nation* as the alias).
 *
 * It exists as a constant because the faction sheet would otherwise render a Realm's
 * `factionType` — the stored value `'political'` — title-cased into the type chip, and
 * a raw enum key on a player surface is the Law 14 failure this ticket is full of
 * examples of.
 */
export const REALM_HEADWORD = 'Realm';

/** The label over the *held by* line on a place's surfaces. */
export const REALM_HELD_BY_LABEL = 'Held by';

/**
 * What a place with no faction holder reads as.
 *
 * A word, not a blank and not an em-dash: ground no nation holds is a **fact about the
 * world** — the border on the map stops there for a reason — and a designed state gets
 * a designed line (Law 4). It is the same word the projection's `unclaimedHexes` counts.
 */
export const REALM_UNCLAIMED_COPY = 'Unclaimed';

/** The seat marker beside a holder's name when this town is where its court sits. */
export const REALM_SEAT_COPY = 'seat of the court';

/**
 * Prominence of the *takes* / *loses* line in the event feed.
 *
 * Above the unthreaded army notifications (0.3) and below a battle's own resolution —
 * a border moving is worth reading about even when no threaded mortal stood in it,
 * because the map itself changes shape. There is deliberately no toast: the map moving
 * *is* the notification (§ UI).
 */
export const REALM_TERRITORY_EVENT_SIGNIFICANCE = 0.7;

// ─── Naming ───────────────────────────────────────────────────────────────────

/**
 * The nouns a Realm's name is built from — *the hold of Witness Skyfield*, *the march
 * of Shadow-Kept Light*. Moved verbatim from `regionPolitical.ts` (THR-1155) so the
 * Realm and the map's domain label are named by one generator.
 */
export const REALM_DOMAIN_NOUNS = [
  'realm', 'dominion', 'throne', 'crown', 'lands', 'hold', 'empire', 'domain',
  'sovereignty', 'principality', 'duchy', 'march', 'kingdom',
];

/**
 * mulberry32 PRNG — fast, deterministic, 32-bit output.
 * NFP #3: same seed always produces the same sequence. Local to naming: a Realm's name
 * is drawn from its own stream, never from worldgen's, so adding a Realm cannot shift
 * anything downstream of it.
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Derive a short label form from a full culture name.
 * Strips leading articles/phrases and truncates at " of the ".
 * Examples:
 *   "The Wild Storm of the Deepwood"      → "Wild Storm"
 *   "Children of the Shadow-Kept Mires"   → "Shadow-Kept Mires"
 *   "The Blade Heights"                    → "Blade Heights"
 *   "Stone-Set Iron"                       → "Stone-Set Iron"
 */
export function toRealmShortName(cultureName: string): string {
  let s = cultureName;
  for (const prefix of ['Children of the ', 'Keepers of the ', 'The ']) {
    if (s.startsWith(prefix)) { s = s.slice(prefix.length); break; }
  }
  const ofTheIdx = s.indexOf(' of the ');
  if (ofTheIdx > 0) s = s.slice(0, ofTheIdx);
  return s;
}

/**
 * The name of the Realm a culture's domain becomes — and, because
 * `regionPolitical.ts` calls this same function, the text of the domain label the map
 * draws over it.
 *
 * @param idx  the domain's index in worldgen's culture grouping — part of the stream so
 *             two cultures whose ids share a first character do not collide.
 */
export function generateRealmName(
  cultureId: string,
  seed: number,
  idx: number,
  cultureName?: string,
): string {
  const rng = mulberry32(seed + idx * 3331 + cultureId.charCodeAt(0) * 17);
  const noun = pickRandom(REALM_DOMAIN_NOUNS, rng);
  if (cultureName) {
    const short = toRealmShortName(cultureName);
    return `${noun} of ${short}`;
  }
  // Fallback when no culture name is available
  const prefix = cultureId.length > 4
    ? cultureId.slice(0, 1).toUpperCase() + cultureId.slice(1, 4)
    : cultureId.slice(0, 1).toUpperCase() + cultureId.slice(1);
  return `${prefix} ${noun}`;
}

// ─── The court ladder ─────────────────────────────────────────────────────────

/**
 * The court's words for a mortal's standing with a Realm, lowest first.
 *
 * Same slot shape as the guild ladders, so `factionReputation`'s rank walk and every
 * `Respected+` gate read them unchanged; six words rather than four because a court has
 * further to climb than a guild hall. No word here is a UL headword for another thing.
 */
export const REALM_RANK_LADDER = ['stranger', 'subject', 'yeoman', 'sworn', 'thane', 'counsel'] as const;

/** Display names for {@link REALM_RANK_LADDER}, same order. */
const REALM_RANK_NAMES: Record<typeof REALM_RANK_LADDER[number], string> = {
  stranger: 'Stranger',
  subject: 'Subject',
  yeoman: 'Yeoman',
  sworn: 'Sworn',
  thane: 'Thane',
  counsel: 'Counsel',
};

/** Reputation a mortal needs to hold each rank (0–1), same order as the ladder. */
const REALM_RANK_THRESHOLDS: Record<typeof REALM_RANK_LADDER[number], number> = {
  stranger: 0.0,
  subject: 0.15,
  yeoman: 0.3,
  sworn: 0.45,
  thane: 0.65,
  counsel: 0.85,
};

/** How many may hold each rank at once — `null` is unlimited; a court seats one Counsel. */
const REALM_RANK_SLOTS: Record<typeof REALM_RANK_LADDER[number], number | null> = {
  stranger: null,
  subject: null,
  yeoman: null,
  sworn: null,
  thane: null,
  counsel: 1,
};

/** Encounter-template prefixes each rank unlocks, cumulative up the ladder. */
const REALM_RANK_ACCESS: Record<typeof REALM_RANK_LADDER[number], string[]> = {
  stranger: [],
  subject: ['realm.quest.'],
  yeoman: ['realm.quest.'],
  sworn: ['realm.quest.', 'realm.senior.'],
  thane: ['realm.quest.', 'realm.senior.', 'realm.elite.'],
  counsel: ['realm.quest.', 'realm.senior.', 'realm.elite.', 'realm.leadership.'],
};

/** Reward multiplier granted at each rank that grants one at all. */
const REALM_RANK_REWARD_MULTIPLIER: Partial<Record<typeof REALM_RANK_LADDER[number], number>> = {
  sworn: 1.15,
  thane: 1.3,
  counsel: 1.5,
};

/** Standing bonus a rank lends when a mortal walks into a room of the Realm's own. */
const REALM_RANK_WALK_BONUS: Partial<Record<typeof REALM_RANK_LADDER[number], number>> = {
  yeoman: 0.05,
  sworn: 0.1,
  thane: 0.2,
  counsel: 0.25,
};

function buildRealmRankTiers(): FactionRankTier[] {
  return REALM_RANK_LADDER.map(rank => {
    const rewardMultiplier = REALM_RANK_REWARD_MULTIPLIER[rank];
    const walkBonus = REALM_RANK_WALK_BONUS[rank];
    return {
      id: rank,
      name: REALM_RANK_NAMES[rank],
      minReputation: REALM_RANK_THRESHOLDS[rank],
      maxSlots: REALM_RANK_SLOTS[rank],
      bonuses: [
        ...(rewardMultiplier !== undefined
          ? [{
              type: 'encounter_reward_multiplier' as const,
              value: rewardMultiplier,
              description: `+${Math.round((rewardMultiplier - 1) * 100)}% reward from the Realm's own work`,
            }]
          : []),
        ...(walkBonus !== undefined
          ? [{
              type: 'reputation_walk_bonus' as const,
              value: walkBonus,
              description: `+${walkBonus.toFixed(2)} standing where the Realm's word carries`,
            }]
          : []),
      ],
      encounterAccess: [...REALM_RANK_ACCESS[rank]],
    };
  });
}

// ─── The definition ───────────────────────────────────────────────────────────

/**
 * What a Realm wants. Territorial expansion leads because a Realm is the one faction
 * whose reach on the map is the towns it holds; the rest keep a court busy between
 * wars. Tunable (NFP #1) — a designer who wants quieter Realms lowers the first number.
 */
export const REALM_AMBITION_WEIGHTS = {
  territorial_expansion: 0.35,
  defensive_consolidation: 0.25,
  resource_acquisition: 0.2,
  cultural_dominance: 0.15,
  revenge: 0.05,
} as const;

/** Reputation with a Realm decays slower than with a guild — a court has a long memory. */
export const REALM_REPUTATION_DECAY_MULTIPLIER = 0.6;

/** Settlement kinds a Realm's court can sit in. */
export const REALM_SEAT_LOCATION_TYPES = ['capital', 'city', 'town', 'castle', 'fort'] as const;

/** The `factionDefId` for the Realm of a culture. */
export function realmDefinitionId(cultureId: string): string {
  return `${REALM_DEFINITION_ID_PREFIX}${cultureId}`;
}

export interface RealmDefinitionInput {
  /** The culture whose domain this Realm is. */
  cultureId: string;
  /** The Realm's name — the same string the map's domain label carries. */
  name: string;
  /** The culture's reach profile; the Realm inherits what its people are good at. */
  reachPreferences?: Partial<Record<ReachDomain, number>>;
}

/**
 * Mint the faction definition for one Realm.
 *
 * Written into `GameState.dynamicFactionDefinitions` at worldgen, so every consumer
 * that resolves through `getFactionDefinition` — ambitions, quests, the rank ladder,
 * the encounter gates, the faction sheet — sees a Realm as a first-class faction. NFP
 * #3: pure; the same input yields the same definition.
 */
export function buildRealmDefinition(input: RealmDefinitionInput): FactionDefinition {
  const { cultureId, name, reachPreferences } = input;
  return {
    id: realmDefinitionId(cultureId),
    nameTemplate: name,
    description: `The court and crown of ${name}, holding the towns of its people and answering for the ground between them.`,
    motto: 'What we hold, we answer for.',
    iconGlyph: '👑',
    themeColor: '#B8860B',
    factionType: 'political',
    reachWeights: reachPreferences ?? {
      iron: 0.6, gold: 0.5, heart: 0.5, stone: 0.4,
      eye: 0.3, shadow: 0.2, veil: 0.2, star: 0.2,
    },
    locationTypes: [...REALM_SEAT_LOCATION_TYPES],
    rankTiers: buildRealmRankTiers(),
    reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK * REALM_REPUTATION_DECAY_MULTIPLIER,
    joinEncounterTemplateId: 'realm.join',
    promotionEncounterTemplateId: 'realm.promotion',
    // No authored realm encounters yet — the content is THR-1454's, and the gates above
    // read the prefixes the moment templates carrying them exist.
    questTemplateIds: [],
    socialTemplateIds: [],
    expulsionConsequences: [{ type: 'remove_encounters', params: {} }],
    ambitionWeights: { ...REALM_AMBITION_WEIGHTS },
  };
}
