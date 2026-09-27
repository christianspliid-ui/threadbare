/**
 * The item generator's trope cores — the authored ideas an item grows around (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Attachment content.
 * Ported from the THR-1236 prototype (`generator.mjs` §8), under its rulings:
 *
 * - **Items grow around authored trope cores; the world dresses them.** A core is a
 *   mechanical idea plus a fiction skeleton — which forms, reaches and spheres fit it,
 *   what it looks like, how its story is told, what it may be called.
 * - **Two or three signatures per core**, so a second roll of the same core is a
 *   different idea, not a re-skin. Each signature builds its own boons and its own
 *   catch. A core with one signature fails the gate (`ITEM_GEN_MIN_SIGNATURES`).
 * - **Storied and up only.** Mundane gear stays in the hand catalog; the prototype's
 *   two Mundane-only cores (good things to carry, a small luck) are dropped.
 * - **An item never promises what the engine does not do.** Every effect a signature
 *   builds is a shape in `item-honest-vocabulary.ts`, and the gate test reads each one
 *   back through the real engine.
 *
 * `origins` says where a core's items come from. Eleven cores can be a **masterwork**
 * (a mortal made it) and author at least one `made` provenance line naming the maker;
 * the rest are **found** things — carried for the reward-draw minting point (THR-1626)
 * and exercised now by the review path.
 *
 * Register: game, not novel — one concrete detail, plain sentences.
 */

import type { AttachmentEffect, ActionTriggerEffect, EffectPredicate } from '../types/effects';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import { CANONICAL_AXES } from '../types/axisRegistry';
import { EFFECT_PER_ITEM_CAP } from './effect-constants';
import type {
  ItemGenBand, ItemGenFormId, ItemGenMagnitudeKind, ItemGenFixedKind, ItemGenNameGrammar, ItemGenOrigin,
} from './item-generator-tables';
import { ITEM_GEN_BREAK_CHANCE_BY_BAND, ITEM_GEN_OATHS, ITEM_GEN_VIRTUES, ITEM_GEN_REACHES } from './item-generator-tables';
import type {
  ItemGenEvent, ItemGenEventKind, ItemGenFaction, ItemGenHero, ItemGenMonster, ItemGenPart,
} from '../engine/itemGenerator/types';

// ─── The build context a signature is handed ──────────────────────────

export interface ItemGenBuildCtx {
  readonly band: ItemGenBand;
  readonly origin: ItemGenOrigin;
  readonly formId: ItemGenFormId;
  readonly formKind: string;
  readonly sphere: SphereName;
  /** The reach the item serves. A signature may reassign it (a mount's reach follows its form). */
  reach: ReachDomain;
  readonly faction: ItemGenFaction | null;
  readonly hero: ItemGenHero | null;
  readonly event: ItemGenEvent | null;
  readonly monster: ItemGenMonster | null;
  /** Set by a signature that asks for a worthy hand. */
  virtue: { id: string; word: string; adj: string } | null;
  /** Set by a signature whose catch is a curse; the minter stamps the Cursed trait. */
  stampCursed: boolean;
  /** Set by a signature whose loss condition is enforced by one of its effects. */
  lossCondition: 'breakable' | 'consumable' | null;
  /** Plain-words catch notes that are not effects of their own. */
  readonly catchNotes: string[];
  /** Weighted draw from a named table of this signature's own stream. */
  draw<K extends string>(tableId: string, weights: Partial<Record<K, number>>): K | undefined;
  /** A magnitude inside the band's envelope, optionally stepped down a band. */
  mag(kind: ItemGenMagnitudeKind, stepDown?: number): number;
  /** A fixed per-band value, optionally stepped down a band. */
  fixed(kind: ItemGenFixedKind, stepDown?: number): number;
}

export interface ItemGenSignature {
  readonly id: string;
  /** What this idea *is*, in a phrase — the review report prints it. */
  readonly label: string;
  /** Bands this idea is legal at; defaults to the core's. */
  readonly bands?: readonly ItemGenBand[];
  build(c: ItemGenBuildCtx): ItemGenPart[];
}

export type ItemGenEntityUse = 'maker' | 'hero' | 'faction' | 'event' | 'culture' | 'monster' | 'place';

export interface ItemGenProvenanceLine {
  readonly tone: 'ominous' | 'martial' | 'practical' | 'mystical' | 'reverent';
  readonly uses: readonly ItemGenEntityUse[];
  readonly text: string;
  /** A masterwork's line — who made it. Only `made` lines tell a masterwork; only the others tell a found thing. */
  readonly made?: boolean;
  /** Tell it through a dead, faithful member of the drawn faction. */
  readonly needsFactionHero?: boolean;
}

export interface ItemGenCore {
  readonly id: string;
  readonly label: string;
  readonly bands: readonly ItemGenBand[];
  readonly weight: number;
  readonly origins: readonly ItemGenOrigin[];
  readonly forms: Partial<Record<ItemGenFormId, number>>;
  /** Reach leaning; empty = the reach comes from elsewhere (the monster, the event, the form). */
  readonly reaches: Partial<Record<ReachDomain, number>>;
  readonly spheres: Partial<Record<SphereName, number>>;
  /** Found-origin pools, by the world's ids; ids a world does not have are skipped. */
  readonly factions?: Readonly<Record<string, number>>;
  readonly heroes?: Readonly<Record<string, number>>;
  readonly events?: Readonly<Record<string, number>>;
  /** Monster pool by sphere (any live host of the sphere qualifies). */
  readonly monsterSpheres?: Partial<Record<SphereName, number>>;
  readonly family: readonly string[];
  /** A trophy core: its form and material come from the monster. */
  readonly trophy?: boolean;
  readonly looks: readonly string[];
  readonly looksByForm?: Partial<Record<ItemGenFormId, readonly string[]>>;
  readonly looksByEvent?: Partial<Record<ItemGenEventKind, readonly string[]>>;
  readonly provenance: readonly ItemGenProvenanceLine[];
  readonly names: { readonly definite?: readonly string[]; readonly xofy?: readonly string[]; readonly role?: readonly string[] };
  readonly definiteByEvent?: Partial<Record<ItemGenEventKind, readonly string[]>>;
  readonly grammar: Partial<Record<ItemGenNameGrammar, number>>;
  readonly materials?: Readonly<Record<string, number>>;
  readonly materialsByEvent?: Partial<Record<ItemGenEventKind, Readonly<Record<string, number>>>>;
  readonly formsByEvent?: Partial<Record<ItemGenEventKind, Partial<Record<ItemGenFormId, number>>>>;
  readonly signatures: readonly ItemGenSignature[];
}

// ─── Effect builders ──────────────────────────────────────────────────

