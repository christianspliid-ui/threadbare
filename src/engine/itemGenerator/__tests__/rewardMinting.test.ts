/**
 * Found things in the reward draw (THR-1626) — the second minting point.
 *
 * Plan: `Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md` § Done when, the
 * unit and determinism rows. Each eligibility rule has an arm that would substitute if
 * the rule were missing (the forced pin is on throughout), so a pass is not vacuous.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorldGraph } from '../../graph';
import { drawSeededReward, instantiateReward } from '../../rewardPool';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { setForceGeneratedRewards } from '../../debugGeneratedRewardPin';
import { tryGeneratedReward, foundCoresCarrying, generatedRewardBand } from '../rewardMinting';
import { generateItem } from '../generateItem';
import { generateValidItem } from '../mintGeneratedItem';
import { reviewWorldContext, REVIEW_MAKERS } from '../reviewWorld';
import { bandsForOrigin } from '../reviewBatch';
import { ITEM_GEN_CORES, coreTagReach } from '../../../data/item-generator-cores';
import { ITEM_GEN_GATE_SEEDS, ITEM_GEN_ORIGINS, ITEM_GEN_REWARD_MIN_FIT_CORES } from '../../../data/item-generator-tables';
import type { ItemGenBand } from '../../../data/item-generator-tables';
import type { ResolvedRewardRecipe } from '../../../types/attachments';
import type { GeneratedItemProvenance } from '../types';

const FLAT = { 1: 1, 2: 1, 3: 1, 4: 1 } as const;

/**
 * A small world with a past — two of its dead — so the found cores have someone to name.
 * `only` keeps a single tome in the library, so a draw's pick is known in advance.
 */
function world(only?: string): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'dead_scholar', type: 'actor', name: 'Genner Vale', properties: { actorType: 'individual', npcRole: 'scholar', deceased: true, deceasedTick: 12, deathCause: 'band' } });
  graph.addNode({ id: 'dead_captain', type: 'actor', name: 'Hesta Ryle', properties: { actorType: 'individual', npcRole: 'guard_captain', gender: 'female', deceased: true, deceasedTick: 20, deathCause: 'battle' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'keepers', type: 'actor', name: 'The Lorekeepers Covenant', properties: { actorType: 'faction', factionDefId: 'lorekeepers_covenant' } });
  graph.addNode({ id: 'circle', type: 'actor', name: 'The Arcane Circle', properties: { actorType: 'faction', factionDefId: 'arcane_circle' } });
  graph.addNode({ id: 'saltmere', type: 'location', name: 'Saltmere', properties: { locationSubtype: 'town', hexCol: 4, hexRow: 4 } });
  graph.addEdge({ id: 'at_kael', source: 'kael', target: 'saltmere', type: 'located_at', properties: {} });
  const tome = (id: string, tier: number, extra: Record<string, unknown> = {}) => (only && id !== only) ? undefined : graph.addNode({
    id, type: 'artifact', name: `Tome ${id}`,
    properties: { subcategory: 'tomes_scrolls', tier, tags: ['#knowledge', '#tome'], mechanicalSummary: 'test', ...extra },
  });
  tome('reward_tome_t1', 1);
  tome('reward_tome_t2', 2);
  tome('reward_tome_t3', 3);
  tome('reward_tome_t4', 4);
  tome('reward_tome_service', 2, { rewardMode: 'service', effects: [] });
  if (only) return graph;
  graph.addNode({ id: 'reward_relic_legend', type: 'artifact_legendary', name: 'The Old Crown', properties: { tier: 3, tags: ['#knowledge'] } });
  graph.addNode({ id: 'reward_condition_t2', type: 'trait', name: 'Inspired', properties: { subcategory: 'condition', tier: 2, tags: ['#knowledge'] } });
  return graph;
}

const req = (graph: WorldGraph, drawnTemplateId: string, requiredTags: string[] = ['#knowledge']) => ({
  graph, seed: 42, tick: 30, recipientId: 'kael', drawnTemplateId, requiredTags, site: 'step_reward_pool' as const,
});

