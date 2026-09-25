/**
 * THR-1553 — the fight's consequence chips (fight on screen, slice F3; plan doc
 * `Docs/plans/2026-09-23-fight-on-screen.md` § UI pillar, item 2).
 *
 * The one step between a resolved fight and the chip block: read the action's
 * `fightState` and turn each field a writer recorded into an
 * `EncounterAftermathChange`, which `buildAftermathConsequences` then renders
 * exactly like every other change.
 *
 * ## Why `fightState`, and nothing else
 *
 * Law 56: a chip is state-backed and anchored. The engine's derived-chip channel
 * (`action.aftermathChanges`) emits nothing for a condition applied during a
 * step, and traces are off unless tracing is enabled — so every fight chip here
 * reads a field that plan docs 1–3 (and 5) write onto the resolved action, and a
 * chip whose field is absent never renders. A chip whose anchor node is gone
 * never renders either: `world.nameOf` returning `undefined` drops it.
 *
 * ## Whose record each chip reads
 *
 * The fighter-anchored chips (scarred, slain (fighter), standing, grudge) read
 * `fightState.ending`, which is always **the fighter's own** record. A duel's
 * other side is written to `opponentEnding` (THR-1557), and only the parts of it
 * that change the fighter's world get a chip (THR-1561): the opponent slain, and
 * the opponent's grudge against the fighter. The loser's own scar and lost
 * standing are the loser's costs, shown on the loser's sheet, never here.
 *
 * Pure: no graph, no React. The caller hands in a `FightChipWorld` over the
 * graph, so the table is cheap to test with fixtures.
 */

import type { FightState } from '../../../../types/fight';
import type {
  EncounterAftermathCategory,
  EncounterAftermathChange,
  EncounterAftermathChangeKind,
  EncounterAftermathConceptRef,
} from '../../../../types/unifiedAction';
import {
  FIGHT_CHIP_CATEGORY,
  FIGHT_CHIP_COPY,
  FIGHT_CHIP_TOOLTIP_IDS,
  FIGHT_CONDITION_CHIP_COPY,
  FIGHT_CONDITION_CHIP_FALLBACK_SENTENCE,
  FIGHT_STANDING_LOSS_SENTENCE,
  clockStateWord,
  type FightChipKind,
} from '../../../../data/fight-screen-content';

/** What the builder needs to know about the world — the caller holds the graph. */
export interface FightChipWorld {
  /** The node's display name, or `undefined` when the node does not exist (drops the chip). */
  nameOf(id: string): string | undefined;
  /** The concept kind a node's link routes by (`agent`, `location`, `faction`, `artifact`). */
  visualKindOf?(id: string): EncounterAftermathConceptRef['visualKind'];
  /** The condition's tags, for a condition outside the copy table. */
  conditionTagsOf?(conditionId: string): readonly string[];
}

/** Every chip id this module mints starts with this, so a caller can tell them apart. */
export const FIGHT_CHANGE_ID_PREFIX = 'fight-chip';

