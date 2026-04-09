/**
 * NPC Framework v1 — SpotlightTier types, role definitions, and tunable constants.
 *
 * SpotlightTier controls the fidelity level of an actor graph node:
 *   ambient   — background population, minimal state, no individual AI
 *   notable   — named NPC, tracked importance, eligible for player interaction
 *   spotlight — full agent treatment, runs in the tick loop with individual goals
 *
 * Promotion thresholds and importance scoring are in NPC_CONSTANTS.
 *
 * Every NPC role maps to a unique (primary, secondary) reach pair via
 * NPC_ROLE_REACH_MAP. There are 56 roles covering all 8×7 permutations
 * of the Eight Reaches.
 */

import type { ReachDomain } from './traits';

// ---------------------------------------------------------------------------
// SpotlightTier
// ---------------------------------------------------------------------------

export type SpotlightTier = 'ambient' | 'notable' | 'spotlight';

export const SPOTLIGHT_TIERS: ReadonlyArray<SpotlightTier> = [
  'ambient',
  'notable',
  'spotlight',
];

// ---------------------------------------------------------------------------
// NpcRole — 56 roles covering all reach permutations
// ---------------------------------------------------------------------------

export type NpcRole =
  // Existing (37)
  | 'innkeeper'
  | 'guard'
  | 'merchant'
  | 'healer'
  | 'priest'
  | 'acolyte'
  | 'pilgrim'
  | 'scholar'
  | 'spy'
  | 'noble'
  | 'entertainer'
  | 'faction_rep'
  | 'commander'
  | 'quartermaster'
  | 'scout'
  | 'hermit'
  | 'ranger'
  | 'wanderer'
  | 'clerk'
  | 'appraiser'
  | 'fence'
  | 'informant'
  | 'lookout'
  | 'steward'
  | 'herald'
  | 'attendant'
  | 'scribe'
  | 'librarian'
  | 'researcher'
  | 'weaver'
  | 'mason'
  | 'brewer'
  | 'trader'
  | 'guard_captain'
  | 'elder'
  | 'smith'
  | 'broker'
  // New (19) — filling all 56 reach permutations
  | 'mercenary'
  | 'spellsword'
  | 'paladin'
  | 'alchemist'
  | 'assassin'
  | 'burglar'
  | 'hexer'
  | 'warmage'
  | 'enchanter'
  | 'illusionist'
  | 'bard'
  | 'marshal'
  | 'sage'
  | 'monk'
  | 'hunter'
  | 'warrior_priest'
  | 'chaplain'
  | 'exorcist'
  | 'oracle';

export const NPC_ROLES: ReadonlyArray<NpcRole> = [
  // Existing
  'innkeeper', 'guard', 'merchant', 'healer', 'priest', 'acolyte',
  'pilgrim', 'scholar', 'spy', 'noble', 'entertainer', 'faction_rep',
  'commander', 'quartermaster', 'scout', 'hermit', 'ranger', 'wanderer',
  'clerk', 'appraiser', 'fence', 'informant', 'lookout', 'steward',
  'herald', 'attendant', 'scribe', 'librarian', 'researcher', 'weaver',
  'mason', 'brewer', 'trader', 'guard_captain', 'elder', 'smith', 'broker',
  // New
  'mercenary', 'spellsword', 'paladin', 'alchemist', 'assassin', 'burglar',
  'hexer', 'warmage', 'enchanter', 'illusionist', 'bard', 'marshal',
  'sage', 'monk', 'hunter', 'warrior_priest', 'chaplain', 'exorcist', 'oracle',
];

// ---------------------------------------------------------------------------
// Role → Reach Affinity (all 56 permutations of 8 reaches)
// ---------------------------------------------------------------------------

/**
 * Every NPC role has a unique (primary, secondary) reach pair.
 * 8 reaches × 7 secondaries = 56 permutations, one per role.
 *
 * Grid (rows = primary, cols = secondary):
 *
 *          iron        gold        shadow      veil        heart       eye         stone       star
 * iron     —           mercenary   ranger      spellsword  guard_cap   commander   guard       paladin
 * gold     brewer      —           trader      alchemist   innkeeper   merchant    quarter.    healer
 * shadow   assassin    fence       —           broker      spy         informant   burglar     hexer
 * veil     warmage     enchanter   illusionist —           bard        researcher  scribe      hermit
 * heart    marshal     noble       faction_rep entertainer —           elder       steward     herald
 * eye      scout       appraiser   lookout     scholar     sage        —           clerk       librarian
 * stone    smith       mason       hunter      weaver      monk        wanderer    —           pilgrim
 * star     warrior_pr. chaplain    exorcist    acolyte     priest      oracle      attendant   —
 */
