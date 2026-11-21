// Offline replay of the race forecast (raceForecast.ts) over census snapshots taken once a day.
// Usage: node race-replay.mjs <dir-with-agency-*.json>
// Re-implements sample → project → settle with pluggable Mandate projections, and reports per arm:
// state shown at Doom 0.80, who ended the age, turn count. V0 must match the census's own raceState.
import fs from 'fs';
import path from 'path';

const DAY = 12, WIN = 15, MIN = 5, SHOW = 0.2, CLOSE = 0.15, EPS = 0.0001, CLIMAX = 0.8; let HOLD = Number(process.env.HOLD_DAYS ?? 2) * DAY;
const ENDING = { hidden: 'none', mandate_first: 'mandate', doom_first: 'doom', stalled: 'doom', close: 'close' };

// Each model returns the projected Mandate end tick, or null (no rise → doom_first/stalled), given the window.
const models = {
  V0_line: (s, now) => linear(s, now, 0, s.length - 1),
  // the slower of the whole-window pace and the pace over the last K samples
  V1_min_recent5: (s, now) => slower(s, now, 5),
  V1_min_recent7: (s, now) => slower(s, now, 7),
  // geometric decay: compare rise in the newer half vs the older half; project an asymptote
  V2_decay: (s, now) => decay(s, now),
  // each sphere projected on its own share; the Mandate fills when the slower sphere does
  V3_per_sphere: (s, now) => perSphere(s, now),
  V4_sphere_slower5: (s, now) => perSphereWith(s, now, (k) => sphereSlower(s, now, k, 5)),
  V5_sphere_decay: (s, now) => perSphereWith(s, now, (k) => sphereDecay(s, now, k)),
  V6_sphere_recent_half: (s, now) => perSphereWith(s, now, (k) => lin(s, now, k, Math.floor((s.length - 1) / 2), s.length - 1)),
  V7_sphere_decay_lt05: (s, now) => perSphereWith(s, now, (k) => sphereDecay(s, now, k, 0.5)),
  V8_sphere_decay_lt033: (s, now) => perSphereWith(s, now, (k) => sphereDecay(s, now, k, 0.34)),
};

function sphereEnd(s, now, key) {
  const r = Math.min(1, now[key]);
  if (r >= 1) return now.tick;
  const a = s[0], b = s[s.length - 1], span = b.tick - a.tick;
  const rise = Math.min(1, b[key]) - Math.min(1, a[key]);
  if (!(span > 0) || !(rise > EPS)) return null;
  return now.tick + (1 - r) / (rise / span);
}
function perSphere(s, now) {
  const p = sphereEnd(s, now, 'rP'), q = sphereEnd(s, now, 'rS');
  if (p === null || q === null) return null;
  return Math.max(p, q);
}

function perSphereWith(s, now, f) { const p = f('rP'), q = f('rS'); if (p === null || q === null) return null; return Math.max(p, q); }
function lin(s, now, key, i, j) { const r = Math.min(1, now[key]); if (r >= 1) return now.tick; const a = s[i], b = s[j], span = b.tick - a.tick; const rise = Math.min(1, b[key]) - Math.min(1, a[key]); if (!(span > 0) || !(rise > EPS)) return null; return now.tick + (1 - r) / (rise / span); }
function sphereSlower(s, now, key, k) { const full = lin(s, now, key, 0, s.length - 1); if (full === null) return null; if (s.length < k + 1) return full; const rec = lin(s, now, key, s.length - 1 - k, s.length - 1); if (rec === null) return null; return Math.max(full, rec); }
function sphereDecay(s, now, key, maxR = 1) { const r0 = Math.min(1, now[key]); if (r0 >= 1) return now.tick; const full = lin(s, now, key, 0, s.length - 1); if (full === null) return null; const mid = Math.floor((s.length - 1) / 2); const c = (x) => Math.min(1, x[key]); const r1 = c(s[mid]) - c(s[0]), r2 = c(s[s.length - 1]) - c(s[mid]); if (!(r1 > EPS) || r2 >= maxR * r1) return full; const r = r2 / r1; if (r0 + (r2 * r) / (1 - r) < 1) return null; let left = 1 - r0, add = r2, n = 0; const hs = s[s.length - 1].tick - s[mid].tick; while (left > 0 && n < 200) { add *= r; left -= add; n++; } return now.tick + n * hs; }
// Fit progress = (kP*ledgerP + kS*ledgerS)/2 on snaps below 0.5 (both spheres unclamped there).
function fitScales(snaps) {
  let a = 0, b = 0, c = 0, d = 0, e = 0;
  for (const s of snaps) {
    if (!(s.mandateProgress > 0.02 && s.mandateProgress < 0.48)) continue;
    const x = s.ledgerP / 2, y = s.ledgerS / 2, z = s.mandateProgress;
    a += x * x; b += x * y; c += y * y; d += x * z; e += y * z;
  }
  const det = a * c - b * b;
  if (!(Math.abs(det) > 1e-12)) return null;
  return { kP: (d * c - b * e) / det, kS: (a * e - b * d) / det };
}

