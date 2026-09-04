/**
 * THR-1411 — the authored hand must reach the veil carrying its stance.
 *
 * The gate this replaces (`encounterVeilChoiceLaws.test.tsx`) mounts
 * `ChoiceBlock` on a fixture choice that already has `stanceLabel`, so it
 * asserts the *surface* renders a stance it was handed. It cannot see the
 * producer drop the field — and that is exactly what happened: the attended
 * adapter's authored branch built its choice models straight from the card and
 * never copied `interventionType`, so `crafting.quest.flawed_steel` rendered
 * three cards with no stance word, no glow colour and no `fate decides`.
 *
 * This test runs the other direction: real shipped templates → the real
 * adapter → the model the veil reads. **`notification.choices` is empty on
 * purpose.** It is the only other thing that can carry a stance into this
 * adapter (via the generic fallback branch), so emptying it means a passing
 * assertion can only have come from the template's own authored card. Restore
 * the pre-fix adapter and every case here fails on `undefined`.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../../data/unified-action-templates';
import { interventionStanceWord } from '../../../../../engine/interventionStanceWords';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../../../types/unifiedAction';
import { buildUnifiedEncounterStageModel } from '../buildUnifiedEncounterStageModel';

const AGENT_ID = 'agent.stance_probe';
const AGENT_NAME = 'Kael Thornweaver';
const TARGET_ID = 'loc.ironhewn_forge';

/** Every shipped template that hands the player an authored choice. */
const AUTHORED_TEMPLATES: UnifiedActionTemplate[] = UNIFIED_ACTION_TEMPLATES.filter(
  (t) => Object.keys(t.authoredChoices ?? {}).length > 0,
);

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: AGENT_NAME,
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'Ironhewn Forge', properties: {} });
  return graph;
}

function buildAction(template: UnifiedActionTemplate, stepIndex: number): UnifiedAction {
  return {
    actionId: `ua_stance_${template.id}_${stepIndex}`,
    actorId: AGENT_ID,
    templateId: template.id,
    targetId: TARGET_ID,
    scale: template.scale,
    source: 'agent',
    startTick: 1,
    currentStep: stepIndex,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

/**
 * A notification with NO choices. The generic fallback branch is the only other
 * producer of `stanceLabel` in this adapter; leaving it nothing to read is what
 * makes a pass here attributable to the authored card alone.
 */
function buildChoicelessNotification(template: UnifiedActionTemplate): EncounterNotification {
  return {
    id: `notif_stance_${template.id}`,
    agentId: AGENT_ID,
    agentName: AGENT_NAME,
    courtPosition: 'the_first',
    encounterId: template.id,
    encounterName: template.name,
    prose: 'The scene holds.',
    choices: [],
    createdTick: 1,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
  };
}

describe('buildUnifiedEncounterStageModel — authored choices carry their stance (THR-1411)', () => {
  it('finds the shipped authored-choice corpus (guards against a vacuous sweep)', () => {
    // An empty or near-empty population would let every case below pass by
    // iterating nothing. The sweep is only meaningful against the real corpus.
    expect(AUTHORED_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    expect(AUTHORED_TEMPLATES.map((t) => t.id)).toContain('crafting.quest.flawed_steel');
  });

  it.each(AUTHORED_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s — every authored card reaches the model with its stance banded',
    (_id, template) => {
      const stepIndexes = Object.keys(template.authoredChoices ?? {})
        .map(Number)
        .filter(Number.isInteger);

      expect(stepIndexes.length).toBeGreaterThan(0);

      for (const stepIndex of stepIndexes) {
        const cards = template.authoredChoices?.[stepIndex] ?? [];
        expect(cards.length).toBeGreaterThan(0);

        const model = buildUnifiedEncounterStageModel({
          template,
          activeAction: buildAction(template, stepIndex),
          notification: buildChoicelessNotification(template),
          agentName: AGENT_NAME,
          threadTier: 'strong',
          graph: buildGraph(),
          essence: 10,
        });

        // The authored hand is what the model offers — not the empty fallback.
        expect(model.choices).toHaveLength(cards.length);

        for (const card of cards) {
          const choice = model.choices.find((c) => c.id === card.id);
          expect(choice, `${template.id} step ${stepIndex} card ${card.id}`).toBeDefined();

          // The enum survives the crossing (it picks the card's glow colour and
          // the withdrawn card's `fate decides` label).
          expect(choice?.interventionType).toBe(card.interventionType);

          // And it arrives banded into words — Law 14: never the raw key.
          const expectedWord = interventionStanceWord(card.interventionType);
          expect(expectedWord).toBeTruthy();
          expect(choice?.stanceLabel).toBe(expectedWord);
          expect(choice?.stanceLabel).not.toBe(card.interventionType);
        }
      }
    },
  );

  it('flawed_steel step 0 offers the three stances the pixel sweep found blank', () => {
    const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'crafting.quest.flawed_steel');
    expect(template).toBeDefined();

    const model = buildUnifiedEncounterStageModel({
      template: template!,
      activeAction: buildAction(template!, 0),
      notification: buildChoicelessNotification(template!),
      agentName: AGENT_NAME,
      threadTier: 'strong',
      graph: buildGraph(),
      essence: 10,
    });

    expect(model.choices.map((c) => c.stanceLabel)).toEqual([
      'lend strength',
      'press them',
      'stand back',
    ]);
  });
});
