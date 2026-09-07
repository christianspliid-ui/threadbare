---
lane: tb-orchestrator
run: 2026-09-07
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-07 (run unlettered, ~00:26–00:33Z)

**The same defect as last night, on the sibling ticket: a finished, unblocked, fully-prepared ticket filed one column short of where the machine looks.** [THR-1425](https://linear.app/threadbare/issue/THR-1425/five-more-player-facing-surfaces-render-a-raw-tick-count-the-elapsed) was filed at 00:17Z — nine minutes before this run — by the session shipping [THR-1423](https://linear.app/threadbare/issue/THR-1423/five-surfaces-still-render-a-raw-tick-count-4-ticks-remaining-laws-13), carrying a membership predicate, a Done-when, three-pillar scoping and a coordination block. It landed in `Todo`. The executor's pickup query reads only `Ready for Dev`. **Promoted.**

That is now **two consecutive runs** where the single promotion was a well-formed ticket stranded in `Todo` by the session that authored it. Twice is a pattern, not a coincidence — flagged below for the retro rather than filed as a ticket, per the process-work throttle.

## Needs Christian

**One new thing, and it is a small game question with a recommendation attached — not a decision I need you to make cold.**

Two places in the game still show you a bare percentage: an effect's tooltip says something is at *62% strength*, and the doom clock says you are *62%* of the way to the doom. The design laws ban percentages on player-facing surfaces, and unlike the "4 ticks" problem we have been clearing all week, there is **no existing replacement to reach for** — a duration converts cleanly into days, but "62% strength" converts into nothing the player already thinks in. Word ladders are ruled out: your verdict on `grew steadily` was *"how can a player use that word to gage anything"*.

**My recommendation: drop both numbers rather than invent a new language for them.** The doom clock already shows a progress bar and tells you which chapter of five you are in — the percentage is the third rendering of a quantity the screen states twice. The effect tooltip's strength is arguably readable from the effect's own prose. If that is right, the answer costs nothing and no new vocabulary enters the game.

The fork that is genuinely yours: **if a proportion is ever worth showing, what should it read as** — because whatever we pick becomes the sanctioned reading for *every* proportion in the game, the way "four days" now is for every remaining term. Say *drop them* and I will take it from there; say *no, they matter* and it needs your language.

→ [THR-1424 — two player-facing percentages have no sanctioned reading](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct)

**Your standing asks are unchanged and deliberately not restated here** — the encounter batch waiting on your repair-or-re-roll answer, the design slot, and the map questions are exactly as [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06d.md) left them six hours ago. Repeating them hourly is what teaches a reader to skip this file.

**The machine had another good night.** Four tickets finished in the six hours before this run, one is in progress right now, and four are queued behind it. Nothing is stuck.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Declined: 6 (5 standing, 1 new). Held: 0 — the ceiling never engaged.**

Board at scan: **54 `Todo`** (50 + 4), **3 `Ready for Dev`** before this run (all non-`Deferral`), **3 `In Dev`** (1 live, 2 `Parked`).

### Promoted (1)

[THR-1425](https://linear.app/threadbare/issue/THR-1425/five-more-player-facing-surfaces-render-a-raw-tick-count-the-elapsed) — *five more surfaces render a raw tick count, the elapsed-term fields* — `Todo` → `Ready for Dev`, verified by re-query (`stateHistory` shows the transition at 00:28:42Z; no `assignee` key present).

| Gate | Result |
|---|---|
| Blockers | Description states `Blocked by: nothing`. No prose gate, no time gate. |
| `wayfinder:*` | Labels `Deferral`, `UI`, `Bug`. Not a wayfinder issue. |
| Wrong destination | The elapsed-reading choice is a within-ticket implementation call — the ticket names two candidate readings and the constraint ruling out a third. Contrast THR-1424, which needs a Law 15 ruling and is correctly held. |
| Standing retire verdict (THR-990) | No comments on the issue at all. Nothing retires it. |
| Plan-doc liveness (THR-921) | Names no plan doc → passes trivially. |
| Promotion ceiling | Shelf 3, far under 15. Never engaged. |

**Premise verified against `origin/main`, not taken on the ticket's word** — all five sites live, and the fix helper present:

```
AgentInfoCard.tsx:522       {entry.ticksAgo} ticks ago
HexChronicle.tsx:1252       {effect.ticksActive} ticks active
AttachmentDetailView.tsx:63 `(${payload.durationTicks} ticks)`
MandateDetail.tsx:337       `${definition.tickLimit} ticks`
DivineReceiptModal.tsx:56   `took ${ticks} tick${ticks === 1 ? '' : 's'} to resolve`
aftermathWords.ts:226       export function durationLabel(ticks: number): string
```

Two line numbers had already drifted since filing (`AgentInfoCard` 529→522, `AttachmentDetailView` 64→63). The predicate governs, not the numbers (THR-688 rule A), and it matches at all five.

**A correction this run made to its own work, recorded because the near-miss is the useful part.** The first coordination block called the THR-1424 mutex "not live today" and stopped — missing that **THR-1423 was `In Dev` with an assignee as of 00:25Z and edits the same file**, `AgentInfoCard.tsx`. That is the one mutex that can actually bite. A second comment supersedes the first with the corrected mutex; it had to restate the block in full, because `pull-work` Step 3 validates the *latest* comment and would otherwise have read the wrong one. The lesson generalises: **a mutex sweep that only reads the ticket's own authored block will miss the mutex that arrived after filing** — live `In Dev` state has to be read at promotion time, not inherited from the description.

### Declined (6), each naming its evidence

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1424](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct) | **Blocked on a creative ruling** (new this run) | Its own body: *"a creative/design ruling from Christian — this is a 'what should the game mean' fork with no agreed outcome to test against, so it is not an agent call"*. Surfaced above. |
| [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) | **Unmet approval gate** (standing) | *"Holds in Todo until Christian approves the batch-2 brief in chat (ruling 2)"*. A state gate, not a ticket. Unchanged since the 09-04 run repointed it at the current brief. |
| [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) | **Wrong destination — design first** | Done-when opens *"Design decision recorded first (this is a rules-of-play question, not a defect with one right answer)"*. Native `blockedBy: []`, so the `Blocked by` field alone would have passed it. T2's input, not T1's. |
| [THR-1195](https://linear.app/threadbare/issue/THR-1195/hexsend-heralds-divine-herald-has-no-actortype-so-it-is-located-but) | **Wrong destination — design first** | Needs *"a recorded decision on what a Divine Herald is"*. Corroborated by its own history: promoted 2026-08-22T18:30Z and bounced back to `Todo` **74 seconds later**. Not re-promoted. |
| [THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere) | **Wrong destination — design first** | *"Why it is a content call, not an executor one… There is no agreed outcome to test against."* Cosmology Step 0 owed. |
| [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) | **Unmet time gate** | Title carries *"review on/after 2026-09-08"*. Today is 2026-09-07 UTC — **window opens tomorrow.** The next run after 00:00Z on the 8th may promote it. |

### The finding under the declines

**Five of the six declines are the same shape: the ticket is technically unblocked and still not dev-ready, because it needs a decision nobody has made.** `blockedBy` is empty on every one of them; only reading the body catches it.

So the thin build shelf is **not** a sweep that is failing to look. It is a `Todo` column whose remaining contents are largely design-gated — and the constraint on throughput right now is decisions, not promotion. That is a standing structural observation, not a new finding, so `newFindings` stays 0.

## T1.5 — wayfinder sweep

**Four open maps. Zero AFK tickets resolved — correctly, none were available. No claims taken.**

| Map | Frontier | Disposition |
|---|---|---|
| [THR-1396](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map) Undertakings | 5 open children on the frontier | 3 grilling + 2 prototype = **all HITL**. THR-1403 is off-frontier (native `blockedBy: THR-1402`). |
| [THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) Physical Conflict | 9 | 5 grilling + 4 prototype = **all HITL**. |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) Powers & Spellcraft | 0 | Its one open child (THR-1232) is **assigned to Christian** → off-frontier by rule. |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) Item Generator | 1 | Prototype = **HITL**. |

