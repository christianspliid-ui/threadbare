/** Scratch (never merged): which faction-meta templates already pay or cost Means in their outcome table? */
import { FACTION_ENCOUNTER_META } from '../src/data/faction-encounter-content';
import { UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';

const all = UNIFIED_ACTION_TEMPLATES as unknown as Array<{ id: string; outcomeEffects?: Record<string, Array<{ kind: string; quantity?: string; amount?: number }>> }>;
const byId = new Map(all.map(t => [t.id, t]));
let found = 0; let paysMeans = 0; const payers: string[] = [];
for (const id of FACTION_ENCOUNTER_META.keys()) {
  const t = byId.get(id);
  if (!t) continue;
  found++;
  const fx = Object.values(t.outcomeEffects ?? {}).flat();
  if (fx.some(e => e.kind === 'economy_shift' && e.quantity === 'means' && (e.amount ?? 0) > 0)) { paysMeans++; payers.push(id); }
}
console.log(JSON.stringify({ metaRows: FACTION_ENCOUNTER_META.size, templatesFound: found, paysMeansOnSuccess: paysMeans, payers }));
