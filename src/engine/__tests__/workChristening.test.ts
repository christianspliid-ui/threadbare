/**
 * Christening, the failure register, and the possessive fix — THR-1297 §5 (slice 4).
 *
 * Three seams meet here, and each is asserted against the shape it replaces rather
 * than only against the shape it produces:
 *
 *  - `renderNameTemplate` — the trailing-s bug. Every arm is paired with an actor
 *    whose name ends in `s`, because that is the *only* input under which the old
 *    raw-substitution renderer was wrong. A test using "Kael" throughout passes
 *    identically before and after the fix.
 *  - Name survival across owners — the property is that a name *does not move*, so
 *    the assertions are about what stayed the same.
 *  - Face-name refresh — asserted against the stale value, not just the fresh one.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { renderNameTemplate, recordFailureScar } from '../strategicActionLifecycle';
import { classifyFailureResidue } from '../undertakingCheckpoints';
import {
  grantHolding,
  transferHolding,
  razeHolding,
  refreshHoldingFaceNames,
  reconcileHoldingFaces,
  HOLDING_ATTACHMENT_CATEGORY,
} from '../holdings';

const CTX = { tick: 10 };

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.silas', type: 'actor', name: 'Silas', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'agent.kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc.mill', type: 'location', name: 'Greywater Mill',
    properties: { hexCol: 3, hexRow: 4, locationSubtype: 'hamlet' },
  });
  return graph;
}

function faceFor(graph: WorldGraph, actorId: string, nodeId: string) {
  return graph.getOutgoingEdges(actorId, 'possesses')
    .map(e => graph.getNode(e.target))
    .find(n => n?.properties?.attachmentCategory === HOLDING_ATTACHMENT_CATEGORY
      && n?.properties?.holdingNodeId === nodeId);
}

describe('renderNameTemplate — the trailing-s bug in eight authored templates', () => {
  it("renders {actor}'s through the possessive rule for an s-ending name", () => {
    // The old renderer produced "Silas's Workshop at Greywater Mill".
    expect(renderNameTemplate("{actor}'s Workshop at {location}", 'Silas', 'Greywater Mill'))
      .toBe("Silas' Workshop at Greywater Mill");
  });

  it('is unchanged for an ordinary name — the fix is not a regression', () => {
    expect(renderNameTemplate("{actor}'s Workshop at {location}", 'Kael', 'Greywater Mill'))
      .toBe("Kael's Workshop at Greywater Mill");
  });

  it.each([
    ["{actor}'s Workshop at {location}", "Silas' Workshop at Greywater Mill"],
    ["{actor}'s Court at {location}", "Silas' Court at Greywater Mill"],
    ["{actor}'s Order at {location}", "Silas' Order at Greywater Mill"],
    ["{actor}'s Warehouse at {location}", "Silas' Warehouse at Greywater Mill"],
    ["{actor}'s Guild Chapter at {location}", "Silas' Guild Chapter at Greywater Mill"],
    ["{actor}'s Research Circle at {location}", "Silas' Research Circle at Greywater Mill"],
    ["{actor}'s Garrison at {location}", "Silas' Garrison at Greywater Mill"],
  ])('shipped template %s', (template, expected) => {
    expect(renderNameTemplate(template, 'Silas', 'Greywater Mill')).toBe(expected);
  });

  it('leaves the non-possessive "of {actor}" templates alone', () => {
    // These three carry no apostrophe, so the possessive rule must not touch them —
    // the recon list named them among the "eight", which it should not have.
    expect(renderNameTemplate('House of {actor} at {location}', 'Silas', 'Greywater Mill'))
      .toBe('House of Silas at Greywater Mill');
    expect(renderNameTemplate('Shrine of {actor} at {location}', 'Silas', 'Greywater Mill'))
      .toBe('Shrine of Silas at Greywater Mill');
    expect(renderNameTemplate('Consecrated Ground at {location}', 'Silas', 'Greywater Mill'))
      .toBe('Consecrated Ground at Greywater Mill');
  });

  it('never leaves a stray apostrophe-s behind', () => {
    // The failure mode of substituting `{actor}` first: "Silas' 's Workshop".
    const out = renderNameTemplate("{actor}'s Workshop at {location}", 'Silas', 'Greywater Mill');
    expect(out).not.toMatch(/'\s*'s/);
    expect(out).not.toMatch(/\{/);
  });

  it('degrades to Unknown rather than blank when a name is missing', () => {
    expect(renderNameTemplate("{actor}'s Workshop at {location}", undefined, undefined))
      .toBe("Unknown's Workshop at Unknown");
  });

  it('renders the shared legacy template both old hand-rolled arms now use', () => {
    expect(renderNameTemplate("{actor}'s {thing} at {location}", 'Silas', 'Greywater Mill', 'Warehouse'))
      .toBe("Silas' Warehouse at Greywater Mill");
    expect(renderNameTemplate("{actor}'s {thing} at {location}", 'Kael', 'Greywater Mill', 'Guild Chapter'))
      .toBe("Kael's Guild Chapter at Greywater Mill");
  });
});

describe('the failure-name register (review ruling 2.2)', () => {
  /**
   * **Why this is a unit test and not CLI evidence.** A scar is written only for a
   * *visible* failure, and visibility is `everInterrupted` — which is stamped when a
   * checkpoint presents as an interrupt, which requires a threaded (watched) agent.
   * A CLI world has no thread edges at all, so every CLI failure classifies `clean`
   * and correctly writes nothing: a 167-tick seed-42 run found zero scars, which is
   * the designed behaviour rather than a gap. The register is therefore unreachable
   * from the CLI by construction, and asserting it there would be asserting the
   * absence and calling it proof.
   */
  function failedProject(over: Record<string, unknown> = {}) {
    return {
      projectId: 'proj_failed',
      actorId: 'agent.silas',
      templateId: 'strategic_build_warehouse',
      targetNodeId: 'loc.mill',
      ...over,
    } as never;
  }

  it('writes a named scar onto the site', () => {
    const graph = world();
    const name = recordFailureScar(graph, failedProject(), 42);

    const scars = graph.getNode('loc.mill')?.properties?.failureScars as Array<Record<string, unknown>>;
    expect(scars).toHaveLength(1);
    expect(scars[0].name).toBe(name);
    expect(scars[0].tick).toBe(42);
    expect(scars[0].actorId).toBe('agent.silas');
    expect(scars[0].templateId).toBe('strategic_build_warehouse');
  });

  it('names the scar for its actor, honouring the possessive rule', () => {
    const graph = world();
    const name = recordFailureScar(graph, failedProject(), 42);
    expect(name!.startsWith("Silas'")).toBe(true);
  });

  it('accumulates rather than overwriting — a site can be tried twice', () => {
    const graph = world();
    recordFailureScar(graph, failedProject({ projectId: 'p1' }), 10);
    recordFailureScar(graph, failedProject({ projectId: 'p2', actorId: 'agent.kael' }), 20);

    const scars = graph.getNode('loc.mill')?.properties?.failureScars as unknown[];
    expect(scars).toHaveLength(2);
  });

  it('falls back to the origin when there is no target', () => {
    const graph = world();
    const name = recordFailureScar(
      graph, failedProject({ targetNodeId: undefined, originLocationId: 'loc.mill' }), 42,
    );
    expect(name).toBeDefined();
    expect(graph.getNode('loc.mill')?.properties?.failureScars).toHaveLength(1);
  });

  it('writes nothing when there is no site at all', () => {
    const graph = world();
    expect(recordFailureScar(
      graph, failedProject({ targetNodeId: undefined, originLocationId: undefined }), 42,
    )).toBeUndefined();
  });

  it('writes nothing when the site node is gone', () => {
    const graph = world();
    expect(recordFailureScar(graph, failedProject({ targetNodeId: 'loc.vanished' }), 42))
      .toBeUndefined();
  });

  it('is gated on the VISIBLE residue class — a clean failure writes nothing', () => {
    // The gate itself, asserted where the lifecycle reads it. Without this arm the
    // suite would prove a scar can be written and never that it is withheld.
    expect(classifyFailureResidue({ everInterrupted: true } as never))
      .toBe('undertaking_failed_visible');
    expect(classifyFailureResidue({ everInterrupted: false } as never))
      .toBe('undertaking_failed_clean');
    expect(classifyFailureResidue({} as never)).toBe('undertaking_failed_clean');
  });
});

