import { getUnifiedTemplateById } from '../src/data/unified-action-templates';
const ids = ['encounter.aid_refugees','encounter.barter_survival','encounter.mend_fishing_nets','encounter.town.bell_at_the_exchange','gold.famine.merchant_granaries','encounter.forage_provisions','encounter.black_market_deal','encounter.pickpocket','encounter.harvest_bounty','encounter.market_day_festival','encounter.festival_of_spheres','encounter.grand_tournament','tavern.drinking_contest','encounter.town.mill_lease_auction','encounter.town.tithe_barn_raid','encounter.realm.crowns_reckoning','encounter.caravan_deal','encounter.foreign_trader'];
for (const id of ids) {
  const t = getUnifiedTemplateById(id) as unknown as Record<string, unknown> | undefined;
  if (!t) { console.log(id, 'MISSING'); continue; }
  const gates = Object.keys(t).filter(k => /^requires|^required|prereq|locationSubtypes|eligib|condition/i.test(k)).map(k => `${k}=${String(JSON.stringify(t[k])).slice(0, 70)}`);
  console.log(id, gates.join(' | ') || '-');
}
