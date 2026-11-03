/**
 * THR-2147 — the god's played cards in the Aftermath (plan THR-2146 E3).
 *
 * The one reader of `UnifiedAction.nudgeWrites`, the record `dispatchNudgeCommitments`
 * leaves on the action. Each write becomes an ordinary consequence chip, merged
 * beside the fight's and the cast's (`buildFightChanges`, `buildCastChanges`).
 *
 * Law 56: a chip is state-backed and anchored. A record whose mortal or named
 * thing no longer resolves draws nothing (fail-open, like `buildCastChanges`).
 * Pure apart from the graph lookups the caller's `FightChipWorld` supplies.
 */

import type {
  EncounterAftermathChange,
  EncounterAftermathConceptRef,
  NudgeWriteRecord,
} from '../../../types/unifiedAction';
import type { EncounterType } from '../../../types/encounter';
import type { FightChipWorld } from './buildFightChanges';
import { AMBITION_TEMPLATES } from '../../../data/ambition-templates';
import { COMPULSION_URGE_NOUNS, NUDGE_WRITE_CHIP_COPY } from '../../../data/nudge-card-display';

/** Every chip id this module mints starts with this. */
export const NUDGE_WRITE_CHANGE_ID_PREFIX = 'nudge-chip';

/**
 * The changed thing's name and the concept its tile draws. Undefined ⇒ the chip
 * cannot be anchored and is dropped. Kinds that name no thing anchor on the mortal.
 */
function thingOf(
  write: NudgeWriteRecord,
  world: FightChipWorld,
): { name: string; noun: EncounterAftermathConceptRef } | undefined {
  const named = (id: string | undefined, visualKind: EncounterAftermathConceptRef['visualKind']) => {
    const name = id ? world.nameOf(id) : undefined;
    if (!id || !name) return undefined;
    return { name, noun: { text: name, entityId: id, visualKind, visualName: name } };
  };
  const onMortal = (name: string) => {
    const mortal = world.nameOf(write.targetId);
    return mortal
      ? { name, noun: { text: mortal, entityId: write.targetId, visualKind: 'agent' as const, visualName: mortal } }
      : undefined;
  };
  switch (write.kind) {
    case 'remove_condition': {
      const found = named(write.refId, 'attachment');
      return found ? { name: found.name.toLowerCase(), noun: found.noun } : undefined;
    }
    case 'spawn_artifact':
      return named(write.refId, world.visualKindOf?.(write.refId ?? '') ?? 'artifact');
    case 'spell_grant':
      return named(write.refId, 'attachment');
    case 'assign_ambition': {
      const title = AMBITION_TEMPLATES.find((t) => t.id === write.refId)?.displayName;
      return title ? onMortal(title) : undefined;
    }
    case 'plant_compulsion': {
      const lean = write.refId ? COMPULSION_URGE_NOUNS[write.refId as EncounterType] : undefined;
      return lean ? onMortal(lean) : undefined;
    }
    case 'emit_omen':
    case 'favor_creation':
      return onMortal('');
  }
}

function fill(template: string, name: string, thing: string): string {
  const filled = template.replaceAll('{name}', name).replaceAll('{thing}', thing);
  return filled.charAt(0).toUpperCase() + filled.slice(1);
}

/** The Aftermath chips for a played hand's writes, in write order, deduped by kind and anchor. */
export function buildNudgeWriteChanges(
  writes: readonly NudgeWriteRecord[] | undefined,
  world: FightChipWorld,
): EncounterAftermathChange[] {
  if (!writes || writes.length === 0) return [];
  const out: EncounterAftermathChange[] = [];
  const seen = new Set<string>();
  for (const write of writes) {
    const copy = NUDGE_WRITE_CHIP_COPY[write.kind];
    const mortal = world.nameOf(write.targetId);
    const thing = copy ? thingOf(write, world) : undefined;
    if (!copy || !mortal || !thing) continue;
    const key = `${write.kind}:${thing.noun.entityId}:${write.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const title = fill(copy.title, mortal, thing.name);
    out.push({
      id: `${NUDGE_WRITE_CHANGE_ID_PREFIX}-${write.kind}-${write.refId ?? 'none'}-${write.targetId}`,
      kind: write.kind === 'spawn_artifact'
        ? 'item'
        : write.kind === 'remove_condition' || write.kind === 'spell_grant' ? 'trait' : 'future_hook',
      title: write.kind === 'remove_condition' ? fill('{thing}', mortal, thing.noun.text) : title,
      detail: fill(copy.sentence, mortal, thing.name),
      polarity: 'gain',
      category: copy.category,
      stateNoun: thing.noun,
      direction: copy.direction,
      storyWeight: 'beat',
      actorId: write.targetId,
      actorName: mortal,
    });
  }
  return out;
}