**No `wayfinder:research` ticket is open anywhere on the board**, and the two `wayfinder:task` tickets are both correctly unavailable:

- **THR-1403** — natively blocked by THR-1402 (the two-seed census, itself a HITL prototype). Also explicitly *"Executor work under THR-1392 (slice 4b)"*.
- **THR-1405** — on the frontier, unblocked, unassigned, and **deliberately parked, not neglected**. Its AFK half was fully discharged by the 2026-09-03 run as a comment carrying the whole mapping with `file:line` evidence; its code half was filed as [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap), which is **in `Ready for Dev` now**. The ticket's own latest comment states the exit condition: *"This ticket stays open as the map-side tracker until THR-1407 lands."*

**Checked rather than assumed, and the check is the point.** A frontier ticket that is open, unblocked and unclaimed is exactly what this tier is built to pick up — resolving THR-1405 by subagent would have duplicated work already done and re-derived a spec THR-1407 already carries, which is the THR-1245 double-implementation failure in miniature. The prior run's judgement stands; nothing to add.

**Nothing new for Christian from the maps.** The ~15 HITL questions across the four maps are the standing set already carried in the briefing.

## T2 — design staging

**Not triggered.** Non-`Deferral` items in `Ready for Dev` at scan: **3** (THR-1407, THR-1415, THR-1422) against a floor of 2. The promotion added THR-1425, which is `Deferral`-labelled and correctly does **not** count toward the floor.

