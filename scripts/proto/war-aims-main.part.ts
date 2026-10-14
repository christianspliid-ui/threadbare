// ─── War aims (THR-1868) ─────────────────────────────────────────────────

/** Distance scale for value-weighted targeting: a target this many hexes away is worth half. */
const DIST_HALF_HEXES = 6;
/** Hinterland reach, from the THR-1866 decision (a town works the hexes within 3). */
const HINTERLAND_HEXES = 3;
/** Bonus multipliers on a target's value. */
const MONO_COMPLETE_BONUS = 1.0; // taking it completes a monopoly for the attacker
const MONO_BREAK_BONUS = 0.5; // taking it breaks an enemy's monopoly
const MONO_REGION_HEXES = 8; // regional market radius for monopolies
const STARVE_BONUS = 0.5; // the attacker's own towns lack the staple this target's fields grow
/** Defence: an enemy army marching on one of my holdings (or a sworn/allied one) within this many hexes. */
const DEFEND_RADIUS_HEXES = 8;
const ARMY_TARGET_SUBTYPES = ['hamlet', 'town', 'city', 'capital', 'castle', 'fort'];
const STAPLES = new Set(['grain', 'fish', 'water', 'livestock', 'game']);

const hd = (a: Hex, b: Hex) => hexDistance({ col: a[0], row: a[1] }, { col: b[0], row: b[1] });

interface Target { id: string; holder: string; value: number; parts: { tax: number; yield: number; fields: number }; dist: number; mono: string[]; breaks: string[]; starve: string[]; score: number }

