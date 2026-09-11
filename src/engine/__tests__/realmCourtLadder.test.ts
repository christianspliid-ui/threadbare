/**
 * The court ladder, climbable — THR-1155 slice 3, Done-when bullet 2.
 *
 * Slice 2 gave every Realm a `REALM_RANK_LADDER`: *stranger · subject · yeoman · sworn ·
 * thane · counsel*, six rungs with thresholds, slots, access prefixes and bonuses,
 * minted into the definition by `buildRealmDefinition`. Every rung was real and none
 * was reachable, for two independent reasons that had to be closed together.
 *
 * **One** — a Realm's definition is minted per world, so the reads that walk a ladder
 * had to resolve it through `getFactionDefinition` rather than the static catalogue.
 * Slice 2's sweep did that; this file is the behavioural proof for a *Realm*
 * specifically, which the sweep's own tests took on a founded guild.
 *
 * **Two** — `FACTION_ENCOUNTER_META` answers *which faction is this encounter about*
 * with a static `factionDefId`, and no static string can name `realm.<cultureId>` over a
 * generated culture. Every consumer of that table fails soft in its own direction: the
 * rank gate stands open, the reputation reward is skipped, the join outcome returns
 * false. Together they meant no realm encounter could ever move a mortal up a rung. The
 * class-scoped row and `resolveMetaFactionDefId` are the answer; these are its arms.
 *
 * The world is **generated**, never a fixture, for the reason slice 2 gave: that culture
 * domains exist, that Realms are minted over them, and that their definitions reach the
 * lookup are all properties of real worldgen. A fixture would invent all three and
 * verify fiction.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { WorldGraph } from '../graph';
import { applyFactionReputationGain, meetsFactionRankRequirement } from '../factionReputation';
import { resolveMetaFactionDefId } from '../factionMetaScope';
import { getLocationHolder } from '../realmHolder';
import { getFactionDefinition } from '../../data/faction-definition-lookup';
import { FACTION_ENCOUNTER_META } from '../../data/faction-encounter-content';
import { REALM_RANK_LADDER, REALM_FACTION_CLASS } from '../../data/realm-content';
import { CLASS_SCOPED_META_DEF_ID } from '../../data/faction-constants';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { FactionEncounterMeta } from '../../types/faction';

const SEED = 42;

let state: GameState;
let realm: GraphNode;
let realmDefId: string;
/** A Location this Realm holds — the ground half of the resolution rule needs one. */
let heldLocationId: string;

beforeAll(() => {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, SEED)[0];
  const built = initializeGameState(
    archetype, 'Court', createBalancedCosmology(), SEED, preset.cols, preset.rows,
  );
  state = built.state;

  const realms = state.graph.getNodesByType('actor')
    .filter(n => n.properties.factionClass === REALM_FACTION_CLASS);
  realm = realms[0];
  realmDefId = realm?.properties.factionDefId as string;

  heldLocationId = state.graph.getOutgoingEdges(realm?.id ?? '', 'controls')
    .map(e => e.target)
    .find(id => getLocationHolder(state.graph, id)?.id === realm?.id) as string;
});

/** The `member_of` shape `npcSeeding` mints — nothing here is invented. */
function swear(graph: WorldGraph, agentId: string, reputation: number): void {
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Subject',
    properties: { actorType: 'individual', hexCol: 0, hexRow: 0 },
  });
  graph.addEdge({
    id: `member_${agentId}`,
    source: agentId,
    target: realm.id,
    type: 'member_of',
    properties: {
      factionDefId: realmDefId, reputation, rank: reputation, role: 'stranger', joinedTick: 1,
    },
  });
}

