#!/usr/bin/env node
// generator.mjs — THROWAWAY item-generator sketch for THR-1236 (Item Generator map, THR-1227).
//
// Question it answers: do random tables x world concepts x fantasy tropes x real effect
// primitives produce items the creative director would call *cool*?
//
// Architecture (the map's charter decision): composition from effect primitives inside
// AUTHORED ENVELOPES. Here the envelope is a *trope core* — a mechanical signature plus a
// fiction skeleton. Everything around it (the world entities, sphere, reach, material,
// magnitudes, the catch, the provenance sentence and the name) is rolled from tables.
// A `free` mode switches the trope table off so the two ends of the dial can be compared.
//
// Honesty rule: only effect shapes with a verified live reader are emitted. SHAPE_STATUS
// carries the evidence; the fight block's planned words are listed but never emitted.
//
// Pipeline (all output stays in this folder; the repo is only read):
//   node extract-world.mjs   -> world-vocab.json   (the game's own vocabularies + caps)
//   node generator.mjs       -> items-seed42.json, items-seed7.json, items-free42.json, thirty-items.md
//   node engine-check.mjs    -> engine-readback.json (real engine functions read every item back)
//   node generator.mjs       -> thirty-items.md again, now with the read-back marks
//
//   node generator.mjs --print [--seed N]   quick console dump
//   node generator.mjs --scan 40            coverage for seeds 1..40

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const V = JSON.parse(readFileSync(join(HERE, 'world-vocab.json'), 'utf8'));

