> **title:** Brainstorm companion — art-led pass, slice 7 (THR-2103)
> **created:** 2026-11-01
> **plan:** `Docs/plans/2026-11-01-thr-2103-art-led-lists.md`

# Brainstorm — the lists and notices

## What the survey changed

The scope card names ten surfaces. Reading them on `main` split them in two. Six (the Chronicle, Notables, Threads, Read the Threads, toasts, Find) and the hover card list people, places and things, and every row already holds the id it needs for a picture. Four (Rivals, the Mandate, the doom, omens) are about the world, not an entity, and each already leads with a carved or sphere mark. So the slice's weight is on the first group. For the second it does heading shapes and one cleanup.

## Alternatives considered

- **Portrait-size (3:4) faces in Notables and Threads.** Rejected. The rail is narrow and the lists are scanned. A 3:4 face per row would make the Threads list scroll at once, against Law 57. Chip size is Law 5's list size.
- **A picture for every linked name in a Chronicle entry.** Rejected. An entry links up to four names, and four pictures would bury the prose the Chronicle is for. The hover card already shows each name's face.
- **Drop the toast's trailing kind icon once it has a picture.** Rejected. The trailing icon tells the player a click goes somewhere. The picture tells them who it is about.
- **Draw carved shapes for rival tempers and doom kinds now.** Rejected. Both are on Christian's open pick ([THR-1908](https://linear.app/threadbare/issue/THR-1908)).
- **Move `NotablesPanel`'s row builder into `src/engine/views/`.** Rejected for this slice. The move is right, but it is a refactor, and this slice only dresses.
- **Let each component call `resolveEntityVisual` with `graph`.** Rejected. The hosts resolve and the components draw descriptors, as in slice 6, so the knowledge gate is read in one place.

## Tensions

- **Law 8 vs scanning by face.** A mortal the god has not come to know draws a silhouette, so early lists show many. Kept: the gate is a law, and the face unlocks as the god learns them.
- **One path with slice 6.** Slice 6 plans `echoVisual` and this slice plans `rowVisual`. Whichever lands second folds `echoVisual` onto `rowVisual`.
- **Decision independence.** Slices 3–6 made lane decisions within the last twelve hours. This slice draws on none of them, so its veto window starts from its own decisions.

## Vision premises

- North star, the mortal as a person: a face in every list that names a mortal.
- Non-negotiable #3, mechanics through prose: no word changes and no numbers.
