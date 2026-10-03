/**
 * The seeded spell generator — its authored tables and tunables (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Content pillar,
 * § Resolution logic and § Constants table. Ported from the THR-1232 prototype
 * (`proto/thr-1572-spell-generator`, `Docs/audits/2026-09-24-proto-spells/generator.mjs`)
 * and extended with the eight envelope rules the prototype's failures named.
 *
 * Every number here is a lever (NFP #1). The generator (`engine/spellGenerator/`) reads
 * these tables and nothing else; changing how magic feels is a change to this file.
 */

import type { EffectCondition, SpellArena } from '../types/effects';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type {
  SphereEnvelope, SpellGenTier, SpellPriceLayer, SpellTheme, TraditionRow,
} from '../engine/spellGenerator/types';

// ═══════════════════════════════════════════════════════════════════
// Master switch and library shape
// ═══════════════════════════════════════════════════════════════════

/** Master switch. `false` restores THR-1571's seeding exactly (sphere shelf, then the cantrip). */
export const SPELL_GEN_ENABLED = true;

/** Spells per tier in each tradition's library. */
export const SPELL_LIBRARY_SHAPE: Readonly<Record<SpellGenTier, number>> = { 1: 2, 2: 2, 3: 1, 4: 1 };

/** Ruling 1: most magic is woven, a marked few are cast. The share of a tier's slots that are deliberate. */
export const SPELL_GEN_DELIBERATE_SHARE_BY_TIER: Readonly<Record<SpellGenTier, number>> = { 1: 0, 2: 0.33, 3: 0.5, 4: 1 };

/** Arena draw weights (the prototype's `ARENA_MIX`), restricted per tradition by `THEME_ARENAS`. */
export const SPELL_GEN_ARENA_MIX: Readonly<Record<SpellArena, number>> = {
  encounter: 0.62, fight: 0.12, map_travel: 0.08, map_sight: 0.08, map_mark: 0.10,
};

/** The arenas a step can use — every library holds at least one spell in one of these. */
export const SPELL_GEN_STEP_ARENAS: readonly SpellArena[] = ['encounter', 'fight'];

/** Tradition choice: a role's own traditions, with a thin tail of others. */
export const SPELL_GEN_ROLE_FIT_WEIGHT = 1.0;
export const SPELL_GEN_OFF_ROLE_WEIGHT = 0.05;

/** Strength of the faction's reach lean on tradition choice. */
export const SPELL_GEN_FACTION_LEAN = 1.0;

/** How often a tradition draws a Foundation sphere it is shelved under. */
export const SPELL_GEN_FOUNDATION_SHELF_WEIGHT = 0.3;

/** Elder magic stays rare: Foundation-sphere spells only at tier 3–4, never seeded at tick 0. */
export const SPELL_GEN_FOUNDATION_MIN_TIER = 3;

/** A core's weight × this per earlier spell built on the same core in this world. */
export const SPELL_GEN_CORE_REPEAT_DECAY = 0.15;

/** Validator rerolls before a slot is left empty. */
export const SPELL_GEN_MAX_REROLLS = 3;

/** THR-1232: free composition holds one block deep. */
export const SPELL_GEN_MAX_RIDERS = 1;

/** The chance a slot takes its one optional rider, by tier index. */
export const SPELL_GEN_RIDER_CHANCE_BY_TIER: Readonly<Record<SpellGenTier, number>> = { 1: 0, 2: 0.35, 3: 0.5, 4: 0.5 };

/** Lane decision 4: no generated spell carries `doom_rate_multiplier`. Raising it is a data change behind its own read-back. */
export const SPELL_GEN_DOOM_RATE_CAP = 0;

/** Population envelope: at most this share of a library's fate-woven spells may be transgressions. */
export const SPELL_GEN_CARRIED_TRANSGRESSION_MAX_SHARE = 0.15;

/** Seeded carriers' summed per-tick quintessence drain, as a share of their summed `QUINTESSENCE_PASSIVE_REGEN`. */
export const SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET = 0.25;

/** Census bar: no single spell held by more than this share of a world's casters. */
export const SPELL_GEN_MAX_HOLDER_SHARE = 0.2;

