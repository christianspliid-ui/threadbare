import { describe, it, expect } from 'vitest';
import {
  SPOTLIGHT_TIERS,
  NPC_ROLES,
  NPC_CONSTANTS,
  LOCATION_ROLE_ROSTERS,
  FACTION_ROLE_ROSTERS,
  NPC_NAME_POOL,
  NPC_ROLE_REACH_MAP,
} from '../npc';
import type { SpotlightTier, NpcRole, RoleRosterEntry } from '../npc';
import { REACH_DOMAINS } from '../traits';

describe('SpotlightTier', () => {
  it('has exactly three tiers', () => {
    expect(SPOTLIGHT_TIERS).toHaveLength(3);
  });

  it('includes ambient, notable, and spotlight', () => {
    expect(SPOTLIGHT_TIERS).toContain('ambient');
    expect(SPOTLIGHT_TIERS).toContain('notable');
    expect(SPOTLIGHT_TIERS).toContain('spotlight');
  });

  it('type is assignable from string literals', () => {
    const tier: SpotlightTier = 'ambient';
    expect(tier).toBe('ambient');
  });
});

describe('NpcRole', () => {
  it('includes key roles', () => {
    expect(NPC_ROLES).toContain('innkeeper');
    expect(NPC_ROLES).toContain('guard');
    expect(NPC_ROLES).toContain('merchant');
    expect(NPC_ROLES).toContain('healer');
    expect(NPC_ROLES).toContain('priest');
  });

  it('defines more than 10 roles', () => {
    expect(NPC_ROLES.length).toBeGreaterThan(10);
  });

  it('includes all expected roles', () => {
    const expected: NpcRole[] = [
      'innkeeper', 'guard', 'merchant', 'healer', 'priest', 'acolyte',
      'pilgrim', 'scholar', 'spy', 'noble', 'entertainer', 'faction_rep',
      'commander', 'quartermaster', 'scout', 'hermit', 'ranger', 'wanderer',
      'clerk', 'appraiser', 'fence', 'informant', 'lookout', 'steward',
      'herald', 'attendant', 'scribe', 'librarian', 'researcher', 'weaver',
      'mason', 'brewer', 'trader', 'guard_captain', 'elder', 'smith',
    ];
    for (const role of expected) {
      expect(NPC_ROLES).toContain(role);
    }
  });

  it('has exactly 56 roles (all reach permutations)', () => {
    expect(NPC_ROLES.length).toBe(56);
  });

  it('includes all 19 new roles', () => {
    const newRoles: NpcRole[] = [
      'mercenary', 'spellsword', 'paladin', 'alchemist', 'assassin', 'burglar',
      'hexer', 'warmage', 'enchanter', 'illusionist', 'bard', 'marshal',
      'sage', 'monk', 'hunter', 'warrior_priest', 'chaplain', 'exorcist', 'oracle',
    ];
    for (const role of newRoles) {
      expect(NPC_ROLES).toContain(role);
    }
  });
});

