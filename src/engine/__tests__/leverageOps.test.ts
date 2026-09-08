/**
 * THR-1439 — leverage: stealing a secret, and the favour's whole life cycle.
 *
 * The load-bearing assertion in this file is the one about **loss**: after a theft the
 * old holder must no longer hold the mark. A `stealMark` that copied rather than moved
 * would pass every "the thief has it now" test ever written, so the thief's gain and
 * the holder's loss are asserted separately, and the graph's own outgoing index is
 * read on both sides — `retargetEdgeSource` reindexes, and a test that only read the
 * edge's `source` field would not notice if it had not.
 *
 * The favour's three verbs get both arms of every gate for the usual reason: a
 * standing bar nobody has watched refuse is not a bar. `FAVOR_STANDING_MIN` is
 * exercised from *either side* of the threshold rather than being read back out of the
 * constant, which would make the test a restatement of the code.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { stealMark, mintFavor, redeemFavor, forgiveFavor, standingSupportsFavor, isLiveFavorEdge } from '../leverageOps';
import { mintLeverageMark } from '../strategicGraphOps';
import { getUndertakingObjectType, eligibilityRefusal, enumerateObjectHandles } from '../../data/undertaking-objects';
import { FAVOR_STANDING_MIN, FAVOR_SENTIMENT_MIN } from '../../data/strategic-action-constants';

// ─── Fixtures ───────────────────────────────────────────────────────

function people(graph: WorldGraph, ...ids: readonly (readonly [string, string])[]): void {
  for (const [id, name] of ids) {
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual' } });
  }
}

/** A world where `holder` knows something about `subject`, and `thief` wants it. */
function markWorld(): WorldGraph {
  const graph = new WorldGraph();
  people(graph, ['holder', 'Hask'], ['subject', 'Lirik'], ['thief', 'Vessa']);
  mintLeverageMark(graph, 'holder', 'subject', 'hidden_debt', 0.6, 5);
  return graph;
}

/** The one mark edge in a mark world, whatever id the minting op chose. */
function theMark(graph: WorldGraph) {
  return graph.getEdgesByType('knows_secret_of')[0];
}

/** Two people whose standing is set to `score`, written as the real reputation edge. */
function standingWorld(score: number): WorldGraph {
  const graph = new WorldGraph();
  people(graph, ['actor', 'Vessa'], ['other', 'Bren']);
  graph.addEdge({
    id: 'rw', source: 'actor', target: 'other', type: 'reputation_with',
    properties: { score, lastChangedTick: 0 },
  });
  return graph;
}

const edge = (id: string) => ({ kind: 'edge' as const, edgeId: id });

// ─── Theft ──────────────────────────────────────────────────────────

describe('stealMark — the holder LOSES it', () => {
  it('moves the mark to the thief and takes it off the old holder', () => {
    const graph = markWorld();
    const markId = theMark(graph).id;

    const r = stealMark(graph, 'thief', markId, 12);
    expect(r.success).toBe(true);

    // Read through the graph's own index, not the edge object: `retargetEdgeSource`
    // reindexes, and an implementation that only rewrote `source` would fail here.
    const thiefHolds = graph.getOutgoingEdges('thief', 'knows_secret_of');
    const holderHolds = graph.getOutgoingEdges('holder', 'knows_secret_of');
    expect(thiefHolds.map(e => e.id)).toEqual([markId]);
    expect(holderHolds).toEqual([]);
  });

  it('keeps the edge id, so every reader keyed on it survives the theft', () => {
    const graph = markWorld();
    const markId = theMark(graph).id;
    stealMark(graph, 'thief', markId, 12);
    expect(graph.getEdge(markId)).toBeDefined();
    expect(graph.getEdgesByType('knows_secret_of')).toHaveLength(1);
  });

  it('stamps the provenance the sheet says *taken from* on', () => {
    const graph = markWorld();
    stealMark(graph, 'thief', theMark(graph).id, 12);
    const mark = theMark(graph);
    expect(mark.properties.source).toBe('stolen');
    expect(mark.properties.stolenFromId).toBe('holder');
    expect(mark.properties.stolenTick).toBe(12);
  });

  it('leaves the subject unchanged — a theft moves who knows, not what is known', () => {
    const graph = markWorld();
    stealMark(graph, 'thief', theMark(graph).id, 12);
    expect(theMark(graph).target).toBe('subject');
    expect(theMark(graph).properties.secretType).toBe('hidden_debt');
  });

  it('refuses a revealed mark — there is nothing left to steal', () => {
    const graph = markWorld();
    const markId = theMark(graph).id;
    graph.updateEdge(markId, { properties: { ...theMark(graph).properties, revealed: true } });
    expect(stealMark(graph, 'thief', markId, 12).error).toBe('mark_gone');
  });

  it('refuses the subject stealing the secret about themselves', () => {
    const graph = markWorld();
    expect(stealMark(graph, 'subject', theMark(graph).id, 12).error).toBe('own_mark');
  });
});

