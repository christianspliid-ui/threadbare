/**
 * Artifact traits — a thing as a trait bearer (THR-1521, traits wave 2 slice 3).
 *
 * The `has_trait` edge schema admits `artifact` / `artifact_legendary` sources from
 * this slice on. This module is the **one writer** for those edges and the reader the
 * sheet, the debug bridge and the CLI share, so the three rules below live in exactly
 * one place:
 *
 * 1. **A freehold is never a trait bearer.** `holdings.ts` mints the bearer-side face of
 *    an owned place as `type: 'artifact'` with `attachmentCategory: 'holding'` — a sheet
 *    convenience that mirrors an `owns` edge and is never a target. It is not a thing
 *    that can be storied or cursed, and a trait stamped on it would be a trait on a
 *    bookkeeping row. `isArtifactTraitBearer` is the carve-out; every writer routes
 *    through it.
 * 2. **Only a `trait.artifact.*` definition goes on a thing.** The prefix is the
 *    declaration (`ARTIFACT_TRAIT_ID_PREFIX`, `artifact-trait-content.ts`); a mortal's
 *    condition on a blade is refused as a category error, not written as an edge nothing
 *    will read.
 * 3. **Definitions seed on demand.** A world saved before this slice, a CLI world, or a
 *    fixture graph has no `trait.artifact.*` node; `assignTrait` would throw. The writer
 *    inserts the missing definition from the catalog first, which is what makes the
 *    curse path safe on every graph shape (NFP #4).
 *
 * `#storied` climbs with **encounter presence**: `recordArtifactEncounterPresence` is
 * called from both growth sites (`encounter.ts`, `unifiedActionResolution.ts`) once per
 * resolved step for the acting mortal, counts the step on every storied thing they
 * possess or are bonded to, and lifts the edge level every
 * `ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL` counts to `maxLevel`. No draw, no PRNG.
 *
 * NFP #1: every number is a named constant in `artifact-trait-content.ts`.
 * NFP #2: `artifact_trait` traces on stamp / climb / removal; `describeArtifactTraits`
 *   for `__DEBUG.getArtifactTraits` and CLI `traits`.
 * NFP #3: deterministic — ids and levels derive from the graph and the tick.
 * NFP #4: every function returns a result shape or an empty list; nothing throws out.
 * NFP #6: additive — `assignTrait` / `removeTrait` / the predicate are untouched; the
 *   THR-661 `properties.cursed` flag keeps being written beside the edge.
 */

import type { WorldGraph } from './graph';
import type { GraphEdge, GraphNode } from '../types/graph';
import type { TraitAssignmentProperties } from '../types/traits';
import { assignTrait, removeTrait, getTraitsForNode } from './traits';
import { isArtifactNode } from './ascendantPrimitives';
import { HOLDING_ATTACHMENT_CATEGORY } from './holdings';
import { emitTrace } from './traceBuffer';
import {
  ARTIFACT_TRAIT_DEFINITIONS,
  ARTIFACT_STORIED_TRAIT_ID,
  ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL,
  ARTIFACT_STORIED_MAX_LEVEL,
  artifactTraitLevelWord,
  isArtifactTraitId,
} from '../data/artifact-trait-content';

// ─── Bearer predicate ─────────────────────────────────────────────────────────

/**
 * True when `node` may carry an artifact trait: an artifact of either tier that is
 * **not** a holding face. The holdings carve-out lives here and nowhere else.
 */
export function isArtifactTraitBearer(node: GraphNode | undefined | null): boolean {
  if (!isArtifactNode(node)) return false;
  return node!.properties?.attachmentCategory !== HOLDING_ATTACHMENT_CATEGORY;
}

// ─── Definitions ──────────────────────────────────────────────────────────────

/**
 * Insert every artifact-trait definition missing from `graph`. Idempotent; returns how
 * many were added. `seedEncounterTraitDefinitions` does this at world init; this is the
 * on-demand door for older saves and fixtures.
 */
export function ensureArtifactTraitDefinitions(graph: WorldGraph): number {
  let added = 0;
  for (const node of ARTIFACT_TRAIT_DEFINITIONS) {
    if (!graph.getNode(node.id)) {
      graph.addNode(node);
      added++;
    }
  }
  return added;
}

// ─── Writers ──────────────────────────────────────────────────────────────────

export type ArtifactTraitRefusal =
  | 'artifact_not_found'
  | 'not_an_artifact'
  | 'holding_face'
  | 'not_an_artifact_trait'
  | 'definition_missing'
  | 'write_failed';

export type AssignArtifactTraitResult =
  | { ok: true; edgeId: string; alreadyHeld: boolean }
  | { ok: false; reason: ArtifactTraitRefusal };

/**
 * Stamp an artifact trait on a thing at level 1. Refuses (never throws) a missing node,
 * a non-artifact, a holding face, and a definition outside `trait.artifact.*`. A trait
 * already held is a no-op reported as `alreadyHeld` — `reinforceTrait` and the presence
 * counter are the level's writers, not a second stamp.
 */
