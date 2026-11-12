# Brainstorm companion — A thread row's story lines wrap instead of cutting (THR-2193)

Companion to `Docs/plans/2026-11-12-thr-2193-thread-row-story-lines-wrap.md`. Authored by the design lane
(run dl-20261112T2019Z) under the UI legibility period focus (2026-11-01 to 2026-11-29); the ticket is a weekly
UX-review finding that asked for one design call.

## Vision premises engaged

- **The god reads mortals' lives from the table.** The Threads rail is the always-visible place for that; a
  sentence cut to "raising a p…" makes the god hover to learn what their own First is doing.
- **UI Laws 55 and 57.** Story continuity on the thread row; grow before truncating.

## Alternatives considered

| Option | Why not taken |
|---|---|
| Authored short form per work and per result (stay one line) | A new content table to keep in step with every work verb and every encounter; still drops words. Law 57 already answers "grow or cut" with "grow" |
| Wrap with no cap at all | One freak sentence could fill the rail. A cap of 3 lines costs nothing in the common case |
| Cap at 2 lines | Estimated to still cut longer result lines at the 280 px rail; 3 is the measured-width call, and the constant makes it a one-number change |
| Move the progress word to its own line | Spends a line on two words in the common case, where phrase + word fit in two lines together |
| Widen the right rail | The rail widths were settled with Christian in THR-1828; this is not the ticket to reopen them |

## Tensions

- Taller rows mean fewer rows fit before the rail scrolls. With one or two threaded mortals (the usual
  mid-game) it fits; with many, the rail's own scroll takes it. The plan names the evidence that would drop
  the cap to 2.
- The progress word sits at the end of the phrase's last line rather than always at the right edge of one
  line. That is the price of showing the phrase whole; THR-1962's rule that the word never cuts still holds.
