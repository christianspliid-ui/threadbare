// completion.ts (THR-1634) — what each fired template still lacks: at-cost prose,
// extreme-band prose, a hand (authored nudges or a `deal`), band endings on its
// aftermath (`byOutcome`). Joins the attended firing JSON (readers/attended.ts
// --json) against the live template registry. Throwaway, like the other readers.
//
// Usage: node .cache/completion.mjs <attended.json> [--out <path>]
import * as fs from 'fs';
import { getUnifiedTemplateById } from '../../../../src/data/unified-action-templates';
import { getAnyEncounterById } from '../../../../src/data/encounter-content';
import { RETROFIT_PENDING } from '../../../../src/data/content-eval/retrofitPending';

const args = process.argv.slice(2);
const inPath = args[0];
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
const j = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const tmplOf = (id: string): any => getUnifiedTemplateById(id) ?? getAnyEncounterById(id);
const pending = new Set(RETROFIT_PENDING);

type Row = { id: string; firings: number; first: number; atCost: number; rank?: number };
const byId: Record<string, Row> = {};
for (const f of j.modes.attended.firings) {
  if (!f.isEnc) continue;
  const r = (byId[f.templateId] ??= { id: f.templateId, firings: 0, first: 0, atCost: 0 });
  r.firings++;
  if (f.court !== 'unthreaded') r.first++;
  if (f.outcome === 'success_at_cost') r.atCost++;
}
const total = Object.values(byId).reduce((a, r) => a + r.firings, 0);
const totalAtCost = Object.values(byId).reduce((a, r) => a + r.atCost, 0);
const ranked = Object.values(byId).sort((a, b) => b.firings - a.firings || a.id.localeCompare(b.id));
ranked.forEach((r, i) => { r.rank = i + 1; });

function status(id: string) {
  const t = tmplOf(id);
  if (!t) return { found: false };
  // Walk branch arms and fallbacks, the way attended.ts's stepsOf does.
  const steps: any[] = [];
  for (const s of (t.steps ?? []) as any[]) {
    if (s?.variants) { for (const v of Object.values(s.variants)) steps.push(v); if (s.fallback) steps.push(s.fallback); }
    else steps.push(s);
  }
  const n = steps.length;
  const sac = steps.filter(s => !!s.successAtCostAfterimage).length;
  const cs = steps.filter(s => !!s.criticalSuccessAfterimage).length;
  const cf = steps.filter(s => !!s.criticalFailureAfterimage).length;
  const nudges = steps.filter(s => (s.nudges?.length ?? 0) > 0).length;
  const deal = steps.filter(s => !!s.deal).length;
  const ac = t.aftermathConfig;
  const variants = ac ? [ac.fallback, ...Object.values(ac.variants ?? {})].filter(Boolean) : [];
  const bands = new Set<string>();
  for (const v of variants) for (const b of Object.keys((v as any).byOutcome ?? {})) bands.add(b);
  return {
    found: true, tier: t.attentionTier ?? t.tier ?? null, steps: n, sacSteps: sac, critSuccessSteps: cs, critFailSteps: cf,
    nudgeSteps: nudges, dealSteps: deal, hasAftermath: !!ac, aftermathVariants: variants.length,
    bandEndings: [...bands].sort(), retrofitPending: pending.has(id), file: t.__sourceFile ?? null,
  };
}

const rows = ranked.map(r => ({ ...r, share: r.firings / total, ...status(r.id) }));
let cum = 0;
const lines: string[] = [];
lines.push(`completion join — ${inPath}; ${total} attended encounter firings, ${totalAtCost} at-cost; ${ranked.length} templates`);
lines.push('rank firings first atCost cum% | steps sac cs cf nudge deal | aftermath bands | pending | id');
for (const r of rows as any[]) {
  cum += r.firings;
  lines.push(`${String(r.rank).padStart(3)} ${String(r.firings).padStart(4)} ${String(r.first).padStart(3)} ${String(r.atCost).padStart(3)} ${(100 * cum / total).toFixed(1).padStart(5)} | ${r.found ? `${r.steps} ${r.sacSteps} ${r.critSuccessSteps} ${r.critFailSteps} ${r.nudgeSteps} ${r.dealSteps}` : 'NOT FOUND'} | ${r.hasAftermath ? `${r.aftermathVariants}v [${r.bandEndings.join(',')}]` : '-'} | ${r.retrofitPending ? 'P' : ' '} | ${r.id}`);
}
const out = { source: inPath, total, totalAtCost, rows };
if (outPath) fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(lines.join('\n'));
