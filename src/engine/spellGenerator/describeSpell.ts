/**
 * `describeSpell` — what a generated spell does, what it costs and what goes wrong, in
 * words (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Systems design and
 * § UI pillar. Ported from the prototype's clause functions (`generator.mjs:361-455`,
 * :872-946), reusing `describeEffect`'s words where the shape is shared with an item.
 *
 * **No numerals** (UI Law 13): magnitudes are words, time is hours and days, chance is
 * *sometimes / often*. "The bearer" carries a spell, "the caster" casts one. Pure over the
 * template, so the sheet derives the words at render and they never go stale.
 */

import type { AttachmentEffect, BacklashEffect, SpellCost, SpellTemplate } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import { describeEffect } from '../itemGenerator/describeItem';
import { knownConditions } from '../itemGenerator/validateGeneratedItem';
import { SPELL_GEN_TICKS_PER_DAY } from '../../data/spell-generator-tables';
import { flatCosts } from './validateGeneratedSpell';

export interface SpellDescription {
  /** *What it does* — one or two plain sentences. */
  readonly does: string;
  /** *What it costs* — the price, in words. */
  readonly costs: string;
  /** *What goes wrong* — the backlash or the carried price, in words. */
  readonly wrong: string;
}

const REACH_NAME: Record<ReachDomain, string> = { iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil', heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];

/** A span of ticks in plain words. */
export function spanWords(ticks: number | 'permanent'): string {
  if (ticks === 'permanent') return 'for good';
  if (ticks <= 4) return 'for a few hours';
  if (ticks <= 7) return 'for half a day';
  if (ticks <= SPELL_GEN_TICKS_PER_DAY) return 'for a day';
  if (ticks <= SPELL_GEN_TICKS_PER_DAY * 2) return 'for a couple of days';
  if (ticks <= SPELL_GEN_TICKS_PER_DAY * 3) return 'for a few days';
  return 'for about a week';
}

/** A chance in plain words. */
function chance(p: number): string {
  if (p < 0.2) return 'rarely';
  if (p < 0.45) return 'sometimes';
  if (p < 0.7) return 'often';
  if (p < 0.9) return 'usually';
  return 'almost always';
}

const conditionName = (id: string) => knownConditions().find(c => c.id === id)?.name ?? 'troubled';
const hexes = (n: number) => (n <= 1 ? 'a hex' : `${NUM[n] ?? 'several'} hexes`);

/** A cast effect as the caster's sentence. */
function castSentence(e: AttachmentEffect): string {
  switch (e.type) {
    case 'inflict_condition':
      return e.target === 'self'
        ? `The caster is left ${conditionName(e.conditionTraitId)} ${spanWords(e.durationTicks ?? SPELL_GEN_TICKS_PER_DAY)}.`
        : `The opponent is left ${conditionName(e.conditionTraitId)} ${spanWords(e.durationTicks ?? SPELL_GEN_TICKS_PER_DAY)}.`;
    case 'resource_manipulate':
      return e.amount >= 2 ? 'It lands on the opponent like a heavy blow.' : 'It lands on the opponent like a clean blow.';
    case 'teleport':
      return `The caster steps across up to ${typeof e.range === 'number' ? hexes(e.range) : 'any distance'} in a moment.`;
    case 'forced_move':
      return 'It throws someone out of the way.';
    case 'alter_terrain':
      return e.terrainEffect === 'warded'
        ? `The ground where the caster stands is warded ${spanWords(e.ticks)}: anyone crossing it goes slowly.`
        : `A mist hangs over the caster's hex ${spanWords(e.ticks)}: nobody in it sees far, the caster included.`;
    case 'dispel':
      return 'One hurt on the caster — a wound, a curse or a fear — is lifted.';
    case 'modify_rules': {
      const span = spanWords(e.ticks);
      switch (e.rule) {
        case 'encounter_reach_override': {
          const v = e.value as { to?: ReachDomain };
          return `In a fight, the caster fights with ${REACH_NAME[v.to ?? 'iron']} instead of Iron, ${span}.`;
        }
        case 'death_prevented': return `Death cannot take the caster ${span}.`;
        case 'movement_cost_multiplier': return (e.value as number) < 1 ? `The caster travels much faster ${span}.` : `The caster travels slower ${span}.`;
        case 'awareness_range_bonus': return (e.value as number) > 0 ? `The caster notices what is happening ${hexes(e.value as number)} further off ${span}.` : `The caster notices less of what goes on around them ${span}.`;
        case 'cooldown_multiplier': return (e.value as number) > 1 ? `The caster's workings are slow to come back ${span}.` : `The caster's workings come back sooner ${span}.`;
        default: return '';
      }
    }
    default: return '';
  }
}

/** A carried effect as the bearer's sentence — the item words, with "its bearer" made "the bearer". */
function carriedSentence(e: AttachmentEffect): string {
  if (e.type === 'action_trigger' && e.payload.kind === 'condition_remove') {
    return `After a success, the bearer ${chance(e.probability ?? 1)} sheds ${conditionName((e.payload as { conditionTraitId?: string }).conditionTraitId ?? '')}.`;
  }
  return describeEffect(e).replace(/\bIts bearer\b/g, 'The bearer').replace(/\bits bearer\b/g, 'the bearer');
}

function costSentence(c: SpellCost): string {
  switch (c.type) {
    case 'tick_exhaust': return `Casting it spends the caster: they cannot cast again ${spanWords(c.ticks)}.`;
    case 'condition_inflict': return 'Casting it leaves the caster Exhausted until it wears off.';
    case 'reach_drain': return `Casting it leaves the caster Strained in ${REACH_NAME[c.reach]} for a couple of days.`;
    case 'doom_increase': return c.amount >= 15
      ? 'Each casting costs the caster a great deal of themselves, and it is the kind of magic people notice.'
      : 'Each casting costs the caster a piece of themselves, and it is the kind of magic people notice.';
    default: return '';
  }
}

function backlashSentence(b: BacklashEffect): string {
  const what = b.narrativeTemplate.replace(/\{actor\}/g, 'the caster').replace(/\{[^}]*\}/g, '').trim();
  const lc = what.charAt(0).toLowerCase() + what.slice(1);
  if (b.trigger === 'always') return `Every casting is a risk, even a good one. ${cap(chance(b.probability))}, ${lc}`;
  return b.trigger === 'critical_failure'
    ? `If the casting fails badly, it ${chance(b.probability)} turns on them: ${lc}`
    : `If the casting fails, it ${chance(b.probability)} rebounds: ${lc}`;
}

