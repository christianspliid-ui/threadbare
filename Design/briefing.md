# Briefing
**Generated:** 2026-09-22 15:05 local (13:05 UTC) · keep-work-flowing-cc

## The one thing

**Top up the builder's credit — and it is worth more than the last brief told you.** [claude.ai usage settings](https://claude.ai/settings/usage). Or say the word in a chat and a session moves that lane onto a different model.

Five hours, five failures, the same seven-second death each time — *"You've reached your Fable limit."* at **10:11, 11:11, 12:11, 13:11 and 14:11 local**. The next attempt is 15:10 and will do the same.

**What changed since the last brief is the size of the prize, not the failure.** The last two briefs said fixing the builder only buys an idle machine an hour, because the shelf is empty. **That was wrong.** There is a complete, designed job already claimed with the builder's name on it — [artifact traits](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), the third slice of the traits work: artifacts that carry a history, cursed things the systems can finally *see* as cursed, and the artifact sheet showing it. The builder took it at 10:21 local and died seven minutes later. **It picks that same job back up by itself the moment it can run** — nothing was lost, no code was written, nothing needs undoing.

So this is not "spend to wake an idle machine". It is a finished-on-paper slice of the game sitting unbuilt because a quota ran out five hours ago. **The design hour below is still the thing that refills the shelf afterwards — but it is genuinely second now.**

*— the same call, independently, from [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-22g.md).*

## Also waiting (6)

- **[One design hour on THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) — are scenes being handed to exactly the mortals who will refuse them?** Unchanged, and the only thing that refills the shelf once THR-1521 ships. Detail in [`user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **May a lane draft a design doc on its own?** Your [6 August rule](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md) rests on a model choice that has since changed; a yes would let the planning lane write first drafts instead of leaving the shelf bare.
- **[Turn off Linear's auto-complete for sub-issues](https://linear.app/threadbare/settings/teams/THR/general)** — it erased five pieces of unbuilt work in four hours on Sunday; all recovered, and a warning note on the parent ticket did not stop it.
- **[Finish the review sitting](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — two encounters left, screen clean: [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Were the stops deliberate?** — four lane-silence episodes, all ended, none since Monday 17:41 local. Today's five credit failures make the usage-limit explanation you gave in August stronger still; the open half is Monday's daytime stop.
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter give them, or does the fog stay honest? Silence leaves it as-is.

## Queue

**Starved — nothing ready to build, for a sixth hour.**

- **Ready to build: 0.** Read live this run, and matching [tb-orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-22g.md)'s independent count at 14:30 local. [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) merged and closed this morning; [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) was the last item off the shelf.
- **In flight: THR-1521, claimed 10:21 local and untouched since.** No branch, no pull request, nothing half-written. **Correction to the last brief:** the twice-daily stale-claim sweep does *not* run at 14:00 local — its slots are roughly **06:28 and 20:07 local**, and today's morning run failed before the claim existed. So the claim sits until ~20:07, and the builder would reclaim it by itself before then if it could run. Nothing turns on this: the same credit top-up clears both.
- **28 items in Todo, none promotable.** 15 are wayfinder decision tickets waiting on you; of the other 13, every one waits on a design call rather than on another builder. That shape is unchanged for ten hours and is the reason both asks above exist.

## Health

- **The builder lane is dead, not stumbling** — five consecutive failures on the identical credit message, 08:11Z through 12:11Z. Isolated to that one lane: the planning, grooming and briefing lanes run a different model and all fired on schedule.
- **The slow post-merge test job is green on the current tip, and no fix is owed** — re-verified against GitHub this run, not carried over. `f3f9fb60` failed its **push** run at 09:27 local and **passed the scheduled re-run on the same commit at 10:32**. Two test files time out intermittently under load, already tracked. The automated probe reads "red" because it looks at the push run only — the probe is wrong here, not the code.
- **The stale-claim sweep failed its 06:28 local run** (1 of its last 5). An executor's fix, not yours; it costs nothing today because the only claim it would release is the one the builder will take back itself.
- **Lane silence stays declined** under your 8 August and 11 September rulings — the worst episode (25.1h) ran Saturday 11:33 → Sunday 12:37 local, squarely weekend-shaped. The weekday daytime portions are folded into the standing question above rather than re-asked.
- **Everything else green.** No pull requests open or waiting; the live site is serving the newest commit ([`f3f9fb60`](https://github.com/christianspliid-ui/threadbare/commit/f3f9fb60948263b03a816c20593117d8080b1e69)); CI and the Linear auto-close job green; all 9 scheduled tasks within a slot of schedule; the git reaper ran at 14:40 local; the home checkout is level with `origin/main`; engine tick cost **64 ms/tick, 10% under** the 7-day median of 71.
