/**
 * THR-1857 — verb agreement when the subject is a NAME, not a pronoun.
 *
 * `{s}` is pronoun agreement: it resolves to "s" for he/she and "" for they, so
 * "{They} work{s}" reads "They work" / "She works". The content corpus also writes
 * "{name} work{s}" (≈257 sites across the faction encounter files), where the subject
 * is a singular name — "Kael Thornweaver works" — whatever the bearer's pronouns. Left to
 * the pronoun rule, a they/them actor read "Kael Thornweaver work with the patient".
 *
 * `bindNameSubjectVerbs` runs BEFORE the name tokens are substituted (afterwards the
 * name is plain text and the subject can no longer be told apart): every `{s}` that
 * directly follows `<name token> <verb>` is bound to "s". Any other `{s}` is left for
 * the caller's pronoun pass.
 */

/** Tokens that resolve to a single named subject. */
export const NAME_SUBJECT_TOKENS = ['name', 'Name', 'actor', 'Actor', 'agent.name', 'name.first'] as const;

const NAME_TOKEN_ALT = NAME_SUBJECT_TOKENS.map(t => t.replace('.', '\\.')).join('|');

/**
 * Adverbs that may stand between a name subject and its verb ("{name} either join{s}").
 * Any other word there is not bound — the lint in `templateSeams.thr1857.test.ts` fails
 * on it, so a new adverb is added here rather than silently dropping the s.
 */
export const NAME_SUBJECT_ADVERBS = ['either', 'also', 'still', 'never', 'always', 'only', 'already', 'just', 'quietly', 'simply'] as const;

const ADVERB_ALT = NAME_SUBJECT_ADVERBS.join('|');

/** `<name token> [adverb] <verb>{s}`. */
export const NAME_SUBJECT_VERB_S = new RegExp(
  `(\\{(?:${NAME_TOKEN_ALT})\\}\\s+(?:(?:${ADVERB_ALT})\\s+)?[A-Za-z][A-Za-z'-]*)\\{s\\}`,
  'g',
);

/** Bind `{s}` after a name subject to "s"; leave pronoun-agreement `{s}` untouched. */
export function bindNameSubjectVerbs(text: string): string {
  if (!text.includes('{s}')) return text;
  return text.replace(NAME_SUBJECT_VERB_S, '$1s');
}

/**
 * Lint shape — `{pronoun.subject_capitalized} <verb>s` / `{pronoun.subject} <verb>s`:
 * a hard-coded third-person-singular verb after a pronoun token, which reads
 * "They wants" for a they/them bearer. Write `<verb>{s}` (or `<verb>{es}`) instead;
 * `resolveForeshadowingPlaceholders` resolves both from the bearer's pronoun.
 */
export const PRONOUN_SUBJECT_HARDCODED_S = /\{pronoun\.subject(?:_capitalized)?\}\s+([a-z]+s)\b/g;
