/**
 * The review world — the THR-1236 prototype's hand-made world, kept for the review path
 * and the gate test only (THR-1570).
 *
 * A live world supplies its own maker, factions, places and cultures through
 * `buildItemWorldContext`. What a young live world does *not* have yet is a past: dead
 * notables with deeds, disasters with names, monster hosts with haunts. The `found`
 * origin's cores are written around exactly that past, and they have no live minting
 * point until reward draws carry generated items (THR-1626). So the review path —
 * `generate items --review-world`, `previewGeneratedItem`, and the gate test that must
 * see every core fire — dresses items from this fixture instead.
 *
 * **Never read by a live world's mint.** `mintMasterwork` builds its context from the
 * graph; this module is imported only by the review levers and the tests.
 */

import { getFactionDefinition, getFactionDefinitionRoster } from '../../data/faction-definition-lookup';
import { ITEM_GEN_FACTION_WORDS, ITEM_GEN_FACTION_WORDS_FALLBACK } from '../../data/item-generator-tables';
import type {
  ItemGenCulture, ItemGenEvent, ItemGenFaction, ItemGenHero, ItemGenMaker, ItemGenMonster, ItemGenPlace, ItemWorldContext,
} from './types';

/** Build the generator's view of a faction from its definition — shared with the live context. */
export function itemGenFactionFromDefinition(id: string, defId: string | null, name: string | undefined): ItemGenFaction {
  // The one lookup (THR-1155): a run-founded faction or Realm resolves like an authored one.
  const def = getFactionDefinition(defId) ?? undefined;
  const full = name ?? def?.nameTemplate ?? 'the company';
  const bare = full.replace(/^the\s+/i, '');
  const words = (defId && ITEM_GEN_FACTION_WORDS[defId]) || ITEM_GEN_FACTION_WORDS_FALLBACK;
  return {
    id, defId, name: /^the\s/i.test(full) ? full : `The ${bare}`, bare,
    roles: words.roles, nameRoles: words.nameRoles, spheres: words.spheres,
    reachWeights: def?.reachWeights ?? {},
  };
}

const REVIEW_PLACES: Record<string, ItemGenPlace> = {
  low_harrow:     { id: 'low_harrow', name: 'Low Harrow', terrain: 'marsh', spheres: { time: 2, entropy: 1 } },
  kel_barrow:     { id: 'kel_barrow', name: 'Kel Barrow', terrain: 'hills', spheres: { spirit: 2, darkness: 1 } },
  greywater_ford: { id: 'greywater_ford', name: 'Greywater Ford', terrain: 'grassland', spheres: { force: 1, order: 1 } },
  the_ashfold:    { id: 'the_ashfold', name: 'the Ashfold', terrain: 'volcano', spheres: { energy: 2, chaos: 1 } },
  saltmere:       { id: 'saltmere', name: 'Saltmere', terrain: 'steppe', spheres: { matter: 2, order: 1 } },
  thornwood:      { id: 'thornwood', name: 'Thornwood', terrain: 'dense_forest', spheres: { life: 2, entropy: 1 } },
  vessas_rest:    { id: 'vessas_rest', name: "Vessa's Rest", terrain: 'mountains', spheres: { mind: 2, light: 1 } },
};

const REVIEW_CULTURES: Record<string, ItemGenCulture> = {
  harrowfolk: { id: 'harrowfolk', name: 'the Harrowfolk', adj: 'Harrowfolk', homePlaceId: 'low_harrow', spheres: { time: 2, darkness: 1 } },
  kel:        { id: 'kel', name: 'the Kel', adj: 'Kel', homePlaceId: 'kel_barrow', spheres: { spirit: 2, order: 1 } },
  ashborn:    { id: 'ashborn', name: 'the Ashborn', adj: 'Ashborn', homePlaceId: 'the_ashfold', spheres: { energy: 2, chaos: 1 } },
  vessani:    { id: 'vessani', name: 'the Vessani', adj: 'Vessani', homePlaceId: 'vessas_rest', spheres: { mind: 2, light: 1 } },
};

