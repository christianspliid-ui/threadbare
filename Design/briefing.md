# Briefing
**Generated:** 2026-11-17 13:58 local (12:58 UTC) · keep-work-flowing-cc

## The one thing

**What should the design lane plan next?** Everything agreed is now built. **Your play changes the First's story, but nothing you can do yet changes how the age ends.** A played run ends differently from one nobody plays on all 3 test worlds, but only in the First's story: the Ordeal, the Apotheosis, and whether the First becomes your Aspect ([the measurement](https://linear.app/threadbare/issue/THR-2205/measure-whether-the-player-matters-a-run-nobody-plays-and-a-run-played)). The census that plays the new Doom and rival answers ([THR-2243](https://linear.app/threadbare/issue/THR-2243/the-agency-census-answers-the-clocks-a-third-arm-that-holds-stay-the)) found that Stay the Unmaking barely slows Doom, and that every run was already inside Doom's last stage before its census ended. This morning's fix to Stay (below, under *Decided for you*) makes that one answer work as designed. It does not change the bigger picture. **Reply with a system or a direction.** "Make the god able to change how the age ends" is one natural answer. If you say nothing, the builders stay mostly idle until the next warm playtest round. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-17.md) and [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-17a.md)*

## Also waiting (12)

- **Should every one of Kael's chapters give you a hand?** Say "every chapter asks" or "keep theirs alone" ([THR-2174](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows)). The design lane leans "every chapter asks". *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-17.md)*
- **Pick the carved icon shapes** for the five open icon classes ([THR-1908](https://linear.app/threadbare/issue/THR-1908/christian-picks-carved-shapes-for-the-five-open-icon-classes-doom), on [the review sheet](https://claude.ai/artifact/X9woLDsYia4iP3uQkk6QjN)) and the Inspector tabs with none yet ([THR-2104](https://linear.app/threadbare/issue/THR-2104/christian-picks-carved-shapes-for-the-inspectors-tabs-with-no-icon-yet)).
- **Sunday 8 to Thursday 12 Nov:** silent for 103 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Set the Claude app to open when Windows starts** ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start** ([the story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b), for [THR-2106](https://linear.app/threadbare/issue/THR-2106)).
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Wednesday 21 to Friday 23 Oct:** silent for 48 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Sunday 18 to Monday 19 Oct:** silent for 23 hours, with no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)).
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Stay the Unmaking lands crooked every time](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it): **Stay gets easier to cast, and its card says "uncertain" instead of "favorable".** Today a god with no star affinity never holds the hour cleanly (0 clean casts in 400). The seeded Witness is such a god, and so are two of the three census gods. After the change that god lands clean about a third of the time, and a star god about 60%. Doom slows about half again as much per held day for the off-star god. The other landings stay crooked, as the card's design wants. Say "Stay should be equally easy for every god" and it gets its own plan to roll in the god's best reach instead of star. Say "Doom should only be answered crookedly" and the change is dropped. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-17a.md)*

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Starved: one ticket in Ready for Dev, held until 21:20 local today.** [THR-2244](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it) (make Stay the Unmaking easier, card says "uncertain") sits in its veto window until 20:20 UTC, and the first builder run after that takes it. The builder's last three runs (to 13:52) stood down for exactly that reason, which is correct. Two more design tickets wait in Todo for the design lane: [give both clocks a verb](https://linear.app/threadbare/issue/THR-2202/give-both-clocks-a-verb-the-mortals-deeds-fill-the-mandate-and-doom) and [put the god in the climax](https://linear.app/threadbare/issue/THR-2204/put-the-god-in-the-climax-the-journey-visions-read-from-the-scene-the).

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (28 days; last touched 8 Nov). No pushed branch holds work for it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- **Every lane was silent Sunday from about 09:57 to 21:48 local (11.8 hours).** It was a Sunday, so per your weekend ruling this is not its own ask. It is one more case for the "open at login" setting.
- Everything else is green. The live site is current: commits since its last build (b0f047b7) only touched notes and docs. Checks on main, the heavy tests and the 3 scheduled background jobs pass. No PRs are waiting. All 10 enabled scheduled tasks are on time. Engine speed is normal (161 ms per tick, 6% above the weekly median of 152). The worktree reaper ran at 13:40. Linear was read live this run. You have sent no Discord messages since the last brief. The home copy of the repo is current with main.
