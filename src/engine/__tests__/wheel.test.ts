import { describe, it, expect, beforeEach } from 'vitest';
import { getAgentWheelSlots } from '../wheel';
import { createEmptyEssencePool } from '../influence';
import type { EssencePool, InfluenceTier } from '../../types/influence';

describe('AgentWheel', () => {
  let pool: EssencePool;

  beforeEach(() => {
    pool = createEmptyEssencePool();
  });

  describe('getAgentWheelSlots', () => {
    it('returns 10 slots (9 actions + 1 center)', () => {
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      expect(slots).toHaveLength(10);
    });

    it('slot IDs match expected wheel layout', () => {
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const ids = slots.map((s) => s.id);
      expect(ids).toEqual([
        'scry',
        'dream',
        'persuade',
        'deceive',
        'intimidate',
        'inspire',
        'coincidence',
        'omen',
        'afflict_bless',
        'center',
      ]);
    });

    it('scry is always available when tier >= 1 and costs 0 essence', () => {
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const scrySlot = slots.find((s) => s.id === 'scry');
      expect(scrySlot).toBeDefined();
      expect(scrySlot!.available).toBe(true);
      expect(scrySlot!.essenceCost).toBe(0);
      expect(scrySlot!.lockedReason).toBe(null);
    });

    it('scry is unavailable at tier 0', () => {
      const slots = getAgentWheelSlots({
        tier: 0,
        pool,
        primarySphere: 'life',
      });
      const scrySlot = slots.find((s) => s.id === 'scry');
      expect(scrySlot).toBeDefined();
      expect(scrySlot!.available).toBe(false);
      expect(scrySlot!.lockedReason).toContain('Requires tier');
    });

    it('center is always available', () => {
      const slots = getAgentWheelSlots({
        tier: 0,
        pool,
        primarySphere: 'life',
      });
      const centerSlot = slots.find((s) => s.id === 'center');
      expect(centerSlot).toBeDefined();
      expect(centerSlot!.available).toBe(true);
      expect(centerSlot!.lockedReason).toBe(null);
      expect(centerSlot!.angleDeg).toBe(-1);
      expect(centerSlot!.type).toBe('info');
    });

    it('dream is available at tier 1 with enough essence', () => {
      pool.mind = 5; // dream affinities: ['mind', 'spirit']
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot).toBeDefined();
      expect(dreamSlot!.available).toBe(true);
      expect(dreamSlot!.essenceCost).toBe(1);
      expect(dreamSlot!.lockedReason).toBe(null);
    });

    it('dream is unavailable when tier too low', () => {
      pool.mind = 5;
      const slots = getAgentWheelSlots({
        tier: 0,
        pool,
        primarySphere: 'life',
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot!.available).toBe(false);
      expect(dreamSlot!.lockedReason).toContain('Requires tier');
    });

    it('dream is unavailable when cannot afford', () => {
      pool.mind = 0;
      pool.spirit = 0;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot!.available).toBe(false);
      expect(dreamSlot!.lockedReason).toContain('Not enough');
    });

    it('deceive is unavailable at tier 1 (requires tier 2)', () => {
      pool.mind = 10;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const deceiveSlot = slots.find((s) => s.id === 'deceive');
      expect(deceiveSlot!.available).toBe(false);
      expect(deceiveSlot!.lockedReason).toContain('Requires tier 2');
    });

    it('deceive is available at tier 2 with enough essence', () => {
      pool.mind = 10;
      const slots = getAgentWheelSlots({
        tier: 2,
        pool,
        primarySphere: 'life',
      });
      const deceiveSlot = slots.find((s) => s.id === 'deceive');
      expect(deceiveSlot!.available).toBe(true);
      expect(deceiveSlot!.essenceCost).toBe(2);
    });

    it('coincidence is unavailable at tier 2 (requires tier 3)', () => {
      pool.time = 10;
      const slots = getAgentWheelSlots({
        tier: 2,
        pool,
        primarySphere: 'life',
      });
      const coincidenceSlot = slots.find((s) => s.id === 'coincidence');
      expect(coincidenceSlot!.available).toBe(false);
      expect(coincidenceSlot!.lockedReason).toContain('Requires tier 3');
    });

    it('coincidence is available at tier 3 with enough essence', () => {
      pool.time = 10;
      const slots = getAgentWheelSlots({
        tier: 3,
        pool,
        primarySphere: 'life',
      });
      const coincidenceSlot = slots.find((s) => s.id === 'coincidence');
      expect(coincidenceSlot!.available).toBe(true);
      expect(coincidenceSlot!.essenceCost).toBe(4);
    });

    it('includes essenceCost and detectionRisk from INTERVENTION_DEFINITIONS', () => {
      pool.mind = 10;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot!.essenceCost).toBe(1); // dream base cost
      expect(dreamSlot!.detectionRisk).toBe(0.1); // dream detection risk
    });

    it('sets sphere to primarySphere when it is in affinities', () => {
      pool.spirit = 10;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'spirit', // dream affinities: ['mind', 'spirit']
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot!.sphere).toBe('spirit');
    });

    it('sets sphere to first affinity when primarySphere is not available', () => {
      pool.mind = 10;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'force', // dream affinities: ['mind', 'spirit']
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot!.sphere).toBe('mind'); // first affinity
    });

    it('includes correct angleDeg for each slot', () => {
      const slots = getAgentWheelSlots({
        tier: 3,
        pool,
        primarySphere: 'life',
      });
      const angleMap: Record<string, number> = {
        scry: 0,
        dream: 45,
        persuade: 75,
        deceive: 105,
        intimidate: 150,
        inspire: 180,
        coincidence: 225,
        omen: 255,
        afflict_bless: 300,
        center: -1,
      };
      for (const slot of slots) {
        expect(slot.angleDeg).toBe(angleMap[slot.id]);
      }
    });

    it('includes correct labels for each slot', () => {
      const slots = getAgentWheelSlots({
        tier: 3,
        pool,
        primarySphere: 'life',
      });
      const labelMap: Record<string, string> = {
        scry: 'Scry',
        dream: 'Dream',
        persuade: 'Persuade',
        deceive: 'Deceive',
        intimidate: 'Intimidate',
        inspire: 'Inspire',
        coincidence: 'Coincidence',
        omen: 'Omen',
        afflict_bless: 'Afflict/Bless',
        center: '',
      };
      for (const slot of slots) {
        expect(slot.label).toBe(labelMap[slot.id]);
      }
    });

    it('sets interventionType correctly', () => {
      const slots = getAgentWheelSlots({
        tier: 3,
        pool,
        primarySphere: 'life',
      });
      const typeMap: Record<string, string | null> = {
        scry: null,
        dream: 'dream',
        persuade: 'persuade',
        deceive: 'deceive',
        intimidate: 'intimidate',
        inspire: 'inspire_intervention',
        coincidence: 'coincidence',
        omen: 'omen',
        afflict_bless: 'afflict_bless',
        center: null,
      };
      for (const slot of slots) {
        expect(slot.interventionType).toBe(typeMap[slot.id]);
      }
    });

    it('sets type correctly (observation/intervention/info)', () => {
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const typeMap: Record<string, 'observation' | 'intervention' | 'info'> = {
        scry: 'observation',
        dream: 'intervention',
        persuade: 'intervention',
        deceive: 'intervention',
        intimidate: 'intervention',
        inspire: 'intervention',
        coincidence: 'intervention',
        omen: 'intervention',
        afflict_bless: 'intervention',
        center: 'info',
      };
      for (const slot of slots) {
        expect(slot.type).toBe(typeMap[slot.id]);
      }
    });

    it('marks as unavailable when cannot afford due to missing sphere', () => {
      pool.mind = 0;
      pool.spirit = 0;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'life',
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      expect(dreamSlot!.available).toBe(false);
      const lockedReason = dreamSlot!.lockedReason!;
      expect(lockedReason).toContain('Not enough');
      // The sphere mentioned in the error should be the chosen one
      expect(
        lockedReason.includes('mind') || lockedReason.includes('spirit')
      ).toBe(true);
    });

    it('all slots at tier 4 are available (except center already was)', () => {
      // Populate pool with enough essence for all interventions
      for (const sphere of ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'] as const) {
        pool[sphere] = 100;
      }
      const slots = getAgentWheelSlots({
        tier: 4,
        pool,
        primarySphere: 'life',
      });
      // All should be available at tier 4 with sufficient essence
      for (const slot of slots) {
        expect(slot.available).toBe(true);
      }
    });

    it('correctly identifies sphere for intervention with no affinity match', () => {
      // Even if primarySphere is not in affinities, uses first affinity
      pool.mind = 10;
      const slots = getAgentWheelSlots({
        tier: 1,
        pool,
        primarySphere: 'force',
      });
      const dreamSlot = slots.find((s) => s.id === 'dream');
      // dream affinities are ['mind', 'spirit'], so first is 'mind'
      expect(dreamSlot!.sphere).toBe('mind');
      expect(dreamSlot!.essenceCost).toBe(1);
    });
  });
});
