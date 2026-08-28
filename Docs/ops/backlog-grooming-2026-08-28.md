---
lane: daily-backlog-grooming
run: 2026-08-28
promoted: 0
filed: 0
resolved: 0
swept: 3
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-28

## Needs Christian
**Every High-priority item in Encounter Experience is gated on two chat approvals from you, and nothing else.** THR-1130 waits on the batch-1 sample verdict (`?spawn=` links in its 2026-08-17 comment); THR-1222 waits on approval of `Docs/plans/encounters/retrofit-batch-2-brief.md`, and itself blocks THR-1220, the integrated slice checkpoint. **Recommendation:** take the batch-1 verdict first — it is the upstream of the pair, and clearing it alone releases High-priority content work into a shelf that today holds none.

## Work in flight
- **THR-1213** (hunger vocabulary) — healthy. Slice 1 shipped via PR #1684 (merged, `ff447f12`), checkpoint posted 06:31Z. Kept In Dev + assigned on purpose so the next hourly run resumes at Engine slice 2. Slices 2–3 remain.
- **THR-1130 / THR-1133 / THR-1168** — deliberate parks (`Parked`, `assignee: null`, In Dev), all updated inside 24h. Park shape intact.

## Technical gates resolved this run
None owed — no stalled In Dev issue, no upstream-shipped ticket awaiting a manual close, no orphaned claim.

## Counts by state
Idea 70 · Todo 44 · In Design 2 · Implementation Planning 0 · Ready for Dev 7 · In Dev 4

## Problems found and fixed
- **Orphan fixed:** THR-1307 had no project, the only one on the board. Assigned to **Continuous Improvement** by precedent rather than category guess — THR-1118 is its sibling on every axis (same component dir, same file `HooksBlock.tsx`, same `Deferral/UI/Improvement` labels, same found-in-passing provenance) and sits there. Reason commented; write verified by `get_issue` re-query.
- **Stale design work (flagged, untouched):** THR-1002 (In Design, 9 days), THR-790 (In Design, 13 days, assigned). Both past the 7-day bar.
- **Ready-for-Dev claimability audited, clean.** Spot-checked THR-1310/1316/1317 — each carries *both* a filing coordination block and an orchestrator T1 promotion block with re-derivable predicates; the other four were promoted in those same two passes and are named in them. THR-836's failure mode is absent from this queue.
- No completed-but-open projects; no state/priority contradictions; every Ready-for-Dev and In-Dev issue sits in a started-type project.

## Materiality sweep
Swept **3** — THR-1134, THR-1256, THR-1300, the only Ready-for-Dev/Todo items labeled Infrastructure/Improvement or in Continuous Improvement. **Canceled 0, consolidated 0.**
- **THR-1134 stands** — in scope by project label only. Product capability with a real UI pillar, filed at your explicit attended request with decisions marked do-not-re-litigate; §2.5 exempts player-visible work and a director ask is the strongest warrant there is. *Doubt recorded:* its home in Continuous Improvement is arguably wrong (a tool for you, not lane machinery), but re-homing a High ticket buys no delivery.
- **THR-1256 stands** — date-gated to on/after 2026-09-08. The sunset review it schedules *is* the materiality test; judging it 11 days early pre-empts its own gate.
- **THR-1300 stands** — `Infrastructure` label, but it is plan-doc 6/6 of the Proactive Agent Actions design series. Misnomer, not a process ticket.
- Ready for Dev held **zero** in-scope tickets — all 7 are product deferrals in active projects. The queue is carrying no process debt.

## New finding — `.planning/ROADMAP.md` v1.2 sequence is stale (report only, nothing filed)
Roadmap Future Work lists TB-095…TB-099 as pending. Against generated `Docs/canon/systems-inventory.md`: TB-095 → **Companies & Group Travel** (THR-74, shipped, DORMANT); TB-097 → **Ambitions & Undertakings** (ACTIVE; THR-1292 §3 retired the separate initiative pipeline); TB-098 → **Factions & Succession** (ACTIVE); TB-099 → **Secrets & Favors** (ACTIVE). Filing counterparts — which step 3 of this lane nominally asks for — would have green-fielded four shipped subsystems, the exact THR-614 failure the roadmap's own drift banner warns of. Doc drift is explicitly non-qualifying under § Prioritization and the throttle routes lane findings to the log, so this is left for the weekly retro to batch.

## Pipeline status
Executor is fed: 7 claimable deferrals with coordination blocks, plus THR-1213 mid-flight. **But the shelf is 5 Low / 2 Medium / zero High** — the board's High-priority product work (THR-1222, THR-1130, THR-1220) sits behind the two chat approvals above, so the lane spends today on Low deferrals while the highest-value content work waits. Supply gate, not a queue defect; the fix is upstream in Needs Christian.
**Recommended next pickup:** THR-1310 (Medium, Engine) — the unblocker, releasing THR-1308 and THR-1309 from Todo the moment it lands.
