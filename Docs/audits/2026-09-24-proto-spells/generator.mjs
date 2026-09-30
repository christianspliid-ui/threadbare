#!/usr/bin/env node
/**
 * THR-1232 — Power generator sketch. THROWAWAY design prototype.
 *
 * Composes spells from the effect-primitive vocabulary in src/types/effects.ts
 * (the post-THR-1242 union: 44 members, `choice_set` excluded from generators)
 * inside authored envelopes, then renders each one in plain game words for the
 * creative director to react to.
 *
 *   node generator.mjs                         → writes twenty-spells.md + twenty-spells.json
 *   node generator.mjs --seed 42 --count 20 --appendix-seed 1231 --appendix-count 5
 *   node generator.mjs --dump                  → print the spells to stdout, write nothing
 *
 * Reads (never writes) the repo: src/data/world-model.json, for the 34 magic traditions
 * and their real sphere weights. Nothing in the game imports this file.
 *
 * Two composition modes, so the "generation dial" can be judged side by side:
 *   core — an AUTHORED core (a small hand-written kernel: primitives + one sentence)
 *          plus seeded variation: magnitudes, durations, one optional rider, the
 *          tradition, the price, the backlash and the name.
 *   free — FULL composition: 1–3 primitives drawn by sphere affinity alone, each
 *          described by a generic per-primitive clause. No authored intent.
 *
 * Pipeline per spell:  arena → tier → agency → sphere → core → tradition (fit to the
 * core's themes) → price (tier push × tradition lean) → effects → backlash → name → lint.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = 'C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator';

// ═══════════════════════════════════════════════════════════════════
// 1. PRNG — the same mulberry32 as src/lib/prng.ts (NFP #3)
// ═══════════════════════════════════════════════════════════════════

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function weighted(rng, entries) {
  const list = (Array.isArray(entries) ? entries : Object.entries(entries)).filter(([, w]) => w > 0);
  if (list.length === 0) return undefined;
  const total = list.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of list) { r -= w; if (r < 0) return v; }
  return list[list.length - 1][0];
}
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const r2 = (x) => Math.round(x * 100) / 100;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// ═══════════════════════════════════════════════════════════════════
// 2. Liveness — what each primitive actually does in the engine today
//    (verified against main @ 9cc62c05, 2026-09-24: the ledger on THR-1237,
//    the fight research on THR-1530, and src/engine/effectExecutors.ts)
// ═══════════════════════════════════════════════════════════════════

const BADGE = {
  live: 'works today',
  partial: 'works only in part',
  fight: 'planned: fight block',
  hazard: 'works, but unsafe',
  broken: 'cannot be paid today',
  unread: 'stored, but nothing reads it',
  stub: 'does nothing yet',
  nohome: 'no engine home',
};
const BADGE_RANK = { live: 0, partial: 1, fight: 2, hazard: 3, broken: 4, unread: 5, stub: 6, nohome: 7 };
const worst = (...bs) => bs.reduce((a, b) => (BADGE_RANK[b] > BADGE_RANK[a] ? b : a), 'live');

/** Tags carried by conditions a person can actually be given today. */
const LIVE_CONDITION_TAGS = new Set(['#combat', '#negative', '#positive', '#social', '#mystical', '#divine',
  '#curse', '#wound', '#disease', '#blessing']);
/** Primitives whose executor arm makes a real change when a reactive fires them. */
const EXECUTING_NESTED = new Set(['alter_terrain', 'modify_rules', 'dispel', 'cascade', 'inflict_condition', 'resource_manipulate']);
const READ_OVERLAYS = new Set(['warded', 'shrouded']);

function liveness(e) {
  switch (e.type) {
    case 'teleport': case 'forced_move': case 'transfer': case 'destroy_structure':
    case 'faction_manipulate': case 'compel': case 'spawn': case 'choice_set':
      return 'stub';
    case 'alter_terrain': return READ_OVERLAYS.has(e.terrainEffect) ? 'live' : 'unread';
    case 'inflict_condition': return 'fight';
    case 'resource_manipulate': return e.resource === 'fight_clock' ? 'fight' : 'live';
    case 'stacking': return e.stackOn === 'on_kill' ? 'fight' : 'live';
    case 'prevent_loss': return e.channel === 'quintessence' ? 'live' : 'unread';
    case 'tag_immunity': return e.tags.some((t) => LIVE_CONDITION_TAGS.has(t)) ? 'live' : 'unread';
    case 'trait_grant': return e.grantedTrait.startsWith('proto.') ? 'unread' : 'live';
    case 'dispel': return 'hazard';
    case 'reveal': return (e.target === 'hexes' || e.target === 'encounters') ? 'live' : 'unread';
    case 'reactive': {
      const trig = e.trigger === 'attacked' ? 'fight'
        : ['entered_hex', 'damaged', 'healed'].includes(e.trigger) ? 'live'
          : e.trigger === 'encounter_started' ? 'partial' : 'unread';
      const nested = EXECUTING_NESTED.has(e.effect.type) ? liveness(e.effect) : 'unread';
      return worst(trig, nested);
    }
    default: return 'live';
  }
}

function costLiveness(k) {
  switch (k.type) {
    case 'reach_drain': return 'broken';       // reads/writes properties.domainCapability, which nothing seeds
    case 'relationship_damage': return 'stub'; // empty branch in payCosts
    default: return 'live';
  }
}

// ═══════════════════════════════════════════════════════════════════
// 3. ENVELOPES — the authored tables
// ═══════════════════════════════════════════════════════════════════

/** Tier envelope. Price weights push rightward as tier rises (THR-1230 ruling 3). */
const TIERS = [
  { key: 'cantrip', label: 'cantrip', attachmentTier: 1, deliberate: 0.0,
    price: { free: 0.75, strain: 0.25 }, mag: [0.04, 0.06], cooldown: [6, 12] },
  { key: 'working', label: 'working', attachmentTier: 2, deliberate: 0.3,
    price: { free: 0.15, strain: 0.5, gamble: 0.35 }, mag: [0.06, 0.09], cooldown: [12, 36] },
  { key: 'great', label: 'great working', attachmentTier: 3, deliberate: 0.5,
    price: { strain: 0.35, gamble: 0.35, transgression: 0.3 }, mag: [0.09, 0.12], cooldown: [36, 72] },
  { key: 'signature', label: 'signature', attachmentTier: 4, deliberate: 1.0,
    price: { gamble: 0.35, transgression: 0.65 }, mag: [0.12, 0.15], cooldown: [72, 160] },
];
const TIER_MIX = { cantrip: 0.25, working: 0.35, great: 0.25, signature: 0.15 };
const ARENA_MIX = { encounter: 0.62, fight: 0.12, travel: 0.08, sight: 0.08, mark: 0.10 };
const ARENA_LABEL = {
  encounter: 'encounter', fight: 'fight',
  travel: 'world map: travel', sight: 'world map: sight', mark: 'world map: mark',
};
const FREE_SHARE = 0.3;           // share of the slate built by free composition
const FATE_WOVEN_MIN = 0.6;       // ruling 1: fate-woven spells are the majority
const CORE_REUSE_WEIGHT = 0.1;    // a core already used in this run is this much less likely
const EFFECT_PER_ITEM_CAP = 0.15; // src/data/effect-constants.ts

/** Reach words for plain text. */
const REACH_NAME = { iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil', heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star' };
const R = (r) => REACH_NAME[r] ?? r;
/** What a Reach's encounters are "about", for the calling core. */
const REACH_PULL = {
  iron: 'a fight', gold: 'a bargain', shadow: 'a secret', veil: 'a mystery',
  heart: 'someone in need', eye: 'an unanswered question', stone: 'a job that needs doing', star: 'the open road',
};
/** Strain pairing: the Reach a carried spell weighs on. */
const STRAIN_PAIR = { iron: 'heart', gold: 'veil', shadow: 'heart', veil: 'iron', heart: 'shadow', eye: 'heart', stone: 'star', star: 'stone' };
/** Canonical plain pole words (src/types/axisRegistry.ts). Drift toward the vice pole is a negative rate. */
const AXIS = {
  iron: { pair: 'mercy_ruthlessness', vice: 'Power-Hungry' },
  gold: { pair: 'asceticism_extravagance', vice: 'Greedy' },
  shadow: { pair: 'honesty_cunning', vice: 'Scheming' },
  veil: { pair: 'tradition_novelty', vice: 'Impatient' },
  heart: { pair: 'loyalty_ambition', vice: 'Disloyal' },
  eye: { pair: 'revelation_discretion', vice: 'Judgemental' },
  stone: { pair: 'preservation_transformation', vice: 'Reckless' },
  star: { pair: 'sacrifice_survival', vice: 'Misleading' },
};

/** The eight conditions a person can be given today (src/data/condition-trait-content.ts). */
const CONDITIONS = {
  wounded: { id: 'trait.condition.wounded', name: 'Wounded', gloss: 'weaker at Iron and Stone' },
  terrified: { id: 'trait.condition.terrified', name: 'Terrified', gloss: 'weaker at Iron, and keen to get away' },
  shaken: { id: 'trait.condition.shaken', name: 'Shaken', gloss: 'weaker at Star and Heart' },
  cursed: { id: 'trait.condition.cursed', name: 'Cursed', gloss: 'unlucky at Star and Gold' },
  exhausted: { id: 'trait.condition.exhausted', name: 'Exhausted', gloss: 'weaker at Iron, Eye and Stone' },
  grieving: { id: 'trait.condition.grieving', name: 'Grieving', gloss: 'weaker at Heart and Eye' },
  inspired: { id: 'trait.condition.inspired', name: 'Inspired', gloss: 'stronger at Heart and Star' },
  blessed: { id: 'trait.condition.blessed', name: 'Blessed', gloss: 'luckier at Star and Heart' },
};

const COND_PHRASE = {
  in_combat: 'in a fight', in_social: 'dealing with people', in_exploration: 'exploring, studying or building',
  in_mystical: 'dealing with magic or fate', at_home_territory: 'on home ground', in_enemy_territory: 'in enemy country',
  in_wilderness: 'out in the wilds', health_low: 'badly hurt', health_high: 'whole and unhurt',
  alone: 'alone', outnumbered: 'outnumbered', near_water: 'near water',
};
/** Which Reach a situation calls for — so "when alone" pairs with Shadow, not with Gold. */
const COND_REACH = {
  in_combat: ['iron'], outnumbered: ['iron', 'shadow'], alone: ['shadow', 'veil'], in_enemy_territory: ['shadow', 'iron'],
  at_home_territory: ['stone', 'gold'], in_social: ['gold', 'heart'], in_exploration: ['eye', 'star'], in_mystical: ['veil'],
  in_wilderness: ['star', 'stone'], near_water: ['star'], health_low: ['iron', 'heart'], health_high: ['star', 'iron'],
};
/** Situation-flavoured name nouns, so a situational spell's name says when it works. */
const COND_NOUNS = {
  in_combat: ['Fury', 'Edge'], in_social: ['Manner', 'Tongue'], in_exploration: ['Lens', 'Wayfinding'],
  in_mystical: ['Kinship', 'Second Sight'], at_home_territory: ['Hearth', 'Doorstep'], in_enemy_territory: ['Trespass', 'Far Country'],
  in_wilderness: ['Greenway', 'Wildness'], health_low: ['Spite', 'Last Breath'], health_high: ['Vigour', 'Bloom'],
  alone: ['Solitude', 'Lone Road'], outnumbered: ['Last Ditch', 'Long Odds'], near_water: ['Riverfaith', 'Tideward'],
};

/**
 * SPHERE envelope — the flavour and the gate (THR-1230 ruling 4: the sphere
 * envelope both flavours a spell and gates who may learn it). Name banks leave out
 * Reach and sphere names, so "Stone Guard" can never be mistaken for a Stone spell.
 */
const SPHERES = {
  chaos: { label: 'Chaos', family: 'foundation', reaches: { veil: 3, shadow: 2, iron: 1, star: 1 },
    conditions: ['outnumbered', 'in_enemy_territory'],
    adj: ['Wild', 'Crooked', 'Loose', 'Broken'], noun: ['Whirl', 'Scatter', 'Tumble', 'Spill'],
    hexProp: 'explorationAttraction', turn: 'cursed', miscasts: ['wild_severity', 'self_terrified'], rawMiscasts: ['wild_ground'] },
  order: { label: 'Order', family: 'foundation', reaches: { stone: 3, gold: 2, iron: 1, eye: 1 },
    conditions: ['at_home_territory', 'in_social'],
    adj: ['Straight', 'Sworn', 'Square', 'Still'], noun: ['Rule', 'Line', 'Circle', 'Law'],
    hexProp: 'divineInfluence', turn: 'exhausted', miscasts: ['heavy_steps', 'self_exhausted'], rawMiscasts: [] },
  light: { label: 'Light', family: 'foundation', reaches: { eye: 3, star: 2, heart: 1, veil: 1 },
    conditions: ['in_exploration', 'health_high'],
    adj: ['Bright', 'White', 'Clear', 'Dawn'], noun: ['Lamp', 'Candle', 'Dawn', 'Lantern'],
    hexProp: 'divineInfluence', turn: 'shaken', miscasts: ['exposed', 'self_shaken'], rawMiscasts: [] },
  darkness: { label: 'Darkness', family: 'foundation', reaches: { shadow: 3, veil: 2, eye: 1 },
    conditions: ['alone', 'in_enemy_territory'],
    adj: ['Black', 'Dim', 'Hooded', 'Blind'], noun: ['Dusk', 'Night', 'Pall', 'Murk'],
    hexProp: 'corruption', turn: 'terrified', miscasts: ['blinded', 'self_terrified'], rawMiscasts: ['cursed_ground'] },
  force: { label: 'Force', family: 'creation', reaches: { iron: 3, star: 2, stone: 1 },
    conditions: ['in_combat', 'outnumbered'],
    adj: ['Hard', 'Heavy', 'Headlong', 'Sudden'], noun: ['Blow', 'Gust', 'Push', 'Weight'],
    hexProp: 'explorationAttraction', turn: 'wounded', miscasts: ['numb_arm', 'self_wounded'], rawMiscasts: [] },
  matter: { label: 'Matter', family: 'creation', reaches: { stone: 3, iron: 2, gold: 1 },
    conditions: ['at_home_territory', 'in_wilderness'],
    adj: ['Grey', 'Dense', 'Set', 'Flinted'], noun: ['Salt', 'Clay', 'Flint', 'Lead'],
    hexProp: 'divineInfluence', turn: 'exhausted', miscasts: ['heavy_steps', 'numb_hands'], rawMiscasts: [] },
  energy: { label: 'Energy', family: 'creation', reaches: { iron: 2, star: 2, veil: 1, heart: 1 },
    conditions: ['in_combat', 'health_high'],
    adj: ['Hot', 'Quick', 'Burning', 'Bright'], noun: ['Spark', 'Cinder', 'Flare', 'Kindling'],
    hexProp: 'explorationAttraction', turn: 'exhausted', miscasts: ['burnout', 'self_exhausted'], rawMiscasts: [] },
  life: { label: 'Life', family: 'creation', reaches: { heart: 2, stone: 2, star: 1 },
    conditions: ['in_wilderness', 'near_water'],
    adj: ['Green', 'Warm', 'Quick', 'Rooted'], noun: ['Root', 'Sap', 'Seed', 'Moss'],
    hexProp: 'divineInfluence', turn: 'exhausted', miscasts: ['slow_ache', 'self_exhausted'], rawMiscasts: [] },
  mind: { label: 'Mind', family: 'creation', reaches: { eye: 3, gold: 2, heart: 1, shadow: 1 },
    conditions: ['in_social', 'in_exploration'],
    adj: ['Sharp', 'Cold', 'Clear', 'Quiet'], noun: ['Whisper', 'Riddle', 'Mirror', 'Question'],
    hexProp: 'explorationAttraction', turn: 'shaken', miscasts: ['scattered', 'self_shaken'], rawMiscasts: [] },
  spirit: { label: 'Spirit', family: 'creation', reaches: { veil: 3, heart: 2, star: 1 },
    conditions: ['in_mystical', 'alone'],
    adj: ['Pale', 'Hallowed', 'Hollow', 'Ghost'], noun: ['Ghost', 'Breath', 'Vigil', 'Bell'],
    hexProp: 'divineInfluence', turn: 'grieving', miscasts: ['burnout', 'self_grieving'], rawMiscasts: [] },
  time: { label: 'Time', family: 'creation', reaches: { eye: 2, star: 2, veil: 1, stone: 1 },
    conditions: ['in_exploration', 'health_low'],
    adj: ['Slow', 'Long', 'Late', 'Patient'], noun: ['Hour', 'Sand', 'Tide', 'Echo'],
    hexProp: 'explorationAttraction', turn: 'exhausted', miscasts: ['snapback', 'heavy_steps'], rawMiscasts: [] },
  entropy: { label: 'Entropy', family: 'creation', reaches: { shadow: 2, veil: 2, iron: 1, gold: 1 },
    conditions: ['health_low', 'in_enemy_territory'],
    adj: ['Grey', 'Withered', 'Sour', 'Ashen'], noun: ['Rot', 'Ash', 'Rust', 'Dust'],
    hexProp: 'corruption', turn: 'cursed', miscasts: ['self_cursed', 'slow_rot'], rawMiscasts: ['sour_ground'] },
};
const SPHERE_KEYS = Object.keys(SPHERES);

