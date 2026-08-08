/**
 * THR-1041 — plain English for a support bundle's `supportRole`, for the one
 * surface that now renders it.
 *
 * A bundle spec's `supportRole` is an authoring key: `checkpoint_captain`,
 * `mct_ledger_clerk`, `person_in_danger`. It was never player-facing, because
 * the cast model that carries it was built and never rendered. Mounting the
 * cast strip made it player-facing, and Law 14 is unambiguous — no raw internal
 * keys, ever, and a key the vocabulary cannot resolve renders as its best
 * plain-English fallback and warns once, never as the key.
 *
 * **Why a derivation rather than a 54-entry table.** These keys are already
 * English words joined by underscores, sometimes behind a faction abbreviation
 * (`mct_` = the Mercantile Concord's templates, `hod_` = the Hand of Dawn's).
 * A hand-written table of every value would be correct on the day it shipped
 * and stale the first time an author adds a role — and authors add roles far
 * faster than anyone would maintain the table, which is how a vocabulary
 * quietly degrades back into printing keys. The derivation covers every present
 * and future key by construction; `ROLE_OVERRIDES` carries only the handful the
 * general rule words badly.
 *
 * NFP #1: the prefix set and the override table are the tunable data; the
 * transformation itself has no magic strings.
 */

/**
 * Faction-template prefixes that namespace a role key. They identify the
 * *template family* an author was writing in, not anything the player needs —
 * the faction reaches the player through the cast member's own affiliation, not
 * through a two-letter tag on their job.
 *
 * Matched only when followed by more key: `rb_warden` loses its prefix, a
 * hypothetical bare `rb` would not.
 */
const FACTION_KEY_PREFIXES: readonly string[] = [
  'ac_', 'bf_', 'cg_', 'hod_', 'lk_', 'mct_', 'rb_', 'tg_', 'ts_', 'uk_',
];

/**
 * Roles whose derived form reads wrong. Keep this small and justify each entry
 * — a growing override table is the signal that the derivation rule itself is
 * wrong, not that it needs more exceptions.
 */
const ROLE_OVERRIDES: Readonly<Record<string, string>> = {
  // "Person in danger" is a stage direction, not how anyone would name someone
  // standing in a scene.
  person_in_danger: 'In danger',
  // The derivation would yield "Challenged duelist", which reads as a verb
  // phrase about the duelist rather than their standing in the scene.
  challenged_duelist: 'The challenged',
  // Both of these name a function within the encounter's social shape, and the
  // bare noun is what a player would call them.
  social_bridge: 'Go-between',
  social_onlooker: 'Onlooker',
};

/** Lower-cased words that stay lower-cased inside a multi-word role. */
const MINOR_WORDS: ReadonlySet<string> = new Set(['in', 'of', 'the', 'at', 'on']);

/** Roles already reported as unresolvable — Law 14's "warns once". */
const warned = new Set<string>();

/**
 * Plain-English label for a support role key.
 *
 * Fail-soft (NFP #4): an empty or non-string key returns a neutral standing
 * rather than throwing or rendering blank — a cast chip with no role line is
 * better than a cast chip that crashed the veil.
 */
export function supportRoleWord(supportRole: string | undefined): string {
  if (!supportRole || typeof supportRole !== 'string') {
    if (supportRole !== undefined && !warned.has(String(supportRole))) {
      warned.add(String(supportRole));
      console.warn(`[supportRoleWords] unresolvable support role: ${JSON.stringify(supportRole)}`);
    }
    return 'In the scene';
  }

  const override = ROLE_OVERRIDES[supportRole];
  if (override) return override;

  let key = supportRole;
  for (const prefix of FACTION_KEY_PREFIXES) {
    if (key.startsWith(prefix) && key.length > prefix.length) {
      key = key.slice(prefix.length);
      break;
    }
  }

  const words = key.split('_').filter(Boolean);
  if (words.length === 0) {
    if (!warned.has(supportRole)) {
      warned.add(supportRole);
      console.warn(`[supportRoleWords] unresolvable support role: ${JSON.stringify(supportRole)}`);
    }
    return 'In the scene';
  }

  return words
    .map((word, index) =>
      index > 0 && MINOR_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

/** Test hook — clears the warn-once ledger so a suite can assert the warning. */
export function __resetSupportRoleWarnings(): void {
  warned.clear();
}
