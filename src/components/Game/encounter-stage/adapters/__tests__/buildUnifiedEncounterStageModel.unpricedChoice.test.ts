/**
 * THR-1800 — an unpriced authored card must not soft-lock a chapter, and a
 * known-missing placeholder illustration must not leave an empty, captioned
 * image panel.
 *
 * "The Page Beneath the Saint" shipped both cards without `essenceCost`; the
 * adapter's `essence >= undefined` came out false, both cards greyed out as
 * unaffordable, and the play button stayed dead. The content is priced now
 * (and `contentInvariants` holds the catalog to it); this test pins the
 * adapter's fail-soft read so the next unpriced card degrades to free.
 *
 * THR-2161 retired authored cards (`authoredChoices`), and with them the
 * adapter path that priced them. What stays is the shared fail-soft price read
 * (`choiceEssenceCost`) and the illustration rule, probed on `mentorship.the-offer`.
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../../data/unified-action-templates';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../../../types/unifiedAction';
import { buildUnifiedEncounterStageModel, choiceEssenceCost } from '../buildUnifiedEncounterStageModel';
import { renderableIllustrationUrl } from '../encounterIllustration';

const AGENT_ID = 'agent.price_probe';
const AGENT_NAME = 'Elara Vey';
const TARGET_ID = 'loc.archive';
const PLACEHOLDER = '/concept-art/encounters/placeholder.jpg';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: AGENT_ID, type: 'actor', name: AGENT_NAME, properties: { actorType: 'individual' } });
  graph.addNode({ id: TARGET_ID, type: 'location', name: 'The Archive', properties: {} });
  return graph;
}

function buildAction(template: UnifiedActionTemplate, stepIndex: number): UnifiedAction {
  return {
    actionId: `ua_price_${template.id}`,
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

function buildNotification(template: UnifiedActionTemplate): EncounterNotification {
  return {
    id: `notif_price_${template.id}`,
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

function theOffer(): UnifiedActionTemplate {
  const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'mentorship.the-offer');
  expect(template).toBeDefined();
  return template!;
}

function build(template: UnifiedActionTemplate, stepIndex: number) {
  return buildUnifiedEncounterStageModel({
    template,
    activeAction: buildAction(template, stepIndex),
    notification: buildNotification(template),
    agentName: AGENT_NAME,
    threadTier: 'strong',
    graph: buildGraph(),
    essence: 45,
  });
}

describe('choiceEssenceCost — an unpriced choice reads as free (THR-1800)', () => {
  it('reads a missing or non-finite price as free', () => {
    expect(choiceEssenceCost(undefined)).toBe(0);
    expect(choiceEssenceCost(Number.NaN)).toBe(0);
    expect(choiceEssenceCost(3)).toBe(3);
  });

});

describe('encounter illustration — the missing placeholder renders nothing (THR-1800)', () => {
  it('renderableIllustrationUrl drops the placeholder and keeps a real file', () => {
    expect(renderableIllustrationUrl(PLACEHOLDER)).toBeUndefined();
    expect(renderableIllustrationUrl(undefined)).toBeUndefined();
    expect(renderableIllustrationUrl('/concept-art/encounters/gate-duty.jpg')).toBe('/concept-art/encounters/gate-duty.jpg');
  });

  it('a template pointing at the placeholder gets no image panel and no caption', () => {
    // The opening step is where the image panel shows.
    const model = build({ ...theOffer(), illustrationUrl: PLACEHOLDER }, 0);
    expect(model.illustration).toBeUndefined();
  });

  it('a template with a real illustration still gets its panel', () => {
    const model = build({ ...theOffer(), illustrationUrl: '/concept-art/encounters/gate-duty.jpg' }, 0);
    expect(model.illustration?.src).toBe('/concept-art/encounters/gate-duty.jpg');
  });
});