/**
 * TRADITION envelope (authored for this prototype). The world model gives each of the
 * 34 traditions a name, a school and sphere weights — nothing about what it *does*.
 * So each tradition here gets: themes (what kinds of spell it teaches; the FIRST theme
 * is its primary one, and drives its price lean), a preferred situation, and word banks.
 * `mass` nouns read naturally in "Ward of Salt"; `blow`/`road`/`ward` are phrase overrides.
 */
const TRADITION_ENV = {
  'magic.fire': { themes: ['war', 'curse'], cond: 'in_combat', nouns: ['Ember', 'Cinder', 'Kiln', 'Brand'], mass: ['Ash', 'Smoke'], blow: 'a burst of flame' },
  'magic.ice': { themes: ['war', 'ward', 'time'], cond: 'near_water', nouns: ['Icicle', 'Floe'], mass: ['Rime', 'Frost', 'Hoarfrost'], blow: 'a shard of ice' },
  'magic.earth': { themes: ['ward', 'war', 'craft'], cond: 'at_home_territory', nouns: ['Cairn', 'Boulder'], mass: ['Clay', 'Flint', 'Loam'], blow: 'a flung stone', ward: 'raises stones across' },
  'magic.air': { themes: ['travel', 'war'], cond: 'in_wilderness', nouns: ['Gust', 'Gale', 'Draught'], mass: ['Breath'], blow: 'a blast of wind', road: 'on the wind' },
  'magic.water': { themes: ['travel', 'heal', 'war'], cond: 'near_water', nouns: ['Tide', 'Well', 'Current'], mass: ['Brine'], blow: 'a crushing wave', road: 'as fast as a river runs' },
  'magic.lightning': { themes: ['war', 'travel'], cond: 'in_combat', nouns: ['Bolt', 'Spark', 'Fork'], mass: ['Thunder'], blow: 'a bolt of lightning' },
  'magic.plant': { themes: ['wild', 'heal', 'ward'], cond: 'in_wilderness', nouns: ['Thorn', 'Root', 'Briar', 'Bramble'], mass: ['Ivy'], blow: 'a lash of thorns', ward: 'grows briars across' },
  'magic.animal': { themes: ['wild', 'travel', 'sight'], cond: 'in_wilderness', nouns: ['Hound', 'Hawk', 'Antler', 'Pack'], mass: [], road: 'like a hound on a scent' },
  'magic.healing': { themes: ['heal', 'holy'], cond: 'health_low', nouns: ['Salve', 'Poultice', 'Suture'], mass: ['Balm'] },
  'magic.druidism': { themes: ['wild', 'war', 'travel'], cond: 'in_wilderness', nouns: ['Pelt', 'Antler', 'Claw', 'Moult'], mass: [], road: 'on four legs' },
  'magic.poison': { themes: ['curse', 'war'], cond: 'alone', nouns: ['Nettle', 'Sting', 'Hemlock'], mass: ['Venom', 'Nightshade'], blow: 'a spit of venom' },
  'magic.weather': { themes: ['wild', 'war', 'travel', 'conceal'], cond: 'in_wilderness', nouns: ['Squall', 'Thunderhead'], mass: ['Hail', 'Rain', 'Fog'], blow: 'a lash of hail' },
  'magic.shamanism': { themes: ['death', 'sight', 'heal', 'fear'], cond: 'in_mystical', nouns: ['Drum', 'Rattle', 'Ancestor', 'Totem'], mass: ['Smoke'] },
  'magic.necromancy': { themes: ['death', 'fear', 'curse'], cond: 'in_mystical', nouns: ['Grave', 'Barrow', 'Knell', 'Shroud'], mass: ['Bone'] },
  'magic.holy': { themes: ['holy', 'heal', 'ward', 'war'], cond: 'at_home_territory', nouns: ['Candle', 'Bell', 'Oath', 'Censer'], mass: [], ward: 'blesses' },
  'magic.psionics': { themes: ['mind', 'fear', 'sight'], cond: 'in_social', nouns: ['Whisper', 'Stare', 'Will'], mass: ['Hush'] },
  'magic.illusion': { themes: ['mind', 'conceal', 'fear'], cond: 'in_social', nouns: ['Mask', 'Mirror', 'Mirage'], mass: ['Glamour', 'Smoke'] },
  'magic.dreamcraft': { themes: ['mind', 'fear', 'sight'], cond: 'alone', nouns: ['Dream', 'Lull', 'Nod'], mass: ['Sleep'] },
  'magic.demonology': { themes: ['curse', 'fear', 'war', 'death'], cond: 'outnumbered', nouns: ['Pact', 'Horn', 'Bargain'], mass: ['Brimstone', 'Sulphur'], blow: 'a gout of hellfire' },
  'magic.teleportation': { themes: ['travel'], cond: 'alone', nouns: ['Door', 'Gate', 'Fold', 'Step'], mass: [], road: 'folding the road short' },
  'magic.chronomancy': { themes: ['time', 'sight', 'travel'], cond: 'in_exploration', nouns: ['Hour', 'Moment', 'Pendulum'], mass: ['Sand'] },
  'magic.divination': { themes: ['sight', 'luck', 'time'], cond: 'in_exploration', nouns: ['Omen', 'Lot', 'Augury', 'Sign'], mass: [] },
  'magic.luck': { themes: ['luck', 'curse'], cond: 'outnumbered', nouns: ['Coin', 'Wager', 'Clover', 'Knucklebone'], mass: [] },
  'magic.transmutation': { themes: ['craft', 'curse'], cond: 'in_exploration', nouns: ['Crucible', 'Alembic'], mass: ['Quicksilver', 'Lead', 'Salt'] },
  'magic.enchantment': { themes: ['craft', 'mind', 'ward'], cond: 'in_social', nouns: ['Charm', 'Sigil', 'Trinket'], mass: ['Filigree', 'Lacquer'], ward: 'hangs charms across' },
  'magic.warding': { themes: ['ward', 'holy'], cond: 'at_home_territory', nouns: ['Threshold', 'Circle', 'Lintel'], mass: ['Salt', 'Chalk'], ward: 'salts' },
  'magic.summoning': { themes: ['war', 'wild'], cond: 'outnumbered', nouns: ['Summons', 'Circle', 'Horn'], mass: [] },
  'magic.binding': { themes: ['ward', 'curse', 'war'], cond: 'in_enemy_territory', nouns: ['Knot', 'Cord', 'Chain', 'Fetter'], mass: [], ward: 'knots cords across' },
  'magic.blood': { themes: ['curse', 'war', 'heal', 'death'], cond: 'health_low', nouns: ['Vein', 'Scar', 'Letting'], mass: ['Blood'], blow: 'a burst of the foe\'s own blood' },
  'magic.rune': { themes: ['ward', 'craft', 'sight'], cond: 'in_exploration', nouns: ['Rune', 'Letter', 'Carving', 'Sign'], mass: [], ward: 'cuts runes into' },
  'magic.chaos': { themes: ['luck', 'war', 'curse'], cond: 'outnumbered', nouns: ['Flux', 'Tangle', 'Skew'], mass: ['Spill'], blow: 'a wild lash of power' },
  'magic.corruption': { themes: ['curse', 'death'], cond: 'in_enemy_territory', nouns: ['Blight', 'Canker', 'Taint'], mass: ['Rot', 'Mildew'], blow: 'a wave of rot' },
  'magic.restoration': { themes: ['heal', 'holy', 'ward'], cond: 'health_low', nouns: ['Mending', 'Spring', 'Stitch'], mass: ['Wellwater', 'Clearwater'] },
  'magic.ascension': { themes: ['holy', 'sight', 'mind'], cond: 'alone', nouns: ['Stair', 'Height', 'Ladder', 'Summit'], mass: [] },
};
/** Price lean by a tradition's primary theme — "cost is characterization" (ruling 3). Multiplies the tier weights. */
const THEME_PRICE_LEAN = {
  holy: { free: 1.6, strain: 1.3, gamble: 0.5, transgression: 0.2 },
  heal: { free: 1.6, strain: 1.3, gamble: 0.5, transgression: 0.2 },
  ward: { free: 1.3, strain: 1.4, gamble: 0.6, transgression: 0.4 },
  craft: { free: 1.0, strain: 1.4, gamble: 0.8, transgression: 0.5 },
  war: { free: 0.8, strain: 1.4, gamble: 1.1, transgression: 0.8 },
  travel: { free: 1.2, strain: 1.2, gamble: 1.1, transgression: 0.5 },
  sight: { free: 1.2, strain: 1.1, gamble: 1.3, transgression: 0.6 },
  mind: { free: 1.0, strain: 1.0, gamble: 1.4, transgression: 1.0 },
  time: { free: 0.8, strain: 1.2, gamble: 1.5, transgression: 1.0 },
  wild: { free: 1.2, strain: 1.2, gamble: 1.4, transgression: 0.5 },
  luck: { free: 0.8, strain: 0.6, gamble: 2.5, transgression: 0.8 },
  conceal: { free: 1.0, strain: 1.0, gamble: 1.5, transgression: 0.8 },
  fear: { free: 0.5, strain: 0.8, gamble: 1.2, transgression: 1.8 },
  curse: { free: 0.4, strain: 0.8, gamble: 1.2, transgression: 2.2 },
  death: { free: 0.3, strain: 0.7, gamble: 1.0, transgression: 2.5 },
};
/** The Reach a theme leans on, blended into the sphere's Reach weights. */
const THEME_REACH = {
  war: 'iron', travel: 'star', sight: 'eye', mind: 'gold', heal: 'heart', holy: 'heart', death: 'veil', curse: 'shadow',
  luck: 'star', wild: 'star', craft: 'stone', ward: 'stone', time: 'eye', fear: 'shadow', conceal: 'shadow',
};
/** Vows only make sense for traditions whose teaching forbids something. */
const THEME_VOW = { heal: 'iron', holy: 'shadow' };
/** A carried hex mark follows the tradition first, the sphere second. */
const THEME_HEX = { holy: 'divineInfluence', heal: 'divineInfluence', death: 'corruption', curse: 'corruption', luck: 'explorationAttraction', wild: 'explorationAttraction', sight: 'explorationAttraction' };

/**
 * THE FOUNDATION-SPHERE PATCH — invented by this prototype, NOT in the world model.
 * All 34 traditions weight only Creation spheres; none names Order, Chaos, Light or
 * Darkness. A Foundation-sphere spell therefore has no shelf, so the generator borrows
 * one from here. This is an envelope gap, not a design.
 */
const FOUNDATION_SHELF_PATCH = {
  light: { 'magic.holy': 0.6, 'magic.divination': 0.4, 'magic.restoration': 0.4, 'magic.ascension': 0.3 },
  darkness: { 'magic.illusion': 0.5, 'magic.necromancy': 0.4, 'magic.dreamcraft': 0.4, 'magic.shamanism': 0.2 },
  order: { 'magic.warding': 0.6, 'magic.rune': 0.5, 'magic.binding': 0.4, 'magic.enchantment': 0.3 },
  chaos: { 'magic.chaos': 0.7, 'magic.luck': 0.4, 'magic.demonology': 0.3, 'magic.weather': 0.2 },
};

/** Default blow description when the tradition has none. */
const SPHERE_BLOW = {
  force: 'a hammer-blow of force', energy: 'a burst of fire', entropy: 'a wave of rot', chaos: 'a wild lash of power',
  matter: 'a flung stone', light: 'a searing flash', darkness: 'a grip of cold dark', spirit: 'a cold hand',
  mind: 'a spike of pain behind the eyes', life: 'a lash of thorns', time: 'a blow from a moment ago', order: 'a hammer of law',
};
const SWAP_GLOSS = {
  eye: 'reading each blow before it lands', shadow: 'striking where the opponent is not looking',
  veil: 'using their magic where others use their arms', heart: 'carried by nerve rather than strength',
  star: 'trusting instinct and footwork', stone: 'standing like a wall that will not give',
};

// ═══════════════════════════════════════════════════════════════════
// 4. Plain-language helpers — words, never numerals (UI Law IV)
// ═══════════════════════════════════════════════════════════════════

function mag(v) {
  const a = Math.abs(v);
  if (a <= 0.04) return 'slightly';
  if (a <= 0.07) return 'a little';
  if (a <= 0.10) return 'noticeably';
  if (a <= 0.13) return 'a good deal';
  return 'a great deal';
}
const better = (v) => `${mag(v)} ${v >= 0 ? 'better' : 'worse'}`;
function durNoun(t) {
  if (t === 'permanent') return 'for good';
  if (t <= 4) return 'a few hours';
  if (t <= 7) return 'half a day';
  if (t <= 14) return 'a day';
  if (t <= 30) return 'a couple of days';
  if (t <= 60) return 'a few days';
  if (t <= 110) return 'about a week';
  if (t <= 200) return 'a week or two';
  return 'a long while';
}
const dur = (t) => (t === 'permanent' ? 'for good' : `for ${durNoun(t)}`);
function prob(p) {
  if (p < 0.2) return 'rarely';
  if (p < 0.45) return 'sometimes';
  if (p < 0.7) return 'often';
  if (p < 0.9) return 'usually';
  return 'almost always';
}
function faster(mult) { if (mult >= 0.85) return 'a little faster'; if (mult >= 0.72) return 'noticeably faster'; if (mult >= 0.55) return 'much faster'; return 'at double pace'; }
function slower(mult) { if (mult <= 1.3) return 'a little slower'; if (mult <= 1.6) return 'noticeably slower'; if (mult <= 1.8) return 'much slower'; return 'at half pace'; }
function hexes(n) { return n <= 1 ? 'a hex' : n === 2 ? 'a couple of hexes' : 'several hexes'; }
function soul(amount) { if (amount <= 8) return 'a little of their quintessence'; if (amount <= 15) return 'a real piece of their quintessence'; return 'a great deal of their quintessence'; }
function oftener(mult) { if (mult <= 1.25) return 'a little more often'; if (mult <= 1.4) return 'noticeably more often'; return 'much more often'; }
function sooner(mult) { if (mult >= 0.8) return 'a little sooner'; if (mult >= 0.68) return 'noticeably sooner'; return 'much sooner'; }
function readier(b) { if (b <= 0.1) return 'a little readier'; if (b <= 0.15) return 'noticeably readier'; return 'much readier'; }
function margin(m) { if (m <= 0.05) return 'a hair'; if (m <= 0.1) return 'a little'; return 'a fair margin'; }
const sgn = (v) => (v >= 0 ? `+${v}` : `${v}`);

// ═══════════════════════════════════════════════════════════════════
// 5. MISCAST table — the cost/backlash pairings, by sphere
// ═══════════════════════════════════════════════════════════════════

