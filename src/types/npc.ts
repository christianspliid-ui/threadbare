/**
 * NPC Framework v1 — SpotlightTier types, role definitions, and tunable constants.
 *
 * SpotlightTier controls the fidelity level of an actor graph node:
 *   ambient   — background population, minimal state, no individual AI
 *   notable   — named NPC, tracked importance, eligible for player interaction
 *   spotlight — full agent treatment, runs in the tick loop with individual goals
 *
 * Promotion thresholds and importance scoring are in NPC_CONSTANTS.
 */

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
// NpcRole
// ---------------------------------------------------------------------------

export type NpcRole =
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
  | 'broker';

export const NPC_ROLES: ReadonlyArray<NpcRole> = [
  'innkeeper',
  'guard',
  'merchant',
  'healer',
  'priest',
  'acolyte',
  'pilgrim',
  'scholar',
  'spy',
  'noble',
  'entertainer',
  'faction_rep',
  'commander',
  'quartermaster',
  'scout',
  'hermit',
  'ranger',
  'wanderer',
  'clerk',
  'appraiser',
  'fence',
  'informant',
  'lookout',
  'steward',
  'herald',
  'attendant',
  'scribe',
  'librarian',
  'researcher',
  'weaver',
  'mason',
  'brewer',
  'trader',
  'guard_captain',
  'elder',
  'smith',
  'broker',
];

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
  ],
  town: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'trader', chance: 0.8 },
    { role: 'lookout', chance: 0.35 },
    { role: 'smith', chance: 0.9 },
    { role: 'healer', chance: 0.8 },
    { role: 'priest', chance: 0.7 },
  ],
  city: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'trader', chance: 0.9 },
    { role: 'lookout', chance: 0.45 },
    { role: 'smith', chance: 1.0 },
    { role: 'healer', chance: 1.0 },
    { role: 'priest', chance: 1.0 },
    { role: 'scholar', chance: 0.8 },
    { role: 'noble', chance: 0.7 },
    { role: 'entertainer', chance: 0.7 },
    { role: 'spy', chance: 0.6 },
  ],
  capital: [
    { role: 'innkeeper', chance: 1.0 },
    { role: 'merchant', chance: 1.0 },
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 1.0 },
    { role: 'trader', chance: 0.9 },
    { role: 'lookout', chance: 0.45 },
    { role: 'smith', chance: 1.0 },
    { role: 'healer', chance: 1.0 },
    { role: 'priest', chance: 1.0 },
    { role: 'scholar', chance: 0.9 },
    { role: 'noble', chance: 0.9 },
    { role: 'entertainer', chance: 0.8 },
    { role: 'spy', chance: 0.7 },
    { role: 'herald', chance: 0.6 },
  ],
  temple: [
    { role: 'priest', chance: 1.0 },
    { role: 'acolyte', chance: 0.9 },
    { role: 'pilgrim', chance: 0.7 },
  ],
  military_outpost: [
    { role: 'commander', chance: 1.0 },
    { role: 'quartermaster', chance: 0.9 },
    { role: 'scout', chance: 0.8 },
  ],
  wilderness: [
    { role: 'hermit', chance: 0.3 },
    { role: 'ranger', chance: 0.3 },
    { role: 'wanderer', chance: 0.3 },
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
  ],
  military_order: [
    { role: 'guard', chance: 1.0 },
    { role: 'guard_captain', chance: 0.9 },
    { role: 'scout', chance: 0.8 },
    { role: 'quartermaster', chance: 0.7 },
  ],
  religious_order: [
    { role: 'priest', chance: 1.0 },
    { role: 'acolyte', chance: 0.9 },
    { role: 'pilgrim', chance: 0.7 },
  ],
  thieves_guild: [
    { role: 'fence', chance: 1.0 },
    { role: 'informant', chance: 0.9 },
    { role: 'lookout', chance: 0.7 },
  ],
  noble_house: [
    { role: 'steward', chance: 1.0 },
    { role: 'guard', chance: 0.9 },
    { role: 'herald', chance: 0.8 },
    { role: 'attendant', chance: 0.7 },
  ],
  scholarly_circle: [
    { role: 'scribe', chance: 1.0 },
    { role: 'librarian', chance: 0.8 },
    { role: 'researcher', chance: 0.7 },
  ],
  artisan_guild: [
    { role: 'smith', chance: 1.0 },
    { role: 'weaver', chance: 0.8 },
    { role: 'mason', chance: 0.7 },
    { role: 'brewer', chance: 0.6 },
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
// NPC_CONSTANTS — all tunable numbers in one place (NFP #1)
// ---------------------------------------------------------------------------

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
  healer:       'sublocation-type.temple-quarter',
  priest:       'sublocation-type.temple-quarter',
  acolyte:      'sublocation-type.temple-quarter',
  pilgrim:      'sublocation-type.temple-quarter',
  // Gate/watch duty — gatehouse
  guard:        'sublocation-type.gatehouse',
  guard_captain:'sublocation-type.gatehouse',
  lookout:      'sublocation-type.gatehouse',
  // Military command — barracks
  commander:    'sublocation-type.barracks',
  quartermaster:'sublocation-type.barracks',
  scout:        'sublocation-type.barracks',
  // Commerce — market district
  merchant:     'sublocation-type.market-district',
  trader:       'sublocation-type.market-district',
  innkeeper:    'sublocation-type.market-district',
  smith:        'sublocation-type.market-district',
  appraiser:    'sublocation-type.market-district',
  // Scholars — library (towers/archives)
  scholar:      'sublocation-type.library',
  librarian:    'sublocation-type.library',
  researcher:   'sublocation-type.library',
  scribe:       'sublocation-type.library',
  // Court — throne room (capitals/castles only)
  noble:        'sublocation-type.throne-room',
  steward:      'sublocation-type.throne-room',
  herald:       'sublocation-type.throne-room',
} as const;

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
} as const;

export type NpcConstants = typeof NPC_CONSTANTS;