/** How strongly a transgression is noticed, by tier. */
export const SPELL_NOTICE_SEVERITY_BY_TIER: Readonly<Record<SpellGenTier, number>> = { 1: 0.2, 2: 0.35, 3: 0.5, 4: 0.7 };

/** One notice mark per caster per spell. */
export const SPELL_NOTICE_ONE_PER_SPELL = true;

/** Gate-test seeds. */
export const SPELL_GEN_GATE_SEEDS: readonly number[] = [7, 42, 99];

// ═══════════════════════════════════════════════════════════════════
// Tier envelopes (the prototype's `TIERS`)
// ═══════════════════════════════════════════════════════════════════

export interface SpellTierEnvelope {
  /** Bonus magnitude window. Inside `EFFECT_PER_ITEM_CAP`. */
  readonly mag: readonly [number, number];
  /** Cast cooldown window, in ticks. */
  readonly cooldown: readonly [number, number];
}

/** Bonus, duration and cooldown envelopes per tier. */
export const SPELL_GEN_MAGNITUDE_BY_TIER: Readonly<Record<SpellGenTier, SpellTierEnvelope>> = {
  1: { mag: [0.04, 0.06], cooldown: [6, 12] },
  2: { mag: [0.06, 0.09], cooldown: [12, 36] },
  3: { mag: [0.09, 0.12], cooldown: [36, 72] },
  4: { mag: [0.12, 0.15], cooldown: [72, 160] },
};

/** Soft tier multipliers on the price draw. Widened, never overriding the lean (rule 2). */
export const TIER_PRICE_WINDOW: Readonly<Record<SpellGenTier, Partial<Record<SpellPriceLayer, number>>>> = {
  1: { free: 0.75, strain: 0.25 },
  2: { free: 0.15, strain: 0.5, gamble: 0.35 },
  3: { strain: 0.35, gamble: 0.35, transgression: 0.3 },
  4: { gamble: 0.35, transgression: 0.65 },
};

// ═══════════════════════════════════════════════════════════════════
// Price shapes — what each layer charges, per agency (rule 3)
// ═══════════════════════════════════════════════════════════════════

/** Four-entry envelopes are indexed by tier (tier 1 first). */
type ByTier<T> = readonly [T, T, T, T];

/** Every number a generated spell's price is built from (NFP #1). */
export const SPELL_GEN_PRICE = {
  // ── Deliberate (paid when cast) ──
  /** Strain: which cost a strain cast charges. */
  castStrainKindWeights: { exhaust: 0.4, exhausted: 0.35, drain: 0.25 },
  /** Strain: ticks a `tick_exhaust` cost locks the caster out. */
  castStrainExhaustTicks: [6, 6, 12, 24] as ByTier<number>,
  /** Strain: a `reach_drain` amount, as a share of the tier magnitude. */
  castStrainDrainShare: 0.5,
  /** Strain: backlash on failure, chance = base + spread × roll. */
  castStrainBacklashBase: 0.25,
  castStrainBacklashSpread: 0.1,
  /** Gamble: backlash on any band but a triumph, chance = by-tier base + spread × roll. */
  castGambleBacklashBase: [0.2, 0.2, 0.28, 0.35] as ByTier<number>,
  castGambleBacklashSpread: 0.05,
  /** Transgression: the soul price (`doom_increase`, lands on quintessence). */
  castTransgressionSoulPrice: [8, 10, 15, 25] as ByTier<number>,
  /** Transgression: backlash on disaster, chance = base + spread × roll. */
  castTransgressionBacklashBase: 0.6,
  castTransgressionBacklashSpread: 0.2,
  // ── Fate-woven (paid by carrying) ──
  /** Strain: a standing weakness, or a toll on success. */
  carriedStrainKindWeights: { weigh: 0.6, weary: 0.4 },
  /** Strain/gamble: the standing weakness, as a share of the tier magnitude. */
  carriedWeighShare: 0.6,
  /** Strain: the toll on success — chance, cooldown and how long the bearer stays Exhausted. */
  carriedWearyChance: 0.25,
  carriedWearyCooldownTicks: 24,
  carriedWearyTicks: 12,
  /** Strain: the turn on disaster — chance and how long. */
  carriedStrainTurnChance: 0.25,
  carriedStrainTurnTicks: 12,
  /** Gamble: the turn on any failure — chance by tier, and how long. */
  carriedGambleTurnChance: [0.3, 0.3, 0.4, 0.5] as ByTier<number>,
  carriedGambleTurnTicks: 36,
  /** Transgression: quintessence drained per tick, per tier step (tier 1 = 1×). Measured against `SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET`. */
  carriedSoulDrainPerTierPerTick: 0.0005,
  /** Transgression: "it changes them" — drift per tick toward the tradition's vice, and where it stops. */
  carriedViceDriftPerTick: -0.002,
  carriedViceDriftLimit: -0.5,
} as const;

