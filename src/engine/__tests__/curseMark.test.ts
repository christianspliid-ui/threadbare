/**
 * curse_artifact bearer-mark tests (THR-661 — the deferred half of THR-605 Slice 2).
 *
 * `artifact.curse` ("Malediction Bound") binds a concealed per-tick quintessence
 * drain into the object — that half shipped in Slice 2 and lives in the graph
 * executor (`graphOpExecutor.artifactWards.test.ts` covers it). What was deferred
 * is the residue on the *person*: hidden marks live on `GameState.hiddenMarks`
 * rather than on graph nodes, so placing one needs the resolution-intercept path's
 * GameState. `applyCurseMark` is that half.
 *
 * The reveal assertions deliberately go through the shipped machinery
 * (`evaluateMarkReveals` / `consumeMatchingMarks`) rather than reading the marks
 * array back, so the test fails if the reveal families ever stop matching a real
 * template — the failure mode that would make the mark unrevealable in play.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { applyCurseMark } from '../ascendantExpression';
import { executeStepResult } from '../unifiedActionResolution';
import { evaluateMarkReveals, consumeMatchingMarks } from '../hiddenMarks';
import {
  CURSE_MARK_SEVERITY,
  CURSE_MARK_REVEAL_FAMILIES,
  CURSE_QUINTESSENCE_DRAIN,
} from '../../data/ascendant-expression-constants';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type { GraphOp } from '../../types/graphOp';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { AttachmentEffect } from '../../types/effects';

const ascendantId = 'asc.player';
const artifactId = 'art.blade';
const holderId = 'agent.carrier';
const TICK = 42;

/** Minimal GameState — applyCurseMark reads `graph` and mutates `hiddenMarks`. */
function makeState(graph: WorldGraph): GameState {
  return {
    graph,
    hiddenMarks: [],
    seed: 12345,
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

/** An ascendant, a cursed-to-be blade, and (optionally) someone carrying it. */
function makeGraph(opts: { holdVia?: 'possesses' | 'bonded_to' } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ascendantId, type: 'actor', name: 'The Warden',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({ id: artifactId, type: 'artifact', name: 'Grey Blade', properties: {} });
  graph.addNode({
    id: holderId, type: 'actor', name: 'Wren',
    properties: { actorType: 'individual' },
  });
  if (opts.holdVia) {
    graph.addEdge({
      id: `hold_${holderId}`, source: holderId, target: artifactId,
      type: opts.holdVia, properties: {},
    });
  }
  return graph;
}

describe('applyCurseMark — placement', () => {
  it('marks the bearer when the cursed artifact is possessed', () => {
    const state = makeState(makeGraph({ holdVia: 'possesses' }));
    const result = applyCurseMark(state, ascendantId, artifactId, TICK);

    expect(result.success).toBe(true);
    expect(result.holderId).toBe(holderId);
    expect(state.hiddenMarks).toHaveLength(1);

    const mark = state.hiddenMarks![0];
    expect(mark.targetAgentId).toBe(holderId);
    expect(mark.category).toBe('concealed_action');
    expect(mark.severity).toBe(CURSE_MARK_SEVERITY);
    expect(mark.placedTick).toBe(TICK);
    expect(mark.revealFamilies).toEqual(CURSE_MARK_REVEAL_FAMILIES);
    // The label names the object — the mark has to read as *this* curse later.
    expect(mark.label).toContain('Grey Blade');
  });

  // The graph-schema validator warns here: `bonded_to` is declared against
  // `artifact_legendary`, and this fixture bonds a plain `artifact`. That is
  // deliberate — `applyCurseMark` mirrors `executeCurseArtifact`'s `type ===
  // 'artifact'` guard, so a legendary artifact is out of scope for BOTH halves of
  // the curse (pre-existing; tracked as THR-843). The fixture exercises the
  // resolver's second edge type without changing that contract.
  it('resolves the bearer through a bonded_to edge as well as possesses', () => {
    const state = makeState(makeGraph({ holdVia: 'bonded_to' }));
    const result = applyCurseMark(state, ascendantId, artifactId, TICK);

    expect(result.holderId).toBe(holderId);
    expect(state.hiddenMarks).toHaveLength(1);
  });

  it('marks nobody when the artifact is unpossessed — and the curse still succeeds', () => {
    const state = makeState(makeGraph()); // no holder edge
    const result = applyCurseMark(state, ascendantId, artifactId, TICK);

    expect(result.success).toBe(true);
    expect(result.failSoft).toBe('unpossessed');
    expect(result.markId).toBeNull();
    expect(state.hiddenMarks).toHaveLength(0);
  });

  it('fail-softs (no throw) on a missing or non-artifact target', () => {
    const state = makeState(makeGraph({ holdVia: 'possesses' }));

    const missing = applyCurseMark(state, ascendantId, 'nope', TICK);
    expect(missing.success).toBe(false);
    expect(missing.failSoft).toBe('missing_artifact');

    const wrongType = applyCurseMark(state, ascendantId, holderId, TICK);
    expect(wrongType.success).toBe(false);
    expect(wrongType.failSoft).toBe('not_an_artifact');

    expect(state.hiddenMarks).toHaveLength(0);
  });

  it('derives a deterministic mark id — same cast, same world, same id', () => {
    const a = makeState(makeGraph({ holdVia: 'possesses' }));
    const b = makeState(makeGraph({ holdVia: 'possesses' }));

    expect(applyCurseMark(a, ascendantId, artifactId, TICK).markId)
      .toBe(applyCurseMark(b, ascendantId, artifactId, TICK).markId);
  });
});

describe('applyCurseMark — the reveal families are live, not decorative', () => {
  // Guards the THR-661 failure mode: `DIVINE_WORKING_REVEAL_FAMILIES`
  // (`hex.` / `loc.` / `artifact.`) are the ascendant's own casting families and
  // match ZERO mortal-drawable templates, so reusing them would have produced a
  // mark no bearer could ever surface. Pin the population before asserting on it.
  const mortalDrawable = UNIFIED_ACTION_TEMPLATES.filter(t =>
    !t.actorAffinities || t.actorAffinities.length === 0 || t.actorAffinities.includes('individual'),
  );

  it('has a non-empty mortal-drawable population to match against', () => {
    expect(mortalDrawable.length).toBeGreaterThan(100);
  });

  it.each(CURSE_MARK_REVEAL_FAMILIES)(
    'family "%s" prefixes at least one mortal-drawable template',
    (family) => {
      const matches = mortalDrawable.filter(t => t.id.startsWith(family));
      expect(matches.length).toBeGreaterThan(0);
    },
  );

  it('a bearer drawing a matching template sees the mark as a reveal candidate', () => {
    const state = makeState(makeGraph({ holdVia: 'possesses' }));
    applyCurseMark(state, ascendantId, artifactId, TICK);

    const revealer = mortalDrawable.find(t => t.id.startsWith(CURSE_MARK_REVEAL_FAMILIES[0]))!;
    const candidates = evaluateMarkReveals(state, holderId, revealer.id);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].mark.targetAgentId).toBe(holderId);
    expect(candidates[0].revealProbability).toBeGreaterThan(0);
  });

  it('an unrelated template does NOT surface the mark', () => {
    const state = makeState(makeGraph({ holdVia: 'possesses' }));
    applyCurseMark(state, ascendantId, artifactId, TICK);

    expect(evaluateMarkReveals(state, holderId, 'encounter.the_haggle')).toHaveLength(0);
  });

  it('the shipped consumption loop can actually consume it on a later tick', () => {
    const state = makeState(makeGraph({ holdVia: 'possesses' }));
    applyCurseMark(state, ascendantId, artifactId, TICK);
    const revealer = mortalDrawable.find(t => t.id.startsWith(CURSE_MARK_REVEAL_FAMILIES[0]))!;

    // Same tick never consumes (delayed-reveal invariant).
    const sameTick = consumeMatchingMarks(state, holderId, revealer.id, TICK);
    expect(sameTick.nextState.hiddenMarks).toHaveLength(1);

    // Later ticks roll severity * REVEAL_PROBABILITY_MULT; over a span of ticks the
    // mark is reachable. Asserting "some tick consumes it" rather than a fixed tick
    // keeps this independent of the PRNG's per-tick phase.
    const consumed = Array.from({ length: 40 }, (_, i) => TICK + 1 + i)
      .some(t => consumeMatchingMarks(state, holderId, revealer.id, t)
        .nextState.hiddenMarks!.length === 0);
    expect(consumed).toBe(true);
  });
});

