/**
 * THR-1040 — the stage adapter must survive a template that declares no
 * `narrativeTemplates`.
 *
 * `UnifiedActionTemplate.narrativeTemplates` is declared *required* on the type,
 * but the 15 `mc.*` mercenary templates omit it entirely and type-check anyway
 * only because of the red baseline (THR-489). Four reads in the adapter took the
 * field unguarded, so every one of those templates threw
 * `TypeError: Cannot read properties of undefined (reading 'initiation')`
 * during render — a crash, not a fail-soft degradation, so the encounter could
 * never be driven to the aftermath THR-1038 authored for it.
 *
 * This suite runs the **real corpus** rather than a fixture, per the ticket's
 * Done-when: a hand-built fixture would only prove the guard I just wrote, and
 * would go stale the moment a new faction set lands with the same omission.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../../../../engine/graph';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../../data/unified-action-templates';
import type { EncounterNotification } from '../../../../../types/encounterVisibility';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../../../types/unifiedAction';
import { buildUnifiedEncounterStageModel } from '../buildUnifiedEncounterStageModel';

// ─── Fixtures ─────────────────────────────────────────────────────

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent.scout',
    type: 'actor',
    name: 'Kael the Scout',
    properties: { actorType: 'individual' },
  });
  graph.addNode({ id: 'loc.ford', type: 'location', name: 'Stoneford Crossing', properties: {} });
  return graph;
}

function buildAction(template: UnifiedActionTemplate): UnifiedAction {
  return {
    actionId: `ua_${template.id}`,
    actorId: 'agent.scout',
    templateId: template.id,
    targetId: 'loc.ford',
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
    agentName: 'Kael the Scout',
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

/**
 * The membership predicate (THR-688 rule A) — a template that declares no
 * `narrativeTemplates` at all. Re-derived from the corpus on every run, so a
 * new faction set carrying the same omission joins the suite automatically
 * instead of needing this list edited.
 */
function templatesWithoutNarrativeTemplates(): UnifiedActionTemplate[] {
  return UNIFIED_ACTION_TEMPLATES.filter(
    (t) => (t as { narrativeTemplates?: unknown }).narrativeTemplates === undefined,
  );
}

// ─── Tests ────────────────────────────────────────────────────────

describe('buildUnifiedEncounterStageModel — templates with no narrativeTemplates', () => {
  it('the corpus still contains such templates, so this suite is not vacuous', () => {
    // Guards against the vacuous-probe failure mode: were the corpus to carry
    // none, every assertion below would pass over an empty array and prove
    // nothing. If a content pass ever backfills all of them, this expectation
    // is the thing that tells you to retire the suite rather than keep a green
    // test that inspects nothing.
    expect(templatesWithoutNarrativeTemplates().length).toBeGreaterThan(0);
  });

  it('builds a stage model for every such template without throwing', () => {
    const graph = buildGraph();
    const failures: string[] = [];

    for (const template of templatesWithoutNarrativeTemplates()) {
      try {
        buildUnifiedEncounterStageModel({
          template,
          activeAction: buildAction(template),
          notification: buildNotification(template),
          agentName: 'Kael the Scout',
          threadTier: 'strong',
          graph,
          essence: 10,
        });
      } catch (err) {
        failures.push(`${template.id}: ${(err as Error).message}`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('falls back to the step narrative for scene and header prose rather than emptying them', () => {
    const graph = buildGraph();

    // These templates carry step-level `narrativeTemplate` strings instead of a
    // template-level `narrativeTemplates` block — that step prose is the honest
    // fallback, and the reason direction (a) beats emitting an empty string.
    // `steps[0]` is an `ActionStepOrBranch`; a branch carries no prose, so the
    // `in` narrowing is what makes this type-safe as well as correct.
    const withStepProse = templatesWithoutNarrativeTemplates().filter((t) => {
      const first = t.steps?.[0];
      if (!first || !('narrativeTemplate' in first)) return false;
      return typeof first.narrativeTemplate === 'string' && first.narrativeTemplate.length > 0;
    });
    expect(withStepProse.length).toBeGreaterThan(0);

    for (const template of withStepProse) {
      const model = buildUnifiedEncounterStageModel({
        template,
        activeAction: buildAction(template),
        notification: buildNotification(template),
        agentName: 'Kael the Scout',
        threadTier: 'strong',
        graph,
        essence: 10,
      });

      expect(model.scene.situationProse.length).toBeGreaterThan(0);
      expect((model.header.subtitle ?? '').length).toBeGreaterThan(0);
      expect(model.narrative.paragraphs.length).toBeGreaterThan(0);
    }
  });
});
