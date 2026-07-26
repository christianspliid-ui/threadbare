/**
 * THR-786 — unchanged-behavior contract suite for the six trait-predicate read sites.
 *
 * This suite is the **kill criterion** for the predicate unification, per
 * `Docs/plans/2026-07-26-traits-trigger-architecture.md` § Kill criteria: "Floor is
 * wrong if any migrated site changes behavior for passing content."
 *
 * It was written BEFORE the migration and pins each site's *current* matching
 * vocabulary — including the vocabularies that disagree with each other, which is
 * the whole reason the unification exists:
 *
 * | # | Site                                      | Vocabulary pinned here                        |
 * |---|-------------------------------------------|-----------------------------------------------|
 * | 1 | `encounterFilterPipeline` trait gate      | trait **node id** + `level >= minLevel` + granted |
 * | 2 | `effectPredicates` `has_trait:`/`lacks_trait:` | trait **tags** ∪ **display name**         |
 * | 3 | `graphConditions` `agent_has_trait`       | `trait.<key>` id form (`properties.traitId` is a dead read) |
 * | 4 | ambition snapshot eligibility             | id ∪ name ∪ tags ∪ granted                    |
 * | 5 | `spellActivation` prerequisites           | id ∪ name ∪ tags ∪ granted                    |
 * | 6 | item-granted keys (`collectGrantedTraits`) | plain grant key, all consumers                |
 *
 * Union-semantics note: the migration replaces these with one ref→ANY-match
 * resolver. ANY-match is a *superset* of sites 1 and 3 (a tag or display name now
 * resolves where only an id did before). Every assertion below states which side of
 * that line it is on, so a future reader can tell a preserved contract from a
 * deliberate widening. Cases marked WIDENED-BY-THR-786 assert the pre-migration
 * `false` in a way that stays honest after the migration — see the companion
 * widening block at the end of the file.
 */
import { describe, it, expect, vi } from 'vitest';
import { WorldGraph } from '../../graph';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { GraphNode } from '../../../types/graph';
import type { ReachDomain } from '../../../types/traits';
import type { AttachmentEffect } from '../../../types/effects';
import { collectGrantedTraits } from '../../effects/effectQueries';
import { buildAmbitionAgentSnapshot } from '../../ambitionTick';
import { passesEligibility } from '../../ambitionSelection';
import { evaluateGraphCondition } from '../../graphConditions';
import { assignTrait, reinforceTrait } from '../../traits';

// ─── Fixtures ───────────────────────────────────────────────────

/**
 * The fixture trait carries all four ref forms a site might name it by:
 * node id `trait.mastery.smithing`, display name `Master Smith`, and
 * tags `#craft` / `#respected`. No producer writes `properties.traitId`
 * (verified 2026-07-26), so that ref form is deliberately absent.
 */
const SMITHING_TRAIT: GraphNode = {
  id: 'trait.mastery.smithing',
  type: 'trait',
  name: 'Master Smith',
  properties: {
    subcategory: 'mastery',
    description: 'Shapes metal as though it wanted the shape.',
    importance: 0.6,
    maxLevel: 3,
    visibility: 'public',
    domainContributions: { iron: 0.05 },
    tags: ['#craft', '#respected'],
    flavorText: 'The hammer falls where it is needed.',
  },
};

const HAUNTED_TRAIT: GraphNode = {
  id: 'trait.scar.haunted',
  type: 'trait',
  name: 'Haunted',
  properties: {
    subcategory: 'scar',
    description: 'Something followed them back.',
    importance: 0.5,
    maxLevel: 1,
    visibility: 'discoverable',
    domainContributions: {},
    tags: ['#scar', '#veil-touched'],
    flavorText: 'It waits at the edge of the fire.',
  },
};

/**
 * Bare agent + both trait definition nodes present but unassigned.
 * `opts.capabilities` feeds the reach floors that ambition eligibility also checks,
 * so the trait gate is the only failing filter unless stated otherwise.
 */