/** Backlash effects for CAST spells (BacklashEffect.effect). */
const CAST_MISCASTS = {
  numb_arm: { build: (c) => ({ type: 'duration', ticks: c.t([12, 12, 24, 36]), reach: 'iron', value: -c.m(), destroyOnExpiry: true }),
    text: (e) => `their arms go numb, leaving them ${better(e.value)} at Iron ${dur(e.ticks)}` },
  numb_hands: { build: (c) => ({ type: 'duration', ticks: c.t([12, 12, 24, 36]), reach: 'stone', value: -c.m(), destroyOnExpiry: true }),
    text: (e) => `their hands turn clumsy, leaving them ${better(e.value)} at Stone ${dur(e.ticks)}` },
  exposed: { build: (c) => ({ type: 'duration', ticks: c.t([24, 24, 36, 48]), reach: 'shadow', value: -c.m(), destroyOnExpiry: true }),
    text: (e) => `the light shows the caster too, leaving them ${better(e.value)} at Shadow ${dur(e.ticks)}` },
  scattered: { build: (c) => ({ type: 'duration', ticks: c.t([12, 12, 24, 36]), reach: 'eye', value: -c.m(), destroyOnExpiry: true }),
    text: (e) => `their thoughts scatter, leaving them ${better(e.value)} at Eye ${dur(e.ticks)}` },
  heavy_steps: { build: (c) => ({ type: 'modify_rules', scope: { scope: 'self' }, rule: 'movement_cost_multiplier', value: 1.5, ticks: c.t([12, 12, 24, 36]) }),
    text: (e) => `their legs turn heavy, and they travel ${slower(e.value)} ${dur(e.ticks)}` },
  snapback: { build: (c) => ({ type: 'modify_rules', scope: { scope: 'self' }, rule: 'cooldown_multiplier', value: 2.0, ticks: c.t([24, 24, 48, 72]) }),
    text: (e) => `time snaps back on them, and their spells take twice as long to return ${dur(e.ticks)}` },
  blinded: { build: (c) => ({ type: 'modify_rules', scope: { scope: 'self' }, rule: 'awareness_range_bonus', value: -1, ticks: c.t([24, 24, 36, 48]) }),
    text: (e) => `the dark closes in, and they notice less of what goes on around them ${dur(e.ticks)}` },
  burnout: { build: (c) => ({ type: 'suppress', target: 'all_effects', scope: { scope: 'self' }, ticks: c.t([12, 12, 24, 36]) }),
    text: (e) => `it burns out, and their other spells and charms go quiet ${dur(e.ticks)}` },
  wild_severity: { build: (c) => ({ type: 'modify_rules', scope: { scope: 'self' }, rule: 'backlash_severity_multiplier', value: 2.0, ticks: c.t([24, 36, 48, 72]) }),
    text: (e) => `the magic stays wild in them, and ${dur(e.ticks)} any other miscast they suffer lands one grade worse` },
  slow_ache: { build: (c) => ({ type: 'decay', reach: 'heart', startValue: 0, changePerTick: -0.01, limitValue: -c.m(), destroyAtLimit: true }),
    text: () => 'it draws on the caster instead: an ache in the Heart deepens for most of a day, then lifts' },
  slow_rot: { build: (c) => ({ type: 'decay', reach: 'star', startValue: 0, changePerTick: -0.01, limitValue: -c.m(), destroyAtLimit: true }),
    text: () => 'their luck rots: a weakness at Star deepens for most of a day, then lifts' },
  self_wounded: { build: (c) => ({ type: 'inflict_condition', conditionTraitId: CONDITIONS.wounded.id, target: 'self', durationTicks: c.t([24, 24, 36, 48]) }),
    text: (e) => `the force rebounds, and the caster is left Wounded (${CONDITIONS.wounded.gloss}) ${dur(e.durationTicks)}` },
  self_terrified: { build: (c) => ({ type: 'inflict_condition', conditionTraitId: CONDITIONS.terrified.id, target: 'self', durationTicks: c.t([24, 24, 36, 48]) }),
    text: (e) => `something looks back, and the caster is left Terrified (${CONDITIONS.terrified.gloss}) ${dur(e.durationTicks)}` },
  self_shaken: { build: (c) => ({ type: 'inflict_condition', conditionTraitId: CONDITIONS.shaken.id, target: 'self', durationTicks: c.t([24, 24, 36, 48]) }),
    text: (e) => `their own judgement slips, and the caster is left Shaken (${CONDITIONS.shaken.gloss}) ${dur(e.durationTicks)}` },
  self_cursed: { build: (c) => ({ type: 'inflict_condition', conditionTraitId: CONDITIONS.cursed.id, target: 'self', durationTicks: c.t([24, 36, 48, 72]) }),
    text: (e) => `the rot turns inward, and the caster is left Cursed (${CONDITIONS.cursed.gloss}) ${dur(e.durationTicks)}` },
  self_exhausted: { build: (c) => ({ type: 'inflict_condition', conditionTraitId: CONDITIONS.exhausted.id, target: 'self', durationTicks: c.t([12, 24, 36, 48]) }),
    text: (e) => `it takes everything they have, and the caster is left Exhausted (${CONDITIONS.exhausted.gloss}) ${dur(e.durationTicks)}` },
  self_grieving: { build: (c) => ({ type: 'inflict_condition', conditionTraitId: CONDITIONS.grieving.id, target: 'self', durationTicks: c.t([24, 36, 48, 72]) }),
    text: (e) => `something is taken from them, and the caster is left Grieving (${CONDITIONS.grieving.gloss}) ${dur(e.durationTicks)}` },
  // Raw options only the FREE composer reaches for — legal union values with no reader.
  wild_ground: { build: (c) => ({ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'wild_magic', ticks: c.t([24, 24, 48, 72]) }),
    text: (e) => `the ground where they stand turns to Wild Magic ${dur(e.ticks)}, so spells there come back faster and go wrong harder` },
  sour_ground: { build: (c) => ({ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'blighted', ticks: c.t([24, 24, 48, 72]) }),
    text: (e) => `the ground where they stand is Blighted ${dur(e.ticks)}, weakening everyone on it at Stone and Heart` },
  cursed_ground: { build: (c) => ({ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'cursed_ground', ticks: c.t([24, 24, 48, 72]) }),
    text: (e) => `the ground where they stand becomes Cursed Ground ${dur(e.ticks)}, and the world's doom quickens there` },
};

// ═══════════════════════════════════════════════════════════════════
// 6. CORES — the authored layer (small kernels: primitives + one sentence)
// ═══════════════════════════════════════════════════════════════════
// Each core: arena; agency ('carried' = fate-woven, lives in passiveEffects;
// 'cast' = deliberate, lives in effects); tier window [min,max] as TIERS index;
// the spheres it fits (value = a sphere-specific argument); the tradition themes it
// fits (null = any); allowed riders; build(c) → { effects, text, reach, names, targeting }.

const ALL = Object.fromEntries(SPHERE_KEYS.map((s) => [s, true]));

