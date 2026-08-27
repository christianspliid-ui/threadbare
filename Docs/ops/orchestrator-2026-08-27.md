---
lane: tb-orchestrator
run: 2026-08-27
promoted: 0
filed: 5
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-27 (run a, ~00:26Z)

## Needs Christian

**One ask: approve the retrofit batch-2 brief.** It is the only thing standing between you and the session you asked for on 2026-08-24 — playing all five slice encounters in one sitting with every part at standard.

The chain is short and it stops at you. The camp-seven encounters (shrine offering, rest and reflect, and five siblings) are still written to the old standard. Rewriting them is [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine), which is deliberately parked until you say yes to its brief — that was your own rule from the factory sitting. And the shrine offering is encounter #1 of the slice roster, so [the integrated checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) cannot invite you while it is below standard.

The brief is written and merged, so it is ready to read now: **[retrofit-batch-2-brief.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md)**. A yes in chat unblocks the rewrite, and the checkpoint follows it.

**Twelve questions are waiting on three open maps.** No agent may answer these — they are the kind you said you want to decide yourself. All twelve are unclaimed and nothing is blocking them:

*Physical Conflict* — how fights actually work — has ten. Six are conversations: [Companies in fights?](https://linear.app/threadbare/issue/THR-1271/companies-in-fights), [Embedding the fight block](https://linear.app/threadbare/issue/THR-1269/embedding-the-fight-block-encounter-integration-contract), [Monster opponents — just enough monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster), [Systemic triggers — walking into the lair, grudges boiling over](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over), [Defeat wears many faces](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum), [Victory yields — what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands). Four are things to look at and react to: [the fight on screen](https://linear.app/threadbare/issue/THR-1272/the-fight-on-screen-attended-surface-and-background-exhaust), [the mid-fight event table](https://linear.app/threadbare/issue/THR-1265/mid-fight-event-table-where-the-cool-moments-live), [the NPC-mode fight loop](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton), [the agent-mode fight loop](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs).

*Powers & Spellcraft* and *Item Generator* have one each, both sketches for you to react to: [twenty generated spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) and [thirty generated items](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

Open a chat and say "work the map" when you have an hour.

**Design sessions wanted — the shelf behind the current work is empty.** The executor is busy on the undertaking substrate and has two of six slices left. Behind it there is no ready work at all, because every remaining item needs a plan doc written first. This run filed the five missing Proactive Agent Actions design tickets from your own carve-up, so the next design session has somewhere obvious to start; it does not need anything from you to begin. Nothing is on fire — but if the executor finishes the substrate before a design session runs, it idles.

## T1 — unblock sweep

Ready for Dev held **0** items at scan (00:26Z). Promotion ceiling irrelevant; nothing qualified.

**Promoted: none.** Every non-wayfinder Todo candidate declined, each with its reason:

* `skip THR-1156` — wrong destination. Program-epic container; its own text says *"no execution ticket files directly against this epic"* and recommends a wayfinder map on the director's explicit invocation.
* `skip THR-1222` — unmet blocker, a **state gate not a ticket**: Christian's chat approval of the batch-2 brief (filing comment, 2026-08-24). Plan-doc liveness **LIVE** — the brief is on `origin/main` via PR #1600, so the only thing missing is the approval. Surfaced under Needs Christian.
* `skip THR-1043` — unmet director gate (pilot-batch brief approval per ruling 2) and assigned to Christian. Not queue work.
* `skip THR-1220` — wayfinder-adjacent HITL by its own first line: *"Never promote to Ready for Dev; this is not executor work."* Its named blocker THR-1219 is **Done** (2026-08-24), so it is unblocked, but the shrine-offering prose gate (THR-1222) still holds the pre-flight. Surfaced under Needs Christian.
* `skip THR-1212 / THR-1213 / THR-1155 / THR-1134 / THR-1274 / THR-1287 / THR-1189` — wrong destination. All seven are design tickets whose Done-when *is* a plan doc. T2's input, not T1's. THR-1213 additionally carries a native blocker on THR-1212.
* `skip THR-789` — wrong destination. Program epic; *"Each wave runs design finalization before Ready for Dev."*
* `skip THR-1195` — **standing reversal verdict** (THR-990 check). Run i reversed its own promotion 2026-08-22T18:32Z and named the three things that would make it promotable: a recorded ruling on what a Divine Herald is, a decision that the non-agent branch is default, or folding it into the typed game-state wave. None has happened; `updatedAt` has not moved since. Re-promoting on identical evidence is churn.
* `skip THR-1114` — **standing verdict at filing**: *"Why this is `Todo` and not `Ready for Dev`"* — the Done-when contains a cosmology question with no agreed outcome to test against. Its separable half (the corpus-wide `sphereAffinity ∈ SPHERE_NAMES` invariant test) remains the durable piece a design pass should carve off.
* `skip THR-1024` — unmet blocker. Sequenced behind THR-966 (*"do not start this before"*), which is in `Idea`, not Done.
* `skip THR-1256` — unmet time gate. Review opens **2026-09-08**; twelve days out.
* `skip` ×15 wayfinder-labelled issues — decisions, not executor work. T1.5's input.

**Filed: 5.** The Proactive Agent Actions carve-up closed on 2026-08-26 naming **six** plan docs, one design session each, with scope, draws-on and sequencing for every one. Only doc 1 had ever become an issue, so five of the six existed *only* as prose inside one closed map's comment — invisible to every lane that reads Linear. That is the same shape as work "routed to an executor" no lane reads, which is the defect this lane exists to catch. Filed into `Todo` (not `Ready for Dev` — they are design tickets), assignee cleared and verified absent on re-query, sequencing recorded as native Linear relations:

| Doc | Issue | Pillars | Blocked by |
|---|---|---|---|
| 2 | THR-1297 — the action library: works, holdings & naming | Content + schema | THR-1292, THR-1296 |
| 3 | THR-1296 — the binder | Engine | nothing (Tier-1 critical path with doc 1) |
| 4 | THR-1298 — the reactive loop | Engine + Content | THR-1292 |
| 5 | THR-1299 — the calling & the surfaces | UI + Engine | THR-1292 |
| 6 | THR-1300 — the undertaking factory | Process + Content tooling | THR-1297 |

No direction was chosen: every scope block is quoted from Christian's carve-up, and the blocked-by graph reproduces its stated sequencing (*"1 and 3 are the Tier-1 critical path; 2 rides on both; 6 stands on 2; 4 and 5 can run parallel once 1 exists"*).

**Three dangling mutex references closed as a side effect.** THR-1293, THR-1294 and THR-1295 each carried a coordination line reading *"the future plan-doc-N issue (not yet filed — add its id here when created)"*. Each now has a comment naming the id: doc 5 → THR-1299 for THR-1293; docs 2 and 3 → THR-1297 / THR-1296 for THR-1294; doc 2 → THR-1297 for THR-1295. No state, assignee or priority was written on any of them.

**Rule-0 / product-vs-process ratio.** Completions in the trailing week run roughly **30 product to 4 process** (~88% product) — the inverse of the 2026-08-10 crisis that produced the throttle. Count is a floor (the Linear page truncated) and the classification is judgement, not a metric. No process ticket was promoted this run; none was a candidate.

## T1.5 — wayfinder sweep

Three open maps: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) (THR-1258), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) (THR-1226), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) (THR-1227). A fourth, Proactive Agent Actions (THR-1276), **closed 2026-08-26** — its output is the six-doc carve-up T1 acted on above.

