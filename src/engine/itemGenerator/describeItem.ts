/**
 * `describeItem` — what a generated item does and what it costs, in words (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Systems design and
 * § UI pillar. Ported from the THR-1236 prototype (`generator.mjs:1351-1490`).
 *
 * **No numerals** (UI Law 13): magnitudes are *a little / noticeably / much / far*,
 * skill is *a touch / somewhat / a good deal*, time is days not ticks, chance is *about
 * one time in four*. Pure over `effects[]`, so the sheet derives the words at render and
 * they never go stale when tier advancement rescales an effect.
 */

import type { AttachmentEffect } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import { CANONICAL_AXES } from '../../types/axisRegistry';
import { ITEM_GEN_REACH_BLOCK, ITEM_GEN_REACH_DO, ITEM_GEN_TICKS_PER_DAY } from '../../data/item-generator-tables';
import { conditionsBlockedBy, knownConditions } from './validateGeneratedItem';

/** Roll-modifier word boundaries (NFP #1). */
export const DESCRIBE_ROLL_WORD_BOUNDS = { little: 0.03, noticeably: 0.06, much: 0.10 } as const;
/** Skill (stat contribution) word boundaries. */
export const DESCRIBE_STAT_WORD_BOUNDS = { touch: 0.3, somewhat: 0.6, goodDeal: 1.0 } as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const REACH_NAME: Record<ReachDomain, string> = { iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil', heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star' };

const rollWord = (v: number) => { const a = Math.abs(v); const b = DESCRIBE_ROLL_WORD_BOUNDS; return a <= b.little ? 'a little' : a <= b.noticeably ? 'noticeably' : a <= b.much ? 'much' : 'far'; };
const statWord = (v: number) => { const a = Math.abs(v); const b = DESCRIBE_STAT_WORD_BOUNDS; return a <= b.touch ? 'a touch' : a <= b.somewhat ? 'somewhat' : a <= b.goodDeal ? 'a good deal' : 'far'; };
const days = (ticks: number) => { const d = ticks / ITEM_GEN_TICKS_PER_DAY; if (d <= 0.5) return 'half a day'; if (d <= 1) return 'a day'; return `${NUM[Math.round(d)] ?? 'several'} days`; };
const chanceWords = (p: number) => (p >= 1 ? 'every time' : p >= 0.5 ? 'half the time' : p >= 0.4 ? 'often' : p >= 0.3 ? 'about one time in three' : p >= 0.25 ? 'about one time in four' : p >= 0.2 ? 'about one time in five' : 'now and then');
const hexes = (n: number) => `${NUM[n] ?? 'several'} ${n === 1 ? 'hex' : 'hexes'}`;
const PRED: Record<string, string> = {
  in_combat: 'in a fight', in_social: 'face to face with people', in_mystical: 'when dealing with magic or the unseen',
  in_wilderness: 'out in the wilds', alone: 'when working alone', outnumbered: 'when outnumbered', near_water: 'near water',
  at_home_territory: 'on home ground', health_low: 'when badly worn down',
};
const reachDo = (r: ReachDomain) => `${ITEM_GEN_REACH_DO[r]} (${REACH_NAME[r]})`;
const listWords = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

function virtueWord(traitId: string): string {
  const m = /core_(\w+)\.virtue/.exec(traitId);
  const words: Record<string, string> = { integrity: 'True', warmth: 'Warm', hope: 'Hopeful', forgiveness: 'Forgiving', humility: 'Humble' };
  return (m && words[m[1]]) ?? 'worthy';
}

export interface ItemDescription {
  /** One plain sentence per boon (a passive folds its same-reach skill and situational bonus in). */
  readonly does: readonly string[];
  /** One plain sentence per catch, then the catch notes. */
  readonly catches: readonly string[];
}

