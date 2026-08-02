/**
 * THR-971 Done-when, proven against the real shipped slice content rather than
 * a fixture: playing `encounter.slice.bargain_at_crossroads` to resolution must
 * show a seed chip naming the follow-up it actually plants, and the ending that
 * plants nothing must show no seed chip at all.
 *
 * The falsification case is the point. A taxonomy that always finds a seed is
 * not evidence the seed is real — these two tests are the same template, the
 * same adapter, and the same code path, separated only by which outcome band
 * the encounter ended on.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { SLICE_BARGAIN_AT_CROSSROADS } from '../../../../../data/encounters/vertical-slice';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { UnifiedAction } from '../../../../../types/unifiedAction';
import { buildUnifiedEncounterStageModel } from '../buildUnifiedEncounterStageModel';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.traveler',
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.crossroads', type: 'location', name: 'The Wayside Crossroads', properties: {} });
  return graph;
}

/**
 * A resolved crossroads action. `choiceHistory` selects the aftermath variant —
 * `branchOnStep: 1`, so the step-1 choice decides which ending resolves.
 */
function buildResolvedAction(choiceId: string): UnifiedAction {
  return {
    actionId: 'ua_crossroads_1',
    actorId: 'agent.traveler',
    templateId: SLICE_BARGAIN_AT_CROSSROADS.id,
    targetId: 'loc.crossroads',
    scale: 'local',
    source: 'agent',
    startTick: 10,
    currentStep: 1,
    stepProgress: 0,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    stepOutcomes: ['success', 'success'],
    choiceHistory: [
      {
        stepIndex: 1,
        stepId: 'step-1',
        choiceId,
        choiceText: 'the pick',
        interventionType: 'withdrawn',
        essenceSpent: 0,
        probabilityBoost: 0,
        tick: 11,
      },
    ],
    aftermathSummary: {
      encounterId: SLICE_BARGAIN_AT_CROSSROADS.id,
      outcome: 'success',
      overview: 'The crossroads empties.',
      changes: [],
    },
  };
}

function buildNotification(): EncounterNotification {
  return {
    id: 'notif-crossroads',
    agentId: 'agent.traveler',
    agentName: 'Kael Thornweaver',
    courtPosition: 'the_first',
    encounterId: SLICE_BARGAIN_AT_CROSSROADS.id,
    encounterName: SLICE_BARGAIN_AT_CROSSROADS.name,
    prose: 'A stranger at the crossroads.',
    choices: [],
    createdTick: 10,
    autoResolveTick: null,
    viewed: true,
    resolved: true,
  };
}

function aftermathFor(choiceId: string) {
  const model = buildUnifiedEncounterStageModel({
    template: SLICE_BARGAIN_AT_CROSSROADS,
    activeAction: buildResolvedAction(choiceId),
    notification: buildNotification(),
    agentName: 'Kael Thornweaver',
    threadTier: 'strong',
    graph: buildGraph(),
    essence: 5,
  });
  return model.aftermath;
}

/** Which variant a choice id resolves to, read off the template rather than assumed. */
const VARIANT_CHOICE_IDS = Object.keys(SLICE_BARGAIN_AT_CROSSROADS.aftermathConfig?.variants ?? {});

describe('THR-971 — the crossroads ending admits what it planted', () => {
  it('the template still declares the variants this test depends on', () => {
    // Guards the two tests below from silently going vacuous if the slice is
    // re-authored: a missing variant would otherwise fall through to `fallback`
    // and both cases would agree by accident.
    expect(VARIANT_CHOICE_IDS).toEqual(expect.arrayContaining(['negative', 'positive']));
  });

  it('the accept ending shows a seed chip naming the Full Moon Collection', () => {
    const aftermath = aftermathFor('negative');
    const seeds = aftermath?.consequences?.filter((c) => c.kind === 'seed') ?? [];

    expect(seeds).toHaveLength(1);
    expect(seeds[0].kindLabel).toBe('SEED');
    expect(seeds[0].tone).toBe('seed');
    expect(seeds[0].sentence.segments.map((s) => s.text).join('')).toContain('falls due at the full moon');
  });

  it('FALSIFICATION: the refuse ending plants nothing and shows no seed chip', () => {
    const aftermath = aftermathFor('positive');
    const seeds = aftermath?.consequences?.filter((c) => c.kind === 'seed') ?? [];

    expect(seeds).toHaveLength(0);
  });

  it('never prints a magnitude on a chip', () => {
    const aftermath = aftermathFor('negative');
    for (const chip of aftermath?.consequences ?? []) {
      expect(chip.sentence.segments.map((s) => s.text).join('')).not.toMatch(/\d/);
    }
  });
});
