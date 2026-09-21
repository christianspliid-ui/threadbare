---
lane: tb-orchestrator
run: 2026-09-21e
promoted: 2
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-21 (run e, ~22:36Z)

## Needs Christian

**One setting in Linear is quietly deleting work, and only you can turn it off.**

Tonight the builder finished the appointment primitive — the piece that lets a person in the world promise to meet someone at a place, and then keep or break that promise. It was designed as three parts. When the builder finished part one and closed it, **Linear automatically closed parts two and three as well**, three tenths of a second later. Nobody built them. Nobody even started them. They were simply marked finished.

Those two parts are not decoration. They are the half that makes the feature *used* — the tooling that teaches the encounter-writing agents the new promise exists, and the counter that proves anyone ever used it. That is the exact thing you asked for on 12 September, in your words: *"without that connectivity it is a dead feature."* Had this gone unnoticed, the feature would have shipped dead, and the board would have said it shipped complete.

I caught it twenty minutes after it happened and put both parts back. **Nothing is lost.** But this was not a mistake anyone made — the builder did everything correctly, and I checked. It is a Linear setting: when a parent item closes, Linear closes the unfinished children underneath it.

**The ask:** in Linear's team settings for Threadbare, turn off the option that auto-completes sub-issues when their parent is completed. It is one toggle.

**Why it matters now rather than later:** the same thing is queued to happen again within hours. The traits work has three unfinished parts under one parent, and the moment that parent closes they will all be marked done the same way — including one the builder may be actively working on at the time. I have left a warning on that parent so whoever closes it checks by hand, but hand-checking every time is a guard that will eventually be forgotten. The toggle is the fix.

Nothing else needs you. The build queue is healthy — five pieces of work waiting, one being built right now.

## T1 — unblock sweep

| Column | On arrival (22:28Z) | On departure |
|---|---|---|
| `Ready for Dev` | 3 | **5** |
| `Ready for Dev`, non-`Deferral` | 3 | **5** |
| `In Design` | 0 | 0 |
| `In Dev` | 1 (THR-1348) | 1 |
| `Todo` | 26 | 26 |

