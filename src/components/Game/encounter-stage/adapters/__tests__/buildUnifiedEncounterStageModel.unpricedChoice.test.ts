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
 */
import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../../data/unified-action-templates';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { AuthoredChoiceCard, UnifiedAction, UnifiedActionTemplate } from '../../../../../types/unifiedAction';
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

function buildAction(template: UnifiedActionTemplate): UnifiedAction {
  return {
    actionId: `ua_price_${template.id}`,
    actorId: AGENT_ID,
    templateId: template.id,
    targetId: TARGET_ID,
    scale: template.scale,
    source: 'agent',
    startTick: 1,
    currentStep: 0,
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

function pageBeneathTheSaint(): UnifiedActionTemplate {
  const template = UNIFIED_ACTION_TEMPLATES.find((t) => t.id === 'veil.truth.page_beneath_saint');
  expect(template).toBeDefined();
  return template!;
}

/** The pre-fix shape: the same template with every card's price stripped. */
function withUnpricedCards(template: UnifiedActionTemplate): UnifiedActionTemplate {
  const cards = (template.authoredChoices?.[0] ?? []).map((card) => {
    const { essenceCost: _dropped, ...rest } = card;
    return rest as unknown as AuthoredChoiceCard;
  });
  return { ...template, authoredChoices: { 0: cards } };
}

function build(template: UnifiedActionTemplate) {
  return buildUnifiedEncounterStageModel({
    template,
    activeAction: buildAction(template),
    notification: buildNotification(template),
    agentName: AGENT_NAME,
    threadTier: 'strong',
    graph: buildGraph(),
    essence: 45,
  });
}

describe('buildUnifiedEncounterStageModel — unpriced authored cards (THR-1800)', () => {
  it('reads a missing or non-finite price as free', () => {
    expect(choiceEssenceCost(undefined)).toBe(0);
    expect(choiceEssenceCost(Number.NaN)).toBe(0);
    expect(choiceEssenceCost(3)).toBe(3);
  });

  it('a card with essenceCost undefined comes out affordable, priced 0, with no cost label', () => {
    const model = build(withUnpricedCards(pageBeneathTheSaint()));
    expect(model.choices).toHaveLength(2);
    for (const choice of model.choices) {
      expect(choice.affordable).toBe(true);
      expect(choice.essenceCost).toBe(0);
      expect(choice.costLabel).toBeUndefined();
    }
  });

  it('the shipped chapter offers two selectable cards to a player holding 45 essence', () => {
    const model = build(pageBeneathTheSaint());
    expect(model.choices.map((c) => c.id)).toEqual(['bury_it_deeper', 'let_the_truth_surface']);
    expect(model.choices.every((c) => c.affordable)).toBe(true);
  });
});

describe('encounter illustration — the missing placeholder renders nothing (THR-1800)', () => {
  it('renderableIllustrationUrl drops the placeholder and keeps a real file', () => {
    expect(renderableIllustrationUrl(PLACEHOLDER)).toBeUndefined();
    expect(renderableIllustrationUrl(undefined)).toBeUndefined();
    expect(renderableIllustrationUrl('/concept-art/encounters/gate-duty.jpg')).toBe('/concept-art/encounters/gate-duty.jpg');
  });

  it('a template pointing at the placeholder gets no image panel and no caption', () => {
    const model = build({ ...pageBeneathTheSaint(), illustrationUrl: PLACEHOLDER });
    expect(model.illustration).toBeUndefined();
  });

  it('a template with a real illustration still gets its panel', () => {
    const model = build({ ...pageBeneathTheSaint(), illustrationUrl: '/concept-art/encounters/gate-duty.jpg' });
    expect(model.illustration?.src).toBe('/concept-art/encounters/gate-duty.jpg');
  });
});
