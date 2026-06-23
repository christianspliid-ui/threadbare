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
 * attachments| dominant from effects[].reach            | untagged (schema backfill needed)
 * spells   | dominant from effects[].reach              | untagged (schema backfill needed)
 * artifacts| dominant from effects[].reach              | untagged (schema backfill needed)
 * conditions| none (no axis)                            | none (no axis)
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
 * Extract dominant reach from an array of effects by counting effect.reach occurrences.
 * Tie-break: first-encountered reach wins (stable). Returns null when no reach found.
 * Fail-soft: any effect that cannot be read is skipped.
 */
function dominantReachFromEffects(effects: readonly unknown[]): ReachDomain | null {
  const counts = new Map<ReachDomain, number>();
  for (const effect of effects) {
    try {
      const r = (effect as Record<string, unknown>).reach as ReachDomain | undefined;
      if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
    } catch {
      // skip unreadable effects
    }
  }
  let best: ReachDomain | null = null;
  let bestCount = 0;
  for (const [r, count] of counts) {
    if (count > bestCount) { best = r; bestCount = count; }
  }
  return best;
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
// reach: dominant from effects[].reach; scale: untagged (schema backfill needed).

export function resolveAttachments(): CensusEntry[] {
  const all: GraphNode[] = [...REWARD_POSSESSIONS, ...STARTER_POSSESSIONS];
  const results: CensusEntry[] = [];
  for (const node of all) {
    try {
      const props = node.properties as PossessionNodeProperties | undefined;
      const effects: readonly unknown[] = props?.effects ?? [];
      // Authored censusTag.reach wins; else derive dominant reach from effects[].
      const reach = props?.censusTag?.reach ?? dominantReachFromEffects(effects);
      // Scale has no derivation path — authored only (THR-477).
      const scale = props?.censusTag?.scale ?? null;
      results.push(makeEntry(
        node.id,
        'attachments',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach found in effects[]',
      ));
    } catch {
      results.push(makeEntry(node.id, 'attachments', null, null, 'failed to read node properties'));
    }
  }
  return results;
}

// ─── Spell adapter ────────────────────────────────────────────────────────────
// Source: SPELL_TEMPLATES (spell-templates.ts)
// reach: dominant from effects[].reach; scale: untagged.

export function resolveSpells(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of SPELL_TEMPLATES) {
    try {
      const reach = t.censusTag?.reach ?? dominantReachFromEffects(t.effects);
      const scale = t.censusTag?.scale ?? null;
      results.push(makeEntry(
        t.id,
        'spells',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach found in effects[]',
      ));
    } catch {
      results.push(makeEntry(t.id, 'spells', null, null, 'failed to read spell template'));
    }
  }
  return results;
}

// ─── Artifact adapter ─────────────────────────────────────────────────────────
// Source: ARTIFACT_TEMPLATES (artifact-templates.ts)
// reach: dominant from effects[].reach; scale: untagged.

export function resolveArtifacts(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of ARTIFACT_TEMPLATES) {
    try {
      const reach = t.censusTag?.reach ?? dominantReachFromEffects(t.effects);
      const scale = t.censusTag?.scale ?? null;
      results.push(makeEntry(
        t.id,
        'artifacts',
        reach,
        scale,
        reach ? (scale ? undefined : 'scale not authored') : 'no reach found in effects[]',
      ));
    } catch {
      results.push(makeEntry(t.id, 'artifacts', null, null, 'failed to read artifact template'));
    }
  }
  return results;
}

// ─── Condition adapter ────────────────────────────────────────────────────────
// Source: CONDITION_TRAIT_DEFINITIONS (condition-trait-content.ts)
// No reach/scale axis exists in the condition schema → fully untagged.

export function resolveConditions(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const node of CONDITION_TRAIT_DEFINITIONS) {
    try {
      const props = node.properties as unknown as TraitDefinitionProperties | undefined;
      // Reach derives from domainContributions (largest |magnitude|); authored tag wins.
      const reach = props?.censusTag?.reach ?? dominantReachFromContributions(props?.domainContributions);
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
// No reach/scale axis exists in the omen schema → fully untagged.

export function resolveOmens(): CensusEntry[] {
  const results: CensusEntry[] = [];
  for (const t of OMEN_TEMPLATES) {
    try {
      // Omens carry no derivable reach/scale — both axes are authored (THR-477).
      const reach = t.censusTag?.reach ?? null;
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
          spec.censusTag?.reach ?? reach,
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