describe('seize × Agreement eligibility', () => {
  const type = getUndertakingObjectType('agreement')!;

  it('allows a thief who holds nothing on the subject and refuses one who already does', () => {
    const graph = markWorld();
    const markId = theMark(graph).id;
    expect(eligibilityRefusal(graph, type, 'control:seize', 'thief', edge(markId), 12)).toBeNull();

    mintLeverageMark(graph, 'thief', 'subject', 'other_secret', 0.4, 6);
    expect(eligibilityRefusal(graph, type, 'control:seize', 'thief', edge(markId), 12)).toBe('already_holds');
  });

  it('refuses seizing a favour — a debt cannot change creditors', () => {
    const graph = standingWorld(0.9);
    mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    const favour = graph.getEdgesByType('owes_favor')[0];
    expect(eligibilityRefusal(graph, type, 'control:seize', 'thief', edge(favour.id), 12)).toBe('not_a_secret');
  });
});

// ─── The favour's life cycle ────────────────────────────────────────

describe('mintFavor — calling in a favour', () => {
  it('mints the debt subject → holder, in pressTheMark\'s shape', () => {
    const graph = standingWorld(0.9);
    const r = mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    expect(r.success).toBe(true);

    const favour = graph.getEdgesByType('owes_favor')[0];
    // The one who OWES is the source. Every existing reader depends on this direction.
    expect(favour.source).toBe('other');
    expect(favour.target).toBe('actor');
    expect(favour.properties.context).toBe('called_in');
    expect(favour.properties.redeemed).toBe(false);
    expect(favour.properties.broken).toBe(false);
    expect(favour.properties.magnitude as number).toBeGreaterThan(0);
  });

  it('spends the standing it rests on', () => {
    const graph = standingWorld(0.9);
    mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    expect(graph.getEdge('rw')!.properties.score as number).toBeLessThan(0.9);
  });

  it('spends the standing even when the call goes unanswered — asking is what costs', () => {
    const graph = standingWorld(0.9);
    const r = mintFavor(graph, 'actor', 'other', 10, 'proj', 'failure');
    expect(r.success).toBe(false);
    expect(r.error).toBe('call_unanswered');
    expect(graph.getEdgesByType('owes_favor')).toEqual([]);
    expect(graph.getEdge('rw')!.properties.score as number).toBeLessThan(0.9);
  });

  it('refuses a second favour while one is outstanding, and allows one once it is spent', () => {
    const graph = standingWorld(0.9);
    mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    expect(mintFavor(graph, 'actor', 'other', 11, 'proj', 'success').error).toBe('favour_outstanding');

    const favour = graph.getEdgesByType('owes_favor')[0];
    redeemFavor(graph, 'actor', favour.id, 12);
    expect(mintFavor(graph, 'actor', 'other', 13, 'proj', 'success').success).toBe(true);
  });

  it('refuses a favour from oneself', () => {
    const graph = standingWorld(0.9);
    expect(mintFavor(graph, 'actor', 'actor', 10, 'proj', 'success').error).toBe('self_target');
  });
});

