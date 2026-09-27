/**
 * The item generator's tables — forms, materials, looks, name roots, magnitudes (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Data tables.
 * Ported from the THR-1236 prototype (`proto/thr-1570-item-generator`,
 * `Docs/audits/2026-09-24-proto-items/generator.mjs` §2, §4, §6, §11), less
 * everything the live world now supplies — factions, places, people, events and
 * monsters come from `engine/itemGenerator/worldContext.ts`, or from the review
 * world (`item-generator-review-world.ts`) on the review path.
 *
 * Every magnitude is a named row (NFP #1). Words are the game's register: one
 * concrete detail, plain sentences.
 */

import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { PossessionSubcategory } from '../types/attachments';
import type { StepOutcome } from '../types/unifiedAction';

// ─── Bands ────────────────────────────────────────────────────────────

/** Rarity bands a generator may mint: Storied, Mythic, Legendary. Mundane stays authored. */
export type ItemGenBand = 2 | 3 | 4;
export const ITEM_GEN_BANDS: readonly ItemGenBand[] = [2, 3, 4];

/** Where a generated item came into the world. */
export type ItemGenOrigin = 'masterwork' | 'found';
export const ITEM_GEN_ORIGINS: readonly ItemGenOrigin[] = ['masterwork', 'found'];

// ─── Constants (plan § Constants table) ───────────────────────────────

/** Master switch for the masterwork minting point; `false` restores today's empty masterwork exactly. */
export const ITEM_GEN_MASTERWORK_ENABLED = true;
/** Id prefix for generated items; registered on the `item_template` content kind. */
export const ITEM_GEN_ID_PREFIX = 'gen_';
/**
 * How the work went decides the band (Lane decision, plan § Resolution logic): a
 * `critical_success` final checkpoint makes a Mythic thing; every other completing
 * band — and a completion with no band — makes a Storied one.
 */
export const MASTERWORK_BAND_BY_OUTCOME: Readonly<Partial<Record<StepOutcome, ItemGenBand>>> & { readonly default: ItemGenBand } = {
  critical_success: 3,
  default: 2,
};
/** A workshop never makes a Legendary — a Legendary is its own content kind. */
export const MASTERWORK_MAX_BAND: ItemGenBand = 3;
/** Validator rerolls before the mint falls back to the plain masterwork. */
export const ITEM_GEN_MAX_REROLLS = 3;
/** Core weight × this per earlier generated item of the same core in this world (the prototype's `TROPE_REPEAT_DECAY`). */
export const ITEM_GEN_CORE_REPEAT_DECAY = 0.15;
/** Same, per core-and-signature — pushes a repeat core onto its other idea. */
export const ITEM_GEN_SIGNATURE_REPEAT_DECAY = 0.3;
/** Strength of the maker's faction reach lean on core choice. */
export const ITEM_GEN_FACTION_REACH_LEAN = 1.0;
/** Content gate: a core with fewer signatures fails the gate test. */
export const ITEM_GEN_MIN_SIGNATURES = 2;
/** Chance a breakable item breaks on a critical failure, by band (step-downs reach band 1). */
export const ITEM_GEN_BREAK_CHANCE_BY_BAND: Readonly<Record<1 | 2 | 3, number>> = { 1: 0.3, 2: 0.2, 3: 0.1 };
/** A new thing has seen only its making. */
export const STORIED_START_LEVEL_MASTERWORK = 1;
/** A found thing arrives with a past; level 3 is only ever earned. */
export const STORIED_START_LEVEL_FOUND_BY_BAND: Readonly<Record<ItemGenBand, number>> = { 2: 1, 3: 2, 4: 2 };
/** Gate-test seeds. */
export const ITEM_GEN_GATE_SEEDS: readonly number[] = [7, 42, 99];
/** Items per seed × band × origin in the gate test. */
export const ITEM_GEN_GATE_ITEMS_PER_CELL = 12;
/** A form drawn earlier in the same batch is weighted down by this per use (the prototype's `FORM_REPEAT_DECAY`). */
export const ITEM_GEN_FORM_REPEAT_DECAY = 0.3;
/** A named person drawn earlier in the same batch is weighted down by this per use. */
export const ITEM_GEN_HERO_REPEAT_DECAY = 0.35;
/** A provenance line used earlier in the same batch is weighted down by this per use. */
export const ITEM_GEN_PROVENANCE_REPEAT_DECAY = 0.1;
/** Ticks in an in-game day, for the plain-words renderer ("24 ticks is two in-game days", effect-constants). */
export const ITEM_GEN_TICKS_PER_DAY = 12;