// ═══════════════════════════════════════════════════════════════════
// Themes: price lean, Reach, vice, arenas
// ═══════════════════════════════════════════════════════════════════

/**
 * Rule 2 — the price lean a tradition's primary theme sets ("cost is characterization").
 * A 0 is a hard ban that no tier window overrides: holy and heal never transgress; curse
 * and death are never free.
 */
export const THEME_PRICE_LEAN: Readonly<Record<SpellTheme, Readonly<Record<SpellPriceLayer, number>>>> = {
  holy:    { free: 1.6, strain: 1.3, gamble: 0.5, transgression: 0 },
  heal:    { free: 1.6, strain: 1.3, gamble: 0.5, transgression: 0 },
  ward:    { free: 1.3, strain: 1.4, gamble: 0.6, transgression: 0.4 },
  craft:   { free: 1.0, strain: 1.4, gamble: 0.8, transgression: 0.5 },
  war:     { free: 0.8, strain: 1.4, gamble: 1.1, transgression: 0.8 },
  travel:  { free: 1.2, strain: 1.2, gamble: 1.1, transgression: 0.5 },
  sight:   { free: 1.2, strain: 1.1, gamble: 1.3, transgression: 0.6 },
  mind:    { free: 1.0, strain: 1.0, gamble: 1.4, transgression: 1.0 },
  time:    { free: 0.8, strain: 1.2, gamble: 1.5, transgression: 1.0 },
  wild:    { free: 1.2, strain: 1.2, gamble: 1.4, transgression: 0.5 },
  luck:    { free: 0.8, strain: 0.6, gamble: 2.5, transgression: 0.8 },
  conceal: { free: 1.0, strain: 1.0, gamble: 1.5, transgression: 0.8 },
  fear:    { free: 0.5, strain: 0.8, gamble: 1.2, transgression: 1.8 },
  curse:   { free: 0, strain: 0.8, gamble: 1.2, transgression: 2.2 },
  death:   { free: 0, strain: 0.7, gamble: 1.0, transgression: 2.5 },
};

/** The Reach a theme leans on — blended into the sphere's Reach pulls, and the faction lean's dot product. */
export const THEME_REACH: Readonly<Record<SpellTheme, ReachDomain>> = {
  war: 'iron', travel: 'star', sight: 'eye', mind: 'gold', heal: 'heart', holy: 'heart', death: 'veil', curse: 'shadow',
  luck: 'star', wild: 'star', craft: 'stone', ward: 'stone', time: 'eye', fear: 'shadow', conceal: 'shadow',
};

/**
 * Rule 7 — "it changes them" reads the tradition's primary theme, never the effect's Reach.
 * The value is the Reach whose axis the bearer drifts along, toward its vice pole
 * (`axisRegistry.ts`: iron Power-Hungry, gold Greedy, shadow Scheming, veil Impatient,
 * heart Disloyal, eye Judgemental, stone Reckless, star Misleading).
 */
export const THEME_VICE: Readonly<Record<SpellTheme, ReachDomain>> = {
  death: 'iron', fear: 'iron', war: 'iron', curse: 'shadow', mind: 'shadow', conceal: 'shadow',
  luck: 'gold', craft: 'gold', time: 'veil', travel: 'star', sight: 'eye', ward: 'eye', holy: 'eye',
  heal: 'heart', wild: 'stone',
};

