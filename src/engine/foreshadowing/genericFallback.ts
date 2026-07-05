/**
 * Generic foreshadowing fallback templates (THR-389).
 *
 * GLOBAL_FORESHADOWING_FALLBACK_TEMPLATE — used by encounterForeshadowing.ts
 * with the old {name}/{encounter_location}/{They}/{they} placeholder syntax.
 *
 * GENERIC_FORESHADOWING_FALLBACK — used by getEncounterForeshadowing.ts
 * with the newer {name.first}/{encounter.heading}/{pronoun.*} syntax resolved
 * by resolveForeshadowingPlaceholders().
 *
 * Both are intentionally bland — their job is to be unobjectionable while
 * encounter-specific variants are backfilled by content passes.
 */

/**
 * @deprecated THR-631 — the resolvers no longer use this single-string fallback;
 * the composed-generic path (`composeGeneric.ts`) replaced it because this string
 * breaks subject–verb agreement ("{He} believe"). Retained only until the
 * two-resolver unification (THR-631 remaining Phase A) removes the last references.
 */
export const GLOBAL_FORESHADOWING_FALLBACK_TEMPLATE =
  '{name} has heard of trouble in {encounter_location}. {They} believe {they} can be useful there, though {they} cannot yet say how.';

/**
 * Placeholder syntax resolved by resolveForeshadowingPlaceholders:
 *   {name.first}                  → agent's first name
 *   {encounter.heading}           → encounter template name / heading
 *   {pronoun.subject}             → they/he/she
 *   {pronoun.subject_capitalized} → They/He/She
 */
/**
 * @deprecated THR-631 — replaced by the composed-generic path (`composeGeneric.ts`).
 * This string jams the encounter *heading* into a place slot ("trouble in Weave a
 * Political Alliance") and breaks agreement ("They believes"). Kept only for the
 * existing token-shape test until the two-resolver unification removes it.
 */
export const GENERIC_FORESHADOWING_FALLBACK =
  '{name.first} has heard of trouble in {encounter.heading}. ' +
  '{pronoun.subject_capitalized} believes {pronoun.subject} can be useful there, ' +
  'though {pronoun.subject} cannot yet say how.';

/**
 * Resolve foreshadowing-specific placeholders in a template string.
 * These are NOT standard enrichProse placeholders — they are resolved here
 * before the result is returned as final prose.
 */
export function resolveForeshadowingPlaceholders(
  template: string,
  agentName: string,
  encounterHeading: string,
  pronounSubject: string,
): string {
  const firstName = agentName.split(' ')[0] ?? agentName;
  const capitalized = pronounSubject.charAt(0).toUpperCase() + pronounSubject.slice(1);

  return template
    .replace(/\{name\.first\}/g, firstName)
    .replace(/\{encounter\.heading\}/g, encounterHeading)
    .replace(/\{pronoun\.subject_capitalized\}/g, capitalized)
    .replace(/\{pronoun\.subject\}/g, pronounSubject);
}
