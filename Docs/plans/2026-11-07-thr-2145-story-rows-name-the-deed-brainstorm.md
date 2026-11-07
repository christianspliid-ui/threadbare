# Brainstorm companion — Story rows name the deed, not its key (THR-2145)

Companion to `Docs/plans/2026-11-07-thr-2145-story-rows-name-the-deed.md`. Authored by the design lane
(run dl-20261107T0819Z) under the bug clause of the ways-of-working mandate.

## Vision premises engaged

- **The world remembers what was done.** The Story list is that memory on a mortal's sheet. A raw key
  there reads as the machine leaking through, the opposite of a remembered life.
- **UI Law 14** — no raw internal keys on a player surface; an unresolvable key falls back to plain words
  and warns once.

## Alternatives considered

| Option | Why not taken |
|---|---|
| Guard in `refFor`: detect a dotted/underscored name and substitute | Fixes one reader of four; hides the next minter that makes the mistake; heuristic on string shape |
| Name the row by the harm: "Sealed", "Razed" (from `UNDERTAKING_CELL_DEEDS`) | Reads well for the victim, but the culprit's Story list holds the same node; "Sealed" with no object is vaguer than the card phrase, and encounter rows already use the template's name — one convention beats two |
| Name the row with deed + object ("Sealed the Ember Rite") | Best prose, but needs the target node's name at mint time and a per-verb grammar; a larger slice than the bug. Recorded here as a possible later polish, not filed |
| Add `templateName` only, keep the raw `name` | Leaves `name` raw for any reader that does not prefer `templateName` (record page fallbacks, debug-to-player leaks) |

## Tensions

- The card phrase is imperative ("Destroy a power") while the Story row records a past event. Encounter
  rows have the same tension today ("Copy the Scriptures") and no tester has flagged it; matching them
  keeps the list in one voice. If the past-tense question comes up, it is a whole-list change, not this
  bug's.
- The fallback names should never show for undertakings. They exist so a future template the registries
  miss shows words, not a key, and the warn tells the next session which id.

## What would change the call

A playtest finding that Story rows should read as past events would move every row (encounters included)
to deed phrasing — a separate ticket across both minters.
