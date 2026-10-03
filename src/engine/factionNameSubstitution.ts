/**
 * Article-aware `{faction}` substitution (THR-1708).
 *
 * Faction names may carry their own leading article ("The Builders Fellowship"),
 * and templates routinely supply one too ("The {faction} intelligence is
 * thorough."). A raw substitution produced "The The Builders Fellowship" in
 * player-facing text — a cold-playtest tester quoted it back.
 *
 * Rule: when the template writes an article immediately before `{faction}` and
 * the substituted name already starts with one, the template's article wins
 * (it carries the sentence's capitalisation) and the name's own is dropped.
 * A bare `{faction}` keeps the name exactly as written, and a substitution that
 * lands at the very start of the text is capitalised so a lowercase fallback
 * ("the faction") never opens a sentence in lowercase.
 */

/** Matches a leading definite article on a name: "The X" / "the X". */
const LEADING_ARTICLE = /^the\s+/i;

/** Template article directly before the token: "The {faction}" / "the {faction}". */
const ARTICLE_BEFORE_TOKEN = /\b([Tt]he) \{faction\}/g;

const BARE_TOKEN = /\{faction\}/g;

export function substituteFactionName(text: string, factionName: string): string {
  const withoutArticle = factionName.replace(LEADING_ARTICLE, '');
  const out = text
    .replace(ARTICLE_BEFORE_TOKEN, (_m, article: string) => `${article} ${withoutArticle}`)
    .replace(BARE_TOKEN, factionName);
  // A sentence-initial bare token with a lowercase fallback name.
  if (text.startsWith('{faction}') && out.length > 0) {
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}