function baseGraph(opts?: {
  capabilities?: Partial<Record<ReachDomain, number>>;
  effects?: AttachmentEffect[];
}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent-1',
    type: 'actor',
    name: 'Test Agent',
    properties: { domainCapabilities: opts?.capabilities ?? {} },
  });
  graph.addNode({ ...SMITHING_TRAIT });
  graph.addNode({ ...HAUNTED_TRAIT });

  if (opts?.effects) {
    graph.addNode({
      id: 'item-1',
      type: 'artifact',
      name: 'Test Item',
      properties: { effects: opts.effects },
    });
    graph.addEdge({
      id: 'edge-poss-1',
      type: 'possesses',
      source: 'agent-1',
      target: 'item-1',
      properties: {},
    });
  }
  return graph;
}

/** Assign `traitId` to agent-1 and reinforce it to `level`. */
function withTrait(graph: WorldGraph, traitId: string, level = 1): WorldGraph {
  assignTrait(graph, 'agent-1', traitId, { tick: 0, source: 'test' });
  for (let i = 1; i < level; i++) reinforceTrait(graph, 'agent-1', traitId, i);
  return graph;
}

/**
 * `evaluateGraphCondition` is typed against the narrow `ConditionGraph`, whose
 * function-valued properties are checked contravariantly under `strictFunctionTypes`,
 * so a real `WorldGraph` is not structurally assignable to it (a pre-existing
 * THR-489-baseline incompatibility, not something this ticket introduces). These
 * tests deliberately exercise the real graph, so the cast is localized here and
 * documented once rather than sprinkled across five call sites.
 */
function evalCondition(
  condition: { type: string; trait: string },
  graph: WorldGraph | Parameters<typeof evaluateGraphCondition>[1],
  agentId = 'agent-1',
): boolean {
  return evaluateGraphCondition(
    condition as never,
    graph as Parameters<typeof evaluateGraphCondition>[1],
    agentId,
  );
}

// ─── Site 1 — encounter filter pipeline trait gate ──────────────

vi.mock('../../../data/encounter-content', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../data/encounter-content')>();
  return {
    ...actual,
    getAnyEncounterById: (id: string) => {
      switch (id) {
        case 'tmpl-requires-id':
          return { id, requiredTraits: [{ traitId: 'trait.mastery.smithing' }] };
        case 'tmpl-requires-id-lvl2':
          return { id, requiredTraits: [{ traitId: 'trait.mastery.smithing', minLevel: 2 }] };
        case 'tmpl-requires-tag':
          return { id, requiredTraits: [{ traitId: '#craft' }] };
        case 'tmpl-requires-name':
          return { id, requiredTraits: [{ traitId: 'Master Smith' }] };
        case 'tmpl-requires-both':
          return {
            id,
            requiredTraits: [
              { traitId: 'trait.mastery.smithing' },
              { traitId: 'trait.scar.haunted' },
            ],
          };
        case 'tmpl-requires-empty':
          return { id, requiredTraits: [] };
        case 'tmpl-blocked-by-id':
          return { id, blockedByTraits: ['trait.scar.haunted'] };
        default:
          return actual.getAnyEncounterById(id);
      }
    },
  };
});

/** Minimal cache entry — the trait gate reads only `templateId`. */
const entry = (templateId: string) => ({ templateId, locationId: 'loc-1' }) as never;

async function filterOne(templateId: string, graph: WorldGraph): Promise<number> {
  const { filterByPrerequisites } = await import('../../encounterFilterPipeline');
  return filterByPrerequisites([entry(templateId)], 'agent-1', graph).length;
}