function linear(s, now, i, j) {
  const a = s[i], b = s[j];
  const span = b.tick - a.tick, rise = b.mandate - a.mandate;
  if (!(span > 0) || !(rise > EPS)) return null;
  return now.tick + Math.max(0, 1 - now.mandate) / (rise / span);
}
function slower(s, now, k) {
  const full = linear(s, now, 0, s.length - 1);
  if (full === null) return null;
  if (s.length < k + 1) return full;
  const recent = linear(s, now, s.length - 1 - k, s.length - 1);
  if (recent === null) return null;
  return Math.max(full, recent);
}
function decay(s, now) {
  const full = linear(s, now, 0, s.length - 1);
  if (full === null) return null;
  const mid = Math.floor((s.length - 1) / 2);
  const r1 = s[mid].mandate - s[0].mandate, r2 = s[s.length - 1].mandate - s[mid].mandate;
  if (!(r1 > EPS) || r2 >= r1) return full; // not slowing: straight line
  const r = r2 / r1; // per half-window
  const ceiling = now.mandate + (r2 * r) / (1 - r);
  if (ceiling < 1) return null; // the slowing climb tops out short of full
  // halves needed: solve sum_{n=1..N} r2*r^n >= 1-now
  let left = 1 - now.mandate, add = r2, n = 0;
  const halfSpan = s[s.length - 1].tick - s[mid].tick;
  while (left > 0 && n < 200) { add *= r; left -= add; n++; }
  return now.tick + n * halfSpan;
}

function replay(snaps, model) {
  let samples = [], shown = 'hidden', seen = false, pending = null, turns = 0, turnTicks = [], atClimax = null, prevShown = 'hidden', firstTick = null;
  let mismatches = 0, compared = 0;
  // doom floor unknown offline: approximated as "already met" (the floor only binds early)
  for (const sn of snaps) {
    const tick = sn.tick, m = sn.mandateProgress, d = sn.doomProgress;
    const last = samples[samples.length - 1];
    if (!last || tick - last.tick >= DAY) samples = [...samples, { tick, mandate: m, doom: d, rP: sn.rP, rS: sn.rS }].slice(-WIN);
    let computed = 'hidden';
    if (d >= SHOW && samples.length >= MIN) {
      const a = samples[0], b = samples[samples.length - 1], span = b.tick - a.tick;
      const doomPace = (b.doom - a.doom) / span;
      if (span > 0 && (doomPace > 0 || d >= 1)) {
        const doomEnd = d >= 1 ? tick : tick + (1 - d) / doomPace;
        const mEnd = model(samples, { tick, mandate: m, rP: sn.rP, rS: sn.rS });
        if (mEnd === null) computed = 'doom_first'; // trend word unknown offline; doom_first and stalled share an ending
        else {
          const left = Math.max(1, doomEnd - tick);
          computed = Math.abs(mEnd - doomEnd) <= CLOSE * left ? 'close' : mEnd < doomEnd ? 'mandate_first' : 'doom_first';
        }
      }
    }
    // settle
    if (computed !== shown) {
      if (computed === 'hidden') { shown = 'hidden'; pending = null; }
      else if (shown === 'hidden') { shown = computed; seen = true; pending = null; }
      else if (pending && pending.state === computed) { if (tick - pending.since >= HOLD) { shown = computed; pending = null; } }
      else pending = { state: computed, since: tick };
    } else pending = null;
    if (firstTick === null && shown !== 'hidden') firstTick = tick;
    if (prevShown !== 'hidden' && shown !== 'hidden' && ENDING[prevShown] !== ENDING[shown]) { turns++; turnTicks.push(`t${tick}:${prevShown}->${shown}`); }
    prevShown = shown;
    if (atClimax === null && d >= CLIMAX) atClimax = `${shown}@t${tick}`;
    if (sn.raceState !== undefined) { compared++; if (ENDING[sn.raceState] !== ENDING[shown]) mismatches++; }
  }
  return { atClimax, turns, turnTicks, firstTick, mismatches, compared };
}

const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f => /^agency-\d+-\w+\.json$/.test(f)).sort();
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const snaps = r.snaps ?? [];
  let k = fitScales(snaps); const m = f.match(/^agency-([0-9]+)-/); if (!k || !(Math.abs(k.kP) > 0)) { const n = JSON.parse(fs.readFileSync(path.join(dir, 'agency-' + m[1] + '-none.json'), 'utf8')); k = fitScales(n.snaps); }
  let fitErr = 0;
  for (const s of snaps) {
    s.rP = k ? k.kP * s.ledgerP : 0; s.rS = k ? k.kS * s.ledgerS : 0;
    const est = Math.min(1, Math.max(0, (Math.min(1, Math.max(0, s.rP)) + Math.min(1, Math.max(0, s.rS))) / 2));
    fitErr = Math.max(fitErr, Math.abs(est - s.mandateProgress));
  }
  const end = snaps[snaps.length - 1] ?? {};
  console.log(`\n${f}: sphere fit kP=${k?.kP?.toExponential(3)} kS=${k?.kS?.toExponential(3)} max |progress err| ${fitErr.toFixed(3)}; at end primary share ${end.rP?.toFixed(3)} secondary share ${end.rS?.toFixed(3)}`);
  const endedBy = end.mandateCompleted ? 'Mandate' : (end.doomProgress >= 1 ? 'Doom' : `neither(t${end.tick})`);
  console.log(`\n${f}  snaps=${snaps.length}  end t${end.tick} mandate ${end.mandateProgress} doom ${end.doomProgress} → ${endedBy}  census: climax ${r.raceAtClimax}@t${r.raceClimaxTick} turns ${r.raceTurns}`);
  for (const [name, fn] of Object.entries(models)) {
    const o = replay(snaps, fn);
    console.log(`  ${name.padEnd(16)} climax ${String(o.atClimax).padEnd(24)} turns ${o.turns} ${o.turnTicks.join(' ')}${name === 'V0_line' ? `  [ending mismatch vs census ${o.mismatches}/${o.compared}]` : ''}`);
  }
}
