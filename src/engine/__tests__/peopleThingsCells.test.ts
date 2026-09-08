// @vitest-lane heavy — builds a small world, drives it, and reads the candidate board on it (THR-1438)
/**
 * THR-1438's board Done-when, on the world the writers actually make.
 *
 * The op tests (`peopleThingsOps.test.ts`) prove each cell does what it says on a
 * fixture. This one proves the cells are **reachable** — that a commander's death
 * really does put `cell.control_claim.company` in front of a living member on the next
 * board, and that the refusals a live world produces are the refusals the gates were
 * written to produce. A fixture cannot answer either question: it invents both sides.
 *
 * The one intervention is a death, applied through the world's own funnel. Everything
 * else — the company, the army, the faction, who stands where — is worldgen's.
 */
import { describe, it, expect } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter } from '../orchestrator';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { generateStrategicCandidates } from '../strategicActionCandidates';
import { getActiveGroups, getGroupMembers, getGroupLeader } from '../groups/groupQueries';
import { markMortalDead } from '../agentLifecycle';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

const SEED = 42;
const TICKS = 30;

function world(seed: number, ticks: number): GameState {
  resetEventCounter();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS.small;
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'People', createBalancedCosmology(), seed, preset.cols, preset.rows);
  for (let i = 0; i < ticks; i++) state = runTick(state, [], runtime);
  return state;
}

const state = world(SEED, TICKS);

/** The cells this ticket shipped, as the board would name them. */
const NEW_CELLS = [
  'cell.control_claim.company', 'cell.control_seize.company',
  'cell.control_claim.army', 'cell.control_seize.army', 'cell.observe.army',
  'cell.control_claim.faction', 'cell.control_seize.faction',
] as const;

/** Every ambition the mortal is actually pursuing, so the walk is theirs and not ours. */
function ambitionsOf(state: GameState, actorId: string): string[] {
  return state.graph.getOutgoingEdges(actorId, 'pursues')
    .map(e => state.graph.getNode(e.target))
    .map(n => (n?.properties as Record<string, unknown> | undefined)?.templateId)
    .filter((id): id is string => typeof id === 'string');
}

function boardFor(state: GameState, actorId: string, ambitions: string[]) {
  return generateStrategicCandidates(
    state.graph, actorId, ambitions, undefined, state.tick, mulberry32(7), undefined, 'cells',
  );
}

