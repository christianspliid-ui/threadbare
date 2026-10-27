/**
 * THR-2072 — a bounty is collected in a duel.
 * Plan: Docs/plans/2026-10-26-thr-2072-bounty-collected-in-a-duel.md § Done when.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  bountiesOnTarget,
  closeBounties,
  collectBounty,
  huntableBounty,
  readBounties,
} from '../factionBounties';
import { executeIssueBounty } from '../phaseFactionActions';
import { bountyCollectBranch } from '../fights/bountyCollect';
import { runGrudgeDuels } from '../fights/grudgeDuelTrigger';
import { writeFightCooldown, fightPairKey } from '../monsters/lairArrivalTrigger';
import { resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { BOUNTY_COST, BOUNTY_MEANS_PAY, BOUNTY_REWARD } from '../../types/factionAction';
import { EDGE_SCHEMA } from '../../types/edgeSchema';
import { GRUDGE_DUEL_COOLDOWN_TICKS } from '../../data/fight-constants';
import { FIGHT_DUEL_BOUNTY_DEFENCE_ID, FIGHT_DUEL_BOUNTY_ID } from '../../data/encounters/fight-duel-bounty';
import { FIGHT_DUEL_GRUDGE_ID } from '../../data/encounters/fight-duel-grudge';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { BOUNTY_CAUSE_LINE } from '../../data/mortal-means-constants';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { FightEndingFace } from '../../types/fight';

const ASC = 'asc-1';
const GUILD = 'faction_guild';
const HUNTER = 'hunter';
const TARGET = 'joss';

function baseState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 100, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: ASC, essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    pendingEncounterSeeds: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    effectStates: new Map(),
    ...overrides,
  } as unknown as GameState;
}

function addMortal(g: WorldGraph, id: string, opts: { at?: string; tier?: string; wealth?: number } = {}): void {
  g.addNode({
    id, type: 'actor', name: id === TARGET ? 'Joss Harl' : id === HUNTER ? 'Edda Vane' : id.toUpperCase(),
    properties: {
      actorType: 'individual',
      wealth: opts.wealth ?? 30,
      axiologicalProfile: { courage_prudence: 0 },
      domainCapabilities: { eye: 20, iron: 20 },
      ...(opts.tier ? { spotlightTier: opts.tier } : {}),
    },
  });
  g.addEdge({ id: `e.${id}.at`, source: id, target: opts.at ?? 'square', type: 'located_at', properties: {} });
}

/** A square with the guild, a member hunter and the guild's cast-out target. */
function world(opts: { hunterTier?: string; purse?: number } = {}): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: ASC, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'square', type: 'location', name: 'Millbrook', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  g.addNode({
    id: GUILD, type: 'actor', name: 'The Adventurers Guild',
    properties: { actorType: 'faction', factionDefId: 'adventuring_guild', wealth: opts.purse ?? 40 },
  });
  addMortal(g, HUNTER, { tier: opts.hunterTier });
  addMortal(g, TARGET);
  g.addEdge({
    id: 'e_member', source: HUNTER, target: GUILD, type: 'member_of',
    properties: { role: 'member', joinedTick: 0, rank: 0.3, factionDefId: 'adventuring_guild' },
  });
  g.addEdge({ id: 'e_hostile', source: GUILD, target: TARGET, type: 'hostile_to', properties: { reason: 'excommunicated' } });
  return g;
}

/** Issue the guild's bounty on the target the way the faction phase does. */
function issue(g: WorldGraph, tick = 100): string {
  const record = executeIssueBounty(baseState(g, { tick }), g.getNode(GUILD)!, () => 0);
  expect(record).not.toBeNull();
  return (record!.details as { bountyId: string }).bountyId;
}

/** Issue a bounty that stays open for the whole forced-roll search. */
function issueLong(g: WorldGraph): string {
  const id = issue(g);
  g.updateNode(id, { properties: { expiryTick: 100_000 } });
  return id;
}

function colocated(g: WorldGraph): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of g.getNodesByType('actor')) {
    if (n.properties.actorType !== 'individual') continue;
    const loc = g.getOutgoingEdges(n.id, 'located_at')[0]?.target;
    if (!loc) continue;
    if (!out.has(loc)) out.set(loc, []);
    out.get(loc)!.push(n.id);
  }
  return out;
}

/** The first tick in [from, from+limit) on which the bounty licence spawns a duel (forced roll). */
function firstSpawn(g: WorldGraph, from = 101, limit = 2000, extra: Partial<GameState> = {}): { tick: number; action: UnifiedAction } | null {
  for (let t = from; t < from + limit; t++) {
    const res = runGrudgeDuels(baseState(g, { tick: t, ...extra }), colocated(g));
    if (res.spawned.length > 0) return { tick: t, action: res.spawned[0] };
  }
  return null;
}

