/**
 * Company-drama encounters — content integrity + end-to-end reachability (THR-733).
 *
 * The sibling of `partyExclusiveDelves.test.ts`, and for the same reason: the
 * group-exclusive gate is unit-tested against synthetic fixtures elsewhere, so
 * what is worth proving here is that the gate holds against the *actual authored
 * templates*. A company at a qualifying place draws the drama; a solo agent at
 * the same place draws nothing.
 *
 * Asserted against the authored content, never a fixture — a fixture that
 * invents both sides of the question verifies fiction (the standing trap this
 * suite's ancestor was written to avoid).
 */

import { describe, it, expect } from 'vitest';
import { COMPANY_DRAMA_TEMPLATES, COMPANY_DRAMA_MIN_MEMBERS } from '../encounters/company-drama';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { generateUnifiedCandidates } from '../../engine/unifiedCandidates';
import { WorldGraph } from '../../engine/graph';
import { SETTING_CLASS_MAP } from '../settingClasses';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

const GATE_HELD_ID = 'encounter.company.gate_held';

describe('company drama — content integrity', () => {
  for (const authored of COMPANY_DRAMA_TEMPLATES) {
    describe(authored.id, () => {
      const fromRegistry = UNIFIED_ACTION_TEMPLATES.find(t => t.id === authored.id);

      it('is registered in the unified registry', () => {
        expect(fromRegistry).toBeDefined();
      });

      it('is group-EXCLUSIVE: actorAffinities is exactly ["group"], never swept to include "individual"', () => {
        // The converter default is ['individual']; these author ['group'] to
        // override it, and `withGroupAffinity` must leave an already-['group']
        // template alone. A regression here makes the drama drawable solo —
        // which for a company encounter is the whole subject lost.
        expect(authored.actorAffinities).toEqual(['group']);
        expect(fromRegistry!.actorAffinities).toEqual(['group']);
      });

      it('carries minGroupMembers (the gate consumer)', () => {
        expect(fromRegistry!.minGroupMembers).toBe(COMPANY_DRAMA_MIN_MEMBERS);
      });

      it('declares a setting envelope with an opening per declared class', () => {
        const settings = fromRegistry!.settings ?? [];
        expect(settings.length).toBeGreaterThan(0);
        for (const cls of settings) {
          expect(fromRegistry!.openings?.[cls], `no opening authored for '${cls}'`).toBeTruthy();
        }
      });

      it('registers at the location subtypes its settings expand to', () => {
        const subtypes = fromRegistry!.locationSubtypes ?? [];
        for (const cls of fromRegistry!.settings ?? []) {
          for (const subtype of SETTING_CLASS_MAP[cls as keyof typeof SETTING_CLASS_MAP]) {
            expect(subtypes).toContain(subtype);
          }
        }
      });
    });
  }
});

describe('company drama — end-to-end reachability against real content', () => {
  const gateHeld = UNIFIED_ACTION_TEMPLATES.find(
    t => t.id === GATE_HELD_ID,
  ) as UnifiedActionTemplate;

  /** A ruin whose subtype is one of the template's authored settings. */
  function ruinGraph(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-1',
      type: 'actor',
      name: 'Sevrin',
      properties: { actorType: 'individual' },
    });
    graph.addNode({
      id: 'ruin-1',
      type: 'location',
      name: 'The Sunk Bastion',
      properties: { locationType: 'ruins', locationSubtype: 'ruins' },
    });
    graph.addEdge({
      id: 'e-loc',
      source: 'actor-1',
      target: 'ruin-1',
      type: 'located_at',
      properties: {},
    });
    return graph;
  }

  function joinCompany(graph: WorldGraph, livingCompanions: number): void {
    graph.addNode({
      id: 'company-1',
      type: 'actor',
      name: 'The Test Company',
      properties: { actorType: 'group', groupType: 'party', groupStatus: 'active' },
    });
    graph.addEdge({
      id: 'mem-actor-1',
      source: 'actor-1',
      target: 'company-1',
      type: 'member_of',
      properties: { role: 'member', rank: 0, joinedTick: 0 },
    });
    for (let i = 0; i < livingCompanions; i++) {
      graph.addNode({
        id: `companion-${i}`,
        type: 'actor',
        name: `Companion ${i}`,
        properties: { actorType: 'individual' },
      });
      graph.addEdge({
        id: `mem-companion-${i}`,
        source: `companion-${i}`,
        target: 'company-1',
        type: 'member_of',
        properties: { role: 'member', rank: 1 + i, joinedTick: 1 + i },
      });
    }
  }

  it('a company of two at a ruin draws the authored sacrifice', () => {
    const graph = ruinGraph();
    joinCompany(graph, 1); // actor-1 + 1 companion = 2 living
    const result = generateUnifiedCandidates(graph, 'actor-1', 'ruin-1', [gateHeld]);
    expect(result.map(c => c.templateId)).toContain(GATE_HELD_ID);
  });

  it('a solo agent at the same ruin cannot draw it (group-exclusive)', () => {
    const graph = ruinGraph(); // actor-1 ungrouped
    const result = generateUnifiedCandidates(graph, 'actor-1', 'ruin-1', [gateHeld]);
    expect(result).toHaveLength(0);
  });

  it('a company of one cannot draw it — a company of one has no rearguard', () => {
    const graph = ruinGraph();
    joinCompany(graph, 0); // actor-1 alone in the company = 1 living
    const result = generateUnifiedCandidates(graph, 'actor-1', 'ruin-1', [gateHeld]);
    expect(result).toHaveLength(0);
  });
});
