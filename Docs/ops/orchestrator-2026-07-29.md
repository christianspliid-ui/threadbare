# Orchestrator — 2026-07-29

## Ninth run — 16:28Z update

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (16:28Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 12 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 44 items (21 `Deferral`, 23 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-851** ("scheduled-task registry audit third direction — orphan prompt directories") — no `Blocked by` line ever declared; filed 2026-07-29 15:09Z alongside sibling THR-850, held back by the ceiling every run since (THR-850 took the 15:29Z slot). Re-checked the two other eligible no-blocker Low-priority Todo candidates (THR-582, THR-766) against this one on blast radius: THR-582 and THR-766 both edit central engine surfaces (`orchestrator.ts` inline phases; `player-cast-constants.ts` tuning), THR-851 is docs/ops-only with an explicit Browser-verify exemption in its own text. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 16:28:32.010Z, state stuck, no `assignee`/`assigneeId` field present — THR-845's auto-assign bug did not fire) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: everything currently queued; Mutex with: THR-850, both touch `Docs/ops/scheduled-tasks-registry.md`).

**Declined — needs design finalization first (T2's input, not T1's):**

- **THR-735** ("Armed-PR staleness sweep") — no blocker, still self-declares "design pass needed — do not pick one from this ticket alone."
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed `Done`, but both self-declare their own design-finalization gate.

**Declined — staging/tracking containers, not implementable units:**

- **THR-772** (Nudge Model program epic), **THR-778** (WS5 content-migration container), **THR-789** (Traits program epic) — all three explicitly self-declare as containers.
- **THR-838** (Nudge Model WS5 Batch 1 tracker) — unchanged; stays in Todo as the burndown tracker per the 13:42Z run's note.

**Declined — other:**

- **THR-680** ("Stash triage") — re-confirmed live: `git stash list` from this worktree still shows only **2** entries. Unchanged structural conflict with THR-672 (home-tree-only approach). See Escalations.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps today):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers. Held back every run today.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers. Held back every run today.
- The WS5 partition's remaining unfiled cells and two structural one-offs — unchanged from the THR-838 comment thread, recorded in prior runs.

### T2 — design authoring (16:28Z)

**Not triggered.** Ready for Dev holds 23 non-`Deferral` items after this run's promotion (THR-851 carries the `Deferral` label, so it doesn't add to this count) — well above the floor of 2.

### T3 — architecture health (16:28Z)

**Skipped — already ran today.** First daily sweep completed at 13:42Z (this file, "Sixth run" section below). Not re-run.

### Escalations (16:28Z)

- **THR-680 execution-model conflict** (unchanged): the ticket's only stated approach requires home-tree git state ops, which THR-672 prohibits for every scheduled session. Parked, not blocking the rest of this run.

---

