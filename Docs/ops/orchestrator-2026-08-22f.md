---
lane: tb-orchestrator
run: 2026-08-22f
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-22 (run f, ~12:33Z)

## Needs Christian

**You made the wave-1 call at 13:44 and it worked exactly as intended — the board moved within the hour.** That was the half-hour decision the last five briefings kept putting at the top. It is done, it came off the list, and three things followed from it straight away:

- One piece of work went **straight to the shelf, no design needed** — your "wire it, don't delete it" ruling on the mandate prose. Forty-eight lines of writing that narrate the campaign's big moments have been sitting unread behind a check that refuses to load a mandate without them. An agent can take that today without asking you anything.
- Two of the five candidates you looked at **stopped being work** — they fold into other documents instead of getting sessions of their own. That is two design sittings you no longer owe.
- The map that effort runs on has been updated with your ruling, so whoever picks it up next reads the decision rather than the old question.

**What it now needs from you: design sessions.** Your ruling named three, in order — the shared machinery first, then the hunger vocabulary, then making regions real. None can start in an unattended lane; each wants you in a chat. That is the whole bottleneck now, and it is the same bottleneck as item 1 below, which has been waiting four and a half days.

Your list, shortest first:

1. **One yes/no, six days old.** [Should committing a hand of nudge cards carry about 1.6 seconds of held breath before you find out what happened?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) The sound is built and sitting unused. Either answer closes it — yes wires it, no deletes it with the timings written down.
2. **One encounter waiting on your approval to be written.** [The Grateful Kin's return visit](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the) — the town owes the player a welcome nobody ever walks back in to collect. Needs a brief approved by you first, per your own Encounter Factory rule.
3. **Four design sessions now, where there were one.** [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) has been waiting four and a half days — your 6 August note that action cards are too wordy and playing one tells you nothing. Behind it, today's ruling adds the shared machinery, the hunger vocabulary, and [making nations and named areas real](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) instead of only drawn. Also still queued: [a one-button "something looks wrong here" capture](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in).
4. **Two hands-on sessions, whenever you want them.** [Try the anchor idea on a second surface](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) and [the encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game). Blocked on nothing but your time.
5. **One two-minute settings toggle, still queued for an agent to write up.** Finished tickets carrying a question for you keep going invisible because opening a pull request quietly re-assigns them. [The write-up ticket](https://linear.app/threadbare/issue/THR-1190/the-park-decay-remedy-is-a-christian-owned-linear-setting-with-no) has now sat unclaimed since 09:21 this morning.

Nothing is on fire. Two more agents' worth of work went on the shelf this hour, one of it yours.

## T1 — unblock sweep

Scanned 19 `Todo` and 3 `Ready for Dev` (state-filtered; `orderBy:"priority"` not passed — it errors at runtime, impediment #49; sorted in memory). Shelf depth at scan: **3** — THR-1190 and THR-1192 (both process), plus Deferral THR-1133 (attended-only). **Zero product items.** Promotion ceiling did not apply (3 ≪ 15). **Promoted 1, filed 1 — both product.**

**The state change that drives this run: THR-1163 went `Done` at 2026-08-22T11:44:35Z.** That is the wave-1 selection grilling — the item run e's Christian list called *"the highest-leverage half hour on the board, and the only thing keeping two mapped design efforts frozen."* Christian answered it live in chat 14 minutes after run e published. Everything below follows from reading that resolution rather than from the `Blocked by` fields.

Also since run e: THR-1194 (run e's product promotion) was claimed and is in [PR #1571](https://github.com/christianspliid-ui/threadbare/pull/1571), open 12:21Z, `BLOCKED` on required checks only. **Promotion to PR in ~51 minutes.** Its executor filed two new deferrals on the way (THR-1195, THR-1196) at 12:14/12:15Z — both landed in `Todo` with **no comments at all**, so neither carried a coordination block.

**WIP check.** One live claim — THR-1194. THR-1168 and THR-1130 both carry the `Parked` label and are not claims. WIP=1 honoured.

### Filed (1) — a director ruling made claimable

`[orchestrator] T1 file THR-1197: director ruling THR-1163 Done 2026-08-22T11:44:35Z ("wire, not delete… direct execution ticket; no plan doc") → Ready for Dev, assignee:null verified, coordination block posted (project: Content Architecture)`

[THR-1197 — wire the 48 authored mandate milestone prose strings into stage transitions](https://linear.app/threadbare/issue/THR-1197/wire-the-48-authored-mandate-milestone-prose-strings-into-stage).

The wave-1 resolution disposed of five shortlist seams. Three got design sessions, one folds into another document — and one was ruled a **direct execution ticket with no plan doc**. That last one had no ticket, and nothing else on the board would ever have filed it: the wayfinder tickets that produced the ruling are all `Done`, and a design session is explicitly not wanted. Left alone it would have been a ruling with no consumer, which is the same defect this lane was built to close.

Three things make filing it advancing agreed work rather than choosing direction:

- **The outcome was chosen by Christian, in chat, today.** The ticket quotes his ruling verbatim and cites its timestamp. This lane picked no option.
- **The premise was re-verified at filing, not carried.** The seam inventory measured this on 2026-08-17; five days is long enough for a fix to have landed sideways (the upstream-shipped trap). Grepped `origin/main` this run: `MANDATE_MILESTONE_PROSE` still has **zero production importers** — the only non-definition mentions are a doc comment at `mandate-loader.ts:4` and `mandate-content.test.ts`, which asserts the payload's shape while nothing consumes it. Confirmed live in `phaseMandate.ts` that the `wasStageAdvanced` branch emits **no `TickEvent` at all** (only a sphere pressure), and that the one transition which does emit carries a hardcoded `` `Victory! Mandate "…" fulfilled!` `` string beside an unread authored `completed` string for that same mandate. The five-day-old finding is live as written.
- **It is executor-shaped.** Engine + Content pillars, CLI/headless evidence, a named wiring site, and a fail-soft fallback requirement. No browser session owed.

Filed with `priority: 3`. Note this is a **create**, not a promotion — the "do not set priority" rule governs promotions, where a second ordering mechanism would drift from the existing field; on a create the field has to hold something, and leaving it `No priority` would bury a director-ruled item below every Low deferral on the board. Recorded here so the choice is auditable rather than assumed.

Assignee verified null **on a `get_issue` re-query**, by the absence of the key — not off the create response, which omits the key while the issue is in fact assigned (the THR-859 trap, THR-845).

### Promoted (1)

`[orchestrator] T1 promote THR-1196: no Blocked-by line, native blockedBy empty (re-read at promotion), no comments so no standing retire verdict → Ready for Dev (project: Content Architecture)`

[THR-1196 — `hex.spark_encounter` writes an `occurred_at` edge without the `tick` its schema row requires](https://linear.app/threadbare/issue/THR-1196/hexspark-encounter-writes-an-occurred-at-edge-without-the-tick-its). The recipe already has the tick in hand — it writes it into the event node's properties on the line above — and leaves the edge bare, so consumers reading `edge.properties.tick` on a divine-spark edge get `undefined` and a console warning nobody reads.

Clean promote: the defect is **measured**, not predicted (the ticket quotes the real `[GraphSchema]` warning alongside `allSucceeded: true`, which is the whole finding — it warns and lands anyway); liveness gate passes trivially (names no plan doc); latest-comment check trivially clean (no comments existed).

**The mutex on this one is an ordering constraint, and the coordination block says so explicitly.** THR-1196's second Done-when widens the guard *THR-1194 introduces* — a guard that is not on `main` yet. An executor reading only "both edit `hexActionBridge.ts`" could reasonably reverse the mutex once THR-1194 merges and the files are free, and would then find the Done-when unsatisfiable. The block states the reason inline (THR-688 rule B) and says take THR-1194 first. In practice WIP=1 already sequences these correctly and the constraint should never bind.

### Coordination blocks posted on both (required, not bookkeeping)

Both tickets had **zero comments**, so both would have been bounced by `pull-work` Step 3, which validates the latest comment for `Suggested model` / `Parallel-safe with` / `Mutex with`. An item on the shelf being refused every hour is worse than one left in `Todo`: it looks available and starves the lane silently. Each block carries the evidence, the three lines with the mutex reason inline, a `Blocked by:` line, and the evidence shape — and, in both cases, a named measurement trap, because both tickets are about assertions that pass while nothing works.

### Declined (9), each naming its evidence

Every row below was assessed by run e and re-checked here against `updatedAt`; none has moved.

- `[orchestrator] T1 skip THR-1195: wrong destination — its first Done-when is "a recorded decision on what a Divine Herald is", and the ticket itself says adding actorType:'individual' "is one word but not a small change… a design call about what the thing is". T2 input, not executor work.`
- `[orchestrator] T1 skip THR-1024: unmet blocker — prose gate "do not start this before THR-966"; THR-966 verified live in run e's Idea scan as status Idea, never started. updatedAt unchanged since 2026-08-10.`
- `[orchestrator] T1 skip THR-1189: wrong destination — the ticket's own text says wiring a toll into the economy "wants a design pass rather than an executor's judgement call".`
- `[orchestrator] T1 skip THR-1155: wrong destination — and now positively sequenced. Today's ruling puts it third in wave 1, widened to "region identity" (labels + capitals + GeoBorderMesh). Wants its own design session, which is item 3 of the Christian list.`
- `[orchestrator] T1 skip THR-1134: wrong destination — explicitly wants a plan doc before code. T2 input.`
- `[orchestrator] T1 skip THR-1156: wrong destination — programme epic; no execution ticket files directly against it. Its charter THR-1157 is T1.5's input.`
- `[orchestrator] T1 skip THR-1182: unmet gate — its own Blocked-by line reads "blocked in process on the ruling-2 brief approval", a Christian chat approval preceding authoring. Promoting would park the WIP=1 slot on a human gate. Surfaced under Needs Christian.`
- `[orchestrator] T1 skip THR-1114: wrong destination — choosing a Sphere alignment changes what the action is cosmologically, with no agreed outcome to test against.`
- `[orchestrator] T1 skip THR-1148: wrong destination — the ticket is itself a design question ("decide whether that is the design") and its own recommended option is already shipped.`
- `[orchestrator] T1 skip THR-175: unmet trigger — "intentionally deferred… not actively claimable"; neither named trigger met.`
- `[orchestrator] T1 skip THR-1157, THR-1162, THR-902, THR-907: wayfinder-labelled — decisions, not executor work; never enter Ready for Dev. Routed to T1.5.`

Skipped without assessment: THR-1043 and THR-791 (assigned to Christian), THR-870 (parked programme), THR-789 (programme epic).

**Nothing held.** No candidate arrived carrying a hold condition, and the two items runs c/d held were released by run e.

**Coverage note.** Run e scanned `Idea` as a one-off and recorded that no `wayfinder:*` issue sits there and that THR-966 is genuinely unstarted. This run did not repeat that scan — `Idea` is the general backlog, not a promotion queue, and pulling from it would be choosing direction. The two facts it established are carried, not re-verified; if a future decline turns on THR-966's state, re-check it rather than trusting this line.

**Week's completion mix (product vs process), 2026-08-15 → 2026-08-22:** ~30 product against **1** process-infrastructure (THR-1058), plus 4 wayfinder decision tickets (THR-1163 is today's increment) and 2 UL proposals. Today's lane actions now read **3 process, 4 product**. **The headline finding from earlier runs is retired this run, and it is worth saying why rather than just dropping it.** The shelf held zero product work at scan for the fourth consecutive run, and the previous refill came from an executor tripping over a defect while shipping something else — a shelf refilled by accident. This one did not: it was refilled by a director decision reaching the board within an hour of being made. That is the supply route the earlier reports said was missing. It is still narrow — one ruling produced one ticket — and the three design sessions it also produced remain blocked on attended time.

## T1.5 — wayfinder sweep

Two open maps. **AFK tickets resolved: 0** — not through failure. `ORCH_WAYFINDER_AFK_MAX` (2) was never approached; both maps have burned down every research and agent-doable ticket, and what remains on each is exactly the human-in-the-loop half this lane must not touch. **Eighth consecutive run in that state** — but the composition changed materially this run.

- `[orchestrator] T1.5 map THR-1157 "Typed game-state architecture — machinery + first wave": frontier 2 → 1. THR-1163 (wayfinder:grilling) resolved by Christian and closed Done 11:44:35Z. Sole remaining open child THR-1162 (wayfinder:prototype), unassigned, HITL. Surfaced under Needs Christian.`
- `[orchestrator] T1.5 map THR-902 "Encounter experience redesign — vertical slice": frontier 0 by the rule — the sole open child THR-907 (wayfinder:prototype) carries an assignee (Christian), which drops it from the frontier set. On his plate, not stalled. Unchanged.`

**Map maintenance performed — THR-1157's Decisions-so-far was four days stale on its own closing question.** The map's five recorded decisions stopped at the edge-integrity audit; the wave-1 ruling that *defines wave 1* was not among them, because Christian resolved it in chat rather than through this lane. A design session opening that map to start the shared-machinery doc would have read the question, not the answer. Appended the ruling as a sixth Decisions-so-far entry: the ordered slate, the two rows that fold into other documents rather than getting sessions, the mandate-prose ruling with its new ticket link, and the "three plan docs, not six" verdict. Wrote nothing else — no scope, no interpretation.

**The map is not cleared.** Its destination requires each wave-1 seam to have a plan doc ready for handoff; the slate is chosen and zero of the three docs exist. What remains on it is one prototype sitting and three design sessions, all Christian's.

## T2 — design staging

**Not triggered.** Non-`Deferral` items in `Ready for Dev` after this run's actions: **3** (THR-1190, THR-1192, THR-1197), against `ORCH_PROGRAM_WORK_FLOOR` of 2. At scan it was 2 — met on the number, and by two process tickets.

**Say the uncomfortable half plainly, because the arithmetic flatters this run.** The floor counts non-Deferral items, and this run satisfied it by filing the product item itself. Had the wave-1 ruling not landed, the shelf would have gone into the next hour holding two process tickets and one attended-only Deferral, and the floor would have read "healthy" over a product count of zero. The floor measures the wrong thing at low shelf depths; that is a known weakness of the constant, not a defect introduced here, and it is recorded rather than acted on because changing a constant mid-run is not this lane's call.

**The bound would have blocked staging anyway.** `ORCH_MAX_IN_DESIGN` is 1 and the lane-staged slot is occupied: a predecessor staged [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) at 2026-08-19T02:31Z. That is now **~106 hours** past staging, more than double the 48h mark. Per the skill it is re-surfaced, not re-staged — named again under Needs Christian. (`In Design` reads 2 in raw terms; THR-790 is assigned to Christian and was never staged by this lane, so the bound stands at 1 of 1.)

**And the queue behind it grew by three this run.** The wave-1 ruling created demand for three design sessions — shared machinery, hunger vocabulary, region identity (THR-1155) — none of which this lane may author, since it runs Sonnet by Christian's 2026-08-06 ruling. Add THR-1134 and THR-1002 and the attended-design queue is five deep against one staging slot and zero attended sessions in four and a half days. **That, not the shelf count, is the real supply constraint, and it got worse this hour rather than better — which is the correct outcome of a good decision, not a problem with it.**

## T3 — architecture health

**Not due — already run this UTC day.** Run a performed the daily sweep at ~07:20Z (`Docs/ops/orchestrator-2026-08-22.md`), the first run past `ORCH_HEALTH_SWEEP_HOUR` (6 local).

**No detector was run this run, and nothing about architecture health is asserted here.** For the current state — 7 LEAKED interface contracts, 21 canon-staleness warnings with rows enumerated, `sweep:rank-reach` PASS with its two standing caveats, the three `check:process` sub-checks that are structurally unmeasured in this lane, and the redundancy pass's stated partial coverage — read run a's report. This section's silence is not a clean result.

**Redundancy: not assessed this sweep.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is Saturday. Last pass: `Docs/ops/test-suite-health-2026-08-17.md`. Nothing about suite health is asserted here.

## Escalations

None raised. No question needed the Discord channel — every open decision is already a named Linear ticket surfaced under Needs Christian, which is the routing that exists for exactly that.

Nothing parked, nothing held. One note for the next run: THR-1197 and THR-1196 both entered the shelf within two minutes of each other and are genuinely parallel-safe (mandate files versus `hexActionBridge.ts`), but THR-1196 must wait on THR-1194's PR merging. If the executor's next pickup takes THR-1196 while [PR #1571](https://github.com/christianspliid-ui/threadbare/pull/1571) is still open, that is the ordering constraint binding — expect a bounce, and expect THR-1197 to be the correct take instead.