const recipe = (extra: Partial<ResolvedRewardRecipe> = {}): ResolvedRewardRecipe => ({
  categoryWeights: { possession: 1 }, tierCurve: { ...FLAT, 1: 0, 3: 0, 4: 0 }, badOutcomeChance: 0, tagFilters: ['#knowledge'], ...extra,
});

describe('tryGeneratedReward (THR-1626)', () => {
  beforeEach(() => setForceGeneratedRewards(true));
  afterEach(() => setForceGeneratedRewards(false));

  it('an eligible tier-2 pick, roll forced: mints a gen_found_* item carrying every required tag', () => {
    const graph = world();
    const r = tryGeneratedReward(req(graph, 'reward_tome_t2'));
    expect(r.substituted).toBe(true);
    if (!r.substituted) return;
    expect(r.instantiation.instanceId).toBe('gen_found_kael_30_reward_tome_t2');
    expect(r.band).toBe(2);
    const node = graph.getNode(r.instantiation.instanceId)!;
    expect(node.properties.origin).toBe('generated');
    expect(node.properties.tags).toContain('#knowledge');
    expect(node.properties.acquiredTick).toBe(30);
    const g = node.properties.generated as GeneratedItemProvenance;
    expect(g.origin).toBe('found');
    expect(g.makerId).toBeNull();
    expect(graph.getEdge(r.instantiation.edgeId)?.source).toBe('kael');
    // Not drawable: a minted instance is never a template.
    expect(node.properties.craftedBy).toBeUndefined();
  });

  it('a tier-3 pick is generated Mythic', () => {
    const r = tryGeneratedReward(req(world(), 'reward_tome_t3'));
    expect(r.substituted && r.band).toBe(3);
  });

  it.each([
    ['tier 1 (Mundane stays authored)', 'reward_tome_t1'],
    ['tier 4 (Legendary stays authored)', 'reward_tome_t4'],
    ['a legendary node', 'reward_relic_legend'],
    ['a service reward', 'reward_tome_service'],
    ['a condition', 'reward_condition_t2'],
    ['a companion (registry-backed, no node)', 'companion_template_not_a_node'],
  ])('never substitutes %s', (_label, id) => {
    const graph = world();
    const before = graph.getNodesByType('artifact').length;
    const r = tryGeneratedReward(req(graph, id));
    expect(r).toEqual({ substituted: false, reason: 'not_eligible' });
    expect(graph.getNodesByType('artifact').length).toBe(before);
  });

  it('a recipe only one found core can carry keeps its authored item (too_few_cores)', () => {
    expect(foundCoresCarrying(['#stealth'], 2)).toEqual(['thieves_kit']);
    expect(tryGeneratedReward(req(world(), 'reward_tome_t2', ['#stealth']))).toEqual({ substituted: false, reason: 'too_few_cores' });
  });

  it('a recipe no core can carry keeps its authored item (too_few_cores)', () => {
    expect(foundCoresCarrying(['#survival'], 2)).toEqual([]);
    expect(tryGeneratedReward(req(world(), 'reward_tome_t2', ['#survival']))).toEqual({ substituted: false, reason: 'too_few_cores' });
  });

  it('knowledge now has two found cores at both bands — the floor lets it through', () => {
    for (const band of [2, 3] as const) {
      expect(foundCoresCarrying(['#knowledge'], band).length).toBeGreaterThanOrEqual(ITEM_GEN_REWARD_MIN_FIT_CORES);
    }
  });

  it('without the pin, the share roll decides — and a failed roll leaves no trace and no node', () => {
    setForceGeneratedRewards(false);
    let kept = 0; let substituted = 0;
    for (let tick = 0; tick < 40; tick++) {
      const graph = world();
      const r = tryGeneratedReward({ ...req(graph, 'reward_tome_t2'), tick });
      if (r.substituted) substituted++;
      else if (r.reason === 'kept_by_roll') { kept++; expect(graph.getNodesByType('artifact').some(n => n.id.startsWith('gen_'))).toBe(false); }
    }
    // A share of 0.5 over 40 independent rolls: both sides occur.
    expect(kept).toBeGreaterThan(5);
    expect(substituted).toBeGreaterThan(5);
  });

  it('traces reward.generated with the authored pick and what stood in', () => {
    enableTracing(); clearTraces();
    try {
      const graph = world();
      const r = tryGeneratedReward(req(graph, 'reward_tome_t2'));
      expect(r.substituted).toBe(true);
      const t = getTraces().filter(x => x.category === 'reward.generated') as unknown as Array<Record<string, unknown>>;
      expect(t).toHaveLength(1);
      expect(t[0]).toMatchObject({ drawnTemplateId: 'reward_tome_t2', band: 2, outcome: 'substituted', site: 'step_reward_pool', requiredTags: ['#knowledge'] });
      expect(t[0].itemId).toBe('gen_found_kael_30_reward_tome_t2');
      expect(String(t[0].summary)).toContain('instead of Tome reward_tome_t2');
      expect(getTraces().some(x => x.category === 'item.generated')).toBe(true);
    } finally { disableTracing(); }
  });

  it('determinism: the same seed, tick, recipient and pick give a byte-identical item', () => {
    const a = tryGeneratedReward(req(world(), 'reward_tome_t2'));
    const b = tryGeneratedReward(req(world(), 'reward_tome_t2'));
    expect(a.substituted && b.substituted).toBe(true);
    if (!a.substituted || !b.substituted) return;
    expect(JSON.stringify(a.item)).toBe(JSON.stringify(b.item));
  });

  it('generatedRewardBand reads the pick, not the recipe', () => {
    const graph = world();
    expect(generatedRewardBand(graph, 'reward_tome_t2')).toBe(2);
    expect(generatedRewardBand(graph, 'reward_tome_t1')).toBeNull();
  });
});

