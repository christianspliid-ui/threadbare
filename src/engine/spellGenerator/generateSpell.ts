/**
 * `generateSpell` — one spell, grown around an authored core and dressed by the tradition
 * that teaches it (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Systems design and
 * § Resolution logic. Ported from the THR-1232 prototype (`generator.mjs`: `makeCtx`,
 * `composeSpell`, `composePrice`, `composeName`), with its `mulberry32` / `fnv1a` replaced
 * by `drawFromTable` / `rollTableUnit`, one named stream per table.
 *
 * Pure and never touches the graph. It does not validate — `buildSpellLibrary` runs the
 * validator and rerolls. Returns null only when no core fits the slot.
 *
 * ─── Determinism (NFP #3) ───────────────────────────────────────────
 * Seed key `gen_spell:${worldSeed}:${traditionId}:${tier}:${slot}` (+ `:r<k>` on a reroll).
 * Every draw is its own table on that key, so cutting a core or a word never reshuffles
 * another table, and no worldgen stream is consumed.
 */

import type { AttachmentEffect, SpellCost, SpellTemplate, BacklashEffect } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import type { ContentTag } from '../../data/content-tags';
import type { SphereName } from '../../types';
import { drawFromTable, rollTableUnit } from '../../lib/drawTable';
import { REACH_VALUE_PAIR } from '../../types/agent';
import { EFFECT_PER_ITEM_CAP, ACTION_TRIGGER_MAX_PER_ATTACHMENT } from '../../data/effect-constants';
import { SPELL_CORES, SPELL_RIDERS } from '../../data/spell-generator-cores';
import {
  SPELL_GEN_CONDITIONS, SPELL_GEN_CORE_REPEAT_DECAY, SPELL_GEN_FOUNDATION_MIN_TIER, SPELL_GEN_FOUNDATION_SHELF_WEIGHT,
  SPELL_GEN_FOUNDATION_SHELVES, SPELL_GEN_MAGNITUDE_BY_TIER, SPELL_GEN_MASS_NOUNS, SPELL_GEN_MAX_RIDERS,
  SPELL_GEN_MISCASTS, SPELL_GEN_NAME_IMPERATIVE_CHANCE, SPELL_GEN_NAME_SPHERE_NOUN_CHANCE, SPELL_GEN_PRICE as P,
  SPELL_GEN_RIDER_CHANCE_BY_TIER, SPELL_GEN_SPHERES, SPELL_GEN_THEME_REACH_WEIGHT, SPELL_NOTICE_SEVERITY_BY_TIER, STRAIN_PAIR, THEME_PRICE_LEAN,
  THEME_REACH, THEME_VICE, TIER_PRICE_WINDOW, TRADITION_ENV,
} from '../../data/spell-generator-tables';
import { GENERATED_SPELL_ID_PREFIX, SPELL_TEMPLATES } from '../../data/spell-templates';
import { traditionEntry } from './traditionCatalog';
import type {
  CoreContext, GeneratedSpell, SpellCore, SpellGenRequest, SpellGenTier, SpellNotice, SpellPriceLayer, SpellTheme,
  TraditionRow,
} from './types';
import { SPELL_PRICE_LAYERS } from './types';

// ═══════════════════════════════════════════════════════════════════
// Keys and small helpers
// ═══════════════════════════════════════════════════════════════════

const r2 = (x: number) => Math.round(x * 100) / 100;
const r4 = (x: number) => Math.round(x * 10000) / 10000;

/** The seed key that reproduces one spell. */
export function spellSeedKey(req: Pick<SpellGenRequest, 'worldSeed' | 'traditionId' | 'tier' | 'slot' | 'reroll'>): string {
  const base = `gen_spell:${req.worldSeed}:${req.traditionId}:${req.tier}:${req.slot}`;
  return req.reroll ? `${base}:r${req.reroll}` : base;
}

/** The generated spell id for a library slot. */
export function generatedSpellId(traditionId: string, tier: SpellGenTier, slot: number): string {
  return `${GENERATED_SPELL_ID_PREFIX}${traditionId.replace(/^magic\./, '')}_${tier}_${slot}`;
}

