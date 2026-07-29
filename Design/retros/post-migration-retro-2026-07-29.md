# Post-Migration Retro — Pure Claude Code Migration

**Date:** 2026-07-29 · **Issue:** THR-655 · **Plan:** `Docs/plans/2026-07-17-pure-claude-code-migration.md` (Phase 3, step 8)
**Observation window:** 2026-07-21 08:48Z (THR-654 merge) → 2026-07-29 15:00Z — **8 days**, against the plan's 1-week constant.

This is the migration's own closing gate: one week after the demolition landed, do the impediment classes it
claimed to close stay closed, and does the replacement inbox actually work? Four questions, answered below
with what was measured rather than what was expected.

**Verdict: all four green.** Residue found in two live command files was fixed in this pass; two structural
gaps were filed rather than fixed. Project moves to Done.

---

## 1. Do the retired impediment classes stay closed? — **GREEN**

The five classes THR-654 claimed to close structurally: mount/working-tree corruption, the flush pipeline,
skill-sync, the Obsidian-MCP fallback, and Cowork Linear auth.

**Method.** Extracted every impediment row dated on or after the cutover (96 rows, #187–#288 of 302 total) and
swept the full row text — not just the description column — for every class keyword and its synonyms:
`skill-sync`, `.agents/skills`, `flush-plan-docs`, `plan-pending-commit`, `flush-close-guard`, `obsidian`,
`vault`, `log.md`, `mount`, `corrupt`, `.git/config`, `VM`, and bare `cowork`.

**Result — zero occurrences in all five classes across 96 post-cutover rows.**

| Sweep | Hits | Reading |
|---|---|---|
| Class keywords (skill-sync / flush / label / guard) | **1** | #187 only — and that row *is* the closure note ("RESOLVED — the `check:skill-sync` gitignored-scratch false positive"), dated the cutover itself. Not a new occurrence. |
| `cowork` (bare, case-insensitive) | **0** | The strongest single number here. Not one impediment in 8 days mentions the retired lane in any capacity. |
| `obsidian` / `vault` / `log.md` | 2 | Both unrelated on reading the body: a plan doc naming a non-existent reference file (#243), and `merge=union` duplicating impediment row numbers (#286). Neither is the MCP-unreachable class. |
| `mount` / `corrupt` / `VM` / `.git/config` | 6 | All unrelated on reading the body: Python LF→CRLF conversion (#204), shell-quoting corruption via `node -e` (#211), a stale diff base (#249), a hidden-pane `javascript_tool` hang (#262), an unreachable live-graph write (#274), and #286 again. No sync/mount corruption. |

The keyword sweep deliberately over-matches and every hit was read in full before dismissal — the
`upstream_shipped_grep_prose_false_positive` lesson applies exactly here, since a log that *documents* a
retired class will always match a grep for it.

**Comparison against the 8 days immediately before cutover** (2026-07-13 → 07-20, 15 rows): roughly two-thirds
of those rows carry a retired-class keyword — the tail end of the friction the migration existed to remove.
Stated loosely on purpose: `Docs/impediments.md` has ~30 known column-shifted rows (THR-839), so per-row date
attribution in that window is not trustworthy to the row. **The robust claim needs no such precision — it is
the post-cutover zero, measured across whole rows, which no column shift can manufacture.**

**One caveat worth stating plainly.** Volume rose sharply: 96 impediments in the 8 days after cutover against
15 in the 8 days before. That is *not* a regression signal — the lane went from partially blocked to shipping
continuously, and three self-audit lanes (`daily-backlog-grooming`, `weekly-project-hygiene`,
`tb-orchestrator`) that did not exist pre-cutover now file findings hourly. Higher throughput and more
self-inspection both produce more log rows. But it does mean **"zero in the retired classes" is a claim about
composition, not about a quiet log** — the classes are closed inside a much busier stream, which is the
harder test, not the easier one.

## 2. Is the briefing-file inbox working? — **GREEN**, and the monitored risk was actively mitigated

This was the intent-judge's single named carried-forward risk (plan §Forked-audit verdicts, condition 2): is
the pull-model inbox reaching Christian *no worse* than the old chat surfacing, and if worse, add a
notification channel per the fail-soft table.

**It is not worse, and the fail-soft path was exercised without needing this retro to trigger it.**

- **Both files are live and hourly.** `Design/briefing.md` and `Design/user-actions.md` both carry a
  generated-at timestamp (2026-07-29 15:52 local / 13:52 UTC at time of writing), so staleness is
  self-evident by construction, exactly as the plan's §Tracing section specified. `keep-work-flowing-cc`
  owns both; no second writer.
- **The notification channel the fail-soft table anticipated was added on 2026-07-25** — a two-way Discord
  channel, four days after cutover and well inside the plan's "if worse after 2 weeks" trigger. So the
  additive fix landed *pre-emptively* rather than as a remedy. The inbox is now pull (briefing file) **plus**
  push (Discord ping), which is strictly more than the chat surfacing it replaced.
- **Asks are demonstrably reaching him and coming back answered, with dates and channels recorded.**
  `user-actions.md` carries four questions answered-and-closed: the five empty projects (chat, 2026-07-25
  21:53), THR-799 priority ordering (2026-07-27), release of THR-821/820/777/778 (Discord, 2026-07-27
  14:38Z), and the GitHub Actions payment block.
- **The decisive case is the billing block**, because it is the one genuinely time-critical ask in the
  window: Actions was billing-blocked, which silently vacates the required merge gate (a `skipped` required
  check satisfies branch protection). It was surfaced, and Christian cleared it **the same day, twice** —
  2026-07-25 ~17:09Z and again 2026-07-28 17:02Z, both verified by re-run. A time-critical ask reached him
  and was acted on within hours. That is the risk discharged on its own terms.
- **The inbox also grew discipline the chat surface never had.** `user-actions.md` now carries 31 durable
  findings as rule sentences, and a stated convention that an unanswered ask with a safe default is *not*
  re-rung (finding 12). The old failure mode the plan cited — asks staling across three retros — was a
  surface with no memory. This one has one.

## 3. Are the CC scheduled-task heartbeats healthy? — **GREEN**

`npm run check:task-heartbeat` against live `list_scheduled_tasks` output:

```
verdict: ok
All 8 enabled scheduled tasks are within 2 slots of schedule.
never run (not a stall): monthly-rulebook-review
```

`monthly-rulebook-review` is correctly excluded — registered 2026-07-22, first fire due 2026-08-01. The plan's
Done-when required "≥3 days of heartbeats"; the CC replacements have **8–9 days** and every lane has fired.

Two lanes fired late today (`daily-backlog-grooming` 13:22Z against a 07:16Z slot; `weekly-workflow-retro`
13:36Z against 09:13Z). **This is the documented host-sleep catch-up, not a lane defect** — the machine slept
~02:40Z→13:22Z, `StartWhenAvailable` caught the lanes up together, and the diagnosis was closed independently
by the reaper firing at 15:40:01 local exactly as a falsifiable test predicted. Worth recording because the
same event made `check:task-heartbeat` briefly report a false `stalled` — a known probe defect where a
liveness witness is accepted at the window's closing edge (`heartbeat_witness_wake_boundary`); it wants a
ticket from a write-remit session and is unrelated to the migration.

## 4. Does the CLAUDE.md task table match reality? — **GREEN**, after fixing residue found elsewhere

CLAUDE.md no longer carries the table — THR-760 moved it to `Docs/ops/scheduled-tasks-registry.md`, leaving a
pointer plus the two rules that gate live session behaviour. Audited both directions:

- **All 10 tasks `list_scheduled_tasks` returns have a registry row** — 9 in the live CC lane table,
  plus `website-code-work` in the "registered but not Threadbare work" table.
- **All 10 registry CC-lane rows exist in the live list.** No phantom rows, no missing rows.
- **CLAUDE.md's 3 remaining `Cowork` mentions are all correct**: one historical ("retired 2026-07-21,
  THR-654"), one live pointer to the registry's Cowork-lane-pending-disable table, one historical explanation
  of why the second skill tree existed. The Done-when was "no Cowork *role/limitation* content" — satisfied.
- **All Phase 3 deletions stayed deleted**, verified by direct path checks: `.agents/`, `.agents/skills/`,
  `.github/workflows/flush-close-guard.yml`, `.claude/skills/flush-plan-docs/`, `scripts/check-skill-sync.js`
  all absent; zero `skill-sync` entries in `package.json`. Nothing was reintroduced.

---

## What this retro found and fixed

The demolition swept CLAUDE.md, the skills tree, and the workflows — **but not `.claude/commands/`.** Two live
slash-command files were still routing agents through the deleted pipeline, and one skill carried a claim that
had become false:

| File | Was | Now |
|---|---|---|
| `.claude/commands/design-audit.md` | *"Proceed to `plan-pending-commit` and Linear state transition as normal"* — a **live positive instruction** to apply a label deleted 8 days earlier. Plus two more label references and two Cowork-role references. | Routes to the `docs/plan-*` PR flow; Cowork references replaced with "the design session". |
| `.claude/commands/intent-judge.md` | *"dry-run the judge before applying `plan-pending-commit`"*; *"Cowork's plan-doc workflow handles the standard Allow → Ready for Dev transition"*. | Same corrections; names the `design-session` skill as the owner. |
| `.claude/skills/design-session/SKILL.md` | *"The legacy label+flush path still exists during the migration parallel-run (retires in Phase 3, THR-654)"* — written mid-migration, false since 2026-07-21. | States the path was deleted 2026-07-21 and there is nothing to fall back to. `last_validated_against` bumped to 2026-07-29. |

**The lesson is the shape of the miss, not the fix.** Every other reference to `plan-pending-commit` in the
repo is a *negative* instruction ("do not apply it", "this was retired") or a dated plan doc — correct and
desirable. These four were positive instructions in live command surfaces, and they survived because the
demolition's file list was drawn from the plan's "Files to touch" section, which named CLAUDE.md, the skills
tree, and the workflows. `.claude/commands/` was never on the list, so no gate ever looked there. **A
retirement sweep scoped by a plan doc's file list inherits that list's blind spots** — the surfaces a plan
forgot to name are exactly the surfaces that keep the dead thing alive.

## What this retro found and filed

Two structural gaps, both outside this issue's scope to fix:

- **[THR-850](https://linear.app/threadbare/issue/THR-850)** (Medium) — `tb-opus-pickup`, the sole executor
  lane, has **no repo prompt mirror**. Eight of ten registered tasks have one; the two without are
  `website-code-work` (correctly out of scope) and the one lane whose prompt encodes the entire
  pickup-to-ship contract. It is unbacked *and* unreviewable, so prompt-vs-`pull-work` drift is invisible to
  every gate. Same class as THR-824.
- **[THR-851](https://linear.app/threadbare/issue/THR-851)** (Low) — the registry's audit is declared
  two-directional (`list_scheduled_tasks` ↔ registry, `Get-ScheduledTask` ↔ Windows table) but there is a
  **third surface nobody checks**: the prompt directory itself holds 13 directories against 10 registered
  tasks. The three orphans (`check-slack-for-new-dev-work`, `daily-standup`, `keep-website-up-to-date`, all
  pre-migration) are indistinguishable by inspection from a live lane's prompt — the mirror image of the hole
  the two-directional rule was written to close.

## Disposition

All eight prior issues in the **Pure Claude Code Migration** project are Done (THR-648 → THR-654, plus
THR-677). THR-655 was the last. The plan's Done-when list is fully discharged:

- [x] One design task flowed design → merge → auto-close entirely inside CC (THR-652, the Phase 2 gate)
- [x] Cowork scheduled tasks disabled; CC replacements have 8–9 days of heartbeats (≥3 required)
- [x] `flush-plan-docs`, `flush-close-guard.yml`, `plan-pending-commit`, `.agents/skills/`, skill-sync
      scripts/hook all absent from main — re-verified today, not merely once at demolition
- [x] CLAUDE.md carries no Cowork role/limitation content; the task registry matches reality both directions
- [x] Verification gates pass on the landing PR (evidence in the closing commit body)
- [x] Browser-verify exempt: process/docs/skills change, no UI surface

**Recommendation: move the Pure Claude Code Migration project to Done.** The one condition the intent-judge
carried forward — the inbox pull-model regression — resolved favourably and was independently mitigated by
the Discord channel before this retro ran.