/**
 * Magnitude envelopes by band — the prototype's `MAG`, calibrated against the hand
 * catalog's own ranges and inside `item-stat-bands.ts`. Band 1 rows are reached only by
 * a core's deliberate step-down (`c.mag(kind, 1)` on a Storied item), never minted as
 * a Mundane item.
 */
export const ITEM_GEN_MAGNITUDE_BY_BAND = {
  passive:     { 1: [0.02, 0.04], 2: [0.04, 0.07], 3: [0.07, 0.10], 4: [0.10, 0.14] },
  conditional: { 1: [0.02, 0.03], 2: [0.03, 0.05], 3: [0.05, 0.08], 4: [0.08, 0.12] },
  stat:        { 1: [0.2, 0.4],   2: [0.4, 0.7],   3: [0.7, 1.0],   4: [1.2, 1.8] },
  penalty:     { 1: [0.02, 0.03], 2: [0.03, 0.05], 3: [0.04, 0.06], 4: [0.05, 0.08] },
  statPenalty: { 1: [0.1, 0.2],   2: [0.2, 0.3],   3: [0.3, 0.45],  4: [0.4, 0.6] },
  aura:        { 1: [0.03, 0.04], 2: [0.03, 0.04], 3: [0.04, 0.05], 4: [0.05, 0.06] },
  drift:       { 1: [0.002, 0.003], 2: [0.002, 0.003], 3: [0.003, 0.004], 4: [0.004, 0.005] },
  behavior:    { 1: [1.2, 1.25], 2: [1.3, 1.4], 3: [1.4, 1.5], 4: [1.5, 1.6] },
} as const satisfies Record<string, Record<1 | 2 | 3 | 4, readonly [number, number]>>;
export type ItemGenMagnitudeKind = keyof typeof ITEM_GEN_MAGNITUDE_BY_BAND;

/** Fixed per-band values (no envelope). */
export const ITEM_GEN_FIXED_BY_BAND = {
  movement:     { 1: 0.9, 2: 0.85, 3: 0.8, 4: 0.75 },
  reveal:       { 1: 1, 2: 1, 3: 2, 4: 2 },
  shaperMargin: { 1: 2, 2: 3, 3: 5, 4: 8 },
  ward:         { 1: 0.03, 2: 0.05, 3: 0.08, 4: 0.12 },
  bargainCost:  { 1: 0.02, 2: 0.02, 3: 0.03, 4: 0.05 },
  thinning:     { 1: -0.0025, 2: -0.0025, 3: -0.003, 4: -0.004 },
  growth:       { 1: 0.85, 2: 0.85, 3: 0.75, 4: 0.6 },
  influence:    { 1: 1.2, 2: 1.2, 3: 1.3, 4: 1.5 },
  influenceCost:{ 1: 0.85, 2: 0.85, 3: 0.8, 4: 0.75 },
  healing:      { 1: 1.5, 2: 1.5, 3: 1.75, 4: 2.0 },
  corruption:   { 1: 0.01, 2: 0.01, 3: 0.01, 4: 0.015 },
  holy:         { 1: 0.004, 2: 0.004, 3: 0.006, 4: 0.01 },
  restore:      { 1: 0.001, 2: 0.001, 3: 0.0015, 4: 0.002 },
} as const satisfies Record<string, Record<1 | 2 | 3 | 4, number>>;
export type ItemGenFixedKind = keyof typeof ITEM_GEN_FIXED_BY_BAND;

// ─── Cosmology words ──────────────────────────────────────────────────

