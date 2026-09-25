// Throwaway prototype (THR-1591): a worldgen history pass sketched on top of what worldgen ALREADY mints.
// Never merged. Every claim it writes is tagged FACT (derived from a graph fact that exists at t0),
// PASS (a new fact the pass itself would write into the graph), or FLAVOR (prose only, no engine truth).
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../../../../src/engine/gameInit';
import { resetEventCounter } from '../../../../src/engine/orchestrator';
import { createBalancedCosmology } from '../../../../src/engine/cosmology';
import { generateArchetypes } from '../../../../src/engine/ascendant';
import { resetReputationTraitInit } from '../../../../src/engine/phaseReputationTraits';
import { getLocationNodes } from '../../../../src/engine/sublocationShape';
import { locationClassOf } from '../../../../src/data/world-objects';
import { mulberry32 } from '../../../../src/lib/prng';
import { pickCulturalName } from '../../../../src/data/culture-name-pools';

type P = Record<string, any>;
const seed = Number(process.argv[2] ?? 42);
const outMd = process.argv[3] ?? `.cache/past-sample-${seed}.md`;
const t0 = Date.now();
resetEventCounter(); resetReputationTraitInit();
const preset = MAP_SIZE_PRESETS.medium;
const { state } = initializeGameState(generateArchetypes(4, seed)[0], 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
const g = state.graph;
const worldMs = Date.now() - t0;

// ── The pass: its own stream (constraint: mulberry32(seed + prime)) ──
const HISTORY_PRNG_OFFSET = 7919; // a prime; the real pass picks one unused by other worldgen passes
const t1 = Date.now();
const rng = mulberry32(seed + HISTORY_PRNG_OFFSET);
const pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)];
const hexDist = (a: P, b: P) => { // offset coords → cube (odd-q); approximate is fine for a sketch
  const toCube = (c: number, r: number) => { const x = c; const z = r - (c - (c & 1)) / 2; return [x, -x - z, z]; };
  const [ax, ay, az] = toCube(a.hexCol, a.hexRow); const [bx, by, bz] = toCube(b.hexCol, b.hexRow);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
};
const nameOf = (n: any) => n?.name ?? (n?.properties as P)?.name ?? n?.id;
const claims: { tag: 'FACT' | 'PASS' | 'FLAVOR'; text: string; source: string }[] = [];
const claim = (tag: 'FACT' | 'PASS' | 'FLAVOR', text: string, source: string) => { claims.push({ tag, text, source }); return text; };

const cultures = g.getNodesByType('actor').filter(n => (n.properties as P).actorType === 'culture');
const hist = cultures.filter(n => (n.properties as P).cultureEra === 'historical');
const living = cultures.filter(n => (n.properties as P).cultureEra !== 'historical');
const locs = getLocationNodes(g).map(n => ({ n, p: n.properties as P, cls: locationClassOf((n.properties as P).locationSubtype) }));
const elder = locs.filter(l => l.p.locationSubtype === 'elder_ruin');
const plainRuins = locs.filter(l => l.cls === 'ruin' && l.p.locationSubtype !== 'elder_ruin');
const settlements = locs.filter(l => l.cls === 'settlement');
const wonders = locs.filter(l => l.p.isWonderLocation || l.cls === 'wonder');
const realms = g.getNodesByType('actor').filter(n => (n.properties as P).factionType === 'realm' || /^faction_\d+$/.test(n.id));
const cultureOfLoc = (id: string) => g.getOutgoingEdges(id, 'belongs_to').map(e => e.target).find(t => living.some(c => c.id === t));
const holderOf = (id: string) => g.getIncomingEdges(id, 'controls').map(e => g.getNode(e.source)).find(Boolean);

