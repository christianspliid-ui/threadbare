# Briefing
**Generated:** 2026-08-11 22:55 local (20:55 UTC) · keep-work-flowing-cc

## The one thing

**Did you switch the two work lanes off?** One word either way.

An hour ago nine scheduled jobs were enabled. Two are now off: **`tb-opus-pickup`** (the lane that actually builds things) and **`tb-orchestrator`** (the lane that decides what gets built next). The orchestrator's 20:25 slot did not fire, so the switch is real and not a display quirk. Nothing recorded why.

- **If you turned them off** — say so and it gets written down, and the nightly-silence question below closes with it. Given you told the lanes on 2026-08-10 to stop filing cleanup work, switching off the lane that drains it is a coherent thing to have done deliberately.
- **If you didn't** — then the machine stopped on its own and it gets investigated as a real stoppage.

This sits above everything else on the list because **while the build lane is off, nothing on the board moves** — including whatever your verdicts below turn into. The same question also covers the ~20.6h silence overnight (2026-08-10 21:57 → 2026-08-11 18:32 local), which has the same two candidate answers: you paused it, or you hit plan limits.

## Also waiting (6)

- **[THR-907](https://linear.app/threadbare/issue/THR-907) / [THR-974](https://linear.app/threadbare/issue/THR-974) — the play sitting, two verdicts over the same five encounters.** Still the highest-value *creative* thing you can do, and still the only thing that refills the shelf with real work. Every encounter in the game now runs the format you locked. [Bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass) · [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- **[THR-998](https://linear.app/threadbare/issue/THR-998) — action cards print a risk that isn't real.** Three options; the recommendation is (b), stop printing a danger word where the danger can't vary.
- **[THR-962](https://linear.app/threadbare/issue/THR-962) / [THR-961](https://linear.app/threadbare/issue/THR-961) — two small sound decisions.** Need your ears, not a screen.
- **Does the encounter ending appear on its own now?** **No reply needed if it works.**
- **A Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

Detail on all of these: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**21 ready, 0 in flight, nothing parked** — and the shelf was pruned hard this hour, from 36. Around 20:25 a pass applied your materiality bar retroactively: **~16 sub-bar process tickets were canceled** and folded into two that state a predicate instead — [THR-1089](https://linear.app/threadbare/issue/THR-1089) (one dead-code prune sweep replacing seven separate prune tickets) and [THR-1090](https://linear.app/threadbare/issue/THR-1090) (grooming should judge a ticket's worth, not just its form). That is the 2026-08-10 throttle landing on the backlog it was written for, and it is the right direction.

**What is left is still 21 items of cleanup and zero feature or content work.** That has not changed and cleanup cannot fix it — the shelf refills from your verdicts above, not from the board. Only [THR-991](https://linear.app/threadbare/issue/THR-991) is past 7 days untouched (8), and it blocks nothing.

**[THR-1071](https://linear.app/threadbare/issue/THR-1071) shipped 25 minutes ago** — mercy no longer makes people crueller ([PR #1401](https://github.com/christianspliid-ui/threadbare/pull/1401)). **The part that was genuinely your call got decided without you, legitimately, and I want you to know which way**: the stone set was **exempted** from the sign flip and given the opposite remedy rather than having its value pair renamed. The executor's own measurement also corrected the ticket's premise — the real split was 35 templates needing one fix and 5 stone needing the other, not "37 of 40". Say the word if you'd rather stone had been renamed; nothing downstream depends on it yet.

## Health

- **Two scheduled lanes are switched off** — the lead ask above. Everything else that runs on a timer is on schedule.
- Deploy, GitHub Actions and the scheduled workflows are green; the live site is serving the newest commit (`eabbc173`). Linear read the board normally this run.
- The home tree is clean and current with `main`.
- Two abandoned worktrees still flagged for disposition by the reaper. Standing housekeeping, no action.
