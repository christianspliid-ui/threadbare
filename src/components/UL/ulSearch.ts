/**
 * Search ranking for the UL dashboard. Pure functions, fully unit-testable.
 *
 * Ranking order, highest to lowest:
 *   1. Exact name match
 *   2. Name prefix
 *   3. Substring of name
 *   4. Substring of any alias
 *   5. Substring of one-liner
 *   6. Substring of body
 *
 * All comparisons are case-insensitive. The function returns terms in ranked
 * order; ties keep the input order (stable sort).
 */

import type { ULTerm } from './ulDashboardData';

export type SearchRank =
  | 'name_exact'
  | 'name_prefix'
  | 'name_substring'
  | 'alias_substring'
  | 'one_liner_substring'
  | 'body_substring'
  | 'no_match';

const RANK_ORDER: Record<SearchRank, number> = {
  name_exact: 0,
  name_prefix: 1,
  name_substring: 2,
  alias_substring: 3,
  one_liner_substring: 4,
  body_substring: 5,
  no_match: 99,
};

export function rankTerm(term: ULTerm, query: string): SearchRank {
  if (!query) return 'no_match';
  const q = query.toLowerCase();
  const name = term.name.toLowerCase();
  if (name === q) return 'name_exact';
  if (name.startsWith(q)) return 'name_prefix';
  if (name.includes(q)) return 'name_substring';
  for (const alias of term.aliases) {
    if (alias.toLowerCase().includes(q)) return 'alias_substring';
  }
  if (term.oneLiner.toLowerCase().includes(q)) return 'one_liner_substring';
  if (term.body.toLowerCase().includes(q)) return 'body_substring';
  return 'no_match';
}

export function searchTerms(terms: readonly ULTerm[], query: string): ULTerm[] {
  if (!query.trim()) return [...terms];
  const ranked: { term: ULTerm; rank: SearchRank; index: number }[] = [];
  terms.forEach((term, index) => {
    const rank = rankTerm(term, query);
    if (rank !== 'no_match') ranked.push({ term, rank, index });
  });
  ranked.sort((a, b) => {
    const diff = RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
    return diff !== 0 ? diff : a.index - b.index;
  });
  return ranked.map((r) => r.term);
}
