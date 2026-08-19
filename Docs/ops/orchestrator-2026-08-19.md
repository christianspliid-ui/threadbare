---
lane: tb-orchestrator
run: 2026-08-19
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-19 (run a, ~02:30Z)

## Needs Christian

**The work shelf has run down to cleanup only.** There is real work queued, but every single item on it is a small tidy-up — nothing that makes the game better to play. That is not something the lanes can fix by working harder; new play-facing work has to be designed first, and design needs you. Four things are waiting, in the order I would do them:

1. **One design session would refill the shelf on its own.** [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — your own note from 6 August: the action cards are too wordy, you cannot tell what they actually do, and playing one gives you no feedback. Meanwhile the encounter cards already look and read the way you wanted. This is about making all the cards in the game speak one language. I have queued it up for design and gathered what the session needs to read; it wants an attended chat session to actually write the plan.

2. **One decision unlocks a whole batch of design work.** [Which parts of the game-state rework go first](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) — all the research behind it is finished and waiting on your call. Your own map says answering it "clears the last fog" and triggers the carve-up into design sessions. This is the highest-leverage half hour on the board right now.

3. **Two hands-on sessions are ready when you are.** [Try the anchor idea on a second surface](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) (a throwaway prototype you react to), and [the encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) — your ruling on prose, firing, UI and game feel. Both are blocked on nothing but your time.

4. **One encounter is waiting on your approval to be written.** [The Grateful Kin's return visit](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the) — the town now genuinely owes the player a welcome, and a player can see it, but nobody ever walks back in to collect. Writing that scene needs a brief approved by you in chat first, per your own Encounter Factory rule. Say the word and an attended session drafts one for you.

Nothing is on fire. The last week shipped a lot of play-facing work — roughly 48 game-facing tickets against 4 housekeeping ones. The pipeline just needs refilling at the top.

## T1 — unblock sweep

Scanned 20 `Todo` and 5 `Ready for Dev` (state-filtered, sorted in memory). **Shelf depth: 5, all `Deferral`-labelled, four of five `Low` — zero non-`Deferral` program work.** The promotion ceiling did not apply (5 < 15).

**Promoted (1).**

- `[orchestrator] T1 promote THR-1170: no blocker ever named (filing block reads "Blocked by: nothing"); related THR-1052 Done 2026-08-18T09:33Z, so the corpus sweep it extends is on origin/main. Latest-comment check clean — only the filing coordination block, no retire verdict. Plan-doc liveness: passes trivially, no Docs/plans artifact named. → Ready for Dev (project: Encounter Experience). State verified by get_issue re-query; assignee key absent. Coordination block posted as latest comment.`

Chosen as the strongest product candidate in `Todo` that is neither sequenced by an open wayfinder map nor waiting on a human gate: every nudge card in the Meet-The-First flow renders the same plate, on the first encounter a new player ever sees.

**Declined (6), each naming its evidence.**

- `[orchestrator] T1 skip THR-1182: unmet gate — its own Blocked-by line reads "blocked in process on the ruling-2 brief approval", i.e. a Christian chat approval that precedes authoring. Promoting would park a ticket In Dev holding the WIP=1 slot waiting on a human. Surfaced under Needs Christian instead.`
- `[orchestrator] T1 skip THR-1114: standing verdict (THR-990 check) — latest comment is titled "Why this is Todo and not Ready for Dev" and states "Promoting it to the queue as-is would hand an executor a decision they would have to invent, and an invented cosmology alignment is worse than the current honest warning." Wrong destination → design pass.`
- `[orchestrator] T1 skip THR-1024: unmet blocker — prose gate "do not start this before THR-966", and THR-966 is state Idea, its mount-vs-prune disposition undecided.`
- `[orchestrator] T1 skip THR-1148: wrong destination — the ticket is itself a design question ("decide whether that is the design"), and its own recommended option (1) is already shipped. No agreed outcome to test against.`
- `[orchestrator] T1 skip THR-175: unmet trigger — ticket states "intentionally deferred… not actively claimable" with a named trigger, and adds that even when unblocked it wants a full design doc before code.`
- `[orchestrator] T1 skip THR-1157, THR-1163, THR-1162, THR-902, THR-907: wayfinder-labelled — decisions, not executor work; never enter Ready for Dev. Routed to T1.5.`

Also skipped without assessment: THR-1043 and THR-791 (assigned to Christian), and the program epics THR-1156 and THR-789.

**Rule-0 / materiality discipline.** No process ticket was promoted this run. THR-1134 (shareable game-state snapshot, `Continuous Improvement`) was the one process candidate and was left in `Todo`: the shelf already holds only cleanup, and per CLAUDE.md § Prioritization a starved product shelf is fixed upstream, never by promoting more process work.

**Week's completion mix (product vs process):** ~48 product (game-facing content/engine/UI/bug) · ~4 process-infrastructure (THR-1186, THR-1181, THR-1089, THR-1065) · ~5 wayfinder decision tickets, over the 7 days to 2026-08-19. Product-dominated; no process binge. The problem this week is supply at the top of the funnel, not process appetite.

## T1.5 — wayfinder sweep

Two open maps.

- `[orchestrator] T1.5 map THR-1157 "Typed game-state architecture — machinery + first wave": 7 children, 5 Done. Frontier 2, both HITL (THR-1163 wayfinder:grilling, THR-1162 wayfinder:prototype). Native blocking relations checked per candidate — THR-1163 blockedBy THR-1160 + THR-1158 (both Done), THR-1162 blockedBy THR-1159 (Done). Both genuinely unblocked. 0 AFK tickets available: no open wayfinder:research or wayfinder:task children remain. Surfaced both under Needs Christian.`
- `[orchestrator] T1.5 map THR-902 "Encounter experience redesign — vertical slice": 8 children, 7 Done. Frontier 1 — THR-907 (wayfinder:prototype), assigned to Christian, so out of the AFK burn-down set by construction. Surfaced under Needs Christian.`

**AFK tickets resolved this run: 0** — and not because of a failure. Both maps have burned down every research and agent-doable task ticket already; what remains on each is exactly the human-in-the-loop half, which this lane must not touch. `ORCH_WAYFINDER_AFK_MAX` (2) was never reached.

That is the finding worth carrying: both maps are now blocked *entirely* on Christian, with zero agent-resolvable work left on either.

## T2 — design staging

**Triggered.** Non-`Deferral` items in `Ready for Dev`: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2.

Staged **THR-1002** ("Unify the card grammar") → `In Design`, verified by re-query, assignee key absent. Design-request comment posted carrying: why now with the shelf count; what makes it agreed (a director directive with two rulings already made in chat 2026-08-06, expanding the already-shipped nudge-card grammar); the Step-0 loads a design session needs (`process.md`, `rulebook-quick-reference.md`, the `frontend-ui` skill for the UI Laws, `systems-inventory.md` for the receipt machinery); and three flags not to re-derive.

**No plan doc authored** — this lane runs Sonnet by direction (Christian, 2026-08-06) and stages only. `design session wanted: Unify the card grammar` is surfaced under Needs Christian for the briefing to carry to an attended Opus session.

**On `ORCH_MAX_IN_DESIGN`.** `In Design` already held THR-790 (Traits wave 2), assigned to Christian and not staged by this lane. The bound counts *lane-staged* items, which stood at 0 before this run and 1 after, so the bound is satisfied — recorded here because the raw `In Design` count is now 2 and a future run should not read that as a breach.

**Why THR-1002 and not the two higher-priority candidates.** THR-1155 (nations/named areas, High, director direction) was deliberately *not* staged: THR-1163 states that ticket's position in wave 1 is its own call, so staging it now would fork a decision Christian is explicitly slated to make — and THR-1163's resolution mints that design session anyway. THR-1114 is a genuine design call but is two enum values, which does not warrant a session; it belongs inside a cosmology pass.

## T3 — architecture health

**Not due this run.** Local time at sweep was 04:30, before `ORCH_HEALTH_SWEEP_HOUR` (06:00). No detector was run, and nothing here should be read as a clean result — `generate-interface-map:dry`, `sweep:rank-reach`, `check:process` and `check:canon-staleness` were all **not executed**. The first run after 06:00 local today owns the daily sweep.

Weekly test-suite health pass: not due — `ORCH_TESTHEALTH_DOW` is Monday, today is Wednesday.

Redundancy judgement pass: **not assessed this sweep** (T3 did not run).

## Escalations

None escalated to Discord — nothing this run was blocked on an unanswered question. Agreed work is not exhausted: T2 found a clean agreed candidate and staged it, so the stop-and-ask condition did not fire.

Two items parked for a later run to reconcile:

- **THR-175's trigger 2** ("a template or encounter needs `sphere` as an axis independent of `reach`") may have fired with THR-1180's sphere-attunement work on 2026-08-18. Not acted on — the ticket routes to a design doc rather than the queue even when unblocked, so it is T2's input at best, and it sits behind everything above.
- **Both wayfinder maps are now fully HITL-blocked.** If they are still fully blocked in a week with no attended session, that is worth raising as a flow observation rather than re-surfacing the same three links hourly.
