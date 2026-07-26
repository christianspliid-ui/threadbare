/**
 * THR-811 — the Stage-3 prerequisite gates must be able to resolve every template the
 * encounter cache can register.
 *
 * `filterByPrerequisites` used `getAnyEncounterById`, which covers only the encounter
 * pools. 43 of the 213 template ids the cache can register resolve instead through
 * `UNIFIED_ACTION_TEMPLATES` (the `CACHE_REGISTERED_REGIONAL_TEMPLATES` guild tail, the
 * THR-452 branching quest families, the `reputation.*` / sphere-themed set-pieces), so
 * every `template?.` gate in that loop passed them unchecked — a `requiredTraits` or
 * `minGroupMembers` declaration on any of them was dead on arrival.
 *
 * Three things are pinned here:
 *   1. Coverage — the lookup resolves every cache-registrable id, and the old one did
 *      not (asserted both ways, so the coverage test cannot go vacuous).
 *   2. No newly-excluded content — for the ids both lookups resolve, the objects differ
 *      only by `withGroupAffinity`'s appended `'group'`, and none becomes group-exclusive.
 *      This is the polarity trap: `actorAffinities` is opt-in, so newly resolving a
 *      template must not flip an absent/unswept field into an exclusion.
 *   3. Gate firing — on a previously-unresolvable template, each gate that reads a
 *      template field now actually excludes.
 *
 * Anchored on the shipped registries rather than fixtures, so authoring drift surfaces
 * here. The cache's template sources are `getEncountersByLocationType` and
 * `getEncountersBySublocationAndLocation` (both filter `ENCOUNTER_TEMPLATES`),
 * `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`, and `CACHE_REGISTERED_REGIONAL_TEMPLATES` —
 * so their union is an exact static superset of whatever any live cache holds, which is
 * why this needs no simulation run.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { filterByPrerequisites } from '../encounterFilterPipeline';
import { ENCOUNTER_TEMPLATES, getAnyEncounterById } from '../../data/encounter-content';
import {
  getUnifiedTemplateById,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../data/unified-action-templates';
import { BROKEN_GATE_ENABLED } from '../../data/nudge-constants';
import type { EncounterCacheEntry } from '../encounterCache';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

// ─── Fixtures ──────────────────────────────────────────────────────────────

/** Every template id the encounter cache can register. Superset of any live cache. */
const CACHE_SOURCE_IDS: readonly string[] = [...new Set([
  ...ENCOUNTER_TEMPLATES.map(t => t.id),
  ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES.map(t => t.id),
  ...CACHE_REGISTERED_REGIONAL_TEMPLATES.map(t => t.id),
])];

/**
 * A cache-registrable template the *old* lookup could not resolve, carrying no gate
 * fields of its own and no faction meta — so each gate below is exercised only by the
 * field the test sets, with no rank/join gate interfering.
 */
const UNRESOLVABLE_FIXTURE_ID = 'enc.courtyard_duel';

const AGENT = 'a1';

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT,
    type: 'actor',
    name: 'Test Agent',
    properties: { actorType: 'individual' },
  });
  return graph;
}

/**
 * Assign a trait to the agent: definition node plus the `has_trait` edge that is the
 * assignment. `collectBearerTraitRefs` tolerates a dangling target at read time, but
 * `WorldGraph.addEdge` throws on one, so the node is required to build the fixture.
 */
function grantTrait(graph: WorldGraph, traitId: string, name: string): void {
  graph.addNode({
    id: traitId,
    type: 'trait',
    name,
    properties: {
      subcategory: 'scar',
      description: `${name} fixture`,
      importance: 0.5,
      maxLevel: 1,
      visibility: 'known',
      domainContributions: {},
      tags: [],
    },
  });
  graph.addEdge({
    id: `has_trait_${AGENT}_${traitId}`,
    source: AGENT,
    target: traitId,
    type: 'has_trait',
    properties: { level: 1 },
  });
}

function entry(templateId: string): EncounterCacheEntry {
  return {
    templateId,
    locationId: 'loc1',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    threatRating: 'moderate',
    encounterType: 'combat',
    motivations: [],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 0,
  } as unknown as EncounterCacheEntry;
}

