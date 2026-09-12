/**
 * Per-registry tag-resolution adapters for the Content Census.
 *
 * Each adapter knows exactly how to derive (reach, scale) for its source registry.
 * This table is a named, reviewable artifact — the governance-pass fix for the
 * "flat resolver" flaw (6 of 8 registries lack entry-level scale).
 *
 * Adapter contract:
 *   - reach: null → go to untaggedReason (needs schema backfill)
 *   - scale: null → go to untaggedReason (needs schema backfill)
 *   - Both resolved → counted in the heatmap
 *   - Fail-soft: any entry that cannot be read → untagged, never throws
 *
 * Registry | reach source          | scale source
 * ---------|---------------------- |-------------------
 * encounters| entry-level (UnifiedActionTemplate.reach) | entry-level (UnifiedActionTemplate.scale)
 * actions  | entry-level (ActionTemplateData.reach)     | untagged (inferred, not authored)
 * attachments| entry tag axis (#iron … #star)           | authored censusTag.scale
 * spells   | entry tag axis (#iron … #star)             | authored censusTag.scale
 * artifacts| entry tag axis (#iron … #star)             | authored censusTag.scale
 * conditions| tag axis, else |domainContributions|      | authored censusTag.scale
 * omens    | none (no axis)                             | none (no axis)
 * sublocations| gold (only Gold phase sublocations exist)| local (SCALE_APPLICABILITY)
 */

import type { ReachDomain } from '../../types/traits';
import type { ActionScale } from '../../types/unifiedAction';
import type { CensusEntry, ContentType } from './types';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { ACTION_TEMPLATES } from '../../data/action-template-content';
import { REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { STARTER_POSSESSIONS } from '../../data/starter-attachments';
import { SPELL_TEMPLATES } from '../../data/spell-templates';
import { ARTIFACT_TEMPLATES } from '../../data/artifact-templates';
import { CONDITION_TRAIT_DEFINITIONS } from '../../data/condition-trait-content';
import { OMEN_TEMPLATES } from '../../data/omenTemplates';
import { SUBLOCATION_FAMILIES } from '../phaseSublocations';
import { REACH_DOMAINS } from '../../types/traits';
import type { GraphNode } from '../../types/graph';
import type { PossessionNodeProperties } from '../../types/attachments';
import type { TraitDefinitionProperties } from '../../types/traits';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function makeEntry(
  id: string,
  contentType: ContentType,
  reach: ReachDomain | null,
  scale: ActionScale | null,
  untaggedReason?: string,
): CensusEntry {
  return { id, contentType, reach, scale, untaggedReason };
}

/**
 * The reach an entry's `#iron` … `#star` tag names, or null when it carries none.
 *
 * **This replaced `dominantReachFromEffects` (THR-1486).** That derivation counted
 * `effects[].reach` and took the mode — a reach the author never wrote, which disagreed
 * with the author's own reach tag on 9 of 106 attachments, 3 of 5 spells and 6 of 33
 * conditions that carried both. THR-477 left derive-vs-persist open; THR-1481 closes it
 * as *authored on the tag axis*, so the derivation is gone rather than persisted and the
 * eighteen entries that had a reach only by derivation were authored one at the
 * migration.
 *
 * First tag wins, in authored order: an entry naming two reaches has said which it leads
 * with, and picking by count would re-introduce exactly the derivation this replaced.
 */
function reachFromTags(tags: readonly string[] | undefined): ReachDomain | null {
  for (const tag of tags ?? []) {
    const name = tag.startsWith('#') ? tag.slice(1) : tag;
    if ((REACH_DOMAINS as readonly string[]).includes(name)) return name as ReachDomain;
  }
  return null;
}

/**
 * Extract dominant reach from a domainContributions map (e.g. condition traits)
 * by largest ABSOLUTE magnitude — a negative dominant still names the reach the
 * entry operates in (e.g. `wounded` { iron: -0.08, stone: -0.04 } → iron).
 * Tie-break: first-encountered key wins (stable insertion order). Returns null
 * when the map is empty or unreadable. Fail-soft: unreadable values are skipped.
 */
function dominantReachFromContributions(
  contributions: Partial<Record<ReachDomain, number>> | undefined,
): ReachDomain | null {
  if (!contributions) return null;
  let best: ReachDomain | null = null;
  let bestMag = 0;
  for (const [r, v] of Object.entries(contributions)) {
    try {
      const mag = Math.abs(v as number);
      if (mag > bestMag) { best = r as ReachDomain; bestMag = mag; }
    } catch {
      // skip unreadable contribution
    }
  }
  return best;
}

// ─── Encounter adapter ────────────────────────────────────────────────────────
// Source: UNIFIED_ACTION_TEMPLATES (all entries except action.* prefix)
// All UnifiedActionTemplate entries have both reach and scale at entry level.

export function resolveEncounters(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of UNIFIED_ACTION_TEMPLATES) {
    if (t.id.startsWith('action.')) continue; // actions handled separately
    try {
      results.push(makeEntry(t.id, 'encounters', t.reach, t.scale));
    } catch {
      results.push(makeEntry(t.id, 'encounters', null, null, 'failed to read template fields'));
    }
  }
  return results;
}

// ─── Actions adapter ──────────────────────────────────────────────────────────
// Source: ACTION_TEMPLATES (ActionTemplateData — 36 templates, 4 per reach × 9 reaches)
// reach: entry-level; scale: not authored (inferred by migration) → untagged.

export function resolveActions(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of ACTION_TEMPLATES) {
    try {
      results.push(makeEntry(
        t.id,
        'actions',
        t.reach,
        null,
        'scale not authored — inferred from actor affinities in migration',
      ));
    } catch {
      results.push(makeEntry(t.id, 'actions', null, null, 'failed to read template fields'));
    }
  }
  return results;
}

