---
lane: tb-orchestrator
run: 2026-09-22g
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-22 (run g, ~12:30Z)

## Needs Christian

**One thing, and it is worth more than the last two reports said it was: top up the builder's credit.** [claude.ai usage settings](https://claude.ai/settings/usage). Or have a session move that lane off Fable.

**What is new is the size of the prize.** The last report told you that fixing the builder would only get you an hour before it ran out of work and stopped again. **That is not right, and I checked it this hour rather than repeating it.** There is a full job already waiting with the builder's name on it — [artifact traits](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), the third slice of the traits work, fully designed and ready to build. The builder picked it up this morning at 10:11 local and died seven minutes later mid-job. **It will pick that same job back up by itself the moment it can run** — it is built to notice work it abandoned, confirm the dead session really is dead, and carry on. Nothing was lost; no code was written and nothing needs undoing.

So this is not "spend money to buy an idle machine an hour". It is a real slice of the game — artifacts that carry a history, cursed things that the systems can finally *see* as cursed, and the artifact sheet showing it — sitting finished-on-paper and unbuilt because a credit ran out five hours ago.

**The design hour is still the next thing after that, but it is genuinely second now.** Once that slice ships the shelf really is bare, and the one waiting for you is unchanged: **[Scenes are being offered to exactly the people who will refuse them](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its)** — the world picks which mortal gets handed a scene by favouring whoever leans one way on the scene's named value, but when the scene's choice forks on that same value, the arm that matters is usually the other one. So the game reliably offers a two-way choice to the person who will take the dull arm. Open a chat and say you want to work THR-1525.

**Nothing else needs you.** No pull requests are open, the code on `main` is green, and nothing is being lost while the builder is down.

## T1 — unblock sweep

| Column | Run f (10:35Z) | This run (12:30Z) |
|---|---|---|
| `Ready for Dev` | 0 | **0** |
| `Ready for Dev`, non-`Deferral` | 0 | **0** |
| `In Design` | 1 (0 excluded) | 1 (0 excluded) |
| `In Dev` | 1 | 1 |
| `Todo` | 28 | 28 |

**Nothing promoted. Nothing was promotable** — re-derived from this run's own scan and this run's own reads of each candidate's description, not inherited from run f.

`Todo` composition: **15 wayfinder-labelled** (skipped unconditionally — T1.5's input, never `Ready for Dev`) and **13 non-wayfinder**. No `Todo` item carries an `updatedAt` newer than 08:22:54Z, so the column has not moved in four hours.

The thirteen non-wayfinder items, each with the reason it is not dev-ready. Five were re-read in full this run (THR-1522, THR-1523, THR-1526, THR-1528, THR-1274, THR-1393) rather than carried forward:

- **Design-first (T2's input, not T1's): 6** — THR-1526 (*"Scope (needs a small design before pickup)"*), THR-1528 (*"design before code — a new record shape"*; its first Done-when is *authoring* a plan doc), THR-1523 (*"The design question (not the executor's to settle)"*, options A–D), THR-1274 (*"This is a design ticket, not a patch"*), THR-1393 (*"a design decision, not an executor's call"*), THR-1381 (a spec task).
- **Trigger unmet: 3** — THR-1522, THR-175, THR-1218.
- **Not executor work: 4** — THR-1220 (HITL sitting), THR-870 (parked direction), THR-789 (epic), THR-791 (assigned to Christian).

**THR-1522's gate is now positively answered, not merely unread.** Its stated blocker THR-790 reached `Done` at 02:15:34Z, so the `Blocked by` half is satisfied — but the ticket carries a second, semantic gate: *"gated on slice 1's census showing the pool term moves — if location traits do not shift the pool, more consumers are not the fix."* THR-790's own shipping comment records the census result against that gate: `FLAT` at *Welcoming* towns (gold-reach encounters 0 of 122 vs 6.5% elsewhere), `UNDERSAMPLED` for *Lawless*, `UNMINTED` for *Veil-thin* / *Haunted* headless, and **still 0 of 83 with every row at the cap** — so the limit is eligibility, not weight. The executor wrote it plainly: *"THR-1522 is gated on … today it does not."* **A met blocker over a failed kill criterion is exactly the shape T1 must not promote on**, and the honest next move the comment names (content, or a design decision to let a location trait widen eligibility) is T2 work.

**`Idea` scanned this run as well — new coverage, nothing found.** Run f's sweep read `Todo` only. With the shelf at zero for a fourth hour it was worth confirming nothing promotable was sitting one column over: 30+ items, all deferrals, `drift-scan` rows, or undesigned direction, none carrying a cleared blocker that would make it dev-ready. The `drift-scan` and `Infrastructure` rows are explicitly non-qualifying under Rule 0. **Nothing there is a T1 candidate**, and promoting from it would be choosing direction.

**Ceiling: neither bound engaged.** Shelf 0, far under the backed-up threshold of 15; 0 promotions of a permitted 5. **No candidate was held back by a ceiling** — every item above is excluded on its own merits.

**Rule 0 / materiality:** nothing filed, nothing promoted. Both findings below sit in the delivery machinery and **neither was filed as a ticket** — the process-work throttle gives scheduled lanes the log and the run report, and the weekly retro the single promotion point. Neither is a loss actively corrupting work as it runs, which is the sole exception. **The headline finding is that the feature pipeline needs a builder and then design supply** — never another process promotion.

## T1.5 — wayfinder sweep

Three open maps, unchanged since 2026-09-11: Item Generator ([THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)), Powers & Spellcraft ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)), Physical Conflict ([THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)).

