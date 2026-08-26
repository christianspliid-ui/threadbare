/**
 * THR-1275 part 1 — `$artifact`, so a possession chip can be about the possession.
 *
 * The package critic's P1 finding on The Beast in the Granary: there was no anchor
 * form for a minted artifact, and `spawn_artifact` keys its node
 * `artifact_spawned_<encounterId>_<reactionId>_<i>_<tick>` — an id carrying the tick
 * and the effect index, so no author can write it. The only literal
 * `classifyAnchorDeclaration` accepts is an attachment template, which an artifact is
 * not. So every `possession` chip in the corpus could anchor only the *holder*: the
 * brief discipline's "don't make every chip about a person" enforced structurally, in
 * the wrong direction.
 *
 * Resolved as the sentinel rather than by blessing holder-anchoring, because THR-1156's
 * ratified position is that a chip anchors a **real graph object** and the possession
 * is the object the sentence is about.
 *
 * ## Falsification
 *
 * Three arms are written against a specific wrong answer rather than against
 * "something else":
 *
 *  • **Classification** — pre-fix, `$artifact` fell past every sentinel branch into
 *    the literal-id arm and was rejected as "resolves to no shipped attachment
 *    template". That error tells an author to pick a different anchor, not that the
 *    right one is missing, which is why the enumeration arm is here too.
 *  • **The mint gate** — a `$artifact` chip on a template that spawns nothing must go
 *    **red** through `chipAnchorViolations`, the path that actually ships. Without
 *    that arm the sentinel would be a fail-open that renders as plain text and looks
 *    like a styling choice (Law 21). Deleting the `mintsArtifact === false` branch
 *    turns it green, which is the whole point of asserting it.
 *  • **Holder disambiguation** — the fixture mints two artifacts carrying the same
 *    `sourceEncounterId` on the same tick, one held by the actor and one not, and the
 *    one held by the actor sorts *second*. So a resolver that fell back to id order
 *    or to insertion order returns a specific wrong node, not a coincidentally right
 *    one.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../engine/graph';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import { chipAnchorViolations } from '../compositionContract';
import {
  ANCHOR_SENTINEL_ARTIFACT,
  classifyAnchorDeclaration,
  resolveAnchorDeclaration,
} from '../chipAnchorDeclarations';

const ENCOUNTER_ID = 'encounter.hunt.the_beast_in_the_granary';

/** A world where `ENCOUNTER_ID` has just minted an artifact into the hero's hands. */
function buildWorld(options: { readonly heldByActor?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Maret',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'artifact_spawned_the_beast_1', type: 'artifact', name: 'The Granary Key',
    properties: { sourceEncounterId: ENCOUNTER_ID, spawnedAtTick: 40, tier: 'common' },
  });
  if (options.heldByActor !== false) {
    graph.addEdge({
      id: 'possesses_actor-hero_artifact_spawned_the_beast_1',
      source: 'actor-hero', target: 'artifact_spawned_the_beast_1', type: 'possesses',
      properties: { spawnedAtTick: 40, sourceEncounterId: ENCOUNTER_ID },
    });
  }
  return graph;
}

function context(graph: WorldGraph, over: Record<string, unknown> = {}) {
  return {
    graph,
    actorId: 'actor-hero',
    targetId: undefined,
    castNodeIdByKey: new Map<string, string>(),
    encounterTemplateId: ENCOUNTER_ID,
    ...over,
  } as Parameters<typeof resolveAnchorDeclaration>[1];
}

