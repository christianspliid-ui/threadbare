/**
 * Gap-fill tests: Siege regional encounter generation (DEFERRED).
 *
 * Plan 12-05 requires: generateRegionalEncounters spawns encounters for actors
 * within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes of the siege (call_for_aid,
 * join_attackers, smuggle_supplies, negotiate_terms).
 *
 * Status: DEFERRED — the function signature is exported from siegeResolution.ts
 * but the regional encounter dispatch (spawning child encounters on nearby actors)
 * is not yet implemented. Siege pacing, attrition, and threshold resolution are
 * tested in siegeResolution.test.ts.
 *
 * These tests document the expected contract when the feature is implemented.
 */

import { describe, it } from 'vitest';

describe('generateRegionalEncounters — siege pull mechanics (DEFERRED)', () => {
  it.todo(
    'finds no eligible actors when no actors are within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes',
  );

  it.todo(
    'spawns siege.regional.call_for_aid for allied faction actors within range',
  );

  it.todo(
    'spawns siege.regional.smuggle_supplies for Shadow-capable agents within range',
  );

  it.todo(
    'spawns siege.regional.negotiate_terms for Heart-capable agents within range',
  );

  it.todo(
    'does not spawn duplicate regional encounters for the same actor in the same siege',
  );

  it.todo(
    'does not spawn encounters for actors already participating in a battle',
  );
});
