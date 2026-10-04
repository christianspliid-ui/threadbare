/**
 * The seeded spell generator's authored cores — the small kernels every generated spell
 * grows around (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Attachment content —
 * the cores. Ported from the THR-1232 prototype (`generator.mjs:458-846`) and re-measured
 * at build against the two vocabularies (carried: `ITEM_HONEST_VOCABULARY` ∩
 * `isCarriedEffectStateless`; cast: `SPELL_CAST_HONEST_VOCABULARY`). **A core that cannot
 * pass is dropped, never faked.** Dropped, with the reason:
 *
 * - `fight.trade_answer` (`reactive`), `fight.trophy` (`stacking` on `on_kill`),
 *   `enc.mending` and `mark.arrival_ward` (`reactive`), `enc.soul_ward` (a consumed
 *   `prevent_loss`) — stateful, refused on a shared node;
 * - `fight.ward_wounds` (`tag_immunity`), `mark.drift` (`hex_effect`) and the carried
 *   `modify_rules` cores (`enc.linger`, `enc.quickening`, `enc.learning`, `enc.fortune`,
 *   `enc.oath`) — outside the carried set;
 * - `enc.hush` (a cast `suppress`) and `sight.uncover` (a cast `reveal`) — modifier-only
 *   when cast: they would land and write nothing (Lane decision 6).
 *
 * Retargeted: `enc.lift_curse` targets the caster (encounter-arena casts are self-only
 * until THR-1683's ally/enemy filter lands). Added: `travel.fold`, a teleport — the
 * prototype had no live teleport when it was written. The prototype's cast rider
 * (`afterglow`, a `duration`) is dropped for the same reason as the cast `duration`s.
 *
 * Rule 8: every core carries at least two authored flavour lines, each naming the theme
 * family it suits. Placeholders: `{tradition_noun}` and `{blow}` only.
 */

import type { AttachmentEffect } from '../types/effects';
import type { ReachDomain } from '../types/traits';
import type { SpellCore, CoreContext } from '../engine/spellGenerator/types';
import { EFFECT_PER_ITEM_CAP } from './effect-constants';
import { COND_NOUNS, COND_REACH, SPELL_GEN_CONDITIONS, SPELL_GEN_SPHERES, THEME_REACH } from './spell-generator-tables';
import { ITEM_HONEST_CONDITION_OWN_REACHES, ITEM_HONEST_SITUATIONS } from './item-honest-vocabulary';
import type { EffectCondition } from '../types/effects';

const r2 = (x: number) => Math.round(x * 100) / 100;
const cond = (key: string) => SPELL_GEN_CONDITIONS[key].id;

/** Every sphere — for a core that fits any of them. */
const ALL = {
  chaos: true, order: true, light: true, darkness: true, force: true, matter: true,
  energy: true, life: true, mind: true, spirit: true, time: true, entropy: true,
} as const;

/** Is `reach` the situation's own reach (a passive in disguise, refused by the validator)? */
function ownReach(c: EffectCondition, reach: ReachDomain): boolean {
  const own = ITEM_HONEST_CONDITION_OWN_REACHES[c];
  return !!own && own.includes(reach);
}

/**
 * The situations a carried bonus may name: those the engine switches on and off for a
 * walker (`ITEM_HONEST_SITUATIONS`). The four ambient ones (in a fight, among people,
 * with magic, exploring) fire on every step of their own Reach and almost never on any
 * other, so the validator refuses them — a passive in disguise, or a bonus that never fires.
 */
export const SPELL_GEN_HONEST_SITUATIONS: readonly EffectCondition[] =
  (Object.keys(ITEM_HONEST_SITUATIONS) as EffectCondition[]).sort();

