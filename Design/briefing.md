# Briefing
**Generated:** 2026-11-13 13:58 local (12:58 UTC) · keep-work-flowing-cc

## The one thing

**From Sunday 8 to Thursday 12 Nov, the lanes were silent for about 103 hours. Was the computer off, was the app closed, or was that a pause?** Every lane and the worktree reaper came back in the same minute on Thursday evening, so it looks like the computer or the app was off. If so, just say so. If it wasn't, it becomes a fault to chase. Detail: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (9)

- **Set the Claude app to open when Windows starts.** That would have closed most of these silent gaps without anyone noticing ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Wednesday 21 to Friday 23 Oct:** silent for 48 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Sunday 18 to Monday 19 Oct:** silent for 23 hours, with no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md)). Each threat now has an answer the player can play, paid from the same essence as the nudge cards:
  - **The Mandate:** when a mortal bound to you finishes a chapter, the Mandate goes up. It goes up a little when the chapter is in one of the Mandate's spheres, and more when you played cards of those spheres in it. The goal word now shows the last day ("Rising", "Holding", "Slipping") instead of sitting at "Holding" all run. Say "veto Mandate deeds" to keep it counting only your own hand.
  - **Doom:** a new card, *Stay the Unmaking*, which you get at the first Doom stage. While you hold it, Doom runs at three-quarters speed, and it draws on your essence every day. It never stops Doom. The Doom notice gets a "Stay it" button. Say "veto Stay the Unmaking" to keep Doom unanswerable.
  - **Rivals:** a new card, *Rebuke*, which you get the first time a rival's blow lands on your ground. You play it on the place the rival just pressed. The place holds against that rival for a few days, some of what was taken comes back, and the rival's temper rises. The toast's "Tend it and the next blow breaks" promised something the game never did, and now says only what is true. Say "veto Rebuke" to keep tending as the only answer.
  - The three build tickets are held for your veto until 20:43 UTC today: [Stay the Unmaking](https://linear.app/threadbare/issue/THR-2207), [A bound mortal's deeds fill the Mandate](https://linear.app/threadbare/issue/THR-2208), [Rebuke](https://linear.app/threadbare/issue/THR-2209).
- [Make the purse bite — a full hand should cost more than the god can afford](https://linear.app/threadbare/issue/THR-2201) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md)). **Essence becomes scarce mainly because the god earns less, not only because cards cost more.**
  - **What was tested:** I measured three worlds. The god could afford every card in the hand at every attended step, in all three. Even with prices tripled and a smaller pool, it still could. Attended steps come only every 40 to 48 ticks, and in that time the god's own pools earn about ten times what a hand costs.
  - **What changes:** cards cost about three times more, each pool holds 35 instead of 50, and the god's base and home-seat income halve. Two hidden rules also change. The cheaper price on your own spheres now goes only to spheres you actually chose. A card with no sphere is now paid from your own spheres, not from all twelve pools added together.
  - **Result in the test runs:** the full hand was affordable at 5 of 13 steps in one world and 2 of 19 in another.
  - **Safeguards:** the builder stops tuning at the first setting where a full hand is affordable less than half the time. At least one card must stay playable at nine steps in ten, a god who plays nothing must keep its threads, and Meet The First must not change.
  - **Veto:** held for your veto until 20:46 UTC today. Say "veto purse bite" to keep the god's income as it is and only raise prices. The measurements say that alone will not make anyone choose.

- [Stop the world only for real decisions](https://linear.app/threadbare/issue/THR-2203) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2203-stop-only-for-real-decisions.md)). The world now stops only when you have something to decide or something of your own to read:
  - **An ending you had no part in waits on its badge.** If you played no card in a chapter, its ending no longer stops the clock. It sits on the mortal's thread row as "theirs alone", "played out without your hand", or "went badly without your hand" (the last one in the failure colour), one click away. Say "veto quiet endings" to keep every ending stopping the world.
  - **A Fated step with only dealt cards plays out within the day.** If a step already reads Fated before you play anything, and its cards are only the ones dealt from your repertoire, it shows on the badge as "Fated — plays out soon unless you step in". Open it and the world stops as usual; leave it and it plays out. Steps with authored cards always stop: Flawed Steel, The Boundary Survey and The Well Sinking are untouched. Say "veto Fated fuse" to keep every Fated step stopping.
  - **The texts change with it.** Game Law 27 gains: *"A moment matters when it offers the god a move or reports the god's own hand; a chapter that did neither waits on its badge."* UI Law 39, the rulebook and one Vision sentence change to match ([game laws](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/game-design/laws.md), [UI laws](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/design-system/laws.md)).
  - **Template chapters now deal different hands, without any shuffle.** Easy steps get the guard cards (Buy The Floor, Spare The Worst); middle steps get Draw On Character; hard steps get Press The Odds and Draw On Character. Your first sphere's card is always offered; your second sphere's card has to earn its place. In the test, the witness god's nine template steps went from one hand to five. Say "veto stakes hands" to keep the old deal.
  - Both build tickets are held for your veto until 23:40 UTC today: [An ending the god had no part in waits on its badge…](https://linear.app/threadbare/issue/THR-2211) and [A dealt hand reads how hard the step is](https://linear.app/threadbare/issue/THR-2212). *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-13c.md)*

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Healthy but paused: 5 tickets ready, none being built.** All five are held for your veto (three until about 20:45 UTC, two until 23:40 UTC), so the builder is idle on purpose until then.

- Ready, held until ~20:45 UTC: [THR-2201 Make the purse bite](https://linear.app/threadbare/issue/THR-2201/make-the-purse-bite-a-full-hand-should-cost-more-than-the-god-can), [THR-2207 Stay the Unmaking](https://linear.app/threadbare/issue/THR-2207/stay-the-unmaking-a-god-card-that-slows-doom-while-you-hold-it-and-the), [THR-2208 A bound mortal's deeds fill the Mandate](https://linear.app/threadbare/issue/THR-2208/a-bound-mortals-deeds-fill-the-mandate-a-threaded-chapter-credits-it).
- Ready, held until 23:40 UTC: [THR-2211 An ending the god had no part in waits on its badge](https://linear.app/threadbare/issue/THR-2211/an-ending-the-god-had-no-part-in-waits-on-its-badge-and-a-fated-step), [THR-2212 A dealt hand reads how hard the step is](https://linear.app/threadbare/issue/THR-2212/a-dealt-hand-reads-how-hard-the-step-is-guard-cards-on-easy-steps-the).
- Not yet ready: [THR-2209 Rebuke](https://linear.app/threadbare/issue/THR-2209/rebuke-a-god-card-that-answers-a-rival-on-the-place-it-just-pressed) is not in Ready for Dev; the orchestrator promotes it when it is unblocked.
- Nothing shipped since the last brief; the builder's last four runs each found every ready ticket still inside its veto window.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (24 days; In Dev since 15 Oct). No pushed branch and no local worktree names it (checked this run); nothing has touched the ticket since 8 Nov. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- All green: the live site serves the latest game build (80720d45; the one newer commit is docs only), checks on main and the 3 scheduled background jobs pass, no PRs are waiting, all 10 scheduled tasks are on time, and engine speed is normal (141 ms/tick, -2% on the 7-day median).
- The overnight quiet from 23:04 to 07:49 UTC is normal and needs nothing.
