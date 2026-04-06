import type { ReachContributionDef } from './types';
import type { ReachDomain } from '../../types/traits';

export const REACH_SUBLOCATION_MENU: Record<ReachDomain, ReachContributionDef> = {
  iron: {
    sublocations: [
      { id: 'sublocation-type.armory',         minTier: 'town',    tags: ['military'] },
      { id: 'sublocation-type.war-council',    minTier: 'city',    tags: ['military', 'authority'] },
      { id: 'sublocation-type.siege-workshop', minTier: 'capital', tags: ['military'] },
    ],
    npcRoles: [
      { role: 'guard',         minTier: 'hamlet' },
      { role: 'commander',     minTier: 'town' },
      { role: 'quartermaster', minTier: 'city' },
    ],
  },
  gold: {
    sublocations: [
      { id: 'sublocation-type.counting-house', minTier: 'town',    tags: ['commerce'] },
      { id: 'sublocation-type.customs-house',  minTier: 'city',    tags: ['commerce'] },
      { id: 'sublocation-type.exchange',       minTier: 'capital', tags: ['commerce'] },
    ],
    npcRoles: [
      { role: 'merchant', minTier: 'hamlet' },
      { role: 'trader',   minTier: 'town' },
      { role: 'broker',   minTier: 'city' },
    ],
  },
  shadow: {
    sublocations: [
      { id: 'sublocation-type.hidden-passage', minTier: 'town',    tags: ['underworld'] },
      { id: 'sublocation-type.thieves-guild',  minTier: 'city',    tags: ['underworld'] },
      { id: 'sublocation-type.spy-network',    minTier: 'capital', tags: ['underworld'] },
    ],
    npcRoles: [
      { role: 'fence',     minTier: 'town' },
      { role: 'informant', minTier: 'city' },
      { role: 'spy',       minTier: 'capital' },
    ],
  },
  veil: {
    sublocations: [
      { id: 'sublocation-type.arcane-sanctum', minTier: 'town', tags: ['arcane'] },
      { id: 'sublocation-type.ward-stones',    minTier: 'city', tags: ['arcane'] },
    ],
    npcRoles: [
      { role: 'researcher', minTier: 'town' },
      { role: 'librarian',  minTier: 'city' },
    ],
  },
  heart: {
    sublocations: [
      { id: 'sublocation-type.hospice',        minTier: 'hamlet', tags: ['religious', 'nature'] },
      { id: 'sublocation-type.counselor-hall', minTier: 'town',   tags: ['cultural'] },
      { id: 'sublocation-type.embassy',        minTier: 'city',   tags: ['authority'] },
    ],
    npcRoles: [
      { role: 'healer',  minTier: 'hamlet' },
      { role: 'priest',  minTier: 'town' },
      { role: 'steward', minTier: 'city' },
    ],
  },
  eye: {
    sublocations: [
      { id: 'sublocation-type.scout-post',         minTier: 'hamlet', tags: ['military'] },
      { id: 'sublocation-type.observatory',        minTier: 'town',   tags: ['scholarly'] },
      { id: 'sublocation-type.intelligence-bureau',minTier: 'city',   tags: ['underworld', 'authority'] },
    ],
    npcRoles: [
      { role: 'scout',   minTier: 'hamlet' },
      { role: 'lookout', minTier: 'town' },
      { role: 'scholar', minTier: 'city' },
    ],
  },
  stone: {
    sublocations: [
      { id: 'sublocation-type.workshop',    minTier: 'hamlet', tags: ['commerce'] },
      { id: 'sublocation-type.guild-hall',  minTier: 'town',   tags: ['commerce'] },
      { id: 'sublocation-type.manufactory', minTier: 'city',   tags: ['commerce'] },
    ],
    npcRoles: [
      { role: 'smith',  minTier: 'hamlet' },
      { role: 'mason',  minTier: 'town' },
      { role: 'weaver', minTier: 'city' },
    ],
  },
  star: {
    sublocations: [
      { id: 'sublocation-type.tavern',      minTier: 'hamlet',  tags: ['cultural', 'commerce'] },
      { id: 'sublocation-type.theater',     minTier: 'city',    tags: ['cultural'] },
      { id: 'sublocation-type.throne-room', minTier: 'capital', tags: ['authority'] },
    ],
    npcRoles: [
      { role: 'entertainer', minTier: 'hamlet' },
      { role: 'herald',      minTier: 'town' },
      { role: 'noble',       minTier: 'city' },
    ],
  },
};