// ═══════════════════════════════════════════════════════════════════════════
// 1. Seeded rolling — mirrors src/lib/prng.ts (mulberry32) and the drawFromTable
//    pattern in src/data/content-eval/drawTable.ts: keys sorted before sampling,
//    tableId mixed into the seed so every table is its own independent stream.
// ═══════════════════════════════════════════════════════════════════════════

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
const round = (v, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

class Roller {
  constructor(seedKey) { this.seedKey = seedKey; this.fired = []; }
  r(tableId) { return mulberry32(fnv1a(`${tableId}:${this.seedKey}`))(); }
  /** Weighted draw of one key. Keys sorted; weight <= 0 = cannot appear. */
  draw(tableId, weights) {
    const keys = Object.keys(weights).sort().filter(k => (weights[k] ?? 0) > 0);
    if (keys.length === 0) return undefined;
    const total = keys.reduce((s, k) => s + weights[k], 0);
    let roll = this.r(tableId) * total;
    let pick = keys[keys.length - 1];
    for (const k of keys) { roll -= weights[k]; if (roll <= 0) { pick = k; break; } }
    this.fired.push(`${tableId}=${pick}`);
    return pick;
  }
  pick(tableId, arr) { return arr[Math.min(arr.length - 1, Math.floor(this.r(tableId) * arr.length))]; }
  range(tableId, [lo, hi], dp = 2) { return round(lo + (hi - lo) * this.r(tableId), dp); }
  chance(tableId, p) { return this.r(tableId) < p; }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Constants — every magnitude is a named row
// ═══════════════════════════════════════════════════════════════════════════

const RARITY = V.RARITY_TIER_NAMES;                 // { 1: 'Mundane', 2: 'Storied', 3: 'Mythic', 4: 'Legendary' } (src/types/rarity.ts)
const TIER_QUOTA = { 1: 9, 2: 9, 3: 7, 4: 5 };     // thirty items across the four bands
const TROPE_REPEAT_DECAY = 0.15;                    // weight x this per earlier use of a trope in the run
const TROPE_MAX_PER_RUN = 2;
const FORM_REPEAT_DECAY = 0.3;
const HERO_REPEAT_DECAY = 0.35;                     // a named hero is less likely to be named again in the run
const TICKS_PER_DAY = 12;                           // effect-constants.ts: "24 ticks is two in-game days"
const CAPS = V.EFFECT_CAPS;                         // real caps pulled from src/data/effect-constants.ts
const BANDS = V.ITEM_STAT_BANDS;                    // 0.5 / 1.0 / 2.0 per reach (src/data/item-stat-bands.ts)
const REGEN = V.QUINTESSENCE_PASSIVE_REGEN;         // 0.002 per tick (src/types/quintessence.ts)

/** Magnitude envelopes by tier, calibrated against the hand catalog's own ranges. */
const MAG = {
  passive:     { 1: [0.02, 0.04], 2: [0.04, 0.07], 3: [0.07, 0.10], 4: [0.10, 0.14] },
  conditional: { 1: [0.02, 0.03], 2: [0.03, 0.05], 3: [0.05, 0.08], 4: [0.08, 0.12] },
  stat:        { 1: [0.2, 0.4],   2: [0.4, 0.7],   3: [0.7, 1.0],   4: [1.2, 1.8] },
  penalty:     { 1: [0.02, 0.03], 2: [0.03, 0.05], 3: [0.04, 0.06], 4: [0.05, 0.08] },
  statPenalty: { 1: [0.1, 0.2],   2: [0.2, 0.3],   3: [0.3, 0.45],  4: [0.4, 0.6] },
  aura:        { 2: [0.03, 0.04], 3: [0.04, 0.05], 4: [0.05, 0.06] },
  movement:    { 1: 0.9, 2: 0.85, 3: 0.8, 4: 0.75 },
  reveal:      { 1: 1, 2: 1, 3: 2, 4: 2 },
  shaperMargin:{ 1: 2, 2: 3, 3: 5, 4: 8 },
  ward:        { 1: 0.03, 2: 0.05, 3: 0.08, 4: 0.12 },
  bargainCost: { 2: 0.02, 3: 0.03, 4: 0.05 },
  thinning:    { 2: -0.0025, 3: -0.003, 4: -0.004 },
  drift:       { 2: [0.002, 0.003], 3: [0.003, 0.004], 4: [0.004, 0.005] },
  behavior:    { 1: [1.2, 1.25], 2: [1.3, 1.4], 3: [1.4, 1.5], 4: [1.5, 1.6] },
  growth:      { 2: 0.85, 3: 0.75, 4: 0.6 },
  influence:   { 2: 1.2, 3: 1.3, 4: 1.5 },
  healing:     { 2: 1.5, 3: 1.75, 4: 2.0 },
  corruption:  { 3: 0.01, 4: 0.015 },
  holy:        { 2: 0.004, 3: 0.006, 4: 0.01 },
  breakChance: { 1: 0.3, 2: 0.2, 3: 0.1 },
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. Honest vocabulary — every shape the generator may emit, with its status.
//    live    = a production reader exists today
//    narrow  = live, but only on part of the game
//    planned = fight-block vocabulary not shipped yet (never emitted)
// ═══════════════════════════════════════════════════════════════════════════

const SHAPE_STATUS = {
  passive:            ['live', 'roll modifier (effectResolver.resolveEffectModifiers)'],
  conditional:        ['live', 'roll modifier when the predicate holds; in_combat = an Iron step or a fight exchange (fight block FB1, shipped)'],
  stat_contribution:  ['live', 'capability raw score (domainCapability.computeRawScore)'],
  test_shaper:        ['live', 'band rescue at step resolution'],
  prevent_loss:       ['live', 'quintessence channel only (phaseQuintessence)'],
  tag_immunity:       ['live', 'checked at condition infliction (THR-1242)'],
  reveal:             ['live', 'encounters = awareness floor; hexes = fog lifted on arrival (THR-1242)'],
  range_modifier:     ['live', 'movement cost + awareness range'],
  modify_rules:       ['live', 'standing rule override, read at its owning site (THR-1241)'],
  aura:               ['live', 'read at resolution for agents nearby (THR-1243)'],
  behavior_weight:    ['live', 'encounter desire scoring'],
  social_modifier:    ['live', 'cooperation disposition'],
  action_gate:        ['live', 'blocks actions of a reach'],
  axiological_drift:  ['live', 'per-tick value drift (effectTick)'],
  resource_manipulate:['live', 'per_tick self drain/restore (effectTick)'],
  hex_effect:         ['live', 'per-tick hex delta; divineInfluence / corruption / explorationAttraction only'],
  action_trigger:     ['live', 'fires on the step outcome ladder, movement arrival, action completion'],
  consumable_charge:  ['live', 'one charge spent per completed step in the charge reach (THR-1239)'],
  slot_bonus:         ['live', 'slot cap expansion'],
  suppress:           ['live', 'resolved once per tick; silences attachments in scope (THR-1242)'],
  until_event:        ['live', 'take_damage = a harmful condition lands (THR-1244)'],
  cooldown:           ['live', 'on/off cycle (effectTick)'],
  stacking:           ['narrow', 'on_damaged / on_heal live everywhere; combat_success counts legacy encounters only until fight block FB5'],
  inflict_condition:  ['planned', 'fight block FB6 — not in the union yet'],
};
const LIVE_RULE_KEYS = new Set([
  'movement_cost_multiplier', 'awareness_range_bonus', 'death_prevented', 'healing_multiplier',
  'tier_advancement_cost_multiplier', 'faction_influence_multiplier', 'cooldown_multiplier',
  'duration_decay_multiplier', 'reward_tier_bonus', 'encounter_difficulty_modifier',
]);
const LIVE_TRIGGER_EVENTS = new Set([   // 'rest' and 'spell_cast' are never raised anywhere
  'encounter_success', 'encounter_critical_success', 'encounter_at_cost', 'encounter_failure',
  'encounter_critical_failure', 'movement_complete', 'action_complete',
]);

// ═══════════════════════════════════════════════════════════════════════════
// 4. Cosmology words
// ═══════════════════════════════════════════════════════════════════════════

const REACHES = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
const REACH_DO = {
  iron: 'fighting', gold: 'trade and bargaining', shadow: 'stealth and secrets', veil: 'magic and the unseen',
  heart: 'nerve and dealing with people', eye: 'noticing and knowing', stone: 'making and enduring', star: 'travel and finding the way',
};
const REACH_BLOCK = {
  iron: 'raise a hand in violence', gold: 'haggle or take payment', shadow: 'sneak, lie or steal',
  veil: 'work magic', heart: 'plead or charm', eye: 'pry into secrets', stone: 'build or mend', star: 'strike out on a long road',
};
const REACH_NAME = Object.fromEntries(REACHES.map(r => [r, cap(r)]));
const AXIS = Object.fromEntries(V.AXES.map(a => [a.reach, a]));               // valuePair + virtue/vice words
const CORE = Object.fromEntries(V.CORE_TRAITS.map(c => [c.id, c.name]));        // trait.core.* -> True, Warm, ...
const SPHERES = ['chaos', 'order', 'light', 'darkness', 'force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];

/** Portmanteau roots per sphere — plain, one syllable where possible. */
const SPHERE_ROOTS = {
  force: ['Iron', 'War', 'Hammer', 'Break'], matter: ['Stone', 'Anvil', 'Salt', 'Grey'],
  energy: ['Spark', 'Storm', 'Ember', 'Brand'], life: ['Root', 'Thorn', 'Green', 'Sap'],
  mind: ['Ink', 'Lore', 'Keen', 'Wit'], spirit: ['Ghost', 'Prayer', 'Vigil', 'Dream'],
  time: ['Dust', 'Tide', 'Hour', 'Long'], entropy: ['Ash', 'Hollow', 'Rust', 'Rot'],
  chaos: ['Wild', 'Riven', 'Crack', 'Loose'], order: ['Oath', 'Ward', 'Law', 'True'],
  light: ['Dawn', 'Bright', 'Sun', 'Lamp'], darkness: ['Night', 'Dusk', 'Hush', 'Black'],
};
/** Plain sphere adjectives for "The {Adj} {Noun}" when the trope has none of its own. */
const SPHERE_ADJ = {
  force: ['Heavy', 'Unbending'], matter: ['Solid', 'Stubborn'], energy: ['Burning', 'Restless'],
  life: ['Green', 'Living'], mind: ['Keen', 'Watchful'], spirit: ['Hallowed', 'Quiet'],
  time: ['Old', 'Patient'], entropy: ['Hollow', 'Grey'], chaos: ['Wild', 'Crooked'],
  order: ['Plain', 'Sworn'], light: ['Bright', 'Clear'], darkness: ['Dark', 'Hidden'],
};
/** One sensory detail per sphere: `hard` goods (metal, stone, wood, bone, glass, horn) and `soft` goods. */
const SPHERE_LOOK = {
  force:    { hard: 'heavier than it looks', soft: 'heavier than it looks' },
  matter:   { hard: 'without a scratch on it anywhere', soft: 'that never seems to wear through' },
  energy:   { hard: 'warm to the touch even in snow', soft: 'that steams a little after rain' },
  life:     { hard: 'with a green stain that comes back however often it is scrubbed', soft: 'that smells of cut grass in any season' },
  mind:     { hard: 'marked with small, careful tally-scratches', soft: 'covered in small, careful stitching' },
  spirit:   { hard: 'that feels watched when it is set down', soft: 'that feels watched when it is set down' },
  time:     { hard: 'worn smooth where a great many hands have held it', soft: 'faded pale along every fold' },
  entropy:  { hard: 'with rust that never spreads and never goes', soft: 'fraying at the edges, but never any further' },
  chaos:    { hard: 'that never sits quite where it was left', soft: 'that never hangs quite where it was left' },
  order:    { hard: 'perfectly straight and perfectly plain', soft: 'with every seam perfectly even' },
  light:    { hard: 'that catches the light in a dark room', soft: 'pale enough to see in the dark' },
  darkness: { hard: 'that is hard to find once it is put down', soft: 'that is hard to find once it is put down' },
};
const SOFT_FITS = new Set(['cloth', 'leather', 'hide', 'page']);
/** What a thing is leans which reach it serves: worn things endure and travel, tools notice. */
const KIND_REACH_BIAS = {
  vestments: { stone: 2, star: 1.5, iron: 0.6 },
  tools_instruments: { eye: 1.5, stone: 1.3, star: 1.3 },
  tomes_scrolls: { eye: 1.5, veil: 1.5, iron: 0.2 },
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. World context — FAKED for the prototype, built from real game concepts.
//    A live generator reads these from the graph instead: factions (actor nodes +
//    FACTION_DEFINITIONS — real here), places (location nodes + state.tiles terrain),
//    events (state.chronicleEntries / event nodes), dead heroes (deceased actors).
// ═══════════════════════════════════════════════════════════════════════════

const FACTION_EXTRA = {
  civic_guard:          { roles: ['sergeant', 'gate-warden'], nameRoles: ['Guardsman', 'Gate-warden'], spheres: { order: 2, force: 1 } },
  mercenary_company:    { roles: ['sergeant', 'quartermaster'], nameRoles: ['Sellsword', 'Quartermaster'], spheres: { force: 2, chaos: 1 } },
  thieves_guild:        { roles: ['fence', 'cutpurse'], nameRoles: ['Cutpurse', 'Fence'], spheres: { darkness: 2, chaos: 1 } },
  merchant_consortium:  { roles: ['factor', 'clerk'], nameRoles: ['Factor', 'Clerk'], spheres: { matter: 2, order: 1 } },
  temple_of_spheres:    { roles: ['priest', 'keeper'], nameRoles: ['Pilgrim', 'Priest'], spheres: { spirit: 2, light: 1 } },
  arcane_circle:        { roles: ['adept', 'archivist'], nameRoles: ['Adept', 'Archivist'], spheres: { mind: 2, energy: 1 } },
  rangers_brotherhood:  { roles: ['ranger', 'tracker'], nameRoles: ['Ranger', 'Tracker'], spheres: { life: 2, time: 1 } },
  holy_order_dawn:      { roles: ['vigil-keeper', 'healer'], nameRoles: ['Vigil-keeper', 'Healer'], spheres: { light: 2, spirit: 1 } },
  underking_court:      { roles: ['chamberlain', 'page'], nameRoles: ['Chamberlain', 'Collector'], spheres: { darkness: 2, order: 1 } },
  builders_fellowship:  { roles: ['mason', 'master builder'], nameRoles: ['Mason', 'Builder'], spheres: { matter: 2, order: 1 } },
  lorekeepers_covenant: { roles: ['scribe', 'copyist'], nameRoles: ['Scribe', 'Copyist'], spheres: { mind: 2, time: 1 } },
  adventuring_guild:    { roles: ['delver', 'guild captain'], nameRoles: ['Delver', 'Barrow-diver'], spheres: { chaos: 2, force: 1 } },
};
const FACTIONS = Object.fromEntries(V.FACTIONS.map(f => {
  const bare = f.name.replace(/^The /, '');
  return [f.id, { ...f, bare, the: `the ${bare}`, ...FACTION_EXTRA[f.id] }];
}));
/** What a culture's makers are called, by the kind of thing they made. */
const CRAFT_BY_KIND = {
  arms: 'smiths', vestments: 'weavers', relics_talismans: 'carvers', tools_instruments: 'makers',
  tomes_scrolls: 'scribes', mounts_beasts: 'breeders', provisions: 'brewers',
};

const PLACES = {
  low_harrow:     { name: 'Low Harrow', what: 'the drowned town on the marsh coast', terrain: 'marsh', spheres: { time: 2, entropy: 1 } },
  kel_barrow:     { name: 'Kel Barrow', what: 'the barrow hill above the crossroads', terrain: 'hills', spheres: { spirit: 2, darkness: 1 } },
  greywater_ford: { name: 'Greywater Ford', what: 'the ford on the old road', terrain: 'grassland', spheres: { force: 1, order: 1 } },
  the_ashfold:    { name: 'the Ashfold', what: 'the cinder plain under the dead mountain', terrain: 'volcano', spheres: { energy: 2, chaos: 1 } },
  saltmere:       { name: 'Saltmere', what: 'the salt-lake trading town', terrain: 'steppe', spheres: { matter: 2, order: 1 } },
  thornwood:      { name: 'Thornwood', what: 'the deep forest past the border', terrain: 'dense_forest', spheres: { life: 2, entropy: 1 } },
  vessas_rest:    { name: "Vessa's Rest", what: 'the monastery town high in the mountains', terrain: 'mountains', spheres: { mind: 2, light: 1 } },
};
const CULTURES = {
  harrowfolk: { name: 'the Harrowfolk', adj: 'Harrowfolk', home: 'low_harrow', spheres: { time: 2, darkness: 1 } },
  kel:        { name: 'the Kel', adj: 'Kel', home: 'kel_barrow', spheres: { spirit: 2, order: 1 } },
  ashborn:    { name: 'the Ashborn', adj: 'Ashborn', home: 'the_ashfold', spheres: { energy: 2, chaos: 1 } },
  vessani:    { name: 'the Vessani', adj: 'Vessani', home: 'vessas_rest', spheres: { mind: 2, light: 1 } },
};
const EVENTS = {
  drowning:        { name: 'the Drowning of Low Harrow', short: 'the Drowning', place: 'low_harrow', spheres: { time: 2, entropy: 2 }, what: 'the sea came over the marsh in one night', lingers: 'It still smells of the sea.',
                     salvage: 'It was pulled out of the mud at Low Harrow after the Drowning, the night the sea came over the marsh.' },
  kel_siege:       { name: 'the Siege of Kel Barrow', short: 'the siege', place: 'kel_barrow', spheres: { spirit: 2, force: 2 }, what: 'the Free Company held the barrow hill against the Grey Wraith Host for a whole winter', lingers: 'It has been cold ever since.',
                     salvage: 'It came down off the barrow hill after the Siege of Kel Barrow, when the Free Company held the hill against the Grey Wraith Host for a whole winter.' },
  greywater_stand: { name: 'the Last Stand at Greywater Ford', short: 'the Last Stand', place: 'greywater_ford', spheres: { force: 2, order: 2 }, what: 'ten guards held the ford for a day and a night', lingers: 'There is still river mud in its seams.',
                     salvage: 'It was dragged out of the river after the Last Stand at Greywater Ford, where ten guards held the ford for a day and a night.' },
  library_burning: { name: 'the Burning of the Library', place: 'vessas_rest', spheres: { energy: 2, mind: 2 }, what: "the Arcane Circle's library at Vessa's Rest burned to the stones", lingers: 'It still smells of smoke.',
                     salvage: "It was carried out of the Burning of the Library, the night the Arcane Circle's library at Vessa's Rest burned to the stones." },
  plague_year:     { name: 'the Plague Year', place: 'thornwood', spheres: { entropy: 3, life: 1 }, what: 'the Plague Shamble came out of Thornwood', lingers: 'Nobody likes to touch it.',
                     salvage: 'It was taken out of Thornwood after the Plague Year.' },
  salt_riots:      { name: 'the Salt Riots', place: 'saltmere', spheres: { chaos: 2, matter: 1 }, what: 'the salt-workers of Saltmere turned on the Consortium', lingers: 'There is still salt ground into it.',
                     salvage: 'It was picked up in the street at Saltmere after the Salt Riots.' },
  long_winter:     { name: 'the Long Winter', place: 'vessas_rest', spheres: { time: 2, order: 1 }, what: 'the passes stayed shut for a whole year', lingers: 'Frost still forms on it indoors.',
                     salvage: 'It kept someone alive through the Long Winter, the year the passes stayed shut.' },
  falling_stars:   { name: 'the Night of Falling Stars', place: 'the_ashfold', spheres: { energy: 2, spirit: 1, chaos: 1 }, what: 'burning metal fell on the Ashfold', lingers: 'It is still faintly warm.',
                     salvage: 'It was hammered out of the metal that fell on the Ashfold on the Night of Falling Stars.' },
};
const P = { she: { they: 'she', them: 'her', their: 'her' }, he: { they: 'he', them: 'him', their: 'his' } };
const HEROES = {
  hesta_ryle:  { name: 'Hesta Ryle', first: 'Hesta', family: 'Ryle', pr: 'she', faction: 'civic_guard', role: 'a Civic Guard captain', deed: 'who held Greywater Ford', event: 'greywater_stand', fate: 'died at the ford', dead: true },
  bram_oskell: { name: 'Bram Oskell', first: 'Bram', family: 'Oskell', pr: 'he', faction: 'mercenary_company', role: 'a Free Company sergeant', deed: 'who opened the gate at Kel Barrow', event: 'kel_siege', fate: 'was hanged for opening the gate', dead: true, oathbreaker: true },
  old_vannic:  { name: 'Old Vannic', first: 'Vannic', family: 'Vannic', pr: 'he', faction: 'arcane_circle', role: "the Arcane Circle's first archivist", deed: 'who went back into the burning library', event: 'library_burning', fate: 'did not come out of the fire', dead: true },
  sister_maud: { name: 'Sister Maud', first: 'Maud', family: 'Maud', pr: 'she', faction: 'holy_order_dawn', role: 'a healer of the Dawn', deed: 'who nursed Thornwood through the Plague Year', event: 'plague_year', fate: 'died of the plague in its last week', dead: true },
  ivo_tallow:  { name: 'Ivo Tallow', first: 'Ivo', family: 'Tallow', pr: 'he', faction: 'thieves_guild', role: 'a Thieves Guild fence', deed: 'who kept the best back room in Saltmere', event: 'salt_riots', fate: 'went missing in the Salt Riots' },
  arn_veck:    { name: 'Arn Veck', first: 'Arn', family: 'Veck', pr: 'he', faction: 'rangers_brotherhood', role: 'a Rangers Brotherhood tracker', deed: 'who walked the whole border twice', event: 'plague_year', fate: 'walked into Thornwood and did not come out', dead: true },
  maren_doss:  { name: 'Maren Doss', first: 'Maren', family: 'Doss', pr: 'she', faction: 'merchant_consortium', role: 'a Consortium factor', deed: 'who ran salt from Saltmere to the coast', event: 'drowning', fate: 'drowned with her boat at Low Harrow', dead: true },
  corvin_hale: { name: 'Corvin Hale', first: 'Corvin', family: 'Hale', pr: 'he', faction: 'underking_court', role: "the Underking's chamberlain", deed: "who kept the Court's book of debts", event: 'long_winter', fate: 'died owed more than anyone alive', dead: true },
  tamsin_weir: { name: 'Tamsin Weir', first: 'Tamsin', family: 'Weir', pr: 'she', faction: 'adventuring_guild', role: 'an Adventurers Guild delver', deed: 'who went first into the barrows at Kel Barrow', event: 'kel_siege', fate: 'came out of the barrows alone' },
  father_gall: { name: 'Father Gall', first: 'Gall', family: 'Gall', pr: 'he', faction: 'temple_of_spheres', role: 'a priest of the Temple of the Spheres', deed: 'who kept the Ashfold shrine through the Night of Falling Stars', event: 'falling_stars', fate: 'is buried under the shrine he kept', dead: true },
  wenna_kell:  { name: 'Wenna Kell', first: 'Wenna', family: 'Kell', pr: 'she', faction: 'underking_court', role: 'a lady of the Underking\'s Court', deed: 'who outlived four masters of the Court', event: 'long_winter', fate: 'faded out of the world rather than died' },
};
for (const [id, h] of Object.entries(HEROES)) h.id = id;
/** World instances of the eight real monster factions (MONSTER_FACTION_DEFINITIONS, one per creation sphere). */
const MONSTERS = {
  wraith_host:    { name: 'the Grey Wraith Host', def: 'monster_spirit', sphere: 'spirit', place: 'kel_barrow', one: 'a wraith of the Grey Wraith Host', immune: '#curse' },
  storm_flock:    { name: 'the Ashen Storm Flock', def: 'monster_energy', sphere: 'energy', place: 'the_ashfold', one: 'a bird of the Ashen Storm Flock' },
  beast_pack:     { name: 'the Thornwood Beast Pack', def: 'monster_force', sphere: 'force', place: 'thornwood', one: 'a wolf of the Thornwood Beast Pack' },
  salt_golems:    { name: 'the Salt Golems', def: 'monster_matter', sphere: 'matter', place: 'saltmere', one: 'a salt golem' },
  plague_shamble: { name: 'the Plague Shamble', def: 'monster_entropy', sphere: 'entropy', place: 'thornwood', one: 'a thing of the Plague Shamble', immune: '#disease' },
  echo_stalkers:  { name: 'the Drowned Echo Stalkers', def: 'monster_time', sphere: 'time', place: 'low_harrow', one: 'an echo stalker from the drowned town' },
  behemoths:      { name: 'the Steppe Behemoth Herd', def: 'monster_life', sphere: 'life', place: 'saltmere', one: 'a steppe behemoth' },
  mind_swarm:     { name: "the Mind Swarm under Vessa's Rest", def: 'monster_mind', sphere: 'mind', place: 'vessas_rest', one: 'a husk of the Mind Swarm' },
};
for (const [id, m] of Object.entries(MONSTERS)) {
  m.id = id;
  m.reachWeights = V.MONSTER_FACTIONS.find(f => f.id === m.def)?.reachWeights ?? {};
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. Forms and materials
// ═══════════════════════════════════════════════════════════════════════════

const F = (kind, noun, names, tags, slot, fits, extra = {}) => ({ kind, noun, names, tags, slot, fits, ...extra });
const FORMS = {
  sword:    F('arms', 'sword', ['Sword', 'Blade'], ['#weapon', '#melee'], 'weapon', ['metal'], { suffix: ['edge', 'fang', 'brand'] }),
  axe:      F('arms', 'axe', ['Axe', 'Axe'], ['#weapon', '#melee'], 'weapon', ['metal'], { suffix: ['bite', 'cleaver'] }),
  spear:    F('arms', 'spear', ['Spear', 'Spear'], ['#weapon', '#melee'], 'weapon', ['metal', 'wood'], { suffix: ['reach', 'point'] }),
  knife:    F('arms', 'knife', ['Knife', 'Knife'], ['#weapon', '#melee', '#precision'], 'weapon', ['metal', 'bone', 'glass'], { suffix: ['fang', 'tooth', 'edge'] }),
  mace:     F('arms', 'mace', ['Mace', 'Maul'], ['#weapon', '#melee'], 'weapon', ['metal', 'wood'], { suffix: ['maul', 'fall'] }),
  bow:      F('arms', 'bow', ['Bow', 'Bow'], ['#weapon', '#ranged'], 'weapon', ['wood', 'horn'], { suffix: ['song', 'string'] }),
  cloak:    F('vestments', 'cloak', ['Cloak', 'Mantle'], ['#cloth'], 'vestment', ['cloth', 'hide'], { suffix: ['shroud', 'mantle'] }),
  coat:     F('vestments', 'coat', ['Coat', 'Coat'], ['#cloth'], 'vestment', ['leather', 'hide'], { suffix: ['coat', 'hide'] }),
  mail:     F('vestments', 'mail shirt', ['Mail', 'Mail'], [], 'vestment', ['metal'], { suffix: ['mail', 'ward'] }),
  helm:     F('vestments', 'helm', ['Helm', 'Helm'], [], 'vestment', ['metal'], { suffix: ['helm', 'ward'] }),
  boots:    F('vestments', 'pair of boots', ['Boots', 'Boots'], ['#cloth'], 'vestment', ['leather'], { suffix: ['foot', 'stride'], plural: true }),
  stole:    F('vestments', 'stole', ['Stole', 'Stole'], ['#cloth'], 'vestment', ['cloth'], { suffix: ['stole', 'grace'], prefer: { silk: 4, wool: 3, grave_linen: 2, sailcloth: 0 } }),
  ring:     F('relics_talismans', 'ring', ['Ring', 'Ring'], ['#talisman'], 'ring', ['metal', 'stone'], { suffix: ['ring', 'band'] }),
  signet:   F('relics_talismans', 'signet ring', ['Signet', 'Signet'], ['#talisman'], 'ring', ['metal'], { suffix: ['mark', 'seal'] }),
  amulet:   F('relics_talismans', 'amulet', ['Amulet', 'Heart'], ['#talisman'], 'necklace', ['metal', 'stone'], { suffix: ['heart', 'ward'] }),
  locket:   F('relics_talismans', 'locket', ['Locket', 'Locket'], ['#talisman'], 'necklace', ['metal'], { suffix: ['heart'] }),
  charm:    F('relics_talismans', 'charm', ['Charm', 'Charm'], ['#talisman'], 'necklace', ['bone', 'stone', 'trophy'], { suffix: ['charm', 'knot', 'luck'] }),
  coin:     F('relics_talismans', 'coin', ['Coin', 'Coin'], ['#talisman'], 'wealth', ['metal'], { suffix: ['coin', 'mark'] }),
  bell:     F('relics_talismans', 'hand-bell', ['Bell', 'Bell'], [], 'utility', ['metal'], { suffix: ['bell', 'toll'], prefer: { bronze: 4, brass: 3, silver: 2, star_metal: 0.3, blackiron: 0.3, cold_iron: 0.5 } }),
  idol:     F('relics_talismans', 'idol', ['Idol', 'Idol'], [], 'utility', ['stone', 'wood'], { suffix: ['seed', 'root'] }),
  reliquary:F('relics_talismans', 'reliquary', ['Reliquary', 'Relic'], [], 'necklace', ['metal'], { suffix: ['grace', 'relic'] }),
  stone:    F('relics_talismans', 'stone', ['Stone', 'Stone'], ['#talisman'], 'utility', ['stone'], { suffix: ['stone', 'ward'] }),
  banner:   F('relics_talismans', 'banner', ['Banner', 'Standard'], [], 'utility', ['cloth'], { suffix: ['banner', 'call'], at: 'flew over', held: 'stood', carried: 'carried', endure: 'it did not fall' }),
  horn:     F('relics_talismans', 'war-horn', ['Horn', 'Horn'], [], 'utility', ['metal', 'trophy'], { suffix: ['call', 'horn'], at: 'was blown at', held: 'sounded', carried: 'blew', endure: 'it never went quiet' }),
  lantern:  F('tools_instruments', 'lantern', ['Lantern', 'Lamp'], ['#equipment'], 'utility', ['metal'], { suffix: ['light', 'wick', 'lamp'] }),
  compass:  F('tools_instruments', 'compass', ['Compass', 'Compass'], ['#equipment'], 'utility', ['metal'], { suffix: ['way', 'find'] }),
  staff:    F('tools_instruments', 'walking staff', ['Staff', 'Staff'], ['#equipment'], 'utility', ['wood'], { suffix: ['way', 'staff'] }),
  picks:    F('tools_instruments', 'set of lockpicks', ['Picks', 'Picks'], ['#tool'], 'utility', ['metal'], { suffix: ['hand', 'finger'] }),
  scales:   F('tools_instruments', 'pair of scales', ['Scales', 'Scales'], ['#tool'], 'utility', ['metal'], { suffix: ['weight', 'tally'] }),
  mirror:   F('tools_instruments', 'hand-mirror', ['Mirror', 'Glass'], ['#tool'], 'utility', ['metal', 'glass'], { suffix: ['glass'] }),
  book:     F('tomes_scrolls', 'book', ['Book', 'Book'], ['#tome'], 'tome', ['page'], { suffix: ['book', 'tongue'] }),
  ledger:   F('tomes_scrolls', 'ledger', ['Ledger', 'Ledger'], ['#tome'], 'tome', ['page'], { suffix: ['ledger', 'tally'] }),
  almanac:  F('tomes_scrolls', 'almanac', ['Almanac', 'Almanac'], ['#tome'], 'tome', ['page'], { suffix: ['book'] }),
  horse:    F('mounts_beasts', 'horse', ['Horse'], ['#beast', '#mount'], 'mount', ['coat'], { beast: true }),
  warhorse: F('mounts_beasts', 'war-horse', ['War-horse'], ['#beast', '#mount'], 'mount', ['coat'], { beast: true }),
  mule:     F('mounts_beasts', 'mule', ['Mule'], ['#beast', '#mount'], 'mount', ['coat'], { beast: true }),
  hound:    F('mounts_beasts', 'hound', ['Hound'], ['#beast'], 'ally', ['coat'], { beast: true }),
  hawk:     F('mounts_beasts', 'hawk', ['Hawk'], ['#beast'], 'ally', ['coat'], { beast: true }),
  salve:    F('provisions', 'pot of salve', ['Salve', 'Salve'], ['#provision', '#herb'], 'consumable', ['brew'], { brew: true }),
  rations:  F('provisions', 'bundle of trail rations', ['Rations', 'Rations'], ['#provision'], 'consumable', ['brew'], { brew: true }),
  wine:     F('provisions', 'flask of fire-wine', ['Fire-Wine', 'Fire-Wine'], ['#provision'], 'consumable', ['brew'], { brew: true }),
};
const BEAST_NAMES = ['Patience', 'Ash', 'Brindle', 'Crow', 'Moss', 'Tinker', 'Sorrow', 'Old Grey', 'Pepper', 'Sexton', 'Hob', 'Duchess'];
const BEAST_NAME_COAT = { 'Ash': 'grey_coat', 'Old Grey': 'grey_coat', 'Crow': 'black_coat', 'Brindle': 'brindle', 'Pepper': 'piebald' };

const M = (word, title, fits, spheres, extra = {}) => ({ word, title, fits, spheres, ...extra });
const MATERIALS = {
  blackiron:   M('blackiron', 'Blackiron', ['metal'], { force: 2, darkness: 1 }, { terrains: ['mountains', 'hills'] }),
  bronze:      M('bronze', 'Bronze', ['metal'], { order: 1, time: 1, matter: 1 }),
  brass:       M('brass', 'Brass', ['metal'], { energy: 1, order: 1 }, { notFor: ['arms', 'vestments'] }),
  bog_iron:    M('bog-iron', 'Bog-iron', ['metal'], { entropy: 2, time: 1 }, { terrains: ['marsh'] }),
  cold_iron:   M('cold-iron', 'Cold-iron', ['metal'], { order: 2 }, { look: 'that is always cold, even beside a fire', avoidWords: ['warm'] }),
  star_metal:  M('star-metal', 'Star-metal', ['metal'], { energy: 2, spirit: 1, light: 1 }, { terrains: ['volcano'], tags: ['#star_metal'], look: 'with a faint grain in it like frost on a window', scarce: 0.2 }),
  silver:      M('silver', 'Silver', ['metal'], { light: 2, spirit: 1 }, { look: 'tarnished black in every crease', notFor: ['vestments'] }),
  pewter:      M('pewter', 'Pewter', ['metal'], { order: 1, matter: 1 }, { notFor: ['arms', 'vestments'] }),
  silk:        M('undyed silk', 'Silk', ['cloth'], { light: 1, spirit: 1 }),
  ash_wood:    M('ash-wood', 'Ash-wood', ['wood'], { life: 1, order: 1 }, { terrains: ['dense_forest'] }),
  yew:         M('yew', 'Yew', ['wood'], { life: 1, time: 1, darkness: 1 }),
  bog_oak:     M('bog-oak', 'Bog-oak', ['wood'], { time: 2, entropy: 1 }, { terrains: ['marsh'], look: 'black as tar and hard as stone' }),
  bone:        M('bone', 'Bone', ['bone'], { entropy: 1, spirit: 1 }, { look: 'yellowed and smooth from handling' }),
  horn:        M('horn', 'Horn', ['horn'], { life: 1, force: 1 }),
  cinder_glass:M('cinder-glass', 'Cinder-glass', ['glass', 'stone'], { energy: 2, chaos: 1 }, { terrains: ['volcano'], look: 'black glass that still smells faintly of smoke' }),
  salt:        M('salt-crystal', 'Salt', ['stone'], { matter: 2, order: 1 }, { terrains: ['steppe'], look: 'cloudy white, and it leaves salt on the fingers' }),
  greystone:   M('greystone', 'Greystone', ['stone'], { matter: 1, time: 1, order: 1 }, { terrains: ['mountains', 'hills'] }),
  jet:         M('jet', 'Jet', ['stone'], { darkness: 2, entropy: 1 }),
  amber:       M('amber', 'Amber', ['stone'], { time: 2, life: 1 }, { look: 'with something small and winged caught inside' }),
  leather:     M('oiled leather', 'Leather', ['leather'], { matter: 1, life: 1 }),
  wolf_hide:   M('wolf-hide', 'Wolfhide', ['hide'], { life: 1, force: 1 }, { terrains: ['dense_forest'] }),
  grave_linen: M('grave-linen', 'Grave-linen', ['cloth'], { spirit: 2, entropy: 1 }, { look: 'grey and soft, and it smells of a cellar' }),
  wool:        M('grey wool', 'Wool', ['cloth'], { order: 1, life: 1 }),
  sailcloth:   M('tarred sailcloth', 'Sailcloth', ['cloth'], { time: 1, force: 1 }, { terrains: ['marsh'] }),
  calfskin:    M('calfskin', 'Calfskin', ['page'], { mind: 1, order: 1 }),
  birch_bark:  M('birch-bark', 'Birch-bark', ['page'], { life: 1, time: 1 }),
  scorched:    M('scorched vellum', 'Scorched', ['page'], { energy: 1, mind: 1 }, { look: 'its edges burnt brown and brittle' }),
  dun:         M('dun', 'Dun', ['coat'], { matter: 1 }),
  grey_coat:   M('grey', 'Grey', ['coat'], { time: 1 }),
  black_coat:  M('black', 'Black', ['coat'], { darkness: 1 }),
  piebald:     M('piebald', 'Piebald', ['coat'], { chaos: 1 }),
  brindle:     M('brindled', 'Brindled', ['coat'], { life: 1 }),
  juniper:     M('juniper', 'Juniper', ['brew'], { life: 1, spirit: 1 }),
  bitterroot:  M('bitterroot', 'Bitterroot', ['brew'], { entropy: 1, life: 1 }),
  black_honey: M('black-honey', 'Black-honey', ['brew'], { life: 1, darkness: 1 }),
  // trophy parts — reachable only through the monster table
  wolf_fang:    M('wolf-fang', 'Wolf-fang', ['trophy'], { force: 2 }, { monster: 'beast_pack', fitsForms: ['knife', 'charm', 'spear'] }),
  wolf_pelt:    M('wolf-pelt', 'Wolfpelt', ['trophy'], { force: 1, life: 1 }, { monster: 'beast_pack', fitsForms: ['cloak', 'coat'] }),
  storm_feather:M('storm-feather', 'Storm-feather', ['trophy'], { energy: 2 }, { monster: 'storm_flock', fitsForms: ['charm', 'cloak'] }),
  storm_talon:  M('storm-talon', 'Storm-talon', ['trophy'], { energy: 2 }, { monster: 'storm_flock', fitsForms: ['knife'] }),
  grave_cloth:  M('wraith grave-cloth', 'Wraithcloth', ['trophy'], { spirit: 2 }, { monster: 'wraith_host', fitsForms: ['cloak', 'charm'] }),
  salt_heart:   M('golem salt-heart', 'Salt-heart', ['trophy'], { matter: 2 }, { monster: 'salt_golems', fitsForms: ['charm'] }),
  plague_bone:  M('plague-bone', 'Plague-bone', ['trophy'], { entropy: 2 }, { monster: 'plague_shamble', fitsForms: ['knife', 'charm'] }),
  echo_shell:   M('echo-shell', 'Echo-shell', ['trophy'], { time: 2 }, { monster: 'echo_stalkers', fitsForms: ['charm'] }),
  behemoth_horn:M('behemoth-horn', 'Behemoth-horn', ['trophy'], { life: 1, force: 1 }, { monster: 'behemoths', fitsForms: ['bow', 'charm', 'spear'] }),
  swarm_husk:   M('swarm-husk', 'Husk', ['trophy'], { mind: 2 }, { monster: 'mind_swarm', fitsForms: ['charm'] }),
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. Effect builders
// ═══════════════════════════════════════════════════════════════════════════

const fx = {
  passive: (reach, value) => ({ type: 'passive', reach, value }),
  cond: (condition, reach, value) => ({ type: 'conditional', condition, reach, value }),
  stat: (contributions) => ({ type: 'stat_contribution', contributions }),
  shaper: (trigger, steps, maxMargin, reach) => ({ type: 'test_shaper', trigger, steps, maxMargin, ...(reach ? { reach } : {}) }),
  ward: (amount, consumeOnPrevent) => ({ type: 'prevent_loss', channel: 'quintessence', amount, consumeOnPrevent }),
  immune: (tags) => ({ type: 'tag_immunity', tags }),
  reveal: (target, range) => ({ type: 'reveal', target, range }),
  range: (o) => ({ type: 'range_modifier', ...o }),
  rule: (rule, value) => ({ type: 'modify_rules', scope: { scope: 'self' }, rule, value, ticks: 'permanent' }),
  aura: (radius, target, reach, value) => ({ type: 'aura', radius, target, reach, value }),
  drag: (reach, multiplier) => ({ type: 'behavior_weight', reach, multiplier }),
  social: (targetFilter, cooperationBias) => ({ type: 'social_modifier', targetFilter, cooperationBias }),
  gate: (reach) => ({ type: 'action_gate', mode: 'block', reach }),
  drift: (axis, ratePerTick, limitValue) => ({ type: 'axiological_drift', axis, ratePerTick, limitValue }),
  thin: (amount) => ({ type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount, mode: 'per_tick' }),
  hex: (property, value) => ({ type: 'hex_effect', property, value, mode: 'add' }),
  trig: (on, payload, opts = {}) => ({ type: 'action_trigger', on, payload, ...opts }),
  charge: (charges, reach, value) => ({ type: 'consumable_charge', charges, onUse: { reach, value }, destroyOnEmpty: true }),
  stack: (stackOn, reach, valuePerStack, maxStacks, decayPerTick) => ({ type: 'stacking', stackOn, reach, valuePerStack, maxStacks, ...(decayPerTick ? { decayPerTick } : {}) }),
  cycle: (activeTicks, cooldownTicks, reach, value) => ({ type: 'cooldown', activeTicks, cooldownTicks, reach, value }),
  suppress: (hexes, ticks = 2) => ({ type: 'suppress', target: 'all_effects', scope: { scope: 'radius', hexes }, ticks }),
  slot: (slotTag, bonus) => ({ type: 'slot_bonus', slotTag, bonus }),
};
const boon = (effect, note) => ({ effect, role: 'boon', note });
const bane = (effect, note) => ({ effect, role: 'catch', note });
const breakTrigger = (tier, line) => bane(fx.trig('encounter_critical_failure', { kind: 'self_remove' }, { probability: MAG.breakChance[tier], cooldownTicks: 0, narrativeTemplate: line }));

/** Which REAL conditions a tag blocks — so an immunity can only name what exists. */
const ALL_CONDITIONS = [...V.AGENT_CONDITIONS, ...V.REWARD_CONDITIONS];
const norm = (t) => t.replace(/^#/, '');
function blockedBy(tag) { return ALL_CONDITIONS.filter(c => c.tags.some(t => norm(t) === norm(tag))); }
const CONDITION_NAME = Object.fromEntries(ALL_CONDITIONS.map(c => [c.id, c.name]));

// ═══════════════════════════════════════════════════════════════════════════
// 8. Trope cores — the authored envelopes.
//    Pools (heroes, events, factions, monsters, spheres, materials) restrict the world
//    to what fits the trope; the provenance template picks which entities get named.
// ═══════════════════════════════════════════════════════════════════════════

const VIRTUES = {
  'trait.core.core_integrity.virtue':   { word: 'True', adj: 'True', spheres: { light: 2, order: 2 } },
  'trait.core.core_warmth.virtue':      { word: 'Warm', adj: 'Kind', spheres: { life: 2, spirit: 1 } },
  'trait.core.core_hope.virtue':        { word: 'Hopeful', adj: 'Bright', spheres: { light: 2, energy: 1 } },
  'trait.core.core_forgiveness.virtue': { word: 'Forgiving', adj: 'Merciful', spheres: { spirit: 2, life: 1 } },
  'trait.core.core_humility.virtue':    { word: 'Humble', adj: 'Plain', spheres: { order: 1, matter: 2 } },
};

const TROPES = [
  // ── Fantasy tropes ─────────────────────────────────────────────────────
  {
    id: 'blood_hungry', label: 'the blade that wants blood', tiers: [2, 3, 4], weight: 1.2,
    forms: { sword: 3, axe: 2, knife: 1, spear: 1 }, reaches: { iron: 1 },
    spheres: { force: 3, entropy: 2, chaos: 2, darkness: 2, energy: 1 },
    factions: { mercenary_company: 3, adventuring_guild: 1, underking_court: 1 },
    heroes: { bram_oskell: 3, tamsin_weir: 1, hesta_ryle: 1 }, events: { kel_siege: 2, greywater_stand: 1, salt_riots: 1 },
    family: ['#combat'],
    looks: ['its edge nicked in a dozen places and never once dull', 'with a grip that is always warm', 'wrapped at the hilt in cord gone black and stiff'],
    prov: [
      { tone: 'ominous', uses: ['hero'], text: 'It belonged to {hero}, {hero.deed}. {hero.They} never lost a fight with it, and never once put it down.' },
      { tone: 'martial', uses: ['faction'], text: '{faction.Members} pass it to whoever is left standing after a battle. It has had a great many owners.' },
      { tone: 'ominous', uses: ['event'], text: 'It was found on the field after {event}, standing upright in the mud with nobody near it.' },
      { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} made it to a plain pattern. Something got into it afterwards.' },
    ],
    names: { definite: ['Hungry', 'Red', 'Unquiet', 'Glad'], xofy: ['the Red Harvest', 'Many Widows', 'the Long Grudge'], role: ['Headsman', 'Reaver'] },
    grammar: { definite: 3, portmanteau: 3, xofy: 2, person: 2, material: 1 },
    build(c) {
      const pick = c.draw('catch', { drag: 3, drift: 3, cold: 2, thin: c.tier >= 3 ? 2 : 0 });
      const out = [
        boon(fx.passive('iron', c.mag('passive'))),
        boon(fx.stat({ iron: c.mag('stat') })),
      ];
      if (pick !== 'cold') out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))));
      if (c.tier === 4) out.push(boon(fx.stack('on_damaged', 'iron', 0.02, 3, 0.25)));
      if (pick === 'drag') out.push(bane(fx.drag('iron', c.mag('behavior'))));
      if (pick === 'drift') out.push(bane(fx.drift(AXIS.iron.valuePair, -c.mag('drift'), -0.6)));
      if (pick === 'cold') { out.push(bane(fx.passive('heart', -c.mag('penalty')))); out.push(bane(fx.stat({ heart: -c.mag('statPenalty') }))); }
      if (pick === 'thin') c.curse(out);
      return out;
    },
  },
  {
    id: 'chose_bearer', label: 'the weapon that chose its bearer', tiers: [3, 4], weight: 1,
    forms: { sword: 3, spear: 2, bow: 1 }, reaches: { iron: 1 },
    spheres: { light: 2, order: 2, spirit: 2, force: 1, life: 1 },
    factions: { civic_guard: 2, rangers_brotherhood: 1, mercenary_company: 1 },
    heroes: { hesta_ryle: 3, arn_veck: 2, bram_oskell: 1 },
    family: ['#combat', '#relic'], storied: true,
    looks: ['with a plain grip and no ornament at all', 'wrapped in a faded ribbon nobody has dared to take off', "with a name scratched into the tang in a child's hand"],
    prov: [
      { tone: 'martial', uses: ['hero'], text: 'It was carried by {hero}, {hero.deed}. Since {hero.they} {hero.fate}, it has only answered to a {virtue.word} hand.' },
      { tone: 'reverent', uses: ['hero', 'faction'], text: '{faction.The} keep it for whoever is worthy of {hero}, {hero.deed}. Most who try it put it down again.' },
      { tone: 'mystical', uses: ['hero'], text: 'It went into the ground with {hero}. It came back up on its own, and it is still looking for someone {virtue.word}.' },
    ],
    names: { role: ['Warden', 'Champion'] },
    grammar: { definite: 4, person: 3, proper: 2, portmanteau: 1 },
    build(c) {
      const vid = c.draw('virtue', Object.fromEntries(Object.entries(VIRTUES).map(([k, v]) => [k, 1 + (v.spheres[c.sphere] ?? 0)])));
      c.virtue = { id: vid, ...VIRTUES[vid] };
      return [
        boon(fx.cond(`has_trait:${vid}`, 'iron', round(c.mag('conditional') * 1.3))),
        boon(fx.passive('iron', c.mag('passive', 1))),
        boon(fx.stat({ iron: c.mag('stat') })),
        bane(fx.cond(`lacks_trait:${vid}`, 'iron', -round(c.mag('penalty') * 1.5))),
      ];
    },
  },
  {
    id: 'shows_the_dead', label: 'the lantern that shows the dead', tiers: [2, 3, 4], weight: 1,
    forms: { lantern: 3, bell: 1, mirror: 1 }, reaches: { veil: 3, eye: 2 },
    spheres: { spirit: 3, darkness: 2, time: 2, entropy: 1 },
    factions: { temple_of_spheres: 2, holy_order_dawn: 1 },
    heroes: { maren_doss: 2, sister_maud: 1, tamsin_weir: 1 }, events: { drowning: 3, kel_siege: 1, plague_year: 2 },
    family: ['#vision', '#supernatural'],
    looks: ['its glass fogged from the inside', 'with a wick that burns a thin, cold blue', 'green with verdigris, on a short chain'],
    looksByForm: { bell: ['with a clapper wrapped in black cloth', 'green with verdigris, on a short chain'], mirror: ['its glass fogged from the inside', 'that shows the room a little darker than it is'] },
    prov: [
      { tone: 'mystical', uses: ['event'], text: 'It was taken from {event.place} after {event}. {form.It} still {form.works} on its own some nights.' },
      { tone: 'reverent', uses: ['faction'], text: '{faction.The} give one to each keeper who sits with the dying. This one was never handed back.' },
      { tone: 'ominous', uses: ['hero'], text: '{hero} used it to look for the people {hero.they} lost. {hero.They} found them.' },
    ],
    names: { definite: ['Grey', 'Mourning', 'Blue', 'Last'], xofy: ['the Drowned', 'the Unburied', 'the Low Watch', 'Old Names'], role: ['Ferryman', 'Gravewarden', 'Mourner'] },
    grammar: { xofy: 3, role: 2, definite: 2, portmanteau: 2 },
    build(c) {
      const out = [
        boon(fx.reveal('encounters', MAG.reveal[c.tier] + (c.tier === 4 ? 1 : 0))),
        boon(fx.cond('health_low', 'veil', c.mag('conditional'))),
      ];
      if (c.tier >= 3) out.push(boon(fx.stat({ [c.reach]: c.mag('stat', 1) })));
      const pick = c.draw('catch', { nightmares: 3, grief: 2, thin_living: 2 });
      if (pick === 'nightmares') out.push(bane(fx.trig('encounter_failure', { kind: 'condition_grant', conditionTraitId: 'reward_condition_nightmares', durationTicks: 24 }, { probability: 0.3, cooldownTicks: 12, narrativeTemplate: '{actor} sees the faces again that night.' })));
      if (pick === 'grief') out.push(bane(fx.trig('encounter_failure', { kind: 'condition_grant', conditionTraitId: 'trait.condition.grieving', durationTicks: 36 }, { probability: 0.25, cooldownTicks: 24, narrativeTemplate: '{item_name} shows {actor} someone they lost.' })));
      if (pick === 'thin_living') out.push(bane(fx.passive('heart', -c.mag('penalty')), 'the living seem thin'));
      return out;
    },
  },
  {
    id: 'bargain', label: 'the ring that bargains', tiers: [2, 3, 4], weight: 1,
    forms: { ring: 3, coin: 2, amulet: 1 }, reaches: { gold: 2, shadow: 2, heart: 1, iron: 1, star: 1 },
    spheres: { darkness: 3, chaos: 2, order: 1, time: 1 },
    factions: { underking_court: 4, thieves_guild: 1 },
    heroes: { corvin_hale: 3, ivo_tallow: 1 },
    family: ['#relic', '#curse'],
    looks: ['warm when it wants something', 'too heavy for its size', 'with a tiny pair of scales worked into it'],
    prov: [
      { tone: 'ominous', uses: ['faction'], text: '{faction.The} lend these out. They are never given, and the loan is always repaid.' },
      { tone: 'ominous', uses: ['hero'], text: 'It belonged to {hero}, {hero.role} {hero.deed}. {hero.They} {hero.fate}.' },
      { tone: 'mystical', uses: [], text: 'Nobody made it. It turns up in the pocket of someone who badly needs a win, and it keeps an account.' },
    ],
    names: { definite: ['Honest', 'Fair', 'Patient', 'Smiling'], xofy: ['What Is Owed', 'Small Debts', 'Fair Terms', 'the Long Account'], role: ['Moneylender', 'Tollkeeper'] },
    grammar: { definite: 3, xofy: 3, role: 2, portmanteau: 1 },
    build(c) {
      const r = c.reach;
      const out = [
        boon(fx.shaper('near_miss', 1, MAG.shaperMargin[c.tier])),
        boon(fx.passive(r, c.mag('passive'))),
      ];
      if (c.tier >= 3) out.push(boon(fx.stat({ [r]: c.mag('stat') })));
      out.push(bane(fx.trig('encounter_success', { kind: 'resource_delta', resource: 'quintessence', amount: -MAG.bargainCost[c.tier] }, { cooldownTicks: 0, narrativeTemplate: '{item_name} takes its due from {actor}.' })));
      if (c.tier >= 3) c.stampCursed = true;
      return out;
    },
  },
  {
    id: 'deathless', label: 'the thing that will not let you die', tiers: [4], weight: 1,
    forms: { amulet: 2, locket: 2, reliquary: 1 }, reaches: { stone: 2, heart: 1 },
    spheres: { time: 3, spirit: 2, entropy: 2, darkness: 1 },
    factions: { underking_court: 2, temple_of_spheres: 1 },
    heroes: { wenna_kell: 1 }, events: { kel_siege: 1, long_winter: 2, drowning: 1 },
    family: ['#relic', '#cursed', '#ancient'],
    looks: ['that ticks faintly, like a slow heart', 'with a lock of grey hair behind cracked glass', 'cold, except against skin'],
    prov: [
      { tone: 'ominous', uses: ['hero'], text: '{hero}, {hero.deed}, wore it for longer than anyone could remember. {hero.They} never died. In the end there was not enough of {hero.them} left to.' },
      { tone: 'ominous', uses: ['event'], text: 'Its last bearer walked out of {event} without a scratch, and was a ghost of a person within the year.' },
    ],
    names: { definite: ['Stubborn', 'Unfinished', 'Patient'], xofy: ['Many Winters', 'the Held Breath'] },
    grammar: { definite: 3, xofy: 2, person: 1 },
    build(c) {
      c.stampCursed = true;
      return [
        boon(fx.rule('death_prevented', true)),
        boon(fx.stat({ [c.reach]: c.mag('stat', 1) })),
        bane(fx.thin(MAG.thinning[4])),
      ];
    },
  },
  {
    id: 'nullstone', label: 'the stone that quiets magic', tiers: [2, 3, 4], weight: 0.9,
    forms: { stone: 3, amulet: 1, knife: 1 }, reaches: { stone: 2, eye: 1 },
    spheres: { order: 3, matter: 2, darkness: 1 },
    factions: { civic_guard: 1, lorekeepers_covenant: 1, builders_fellowship: 1 }, events: { library_burning: 1 },
    materials: { cold_iron: 6, greystone: 6, jet: 2, salt: 2 },
    family: ['#anti-magic'],
    looks: ['dull, and slightly too cold', 'that makes the air around it feel close', 'with no mark of any kind on it'],
    prov: [
      { tone: 'practical', uses: ['faction'], text: '{faction.The} keep a few of these for dealing with people who carry charms. They do not talk about it.' },
      { tone: 'mystical', uses: ['event'], text: 'It was found in the ashes after {event}. Nothing near it had burned.' },
      { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} set one into the door of every house where a witch was born.' },
    ],
    names: { definite: ['Grey', 'Quiet', 'Dull', 'Cold'], xofy: ['Silence', 'the Closed Door'], role: ['Witchfinder'] },
    grammar: { definite: 3, portmanteau: 3, role: 1, xofy: 1 },
    build(c) {
      const out = [
        boon(fx.suppress(c.tier === 4 ? 2 : 1)),
        boon(fx.passive(c.reach, c.mag('passive'))),
      ];
      if (c.tier >= 3) out.push(boon(fx.immune(['#curse'])));
      out.push(bane({ type: '_note', text: "Its bearer's own charms go quiet too — it does not pick sides." }, 'inherent: the suppress radius includes the bearer'));
      return out;
    },
  },
  {
    id: 'forbidden_book', label: 'the book that should not be read', tiers: [2, 3, 4], weight: 1,
    forms: { book: 3, almanac: 1, ledger: 1 }, reaches: { veil: 3, eye: 2 },
    spheres: { mind: 3, darkness: 2, time: 2, entropy: 1 },
    factions: { arcane_circle: 3, lorekeepers_covenant: 2 },
    heroes: { old_vannic: 1 }, events: { library_burning: 3, long_winter: 1 },
    family: ['#knowledge', '#arcane'],
    looks: ['its clasp rusted shut and then broken open', 'written in a small, crowded hand that gets smaller towards the end', 'with every third page cut out'],
    prov: [
      { tone: 'ominous', uses: ['hero', 'event'], text: '{hero} went back into the fire for it during {event}. {hero.They} {hero.fate}. The book did.' },
      { tone: 'mystical', uses: ['faction'], text: '{faction.The} list it among the books that are not to be copied. This is a copy.' },
      { tone: 'practical', uses: ['culture'], text: 'A {culture.adj} scribe wrote it over one winter and would not say where the words came from.' },
    ],
    names: { definite: ['Unread', 'Smaller', 'Last', 'Grey'], xofy: ['Unwritten Things', 'Old Names', 'the Long Winter'], role: ['Archivist', 'Heretic'] },
    grammar: { definite: 3, person: 2, xofy: 2, portmanteau: 1 },
    build(c) {
      const out = [
        boon(fx.rule('tier_advancement_cost_multiplier', MAG.growth[c.tier])),
        boon(fx.cond('alone', 'veil', c.mag('conditional'))),
        boon(fx.stat({ [c.reach]: c.mag('stat') })),
      ];
      const pick = c.draw('catch', { shaken: 3, nightmares: 2, impatient: 2 });
      if (pick === 'shaken') out.push(bane(fx.trig('encounter_failure', { kind: 'condition_grant', conditionTraitId: 'trait.condition.shaken', durationTicks: 24 }, { probability: 0.4, cooldownTicks: 12, narrativeTemplate: '{actor} cannot stop thinking about the last chapter.' })));
      if (pick === 'nightmares') out.push(bane(fx.trig('encounter_failure', { kind: 'condition_grant', conditionTraitId: 'reward_condition_nightmares', durationTicks: 36 }, { probability: 0.3, cooldownTicks: 24 })));
      if (pick === 'impatient') out.push(bane(fx.drift(AXIS.veil.valuePair, -c.mag('drift'), -0.5)));
      return out;
    },
  },
  {
    id: 'saints_relic', label: "a saint's relic", tiers: [2, 3, 4], weight: 1,
    forms: { reliquary: 3, stole: 1, bell: 1 }, reaches: { heart: 2, star: 2, stone: 1 },
    spheres: { spirit: 3, light: 3, life: 2 },
    factions: { holy_order_dawn: 3, temple_of_spheres: 2 },
    heroes: { sister_maud: 4, father_gall: 3 },
    family: ['#divine', '#relic', '#healing'],
    looks: ['worn thin where the faithful have kissed it', 'with a glass window gone milky with age'],
    looksByForm: { reliquary: ['holding a finger-bone wrapped in faded red silk', 'worn thin where the faithful have kissed it', 'with a glass window gone milky with age'], stole: ['embroidered with a small, crooked sun', 'worn thin where the faithful have kissed it'], bell: ['that rings softer than it should', 'worn thin where the faithful have kissed it'] },
    prov: [
      { tone: 'reverent', uses: ['hero', 'faction'], text: '{form.Holds} {hero}, {hero.deed}. {faction.The} carry it to places the sick cannot leave.' },
      { tone: 'reverent', uses: ['hero'], text: '{hero} {hero.fate}. The sick who pray at {hero.their} grave still go home well.' },
    ],
    names: { definite: ['Dawn', 'Mended', 'Quiet'], xofy: ['the Low Watch', 'the Vigil', 'the Last Week'], role: ['Pilgrim', 'Sexton'] },
    grammar: { proper: 4, xofy: 2, definite: 1, person: 2 },
    build(c) {
      const sickness = c.draw('ward', { disease: c.hero.id === 'sister_maud' ? 4 : 1, curse: c.hero.id === 'father_gall' ? 4 : 1 });
      const out = [
        boon(fx.immune([sickness === 'disease' ? '#disease' : '#curse'])),
        boon(fx.rule('healing_multiplier', MAG.healing[c.tier])),
      ];
      if (c.tier >= 3) out.push(boon(fx.aura(1, 'allies', c.reach, c.mag('aura'))));
      if (c.tier >= 3) out.push(boon(fx.hex('divineInfluence', MAG.holy[c.tier])));
      out.push(bane(fx.gate('shadow')));
      return out;
    },
  },
  {
    id: 'blight', label: 'the relic that sours the land', tiers: [3, 4], weight: 0.8,
    forms: { idol: 3, knife: 1, amulet: 1 }, reaches: { veil: 2, shadow: 2 },
    spheres: { entropy: 4, darkness: 2, chaos: 2 },
    events: { plague_year: 3, drowning: 1 }, monsters: { plague_shamble: 1 },
    family: ['#relic', '#curse', '#ancient'],
    looks: ['carved from something that was once alive', 'with a face worn off by the hands of whoever prayed to it', 'that leaves a grey smear on anything it rests on'],
    looksByForm: { knife: ['with a blade gone grey and pitted', 'that leaves a grey smear on whatever it cuts'], amulet: ['that leaves a grey smear on the skin under it', 'with a face worn off by the hands of whoever prayed to it'] },
    materials: { bone: 6, bog_oak: 4, jet: 4, bog_iron: 3 },
    prov: [
      { tone: 'ominous', uses: ['event'], text: 'It was dug up in {event.place} the spring after {event}. The field it came from has not grown anything since.' },
      { tone: 'ominous', uses: ['monster'], text: '{monster.One} carried it. When the thing was burned, this was all that did not.' },
    ],
    names: { definite: ['Black', 'Grey', 'Hungry'], xofy: ['the Plague Year', 'Bad Harvests', 'the Grey Field'] },
    grammar: { definite: 3, portmanteau: 3, xofy: 2 },
    build(c) {
      return [
        boon(fx.passive(c.reach, c.mag('passive'))),
        boon(fx.cond(c.reach === 'veil' ? 'health_low' : 'alone', c.reach, c.mag('conditional', 1))),
        boon(fx.stat({ [c.reach]: c.mag('stat') })),
        bane(fx.hex('corruption', MAG.corruption[c.tier])),
      ];
    },
  },
  // ── World-concept tropes ───────────────────────────────────────────────
  {
    id: 'heirloom', label: 'the heirloom', tiers: [2, 3], weight: 1,
    forms: { signet: 3, sword: 1, cloak: 1, locket: 1 }, reaches: { heart: 3, gold: 2 },
    spheres: { order: 2, time: 2, spirit: 1, light: 1 },
    factions: { underking_court: 2, merchant_consortium: 2, civic_guard: 1 },
    heroes: { hesta_ryle: 1, maren_doss: 2, corvin_hale: 2, bram_oskell: 1 },
    family: ['#relic', '#social'], storied: true,
    looks: ['worn thin by a great many owners', 'with the family mark half rubbed away', 'mended more than once, each time by a different hand'],
    prov: [
      { tone: 'reverent', uses: ['hero'], text: 'It has been in the {hero.family} family longer than anyone can say. {hero} was the last to wear it openly.' },
      { tone: 'practical', uses: ['hero', 'faction'], text: 'The {hero.family} name still opens doors among {faction.the}, and this is how people know the name.' },
      { tone: 'ominous', uses: ['hero'], text: 'The {hero.family} family want it back. {hero} was the last of them to own it honestly.' },
    ],
    names: { definite: ['Old', 'Worn'] },
    grammar: { house: 4, definite: 1, person: 2 },
    build(c) {
      const out = [
        boon(fx.cond('at_home_territory', c.reach, c.mag('conditional'))),
        boon(fx.rule('faction_influence_multiplier', MAG.influence[c.tier])),
        boon(fx.social('same_faction', c.tier === 3 ? 0.2 : 0.15)),
      ];
      if (c.tier === 3 || c.draw('catch?', { yes: 1, no: 1 }) === 'yes') out.push(bane(fx.social('different_faction', -0.15)));
      return out;
    },
  },
  {
    id: 'beast_trophy', label: 'a trophy taken from a monster', tiers: [1, 2, 3], weight: 1.1,
    forms: { knife: 2, cloak: 2, charm: 3, bow: 1, spear: 1 }, reaches: {},
    spheres: {}, // comes from the monster
    factions: { rangers_brotherhood: 3, adventuring_guild: 3, mercenary_company: 1 },
    heroes: { arn_veck: 2, tamsin_weir: 2 },
    monsters: { beast_pack: 3, storm_flock: 2, wraith_host: 2, plague_shamble: 2, salt_golems: 1, echo_stalkers: 1, behemoths: 2, mind_swarm: 1 },
    trophy: true, family: ['#wilderness'],
    looks: ['still smelling faintly of the animal', 'bound with sinew and not much else', 'scarred where it was cut free'],
    prov: [
      { tone: 'martial', uses: ['monster', 'hero'], text: '{hero} took it from {monster.one} and wore it home as proof.' },
      { tone: 'practical', uses: ['monster', 'faction'], text: '{faction.Members} cut these from {monster} to sell. This one was not sold.' },
      { tone: 'martial', uses: ['monster'], text: 'It was taken from {monster.one} near {monster.place} by someone who did not live long enough to boast about it.' },
    ],
    names: { role: ['Hunter', 'Trapper'] },
    grammar: { material: 3, role: 2, portmanteau: 2, person: 1 },
    build(c) {
      const r = c.reach;
      const out = [boon(fx.cond('in_wilderness', r, c.mag('conditional', 1)))];
      if (FORMS[c.formId].kind === 'arms') out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))), boon(fx.passive('iron', c.mag('passive', 1))));
      else out.push(boon(fx.passive(r, c.mag('passive'))));
      if (c.tier >= 2) out.push(boon(fx.stat({ [r]: c.mag('stat', 1) })));
      if (c.tier >= 2 && c.monster.immune) out.push(boon(fx.immune([c.monster.immune])));
      return out;
    },
  },
  {
    id: 'disaster_salvage', label: 'salvage from a disaster', tiers: [2, 3], weight: 1.1,
    forms: { bell: 2, helm: 2, sword: 1, cloak: 1 }, reaches: {},
    spheres: {}, events: { drowning: 3, kel_siege: 2, greywater_stand: 2, library_burning: 2, long_winter: 2, falling_stars: 2 },
    factions: { lorekeepers_covenant: 1, civic_guard: 1 },
    family: ['#ruins'],
    looks: ['dented, and kept that way on purpose'],
    looksByEvent: {
      drowning: ['crusted with old salt', 'stained green up to where the water came'], kel_siege: ['dented, and kept that way on purpose', 'with frost-cracks in it that never close'],
      greywater_stand: ['dented, and kept that way on purpose', 'nicked all along one edge'], library_burning: ['blackened down one side', 'its edges burnt brown and brittle'],
      long_winter: ['patched with fur at every seam', 'stiff, as if it has never quite thawed'], falling_stars: ['with a faint grain in it like frost on a window', 'that ticks now and then, as if still cooling'],
    },
    prov: [
      { tone: 'ominous', uses: ['event'], text: '{event.salvage} {event.lingers}' },
      { tone: 'reverent', uses: ['event'], text: '{event.salvage} People who were there still know it on sight.' },
    ],
    names: { definite: ['Last'] },
    definiteByEvent: { drowning: ['Drowned', 'Salt'], kel_siege: ['Cold', 'Last'], greywater_stand: ['Last', 'Ford'], library_burning: ['Burnt', 'Unburnt'], long_winter: ['Frozen', 'Winter'], falling_stars: ['Fallen', 'Burning'] },
    grammar: { proper: 4, definite: 3, portmanteau: 1 },
    formsByEvent: {
      drowning: { bell: 3, helm: 1, cloak: 1 }, kel_siege: { helm: 2, sword: 2, spear: 1 }, greywater_stand: { helm: 1, sword: 1, spear: 2 },
      library_burning: { book: 1 }, falling_stars: { sword: 2, amulet: 1, knife: 1 }, long_winter: { cloak: 3, boots: 1 },
    },
    materialsByEvent: { library_burning: { scorched: 50 }, falling_stars: { star_metal: 50 }, drowning: { bog_iron: 4, bronze: 3, sailcloth: 4 } },
    build(c) {
      const e = c.eventId; const out = [];
      if (e === 'drowning') {
        out.push(boon(fx.cond('near_water', 'stone', c.mag('conditional', 1))), boon(fx.stat({ stone: c.mag('stat') })));
        out.push(bane(fx.trig('encounter_failure', { kind: 'condition_grant', conditionTraitId: 'trait.condition.grieving', durationTicks: 24 }, { probability: 0.25, cooldownTicks: 24, narrativeTemplate: '{item_name} rings once, with nobody touching it.' })));
        c.reach = 'stone';
      }
      if (e === 'kel_siege' || e === 'greywater_stand') {
        out.push(boon(fx.cond('outnumbered', 'iron', c.mag('conditional', 1))), boon(fx.stat({ iron: c.mag('stat', 1) })));
        if (c.tier === 3) out.push(boon(fx.ward(MAG.ward[c.tier], false)));
        c.reach = 'iron';
      }
      if (e === 'library_burning') { out.push(boon(fx.rule('tier_advancement_cost_multiplier', MAG.growth[c.tier])), boon(fx.passive('eye', c.mag('passive')))); c.reach = 'eye'; }
      if (e === 'long_winter') {
        out.push(boon(fx.cond('in_wilderness', 'stone', c.mag('conditional', 1))), boon(fx.stat({ stone: c.mag('stat') })));
        out.push(bane(fx.rule('duration_decay_multiplier', 0.8), 'double-edged: slows every countdown on the bearer, good or bad'));
        c.reach = 'stone';
      }
      if (e === 'falling_stars') { out.push(boon(fx.cycle(4, 8, 'star', round(c.mag('passive') * 1.4))), boon(fx.stat({ star: c.mag('stat') }))); c.reach = 'star'; }
      return out;
    },
  },
  {
    id: 'oath_object', label: 'the vow-bound thing', tiers: [2, 3], weight: 1,
    forms: { ring: 2, signet: 1, stole: 1, amulet: 1 }, reaches: {},
    spheres: { order: 3, light: 1, spirit: 1 },
    factions: { civic_guard: 3, holy_order_dawn: 3, builders_fellowship: 2, rangers_brotherhood: 2, mercenary_company: 1 },
    family: ['#relic', '#social'],
    looks: ['engraved on the inside with a short promise', 'plain, and heavier than it should be', 'with the mark of its order stamped deep'],
    prov: [
      { tone: 'reverent', uses: ['faction'], text: '{faction.The} give it to members who take the full oath. Breaking the oath means handing it back.' },
      { tone: 'practical', uses: ['faction', 'hero'], needsFactionHero: true, text: 'It belonged to {hero}, {hero.deed}. {hero.They} kept the oath to the end, which is more than most.' },
    ],
    names: { definite: ['Sworn', 'Plain', 'Kept'], xofy: ['the Oath', 'Plain Dealing'], role: ['Oathkeeper'] },
    grammar: { role: 3, definite: 2, xofy: 2, portmanteau: 2 },
    build(c) {
      const OATHS = {
        civic_guard: { boon: 'eye', forbid: 'shadow' }, holy_order_dawn: { boon: 'heart', forbid: 'gold' },
        builders_fellowship: { boon: 'stone', forbid: 'shadow' }, rangers_brotherhood: { boon: 'star', forbid: 'gold' },
        mercenary_company: { boon: 'iron', forbid: 'heart' },
      };
      const o = OATHS[c.factionId] ?? OATHS.civic_guard;
      c.reach = o.boon;
      return [
        boon(fx.passive(o.boon, round(c.mag('passive') * 1.2))),
        boon(fx.stat({ [o.boon]: c.mag('stat') })),
        boon(fx.social('same_faction', 0.1)),
        bane(fx.gate(o.forbid)),
      ];
    },
  },
  {
    id: 'war_banner', label: 'the standard that steadies the line', tiers: [2, 3, 4], weight: 0.9,
    forms: { banner: 3, horn: 2 }, reaches: { iron: 3, heart: 2 },
    spheres: { force: 2, order: 2, light: 1, energy: 1 },
    factions: { civic_guard: 2, mercenary_company: 3, holy_order_dawn: 1 },
    heroes: { hesta_ryle: 3, bram_oskell: 1 }, events: { greywater_stand: 3, kel_siege: 2 },
    family: ['#combat'],
    looks: ['torn along one edge and never mended', 'its colours faded to brown and grey'],
    looksByForm: { banner: ['torn along one edge and never mended', 'with a pole worn pale where hands gripped it', 'its colours faded to brown and grey'], horn: ['dented where it was used as a club', 'with a mouthpiece worn smooth', 'green with age along the bell'] },
    prov: [
      { tone: 'martial', uses: ['event'], text: 'It {form.at} {event}. The line held as long as it {form.held}.' },
      { tone: 'martial', uses: ['hero', 'event'], text: '{hero} {form.carried} it at {event}. {hero.They} {hero.fate}; {form.endure}.' },
    ],
    names: { definite: ['Torn', 'Last', 'Grey'], xofy: ['the Line'], role: ['Captain', 'Standard-bearer'] },
    grammar: { proper: 3, definite: 2, role: 2, portmanteau: 1 },
    build(c) {
      const out = [
        boon(fx.aura(c.tier === 4 ? 2 : 1, 'allies', c.reach, c.mag('aura'))),
        boon(fx.social('same_faction', 0.15)),
      ];
      if (c.tier >= 3) out.push(boon(fx.passive('heart', c.mag('passive', 1))));
      if (c.tier >= 3) out.push(bane(fx.drag('iron', c.mag('behavior', 2)), 'always drawn to the front line'));
      return out;
    },
  },
  {
    id: 'wanderer', label: 'road luck', tiers: [1, 2, 3], weight: 1,
    forms: { compass: 3, staff: 2, boots: 2 }, reaches: { star: 1 },
    spheres: { time: 2, energy: 1, light: 1, chaos: 1, life: 1 },
    factions: { rangers_brotherhood: 2, merchant_consortium: 2, adventuring_guild: 2 },
    heroes: { arn_veck: 3, maren_doss: 2 },
    family: ['#travel'],
    looks: ['scuffed from a great many roads'],
    looksByForm: { compass: ['with a needle that settles a little too fast', 'scuffed from a great many roads'], staff: ['worn to a point at the foot', 'notched once for every border crossed'], boots: ['patched at the heel with three different leathers', 'scuffed from a great many roads'] },
    prov: [
      { tone: 'practical', uses: ['hero'], text: 'It belonged to {hero}, {hero.deed}. {hero.They} {hero.fate}. It came back with someone else.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.Members} swap these at crossroads. Nobody remembers who made the first one.' },
    ],
    names: { definite: ['Long', 'Restless', 'Patient'], xofy: ['the Long Road', 'Far Places'], role: ['Walker', 'Pathfinder', 'Carter'] },
    grammar: { role: 3, person: 2, xofy: 2, portmanteau: 2 },
    build(c) {
      const out = [
        boon(fx.range({ movementCostMultiplier: MAG.movement[c.tier] })),
        boon(fx.cond('in_wilderness', 'star', c.mag('conditional'))),
      ];
      if (c.tier >= 2) out.push(boon(fx.reveal('hexes', MAG.reveal[c.tier] + 1)));
      if (c.tier >= 2 && c.draw('catch?', { yes: 2, no: 1 }) === 'yes') out.push(bane(fx.drag('star', c.mag('behavior'))));
      return out;
    },
  },
  {
    id: 'merchant', label: "the trader's edge", tiers: [1, 2, 3], weight: 1,
    forms: { scales: 3, ledger: 2, coin: 2, signet: 1 }, reaches: { gold: 1 },
    spheres: { matter: 2, order: 2, chaos: 1, light: 1 },
    factions: { merchant_consortium: 1 },
    heroes: { maren_doss: 3, ivo_tallow: 2 },
    family: ['#trade'],
    looks: ['polished bright by a great deal of counting'],
    looksByForm: { scales: ['with a lead weight that is not quite honest', 'polished bright by a great deal of counting'], coin: ["stamped with the Consortium's mark and a date", 'polished bright by a great deal of counting'], ledger: ['in three different hands, all of them careful', 'with the last few pages torn out'], signet: ["cut with the Consortium's mark", 'polished bright by a great deal of use'] },
    prov: [
      { tone: 'practical', uses: ['hero'], text: 'It belonged to {hero}, {hero.deed}. {hero.They} never once came out of a deal worse off.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.The} hand these to factors who have proven they can count.' },
    ],
    names: { definite: ['Weighed', 'Honest', 'Bright'], xofy: ['Fair Terms', 'the Long Account'], role: ['Factor', 'Clerk', 'Salt-trader'] },
    grammar: { role: 3, material: 2, definite: 2, person: 1 },
    build(c) {
      const out = [boon(fx.passive('gold', c.mag('passive'))), boon(fx.social('any', c.tier === 1 ? 0.05 : 0.1))];
      if (c.tier >= 2) out.push(boon(fx.stat({ gold: c.mag('stat', 1) })));
      if (c.tier === 3) out.push(boon(fx.rule('reward_tier_bonus', 1)));
      if (c.tier >= 2) out.push(bane(fx.drift(AXIS.gold.valuePair, -c.mag('drift'), -0.5)));
      return out;
    },
  },
  {
    id: 'thieves_kit', label: 'tools of a quiet trade', tiers: [1, 2], weight: 1,
    forms: { picks: 3, boots: 2, knife: 1 }, reaches: { shadow: 1 },
    spheres: { darkness: 3, chaos: 1 },
    factions: { thieves_guild: 1 }, heroes: { ivo_tallow: 1 },
    family: ['#stealth'],
    looks: ['wrapped in a roll of oiled cloth', 'blacked with soot so it will not shine', "worn to the shape of someone else's hand"],
    prov: [
      { tone: 'practical', uses: ['hero'], text: '{hero}, {hero.deed}, sold it on. It has been sold several times since.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.The} lend these to new members. Losing one costs a finger.' },
    ],
    names: { definite: ['Quiet', 'Soft'], role: ['Cutpurse', 'Burglar', 'Housebreaker'] },
    grammar: { role: 4, material: 2, person: 1, definite: 1 },
    build(c) {
      const out = [
        boon(fx.cond('alone', 'shadow', c.mag('conditional', 1))),
        boon(fx.passive('shadow', c.mag('passive'))),
      ];
      if (c.tier === 2) out.push(boon(fx.range({ movementCostMultiplier: MAG.movement[2] })));
      if (c.tier === 2 || c.draw('catch?', { yes: 1, no: 1 }) === 'yes') out.push(bane(fx.trig('encounter_critical_failure', { kind: 'condition_grant', conditionTraitId: 'reward_condition_watch_scrutiny', durationTicks: 36 }, { probability: 1, cooldownTicks: 24, narrativeTemplate: 'The Watch knows these tools, and now it knows {actor}.' })));
      return out;
    },
  },
  {
    id: 'mount', label: 'a beast worth its keep', tiers: [1, 2, 3], weight: 1,
    forms: { horse: 3, warhorse: 2, mule: 2, hound: 2, hawk: 1 }, reaches: {},
    spheres: { life: 3, force: 1, energy: 1, time: 1 },
    factions: { rangers_brotherhood: 2, civic_guard: 1, merchant_consortium: 1 },
    heroes: { arn_veck: 2, hesta_ryle: 1 }, places: { greywater_ford: 2, saltmere: 2, kel_barrow: 1 },
    family: ['#travel'],
    looks: ['with a white scar across the shoulder', 'patient with strangers and nobody else', 'going grey around the muzzle'],
    looksByForm: { hawk: ['with one torn flight-feather', 'that will only take meat from one hand'], hound: ['with one ear torn', 'that sleeps across the doorway'] },
    prov: [
      { tone: 'practical', uses: ['place'], text: 'It was bred at {place}. The breeders there still ask after it.' },
      { tone: 'martial', uses: ['hero'], text: "It was {hero}'s. It came home without {hero.them}, and would not let anyone near it for a month." },
    ],
    names: {},
    grammar: { given: 1 },
    build(c) {
      const f = c.formId; const out = [];
      if (f === 'horse') { c.reach = 'star'; out.push(boon(fx.range({ movementCostMultiplier: MAG.movement[c.tier] })), boon(fx.cond('in_wilderness', 'star', c.mag('conditional')))); }
      if (f === 'warhorse') { c.reach = 'heart'; out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))), boon(fx.range({ movementCostMultiplier: MAG.movement[Math.max(1, c.tier - 1)] }))); }
      if (f === 'mule') { c.reach = 'star'; out.push(boon(fx.slot('consumable', 2)), boon(fx.range({ movementCostMultiplier: 0.95 }))); }
      if (f === 'hound') { c.reach = 'eye'; out.push(boon(fx.range({ awarenessRangeBonus: 1 })), boon(fx.cond('alone', 'heart', c.mag('conditional')))); }
      if (f === 'hawk') { c.reach = 'eye'; out.push(boon(fx.reveal('encounters', MAG.reveal[c.tier] + 1)), boon(fx.cond('in_wilderness', 'eye', c.mag('conditional')))); }
      out.push(breakTrigger(c.tier, '{item_name} does not come back.'));
      c.lossCondition = 'breakable';
      return out;
    },
  },
  {
    id: 'provisions', label: 'good things to carry', tiers: [1, 2], weight: 0.9,
    forms: { salve: 2, rations: 2, wine: 2 }, reaches: {},
    spheres: { life: 3, spirit: 1, energy: 1 },
    factions: { holy_order_dawn: 1, rangers_brotherhood: 2, adventuring_guild: 1 },
    factionsByForm: { salve: { holy_order_dawn: 3, temple_of_spheres: 1 }, rations: { rangers_brotherhood: 3, adventuring_guild: 1 }, wine: { mercenary_company: 2, adventuring_guild: 2 } },
    heroesByForm: { salve: { sister_maud: 1 }, rations: { arn_veck: 1 }, wine: { tamsin_weir: 1 } },
    heroes: { sister_maud: 2, arn_veck: 1 },
    family: ['#consumable'],
    looks: ['sealed with wax and a thumbprint', 'wrapped in a clean cloth'],
    prov: [
      { tone: 'practical', uses: ['hero'], text: "It is made to {hero}'s recipe, which outlived {hero.them}." },
      { tone: 'practical', uses: ['faction'], text: '{faction.The} make these by the barrel and sell them at cost.' },
    ],
    names: {},
    namesByForm: { salve: ['Healer', 'Leech'], rations: ['Ranger', 'Drover'], wine: ['Sellsword', 'Drover'] },
    grammar: { person: 2, role: 2, material: 2 },
    build(c) {
      const f = c.formId; const out = [];
      if (f === 'salve') {
        c.reach = 'heart';
        out.push(boon(fx.trig('encounter_failure', { kind: 'condition_remove', conditionTraitId: 'trait.condition.wounded' }, { maxFires: 1, cooldownTicks: 0, narrativeTemplate: '{actor} dresses the wound with {item_name}.' })));
        out.push(bane(fx.trig('encounter_failure', { kind: 'self_remove' }, { maxFires: 1, cooldownTicks: 0 }), 'used up in the same moment'));
      }
      if (f === 'rations') { c.reach = 'star'; out.push(boon(fx.charge(c.tier === 2 ? 4 : 3, 'star', round(c.mag('passive') + 0.01)))); }
      if (f === 'wine') { c.reach = 'iron'; out.push(boon(fx.charge(2, 'iron', round(c.mag('passive') + 0.02)))); }
      c.lossCondition = 'consumable';
      return out;
    },
  },
  {
    id: 'honest_gear', label: 'plain gear, well made', tiers: [1, 2], weight: 1,
    forms: { sword: 2, axe: 1, spear: 2, mail: 1, helm: 1, coat: 1, bow: 1 }, reaches: {},
    spheres: { matter: 3, order: 2, force: 2 },
    factions: { civic_guard: 2, builders_fellowship: 1, mercenary_company: 2 },
    family: ['#combat', '#craft'],
    looks: ["with a maker's mark punched near the grip", 'mended once, very neatly', 'plain, and oiled, and ready'],
    looksByForm: { mail: ['mended once, very neatly', 'with every ring riveted by hand'], helm: ['dented once and hammered out', 'with the lining replaced more than once'], coat: ['mended once, very neatly', 'stiff with oil against the rain'] },
    prov: [
      { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} made it to do one job well, and it has done a great deal of that.' },
      { tone: 'practical', uses: ['faction'], text: 'It was issued by {faction.the} to a {faction.role}, and never handed back.' },
    ],
    names: { role: ['Soldier', 'Quartermaster'] },
    grammar: { material: 4, role: 2 },
    build(c) {
      const k = FORMS[c.formId].kind; const out = [];
      const r = k === 'arms' ? 'iron' : 'stone';
      c.reach = r;
      out.push(boon(fx.passive(r, c.mag('passive'))), boon(fx.stat({ [r]: c.mag('stat') })));
      if (k !== 'arms') out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))));
      out.push(breakTrigger(c.tier, '{item_name} breaks.'));
      c.lossCondition = 'breakable';
      return out;
    },
  },
  {
    id: 'lucky_charm', label: 'a small luck', tiers: [1, 2], weight: 0.9,
    forms: { charm: 3, coin: 2, stone: 1 }, reaches: {},
    spheres: { chaos: 2, light: 1, life: 1, time: 1 },
    factions: { adventuring_guild: 2, thieves_guild: 1, mercenary_company: 1 },
    heroes: { tamsin_weir: 2, maren_doss: 1 },
    family: ['#trinket'],
    looks: ['on a string gone grey with sweat', 'with a hole worn through the middle'],
    looksByForm: { coin: ['bent, as if someone bit it', 'rubbed smooth on one side'], charm: ['on a string gone grey with sweat', 'with a hole worn through the middle'], stone: ['with a hole worn through the middle', 'that fits the palm exactly'] },
    prov: [
      { tone: 'practical', uses: ['hero'], text: '{hero} swore by it. {hero.They} {hero.fate}, so make of that what you will.' },
      { tone: 'practical', uses: ['place'], text: 'Everyone in {place} carries one. This one has more luck left in it than most.' },
    ],
    names: { role: ['Sailor', 'Gambler'] },
    definiteByForm: { coin: ['Bent', 'Crooked'], charm: ['Blue', 'Holed', 'Grey'], stone: ['Holed', 'Palm'] },
    grammar: { definite: 3, role: 2, portmanteau: 2 },
    build(c) {
      c.lossCondition = 'consumable'; c.reach = 'star';
      return [boon(fx.ward(MAG.ward[c.tier], true), 'spends itself: consumeOnPrevent')];
    },
  },
];
const TROPE = Object.fromEntries(TROPES.map(t => [t.id, t]));