`Todo` composition: **15 wayfinder-labelled** (skipped unconditionally — T1.5's input, never `Ready for Dev`) and **11 non-wayfinder**.

### Promoted (2 of a permitted 5) — both are repairs of a silent close

**[THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die)** (appointment slice 2, the harness, `High`) and **[THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff)** (slice 3, the grid, `Medium`) — both moved **`Done` → `Ready for Dev`**, re-queried and verified (`status: "Ready for Dev"`, `completedAt: null`, no `assignee` key present). Coordination blocks posted at 22:34Z so `pull-work` Step 3 validates rather than bounces.

**They were closed without ever being worked.** Four independent pieces of evidence, all gathered before either write:

1. **Timing.** THR-1479 (slice 1) reached `Done` at `22:12:37.227Z`. THR-1518 flipped `Todo → Done` at `22:12:37.535Z` (+308 ms) and THR-1519 at `22:12:37.585Z` (+358 ms).
2. **`startedAt: null` on both.** Neither ever entered `Ready for Dev` or `In Dev`, so no session ever claimed either. The transition was `Todo → Done` with nothing between.
3. **No close keyword names them.** [PR #1975](https://github.com/christianspliid-ui/threadbare/pull/1975)'s body carries exactly one line-anchored keyword — `Fixes THR-1479` — and `THR-1518` appears only as a bare prose token, which is the discipline CLAUDE.md requires. `git log` over `fc13b1a4` and merge `7f4b8e98` returns **zero** `Fixes|Closes|Resolves` lines. **The executor did this correctly; the close did not come from the diff.**
4. **The work does not exist on `origin/main`.** Grepped after the merge: `APPOINTMENT_BRIEF_FLOOR` absent, no `appointments` systems-quota key in `compositionContract.ts`, no live-proof claims (slice 2); `agent_kept_appointment` absent, no `appointment` payoff, no `LIVE_CELL_NOTES` row (slice 3). Slice 1's own commit body names THR-1518 as its open remediation — *"two interface contracts LEAKED-with-ticket (THR-1518)"* — so the close would have left `generate-interface-map` pointing at a `Done` ticket for a contract that has not flipped.

**Promotion evidence proper:** blocker THR-1479 is `Done` (2026-09-21T22:12:37Z, PR #1975 merged to `main`). That is the condition both tickets' own filing blocks named — *"the orchestrator's T1 sweep promotes this to Ready for Dev when THR-1479 reaches Done."* Plan doc `Docs/plans/2026-09-21-thr-1479-appointment-primitive.md` verified **LIVE on `origin/main`** (PR #1971), with § *Slice 2* (line 292) and § *Slice 3* (line 294) intact and still describing unbuilt work. Neither thread carries a retire verdict.

**Blast radius checked, not assumed.** Every `Done` issue updated in the last 7 days (48 issues) re-read for the same signature: **THR-1518 and THR-1519 are the only two with `startedAt: null`.** THR-1481/THR-1489 close within 300 ms of each other on 09-12 and look identical at a glance, but THR-1489 has `startedAt: 21:29:07Z` — it was genuinely worked. No other victim exists.

### Declined, with evidence

- **THR-1521** (traits slice 3, artifact traits) — unmet blocker: slice 2 is THR-1520, `Ready for Dev`, not `Done`.
- **THR-1522** (traits slice 4, deferred consumers) — unmet blocker: THR-790, `Ready for Dev`, not `Done`. Additionally gated on slice 1's census showing the pool term moves.
- **THR-1274** (no non-human cast primitive) — standing verdict on its 21:03:44Z comment, *"premise corrected; deliberately not promoted"*. Unchanged since run d; declined on the verdict, not re-derived.
- **THR-1220** (integrated slice checkpoint) — wrong destination by its own first line: *"Never promote to Ready for Dev; this is not executor work."* Its invitation was released 09-11 and Christian is mid-sitting on it (four feedback batches, 09-12, *"checkpoint still open"*). It is in his hands, not the queue's, and the briefing already carries it — not re-surfaced here.
- **THR-1393** (`intelligence` object type) — wrong destination: *"a design decision, not an executor's call"*; needs a named reader and a graph-shape design first → T2 input.
- **THR-175** (agent.sphere field) — trigger condition unmet: it unblocks on creation-sphere content shipping or a template needing `sphere` independent of `reach`; neither is evidenced, and the ticket requires a design doc first regardless.
- **THR-1381** (twilight authorship vs emergence) — wrong destination, stated outright: *"Design-session work, not execution — no code is owed by this ticket."*
- **THR-1218** (encounter firing pruning pass) — wrong destination, stated outright: *"Not Ready for Dev — needs a design pass when unblocked"*; also blocked on THR-1043 raising encounter density.
- **THR-870** (sphere-governance pivot) — a design ticket by its title, in a direction recorded as parked.
- **THR-789** (traits program epic) / **THR-791** (traits wave 3) — epic and an assigned child; neither is an executor candidate.

**Ceiling:** neither bound engaged. Shelf 3 on arrival, far under the backed-up threshold of 15; 2 promotions of a permitted 5. **No candidate was held back.**

**Rule 0 / materiality:** nothing filed. The cascade defect clears the materiality bar on its face (two authored tickets erased, recurrence queued within hours) and the throttle's standing exception for *a loss actively corrupting work right now* would permit filing it — but the durable fix is a Linear workspace setting only Christian can change, so a ticket would sit unexecutable. Routed to him above and guarded by hand in the meantime. **Product-vs-process completion ratio, trailing 48h: 6 product : 4 process** — THR-1479 landed in the window.

## T1.5 — wayfinder sweep

Three open maps, unchanged: Item Generator (THR-1227), Powers & Spellcraft (THR-1226), Physical Conflict (THR-1258). None updated since 2026-09-11.

**AFK frontier: 0.** Confirmed this run by reading every child of all three maps directly (`parentId` queries, not inferred from the `Todo` scan): **every `wayfinder:research` ticket on every map is `Done`** — Physical Conflict 4/4, Powers & Spellcraft 3/3 plus 3 grillings, Item Generator 2/2. Not one open `wayfinder:research` or `wayfinder:task` exists anywhere. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing claimed, resolved or closed.

**HITL frontier: 12** (11 unassigned; THR-1232 is Christian's) — 6 `wayfinder:grilling`, 6 `wayfinder:prototype`, unchanged since 2026-08-26 and already carried on the briefing. Not re-listed and deliberately not raised tonight against the one ask above. Method note: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Not triggered.** Non-`Deferral` `Ready for Dev` is **5** (THR-790, THR-1448, THR-1518, THR-1519, THR-1520) against a floor of 2 — the healthiest the shelf has read in weeks, and two of those five arrived by repair rather than by design.

**`In Design` is empty — 0 live, 0 excluded.** `ORCH_MAX_IN_DESIGN` has nothing to bind. Nothing staged, nothing mutated, nothing authored: with five queued items and one in flight, staging would manufacture a design ask against a queue that does not need one.

## T3 — architecture health

**The daily detector sweep is not due and was not run.** It ran this morning in [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-21.md) (local 17:40), all four detectors; local time at this run is 00:36 on 09-22, ahead of the next `ORCH_HEALTH_SWEEP_HOUR` (06:00). **No detector result is reported clean by inheritance** — run a's findings stand as published, unchanged and un-re-measured. The weekly test-suite pass also ran in run a ([`test-suite-health-2026-09-21.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-21.md)) and is not due again until 09-28. `__DEBUG.validateTraitRefs()` is browser-only, **was not run, and is not reported clean**.

**Redundancy: not assessed this sweep.**

**New finding (1) — Linear's parent-close cascade silently completes unworked children.** Board-derived, not from a detector; full evidence under T1. Characterised rather than merely observed:

- **It is not executor error.** PR #1975's body carries one correctly line-anchored `Fixes THR-1479` and nothing else; the repo's own close discipline was followed exactly and did not prevent this.
- **It is invisible at the moment it fires.** The closing session sees its own ticket close, which is what it expected. Nothing in the gate chain, the merge, or `linear-autoclose.yml` reports the children.
- **It is not rare going forward.** The repo has adopted parent-with-slice-children as its standard shape for multi-part work. Every such parent is a future instance — THR-790 has three open children queued behind it right now, and THR-789 sits above THR-790/791.
- **The dangerous case has not fired yet.** Both victims were `Todo`. A child in `In Dev` would be closed out from under a session that is actively building it, whose own close would then be a silent no-op — impediment #955's shape (a claimed ticket closed out from under the session building it, ~30 min duplicated), arriving by a different door.
- **Guard installed this run:** a warning comment on THR-790 naming its three children and the `startedAt: null` + no-PR-attachment signature to re-check after merge. That is a reminder, not a fix; the fix is the setting routed to Christian.

**Stalled work: none.** `In Dev` holds one issue, THR-1348, claimed 22:07:05Z. It was in `Ready for Dev` at run d's departure and is `In Dev` now — the well-formed path, one transition, against a threshold of 3.

**Hand-created `In Dev` tickets: none** — THR-1348 is the only occupant and it came through the queue.

**`In Design`: 0 live, 0 excluded.** Printed rather than skipped: it is the signal that T2 is free to stage, and this run declined on the shelf count instead.

**Carried, not re-derived:** run b's `lastInDesignActivityMs` finding (a lane's own warning comment counts as human activity, so the staleness detector stays unfirable on exactly the items automated lanes comment on) stands unrepaired for the retro. The column is empty, so it did not bind tonight.

## Escalations

**None opened on Discord, nothing parked, nothing blocked.**

One environment note, recorded rather than actioned: the home tree reports `freshness=behind:4` against `origin/main`. That tree is autosync's read-only mirror and this lane performs no git state ops in it, so nothing was done and nothing is owed — the reports here are published to `ops` by plumbing, which reads no branch state.