/** The content tag a theme family reads as. Every value is a seated `family` tag. */
const THEME_TAG: Readonly<Record<SpellTheme, ContentTag>> = {
  war: '#combat', travel: '#travel', sight: '#vision', mind: '#social', heal: '#healing', holy: '#divine',
  death: '#mystical', curse: '#curse', luck: '#fate', wild: '#nature', craft: '#craft', ward: '#arcane',
  time: '#temporal', fear: '#mystical', conceal: '#stealth',
};

// ═══════════════════════════════════════════════════════════════════
// Eligibility
// ═══════════════════════════════════════════════════════════════════

/** The spheres a tradition draws from at a tier, with their weights (rule 4 for Foundation spheres). */
export function traditionSphereWeights(traditionId: string, tier: SpellGenTier): Partial<Record<SphereName, number>> {
  const out: Partial<Record<SphereName, number>> = { ...(traditionEntry(traditionId)?.sphereWeights ?? {}) };
  if (tier >= SPELL_GEN_FOUNDATION_MIN_TIER) {
    for (const [sphere, shelf] of Object.entries(SPELL_GEN_FOUNDATION_SHELVES) as [SphereName, readonly string[]][]) {
      if (shelf.includes(traditionId)) out[sphere] = (out[sphere] ?? 0) + SPELL_GEN_FOUNDATION_SHELF_WEIGHT;
    }
  }
  return out;
}

/** Does the core teach what the tradition teaches (rule 1, hard)? */
export function coreFitsTradition(core: SpellCore, row: TraditionRow): boolean {
  return core.themes === null || core.themes.some(t => row.themes.includes(t));
}

/**
 * The cores that can fill a slot: the tradition teaches them, the arena, agency and tier
 * fit, and at least one sphere the tradition draws on at this tier fits the core.
 */
export function eligibleCores(traditionId: string, tier: SpellGenTier, arena: SpellTemplate['arena'], agency: SpellTemplate['agency']): SpellCore[] {
  const row = TRADITION_ENV[traditionId];
  if (!row) return [];
  const spheres = traditionSphereWeights(traditionId, tier);
  const tierIdx = tier - 1;
  return SPELL_CORES.filter(core =>
    core.arena === arena && core.agency === agency
    && tierIdx >= core.tiers[0] && tierIdx <= core.tiers[1]
    && coreFitsTradition(core, row)
    && (Object.keys(spheres) as SphereName[]).some(s => (spheres[s] ?? 0) > 0 && core.spheres[s] !== undefined));
}

// ═══════════════════════════════════════════════════════════════════
// Price (rules 2 and 3)
// ═══════════════════════════════════════════════════════════════════

/**
 * The price-layer weights for a tradition at a tier. The lean (by primary theme) is never
 * overridden: a 0 stays a 0 whatever the tier, and a tier window that leaves no layer
 * widens to the lean's best layer.
 */
