# Briefing
**Generated:** 2026-09-22 14:00 local (12:00 UTC) · keep-work-flowing-cc

## The one thing

**The machine that builds has now failed four times running, and only you can restart it.** Either top up at [claude.ai usage settings](https://claude.ai/settings/usage), or say the word in a chat and a session moves that lane onto a different model.

The 13:11 local attempt died after seven seconds on the same message as the three before it — *"You've reached your Fable limit."* That makes **10:11, 11:11, 12:11 and 13:11**, four hours with nothing built. The next attempt is 14:10 and will do the same.

**Nothing has been lost, and that is the only reason this is not urgent.** The builder is dead, but the shelf it would draw from is empty anyway — so there is currently nothing for it to fail to build. **The two problems are hiding each other.** Fix the design shortage alone and finished designs pile up with no builder; fix the builder alone and it finds an empty shelf within the hour. The builder is minutes and only yours; the design hour below is next.

*— the same call, independently, from tb-orchestrator.*

## Also waiting (6)

- **[One design hour on THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) — are scenes being handed to exactly the mortals who will refuse them?** Unchanged, and still the only thing that refills the shelf; second in order only because the builder must be alive to receive what it produces. Detail in [`user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **May a lane draft a design doc on its own?** Your [6 August rule](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) rests on a model choice that has since changed; a yes would let the planning lane write first drafts instead of leaving the shelf empty. *(Corrected: last hour's brief pointed this line at the wrong ticket — this ask has no ticket of its own.)*
- **[Turn off Linear's auto-complete for sub-issues](https://linear.app/threadbare/settings/teams/THR/general)** — it erased five pieces of unbuilt work in four hours on Sunday; all recovered, and a note on the ticket did not stop it.
- **[Finish the review sitting](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — two encounters left, screen clean: [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Were the stops deliberate?** — four lane-silence episodes, all ended. Today's repeated credit failure is now the strongest evidence for the usage-limit explanation you gave in August; the question has narrowed to Monday's daytime stop.
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter give them, or does the fog stay honest? Silence leaves it as-is.

## Queue

**Starved — 0 ready to build, and the one job in flight still cannot move.**

- **Ready to build: nothing.** Unchanged for four hours. [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) (traits wave 2, slice 3 — artifact traits) was the last item off the shelf.
- **In flight: THR-1521, claimed 10:21 local and untouched since** — last edited 10:21, re-read live this run. The builder that took it died sixteen minutes later on the credit limit. No branch, no pull request. The twice-daily stale-claim sweep runs at **14:00 local — within the hour** — and releases it.
- **28 items in Todo, none promotable.** 15 are wayfinder decision tickets waiting on you; of the remaining 13, every one waits on a design call rather than on another job. That is the shape behind both asks above, unchanged for eight hours.

## Health

- **The builder lane is dead, not stumbling** — four consecutive failures on the same credit message. Nothing lost: no branch, no half-finished work, nothing queued for it to build. Only this lane is affected; the planning and briefing lanes run a different model and are running normally.
- **The slow post-merge test job is green on the current tip, and no fix is owed** — re-verified independently this run, not carried over. `f3f9fb60` failed on its push run at 09:27 local and **passed on the scheduled re-run at 10:32**. Two test files time out intermittently under load; that is a known, already-tracked nuisance. The automated probe still reads this as "red" because it looks at the push run — the probe is wrong here, not the code.
- **Lane silence — the weekend gap stays declined**, per your 8 August and 11 September rulings. The worst episode (25.1h) ran Saturday 11:33 → Sunday 12:37 local, squarely weekend-shaped. Monday's daytime stop is what keeps the standing question open.
- **Everything else green.** No pull requests open or waiting; the live site is serving the newest commit (`f3f9fb60`); CI and the Linear auto-close job are green; all 9 scheduled tasks are within a slot of schedule; the git reaper ran at 13:40 local; the home checkout is level with `origin/main`; engine tick cost is 68 ms/tick, 5% *under* the 7-day median of 72.