## Eighth run — 15:29Z update

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (15:29Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 13 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 44 items (21 `Deferral`, 23 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-850** ("tb-opus-pickup — the sole executor lane — has no repo prompt mirror") — no `Blocked by` line ever declared; a standalone ops/docs gap found by the THR-655 retro, filed today at 15:08Z (too new to have appeared in any prior sweep this run-day). Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 15:29:30.931Z, state stuck, no `assignee`/`assigneeId` field present — THR-845's update-path auto-assign bug did not fire on this write) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: everything; Mutex with: none, flagged coordination with sibling THR-851 only if both picked up concurrently). Picked over its Low-priority, no-blocker siblings held back all day (THR-582, THR-766) on priority (Medium vs. Low) and blast radius — docs-only, no `src/` surface, Browser-verify exempt per its own text.

**Declined — needs design finalization first (T2's input, not T1's):**

- **THR-735** ("Armed-PR staleness sweep") — no blocker, still self-declares "design pass needed — do not pick one from this ticket alone."
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed `Done` (completed 2026-07-26T10:55:17Z), but both self-declare their own design-finalization gate.

**Declined — staging/tracking containers, not implementable units:**

- **THR-772** (Nudge Model program epic), **THR-778** (WS5 content-migration container), **THR-789** (Traits program epic) — all three explicitly self-declare as containers.
- **THR-838** (Nudge Model WS5 Batch 1 tracker) — unchanged from the 14:30Z read: stays in Todo as the burndown tracker per the 13:42Z run's explicit note; not re-promotable as-is.

**Declined — other:**

- **THR-680** ("Stash triage") — unchanged structural conflict (home-tree-only approach vs. THR-672's bar on scheduled sessions running git state ops against the home tree). See Escalations.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.
- **THR-851** ("Scheduled-task registry audit — third direction, orphan prompt directories") — no blocker, filed today at 15:09Z alongside THR-850; held back by the ceiling this run (THR-850 taken as the single slot on Medium > Low priority — both are siblings from the same THR-655 retro).

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps today):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers. Held back every run today; strongest next-run candidate along with THR-766.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers. Held back every run today.
- The WS5 partition's remaining unfiled cells (1a hamlet/12, 1b civic seats/8, 1c wayside & wild/7, 1d sacred & arcane sites/8) plus two structural one-offs (`encounter.apotheosis.ascension`, `encounter.shell_proof.fate_card_trial`) — recorded in the THR-838 comment thread from the 13:42Z run, unchanged this run.

### T2 — design authoring (15:29Z)

**Not triggered.** Ready for Dev holds 23 non-`Deferral` items after this run's promotion — well above the floor of 2.

### T3 — architecture health (15:29Z)

**Skipped — already ran today.** First daily sweep completed at 13:42Z (this file, "Sixth run" section below). Not re-run.

### Escalations (15:29Z)

- **THR-680 execution-model conflict** (unchanged from 14:30Z run): the ticket's only stated approach requires home-tree git state ops, which THR-672 prohibits for every scheduled session. Parked, not blocking the rest of this run.

---

## Seventh run — 14:30Z update

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (14:30Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 12 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 46 items — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-849** ("Orchestrator's dated report file is outside the merge=union set, so two same-day runs racing produce a permanently DIRTY armed PR") — self-filed this morning (14:05Z) with `Blocked by: nothing` already stated. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 14:29:54.931Z, state stuck, no `assignee` field present) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: anything not touching `.gitattributes`/`Docs/ops/`; Mutex with: none identified). Worth noting: this ticket describes exactly the hazard this run's own report PR is about to create (same file, same append-to-top pattern). Checked before writing this report — PR #1031 (the still-open, still-DIRTY instance THR-849 documents) touches **yesterday's** file (`orchestrator-2026-07-28.md`), not today's, and no other PR is currently open against today's file. This run's report PR is therefore safe to open, but the underlying gap remains unfixed until THR-849 is implemented.

**Declined — needs design finalization first (T2's input, not T1's):**

- **THR-735** ("Armed-PR staleness sweep") — no blocker, but self-declares "design pass needed — do not pick one from this ticket alone" among candidate remedies.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed `Done` (completed 2026-07-26T10:55:17Z), but both self-declare their own design-finalization gate.

**Declined — staging/tracking containers, not implementable units:**

- **THR-772** (Nudge Model program epic), **THR-778** (WS5 content-migration container), **THR-789** (Traits program epic) — all three explicitly self-declare as containers.
- **THR-838** (Nudge Model WS5 Batch 1 tracker) — blockers (WS0/WS1/WS3) all Done, but the prior run (13:42Z today) already re-scoped this: `daily-backlog-grooming` split it into a five-cell partition (1a–1e) after three executor checkpoints delivered 7/48 templates, and the 13:42Z T1 sweep filed cell 1e as THR-848 (already Ready for Dev). THR-838 itself stays in Todo as the burndown tracker per that run's explicit note — not re-promotable as-is; the actionable units are its filed children.

**Declined — other:**

- **THR-680** ("Stash triage") — no blocker, but the ticket explicitly requires running from the **home tree** (`C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`) to reach the stash stack. That conflicts with the hard rule (THR-672) barring git state ops against the home tree from any scheduled session — every session that would pick this up (`tb-opus-pickup`) is scheduled. This is a standing structural conflict, not a one-run decline; flagging under Escalations rather than re-deciding it every sweep.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger (no Creation-sphere content shipping yet; no template needs `sphere` as an independent axis — unverifiable with confidence either way, so treated as unmet).

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps today):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass with a stated measurement methodology, no blockers.
- The WS5 partition's remaining unfiled cells (1a hamlet/12, 1b civic seats/8, 1c wayside & wild/7, 1d sacred & arcane sites/8) plus two structural one-offs (`encounter.apotheosis.ascension`, `encounter.shell_proof.fate_card_trial`) — recorded in the THR-838 comment thread from the 13:42Z run, unchanged this run.

