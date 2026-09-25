import { UNIFIED_ACTION_TEMPLATES } from '../../../../src/data/unified-action-templates';
import { CONTENT_OBJECT_KINDS } from '../../../../src/data/content-objects';
import { entriesOfKind } from '../../../../src/data/contentCatalogs';
import { settingClassForSubtype } from '../../../../src/data/settingClasses';

const encKind = CONTENT_OBJECT_KINDS.find(k => k.id === 'encounter_template')!;
const isEnc = (id: string) => encKind.idPrefixes.some(p => id.startsWith(p));
const all = UNIFIED_ACTION_TEMPLATES as any[];
const enc = all.filter(t => isEnc(t.id));
const out: Record<string, unknown> = {};
const tally = (arr: any[], f: (t: any) => string | string[] | undefined) => {
  const m: Record<string, number> = {};
  for (const t of arr) { let v = f(t); if (v === undefined) v = '(none)'; for (const k of Array.isArray(v) ? (v.length ? v : ['(none)']) : [v]) m[k] = (m[k] ?? 0) + 1; }
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
};
out.poolTotal = all.length; out.encounters = enc.length;
out.byReach = tally(enc, t => t.reach);
out.bySphere = tally(enc, t => t.sphereAffinity);
out.byScale = tally(enc, t => t.scale);
out.byRarity = tally(enc, t => t.rarityTier);
out.byIntrinsicTier = tally(enc, t => t.intrinsicTier);
out.byActor = tally(enc, t => t.actorAffinities);
out.byLocSubtype = tally(enc, t => t.locationSubtypes);
out.bySetting = tally(enc, t => (t.locationSubtypes ?? []).map((s: string) => settingClassForSubtype(s) ?? `unmapped:${s}`));
out.byFamilyPrefix = tally(enc, t => { const p = t.id.split('.'); return p.length >= 3 ? p[0] + '.' + p[1] : p[0]; });
out.byTag = tally(enc, t => t.tags ?? []);
out.drawableFalse = enc.filter(t => t.drawable === false).length;
out.withSettingsEnvelope = enc.filter(t => t.settings?.length).length;
const stepsOf = (t: any): any[] => { const r: any[] = []; for (const s of t.steps ?? []) { if (s.variants) { for (const v of Object.values(s.variants)) r.push(v); r.push(s.fallback); } else r.push(s); } return r; };
out.withNudges = enc.filter(t => stepsOf(t).some(s => s?.nudges?.length)).length;
const AI = ['criticalSuccessAfterimage', 'successAfterimage', 'successAtCostAfterimage', 'nearMissAfterimage', 'failureAfterimage', 'criticalFailureAfterimage'];
const aiCount = (t: any) => { const s = stepsOf(t); const set = new Set<string>(); for (const st of s) for (const k of AI) if (st?.[k]) set.add(k); return set.size; };
out.afterimageBandsDist = tally(enc, t => String(aiCount(t)));
out.withAftermathConfig = enc.filter(t => t.aftermathConfig).length;
const bandCount = (t: any) => { const c = t.aftermathConfig; if (!c) return -1; const set = new Set<string>(); for (const v of [...Object.values(c.variants ?? {}), c.fallback]) for (const k of Object.keys((v as any)?.byOutcome ?? {})) set.add(k); return set.size; };
out.aftermathByOutcomeBandsDist = tally(enc.filter(t => t.aftermathConfig), t => String(bandCount(t)));
out.aftermathReactionsTotal = enc.reduce((n, t) => { const c = t.aftermathConfig; if (!c) return n; return n + [...Object.values(c.variants ?? {}), c.fallback].reduce((m: number, v: any) => m + (v?.reactions?.length ?? 0), 0); }, 0);
out.withContextFragments = enc.filter(t => t.contextFragments?.length).length;
out.withTraitVariants = enc.filter(t => t.traitVariants?.length).length;
out.withIllustration = enc.filter(t => t.illustrationUrl).length;
out.withReputationGate = enc.filter(t => t.requiredReputationWith).length;
out.repFaction = tally(enc.filter(t => t.requiredReputationWith), t => String(t.requiredReputationWith.factionId ?? t.requiredReputationWith.factionDefId ?? JSON.stringify(t.requiredReputationWith).slice(0, 40)));
out.withRequiredTraits = enc.filter(t => t.requiredTraits?.length).length;
out.withForeshadowing = enc.filter(t => t.foreshadowing).length;
out.stepCountDist = tally(enc, t => String((t.steps ?? []).length));
// culture: required node props / tags mentioning culture
out.cultureMentions = tally(enc, t => { const s = JSON.stringify({ r: t.requiredNodeProperties, tags: t.tags, ls: t.locationSubtypes }); const m = s.match(/culture[._a-z]*/gi); return m ? [...new Set(m)] : '(none)'; });
// reach x setting for nudge-carded only
const carded = enc.filter(t => stepsOf(t).some(s => s?.nudges?.length));
out.cardedIds = carded.map(t => t.id);
out.cardedByReach = tally(carded, t => t.reach);
out.cardedBySetting = tally(carded, t => (t.settings?.length ? t.settings : (t.locationSubtypes ?? []).map((s: string) => settingClassForSubtype(s) ?? `unmapped:${s}`)));
// actions
const act = all.filter(t => !isEnc(t.id));
out.actions = act.length; out.actionByPrefix = tally(act, t => t.id.split(/[._]/)[0]); out.actionByReach = tally(act, t => t.reach);
// other kinds
const kinds: Record<string, unknown> = {};
for (const k of CONTENT_OBJECT_KINDS) {
  const es = entriesOfKind(k.id) as any[];
  kinds[k.id] = { n: es.length,
    tier: tally(es, e => String(e.rarityTier ?? e.tier ?? e.properties?.rarityTier ?? e.properties?.tier ?? '(none)')),
    reach: tally(es, e => String(e.reach ?? e.properties?.reach ?? e.censusTag?.reach ?? '(none)')),
    tags: tally(es, e => ((e.tags ?? e.properties?.tags ?? []) as string[]).filter(x => x.startsWith('#'))),
  };
}
out.kinds = kinds;
console.log(JSON.stringify(out, null, 1));
