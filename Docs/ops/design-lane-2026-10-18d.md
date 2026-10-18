---
lane: tb-design-lane
run: 2026-10-18d
promoted: 1
filed: 2
resolved: 1
newFindings: 0
needsChristian: true
---
# Design lane — 2026-10-18 (run d, ~13:20Z)

## Needs Christian

- **Should "Fated" be gold instead of grey?** On 4 October you set the odds pill to quest-difficulty colours with Fated grey ("a sure thing needs no god"). The card's own Fated pip is gold, and a round-4 tester read grey Fated as the *worst* word. The plan keeps your grey and fixes the reading with words instead: the legend now lists the words worst to best, ending on Fated. Your options: **keep grey** (what happens if you say nothing), **make it gold** like its pip, or **turn the pip grey too** so both match. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))

## Decided for you

All from one plan, [Words teach themselves by something changing](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md), for [the player still can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1980/recurs-after-fix-three-times-the-player-still-cant-read-what-they). The builder holds both builds until 19 Oct 13:50 UTC.

- **Every essence row says how fast it refills**, as a word with dots ("Refills fast ●●●", "slowly ●○○"). The pour screen shows the same word under each sphere as you pour, so the pour visibly does something. Today every pool starts full (50 of 50), so nothing refills and the pour looks like it did nothing. The sphere that pays your upkeep says "pays your upkeep". *Veto:* **"show the refill as a number"** (that needs a change to the no-numbers UI law).
- **The odds legend becomes one sentence**: "The word is how it looks now, worst to best: Doomed, Perilous, Uncertain, Favorable, Fated. Green lines help, red lines hinder." *Veto:* **"keep the short legend"**.
- **A card that moves the odds without changing the word says so**: "▲ your hand lifts the odds — still Doomed", or "— close to Perilous". *Veto:* **"don't hint how close the next word is"**.
- **The card legend shows all four odds shapes** (● ■ ◆ ★, weakest to strongest), so ★ stops reading as a price. *Veto:* **"keep the legend to one shape"**.
- **First-use captions.** Each panel you need early (essence, threads, "Asks you", "Stop interruptions", the Chapter Ledger, and later ones as they arrive) gets one line of plain explanation under it. The line disappears for good once you hover or use the panel. At most two show at once. This is the step the round-3 design held back in case testers never hovered, and round 4 showed they didn't. *Veto:* **"no captions, tooltips only"**.
- **Some panels arrive later.** Attention arrives with The First's first chapter, when a moment first draws on it. Dominion arrives with the *A path opens* gift, beside your Reaches. The "Elder powers" header appears only once an elder sphere is first drawn on. *Veto:* **"show everything from the bond"**.
- **The Chronicle only reports growth for mortals you follow, in words.** It reads "Vara is now Subtle in Shadow and is called Shadow Master.", with no "tier 6" and no "+0.02Q". Strangers' tier-ups and rank-ups no longer fill it. *Veto:* **"keep strangers' growth in the Chronicle"**.
- **"Let it stand" becomes "Go on".** It is the only button on that screen, and the old words read like a choice. *Veto:* **"keep 'Let it stand'"**.

## Work

- **Claimed** [the player still can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1980/recurs-after-fix-three-times-the-player-still-cant-read-what-they) (cold playtest round 4, complaint class PC-1, recurring a fourth time). It is agreed work: a playtest finding whose Done-when is a design pass. The shelf was full (25 ready), no map was open, and the only plan-doc ticket left ([hiring a free company](https://linear.app/threadbare/issue/THR-1974/plan-doc-hiring-a-free-company-a-realm-buys-a-companys-oath-then-pays)) is inside its veto window until 19 Oct 01:35 UTC.
- **Measured** on main `37809540`:
  - Every pool starts at 50, and so does the pool cap. Nothing can refill before the first spend.
  - The per-sphere income rate is already computed on the game screen (`GameView.tsx:1650`), and nothing reads it.
  - Dominion has no reveal row, so it shows from the bond.
  - The Elder powers header shows from the bond.
  - Every tier-up of 0.8 significance or more is copied into the Chronicle word for word. That includes rank-ups, which a second path pushes in directly.
- **Plan doc** [Words teach themselves by something changing](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves-brainstorm.md), merged in [PR #2482](https://github.com/christianspliid-ui/threadbare/pull/2482).
- **Gates.** Intent judge: **Allow** on pass 4. Passes 1–3 returned Revise, and every finding was fixed:
  - the Elder header is visible from the bond;
  - rank-ups have a second Chronicle path;
  - "Stop interruptions" had no caption;
  - the upkeep sphere could read slower than the pour screen promised;
  - absolute refill bands would re-word every row when the Seat arrives. They are now shares of income.

  NFP, three-pillar and Vision audits: all PASS-with-notes.
- **Filed**, both in *Cold playtest · round 4* and claimable from 2026-10-19T13:50Z:
  - [S1: show what the pour and the odds do](https://linear.app/threadbare/issue/THR-1985/show-what-the-pour-and-the-odds-do-refill-words-on-the-essence-rows), Ready for Dev;
  - [S2: words that wait for their moment](https://linear.app/threadbare/issue/THR-1986/words-that-wait-for-their-moment-first-use-captions-attention-at-the), Todo, blocked by S1.
- **Closed** the design ticket per its Done-when (implementation tickets filed), as [THR-1807](https://linear.app/threadbare/issue/THR-1807) and [THR-1982](https://linear.app/threadbare/issue/THR-1982) were.

## Escalations

None new. [The opening picks are blind](https://linear.app/threadbare/issue/THR-1981/the-opening-picks-are-blind-three-mortals-with-no-names-until-the) (round 4) is the next design ticket in this milestone and is unclaimed. Its fix would reverse a round-3 lane decision (no names on the resting picker), which is ordinary lane ground under the delegation.
