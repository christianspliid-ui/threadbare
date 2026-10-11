// PROTOTYPE — THR-1794. Dumps every god-castable card (actorAffinities ∋ 'ascendant') for
// scripts/proto-card-tiers-1794.mjs. Never merged.
//   npx esbuild scripts/proto-card-catalog-1794.ts --bundle --platform=node --format=esm \
//     --outfile=.cache/proto-card-catalog-1794.mjs --log-level=error
//   node .cache/proto-card-catalog-1794.mjs > .cache/catalog-1794.json
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';

const out = (UNIFIED_ACTION_TEMPLATES as readonly any[])
  .filter(t => (t.actorAffinities ?? []).includes('ascendant'))
  .map(t => ({
    id: t.id, name: t.name, cost: t.essenceCost ?? 0, sphere: t.sphereAffinity ?? null, reach: t.reach,
    reqReach: t.requiresReach ?? null, rarity: t.rarityTier, attention: t.intrinsicTier, tray: t.trayTier ?? null,
    duration: t.durationMode ?? 'instant', scale: t.scale, crud: t.crudType, desc: (t.description ?? '').slice(0, 160),
  }));
console.log(JSON.stringify(out, null, 1));
