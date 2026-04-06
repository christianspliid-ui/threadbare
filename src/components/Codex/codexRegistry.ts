/**
 * Codex Registry — maps game data into a uniform CodexEntry shape for browsing.
 *
 * Unlike the CMS registry (raw data tables for devs), this produces curated,
 * player-friendly entries with prose, glyphs, and tier colors.
 */

import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { REWARD_POSSESSIONS, REWARD_CONDITIONS, REWARD_BESTOWED_POWERS } from '../../data/reward-attachment-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../../data/starter-attachments';
import { AGREEMENT_REWARD_TEMPLATES } from '../../data/agreement-reward-catalog';
import { SLOT_TAG_DISPLAY_NAMES, SUBCATEGORY_TO_SLOT_TAG } from '../../data/attachment-slot-constants';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS } from '../../types/rarity';
import type { RarityTier } from '../../types/rarity';
import type { GraphNode } from '../../types/graph';
import { getAttachmentGlyph } from '../Game/attachmentGlyphs';

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
  tags: string[];
  /** Extra key-value details shown in the detail panel */
  details: { label: string; value: string }[];
}

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
      ...(p.visibility ? [{ label: 'Visibility', value: p.visibility as string }] : []),
    ],
  };
}

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
    subtitle: `${REACH_DISPLAY[reach] ?? reach} \u00B7 ${template.sphereAffinity ?? 'unknown'} sphere`,
    summary: template.description ?? '',
    flavorText: template.narrativeTemplates?.initiation,
    tags: [reach, template.sphereAffinity ?? '', template.crudType].filter(Boolean),
    details: [
      { label: 'Reach', value: REACH_DISPLAY[reach] ?? reach },
      { label: 'Sphere', value: template.sphereAffinity ?? 'none' },
      { label: 'Essence Cost', value: String(template.essenceCost) },
      { label: 'CRUD', value: template.crudType },
      { label: 'Scale', value: template.scale },
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
    subtitle: `${REACH_DISPLAY[reach] ?? reach} \u00B7 ${template.crudType}`,
    summary: template.description ?? '',
    flavorText: template.narrativeTemplates?.initiation,
    tags: [reach, template.crudType, template.scale, template.sphereAffinity ?? ''].filter(Boolean),
    details: [
      { label: 'Reach', value: REACH_DISPLAY[reach] ?? reach },
      { label: 'CRUD', value: template.crudType },
      { label: 'Scale', value: template.scale },
      { label: 'Essence Cost', value: String(template.essenceCost) },
      ...(template.sphereAffinity ? [{ label: 'Sphere', value: template.sphereAffinity }] : []),
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
    .map(([reach, val]) => `${val >= 0 ? '+' : ''}${val} ${REACH_DISPLAY[reach] ?? reach}`)
    .join(', ');
}

function formatDomainContributions(contributions: Record<string, number>): string {
  return Object.entries(contributions)
    .map(([domain, val]) => `${val >= 0 ? '+' : ''}${val.toFixed(2)} ${REACH_DISPLAY[domain] ?? domain}`)
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

export function getAllCodexEntries(): CodexEntry[] {
  if (_cachedEntries) return _cachedEntries;

  const entries: CodexEntry[] = [];

  // Divine actions
  const divineTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('divine.'));
  for (const t of divineTemplates) entries.push(mapDivineAction(t));

  // Mortal actions
  const mortalTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('action.'));
  for (const t of mortalTemplates) entries.push(mapMortalAction(t));

  // Possessions (deduplicate starter + reward)
  const allPossessions = deduplicateNodes([...REWARD_POSSESSIONS, ...STARTER_POSSESSIONS]);
  for (const n of allPossessions) entries.push(mapPossession(n));

  // Conditions (deduplicate reward + starter + bestowed)
  const allConditions = deduplicateNodes([...REWARD_CONDITIONS, ...REWARD_BESTOWED_POWERS, ...STARTER_CONDITIONS]);
  for (const n of allConditions) entries.push(mapCondition(n));

  // Agreements
  for (const a of AGREEMENT_REWARD_TEMPLATES) entries.push(mapAgreement(a));

  _cachedEntries = entries;
  return entries;
}

export function getCodexCategories(): CodexCategory[] {
  const entries = getAllCodexEntries();

  const catDefs: { id: string; label: string; glyph: string }[] = [
    { id: 'divine', label: 'Divine Actions', glyph: '\u2605' },
    { id: 'actions', label: 'Mortal Actions', glyph: '\u2694' },
    { id: 'possessions', label: 'Possessions', glyph: '\u25C6' },
    { id: 'conditions', label: 'Conditions', glyph: '\u2715' },
    { id: 'agreements', label: 'Agreements', glyph: '\u260D' },
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
