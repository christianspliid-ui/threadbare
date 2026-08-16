/**
 * Codex Registry — maps game data into a uniform CodexEntry shape for browsing.
 *
 * Unlike the CMS registry (raw data tables for devs), this produces curated,
 * player-friendly entries with prose, glyphs, and tier colors.
 */

import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { REWARD_POSSESSIONS, REWARD_CONDITIONS, REWARD_BESTOWED_POWERS } from '../../data/reward-attachment-catalog';
import { RESOURCE_CLASSES, getResourceTierProse } from '../../data/resource-classes';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../../data/starter-attachments';
import { AGREEMENT_REWARD_TEMPLATES } from '../../data/agreement-reward-catalog';
import { SLOT_TAG_DISPLAY_NAMES, SUBCATEGORY_TO_SLOT_TAG } from '../../data/attachment-slot-constants';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS } from '../../types/rarity';
import { SPHERE_NAMES } from '../../types/index';
import type { RarityTier } from '../../types/rarity';
import type { GraphNode } from '../../types/graph';
import { getAttachmentGlyph } from '../Game/attachmentGlyphs';
import { ACTION_ART } from '../Game/actionArt';
import { isStarterActionId } from '../../engine/actionUnlock';
import { effectSourceFor, type EffectSource } from '../../data/actionEffectSource';
import { formatEssenceLabel } from '../shared/formatEssence';
import { magnitudeWord, durationLabel, type MagnitudeBand } from '../../engine/aftermathWords';

// ─── Types ───────────────────────────────────────────────────────

export interface CodexEntry {
  id: string;
  name: string;
  glyph: string;
  tier: RarityTier;
  tierName: string;
  tierColor: string;
  category: string;
  subcategory: string;
  subtitle: string;
  summary: string;
  flavorText?: string;
  /** Technical statement of what state this action changes (THR-604 `technicalEffect`).
   * Surfaced in the Codex detail panel (THR-610). Absent for non-action entries. */
  technicalEffect?: string;
  /** Where the action's effect is wired (THR-604 derivation) — drives the wiring badge. */
  effectSource?: EffectSource;
  /**
   * The reach the drawer's reach gate keys on (THR-503 `requiresReach`). Present only on
   * reach-locked cards (the eight signatures); absent on universal cards. Drives the
   * Codex "locked this incarnation" state (THR-613 Slice 3b-tail) — NOT the `reach` tag,
   * so universal (`star`/no-gate) cards are never wrongly greyed out.
   */
  requiresReach?: string;
  /**
   * True for cards the ascendant (player) can play — the surfaces the incarnation
   * three-state grammar applies to (divine / hex / place / artifact / thread actions and
   * the reach signatures). False/absent for mortal actions, possessions, conditions,
   * agreements, which carry no incarnation state.
   */
  isAscendantAction?: boolean;
  tags: string[];
  /** Extra key-value details shown in the detail panel */
  details: { label: string; value: string }[];
  /** Optional path to an art asset (relative to public/) */
  imageAssetPath?: string;
  /** Starter-floor membership (THR-419). */
  isStarter?: boolean;
}

// ─── Art Registries ─────────────────────────────────────────────
// Maps entry IDs to their art asset paths under public/assets/.
// Import the canonical ACTION_ART registry so codex thumbnails stay in sync
// with the ActionCard without duplicating entries (THR-740 — the local copy this
// comment always described is gone; `Game/actionArt.ts` is the single source, and
// codex-specific art layers in via ITEM_ART_BASE below).
import { ITEM_ART as ITEM_ART_BASE } from '../../data/item-art-registry';
import { getAttachmentArtUrl } from '../../data/artifact-category-art';
const ITEM_ART: Record<string, string> = {
  ...ITEM_ART_BASE,
  ...ACTION_ART,
};

export interface CodexCategory {
  id: string;
  label: string;
  glyph: string;
  subcategories: { id: string; label: string; count: number }[];
}

// ─── Reach Glyphs ────────────────────────────────────────────────

const REACH_GLYPHS: Record<string, string> = {
  iron: '\u2694',    // ⚔
  gold: '\u2696',    // ⚖
  shadow: '\u2734',  // ✴
  veil: '\u2728',    // ✨
  heart: '\u2665',   // ♥
  eye: '\u25C9',     // ◉
  stone: '\u25A0',   // ■
  star: '\u2605',    // ★
  flesh: '\u25CF',   // ●
  time: '\u231A',    // ⌚
  life: '\u2618',    // ☘
};

const REACH_DISPLAY: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star',
  flesh: 'Flesh', time: 'Time', life: 'Life',
};

/**
 * `ActionScale` in display form (THR-1103).
 *
 * The scale axis reached the player raw — `regional` in a detail row and again as a tag chip —
 * while the reach two lines above it resolved through {@link REACH_DISPLAY}, so one panel showed
 * a resolved key and an unresolved one side by side. Unlike `crudType` (dropped outright by
 * THR-1076 because no honest player-facing word exists for it), scale *is* player-meaningful:
 * it says how far the verb reaches, which is exactly the kind of thing a player weighs before
 * spending on it. So this one is resolved rather than deleted.
 */
