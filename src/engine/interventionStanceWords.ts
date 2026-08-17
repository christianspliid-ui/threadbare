/**
 * THR-1048 — plain English for a choice's `interventionType`, the last raw
 * engine enum the encounter veil was printing at the player.
 *
 * `supportive` / `coercive` / `withdrawn` is the stance triple the resolution
 * recorders key on. It was never display copy, but `ChoiceBlock`'s meta row
 * rendered it verbatim and lowercased — `supportive` sitting beside
 * `&#9670; 2 essence` — which is Law 14 with nothing between the enum and the
 * scene. The nudge stage never had this problem because it bands everything it
 * shows; the legacy choice card was the half of the veil the THR-772/868 sweep
 * did not reach.
 *
 * **Why a table and not a derivation.** `supportRoleWord` derives, because
 * authoring keys are open-ended and a hand-written table would be stale the
 * first time an author adds a role. This union is the opposite shape: three
 * values, fixed in `EncounterInterventionChoice`, changed only by a type edit
 * that a reviewer sees. A derivation over three words would also read wrong —
 * `supportive` title-cased is still the engine's adjective for the god, not
 * something the god *does*. The table exists to change the part of speech.
 *
 * **Why verb phrases.** The row is read as the god's own move ("lend strength",
 * "◆ 2 essence"), and Law 42 permits second person for the god's own actions.
 * Naming the act rather than labelling the card keeps the meta row in the
 * register the rest of the veil speaks, and keeps `withdrawn`'s existing
 * `fate decides` rider reading as its consequence rather than a synonym.
 *
 * NFP #1: the words are the tunable data; nothing here computes.
 */

/** The stance triple, as `EncounterInterventionChoice.interventionType` declares it. */
export type InterventionStance = 'supportive' | 'coercive' | 'withdrawn';

/**
 * Stance → what the god does. Lower-case: the meta row renders it inline
 * beside the essence cost, not as a heading.
 */
const STANCE_WORDS: Readonly<Record<InterventionStance, string>> = {
  supportive: 'lend strength',
  coercive: 'press them',
  withdrawn: 'stand back',
};

/**
 * Law 14's "best plain-English fallback" for a stance this module does not
 * know. Neutral on purpose — it says the god acted without claiming which way,
 * which is the only honest thing to render for an unrecognised key.
 */
const UNKNOWN_STANCE_WORD = 'step in';

/** Stances already reported as unresolvable — Law 14's "warns once". */
const warned = new Set<string>();

/**
 * Plain-English label for an intervention stance.
 *
 * Returns `undefined` for an absent stance rather than a fallback word: a
 * choice with no stance is a card the producer chose not to tag (every
 * authored card takes this path), and the meta row renders nothing at all for
 * it. That is a designed empty, not a missing value — inventing "step in"
 * there would put a stance on cards that deliberately carry none.
 *
 * Fail-soft (NFP #4): a value outside the union warns once and returns the
 * neutral word. It never returns the key, and it never throws — a stance tag
 * is not worth taking the veil down for.
 */
export function interventionStanceWord(
  stance: string | undefined | null,
): string | undefined {
  if (stance == null || stance === '') return undefined;

  if (Object.prototype.hasOwnProperty.call(STANCE_WORDS, stance)) {
    return STANCE_WORDS[stance as InterventionStance];
  }

  if (!warned.has(stance)) {
    warned.add(stance);
    console.warn(
      `[interventionStanceWords] unresolvable intervention stance: ${JSON.stringify(stance)}`,
    );
  }
  return UNKNOWN_STANCE_WORD;
}

/** Test hook — clears the warn-once ledger so a suite can assert the warning. */
export function __resetInterventionStanceWarnings(): void {
  warned.clear();
}

/** Test hook — the exact word set, so a suite can pin the closed union. */
export function __interventionStanceWords(): Readonly<Record<InterventionStance, string>> {
  return STANCE_WORDS;
}
