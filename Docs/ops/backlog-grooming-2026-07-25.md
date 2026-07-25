# Backlog Grooming — 2026-07-25

## Needs Christian

- **Five projects sit in an active lifecycle status with no open work left.** "Agent Coordination Protocol", "Repo Health", "Marketing Site" and "Small manual tweaks" are all **Now**; "Procedural Hex Vignettes" is **Next**. Every issue in each is terminal. The grooming rule says close them, but each one's own description declares it a *permanent home* ("Ongoing infrastructure project", "Home for everything public-facing", "where small manual tweaks directly driven by the human goes"), and Procedural Hex Vignettes is a gated experiment whose Phases 2–5 were never ticketed. **I closed none of them** — closing a permanent bucket misrepresents it and it would need reopening at the next finding. **Recommendation:** leave all five open as intake buckets, and accept that "Now with an empty queue" means "no current work" rather than "stalled". If you'd rather the roadmap only show projects with live work, say so and the next run will move them to Done. One yes/no.

## Work in flight

- **THR-719** (item on-use triggers as effect primitives) — implementation shipped; PR #830 carries all nine ported triggers, the interface row re-badged LIVE, and green gates. Nothing remains but the merge. Healthy, updated within the hour; not stalled.

## Technical gates resolved this run

- **PR #830 was `BEHIND` again and would never have merged** — armed auto-merge does not update a stale branch under strict protection. The executor rebased it at 07:09; the **09:09 briefing merge (#832) knocked it stale 30 minutes later**. Ran `gh pr update-branch 830` → now `BLOCKED`/`MERGEABLE` with auto-merge still armed, so it merges unattended on green. This is THR-735 / THR-752 recurring live: one drain per hour cannot win against main's merge rate, and the briefing lane is itself one of the merges.
- **Five superseded drift-scan issues closed as Duplicate** — THR-706→746, 707→747, 708→748, 709→749, 710→750. The pairs are identical in substance (same membership, same paths, same counts); only the generation date and the days-unvalidated arithmetic differ. Kept the 07-24 half as the one carrying current data. Reasoning recorded on THR-756, which fixes the generator. THR-705 (broken-windows tally) has no 07-24 counterpart and stays open.

## Counts by state

Open **96**: Idea 60 · Todo 19 · Ready for Dev 16 · In Dev 1 · In Design 0 · Implementation Planning 0 · Triage 0.

## Problems found and fixed

- **No orphan issues** — all 96 open issues carry a project. No fix needed.
- **Deduped the drift-scan double-file** (above). API note for THR-756's executor: `state:"Duplicate"` is rejected unless a duplicate relation already exists; setting `duplicateOf` alone auto-transitions the issue in one call.
- **Filed THR-763** — `.planning/ROADMAP.md` § Future Work lists `resource_delta`, `action_trigger` and `choice_set` as "still pending" and treats `flip_table`/`clearance_gate` as forward work. All five are shipped; `action_trigger` was *extended by THR-719 today*. Because CLAUDE.md declares that roadmap still-maintained, an agent running the mandatory **Step 0.6 substrate-existence check** could read those lines and green-field an existing primitive — the exact THR-614 failure the step exists to prevent. Phase 3's `task_progress` genuinely has 0 hits, so Linear coverage itself is complete; only the status prose is wrong. Written as a predicate, not a count (THR-688 rule A).
- **No stale design work** — In Design and Implementation Planning are both empty, so nothing can be stuck there.
- **Deferrals in Ready for Dev are correct, not misfiled.** Six sit there (THR-661, 731, 732, 736, 737, 761). The "deferrals belong in Idea/Todo" rule is subordinate to the "Finish Before You Start" rule, which pulls deferrals of active projects *first*. Content Architecture is the active project, so its deferrals belong in the queue.

## Pipeline status

No gap: 16 Ready for Dev against 1 In Dev, and the WIP=1 slot frees the moment #830 merges.

**Recommended next pickup — THR-761** (aftermath-applied conditions may never expire). It is a `Deferral` in **Content Architecture**, the project with work in flight, which puts it at the top of the prioritization order; it was filed *by* THR-719's own executor and shares that ticket's `apply_condition` / `decayConditions` surface, so the context is hot. Then THR-736 and THR-737 (same project, both deferrals — note THR-737's parent THR-722 left its row LEAKED because the migration target itself has zero consumers, so verify the consumer side before badging). **THR-738** is the highest-priority item on the board (High, phantom-Done hardening) and should jump the queue if any further phantom-Done sweep is observed; absent that, project-finishing order wins.
