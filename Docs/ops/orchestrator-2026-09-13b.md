---
lane: tb-orchestrator
run: 2026-09-13b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-13 (run b, ~02:32Z)

## Needs Christian

**The design sitting you have been asked for four times is now five items deep, and the fifth one is yours by authorship.** When you ruled on encounter firing back in August you said *"rhythm works — prune later"* and chartered the pruning pass as the later. It has been waiting on the Encounter Factory raising content density — and the Factory finished on Thursday. Nobody noticed for two days, because the lane that watches for unblocked work was watching the wrong end of the chain. [The pruning pass](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once) is now free, and it wants a design session, not a builder.

So the standing ask has not changed, only grown: **five pieces of work are queued behind one afternoon of your attention.** They are [ambitions nothing can act on](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the), [beasts that cannot be cast in a scene](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor), [six kinds of content with no reference page](https://linear.app/threadbare/issue/THR-1495/six-content-kinds-have-no-codex-category-so-their-content-cards-can), [which kind of work should stir which kind of trouble](https://linear.app/threadbare/issue/THR-1497/catalystquery-is-repaired-and-gated-but-unreachable-from-the-live), and now [how often encounters should fire](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once). None is urgent alone. Together they are the whole of what the build queue cannot start.

**One job went into the queue this hour, and it is a keyboard trap in something you shipped yesterday.** Detail pages — the pop-up panels that open when you click a name, a place, a faction — used to be built but not wired to anything, so a missing piece of their plumbing did not matter. Yesterday's *one card, one router* work wired them into the live game. The missing piece now matters: the panel does not tell a screen reader it is a dialogue, and keyboard focus never moves into it and never comes back out. Escape still closes it, so it is not a trap you cannot escape — it is a panel a keyboard user cannot reach the inside of. It has been filed since August waiting for exactly this decision to be made, and the decision got made by shipping. Queued, [here](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no), and it needs nothing from you.

**All three design maps are unchanged and still finished waiting — re-proved from the board this hour, not carried forward.** Every piece of homework an agent is allowed to do on **fights**, **items** and **powers & spellcraft** is done: twenty-one research tickets and five agent-doable tasks, all closed. **Twelve questions remain and every one of them is yours.** Say **"work the map"** in a chat and they get worked one at a time.

- **[Fights](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten waiting. Six are questions: [do companies fight as units?](https://linear.app/threadbare/issue/THR-1271/companies-in-fights) · [how a fight sits inside an encounter](https://linear.app/threadbare/issue/THR-1269/embedding-the-fight-block-encounter-integration-contract) · [how much monster is enough monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster) · [what starts a fight without you](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over) · [what losing looks like when it isn't death](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum) · [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands). Four are mock-ups to react to rather than answer.
- **[Items](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one waiting: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).
- **[Powers & spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one waiting, already in your name: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).

## T1 — unblock sweep

Shelf at scan: **14** in `Ready for Dev`, **7** of them non-`Deferral`. Below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available.

**30 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **15 were judged here** — the same fifteen run a judged, minus the two it promoted. **No candidate arrived since run a's 01:29Z scan**, so this run's work was entirely in re-checking the *far* end of the dependency chains rather than in reading new tickets. That is where both of this run's findings came from.

### Promoted — 1

**[THR-1024](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no) — `DetailModal` forks its own overlay: no `role="dialog"`, no `aria-modal`, no focus management.** `Low`, unassigned, `Encounter Experience`, labels `Deferral` + `UI`. Filed 2026-08-07, declined by every run since 2026-08-16.

- **Dependency — the reason this is a promotion and not a re-decline.** The gate is prose: *"Sequencing — do not start this before THR-966."* [THR-966](https://linear.app/threadbare/issue/THR-966/detail-page-tts-is-unreachable-the-detailmodaldetailpage-cluster-is) read `Idea` at every prior sweep; it now reads **`Done`, completed 2026-09-12T15:54:36Z**. Native `blockedBy` is empty (prose gate only); no time gate; no unresolvable alias.
- **What actually cleared it.** THR-966's Done-when #1 was a design fork — *"either (a) mount the detail-page stack in the live app, or (b) prune it"* — and the 2026-08-29 decline comment on THR-1024 traced the chain to two `Idea`/`Canceled` nodes T1 does not scan, concluding correctly that no sweep could ever clear it. It was cleared from the other end instead: [THR-1490](https://linear.app/threadbare/issue/THR-1490) — *"One card, one router slice 1 — mount the detail-page stack behind one ref router … (resolves THR-966 as mount)"*, PR [#1919](https://github.com/christianspliid-ui/threadbare/pull/1919) / `75bc2a3c`. **The fork was settled by shipping, not by a design session.**
- **The defect is live on `main`, measured this run rather than inherited.** A ticket idle 37 days is the classic shape for a silent already-shipped close, so both halves were checked: `git show origin/main:src/components/shared/DetailModal.tsx` still carries **no `role="dialog"` and no `aria-modal`** — only two button `aria-label`s — and `GameView.tsx` now imports the provider (line 132) and component (line 133), wraps at 4537 and renders `<DetailModal />` at **line 5603**, under the comment *"mounted once, for the whole game."* `src/hooks/useRefRouter.ts` is a further production importer. The ticket's own *"zero production importers"* premise is stale as of 2026-09-12.
- **Destination:** dev-ready, and newly so. The thing that made it design input — an undecided mount-vs-prune call — is decided. What remains is one component, one known target shape and a test.
- **Standing retire verdict (THR-990):** none. Two comments: the 2026-08-07 filing block and the 2026-08-29 orchestrator decline record. A decline record is not a retire verdict — it routed the ticket onward, and its stated blocker is what has now cleared.
- **Plan-doc liveness:** trivial pass; names no plan doc.
- **Rule 0 / materiality:** not process work. `Deferral` in an active project → CLAUDE.md § Prioritization **rule 1**.
- **Write then verify:** `get_issue` re-query reads `Ready for Dev`, `startedAt: 2026-09-13T02:31:45.207Z`, `stateHistory` with `Todo` ended and `Ready for Dev` started at that timestamp, **no `assignee` key present**. Priority untouched at `Low`.
- **Coordination block posted** 02:32:33Z.

**Three things in the promotion comment are new information rather than a restatement of the filing block**, and all three would otherwise be rediscovered at pickup:

- **The Done-when's third bullet is dead.** *"If THR-966 resolves as prune: close this citing the prune commit"* — it resolved as **mount**. A session reading the ticket cold could reasonably take the cheap arm and close it for nothing.
- **Take the first alternative, not the second.** The Done-when offers *compose `Modal`* or *hand-implement the semantics + Law 50 focus contract*. [THR-1079](https://linear.app/threadbare/issue/THR-1079) put that focus contract **in the primitive** for all consumers on 2026-08-10, so composing satisfies both halves — and hand-rolling it would re-fork the design system this ticket exists to un-fork (Laws 26/27).
- **A soft mutex with a stated reversal test.** [THR-1492](https://linear.app/threadbare/issue/THR-1492) (*one card, one router slice 3*) does **not** touch `DetailModal.tsx` — its scope is `EntityCard`, `entityDetail.ts`, `NpcDetailView`, `AgentDetailPanel`, `cultureDetail.ts`, `AttachmentDetailView`, `FactionSheet`'s local `Section`. The plausible collision is the design-system trio it must update in its own PR (`component-selection.md`, `primitives.md`, `styleguideSync.test.ts`). Per THR-688 rule B the reason is stated inline with its falsifier: a diff leaving those three untouched makes the mutex verifiably inapplicable and reversible in a comment.

### Held by the ceiling — 0

The ceiling had headroom and nothing to hold: 5 available, 1 used. Sixth consecutive run with zero held — this one, like run a, from full headroom rather than a throttle.

### Declined — 14, and one of them changed reason

**[THR-1218](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once) is no longer dependency-held.** It carried a native `blockedBy` relation to [THR-1043](https://linear.app/threadbare/issue/THR-1043) (the Encounter Factory), recorded as an unmet blocker in every prior run's table. THR-1043 completed **2026-09-11T09:36:51Z**. The decline stands — its body reads *"Not Ready for Dev — needs a design pass when unblocked"* — but on **wrong destination alone**, which moves it out of the dependency bucket and into the design-staging backlog. That backlog is now **five**, not four, and this is the item Christian chartered himself at the [slice verdict session](https://linear.app/threadbare/issue/THR-907). Surfaced under **## Needs Christian** above.

**Four more are unblocked design input, unchanged:** [THR-1497](https://linear.app/threadbare/issue/THR-1497), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1495](https://linear.app/threadbare/issue/THR-1495). All four are `Blocked by: nothing` and will pass the dependency check every hour until a design session takes them.

**One is blocked and wrong-destination both:** [THR-790](https://linear.app/threadbare/issue/THR-790) — `blockedBy` THR-786, plus *"Needs its own design finalization before Ready for Dev."*

**One is assigned:** [THR-791](https://linear.app/threadbare/issue/THR-791), Christian.

**One is not executor work by construction:** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — *Christian plays all five encounters*. `High` and unblocked, but no builder can perform it.

**Six are the standing set** — design-gated or container epics whose bodies state that no execution ticket files against them ([THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789), [THR-1393](https://linear.app/threadbare/issue/THR-1393), [THR-1381](https://linear.app/threadbare/issue/THR-1381), [THR-870](https://linear.app/threadbare/issue/THR-870), [THR-175](https://linear.app/threadbare/issue/THR-175)). Baseline enumeration with per-ticket evidence: [2026-09-12 run a's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep). None declines on a dependency, so none is re-verifiable the way the two above were.

### A defect in this tier's own method, recorded not ticketed

**Both of this run's findings were invisible to the shortcut every recent run has used.** Runs have skipped re-verifying the standing decline set when no candidate's `updatedAt` had moved since the previous scan — a reasonable-sounding economy that is **wrong for dependency-held declines, because a blocker going `Done` does not touch the blocked ticket's `updatedAt`**. Neither THR-1024 nor THR-1218 was modified at all; their *blockers* were.

Measured cost: THR-1024 sat promotable for **~11 hours** (THR-966 `Done` 15:54Z on 09-12, promoted 02:31Z), and THR-1218's decline reason was stale for **~2 days** (THR-1043 `Done` 09:36Z on 09-11). No work was lost and no shipped artifact was corrupted — the queue simply held one fewer item than it should have, against a shelf that was not starved. **Below the materiality bar, so this is a report line and not a ticket**, per the process-work throttle: scheduled lanes log, the weekly retro promotes.

The corrective, for whoever batches it: the re-check predicate for a decline should key on **the blocker's** state, not the candidate's `updatedAt`. Only three of the standing declines are ever dependency-held, so re-reading those three blockers each run costs three calls, which is what this run did by hand.

## T1.5 — wayfinder sweep

**Three open maps. Zero AFK-resolvable tickets, proved from labels this run rather than inherited.**

| Map | Open children | Research / AFK open | Grilling | Prototype | AFK resolvable |
|---|---|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 | **0** | 6 | 4 | **0** |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 | **0** | 0 | 1 | **0** |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | **0** | 0 | 1 | **0** |

**AFK tickets resolved: 0, structurally.** `ORCH_WAYFINDER_AFK_MAX` is 2 and the budget went unspent because no ticket on any map is one this lane is permitted to resolve. Two label-scoped board reads this run:

- `list_issues(label:"wayfinder:research")` → **21 of 21 `Done`**, workspace-wide.
- `list_issues(label:"wayfinder:task")` → **5 of 5 `Done`**.

All twelve open children therefore carry `wayfinder:grilling` or `wayfinder:prototype`, which are HITL by construction. An agent resolving one is the broken-HITL failure mode the wayfinder skill names, so none was touched.

Re-proving this hourly is deliberate: zero-resolved has two causes indistinguishable in a counter — a lane that found nothing it *could* do, and a lane whose AFK work is *finished*. This is the second, demonstrated by label query rather than asserted from last hour's table. No child's `updatedAt` has moved since 2026-08-26, so no per-child native blocking relation was re-verified by hand and none is reported as freshly checked; the AFK verdict does not depend on that check.

The twelve HITL tickets are surfaced under **## Needs Christian** above, by name and in game terms.

## T2 — design staging

**Not triggered.** `ORCH_PROGRAM_WORK_FLOOR` is 2; the shelf holds **7** non-`Deferral` items in `Ready for Dev` — three and a half times the floor. No item staged, no `In Design` budget consumed.

This run's promotion was `Deferral`-labelled, so the non-`Deferral` count is unchanged at 7 while the shelf total rises 14 → 15. The floor counts program work precisely so a shelf topped up with deferrals cannot read as healthy when authored work has run dry. It has not run dry.

**The staging backlog is now five, up from four, and it grew by discovery rather than by filing.** THR-1218 joined it this run not because anything was created but because its blocker had been `Done` for two days. All five decline on *destination*, the one reason no amount of upstream merging clears. Six consecutive runs in which design-gated declines outnumber promotable candidates. This tier cannot act on it: `ORCH_MAX_IN_DESIGN` is 1, the remit is staging one item for an attended session, and that ask has been surfaced and not yet picked up.

## T3 — architecture health

**Not due this run.** `ORCH_HEALTH_SWEEP_HOUR` is 6 local; this run fired at **04:32 local** (02:32Z), so the daily sweep has not yet come due today. The last full sweep was [2026-09-12 run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) at 08:29Z.

**No detector ran this hour and none is reported as clean on this run's authority.** Specifically not run: `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean. `newFindings: 0` in the frontmatter means **"no sweep ran"**, not "a sweep found nothing".

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed and no coverage is claimed.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

Two incidental observations from board reads T1 needed for its own arithmetic, recorded as such rather than as sweep results:

- **WIP is 1** — [THR-1494](https://linear.app/threadbare/issue/THR-1494) (two factor lines on the scene screen are not sentences), assigned, PR [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) open, one `Ready for Dev → In Dev` transition. Nothing meets `ORCH_STALLED_PICKUP_THRESHOLD`, and nothing in `In Dev` was hand-created there.
- **The shelf decremented by one between runs and the cause is a merge, not a claim.** [THR-1466](https://linear.app/threadbare/issue/THR-1466) (appositive `{cast:*}` prose collides with title-form NPC names) completed **02:25:30Z**, seven minutes before this scan. Recorded because an unexplained shelf decrement is otherwise indistinguishable from an item being claimed without a state transition.

### Product vs process — the week

One product promotion, nothing filed, no process ticket — the method defect above was deliberately logged as a report line rather than filed, per the throttle. The trailing-week ratio moves to roughly **36 product / 7 process (~84% product)**; the process-ticket budget (at most one per three runs) remains untouched.

**Headline: the queue is fed, and this hour it was fed from the past rather than the present.** Nothing new arrived on the board in the last sixty minutes. The one promotion came from re-reading a 37-day-old ticket's blocker and finding that yesterday's shipping had answered a design question nobody had convened to answer — and a second ticket turned out to have been free for two days on the same blind spot. Both are the delivery machine finding its own gaps. Against that, five tickets now decline on destination rather than dependency, which no merge will ever clear. The feature pipeline does not need more tickets. It needs an afternoon of its director's attention, and that finding is now six runs old and one item larger.

## Escalations

**None raised, none parked.** No question needed asking: agreed work was not exhausted (one promotion made from full ceiling headroom), no detector ran and so none failed, the write matched its re-query, and no candidate required a direction call this lane is not permitted to make. `ORCH_ESCALATION_CHANNEL` was not contacted.

One judgement call was made unilaterally and is recorded rather than escalated, per the standing delegation: **the recommendation that a claiming session compose `Modal` rather than take THR-1024's second alternative** is the *how* of an already-agreed repair, and is written into the coordination comment as a recommendation with its reasoning, not as an instruction. No ticket was merged, re-scoped, or closed to effect it.
