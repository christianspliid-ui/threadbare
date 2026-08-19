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
import { tooltipResolves } from '../../../engine/tooltipResolver';
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

/**
 * THR-1173 — the kind vocabulary, taken from the segment field itself rather
 * than respelled. `entityKind` is one rule with three readers (segment, token,
 * link entry); spelling the union three times is how the fourth reader drifts.
 */
export type NarrativeLinkKind = NonNullable<EncounterStageNarrativeSegment['entityKind']>;

export type TokenEntry = {
  text: string;
  referenceId?: string;
  emphasis?: 'default' | 'strong' | 'accent';
  /**
   * THR-1173 — graph node id behind this token, when the producer knows one.
   * `referenceId` names the *tooltip* (`location`, `cast:<key>`); it is scene
   * bookkeeping and opens nothing. A token that wants link tier carries the id.
   */
  entityId?: string;
  /** THR-1173 — what `entityId` names, so the host routes to the right sheet. */
  entityKind?: NarrativeLinkKind;
  /** THR-1173 — concept id for the hover tier, resolved context-free. */
  tooltipId?: string;
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
        entityId: token.entityId,
        entityKind: token.entityKind,
        tooltipId: token.tooltipId,
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
  /**
   * THR-971 — graph node id behind this name, when one is known.
   *
   * `referenceId` identifies the *tooltip*, not the entity: a cast reference is
   * keyed `cast:<bundleKey>`, which no surface can resolve back to a node. A
   * renderer that wants to open the entity's page needs the id itself, so it is
   * carried here. Optional by design — a name with no node behind it stays
   * emphasised but unclickable, which is the fail-open behaviour (never a dead
   * link).
   */
  entityId?: string;
  /**
   * THR-1173 — what `entityId` names. **Absent means "a person"**, matching the
   * segment field's own back-compatibility rule: every entry this scan produced
   * before now was a cast member, and an absent kind must keep meaning that.
   *
   * A place needs it explicitly. Without it a bound location either underlined
   * and answered nothing (no `entityId` at all — the Sacred Grove defect) or,
   * once an id was carried, routed to the *agent* drawer, which is the worse of
   * the two failures: a wrong sheet rather than no sheet.
   */
  entityKind?: NarrativeLinkKind;
  /**
   * THR-1173 — concept id for the hover tier. Must resolve **context-free**:
   * `tooltipResolves()` decides whether a word is underlined and is called with
   * no graph, so a `location.<node id>` here would never draw. Name the subtype
   * (`location.grove`), which is committed world-model content.
   */
  tooltipId?: string;
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
        entityId: entity.entityId,
        entityKind: entity.entityKind,
        tooltipId: entity.tooltipId,
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

/**
 * Build a tooltip reference for the action's scene target (THR-696) — the entity the
 * encounter is *with*. Same presentation contract as the cast references above; only the
 * detail line differs, because the target is the encounter's counterpart rather than a
 * bundle member. Returns null when the target node no longer exists.
 */
export function buildTargetReference(
  graph: WorldGraph,
  targetId: string,
): EncounterStageNarrativeReference | null {
  const node = graph.getNode(targetId);
  if (!node?.name) return null;

  return {
    id: `target:${targetId}`,
    label: node.name,
    detail: node.type === 'location'
      ? 'Where this encounter is taking place.'
      : 'The other party in this encounter.',
    tone: 'default',
  };
}

/**
 * THR-1173 — the hover half of a place: `location.<subtype>`, or undefined.
 *
 * Deliberately the **kind**, not `location.<node id>`. The id-shaped arm of the
 * resolver answers only when handed a graph, and `tooltipResolves()` — the call
 * that decides whether a word is underlined at all — is made without one. A
 * per-node tooltipId would therefore be committed data that never draws.
 *
 * Pre-checked rather than emitted hopefully: a subtype naming no concept is a
 * worldgen outcome, not an authoring error, so it returns undefined and the
 * place keeps the link tier without a hover it cannot honour.
 */
export function buildLocationTooltipId(node: { properties?: Record<string, unknown> } | undefined): string | undefined {
  const subtype = (node?.properties?.locationSubtype ?? node?.properties?.locationType) as string | undefined;
  if (!subtype) return undefined;
  const candidate = `location.${subtype}`;
  return tooltipResolves(candidate) ? candidate : undefined;
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
 *
 * `targetId` (THR-696) adds the action's scene target to the same link set, so the
 * named counterpart is clickable like a cast member (Rule 4 — every primitive is
 * clickable). A target that is also a bound cast member is skipped, so it keeps its
 * richer cast tooltip instead of being shadowed by the generic target one.
 */
export function collectSupportBundleEntities(
  graph: WorldGraph,
  supportBundle: ReadonlyArray<{ readonly kind: string; readonly key: string; readonly supportRole?: string; readonly spawnName?: string; readonly sublocationTypeId?: string; readonly fallbackName?: string }>,
  bindings: ReadonlyArray<EncounterSupportBinding>,
  targetId?: string,
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
        entityId: binding.nodeId,
      });

      // Also add the spawnName if different from resolved name
      if (actorSpec.spawnName && actorSpec.spawnName !== resolvedName) {
        linkEntries.push({
          name: actorSpec.spawnName,
          referenceId: ref.id,
          emphasis: 'strong',
          entityId: binding.nodeId,
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
          entityId: binding.nodeId,
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
        // THR-1173 — the place now answers. Until this carried `entityId` and a
        // kind, a bound location matched the prose scan, took a `referenceId`,
        // and stopped there: underlined on scene bookkeeping alone, opening
        // nothing. That is the Sacred Grove defect exactly. The id was one line
        // away the whole time — `binding.nodeId` is a real location node.
        linkEntries.push({
          name: resolvedName,
          referenceId: locRef.id,
          emphasis: 'accent',
          entityId: binding.nodeId,
          entityKind: 'location',
          tooltipId: buildLocationTooltipId(node),
        });
      }
    }
  }

  // Scene target (THR-696) — appended last so a cast binding on the same node wins.
  if (targetId && !bindings.some(b => b.nodeId === targetId)) {
    const targetRef = buildTargetReference(graph, targetId);
    if (targetRef) {
      references.push(targetRef);
      // THR-1173 — a scene target can be the ground the encounter stands on, not
      // only a counterpart; `buildTargetReference` has branched on `location`
      // for its detail line since THR-696. Until now the link entry did not,
      // so a place-target carried an id with no kind — and an absent kind means
      // *agent*, so the name opened the agent drawer on a location node. That is
      // the one outcome worse than staying text, and Law 21 says fail open.
      const targetNode = graph.getNode(targetId);
      const targetIsPlace = targetNode?.type === 'location';
      const targetKind: NarrativeLinkKind | undefined = targetIsPlace ? 'location' : undefined;
      const targetTooltipId = targetIsPlace ? buildLocationTooltipId(targetNode) : undefined;

      linkEntries.push({
        name: targetRef.label,
        referenceId: targetRef.id,
        emphasis: 'strong',
        entityId: targetId,
        entityKind: targetKind,
        tooltipId: targetTooltipId,
      });

      // A place's name is not a person's: "Sacred Grove" has no first name, and
      // splitting it would link the bare word "Sacred". People only.
      const firstName = targetRef.label.split(' ')[0];
      if (!targetIsPlace && firstName && firstName !== targetRef.label && firstName.length >= 3) {
        linkEntries.push({
          name: firstName,
          referenceId: targetRef.id,
          emphasis: 'strong',
          entityId: targetId,
        });
      }
    }
  }

  return { linkEntries, references };
}
