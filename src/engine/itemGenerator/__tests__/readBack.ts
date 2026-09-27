/**
 * The engine read-back — mint a generated item into a small world and ask the REAL
 * engine readers whether each promise it makes is kept (THR-1570).
 *
 * Ported from the THR-1236 prototype's `engine-check.mjs`. The world: a bearer, an ally
 * of the same faction and a rival of another, all in a village held by a third faction
 * (so an ordinary step is neither wilderness nor home ground). The rival carries an
 * ordinary charm, so a suppress effect has something to silence.
 *
 * For every effect the item carries, the matching production reader is called and must
 * see exactly what the item claims — and a situational bonus must be *off* on an
 * ordinary step and *on* in its situation, or it is a passive in disguise.
 */

import { WorldGraph } from '../../graph';
import { resolveEffectModifiers, collectTestShapers, collectPreventLossEffects } from '../../effectResolver';
import {
  collectStatContributions, getActiveRuleOverride, getRangeModifiers, getRevealRanges, getBehaviorWeights,
  computeBehaviorWeightMultiplier, getActionGates, getSocialModifiers, computeSocialCooperationBias, isImmuneToAnyTag,
} from '../../effects/effectQueries';
import { collectAttachmentEffects } from '../../effects/effectWalker';
import { buildPredicateContext } from '../../effects/effectPredicates';
import { checkAndFireActionTriggers } from '../../effects/actionTrigger';
import { tickEffects } from '../../effectTick';
import { processEffectEvent } from '../../effects/effectEvents';
import { applySuppressions } from '../../effects/effectSuppression';
import { collectAuraEffectsNear, resolveAuraModifiers, resolveAgentPosition } from '../../effectAura';
import { spendConsumableCharges } from '../../effects/consumableCharges';
import { computeEffectiveSlotCaps } from '../../attachmentSlotResolver';
import { EFFECT_MODIFIER_CAP } from '../../../data/effect-constants';
import { SLOT_CAPS } from '../../../data/attachment-slot-constants';
import { ITEM_HONEST_SITUATIONS } from '../../../data/item-honest-vocabulary';
import { ARTIFACT_STORIED_TRAIT_ID } from '../../../data/artifact-trait-content';
import { mintGeneratedItem, storiedStartLevel } from '../mintGeneratedItem';
import { knownConditions } from '../validateGeneratedItem';
import type { GeneratedItem } from '../types';
import type { ReachDomain } from '../../../types/traits';
import type { AttachmentEffect } from '../../../types/effects';
import type { EffectRuntimeState } from '../../../types/effects';

const REACHES: readonly ReachDomain[] = ['iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star'];
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const noStates = (): Map<string, EffectRuntimeState> => new Map();

export const READBACK_ITEM_ID = 'gen_readback_item';

/** The three-mortal test world, with the item minted onto the bearer the real way. */
export function readBackWorld(item: GeneratedItem): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'loc_here', type: 'location', name: 'loc_here', properties: { hexCol: 5, hexRow: 5, locationType: 'village', locationSubtype: 'village', controllingFactionId: 'fac_c' } });
  const profile = { mercy_ruthlessness: 0, asceticism_extravagance: 0, honesty_cunning: 0, tradition_novelty: 0, loyalty_ambition: 0, revelation_discretion: 0, preservation_transformation: 0, sacrifice_survival: 0, courage_prudence: 0 };
  const agent = (id: string, factionId: string) => {
    g.addNode({ id, type: 'actor', name: id, properties: { actorType: 'individual', factionId, quintessence: 0.8, quintessenceMax: 1.0, essence: 0, doom: 0, axiologicalProfile: { ...profile } } });
    g.addEdge({ id: `loc_${id}`, source: id, target: 'loc_here', type: 'located_at', properties: {} });
  };
  agent('bearer', 'fac_a'); agent('ally', 'fac_a'); agent('rival', 'fac_b');
  g.addNode({ id: 'fac_a', type: 'actor', name: 'Faction A', properties: { actorType: 'faction' } });
  g.addNode({ id: 'fac_b', type: 'actor', name: 'Faction B', properties: { actorType: 'faction' } });
  g.addNode({ id: 'fac_c', type: 'actor', name: 'Faction C', properties: { actorType: 'faction' } });
  g.addNode({ id: 'rival_charm', type: 'artifact', name: 'Rival charm', properties: { tier: 1, subcategory: 'relics_talismans', tags: ['#trinket'], effects: [{ type: 'passive', reach: 'iron', value: 0.03 }] } });
  g.addEdge({ id: 'possesses_rival_charm', source: 'rival', target: 'rival_charm', type: 'possesses', properties: { modifiers: {}, tags: [] } });
  const id = mintGeneratedItem(g, item, { id: READBACK_ITEM_ID, tick: 1, holderId: 'bearer', makerId: item.origin === 'masterwork' ? 'ally' : null });
  if (!id) throw new Error(`read-back world: could not mint ${item.name}`);
  return g;
}

