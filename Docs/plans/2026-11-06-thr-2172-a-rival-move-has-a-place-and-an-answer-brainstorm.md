# Brainstorm companion — a rival's move has a place and an answer (THR-2172)

Companion to `Docs/plans/2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer.md`. Design lane, 2026-11-06.

## The tension

The testers asked for a button that acts on a rival. The substrate says the god already acts against rivals: tending a place makes the rival's pressure break on it, and threading, controlling or holding a scheme's target breaks the scheme. The gap is legibility, not verbs. The tension: a sentence pointing at existing verbs may read as "no button", and round 4 is the measurement. The kill criterion names the counter-card slice if it fails.

## Alternatives weighed

- **A "Ward against {rival}" card on each raid toast.** The most direct answer to the skimmer's ask. It needs a new template, a grant path (104 god cards are already orphans, THR-1769), and pricing against the omen market (THR-1770 ruling). That is catalog design for a later slice, and it would duplicate what Claim Dominion already does to the same place.
- **A rival Inspector page.** The router has no arm for rivals because they are not graph nodes. A rival node type is a load-bearing decision ("no inventing node types without verification") and needs Christian. The disclosure carries the same content.
- **Keep the flavour toast and append the place.** Rejected because the flavour promised effects ("curses your followers with plague") that the engine never performs. A toast that says what happened is honest prose.
- **Hostility decaying to zero.** Rejected: a rival god is not a friend, and "wary" would undersell a god that raids you. The floor stays "hostile".
- **Wire `updateRivalState`'s +0.05 per attack.** Rejected: a rival angering itself by attacking is not a cause the player can read or act on. The player-caused rise (breaking a scheme) is.

## Vision premises

- Rivals are generated from the World-Soul, never a fixed pantheon. Nothing here fixes their roster.
- Narrative over mechanical perfection: the toast is story words, and every word matches a real effect.
- The map is the table: the toast's click lands on the place, not on a new screen.

## What was measured, not assumed

- Rivals are not graph nodes (`state.graph.getNode("actor_rival_1")` → null), so two Chronicle lookups print the raw id or fall back.
- Hostility sits at 0.5 ("aggressive") from tick 0; its one stored writer is the scheme beat.
- The probe toast fires before, and regardless of, the landing.
