// @vitest-environment jsdom
/**
 * THR-1754 — the Rite of the Thread surface, rendered.
 *
 * Pins the faces a screenshot cannot hold: the opening names the real mortal,
 * *Bond without a hand* waves an unplayed rite through, it is absent while a
 * test is in play (the test offers "Stay silent"), and the bond-only card offers
 * the two-card hand with the exit above it.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { ThreadingRite } from '../ThreadingRite';
import type { PendingThreadingRite } from '../../../engine/threadingRite';
import type { StoredHungerId } from '../../../types/hunger';

const ASC = 'asc';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'ketterwell', type: 'location', name: 'Ketterwell', properties: { locationSubtype: 'village' } });
  g.addNode({
    id: 'hadrel',
    type: 'actor',
    name: 'Hadrel Vosk',
    properties: {
      actorType: 'individual',
      gender: 'male',
      primaryReach: 'iron',
      secondaryReach: 'heart',
      axiologicalProfile: { mercy_ruthlessness: 0.2 },
      domainCapabilities: { iron: 40, heart: 20 },
    },
  });
  g.addEdge({ id: 'loc', source: 'hadrel', target: 'ketterwell', type: 'located_at', properties: {} });
  g.addEdge({ id: 'thr', source: ASC, target: 'hadrel', type: 'thread', properties: { courtPosition: 'watched' } });
  return g;
}

function renderRite(shape: PendingThreadingRite['shape'], ordinal: number) {
  const onComplete = vi.fn();
  const onBondWithoutHand = vi.fn();
  render(
    <ThreadingRite
      graph={world()}
      rite={{ agentId: 'hadrel', ascendantId: ASC, ordinal, shape, tick: 10 }}
      worldSeed={42}
      primarySphere="life"
      hungerId={'hunger.witness' as StoredHungerId}
      essencePool={{ mind: 40, life: 40 }}
      onComplete={onComplete}
      onBondWithoutHand={onBondWithoutHand}
    />,
  );
  return { onComplete, onBondWithoutHand };
}

afterEach(cleanup);

describe('THR-1754 — ThreadingRite', () => {
  it('the short rite opens on the real mortal, in their real place', () => {
    renderRite('short', 2);
    expect(screen.getByTestId('threading-rite').dataset.riteShape).toBe('short');
    expect(screen.getByTestId('threading-rite-name').textContent).toBe('Hadrel Vosk');
    expect(screen.getByTestId('threading-rite-opening-line').textContent)
      .toBe('Your thread finds Hadrel Vosk in Ketterwell. He does not look up from the work. He feels it all the same.');
    expect(screen.getByText('Your second thread')).toBeTruthy();
    expect(screen.queryByTestId('threading-rite-first-line')).toBeNull();
  });

  it('Bond without a hand waves an unplayed rite through, by button or Escape', () => {
    const a = renderRite('short', 2);
    fireEvent.click(screen.getByTestId('threading-rite-without-hand'));
    expect(a.onBondWithoutHand).toHaveBeenCalledTimes(1);
    cleanup();
    const b = renderRite('short', 3);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(b.onBondWithoutHand).toHaveBeenCalledTimes(1);
  });

  it('once a test is in play the exit is gone, so a played test is never discarded', () => {
    const { onBondWithoutHand } = renderRite('short', 2);
    fireEvent.click(screen.getByTestId('threading-rite-begin'));
    expect(screen.getByTestId('threading-rite').dataset.riteStage).toBe('tests');
    expect(screen.queryByTestId('threading-rite-without-hand')).toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onBondWithoutHand).not.toHaveBeenCalled();
  });

  it('a card-route First says so in the opening', () => {
    renderRite('full_no_sensing', 1);
    expect(screen.getByTestId('threading-rite-first-line').textContent)
      .toBe('No mortal has carried your thread before. Hadrel Vosk is your First.');
  });

  it('the fourth thread is the bond-only card with a two-card hand', () => {
    const { onBondWithoutHand } = renderRite('bond_only', 4);
    expect(screen.queryByTestId('threading-rite')).toBeNull();
    expect(screen.getByTestId('reveal-card-frame')).toBeTruthy();
    expect(screen.getByText('Your fourth thread')).toBeTruthy();
    const hand = screen.getByTestId('threading-rite-bond-only-hand');
    expect(hand.textContent).toContain('Still the room');
    expect(hand.textContent).toContain('Say their name');
    expect(hand.textContent).not.toContain('Show the old debt');
    fireEvent.click(screen.getByTestId('threading-rite-without-hand'));
    expect(onBondWithoutHand).toHaveBeenCalledTimes(1);
  });
});