/** A situational bonus that is honest: a situation the engine switches, on a Reach it calls for. */
function favouredPick(c: CoreContext, stream: string): { condition: EffectCondition; reach: ReachDomain } | null {
  const S = SPELL_GEN_SPHERES[c.sphere];
  const themeReach = THEME_REACH[c.tradition.themes[0]];
  const honest = (k: EffectCondition) => SPELL_GEN_HONEST_SITUATIONS.includes(k);
  const leansOn = (k: EffectCondition) => (COND_REACH[k] ?? []).filter(r => !ownReach(k, r) && ((S.reaches[r] ?? 0) > 0 || r === themeReach));
  const preferred: EffectCondition[] = [c.tradition.cond, ...S.conditions].filter((k, i, a) => a.indexOf(k) === i && honest(k) && leansOn(k).length > 0);
  // No situation the sphere leans on: any honest situation, on the Reach it calls for.
  const candidates = preferred.length > 0 ? preferred : SPELL_GEN_HONEST_SITUATIONS.filter(k => (COND_REACH[k] ?? []).length > 0);
  if (candidates.length === 0) return null;
  const k = c.roll(`${stream}.cond`) < 0.7 && candidates.includes(c.tradition.cond)
    ? c.tradition.cond
    : candidates[Math.floor(c.roll(`${stream}.cond_alt`) * candidates.length)];
  const pool = leansOn(k).length > 0 ? leansOn(k) : (COND_REACH[k] ?? []);
  const reach = pool[Math.floor(c.roll(`${stream}.reach`) * pool.length)];
  return { condition: k, reach };
}

