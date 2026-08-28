# Briefing
**Generated:** 2026-08-29 00:55 local (22:55 UTC) · keep-work-flowing-cc

## The one thing

**Play two encounters, then approve the batch-2 brief — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) + [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine).**

Unchanged. Nothing merged this hour and nothing new arrived, so the shelf is exactly where the last brief left it: **seven items, none of them encounter writing.** This ask is still the only route by which any reaches it.

About five minutes. Open the *good ending* links first:

- The Grateful Kin — [play](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success)
- The Unsafe Bridge — [play](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success)

The question is yours: *are they worth meeting twice?* Then [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) needs one word — *"batch 2, seven is fine"*, *"keep it six"*, or *"same rule — judge batch 2 on one first."*

## Also waiting (10)

Unchanged since last hour — skip if you have read them. Detail in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

- **More design hours — still the constraint.** [Card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (9 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (13 days) hold the one design slot. **Sit one, or say "park it."** Four plan-doc sessions are behind them.
- **One word players see — [THR-1314](https://linear.app/threadbare/issue/THR-1314/ul-proposal-work-holding-kind-row-christening-failure-name-register).** A strained company reads as **holding**; the ownership work wants **a holding** to be an owned thing. Unless you say otherwise the newer word moves. Reversible; the ticket does not wait.
- **[The Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — nine questions, all yours; every research question it carried is finished. [How a duel ends](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) and [what a wound costs](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) release three more.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) and [thirty items](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to)** — sketches a session builds for you to react to. Cheapest of the maps.
- **[Image credits](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — should the spend be gated on you at all? Your answer settles every batch after.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)** — remembrance, or named campaigns. Nothing downstream waits.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nine shipped surfaces owed screenshots; bundles into whichever sitting you approve the brief in.
- **[A held breath on committing a nudge?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)** — pure feel; two lanes recommend no, and an agent will retire it and report unless you say otherwise.
- **Chart the hub map** — advice is still to wait one cycle, until your [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220) validates the base.
- **A Tenacious-style trait** — parked, no urgency, listed so it is not silently forgotten.

## Queue

**7 items Ready for Dev — healthy, but thin and mostly Low. Nothing merged this hour.**

- **One new claim, no completions.** A session picked up [the run-founded faction bug](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) — a faction founded during play shows as a generic placeholder everywhere in the interface — and opened its PR at 00:23 local. It is red on the same blocked check as the handbook diet (see Health), so neither has landed.
- **In Dev: 5, two of them live** — the faction fix above and [the handbook diet](https://linear.app/threadbare/issue/THR-1336/claudemd-diet-gate-law-and-sandbox-lore-move-to-canonops-pages-with). The other three are your parked standing asks ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)); park shape verified intact this run.
- **The shelf: one High** ([a claim-rule gap in the pickup lane](https://linear.app/threadbare/issue/THR-1325/pull-works-claim-predicates-miss-two-live-states-a-lane-resumes-a-live)), two Medium, four Low — and **still no encounter writing at all**.

## Health

**The merge lane has stopped, and last hour's "just a flake" verdict was wrong. Nothing needs you — this is the executor lane's to fix.**

- **One test is now blocking every open PR.** `debugTickBatch.test.ts > clamps a request above DEBUG_TICK_MAX` times out at its 180-second ceiling. It has now done so on **three CI runs across two unrelated branches** — [the handbook diet](https://github.com/christianspliid-ui/threadbare/pull/1704) (a docs-only change, red ~4.5 hours, failed it twice) and [the faction fix](https://github.com/christianspliid-ui/threadbare/pull/1714) (a UI change, red since 00:23). Everything else passes both times: 18,974 of 18,975 tests green.
- **Why that changes the read.** The standing note on #1704 called this a one-off caused by an overloaded test machine, and told the next session to re-run rather than touch anything. A re-run did not clear it, and it then reproduced on a different branch whose diff cannot reach that code. Two PRs deep, that is no longer machine noise — the test itself has outgrown its ceiling on CI hardware, and it will red every PR that follows until someone changes it. **The correct next action is to fix or re-scope the test, not to re-run the check again.** Auto-merge stays armed on both and cannot fire, so nothing unsafe merges meanwhile.
- Everything else is green: the live site is up to date (recent commits touched only notes and docs, so no rebuild was needed), background jobs healthy, all nine scheduled lanes on schedule, the branch reaper ran at 00:40, and the home copy of the repo is clean and current.

Unchanged and worth seeing rather than acting on: **the only lane quiet in the probe's window is overnight-shaped** — 22–23 and 23–24 August, both roughly 21:00–08:00 local, every lane stopping and resuming together. Declined under your 8 August ruling that overnight quiet is normal. Nothing was lost.
