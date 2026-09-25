// THR-1590 follow-up diagnostics for readers/attended.ts, on the same `?seeded` world:
//  (1) where The First is and what it is doing each tick (why its first firing is late);
//  (2) whether the social generator produces candidates at all, and whether any social-pool
//      template reaches a decision — read off the engine's own traces (tracing on, buffer
//      drained every tick; `social_encounter_generation` is emitted once per deciding agent).
// Usage: node .cache/attended-diag.mjs <seed> <ticks>
import { initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, DEV_ASCENDANT_IDENTITY } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../../../../src/engine/orchestrator';
import { deriveCosmologyFromIdentity } from '../../../../src/engine/remembrance';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { enableTracing, getTraces, clearTraces } from '../../../../src/engine/traceBuffer';
import { SOCIAL_ENCOUNTER_TEMPLATES } from '../../../../src/data/social-encounter-content';
import { SOCIAL_SCENE_TEMPLATES } from '../../../../src/data/social-scene-templates';
import { TAVERN_UNIFIED_ENCOUNTER_TEMPLATES } from '../../../../src/data/tavern-encounter-content';
import { SECRET_DISCOVERY_ENCOUNTER_TEMPLATES } from '../../../../src/data/secret-encounter-content';
import { FACTION_ENCOUNTER_TEMPLATES } from '../../../../src/data/faction-encounter-content';

const seed = Number(process.argv[2] ?? 42);
const TICKS = Number(process.argv[3] ?? 40);
const SOCIAL = new Set([...SOCIAL_ENCOUNTER_TEMPLATES, ...SOCIAL_SCENE_TEMPLATES, ...TAVERN_UNIFIED_ENCOUNTER_TEMPLATES, ...SECRET_DISCOVERY_ENCOUNTER_TEMPLATES, ...FACTION_ENCOUNTER_TEMPLATES].map(t => t.id));

resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
const runtime = createSimulationRuntime();
const cosmology = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, seed, cosmology, 'medium') as any;
const firstId = devSeedTheFirst(state);
devSeedAscendantTestPackage(state);
enableTracing();

const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const social = { agentDecisions: 0, withVisibleAgents: 0, withCandidates: 0, candidates: 0, atTavern: 0 };
const socialMentions: Record<string, number> = {}; const categories: Record<string, number> = {};
const firstLog: string[] = [];
const locName = (id: string) => { const n = state.graph.getNode(id); return n ? `${n.name ?? id} [${n.properties?.locationSubtype ?? n.properties?.locationType ?? n.type}]` : id; };
let prev = '';
for (let i = 0; i <= TICKS; i++) {
  if (i > 0) state = runTick(state, [], runtime);
  for (const t of getTraces() as any[]) {
    inc(categories, t.category);
    if (t.category === 'social_encounter_generation') {
      social.agentDecisions++; if (t.visibleAgentCount > 0) social.withVisibleAgents++; if (t.candidateCount > 0) social.withCandidates++;
      social.candidates += t.candidateCount ?? 0; if (t.atTavern) social.atTavern++;
    } else {
      const s = JSON.stringify(t);
      for (const m of s.match(/"[a-z_]+\.[a-z0-9_.]+"/g) ?? []) { const id = m.slice(1, -1); if (SOCIAL.has(id)) inc(socialMentions, `${t.category}:${id}`); }
    }
  }
  clearTraces();
  const loc = state.graph.getOutgoingEdges(firstId, 'located_at')[0]?.target ?? '(none)';
  const n = state.graph.getNode(firstId);
  const ms = n?.properties?.movementState; const act = (state.unifiedActions ?? []).find((a: any) => a.actorId === firstId && !a.resolved);
  const line = `${locName(loc)} | move ${ms ? `${ms.status ?? ms.mode ?? '?'}→${ms.destinationId ?? ms.targetLocationId ?? ms.targetHex ? JSON.stringify(ms.targetHex ?? ms.destinationId ?? ms.targetLocationId) : ''}` : '-'} | action ${act ? act.templateId : '-'}`;
  if (line !== prev) { firstLog.push(`t${state.tick}: ${line}`); prev = line; }
}
console.log(`seed ${seed}, ${TICKS} ticks — The First (${firstId}) state changes:`);
for (const l of firstLog) console.log('  ' + l);
console.log('\nsocial generator:', JSON.stringify(social));
console.log('social-pool template ids named in any other trace:', JSON.stringify(Object.entries(socialMentions).sort((a, b) => b[1] - a[1]).slice(0, 30)));
console.log('trace categories (top 40):', JSON.stringify(Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 40)));
