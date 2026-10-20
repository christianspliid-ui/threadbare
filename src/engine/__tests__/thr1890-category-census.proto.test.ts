/**
 * THR-1890 census — PROTO ONLY, never merged (branch proto/thr-1890-category-first).
 *
 * For every multi-category reward recipe in the template registry, on generated worlds
 * (seeds 42/99/7, medium), computes the exact (analytic) category mix of a prize draw:
 *   - authored: the recipe's own shares, over the categories that have any candidate
 *   - today:    drawTierFirst over the union pool (category weight × tier weight)
 *   - catFirst: roll the category by its authored share, then drawTierFirst inside it
 * and the tier mix under both draws. Writes a TSV + summary to CENSUS_OUT.
 */
import { describe, it } from 'vitest';
import { writeFileSync } from 'fs';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { resetEventCounter, resetDecisionCache } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { assembleRewardPool, resolveRewardRecipe, type PoolEntry } from '../rewardPool';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { getAllStrategicTemplates } from '../strategicActionCandidates';
import type { RewardPoolRecipe, AttachmentTier, AttachmentCategory } from '../../types/attachments';
import type { OutcomeType } from '../../types/unifiedAction';

const SEEDS = [42, 99, 7];
const OUTCOMES: OutcomeType[] = ['success', 'critical_success'];
const TIERS: AttachmentTier[] = [1, 2, 3, 4];
const OUT = process.env.CENSUS_OUT ?? 'thr1890-census';

function collectRecipes(): Map<string, { recipe: RewardPoolRecipe; sites: string[] }> {
  const out = new Map<string, { recipe: RewardPoolRecipe; sites: string[] }>();
  const seen = new WeakSet<object>();
  const walk = (node: unknown, site: string, depth: number): void => {
    if (!node || typeof node !== 'object' || depth > 14) return;
    if (seen.has(node as object)) return;
    seen.add(node as object);
    const o = node as Record<string, unknown>;
    if (o.categoryWeights && typeof o.categoryWeights === 'object' && !Array.isArray(o.categoryWeights)) {
      const recipe = o as unknown as RewardPoolRecipe;
      const key = JSON.stringify({ c: recipe.categoryWeights, t: recipe.tagFilters ?? [], b: recipe.requiresBearerTrait ?? null });
      const row = out.get(key);
      if (row) row.sites.push(site); else out.set(key, { recipe, sites: [site] });
    }
    for (const v of Object.values(o)) walk(v, site, depth + 1);
  };
  for (const t of UNIFIED_ACTION_TEMPLATES) walk(t, t.id, 0);
  for (const t of getAllStrategicTemplates()) walk(t, (t as { id: string }).id, 0);
  return out;
}

function tierProbs(pool: readonly PoolEntry[], curve: Record<AttachmentTier, number>): Map<AttachmentTier, number> {
  const present = new Set<AttachmentTier>();
  for (const e of pool) if (e.weight > 0) present.add(((e.tier ?? 1) as AttachmentTier));
  const total = TIERS.reduce((s, t) => s + Math.max(0, curve[t] ?? 0), 0);
  const probs = new Map<AttachmentTier, number>();
  if (present.size === 0 || total <= 0) return probs;
  for (const t of TIERS) {
    const p = Math.max(0, curve[t] ?? 0) / total;
    if (p <= 0) continue;
    let land: AttachmentTier | undefined = present.has(t) ? t : undefined;
    if (land === undefined) land = TIERS.filter(x => x < t && present.has(x)).pop() ?? TIERS.find(x => x > t && present.has(x));
    if (land !== undefined) probs.set(land, (probs.get(land) ?? 0) + p);
  }
  return probs;
}