/** Describe a generated item's effects. `catchIndexes` split the catch from the boon. */
export function describeItem(effects: readonly AttachmentEffect[], catchIndexes: readonly number[] = [], catchNotes: readonly string[] = []): ItemDescription {
  const does: string[] = [];
  const catches: string[] = [];
  const catchSet = new Set(catchIndexes);
  const entries = effects.map((effect, i) => ({ effect, role: catchSet.has(i) ? 'catch' as const : 'boon' as const }));
  // Passives first, so a same-reach skill or situational bonus folds into their sentence.
  const E = [...entries].sort((a, b) => Number(isPositivePassive(b.effect)) - Number(isPositivePassive(a.effect)));
  const used = new Set<number>();
  const push = (role: 'boon' | 'catch', s: string) => { if (s) (role === 'catch' ? catches : does).push(s); };

  for (let i = 0; i < E.length; i++) {
    if (used.has(i)) continue;
    const { effect: e, role } = E[i];
    if (e.type === 'passive' && e.value > 0) {
      let s = `Its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}`;
      const j = E.findIndex((p, k) => !used.has(k) && k !== i && p.role === role && p.effect.type === 'stat_contribution' && ((p.effect.contributions as Partial<Record<ReachDomain, number>>)[e.reach] ?? 0) > 0);
      if (j >= 0) {
        used.add(j);
        const v = (E[j].effect as { contributions: Partial<Record<ReachDomain, number>> }).contributions[e.reach] ?? 0;
        s += `, and ${statWord(v)} more skilled at it for as long as they carry it${v > 1.0 ? ' — a lift big enough to show on their sheet' : ''}`;
      }
      const k2 = E.findIndex((p, k) => !used.has(k) && k !== i && p.role === role && p.effect.type === 'conditional' && p.effect.value > 0 && p.effect.reach === e.reach && PRED[p.effect.condition]);
      if (k2 >= 0) {
        used.add(k2);
        const ce = E[k2].effect as { condition: string; value: number };
        s += ce.condition === 'in_combat' && e.reach === 'iron' ? `. Once a fight starts, ${rollWord(ce.value)} better again` : `. ${cap(PRED[ce.condition])}, ${rollWord(ce.value)} better again`;
      }
      push(role, `${s}.`);
      used.add(i);
      continue;
    }
    push(role, sentence(e));
    used.add(i);
  }
  for (const n of catchNotes) catches.push(n);
  return { does, catches };
}

function isPositivePassive(e: AttachmentEffect): boolean {
  return e.type === 'passive' && e.value > 0;
}

/** One effect, one sentence. Exported for the review report. */
export function describeEffect(e: AttachmentEffect): string {
  return sentence(e);
}

