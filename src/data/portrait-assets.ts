/**
 * Portrait Asset Registry — maps archetype IDs to portrait image paths.
 *
 * Portraits are pre-generated images stored in public/portraits/.
 * Each archetype maps to one portrait file. Archetypes without a portrait
 * fall back to null (components render the gradient silhouette).
 */

/** All 19 archetype IDs for reference */
export type ArchetypeId =
  | 'tragic_hero' | 'trickster' | 'coming_of_age'
  | 'brooding_warrior' | 'fallen_noble' | 'true_believer'
  | 'schemer' | 'wanderer' | 'monster'
  | 'folk_hero' | 'reluctant_king' | 'oathkeeper'
  | 'poisoned_court' | 'doomed_innocent' | 'old_power'
  | 'kingmaker' | 'seeker' | 'maker' | 'noble_savage';

/**
 * Map archetype ID → portrait image path (relative to public/).
 * null = no portrait yet, use gradient silhouette fallback.
 */
export const ARCHETYPE_PORTRAITS: Record<ArchetypeId, string | null> = {
  tragic_hero: '/portraits/tragic-hero.png',
  trickster: '/portraits/trickster.png',
  old_power: '/portraits/old-power.png',
  brooding_warrior: '/portraits/brooding-warrior.png',
  monster: '/portraits/monster.png',
  seeker: '/portraits/seeker.png',
  coming_of_age: '/portraits/coming-of-age.png',
  fallen_noble: '/portraits/fallen-noble.png',
  true_believer: '/portraits/true-believer.png',
  schemer: '/portraits/schemer.png',
  wanderer: '/portraits/wanderer.png',
  folk_hero: '/portraits/folk-hero.png',
  reluctant_king: '/portraits/reluctant-king.png',
  oathkeeper: '/portraits/oathkeeper.png',
  poisoned_court: '/portraits/poisoned-court.png',
  doomed_innocent: '/portraits/doomed-innocent.png',
  kingmaker: '/portraits/kingmaker.png',
  maker: '/portraits/maker.png',
  noble_savage: '/portraits/noble-savage.png',
};

/**
 * Get the portrait URL for an agent, or null if none available.
 * Knowledge-gating is NOT done here — components should check knowledge level
 * before calling this.
 */
export function getPortraitUrl(archetypeId: string | undefined): string | null {
  if (!archetypeId) return null;
  return ARCHETYPE_PORTRAITS[archetypeId as ArchetypeId] ?? null;
}

/**
 * Resolve a portrait URL from persisted agent properties.
 *
 * Meeting-generated agents can carry a bespoke portrait asset path that should
 * take precedence over the generic archetype portrait registry.
 */
export function getAgentPortraitUrlFromProperties(
  properties: Record<string, unknown> | undefined,
): string | null {
  if (!properties) return null;

  const portraitAssetPath = properties.portraitAssetPath;
  if (typeof portraitAssetPath === 'string' && portraitAssetPath.trim().length > 0) {
    return portraitAssetPath;
  }

  const narrativeArchetype = properties.narrativeArchetype;
  return typeof narrativeArchetype === 'string'
    ? getPortraitUrl(narrativeArchetype)
    : null;
}