/** The arenas a theme reaches. A tradition's slots draw only from the union of its themes' arenas. */
export const THEME_ARENAS: Readonly<Record<SpellTheme, readonly SpellArena[]>> = {
  war: ['encounter', 'fight'], travel: ['encounter', 'map_travel'], sight: ['encounter', 'map_sight'],
  ward: ['encounter', 'fight', 'map_mark'], conceal: ['encounter', 'map_mark'], craft: ['encounter', 'map_mark'],
  holy: ['encounter', 'fight', 'map_mark'], heal: ['encounter'], mind: ['encounter'], death: ['encounter', 'fight'],
  curse: ['encounter', 'fight'], luck: ['encounter'], wild: ['encounter', 'map_travel', 'map_sight'],
  time: ['encounter', 'map_sight'], fear: ['encounter', 'fight'],
};

/** Strain pairing — the Reach a carried strain spell weighs on. */
export const STRAIN_PAIR: Readonly<Record<ReachDomain, ReachDomain>> = {
  iron: 'heart', gold: 'veil', shadow: 'heart', veil: 'iron', heart: 'shadow', eye: 'heart', stone: 'star', star: 'stone',
};

// ═══════════════════════════════════════════════════════════════════
// Role themes (Lane decision 1)
// ═══════════════════════════════════════════════════════════════════

/** The themes each caster role practises. A tradition with none of them keeps `SPELL_GEN_OFF_ROLE_WEIGHT`. */
export const ROLE_THEMES: Readonly<Record<string, readonly SpellTheme[]>> = {
  priest: ['holy', 'heal', 'ward'],
  oracle: ['sight', 'time', 'luck'],
  acolyte: ['holy', 'ward'],
  monk: ['holy', 'mind', 'ward'],
  chaplain: ['holy', 'war'],
  enchanter: ['craft', 'mind', 'ward'],
  warmage: ['war'],
  alchemist: ['craft', 'curse'],
  scholar: ['sight', 'craft', 'time'],
  healer: ['heal', 'wild'],
  herald: ['travel', 'mind'],
};

// ═══════════════════════════════════════════════════════════════════
// Traditions (rules 1, 5, 6) — one row per world-model tradition
// ═══════════════════════════════════════════════════════════════════

const N_DARK = ['holy_order', 'investigation', 'forbidden_knowledge'];
const N_ARCANE = ['investigation', 'arcane'];
const N_MIND = ['investigation', 'spy', 'arcane'];

/**
 * The 34 tradition rows, ported from the prototype's `TRADITION_ENV` and extended with
 * notice families. `noticeFamilies` name reveal families (`reveal-family-aliases.ts`) that
 * match live encounter templates; the validator refuses a family nothing reveals.
 */
