# Brainstorm companion — A finished work says what was done (THR-2075)

Companion to `Docs/plans/2026-11-08-thr-2075-a-finished-work-says-what-was-done.md`. Authored by the design
lane (run dl-20261107T2318Z) under the bug clause of the ways-of-working mandate.

## Vision premises engaged

- **The god watches real lives.** A card that says a relic "stands in the world" after a mortal picked it up
  tells the god a false story about their own followers.
- **UI Laws 17, 21 and 56.** The words say what happened, backed by the write that happened.

## Alternatives considered

| Option | Why not taken |
|---|---|
| A verb-keyed consequence table on the card (`MOMENT_CARD_CONTENT.completion` by verb) | Duplicates the 30+ completion lines `undertaking-verb-prose.ts` already resolves per cell, and would drift from them. The orchestrator's staging note preferred reading what exists |
| Replace the opening line too (*"has completed The Hollow Bell"*) | The opening is clumsy for a taken-up relic but not false. Kael did finish the work. Out of the ticket's Done-when |
| Write a `cellVariant` field onto the moment record | Needs an engine write and a type change. The template lookup is pure. Kept as the kill-criteria fallback if the import cycles |
| Use the cell line for `create` too | The ticket says `create` stays unchanged. The generic line is true there and reads as a payoff |
| Drop the consequence line when it is not a create | Leaves the card's second line blank and loses the one sentence that says what was done |

## Tensions

- The opening and consequence now both name the mortal (*"Kael has completed The Hollow Bell. Kael takes up The
  Hollow Bell…"*). It repeats, but it is true. Rewording the opening per verb is a possible later polish, not
  filed.
- `change:raise` (bettering one's own thing) was arguably fine under "It stands in the world now". It goes to
  its own line anyway: *"{Object} is more than it was"* is the more exact sentence, and one rule (only `create`
  keeps the generic line) is easier to keep true than a list.
