// Cold playtest — turn one tester's stream-json transcript into a readable log
// plus a machine-readable summary.
// Usage: node extract.mjs <personaRunDir>
//   writes <dir>/log.md and <dir>/summary.json, prints the summary.
//        node extract.mjs --coverage-only <personaRunDir>
//   prints only the coverage block (which mid-game surfaces the tester reached),
//   read from the tester's shots/*.yml snapshots. Writes nothing. (THR-1744)
// Plan: Docs/plans/2026-09-25-thr-1610-cold-playtest-loop.md (THR-1610);
//       warm mode + coverage: Docs/plans/2026-10-05-thr-1744-warm-playtest.md (THR-1744).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const coverageOnly = argv.includes('--coverage-only');
const dir = argv.find(a => !a.startsWith('--'));
if (!dir) { console.error('usage: node extract.mjs [--coverage-only] <personaRunDir>'); process.exit(2); }

const cfg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'config.json'), 'utf8'));

// ── Coverage (THR-1744) ──
// A surface is `reached` when any snapshot carries one of its markers; `reached-empty`
// when every snapshot that matched shows only its empty state. The markers live in
// config.json so a copy change is a config edit. A coverage failure is reaching none
// of faction / undertaking / ambition — thread history does not count (cold testers
// already reach it).
const MID_GAME_SURFACES = ['faction', 'undertaking', 'ambition'];
function readCoverage(runDir) {
  const shots = path.join(runDir, 'shots');
  const files = fs.existsSync(shots) ? fs.readdirSync(shots).filter(f => f.endsWith('.yml')) : [];
  const texts = files.map(f => fs.readFileSync(path.join(shots, f), 'utf8'));
  const surfaces = {};
  const matched = {};
  for (const [surface, m] of Object.entries(cfg.coverageMarkers ?? {})) {
    const reachedMarkers = m.reached ?? [];
    const emptyMarkers = m.empty ?? [];
    let full = false;
    let any = false;
    const hits = new Set();
    for (const t of texts) {
      const r = reachedMarkers.filter(k => t.includes(k));
      const e = emptyMarkers.filter(k => t.includes(k));
      r.concat(e).forEach(k => hits.add(k));
      if (r.length || e.length) any = true;
      if (r.length && !e.length) full = true;
    }
    surfaces[surface] = full ? 'reached' : any ? 'reached-empty' : '—';
    matched[surface] = [...hits];
  }
  const coverageFailure = MID_GAME_SURFACES.every(s => (surfaces[s] ?? '—') === '—');
  return { snapshots: files.length, ...surfaces, coverageFailure, matched };
}

// The warm-up's own console line, from Playwright MCP's console-*.log. A warm tester
// whose warm-up never logged completion played the wrong world.
function readWarmStart(runDir) {
  const shots = path.join(runDir, 'shots');
  const marker = cfg.warmStartLogMarker ?? '[warm-start] done';
  const logs = fs.existsSync(shots) ? fs.readdirSync(shots).filter(f => /^console.*\.log$/.test(f)) : [];
  for (const f of logs) {
    const text = fs.readFileSync(path.join(shots, f), 'utf8');
    const i = text.indexOf(marker);
    if (i < 0) continue;
    const json = text.slice(i + marker.length).match(/\{.*\}/);
    let line = null;
    try { line = json ? JSON.parse(json[0]) : null; } catch { line = null; }
    return { ok: true, line };
  }
  return { ok: false, line: null };
}

if (coverageOnly) {
  console.log(JSON.stringify({ persona: path.basename(dir), coverage: readCoverage(dir) }));
  process.exit(0);
}
const mode = fs.existsSync(path.join(dir, 'mode.txt')) ? fs.readFileSync(path.join(dir, 'mode.txt'), 'utf8').trim() : 'cold';
const transcript = path.join(dir, 'transcript.jsonl');
const lines = fs.existsSync(transcript)
  ? fs.readFileSync(transcript, 'utf8').split('\n').filter(Boolean)
  : [];

const NON_ACTIONS = new Set(['take_screenshot', 'snapshot', 'wait_for']);
const TAGS = ['CONFUSED', 'LOST', 'HOOKED', 'BORED', 'WOULD QUIT', 'SURPRISE'];

