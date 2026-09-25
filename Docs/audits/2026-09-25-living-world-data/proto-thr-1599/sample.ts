// THR-1599 prototype sample: three most-fired templates × three seed-42 cultures × two sphere
// tints, composed from layer.ts. Also measures (a) how place sphere shares are distributed, so
// the "strong enough to mention" threshold is a measured number, and (b) whether the engine's
// culture prose resolvers ever fire.
//
//   npx esbuild Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample.ts --bundle --platform=node --format=esm --outfile=.cache/thr1599.mjs --external:fs --external:path
//   node .cache/thr1599.mjs 42 > out.md
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import { getNodeSphereAffinity, getDominantSphere } from '../../../../src/engine/sphereAffinity';
import { cultureResolver, agentCultureResolver } from '../../../../src/engine/proseResolvers';
import { getAnyEncounterById } from '../../../../src/data/encounter-content';
import { SPHERE_COLORS } from '../../../../src/data/premonition-constants';
import { CULTURE_CUSTOMS, SPHERE_FACTS, MISSING_SPHERE_VOCABULARY, SPHERE_FACT_MIN_SHARE, pick, fill, type Foundation } from './layer';

const seed = Number(process.argv[2] ?? 42);
resetEventCounter(); resetReputationTraitInit();
const preset = MAP_SIZE_PRESETS.medium;
const { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
const g = state.graph;
const out: string[] = [];
const P = (s = '') => out.push(s);

// ── Cultures and their places ───────────────────────────────────────────────────────────
const cultures = g.getNodesByType('actor').filter(n => n.properties.actorType === 'culture');
const locs = getLocationNodes(g);
const cultureOf = (id: string, layer: 'current' | 'historical' = 'current') => {
  const e = g.getOutgoingEdges(id, 'belongs_to').find(e => (e.properties as any)?.cultureLayer === layer);
  return e ? g.getNode(e.target) : undefined;
};
const living = cultures.filter(c => locs.some(l => cultureOf(l.id)?.id === c.id));

// ── Sphere shares ───────────────────────────────────────────────────────────────────────
const share = (n: any) => {
  const a = getNodeSphereAffinity(n); if (!a) return { dom: null as string | null, share: 0 };
  const tot = Object.values(a.scores).reduce((s, v) => s + (v as number), 0);
  const dom = getDominantSphere(a);
  return { dom, share: dom && tot > 0 ? a.scores[dom] / tot : 0 };
};
const shares = locs.map(l => ({ l, ...share(l) })).filter(x => x.dom);
const sorted = shares.map(s => s.share).sort((a, b) => a - b);
const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))]?.toFixed(2);
const domCount: Record<string, number> = {};
for (const s of shares) domCount[s.dom!] = (domCount[s.dom!] ?? 0) + 1;
const strong = shares.filter(s => s.share >= SPHERE_FACT_MIN_SHARE);

// ── Culture resolver liveness ───────────────────────────────────────────────────────────
let locHits = 0, locTried = 0, agentHits = 0, agentTried = 0;
for (const l of locs) { if (!g.getOutgoingEdges(l.id, 'belongs_to').length) continue; locTried++; if (cultureResolver(l.id, g, seed).length) locHits++; }
const mortals = g.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
for (const m of mortals) { if (!g.getOutgoingEdges(m.id, 'belongs_to').length) continue; agentTried++; if (agentCultureResolver(m.id, g, seed).length) agentHits++; }

P(`# THR-1599 sample — seed ${seed}, medium, t0`);
P();
P('## Measurements');
P();
P(`- Culture nodes: ${cultures.length}; living (hold at least one place-tier Location, \`cultureLayer:'current'\`): ${living.length}.`);
P(`- Place-tier Locations: ${locs.length}; with a sphere affinity: ${shares.length}. Dominant-sphere share quantiles p10/p50/p90/max: ${q(0.1)} / ${q(0.5)} / ${q(0.9)} / ${q(1)}.`);
P(`- Dominant sphere counts: ${Object.entries(domCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
P(`- Places at or above \`SPHERE_FACT_MIN_SHARE\` = ${SPHERE_FACT_MIN_SHARE}: ${strong.length} of ${shares.length} (${(100 * strong.length / Math.max(1, shares.length)).toFixed(0)}%).`);
P(`- Engine \`cultureResolver\`: ${locHits} of ${locTried} culture-bearing Locations produce a layer. \`agentCultureResolver\`: ${agentHits} of ${agentTried} culture-bearing mortals.`);
P();

