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

  // Not yet generated — fallback to silhouette
  coming_of_age: null,
  brooding_warrior: null,
  fallen_noble: null,
  true_believer: null,
  schemer: null,
  wanderer: null,
  monster: null,
  folk_hero: null,
  reluctant_king: null,
  oathkeeper: null,
  poisoned_court: null,
  doomed_innocent: null,
  kingmaker: null,
  seeker: null,
  maker: null,
  noble_savage: null,
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
