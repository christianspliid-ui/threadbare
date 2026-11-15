// @vitest-environment jsdom
/**
 * THR-2229 — beat 2 shows what the god did with its First: the fate line, then the
 * threshold line, then the Ordeal line, each only when its fact is on the thread.
 * And the Threads word a vanished First reads (jsdom; the Done-when is text-shaped).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgeTwilightScreen } from '../AgeTwilightScreen';
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../../../engine/gameInit';
import { computeHarvest, startTwilight } from '../../../engine/cycleEnd';
import { buildTwilightBeats } from '../../../engine/twilight';
import { getFirstId } from '../../../engine/meetingEncounter';
import { ORDEAL_LEAN_POUR } from '../../../types/journeyEngine';

function world(patch: Record<string, unknown>) {
  const base = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, undefined, 'small').state;
  devSeedTheFirst(base);
  const id = getFirstId(base.graph, base.ascendantId)!;
  const edge = base.graph.getOutgoingEdges(base.ascendantId, 'thread').find(e => e.target === id)!;
  base.graph.updateEdge(edge.id, { properties: { ...edge.properties, ...patch } as never });
  const state = startTwilight({ ...base, doomDefinition: { ...base.doomDefinition, archetype: 'breach' } });
  return { state, beats: buildTwilightBeats(state, computeHarvest(state), state.cycle) };
}

describe('THR-2229 — AgeTwilightScreen beat 2', () => {
  it('shows the threshold line, then the Ordeal line, after the fate line', () => {
    const { state, beats } = world({
      apotheosisBand: 'failure', apotheosisGodPaid: false,
      ordealOutcome: 'broken', ordealBand: 'failure', ordealGodPaid: true, ordealLean: ORDEAL_LEAN_POUR,
    });
    render(<AgeTwilightScreen beats={beats} gameState={state} primarySphere="life" remembered onContinue={() => {}} />);
    const lines = screen.getAllByTestId('age-twilight-first-line').map(p => p.textContent);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^At the threshold .+ stood alone, and \w+ fell back\.$/);
    expect(lines[1]).toMatch(/^At the Ordeal you poured yourself into the thread, and still \w+ broke\.$/);
    const section = screen.getByTestId('age-twilight-first').textContent ?? '';
    expect(section.indexOf(beats.first!.line.slice(-20))).toBeLessThan(section.indexOf('At the threshold'));
    // Law 21: the First's name in the new lines is a link, as in the fate line.
    // (EntityLink renders through the router; with none mounted it is a span of the name.)
    const firstLine = screen.getAllByTestId('age-twilight-first-line')[0];
    expect([...firstLine.querySelectorAll('*')].some(n => n.textContent === beats.first!.name)).toBe(true);
    // Law 13/14: no numerals in the new lines.
    for (const l of lines) expect(l).not.toMatch(/\d/);
  });

  it('shows no extra line when the thread holds no climax fact', () => {
    const { state, beats } = world({});
    render(<AgeTwilightScreen beats={beats} gameState={state} primarySphere="life" remembered onContinue={() => {}} />);
    expect(screen.queryAllByTestId('age-twilight-first-line')).toHaveLength(0);
  });
});