export const TRADITION_ENV: Readonly<Record<string, TraditionRow>> = {
  'magic.fire': { themes: ['war', 'curse'], cond: 'in_combat', nouns: ['Ember', 'Cinder', 'Kiln', 'Brand'], mass: ['Ash', 'Smoke'], blow: 'a burst of flame', noticeFamilies: N_ARCANE },
  'magic.ice': { themes: ['war', 'ward', 'time'], cond: 'near_water', nouns: ['Icicle', 'Floe'], mass: ['Rime', 'Frost', 'Hoarfrost'], blow: 'a shard of ice', noticeFamilies: N_ARCANE },
  'magic.earth': { themes: ['ward', 'war', 'craft'], cond: 'at_home_territory', nouns: ['Cairn', 'Boulder'], mass: ['Clay', 'Flint', 'Loam'], blow: 'a flung stone', ward: 'raises stones across', noticeFamilies: N_ARCANE },
  'magic.air': { themes: ['travel', 'war'], cond: 'in_wilderness', nouns: ['Gust', 'Gale', 'Draught'], mass: ['Breath'], blow: 'a blast of wind', road: 'on the wind', noticeFamilies: N_ARCANE },
  'magic.water': { themes: ['travel', 'heal', 'war'], cond: 'near_water', nouns: ['Tide', 'Well', 'Current'], mass: ['Brine'], blow: 'a crushing wave', road: 'as fast as a river runs', noticeFamilies: N_ARCANE },
  'magic.lightning': { themes: ['war', 'travel'], cond: 'in_combat', nouns: ['Bolt', 'Spark', 'Fork'], mass: ['Thunder'], blow: 'a bolt of lightning', noticeFamilies: N_ARCANE },
  'magic.plant': { themes: ['wild', 'heal', 'ward'], cond: 'in_wilderness', nouns: ['Thorn', 'Root', 'Briar', 'Bramble'], mass: ['Ivy'], blow: 'a lash of thorns', ward: 'grows briars across', noticeFamilies: N_ARCANE },
  'magic.animal': { themes: ['wild', 'travel', 'sight'], cond: 'in_wilderness', nouns: ['Hound', 'Hawk', 'Antler', 'Pack'], mass: [], road: 'like a hound on a scent', noticeFamilies: N_ARCANE },
  'magic.healing': { themes: ['heal', 'holy'], cond: 'health_low', nouns: ['Salve', 'Poultice', 'Suture'], mass: ['Balm'], noticeFamilies: N_ARCANE },
  'magic.druidism': { themes: ['wild', 'war', 'travel'], cond: 'in_wilderness', nouns: ['Pelt', 'Antler', 'Claw', 'Moult'], mass: [], road: 'on four legs', noticeFamilies: N_ARCANE },
  'magic.poison': { themes: ['curse', 'war'], cond: 'alone', nouns: ['Nettle', 'Sting', 'Hemlock'], mass: ['Venom', 'Nightshade'], blow: 'a spit of venom', noticeFamilies: N_DARK },
  'magic.weather': { themes: ['wild', 'war', 'travel', 'conceal'], cond: 'in_wilderness', nouns: ['Squall', 'Thunderhead'], mass: ['Hail', 'Rain', 'Fog'], blow: 'a lash of hail', noticeFamilies: N_ARCANE },
  'magic.shamanism': { themes: ['death', 'sight', 'heal', 'fear'], cond: 'in_mystical', nouns: ['Drum', 'Rattle', 'Ancestor', 'Totem'], mass: ['Smoke'], noticeFamilies: N_DARK },
  'magic.necromancy': { themes: ['death', 'fear', 'curse'], cond: 'in_mystical', nouns: ['Grave', 'Barrow', 'Knell', 'Shroud'], mass: ['Bone'], noticeFamilies: N_DARK },
  'magic.holy': { themes: ['holy', 'heal', 'ward', 'war'], cond: 'at_home_territory', nouns: ['Candle', 'Bell', 'Oath', 'Censer'], mass: [], ward: 'blesses', noticeFamilies: N_ARCANE },
  'magic.psionics': { themes: ['mind', 'fear', 'sight'], cond: 'in_social', nouns: ['Whisper', 'Stare', 'Will'], mass: ['Hush'], noticeFamilies: N_MIND },
  'magic.illusion': { themes: ['mind', 'conceal', 'fear'], cond: 'in_social', nouns: ['Mask', 'Mirror', 'Mirage'], mass: ['Glamour', 'Smoke'], noticeFamilies: N_MIND },
  'magic.dreamcraft': { themes: ['mind', 'fear', 'sight'], cond: 'alone', nouns: ['Dream', 'Lull', 'Nod'], mass: ['Sleep'], noticeFamilies: N_MIND },
  'magic.demonology': { themes: ['curse', 'fear', 'war', 'death'], cond: 'outnumbered', nouns: ['Pact', 'Horn', 'Bargain'], mass: ['Brimstone', 'Sulphur'], blow: 'a gout of hellfire', noticeFamilies: N_DARK },
  'magic.teleportation': { themes: ['travel'], cond: 'alone', nouns: ['Door', 'Gate', 'Fold', 'Step'], mass: [], road: 'folding the road short', noticeFamilies: N_ARCANE },
  'magic.chronomancy': { themes: ['time', 'sight', 'travel'], cond: 'in_exploration', nouns: ['Hour', 'Moment', 'Pendulum'], mass: ['Sand'], noticeFamilies: N_ARCANE },
  'magic.divination': { themes: ['sight', 'luck', 'time'], cond: 'in_exploration', nouns: ['Omen', 'Lot', 'Augury', 'Sign'], mass: [], noticeFamilies: N_ARCANE },
  'magic.luck': { themes: ['luck', 'curse'], cond: 'outnumbered', nouns: ['Coin', 'Wager', 'Clover', 'Knucklebone'], mass: [], noticeFamilies: N_ARCANE },
  'magic.transmutation': { themes: ['craft', 'curse'], cond: 'in_exploration', nouns: ['Crucible', 'Alembic'], mass: ['Quicksilver', 'Lead', 'Salt'], noticeFamilies: N_ARCANE },
  'magic.enchantment': { themes: ['craft', 'mind', 'ward'], cond: 'in_social', nouns: ['Charm', 'Sigil', 'Trinket'], mass: ['Filigree', 'Lacquer'], ward: 'hangs charms across', noticeFamilies: N_MIND },
  'magic.warding': { themes: ['ward', 'holy'], cond: 'at_home_territory', nouns: ['Threshold', 'Circle', 'Lintel'], mass: ['Salt', 'Chalk'], ward: 'salts', noticeFamilies: N_ARCANE },
  'magic.summoning': { themes: ['war', 'wild'], cond: 'outnumbered', nouns: ['Summons', 'Circle', 'Horn'], mass: [], noticeFamilies: N_DARK },
  'magic.binding': { themes: ['ward', 'curse', 'war'], cond: 'in_enemy_territory', nouns: ['Knot', 'Cord', 'Chain', 'Fetter'], mass: [], ward: 'knots cords across', noticeFamilies: N_ARCANE },
  'magic.blood': { themes: ['curse', 'war', 'heal', 'death'], cond: 'health_low', nouns: ['Vein', 'Scar', 'Letting'], mass: ['Blood'], blow: "a burst of the foe's own blood", noticeFamilies: N_DARK },
  'magic.rune': { themes: ['ward', 'craft', 'sight'], cond: 'in_exploration', nouns: ['Rune', 'Letter', 'Carving', 'Sign'], mass: [], ward: 'cuts runes into', noticeFamilies: N_ARCANE },
  'magic.chaos': { themes: ['luck', 'war', 'curse'], cond: 'outnumbered', nouns: ['Flux', 'Tangle', 'Skew'], mass: ['Spill'], blow: 'a wild lash of power', noticeFamilies: N_ARCANE },
  'magic.corruption': { themes: ['curse', 'death'], cond: 'in_enemy_territory', nouns: ['Blight', 'Canker', 'Taint'], mass: ['Rot', 'Mildew'], blow: 'a wave of rot', noticeFamilies: N_DARK },
  'magic.restoration': { themes: ['heal', 'holy', 'ward'], cond: 'health_low', nouns: ['Mending', 'Spring', 'Stitch'], mass: ['Wellwater', 'Clearwater'], noticeFamilies: N_ARCANE },
  'magic.ascension': { themes: ['holy', 'sight', 'mind'], cond: 'alone', nouns: ['Stair', 'Height', 'Ladder', 'Summit'], mass: [], noticeFamilies: N_ARCANE },
};

