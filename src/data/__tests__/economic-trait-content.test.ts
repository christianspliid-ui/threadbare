import { describe, it, expect } from 'vitest';
import {
  ECONOMIC_TRAIT_DEFINITIONS,
  ECON_TRAIT_TRADE_BARON_MIN_ROUTES,
  ECON_TRAIT_GUILD_SWORN_MIN_TICKS,
  ECON_TRAIT_BANKRUPT_WEALTH_FLOOR,
  ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS,
  ECON_TRAIT_DEBT_LADEN_MIN_DEBTS,
  ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS,
  ECON_TRAIT_COIN_CURSED_MIN_LOSSES,
} from '../economic-trait-content';
import type { TraitDefinitionProperties } from '../../types/traits';

describe('economic-trait-content', () => {
  it('exports trait definitions', () => {
    expect(ECONOMIC_TRAIT_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it('all definitions have type "trait"', () => {
    for (const def of ECONOMIC_TRAIT_DEFINITIONS) {
      expect(def.type).toBe('trait');
    }
  });

  it('all definitions have unique IDs', () => {
    const ids = ECONOMIC_TRAIT_DEFINITIONS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all definitions have valid subcategories', () => {
    const validCategories = new Set(['innate', 'mastery', 'reputation', 'scar', 'condition', 'destiny', 'cultural', 'bestowed']);
    for (const def of ECONOMIC_TRAIT_DEFINITIONS) {
      const props = def.properties as TraitDefinitionProperties;
      expect(validCategories.has(props.subcategory)).toBe(true);
    }
  });

  it('all definitions have non-empty flavorText', () => {
    for (const def of ECONOMIC_TRAIT_DEFINITIONS) {
      const props = def.properties as TraitDefinitionProperties;
      expect(props.flavorText.length).toBeGreaterThan(0);
    }
  });

  it('all definitions have domainContributions', () => {
    for (const def of ECONOMIC_TRAIT_DEFINITIONS) {
      const props = def.properties as TraitDefinitionProperties;
      expect(props.domainContributions).toBeDefined();
    }
  });

  it('all definitions have tags including #economic', () => {
    for (const def of ECONOMIC_TRAIT_DEFINITIONS) {
      const props = def.properties as TraitDefinitionProperties;
      expect(props.tags).toContain('#economic');
    }
  });

  describe('acquisition constants', () => {
    it('trade-baron requires positive number of routes', () => {
      expect(ECON_TRAIT_TRADE_BARON_MIN_ROUTES).toBeGreaterThan(0);
    });

    it('guild-sworn requires positive tick duration', () => {
      expect(ECON_TRAIT_GUILD_SWORN_MIN_TICKS).toBeGreaterThan(0);
    });

    it('bankrupt wealth floor is low positive number', () => {
      expect(ECON_TRAIT_BANKRUPT_WEALTH_FLOOR).toBeGreaterThan(0);
      expect(ECON_TRAIT_BANKRUPT_WEALTH_FLOOR).toBeLessThan(20);
    });

    it('smuggler requires positive encounter count', () => {
      expect(ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS).toBeGreaterThan(0);
    });

    it('debt-laden requires positive debt count', () => {
      expect(ECON_TRAIT_DEBT_LADEN_MIN_DEBTS).toBeGreaterThan(0);
    });

    it('patron requires positive construction count', () => {
      expect(ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS).toBeGreaterThan(0);
    });

    it('coin-cursed requires positive loss count', () => {
      expect(ECON_TRAIT_COIN_CURSED_MIN_LOSSES).toBeGreaterThan(0);
    });
  });

  describe('specific trait properties', () => {
    it('trade-baron: mastery, gold +15', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.mastery.trade-baron')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('mastery');
      expect(props.domainContributions.gold).toBe(0.15);
    });

    it('guild-sworn: cultural, gold +10, heart +5', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.cultural.guild-sworn')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('cultural');
      expect(props.domainContributions.gold).toBe(0.10);
      expect(props.domainContributions.heart).toBe(0.05);
    });

    it('bankrupt: scar, gold -10', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.scar.bankrupt')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('scar');
      expect(props.domainContributions.gold).toBe(-0.10);
    });

    it('monopolist: reputation, gold +20, heart -10', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.reputation.monopolist')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('reputation');
      expect(props.domainContributions.gold).toBe(0.20);
      expect(props.domainContributions.heart).toBe(-0.10);
    });

    it('smuggler: mastery, shadow +10, gold +5', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.mastery.smuggler')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('mastery');
      expect(props.domainContributions.shadow).toBe(0.10);
      expect(props.domainContributions.gold).toBe(0.05);
    });

    it('debt-laden: condition, gold -5', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.condition.debt-laden')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('condition');
      expect(props.domainContributions.gold).toBe(-0.05);
    });

    it('patron: reputation, stone +5, heart +10', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.reputation.patron')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('reputation');
      expect(props.domainContributions.stone).toBe(0.05);
      expect(props.domainContributions.heart).toBe(0.10);
    });

    it('coin-cursed: scar, gold -5', () => {
      const def = ECONOMIC_TRAIT_DEFINITIONS.find(d => d.id === 'trait.scar.coin-cursed')!;
      const props = def.properties as TraitDefinitionProperties;
      expect(props.subcategory).toBe('scar');
      expect(props.domainContributions.gold).toBe(-0.05);
    });
  });
});
