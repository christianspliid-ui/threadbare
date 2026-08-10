/**
 * Ascendant Portrait Contract (THR-981)
 *
 * The remembrance origin choice has to survive the whole way from the
 * `AscendantIdentity` onto the ascendant's **graph node**, because that node is
 * the only thing `resolveEntityVisual` gets to look at. Every `?spawn=` /
 * `?testavatar` review route stages on the ascendant, so a break here is what
 * the director sees in exactly the sessions where encounter art is being judged.
 *
 * Why this is a contract test and not a resolver unit test: the resolver was
 * never wrong. `initializeGameStateFromIdentity` builds a `compatArchetype` to
 * reach the shared init path, `AscendantArchetype` has no origin field, and the
 * choice was dropped there — so a unit test that hands the resolver a node with
 * `originFragmentId` already set would have passed throughout the defect and
 * proved only that the fixture was written correctly. Both sides here are
 * production code: real init on one end, the real resolver on the other.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  DEV_ASCENDANT_IDENTITY,
  initializeGameStateFromIdentity,
} from '../../gameInit';
import { createAscendant } from '../../ascendant';
import { createBalancedCosmology } from '../../cosmology';
import { resolveEntityVisual } from '../../../components/shared/entityVisualResolver';
import { getAgentPortraitUrlFromProperties } from '../../../data/portrait-assets';
import {
  ORIGIN_PORTRAITS,
  getOriginPortraitUrl,
} from '../../../data/avatar-portrait-assets';
import { WORLD_SIM_TEST_TIMEOUT_MS } from '../../../testing/testTimeouts';
import { VALUE_PAIRS, type AxiologicalProfile } from '../../../types/agent';

/**
 * Neutral profile built from `VALUE_PAIRS` rather than a literal, so the fixture
 * cannot rot when the pair set changes — it is a fixture detail this contract
 * says nothing about.
 */
function neutralProfile(): AxiologicalProfile {
  return Object.fromEntries(VALUE_PAIRS.map(pair => [pair, 0])) as AxiologicalProfile;
}

describe('ascendant portrait contract', () => {
  it(
    'carries the remembrance origin onto the ascendant node and resolves to the art tier',
    { timeout: WORLD_SIM_TEST_TIMEOUT_MS },
    () => {
      const { state } = initializeGameStateFromIdentity(
        DEV_ASCENDANT_IDENTITY,
        42,
        createBalancedCosmology(),
        'small',
      );

      const ascendant = state.graph.getNode(state.ascendantId);
      expect(ascendant).toBeDefined();
      expect(ascendant?.properties.originFragmentId).toBe(
        DEV_ASCENDANT_IDENTITY.originFragmentId,
      );

      const descriptor = resolveEntityVisual({ id: state.ascendantId }, state.graph);
      expect(descriptor.kind).toBe('avatar');
      expect(descriptor.tier).toBe('art');
      expect(descriptor.src).toBe(
        getOriginPortraitUrl(DEV_ASCENDANT_IDENTITY.originFragmentId),
      );
    },
  );

  it(
    'resolves the AVATAR node — the one the review routes actually render — through the agent path',
    { timeout: WORLD_SIM_TEST_TIMEOUT_MS },
    () => {
      const { state } = initializeGameStateFromIdentity(
        DEV_ASCENDANT_IDENTITY,
        42,
        createBalancedCosmology(),
        'small',
      );

      // `?spawn=` stages on `@hero`, which resolves to the ascendant's avatar via
      // the avatar_of edge — NOT to the ascendant. This is the node whose id
      // reaches NudgePhaseShell as `focalActorId`.
      const avatarId = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of')[0]?.source;
      expect(avatarId).toBeDefined();

      const avatarNode = state.graph.getNode(avatarId!);
      // `actorType: 'individual'` is what routes it down the `agent` branch, which
      // reads only `portraitAssetPath` → archetype and cannot see an origin id.
      expect(avatarNode?.properties.actorType).toBe('individual');
      expect(avatarNode?.properties.portraitAssetPath).toBe(
        getOriginPortraitUrl(DEV_ASCENDANT_IDENTITY.originFragmentId),
      );

      // The shell hard-codes `kind: 'agent'`, so pin that exact call shape — a
      // descriptor resolved as 'avatar' here would pass while the real panel
      // still rendered a letter tile.
      const descriptor = resolveEntityVisual(
        { id: avatarId!, kind: 'agent', name: DEV_ASCENDANT_IDENTITY.mortalName },
        state.graph,
      );
      expect(descriptor.tier).toBe('art');
      expect(descriptor.src).toBe(
        getOriginPortraitUrl(DEV_ASCENDANT_IDENTITY.originFragmentId),
      );
    },
  );

  it(
    'feeds the encounter stage header a populated portraitUrl for the staged hero',
    { timeout: WORLD_SIM_TEST_TIMEOUT_MS },
    () => {
      const { state } = initializeGameStateFromIdentity(
        DEV_ASCENDANT_IDENTITY,
        42,
        createBalancedCosmology(),
        'small',
      );
      const avatarId = state.graph.getIncomingEdges(state.ascendantId, 'avatar_of')[0]?.source;

      // buildHeader's exact read: getAgentPortraitUrlFromProperties(actorNode?.properties)
      // where actorNode = graph.getNode(activeAction.actorId). Asserting the helper
      // rather than reaching through the whole stage-model builder keeps this a
      // property contract, but it is the same call on the same node.
      expect(
        getAgentPortraitUrlFromProperties(state.graph.getNode(avatarId!)?.properties),
      ).toBe(getOriginPortraitUrl(DEV_ASCENDANT_IDENTITY.originFragmentId));
    },
  );

  it('resolves through the fail-soft default for an origin with no bespoke portrait', () => {
    // `origin.dev` is deliberately absent from ORIGIN_PORTRAITS — the registry's
    // DEFAULT_ORIGIN_ID comment names it as the case the default exists for. This
    // pins that the dev identity reaches art via the default rather than by
    // someone quietly adding an `origin.dev` asset, which would make the first
    // test pass for a different reason than the one it is written to check.
    expect(ORIGIN_PORTRAITS[DEV_ASCENDANT_IDENTITY.originFragmentId]).toBeUndefined();
    expect(getOriginPortraitUrl(DEV_ASCENDANT_IDENTITY.originFragmentId)).toBe(
      ORIGIN_PORTRAITS['origin.ancient-scholar'],
    );
  });

  it('leaves the identity-less quick-start path without an origin, and that is correct', () => {
    // Bare `?view=game` picks an archetype and makes no remembrance choice, so
    // there is no origin to carry and the fallback letter tile is the designed
    // result rather than a gap. Asserted so a future change that "fixes" the
    // fallback here has to argue with this comment first.
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'shrine' },
    });

    const { ascendantId } = createAscendant(graph, {
      archetype: {
        id: 'arch.test',
        name: 'Test',
        title: 'The Test',
        description: 'contract fixture',
        sphereAlignment: { primary: 'mind', secondary: 'spirit' },
        startingDomainAffinities: {},
        personalitySeed: neutralProfile(),
        flavorText: '',
      },
      avatar: {
        name: 'Vessel',
        startLocationId: 'loc.start',
        formDescription: 'contract fixture',
      },
    });

    expect(graph.getNode(ascendantId)?.properties.originFragmentId).toBeUndefined();
    expect(resolveEntityVisual({ id: ascendantId }, graph).tier).toBe('fallback');
  });
});
