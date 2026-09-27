/**
 * The honest-vocabulary validator — an item never promises what the engine does not do
 * (THR-1570).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Systems design
 * (`validateGeneratedItem.ts`). Ported from the THR-1236 prototype's `validate()`
 * (`generator.mjs:1494-1540`), now reading the live caps, bands, tag vocabulary and
 * condition catalog directly instead of an extracted snapshot.
 *
 * Returns every problem found, in words; an empty list is a pass. Pure and total: it
 * never throws, and a shape it does not know is itself a problem.
 */

import {
  ACTION_TRIGGER_MAX_PER_ATTACHMENT, EFFECT_MODIFIER_CAP, EFFECT_PER_ITEM_CAP, MAX_EFFECTS_PER_ATTACHMENT,
} from '../../data/effect-constants';
import { ITEM_STAT_BAND_LEGENDARY, ITEM_STAT_BAND_NOTABLE, ITEM_STAT_BAND_MINOR } from '../../data/item-stat-bands';
import { CONTENT_TAGS } from '../../data/content-tags';
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import { REWARD_CONDITIONS, REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { STARTER_POSSESSIONS } from '../../data/starter-attachments';
import {
  ITEM_HONEST_CONDITION_OWN_REACHES, ITEM_HONEST_HEX_PROPERTIES, ITEM_HONEST_RULE_KEYS, ITEM_HONEST_TRIGGER_EVENTS,
  ITEM_HONEST_VOCABULARY,
} from '../../data/item-honest-vocabulary';
import type { AttachmentEffect, EffectCondition, RuleOverrideKey } from '../../types/effects';
import type { GraphNode } from '../../types/graph';
import type { GeneratedItem } from './types';

/** A condition the catalog knows: its id, its display name and its tags. */
export interface KnownCondition { readonly id: string; readonly name: string; readonly tags: readonly string[] }

let conditionCache: readonly KnownCondition[] | null = null;
/** Every real condition an item can grant, cure or ward against (agent conditions + reward conditions). */
export function knownConditions(): readonly KnownCondition[] {
  if (!conditionCache) {
    const pick = (n: GraphNode): KnownCondition => ({ id: n.id, name: n.name, tags: (n.properties?.tags as string[] | undefined) ?? [] });
    conditionCache = [
      ...CONDITION_TRAIT_DEFINITIONS.filter(n => !String(n.id).includes('.location.')).map(pick),
      ...REWARD_CONDITIONS.map(pick),
    ];
  }
  return conditionCache;
}

const norm = (t: string) => t.replace(/^#/, '');
/** The real conditions a tag blocks — so an immunity can only name what exists. */
export function conditionsBlockedBy(tag: string): KnownCondition[] {
  return knownConditions().filter(c => c.tags.some(t => norm(t) === norm(tag)));
}

let catalogNames: ReadonlySet<string> | null = null;
function catalogNameSet(): ReadonlySet<string> {
  if (!catalogNames) catalogNames = new Set([...REWARD_POSSESSIONS, ...STARTER_POSSESSIONS].map(n => n.name.toLowerCase()));
  return catalogNames;
}

const SEATED = new Map(CONTENT_TAGS.map(t => [t.tag as string, t]));
const round = (v: number) => Math.round(v * 100) / 100;

function statBandFor(band: number): number {
  return band >= 4 ? ITEM_STAT_BAND_LEGENDARY : band >= 2 ? ITEM_STAT_BAND_NOTABLE : ITEM_STAT_BAND_MINOR;
}

/** Validate one generated item. `[]` means it only promises what the engine does. */
export function validateGeneratedItem(item: Pick<GeneratedItem, 'effects' | 'catchIndexes' | 'catchNotes' | 'tags' | 'lossCondition' | 'name' | 'look' | 'provenance' | 'band'>): string[] {
  const problems: string[] = [];
  const eff: readonly AttachmentEffect[] = item.effects;
  if (eff.length === 0) problems.push('no effects');
  if (eff.length > MAX_EFFECTS_PER_ATTACHMENT) problems.push(`too many effects (${eff.length})`);
  if (eff.filter(e => e.type === 'action_trigger').length > ACTION_TRIGGER_MAX_PER_ATTACHMENT) problems.push('too many action_triggers');
  const conditionIds = new Set(knownConditions().map(c => c.id));
  const perReach: Record<string, number> = {};

  for (const e of eff) {
    const row = ITEM_HONEST_VOCABULARY[e.type];
    if (!row) { problems.push(`shape ${e.type} not in the honest vocabulary`); continue; }
    if (row.status === 'planned') problems.push(`shape ${e.type} is planned, not live`);

    if (e.type === 'passive' || e.type === 'conditional') {
      if (Math.abs(e.value) > EFFECT_PER_ITEM_CAP) problems.push(`${e.type} ${e.value} over the per-effect cap`);
      if (e.value > 0) perReach[e.reach] = (perReach[e.reach] ?? 0) + e.value;
    }
    if (e.type === 'conditional') {
      const own = ITEM_HONEST_CONDITION_OWN_REACHES[e.condition as EffectCondition];
      if (own?.includes(e.reach)) problems.push(`conditional ${e.condition} on ${e.reach} is a passive in disguise`);
      else if (own && !(e.condition === 'in_combat' && e.reach === 'heart')) problems.push(`conditional ${e.condition} on ${e.reach} almost never fires`);
    }
    if (e.type === 'stat_contribution') {
      const cap = statBandFor(item.band);
      for (const [r, v] of Object.entries(e.contributions ?? {})) if (Math.abs(v ?? 0) > cap) problems.push(`stat ${r} ${v} over band ${cap}`);
    }
    if (e.type === 'modify_rules' && !ITEM_HONEST_RULE_KEYS.has(e.rule as RuleOverrideKey)) problems.push(`rule ${e.rule} has no live reader`);
    if (e.type === 'action_trigger') {
      if (!ITEM_HONEST_TRIGGER_EVENTS.has(e.on)) problems.push(`trigger event ${e.on} is never raised`);
      const cid = (e.payload as { conditionTraitId?: string }).conditionTraitId;
      if (cid && !conditionIds.has(cid)) problems.push(`condition ${cid} does not exist`);
    }
    if (e.type === 'tag_immunity') for (const t of e.tags) if (conditionsBlockedBy(t).length === 0) problems.push(`immunity ${t} blocks no real condition`);
    if (e.type === 'hex_effect' && !ITEM_HONEST_HEX_PROPERTIES.has(e.property)) problems.push(`hex property ${e.property} not writable`);
    if (e.type === 'prevent_loss' && e.channel !== 'quintessence') problems.push('prevent_loss on a channel with no reader');
  }
  for (const [r, v] of Object.entries(perReach)) if (v > EFFECT_MODIFIER_CAP) problems.push(`${r} roll total ${round(v)} over cap ${EFFECT_MODIFIER_CAP}`);

  for (const t of item.tags) {
    const def = SEATED.get(t);
    if (!def) problems.push(`tag ${t} not in the closed vocabulary`);
    else if (def.kinds && !def.kinds.includes('item_template') && !def.kinds.includes('legendary_template')) problems.push(`tag ${t} not allowed on items`);
  }
  if (!item.tags.some(t => SEATED.get(t)?.axis === 'family')) problems.push('no family tag (item_template requires one)');

  if (item.lossCondition === 'breakable' && !eff.some(e => e.type === 'action_trigger' && e.payload.kind === 'self_remove')) problems.push('breakable with nothing that breaks it');
  if (item.lossCondition === 'consumable' && !eff.some(e => e.type === 'consumable_charge' || (e.type === 'action_trigger' && e.payload.kind === 'self_remove') || (e.type === 'prevent_loss' && e.consumeOnPrevent))) problems.push('consumable with nothing that consumes it');
  if (item.lossCondition === 'cursed' && item.catchIndexes.length === 0) problems.push('cursed with no real downside');
  for (const i of item.catchIndexes) if (i < 0 || i >= eff.length) problems.push(`catch index ${i} points at no effect`);

  if (catalogNameSet().has(item.name.toLowerCase())) problems.push(`name collides with catalog item "${item.name}"`);
  for (const [field, text] of [['name', item.name], ['look', item.look], ['provenance', item.provenance]] as const) {
    if (/\{[^}]*\}/.test(text)) problems.push(`${field} carries an unrendered placeholder: ${text}`);
    if (!text.trim()) problems.push(`${field} is empty`);
  }
  return problems;
}
