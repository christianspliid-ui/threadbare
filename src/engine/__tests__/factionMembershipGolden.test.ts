/**
 * THR-1297 slice 1 — the golden gate on the `member_of` wrapper sweep.
 *
 * The plan's kill criterion for this slice reads: *"golden faction-membership
 * comparison on seeds 42+99 gates the slice (any changed read = stop)"*. This file
 * is that gate.
 *
 * **Why a differential rather than a captured literal.** The sweep migrates ~49 raw
 * `getOutgoingEdges(agentId, 'member_of')` call sites onto `getFactionMembershipEdges`.
 * The claim under test is not "membership looks like this snapshot" — it is *"the
 * wrapper resolves every agent's faction exactly as the raw read did, on a world that
 * contains no networks yet"*. So the test computes **both** answers over two real
 * seeded worlds and asserts they agree agent-by-agent:
 *
 *  - `rawLegacyFactionTargets` reproduces the pre-THR-1297 semantics *inline*
 *    (exclude a target carrying `actorType: 'group'` + no `armyState` + a string
 *    `groupType` — i.e. the old private mirror in `graphQueries.ts`), and
 *  - `getFactionMembershipEdges` is the shipped wrapper, now routed through
 *    `engine/groupShape.ts`.
 *
 * A captured literal would have been weaker in the way that matters here: it pins the
 * output of whichever tree captured it, so a baseline captured *after* the discriminator
 * moved would be the refactor agreeing with itself. The differential re-derives the old
 * answer from first principles on every run, so it cannot launder that.
 *
 * Deliberately NOT `toMatchSnapshot()` — an auto-written snapshot regenerates under `-u`
 * and would launder exactly the drift this exists to catch (same reasoning as
 * `stepResolutionGolden.test.ts`).
 *
 * **Anti-vacuity.** An empty population passes every `for` loop ever written, so the
 * population itself is asserted: both seeds must produce agents, and the corpus must
 * actually contain the two shapes under test — real faction memberships *and* at least
 * one company membership. Without the second pin the differential would agree trivially
 * on a world where no agent has ever joined a company, which is the exact world where
 * the old raw reads were already correct and the sweep proves nothing.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { getFactionMembershipEdges } from '../graphQueries';
import { getGroupKind } from '../groupShape';
import { createGroup } from '../groups/groupFormation';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

/** The seeds the plan names. */
const SEEDS = [42, 99] as const;

function buildWorld(seed: number): GameState {
  const archetype = generateArchetypes(4, seed)[0];
  const preset = MAP_SIZE_PRESETS.medium;
  const { state } = initializeGameState(
    archetype,
    'GoldenBot',
    createBalancedCosmology(),
    seed,
    preset.cols,
    preset.rows,
  );
  return state;
}

function individuals(state: GameState): GraphNode[] {
  return state.graph
    .getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');
}

/**
 * The pre-THR-1297 answer, re-derived inline.
 *
 * This is a verbatim restatement of the private `isCompanyMembershipTarget` mirror that
 * lived in `graphQueries.ts` before this slice — kept as a literal copy *on purpose*, so
 * that if someone later changes the shipped rule, this side does not move with it.
 */
function rawLegacyFactionTargets(graph: WorldGraph, agentId: string): string[] {
  return graph
    .getOutgoingEdges(agentId, 'member_of')
    .filter(e => {
      const props = graph.getNode(e.target)?.properties as Record<string, unknown> | undefined;
      if (!props) return true; // missing target was never excluded by the old rule
      if (props.actorType !== 'group') return true;
      if (props.armyState != null) return true;
      return typeof props.groupType !== 'string';
    })
    .map(e => e.target);
}

function wrapperFactionTargets(graph: WorldGraph, agentId: string): string[] {
  return getFactionMembershipEdges(graph, agentId).map(e => e.target);
}

/**
 * Form a real company in a freshly built world and return its id.
 *
 * **Why the worlds are seeded with a company rather than merely inspected.** Measured at
 * execution: a seed-42 / seed-99 world at tick 0 contains *no companies at all* —
 * `createGroup` runs from a tick phase, not from worldgen. So a differential over the
 * bare world compares two rules on a corpus containing none of the shape they disagree
 * about, and agrees trivially. Confirmed by falsification: with
 * `isGroupMembershipTarget` sabotaged to `return false`, the per-seed differential
 * stayed **green** and only the constructed pin went red.
 *
 * Constructing the company is therefore not scaffolding — it is what makes the per-seed
 * gate mean anything. The plan asks for a golden on seeds 42+99; this is that golden with
 * the population it needs to be non-vacuous.
 */