describe('a Realm has a court a mortal can climb (THR-1155)', () => {
  it('mints a world with a Realm that holds ground — the non-vacuity arm', () => {
    // Every arm below reads `realm`, `realmDefId` and `heldLocationId`. If worldgen
    // seated no Realm, or seated one holding nothing, the rest of this file would pass
    // over an empty subject and mean nothing.
    expect(realm).toBeDefined();
    expect(realmDefId).toMatch(/^realm\./);
    expect(heldLocationId).toBeTruthy();
    expect(getFactionDefinition(realmDefId)).not.toBeNull();
  });

  it('walks the ladder in the court\'s own words, through the lookup', () => {
    const graph = state.graph;
    swear(graph, 'actor_court_climber', 0.0);

    // A stranger at the door.
    const atFloor = applyFactionReputationGain(
      graph, 'actor_court_climber', realm.id, 0, 10, 'quest_complete',
    );
    expect(atFloor.newRank).toBe('stranger');

    // Past the `subject` threshold (0.15) — the first rung, and it is a *realm* word,
    // not the `props.role` fallback a definition-less faction would have left standing.
    const sworn = applyFactionReputationGain(
      graph, 'actor_court_climber', realm.id, 0.5, 11, 'quest_complete',
    );
    expect(sworn.rankChanged).toBe(true);
    expect(REALM_RANK_LADDER).toContain(sworn.newRank as typeof REALM_RANK_LADDER[number]);
    // 0.5 sits between `sworn` (0.45) and `thane` (0.65).
    expect(sworn.newRank).toBe('sworn');

    // And the gate reads the same ladder: a Sworn is not yet a Thane.
    expect(meetsFactionRankRequirement(graph, 'actor_court_climber', realmDefId, 'sworn')).toBe(true);
    expect(meetsFactionRankRequirement(graph, 'actor_court_climber', realmDefId, 'thane')).toBe(false);
  });

  it('leaves the rung at the fallback when the definition does not resolve — the control', () => {
    // The same membership shape against an id no lookup answers. If the arm above were
    // green for some reason other than the Realm's definition resolving, this would be
    // green too; it is not — the rank stays the edge's stored `role` and never becomes a
    // ladder word.
    const graph = state.graph;
    graph.addNode({
      id: 'actor_stray',
      type: 'actor',
      name: 'Stray',
      properties: { actorType: 'individual', hexCol: 0, hexRow: 0 },
    });
    graph.addEdge({
      id: 'member_stray',
      source: 'actor_stray',
      target: realm.id,
      type: 'member_of',
      properties: {
        factionDefId: 'realm.no_such_culture', reputation: 0, rank: 0, role: 'member', joinedTick: 1,
      },
    });

    const result = applyFactionReputationGain(
      graph, 'actor_stray', realm.id, 0.9, 12, 'quest_complete',
    );
    expect(result.rankChanged).toBe(false);
    expect(result.newRank).toBe('member');
    expect(REALM_RANK_LADDER).not.toContain(result.newRank as typeof REALM_RANK_LADDER[number]);
  });
});

describe('a class-scoped meta names the Realm at read time (THR-1155)', () => {
  const realmRow = (): FactionEncounterMeta => ({
    factionDefId: CLASS_SCOPED_META_DEF_ID,
    factionClass: REALM_FACTION_CLASS,
    minRank: 'subject',
    reputationReward: 0.04,
    questType: 'standard',
  });

  it('ships the two rows `buildRealmDefinition` already promises', () => {
    for (const id of ['realm.join', 'realm.promotion']) {
      const meta = FACTION_ENCOUNTER_META.get(id);
      expect(meta, id).toBeDefined();
      expect(meta!.factionClass).toBe(REALM_FACTION_CLASS);
      // The parked token, not a plausible-looking id: a site that forgets the resolver
      // must resolve to nothing rather than to some other faction.
      expect(meta!.factionDefId).toBe(CLASS_SCOPED_META_DEF_ID);
      expect(getFactionDefinition(meta!.factionDefId)).toBeNull();
    }
  });

  it('returns an authored row\'s id untouched — the sweep changed no guild', () => {
    const guildRow = FACTION_ENCOUNTER_META.get('ag.quest.ruin_delve');
    expect(guildRow).toBeDefined();
    expect(guildRow!.factionClass).toBeUndefined();
    expect(resolveMetaFactionDefId(state.graph, 'actor_court_climber', guildRow!))
      .toBe('adventuring_guild');
  });

  it('answers with the Realm the agent already has standing with', () => {
    const graph = state.graph;
    swear(graph, 'actor_standing', 0.3);
    expect(resolveMetaFactionDefId(graph, 'actor_standing', realmRow())).toBe(realmDefId);
  });

  it('answers with the Realm holding the ground, for a mortal with no standing yet', () => {
    // The join case: nobody is a member of a court before they join it, so membership
    // cannot be the only source. The ground is.
    const graph = state.graph;
    graph.addNode({
      id: 'actor_newcomer',
      type: 'actor',
      name: 'Newcomer',
      properties: { actorType: 'individual', hexCol: 0, hexRow: 0 },
    });
    expect(resolveMetaFactionDefId(graph, 'actor_newcomer', realmRow(), heldLocationId))
      .toBe(realmDefId);
  });

  it('binds nothing on ground no Realm holds', () => {
    // Not a defect — there is no court there to be a stranger to. The caller skips,
    // which is what every consumer already did for an unresolvable id.
    const graph = state.graph;
    const unheld = graph.getNodesByType('location')
      .find(n => getLocationHolder(graph, n.id) === null);
    expect(unheld, 'a seeded world holds some ground unclaimed').toBeDefined();
    expect(resolveMetaFactionDefId(graph, 'actor_newcomer', realmRow(), unheld!.id)).toBeNull();
  });

  it('never answers with a non-Realm holder, even on ground a faction holds', () => {
    // The guild-hall reconciliation cedes real domain towns to authored factions. Asking
    // the map *cannot* return one, because `isRealm` is read here rather than remembered
    // at the call site — the reason slice 3 part 1 gave for asking the map over the town.
    const graph = state.graph;
    const guildHeld = graph.getNodesByType('location')
      .find(n => {
        const holder = getLocationHolder(graph, n.id);
        return holder !== null && !holder.isRealm;
      });
    expect(guildHeld, 'a seeded world cedes some towns to authored factions').toBeDefined();
    expect(resolveMetaFactionDefId(graph, 'actor_newcomer', realmRow(), guildHeld!.id)).toBeNull();
  });
});