export interface RoleReachAffinity {
  primary: ReachDomain;
  secondary: ReachDomain;
}

export const NPC_ROLE_REACH_MAP: Record<NpcRole, RoleReachAffinity> = {
  // ── Iron primary ──────────────────────────────────────────────
  guard:          { primary: 'iron',   secondary: 'stone'  },
  guard_captain:  { primary: 'iron',   secondary: 'heart'  },
  commander:      { primary: 'iron',   secondary: 'eye'    },
  ranger:         { primary: 'iron',   secondary: 'shadow' },
  mercenary:      { primary: 'iron',   secondary: 'gold'   },
  spellsword:     { primary: 'iron',   secondary: 'veil'   },
  paladin:        { primary: 'iron',   secondary: 'star'   },
  // ── Gold primary ──────────────────────────────────────────────
  merchant:       { primary: 'gold',   secondary: 'eye'    },
  trader:         { primary: 'gold',   secondary: 'shadow' },
  innkeeper:      { primary: 'gold',   secondary: 'heart'  },
  quartermaster:  { primary: 'gold',   secondary: 'stone'  },
  healer:         { primary: 'gold',   secondary: 'star'   },
  brewer:         { primary: 'gold',   secondary: 'iron'   },
  alchemist:      { primary: 'gold',   secondary: 'veil'   },
  // ── Shadow primary ────────────────────────────────────────────
  spy:            { primary: 'shadow', secondary: 'heart'  },
  informant:      { primary: 'shadow', secondary: 'eye'    },
  fence:          { primary: 'shadow', secondary: 'gold'   },
  broker:         { primary: 'shadow', secondary: 'veil'   },
  assassin:       { primary: 'shadow', secondary: 'iron'   },
  burglar:        { primary: 'shadow', secondary: 'stone'  },
  hexer:          { primary: 'shadow', secondary: 'star'   },
  // ── Veil primary ──────────────────────────────────────────────
  hermit:         { primary: 'veil',   secondary: 'star'   },
  researcher:     { primary: 'veil',   secondary: 'eye'    },
  scribe:         { primary: 'veil',   secondary: 'stone'  },
  warmage:        { primary: 'veil',   secondary: 'iron'   },
  enchanter:      { primary: 'veil',   secondary: 'gold'   },
  illusionist:    { primary: 'veil',   secondary: 'shadow' },
  bard:           { primary: 'veil',   secondary: 'heart'  },
  // ── Heart primary ─────────────────────────────────────────────
  noble:          { primary: 'heart',  secondary: 'gold'   },
  faction_rep:    { primary: 'heart',  secondary: 'shadow' },
  entertainer:    { primary: 'heart',  secondary: 'veil'   },
  elder:          { primary: 'heart',  secondary: 'eye'    },
  steward:        { primary: 'heart',  secondary: 'stone'  },
  herald:         { primary: 'heart',  secondary: 'star'   },
  marshal:        { primary: 'heart',  secondary: 'iron'   },
  // ── Eye primary ───────────────────────────────────────────────
  scout:          { primary: 'eye',    secondary: 'iron'   },
  appraiser:      { primary: 'eye',    secondary: 'gold'   },
  lookout:        { primary: 'eye',    secondary: 'shadow' },
  scholar:        { primary: 'eye',    secondary: 'veil'   },
  sage:           { primary: 'eye',    secondary: 'heart'  },
  clerk:          { primary: 'eye',    secondary: 'stone'  },
  librarian:      { primary: 'eye',    secondary: 'star'   },
  // ── Stone primary ─────────────────────────────────────────────
  smith:          { primary: 'stone',  secondary: 'iron'   },
  mason:          { primary: 'stone',  secondary: 'gold'   },
  hunter:         { primary: 'stone',  secondary: 'shadow' },
  weaver:         { primary: 'stone',  secondary: 'veil'   },
  monk:           { primary: 'stone',  secondary: 'heart'  },
  wanderer:       { primary: 'stone',  secondary: 'eye'    },
  pilgrim:        { primary: 'stone',  secondary: 'star'   },
  // ── Star primary ──────────────────────────────────────────────
  warrior_priest: { primary: 'star',   secondary: 'iron'   },
  chaplain:       { primary: 'star',   secondary: 'gold'   },
  exorcist:       { primary: 'star',   secondary: 'shadow' },
  acolyte:        { primary: 'star',   secondary: 'veil'   },
  priest:         { primary: 'star',   secondary: 'heart'  },
  oracle:         { primary: 'star',   secondary: 'eye'    },
  attendant:      { primary: 'star',   secondary: 'stone'  },
};

