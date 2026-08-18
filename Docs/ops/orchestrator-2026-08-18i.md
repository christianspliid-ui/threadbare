---
lane: tb-orchestrator
run: 2026-08-18i
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-18 (run i, ~18:30Z)

## Needs Christian

**The empty-pipeline warning you have had on the briefing for a day is over.** For twenty-four consecutive runs this lane reported that the shelf held only small clean-up jobs and no real feature work, and that the fix was upstream — design, or you. In the last ninety minutes four proper feature jobs landed on it: finishing the nudge library, building the nine unbuilt card types, sphere attunement, and the edge-integrity package. Nothing is needed from you for those; they are queued and the builder takes them in order. Recorded here so the standing "feature pipeline needs you" line can come off the briefing.

**One new thing will sit forever unless you spend ten minutes on it.** The job that pays off The Grateful Kin's welcome — the scene where the roof actually opens when you next pass through — cannot be started by an unattended agent. Your own rule says a new encounter's brief gets your approval in chat before anyone writes the prose, and nobody has drafted that brief yet. So it is not waiting on your approval; it is waiting on a session where an agent drafts the brief *with* you. Worth one short chat when you next open one: [THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the).

The older question about spending image credits on the three missing nudge-card pictures ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)) is unchanged and still yours.

## T1 — unblock sweep

**Promoted 1.** Scanned Todo (20) as the candidate pool; Ready for Dev (9) read for shelf depth, not as candidates.

```
[orchestrator] T1 scan: Todo 20, Idea (recent-window only, see note), Ready for Dev 9,
               In Dev 3, In Design 1
[orchestrator] T1 promote THR-1181: blockedBy empty on live relation query, no prose gate, no
               time gate. Plan doc Docs/plans/2026-08-18-thr-1178-nudge-library-completion.md
               LIVE on origin/main (PR #1550) — checked, not assumed. Zero prior comments, so no
               retire or supersede verdict to weigh (THR-990). Premise re-verified against the
               tree: "attunement" appears in none of the nine UL shards, and essenceEarnedBySphere
               does not yet exist in src/. Verified via get_issue: "Ready for Dev", assignee key
               absent. Block posted. Mutex: none. (program: Encounter Experience)
[orchestrator] T1 decline THR-1182: wrong destination — its own Done-when 1 is "brief approved in
               chat", the ruling-2 gate (THR-1043 comment a55c88db). No unattended lane can obtain
               a chat approval, and no brief exists to approve, so promoting it puts an
               unsatisfiable-by-construction first step at the top of the queue. → attended/T2.
[orchestrator] T1 skip THR-1157/1163/1162/902/907: wayfinder:* label — never enter Ready for Dev.
[orchestrator] T1 skip THR-1043/791: assigned; promoting an assigned issue hides it from
               pull-work's assignee:null candidate query.
```

**Idea was sampled, not swept, and that is a real narrowing of this run's coverage.** Previous runs paged the full 60-item Idea backlog; this run queried `updatedAt: -P1D` only, which returned two — THR-876 (held, unbudgeted credit spend) and THR-1088 (resolved on `main`), both already assessed. The reasoning is that Idea items do not become promotable without moving, so an unmoved item's prior decline still stands. That is true for the six decline reasons keyed on the ticket's own content, and **not** guaranteed for the unmet-blocker reason, where the *blocker* moving is what unblocks a candidate that itself sits still. Nothing went Done in the last hour that any Idea item names as a blocker, so nothing was missed this run — but the shortcut is only safe when that second check is made, and it is recorded here rather than left as an unstated habit.

