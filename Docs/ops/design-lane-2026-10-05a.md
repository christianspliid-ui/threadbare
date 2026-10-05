---
lane: tb-design-lane
run: 2026-10-05a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-05 (run a, ~00:45Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2): **every number and mark the round-2 testers pointed at now answers on hover.** [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1713-readable-on-hover.md).
  - **Why it recurred:** the tooltips from the first fix were there, in the wrong places. The essence tip sat on the tiny number, not the bar. The cards in a dilemma never switched theirs on; only spell cards did. The card icons (scales, dice, the leaf) had none at all.
  - **Essence:** hover anywhere on a sphere's row and it says what the sphere is for and whether it's rising, steady or ebbing. It also names what fed or drew it lately, for example *"Drawn by your threads' upkeep"*. The trend arrow, which always showed "—", becomes real. Still no numbers except the balance.
  - **Cards:** the price, the odds marks (the ★ is "moves the odds as far as any card can", not a cost), the sphere mark and the keyword icon each explain themselves.
  - **Forecast words:** "Doomed", "Fated" and the rest each say what they mean on their own. Spell cards stop printing the lowercase code word.
  - **Red and green lines:** each one gets a small **helps** / **hinders** word. Your colour rule already asks for a word beside the colour, and a tester read a red line ("could stop a war") as good news.
  - **Reaches:** the sheet's Reach words get tooltips too, and the heading says Reaches are what you do while Spheres are what fuels it.
  - **Quintessence:** it leaves the top bar until it actually moves; your sheet still shows it.
  - *The calls to veto:* say **"no tooltips in the meeting"** if you want Meet The First fully free of hovers (it is one switch; today the card hovers show there too). Say **"labels, not hovers"** if you'd rather these read as always-visible words.

  Say "veto readable hovers" to reverse it. It can be built from about 02:41 Tuesday your time.

## Work

- **Chosen:**
  - The build shelf had 3 jobs that are not deferrals (floor 4), so a plan doc was due.
  - No wayfinder map is open.
  - The last run skipped this ticket only because [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice)'s veto window was open. It closed ~18:45Z yesterday, and that work has shipped.
- **Measured in source** (main `e99db0b0`):
  - The essence tooltip sits on the balance numeral only (`EssenceBlock.tsx:141`).
  - The trend arrow is a hard-coded placeholder (`selectors.ts:147`).
  - Card-mark tooltips are switched on only by the spell-card model (`actionCardModel.ts:181`), never for dilemma cards.
  - The 22 card keywords have no tooltip family.
  - The sheet's Reach word has no tooltip (`AscendantSheet.tsx:404-410`).
  - Factor lines carry polarity by colour alone.
  - Nothing records why an essence pool moved. The plan adds a small record at the one point every turn's pool changes already pass (`orchestrator.ts:2801`).
- **Already fixed since round 2, not re-decided:**
  - "was Perilous" (THR-1714).
  - The dice and scales header marks (THR-1724).
  - The three essence numbers (THR-1706).
- **Gates:**
  - Intent judge **Allow**, with two small gaps (trace registration file, kill criteria in the plan). Both were fixed before merge.
  - Auditors: NFP PASS-with-notes (phase table added), pillars PASS, Vision PASS-with-notes. The taste profile prefers learning by reading over tooltips; the ticket chose tooltips, and the kill criteria send the next fork to you if hovers don't teach.
- **Shipped:**
  - [PR #2230](https://github.com/christianspliid-ui/threadbare/pull/2230) merged; plan-doc liveness `LIVE`.
  - Ticket moved to Ready for Dev, unassigned, with `Claimable from: 2026-10-06T00:41:00Z` in the description.
  - Handoff comment posted with the coordination block. It is mutex with [the five-card hand fit](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls) and [the minimised step](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should).

## Escalations

None.