**AFK frontier: 0.** Read off this run's own `Todo` scan: the 15 wayfinder items are 3 `wayfinder:map`, 6 `wayfinder:grilling`, 6 `wayfinder:prototype` — **zero `wayfinder:research`, zero `wayfinder:task`**. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind; **nothing claimed, nothing resolved, nothing closed** — the sole sanctioned exception to "never assign yourself" went unused because nothing was eligible for it.

**HITL frontier: 12** — 6 grilling, 6 prototype; 11 unassigned, THR-1232 assigned to Christian. **Unchanged since 2026-08-26 — twenty-seven days.** Not re-listed by id against this hour's single ask; folded into the supply picture as one fact, which is its honest weight.

## T2 — design authoring

**Triggered, and barred — unchanged from the last four runs.**

Non-`Deferral` `Ready for Dev` is **0** against `ORCH_PROGRAM_WORK_FLOOR` of 2, so the trigger fires hard. `In Design` holds **1 live** item — [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), staged by run b at 04:37:11Z, unassigned, **~7h55m old**, and therefore **counting** by the liveness predicate (only `Parked`, or unassigned-and-stale-past-7-days, are excluded). `ORCH_MAX_IN_DESIGN` is 1. **Nothing staged.**

The 48h re-surface clock has ~40h left on it; THR-1525 is re-surfaced in `## Needs Christian` as the standing design ask, not re-staged.

Named for the next trigger, in priority order: THR-1526 (untrue prose reaching live mortals, Medium), THR-1523 (attention model, Medium), THR-1528 (battle-history record, Low).

`ORCH_MAX_IN_DESIGN` is **not** being raised in-run to route around the bar — that belongs to the weekly retro or to Christian, and a second *staged* item would put nothing on the build shelf regardless, since staging is not authoring. Stated once, not re-argued.

## T3 — architecture health

**The daily sweep is not due — it ran at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-22b.md) (06:35 local), past `ORCH_HEALTH_SWEEP_HOUR`. No detector was run this hour and none is reported clean.** The weekly test-suite pass is not due until 09-28 (today is Tuesday; `ORCH_TESTHEALTH_DOW` is Monday), so nothing is said about it rather than a stale result repeated. **Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is browser-only and was not run.

Both findings below came out of **falsifying the previous run's own reassurances**, not from a detector sweep.

### New finding (1): the dead claim recovers itself — and that re-ranks what the credit top-up is worth

Run f recorded THR-1521's dead claim as benign and left it for the stale-claim sweep: *"The 12:00Z stale-claim sweep releases it, which is that lane's remit and not this one's."* **Benign is right. The recovery mechanism is not** — and the difference is the whole Christian-facing ask.

`pull-work` recovers this without the sweep, through its own resume path:

| Step | What it does with THR-1521 |
|---|---|
| Step 1 | Board scan includes `In Dev` + `assignee:"me"` — the claim was set by the builder's own `assignee:"me"` write at 08:11:38Z, so it matches by construction |
| Step 1.5 | WIP gate resolves each claim to an open PR that closes it. **No branch and no PR exist** (`git ls-remote` and `gh pr list`, verified this run) → 1 undischarged claim → **routes to Step 1.6 resume, not to Step 2** |
| Step 1.6 | Predecessor-liveness proof — the 08:11Z session died at 08:37Z on the Fable limit |
| Step 1.7 | Upstream-shipped check — empty; nothing shipped |
| Step 1.8 | No checkpoint → asserts a claim comment, re-reads the thread, **resumes the work** |

**So the builder does not wake to an empty shelf.** It wakes to a three-pillar slice already in flight and picks it up. Run f's advice — *"Fix the builder first and it finds an empty shelf within the hour"* — was the basis for ranking the design hour alongside the top-up; on this reading the top-up buys a genuine ticket of work, and the design hour is the *next* constraint rather than a simultaneous one. **This is a correction to the ordering advice, made from the skill text rather than from inference, and it is the reason `## Needs Christian` is one ask this hour instead of two.**

