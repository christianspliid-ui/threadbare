/**
 * Resolve a clicked encounter choice back to the card that was rendered (THR-989).
 *
 * THR-989 added an authored-hand lookup here: the stage rendered
 * `template.authoredChoices[currentStep]`, whose ids never appeared in
 * `notification.choices`, so a click recorded nothing. THR-2161 retired
 * `authoredChoices` (the player must never pick an ending — the mortal decides
 * through `ActionStepBranch.decidedBy`), so the only producer left is the
 * notification's own choice set, and this is a plain lookup again.
 *
 * Kept as a named seam rather than inlined so `handleEncounterIntervene` reads
 * the same way it did, and so a future second producer has one place to land.
 *
 * Returns `undefined` when the id matches nothing, which stays a no-op.
 */

import type { EncounterInterventionChoice } from '../../../types/encounterVisibility';

export function resolveInterveneChoice(
  notificationChoices: readonly EncounterInterventionChoice[],
  choiceId: string,
): EncounterInterventionChoice | undefined {
  return notificationChoices.find((choice) => choice.id === choiceId);
}