describe('names outlive owners (THR-1291 §3)', () => {
  it('a transfer does not rename the world object', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    const before = graph.getNode('loc.mill')?.name;

    transferHolding(graph, 'loc.mill', 'agent.silas', CTX);

    expect(graph.getNode('loc.mill')?.name).toBe(before);
    expect(graph.getNode('loc.mill')?.name).toBe('Greywater Mill');
  });

  it("a transfer carries the work's name onto the new owner's face, not the new owner's name", () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    transferHolding(graph, 'loc.mill', 'agent.silas', CTX);

    const face = faceFor(graph, 'agent.silas', 'loc.mill');
    expect(face?.name).toBe('Greywater Mill');
  });

  it('a raze retires the name into the site nameEchoes', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);

    razeHolding(graph, 'loc.mill', { tick: 42 });

    const echoes = graph.getNode('loc.mill')?.properties?.nameEchoes as Array<{ name: string; retiredTick: number }>;
    expect(echoes).toHaveLength(1);
    expect(echoes[0].name).toBe('Greywater Mill');
    expect(echoes[0].retiredTick).toBe(42);
  });

  it('razing an unowned node records nothing — there was no holding to retire', () => {
    const graph = world();
    razeHolding(graph, 'loc.mill', CTX);
    expect(graph.getNode('loc.mill')?.properties?.nameEchoes).toBeUndefined();
  });
});

