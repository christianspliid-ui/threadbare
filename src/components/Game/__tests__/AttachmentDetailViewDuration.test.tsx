// @vitest-environment jsdom
/**
 * THR-1484 — the Duration section renders for a condition granted by a real writer.
 *
 * The sibling suite (`AttachmentDetailView.test.tsx`) hands the component a
 * literal `{ ticksRemaining: 8, totalTicks: 20 }`. That proves the component
 * renders a Duration row when handed one, which was never in doubt — and it passes
 * identically whether or not any writer in the engine produces that shape. It is
 * the fixture-invents-both-sides shape, and it is why a defect that blanked the
 * Duration row for 13 of 14 live condition edges went unnoticed.
 *
 * These tests own the other half: nothing here is hand-authored. Each drives a
 * **real** grant path into a real graph, reads it back through the **real**
 * `getAgentAttachments`, and hands the result to the real component. Break a writer's
 * field name and the Duration row disappears here exactly as it does in the game.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttachmentDetailView } from '../AttachmentDetailView';
import type { AttachmentDetailData } from '../AttachmentDetailView';
import { WorldGraph } from '../../../engine/graph';
import { getAgentAttachments } from '../../../engine/agentAttachments';
import { instantiateReward } from '../../../engine/rewardPool';
import { processEncounterConditions } from '../../../engine/phaseEncounterTraits';

const HERO = 'actor-hero';
const TICK = 10;
const PHASE_COMBAT_ENCOUNTER_ID = 'enc.test.combat';

vi.mock('../../../data/encounter-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../data/encounter-content')>();
  return {
    ...actual,
    getAnyEncounterById: (id: string) =>
      id === PHASE_COMBAT_ENCOUNTER_ID
        ? { id, category: 'combat', threatRating: 'hard' }
        : actual.getAnyEncounterById(id),
  };
});

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero',
    properties: { actorType: 'individual' },
  });
  return graph;
}

/** The real reader's output, shaped as the sheet receives it. Never hand-authored. */
function conditionFromGraph(graph: WorldGraph, traitId: string): AttachmentDetailData {
  const entry = getAgentAttachments(graph, HERO).conditions.find(c => c.id === traitId);
  expect(entry, `expected a granted condition ${traitId}`).toBeDefined();
  return entry as unknown as AttachmentDetailData;
}

describe('THR-1484 — Duration renders for really-granted conditions', () => {
  it('renders Duration for a reward-pool condition (the highest-volume writer)', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'tpl.condition.gale_touched', type: 'trait', name: 'Gale-Touched',
      properties: { subcategory: 'condition', ticksRemaining: 20, tier: 1, tags: ['#condition'] },
    });
    instantiateReward(graph, 'tpl.condition.gale_touched', HERO, TICK);

    const granted = conditionFromGraph(graph, `reward_${HERO}_${TICK}_tpl.condition.gale_touched`);
    render(<AttachmentDetailView attachment={granted} onBack={vi.fn()} />);

    // The section heading is the assertion: before the fix `totalTicks` came back
    // undefined, the `ticksRemaining != null && totalTicks` gate failed, and this
    // heading was absent from the sheet entirely.
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText(/remaining/)).toBeTruthy();
  });

  it('renders Duration for a phase-path condition', () => {
    const graph = buildGraph();
    processEncounterConditions(
      graph, HERO, PHASE_COMBAT_ENCOUNTER_ID,
      /* stepSuccess */ false, /* isCompleted */ true, TICK,
    );

    const granted = conditionFromGraph(graph, 'trait.condition.wounded');
    render(<AttachmentDetailView attachment={granted} onBack={vi.fn()} />);

    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText(/remaining/)).toBeTruthy();
  });
});
