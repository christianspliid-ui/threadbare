/**
 * Attachment Slot Resolver — slot counting, effective caps, and overflow victim selection.
 *
 * Pure functions: return patch instructions and trace payloads instead of
 * mutating the graph. The caller (phaseSlotCaps) applies mutations.
 *
 * Design doc: Docs/plans/2026-04-06-attachment-slot-system-design.md
 */

import type { WorldGraph, GraphEdge } from './graph';
import type { AttachmentEffect } from '../types/effects';
import type { PossessionSubcategory } from '../types/attachments';
import {
  SLOT_CAPS,
  CONDITION_CAPS,
  SUBCATEGORY_TO_SLOT_TAG,
  MAX_SLOT_BONUS_PER_ITEM,
} from '../data/attachment-slot-constants';
import { collectAttachmentEffects } from './effects/effectWalker';
import type { EffectRuntimeState } from '../types/effects';

// ─── Types ────────────────────────────────────────────────────────

/** Normalized attachment entry for slot accounting. */
export interface SlotInventoryEntry {
  /** Edge ID (stable identity for both node-backed and edge-backed items). */
  edgeId: string;
  /** Node ID for possessions/traits, edge ID for agreements. */
  attachmentId: string;
  /** Human-readable name. */
  name: string;
  /** Resolved slot tag. */
  slotTag: string;
  /** Rarity tier (1–4). */
  tier: number;
  /** Tick when this attachment was acquired (used for overflow priority). */
  acquiredTick: number;
  /** Whether this attachment is currently active. */
  active: boolean;
  /** Reason for inactivity, if applicable. */
  inactiveReason?: string;
  /** Tick when this item was deactivated due to overflow. */
  overflowTick?: number;
  /** Whether this is a quest/pinned item (exempt from overflow). */
  isPinned: boolean;
  /** 'possession' | 'condition' | 'agreement' */
  kind: 'possession' | 'condition' | 'agreement';
}

/** Deactivation instruction returned by overflow resolution. */
export interface DeactivationPatch {
  edgeId: string;
  attachmentId: string;
  name: string;
  slotTag: string;
  reason: string;
}

// ─── Slot Tag Resolution ──────────────────────────────────────────

/**
 * Resolve the slot tag for an attachment, preferring explicit `slotTag`
 * over legacy `subcategory` mapping. Returns undefined if uncategorized.
 */
export function resolveSlotTag(
  slotTag: string | undefined,
  subcategory: string | undefined,
): string | undefined {
  if (slotTag) return slotTag;
  if (subcategory && subcategory in SUBCATEGORY_TO_SLOT_TAG) {
    return SUBCATEGORY_TO_SLOT_TAG[subcategory as PossessionSubcategory];
  }
  return undefined;
}

// ─── Inventory Collection ─────────────────────────────────────────

/**
 * Collect all attachments for an agent into a normalized inventory.
 * Includes possessions, conditions, and agreements.
 */
export function collectAgentAttachmentInventory(
  graph: WorldGraph,
  agentId: string,
): SlotInventoryEntry[] {
  const inventory: SlotInventoryEntry[] = [];

  // ─── Possessions: possesses + bonded_to edges → artifact nodes
  const possessEdges = [
    ...graph.getOutgoingEdges(agentId, 'possesses'),
    ...graph.getOutgoingEdges(agentId, 'bonded_to'),
  ];

  for (const edge of possessEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;

    const props = node.properties;
    const tag = resolveSlotTag(
      props.slotTag as string | undefined,
      props.subcategory as string | undefined,
    );

    const isPinned = tag === 'quest' || props.lossCondition === 'permanent';

    inventory.push({
      edgeId: edge.id,
      attachmentId: node.id,
      name: node.name ?? node.id,
      slotTag: tag ?? 'uncategorized',
      tier: (props.tier as number) ?? 1,
      acquiredTick: (props.acquiredTick as number) ?? 0,
      active: edge.properties.active !== false,
      inactiveReason: edge.properties.inactiveReason as string | undefined,
      overflowTick: edge.properties.overflowTick as number | undefined,
      isPinned,
      kind: 'possession',
    });
  }

  // ─── Conditions: has_trait edges where subcategory is condition/blessing/curse/bestowed
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;

    const props = node.properties;
    const category = (props.subcategory ?? props.category) as string | undefined;
    if (category !== 'condition' && category !== 'blessing' && category !== 'curse' && category !== 'bestowed') {
      continue;
    }

    // Determine condition slot from tags
    const nodeTags = (props.tags as string[]) ?? [];
    let condSlot = 'wound'; // default
    if (nodeTags.includes('#blessing') || category === 'blessing') condSlot = 'blessing';
    else if (nodeTags.includes('#curse') || category === 'curse') condSlot = 'curse';
    else if (nodeTags.includes('#disease')) condSlot = 'disease';
    else if (category === 'bestowed') condSlot = 'bestowed';

    inventory.push({
      edgeId: edge.id,
      attachmentId: node.id,
      name: node.name ?? node.id,
      slotTag: condSlot,
      tier: (props.tier as number) ?? 1,
      acquiredTick: (props.acquiredTick as number) ?? (edge.properties.acquiredTick as number) ?? 0,
      active: edge.properties.active !== false,
      inactiveReason: edge.properties.inactiveReason as string | undefined,
      overflowTick: edge.properties.overflowTick as number | undefined,
      isPinned: false,
      kind: 'condition',
    });
  }

  // ─── Agreements: relates_to edges with agreement === true
  const relatesToEdges = graph.getOutgoingEdges(agentId, 'relates_to');
  for (const edge of relatesToEdges) {
    if (!edge.properties.agreement) continue;

    inventory.push({
      edgeId: edge.id,
      attachmentId: edge.id,
      name: (edge.properties.agreementName as string) ?? 'Agreement',
      slotTag: 'agreement',
      tier: (edge.properties.tier as number) ?? 1,
      acquiredTick: (edge.properties.acquiredTick as number) ?? 0,
      active: edge.properties.active !== false,
      inactiveReason: edge.properties.inactiveReason as string | undefined,
      overflowTick: edge.properties.overflowTick as number | undefined,
      isPinned: false,
      kind: 'agreement',
    });
  }

  return inventory;
}