describe('holding faces follow a christened name', () => {
  it('refreshes a face whose world object was renamed after the grant', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    // The stale shape slice 3's checkpoint predicted: face minted at grant time,
    // work christened a moment later in the same completion block.
    expect(faceFor(graph, 'agent.kael', 'loc.mill')?.name).toBe('Greywater Mill');

    graph.updateNode('loc.mill', { name: 'The Saltway Hold' });
    expect(faceFor(graph, 'agent.kael', 'loc.mill')?.name).toBe('Greywater Mill'); // still stale

    const updated = refreshHoldingFaceNames(graph, 'loc.mill');

    expect(updated).toHaveLength(1);
    expect(faceFor(graph, 'agent.kael', 'loc.mill')?.name).toBe('The Saltway Hold');
  });

  it('updates the mechanical summary alongside the name', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    graph.updateNode('loc.mill', { name: 'The Saltway Hold' });
    refreshHoldingFaceNames(graph, 'loc.mill');

    expect(faceFor(graph, 'agent.kael', 'loc.mill')?.properties?.mechanicalSummary)
      .toBe('Holds The Saltway Hold.');
  });

  it('is a no-op when the face is already current — idempotent', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    expect(refreshHoldingFaceNames(graph, 'loc.mill')).toHaveLength(0);
  });

  it('reconcile treats a stale name as the drift it is', () => {
    const graph = world();
    grantHolding(graph, 'agent.kael', 'loc.mill', CTX);
    graph.updateNode('loc.mill', { name: 'The Saltway Hold' });

    const result = reconcileHoldingFaces(graph, 'agent.kael', CTX);

    expect(result.facesRenamed).toHaveLength(1);
    expect(result.facesMinted).toHaveLength(0);
    expect(faceFor(graph, 'agent.kael', 'loc.mill')?.name).toBe('The Saltway Hold');
  });

  it('refresh on a node nobody owns is harmless', () => {
    const graph = world();
    expect(() => refreshHoldingFaceNames(graph, 'loc.mill')).not.toThrow();
    expect(refreshHoldingFaceNames(graph, 'loc.nonexistent')).toHaveLength(0);
  });
});
