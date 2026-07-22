/**
 * THR-696 Slice C — the gate-duty pilot, end to end against the *real* template.
 *
 * The bug this locks: support bundles bind reuse-first, so `gate_captain` frequently
 * resolves to an NPC who already stands at the gate — while the authored prose said
 * "the captain" (generic) or, in the branching tier, an invented name. Once prose
 * references `{cast:gate_captain}`, the rendered text must name *the bound NPC*, not the
 * spec's authored `spawnName`. Everything below runs the shipped content through the
 * shipped enrichment path; no fixture template stands in for it.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { enrichProse, resolveSceneCastContext } from '../proseEnrichment';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ActionStep } from '../../types/unifiedAction';
import type { EncounterSupportBinding } from '../../types/encounter';

const GATE_DUTY_ID = 'cg.quest.gate_duty';

function gateDutyTemplate() {
  const template = getUnifiedTemplateById(GATE_DUTY_ID);
  if (!template) throw new Error(`${GATE_DUTY_ID} missing from the registered template pool`);
  return template;
}

/** Gate duty is a linear template — every entry is a plain step, not a branch. */
function gateDutySteps(): ActionStep[] {
  return gateDutyTemplate().steps.filter((s): s is ActionStep => !isActionStepBranch(s));
}

/** The seizure step (index 1) — where the pilot names courier and captain. */
function seizureStepProse(): string {
  const prose = gateDutySteps()[1]?.narrativeTemplate;
  if (!prose) throw new Error('gate duty step 1 has no narrativeTemplate');
  return prose;
}

/** A world where the gate already has a captain and a courier the bundle can reuse. */
function graphWithBoundCast(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'npc.merrow', name: 'Captain Merrow', type: 'actor',
    properties: { actorType: 'individual', npcRole: 'guard_captain' },
  });
  g.addNode({
    id: 'npc.nessa', name: 'Nessa Vale', type: 'actor',
    properties: { actorType: 'individual', npcRole: 'courier' },
  });
  return g;
}

const bind = (key: string, nodeId: string): EncounterSupportBinding => ({
  key, nodeId, kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused: true,
});

/** Every authored field on the template that runs through enrichProse. */
function authoredProseFields(): string[] {
  const t = gateDutyTemplate();
  // Optional-by-type fields are collected loosely and filtered at the end.
  const fields: (string | undefined)[] = [
    ...Object.values(t.narrativeTemplates ?? {}),
  ];
  for (const step of gateDutySteps()) {
    if (step.narrativeTemplate) fields.push(step.narrativeTemplate);
    if (step.successAfterimage) fields.push(step.successAfterimage);
    if (step.failureAfterimage) fields.push(step.failureAfterimage);
  }
  const fallback = t.aftermathConfig?.fallback;
  if (fallback) {
    fields.push(fallback.overview, fallback.reactionPrompt);
    for (const change of fallback.changes ?? []) fields.push(change.title, change.detail);
    for (const reaction of fallback.reactions ?? []) fields.push(reaction.label, reaction.intent);
  }
  return fields.filter((f): f is string => typeof f === 'string' && f.length > 0);
}

function minimalCtx(cast: ReturnType<typeof resolveSceneCastContext>) {
  return {
    agentName: 'Kira', agentId: 'agent_1', archetypeId: 'rebel',
    cultureName: 'The Aurelians', primaryReach: 'iron' as const,
    titles: [], notableArtifacts: [], strongAllies: [], rivals: [],
    currentLocationName: 'Ashenmoor', completedPhases: [], beatHistory: [],
    pronouns: { they: 'she', them: 'her', their: 'her', s: 's' },
    cast,
  };
}

describe('gate duty — {cast:*} pilot (THR-696)', () => {
  it('declares the three cast keys the pilot prose references', () => {
    const keys = new Set((gateDutyTemplate().supportBundle ?? []).map(s => s.key));
    for (const key of ['suspect_courier', 'gate_captain', 'checkpoint_witness']) {
      expect(keys.has(key)).toBe(true);
    }
  });

  it('renders the *bound* NPC name, not the authored spawnName', () => {
    const cast = resolveSceneCastContext(graphWithBoundCast(), gateDutyTemplate().supportBundle, [
      bind('gate_captain', 'npc.merrow'),
      bind('suspect_courier', 'npc.nessa'),
    ]);
    const ctx = minimalCtx(cast);

    const rendered = enrichProse(seizureStepProse(), ctx);

    expect(rendered).toContain('Captain Merrow');
    expect(rendered).toContain('Nessa Vale');
    // The authored placeholders must not survive when a real binding exists.
    expect(rendered).not.toContain('Gate Captain');
    expect(rendered).not.toContain('Harried Courier');
  });

  it('falls back to the authored spec name when a key is unbound', () => {
    const cast = resolveSceneCastContext(graphWithBoundCast(), gateDutyTemplate().supportBundle, []);
    const rendered = enrichProse(seizureStepProse(), minimalCtx(cast));

    expect(rendered).toContain('Gate Captain');
    expect(rendered).toContain('Harried Courier');
  });

  it('leaves no raw placeholder in any authored field, bound or unbound', () => {
    const bound = resolveSceneCastContext(graphWithBoundCast(), gateDutyTemplate().supportBundle, [
      bind('gate_captain', 'npc.merrow'),
    ]);
    for (const cast of [bound, undefined]) {
      for (const field of authoredProseFields()) {
        const rendered = enrichProse(field, minimalCtx(cast));
        expect(rendered, `raw token survived in: ${field.slice(0, 60)}`).not.toMatch(/\{[^}]*\}/);
      }
    }
  });
});