/** Short names that read as an adjective alone ("Holy") and take "Magic" back on the sheet. */
const TRADITION_NAMES_NEEDING_MAGIC: ReadonlySet<string> = new Set(['Holy', 'Poison', 'Luck']);

/** A plain tradition name for the sheet's *Taught by* line: the world model's name, minus its scholarly tail. */
export function traditionDisplayName(fullName: string | undefined, traditionId: string): string {
  if (!fullName) return traditionId.replace(/^magic\./, '').replace(/^\w/, c => c.toUpperCase());
  const head = fullName.split(/ & | and /)[0].trim();
  return TRADITION_NAMES_NEEDING_MAGIC.has(head) ? `${head} Magic` : head;
}

// ═══════════════════════════════════════════════════════════════════
// Spheres — the flavour and the bite (rule 4 shelves)
// ═══════════════════════════════════════════════════════════════════

/**
 * The per-sphere envelope. Name banks leave out Reach and sphere names, so "Stone Guard"
 * can never be mistaken for a Stone spell. Miscasts list only keys whose effect *writes*
 * when it bites (§ Data tables): `duration`, `decay` and `suppress` backlashes are
 * modifier-only and were dropped from the prototype's lists.
 */
export const SPELL_GEN_SPHERES: Readonly<Record<SphereName, SphereEnvelope>> = {
  chaos: { reaches: { veil: 3, shadow: 2, iron: 1, star: 1 }, conditions: ['outnumbered', 'in_enemy_territory'], adj: ['Wild', 'Crooked', 'Loose', 'Broken'], noun: ['Whirl', 'Scatter', 'Tumble', 'Spill'], turn: 'cursed', miscasts: ['self_terrified'], blow: 'a wild lash of power' },
  order: { reaches: { stone: 3, gold: 2, iron: 1, eye: 1 }, conditions: ['at_home_territory', 'in_social'], adj: ['Straight', 'Sworn', 'Square', 'Still'], noun: ['Rule', 'Line', 'Circle', 'Law'], turn: 'exhausted', miscasts: ['heavy_steps', 'self_exhausted'], blow: 'a hammer of law' },
  light: { reaches: { eye: 3, star: 2, heart: 1, veil: 1 }, conditions: ['in_exploration', 'health_high'], adj: ['Bright', 'White', 'Clear', 'Dawn'], noun: ['Lamp', 'Candle', 'Dawn', 'Lantern'], turn: 'shaken', miscasts: ['self_shaken'], blow: 'a searing flash' },
  darkness: { reaches: { shadow: 3, veil: 2, eye: 1 }, conditions: ['alone', 'in_enemy_territory'], adj: ['Black', 'Dim', 'Hooded', 'Blind'], noun: ['Dusk', 'Night', 'Pall', 'Murk'], turn: 'terrified', miscasts: ['blinded', 'self_terrified'], blow: 'a grip of cold dark' },
  force: { reaches: { iron: 3, star: 2, stone: 1 }, conditions: ['in_combat', 'outnumbered'], adj: ['Hard', 'Heavy', 'Headlong', 'Sudden'], noun: ['Blow', 'Gust', 'Push', 'Weight'], turn: 'wounded', miscasts: ['self_wounded'], blow: 'a hammer-blow of force' },
  matter: { reaches: { stone: 3, iron: 2, gold: 1 }, conditions: ['at_home_territory', 'in_wilderness'], adj: ['Grey', 'Dense', 'Set', 'Flinted'], noun: ['Salt', 'Clay', 'Flint', 'Lead'], turn: 'exhausted', miscasts: ['heavy_steps', 'self_exhausted'], blow: 'a flung stone' },
  energy: { reaches: { iron: 2, star: 2, veil: 1, heart: 1 }, conditions: ['in_combat', 'health_high'], adj: ['Hot', 'Quick', 'Burning', 'Bright'], noun: ['Spark', 'Cinder', 'Flare', 'Kindling'], turn: 'exhausted', miscasts: ['self_exhausted', 'self_wounded'], blow: 'a burst of fire' },
  life: { reaches: { heart: 2, stone: 2, star: 1 }, conditions: ['in_wilderness', 'near_water'], adj: ['Green', 'Warm', 'Quick', 'Rooted'], noun: ['Root', 'Sap', 'Seed', 'Moss'], turn: 'exhausted', miscasts: ['self_exhausted'], blow: 'a lash of thorns' },
  mind: { reaches: { eye: 3, gold: 2, heart: 1, shadow: 1 }, conditions: ['in_social', 'in_exploration'], adj: ['Sharp', 'Cold', 'Clear', 'Quiet'], noun: ['Whisper', 'Riddle', 'Mirror', 'Question'], turn: 'shaken', miscasts: ['self_shaken', 'blinded'], blow: 'a spike of pain behind the eyes' },
  spirit: { reaches: { veil: 3, heart: 2, star: 1 }, conditions: ['in_mystical', 'alone'], adj: ['Pale', 'Hallowed', 'Hollow', 'Ghost'], noun: ['Ghost', 'Breath', 'Vigil', 'Bell'], turn: 'grieving', miscasts: ['self_grieving'], blow: 'a cold hand' },
  time: { reaches: { eye: 2, star: 2, veil: 1, stone: 1 }, conditions: ['in_exploration', 'health_low'], adj: ['Slow', 'Long', 'Late', 'Patient'], noun: ['Hour', 'Sand', 'Tide', 'Echo'], turn: 'exhausted', miscasts: ['snapback', 'heavy_steps'], blow: 'a blow from a moment ago' },
  entropy: { reaches: { shadow: 2, veil: 2, iron: 1, gold: 1 }, conditions: ['health_low', 'in_enemy_territory'], adj: ['Grey', 'Withered', 'Sour', 'Ashen'], noun: ['Rot', 'Ash', 'Rust', 'Dust'], turn: 'cursed', miscasts: ['self_cursed'], blow: 'a wave of rot' },
};

