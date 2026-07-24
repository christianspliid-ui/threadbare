/**
 * Party-exclusive delves — content integrity + end-to-end reachability (THR-74 PR 2b).
 *
 * The reachability gate (generateUnifiedCandidates, THR-74 seam) was landed and
 * unit-tested against *synthetic* `party.delve` fixtures one PR ahead of any live
 * consumer. These tests bind that gate to the *actual authored* delve content, so
 * the `company-gates-exclusive-content-reachability` interface contract is
 * verifiedLive against real templates, not a fixture: a company at a dungeon draws
 * `encounter.sunken_vault`; a solo agent at the same place cannot.
 */

import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import { UNIFIED_ACTION_TEMPLATES } from '../unified-action-templates';
import { generateUnifiedCandidates } from '../../engine/unifiedCandidates';
import { COMPANY_EXCLUDED_REACHES } from '../../engine/groups/groupEligibility';
import { isActionStepBranch } from '../../types/unifiedAction';
import { WorldGraph } from '../../engine/graph';
import type { ActionStep, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';

const PARTY_EXCLUSIVE_DELVE_IDS = [
  'encounter.sunken_vault',
  'encounter.broken_span',
  'encounter.hollow_watch',
] as const;

function stepReaches(template: UnifiedActionTemplate): ReachDomain[] {
  const flat: ActionStep[] = [];
  for (const step of template.steps ?? []) {
    if (!step) continue;
    if (isActionStepBranch(step)) {
      flat.push(...Object.values(step.variants ?? {}), step.fallback);
    } else {
      flat.push(step);
    }
  }
  return flat.map(s => s.reach).filter(Boolean) as ReachDomain[];
}

describe('party-exclusive delves — content integrity', () => {
  for (const id of PARTY_EXCLUSIVE_DELVE_IDS) {
    describe(id, () => {
      const fromEncounters = ENCOUNTER_TEMPLATES.find(t => t.id === id);
      const fromRegistry = UNIFIED_ACTION_TEMPLATES.find(t => t.id === id);

      it('is present in both the encounter set and the unified registry', () => {
        expect(fromEncounters).toBeDefined();
        expect(fromRegistry).toBeDefined();
      });

      it('is group-EXCLUSIVE: actorAffinities is exactly ["group"], never swept to include "individual"', () => {
        // The converter default is ['individual']; these author ['group'] to override it.
        expect(fromEncounters!.actorAffinities).toEqual(['group']);
        // withGroupAffinity must leave an already-['group'] template alone — a
        // regression here would make the delve drawable by solo agents.
        expect(fromRegistry!.actorAffinities).toEqual(['group']);
      });

      it('carries minGroupMembers = 2 (the gate consumer)', () => {
        expect(fromRegistry!.minGroupMembers).toBe(2);
      });

      it('is physical-challenge shaped: ≥2 steps, no heart/gold/star step', () => {
        const reaches = stepReaches(fromRegistry!);
        expect(reaches.length).toBeGreaterThanOrEqual(2);
        expect(reaches.some(r => COMPANY_EXCLUDED_REACHES.includes(r))).toBe(false);
      });
    });
  }
});

describe('party-exclusive delves — end-to-end reachability against real content', () => {
  const sunkenVault = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'encounter.sunken_vault')!;

  function dungeonGraph(): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor-1', type: 'actor', name: 'Kase',
      properties: { actorType: 'individual' },
    });
    // Location whose subtype is one of the delve's authored locationSubtypes.
    graph.addNode({
      id: 'ruin-1', type: 'location', name: 'The Drowned Vault',
      properties: { locationType: 'ruins', locationSubtype: 'sublocation-type.dungeon' },
    });
    graph.addEdge({
      id: 'e-loc', source: 'actor-1', target: 'ruin-1', type: 'located_at', properties: {},
    });
    return graph;
  }

  function joinCompany(graph: WorldGraph, livingCompanions: number): void {
    graph.addNode({
      id: 'company-1', type: 'actor', name: 'The Test Company',
      properties: { actorType: 'group', groupType: 'party', groupStatus: 'active' },
    });
    graph.addEdge({
      id: 'mem-actor-1', source: 'actor-1', target: 'company-1',
      type: 'member_of', properties: { role: 'member', rank: 0, joinedTick: 0 },
    });
    for (let i = 0; i < livingCompanions; i++) {
      graph.addNode({
        id: `companion-${i}`, type: 'actor', name: `Companion ${i}`,
        properties: { actorType: 'individual' },
      });
      graph.addEdge({
        id: `mem-companion-${i}`, source: `companion-${i}`, target: 'company-1',
        type: 'member_of', properties: { role: 'member', rank: 1 + i, joinedTick: 1 + i },
      });
    }
  }

  it('a company of 2 at a dungeon draws the authored delve', () => {
    const graph = dungeonGraph();
    joinCompany(graph, 1); // actor-1 + 1 companion = 2 living
    const result = generateUnifiedCandidates(graph, 'actor-1', 'ruin-1', [sunkenVault]);
    expect(result.map(c => c.templateId)).toContain('encounter.sunken_vault');
  });

  it('a solo agent at the same dungeon cannot draw it (party-exclusive)', () => {
    const graph = dungeonGraph(); // actor-1 ungrouped
    const result = generateUnifiedCandidates(graph, 'actor-1', 'ruin-1', [sunkenVault]);
    expect(result).toHaveLength(0);
  });
});
