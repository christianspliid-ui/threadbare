/**
 * Holdings — the `owns` edge and its single writer (THR-1297, slice 3).
 *
 * The plan's kill criterion for this slice is atomicity: *"Seize shows any
 * intermediate state in the atomicity test (edge moved, faces inconsistent) → stop;
 * the single-writer is the deliverable, not the verbs on top of it."* That test is
 * `seize is atomic` below, and it is written to be **falsifiable**: replacing
 * `transferHolding`'s body with a `releaseHolding` followed by a `grantHolding` must
 * turn it red. It does — verified by doing exactly that (see the sabotage note in the
 * describe block).
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { EDGE_SCHEMA } from '../../types/edgeSchema';
import {
  grantHolding,
  transferHolding,
  releaseHolding,
  razeHolding,
  ownsNode,
  reconcileHoldingFaces,
  OWNS_EDGE_REQUIRED_PROPS,
  HOLDING_ATTACHMENT_CATEGORY,
  HOLDING_SLOT_TAG,
  HOLDING_LOSS_CONDITION,
} from '../holdings';
import { getOwnedBy, getOwners, getControlledBy } from '../graphQueries';
import { getAgentAttachments } from '../agentAttachments';
import { collectAgentAttachmentInventory } from '../attachmentSlotResolver';
import { SLOT_CAPS } from '../../data/attachment-slot-constants';

const CTX = { tick: 10 };

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'agent.mira', type: 'actor', name: 'Mira', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc.mill', type: 'location', name: 'Greywater Mill',
    properties: { hexCol: 3, hexRow: 4, locationSubtype: 'hamlet', locationType: 'hamlet' },
  });
  return graph;
}

/** Every holding face `actorId` holds, read off `possesses` — the bookkeeping side. */
function faces(graph: WorldGraph, actorId: string) {
  return graph.getOutgoingEdges(actorId, 'possesses')
    .map(e => graph.getNode(e.target))
    .filter(n => n?.properties?.attachmentCategory === HOLDING_ATTACHMENT_CATEGORY);
}

describe('owns — schema', () => {
  it('is registered with the properties the writer stamps', () => {
    const row = EDGE_SCHEMA.owns;
    expect(row).toBeDefined();
    expect(row.sourceNodeType).toBe('actor');
    expect(row.targetNodeType).toEqual(['location', 'resource']);
    // Pinned against the writer's own constant so the schema row and holdings.ts
    // cannot drift apart into an edge that violates its own contract.
    expect(row.requiredProperties).toEqual([...OWNS_EDGE_REQUIRED_PROPS]);
  });

  it('is a separate edge from controls — granting a holding writes no controls edge', () => {
    // The whole reason `owns` exists rather than a `controls` reuse: ~13 faction
    // territory consumers read every incoming `controls` edge as political control,
    // and five take `[0]?.source`. If a grant leaked onto `controls`, army supply and
    // siege resolution would start seeing an individual agent as a territory holder.
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);

    expect(getControlledBy(graph, 'agent.kael')).toEqual([]);
    expect(graph.getIncomingEdges('loc.mill', 'controls')).toEqual([]);
    expect(getOwnedBy(graph, 'agent.kael').map(n => n.id)).toEqual(['loc.mill']);
  });
});

