/**
 * On-Use Trigger Resolution.
 *
 * When an encounter resolves and an attachment's tags overlap,
 * each on-use trigger is checked for activation.
 *
 * Pure function. Does not mutate graph — returns effects for the caller to apply.
 */

import type { OnUseTrigger, OnUseTriggerEffect, TriggerCondition } from '../types/attachments';

export interface TriggerContext {
  actor: string;
  itemName: string;
  /** Deterministic roll from PRNG (0.0–1.0) */
  roll: number;
  target?: string;
  location?: string;
}

export interface FiredTrigger {
  fired: true;
  trigger: OnUseTrigger;
  effect: OnUseTriggerEffect;
  narrativeText: string;
}

function conditionMatches(
  triggerCondition: TriggerCondition,
  encounterOutcome: string,
): boolean {
  if (triggerCondition === 'any_use') return true;
  return triggerCondition === encounterOutcome;
}

function substituteTemplate(template: string, context: TriggerContext): string {
  return template
    .replace(/\{actor\}/g, context.actor)
    .replace(/\{item_name\}/g, context.itemName)
    .replace(/\{target\}/g, context.target ?? '')
    .replace(/\{location\}/g, context.location ?? '');
}

/**
 * Resolve all on-use triggers for a given encounter outcome.
 *
 * Returns only the triggers that actually fired (condition matched AND roll < probability).
 * The caller is responsible for applying the effects to the graph.
 */
export function resolveOnUseTriggers(
  triggers: OnUseTrigger[],
  encounterOutcome: string,
  context: TriggerContext,
): FiredTrigger[] {
  const fired: FiredTrigger[] = [];

  for (const trigger of triggers) {
    if (!conditionMatches(trigger.triggerCondition, encounterOutcome)) continue;
    if (context.roll >= trigger.probability) continue;

    fired.push({
      fired: true,
      trigger,
      effect: trigger.effect,
      narrativeText: substituteTemplate(trigger.narrativeTemplate, context),
    });
  }

  return fired;
}