export function assignArtifactTrait(
  graph: WorldGraph,
  artifactId: string,
  traitId: string,
  opts: { tick: number; source: string },
): AssignArtifactTraitResult {
  const node = graph.getNode(artifactId);
  if (!node) return { ok: false, reason: 'artifact_not_found' };
  if (!isArtifactNode(node)) return { ok: false, reason: 'not_an_artifact' };
  if (!isArtifactTraitBearer(node)) return { ok: false, reason: 'holding_face' };
  if (!isArtifactTraitId(traitId)) return { ok: false, reason: 'not_an_artifact_trait' };

  const edgeId = `e.has_trait.${artifactId}.${traitId}`;
  if (graph.getEdge(edgeId)) return { ok: true, edgeId, alreadyHeld: true };

  ensureArtifactTraitDefinitions(graph);
  if (!graph.getNode(traitId)) return { ok: false, reason: 'definition_missing' };

  try {
    assignTrait(graph, artifactId, traitId, opts);
  } catch {
    return { ok: false, reason: 'write_failed' };
  }
  const edge = graph.getEdge(edgeId);
  if (!edge) return { ok: false, reason: 'write_failed' };

  emitTrace({
    category: 'artifact_trait',
    tick: opts.tick,
    summary: `${node.name ?? artifactId} is now ${graph.getNode(traitId)?.name ?? traitId} (${opts.source})`,
    artifactId,
    artifactName: node.name ?? artifactId,
    traitId,
    change: 'stamped',
    level: 1,
    source: opts.source,
  });
  return { ok: true, edgeId, alreadyHeld: false };
}

/** Remove an artifact trait. True when an edge was removed; false when there was none. */
export function removeArtifactTrait(
  graph: WorldGraph,
  artifactId: string,
  traitId: string,
  opts?: { tick?: number; source?: string },
): boolean {
  if (!isArtifactTraitId(traitId)) return false;
  const edgeId = `e.has_trait.${artifactId}.${traitId}`;
  const edge = graph.getEdge(edgeId);
  if (!edge) return false;
  const level = readLevel(edge);
  removeTrait(graph, artifactId, traitId);
  const node = graph.getNode(artifactId);
  emitTrace({
    category: 'artifact_trait',
    tick: opts?.tick ?? 0,
    summary: `${node?.name ?? artifactId} is no longer ${graph.getNode(traitId)?.name ?? traitId}`,
    artifactId,
    artifactName: node?.name ?? artifactId,
    traitId,
    change: 'removed',
    level,
    source: opts?.source ?? 'removeArtifactTrait',
  });
  return true;
}

// ─── Encounter presence → #storied ───────────────────────────────────────────

/** Edge property the presence counter persists under (`TraitAssignmentProperties` is open). */
export const ARTIFACT_PRESENCE_COUNT_KEY = 'encountersPresent';

export interface ArtifactPresenceResult {
  /** Storied things the bearer carried through this step. */
  artifactsPresent: number;
  /** Each thing whose level rose this step, with the level it reached. */
  climbed: ReadonlyArray<{ artifactId: string; level: number }>;
}

const NO_PRESENCE: ArtifactPresenceResult = { artifactsPresent: 0, climbed: [] };

/**
 * Record that the bearer resolved an encounter step with their things about them.
 *
 * Walks `possesses` and `bonded_to` once, counts the step on every artifact carrying
 * `#storied`, and lifts the edge's level to
 * `min(maxLevel, 1 + floor(count / ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL))`. Only
 * things already storied climb — presence never mints the trait, `mintMasterwork`
 * does. Fail-soft: a missing bearer or a throw anywhere returns the empty result.
 */
export function recordArtifactEncounterPresence(
  graph: WorldGraph,
  bearerId: string,
  tick: number,
): ArtifactPresenceResult {
  try {
    if (!graph.getNode(bearerId)) return NO_PRESENCE;
    const carried = [
      ...graph.getOutgoingEdges(bearerId, 'possesses'),
      ...graph.getOutgoingEdges(bearerId, 'bonded_to'),
    ].map(e => e.target);

    let artifactsPresent = 0;
    const climbed: Array<{ artifactId: string; level: number }> = [];
    for (const artifactId of carried) {
      const node = graph.getNode(artifactId);
      if (!isArtifactTraitBearer(node)) continue;
      const edge = graph.getEdge(`e.has_trait.${artifactId}.${ARTIFACT_STORIED_TRAIT_ID}`);
      if (!edge) continue;
      artifactsPresent++;

      const prior = edge.properties[ARTIFACT_PRESENCE_COUNT_KEY];
      const count = (typeof prior === 'number' && Number.isFinite(prior) ? prior : 0) + 1;
      const maxLevel = readMaxLevel(graph, ARTIFACT_STORIED_TRAIT_ID);
      const level = Math.min(maxLevel, 1 + Math.floor(count / ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL));
      const wasLevel = readLevel(edge);
      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          [ARTIFACT_PRESENCE_COUNT_KEY]: count,
          level,
          ...(level > wasLevel ? { lastReinforcedTick: tick } : {}),
        },
      });
      if (level > wasLevel) {
        climbed.push({ artifactId, level });
        emitTrace({
          category: 'artifact_trait',
          tick,
          summary: `${node!.name ?? artifactId} ${artifactTraitLevelWord(ARTIFACT_STORIED_TRAIT_ID, level) ?? `reaches level ${level}`}`,
          artifactId,
          artifactName: node!.name ?? artifactId,
          traitId: ARTIFACT_STORIED_TRAIT_ID,
          change: 'climbed',
          level,
          source: `encounter_presence:${count}`,
        });
      }
    }
    return { artifactsPresent, climbed };
  } catch {
    return NO_PRESENCE;
  }
}

