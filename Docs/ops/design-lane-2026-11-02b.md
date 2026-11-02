---
lane: tb-design-lane
run: 2026-11-02b
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-02 (run b, ~05:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Encounter Factory habits](https://linear.app/threadbare/issue/THR-2109) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-02-thr-2109-encounter-factory-habits.md)): the fix comes in three rounds. First, the drafting rules and every card line. Then the seven older camp-and-shrine encounters' result lines. Last, the town encounters. Veto line: "one round".
- Same plan: a god's card says what the god does, never how strong it is. Lines like "A small help." and "and it costs no essence" go, because the pips and the cost already show that. A line that is only mood once the tag is cut gets rewritten whole. Veto line: "just cut the tags".
- Same plan: cards speak as plain commands ("Close the gap between them"), not "You close the gap…", as the model encounter's cards already do. Each command is the god's own act on the world, never an order to the mortal. Veto line: "keep 'you' on the cards".
- Same plan: the "It argues for…" endings that show which way a card leans stay word for word. The Smugglers' Ford "honest way" card is left untouched until you pick its wording. Veto line: "drop the 'argues for' endings".
- Same plan: the five rules ("no strength talk", "no 'X held. Y did not.'", "name the mortal", "write each stake line fresh", "don't give away the secret in the summary") go into the factory's writing instructions, each pointing at the doctrine line it already breaks. The doctrine itself and the critic's checklist stay as they are, because changing the checks is [your conversation about the writing checks](https://linear.app/threadbare/issue/THR-2106). Veto line: "add them to the critic too".
- Same plan: the mortal in an encounter is always named. Titles like "the master" are kept for side characters only. Veto line: "titles for the mortal are fine".

## Work

- **Why not the UI focus this run:** [Legibility 1](https://linear.app/threadbare/issue/THR-2122) is held by its decisions' 12-hour veto window until about 11:25Z, and Legibility 2–4 wait on it. The build shelf held one ready ticket (on hold), so the shelf rule took the next agreed plan doc: [Encounter Factory habits](https://linear.app/threadbare/issue/THR-2109), staged by the orchestrator at 03:30Z.
- **Claimed** (claim `dl-2026-11-02-0518`). Measured on `main` @ `2526793c`: 117 strength-tag lines in 13 files. 72 of them sit in seven older board encounters, none on the wave 2 lists. 29 card lines open with "You". Five "X held. Y did not." lines. 51 town encounters. No factory prompt names any of the habits.
- **Plan doc merged:** [PR #2699](https://github.com/christianspliid-ui/threadbare/pull/2699), liveness LIVE. Intent judge: Allow, with two gaps fixed (the encoded-line check now reads the text as the player sees it, and slice c got a stop rule). The judge raised the impact class to External, since the plan changes how the factory's writers behave. NFP, three-pillar and Vision auditors: PASS-with-notes. Each note was answered in the plan.
- **Handed off** [slice a](https://linear.app/threadbare/issue/THR-2109) to Ready for Dev. It cannot be claimed before 17:30Z, when this run's veto window closes.
- **Filed** [slice b — the seven older encounters' result lines](https://linear.app/threadbare/issue/THR-2129/encounter-factory-habits-slice-b-the-seven-migrated-board-encounters) and [slice c — the town encounters](https://linear.app/threadbare/issue/THR-2130/encounter-factory-habits-slice-c-town-encounters-name-the-mortal-write), both Todo and blocked by slice a.
- **Next:** Legibility 1 becomes workable after about 11:25Z.

## Escalations

None.