// ---------------------------------------------------------------------------
// Role Rosters
// ---------------------------------------------------------------------------

/** A role entry in a location or faction roster. `chance` is in [0, 1]. */
export interface RoleRosterEntry {
  role: NpcRole;
  /** Probability (0–1) that this role appears when populating the location/faction. */
  chance: number;
}

/** Maps location subtype → ordered list of role entries. */
export type LocationRoleRosters = Record<string, RoleRosterEntry[]>;

export const LOCATION_ROLE_ROSTERS: LocationRoleRosters = {
  hamlet: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'elder', chance: 1.0 },
    { role: 'guard', chance: 0.8 },
    { role: 'brewer', chance: 0.7 },
    { role: 'healer', chance: 0.5 },
    { role: 'monk', chance: 0.3 },
    { role: 'pilgrim', chance: 0.3 },
    { role: 'wanderer', chance: 0.2 },
  ],
  town: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'trader', chance: 0.8 },
    { role: 'smith', chance: 0.9 },
    { role: 'healer', chance: 0.8 },
    { role: 'priest', chance: 0.7 },
    { role: 'mason', chance: 0.7 },
    { role: 'clerk', chance: 0.6 },
    { role: 'bard', chance: 0.6 },
    { role: 'alchemist', chance: 0.5 },
    { role: 'sage', chance: 0.4 },
    { role: 'hunter', chance: 0.4 },
    { role: 'entertainer', chance: 0.4 },
    { role: 'lookout', chance: 0.35 },
  ],
  city: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'trader', chance: 0.9 },
    { role: 'smith', chance: 1.0 },
    { role: 'healer', chance: 1.0 },
    { role: 'priest', chance: 1.0 },
    { role: 'scholar', chance: 0.8 },
    { role: 'noble', chance: 0.7 },
    { role: 'entertainer', chance: 0.7 },
    { role: 'spy', chance: 0.6 },
    { role: 'marshal', chance: 0.6 },
    { role: 'warmage', chance: 0.5 },
    { role: 'enchanter', chance: 0.5 },
    { role: 'bard', chance: 0.6 },
    { role: 'alchemist', chance: 0.6 },
    { role: 'sage', chance: 0.5 },
    { role: 'assassin', chance: 0.4 },
    { role: 'mercenary', chance: 0.5 },
    { role: 'oracle', chance: 0.3 },
    { role: 'chaplain', chance: 0.4 },
    { role: 'lookout', chance: 0.45 },
  ],
  capital: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'trader', chance: 0.9 },
    { role: 'smith', chance: 1.0 },
    { role: 'healer', chance: 1.0 },
    { role: 'priest', chance: 1.0 },
    { role: 'scholar', chance: 0.9 },
    { role: 'noble', chance: 0.9 },
    { role: 'entertainer', chance: 0.8 },
    { role: 'spy', chance: 0.7 },
    { role: 'herald', chance: 0.6 },
    { role: 'marshal', chance: 0.7 },
    { role: 'warmage', chance: 0.6 },
    { role: 'enchanter', chance: 0.6 },
    { role: 'bard', chance: 0.7 },
    { role: 'alchemist', chance: 0.7 },
    { role: 'sage', chance: 0.6 },
    { role: 'assassin', chance: 0.5 },
    { role: 'mercenary', chance: 0.6 },
    { role: 'paladin', chance: 0.5 },
    { role: 'spellsword', chance: 0.4 },
    { role: 'warrior_priest', chance: 0.4 },
    { role: 'exorcist', chance: 0.3 },
    { role: 'illusionist', chance: 0.4 },
    { role: 'lookout', chance: 0.45 },
  ],
  temple: [
    { role: 'priest', chance: 1.0 },
    { role: 'acolyte', chance: 0.9 },
    { role: 'monk', chance: 0.8 },
    { role: 'chaplain', chance: 0.7 },
    { role: 'warrior_priest', chance: 0.5 },
    { role: 'exorcist', chance: 0.4 },
    { role: 'oracle', chance: 0.4 },
    { role: 'healer', chance: 0.6 },
    { role: 'pilgrim', chance: 0.7 },
  ],
  military_outpost: [
    { role: 'commander', chance: 1.0 },
    { role: 'quartermaster', chance: 0.9 },
    { role: 'scout', chance: 0.8 },
    { role: 'mercenary', chance: 0.7 },
    { role: 'paladin', chance: 0.4 },
    { role: 'spellsword', chance: 0.3 },
    { role: 'marshal', chance: 0.5 },
    { role: 'guard', chance: 0.8 },
  ],
  wilderness: [
    { role: 'hermit', chance: 0.3 },
    { role: 'ranger', chance: 0.3 },
    { role: 'wanderer', chance: 0.3 },
    { role: 'hunter', chance: 0.3 },
    { role: 'hexer', chance: 0.2 },
    { role: 'pilgrim', chance: 0.2 },
  ],
  castle: [
    { role: 'noble', chance: 1.0 },
    { role: 'marshal', chance: 0.9 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'steward', chance: 0.9 },
    { role: 'herald', chance: 0.7 },
    { role: 'spy', chance: 0.5 },
    { role: 'attendant', chance: 0.8 },
  ],
  shrine: [
    { role: 'oracle', chance: 0.7 },
    { role: 'hermit', chance: 0.5 },
    { role: 'pilgrim', chance: 0.6 },
    { role: 'healer', chance: 0.5 },
    { role: 'acolyte', chance: 0.6 },
    { role: 'hexer', chance: 0.2 },
  ],
};