export const SPELL_CORES: readonly SpellCore[] = [
  // ─────────────── FIGHT ───────────────
  {
    id: 'fight.reach_swap', arena: 'fight', agency: 'deliberate', tiers: [1, 3], themes: ['war', 'mind', 'sight', 'conceal', 'fear'], riders: [],
    spheres: { mind: 'eye', light: 'eye', time: 'eye', darkness: 'shadow', entropy: 'shadow', chaos: 'veil', spirit: 'heart', energy: 'star', order: 'stone', matter: 'stone' },
    flavours: [
      { themes: ['war', 'fear'], text: 'The caster stops fighting the way fighters do, and starts fighting the way {tradition_noun} taught them.' },
      { themes: ['mind', 'sight', 'conceal'], text: 'A fight is a question, and the caster answers it in a language the opponent does not speak.' },
    ],
    castProse: { landed: '{actor} shifts their footing, and the fight is suddenly on their ground.', fizzled: '{actor} reaches for another way to fight and finds only their own two hands.' },
    build(c) {
      const to = (typeof c.arg === 'string' ? c.arg : 'eye') as ReachDomain;
      return {
        reach: to, targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'encounter_reach_override', value: { from: 'iron', to }, ticks: c.t([6, 6, 12, 24]) }],
        names: { nouns: ['Stance', 'Guard', 'Answer'], verbs: ['Read', 'Meet', 'Turn'], objects: ['the Blade', 'the Fight', 'the Blow'] },
      };
    },
  },
  {
    id: 'fight.clock_blow', arena: 'fight', agency: 'deliberate', tiers: [1, 3], themes: ['war', 'curse'], riders: [],
    spheres: { force: true, energy: true, entropy: true, chaos: true, matter: true, light: true },
    flavours: [
      { themes: ['war'], text: 'It strikes with {blow}, and it strikes where the guard is thinnest.' },
      { themes: ['curse'], text: 'It strikes with {blow}, and the wound it leaves keeps working.' },
    ],
    castProse: { landed: '{actor} strikes {target} with {blow}, and it lands hard.', fizzled: '{actor} calls up {blow}, and it goes wide.' },
    build(c) {
      return {
        reach: 'iron', targeting: { type: 'agent', range: 0, filter: 'enemy' },
        effects: [{ type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount: c.tierIdx >= 3 ? 2 : 1, mode: 'one_shot' }],
        names: { nouns: ['Blow', 'Strike', 'Hammer'], verbs: ['Strike', 'Break', 'Hammer'], objects: ['the Guard', 'the Line'] },
      };
    },
  },
  {
    id: 'fight.inflict_fear', arena: 'fight', agency: 'deliberate', tiers: [1, 3], themes: ['fear', 'death', 'mind'], riders: [],
    spheres: { darkness: 'terrified', spirit: 'terrified', chaos: 'terrified', mind: 'shaken' },
    flavours: [
      { themes: ['fear', 'death'], text: 'It shows the opponent something they will see again in their sleep.' },
      { themes: ['mind'], text: 'It puts one small, certain doubt behind the opponent\'s eyes.' },
    ],
    castProse: { landed: '{actor} looks at {target}, and {target} looks away first.', fizzled: '{actor} tries to put fear into {target}, and {target} only laughs.' },
    build(c) {
      const k = typeof c.arg === 'string' ? c.arg : 'terrified';
      return {
        reach: 'iron', targeting: { type: 'agent', range: 0, filter: 'enemy' },
        effects: [{ type: 'inflict_condition', conditionTraitId: cond(k), target: 'counterpart', durationTicks: c.t([12, 12, 24, 48]) }],
        names: { nouns: ['Dread', 'Howl', 'Pall'], verbs: ['Break', 'Shake', 'Cow'], objects: ['Their Nerve', 'the Brave'] },
      };
    },
  },
  {
    id: 'fight.inflict_curse', arena: 'fight', agency: 'deliberate', tiers: [1, 3], themes: ['curse', 'death', 'time'], riders: [],
    spheres: { entropy: 'cursed', time: 'exhausted', life: 'wounded', energy: 'wounded' },
    flavours: [
      { themes: ['curse', 'death'], text: 'It is a small, mean working, and it does not wash off.' },
      { themes: ['time'], text: 'It hangs every hour of the day on the opponent at once.' },
    ],
    castProse: { landed: '{actor} names {target} under their breath, and {target} falters.', fizzled: '{actor} spits the words at {target}, and they slide off.' },
    build(c) {
      const k = typeof c.arg === 'string' ? c.arg : 'cursed';
      return {
        reach: 'iron', targeting: { type: 'agent', range: 0, filter: 'enemy' },
        effects: [{ type: 'inflict_condition', conditionTraitId: cond(k), target: 'counterpart', durationTicks: c.t([12, 24, 36, 72]) }],
        names: { nouns: ['Hex', 'Blight', 'Canker'], verbs: ['Curse', 'Blight', 'Sour'], objects: ['the Foe', 'Their Luck'] },
      };
    },
  },
  {
    id: 'fight.last_stand', arena: 'fight', agency: 'fate_woven', tiers: [0, 2], themes: ['ward', 'war', 'holy', 'heal'], riders: ['favoured_combat'],
    spheres: { order: true, matter: true, life: true, time: true, light: true, spirit: true, force: true },
    flavours: [
      { themes: ['ward', 'holy', 'heal'], text: 'When a fight turns against the bearer, something holds them up, just long enough.' },
      { themes: ['war'], text: 'The bearer has been taught to lose a blow without losing the fight.' },
    ],
    build(c) {
      return {
        reach: 'iron', targeting: { type: 'self' },
        effects: [{ type: 'test_shaper', trigger: 'failure', steps: 1, condition: 'in_combat', maxMargin: c.t([0.05, 0.1, 0.15, 0.2]) }],
        names: { nouns: ['Footing', 'Brace', 'Anchor', 'Guard'] },
      };
    },
  },

  // ─────────────── ENCOUNTER ───────────────
  {
    id: 'enc.calling', arena: 'encounter', agency: 'fate_woven', tiers: [0, 2], themes: null, riders: ['favoured'], spheres: ALL,
    flavours: [
      { themes: null, text: 'It is less a spell than a habit of attention, and it pulls the bearer toward the work {tradition_noun} cares about.' },
      { themes: ['wild', 'travel', 'luck'], text: 'It itches, and only one kind of trouble scratches it.' },
    ],
    build(c) {
      return {
        reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'behavior_weight', reach: c.reach, multiplier: c.t([1.25, 1.35, 1.5, 1.5]) }],
        names: { nouns: ['Call', 'Lure', 'Pull'] },
      };
    },
  },
  {
    id: 'enc.favoured', arena: 'encounter', agency: 'fate_woven', tiers: [0, 2], themes: null, riders: ['calling'], spheres: ALL,
    flavours: [
      { themes: null, text: 'It is a small working, and it only wakes when the moment is right for it.' },
      { themes: ['holy', 'ward', 'heal'], text: 'A blessing kept for one kind of day, and generous on that day.' },
    ],
    build(c) {
      const pick = favouredPick(c, 'favoured');
      const value = r2(Math.min(EFFECT_PER_ITEM_CAP, c.m('favoured.mag') * 1.2));
      const condition = pick?.condition ?? 'alone';
      const reach = pick?.reach ?? 'shadow';
      return {
        reach, targeting: { type: 'self' },
        effects: [{ type: 'conditional', condition, reach, value }],
        names: { nouns: COND_NOUNS[condition] ?? ['Knack'] },
      };
    },
  },
  {
    id: 'enc.second_chance', arena: 'encounter', agency: 'fate_woven', tiers: [1, 2], themes: ['luck', 'time', 'sight'], riders: ['calling'],
    spheres: { time: true, chaos: true, light: true, mind: true, entropy: true },
    flavours: [
      { themes: ['luck'], text: 'Luck owes the bearer one, and pays it at the worst possible moment.' },
      { themes: ['time', 'sight'], text: 'The bearer sees the miss a heartbeat early, and leans.' },
    ],
    build(c) {
      return {
        reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'test_shaper', trigger: 'near_miss', steps: c.tierIdx >= 2 ? 2 : 1, reach: c.reach }],
        names: { nouns: ['Second Chance', 'Tipping', 'Nudge'] },
      };
    },
  },
  {
    id: 'enc.easy_company', arena: 'encounter', agency: 'fate_woven', tiers: [0, 1], themes: ['mind', 'holy', 'heal'], riders: ['favoured'],
    spheres: { mind: 'any', light: 'any', life: 'different_faction', spirit: 'any', order: 'same_faction' },
    flavours: [
      { themes: ['holy', 'heal'], text: 'People feel looked after in the bearer\'s company, and they repay it.' },
      { themes: ['mind'], text: 'The bearer always seems to have just said the right thing.' },
    ],
    build(c) {
      const filter = (typeof c.arg === 'string' ? c.arg : 'any') as 'any' | 'same_faction' | 'different_faction';
      return {
        reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'social_modifier', targetFilter: filter, cooperationBias: c.t([0.1, 0.15, 0.2, 0.2]) }],
        names: { nouns: ['Welcome', 'Manner', 'Open Hand'] },
      };
    },
  },
  {
    id: 'enc.rally', arena: 'encounter', agency: 'fate_woven', tiers: [1, 2], themes: ['war', 'holy', 'ward'], riders: [],
    spheres: { order: true, spirit: true, force: true, light: true, life: true },
    flavours: [
      { themes: ['war'], text: 'Those who stand beside the bearer stand a little straighter.' },
      { themes: ['holy', 'ward'], text: 'It is a blessing worn on the outside, and the bearer\'s friends are warmed by it.' },
    ],
    build(c) {
      return {
        reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'aura', radius: 1, target: 'allies', reach: c.reach, value: r2(c.m('rally.mag') * 0.7) }],
        names: { nouns: ['Banner', 'Rally', 'Standard'] },
      };
    },
  },
  {
    id: 'enc.dread', arena: 'encounter', agency: 'fate_woven', tiers: [1, 2], themes: ['fear', 'death', 'curse'], riders: [],
    spheres: { darkness: true, entropy: true, chaos: true, spirit: true },
    flavours: [
      { themes: ['fear', 'death'], text: 'A cold goes with the bearer, and the bearer\'s enemies feel it first.' },
      { themes: ['curse'], text: 'Bad luck walks a step behind the bearer and trips whoever wishes them ill.' },
    ],
    build(c) {
      return {
        reach: c.reach, targeting: { type: 'self' },
        effects: [{ type: 'aura', radius: 1, target: 'enemies', reach: c.reach, value: -r2(c.m('dread.mag') * 0.7) }],
        names: { nouns: ['Dread', 'Pall', 'Chill'] },
      };
    },
  },
  {
    id: 'enc.clean_hands', arena: 'encounter', agency: 'fate_woven', tiers: [1, 1], themes: ['heal', 'holy'], riders: [],
    spheres: { life: 'wounded', light: 'terrified', spirit: 'grieving', order: 'shaken' },
    flavours: [
      { themes: ['heal'], text: 'Good work is its own medicine, and the bearer heals by doing it.' },
      { themes: ['holy'], text: 'A thing done well is a prayer answered, and it lifts what weighs on the bearer.' },
    ],
    build(c) {
      const k = typeof c.arg === 'string' ? c.arg : 'wounded';
      return {
        reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'action_trigger', on: 'encounter_success', probability: 0.35, cooldownTicks: 24, payload: { kind: 'condition_remove', conditionTraitId: cond(k) } }],
        names: { nouns: ['Clean Hands', 'Ease', 'Settling'] },
      };
    },
  },
  {
    id: 'enc.refuse_death', arena: 'encounter', agency: 'deliberate', tiers: [2, 3], themes: ['death', 'heal', 'time'], riders: [],
    spheres: { life: true, spirit: true, entropy: true, time: true },
    flavours: [
      { themes: ['death'], text: 'Death is a door, and {tradition_noun} knows how to hold it shut for a while.' },
      { themes: ['heal', 'time'], text: 'It buys a day from the end of the caster\'s life and spends it now.' },
    ],
    castProse: { landed: '{actor} says no to the dark, and the dark waits.', fizzled: '{actor} says no to the dark, and the dark does not listen.' },
    build(c) {
      return {
        reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'death_prevented', value: true, ticks: c.t([24, 24, 36, 72]) }],
        names: { nouns: ['Refusal', 'Stay', 'Reprieve'], verbs: ['Refuse', 'Deny', 'Cheat'], objects: ['the Grave', 'Death'] },
      };
    },
  },
  {
    id: 'enc.steel', arena: 'encounter', agency: 'deliberate', tiers: [1, 2], themes: ['holy', 'heal', 'war', 'mind'], riders: [],
    spheres: { light: 'blessed', spirit: 'blessed', life: 'inspired', energy: 'inspired', order: 'inspired' },
    flavours: [
      { themes: ['holy', 'heal'], text: 'A short prayer before hard work, and the work goes easier.' },
      { themes: ['war', 'mind'], text: 'The caster gathers themselves the way a fighter takes a breath.' },
    ],
    castProse: { landed: '{actor} breathes out, and their hands are steady.', fizzled: '{actor} reaches for calm and finds the same racing heart.' },
    build(c) {
      const k = typeof c.arg === 'string' ? c.arg : 'inspired';
      return {
        reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'inflict_condition', conditionTraitId: cond(k), target: 'self', durationTicks: c.t([12, 12, 24, 36]) }],
        names: { nouns: ['Kindling', 'Resolve', 'Grace'], verbs: ['Steel', 'Bless', 'Gird'], objects: ['the Nerve', 'the Self', 'the Hour'] },
      };
    },
  },
  {
    id: 'enc.lift_curse', arena: 'encounter', agency: 'deliberate', tiers: [1, 2], themes: ['heal', 'holy'], riders: [],
    spheres: { light: true, life: true, spirit: true, order: true },
    flavours: [
      { themes: ['heal'], text: 'It washes one hurt out of the caster, the way clean water washes a cut.' },
      { themes: ['holy'], text: 'The caster asks for one weight to be lifted, and one is.' },
    ],
    castProse: { landed: '{actor} lays a hand on their own chest, and something heavy lets go.', fizzled: '{actor} asks for the weight to lift, and it stays.' },
    build() {
      return {
        reach: 'heart', targeting: { type: 'self' },
        effects: [{ type: 'dispel', target: 'condition', tags: ['#negative'] }],
        names: { nouns: ['Lifting', 'Unbinding', 'Cleansing'], verbs: ['Lift', 'Loose', 'Wash'], objects: ['the Mark', 'the Curse'] },
      };
    },
  },

  // ─────────────── WORLD MAP: TRAVEL ───────────────
  {
    id: 'travel.swift', arena: 'map_travel', agency: 'fate_woven', tiers: [0, 2], themes: ['travel', 'wild'], riders: ['calling_star'],
    spheres: { force: true, energy: true, time: true, chaos: true, life: true },
    flavours: [
      { themes: ['travel'], text: 'The road is shorter for the bearer, and nobody can say why.' },
      { themes: ['wild'], text: 'The bearer walks the way animals do: never lost, never slow.' },
    ],
    build(c) {
      return {
        reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'range_modifier', movementCostMultiplier: c.t([0.85, 0.75, 0.65, 0.65]) }],
        names: { nouns: ['Stride', 'Road', 'Step'] },
      };
    },
  },
  {
    id: 'travel.burst', arena: 'map_travel', agency: 'deliberate', tiers: [1, 3], themes: ['travel', 'wild'], riders: [],
    spheres: { force: true, energy: true, chaos: true, time: true },
    flavours: [
      { themes: ['travel'], text: 'Cast before a journey, it makes the miles go by {road}.' },
      { themes: ['wild'], text: 'The land gives way to the caster for a while, {road}.' },
    ],
    castProse: { landed: '{actor} sets out, and the road runs fast under their feet.', fizzled: '{actor} sets out, and the road is as long as it ever was.' },
    build(c) {
      return {
        reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'movement_cost_multiplier', value: c.tierIdx >= 3 ? 0.5 : 0.6, ticks: c.t([12, 12, 24, 36]) }],
        names: { nouns: ['Run', 'Dash', 'Flight'], verbs: ['Shorten', 'Outrun', 'Take'], objects: ['the Road', 'the Miles'] },
      };
    },
  },
  {
    id: 'travel.fold', arena: 'map_travel', agency: 'deliberate', tiers: [2, 3], themes: ['travel'], riders: [],
    spheres: { spirit: true, time: true, chaos: true, energy: true },
    flavours: [
      { themes: ['travel'], text: 'The caster steps through a fold in the world and comes out somewhere else.' },
      { themes: ['travel'], text: 'Distance is a habit, and {tradition_noun} has taught the caster to break it.' },
    ],
    castProse: { landed: '{actor} steps through a fold in the air and is somewhere else.', fizzled: '{actor} reaches for the fold and finds only the road under their feet.' },
    build(c) {
      return {
        reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'teleport', target: 'self', range: c.t([1, 2, 2, 3]) }],
        names: { nouns: ['Fold', 'Door', 'Step'], verbs: ['Fold', 'Step', 'Skip'], objects: ['the Road', 'the Miles', 'the Distance'] },
      };
    },
  },

  // ─────────────── WORLD MAP: SIGHT ───────────────
  {
    id: 'sight.far', arena: 'map_sight', agency: 'fate_woven', tiers: [0, 2], themes: ['sight', 'wild'], riders: ['favoured'],
    spheres: { light: true, mind: true, time: true, spirit: true },
    flavours: [
      { themes: ['sight'], text: 'The bearer notices trouble early, the way some people smell rain.' },
      { themes: ['wild'], text: 'The birds tell the bearer things, and the bearer listens.' },
    ],
    build(c) {
      return {
        reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'range_modifier', awarenessRangeBonus: c.tierIdx + 1 }],
        names: { nouns: ['Watch', 'Farsight', 'Lookout'] },
      };
    },
  },
  {
    id: 'sight.lamp', arena: 'map_sight', agency: 'fate_woven', tiers: [1, 2], themes: ['sight', 'holy'], riders: [],
    spheres: { light: true, mind: true, time: true },
    flavours: [
      { themes: ['sight'], text: 'Nothing near the bearer stays hidden from them for long.' },
      { themes: ['holy'], text: 'A small light goes with the bearer, and it shows what others would rather keep dark.' },
    ],
    build(c) {
      return {
        reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'reveal', target: 'encounters', range: c.tierIdx >= 2 ? 3 : 2 }],
        names: { nouns: ['Lamp', 'Lantern', 'Window'] },
      };
    },
  },
  {
    id: 'sight.survey', arena: 'map_sight', agency: 'fate_woven', tiers: [0, 2], themes: ['sight', 'travel', 'wild'], riders: [],
    spheres: { light: true, time: true, mind: true, spirit: true, life: true },
    flavours: [
      { themes: ['sight', 'travel'], text: 'The land speaks to the bearer, and the next valley is never quite a stranger.' },
      { themes: ['wild'], text: 'The bearer reads ground the way a scholar reads a page.' },
    ],
    build(c) {
      return {
        reach: 'star', targeting: { type: 'self' },
        effects: [{ type: 'reveal', target: 'hexes', range: c.tierIdx + 1 }],
        names: { nouns: ['Survey', 'Wayfinding', 'Chart'] },
      };
    },
  },
  {
    id: 'sight.scry', arena: 'map_sight', agency: 'deliberate', tiers: [1, 3], themes: ['sight', 'time', 'death'], riders: [],
    spheres: { light: true, mind: true, time: true, spirit: true, darkness: true },
    flavours: [
      { themes: ['sight', 'time'], text: 'Cast to look far, it lends the caster eyes a long way off.' },
      { themes: ['death'], text: 'The dead see a long way, and for a while they lend the caster their sight.' },
    ],
    castProse: { landed: '{actor} looks into the distance, and the distance looks back.', fizzled: '{actor} looks into the distance and sees only distance.' },
    build(c) {
      return {
        reach: 'eye', targeting: { type: 'self' },
        effects: [{ type: 'modify_rules', scope: { scope: 'self' }, rule: 'awareness_range_bonus', value: c.tierIdx >= 3 ? 3 : 2, ticks: c.t([12, 12, 24, 36]) }],
        names: { nouns: ['Scrying', 'Far Look', 'Glass'], verbs: ['Open', 'Search', 'Read'], objects: ['the Distance', 'the Land'] },
      };
    },
  },

  // ─────────────── WORLD MAP: MARK ───────────────
  {
    id: 'mark.ward', arena: 'map_mark', agency: 'deliberate', tiers: [1, 3], themes: ['ward', 'craft', 'holy'], riders: [],
    spheres: { order: true, matter: true, spirit: true, light: true },
    flavours: [
      { themes: ['ward', 'holy'], text: 'The caster {ward} the ground, and it does not want to be crossed.' },
      { themes: ['craft'], text: 'A working laid into the land like a fence, and as patient as one.' },
    ],
    castProse: { landed: '{actor} marks the ground, and the road beyond it grows heavy.', fizzled: '{actor} marks the ground, and it is only ground.' },
    build(c) {
      return {
        reach: 'stone', targeting: { type: 'hex', range: 0 },
        effects: [{ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'warded', ticks: c.tierIdx >= 3 ? 'permanent' : c.t([24, 24, 48, 48]) }],
        names: { nouns: ['Ward', 'Threshold', 'Barrier'], verbs: ['Bar', 'Seal', 'Close'], objects: ['the Road', 'the Ground', 'the Way'] },
      };
    },
  },
  {
    id: 'mark.fog', arena: 'map_mark', agency: 'deliberate', tiers: [1, 2], themes: ['conceal', 'wild', 'mind'], riders: [],
    spheres: { darkness: true, chaos: true, mind: true, time: true },
    flavours: [
      { themes: ['conceal', 'mind'], text: 'The caster raises a mist, and in it nobody sees far, the caster included.' },
      { themes: ['wild'], text: 'The weather turns on the caster\'s word, and the hollow fills with fog.' },
    ],
    castProse: { landed: '{actor} breathes out, and the mist comes down over the hex.', fizzled: '{actor} breathes out, and the air stays clear.' },
    build(c) {
      return {
        reach: 'shadow', targeting: { type: 'hex', range: 0 },
        effects: [{ type: 'alter_terrain', target: 'self_hex', terrainEffect: 'shrouded', ticks: c.t([24, 24, 48, 48]) }],
        names: { nouns: ['Mist', 'Murk', 'Blind'], verbs: ['Cloud', 'Hood', 'Fog'], objects: ['the Road', 'the Hex', 'the Hollow'] },
      };
    },
  },
];

