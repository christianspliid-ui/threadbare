/**
 * What your hand did — the target side of a player cast (THR-1606, plan B1).
 *
 * A player cast's graph-ops write to its *target*: an `apply_influence` lands in
 * the mortal's `divineInfluences`, a trait op adds or lifts a `has_trait` edge.
 * Before this module the resolver's aftermath diff only ever read the actor (the
 * god), so the receipt said "‹God› completed Dream" and nothing about the mortal,
 * and the mortal's own story never heard of it.
 *
 * `snapshotCastTarget` reads the target before the step's ops run and
 * `snapshotTargetChanges` diffs it after, producing `EncounterAftermathChange`s
 * with `subjectId` set to the target. Three consumers read them:
 *   - the receipt (`processPlayerReceipts`) names the target and links to them;
 *   - the digest write files the cast on the target (`castDigestEntry`), so
 *     `composeThreadStory(target)` remembers your hand;
 *   - the debug bridge (`getLastCastConsequence`).
 *
 * Law 56 binds every line here: a change is produced only for a real write the
 * diff observed. A cast that wrote nothing produces nothing — never a chip.
 *
 * Pure and deterministic (NFP #3): reads the graph, never writes, no PRNG.
 * Fail-soft (NFP #4): an unknown target snapshots as empty; the resolver wraps
 * the diff in a catch so a throw here never costs the resolution.
 */

import type { WorldGraph } from './graph';
import type { EncounterAftermathChange } from '../types/unifiedAction';
import type { DivineInfluenceEntry } from '../types/dream';
import type { ValuePair } from '../types/agent';
import type { DigestEntry } from '../types/attention';
import type { ReachDomain } from '../types/traits';
import { valuePoleWord } from './castInfluenceDrift';
import {
  INFLUENCE_CHIP_NOUNS,
  INFLUENCE_CHIP_HOVER,
  TARGET_INFLUENCE_CHANGE_TITLE,
  TARGET_INFLUENCE_CHANGE_DETAIL,
  TARGET_INFLUENCE_CHANGE_DETAIL_PLAIN,
  TARGET_TRAIT_GAINED_TITLE,
  TARGET_TRAIT_GAINED_DETAIL,
  TARGET_TRAIT_LOST_TITLE,
  TARGET_TRAIT_LOST_DETAIL,
  CAST_DIGEST_LINES,
  fillReceiptSlots,
} from '../data/receipt-content';

// ─── Chip words ──────────────────────────────────────────────────────────────

/** The sheet noun an influence wears (`Dreaming`, `Compelled`), or undefined for older kinds. */
export function influenceChipNoun(interventionType: string): string | undefined {
  return INFLUENCE_CHIP_NOUNS[interventionType];
}

/**
 * The strongest signed drift an influence carries, as `[pair, drift]`, or
 * undefined when it carries none. One cast writes one pair today; taking the
 * largest keeps the reading honest if a later payload writes several.
 */
export function dominantValueDrift(entry: Pick<DivineInfluenceEntry, 'valueDrifts'>): [ValuePair, number] | undefined {
  let best: [ValuePair, number] | undefined;
  for (const [pair, drift] of Object.entries(entry.valueDrifts ?? {}) as [ValuePair, number][]) {
    if (typeof drift !== 'number' || drift === 0) continue;
    if (!best || Math.abs(drift) > Math.abs(best[1])) best = [pair, drift];
  }
  return best;
}

/**
 * The chip's hover sentence — what the influence does and when it fades.
 * Undefined when the influence carries no value drift: the older intervention
 * kinds keep their duration-only reading.
 */
export function influenceChipHover(
  entry: Pick<DivineInfluenceEntry, 'valueDrifts'>,
  durationWord: string,
): string | undefined {
  const drift = dominantValueDrift(entry);
  if (!drift) return undefined;
  return fillReceiptSlots(INFLUENCE_CHIP_HOVER, {
    pole: valuePoleWord(drift[0], drift[1]),
    duration: durationWord,
  });
}

// ─── Snapshot + diff ─────────────────────────────────────────────────────────