const SCALE_DISPLAY: Record<string, string> = {
  personal: 'Personal', local: 'Local', regional: 'Regional', cosmic: 'Cosmic',
};

/**
 * The twelve Spheres in display form (THR-1103), derived from the canonical list so it cannot drift.
 *
 * **Why this is inside THR-1103 rather than filed after it.** The ticket scopes reach, scale and
 * visibility — but three sphere keys (`life`, `time`, `shadow`) are *also* reach keys, so a raw
 * sphere tag is indistinguishable on the panel from the raw reach tag this ticket exists to fix,
 * and the invariant test cannot pin one without the other. `Star · life sphere` shows the two
 * spellings side by side, which is the precise defect the ticket describes.
 *
 * Note the corpus also carries non-Sphere values as `sphereAffinity`. Those fall to
 * `resolveDisplay`'s plain-English fallback and warn once, which is Law 14's prescribed miss
 * behaviour and surfaces the content defect instead of hiding it behind a hand-written row.
 *
 * **Tracked as THR-1114** (split from THR-1113 item 8). Measured against the built corpus on
 * 2026-08-14 it is exactly **two** templates — `action.secrets.plant_secret` (`shadow`) and
 * `artifact.nullify` (`void`); THR-1113's description also named `star`, which no template
 * actually carries. Correcting the authored values is a content call, not a display one, so it is
 * not repaired here — and specifically, **do not add `shadow`/`void` rows to this map** to silence
 * the warning: that would make wrong data render prettily. The display layer is already right.
 */
const SPHERE_DISPLAY: Record<string, string> = Object.fromEntries(
  SPHERE_NAMES.map(s => [s, s.charAt(0).toUpperCase() + s.slice(1)]),
);

/**
 * Attachment `visibility` in display form (THR-1103).
 *
 * `divine_only` is the member that makes this unambiguous — a `snake_case` enum named by Law 14
 * verbatim. The rest read as English by luck, not by resolution, which is why they route through
 * the same vocabulary rather than being left to chance.
 */
const VISIBILITY_DISPLAY: Record<string, string> = {
  public: 'Public', known: 'Known', hidden: 'Hidden',
  discoverable: 'Discoverable', divine_only: 'Divine only',
};

/**
 * `AgreementRewardTemplate.agreementType` in display form (THR-1113).
 *
 * Six authored values, and every one of them is already an English noun a player knows — which is
 * exactly why this reached the subtitle raw and looked deliberate: `debt · Mundane` reads as a
 * design choice rather than as `template.agreementType` interpolated straight in. Routing it through
 * the vocabulary buys the capital and, more to the point, the Law 14 miss behaviour: a seventh
 * agreement type added later warns instead of quietly painting lowercase beside a capitalised tier.
 */
const AGREEMENT_TYPE_DISPLAY: Record<string, string> = {
  bargain: 'Bargain', debt: 'Debt', favour: 'Favour',
  oath: 'Oath', pact: 'Pact', treaty: 'Treaty',
};

/**
 * Agreement effect kinds in display form (THR-1113).
 *
 * These are the plainest Law 14 violation on the panel — `social_modifier, behavior_weight` is a
 * comma-joined list of internal `snake_case` enums, named by the law verbatim. Unlike `crudType`
 * (dropped by THR-1076 because no honest player word exists for it), each of these *is* sayable:
 * the player can act on knowing an oath bars actions rather than merely colouring opinion. So they
 * resolve to short verb phrases rather than to capitalised enums — `Social Modifier` would be the
 * key with better typography, not a reading.
 */
const AGREEMENT_EFFECT_DISPLAY: Record<string, string> = {
  social_modifier: 'shifts standing',
  behavior_weight: 'sways behaviour',
  action_gate: 'opens or bars actions',
  axiological_drift: 'shifts values',
  passive: 'always in force',
};

/**
 * `ResourceClass.category` in display form (THR-1113).
 *
 * Its sibling `primarySphere` was resolved by THR-1103 and the category deliberately left, so the
 * subtitle read `arcane · Time` — one resolved key beside an unresolved one, the same side-by-side
 * defect THR-1103 existed to fix, one field over. It also paints as a tag chip and a `Class` row.
 */
const RESOURCE_CATEGORY_DISPLAY: Record<string, string> = {
  staple: 'Staple', strategic: 'Strategic', luxury: 'Luxury', arcane: 'Arcane',
};