const REVIEW_EVENTS: Record<string, ItemGenEvent> = {
  drowning: { id: 'drowning', kind: 'flood', name: 'the Drowning of Low Harrow', short: 'the Drowning', placeId: 'low_harrow', spheres: { time: 2, entropy: 2 }, what: 'the sea came over the marsh in one night', lingers: 'It still smells of the sea.',
    salvage: 'It was pulled out of the mud at Low Harrow after the Drowning, the night the sea came over the marsh.' },
  kel_siege: { id: 'kel_siege', kind: 'siege', name: 'the Siege of Kel Barrow', short: 'the siege', placeId: 'kel_barrow', spheres: { spirit: 2, force: 2 }, what: 'the Free Company held the barrow hill against the Grey Wraith Host for a whole winter', lingers: 'It has been cold ever since.',
    salvage: 'It came down off the barrow hill after the Siege of Kel Barrow, when the Free Company held the hill against the Grey Wraith Host for a whole winter.' },
  greywater_stand: { id: 'greywater_stand', kind: 'last_stand', name: 'the Last Stand at Greywater Ford', short: 'the Last Stand', placeId: 'greywater_ford', spheres: { force: 2, order: 2 }, what: 'ten guards held the ford for a day and a night', lingers: 'There is still river mud in its seams.',
    salvage: 'It was dragged out of the river after the Last Stand at Greywater Ford, where ten guards held the ford for a day and a night.' },
  library_burning: { id: 'library_burning', kind: 'fire', name: 'the Burning of the Library', placeId: 'vessas_rest', spheres: { energy: 2, mind: 2 }, what: "the Arcane Circle's library at Vessa's Rest burned to the stones", lingers: 'It still smells of smoke.',
    salvage: "It was carried out of the Burning of the Library, the night the Arcane Circle's library at Vessa's Rest burned to the stones." },
  plague_year: { id: 'plague_year', kind: 'plague', name: 'the Plague Year', placeId: 'thornwood', spheres: { entropy: 3, life: 1 }, what: 'the Plague Shamble came out of Thornwood', lingers: 'Nobody likes to touch it.',
    salvage: 'It was taken out of Thornwood after the Plague Year.' },
  salt_riots: { id: 'salt_riots', kind: 'riot', name: 'the Salt Riots', placeId: 'saltmere', spheres: { chaos: 2, matter: 1 }, what: 'the salt-workers of Saltmere turned on the Consortium', lingers: 'There is still salt ground into it.',
    salvage: 'It was picked up in the street at Saltmere after the Salt Riots.' },
  long_winter: { id: 'long_winter', kind: 'winter', name: 'the Long Winter', placeId: 'vessas_rest', spheres: { time: 2, order: 1 }, what: 'the passes stayed shut for a whole year', lingers: 'Frost still forms on it indoors.',
    salvage: 'It kept someone alive through the Long Winter, the year the passes stayed shut.' },
  falling_stars: { id: 'falling_stars', kind: 'starfall', name: 'the Night of Falling Stars', placeId: 'the_ashfold', spheres: { energy: 2, spirit: 1, chaos: 1 }, what: 'burning metal fell on the Ashfold', lingers: 'It is still faintly warm.',
    salvage: 'It was hammered out of the metal that fell on the Ashfold on the Night of Falling Stars.' },
};

const H = (id: string, name: string, first: string, family: string, pronoun: 'she' | 'he', factionId: string, role: string, deed: string, eventId: string, fate: string, dead: boolean, oathbreaker = false): ItemGenHero =>
  ({ id, name, first, family, pronoun, factionId, role, deed, eventId, fate, dead, ...(oathbreaker ? { oathbreaker } : {}) });