P('## The cultures');
P();
for (const c of living) {
  const id = c.properties.cultureIdentity as any;
  P(`- **${c.name}** (${id.demonym ?? '—'}): foundation *${id.foundationBias}*, venerates ${id.veneratedSpheres.join(', ')}. "${id.archetypeLabel}". ${id.socialStructure}; ${id.accountability}.`);
}
P();

// ── Compose ─────────────────────────────────────────────────────────────────────────────
const TEMPLATES = ['encounter.confront_the_unknown', 'encounter.master_local_craft', 'encounter.plague_outbreak'];
const SETTLEMENT = new Set(['hamlet', 'town', 'city', 'village']);
const showCultures = living.slice(0, 3);

// Two sphere tints, per template: the strongest-share place whose dominant sphere has a
// SPHERE_FACTS entry, one ordinary sphere and one from the four the vocabulary lacks.
const tintFor = (sphere: string, needSettlement: boolean) =>
  shares.filter(s => s.dom === sphere && (!needSettlement || SETTLEMENT.has(String(s.l.properties.locationSubtype)))).sort((a, b) => b.share - a.share)[0];

for (const tid of TEMPLATES) {
  const t: any = getAnyEncounterById(tid);
  const reach = t.reach as string;
  const opening = t.steps[0].narrativeTemplate as string;
  const needSettlement = (t.locationSubtypes?.length ?? 99) < 10;
  P(`## ${t.name} (\`${tid}\`, reach *${reach}*)`);
  P();
  P(`**As authored:** ${opening}`);
  P();
  P('### Three cultures');
  P();
  for (const [i, c] of showCultures.entries()) {
    const id = c.properties.cultureIdentity as any;
    const place = locs.find(l => cultureOf(l.id)?.id === c.id && (!needSettlement || SETTLEMENT.has(String(l.properties.locationSubtype))));
    const resident = place && mortals.find(m => g.getOutgoingEdges(m.id, 'located_at')[0]?.target === place.id && g.getOutgoingEdges(m.id, 'belongs_to').some(e => e.target === c.id));
    const vars = { actor: resident?.name ?? 'The stranger', demonym: id.demonym ?? c.name, culture: c.name, place: place?.name ?? 'the town' };
    // Variant = this culture's ordinal among the world's living cultures of the same
    // foundation, so two same-foundation cultures never read the same custom (a per-culture
    // stamp at worldgen in the real build; here derived the same way).
    const sameFoundation = living.filter(o => (o.properties.cultureIdentity as any).foundationBias === id.foundationBias).map(o => o.id).sort();
    const custom = pick(CULTURE_CUSTOMS[id.foundationBias as Foundation]?.[reach] ?? ['(no line)'], sameFoundation.indexOf(c.id));
    P(`**${c.name}, at ${vars.place}** (${String(place?.properties.locationSubtype)}; ${vars.actor}):`);
    P();
    P(`> ${fill(opening, vars)} ${fill(custom, vars)}`);
    P();
  }
  P('### Two sphere tints');
  P();
  for (const sphere of ['life', 'matter', 'darkness', 'order']) {
    const hit = tintFor(sphere, needSettlement);
    if (!hit) { P(`- *${sphere}*: no ${needSettlement ? 'settlement' : 'place'} in this world is ${sphere}-dominant.`); continue; }
    const c = cultureOf(hit.l.id); const id = c?.properties.cultureIdentity as any;
    const vars = { actor: 'The stranger', demonym: id?.demonym ?? 'locals', culture: c?.name ?? '', place: hit.l.name };
    const fact = pick(SPHERE_FACTS[sphere]?.[reach] ?? ['(no line)'], seed);
    const on = hit.share >= SPHERE_FACT_MIN_SHARE;
    P(`**${sphere}** — ${hit.l.name} (${String(hit.l.properties.locationSubtype)}, share ${hit.share.toFixed(2)}, ${on ? 'line fires' : 'below threshold, line stays off'}); card tint \`${(SPHERE_COLORS as any)[sphere]}\`:`);
    P();
    P(`> ${fill(opening, vars)}${on ? ' ' + fill(fact, vars) : ''}`);
    P();
  }
}

P('## The four missing sphere vocabularies');
P();
for (const [k, v] of Object.entries(MISSING_SPHERE_VOCABULARY)) {
  P(`- **${k}** — adjectives: ${v.adjectives.join(', ')}. Verbs: ${v.verbs.join(', ')}. Nouns: ${v.nouns.join(', ')}.`);
}
console.log(out.join('\n'));
