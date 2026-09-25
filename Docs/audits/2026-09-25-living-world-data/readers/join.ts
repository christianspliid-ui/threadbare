import { UNIFIED_ACTION_TEMPLATES } from '../../../../src/data/unified-action-templates';
import { CONTENT_OBJECT_KINDS } from '../../../../src/data/content-objects';
import * as fs from 'fs';
const fired: Record<string, number> = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template')!;
const enc = (UNIFIED_ACTION_TEMPLATES as any[]).filter(t => encKind.idPrefixes.some(p => t.id.startsWith(p)));
const stepsOf = (t: any): any[] => { const r: any[] = []; for (const s of t.steps ?? []) { if (s.variants) { for (const v of Object.values(s.variants)) r.push(v); r.push(s.fallback); } else r.push(s); } return r; };
const has = (t: any, k: string) => stepsOf(t).some(s => s?.[k]);
let w = 0, wSac = 0, wCs = 0, wCf = 0, wNudge = 0, wAfterBand = 0, wEnvelope = 0;
for (const t of enc) { const n = fired[t.id] ?? 0; if (!n) continue; w += n;
  if (has(t, 'successAtCostAfterimage')) wSac += n; if (has(t, 'criticalSuccessAfterimage')) wCs += n; if (has(t, 'criticalFailureAfterimage')) wCf += n;
  if (stepsOf(t).some(s => s?.nudges?.length)) wNudge += n; if (t.settings?.length) wEnvelope += n;
  const c = t.aftermathConfig; if (c && [...Object.values(c.variants ?? {}), c.fallback].some((v: any) => v?.byOutcome && Object.keys(v.byOutcome).length)) wAfterBand += n; }
console.log({ firings: w, sacAuthoredShare: wSac / w, csShare: wCs / w, cfShare: wCf / w, nudgeCardedShare: wNudge / w, envelopeShare: wEnvelope / w, aftermathBandedShare: wAfterBand / w });
// never fired among drawable
const drawable = enc.filter(t => t.drawable !== false);
const never = drawable.filter(t => !fired[t.id]);
const fam = (id: string) => id.split('.')[0].split('_')[0];
const tally = (a: any[], f: (t: any) => string) => { const m: Record<string, number> = {}; for (const t of a) m[f(t)] = (m[f(t)] ?? 0) + 1; return Object.fromEntries(Object.entries(m).sort((x, y) => y[1] - x[1])); };
console.log('drawable', drawable.length, 'neverFired', never.length);
console.log('neverFired by family', JSON.stringify(tally(never, t => fam(t.id))));
console.log('all by family', JSON.stringify(tally(drawable, t => fam(t.id))));
console.log('fired by family', JSON.stringify(tally(drawable.filter(t => fired[t.id]), t => fam(t.id))));
console.log('neverFired carded', never.filter(t => stepsOf(t).some(s => s?.nudges?.length)).map(t => t.id).join(' '));
const carded = enc.filter(t => stepsOf(t).some(s => s?.nudges?.length));
console.log('carded fired', carded.filter(t => fired[t.id]).map(t => t.id + '=' + fired[t.id]).join(' '));
console.log('neverFired by intrinsicTier', JSON.stringify(tally(never, t => String(t.intrinsicTier))));
console.log('neverFired by actor', JSON.stringify(tally(never, t => (t.actorAffinities ?? []).join('+'))));
