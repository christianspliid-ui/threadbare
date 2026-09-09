import { drawConsequenceHand } from './src/data/content-eval/consequenceDraw.ts';
import { ENCOUNTER_TEMPLATES } from './src/data/encounter-content.ts';
const ids = ['encounter.sharpen_blades','encounter.ward_the_camp','encounter.offer_small_prayer','encounter.rest_and_reflect','encounter.tend_to_wounds','encounter.scout_the_perimeter'];
for (const id of ids) {
  const t = (ENCOUNTER_TEMPLATES as any[]).find(x => x.id === id);
  if (!t) { console.log(id, 'NOT FOUND'); continue; }
  const reach = t.reach ?? t.reachPrimary;
  const rarityTier = t.rarityTier ?? 1;
  console.log(id, '| reach=', reach, '| tier=', rarityTier, '| hand=', drawConsequenceHand({ templateId: id, reach, rarityTier }).join(' + '));
}