const REVIEW_HEROES: Record<string, ItemGenHero> = {
  hesta_ryle:  H('hesta_ryle', 'Hesta Ryle', 'Hesta', 'Ryle', 'she', 'civic_guard', 'a Civic Guard captain', 'who held Greywater Ford', 'greywater_stand', 'died at the ford', true),
  bram_oskell: H('bram_oskell', 'Bram Oskell', 'Bram', 'Oskell', 'he', 'mercenary_company', 'a Free Company sergeant', 'who opened the gate at Kel Barrow', 'kel_siege', 'was hanged for opening the gate', true, true),
  old_vannic:  H('old_vannic', 'Old Vannic', 'Vannic', 'Vannic', 'he', 'arcane_circle', "the Arcane Circle's first archivist", 'who went back into the burning library', 'library_burning', 'did not come out of the fire', true),
  sister_maud: H('sister_maud', 'Sister Maud', 'Maud', 'Maud', 'she', 'holy_order_dawn', 'a healer of the Dawn', 'who nursed Thornwood through the Plague Year', 'plague_year', 'died of the plague in its last week', true),
  ivo_tallow:  H('ivo_tallow', 'Ivo Tallow', 'Ivo', 'Tallow', 'he', 'thieves_guild', 'a Thieves Guild fence', 'who kept the best back room in Saltmere', 'salt_riots', 'went missing in the Salt Riots', false),
  arn_veck:    H('arn_veck', 'Arn Veck', 'Arn', 'Veck', 'he', 'rangers_brotherhood', 'a Rangers Brotherhood tracker', 'who walked the whole border twice', 'plague_year', 'walked into Thornwood and did not come out', true),
  maren_doss:  H('maren_doss', 'Maren Doss', 'Maren', 'Doss', 'she', 'merchant_consortium', 'a Consortium factor', 'who ran salt from Saltmere to the coast', 'drowning', 'drowned with her boat at Low Harrow', true),
  corvin_hale: H('corvin_hale', 'Corvin Hale', 'Corvin', 'Hale', 'he', 'underking_court', "the Underking's chamberlain", "who kept the Court's book of debts", 'long_winter', 'died owed more than anyone alive', true),
  tamsin_weir: H('tamsin_weir', 'Tamsin Weir', 'Tamsin', 'Weir', 'she', 'adventuring_guild', 'an Adventurers Guild delver', 'who went first into the barrows at Kel Barrow', 'kel_siege', 'came out of the barrows alone', false),
  father_gall: H('father_gall', 'Father Gall', 'Gall', 'Gall', 'he', 'temple_of_spheres', 'a priest of the Temple of the Spheres', 'who kept the Ashfold shrine through the Night of Falling Stars', 'falling_stars', 'is buried under the shrine he kept', true),
  wenna_kell:  H('wenna_kell', 'Wenna Kell', 'Wenna', 'Kell', 'she', 'underking_court', "a lady of the Underking's Court", 'who outlived four masters of the Court', 'long_winter', 'faded out of the world rather than died', false),
};

const monsterReach = (defId: string) => getFactionDefinition(defId)?.reachWeights ?? {};
const REVIEW_MONSTERS: Record<string, ItemGenMonster> = {
  wraith_host:    { id: 'wraith_host', name: 'the Grey Wraith Host', sphere: 'spirit', placeId: 'kel_barrow', one: 'a wraith of the Grey Wraith Host', immune: '#curse', reachWeights: monsterReach('monster_spirit') },
  storm_flock:    { id: 'storm_flock', name: 'the Ashen Storm Flock', sphere: 'energy', placeId: 'the_ashfold', one: 'a bird of the Ashen Storm Flock', reachWeights: monsterReach('monster_energy') },
  beast_pack:     { id: 'beast_pack', name: 'the Thornwood Beast Pack', sphere: 'force', placeId: 'thornwood', one: 'a wolf of the Thornwood Beast Pack', reachWeights: monsterReach('monster_force') },
  salt_golems:    { id: 'salt_golems', name: 'the Salt Golems', sphere: 'matter', placeId: 'saltmere', one: 'a salt golem', reachWeights: monsterReach('monster_matter') },
  plague_shamble: { id: 'plague_shamble', name: 'the Plague Shamble', sphere: 'entropy', placeId: 'thornwood', one: 'a thing of the Plague Shamble', immune: '#disease', reachWeights: monsterReach('monster_entropy') },
  echo_stalkers:  { id: 'echo_stalkers', name: 'the Drowned Echo Stalkers', sphere: 'time', placeId: 'low_harrow', one: 'an echo stalker from the drowned town', reachWeights: monsterReach('monster_time') },
  behemoths:      { id: 'behemoths', name: 'the Steppe Behemoth Herd', sphere: 'life', placeId: 'saltmere', one: 'a steppe behemoth', reachWeights: monsterReach('monster_life') },
  mind_swarm:     { id: 'mind_swarm', name: "the Mind Swarm under Vessa's Rest", sphere: 'mind', placeId: 'vessas_rest', one: 'a husk of the Mind Swarm', reachWeights: monsterReach('monster_mind') },
};

