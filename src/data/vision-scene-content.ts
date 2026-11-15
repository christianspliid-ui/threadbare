/**
 * Vision scene content (THR-2226, plan THR-2204 slice 1).
 *
 * A journey vision reads where the First is and what they are doing before it picks
 * its moment (`readVisionScene`, `journeyEngine.ts`). These tables turn the world's
 * own words — an undertaking's verb, a location's subtype — into one of six
 * activities, and give each activity the clause the vision's setup opens with.
 *
 * Every undertaking verb and every location subtype maps to one activity; a test
 * fails on an unmapped one, so a new subtype cannot silently read as `rest`.
 */

import type { SceneActivity } from '../types/journeyEngine';
import type { UndertakingVerb } from '../types/strategicAction';

/** An active undertaking's verb → what the First is doing. */
export const VISION_ACTIVITY_BY_UNDERTAKING_VERB: Readonly<Record<UndertakingVerb, SceneActivity>> = {
  create: 'labour',
  change: 'labour',
  use: 'labour',
  control: 'court',
  destroy: 'conflict',
  observe: 'travel',
};

/** A location subtype (`LOCATION_SUBTYPES`) → what a mortal there is most likely doing. */
export const VISION_ACTIVITY_BY_PLACE_KIND: Readonly<Record<string, SceneActivity>> = {
  // settlement
  hamlet: 'labour',
  town: 'labour',
  city: 'court',
  capital: 'court',
  camp: 'rest',
  farmland: 'labour',
  // stronghold
  castle: 'court',
  fort: 'conflict',
  tower: 'court',
  // holy place
  shrine: 'worship',
  temple: 'worship',
  place_of_power: 'worship',
  // ruin
  ruins: 'travel',
  ruined_tower: 'travel',
  ruined_city: 'travel',
  ruined_village: 'travel',
  elder_ruin: 'travel',
  shipwreck: 'travel',
  ancient_vault: 'travel',
  sunken_treasury: 'travel',
  // wild
  wilderness: 'travel',
  wilderness_waypoint: 'travel',
  lair: 'conflict',
  cleared_lair: 'travel',
  monument: 'worship',
  cavern: 'travel',
  grove: 'worship',
  hot_spring: 'rest',
  nest: 'conflict',
  haunted_ground: 'worship',
  unexplored_poi: 'travel',
  oasis: 'rest',
  battleground: 'conflict',
  ancient_road: 'travel',
  bridge: 'travel',
  corruption_zone: 'conflict',
  // wonder
  healing_spring: 'worship',
  master_forge: 'labour',
  living_archive: 'labour',
  fey_crossing: 'worship',
  sacrifice_site: 'worship',
  convergence: 'conflict',
  time_scar: 'worship',
  standing_stones: 'worship',
  shadow_hollow: 'worship',
  ley_nexus: 'worship',
  golden_grove: 'labour',
  crystal_cavern: 'labour',
  glowcap_hollow: 'labour',
  // deposit
  mining: 'labour',
  gem_deposit: 'labour',
  iron_seep: 'labour',
  fossil_bed: 'labour',
  pearl_shoal: 'labour',
  herb_garden: 'labour',
};

/**
 * The clause a vision's setup opens with, per activity. `{place}` is the place's
 * name; with no place the `withoutPlace` form is used (plan § Empty slots, PC-3).
 */
export const VISION_SCENE_OPENERS: Readonly<Record<SceneActivity, { readonly withPlace: string; readonly withoutPlace: string }>> = {
  travel: { withPlace: 'On the road near {place},', withoutPlace: 'On the road,' },
  labour: { withPlace: 'At {their} work in {place},', withoutPlace: 'At {their} work,' },
  worship: { withPlace: 'At prayer in {place},', withoutPlace: 'At prayer,' },
  conflict: { withPlace: 'In the thick of the fighting at {place},', withoutPlace: 'In the thick of the fighting,' },
  court: { withPlace: 'Among the powerful at {place},', withoutPlace: 'Among the powerful,' },
  rest: { withPlace: 'In a quiet hour at {place},', withoutPlace: 'In a quiet hour,' },
};

// ─── The Ordeal's lines (THR-2226) ──────────────────────────────────

/** The price under a vision choice: "Costs 2 Mind". `{n}` the price, `{sphere}` the paying pool. */
export const VISION_PRICE_LINE = 'Costs {n} {sphere}';

/** Above an Ordeal's choices: what it decides. `{first}` the mortal's name. */
export const ORDEAL_WEIGHT_LINE = "This decides how {first}'s story ends.";

/** Above an Ordeal's choices: what it tests and how hard. Pronoun tokens: `{their}`. */
export const ORDEAL_STAKES_LINE = 'It tests {their} Star reach. A {difficultyWord} trial.';

/** What `{first}` reads as when the name is missing. */
export const ORDEAL_FIRST_FALLBACK = 'your First';