// ─── Attachment adapter ───────────────────────────────────────────────────────
// Sources: REWARD_POSSESSIONS (reward-attachment-catalog) + STARTER_POSSESSIONS (starter-attachments)
// reach: the entry tag axis (THR-1486); scale: authored `censusTag.scale`.

export function resolveAttachments(): CensusEntry[] {
  const all: GraphNode[] = [...REWARD_POSSESSIONS, ...STARTER_POSSESSIONS];
  const results: CensusEntry[] = [];
  for (const node of all) {
    try {
      const props = node.properties as PossessionNodeProperties | undefined;
      // Reach is authored on the tag axis (THR-1486); no derivation behind it.
      const reach = reachFromTags(props?.tags);
      // Scale has no derivation path — authored only (THR-477).
      const scale = props?.censusTag?.scale ?? null;
      results.push(makeEntry(
        node.id,
        'attachments',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach tag authored',
      ));
    } catch {
      results.push(makeEntry(node.id, 'attachments', null, null, 'failed to read node properties'));
    }
  }
  return results;
}

// ─── Spell adapter ────────────────────────────────────────────────────────────
// Source: SPELL_TEMPLATES (spell-templates.ts)
// reach: the entry tag axis (THR-1486); scale: authored `censusTag.scale`.

export function resolveSpells(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of SPELL_TEMPLATES) {
    try {
      const reach = reachFromTags(t.tags);
      const scale = t.censusTag?.scale ?? null;
      results.push(makeEntry(
        t.id,
        'spells',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach tag authored',
      ));
    } catch {
      results.push(makeEntry(t.id, 'spells', null, null, 'failed to read spell template'));
    }
  }
  return results;
}

// ─── Artifact adapter ─────────────────────────────────────────────────────────
// Source: ARTIFACT_TEMPLATES (artifact-templates.ts)
// reach: the entry tag axis (THR-1486); scale: authored `censusTag.scale`.

export function resolveArtifacts(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of ARTIFACT_TEMPLATES) {
    try {
      const reach = reachFromTags(t.tags);
      const scale = t.censusTag?.scale ?? null;
      results.push(makeEntry(
        t.id,
        'artifacts',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach tag authored',
      ));
    } catch {
      results.push(makeEntry(t.id, 'artifacts', null, null, 'failed to read artifact template'));
    }
  }
  return results;
}

// ─── Condition adapter ────────────────────────────────────────────────────────
// Source: CONDITION_TRAIT_DEFINITIONS (condition-trait-content.ts)
// reach: the entry tag axis, falling back to |domainContributions| where none is authored.

export function resolveConditions(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const node of CONDITION_TRAIT_DEFINITIONS) {
    try {
      const props = node.properties as unknown as TraitDefinitionProperties | undefined;
      // Reach derives from domainContributions (largest |magnitude|); authored tag wins.
      const reach = reachFromTags(props?.tags) ?? dominantReachFromContributions(props?.domainContributions);
      // Scale has no derivation path — authored only (THR-477).
      const scale = props?.censusTag?.scale ?? null;
      results.push(makeEntry(
        node.id,
        'conditions',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach derivable from domainContributions',
      ));
    } catch {
      results.push(makeEntry(node.id, 'conditions', null, null, 'failed to read condition node'));
    }
  }
  return results;
}

// ─── Omen adapter ─────────────────────────────────────────────────────────────
// Source: OMEN_TEMPLATES (omenTemplates.ts)
// reach: the entry tag axis (THR-1486); scale: authored `censusTag.scale`.

export function resolveOmens(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of OMEN_TEMPLATES) {
    try {
      // Reach moved onto the tag axis with THR-1486; scale stays authored.
      const reach = reachFromTags(t.tags);
      const scale = t.censusTag?.scale ?? null;
      results.push(makeEntry(
        t.id,
        'omens',
        reach,
        scale,
        reach && scale ? undefined : 'reach/scale not authored',
      ));
    } catch {
      results.push(makeEntry(t.id, 'omens', null, null, 'failed to read omen template'));
    }
  }
  return results;
}

// ─── Sublocation adapter ──────────────────────────────────────────────────────
// Source: SUBLOCATION_FAMILIES (phaseSublocations.ts — src/engine/), keyed by reach.
// Today only the `gold` family carries specs (THR-469 P2b authors the other 7 →
// the registry key is the authoritative reach, so new families are picked up here
// automatically). Scale: local (SCALE_APPLICABILITY says sublocations: ['local']).

export function resolveSublocations(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const reach of REACH_DOMAINS) {
    for (const spec of SUBLOCATION_FAMILIES[reach]) {
      try {
        results.push(makeEntry(
          spec.sublocationTypeId,
          'sublocations',
          reach,
          spec.censusTag?.scale ?? 'local',
        ));
      } catch {
        results.push(makeEntry(
          String((spec as Record<string, unknown>).sublocationTypeId ?? 'unknown'),
          'sublocations',
          null,
          null,
          'failed to read sublocation spec',
        ));
      }
    }
  }
  return results;
}

// ─── All adapters ─────────────────────────────────────────────────────────────

export function resolveAll(): CensusEntry[] {
  const registries = [
    resolveEncounters,
    resolveActions,
    resolveAttachments,
    resolveSpells,
    resolveArtifacts,
    resolveConditions,
    resolveOmens,
    resolveSublocations,
  ];

  const all: CensusEntry[] = [];
  for (const resolve of registries) {
    try {
      all.push(...resolve());
    } catch (err) {
      console.warn(`[content-census] Registry loader failed (${resolve.name}): ${err}`);
    }
  }
  return all;
}
