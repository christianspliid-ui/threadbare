/**
 * Group-eligibility predicate for existing encounter content (THR-74, PR 2).
 *
 * The plan specifies this as a **predicate, not a list**: "every existing
 * template in the ruins/delve, borderland-threat, and monster-combat families
 * whose steps are physical-challenge shaped (no intimate/1v1-social steps)
 * gains `'group'` in `actorAffinities`."
 *
 * Encoding it as a function rather than hand-editing ~40 template literals means
 * new content authored into those families is swept automatically, and the
 * resulting count is a measurement (`countGroupEligible`) rather than a number
 * that rots in a doc. The sweep runs once at module load over the assembled
 * registry in `unified-action-templates.ts`, so every consumer — decision phase,
 * CLI spawn, `__DEBUG.fireAction`, codex, prose cast context — sees one
 * consistent template object.
 *
 * Party-*exclusive* content is NOT produced here: those templates declare
 * `actorAffinities: ['group']` plus `minGroupMembers` at their authoring site,
 * because "only a company may take this" is an authored design claim, not a
 * property derivable from a template's shape.
 */

import type { ActionStep, ActionStepOrBranch, UnifiedActionTemplate } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';

/**
 * Every concrete step a template can reach, branches expanded.
 *
 * A branching step contributes all of its variants plus its fallback: the
 * predicate has to hold on every path the encounter could actually take, so an
 * intimate step hiding inside one branch still disqualifies the template.
 */
function flattenSteps(steps: readonly ActionStepOrBranch[] | undefined): ActionStep[] {
  if (!Array.isArray(steps)) return [];
  const out: ActionStep[] = [];
  for (const step of steps) {
    if (!step) continue;
    if (isActionStepBranch(step)) {
      out.push(...Object.values(step.variants ?? {}), step.fallback);
    } else {
      out.push(step);
    }
  }
  return out.filter(Boolean);
}

/**
 * Families a company can plausibly walk into together. Scoped by id prefix
 * because the family *is* the id namespace in this codebase: `encounter.*`
 * (ruins/delve + location archetypes, `encounter-content.ts`), `borderland.*`
 * (borderland-threat, `borderland-encounter-content.ts`), and `monster.*`
 * (monster-combat, `monster-encounter-content.ts`).
 *
 * Deliberately excludes guild/social/tavern/faction namespaces: those are
 * membership- and conversation-shaped, and a company arriving en masse would
 * read as an intrusion rather than a party.
 */
export const GROUP_ELIGIBLE_FAMILY_PREFIXES = [
  'encounter.',
  'borderland.',
  'monster.',
] as const;

/**
 * Reaches whose steps are physical challenges — hauling, forcing, enduring,
 * building. These are the problems more hands genuinely solve, so a template
 * needs at least one of them to be worth bringing a company to.
 *
 * Deliberately narrow. `shadow` and `eye` are excluded as *qualifying* reaches
 * even though they appear all over expedition content: a shadow-dominant or
 * eye-dominant template is a stealth job or a study, both of which get harder
 * with more people, not easier. They are permitted as supporting steps — a delve
 * that scouts (`eye`) and then forces a door (`iron`) still qualifies on the
 * `iron` step.
 */
export const PHYSICAL_CHALLENGE_REACHES: readonly ReachDomain[] = ['iron', 'stone'];

/**
 * Reaches that disqualify a template outright, each for its own reason:
 *
 * - `heart` — the Sworn↔Renegade axis: oaths, confessions, private reckonings.
 *   A two-person moment by construction. Substituting "whichever companion has
 *   the best Heart" into someone else's confession is exactly the substitution
 *   the plan rules out.
 * - `gold` — commerce, patronage, influence. A negotiation is a table with named
 *   seats; a company arriving en masse changes the scene rather than helping it.
 *   This is what keeps `merchants_gambit`, `pickpocket` and `the_fence` out.
 * - `star` — individual renown and spectacle. Arena bouts and tournaments are
 *   won by *a* champion; a company cannot share the honour that is the point.
 *
 * A single step on any of these axes disqualifies the whole template, because
 * the company would have to sit that step out — and a step the party cannot
 * attend is a step the party should not have been brought to.
 */
export const COMPANY_EXCLUDED_REACHES: readonly ReachDomain[] = ['heart', 'gold', 'star'];

/** Minimum authored steps. A single-step beat is a moment, not an expedition. */
export const GROUP_ELIGIBLE_MIN_STEPS = 2;

/** Does this template's id sit in one of the swept families? */
export function isGroupEligibleFamily(templateId: string): boolean {
  return GROUP_ELIGIBLE_FAMILY_PREFIXES.some(prefix => templateId.startsWith(prefix));
}

/**
 * The predicate itself. True → this template should carry `'group'`.
 *
 * Fail-soft: any malformed template (missing steps, absent affinities) simply
 * returns false and keeps its authored affinities. A content bug must never
 * throw inside a module-load `.map()` — that would take down the whole registry.
 * Every *shipped* template now declares `actorAffinities` (THR-736, locked by a
 * registry invariant test), so this guard defends against future content only.
 */
export function isGroupEligibleTemplate(template: UnifiedActionTemplate): boolean {
  if (!template || typeof template.id !== 'string') return false;
  if (!isGroupEligibleFamily(template.id)) return false;

  // Already authored as group-capable (party-exclusive content) — nothing to add.
  const affinities = template.actorAffinities ?? [];
  if (affinities.includes('group')) return false;

  // Only individual-actor content is swept; faction/location/army templates keep
  // their own targeting semantics.
  if (!affinities.includes('individual')) return false;

  const steps = flattenSteps(template.steps);
  if (steps.length < GROUP_ELIGIBLE_MIN_STEPS) return false;

  const reaches = steps.map(s => s.reach).filter(Boolean) as ReachDomain[];
  if (reaches.length === 0) return false;

  // A single step the company could not attend disqualifies the template.
  if (reaches.some(r => COMPANY_EXCLUDED_REACHES.includes(r))) return false;

  // ...and at least one step has to be the kind of problem a company solves.
  return reaches.some(r => PHYSICAL_CHALLENGE_REACHES.includes(r));
}

/**
 * Return the template with `'group'` appended to `actorAffinities` when the
 * predicate holds, otherwise the identical object reference.
 *
 * Additive (NFP #6): the authored affinity list is preserved and extended, never
 * replaced, so a template stays available to the solo agents that could always
 * take it.
 */
export function withGroupAffinity(template: UnifiedActionTemplate): UnifiedActionTemplate {
  if (!isGroupEligibleTemplate(template)) return template;
  return { ...template, actorAffinities: [...template.actorAffinities, 'group'] };
}

/**
 * Count how many templates in a registry the predicate promotes. Used to produce
 * the closeout evidence the plan asks for, and by the contract test that locks
 * the sweep against silently collapsing to zero.
 */
export function countGroupEligible(templates: readonly UnifiedActionTemplate[]): number {
  return templates.reduce((n, t) => n + (isGroupEligibleTemplate(t) ? 1 : 0), 0);
}
