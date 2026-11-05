# Brainstorm companion: the god-rail hand gets room (THR-2177)

Companion to `Docs/plans/2026-11-05-thr-2177-god-rail-hand-room.md`. Design lane, unattended, 2026-11-05.

## The problem in one number

At 1920×1080 the hand region is 168 px and a card is 61 px, so the hand shows 2.75 cards. The ticket asked for six. Six two-line cards need about 360 px. No change to the Essence block alone finds 190 px without hiding pools.

## Levers measured

| Lever | Saving at 1920 | Kept? | Why |
|---|---|---|---|
| One-line card rows (55 → 32.5 px) | 22.5 px per card, so six cards need about 225 px instead of 360 | yes | The biggest lever. It is the deck-list pattern, and the map's own text-positions decision. The words fit (measured) |
| Arrow off the bar line's height (pool row 50 → about 42 px) | about 32 px over four grid rows | yes | Keeps every part Christian chose (THR-2148) |
| Hand floor + folded block shrinks | keeps the hand from going to 0 px | yes | Fixes the "open a row, lose the hand" case and THR-2176's one-card clip |
| Compact icon + "N / M" cells for the less-used pools | about 90 px | no | Law 11: an icon with no word beside it is drawn at 34 px, which cancels the saving. Dropping the icon instead breaks Law 1 on that row |
| Pools the hand draws on shown full, the rest folded | up to 150 px | no | The Done-when asks that every pool still reads. Law 53 lists essence as always-on. And a layout that changes when the hand changes moves things under the cursor (THR-2166) |
| Drop the word "essence" from the price | none needed | no | The full words fit on one line once padding gives 4 px |
| Two-column folded rows | about 60 px | no | "Reaches · Eye · Blinkered" is about 190 px against a 142 px column |
| Rail gap `--space-6` → `--space-5` | 12 px | kept as a fallback only | Legibility 4 already sanctioned it as a kill-criterion fallback |
| Remove the refill key line | 32 px | no | Law 12: the rung's legend at first contact (THR-1985 placed it there on purpose) |

## Budget after the kept levers (1920×1080, caption closed)

Hand region with no moment open: 168 + 32 (rest line absent) + about 32 (pool rows) = about 232 px. Six one-line rows: 6 × 32.5 + 5 × 6 = 225 px. With a moment open (the rest line shows): about 200 px, five rows. The margin is thin (about 7 px), so the kill criteria name the `--space-5` fallback.

## Vision premises touched

- The god acts through cards: the hand is the rail's main act surface, so it gets the room before the readouts do.
- Prose-first, numbers only where Law 13 allows: no number is added.

## Tensions left open

- With a moment open, the hand shows five rows, not six. During a moment the cards rest anyway (dimmed, presses swallowed), so the Done-when measures the playable state.
- At 12 cards the hand groups by sphere (existing `handFit`). Grouping is Law 36's answer at the limit, and this plan does not change it.