describe('RoleRosterEntry', () => {
  it('LOCATION_ROLE_ROSTERS has expected location subtypes', () => {
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('hamlet');
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('town');
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('city');
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('temple');
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('military_outpost');
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('wilderness');
  });

  it('hamlet roster has innkeeper at chance 1.0', () => {
    const entry = LOCATION_ROLE_ROSTERS.hamlet.find(
      (e: RoleRosterEntry) => e.role === 'innkeeper'
    );
    expect(entry).toBeDefined();
    expect(entry?.chance).toBe(1.0);
  });

  it('city roster includes noble and spy', () => {
    const noble = LOCATION_ROLE_ROSTERS.city.find(
      (e: RoleRosterEntry) => e.role === 'noble'
    );
    const spy = LOCATION_ROLE_ROSTERS.city.find(
      (e: RoleRosterEntry) => e.role === 'spy'
    );
    expect(noble).toBeDefined();
    expect(spy).toBeDefined();
  });

  it('LOCATION_ROLE_ROSTERS includes castle and shrine', () => {
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('castle');
    expect(LOCATION_ROLE_ROSTERS).toHaveProperty('shrine');
  });

  it('FACTION_ROLE_ROSTERS has expected faction types', () => {
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('merchant_guild');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('military_order');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('religious_order');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('thieves_guild');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('noble_house');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('scholarly_circle');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('artisan_guild');
  });

  it('FACTION_ROLE_ROSTERS includes 5 new faction types', () => {
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('arcane_order');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('holy_order');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('mercenary_band');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('ranger_lodge');
    expect(FACTION_ROLE_ROSTERS).toHaveProperty('underworld');
  });

  it('thieves_guild has fence at chance 1.0', () => {
    const entry = FACTION_ROLE_ROSTERS.thieves_guild.find(
      (e: RoleRosterEntry) => e.role === 'fence'
    );
    expect(entry).toBeDefined();
    expect(entry?.chance).toBe(1.0);
  });

  it('all roster entries have valid roles', () => {
    const allRosters = [
      ...Object.values(LOCATION_ROLE_ROSTERS),
      ...Object.values(FACTION_ROLE_ROSTERS),
    ].flat() as RoleRosterEntry[];

    for (const entry of allRosters) {
      expect(NPC_ROLES).toContain(entry.role);
      expect(entry.chance).toBeGreaterThan(0);
      expect(entry.chance).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('NPC_CONSTANTS', () => {
  it('has expected promotion threshold values', () => {
    expect(NPC_CONSTANTS.NOTABLE_THRESHOLD).toBe(10);
    expect(NPC_CONSTANTS.SPOTLIGHT_THRESHOLD).toBe(25);
    expect(NPC_CONSTANTS.SPOTLIGHT_MIN_EDGES).toBe(3);
  });

  it('has essence promotion constants', () => {
    expect(NPC_CONSTANTS.PROMOTE_ESSENCE_BASE).toBe(8);
    expect(NPC_CONSTANTS.PROMOTE_IMPORTANCE_DISCOUNT).toBe(0.5);
  });

  it('has importance increment constants defined', () => {
    expect(NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION).toBeDefined();
    expect(NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE).toBeDefined();
    expect(NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED).toBeDefined();
    expect(NPC_CONSTANTS.IMPORTANCE_TRAIT_GAINED).toBeDefined();
    expect(NPC_CONSTANTS.IMPORTANCE_LOCATION_CONTESTED).toBeDefined();
  });

  it('importance constants have correct values', () => {
    expect(NPC_CONSTANTS.IMPORTANCE_PLAYER_ACTION).toBe(3);
    expect(NPC_CONSTANTS.IMPORTANCE_ENCOUNTER_REFERENCE).toBe(1);
    expect(NPC_CONSTANTS.IMPORTANCE_EDGE_CREATED).toBe(2);
    expect(NPC_CONSTANTS.IMPORTANCE_TRAIT_GAINED).toBe(4);
    expect(NPC_CONSTANTS.IMPORTANCE_LOCATION_CONTESTED).toBe(1);
  });

  it('has NPC population cap constants', () => {
    expect(NPC_CONSTANTS.MAX_NPCS_HAMLET).toBe(4);
    expect(NPC_CONSTANTS.MAX_NPCS_TOWN).toBe(8);
    expect(NPC_CONSTANTS.MAX_NPCS_CITY).toBe(15);
    expect(NPC_CONSTANTS.WILDERNESS_NPC_CHANCE).toBe(0.3);
  });
});

describe('NPC_NAME_POOL', () => {
  it('has at least 48 names', () => {
    expect(NPC_NAME_POOL.length).toBeGreaterThanOrEqual(48);
  });

  it('contains only non-empty strings', () => {
    for (const name of NPC_NAME_POOL) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate names', () => {
    const unique = new Set(NPC_NAME_POOL);
    expect(unique.size).toBe(NPC_NAME_POOL.length);
  });
});

describe('NPC_ROLE_REACH_MAP', () => {
  it('has an entry for every NPC role', () => {
    for (const role of NPC_ROLES) {
      expect(NPC_ROLE_REACH_MAP).toHaveProperty(role);
    }
  });

  it('every entry has valid primary and secondary reaches', () => {
    for (const role of NPC_ROLES) {
      const aff = NPC_ROLE_REACH_MAP[role];
      expect(REACH_DOMAINS).toContain(aff.primary);
      expect(REACH_DOMAINS).toContain(aff.secondary);
    }
  });

  it('primary and secondary are always different', () => {
    for (const role of NPC_ROLES) {
      const aff = NPC_ROLE_REACH_MAP[role];
      expect(aff.primary).not.toBe(aff.secondary);
    }
  });

  it('covers all 56 unique (primary, secondary) permutations', () => {
    const combos = new Set<string>();
    for (const role of NPC_ROLES) {
      const aff = NPC_ROLE_REACH_MAP[role];
      combos.add(`${aff.primary}+${aff.secondary}`);
    }
    // 8 reaches × 7 secondaries = 56 permutations
    expect(combos.size).toBe(56);
  });

  it('each primary reach has exactly 7 roles', () => {
    const counts = new Map<string, number>();
    for (const role of NPC_ROLES) {
      const p = NPC_ROLE_REACH_MAP[role].primary;
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    for (const domain of REACH_DOMAINS) {
      expect(counts.get(domain)).toBe(7);
    }
  });
});
