/**
 * Dump every god card with its `progression` block as JSON (THR-1811). Feeds
 * `scripts/god-card-progression-model.mjs`, so the iteration model and the game read
 * the same data — the templates. Run via `npm run model:god-cards`.
 */
import { godCards } from '../src/engine/godProgression';

const out = godCards().map(t => ({
  id: t.id,
  name: t.name,
  cost: t.essenceCost ?? 0,
  sphere: t.sphereAffinity ?? null,
  reach: t.reach,
  reqReach: t.requiresReach ?? null,
  rarity: t.rarityTier,
  progression: t.progression ?? null,
}));
console.log(JSON.stringify(out, null, 1));