const CORES = [
  // ─────────────── FIGHT ───────────────
  { id: 'fight.reach_swap', arena: 'fight', agency: 'cast', tiers: [1, 3], themes: ['war', 'mind', 'sight', 'conceal', 'fear'], riders: ['afterglow'],
    spheres: { mind: 'eye', light: 'eye', time: 'eye', darkness: 'shadow', entropy: 'shadow', chaos: 'veil', spirit: 'heart', energy: 'star', order: 'stone', matter: 'stone' },
    build(c) {
      const to = c.arg; const ticks = c.t([6, 6, 12, 24]);
      return { reach: to, targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'encounter_reach_override', value: { from: 'iron', to }, ticks }],
        text: `Cast as a fight begins. ${cap(dur(ticks))}, the caster fights with ${R(to)} instead of Iron, ${SWAP_GLOSS[to]}.`,
        names: { nouns: ['Stance', 'Guard', 'Answer'], verbs: ['Read', 'Meet', 'Turn'], objects: ['the Blade', 'the Fight', 'the Blow'] } };
    } },
  { id: 'fight.clock_blow', fightVocab: true, arena: 'fight', agency: 'cast', tiers: [1, 3], themes: ['war', 'curse'], riders: ['afterglow'],
    spheres: { force: true, energy: true, entropy: true, chaos: true, matter: true, light: true },
    build(c) {
      const amt = c.tierIdx >= 3 ? 2 : 1;
      const blow = c.tradEnv.blow ?? SPHERE_BLOW[c.sphere];
      return { reach: 'iron', targeting: { type: 'agent', range: 0, filter: 'enemy' },
        effects: [{ type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount: amt, mode: 'one_shot' }],
        text: amt === 2
          ? `Cast in a fight, it strikes the opponent with ${blow}: two segments of their clock fill at once, as a heavy blow would.`
          : `Cast in a fight, it strikes the opponent with ${blow}: one more segment of their clock fills, as a landed blow would.`,
        names: { nouns: ['Blow', 'Strike', 'Hammer'], verbs: ['Strike', 'Break', 'Hammer'], objects: ['the Guard', 'the Line'] } };
    } },
  { id: 'fight.inflict_fear', fightVocab: true, arena: 'fight', agency: 'cast', tiers: [1, 3], themes: ['fear', 'death', 'mind'], riders: ['afterglow'],
    spheres: { darkness: 'terrified', spirit: 'terrified', chaos: 'terrified', mind: 'shaken' },
    build(c) {
      const k = CONDITIONS[c.arg]; const ticks = c.t([12, 12, 24, 48]);
      const lead = c.arg === 'shaken' ? 'plants doubt in the opponent' : 'puts fear into the opponent';
      return { reach: 'iron', targeting: { type: 'agent', range: 0, filter: 'enemy' },
        effects: [{ type: 'inflict_condition', conditionTraitId: k.id, target: 'counterpart', durationTicks: ticks }],
        text: `Cast in a fight, it ${lead}: they are left ${k.name} (${k.gloss}) ${dur(ticks)}.`,
        names: { nouns: ['Dread', 'Howl', 'Pall'], verbs: ['Break', 'Shake', 'Cow'], objects: ['Their Nerve', 'the Brave'] } };
    } },
  { id: 'fight.inflict_curse', fightVocab: true, arena: 'fight', agency: 'cast', tiers: [1, 3], themes: ['curse', 'death', 'time'], riders: [],
    spheres: { entropy: 'cursed', time: 'exhausted', life: 'wounded', energy: 'wounded' },
    build(c) {
      const k = CONDITIONS[c.arg]; const ticks = c.t([12, 24, 36, 72]);
      const lead = { cursed: 'lays a curse on the opponent', exhausted: 'drags at the opponent\'s every move',
        wounded: c.trad.id === 'magic.poison' ? 'gets into the opponent\'s blood' : c.sphere === 'energy' ? 'burns the opponent' : 'opens the opponent\'s flesh' }[c.arg];
      return { reach: 'iron', targeting: { type: 'agent', range: 0, filter: 'enemy' },
        effects: [{ type: 'inflict_condition', conditionTraitId: k.id, target: 'counterpart', durationTicks: ticks }],
        text: `Cast in a fight, it ${lead}: they are left ${k.name} (${k.gloss}) ${dur(ticks)}.`,
        names: { nouns: ['Hex', 'Blight', 'Canker'], verbs: ['Curse', 'Blight', 'Sour'], objects: ['the Foe', 'Their Luck'] } };
    } },
  { id: 'fight.trade_answer', fightVocab: true, arena: 'fight', agency: 'carried', tiers: [1, 2], themes: ['war', 'curse', 'fear'], riders: ['favoured_combat'],
    spheres: { darkness: 'terrified', spirit: 'shaken', entropy: 'cursed', life: 'wounded', energy: 'wounded', mind: 'shaken' },
    build(c) {
      const k = CONDITIONS[c.arg]; const ticks = c.t([12, 12, 24, 36]);
      return { reach: 'iron', targeting: { type: 'self' },
        effects: [{ type: 'reactive', trigger: 'attacked', cooldown: 12,
          effect: { type: 'inflict_condition', conditionTraitId: k.id, target: 'counterpart', durationTicks: ticks } }],
        text: `When blows are traded, the spell answers for the bearer: the opponent is left ${k.name} (${k.gloss}) ${dur(ticks)}. It answers at most once a day.`,
        names: { nouns: ['Answer', 'Barb', 'Riposte'] } };
    } },
  { id: 'fight.trophy', fightVocab: true, arena: 'fight', agency: 'carried', tiers: [1, 2], themes: ['war', 'death', 'curse'], riders: [],
    spheres: { entropy: true, energy: true, darkness: true, chaos: true, force: true },
    build(c) {
      const per = r2(c.m() / 3);
      return { reach: 'iron', targeting: { type: 'self' },
        effects: [{ type: 'stacking', reach: 'iron', valuePerStack: per, maxStacks: 3, stackOn: 'on_kill' }],
        text: `It keeps count. Each opponent the bearer overcomes makes them ${mag(per)} better at Iron, up to three times over, and the count never fades.`,
        names: { nouns: ['Tally', 'Trophy', 'Hunger'] } };
    } },
  { id: 'fight.last_stand', arena: 'fight', agency: 'carried', tiers: [0, 2], themes: ['ward', 'war', 'holy', 'heal'], riders: ['favoured_combat'],
    spheres: { order: true, matter: true, life: true, time: true, light: true, spirit: true, force: true },
    build(c) {
      const mm = c.t([0.05, 0.1, 0.15, 0.2]);
      return { reach: 'iron', targeting: { type: 'self' },
        effects: [{ type: 'test_shaper', trigger: 'failure', steps: 1, condition: 'in_combat', maxMargin: mm }],
        text: `When a fight turns against the bearer, the spell catches them: an exchange they would lose by ${margin(mm)} counts as a near miss instead. They take no wound, and their blow still lands.`,
        names: { nouns: ['Footing', 'Brace', 'Anchor', 'Guard'] } };
    } },
  { id: 'fight.ward_wounds', arena: 'fight', agency: 'carried', tiers: [2, 2], themes: ['ward', 'holy'], riders: [],
    spheres: { order: true, matter: true, spirit: true, light: true },
    build() {
      return { reach: 'iron', targeting: { type: 'self' },
        effects: [{ type: 'tag_immunity', tags: ['#combat'], condition: 'in_combat' }],
        text: 'In a fight, hurts slide off the bearer: they cannot be left Wounded or Terrified there. They can still be worn down.',
        names: { nouns: ['Mail', 'Hide', 'Shell'] } };
    } },

  // ─────────────── ENCOUNTER ───────────────
  { id: 'enc.calling', arena: 'encounter', agency: 'carried', tiers: [0, 2], themes: null, riders: ['favoured'], spheres: ALL,
    build(c) {
      const mult = c.t([1.25, 1.35, 1.5, 1.5]);
      return { reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'behavior_weight', reach: c.reach, multiplier: mult }],
        text: `The bearer is drawn to ${REACH_PULL[c.reach]}: they seek out ${R(c.reach)} encounters ${oftener(mult)} than they otherwise would.`,
        names: { nouns: ['Call', 'Lure', 'Pull'] } };
    } },
  { id: 'enc.favoured', arena: 'encounter', agency: 'carried', tiers: [0, 2], themes: null, riders: ['calling'], spheres: ALL,
    build(c) {
      // The situation comes from the tradition first, the sphere second, and the Reach comes
      // from the situation — but only a Reach the sphere actually leans on, so a Light spell
      // never hands out a Shadow bonus. A situation with no such Reach is skipped.
      const leansOn = (cond) => COND_REACH[cond].filter((r) => (c.S.reaches[r] ?? 0) > 0 || r === c.themeReach);
      const tradCond = c.tradEnv.cond && leansOn(c.tradEnv.cond).length ? c.tradEnv.cond : null;
      const sphereConds = c.S.conditions.filter((k) => leansOn(k).length);
      const cond = tradCond && (c.rng() < 0.7 || !sphereConds.length) ? tradCond : pick(c.rng, sphereConds.length ? sphereConds : c.S.conditions);
      const pool = leansOn(cond).length ? leansOn(cond) : COND_REACH[cond];
      const reach = weighted(c.rng, pool.map((r) => [r, (c.S.reaches[r] ?? 0) + (r === c.themeReach ? 2 : 0) + 0.5]));
      const v = r2(Math.min(EFFECT_PER_ITEM_CAP, c.m() * 1.2));
      return { reach, targeting: { type: 'self' },
        effects: [{ type: 'conditional', condition: cond, reach, value: v }],
        text: `When the bearer is ${COND_PHRASE[cond]}, they are ${better(v)} at ${R(reach)}.`,
        names: { nouns: COND_NOUNS[cond] } };
    } },
  { id: 'enc.second_chance', arena: 'encounter', agency: 'carried', tiers: [1, 2], themes: ['luck', 'time', 'sight'], riders: ['calling'],
    spheres: { time: true, chaos: true, light: true, mind: true, entropy: true },
    build(c) {
      const steps = c.tierIdx >= 2 ? 2 : 1;
      return { reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'test_shaper', trigger: 'near_miss', steps, reach: c.reach }],
        text: steps === 2
          ? `When the bearer only just fails at ${R(c.reach)}, the spell tips it: the near miss becomes a clean success.`
          : `When the bearer only just fails at ${R(c.reach)}, the spell tips it: the near miss becomes a success, at a price.`,
        names: { nouns: ['Second Chance', 'Tipping', 'Nudge'] } };
    } },
  { id: 'enc.easy_company', arena: 'encounter', agency: 'carried', tiers: [0, 1], themes: ['mind', 'holy', 'heal'], riders: ['favoured'],
    spheres: { mind: 'any', light: 'any', life: 'different_faction', spirit: 'any', order: 'same_faction' },
    build(c) {
      const b = c.t([0.1, 0.15, 0.2, 0.2]);
      const who = { any: 'people', different_faction: 'people outside their faction', same_faction: 'their own people' }[c.arg];
      return { reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'social_modifier', targetFilter: c.arg, cooperationBias: b }],
        text: `The bearer is easy to deal with: ${who} are ${readier(b)} to cooperate with them.`,
        names: { nouns: ['Welcome', 'Manner', 'Open Hand'] } };
    } },
  { id: 'enc.rally', arena: 'encounter', agency: 'carried', tiers: [1, 2], themes: ['war', 'holy', 'ward'], riders: [],
    spheres: { order: true, spirit: true, force: true, light: true, life: true },
    build(c) {
      const v = r2(c.m() * 0.7);
      return { reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'aura', radius: 1, target: 'allies', reach: c.reach, value: v }],
        text: `Allies near the bearer do ${better(v)} at ${R(c.reach)}. It reaches anyone of the bearer's faction within ${hexes(1)}.`,
        names: { nouns: ['Banner', 'Rally', 'Standard'] } };
    } },
  { id: 'enc.dread', arena: 'encounter', agency: 'carried', tiers: [1, 2], themes: ['fear', 'death', 'curse'], riders: [],
    spheres: { darkness: true, entropy: true, chaos: true, spirit: true },
    build(c) {
      const v = -r2(c.m() * 0.7);
      return { reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'aura', radius: 1, target: 'enemies', reach: c.reach, value: v }],
        text: `Enemies near the bearer do ${better(v)} at ${R(c.reach)}. It unsettles anyone of a hostile faction within ${hexes(1)}.`,
        names: { nouns: ['Dread', 'Pall', 'Chill'] } };
    } },
  { id: 'enc.mending', arena: 'encounter', agency: 'carried', tiers: [1, 2], themes: ['heal', 'holy', 'wild'], riders: ['calling'],
    spheres: { life: true, spirit: true, time: true, light: true },
    build(c) {
      const mult = c.tierIdx >= 2 ? 2.0 : 1.5; const ticks = c.t([24, 24, 48, 72]);
      return { reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'reactive', trigger: 'damaged', cooldown: 24,
          effect: { type: 'modify_rules', scope: { scope: 'self' }, rule: 'healing_multiplier', value: mult, ticks } }],
        text: `When the bearer is hurt, the spell answers: ${dur(ticks)}, their wounds and ailments pass ${mult >= 2 ? 'twice as fast' : 'half again as fast'}.`,
        names: { nouns: ['Mending', 'Knitting', 'Balm'] } };
    } },
  { id: 'enc.clean_hands', arena: 'encounter', agency: 'carried', tiers: [1, 1], themes: ['heal', 'holy'], riders: [],
    spheres: { life: 'wounded', light: 'terrified', spirit: 'grieving', order: 'shaken' },
    build(c) {
      const k = CONDITIONS[c.arg]; const p = 0.35;
      const eased = { wounded: 'their wounds close', terrified: 'their fear lifts', grieving: 'their grief eases', shaken: 'their doubts settle' }[c.arg];
      return { reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'action_trigger', on: 'encounter_success', probability: p, cooldownTicks: 24,
          payload: { kind: 'condition_remove', conditionTraitId: k.id } }],
        text: `Success steadies the bearer: after a success, ${eased} ${prob(p)}, and the ${k.name} condition is lifted.`,
        names: { nouns: ['Clean Hands', 'Ease', 'Settling'] } };
    } },
  { id: 'enc.linger', arena: 'encounter', agency: 'carried', tiers: [2, 2], themes: ['time'], riders: [],
    spheres: { time: true, matter: true },
    build() {
      return { reach: 'veil', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'duration_decay_multiplier', value: 0.6, ticks: 'permanent' }],
        text: 'Time runs slow around the bearer: every blessing and every hurt they carry lasts much longer than it should. The good and the bad alike.',
        names: { nouns: ['Amber', 'Long Hour', 'Stillness'] } };
    } },
  { id: 'enc.quickening', arena: 'encounter', agency: 'carried', tiers: [1, 2], themes: ['time', 'luck', 'war'], riders: [],
    spheres: { energy: true, time: true, chaos: true },
    build(c) {
      const mult = c.t([0.8, 0.75, 0.6, 0.6]);
      return { reach: 'veil', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'cooldown_multiplier', value: mult, ticks: 'permanent' }],
        text: `The bearer's other spells come back to them ${sooner(mult)}.`,
        names: { nouns: ['Quickening', 'Kindling', 'Return'] } };
    } },
  { id: 'enc.learning', arena: 'encounter', agency: 'carried', tiers: [1, 2], themes: ['sight', 'mind', 'time', 'craft'], riders: [],
    spheres: { mind: true, time: true, light: true },
    build(c) {
      const mult = c.t([0.85, 0.85, 0.75, 0.75]);
      return { reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'tier_advancement_cost_multiplier', value: mult, ticks: 'permanent' }],
        text: `The bearer learns quickly: growing more skilled at anything costs them ${mult <= 0.75 ? 'a good deal' : 'a little'} less than it costs others.`,
        names: { nouns: ['Aptitude', 'Quick Study', 'Lesson'] } };
    } },
  { id: 'enc.fortune', arena: 'encounter', agency: 'carried', tiers: [2, 2], themes: ['luck'], riders: [],
    spheres: { chaos: true, entropy: true, light: true },
    build() {
      return { reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'reward_tier_bonus', value: 1, ticks: 'permanent' }],
        text: 'Luck follows the bearer: whatever they find or win is a grade better than it would have been.',
        names: { nouns: ['Windfall', 'Luck', 'Fortune'] } };
    } },
  { id: 'enc.oath', arena: 'encounter', agency: 'carried', tiers: [1, 1], themes: ['holy', 'ward', 'mind'], riders: [],
    spheres: { order: true, light: true },
    build() {
      return { reach: 'gold', targeting: { type: 'self' },
        effects: [
          { type: 'modify_rules', scope: { scope: 'self' }, rule: 'faction_influence_multiplier', value: 1.3, ticks: 'permanent' },
          { type: 'social_modifier', targetFilter: 'same_faction', cooperationBias: 0.1 },
        ],
        text: 'The bearer\'s word carries weight: their standing with factions grows faster, and their own people are readier to work with them.',
        names: { nouns: ['Oath', 'Word', 'Bond'] } };
    } },
  { id: 'enc.soul_ward', arena: 'encounter', agency: 'carried', tiers: [0, 1], themes: ['ward', 'holy', 'death'], riders: [],
    spheres: { spirit: true, order: true, life: true, matter: true },
    build(c) {
      const amt = c.t([0.03, 0.05, 0.08, 0.08]);
      return { reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'prevent_loss', channel: 'quintessence', amount: amt, consumeOnPrevent: true }],
        text: `The next time the bearer would be worn thin, the spell takes ${amt >= 0.05 ? 'most of the loss' : 'a small part of the loss'} instead, and is used up doing it.`,
        names: { nouns: ['Ward', 'Keepsake', 'Last Coin'] } };
    } },
  { id: 'enc.refuse_death', arena: 'encounter', agency: 'cast', tiers: [2, 3], themes: ['death', 'heal', 'time'], riders: [],
    spheres: { life: true, spirit: true, entropy: true, time: true },
    build(c) {
      const ticks = c.t([24, 24, 36, 72]);
      return { reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'death_prevented', value: true, ticks }],
        text: `Cast when death is close. ${cap(dur(ticks))}, death cannot take the caster: whatever should kill them, they live through it.`,
        names: { nouns: ['Refusal', 'Stay', 'Reprieve'], verbs: ['Refuse', 'Deny', 'Cheat'], objects: ['the Grave', 'Death'] } };
    } },
  { id: 'enc.steel', arena: 'encounter', agency: 'cast', tiers: [1, 2], themes: ['holy', 'heal', 'war', 'mind'], riders: ['afterglow'],
    spheres: { light: 'blessed', spirit: 'blessed', life: 'inspired', energy: 'inspired', order: 'inspired' },
    build(c) {
      const k = CONDITIONS[c.arg]; const ticks = c.t([12, 12, 24, 36]);
      return { reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'inflict_condition', conditionTraitId: k.id, target: 'self', durationTicks: ticks }],
        text: `Cast before a hard task. The caster is ${c.arg === 'blessed' ? 'Blessed' : 'Inspired'} (${k.gloss}) ${dur(ticks)}.`,
        names: { nouns: ['Kindling', 'Resolve', 'Grace'], verbs: ['Steel', 'Bless', 'Gird'], objects: ['the Nerve', 'the Self', 'the Hour'] } };
    } },
  { id: 'enc.hush', arena: 'encounter', agency: 'cast', tiers: [1, 3], themes: ['ward', 'mind', 'curse'], riders: [],
    spheres: { order: true, entropy: true, darkness: true, mind: true },
    build(c) {
      const ticks = c.t([12, 12, 24, 48]);
      return { reach: 'veil', targeting: { type: 'self' },
        effects: [{ type: 'suppress', target: 'all_effects', scope: { scope: 'radius', hexes: 1 }, ticks }],
        text: `The caster silences the magic around them: ${dur(ticks)}, every spell and charm carried by anyone within ${hexes(1)} goes quiet, friend and foe alike.`,
        names: { nouns: ['Hush', 'Silence', 'Stillness'], verbs: ['Still', 'Hush', 'Smother'], objects: ['the Craft', 'the Air'] } };
    } },
  { id: 'enc.lift_curse', arena: 'encounter', agency: 'cast', tiers: [1, 2], themes: ['heal', 'holy'], riders: ['afterglow'],
    spheres: { light: true, life: true, spirit: true, order: true },
    build() {
      return { reach: 'heart', targeting: { type: 'agent', range: 0, filter: 'ally' },
        effects: [{ type: 'dispel', target: 'condition', tags: ['#negative'] }],
        text: 'The caster lifts one hurt from someone at their side: a wound, a curse or a fear is gone.',
        names: { nouns: ['Lifting', 'Unbinding', 'Cleansing'], verbs: ['Lift', 'Loose', 'Wash'], objects: ['the Mark', 'the Curse'] } };
    } },

  // ─────────────── WORLD MAP: TRAVEL ───────────────
  { id: 'travel.swift', arena: 'travel', agency: 'carried', tiers: [0, 2], themes: ['travel', 'wild'], riders: ['calling_star'],
    spheres: { force: true, energy: true, time: true, chaos: true, life: true },
    build(c) {
      const mult = c.t([0.85, 0.75, 0.65, 0.65]);
      return { reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'range_modifier', movementCostMultiplier: mult }],
        text: `The road is shorter for the bearer: they travel ${faster(mult)} than others, whatever the ground.`,
        names: { nouns: ['Stride', 'Road', 'Step'] } };
    } },
  { id: 'travel.burst', arena: 'travel', agency: 'cast', tiers: [1, 3], themes: ['travel', 'wild'], riders: [],
    spheres: { force: true, energy: true, chaos: true, time: true },
    build(c) {
      const mult = c.tierIdx >= 3 ? 0.5 : 0.6; const ticks = c.t([12, 12, 24, 36]);
      const how = c.tradEnv.road ? `, ${c.tradEnv.road}` : '';
      return { reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'movement_cost_multiplier', value: mult, ticks }],
        text: `Cast before a journey. ${cap(dur(ticks))}, the caster travels ${faster(mult)}${how}.`,
        names: { nouns: ['Run', 'Dash', 'Flight'], verbs: ['Shorten', 'Outrun', 'Take'], objects: ['the Road', 'the Miles'] } };
    } },

  // ─────────────── WORLD MAP: SIGHT ───────────────
  { id: 'sight.far', arena: 'sight', agency: 'carried', tiers: [0, 2], themes: ['sight', 'wild'], riders: ['favoured'],
    spheres: { light: true, mind: true, time: true, spirit: true },
    build(c) {
      const n = c.tierIdx + 1;
      return { reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'range_modifier', awarenessRangeBonus: n }],
        text: `The bearer notices trouble early: they see what is happening ${hexes(n)} further off than they otherwise would.`,
        names: { nouns: ['Watch', 'Farsight', 'Lookout'] } };
    } },
  { id: 'sight.lamp', arena: 'sight', agency: 'carried', tiers: [1, 2], themes: ['sight', 'holy'], riders: [],
    spheres: { light: true, mind: true, time: true },
    build(c) {
      const n = c.tierIdx >= 2 ? 3 : 2;
      return { reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'reveal', target: 'encounters', range: n }],
        text: `Nothing near the bearer stays hidden from them: they always notice what is happening within ${hexes(n)}, even in fog or when their wits are dull.`,
        names: { nouns: ['Lamp', 'Lantern', 'Window'] } };
    } },
  { id: 'sight.survey', arena: 'sight', agency: 'carried', tiers: [0, 2], themes: ['sight', 'travel', 'wild'], riders: [],
    spheres: { light: true, time: true, mind: true, spirit: true, life: true },
    build(c) {
      const n = c.tierIdx + 1;
      return { reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'reveal', target: 'hexes', range: n }],
        text: `The bearer knows the land: whenever they arrive somewhere, every place within ${hexes(n)} goes onto their map.`,
        names: { nouns: ['Survey', 'Wayfinding', 'Chart'] } };
    } },
  { id: 'sight.scry', arena: 'sight', agency: 'cast', tiers: [1, 3], themes: ['sight', 'time', 'death'], riders: [],
    spheres: { light: true, mind: true, time: true, spirit: true, darkness: true },
    build(c) {
      const n = c.tierIdx >= 3 ? 3 : 2; const ticks = c.t([12, 12, 24, 36]);
      return { reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'awareness_range_bonus', value: n, ticks }],
        text: `Cast to look far. ${cap(dur(ticks))}, the caster notices what is happening ${hexes(n)} further off than usual.`,
        names: { nouns: ['Scrying', 'Far Look', 'Glass'], verbs: ['Open', 'Search', 'Read'], objects: ['the Distance', 'the Land'] } };
    } },

  { id: 'sight.uncover', arena: 'sight', agency: 'cast', tiers: [1, 3], themes: ['sight', 'holy', 'mind'], riders: [],
    spheres: { light: true, mind: true, spirit: true, time: true },
    build(c) {
      const n = c.tierIdx >= 3 ? 3 : 2; const ticks = c.t([12, 12, 24, 36]);
      return { reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'reveal', target: 'encounters', range: n, duration: ticks }],
        text: `Cast to see what is hidden. ${cap(dur(ticks))}, nothing within ${hexes(n)} of the caster stays hidden from them: fog, shrouds and their own dull wits make no difference.`,
        names: { nouns: ['Uncovering', 'Clear Sight', 'Lamp'], verbs: ['Uncover', 'Light', 'Bare'], objects: ['the Hidden', 'the Dark'] } };
    } },

  // ─────────────── WORLD MAP: MARK ───────────────
  { id: 'mark.ward', arena: 'mark', agency: 'cast', tiers: [1, 3], themes: ['ward', 'craft', 'holy'], riders: [],
    spheres: { order: true, matter: true, spirit: true, light: true },
    build(c) {
      const ticks = c.tierIdx >= 3 ? 'permanent' : c.t([24, 24, 48, 48]);
      const verb = c.tradEnv.ward ?? 'sets a ward on';
      const when = ticks === 'permanent' ? 'From then on' : cap(dur(ticks));
      return { reach: 'stone', targeting: { type: 'hex', range: 0 },
        effects: [{ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'warded', ticks }],
        text: `The caster ${verb} the ground where they stand. ${when}, anyone crossing that hex does so at little more than half pace.`,
        names: { nouns: ['Ward', 'Threshold', 'Barrier'], verbs: ['Bar', 'Seal', 'Close'], objects: ['the Road', 'the Ground', 'the Way'] } };
    } },
  { id: 'mark.fog', arena: 'mark', agency: 'cast', tiers: [1, 2], themes: ['conceal', 'wild', 'mind'], riders: [],
    spheres: { darkness: true, chaos: true, mind: true, time: true },
    build(c) {
      const ticks = c.t([24, 24, 48, 48]);
      return { reach: 'shadow', targeting: { type: 'hex', range: 0 },
        effects: [{ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'shrouded', ticks }],
        text: `The caster raises a mist over the hex they stand in. ${cap(dur(ticks))}, anyone inside it notices less of what goes on around them, the caster included.`,
        names: { nouns: ['Mist', 'Murk', 'Blind'], verbs: ['Cloud', 'Hood', 'Fog'], objects: ['the Road', 'the Hex', 'the Hollow'] } };
    } },
  { id: 'mark.drift', arena: 'mark', agency: 'carried', tiers: [0, 2], themes: null, riders: [], spheres: ALL,
    build(c) {
      const prop = THEME_HEX[c.tradEnv.themes?.[0]] ?? c.S.hexProp; const v = c.t([0.002, 0.004, 0.006, 0.006]);
      const text = {
        divineInfluence: 'Wherever the bearer stays, the land slowly grows holy: the hex\'s divine influence rises a little each day they remain.',
        corruption: 'Wherever the bearer stays, the land slowly sours: corruption creeps into the hex a little each day they remain.',
        explorationAttraction: 'Wherever the bearer stays, the place starts to draw the curious: the hex pulls more wanderers and seekers the longer they remain.',
      }[prop];
      return { reach: 'stone', targeting: { type: 'self' },
        effects: [{ type: 'hex_effect', property: prop, value: v, mode: 'add', radius: 0 }],
        text, names: { nouns: { divineInfluence: ['Hallowing', 'Blessing'], corruption: ['Souring', 'Taint'], explorationAttraction: ['Beacon Fire', 'Lure'] }[prop] } };
    } },
  { id: 'mark.arrival_ward', arena: 'mark', agency: 'carried', tiers: [1, 2], themes: ['ward', 'conceal', 'holy'], riders: [],
    spheres: { order: 'warded', matter: 'warded', spirit: 'warded', darkness: 'shrouded' },
    build(c) {
      const overlay = c.arg;
      return { reach: 'stone', targeting: { type: 'self' },
        effects: [{ type: 'reactive', trigger: 'entered_hex', cooldown: 12,
          effect: { type: 'alter_terrain', target: 'self_hex', terrainEffect: overlay, ticks: 12 } }],
        text: overlay === 'warded'
          ? 'Wherever the bearer settles, the ground is warded: on each arrival, their hex becomes slow to cross for a day.'
          : 'Wherever the bearer settles, a mist rises: on each arrival, their hex is shrouded for a day, and everyone in it, the bearer too, notices less.',
        names: { nouns: overlay === 'warded' ? ['Doorstone', 'Hearthward'] : ['Mistcloak', 'Hood'] } };
    } },
];

