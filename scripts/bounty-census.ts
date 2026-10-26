/**
 * Bounty census — design-lane 2026-10-26f evidence (scratch, never merged).
 * What a faction's bounty names, whether the named mortal lives out the posting, how often a
 * would-be hunter shares a place with them while it is open, and how often the three bounty
 * scenes are drawn today (none of them reads a bounty node).
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { isAutonomousDecisionActor } from '../src/engine/decisionTier';
import { getAgentLocationId } from '../src/engine/graphQueries';
import type { GraphNode } from '../src/types/graph';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;
const BOUNTY_SCENES = ['fa.bounty_hunt', 'ag.senior.bounty_hunt', 'mc.quest.collect_bounty'];
const HUNTER_FACTIONS = ['mercenary_company', 'adventuring_guild'];

const dead = (n?: GraphNode) => !n || n.properties.deceased === true || n.properties.status === 'dead';
const isMonster = (n: GraphNode) => n.properties.isMonster === true || n.properties.actorType === 'monster';

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
  enableTracing(); clearTraces();

  type B = { id: string; faction: string; target: string; created: number; expiry: number; targetKind: string; targetDecider: boolean;
    metMember: number; metMemberDecider: number; metHunterGuild: number; metAnyDecider: number; diedOpen: boolean; firstMeet?: number };
  const bounties = new Map<string, B>();
  const sceneDraws = new Map<string, { all: number; decider: number }>();
  const seenActions = new Set<string>();
  let grudgeSpawns = 0; let duelEndings = 0;
  const factionIssuers = new Set<string>();

  for (let t = 1; t <= ticks; t++) {
    state = runTick(state, [], runtime);
    const g = state.graph;
    for (const tr of getTraces() as unknown as Array<Record<string, unknown>>) {
      if (tr.category === 'fight.trigger' && tr.source === 'grudge' && !tr.skipped) grudgeSpawns++;
      if (tr.category === 'fight.ending') duelEndings++;
    }
    clearTraces();
    for (const a of state.unifiedActions) {
      if (seenActions.has(a.id) || !BOUNTY_SCENES.includes(a.templateId)) continue;
      seenActions.add(a.id);
      const s = sceneDraws.get(a.templateId) ?? { all: 0, decider: 0 };
      s.all++; const actor = g.getNode(a.actorId); if (actor && isAutonomousDecisionActor(actor)) s.decider++;
      sceneDraws.set(a.templateId, s);
    }
    // new bounties
    for (const n of g.getNodesByType('event')) {
      const p = n.properties;
      if (p.eventType !== 'bounty' || bounties.has(n.id)) continue;
      const tgt = g.getNode(p.targetAgentId as string);
      factionIssuers.add(p.issuingFactionId as string);
      bounties.set(n.id, {
        id: n.id, faction: p.issuingFactionId as string, target: p.targetAgentId as string, created: p.createdTick as number, expiry: p.expiryTick as number,
        targetKind: !tgt ? 'missing' : `${tgt.type}:${String(tgt.properties.actorType ?? '?')}${dead(tgt) ? ':dead' : ''}`,
        targetDecider: !!tgt && isAutonomousDecisionActor(tgt),
        metMember: 0, metMemberDecider: 0, metHunterGuild: 0, metAnyDecider: 0, diedOpen: false,
      });
    }
    // co-location while open
    const byPlace = new Map<string, string[]>();
    for (const a of g.getNodesByType('actor')) {
      if (a.properties.actorType !== 'individual' || dead(a) || isMonster(a)) continue;
      const loc = getAgentLocationId(g, a.id); if (!loc) continue;
      (byPlace.get(loc) ?? byPlace.set(loc, []).get(loc)!).push(a.id);
    }
    for (const b of bounties.values()) {
      if (t > b.expiry || t < b.created) continue;
      const tgt = g.getNode(b.target);
      if (dead(tgt)) { if (!b.diedOpen && tgt) b.diedOpen = true; continue; }
      const loc = getAgentLocationId(g, b.target); if (!loc) continue;
      let member = false, memberD = false, guild = false, anyD = false;
      for (const other of byPlace.get(loc) ?? []) {
        if (other === b.target) continue;
        const o = g.getNode(other)!;
        const d = isAutonomousDecisionActor(o);
        const memberships = g.getOutgoingEdges(other, 'member_of').map(e => g.getNode(e.target));
        if (memberships.some(f => f?.id === b.faction)) { member = true; if (d) memberD = true; }
        if (memberships.some(f => HUNTER_FACTIONS.includes(String(f?.properties.factionDefId)))) guild = true;
        if (d) anyD = true;
      }
      if (member) b.metMember++; if (memberD) b.metMemberDecider++; if (guild) b.metHunterGuild++; if (anyD) b.metAnyDecider++;
      if ((member || guild) && b.firstMeet === undefined) b.firstMeet = t - b.created;
    }
  }
  const list = [...bounties.values()];
  const kinds = new Map<string, number>(); for (const b of list) kinds.set(b.targetKind, (kinds.get(b.targetKind) ?? 0) + 1);
  const meets = list.map(b => b.firstMeet).filter((x): x is number => x !== undefined).sort((a, b) => a - b);
  const distinctTargets = new Set(list.map(b => b.target)).size;
  // One open bounty per faction per target: a posting while the same pair's earlier one is open is a re-post.
  const firstOpen = list.filter(b => !list.some(o => o !== b && o.faction === b.faction && o.target === b.target && o.created < b.created && o.expiry > b.created));
  const expectedDuels = (base: number) => firstOpen.reduce((s, b) => s + (1 - Math.pow(1 - base, b.metMember)), 0);
  const memberTicks = firstOpen.map(b => b.metMember).sort((a, b) => a - b);
  console.log(JSON.stringify({
    seed, ticks, bountiesPosted: list.length, issuers: factionIssuers.size, distinctTargets, targetKinds: Object.fromEntries(kinds),
    targetDeciders: list.filter(b => b.targetDecider).length,
    diedWhileOpen: list.filter(b => b.diedOpen).length,
    withMemberMeet: list.filter(b => b.metMember > 0).length,
    withMemberDeciderMeet: list.filter(b => b.metMemberDecider > 0).length,
    withHunterGuildMeet: list.filter(b => b.metHunterGuild > 0).length,
    withMemberOrGuildMeet: list.filter(b => b.firstMeet !== undefined).length,
    withAnyDeciderMeet: list.filter(b => b.metAnyDecider > 0).length,
    firstMeetMedianTicks: meets[Math.floor(meets.length / 2)] ?? null,
    firstOpenBounties: firstOpen.length, rePosts: list.length - firstOpen.length,
    memberTicksMedian: memberTicks[Math.floor(memberTicks.length / 2)] ?? 0,
    expectedDuels05: +expectedDuels(0.05).toFixed(1), expectedDuels02: +expectedDuels(0.02).toFixed(1), expectedDuels01: +expectedDuels(0.01).toFixed(1),
    sceneDraws: Object.fromEntries(sceneDraws), grudgeSpawns, fightEndings: duelEndings,
  }));
}
