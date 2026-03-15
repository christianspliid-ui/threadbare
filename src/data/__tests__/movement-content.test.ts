import { describe, it, expect } from 'vitest';
import {
  TERRAIN_TAXES,
  LOCATION_ENTRY_TAXES,
  DISTANCE_DECAY_FACTOR,
  DEFAULT_LOCATION_ENTRY_TAX,
  MIN_EDGE_COST,
  getTerrainTax,
  getLocationEntryTax,
} from '../movement-content';
import type { TerrainType, LocationSubtype } from '../../types';

describe('movement-content', () => {
  describe('TERRAIN_TAXES', () => {
    it('exports TERRAIN_TAXES record', () => {
      expect(TERRAIN_TAXES).toBeDefined();
      expect(typeof TERRAIN_TAXES).toBe('object');
    });

    // Easy terrain (0)
    it('grassland terrain tax is 0', () => {
      expect(TERRAIN_TAXES.grassland).toBe(0);
    });

    it('farmland terrain tax is 0', () => {
      expect(TERRAIN_TAXES.farmland).toBe(0);
    });

    it('savanna terrain tax is 0', () => {
      expect(TERRAIN_TAXES.savanna).toBe(0);
    });

    it('steppe terrain tax is 0', () => {
      expect(TERRAIN_TAXES.steppe).toBe(0);
    });

    it('floodplain terrain tax is 0', () => {
      expect(TERRAIN_TAXES.floodplain).toBe(0);
    });

    it('coast terrain tax is 0', () => {
      expect(TERRAIN_TAXES.coast).toBe(0);
    });

    it('oasis terrain tax is 0', () => {
      expect(TERRAIN_TAXES.oasis).toBe(0);
    });

    // Light terrain (+0.5)
    it('temperate_forest terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.temperate_forest).toBe(0.5);
    });

    it('light_forest terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.light_forest).toBe(0.5);
    });

    it('tropical_forest terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.tropical_forest).toBe(0.5);
    });

    it('evergreen_forest terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.evergreen_forest).toBe(0.5);
    });

    it('hills terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.hills).toBe(0.5);
    });

    it('moor_bog terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.moor_bog).toBe(0.5);
    });

    it('tundra terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.tundra).toBe(0.5);
    });

    it('boreal_forest terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.boreal_forest).toBe(0.5);
    });

    it('forested_hills terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.forested_hills).toBe(0.5);
    });

    it('plateau terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.plateau).toBe(0.5);
    });

    it('coastal_shallows terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.coastal_shallows).toBe(0.5);
    });

    // Moderate terrain (+1)
    it('swamp terrain tax is 1', () => {
      expect(TERRAIN_TAXES.swamp).toBe(1);
    });

    it('marsh terrain tax is 1', () => {
      expect(TERRAIN_TAXES.marsh).toBe(1);
    });

    it('desert terrain tax is 1', () => {
      expect(TERRAIN_TAXES.desert).toBe(1);
    });

    it('rocky_desert terrain tax is 1', () => {
      expect(TERRAIN_TAXES.rocky_desert).toBe(1);
    });

    it('sand_dunes terrain tax is 1', () => {
      expect(TERRAIN_TAXES.sand_dunes).toBe(1);
    });

    it('dead_forest terrain tax is 1', () => {
      expect(TERRAIN_TAXES.dead_forest).toBe(1);
    });

    it('arctic terrain tax is 1', () => {
      expect(TERRAIN_TAXES.arctic).toBe(1);
    });

    it('snow_fields terrain tax is 1', () => {
      expect(TERRAIN_TAXES.snow_fields).toBe(1);
    });

    it('jungle terrain tax is 1', () => {
      expect(TERRAIN_TAXES.jungle).toBe(1);
    });

    it('badlands terrain tax is 1', () => {
      expect(TERRAIN_TAXES.badlands).toBe(1);
    });

    it('broken_lands terrain tax is 1', () => {
      expect(TERRAIN_TAXES.broken_lands).toBe(1);
    });

    it('great_home_trees terrain tax is 1', () => {
      expect(TERRAIN_TAXES.great_home_trees).toBe(1);
    });

    it('dense_forest terrain tax is 1', () => {
      expect(TERRAIN_TAXES.dense_forest).toBe(1);
    });

    // Heavy terrain (+1.5)
    it('mountains terrain tax is 1.5', () => {
      expect(TERRAIN_TAXES.mountains).toBe(1.5);
    });

    it('high_mountains terrain tax is 1.5', () => {
      expect(TERRAIN_TAXES.high_mountains).toBe(1.5);
    });

    it('volcano terrain tax is 1.5', () => {
      expect(TERRAIN_TAXES.volcano).toBe(1.5);
    });

    it('glacier terrain tax is 1.5', () => {
      expect(TERRAIN_TAXES.glacier).toBe(1.5);
    });

    // Mountain pass (special case +0.5)
    it('mountain_pass terrain tax is 0.5', () => {
      expect(TERRAIN_TAXES.mountain_pass).toBe(0.5);
    });

    // Water — impassable
    it('ocean terrain tax is Infinity', () => {
      expect(TERRAIN_TAXES.ocean).toBe(Infinity);
    });

    it('deep_ocean terrain tax is Infinity', () => {
      expect(TERRAIN_TAXES.deep_ocean).toBe(Infinity);
    });

    it('tropical_ocean terrain tax is Infinity', () => {
      expect(TERRAIN_TAXES.tropical_ocean).toBe(Infinity);
    });

    it('reef terrain tax is Infinity', () => {
      expect(TERRAIN_TAXES.reef).toBe(Infinity);
    });

    it('lake terrain tax is Infinity', () => {
      expect(TERRAIN_TAXES.lake).toBe(Infinity);
    });

    it('river terrain tax is Infinity', () => {
      expect(TERRAIN_TAXES.river).toBe(Infinity);
    });

    it('all terrain taxes are non-negative', () => {
      for (const [terrain, tax] of Object.entries(TERRAIN_TAXES)) {
        expect(tax).toBeGreaterThanOrEqual(0);
      }
    });

    it('all terrain keys are valid TerrainType values', () => {
      const validTerrains: TerrainType[] = [
        'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
        'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
        'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
        'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
        'swamp', 'marsh', 'moor_bog',
        'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
        'forested_hills',
        'great_home_trees', 'broken_lands', 'oasis',
        'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
        'arctic', 'snow_fields',
      ];
      for (const key of Object.keys(TERRAIN_TAXES)) {
        expect(validTerrains).toContain(key);
      }
    });
  });

  describe('LOCATION_ENTRY_TAXES', () => {
    it('exports LOCATION_ENTRY_TAXES record', () => {
      expect(LOCATION_ENTRY_TAXES).toBeDefined();
      expect(typeof LOCATION_ENTRY_TAXES).toBe('object');
    });

    // Free (0)
    it('wilderness location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.wilderness).toBe(0);
    });

    it('hamlet location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.hamlet).toBe(0);
    });

    it('camp location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.camp).toBe(0);
    });

    it('farmland location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.farmland).toBe(0);
    });

    it('battleground location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.battleground).toBe(0);
    });

    it('oasis location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.oasis).toBe(0);
    });

    it('unexplored_poi location entry tax is 0', () => {
      expect(LOCATION_ENTRY_TAXES.unexplored_poi).toBe(0);
    });

    // Light (0.5)
    it('town location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.town).toBe(0.5);
    });

    it('shrine location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.shrine).toBe(0.5);
    });

    it('ruins location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.ruins).toBe(0.5);
    });

    it('ruined_tower location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.ruined_tower).toBe(0.5);
    });

    it('ruined_village location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.ruined_village).toBe(0.5);
    });

    it('mining location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.mining).toBe(0.5);
    });

    it('tower location entry tax is 0.5', () => {
      expect(LOCATION_ENTRY_TAXES.tower).toBe(0.5);
    });

    // Moderate (1)
    it('city location entry tax is 1', () => {
      expect(LOCATION_ENTRY_TAXES.city).toBe(1);
    });

    it('castle location entry tax is 1', () => {
      expect(LOCATION_ENTRY_TAXES.castle).toBe(1);
    });

    it('ruined_city location entry tax is 1', () => {
      expect(LOCATION_ENTRY_TAXES.ruined_city).toBe(1);
    });

    // Heavy (1.5)
    it('capital location entry tax is 1.5', () => {
      expect(LOCATION_ENTRY_TAXES.capital).toBe(1.5);
    });

    it('fort location entry tax is 1.5', () => {
      expect(LOCATION_ENTRY_TAXES.fort).toBe(1.5);
    });

    it('temple location entry tax is 1.5', () => {
      expect(LOCATION_ENTRY_TAXES.temple).toBe(1.5);
    });

    it('all location taxes are non-negative', () => {
      for (const [location, tax] of Object.entries(LOCATION_ENTRY_TAXES)) {
        expect(tax).toBeGreaterThanOrEqual(0);
      }
    });

    it('all location keys are valid LocationSubtype values', () => {
      const validLocations: LocationSubtype[] = [
        'hamlet', 'town', 'city', 'capital',
        'camp', 'farmland',
        'castle', 'fort', 'tower', 'shrine', 'temple',
        'mining', 'ruins', 'ruined_tower', 'ruined_city', 'ruined_village',
        'battleground', 'oasis', 'unexplored_poi',
        'wilderness',
      ];
      for (const key of Object.keys(LOCATION_ENTRY_TAXES)) {
        expect(validLocations).toContain(key);
      }
    });
  });

  describe('Constants', () => {
    it('DISTANCE_DECAY_FACTOR is defined and positive', () => {
      expect(DISTANCE_DECAY_FACTOR).toBeDefined();
      expect(DISTANCE_DECAY_FACTOR).toBeGreaterThan(0);
    });

    it('DISTANCE_DECAY_FACTOR equals 0.15', () => {
      expect(DISTANCE_DECAY_FACTOR).toBe(0.15);
    });

    it('DEFAULT_LOCATION_ENTRY_TAX is defined and non-negative', () => {
      expect(DEFAULT_LOCATION_ENTRY_TAX).toBeDefined();
      expect(DEFAULT_LOCATION_ENTRY_TAX).toBeGreaterThanOrEqual(0);
    });

    it('DEFAULT_LOCATION_ENTRY_TAX equals 0', () => {
      expect(DEFAULT_LOCATION_ENTRY_TAX).toBe(0);
    });

    it('MIN_EDGE_COST is defined and positive', () => {
      expect(MIN_EDGE_COST).toBeDefined();
      expect(MIN_EDGE_COST).toBeGreaterThan(0);
    });

    it('MIN_EDGE_COST equals 0.5', () => {
      expect(MIN_EDGE_COST).toBe(0.5);
    });
  });

  describe('Helper functions', () => {
    it('getTerrainTax returns correct tax for known terrain', () => {
      expect(getTerrainTax('grassland')).toBe(0);
      expect(getTerrainTax('mountains')).toBe(1.5);
      expect(getTerrainTax('swamp')).toBe(1);
      expect(getTerrainTax('ocean')).toBe(Infinity);
    });

    it('getLocationEntryTax returns correct tax for known location', () => {
      expect(getLocationEntryTax('wilderness')).toBe(0);
      expect(getLocationEntryTax('city')).toBe(1);
      expect(getLocationEntryTax('capital')).toBe(1.5);
      expect(getLocationEntryTax('hamlet')).toBe(0);
    });

    it('getLocationEntryTax returns DEFAULT_LOCATION_ENTRY_TAX for unknown location', () => {
      const unknownLocation = 'unknown' as unknown as LocationSubtype;
      expect(getLocationEntryTax(unknownLocation)).toBe(DEFAULT_LOCATION_ENTRY_TAX);
    });
  });
});
