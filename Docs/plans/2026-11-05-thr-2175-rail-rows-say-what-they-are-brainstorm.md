> **title:** Brainstorm companion — the rail rows say what they are (THR-2175, slice 1)
> **linear_issue:** THR-2175
> **created:** 2026-11-05

# Brainstorm companion — the rail rows say what they are

Companion to `Docs/plans/2026-11-05-thr-2175-rail-rows-say-what-they-are.md`.

## The tension

Six recurrences of "the player cannot read the words" have each been answered with a hover or a first-use caption. Both are on-demand: the player has to suspect a question before the answer appears. Warm testers arrive mid-game with everything already revealed, so captions do not come one at a time, and nothing prompts a hover. The question for this slice is which **always-visible** words can carry the meaning without crowding the rail that [THR-2177](https://linear.app/threadbare/issue/THR-2177) just made room in.

## Options considered

| Option | For | Against | Taken? |
|---|---|---|---|
| Plain-word summaries on the collapsed rows | Visible without a hover; same width as today; the standard settings-panel pattern | 24-character cap; long reach names may ellipsize | Yes |
| Definition line at the top of an opened row | Helper-text pattern; no new hover target; one source with the hover | Costs one line inside the open row's own scroll box | Yes |
| Rename Hooks / Signatures / Mandate to plainer words | Would remove the jargon outright | Canon and UL words used across Codex, Inspector and content; a rename is a UL proposal of its own and a far wider change | No |
| A "?" glyph beside each row | Familiar | Icon carrying meaning alone (Law 11); a second hover target on a 24 px row | No |
| Open every folded row by default | Everything visible | Takes the hand's room back from THR-2177 | No |
| Re-arm first-use captions on warm arrival | Reuses the teaching already written | Needs the arrival card from THR-2173, not yet designed; captions on arrival would also all fire at once | Deferred to THR-2173 |
| Hooks summary "N threads to pull" | Matches the hover's "thread you can still pull" | "Threads" is the god's bond to a mortal (UL); a third meaning of a core word | No — "N unfinished" |
| Hooks summary "N ways rivals can reach you" (the ticket's suggestion) | — | Wrong: hooks are marks, clues and vows tying the god to unfinished things (`ui.hooks`), and "reach" collides with Reach | No |
| Show Doom counters as "No counter-omens yet" | Teaches that they exist | Adds a line that is news to nobody; the panel already hides its other zero modifier | No — kept as the kill-criterion fallback |

## Vision premises

- Prose-first UI: words before numbers; no number is added.
- The map is the table: the rail does not grow and no row opens on its own.
- One word, one meaning (Law 21; UL governs): "Reach" stays what you do, "Dominion" stays how much a place is yours.

## Why not a UL rename of "Reach"

The ticket asked for a `UL-proposal` on the two meanings. Measuring showed the UL already has one meaning per word. The second reading comes from an unnamed caption placed under the Reaches row. So the proposal records a display rule (never use "Reach" for the god's hold on a place) instead of a rename.