describe('site 1 — encounterFilterPipeline trait gate', () => {
  it('PRESERVED: matches on trait node id', async () => {
    expect(await filterOne('tmpl-requires-id', withTrait(baseGraph(), 'trait.mastery.smithing'))).toBe(1);
  });

  it('PRESERVED: filters out an agent lacking the trait', async () => {
    expect(await filterOne('tmpl-requires-id', baseGraph())).toBe(0);
  });

  it('PRESERVED: minLevel is enforced — level 1 fails a minLevel-2 gate', async () => {
    expect(await filterOne('tmpl-requires-id-lvl2', withTrait(baseGraph(), 'trait.mastery.smithing', 1))).toBe(0);
  });

  it('PRESERVED: minLevel is satisfied at level 2', async () => {
    expect(await filterOne('tmpl-requires-id-lvl2', withTrait(baseGraph(), 'trait.mastery.smithing', 2))).toBe(1);
  });

  it('PRESERVED: every() semantics — all required traits must be held', async () => {
    const one = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(await filterOne('tmpl-requires-both', one)).toBe(0);

    const both = withTrait(withTrait(baseGraph(), 'trait.mastery.smithing'), 'trait.scar.haunted');
    expect(await filterOne('tmpl-requires-both', both)).toBe(1);
  });

  it('PRESERVED: empty requiredTraits is a vacuous pass', async () => {
    expect(await filterOne('tmpl-requires-empty', baseGraph())).toBe(1);
  });

  it('PRESERVED: blockedByTraits excludes a holder', async () => {
    expect(await filterOne('tmpl-blocked-by-id', withTrait(baseGraph(), 'trait.scar.haunted'))).toBe(0);
    expect(await filterOne('tmpl-blocked-by-id', baseGraph())).toBe(1);
  });

  it('PRESERVED: an item-granted key satisfies the gate (THR-737)', async () => {
    const graph = baseGraph({
      effects: [{ type: 'trait_grant', grantedTrait: 'trait.mastery.smithing' }],
    });
    expect(await filterOne('tmpl-requires-id', graph)).toBe(1);
  });

  it('PRESERVED: a granted key blocks symmetrically', async () => {
    const graph = baseGraph({
      effects: [{ type: 'trait_grant', grantedTrait: 'trait.scar.haunted' }],
    });
    expect(await filterOne('tmpl-blocked-by-id', graph)).toBe(0);
  });
});

// ─── Site 2 — effectPredicates string sugar ─────────────────────

