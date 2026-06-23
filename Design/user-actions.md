# User Action Required

**Last updated:** 2026-06-23 (full rebuild from the 2026-06-23 retro — replaces the 2026-04-27 seed that went 57 days stale)
**Owner of items below:** Christian. Everyone else's blockers go in Linear or `Docs/impediments.md`.
**Refresh cadence:** Cowork rebuilds this on retro day from the active impediment log. Items are removed when resolved.

## How this works

The retrospective stopped being the right channel for "Christian, please flip one switch." Christian-owned asks were buried in retro prose, and nothing surfaced them between retros. This file replaces that pattern.

Read order: top to bottom is blast radius. The top items break canonical workflow invariants right now; the bottom items are operational debt with workarounds in place.

For each item:
- **Fix** = the literal command, click path, or line of config that resolves it.
- **What breaks** = the named system or invariant currently degraded.
- **Source** = `Docs/impediments.md` entry numbers + occurrence count, so the cost is visible.

When an item resolves: delete it from this file, mark the corresponding impediment as resolved in the dashboard regen, note the close in the next retro under "What shipped." No history retained here — `git log` + the retros are the audit trail.

---

## 1. Set `LINEAR_API_KEY` in the Codex automation environment · BLOCKING · RECURRING

**Status:** Blocked, no workaround · 17 recurrences
**Source:** Impediment #141

**Fix.** Set `LINEAR_API_KEY` in the Codex automation session environment (the same key CC/Cowork use). This is the single highest-leverage action on the board.

**What breaks if not done.** The entire Codex executor lane is dark. Codex automation sessions expose no callable Linear pickup tools and the repo-side fallback is dead because the key is unset — Codex cannot run the WIP gate, scan `Ready for Codex`, claim, or post closeouts. This is compounding: live Linear shows issues stranded in `Ready for Codex` (e.g. THR-481/478/476) that no executor can pick up, and Cowork keeps routing mechanical work into a lane with no consumer. An entire queue is stalled and growing.

**Reversibility.** Unset the key.

---

## 2. Refresh the home worktree + confirm "This machine" scheduled tasks are firing · WILL NOT SELF-HEAL

**Status:** Open · home tree ~11 days / 38 commits stale; no retro fired for ~4 weeks (3 missed weekly runs: 06-03, 06-10, 06-17)
**Source:** This retro (home-tree precheck `behind:38 + stale-branch:265h`; retro automation gap)

**Fix — two parts.**
- **Refresh the tree:** `git fetch && git pull` on the home worktree (or `git fetch && git rebase origin/main` if on a feature branch) before the next design session.
- **Verify the schedulers:** confirm `weekly-workflow-retro` (and `keep-work-flowing`, `daily-backlog-grooming`, the other "This machine" tasks) are still scheduled and that the machine was powered on during their windows. These run on your machine; when it's off they skip silently with no heartbeat.

**What breaks if not done.** Any agent starting design on the stale tree risks building on ~11-day-old state — exactly what the THR-391 freshness guard exists to catch. And without a per-task heartbeat we can't tell "machine was off" from "task broke" — the 4-week retro gap is the symptom, and the two newest impediments (#140, #141) sat unsurfaced by any retro until 06-23.

---

## 3. Decide the Obsidian MCP path · RECURRING

**Status:** Open · ~60 days · ~12 occurrences
**Source:** Impediments #66, #71, #75, #86

**Fix — pick one.**
- **Option A (auto-start):** Configure the Obsidian Local REST API plugin to start with the OS, so the MCP can reach it without Obsidian being open.
- **Option B (filesystem fallback):** Formally accept that the vault skills fall back to direct filesystem writes when the MCP is unreachable, and stop carrying this item every retro. (The fallback already ships in the vault-log skill and requires `OBSIDIAN_VAULT_PATH`.)

**What breaks if not done.** Vault appends from session activity (log.md, retro outputs, ingest results) silently queue or drop, and the vault drifts from canonical state. Either path closes the issue; status quo is the worst option — we keep paying the queue+replay cost without resolving it.

---

## 4. Triage 8+ orphan uncommitted changes in working trees · WILL NOT SELF-HEAL

**Status:** Open · ~60 days
**Source:** Impediment #59

**Fix.** Run `git status` on `main`; for each tracked-but-uncommitted file, attribute it to a Linear issue (commit with `Fixes THR-XX`) or `git checkout --` discard. Untracked files: same triage — `git add` + commit if intentional, `rm` if not.

**What breaks if not done.** This is the upstream cause of the Codex dirty-worktree bounces (~50% of automation slots historically wasted). [THR-277](https://linear.app/threadbare/issue/THR-277) makes pickup resilient *to* dirty state via worktree isolation, but it doesn't clean the state. Until the orphan changes are triaged, the dirty worktree stays dirty.

**Mitigated by:** [THR-277](https://linear.app/threadbare/issue/THR-277) — worktree isolation in pull-work routes pickup around dirty state while orphan triage is pending.

---

## 5. Confirm whether Linear-from-scheduled-context is now reliable · INFORMATIONAL

**Status:** Open question · Linear MCP was reachable from the scheduled retro context on 2026-06-23 (first time in four retros)
**Source:** This retro (Ask #4)

**Fix.** Confirm whether the Linear MCP is dependably reachable from scheduled/autonomous contexts. If reliable, Cowork can self-file the small encodable experiments (dashboard-commit wiring, etc.) instead of asking, and drop the "needs-Linear-verification" hedge. If it's intermittent, say so and the hedge stays the norm.

**What breaks if not done.** Scheduled Cowork/retro runs keep hedging every conclusion that depends on live queue state, and keep deferring small self-fileable fixes to a human instead of filing them directly.

---

## Resolved this period

- **2026-06-23 — GitHub Pro / branch protection resolved** (was item #4 in the prior seed; impediment #56). Branch protection is now active on `main` with `Test · Typecheck · Build` as a required status check (THR-282 shipped 2026-04-30). The "CI stays advisory because branch protection can't be enforced" concern is closed. To be removed on next retro day.

---

*This file is regenerated by Cowork on retro day from `Docs/impediments.md`, the active retro, and any newly filed Christian-owned impediments. Manual edits between retro days are fine — they'll be preserved as long as the item is still open. To force a refresh between retros, run `/retrospective` or ask Cowork directly: "rebuild user-actions."*