/** Fill a chip template's own slots. An unfilled slot is removed, never rendered (Law 43). */
export function fillFightChipSlots(template: string, slots: Readonly<Record<string, string>>): string {
  return template
    .replace(/\{(\w+)\}/g, (_match, key: string) => slots[key] ?? '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface ChipSpec {
  readonly kind: FightChipKind;
  readonly anchorId: string;
  readonly category: EncounterAftermathCategory;
  readonly wireKind: EncounterAftermathChangeKind;
  readonly direction: 'gain' | 'loss' | 'opens';
  readonly noun: string;
  readonly sentence: string;
  readonly nounTooltipId?: string;
  readonly nounVisualKind?: EncounterAftermathConceptRef['visualKind'];
  readonly deltaLabel?: string;
}

function polarityFor(direction: ChipSpec['direction']): EncounterAftermathChange['polarity'] {
  if (direction === 'gain') return 'gain';
  if (direction === 'loss') return 'loss';
  return 'info';
}

function toChange(spec: ChipSpec): EncounterAftermathChange {
  const noun: EncounterAftermathConceptRef = {
    text: spec.noun,
    entityId: spec.anchorId,
    tooltipId: spec.nounTooltipId,
    visualKind: spec.nounVisualKind,
    visualName: spec.noun,
  };
  return {
    id: `${FIGHT_CHANGE_ID_PREFIX}-${spec.kind}-${spec.anchorId}`,
    kind: spec.wireKind,
    title: spec.noun,
    detail: spec.sentence,
    polarity: polarityFor(spec.direction),
    category: spec.category,
    stateNoun: noun,
    direction: spec.direction,
    storyWeight: 'beat',
    ...(spec.deltaLabel ? { deltaLabel: spec.deltaLabel } : {}),
  };
}

/**
 * The fight's chips, as aftermath changes, in the chip table's order. The chip
 * block sorts them by category afterwards, so the order here only breaks ties.
 *
 * Returns `[]` for an action with no `fightState` — a non-fight ending gets no
 * fight chip (Law 56).
 */
export function buildFightChanges(
  fight: FightState | undefined,
  fighterId: string,
  world: FightChipWorld,
): EncounterAftermathChange[] {
  if (!fight) return [];
  const specs: ChipSpec[] = [];
  const kindOf = (id: string) => world.visualKindOf?.(id) ?? 'agent';

  const fighterName = world.nameOf(fighterId);
  const opponentId = fight.opponentId ?? undefined;
  const opponentName = opponentId ? world.nameOf(opponentId) : undefined;
  // The fighter's ending is the fighter's own: when it names a victor, it is the
  // one the fighter faced (a yield to a mortal records the victor explicitly).
  const ending = fight.ending;
  const victorId = ending?.victorStanding?.victorId ?? opponentId;
  const victorName = victorId ? world.nameOf(victorId) : undefined;
  const slots: Record<string, string> = {
    fighter: fighterName ?? '',
    opponent: opponentName ?? '',
    victor: victorName ?? '',
  };

  const push = (kind: Exclude<FightChipKind, 'condition'>, anchorId: string, extra: {
    wireKind: EncounterAftermathChangeKind;
    direction: ChipSpec['direction'];
    visualKind?: EncounterAftermathConceptRef['visualKind'];
    slots?: Record<string, string>;
    sentence?: string;
  }) => {
    const copy = FIGHT_CHIP_COPY[kind];
    const all = { ...slots, ...(extra.slots ?? {}) };
    specs.push({
      kind,
      anchorId,
      category: FIGHT_CHIP_CATEGORY[kind],
      wireKind: extra.wireKind,
      direction: extra.direction,
      noun: fillFightChipSlots(copy.noun, all),
      sentence: fillFightChipSlots(extra.sentence ?? copy.sentence, all),
      nounTooltipId: FIGHT_CHIP_TOOLTIP_IDS[kind].tooltipId,
      nounVisualKind: extra.visualKind,
      deltaLabel: copy.deltaLabel ? fillFightChipSlots(copy.deltaLabel, all) : undefined,
    });
  };

  // ─── The fighter's own marks (SCAR) — slain suppresses scarred ───────────
  if (ending && fighterName) {
    if (ending.face === 'slain' && victorName) {
      push('slain_fighter', fighterId, { wireKind: 'trait', direction: 'loss', visualKind: 'agent' });
    } else if (ending.scarWritten && victorName) {
      push('scarred', fighterId, { wireKind: 'trait', direction: 'loss', visualKind: 'agent' });
    }
  }

  // ─── Band conditions (SCAR for a loss, BOON for a gain), deduped ──────────
  if (fighterName) {
    for (const conditionId of new Set(fight.conditionsApplied ?? [])) {
      const conditionName = world.nameOf(conditionId);
      if (!conditionName) continue;
      const known = FIGHT_CONDITION_CHIP_COPY[conditionId];
      const polarity = known?.polarity
        ?? ((world.conditionTagsOf?.(conditionId) ?? []).includes('#positive') ? 'gain' : 'loss');
      const sentence = fillFightChipSlots(known?.sentence ?? FIGHT_CONDITION_CHIP_FALLBACK_SENTENCE, {
        ...slots,
        condition: conditionName.toLowerCase(),
      });
      specs.push({
        kind: 'condition',
        anchorId: conditionId,
        category: polarity === 'gain' ? 'boon' : 'scar',
        wireKind: 'trait',
        direction: polarity,
        noun: conditionName,
        sentence,
        // The condition's own `attachment.*` id (derived from `visualKind`), so
        // the concept is explained once, in one place.
        nounVisualKind: 'attachment',
      });
    }
  }

  // ─── Storied weapons and trophies (BOON) ──────────────────────────────────
  for (const artifactId of new Set(fight.storiedClimbs ?? [])) {
    const artifactName = world.nameOf(artifactId);
    if (!artifactName) continue;
    push('storied', artifactId, {
      wireKind: 'growth',
      direction: 'gain',
      visualKind: 'artifact',
      slots: { artifact: artifactName },
    });
  }
  const reward = ending?.reward;
  if (reward && fighterName) {
    const itemName = world.nameOf(reward.instanceId);
    if (itemName) {
      push('trophy', reward.instanceId, {
        wireKind: 'item',
        direction: 'gain',
        visualKind: 'artifact',
        slots: { item: itemName },
      });
    }
  }

  // ─── Standing and the grudge (BOND) ───────────────────────────────────────
  if (ending?.reputation && ending.reputation.delta !== 0) {
    const place = world.nameOf(ending.reputation.counterpartyId);
    if (place) {
      const gained = ending.reputation.delta > 0;
      push('standing', ending.reputation.counterpartyId, {
        wireKind: 'reputation',
        direction: gained ? 'gain' : 'loss',
        visualKind: kindOf(ending.reputation.counterpartyId),
        slots: { settlement: place },
        sentence: gained ? undefined : FIGHT_STANDING_LOSS_SENTENCE,
      });
    }
  }
  if (ending?.humiliation && ending.humiliation.delta !== 0
    && ending.humiliation.counterpartyId !== ending.reputation?.counterpartyId) {
    const place = world.nameOf(ending.humiliation.counterpartyId);
    if (place) {
      push('standing', ending.humiliation.counterpartyId, {
        wireKind: 'reputation',
        direction: 'loss',
        visualKind: kindOf(ending.humiliation.counterpartyId),
        slots: { settlement: place },
        sentence: FIGHT_STANDING_LOSS_SENTENCE,
      });
    }
  }
  if (ending?.grudgeWritten && fighterName && victorId && victorName) {
    push('grudge', victorId, { wireKind: 'reputation', direction: 'loss', visualKind: 'agent' });
  }
  // THR-1561 — a duel's beaten loser, spared, now holds a grudge against the fighter.
  const opponentEnding = fight.opponentEnding;
  if (opponentEnding?.grudgeWritten && fighterName && opponentId && opponentName) {
    push('grudge_against_fighter', opponentId, { wireKind: 'reputation', direction: 'loss', visualKind: 'agent' });
  }

  // ─── What the fight did to the world (PATH) — slain suppresses the clock ──
  const lair = fight.lairOutcome;
  // Two sources: a beast felled at its lair, or a duel's loser the fighter killed (THR-1561).
  const opponentSlain = !!((lair?.felled || opponentEnding?.face === 'slain') && opponentId && opponentName);
  if (opponentSlain) {
    push('slain_opponent', opponentId!, { wireKind: 'shell_state', direction: 'opens', visualKind: 'agent' });
  } else if (
    fight.persistent === true
    && opponentId
    && opponentName
    && fighterName
    && fight.clockNow - fight.clockAtStart > 0
  ) {
    // Only a persistent clock is a world object; a per-fight clock (a mortal's,
    // either side of a duel) ends with the action and gets no chip.
    push('clock', opponentId, {
      wireKind: 'shell_state',
      direction: 'opens',
      visualKind: 'agent',
      slots: { clockWord: clockStateWord(fight.clockNow, fight.clockSize, false) },
    });
  }
  if (lair?.lairCleared) {
    const lairName = world.nameOf(lair.lairId);
    if (lairName) {
      push('lair_cleared', lair.lairId, {
        wireKind: 'shell_state',
        direction: 'opens',
        visualKind: 'location',
        slots: { lair: lairName },
      });
    }
  }

  return specs.map(toChange);
}

/**
 * Append the fight's chips to a change set, skipping any whose state an existing
 * change already names (same anchor, same category) — a trophy the reward pool
 * also reported is one chip, not two.
 */
export function mergeFightChanges(
  changes: readonly EncounterAftermathChange[],
  fightChanges: readonly EncounterAftermathChange[],
): readonly EncounterAftermathChange[] {
  if (fightChanges.length === 0) return changes;
  const taken = new Set(
    changes
      .filter(c => c.stateNoun?.entityId && c.category)
      .map(c => `${c.category}:${c.stateNoun!.entityId}`),
  );
  const extra = fightChanges.filter(c => !taken.has(`${c.category}:${c.stateNoun?.entityId}`));
  return extra.length > 0 ? [...changes, ...extra] : changes;
}
