// engine-check.mjs — THROWAWAY honesty check for the THR-1236 item-generator sketch.
//
// For every generated item, mint it into a small fixture graph with a bearer, an ally
// and a rival on the same hex, then ask the REAL engine functions (bundled read-only
// from the repo with its own esbuild) whether each claimed effect is actually read:
//   resolveEffectModifiers (roll modifiers per context), collectStatContributions,
//   getActiveRuleOverride, getRangeModifiers, getRevealRanges, getBehaviorWeights,
//   getActionGates, getSocialModifiers, isImmuneToAnyTag, collectTestShapers,
//   collectPreventLossEffects, checkAndFireActionTriggers, tickEffects,
//   processEffectEvent, applySuppressions, collectAuraEffectsNear/resolveAuraModifiers,
//   spendConsumableCharges, computeEffectiveSlotCaps.
//
// Writes ./engine-readback.json: { [itemId]: { ok, checks, failures[] } }.
// Usage: node engine-check.mjs [repoRoot]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.argv[2] ?? 'C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator').replace(/\\/g, '/');
const BUILD = join(HERE, '.build');
mkdirSync(BUILD, { recursive: true });
const src = (p) => `${REPO}/src/${p}`;

const entry = `
export { WorldGraph } from '${src('engine/graph')}';
export { resolveEffectModifiers, collectTestShapers, collectPreventLossEffects } from '${src('engine/effectResolver')}';
export { collectStatContributions, getActiveRuleOverride, getRangeModifiers, getRevealRanges, getBehaviorWeights,
  computeBehaviorWeightMultiplier, getActionGates, getSocialModifiers, computeSocialCooperationBias, isImmuneToAnyTag } from '${src('engine/effects/effectQueries')}';
export { collectAttachmentEffects } from '${src('engine/effects/effectWalker')}';
export { buildPredicateContext } from '${src('engine/effects/effectPredicates')}';
export { checkAndFireActionTriggers } from '${src('engine/effects/actionTrigger')}';
export { tickEffects } from '${src('engine/effectTick')}';
export { processEffectEvent } from '${src('engine/effects/effectEvents')}';
export { applySuppressions } from '${src('engine/effects/effectSuppression')}';
export { collectAuraEffectsNear, resolveAuraModifiers, resolveAgentPosition } from '${src('engine/effectAura')}';
export { spendConsumableCharges } from '${src('engine/effects/consumableCharges')}';
export { computeEffectiveSlotCaps } from '${src('engine/attachmentSlotResolver')}';
export { EFFECT_PER_ITEM_CAP, EFFECT_MODIFIER_CAP } from '${src('data/effect-constants')}';
`;
const entryPath = join(BUILD, 'check-entry.ts');
writeFileSync(entryPath, entry);
const require = createRequire(`${REPO}/package.json`);
const esbuild = require('esbuild');
const outfile = join(BUILD, 'engine.bundle.mjs');
await esbuild.build({
  entryPoints: [entryPath], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'warning',
  define: { 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) },
});
const E = await import(pathToFileURL(outfile).href);
const V = JSON.parse(readFileSync(join(HERE, 'world-vocab.json'), 'utf8'));
const ALL_CONDITIONS = [...V.AGENT_CONDITIONS, ...V.REWARD_CONDITIONS];
const norm = (t) => t.replace(/^#/, '');

const REACHES = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
function ctx(over = {}) {
  return {
    inCombat: false, inSocial: false, inExploration: false, inMystical: false,
    atHomeTerritory: false, inEnemyTerritory: false, inWilderness: false,
    healthLow: false, healthHigh: false, allyCount: 0, enemyCount: 0, alone: false, outnumbered: false,
    nearWater: false, biome: 'grassland', agentTraits: new Set(), reachValues: {}, factionRank: 0,
    hiddenMarkCategories: new Set(), intelCategories: new Set(), reputationScore: 0.5, controlledLocations: new Set(),
    ...over,
  };
}
const PRED_CTX = {
  in_combat: { inCombat: true }, in_social: { inSocial: true }, in_mystical: { inMystical: true },
  in_wilderness: { inWilderness: true }, alone: { alone: true }, outnumbered: { outnumbered: true, enemyCount: 3 },
  near_water: { nearWater: true }, at_home_territory: { atHomeTerritory: true }, health_low: { healthLow: true },
};
function predCtx(condition) {
  if (condition.startsWith('has_trait:')) return ctx({ agentTraits: new Set([condition.slice('has_trait:'.length)]) });
  if (condition.startsWith('lacks_trait:')) return ctx();
  return ctx(PRED_CTX[condition] ?? {});
}

function fixture(node) {
  const g = new E.WorldGraph();
  const addLoc = (id, col, row) => g.addNode({ id, type: 'location', name: id, properties: { hexCol: col, hexRow: row, locationType: 'village', locationSubtype: 'village', controllingFactionId: 'fac_c' } });
  addLoc('loc_here', 5, 5);
  const profile = { mercy_ruthlessness: 0, asceticism_extravagance: 0, honesty_cunning: 0, tradition_novelty: 0, loyalty_ambition: 0, revelation_discretion: 0, preservation_transformation: 0, sacrifice_survival: 0, courage_prudence: 0 };
  const agent = (id, factionId) => {
    g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual', factionId, quintessence: 0.8, quintessenceMax: 1.0, essence: 0, doom: 0, axiologicalProfile: { ...profile } } });
    g.addEdge({ id: `loc_${id}`, source: id, target: 'loc_here', type: 'located_at', properties: {} });
  };
  agent('bearer', 'fac_a'); agent('ally', 'fac_a'); agent('rival', 'fac_b');
  g.addNode({ id: 'fac_a', type: 'actor', name: 'Faction A', properties: { actorType: 'faction' } });
  g.addNode({ id: 'fac_b', type: 'actor', name: 'Faction B', properties: { actorType: 'faction' } });
  g.addEdge({ id: 'rivalry', source: 'fac_a', target: 'fac_b', type: 'rival_of', properties: {} });
  // A third faction holds the village, so an ordinary step is not wilderness and not home ground
  // (the engine counts any uncontrolled place as wilderness — effectPredicates.buildPredicateContext).
  g.addNode({ id: 'fac_c', type: 'actor', name: 'Faction C', properties: { actorType: 'faction' } });
  // The rival carries an ordinary charm, so a suppress effect has something to silence.
  g.addNode({ id: 'rival_charm', type: 'artifact', name: 'Rival charm', properties: { tier: 1, subcategory: 'relics_talismans', tags: ['#trinket'], effects: [{ type: 'passive', reach: 'iron', value: 0.03 }] } });
  g.addEdge({ id: 'possesses_rival_charm', source: 'rival', target: 'rival_charm', type: 'possesses', properties: { modifiers: {}, tags: [] } });
  // The generated item itself, minted the two-call way THR-1234 describes (addNode + an edge).
  g.addNode({ id: node.id, type: node.type, name: node.name, properties: structuredClone(node.properties) });
  g.addEdge({ id: `own_${node.id}`, source: 'bearer', target: node.id, type: node.type === 'artifact_legendary' ? 'bonded_to' : 'possesses', properties: { modifiers: {}, tags: [] } });
  return g;
}

const near = (a, b) => Math.abs(a - b) < 1e-9;

function check(node) {
  const failures = []; let checks = 0;
  const ok = (cond, msg) => { checks++; if (!cond) failures.push(msg); };
  const effects = node.properties.effects;
  const g = fixture(node);
  const walked = E.collectAttachmentEffects(g, 'bearer');
  ok(walked.length === effects.length, `walker read ${walked.length} of ${effects.length} effects`);

  const neutralRes = Object.fromEntries(REACHES.map(r => [r, E.resolveEffectModifiers(g, 'bearer', r, ctx())]));
  const neutral = Object.fromEntries(REACHES.map(r => [r, neutralRes[r].reachModifiers[r] ?? 0]));

  for (const e of effects) {
    switch (e.type) {
      case 'passive': {
        const got = neutralRes[e.reach].contributions.filter(x => x.effectType === 'passive').map(x => x.value);
        ok(got.some(v => near(v, e.value)), `passive ${e.reach}: engine uses ${JSON.stringify(got)} but the item claims ${e.value}`);
        break;
      }
      case 'conditional': {
        // Judge it the way the game does: the engine's own predicate context for an
        // ordinary step of this reach, and for a fight exchange (encounterType 'combat').
        const sum = (c) => E.resolveEffectModifiers(g, 'bearer', e.reach, c).contributions
          .filter(x => x.effectType === 'conditional' && x.conditional === e.condition).reduce((t, x) => t + x.value, 0);
        const ordinary = E.buildPredicateContext(g, 'bearer', e.reach);
        const fight = E.buildPredicateContext(g, 'bearer', e.reach, 'combat');
        if (e.condition === 'in_combat') {
          ok(near(sum(fight), e.value), `in a fight step of ${e.reach} the engine uses ${sum(fight)} but the item claims ${e.value}`);
          ok(near(sum(ordinary), 0), `fires on every ordinary ${e.reach} step too — a passive in disguise`);
        } else if (e.condition.startsWith('lacks_trait:')) {
          ok(near(sum(ordinary), e.value), `penalty not applied to an unworthy bearer (${sum(ordinary)})`);
          const worthy = { ...ordinary, agentTraits: new Set([...ordinary.agentTraits, e.condition.slice('lacks_trait:'.length)]) };
          ok(near(sum(worthy), 0), `penalty also applied to a worthy bearer (${sum(worthy)})`);
        } else if (e.condition.startsWith('has_trait:')) {
          ok(near(sum(ordinary), 0), 'fires without the trait');
          const worthy = { ...ordinary, agentTraits: new Set([...ordinary.agentTraits, e.condition.slice('has_trait:'.length)]) };
          ok(near(sum(worthy), e.value), `with the trait the engine uses ${sum(worthy)} but the item claims ${e.value}`);
        } else {
          ok(near(sum(ordinary), 0), `fires on an ordinary ${e.reach} step with no ${e.condition} — a passive in disguise`);
          const flag = { in_wilderness: 'inWilderness', alone: 'alone', outnumbered: 'outnumbered', near_water: 'nearWater', at_home_territory: 'atHomeTerritory', health_low: 'healthLow' }[e.condition];
          ok(!!flag, `no situational flag known for ${e.condition}`);
          if (flag) ok(near(sum({ ...ordinary, [flag]: true }), e.value), `when ${e.condition} holds the engine uses ${sum({ ...ordinary, [flag]: true })} but the item claims ${e.value}`);
        }
        break;
      }
      case 'stat_contribution': {
        const got = E.collectStatContributions(g.getNode(node.id));
        for (const [r, v] of Object.entries(e.contributions)) ok(near(got[r] ?? 0, v), `stat ${r}: engine ${got[r]} vs ${v}`);
        break;
      }
      case 'test_shaper': ok(E.collectTestShapers(g, 'bearer', e.reach ?? 'iron', ctx()).length > 0, 'test_shaper not collected'); break;
      case 'prevent_loss': ok(E.collectPreventLossEffects(g, 'bearer', 'quintessence', ctx()).some(p => near(p.amount ?? -1, e.amount) && p.consumeOnPrevent === !!e.consumeOnPrevent), 'prevent_loss not collected'); break;
      case 'tag_immunity': {
        const targets = ALL_CONDITIONS.filter(cnd => cnd.tags.some(t => e.tags.map(norm).includes(norm(t))));
        ok(targets.length > 0, `tag_immunity ${e.tags} blocks no real condition`);
        for (const cnd of targets) ok(E.isImmuneToAnyTag(g, 'bearer', cnd.tags) !== null, `not immune to ${cnd.name}`);
        const unrelated = ALL_CONDITIONS.find(cnd => !cnd.tags.some(t => e.tags.map(norm).includes(norm(t))));
        if (unrelated) ok(E.isImmuneToAnyTag(g, 'bearer', unrelated.tags) === null, `over-broad immunity also blocks ${unrelated.name}`);
        break;
      }
      case 'reveal': ok(E.getRevealRanges(g, 'bearer')[e.target] === e.range, `reveal ${e.target} range ${E.getRevealRanges(g, 'bearer')[e.target]} vs ${e.range}`); break;
      case 'range_modifier': {
        const rm = E.getRangeModifiers(g, 'bearer');
        if (e.movementCostMultiplier) ok(near(rm.movementCostMultiplier, e.movementCostMultiplier), `movement ×${rm.movementCostMultiplier}`);
        if (e.awarenessRangeBonus) ok(rm.awarenessRangeBonus === e.awarenessRangeBonus, `awareness +${rm.awarenessRangeBonus}`);
        break;
      }
      case 'modify_rules': {
        const v = E.getActiveRuleOverride(g, 'bearer', e.rule);
        if (typeof e.value === 'boolean') ok(v === 1, `${e.rule} reads ${v}`);
        else ok(near(v, e.value), `${e.rule} reads ${v} vs ${e.value}`);
        break;
      }
      case 'aura': {
        const pos = E.resolveAgentPosition(g, 'ally');
        const auras = E.collectAuraEffectsNear(g, pos);
        const got = E.resolveAuraModifiers(g, auras, 'ally', pos)[e.reach] ?? 0;
        ok(got > 0 === e.value > 0 && Math.abs(got) > 0, `aura on the ally reads ${got}`);
        break;
      }
      case 'behavior_weight': ok(near(E.computeBehaviorWeightMultiplier(E.getBehaviorWeights(g, 'bearer'), e.reach), e.multiplier), 'behavior_weight not read'); break;
      case 'social_modifier': {
        const rel = e.targetFilter === 'any' ? 'ally' : e.targetFilter;
        ok(near(E.computeSocialCooperationBias(E.getSocialModifiers(g, 'bearer'), rel), e.cooperationBias), `social ${e.targetFilter} not read`);
        break;
      }
      case 'action_gate': ok(E.getActionGates(g, 'bearer').blocked.includes(e.reach), `action_gate ${e.reach} not read`); break;
      case 'axiological_drift': case 'resource_manipulate': case 'hex_effect': case 'cooldown': {
        const g2 = fixture(node);
        const before = structuredClone(g2.getNode('bearer').properties);
        const res = E.tickEffects(g2, 'bearer', 10, new Map());
        const after = g2.getNode('bearer').properties;
        if (e.type === 'axiological_drift') ok(after.axiologicalProfile[e.axis] !== before.axiologicalProfile[e.axis], `drift on ${e.axis} did not move`);
        if (e.type === 'resource_manipulate') ok(after.quintessence < before.quintessence, `quintessence ${before.quintessence} -> ${after.quintessence}`);
        if (e.type === 'hex_effect') ok(res.hexMutations.some(m => m.field === e.property && near(m.delta, e.value)), 'hex_effect produced no hex mutation');
        if (e.type === 'cooldown') ok([...res.updatedStates.values()].some(s => s.cooldownActive !== undefined), 'cooldown cycle not initialised');
        break;
      }
      case 'action_trigger': {
        const res = E.checkAndFireActionTriggers(E.collectAttachmentEffects(g, 'bearer'), e.on,
          { agentId: 'bearer', tick: 10, agentResources: { essence: 0, quintessence: 0.8, quintessenceMax: 1, doom: 0, doomThreshold: 100 }, nextRoll: () => 0, actorName: 'Bearer' }, new Map());
        ok(res.firedCount > 0, `action_trigger on ${e.on} did not fire`);
        if (e.payload.kind === 'resource_delta') ok(res.resourceDeltas.some(d => d.resource === e.payload.resource && d.after < d.before), 'resource_delta did not apply');
        else if (['condition_grant', 'condition_remove', 'self_remove'].includes(e.payload.kind)) ok(res.payloadIntents.some(p => p.payload.kind === e.payload.kind), `${e.payload.kind} intent missing`);
        break;
      }
      case 'stacking': {
        const ev = e.stackOn === 'on_damaged' ? { type: 'damaged', amount: 0.5 } : { type: 'encounter_outcome', reach: 'iron', success: true };
        const res = E.processEffectEvent(g, 'bearer', ev, new Map(), 10, () => 0.5);
        ok([...res.updatedStates.values()].some(s => (s.stacks ?? 0) > 0), `stacking on ${e.stackOn} gained no stack`);
        break;
      }
      case 'suppress': {
        const res = E.applySuppressions(g, new Map(), 10, ['bearer', 'ally', 'rival']);
        ok(res.states.get('rival_charm')?.suppressed === true, "the rival's charm was not silenced");
        ok(res.states.get(node.id)?.suppressed !== true, 'the stone silenced itself');
        break;
      }
      case 'consumable_charge': {
        const res = E.spendConsumableCharges(g, 'bearer', e.onUse.reach, new Map(), 10);
        ok(res.spent === 1, `consumable charge spent ${res.spent}`);
        break;
      }
      case 'slot_bonus': ok(E.computeEffectiveSlotCaps(g, 'bearer')[e.slotTag] > V.SLOT_CAPS[e.slotTag], 'slot_bonus not read'); break;
      default: ok(false, `no read-back for ${e.type}`);
    }
  }
  // Roll totals per reach stay inside the engine's clamp, so the words match the number used.
  for (const r of REACHES) ok(Math.abs(neutral[r]) <= E.EFFECT_MODIFIER_CAP + 1e-9, `${r} total over cap`);
  return { ok: failures.length === 0, checks, failures };
}

const files = ['items-seed42.json', 'items-seed7.json', 'items-free42.json'].filter(f => existsSync(join(HERE, f)));
const out = {};
let total = 0, bad = 0, checks = 0;
for (const f of files) {
  for (const node of JSON.parse(readFileSync(join(HERE, f), 'utf8'))) {
    const r = check(node);
    out[node.id] = r; total++; checks += r.checks;
    if (!r.ok) { bad++; console.log(`✗ ${node.name}: ${r.failures.join('; ')}`); }
  }
}
writeFileSync(join(HERE, 'engine-readback.json'), JSON.stringify(out, null, 2));
console.log(`engine read-back: ${total - bad}/${total} items clean, ${checks} checks`);
