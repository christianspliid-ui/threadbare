/**
 * Commission census — design-lane 2026-10-25g evidence (scratch, never merged).
 * How many faction commissions and bounties are posted, how much purse they take, and how
 * many faction encounters complete (member work + watched) that could take one up.
 */
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { readWealth } from '../src/engine/wealth';
import { isAutonomousDecisionActor } from '../src/engine/decisionTier';

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const seeds = (arg('--seeds') ?? '42,99,7').split(',').map(Number);
const ticks = Number(arg('--ticks') ?? 360);
const map = (arg('--map') ?? 'medium') as MapSizePreset;

for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS[map];
  let { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
  enableTracing(); clearTraces();
  const quests = new Set<string>(); const bounties = new Set<string>();
  const questFactions = new Map<string, number>();
  let maxOpenQuests = 0; let workSucceeded = 0; let workPasses = 0; const workFactions = new Map<string, number>();
  const purseSamples: number[] = [];
  const qc = { decider: 0, ambient: 0, deciderWithOpen: 0, ambientWithOpen: 0, deciderAgents: new Set<string>() };
  for (let t = 1; t <= ticks; t++) {
    state = runTick(state, [], runtime);
    for (const tr of getTraces() as unknown as Array<Record<string, unknown>>) {
      if (tr.category === 'faction_reputation' && tr.cause === 'quest_complete') {
        const a = state.graph.getNode(tr.agentId as string);
        const fid = tr.factionId as string;
        const hasOpen = state.graph.getNodesByType('event').some(n => n.properties.eventType === 'faction_quest' && n.properties.factionId === fid && (n.properties.expiryTick as number) > state.tick);
        if (a && isAutonomousDecisionActor(a)) { qc.decider++; qc.deciderAgents.add(a.id); if (hasOpen) qc.deciderWithOpen++; } else { qc.ambient++; if (hasOpen) qc.ambientWithOpen++; }
      }
      if (tr.category === 'faction_member_work') {
        workPasses++; workSucceeded += (tr.succeeded as number) ?? 0;
        workFactions.set(tr.factionId as string, (workFactions.get(tr.factionId as string) ?? 0) + ((tr.succeeded as number) ?? 0));
      }
    }
    clearTraces();
    let open = 0;
    for (const n of state.graph.getNodesByType('event')) {
      const p = n.properties;
      if (p.eventType === 'faction_quest') {
        if (!quests.has(n.id)) { quests.add(n.id); questFactions.set(p.factionId as string, (questFactions.get(p.factionId as string) ?? 0) + 1); }
        if ((p.expiryTick as number) > state.tick && !p.claimed) open++;
      }
      if (p.eventType === 'bounty') bounties.add(n.id);
    }
    maxOpenQuests = Math.max(maxOpenQuests, open);
    if (t % 24 === 0) {
      for (const f of state.graph.getNodesByType('actor').filter(a => a.properties.actorType === 'faction')) purseSamples.push(readWealth(f.properties));
    }
  }
  const factions = state.graph.getNodesByType('actor').filter(a => a.properties.actorType === 'faction');
  const postersWithWork = [...questFactions.keys()].filter(f => (workFactions.get(f) ?? 0) > 0).length;
  purseSamples.sort((a, b) => a - b);
  const med = purseSamples[Math.floor(purseSamples.length / 2)] ?? 0;
  console.log(JSON.stringify({
    seed, ticks, factions: factions.length,
    questComplete: { decider: qc.decider, deciderAgents: qc.deciderAgents.size, deciderWithOpen: qc.deciderWithOpen, ambient: qc.ambient, ambientWithOpen: qc.ambientWithOpen },
    questsPosted: quests.size, questPosters: questFactions.size, maxOpenQuests,
    bountiesPosted: bounties.size,
    memberWorkPasses: workPasses, memberWorkSucceeded: workSucceeded, workingFactions: workFactions.size,
    postersWithMemberWork: postersWithWork,
    purseMedian: med, purseP10: purseSamples[Math.floor(purseSamples.length * 0.1)] ?? 0, purseP90: purseSamples[Math.floor(purseSamples.length * 0.9)] ?? 0,
    topPosters: [...questFactions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
  }));
}
