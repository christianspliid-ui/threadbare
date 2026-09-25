// Demand census: world occurrence of contexts vs encounter supply, and where firings land.
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { runTick, resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { createSimulationRuntime } from '../../../../src/engine/simulationRuntime';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { UNIFIED_ACTION_TEMPLATES } from '../../../../src/data/unified-action-templates';
import { CONTENT_OBJECT_KINDS } from '../../../../src/data/content-objects';
import { getLocationNodes, getPlaceNodes } from '../../../../src/engine/sublocationShape';
import { settingClassForSubtype } from '../../../../src/data/settingClasses';

const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template')!;
const isEnc = (id: string) => encKind.idPrefixes.some(p => id.startsWith(p));
const tmpl = new Map((UNIFIED_ACTION_TEMPLATES as any[]).map(t => [t.id, t]));
const supplyBySubtype: Record<string, number> = {};
for (const t of UNIFIED_ACTION_TEMPLATES as any[]) if (isEnc(t.id) && t.drawable !== false) for (const s of t.locationSubtypes ?? []) supplyBySubtype[s] = (supplyBySubtype[s] ?? 0) + 1;

const inc = (m: Record<string, number>, k: string, n = 1) => { m[k] = (m[k] ?? 0) + n; };
const seeds = (process.argv[2] ?? '42,99').split(',').map(Number);
const TICKS = Number(process.argv[3] ?? 200);
const result: any = { supplyBySubtype };
for (const seed of seeds) {
  resetEventCounter(); resetReputationTraitInit();
  const runtime = createSimulationRuntime();
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  let { state } = initializeGameState(archetype, 'Demand', createBalancedCosmology(), seed, preset.cols, preset.rows);
  const g = () => (state as any).graph;
  const locs = getLocationNodes(g()); const places = getPlaceNodes(g());
  const locSub: Record<string, number> = {}; for (const n of locs) inc(locSub, String(n.properties.locationSubtype ?? n.properties.locationType ?? '?'));
  const placeSub: Record<string, number> = {}; for (const n of places) inc(placeSub, String(n.properties.locationSubtype ?? n.properties.sublocationType ?? n.properties.typeId ?? '?'));
  const cultures = g().getAllNodes().filter((n: any) => n.properties?.actorType === 'culture' || n.properties?.cultureIdentity);
  const factions = g().getAllNodes().filter((n: any) => n.properties?.actorType === 'faction');
  const facDefs: Record<string, number> = {}; for (const f of factions) inc(facDefs, String(f.properties.factionDefId ?? f.properties.name));
  const seen = new Set<string>();
  const fireSub: Record<string, number> = {}; const fireSetting: Record<string, number> = {}; const fireCulture: Record<string, number> = {}; const fireTier: Record<string, number> = {}; const fireOutcome: Record<string, number> = {};
  const byTemplateOutcome: Record<string, Record<string, number>> = {};
  const locOf = (id: string): any => {
    const n = g().getNode(id); if (!n) return undefined;
    if (n.type === 'location') { const p = n.properties.parentLocationId ? g().getNode(n.properties.parentLocationId) : n; return p ?? n; }
    const e = g().getOutgoingEdges(id, 'located_at')[0]; if (!e) return undefined; return locOf(e.target);
  };
  const cultureOf = (id: string): string => { const e = g().getOutgoingEdges(id, 'belongs_to').find((x: any) => { const t = g().getNode(x.target); return t?.properties?.actorType === 'culture' || t?.properties?.cultureIdentity; }); if (!e) return '(none)'; const c = g().getNode(e.target); return String(c?.properties?.name ?? e.target); };
  const pending: string[] = [];
  const harvest = () => {
    for (const a of (state as any).unifiedActions ?? []) {
      if (!isEnc(a.templateId)) continue;
      if (!seen.has(a.actionId)) {
        seen.add(a.actionId);
        const t = tmpl.get(a.templateId);
        inc(fireTier, String(t?.intrinsicTier));
        const l = locOf(a.targetId)?.type === 'location' ? locOf(a.targetId) : locOf(a.actorId);
        const sub = String(l?.properties?.locationSubtype ?? '(none)');
        inc(fireSub, sub); inc(fireSetting, settingClassForSubtype(sub) ?? `unmapped:${sub}`);
        inc(fireCulture, cultureOf(a.actorId));
        pending.push(a.actionId);
      }
    }
    // record outcomes when resolved
    for (const a of (state as any).unifiedActions ?? []) {
      if (!isEnc(a.templateId) || !a.outcome) continue;
      const k = a.actionId + '|o'; if (seen.has(k)) continue; seen.add(k);
      inc(fireOutcome, a.outcome);
      byTemplateOutcome[a.templateId] ??= {}; inc(byTemplateOutcome[a.templateId], a.outcome);
    }
  };
  harvest();
  for (let i = 0; i < TICKS; i++) { state = runTick(state, [], runtime); harvest(); }
  const agents = g().getNodesByType('actor' as any).filter((n: any) => n.properties?.actorType === 'individual');
  const agentCulture: Record<string, number> = {}; for (const a of agents) inc(agentCulture, cultureOf(a.id));
  result[seed] = { locSub, placeSubTop: Object.fromEntries(Object.entries(placeSub).sort((a, b) => b[1] - a[1]).slice(0, 40)), cultures: cultures.map((c: any) => c.properties.name ?? c.id), facDefs, agentCulture, fireSub, fireSetting, fireCulture, fireTier, fireOutcome, firings: pending.length, byTemplateOutcome };
}
console.log(JSON.stringify(result, null, 1));
