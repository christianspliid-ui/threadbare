---
lane: tb-orchestrator
run: 2026-09-22h
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-22 (run h, ~14:30Z)

## Needs Christian

**The ask is the same one, but it is now the *only* one: top up the builder's credit.** [claude.ai usage settings](https://claude.ai/settings/usage).

**The last report offered you a choice and one half of it was wrong.** It said: *"top up the builder's credit — or have a session move that lane off Fable."* I went looking for how a session would actually do that second thing, and **it cannot.** There is no model setting on the builder lane anywhere a session can reach: the lane's own instruction file names no model (the line inside it that says it runs on Opus is a sentence in the prose, not a setting anything reads), and the controls a session has for editing a scheduled lane — its schedule, its instructions, its name, on/off — **have no model among them at all.** Whatever picks the model for a scheduled run sits in your app's settings, not in any file or command an agent holds.

So there is nothing waiting on me here, and nothing to wait for. **The top-up is the whole lever.**

**Everything else is unchanged and still true.** The builder has been dead for seven hours and seventeen minutes — seven failed attempts in a row, every one the same "you've reached your Fable limit", the last at 16:11 local. It will try again at 17:11 and fail the same way. And the prize is unchanged too: [artifact traits](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) is still sitting picked-up-but-unbuilt, and I re-checked this hour that nothing was started on it — no branch, no pull request, no code. The builder will find it and carry on by itself the moment it can run.

**The design hour is still the thing after that**, unchanged: **[Scenes are being offered to exactly the people who will refuse them](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its)** — the world hands a scene to whoever leans one way on the value it is about, but when the scene's choice forks on that same value, the arm worth taking is usually the other one. Open a chat and say you want to work THR-1525.

**Nothing is being lost while this sits.** No pull requests are open, the code is green, and the board has not moved at all since 10:22 local.

## T1 — unblock sweep

| Column | Run g (12:30Z) | This run (14:30Z) |
|---|---|---|
| `Ready for Dev` | 0 | **0** |
| `Ready for Dev`, non-`Deferral` | 0 | **0** |
| `In Design` | 1 (0 excluded) | 1 (0 excluded) |
| `In Dev` | 1 | 1 |
| `Todo` | 28 | 28 |

**Nothing promoted. Nothing was promotable.**

**The board has not moved since 08:22:54Z — six hours — and that is measured, not assumed.** `Todo` holds 28 items and no item carries an `updatedAt` newer than 08:22:54Z. The `Idea` column was scanned again this run (first 50 of a longer page): **zero items created or updated since 2026-09-20**, so nothing arrived there either. Nothing on this board has been filed, touched, or re-stated this hour — which is exactly what a dead builder and an absent director produce, and is the honest reason this tier is short rather than a tier that skipped its work.

`Todo` composition, re-derived from this run's own scan: **15 wayfinder-labelled** (skipped unconditionally — T1.5's input, never `Ready for Dev`) and **13 non-wayfinder**. The thirteen, each with the reason it is not dev-ready, unchanged from run g and not re-read in full this run because nothing in the column has changed since run g read them:

- **Design-first (T2's input, not T1's): 6** — THR-1526, THR-1528, THR-1523, THR-1274, THR-1393, THR-1381.
- **Trigger unmet: 3** — THR-1522, THR-175, THR-1218.
- **Not executor work: 4** — THR-1220 (HITL sitting), THR-870 (parked direction), THR-789 (epic), THR-791 (assigned to Christian).

**THR-1522 remains declined on its semantic gate, not its `Blocked by` half.** Its stated blocker THR-790 is `Done` (02:15:34Z), but the ticket is *also* gated on slice 1's census showing the pool term moves, and THR-790's shipping comment records that census as `FLAT` — 0 of 83 gold-reach encounters with every row at the cap, so the limit is eligibility rather than weight. **A met blocker over a failed kill criterion is the shape T1 must not promote on.** Stated once, carried, not re-argued.