function main() {
  const snaps: Snap[] = process.argv.includes('--cached') && fs.existsSync(CACHE)
    ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : runWorld();
  const lines: string[] = [];
  const p = (x = '') => lines.push(x);
  const nameOf = new Map<string, string>();
  for (const s of snaps) for (const f of s.factions) nameOf.set(f.id, f.name);
  const nm = (id: string) => `${id} (${nameOf.get(id) ?? '?'})`;
  const f2 = (n: number) => n.toFixed(2);
  const pct = (a: number, b: number) => b ? `${Math.round(100 * a / b)}%` : '—';

  p(`THR-1868 war aims — observer sketch, seed ${SEED}, medium, ${snaps[snaps.length - 1].tick} ticks (${snaps.length - 1} days)`);
  p(`Value = purse income the attacker would collect if it held the target (town tax + place yield of the town and its`);
  p(`sublocations + share of unsettled resource fields within ${HINTERLAND_HEXES} hexes). Score = value × (1 + bonuses) / (1 + dist/${DIST_HALF_HEXES}).`);
  p(`Distance is hex distance (today's engine ranks by path hops; hex distance is the proxy here).`);
  p();

  // ── Monopoly census ──
  p('## Monopolies (engine field faction.monopolies, world-wide 60% of bearing places, min 2)');
  const monoTimeline = new Map<string, { from: number; to: number; holder: string }[]>();
  for (const s of snaps) {
    const day = s.tick / TICKS_PER_DAY;
    for (const f of s.factions) for (const r of f.monopolies ?? []) {
      const runs = monoTimeline.get(r) ?? monoTimeline.set(r, []).get(r)!;
      const last = runs[runs.length - 1];
      if (last && last.holder === f.id && last.to === day - 1) last.to = day; else runs.push({ from: day, to: day, holder: f.id });
    }
  }
  const resBearing = new Map<string, number>();
  for (const l of Object.values(snaps[0].locs)) for (const r of Object.keys(l.resources)) resBearing.set(r, (resBearing.get(r) ?? 0) + 1);
  p(`resources: ${resBearing.size}; bearing places per resource: ${[...resBearing].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(', ')}`);
  if (monoTimeline.size === 0) p('no monopoly held on any day');
  for (const [r, runs] of monoTimeline) p(`  ${r}: ${runs.map(x => `${nm(x.holder)} day ${x.from}–${x.to}`).join('; ')}`);
  // Near-monopolies at the end: best share per resource.
  const sEnd = snaps[snaps.length - 1];
  const share = (s: Snap, r: string) => {
    const by = new Map<string, number>(); let tot = 0;
    for (const [id, l] of Object.entries(s.locs)) {
      if (!(r in l.resources)) continue; tot++;
      const c = s.controls.find(x => x.tgt === id)?.src; if (c) by.set(c, (by.get(c) ?? 0) + 1);
    }
    return { tot, by };
  };
  /** Regional market (THR-1868 decision): places bearing r within MONO_REGION_HEXES of a point. */
  const regionalShare = (s: Snap, r: string, at: Hex) => {
    const by = new Map<string, number>(); let tot = 0;
    for (const [id, l] of Object.entries(s.locs)) {
      if (l.parent || !(r in l.resources) || !l.hex || hd(l.hex, at) > MONO_REGION_HEXES) continue; tot++;
      const c = s.controls.find(x => x.tgt === id)?.src; if (c) by.set(c, (by.get(c) ?? 0) + 1);
    }
    return { tot, by };
  };
  p('best share per resource at the end (holder, held/bearing):');
  for (const r of [...resBearing.keys()].sort()) {
    const { tot, by } = share(sEnd, r);
    const best = [...by].sort((a, b) => b[1] - a[1])[0];
    p(`  ${r.padEnd(12)} ${best ? `${nm(best[0])} ${best[1]}/${tot}` : `none held of ${tot}`}`);
  }
  p();

  // ── Armies: today's targets vs value-weighted ──
  p('## Army objectives');
  const seen = new Set<string>();
  const firstTargets: { day: number; army: string; fac: string; hex?: Hex; target?: string; s: Snap }[] = [];
  for (const s of snaps) {
    for (const a of s.armies) {
      if (seen.has(a.id) || !a.target) continue;
      seen.add(a.id);
      firstTargets.push({ day: s.tick / TICKS_PER_DAY, army: a.id, fac: a.faction, hex: a.hex, target: a.target, s });
    }
  }
  const allArmies = new Set(snaps.flatMap(s => s.armies.map(a => a.id)));
  p(`armies seen: ${allArmies.size}; with an objective: ${firstTargets.length}`);

  const relCount = { hostile: 0, rival: 0, ally: 0, none: 0, self: 0, unheld: 0 };
  let nearestIsBest = 0, valueToday = 0, valueBest = 0, distToday = 0, distBest = 0, noLegal = 0, compared = 0;
  let monoCompletes = 0, monoBreaks = 0, starveHits = 0, defendCases = 0;
  const pickRows: string[] = [];
  const todayTargets = new Map<string, number>(), bestTargets = new Map<string, number>();

  for (const ft of firstTargets) {
    const s = ft.s; const w = buildWorld(s);
    const holderOf = (loc: string) => s.controls.find(c => c.tgt === loc)?.src;
    const relOf = (a: string, b: string) => a === b ? 'self' : (w.rel.get(`${a}|${b}`) ?? 'none');
    const h0 = ft.target ? holderOf(ft.target) : undefined;
    const r0 = h0 ? relOf(ft.fac, h0) : 'unheld';
    relCount[r0 as keyof typeof relCount]++;
    if (!ft.hex) continue;

    // My staples: does any town I hold stand at scarce/famine in a staple?
    const myTowns = [...(w.held.get(ft.fac) ?? [])];
    const myShort = new Set<string>();
    for (const t of myTowns) for (const [r, x] of Object.entries(s.locs[t]?.resources ?? {})) if (STAPLES.has(r) && (x.tier === 'scarce' || x.tier === 'famine' || x.tier === 'critical')) myShort.add(r);
    const myMonos = new Set(w.fac.get(ft.fac)?.monopolies ?? []);

    const settlements = Object.entries(s.locs).filter(([, l]) => !l.parent && ARMY_TARGET_SUBTYPES.includes(l.subtype) && l.hex);
    const fields = Object.entries(s.locs).filter(([, l]) => !l.parent && !ARMY_TARGET_SUBTYPES.includes(l.subtype) && l.hex && Object.keys(l.resources).length > 0);
    const legal: Target[] = [];
    for (const [id, l] of settlements) {
      const holder = holderOf(id);
      if (!holder || holder === ft.fac) continue;
      const rel = relOf(ft.fac, holder);
      if (rel !== 'hostile' && rel !== 'rival') continue; // proposal: war only on enemies
      const tax = townTax(l);
      let yld = placeYield(l);
      for (const [sid, sl] of Object.entries(s.locs)) if (sl.parent === id && holderOf(sid) === holder) yld += placeYield(sl);
      let fv = 0; const fieldRes = new Set<string>();
      for (const [, fl] of fields) {
        const d = hd(l.hex!, fl.hex!); if (d > HINTERLAND_HEXES) continue;
        const sharers = settlements.filter(([, o]) => hd(o.hex!, fl.hex!) <= HINTERLAND_HEXES).length || 1;
        fv += placeYield(fl) / sharers;
        for (const r of Object.keys(fl.resources)) fieldRes.add(r);
      }
      const value = tax + yld + fv;
      // Monopoly effects of taking it (world-wide share, as the engine counts).
      const mono: string[] = [], breaks: string[] = [];
      for (const r of Object.keys(l.resources)) {
        const { tot, by } = regionalShare(s, r, l.hex!);
        if (tot < 2) continue; void myMonos;
        const mine = (by.get(ft.fac) ?? 0) + 1;
        if (tot >= 3 && (by.get(ft.fac) ?? 0) / tot < 0.6 && mine / tot >= 0.6) mono.push(r);
        const theirs = by.get(holder) ?? 0;
        if (theirs / tot >= 0.6 && (theirs - 1) / tot < 0.6) breaks.push(r);
      }
      const starve = [...fieldRes, ...Object.keys(l.resources)].filter(r => myShort.has(r));
      const bonus = (mono.length ? MONO_COMPLETE_BONUS : 0) + (breaks.length ? MONO_BREAK_BONUS : 0) + (starve.length ? STARVE_BONUS : 0);
      const dist = hd(ft.hex, l.hex!);
      legal.push({ id, holder, value, parts: { tax, yield: yld, fields: fv }, dist, mono, breaks, starve: [...new Set(starve)], score: value * (1 + bonus) / (1 + dist / DIST_HALF_HEXES) });
    }
    // Defence: an enemy army whose objective is one of my holdings (or an ally's) within DEFEND_RADIUS.
    const threatened = s.armies.filter(a => a.faction !== ft.fac && a.target && a.hex
      && (w.held.get(ft.fac)?.has(top(s, a.target)) || [...(w.held.entries())].some(([f, set]) => relOf(ft.fac, f) === 'ally' && set.has(top(s, a.target!))))
      && hd(a.hex, ft.hex!) <= DEFEND_RADIUS_HEXES);
    if (threatened.length) defendCases++;

    const today = ft.target ? s.locs[ft.target] : undefined;
    todayTargets.set(ft.target ?? '?', (todayTargets.get(ft.target ?? '?') ?? 0) + 1);
    if (!legal.length) { noLegal++; pickRows.push(`  day ${String(ft.day).padStart(2)} ${nm(ft.fac)} → today ${today?.name ?? ft.target} [${r0}] | value pick: none (no enemy settlement)${threatened.length ? ' | DEFEND' : ''}`); continue; }
    compared++;
    legal.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    const best = legal[0];
    bestTargets.set(best.id, (bestTargets.get(best.id) ?? 0) + 1);
    const tLegal = legal.find(t => t.id === ft.target);
    const nearest = [...legal].sort((a, b) => a.dist - b.dist || (a.id < b.id ? -1 : 1))[0];
    if (nearest.id === best.id) nearestIsBest++;
    const todayVal = tLegal?.value ?? (today ? townTax(today) + placeYield(today) : 0);
    valueToday += todayVal; valueBest += best.value;
    distToday += today?.hex ? hd(ft.hex, today.hex) : 0; distBest += best.dist;
    if (best.mono.length) monoCompletes++;
    if (best.breaks.length) monoBreaks++;
    if (best.starve.length) starveHits++;
    pickRows.push(`  day ${String(ft.day).padStart(2)} ${nm(ft.fac)} → today ${today?.name ?? ft.target} [${r0}, v ${f2(todayVal)}, d ${today?.hex ? hd(ft.hex, today.hex) : '?'}] | value pick ${s.locs[best.id].name} of ${nm(best.holder)} [v ${f2(best.value)} = tax ${f2(best.parts.tax)} + yield ${f2(best.parts.yield)} + fields ${f2(best.parts.fields)}, d ${best.dist}${best.mono.length ? `, completes ${best.mono}` : ''}${best.breaks.length ? `, breaks ${best.breaks}` : ''}${best.starve.length ? `, feeds ${best.starve}` : ''}]${threatened.length ? ' | DEFEND' : ''}`);
  }
  p(`today's target held by: hostile ${relCount.hostile}, rival ${relCount.rival}, ally ${relCount.ally}, no relation ${relCount.none}, self ${relCount.self}, unheld ${relCount.unheld}`);
  p(`distinct targets today: ${todayTargets.size} for ${firstTargets.length} armies; top: ${[...todayTargets].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => `${snaps[0].locs[t]?.name ?? t}×${n}`).join(', ')}`);
  p(`value pick: no enemy settlement for ${noLegal} of ${firstTargets.length} armies (they would hold, defend or stand down)`);
  p(`compared ${compared}: value pick = nearest enemy in ${nearestIsBest} (${pct(nearestIsBest, compared)}); distinct value targets ${bestTargets.size}`);
  p(`mean value of target: today ${f2(valueToday / Math.max(1, compared))}/day, value pick ${f2(valueBest / Math.max(1, compared))}/day`);
  p(`mean distance: today ${f2(distToday / Math.max(1, compared))} hexes, value pick ${f2(distBest / Math.max(1, compared))} hexes`);
  p(`value picks that complete a monopoly ${monoCompletes}, break one ${monoBreaks}, feed a staple the attacker lacks ${starveHits}`);
  p(`armies raised while an enemy army marched on their own or an ally's holding within ${DEFEND_RADIUS_HEXES} hexes: ${defendCases}`);
  p();
  p('## Per army (first day an objective is seen)');
  for (const r of pickRows) p(r);
  p();

  // ── Relations census ──
  const last = buildWorld(sEnd);
  const pairs = { hostile: 0, rival: 0, ally: 0 };
  for (const r of sEnd.relations) pairs[r.k]++;
  p(`## Relations at the end: hostile_to ${pairs.hostile}, rival ${pairs.rival}, alliance ${pairs.ally} (directed edges); realms holding land: ${sEnd.factions.filter(f => f.cls === 'realm' && (last.held.get(f.id)?.size ?? 0) > 0).length}`);

  fs.writeFileSync(OUT, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

main();
