> **title:** Brainstorm companion — the player can read the race (THR-2246)
> **plan:** `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md`
> **created:** 2026-11-19

# Brainstorm companion — the player can read the race

## Vision premises in play

- **Two clocks press, one purse pays (Game Design Law 30).** Today the clocks are two separate bars. The
  plan's premise: a pressure the player cannot compare is not yet a pressure, so the comparison must be shown.
- **A run is not about winning (Law 32).** This is the strongest constraint on the words. "Ahead" and "behind"
  are said of the Mandate against Doom, never of the player. No grade, no score, no "you are losing".
- **Prose, never numbers (UI Law 13, Vision non-negotiable #3).** The projection is arithmetic and the player
  sees only its verdict, in words.

## Alternatives considered

| Option | Why not taken |
|---|---|
| A second bar or a dual-ring "race meter" in the top bar | The top bar has no vertical room, and a new persistent datum spends the Law 53 budget. A second rendering of the same two proportions also tells one fact twice (PC-6). |
| A "days left" readout for each clock | Law 13's unitless-proportion and tick rulings: a projected day count is a raw magnitude the player cannot act on more precisely than the sentence. |
| Project from the 36-tick ledger window already stored | It is in ledger points, not progress, and chapter deeds arrive in bursts. Three days of quiet would read "stalled" mid-chapter. |
| Project from Doom's `lastStep` only | Blind to nudge `doomDelta` jumps and complication micro-ticks. Sampling progress sees every cause. |
| Show the race from day one | The ticket asks that a new player not be told the ending on day one. Hidden before Doom's Signs stage (0.20) also means at least five days of samples. |
| A pausing popup when the race turns | Law 39 keeps pauses for moves the god can make now. A turn is information, so it uses the alert channel. |
| A place lever now | The THR-2245 census shows that place casts credit the Mandate weakly until THR-2249 ships. Naming them as the strongest move would be a weak promise. The lever list leaves room for a place entry later (ticket 4). |
| Stay as the first lever | The census says chapters move the race more than Stay: chapters-only 0.82–0.96 against hands-off 0.06–0.12, while Stay held all age slows Doom by about 0.12 of the clock. Stay stays first in the Doom dialog, where THR-2240 already put it. |
| Lever inside the rail block | The block is one `role="button"`, and a link or button nested inside it is a nested control (keyboard and screen-reader trap). The dialogs are one click away (Law 20's tiers). |

## Tensions

- **Forecast accuracy vs stability.** A short window reacts fast and flaps. A long one is stable and late.
  Fifteen days plus a two-day hold is the starting point, and ticket 3's census measures both turn count and
  accuracy at Doom 0.80. The kill criteria say what moves first.
- **Ticket 1 changes the numbers.** Until [THR-2249](https://linear.app/threadbare/issue/THR-2249) and the
  census fit land, most measured ages read `doom_first` or `stalled`. That is honest: today no measured run
  finishes the Mandate. The words do not depend on the fit; the thresholds are constants.
- **Flavour line loses its rail slot.** The rail stays the same height (Law 57 and the hand's three-row
  floor). The flavour is mood and the forecast is direction, so the forecast wins the slot while the race is
  shown. The flavour moves into the dialog.