**AFK burn-down: zero, and correctly so.** A label sweep across all states returns **19 `wayfinder:research` and 3 `wayfinder:task` issues, every one of them `Done`.** There is no open AFK ticket anywhere on the board. The entire remaining frontier is `wayfinder:grilling` and `wayfinder:prototype` — HITL by construction, and resolving one is the broken-HITL failure mode the wayfinder skill names.

Frontier: 10 (Physical Conflict) + 1 (Powers) + 1 (Item Generator) = **12 HITL**, all unassigned. Surfaced under Needs Christian by title with links.

**Honest limitation:** the frontier was computed from state + label + assignee. Native blocking relations were **not** re-queried per candidate — 12 extra calls that could only have narrowed a list nothing could act on this run. So 12 is an upper bound on the true frontier, not a verified count. If a later run needs to burn one down, it must do the per-candidate `includeRelations` check first.

## T2 — design authoring

**Triggered by shelf depth, then bound out.** Non-`Deferral` items in Ready for Dev: **0**, below the floor of 2. But `In Design` already holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, since 2026-08-19) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, since 2026-08-15) — against a bound of 1. No staging performed.

That bound is doing its job, and what it reveals is the run's real finding: **the design pipeline is the bottleneck, not the queue.** Two items have sat In Design for 8 and 12 days, the shelf behind the executor is empty, and every one of the ~20 remaining Todo items needs a plan doc before it can be executed. Adding a third staged item would not have helped; what is missing is attended Opus design sessions, which this lane deliberately cannot run.

The five tickets filed in T1 are the constructive half of the same finding — the next design session now has five fully-scoped, pre-sequenced starting points instead of a carve-up buried in a closed map's comment.

## T3 — architecture health

**Not due — skipped.** Local time at run start was 02:29 (RDT), before `ORCH_HEALTH_SWEEP_HOUR` (06:00). The first run after 06:00 local owns today's sweep.

No detector was run, and nothing here should be read as a clean result. Test-suite health is likewise not due — today is Thursday; `ORCH_TESTHEALTH_DOW` is Monday.

Redundancy: **not assessed this sweep.**

## Escalations

**Nothing asked on Discord; nothing parked.** Agreed work is not exhausted — the opposite: the carve-up filed this run is five sessions of agreed, fully-scoped design work.

**One self-inflicted defect worth recording.** The five issues were first created with `&amp;` where a literal `&` was meant — an HTML escape that leaked into two titles *and* silently broke the `project` lookup, since `"Thematic Pressure &amp; Living World"` matches no project. The failure was **silent in both directions**: `save_issue` returned 200 with the project simply absent from the response, and one retry no-op'd entirely without moving `updatedAt`. Fixed by passing the project **UUID** (`436f0ce1-…`) instead of its name, and both titles rewritten; all five re-queried and confirmed to carry the project, the right title, no assignee, and the correct `blockedBy` graph.

Generalisable: **when a Linear field takes a name containing punctuation, pass the id.** A name lookup that fails returns success with the field dropped, which is indistinguishable from impediment #48's silent-write class until you re-query for the field specifically rather than for the write.

Recorded here rather than as an impediment-log PR or a ticket: per the process-work throttle, a scheduled lane logs and moves on, and the weekly retro is the single promotion point. This row is available for that batch.
