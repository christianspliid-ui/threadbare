/**
 * The honest-vocabulary validator for spells — a spell the world makes promises only what
 * the engine does (THR-1572).
 *
 * Plan: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md` § Systems design
 * (`validateGeneratedSpell.ts`) and § Interface impact (`generated-spell-honest-vocabulary`).
 *
 * - **Carried effects** pass the item generator's per-effect checks (`effectHonestyProblems`,
 *   reused, not forked) **and** the shared-node rule (`isCarriedEffectStateless`).
 * - **Cast effects** are `live` rows of `SPELL_CAST_HONEST_VOCABULARY` in the spell's arena
 *   — a cast must write (Lane decision 6) — and an encounter-arena cast targets the caster.
 * - **The whole spell:** one arena, at most two Reaches, live costs only, no
 *   `doom_rate_multiplier` (Lane decision 4), a notice whose families some encounter
 *   template answers, no unrendered placeholder, no name collision.
 *
 * Pure and total: returns every problem in words; `[]` is a pass. Never throws.
 */

import type { AttachmentEffect, SpellCost, SpellTemplate } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import { effectHonestyProblems, knownConditions } from '../itemGenerator/validateGeneratedItem';
import { isCarriedEffectStateless } from '../../data/spell-casting-constants';
import { ITEM_HONEST_RULE_KEYS } from '../../data/item-honest-vocabulary';
import {
  SPELL_CAST_HONEST_VOCABULARY, SPELL_CAST_RULE_KEYS_EXTRA, SPELL_CAST_TERRAIN_OVERLAYS, SPELL_LIVE_COST_TYPES,
} from '../../data/spell-honest-vocabulary';
import { SPELL_GEN_DOOM_RATE_CAP, THEME_PRICE_LEAN, TRADITION_ENV } from '../../data/spell-generator-tables';
import { SPELL_TEMPLATES, GENERATED_SPELL_ID_PREFIX } from '../../data/spell-templates';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { familyMatchesTemplate } from '../hiddenMarks';
import type { GeneratedSpellProvenance } from './types';

/** Every encounter template id the reveal path can match against (cached once). */
let templateIdCache: readonly string[] | null = null;
function liveTemplateIds(): readonly string[] {
  if (!templateIdCache) templateIdCache = UNIFIED_ACTION_TEMPLATES.map(t => t.id).sort();
  return templateIdCache;
}

/** Does any live template answer this reveal family? */
export function revealFamilyIsAnswered(family: string, templateIds: readonly string[] = liveTemplateIds()): boolean {
  return templateIds.some(id => familyMatchesTemplate(family, id));
}

/** Flatten a spell's costs. */
export function flatCosts(cost: SpellTemplate['cost']): SpellCost[] {
  const out: SpellCost[] = [];
  const walk = (c: SpellCost) => { if (c.type === 'multi') c.costs.forEach(walk); else out.push(c); };
  (Array.isArray(cost) ? cost : [cost]).forEach(walk);
  return out;
}

/** The Reaches a spell's effects name (for the "at most two Reaches" rule). */
function reachesOf(effects: readonly AttachmentEffect[]): Set<ReachDomain> {
  const out = new Set<ReachDomain>();
  for (const e of effects) {
    const r = (e as { reach?: unknown }).reach;
    if (typeof r === 'string') out.add(r as ReachDomain);
  }
  return out;
}

/** Problems with one cast effect in a deliberate spell's `effects`. */
function castEffectProblems(e: AttachmentEffect, spell: SpellTemplate): string[] {
  const problems: string[] = [];
  const row = SPELL_CAST_HONEST_VOCABULARY[e.type];
  if (!row) return [`cast ${e.type} not in the cast vocabulary`];
  if (row.status !== 'live') return [`cast ${e.type} is refused: ${row.writer}`];
  if (row.arenas && spell.arena && !row.arenas.includes(spell.arena)) problems.push(`cast ${e.type} is not live in the ${spell.arena} arena`);
  if (e.type === 'modify_rules') {
    if (!ITEM_HONEST_RULE_KEYS.has(e.rule) && !SPELL_CAST_RULE_KEYS_EXTRA.includes(e.rule)) problems.push(`cast rule ${e.rule} has no live reader`);
    if (e.rule === 'doom_rate_multiplier') problems.push('cast doom_rate_multiplier (Lane decision 4)');
  }
  if (e.type === 'alter_terrain' && !SPELL_CAST_TERRAIN_OVERLAYS.includes(e.terrainEffect)) problems.push(`terrain ${e.terrainEffect} is unread`);
  if (e.type === 'resource_manipulate' && e.resource !== 'fight_clock') problems.push(`cast resource ${e.resource} writes nothing`);
  if (e.type === 'inflict_condition' && !knownConditions().some(c => c.id === e.conditionTraitId)) problems.push(`condition ${e.conditionTraitId} does not exist`);
  return problems;
}

