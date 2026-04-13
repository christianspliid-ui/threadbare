# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.
>
> **IMPORTANT:** When you complete a handover entry, you MUST also update the item's state in `.planning/BACKLOG.md` to `✅`. BACKLOG.md is the single source of truth — see `Docs/cowork-ways-of-working.md` → "Unified Kanban".
>
> **History:** Completed entries older than the current session are archived in `HANDOVER_HISTORY.md`.

---

### 2026-04-13: TB-129 · Definition of Done — Hook Enforcement — Plan Ready

**Context:** Designed a 3-gate Claude Code hooks system to hard-enforce the Definition of Done checklist. Currently agents skip doc updates, test runs, and kanban state changes because CLAUDE.md instructions are conventions, not mechanisms. Hooks make compliance automatic — exit code 2 blocks the action and tells Claude what to fix.

**What Cowork already did:**
- Wrote design doc: `Docs/plans/2026-04-13-definition-of-done-hooks-design.md` (full script contents, settings.json config, rollout plan)
- Added TB-129 to BACKLOG.md at `📐▶` (plan done, ready for dev)

**Action for Claude Code:**
- [ ] Create `.claude/hooks/` directory and `.claude/hooks/lib/` subdirectory
- [ ] Create `.claude/hooks/detect-cowork-session.sh` — SessionStart Cowork detection beacon
- [ ] Create `.claude/hooks/cowork-role-gate.sh` — Gate 4: block code writes in Cowork
- [ ] Create `.claude/hooks/pre-commit-gate.sh` — Gate 1: tsc + tests + untracked imports
- [ ] Create `.claude/hooks/pre-push-gate.sh` — Gate 2: doc updates + vite build
- [ ] Create `.claude/hooks/session-stop-gate.sh` — Gate 3: loose ends check
- [ ] Update `.claude/settings.json` — add full `hooks` config (exact JSON in design doc, includes SessionStart + all 4 PreToolUse matchers + Stop)
- [ ] Make all `.sh` files executable (`chmod +x`)
- [ ] Test: attempt a commit without running tests — verify it blocks
- [ ] Test: attempt a push without updating changelog — verify it blocks
- [ ] Commit, push, update docs per DoD (the hooks will enforce this!)
- [ ] Mark TB-129 as `✅` in BACKLOG.md, archive to BACKLOG_HISTORY.md

**Phase 1.5 (Cowork tests — done in a Cowork session after hooks ship):**
- [ ] Attempt `Write` to `src/test-gate.ts` — does it block?
- [ ] Attempt `Bash` with `git commit -m "test"` — does it block?
- [ ] If blocked → Gate 4 works, log success
- [ ] If not blocked → hooks don't fire in Cowork, log as impediment, Gate 4 is convention-only for now

**Files changed:** `Docs/plans/2026-04-13-definition-of-done-hooks-design.md` (new + updated), `.planning/BACKLOG.md` (TB-129 added), `.planning/HANDOVER.md` (this entry)

**Note:** The design doc contains complete script contents for all 5 hook scripts — Claude Code should use them as-is for Phase 1, then tune during the 3-5 session burn-in period. Bypass env vars (`SKIP_DOD_TESTS=1`, `SKIP_DOD_DOCS=1`) exist for edge cases.

---

### TB-077 Layers 2-3 — Goal Edge + Active Encounter Projection (deferred)

**Context:** All 4 sub-phases of Layer 1 complete. Layers 2 (goal edge replacing `movementState.targetEncounterId`) and 3 (active encounters as transient graph nodes) are deferred until UnifiedAction migration settles.

**Design doc:** `Docs/plans/2026-03-29-graph-native-encounter-lifecycle-design.md` — see Decisions 3 and 4.

---

## Completed

_No completed entries — all archived to `HANDOVER_HISTORY.md` on 2026-04-13._
