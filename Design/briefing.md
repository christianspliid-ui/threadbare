# Briefing
**Generated:** 2026-08-11 21:57 local (19:57 UTC) · keep-work-flowing-cc

## The one thing

**Play the five encounters and give the two verdicts.** Unchanged, still the highest-value thing you can do — and as of ten minutes ago it is a verdict on a *finished* thing: the last encounter still using the old authored-choices format converted this hour, so every encounter in the game now runs the format you locked on 2026-08-09.

- [The bargain at the crossroads](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads) · [Riders behind the caravan](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan) · [Snow on the pass](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass) · [The swindled family](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family) · [The unsafe bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)

**[THR-907](https://linear.app/threadbare/issue/THR-907) — the four-part verdict:** does the prose read clear, does the firing rhythm work, is the interface gamey enough, and is deciding actually fun.

**[THR-974](https://linear.app/threadbare/issue/THR-974) — the consequence verdict:** play a hand to its ending and say whether the change to the world is *visible*, and whether it feels like it **happened in the world** rather than being announced at you.

*"Needs another iteration" is a valid answer to any of it.* Add `&outcome=critical_failure` (or `success`, `failure`, `near_miss`, `success_at_cost`, `critical_success`) to any link to jump straight to that ending.

## Also waiting (6)

- **[THR-1071](https://linear.app/threadbare/issue/THR-1071) — mercy currently makes people crueller, and it entered the dev queue this hour.** In 37 of 40 converted dilemmas the merciful choice pushes the character *toward* ruthlessness. It moved from Todo into the dev queue at 21:10, which changes the shape of this ask: if you don't rule, an executor will pick a remedy itself and record it — that is the standing rule for unambiguous bug fixes. The part that is genuinely yours is the tail: whether the stone set is exempted, or its value pair gets renamed instead. Detail in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md#2-mercy-currently-makes-people-crueller-thr-1071).
- **[THR-998](https://linear.app/threadbare/issue/THR-998) — action cards print a risk that isn't real.** Three options; the recommendation is (b), stop printing a danger word where the danger can't vary.
- **[THR-962](https://linear.app/threadbare/issue/THR-962) / [THR-961](https://linear.app/threadbare/issue/THR-961) — two small sound decisions.** Need your ears, not a screen.
- **Was last night's automation pause deliberate?** One line either way — if you paused it or hit plan limits, a marker gets dropped and the probe stops asking.
- **Does the encounter ending appear on its own now?** Both halves of the 2026-08-06 bug shipped. **No reply needed if it works.**
- **A Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

## Queue

**Backed up — 36 ready, 0 in flight, nothing parked.** [THR-1086](https://linear.app/threadbare/issue/THR-1086) shipped this hour ([PR #1400](https://github.com/christianspliid-ui/threadbare/pull/1400)): the Apotheosis — the apex ascension beat — converted off authored choices, which completes the WS5 conversion program. I checked the claim rather than taking the ticket's word for it: no encounter template authors that field any more.

**That also empties the shelf again.** THR-1086 was the only real content work on it, and it is now Done. What remains is [THR-1071](https://linear.app/threadbare/issue/THR-1071) (waiting on the call above) and 35 Low-priority cleanup items. **The feature pipeline needs design input or you** — the fix for an empty shelf is upstream supply, not more cleanup. Six items have sat untouched more than 7 days, oldest [THR-847](https://linear.app/threadbare/issue/THR-847) at 13; all dead-code cleanup, none blocking anything.

## Health

- **The home tree's `node_modules` is still empty** — no build or test tooling runs in the repo root at all. Lanes work around it in their own worktrees so nothing is stopped, but every lane pays for it, and the reaper flags it on every pass. A session needs to run `npm install` there. Executor-side, not yours.
- Deploy, GitHub Actions, scheduled workflows and all 9 scheduled tasks are green; the live site is serving the newest commit. The one open PR ([#1114](https://github.com/christianspliid-ui/threadbare/pull/1114)) is on hold on purpose, per your content-migration pause.
- The Linear connector, which locked every lane out of the board this morning, is working again — this run read the board normally.
- Two abandoned worktrees are still flagged for disposition by the reaper. Standing housekeeping, no action.