/** Maps faction type → ordered list of role entries. */
export type FactionRoleRosters = Record<string, RoleRosterEntry[]>;

export const FACTION_ROLE_ROSTERS: FactionRoleRosters = {
  merchant_guild: [
    { role: 'merchant', chance: 1.0 },
    { role: 'trader', chance: 0.9 },
    { role: 'clerk', chance: 0.7 },
    { role: 'appraiser', chance: 0.6 },
    { role: 'brewer', chance: 0.5 },
  ],
  military_order: [
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 0.9 },
    { role: 'quartermaster', chance: 0.7 },
    { role: 'scout', chance: 0.8 },
    { role: 'marshal', chance: 0.6 },
  ],
  religious_order: [
    { role: 'priest', chance: 1.0 },
    { role: 'acolyte', chance: 0.9 },
    { role: 'pilgrim', chance: 0.7 },
    { role: 'attendant', chance: 0.6 },
    { role: 'chaplain', chance: 0.5 },
  ],
  thieves_guild: [
    { role: 'fence', chance: 1.0 },
    { role: 'informant', chance: 0.9 },
    { role: 'lookout', chance: 0.7 },
    { role: 'broker', chance: 0.6 },
  ],
  noble_house: [
    { role: 'steward', chance: 1.0 },
    { role: 'herald', chance: 0.8 },
    { role: 'attendant', chance: 0.7 },
    { role: 'noble', chance: 0.9 },
    { role: 'sage', chance: 0.5 },
  ],
  scholarly_circle: [
    { role: 'scribe', chance: 1.0 },
    { role: 'librarian', chance: 0.8 },
    { role: 'researcher', chance: 0.7 },
    { role: 'scholar', chance: 0.9 },
    { role: 'clerk', chance: 0.5 },
  ],
  artisan_guild: [
    { role: 'smith', chance: 1.0 },
    { role: 'weaver', chance: 0.8 },
    { role: 'mason', chance: 0.7 },
    { role: 'brewer', chance: 0.6 },
    { role: 'enchanter', chance: 0.4 },
  ],
  arcane_order: [
    { role: 'warmage', chance: 0.8 },
    { role: 'illusionist', chance: 0.7 },
    { role: 'alchemist', chance: 0.9 },
    { role: 'bard', chance: 0.6 },
    { role: 'researcher', chance: 0.7 },
  ],
  holy_order: [
    { role: 'paladin', chance: 1.0 },
    { role: 'warrior_priest', chance: 0.9 },
    { role: 'exorcist', chance: 0.7 },
    { role: 'monk', chance: 0.8 },
    { role: 'chaplain', chance: 0.6 },
  ],
  mercenary_band: [
    { role: 'mercenary', chance: 1.0 },
    { role: 'spellsword', chance: 0.7 },
    { role: 'commander', chance: 0.8 },
    { role: 'ranger', chance: 0.6 },
    { role: 'hunter', chance: 0.5 },
  ],
  ranger_lodge: [
    { role: 'ranger', chance: 1.0 },
    { role: 'hunter', chance: 0.9 },
    { role: 'scout', chance: 0.8 },
    { role: 'oracle', chance: 0.4 },
  ],
  underworld: [
    { role: 'assassin', chance: 0.8 },
    { role: 'burglar', chance: 0.9 },
    { role: 'hexer', chance: 0.6 },
    { role: 'spy', chance: 0.7 },
    { role: 'fence', chance: 0.5 },
  ],
};

