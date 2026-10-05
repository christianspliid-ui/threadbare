/**
 * THR-1728 — the encounter veil never shows `template.description`.
 *
 * The description is designer voice ("A two-step master Heart job in a town: …
 * plants a town-watch errand"), written for the factory and the Codex, not for
 * the player. Christian found it in the veil's subtitle slot on The Granary Riot
 * (2026-10-05): "looks more like a prompt than an actual prose text."
 *
 * With `stakes` the header carries the stakes line. Without usable stakes (none
 * authored, or a malformed block that throws in the builder) the slot falls back
 * to the scene's own opening prose — never to the description.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { getUnifiedTemplateById } from '../../../../../data/unified-action-templates';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../../../types/unifiedAction';
import type { EncounterStakes } from '../../../../../types/encounterStakes';
import { buildUnifiedEncounterStageModel } from '../buildUnifiedEncounterStageModel';

const TEMPLATE_ID = 'encounter.town.granary_riot';
const DESIGNER_VOICE = 'A two-step master Heart job in a town that plants a town-watch errand.';
const OPENING = 'A crowd is pushing at the abbey granary gate.';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.scout', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.town', type: 'location', name: 'Ashford', properties: {} });
  return graph;
}

function buildAction(template: UnifiedActionTemplate): UnifiedAction {
  return {
    actionId: `ua_${template.id}`,
    actorId: 'agent.scout',
    templateId: template.id,
    targetId: 'loc.town',
    scale: template.scale,
    source: 'agent',
    startTick: 5,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
  };
}

function buildNotification(template: UnifiedActionTemplate): EncounterNotification {
  return {
    id: `notif_${template.id}`,
    agentId: 'agent.scout',
    agentName: 'Kael',
    courtPosition: 'the_first',
    encounterId: template.id,
    encounterName: template.name,
    prose: 'The scene opens.',
    choices: [],
    createdTick: 5,
    autoResolveTick: null,
    viewed: false,
    resolved: false,
  };
}

function headerFor(template: UnifiedActionTemplate) {
  return buildUnifiedEncounterStageModel({
    template,
    activeAction: buildAction(template),
    notification: buildNotification(template),
    agentName: 'Kael',
    threadTier: 'strong',
    graph: buildGraph(),
    essence: 10,
  }).header;
}

function variant(stakes: EncounterStakes | undefined): UnifiedActionTemplate {
  const base = getUnifiedTemplateById(TEMPLATE_ID);
  if (!base) throw new Error(`${TEMPLATE_ID} is not in the registry`);
  return {
    ...base,
    description: DESIGNER_VOICE,
    narrativeTemplates: { ...base.narrativeTemplates, initiation: OPENING },
    stakes,
  };
}

describe('THR-1728 · the veil subtitle never falls back to the description', () => {
  it('shows the stakes line when the template authors stakes', () => {
    const header = headerFor(getUnifiedTemplateById(TEMPLATE_ID)!);
    expect(header.stakesLine?.text).toMatch(/must .+ — or /);
    expect(header.subtitle).toBeUndefined();
  });

  it('a template without stakes shows its opening prose, not the description', () => {
    const header = headerFor(variant(undefined));
    expect(header.stakesLine).toBeUndefined();
    expect(header.subtitle).toBe(OPENING);
    expect(header.subtitle).not.toContain('master Heart job');
  });

  it('a malformed stakes block fails soft to the opening prose, not the description', () => {
    const broken = { goal: undefined, risk: undefined } as unknown as EncounterStakes;
    const header = headerFor(variant(broken));
    // `hasUsableStakes` reads a block missing its parts as no stakes — never
    // "Kael must undefined — or undefined."
    expect(header.stakesLine).toBeUndefined();
    expect(header.subtitle).toBe(OPENING);
  });
});
