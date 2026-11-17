# Brainstorm companion — A Story row says when the deed was done to the subject (THR-2191)

Companion to `Docs/plans/2026-11-17-thr-2191-story-rows-say-whose-deed.md`. Authored by the design lane (run
dl-20261117T1719Z) under the UI legibility period focus (2026-11-01 to 2026-11-29). The ticket's Done-when is a plan
doc naming the role words, which rows get one, and where the word sits.

## Vision premises engaged

- **The god reads mortals' lives from the table.** The Story list is the record of a life; it must tell deeds from
  things suffered.
- **UI Law 55, story continuity,** and the text-position decision of the UI legibility map (a row's secondary word
  follows its name).

## Alternatives considered

| Option | Why not taken |
|---|---|
| Mark every row ("by them" / "done to them") | 96% of rows are own deeds (seed 42, tick 300: 3,277 of 3,407 edges); a word on each adds a skip-word to almost every line to set off a few |
| A verb per chapter template ("was pardoned", "lost a power") | A content table over hundreds of chapters, kept in step with each new one; the edge role already exists for every writer |
| "against them" for targets | Calls a healing or a mentoring an attack; "done to them" is true for both |
| Put the role word before the name ("Done to them: Destroy a power") | A label bolted before a link (Law 16), and it breaks the one left edge where names start (text positions rule 2) |
| An icon for "done to them" | No carved icon class exists for it; icon picks are reserved for Christian (THR-1908) |
| Fold own and done-to runs together, word the mix ("twice, once done to them") | One row mixing two meanings; a longer fact; two rows read faster |
| Outcome words (won / lost) on the same rows | A different question (outcome, not role); out of scope, named in the plan |

## Tensions

- Unmarked-means-own relies on a convention. If a tester still reads a target row as the mortal's own deed, the
  fallback is to move the word before the name; the plan names that as the call-changer.
- `winner` / `loser` on a realm's past war stay unmarked, so a realm's Story says nothing about who won. That is
  the outcome question the plan puts out of scope, not an oversight.
- "Them" for a relic's Story reads slightly loosely (a relic is "it"). Relic Story rows with a `target` role were not
  seen in the census (artifacts had no `participated_in` edges at tick 300), so the case is kept simple.