/** The target-side state a player cast can write, read at one instant. */
export interface CastTargetSnapshot {
  readonly targetId: string;
  /** Ids of the target's `divineInfluences` entries. */
  readonly influenceIds: ReadonlySet<string>;
  /** `has_trait` targets (trait / condition node id → display name). */
  readonly traits: ReadonlyMap<string, string>;
}

export function snapshotCastTarget(graph: WorldGraph, targetId: string): CastTargetSnapshot {
  const node = graph.getNode(targetId);
  const influences = (node?.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];
  const traits = new Map<string, string>();
  if (node) {
    for (const edge of graph.getOutgoingEdges(targetId, 'has_trait')) {
      const trait = graph.getNode(edge.target);
      traits.set(edge.target, trait?.name ?? edge.target);
    }
  }
  return {
    targetId,
    influenceIds: new Set(influences.map((e) => e.id)),
    traits,
  };
}

export interface TargetChangeContext {
  readonly graph: WorldGraph;
  /** `${actionId}:step:${n}` — the id stem every change carries, unique per step. */
  readonly idStem: string;
  readonly targetName: string;
}

/**
 * Diff two snapshots of one target into aftermath changes, each carrying
 * `subjectId`. Only real writes produce a change (Law 56).
 */
export function snapshotTargetChanges(
  before: CastTargetSnapshot,
  after: CastTargetSnapshot,
  ctx: TargetChangeContext,
): EncounterAftermathChange[] {
  const out: EncounterAftermathChange[] = [];
  const targetId = after.targetId;
  const targetConcept = { text: ctx.targetName, entityId: targetId };

  const influences = (ctx.graph.getNode(targetId)?.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];
  for (const entry of influences) {
    if (before.influenceIds.has(entry.id)) continue;
    const noun = influenceChipNoun(entry.interventionType) ?? entry.interventionType;
    const drift = dominantValueDrift(entry);
    const detail = drift
      ? fillReceiptSlots(TARGET_INFLUENCE_CHANGE_DETAIL, {
          target: ctx.targetName,
          noun,
          pole: valuePoleWord(drift[0], drift[1]),
        })
      : fillReceiptSlots(TARGET_INFLUENCE_CHANGE_DETAIL_PLAIN, { target: ctx.targetName, noun });
    out.push({
      id: `${ctx.idStem}:target:${targetId}:influence:${entry.id}`,
      kind: 'trait',
      title: TARGET_INFLUENCE_CHANGE_TITLE,
      detail,
      polarity: 'info',
      stateNoun: { text: noun },
      concepts: [targetConcept],
      actorId: targetId,
      actorName: ctx.targetName,
      subjectId: targetId,
    });
  }

  for (const [traitId, name] of after.traits) {
    if (before.traits.has(traitId)) continue;
    out.push({
      id: `${ctx.idStem}:target:${targetId}:trait_gained:${traitId}`,
      kind: 'trait',
      title: TARGET_TRAIT_GAINED_TITLE,
      detail: fillReceiptSlots(TARGET_TRAIT_GAINED_DETAIL, { target: ctx.targetName, trait: name }),
      polarity: 'gain',
      stateNoun: { text: name, entityId: traitId },
      concepts: [targetConcept],
      actorId: targetId,
      actorName: ctx.targetName,
      subjectId: targetId,
    });
  }
  for (const [traitId, name] of before.traits) {
    if (after.traits.has(traitId)) continue;
    out.push({
      id: `${ctx.idStem}:target:${targetId}:trait_lost:${traitId}`,
      kind: 'trait',
      title: TARGET_TRAIT_LOST_TITLE,
      detail: fillReceiptSlots(TARGET_TRAIT_LOST_DETAIL, { target: ctx.targetName, trait: name }),
      polarity: 'loss',
      stateNoun: { text: name },
      concepts: [targetConcept],
      actorId: targetId,
      actorName: ctx.targetName,
      subjectId: targetId,
    });
  }

  return out;
}

/** The target-side changes an action accumulated, in order. */
export function targetSideChanges(
  changes: readonly EncounterAftermathChange[] | undefined,
): EncounterAftermathChange[] {
  return (changes ?? []).filter((c) => c.subjectId !== undefined);
}

// ─── The target's story ──────────────────────────────────────────────────────

/**
 * The line the mortal's Story So Far tells about the cast. Keyed by the first
 * new influence's intervention type; any other target change reads `default`.
 */
