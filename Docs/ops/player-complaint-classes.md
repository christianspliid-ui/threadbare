# Player complaint classes — what new players keep failing to read

**Owner:** the `cold-playtest` skill (§ 8b updates it when a round closes).
**Reader:** the `intent-judge` skill, dimension 12 (*Player legibility*), on every plan with a UI pillar.
**Created:** 2026-10-05 for THR-1743, seeded from cold playtest rounds 1 (2026-09-25) and 2 (2026-10-03). **Updated:** 2026-10-08 from warm playtest round 1 ("warm r1", THR-1744).

## Why this file exists

Cold playtests play the deployed build and find what only a running game shows. That makes them the ground truth, but they only run after a feature has shipped. This list carries their lessons *forward* to plan time. A plan that adds a surface touching one of these classes has to say, in the player's own words, how the player will understand it. Otherwise the intent judge scores a GAP.

A **class** is a recurring *kind* of failure, not one ticket. A ticket is evidence that the class is live. A class retires only when a round confirms it fixed (see § Lifecycle).

## Open classes

| ID | Class | What a tester hits | Evidence (rounds) | What a plan touching it must say |
|---|---|---|---|---|
| **PC-1** | **Unexplained resources, terms and odds** | A number, label or tier with no way to learn what it means: essence, card stars, "fated / doomed / held", "was Perilous", Owing / Sealed, the Reaches. Almost nothing has a tooltip. | [THR-1607](https://linear.app/threadbare/issue/THR-1607) (r1) → **recurred** as [THR-1713](https://linear.app/threadbare/issue/THR-1713) (r2), 3/3 testers both rounds → **recurring again** in warm r1 (3/3): [THR-1784](https://linear.app/threadbare/issue/THR-1784) (world-standing rows, ▲ scale, three odds words on one step), [THR-1783](https://linear.app/threadbare/issue/THR-1783) item 1 ("3 essence" names no pool) | The exact words the player reads for every new or changed resource, term or odds display, *and* where the explanation lives (tooltip text, legend, first-use line), quoted |
| **PC-2** | **Hidden rolls and outcomes** | Something was decided by chance or by rules the player never saw. The outcome contradicts the card they picked, or "Let fate decide" hides what fate was. | [THR-1714](https://linear.app/threadbare/issue/THR-1714) (r2, 3/3); [THR-1606](https://linear.app/threadbare/issue/THR-1606) (r1, fixed-confirmed r2 for cast consequences) | The line the player reads *before* the roll (the stakes) and the line they read *after* it (the result), quoted, and how the second visibly follows from the first |
| **PC-3** | **Developer text in player prose** | Raw ids, template seams, internal names or debug labels in a sentence a player reads: `elder_ruin_81`, `Rule: death_or_transformation`, "a economic", raw `{name}`, "The The", "completed Observe", "Unaware" on the player's own avatar. | [THR-1602](https://linear.app/threadbare/issue/THR-1602) (r1, fixed-confirmed r2); new instances in r2: [THR-1707](https://linear.app/threadbare/issue/THR-1707), [THR-1708](https://linear.app/threadbare/issue/THR-1708), [THR-1710](https://linear.app/threadbare/issue/THR-1710); [THR-1600](https://linear.app/threadbare/issue/THR-1600) not exercised; **recurring** in warm r1: [THR-1779](https://linear.app/threadbare/issue/THR-1779) ("His only kin, , claims", raw `{cast:heir}` in the Chapter Ledger, "Quarter of Quarter of", he/she flips) | A representative sample of the *rendered* sentence with real names filled in (not the template), and what renders when a slot is empty |
| **PC-4** | **The game acts for the player without saying so** | Time, a choice, a target or a mortal's life moves on its own and the player is told late or not at all: Auto by default after the bond, a people-list click silently becoming the cast target. | [THR-1715](https://linear.app/threadbare/issue/THR-1715) (r2, Urgent, 2/3 quit there); [THR-1705](https://linear.app/threadbare/issue/THR-1705) (r2, 3/3); warm r1: [THR-1783](https://linear.app/threadbare/issue/THR-1783) item 2 ("Asks you / Lives on" reads as a label, flipped by accident 3/3), [THR-1784](https://linear.app/threadbare/issue/THR-1784) (the seat placed for the player, shown nowhere after) | Every automatic step the feature takes on the player's behalf, and the words that tell the player it happened (or the control that lets them stop it) |
| **PC-5** | **Repeated, duplicate or piled-up rows** | The same event, label or toast appears several times, or stacks faster than the player can read it. | [THR-1711](https://linear.app/threadbare/issue/THR-1711) items 4–5 (r2: label piles, toasts); [THR-1608](https://linear.app/threadbare/issue/THR-1608) popup chain (r1, fixed-confirmed r2) | How often the surface fires, what de-duplicates it, and what the player sees when ten fire at once |
| **PC-6** | **One fact told two ways** | Two surfaces disagree about the same thing: a name and a portrait, an essence count in three places, a Threads panel that says "No Threads" right after the bond. | [THR-1706](https://linear.app/threadbare/issue/THR-1706), [THR-1712](https://linear.app/threadbare/issue/THR-1712), [THR-1704](https://linear.app/threadbare/issue/THR-1704) (r2); warm r1: [THR-1780](https://linear.app/threadbare/issue/THR-1780) (Notables badge vs list), [THR-1782](https://linear.app/threadbare/issue/THR-1782) ("moments resolve on their own", then the opening replays) | Every other surface that already shows this fact, and that the new text matches it word for word (or why it differs) |
| **PC-7** | **No direction** | The player does not know what to do next: the world arrives paused with nothing pointing the way, or setup runs minutes before anything happens. | [THR-1716](https://linear.app/threadbare/issue/THR-1716) (r2, 2/3); [THR-1605](https://linear.app/threadbare/issue/THR-1605) (r1, fixed-confirmed r2 for meeting The First) | What the surface tells the player to do next, in their words, the first time they see it |
| **PC-8** | **The player acts and nothing answers** | A click, a paid steer or a choice is taken, dropped or ignored with no visible reply: an aftermath choice that does nothing, essence paid for a steer the mortal never follows, a list row that only highlights, a close that bounces back. | warm r1 (new, 3/3): [THR-1777](https://linear.app/threadbare/issue/THR-1777), [THR-1781](https://linear.app/threadbare/issue/THR-1781), [THR-1778](https://linear.app/threadbare/issue/THR-1778), [THR-1780](https://linear.app/threadbare/issue/THR-1780) | For every control the feature adds, the reply the player sees within one second of using it (confirmation, result, or the reason it was refused), quoted, and what they see when it is later taken or dropped |

Off-screen and unreachable surfaces ([THR-1709](https://linear.app/threadbare/issue/THR-1709)) are not listed. UI Law 33 (the viewport law) and the browser-verify gate already enforce them at ship time.

## Retired classes

None yet. A class moves here, with the round and the evidence that retired it, under § Lifecycle.

| ID | Class | Retired in round | Evidence |
|---|---|---|---|

## Lifecycle

The `cold-playtest` skill applies these rules at step 8b of every **non-dry** round, after step 6 has assigned each earlier finding its status:

- **Add** a class when a round files a verified finding that none of the open classes describes. Give it the next free `PC-n` id and never reuse an id.
- **Add evidence** to an open class when a round files a new finding of that kind. A class that gets new tickets in a later round is *recurring*; say so in its Evidence cell.
- **Retire** a class only when every ticket in its Evidence cell is fixed-confirmed or closed, and this round's testers reached those surfaces without hitting the class again. "Not exercised" never retires a class. Move the row to § Retired classes with the round number.
- **Re-open** a retired class (move it back, keeping its id) if a later round hits it again.

Edits land on `main` through a docs-only PR. This file is durable knowledge cited by two skills, so it stays on `main` under [`Docs/ops/README.md`](README.md)'s membership predicate (rule 3), unlike the round reports, which go to `ops`.
