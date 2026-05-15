---
name: weekly-project-hygiene
description: Weekly sweep that audits Threadbare's Linear queues, skill tree, documentation freshness, impediment log, retrospective follow-ups, and sandbox limitations, then files findings into the Continuous Improvement Linear project as issues with coordination blocks.
---

You are running as a Cowork PM/design agent for The Fantasy World Simulator (codebase: TheFantasyWorldSimulator). Your role is design, research, and documentation — no code, no git commands. This is an automated run of a scheduled task; the user is not present to answer questions. Execute autonomously; note any reasonable choices you made in your final report.

This is an **audit**, not an implementation task. Default output is a report plus new Linear issues filed in the Continuous Improvement project. Do not modify repo files, do not commit, do not close existing issues. The only "write" actions permitted by this skill are (a) creating Linear issues under the Continuous Improvement project and (b) appending to `log.md` in the Obsidian vault via MCP when available.

## Your job this session

Run six audit passes in order. Each pass produces findings. After all six passes, consolidate findings into Linear issues under the Continuous Improvement project (one issue per finding cluster, not one per individual item — group related findings together). End by posting a summary comment on each newly filed Linear issue.

Apply WSJF-style judgment to what you surface: small cosmetic drift gets batched into one "routine cleanup" issue; a recurring pattern or a protocol-breach gets its own ticket with a proposed fix.

## The six passes

### Pass 1 — Queue audits (Linear)

Fire one board scan: `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)`. Bucket results in memory by `status` to assess queue health across all states in a single call. (Replaces per-state loops — see `Docs/plans/2026-04-23-linear-mcp-rate-limits.md` Change A for rationale.)

| Status bucket | What to check |
|-------|--------------|
| `Ready for Dev` | CC's pickup queue. Healthy depth is 3–8 items. Flag if >15 (backlog of handoffs the executor can't keep up with) or 0 (CC will starve next cycle). |
| `Ready for Codex` | Codex's pickup queue. Same thresholds as Ready for Dev. Confirm no model-mislabeled items (`model:opus` issues cannot run on Codex's current tier). |
| `In Dev` | Active executor work. Flag any issue in this state for >48h with no recent activity (stuck). Confirm WIP=1 per executor (no duplicate claims). |
| `In Design` | Active Cowork design work. Flag items older than 7 days without a plan doc in `Docs/plans/`. |
| `Implementation Planning` | Design drafted but not yet handed off. Flag items older than 5 days — a plan that sat for a week is stale. |
| `Ready for Dev` + `Ready for Codex` filtered to `assignee:null` | Unclaimed handoffs. Verify every unclaimed item has a coordination block in its latest comment (`Suggested model`, `Parallel-safe with`, `Mutex with`, `Codex review`). Flag any handoff missing the block. |