/** Riders — the "variation" on an authored core. Each reinforces the core's own Reach. */
const RIDERS = {
  calling: { agency: 'carried', build: (c, reach) => ({ type: 'behavior_weight', reach, multiplier: 1.2 }),
    text: (e) => `It also draws the bearer toward ${REACH_PULL[e.reach]}.` },
  calling_star: { agency: 'carried', build: () => ({ type: 'behavior_weight', reach: 'star', multiplier: 1.2 }),
    text: () => 'It also gives the bearer itchy feet: they take to the road more often.' },
  favoured: { agency: 'carried', build: (c, reach) => {
      const fits = Object.entries(COND_REACH).filter(([, rs]) => rs.includes(reach)).map(([k]) => k);
      return { type: 'conditional', condition: fits.length ? pick(c.rng, fits) : pick(c.rng, c.S.conditions), reach, value: r2(c.m() * 0.6) };
    },
    text: (e) => `They are also ${better(e.value)} at ${R(e.reach)} when ${COND_PHRASE[e.condition]}.` },
  favoured_combat: { agency: 'carried', build: (c) => ({ type: 'conditional', condition: 'in_combat', reach: 'iron', value: r2(c.m() * 0.5) }),
    text: (e) => `They are also ${better(e.value)} at Iron in a fight.` },
  afterglow: { agency: 'cast', build: (c, reach) => ({ type: 'duration', reach, value: r2(c.m() * 0.5), ticks: 6, destroyOnExpiry: true }),
    text: (e) => `Afterwards, the caster is ${better(e.value)} at ${R(e.reach)} for half a day.` },
};

// ═══════════════════════════════════════════════════════════════════
// 7. FREE-COMPOSITION extras — legal union values an unconstrained composer
//    also reaches for. Only the free mode sees these.
// ═══════════════════════════════════════════════════════════════════

const RAW_ATOMS = [
  { id: 'raw.overlay', arenas: ['mark'], agency: 'cast', spheres: 'any', nouns: ['Ground', 'Field', 'Hallow'],
    build: (c) => ({ type: 'alter_terrain', target: 'self_hex', ticks: c.t([24, 24, 48, 72]),
      terrainEffect: pick(c.rng, { light: ['sacred_ground', 'hallowed'], spirit: ['hallowed', 'sacred_ground'], entropy: ['blighted', 'cursed_ground'],
        darkness: ['cursed_ground'], life: ['fertile_ground'], time: ['frozen'], energy: ['volcanic'], chaos: ['wild_magic', 'contested'],
        force: ['contested'], matter: ['frozen'], mind: ['shrouded'], order: ['warded'] }[c.sphere]) }) },
  { id: 'raw.fear_ward', arenas: ['encounter', 'fight'], agency: 'carried', spheres: ['light', 'order', 'spirit', 'force', 'mind'], nouns: ['Courage', 'Nerve'],
    build: () => ({ type: 'tag_immunity', tags: ['#fear'] }) },
  { id: 'raw.poison_ward', arenas: ['encounter'], agency: 'carried', spheres: ['life', 'matter', 'order'], nouns: ['Antidote', 'Clean Blood'],
    build: () => ({ type: 'tag_immunity', tags: ['#poison'] }) },
  { id: 'raw.mark', arenas: ['encounter'], agency: 'carried', spheres: 'any', nouns: ['Mark', 'Touch'],
    build: (c) => ({ type: 'trait_grant', grantedTrait: `proto.${c.sphere}_touched` }) },
  { id: 'raw.condition_ward', arenas: ['encounter', 'fight'], agency: 'carried', spheres: ['order', 'matter', 'spirit', 'life'], nouns: ['Ward', 'Aegis'],
    build: (c) => ({ type: 'prevent_loss', channel: 'condition', amount: c.t([0.03, 0.05, 0.08, 0.08]) }) },
  { id: 'raw.drift', arenas: ['encounter'], agency: 'carried', spheres: 'any', nouns: ['Leaning', 'Temper'],
    build: (c) => ({ type: 'axiological_drift', axis: AXIS[c.reach].pair, ratePerTick: 0.002, limitValue: 0.4 }) },
];