`In Design` bound not consulted — the trigger did not fire, so the tier did not run.

## T3 — architecture health

**Did not run, and nothing from it is reported.** The daily sweep gates on the first run after **06:00 local**; this run is **02:26 local**. The first run after 06:00 today owes it.

**No detector was executed this run** — `generate-interface-map:dry`, `sweep:rank-reach`, `check:process` and `check:canon-staleness` were all skipped, and none of them is being reported as clean. Redundancy: **not assessed this sweep.**

Today is Monday (`ORCH_TESTHEALTH_DOW`), so that first post-06:00 run also owes the **weekly test-suite health pass** on top of the daily detectors.

**One observation available without running a detector,** since the `In Dev` slice was read for the mutex check above: **3 `In Dev`, of which 1 is live** (THR-1423, assigned, updated 00:25Z) **and 2 carry `Parked`** (THR-1392, THR-1130 — both unassigned). WIP=1 is being respected. No issue showed 3+ `Ready for Dev → In Dev` transitions; no hand-created `In Dev` ticket was seen.

### Product vs process — the week

Of the **26 issues completed in the last seven days** this scan returned, roughly **20 product / 6 process (~77% product)**. The process six are all delivery-machine work that paid for itself — the heavy-test lane split (THR-1384), two engine-cost guards (THR-1385, THR-1386), the In-Design timeout (THR-1382), the pathfinding fix (THR-1389) and the debug-tooling sweep (THR-1412).

**No process ticket was promoted this run, and none needed to be.** The product pipeline is supplying itself; the headline is not "needs more tidying".

## Escalations

**Nothing asked, nothing parked.** Discord was not contacted — agreed work is not exhausted (four items queued, one in flight), so the stop-and-ask condition did not arise.

**One item logged for the retro rather than filed as a ticket,** per the process-work throttle (scheduled lanes do not file process tickets; the weekly retro is the single promotion point):

> **Two consecutive runs promoted a well-formed ticket that its authoring session left in `Todo`** — THR-1423 (2026-09-06 run d) and THR-1425 (this run). Both were filed complete: predicate, Done-when, pillars, coordination block. Both were invisible to the executor for the gap between filing and the next orchestrator run (43 minutes and 11 minutes respectively). The cost so far is small and the lane is catching them, which is why this is a log row and not a ticket — it is well under the materiality bar. Worth the retro asking whether the deferral-filing step in `pull-work`'s closeout should name `Ready for Dev` as the destination for a ticket whose blocker is nothing.