**Duplicate check (impediment #69 guard):** For any issue in Ready for Dev / Ready for Codex / In Design whose title matches a project currently in "Now" or "Done", `list_issues project:"<project>" state:"Done"` and confirm the new issue isn't a duplicate of shipped work. Log a finding if any duplicates exist; recommend Duplicate transition with `duplicateOf` set.

**Model-label check:** Every issue in Ready for Dev must carry a `model:haiku`, `model:sonnet`, or `model:opus` label (per the coordination protocol). Flag missing labels.

**Handoff-comment check:** For each Ready for Dev and Ready for Codex issue, confirm the latest comment includes the coordination block required by `Docs/plans/2026-04-13-linear-coordination-protocol.md` (CC handoffs: Suggested model + Parallel-safe + Mutex; Codex handoffs: Parallel-safe + Mutex + Files to touch + Done when). Flag any missing blocks.

### Pass 2 — Skill-tree audit

Policy reference: `CLAUDE.md` → `## Skill Tree Layout` section.

Compare the two trees and report drift:

1. `ls .claude/skills/` vs `ls .agents/skills/` — names that appear in both trees are "shared skills" and must be in sync. Spot-check 2–3 shared skills for `diff -q .claude/skills/<name>/SKILL.md .agents/skills/<name>/SKILL.md` output. Any diff is a finding; the pre-commit sync hook (THR-192) should catch this but if it didn't, something slipped through. Recommend `npm run check:skill-sync:sync` to repair.
2. Skills that only exist in `.claude/skills/` — confirm each is listed in CLAUDE.md's Domain Skills table. Unlisted CC-only skills are a finding (either undocumented feature or dead code).
3. Skills that only exist in `.agents/skills/` — these are Cowork/Gemini-only by design (currently: `content-catalog-manager`, `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli`, `obsidian-markdown`). Any skill outside that allowlist that's `.agents`-only is a finding — it probably should be mirrored.
4. Orphan skills — any skill directory with no SKILL.md, or with a malformed frontmatter block (missing `name:` or `description:`), is a finding.
5. Domain Skills table coverage — any skill listed in CLAUDE.md's table that no longer exists on disk is a finding.

### Pass 3 — Doc staleness scan

Run each check on `main` (the current working copy). No edits this pass — these are read-only findings.

| File / pattern | Check | Finding trigger |
|----------------|-------|-----------------|
| `Docs/project-status.md` | `wc -l` ≤ 60 | >60 lines: Cowork/CC drifted from the trim-old-entries discipline. |
| `Docs/project-history.md` | One-line `✅` entries, append-only | Missing recent completions (cross-reference Linear "Done" from the last 7 days). |
| `Docs/changelog.md` | Table rows for every recent doc/vault edit | Any session that touched vault or docs without a changelog row. |
| Root `*.md` | Only `README.md` and `CLAUDE.md` should live at repo root | Any other `.md` at root = orphan (should be in `Docs/` or `.planning/`). |
| `Docs/plans/*.md` | Recent plans (last 14 days) referenced from a Linear issue | Plan doc with no Linear issue pointing at it = orphan plan. |
| `Docs/plans/wiring-checklist.md` | Last-modified date vs. new orchestrator phases / modals / GameState fields added since | Checklist older than the newest phase added = drift. |
| `Docs/impediments.md` | `wc -l` growth vs. last week | >10 new impediments in one week = signal to trigger `/retrospective` (not weekly sweep's job, but flag it). |
| `log.md` (Obsidian vault) | Last entry ≤ 7 days old | Gap > 7 days = vault log drift. |

Cross-reference the most recent 5 Done issues in Linear against `project-status.md` "Recent Completions" and `project-history.md` "Archived to project-history". Any Done issue not referenced in either is a closeout documentation gap.

### Pass 4 — Impediment log review

Read `Docs/impediments.md` end-to-end, then:

1. **Recent entries (last 7 days):** Summarize the top 3 by occurrence count. If any single impediment recurred ≥3 times in the window, that's a finding — it indicates the documented workaround isn't being followed, or the real fix is overdue.
2. **Recurring patterns across the full log:** Group by category. If any category has >5 unresolved entries, that's a cluster finding.
3. **Continuous Improvement candidates:** Flag any impediment whose workaround description implies "we should automate this" or "we should add a gate" — those are candidates for new Continuous Improvement issues. Common patterns: missing CI gates, missing pre-commit hooks, missing validation steps, stale references in CLAUDE.md.
4. **Resolved-but-still-logged:** Any impediment marked "Yes" for workaround with a fix shipped in a recent retro should stay in the log (never delete rows) but doesn't need a new issue. Don't re-surface closed items.
5. **Sandbox limitations cross-check:** Every recurring environment impediment (category = `environment` or `permission`, count ≥2) should be in CLAUDE.md's `## Known Sandbox Limitations` section. Any that aren't = doc drift, create a finding.

### Pass 5 — Retrospectives directory

Read `Docs/retrospectives/` and identify:

1. **Most recent retro:** What date, what was the #1 systemic issue, what immediate/short-term actions were committed?
2. **Dangling actions:** Cross-reference each committed action against Linear. Any action without a corresponding Linear issue (open or closed) = dangling. File a finding.
3. **Completed actions not reflected in the retro:** If a retro action has shipped but the retro still says "Open", append a one-line update to the retro (this is a Cowork-safe edit — retros are docs, not coordination files). Flag it in the report.
4. **Retro cadence:** Gap between retros >21 days = finding. Recommend scheduling a retrospective in Continuous Improvement.

### Pass 6 — Sandbox-limitations verification

Diff `CLAUDE.md` `## Known Sandbox Limitations` against this week's new impediments in category `environment`, `permission`, or `tool-failure`. Anything new that isn't in the CLAUDE.md list = finding. Propose the exact paragraph to add.

Do NOT modify CLAUDE.md directly in this skill — file a Continuous Improvement issue with the proposed diff and let CC ship the edit. CLAUDE.md changes propagate to every agent's system prompt and should go through normal review.

## Consolidating findings into Linear issues

After all six passes, consolidate. Cluster findings into as few Linear issues as will still be actionable — aim for 3–7 issues per sweep, not 30. Typical clusters:

- **One "routine hygiene" issue** for cosmetic drift (e.g., 2 missing changelog rows, 1 stale skill pointer) — low priority, Ready for Codex, no coordination block needed beyond Done-when.
- **One issue per recurring-pattern impediment** that deserves its own fix — medium or high priority, may route to Cowork for design if the fix isn't mechanical.
- **One "handoff hygiene" issue** if multiple Ready for Dev / Ready for Codex items lack coordination blocks — this is a Cowork task: re-post the blocks.
- **One "doc gap" issue** if Linear Done work isn't reflected in project-status / project-history / changelog — Ready for Codex, small mechanical edits.
- **One "retro follow-up" issue** if dangling retro actions need scheduling.

## Linear issue format

Every issue you create must:

- Belong to the **Continuous Improvement** project
- Be in state **"Ready for Dev"** (for Cowork handoffs) or **"Ready for Codex"** (for mechanical fixes)
- Carry a priority label (High if it's a recurring pattern; Medium if it's drift; Low if it's cosmetic)
- Carry a model label (`model:haiku` for tiny mechanical fixes; `model:sonnet` for routine work; `model:opus` only if the fix spans multiple subsystems)
- Carry an `Improvement` label (for grouping alongside other Continuous Improvement work)
- Include a coordination block in the description (not in a follow-up comment — the body is the handoff for audits)

Coordination block template (verbatim, adapt to the work):

```
## Coordination block

**Suggested model:** haiku | sonnet | opus
**Parallel-safe with:** [issue IDs, or "all other audit findings"]
**Mutex with:** [issue IDs, or "none"]
**Codex review:** yes | no
**Files to touch:** [list; use "N/A (Linear-only)" if no repo edits]
**Done when:**
- [ ] [specific, verifiable]
- [ ] [specific, verifiable]
```

## Output report

End the session with a report to the user containing:

1. **Queue health summary** — depth and warnings for each queue.
2. **Findings count** — total findings, grouped by pass.
3. **Issues filed** — list of new THR issue IDs with titles, linked.
4. **Reasonable-choice notes** — any judgment calls you made autonomously (e.g., "batched 3 small findings into one hygiene issue because individual ones would be <5-min fixes").
5. **Anomalies** — anything that made you pause and wouldn't fit a clean finding, flagged for human review next session.

## Session handoff (always last)

Post a summary comment on the most recently filed Linear issue — one plain-text paragraph listing what was filed this session, the finding count per pass, and any anomalies. CC and Codex poll Linear hourly; no other notification is needed.

## Key references

- `CLAUDE.md` — Cowork vs Claude Code vs Codex split, Prioritization: Finish Before You Start, Skill Tree Layout, Known Sandbox Limitations, Definition of Done
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — handoff protocol, coordination block template, the two-queue design
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — content-pillar reference (useful when a finding touches content authoring)
- `Docs/impediments.md` — the log you're auditing
- `Docs/retrospectives/` — retro cadence and dangling actions
- Linear "Continuous Improvement" project — where findings land

## What this skill does NOT do

- Does not pick up or execute Ready for Dev / Ready for Codex work (that's the `keep-work-flowing` skill's job).
- Does not run `/retrospective` (that's a separate cadence, triggered by >10 new impediments in a week or by a 21-day retro gap — either of which this sweep can flag but will not execute).
- Does not edit CLAUDE.md, skill source, or repo code. Proposals only; CC ships the changes.
- Does not close existing Linear issues or move them between states. New issues only; existing issues are observed.
- Does not `git add`, `git commit`, `git push` (blocked for Cowork anyway — see Known Sandbox Limitations).

## Reasonable-choice defaults (when autonomous)

When the user is not present and a judgment call is needed:

- If a queue is at 0 depth, **do not file filler issues to pad the queue**. Report the zero-depth as a signal; the next `keep-work-flowing` run can pull from Todo.
- If a handoff is missing a coordination block but the issue description is otherwise clear, add a minimal block in a comment on that issue yourself (this is safe Cowork work). Note it in the report.
- If the impediment log has >10 new entries in the window, file ONE issue titled "Trigger retrospective — N new impediments" in Continuous Improvement with priority High; do not attempt to run the retro.
- If CLAUDE.md needs a small factual update (e.g., a resolved impediment should move off Known Sandbox Limitations), draft the exact diff in the finding issue; never edit CLAUDE.md from this skill.
- If Linear is rate-limiting, batch queries with backoff; if after 3 retries a query still fails, log the gap in the report and proceed with what you have.

## Why this lands in Continuous Improvement

The weekly sweep IS the flagship workflow of Continuous Improvement. Its output — new issues filed in that project — is what makes compounding process fixes visible and prioritizable alongside feature work.
