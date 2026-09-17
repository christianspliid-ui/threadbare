---
lane: tb-orchestrator
run: 2026-09-17e
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-17 (run e, ~21:35Z)

## Needs Christian

**The ask is the same one design chat, and this run closed the last open question behind it.** Start with [THR-1448 — a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (say "design THR-1448"), then [THR-1479 — the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by).

**What changed.** [Last hour's run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-17d.md) found that two items pulled at random from the big "someday" pile had already been quietly built months ago, and said plainly that nobody had ever checked whether that pile actually holds buildable work. This run checked — and deliberately stacked the deck in the pile's favour, opening the four items that looked *most* like ordinary jobs somebody could just pick up and do.

**None of the four was.** Every one of them stops at the same place: a question about how the game should work that has to be answered before any code can be written. One needs a decision about what consecrating a place should actually do to the world. One needs a decision about whether a whole half-built system should be finished or thrown away. One is waiting on two other pieces that have not been built yet.

So the reassuring pile is not a reserve. It is more design work wearing the same clothes as the rest. **There is no longer a plausible route to restarting the build machine that does not go through a conversation with you** — which is what the previous four runs suspected and this one has now actually tested. The machine has been idle roughly five hours, and about twenty-three of the last twenty-four.

Nothing else needs you. No new decisions, no new tickets to read.

## T1 — unblock sweep

Shelf: **0** in `Ready for Dev`, **0** in `In Dev`. Both re-queried this run, both genuinely empty.

`Todo`: **29** candidates, **unchanged since run b** — most recently touched is still THR-1511 at 2026-09-16T16:08Z, so the column has not moved in ~29 hours. Run d re-derived all fourteen non-wayfinder declines by reading the bodies one hour ago; with the column provably unmoved I inherit that verdict rather than spending a third pass on it, and record that I inherited it. The fifteen `wayfinder:*` issues skip unconditionally to T1.5.

**Promotions: 0.** The ceiling of 5 was untouched and the shelf sits far below the backed-up threshold of 15 — eligibility was the constraint, not the ceiling, for the fifth run running.

### New this run — T1's candidate set extended to the `Idea` column

T1's remit is *"for each Todo/Idea candidate, parse blocker references"*. Runs a–d scanned `Todo` only. With `Todo` provably static and the executor idle, the unscanned half of the candidate set is the one place a promotion could still come from, so I scanned it: **64 items**.

I opened the three that looked most like ordinary executable work — a biased sample, chosen to give the column its best chance — and a fourth resolves off a blocker's title without needing to be opened. **All four decline, and none for the reason run d found:**

- **[THR-662](https://linear.app/threadbare/issue/THR-662)** (wire the two remaining no-op sanctify actions) — the most executable-looking item in the column; the body ends *"**Design-first:** this needs an In Design pass to pick each action's consumed substrate before code (three-pillar)."* → T2.
- **[THR-964](https://linear.app/threadbare/issue/THR-964)** (`pendingChoiceCommits` has no producer — the choice-commit pipeline is unreachable) — *"Two coherent outcomes, and this is a design call rather than a patch"*: wire the producer, or retire the pipeline. Its own first Done-when is *"a decision is recorded"*. → T2.
- **[THR-1294](https://linear.app/threadbare/issue/THR-1294)** (`requiresLocation` defaults off) — **unmet blocker**, and the only one of the four that is not design-gated. Native Linear relation `blockedBy` [THR-1309](https://linear.app/threadbare/issue/THR-1309), and its Done-when is additionally gated on plan-doc 3's binder and plan-doc 2's per-kind authoring both landing first. Declines on the dependency half, exactly as T1 is built to do.
- **[THR-1295](https://linear.app/threadbare/issue/THR-1295)** (folded found-order undertaking has no faction payoff) — not opened; [THR-1309](https://linear.app/threadbare/issue/THR-1309)'s title states it *"absorbs THR-1295"*, so it declines with THR-1294 on the same unmet blocker and its own body would not change that.

**Process-labelled `Idea` items not promoted, and why.** THR-984 (`lint:plan-doc` with no args always passes), THR-758, THR-949, THR-871, THR-882, THR-852, THR-752 are all `Continuous Improvement`. None carries a quotable above-bar loss **and** a cost/benefit line, so none clears the materiality bar; under the process throttle these are impediment-log rows for the weekly retro to batch, not promotions. Flagged rather than filed — scheduled lanes log, the retro promotes. THR-984 is the one worth the retro's attention first: a gate that reports a pass while linting zero files is the "gate passing while broken" shape, and it is the exact command the pre-commit checklist prescribes.

**Rule 0:** no process work promoted, none eligible. This week's closed work stays product-dominated. Headline finding remains **"feature pipeline needs a design session"** — now resting on both candidate columns rather than on `Todo` alone.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258).

**AFK frontier: 0** — re-verified by label this run rather than inherited: all **21** `wayfinder:research` and all **5** `wayfinder:task` tickets in the workspace are `Done`. Nothing to burn down until a map is extended, so `ORCH_WAYFINDER_AFK_MAX` (2) went unused.

HITL frontier: **12** tickets, all `wayfinder:grilling` / `wayfinder:prototype`, unchanged since 2026-08-26 and already carried on the briefing. Not touched — resolving one is the broken-HITL failure mode the wayfinder skill names.

Run d's note stands and is worth repeating to whoever takes the next design chat: **Physical Conflict is fully researched and blocked purely on Christian** — four research tickets `Done` with decisions recorded on the map, charter settled, all ten remaining children HITL. It is one grilling session from producing plan docs.

## T2 — design authoring

**Triggered and barred**, fifth consecutive run.

Non-`Deferral` shelf is **0**, below the floor of 2. `In Design`: **2 live, 0 excluded** — THR-1448 (unassigned, 5.6d) and THR-1479 (unassigned, 5.0d). Neither carries `Parked`; both sit inside the 7-day window, so both count against the bound of 1. Nothing staged, no state changed, nothing mutated.

Run c's correction stands and is not re-litigated: raising `ORCH_MAX_IN_DESIGN` would convert zero candidates into buildable work, because staging is a *request* for a design chat, not the chat. This run's `Idea` scan is further evidence for that reading — the constraint is design capacity, not staging permission.

## T3 — architecture health

**Daily sweep not due** — it ran at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-17b.md) (~15:55Z), the first run after 06:00 local. **No detectors were run this hour, and none is reported as clean.**

Weekly test-suite health: **not due** (Thursday; next Monday 2026-09-21).

**New finding — the `Idea` column is design-gated, not merely stale, which answers run d's open question.**

Run d found two `Idea` Deferrals already shipped under a sibling's id and concluded, correctly, that *"nobody has verified"* the column represents banked work. This run tested it from the other direction — not "is this already done?" but "is this buildable as written?" — on a sample biased toward the most executable-looking items. Three of four are design-gated in their own words; the fourth is blocker-gated. Combined with run d's two already-shipped probes, **five `Idea` items have now been opened and none is executable today** (a sixth, THR-1295, resolves off its blocker's title).

Still a sample, still stated as one. But the two findings compose into something neither shows alone: the column fails as a work reserve in two independent ways at once — some of it is finished and mislabelled, and the part that is genuinely open is gated on the same scarce resource as `Todo`. Any plan that routes around the design bottleneck by drawing on the backlog's depth is drawing on a number that does not mean what it looks like.

Cost to fix: the stale-shipped half is roughly one grooming pass (run d's estimate, unchanged). The design-gated half is not a defect and has no fix — it is the pipeline correctly refusing to build undesigned work.

**Redundancy: not assessed this sweep.**

**Stalled work:** none. `In Dev` is empty.

**Hand-created `In Dev` tickets:** none — `In Dev` is empty.

**In Design: 2 live, 0 excluded** (THR-1448 unassigned 5.6d → counts; THR-1479 unassigned 5.0d → counts; both inside the 7-day window, neither `Parked`).

## Escalations

None opened. The single open question — when a design chat happens — is Christian's, is already on the briefing, and asking a fifth time in one day on Discord would be noise rather than escalation. This run's contribution to it is evidence, not a repeat of the request.

THR-984 flagged to the weekly retro as the first process item worth its attention (a gate that passes while linting zero files). Logged here, not filed, per the process throttle.
