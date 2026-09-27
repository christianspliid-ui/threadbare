/**
 * The live world context reads the past (THR-1637) — the dead, the battles and the monster
 * hosts a `found` thing is dressed by, read from a hand-built graph whose every record
 * mirrors a live writer's shape: `markMortalDead`'s retain mode, `recordBattleFought`,
 * `seedMonsterFaction`.
 *
 * The seeded-world proof (a generated world past tick 150, every found core) is the heavy
 * sibling, `worldContextPast.live.test.ts`.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { ITEM_GEN_CORES } from '../../../data/item-generator-cores';
import { ITEM_GEN_LIVE_EVENTS_MAX } from '../../../data/item-generator-tables';
import { buildItemWorldContext, hasItemWorldPast } from '../worldContext';
import { tryGenerate } from '../generateItem';
import { validateGeneratedItem } from '../validateGeneratedItem';
import { readBack } from '../readBack';
import { bandsForOrigin } from '../reviewBatch';

function world(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'town', type: 'location', name: 'Great Silverhold', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2, terrain: 'hills' } });
  g.addNode({ id: 'market', type: 'location', name: 'Market District', properties: { locationSubtype: 'market-district', parentLocationId: 'town' } });
  g.addNode({ id: 'field', type: 'location', name: 'Redmire', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 1 } });
  g.addNode({ id: 'culture_0', type: 'actor', name: 'the Harrowfolk', properties: { actorType: 'culture' } });
  g.addNode({ id: 'temple', type: 'actor', name: 'The Temple of the Spheres', properties: { actorType: 'faction', factionDefId: 'temple_of_spheres' } });

  // Two sieges of the same town: the older one is a repeat, so only the newer is told.
  g.addNode({ id: 'evt_battle_old', type: 'event', name: 'Battle at Great Silverhold', properties: { eventType: 'battle_fought', tick: 20, battleType: 'siege', resolutionType: 'stalemate', locationId: 'town' } });
  g.addNode({ id: 'evt_battle_new', type: 'event', name: 'Battle at Great Silverhold', properties: { eventType: 'battle_fought', tick: 60, battleType: 'siege', resolutionType: 'defender_victory', locationId: 'town' } });
  g.addNode({ id: 'evt_battle_field', type: 'event', name: 'Battle at Redmire', properties: { eventType: 'battle_fought', tick: 40, battleType: 'field_battle', resolutionType: 'attacker_victory', locationId: 'field' } });
  g.addNode({ id: 'evt_battle_nowhere', type: 'event', name: 'Battle at an unknown place', properties: { eventType: 'battle_fought', tick: 70, battleType: 'siege', resolutionType: 'stalemate' } });
  g.addNode({ id: 'evt_encounter', type: 'event', name: 'Shore Up Shelter', properties: { eventType: 'encounter_outcome', tick: 5 } });

  // A bard who died in a band brawl, standing in the market.
  g.addNode({ id: 'bard', type: 'actor', name: 'Edric', properties: { actorType: 'individual', npcRole: 'bard', residencePositionId: 'market', deceased: true, deceasedTick: 90, deathCause: 'band' } });
  g.addEdge({ id: 'bard_at', source: 'bard', target: 'market', type: 'located_at', properties: {} });
  g.addEdge({ id: 'bard_temple', source: 'bard', target: 'temple', type: 'member_of', properties: { rank: 0.3, role: 'member', joinedTick: 0 } });
  g.addEdge({ id: 'bard_culture', source: 'bard', target: 'culture_0', type: 'belongs_to', properties: {} });

  // A commander who fell in the old siege — the kept record names it.
  g.addNode({ id: 'captain', type: 'actor', name: 'Hesta Ryle', properties: { actorType: 'individual', npcRole: 'guard_captain', gender: 'female', deceased: true, deceasedTick: 20, deathCause: 'battle' } });
  g.addEdge({ id: 'captain_at', source: 'captain', target: 'town', type: 'located_at', properties: {} });
  g.addEdge({ id: 'captain_fought', source: 'captain', target: 'evt_battle_old', type: 'participated_in', properties: { outcome: 'stalemate', role: 'defender', tick: 20 } });

  // Killed in a fight by a mortal still in the graph; no home, no trade.
  g.addNode({ id: 'killer', type: 'actor', name: 'Bram Oskell', properties: { actorType: 'individual' } });
  g.addNode({ id: 'wanderer', type: 'actor', name: 'Arn Veck', properties: { actorType: 'individual', gender: 'male', deceased: true, deceasedTick: 50, deathCause: 'fight', slainBy: 'killer' } });
  g.addEdge({ id: 'wanderer_at', source: 'wanderer', target: 'field', type: 'located_at', properties: {} });

  // Never named: the living, a slain monster elite.
  g.addNode({ id: 'alive', type: 'actor', name: 'Maren Doss', properties: { actorType: 'individual' } });
  g.addNode({ id: 'elite', type: 'actor', name: 'Ryx', properties: { actorType: 'individual', isMonsterElite: true, deceased: true, deceasedTick: 95, deathCause: 'fight' } });

  // A monster host at a live lair, and one whose lair was cleared.
  g.addNode({ id: 'lair_0', type: 'location', name: 'Starving Hollow', properties: { locationSubtype: 'lair', lairTier: 'legendary', dominantSphere: 'entropy', hexCol: 8, hexRow: 8 } });
  g.addNode({ id: 'host_0', type: 'actor', name: 'The Blighted Plague Shamble', properties: { actorType: 'faction', isMonsterFaction: true, definitionId: 'monster_entropy', dominantSphere: 'entropy', lairId: 'lair_0', spawnedAtTick: 3 } });
  g.addNode({ id: 'lair_1', type: 'location', name: 'Old Den', properties: { locationSubtype: 'cleared_lair', lairTier: 'legendary', dominantSphere: 'matter', hexCol: 9, hexRow: 9 } });
  g.addNode({ id: 'host_1', type: 'actor', name: 'The Dread Golem Cluster', properties: { actorType: 'faction', isMonsterFaction: true, definitionId: 'monster_matter', dominantSphere: 'matter', lairId: 'lair_1', spawnedAtTick: 1 } });
  return g;
}

describe('buildItemWorldContext reads the past (THR-1637)', () => {
  const ctx = buildItemWorldContext(world(), {});

  it('the dead: every retained mortal death, never the living or a monster, most recent first', () => {
    expect(Object.keys(ctx.heroes)).toEqual(['bard', 'wanderer', 'captain']);
    expect(Object.values(ctx.heroes).every(h => h.dead)).toBe(true);
  });

  it('a deed and a fate phrased from what the graph records', () => {
    const bard = ctx.heroes.bard;
    expect(bard.role).toBe('a Temple of the Spheres bard');
    expect(bard.deed).toBe('who sang for Great Silverhold');
    expect(bard.fate).toBe('did not walk away from a brawl at Great Silverhold');
    expect(bard.pronoun).toBe('they');
    expect(bard.factionId).toBe('temple');

    const captain = ctx.heroes.captain;
    expect(captain.eventId).toBe('evt_battle_new');
    expect(captain.deed).toBe('who fought in the Siege of Great Silverhold');
    expect(captain.fate).toBe('fell in the Siege of Great Silverhold');
    expect(captain.role).toBe('a guard captain');
    expect(captain.family).toBe('Ryle');
    expect(captain.pronoun).toBe('she');

    const wanderer = ctx.heroes.wanderer;
    expect(wanderer.deed).toBe('who kept to the roads');
    expect(wanderer.fate).toBe('was killed by Bram Oskell at Redmire');
    expect(wanderer.role).toBe('a traveller');
  });

  it('the disasters: one battle per place and kind, the most recent kept, a placeless record dropped', () => {
    expect(Object.keys(ctx.events).sort()).toEqual(['evt_battle_field', 'evt_battle_new']);
    const siege = ctx.events.evt_battle_new;
    expect(siege.kind).toBe('siege');
    expect(siege.name).toBe('the Siege of Great Silverhold');
    expect(siege.placeId).toBe('town');
    expect(siege.salvage).toBe('It came down off the walls of Great Silverhold after the siege was broken.');
    const field = ctx.events.evt_battle_field;
    expect(field.kind).toBe('last_stand');
    expect(field.salvage).toBe('It was picked up off the field after the Battle of Redmire, where one army broke the other.');
    expect(Object.keys(ctx.events).length).toBeLessThanOrEqual(ITEM_GEN_LIVE_EVENTS_MAX);
  });

  it('the monster hosts: at a live lair only, with a one-of and the sphere\'s ward', () => {
    expect(Object.keys(ctx.monsters)).toEqual(['host_0']);
    const host = ctx.monsters.host_0;
    expect(host.name).toBe('the Blighted Plague Shamble');
    expect(host.one).toBe('a thing of the Blighted Plague Shamble');
    expect(host.sphere).toBe('entropy');
    expect(host.immune).toBe('#disease');
    expect(host.placeId).toBe('lair_0');
    expect(Object.keys(host.reachWeights).length).toBeGreaterThan(0);
  });

  it('every place, faction and culture the past names joins the tables — the settlement tier, never the market', () => {
    expect(Object.keys(ctx.places).sort()).toEqual(['field', 'lair_0', 'town']);
    expect(Object.keys(ctx.factions)).toEqual(['temple']);
    expect(Object.keys(ctx.cultures)).toEqual(['culture_0']);
    expect(hasItemWorldPast(ctx)).toBe(true);
  });

  it('a masterwork is dressed by its maker alone unless the past is asked for', () => {
    const g = world();
    g.addNode({ id: 'smith', type: 'actor', name: 'Tamsin Weir', properties: { actorType: 'individual' } });
    g.addEdge({ id: 'smith_at', source: 'smith', target: 'town', type: 'located_at', properties: {} });
    const made = buildItemWorldContext(g, { makerId: 'smith' });
    expect(hasItemWorldPast(made)).toBe(false);
    expect(Object.keys(made.places)).toEqual(['town']);
    const withPast = buildItemWorldContext(g, { makerId: 'smith', past: true });
    expect(Object.keys(withPast.heroes).length).toBe(3);
    expect(withPast.maker?.id).toBe('smith');
  });

  it('a world with no past names none, and says so', () => {
    const g = new WorldGraph();
    const empty = buildItemWorldContext(g, {});
    expect(hasItemWorldPast(empty)).toBe(false);
    expect(empty.maker).toBeNull();
  });

  it('a line naming a person and a battle names their own battle — never a battle they were not at', () => {
    const told: string[] = [];
    for (const coreId of ['war_banner', 'forbidden_book']) {
      for (let k = 0; k < 40; k++) {
        const r = tryGenerate({ seedKey: `gen_item:thr1637:own_event:${coreId}:${k}`, band: 3, origin: 'found', world: ctx, coreId });
        if (typeof r === 'string') continue;
        const heroIds = r.concepts.filter(c => c.kind === 'actor').map(c => c.id);
        for (const heroId of heroIds) {
          const own = ctx.heroes[heroId]?.eventId;
          for (const ev of Object.values(ctx.events)) {
            if (ev.id !== own && r.provenance.includes(ev.name)) told.push(`${r.name}: ${r.provenance}`);
          }
        }
      }
    }
    expect(told).toEqual([]);
  });

  it('every found core grows a clean item from this past: validator-clean on the first draw, read-back clean', () => {
    const failures: string[] = [];
    for (const core of ITEM_GEN_CORES.filter(c => c.origins.includes('found'))) {
      const band = core.bands.find(b => bandsForOrigin('found').includes(b));
      if (band === undefined) { failures.push(`${core.id}: no found band`); continue; }
      const r = tryGenerate({ seedKey: `gen_item:thr1637:${core.id}`, band, origin: 'found', world: ctx, coreId: core.id });
      if (typeof r === 'string') { failures.push(`${core.id}: ${r}`); continue; }
      const problems = validateGeneratedItem(r);
      if (problems.length) failures.push(`${core.id}: ${problems.join('; ')}`);
      const rb = readBack(r);
      if (!rb.ok) failures.push(`${core.id}: ${rb.failures.join('; ')}`);
    }
    expect(failures).toEqual([]);
  });
});