// ─── Effective Cap Computation ────────────────────────────────────

/**
 * Compute effective slot caps by summing base caps with active slot_bonus effects.
 * Effective cap is always >= 0 (clamped).
 */
export function computeEffectiveSlotCaps(
  graph: WorldGraph,
  agentId: string,
  effectStates?: ReadonlyMap<string, EffectRuntimeState>,
): Record<string, number> {
  // Start with base caps
  const caps: Record<string, number> = { ...SLOT_CAPS, ...CONDITION_CAPS };

  // Collect slot_bonus effects from active attachments
  const effects = collectAttachmentEffects(graph, agentId, effectStates);
  for (const entry of effects) {
    if (entry.effect.type === 'slot_bonus') {
      const bonus = Math.min(entry.effect.bonus, MAX_SLOT_BONUS_PER_ITEM);
      const slot = entry.effect.slotTag;
      if (slot in caps) {
        caps[slot] = Math.max(0, caps[slot] + bonus);
      } else {
        // Forward-compatible: new slot tag gets the bonus as its cap
        caps[slot] = Math.max(0, bonus);
      }
    }
  }

  return caps;
}

// ─── Overflow Victim Selection ────────────────────────────────────

/**
 * Choose which item to deactivate when a slot overflows.
 * Priority: lower tier first → older acquisition tick first → deterministic fallback.
 *
 * Only considers active, non-pinned items in the overflowing slot.
 */
export function chooseOverflowVictim(
  items: SlotInventoryEntry[],
  seed: number,
): SlotInventoryEntry | null {
  const candidates = items.filter(i => i.active && !i.isPinned);
  if (candidates.length === 0) return null;

  // Sort: lower tier first, then older acquiredTick, then deterministic tiebreak
  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.acquiredTick !== b.acquiredTick) return a.acquiredTick - b.acquiredTick;
    // Seeded tiebreak: hash the edge IDs
    const hashA = simpleHash(a.edgeId + seed);
    const hashB = simpleHash(b.edgeId + seed);
    return hashA - hashB;
  });

  return candidates[0];
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

// ─── Slot Cap Enforcement ─────────────────────────────────────────

/**
 * Identify items that need deactivation due to slot overflow.
 * Returns patch instructions — does not mutate the graph.
 */
export function enforcePossessionSlotCaps(
  inventory: SlotInventoryEntry[],
  effectiveCaps: Record<string, number>,
  seed: number,
): DeactivationPatch[] {
  const patches: DeactivationPatch[] = [];

  // Group active non-pinned items by slot tag
  const slotGroups = new Map<string, SlotInventoryEntry[]>();
  for (const item of inventory) {
    if (item.kind === 'condition') continue; // conditions handled separately
    if (!item.active) continue;
    if (item.isPinned) continue;

    const group = slotGroups.get(item.slotTag) ?? [];
    group.push(item);
    slotGroups.set(item.slotTag, group);
  }

  for (const [slotTag, items] of slotGroups) {
    const cap = effectiveCaps[slotTag];
    if (cap === undefined) continue; // uncapped slot — no enforcement

    while (items.length > cap) {
      const victim = chooseOverflowVictim(items, seed);
      if (!victim) break;

      patches.push({
        edgeId: victim.edgeId,
        attachmentId: victim.attachmentId,
        name: victim.name,
        slotTag,
        reason: `${slotTag} slots full (${items.length}/${cap})`,
      });

      // Remove victim from the working list
      const idx = items.indexOf(victim);
      if (idx >= 0) items.splice(idx, 1);
    }
  }

  return patches;
}

/**
 * Identify conditions that exceed their slot caps.
 * Returns the slot tag and count for the overflow handler to process.
 */
export function findConditionOverflows(
  inventory: SlotInventoryEntry[],
  effectiveCaps: Record<string, number>,
): Array<{ slotTag: string; count: number; cap: number; items: SlotInventoryEntry[] }> {
  const overflows: Array<{ slotTag: string; count: number; cap: number; items: SlotInventoryEntry[] }> = [];

  const condGroups = new Map<string, SlotInventoryEntry[]>();
  for (const item of inventory) {
    if (item.kind !== 'condition') continue;
    if (!item.active) continue;

    const group = condGroups.get(item.slotTag) ?? [];
    group.push(item);
    condGroups.set(item.slotTag, group);
  }

  for (const [slotTag, items] of condGroups) {
    const cap = effectiveCaps[slotTag];
    if (cap === undefined) continue; // uncapped — no enforcement

    if (items.length > cap) {
      overflows.push({ slotTag, count: items.length, cap, items });
    }
  }

  return overflows;
}
