/**
 * THR-1670 — the step cast on screen (power runtime S2, § UI pillar).
 *
 * Two readers of the one record the roll froze on the action
 * (`UnifiedAction.stepCasts`), and nothing else:
 *
 *   - `stepCastModelFor` — the cast line under a step's afterimage: which spell,
 *     who cast it, whether it landed, the cast line and the backlash line.
 *   - `buildCastChanges` — one consequence chip per write the cast produced
 *     (`StepCastRecord.writes`). Law 56: a chip is state-backed and anchored, so a
 *     write whose anchor no longer resolves draws nothing, and a cast that wrote
 *     nothing draws nothing — the odds line and the cast line already say it
 *     happened.
 *
 * Pure apart from the graph lookups the caller's `FightChipWorld` supplies.
 */

import type { WorldGraph } from '../../../../engine/graph';
import type {
  EncounterAftermathChange,
  EncounterAftermathConceptRef,
  StepCastRecord,
  StepCastWrite,
} from '../../../../types/unifiedAction';
import type { EncounterStageStepCastModel } from '../types';
import type { FightChipWorld } from './buildFightChanges';
import { fillFightChipSlots } from './buildFightChanges';
import { getSpellTemplate, spellDefinitionNodeId } from '../../../../data/spell-templates';
import {
  CAST_CHANGE_ID_PREFIX,
  CAST_CHIP_COPY,
  type CastChipKind,
} from '../../../../data/spell-cast-screen-content';

/** The spell's display name: its definition node's, else its template's, else its id. */
function spellNameOf(graph: Pick<WorldGraph, 'getNode'>, spellId: string): string {
  return graph.getNode(spellDefinitionNodeId(spellId))?.name
    ?? getSpellTemplate(spellId)?.name
    ?? spellId;
}

/**
 * The step history's cast model, or undefined for a step with no cast that
 * resolved into words (a decline, a refusal, a record from before the prose froze).
 */
export function stepCastModelFor(
  graph: Pick<WorldGraph, 'getNode'>,
  record: StepCastRecord | undefined,
): EncounterStageStepCastModel | undefined {
  if (!record || record.decision !== 'cast' || !record.spellId || !record.prose) return undefined;
  return {
    spellName: spellNameOf(graph, record.spellId),
    spellNodeId: spellDefinitionNodeId(record.spellId),
    casterName: graph.getNode(record.casterId)?.name ?? '',
    landed: record.landed === true,
    prose: record.prose,
    ...(record.backlashProse ? { backlashProse: record.backlashProse } : {}),
  };
}

/** Which chip a write reads as. */
function chipKindOf(write: StepCastWrite): CastChipKind {
  switch (write.kind) {
    case 'strain': return 'strain';
    case 'moved': return 'moved';
    case 'lifted': return 'lifted';
    case 'silenced': return 'silenced';
    case 'condition':
      if (write.channel === 'cast_condition') return write.harmful ? 'cast_condition_cost' : 'cast_condition';
      if (write.fromBacklash) return 'backlash_condition';
      if (write.fromPrice) return 'price_condition';
      return 'landed_condition';
  }
}

function sentenceCase(sentence: string): string {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * The cast chips for every step of the action, in step order. Deduped by
 * kind and anchor, so a strain paid twice in one scene is one chip.
 */
export function buildCastChanges(
  stepCasts: Readonly<Record<number, StepCastRecord>> | undefined,
  world: FightChipWorld,
): EncounterAftermathChange[] {
  if (!stepCasts) return [];
  const out: EncounterAftermathChange[] = [];
  const seen = new Set<string>();
  const indices = Object.keys(stepCasts).map(Number).sort((a, b) => a - b);
  for (const index of indices) {
    const record = stepCasts[index];
    if (!record || record.decision !== 'cast' || !record.spellId) continue;
    const spellName = world.nameOf(spellDefinitionNodeId(record.spellId))
      ?? getSpellTemplate(record.spellId)?.name;
    const casterName = world.nameOf(record.casterId);
    if (!spellName || !casterName) continue;
    for (const write of record.writes ?? []) {
      const kind = chipKindOf(write);
      const copy = CAST_CHIP_COPY[kind];
      // The anchor: the condition, place or item the write names; the bearer for a lift.
      const anchorId = kind === 'lifted' ? write.actorId : write.ref;
      const anchorName = world.nameOf(anchorId);
      const targetName = world.nameOf(write.actorId);
      if (!anchorName || !targetName) continue;
      const key = `${kind}:${anchorId}:${write.actorId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const isCondition = kind === 'strain' || kind.endsWith('_condition');
      const visualKind: EncounterAftermathConceptRef['visualKind'] = isCondition
        ? 'attachment'
        : kind === 'moved'
          ? 'location'
          : kind === 'silenced'
            ? 'artifact'
            : world.visualKindOf?.(anchorId) ?? 'agent';
      const sentence = fillFightChipSlots(copy.sentence, {
        caster: casterName,
        spell: spellName,
        target: targetName,
        condition: isCondition ? anchorName.toLowerCase() : '',
        place: kind === 'moved' ? anchorName : '',
        item: kind === 'silenced' ? anchorName : '',
      });
      const noun: EncounterAftermathConceptRef = {
        text: anchorName,
        entityId: anchorId,
        visualKind,
        visualName: anchorName,
      };
      out.push({
        id: `${CAST_CHANGE_ID_PREFIX}-${kind}-${anchorId}-${write.actorId}`,
        kind: isCondition || kind === 'lifted' ? 'trait' : kind === 'silenced' ? 'item' : 'shell_state',
        title: anchorName,
        detail: sentenceCase(sentence),
        polarity: copy.direction === 'gain' ? 'gain' : copy.direction === 'loss' ? 'loss' : 'info',
        category: copy.category,
        stateNoun: noun,
        direction: copy.direction,
        storyWeight: 'beat',
        actorId: write.actorId,
        actorName: targetName,
      });
    }
  }
  return out;
}