**A load-bearing side effect: nothing should comment on THR-1521.** Step 1.8 branches on *"no checkpoint, no claim comment"* vs *"claim comment present"*. A well-meant informational comment from an observer lane would change which branch fires on a ticket whose recovery depends on it. **No comment was posted and no state was written** — this lane read THR-1521 and touched nothing, which is both the non-negotiable and, here, the actively correct move.

### New finding (2): the sweep run f deferred to had already failed, and its cron is not its fire time

Run f's finding (3) flagged `stale-claim-sweep.yml` as missing from the scheduled-tasks registry, and verified its timing claim against the workflow file: *"The claim checks out — `0 */12 * * *` next fires 12:00Z = 14:00 local."* **The workflow file says that. The run history does not.**

| Scheduled fire | Actual start | Lag | Outcome |
|---|---|---|---|
| 2026-09-22 00:00Z | 04:28:06Z | +4h28m | **failure** |
| 2026-09-21 12:00Z | 18:07:56Z | +6h08m | success |
| 2026-09-21 00:00Z | 04:32:10Z | +4h32m | success |
| 2026-09-20 12:00Z | 15:53:00Z | +3h53m | success |
| 2026-09-20 00:00Z | 04:34:13Z | +4h34m | success |

Five consecutive fires landed **3h53m–6h08m** after their cron slot — GitHub deprioritises scheduled workflows under load, and this lane eats the full delay every time. As of 12:30Z the 12:00Z fire has not started; history puts it nearer 16:00–18:00Z, not the 14:00 local Christian was told.

**And the most recent run failed before reaching the sweep at all** — `npm ci` died on `ECONNRESET` (errno -104) at 04:28:47Z. Transient network, not a defect in the sweep script; no Linear write was attempted and nothing was corrupted.

**Neither fact costs anything today**, precisely because of finding (1): THR-1521 does not need this sweep. But it sharpens run f's registry point rather than repeating it — CLAUDE.md requires a lane's cron **and its observed fire time** in the registry *because* slot ≠ cron ≠ fire, and this lane is the textbook case: reading its cron gave a four-hour-optimistic answer that reached Christian as fact. **Logged, not ticketed** — documentation drift is explicitly excluded from Rule 0, and the throttle routes it to Friday's retro.

### Standing checks

**The builder is at five consecutive failures, not three.** All five are the same error — *"You've reached your Fable limit."*

| Run | Ran for | Outcome |
|---|---|---|
| 08:11:01Z | 26m 33s | claimed THR-1521, then died |
| 09:11:00Z | 7s | died immediately |
| 10:11:05Z | 8s | died immediately |
| **11:11:05Z** | **7s** | **died immediately (new)** |
| **12:11:05Z** | **7s** | **died immediately (new)** |

Last success 07:11:06Z — **5h19m of dead build capacity**. Next attempt 13:10:53Z and it will do the same. Not filed and not escalated: a credit top-up is Christian's alone, and moving another lane off its model is a change to his configuration, not a fix a session makes unasked. (The lane is named `tb-opus-pickup` but runs Fable — the name has been misleading on this point for some time.)

**Stalled work: 0 by threshold.** THR-1521's history shows one `Ready for Dev → In Dev` transition against `ORCH_STALLED_PICKUP_THRESHOLD` (3).

**Hand-created `In Dev`: 0.** THR-1521 passed through `Ready for Dev` — this lane promoted it there at 06:30Z.

**In Design: 1 live, 0 excluded** (THR-1525, unassigned, ~7h55m old → counts). T2 is bound, not free to stage.

**Open PRs: 0.** `main` is green — CI `success` on `f3f9fb60`. The heavy-test lane's intermittent timeouts, documented at length in run f, produced no new red this hour.

## Escalations

**None opened on Discord, nothing parked, nothing blocked.**

Discord was considered for the builder outage and **declined.** `keep-work-flowing-cc` last published at 11:53Z and **republishes at 12:53Z — 23 minutes from now** — folding this report's `## Needs Christian` into the briefing. The top-up is already item 1 on Christian's list from the 10:00Z briefing; what this run adds is that it is worth more than advertised, which is an *improvement* to a queued ask rather than news of a new failure. A second channel firing 23 minutes ahead of the one he reads, for something costing nothing this hour, is how a channel stops being read. Local time is 14:30.

Environment note: no git state operation was performed in the home tree — this run's git use was `fetch`, `show`, `ls-tree`, `ls-remote` and `gh` reads only; `ops-publish.sh` commits by plumbing and checks nothing out. The board was read through the MCP connector; the precheck's `linear=nokey` reports only that the probe script has no key of its own, which is the normal state on this machine and says nothing about the connector — confirmed healthy at the first board read. **Zero Linear writes this run** — nothing promoted, nothing staged, no comment posted, no assignee set or cleared, nothing written into `In Dev`, no PR touched, no ticket filed.
