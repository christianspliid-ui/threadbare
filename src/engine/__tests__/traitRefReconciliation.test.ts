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
 *
 * ── THR-808 — 22 → 21 ─────────────────────────────────────────────────────────────
 *
 * `living` is gone: it was never a trait but an aliveness check, and the engine already
 * models aliveness as `properties.deceased`. It became the `agent_deceased` graph
 * condition, restoring the only abandonment path `ambition_found_dynasty` had.
 *
 * THR-808 also sharpened the premise above. "Every trait producer mints from a closed
 * hardcoded set" holds for the five **trait-node** producers, but a `trait_grant`
 * effect on an **attachment** is an *open* producer — `collectGrantedTraits` returns
 * the bare key and every gate consumer unions it in, which is how the phantom grants
 * counted below close their gates today. So minting is available for the remaining 21,
 * at the stated cost of a key with no definition (no display name, no visibility, no
 * `domainContributions`). Which of the three routes each concept deserves is THR-813.
 *
 * ── THR-813 — 21 → 8 ──────────────────────────────────────────────────────────────
 *
 * The per-class decision, taken from the UL rather than ref by ref. `Docs/ubiquitous-
 * language/Traits.md` § Trait Ref is the authority: **a hook must reference a trait some
 * producer actually mints — a ref that names a trait nothing creates is an authoring
 * defect, not a missing engine feature.** Two corollaries closed the open routes:
 *
 *   - Minting needs a *category*, and a category is a lifecycle contract that names its
 *     producer (§ Trait Category). "Just add a definition" is not a route; adopting a
 *     producer is. None of the ten contracts covers a biographical selection key.
 *   - The phantom-grant route is canon-illegal for identity. A bare grant key has no
 *     display name and no visibility, and THR-789's canon is that an object's traits are
 *     always visible in its interface once known. So the cost noted above is not a
 *     trade-off to weigh — it disqualifies the route outright for these refs.
 *
 * That left retirement for the 13 `noLiveCounterpart` selection concepts, whose authored
 * sites are gone from `ambition-templates.ts` (see the retirement block in that file's
 * header for the full list and the per-site reasoning). Removal is behaviour-identical
 * by construction: `ambitionSelection.ts` tests `agent.traits.includes(ref)`, so a ref no
 * producer mints never blocked (permissive) and never scored (zero weight).
 *
 * The `unproducedFlags` decision is recorded on that key below — it is the one class
 * where the obvious repoint is actively worse than the dead ref.
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
   * Resource state miscoded as `agent_has_trait` because that was the available
   * condition shape.
   *
   * THR-808 expected this to be a sibling of `living` — one small condition variant
   * for both. It is not. `living` had a live engine concept behind it (the `deceased`
   * flag) and became `agent_deceased`; this one has nothing to read. **No `resource`
   * node is ever created** anywhere in `src/`, despite `'resource'` being declared in
   * `NodeType`, and every `controls` edge in the repo targets a `location`. A
   * condition variant here would be gate theater — it needs a resource/possession
   * model first, which puts it with `noLiveCounterpart` in practice. See THR-813.
   *
   * Harmless meanwhile: it is the `forge_materials` milestone on
   * `ambition_forge_legend`, which is `requires: 2, of: 3` with two live milestones.
   */
  noResourceModel: ['rare_ore_secured'],
  /**
   * A narrative progress flag an ambition would have to mint about its own bearer.
   * No producer exists and none is implied by the trait layer as it stands.
   *
   * ── THR-813: three refs, deferred as one class ────────────────────────────────
   *
   * `accepted_exile`, `homeless_wanderer` and `made_peace_with_the_land` were each the
   * *sole* abandonment trigger on its ambition (`reclaim homeland`, `protect kin`,
   * `flee the blight`), so all three ran to completion or forever. THR-813 took the
   * producer decision and the answer was **not yet, and not by the obvious route**:
   * each names a *loss*, abandonment is evaluated from the ambition's first tick with
   * no grace period, and every available proxy was already true for a typical agent at
   * assignment — so each repoint would have abandoned on tick one. Blocked on loss
   * history or residence + dwell time, tracked as THR-822.
   *
   * ── THR-822: two discharged, one narrowed — 3 → 1 ─────────────────────────────
   *
   * THR-822 supplied residence (origin + dwell, observed rather than written) and, more
   * importantly, a **measurement window**: `agent_settled_since` and
   * `agent_away_from_origin` count dwell from `max(arrivedTick, assignedTick)`, so
   * neither can hold before `assignedTick + minTicks`. That removes the tick-one danger
   * arithmetically rather than by proxy, which is what unblocked the two spatial refs —
   * `made_peace_with_the_land` (the road ended: settled) and `accepted_exile` (home
   * given up: settled somewhere that is not home).
   *
   * `homeless_wanderer` survives because it is not spatial. "Nothing left to guard" is
   * a loss of *bonds*, and residence has nothing to say about it; the bond-count proxy
   * still fires at assignment because `ambition_protect_kin` carries no bond floor. It
   * needs bonds-that-ended — history nothing records today. Discharging it by repointing
   * at a spatial condition would misname the concept, which is the failure mode this
   * whole list exists to prevent.
   */
  unproducedFlags: ['homeless_wanderer'],
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

  it('keeps the THR-813 retired selection keys out of the ambition templates', async () => {
    // The equality assertion above already fails if one of these is re-authored — it
    // would come back as a *new* dead ref. This asserts the same fact from the content
    // side so the failure names the authoring mistake ("`pacifist` is back in an
    // ambition") rather than only the sweep's bookkeeping, and so a future wave that
    // mints one of these concepts for real is forced to update this list deliberately.
    // All THREE pools — the file exports `AMBITION_TEMPLATES`,
    // `REACTIVE_AMBITION_TEMPLATES` and `EVENT_MINTED_AMBITION_TEMPLATES`, and the
    // retired keys were spread across all three. A sweep that misses a pool reports a
    // clean PASS over content it never read.
    const {
      AMBITION_TEMPLATES,
      REACTIVE_AMBITION_TEMPLATES,
      EVENT_MINTED_AMBITION_TEMPLATES,
    } = await import('../../data/ambition-templates');
    const authored = new Set<string>();
    for (const t of [
      ...AMBITION_TEMPLATES,
      ...REACTIVE_AMBITION_TEMPLATES,
      ...EVENT_MINTED_AMBITION_TEMPLATES,
    ]) {
      for (const ref of [...(t.blockingTraits ?? []), ...(t.boostingTraits ?? []), ...(t.requiredTraits ?? [])]) {
        authored.add(ref);
      }
    }

    // Anti-vacuity: a sweep that collected nothing would pass every assertion below.
    // Pin that the walk actually read content, and read a key that is *supposed* to be
    // there — so a refactor that renames the fields fails loudly instead of going quiet.
    expect(authored.size).toBeGreaterThan(20);
    expect(authored.has('trait.mastery.steadfast')).toBe(true);

    for (const retired of [
      'apostate', 'barren_line', 'exile', 'incurious', 'noble_blood', 'obsessive',
      'pacifist', 'perfectionist', 'pioneer', 'plague_bearer', 'rooted', 'ruin_delver',
      'veil_blind',
    ]) {
      expect(authored.has(retired), `retired selection key "${retired}" re-authored`).toBe(false);
    }
  });

  it('leaves every ambition that lost a boost with at least one live boost', async () => {
    // The retirement's safety claim was "no ambition lost its trait signal" — every
    // *boosting* site retained a live key, only *blocking* sites emptied. Pin it, so a
    // later edit cannot quietly strand an ambition with an empty boost list and leave
    // this ticket's reasoning stale.
    const {
      AMBITION_TEMPLATES,
      REACTIVE_AMBITION_TEMPLATES,
      EVENT_MINTED_AMBITION_TEMPLATES,
    } = await import('../../data/ambition-templates');
    const report = await validateTraitRefs(graphWithShippedDefinitions());
    const dead = new Set(report.dead.map(d => d.ref));
    const byId = new Map(
      [
        ...AMBITION_TEMPLATES,
        ...REACTIVE_AMBITION_TEMPLATES,
        ...EVENT_MINTED_AMBITION_TEMPLATES,
      ].map(t => [t.id, t]),
    );

    // All six ambitions that lost a boosting key, and the key each lost.
    for (const [id, retired] of [
      ['ambition_forge_legend', 'perfectionist'],
      ['ambition_found_dynasty', 'noble_blood'],
      ['ambition_uncover_secrets', 'ruin_delver'],
      ['ambition_reclaim_homeland', 'exile'],
      ['ambition_found_anew', 'pioneer'],
      ['ambition_chase_the_wonder', 'obsessive'],
    ] as const) {
      const template = byId.get(id);
      expect(template, `missing ambition ${id}`).toBeDefined();
      const boosts = template!.boostingTraits ?? [];
      expect(boosts, `${id} still carries retired key "${retired}"`).not.toContain(retired);
      const live = boosts.filter(r => !dead.has(r));
      expect(live.length, `${id} has no live boosting trait left`).toBeGreaterThan(0);
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
