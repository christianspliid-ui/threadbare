# Brainstorm companion — one new thing per chapter (THR-2058)

Companion to [`2026-10-26-thr-2058-one-thing-at-a-time.md`](2026-10-26-thr-2058-one-thing-at-a-time.md). Design lane, run 2026-10-26c. Records what was weighed and set aside, so the plan can stay one slice long.

## The minute-ten wall: options weighed

| Option | Verdict | Why |
|---|---|---|
| **Queue arrivals, one per closed chapter, with an idle fallback** | **Taken** | It holds whatever triggers coincide: gift bundles, the ceiling, a rival acting in the same minute. It paces at the player's own story beats, the way the spine gifts are already paced by player acts (THR-1647). |
| Re-spread the rows across the five gifts only | Rejected | The Seat → A Path Opens span is short (`SPINE_PLAYER_ACTS_BETWEEN_GIFTS = 1`), and the 200-tick ceiling still dumps every waiting row together. It fixes the table, not the pile. |
| Space arrivals by running ticks only | Rejected | The clock pauses during chapters, so tick spacing collapses exactly when the player is busiest. Chapters are what the player experiences as "a moment passed". |
| Give Doom its own trigger (first stage turn) | Rejected for now | Doom's tooltip and the First's road read from the doom box from early on (THR-1965). Hiding Doom until Signs could leave a doom-priced card on the hand with no bar to read it. The queue already keeps it from arriving in a pile. |
| Raise the ceiling | Rejected | It delays the pile; it does not split it. |
| Store the ledger in GameState | Rejected | A UI pacing concern written by the engine. The opening reveal is "derived on read; nothing runs per tick" (THR-1837), and a UI-held ledger keeps that. Cost: a reload shows every ready row at once, which is today's behaviour. |

**Queue priority (table order).** The Chapter Ledger comes first because the chapter that just closed is in it. Then Notables, Reaches + Dominion, Doom, Rivals, Mandate, Investiture, the Threads lens, World-Soul, Omens, the Trade lens. Rule: threat before answer (Doom before the Mandate, the rulebook's two clocks), and things the player can act on before things they only read.

## Attention

Measured: `spendAttention` has no production caller. The pool only regenerates. Three options:

1. **Hide the gauge** (taken). Nothing changes in play, and the false caption leaves the screen.
2. Wire a spend. This is a mechanic change: what attending costs, and whether a full pool gates anything. That belongs to the attention-tier design (2026-04-05), so it was filed as a deferral, not decided here.
3. Keep it and reword the caption ("refills with time"). Rejected: a gauge that always reads full teaches nothing, and the testers' *"I never saw it go down"* is exactly that.

## The essence arrow

- **Taken:** the arrow reads the refill band (the same input as the row's word). It cannot disagree with the word or with the pool's visible motion.
- Rejected: a shorter window for the net. It still points ↓ for a while after any spend, and it is a third reading of one quantity.
- Rejected: drop the arrow. The ebbing case (a draining pool) is real and worth a mark.

## Spend flash

The flash diffed the level between renders, so upkeep, phase draws and many ticks per render at high speed could all light ▼. The ledger already files player spends under `spend_nudge` / `spend_cast` (THR-1713). Reading those is exact, and needs no new state.

## Legends

- Pip legend: the full ladder (THR-1985) taught ★ as strongest, but every round-5 hand showed only ●○, and ○ was never named. Printing the hand's own shapes keeps the THR-1985 lesson where ■◆★ occur, and names ○ where it does.
- Aftermath: the four words already have tooltips, and nobody hovers (THR-1807's finding). Two-to-four-word meanings beside each word sit in the legend the player already sees once.

## Needs-you

The count includes news kept for three days, so it never clears. Law 40 forbids clearing it by opening; it does not require news to count. Counting only what waits restores the number's meaning. A news-only pill keeps its label, so news stays findable.

## Out of scope, and where it lives

- Path words as God's Will labels: [THR-2057](https://linear.app/threadbare/issue/THR-2057) item 1 and [THR-2059](https://linear.app/threadbare/issue/THR-2059).
- The Fated colour: reserved for Christian under THR-1980.
- The six overlapping taxonomies: a canon renaming, still without its own evidence (THR-1980 brainstorm).
