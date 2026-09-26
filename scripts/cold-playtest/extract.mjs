// Cold playtest — turn one tester's stream-json transcript into a readable log
// plus a machine-readable summary.
// Usage: node extract.mjs <personaRunDir>
//   writes <dir>/log.md and <dir>/summary.json, prints the summary.
// Plan: Docs/plans/2026-09-25-thr-1610-cold-playtest-loop.md (THR-1610).
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node extract.mjs <personaRunDir>'); process.exit(2); }
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
};

fs.writeFileSync(path.join(dir, 'log.md'), out.join('\n') + '\n');
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
