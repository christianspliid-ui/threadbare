/**
 * THR-800 — the dead-ref ratchet.
 *
 * THR-786 built `validateTraitRefs`; it measured 62 authored refs that no trait
 * definition could satisfy, i.e. 62 gates permanently false. This ticket repointed
 * every ref with a faithful, *live* counterpart, taking the count to 22.
 *
 * ── Why this test pins a set and not `dead.length === 0` ───────────────────────────
 *
 * The ticket's Done-when #1 asked for zero. Zero is not honestly reachable by
 * repointing alone, and the other route — minting definitions for the missing
 * concepts — does not work the way the ticket assumed: **every trait producer mints
 * from a closed, hardcoded set** (`phaseEconomicTraits` by constant,
 * `phaseEncounterTraits` by reach map, `phaseReputationTraits` by reach,
 * `corePersonality` by continuum, `personalityTraitEmerge` by axis). Adding a
 * definition to a content file gives a ref something to resolve *to* while leaving it
 * satisfied by no bearer — the gate stays false and the sweep goes quiet, which is
 * strictly worse than a dead ref that is visible. See THR-808 for the producer work.
 *
 * So the invariant worth locking is not a count but the **exact remaining set**. An
 * equality assertion fails in both directions: a new dead ref cannot be authored, and
 * a ref cannot silently leave this list without someone updating it deliberately —
 * which is the accounting Done-when #2 asked for ("no ref deleted merely to silence
 * the sweep"). A bare `toBeLessThan(23)` would let content rot back in under the cap.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { validateTraitRefs } from '../traitRefValidation';
import { CORE_TRAIT_DEFINITIONS } from '../../data/core-trait-content';
import { MASTERY_TRAIT_DEFINITIONS } from '../../data/mastery-trait-content';
import { PERSONALITY_TRAIT_DEFINITIONS } from '../../data/personality-trait-content';
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import { ECONOMIC_TRAIT_DEFINITIONS } from '../../data/economic-trait-content';
import { REPUTATION_TRAIT_DEFINITIONS } from '../../data/reputation-trait-content';

/**
 * Every statically-shipped trait definition, seeded into one graph.
 *
 * The engine seeds these lazily from five separate `ensure*TraitNodes` helpers across
 * five phases; assembling them here reproduces the steady-state graph a real run
 * reaches without paying for worldgen. Runtime-minted definitions (cultural traits at
 * worldgen, bestowed traits at promotion) are deliberately excluded — a ref that only
 * resolves against a runtime-minted trait is not something authored content may rely
 * on, so the stricter static-only graph is the right baseline for this ratchet.
 */
function graphWithShippedDefinitions(): WorldGraph {
  const graph = new WorldGraph();
  const all: GraphNode[] = [
    ...CORE_TRAIT_DEFINITIONS,
    ...MASTERY_TRAIT_DEFINITIONS,
    ...PERSONALITY_TRAIT_DEFINITIONS,
    ...CONDITION_TRAIT_DEFINITIONS,
    ...ECONOMIC_TRAIT_DEFINITIONS,
    ...(REPUTATION_TRAIT_DEFINITIONS as unknown as GraphNode[]),
  ];
  for (const node of all) if (!graph.getNode(node.id)) graph.addNode(node);
  return graph;
}

/**
 * The 22 refs that survive, each for a stated reason. Adding to this list requires a
 * reason in the same commit — that is the point of the list.
 */
