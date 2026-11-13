// THR-2203 census (proto, never merged): how varied is the dealt hand across every
// registry step that declares `deal`, for a fresh god (no gifts) of each hunger?
import { describe, it } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  CACHE_REGISTERED_REGIONAL_TEMPLATES,
} from '../../data/unified-action-templates';
import { buildRepertoire } from '../nudgeCardRepertoire';
import { dealHand } from '../encounters/dealHand';
import { HUNGER_IDS } from '../../types/hunger';
import { SPHERE_NAMES } from '../../types';
import type { SphereName } from '../../types';

describe('THR-2203 deal census', () => {
  it('reports hand variety', () => {
    const seen = new Set<string>();
    const templates = [
      ...UNIFIED_ACTION_TEMPLATES,
      ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
      ...CACHE_REGISTERED_REGIONAL_TEMPLATES,
    ].filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
    const dealingSteps: { tid: string; name: string; i: number; step: any }[] = [];
    for (const t of templates) {
      (t.steps ?? []).forEach((step: any, i: number) => {
        if (step?.deal) dealingSteps.push({ tid: t.id, name: t.name, i, step });
        for (const v of Object.values(step?.variants ?? {}) as any[]) {
          if (v?.deal) dealingSteps.push({ tid: t.id, name: t.name, i, step: v });
        }
      });
    }
    const templatesDealing = new Set(dealingSteps.map((d) => d.tid)).size;
    const lines: string[] = [];
    lines.push(`templates=${templates.length} templatesDealing=${templatesDealing} dealingSteps=${dealingSteps.length}`);
    let sumDistinct = 0;
    let sumModalShare = 0;
    let gods = 0;
    const spheres = SPHERE_NAMES as readonly SphereName[];
    HUNGER_IDS.forEach((hunger, hi) => {
      for (const offset of [0, 3]) {
        const primary = spheres[(hi + offset) % spheres.length];
        const secondary = spheres[(hi + offset + 5) % spheres.length];
        const repertoire = buildRepertoire({ primary, secondary, hunger, unlockedActionIds: new Set() });
        const counts = new Map<string, number>();
        for (const d of dealingSteps) {
          const r = dealHand(d.step, repertoire, { primarySphere: primary, secondarySphere: secondary, tags: d.step.deal?.tags });
          const key = [...r.report.dealt].sort().join('|');
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const modal = Math.max(...counts.values());
        gods++;
        sumDistinct += counts.size;
        sumModalShare += modal / dealingSteps.length;
        lines.push(`${hunger}/${primary}+${secondary}: repertoire=${repertoire.length} distinctHands=${counts.size} modalShare=${(modal / dealingSteps.length).toFixed(2)}`);
      }
    });
    lines.push(`MEAN distinctHands=${(sumDistinct / gods).toFixed(1)} modalShare=${(sumModalShare / gods).toFixed(2)}`);
    // the four named chapters, witness god mind/spirit
    const rep = buildRepertoire({ primary: 'mind' as SphereName, secondary: 'spirit' as SphereName, hunger: 'witness', unlockedActionIds: new Set() });
    for (const d of dealingSteps.filter((x) => /Shrine|Shadow in the Night|Inheritance Wake|Refugee Aid/.test(x.name))) {
      const r = dealHand(d.step, rep, { primarySphere: 'mind' as SphereName, secondarySphere: 'spirit' as SphereName, tags: d.step.deal?.tags });
      lines.push(`  ${d.name}#${d.i} tags=${(d.step.deal?.tags ?? []).join(',')} diff=${d.step.difficulty} -> ${r.report.dealt.join(', ')}`);
    }
    // difficulty spread of dealing steps
    const diffs = dealingSteps.map((d) => d.step.difficulty).filter((x) => typeof x === 'number').sort((a, b) => a - b);
    const q = (p: number) => diffs[Math.floor(p * (diffs.length - 1))];
    lines.push(`difficulty n=${diffs.length} p10=${q(0.1)} p50=${q(0.5)} p90=${q(0.9)}`);
    console.log(lines.join('\n'));
  });
});