describe('drawSeededReward carries a generated item (THR-1626)', () => {
  afterEach(() => setForceGeneratedRewards(false));

  const params = { recipe: recipe(), outcomeType: 'success' as const, seed: 42, tick: 30, actorId: 'kael', templateId: 'encounter.test', site: 'step_reward_pool' as const };

  it('the pool still picks; the generator stands in; the draw roll is untouched', () => {
    const plain = drawSeededReward(world('reward_tome_t2'), params);
    setForceGeneratedRewards(true);
    const graph = world('reward_tome_t2');
    const gen = drawSeededReward(graph, params);
    expect(gen.drawnTemplateId).toBe('reward_tome_t2');
    expect(gen.drawRoll).toBe(plain.drawRoll);
    expect(gen.generated?.itemId).toBe('gen_found_kael_30_reward_tome_t2');
    expect(gen.instantiation?.instanceId).toBe(gen.generated?.itemId);
    expect(gen.templateName).toBe(graph.getNode(gen.generated!.itemId)!.name);
    expect(gen.tier).toBe(2);
    // The authored clone was never made.
    expect(graph.getNode('reward_kael_30_reward_tome_t2')).toBeUndefined();
  });

  it('a bad-outcome draw never reaches the generator', () => {
    setForceGeneratedRewards(true);
    let bad = 0;
    for (let tick = 0; tick < 60; tick++) {
      const graph = world('reward_tome_t2');
      const d = drawSeededReward(graph, { ...params, tick, outcomeType: 'critical_failure' });
      if (!d.isBadOutcome) continue;
      bad++;
      expect(d.generated).toBeUndefined();
      expect(graph.getNodesByType('artifact').some(n => n.id.startsWith('gen_'))).toBe(false);
    }
    expect(bad).toBeGreaterThan(0);
  });

  it('an unsubstituted draw is exactly today\'s: same id shape, same clone', () => {
    setForceGeneratedRewards(true);
    const graph = world('reward_tome_t1');
    const d = drawSeededReward(graph, params);
    expect(d.generated).toBeUndefined();
    expect(d.instantiation?.instanceId).toBe('reward_kael_30_reward_tome_t1');
  });
});