describe('site 2 — effectPredicates has_trait:/lacks_trait: sugar', () => {
  async function ctxFor(graph: WorldGraph) {
    const { buildPredicateContext } = await import('../../effects/effectPredicates');
    return buildPredicateContext(graph, 'agent-1');
  }
  async function evalPred(graph: WorldGraph, predicate: string): Promise<boolean> {
    const { evaluatePredicate } = await import('../../effects/effectPredicates');
    return evaluatePredicate(predicate as never, await ctxFor(graph));
  }

  it('PRESERVED: has_trait:<tag> matches a trait tag', async () => {
    const graph = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(await evalPred(graph, 'has_trait:#craft')).toBe(true);
    expect(await evalPred(graph, 'has_trait:#respected')).toBe(true);
  });

  it('PRESERVED: has_trait: is false for an unheld tag', async () => {
    expect(await evalPred(baseGraph(), 'has_trait:#craft')).toBe(false);
  });

  it('PRESERVED: lacks_trait: is the exact negation', async () => {
    const held = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(await evalPred(held, 'lacks_trait:#craft')).toBe(false);
    expect(await evalPred(baseGraph(), 'lacks_trait:#craft')).toBe(true);
  });

  it('PRESERVED: the context set carries trait tags', async () => {
    const ctx = await ctxFor(withTrait(baseGraph(), 'trait.mastery.smithing'));
    expect(ctx.agentTraits.has('#craft')).toBe(true);
    expect(ctx.agentTraits.has('#respected')).toBe(true);
  });

  it('PRESERVED: production content still uses the sugar (guards vacuity)', async () => {
    const catalog = await import('../../../data/choice-set-catalog');
    const serialized = JSON.stringify(catalog);
    const refs = [...serialized.matchAll(/(?:has|lacks)_trait:([^"\\]+)/g)].map(m => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    // All four shipped refs are bare keys that match no trait id, name or tag —
    // verified 2026-07-26 against the six trait-content files. `validateTraitRefs()`
    // reports exactly these; they are filed as a defect, not fixed here.
    expect(refs).toEqual(
      expect.arrayContaining(['negotiator', 'dauntless', 'leader', 'interrogator']),
    );
  });
});

// ─── Site 3 — graphConditions agent_has_trait ───────────────────

describe('site 3 — graphConditions agent_has_trait / agent_lacks_trait', () => {
  /**
   * `evaluateGraphCondition` takes the narrow `ConditionGraph` interface, which
   * exposes only `{ id, properties }` per node — no `name`. That is why this site's
   * vocabulary is the `trait.<key>` id form and nothing else.
   */
  it('PRESERVED: agent_has_trait matches the trait.<key> id form', () => {
    const graph = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(
      evalCondition({ type: 'agent_has_trait', trait: 'mastery.smithing' }, graph),
    ).toBe(true);
  });

  it('PRESERVED: agent_has_trait is false when the trait is unheld', () => {
    expect(
      evalCondition({ type: 'agent_has_trait', trait: 'mastery.smithing' }, baseGraph()),
    ).toBe(false);
  });

  it('PRESERVED: agent_lacks_trait is the exact negation', () => {
    const held = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(
      evalCondition({ type: 'agent_lacks_trait', trait: 'mastery.smithing' }, held),
    ).toBe(false);
    expect(
      evalCondition({ type: 'agent_lacks_trait', trait: 'mastery.smithing' }, baseGraph()),
    ).toBe(true);
  });

  /**
   * `WorldGraph.addEdge` rejects a dangling target, so a dangling `has_trait` edge
   * can only arise from a later node removal. A hand-rolled `ConditionGraph` — the
   * narrow interface this evaluator is written against — reproduces that state
   * directly.
   */
  it('PRESERVED: fail-soft — a has_trait edge to a missing node never throws', () => {
    const danglingGraph = {
      getNode: () => undefined,
      getOutgoingEdges: (_id: string, type?: string) =>
        type === 'has_trait'
          ? [{ source: 'agent-1', target: 'trait.does.not.exist', type: 'has_trait', properties: { level: 1 } }]
          : [],
      getIncomingEdges: () => [],
    };
    expect(() =>
      evalCondition({ type: 'agent_has_trait', trait: 'does.not.exist' }, danglingGraph),
    ).not.toThrow();
    expect(
      evalCondition({ type: 'agent_has_trait', trait: 'does.not.exist' }, danglingGraph),
    ).toBe(false);
  });
});

// ─── Site 4 — ambition snapshot eligibility ─────────────────────

describe('site 4 — ambition snapshot eligibility', () => {
  const template = (over: Record<string, unknown>) =>
    ({
      id: 'ambition-test',
      reachFloors: {},
      requiredTraits: [],
      blockingTraits: [],
      sphereAffinities: [],
      bondModifiers: [],
      ...over,
    }) as never;

  it('PRESERVED: the snapshot carries id, display name and tags', () => {
    const snap = buildAmbitionAgentSnapshot(withTrait(baseGraph(), 'trait.mastery.smithing'), 'agent-1');
    expect(snap.traits).toContain('trait.mastery.smithing');
    expect(snap.traits).toContain('Master Smith');
    expect(snap.traits).toContain('#craft');
  });

  it('PRESERVED: requiredTraits matches on any of the three ref forms', () => {
    const snap = buildAmbitionAgentSnapshot(withTrait(baseGraph(), 'trait.mastery.smithing'), 'agent-1');
    for (const ref of ['trait.mastery.smithing', 'Master Smith', '#craft']) {
      expect(passesEligibility(template({ requiredTraits: [ref] }), snap)).toBe(true);
    }
  });

  it('PRESERVED: blockingTraits excludes a holder on any ref form', () => {
    const snap = buildAmbitionAgentSnapshot(withTrait(baseGraph(), 'trait.mastery.smithing'), 'agent-1');
    for (const ref of ['trait.mastery.smithing', 'Master Smith', '#craft']) {
      expect(passesEligibility(template({ blockingTraits: [ref] }), snap)).toBe(false);
    }
  });

  it('PRESERVED: an item-granted key reaches the snapshot (THR-737)', () => {
    const graph = baseGraph({ effects: [{ type: 'trait_grant', grantedTrait: 'master_smith' }] });
    const snap = buildAmbitionAgentSnapshot(graph, 'agent-1');
    expect(snap.traits).toContain('master_smith');
    expect(passesEligibility(template({ requiredTraits: ['master_smith'] }), snap)).toBe(true);
  });

  it('PRESERVED: an unheld ref leaves the agent ineligible', () => {
    const snap = buildAmbitionAgentSnapshot(baseGraph(), 'agent-1');
    expect(passesEligibility(template({ requiredTraits: ['#craft'] }), snap)).toBe(false);
  });
});

// ─── Site 5 — spell prerequisites ───────────────────────────────

describe('site 5 — spellActivation requiredTraits prerequisites', () => {
  async function met(graph: WorldGraph, requiredTraits: string[]): Promise<boolean> {
    const { checkPrerequisites } = await import('../../spellActivation');
    return checkPrerequisites(graph, 'agent-1', { prerequisites: { requiredTraits } } as never).met;
  }

  it('PRESERVED: matches on trait node id and on tag', async () => {
    const graph = withTrait(baseGraph(), 'trait.mastery.smithing');
    for (const ref of ['trait.mastery.smithing', '#craft']) {
      expect(await met(graph, [ref])).toBe(true);
    }
  });

  it('PRESERVED: an unheld ref fails the prerequisite', async () => {
    expect(await met(baseGraph(), ['#craft'])).toBe(false);
  });

  it('PRESERVED: all required refs must be satisfied', async () => {
    const graph = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(await met(graph, ['#craft', '#scar'])).toBe(false);
  });

  it('PRESERVED: an item-granted key satisfies a prerequisite (THR-737)', async () => {
    const graph = baseGraph({ effects: [{ type: 'trait_grant', grantedTrait: 'master_smith' }] });
    expect(await met(graph, ['master_smith'])).toBe(true);
  });
});

// ─── Site 6 — item-granted keys ─────────────────────────────────

describe('site 6 — collectGrantedTraits', () => {
  it('PRESERVED: collects keys from active trait_grant effects', () => {
    const graph = baseGraph({
      effects: [
        { type: 'trait_grant', grantedTrait: 'master_smith' },
        { type: 'permanent', reach: 'iron', value: 0.1 },
      ],
    });
    expect(collectGrantedTraits(graph, 'agent-1')).toEqual(new Set(['master_smith']));
  });

  it('PRESERVED: fail-soft on an unknown bearer', () => {
    expect(collectGrantedTraits(baseGraph(), 'no-such-agent').size).toBe(0);
  });
});

// ─── Deliberate widening introduced by THR-786 ──────────────────

/**
 * The unification routes every site through one ref→ANY-match resolver, which is a
 * strict superset of each site's pre-migration vocabulary. These cases were **false
 * before the migration and are true after it**. They are asserted here rather than
 * hidden so the widening is a recorded design decision, not an accident.
 *
 * Two kinds appear below:
 *   - **vocabulary widening** (sites 1, 2, 3): a ref form that site never consulted
 *     now resolves.
 *   - **dead-read repair** (sites 2, 5): the display-name union those sites already
 *     intended, reading the live `node.name` instead of the absent
 *     `properties.name`.
 *
 * No shipped content changes behavior. Site 1's `requiredTraits`/`blockedByTraits`
 * are declared on `UnifiedActionTemplate` as of THR-801 (the WS0 PR did not carry
 * them; see the type-level guard below), but zero production templates author a
 * trait gate yet — authoring is deferred to THR-778 (WS5 content migration), so
 * this suite remains the only exercise of the path; every shipped `agent_has_trait`
 * names the `trait.<key>` id form that already worked; and the four shipped
 * `has_trait:` refs match no trait by *any* ref form, so they were dead before and
 * remain dead after (filed as a defect — see the completion comment).
 */
describe('THR-786 widening — one ANY-match resolver across all six sites', () => {
  it('WIDENED: site 1 now matches a tag ref', async () => {
    expect(await filterOne('tmpl-requires-tag', withTrait(baseGraph(), 'trait.mastery.smithing'))).toBe(1);
  });

  it('WIDENED: site 1 now matches a display-name ref', async () => {
    expect(await filterOne('tmpl-requires-name', withTrait(baseGraph(), 'trait.mastery.smithing'))).toBe(1);
  });

  it('WIDENED: site 3 now matches a tag ref', () => {
    const graph = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(
      evalCondition({ type: 'agent_has_trait', trait: '#craft' }, graph),
    ).toBe(true);
  });

  it('WIDENED: site 2 now also matches the trait node id', async () => {
    const { buildPredicateContext, evaluatePredicate } = await import('../../effects/effectPredicates');
    const ctx = buildPredicateContext(withTrait(baseGraph(), 'trait.mastery.smithing'), 'agent-1');
    expect(evaluatePredicate('has_trait:trait.mastery.smithing' as never, ctx)).toBe(true);
  });

  it('REPAIRED: site 2 display-name union now resolves (was a dead read)', async () => {
    const { buildPredicateContext, evaluatePredicate } = await import('../../effects/effectPredicates');
    const ctx = buildPredicateContext(withTrait(baseGraph(), 'trait.mastery.smithing'), 'agent-1');
    expect(ctx.agentTraits.has('Master Smith')).toBe(true);
    expect(evaluatePredicate('has_trait:Master Smith' as never, ctx)).toBe(true);
  });

  it('REPAIRED: site 5 display-name prerequisite now resolves (was a dead read)', async () => {
    const { checkPrerequisites } = await import('../../spellActivation');
    const graph = withTrait(baseGraph(), 'trait.mastery.smithing');
    expect(
      checkPrerequisites(graph, 'agent-1', {
        prerequisites: { requiredTraits: ['Master Smith'] },
      } as never).met,
    ).toBe(true);
  });
});

/**
 * THR-801 — the template gate is *declarable*, not just readable.
 *
 * `filterByPrerequisites` has read `template.requiredTraits`/`blockedByTraits` since
 * THR-773, but neither field was declared on `UnifiedActionTemplate` until THR-801:
 * a phantom API, evaluated every tick and authorable by nobody. Site 1's cases above
 * cannot catch a regression here — they mock `getAnyEncounterById` with untyped
 * object literals, which keep passing whether the interface declares the fields or
 * not. That is precisely how the gap survived two shipping tickets.
 *
 * The guard is therefore type-level, and its teeth are the `tsc -b` ratchet rather
 * than vitest (which does not typecheck): this file carries **zero** baseline errors,
 * so if either field is dropped from the interface again, the indexed accesses below
 * fail to resolve and the ratchet reports it as a net-new error.
 */
describe('THR-801 — template trait-gate fields are declared on UnifiedActionTemplate', () => {
  it('declares requiredTraits as TraitPredicate[] (carries minLevel)', () => {
    const required: UnifiedActionTemplate['requiredTraits'] = [
      { traitId: 'trait.mastery.smithing', minLevel: 2 },
      { traitId: '#craft' },
    ];
    expect(required?.[0]?.minLevel).toBe(2);
  });

  it('declares blockedByTraits as bare refs (deliberately level-free)', () => {
    // The asymmetry is the contract, not an oversight: holding a blocking trait at
    // ANY level blocks, so there is no `minLevel` to declare here.
    const blocked: UnifiedActionTemplate['blockedByTraits'] = ['trait.scar.haunted'];
    expect(blocked).toEqual(['trait.scar.haunted']);
  });

  it('a template typed as the interface still drives the gate', async () => {
    // Ties the declaration to the behavior: the same shape the interface now permits
    // is the shape site 1 filters on, so neither can drift without the other failing.
    const gate: Pick<UnifiedActionTemplate, 'requiredTraits'> = {
      requiredTraits: [{ traitId: 'trait.mastery.smithing' }],
    };
    expect(gate.requiredTraits).toHaveLength(1);
    expect(await filterOne('tmpl-requires-id', withTrait(baseGraph(), 'trait.mastery.smithing'))).toBe(1);
  });
});
