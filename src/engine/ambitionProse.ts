/**
 * Ambition prose pronouns (THR-1779).
 *
 * Ambition prose (`src/data/ambition-templates.ts`) is narrated about the mortal who
 * holds the ambition, and it used to hardcode she/he line by line — so one ambition
 * said "her mouth" and then "He would…" about the same man. The templates now author
 * pronoun tokens, and this resolver fills them for the actor the line is about.
 *
 * Tokens: `{they}` `{They}` `{them}` `{their}` `{Their}` `{theirs}` `{themselves}`,
 * plus two agreement tokens for a present-tense verb after the subject pronoun:
 * `{s}` ("read{s}" → "reads" / "read") and `{is}` ("is" / "are").
 *
 * Deliberately not `enrichProse`: these lines are event messages emitted inside the
 * tick, and a full `gatherNarrativeContext` per message is a graph walk for five
 * words. Same token names as `enrichProse`, so the authoring vocabulary is one.
 *
 * Determinism: pure. Fail-soft: an unknown gender reads they/them; a missing actor
 * reads they/them; text without tokens returns unchanged.
 */

import type { WorldGraph } from './graph';

interface AmbitionPronouns {
  readonly they: string;
  readonly them: string;
  readonly their: string;
  readonly theirs: string;
  readonly themselves: string;
  /** Present-tense verb suffix after the subject pronoun. */
  readonly s: string;
  /** Copula after the subject pronoun. */
  readonly is: string;
}

/** The default — a mortal whose gender the graph does not record reads they/them. */
export const AMBITION_DEFAULT_PRONOUNS: AmbitionPronouns = {
  they: 'they', them: 'them', their: 'their', theirs: 'theirs', themselves: 'themselves', s: '', is: 'are',
};

const MALE_PRONOUNS: AmbitionPronouns = {
  they: 'he', them: 'him', their: 'his', theirs: 'his', themselves: 'himself', s: 's', is: 'is',
};

const FEMALE_PRONOUNS: AmbitionPronouns = {
  they: 'she', them: 'her', their: 'her', theirs: 'hers', themselves: 'herself', s: 's', is: 'is',
};

/** Pronoun set for a gender property value (`male`/`m`, `female`/`f`, else they/them). */
export function ambitionPronounsFor(gender: unknown): AmbitionPronouns {
  switch (typeof gender === 'string' ? gender.toLowerCase() : '') {
    case 'male':
    case 'm':
      return MALE_PRONOUNS;
    case 'female':
    case 'f':
      return FEMALE_PRONOUNS;
    default:
      return AMBITION_DEFAULT_PRONOUNS;
  }
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Fill the pronoun tokens in one line of ambition prose for a pronoun set. */
export function resolveAmbitionPronouns(text: string, pronouns: AmbitionPronouns): string {
  if (!text.includes('{')) return text;
  return text
    .replace(/\{themselves\}/g, pronouns.themselves)
    .replace(/\{theirs\}/g, pronouns.theirs)
    .replace(/\{their\}/g, pronouns.their)
    .replace(/\{Their\}/g, capitalize(pronouns.their))
    .replace(/\{them\}/g, pronouns.them)
    .replace(/\{they\}/g, pronouns.they)
    .replace(/\{They\}/g, capitalize(pronouns.they))
    .replace(/\{is\}/g, pronouns.is)
    .replace(/\{s\}/g, pronouns.s);
}

/** Fill the pronoun tokens for the actor the line is about, read from the graph. */
export function resolveAmbitionProseFor(text: string, graph: WorldGraph, actorId: string): string {
  return resolveAmbitionPronouns(text, ambitionPronounsFor(graph.getNode(actorId)?.properties?.gender));
}
