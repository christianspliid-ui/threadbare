# Briefing
**Generated:** 2026-09-07 11:52 local (09:52 UTC) · keep-work-flowing-cc

## The one thing

**Say *"batch 2, run the six"*.** Nothing has changed since the last brief except the count: the build shelf has now been empty for **six straight runs** — since 07:30 this morning — and there is still nothing behind it. Zero items ready to build, zero live, and the only two items in flight are both parked on answers from you.

Six camp encounters go through the factory line the same hour, unattended, no session from you. Brief: [Retrofit batch 2 — the camp six](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) · ticket: [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · execution: [THR-1222](https://linear.app/threadbare/issue/THR-1222).

Two yes/no questions live in the brief — **repair the six in place, or re-roll them from fresh premises?** (repair is the plan; the grooming and orchestrator lanes each reached that recommendation independently) and the **2-of-6 sample**, `ward_the_camp` and `tend_to_wounds`. *"Batch 2, run the six"* · *"re-roll them"* · *"put shrine_offering back in."*

## Also waiting (14)

- [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants) — the undertaking retirement list: 60 of 64 absorbed, **4 deleted**. You asked to see it before anything goes. *"Run 4b"* finishes the migration.
- [THR-1398](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) — the division rule now has a [one-page mock](https://claude.ai/code/artifact/cd0c4d40-ef9d-48da-9bf7-00fc2f2fef87): two tables, three worked callings. First question of [the undertakings map](https://linear.app/threadbare/issue/THR-1396), unblocks four others.
- [THR-1424](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct) — what should a proportion read as? Recommendation: **drop both numbers** rather than invent a language. Covers ten readouts via [THR-1426](https://linear.app/threadbare/issue/THR-1426).
- [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — are you still planning to design Traits wave 2? 23 days In Design, assigned to you, no plan doc. Either answer ends the asking.
- [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — the incident-capture button you filed yourself on 16 August. Yes puts it at the front of the design queue; no closes it.
- [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — seven open, and settling [two](https://linear.app/threadbare/issue/THR-1263) [of them](https://linear.app/threadbare/issue/THR-1264) opens three more by themselves.
- [Twenty spells](https://linear.app/threadbare/issue/THR-1232) / [thirty items](https://linear.app/threadbare/issue/THR-1236) — a session builds the sketch, your reaction is the decision.
- [THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five off-doctrine scene images. The real question underneath: **should image spends be gated on you at all**, or decided by the lane and reported after?
- [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — does a run's spine come from what the god remembers, or from a named campaign? Nothing downstream waits.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one attended dev-server session, ~20 minutes, nineteen captures. Both reasons last attempt went badly are now fixed and shipped.
- [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — chartering the hub map. Advice unchanged: **wait**; your slice checkpoint is its entry condition.
- Should weekend quiet be normal too? The machine was off Friday 16:28 → Sunday 13:22 and resumed on its own. One word rules on it the way you ruled on nights.
- A Tenacious-style trait — parked option, no ticket, nothing waits on it. Listed so it is not silently forgotten.
- Set `LINEAR_API_KEY` in the machine environment — the durable fix for Friday's connector outage. Linear is working again on its own, so this is insurance, not repair.

## Queue

**Starved — 0 ready to build, 0 live.** Two items in flight ([THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants), [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)) are both `Parked`, both on asks above — so the executor's one build slot has now been free with nothing to fill it for six runs.

- **One item arrives on its own tomorrow.** [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) is deliberately date-gated to **2026-09-08** and is promotion-ready the moment the window opens — no blockers, no assignee, coordination block already written. It is the only thing on the board with a known arrival time, and it needs nothing from you.
- Behind the shelf otherwise: **2 In Design** ([THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools), [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)), **0 in Implementation Planning**.
- Agent-owned, not yours: this hour's orchestrator run corrected a wrong severity claim standing on [THR-984](https://linear.app/threadbare/issue/THR-984/npm-run-lintplan-doc-with-no-args-lints-zero-files-and-always-reports) — the plan-doc lint is advisory at every call site it has, never blocking. Measured: 3 of 131 recent plan docs carry an error, so the ticket stays Low. Routed to the Friday retro, no ticket filed.

## Health

All green — deployment live on the latest commit (`e4e3706a`), CI and all three scheduled jobs passing, no PRs waiting to merge, all nine lanes on schedule, engine tick cost 71 ms/tick (31% *below* its 7-day median).

- Agent-side, nothing at risk: the shared home checkout is 22 commits behind `origin/main` (yesterday 19:41). It is the read-only mirror — nothing is stranded on it, and every lane branches from `origin`.