describe('standingSupportsFavor — the bar sits above the neutral default', () => {
  it('refuses just below the threshold and allows just above it', () => {
    expect(standingSupportsFavor(standingWorld(FAVOR_STANDING_MIN - 0.01), 'actor', 'other')).toBe(false);
    expect(standingSupportsFavor(standingWorld(FAVOR_STANDING_MIN), 'actor', 'other')).toBe(true);
  });

  it('refuses the neutral default every stranger carries', () => {
    // `Accepted` is 0.5 and means "no quarrel", not "owes you something".
    expect(standingSupportsFavor(standingWorld(0.5), 'actor', 'other')).toBe(false);
  });

  it('falls back to the seeded relates_to sentiment when no score has been written', () => {
    const graph = new WorldGraph();
    people(graph, ['actor', 'Vessa'], ['other', 'Bren']);
    graph.addEdge({
      id: 'rel', source: 'actor', target: 'other', type: 'relates_to',
      properties: { sentiment: FAVOR_SENTIMENT_MIN, strength: 0.5 },
    });
    expect(standingSupportsFavor(graph, 'actor', 'other')).toBe(true);

    graph.updateEdge('rel', { properties: { sentiment: FAVOR_SENTIMENT_MIN - 0.05, strength: 0.5 } });
    expect(standingSupportsFavor(graph, 'actor', 'other')).toBe(false);
  });

  it('refuses two strangers with no edge between them at all', () => {
    const graph = new WorldGraph();
    people(graph, ['actor', 'Vessa'], ['other', 'Bren']);
    expect(standingSupportsFavor(graph, 'actor', 'other')).toBe(false);
  });
});

describe('use × Standing eligibility', () => {
  const type = getUndertakingObjectType('standing')!;

  it('refuses a thin standing and allows a good one', () => {
    expect(eligibilityRefusal(standingWorld(0.5), type, 'use', 'actor', edge('rw'), 10))
      .toBe('standing_too_thin');
    expect(eligibilityRefusal(standingWorld(0.9), type, 'use', 'actor', edge('rw'), 10)).toBeNull();
  });

  it('refuses a standing with a place — a town owes nobody a favour', () => {
    const graph = standingWorld(0.9);
    graph.addNode({ id: 'town', type: 'location', name: 'Greycity', properties: { hexCol: 1, hexRow: 1 } });
    graph.addEdge({
      id: 'rwl', source: 'actor', target: 'town', type: 'reputation_with',
      properties: { score: 0.9, lastChangedTick: 0 },
    });
    expect(eligibilityRefusal(graph, type, 'use', 'actor', edge('rwl'), 10)).toBe('not_a_person');
  });

  it('refuses somebody else\'s standing', () => {
    expect(eligibilityRefusal(standingWorld(0.9), type, 'use', 'other', edge('rw'), 10))
      .toBe('not_their_standing');
  });
});

describe('redeemFavor and forgiveFavor — the favour\'s two endings', () => {
  function owedWorld(): WorldGraph {
    const graph = standingWorld(0.9);
    mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    return graph;
  }

  it('redeeming spends the debt and pays the creditor standing', () => {
    const graph = owedWorld();
    const favour = graph.getEdgesByType('owes_favor')[0];
    const before = graph.getEdge('rw')!.properties.score as number;

    expect(redeemFavor(graph, 'actor', favour.id, 12).success).toBe(true);
    expect(graph.getEdge(favour.id)!.properties.redeemed).toBe(true);
    expect(isLiveFavorEdge(graph.getEdge(favour.id)!.properties)).toBe(false);
    expect(graph.getEdge('rw')!.properties.score as number).toBeGreaterThan(before);
  });

  it('forgiving keeps the record and earns the debtor\'s regard', () => {
    const graph = owedWorld();
    const favour = graph.getEdgesByType('owes_favor')[0];

    expect(forgiveFavor(graph, 'actor', favour.id, 12).success).toBe(true);
    // The edge stays — the world remembers somebody was once owed.
    expect(graph.getEdge(favour.id)).toBeDefined();
    expect(graph.getEdge(favour.id)!.properties.forgivenTick).toBe(12);
    expect(isLiveFavorEdge(graph.getEdge(favour.id)!.properties)).toBe(false);
    // The gain runs debtor → creditor: the debtor thinks better of them for it.
    const gratitude = graph.getOutgoingEdges('other', 'reputation_with').find(e => e.target === 'actor');
    expect(gratitude!.properties.score as number).toBeGreaterThan(0.5);
  });

  it('refuses the debtor spending or forgiving their own debt', () => {
    const graph = owedWorld();
    const favour = graph.getEdgesByType('owes_favor')[0];
    expect(redeemFavor(graph, 'other', favour.id, 12).error).toBe('not_owed_to_actor');
    expect(forgiveFavor(graph, 'other', favour.id, 12).error).toBe('not_owed_to_actor');
  });

  it('refuses a favour that is already spent', () => {
    const graph = owedWorld();
    const favour = graph.getEdgesByType('owes_favor')[0];
    redeemFavor(graph, 'actor', favour.id, 12);
    expect(forgiveFavor(graph, 'actor', favour.id, 13).error).toBe('favour_gone');
  });
});