describe('curse_artifact routes BOTH ways through the resolution intercept', () => {
  // The regression this guards: THR-661 adds `curse_artifact` to the intercept
  // bucket, and the op must ALSO still reach the graph executor. Route it through
  // the real `executeStepResult` with the shipped `artifact.curse` template and
  // assert both halves landed — the drain on the object, the mark on the bearer.
  const CURSE_TEMPLATE = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'artifact.curse')!;

  it('the shipped artifact.curse template still exists and carries the op', () => {
    expect(CURSE_TEMPLATE).toBeDefined();
    expect(JSON.stringify(CURSE_TEMPLATE)).toContain('curse_artifact');
  });

  it('binds the drain to the artifact AND marks the bearer in one cast', () => {
    const graph = makeGraph({ holdVia: 'possesses' });
    const state = makeState(graph);
    const ops: GraphOp[] = [{ op: 'curse_artifact', nodeId: '$target' }];
    const action = {
      actorId: ascendantId,
      targetId: artifactId,
      templateId: CURSE_TEMPLATE.id,
      currentStep: 0,
      source: 'player',
      stepOutcomes: [],
    } as unknown as UnifiedAction;

    expect(() =>
      executeStepResult(action, CURSE_TEMPLATE, 'success', ops, state, () => 0.5, TICK),
    ).not.toThrow();

    // Half 1 (THR-605 Slice 2, unchanged): the concealed drain is on the object.
    const effects = (graph.getNode(artifactId)?.properties.effects as AttachmentEffect[]) ?? [];
    expect(effects).toContainEqual({
      type: 'resource_manipulate', resource: 'quintessence', target: 'self',
      amount: -CURSE_QUINTESSENCE_DRAIN, mode: 'per_tick',
    });
    expect(graph.getNode(artifactId)?.properties.cursed).toBe(true);

    // Half 2 (THR-661, new): the residue is on the person carrying it.
    expect(state.hiddenMarks).toHaveLength(1);
    expect(state.hiddenMarks![0].targetAgentId).toBe(holderId);
  });

  it('an unpossessed artifact still gets the drain, and nobody is marked', () => {
    const graph = makeGraph(); // no holder
    const state = makeState(graph);
    const ops: GraphOp[] = [{ op: 'curse_artifact', nodeId: '$target' }];
    const action = {
      actorId: ascendantId, targetId: artifactId, templateId: CURSE_TEMPLATE.id,
      currentStep: 0, source: 'player', stepOutcomes: [],
    } as unknown as UnifiedAction;

    executeStepResult(action, CURSE_TEMPLATE, 'success', ops, state, () => 0.5, TICK);

    expect(graph.getNode(artifactId)?.properties.cursed).toBe(true);
    expect(state.hiddenMarks).toHaveLength(0);
  });
});
