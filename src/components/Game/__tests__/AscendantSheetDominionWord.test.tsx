// @vitest-environment jsdom
/**
 * THR-1746 — "Dominion" is the god's graded hold on a world object (UL Cosmology),
 * so no other surface may say it as a label. The god sheet's Reach section used to be
 * headed "Dominion"; the heading now reads "Reaches".
 *
 * The absence arm is the one that matters: a screenshot cannot prove a word is gone.
 * Falsify: restore `<SectionHeading as="h2">Dominion</SectionHeading>` in AscendantSheet.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AscendantSheet } from '../AscendantSheet';
import { WorldGraph } from '../../../engine/graph';
import { CATEGORY_LABELS } from '../../../data/ambition-categories';
import { AMBITION_CATEGORY_WORDS } from '../../Codex/charteredKindsCodex';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';

const ASCENDANT_ID = 'asc_1';

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: { actorType: 'ascendant' },
  });
  return {
    tick: 12,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: ASCENDANT_ID,
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

const ARCHETYPE = {
  name: 'The Witness',
  sphereAlignment: { primary: 'force', secondary: 'spirit' },
  startingDomainAffinities: {},
} as unknown as AscendantArchetype;

describe('the word "Dominion" is reserved for the god\'s graded hold (THR-1746)', () => {
  it('heads the sheet\'s Reach rows "Reaches", never "Dominion"', () => {
    render(
      <AscendantSheet
        open
        onClose={() => {}}
        gameState={makeState()}
        archetype={ARCHETYPE}
        avatarName="Aurel Vane"
        sphereColor="#8899ff"
        originFragmentId="frag_1"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Reaches' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /dominion/i })).toBeNull();
  });

  it('names the mortal ambition category Supremacy on both label tables', () => {
    // The engine literal stays `dominion`; only the player word moves.
    expect(CATEGORY_LABELS.dominion).toBe('Supremacy');
    expect(AMBITION_CATEGORY_WORDS.dominion).toBe('Supremacy');
  });
});