// ---------------------------------------------------------------------------
// Name Pool (fallback for NPC name generation)
// ---------------------------------------------------------------------------

export const NPC_NAME_POOL: ReadonlyArray<string> = [
  'Aldric', 'Bramble', 'Caelan', 'Dessa', 'Edwyn', 'Faryn', 'Greta', 'Hadwin',
  'Isolde', 'Jareth', 'Kessa', 'Lorin', 'Maren', 'Neven', 'Orin', 'Petra',
  'Quill', 'Rowena', 'Sable', 'Tomas', 'Ulwyn', 'Verna', 'Wren', 'Xander',
  'Ysolde', 'Zephyr', 'Aelith', 'Brenin', 'Calyx', 'Dwyn', 'Efra', 'Fael',
  'Gorin', 'Hesta', 'Idris', 'Jorin', 'Kael', 'Lyra', 'Mord', 'Naleth',
  'Oswyn', 'Pell', 'Quen', 'Rilla', 'Soren', 'Thane', 'Uldric', 'Vara',
];

// ---------------------------------------------------------------------------
// Role → Preferred Sublocation Type
// ---------------------------------------------------------------------------

/**
 * Maps NPC roles to the sublocation-type ID they prefer at worldgen placement.
 * Only roles with a clear home are listed — unlisted roles stay at the parent location.
 * The seeder falls back to the parent location if the sublocation doesn't exist.
 */
export const NPC_ROLE_SUBLOCATION_MAP: Partial<Record<NpcRole, string>> = {
  // Religious — temple quarter
  healer:         'sublocation-type.temple-quarter',
  priest:         'sublocation-type.temple-quarter',
  acolyte:        'sublocation-type.temple-quarter',
  pilgrim:        'sublocation-type.temple-quarter',
  monk:           'sublocation-type.temple-quarter',
  chaplain:       'sublocation-type.temple-quarter',
  warrior_priest: 'sublocation-type.temple-quarter',
  exorcist:       'sublocation-type.temple-quarter',
  oracle:         'sublocation-type.temple-quarter',
  // Gate/watch duty — gatehouse
  guard:          'sublocation-type.gatehouse',
  guard_captain:  'sublocation-type.gatehouse',
  lookout:        'sublocation-type.gatehouse',
  marshal:        'sublocation-type.gatehouse',
  // Military command — barracks
  commander:      'sublocation-type.barracks',
  quartermaster:  'sublocation-type.barracks',
  scout:          'sublocation-type.barracks',
  mercenary:      'sublocation-type.barracks',
  paladin:        'sublocation-type.barracks',
  spellsword:     'sublocation-type.barracks',
  // Commerce — market district
  merchant:       'sublocation-type.market-district',
  trader:         'sublocation-type.market-district',
  innkeeper:      'sublocation-type.market-district',
  smith:          'sublocation-type.market-district',
  appraiser:      'sublocation-type.market-district',
  brewer:         'sublocation-type.market-district',
  alchemist:      'sublocation-type.market-district',
  enchanter:      'sublocation-type.market-district',
  // Scholars — library (towers/archives)
  scholar:        'sublocation-type.library',
  librarian:      'sublocation-type.library',
  researcher:     'sublocation-type.library',
  scribe:         'sublocation-type.library',
  sage:           'sublocation-type.library',
  // Court — throne room (capitals/castles only)
  noble:          'sublocation-type.throne-room',
  steward:        'sublocation-type.throne-room',
  herald:         'sublocation-type.throne-room',
} as const;