/**
 * Sidebar subcategory ids in display form (THR-1113) — the vocabulary of last resort.
 *
 * `getCodexCategories` labelled its subcategories `SLOT_TAG_DISPLAY_NAMES[id] ?? REACH_DISPLAY[id]
 * ?? id`, so any id in neither vocabulary painted raw in the nav rail. Measured against the live
 * catalog, nine did — more than the ticket named, and not the same nine: `agreement` resolves fine
 * (it has a slot-tag row), while `intelligence`, `talisman` and `charm` leak and went unnoticed
 * because nobody had enumerated the built sidebar rather than the data.
 *
 * Only ids that reach the rail belong here; everything else falls to `resolveDisplay`'s
 * plain-English fallback, which capitalises and warns once. That is the self-healing half — a new
 * slot tag renders `Reliquary` rather than `reliquary` on the day it is authored, and says so.
 */
const SUBCATEGORY_DISPLAY: Record<string, string> = {
  ...SLOT_TAG_DISPLAY_NAMES,
  ...REACH_DISPLAY,
  ...RESOURCE_CATEGORY_DISPLAY,
  divine: 'Divine',
  condition: 'Afflictions',
  intelligence: 'Intelligence',
  talisman: 'Talismans',
  charm: 'Charms',
};

/** Vocabulary misses already warned about, so the warning fires once per key, not once per entry. */
const _warnedDisplayKeys = new Set<string>();

/**
 * Resolve an internal key through a display vocabulary — Law 14's required shape.
 *
 * The law is specific about the miss case: *"A key the vocabulary cannot resolve renders as its
 * best plain-English fallback and warns once, never as the key."* The `VOCAB[key] ?? key` idiom
 * this replaces satisfies neither half — it renders the raw key and says nothing, so a newly
 * added enum member reaches the player silently and looks deliberate. Fail-soft per NFP #4: a
 * missing vocabulary row degrades the wording, never the render.
 */
function resolveDisplay(
  vocabulary: Record<string, string>,
  key: string | undefined | null,
  vocabularyName: string,
): string {
  if (!key) return '';
  const resolved = vocabulary[key];
  if (resolved) return resolved;

  const warnKey = `${vocabularyName}:${key}`;
  if (!_warnedDisplayKeys.has(warnKey)) {
    _warnedDisplayKeys.add(warnKey);
    console.warn(
      `[codexRegistry] ${vocabularyName} has no display row for '${key}' — ` +
      `rendering a plain-English fallback. Add the row (UI Law 14).`,
    );
  }
  // Best plain-English fallback: separators to spaces, leading capital. `divine_only` would
  // read `Divine only` even with no vocabulary row at all.
  return key.replace(/[_.]+/g, ' ').replace(/^./, c => c.toUpperCase());
}

/**
 * An action's price, in the shared essence display vocabulary (THR-1103).
 *
 * **The Law 13 call, made and recorded** — the one judgment this ticket asked for. Law 13 bans raw
 * magnitudes on mortal-facing surfaces, with a ratified exception (2026-08-06, THR-890) for
 * *resource-pool balances in persistent chrome*. A Codex detail row is neither a pool balance nor
 * persistent chrome, so on a plain reading that exception does not reach it — and the conclusion
 * still is that **the numeral stays**, for a reason the exception clause is not the source of.
 *
 * Essence is separately and deliberately exempt *as a price*: `shared/formatEssence.ts` (THR-1006)
 * states it outright — "Essence is the one resource the nudge model shows the player as a numeral
 * on purpose … a price you pay has to be countable" — and every cost surface in the game already
 * quotes it that way. Banding this one to a word ("slight" / "steep") would make the Codex the
 * only surface whose price cannot be weighed against the counter the player pays it from, which
 * is the failure the Law 13 amendment of 2026-08-12 describes: an adverb carries no scale a reader
 * can place against the adverb above it.
 *
 * So the defect here was never the numeral — it was `String(template.essenceCost)`, which is the
 * exact raw interpolation THR-1006 exists to prevent: no unit, and seventeen digits of IEEE-754
 * noise for an authored fractional price like `0.05`. Routing through {@link formatEssenceLabel}
 * makes the Codex quote the same pool the same way as the hand and the nudge stage. `0` renders
 * `Free`, matching `ActionCard`.
 */
function essenceCostLabel(cost: number | undefined): string {
  const value = cost ?? 0;
  return value === 0 ? 'Free' : formatEssenceLabel(value);
}

// ─── Data Mappers ────────────────────────────────────────────────

/**
 * A numeric-record property, but only when it actually carries entries (THR-1113).
 *
 * Both magnitude rows were gated on plain truthiness, and `{}` is truthy — so a condition authored
 * with an empty `domainContributions` emitted a `Domain Effects` row whose value was the empty
 * string. Measured against the live catalog: **twelve of thirteen** such rows rendered as a label
 * with nothing after it, which is a worse failure than the numeral the ticket was filed about and
 * was not named by it. A row with no value is not information; it is a label pretending to be one.
 */
function nonEmptyRecord(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, number>;
  return Object.keys(record).length > 0 ? record : null;
}