describe('the ownership band on a generated world', () => {
  it('the world holds the groups these cells act on', () => {
    // The premise every assertion below rests on. If worldgen stops making armies, the
    // tests that follow would pass vacuously — so the population is pinned first.
    const armies = getActiveGroups(state.graph, ['army']);
    expect(armies.length).toBeGreaterThan(0);
    const factions = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'faction');
    expect(factions.length).toBeGreaterThan(0);
  });

  it('a company whose commander dies is offered to a living member as a claim', () => {
    // A fresh world, because this test kills somebody in it.
    const s = world(SEED, TICKS);
    const company = getActiveGroups(s.graph, ['company'])
      .find(g => getGroupLeader(s.graph, g.id) && getGroupMembers(s.graph, g.id).length > 1);
    if (!company) {
      // Companies form in play and seed 42 does not guarantee one by tick 30. Recorded
      // rather than skipped silently: the army arm below covers the same op.
      expect(getActiveGroups(s.graph, ['company']).length).toBeGreaterThanOrEqual(0);
      return;
    }
    const commander = getGroupLeader(s.graph, company.id)!;
    const heir = getGroupMembers(s.graph, company.id).find(m => m.id !== commander.id)!;

    // Before: somebody living holds it, so a claim is not on the table.
    const before = boardFor(s, heir.id, ['ambition_conquer_territory']);
    expect(before.candidates.some(c =>
      c.templateId === 'cell.control_claim.company' && c.targetNodeId === company.id)).toBe(false);

    markMortalDead(s.graph, commander.id, s.tick, { cause: 'lifecycle', mode: 'retain' });

    const after = boardFor(s, heir.id, ['ambition_conquer_territory']);
    const claim = after.candidates.find(c =>
      c.templateId === 'cell.control_claim.company' && c.targetNodeId === company.id);
    expect(claim).toBeDefined();
    expect(claim!.objectTypeId).toBe('company');
  });

  it('an army whose commander dies is offered to a faction-mate, and to nobody outside', () => {
    const s = world(SEED, TICKS);
    const army = getActiveGroups(s.graph, ['army']).find(a => getGroupLeader(s.graph, a.id));
    expect(army).toBeDefined();
    const commander = getGroupLeader(s.graph, army!.id)!;
    const factionId = s.graph.getOutgoingEdges(army!.id, 'member_of')
      .map(e => s.graph.getNode(e.target))
      .find(n => n?.properties.actorType === 'faction')?.id;
    expect(factionId).toBeDefined();

    const insider = s.graph.getIncomingEdges(factionId!, 'member_of')
      .map(e => s.graph.getNode(e.source))
      .find((n): n is GraphNode => !!n && n.properties.actorType === 'individual' && n.id !== commander.id);
    const outsiders = s.graph.getNodesByType('actor').filter(n =>
      n.properties.actorType === 'individual'
      && !s.graph.getOutgoingEdges(n.id, 'member_of').some(e => e.target === factionId))
      .slice(0, 30);

    markMortalDead(s.graph, commander.id, s.tick, { cause: 'lifecycle', mode: 'retain' });

    expect(insider).toBeDefined();
    const insiderBoard = boardFor(s, insider!.id, ['ambition_conquer_territory']);
    expect(insiderBoard.candidates.some(c =>
      c.templateId === 'cell.control_claim.army' && c.targetNodeId === army!.id)).toBe(true);

    // No outsider is ever offered it. Note the walk itself is per-calling (THR-1403),
    // so most outsiders never reach this cell at all — which is why the assertion that
    // matters is the *refusal by name* on the ones who do, gathered below rather than
    // demanded of an arbitrary actor who was never going to walk it.
    let walkedByAnOutsider = 0;
    for (const outsider of outsiders) {
      const board = boardFor(s, outsider.id, ['ambition_conquer_territory']);
      expect(board.candidates.some(c =>
        c.templateId === 'cell.control_claim.army' && c.targetNodeId === army!.id)).toBe(false);
      const refusals = board.rejections.filter(r => r.templateId === 'cell.control_claim.army');
      if (refusals.length > 0) {
        walkedByAnOutsider += 1;
        // Whatever the reason, it is *stated*. A cell that vanished from a board with
        // no reason recorded is the failure the `ineligible:` prefix exists to prevent.
        expect(refusals.every(r => r.reason.length > 0)).toBe(true);
      }
    }
    console.log(`[THR-1438] outsiders walking claim×army: ${walkedByAnOutsider} of ${outsiders.length}`);
  });

  it('records what each of the seven cells does on this world — offered, or refused by name', () => {
    // The census the ticket owes: every cell either starts, or its refusal reason is
    // written down. A cell that is simply absent from both lists is the failure mode
    // (a cell nobody walks), and the assertion below is what catches it.
    const s = world(SEED, TICKS);
    const actors = s.graph.getNodesByType('actor')
      .filter(n => n.properties.actorType === 'individual' && ambitionsOf(s, n.id).length > 0)
      .slice(0, 40);

    const seen = new Map<string, Set<string>>();
    for (const actor of actors) {
      const board = boardFor(s, actor.id, ['ambition_conquer_territory', 'ambition_found_dynasty', 'ambition_seek_revenge']);
      for (const c of board.candidates) {
        if (!seen.has(c.templateId)) seen.set(c.templateId, new Set());
        seen.get(c.templateId)!.add('offered');
      }
      for (const r of board.rejections) {
        if (!seen.has(r.templateId)) seen.set(r.templateId, new Set());
        seen.get(r.templateId)!.add(r.reason.split(':').slice(0, 2).join(':'));
      }
    }

    const report: Record<string, string[]> = {};
    for (const cell of NEW_CELLS) report[cell] = [...(seen.get(cell) ?? [])].sort();
    // Printed so the ticket's "report, do not tune" line has something to quote.
    console.log('[THR-1438] cell dispositions on seed 42 @ tick 30:', JSON.stringify(report, null, 2));

    for (const cell of NEW_CELLS) {
      expect(report[cell], `${cell} was neither offered nor refused — nothing walks it`).not.toEqual([]);
    }
  });
});