/**
 * Rule 4 — the Foundation-sphere shelves. No tradition in the world model weights Order,
 * Chaos, Light or Darkness; these rows are the generator's reading of it (the world model
 * is not edited). Drawn only for tier ≥ `SPELL_GEN_FOUNDATION_MIN_TIER`.
 */
export const SPELL_GEN_FOUNDATION_SHELVES: Readonly<Record<'light' | 'darkness' | 'order' | 'chaos', readonly string[]>> = {
  light: ['magic.holy', 'magic.divination', 'magic.restoration', 'magic.ascension'],
  darkness: ['magic.illusion', 'magic.necromancy', 'magic.dreamcraft', 'magic.shamanism'],
  order: ['magic.warding', 'magic.rune', 'magic.binding', 'magic.enchantment'],
  chaos: ['magic.chaos', 'magic.luck', 'magic.demonology', 'magic.weather'],
};

// ═══════════════════════════════════════════════════════════════════
// Situations and words
// ═══════════════════════════════════════════════════════════════════

/** Which Reach a situation calls for — so "when alone" pairs with Shadow, not with Gold. */
export const COND_REACH: Readonly<Partial<Record<EffectCondition, readonly ReachDomain[]>>> = {
  in_combat: ['iron'], outnumbered: ['iron', 'shadow'], alone: ['shadow', 'veil'], in_enemy_territory: ['shadow', 'iron'],
  at_home_territory: ['stone', 'gold'], in_social: ['gold', 'heart'], in_exploration: ['eye', 'star'], in_mystical: ['veil'],
  in_wilderness: ['star', 'stone'], near_water: ['star'], health_low: ['iron', 'heart'], health_high: ['star', 'iron'],
};