describe('grantHolding', () => {
  it('mints the edge and the bearer-side face together', () => {
    const graph = world();
    const result = grantHolding(graph, 'agent.kael', 'loc.mill', CTX, 'creation');

    expect(result.success).toBe(true);
    expect(ownsNode(graph, 'agent.kael', 'loc.mill')).toBe(true);

    const edge = graph.getOutgoingEdges('agent.kael', 'owns')[0];
    expect(edge.properties.acquiredTick).toBe(10);
    expect(edge.properties.via).toBe('creation');

    const [face] = faces(graph, 'agent.kael');
    expect(face).toBeDefined();
    expect(face!.name).toBe('Greywater Mill');
    expect(face!.properties.holdingNodeId).toBe('loc.mill');
    expect(face!.properties.slotTag).toBe(HOLDING_SLOT_TAG);
    expect(face!.properties.lossCondition).toBe(HOLDING_LOSS_CONDITION);
  });

  it('is idempotent — re-granting what is already held does not double the edge', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    const second = grantHolding(graph, 'agent.kael', 'loc.mill', { tick: 20 });

    expect(second.success).toBe(true);
    expect(graph.getOutgoingEdges('agent.kael', 'owns')).toHaveLength(1);
    expect(faces(graph, 'agent.kael')).toHaveLength(1);
  });

  it('refuses to create a second owner rather than silently making one', () => {
    // Two `owns` edges on one object is the ambiguity the `[0]?.source` sites taught
    // us to refuse at the writer. Taking someone else's holding is `transferHolding`.
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    const stolen = grantHolding(graph, 'agent.mira', 'loc.mill', CTX);

    expect(stolen.success).toBe(false);
    expect(stolen.error).toContain('already_owned_by_agent.kael');
    expect(getOwners(graph, 'loc.mill').map(n => n.id)).toEqual(['agent.kael']);
  });

  it('fail-softs on a missing node instead of throwing', () => {
    const graph = world();
    expect(grantHolding(graph, 'agent.kael', 'loc.nowhere', CTX)).toMatchObject({
      success: false, error: 'node_not_found',
    });
  });
});

describe('transferHolding — the slice kill criterion', () => {
  /**
   * SABOTAGE ARM (run by hand, recorded here because the result is the point):
   * replacing the atomic body with
   *     releaseHolding(graph, fromActorId, nodeId, ctx);
   *     return grantHolding(graph, toActorId, nodeId, ctx, via);
   * turns `seize is atomic` red — the observer fires while the object is unowned and
   * both faces are gone. Without that arm this test would pass against a two-step
   * implementation and prove nothing, which is the vacuous shape THR-1297 slice 1
   * nearly shipped (impediment #854).
   */
  it('seize is atomic — ownership is never absent and faces are never both gone', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);

    // Observe the graph on every mutation. `addEdge`/`removeEdge`/`addNode`/
    // `removeNode` all funnel through the instance, so wrapping them samples every
    // intermediate state the transfer passes through — not just the endpoints.
    const samples: Array<{ owners: number; faces: number }> = [];
    const sample = () => samples.push({
      owners: graph.getIncomingEdges('loc.mill', 'owns').length,
      faces: faces(graph, 'agent.kael').length + faces(graph, 'agent.mira').length,
    });

    for (const method of ['addEdge', 'removeEdge', 'addNode', 'removeNode', 'retargetEdgeSource'] as const) {
      const original = graph[method].bind(graph);
      (graph as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => {
        const out = (original as (...a: unknown[]) => unknown)(...args);
        sample();
        return out;
      };
    }

    const result = transferHolding(graph, 'loc.mill', 'agent.mira', { tick: 30 });
    expect(result.success).toBe(true);

    expect(samples.length).toBeGreaterThan(0);
    // The invariant: at no observed instant is the place ownerless, and at no
    // observed instant does it have two owners.
    expect(samples.every(s => s.owners === 1)).toBe(true);
    // And at no instant is the holding faceless — some bearer always shows it.
    expect(samples.every(s => s.faces >= 1)).toBe(true);
  });

  it('moves both the edge and the face to the winner', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    transferHolding(graph, 'loc.mill', 'agent.mira', { tick: 30 }, 'conquest');

    expect(ownsNode(graph, 'agent.kael', 'loc.mill')).toBe(false);
    expect(ownsNode(graph, 'agent.mira', 'loc.mill')).toBe(true);
    expect(faces(graph, 'agent.kael')).toHaveLength(0);
    expect(faces(graph, 'agent.mira')).toHaveLength(1);

    const edge = graph.getOutgoingEdges('agent.mira', 'owns')[0];
    expect(edge.properties.via).toBe('conquest');
    expect(edge.properties.seizedFrom).toBe('agent.kael');
  });

  it('seizing the unowned is a claim, not a transfer', () => {
    // The plan's fail-soft row: `transferHolding` on a node with no `owns` edge grants
    // instead of failing.
    const graph = world();
    const result = transferHolding(graph, 'loc.mill', 'agent.mira', { tick: 30 });

    expect(result.success).toBe(true);
    expect(ownsNode(graph, 'agent.mira', 'loc.mill')).toBe(true);
  });
});

