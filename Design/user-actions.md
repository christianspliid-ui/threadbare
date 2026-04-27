# User Action Required

**Last updated:** 2026-04-27 (initial seed; five items confirmed resolved later same day)
**Owner of items below:** Christian. Everyone else's blockers go in Linear or `Docs/impediments.md`.
**Refresh cadence:** Cowork rebuilds this on retro day from the active impediment log. Items are removed when resolved.

## How this works

The retrospective stopped being the right channel for "Christian, please flip one switch." Three of last week's four experiments slipped because they were Christian-owned, the asks were buried in retro prose, and nothing surfaced them between retros. This file replaces that pattern.

Read order: top to bottom is blast radius. The top items break canonical workflow invariants right now; the bottom items are operational debt with workarounds in place.

For each item:
- **Fix** = the literal command, click path, or line of config that resolves it.
- **What breaks** = the named system or invariant currently degraded.
- **Source** = `Docs/impediments.md` entry numbers + occurrence count, so the cost is visible.

When an item resolves: delete it from this file, mark the corresponding impediment as resolved in the dashboard regen, note the close in the next retro under "What shipped." No history retained here — `git log` + the retros are the audit trail.

---

## 1. Decide Obsidian MCP path · RECURRING

**Status:** Open · 8 days · ~12 occurrences
**Source:** Impediments #66, #71, #75, #86

**Fix — pick one.**
- **Option A (auto-start):** Configure the Obsidian Local REST API plugin to start with the OS, so the MCP can reach it without Obsidian being open.
- **Option B (filesystem fallback):** Confirm the vault-log skill should fall back to direct filesystem writes when the MCP is unreachable, and Cowork updates the skill accordingly.

**What breaks if not done.** Vault appends from session activity (log.md, retro outputs, ingest results) silently queue or drop. The vault drifts from canonical state. Either path closes the issue; status quo is the worst option because we keep paying the queue+replay cost without resolving it.

---

## 3. Triage 8+ orphan uncommitted changes · WILL NOT SELF-HEAL

**Status:** Open · 9 days
**Source:** Impediments #59

**Fix.** Run `git status` on `main`; for each tracked-but-uncommitted file, attribute it to a Linear issue (commit with `Fixes THR-XX`) or `git checkout --` discard. Untracked files: same triage — `git add` + commit if intentional, `rm` if not.

**What breaks if not done.** This is the upstream cause of the Codex dirty-worktree bounces (#87/#88/#89, ~50% of automation slots wasted). [THR-277](https://linear.app/threadbare/issue/THR-277) makes Codex resilient *to* dirty state, but it doesn't clean the state. Until the orphan changes are triaged, the dirty worktree stays dirty.

---

## 4. GitHub Pro upgrade decision · NOT URGENT

**Status:** Open · 9 days
**Source:** Impediments #56

**Fix.** Either upgrade to GitHub Pro (enables branch protection + required-status-checks merge gating), or accept that CI stays advisory.

**What breaks if not done.** Branch protection can't be enforced on `main`, so `claude-review.yml` stays in advisory mode (THR-183 tracks the flip). Tests and typecheck stay best-effort rather than required-to-merge. Not blocking any current work; gates a future "required CI" milestone.

---

## 5. Re-author `weekly-workflow-retro` scheduled-task SKILL.md · OUTSIDE-REPO

**Status:** Open · 4 days · 2 occurrences (impediment #67 last retro, repeated this retro)
**Source:** This retro's data-quality note + impediments #67 (prior retro)

**Fix.** The scheduled-task SKILL.md that drives the autonomous retro run lives outside the repo (in the local agent mode session config, not under `.claude/skills/`). Open it, add a Step 0 that loads this week's `drift-scan`-labeled Linear issues from the Continuous Improvement project before reading `Docs/impediments.md`. The in-repo `retrospective` skill already does this (THR-274); the scheduled task version is stale against THR-274.

**What breaks if not done.** Each Friday's autonomous retro reads only the impediment log, not the drift-scan inputs. Anything the GitHub Action drift scan flagged but didn't show up as an in-session impediment is invisible to the retro. The skill can't self-heal because agents don't have write access to the scheduled-task config.

---

## Resolved this period

- **2026-04-27 — `LINEAR_API_KEY` GitHub Actions secret added** (was item #1; impediment #85). Verified empirically: PR #47 merge commit `b6eb5fd5` pushed 2026-04-27 01:26:06 UTC, THR-275 transitioned to Done at 2026-04-27 01:26:09 UTC — three-second gap is the auto-close workflow firing. Auto-close invariant restored. THR-276 audit unblocked; missing-secret window narrowed to ~2 days (~2026-04-24 to 2026-04-26), so the audit scope is bounded. To be removed from this section on next retro day.
- **2026-04-27 — Linear free-issue quota resolved** (was item #2; impediment #93). Confirmed by Christian. Circumstantial verification: THR-276 and THR-277 were both filed successfully on 2026-04-27, which would have been blocked under the prior cap. Issue creation is unblocked; UL proposals, drift-scan auto-filed issues, and executor handoff tickets can flow again. To be removed from this section on next retro day.
- **2026-04-27 — GitHub Actions billing funded + spending alerts set** (was item #3; impediment #91). Funding confirmed empirically: PRs #44, #46, #47 all merged successfully with CI in the 24h ending 2026-04-27 03:26 UTC, and the linear-autoclose Action fired on PR #47 (provable: THR-275 closed 3s after merge). Spending alerts setup confirmed by Christian (not externally observable from outside GitHub Settings → Billing). The next CI billing ambush is preventively guarded.
- **2026-04-27 — `$CODEX_HOME` set in PowerShell profile** (was item #4; impediments #64/67/76). Cowork wrote the line to both real profile paths via Windows-MCP PowerShell tool: `C:\Users\chris\OneDrive\Dokumenter\PowerShell\Microsoft.PowerShell_profile.ps1` (PS7 Core, was missing — root cause) and `...\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` (PS5, already had the line). OneDrive locale-redirected `Documents`→`Dokumenter` was the gotcha. Verified by spawning fresh `pwsh` subprocess: `$env:CODEX_HOME = 'C:\Users\chris\.codex'` ✓. Codex sessions starting fresh now see the variable. The 16-occurrence count should not climb in subsequent sessions.
- **2026-04-27 — `session-handoff` skill deletion confirmed intentional** (was item #7; impediment #58). Christian confirmed deletion was per THR-236. No restore needed; impediment will be marked Resolved in next dashboard regen.
- **2026-04-27 — GitHub labels `codex` and `codex-automation` created** (was item #2; impediment #82-1). Verified: `gh label list | grep -E "^(codex|codex-automation)"` → `codex	Codex executor queue	#0075ca` / `codex-automation	Codex automation workflows	#e4e669`. Codex automation PRs can now tag themselves with the standard label set.

---

*This file is regenerated by Cowork on retro day from `Docs/impediments.md`, the active retro, and any newly filed Christian-owned impediments. Manual edits between retro days are fine — they'll be preserved as long as the item is still open. To force a refresh between retros, run `/retrospective` or ask Cowork directly: "rebuild user-actions."*