/** The review world's makers — a masterwork review item is made by one of these. */
export const REVIEW_MAKERS: readonly ItemGenMaker[] = [
  { id: 'maker_tamsin', name: 'Tamsin Weir', first: 'Tamsin', pronoun: 'she', factionId: 'adventuring_guild', placeId: 'saltmere', cultureId: null },
  { id: 'maker_orrin', name: 'Orrin Vale', first: 'Orrin', pronoun: 'he', factionId: 'mercenary_company', placeId: 'kel_barrow', cultureId: 'kel' },
  { id: 'maker_ysolde', name: 'Ysolde Marr', first: 'Ysolde', pronoun: 'she', factionId: 'arcane_circle', placeId: 'vessas_rest', cultureId: 'vessani' },
  { id: 'maker_dunn', name: 'Dunn Hollis', first: 'Dunn', pronoun: 'he', factionId: 'builders_fellowship', placeId: 'greywater_ford', cultureId: null },
  { id: 'maker_pell', name: 'Pell Arro', first: 'Pell', pronoun: 'they', factionId: 'thieves_guild', placeId: 'saltmere', cultureId: 'harrowfolk' },
  { id: 'maker_ilse', name: 'Ilse Brand', first: 'Ilse', pronoun: 'she', factionId: 'holy_order_dawn', placeId: 'the_ashfold', cultureId: 'ashborn' },
  { id: 'maker_cato', name: 'Cato Wren', first: 'Cato', pronoun: 'he', factionId: 'merchant_consortium', placeId: 'saltmere', cultureId: null },
  { id: 'maker_edda', name: 'Edda Stroud', first: 'Edda', pronoun: 'she', factionId: 'civic_guard', placeId: 'greywater_ford', cultureId: null },
  { id: 'maker_hobb', name: 'Hobb Ferrin', first: 'Hobb', pronoun: 'he', factionId: 'rangers_brotherhood', placeId: 'thornwood', cultureId: null },
];

let cachedFactions: Record<string, ItemGenFaction> | null = null;
function reviewFactions(): Record<string, ItemGenFaction> {
  if (!cachedFactions) {
    cachedFactions = {};
    for (const def of getFactionDefinitionRoster().values()) {
      if (def.id.startsWith('monster_') || !ITEM_GEN_FACTION_WORDS[def.id]) continue; // the twelve guilds the review world's people belong to
      cachedFactions[def.id] = itemGenFactionFromDefinition(def.id, def.id, def.nameTemplate);
    }
  }
  return cachedFactions;
}

/** The review world, optionally with one of its makers at the bench. */
export function reviewWorldContext(maker: ItemGenMaker | null = null): ItemWorldContext {
  return {
    maker,
    factions: reviewFactions(),
    places: REVIEW_PLACES,
    cultures: REVIEW_CULTURES,
    heroes: REVIEW_HEROES,
    events: REVIEW_EVENTS,
    monsters: REVIEW_MONSTERS,
  };
}