export interface ReadBackResult { readonly ok: boolean; readonly checks: number; readonly failures: string[] }

/** Read every promise the item makes back through the real engine. */
export function readBack(item: GeneratedItem): ReadBackResult {
  const failures: string[] = [];
  let checks = 0;
  const ok = (cond: boolean, msg: string) => { checks++; if (!cond) failures.push(msg); };
  const g = readBackWorld(item);
  const node = g.getNode(READBACK_ITEM_ID);
  const effects = (node?.properties.effects ?? []) as AttachmentEffect[];

  ok(effects.length === item.effects.length, `node carries ${effects.length} of ${item.effects.length} effects`);
  const walked = collectAttachmentEffects(g, 'bearer').filter(w => w.attachmentId === READBACK_ITEM_ID);
  ok(walked.length === effects.length, `walker read ${walked.length} of ${effects.length} effects`);

  const storied = g.getEdge(`e.has_trait.${READBACK_ITEM_ID}.${ARTIFACT_STORIED_TRAIT_ID}`);
  ok(!!storied, 'born without the Storied trait');
  ok(((storied?.properties as { level?: number } | undefined)?.level ?? 1) === storiedStartLevel(item), `Storied level ${(storied?.properties as { level?: number } | undefined)?.level} vs ${storiedStartLevel(item)}`);

  const ordinaryCtx = (reach: ReachDomain) => buildPredicateContext(g, 'bearer', reach);

  for (const e of effects) {
    switch (e.type) {
      case 'passive': {
        const got = resolveEffectModifiers(g, 'bearer', e.reach, ordinaryCtx(e.reach)).contributions.filter(x => x.effectType === 'passive').map(x => x.value);
        ok(got.some(v => near(v, e.value)), `passive ${e.reach}: engine uses ${JSON.stringify(got)} but the item claims ${e.value}`);
        break;
      }
      case 'conditional': {
        const cond = String(e.condition);
        const sum = (c: ReturnType<typeof buildPredicateContext>) => resolveEffectModifiers(g, 'bearer', e.reach, c).contributions
          .filter(x => x.effectType === 'conditional' && (x as { conditional?: string }).conditional === cond).reduce((t, x) => t + x.value, 0);
        const ordinary = ordinaryCtx(e.reach);
        if (cond === 'in_combat') {
          const fight = buildPredicateContext(g, 'bearer', e.reach, 'combat');
          ok(near(sum(fight), e.value), `in a fight step of ${e.reach} the engine uses ${sum(fight)} but the item claims ${e.value}`);
          ok(near(sum(ordinary), 0), `fires on every ordinary ${e.reach} step too — a passive in disguise`);
        } else if (cond.startsWith('lacks_trait:')) {
          ok(near(sum(ordinary), e.value), `penalty not applied to an unworthy bearer (${sum(ordinary)})`);
          const worthy = { ...ordinary, agentTraits: new Set([...ordinary.agentTraits, cond.slice('lacks_trait:'.length)]) };
          ok(near(sum(worthy), 0), `penalty also applied to a worthy bearer (${sum(worthy)})`);
        } else if (cond.startsWith('has_trait:')) {
          ok(near(sum(ordinary), 0), 'fires without the trait');
          const worthy = { ...ordinary, agentTraits: new Set([...ordinary.agentTraits, cond.slice('has_trait:'.length)]) };
          ok(near(sum(worthy), e.value), `with the trait the engine uses ${sum(worthy)} but the item claims ${e.value}`);
        } else {
          ok(near(sum(ordinary), 0), `fires on an ordinary ${e.reach} step with no ${cond} — a passive in disguise`);
          const flag = ITEM_HONEST_SITUATIONS[cond as keyof typeof ITEM_HONEST_SITUATIONS];
          ok(!!flag, `no situational flag known for ${cond}`);
          if (flag) {
            const on = { ...ordinary, [flag]: true, ...(flag === 'outnumbered' ? { enemyCount: 3 } : {}) };
            ok(near(sum(on), e.value), `when ${cond} holds the engine uses ${sum(on)} but the item claims ${e.value}`);
          }
        }
        break;
      }
      case 'stat_contribution': {
        const got = collectStatContributions(node);
        for (const [r, v] of Object.entries(e.contributions)) ok(near(got[r as ReachDomain] ?? 0, v ?? 0), `stat ${r}: engine ${got[r as ReachDomain]} vs ${v}`);
        break;
      }
      case 'test_shaper': ok(collectTestShapers(g, 'bearer', (e.reach as ReachDomain | undefined) ?? 'iron', ordinaryCtx('iron')).length > 0, 'test_shaper not collected'); break;
      case 'prevent_loss':
        ok(collectPreventLossEffects(g, 'bearer', 'quintessence', ordinaryCtx('iron')).some(p => near((p as { amount?: number }).amount ?? -1, (e as { amount?: number }).amount ?? -2) && !!(p as { consumeOnPrevent?: boolean }).consumeOnPrevent === !!e.consumeOnPrevent), 'prevent_loss not collected');
        break;
      case 'tag_immunity': {
        const norm = (t: string) => t.replace(/^#/, '');
        const wanted = e.tags.map(norm);
        const targets = knownConditions().filter(c => c.tags.some(t => wanted.includes(norm(t))));
        ok(targets.length > 0, `tag_immunity ${e.tags.join(',')} blocks no real condition`);
        for (const c of targets) ok(isImmuneToAnyTag(g, 'bearer', c.tags) !== null, `not immune to ${c.name}`);
        const unrelated = knownConditions().find(c => !c.tags.some(t => wanted.includes(norm(t))));
        if (unrelated) ok(isImmuneToAnyTag(g, 'bearer', unrelated.tags) === null, `over-broad immunity also blocks ${unrelated.name}`);
        break;
      }
      case 'reveal': {
        const got = getRevealRanges(g, 'bearer')[e.target as 'hexes' | 'encounters'];
        ok(got === e.range, `reveal ${e.target} range ${got} vs ${e.range}`);
        break;
      }
      case 'range_modifier': {
        const rm = getRangeModifiers(g, 'bearer');
        if (e.movementCostMultiplier) ok(near(rm.movementCostMultiplier, e.movementCostMultiplier), `movement ×${rm.movementCostMultiplier}`);
        if (e.awarenessRangeBonus) ok(rm.awarenessRangeBonus === e.awarenessRangeBonus, `awareness +${rm.awarenessRangeBonus}`);
        break;
      }
      case 'modify_rules': {
        const v = getActiveRuleOverride(g, 'bearer', e.rule);
        if (typeof e.value === 'boolean') ok(v === 1, `${e.rule} reads ${v}`);
        else ok(near(v, e.value as number), `${e.rule} reads ${v} vs ${String(e.value)}`);
        break;
      }
      case 'aura': {
        const pos = resolveAgentPosition(g, 'ally');
        const auras = pos ? collectAuraEffectsNear(g, pos) : [];
        const got = pos ? (resolveAuraModifiers(g, auras, 'ally', pos) as Partial<Record<ReachDomain, number>>)[e.reach as ReachDomain] ?? 0 : 0;
        ok(got > 0 === e.value > 0 && Math.abs(got) > 0, `aura on the ally reads ${got}`);
        break;
      }
      case 'behavior_weight': ok(near(computeBehaviorWeightMultiplier(getBehaviorWeights(g, 'bearer'), e.reach), e.multiplier), 'behavior_weight not read'); break;
      case 'social_modifier': {
        const rel = e.targetFilter === 'any' ? 'ally' : e.targetFilter;
        ok(near(computeSocialCooperationBias(getSocialModifiers(g, 'bearer'), rel as 'ally'), e.cooperationBias), `social ${e.targetFilter} not read`);
        break;
      }
      case 'action_gate': ok(getActionGates(g, 'bearer').blocked.includes(e.reach), `action_gate ${e.reach} not read`); break;
      case 'axiological_drift': case 'resource_manipulate': case 'hex_effect': case 'cooldown': {
        const g2 = readBackWorld(item);
        const before = structuredClone(g2.getNode('bearer')!.properties) as { axiologicalProfile: Record<string, number>; quintessence: number };
        const res = tickEffects(g2, 'bearer', 10, noStates());
        const after = g2.getNode('bearer')!.properties as { axiologicalProfile: Record<string, number>; quintessence: number };
        if (e.type === 'axiological_drift') ok(after.axiologicalProfile[e.axis] !== before.axiologicalProfile[e.axis], `drift on ${e.axis} did not move`);
        if (e.type === 'resource_manipulate') ok(e.amount < 0 ? after.quintessence < before.quintessence : after.quintessence > before.quintessence, `quintessence ${before.quintessence} -> ${after.quintessence}`);
        if (e.type === 'hex_effect') ok(res.hexMutations.some(m => (m as { field: string }).field === e.property && near((m as { delta: number }).delta, e.value as number)), 'hex_effect produced no hex mutation');
        if (e.type === 'cooldown') ok([...res.updatedStates.values()].some(s => (s as { cooldownActive?: boolean }).cooldownActive !== undefined), 'cooldown cycle not initialised');
        break;
      }
      case 'action_trigger': {
        const res = checkAndFireActionTriggers(collectAttachmentEffects(g, 'bearer'), e.on,
          { agentId: 'bearer', tick: 10, agentResources: { essence: 0, quintessence: 0.8, quintessenceMax: 1, doom: 0, doomThreshold: 100 }, nextRoll: () => 0, actorName: 'Bearer' } as never, noStates());
        ok(res.firedCount > 0, `action_trigger on ${e.on} did not fire`);
        if (e.payload.kind === 'resource_delta') ok(res.resourceDeltas.some(d => d.resource === (e.payload as { resource: string }).resource && d.after < d.before), 'resource_delta did not apply');
        else if (['condition_grant', 'condition_remove', 'self_remove'].includes(e.payload.kind)) ok(res.payloadIntents.some(p => (p as { payload: { kind: string } }).payload.kind === e.payload.kind), `${e.payload.kind} intent missing`);
        break;
      }
      case 'stacking': {
        const ev = e.stackOn === 'on_damaged' ? { type: 'damaged', amount: 0.5 } : { type: 'encounter_outcome', reach: 'iron', success: true };
        const res = processEffectEvent(g, 'bearer', ev as never, noStates(), 10, () => 0.5);
        ok([...res.updatedStates.values()].some(s => ((s as { stacks?: number }).stacks ?? 0) > 0), `stacking on ${e.stackOn} gained no stack`);
        break;
      }
      case 'suppress': {
        const res = applySuppressions(g, noStates(), 10, ['bearer', 'ally', 'rival']);
        ok((res.states.get('rival_charm') as { suppressed?: boolean } | undefined)?.suppressed === true, "the rival's charm was not silenced");
        ok((res.states.get(READBACK_ITEM_ID) as { suppressed?: boolean } | undefined)?.suppressed !== true, 'the stone silenced itself');
        break;
      }
      case 'consumable_charge': {
        const res = spendConsumableCharges(g, 'bearer', e.onUse.reach as ReachDomain, noStates(), 10);
        ok(res.spent === 1, `consumable charge spent ${res.spent}`);
        break;
      }
      case 'slot_bonus': {
        const caps = computeEffectiveSlotCaps(g, 'bearer') as Record<string, number>;
        ok((caps[e.slotTag] ?? 0) > ((SLOT_CAPS as Record<string, number>)[e.slotTag] ?? 0), 'slot_bonus not read');
        break;
      }
      default: ok(false, `no read-back for ${e.type}`);
    }
  }
  // Roll totals per reach stay inside the engine's clamp, so the words match the number used.
  for (const r of REACHES) {
    const total = resolveEffectModifiers(g, 'bearer', r, ordinaryCtx(r)).reachModifiers[r] ?? 0;
    ok(Math.abs(total) <= EFFECT_MODIFIER_CAP + 1e-9, `${r} total over cap`);
  }
  return { ok: failures.length === 0, checks, failures };
}