**Ceiling: neither bound engaged.** Shelf 0, far under the backed-up threshold of 15; 0 promotions of a permitted 5. **No candidate was held back by a ceiling** — every item above is excluded on its own merits.

**Rule 0 / materiality:** nothing filed, nothing promoted. The finding below sits in the delivery machinery and **was not filed as a ticket** — the process-work throttle gives scheduled lanes the log and the run report, and the weekly retro the single promotion point. It is not a loss actively corrupting work as it runs, which is the sole exception. **The headline finding is that the feature pipeline needs a builder and then design supply** — never another process promotion.

## T1.5 — wayfinder sweep

Three open maps, unchanged since 2026-09-11: Item Generator ([THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)), Powers & Spellcraft ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)), Physical Conflict ([THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)).

**AFK frontier: 0.** Read off this run's own `Todo` scan: the 15 wayfinder items are 3 `wayfinder:map`, 6 `wayfinder:grilling` (THR-1266, THR-1267, THR-1268, THR-1269, THR-1270, THR-1271), 6 `wayfinder:prototype` (THR-1232, THR-1236, THR-1263, THR-1264, THR-1265, THR-1272) — **zero `wayfinder:research`, zero `wayfinder:task`**. `ORCH_WAYFINDER_AFK_MAX` (2) did not bind; **nothing claimed, nothing resolved, nothing closed** — the sole sanctioned exception to "never assign yourself" went unused because nothing was eligible for it.

**HITL frontier: 12** — 6 grilling, 6 prototype; 11 unassigned, THR-1232 assigned to Christian. **Unchanged since 2026-08-26 — twenty-seven days.** Not re-listed by id against this hour's single ask; folded into the supply picture as one fact, which is its honest weight.

## T2 — design authoring

**Triggered, and barred — unchanged from the last five runs.**

Non-`Deferral` `Ready for Dev` is **0** against `ORCH_PROGRAM_WORK_FLOOR` of 2, so the trigger fires hard. `In Design` holds **1 live** item — [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), staged by run b at 04:37:11Z, unassigned, **~9h53m old**, and therefore **counting** by the liveness predicate (only `Parked`, or unassigned-and-stale-past-7-days, are excluded). `ORCH_MAX_IN_DESIGN` is 1. **Nothing staged.**

The 48h re-surface clock has ~38h left on it; THR-1525 is re-surfaced in `## Needs Christian` as the standing design ask, not re-staged.

Named for the next trigger, in priority order: THR-1526 (untrue prose reaching live mortals, Medium), THR-1523 (attention model, Medium), THR-1528 (battle-history record, Low).

`ORCH_MAX_IN_DESIGN` is **not** being raised in-run to route around the bar — that belongs to the weekly retro or to Christian, and a second *staged* item would put nothing on the build shelf regardless, since staging is not authoring. Stated once, not re-argued.

## T3 — architecture health

**The daily sweep is not due — it ran at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-22b.md) (06:35 local), past `ORCH_HEALTH_SWEEP_HOUR`. No detector was run this hour and none is reported clean.** The weekly test-suite pass is not due until 09-28 (today is Tuesday; `ORCH_TESTHEALTH_DOW` is Monday), so nothing is said about it rather than a stale result repeated. **Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is browser-only and was not run.

The finding below came from **falsifying the previous run's own advice to Christian**, not from a detector sweep.

### New finding: no session can move the builder off Fable — the alternative run g offered Christian does not exist

Run g put two options to Christian: *"top up the builder's credit … Or have a session move that lane off Fable."* The first is real. **The second was never available**, and leaving it standing invites him to wait for an agent to do a thing no agent can do. Verified two independent ways this run:

| Where a model pin could live | What is actually there |
|---|---|
| `tb-opus-pickup/SKILL.md` frontmatter | `name` and `description` only — **no `model` key**. The task directory holds that one file and nothing else; there is no sidecar config |
| The lane's prompt body | *"running an automated hourly pickup on Opus"* — **prose inside the instructions**, not a setting. Nothing reads it as configuration, which is why a lane named `tb-opus-pickup` dies on a **Fable** limit |
| The scheduled-task update API | Accepts `title`, `prompt`, `description`, `cronExpression`, `fireAt`, `enabled`, `notifyOnCompletion`. **No `model` field exists on it** |
| Any other lane's file | Grepped all 14 task directories for a model key: **zero matches** outside one lane's prose |