function seedCompanyInto(state: GameState): string {
  const members = individuals(state).slice(0, 3);
  const locationId = state.graph.getOutgoingEdges(members[0].id, 'located_at')[0]?.target;
  const group = createGroup(state, {
    members,
    leaderId: members[0].id,
    locationId: locationId!,
    groupType: 'party',
    cause: 'systemic',
  });
  return group!.groupId;
}

describe('THR-1297 slice 1 — faction-membership golden (seeds 42, 99)', () => {
  for (const seed of SEEDS) {
    describe(`seed ${seed}`, () => {
      const state = buildWorld(seed);
      const companyId = seedCompanyInto(state);
      const agents = individuals(state);

      it('produces a non-empty agent population (anti-vacuity)', () => {
        expect(agents.length).toBeGreaterThan(0);
      });

      it('the corpus contains real faction memberships (anti-vacuity)', () => {
        const withFaction = agents.filter(
          a => wrapperFactionTargets(state.graph, a.id).length > 0,
        );
        expect(withFaction.length).toBeGreaterThan(0);
      });

      it('the corpus contains a live company membership (anti-vacuity)', () => {
        // Without this the differential below compares two rules on a corpus holding
        // none of the shape they disagree about — see `seedCompanyInto`.
        expect(getGroupKind(state.graph.getNode(companyId))).toBe('company');
        const membersOfCompany = agents.filter(a =>
          state.graph
            .getOutgoingEdges(a.id, 'member_of')
            .some(e => e.target === companyId),
        );
        expect(membersOfCompany.length).toBeGreaterThan(0);
        // ...and the wrapper must be excluding it for all of them.
        for (const m of membersOfCompany) {
          expect(wrapperFactionTargets(state.graph, m.id)).not.toContain(companyId);
        }
      });

      it('the wrapper agrees with the pre-THR-1297 raw read for every agent', () => {
        const divergences: Array<{ agent: string; raw: string[]; wrapper: string[] }> = [];
        for (const agent of agents) {
          const raw = rawLegacyFactionTargets(state.graph, agent.id);
          const wrapper = wrapperFactionTargets(state.graph, agent.id);
          if (raw.join('|') !== wrapper.join('|')) {
            divergences.push({ agent: agent.id, raw, wrapper });
          }
        }
        // Reported as a list rather than a bare count so a failure names the agents.
        expect(divergences).toEqual([]);
      });

      it('every group-family node in the world resolves to a known kind', () => {
        const groups = state.graph
          .getNodesByType('actor')
          .filter(n => n.properties.actorType === 'group');
        const unresolved = groups.filter(n => getGroupKind(n) === undefined).map(n => n.id);
        expect(unresolved).toEqual([]);
      });
    });
  }

  /**
   * The pin that stops the differential going vacuous.
   *
   * Worldgen does not necessarily mint a company at tick 0, so the company case is
   * *constructed* rather than hoped for: form a real company through the real
   * `createGroup`, then assert the two halves disagree in the one direction they must —
   * the raw read picks the company up as a faction, the wrapper does not.
   *
   * If this test ever passes with `rawTargets` equal to `wrapperTargets`, the company
   * membership did not land and every other assertion in this file is worthless.
   */
  it('a company membership is excluded by the wrapper and (still) caught by the raw read', () => {
    const state = buildWorld(42);
    const agents = individuals(state);
    const members = agents.slice(0, 3);
    expect(members.length).toBe(3);

    const locationId = state.graph
      .getOutgoingEdges(members[0].id, 'located_at')[0]?.target;
    expect(locationId).toBeDefined();

    const group = createGroup(state, {
      members,
      leaderId: members[0].id,
      locationId: locationId!,
      groupType: 'party',
      cause: 'systemic',
    });
    expect(group).toBeTruthy();

    const groupId = group!.groupId;
    expect(getGroupKind(state.graph.getNode(groupId))).toBe('company');

    const raw = rawLegacyFactionTargets(state.graph, members[0].id);
    const wrapper = wrapperFactionTargets(state.graph, members[0].id);

    // The company is a member_of target: the old rule excluded it, the new rule excludes
    // it, and — the point of the pin — it IS present on the unfiltered edge set.
    const unfiltered = state.graph
      .getOutgoingEdges(members[0].id, 'member_of')
      .map(e => e.target);
    expect(unfiltered).toContain(groupId);
    expect(raw).not.toContain(groupId);
    expect(wrapper).not.toContain(groupId);
    expect(raw).toEqual(wrapper);
  });
});