// ═══════════════════════════════════════════════════════════════════════════
// 9. Free composition — the other end of the dial: no trope core
// ═══════════════════════════════════════════════════════════════════════════

const FREE_SPHERE_GRACE = {
  force: c => boon(fx.cond('in_combat', 'heart', c.mag('conditional', 1))),
  matter: c => boon(fx.stat({ stone: c.mag('stat', 1) })),
  energy: c => boon(fx.cycle(4, 8, c.reach, round(c.mag('passive') * 1.3))),
  life: () => boon(fx.rule('healing_multiplier', 1.3)),
  mind: () => boon(fx.rule('tier_advancement_cost_multiplier', 0.9)),
  spirit: () => boon(fx.immune(['#curse'])),
  time: () => bane(fx.rule('duration_decay_multiplier', 0.85)),
  entropy: c => boon(fx.cond('health_low', c.reach, c.mag('conditional', 1))),
  chaos: () => boon(fx.shaper('near_miss', 1, 3)),
  order: () => boon(fx.ward(0.03, false)),
  light: () => boon(fx.range({ awarenessRangeBonus: 1 })),
  darkness: c => boon(fx.cond('alone', 'shadow', c.mag('conditional', 1))),
};
const GENERIC_PROV = [
  { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} made it, and sold it on at {place}.' },
  { tone: 'practical', uses: ['faction'], text: 'It passed through the hands of {faction.the} before it reached its present owner.' },
  { tone: 'mystical', uses: ['event'], text: 'It has been odd ever since {event}.' },
  { tone: 'martial', uses: ['hero'], text: '{hero} owned it once — {hero.role} {hero.deed}.' },
];
function buildFree(c, R) {
  const r = c.reach; const out = [];
  const shape = R.draw('free.boon', { passive: 3, conditional: 3, shaper: 1, range: 1 });
  if (shape === 'passive') out.push(boon(fx.passive(r, c.mag('passive'))));
  if (shape === 'conditional') out.push(boon(fx.cond(R.draw('free.pred', { in_combat: r === 'heart' ? 4 : 0, in_wilderness: 2, alone: r === 'shadow' ? 3 : 1, health_low: 1, outnumbered: r === 'iron' ? 2 : 0.5, near_water: 0.5 }), r, c.mag('conditional'))));
  if (shape === 'shaper') out.push(boon(fx.shaper('near_miss', 1, MAG.shaperMargin[c.tier])));
  if (shape === 'range') out.push(boon(fx.range({ movementCostMultiplier: MAG.movement[c.tier] })));
  out.push(boon(fx.stat({ [r]: c.mag('stat') })));
  if (c.tier >= 2 && R.chance('free.catch?', 0.5)) {
    const cc = R.draw('free.catch', { tradeoff: 2, drag: 1, gate: 1 });
    const other = REACHES[(REACHES.indexOf(r) + 4) % 8];
    if (cc === 'tradeoff') out.push(bane(fx.passive(other, -c.mag('penalty'))));
    if (cc === 'drag') out.push(bane(fx.drag(r, c.mag('behavior'))));
    if (cc === 'gate') out.push(bane(fx.gate(other)));
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. Generation
// ═══════════════════════════════════════════════════════════════════════════

const addW = (acc, obj, k = 1) => { for (const [key, w] of Object.entries(obj ?? {})) acc[key] = (acc[key] ?? 0) + w * k; return acc; };
const nonEmpty = (o) => o && Object.keys(o).length > 0;
/** A trope's pool if it names one; otherwise the whole world, evenly. */
const pool = (tropePool, all) => (nonEmpty(tropePool) ? { ...tropePool } : Object.fromEntries(Object.keys(all).map(k => [k, 1])));

function makeCtx(R, tier) {
  const c = {
    tier,
    draw: (id, w) => R.draw(`build.${c.tropeId}.${id}`, w),
    mag(kind, stepDown = 0) {
      const t = Math.min(4, Math.max(1, tier - stepDown));
      const env = MAG[kind][t] ?? MAG[kind][Object.keys(MAG[kind])[0]];
      c._n = (c._n ?? 0) + 1;
      return Array.isArray(env) ? R.range(`mag.${kind}.${c._n}`, env, kind === 'drift' ? 4 : 2) : env;
    },
    curse(out) { out.push(bane(fx.thin(MAG.thinning[tier]))); c.stampCursed = true; },
  };
  return c;
}

const GRAMMAR_RARITY = {
  material:    { 1: 1.5, 2: 0.7, 3: 0.2, 4: 0.05 },
  role:        { 1: 1.2, 2: 1.0, 3: 0.5, 4: 0.2 },
  person:      { 1: 0.8, 2: 1.0, 3: 1.0, 4: 0.8 },
  xofy:        { 1: 0.5, 2: 1.0, 3: 1.2, 4: 1.3 },
  definite:    { 1: 0.6, 2: 1.0, 3: 1.3, 4: 1.5 },
  portmanteau: { 1: 0.5, 2: 1.0, 3: 1.3, 4: 1.3 },
  proper:      { 1: 0.5, 2: 1.0, 3: 1.2, 4: 1.4 },
  house:       { 1: 1, 2: 1, 3: 1, 4: 1 },
  given:       { 1: 1, 2: 1, 3: 1, 4: 1 },
};

function generateItem(seed, index, tier, used, mode = 'trope') {
  const R = new Roller(`${seed}:${index}:${mode}`);
  const c = makeCtx(R, tier);

  // 1. Trope — the authored core (none in free mode).
  let trope = null;
  if (mode === 'trope') {
    const w = {};
    for (const t of TROPES) {
      if (!t.tiers.includes(tier)) continue;
      const n = used.trope[t.id] ?? 0;
      if (n >= TROPE_MAX_PER_RUN) continue;
      w[t.id] = t.weight * Math.pow(TROPE_REPEAT_DECAY, n);
    }
    trope = TROPE[R.draw('trope', w)];
    used.trope[trope.id] = (used.trope[trope.id] ?? 0) + 1;
  }
  c.tropeId = trope?.id ?? 'free';

  // 2. World entities — every table drawn eagerly, so which ones the prose ends up
  //    naming never shifts another roll (the generateGroupName discipline, THR-1235 §4).
  //    Heroes decay with use across the run so one dead captain does not own the batch.
  const heroW = pool(trope?.heroes, HEROES);
  for (const h of Object.keys(heroW)) heroW[h] *= Math.pow(HERO_REPEAT_DECAY, used.hero[h] ?? 0);
  let hero = HEROES[R.draw('hero', heroW)];
  const eventW = pool(trope?.events, EVENTS);
  if (nonEmpty(trope?.heroes) && !nonEmpty(trope?.events)) eventW[hero.event] = (eventW[hero.event] ?? 0) + 3;
  let eventId = R.draw('event', eventW);
  let factionId = R.draw('faction', pool(trope?.factions, FACTIONS));
  const monster = MONSTERS[R.draw('monster', pool(trope?.monsters, MONSTERS))];
  const culture = CULTURES[R.draw('culture', pool(null, CULTURES))];
  const placeId = R.draw('place', nonEmpty(trope?.places) ? trope.places : addW(pool(null, PLACES), { [EVENTS[eventId].place]: 2, [culture.home]: 1 }));

  // 3. Form (variety decay across the run). Drawn before the provenance so that
  //    by-form pools apply: a salve's maker is a healer, a fire-wine's a sellsword.
  let formW = trope ? { ...trope.forms } : Object.fromEntries(Object.keys(FORMS).filter(f => !FORMS[f].brew && !FORMS[f].beast).map(f => [f, 1]));
  if (trope?.formsByEvent?.[eventId]) formW = { ...trope.formsByEvent[eventId] };
  if (trope?.trophy) formW = Object.fromEntries(Object.entries(formW).filter(([f]) => Object.values(MATERIALS).some(m => m.monster === monster.id && m.fitsForms.includes(f))));
  if (!nonEmpty(formW)) formW = { charm: 1 };
  for (const f of Object.keys(formW)) formW[f] *= Math.pow(FORM_REPEAT_DECAY, used.form[f] ?? 0);
  c.formId = R.draw('form', formW);
  used.form[c.formId] = (used.form[c.formId] ?? 0) + 1;
  const form = FORMS[c.formId];
  if (trope?.factionsByForm?.[c.formId]) factionId = R.draw('faction.byForm', trope.factionsByForm[c.formId]);
  if (trope?.heroesByForm?.[c.formId]) hero = HEROES[R.draw('hero.byForm', trope.heroesByForm[c.formId])];

  // 4. Provenance template (tone table), then coherence: a template that names a hero
  //    and a faction names the hero's own faction; one that names a hero and an event
  //    names the hero's own event.
  const templates = trope ? trope.prov : GENERIC_PROV;
  const tIdx = Number(R.draw('provenance', Object.fromEntries(templates.map((t, i) => [String(i), Math.pow(0.1, used.prov[t.text] ?? 0)]))));
  let prov = templates[tIdx];
  used.prov[prov.text] = (used.prov[prov.text] ?? 0) + 1;
  let provHero = hero;
  if (prov.needsFactionHero) {
    const fh = Object.values(HEROES).find(h => h.faction === factionId && h.dead && !h.oathbreaker);
    if (fh) provHero = fh; else prov = templates.find(t => !t.needsFactionHero) ?? prov;
  }
  if (prov.uses.includes('hero') && prov.uses.includes('faction') && FACTIONS[provHero.faction]) factionId = provHero.faction;
  if (prov.uses.includes('hero') && prov.uses.includes('event')) eventId = provHero.event;
  if (prov.uses.includes('hero')) used.hero[provHero.id] = (used.hero[provHero.id] ?? 0) + 1;
  const faction = FACTIONS[factionId];
  const event = EVENTS[eventId];
  const place = PLACES[placeId];
  Object.assign(c, { hero: provHero, event, eventId, faction, factionId, monster, culture, place });

  // 5. Sphere — the trope decides which spheres are possible; the world decides which of those.
  const eligible = nonEmpty(trope?.spheres) ? Object.keys(trope.spheres) : SPHERES;
  const sw = Object.fromEntries(eligible.map(s => [s, trope?.spheres?.[s] ?? 1]));
  const bump = (obj, k) => { for (const [s, w] of Object.entries(obj ?? {})) if (s in sw) sw[s] += w * k; };
  if (prov.uses.includes('event') || trope?.id === 'disaster_salvage') bump(event.spheres, trope?.id === 'disaster_salvage' ? 3 : 1);
  if (prov.uses.includes('faction')) bump(faction.spheres, 1);
  if (prov.uses.includes('culture')) bump(culture.spheres, 1);
  if (prov.uses.includes('hero')) bump(FACTIONS[provHero.faction].spheres, 0.5);
  if (trope?.trophy || prov.uses.includes('monster')) bump({ [monster.sphere]: trope?.trophy ? 8 : 2 }, 1);
  bump(place.spheres, 0.5);
  const sphere = R.draw('sphere', sw);
  c.sphere = sphere;

  // 6. Reach — the trope's reaches, leaned by the maker's reachWeights (FACTION_DEFINITIONS)
  //    and by what the thing is (worn things lean to Stone and Star, tools to Eye).
  let rw = nonEmpty(trope?.reaches) ? { ...trope.reaches } : Object.fromEntries(REACHES.map(r => [r, 0.5]));
  if (trope?.trophy) rw = addW({}, monster.reachWeights, 1);
  for (const r of Object.keys(rw)) rw[r] *= (1 + (faction.reachWeights?.[r] ?? 0)) * (KIND_REACH_BIAS[form.kind]?.[r] ?? 1);
  c.reach = R.draw('reach', rw);

  // 7. Material — fits the form, leans to the sphere and the place's terrain.
  const matW = {};
  for (const [mid, m] of Object.entries(MATERIALS)) {
    if (trope?.trophy) { if (m.monster === monster.id && m.fitsForms.includes(c.formId)) matW[mid] = 1; continue; }
    if (m.monster) continue;
    if (!m.fits.some(f => form.fits.includes(f))) continue;
    if (m.notFor?.includes(form.kind)) continue;
    let w = 1 + 2 * (m.spheres[sphere] ?? 0);
    if (m.terrains?.includes(place.terrain)) w += 2;
    w *= trope?.materials?.[mid] ?? 1;
    w *= form.prefer?.[mid] ?? 1;
    w *= m.scarce ?? 1;
    w += trope?.materialsByEvent?.[eventId]?.[mid] ?? 0;
    matW[mid] = w;
  }
  const materialId = R.draw('material', nonEmpty(matW) ? matW : { bronze: 1 });
  const material = { ...MATERIALS[materialId], id: materialId };

  // 8. Effects — the trope's signature (or a free composition).
  c.lossCondition = undefined;
  const parts = trope ? trope.build(c) : buildFree(c, R);
  if (!trope && tier >= 3) {
    const g = FREE_SPHERE_GRACE[sphere](c);
    if (!parts.some(p => p.effect.type === g.effect.type)) parts.push(g);
  }

  // 9. Loss condition — must be backed by the effect that enforces it.
  let lossCondition = c.lossCondition ?? (c.stampCursed ? 'cursed' : tier >= 3 ? 'permanent' : 'stealable');
  if (!trope && tier <= 2) { lossCondition = 'breakable'; parts.push(breakTrigger(tier, '{item_name} breaks.')); }

  // 10. Tags and artifact traits.
  const tags = new Set([...form.tags, `#${sphere}`, `#${c.reach}`, ...(trope?.family ?? ['#creation']), ...(material.tags ?? [])]);
  if (c.stampCursed) tags.add('#cursed');
  const traits = [];
  const storiedLevel = (trope?.storied || (trope && prov.uses.includes('hero') && form.kind === 'arms')) ? (tier >= 4 ? 3 : 2) : 0;
  if (storiedLevel) { traits.push({ id: V.ARTIFACT_TRAITS.STORIED, level: storiedLevel }); tags.add('#storied'); }
  if (c.stampCursed) traits.push({ id: V.ARTIFACT_TRAITS.CURSED, level: 1 });

  // 11. Names — every grammar rendered eagerly, then one chosen by trope x rarity weights.
  //     A name already used in this run is struck before the draw.
  const names = renderNames(c, trope, form, material, prov, R);
  const gw = trope?.grammar ?? { material: 3, definite: 2, portmanteau: 2, proper: 1, role: 1 };
  const valid = {};
  for (const [g, w] of Object.entries(gw)) if (names[g] && !used.names.has(names[g])) valid[g] = w * (GRAMMAR_RARITY[g]?.[tier] ?? 1);
  const grammar = R.draw('name.grammar', nonEmpty(valid) ? valid : { material: 1 });
  const name = names[grammar] ?? names.material;
  used.names.add(name);
  const alternates = [...new Set(Object.entries(names).filter(([g, n]) => g !== grammar && n && gw[g] && n !== name).map(([, n]) => n))].slice(0, 3);

  // 12. Prose.
  const look = renderLook(trope, form, material, sphere, R, eventId, used.looks);
  const provenance = renderTemplate(prov.text, c, form);

  const effects = parts.filter(p => !p.effect.type.startsWith('_')).map(p => p.effect);
  return {
    id: `gen_item_${seed}_${mode === 'trope' ? '' : 'free_'}${index}`,
    index, tier, rarity: RARITY[tier], mode,
    trope: trope ? { id: trope.id, label: trope.label } : null,
    kind: form.kind, kindName: V.POSSESSION_SUBCATEGORY_NAMES[form.kind], formId: c.formId, formNoun: form.noun,
    material: materialId, sphere, reach: c.reach,
    name, grammar, alternates,
    look, provenance, provTone: prov.tone, provUses: prov.uses,
    entities: { hero: provHero.name, event: event.name, faction: faction.name, monster: monster.name, culture: culture.name, place: place.name },
    parts, effects, tags: [...tags], traits, storiedLevel, cursedTrait: !!c.stampCursed, lossCondition, slotTag: form.slot,
    virtue: c.virtue ?? null,
    fired: R.fired,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. Names — the six grammars extracted from the hand catalog (THR-1235 §3):
//     Material+Form · Possessive (role / person) · X of the Y · Definite singular ·
//     Portmanteau · Proper-noun genitive. Plus two narrow ones: House (heirlooms)
//     and Given (beasts). A grammar is offered only if its words are backed by the
//     provenance: no "Hesta's Spear" unless the story names Hesta.
// ═══════════════════════════════════════════════════════════════════════════

function renderNames(c, trope, form, material, prov, R) {
  const n = trope?.names ?? {};
  const noun = form.names?.[0] ?? cap(form.noun);
  const poetic = form.names?.[1] ?? noun;
  const out = {};
  out.material = `${material.title} ${noun}`;
  const roleList = prov.uses.includes('faction') ? c.faction.nameRoles
    : trope?.namesByForm?.[c.formId] ?? (n.role?.length ? n.role : null);
  out.role = roleList ? `${R.pick('name.role', roleList)}'s ${noun}` : null;
  out.person = prov.uses.includes('hero') ? `${c.hero.first}'s ${noun}` : null;
  out.xofy = n.xofy?.length ? `${noun} of ${R.pick('name.xofy', n.xofy)}` : null;
  let adjList = trope?.definiteByEvent?.[c.eventId] ?? trope?.definiteByForm?.[c.formId] ?? (n.definite?.length ? n.definite : SPHERE_ADJ[c.sphere]);
  if (trope?.id === 'chose_bearer' && c.virtue) adjList = [c.virtue.adj];
  out.definite = `The ${R.pick('name.adj', adjList)} ${poetic}`;
  const root = R.pick('name.root', SPHERE_ROOTS[c.sphere]);
  const suffix = R.pick('name.suffix', form.suffix ?? [noun.toLowerCase()]);
  out.portmanteau = form.beast || root.toLowerCase() === suffix ? null : `${root}${suffix}`;
  const properOf = prov.uses.includes('hero') ? c.hero.name
    : prov.uses.includes('event') || trope?.id === 'disaster_salvage' ? PLACES[c.event.place].name
    : prov.uses.includes('monster') ? PLACES[c.monster.place].name
    : prov.uses.includes('place') ? c.place.name : null;
  out.proper = properOf ? `${noun} of ${properOf.replace(/^the /, 'the ')}` : null;
  out.house = prov.uses.includes('hero') ? `The ${c.hero.family} ${noun}` : null;
  if (form.beast) out.given = R.pick('name.beast', BEAST_NAMES.filter(b => !BEAST_NAME_COAT[b] || BEAST_NAME_COAT[b] === material.id));
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. Prose — look sentence + provenance sentence (GAME register: plain, concrete)
// ═══════════════════════════════════════════════════════════════════════════

const article = (w) => (/^[aeiou]/i.test(w) && !/^(one|uni|use)/i.test(w) ? 'An' : 'A');

function renderLook(trope, form, material, sphere, R, eventId, usedLooks) {
  const fresh = (xs) => xs.filter(d => !usedLooks.has(d) && !(material.avoidWords ?? []).some(w => d.includes(w)));
  const tropeLooks = fresh(trope?.looksByEvent?.[eventId] ?? trope?.looksByForm?.[Object.keys(FORMS).find(k => FORMS[k] === form)] ?? trope?.looks ?? []);
  const soft = form.fits.some(f => SOFT_FITS.has(f)) && material.fits.some(f => SOFT_FITS.has(f));
  const source = R.draw('look.source', {
    trope: tropeLooks.length ? 6 : 0,
    material: material.look && fresh([material.look]).length ? 3 : 0,
    sphere: form.beast || form.brew ? 0 : 1.5,
  }) ?? 'sphere';
  const detail = source === 'trope' ? R.pick('look.detail', tropeLooks)
    : source === 'material' ? material.look
    : SPHERE_LOOK[sphere][soft ? 'soft' : 'hard'];
  let phrase;
  if (/^(pair|set|pot|bundle|flask) of/.test(form.noun)) phrase = form.noun.replace(' of ', ` of ${material.word} `);
  else if (material.word.endsWith('horn') && form.noun.endsWith('horn')) phrase = `${form.noun} made from ${material.word}`;
  else phrase = `${material.word} ${form.noun}`;
  usedLooks.add(detail);
  const sep = /^(that|with)\b/.test(detail) ? ' ' : ', ';
  return `${article(phrase)} ${phrase}${sep}${detail}.`;
}

function renderTemplate(text, c, form) {
  const h = c.hero; const hp = P[h.pr];
  const map = {
    'hero': h.name, 'hero.first': h.first, 'hero.family': h.family, 'hero.deed': h.deed, 'hero.fate': h.fate, 'hero.role': h.role,
    'hero.they': hp.they, 'hero.They': cap(hp.they), 'hero.them': hp.them, 'hero.their': hp.their,
    'event': (text.includes('{event.place}') && c.event.name.includes(PLACES[c.event.place].name)) ? c.event.short : c.event.name, 'event.place': PLACES[c.event.place].name, 'event.what': c.event.what, 'event.lingers': c.event.lingers, 'event.salvage': c.event.salvage,
    'faction': c.faction.name, 'faction.the': c.faction.the, 'faction.The': cap(c.faction.the),
    'faction.Members': `${c.faction.bare} ${c.faction.roles[0]}s`, 'faction.role': c.faction.roles[1] ?? c.faction.roles[0],
    'culture': c.culture.name, 'culture.Adj': c.culture.adj, 'culture.adj': c.culture.adj,
    'craft': CRAFT_BY_KIND[form.kind],
    'monster': c.monster.name, 'monster.one': c.monster.one, 'monster.One': cap(c.monster.one), 'monster.place': PLACES[c.monster.place].name,
    'place': c.place.name, 'virtue.word': c.virtue?.word ?? 'worthy',
    'form.at': form.at ?? 'was at', 'form.held': form.held ?? 'stood', 'form.carried': form.carried ?? 'carried', 'form.endure': form.endure ?? 'it survived',
    'form.It': form.noun === 'lantern' ? 'It' : 'It', 'form.works': form.noun === 'lantern' ? 'lights itself' : form.noun === 'hand-bell' ? 'rings by itself' : 'fogs over by itself',
    'form.Holds': form.noun === 'reliquary' ? 'It holds a finger-bone of' : form.noun === 'stole' ? 'It was worn by' : 'It was rung by',
  };
  let s = text.replace(/\{([a-zA-Z.]+)\}/g, (m, k) => (k in map ? map[k] : m));
  if (form.plural) s = s.replace(/\bIt\b/g, 'They').replace(/\bit\b/g, 'them').replace(/\bThey is\b/g, 'They are').replace(/\bThey has\b/g, 'They have').replace(/\bThey was\b/g, 'They were');
  return cap(s).replace(/\ba ([aeiou])/g, 'an $1');
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. Plain-words renderer for effects (no numerals: Law IV / prose canon)
// ═══════════════════════════════════════════════════════════════════════════

const rollWord = (v) => { const a = Math.abs(v); return a <= 0.03 ? 'a little' : a <= 0.06 ? 'noticeably' : a <= 0.10 ? 'much' : 'far'; };
const statWord = (v) => { const a = Math.abs(v); return a <= 0.3 ? 'a touch' : a <= 0.6 ? 'somewhat' : a <= 1.0 ? 'a good deal' : 'far'; };
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const days = (ticks) => { const d = ticks / TICKS_PER_DAY; if (d <= 0.5) return 'half a day'; if (d <= 1) return 'a day'; return `${NUM[Math.round(d)] ?? 'several'} days`; };
const chanceWords = (p) => (p >= 1 ? 'every time' : p >= 0.5 ? 'half the time' : p >= 0.4 ? 'often' : p >= 0.3 ? 'about one time in three' : p >= 0.25 ? 'about one time in four' : p >= 0.2 ? 'about one time in five' : 'now and then');
const PRED = {
  in_combat: 'in a fight', in_social: 'face to face with people', in_mystical: 'when dealing with magic or the unseen',
  in_wilderness: 'out in the wilds', alone: 'when working alone', outnumbered: 'when outnumbered', near_water: 'near water',
  at_home_territory: 'on home ground', health_low: 'when badly worn down',
};
const reachDo = (r) => `${REACH_DO[r]} (${REACH_NAME[r]})`;
const listWords = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);

function describe(item) {
  const does = []; const catches = []; const fight = [];
  // Passives first, so a same-reach stat or conditional folds into their sentence.
  const E = [...item.parts].sort((a, b) => (b.effect.type === 'passive' && b.effect.value > 0) - (a.effect.type === 'passive' && a.effect.value > 0));
  const usedIdx = new Set();
  const push = (role, s) => { if (s) (role === 'catch' ? catches : does).push(s); };
  for (let i = 0; i < E.length; i++) {
    if (usedIdx.has(i)) continue;
    const { effect: e, role } = E[i];
    if (e.type === 'passive' && e.value > 0) {
      // Merge: passive + stat on the same reach, and a positive conditional on the same reach.
      let s = `Its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}`;
      const j = E.findIndex((p, k) => !usedIdx.has(k) && k !== i && p.effect.type === 'stat_contribution' && (p.effect.contributions[e.reach] ?? 0) > 0);
      if (j >= 0) { usedIdx.add(j); const v = E[j].effect.contributions[e.reach]; s += `, and ${statWord(v)} more skilled at it for as long as they carry it${v > 1.0 ? ' — a lift big enough to show on their sheet' : ''}`; }
      const k2 = E.findIndex((p, k) => !usedIdx.has(k) && k !== i && p.effect.type === 'conditional' && p.effect.value > 0 && p.effect.reach === e.reach && PRED[p.effect.condition]);
      if (k2 >= 0) { usedIdx.add(k2); const ce = E[k2].effect; s += ce.condition === 'in_combat' && e.reach === 'iron' ? `. Once a fight starts, ${rollWord(ce.value)} better again` : `. ${cap(PRED[ce.condition])}, ${rollWord(ce.value)} better again`; }
      push(role, `${s}.`); usedIdx.add(i); continue;
    }
    push(role, sentence(e));
    usedIdx.add(i);
  }
  // Artifact traits the fight block will read (FB7, planned) — told plainly, flagged.
  if (item.storiedLevel >= 2) fight.push(`It ${V.ARTIFACT_TRAITS.LEVEL_WORDS[V.ARTIFACT_TRAITS.STORIED][item.storiedLevel - 1]}: whoever carries it stands a little steadier when a fight begins.`);
  if (item.cursedTrait) fight.push('The curse in it costs its bearer a little at every exchange of blows.');
  return { does, catches, fight };
}

function sentence(e) {
  switch (e.type) {
    case '_note': return e.text;
    case 'passive': return e.value > 0 ? `Its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}.` : `Its bearer is ${rollWord(e.value)} worse at ${reachDo(e.reach)}.`;
    case 'stat_contribution': {
      const parts = Object.entries(e.contributions).map(([r, v]) => (v > 0 ? `${statWord(v)} more skilled at ${reachDo(r)}` : `${statWord(v)} less skilled at ${reachDo(r)}`));
      const big = Object.values(e.contributions).some(v => Math.abs(v) > 1.0);
      return `Carrying it makes its bearer ${parts.join(' and ')}${big ? ' — a lift big enough to show on their sheet' : ''}.`;
    }
    case 'conditional': {
      if (e.condition.startsWith('has_trait:')) return `In the hands of someone ${CORE[e.condition.split(':')[1]] ?? 'worthy'}, it is ${rollWord(e.value)} better at ${reachDo(e.reach)} still.`;
      if (e.condition.startsWith('lacks_trait:')) return `Anyone who is not ${CORE[e.condition.split(':')[1]] ?? 'worthy'} finds it fights them: they are ${rollWord(e.value)} worse at ${reachDo(e.reach)} with it than with a plain blade.`;
      const when = PRED[e.condition] ?? e.condition;
      if (e.condition === 'in_combat' && e.reach === 'iron') return `Once a fight starts, its bearer's odds are ${rollWord(e.value)} better.`;
      if (e.condition === 'in_combat' && e.reach === 'heart') return `Once a fight starts, its bearer's nerve holds ${rollWord(e.value)} better.`;
      if (e.condition === 'in_combat') return `Once a fight starts, its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}.`;
      return e.value > 0 ? `${cap(when)}, its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}.` : `${cap(when)}, its bearer is ${rollWord(e.value)} worse at ${reachDo(e.reach)}.`;
    }
    case 'test_shaper': return 'When its bearer only just misses, it turns the miss into a scraped success.';
    case 'prevent_loss': return e.consumeOnPrevent
      ? 'The next time a bad outcome would wear its bearer thin, it takes the loss instead — and is gone.'
      : 'It takes the edge off every loss that would wear its bearer thin.';
    case 'tag_immunity': {
      const names = e.tags.flatMap(t => blockedBy(t).filter(cnd => cnd.tags.includes('#negative')).map(cnd => cnd.name.replace(/^The /, 'the ')));
      if (names.length === 0) return '(Blocks nothing that exists yet.)';
      if (names.length <= 4) return `${cap(listWords(names).replace(/ or ([^,]+)$/, ' and $1'))} cannot take hold of its bearer.`;
      const kind = e.tags[0] === '#curse' ? 'curses' : e.tags[0] === '#disease' ? 'sicknesses' : 'afflictions';
      return `${cap(names.slice(0, 3).join(', '))} and ${NUM[names.length - 3] ?? 'several'} other ${kind} cannot take hold of its bearer.`;
    }
    case 'reveal': return e.target === 'encounters'
      ? `Its bearer always notices what is happening up to ${NUM[e.range]} ${e.range === 1 ? 'hex' : 'hexes'} away, even when tired or in fog.`
      : `Whenever its bearer arrives somewhere new, every place within ${NUM[e.range]} ${e.range === 1 ? 'hex' : 'hexes'} becomes known to them.`;
    case 'range_modifier': {
      const bits = [];
      if (e.movementCostMultiplier) bits.push(e.movementCostMultiplier <= 0.8 ? 'Its bearer covers ground much faster.' : e.movementCostMultiplier < 0.95 ? 'Its bearer covers ground faster.' : 'Its bearer covers ground a little faster.');
      if (e.awarenessRangeBonus) bits.push(`Its bearer notices things ${NUM[e.awarenessRangeBonus]} hex further off than they otherwise would.`);
      return bits.join(' ');
    }
    case 'modify_rules': {
      const v = e.value;
      switch (e.rule) {
        case 'death_prevented': return 'Its bearer cannot die.';
        case 'healing_multiplier': return `Every condition on its bearer runs its course ${v >= 1.75 ? 'much ' : ''}faster: wounds, sickness and curses — but blessings too.`;
        case 'tier_advancement_cost_multiplier': return `Its bearer learns ${v <= 0.7 ? 'much ' : ''}faster: every step up in skill comes cheaper.`;
        case 'faction_influence_multiplier': return `Its bearer's standing with their faction grows ${v >= 1.4 ? 'much ' : ''}faster.`;
        case 'reward_tier_bonus': return 'Its bearer tends to come away with better finds.';
        case 'duration_decay_multiplier': return 'Time runs slow around its bearer: every condition on them, good or bad, lasts longer.';
        case 'movement_cost_multiplier': return 'Its bearer covers ground faster.';
        case 'cooldown_multiplier': return "Its bearer's powers come back sooner.";
        default: return `(rule ${e.rule})`;
      }
    }
    case 'aura': return `${e.target === 'allies' ? 'Allies' : e.target === 'enemies' ? 'Enemies' : 'Everyone'} within ${NUM[e.radius]} ${e.radius === 1 ? 'hex' : 'hexes'} of its bearer are ${rollWord(e.value)} ${e.value > 0 ? 'better' : 'worse'} at ${reachDo(e.reach)}.`;
    case 'behavior_weight': return e.reach === 'iron' ? 'Its bearer goes looking for fights.' : e.reach === 'star' ? 'The road keeps calling: its bearer is always half ready to leave.' : `Its bearer is drawn towards ${REACH_DO[e.reach]}.`;
    case 'social_modifier': {
      const who = { same_faction: 'Their own faction', different_faction: 'People of other factions', any: 'People', ally: 'Allies', enemy: 'Enemies' }[e.targetFilter];
      return `${who} ${e.cooperationBias > 0 ? 'deal with its bearer more readily' : 'trust its bearer less'}.`;
    }
    case 'action_gate': return `While it is carried, its bearer will not ${REACH_BLOCK[e.reach]}.`;
    case 'axiological_drift': { const ax = V.AXES.find(a => a.valuePair === e.axis); return `Over time, its bearer grows ${e.ratePerTick < 0 ? ax.vice.word : ax.virtue.word}.`; }
    case 'resource_manipulate': return e.amount < 0 ? 'It feeds on its bearer. They slowly wear thin, and someone worn all the way through is gone from the story all the same.' : 'Its bearer recovers themselves faster.';
    case 'hex_effect': return e.property === 'corruption' ? 'The land sours wherever its bearer stays.' : e.property === 'divineInfluence' ? 'Ground where its bearer stays a while grows holy.' : 'Explorers are drawn to wherever its bearer stays.';
    case 'action_trigger': return triggerSentence(e);
    case 'consumable_charge': return `Good for ${NUM[e.charges]} hard stretches of ${REACH_DO[e.onUse.reach]} (${REACH_NAME[e.onUse.reach]}), ${rollWord(e.onUse.value)} better each time; then it is used up.`;
    case 'slot_bonus': return `It carries ${NUM[e.bonus]} more loads of supplies for its bearer.`;
    case 'suppress': return `Every charm and enchanted thing within ${NUM[e.scope.hexes]} ${e.scope.hexes === 1 ? 'hex' : 'hexes'} of its bearer goes quiet — friend's or foe's.`;
    case 'cooldown': return `For a third of every day it runs hot: its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)} while it lasts.`;
    case 'stacking': return e.stackOn === 'on_damaged' ? 'Every wound its bearer takes makes them fight a little harder, for a while.' : 'Every win makes its bearer a little better at the next, for a while.';
    default: return `(${e.type})`;
  }
}

function triggerSentence(e) {
  const when = {
    encounter_success: 'Each time it helps its bearer succeed', encounter_failure: 'When its bearer fails',
    encounter_critical_failure: 'If things go very badly', encounter_critical_success: 'On a great success',
    movement_complete: 'Whenever its bearer arrives somewhere', action_complete: 'After each task',
  }[e.on] ?? e.on;
  const p = e.payload;
  const sometimes = e.probability != null && e.probability < 1;
  if (p.kind === 'resource_delta') return `${when}, it takes a little of them in payment: some of their sense of self, gone for good.`;
  if (p.kind === 'condition_grant') {
    const cname = CONDITION_NAME[p.conditionTraitId];
    const what = cname === 'Nightmares' ? 'with Nightmares' : cname === 'Watch Scrutiny' ? 'under Watch Scrutiny — the Watch starts watching them' : cname;
    return sometimes ? `${when}, ${chanceWords(e.probability)} they come away ${what} for ${days(p.durationTicks ?? 24)}.` : `${when}, they come away ${what} for ${days(p.durationTicks ?? 24)}.`;
  }
  if (p.kind === 'condition_remove') return `${when}, its bearer dresses their wounds with it: Wounded is lifted, and the pot is empty.`;
  if (p.kind === 'self_remove') {
    if (e.maxFires === 1) return '';
    const lost = /does not come back/.test(e.narrativeTemplate ?? '') ? 'the animal does not come back' : 'it breaks';
    return `${when} (${chanceWords(e.probability ?? 1)}), ${lost}.`;
  }
  return `${when}: ${p.kind}.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. Validation — against the real caps, tag vocabulary and condition catalog
// ═══════════════════════════════════════════════════════════════════════════

const SEATED = new Map(V.CONTENT_TAGS.map(t => [t.tag, t]));
const CONDITION_IDS = new Set(ALL_CONDITIONS.map(c => c.id));
const CATALOG_NAMES = new Set(V.CATALOG_ITEM_NAMES.map(x => x.name.toLowerCase()));

function validate(item) {
  const problems = [];
  const eff = item.effects;
  if (eff.length > CAPS.MAX_EFFECTS_PER_ATTACHMENT) problems.push(`too many effects (${eff.length})`);
  if (eff.filter(e => e.type === 'action_trigger').length > CAPS.ACTION_TRIGGER_MAX_PER_ATTACHMENT) problems.push('too many action_triggers');
  const perReach = {};
  for (const e of eff) {
    if (e.type === 'passive' || e.type === 'conditional') {
      if (Math.abs(e.value) > CAPS.EFFECT_PER_ITEM_CAP) problems.push(`${e.type} ${e.value} over the per-effect cap`);
      if (e.value > 0) perReach[e.reach] = (perReach[e.reach] ?? 0) + e.value;
    }
    if (e.type === 'stat_contribution') for (const [r, v] of Object.entries(e.contributions)) {
      const band = item.tier === 4 ? BANDS.LEGENDARY : item.tier >= 2 ? BANDS.NOTABLE : BANDS.MINOR;
      if (Math.abs(v) > band) problems.push(`stat ${r} ${v} over band ${band}`);
    }
    if (e.type === 'modify_rules' && !LIVE_RULE_KEYS.has(e.rule)) problems.push(`rule ${e.rule} has no live reader`);
    if (e.type === 'conditional') {
      const own = { in_combat: ['iron'], in_social: ['heart', 'gold'], in_mystical: ['veil', 'star'], in_exploration: ['eye', 'stone'] }[e.condition];
      if (own?.includes(e.reach)) problems.push(`conditional ${e.condition} on ${e.reach} is a passive in disguise`);
      else if (own && !(e.condition === 'in_combat' && e.reach === 'heart')) problems.push(`conditional ${e.condition} on ${e.reach} almost never fires`);
    }
    if (e.type === 'action_trigger') {
      if (!LIVE_TRIGGER_EVENTS.has(e.on)) problems.push(`trigger event ${e.on} is never raised`);
      if (e.payload.conditionTraitId && !CONDITION_IDS.has(e.payload.conditionTraitId)) problems.push(`condition ${e.payload.conditionTraitId} does not exist`);
    }
    if (e.type === 'tag_immunity') for (const t of e.tags) if (blockedBy(t).length === 0) problems.push(`immunity ${t} blocks no real condition`);
    if (e.type === 'hex_effect' && !['divineInfluence', 'corruption', 'explorationAttraction'].includes(e.property)) problems.push(`hex property ${e.property} not writable`);
    if (!SHAPE_STATUS[e.type]) problems.push(`shape ${e.type} not in the honest vocabulary`);
    else if (SHAPE_STATUS[e.type][0] === 'planned') problems.push(`shape ${e.type} is planned, not live`);
  }
  for (const [r, v] of Object.entries(perReach)) if (v > CAPS.EFFECT_MODIFIER_CAP) problems.push(`${r} roll total ${round(v)} over cap ${CAPS.EFFECT_MODIFIER_CAP}`);
  for (const t of item.tags) {
    const def = SEATED.get(t);
    if (!def) problems.push(`tag ${t} not in the closed vocabulary`);
    else if (def.kinds && !def.kinds.includes('item_template') && !def.kinds.includes('legendary_template')) problems.push(`tag ${t} not allowed on items`);
  }
  if (!item.tags.some(t => SEATED.get(t)?.axis === 'family')) problems.push('no family tag (item_template requires one)');
  if (item.lossCondition === 'breakable' && !eff.some(e => e.type === 'action_trigger' && e.payload.kind === 'self_remove')) problems.push('breakable with nothing that breaks it');
  if (item.lossCondition === 'consumable' && !eff.some(e => e.type === 'consumable_charge' || (e.type === 'action_trigger' && e.payload.kind === 'self_remove') || (e.type === 'prevent_loss' && e.consumeOnPrevent))) problems.push('consumable with nothing that consumes it');
  if (item.lossCondition === 'cursed' && !item.parts.some(p => p.role === 'catch')) problems.push('cursed with no real downside');
  if (CATALOG_NAMES.has(item.name.toLowerCase())) problems.push(`name collides with catalog item "${item.name}"`);
  return problems;
}

// ═══════════════════════════════════════════════════════════════════════════
// 15. Classification (coverage) and the node a live generator would mint
// ═══════════════════════════════════════════════════════════════════════════

function classify(item) {
  const t = new Set();
  for (const e of item.effects) {
    if (e.type === 'conditional' && e.condition === 'in_combat') t.add('fight');
    if (e.type === 'conditional' && e.condition === 'outnumbered' && e.reach === 'iron') t.add('fight');
    if (e.type === 'passive' && e.reach === 'iron' && e.value > 0) t.add('fight');
    if (e.type === 'stat_contribution' && (e.contributions.iron ?? 0) > 0) t.add('fight');
    if (e.type === 'aura' && ['iron', 'heart'].includes(e.reach)) t.add('fight');
    if (e.type === 'modify_rules' && e.rule === 'death_prevented') t.add('fight');
    if (e.type === 'stacking' && e.stackOn === 'on_damaged') t.add('fight');
    if (e.type === 'suppress') t.add('fight');
    if (e.type === 'action_trigger' && e.payload.kind === 'condition_remove') t.add('fight');
    if (e.type === 'consumable_charge' && e.onUse.reach === 'iron') t.add('fight');
    if (e.type === 'range_modifier' || e.type === 'reveal' || e.type === 'hex_effect' || (e.type === 'behavior_weight' && e.reach === 'star') || e.type === 'slot_bonus') t.add('world');
    if (e.type === 'social_modifier' || e.type === 'action_gate' || (e.type === 'modify_rules' && ['faction_influence_multiplier', 'reward_tier_bonus'].includes(e.rule)) || (e.type === 'conditional' && ['in_social', 'at_home_territory'].includes(e.condition))) t.add('social');
  }
  if (item.storiedLevel >= 2 && item.kind === 'arms') t.add('fight');
  return [...t];
}

function mechanicalSummary(item) {
  return item.effects.map(e => {
    switch (e.type) {
      case 'passive': return `${e.value > 0 ? '+' : ''}${e.value} ${REACH_NAME[e.reach]} roll`;
      case 'conditional': return `${e.value > 0 ? '+' : ''}${e.value} ${REACH_NAME[e.reach]} ${e.condition}`;
      case 'stat_contribution': return Object.entries(e.contributions).map(([r, v]) => `${REACH_NAME[r]} capability ${v > 0 ? '+' : ''}${v}`).join(' / ');
      default: return e.type;
    }
  }).join(' · ');
}

/** The node shape a live generator would pass to graph.addNode (THR-1234's minimum viable output). */
function toNode(item) {
  return {
    id: item.id, type: item.tier === 4 ? 'artifact_legendary' : 'artifact', name: item.name,
    properties: {
      attachmentCategory: 'possession', subcategory: item.kind, slotTag: item.slotTag, tier: item.tier,
      tags: item.tags, mechanicalSummary: mechanicalSummary(item), lossCondition: item.lossCondition,
      flavorText: item.look, source: item.provenance, sphereAffinity: item.sphere, effects: item.effects,
      censusTag: { scale: item.tier === 4 ? 'regional' : 'local' },
    },
    generatedTraits: item.traits,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 16. Under-the-hood line
// ═══════════════════════════════════════════════════════════════════════════

function fmtEffect(e) {
  const sgn = (v) => `${v > 0 ? '+' : ''}${v}`;
  switch (e.type) {
    case 'action_trigger': { const p = e.payload; return `action_trigger(on ${e.on} → ${p.kind}${p.conditionTraitId ? ' ' + p.conditionTraitId : ''}${p.amount != null ? ' ' + p.resource + ' ' + p.amount : ''}${p.durationTicks ? ', ' + p.durationTicks + ' ticks' : ''}${e.probability != null && e.probability < 1 ? `, p ${e.probability}` : ''}${e.maxFires ? `, max ${e.maxFires}` : ''})`; }
    case 'stat_contribution': return `stat_contribution(${Object.entries(e.contributions).map(([r, v]) => `${r} ${sgn(v)}`).join(', ')})`;
    case 'modify_rules': return `modify_rules(${e.rule} = ${e.value})`;
    case 'passive': return `passive(${e.reach} ${sgn(e.value)})`;
    case 'conditional': return `conditional(${e.condition}: ${e.reach} ${sgn(e.value)})`;
    case 'suppress': return `suppress(all_effects, radius ${e.scope.hexes})`;
    case 'range_modifier': return `range_modifier(${e.movementCostMultiplier ? 'move ×' + e.movementCostMultiplier : ''}${e.awarenessRangeBonus ? 'awareness +' + e.awarenessRangeBonus : ''})`;
    case 'test_shaper': return `test_shaper(${e.trigger} +${e.steps} step, margin ≤ ${e.maxMargin})`;
    case 'prevent_loss': return `prevent_loss(quintessence ${e.amount}${e.consumeOnPrevent ? ', consumed' : ''})`;
    case 'tag_immunity': return `tag_immunity(${e.tags.join(', ')} → blocks ${e.tags.flatMap(t => blockedBy(t)).length} real conditions)`;
    case 'reveal': return `reveal(${e.target}, ${e.range})`;
    case 'aura': return `aura(${e.target}, radius ${e.radius}, ${e.reach} ${sgn(e.value)})`;
    case 'behavior_weight': return `behavior_weight(${e.reach} ×${e.multiplier})`;
    case 'social_modifier': return `social_modifier(${e.targetFilter} ${sgn(e.cooperationBias)})`;
    case 'action_gate': return `action_gate(block ${e.reach})`;
    case 'axiological_drift': return `axiological_drift(${e.axis} ${e.ratePerTick}/tick → ${e.limitValue})`;
    case 'resource_manipulate': return `resource_manipulate(quintessence ${e.amount}/tick; regen is +${REGEN})`;
    case 'hex_effect': return `hex_effect(${e.property} +${e.value}/tick)`;
    case 'consumable_charge': return `consumable_charge(${e.charges} × ${e.onUse.reach} +${e.onUse.value})`;
    case 'slot_bonus': return `slot_bonus(${e.slotTag} +${e.bonus})`;
    case 'cooldown': return `cooldown(${e.reach} ${sgn(e.value)}, on ${e.activeTicks} / off ${e.cooldownTicks} ticks)`;
    case 'stacking': return `stacking(${e.stackOn}: ${e.reach} +${e.valuePerStack} × ${e.maxStacks})`;
    default: return e.type;
  }
}

function underTheHood(item, readback) {
  const traits = item.traits.map(t => `${t.id}${t.id.endsWith('storied') ? ` level ${t.level}` : ''}`).join(', ');
  const narrow = [...new Set(item.effects.filter(e => SHAPE_STATUS[e.type]?.[0] === 'narrow').map(e => e.type))];
  const rb = readback?.[item.id];
  const rbText = rb ? (rb.ok ? `engine read-back: clean (${rb.checks} checks)` : `engine read-back FAILED: ${rb.failures.join('; ')}`) : 'engine read-back not run';
  return [
    `Under the hood — primitives: ${item.effects.map(fmtEffect).join(' · ')}`,
    `tables: ${item.trope ? 'trope ' + item.trope.id : 'no trope (free composition)'} · form ${item.formId} · material ${item.material} · sphere ${item.sphere} · reach ${item.reach} · provenance ${item.provTone}${item.provUses.length ? ' (' + item.provUses.join(' + ') + ')' : ''} · name grammar ${item.grammar}${item.alternates.length ? ` (also rolled: ${item.alternates.join(' / ')})` : ''}`,
    `node: tier ${item.tier} · ${item.kind} · slot ${item.slotTag} · loss ${item.lossCondition} · tags ${item.tags.join(' ')}${traits ? ` · traits ${traits}` : ''}${item.storiedLevel || item.cursedTrait ? ' · planned: the fight read of these traits arrives with fight block FB7' : ''}${narrow.length ? ` · narrow: ${narrow.join(', ')} (${narrow.map(t => SHAPE_STATUS[t][1]).join('; ')})` : ''} · ${rbText}`,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// 17. Runs
// ═══════════════════════════════════════════════════════════════════════════

function runSet(seed, quota, mode = 'trope') {
  const used = { trope: {}, form: {}, hero: {}, names: new Set(), looks: new Set(), prov: {} };
  const items = [];
  let index = 0;
  for (const tier of [1, 2, 3, 4]) for (let k = 0; k < (quota[tier] ?? 0); k++) {
    const it = generateItem(seed, index++, tier, used, mode);
    it.classes = classify(it);
    it.problems = validate(it);
    it.words = describe(it);
    items.push(it);
  }
  return items;
}

function coverage(items) {
  const has = (i, cls) => i.classes.includes(cls);
  return {
    fight: items.filter(i => has(i, 'fight')).length,
    fightBands: new Set(items.filter(i => has(i, 'fight')).map(i => i.tier)).size,
    worldSocial: items.filter(i => has(i, 'world') || has(i, 'social')).length,
    worldSocialBands: new Set(items.filter(i => has(i, 'world') || has(i, 'social')).map(i => i.tier)).size,
    tropes: new Set(items.map(i => i.trope?.id)).size,
    problems: items.reduce((s, i) => s + i.problems.length, 0),
  };
}

export {
  runSet, coverage, generateItem, describe, underTheHood, toNode, validate, classify, fmtEffect,
  TROPES, SHAPE_STATUS, MAG, blockedBy, HEROES, EVENTS, PLACES, CULTURES, MONSTERS, FACTIONS, RARITY, TIER_QUOTA,
  FORMS, MATERIALS, GRAMMAR_RARITY, V,
};

// ═══════════════════════════════════════════════════════════════════════════
// 18. CLI — write the JSON and the review document
// ═══════════════════════════════════════════════════════════════════════════

const MAIN_SEED = 42;
const SECOND_SEED = 7;
const SECOND_QUOTA = { 1: 1, 2: 2, 3: 1, 4: 1 };
const FREE_QUOTA = { 2: 1, 3: 1, 4: 1 };

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? Number(args[i + 1]) : d; };
  if (args.includes('--scan')) {
    for (let s = 1; s <= opt('scan', 30); s++) console.log(s, JSON.stringify(coverage(runSet(s, TIER_QUOTA))));
  } else if (args.includes('--print')) {
    const items = runSet(opt('seed', MAIN_SEED), TIER_QUOTA);
    console.log(JSON.stringify(coverage(items)));
    for (const it of items) {
      console.log(`\n#${it.index + 1} ${it.name} — ${it.rarity} ${it.formNoun} · ${it.sphere}/${it.reach} · ${it.trope?.id} [${it.classes.join(',')}]`);
      console.log(`  ${it.look} ${it.provenance}`);
      for (const d of it.words.does) console.log(`  + ${d}`);
      for (const d of it.words.catches) console.log(`  - ${d}`);
      for (const d of it.words.fight) console.log(`  ⚑ ${d}`);
      if (it.problems.length) console.log(`  !! ${it.problems.join('; ')}`);
    }
  } else {
    const main = runSet(MAIN_SEED, TIER_QUOTA);
    const second = runSet(SECOND_SEED, SECOND_QUOTA);
    const free = runSet(MAIN_SEED, FREE_QUOTA, 'free');
    const dump = (items) => items.map(it => ({ ...toNode(it), review: { rarity: it.rarity, trope: it.trope, classes: it.classes, problems: it.problems, fired: it.fired, words: it.words } }));
    writeFileSync(join(HERE, `items-seed${MAIN_SEED}.json`), JSON.stringify(dump(main), null, 2));
    writeFileSync(join(HERE, `items-seed${SECOND_SEED}.json`), JSON.stringify(dump(second), null, 2));
    writeFileSync(join(HERE, `items-free${MAIN_SEED}.json`), JSON.stringify(dump(free), null, 2));
    const readbackPath = join(HERE, 'engine-readback.json');
    const readback = existsSync(readbackPath) ? JSON.parse(readFileSync(readbackPath, 'utf8')) : null;
    const { writeDoc, LINKS } = await import(pathToFileURL(join(HERE, 'write-doc.mjs')).href);
    const notesPath = join(HERE, 'notes.mjs');
    const notes = existsSync(notesPath)
      ? (await import(pathToFileURL(notesPath).href)).makeNotes({ LINKS, main, second, free, SHAPE_STATUS, TROPES, MAG })
      : { dialIntro: '', howMade: () => '', dial: '', critique: '', findings: '', footer: '' };
    const md = writeDoc({ main, second, free, readback, seeds: { main: MAIN_SEED, second: SECOND_SEED }, cov: coverage(main), notes, underTheHood, TROPES });
    writeFileSync(join(HERE, 'thirty-items.md'), md);
    console.log('coverage', JSON.stringify(coverage(main)));
    console.log('problems', main.concat(second, free).filter(i => i.problems.length).map(i => `${i.name}: ${i.problems.join('; ')}`));
    console.log('wrote thirty-items.md', readback ? '(with engine read-back)' : '(no engine read-back yet)');
  }
}