### T2 — design authoring (14:30Z)

**Not triggered.** Ready for Dev holds well above the floor of 2 non-`Deferral` items (25+ per the 13:42Z sweep, plus this run's +1 promotion).

### T3 — architecture health (14:30Z)

**Skipped — already ran today.** First daily sweep completed at 13:42Z (this file, "Sixth run" section below). Not re-run.

### Escalations (14:30Z)

- **THR-680 execution-model conflict** (see T1 decline above): the ticket's only stated approach requires home-tree git state ops, which the hard rule (THR-672) prohibits for every scheduled session that could claim it. Not answerable by promoting or declining alone — either the ticket needs a revised approach that works from a worktree, or it needs deliberate human-attended (non-scheduled) execution. Parked, not blocking the rest of this run.

---

## Sixth run — 13:42Z update

*First run today past the 06:00-local T3 gate (system clock read 15:43 local at run time) — T3 ran in full.*

### Needs Christian

Nothing needs you this run. One technical item worth a plain-language line, not a question: the Nudge Model content batch (THR-838) hit its size limit and got split by the daily grooming pass into five pieces; this run filed the smallest, safest piece as its own ticket (THR-848, four small encounters) so an executor can pick it up. The rest of the split stays queued — no decision needed from you, just noting the shelf is genuinely full of real work right now, not stuck.

### T1 — unblock sweep (13:42Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 11 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 45 items (20 `Deferral`, 25 non-`Deferral` after this run's filing) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion/filing**.

**Filed (1, at the shelf-backup ceiling) — not a Todo→Ready-for-Dev promotion, a split-filing:**

- **THR-848** ("Nudge Model WS5 Batch 1e — anomaly & trap literals, 4 templates, no converter risk") filed directly into `Ready for Dev`, parented under **THR-838**. THR-838 itself sits in `Todo` with met blockers (WS0/THR-773, WS1/THR-774, WS3/THR-776 all Done) but is **not** re-promotable as-is: it burned three executor checkpoints (2026-07-28 20:23Z/21:17Z/22:19Z), delivered 7 of 48 templates, and `daily-backlog-grooming` (2026-07-29 ~13:2xZ) moved it back to Todo with a five-way partition recorded in a comment, explicitly asking this lane to file the children. THR-848 is that partition's smallest, lowest-risk cell (direct `UnifiedActionTemplate` literals, no converter-passthrough risk). Filed → verified via `get_issue` (state `Ready for Dev`, no `assignee`/`assigneeId` field present) → coordination-block comment posted on THR-848 (Suggested model: opus; Parallel-safe with: all other queue work; Mutex with: none filed) → note comment posted on THR-838 recording what was filed and what was held back.
  - **Held back this run** (ceiling): the partition's other four cells — 1a hamlet (12, wants halving again per the checkpoint-3 sizing note), 1b civic seats (8, wants halving), 1c wayside & wild (7), 1d sacred & arcane sites (8, wants halving) — plus two structural one-offs that need their own tickets (`encounter.apotheosis.ascension`, a converter-not-prose conversion; `encounter.shell_proof.fate_card_trial`, a premise-length fix). All six are recorded in the THR-838 comment for the next run or a design pass to pick up.
  - **Self-check against THR-845** (filed this same morning by `daily-backlog-grooming`: orchestrator promotions were setting `assignee`, hiding issues from `pull-work`'s `assignee:null` pickup query): confirmed THR-848's `get_issue` response carries no `assignee` field. THR-845's evidence table shows the bug fires on **update**-path promotions (`save_issue(id, state:...)` on an existing Todo issue triggers Linear's auto-assign-on-started-state); THR-848 was **created** directly into `Ready for Dev` rather than transitioned, and that path did not trigger it. This run took no update-path promotion, so the bug had no surface to reproduce on. THR-845 remains open and Ready for Dev for an executor to fix at the writer (own remediation recommendation: write `state` only, or explicit `assigneeId: null`, on the actual promotion call) — worth the next run applying that workaround by hand on any `save_issue(id, state:"Ready for Dev")` call until it ships.

**Declined:**

- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed `Done` (completed 2026-07-26T10:55:17Z), but both self-declare their own design-finalization gate ("Needs its own design finalization before Ready for Dev" / "Needs a full design pass… before any Ready for Dev"). T2's input; T2 did not trigger this run (see below).
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone" among 4 candidate remedies. T2's input, not T1's.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers, not implementable units. THR-778's own blockers are Done but it names THR-838 (and now THR-848) as its actual implementable children.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger (no Creation-sphere content shipping yet, no template needs `sphere` as an independent axis).

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps today):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.
- **THR-680** ("Stash triage") — no blocker, but explicitly a home-tree-only task assigned to Christian; not re-verified this run (five prior sweeps today already found the stash count stale at 2 vs. the 38 cited at filing).