export const ITEM_GEN_REACHES: readonly ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
export const ITEM_GEN_SPHERES: readonly SphereName[] = ['chaos', 'order', 'light', 'darkness', 'force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];

/** What each reach is *for*, in words the sheet can use. */
export const ITEM_GEN_REACH_DO: Readonly<Record<ReachDomain, string>> = {
  iron: 'fighting', gold: 'trade and bargaining', shadow: 'stealth and secrets', veil: 'magic and the unseen',
  heart: 'nerve and dealing with people', eye: 'noticing and knowing', stone: 'making and enduring', star: 'travel and finding the way',
};
/** What a gated reach stops its bearer doing. */
export const ITEM_GEN_REACH_BLOCK: Readonly<Record<ReachDomain, string>> = {
  iron: 'raise a hand in violence', gold: 'haggle or take payment', shadow: 'sneak, lie or steal',
  veil: 'work magic', heart: 'plead or charm', eye: 'pry into secrets', stone: 'build or mend', star: 'strike out on a long road',
};

/** Portmanteau roots per sphere — plain, one syllable where possible. */
export const ITEM_GEN_SPHERE_ROOTS: Readonly<Record<SphereName, readonly string[]>> = {
  force: ['Iron', 'War', 'Hammer', 'Break'], matter: ['Stone', 'Anvil', 'Salt', 'Grey'],
  energy: ['Spark', 'Storm', 'Ember', 'Brand'], life: ['Root', 'Thorn', 'Green', 'Sap'],
  mind: ['Ink', 'Lore', 'Keen', 'Wit'], spirit: ['Ghost', 'Prayer', 'Vigil', 'Dream'],
  time: ['Dust', 'Tide', 'Hour', 'Long'], entropy: ['Ash', 'Hollow', 'Rust', 'Rot'],
  chaos: ['Wild', 'Riven', 'Crack', 'Loose'], order: ['Oath', 'Ward', 'Law', 'True'],
  light: ['Dawn', 'Bright', 'Sun', 'Lamp'], darkness: ['Night', 'Dusk', 'Hush', 'Black'],
};
/** Plain sphere adjectives for "The {Adj} {Noun}" when a core has none of its own. */
export const ITEM_GEN_SPHERE_ADJ: Readonly<Record<SphereName, readonly string[]>> = {
  force: ['Heavy', 'Unbending'], matter: ['Solid', 'Stubborn'], energy: ['Burning', 'Restless'],
  life: ['Green', 'Living'], mind: ['Keen', 'Watchful'], spirit: ['Hallowed', 'Quiet'],
  time: ['Old', 'Patient'], entropy: ['Hollow', 'Grey'], chaos: ['Wild', 'Crooked'],
  order: ['Plain', 'Sworn'], light: ['Bright', 'Clear'], darkness: ['Dark', 'Hidden'],
};
/** One sensory detail per sphere: `hard` goods (metal, stone, wood, bone, glass, horn) and `soft` goods. */
export const ITEM_GEN_SPHERE_LOOK: Readonly<Record<SphereName, { hard: string; soft: string }>> = {
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
export const ITEM_GEN_SOFT_FITS: ReadonlySet<string> = new Set(['cloth', 'leather', 'hide', 'page']);
/** What a thing is leans which reach it serves: worn things endure and travel, tools notice. */
export const ITEM_GEN_KIND_REACH_BIAS: Readonly<Partial<Record<PossessionSubcategory, Partial<Record<ReachDomain, number>>>>> = {
  vestments: { stone: 2, star: 1.5, iron: 0.6 },
  tools_instruments: { eye: 1.5, stone: 1.3, star: 1.3 },
  tomes_scrolls: { eye: 1.5, veil: 1.5, iron: 0.2 },
};
/** What a culture's makers are called, by the kind of thing they made. */
export const ITEM_GEN_CRAFT_BY_KIND: Readonly<Record<PossessionSubcategory, string>> = {
  arms: 'smiths', vestments: 'weavers', relics_talismans: 'carvers', tools_instruments: 'makers',
  tomes_scrolls: 'scribes', mounts_beasts: 'breeders', provisions: 'brewers',
};

/**
 * The words a faction's own people go by, keyed by faction definition id — dressing
 * vocabulary for the provenance lines ("Free Company sergeants pass it to…"), not a
 * world table: which factions exist comes from the live world.
 */
export const ITEM_GEN_FACTION_WORDS: Readonly<Record<string, { roles: readonly string[]; nameRoles: readonly string[]; spheres: Partial<Record<SphereName, number>> }>> = {
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
/** The words for a faction whose definition has no row above (a new faction, a monster host). */
export const ITEM_GEN_FACTION_WORDS_FALLBACK = { roles: ['member', 'member'], nameRoles: ['Member'], spheres: {} } as const;

/**
 * The oath a vow-bound thing binds its bearer to, by the faction that gave it: the reach
 * it serves and the reach it forbids. A faction without a row derives its oath from its
 * own reach leanings (strongest served, weakest forbidden) — see `oath_object`.
 */
export const ITEM_GEN_OATHS: Readonly<Record<string, { boon: ReachDomain; forbid: ReachDomain }>> = {
  civic_guard: { boon: 'eye', forbid: 'shadow' }, holy_order_dawn: { boon: 'heart', forbid: 'gold' },
  builders_fellowship: { boon: 'stone', forbid: 'shadow' }, rangers_brotherhood: { boon: 'star', forbid: 'gold' },
  mercenary_company: { boon: 'iron', forbid: 'heart' },
};

// ─── Forms ────────────────────────────────────────────────────────────

export interface ItemGenForm {
  readonly kind: PossessionSubcategory;
  readonly noun: string;
  /** [plain, poetic] name nouns. */
  readonly names: readonly string[];
  readonly tags: readonly string[];
  readonly slot: string;
  /** Material families it can be made of. */
  readonly fits: readonly string[];
  readonly suffix?: readonly string[];
  readonly plural?: boolean;
  readonly beast?: boolean;
  /** Material preferences (id → weight multiplier). */
  readonly prefer?: Readonly<Record<string, number>>;
  /** Verb words for the war-standard provenance lines. */
  readonly at?: string;
  readonly held?: string;
  readonly carried?: string;
  readonly endure?: string;
  /** Who makes this form, when it is not the kind's usual makers (a helm is not woven). */
  readonly craft?: string;
}

const F = (kind: PossessionSubcategory, noun: string, names: string[], tags: string[], slot: string, fits: string[], extra: Partial<ItemGenForm> = {}): ItemGenForm =>
  ({ kind, noun, names, tags, slot, fits, ...extra });

export const ITEM_GEN_FORMS = {
  sword:    F('arms', 'sword', ['Sword', 'Blade'], ['#weapon', '#melee'], 'weapon', ['metal'], { suffix: ['edge', 'fang', 'brand'] }),
  axe:      F('arms', 'axe', ['Axe', 'Axe'], ['#weapon', '#melee'], 'weapon', ['metal'], { suffix: ['bite', 'cleaver'] }),
  spear:    F('arms', 'spear', ['Spear', 'Spear'], ['#weapon', '#melee'], 'weapon', ['metal', 'wood'], { suffix: ['reach', 'point'] }),
  knife:    F('arms', 'knife', ['Knife', 'Knife'], ['#weapon', '#melee', '#precision'], 'weapon', ['metal', 'bone', 'glass'], { suffix: ['fang', 'tooth', 'edge'] }),
  mace:     F('arms', 'mace', ['Mace', 'Maul'], ['#weapon', '#melee'], 'weapon', ['metal', 'wood'], { suffix: ['maul', 'fall'] }),
  bow:      F('arms', 'bow', ['Bow', 'Bow'], ['#weapon', '#ranged'], 'weapon', ['wood', 'horn'], { suffix: ['song', 'string'] }),
  cloak:    F('vestments', 'cloak', ['Cloak', 'Mantle'], ['#cloth'], 'vestment', ['cloth', 'hide'], { suffix: ['shroud', 'mantle'] }),
  coat:     F('vestments', 'coat', ['Coat', 'Coat'], ['#cloth'], 'vestment', ['leather', 'hide'], { suffix: ['coat', 'hide'] }),
  mail:     F('vestments', 'mail shirt', ['Mail', 'Mail'], [], 'vestment', ['metal'], { suffix: ['mail', 'ward'], craft: 'armourers' }),
  helm:     F('vestments', 'helm', ['Helm', 'Helm'], [], 'vestment', ['metal'], { suffix: ['helm', 'ward'], craft: 'armourers' }),
  boots:    F('vestments', 'pair of boots', ['Boots', 'Boots'], ['#cloth'], 'vestment', ['leather'], { suffix: ['foot', 'stride'], plural: true, craft: 'cobblers' }),
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
} as const satisfies Record<string, ItemGenForm>;
export type ItemGenFormId = keyof typeof ITEM_GEN_FORMS;

export const ITEM_GEN_BEAST_NAMES: readonly string[] = ['Patience', 'Ash', 'Brindle', 'Crow', 'Moss', 'Tinker', 'Sorrow', 'Old Grey', 'Pepper', 'Sexton', 'Hob', 'Duchess'];
/** A beast name that only fits one coat. */
export const ITEM_GEN_BEAST_NAME_COAT: Readonly<Record<string, string>> = { 'Ash': 'grey_coat', 'Old Grey': 'grey_coat', 'Crow': 'black_coat', 'Brindle': 'brindle', 'Pepper': 'piebald' };

// ─── Materials ────────────────────────────────────────────────────────

export interface ItemGenMaterial {
  readonly word: string;
  readonly title: string;
  readonly fits: readonly string[];
  readonly spheres: Partial<Record<SphereName, number>>;
  /** Terrain ids this material is found in (a place on that terrain leans to it). */
  readonly terrains?: readonly string[];
  readonly tags?: readonly string[];
  readonly look?: string;
  readonly avoidWords?: readonly string[];
  readonly notFor?: readonly PossessionSubcategory[];
  /** Weight multiplier for a rare material. */
  readonly scarce?: number;
  /**
   * A trophy part, reachable only through a monster of this sphere. Keyed by sphere
   * rather than by a particular host so any live monster of the kind can yield it.
   */
  readonly monsterSphere?: SphereName;
  readonly fitsForms?: readonly ItemGenFormId[];
}

const M = (word: string, title: string, fits: string[], spheres: Partial<Record<SphereName, number>>, extra: Partial<ItemGenMaterial> = {}): ItemGenMaterial =>
  ({ word, title, fits, spheres, ...extra });

export const ITEM_GEN_MATERIALS: Readonly<Record<string, ItemGenMaterial>> = {
  blackiron:   M('blackiron', 'Blackiron', ['metal'], { force: 2, darkness: 1 }, { terrains: ['mountains', 'hills'] }),
  bronze:      M('bronze', 'Bronze', ['metal'], { order: 1, time: 1, matter: 1 }),
  brass:       M('brass', 'Brass', ['metal'], { energy: 1, order: 1 }, { notFor: ['arms', 'vestments'] }),
  bog_iron:    M('bog-iron', 'Bog-iron', ['metal'], { entropy: 2, time: 1 }, { terrains: ['marsh', 'swamp'] }),
  cold_iron:   M('cold-iron', 'Cold-iron', ['metal'], { order: 2 }, { look: 'that is always cold, even beside a fire', avoidWords: ['warm'] }),
  star_metal:  M('star-metal', 'Star-metal', ['metal'], { energy: 2, spirit: 1, light: 1 }, { terrains: ['volcano'], tags: ['#star_metal'], look: 'with a faint grain in it like frost on a window', scarce: 0.2 }),
  silver:      M('silver', 'Silver', ['metal'], { light: 2, spirit: 1 }, { look: 'tarnished black in every crease', notFor: ['vestments'] }),
  pewter:      M('pewter', 'Pewter', ['metal'], { order: 1, matter: 1 }, { notFor: ['arms', 'vestments'] }),
  silk:        M('undyed silk', 'Silk', ['cloth'], { light: 1, spirit: 1 }),
  ash_wood:    M('ash-wood', 'Ash-wood', ['wood'], { life: 1, order: 1 }, { terrains: ['dense_forest', 'forest'] }),
  yew:         M('yew', 'Yew', ['wood'], { life: 1, time: 1, darkness: 1 }),
  bog_oak:     M('bog-oak', 'Bog-oak', ['wood'], { time: 2, entropy: 1 }, { terrains: ['marsh', 'swamp'], look: 'black as tar and hard as stone' }),
  bone:        M('bone', 'Bone', ['bone'], { entropy: 1, spirit: 1 }, { look: 'yellowed and smooth from handling' }),
  horn:        M('horn', 'Horn', ['horn'], { life: 1, force: 1 }),
  cinder_glass:M('cinder-glass', 'Cinder-glass', ['glass', 'stone'], { energy: 2, chaos: 1 }, { terrains: ['volcano'], look: 'black glass that still smells faintly of smoke' }),
  salt:        M('salt-crystal', 'Salt', ['stone'], { matter: 2, order: 1 }, { terrains: ['steppe', 'desert'], look: 'cloudy white, and it leaves salt on the fingers' }),
  greystone:   M('greystone', 'Greystone', ['stone'], { matter: 1, time: 1, order: 1 }, { terrains: ['mountains', 'hills'] }),
  jet:         M('jet', 'Jet', ['stone'], { darkness: 2, entropy: 1 }),
  amber:       M('amber', 'Amber', ['stone'], { time: 2, life: 1 }, { look: 'with something small and winged caught inside' }),
  leather:     M('oiled leather', 'Leather', ['leather'], { matter: 1, life: 1 }),
  wolf_hide:   M('wolf-hide', 'Wolfhide', ['hide'], { life: 1, force: 1 }, { terrains: ['dense_forest', 'forest'] }),
  grave_linen: M('grave-linen', 'Grave-linen', ['cloth'], { spirit: 2, entropy: 1 }, { look: 'grey and soft, and it smells of a cellar' }),
  wool:        M('grey wool', 'Wool', ['cloth'], { order: 1, life: 1 }),
  sailcloth:   M('tarred sailcloth', 'Sailcloth', ['cloth'], { time: 1, force: 1 }, { terrains: ['marsh', 'coast'] }),
  calfskin:    M('calfskin', 'Calfskin', ['page'], { mind: 1, order: 1 }),
  birch_bark:  M('birch-bark', 'Birch-bark', ['page'], { life: 1, time: 1 }),
  scorched:    M('scorched vellum', 'Scorched', ['page'], { energy: 1, mind: 1 }, { look: 'its edges burnt brown and brittle' }),
  dun:         M('dun', 'Dun', ['coat'], { matter: 1 }),
  grey_coat:   M('grey', 'Grey', ['coat'], { time: 1 }),
  black_coat:  M('black', 'Black', ['coat'], { darkness: 1 }),
  piebald:     M('piebald', 'Piebald', ['coat'], { chaos: 1 }),
  brindle:     M('brindled', 'Brindled', ['coat'], { life: 1 }),
  // Trophy parts — reachable only through a monster of the named sphere.
  wolf_fang:    M('wolf-fang', 'Wolf-fang', ['trophy'], { force: 2 }, { monsterSphere: 'force', fitsForms: ['knife', 'charm', 'spear'] }),
  wolf_pelt:    M('wolf-pelt', 'Wolfpelt', ['trophy'], { force: 1, life: 1 }, { monsterSphere: 'force', fitsForms: ['cloak', 'coat'] }),
  storm_feather:M('storm-feather', 'Storm-feather', ['trophy'], { energy: 2 }, { monsterSphere: 'energy', fitsForms: ['charm', 'cloak'] }),
  storm_talon:  M('storm-talon', 'Storm-talon', ['trophy'], { energy: 2 }, { monsterSphere: 'energy', fitsForms: ['knife'] }),
  grave_cloth:  M('wraith grave-cloth', 'Wraithcloth', ['trophy'], { spirit: 2 }, { monsterSphere: 'spirit', fitsForms: ['cloak', 'charm'] }),
  salt_heart:   M('golem salt-heart', 'Salt-heart', ['trophy'], { matter: 2 }, { monsterSphere: 'matter', fitsForms: ['charm'] }),
  plague_bone:  M('plague-bone', 'Plague-bone', ['trophy'], { entropy: 2 }, { monsterSphere: 'entropy', fitsForms: ['knife', 'charm'] }),
  echo_shell:   M('echo-shell', 'Echo-shell', ['trophy'], { time: 2 }, { monsterSphere: 'time', fitsForms: ['charm'] }),
  behemoth_horn:M('behemoth-horn', 'Behemoth-horn', ['trophy'], { life: 1, force: 1 }, { monsterSphere: 'life', fitsForms: ['bow', 'charm', 'spear'] }),
  swarm_husk:   M('swarm-husk', 'Husk', ['trophy'], { mind: 2 }, { monsterSphere: 'mind', fitsForms: ['charm'] }),
};

// ─── Names ────────────────────────────────────────────────────────────

/**
 * The name grammars the prototype measured on the hand catalog (THR-1235 §3): Material
 * + Form · whose trade it served (role) · whose it was (person) · X of the Y · The + word
 * + thing (definite) · one made-up word (portmanteau) · thing of a named person or place
 * (proper) · a family name (house) · a beast's given name.
 */
export type ItemGenNameGrammar = 'material' | 'role' | 'person' | 'xofy' | 'definite' | 'portmanteau' | 'proper' | 'house' | 'given';

/** Rarer items lean away from plain material names, towards story names. */
export const ITEM_GEN_GRAMMAR_BY_BAND: Readonly<Record<ItemGenNameGrammar, Readonly<Record<ItemGenBand, number>>>> = {
  material:    { 2: 0.7, 3: 0.2, 4: 0.05 },
  role:        { 2: 1.0, 3: 0.5, 4: 0.2 },
  person:      { 2: 1.0, 3: 1.0, 4: 0.8 },
  xofy:        { 2: 1.0, 3: 1.2, 4: 1.3 },
  definite:    { 2: 1.0, 3: 1.3, 4: 1.5 },
  portmanteau: { 2: 1.0, 3: 1.3, 4: 1.3 },
  proper:      { 2: 1.0, 3: 1.2, 4: 1.4 },
  house:       { 2: 1, 3: 1, 4: 1 },
  given:       { 2: 1, 3: 1, 4: 1 },
};

/** The virtues a worthy hand can carry, with the word the sheet uses and the sphere leaning. */
export const ITEM_GEN_VIRTUES: Readonly<Record<string, { word: string; adj: string; spheres: Partial<Record<SphereName, number>> }>> = {
  'trait.core.core_integrity.virtue':   { word: 'True', adj: 'True', spheres: { light: 2, order: 2 } },
  'trait.core.core_warmth.virtue':      { word: 'Warm', adj: 'Kind', spheres: { life: 2, spirit: 1 } },
  'trait.core.core_hope.virtue':        { word: 'Hopeful', adj: 'Bright', spheres: { light: 2, energy: 1 } },
  'trait.core.core_forgiveness.virtue': { word: 'Forgiving', adj: 'Merciful', spheres: { spirit: 2, life: 1 } },
  'trait.core.core_humility.virtue':    { word: 'Humble', adj: 'Plain', spheres: { order: 1, matter: 2 } },
};

// ─── The live world's past (THR-1637) ────────────────────────────────
//
// What `buildItemWorldContext` reads to dress a `found` thing from a live world: the
// retained dead, the battles fought, and the monster hosts. The review world
// (`engine/itemGenerator/reviewWorld.ts`) hand-writes the same shapes; these tables turn
// what the live graph *records* into those shapes, and say nothing it does not record.
// `{place}` / `{event}` / `{home}` / `{slayer}` are filled by `worldContext.ts`.

/** How many of the dead a found thing may name — the most recently fallen first. */
export const ITEM_GEN_LIVE_HEROES_MAX = 16;
/** How many battles a found thing may have come out of — the most recent first, one per place and kind. */
export const ITEM_GEN_LIVE_EVENTS_MAX = 12;
/** How many monster hosts a trophy or a blight may come from — the oldest hosts first. */
export const ITEM_GEN_LIVE_MONSTERS_MAX = 12;

/** How a mortal died, as a plain predicate: "{hero.They} {hero.fate}." Keyed by `deathCause`. */
export const ITEM_GEN_LIVE_FATE_BY_CAUSE: Readonly<Record<string, { at: string; bare: string }>> = {
  band:       { at: 'did not walk away from a brawl at {place}', bare: 'did not walk away from a brawl' },
  fight:      { at: 'was killed in a fight at {place}', bare: 'was killed in a fight' },
  battle:     { at: 'fell in battle at {place}', bare: 'fell in battle' },
  plot:       { at: 'was murdered at {place}', bare: 'was murdered' },
  commission: { at: 'was struck down at {place}', bare: 'was struck down' },
};
/** A death with no row above. */
export const ITEM_GEN_LIVE_FATE_FALLBACK = { at: 'died at {place}', bare: 'died' } as const;
/** A fight death whose killer is still named in the graph. */
export const ITEM_GEN_LIVE_FATE_SLAIN_BY = { at: 'was killed by {slayer} at {place}', bare: 'was killed by {slayer}' } as const;
/** A death in a recorded battle — the battle's own name. */
export const ITEM_GEN_LIVE_FATE_IN_BATTLE = 'fell in {event}';

/** What a mortal did, as a relative clause: "{hero}, {hero.deed}." A recorded battle outranks a trade. */
export const ITEM_GEN_LIVE_DEED_IN_BATTLE = 'who fought in {event}';
/** A mortal's trade at their home, keyed by `npcRole`. */
export const ITEM_GEN_LIVE_DEED_BY_ROLE: Readonly<Record<string, string>> = {
  guard: 'who stood guard at {home}', guard_captain: 'who kept the watch at {home}',
  innkeeper: 'who kept the inn at {home}', brewer: 'who brewed for {home}',
  merchant: 'who traded out of {home}', trader: 'who traded out of {home}',
  smith: 'who kept the forge at {home}', healer: 'who tended the sick at {home}',
  sage: 'who kept the old learning at {home}', researcher: 'who kept the old learning at {home}', archmage: 'who kept the old learning at {home}',
  bard: 'who sang for {home}', entertainer: 'who played for {home}',
  sailor: 'who sailed out of {home}', steward: 'who kept the stores at {home}',
  herald: 'who carried the news at {home}', clerk: 'who kept the books at {home}',
  ranger: 'who walked the country around {home}', courier: 'who carried letters out of {home}',
  labourer: 'who worked the yards at {home}',
};
/** A mortal whose trade has no row above. */
export const ITEM_GEN_LIVE_DEED_HOME = 'who lived at {home}';
/** A mortal with neither a recorded battle nor a home. */
export const ITEM_GEN_LIVE_DEED_FALLBACK = 'who kept to the roads';
/** "{hero.role}" for a mortal with no trade. */
export const ITEM_GEN_LIVE_ROLE_FALLBACK = 'a traveller';

/**
 * A recorded battle, told as the disaster a thing was salvaged from. Keyed by
 * `battleType`, then `resolutionType`. `kind` picks the salvage core's looks, forms and
 * names; the words say only what the record says — where, what kind, how it ended.
 */
export const ITEM_GEN_LIVE_BATTLE_EVENT: Readonly<Record<'siege' | 'field_battle', {
  readonly kind: 'siege' | 'last_stand';
  readonly name: string;
  readonly short: string;
  readonly spheres: Partial<Record<SphereName, number>>;
  /** `{event.what}` — what happened, by `resolutionType`. */
  readonly what: Readonly<Record<string, string>> & { readonly default: string };
  /** `{event.salvage}` — a whole sentence, by `resolutionType`. */
  readonly salvage: Readonly<Record<string, string>> & { readonly default: string };
  readonly lingers: string;
}>> = {
  siege: {
    kind: 'siege', name: 'the Siege of {place}', short: 'the siege', spheres: { force: 2, order: 1 },
    what: {
      attacker_victory: 'the walls of {place} were taken', defender_victory: '{place} held against the armies outside it',
      stalemate: '{place} was besieged and neither side gave way', mutual_destruction: 'both armies were broken under the walls of {place}',
      default: '{place} was besieged',
    },
    salvage: {
      attacker_victory: 'It was carried out of {place} the day its walls were taken.',
      defender_victory: 'It came down off the walls of {place} after the siege was broken.',
      stalemate: 'It came out of {place} after a siege that neither side won.',
      mutual_destruction: 'It was picked out of the wreck under the walls of {place}, where both armies broke.',
      default: 'It came out of {place} after {event}.',
    },
    lingers: 'There is still grit from the walls in its seams.',
  },
  field_battle: {
    kind: 'last_stand', name: 'the Battle of {place}', short: 'the battle', spheres: { force: 2, chaos: 1 },
    what: {
      attacker_victory: 'one army broke the other at {place}', defender_victory: 'one army held its ground at {place}',
      stalemate: 'two armies met at {place} and neither gave way', mutual_destruction: 'two armies broke each other at {place}',
      default: 'two armies met at {place}',
    },
    salvage: {
      attacker_victory: 'It was picked up off the field after {event}, where one army broke the other.',
      defender_victory: 'It was picked up off the field after {event}, where one army held its ground.',
      stalemate: 'It was picked up off the field at {place}, where two armies met and neither gave way.',
      mutual_destruction: 'It was picked up off the field at {place}, where two armies broke each other.',
      default: 'It was picked up off the field after {event}.',
    },
    lingers: 'It still has the mud of the field in its seams.',
  },
};

/** What one of a host is called — "a golem of the Blighted Golem Cluster" — by the host's sphere. */
export const ITEM_GEN_LIVE_MONSTER_UNIT: Readonly<Partial<Record<SphereName, string>>> = {
  matter: 'golem', energy: 'bird', entropy: 'thing', life: 'behemoth', spirit: 'wraith',
  force: 'wolf', mind: 'husk', time: 'echo stalker',
};
/** A host sphere with no row above. */
export const ITEM_GEN_LIVE_MONSTER_UNIT_FALLBACK = 'creature';
/** The condition family a host's trophies ward against, by sphere — only where the review world gave one. */
export const ITEM_GEN_LIVE_MONSTER_IMMUNE: Readonly<Partial<Record<SphereName, string>>> = {
  spirit: '#curse', entropy: '#disease',
};
