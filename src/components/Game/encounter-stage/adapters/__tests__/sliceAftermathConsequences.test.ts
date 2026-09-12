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
import { isActionStepBranch } from '../../../../../types/unifiedAction';
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
 * The step index the engine actually records a decision against — read off the
 * template's decided fork, not off `aftermathConfig`.
 *
 * That direction is the point (THR-979). This fixture originally hardcoded
 * `stepIndex: 1` to match `aftermathConfig.branchOnStep: 1`, and the config was
 * wrong: `applyAgentDecidedBranches` writes against the *deciding* step, which
 * `CROSSROADS_FORK` declares as 0. Both sides of the comparison were invented
 * here, so the test agreed with a config that could never resolve in live play
 * and the defect shipped green.
 *
 * Deriving from the fork keeps the fixture honest about what the engine does;
 * the assertions below then genuinely test whether `aftermathConfig` points at
 * it. Deriving from `aftermathConfig` instead would restore the original trap.
 */
const DECIDING_STEP_INDEX = SLICE_BARGAIN_AT_CROSSROADS.steps
  .filter(isActionStepBranch)
  .find((step) => step.decidedBy)!.branchOnStep;

/**
 * A resolved crossroads action, shaped exactly as the engine leaves one — see
 * `recordDecidedChoice` in `engine/encounters/branchDecision.ts` for the
 * `step_N` / `agent_decided` fields.
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
        stepIndex: DECIDING_STEP_INDEX,
        stepId: `step_${DECIDING_STEP_INDEX}`,
        choiceId,
        choiceText: 'They chose as they are.',
        interventionType: 'agent_decided',
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

describe('THR-1476 — the ending the player reads promises nothing the seed cannot perform', () => {
  /**
   * The surface-level half of prose rule 7b, asserted through the *real* stage
   * adapter rather than against the template literals: what reaches
   * `model.aftermath` is what the encounter stage paints, so a truthful template
   * that the adapter re-decorates into a promise would still fail here.
   *
   * The untruth this pins out: `encounter_seed` has no spatial field —
   * `encounterSeeding` fires it on the agent wherever they stand — and no
   * appointment, rendezvous or return-to drive exists, so nothing brings the
   * mortal back to that crossroads. The accept ending used to congratulate them
   * for an appointment they were never made to keep.
   */
  const renderedAcceptText = (): string => {
    const aftermath = aftermathFor('negative');
    const chips = (aftermath?.consequences ?? []).map((c) =>
      c.sentence.segments.map((s) => s.text).join(''),
    );
    return [aftermath?.overview ?? '', ...chips].join('\n');
  };

  it('the accept ending names no appointment and no place the mortal must reach', () => {
    const text = renderedAcceptText();
    // Population guard: an empty render would pass every assertion below.
    expect(text.length, 'the adapter produced no aftermath text').toBeGreaterThan(80);

    expect(text).not.toMatch(/\bappointments?\b/i);
    expect(text).not.toMatch(/\bcollect it here\b/i);
    expect(text).not.toMatch(/\bcomes? back (here|to the crossroads)\b/i);
  });

  it('and still says the true thing: a claim that falls due at the full moon', () => {
    // The counterweight to the test above. Removal-only rewrites can pass a
    // "says nothing false" gate by saying nothing at all, so this pins that the
    // ending still carries the two facts the effects actually wrote — the claim
    // (`attachment_grant` with a term) and its due date (the seed's delay).
    const text = renderedAcceptText();
    expect(text).toMatch(/full moon/i);
    expect(text.toLowerCase()).toContain('claim');
  });
});