const KNOWN_DEAD = {
  /**
   * The `destiny` category is *reserved and empty by design* (UL § Destiny, THR-788):
   * declared in `TraitCategory`, honored by the agent sheet's ordering, carried by no
   * definition and minted by no producer. Repointing these at a non-destiny trait
   * would misname the concept; minting destiny definitions would contradict canon
   * shipped the same day. They wait for the wave that fills the category.
   */
  destiny: ['destiny_fulfilled', 'destiny_marked', 'destiny_rejected', 'destiny_tested'],
  /**
   * Not traits at all — miscoded as `agent_has_trait` because that was the available
   * condition shape. `living` is an aliveness check; `rare_ore_secured` is resource
   * state. Both want a new `AmbitionCondition` variant, not a trait definition.
   */
  notATrait: ['living', 'rare_ore_secured'],
  /**
   * Narrative progress flags an ambition would have to mint about its own bearer.
   * No producer exists and none is implied by the trait layer as it stands.
   */
  unproducedFlags: ['accepted_exile', 'homeless_wanderer', 'made_peace_with_the_land'],
  /**
   * Selection concepts with no live definition carrying the meaning. Seven of these
   * are `blockingTraits`, where a wrong repoint is worse than a dead one — a dead
   * blocker is permissive (nothing is excluded), while a mistaken blocker silently
   * excludes agents who should qualify. Left dead deliberately rather than force-fit.
   */
  noLiveCounterpart: [
    'apostate', 'barren_line', 'exile', 'incurious', 'noble_blood', 'obsessive',
    'pacifist', 'perfectionist', 'pioneer', 'plague_bearer', 'rooted', 'ruin_delver',
    'veil_blind',
  ],
} as const;

const EXPECTED_DEAD = Object.values(KNOWN_DEAD).flat().slice().sort();

describe('THR-800 — authored trait refs resolve against shipped definitions', () => {
  it('has exactly the known-remaining dead refs, no more and no fewer', async () => {
    const report = await validateTraitRefs(graphWithShippedDefinitions());
    const dead = [...new Set(report.dead.map(d => d.ref))].sort();

    expect(dead).toEqual(EXPECTED_DEAD);
  });

  it('resolves every ref repointed by this ticket', async () => {
    const report = await validateTraitRefs(graphWithShippedDefinitions());
    const dead = new Set(report.dead.map(d => d.ref));

    // One representative per repointed surface: choice-set predicate, ambition
    // boosting/blocking key, and ambition graph condition. If a repoint is reverted or
    // its target definition is renamed, the ref falls back into `dead` and this fails.
    for (const ref of ['negotiator', 'merchant', 'zealot', 'forgiving', 'enlightened', 'forgiven']) {
      expect(dead.has(ref)).toBe(false);
    }
  });

  it('keeps the repoint targets pointed at definitions that actually exist', async () => {
    const graph = graphWithShippedDefinitions();
    // The repoints name definitions by full node id and by tag. A typo in either form
    // resolves to nothing and would show up as a *new* dead ref, but assert the
    // targets directly too so the failure names the missing definition rather than the
    // authored key.
    for (const id of [
      'trait.mastery.silver-tongue',
      'trait.mastery.trade-baron',
      'trait.mastery.spell-weaver',
      'trait.mastery.anointed',
      'trait.mastery.steadfast',
      'trait.personality.iron.virtue',
      'trait.personality.star.virtue',
      'trait.personality.heart.virtue',
      'trait.core.core_forgiveness.virtue',
      'trait.core.core_forgiveness.vice',
      'trait.core.core_hope.virtue',
      'trait.core.core_hope.vice',
      'trait.core.core_warmth.virtue',
      'trait.core.core_warmth.vice',
      'trait.core.core_humility.vice',
      'trait.condition.terrified',
      'trait.condition.exhausted',
      'trait.reputation.star.negative',
      'trait.reputation.stone.positive',
      'trait.reputation.shadow.positive',
    ]) {
      expect(graph.getNode(id), `missing repoint target ${id}`).toBeDefined();
    }
  });

  it('reports no new phantom grant keys', async () => {
    // Phantom grants gate correctly (the grant→gate loop closes on the bare key) but
    // have no definition, so they carry no display name, visibility or contributions.
    // Held at today's count so a new bare-key grant is a deliberate act — see the
    // per-file notes at each grant site.
    const report = await validateTraitRefs(graphWithShippedDefinitions());
    expect(report.phantomGrants.length).toBe(21);
  });
});
