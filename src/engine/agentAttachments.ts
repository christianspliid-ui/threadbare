/**
 * Agent Attachment Aggregator
 *
 * Walks graph edges to gather an agent's possessions, conditions,
 * bestowed powers, and agreements into UI-ready data structures.
 *
 * Design doc: Docs/plans/2026-03-16-attachment-detail-card-design.md
 */

import type { WorldGraph } from './graph';
import type {
  AttachmentTier,
  OnUseTrigger,
  PossessionNodeProperties,
  PossessionEdgeProperties,
  AgreementProperties,
} from '../types/attachments';
import { resolveSlotTag } from './attachmentSlotResolver';

// ─── Summary Types ────────────────────────────────────────────────

export interface AttachmentSummary {
  id: string;
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  durationLabel?: string;
  /** Encounter that applied this condition (from apply_condition aftermath effect). */
  sourceEncounterId?: string;
}

export interface AttachmentFullEntry extends AttachmentSummary {
  flavorText?: string;
  tags: string[];
  source?: string;
  lossCondition?: string;
  grantedBy?: string;
  agreementType?: string;
  onUseTriggers?: OnUseTrigger[];
  image?: string;
  /** Resolved slot tag for grouping (e.g. 'weapon', 'ring', 'wound'). */
  slotTag?: string;
  /** Whether this attachment is currently active (false = deactivated by overflow). */
  active?: boolean;
  /** Reason for inactivity, if applicable. */
  inactiveReason?: string;
  /** Whether this is a pinned/quest item. */
  isPinned?: boolean;
  /** Counterparty name for agreements. */
  counterpartyName?: string;
}

// ─── Sort: tier descending, name ascending ────────────────────────

function sortAttachments<T extends { tier: AttachmentTier; name: string }>(items: T[]): T[] {
  return items.sort((a, b) => {
    if (a.tier !== b.tier) return b.tier - a.tier;
    return a.name.localeCompare(b.name);
  });
}

// ─── Main Aggregator ──────────────────────────────────────────────

export interface AgentAttachments {
  possessions: AttachmentFullEntry[];
  conditions: AttachmentFullEntry[];
  powers: AttachmentFullEntry[];
  agreements: AttachmentFullEntry[];
}

/**
 * Walk graph edges to gather all attachments for an agent.
 * Returns sorted arrays for each category.
 */