const out = [];
const texts = []; // { text, atAction } — in-play notes; the last one is the debrief
let actions = 0;
let result = null;
let failure = null;

for (const l of lines) {
  let ev;
  try { ev = JSON.parse(l); } catch { continue; }
  if (ev.type === 'assistant') {
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'text' && c.text.trim()) {
        const text = c.text.trim();
        out.push(text);
        texts.push({ text, atAction: actions });
      }
      if (c.type === 'tool_use') {
        const name = c.name.replace('mcp__pw__browser_', '');
        if (!NON_ACTIONS.has(name) && name !== 'ToolSearch') actions++;
        const i = c.input ?? {};
        const arg = i.element ?? i.url ?? i.key ?? i.text ?? (i.x != null ? `${i.x},${i.y}` : '');
        out.push(`  → [${name}] ${String(arg).slice(0, 80)}`);
      }
    }
  }
  if (ev.type === 'user') {
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'tool_result' && c.is_error) {
        const t = Array.isArray(c.content) ? c.content.map(x => x.text ?? '').join(' ') : String(c.content);
        out.push(`  ✗ ${t.slice(0, 160)}`);
      }
    }
  }
  if (ev.type === 'system' && ev.subtype === 'api_retry' && ev.error === 'authentication_failed') failure = 'auth';
  if (ev.type === 'result') result = ev;
}

const resultText = String(result?.result ?? '');
if (!failure && /safeguards flagged/i.test(resultText)) failure = 'safeguard';
if (!failure && /authenticat/i.test(resultText) && result?.is_error) failure = 'auth';
if (!failure && !result) failure = lines.length ? 'incomplete' : 'no-transcript';
if (!failure && result?.is_error) failure = 'error';
const warmStart = mode === 'warm' ? readWarmStart(dir) : null;
if (!failure && warmStart && !warmStart.ok) failure = 'warm-start';

// The debrief is the final assistant message. Tags are counted on the in-play
// notes only, so the debrief's own recap of "WOULD QUIT" does not double-count.
// The final message often carries the last in-play notes before the "Debrief" heading.
const last = texts.at(-1) ?? { text: '', atAction: actions };
const cut = last.text.search(/(^|\n)[#*\s]*Debrief\b/i);
const debrief = cut >= 0 ? last.text.slice(cut) : last.text;
const inPlay = texts.slice(0, -1);
if (cut > 0) inPlay.push({ text: last.text.slice(0, cut), atAction: last.atAction });
const tagCounts = Object.fromEntries(TAGS.map(t => [t, 0]));
let firstQuitAtAction = null;
for (const { text, atAction } of inPlay) {
  for (const t of TAGS) {
    const n = (text.match(new RegExp(`\\b${t}\\b`, 'g')) ?? []).length;
    tagCounts[t] += n;
    if (t === 'WOULD QUIT' && n > 0 && firstQuitAtAction === null) firstQuitAtAction = atAction;
  }
}

// Count bullets in a numbered debrief section ("3. Things I never understood" / "## 3. ...").
function sectionBullets(n) {
  const m = debrief.match(new RegExp(`(?:^|\\n)[#*\\s]*${n}\\.[^\\n]*\\n([\\s\\S]*?)(?=\\n[#*\\s]*${n + 1}\\.|$)`));
  return m ? (m[1].match(/^\s*[-*•] /gm) ?? []).length : null;
}
const verdictMatch = debrief.match(/Would I keep playing\?\**\s*\n+\s*\**\s*(yes|no|maybe)/i);

const summary = {
  persona: path.basename(dir),
  ok: failure === null,
  failure,
  actions,
  tags: tagCounts,
  firstQuitAtAction,
  neverUnderstood: sectionBullets(3),
  surprises: sectionBullets(4),
  verdict: verdictMatch ? verdictMatch[1].toLowerCase() : null,
  turns: result?.num_turns ?? null,
  minutes: result ? Math.round(result.duration_ms / 60000) : null,
  notionalCostUsd: result?.total_cost_usd != null ? Number(result.total_cost_usd.toFixed(2)) : null,
  mode,
  coverage: readCoverage(dir),
  ...(warmStart ? { warmStartOk: warmStart.ok, warmStart: warmStart.line } : {}),
};

fs.writeFileSync(path.join(dir, 'log.md'), out.join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
