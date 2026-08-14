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
 * Note the corpus also carries `shadow` / `star` / `void` as `sphereAffinity`, none of which are
 * Spheres — they are reach names in a sphere field. Those fall to `resolveDisplay`'s plain-English
 * fallback and warn once, which is Law 14's prescribed miss behaviour and surfaces the content
 * defect instead of hiding it behind a hand-written row. Filed separately; not repaired here,
 * because correcting authored content is a content call, not a display one.
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
      ...(p.reachBonus ? [{ label: 'Reach Bonus', value: formatReachBonus(p.reachBonus as Record<string, number>) }] : []),
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
      ...(p.domainContributions ? [{ label: 'Domain Effects', value: formatDomainContributions(p.domainContributions as Record<string, number>) }] : []),
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
    subtitle: `${template.agreementType} \u00B7 ${RARITY_TIER_NAMES[tier]}`,
    summary: template.terms,
    tags: template.tags,
    details: [
      { label: 'Type', value: template.agreementType },
      { label: 'Tier', value: RARITY_TIER_NAMES[tier] },
      ...(template.ticksRemaining != null ? [{ label: 'Duration', value: `${template.ticksRemaining} ticks` }] : [{ label: 'Duration', value: 'Permanent' }]),
      { label: 'Effects', value: template.effects.map(e => e.type).join(', ') },
    ],
  };
}

// ─── Formatters ──────────────────────────────────────────────────

function formatReachBonus(bonus: Record<string, number>): string {
  return Object.entries(bonus)
    .map(([reach, val]) => `${val >= 0 ? '+' : ''}${val} ${resolveDisplay(REACH_DISPLAY, reach, 'REACH_DISPLAY')}`)
    .join(', ');
}

function formatDomainContributions(contributions: Record<string, number>): string {
  return Object.entries(contributions)
    .map(([domain, val]) => `${val >= 0 ? '+' : ''}${val.toFixed(2)} ${resolveDisplay(REACH_DISPLAY, domain, 'REACH_DISPLAY')}`)
    .join(', ');
}

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
    // detail row (THR-1103). `cls.category` is left alone deliberately: it is filed, not fixed.
    subtitle: `${cls.category} · ${resolveDisplay(SPHERE_DISPLAY, cls.primarySphere, 'SPHERE_DISPLAY')}`,
    summary: getResourceTierProse(resourceId, 'scarce'),
    flavorText: getResourceTierProse(resourceId, 'surplus'),
    tags: [cls.category, resolveDisplay(SPHERE_DISPLAY, cls.primarySphere, 'SPHERE_DISPLAY')],
    details: [
      { label: 'Class', value: cls.category },
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
      label: SLOT_TAG_DISPLAY_NAMES[id] ?? REACH_DISPLAY[id] ?? id,
      count,
    }));

    return { ...cat, subcategories };
  });
}