// Era I — the dead empires. Everything here is already true in the graph.
const md: string[] = [];
const eraI: string[] = [];
const histStats = hist.map(h => {
  const mine = elder.filter(l => l.p.originCultureId === h.id);
  const by = (a: string) => mine.filter(l => l.p.archetype === a).length;
  return { h, p: h.properties as P, mine, battle: by('battlefield'), temple: by('temple'), vault: by('vault') };
}).sort((a, b) => b.mine.length - a.mine.length);
for (const s of histStats) {
  eraI.push(claim('FACT', `**${nameOf(s.h)}** (${s.p.templateName}) — ${s.mine.length} ruins: ${s.temple} temples, ${s.vault} vaults, ${s.battle} battlefields.`, `hist culture ${s.h.id}; elder_ruin.originCultureId + archetype`));
}
// The fall: tally which empire's battlefields lie nearest another empire's ruins.
const pairTally = new Map<string, number>();
for (const b of elder.filter(l => l.p.archetype === 'battlefield')) {
  const other = elder.filter(l => l.p.originCultureId !== b.p.originCultureId).sort((x, y) => hexDist(b.p, x.p) - hexDist(b.p, y.p))[0];
  if (!other) continue;
  const key = [b.p.originCultureId, other.p.originCultureId].sort().join('|');
  pairTally.set(key, (pairTally.get(key) ?? 0) + 1);
}
const wars = [...pairTally.entries()].sort((a, b) => b[1] - a[1]);
const histName = (id: string) => nameOf(hist.find(h => h.id === id));
const histTemplate = (id: string) => (hist.find(h => h.id === id)?.properties as P)?.templateName;
const elderWar = wars[0];
if (elderWar) {
  const [a, b] = elderWar[0].split('|');
  eraI.push(claim('PASS', `**The Breaking.** ${histTemplate(a)} and ${histTemplate(b)} fought until neither stood. ${elderWar[1]} battlefields remember it.`, `event node history.war (era I), involves ${a},${b}; occurred_at the ${elderWar[1]} battlefield ruins on the contested border`));
}
for (const s of histStats) eraI.push(claim('FLAVOR', `*${s.p.legacyFlavor}*`, `historical-culture template ${s.p.templateId}.legacyFlavor`));

// Era II — the settling. Founding order: capital → city → town → hamlet → camp; years ago drawn from the stream.
const TIER_ORDER = ['capital', 'city', 'town', 'farmland', 'hamlet', 'camp'];
const FOUNDING_YEARS: Record<string, [number, number]> = { capital: [380, 460], city: [240, 380], town: [140, 260], farmland: [60, 160], hamlet: [30, 140], camp: [1, 20] };
const founded = settlements.map(l => {
  const [lo, hi] = FOUNDING_YEARS[l.p.locationSubtype] ?? [20, 100];
  const years = Math.round(lo + rng() * (hi - lo));
  const nearestElder = elder.slice().sort((x, y) => hexDist(l.p, x.p) - hexDist(l.p, y.p))[0];
  return { ...l, years, onLandOf: nearestElder && hexDist(l.p, nearestElder.p) <= 3 ? nearestElder : undefined, culture: cultureOfLoc(l.n.id) };
}).sort((a, b) => b.years - a.years);
const used = new Set<string>();
const founderName = (cultureId?: string) => {
  const c = living.find(x => x.id === cultureId) ?? pick(living);
  const id = (c.properties as P).cultureIdentity as P | undefined;
  return pickCulturalName(id?.foundationBias ?? 'order', id?.veneratedSpheres?.[0] ?? 'matter', rng, used);
};
const deadNotables: { name: string; role: string; where: string; tag: 'PASS' }[] = [];
const eraII: string[] = [];
for (const c of living) {
  const capital = founded.find(f => f.culture === c.id && f.p.locationSubtype === 'capital') ?? founded.find(f => f.culture === c.id);
  if (!capital) { eraII.push(claim('FACT', `**${nameOf(c)}** hold no settlement of their own on the map — only scattered folk.`, `no settlement belongs_to ${c.id}`)); continue; }
  const founder = founderName(c.id);
  deadNotables.push({ name: founder, role: `founder of ${nameOf(capital.n)}`, where: `grave at ${nameOf(capital.n)}`, tag: 'PASS' });
  const land = capital.onLandOf ? `, on stones ${histTemplate(capital.onLandOf.p.originCultureId)} left behind` : '';
  eraII.push(claim('PASS', `**${capital.years} years ago** ${founder} raised **${nameOf(capital.n)}** for ${nameOf(c)}${land}.`, `location.foundedYearsAgo=${capital.years}; dead notable (founder) on the capital; nearest elder ruin ≤3 hexes = ${capital.onLandOf?.n.id ?? 'none'}`));
}
const unaligned = founded.filter(f => !f.culture);
eraII.push(claim('FACT', `${founded.length - unaligned.length} of ${founded.length} settlements belong to a living culture; ${unaligned.length} belong to none (freeholds, camps, crossroads towns).`, 'settlement belongs_to culture edges at t0'));
const onOld = founded.filter(f => f.onLandOf);
eraII.push(claim('FACT', `${onOld.length} of ${founded.length} settlements stand within three hexes of an elder ruin.`, 'hex distance settlement → nearest elder_ruin'));

