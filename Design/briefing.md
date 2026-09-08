# Briefing
**Generated:** 2026-09-08 23:00 local (21:00 UTC) · keep-work-flowing-cc

## The one thing

**Say the word on the camp six — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to).** Five days waiting, and tonight it stopped being a queue-depth argument: **the last thing anyone was building merged an hour ago, and nothing is being built right now.** Two tickets are left on the shelf — a capability rider and a low-priority gate flip — and no agent can refill it, because everything else waiting needs either you or an attended design session.

The brief: [the camp six](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). Six encounters written in July, under the old prose doctrine. Two yes/no questions inside it — **repair them in place or re-roll from fresh premises** (repair is the plan; two lanes recommend it independently), and a 2-of-6 sample to eyeball: `ward_the_camp` and `tend_to_wounds`.

Say ***"batch 2, run the six"*** and six encounters of content work are on the queue the same hour, via [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine).

## Also waiting (11)

- [**The fight map**](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — all four research questions are answered and written up; **ten open tickets remain and every one of them is yours.** An evening, starting with [how a fight against a monster works](https://linear.app/threadbare/issue/THR-1263) and [how a fight between two people works](https://linear.app/threadbare/issue/THR-1264).
- [**The incident-capture button**](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — you filed it on 16 August; 23 days idle with nothing blocking it. Yes puts it at the front of the design queue, no closes it.
- [**Traits wave 2**](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — still In Design and assigned to you. "Yes" changes nothing and the asking stops; "not getting to it" frees a design slot.
- **Two sketches built for you to react to** — [twenty generated spells](https://linear.app/threadbare/issue/THR-1232) and [thirty generated items](https://linear.app/threadbare/issue/THR-1236). Your reaction *is* the design decision.
- [**Image credits — gated on you at all?**](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five scene images break the art rule and substitutes cover the slots. The real question is whether image spends need your yes, or get decided by the lane and reported after.
- [**What is a run about?**](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — does a run's spine come from what your god remembers, or from a named campaign the world offers? Nothing downstream waits.
- [**One attended dev-server session**](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — nineteen owed screenshots, roughly twenty minutes, no decision in it. Both reasons it went badly on 4 September are fixed.
- [**What should a proportion read as?**](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct) — *62% strength*, *62% to doom*. Recommendation: drop both numbers rather than invent a new language.
- [**Chart the hub map**](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — advice is still *wait*; only you can charter a map, so it is listed, not pushed.
- **Should weekend quiet be normal too?** — you ruled overnight quiet normal; weekends are unruled, so the silence probe keeps raising them. One word retires the noise.
- **A Tenacious-style trait** — parked option, no ticket, nothing waits on it.

## Queue

**Thin and idle: 2 Ready for Dev, nothing actively being built.**

- [THR-1440](https://linear.app/threadbare/issue/THR-1440) (capability rider) and [THR-1256](https://linear.app/threadbare/issue/THR-1256) (a low-priority gate flip) are the whole shelf. Neither is stale.
- [THR-1442](https://linear.app/threadbare/issue/THR-1442) merged at 20:07 — [PR #1859](https://github.com/christianspliid-ui/threadbare/pull/1859) — which frees the executor slot and empties the in-flight lane.
- Both In-Dev items are parked with nobody on them: [THR-1130](https://linear.app/threadbare/issue/THR-1130) is the ask above, and [THR-1392](https://linear.app/threadbare/issue/THR-1392) is shipped and awaiting a close — a lane's job, not yours.

## Health

- **"Heavy simulation tests" is red on the latest main** (~2 h). Post-merge only — the required CI check is green and the site is serving `f19fb632`. A session owes the follow-up; not your call.
- **Overnight quiet, twice.** The silence probe flags a 10 h gap (3–4 Sep) and an 18.6 h gap (7–8 Sep); both are the nightly shape you already ruled normal, so they are noted, not raised. The 45 h weekend gap it also still reports is the one waiting on your ruling above.
- Deploy, CI dispatch, merge queue, scheduled-task heartbeats and engine tick cost: all green. Tick cost is 65 ms/tick, **28% below** the 7-day median.
