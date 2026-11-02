---
lane: tb-design-lane
run: 2026-11-02e
promoted: 0
filed: 1
resolved: 0
newFindings: 0
needsChristian: true
---
# Design lane — 2026-11-02 (run e, ~14:40Z)

## Needs Christian

- **Should a sphere's essence pool show how full it can get as a number?** This comes from [the "can't read what they spend" playtest ticket](https://linear.app/threadbare/issue/THR-2143/recurs-after-fix-five-times-the-player-still-cant-read-what-they-spend). All three testers want a number they can check. Your Vision files forbid new numbers on screen without an exception, so this one is yours. Options:
  - **(a)** the bar's end plus words: "Full when the bar is full. Each mortal you thread lets every pool hold a little more." This is the draft's default.
  - **(b)** the hover says "Holds up to 55: 50, and 5 more for each mortal you have threaded."
  - **(c)** the row reads "53 / 55".

  Answer "a", "b" or "c". Nothing else in the plan changes with your answer. [The draft plan, § Needs Christian](https://github.com/christianspliid-ui/threadbare/blob/docs/plan-2026-11-02-the-sheet-says-what-grew/Docs/plans/2026-11-02-thr-2143-the-sheet-says-what-grew.md#needs-christian-reserved-not-decided).

## Decided for you

None this run. The draft's choices below take effect only when the plan is handed off, after your answer. Each can be vetoed now:

- [Can't read what they spend](https://linear.app/threadbare/issue/THR-2143/recurs-after-fix-five-times-the-player-still-cant-read-what-they-spend) (draft): the essence bar ends at the pool's real limit, not at the starting 50, so a full bar means a full pool. Veto line: "keep the bar ending at the starting amount".
- Same draft: upkeep is explained as a sentence ("Your two threads draw their upkeep from this pool, a little all day. So when it is full, it sits just under its limit."). No amount is shown, because your rule keeps rates off the screen. Veto line: "show the upkeep amount".
- Same draft: after a chapter grows a skill, its tile shows the Aftermath's ▲ for three days, with "The word changes only at the next step." Veto line: "keep the mark until I have looked".
- Same draft: a lean from the first meeting shows on Nature as "leaning Scheming", and Nature uses the same pole words as everywhere else (Fair / Scheming, not Honest / Cunning). Veto line: "keep the Nature words".
- Same draft: the meeting's fate line says "Elara leans Scheming now" instead of "came out Scheming". Veto line: "keep 'came out'".
- Same draft: Fated stays grey. Its hover starts with your own words: "The best word on the ladder: a sure thing needs no god."

## Work

- **Chose** [Can't read what they spend](https://linear.app/threadbare/issue/THR-2143/recurs-after-fix-five-times-the-player-still-cant-read-what-they-spend) as period-focus work: its fixes are almost all readouts and hovers. The shelf is not thin (4 ready). The legibility map is closed, and [Legibility 2](https://linear.app/threadbare/issue/THR-2123), [3](https://linear.app/threadbare/issue/THR-2124) and [4](https://linear.app/threadbare/issue/THR-2125) all wait on [Legibility 1](https://linear.app/threadbare/issue/THR-2122/plan-doc-legibility-1-the-shared-blocks-the-type-ladder-and-the), which is held until 23:50Z.
- **Measured** on `main` @ `12e6c116`:
  - The bar ends at the starting 50 (`ESSENCE_BAR_CEILING = INITIAL_ESSENCE_PER_SPHERE`), while the real limit is 50 + 5 per thread.
  - Upkeep is 0.1–0.5 per thread per tick, below every existing word ladder's floor.
  - Leans are stored on the thread edge (`meetingChoiceRecord.formativeOutcomes`).
  - A real First bonds at `known` familiarity, so the personality row never shows.
  - Growth changes sit in the chapter archive (capped at 2000).
- **Drafted** the plan, its brainstorm companion and intent proposal on [the draft branch](https://github.com/christianspliid-ui/threadbare/tree/docs/plan-2026-11-02-the-sheet-says-what-grew). No PR was opened and nothing is merged.
- **Gates:**
  - Intent judge: Revise (four legibility fixes, all made), then Allow, then **Escalate** on the version without the number.
  - NFP: PASS-with-notes. Three-pillar: PASS.
  - Vision: REVISE on the "Holds up to 55" draft, then PASS-with-notes once the number moved to your question.
  - Under the lane's rules, an Escalate is not handed off around.
- **Released** the ticket to Todo, unassigned (verified), with the question and the resume steps on [its latest comment](https://linear.app/threadbare/issue/THR-2143/recurs-after-fix-five-times-the-player-still-cant-read-what-they-spend).
- **Filed** [Card tags and the coloured circles beside card prices are still unread](https://linear.app/threadbare/issue/THR-2146/card-tags-and-the-coloured-circles-beside-card-prices-are-still-unread) (Todo, unassigned, round-6 milestone). The ticket's direction gave no answer for that row.
- **Next:** once you answer, a run applies it, re-runs the judge, merges the plan and files the two build tickets. Legibility 2–4 can start after about 23:50Z.

## Escalations

- Intent judge pass 3 on the draft: Escalate. The question is above, under Needs Christian.