### T2 — design authoring (13:42Z)

**Not triggered.** Ready for Dev holds 25 non-`Deferral` items after this run's filing (THR-848 carries the `Content` label, not `Deferral`, so it adds to this count) — well above the floor of 2.

### T3 — architecture health (13:42Z)

**First full sweep today.** Run from a fresh worktree (`tb-orchestrator-run-2026-07-29b`), diffed against the 2026-07-28 07:42Z baseline (last full sweep, `orchestrator-2026-07-28.md`).

| Detector | Result | vs. baseline |
|---|---|---|
| `generate-interface-map:dry` | **5 LEAKED, same set:** `attachment-activated-effects` (THR-720), `attachment-edge-modifiers` + `attachment-tier-advancement` (THR-723), `authored-nudge-hand-reaches-resolution` (THR-774), `trait-ref-authoring-vocabulary` (THR-800) | Unchanged. Resolves yesterday's open question: `authored-nudge-hand-reaches-resolution` was flagged as "worth a second look — if still LEAKED after THR-774 shipped, may need a badge refresh, not a new ticket." Checked the full verdict text: it reads "declared write sites empty — nothing produces this contract," i.e. zero currently-authored templates use the nudge-hand write path yet. This is correct, not stale — THR-774 shipped the *pipeline* (WS1), authored *content* is WS5 (7 of 48+ templates done as of this run, see T1 above). The badge will clear as WS5 content lands; no ticket or refresh needed now. |
| `sweep:rank-reach` | **PASS** — 13 apex holders at tick 900, 60 reachable / 0 blocked / 0 unowned gated templates, 0 of 13 faction members individual+spotlight (THR-814) | Unchanged from baseline. |
| `check:canon-staleness` | **14 warnings** (was 13) | **New:** `Docs/canon/encounters.md` is now stale against `Docs/plans/2026-04-16-systemic-wiring-guide.md` (wiring-guide mtime 2026-07-28T23:18:04Z > encounters.md `last_reviewed` 2026-07-27T21:59:59Z) — the wiring guide picked up an edit after encounters.md's last review. All 13 prior warnings persist unchanged (attachments, cosmology, design-governance, engine, process ×4, prose, rulebook ×2, plus the two permanently-unfixable generated-file frontmatter warnings). Low-priority docs drift, not filing a ticket for one incrementally-stale page — flagging for whoever next touches `Docs/canon/encounters.md` or the wiring guide to refresh `last_reviewed`. |
| `check:process` | Sub-checks: `check:authoring-brief` warns stale (known, tracked against the wiring guide), `check:design-wiki` OK (23 pages), `check:wiki-freshness` OK (23 pages, refreshed against origin/main), `generate-systems-inventory:check` STALE (known, THR-807 area), `rebuild-plans-index:check` STALE (known, THR-807). Top-level check itself reports "skipped (no candidate files found)" — this worktree has zero diff against `main`, so the git-diff-scoped sub-checks have nothing to scope over (THR-828's known mechanism, not a new false-pass). | Unchanged from baseline. |

**Redundancy pass:** not assessed this sweep — the genuine judgement pass over `Docs/canon/interface-map.md` and `Docs/canon/systems-inventory.md` did not happen this run. Stating this explicitly rather than implying coverage.

**Stalled-work detection:** no dedicated full-board `stateHistory` sweep run this cycle. Incidentally inspected THR-838 in detail for T1 (above) — one escalation cycle (three checkpoints inside a single `Ready for Dev → In Dev` span, then released to Todo), not three separate re-claims, so it does not cross the `ORCH_STALLED_PICKUP_THRESHOLD` (3) as currently defined. No other issue's `stateHistory` was inspected this run.

`__DEBUG.validateTraitRefs()` — browser-only bridge method, cannot run headless. Not run, not reported as clean.

### Escalations (13:42Z)

None this run.

---

## Fifth run — 02:29Z update

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired well before the gate, so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (02:29Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 11 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 40 items (19 `Deferral`, 21 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-646** ("THR-636 follow-up: capture live browser screenshots of encounter card + veil context strip + step replay") — no `Blocked by` line was ever declared; parent feature THR-636 is merged (PR #549) and the ticket's own text states "pure verification-artifact task — no code change expected." Held back by the ceiling across the prior four runs today. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 02:29:11.414Z, state stuck) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: anything not touching `EncounterVeil*`/toast-rail/step-navigator; Mutex with: none). Picked over its equal-priority (Low) siblings THR-582 and THR-766 for the smallest blast radius — a read-only DOM screenshot pass touches no engine files, where THR-582 (inline-phase migration in `orchestrator.ts`) and THR-766 (cast-constants tuning) both edit central engine surfaces.

**Declined:**

- **THR-680** ("Stash triage") — **stale predicate, re-confirmed live again.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops). Unchanged across five consecutive sweeps now.
- **THR-735** ("Armed-PR staleness sweep") — new comment landed since the last run (02:05Z, remedy candidate 5 — phase-align the Step 0.8 sweep to the merge cadence) but the ticket still self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 remains `Done`, but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers, not implementable units.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.

### T2 — design authoring (02:29Z)

**Not triggered.** Ready for Dev holds 21 non-`Deferral` items after this promotion (THR-646 carries the `Deferral` label, so it doesn't add to this count) — well above the floor of 2.

### T3 — architecture health (02:29Z)

**Not run.** Gated on the first run after 06:00 local; this run fired well before the gate. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (02:29Z)

None this run.

## Fourth run — 01:30Z update

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 03:30 local (before the gate), so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### Technical note (not Christian-facing)

THR-842 ("GitHub Actions is billing-blocked, so the required merge gate is SKIPPED") still sits in Ready for Dev, but the underlying condition looks resolved: the latest `main` CI run (30412992892, 01:03:53Z) shows `Detect code changes` executing its full step sequence (checkout, paths-filter, ~22s) rather than the ~3s zero-step billing-block signature the ticket describes, and `Test · Typecheck · Build` reads `skipped` for the legitimate reason (docs-only diff, paths-filter gate), not the failure mode. Leaving this for the executor to re-verify and close out items 2–3 (retro-verify the 3 unverified-by-CI PRs; record the SKIPPED-satisfies-branch-protection decision) rather than promoting or touching it myself — it's already Ready for Dev and not a T1 action.

### T1 — unblock sweep (01:30Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 12 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 39 items (19 `Deferral`, 20 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-348** ("Encounter UI post-v1 H3 — TTS implementation") — both named blockers confirmed `Done`: THR-336/ARC-105 (Phase D3 TTS discovery + spec, completed 2026-05-06T02:19:02Z) and THR-338 (Phase E2 detail pages, completed 2026-05-07T05:58:24Z). This is the ticket the prior run (00:31Z) flagged as the strongest next-run candidate, closing out the H1→H2→H3 sequence (H1/THR-346 promoted prior day 23:28Z; H2/THR-347 promoted 00:31Z this run-day). Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 01:29:51.011Z, state stuck) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: THR-346, THR-347; Mutex with: none).

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate, re-confirmed live again.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops). Unchanged across four consecutive sweeps now.
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 re-confirmed `Done` (completed 2026-07-26T10:55:17Z), but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers, not implementable units.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.

### T2 — design authoring (01:30Z)

**Not triggered.** Ready for Dev holds 21 non-`Deferral` items after this promotion — well above the floor of 2.

### T3 — architecture health (01:30Z)

**Not run.** Gated on the first run after 06:00 local; this run fired at 03:30 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (01:30Z)

None this run.

## Third run — 00:31Z update (post-merge)

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 02:31 local (before the gate), so only T1 ran and T2's trigger was re-checked. This run also found and fixed a stuck auto-merge from the prior run — see below.*

### Needs Christian

Nothing needs you this run.

### Housekeeping

PR #1043 (prior run's report, promoting THR-346) was armed for auto-merge but stuck at `mergeStateStatus: BEHIND` — several docs/briefing PRs had merged to `main` since it was opened, and nothing was re-updating its branch. Merged `origin/main` into the branch and pushed; auto-merge should now clear on the next green CI run. (Known failure mode — THR-735 tracks the general "armed PR loses the race to main's merge rate" problem; this was one instance of it.)

### T1 — unblock sweep (00:31Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 13 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 38 items — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-347** ("Encounter UI post-v1 H2 — Constants tuning playtest") — both named blockers confirmed `Done`: THR-326 (Phase B4, Detection escalation, completed 2026-05-07T11:30Z) and ARC-98 (Phase B1, Choice resolution + drift accumulator, completed 2026-05-06T17:55Z). This is the sibling ticket the prior two runs (00:31Z, 23:28Z) both flagged as "strongest next-run candidate" once the ceiling allowed another promotion — continuing the H1→H2→H3 sequence (H1/THR-346 promoted 23:28Z). Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 00:30:54.035Z, state stuck) → coordination-block comment posted (Suggested model: opus-4-6; Parallel-safe with: THR-346, THR-348; Mutex with: none).

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate, re-confirmed live again.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops). Unchanged across three consecutive sweeps now; recommend a groomer close this as resolved-by-other-means or re-scope against the current stash state rather than the 2026-07-21 count.
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone" among 4 candidate remedies. T2's input, not T1's. (This run hit a live instance of exactly the problem this ticket describes — see Housekeeping above.)
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed Done, but both self-declare their own design-finalization gate ("Needs its own design finalization before Ready for Dev" / "Needs a full design pass... before any Ready for Dev"). T2's input; T2 did not trigger this run.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers ("do not implement from this issue" / "this issue is the container and tracks the batch burndown" / "each wave runs design finalization before Ready for Dev"). THR-778's actual blockers (THR-773, THR-776, THR-774) are all Done, but the ticket itself is not the implementable unit — its batch children (e.g. THR-838, already in Ready for Dev) are.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.
- **THR-348** (Encounter UI post-v1 H3) — blockers confirmed Done (THR-338, ARC-105); already carries a coordination block. Strongest next-run candidate to close out the H1→H2→H3 batch.

### T2 — design authoring (00:31Z)

**Not triggered.** Ready for Dev holds well above 2 non-`Deferral` items after this run (18+ before this promotion).

### T3 — architecture health (00:31Z)

**Not run.** Gated on the first run after 06:00 local; this run fired at 02:31 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (00:31Z)

None this run.

## Second run — 23:28Z update

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 23:28 local (before the gate), so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (23:28Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 14 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 37 items (19 `Deferral`, 18 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-346** ("Encounter UI post-v1 H1 — Sound design pass") — both named blockers confirmed `Done`: THR-334 (D1 ThreadOverlay, completed 2026-05-08T06:31:41Z) and THR-335 (D2 EffectRegistration, completed 2026-05-08T08:19:38Z). The ticket's own description states D1/D2 "shipped with `onResolveBeat` and `onEffectLand` callbacks ready" for this ticket to consume — both are live in `main`. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 23:28:57.582Z, state stuck) → coordination-block comment posted (Suggested model: opus-4-6; Parallel-safe with: THR-347/THR-348 and anything not touching `src/audio/*`, `ThreadOverlay.tsx`, `EffectRegistration/*`; Mutex with: none identified). Picked over its equally-ready siblings THR-347 (H2) and THR-348 (H3) — all three have Done blockers and their own coordination blocks — as the first phase of the H1→H2→H3 sequence; the other two remain the strongest next-run candidates.

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate, re-confirmed live.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops), not the 38 cited at filing. Unchanged from the prior sweep's finding; still flagged for a groomer to re-scope or close as resolved-by-other-means.
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed Done, but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580.
- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass.
- **THR-347** / **THR-348** (Encounter UI post-v1 H2/H3) — blockers confirmed Done (THR-326/ARC-98 for H2; THR-338/ARC-105 for H3), each already carries a coordination block in its own description. Strongest next-run candidates once the shelf allows more than one promotion.

**Not re-verified this run:** THR-772/778/789 (Nudge Model / Traits program-epic containers — intentionally Todo, explicit "do not implement from this issue").

### T2 — design authoring (23:28Z)

**Not triggered.** Ready for Dev holds 18 non-`Deferral` items after this run — well above the floor of 2.

### T3 — architecture health (23:28Z)

**Not run.** Gated on the first run after 06:00 local; this run fired at 23:28 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (23:28Z)

None this run.

## First run — 00:31Z

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 00:31 local (well before the gate), so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep

**Scan:** `list_issues(state:"Todo", limit:50)` → 15 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 35 items (18 `Deferral`, 17 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-681** ("Worktree disposition — settle `.claude/worktrees` reaping ownership, act on NEEDS-DISPOSITION escalations") — no `Blocked by` line was ever declared; its stated prerequisite (THR-673, reaper hardening) has been Done since 2026-07-21. Re-verified live this run: `git worktree list` from a fresh session worktree shows **34 worktrees, 32 under `.claude/worktrees/`** — up from the 26 the ticket cited at filing, so the problem hasn't gone stale, it's grown. Picked over the other held-back candidates on priority (Medium vs. Low for THR-646/582/766/346/347/348) and because, unlike its sibling THR-680, it carries no home-tree-instruction caveat. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 22:30:28.484Z, state stuck) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: anything not touching `pull-work` Step 0 or the git-cleanup task scripts; Mutex with: none identified). The comment also documents a fact worth carrying forward: `git stash`/`git worktree` metadata lives in the **common `.git` dir**, shared across every worktree of this repo — confirmed live (`git rev-parse --git-common-dir` from the session worktree resolves to the home tree's `.git`). So neither stash triage nor worktree disposal actually *requires* running from the home tree; the THR-671/672/797 containment rules (no `checkout`/`switch`/`commit` with the home tree as CWD) still apply, but the read/dispose operations can run from any session worktree.

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate.** The ticket's premise no longer holds: `git stash list` from this session worktree shows only **2** entries (`home-tree-recovery` no-op stashes from routine freshness repairs), not the 38 cited at filing (2026-07-21) or the 26-never-inspected count. Whatever triage was needed appears to have already happened by other means. Declining rather than promoting a now-oversized/wrong-shaped task onto an executor; flagging for a groomer or a future orchestrator run to re-scope or close as resolved-by-other-means (THR-688 rule A: predicates, not stale counts — this predicate has visibly changed).
- **THR-735** ("Armed-PR staleness sweep") — no blocker, self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed Done, but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task.
- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass.
- **THR-346** / **THR-347** / **THR-348** (Encounter UI post-v1 H1/H2/H3) — each has its blockers confirmed Done and already carries a coordination block in its own description. Strongest next-run candidates once the shelf allows more than one promotion.

**Not re-verified this run:** THR-772/778/789 (Nudge Model / Traits program-epic containers — intentionally Todo, explicit "do not implement from this issue").

### T2 — design authoring

**Not triggered.** Ready for Dev holds 17 non-`Deferral` items after this run — well above the floor of 2.

### T3 — architecture health

**Not run.** Gated on the first run after 06:00 local; this run fired at 00:31 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations

None this run.
