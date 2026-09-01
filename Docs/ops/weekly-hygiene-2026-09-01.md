# Weekly Project Hygiene — 2026-09-01

Full sweep. Ran Tuesday rather than Sunday: the machine was asleep 2026-08-30 09:03 → 2026-09-01 19:24 local, so the Sunday 10:10 slot was missed and `StartWhenAvailable` fired this run on wake. Enumeration ran in the **home tree** (`C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`), which matters for the root-markdown check.

**Zero Linear issues filed — deliberately.** See § *This prompt is superseded* below; under CLAUDE.md's process-work throttle (Christian, 2026-08-10) a scheduled lane logs delivery-machinery defects and lets the weekly retro promote them. Everything below is written for the Friday retro to batch.

---

## Needs Christian

**1. The design lane is deadlocked, and it has drained the build queue to one item.**

`Ready for Dev` holds a single ticket. `In Dev` holds three, all `Parked` and unassigned, each waiting on an attended sitting with you. So the executor lane has essentially nothing to pick up.

The reason is structural rather than accidental. Two tickets sit in `In Design` with no author and no plan doc:

- **[THR-790 — Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — In Design since 2026-08-15 (**17 days**), assigned to you
- **[THR-1002 — Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** — In Design since 2026-08-19 (**13 days**), unassigned

The orchestrator's shelf-refill step (T2) is capped at one item in `In Design`. With two parked there it has been barred on **eleven-plus consecutive runs** and has staged nothing. Design sessions are attended work — no scheduled lane authors plan docs — so nothing will move those two on its own, and while they sit, nothing refills the shelf behind them.

Three ways out, cheapest first: (a) run one design session on [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (its ticket body is unusually complete — pillars, Done-when and prior art are all already written, so it is close to plan-doc-ready); (b) move one of the two back to `Todo` to unbar T2; (c) raise the one-item cap. **Recommendation: (a), on THR-1002.** It unblocks [THR-998](https://linear.app/threadbare/issue/THR-998/the-focused-cards-risk-word-is-computed-from-a-difficulty-that-never) as a side effect, and it is the one whose scope you set directly.

**2. Every scheduled lane went silent for 58.1 hours (2026-08-30 07:03Z → 2026-09-01 17:09Z) with no pause marker.**

The detector built for exactly this (THR-1001) caught it on the first run after resumption and reports `recovered` — the machinery worked. What is missing is the declaration: the marker file `C:\Users\chris\.claude\threadbare-pause.json` still holds the expired 2026-08-03 window and covers nothing current.

**Was this a deliberate pause (token limits again) or the machine simply being off?** Windows' own power log and the lanes' last-run clustering both read as a sleep, which suggests "off" — but only you can confirm. If pauses like this are going to recur, dropping a line in that marker file at the time costs nothing and keeps the probe honest; if it was just the machine sleeping, no action, and this is a clean bill of health for the detector.

Nothing else needs you.

---

## Queue health

| State | Count | Oldest |
|---|---|---|
| `Ready for Dev` | **1** — THR-1349 (decision-board variety term) | released to the queue 2026-09-01, created 08-29 |
| `In Dev` | **3** — THR-1130, THR-1133, THR-1168 | all three `Parked` + unassigned, all awaiting an attended sitting |
| `In Design` | **2** — THR-790, THR-1002 | THR-790, 17 days |
| `Implementation Planning` | 0 | — |

- **Projects:** every issue in every state belongs to a project. No orphans.
- **Coordination blocks:** THR-1349 carries a complete one (`Suggested model` / `Parallel-safe with` / `Mutex with`, each mutex with its stated reason per THR-688 rule B) in the 2026-08-30 orchestrator promotion. PASS.
- **Stale In Dev:** the three `In Dev` items have gone 2+ days without movement, but all three carry `Parked`, which is the sanctioned opt-out. Not stale claims.
- **Stale handoff:** THR-1349 has been claimable for under a day. Not starvation — the opposite problem, an empty shelf.
- **Deferrals:** THR-1349 itself carries `Deferral` and sits at the top of its queue by being the only item. Consistent with "Finish Before You Start".
- **Stale-claim machinery worked:** the GitHub Action flagged THR-1349 at 16:27Z; `daily-backlog-grooming` released it ~48 min later with a full written rationale rather than waiting out the 24 h auto-release. Correct call, correctly recorded.

---

## Findings — recorded for the retro, not filed

Ordered by what they cost.

### F1 — This lane lost two of its last three sweeps while the fleet was demonstrably up

Reports exist for 2026-08-02 and 2026-08-09 on `origin/ops`, then nothing until this one. Three Sundays passed:

| Sunday | Sibling witness | Verdict |
|---|---|---|
| 2026-08-16 | `backlog-grooming-2026-08-16.md` published | **lost — fleet was healthy** |
| 2026-08-23 | `backlog-grooming-2026-08-23.md` published | **lost — fleet was healthy** |
| 2026-08-30 | fleet silent from 07:03Z; the 10:10 slot fell inside it | explained by the outage |

The task is enabled, its cron is correct, and its `lastRunAt` was overwritten by this run so the prior dispatch history is gone. Two possibilities remain and they are distinguishable only from the run transcripts: the runs never dispatched, or they dispatched and died before `ops-publish.sh`. **Cost: two full structural audits of the whole project, ~3 weeks of unaudited queue** — the design-lane deadlock in § Needs Christian has been building since roughly 08-15 and would have surfaced two sweeps ago. Clears the materiality bar on lost lane-hours.

Worth noting the shape: `check:task-heartbeat`'s sibling-witness predicate would have fired on both Sundays had anything been running it against a weekly cadence — but it runs inside `keep-work-flowing-cc` hourly, and a weekly lane's miss is invisible at that resolution. That is the gap, not the predicate.

### F2 — Two scratch directories are impersonating skill trees, one of them at the demolished `.agents/skills/` path

- `.claude/skills/image-manipulation-workspace/` — **no `SKILL.md`**, three `iteration-*/` directories of hex-clip PNG output. It appears in the skill listing alongside real skills.
- `.agents/skills/image-manipulation-workspace/` — same content, at the path THR-654 demolished in 2026-07.

Both are untracked **and not gitignored**, so a `git add -A` in the home tree commits several hundred PNGs. Neither is a returned second skill tree — they are working output from the `image-manipulation` skill written to the skill's own directory instead of a scratchpad — but the second one is indistinguishable from the THR-654 regression by the audit's own predicate ("if `.agents/skills/` exists at all, that is a finding"), which is how it consumed the first ten minutes of this sweep. Fix is two lines: point the skill's workspace at the scratchpad, and add an ignore rule. Below the materiality bar on its own; cheap enough to be worth a retro quick-win.

### F3 — The wiki-freshness gate over-fires and under-covers, from the same root

Measured over the 8-day window:

- **~28 `Wiki-freshness-exempt:` claims on `origin/main`.** I read every one against its diff. **No misuse found** — each is a genuine glob-incidental match, several run to a full paragraph of analysis, and one commit (`e258d562`) found real drift the gate flagged and updated the page rather than exempting it. The exemptions are doing their job; the volume is the problem, at roughly one authored justification per working day.
  - One count caveat: `b6f62086`'s body says *"Wiki-freshness-exempt is deliberately NOT claimed here"*, so the grep predicate in this prompt over-counts by matching negative statements. Worth knowing before anyone treats the number as a trend line.
- **212 of 273 changed non-test source files match no page's `sources` glob.** Most of that 212 is legitimate — `uiColorPalette.ts` and `world-model.json` are not wiki subjects — but two *shipped subsystems* are in it and have no documenting page at all: **`src/engine/decisionBoard.ts`** (the unified prioritization board, THR-1292/THR-1349 — a rules-of-play system) and **`src/engine/settlementGenome/`**.

Both halves point at the same cause: `sources` globs are directory-shaped rather than system-shaped, so they sweep in files a page does not document while missing systems no page owns. A retro pass that re-cut the globs per system would reduce both numbers at once.

### F4 — `monthly-rulebook-review` silently skipped its 2026-09-01 slot

`lastRunAt` 2026-08-01, `nextRunAt` **2026-10-01**. Its 09:00 local slot today fell inside the sleep window and the scheduler advanced past it rather than catching up — unlike the weekly tasks, which all caught up at ~17:03. A monthly lane that misses one slot misses a whole month. No loss yet (the rulebook is not visibly drifted), so this is a log row, not a ticket; the durable question for the retro is whether monthly cadences want a catch-up guard.

### F5 — Observation, not a finding: 195 worktrees / 206 local branches

The reaper is healthy and running on schedule (last pass 2026-09-01 18:40, donor install verified at 289 packages / 99 bin shims) and self-reports **3** worktrees needing disposition, all unmerged and 31–45 days stale. The other ~192 are neither reaped nor flagged. No demonstrated loss, disposition belongs to the reaper alone (THR-674), and unbounded accumulation without a cost is explicitly below the Rule-0 bar. Recording the number so a later sweep can see whether it is growing.

### F6 — This prompt is superseded, which is a finding by its own instruction

`weekly-project-hygiene`'s prompt says *"Filing issues is the default for actionable findings"* and carries a full `## Filing findings` section. CLAUDE.md § Continuous Improvement (Christian, 2026-08-10) says the opposite and names this case explicitly:

> **Scheduled lanes do not file process/infrastructure tickets.** … The **weekly retro is the single promotion point** … A lane prompt that still says "file findings as tickets" is superseded by this rule.

The prompt's own § Objective asks it to flag exactly this. **Corrected in this sweep** — the live prompt and its mirror at `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md` both now route findings to the retro, with the Rule-0 active-corruption exception preserved. Shipped as [PR #1759](https://github.com/christianspliid-ui/threadbare/pull/1759) (docs-only, all four docs gates green, auto-merge queued). That is the one durable `main` change this run made; everything else it produced is this report.

---

## Clean checks

- **Root-level markdown — PASS.** Enumerated (not recalled): `AGENTS.md`, `CLAUDE.md`, `Index.md`, `STYLE.md`. All four on the allowlist; `AGENTS.md` is still a slim pointer, not ballooned back. `Index.md` re-confirmed accepted — `git check-ignore` matches `/Index.md`, `git ls-files` returns nothing.
- **Stray published reports — PASS.** `git ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` returns empty. Every lane deleted its report after publishing.
- **Scheduled-task registry, all three directions — PASS.** 10 registered tasks, 10 registry rows; every cron matches the documented value and every jittered fire time matches the `Fires` column, including `keep-work-flowing-cc` at `45 * * * *` → ~:53 (the slot whose rationale the 2026-07-25 precedent protects). Direction 3: 13 prompt directories against 10 registrations — the same three orphans THR-851 recorded (`check-slack-for-new-dev-work`, `daily-standup`, `keep-website-up-to-date`), all mirrored under `scheduled-task-prompts/retired/` with dispositions recorded. Their deletion remains a Christian action and is not re-raised here.
- **Skill tree — PASS with F2.** 43 real skills, every one carrying `SKILL.md` with non-empty `name:` and `description:`. Every skill named in CLAUDE.md's Domain Skills routing policy resolves to a real folder. `last_validated_against` dates are healthy — the bulk sit in 2026-08-28/29; the oldest are the five vault skills and `content-worldbuilding` at 2026-07-30, which is stale but defensible since vault work has not changed since THR-654.
- **Docs staleness — PASS.** Every recent Done issue has its `Docs/status/YYYY-MM-DD-thr-XXXX.md` fragment (spot-checked THR-1349, THR-1376, THR-1328, THR-1316). `changelog.md` rows are current through 2026-08-30 and carry the full `| date | where | what | why |` shape. `project-status.md` correctly absent from tracking (generated since THR-1016) — not hand-edited, not trimmed.
- **Done-state smoke test — PASS.** Four recently-Done issues checked for a line-anchored landing commit: THR-1376 → `1c83442f`, THR-1328 → `bb2a7078`, THR-1316 → `4193db91`, THR-1351 → `fc7f5b79`. **No THR-540 false-closes found.**
- **Impediment log + sandbox catalog — PASS.** 958 rows, current through 2026-08-30. The catalog at `Docs/ops/sandbox-limitations.md` carries every chronic family with its recurrence evidence, and one entry was actively *retired* this cycle (THR-1326 proved the `node_modules` arrival shapes are normal states, not incidents, and the per-arrival tally rows were struck — the right direction for a log that was drowning at ~31 rows/week).
- **Retro follow-through — PASS.** `retro-2026-08-28.md` references the top impediments, tracks the prior retro's backlog to closure (THR-1191, THR-1192 both Done same-day), and its five backlogged items are all filed in Linear with THR ids. Its "deliberately not filed" section is explicit about what stayed below the bar. Spot-check: THR-1328 was backlogged there and has since shipped with a landing commit.
- **Three-pillar compliance — N/A this cycle.** Neither In Design ticket has a plan doc to audit yet; that absence is F1's consequence and § Needs Christian item 1, not a separate compliance failure. Both tickets' *bodies* name all three pillars explicitly, so whoever authors them starts from a compliant scope.

---

## Notes

- **`npx tsc --noEmit`** — no doc or skill in the tree cites it as a type gate. Nothing to correct.
- **Plan-doc archival** — 539 of 659 docs in `Docs/plans/` predate 2026-07-03. I did not triage them. Dead-doc pruning is on Rule 0's explicitly-non-qualifying list, and a 539-doc pass is not a by-product of a hygiene sweep; if it is wanted it should be a scoped ticket with a membership predicate, filed by the retro.
- **Orphan-deferral spot-grep** — skipped this run. It is listed as optional and time-boxed in the prompt, and the budget went to F1's forensics instead. Flagging the skip rather than letting silence imply a pass.
- **What I chose not to file, and why** — all six findings. F1, F3 and F4 are delivery-machinery defects with real but past cost; F2 and F5 are below the materiality bar; F6 is fixed in this run. None meets the throttle's sole exception (a loss actively corrupting work *right now*). They are written here in the shape the Friday retro batches from, with the cost line each would need.
- **Judgment call on the durable change** — F6's prompt correction was made without asking. It is an unambiguous reconciliation of a lane prompt against a standing director ruling that names this exact case, which CLAUDE.md puts on the agent's side of the line; leaving it would mean the next run either re-derives the conflict or files a batch of tickets against explicit direction.
