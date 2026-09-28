/**
 * THR-1641 (S4a) — a guild's `.social.` templates reach two members who meet.
 *
 * Before: 39 `.social.` templates, zero ever offered. The lookup read
 * `FACTION_ENCOUNTER_TEMPLATES`, which holds only the Adventurers' Guild's six, and ten
 * of the eleven guild definitions listed `socialTemplateIds` that no file defines. These
 * tests pin the contract both ways — every listed id resolves to a drawable template,
 * and every `<prefix>.social.*` template is listed by its guild — and drive the real
 * lookup for a guild other than the Adventurers'.
 *
 * Interface contract: `guild-social-templates-reach-shared-members`.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { getSharedFactionSocialTemplates } from '../socialEncounterGeneration';
import { ALL_FACTION_DEFINITIONS } from '../../data/faction-definition-lookup';
import {
  getUnifiedTemplateById,
  UNIFIED_ACTION_TEMPLATES,
} from '../../data/unified-action-templates';
import type { MemberOfEdgeProperties } from '../../types/disposition';

/** A guild `.social.` id: `<guild prefix>.social.<name>` — not the `action.social.*` god verbs. */
const GUILD_SOCIAL_ID = /^([a-z]+)\.social\.[a-z_]+$/;

function guildSocialIds(): string[] {
  return UNIFIED_ACTION_TEMPLATES
    .map(t => t.id)
    .filter(id => GUILD_SOCIAL_ID.test(id) && !id.startsWith('action.'));
}

function twoMembers(factionDefId: string): WorldGraph {
  const graph = new WorldGraph();
  const factionId = `faction.${factionDefId}`;
  graph.addNode({
    id: factionId,
    type: 'actor',
    name: factionDefId,
    properties: { actorType: 'faction', factionType: 'guild', factionDefId },
  });
  for (const agentId of ['a1', 'a2']) {
    graph.addNode({ id: agentId, type: 'actor', name: agentId, properties: { actorType: 'individual' } });
    graph.addEdge({
      id: `${agentId}_member_of_${factionId}`,
      source: agentId,
      target: factionId,
      type: 'member_of',
      properties: {
        role: 'journeyman', rank: 0, joinedTick: 1, reputation: 0.2, factionDefId,
      } satisfies MemberOfEdgeProperties,
    });
  }
  return graph;
}

describe('guild social templates — the id lists and the templates agree (THR-1641)', () => {
  it('every listed socialTemplateId resolves to a drawable template', () => {
    const broken: string[] = [];
    for (const def of ALL_FACTION_DEFINITIONS.values()) {
      for (const id of def.socialTemplateIds) {
        const tmpl = getUnifiedTemplateById(id);
        if (!tmpl) broken.push(`${def.id}: ${id} (no template)`);
        else if (tmpl.drawable === false) broken.push(`${def.id}: ${id} (not drawable)`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('every guild .social. template is listed by exactly one guild, which shares its prefix', () => {
    const ids = guildSocialIds();
    // Non-vacuous: the 6 Adventurers' + 33 per-guild templates.
    expect(ids.length).toBeGreaterThanOrEqual(39);
    const listedBy = new Map<string, string[]>();
    for (const def of ALL_FACTION_DEFINITIONS.values()) {
      for (const id of def.socialTemplateIds) listedBy.set(id, [...(listedBy.get(id) ?? []), def.id]);
    }
    const unlisted = ids.filter(id => !listedBy.has(id));
    expect(unlisted, 'guild .social. templates no guild lists — no path offers them').toEqual([]);
    const multiply = ids.filter(id => (listedBy.get(id) ?? []).length > 1);
    expect(multiply).toEqual([]);
    for (const def of ALL_FACTION_DEFINITIONS.values()) {
      const prefixes = new Set(def.socialTemplateIds.map(id => id.split('.')[0]));
      expect(prefixes.size, `${def.id} lists social ids under several prefixes`).toBeLessThanOrEqual(1);
    }
  });
});

describe('getSharedFactionSocialTemplates — a guild other than the Adventurers\' (THR-1641)', () => {
  it('offers the Arcane Circle\'s templates to two members in a city', () => {
    const graph = twoMembers('arcane_circle');
    const ids = getSharedFactionSocialTemplates(graph, 'a1', 'a2', 'city').map(t => t.id);
    expect(ids.sort()).toEqual([
      'ac.social.lecture_hall', 'ac.social.library_browse', 'ac.social.spell_exchange',
    ]);
  });

  it('matches the Place the target stands in, not only its settlement', () => {
    // `mc.social.sparring_ring` names `barracks` but not `hamlet`: only the Place's own
    // subtype lets it match here.
    const graph = twoMembers('mercenary_company');
    const without = getSharedFactionSocialTemplates(graph, 'a1', 'a2', 'hamlet').map(t => t.id);
    expect(without).toEqual([]);
    const withPlace = getSharedFactionSocialTemplates(
      graph, 'a1', 'a2', 'hamlet', ['sublocation-type.barracks', 'barracks'],
    ).map(t => t.id);
    expect(withPlace).toContain('mc.social.sparring_ring');
    expect(withPlace).not.toContain('mc.social.contract_negotiation');
  });

  it('offers nothing to members of two different guilds', () => {
    const graph = twoMembers('arcane_circle');
    graph.addNode({ id: 'a3', type: 'actor', name: 'a3', properties: { actorType: 'individual' } });
    expect(getSharedFactionSocialTemplates(graph, 'a1', 'a3', 'city')).toEqual([]);
  });
});