// ─── Readers ──────────────────────────────────────────────────────────────────

export interface ArtifactTraitReading {
  traitId: string;
  /** The definition's display name — the player-facing word (never the id). */
  name: string;
  level: number;
  /** The level in words, or null when the definition has no level words. */
  levelWord: string | null;
  /** `#positive` / `#negative` from the definition's tags, for chip sentiment. */
  polarity: 'positive' | 'negative' | 'neutral';
  since: number | null;
  source: string | null;
  /** The definition's own description, for a hover. */
  description: string | null;
}

/**
 * The artifact traits a thing carries, for the sheet. Only `trait.artifact.*` edges;
 * a dangling edge whose definition is gone is skipped rather than rendered as its raw
 * id (Law 14). Empty for a non-bearer.
 */
export function readArtifactTraits(graph: WorldGraph, artifactId: string): ArtifactTraitReading[] {
  const node = graph.getNode(artifactId);
  if (!isArtifactTraitBearer(node)) return [];
  const out: ArtifactTraitReading[] = [];
  for (const edge of getTraitsForNode(graph, artifactId)) {
    if (!isArtifactTraitId(edge.target)) continue;
    const def = graph.getNode(edge.target);
    if (!def) continue;
    const level = readLevel(edge);
    const tags = Array.isArray(def.properties?.tags) ? (def.properties.tags as unknown[]) : [];
    const polarity = tags.includes('#negative') ? 'negative' : tags.includes('#positive') ? 'positive' : 'neutral';
    const acquired = edge.properties?.acquiredTick;
    out.push({
      traitId: edge.target,
      name: def.name ?? edge.target,
      level,
      levelWord: artifactTraitLevelWord(edge.target, level),
      polarity,
      since: typeof acquired === 'number' ? acquired : null,
      source: typeof edge.properties?.source === 'string' ? (edge.properties.source as string) : null,
      description: typeof def.properties?.description === 'string' ? (def.properties.description as string) : null,
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export interface ArtifactTraitReadout extends ArtifactTraitReading {
  artifactId: string;
  artifactName: string;
  /** The persisted presence count, for "how far from the next word?". */
  encountersPresent: number;
}

/**
 * Every artifact trait on every thing — or one thing's, matched by id, id prefix or
 * partial name (case-insensitive). The debug bridge's and the CLI's readout.
 */
export function describeArtifactTraits(graph: WorldGraph, query?: string): ArtifactTraitReadout[] {
  const lowered = query?.toLowerCase();
  const out: ArtifactTraitReadout[] = [];
  const things = [...graph.getNodesByType('artifact'), ...graph.getNodesByType('artifact_legendary')];
  for (const thing of things) {
    if (!isArtifactTraitBearer(thing)) continue;
    if (lowered) {
      const matches =
        thing.id === query
        || thing.id.startsWith(query!)
        || (thing.name ?? '').toLowerCase().includes(lowered);
      if (!matches) continue;
    }
    for (const reading of readArtifactTraits(graph, thing.id)) {
      const edge = graph.getEdge(`e.has_trait.${thing.id}.${reading.traitId}`);
      const count = edge?.properties[ARTIFACT_PRESENCE_COUNT_KEY];
      out.push({
        ...reading,
        artifactId: thing.id,
        artifactName: thing.name ?? thing.id,
        encountersPresent: typeof count === 'number' ? count : 0,
      });
    }
  }
  return out;
}

// ─── Internals ────────────────────────────────────────────────────────────────

function readLevel(edge: GraphEdge): number {
  const level = (edge.properties as Partial<TraitAssignmentProperties>).level;
  return typeof level === 'number' && Number.isFinite(level) ? level : 1;
}

function readMaxLevel(graph: WorldGraph, traitId: string): number {
  const def = graph.getNode(traitId);
  const max = def?.properties?.maxLevel;
  return typeof max === 'number' && Number.isFinite(max) && max >= 1 ? max : ARTIFACT_STORIED_MAX_LEVEL;
}
