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
  /** Optional path to an art asset (relative to public/) */
  imageAssetPath?: string;
}

// ─── Art Registries ─────────────────────────────────────────────
// Maps entry IDs to their art asset paths under public/assets/.
// Import the canonical ACTION_ART registry so codex thumbnails stay in sync
// with the ActionCard without duplicating entries.
const ACTION_ART: Record<string, string> = {
  'divine.dream': '/assets/actions/oneiric-sending.jpg',
  'divine.persuade': '/assets/actions/divine-compulsion.jpg',
  'divine.deceive': '/assets/actions/veil-of-falsehood.jpg',
  'divine.intimidate': '/assets/actions/wrath-descending.jpg',
  'divine.inspire': '/assets/actions/breath-of-purpose.jpg',
  'divine.coincidence': '/assets/actions/thread-of-fate.jpg',
  'divine.omen': '/assets/actions/starfall-omen.jpg',
  'divine.afflict_bless': '/assets/actions/aegis-of-grace.jpg',
  'bind_thread_agent': '/assets/actions/agent-thread.jpg',
  'bind_thread_agent_strong': '/assets/actions/strong-agent-thread.jpg',
  'bind_thread_location': '/assets/actions/place-thread.jpg',
  'bind_thread_faction': '/assets/actions/faction-thread.jpg',
  'bind_thread_army': '/assets/actions/army-thread.jpg',
  'bind_thread_artifact': '/assets/actions/artifact-thread.jpg',
  'observe_agent': '/assets/actions/piercing-gaze.jpg',
  'scry_agent': '/assets/actions/far-sight.jpg',
  'whisper_insight': '/assets/actions/illuminating-whisper.jpg',
  'dream_sending': '/assets/actions/prophetic-dream.jpg',
  'loc.ward': '/assets/actions/rune-of-warding.jpg',
  'loc.place_of_power': '/assets/actions/leyline-nexus.jpg',
  'loc.incite_unrest': '/assets/actions/seeds-of-discord.jpg',
  'loc.fortify': '/assets/actions/iron-bulwark.jpg',
  'sub.sanctify': '/assets/actions/sacred-ground.jpg',
  'sub.trap': '/assets/actions/hidden-snare.jpg',
  'sub.vision': '/assets/actions/place-memory.jpg',
  'artifact.enchant': '/assets/actions/rune-inscription.jpg',
  'artifact.attune': '/assets/actions/sphere-resonance.jpg',
  'artifact.nullify': '/assets/actions/void-unraveling.jpg',
  'artifact.curse': '/assets/actions/malediction-bound.jpg',
  'hex.sense_threads': '/assets/actions/thread-sight.jpg',
  'hex.survey': '/assets/actions/divine-survey.jpg',
  'hex.dowse_resources': '/assets/actions/earthen-dowsing.jpg',
  'hex.read_currents': '/assets/actions/current-reading.jpg',
  'hex.sense_leylines': '/assets/actions/leyline-sensing.jpg',
  'hex.forge_seer_token': '/assets/actions/token-of-far-sight.jpg',
  'hex.divine_populace': '/assets/actions/people-reading.jpg',
  'hex.scry_factions': '/assets/actions/faction-scrying.jpg',
  'hex.mark_ground': '/assets/actions/questing-beacon.jpg',
  'hex.plant_dream': '/assets/actions/memory-dream.jpg',
  'hex.read_stones': '/assets/actions/stone-memory.jpg',
  'hex.whisper_intuition': '/assets/actions/ruin-intuition.jpg',
  'hex.bless_land': '/assets/actions/lands-blessing.jpg',
  'hex.corrupt_land': '/assets/actions/taint-of-entropy.jpg',
  'hex.seed_life': '/assets/actions/verdant-awakening.jpg',
  'hex.raise_landmark': '/assets/actions/stones-rising.jpg',
  'hex.shift_season': '/assets/actions/seasonal-turn.jpg',
  'hex.scorch_earth': '/assets/actions/iron-scorching.jpg',
  'hex.rend_earth': '/assets/actions/earth-sundering.jpg',
  'hex.restore_fragment': '/assets/actions/fragment-restoration.jpg',
  'hex.bury_past': '/assets/actions/earth-burial.jpg',
  'hex.desecrate': '/assets/actions/ruin-desecration.jpg',
  'hex.attune_leyline': '/assets/actions/leyline-forging.jpg',
  'hex.shift_dominion': '/assets/actions/arcane-rebalance.jpg',
  'hex.amplify_flow': '/assets/actions/current-surge.jpg',
  'hex.sever_flow': '/assets/actions/arcane-silencing.jpg',
  'hex.dispel_wild': '/assets/actions/wild-purging.jpg',
  'hex.rewrite_history': '/assets/actions/memory-revision.jpg',
  'hex.consecrate_past': '/assets/actions/past-consecration.jpg',
  'hex.spark_encounter': '/assets/actions/convergence-weaving.jpg',
  'hex.forge_instrument': '/assets/actions/instrument-forging.jpg',
  'hex.stir_people': '/assets/actions/hearts-stirring.jpg',
  'hex.summon_congregation': '/assets/actions/gathering-call.jpg',
  'hex.bestow_vision': '/assets/actions/prophetic-sending.jpg',
  'hex.scatter': '/assets/actions/iron-dispersal.jpg',
  'hex.smite': '/assets/actions/divine-smiting.jpg',
  'hex.incite_exodus': '/assets/actions/umbral-exodus.jpg',
  'hex.send_herald': '/assets/actions/herald-sending.jpg',
  'hex.claim_dominion': '/assets/actions/sovereign-claim.jpg',
  'hex.cultivate': '/assets/actions/sustained-bloom.jpg',
  'hex.claim_resource': '/assets/actions/resource-binding.jpg',
  'hex.anchor_sphere': '/assets/actions/sphere-anchoring.jpg',
  'hex.tap_source': '/assets/actions/source-tapping.jpg',
  'hex.attune_thread': '/assets/actions/thread-attunement.jpg',
  'hex.channel_current': '/assets/actions/current-channeling.jpg',
  'hex.shepherd_flock': '/assets/actions/flock-shepherding.jpg',
  'hex.install_champion': '/assets/actions/champion-installation.jpg',
  'hex.strengthen_thread': '/assets/actions/thread-strengthening.jpg',
  'hex.impose_decree': '/assets/actions/divine-decree.jpg',
  'hex.bind_echoes': '/assets/actions/echo-binding.jpg',
  'hex.compel_exploration': '/assets/actions/exploration-compulsion.jpg',
  'hex.seal_tomb': '/assets/actions/tomb-sealing.jpg',
  'hex.ward_against_deep': '/assets/actions/delvers-ward.jpg',
};
import { ITEM_ART as ITEM_ART_BASE } from '../../data/item-art-registry';
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

  // Thread & insight actions (thread-binding + agent observation)
  const threadTemplates = UNIFIED_ACTION_TEMPLATES.filter(t =>
    t.id.startsWith('bind_thread_') || ['observe_agent', 'scry_agent', 'whisper_insight', 'dream_sending'].includes(t.id)
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

  // Attach art asset paths where available
  for (const entry of entries) {
    if (entry.id in ITEM_ART) entry.imageAssetPath = ITEM_ART[entry.id];
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
    { id: 'threads', label: 'Thread & Insight', glyph: '\u2058' },
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