// Era III — living memory: 2–3 wars between the realms, each with a fallen place (a plain ruin) and a fallen commander.
const eraIII: string[] = [];
const realmCap = realms.map(r => ({ r, cap: founded.find(f => holderOf(f.n.id)?.id === r.id && f.p.locationSubtype === 'capital') ?? founded.find(f => holderOf(f.n.id)?.id === r.id) })).filter(x => x.cap);
const pairs: [typeof realmCap[0], typeof realmCap[0], number][] = [];
for (let i = 0; i < realmCap.length; i++) for (let j = i + 1; j < realmCap.length; j++) pairs.push([realmCap[i], realmCap[j], hexDist(realmCap[i].cap!.p, realmCap[j].cap!.p)]);
pairs.sort((a, b) => a[2] - b[2]);
const WAR_COUNT = Math.min(pairs.length, 2 + (rng() < 0.5 ? 1 : 0));
const usedRuins = new Set<string>();
const quarrelSeeds: string[] = [];
for (const [a, b] of pairs.slice(0, WAR_COUNT)) {
  const years = Math.round(12 + rng() * 70);
  const mid = { hexCol: (a.cap!.p.hexCol + b.cap!.p.hexCol) / 2 | 0, hexRow: (a.cap!.p.hexRow + b.cap!.p.hexRow) / 2 | 0 };
  const fallen = plainRuins.filter(r => !usedRuins.has(r.n.id)).sort((x, y) => hexDist(mid, x.p) - hexDist(mid, y.p))[0];
  if (fallen) usedRuins.add(fallen.n.id);
  const commander = founderName((a.r.properties as P).cultureId);
  deadNotables.push({ name: commander, role: `fell leading ${nameOf(a.r)} against ${nameOf(b.r)}`, where: fallen ? `grave at ${nameOf(fallen.n)}` : 'no grave', tag: 'PASS' });
  eraIII.push(claim('PASS', `**${years} years ago** ${nameOf(a.r)} and ${nameOf(b.r)} went to war.${fallen ? ` **${nameOf(fallen.n)}** burned and was never rebuilt.` : ''} ${commander} died there.`, `event history.war, involves ${a.r.id},${b.r.id}; occurred_at ${fallen?.n.id ?? '—'}; ruin.fellInEventId; dead notable`));
  quarrelSeeds.push(`${nameOf(a.r)} ↔ ${nameOf(b.r)}: an old war gives \`old_quarrel\` (THR-1593's notable package) a reason, and \`seek_revenge\` a dead commander to avenge`);
}
// Wonder legends — one each.
const LEGEND: Record<string, string> = {
  master_forge: 'an anvil that rings with no hammer on it', sacrifice_site: 'ground where the old rites were paid in blood',
  crystal_cavern: 'a cave that sings when the wind turns', golden_grove: 'a grove whose leaves never fall',
};
const wonderLines: string[] = [];
for (const w of wonders) {
  const who = holderOf(w.n.id);
  const hero = rng() < 0.4 ? founderName(cultureOfLoc(w.n.id)) : null;
  if (hero) deadNotables.push({ name: hero, role: `first to find ${nameOf(w.n)}`, where: `legend at ${nameOf(w.n)}`, tag: 'PASS' });
  wonderLines.push(claim(hero ? 'PASS' : 'FLAVOR', `**${nameOf(w.n)}** — ${LEGEND[w.p.locationSubtype] ?? 'a wonder no one has explained'}.${hero ? ` ${hero} found it and did not come back the same.` : ''}${who ? ` ${nameOf(who)} keeps it now.` : ' No one keeps it.'}`, `wonder ${w.n.id} (${w.p.locationSubtype})${who ? `; controls ← ${who.id}` : ''}${hero ? '; dead notable (legend) — the only PASS part' : ''}`));
}
const passMs = Date.now() - t1;

