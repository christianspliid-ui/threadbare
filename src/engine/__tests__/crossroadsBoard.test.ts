/**
 * THR-1926 — the lean on the one decision board.
 *
 * `scoreUnifiedBoard` multiplies a held lean into the matching entry of either family
 * and records it on the entry; an unleaned board is byte-identical to the board before
 * the lean existed. Then the decision-time helpers: a toward-lean on the second road of
 * a `leaning` mortal resolves `followed`, on the third road of a `set` mortal
 * `resisted`, past the hold `lapsed_expired` — each with one trace and one toast line.
 * An encounter ranked just outside the scorer's top five still reaches the board.
 */
import { describe, it, expect } from 'vitest';
import { scoreUnifiedBoard } from '../decisionBoard';
import { prepareCrossroadsLean, resolveCrossroadsLean } from '../crossroadsDecision';
import { buildCrossroadsSnapshot, settledness, type CrossroadsLean } from '../crossroads';
import { CROSSROADS_HOLD_MAX_TICKS, CROSSROADS_LEAN_TOWARD_MULT } from '../../data/premonition-constants';

const emptyGraph = { getNode: () => null, getOutgoingEdges: () => [], getIncomingEdges: () => [] } as never;

const mk = (id: string, locationId: string, valuePerTick: number) => ({
  entry: { templateId: id, locationId, reachPrimary: 'iron' },
  valuePerTick,
  desireMultiplier: 1,
  finalScore: valuePerTick,
}) as never;

const board = (encounterCandidates: unknown[], crossroadsLean?: Pick<CrossroadsLean, 'family' | 'templateId' | 'targetId' | 'direction'>) => scoreUnifiedBoard({
  graph: emptyGraph, agentId: 'a', tick: 5,
  encounterCandidates: encounterCandidates as never,
  strategicCandidates: [],
  ...(crossroadsLean ? { crossroadsLean } : {}),
});

const lean = (templateId: string, targetId: string, tick = 5): CrossroadsLean => ({
  family: 'encounter', templateId, targetId, direction: 'toward', tick,
  sphere: 'force', essencePaid: 3, rankWhenPlaced: 1, forecastAtPlacement: 'likely',
});

describe('the board takes the lean (THR-1926)', () => {
  it('an unleaned board is identical to the board with no lean input', () => {
    const cands = [mk('duel', 'g', 0.4), mk('feast', 'g', 0.3)];
    const plain = board(cands);
    const withNull = scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: 5, encounterCandidates: cands as never, strategicCandidates: [], crossroadsLean: null,
    });
    expect(JSON.stringify(withNull)).toBe(JSON.stringify(plain));
    expect(plain.entries.every(e => e.crossroadsLean === undefined)).toBe(true);
  });

  it('multiplies only the exact instance and records it on the entry', () => {
    const cands = [mk('duel', 'g', 0.4), mk('feast', 'g', 0.3), mk('feast', 'ashby', 0.3)];
    const plain = board(cands);
    const leaned = board(cands, lean('feast', 'g'));
    const at = (b: typeof plain, loc: string) => b.entries.find(e => e.id === 'feast' && e.candidateIndex === (loc === 'g' ? 1 : 2))!;
    expect(at(leaned, 'g').score / at(plain, 'g').score).toBeCloseTo(CROSSROADS_LEAN_TOWARD_MULT, 10);
    expect(at(leaned, 'g').crossroadsLean).toBe(CROSSROADS_LEAN_TOWARD_MULT);
    expect(at(leaned, 'ashby').score).toBe(at(plain, 'ashby').score);
    expect(leaned.winner?.id).toBe('feast');
  });

  it('applies to undertakings too (by template and target)', () => {
    const strategic = [{ templateId: 'survey', targetNodeId: 'ruin_1', actorId: 'a', ambitionId: 'x' }];
    const b = (l?: Pick<CrossroadsLean, 'family' | 'templateId' | 'targetId' | 'direction'>) => scoreUnifiedBoard({
      graph: emptyGraph, agentId: 'a', tick: 5, encounterCandidates: [], strategicCandidates: strategic as never,
      ...(l ? { crossroadsLean: l } : {}),
    });
    const plain = b().entries[0];
    const away = b({ family: 'strategic_action', templateId: 'survey', targetId: 'ruin_1', direction: 'away' }).entries[0];
    expect(away.crossroadsLean).toBe(0.5);
    expect(away.score).toBeCloseTo(plain.score * 0.5, 12);
    const elsewhere = b({ family: 'strategic_action', templateId: 'survey', targetId: 'ruin_2', direction: 'away' }).entries[0];
    expect(elsewhere.score).toBe(plain.score);
  });
});