describe('releaseHolding / razeHolding', () => {
  it('release retires the edge and the face, leaving the place standing', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    const result = releaseHolding(graph, 'agent.kael', 'loc.mill', { tick: 40 });

    expect(result.success).toBe(true);
    expect(getOwners(graph, 'loc.mill')).toEqual([]);
    expect(faces(graph, 'agent.kael')).toHaveLength(0);
    expect(graph.getNode('loc.mill')).toBeDefined();
  });

  it('releasing what is not held succeeds — the end state already holds', () => {
    const graph = world();
    expect(releaseHolding(graph, 'agent.kael', 'loc.mill', CTX).success).toBe(true);
  });

  it('raze retires every owner\'s claim and face', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    const result = razeHolding(graph, 'loc.mill', { tick: 50 });

    expect(result.success).toBe(true);
    expect(getOwners(graph, 'loc.mill')).toEqual([]);
    expect(faces(graph, 'agent.kael')).toHaveLength(0);
  });
});

describe('the mirror — the edge is the authority', () => {
  it('reconcile mints a face for an edge that lost one', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    // Simulate drift: the face is gone, the edge stands.
    const [face] = faces(graph, 'agent.kael');
    graph.removeNode(face!.id);
    graph.removeEdge(`possesses_${face!.id}`);
    expect(faces(graph, 'agent.kael')).toHaveLength(0);

    const { facesMinted } = reconcileHoldingFaces(graph, 'agent.kael', { tick: 60 });

    expect(facesMinted).toHaveLength(1);
    expect(faces(graph, 'agent.kael')).toHaveLength(1);
  });

  it('reconcile retires a face whose edge is gone — never the reverse', () => {
    // The direction matters: a stale face must not resurrect ownership. If reconcile
    // read the face as authority, deleting an `owns` edge anywhere in the engine
    // would silently undo itself on the next reconcile.
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    graph.removeEdge(graph.getOutgoingEdges('agent.kael', 'owns')[0].id);

    const { facesRetired } = reconcileHoldingFaces(graph, 'agent.kael', { tick: 60 });

    expect(facesRetired).toHaveLength(1);
    expect(faces(graph, 'agent.kael')).toHaveLength(0);
    expect(ownsNode(graph, 'agent.kael', 'loc.mill')).toBe(false);
  });
});

describe('the attachment sweep', () => {
  it('a holding is bucketed as a holding, never as a possession', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);

    const attachments = getAgentAttachments(graph, 'agent.kael');
    expect(attachments.holdings).toHaveLength(1);
    expect(attachments.holdings[0].name).toBe('Greywater Mill');
    expect(attachments.holdings[0].slotTag).toBe(HOLDING_SLOT_TAG);
    // The half that matters: it did NOT land in the loot bucket.
    expect(attachments.possessions).toHaveLength(0);
  });

  it('does not borrow a possession subcategory', () => {
    // `relics_talismans` is the fallback for a subcategory-less possession, and it
    // would paint a trinket's art plate and file the mill under Rings in the codex.
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);

    expect(getAgentAttachments(graph, 'agent.kael').holdings[0].subcategory).toBe('holding');
  });

  it('is uncapped by construction and pinned against the disposal sweep', () => {
    // Absent `SLOT_CAPS` row ⇒ uncapped with no exemption logic anywhere. If someone
    // later adds a cap, this goes red and they have to mean it.
    expect(SLOT_CAPS[HOLDING_SLOT_TAG]).toBeUndefined();

    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    const [row] = collectAgentAttachmentInventory(graph, 'agent.kael');

    expect(row.kind).toBe('holding');
    // Pinned: `phaseDisposalTimeout` GCs inactive items with `removeEdge`, which does
    // not fire the binding hook — a holding must never enter that window.
    expect(row.isPinned).toBe(true);
  });

  it('holds many places at once — no overflow, no deactivation', () => {
    const graph = world();
    for (let i = 0; i < 12; i++) {
      graph.addNode({
        id: `loc.town${i}`, type: 'location', name: `Town ${i}`,
        properties: { hexCol: i, hexRow: 0, locationSubtype: 'town' },
      });
      grantHolding(graph, 'agent.kael', `loc.town${i}`, CTX);
    }

    const rows = collectAgentAttachmentInventory(graph, 'agent.kael')
      .filter(r => r.kind === 'holding');
    expect(rows).toHaveLength(12);
    expect(rows.every(r => r.active)).toBe(true);
  });
});
