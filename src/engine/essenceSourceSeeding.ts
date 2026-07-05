/**
 * Latent essence-source worldgen seeding (THR-611 Slice 4 — Divine Economy).
 *
 * Slices 1–3 shipped the income substrate + the Build/Defend verbs + surfacing,
 * but the loop could only start from hosts the player *already controlled*.
 * This seeds a small number of **latent** `placeOfPower` sources — undiscovered
 * (`discoveredBy` undefined, fog-consistent) and uncontrolled — onto natural
 * wild-interest locations at worldgen, so the loop begins from **discovery**:
 * Find (reveal) → Claim (control) → Build → Defend.
 *
 * Determinism (NFP #3): placement is a seeded shuffle over eligible locations;
 * same seed + same graph → same placement. Additive (NFP #6): a latent source is
 * a hidden property bag with **no `controls` edge**, so it contributes zero income
 * and is invisible until the player Finds and Claims it — existing income and the
 * legacy migration path are untouched.
 */

import type { WorldGraph } from './graph';
import type { EssenceSource } from '../types/essenceSource';
import type { SphereName } from '../types';
import { SPHERE_NAMES } from '../types';
import { readEssenceSource } from './essenceSources';
import { getNodeSphereAffinity, getDominantSphere } from './sphereAffinity';
import {
  LATENT_SOURCE_SEED_COUNT,
  LATENT_SOURCE_HOST_SUBTYPES,
} from '../data/essence-sources';

/**
 * Seed up to `LATENT_SOURCE_SEED_COUNT` latent `placeOfPower` sources onto
 * eligible wild-interest locations. Each is typed by its **locale** (the host's
 * dominant sphere affinity), so a claimed ley-nexus pours *its own* sphere — the
 * "found source with character" the design asks for, distinct from a
 * player-consecrated shrine (which is typed to the *ascendant's* sphere).
 *
 * @param graph the world graph (mutated in place)
 * @param rng   a seeded PRNG (`() => number` in [0,1)) for deterministic placement
 * @returns the number of latent sources seeded
 */
export function seedLatentEssenceSources(
  graph: WorldGraph,
  rng: () => number,
): number {
  // Collect eligible hosts: a wild-interest subtype, no existing source bag,
  // and no incoming `controls` edge (uncontrolled). Nothing is player-controlled
  // this early, but the guard keeps the seeding correct if init order changes.
  // Eligible hosts: a wild-interest subtype with no existing source bag. We do
  // NOT exclude hosts that already carry a mundane `controls` edge — most wild
  // interest points sit inside some faction's or culture's territory, and a
  // *divine* essence source is orthogonal to mortal control. Claiming adds the
  // ascendant→host edge; income only ever walks the ascendant's own controls
  // edges, so a mortal controller of the host never leaks income to the player.
  const eligible = graph.getNodesByType('location').filter((loc) => {
    const subtype =
      (loc.properties.locationType as string | undefined) ??
      (loc.properties.locationSubtype as string | undefined);
    if (!subtype || !LATENT_SOURCE_HOST_SUBTYPES.includes(subtype)) return false;
    if (readEssenceSource(loc.properties)) return false; // already a source
    return true;
  });

  if (eligible.length === 0) return 0;

  // Deterministic Fisher–Yates shuffle, then take the target count.
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, Math.min(LATENT_SOURCE_SEED_COUNT, shuffled.length));

  let seeded = 0;
  for (const loc of picked) {
    const affinity = getNodeSphereAffinity(loc);
    // Type by locale; fail-soft to a deterministic sphere if the locale is neutral.
    const sphereAffinity: SphereName =
      (affinity ? getDominantSphere(affinity) : null) ??
      SPHERE_NAMES[Math.floor(rng() * SPHERE_NAMES.length)];

    const source: EssenceSource = {
      kind: 'placeOfPower',
      sphereAffinity,
      sanctity: 0,
      tier: 'dormant',
      // discoveredBy intentionally undefined → latent, hidden until Found.
      originTick: 0,
    };
    graph.updateNode(loc.id, {
      properties: { ...loc.properties, essenceSource: source },
    });
    seeded++;
  }

  return seeded;
}