const r2 = (v: number, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
/** A worthy hand's bonus: the band's situational bonus, lifted a third, never past the per-effect cap. */
const worthyBonus = (c: ItemGenBuildCtx) => Math.min(EFFECT_PER_ITEM_CAP, r2(c.mag('conditional') * 1.3));
const AXIS = Object.fromEntries(CANONICAL_AXES.map(a => [a.reachDomain, a])) as Record<ReachDomain, (typeof CANONICAL_AXES)[number]>;

export const fx = {
  passive: (reach: ReachDomain, value: number): AttachmentEffect => ({ type: 'passive', reach, value }),
  cond: (condition: EffectPredicate, reach: ReachDomain, value: number): AttachmentEffect => ({ type: 'conditional', condition, reach, value }),
  stat: (contributions: Partial<Record<ReachDomain, number>>): AttachmentEffect => ({ type: 'stat_contribution', contributions } as AttachmentEffect),
  shaper: (maxMargin: number, reach?: ReachDomain): AttachmentEffect => ({ type: 'test_shaper', trigger: 'near_miss', steps: 1, maxMargin, ...(reach ? { reach } : {}) } as AttachmentEffect),
  ward: (amount: number, consumeOnPrevent: boolean): AttachmentEffect => ({ type: 'prevent_loss', channel: 'quintessence', amount, consumeOnPrevent } as AttachmentEffect),
  immune: (tags: string[]): AttachmentEffect => ({ type: 'tag_immunity', tags }),
  reveal: (target: 'encounters' | 'hexes', range: number): AttachmentEffect => ({ type: 'reveal', target, range } as AttachmentEffect),
  move: (movementCostMultiplier: number): AttachmentEffect => ({ type: 'range_modifier', movementCostMultiplier }),
  sight: (awarenessRangeBonus: number): AttachmentEffect => ({ type: 'range_modifier', awarenessRangeBonus }),
  rule: (rule: string, value: number | boolean): AttachmentEffect => ({ type: 'modify_rules', scope: { scope: 'self' }, rule, value, ticks: 'permanent' } as AttachmentEffect),
  aura: (radius: number, target: 'allies', reach: ReachDomain, value: number): AttachmentEffect => ({ type: 'aura', radius, target, reach, value } as AttachmentEffect),
  drag: (reach: ReachDomain, multiplier: number): AttachmentEffect => ({ type: 'behavior_weight', reach, multiplier }),
  social: (targetFilter: 'any' | 'same_faction' | 'different_faction', cooperationBias: number): AttachmentEffect => ({ type: 'social_modifier', targetFilter, cooperationBias }),
  gate: (reach: ReachDomain): AttachmentEffect => ({ type: 'action_gate', mode: 'block', reach }),
  /** Drift toward the reach's vice pole (a negative rate). */
  vice: (reach: ReachDomain, rate: number): AttachmentEffect => ({ type: 'axiological_drift', axis: AXIS[reach].valuePair, ratePerTick: -rate, limitValue: -0.6 } as AttachmentEffect),
  quint: (amount: number): AttachmentEffect => ({ type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount, mode: 'per_tick' }),
  hex: (property: string, value: number): AttachmentEffect => ({ type: 'hex_effect', property, value, mode: 'add' }),
  trig: (on: ActionTriggerEffect['on'], payload: ActionTriggerEffect['payload'], opts: Partial<ActionTriggerEffect> = {}): AttachmentEffect =>
    ({ type: 'action_trigger', on, payload, ...opts } as AttachmentEffect),
  grant: (on: ActionTriggerEffect['on'], conditionTraitId: string, durationTicks: number, probability: number, cooldownTicks: number, narrativeTemplate?: string): AttachmentEffect =>
    ({ type: 'action_trigger', on, payload: { kind: 'condition_grant', conditionTraitId, durationTicks }, probability, cooldownTicks, ...(narrativeTemplate ? { narrativeTemplate } : {}) } as AttachmentEffect),
  charge: (charges: number, reach: ReachDomain, value: number): AttachmentEffect => ({ type: 'consumable_charge', charges, onUse: { reach, value }, destroyOnEmpty: true } as AttachmentEffect),
  stack: (reach: ReachDomain, valuePerStack: number, maxStacks: number, decayPerTick: number): AttachmentEffect =>
    ({ type: 'stacking', stackOn: 'on_damaged', reach, valuePerStack, maxStacks, decayPerTick } as AttachmentEffect),
  cycle: (activeTicks: number, cooldownTicks: number, reach: ReachDomain, value: number): AttachmentEffect =>
    ({ type: 'cooldown', activeTicks, cooldownTicks, reach, value } as AttachmentEffect),
  suppress: (hexes: number): AttachmentEffect => ({ type: 'suppress', target: 'all_effects', scope: { scope: 'radius', hexes }, ticks: 2 } as AttachmentEffect),
  slot: (slotTag: string, bonus: number): AttachmentEffect => ({ type: 'slot_bonus', slotTag, bonus }),
};

const boon = (effect: AttachmentEffect): ItemGenPart => ({ effect, role: 'boon' });
const bane = (effect: AttachmentEffect): ItemGenPart => ({ effect, role: 'catch' });
/** A breakable thing breaks on a critical failure, at the band's chance. */
const breaks = (c: ItemGenBuildCtx, line: string): ItemGenPart => {
  c.lossCondition = 'breakable';
  const band = Math.min(3, c.band) as 1 | 2 | 3;
  return bane(fx.trig('encounter_critical_failure', { kind: 'self_remove' }, { probability: ITEM_GEN_BREAK_CHANCE_BY_BAND[band], cooldownTicks: 0, narrativeTemplate: line }));
};
/** A curse that feeds on its bearer: a slow quintessence drain, and the Cursed trait. */
const feeds = (c: ItemGenBuildCtx): ItemGenPart => {
  c.stampCursed = true;
  return bane(fx.quint(c.fixed('thinning')));
};
/** Draw a virtue a worthy hand must carry, leaning to the item's sphere. */
const drawVirtue = (c: ItemGenBuildCtx) => {
  const id = c.draw('virtue', Object.fromEntries(Object.entries(ITEM_GEN_VIRTUES).map(([k, v]) => [k, 1 + (v.spheres[c.sphere] ?? 0)]))) ?? 'trait.core.core_integrity.virtue';
  c.virtue = { id, word: ITEM_GEN_VIRTUES[id].word, adj: ITEM_GEN_VIRTUES[id].adj };
  return id;
};

// Conditions the catches grant — ids checked against the live catalog by the validator.
const NIGHTMARES = 'reward_condition_nightmares';
const GRIEVING = 'trait.condition.grieving';
const SHAKEN = 'trait.condition.shaken';
const WATCH = 'reward_condition_watch_scrutiny';

// ─── The cores ────────────────────────────────────────────────────────

export const ITEM_GEN_CORES: readonly ItemGenCore[] = [
  // ── Masterwork-eligible: things a mortal can make ─────────────────────
  {
    id: 'blood_hungry', label: 'the blade that wants blood', bands: [2, 3, 4], weight: 1.2, origins: ['masterwork', 'found'],
    forms: { sword: 3, axe: 2, knife: 1, spear: 1 }, reaches: { iron: 1 },
    spheres: { force: 3, entropy: 2, chaos: 2, darkness: 2, energy: 1 },
    factions: { mercenary_company: 3, adventuring_guild: 1, underking_court: 1 },
    heroes: { bram_oskell: 3, tamsin_weir: 1, hesta_ryle: 1 }, events: { kel_siege: 2, greywater_stand: 1, salt_riots: 1 },
    family: ['#combat'],
    looks: ['its edge nicked in a dozen places and never once dull', 'with a grip that is always warm', 'wrapped at the hilt in cord gone black and stiff'],
    provenance: [
      { made: true, tone: 'ominous', uses: ['maker'], text: '{maker} made it to a plain pattern. Something got into it afterwards.' },
      { made: true, tone: 'martial', uses: ['maker', 'faction'], text: '{maker} made it for {faction.the}, who have been glad of it ever since, and a little afraid of it.' },
      { made: true, tone: 'ominous', uses: ['maker', 'place'], text: '{maker} made it at {place}. The forge there has not burned clean since.' },
      { tone: 'ominous', uses: ['hero'], text: 'It belonged to {hero}, {hero.deed}. {hero.They} never lost a fight with it, and never once put it down.' },
      { tone: 'martial', uses: ['faction'], text: '{faction.Members} pass it to whoever is left standing after a battle. It has had a great many owners.' },
      { tone: 'ominous', uses: ['event'], text: 'It was found on the field after {event}, standing upright in the mud with nobody near it.' },
      { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} made it to a plain pattern. Something got into it afterwards.' },
    ],
    names: { definite: ['Hungry', 'Red', 'Unquiet', 'Glad'], xofy: ['the Red Harvest', 'Many Widows', 'the Long Grudge'], role: ['Headsman', 'Reaver'] },
    grammar: { definite: 3, portmanteau: 3, xofy: 2, person: 2, material: 1 },
    signatures: [
      {
        id: 'seeks_the_fight', label: 'fights harder, and goes looking for fights',
        build(c) {
          const pick = c.draw('catch', { drag: 3, drift: 3, thin: c.band >= 3 ? 2 : 0 });
          const out = [boon(fx.passive('iron', c.mag('passive'))), boon(fx.stat({ iron: c.mag('stat') })), boon(fx.cond('in_combat', 'heart', c.mag('conditional')))];
          if (c.band === 4) out.push(boon(fx.stack('iron', 0.02, 3, 0.25)));
          if (pick === 'drag') out.push(bane(fx.drag('iron', c.mag('behavior'))));
          if (pick === 'drift') out.push(bane(fx.vice('iron', c.mag('drift'))));
          if (pick === 'thin') out.push(feeds(c));
          return out;
        },
      },
      {
        id: 'cold_hand', label: 'steadies the nerve, and costs its bearer with people',
        build(c) {
          const out = [boon(fx.passive('iron', c.mag('passive'))), boon(fx.cond('in_combat', 'heart', c.mag('conditional'))), boon(fx.stat({ iron: c.mag('stat', 1) }))];
          if (c.band === 4) out.push(boon(fx.stack('iron', 0.02, 3, 0.25)));
          out.push(bane(fx.passive('heart', -c.mag('penalty'))), bane(fx.stat({ heart: -c.mag('statPenalty') })));
          return out;
        },
      },
    ],
  },
  {
    id: 'shows_the_dead', label: 'the lantern that shows the dead', bands: [2, 3, 4], weight: 1, origins: ['masterwork', 'found'],
    forms: { lantern: 3, bell: 1, mirror: 1 }, reaches: { veil: 3, eye: 2 },
    spheres: { spirit: 3, darkness: 2, time: 2, entropy: 1 },
    factions: { temple_of_spheres: 2, holy_order_dawn: 1 },
    heroes: { maren_doss: 2, sister_maud: 1, tamsin_weir: 1 }, events: { drowning: 3, kel_siege: 1, plague_year: 2 },
    family: ['#vision', '#supernatural'],
    looks: ['its glass fogged from the inside', 'with a wick that burns a thin, cold blue', 'green with verdigris, on a short chain'],
    looksByForm: { bell: ['with a clapper wrapped in black cloth', 'green with verdigris, on a short chain'], mirror: ['its glass fogged from the inside', 'that shows the room a little darker than it is'] },
    provenance: [
      { made: true, tone: 'mystical', uses: ['maker'], text: '{maker} made it to light a sickroom. It has shown more than the sick since.' },
      { made: true, tone: 'ominous', uses: ['maker', 'place'], text: '{maker} made it at {place}, and swears it fogged over before it was ever finished.' },
      { tone: 'mystical', uses: ['event'], text: 'It was taken from {event.place} after {event}. {form.It} still {form.works} on its own some nights.' },
      { tone: 'reverent', uses: ['faction'], text: '{faction.The} give one to each keeper who sits with the dying. This one was never handed back.' },
      { tone: 'ominous', uses: ['hero'], text: '{hero} used it to look for the people {hero.they} lost. {hero.They} found them.' },
    ],
    names: { definite: ['Grey', 'Mourning', 'Blue', 'Last'], xofy: ['the Drowned', 'the Unburied', 'the Low Watch', 'Old Names'], role: ['Ferryman', 'Gravewarden', 'Mourner'] },
    grammar: { xofy: 3, role: 2, definite: 2, portmanteau: 2 },
    signatures: [
      {
        id: 'sees_the_dead', label: "shows what the dead are about, and shows it at night too",
        build(c) {
          const out = [boon(fx.reveal('encounters', c.fixed('reveal') + (c.band === 4 ? 1 : 0))), boon(fx.cond('health_low', 'veil', c.mag('conditional')))];
          if (c.band >= 3) out.push(boon(fx.stat({ [c.reach]: c.mag('stat', 1) })));
          const pick = c.draw('catch', { nightmares: 3, grief: 2, thin_living: 2 });
          if (pick === 'nightmares') out.push(bane(fx.grant('encounter_failure', NIGHTMARES, 24, 0.3, 12, '{actor} sees the faces again that night.')));
          if (pick === 'grief') out.push(bane(fx.grant('encounter_failure', GRIEVING, 36, 0.25, 24, '{item_name} shows {actor} someone they lost.')));
          if (pick === 'thin_living') out.push(bane(fx.passive('heart', -c.mag('penalty'))));
          return out;
        },
      },
      {
        id: 'lights_the_way', label: 'lights the way for everyone near it, and shows its bearer who they lost',
        build(c) {
          const out = [boon(fx.aura(1, 'allies', c.reach, c.mag('aura'))), boon(fx.cond('alone', c.reach, c.mag('conditional')))];
          if (c.band >= 3) out.push(boon(fx.sight(1)));
          out.push(bane(fx.grant('encounter_failure', GRIEVING, 24, 0.3, 24, '{item_name} shows {actor} someone they lost.')));
          return out;
        },
      },
    ],
  },
  {
    id: 'bargain', label: 'the ring that bargains', bands: [2, 3, 4], weight: 1, origins: ['masterwork', 'found'],
    forms: { ring: 3, coin: 2, amulet: 1 }, reaches: { gold: 2, shadow: 2, heart: 1, iron: 1, star: 1 },
    spheres: { darkness: 3, chaos: 2, order: 1, time: 1 },
    factions: { underking_court: 4, thieves_guild: 1 },
    heroes: { corvin_hale: 3, ivo_tallow: 1 },
    family: ['#relic', '#curse'],
    looks: ['warm when it wants something', 'too heavy for its size', 'with a tiny pair of scales worked into it'],
    provenance: [
      { made: true, tone: 'ominous', uses: ['maker'], text: '{maker} made it to settle a debt. It has been settling debts ever since, on its own terms.' },
      { made: true, tone: 'ominous', uses: ['maker', 'faction'], text: '{maker} made it for {faction.the}, and was paid in full. It keeps an account of its own.' },
      { tone: 'ominous', uses: ['faction'], text: '{faction.The} lend these out. They are never given, and the loan is always repaid.' },
      { tone: 'ominous', uses: ['hero'], text: 'It belonged to {hero}, {hero.role} {hero.deed}. {hero.They} {hero.fate}.' },
      { tone: 'mystical', uses: [], text: 'Nobody made it. It turns up in the pocket of someone who badly needs a win, and it keeps an account.' },
    ],
    names: { definite: ['Honest', 'Fair', 'Patient', 'Smiling'], xofy: ['What Is Owed', 'Small Debts', 'Fair Terms', 'the Long Account'], role: ['Moneylender', 'Tollkeeper'] },
    grammar: { definite: 3, xofy: 3, role: 2, portmanteau: 1 },
    signatures: [
      {
        id: 'takes_its_due', label: 'turns near misses into wins, and takes a toll on every win',
        build(c) {
          const out = [boon(fx.shaper(c.fixed('shaperMargin'))), boon(fx.passive(c.reach, c.mag('passive')))];
          if (c.band >= 3) out.push(boon(fx.stat({ [c.reach]: c.mag('stat') })));
          out.push(bane(fx.trig('encounter_success', { kind: 'resource_delta', resource: 'quintessence', amount: -c.fixed('bargainCost') }, { cooldownTicks: 0, narrativeTemplate: '{item_name} takes its due from {actor}.' })));
          if (c.band >= 3) c.stampCursed = true;
          return out;
        },
      },
      {
        id: 'sharp_terms', label: 'drives a hard bargain, and makes its bearer a harder person to like',
        build(c) {
          c.reach = 'gold';
          const out = [boon(fx.passive('gold', c.mag('passive'))), boon(fx.social('any', 0.1)), boon(fx.stat({ gold: c.mag('stat', 1) }))];
          out.push(bane(fx.rule('faction_influence_multiplier', c.fixed('influenceCost'))), bane(fx.vice('gold', c.mag('drift'))));
          if (c.band >= 3) c.stampCursed = true;
          return out;
        },
      },
    ],
  },
  {
    id: 'nullstone', label: 'the stone that quiets magic', bands: [2, 3, 4], weight: 0.9, origins: ['masterwork', 'found'],
    forms: { stone: 3, amulet: 1, knife: 1 }, reaches: { stone: 2, eye: 1 },
    spheres: { order: 3, matter: 2, darkness: 1 },
    factions: { civic_guard: 1, lorekeepers_covenant: 1, builders_fellowship: 1 }, events: { library_burning: 1 },
    materials: { cold_iron: 6, greystone: 6, jet: 2, salt: 2 },
    family: ['#anti-magic'],
    looks: ['dull, and slightly too cold', 'that makes the air around it feel close', 'with no mark of any kind on it'],
    provenance: [
      { made: true, tone: 'practical', uses: ['maker'], text: '{maker} cut it and set it plain, and every charm in the workshop went quiet the day it was finished.' },
      { made: true, tone: 'practical', uses: ['maker', 'place'], text: '{maker} made it at {place}, where people who carry charms are not trusted.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.The} keep a few of these for dealing with people who carry charms. They do not talk about it.' },
      { tone: 'mystical', uses: ['event'], text: 'It was found in the ashes after {event}. Nothing near it had burned.' },
      { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} set one into the door of every house where a witch was born.' },
    ],
    names: { definite: ['Grey', 'Quiet', 'Dull', 'Cold'], xofy: ['Silence', 'the Closed Door'], role: ['Witchfinder'] },
    grammar: { definite: 3, portmanteau: 3, role: 1, xofy: 1 },
    signatures: [
      {
        id: 'quiet_radius', label: 'silences every charm nearby — its bearer\'s own included',
        build(c) {
          const out = [boon(fx.suppress(c.band === 4 ? 2 : 1)), boon(fx.passive(c.reach, c.mag('passive')))];
          if (c.band >= 3) out.push(boon(fx.immune(['#curse'])));
          c.catchNotes.push("Its bearer's own charms go quiet too — it does not pick sides.");
          return out;
        },
      },
      {
        id: 'curse_ward', label: 'turns a family of curses aside, and dulls its bearer to the stars',
        build(c) {
          const ward = c.draw('ward', { curse: 3, disease: 1 });
          const out = [boon(fx.immune([ward === 'disease' ? '#disease' : '#curse'])), boon(fx.passive('stone', c.mag('passive')))];
          if (c.band >= 3) out.push(boon(fx.stat({ stone: c.mag('stat', 1) })));
          c.reach = 'stone';
          out.push(bane(fx.passive('star', -c.mag('penalty'))));
          return out;
        },
      },
    ],
  },
  {
    id: 'forbidden_book', label: 'the book that should not be read', bands: [2, 3, 4], weight: 1, origins: ['masterwork', 'found'],
    forms: { book: 3, almanac: 1, ledger: 1 }, reaches: { veil: 3, eye: 2 },
    spheres: { mind: 3, darkness: 2, time: 2, entropy: 1 },
    factions: { arcane_circle: 3, lorekeepers_covenant: 2 },
    heroes: { old_vannic: 1 }, events: { library_burning: 3, long_winter: 1 },
    family: ['#knowledge', '#arcane'],
    looks: ['its clasp rusted shut and then broken open', 'written in a small, crowded hand that gets smaller towards the end', 'with every third page cut out'],
    provenance: [
      { made: true, tone: 'mystical', uses: ['maker'], text: '{maker} wrote it over one winter and will not say where the words came from.' },
      { made: true, tone: 'ominous', uses: ['maker', 'faction'], text: '{maker} copied it for {faction.the} from a book that is no longer anywhere.' },
      { tone: 'ominous', uses: ['hero', 'event'], text: '{hero} went back into the fire for it during {event}. {hero.They} {hero.fate}. The book did.' },
      { tone: 'mystical', uses: ['faction'], text: '{faction.The} list it among the books that are not to be copied. This is a copy.' },
      { tone: 'practical', uses: ['culture'], text: 'A {culture.adj} scribe wrote it over one winter and would not say where the words came from.' },
    ],
    names: { definite: ['Unread', 'Smaller', 'Last', 'Grey'], xofy: ['Unwritten Things', 'Old Names', 'the Long Winter'], role: ['Archivist', 'Heretic'] },
    grammar: { definite: 3, person: 2, xofy: 2, portmanteau: 1 },
    signatures: [
      {
        id: 'veil_insight', label: 'teaches fast, and changes whoever reads it',
        build(c) {
          const out = [boon(fx.rule('tier_advancement_cost_multiplier', c.fixed('growth'))), boon(fx.cond('alone', 'veil', c.mag('conditional'))), boon(fx.stat({ [c.reach]: c.mag('stat') }))];
          const pick = c.draw('catch', { shaken: 3, impatient: 2 });
          if (pick === 'shaken') out.push(bane(fx.grant('encounter_failure', SHAKEN, 24, 0.4, 12, '{actor} cannot stop thinking about the last chapter.')));
          if (pick === 'impatient') out.push(bane(fx.vice('veil', c.mag('drift'))));
          return out;
        },
      },
      {
        id: 'shows_what_moves', label: 'shows its reader what is happening far off, and gives them bad nights',
        build(c) {
          const out = [boon(fx.reveal('encounters', c.fixed('reveal') + 1)), boon(fx.stat({ [c.reach]: c.mag('stat') }))];
          if (c.band >= 3) out.push(boon(fx.cond('alone', c.reach, c.mag('conditional'))));
          out.push(bane(fx.grant('encounter_failure', NIGHTMARES, 36, 0.3, 24, '{actor} reads a page they cannot forget.')));
          return out;
        },
      },
    ],
  },
  {
    id: 'oath_object', label: 'the vow-bound thing', bands: [2, 3], weight: 1, origins: ['masterwork', 'found'],
    forms: { ring: 2, signet: 1, stole: 1, amulet: 1 }, reaches: {},
    spheres: { order: 3, light: 1, spirit: 1 },
    factions: { civic_guard: 3, holy_order_dawn: 3, builders_fellowship: 2, rangers_brotherhood: 2, mercenary_company: 1 },
    family: ['#relic', '#social'],
    looks: ['engraved on the inside with a short promise', 'plain, and heavier than it should be', 'with the mark of its order stamped deep'],
    provenance: [
      { made: true, tone: 'reverent', uses: ['maker', 'faction'], text: '{maker} made it for {faction.the}, to be given to members who take the full oath.' },
      { made: true, tone: 'practical', uses: ['maker'], text: '{maker} made it to seal a promise, and cut the promise into it.' },
      { tone: 'reverent', uses: ['faction'], text: '{faction.The} give it to members who take the full oath. Breaking the oath means handing it back.' },
      { tone: 'practical', uses: ['faction', 'hero'], needsFactionHero: true, text: 'It belonged to {hero}, {hero.deed}. {hero.They} kept the oath to the end, which is more than most.' },
    ],
    names: { definite: ['Sworn', 'Plain', 'Kept'], xofy: ['the Oath', 'Plain Dealing'], role: ['Oathkeeper'] },
    grammar: { role: 3, definite: 2, xofy: 2, portmanteau: 2 },
    signatures: [
      {
        id: 'sworn_to_the_order', label: "serves its order's calling, and forbids what its order forbids",
        build(c) {
          const oath = oathFor(c.faction);
          c.reach = oath.boon;
          return [
            boon(fx.passive(oath.boon, r2(c.mag('passive') * 1.2))),
            boon(fx.stat({ [oath.boon]: c.mag('stat') })),
            boon(fx.social('same_faction', 0.1)),
            bane(fx.gate(oath.forbid)),
          ];
        },
      },
      {
        id: 'true_hands', label: 'works for a worthy bearer, and fights anyone else',
        build(c) {
          const vid = drawVirtue(c);
          c.reach = oathFor(c.faction).boon;
          return [
            boon(fx.cond(`has_trait:${vid}`, c.reach, worthyBonus(c))),
            boon(fx.stat({ [c.reach]: c.mag('stat', 1) })),
            boon(fx.rule('faction_influence_multiplier', c.fixed('influence'))),
            bane(fx.cond(`lacks_trait:${vid}`, c.reach, -r2(c.mag('penalty') * 1.5))),
          ];
        },
      },
    ],
  },
  {
    id: 'war_banner', label: 'the standard that steadies the line', bands: [2, 3, 4], weight: 0.9, origins: ['masterwork', 'found'],
    forms: { banner: 3, horn: 2 }, reaches: { iron: 3, heart: 2 },
    spheres: { force: 2, order: 2, light: 1, energy: 1 },
    factions: { civic_guard: 2, mercenary_company: 3, holy_order_dawn: 1 },
    heroes: { hesta_ryle: 3, bram_oskell: 1 }, events: { greywater_stand: 3, kel_siege: 2 },
    family: ['#combat'],
    looks: ['torn along one edge and never mended', 'its colours faded to brown and grey'],
    looksByForm: { banner: ['torn along one edge and never mended', 'with a pole worn pale where hands gripped it', 'its colours faded to brown and grey'], horn: ['dented where it was used as a club', 'with a mouthpiece worn smooth', 'green with age along the bell'] },
    provenance: [
      { made: true, tone: 'martial', uses: ['maker', 'faction'], text: '{maker} made it for {faction.the}. The line has held under it every time since.' },
      { made: true, tone: 'martial', uses: ['maker'], text: '{maker} made it for a company that was short of courage. They are not short of it now.' },
      { tone: 'martial', uses: ['event'], text: 'It {form.at} {event}. The line held as long as it {form.held}.' },
      { tone: 'martial', uses: ['hero', 'event'], text: '{hero} {form.carried} it at {event}. {hero.They} {hero.fate}; {form.endure}.' },
    ],
    names: { definite: ['Torn', 'Last', 'Grey'], xofy: ['the Line'], role: ['Captain', 'Standard-bearer'] },
    grammar: { proper: 3, definite: 2, role: 2, portmanteau: 1 },
    signatures: [
      {
        id: 'steadies_the_line', label: 'steadies everyone who stands near it',
        build(c) {
          const out = [boon(fx.aura(c.band === 4 ? 2 : 1, 'allies', c.reach, c.mag('aura'))), boon(fx.social('same_faction', 0.15))];
          if (c.band >= 3) out.push(boon(fx.passive('heart', c.mag('passive', 1))));
          out.push(bane(fx.drag('iron', c.mag('behavior', 1))));
          return out;
        },
      },
      {
        id: 'last_stand', label: 'holds hardest when the odds are worst, and never lets its bearer back down',
        build(c) {
          c.reach = 'iron';
          const out = [boon(fx.cond('outnumbered', 'iron', c.mag('conditional'))), boon(fx.stat({ iron: c.mag('stat', 1) })), boon(fx.cond('in_combat', 'heart', c.mag('conditional', 1)))];
          if (c.band >= 3) out.push(boon(fx.ward(c.fixed('ward', 1), false)));
          out.push(bane(fx.gate('star')));
          return out;
        },
      },
    ],
  },
  {
    id: 'wanderer', label: 'road luck', bands: [2, 3], weight: 1, origins: ['masterwork', 'found'],
    forms: { compass: 3, staff: 2, boots: 2 }, reaches: { star: 1 },
    spheres: { time: 2, energy: 1, light: 1, chaos: 1, life: 1 },
    factions: { rangers_brotherhood: 2, merchant_consortium: 2, adventuring_guild: 2 },
    heroes: { arn_veck: 3, maren_doss: 2 },
    family: ['#travel'],
    looks: ['scuffed from a great many roads'],
    looksByForm: { compass: ['with a needle that settles a little too fast', 'scuffed from a great many roads'], staff: ['worn to a point at the foot', 'notched once for every border crossed'], boots: ['patched at the heel with three different leathers', 'scuffed from a great many roads'] },
    provenance: [
      { made: true, tone: 'practical', uses: ['maker'], text: '{maker} made it for a long road, and walked most of that road with it.' },
      { made: true, tone: 'practical', uses: ['maker', 'place'], text: '{maker} made it at {place} for travellers who pass through and never come back.' },
      { tone: 'practical', uses: ['hero'], text: 'It belonged to {hero}, {hero.deed}. {hero.They} {hero.fate}. It came back with someone else.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.Members} swap these at crossroads. Nobody remembers who made the first one.' },
    ],
    names: { definite: ['Long', 'Restless', 'Patient'], xofy: ['the Long Road', 'Far Places'], role: ['Walker', 'Pathfinder', 'Carter'] },
    grammar: { role: 3, person: 2, xofy: 2, portmanteau: 2 },
    signatures: [
      {
        id: 'swift_road', label: 'makes the road shorter, and makes staying put harder',
        build(c) {
          c.reach = 'star';
          return [
            boon(fx.move(c.fixed('movement'))), boon(fx.cond('in_wilderness', 'star', c.mag('conditional'))), boon(fx.reveal('hexes', c.fixed('reveal') + 1)),
            bane(fx.drag('star', c.mag('behavior'))),
          ];
        },
      },
      {
        id: 'far_sight', label: 'sees further down the road, and keeps its bearer from settling',
        build(c) {
          c.reach = 'star';
          const out = [boon(fx.sight(1)), boon(fx.reveal('hexes', c.fixed('reveal') + 1)), boon(fx.stat({ star: c.mag('stat', 1) }))];
          out.push(bane(fx.passive('stone', -c.mag('penalty'))));
          return out;
        },
      },
    ],
  },
  {
    id: 'merchant', label: "the trader's edge", bands: [2, 3], weight: 1, origins: ['masterwork', 'found'],
    forms: { scales: 3, ledger: 2, coin: 2, signet: 1 }, reaches: { gold: 1 },
    spheres: { matter: 2, order: 2, chaos: 1, light: 1 },
    factions: { merchant_consortium: 1 },
    heroes: { maren_doss: 3, ivo_tallow: 2 },
    family: ['#trade'],
    looks: ['polished bright by a great deal of counting'],
    looksByForm: { scales: ['with a lead weight that is not quite honest', 'polished bright by a great deal of counting'], coin: ['stamped with a mark and a date', 'polished bright by a great deal of counting'], ledger: ['in three different hands, all of them careful', 'with the last few pages torn out'], signet: ['cut with a trading mark', 'polished bright by a great deal of use'] },
    provenance: [
      { made: true, tone: 'practical', uses: ['maker', 'faction'], text: '{maker} made it for {faction.the}, who hand them only to factors who can count.' },
      { made: true, tone: 'practical', uses: ['maker'], text: '{maker} made it to be honest. It is honest in its maker\'s favour.' },
      { tone: 'practical', uses: ['hero'], text: 'It belonged to {hero}, {hero.deed}. {hero.They} never once came out of a deal worse off.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.The} hand these to factors who have proven they can count.' },
    ],
    names: { definite: ['Weighed', 'Honest', 'Bright'], xofy: ['Fair Terms', 'the Long Account'], role: ['Factor', 'Clerk', 'Salt-trader'] },
    grammar: { role: 3, material: 2, definite: 2, person: 1 },
    signatures: [
      {
        id: 'honest_weight', label: 'makes every deal a little better, and its bearer a little greedier',
        build(c) {
          c.reach = 'gold';
          const out = [boon(fx.passive('gold', c.mag('passive'))), boon(fx.social('any', 0.1)), boon(fx.stat({ gold: c.mag('stat', 1) }))];
          if (c.band === 3) out.push(boon(fx.rule('reward_tier_bonus', 1)));
          out.push(bane(fx.vice('gold', c.mag('drift'))));
          return out;
        },
      },
      {
        id: 'sharp_dealer', label: 'saves a deal that was going wrong, and other factions notice',
        build(c) {
          c.reach = 'gold';
          const out = [boon(fx.shaper(c.fixed('shaperMargin'), 'gold')), boon(fx.passive('gold', c.mag('passive', 1)))];
          if (c.band === 3) out.push(boon(fx.stat({ gold: c.mag('stat', 1) })));
          out.push(bane(fx.social('different_faction', -0.15)));
          return out;
        },
      },
    ],
  },
  {
    id: 'thieves_kit', label: 'tools of a quiet trade', bands: [2], weight: 1, origins: ['masterwork', 'found'],
    forms: { picks: 3, boots: 2, knife: 1 }, reaches: { shadow: 1 },
    spheres: { darkness: 3, chaos: 1 },
    factions: { thieves_guild: 1 }, heroes: { ivo_tallow: 1 },
    family: ['#stealth'],
    looks: ['wrapped in a roll of oiled cloth', 'blacked with soot so it will not shine', "worn to the shape of someone else's hand"],
    provenance: [
      { made: true, tone: 'practical', uses: ['maker'], text: '{maker} made it for quiet work, and sold it on when the Watch came asking.' },
      { made: true, tone: 'practical', uses: ['maker', 'faction'], text: '{maker} made it for {faction.the}, who lend these to new members. Losing one costs a finger.' },
      { tone: 'practical', uses: ['hero'], text: '{hero}, {hero.deed}, sold it on. It has been sold several times since.' },
      { tone: 'practical', uses: ['faction'], text: '{faction.The} lend these to new members. Losing one costs a finger.' },
    ],
    names: { definite: ['Quiet', 'Soft'], role: ['Cutpurse', 'Burglar', 'Housebreaker'] },
    grammar: { role: 4, material: 2, person: 1, definite: 1 },
    signatures: [
      {
        id: 'quiet_hands', label: 'works best alone, and the Watch knows it on sight',
        build(c) {
          c.reach = 'shadow';
          return [
            boon(fx.cond('alone', 'shadow', c.mag('conditional', 1))), boon(fx.passive('shadow', c.mag('passive'))), boon(fx.move(c.fixed('movement'))),
            bane(fx.grant('encounter_critical_failure', WATCH, 36, 1, 24, 'The Watch knows these tools, and now it knows {actor}.')),
          ];
        },
      },
      {
        id: 'slip_away', label: 'gets its bearer out of a job gone wrong, and teaches them to lie',
        build(c) {
          c.reach = 'shadow';
          return [
            boon(fx.shaper(c.fixed('shaperMargin'), 'shadow')), boon(fx.stat({ shadow: c.mag('stat', 1) })), boon(fx.passive('shadow', c.mag('passive', 1))),
            bane(fx.vice('shadow', c.mag('drift'))),
          ];
        },
      },
    ],
  },
  {
    id: 'made_past_skill', label: "gear made past its maker's skill", bands: [2, 3], weight: 1, origins: ['masterwork', 'found'],
    forms: { sword: 2, axe: 1, spear: 2, mail: 1, helm: 1, coat: 1, bow: 1 }, reaches: {},
    spheres: { matter: 3, order: 2, force: 2 },
    factions: { civic_guard: 2, builders_fellowship: 1, mercenary_company: 2 },
    family: ['#combat', '#craft'],
    looks: ["with a maker's mark punched near the grip", 'mended once, very neatly', 'plain, and oiled, and ready'],
    looksByForm: { mail: ['mended once, very neatly', 'with every ring riveted by hand'], helm: ['dented once and hammered out', 'with the lining replaced more than once'], coat: ['mended once, very neatly', 'stiff with oil against the rain'] },
    provenance: [
      { made: true, tone: 'practical', uses: ['maker'], text: '{maker} made it to do one job well, and it came out better than anything {maker} has made since.' },
      { made: true, tone: 'practical', uses: ['maker', 'culture'], text: '{culture.Adj} {craft} taught {maker} to make things plain. This one came out better than plain.' },
      { made: true, tone: 'practical', uses: ['maker', 'place'], text: '{maker} made it at {place}. People there still ask how.' },
      { tone: 'practical', uses: ['culture'], text: '{culture.Adj} {craft} made it to do one job well, and it has done a great deal of that.' },
      { tone: 'practical', uses: ['faction'], text: 'It was issued by {faction.the} to a {faction.role}, and never handed back.' },
    ],
    names: { role: ['Soldier', 'Quartermaster'] },
    grammar: { material: 4, role: 2, person: 2, definite: 1 },
    signatures: [
      {
        id: 'well_made', label: 'does its one job very well, until the day it breaks',
        build(c) {
          const r: ReachDomain = c.formKind === 'arms' ? 'iron' : 'stone';
          c.reach = r;
          const out = [boon(fx.passive(r, c.mag('passive'))), boon(fx.stat({ [r]: c.mag('stat') }))];
          if (c.formKind !== 'arms') out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))));
          out.push(breaks(c, '{item_name} breaks.'));
          return out;
        },
      },
      {
        id: 'too_good', label: 'so good its bearer reaches for it first, every time',
        build(c) {
          const r: ReachDomain = c.formKind === 'arms' ? 'iron' : 'stone';
          c.reach = r;
          const out = [boon(fx.passive(r, c.mag('passive', 1))), boon(fx.stat({ [r]: c.mag('stat') }))];
          out.push(boon(c.formKind === 'arms' ? fx.cond('outnumbered', 'iron', c.mag('conditional', 1)) : fx.cond('in_combat', 'heart', c.mag('conditional', 1))));
          out.push(bane(fx.drag(r, c.mag('behavior'))));
          return out;
        },
      },
    ],
  },

  // ── Found things: a past, not a maker ─────────────────────────────────
  {
    id: 'chose_bearer', label: 'the weapon that chose its bearer', bands: [3, 4], weight: 1, origins: ['found'],
    forms: { sword: 3, spear: 2, bow: 1 }, reaches: { iron: 1 },
    spheres: { light: 2, order: 2, spirit: 2, force: 1, life: 1 },
    factions: { civic_guard: 2, rangers_brotherhood: 1, mercenary_company: 1 },
    heroes: { hesta_ryle: 3, arn_veck: 2, bram_oskell: 1 },
    family: ['#combat', '#relic'],
    looks: ['with a plain grip and no ornament at all', 'wrapped in a faded ribbon nobody has dared to take off', "with a name scratched into the tang in a child's hand"],
    provenance: [
      { tone: 'martial', uses: ['hero'], text: 'It was carried by {hero}, {hero.deed}. Since {hero.they} {hero.fate}, it has only answered to a {virtue.word} hand.' },
      { tone: 'reverent', uses: ['hero', 'faction'], text: '{faction.The} keep it for whoever is worthy of {hero}, {hero.deed}. Most who try it put it down again.' },
      { tone: 'mystical', uses: ['hero'], text: 'It went into the ground with {hero}. It came back up on its own, and it is still looking for someone {virtue.word}.' },
    ],
    names: { role: ['Warden', 'Champion'] },
    grammar: { definite: 4, person: 3, proper: 2, portmanteau: 1 },
    signatures: [
      {
        id: 'worthy_hand', label: 'fights for a worthy bearer, and against anyone else',
        build(c) {
          const vid = drawVirtue(c);
          return [
            boon(fx.cond(`has_trait:${vid}`, 'iron', worthyBonus(c))),
            boon(fx.passive('iron', c.mag('passive', 1))),
            boon(fx.stat({ iron: c.mag('stat') })),
            bane(fx.cond(`lacks_trait:${vid}`, 'iron', -r2(c.mag('penalty') * 1.5))),
          ];
        },
      },
      {
        id: 'guards_its_bearer', label: 'keeps its bearer standing against the odds, and will not be used from the dark',
        build(c) {
          drawVirtue(c);
          return [
            boon(fx.cond('outnumbered', 'iron', c.mag('conditional'))),
            boon(fx.stat({ iron: c.mag('stat') })),
            boon(fx.ward(c.fixed('ward', 1), false)),
            bane(fx.gate('shadow')),
          ];
        },
      },
    ],
  },
  {
    id: 'deathless', label: 'the thing that will not let you die', bands: [4], weight: 1, origins: ['found'],
    forms: { amulet: 2, locket: 2, reliquary: 1 }, reaches: { stone: 2, heart: 1 },
    spheres: { time: 3, spirit: 2, entropy: 2, darkness: 1 },
    factions: { underking_court: 2, temple_of_spheres: 1 },
    heroes: { wenna_kell: 1 }, events: { kel_siege: 1, long_winter: 2, drowning: 1 },
    family: ['#relic', '#cursed', '#ancient'],
    looks: ['that ticks faintly, like a slow heart', 'with a lock of grey hair behind cracked glass', 'cold, except against skin'],
    provenance: [
      { tone: 'ominous', uses: ['hero'], text: '{hero}, {hero.deed}, wore it for longer than anyone could remember. {hero.They} never died. In the end there was not enough of {hero.them} left to.' },
      { tone: 'ominous', uses: ['event'], text: 'Its last bearer walked out of {event} without a scratch, and was a ghost of a person within the year.' },
    ],
    names: { definite: ['Stubborn', 'Unfinished', 'Patient'], xofy: ['Many Winters', 'the Held Breath'] },
    grammar: { definite: 3, xofy: 2, person: 1 },
    signatures: [
      {
        id: 'will_not_die', label: 'will not let its bearer die, and eats them slowly instead',
        build(c) {
          return [boon(fx.rule('death_prevented', true)), boon(fx.stat({ [c.reach]: c.mag('stat', 1) })), feeds(c)];
        },
      },
      {
        id: 'held_breath', label: 'will not let its bearer die, and will not let them beg',
        build(c) {
          c.stampCursed = true;
          return [boon(fx.rule('death_prevented', true)), boon(fx.passive(c.reach, c.mag('passive', 1))), bane(fx.gate('heart')), bane(fx.rule('duration_decay_multiplier', 0.8))];
        },
      },
    ],
  },
  {
    id: 'saints_relic', label: "a saint's relic", bands: [2, 3, 4], weight: 1, origins: ['found'],
    forms: { reliquary: 3, stole: 1, bell: 1 }, reaches: { heart: 2, star: 2, stone: 1 },
    spheres: { spirit: 3, light: 3, life: 2 },
    factions: { holy_order_dawn: 3, temple_of_spheres: 2 },
    heroes: { sister_maud: 4, father_gall: 3 },
    family: ['#divine', '#relic', '#healing'],
    looks: ['worn thin where the faithful have kissed it', 'with a glass window gone milky with age'],
    looksByForm: { reliquary: ['holding a finger-bone wrapped in faded red silk', 'worn thin where the faithful have kissed it', 'with a glass window gone milky with age'], stole: ['embroidered with a small, crooked sun', 'worn thin where the faithful have kissed it'], bell: ['that rings softer than it should', 'worn thin where the faithful have kissed it'] },
    provenance: [
      { tone: 'reverent', uses: ['hero', 'faction'], text: '{form.Holds} {hero}, {hero.deed}. {faction.The} carry it to places the sick cannot leave.' },
      { tone: 'reverent', uses: ['hero'], text: '{hero} {hero.fate}. The sick who pray at {hero.their} grave still go home well.' },
    ],
    names: { definite: ['Dawn', 'Mended', 'Quiet'], xofy: ['the Low Watch', 'the Vigil', 'the Last Week'], role: ['Pilgrim', 'Sexton'] },
    grammar: { proper: 4, xofy: 2, definite: 1, person: 2 },
    signatures: [
      {
        id: 'heals', label: 'turns sickness aside and speeds healing, and will not be carried into crime',
        build(c) {
          const sickness = c.draw('ward', { disease: c.hero?.id === 'sister_maud' ? 4 : 1, curse: c.hero?.id === 'father_gall' ? 4 : 1 });
          const out = [boon(fx.immune([sickness === 'curse' ? '#curse' : '#disease'])), boon(fx.rule('healing_multiplier', c.fixed('healing')))];
          if (c.band >= 3) out.push(boon(fx.aura(1, 'allies', c.reach, c.mag('aura'))));
          if (c.band >= 3) out.push(boon(fx.hex('divineInfluence', c.fixed('holy'))));
          out.push(bane(fx.gate('shadow')));
          return out;
        },
      },
      {
        id: 'pilgrims_comfort', label: 'shelters its bearer and the people near them, and will not be carried into violence',
        build(c) {
          const out = [boon(fx.ward(c.fixed('ward'), false)), boon(fx.social('any', 0.1)), boon(fx.immune(['#disease']))];
          if (c.band >= 3) out.push(boon(fx.aura(1, 'allies', 'heart', c.mag('aura'))));
          out.push(bane(fx.gate('iron')));
          return out;
        },
      },
    ],
  },
  {
    id: 'blight', label: 'the relic that sours the land', bands: [3, 4], weight: 0.8, origins: ['found'],
    forms: { idol: 3, knife: 1, amulet: 1 }, reaches: { veil: 2, shadow: 2 },
    spheres: { entropy: 4, darkness: 2, chaos: 2 },
    events: { plague_year: 3, drowning: 1 }, monsterSpheres: { entropy: 1 },
    family: ['#relic', '#curse', '#ancient'],
    looks: ['carved from something that was once alive', 'with a face worn off by the hands of whoever prayed to it', 'that leaves a grey smear on anything it rests on'],
    looksByForm: { knife: ['with a blade gone grey and pitted', 'that leaves a grey smear on whatever it cuts'], amulet: ['that leaves a grey smear on the skin under it', 'with a face worn off by the hands of whoever prayed to it'] },
    materials: { bone: 6, bog_oak: 4, jet: 4, bog_iron: 3 },
    provenance: [
      { tone: 'ominous', uses: ['event'], text: 'It was dug up in {event.place} the spring after {event}. The field it came from has not grown anything since.' },
      { tone: 'ominous', uses: ['monster'], text: '{monster.One} carried it. When the thing was burned, this was all that did not.' },
    ],
    names: { definite: ['Black', 'Grey', 'Hungry'], xofy: ['the Plague Year', 'Bad Harvests', 'the Grey Field'] },
    grammar: { definite: 3, portmanteau: 3, xofy: 2 },
    signatures: [
      {
        id: 'grey_gift', label: 'gives its bearer a dark knack, and sours every field they rest by',
        build(c) {
          return [
            boon(fx.passive(c.reach, c.mag('passive'))),
            boon(fx.cond(c.reach === 'veil' ? 'health_low' : 'alone', c.reach, c.mag('conditional', 1))),
            boon(fx.stat({ [c.reach]: c.mag('stat') })),
            bane(fx.hex('corruption', c.fixed('corruption'))),
          ];
        },
      },
      {
        id: 'feeds_on_land', label: 'feeds its bearer off the land, and the land dies for it',
        build(c) {
          return [
            boon(fx.quint(c.fixed('restore'))),
            boon(fx.cond('health_low', c.reach, c.mag('conditional'))),
            boon(fx.stat({ [c.reach]: c.mag('stat', 1) })),
            bane(fx.hex('corruption', c.fixed('corruption'))),
            bane(fx.social('any', -0.1)),
          ];
        },
      },
    ],
  },
  {
    id: 'heirloom', label: 'the heirloom', bands: [2, 3], weight: 1, origins: ['found'],
    forms: { signet: 3, sword: 1, cloak: 1, locket: 1 }, reaches: { heart: 3, gold: 2 },
    spheres: { order: 2, time: 2, spirit: 1, light: 1 },
    factions: { underking_court: 2, merchant_consortium: 2, civic_guard: 1 },
    heroes: { hesta_ryle: 1, maren_doss: 2, corvin_hale: 2, bram_oskell: 1 },
    family: ['#relic', '#social'],
    looks: ['worn thin by a great many owners', 'with the family mark half rubbed away', 'mended more than once, each time by a different hand'],
    provenance: [
      { tone: 'reverent', uses: ['hero'], text: 'It has been in the {hero.family} family longer than anyone can say. {hero} was the last to wear it openly.' },
      { tone: 'practical', uses: ['hero', 'faction'], text: 'The {hero.family} name still opens doors among {faction.the}, and this is how people know the name.' },
      { tone: 'ominous', uses: ['hero'], text: 'The {hero.family} family want it back. {hero} was the last of them to own it honestly.' },
    ],
    names: { definite: ['Old', 'Worn'] },
    grammar: { house: 4, definite: 1, person: 2 },
    signatures: [
      {
        id: 'opens_doors', label: 'opens doors among its own people, and closes them among everyone else',
        build(c) {
          return [
            boon(fx.cond('at_home_territory', c.reach, c.mag('conditional'))),
            boon(fx.rule('faction_influence_multiplier', c.fixed('influence'))),
            boon(fx.social('same_faction', c.band === 3 ? 0.2 : 0.15)),
            bane(fx.social('different_faction', -0.15)),
          ];
        },
      },
      {
        id: 'family_fortune', label: "carries its family's luck in trade, and its family's appetite",
        build(c) {
          c.reach = 'gold';
          const out = [boon(fx.passive('gold', c.mag('passive'))), boon(fx.stat({ gold: c.mag('stat', 1) })), boon(fx.social('any', 0.1))];
          out.push(bane(fx.drag('gold', c.mag('behavior'))));
          return out;
        },
      },
    ],
  },
  {
    id: 'beast_trophy', label: 'a trophy taken from a monster', bands: [2, 3], weight: 1.1, origins: ['found'],
    forms: { knife: 2, cloak: 2, charm: 3, bow: 1, spear: 1 }, reaches: {},
    spheres: {},
    factions: { rangers_brotherhood: 3, adventuring_guild: 3, mercenary_company: 1 },
    heroes: { arn_veck: 2, tamsin_weir: 2 },
    monsterSpheres: { force: 3, energy: 2, spirit: 2, entropy: 2, matter: 1, time: 1, life: 2, mind: 1 },
    trophy: true, family: ['#wilderness'],
    looks: ['still smelling faintly of the animal', 'bound with sinew and not much else', 'scarred where it was cut free'],
    provenance: [
      { tone: 'martial', uses: ['monster', 'hero'], text: '{hero} took it from {monster.one} and wore it home as proof.' },
      { tone: 'practical', uses: ['monster', 'faction'], text: '{faction.Members} cut these from {monster} to sell. This one was not sold.' },
      { tone: 'martial', uses: ['monster'], text: 'It was taken from {monster.one} near {monster.place} by someone who did not live long enough to boast about it.' },
    ],
    names: { role: ['Hunter', 'Trapper'] },
    grammar: { material: 3, role: 2, portmanteau: 2, person: 1 },
    signatures: [
      {
        id: 'wild_strength', label: "carries some of the beast's strength into the wilds",
        build(c) {
          const r = c.reach;
          const out = [boon(fx.cond('in_wilderness', r, c.mag('conditional', 1)))];
          if (c.formKind === 'arms') out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))), boon(fx.passive('iron', c.mag('passive', 1))));
          else out.push(boon(fx.passive(r, c.mag('passive'))));
          out.push(boon(fx.stat({ [r]: c.mag('stat', 1) })));
          if (c.monster?.immune) out.push(boon(fx.immune([c.monster.immune])));
          else out.push(bane(fx.drag('iron', c.mag('behavior', 1))));
          return out;
        },
      },
      {
        id: 'hunters_mark', label: 'shows its bearer where the next beast is, and makes them want it',
        build(c) {
          const out = [boon(fx.reveal('encounters', c.fixed('reveal') + 1)), boon(fx.cond('in_wilderness', c.reach, c.mag('conditional')))];
          if (c.band >= 3) out.push(boon(fx.stat({ [c.reach]: c.mag('stat', 1) })));
          out.push(bane(fx.drag('iron', c.mag('behavior'))));
          return out;
        },
      },
    ],
  },
  {
    id: 'disaster_salvage', label: 'salvage from a disaster', bands: [2, 3], weight: 1.1, origins: ['found'],
    forms: { bell: 2, helm: 2, sword: 1, cloak: 1 }, reaches: {},
    spheres: {}, events: { drowning: 3, kel_siege: 2, greywater_stand: 2, library_burning: 2, long_winter: 2, falling_stars: 2 },
    factions: { lorekeepers_covenant: 1, civic_guard: 1 },
    family: ['#ruins'],
    looks: ['dented, and kept that way on purpose'],
    looksByEvent: {
      flood: ['crusted with old salt', 'stained green up to where the water came'], siege: ['dented, and kept that way on purpose', 'with frost-cracks in it that never close'],
      last_stand: ['dented, and kept that way on purpose', 'nicked all along one edge'], fire: ['blackened down one side', 'its edges burnt brown and brittle'],
      winter: ['patched with fur at every seam', 'stiff, as if it has never quite thawed'], starfall: ['with a faint grain in it like frost on a window', 'that ticks now and then, as if still cooling'],
      plague: ['that nobody will hold for long', 'scrubbed raw and still grey'], riot: ['with a boot-print pressed into it', 'bent where it was trodden on'],
    },
    provenance: [
      { tone: 'ominous', uses: ['event'], text: '{event.salvage} {event.lingers}' },
      { tone: 'reverent', uses: ['event'], text: '{event.salvage} People who were there still know it on sight.' },
    ],
    names: { definite: ['Last'] },
    definiteByEvent: { flood: ['Drowned', 'Salt'], siege: ['Cold', 'Last'], last_stand: ['Last', 'Unbroken'], fire: ['Burnt', 'Unburnt'], winter: ['Frozen', 'Winter'], starfall: ['Fallen', 'Burning'], plague: ['Grey', 'Last'], riot: ['Trodden', 'Last'] },
    grammar: { proper: 4, definite: 3, portmanteau: 1 },
    formsByEvent: {
      flood: { bell: 3, helm: 1, cloak: 1 }, siege: { helm: 2, sword: 2, spear: 1 }, last_stand: { helm: 1, sword: 1, spear: 2 },
      fire: { book: 1 }, starfall: { sword: 2, amulet: 1, knife: 1 }, winter: { cloak: 3, boots: 1 },
    },
    materialsByEvent: { fire: { scorched: 50 }, starfall: { star_metal: 50 }, flood: { bog_iron: 4, bronze: 3, sailcloth: 4 } },
    signatures: [
      {
        id: 'what_it_survived', label: 'carries the thing it survived — the water, the siege, the fire',
        build(c) {
          const kind = c.event?.kind;
          const out: ItemGenPart[] = [];
          if (kind === 'flood') {
            c.reach = 'stone';
            out.push(boon(fx.cond('near_water', 'stone', c.mag('conditional', 1))), boon(fx.stat({ stone: c.mag('stat') })));
            out.push(bane(fx.grant('encounter_failure', GRIEVING, 24, 0.25, 24, '{item_name} rings once, with nobody touching it.')));
          } else if (kind === 'siege' || kind === 'last_stand' || kind === 'riot') {
            c.reach = 'iron';
            out.push(boon(fx.cond('outnumbered', 'iron', c.mag('conditional', 1))), boon(fx.stat({ iron: c.mag('stat', 1) })));
            if (c.band === 3) out.push(boon(fx.ward(c.fixed('ward'), false)));
            out.push(bane(fx.drag('iron', c.mag('behavior', 1))));
          } else if (kind === 'fire') {
            c.reach = 'eye';
            out.push(boon(fx.rule('tier_advancement_cost_multiplier', c.fixed('growth'))), boon(fx.passive('eye', c.mag('passive'))));
            out.push(bane(fx.grant('encounter_failure', SHAKEN, 24, 0.25, 24, '{actor} smells smoke that is not there.')));
          } else if (kind === 'winter') {
            c.reach = 'stone';
            out.push(boon(fx.cond('in_wilderness', 'stone', c.mag('conditional', 1))), boon(fx.stat({ stone: c.mag('stat') })));
            out.push(bane(fx.rule('duration_decay_multiplier', 0.8)));
            c.catchNotes.push('Double-edged: it slows every countdown on its bearer, good or bad.');
          } else if (kind === 'starfall') {
            c.reach = 'star';
            out.push(boon(fx.cycle(4, 8, 'star', r2(c.mag('passive') * 1.4))), boon(fx.stat({ star: c.mag('stat') })));
            out.push(bane(fx.passive('heart', -c.mag('penalty'))));
          } else {
            c.reach = 'stone';
            out.push(boon(fx.cond('health_low', 'stone', c.mag('conditional'))), boon(fx.stat({ stone: c.mag('stat', 1) })));
            out.push(bane(fx.grant('encounter_failure', GRIEVING, 24, 0.25, 24)));
          }
          return out;
        },
      },
      {
        id: 'survivor', label: "keeps its bearer alive the way it kept itself, and remembers who it didn't",
        build(c) {
          c.reach = 'stone';
          const out = [boon(fx.ward(c.fixed('ward'), false)), boon(fx.cond('health_low', 'stone', c.mag('conditional'))), boon(fx.stat({ stone: c.mag('stat', 1) }))];
          out.push(bane(fx.grant('encounter_failure', GRIEVING, 24, 0.25, 24, '{item_name} reminds {actor} who did not come back.')));
          return out;
        },
      },
    ],
  },
  {
    id: 'mount', label: 'a beast worth its keep', bands: [2, 3], weight: 1, origins: ['found'],
    forms: { horse: 3, warhorse: 2, mule: 2, hound: 2, hawk: 1 }, reaches: {},
    spheres: { life: 3, force: 1, energy: 1, time: 1 },
    factions: { rangers_brotherhood: 2, civic_guard: 1, merchant_consortium: 1 },
    heroes: { arn_veck: 2, hesta_ryle: 1 },
    family: ['#travel'],
    looks: ['with a white scar across the shoulder', 'patient with strangers and nobody else', 'going grey around the muzzle'],
    looksByForm: { hawk: ['with one torn flight-feather', 'that will only take meat from one hand'], hound: ['with one ear torn', 'that sleeps across the doorway'] },
    provenance: [
      { tone: 'practical', uses: ['place'], text: 'It was bred at {place}. The breeders there still ask after it.' },
      { tone: 'martial', uses: ['hero'], text: "It was {hero.possessive}. It came home without {hero.them}, and would not let anyone near it for a month." },
    ],
    names: {},
    grammar: { given: 1 },
    signatures: [
      {
        id: 'good_at_its_work', label: 'does the work it was bred for, until it does not come back',
        build(c) {
          const f = c.formId; const out: ItemGenPart[] = [];
          if (f === 'horse') { c.reach = 'star'; out.push(boon(fx.move(c.fixed('movement'))), boon(fx.cond('in_wilderness', 'star', c.mag('conditional')))); }
          if (f === 'warhorse') { c.reach = 'heart'; out.push(boon(fx.cond('in_combat', 'heart', c.mag('conditional'))), boon(fx.move(c.fixed('movement', 1)))); }
          if (f === 'mule') { c.reach = 'star'; out.push(boon(fx.slot('consumable', 2)), boon(fx.move(0.95))); }
          if (f === 'hound') { c.reach = 'eye'; out.push(boon(fx.sight(1)), boon(fx.cond('alone', 'heart', c.mag('conditional')))); }
          if (f === 'hawk') { c.reach = 'eye'; out.push(boon(fx.reveal('encounters', c.fixed('reveal') + 1)), boon(fx.cond('in_wilderness', 'eye', c.mag('conditional')))); }
          out.push(breaks(c, '{item_name} does not come back.'));
          return out;
        },
      },
      {
        id: 'faithful', label: 'keeps its bearer company and in good heart, until it does not come back',
        build(c) {
          c.reach = 'heart';
          const out = [boon(fx.cond('alone', 'heart', c.mag('conditional'))), boon(fx.social('any', 0.1))];
          out.push(boon(c.formId === 'hawk' || c.formId === 'hound' ? fx.sight(1) : fx.move(c.fixed('movement', 1))));
          out.push(breaks(c, '{item_name} does not come back.'));
          return out;
        },
      },
    ],
  },
];

/** The oath a faction binds by — authored where it exists, derived from the faction's leanings otherwise. */
function oathFor(faction: ItemGenFaction | null): { boon: ReachDomain; forbid: ReachDomain } {
  const authored = faction?.defId ? ITEM_GEN_OATHS[faction.defId] : undefined;
  if (authored) return authored;
  const w = faction?.reachWeights ?? {};
  const ranked = [...ITEM_GEN_REACHES].sort((a, b) => (w[b] ?? 0) - (w[a] ?? 0) || a.localeCompare(b));
  const boonReach = (w[ranked[0]] ?? 0) > 0 ? ranked[0] : 'eye';
  const forbid = ranked[ranked.length - 1] === boonReach ? 'shadow' : ranked[ranked.length - 1];
  return { boon: boonReach, forbid: forbid === boonReach ? 'gold' : forbid };
}

export const ITEM_GEN_CORE_BY_ID: ReadonlyMap<string, ItemGenCore> = new Map(ITEM_GEN_CORES.map(c => [c.id, c]));
