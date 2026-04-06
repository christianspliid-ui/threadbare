import type { SublocationContribution, NpcContribution } from './types';

export const SETTLEMENT_INFRASTRUCTURE: SublocationContribution[] = [
  { id: 'sublocation-type.inn',             minTier: 'hamlet',  tags: ['commerce'] },
  { id: 'sublocation-type.well-fountain',   minTier: 'hamlet',  tags: [] },
  { id: 'sublocation-type.market-stall',    minTier: 'hamlet',  tags: ['commerce'] },
  { id: 'sublocation-type.temple-quarter',  minTier: 'town',    tags: ['religious'] },
  { id: 'sublocation-type.market-district', minTier: 'town',    tags: ['commerce'] },
  { id: 'sublocation-type.gatehouse',       minTier: 'town',    tags: ['military'] },
  { id: 'sublocation-type.jail',            minTier: 'town',    tags: ['authority'] },
  { id: 'sublocation-type.town-hall',       minTier: 'town',    tags: ['authority'] },
  { id: 'sublocation-type.harbor',          minTier: 'town',    tags: ['commerce'], condition: 'coastal-hex' },
  { id: 'sublocation-type.grand-bazaar',    minTier: 'city',    tags: ['commerce'], condition: 'high-prosperity' },
  { id: 'sublocation-type.palace-keep',     minTier: 'capital', tags: ['authority', 'military'] },
  { id: 'sublocation-type.dungeon',         minTier: 'capital', tags: ['authority'] },
];

export const INFRASTRUCTURE_NPCS: NpcContribution[] = [
  { role: 'innkeeper', minTier: 'hamlet' },
  { role: 'elder',     minTier: 'hamlet' },
  { role: 'guard',     minTier: 'town' },
];