describe('share 0 and the switch off leave the draw byte-identical to today (THR-1626)', () => {
  afterEach(() => { vi.doUnmock('../../../data/item-generator-tables'); vi.resetModules(); });

  async function drawWith(overrides: Record<string, unknown>) {
    vi.resetModules();
    vi.doMock('../../../data/item-generator-tables', async (orig) => ({ ...(await orig<object>()), ...overrides }));
    const pool = await import('../../rewardPool');
    const graph = world('reward_tome_t2');
    const d = pool.drawSeededReward(graph, { recipe: recipe(), outcomeType: 'success', seed: 42, tick: 30, actorId: 'kael', templateId: 'encounter.test' });
    return { d, ids: graph.getNodesByType('artifact').map(n => n.id).sort() };
  }

  async function today() {
    const graph = world('reward_tome_t2');
    const d = drawSeededReward(graph, { recipe: recipe(), outcomeType: 'success', seed: 42, tick: 30, actorId: 'kael', templateId: 'encounter.test' });
    // What the pool hands over without this ticket: the authored clone.
    const ref = world('reward_tome_t2');
    instantiateReward(ref, d.drawnTemplateId!, 'kael', 30);
    return { drawRoll: d.drawRoll, ids: ref.getNodesByType('artifact').map(n => n.id).sort() };
  }

  it.each([
    ['share 0', { GENERATED_REWARD_SHARE_BY_BAND: { 1: 0, 2: 0, 3: 0, 4: 0 } }],
    ['ITEM_GEN_REWARD_ENABLED = false', { ITEM_GEN_REWARD_ENABLED: false }],
  ])('%s', async (_label, overrides) => {
    const ref = await today();
    const { d, ids } = await drawWith(overrides);
    expect(d.generated).toBeUndefined();
    expect(d.drawRoll).toBe(ref.drawRoll);
    expect(d.instantiation?.instanceId).toBe('reward_kael_30_reward_tome_t2');
    expect(ids).toEqual(ref.ids);
  });
});

describe('the generator learns requiredTags (THR-1626)', () => {
  it('requiredTags absent or empty → identical items to today, both origins, every gate seed', () => {
    for (const seed of ITEM_GEN_GATE_SEEDS) {
      for (const origin of ITEM_GEN_ORIGINS) {
        for (const band of bandsForOrigin(origin)) {
          const w = reviewWorldContext(origin === 'masterwork' ? REVIEW_MAKERS[seed % REVIEW_MAKERS.length] : null);
          const base = { seedKey: `gen_item:${seed}:${origin}:${band}`, band, origin, world: w };
          expect(JSON.stringify(generateItem({ ...base, requiredTags: [] }))).toBe(JSON.stringify(generateItem(base)));
        }
      }
    }
  });

  it('requiredTags [#gold] → every item the generator returns carries #gold', () => {
    const missing: string[] = [];
    for (let k = 0; k < 60; k++) {
      for (const band of [2, 3] as const) {
        const r = generateValidItem({ seedKey: `gen_item:gold:${k}:${band}`, band, origin: 'found', world: reviewWorldContext(null), requiredTags: ['#gold'] });
        if (r.ok && !r.item.tags.includes('#gold')) missing.push(`${r.item.coreId}/${r.item.signatureId} b${band}: ${r.item.tags.join(' ')}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('coreTagReach never under-promises: every generated item\'s tags fall inside its core\'s reach', () => {
    const outside: string[] = [];
    for (const core of ITEM_GEN_CORES) {
      for (const origin of core.origins) {
        for (const band of core.bands.filter(b => bandsForOrigin(origin).includes(b)) as ItemGenBand[]) {
          for (let k = 0; k < 24; k++) {
            const w = reviewWorldContext(origin === 'masterwork' ? REVIEW_MAKERS[k % REVIEW_MAKERS.length] : null);
            const item = generateItem({ seedKey: `gen_item:reach:${core.id}:${origin}:${band}:${k}`, band, origin, world: w, coreId: core.id });
            if (!item) continue;
            const reach = coreTagReach(core);
            for (const t of item.tags) if (!reach.has(t)) outside.push(`${core.id}: ${t}`);
          }
        }
      }
    }
    expect([...new Set(outside)].sort()).toEqual([]);
  });
});
