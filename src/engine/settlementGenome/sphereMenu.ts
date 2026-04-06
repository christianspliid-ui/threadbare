import type { SphereContributionDef } from './types';
import type { SphereName } from '../../types/index';
import type { NpcRole } from '../../types/npc';

export const SPHERE_SUBLOCATION_MENU: Partial<Record<SphereName, SphereContributionDef>> = {
  force: {
    sublocations: [
      { id: 'sublocation-type.smithy',    minTier: 'hamlet',  tags: ['military'] },
      { id: 'sublocation-type.barracks',  minTier: 'town',    tags: ['military'] },
      { id: 'sublocation-type.arena',     minTier: 'city',    tags: ['military'] },
    ],
    npcRoles: [
      { role: 'smith',     minTier: 'hamlet' },
      { role: 'guard',     minTier: 'town' },
      { role: 'commander', minTier: 'city' },
    ],
  },
  matter: {
    sublocations: [
      { id: 'sublocation-type.mine-entrance', minTier: 'hamlet', tags: ['commerce'] },
      { id: 'sublocation-type.smelter',       minTier: 'town',   tags: ['commerce'] },
      { id: 'sublocation-type.mason-yard',    minTier: 'city',   tags: ['commerce'] },
    ],
    npcRoles: [
      { role: 'mason', minTier: 'hamlet' },
      { role: 'smith', minTier: 'town' },
    ],
  },
  energy: {
    sublocations: [
      { id: 'sublocation-type.lightning-rod', minTier: 'town', tags: ['arcane'] },
      { id: 'sublocation-type.power-nexus',   minTier: 'city', tags: ['arcane'] },
    ],
    npcRoles: [
      { role: 'researcher', minTier: 'town' },
      { role: 'scholar',    minTier: 'city' },
    ],
  },
  life: {
    sublocations: [
      { id: 'sublocation-type.herbalist-hut',  minTier: 'hamlet', tags: ['nature'] },
      { id: 'sublocation-type.healing-house',  minTier: 'town',   tags: ['nature', 'religious'] },
      { id: 'sublocation-type.conservatory',   minTier: 'city',   tags: ['nature', 'scholarly'] },
    ],
    npcRoles: [
      { role: 'healer', minTier: 'hamlet' },
      { role: 'priest', minTier: 'town' },
    ],
  },
  mind: {
    sublocations: [
      { id: 'sublocation-type.study',   minTier: 'hamlet', tags: ['scholarly'] },
      { id: 'sublocation-type.library', minTier: 'town',   tags: ['scholarly'] },
      { id: 'sublocation-type.academy', minTier: 'city',   tags: ['scholarly'] },
    ],
    npcRoles: [
      { role: 'scholar',   minTier: 'town' },
      { role: 'librarian', minTier: 'city' },
    ],
  },
  spirit: {
    sublocations: [
      { id: 'sublocation-type.shrine',         minTier: 'hamlet', tags: ['religious'] },
      { id: 'sublocation-type.spirit-house',   minTier: 'town',   tags: ['religious', 'arcane'] },
      { id: 'sublocation-type.oracle-chamber', minTier: 'city',   tags: ['religious', 'arcane'] },
    ],
    npcRoles: [
      { role: 'priest', minTier: 'hamlet' },
      { role: 'hermit', minTier: 'town' },
    ],
  },
  time: {
    sublocations: [
      { id: 'sublocation-type.sundial-square', minTier: 'hamlet', tags: ['cultural'] },
      { id: 'sublocation-type.clocktower',     minTier: 'city',   tags: ['cultural', 'scholarly'] },
    ],
    npcRoles: [
      { role: 'scribe',  minTier: 'town' },
      { role: 'scholar', minTier: 'city' },
    ],
  },
  entropy: {
    sublocations: [
      { id: 'sublocation-type.boneyard',    minTier: 'hamlet', tags: ['religious'] },
      { id: 'sublocation-type.plague-ward', minTier: 'town',   tags: ['religious'] },
    ],
    npcRoles: [
      { role: 'healer', minTier: 'hamlet' },
      { role: 'hermit', minTier: 'town' },
    ],
  },
  chaos: {
    sublocations: [
      { id: 'sublocation-type.gambling-den', minTier: 'town', tags: ['underworld', 'commerce'] },
      { id: 'sublocation-type.fighting-pit', minTier: 'city', tags: ['underworld', 'military'] },
    ],
    npcRoles: [
      { role: 'entertainer', minTier: 'town' },
      { role: 'fence',       minTier: 'city' },
    ],
  },
  order: {
    sublocations: [
      { id: 'sublocation-type.courthouse', minTier: 'town',    tags: ['authority'] },
      { id: 'sublocation-type.archive',    minTier: 'city',    tags: ['authority', 'scholarly'] },
      { id: 'sublocation-type.high-court', minTier: 'capital', tags: ['authority'] },
    ],
    npcRoles: [
      { role: 'scribe', minTier: 'town' },
      { role: 'noble',  minTier: 'city' },
    ],
  },
  light: {
    sublocations: [
      { id: 'sublocation-type.watchtower',   minTier: 'hamlet', tags: ['military'] },
      { id: 'sublocation-type.beacon-tower', minTier: 'city',   tags: ['military'] },
    ],
    npcRoles: [
      { role: 'lookout', minTier: 'hamlet' },
      { role: 'guard',   minTier: 'city' },
    ],
  },
  darkness: {
    sublocations: [
      { id: 'sublocation-type.smuggler-den', minTier: 'town', tags: ['underworld'] },
      { id: 'sublocation-type.black-market', minTier: 'city', tags: ['underworld', 'commerce'] },
    ],
    npcRoles: [
      { role: 'fence',     minTier: 'town' },
      { role: 'informant', minTier: 'city' },
    ],
  },
};

export const POSITION_MODIFIERS: Record<'heartland' | 'borderland', {
  bonusSublocations: { id: string; tags: string[] }[];
  bonusNpcs: NpcRole[];
}> = {
  borderland: {
    bonusSublocations: [
      { id: 'sublocation-type.city-walls', tags: ['military', 'borderlands'] },
      { id: 'sublocation-type.watchtower', tags: ['military', 'borderlands'] },
    ],
    bonusNpcs: ['guard', 'scout'],
  },
  heartland: {
    bonusSublocations: [
      { id: 'sublocation-type.festival-ground', tags: ['cultural'] },
      { id: 'sublocation-type.granary',         tags: ['commerce'] },
    ],
    bonusNpcs: ['entertainer', 'innkeeper'],
  },
};
