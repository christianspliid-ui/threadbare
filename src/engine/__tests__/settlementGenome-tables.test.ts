import { describe, it, expect } from 'vitest';
import { SETTLEMENT_INFRASTRUCTURE } from '../settlementGenome/infrastructure';
import { SPHERE_SUBLOCATION_MENU } from '../settlementGenome/sphereMenu';
import { REACH_SUBLOCATION_MENU } from '../settlementGenome/reachMenu';
import { SETTLEMENT_ARCHETYPES } from '../settlementGenome/archetypes';
import { NPC_ROLES } from '../../types/npc';
import { REACH_DOMAINS } from '../../types/traits';

describe('settlementGenome data tables', () => {
  it('infrastructure sublocations all have valid tier', () => {
    const validTiers = new Set(['hamlet', 'town', 'city', 'capital']);
    for (const entry of SETTLEMENT_INFRASTRUCTURE) {
      expect(validTiers.has(entry.minTier), `${entry.id} has invalid tier ${entry.minTier}`).toBe(true);
    }
  });

  it('sphere menu covers all 12 spheres', () => {
    const keys = Object.keys(SPHERE_SUBLOCATION_MENU);
    expect(keys.length).toBe(12);
  });

  it('reach menu covers all 8 canonical reaches', () => {
    for (const reach of REACH_DOMAINS) {
      expect(REACH_SUBLOCATION_MENU).toHaveProperty(reach);
    }
  });

  it('all NPC roles in sphere menu exist in NpcRole union', () => {
    const roleSet = new Set(NPC_ROLES);
    for (const [sphere, def] of Object.entries(SPHERE_SUBLOCATION_MENU)) {
      for (const npc of (def as any).npcRoles) {
        expect(roleSet.has(npc.role), `${sphere} menu references unknown role "${npc.role}"`).toBe(true);
      }
    }
  });

  it('all NPC roles in reach menu exist in NpcRole union', () => {
    const roleSet = new Set(NPC_ROLES);
    for (const [reach, def] of Object.entries(REACH_SUBLOCATION_MENU)) {
      for (const npc of (def as any).npcRoles) {
        expect(roleSet.has(npc.role), `${reach} menu references unknown role "${npc.role}"`).toBe(true);
      }
    }
  });

  it('archetype IDs are unique', () => {
    const ids = SETTLEMENT_ARCHETYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('archetype priorities are unique', () => {
    const prios = SETTLEMENT_ARCHETYPES.map(a => a.priority);
    expect(new Set(prios).size).toBe(prios.length);
  });

  it('all archetype capstone NPC roles exist in NpcRole union', () => {
    const roleSet = new Set(NPC_ROLES);
    for (const arch of SETTLEMENT_ARCHETYPES) {
      for (const role of arch.capstoneNpcs) {
        expect(roleSet.has(role), `archetype ${arch.id} references unknown role "${role}"`).toBe(true);
      }
    }
  });
});
