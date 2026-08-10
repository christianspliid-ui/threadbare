// @vitest-environment jsdom
/**
 * ArmySheet — army representation locks (THR-1023).
 *
 * Before THR-1023 this sheet rendered "Full army sheet coming in a future
 * update" for every force (UI Law 21). These tests fail against that build.
 *
 * The fixture is a real army: shape and values taken from "The Iron Covenant —
 * Host" in a seed-42 medium world at tick 60 (verified via CLI). Note the node
 * is `type: 'actor'` with an `armyState` bag — NOT `type: 'army'`, which is the
 * wrong-noun query that made THR-1023 believe armies were unreachable.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArmySheet } from '../ArmySheet';
import { WorldGraph } from '../../../engine/graph';

function graphWithHost(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_0',
    type: 'location',
    name: 'Ardenmor Keep',
    properties: { locationSubtype: 'capital' },
  } as never);
  graph.addNode({
    id: 'army_iron_covenant_57',
    type: 'actor',
    name: 'The Iron Covenant — Host',
    properties: {
      actorType: 'group',
      armyState: {
        size: 'host',
        objective: { type: 'conquer', targetNodeId: 'loc_0', estimatedAttrition: 0 },
        supplyTier: 'supplied',
        // Raw magnitudes the sheet must NOT surface (Law 13).
        headcount: 10000,
        cohesion: 94.14999999999999,
        cohesionMax: 100,
        maintenanceCost: 10,
        supply: 82,
        supplyMax: 100,
        raisedTick: 57,
      },
    },
  } as never);
  return graph;
}

describe('ArmySheet — army representation (THR-1023)', () => {
  it('Law 21: renders real content, not a "coming soon" stub', () => {
    render(
      <ArmySheet
        name="The Iron Covenant — Host"
        armyId="army_iron_covenant_57"
        graph={graphWithHost()}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText(/coming in a future update/i)).toBeNull();
    // The objective, as a sentence, with the target resolved to its name.
    expect(screen.getByText('Marching to take Ardenmor Keep.')).toBeTruthy();
  });

  it('carries its canonical visual (Law 1) and identity block in words', () => {
    render(
      <ArmySheet
        name="The Iron Covenant — Host"
        armyId="army_iron_covenant_57"
        graph={graphWithHost()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTestId('army-sheet-visual')).toBeTruthy();
    expect(screen.getByText('Host')).toBeTruthy();
    // 94.15 / 100 → the top cohesion band, as a word.
    expect(screen.getByText('Ironbound')).toBeTruthy();
    expect(screen.getByText('Well provisioned')).toBeTruthy();
  });

  it('Law 13: never surfaces headcount, cohesion, supply or upkeep as numbers', () => {
    const { container } = render(
      <ArmySheet
        name="The Iron Covenant — Host"
        armyId="army_iron_covenant_57"
        graph={graphWithHost()}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/10000|10,000/);
    expect(container.textContent).not.toMatch(/94/);
    expect(container.textContent).not.toMatch(/\d+\s*\/\s*\d+/);
    expect(container.textContent).not.toMatch(/\d+%/);
  });

  it('Law 14: never surfaces an internal key — size, tier or objective type', () => {
    const { container } = render(
      <ArmySheet
        name="The Iron Covenant — Host"
        armyId="army_iron_covenant_57"
        graph={graphWithHost()}
        onClose={() => {}}
      />,
    );

    expect(container.textContent).not.toMatch(/\bhost\b/); // lowercase key; "Host" is the word
    expect(container.textContent).not.toMatch(/supplied|conquer|armyState/);
  });

  it('NFP #4: an army with no objective reads as mustered, not as a blank', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'army_idle',
      type: 'actor',
      name: 'The Ashen Warband',
      properties: {
        actorType: 'group',
        armyState: { size: 'warband', objective: null, cohesion: 12, cohesionMax: 30 },
      },
    } as never);

    const { container } = render(
      <ArmySheet name="The Ashen Warband" armyId="army_idle" graph={graph} onClose={() => {}} />,
    );

    expect(screen.getByText(/Mustered, with no march ordered yet/i)).toBeTruthy();
    // 12 / 30 = 0.4 → "Badly frayed", the share-based band (an absolute scale
    // would call a 12-of-30 warband the same as a 12-of-100 host).
    expect(screen.getByText('Badly frayed')).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });

  it('NFP #4: an objective whose target is gone falls back rather than dangling', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'army_lost',
      type: 'actor',
      name: 'The Straying Host',
      properties: {
        actorType: 'group',
        armyState: {
          size: 'host',
          objective: { type: 'conquer', targetNodeId: 'loc_vanished' },
        },
      },
    } as never);

    const { container } = render(
      <ArmySheet name="The Straying Host" armyId="army_lost" graph={graph} onClose={() => {}} />,
    );

    expect(screen.getByText(/Mustered, with no march ordered yet/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/loc_vanished/);
  });

  it('NFP #4: an unresolvable node still renders a designed body, never a blank', () => {
    const { container } = render(
      <ArmySheet
        name="The Vanished Company"
        armyId="missing_id"
        graph={new WorldGraph()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/Nothing further is recorded/i)).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
});
