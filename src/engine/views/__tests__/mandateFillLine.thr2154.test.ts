/**
 * THR-2154 — the goal says what fills it: the Mandate row leads with the hunger's own
 * words (`def.description`, not the stage description), counts the mortals bound to
 * the god, and says their deeds count.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { MandateDefinition, MandateState } from '../../../types/mandate';
import { selectMandateRow, countBoundMortals } from '../subjects/godSheet';
import { mandateFillLine, MANDATE_RAISED_BY_LINE } from '../../../data/ascendant-bar-content';

const ASC = 'asc';

const DEF = {
  id: 'm1',
  type: 'remembered',
  name: 'Gather',
  description: 'Build a devoted community of followers bound to your court.',
  primarySphere: 'life',
  secondarySphere: 'spirit',
  stages: [
    { stage: 'setup', description: 'Establish the opening momentum before the first omen ripens.', conditions: [] },
    { stage: 'escalation', description: 'Escalate.', conditions: [] },
    { stage: 'culmination', description: 'Culminate.', conditions: [] },
  ],
} as unknown as MandateDefinition;

const MSTATE = { currentStage: 'setup', progress: 0.2, primaryDelta: 0 } as unknown as MandateState;

/** A god with an avatar, the First (when `bound >= 1`) and `bound - 1` more threaded mortals. */
function stateWith(bound: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'avatar', type: 'actor', name: 'Vessel', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'av', source: 'avatar', target: ASC, type: 'avatar_of', properties: {} });
  for (let i = 0; i < bound; i++) {
    const id = `m${i}`;
    graph.addNode({ id, type: 'actor', name: `Mortal ${i}`, properties: { actorType: 'individual' } });
    graph.addEdge({
      id: `th${i}`, source: ASC, target: id, type: 'thread',
      properties: i === 0 ? { courtPosition: 'the_first' } : {},
    });
  }
  return { graph, ascendantId: ASC, mandateDefinition: DEF, mandateState: MSTATE } as unknown as GameState;
}

describe('selectMandateRow — THR-2154', () => {
  it('leads with the hunger, not the stage', () => {
    const row = selectMandateRow(stateWith(1))!;
    expect(row.flavorLine).toBe(DEF.description);
    expect(row.flavorLine).not.toContain('opening momentum');
  });

  it('n = 0: only the god fills it', () => {
    const row = selectMandateRow(stateWith(0))!;
    expect(row.boundCount).toBe(0);
    expect(row.fillLine).toBe('Filled by what you raise in Life and Spirit.');
  });

  it('n = 1: the one mortal bound to you', () => {
    const row = selectMandateRow(stateWith(1))!;
    expect(row.boundCount).toBe(1);
    expect(row.fillLine).toBe('Filled by what you and the one mortal bound to you raise in Life and Spirit.');
  });

  it('n = 3: the count is spelled out, the avatar is not counted', () => {
    const row = selectMandateRow(stateWith(3))!;
    expect(row.boundCount).toBe(3);
    expect(row.fillLine).toBe('Filled by what you and the three mortals bound to you raise in Life and Spirit.');
  });

  it('a threaded artifact is not a mortal', () => {
    const s = stateWith(1);
    s.graph.addNode({ id: 'relic', type: 'artifact', name: 'Relic', properties: {} });
    s.graph.addEdge({ id: 'thr', source: ASC, target: 'relic', type: 'thread', properties: {} });
    expect(countBoundMortals(s)).toBe(1);
  });

  it('a dead mortal keeps its thread but is not counted', () => {
    const s = stateWith(3);
    s.graph.getNode('m1')!.properties.deceased = true;
    s.graph.getNode('m2')!.properties.deceasedTick = 40; // an Aspect echo
    expect(countBoundMortals(s)).toBe(1);
  });

  it('fails soft on a missing ascendant', () => {
    expect(countBoundMortals({ graph: new WorldGraph(), ascendantId: '' } as unknown as GameState)).toBe(0);
  });

  it('the fill line survives a hunger with one sphere or none', () => {
    expect(mandateFillLine(0, 'zero', ['Life'])).toBe('Filled by what you raise in Life.');
    expect(mandateFillLine(2, 'two', [])).toBe('Filled by what you and the two mortals bound to you raise in your spheres.');
  });

  it('the detail line names the bound mortals', () => {
    expect(MANDATE_RAISED_BY_LINE).toBe('Raised by your hand and the deeds of the mortals bound to you');
  });
});