function sentence(e: AttachmentEffect): string {
  switch (e.type) {
    case 'passive': return e.value > 0 ? `Its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}.` : `Its bearer is ${rollWord(e.value)} worse at ${reachDo(e.reach)}.`;
    case 'stat_contribution': {
      const contributions = e.contributions as Partial<Record<ReachDomain, number>>;
      const parts = (Object.entries(contributions) as [ReachDomain, number][]).map(([r, v]) => (v > 0 ? `${statWord(v)} more skilled at ${reachDo(r)}` : `${statWord(v)} less skilled at ${reachDo(r)}`));
      const big = Object.values(contributions).some(v => Math.abs(v ?? 0) > 1.0);
      return `Carrying it makes its bearer ${parts.join(' and ')}${big ? ' — a lift big enough to show on their sheet' : ''}.`;
    }
    case 'conditional': {
      const c = String(e.condition);
      if (c.startsWith('has_trait:')) return `In the hands of someone ${virtueWord(c.slice('has_trait:'.length))}, its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)} still.`;
      if (c.startsWith('lacks_trait:')) return `Anyone who is not ${virtueWord(c.slice('lacks_trait:'.length))} finds it works against them: they are ${rollWord(e.value)} worse at ${reachDo(e.reach)} while they carry it.`;
      if (c === 'in_combat' && e.reach === 'iron') return `Once a fight starts, its bearer's odds are ${rollWord(e.value)} better.`;
      if (c === 'in_combat' && e.reach === 'heart') return `Once a fight starts, its bearer's nerve holds ${rollWord(e.value)} better.`;
      if (c === 'in_combat') return `Once a fight starts, its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}.`;
      const when = PRED[c] ?? c;
      return e.value > 0 ? `${cap(when)}, its bearer is ${rollWord(e.value)} better at ${reachDo(e.reach)}.` : `${cap(when)}, its bearer is ${rollWord(e.value)} worse at ${reachDo(e.reach)}.`;
    }
    case 'test_shaper': return 'When its bearer only just misses, it turns the miss into a scraped success.';
    case 'prevent_loss': return e.consumeOnPrevent
      ? 'The next time a bad outcome would wear its bearer thin, it takes the loss instead — and is gone.'
      : 'It takes the edge off every loss that would wear its bearer thin.';
    case 'tag_immunity': {
      const names = e.tags.flatMap(t => conditionsBlockedBy(t).filter(cnd => cnd.tags.includes('#negative')).map(cnd => cnd.name.replace(/^The /, 'the ')));
      if (names.length === 0) return '';
      if (names.length <= 4) return `${cap(listWords(names))} cannot take hold of its bearer.`;
      const kind = e.tags[0] === '#curse' ? 'curses' : e.tags[0] === '#disease' ? 'sicknesses' : 'afflictions';
      return `${cap(names.slice(0, 3).join(', '))} and ${NUM[names.length - 3] ?? 'several'} other ${kind} cannot take hold of its bearer.`;
    }
    case 'reveal': return e.target === 'encounters'
      ? `Its bearer always notices what is happening up to ${e.range === 'all' ? 'any distance' : hexes(e.range)} away, even when tired or in fog.`
      : `Whenever its bearer arrives somewhere new, every place within ${e.range === 'all' ? 'any distance' : hexes(e.range)} becomes known to them.`;
    case 'range_modifier': {
      const bits: string[] = [];
      if (e.movementCostMultiplier) bits.push(e.movementCostMultiplier <= 0.8 ? 'Its bearer covers ground much faster.' : e.movementCostMultiplier < 0.95 ? 'Its bearer covers ground faster.' : 'Its bearer covers ground a little faster.');
      if (e.awarenessRangeBonus) bits.push(`Its bearer notices things ${hexes(e.awarenessRangeBonus)} further off than they otherwise would.`);
      return bits.join(' ');
    }
    case 'modify_rules': {
      const v = e.value;
      switch (e.rule) {
        case 'death_prevented': return 'Its bearer cannot die.';
        case 'healing_multiplier': return `Every condition on its bearer runs its course ${(v as number) >= 1.75 ? 'much ' : ''}faster: wounds, sickness and curses — but blessings too.`;
        case 'tier_advancement_cost_multiplier': return `Its bearer learns ${(v as number) <= 0.7 ? 'much ' : ''}faster: every step up in skill comes cheaper.`;
        case 'faction_influence_multiplier': return (v as number) >= 1
          ? `Its bearer's standing with their faction grows ${(v as number) >= 1.4 ? 'much ' : ''}faster.`
          : "Its bearer's standing with their faction grows more slowly: people trust the thing more than the one who carries it.";
        case 'reward_tier_bonus': return 'Its bearer tends to come away with better finds.';
        case 'duration_decay_multiplier': return 'Time runs slow around its bearer: every condition on them, good or bad, lasts longer.';
        case 'movement_cost_multiplier': return 'Its bearer covers ground faster.';
        case 'cooldown_multiplier': return "Its bearer's powers come back sooner.";
        default: return '';
      }
    }
    case 'aura': return `${e.target === 'allies' ? 'Allies' : e.target === 'enemies' ? 'Enemies' : 'Everyone'} within ${hexes(e.radius)} of its bearer are ${rollWord(e.value)} ${e.value > 0 ? 'better' : 'worse'} at ${reachDo(e.reach)}.`;
    case 'behavior_weight': return e.reach === 'iron' ? 'Its bearer goes looking for fights.' : e.reach === 'star' ? 'The road keeps calling: its bearer is always half ready to leave.' : `Its bearer keeps reaching for ${ITEM_GEN_REACH_DO[e.reach]}.`;
    case 'social_modifier': {
      const who = ({ same_faction: 'Their own faction', different_faction: 'People of other factions', any: 'People', ally: 'Allies', enemy: 'Enemies' } as Record<string, string>)[e.targetFilter];
      return `${who} ${e.cooperationBias > 0 ? 'deal with its bearer more readily' : 'trust its bearer less'}.`;
    }
    case 'action_gate': return `While it is carried, its bearer will not ${ITEM_GEN_REACH_BLOCK[e.reach]}.`;
    case 'axiological_drift': {
      const ax = CANONICAL_AXES.find(a => a.valuePair === e.axis);
      return ax ? `Over time, its bearer grows ${(e.ratePerTick < 0 ? ax.vice.word : ax.virtue.word).toLowerCase()}.` : '';
    }
    case 'resource_manipulate': return e.amount < 0 ? 'It feeds on its bearer. They slowly wear thin, and someone worn all the way through is gone from the story all the same.' : 'Its bearer recovers themselves faster.';
    case 'hex_effect': return e.property === 'corruption' ? 'The land sours wherever its bearer stays.' : e.property === 'divineInfluence' ? 'Ground where its bearer stays a while grows holy.' : 'Explorers are drawn to wherever its bearer stays.';
    case 'action_trigger': return triggerSentence(e);
    case 'consumable_charge': return `Good for ${NUM[e.charges] ?? 'several'} hard stretches of ${ITEM_GEN_REACH_DO[e.onUse.reach as ReachDomain]} (${REACH_NAME[e.onUse.reach as ReachDomain]}), ${rollWord(e.onUse.value ?? 0)} better each time; then it is used up.`;
    case 'slot_bonus': return `It carries ${NUM[e.bonus] ?? 'several'} more loads of supplies for its bearer.`;
    case 'suppress': return `Every charm and enchanted thing within ${hexes(e.scope.scope === 'radius' ? e.scope.hexes : 1)} of its bearer goes quiet — friend's or foe's.`;
    case 'cooldown': return `For a third of every day it runs hot: its bearer is ${rollWord(e.value ?? 0)} better at ${reachDo(e.reach as ReachDomain)} while it lasts.`;
    case 'stacking': return e.stackOn === 'on_damaged' ? 'Every wound its bearer takes makes them fight a little harder, for a while.' : 'Every win makes its bearer a little better at the next, for a while.';
    default: return '';
  }
}

