/**
 * THR-713 — the branching tier's invented names are retired.
 *
 * The bug this locks: branching encounters hardcoded invented character names
 * ("Maren", "Dalla", "Torve") while their support bundles bind real NPCs
 * reuse-first — so a reused bind made the prose name the wrong person. After
 * the sweep, prose references `{cast:<key>}`: a bound key renders the live NPC
 * name, an unbound key renders the spec's spawnName (byte-identical to the old
 * literal). Runs the shipped flawed-steel content through the shipped
 * enrichment path — no fixture template.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { enrichProse, resolveSceneCastContext } from '../proseEnrichment';
import { FLAWED_STEEL_TEMPLATE } from '../../data/encounters/flawed-steel';
import type { EncounterSupportBinding } from '../../types/encounter';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ActionStep } from '../../types/unifiedAction';

const bind = (key: string, nodeId: string): EncounterSupportBinding => ({
  key, nodeId, kind: 'actor', delivery: 'pre-seeded', persistence: 'must-persist', reused: true,
});

function graphWithLiveSmith(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'npc.kessa', name: 'Kessa Brandiron', type: 'actor',
    properties: { actorType: 'individual', npcRole: 'smith' },
  });
  return g;
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

const openingProse = () => {
  const step0 = FLAWED_STEEL_TEMPLATE.steps.find(
    (st): st is ActionStep => !isActionStepBranch(st) && Boolean(st.narrativeTemplate),
  );
  if (!step0?.narrativeTemplate) throw new Error('flawed-steel has no step prose');
  return step0.narrativeTemplate;
};

describe('branching-tier cast names (THR-713)', () => {
  it('flawed-steel prose carries cast tokens, not the invented literals', () => {
    expect(openingProse()).toContain('{cast:maren_ironhewn}');
    expect(openingProse()).not.toMatch(/\bMaren\b(?!\})/);
  });

  it('an UNBOUND key renders the spawnName — byte-identical to the retired literal', () => {
    const cast = resolveSceneCastContext(
      new WorldGraph(), FLAWED_STEEL_TEMPLATE.supportBundle, [],
    );
    const rendered = enrichProse(openingProse(), minimalCtx(cast));
    expect(rendered).toContain('Maren Ironhewn');
    expect(rendered).not.toContain('{cast:');
  });

  it('a REUSED binding renders the live NPC name where the literal used to be', () => {
    const cast = resolveSceneCastContext(
      graphWithLiveSmith(), FLAWED_STEEL_TEMPLATE.supportBundle, [
        bind('maren_ironhewn', 'npc.kessa'),
      ],
    );
    const rendered = enrichProse(openingProse(), minimalCtx(cast));
    expect(rendered).toContain('Kessa Brandiron');
    expect(rendered).not.toContain('Maren Ironhewn');
    expect(rendered).not.toContain('{cast:');
  });
});