/**
 * Temporarily set a field on a shipped template object and run `body`.
 *
 * The registries are plain objects built once at module init and never mutated at
 * runtime, so an in-place set restored in `finally` is the only way to prove the gate
 * *reads* this template — no production template in the previously-unresolvable set
 * declares any of these fields, which is precisely why their deadness went unnoticed.
 */
function withField<K extends keyof UnifiedActionTemplate>(
  template: UnifiedActionTemplate,
  key: K,
  value: UnifiedActionTemplate[K],
  body: () => void,
): void {
  const had = Object.prototype.hasOwnProperty.call(template, key);
  const original = template[key];
  template[key] = value;
  try {
    body();
  } finally {
    if (had) template[key] = original;
    else delete template[key];
  }
}

// ─── 1. Coverage ───────────────────────────────────────────────────────────

describe('THR-811 — prerequisite gate template resolution', () => {
  it('resolves every template id the encounter cache can register', () => {
    const unresolved = CACHE_SOURCE_IDS.filter(id => getUnifiedTemplateById(id) === undefined);
    expect(unresolved).toEqual([]);
  });

  it('the old pool-only lookup did NOT resolve them all — the fix is load-bearing', () => {
    // Guards the test above against going vacuous: if a future refactor folded these
    // families into the encounter pools, this fails and the coverage test stops
    // proving anything about the lookup.
    const missedByOldLookup = CACHE_SOURCE_IDS.filter(id => getAnyEncounterById(id) === undefined);
    expect(missedByOldLookup.length).toBeGreaterThan(0);
    // The families that motivated the ticket are all in the missed set.
    expect(missedByOldLookup).toContain('rb.senior.deep_scout');
    expect(missedByOldLookup).toContain('ts.elite.found_cathedral');
    expect(missedByOldLookup).toContain(UNRESOLVABLE_FIXTURE_ID);
  });

  it('is a superset of the lookup it replaced', () => {
    const regressed = CACHE_SOURCE_IDS.filter(
      id => getAnyEncounterById(id) !== undefined && getUnifiedTemplateById(id) === undefined,
    );
    expect(regressed).toEqual([]);
  });

  it('preserves the .find-chain precedence: UNIFIED_ACTION_TEMPLATES wins', () => {
    const first = UNIFIED_ACTION_TEMPLATES[0];
    expect(getUnifiedTemplateById(first.id)).toBe(
      UNIFIED_ACTION_TEMPLATES.find(t => t.id === first.id),
    );
  });

  // ─── 2. No newly-excluded content ────────────────────────────────────────

  it('where both lookups resolve, they differ only by the appended group affinity', () => {
    const differingBeyondAffinities: string[] = [];
    for (const id of CACHE_SOURCE_IDS) {
      const viaPool = getAnyEncounterById(id);
      if (!viaPool) continue;
      const viaUnified = getUnifiedTemplateById(id)!;
      if (viaUnified === viaPool) continue;
      // Normalise away the one field `withGroupAffinity` rewrites; anything else
      // differing means the pipeline started reading a materially different object.
      const normalised = { ...viaPool, actorAffinities: viaUnified.actorAffinities };
      if (JSON.stringify(normalised) !== JSON.stringify(viaUnified)) {
        differingBeyondAffinities.push(id);
      }
    }
    expect(differingBeyondAffinities).toEqual([]);
  });

  it('no cache-registrable template becomes NEWLY group-exclusive under the new lookup', () => {
    // The polarity trap, stated as a change rather than an absence: 9 templates are
    // authored group-exclusive on purpose (THR-731's band/confrontation set), so the
    // test cannot demand that none are. What must not happen is a template *acquiring*
    // exclusivity — either because it was unresolvable before (the gate passed it
    // unconditionally, so excluding it now is a behaviour change) or because the swept
    // copy dropped `'individual'`. `withGroupAffinity` only ever appends, so it can't.
    const groupExclusive = (t: UnifiedActionTemplate | undefined): boolean => {
      const aff = t?.actorAffinities;
      return aff !== undefined && aff.includes('group') && !aff.includes('individual');
    };
    const newlyExclusive = CACHE_SOURCE_IDS.filter(id => {
      const before = getAnyEncounterById(id);
      // Unresolvable before ⇒ the gate could not see any affinity claim at all.
      const wasExclusive = before === undefined ? false : groupExclusive(before);
      return groupExclusive(getUnifiedTemplateById(id)) && !wasExclusive;
    });
    expect(newlyExclusive).toEqual([]);
  });

  // ─── 3. Gate firing on a previously-unresolvable template ────────────────

  describe('gates now fire on a previously-unresolvable template', () => {
    it('the fixture is genuinely one the old lookup could not resolve', () => {
      expect(getAnyEncounterById(UNRESOLVABLE_FIXTURE_ID)).toBeUndefined();
      expect(getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)).toBeDefined();
    });

    it('passes unchanged when it declares no prerequisites', () => {
      const graph = makeGraph();
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      expect(filterByPrerequisites(entries, AGENT, graph)).toHaveLength(1);
    });

    it('requiredTraits gate excludes an agent holding no traits', () => {
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      const graph = makeGraph();
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      withField(template, 'requiredTraits', [{ traitId: 'trait.definitely-not-held' }], () => {
        expect(filterByPrerequisites(entries, AGENT, graph)).toEqual([]);
      });
      // Restored — and the gate stops excluding once the declaration is gone.
      expect(filterByPrerequisites(entries, AGENT, graph)).toHaveLength(1);
    });

    it('requiredTraits gate opens for an agent who holds the trait', () => {
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      const graph = makeGraph();
      grantTrait(graph, 'trait.craft.smithing', 'Smithing');
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      withField(template, 'requiredTraits', [{ traitId: 'trait.craft.smithing' }], () => {
        expect(filterByPrerequisites(entries, AGENT, graph)).toHaveLength(1);
      });
    });

    it('blockedByTraits gate excludes an agent who holds the blocking trait', () => {
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      const graph = makeGraph();
      grantTrait(graph, 'trait.scar.haunted', 'Haunted');
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      withField(template, 'blockedByTraits', ['trait.scar.haunted'], () => {
        expect(filterByPrerequisites(entries, AGENT, graph)).toEqual([]);
      });
      // Restored — and the same agent is no longer blocked.
      expect(filterByPrerequisites(entries, AGENT, graph)).toHaveLength(1);
    });

    it('blockedByTraits gate is inert for an agent without the blocking trait', () => {
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      const graph = makeGraph();
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      withField(template, 'blockedByTraits', ['trait.definitely-not-held'], () => {
        expect(filterByPrerequisites(entries, AGENT, graph)).toHaveLength(1);
      });
    });

    it('group-exclusive gate excludes a solo agent', () => {
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      const graph = makeGraph();
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      withField(template, 'actorAffinities', ['group'], () => {
        expect(filterByPrerequisites(entries, AGENT, graph)).toEqual([]);
      });
    });

    it('confrontation gate excludes when no opposing band is present', () => {
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      const graph = makeGraph();
      const entries = [entry(UNRESOLVABLE_FIXTURE_ID)];
      withField(template, 'requiresOpposingBand', true, () => {
        expect(filterByPrerequisites(entries, AGENT, graph)).toEqual([]);
      });
    });

    it('broken gate reads the template, but stays inert while BROKEN_GATE_ENABLED is false', () => {
      // Not an end-to-end firing: `brokenGateActive` folds in BROKEN_GATE_ENABLED,
      // which ships false (THR-773 WS5), so no agent is ever broken-gated today. What
      // THR-811 changes for this gate is that `drawableWhileBroken` is now readable at
      // all on these ids — before, `template` was undefined and the opt-in could never
      // be seen. Pinned as a constant assertion so this test starts meaning something
      // the moment WS5 flips it.
      expect(BROKEN_GATE_ENABLED).toBe(false);
      const template = getUnifiedTemplateById(UNRESOLVABLE_FIXTURE_ID)!;
      expect(template).toBeDefined();
      expect(template.drawableWhileBroken).toBeUndefined();
    });
  });
});
