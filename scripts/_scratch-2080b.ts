import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { getNodeSphereAffinity, isValidSphereAffinity } from '../src/engine/sphereAffinity';
resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
const runtime = createSimulationRuntime();
const c = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
let { state } = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, c, 'medium', 'breach');
devSeedTheFirst(state);
const snap = () => { const m = new Map<string, number>(); const mind = new Map<string, number>();
  for (const t of ['location','actor','artifact']) for (const n of state.graph.getNodesByType(t as any)) { const r: any = getNodeSphereAffinity(n); if (!isValidSphereAffinity(r)) continue; const k = t + ':' + (n.properties?.actorType ?? n.properties?.locationType ?? ''); m.set(k, (m.get(k) ?? 0) + 1); mind.set(k, (mind.get(k) ?? 0) + (r.scores.mind ?? 0)); }
  return { m, mind }; };
const locN = () => state.graph.getNodesByType("location" as any).length; console.log(`t0 locations=${locN()}`); const bagless = state.graph.getNodesByType("location" as any).filter((n: any) => !isValidSphereAffinity(getNodeSphereAffinity(n))); console.log(`t0 bagless=${bagless.length} sample=${bagless.slice(0,5).map((n: any) => n.id + "|" + (n.properties?.locationType ?? "") + "|parent=" + (n.properties?.parentLocationId ?? "")).join(", ")}`);
let prev = snap();
for (let i = 0; i < 3; i++) { state = unattended(runTick(state, [], runtime)); const cur = snap();
  for (const k of new Set([...prev.m.keys(), ...cur.m.keys()])) { const dc = (cur.m.get(k) ?? 0) - (prev.m.get(k) ?? 0); const dm = (cur.mind.get(k) ?? 0) - (prev.mind.get(k) ?? 0); if (dc || Math.abs(dm) > 0.5) console.log(`t${state.tick} ${k} count ${dc >= 0 ? '+' : ''}${dc} rawMind ${dm >= 0 ? '+' : ''}${dm.toFixed(1)}`); }
  prev = cur; console.log(`t${state.tick} locations=${locN()}`); }
// second pass: which ids appear on tick 1
resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
{ const rt = createSimulationRuntime(); let s = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, c, 'medium', 'breach').state; devSeedTheFirst(s);
  const before = new Set(s.graph.getNodesByType('location' as any).map((n: any) => n.id));
  s = unattended(runTick(s, [], rt));
  const fresh = s.graph.getNodesByType('location' as any).filter((n: any) => !before.has(n.id));
  const pat = new Map<string, number>(); for (const n of fresh as any[]) { const k = n.id.replace(/[0-9a-f]{6,}|\d+/g, '#') + ' | sub=' + (n.properties?.subtype ?? n.properties?.locationType ?? n.properties?.kind ?? '?') + ' | parent=' + (n.properties?.parentLocationId ? 'y' : 'n'); pat.set(k, (pat.get(k) ?? 0) + 1); }
  for (const [k, v] of pat) console.log(`NEW ${v} × ${k}`); }
