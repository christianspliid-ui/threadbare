# Briefing
**Generated:** 2026-09-10 19:05 local (17:05 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2?** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Seventh hour, and the shelf is now down to its last two items. **Five more tickets went Done in the past hour** — the tick-timestamp wording, the raw-tick-count sweep, and three docs-gate fixes. What is left to build is [two low-priority leftovers](https://linear.app/threadbare/issue/THR-1451) about [wording numbers on screen](https://linear.app/threadbare/issue/THR-1452), both filed half an hour ago, both an hour or two of work. After those, nothing.

New program work comes from a design pass. The design bench holds one job at a time. That seat is THR-790 — **In Design, assigned to you, no plan doc, unmoved since 15 August (26 days)**. Verified live this run.

**One word.** *Yes* changes nothing and the asking stops. *Not getting to it* frees the seat and four queued design jobs start moving. *(Only the `Parked` label frees it — unassigning does not.)*

## Also waiting (9)

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) — sample two of the camp six.** A review, not a gate; batch 2 shipped on your 09-09 approval. [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds).
- **Six glossary words nobody but you may seat** — say *"delegate it"* (recommended) or *"send me the six"*. [hold](https://linear.app/threadbare/issue/THR-1449) · [cast](https://linear.app/threadbare/issue/THR-1445) · [agreement](https://linear.app/threadbare/issue/THR-1441) · [motive gate](https://linear.app/threadbare/issue/THR-1408) · [composition contract](https://linear.app/threadbare/issue/THR-1406) · [motive receipt](https://linear.app/threadbare/issue/THR-633).
- **Rule on the backlog** — ~eleven items stop at a question, not a developer. Say *"rule on the backlog"*.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133) — nineteen screen captures owed**, one attended dev-server hour. Unblocked since the debug fixes landed.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258) — ten open, all yours.** Best two ways in: [fighting a monster](https://linear.app/threadbare/issue/THR-1263), [two people fighting](https://linear.app/threadbare/issue/THR-1264).
- **Two sketches waiting to be built for you to react to** — [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236).
- **[THR-876](https://linear.app/threadbare/issue/THR-876) — should image-credit spends be gated on you at all?** Your answer settles five quarantined plates and every batch after.
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198) — what is a run *about*?** Remembrance, or a named campaign the world offers.
- **Are weekend-long quiet spells normal?** You ruled overnight quiet normal; weekends are unruled, so the probe keeps raising the 44.9 h gap from 09-04.

Detail and links for each: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Thin — 2 ready, 1 in flight.** Both ready items are Low-priority `Deferral`s filed at 16:31 in the same sweep; there is no substantial build work behind them. This is what the lead ask is about.

- [THR-1451](https://linear.app/threadbare/issue/THR-1451) — the rest of the percentage sweep (deltas, odds, chrome). Low.
- [THR-1452](https://linear.app/threadbare/issue/THR-1452) — the top bar's year disagrees with the engine's clock threefold. Low. *The orchestrator lane queued the fix as "show the real year" and left you a veto: if you'd rather the seasons actually turned three times as often, that is a game-feel call and it's yours — say so and it gets filed separately. Otherwise nothing is needed.* — from `tb-orchestrator`
- **Parked, and unreachable where it sits:** [THR-1130](https://linear.app/threadbare/issue/THR-1130) is `In Dev` + `Parked` + unassigned (~9 h). Its park was discharged when [THR-1446](https://linear.app/threadbare/issue/THR-1446) shipped at 09:52 — batch 3 is ready to run — but `pull-work` only sees `Ready for Dev`, so no lane will pick it up in that shape. Nothing is owed by you; a session or the daily grooming pass unparks it.

## Health

- **"Heavy simulation tests" is red on the latest `main`** (~2 h). Post-merge, non-required — `main` is not blocked and the required CI check is green. A follow-up fix is owed by a session, not by you.
- Everything else green: deploy is serving `main` (`71221870`), automated checks healthy, no PRs waiting to merge, all 9 scheduled lanes on schedule, the stale-git reaper ran 14 minutes ago, tick cost healthy (97 ms/tick, +15% on a 25% line).
