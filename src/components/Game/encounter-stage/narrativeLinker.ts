/**
 * Narrative Linker — auto-links entity names and codex terms in encounter prose.
 *
 * Extracts the generic `buildLinkedParagraph()` tokenizer from Gate Duty's
 * bespoke adapter and adds `autoLinkNarrative()` which scans prose text
 * against known entity names from support bundles and codex terms from
 * world-model.json.
 *
 * Any encounter with a support bundle gets auto-linked entity references
 * and codex term tooltips for free — no changes to how authors write prose.
 */

import type { WorldGraph } from '../../../engine/graph';
import { getDomainWord } from '../../../data/domain-words';
import { getPortraitUrl } from '../../../data/portrait-assets';
import type { EncounterSupportActorSpec, EncounterSupportBinding } from '../../../types/encounter';
import type { ReachDomain } from '../../../types/traits';
import type {
  EncounterStageNarrativeParagraph,
  EncounterStageNarrativeReference,
  EncounterStageNarrativeSegment,
} from './types';

// ─── Token-Based Paragraph Builder ──────────────────────────────
// Extracted from buildGateDutyEncounterStageModel.ts — the generic
// tokenizer that parses {{token}} markers in text into segments.

export type TokenEntry = {
  text: string;
  referenceId?: string;
  emphasis?: 'default' | 'strong' | 'accent';
};

/**
 * Parse a prose string containing `{{token}}` markers into a segmented
 * paragraph with reference links. Used by Gate Duty's explicit markup
 * and by autoLinkNarrative's auto-scan system.
 */
export function buildLinkedParagraph(
  id: string,
  text: string,
  tokens: Record<string, TokenEntry>,
): EncounterStageNarrativeParagraph {
  const segments: EncounterStageNarrativeSegment[] = [];
  const tokenPattern = /{{([a-zA-Z0-9_]+)}}/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), emphasis: 'default' });
    }
    const token = tokens[match[1]];
    if (token) {
      segments.push({
        text: token.text,
        referenceId: token.referenceId,
        emphasis: token.emphasis ?? 'default',
      });
    } else {
      segments.push({ text: match[0], emphasis: 'default' });
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), emphasis: 'default' });
  }

  return { id, segments };
}

// ─── Auto-Link: Scan Prose for Entity Names ─────────────────────

export interface EntityLinkEntry {
  /** Display name to match in prose (e.g. "Maren Ironhewn") */
  name: string;
  /** Reference ID for the tooltip (e.g. "cast:maren_ironhewn") */
  referenceId: string;
  /** Visual emphasis when rendered */
  emphasis: 'strong' | 'accent';
}

/**
 * Auto-link entity names found in prose text. Scans for known entity
 * names (longest-first to handle "Maren Ironhewn" before "Maren")
 * and splits the text into segments with reference links.
 *
 * Only matches whole words to avoid false positives.
 * Each entity is linked at most once per paragraph to avoid visual clutter.
 */
export function autoLinkNarrative(
  paragraphId: string,
  text: string,
  entities: EntityLinkEntry[],
): EncounterStageNarrativeParagraph {
  if (entities.length === 0) {
    return { id: paragraphId, segments: [{ text }] };
  }

  // Sort entities longest-name-first so "Maren Ironhewn" matches before "Maren"
  const sorted = [...entities].sort((a, b) => b.name.length - a.name.length);

  // Build a combined regex that matches any entity name as a whole word.
  // Escape regex special chars in names.
  const escaped = sorted.map(e => e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'g');

  // Build a lookup from name → entity entry
  const lookup = new Map<string, EntityLinkEntry>();
  for (const entity of sorted) {
    // Store both exact case and lowercase for case-insensitive matching
    lookup.set(entity.name, entity);
    lookup.set(entity.name.toLowerCase(), entity);
  }

  const segments: EncounterStageNarrativeSegment[] = [];
  const linkedThisParagraph = new Set<string>();
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const matchedText = match[1];
    const entity = lookup.get(matchedText) ?? lookup.get(matchedText.toLowerCase());
    if (!entity) continue;

    // Only link each entity once per paragraph — subsequent mentions
    // stay as plain text (no underline) to avoid visual clutter.
    const alreadyLinked = linkedThisParagraph.has(entity.referenceId);
    if (!alreadyLinked) {
      linkedThisParagraph.add(entity.referenceId);
    }

    // Add preceding plain text
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }

    if (alreadyLinked) {
      // Already linked this entity — render as plain text
      segments.push({ text: matchedText });
    } else {
      // First occurrence — render as linked segment
      segments.push({
        text: matchedText,
        referenceId: entity.referenceId,
        emphasis: entity.emphasis,
      });
    }

    cursor = match.index + matchedText.length;
  }

  // Add trailing text
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  // If nothing was linked, return a single segment
  if (segments.length === 0) {
    return { id: paragraphId, segments: [{ text }] };
  }

  return { id: paragraphId, segments };
}

// ─── Entity Reference Builder ───────────────────────────────────

