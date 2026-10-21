# User Action Required

**Last updated:** 2026-10-21 17:58 local (15:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 12–13 Oct overnight (03:57–13:57), Thursday 15 Oct (14:50–20:44), Friday 16 into Saturday 17 Oct (18:31–11:34, 21 jobs ready), and **Sunday 18 into Monday 19 Oct (20:26 Sunday – about 19:42 Monday, 25 jobs ready)**.

### Sunday 18 – Monday 19 Oct: was the app closed, or was this a pause? (new 19 Oct)

The silence check says: "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." **If the app was closed or the computer was off:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Should "Fated" be gold instead of grey? (18 Oct)

On 4 October you set the odds pill to quest-difficulty colours with Fated grey ("a sure thing needs no god"). The card's own Fated pip is gold, and a round-4 tester read grey Fated as the *worst* word. [The plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided) keeps your grey and fixes the reading with words: the legend lists the words worst to best, ending on Fated.

**Keep grey** (what happens if you say nothing), **make it gold** like its pip, or **turn the pip grey too** so both match. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-18d.md)*

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it. **If the app was closed:** just say so. **If it wasn't:** it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off. **If the app was closed:** nothing to do. **If it wasn't:** it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-21: five round-4 playtest faults fixed — spell names on the rail, icons after a rebuild, the restraint stance, the plague scene** ([THR-1979](https://linear.app/threadbare/issue/THR-1979)). Merged via [#2517](https://github.com/christianspliid-ui/threadbare/pull/2517), publishing now.
- **2026-10-21: every economic card says what it changed on a town or mortal** ([THR-1968](https://linear.app/threadbare/issue/THR-1968/gods-stake-s2-every-economic-card-says-what-it-changed-the-economy)). Merged via [#2516](https://github.com/christianspliid-ui/threadbare/pull/2516).
- **2026-10-21: undertakings in the economy, slice 3 — a trade run pays the trader** ([THR-1967](https://linear.app/threadbare/issue/THR-1967/undertakings-in-the-economy-s3-a-trade-run-pays-the-trader-and-the)). Merged via [#2515](https://github.com/christianspliid-ui/threadbare/pull/2515) and live.
- **2026-10-21: Notables and Doom say why — a fade line under finished agendas, and the doom clock explains its pace** ([THR-1965](https://linear.app/threadbare/issue/THR-1965/notables-and-doom-say-why-a-fade-line-under-finished-agendas-the)). Merged via [#2514](https://github.com/christianspliid-ui/threadbare/pull/2514) and live.
- **2026-10-21: the aftermath opens with what decided it — one cause line first, "won, at a price" everywhere, and the price always named** ([THR-1964](https://linear.app/threadbare/issue/THR-1964/the-aftermath-opens-with-what-decided-it-one-cause-line-first-won-at-a)). Merged via [#2513](https://github.com/christianspliid-ui/threadbare/pull/2513).
- **2026-10-21: pickup runs no longer run the long heavy tests inside the gate, so an engine change fits the time limit** ([THR-2003](https://linear.app/threadbare/issue/THR-2003/an-engine-diff-gate-now-runs-past-the-600-s-command-cap-so-pickup-runs)). Merged via [#2512](https://github.com/christianspliid-ui/threadbare/pull/2512) and live.
- **2026-10-21: undertakings in the economy, slice 1 — founded towns get a ruler and pay their founder, founded roads are tolled, founded guilds get a calling** ([THR-1937](https://linear.app/threadbare/issue/THR-1937/plan-doc-undertakings-in-the-economy-what-mortals-found-build-and-open)). Merged via [#2510](https://github.com/christianspliid-ui/threadbare/pull/2510) and live.
- **2026-10-21: the builder may edit the gate and CI files.** You said: *"of course you can edit the gate and ci files"*. [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) and [THR-1949](https://linear.app/threadbare/issue/THR-1949/run-the-review-gate-and-four-part-browser-evidence-only-on-engine) go back to the unattended builder.
- **2026-10-21: the map stops naming hidden elder ruins and undiscovered anomalies** ([THR-1960](https://linear.app/threadbare/issue/THR-1960/the-map-names-undiscovered-elder-ruins-place-labels-draw-for-every)). Merged via [#2509](https://github.com/christianspliid-ui/threadbare/pull/2509) and live.
- **2026-10-20: war aims S2 — regional monopolies pay rent and can embargo an enemy's towns** ([THR-1955](https://linear.app/threadbare/issue/THR-1955/war-aims-s2-regional-monopolies-pay-rent-and-can-embargo-an-enemys)). Merged via [#2508](https://github.com/christianspliid-ui/threadbare/pull/2508) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