/** Generic per-primitive clause — what free composition says, with no authored sentence. */
function clause(e, subj) {
  const S = cap(subj);
  switch (e.type) {
    case 'passive': case 'permanent': return `${S} is ${better(e.value)} at ${R(e.reach)}.`;
    case 'conditional': return `When ${COND_PHRASE[e.condition]}, ${subj} is ${better(e.value)} at ${R(e.reach)}.`;
    case 'duration': return `${cap(dur(e.ticks))}, ${subj} is ${better(e.value)} at ${R(e.reach)}.`;
    case 'behavior_weight': return `${S} seeks out ${R(e.reach)} encounters ${oftener(e.multiplier)}.`;
    case 'social_modifier': return `Others are ${readier(e.cooperationBias)} to cooperate with ${subj}.`;
    case 'test_shaper': return `When ${subj} ${e.trigger === 'near_miss' ? 'narrowly fails' : 'fails'}${e.reach ? ` at ${R(e.reach)}` : ''}${e.condition ? ` ${COND_PHRASE[e.condition]}` : ''}, the result is lifted ${e.steps > 1 ? 'two steps' : 'a step'}.`;
    case 'aura': return `${e.target === 'allies' ? 'Allies' : e.target === 'enemies' ? 'Enemies' : 'Everyone'} near ${subj} do ${better(e.value)} at ${R(e.reach)}.`;
    case 'range_modifier':
      if (e.movementCostMultiplier) return `${S} travels ${faster(e.movementCostMultiplier)}.`;
      return `${S} notices encounters ${hexes(e.awarenessRangeBonus)} further off.`;
    case 'reveal': return e.target === 'hexes' ? `On arriving anywhere, ${subj} learns the land within ${hexes(e.range)}.` : `${S} always notices encounters within ${hexes(e.range)}.`;
    case 'alter_terrain': return `The ground where ${subj} stands becomes ${OVERLAY_WORDS[e.terrainEffect]} ${dur(e.ticks)}.`;
    case 'hex_effect': return `Wherever ${subj} stays, the hex's ${{ divineInfluence: 'divine influence', corruption: 'corruption', explorationAttraction: 'pull on wanderers' }[e.property]} rises a little each day.`;
    case 'modify_rules': return ruleClause(e, subj);
    case 'suppress': return `${cap(dur(e.ticks))}, magic near ${subj} goes quiet.`;
    case 'dispel': return `One hurt is lifted from ${subj === 'the caster' ? 'someone nearby' : subj}.`;
    case 'tag_immunity': return `${S} cannot be given conditions marked ${e.tags.map((t) => t.replace('#', '')).join(' or ')}${e.condition ? ` ${COND_PHRASE[e.condition]}` : ''}.`;
    case 'prevent_loss': return e.channel === 'quintessence' ? `The next time ${subj} would be worn thin, the loss is softened.` : `The next time ${subj} would be given a harmful condition, it is softened.`;
    case 'reactive': {
      const when = { attacked: 'blows are traded', damaged: `${subj} is hurt`, healed: `${subj} is rescued from a hurt`, entered_hex: `${subj} arrives somewhere` }[e.trigger] ?? e.trigger;
      return `When ${when}, ${lc(clause(e.effect, subj))}`;
    }
    case 'stacking': return `Each time ${subj} ${e.stackOn === 'on_kill' ? 'overcomes an opponent' : 'wins a fight'}, they grow ${mag(e.valuePerStack)} better at ${R(e.reach)}, up to a point.`;
    case 'resource_manipulate': return e.resource === 'fight_clock' ? `The opponent's clock fills by ${e.amount >= 2 ? 'two segments' : 'a segment'}.` : `${S} ${e.amount < 0 ? 'loses' : 'gains'} a little ${e.resource} every day.`;
    case 'inflict_condition': return `${e.target === 'self' ? S : 'The opponent'} is left ${condName(e.conditionTraitId)} ${dur(e.durationTicks)}.`;
    case 'action_trigger': return `After ${{ encounter_success: 'a success', encounter_failure: 'a failure', encounter_critical_failure: 'a disaster' }[e.on] ?? e.on}, ${payloadClause(e.payload, subj)}${e.probability != null ? `, ${prob(e.probability)}` : ''}.`;
    case 'trait_grant': return `${S} bears the mark "${e.grantedTrait.replace('proto.', '').replace('_', '-')}".`;
    case 'axiological_drift': return `${S} slowly grows ${e.ratePerTick > 0 ? 'more principled' : 'less principled'}.`;
    case 'decay': return `A weakness at ${R(e.reach)} deepens, then lifts.`;
    case 'action_gate': return `${S} cannot do ${R(e.reach)} work.`;
    default: return `(${e.type})`;
  }
}
const OVERLAY_WORDS = {
  sacred_ground: 'Sacred Ground (stronger at Star, weaker at Shadow)', blighted: 'Blighted Land (weaker at Stone and Heart)',
  fertile_ground: 'Fertile Ground (more births)', frozen: 'Frozen (slow to cross, weaker at Iron)', volcanic: 'Volcanic (stronger at Iron)',
  shrouded: 'Shrouded (those inside see less far)', warded: 'Warded (slow to cross)', hallowed: 'Hallowed (death is held off)',
  cursed_ground: 'Cursed Ground (the doom quickens)', wild_magic: 'Wild Magic (spells return faster and go wrong harder)', contested: 'Contested (more fighting)',
};
const condName = (id) => Object.values(CONDITIONS).find((k) => k.id === id)?.name ?? id;
function payloadClause(p, subj) {
  switch (p.kind) {
    case 'condition_grant': return `${subj} is left ${condName(p.conditionTraitId)}`;
    case 'condition_remove': return `${subj} sheds the ${p.conditionTraitId ? condName(p.conditionTraitId) : 'hurt'} condition`;
    case 'self_remove': return 'the spell leaves them';
    default: return p.kind;
  }
}
function ruleClause(e, subj) {
  const S = cap(subj); const d = e.ticks === 'permanent' ? '' : ` ${dur(e.ticks)}`;
  switch (e.rule) {
    case 'encounter_reach_override': return `${S} uses ${R(e.value.to)} in place of ${R(e.value.from)}${d}.`;
    case 'movement_cost_multiplier': return e.value < 1 ? `${S} travels ${faster(e.value)}${d}.` : `${S} travels ${slower(e.value)}${d}.`;
    case 'cooldown_multiplier': return e.value < 1 ? `${S}'s spells return ${sooner(e.value)}${d}.` : `${S}'s spells return slower${d}.`;
    case 'awareness_range_bonus': return `${S} notices encounters ${e.value > 0 ? `${hexes(e.value)} further off` : 'less far off'}${d}.`;
    case 'healing_multiplier': return `${S}'s hurts pass faster${d}.`;
    case 'duration_decay_multiplier': return `Everything ${subj} carries lasts longer${d}.`;
    case 'death_prevented': return `Death cannot take ${subj}${d}.`;
    case 'reward_tier_bonus': return `What ${subj} finds is a grade better.`;
    case 'tier_advancement_cost_multiplier': return `${S} learns faster.`;
    case 'faction_influence_multiplier': return `${S}'s standing with factions grows faster.`;
    case 'doom_rate_multiplier': return `The world's doom comes ${e.value > 1 ? 'sooner' : 'later'}.`;
    case 'backlash_severity_multiplier': return `${S}'s miscasts are ${e.value > 1 ? 'worse' : 'milder'}${d}.`;
    default: return `${e.rule} changes for ${subj}${d}.`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 8. PRICE composer — agency-aware. A fate-woven spell is never cast, so its
//    price must be written as effects it carries, not as a SpellCost.
// ═══════════════════════════════════════════════════════════════════

function composePrice(c) {
  const layer = c.priceLayer;
  const out = { costs: [], riders: [], backlash: undefined, costText: '', wrongText: '', notice: false };
  const chooseMiscast = () => {
    const id = c.mode === 'free'
      ? pick(c.rng, [...c.S.miscasts, ...c.S.rawMiscasts])
      : weighted(c.rng, c.S.miscasts.map((m) => [m, liveness(CAST_MISCASTS[m].build(c)) === 'live' ? 2 : 1]));
    const e = CAST_MISCASTS[id].build(c);
    return { id, e, text: CAST_MISCASTS[id].text(e) };
  };
  const turn = CONDITIONS[c.S.turn];

  if (c.agency === 'cast') {
    if (layer === 'free') {
      out.costText = 'Free. Casting it costs the caster nothing.';
      out.wrongText = 'Little. If the casting fails, it simply fails.';
    } else if (layer === 'strain') {
      const kind = weighted(c.rng, { exhaust: 0.4, exhausted: 0.35, drain: 0.25 });
      if (kind === 'exhaust') {
        const t = c.t([6, 6, 12, 24]);
        out.costs.push({ type: 'tick_exhaust', ticks: t });
        out.costText = `Strain. Casting it spends the caster: they cannot cast again ${dur(t)}.`;
      } else if (kind === 'exhausted') {
        out.costs.push({ type: 'condition_inflict', template: 'exhausted' });
        out.costText = `Strain. Casting it leaves the caster Exhausted (${CONDITIONS.exhausted.gloss}) until it wears off.`;
      } else {
        const reach = pick(c.rng, ['veil', c.reach]);
        out.costs.push({ type: 'reach_drain', reach, amount: r2(c.m() * 0.5) });
        out.costText = `Strain. It draws on the caster's own ${R(reach)}, leaving them weaker at it for a while.`;
      }
      const mc = chooseMiscast(); const p = r2(0.25 + 0.1 * c.rng());
      out.backlash = { trigger: 'failure', probability: p, severity: 'minor', effect: mc.e, narrativeTemplate: mc.text };
      out.wrongText = `If the casting fails, it ${prob(p)} rebounds: ${mc.text}.`;
    } else if (layer === 'gamble') {
      const mc = chooseMiscast(); const p = r2(c.t([0.2, 0.2, 0.28, 0.35]) + 0.05 * c.rng());
      out.backlash = { trigger: 'always', probability: p, severity: c.tierIdx >= 3 ? 'catastrophic' : 'major', effect: mc.e, narrativeTemplate: mc.text };
      out.costText = 'A gamble. It asks nothing up front.';
      out.wrongText = `Every casting is a risk, even a good one: ${prob(p)}, ${mc.text}.`;
    } else { // transgression
      const amt = c.t([8, 10, 15, 25]);
      out.costs.push({ type: 'doom_increase', amount: amt });
      out.notice = true;
      const mc = chooseMiscast(); const p = r2(0.6 + 0.2 * c.rng());
      out.backlash = { trigger: 'critical_failure', probability: p, severity: c.tierIdx >= 3 ? 'catastrophic' : 'major', effect: mc.e, narrativeTemplate: mc.text };
      out.costText = `Transgression. Each casting costs the caster ${soul(amt)}, so they grow more threadbare, and it is the kind of magic people notice.`;
      out.wrongText = `If the casting fails badly, it ${prob(p)} turns on them: ${mc.text}.`;
    }
    return out;
  }

  // ── carried (fate-woven) ──
  const coreReach = c.reach;
  if (layer === 'free') {
    out.costText = 'Free. Carrying it costs nothing beyond a place among the spells the bearer keeps ready.';
    if (c.tierIdx === 0) {
      out.wrongText = pick(c.rng, [
        'Nothing much. It is quiet, steady magic.',
        'Very little. It asks little and gives little.',
        'Nothing that matters. It is the kind of magic a village keeps.',
      ]);
    } else {
      out.riders.push({ type: 'action_trigger', on: 'encounter_critical_failure', probability: 0.15, payload: { kind: 'self_remove' } });
      out.wrongText = 'Rarely, when the bearer fails disastrously, the spell slips away from them for good.';
    }
  } else if (layer === 'strain') {
    const vow = THEME_VOW[c.tradEnv.themes?.[0]];
    const vowOk = !!vow && vow !== coreReach;
    const kind = weighted(c.rng, { weigh: 0.5, weary: 0.3, vow: vowOk ? 0.5 : 0 });
    if (kind === 'weigh') {
      const other = STRAIN_PAIR[coreReach] ?? 'heart'; const v = -r2(c.m() * 0.6);
      out.riders.push({ type: 'passive', reach: other, value: v });
      out.costText = `Strain. It weighs on the bearer: while they carry it, they are ${better(v)} at ${R(other)}.`;
    } else if (kind === 'weary') {
      out.riders.push({ type: 'action_trigger', on: 'encounter_success', probability: 0.25, cooldownTicks: 24,
        payload: { kind: 'condition_grant', conditionTraitId: CONDITIONS.exhausted.id, durationTicks: 12 } });
      out.costText = 'Strain. Every success comes with a toll: after one, the bearer is sometimes left Exhausted for a day.';
    } else {
      out.riders.push({ type: 'action_gate', mode: 'block', reach: vow });
      out.costText = `Strain, as a vow. While they carry it, the bearer will not do ${R(vow)} work at all.`;
    }
    out.riders.push({ type: 'action_trigger', on: 'encounter_critical_failure', probability: 0.25,
      payload: { kind: 'condition_grant', conditionTraitId: turn.id, durationTicks: 12 } });
    out.wrongText = `When the bearer fails disastrously, the spell sometimes turns on them: they are left ${turn.name} (${turn.gloss}) for a day.`;
  } else if (layer === 'gamble') {
    const lose = c.rng() < 0.35;
    if (lose) {
      const p = 0.5;
      out.riders.push({ type: 'action_trigger', on: 'encounter_critical_failure', probability: p, payload: { kind: 'self_remove' } });
      out.wrongText = `When the bearer fails disastrously, the spell ${prob(p)} leaves them for good.`;
    } else {
      const p = r2(c.t([0.3, 0.3, 0.4, 0.5]));
      out.riders.push({ type: 'action_trigger', on: 'encounter_failure', probability: p,
        payload: { kind: 'condition_grant', conditionTraitId: turn.id, durationTicks: 36 } });
      out.wrongText = `Whenever the bearer fails, the spell ${prob(p)} turns on them: they are left ${turn.name} (${turn.gloss}) for a few days.`;
    }
    out.costText = 'A gamble. It asks nothing up front.';
  } else { // transgression
    const worldScale = c.rng() < 0.5;
    if (worldScale) {
      const m = c.tierIdx >= 3 ? 1.1 : 1.05;
      out.riders.push({ type: 'modify_rules', scope: { scope: 'self' }, rule: 'doom_rate_multiplier', value: m, ticks: 'permanent' });
      out.costText = 'Transgression. While anyone carries it, the world\'s end comes a little sooner, and it is the kind of magic people notice.';
    } else {
      out.riders.push({ type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: r2(-0.0005 * (c.tierIdx + 1) * 10000) / 10000, mode: 'per_tick' });
      out.costText = 'Transgression. Carrying it wears the bearer thin: they lose a little quintessence every day, and it is the kind of magic people notice.';
    }
    out.notice = true;
    const drift = c.tradEnv.themes?.some((t) => ['death', 'curse', 'fear'].includes(t)) || c.rng() < 0.3;
    if (drift) {
      const ax = AXIS[coreReach] ?? AXIS.veil;
      out.riders.push({ type: 'axiological_drift', axis: ax.pair, ratePerTick: -0.002, limitValue: -0.5 });
      out.wrongText = `It changes them. Carrying it slowly makes the bearer more ${ax.vice}.`;
    } else {
      out.riders.push({ type: 'action_trigger', on: 'encounter_critical_failure', probability: 0.5,
        payload: { kind: 'condition_grant', conditionTraitId: turn.id, durationTicks: 36 } });
      out.wrongText = `When the bearer fails disastrously, the spell often turns on them: they are left ${turn.name} (${turn.gloss}) for a few days.`;
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// 9. NAME grammar
// ═══════════════════════════════════════════════════════════════════

function composeName(c, words, used) {
  const tw = c.tradEnv;
  const tAll = [...(tw.nouns ?? []), ...(tw.mass ?? [])];
  for (let attempt = 0; attempt < 16; attempt++) {
    const F = pick(c.rng, words.nouns);
    let name; let form;
    const imperative = c.agency === 'cast' && words.verbs && c.rng() < 0.6;
    if (imperative) {
      name = `${pick(c.rng, words.verbs)} ${pick(c.rng, words.objects)}`; form = 'imperative';
    } else if (F.includes(' ')) {
      name = F; form = 'noun'; // a two-word function noun ("Long Odds") stands alone
    } else {
      const useSphere = c.rng() < 0.3 || tAll.length === 0;
      const T = useSphere ? pick(c.rng, c.S.noun) : pick(c.rng, tAll);
      const Tmass = (tw.mass ?? []).includes(T) || ['Salt', 'Clay', 'Flint', 'Lead', 'Ash', 'Rot', 'Rust', 'Dust', 'Sand', 'Moss', 'Sap'].includes(T);
      const A = pick(c.rng, c.S.adj);
      // An act-noun ("Unbinding", "Mending") takes "The Mending" or "Pale Mending"; glued to a
      // thing-noun it turns to noun salad ("Ladder Unbinding").
      const act = /ing$/.test(F);
      const f = weighted(c.rng, act ? { the: 2, af: 2 } : { tf: 2, af: 3, ofT: Tmass ? 2 : 0, theTF: 1 });
      name = { tf: `${T} ${F}`, af: `${A} ${F}`, ofT: `${F} of ${T}`, theTF: `The ${T} ${F}`, the: `The ${F}` }[f]; form = 'noun';
    }
    const words_ = name.toLowerCase().split(' ');
    if (words_.some((w, i) => words_.indexOf(w) !== i)) continue; // "Salt Salt"
    if (!used.has(name)) { used.add(name); return { name, form }; }
  }
  const fallback = `${pick(c.rng, c.S.adj)} ${pick(c.rng, words.nouns)}`;
  used.add(fallback); return { name: fallback, form: 'fallback' };
}

// ═══════════════════════════════════════════════════════════════════
// 10. SLATE planner + composer
// ═══════════════════════════════════════════════════════════════════

function loadTraditions() {
  const wm = JSON.parse(readFileSync(join(REPO, 'src/data/world-model.json'), 'utf8'));
  return wm.nodes.filter((n) => n.category === 'magic-tradition').map((n) => ({
    id: n.id, name: n.name, school: n.properties.school,
    weights: Object.fromEntries(Object.entries(n.properties.sphereWeights ?? {}).map(([k, v]) => [k.split('.')[1], v])),
  }));
}
const TRADITIONS = loadTraditions();
const TRAD_BY_ID = Object.fromEntries(TRADITIONS.map((t) => [t.id, t]));

function shelf(sphere) {
  if (SPHERES[sphere].family === 'foundation') {
    return Object.entries(FOUNDATION_SHELF_PATCH[sphere]).map(([id, w]) => [TRAD_BY_ID[id], w]);
  }
  return TRADITIONS.filter((t) => (t.weights[sphere] ?? 0) > 0).map((t) => [t, t.weights[sphere]]);
}
const themesOf = (trad) => TRADITION_ENV[trad.id]?.themes ?? [];
const fitsCore = (trad, core) => !core?.themes || themesOf(trad).some((t) => core.themes.includes(t));

function coresFor(arena, agency, sphere, tierIdx) {
  return CORES.filter((k) => k.arena === arena && k.agency === agency && k.spheres[sphere] !== undefined
    && tierIdx >= k.tiers[0] && tierIdx <= k.tiers[1]);
}
/** Free-mode atom pool: every core's primitives (any arena) plus the raw extras. */
function freeAtoms(agency, sphere, tierIdx) {
  const fromCores = CORES.filter((k) => k.agency === agency && k.spheres[sphere] !== undefined && tierIdx >= k.tiers[0] - 1 && tierIdx <= k.tiers[1] + 1)
    .map((k) => ({ id: `core:${k.id}`, arenas: [k.arena], core: k }));
  const raws = RAW_ATOMS.filter((a) => a.agency === agency && (a.spheres === 'any' || a.spheres.includes(sphere)))
    .map((a) => ({ id: a.id, arenas: a.arenas, raw: a }));
  return [...fromCores, ...raws];
}
/** A reserved fight slot only accepts its own part of the fight vocabulary. */
const vocabOk = (slot, core) => !slot?.needsVocab || (!!core?.fightVocab && (!slot.vocabFamily || slot.vocabFamily.includes(core.id)));
const freeFirstAtoms = (arena, agency, sphere, tierIdx, slot) => freeAtoms(agency, sphere, tierIdx)
  .filter((a) => a.arenas.includes(arena) && (!slot?.needsVocab || vocabOk(slot, a.core)));

function planSlate(rng, count) {
  // The four reserved fight slots must speak the fight block's own vocabulary
  // (clock, condition on the opponent, answer to a traded blow, count of the fallen).
  const reserved = [['fight', true], ['fight', true], ['fight', true], ['fight', true], ['travel'], ['sight'], ['mark']];
  const arenas = [...reserved];
  while (arenas.length < count) arenas.push([weighted(rng, ARENA_MIX)]);
  const slots = shuffle(rng, arenas).slice(0, count).map(([arena, needsVocab], i) => ({ i, arena, needsVocab: !!needsVocab }));
  const freeIdx = new Set(shuffle(rng, slots.map((s) => s.i)).slice(0, Math.round(count * FREE_SHARE)));
  for (const s of slots) { s.mode = freeIdx.has(s.i) ? 'free' : 'core'; s.tierKey = weighted(rng, TIER_MIX); }
  // The reserved fight slots split two cast, two woven: a cast is a card played on an
  // exchange (THR-1530), a woven spell answers the fight's own events. Tier follows.
  // Each reserved slot covers a different part of the fight vocabulary.
  const vocabPlan = shuffle(rng, [
    ['cast', ['fight.clock_blow']],                            // fill the opponent's clock
    ['cast', ['fight.inflict_fear', 'fight.inflict_curse']],   // a condition on the opponent
    ['carried', ['fight.trade_answer']],                       // answer to `attacked`
    ['carried', ['fight.trophy']],                             // count `opponent_overcome`
  ]);
  for (const s of slots.filter((x) => x.needsVocab)) {
    [s.forcedAgency, s.vocabFamily] = vocabPlan.pop();
    s.tierKey = s.forcedAgency === 'cast' ? weighted(rng, { working: 0.4, great: 0.4, signature: 0.2 }) : weighted(rng, { working: 0.5, great: 0.5 });
  }

  // 1. Agency + sphere. Constrained arenas first, so every sphere still finds a home.
  const order = [...slots].sort((a, b) => (a.arena === 'encounter') - (b.arena === 'encounter'));
  const unused = new Set(shuffle(rng, SPHERE_KEYS));
  for (const s of order) {
    let tierIdx = TIERS.findIndex((t) => t.key === s.tierKey);
    for (let tries = 0; tries < 4 && !s.sphere; tries++) {
      const t = TIERS[tierIdx];
      const agencies = s.forcedAgency ? [s.forcedAgency] : t.deliberate >= 1 ? ['cast'] : t.deliberate <= 0 ? ['carried']
        : (rng() < t.deliberate ? ['cast', 'carried'] : ['carried', 'cast']);
      for (const agency of agencies) {
        const fits = (sph) => (s.mode === 'free' ? freeFirstAtoms(s.arena, agency, sph, tierIdx, s) : coresFor(s.arena, agency, sph, tierIdx).filter((k) => vocabOk(s, k))).length > 0;
        const fresh = [...unused].filter(fits); const any = SPHERE_KEYS.filter(fits);
        const sph = fresh.length ? pick(rng, fresh) : any.length ? pick(rng, any) : null;
        if (sph) { s.sphere = sph; s.agency = agency; s.tierIdx = tierIdx; unused.delete(sph); break; }
      }
      if (!s.sphere) tierIdx = (tierIdx + 1) % TIERS.length; // shift tier and retry
    }
  }

  // 1b. Fate-woven must be the majority (ruling 1). Flip deliberate non-signature slots to
  //     fate-woven where a woven core fits, until woven reaches FATE_WOVEN_MIN of the slate.
  const woven = () => slots.filter((s) => s.agency === 'carried').length;
  for (const s of shuffle(rng, slots)) {
    if (woven() >= Math.ceil(count * FATE_WOVEN_MIN)) break;
    if (s.agency !== 'cast' || TIERS[s.tierIdx].deliberate >= 1 || s.forcedAgency) continue;
    const ok = s.mode === 'free' ? freeFirstAtoms(s.arena, 'carried', s.sphere, s.tierIdx, s).length
      : coresFor(s.arena, 'carried', s.sphere, s.tierIdx).filter((k) => vocabOk(s, k)).length;
    if (ok) s.agency = 'carried';
  }

  // 2. Core (penalise reuse), then tradition fitted to the core's themes (penalise reuse).
  //    Fit is HARD when any tradition on the shelf fits; only when none does is the draw
  //    left open (and the lint flags the misfit). Free mode ignores fit on purpose.
  const usedCores = new Map(); const usedTrads = new Set();
  for (const s of slots) {
    if (s.mode === 'core') {
      const options = coresFor(s.arena, s.agency, s.sphere, s.tierIdx).filter((k) => vocabOk(s, k));
      s.core = weighted(rng, options.map((k) => [k, usedCores.has(k.id) ? CORE_REUSE_WEIGHT : 1]));
      usedCores.set(s.core.id, (usedCores.get(s.core.id) ?? 0) + 1);
    }
    const base = shelf(s.sphere).map(([t, w]) => [t, w * (usedTrads.has(t.id) ? 0.25 : 1)]);
    const fitting = s.mode === 'core' ? base.filter(([t]) => fitsCore(t, s.core)) : base;
    const shelfList = fitting.length ? fitting : base;
    s.trad = weighted(rng, shelfList);
    if (process.env.DEBUG_SLATE) console.error(s.i, s.sphere, s.core?.id, '->', s.trad.id, shelfList.map(([t, w]) => `${t.id.slice(6)}:${r2(w)}`).join(' '));
    usedTrads.add(s.trad.id);
  }

  // 3. Price: tier push × tradition lean, then a fix-up so every layer appears at least twice.
  const lean = (s, layer) => (THEME_PRICE_LEAN[themesOf(s.trad)[0]] ?? {})[layer] ?? 1;
  for (const s of slots) {
    s.priceLayer = weighted(rng, Object.entries(TIERS[s.tierIdx].price).map(([l, w]) => [l, w * lean(s, l)]));
  }
  for (const layer of ['free', 'strain', 'gamble', 'transgression']) {
    const counts = (l) => slots.filter((x) => x.priceLayer === l).length;
    const candidates = slots.filter((s) => (TIERS[s.tierIdx].price[layer] ?? 0) > 0 && s.priceLayer !== layer)
      .sort((a, b) => lean(b, layer) - lean(a, layer) || a.i - b.i);
    for (const s of candidates) {
      if (counts(layer) >= 2) break;
      if (counts(s.priceLayer) > 2) s.priceLayer = layer;
    }
  }
  return slots;
}

function makeCtx(rng, slot) {
  const S = SPHERES[slot.sphere]; const tier = TIERS[slot.tierIdx];
  const tradEnv = TRADITION_ENV[slot.trad.id] ?? { themes: [], nouns: [], mass: [] };
  // The Reach a spell leans on: the sphere's affinities, pulled toward the tradition's primary theme.
  const themeReach = THEME_REACH[tradEnv.themes?.[0]];
  const reachWeights = Object.entries(S.reaches).map(([r, w]) => [r, w + (r === themeReach ? 3 : 0)]);
  if (themeReach && !S.reaches[themeReach]) reachWeights.push([themeReach, 2]);
  return {
    rng, S, sphere: slot.sphere, trad: slot.trad, tradEnv, themeReach,
    tierIdx: slot.tierIdx, tier, agency: slot.agency, mode: slot.mode, priceLayer: slot.priceLayer,
    reach: weighted(rng, reachWeights),
    t: (arr) => arr[slot.tierIdx],
    m: () => r2(tier.mag[0] + (tier.mag[1] - tier.mag[0]) * rng()),
  };
}

function composeSpell(rng, slot, usedNames) {
  const c = makeCtx(rng, slot);
  const subj = slot.agency === 'cast' ? 'the caster' : 'the bearer';
  const spell = { slot, sphere: slot.sphere, trad: slot.trad, tier: c.tier, agency: slot.agency, arena: slot.arena, mode: slot.mode, priceLayer: slot.priceLayer };

  let main = []; let riderFx = []; let doesText = ''; let names; let reach = c.reach;
  let targeting = { type: 'self' }; const coreIds = [];

  if (slot.mode === 'core') {
    const core = slot.core;
    c.arg = core.spheres[slot.sphere];
    const b = core.build(c);
    main = b.effects; doesText = b.text; names = b.names; reach = b.reach ?? reach; targeting = b.targeting ?? targeting;
    coreIds.push(core.id);
    spell.tradFits = fitsCore(slot.trad, core);
    const riderChance = [0, 0.35, 0.5, 0.5][slot.tierIdx];
    const riderKeys = core.riders.filter((k) => RIDERS[k].agency === slot.agency);
    if (riderKeys.length && rng() < riderChance) {
      const rk = pick(rng, riderKeys);
      const e = RIDERS[rk].build(c, reach);
      if (!main.some((m) => m.type === e.type)) { riderFx.push(e); doesText += ' ' + RIDERS[rk].text(e); spell.rider = rk; }
    }
  } else {
    // FREE composition: the first atom fits the arena; the rest are anything the sphere allows.
    const n = [1, weighted(rng, { 1: 0.4, 2: 0.6 }), weighted(rng, { 2: 0.6, 3: 0.4 }), weighted(rng, { 2: 0.6, 3: 0.4 })][slot.tierIdx] * 1;
    const chosen = [pick(rng, freeFirstAtoms(slot.arena, slot.agency, slot.sphere, slot.tierIdx, slot))];
    const pool = freeAtoms(slot.agency, slot.sphere, slot.tierIdx);
    while (chosen.length < n) {
      const cand = pool.filter((a) => !chosen.some((x) => x.id === a.id));
      if (!cand.length) break;
      chosen.push(pick(rng, cand));
    }
    const clauses = [];
    const keyOf = (e) => `${e.type}:${e.rule ?? e.trigger ?? e.target ?? e.resource ?? ''}`;
    for (const atom of chosen) {
      let fxs; let atomNames; let atomTargeting; let atomReach;
      if (atom.core) {
        c.arg = atom.core.spheres[slot.sphere]; const b = atom.core.build(c);
        fxs = b.effects; atomNames = b.names; atomTargeting = b.targeting; atomReach = b.reach;
      } else {
        fxs = [atom.raw.build(c)]; atomNames = { nouns: atom.raw.nouns };
      }
      const added = fxs.filter((e) => !main.some((m) => keyOf(m) === keyOf(e))); // one of each primitive spelling
      if (!added.length) continue;
      for (const e of added) { main.push(e); clauses.push(clause(e, subj)); }
      if (!names) { names = atomNames; targeting = atomTargeting ?? targeting; reach = atomReach ?? reach; }
      coreIds.push(atom.id);
    }
    doesText = clauses.join(' ');
  }

  const cooldown = slot.agency === 'cast' ? Math.round(c.tier.cooldown[0] + (c.tier.cooldown[1] - c.tier.cooldown[0]) * rng()) : 0;
  if (slot.agency === 'cast') doesText += ` It can be cast again after ${durNoun(cooldown)}.`;

  c.reach = reach;
  const price = composePrice(c);
  const nm = composeName(c, names, usedNames);

  // SpellTemplate-shaped object (src/types/effects.ts). Fate-woven spells live in passiveEffects.
  const effects = slot.agency === 'cast' ? [...main, ...riderFx] : [];
  const passiveEffects = slot.agency === 'carried' ? [...main, ...riderFx, ...price.riders] : [];
  const template = {
    id: `spell_gen_${slot.sphere}_${nm.name.toLowerCase().replace(/[^a-z]+/g, '_')}`,
    name: nm.name, tier: c.tier.attachmentTier, tags: ['#spell', `#${slot.sphere}`], sphereAffinity: slot.sphere,
    flavorText: '', mechanicalSummary: [...main, ...riderFx].map(fx).join(' + '),
    prerequisites: { requiredSphere: slot.sphere },
    effects, cost: price.costs, cooldownTicks: cooldown,
    ...(price.backlash ? { backlash: price.backlash } : {}),
    ...(passiveEffects.length ? { passiveEffects } : {}),
    targeting,
  };

  // Under-the-hood parts with liveness badges.
  const hood = [];
  for (const e of main) hood.push({ part: slot.agency === 'cast' ? 'cast' : 'carried', text: fx(e), badge: liveness(e) });
  for (const e of riderFx) hood.push({ part: 'rider', text: fx(e), badge: liveness(e) });
  for (const k of price.costs) hood.push({ part: 'cost', text: costFx(k), badge: costLiveness(k) });
  for (const e of price.riders) hood.push({ part: 'price', text: fx(e), badge: liveness(e) });
  if (price.backlash) {
    const b = price.backlash;
    const bb = b.trigger === 'always' ? worst('partial', liveness(b.effect)) : liveness(b.effect);
    hood.push({ part: `backlash (${b.trigger === 'critical_failure' ? 'bad failure' : b.trigger === 'always' ? 'any casting' : 'failure'}, ${Math.round(b.probability * 100)}%)`, text: fx(b.effect), badge: bb });
  }
  if (price.notice) hood.push({ part: 'notice', text: '(no cost type exists)', badge: 'nohome' });

  Object.assign(spell, { name: nm.name, nameForm: nm.form, doesText, costText: price.costText, wrongText: price.wrongText, template, hood, coreIds, reach });
  spell.flags = lint(spell, main, riderFx);
  return spell;
}

function costFx(k) {
  switch (k.type) {
    case 'tick_exhaust': return `tick_exhaust(${k.ticks} ticks)`;
    case 'condition_inflict': return `condition_inflict(${k.template})`;
    case 'reach_drain': return `reach_drain(${k.reach} ${k.amount})`;
    case 'doom_increase': return `doom_increase(${k.amount}, lands on quintessence)`;
    default: return k.type;
  }
}

function fx(e) {
  switch (e.type) {
    case 'passive': case 'permanent': return `${e.type}(${e.reach} ${sgn(e.value)})`;
    case 'conditional': return `conditional(${e.condition}: ${e.reach} ${sgn(e.value)})`;
    case 'duration': return `duration(${e.reach} ${sgn(e.value)}, ${e.ticks} ticks)`;
    case 'decay': return `decay(${e.reach} ${e.startValue}→${e.limitValue}, ${e.changePerTick}/tick)`;
    case 'behavior_weight': return `behavior_weight(${e.reach} ×${e.multiplier})`;
    case 'social_modifier': return `social_modifier(${e.targetFilter} ${sgn(e.cooperationBias)})`;
    case 'action_gate': return `action_gate(${e.mode} ${e.reach})`;
    case 'test_shaper': return `test_shaper(${e.trigger} +${e.steps}${e.reach ? ` on ${e.reach}` : ''}${e.condition ? `, ${e.condition}` : ''}${e.maxMargin != null ? `, margin ≤${e.maxMargin}` : ''})`;
    case 'aura': return `aura(${e.target}, radius ${e.radius}, ${e.reach} ${sgn(e.value)})`;
    case 'range_modifier': return e.movementCostMultiplier ? `range_modifier(movement ×${e.movementCostMultiplier})` : `range_modifier(awareness +${e.awarenessRangeBonus})`;
    case 'reveal': return `reveal(${e.target}, range ${e.range})`;
    case 'alter_terrain': return `alter_terrain(${e.target} → ${e.terrainEffect}, ${e.ticks === 'permanent' ? 'permanent' : `${e.ticks} ticks`})`;
    case 'hex_effect': return `hex_effect(${e.property} +${e.value}/tick, radius ${e.radius ?? 0})`;
    case 'modify_rules': {
      const v = typeof e.value === 'object' ? `${e.value.from}→${e.value.to}` : typeof e.value === 'number' && e.rule.endsWith('multiplier') ? `×${e.value}` : `${e.value}`;
      return `modify_rules(${e.rule} ${v}, ${e.ticks === 'permanent' ? 'while held' : `${e.ticks} ticks`})`;
    }
    case 'suppress': return `suppress(${e.scope.scope}${e.scope.hexes ? ` ${e.scope.hexes}` : ''}, ${e.ticks} ticks)`;
    case 'dispel': return `dispel(${e.target} tagged ${e.tags.join('/')})`;
    case 'tag_immunity': return `tag_immunity(${e.tags.join(', ')}${e.condition ? `, ${e.condition}` : ''})`;
    case 'prevent_loss': return `prevent_loss(${e.channel}, ${e.amount}${e.consumeOnPrevent ? ', spent on use' : ''})`;
    case 'reactive': return `reactive(on ${e.trigger} → ${fx(e.effect)}${e.cooldown ? `, cooldown ${e.cooldown}` : ''})`;
    case 'stacking': return `stacking(${e.reach} +${e.valuePerStack} per ${e.stackOn}, max ${e.maxStacks})`;
    case 'resource_manipulate': return `resource_manipulate(${e.resource} ${sgn(e.amount)} on ${e.target}, ${e.mode})`;
    case 'inflict_condition': return `inflict_condition(${e.conditionTraitId.replace('trait.condition.', '')} on ${e.target}${e.durationTicks ? `, ${e.durationTicks} ticks` : ''})`;
    case 'action_trigger': {
      const p = e.payload.kind === 'condition_grant' ? `grant ${e.payload.conditionTraitId.replace('trait.condition.', '')}`
        : e.payload.kind === 'condition_remove' ? `remove ${e.payload.conditionTraitId ? e.payload.conditionTraitId.replace('trait.condition.', '') : (e.payload.tags ?? []).join('/')}` : e.payload.kind;
      return `action_trigger(on ${e.on} → ${p}${e.probability != null ? `, ${Math.round(e.probability * 100)}%` : ''}${e.cooldownTicks ? `, cooldown ${e.cooldownTicks}` : ''})`;
    }
    case 'trait_grant': return `trait_grant(${e.grantedTrait})`;
    case 'axiological_drift': return `axiological_drift(${e.axis} ${e.ratePerTick}/tick → ${e.limitValue})`;
    default: return e.type;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 11. LINT — the automatic half of the coherence bar
// ═══════════════════════════════════════════════════════════════════

function arenaOf(e) {
  if (e.type === 'resource_manipulate' && e.resource === 'fight_clock') return 'fight';
  if (e.type === 'inflict_condition' || (e.type === 'stacking' && e.stackOn === 'on_kill')) return 'fight';
  if ((e.type === 'test_shaper' || e.type === 'tag_immunity') && e.condition === 'in_combat') return 'fight';
  if (e.type === 'reactive' && e.trigger === 'attacked') return 'fight';
  if (e.type === 'modify_rules' && e.rule === 'encounter_reach_override') return 'fight';
  if (e.type === 'range_modifier') return e.movementCostMultiplier ? 'travel' : 'sight';
  if (e.type === 'modify_rules' && e.rule === 'movement_cost_multiplier') return 'travel';
  if (e.type === 'reveal' || (e.type === 'modify_rules' && e.rule === 'awareness_range_bonus')) return 'sight';
  if (e.type === 'alter_terrain' || e.type === 'hex_effect' || (e.type === 'reactive' && e.effect.type === 'alter_terrain')) return 'mark';
  return 'encounter';
}
const reachOf = (e) => e.reach ?? (e.type === 'modify_rules' && typeof e.value === 'object' ? e.value.to : undefined);

function lint(spell, main, riderFx) {
  const flags = [];
  for (const h of spell.hood.filter((x) => x.badge !== 'live')) flags.push(`${h.part}: ${BADGE[h.badge]}`);
  const rollBonus = [...main, ...riderFx].filter((e) => ['passive', 'conditional', 'duration', 'permanent'].includes(e.type) && e.value > 0)
    .reduce((s, e) => s + e.value, 0);
  if (rollBonus > EFFECT_PER_ITEM_CAP + 1e-9) flags.push(`roll bonuses add to ${r2(rollBonus)}, past the per-item cap of ${EFFECT_PER_ITEM_CAP}`);
  const all = [...spell.template.effects, ...(spell.template.passiveEffects ?? [])];
  if (all.length > 8) flags.push('more than 8 effects: the walker would drop the excess');
  if (all.filter((e) => e.type === 'action_trigger').length > 2) flags.push('more than 2 action triggers: the walker would drop the excess');
  const arenas = new Set(main.map(arenaOf));
  if (arenas.size > 1) flags.push(`mixes arenas (${[...arenas].join(' + ')})`);
  const reaches = new Set(main.map(reachOf).filter(Boolean));
  if (reaches.size > 1) flags.push(`effects point at ${reaches.size} different Reaches (${[...reaches].map(R).join(', ')})`);
  if (spell.mode === 'free' && main.length > 1) flags.push('name drawn from the first effect only');
  if (spell.mode === 'core' && spell.tradFits === false) flags.push(`the tradition (${spell.trad.name}) does not teach this kind of spell`);
  const leanHere = (THEME_PRICE_LEAN[themesOf(spell.trad)[0]] ?? {})[spell.priceLayer] ?? 1;
  if (leanHere < 0.5) flags.push(`a ${spell.priceLayer} price sits badly with ${spell.trad.name}`);
  return flags;
}

// ═══════════════════════════════════════════════════════════════════
// 12. RENDER
// ═══════════════════════════════════════════════════════════════════

const AGENCY_LABEL = { carried: 'fate-woven', cast: 'deliberate' };

function renderSpell(s, n) {
  const hood = s.hood.map((h) => `${h.part}: ${h.text} [${BADGE[h.badge]}]`).join(' · ');
  const built = s.mode === 'core'
    ? `built from authored core "${s.coreIds[0]}"${s.rider ? ` + rider "${s.rider}"` : ''}`
    : `built by free composition from ${s.coreIds.map((x) => `"${x.replace('core:', '')}"`).join(', ')}`;
  const flags = s.flags.length ? ` · generator flags: ${s.flags.join('; ')}` : '';
  return [
    `### ${n}. ${s.name}`,
    `*${SPHERES[s.sphere].label} · ${s.trad.name} · ${s.tier.label} · ${AGENCY_LABEL[s.agency]} · ${ARENA_LABEL[s.arena]}*`,
    '',
    `**What it does.** ${s.doesText}`,
    '',
    `**What it costs.** ${s.costText}`,
    '',
    `**What goes wrong.** ${s.wrongText}`,
    '',
    `<sub>Under the hood: ${hood} · SpellTemplate tier ${s.template.tier}${s.agency === 'cast' ? `, cooldown ${s.template.cooldownTicks} ticks` : ', lives in passiveEffects'} · ${built}${flags}</sub>`,
    '',
  ].join('\n');
}

function renderGlance(spells, offset = 0) {
  const rows = spells.map((s, i) => `| ${i + 1 + offset} | ${s.name} | ${SPHERES[s.sphere].label} | ${s.trad.name} | ${s.tier.label} | ${AGENCY_LABEL[s.agency]} | ${ARENA_LABEL[s.arena]} | ${s.priceLayer} | ${s.mode === 'core' ? 'authored core' : 'free'} |`);
  return ['| # | Name | Sphere | Tradition | Tier | Agency | Arena | Price | Built from |', '|---|---|---|---|---|---|---|---|---|', ...rows].join('\n');
}

function coverage(spells) {
  const count = (f) => spells.reduce((m, s) => { const k = f(s); m[k] = (m[k] ?? 0) + 1; return m; }, {});
  return {
    spheres: count((s) => SPHERES[s.sphere].label), traditions: count((s) => s.trad.name), price: count((s) => s.priceLayer),
    arena: count((s) => s.arena), agency: count((s) => AGENCY_LABEL[s.agency]), tier: count((s) => s.tier.label), mode: count((s) => s.mode),
    badges: spells.flatMap((s) => s.hood.map((h) => h.badge)).reduce((m, b) => { m[b] = (m[b] ?? 0) + 1; return m; }, {}),
  };
}

const GH = 'https://github.com/christianspliid-ui/threadbare/blob/main';
const LIN = 'https://linear.app/threadbare/issue';
const L = {
  thr1230: `[THR-1230](${LIN}/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape)`,
  thr1530: `[THR-1530](${LIN}/THR-1530/spells-and-powers-in-a-fight-one-effect-vocabulary)`,
  fb5: `[FB5](${LIN}/THR-1541/fight-block-fb5-fight-events)`,
  fb6: `[FB6](${LIN}/THR-1542/fight-block-fb6-effect-vocabulary-for-fights)`,
  fightPlan: `[the fight block plan](${GH}/Docs/plans/2026-09-23-fight-block.md)`,
  thr661: `[THR-661](${LIN}/THR-661)`,
  worldModel: `[the world model](${GH}/src/data/world-model.json)`,
  effects: `[the effect vocabulary](${GH}/src/types/effects.ts)`,
  spellTemplates: `[five shipped spell templates](${GH}/src/data/spell-templates.ts)`,
  activation: `[\`activateSpell\`](${GH}/src/engine/spellActivation.ts)`,
  prose: `[Prose Doctrine v2](${GH}/Docs/canon/prose.md)`,
  overlays: `[the overlay table](${GH}/src/data/terrain-overlays.ts)`,
  map: `[the Powers & Spellcraft map](${LIN}/THR-1226/wayfinder-map-powers-and-spellcraft)`,
};

function howMade(spells) {
  const cov = coverage(spells);
  const list = (o, lab = (k) => k) => Object.entries(o).map(([k, v]) => `${lab(k)} ${v}`).join(', ');
  return `## How these were made

**Tiers.** There are four: cantrip, working, great working, signature. Tier sets:
- how big a bonus is (a cantrip moves a roll slightly; a signature moves it a great deal, never past the engine's per-item cap);
- how long its effects last, and how long a cast takes to come back;
- how many effects it may carry (one for a cantrip, up to three at the top);
- its agency. A cantrip is always fate-woven and a signature is always deliberate. A working is deliberate about a third of the time, a great working half the time.

This follows ruling 1 on ${L.thr1230}: most magic is woven into what the bearer does, and a marked few spells are real decisions.

**Price layers.** There are four: free, strain, gamble and transgression. Tier pushes a spell rightward: a cantrip is mostly free, a signature mostly a transgression. On top of that, the tradition leans the price its own way, because ruling 3 says a spell's price is what kind of magic it is:
- Holy, Healing and Warding lean toward free and strain.
- Luck and Chaos lean toward gamble.
- Necromancy, Demonology, Blood, Corruption and Poison lean hard toward transgression.

The price table also has to split by agency. A fate-woven spell is never cast, so it can never pay a cast cost.

A deliberate spell pays when it is cast:
- *free* — nothing;
- *strain* — the caster is spent for a while, is left Exhausted, or is drained in a Reach;
- *gamble* — every casting risks a miscast;
- *transgression* — quintessence, plus notice.

A fate-woven spell pays with what it carries:
- *free* — nothing;
- *strain* — a standing weakness in a paired Reach, Exhaustion after successes, or (Holy and Healing only) a vow that forbids a whole Reach;
- *gamble* — a chance to turn on the bearer, or to leave them, when they fail;
- *transgression* — quintessence lost day by day, or the world's doom sped up, plus notice. For dark traditions, the bearer also drifts slowly toward the vice pole of the spell's Reach.

**Arena.** A spell acts in one of five places: an encounter, a fight, or one of the three world-map classes from ruling 2 (travel, sight, mark). Fights use the fight block's vocabulary (${L.fightPlan}, §9 and §10). A fight spell can:
- fill segments of the opponent's clock;
- put a condition on the opponent;
- answer when blows are traded;
- count the opponents it overcomes;
- rescue a narrowly lost exchange;
- change which Reach the caster fights with.

**Coverage is enforced, not left to chance.** A run first plans its slate:
- it reserves four fight slots, one for each part of the fight vocabulary (the clock, a condition on the opponent, an answer to a traded blow, a count of the fallen), and one slot for each world-map class; the other slots are drawn, about six in ten of them encounters;
- it makes sure every sphere is used at least once and every price layer at least twice;
- it keeps fate-woven spells at six in ten or more;
- it builds three in ten spells by free composition.

Everything inside a slot is a seeded draw.

**Agency.** Fate-woven spells go in \`passiveEffects\` and act without a decision: they bend rolls, pull the bearer toward kinds of encounter, and answer events. Deliberate spells go in \`effects\` and act when cast, so each one also says when it can be cast again. The wording follows the split: "the bearer" carries a spell, "the caster" casts one.

**Sphere and tradition shelves.** Every spell draws a sphere. The sphere decides which authored cores fit, which Reaches the spell leans on, which situations favour it, what its miscasts look like and what its name sounds like. Then the spell draws a tradition from that sphere's shelf, weighted by the tradition's real sphere weights in ${L.worldModel} (${TRADITIONS.length} magic traditions). Only a tradition that teaches that kind of spell may be drawn. If no tradition on the shelf does, the draw falls back to the whole shelf and the spell is flagged.

The world model says nothing about what a tradition teaches, so the prototype gives each one a few themes (war, ward, heal, curse, sight, travel and so on). **The four Foundation spheres have no shelf at all.** None of the ${TRADITIONS.length} traditions weights Order, Chaos, Light or Darkness, so the generator borrows a hand-made patch:
- Light from Holy, Divination, Restoration and Ascension;
- Darkness from Illusion, Necromancy, Dreamcraft and Shamanism;
- Order from Warding, Rune, Binding and Enchantment;
- Chaos from Chaos, Luck, Demonology and Weather.

The themes and the patch are both this prototype's inventions, not canon.

**Name grammar.** Names are two or three plain words, drawn from three banks:
- the core's function words (Ward, Guard, Call, Stride);
- the tradition's words (Salt, Barrow, Ember, Coin);
- the sphere's adjectives (Wild, Still, Pale, Grey).

The noun forms are "Salt Ward", "Grey Ward", "Ward of Salt" and "The Salt Ward". A two-word function noun ("Long Odds") stands alone. A deliberate spell may instead take the card form, an imperative verb and an object ("Bar the Road"), because ${L.prose} says cards read like spells. Reach and sphere names are kept out of names, so "Stone Guard" can never be mistaken for a Stone spell.

**Cost and backlash pairing.** Each sphere owns a short list of miscasts, for example:
- Force numbs the arm;
- Time makes spells slow to return;
- Energy burns out the caster's other charms;
- Darkness blinds;
- Chaos leaves the next miscast one grade worse;
- Entropy curses the caster.

The price layer decides when a miscast can fire: on a failure (strain), on any casting (gamble), or on a bad failure (transgression). Fate-woven spells use the same idea through a condition the sphere hands back: Terrified for Darkness, Cursed for Entropy and Chaos, Exhausted for Order, Matter, Energy, Life and Time.

**Authored cores.** Under the sphere tables sit ${CORES.length} small hand-written kernels. Each one is one or two primitives from ${L.effects} plus one plain sentence. For example, "a narrowly lost exchange counts as a near miss" is \`test_shaper\` with \`in_combat\`. Seeded variation fills in the rest:
- magnitude and duration;
- the tradition's wording;
- an optional rider that reinforces the same Reach;
- the price and the backlash;
- the name.

**Coverage in this run.**
- Spheres: ${list(cov.spheres)}.
- Price layers: ${list(cov.price)}.
- Arenas: ${list(cov.arena, (k) => ARENA_LABEL[k])}.
- Agency: ${list(cov.agency)}.
- Traditions: ${Object.keys(cov.traditions).length} different ones.

**Badges in the small print.** Every building block carries a tag for what it does in the engine today. Counts in this run: ${Object.entries(cov.badges).map(([k, v]) => `${BADGE[k]} ${v}`).join('; ')}.
- *Works today* means the primitive runs on the live path.
- *Planned: fight block* means the queued fight slices ${L.fb5} and ${L.fb6} add it. Fights themselves arrive with that block.
- The other tags are the gaps listed below.
`;
}

function dialSection(spells) {
  const core = spells.filter((s) => s.mode === 'core'); const free = spells.filter((s) => s.mode === 'free');
  const coherence = /mixes arenas|different Reaches|stored, but|does nothing|name drawn|does not teach|sits badly/;
  const flagged = (arr) => arr.filter((s) => s.flags.some((f) => coherence.test(f))).length;
  return `## Where the dial sits

This run turned the dial two ways on purpose, so the two can be compared side by side.

- **Authored cores plus variation (${core.length} of ${spells.length}).** A person wrote the intent: which one or two primitives go together, and the one sentence that says what the spell is. The generator chose everything else:
  - the sphere, the tradition and the tier;
  - whether the spell is woven or cast;
  - the size, duration and chance of every number;
  - an optional rider;
  - the price, the backlash and the name.
- **Free composition (${free.length} of ${spells.length}).** Nothing is authored above the primitive. The generator drew one to three primitives the sphere allows, with the first one fitting the arena, and described each with a generic clause. It could also reach for legal values the authored layer avoids: overlays nothing reads, tags no condition carries, and a trait nothing checks.

The generator's own checks raised a coherence flag on ${flagged(free)} of the ${free.length} freely composed spells and on ${flagged(core)} of the ${core.length} core-built ones. A coherence flag means one of these:
- the spell mixes arenas or points at several Reaches;
- a part of it does nothing;
- the name covers only one effect;
- the tradition does not teach it;
- the price does not suit it.

**Always authored, in both modes:**
- the tier, price and arena envelopes;
- the sphere and tradition tables and word banks;
- the tradition themes and price leans;
- the Foundation-sphere shelf patch;
- the miscast lists and condition glosses;
- the liveness table.

**Always composed:** every draw inside those tables.
`;
}

function gapsSection() {
  return `## Engine gaps the generator ran into

These are envelope constraints that are missing, or substrate that is not there yet. Each one came up while building the tables.

1. **Nothing here can run yet.** The one live cast path (the \`use × Power\` undertaking cell) pays the price but drops the spell's effects and its backlash. A wielded spell's shared definition node deliberately carries no effects. So both halves of the spell runtime are still to build: carried effects for fate-woven spells, and applied effects for deliberate ones. That is the next plan on ${L.map}.
2. **Strain as a Reach drain cannot be paid.** \`reach_drain\` and every \`minReach\` prerequisite in ${L.activation} read \`properties.domainCapability\`, which nothing in the game writes. (Capability actually lives in \`domainCapabilities\` plus the trait walk.) So the cost "it draws on the caster's own Veil" is refused today. So is every one of the ${L.spellTemplates}, because all five carry \`minReach\`. The generator uses exhaustion and the Exhausted condition as the working forms of strain.
3. **"Notice" has no engine home.** Ruling 3 on ${L.thr1230} prices transgression as doom plus notice. Doom has a home: the soul price lands on quintessence. But no cost type says "the world noticed". The nearest honest substrate is a hidden mark that a later encounter can reveal, the pattern the artifact curse uses (${L.thr661}). Every transgression here shows *notice* with a *no engine home* tag.
4. **A gamble cannot fire on a successful cast.** ${L.activation} checks backlash only inside its failure branch, so a backlash meant for "any casting" never fires when the cast succeeds. And failure is a fixed coin (fifteen in a hundred), not a roll against the caster's skill.
5. **Foundation spheres have no traditions.** See *Sphere and tradition shelves* above. [The world model](${GH}/src/data/world-model.json) also lists a fifth Foundation sphere, Shadow, which canon's twelve spheres do not have.
6. **Most terrain overlays are stored but never read.** Only two of the eleven overlays in ${L.overlays} change anything: Warded (slows crossing) and Shrouded (dulls the sight of those inside). Sacred Ground, Blighted, Hallowed, Cursed Ground and the rest are kept on the map and expire, but no rule looks at them. The authored cores stay on the two live ones; the free composer does not know better.
7. **A dispel would cure the whole world.** Conditions are now one shared definition per kind, and \`dispel\` deletes that shared node. Deleting a node removes every edge to it. So the first time a generated "lift a curse" spell runs, everyone with that condition loses it, and the condition stops existing. No shipped content reaches \`dispel\` today, so the bug is latent. It must be fixed before a generator may emit dispels.
8. **Real teleportation does nothing.** \`teleport\`, \`forced_move\`, \`transfer\` and \`compel\` still execute nothing. So travel spells here are "the road is shorter" and "you run fast", not gates, and the generator refuses those four primitives.
9. **A shroud blinds, it does not hide.** The Shrouded overlay lowers the sight of whoever stands in it, the caster included. That is the opposite of what a Darkness "hide me" spell wants, and nothing yet makes a bearer harder to find.
10. **World-doom prices compound.** \`doom_rate_multiplier\` is multiplied across every agent that carries it, so twenty carriers of a small transgression speed the doom clock many times over. It is the most legible "the world objects" price there is, and it needs a population cap before it ships.
11. **A ward currently eats the caster's own price.** A quintessence ward (\`prevent_loss\`) softens the summed loss for the tick, so it also cancels the soul price of the bearer's own transgressions. ${L.thr1530} found this, and fight slice FB3 splits the spell price from harm so wards cover harm only.
`;
}

// ═══════════════════════════════════════════════════════════════════
// 13. MAIN
// ═══════════════════════════════════════════════════════════════════

/** Names already taken by the five shipped spell templates (src/data/spell-templates.ts). */
const SHIPPED_SPELL_NAMES = ['Veilwalk', 'Soulfire', 'Pact of the Hollow Crown', 'Crystal Gate', 'Last Breath'];

function generate(seed, count, takenNames = []) {
  const rng = mulberry32(seed);
  const slate = planSlate(rng, count);
  const usedNames = new Set([...SHIPPED_SPELL_NAMES, ...takenNames]);
  return slate.map((slot) => composeSpell(rng, slot, usedNames));
}

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}

function slim(s) {
  return { name: s.name, sphere: s.sphere, tradition: s.trad.id, tier: s.tier.key, agency: s.agency, arena: s.arena,
    price: s.priceLayer, mode: s.mode, cores: s.coreIds, rider: s.rider, does: s.doesText, costs: s.costText, goesWrong: s.wrongText,
    flags: s.flags, liveness: s.hood, template: s.template };
}

function main() {
  const seed = Number(arg('seed', 42)); const count = Number(arg('count', 20));
  const seed2 = Number(arg('appendix-seed', 1231)); const count2 = Number(arg('appendix-count', 5));
  const spells = generate(seed, count);
  const appendix = generate(seed2, 20, spells.map((s) => s.name)).slice(0, count2);

  if (process.argv.includes('--dump')) {
    for (const [i, s] of spells.entries()) console.log(renderSpell(s, i + 1));
    console.log(JSON.stringify(coverage(spells), null, 1));
    console.log('--- appendix ---');
    for (const [i, s] of appendix.entries()) console.log(renderSpell(s, i + 1));
    return;
  }

  const readNote = (f) => (existsSync(join(HERE, 'notes', f)) ? readFileSync(join(HERE, 'notes', f), 'utf8').trim() + '\n' : '');
  const md = [
    '# Twenty generated spells',
    '',
    readNote('intro.md'),
    '## At a glance',
    '',
    renderGlance(spells),
    '',
    '## The twenty',
    '',
    ...spells.map((s, i) => renderSpell(s, i + 1)),
    howMade(spells),
    dialSection(spells),
    gapsSection(),
    `## Appendix: five spells from a second seed (seed ${seed2})`,
    '',
    'Same generator, same tables, different seed. These are the first five spells of a second twenty-spell run.',
    '',
    renderGlance(appendix),
    '',
    ...appendix.map((s, i) => renderSpell(s, i + 1)),
    readNote('critique.md'),
    `<sub>Generated by proto-spells/generator.mjs, seed ${seed} (main run) and ${seed2} (appendix), against main @ 9cc62c05 (2026-09-24). Throwaway prototype for THR-1232.</sub>`,
    '',
  ].join('\n');
  writeFileSync(join(HERE, 'twenty-spells.md'), md, 'utf8');
  writeFileSync(join(HERE, 'twenty-spells.json'), JSON.stringify({ seed, spells: spells.map(slim), appendixSeed: seed2, appendix: appendix.map(slim) }, null, 2), 'utf8');
  console.log(`wrote twenty-spells.md (${spells.length} + ${appendix.length} spells) and twenty-spells.json`);
  console.log(JSON.stringify(coverage(spells)));
}

main();