/**
 * Build a tooltip reference for a support bundle actor.
 * Shows: name, role, top domain word, faction. Light and inviting,
 * not a stat sheet — signals that this entity is part of the game
 * graph and can be manipulated.
 */
export function buildEntityReference(
  graph: WorldGraph,
  binding: EncounterSupportBinding,
  spec: EncounterSupportActorSpec,
): EncounterStageNarrativeReference {
  const node = graph.getNode(binding.nodeId);
  const name = node?.name ?? spec.spawnName ?? spec.key;
  const role = spec.supportRole;

  // Build a short detail string from available data
  const detailParts: string[] = [];

  // Role
  if (role) {
    detailParts.push(role.charAt(0).toUpperCase() + role.slice(1));
  }

  // Top domain capability (use the highest-scoring domain)
  if (node?.properties?.domainCapabilities) {
    const caps = node.properties.domainCapabilities as Record<string, number>;
    let topDomain: string | undefined;
    let topValue = 0;
    for (const [domain, value] of Object.entries(caps)) {
      if (typeof value === 'number' && value > topValue) {
        topDomain = domain;
        topValue = value;
      }
    }
    if (topDomain && topValue > 0) {
      const word = getDomainWord(topDomain as ReachDomain, topValue);
      detailParts.push(`${word} at ${topDomain}`);
    }
  }

  // Faction
  const factionDefId = node?.properties?.factionDefId as string | undefined;
  if (factionDefId) {
    const factionNode = graph.getNode(factionDefId);
    if (factionNode?.name) {
      detailParts.push(factionNode.name);
    }
  }

  const detail = detailParts.length > 0
    ? `${detailParts.join(' · ')}. Part of this encounter's cast.`
    : 'Part of this encounter\'s cast.';

  return {
    id: `cast:${spec.key}`,
    label: name,
    detail,
    tone: 'default',
  };
}

/**
 * Build a tooltip reference for a support bundle location.
 */
export function buildLocationReference(
  graph: WorldGraph,
  binding: EncounterSupportBinding,
  sublocationTypeId: string,
  fallbackName?: string,
): EncounterStageNarrativeReference {
  const node = graph.getNode(binding.nodeId);
  const name = node?.name ?? fallbackName ?? binding.key;

  return {
    id: `location:${binding.key}`,
    label: name,
    detail: `A ${sublocationTypeId.replace(/[-_]/g, ' ')} in this area.`,
    tone: 'accent',
  };
}

// ─── Collect Entities from Support Bundle ───────────────────────

export interface CollectedEntities {
  linkEntries: EntityLinkEntry[];
  references: EncounterStageNarrativeReference[];
}

/**
 * Collect all linkable entities from a support bundle's resolved bindings.
 * Returns both the link entries (for prose scanning) and the reference
 * objects (for tooltip rendering).
 */
export function collectSupportBundleEntities(
  graph: WorldGraph,
  supportBundle: ReadonlyArray<{ readonly kind: string; readonly key: string; readonly supportRole?: string; readonly spawnName?: string; readonly sublocationTypeId?: string; readonly fallbackName?: string }>,
  bindings: ReadonlyArray<EncounterSupportBinding>,
): CollectedEntities {
  const linkEntries: EntityLinkEntry[] = [];
  const references: EncounterStageNarrativeReference[] = [];

  for (const spec of supportBundle) {
    const binding = bindings.find(b => b.key === spec.key);
    if (!binding) continue;

    if (spec.kind === 'actor') {
      const actorSpec = spec as EncounterSupportActorSpec;
      const ref = buildEntityReference(graph, binding, actorSpec);
      references.push(ref);

      // Get the resolved name from the graph (may differ from spawnName)
      const node = graph.getNode(binding.nodeId);
      const resolvedName = node?.name ?? actorSpec.spawnName ?? actorSpec.key;

      linkEntries.push({
        name: resolvedName,
        referenceId: ref.id,
        emphasis: 'strong',
      });

      // Also add the spawnName if different from resolved name
      if (actorSpec.spawnName && actorSpec.spawnName !== resolvedName) {
        linkEntries.push({
          name: actorSpec.spawnName,
          referenceId: ref.id,
          emphasis: 'strong',
        });
      }

      // Add first-name entry for multi-word names so "Maren" matches
      // even when the full name is "Maren Ironhewn"
      const firstName = resolvedName.split(' ')[0];
      if (firstName && firstName !== resolvedName && firstName.length >= 3) {
        linkEntries.push({
          name: firstName,
          referenceId: ref.id,
          emphasis: 'strong',
        });
      }
    } else if (spec.kind === 'location') {
      const locRef = buildLocationReference(
        graph,
        binding,
        (spec as { sublocationTypeId?: string }).sublocationTypeId ?? 'location',
        (spec as { fallbackName?: string }).fallbackName,
      );
      references.push(locRef);

      const node = graph.getNode(binding.nodeId);
      const resolvedName = node?.name;
      if (resolvedName) {
        linkEntries.push({
          name: resolvedName,
          referenceId: locRef.id,
          emphasis: 'accent',
        });
      }
    }
  }

  return { linkEntries, references };
}
