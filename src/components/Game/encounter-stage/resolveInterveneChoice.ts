/**
 * Resolve a clicked encounter choice back to the card that was rendered (THR-989).
 *
 * ## The bug this closes
 *
 * `EncounterVeil` commits with `onIntervene(choice.id, …)` where `choice` came
 * from the stage model, and `buildChoices` builds that model from
 * `template.authoredChoices[currentStep]` whenever the step carries an authored
 * hand — ids like `steady_their_nerve`. But `handleEncounterIntervene` looked the
 * id up in `notification.choices`, which `generateInterventionChoices` builds as
 * a fixed generic triple (`intervene_support` / `intervene_force` /
 * `intervene_withdraw`) that can never contain an authored id. The lookup missed,
 * the handler returned early, and **nothing was recorded** — no essence spent, no
 * `EncounterChoiceMemory` written.
 *
 * The stage closed anyway (`handleEncounterCommitAndContinue` continues
 * regardless), so it read as a working screen. Downstream,
 * `resolveAftermathVariant` found no choice at `aftermathConfig.branchOnStep` and
 * returned `fallback` on every resolution — which is the symptom THR-989 was
 * filed against, one layer away from its cause.
 *
 * Measured over the catalog at the time of the fix: **30 of the 34 templates
 * carrying aftermath variants key those variants to `authoredChoices` ids**, so
 * every authored ending on all 30 was unreachable. `UnifiedActionTemplate.authoredChoices`
 * documents the contract this restores — *"the choice `id` must match the
 * `ActionStepBranch` variant key so the branch resolution picks up the player's
 * choice correctly"*.
 *
 * ## Why a lookup rather than a merge
 *
 * The two sets are built by different producers for different tiers and only one
 * is ever rendered — `buildChoices` uses the authored hand when the step has one
 * and the generic set otherwise. Mirroring that precedence here keeps a single
 * source of truth for which card the player actually saw; merging would invent a
 * combined hand that no surface renders.
 */

import type {
  AuthoredChoiceCard,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { EncounterInterventionChoice } from '../../../types/encounterVisibility';

/**
 * Convert an authored card to the intervention shape the recorders consume.
 *
 * `probabilityBoost` is **0** (THR-1121). It used to be
 * `BOOST_TO_PROBABILITY_RATIO * card.essenceCost`, mirroring the generic path so
 * that a paid authored choice bought exactly the odds a generic one of that cost
 * bought. Both halves of that trade are now retired: the generic triple is gone
 * (`generateInterventionChoices` returns `[]`) and resolution no longer reads the
 * field at all, because selling odds is the pre-nudge pattern the Nudge Model
 * pivot rejected (THR-773/WS0). Writing a live-looking number into choice memory
 * that nothing applies would be worse than a zero — it reads as a working
 * mechanic to the next person who greps for it.
 *
 * The card's `essenceCost` is still charged and its `id` is still what
 * `resolveAftermathVariant` branches authored endings on, so an authored choice
 * keeps costing something and keeps deciding which ending is reached.
 *
 * `godVoice` is deliberately absent: an authored card carries `intent`, a full
 * prose paragraph the stage already renders, and synthesising a second voice
 * line here would ship prose no author wrote.
 */
function toInterventionChoice(card: AuthoredChoiceCard): EncounterInterventionChoice {
  return {
    id: card.id,
    text: card.label,
    essenceCost: card.essenceCost,
    probabilityBoost: 0,
    interventionType: card.interventionType,
  };
}

/**
 * Find the choice a clicked id refers to, across both producers.
 *
 * Precedence mirrors {@link buildChoices}: the authored hand for the step the
 * player is on, then the generic notification set. `currentStep` may be
 * `undefined` when no action snapshot is in scope — the authored hand is then
 * searched across every step rather than refused, because the id came from a card
 * the surface rendered and dropping it is the exact failure being fixed (NFP #4).
 *
 * Returns `undefined` only when the id matches nothing, which stays a no-op.
 */
export function resolveInterveneChoice(
  template: Pick<UnifiedActionTemplate, 'authoredChoices'> | undefined,
  currentStep: number | undefined,
  notificationChoices: readonly EncounterInterventionChoice[],
  choiceId: string,
): EncounterInterventionChoice | undefined {
  const authored = template?.authoredChoices;

  if (authored) {
    const forStep = currentStep === undefined ? undefined : authored[currentStep];
    const onStep = forStep?.find((card) => card.id === choiceId);
    if (onStep) return toInterventionChoice(onStep);

    // Fail-soft sweep: the rendered hand is authoritative about what was
    // clickable, and a step index we could not read must not silently discard it.
    for (const cards of Object.values(authored)) {
      const match = cards.find((card) => card.id === choiceId);
      if (match) return toInterventionChoice(match);
    }
  }

  return notificationChoices.find((choice) => choice.id === choiceId);
}