So the model for a scheduled run is resolved outside everything a session can write, and **editing the lane's instructions to say "Opus" harder would change nothing** — the existing sentence already says it and has been wrong all day. This also closes a standing trap this lane has hit before: *never trust a lane's documented model*. The name says Opus, the prompt says Opus, the registry says Opus, and the runtime is Fable.

**Not filed as a ticket.** It is documentation drift plus a wrong sentence in a report — explicitly non-qualifying under Rule 0, and the process-work throttle routes it to Friday's retro. Its value is spent the moment it reaches Christian, which is what `## Needs Christian` is for.

### Standing checks

**The builder is at seven consecutive failures.** All seven are the same error — *"You've reached your Fable limit."*

| Run | Ran for | Outcome |
|---|---|---|
| 08:11:01Z | 26m 33s | claimed THR-1521, then died |
| 09:11:00Z | 7s | died immediately |
| 10:11:05Z | 8s | died immediately |
| 11:11:05Z | 7s | died immediately |
| 12:11:05Z | 7s | died immediately |
| **13:11:05Z** | **7s** | **died immediately (new)** |
| **14:11:05Z** | **7s** | **died immediately (new)** |

Last success 07:11:06Z — **7h17m of dead build capacity**. Next attempt 15:10:53Z and it will do the same.

**THR-1521's resume premise re-verified, not inherited.** `git ls-remote --heads origin` matches **no branch** containing `1521`, and `gh pr list --state open` returns **empty**. No work was started, so `pull-work`'s Step 1.5 → 1.6 resume path still applies exactly as run g described it: the lane wakes to a claim it can prove dead, re-asserts it, and continues. **Nothing was written to THR-1521 and no comment was posted** — Step 1.8 branches on whether a claim comment exists, so an observer lane commenting there would change which branch fires on a ticket whose recovery depends on it.

**Stalled work: 0 by threshold.** THR-1521's history shows one `Ready for Dev → In Dev` transition against `ORCH_STALLED_PICKUP_THRESHOLD` (3).

**Hand-created `In Dev`: 0.** THR-1521 passed through `Ready for Dev` — this lane promoted it there at 06:30Z.

**In Design: 1 live, 0 excluded** (THR-1525, unassigned, ~9h53m old → counts). T2 is bound, not free to stage.

**Open PRs: 0.** `main` is green — CI `success` on `f3f9fb60`. The heavy-test lane failed once on that same SHA at 07:27Z and **succeeded on the 08:32Z rerun of the identical commit**, which is the intermittent-timeout pattern run f documented and not a new red.

## Escalations

**None opened on Discord, nothing parked, nothing blocked.**

Discord was considered for the builder outage and **declined again**, on the same reasoning as run g and with the same arithmetic re-checked: `keep-work-flowing-cc` last published at 13:53Z and **republishes at 14:53Z — 23 minutes from now** — folding this report's `## Needs Christian` into the briefing. The top-up is already item 1 on Christian's list; what this run adds is that it is the *only* item, which is a narrowing of a queued ask rather than news of a new failure. A second channel firing 23 minutes ahead of the one he reads, for something costing nothing in that window, is how a channel stops being read. Local time is 16:30.

Environment note: no git state operation was performed in the home tree — this run's git use was `fetch`, `show`, `ls-tree`, `ls-remote` and `gh` reads only; `ops-publish.sh` commits by plumbing and checks nothing out. The board was read through the MCP connector; the precheck's `linear=nokey` reports only that the probe script has no key of its own, which is the normal state on this machine and says nothing about the connector — confirmed healthy at the first board read. **Zero Linear writes this run** — nothing promoted, nothing staged, no comment posted, no assignee set or cleared, nothing written into `In Dev`, no PR touched, no ticket filed.