export function getAgentAttachments(
  graph: WorldGraph,
  agentId: string,
): AgentAttachments {
  const possessions: AttachmentFullEntry[] = [];
  const conditions: AttachmentFullEntry[] = [];
  const powers: AttachmentFullEntry[] = [];
  const agreements: AttachmentFullEntry[] = [];

  // ─── Possessions: possesses + bonded_to edges → artifact/artifact_legendary nodes
  const possessEdges = [
    ...graph.getOutgoingEdges(agentId, 'possesses'),
    ...graph.getOutgoingEdges(agentId, 'bonded_to'),
  ];

  for (const edge of possessEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;

    const props = node.properties as Partial<PossessionNodeProperties>;
    const edgeProps = edge.properties as Partial<PossessionEdgeProperties>;

    const slotTag = resolveSlotTag(props.slotTag, props.subcategory);
    const isActive = edge.properties.active !== false;
    const isPinned = slotTag === 'quest' || props.lossCondition === 'permanent';

    possessions.push({
      id: node.id,
      name: node.name,
      subcategory: props.subcategory ?? 'relics_talismans',
      tier: (props.tier ?? 1) as AttachmentTier,
      mechanicalSummary: props.mechanicalSummary ?? '',
      tags: props.tags ?? [],
      flavorText: props.flavorText,
      image: props.image,
      source: props.source,
      lossCondition: props.lossCondition,
      onUseTriggers: props.onUseTriggers,
      slotTag,
      active: isActive,
      inactiveReason: edge.properties.inactiveReason as string | undefined,
      isPinned,
    });
  }

  // ─── Conditions: has_trait edges where trait category is condition/blessing/curse
  const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
  for (const edge of traitEdges) {
    const node = graph.getNode(edge.target);
    if (!node) continue;

    const traitProps = node.properties as Record<string, unknown>;
    const category = (traitProps.subcategory ?? traitProps.category) as string | undefined;

    if (category === 'condition' || category === 'blessing' || category === 'curse') {
      const tier = (traitProps.tier as AttachmentTier) ?? 1;
      const ticksRemaining = traitProps.ticksRemaining as number | null | undefined;
      const totalTicks = traitProps.totalTicks as number | undefined;

      const nodeTags = (traitProps.tags as string[]) ?? [];
      let subcategory = 'wound';
      if (nodeTags.includes('#blessing')) subcategory = 'blessing';
      else if (nodeTags.includes('#curse')) subcategory = 'curse';
      else if (nodeTags.includes('#disease')) subcategory = 'disease';

      conditions.push({
        id: node.id,
        name: node.name,
        subcategory,
        tier,
        mechanicalSummary: (traitProps.mechanicalSummary as string) ?? node.name,
        ticksRemaining: ticksRemaining ?? null,
        totalTicks,
        durationLabel: ticksRemaining == null ? 'until dispelled' : undefined,
        tags: (traitProps.tags as string[]) ?? [],
        flavorText: traitProps.flavorText as string | undefined,
        source: traitProps.source as string | undefined,
        slotTag: subcategory,
        active: edge.properties.active !== false,
        inactiveReason: edge.properties.inactiveReason as string | undefined,
        sourceEncounterId: edge.properties.sourceEncounterId as string | undefined,
      });
    }

    // ─── Bestowed Powers: has_trait edges where category is 'bestowed'
    if (category === 'bestowed') {
      const tier = (traitProps.tier as AttachmentTier) ?? 1;

      powers.push({
        id: node.id,
        name: node.name,
        subcategory: 'bestowed_power',
        tier,
        mechanicalSummary: (traitProps.mechanicalSummary as string) ?? node.name,
        tags: (traitProps.tags as string[]) ?? [],
        flavorText: traitProps.flavorText as string | undefined,
        source: traitProps.source as string | undefined,
        grantedBy: traitProps.grantedBy as string | undefined,
        onUseTriggers: traitProps.onUseTriggers as OnUseTrigger[] | undefined,
      });
    }
  }

  // ─── Agreements: relates_to edges with agreement properties
  const relatesEdges = [
    ...graph.getOutgoingEdges(agentId, 'relates_to'),
    ...graph.getIncomingEdges(agentId, 'relates_to'),
  ];

  for (const edge of relatesEdges) {
    const edgeProps = edge.properties as Record<string, unknown>;
    const agreementProps = edgeProps.agreement as Partial<AgreementProperties> | undefined;
    if (!agreementProps) continue;

    // Determine counterparty
    const counterpartyId = edge.source === agentId ? edge.target : edge.source;
    const counterpartyNode = graph.getNode(counterpartyId);
    const counterpartyName = counterpartyNode?.name ?? '(unknown)';

    const subcategory = agreementProps.type === 'debt' || agreementProps.type === 'favour'
      ? 'debt' : 'pact';

    agreements.push({
      id: edge.id,
      name: (edgeProps.agreementName as string) ?? `${agreementProps.type} with ${counterpartyName}`,
      subcategory,
      tier: (agreementProps.tier ?? 1) as AttachmentTier,
      mechanicalSummary: agreementProps.terms ?? '',
      ticksRemaining: agreementProps.ticksRemaining ?? null,
      totalTicks: undefined,
      tags: agreementProps.tags ?? [],
      agreementType: agreementProps.type,
      grantedBy: counterpartyName,
      slotTag: 'agreement',
      active: edgeProps.active !== false,
      inactiveReason: edgeProps.inactiveReason as string | undefined,
      counterpartyName,
    });
  }

  return {
    possessions: sortAttachments(possessions),
    conditions: sortAttachments(conditions),
    powers: sortAttachments(powers),
    agreements: sortAttachments(agreements),
  };
}