/** Validate one generated spell. `[]` means it only promises what the engine does. */
export function validateGeneratedSpell(
  spell: SpellTemplate,
  provenance: Pick<GeneratedSpellProvenance, 'traditionId' | 'priceLayer' | 'notice' | 'catchIndexes'>,
  opts: { readonly usedNames?: ReadonlySet<string>; readonly templateIds?: readonly string[] } = {},
): string[] {
  const problems: string[] = [];
  try {
    const deliberate = spell.agency === 'deliberate';
    const carried = spell.passiveEffects ?? [];

    // Identity and words.
    if (!spell.id.startsWith(GENERATED_SPELL_ID_PREFIX)) problems.push(`id ${spell.id} lacks the generated prefix`);
    if (SPELL_TEMPLATES.some(t => t.id === spell.id)) problems.push(`id ${spell.id} collides with an authored spell`);
    if (SPELL_TEMPLATES.some(t => t.name.toLowerCase() === spell.name.toLowerCase())) problems.push(`name "${spell.name}" collides with an authored spell`);
    if (opts.usedNames?.has(spell.name)) problems.push(`name "${spell.name}" is already in this world`);
    for (const [field, text] of [['name', spell.name], ['flavorText', spell.flavorText]] as const) {
      if (/\{[^}]*\}/.test(text)) problems.push(`${field} carries an unrendered placeholder: ${text}`);
      if (!text.trim()) problems.push(`${field} is empty`);
    }
    if (spell.castProse) {
      for (const line of [spell.castProse.landed, spell.castProse.fizzled]) {
        const left = line.replace(/\{actor\}|\{target\}/g, '');
        if (/\{[^}]*\}/.test(left)) problems.push(`castProse carries an unrendered placeholder: ${line}`);
      }
    }

    // Agency shape.
    if (deliberate) {
      if (spell.effects.length === 0) problems.push('a deliberate spell with no cast effect');
      if (carried.length > 0) problems.push('a deliberate spell carrying passive effects');
      for (const e of spell.effects) problems.push(...castEffectProblems(e, spell));
      if (spell.arena === 'encounter' && spell.targeting.type !== 'self') problems.push('an encounter-arena cast must target the caster until THR-1683');
      if (spell.backlash) problems.push(...castEffectProblems(spell.backlash.effect, { ...spell, arena: undefined }).map(p => `backlash: ${p}`));
    } else {
      if (spell.effects.length > 0) problems.push('a fate-woven spell with cast effects');
      if (carried.length === 0) problems.push('a fate-woven spell with nothing carried');
      problems.push(...effectHonestyProblems(carried));
      for (const e of carried) if (!isCarriedEffectStateless(e)) problems.push(`carried ${e.type} is not stateless on a shared node`);
      if (spell.backlash) problems.push('a fate-woven spell with a cast backlash');
      for (const i of provenance.catchIndexes) if (i < 0 || i >= carried.length) problems.push(`catch index ${i} points at no effect`);
    }

    // Reaches: one arena (the template field), at most two Reaches across the boon.
    const boon = deliberate ? spell.effects : carried.filter((_, i) => !provenance.catchIndexes.includes(i));
    if (reachesOf(boon).size > 2) problems.push(`the spell reaches into ${reachesOf(boon).size} Reaches`);

    // Price.
    for (const c of flatCosts(spell.cost)) {
      if (!SPELL_LIVE_COST_TYPES.includes(c.type)) problems.push(`cost ${c.type} is not a live cost`);
    }
    const allEffects = [...spell.effects, ...carried, ...(spell.backlash ? [spell.backlash.effect] : [])];
    if (SPELL_GEN_DOOM_RATE_CAP <= 0 && allEffects.some(e => e.type === 'modify_rules' && e.rule === 'doom_rate_multiplier')) {
      problems.push('a doom_rate_multiplier (Lane decision 4)');
    }
    const row = TRADITION_ENV[provenance.traditionId];
    if (!row) problems.push(`tradition ${provenance.traditionId} has no row`);
    else if ((THEME_PRICE_LEAN[row.themes[0]][provenance.priceLayer] ?? 0) <= 0) {
      problems.push(`${provenance.traditionId} never pays ${provenance.priceLayer}`);
    }

    // Notice (rule 6) — a transgression is noticed, and something must be able to notice it.
    if (provenance.priceLayer === 'transgression') {
      if (!provenance.notice || provenance.notice.revealFamilies.length === 0) problems.push('a transgression with no notice');
      for (const f of provenance.notice?.revealFamilies ?? []) {
        if (!revealFamilyIsAnswered(f, opts.templateIds)) problems.push(`notice family ${f} matches no encounter template`);
      }
    } else if (provenance.notice) {
      problems.push(`a ${provenance.priceLayer} spell carrying notice`);
    }
  } catch (err) {
    problems.push(`validator threw: ${err instanceof Error ? err.message : String(err)}`);
  }
  return problems;
}
