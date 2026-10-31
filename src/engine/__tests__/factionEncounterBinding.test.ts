/**
 * THR-2096 — the generic faction set-pieces name the faction they are about.
 *
 * "Faction Bounty" named no faction: nothing bound one, and the title was the raw
 * template name. Every `fa.*` template now declares `bindsFaction`, both draw gates
 * refuse it where no faction binds, and the veil header, step prose and chronicle
 * name the bound faction.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  factionBindingAllows,
  resolveFactionEncounterBinding,
} from '../factionEncounterBinding';
import { enrichProse, gatherNarrativeContext, resolveEncounterTitle } from '../proseEnrichment';
import { FACTION_ACTION_ENCOUNTER_TEMPLATES } from '../../data/faction-action-encounters';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { initializeGameState } from '../gameInit';
import { prepareDebugEncounterSpawn } from '../debugEncounterTools';
import { getAgentLocationId } from '../graphQueries';
import { getFactionNodes } from '../factionNetwork';
import { buildUnifiedEncounterStageModel } from '../../components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel';
import { buildChapterRecord } from '../chapterArchive';

// ─── Hand-built fixture ──────────────────────────────────────────────────────

function addFaction(graph: WorldGraph, id: string, name: string): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'faction' } });
}

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { subtype: 'town' } });
  graph.addNode({ id: 'hall', type: 'location', name: 'Ashford Hall', properties: { parentLocationId: 'town' } });
  graph.addNode({ id: 'empty', type: 'location', name: 'Nowhere', properties: { subtype: 'town' } });
  graph.addNode({ id: 'hero', type: 'actor', name: 'Hesper', properties: { actorType: 'individual' } });
  addFaction(graph, 'f_merch', 'The Merchant Consortium');
  addFaction(graph, 'f_temple', 'Temple of Spheres');
  addFaction(graph, 'f_rangers', 'Rangers Brotherhood');
  graph.addEdge({ id: 'e1', source: 'f_merch', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e2', source: 'f_temple', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e3', source: 'hero', target: 'hall', type: 'located_at', properties: {} });
  return graph;
}

function join(graph: WorldGraph, factionId: string, rank = 0): void {
  graph.addEdge({
    id: `m_${factionId}`, source: 'hero', target: factionId, type: 'member_of',
    properties: { role: 'journeyman', rank },
  });
}

describe('resolveFactionEncounterBinding (THR-2096)', () => {
  it('posting: the actor\'s own faction when it keeps a presence here', () => {
    const graph = buildGraph();
    join(graph, 'f_temple');
    const b = resolveFactionEncounterBinding(graph, 'posting', 'hero', 'hall');
    expect(b?.factionId).toBe('f_temple');
    expect(b?.actorIsMember).toBe(true);
  });

  it('posting: else the faction present at the location (sublocation walks up)', () => {
    const graph = buildGraph();
    join(graph, 'f_rangers'); // a member, but the Rangers keep no hall in Ashford
    const b = resolveFactionEncounterBinding(graph, 'posting', 'hero', 'hall');
    expect(b?.factionId).toBe('f_merch'); // first present by id
    expect(b?.actorIsMember).toBe(false);
  });

  it('a location with no eligible faction binds nothing and offers no fa.* template', () => {
    const graph = buildGraph();
    join(graph, 'f_merch');
    expect(resolveFactionEncounterBinding(graph, 'posting', 'hero', 'empty')).toBeUndefined();
    for (const template of FACTION_ACTION_ENCOUNTER_TEMPLATES) {
      expect(template.bindsFaction, template.id).toBeDefined();
      if (template.bindsFaction === 'posting') {
        expect(factionBindingAllows(graph, template.bindsFaction, 'hero', 'empty'), template.id).toBe(false);
      }
    }
  });

  it('rival: needs the actor\'s faction and a declared rival of it', () => {
    const graph = buildGraph();
    expect(resolveFactionEncounterBinding(graph, 'rival', 'hero', 'hall')).toBeUndefined();
    join(graph, 'f_merch');
    expect(resolveFactionEncounterBinding(graph, 'rival', 'hero', 'hall')).toBeUndefined();
    graph.addEdge({
      id: 'riv', source: 'f_rangers', target: 'f_merch', type: 'relates_to', properties: { isRival: true },
    });
    const b = resolveFactionEncounterBinding(graph, 'rival', 'hero', 'hall');
    expect(b?.factionName).toBe('The Merchant Consortium');
    expect(b?.rivalFactionName).toBe('Rangers Brotherhood');
  });
});

describe('{faction} prose (THR-2096)', () => {
  it('resolves for an ordinary (non-senior) member', () => {
    const graph = buildGraph();
    join(graph, 'f_temple', 0);
    const ctx = gatherNarrativeContext(graph, 'hero');
    expect(ctx.factionRank).toBeUndefined(); // `{faction_rank}` semantics unchanged
    expect(enrichProse('The {faction} watches.', ctx)).toBe('The Temple of Spheres watches.');
  });

  it('names the bound faction in the title, without a doubled article', () => {
    const graph = buildGraph();
    const ctx = gatherNarrativeContext(graph, 'hero', undefined, undefined, undefined, undefined, undefined,
      { bindsFaction: 'posting' });
    const bounty = getUnifiedTemplateById('fa.bounty_hunt')!;
    expect(resolveEncounterTitle(bounty, ctx)).toBe('The Merchant Consortium\'s Bounty');
  });

  it('falls back to the token-free name when no context is given', () => {
    const bounty = getUnifiedTemplateById('fa.bounty_hunt')!;
    expect(resolveEncounterTitle(bounty, undefined)).toBe(bounty.name);
    expect(bounty.name).not.toMatch(/\bfaction\b|\{/i);
  });
});

// ─── Seeded world: every fa.* template on the veil ───────────────────────────

describe('fa.* encounters on a seeded world (THR-2096)', () => {
  it('header, aftermath title, step prose and chronicle name a real faction', () => {
    const init = initializeGameState({
      name: 'Oracle', sphereAlignment: { primary: 'thread', secondary: 'winter' }, title: 'Oracle',
      decreeNouns: [], themes: [], startingMutations: [],
    } as never, 'Oracle', { reachDomains: [], spheres: [] } as never, 42, 32, 24);
    const state = init.state;
    const graph = state.graph;

    // Make the hero a member of a faction present where they stand, with a rival.
    const probe = prepareDebugEncounterSpawn(state, '@hero', 'fa.bounty_hunt', {});
    expect(probe.success, probe.message).toBe(true);
    const heroId = probe.unifiedAction!.actorId;
    const locationId = getAgentLocationId(graph, heroId)!;
    const [own, rival] = getFactionNodes(graph);
    expect(own && rival).toBeTruthy();
    graph.addEdge({ id: 't_here', source: own.id, target: locationId, type: 'located_at', properties: {} });
    graph.addEdge({ id: 't_member', source: heroId, target: own.id, type: 'member_of', properties: { rank: 0 } });
    graph.addEdge({
      id: 't_rival', source: own.id, target: rival.id, type: 'relates_to', properties: { isRival: true },
    });

    for (const template of FACTION_ACTION_ENCOUNTER_TEMPLATES) {
      const prepared = prepareDebugEncounterSpawn(state, '@hero', template.id, {});
      expect(prepared.success, `${template.id}: ${prepared.message}`).toBe(true);
      const action = prepared.unifiedAction!;
      const args = {
        template: getUnifiedTemplateById(template.id)!,
        notification: prepared.notification!,
        agentName: 'Oracle',
        threadTier: 'threaded' as never,
        graph,
        essence: 0,
        gameState: state,
        tick: state.tick,
      };
      const live = buildUnifiedEncounterStageModel({ ...args, activeAction: action });
      const after = buildUnifiedEncounterStageModel({ ...args, activeAction: { ...action, resolved: true } });
      const prose = live.narrative.paragraphs.map(p => p.segments.map(s => s.text).join('')).join('\n');
      // `fa.*` actions are not archived as chapters today (`isEncounterAction`); when a
      // record exists it must carry the veil's name, not the generic one.
      const record = buildChapterRecord({ ...action, resolved: true }, state);

      const expected = template.bindsFaction === 'rival' && template.nameTemplate?.includes('rival_faction')
        ? rival.name.replace(/^the\s+/i, '')
        : own.name.replace(/^the\s+/i, '');
      for (const [label, text] of [
        ['header', live.header.title],
        ['aftermath', after.header.title],
        ...(record ? [['chronicle', record.templateName] as const] : []),
      ] as const) {
        expect(text, `${template.id} ${label}`).toContain(expected);
        expect(text, `${template.id} ${label}`).not.toMatch(/\{|\bfaction\b/i);
      }
      expect(prose, template.id).not.toMatch(/\{|\bthe faction\b|\bfaction\b/i);
    }
  });
});