export function castDigestLine(
  graph: WorldGraph,
  targetId: string,
  changes: readonly EncounterAftermathChange[],
): string {
  const influences = (graph.getNode(targetId)?.properties?.divineInfluences ?? []) as DivineInfluenceEntry[];
  for (const change of changes) {
    const influenceId = change.id.split(':influence:')[1];
    if (!influenceId) continue;
    const entry = influences.find((e) => e.id === influenceId);
    if (!entry) continue;
    const line = CAST_DIGEST_LINES[entry.interventionType];
    if (!line) continue;
    const drift = dominantValueDrift(entry);
    return fillReceiptSlots(line, { pole: drift ? valuePoleWord(drift[0], drift[1]) : '' });
  }
  return CAST_DIGEST_LINES.default;
}

/**
 * The digest entry that files a cast on the mortal it touched. Notable by
 * construction — the god's hand on a life is never background noise.
 */
export function castDigestEntry(args: {
  graph: WorldGraph;
  targetId: string;
  templateId: string;
  templateName: string;
  reach: ReachDomain;
  tick: number;
  success: boolean;
  changes: readonly EncounterAftermathChange[];
}): DigestEntry {
  const node = args.graph.getNode(args.targetId);
  return {
    agentId: args.targetId,
    agentName: (node?.properties?.name as string | undefined) ?? node?.name ?? 'Unknown',
    encounterId: args.templateId,
    encounterName: args.templateName,
    encounterType: 'explore',
    reachPrimary: args.reach,
    tick: args.tick,
    success: args.success,
    significantOutcomes: args.changes.map((c) => c.detail),
    capabilityChanges: {},
    attachmentsGained: [],
    attachmentsLost: [],
    quintessenceDelta: 0,
    isNotable: true,
    wasCuratedOut: false,
    isDormantAgent: false,
    sourceType: 'agent',
    castLine: castDigestLine(args.graph, args.targetId, args.changes),
  };
}

// ─── Inspection (debug bridge) ───────────────────────────────────────────────

/** The newest player cast's consequence, as `__DEBUG.getLastCastConsequence()` reports it. */
export interface LastCastConsequence {
  readonly templateId: string;
  readonly targetId: string | null;
  readonly targetName: string | null;
  /** What the receipt's toast said. */
  readonly toastMessage: string | null;
  /** Every change the receipt carried; `subject` is the target for target-side changes. */
  readonly changes: Array<{ kind: string; subject: string; word: string }>;
  /** True when the cast was filed on the target's own digest (their Story So Far). */
  readonly digestFiledOnTarget: boolean;
}

/**
 * Read the newest player cast receipt and report who it changed and how, and
 * whether the target's story heard of it. Reads only what the game already holds
 * (the receipt queue and the digest buffer), so it reports what the player saw.
 */
export function describeLastCastConsequence(state: {
  readonly playerActionReceipts?: readonly {
    templateId: string;
    targetId: string;
    targetName: string;
    actorName?: string;
    resolvedTick: number;
    toastMessage?: string;
    changes: readonly EncounterAftermathChange[];
  }[];
  readonly digestBuffer?: readonly DigestEntry[];
}): LastCastConsequence | null {
  const receipts = state.playerActionReceipts ?? [];
  if (receipts.length === 0) return null;
  const last = [...receipts].sort((a, b) => a.resolvedTick - b.resolvedTick)[receipts.length - 1];
  const hasTarget = !!last.targetId && last.targetName !== 'yourself';
  return {
    templateId: last.templateId,
    targetId: hasTarget ? last.targetId : null,
    targetName: hasTarget ? last.targetName : null,
    toastMessage: last.toastMessage ?? null,
    changes: last.changes.map((c) => ({
      kind: c.kind,
      subject: c.subjectId ?? c.actorId ?? 'actor',
      word: c.stateNoun?.text ?? c.title,
    })),
    digestFiledOnTarget: hasTarget && (state.digestBuffer ?? []).some((e) =>
      e.agentId === last.targetId &&
      e.encounterId === last.templateId &&
      !!e.castLine &&
      e.tick >= last.resolvedTick - 1,
    ),
  };
}
