> **title:** Brainstorm companion — Legibility 1, the shared blocks (THR-2122)
> **linear_issue:** THR-2122
> **author:** Claude Code (design lane, unattended, 2026-11-02)
> **created:** 2026-11-02

# Brainstorm companion — Legibility 1 (THR-2122)

The considered alternatives behind [the plan](2026-11-02-thr-2122-legibility-shared-blocks.md). The rules themselves were decided on the map's tickets (THR-2118, THR-2119, THR-2120); this file records only the choices the plan made in applying them.

## Where the between-section distance lives

- **Chosen: one local `SectionShell` in `Section.tsx`.** Nine renderers each set `marginBottom: '20px'` today. One shell puts the distance in one line, so the kill-criteria fallback (`--space-5`) is a one-token change.
- Rejected: the parent (`SubjectPage` / Inspector body) sets `gap` on a flex column. That is cleaner in theory, but `Section` renders in several hosts (Inspector, aside gallery, styleguide, FactionSheet). Each would need the gap, and the Law 27 risk is a host that forgets it.
- Rejected: an exported `Block` primitive. THR-2120 rejected it (Law 58, "don't build a second section model").

## The pole row in the facts grid

- **Chosen: first pole word in the label column.** Today's row already right-aligns that word at `minWidth: 5.5rem`. On the grid it lands on the seam, and the block keeps one seam.
- Rejected: the pole row spans both columns (`gridColumn: 1 / -1`). That gives a second left edge inside one block (THR-2119 rule 2 allows one seam).
- Rejected: show `row.left` ("Brave · Craven") in the label column. It repeats the two pole words that the bar draws, and it is a content change.

## Gold on Detail headings

- **Chosen: the renderer stops drawing `gold` on Detail sections; the type and the three engine sites stay.** This is UI only, outside the review gate's engine scope, and additive (NFP 6).
- Rejected: flip the three `gold: true` sites in `src/engine/views/subjects/` to false. That is the same visible result with an engine-scope diff. A later cleanup can drop the field once Legibility 2 settles the Act-row and index headings, which are the only other gold callers.

## Count format

- **Chosen: "Retinue · 3".** THR-2119 rule 3 asks for the count after the words, and THR-2120 § 1 sketches it as "Your cards 2". The intent judge's first pass (Revise) noted that a bare "Rival gods 2" can read as part of a name, on a count that PC-1 already cites (THR-1860). The middle dot is the form the links groups already draw ("Allies · 3"), so it unifies three count forms into one without inventing a fourth.
- Rejected: the bare "Retinue 3" sketched in THR-2120. Same position, but the weaker count cue.
- Rejected: keep "(3)" in `SectionHeading` and change only the hand. That leaves two count forms, which is the drift THR-2119 § 3 names.

## Event-card frame

- **Chosen: framed only while clickable.** THR-2120 § 3 keeps the box "because it is clickable as a whole". An unclickable one is a section, and a box around a section is the anti-pattern this plan writes into canon.

## Tensions noted, not resolved here

- The Act-row heading in `InspectorParts.tsx` is gold. THR-2120 § 4 says a section heading looks the same everywhere. Legibility 2 owns that page anatomy.
- Tile captions (THR-2119 § 4) sit inside tiles today. Tiles are cards, and card faces keep their layout, so this slice leaves them.