/** P(category) and P(tier) for a tier-first draw over a pool whose entries carry a category tag. */
function mixOf(pool: Array<PoolEntry & { cat: string }>, curve: Record<AttachmentTier, number>) {
  const cat = new Map<string, number>();
  const tier = new Map<AttachmentTier, number>();
  for (const [t, p] of tierProbs(pool, curve)) {
    const inTier = pool.filter(e => ((e.tier ?? 1) as AttachmentTier) === t && e.weight > 0);
    const tot = inTier.reduce((s, e) => s + e.weight, 0);
    for (const e of inTier) cat.set(e.cat, (cat.get(e.cat) ?? 0) + p * e.weight / tot);
    tier.set(t, (tier.get(t) ?? 0) + p);
  }
  return { cat, tier };
}

describe('THR-1890 category census (proto)', () => {
  it('measures', { timeout: 600_000 }, () => {
    const recipes = [...collectRecipes().values()].filter(r =>
      Object.values(r.recipe.categoryWeights).filter(w => (w ?? 0) > 0).length > 1);
    const rows: string[] = ['seed\toutcome\trecipe\tsites\tcategory\tauthored\ttoday\tcatFirst\tpoolCount'];
    const agg: Record<string, { off: number; offCF: number; n: number; catToday: Map<string, number>; catCF: Map<string, number>; catAuth: Map<string, number>; tierToday: number[]; tierCF: number[]; tierRF: number[]; catTC: Map<string, number>; offTC: number; recipesShifted10: number; worst: Array<[number, string]> }> = {};

    for (const seed of SEEDS) {
      resetEventCounter(); resetDecisionCache(); resetReputationTraitInit();
      const preset = MAP_SIZE_PRESETS.medium;
      const archetype = generateArchetypes(4, seed)[0];
      const { state } = initializeGameState(archetype, 'Census', createBalancedCosmology(), seed, preset.cols, preset.rows);
      const graph = state.graph;
      const bearer = graph.getNodesByType('agent').map(n => n.id).sort()[0];

      for (const outcome of OUTCOMES) {
        const a = (agg[outcome] ??= { off: 0, offCF: 0, n: 0, catToday: new Map(), catCF: new Map(), catAuth: new Map(), tierToday: [0, 0, 0, 0], tierCF: [0, 0, 0, 0], tierRF: [0, 0, 0, 0], catTC: new Map(), offTC: 0, recipesShifted10: 0, worst: [] });
        for (const { recipe, sites } of recipes) {
          const resolved = resolveRewardRecipe(recipe, outcome);
          const perCat: Array<{ cat: string; w: number; pool: Array<PoolEntry & { cat: string }> }> = [];
          for (const [c, w] of Object.entries(recipe.categoryWeights)) {
            if (!w || w <= 0) continue;
            const pool = assembleRewardPool(graph, { ...resolved, categoryWeights: { [c]: w } as Partial<Record<AttachmentCategory, number>> }, bearer)
              .map(e => ({ ...e, cat: c }));
            perCat.push({ cat: c, w, pool });
          }
          const live = perCat.filter(p => p.pool.length > 0);
          if (live.length < 2) continue; // single effective category: nothing to dilute
          const wSum = live.reduce((s, p) => s + p.w, 0);
          const union = live.flatMap(p => p.pool);
          const today = mixOf(union, resolved.tierCurve);
          const cfCat = new Map<string, number>();
          const cfTier = new Map<AttachmentTier, number>();
          for (const p of live) {
            const share = p.w / wSum;
            cfCat.set(p.cat, share);
            for (const [t, q] of mixOf(p.pool, resolved.tierCurve).tier) cfTier.set(t, (cfTier.get(t) ?? 0) + share * q);
          }
          const rfTier = new Map();
          for (const p of live) { const share = today.cat.get(p.cat) ?? 0; for (const [t, q] of mixOf(p.pool, resolved.tierCurve).tier) rfTier.set(t, (rfTier.get(t) ?? 0) + share * q); }
          // Arm D: tier first (unchanged), then the category by its authored share among the
          // categories with an entry at that tier, then the item.
          const tcCat = new Map<string, number>();
          for (const [t, q] of tierProbs(union, resolved.tierCurve)) {
            const here = live.filter(p => p.pool.some(e => ((e.tier ?? 1) as AttachmentTier) === t && e.weight > 0));
            const hs = here.reduce((s2, p) => s2 + p.w, 0);
            for (const p of here) tcCat.set(p.cat, (tcCat.get(p.cat) ?? 0) + q * p.w / hs);
          }
          let tvTC = 0;
          for (const p of live) { tvTC += Math.abs(p.w / wSum - (tcCat.get(p.cat) ?? 0)); a.catTC.set(p.cat, (a.catTC.get(p.cat) ?? 0) + (tcCat.get(p.cat) ?? 0)); }
          a.offTC += tvTC / 2;
          let tv = 0;
          for (const p of live) {
            const auth = p.w / wSum;
            const td = today.cat.get(p.cat) ?? 0;
            tv += Math.abs(auth - td);
            rows.push([seed, outcome, sites[0], sites.length, p.cat, auth.toFixed(3), td.toFixed(3), auth.toFixed(3), (tcCat.get(p.cat) ?? 0).toFixed(3), p.pool.length].join('\t'));
            a.catAuth.set(p.cat, (a.catAuth.get(p.cat) ?? 0) + auth);
            a.catToday.set(p.cat, (a.catToday.get(p.cat) ?? 0) + td);
            a.catCF.set(p.cat, (a.catCF.get(p.cat) ?? 0) + auth);
          }
          tv /= 2;
          a.off += tv; a.n += 1;
          if (tv >= 0.10) a.recipesShifted10 += 1;
          a.worst.push([tv, `${sites[0]} (${live.map(p => `${p.cat}:${p.w}/${p.pool.length}`).join(' ')})`]);
          TIERS.forEach((t, i) => { a.tierToday[i] += today.tier.get(t) ?? 0; a.tierCF[i] += cfTier.get(t) ?? 0; a.tierRF[i] += rfTier.get(t) ?? 0; });
        }
      }
    }

    const lines: string[] = [`recipes (multi-category in registry): ${recipes.length}`];
    for (const [outcome, a] of Object.entries(agg)) {
      const pct = (m: Map<string, number>) => [...m.entries()].sort((x, y) => y[1] - x[1]).map(([c, v]) => `${c} ${(100 * v / a.n).toFixed(1)}%`).join(', ');
      lines.push(`\n## ${outcome} — ${a.n} recipe×seed rows`);
      lines.push(`mean draws off the authored category (today): ${(100 * a.off / a.n).toFixed(1)}%`);
      lines.push(`rows shifted ≥10 points: ${a.recipesShifted10} (${(100 * a.recipesShifted10 / a.n).toFixed(1)}%)`);
      lines.push(`category mix — authored: ${pct(a.catAuth)}`);
      lines.push(`category mix — today:    ${pct(a.catToday)}`);
      lines.push(`category mix — catFirst: ${pct(a.catCF)}`);
      lines.push(`category mix — tierThenCat: ${pct(a.catTC)}   (off authored: ${(100 * a.offTC / a.n).toFixed(1)}%)`);
      lines.push(`tier mix today:    ${a.tierToday.map(v => (100 * v / a.n).toFixed(1)).join(' / ')}`);
      lines.push(`tier mix catFirst: ${a.tierCF.map(v => (100 * v / a.n).toFixed(1)).join(' / ')}`);
      lines.push();
      lines.push(`tier mix refit:    ${a.tierRF.map(v => (100 * v / a.n).toFixed(1)).join(' / ')}`);
      lines.push('worst 12:');
      for (const [tv, s] of a.worst.sort((x, y) => y[0] - x[0]).slice(0, 12)) lines.push(`  ${(100 * tv).toFixed(1)}%  ${s}`);
    }
    writeFileSync(`${OUT}.tsv`, rows.join('\n'));
    writeFileSync(`${OUT}.md`, lines.join('\n'));
    console.log(lines.join('\n'));
  });
});