/** A finished bounty duel with the given faces, for the fight-end branch. */
function finishedDuel(
  templateId: string,
  actorId: string,
  opponentId: string,
  faces: { actor?: FightEndingFace; opponent?: FightEndingFace },
): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, targetId: opponentId, templateId,
    fightState: {
      result: 'overcome', opponentId,
      ...(faces.actor ? { ending: { face: faces.actor, scarWritten: false, grudgeWritten: false } } : {}),
      ...(faces.opponent ? { opponentEnding: { face: faces.opponent, scarWritten: false, grudgeWritten: false } } : {}),
    },
  } as unknown as UnifiedAction;
}

const ctx = (tick: number) => ({ tick, rng: () => 0.5, overrideCtx: {} as never });
const wealthOf = (g: WorldGraph, id: string) => g.getNode(id)!.properties.wealth as number;
const conditionsOf = (g: WorldGraph, id: string) => (g.getNode(id)!.properties.conditions as string[] | undefined) ?? [];

beforeEach(() => {
  enableTracing();
  clearTraces();
  resetUnifiedActionCounter();
});

describe('executeIssueBounty (THR-2072)', () => {
  it('holds the reward as escrow, costs the purse, and marks the target hunted', () => {
    const g = world();
    const id = issue(g);
    const props = g.getNode(id)!.properties;
    expect(props.escrow).toBe(BOUNTY_REWARD);
    expect(props.status).toBe('active');
    expect(props.reward).toBeUndefined();
    expect(wealthOf(g, GUILD)).toBe(40 - BOUNTY_COST);
    expect(conditionsOf(g, TARGET)).toContain('hunted');
  });

  it('refuses a gone target, a faction target and a second open bounty from the same faction', () => {
    const dead = world();
    dead.updateNode(TARGET, { properties: { deceased: true } });
    expect(executeIssueBounty(baseState(dead), dead.getNode(GUILD)!, () => 0)).toBeNull();

    const rebel = world();
    rebel.removeEdge('e_hostile');
    rebel.addNode({ id: 'rebels', type: 'actor', name: 'The Rebels', properties: { actorType: 'faction' } });
    rebel.addEdge({ id: 'e_h_rebels', source: GUILD, target: 'rebels', type: 'hostile_to', properties: {} });
    expect(executeIssueBounty(baseState(rebel), rebel.getNode(GUILD)!, () => 0)).toBeNull();

    const twice = world();
    issue(twice, 100);
    const purse = wealthOf(twice, GUILD);
    expect(executeIssueBounty(baseState(twice, { tick: 110 }), twice.getNode(GUILD)!, () => 0)).toBeNull();
    expect(wealthOf(twice, GUILD)).toBe(purse);
  });
});

describe('the bounty licence (grudgeDuelTrigger)', () => {
  it('a member co-located with the target spawns a bounty duel with the hunter as actor', () => {
    const g = world();
    issueLong(g);
    const hit = firstSpawn(g);
    expect(hit).not.toBeNull();
    expect(hit!.action.templateId).toBe(FIGHT_DUEL_BOUNTY_ID);
    expect(hit!.action.actorId).toBe(HUNTER);
    expect(hit!.action.targetId).toBe(TARGET);
    const trace = getTraces().find(t => t.category === 'fight.trigger' && (t as { source?: string }).source === 'bounty' && !(t as { skipped?: string }).skipped);
    expect((trace as { bountyId?: string }).bountyId).toMatch(/^bounty_/);
  });

  it('the hunted acts (defence template) when only the hunted is threaded', () => {
    const g = world();
    g.addEdge({ id: 'thread', source: ASC, target: TARGET, type: 'thread', properties: { courtPosition: 'the_first' } });
    issueLong(g);
    const hit = firstSpawn(g);
    expect(hit!.action.templateId).toBe(FIGHT_DUEL_BOUNTY_DEFENCE_ID);
    expect(hit!.action.actorId).toBe(TARGET);
    expect(hit!.action.targetId).toBe(HUNTER);
  });

  it('a non-member, the target alone, a dead target and a cooling pair never spawn', () => {
    const outsider = world();
    issueLong(outsider);
    outsider.removeEdge('e_member');
    expect(firstSpawn(outsider, 101, 600)).toBeNull();

    const alone = world();
    issueLong(alone);
    alone.removeEdge(`e.${HUNTER}.at`);
    alone.addNode({ id: 'elsewhere', type: 'location', name: 'Elsewhere', properties: {} });
    alone.addEdge({ id: 'away', source: HUNTER, target: 'elsewhere', type: 'located_at', properties: {} });
    expect(firstSpawn(alone, 101, 600)).toBeNull();

    const dead = world();
    issueLong(dead);
    dead.updateNode(TARGET, { properties: { deceased: true } });
    expect(firstSpawn(dead, 101, 39)).toBeNull();

    const cooling = world();
    issueLong(cooling);
    const cooldowns = writeFightCooldown(undefined, fightPairKey(HUNTER, TARGET), 100 + GRUDGE_DUEL_COOLDOWN_TICKS, 100);
    for (let t = 101; t < 100 + GRUDGE_DUEL_COOLDOWN_TICKS; t++) {
      expect(runGrudgeDuels(baseState(cooling, { tick: t, fightCooldowns: cooldowns }), colocated(cooling)).spawned).toHaveLength(0);
    }
  });

  it('a pair with an injury grudge rolls the grudge only', () => {
    const g = world();
    issueLong(g);
    g.addEdge({ id: 'grudge', source: HUNTER, target: TARGET, type: 'hostile_to', properties: { cause: 'attempted_killing' } });
    const hit = firstSpawn(g, 101, 2000);
    expect(hit!.action.templateId).toBe(FIGHT_DUEL_GRUDGE_ID);
    expect(getTraces().some(t => (t as { source?: string }).source === 'bounty')).toBe(false);
  });

  it('both bounty templates are registered and spawn-only', () => {
    for (const id of [FIGHT_DUEL_BOUNTY_ID, FIGHT_DUEL_BOUNTY_DEFENCE_ID]) {
      const template = getUnifiedTemplateById(id);
      expect(template?.id).toBe(id);
      expect(template?.locationSubtypes).toBeUndefined();
    }
  });
});

