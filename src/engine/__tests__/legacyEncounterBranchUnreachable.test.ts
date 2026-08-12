/**
 * The legacy `encounterProgress` branch is unreachable — and this pins why (THR-1069).
 *
 * `phaseAgentDecision` chooses between the two encounter pipelines with:
 *
 * ```ts
 * const template        = getAnyEncounterById(sel.entry.templateId);
 * const unifiedTemplate = getUnifiedTemplateById(sel.entry.templateId);
 * if (template || unifiedTemplate) {
 *   if (unifiedTemplate) { ...push a UnifiedAction... }
 *   else if (template)   { ...push legacy EncounterProgress... }
 * }
 * ```
 *
 * `getUnifiedTemplateById` is `index.get(id) ?? getAnyEncounterById(id)` — a strict
 * superset of `getAnyEncounterById`. So whenever `template` is truthy `unifiedTemplate`
 * is truthy too, the first arm always wins, and the `else if` can never be entered.
 * Nothing in production has written `state.encounterProgress` since; a 60-tick CLI
 * sweep (`--seed 42 --map medium`) recorded 52 unified actions across 33 distinct
 * templates and **zero** `encounterProgress` entries.
 *
 * That is what makes the legacy exemption in `isEncounterNotificationOverdue` correct:
 * there is no legacy notification to expire, because there is no legacy progress record
 * to build one from. THR-1068 asserted the exemption defensively ("expiring one would
 * re-emit next tick") without establishing whether the branch could fire at all; this
 * file closes that silence with the proof rather than leaving the next reader to
 * re-derive it a third time.
 *
 * **Why a test and not a deletion.** The superset relation rests entirely on the
 * trailing `?? getAnyEncounterById(id)` fallback, and 36 encounter-pool ids resolve
 * through *only* that fallback (they are in no unified pool). Delete the fallback and
 * those ids flip `unifiedTemplate` to undefined while `template` stays truthy — the
 * dead branch goes live for exactly them, and the churn loop THR-1069 describes
 * (expire → drop out of the dedup set → re-emit → expire) becomes real. The branch is
 * dead but cheaply resurrectable, so the durable guard is a test that fails the moment
 * it resurrects, not a prune that leaves the resurrection path open.
 */

import { describe, expect, it } from 'vitest';

import { ENCOUNTER_TEMPLATES, getAnyEncounterById } from '../../data/encounter-content';
import { ALL_SOCIAL_TEMPLATES } from '../../data/social-encounter-content';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../data/faction-encounter-content';
import { MERCENARY_ENCOUNTER_TEMPLATES } from '../../data/mercenary-encounter-content';
import { ARMY_ENCOUNTER_TEMPLATES } from '../../data/army-encounter-content';
import { MONSTER_ENCOUNTER_TEMPLATES } from '../../data/monster-encounter-content';
import { BORDERLAND_ENCOUNTER_TEMPLATES } from '../../data/borderland-encounter-content';
import { SECRET_DISCOVERY_ENCOUNTER_TEMPLATES } from '../../data/secret-encounter-content';
import { ASCENDANT_POOL_BEAT_TEMPLATES } from '../../data/ascendant-pool-beat-templates';
import {
  UNIFIED_ACTION_TEMPLATES,
  getUnifiedTemplateById,
} from '../../data/unified-action-templates';

/**
 * Every pool `getAnyEncounterById` consults, in its own resolution order.
 *
 * A pool added to `getAnyEncounterById` without being added here narrows this test's
 * coverage rather than breaking it — which is why the population floor below is an
 * assertion and not a comment.
 */
const LEGACY_ENCOUNTER_POOLS: ReadonlyArray<readonly { id: string }[]> = [
  ENCOUNTER_TEMPLATES,
  ALL_SOCIAL_TEMPLATES,
  FACTION_ENCOUNTER_TEMPLATES,
  MERCENARY_ENCOUNTER_TEMPLATES,
  ARMY_ENCOUNTER_TEMPLATES,
  MONSTER_ENCOUNTER_TEMPLATES,
  BORDERLAND_ENCOUNTER_TEMPLATES,
  SECRET_DISCOVERY_ENCOUNTER_TEMPLATES,
];

/**
 * Measured 2026-08-12: 260 distinct ids across the eight pools. The floor sits well
 * under that so ordinary content churn does not trip it, while still failing loudly if
 * a refactor empties the pools and turns every assertion below into a vacuous pass over
 * an empty set.
 */
const MIN_POOL_POPULATION = 200;

/** Ids resolvable only through `getUnifiedTemplateById`'s trailing fallback. Measured 36. */
const MIN_FALLBACK_DEPENDENT_IDS = 1;

function collectLegacyPoolIds(): string[] {
  const ids = new Set<string>();
  for (const pool of LEGACY_ENCOUNTER_POOLS) {
    for (const template of pool) ids.add(template.id);
  }
  return [...ids];
}

describe('legacy encounterProgress branch — unreachable by construction (THR-1069)', () => {
  const legacyPoolIds = collectLegacyPoolIds();

  it('samples a non-empty encounter population, so the assertions below cannot pass vacuously', () => {
    expect(legacyPoolIds.length).toBeGreaterThanOrEqual(MIN_POOL_POPULATION);
  });

  it('resolves every legacy-pool id through getUnifiedTemplateById, so the else-if arm is dead', () => {
    // This is `phaseAgentDecision`'s branch condition, evaluated over the whole pool
    // set: an id reaching the legacy arm must satisfy `template && !unifiedTemplate`.
    const wouldTakeLegacyArm = legacyPoolIds.filter(
      id => getAnyEncounterById(id) !== undefined && getUnifiedTemplateById(id) === undefined,
    );

    expect(wouldTakeLegacyArm).toEqual([]);
  });

  it('depends on the trailing getAnyEncounterById fallback for ids in no unified pool', () => {
    // The index `getUnifiedTemplateById` consults first is module-private; it is built
    // from these two exported pools, so membership here reproduces it. Ids outside it
    // resolve only because of the `?? getAnyEncounterById(id)` fallback — remove that
    // and the legacy arm becomes reachable for exactly this set.
    const indexedIds = new Set([
      ...UNIFIED_ACTION_TEMPLATES.map(t => t.id),
      ...ASCENDANT_POOL_BEAT_TEMPLATES.map(t => t.id),
    ]);

    const fallbackDependent = legacyPoolIds.filter(id => !indexedIds.has(id));

    expect(fallbackDependent.length).toBeGreaterThanOrEqual(MIN_FALLBACK_DEPENDENT_IDS);
    // Every one of them still resolves — via the fallback, which is the point.
    for (const id of fallbackDependent) {
      expect(getUnifiedTemplateById(id)).toBeDefined();
    }
  });
});
