// THR-2081 census b (design lane, never merged): how far does a PLAYING god push its own Mandate when only the
// growth its own writers cause counts? A greedy scripted god spends every point of essence it can on the cheapest
// ascendant template of the Mandate's primary / secondary sphere, through the real player-cast path. The god ledger
// is read off sphere_pressure traces: a level-up credits the god by the share of its writers on that trace; an
// erosion debits it by the share of rival/doom writers. Usage: node .cache/s2081b.mjs <ticks> <seeded|cli42|cli99|cli7> <god|idle>
import { initializeGameStateFromIdentity, devSeedTheFirst, DEV_ASCENDANT_IDENTITY, initializeGameState } from '../src/engine/gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../src/engine/orchestrator';
import { unattended } from '../src/engine/playerStepHold';
import { deriveCosmologyFromIdentity } from '../src/engine/remembrance';
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../src/engine/phaseReputationTraits';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { ENTITY_AGGREGATE_WEIGHT } from '../src/engine/phaseSphereAggregation';
import { enableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { preparePlayerCast, commitPlayerCast } from '../src/engine/playerCastDispatch';
import { getPlaceNodes, resolveToParentLocation } from '../src/engine/sublocationShape';
import { DOMINION_CLAIM_TEMPLATE_ID } from '../src/data/dominion-content';

const ticks = Number(process.argv[2] ?? '600');
const only = process.argv[3];
const mode = process.argv[4] ?? 'god';
const GOD = new Set(['control_effect', 'claim', 'seat', 'carry', 'attunement', 'prayer_answered', 'unbidden_aid', 'overchannel']);
const OPPOSITION = new Set(['rival', 'doom']);

function weightOf(node: any): number {
  if (!node) return 0;
  if (node.type === 'location') return ENTITY_AGGREGATE_WEIGHT.location;
  if (node.type === 'artifact') return ENTITY_AGGREGATE_WEIGHT.artifact;
  const t = node.properties?.actorType;
  if (t === 'individual' || t === 'ascendant' || t === 'god') return ENTITY_AGGREGATE_WEIGHT.agent;
  if (t === 'faction') return ENTITY_AGGREGATE_WEIGHT.faction;
  if (t === 'culture') return ENTITY_AGGREGATE_WEIGHT.culture;
  return 0;
}

function cheapest(sphere: string, cats: string[]): any | undefined {
  return (UNIFIED_ACTION_TEMPLATES as any[])
    .filter(t => t.sphereAffinity === sphere && (t.essenceCost ?? 0) > 0 && JSON.stringify(t.actorAffinities ?? '').includes('ascendant'))
    .filter(t => (t.targetCategories ?? ['actor']).some((c: string) => cats.includes(c)))
    .sort((a, b) => a.essenceCost - b.essenceCost)[0];
}

function run(label: string, mk: () => any) {
  resetEventCounter(); resetReputationTraitInit(); resetDecisionCache();
  enableTracing();
  const rt = createSimulationRuntime(); let state = mk();
  for (let i = 0; i < 2; i++) state = unattended(runTick(state, [], rt));
  const d = state.mandateDefinition; const P = d.primarySphere; const S = d.secondarySphere;
  // Neutralise the world-total rule so the age does not end on drift; the god ledger is measured instead.
  state = { ...state, mandateDefinition: { ...d, primaryTargetDelta: 99, secondaryTargetDelta: 99, checkpoints: [] } };
  const held = new Map<string, number>(); // entity|sphere -> god-credited points still standing
  const heldLedger: Record<string, number> = { [P]: 0, [S]: 0 };
  const placeOnly = mode.startsWith('godloc');
  const cats0 = placeOnly ? ['location', 'sublocation'] : ['actor', 'location'];
  const tpl: Record<string, any> = { [P]: cheapest(P, cats0) ?? cheapest(P, ['actor']), [S]: cheapest(S, cats0) ?? cheapest(S, ['actor']) };
  const myCasts = new Set<string>();
  let casts = 0, spent = 0;
  const ledger: Record<string, number> = { [P]: 0, [S]: 0 };
  const thrEnc: Record<string, number> = { [P]: 0, [S]: 0 };
  const claimTpl = (UNIFIED_ACTION_TEMPLATES as any[]).find(t => t.id === DOMINION_CLAIM_TEMPLATE_ID);
  let claims = 0;
  let baseP = 0, baseS = 0;
  console.log(`\n## ${label} mode=${mode} mandate="${d.name}" P=${P} (${tpl[P]?.id} @${tpl[P]?.essenceCost}) S=${S} (${tpl[S]?.id} @${tpl[S]?.essenceCost}) targets=${d.primaryTargetDelta}/${d.secondaryTargetDelta}`);
  const checkpoints = new Set([50, 100, 150, 200, 300, 450, 600, 750, 900]);
  for (let i = 2; i < ticks; i++) {
    if ((mode === 'godclaim' || mode === 'godlocclaim') && claimTpl && (state.essencePool[P] ?? 0) >= claimTpl.essenceCost + 2 && state.tick % 5 === 0) {
      const places = getPlaceNodes(state.graph);
      const target = places[(state.tick * 104729 + claims) % places.length];
      const cast = preparePlayerCast({ graph: state.graph, ascendantId: state.ascendantId, template: claimTpl, templateId: claimTpl.id, targetId: target.id, tick: state.tick, seed: 4051 + claims, sphere: P as any, runtime: rt });
      state = commitPlayerCast(state, { cast }); claims++; spent += cast.essenceCost;
    }
    if (mode !== 'idle' && !(mode.endsWith('half') && state.tick % 2 === 1)) {
      for (const sp of [P, S]) {
        const t = tpl[sp]; if (!t) continue;
        if ((state.essencePool[sp] ?? 0) < t.essenceCost) continue;
        const cats: string[] = t.targetCategories ?? ['actor'];
        const pool = cats.includes('location')
          ? getPlaceNodes(state.graph)
          : cats.includes('sublocation')
          ? state.graph.getNodesByType('location').filter((n: any) => typeof n.properties?.parentLocationId === 'string')
          : state.graph.getNodesByType('actor').filter((n: any) => n.properties?.actorType === 'individual' && n.properties?.alive !== false);
        if (pool.length === 0) continue;
        const target = pool[(state.tick * 7919 + casts) % pool.length];
        const cast = preparePlayerCast({ graph: state.graph, ascendantId: state.ascendantId, template: t, templateId: t.id, targetId: target.id, tick: state.tick, seed: 2081 + casts * 13, sphere: sp as any, runtime: rt });
        state = commitPlayerCast(state, { cast });
        myCasts.add(cast.action.actionId); casts++; spent += cast.essenceCost;
      }
    }
    const thrPlaces = new Set<string>();
    for (const e of state.graph.getOutgoingEdges(state.ascendantId, 'thread')) {
      const loc = state.graph.getOutgoingEdges(e.target, 'located_at')[0]?.target;
      if (loc) { thrPlaces.add(loc); const par = resolveToParentLocation(state.graph, loc); if (par) thrPlaces.add(typeof par === 'string' ? par : (par as any).id); }
    }
    clearTraces();
    state = mode !== 'idle' ? runTick(state, [], rt) : unattended(runTick(state, [], rt));
    if (i === 2) { baseP = state.mandateDefinition.primaryBaseline ?? 0; baseS = state.mandateDefinition.secondaryBaseline ?? 0; }
    for (const t of getTraces() as any[]) {
      if (t.category !== 'sphere_pressure' || (t.sphere !== P && t.sphere !== S)) continue;
      const dScore = (t.newScore ?? 0) - (t.previousScore ?? 0); if (dScore === 0) continue;
      const w = weightOf(state.graph.getNode(t.entityId));
      const srcs: string[] = t.sources ?? [t.source]; const ids: string[] = t.sourceIds ?? [];
      const isGod = (k: number) => GOD.has(srcs[k]) || (srcs[k] === 'divine_action' && myCasts.has(ids[k]));
      if (dScore > 0 && thrPlaces.has(t.entityId)) { const e = srcs.filter(x => x === 'encounter').length; thrEnc[t.sphere] += dScore * w * e / srcs.length; }
      const hk = `${t.entityId}|${t.sphere}`;
      if (dScore > 0) { const g = srcs.filter((_, k) => isGod(k)).length; const c = dScore * w * g / srcs.length; ledger[t.sphere] += c; heldLedger[t.sphere] += c; if (c > 0) held.set(hk, (held.get(hk) ?? 0) + c); }
      else { const o = srcs.filter(s => OPPOSITION.has(s)).length; ledger[t.sphere] += dScore * w * o / srcs.length;
        const h = held.get(hk) ?? 0; if (h > 0 && o > 0) { const take = Math.min(h, -dScore * w); held.set(hk, h - take); heldLedger[t.sphere] -= take; } }
    }
    if (checkpoints.has(state.tick) || state.phase !== 'playing') {
      const gp = ledger[P] / Math.max(1, baseP), gs = ledger[S] / Math.max(1, baseS);
      const godProgress = Math.min(1, ((Math.min(1, Math.max(0, gp / d.primaryTargetDelta))) + Math.min(1, Math.max(0, gs / d.secondaryTargetDelta))) / 2);
      console.log(`${label} t${state.tick} worldProgress=${(state.mandateState?.progress ?? 0).toFixed(3)} godP=${gp.toFixed(3)} godS=${gs.toFixed(3)} godProgress=${godProgress.toFixed(3)} doom=${(state.doomClock.progress ?? 0).toFixed(3)} casts=${casts} claims=${claims} spent=${spent} baseP=${baseP.toFixed(1)} baseS=${baseS.toFixed(1)} godPtsP=${ledger[P].toFixed(2)} godPtsS=${ledger[S].toFixed(2)} thrEncP=${(thrEnc[P]/Math.max(1,baseP)).toFixed(3)} thrEncS=${(thrEnc[S]/Math.max(1,baseS)).toFixed(3)} heldPtsP=${heldLedger[P].toFixed(2)} heldPtsS=${heldLedger[S].toFixed(2)}`);
    }
    if (state.phase !== 'playing') { console.log(`${label} LEFT PLAYING t${state.tick}`); break; }
  }
}

const c = deriveCosmologyFromIdentity({ sphereAlignment: DEV_ASCENDANT_IDENTITY.sphereAlignment, mortalTags: DEV_ASCENDANT_IDENTITY.mortalTags, hungerId: DEV_ASCENDANT_IDENTITY.hungerId });
if (!only || only === 'seeded') run('seeded42', () => { const s = initializeGameStateFromIdentity(DEV_ASCENDANT_IDENTITY, 42, c, 'medium', 'breach').state; devSeedTheFirst(s); return s; });
for (const seed of [42, 99, 7]) if (!only || only === `cli${seed}`) run(`cli${seed}`, () => { const cc = createBalancedCosmology(); return initializeGameState(generateArchetypes(4, seed)[0], 'T', cc, seed, 32, 24).state; });
if (only === 'kindle') {
  const K: any = { ...DEV_ASCENDANT_IDENTITY, hungerId: 'hunger.kindle', hungerName: 'Kindle', sphereAlignment: { primary: 'energy', secondary: 'life' }, spherePoints: { energy: 3, life: 2 } };
  const ck = deriveCosmologyFromIdentity({ sphereAlignment: K.sphereAlignment, mortalTags: K.mortalTags, hungerId: K.hungerId });
  run('kindle42', () => { const s = initializeGameStateFromIdentity(K, 42, ck, 'medium', 'breach').state; devSeedTheFirst(s); return s; });
}