describe('collection at the fight end (bountyCollectBranch)', () => {
  for (const face of ['yielded_to_mortal', 'spared', 'mauled', 'slain'] as const) {
    it(`a ${face} target pays: one collected edge, Means paid, hunted lifted`, () => {
      const g = world();
      const id = issue(g);
      const state = baseState(g, { tick: 120 });
      const out = bountyCollectBranch(state, finishedDuel(FIGHT_DUEL_BOUNTY_ID, HUNTER, TARGET, { opponent: face }), ctx(120));

      const edges = g.getIncomingEdges(id, 'collected');
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe(HUNTER);
      const schema = EDGE_SCHEMA.collected;
      expect(g.getNode(edges[0].source)!.type).toBe(schema.sourceNodeType);
      expect(g.getNode(edges[0].target)!.type).toBe(schema.targetNodeType);
      for (const key of schema.requiredProperties ?? []) expect(edges[0].properties).toHaveProperty(key);

      expect(g.getNode(id)!.properties.status).toBe('collected');
      expect(g.getNode(id)!.properties.escrowPaid).toBe(BOUNTY_REWARD);
      expect(wealthOf(g, HUNTER)).toBe(30 + BOUNTY_MEANS_PAY);
      expect(g.getNode(HUNTER)!.properties.lastWealthReason).toBe('bounty');
      expect(conditionsOf(g, TARGET)).not.toContain('hunted');
      expect(out && out.events?.[0]?.message).toBe('Edda Vane collected the price on Joss Harl\'s head at Millbrook.');

      // Collected once: a second end writes no second edge.
      bountyCollectBranch(state, finishedDuel(FIGHT_DUEL_BOUNTY_ID, HUNTER, TARGET, { opponent: face }), ctx(121));
      expect(g.getIncomingEdges(id, 'collected')).toHaveLength(1);
    });
  }

  it('the defence template collects when the hunted actor is beaten', () => {
    const g = world();
    const id = issue(g);
    bountyCollectBranch(baseState(g), finishedDuel(FIGHT_DUEL_BOUNTY_DEFENCE_ID, TARGET, HUNTER, { actor: 'spared' }), ctx(120));
    expect(g.getIncomingEdges(id, 'collected')[0]?.source).toBe(HUNTER);
  });

  it('an unseen hunter collects with no Means', () => {
    const g = world({ hunterTier: 'background' });
    const id = issue(g);
    bountyCollectBranch(baseState(g), finishedDuel(FIGHT_DUEL_BOUNTY_ID, HUNTER, TARGET, { opponent: 'mauled' }), ctx(120));
    expect(g.getNode(id)!.properties.status).toBe('collected');
    expect(wealthOf(g, HUNTER)).toBe(30);
    const trace = getTraces().find(t => t.category === 'economy.bounty') as { meansPaid?: boolean } | undefined;
    expect(trace?.meansPaid).toBe(false);
  });

  it('a target who wins, flees or breaks off leaves the bounty open', () => {
    for (const faces of [{ actor: 'mauled' as const }, { opponent: 'routed' as const }, { actor: 'broke_off' as const, opponent: 'broke_off' as const }]) {
      const g = world();
      const id = issue(g);
      const out = bountyCollectBranch(baseState(g), finishedDuel(FIGHT_DUEL_BOUNTY_ID, HUNTER, TARGET, faces), ctx(120));
      expect(g.getNode(id)!.properties.status).toBe('active');
      expect(g.getIncomingEdges(id, 'collected')).toHaveLength(0);
      expect(conditionsOf(g, TARGET)).toContain('hunted');
      if (faces.opponent === 'routed') {
        expect(out && out.events?.[0]?.message).toBe('Joss Harl got away from Edda Vane at Millbrook; the price on their head still stands.');
      }
    }
  });

  it('a double knockout collects nothing: a beaten hunter is never paid', () => {
    for (const hunterFace of ['mauled', 'spared', 'slain'] as const) {
      const g = world();
      const id = issue(g);
      const out = bountyCollectBranch(baseState(g), finishedDuel(FIGHT_DUEL_BOUNTY_ID, HUNTER, TARGET, { actor: hunterFace, opponent: 'mauled' }), ctx(120));
      expect(g.getNode(id)!.properties.status).toBe('active');
      expect(g.getIncomingEdges(id, 'collected')).toHaveLength(0);
      expect(wealthOf(g, HUNTER)).toBe(30);
      expect(out).toBeUndefined();
    }
  });

  it('the stakes endings never claim a collection their band cannot guarantee', () => {
    const hunter = getUnifiedTemplateById(FIGHT_DUEL_BOUNTY_ID)!.stakes!;
    const hunted = getUnifiedTemplateById(FIGHT_DUEL_BOUNTY_DEFENCE_ID)!.stakes!;
    expect(hunter.won).not.toMatch(/collected/);
    expect(hunted.lost).not.toMatch(/run down|paid/);
    for (const s of [hunter, hunted]) expect(`${s.won} ${s.lost}`).not.toMatch(/\{/);
  });

  it('ignores a duel that is not a bounty duel', () => {
    const g = world();
    const id = issue(g);
    bountyCollectBranch(baseState(g), finishedDuel(FIGHT_DUEL_GRUDGE_ID, HUNTER, TARGET, { opponent: 'slain' }), ctx(120));
    expect(g.getNode(id)!.properties.status).toBe('active');
  });
});

describe('closeBounties', () => {
  it('a lapse refunds the escrow once and lifts hunted', () => {
    const g = world();
    const id = issue(g, 100);
    const purse = wealthOf(g, GUILD);
    expect(closeBounties({ graph: g }, 139)).toBe(0);
    expect(closeBounties({ graph: g }, 140)).toBe(1);
    expect(wealthOf(g, GUILD)).toBe(purse + BOUNTY_REWARD);
    expect(g.getNode(id)!.properties.status).toBe('lapsed');
    expect(conditionsOf(g, TARGET)).not.toContain('hunted');
    expect(closeBounties({ graph: g }, 141)).toBe(0);
    expect(wealthOf(g, GUILD)).toBe(purse + BOUNTY_REWARD);
  });

  it('a target gone some other way lapses the bounty at once', () => {
    const g = world();
    const id = issue(g, 100);
    g.updateNode(TARGET, { properties: { deceased: true } });
    expect(closeBounties({ graph: g }, 101)).toBe(1);
    const trace = getTraces().find(t => t.category === 'economy.bounty') as { reason?: string } | undefined;
    expect(trace?.reason).toBe('target_gone');
    expect(g.getNode(id)!.properties.status).toBe('lapsed');
  });

  it('a pre-THR-2072 bounty (no escrow) lapses with no refund', () => {
    const g = world();
    g.addNode({
      id: 'old', type: 'event', name: 'Bounty on Joss Harl',
      properties: { eventType: 'bounty', issuingFactionId: GUILD, targetAgentId: TARGET, reward: 10, expiryTick: 50, createdTick: 10, status: 'active' },
    });
    const purse = wealthOf(g, GUILD);
    expect(closeBounties({ graph: g }, 60)).toBe(1);
    expect(wealthOf(g, GUILD)).toBe(purse);
  });
});

describe('sheet and debug reads', () => {
  it('bountiesOnTarget names each faction once while open; readBounties reports the collector', () => {
    const g = world();
    const id = issue(g);
    expect(bountiesOnTarget(g, TARGET, 110)).toEqual([{ factionId: GUILD, factionName: 'The Adventurers Guild' }]);
    expect(huntableBounty(g, HUNTER, TARGET, 110)?.id).toBe(id);
    collectBounty({ graph: g }, id, HUNTER, 120);
    expect(bountiesOnTarget(g, TARGET, 121)).toEqual([]);
    expect(readBounties(g, GUILD)[0]).toMatchObject({ id, status: 'collected', escrow: 0, collectedBy: HUNTER, collectedTick: 120 });
  });

  it('the Means cause line is the one constant', () => {
    expect(BOUNTY_CAUSE_LINE).toBe('a price their faction paid for');
  });
});
