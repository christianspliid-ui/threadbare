/**
 * GraphOp pattern tests (THR-90 tasks 4 & 5).
 *
 * Task 4 — Wound as GraphOp:
 *   GAP DOCUMENTED: The design doc assumed a 'has_attachment' EdgeType exists.
 *   It does NOT exist in src/types/graph.ts (audited 2026-04-17). The correct
 *   path for wound-as-condition is add_node(type:'trait') + add_edge(type:'has_trait')
 *   with { category: 'condition', subtype: 'wound' } on the trait node.
 *   See agentAttachments.ts: conditions are has_trait edges to trait nodes.
 *
 *   BATCHING GAP: The GraphOp executor does not resolve '$newNode' as a symbolic
 *   ref in executeAddEdge (resolveRef only handles $actor, $target, $location).
 *   Wound-as-condition templates must therefore either:
 *     (a) Use two separate executeGraphOps calls (first add_node, then add_edge
 *         with the literal generated ID), or
 *     (b) Use a pre-known literal node ID.
 *   This is the supported pattern. There is no single-batch wound path today.
 *   Migration doc updated: wounds must use has_trait, not has_attachment.
 *
 * Task 5 — Trait modifier as update_node:
 *   Verified: update_node supports relative changes via string prefix syntax ('+N' / '-N').
 *   The design doc stated { delta: N } object syntax — that is INCORRECT for the
 *   current executor. Use '+0.1' string values, not { delta: 0.1 } objects.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../engine/graph';
import { executeGraphOps, resetOpCounter } from '../../engine/graphOpExecutor';
import type { GraphOpContext, GraphOp } from '../../types/graphOp';
import type { EdgeType } from '../../types/graph';

describe('GraphOp patterns (THR-90)', () => {
  let graph: WorldGraph;
  const ctx: GraphOpContext = {
    actorId: 'actor.test',
    targetId: 'loc.test',
    locationId: 'hex.test',
  };

  beforeEach(() => {
    graph = new WorldGraph();
    resetOpCounter();
    graph.addNode({ id: 'actor.test', type: 'actor', name: 'Test Actor', properties: { courage: 0.5 } });
    graph.addNode({ id: 'loc.test', type: 'location', name: 'Test Location', properties: {} });
  });

  // ─── Task 4: Wound as GraphOp via has_trait (correct path) ──────────────

  it('task 4: wound-as-condition requires two executeGraphOps calls (no $newNode resolution)', () => {
    // PATTERN: Step 1 — add the trait node, capture its generated ID.
    // The executor does NOT resolve '$newNode' in add_edge; therefore a
    // single batch cannot reference the new node by symbolic ref.
    const addNodeResult = executeGraphOps(graph, [{
      op: 'add_node',
      nodeType: 'trait',
      nodeName: 'Minor Wound',
      properties: { category: 'condition', subtype: 'wound', tier: 1 },
    }], ctx);
    expect(addNodeResult.allSucceeded).toBe(true);
    const woundNodeId = addNodeResult.results[0].createdId!;
    expect(woundNodeId).toBeDefined();

    // PATTERN: Step 2 — add has_trait edge using the literal generated ID.
    const addEdgeResult = executeGraphOps(graph, [{
      op: 'add_edge',
      edgeType: 'has_trait' as EdgeType,
      source: '$actor',
      target: woundNodeId,
    }], ctx);
    expect(addEdgeResult.allSucceeded).toBe(true);

    // Verify wound node exists with correct properties
    const woundNode = graph.getNode(woundNodeId);
    expect(woundNode).toBeDefined();
    expect(woundNode!.properties.category).toBe('condition');
    expect(woundNode!.properties.subtype).toBe('wound');

    // Verify has_trait edge connects actor → wound node
    const traitEdges = graph.getOutgoingEdges('actor.test', 'has_trait');
    const woundEdge = traitEdges.find(e => e.target === woundNodeId);
    expect(woundEdge).toBeDefined();
  });

  it('task 4 gap doc: has_attachment is not a valid EdgeType — migration must use has_trait', () => {
    // F5 note: this array is a snapshot, not a live TypeScript type check.
    // If 'has_attachment' is intentionally added to EdgeType in graph.ts, update
    // the wound migration path and remove this assertion.
    const knownEdgeTypes: EdgeType[] = [
      'contains', 'adjacent', 'has_trait', 'possesses', 'bonded_to', 'controls',
      'relates_to', 'member_of', 'belongs_to', 'thread', 'enchanted', 'warded',
      'cursed', 'blessed', 'located_at', 'avatar_of', 'performing', 'aligned_with',
      'sphere_influence', 'pursues', 'road', 'encounter_at', 'trades_with',
      'participated_in', 'occurred_at', 'constructed_by', 'commanded_by',
      'participates_in', 'knows_spell',
    ];
    expect(knownEdgeTypes).not.toContain('has_attachment');
  });

  // ─── Task 5: Trait modifier as update_node with string delta syntax ──────

  it('task 5: update_node with string +N delta increments actor property', () => {
    const result = executeGraphOps(graph, [{
      op: 'update_node',
      nodeId: '$actor',
      changes: { courage: '+0.1' },
    }], ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor.test');
    expect(actor!.properties.courage as number).toBeCloseTo(0.6, 10); // 0.5 + 0.1
  });

  it('task 5: update_node with string -N delta decrements actor property', () => {
    const result = executeGraphOps(graph, [{
      op: 'update_node',
      nodeId: '$actor',
      changes: { courage: '-0.2' },
    }], ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor.test');
    expect(actor!.properties.courage as number).toBeCloseTo(0.3, 10); // 0.5 - 0.2
  });

  it('task 5 design doc correction: { delta: N } object syntax replaces, does not increment', () => {
    // The design doc stated { delta: 0.1 } object syntax — the executor treats objects
    // as direct property replacements, NOT numeric deltas. Use '+0.1' string syntax instead.
    const result = executeGraphOps(graph, [{
      op: 'update_node',
      nodeId: '$actor',
      changes: { courage: { delta: 0.1 } },
    }], ctx);
    expect(result.allSucceeded).toBe(true);

    const actor = graph.getNode('actor.test');
    // Object replaces the value — courage is now { delta: 0.1 }, not a number
    expect(typeof actor!.properties.courage).not.toBe('number');
  });
});