export function priceWeights(row: TraditionRow, tier: SpellGenTier): Partial<Record<SpellPriceLayer, number>> {
  const lean = THEME_PRICE_LEAN[row.themes[0]];
  const window = TIER_PRICE_WINDOW[tier];
  const out: Partial<Record<SpellPriceLayer, number>> = {};
  for (const layer of SPELL_PRICE_LAYERS) {
    const w = (window[layer] ?? 0) * lean[layer];
    if (w > 0) out[layer] = w;
  }
  if (Object.keys(out).length === 0) {
    const best = [...SPELL_PRICE_LAYERS].sort((a, b) => lean[b] - lean[a] || SPELL_PRICE_LAYERS.indexOf(a) - SPELL_PRICE_LAYERS.indexOf(b))[0];
    out[best] = 1;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// Cast miscasts — backlash effects that write (§ Data tables)
// ═══════════════════════════════════════════════════════════════════

interface Miscast { readonly effect: AttachmentEffect; readonly narrative: string }

/** Build a miscast from its authored row (`SPELL_GEN_MISCASTS`); an unknown key falls back to exhaustion. */
function miscast(key: string, c: CoreContext): Miscast {
  const row = SPELL_GEN_MISCASTS[key] ?? SPELL_GEN_MISCASTS.self_exhausted;
  const ticks = c.t(row.ticks);
  const effect: AttachmentEffect = row.kind === 'condition'
    ? { type: 'inflict_condition', conditionTraitId: SPELL_GEN_CONDITIONS[row.condition].id, target: 'self', durationTicks: ticks }
    : { type: 'modify_rules', scope: { scope: 'self' }, rule: row.rule, value: row.value, ticks };
  return { effect, narrative: row.narrative };
}

// ═══════════════════════════════════════════════════════════════════
// The generator
// ═══════════════════════════════════════════════════════════════════

/** Generate one spell for a library slot. Null when no core fits. */
export function generateSpell(req: SpellGenRequest): GeneratedSpell | null {
  const row = TRADITION_ENV[req.traditionId];
  if (!row) return null;
  const seedKey = spellSeedKey(req);
  const roll = (stream: string) => rollTableUnit(`spellgen.${stream}`, seedKey);
  const draw = <K extends string>(table: string, weights: Partial<Record<K, number>>): K | undefined =>
    drawFromTable<K>(`spellgen.${table}`, weights, seedKey, 1)[0];
  const pickOf = <T>(stream: string, arr: readonly T[]): T | undefined => (arr.length ? arr[Math.floor(roll(stream) * arr.length)] : undefined);

  const tier = req.tier;
  const tierIdx = tier - 1;
  const env = SPELL_GEN_MAGNITUDE_BY_TIER[tier];

  // 1. The core (rule 1, hard), weighted down by repeats in this world.
  const cores = eligibleCores(req.traditionId, tier, req.arena, req.agency);
  if (cores.length === 0) return null;
  const coreWeights: Record<string, number> = {};
  for (const core of cores) coreWeights[core.id] = Math.pow(SPELL_GEN_CORE_REPEAT_DECAY, req.coreUse?.get(core.id) ?? 0);
  const coreId = draw('core', coreWeights);
  const core = cores.find(k => k.id === coreId) ?? cores[0];

  // 2. The sphere follows the tradition, restricted to what the core accepts.
  const traditionSpheres = traditionSphereWeights(req.traditionId, tier);
  const sphereWeights: Partial<Record<SphereName, number>> = {};
  for (const [s, w] of Object.entries(traditionSpheres) as [SphereName, number][]) if (core.spheres[s] !== undefined && w > 0) sphereWeights[s] = w;
  const sphere = draw<SphereName>('sphere', sphereWeights) ?? (Object.keys(core.spheres)[0] as SphereName);
  const S = SPELL_GEN_SPHERES[sphere];

  // 3. The Reach it leans on: the sphere's pulls, nudged toward the tradition's primary theme.
  const themeReach = THEME_REACH[row.themes[0]];
  const reachWeights: Partial<Record<ReachDomain, number>> = { ...S.reaches };
  reachWeights[themeReach] = (reachWeights[themeReach] ?? 0) + SPELL_GEN_THEME_REACH_WEIGHT;
  const leanReach = draw<ReachDomain>('reach', reachWeights) ?? themeReach;

  const ctx: CoreContext = {
    sphere, traditionId: req.traditionId, tradition: row, arg: core.spheres[sphere] ?? true, reach: leanReach, tierIdx,
    t: arr => arr[tierIdx],
    m: stream => r2(env.mag[0] + (env.mag[1] - env.mag[0]) * roll(`mag.${stream}`)),
    roll,
  };
  const built = core.build(ctx);
  const reach = built.reach;
  const main: AttachmentEffect[] = built.effects.map(e => ({ ...e }) as AttachmentEffect);

  // 4. At most one optional rider, carried only, same arena, same Reach (THR-1232).
  let riderId: string | undefined;
  const riderFx: AttachmentEffect[] = [];
  if (req.agency === 'fate_woven' && SPELL_GEN_MAX_RIDERS > 0 && core.riders.length > 0 && roll('rider.chance') < SPELL_GEN_RIDER_CHANCE_BY_TIER[tier]) {
    const key = pickOf('rider.pick', core.riders);
    const effect = key ? SPELL_RIDERS[key]?.build(ctx, reach) : null;
    if (key && effect && !main.some(m => m.type === effect.type)) {
      riderFx.push(effect);
      riderId = key;
    }
  }

  // 5. The price (rules 2, 3, 7 and 6).
  const priceLayer = req.priceLayer ?? draw<SpellPriceLayer>('price', priceWeights(row, tier)) ?? 'free';
  const vice = THEME_VICE[row.themes[0]];
  const turn = SPELL_GEN_CONDITIONS[S.turn] ?? SPELL_GEN_CONDITIONS.exhausted;
  const costs: SpellCost[] = [];
  let backlash: BacklashEffect | undefined;
  const priceFx: AttachmentEffect[] = [];
  const notice: SpellNotice | undefined = priceLayer === 'transgression'
    ? { severity: SPELL_NOTICE_SEVERITY_BY_TIER[tier], revealFamilies: [...row.noticeFamilies] }
    : undefined;

  if (req.agency === 'deliberate') {
    const mc = () => miscast(pickOf('miscast', S.miscasts) ?? 'self_exhausted', ctx);
    if (priceLayer === 'strain') {
      const kind = draw<'exhaust' | 'exhausted' | 'drain'>('strain.kind', P.castStrainKindWeights) ?? 'exhaust';
      if (kind === 'exhaust') costs.push({ type: 'tick_exhaust', ticks: ctx.t(P.castStrainExhaustTicks) });
      else if (kind === 'exhausted') costs.push({ type: 'condition_inflict', template: 'exhausted' });
      else costs.push({ type: 'reach_drain', reach: roll('strain.drain_reach') < 0.5 ? 'veil' : reach, amount: r2(ctx.m('strain.drain') * P.castStrainDrainShare) });
      const m = mc();
      backlash = { trigger: 'failure', probability: r2(P.castStrainBacklashBase + P.castStrainBacklashSpread * roll('backlash.p')), severity: 'minor', effect: m.effect, narrativeTemplate: m.narrative };
    } else if (priceLayer === 'gamble') {
      const m = mc();
      backlash = { trigger: 'always', probability: r2(ctx.t(P.castGambleBacklashBase) + P.castGambleBacklashSpread * roll('backlash.p')), severity: tier >= 4 ? 'catastrophic' : 'major', effect: m.effect, narrativeTemplate: m.narrative };
    } else if (priceLayer === 'transgression') {
      costs.push({ type: 'doom_increase', amount: ctx.t(P.castTransgressionSoulPrice) });
      const m = mc();
      backlash = { trigger: 'critical_failure', probability: r2(P.castTransgressionBacklashBase + P.castTransgressionBacklashSpread * roll('backlash.p')), severity: tier >= 4 ? 'catastrophic' : 'major', effect: m.effect, narrativeTemplate: m.narrative };
    }
  } else {
    const triggers = () => [...main, ...riderFx, ...priceFx].filter(e => e.type === 'action_trigger').length;
    const turnOnFail = (on: 'encounter_failure' | 'encounter_critical_failure', probability: number, durationTicks: number): AttachmentEffect => ({
      type: 'action_trigger', on, probability,
      payload: { kind: 'condition_grant', conditionTraitId: turn.id, durationTicks },
      narrativeTemplate: `The working turns on {actor}, and they are left ${turn.name}.`,
    });
    if (priceLayer === 'strain') {
      const canWeary = triggers() + 2 <= ACTION_TRIGGER_MAX_PER_ATTACHMENT;
      const kind = draw<'weigh' | 'weary'>('strain.kind', { weigh: P.carriedStrainKindWeights.weigh, weary: canWeary ? P.carriedStrainKindWeights.weary : 0 }) ?? 'weigh';
      if (kind === 'weigh') {
        const other = STRAIN_PAIR[reach];
        priceFx.push({ type: 'passive', reach: other, value: -r2(Math.min(EFFECT_PER_ITEM_CAP, ctx.m('strain.weigh') * P.carriedWeighShare)) });
      } else {
        priceFx.push({
          type: 'action_trigger', on: 'encounter_success', probability: P.carriedWearyChance, cooldownTicks: P.carriedWearyCooldownTicks,
          payload: { kind: 'condition_grant', conditionTraitId: SPELL_GEN_CONDITIONS.exhausted.id, durationTicks: P.carriedWearyTicks },
          narrativeTemplate: 'The working takes its toll, and {actor} is left Exhausted.',
        });
      }
      if (triggers() < ACTION_TRIGGER_MAX_PER_ATTACHMENT) priceFx.push(turnOnFail('encounter_critical_failure', P.carriedStrainTurnChance, P.carriedStrainTurnTicks));
    } else if (priceLayer === 'gamble') {
      if (triggers() < ACTION_TRIGGER_MAX_PER_ATTACHMENT) priceFx.push(turnOnFail('encounter_failure', r2(ctx.t(P.carriedGambleTurnChance)), P.carriedGambleTurnTicks));
      else priceFx.push({ type: 'passive', reach: STRAIN_PAIR[reach], value: -r2(ctx.m('gamble.weigh') * P.carriedWeighShare) });
    } else if (priceLayer === 'transgression') {
      // The soul price, carried: a little quintessence every tick (inside the passive regen).
      priceFx.push({ type: 'resource_manipulate', resource: 'quintessence', target: 'self', amount: -r4(P.carriedSoulDrainPerTierPerTick * (tierIdx + 1)), mode: 'per_tick' });
      // Rule 7 — it changes them, toward the tradition's vice, never the effect's Reach.
      priceFx.push({ type: 'axiological_drift', axis: REACH_VALUE_PAIR[vice], ratePerTick: P.carriedViceDriftPerTick, limitValue: P.carriedViceDriftLimit });
    }
  }

  // 6. Flavour (rule 8) — a line that suits this tradition, by the core's own index.
  const fitting = core.flavours.map((f, i) => ({ f, i })).filter(({ f }) => f.themes === null || f.themes.some(t => row.themes.includes(t)));
  const chosenFlavour = pickOf('flavour', fitting.length > 0 ? fitting : core.flavours.map((f, i) => ({ f, i })))!;
  const traditionName = traditionEntry(req.traditionId)?.name ?? req.traditionId;
  const blow = row.blow ?? S.blow;
  const fill = (text: string) => text
    .replace(/\{tradition_noun\}/g, traditionName)
    .replace(/\{blow\}/g, blow)
    .replace(/\{road\}/g, row.road ?? 'fast')
    .replace(/\{ward\}/g, row.ward ?? 'sets a ward on');
  const flavorText = fill(chosenFlavour.f.text);

  // 7. The name.
  const name = composeName({ core, row, sphere, agency: req.agency, names: built.names, usedNames: req.usedNames, pickOf, roll });

  // 8. The template the engine reads.
  const cooldownTicks = req.agency === 'deliberate' ? Math.round(env.cooldown[0] + (env.cooldown[1] - env.cooldown[0]) * roll('cooldown')) : 0;
  const passiveEffects = req.agency === 'fate_woven' ? [...main, ...riderFx, ...priceFx] : undefined;
  const catchIndexes = passiveEffects ? priceFx.map((_, i) => main.length + riderFx.length + i) : [];
  const tags: ContentTag[] = ['#arcane', THEME_TAG[row.themes[0]]].filter((t, i, a) => a.indexOf(t) === i) as ContentTag[];
  const id = generatedSpellId(req.traditionId, tier, req.slot);
  const template: SpellTemplate = {
    id,
    name,
    tier,
    tags,
    sphereAffinity: sphere,
    flavorText,
    mechanicalSummary: `Generated (${traditionName}): ${req.agency === 'deliberate' ? 'cast' : 'carried'} ${core.id} · ${priceLayer}${riderId ? ` + ${riderId}` : ''}.`,
    prerequisites: {},
    effects: req.agency === 'deliberate' ? main : [],
    cost: costs,
    cooldownTicks,
    ...(backlash ? { backlash } : {}),
    ...(passiveEffects ? { passiveEffects } : {}),
    targeting: built.targeting,
    agency: req.agency,
    arena: req.arena,
    ...(req.agency === 'deliberate' && req.arena === 'encounter' ? { castReach: reach } : {}),
    ...(req.agency === 'deliberate' && core.castProse ? { castProse: { landed: fill(core.castProse.landed), fizzled: fill(core.castProse.fizzled) } } : {}),
  };

  return {
    template,
    sphere,
    provenance: {
      traditionId: req.traditionId,
      coreId: core.id,
      flavourIndex: chosenFlavour.i,
      ...(riderId ? { riderId } : {}),
      priceLayer,
      seedKey,
      catchIndexes,
      rerolls: req.reroll ?? 0,
      ...(notice ? { notice } : {}),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// The name grammar (Prose Doctrine v2 — card form for a cast spell)
// ═══════════════════════════════════════════════════════════════════

/** Authored spell names a generated name must never take. */
const AUTHORED_NAMES: ReadonlySet<string> = new Set(SPELL_TEMPLATES.map(t => t.name.toLowerCase()));

interface NameRequest {
  readonly core: SpellCore;
  readonly row: TraditionRow;
  readonly sphere: SphereName;
  readonly agency: SpellTemplate['agency'];
  readonly names: { readonly nouns: readonly string[]; readonly verbs?: readonly string[]; readonly objects?: readonly string[] };
  readonly usedNames?: ReadonlySet<string>;
  readonly pickOf: <T>(stream: string, arr: readonly T[]) => T | undefined;
  readonly roll: (stream: string) => number;
}

/**
 * Two or three plain words from the core's function words, the tradition's nouns and the
 * sphere's adjectives. Reach and sphere names never appear (the banks leave them out).
 * A deliberate spell may take the card form (imperative verb + object: *Bar the Road*).
 */
function composeName(n: NameRequest): string {
  const S = SPELL_GEN_SPHERES[n.sphere];
  const tAll = [...n.row.nouns, ...n.row.mass];
  for (let attempt = 0; attempt < 16; attempt++) {
    const k = `name.${attempt}`;
    const F = n.pickOf(`${k}.f`, n.names.nouns) ?? 'Working';
    let name: string;
    const imperative = n.agency === 'deliberate' && !!n.names.verbs?.length && !!n.names.objects?.length && n.roll(`${k}.imp`) < SPELL_GEN_NAME_IMPERATIVE_CHANCE;
    if (imperative) {
      name = `${n.pickOf(`${k}.verb`, n.names.verbs!)} ${n.pickOf(`${k}.obj`, n.names.objects!)}`;
    } else if (F.includes(' ')) {
      name = F;
    } else {
      const useSphere = n.roll(`${k}.sph`) < SPELL_GEN_NAME_SPHERE_NOUN_CHANCE || tAll.length === 0;
      const T = (useSphere ? n.pickOf(`${k}.t`, S.noun) : n.pickOf(`${k}.t`, tAll)) ?? 'Old';
      const isMass = n.row.mass.includes(T) || SPELL_GEN_MASS_NOUNS.includes(T);
      const A = n.pickOf(`${k}.a`, S.adj) ?? 'Old';
      const act = /ing$/.test(F);
      const forms: Record<string, number> = act ? { the: 2, af: 2 } : { tf: 2, af: 3, ofT: isMass ? 2 : 0, theTF: 1 };
      const f = drawFromTable('spellgen.name.form', forms, `${k}:${F}:${T}:${A}:${n.core.id}:${n.roll(`${k}.form`)}`, 1)[0] ?? 'af';
      name = ({ tf: `${T} ${F}`, af: `${A} ${F}`, ofT: `${F} of ${T}`, theTF: `The ${T} ${F}`, the: `The ${F}` } as Record<string, string>)[f];
    }
    const words = name.toLowerCase().split(' ');
    if (words.some((w, i) => words.indexOf(w) !== i)) continue; // "Salt Salt"
    if (!n.usedNames?.has(name) && !AUTHORED_NAMES.has(name.toLowerCase())) return name;
  }
  return `${n.pickOf('name.fallback.a', S.adj) ?? 'Old'} ${n.pickOf('name.fallback.f', n.names.nouns) ?? 'Working'}`;
}
