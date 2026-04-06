import type { SublocationContribution, NpcContribution } from './types';

interface CultureBaseline {
  substitutions: { replaces: string; replacement: SublocationContribution }[];
  additions: SublocationContribution[];
  npcRoles: NpcContribution[];
  flavorTag: string;
}

export const CULTURE_BASELINE_MAP: Record<string, CultureBaseline> = {
  chaos: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.standing-stones', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.divination-tent', minTier: 'town', tags: ['arcane', 'cultural'] },
    ],
    npcRoles: [{ role: 'hermit', minTier: 'hamlet' }],
    flavorTag: 'wild tradition',
  },
  order: {
    substitutions: [
      { replaces: 'sublocation-type.town-hall', replacement: { id: 'sublocation-type.courthouse', minTier: 'town', tags: ['authority', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.archive', minTier: 'city', tags: ['scholarly', 'cultural'] },
    ],
    npcRoles: [{ role: 'scribe', minTier: 'town' }],
    flavorTag: 'civic tradition',
  },
  force: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.forge-shrine', minTier: 'hamlet', tags: ['religious', 'military', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.proving-ground', minTier: 'town', tags: ['military', 'cultural'] },
    ],
    npcRoles: [{ role: 'commander', minTier: 'town' }],
    flavorTag: 'warrior heritage',
  },
  life: {
    substitutions: [
      { replaces: 'sublocation-type.well-fountain', replacement: { id: 'sublocation-type.healing-spring', minTier: 'hamlet', tags: ['nature', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.herb-garden', minTier: 'town', tags: ['nature', 'cultural'] },
    ],
    npcRoles: [{ role: 'healer', minTier: 'hamlet' }],
    flavorTag: 'healer tradition',
  },
  mind: {
    substitutions: [
      { replaces: 'sublocation-type.town-hall', replacement: { id: 'sublocation-type.debate-hall', minTier: 'town', tags: ['scholarly', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.scriptorium', minTier: 'town', tags: ['scholarly', 'cultural'] },
    ],
    npcRoles: [{ role: 'scholar', minTier: 'town' }],
    flavorTag: 'scholastic tradition',
  },
  spirit: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.ancestor-shrine', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.spirit-grove', minTier: 'town', tags: ['religious', 'nature', 'cultural'] },
    ],
    npcRoles: [{ role: 'priest', minTier: 'hamlet' }],
    flavorTag: 'spirit-keeper tradition',
  },
  matter: {
    substitutions: [
      { replaces: 'sublocation-type.market-stall', replacement: { id: 'sublocation-type.stone-market', minTier: 'hamlet', tags: ['commerce', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.master-forge', minTier: 'town', tags: ['commerce', 'cultural'] },
    ],
    npcRoles: [{ role: 'mason', minTier: 'hamlet' }],
    flavorTag: 'craft heritage',
  },
  energy: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.storm-shrine', minTier: 'hamlet', tags: ['arcane', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.lightning-garden', minTier: 'city', tags: ['arcane', 'cultural'] },
    ],
    npcRoles: [{ role: 'researcher', minTier: 'town' }],
    flavorTag: 'storm tradition',
  },
  entropy: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.bone-chapel', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.plague-garden', minTier: 'town', tags: ['nature', 'cultural'] },
    ],
    npcRoles: [{ role: 'hermit', minTier: 'hamlet' }],
    flavorTag: 'death-keeper tradition',
  },
  time: {
    substitutions: [
      { replaces: 'sublocation-type.town-hall', replacement: { id: 'sublocation-type.chronicle-hall', minTier: 'town', tags: ['scholarly', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.sundial-garden', minTier: 'town', tags: ['scholarly', 'cultural'] },
    ],
    npcRoles: [{ role: 'scribe', minTier: 'town' }],
    flavorTag: 'chronicle tradition',
  },
  light: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.beacon-shrine', minTier: 'hamlet', tags: ['religious', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.mirror-garden', minTier: 'city', tags: ['arcane', 'cultural'] },
    ],
    npcRoles: [{ role: 'priest', minTier: 'hamlet' }],
    flavorTag: 'beacon tradition',
  },
  darkness: {
    substitutions: [
      { replaces: 'sublocation-type.temple-quarter', replacement: { id: 'sublocation-type.shadow-shrine', minTier: 'hamlet', tags: ['religious', 'underworld', 'cultural'] } },
    ],
    additions: [
      { id: 'sublocation-type.whispering-den', minTier: 'town', tags: ['underworld', 'cultural'] },
    ],
    npcRoles: [{ role: 'fence', minTier: 'town' }],
    flavorTag: 'shadow tradition',
  },
};