**The promotion, and why a UL-proposal is queue work rather than process work.** [THR-1181](https://linear.app/threadbare/issue/THR-1181/ul-proposal-sphere-attunement) asks for one glossary entry defining *Sphere Attunement* — the god's lifetime essence earned per sphere, as distinct from the spendable pool. It is not delivery-machine tidying, so the process-work throttle does not reach it: the mechanic is being built *right now* in three tickets sitting on the shelf beside it, and the UL is the terminology authority that wins on disagreement. Writing the entry before the code lands is what stops the drift; writing it after is archaeology. The design is already merged on `origin/main`, the shard is already named, and the distinctions are already written in the proposal — so this is the *how* of an agreed design, which CLAUDE.md § User review interface rule 4 puts with the agent.

**Two findings handed to the taker instead of left in the ticket, both from about four minutes of grep.**

- **"Repertoire" is not a canonical UL term** — zero hits across all nine shards. The proposed definition's core sentence, *"deepens Repertoire card families"*, therefore defines a new term in terms of an uncanonical one, which is precisely the drift the UL exists to prevent. The taker gets both honest routes (define against the canonical `Nudge` entry, or file a companion proposal) and an explicit instruction not to quietly canonise Repertoire inside this entry's prose.
- **"Essence" has no entry either**, despite being used in four other entries' definitions including `GameState`'s "the player's Ascendant identity and essence pool". Pre-existing, not this ticket's debt, and named so the taker leans on the existing phrasing rather than blocking on a new entry.

Also confirmed for them: the cross-reference target `Cosmology.md:21 ### Sphere` exists, and the diff is **docs-only** — `Docs/ubiquitous-language/*` plus the regenerated `ul-dashboard.generated.json`, which CLAUDE.md doc-excludes despite its `src/` path. That saves the taker a ~15-minute code gate on a change that cannot fail it.

**The decline, which is the more interesting half.** [THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the) was filed 18:26Z by the executor finishing THR-1175, and it is honest about its own gate: *"Blocked in process on the ruling-2 brief approval, which is step 1 of the task."* Everything in code shipped — the location condition, its gate, its applier, and a live consumer in `LocationProfileModal`. What is missing is the encounter that pays the promise off, and authoring it means a new full-Composition-Contract template, which by Christian's own 2026-08-08 ruling needs a brief he approves in chat first.

Promoting it would burn the single WIP slot on a job whose first step is unreachable: the executor would claim it, draft a brief, and park awaiting an approval that no unattended run can obtain. That is the THR-887 shape — a Done-when unsatisfiable by construction at the moment of promotion — so it routes to an attended session instead, and is surfaced above.

**Ceiling did not bind.** Shelf was 9 at scan, under `QUEUE_BACKED_UP_MIN` (15); one promotion is under `ORCH_PROMOTE_BATCH_MAX` (5). Nothing was held back — the pool contained exactly two new candidates and one of them declines.

### The shelf, honestly

`Ready for Dev` holds **9**: THR-1178, THR-1180, THR-1179, THR-1177, THR-1181, THR-857, THR-1173, THR-830, THR-625, THR-1133.

**Four of them are non-`Deferral` program work** — THR-1178 (nudge library completion), THR-1179 (nine unbuilt card mechanics), THR-1180 (sphere attunement), THR-1177 (edge-integrity enforce-now package). All four arrived between 16:55Z and 18:05Z, from the THR-1157 wayfinder map's research arm closing and the THR-1178 design landing. This is the first run since this lane began keeping count where the program-work floor is met.

One caveat a bare count still hides, unchanged: [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) needs an attended session with a real dev server at 1920×1080, so the overnight lane cannot take it.

**Two of the three In Dev items are parked, not stalled** — THR-1130 and THR-1168 both read `In Dev` with the assignee key absent, the deliberate finished-work park shape. Only THR-1175 is being actively worked. Recorded because a bare In Dev count of 3 reads as three jobs in flight.

## T1.5 — wayfinder sweep

**Two open maps. Zero of `ORCH_WAYFINDER_AFK_MAX` (2) spent — because no AFK ticket exists, not because any was skipped.** Re-queried live by label rather than carried from run h: all six `wayfinder:research` (THR-1176, 1159, 1160, 1158, 1039, 903) and all three `wayfinder:task` (THR-986, 906, 904) are **Done**. Every open wayfinder ticket board-wide is HITL by label, and resolving one of those is the broken-HITL failure the skill forbids.

- **[THR-1157 — Typed game-state architecture](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Frontier is two, both HITL, both unassigned: THR-1163 (`wayfinder:grilling`, the wave-1 selection sitting) and THR-1162 (`wayfinder:prototype`). Its research arm is complete: THR-1176, the edge-integrity audit, closed today and is what produced THR-1177 on the shelf — the map is converting research into queue work as designed.
- **[THR-902 — Encounter experience redesign](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** THR-907 is open but assigned, so outside the frontier by rule.

Neither map's HITL frontier is repeated under `## Needs Christian` this run — both have been put to him on consecutive runs, and THR-1182 is the item that would actually move today.

## T2 — design staging

**Not triggered — for the first time in twenty-five runs.** Non-`Deferral` items in Ready for Dev: **4**, at or above `ORCH_PROGRAM_WORK_FLOOR` (2). The condition that fired on every run since this lane started counting is no longer met, and the fix came from exactly where this lane kept saying it had to: upstream design supply, not downstream promotion.

Nothing staged, and nothing needed staging. `In Design` still holds [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at `ORCH_MAX_IN_DESIGN` (1), now **~70 hours past staging** (`updatedAt` unmoved since 2026-08-15T20:29:32Z). Re-surfaced in the record, not re-staged.

The T2 candidate queue gained one this run: **THR-1182**, declined out of T1 above because its first step is a chat-gated brief. [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice-commit) remains the one to rank first when the slot frees.

**Product-vs-process ratio:** not re-measured; run p's trailing-7-day figure (~2:1 product-favouring) stands, and re-deriving a week-wide window hourly is noise. This run's promotion is product-adjacent vocabulary for a shipping system, and the headline finding is no longer "shelf empty: feature pipeline needs design/Christian" — it is that the pipeline refilled.

## T3 — architecture health

**Not due — already run today.** Run b performed the full sweep at ~05:27Z (07:27 local), the first past `ORCH_HEALTH_SWEEP_HOUR` (6 local). **No detector was run this run and none is reported as clean.** Its standing results are unmodified: 7 LEAKED contracts, 21 canon-staleness warnings, `check:process` green except the longstanding `check:authoring-brief` staleness, and `sweep:rank-reach` **unavailable** — still explicitly not clean, merely unmeasured.

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, not reported as clean.**

**Redundancy: not assessed this sweep** — the judgement pass belongs to a due T3, and T3 was not due.

Weekly test-suite health **not due** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is Tuesday (2). Last pass: `Docs/ops/test-suite-health-2026-08-17.md`.

**Stalled-work check: partial, and said so.** Only the `stateHistory` fetched for this run's candidates was read — THR-1181 shows a single Todo → Ready for Dev transition (0 pickups) and THR-1182 a single Idea → Todo (0 pickups). Run b's board-wide pass at 05:27Z found THR-1130 highest at 2, under `ORCH_STALLED_PICKUP_THRESHOLD` (3); THR-1130 has been In Dev since without a further release, so that reading still holds — carried, not re-measured.

**Two `src/` findings noted and deliberately not filed.** The UL grep above establishes that *Repertoire* and *Essence* are both load-bearing project nouns with no canonical definition — the second is used inside four existing entries' prose. That is genuine vocabulary drift and would ordinarily be a finding. It is not filed as a ticket: *Repertoire* is already named in THR-1181's promotion comment as a decision the taker must make, and filing *Essence* separately is a process ticket below the materiality bar (no quotable loss, no cost/benefit line) which the scheduled-lane throttle sends to the retro rather than the board. Recorded as observations; `newFindings: 0` is accurate.

## Escalations

None. Nothing was parked and no question was asked — the pool yielded genuine work, so the agreed-work-exhausted branch did not fire.

No verify-after-write mismatch: the single write was re-queried via `get_issue` and held, with the assignee key absent on the re-query rather than on the mutation echo.