function resolveSlotTag(node: GraphNode): string {
  const props = node.properties as Record<string, unknown>;
  if (typeof props.slotTag === 'string') return props.slotTag;
  const sub = props.subcategory as string | undefined;
  if (sub && sub in SUBCATEGORY_TO_SLOT_TAG) return SUBCATEGORY_TO_SLOT_TAG[sub as keyof typeof SUBCATEGORY_TO_SLOT_TAG];
  return sub ?? 'uncategorized';
}

function mapPossession(node: GraphNode): CodexEntry {
  const p = node.properties as Record<string, unknown>;
  const tier = (p.tier as RarityTier) ?? 1;
  const sub = (p.subcategory as string) ?? 'uncategorized';
  const slotTag = resolveSlotTag(node);
  const displaySlot = SLOT_TAG_DISPLAY_NAMES[slotTag] ?? slotTag;

  return {
    id: node.id,
    name: node.name,
    glyph: getAttachmentGlyph(sub),
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category: 'possessions',
    subcategory: slotTag,
    // Bespoke plate, else this item's category plate (THR-638). Resolved here
    // rather than in the art loop below because `entry.subcategory` carries the
    // SLOT TAG, not the possession subcategory \u2014 only `sub` is the right key.
    imageAssetPath: getAttachmentArtUrl(node.id, sub) ?? undefined,
    subtitle: `${displaySlot} \u00B7 ${RARITY_TIER_NAMES[tier]}`,
    summary: (p.mechanicalSummary as string) ?? '',
    flavorText: p.flavorText as string | undefined,
    tags: (p.tags as string[]) ?? [],
    details: [
      { label: 'Slot', value: displaySlot },
      { label: 'Tier', value: RARITY_TIER_NAMES[tier] },
      ...(p.lossCondition ? [{ label: 'Loss Condition', value: p.lossCondition as string }] : []),
      ...(nonEmptyRecord(p.reachBonus) ? [{ label: 'Reach Bonus', value: formatReachBonus(nonEmptyRecord(p.reachBonus)!) }] : []),
    ],
  };
}

function mapCondition(node: GraphNode): CodexEntry {
  const p = node.properties as Record<string, unknown>;
  const tier = (p.tier as RarityTier) ?? 1;
  const sub = (p.subcategory as string) ?? 'condition';
  const tags = (p.tags as string[]) ?? [];

  // Determine condition slot from subcategory or tags
  let condSlot = sub;
  if (sub === 'condition') {
    // Check tags for #wound, #disease, #curse, #blessing
    for (const tag of tags) {
      const stripped = tag.replace('#', '');
      if (['wound', 'disease', 'curse', 'blessing', 'bestowed'].includes(stripped)) {
        condSlot = stripped;
        break;
      }
    }
  }

  const displaySlot = SLOT_TAG_DISPLAY_NAMES[condSlot] ?? condSlot;
  const glyph = getAttachmentGlyph(condSlot);

  return {
    id: node.id,
    name: node.name,
    glyph,
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category: 'conditions',
    subcategory: condSlot,
    subtitle: `${displaySlot} \u00B7 ${RARITY_TIER_NAMES[tier]}`,
    summary: (p.description as string) ?? '',
    flavorText: p.flavorText as string | undefined,
    tags,
    details: [
      { label: 'Type', value: displaySlot },
      { label: 'Tier', value: RARITY_TIER_NAMES[tier] },
      ...(nonEmptyRecord(p.domainContributions) ? [{ label: 'Domain Effects', value: formatDomainContributions(nonEmptyRecord(p.domainContributions)!) }] : []),
      // THR-1103 filed this row against `mapPossession`; it lives here in `mapCondition` —
      // `mapPossession` has no Visibility row at all. Fixed where it actually renders.
      ...(p.visibility ? [{ label: 'Visibility', value: resolveDisplay(VISIBILITY_DISPLAY, p.visibility as string, 'VISIBILITY_DISPLAY') }] : []),
    ],
  };
}

/**
 * The three action mappers below deliberately omit `template.crudType` (THR-1076).
 *
 * It is an internal taxonomy for how a template mutates the graph, and it used to reach the
 * player three ways per entry: in the card subtitle, in a detail row labelled `CRUD`, and as a
 * tag chip. Law 14 (`Docs/design-system/laws.md`) forbids raw internal keys on a player surface,
 * and `CRUD` is worse than the enum — a database term used as a player-facing label.
 *
 * It was dropped rather than given a display vocabulary because the axis is not player-meaningful:
 * `update` covers everything from blessing a company to scorching a hex, so no honest single word
 * exists for it, and a word the player cannot act on is chrome. The field stays on the template
 * for the engine; it simply has no player-facing rendering. Do not reintroduce it here —
 * `codexPlayerVocabulary.test.ts` pins its absence across the whole catalog.
 */