/** Situation-flavoured name nouns, so a situational spell's name says when it works. */
export const COND_NOUNS: Readonly<Partial<Record<EffectCondition, readonly string[]>>> = {
  in_combat: ['Fury', 'Edge'], in_social: ['Manner', 'Tongue'], in_exploration: ['Lens', 'Wayfinding'],
  in_mystical: ['Kinship', 'Second Sight'], at_home_territory: ['Hearth', 'Doorstep'], in_enemy_territory: ['Trespass', 'Far Country'],
  in_wilderness: ['Greenway', 'Wildness'], health_low: ['Spite', 'Last Breath'], health_high: ['Vigour', 'Bloom'],
  alone: ['Solitude', 'Lone Road'], outnumbered: ['Last Ditch', 'Long Odds'], near_water: ['Riverfaith', 'Tideward'],
};

/** Mass nouns that read naturally in "Ward of Salt" even when a tradition does not list them. */
export const SPELL_GEN_MASS_NOUNS: readonly string[] = ['Salt', 'Clay', 'Flint', 'Lead', 'Ash', 'Rot', 'Rust', 'Dust', 'Sand', 'Moss', 'Sap'];

/** Ticks per in-game day, for duration words. */
export const SPELL_GEN_TICKS_PER_DAY = 24;

/** The eight conditions a person can be given today (`condition-trait-content.ts`) — the only ones a generated spell may name. */
export const SPELL_GEN_CONDITIONS: Readonly<Record<string, { readonly id: string; readonly name: string }>> = {
  wounded: { id: 'trait.condition.wounded', name: 'Wounded' },
  terrified: { id: 'trait.condition.terrified', name: 'Terrified' },
  shaken: { id: 'trait.condition.shaken', name: 'Shaken' },
  cursed: { id: 'trait.condition.cursed', name: 'Cursed' },
  exhausted: { id: 'trait.condition.exhausted', name: 'Exhausted' },
  grieving: { id: 'trait.condition.grieving', name: 'Grieving' },
  inspired: { id: 'trait.condition.inspired', name: 'Inspired' },
  blessed: { id: 'trait.condition.blessed', name: 'Blessed' },
};
