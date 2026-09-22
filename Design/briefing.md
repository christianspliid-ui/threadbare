# Briefing
**Generated:** 2026-09-22 13:00 local (11:00 UTC) · keep-work-flowing-cc

## The one thing

**The machine that builds has been dead for three hours, and only you can restart it.** Either top up at [claude.ai usage settings](https://claude.ai/settings/usage), or say the word in a chat and a session moves that lane onto a different model.

Its last three runs — **10:11, 11:11 and 12:11 local** — all stopped on the same message: *"You've reached your Fable limit."* The first died sixteen minutes in, having just claimed a job; the other two lasted seven and eight seconds. The next attempt is 13:10 local and will do the same.

**This has overtaken the design hour, and the reason is worth a sentence.** For five hours the lead ask here was an hour of your time on THR-1525, because design supply was the wall. It is not the wall this hour: a design hour produces a job, and there is nothing alive to build it. **The two problems are currently hiding each other** — the builder is dead, but the shelf it would pull from is empty anyway, so nothing is being lost right now. Fix either one alone and the other becomes the wall within the hour. The builder is minutes and yours; the design hour is next.

*— the same call, independently, from tb-orchestrator.*

## Also waiting (6)

- **[One design hour on THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) — are scenes being handed to exactly the mortals who will refuse them?** Unchanged and still the only thing that refills the shelf; second in order only because the builder must be alive to receive what it produces. Detail in [`user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **[May a lane draft a design doc on its own?](https://linear.app/threadbare/issue/THR-1525)** — your 6 August rule rests on a model choice that has since changed; a yes would let the planning lane write first drafts instead of leaving the shelf empty.
- **[Turn off Linear's auto-complete for sub-issues](https://linear.app/threadbare/settings/teams/THR/general)** — it erased five pieces of unbuilt work in four hours on Sunday; all recovered, and a note on the ticket did not stop it.
- **[Finish the review sitting](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — two encounters left, screen clean: [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Were the stops deliberate?** — four lane-silence episodes, all ended. Today's credit failure is now strong evidence for the usage-limit explanation you gave in August; the question has narrowed to Monday's daytime stop.
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter give them, or does the fog stay honest? Silence leaves it as-is.

## Queue

**Starved — 0 ready to build, and the one job in flight cannot move.**

- **Ready to build: nothing.** Unchanged for three hours. [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) (traits wave 2, slice 3 — artifact traits) was the last item off the shelf.
- **In flight: THR-1521, claimed 10:21 local and untouched since.** The builder that took it died sixteen minutes later on the credit limit. No branch was pushed and no pull request exists — verified this run, not assumed. The twice-daily stale-claim sweep (next 14:00 local) releases it.
- **28 items in Todo, none promotable.** 15 are wayfinder decision tickets waiting on you; of the remaining 13, every one waits on a design call rather than on another job. That is the shape behind both asks above, unchanged for seven hours.

## Health

- **The builder lane is dead, not stumbling** — three consecutive failures on the same credit message, detailed above. Nothing has been lost: no branch, no half-finished work, and nothing queued for it to build. This lane is the only one affected; the planning and briefing lanes run a different model and are running normally.
- **Correction to this morning's brief: the slow post-merge test job is *not* red, and no fix is owed.** It reported "Heavy simulation tests has been failing on the newest commit for about four hours, and the fix it needs is owed". That was wrong. The same commit (`f3f9fb60`) **failed on the push run at 09:27 local and passed on the scheduled re-run at 10:32** — verified against GitHub this run. The code is green; two test files time out intermittently under load, which is a known nuisance and already tracked. Nobody owes work here. *— the correction originated with tb-orchestrator; this run confirmed it independently before repeating it.*
- **Lane silence — the weekend gap stays declined, per your 8 August and 11 September rulings.** The worst episode (25.1h) ran Saturday 11:33 → Sunday 12:37 local, squarely weekend-shaped. Monday's daytime stop is what keeps the standing question open, and today's credit failure makes the usage-limit explanation considerably more likely than a machine fault.
- **Everything else green.** No pull requests open or waiting; the live site is serving the newest commit (`f3f9fb60`); CI and the Linear auto-close job are green; all 9 scheduled tasks are within a slot of schedule; the git reaper ran at 12:40 local; the home checkout is level with `origin/main`; and engine tick cost is 68 ms/tick — 6% *under* the 7-day median of 72.