/** A template with one chip on its fallback, and the effects it is told to author. */
function chipShape(
  entityId: string,
  effects: readonly Record<string, unknown>[],
): UnifiedActionTemplate {
  return {
    id: 'encounter.test.thr1275_fixture',
    name: 'THR-1275 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'The key is yours.',
        changes: [{
          id: 'fixture.the_granary_key',
          kind: 'possession',
          title: 'The Granary Key',
          detail: 'The key hangs at their belt now.',
          polarity: 'gain',
          category: 'possession',
          direction: 'gain',
          stateNoun: { text: 'the granary key', entityId, visualKind: 'artifact' },
        }],
        reactions: [{ id: 'fixture.take', label: 'Take it', intent: 'Pocket it.', effects }],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

const SPAWNS = [{ kind: 'spawn_artifact', category: 'tool', tier: 'common', nameOverride: 'The Granary Key' }];
const SPAWNS_NOTHING = [{ kind: 'favor_creation', magnitudeRange: [0.2, 0.4], context: 'a debt' }];

describe('THR-1275 — `$artifact` is a chip anchor sentinel', () => {
  const noCastKeys = { supportKeys: new Set<string>() };

  it('classifies as its own form rather than falling to the literal-id arm', () => {
    expect(classifyAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, noCastKeys)).toEqual({
      ok: true,
      form: 'artifact',
    });
  });

  it('is offered by name when an unknown sentinel is rejected', () => {
    // A stale enumeration hides the one sentinel that would have solved the
    // author's problem — the failure mode THR-1130 named for `$target`.
    const verdict = classifyAnchorDeclaration('$loot', noCastKeys);
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain('$artifact');
  });

  it('is refused on a template that mints no artifact', () => {
    const verdict = classifyAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, {
      supportKeys: new Set<string>(),
      mintsArtifact: false,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toContain('spawn_artifact');
  });

  it('resolves to the artifact this encounter minted', () => {
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, context(buildWorld())))
      .toBe('artifact_spawned_the_beast_1');
  });

  it('prefers the artifact the actor actually holds when a tick tie is otherwise unbreakable', () => {
    const graph = buildWorld();
    // Same encounter, same tick, resolved by somebody else across the map. It sorts
    // FIRST, so id order returns it and only the `possesses` edge says otherwise.
    graph.addNode({
      id: 'artifact_spawned_the_beast_0', type: 'artifact', name: 'The Granary Key',
      properties: { sourceEncounterId: ENCOUNTER_ID, spawnedAtTick: 40, tier: 'common' },
    });
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, context(graph)))
      .toBe('artifact_spawned_the_beast_1');
  });

  it('takes the most recent mint when the actor holds neither', () => {
    const graph = buildWorld({ heldByActor: false });
    graph.addNode({
      id: 'artifact_spawned_the_beast_9', type: 'artifact', name: 'The Granary Key',
      properties: { sourceEncounterId: ENCOUNTER_ID, spawnedAtTick: 99, tier: 'common' },
    });
    // The veil renders straight after the write, so the newest node is this
    // playthrough's rather than an earlier run of the same encounter elsewhere.
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, context(graph)))
      .toBe('artifact_spawned_the_beast_9');
  });

  it('finds a legendary mint too — the tier is not the author\'s to name', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'artifact_spawned_legend', type: 'artifact_legendary', name: 'Hollowmere',
      properties: { sourceEncounterId: ENCOUNTER_ID, spawnedAtTick: 12, tier: 'legendary' },
    });
    graph.addEdge({
      id: 'bonded_to_actor-hero_artifact_spawned_legend',
      source: 'actor-hero', target: 'artifact_spawned_legend', type: 'bonded_to',
      properties: {},
    });
    // `spawn_artifact` routes legendary tiers to a different node type and a
    // `bonded_to` edge. A search that read only `artifact`/`possesses` would report
    // the corpus's most significant mints as unanchorable.
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, context(graph)))
      .toBe('artifact_spawned_legend');
  });

  it('fails soft to undefined when nothing was minted', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-hero', type: 'actor', name: 'Maret', properties: { actorType: 'individual' },
    });
    // The chip renders as plain text — the tier it had before it declared anything —
    // rather than a link to nowhere (NFP #4).
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, context(graph))).toBeUndefined();
  });

  it('fails soft when the caller has no template id to search by', () => {
    expect(
      resolveAnchorDeclaration(
        ANCHOR_SENTINEL_ARTIFACT,
        context(buildWorld(), { encounterTemplateId: undefined }),
      ),
    ).toBeUndefined();
  });

  it('ignores an artifact minted by a different encounter', () => {
    const graph = buildWorld({ heldByActor: false });
    graph.getNode('artifact_spawned_the_beast_1')!.properties.sourceEncounterId = 'encounter.other';
    expect(resolveAnchorDeclaration(ANCHOR_SENTINEL_ARTIFACT, context(graph))).toBeUndefined();
  });

  describe('the shipping gate', () => {
    it('raises no anchor violation on a possession chip whose template mints one', () => {
      // Scoped to the anchor rule on purpose — the bare fixture also trips unrelated
      // contract rules, and asserting "no violations at all" would make this a
      // referendum on the whole contract.
      expect(chipAnchorViolations(chipShape(ANCHOR_SENTINEL_ARTIFACT, SPAWNS))).toEqual([]);
    });

    it('rejects the same chip when the template mints nothing', () => {
      const violations = chipAnchorViolations(chipShape(ANCHOR_SENTINEL_ARTIFACT, SPAWNS_NOTHING));
      expect(violations).toHaveLength(1);
      expect(violations[0]).toContain('fixture.the_granary_key');
      expect(violations[0]).toContain('spawn_artifact');
    });

    it('still accepts `$actor` on a template that mints nothing', () => {
      // The mint check must gate only the sentinel that needs it. A guard that
      // leaked onto the other forms would reject most of the shipped corpus.
      expect(chipAnchorViolations(chipShape('$actor', SPAWNS_NOTHING))).toEqual([]);
    });
  });
});