// ---------------------------------------------------------------------------
// NPC_CONSTANTS — all tunable numbers in one place (NFP #1)
// ---------------------------------------------------------------------------

export const NPC_CONSTANTS = {
  // --- Spotlight promotion thresholds ---

  /** Importance score at which an ambient NPC becomes notable. */
  NOTABLE_THRESHOLD: 10,

  /** Importance score at which a notable NPC becomes spotlight. */
  SPOTLIGHT_THRESHOLD: 25,

  /** Minimum edge count (graph connections) required for spotlight promotion. */
  SPOTLIGHT_MIN_EDGES: 3,

  // --- Essence cost for player-driven promotion ---

  /** Base essence cost to promote an NPC to the next spotlight tier. */
  PROMOTE_ESSENCE_BASE: 8,

  /**
   * Fraction by which high importance reduces the essence promotion cost.
   * Cost = max(1, PROMOTE_ESSENCE_BASE - importance * PROMOTE_IMPORTANCE_DISCOUNT).
   */
  PROMOTE_IMPORTANCE_DISCOUNT: 0.5,

  // --- Importance scoring increments ---

  /** Importance added when the player directly takes an action targeting this NPC. */
  IMPORTANCE_PLAYER_ACTION: 3,

  /** Importance added when this NPC is referenced in an encounter narrative. */
  IMPORTANCE_ENCOUNTER_REFERENCE: 1,

  /** Importance added when a new graph edge is created involving this NPC. */
  IMPORTANCE_EDGE_CREATED: 2,

  /** Importance added when this NPC gains a trait. */
  IMPORTANCE_TRAIT_GAINED: 4,

  /** Importance added when the NPC's location becomes contested. */
  IMPORTANCE_LOCATION_CONTESTED: 1,

  // --- Population caps ---

  /** Maximum notable/spotlight NPCs generated for a hamlet. */
  MAX_NPCS_HAMLET: 4,

  /** Maximum notable/spotlight NPCs generated for a town. */
  MAX_NPCS_TOWN: 8,

  /** Maximum notable/spotlight NPCs generated for a city. */
  MAX_NPCS_CITY: 15,

  /** Probability that a wilderness hex spawns a notable NPC at worldgen. */
  WILDERNESS_NPC_CHANCE: 0.3,

  // --- Notable-tier domain capability ranges ---
  // Primary reach: role's main domain. Secondary: role's off-domain.
  // Others: minor aptitudes.

  /** Base innate score for the role's primary reach at notable tier. */
  NOTABLE_PRIMARY_BASE: 8,
  /** Random range added to primary reach base (result: BASE..BASE+RANGE). */
  NOTABLE_PRIMARY_RANGE: 8,

  /** Base innate score for the role's secondary reach at notable tier. */
  NOTABLE_SECONDARY_BASE: 5,
  /** Random range added to secondary reach base. */
  NOTABLE_SECONDARY_RANGE: 6,

  /** Base innate score for non-primary/secondary reaches at notable tier. */
  NOTABLE_OTHER_BASE: 1,
  /** Random range added to other reach bases. */
  NOTABLE_OTHER_RANGE: 5,

  // --- Spotlight-tier boost ranges (added on top of notable values) ---

  /** Boost added to primary reach when promoted to spotlight. */
  SPOTLIGHT_PRIMARY_BOOST: 15,
  /** Random range added to primary boost. */
  SPOTLIGHT_PRIMARY_RANGE: 16,

  /** Boost added to secondary reach when promoted to spotlight. */
  SPOTLIGHT_SECONDARY_BOOST: 10,
  /** Random range added to secondary boost. */
  SPOTLIGHT_SECONDARY_RANGE: 11,

  /** Boost added to other reaches when promoted to spotlight. */
  SPOTLIGHT_OTHER_BOOST: 5,
  /** Random range added to other boost. */
  SPOTLIGHT_OTHER_RANGE: 11,
} as const;

export type NpcConstants = typeof NPC_CONSTANTS;
