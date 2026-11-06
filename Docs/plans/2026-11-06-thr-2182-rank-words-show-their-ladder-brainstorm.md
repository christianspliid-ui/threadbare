> **title:** Brainstorm companion — rank words show their ladder (THR-2182)
> **linear_issue:** THR-2182
> **author:** Claude Code (design lane, unattended, 2026-11-06)
> **created:** 2026-11-06

# Brainstorm companion: rank words show their ladder

Companion to [the plan](2026-11-06-thr-2182-rank-words-show-their-ladder.md). It keeps the options weighed and the premises the plan leans on.

## The question

How does a player read where a rank word sits on its ladder, and what the small number beside a row counts, without a hover and without a raw number?

## Options weighed for the rank word

| Option | What the player sees | Verdict |
|---|---|---|
| A. Current + next level, in words | "Formidable" / "Middle of the ladder · next Fearsome" | **Taken.** The standard pattern for a rank (loyalty tiers, skill trees). Words only. The tile already has a muted line slot style (`durationWord`). |
| B. Segmented meter, five cells | "Formidable ■■■□□" | Rejected. A filled-cell row is a magnitude glyph language. Law 10/15 keep pips for odds and the ▲ family for change, and a third language needs Christian's ruling. |
| C. "3 of 5" | "Formidable (3 of 5)" | Rejected. A raw magnitude (Law 13). |
| D. The whole ladder visible on the tile | "Meek · Trained · **Formidable** · Fearsome · Legendary" | Rejected for the tile (five words per tile over eight tiles is a wall of text, and the tile is 10rem). Kept as the hover (decision 2). |
| E. Hover only | the ladder in a tooltip | Rejected alone. The tester said "no tooltip"; slice 1 measured that warm players do not hover unmarked labels. Kept as the second layer. |
| F. Rename the ladders to self-ordering words | "Novice / Adept / Master" | Rejected. Content canon, wide change, and loses the per-Reach flavour the ladders were authored for. |

## Options weighed for the row number

| Option | Verdict |
|---|---|
| "4 cards" visible after the icon | **Taken.** The noun already exists in `INSPECTOR_WORDS.rowCards`; it was only hidden. |
| "Cast · 4" | Rejected. A verb label reads as a button that casts at once, and casting is armed-then-fired (Law 48). |
| Drop the count, show the icon only | Rejected. Law 11: the icon alone carries the meaning. |
| Move the count to a hover | Rejected. The count is useful at a glance; it only lacked its noun. |

## The faction word

"Formidable" is the middle of a mortal's Iron ladder and the top of the faction ladder, on two Inspector pages. "Foremost" was chosen for the faction top because nothing in `src/` uses it and it reads as stronger than "Strong". "Mighty" was the first draft; the Vision audit rejected it because it sits beside the fight screen's concept word "Might" and reads as physical force on non-Iron Reaches. Leaving "Formidable" keeps one word on two ladders, which is the confusion the tester's list shows.

## The place words

The first draft said "Middle rung". The Vision audit found that "Rung" is already a UL term, one of the four steps of the god's card ladder (`Cosmology.md` § Rung). So the sheet says "Middle of the ladder" instead.

## Premises leaned on

- Words, never numerals (Law 13; Vision non-negotiable #3).
- One source per sentence (Law 58 spirit): the subline and the hover both read `DOMAIN_WORD_SCALES`, so a renamed ladder word renames both.
- Slice 1's finding, measured on main @ `90221547`: the hovers existed and nobody hovered. The visible text has to carry the meaning.

## What would change the call

- Christian preferring a meter: that is a ruling on a new glyph language, and option B becomes the build.
- Warm round 4 reading "Middle of the ladder" as a target: drop the place words (kill criterion).