/** Describe a generated spell. `catchIndexes` split a carried spell's price from its boon. */
export function describeSpell(spell: SpellTemplate, catchIndexes: readonly number[] = []): SpellDescription {
  const deliberate = spell.agency === 'deliberate';
  if (deliberate) {
    const does = spell.effects.map(castSentence).filter(Boolean).join(' ');
    const costs = flatCosts(spell.cost).map(costSentence).filter(Boolean).join(' ');
    const wrong = spell.backlash ? backlashSentence(spell.backlash) : 'Little. If the casting fails, it simply fails.';
    return { does: does || 'It does its work and is gone.', costs: costs || 'Nothing. Casting it costs the caster nothing.', wrong };
  }
  const carried = spell.passiveEffects ?? [];
  const catchSet = new Set(catchIndexes);
  const does = carried.filter((_, i) => !catchSet.has(i)).map(carriedSentence).filter(Boolean).join(' ');
  const catches = carried.filter((_, i) => catchSet.has(i));
  // A standing price — a weakness, a drain, a toll on success — is what it *costs*; a
  // turn on failure or a slow change of character is what *goes wrong*.
  const isCost = (e: AttachmentEffect) => e.type === 'passive' || e.type === 'resource_manipulate'
    || (e.type === 'action_trigger' && e.on === 'encounter_success');
  const weigh = catches.filter(isCost).map(carriedSentence).filter(Boolean);
  const turns = catches.filter(e => !isCost(e)).map(carriedSentence).filter(Boolean);
  return {
    does: does || 'It is quiet magic, and it works without being asked.',
    costs: weigh.length ? weigh.join(' ') : 'Nothing beyond a place among the workings the bearer keeps ready.',
    wrong: turns.length ? turns.join(' ') : 'Nothing much. It is steady magic.',
  };
}
