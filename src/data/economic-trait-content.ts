/**
 * Economic Trait Content Package — mastery/reputation/scar/condition traits
 * that emerge from economic activity patterns.
 *
 * Each trait is a graph node (type: 'trait') with TraitDefinitionProperties.
 * Acquisition is handled by phaseEconomicTraits; these are just definitions.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';

// ─── Acquisition Threshold Constants ────────────────────────────────────────

/** Minimum controlled trade routes required for trade-baron */
export const ECON_TRAIT_TRADE_BARON_MIN_ROUTES = 3;

/** Minimum ticks of guild membership for guild-sworn */
export const ECON_TRAIT_GUILD_SWORN_MIN_TICKS = 10;

/** Wealth floor that triggers bankrupt (dropped below this from above COMFORTABLE) */
export const ECON_TRAIT_BANKRUPT_WEALTH_FLOOR = 5;

/** Minimum successful Smuggler's Den encounters for smuggler trait */
export const ECON_TRAIT_SMUGGLER_MIN_ENCOUNTERS = 3;

/** Minimum active debt agreements for debt-laden */
export const ECON_TRAIT_DEBT_LADEN_MIN_DEBTS = 2;

/** Minimum successful fund-construction actions for patron */
export const ECON_TRAIT_PATRON_MIN_CONSTRUCTIONS = 2;

/** Minimum wealth-loss events for coin-cursed */
export const ECON_TRAIT_COIN_CURSED_MIN_LOSSES = 3;

// ─── Trait Definition Nodes ─────────────────────────────────────────────────

export const ECONOMIC_TRAIT_DEFINITIONS: GraphNode[] = [
  {
    id: 'trait.mastery.trade-baron',
    type: 'trait',
    name: 'Trade Baron',
    properties: {
      subcategory: 'mastery',
      description: 'Controls multiple trade routes with the wealth to back them.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { gold: 0.15 },
      tags: ['#gold', '#economic', '#trade', '#mastery'],
      flavorText: 'Commands trade routes like a general commands armies.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.cultural.guild-sworn',
    type: 'trait',
    name: 'Guild-Sworn',
    properties: {
      subcategory: 'cultural',
      description: 'Long-standing guild member whose identity is shaped by the institution.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { gold: 0.10, heart: 0.05 },
      tags: ['#gold', '#heart', '#economic', '#guild', '#cultural'],
      flavorText: 'Bears the mark of their guild in every transaction.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.scar.bankrupt',
    type: 'trait',
    name: 'Bankrupt',
    properties: {
      subcategory: 'scar',
      description: 'Lost everything — wealth collapsed from comfort to ruin.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { gold: -0.10 },
      tags: ['#gold', '#economic', '#scar', '#loss'],
      flavorText: 'Carries the hollow look of someone who once had everything.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.reputation.monopolist',
    type: 'trait',
    name: 'Monopolist',
    properties: {
      subcategory: 'reputation',
      description: 'Established total control over a market — feared more than respected.',
      importance: 0.8,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { gold: 0.20, heart: -0.10 },
      tags: ['#gold', '#heart', '#economic', '#reputation', '#monopoly'],
      flavorText: 'Whispered about in markets — feared more than respected.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.smuggler',
    type: 'trait',
    name: 'Smuggler',
    properties: {
      subcategory: 'mastery',
      description: 'Veteran of illicit trade who knows every back channel.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { shadow: 0.10, gold: 0.05 },
      decayPeriod: 30,
      tags: ['#shadow', '#gold', '#economic', '#mastery', '#smuggling'],
      flavorText: 'Knows every back door and unwatched dock.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.condition.debt-laden',
    type: 'trait',
    name: 'Debt-Laden',
    properties: {
      subcategory: 'condition',
      description: 'Burdened by multiple outstanding debts.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { gold: -0.05 },
      tags: ['#gold', '#economic', '#condition', '#debt'],
      flavorText: 'Owes more than they own; every coin is already spoken for.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.reputation.patron',
    type: 'trait',
    name: 'Patron',
    properties: {
      subcategory: 'reputation',
      description: 'Known for building up communities through funded construction.',
      importance: 0.6,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: { stone: 0.05, heart: 0.10 },
      tags: ['#stone', '#heart', '#economic', '#reputation', '#construction'],
      flavorText: 'Known for building up what others merely exploit.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.scar.coin-cursed',
    type: 'trait',
    name: 'Coin-Cursed',
    properties: {
      subcategory: 'scar',
      description: 'Repeatedly lost wealth to disruption and broken deals.',
      importance: 0.5,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: { gold: -0.05 },
      tags: ['#gold', '#economic', '#scar', '#loss'],
      flavorText: 'Money slips through their fingers like water through sand.',
    } as TraitDefinitionProperties,
  },
];