// ─── The kind's two classes ─────────────────────────────────────────

describe('Agreement enumerates both classes, one handle per ordered pair', () => {
  const type = getUndertakingObjectType('agreement')!;

  it('offers a mark and a favour between different pairs as two objects', () => {
    const graph = markWorld();
    graph.addEdge({
      id: 'rw2', source: 'thief', target: 'holder', type: 'reputation_with',
      properties: { score: 0.9, lastChangedTick: 0 },
    });
    mintFavor(graph, 'thief', 'holder', 10, 'proj', 'success');

    expect(enumerateObjectHandles(graph, type)).toHaveLength(2);
  });

  it('collapses a mark and a favour on the SAME ordered pair to one handle, the mark winning', () => {
    const graph = new WorldGraph();
    people(graph, ['a', 'Vessa'], ['b', 'Bren']);
    mintLeverageMark(graph, 'a', 'b', 'hidden_debt', 0.6, 5);
    // A favour running a → b: the same ordered pair as the mark above.
    graph.addEdge({
      id: 'of', source: 'a', target: 'b', type: 'owes_favor',
      properties: { magnitude: 0.5, context: 'pressed', grantedTick: 5, redeemed: false, broken: false },
    });

    const handles = enumerateObjectHandles(graph, type);
    expect(handles).toHaveLength(1);
    expect(graph.getEdge(handles[0].kind === 'edge' ? handles[0].edgeId : '')!.type).toBe('knows_secret_of');
  });

  it('drops a spent favour and a revealed mark — a record is not an object', () => {
    const graph = standingWorld(0.9);
    mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    expect(enumerateObjectHandles(graph, type)).toHaveLength(1);

    redeemFavor(graph, 'actor', graph.getEdgesByType('owes_favor')[0].id, 12);
    expect(enumerateObjectHandles(graph, type)).toEqual([]);
  });
});

describe('use / destroy × Agreement eligibility per class', () => {
  const type = getUndertakingObjectType('agreement')!;

  it('a mark is pressed and exposed by its holder, not by its subject', () => {
    const graph = markWorld();
    const markId = theMark(graph).id;
    expect(eligibilityRefusal(graph, type, 'use', 'holder', edge(markId), 12)).toBeNull();
    expect(eligibilityRefusal(graph, type, 'use', 'subject', edge(markId), 12)).toBe('not_the_holder');
    expect(eligibilityRefusal(graph, type, 'destroy', 'subject', edge(markId), 12)).toBe('not_the_holder');
  });

  it('a favour is spent and forgiven by its CREDITOR — the opposite end from the mark', () => {
    const graph = standingWorld(0.9);
    mintFavor(graph, 'actor', 'other', 10, 'proj', 'success');
    const favourId = graph.getEdgesByType('owes_favor')[0].id;

    // The creditor is the edge's *target*, which is why the ownership rule had to open.
    expect(eligibilityRefusal(graph, type, 'use', 'actor', edge(favourId), 12)).toBeNull();
    expect(eligibilityRefusal(graph, type, 'destroy', 'actor', edge(favourId), 12)).toBeNull();
    expect(eligibilityRefusal(graph, type, 'use', 'other', edge(favourId), 12)).toBe('not_owed_to_actor');
  });
});