/** Decide a board once (the taken road), snapshot it, lean, then decide again. */
function leanAndDecide(scores: number[], leanRank: number) {
  const cands = scores.map((s, i) => mk(`r${i}`, 'g', s));
  const first = board(cands);
  const snapshot = buildCrossroadsSnapshot(first.entries, cands as never, [], first.winner, () => false, 5);
  const target = snapshot.options[leanRank];
  // The mortal took r0; at its next decision r0 is on cooldown and gone from the lists.
  const next = cands.slice(1);
  const decision = { rankedCandidates: next as never[], topCandidates: next as never[] };
  const prepared = prepareCrossroadsLean(lean(target.templateId, 'g'), decision as never, [], 6);
  const decided = board(decision.topCandidates, prepared.effective ?? undefined);
  const resolved = resolveCrossroadsLean(prepared, { entries: decided.entries, winner: decided.winner }, decision.topCandidates as never, [], {
    agentId: 'a', agentName: 'Kael', tick: 6, floor: 0, reception: 'devotion',
  });
  return { snapshot, resolved };
}

describe('a held lean resolves at the next decision (THR-1926)', () => {
  it("toward the second road of a leaning mortal → followed, one trace, one toast with the mortal's answer", () => {
    // After r0 is taken, the reading is r1 (0.6) vs r2 (0.4): r = 0.67, leaning.
    const { snapshot, resolved } = leanAndDecide([1, 0.6, 0.4], 1);
    expect(settledness(snapshot)).toBe('leaning');
    expect(resolved?.outcome).toBe('followed');
    expect(resolved?.leanTurned).toBe(true);
    expect(resolved?.trace.category).toBe('crossroads_lean_outcome');
    expect(resolved?.message).toMatch(/^Kael turns to .+, as you leaned\. Kael calls it faith\.$/);
  });

  it('toward the third road of a set mortal → resisted', () => {
    // Reading r1 (0.6), r2 (0.25), r3 (0.2): r = 0.42, set.
    const { snapshot, resolved } = leanAndDecide([1, 0.6, 0.25, 0.2], 2);
    expect(settledness(snapshot)).toBe('set');
    expect(resolved?.outcome).toBe('resisted');
    expect(resolved?.leanTurned).toBe(false);
    expect(resolved?.message).toMatch(/^Kael feels your hand and chooses .+ anyway\. /);
  });

  it('past CROSSROADS_HOLD_MAX_TICKS → lapsed_expired, no answer line, the board unleaned', () => {
    const cands = [mk('r0', 'g', 0.5), mk('r1', 'g', 0.4)];
    const decision = { rankedCandidates: cands, topCandidates: cands };
    const tick = 5 + CROSSROADS_HOLD_MAX_TICKS + 1;
    const prepared = prepareCrossroadsLean(lean('r1', 'g'), decision as never, [], tick);
    expect(prepared.expired).toBe(true);
    expect(prepared.effective).toBeNull();
    const decided = board(cands);
    const resolved = resolveCrossroadsLean(prepared, decided, cands as never, [], { agentId: 'a', agentName: 'Kael', tick, floor: 0 });
    expect(resolved?.outcome).toBe('lapsed_expired');
    expect(resolved?.message).toMatch(/^Your lean fades: Kael never came back to .+\.$/);
  });

  it('an encounter ranked just outside the top five is pulled up onto the board', () => {
    const ranked = [0.9, 0.8, 0.7, 0.6, 0.5, 0.45].map((s, i) => mk(`r${i}`, 'g', s));
    const decision = { rankedCandidates: ranked, topCandidates: ranked.slice(0, 5) };
    const prepared = prepareCrossroadsLean(lean('r5', 'g'), decision as never, [], 6);
    expect(prepared.pulledUp).toBe(ranked[5]);
    expect(prepared.effective?.targetId).toBe('g');
  });

  it('a target gone from the lists → lapsed_unavailable', () => {
    const cands = [mk('r0', 'g', 0.5)];
    const decision = { rankedCandidates: cands, topCandidates: cands };
    const prepared = prepareCrossroadsLean(lean('gone', 'g'), decision as never, [], 6);
    const resolved = resolveCrossroadsLean(prepared, board(cands), cands as never, [], { agentId: 'a', agentName: 'Kael', tick: 6, floor: 0 });
    expect(resolved?.outcome).toBe('lapsed_unavailable');
  });

  it('the snapshot after a resolved lean is the unleaned board (review-gate round 1)', () => {
    // A=1.0, B=0.4 (leaned ×2 → 0.8), C=0.5. A wins; the lean is cleared at this decision.
    const cands = [mk('A', 'g', 1.0), mk('B', 'g', 0.4), mk('C', 'g', 0.5)];
    const decided = board(cands, lean('B', 'g'));
    expect(decided.winner?.id).toBe('A');
    const snapshot = buildCrossroadsSnapshot(decided.entries, cands as never, [], decided.winner, () => false, 6);
    expect(snapshot.options.map(o => o.templateId)).toEqual(['C', 'B']);
    expect(snapshot.options[1].score).toBeCloseTo(0.4, 12);
    expect(settledness(snapshot)).toBe('leaning'); // 0.4 / 0.5 = 0.8
  });

  it('an override that takes another road resolves the lean against what the mortal really does', () => {
    const cands = [mk('A', 'g', 0.5), mk('B', 'g', 0.4)];
    const decision = { rankedCandidates: cands, topCandidates: cands };
    const prepared = prepareCrossroadsLean(lean('B', 'g'), decision as never, [], 6);
    const decided = board(cands, prepared.effective ?? undefined);
    expect(decided.winner?.id).toBe('B'); // the lean would have turned the board
    const resolved = resolveCrossroadsLean(prepared, decided, cands as never, [], {
      agentId: 'a', agentName: 'Kael', tick: 6, floor: 0,
      overriddenTo: { family: 'encounter', templateId: 'A', targetId: 'g' },
    });
    expect(resolved?.outcome).toBe('resisted');
    expect(resolved?.leanTurned).toBe(false);
    expect(resolved?.trace.winnerId).toBe('A');
    // The snapshot excludes the road actually taken, not the board's winner.
    const snapshot = buildCrossroadsSnapshot(decided.entries, cands as never, [], { family: 'encounter', templateId: 'A', targetId: 'g' }, () => false, 6);
    expect(snapshot.options.map(o => o.templateId)).toEqual(['B']);
  });

  it('an away lean never pulls its own road up onto the board (review-gate round 2)', () => {
    const ranked = [0.9, 0.8, 0.7, 0.6, 0.5, 0.45].map((s, i) => mk(`r${i}`, 'g', s));
    const decision = { rankedCandidates: ranked, topCandidates: ranked.slice(0, 5) };
    const prepared = prepareCrossroadsLean({ ...lean('r5', 'g'), direction: 'away' }, decision as never, [], 6);
    expect(prepared.pulledUp).toBeNull();
    expect(prepared.effective).toBeNull();
  });

  it('a malformed lean is flagged for clearing and never leans the board', () => {
    const prepared = prepareCrossroadsLean({ family: 'encounter' }, { rankedCandidates: [], topCandidates: [] }, [], 6);
    expect(prepared.malformed).toBe(true);
    expect(prepared.effective).toBeNull();
  });
});