/** A carried rider — the "variation" on an authored core. Each reinforces the core's own Reach. */
export interface SpellRider {
  readonly id: string;
  build(c: CoreContext, reach: ReachDomain): AttachmentEffect | null;
}

export const SPELL_RIDERS: Readonly<Record<string, SpellRider>> = {
  calling: { id: 'calling', build: (_c, reach) => ({ type: 'behavior_weight', reach, multiplier: 1.2 }) },
  calling_star: { id: 'calling_star', build: () => ({ type: 'behavior_weight', reach: 'star', multiplier: 1.2 }) },
  favoured: {
    id: 'favoured',
    build: (c, reach) => {
      const fits = (Object.entries(COND_REACH) as [EffectCondition, readonly ReachDomain[]][])
        .filter(([k, rs]) => rs.includes(reach) && !ownReach(k, reach) && SPELL_GEN_HONEST_SITUATIONS.includes(k))
        .map(([k]) => k);
      if (fits.length === 0) return null;
      const condition = fits[Math.floor(c.roll('rider.favoured.cond') * fits.length)];
      return { type: 'conditional', condition, reach, value: r2(c.m('rider.favoured.mag') * 0.6) };
    },
  },
  // In a fight, the nerve step (Heart) is the one honest place for a fight bonus on a
  // carried spell — Iron in a fight is a passive in disguise (`ITEM_HONEST_CONDITION_OWN_REACHES`).
  favoured_combat: { id: 'favoured_combat', build: c => ({ type: 'conditional', condition: 'in_combat', reach: 'heart', value: r2(c.m('rider.favoured_combat.mag') * 0.5) }) },
};