function mapDivineAction(template: typeof UNIFIED_ACTION_TEMPLATES[number]): CodexEntry {
  const tier = (template.rarityTier ?? 1) as RarityTier;
  const reach = template.reach as string;

  return {
    id: template.id,
    name: template.spellName ?? template.name,
    glyph: REACH_GLYPHS[reach] ?? '\u2605',
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category: 'divine',
    subcategory: 'divine',
    subtitle: `${resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY')} \u00B7 ${resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY') || 'Unknown'} sphere`,
    summary: template.description ?? '',
    flavorText: template.narrativeTemplates?.initiation,
    technicalEffect: template.technicalEffect,
    effectSource: effectSourceFor(template),
    requiresReach: template.requiresReach,
    isAscendantAction: true,
    tags: [
      resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY'),
      resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY'),
    ].filter(Boolean),
    isStarter: template.starter === true || isStarterActionId(template.id),
    details: [
      { label: 'Reach', value: resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY') },
      { label: 'Sphere', value: resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY') || 'None' },
      { label: 'Cost', value: essenceCostLabel(template.essenceCost) },
      { label: 'Scale', value: resolveDisplay(SCALE_DISPLAY, template.scale, 'SCALE_DISPLAY') },
    ],
  };
}

function mapMortalAction(template: typeof UNIFIED_ACTION_TEMPLATES[number]): CodexEntry {
  const tier = (template.rarityTier ?? 1) as RarityTier;
  const reach = template.reach as string;

  return {
    id: template.id,
    name: template.spellName ?? template.name,
    glyph: REACH_GLYPHS[reach] ?? '\u25C8',
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category: 'actions',
    subcategory: reach,
    subtitle: resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY'),
    summary: template.description ?? '',
    flavorText: template.narrativeTemplates?.initiation,
    technicalEffect: template.technicalEffect,
    effectSource: effectSourceFor(template),
    tags: [
      resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY'),
      resolveDisplay(SCALE_DISPLAY, template.scale, 'SCALE_DISPLAY'),
      resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY'),
    ].filter(Boolean),
    isStarter: template.starter === true || isStarterActionId(template.id),
    details: [
      { label: 'Reach', value: resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY') },
      { label: 'Scale', value: resolveDisplay(SCALE_DISPLAY, template.scale, 'SCALE_DISPLAY') },
      { label: 'Cost', value: essenceCostLabel(template.essenceCost) },
      ...(template.sphereAffinity ? [{ label: 'Sphere', value: resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY') }] : []),
    ],
  };
}

/** Generic mapper for target-action templates into a codex category. */
function mapTargetAction(
  template: typeof UNIFIED_ACTION_TEMPLATES[number],
  category: string,
): CodexEntry {
  const tier = (template.rarityTier ?? 1) as RarityTier;
  const reach = template.reach as string;

  return {
    id: template.id,
    name: template.spellName ?? template.name,
    glyph: REACH_GLYPHS[reach] ?? '\u25C8',
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category,
    subcategory: reach,
    subtitle: resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY'),
    summary: template.description ?? '',
    flavorText: template.narrativeTemplates?.initiation,
    technicalEffect: template.technicalEffect,
    effectSource: effectSourceFor(template),
    requiresReach: template.requiresReach,
    isAscendantAction: true,
    tags: [
      resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY'),
      resolveDisplay(SCALE_DISPLAY, template.scale, 'SCALE_DISPLAY'),
      resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY'),
    ].filter(Boolean),
    isStarter: template.starter === true || isStarterActionId(template.id),
    details: [
      { label: 'Reach', value: resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY') },
      { label: 'Scale', value: resolveDisplay(SCALE_DISPLAY, template.scale, 'SCALE_DISPLAY') },
      { label: 'Cost', value: essenceCostLabel(template.essenceCost) },
      ...(template.sphereAffinity ? [{ label: 'Sphere', value: resolveDisplay(SPHERE_DISPLAY, template.sphereAffinity, 'SPHERE_DISPLAY') }] : []),
    ],
  };
}

function mapAgreement(template: typeof AGREEMENT_REWARD_TEMPLATES[number]): CodexEntry {
  const tier = template.tier as RarityTier;

  return {
    id: template.id,
    name: template.name,
    glyph: getAttachmentGlyph(template.agreementType),
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category: 'agreements',
    subcategory: 'agreement',
    subtitle: `${resolveDisplay(AGREEMENT_TYPE_DISPLAY, template.agreementType, 'AGREEMENT_TYPE_DISPLAY')} \u00B7 ${RARITY_TIER_NAMES[tier]}`,
    summary: template.terms,
    tags: template.tags,
    details: [
      { label: 'Type', value: resolveDisplay(AGREEMENT_TYPE_DISPLAY, template.agreementType, 'AGREEMENT_TYPE_DISPLAY') },
      { label: 'Tier', value: RARITY_TIER_NAMES[tier] },
      ...(template.ticksRemaining != null ? [{ label: 'Duration', value: durationLabel(template.ticksRemaining) }] : [{ label: 'Duration', value: 'Permanent' }]),
      { label: 'Effects', value: template.effects.map(e => resolveDisplay(AGREEMENT_EFFECT_DISPLAY, e.type, 'AGREEMENT_EFFECT_DISPLAY')).join(', ') },
    ],
  };
}

// ─── Formatters ──────────────────────────────────────────────────

/**
 * A standing capability contribution, banded (THR-1113).
 *
 * **The Law 13 call, made and recorded.** THR-1103's `essenceCostLabel` kept a numeral, but only
 * because `shared/formatEssence.ts` carries a ratified, written reason for essence-as-price to be
 * countable. Nothing comparable exists for a domain contribution: it is not a price, the player
 * never pays it from a counter, and there is no other surface quoting it as a number for this one
 * to stay commensurate with. So the default answer applies and the numeral goes.
 *
 * **Why an adjective ladder and not `GROWTH_MAGNITUDE_BANDS`.** Those ladders band a *delta* — a
 * change that just happened — and read as adverbs of motion (`steadily`, `in a leap`). A codex row
 * describes a standing property of a condition the player may never have carried, so `grew steadily`
 * is the wrong tense and the wrong claim. These are adjectives of size instead.
 *
 * **Scale anchor:** `capabilityGrowth.ts` builds a full-weight contribution as `{ [domain]: 1.0 }`,
 * so 1.0 is the whole of a domain and the rungs descend from there. Measured against the live
 * catalog the two authored values (0.04, 0.02) land on *different* rungs — `slight` and `faint` —
 * which is deliberate: a ladder whose entire corpus collapses onto one rung is pinned by nothing.
 */
const CAPABILITY_CONTRIBUTION_BANDS: readonly MagnitudeBand[] = [
  { min: 0.50, word: 'commanding' },
  { min: 0.25, word: 'strong' },
  { min: 0.10, word: 'solid' },
  { min: 0.03, word: 'slight' },
  { min: 0,    word: 'faint' },
];

/**
 * A possession's reach bonus, banded (THR-1113) — same reasoning, different scale.
 *
 * Reach bonuses are raw reach points rather than a 0–1 weight; the capability sigmoid runs roughly
 * 4–20 raw and saturates above that, so a whole-number bonus of 2 is modest rather than large.
 *
 * **This row has no population in the catalog today** — measured 2026-08-14, `reachBonus` is absent
 * from all 119 possessions, so `mapPossession` never emits the row. It is fixed anyway, because the
 * cost is one call and the alternative is that whoever authors the first possession carrying one
 * ships `+2 Iron` to the player. But the ladder is pinned by a direct unit test on the formatter
 * rather than by a catalog sweep: a sweep over zero rows passes while asserting nothing, and would
 * read as coverage.
 */
const REACH_BONUS_BANDS: readonly MagnitudeBand[] = [
  { min: 8, word: 'commanding' },
  { min: 5, word: 'strong' },
  { min: 3, word: 'solid' },
  { min: 1, word: 'slight' },
  { min: 0, word: 'faint' },
];

/**
 * Band a signed contribution into a phrase that keeps its direction.
 *
 * Sign carries as much meaning as size here — a curse and a blessing are the same row with opposite
 * numbers — so banding must not flatten it. `edge` / `drag` say which way it cuts in words the
 * ladder can sit inside: `a slight edge in Gold`, `a solid drag on Iron`.
 */
function contributionPhrase(
  value: number,
  key: string,
  bands: readonly MagnitudeBand[],
): string {
  const word = magnitudeWord(value, bands);
  const reach = resolveDisplay(REACH_DISPLAY, key, 'REACH_DISPLAY');
  return value >= 0 ? `a ${word} edge in ${reach}` : `a ${word} drag on ${reach}`;
}

/**
 * Exported for direct testing (THR-1113), not for use outside this module.
 *
 * `formatReachBonus` has **no catalog population** — no possession authors a `reachBonus` — so a
 * sweep over built entries would pass while asserting nothing about it, which is the vacuous-probe
 * shape. Pinning it needs a direct call, and that needs an export. `formatDomainContributions` and
 * `durationLabel` are exported alongside it so all three ladders are pinned the same way rather
 * than one of them being pinned differently for a reason a later reader would have to reconstruct.
 */
export function formatReachBonus(bonus: Record<string, number>): string {
  return Object.entries(bonus)
    .map(([reach, val]) => contributionPhrase(val, reach, REACH_BONUS_BANDS))
    .join(', ');
}

/** Exported for direct testing (THR-1113) — see {@link formatReachBonus}. */
export function formatDomainContributions(contributions: Record<string, number>): string {
  return Object.entries(contributions)
    .map(([domain, val]) => contributionPhrase(val, domain, CAPABILITY_CONTRIBUTION_BANDS))
    .join(', ');
}

/**
 * Re-exported (THR-1143). The ladder itself moved to `engine/aftermathWords` when
 * the location-condition panel needed the same reading for a place's conditions —
 * a second copy would have been two ladders for one quantity (UI Law 3). Callers
 * and behaviour are unchanged; this export keeps the Codex's own tests and
 * imports pointing where they already did.
 */
export { durationLabel } from '../../engine/aftermathWords';

// ─── Deduplication ───────────────────────────────────────────────

function deduplicateNodes(nodes: GraphNode[]): GraphNode[] {
  const seen = new Set<string>();
  return nodes.filter(n => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

// ─── Public API ──────────────────────────────────────────────────

let _cachedEntries: CodexEntry[] | null = null;


/** Resource classes (THR-617) — the economy's raw vocabulary as codex entries. */
const RESOURCE_CATEGORY_GLYPHS: Record<string, string> = {
  staple: '☘',    // shamrock — food and field
  strategic: '⚒', // hammer and pick — war and works
  luxury: '◈',    // diamond — trade wealth
  arcane: '✴',    // star burst — the strange trades
};

function mapResourceClass(resourceId: string): CodexEntry {
  const cls = RESOURCE_CLASSES[resourceId];
  const displayName = RESOURCE_DEFINITIONS[resourceId]?.name
    ?? resourceId.replace(/_/g, ' ').replace(/\w/g, (c) => c.toUpperCase());
  const tier = (cls.baseValue >= 1.2 ? 2 : 1) as RarityTier;
  return {
    id: `resource.${resourceId}`,
    name: displayName,
    glyph: RESOURCE_CATEGORY_GLYPHS[cls.category] ?? '◆',
    tier,
    tierName: RARITY_TIER_NAMES[tier] ?? 'Unknown',
    tierColor: RARITY_TIER_COLORS[tier] ?? '#888',
    category: 'resources',
    subcategory: cls.category,
    // Sphere resolves here too — a resource's `primarySphere` is the same key vocabulary as an
    // action's `sphereAffinity`, and it reached the player raw in the subtitle, a tag chip and a
    // detail row (THR-1103). `cls.category` was left behind by that ticket and is resolved here
    // (THR-1113) — until then the subtitle read `arcane · Time`, one resolved key beside a raw one.
    subtitle: `${resolveDisplay(RESOURCE_CATEGORY_DISPLAY, cls.category, 'RESOURCE_CATEGORY_DISPLAY')} · ${resolveDisplay(SPHERE_DISPLAY, cls.primarySphere, 'SPHERE_DISPLAY')}`,
    summary: getResourceTierProse(resourceId, 'scarce'),
    flavorText: getResourceTierProse(resourceId, 'surplus'),
    tags: [
      resolveDisplay(RESOURCE_CATEGORY_DISPLAY, cls.category, 'RESOURCE_CATEGORY_DISPLAY'),
      resolveDisplay(SPHERE_DISPLAY, cls.primarySphere, 'SPHERE_DISPLAY'),
    ],
    details: [
      { label: 'Class', value: resolveDisplay(RESOURCE_CATEGORY_DISPLAY, cls.category, 'RESOURCE_CATEGORY_DISPLAY') },
      { label: 'Sphere affinity', value: resolveDisplay(SPHERE_DISPLAY, cls.primarySphere, 'SPHERE_DISPLAY') },
      { label: 'Trade value', value: cls.baseValue >= 1.2 ? 'high' : cls.baseValue >= 0.9 ? 'solid' : 'modest' },
      { label: 'Scarcity bite', value: cls.scarcitySensitivity >= 1.0 ? 'sharp' : 'gentle' },
    ],
  };
}

export function getAllCodexEntries(): CodexEntry[] {
  if (_cachedEntries) return _cachedEntries;

  const entries: CodexEntry[] = [];

  // Divine actions — the generic divine interventions plus the eight reach signatures
  // (`invest.*`, THR-503). The signatures are the only reach-*locked* ascendant cards, so
  // cataloguing them here is what makes the "locked this incarnation" state legible in the
  // Codex (THR-613 Slice 3b-tail) — the live drawer hides them, and without this they were
  // absent from the catalog entirely.
  const divineTemplates = UNIFIED_ACTION_TEMPLATES.filter(
    t => t.id.startsWith('divine.') || t.id.startsWith('invest.'),
  );
  for (const t of divineTemplates) entries.push(mapDivineAction(t));

  // Mortal actions
  const mortalTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('action.'));
  for (const t of mortalTemplates) entries.push(mapMortalAction(t));

  // Hex actions
  const hexTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('hex.'));
  for (const t of hexTemplates) entries.push(mapTargetAction(t, 'hex'));

  // Location actions
  const locTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('loc.'));
  for (const t of locTemplates) entries.push(mapTargetAction(t, 'location'));

  // Sublocation actions
  const subTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('sub.'));
  for (const t of subTemplates) entries.push(mapTargetAction(t, 'location'));

  // Artifact actions
  const artifactTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('artifact.'));
  for (const t of artifactTemplates) entries.push(mapTargetAction(t, 'artifact'));

  // Company actions (THR-999) — the four verbs that act on a company of travelling
  // mortals rather than on one agent. Their own category because this catalog is
  // organised by what a verb acts *upon* (hex / place / artifact / thread), and a
  // company is its own target class; folding them into Divine Actions would blur a
  // category that otherwise reads as "what you do to a person".
  const companyTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('company.'));
  for (const t of companyTemplates) entries.push(mapTargetAction(t, 'company'));

  // Thread & insight actions (thread-binding + agent observation + thread management).
  // `thread.*` (dormant / reactivate) was uncatalogued alongside `company.*` until
  // THR-999 — it manages an existing thread's court position, so it belongs with the
  // binding verbs rather than in a category of its own.
  const threadTemplates = UNIFIED_ACTION_TEMPLATES.filter(t =>
    t.id.startsWith('bind_thread_') || t.id.startsWith('thread.') || ['observe_agent', 'scry_agent', 'whisper_insight', 'dream_sending'].includes(t.id)
  );
  for (const t of threadTemplates) entries.push(mapTargetAction(t, 'threads'));

  // Possessions (deduplicate starter + reward)
  const allPossessions = deduplicateNodes([...REWARD_POSSESSIONS, ...STARTER_POSSESSIONS]);
  for (const n of allPossessions) entries.push(mapPossession(n));

  // Conditions (deduplicate reward + starter + bestowed)
  const allConditions = deduplicateNodes([...REWARD_CONDITIONS, ...REWARD_BESTOWED_POWERS, ...STARTER_CONDITIONS]);
  for (const n of allConditions) entries.push(mapCondition(n));

  // Agreements
  for (const a of AGREEMENT_REWARD_TEMPLATES) entries.push(mapAgreement(a));

  // Resource classes (THR-617) — the mortal economy's goods vocabulary
  for (const resourceId of Object.keys(RESOURCE_CLASSES).sort()) {
    entries.push(mapResourceClass(resourceId));
  }

  // Attach art asset paths where available
  for (const entry of entries) {
    // Does not clobber a plate already resolved by `mapPossession` — for a
    // bespoke item both paths agree, and for a category plate ITEM_ART has no
    // row at all.
    if (!entry.imageAssetPath && entry.id in ITEM_ART) entry.imageAssetPath = ITEM_ART[entry.id];
  }

  _cachedEntries = entries;
  return entries;
}

export function getCodexCategories(): CodexCategory[] {
  const entries = getAllCodexEntries();

  const catDefs: { id: string; label: string; glyph: string }[] = [
    { id: 'divine', label: 'Divine Actions', glyph: '\u2605' },
    { id: 'hex', label: 'Hex Actions', glyph: '\u2B21' },
    { id: 'location', label: 'Place Actions', glyph: '\u2302' },
    { id: 'artifact', label: 'Artifact Actions', glyph: '\u2726' },
    // Asterism - three marks travelling together (THR-999).
    { id: 'company', label: 'Company Actions', glyph: '\u2042' },
    { id: 'threads', label: 'Thread & Insight', glyph: '\u2058' },
    { id: 'actions', label: 'Mortal Actions', glyph: '\u2694' },
    { id: 'possessions', label: 'Possessions', glyph: '\u25C6' },
    { id: 'conditions', label: 'Conditions', glyph: '\u2715' },
    { id: 'agreements', label: 'Agreements', glyph: '\u260D' },
    // Resource classes have been mapped to entries since the P3 economy work
    // (92383535) but never had a tab, so the whole category was catalogued and
    // unreachable - the same "no catalog arm" defect as company.* (THR-999),
    // one layer further on. Scales: these entries are about trade value.
    { id: 'resources', label: 'Resources', glyph: '\u2696' },
  ];

  return catDefs.map(cat => {
    const catEntries = entries.filter(e => e.category === cat.id);
    const subMap = new Map<string, number>();
    for (const e of catEntries) {
      subMap.set(e.subcategory, (subMap.get(e.subcategory) ?? 0) + 1);
    }

    const subcategories = Array.from(subMap.entries()).map(([id, count]) => ({
      id,
      // Was `SLOT_TAG_DISPLAY_NAMES[id] ?? REACH_DISPLAY[id] ?? id` — the `?? id` tail painted nine
      // measured ids raw in the nav rail (THR-1113). `SUBCATEGORY_DISPLAY` merges both vocabularies
      // and adds the rest; anything still unlisted takes the plain-English fallback and warns.
      label: resolveDisplay(SUBCATEGORY_DISPLAY, id, 'SUBCATEGORY_DISPLAY'),
      count,
    }));

    return { ...cat, subcategories };
  });
}