// ── Place-sheet lines (two samples) ──
const capital = founded.find(f => f.p.locationSubtype === 'capital' && f.culture);
const ruin = elder.find(e => e.p.archetype === 'battlefield' && elderWar && elderWar[0].includes(e.p.originCultureId)) ?? elder[0];
const sheet: string[] = [];
if (capital) sheet.push(`**${nameOf(capital.n)}** · Founded ${capital.years} years ago by ${deadNotables.find(d => d.role === `founder of ${nameOf(capital.n)}`)?.name ?? 'its first lord'}.${capital.onLandOf ? ` Built on ${histTemplate(capital.onLandOf.p.originCultureId)} stone.` : ''}`);
if (ruin) sheet.push(`**${nameOf(ruin.n)}** · ${histTemplate(ruin.p.originCultureId)} ${ruin.p.archetype}. ${elderWar ? 'Fell in the Breaking.' : 'Fell long ago.'} Never delved.`);

// ── Write ──
const c = { FACT: 0, PASS: 0, FLAVOR: 0 } as Record<string, number>; for (const x of claims) c[x.tag]++;
md.push(`# Sample history — seed ${seed}, medium (THR-1591 prototype, throwaway)`, '');
md.push(`World built in ${worldMs} ms; the history pass sketch ran in **${passMs} ms** (worldgen-time only, nothing read per tick).`, '');
md.push(`Claims: **${c.FACT} FACT** (already true in the t0 graph) · **${c.PASS} PASS** (new facts the pass would write) · **${c.FLAVOR} FLAVOR** (prose only).`, '');
md.push('## The chronicle page — "Before you woke"', '');
md.push('### The Elder Age', ...eraI.map(x => `- ${x}`), '');
md.push('### The Settling', ...eraII.map(x => `- ${x}`), '');
md.push('### Living memory', ...eraIII.map(x => `- ${x}`), '');
md.push('### Wonders', ...wonderLines.map(x => `- ${x}`), '');
md.push('## Two place-sheet lines', '', ...sheet.map(x => `> ${x}`), '');
md.push(`## The dead (${deadNotables.length})`, '', '| Name | Who they were | Where they rest |', '|---|---|---|', ...deadNotables.map(d => `| ${d.name} | ${d.role} | ${d.where} |`), '');
md.push('## What the past feeds', '', ...quarrelSeeds.map(q => `- ${q}`), `- \`reclaim_homeland\`: ${onOld.length} settlements stand on elder land — a descendant claim needs only a \`descends_from\`-style fact on a mortal`, `- \`chase_the_wonder\`: ${wonders.length} wonders, ${deadNotables.filter(d => d.role.startsWith('first to find')).length} with a legend a mortal can chase`, '');
md.push('## Every claim with its source', '', '| Tag | Claim | Source |', '|---|---|---|', ...claims.map(x => `| ${x.tag} | ${x.text.replace(/\|/g, '/').replace(/\n/g, ' ')} | ${x.source.replace(/\|/g, '/')} |`), '');
md.push('## Counts behind it', '', `- Historical cultures: ${hist.length} · living cultures: ${living.length} · realms: ${realmCap.length}`, `- Elder ruins: ${elder.length} (${histStats.map(s => `${s.p.templateName} ${s.mine.length}`).join(', ')}) · plain ruins: ${plainRuins.length} · settlements: ${settlements.length} · wonders: ${wonders.length}`, `- Elder battlefield pair tally: ${wars.map(([k, v]) => `${k.split('|').map(histTemplate).join(' × ')} ${v}`).join('; ')}`);
writeFileSync(outMd, md.join('\n'));
console.log(md.join('\n'));
