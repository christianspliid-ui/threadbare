/**
 * THR-971 — map a resolved encounter's authored aftermath onto the mockup's
 * consequence chips: what you got, what it cost, what it planted.
 *
 * This module is deliberately pure and free of React, graph, and engine
 * imports. The taxonomy is the part that has to be *right*, so it is the part
 * that has to be cheap to test in isolation.
 *
 * ## The mapping is a re-presentation, never a second vocabulary
 *
 * Every chip is derived from something the encounter already declares:
 *
 * | Chip       | Source                                                        |
 * | ---------- | ------------------------------------------------------------- |
 * | `prize`    | `item` change, gained                                          |
 * | `standing` | `reputation` / `faction_reputation` / `reputation_tally`       |
 * | `toll`     | anything given up — a lost `item`, `growth`, or `shell_state`  |
 * | `wound`    | `trait` change that cost the bearer something                  |
 * | `seed`     | `future_hook` change **and** `encounter_seed` reaction effects |
 * | `mark`     | everything else (fail-soft)                                    |
 *
 * ## Two deviations from the ticket's stated sources, both forced
 *
 * 1. **`toll` does not read `consequence.quintessenceEvent`.** That field lives
 *    on `OutcomeConsequence` in `engine/outcomeConsequences.ts`, is consumed
 *    per-step by the pending-quintessence queue, and is never persisted onto
 *    `UnifiedAction` — so it is unreachable from any UI adapter. Rather than
 *    widen the engine for a display concern, a toll is read from the authored
 *    change set's losses, which is where an encounter states its price in words
 *    anyway. Widening `UnifiedAction` to carry the Q event is tracked separately.
 *
 * 2. **`seed` reads the resolved variant's reaction effects.** `encounter_seed`
 *    is only expressible as an `EncounterAftermathReactionEffect`, so a planted
 *    sequel is attached to a reaction rather than to the ending as a whole. A
 *    variant offering one reaction therefore plants unconditionally; one
 *    offering several plants conditionally on the pick. Both are surfaced the
 *    same way, because "this ending sets X in motion" is true either way and
 *    silence is the failure mode this ticket exists to fix.
 *
 * Nothing here prints a magnitude. Chip sentences are authored prose; a toll is
 * stated in words, per the nudge-model surface rules.
 */

import type {
  EncounterAftermathChange,
  EncounterAftermathChangeKind,
  EncounterAftermathChangePolarity,
  EncounterAftermathReaction,
} from '../../../../types/unifiedAction';
import type {
  EncounterStageConsequenceChipModel,
  EncounterStageConsequenceKind,
  EncounterStageConsequenceTone,
} from '../types';

/** Kind tag drawn on the chip. Uppercased at the data layer so the surface does not have to. */
export const CONSEQUENCE_KIND_LABELS: Record<EncounterStageConsequenceKind, string> = {
  prize: 'PRIZE',
  standing: 'STANDING',
  toll: 'TOLL',
  wound: 'WOUND',
  seed: 'SEED',
  mark: 'MARK',
};

/** A change polarity that means the bearer gave something up. */
function isCost(polarity: EncounterAftermathChangePolarity): boolean {
  return polarity === 'loss' || polarity === 'mixed';
}

function toneFor(
  kind: EncounterStageConsequenceKind,
  polarity: EncounterAftermathChangePolarity,
): EncounterStageConsequenceTone {
  if (kind === 'seed') return 'seed';
  if (kind === 'toll' || kind === 'wound') return 'loss';
  if (polarity === 'gain') return 'gain';
  if (isCost(polarity)) return 'loss';
  return 'info';
}

/**
 * Classify one authored change into its chip kind.
 *
 * Exported for direct unit testing: this table is the contract, and an
 * unrecognised kind must degrade to `mark` rather than vanish.
 */
export function classifyChangeKind(
  kind: EncounterAftermathChangeKind | string,
  polarity: EncounterAftermathChangePolarity,
): EncounterStageConsequenceKind {
  switch (kind) {
    case 'item':
      // An item that left the bearer's hands is a price, not a prize.
      return isCost(polarity) ? 'toll' : 'prize';
    case 'reputation':
    case 'faction_reputation':
    case 'reputation_tally':
      return 'standing';
    case 'trait':
      // A trait that cost something is a wound; one that did not is a mark on
      // the bearer — the same distinction the wound system draws (THR-117).
      return isCost(polarity) ? 'wound' : 'mark';
    case 'future_hook':
      return 'seed';
    case 'growth':
    case 'shell_state':
      return isCost(polarity) ? 'toll' : 'mark';
    default:
      // Fail-soft: an unknown kind is still a consequence and still renders.
      return 'mark';
  }
}

/**
 * Segment a chip sentence so named entities link.
 *
 * Injected rather than imported so this module stays pure — the adapter passes
 * a closure over `autoLinkNarrative` bound to the encounter's link entries.
 */
export type ChipSentenceLinker = (
  id: string,
  text: string,
) => EncounterStageConsequenceChipModel['sentence'];

export interface BuildAftermathConsequencesArgs {
  /** The authored change set the ending resolved to. */
  changes: readonly EncounterAftermathChange[];
  /**
   * Reactions offered by the resolved variant. Scanned for `encounter_seed`
   * effects — the only place a planted sequel is expressible.
   */
  reactions?: readonly EncounterAftermathReaction[];
  /** Enrich authored prose (placeholder expansion) before segmenting it. */
  enrich: (text: string) => string;
  /** Segment an enriched sentence into linkable parts. */
  link: ChipSentenceLinker;
}

/**
 * Build the ending's consequence chips.
 *
 * Order is stable and meaningful: authored changes in their authored order
 * first, then seeds last — the ending says what happened before it says what
 * it set in motion.
 */
export function buildAftermathConsequences(
  args: BuildAftermathConsequencesArgs,
): EncounterStageConsequenceChipModel[] {
  const { changes, reactions, enrich, link } = args;
  const chips: EncounterStageConsequenceChipModel[] = [];

  for (const change of changes) {
    const kind = classifyChangeKind(change.kind, change.polarity);
    const id = `consequence-${change.id}`;
    chips.push({
      id,
      kind,
      kindLabel: CONSEQUENCE_KIND_LABELS[kind],
      sentence: link(id, enrich(change.detail)),
      tone: toneFor(kind, change.polarity),
    });
  }

  // Seeds the encounter actually plants, read from the effects rather than
  // re-authored — so a planted sequel cannot silently go unmentioned.
  const seenSeedLabels = new Set<string>();
  for (const reaction of reactions ?? []) {
    for (const effect of reaction.effects ?? []) {
      if (effect.kind !== 'encounter_seed') continue;
      const label = effect.seedLabel?.trim();
      // A seed with no label has nothing to say to the player; skip rather than
      // render an empty chip.
      if (!label || seenSeedLabels.has(label)) continue;
      seenSeedLabels.add(label);
      const id = `consequence-seed-${reaction.id}-${seenSeedLabels.size}`;
      chips.push({
        id,
        kind: 'seed',
        kindLabel: CONSEQUENCE_KIND_LABELS.seed,
        sentence: link(id, enrich(label)),
        tone: 'seed',
      });
    }
  }

  return chips;
}
