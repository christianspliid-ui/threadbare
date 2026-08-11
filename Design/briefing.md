# Briefing
**Generated:** 2026-08-12 00:55 local (2026-08-11 22:55 UTC) · keep-work-flowing-cc

## The one thing

**Did you switch the two work lanes off?** Still the only thing I need from you, and one word either way closes it.

**`tb-opus-pickup`** (the lane that builds things) and **`tb-orchestrator`** (the lane that decides what gets built next) are both switched off. Since the last brief the orchestrator has missed 00:25 as well — three slots now — and the build lane has missed 00:01, its second. Nothing on the board has moved in three hours.

- **If you turned them off** — say so, it gets written down, and the overnight-silence question closes with it. You told the lanes on 2026-08-10 to stop filing cleanup work; switching off the lane that drains it is a coherent thing to have done on purpose.
- **If you didn't** — the machine stopped on its own, and it gets investigated as a real stoppage rather than sitting here being asked about every hour.

This stays above everything else because **while the build lane is off, nothing on the board moves** — including whatever your verdicts below turn into. The same question also covers the ~20.6h silence of 2026-08-10 21:57 → 2026-08-11 18:32 local: same two candidate answers, you paused it or you hit plan limits.

## Also waiting (6)

- **[THR-907](https://linear.app/threadbare/issue/THR-907) / [THR-974](https://linear.app/threadbare/issue/THR-974) — the play sitting, two verdicts over the same five encounters.** The highest-value *creative* thing you can do, and the only thing that refills the shelf with real work. [Bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass) · [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- **[THR-998](https://linear.app/threadbare/issue/THR-998) — action cards print a risk that isn't real.** Three options; the recommendation is (b), stop printing a danger word where the danger can't vary.
- **[THR-962](https://linear.app/threadbare/issue/THR-962) / [THR-961](https://linear.app/threadbare/issue/THR-961) — two small sound decisions.** Need your ears, not a screen.
- **Does the encounter ending appear on its own now?** **No reply needed if it works.**
- **A Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

Detail on all of these: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**21 ready, 0 in flight, nothing parked** — unchanged for three hours, which is exactly what a switched-off build lane looks like.

**All 21 are cleanup; none is feature or content work.** Last night's hard prune (36 → 21, your materiality bar applied retroactively) fixed the *shape* of the shelf, not its emptiness — [THR-1089](https://linear.app/threadbare/issue/THR-1089) and [THR-1090](https://linear.app/threadbare/issue/THR-1090) now carry what sixteen sub-bar tickets used to. The shelf refills from your verdicts above, not from the board. Only [THR-991](https://linear.app/threadbare/issue/THR-991) is past 7 days untouched (9), and it blocks nothing.

## Health

- **The two switched-off lanes are the only non-green signal** — the lead ask above. All seven still-enabled timed jobs are within schedule.
- Deploy, GitHub Actions and the scheduled workflows are green; the live site is serving the newest commit (`eabbc173`). Linear read the board normally this run — the connector outage earlier today has stayed closed.
- The home tree is clean and current with `main`. The worktree reaper ran at 00:40.
- Two abandoned worktrees still flagged for disposition. Standing housekeeping, no action.
