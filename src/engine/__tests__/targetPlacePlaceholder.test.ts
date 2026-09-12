// @vitest-lane heavy — builds one generated world (seed 42, medium) per suite (THR-1493)
/**
 * THR-1493 — `{target:place}` names the place the scene is *about*, not the place
 * the agent happens to be standing in.
 *
 * The defect this pins: The Table That Holds arrives by seed, 12 ticks after The
 * Grateful Kin. An `encounter_seed` has no spatial field, so it fires wherever the
 * agent has drifted to — while the `reputation_with` edge the parent wrote sits on
 * the town the parent beat was about. The old openings used `{location}`, which
 * enriches to the agent's *current* position, so the scene named whatever place the
 * traveler was standing in and called it "the town that keeps a door open for them".
 * The standing was real; the prose pointed at the wrong node.
 *
 * Asserted against a **generated** world (seed 42, medium), never a fixture: the two
 * nodes this is about — the agent's current location and the parent's inherited
 * target — are only ever *different* nodes because worldgen made them so. A fixture
 * that invents both sides would pass whatever the enricher did with them
 * (`reference_fixture_invents_both_sides`).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { gatherNarrativeContext, enrichProse } from '../proseEnrichment';
import { getLocationNodes } from '../sublocationShape';
import { getAgentLocation } from '../graphQueries';
import { generateArchetypes } from '../ascendant';
import { createBalancedCosmology } from '../cosmology';
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { SLICE_TABLE_THAT_HOLDS } from '../../data/encounters/vertical-slice';

/**
 * The archetype and cosmology come from the real constructors rather than a
 * hand-written literal, for two reasons. A literal would have to invent values
 * for `AscendantArchetype`'s six other required fields, and an invented value
 * behind an `as` cast is a fixture defining the shape it is supposed to be
 * tested against. And these are the exact two calls `npm run cli -- --seed 42
 * --map medium` makes, so the world under assertion is the world the CLI builds.
 */
const ARCHETYPE = generateArchetypes(4, 42)[0];
const COSMOLOGY = createBalancedCosmology();

describe('{target:place} — the place the scene is about (THR-1493)', () => {
  let graph: WorldGraph;
  /** An agent who is standing somewhere the world actually placed them. */
  let agentId: string;
  /** The place that agent is standing in — what `{location}` would name. */
  let currentPlace: GraphNode;
  /** A *different* place, standing in for a seed's inherited target. */
  let otherPlace: GraphNode;

  beforeAll(() => {
    const { cols, rows } = MAP_SIZE_PRESETS.medium;
    const { state } = initializeGameState(ARCHETYPE, 'Test Avatar', COSMOLOGY, 42, cols, rows);
    graph = state.graph;

    const places = getLocationNodes(graph);
    // The world has to actually contain two distinct named places for this
    // invariant to mean anything — assert that before relying on it, rather than
    // discovering a one-place world as a confusing failure three lines down.
    expect(places.length).toBeGreaterThan(1);

    const actor = graph
      .getNodesByType('actor')
      .filter(a => a.properties?.actorType === 'individual')
      .find(a => {
        const loc = getAgentLocation(graph, a.id);
        return loc != null && loc.name != null && loc.name.length > 0;
      });
    expect(actor).toBeDefined();
    agentId = actor!.id;

    currentPlace = getAgentLocation(graph, agentId)!;
    const other = places.find(p => p.id !== currentPlace.id && p.name !== currentPlace.name);
    expect(other).toBeDefined();
    otherPlace = other!;
  });

  it('renders the inherited target, not the agent’s current location', () => {
    const ctx = gatherNarrativeContext(
      graph,
      agentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { targetId: otherPlace.id },
    );

    expect(enrichProse('{target:place}', ctx)).toBe(otherPlace.name);

    // The falsification arm. `{location}` must still name the *current* place on the
    // very same context — otherwise the assertion above would pass even if the two
    // tokens had collapsed into one, and the test would be pinning nothing
    // (`reference_threshold_constant_on_both_sides`). Both halves are read off one
    // generated world, so their difference is worldgen's, not the test's.
    expect(enrichProse('{location}', ctx)).toBe(currentPlace.name);
    expect(otherPlace.name).not.toBe(currentPlace.name);
  });

  it('falls back to a place, never to “the other party”, when the target is not one', () => {
    // A dead inherited target falls back to self-target in `resolveSeedInheritance`,
    // and `resolveSceneTargetContext` returns undefined for a self-target — so the
    // scene has no target block at all. A place token must still read as a place.
    const selfCtx = gatherNarrativeContext(
      graph,
      agentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { targetId: agentId },
    );
    expect(enrichProse('{target:place}', selfCtx)).toBe(currentPlace.name);
    expect(enrichProse('{target:place}', selfCtx)).not.toContain('the other party');

    // An agent-kind target is the other way it can fail to be a place.
    const otherAgent = graph
      .getNodesByType('actor')
      .find(a => a.id !== agentId && a.properties?.actorType === 'individual');
    expect(otherAgent).toBeDefined();
    const agentTargetCtx = gatherNarrativeContext(
      graph,
      agentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { targetId: otherAgent!.id },
    );
    expect(enrichProse('{target:place}', agentTargetCtx)).toBe(currentPlace.name);
    // Bare `{target}` still names the agent — the place token narrows, it does not
    // redefine the target block.
    expect(enrichProse('{target}', agentTargetCtx)).toBe(otherAgent!.name);
  });

  it('The Table That Holds’ openings name the target place and claim no journey', () => {
    const openings = Object.values(SLICE_TABLE_THAT_HOLDS.openings ?? {});
    expect(openings.length).toBeGreaterThan(0);

    for (const opening of openings) {
      // The whole point of the ticket: the opening must not read the agent's
      // current position to name the town its standing is with.
      expect(opening).toContain('{target:place}');
      expect(opening).not.toContain('{location}');
      // And it must not assert a return journey no effect performs (prose rule 7b,
      // the THR-1476 sweep's finding).
      expect(opening).not.toMatch(/returns to|comes back to|back to/i);
    }

    const ctx = gatherNarrativeContext(
      graph,
      agentId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { targetId: otherPlace.id, supportBundle: SLICE_TABLE_THAT_HOLDS.supportBundle },
    );
    for (const opening of openings) {
      const rendered = enrichProse(opening, ctx);
      expect(rendered).toContain(otherPlace.name);
      expect(rendered).not.toContain(currentPlace.name);
      // No raw token survives to the player.
      expect(rendered).not.toMatch(/\{[a-z]/i);
    }
  });
});