function triggerSentence(e: Extract<AttachmentEffect, { type: 'action_trigger' }>): string {
  const when = ({
    encounter_success: 'Each time it helps its bearer succeed', encounter_failure: 'When its bearer fails',
    encounter_critical_failure: 'If things go very badly', encounter_critical_success: 'On a great success',
    encounter_at_cost: 'When a success costs its bearer something',
    movement_complete: 'Whenever its bearer arrives somewhere', action_complete: 'After each task',
  } as Record<string, string>)[e.on] ?? 'Sometimes';
  const p = e.payload;
  const sometimes = e.probability != null && e.probability < 1;
  if (p.kind === 'resource_delta') return `${when}, it takes a little of them in payment: some of their sense of self, gone for good.`;
  if (p.kind === 'condition_grant') {
    const cname = knownConditions().find(c => c.id === p.conditionTraitId)?.name ?? 'troubled';
    const what = cname === 'Nightmares' ? 'with Nightmares' : cname === 'Watch Scrutiny' ? 'under Watch Scrutiny — the Watch starts watching them' : cname;
    const dur = days((p as { durationTicks?: number }).durationTicks ?? 24);
    return sometimes ? `${when}, ${chanceWords(e.probability ?? 1)} they come away ${what} for ${dur}.` : `${when}, they come away ${what} for ${dur}.`;
  }
  if (p.kind === 'condition_remove') return `${when}, its bearer dresses their wounds with it.`;
  if (p.kind === 'self_remove') {
    if (e.maxFires === 1) return '';
    const lost = /does not come back/.test(e.narrativeTemplate ?? '') ? 'the animal does not come back' : 'it breaks';
    return `${when} (${chanceWords(e.probability ?? 1)}), ${lost}.`;
  }
  return '';
}
