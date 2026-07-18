> **title:** Pure Claude Code Migration — move Threadbare off Cowork — THR-648–655
> **linear_issue:** THR-648 – THR-655 (project: [Pure Claude Code Migration](https://linear.app/threadbare/project/pure-claude-code-migration-4fcc99c4ffe3); created 2026-07-17 after Linear reauth)
> **author:** Cowork
> **created:** 2026-07-17
> **three_pillars:** Engine `N/A — process/infrastructure change, no src/ touched` · Content `N/A — same` · UI `N/A — same`

# Pure Claude Code Migration — THR-648–655

*Consolidate all Threadbare agent work — design and execution — into Claude Code, retiring Cowork from the Threadbare workflow and every piece of machinery that exists only to bridge the two. **Scope guard (Christian, 2026-07-17): Threadbare only — Cowork itself and Christian's other Cowork projects, spaces, and personal scheduled tasks are untouched.***

## Why this is load-bearing

Roughly half of the ~192 logged impediments mention Cowork, sandbox, VM, mounts, or MCP fallbacks. The 2026-07-03 retro's conclusion: the executor pipeline is healthy; the remaining friction is "peripheral hygiene" — and nearly all of it is compensation for the Cowork/CC split. Concretely: the `plan-pending-commit` label + hourly `flush-plan-docs` + auto-flush PRs + `flush-close-guard.yml` exist because Cowork can't commit; the dual skill trees + sync hook + `check:skill-sync` (≈28 consecutive pickup-tax recurrences) exist because two runtimes read different paths; VM sync corruption has hit twice (#11 working-tree corruption, 2026-07 `.git/config` truncation); the "Known Sandbox Limitations" CLAUDE.md section taxes every session's context. Christian confirmed 2026-07-17 (chat) that Cowork's interface value for his usage is marginal — the "chat-only, plain-language" directive (THR-608) is a communication register, not an app requirement, and survives in CC interactive sessions. Decision: **Option B, pure Claude Code**, phased over one week. Precedent: retiring the Codex lane (THR-486) structurally closed its entire impediment cluster; Cowork-as-repo-writer is the same class of lane.

## Settled decisions (chat, 2026-07-17)

- **Scope:** Threadbare only (Christian, 2026-07-17). Cowork remains installed and in use for Christian's other projects; nothing outside the Threadbare workflow (its scheduled tasks, repo machinery, and this space's role) is touched. Where this plan says "retire Cowork," read "retire Cowork's role in Threadbare."
- **Target state:** all Threadbare agent work in Claude Code. Interactive CC sessions for Christian (design conversations, reviews, verdicts — plain language, no diffs, per THR-608). Scheduled CC lanes for automation. Linear remains the queue; CI-gated merge remains the Done gate.
- **Project home:** new Linear project **"Pure Claude Code Migration"**.
- **Cutover style:** phased, one week. CC equivalents land and are verified before Cowork tasks are disabled; machinery deletion is last.
- **Inbox replacement:** `keep-work-flowing`'s chat brief becomes a CC-maintained briefing file (`Design/briefing.md`) refreshed hourly, plus the existing `Design/user-actions.md`. Christian reviews via a morning interactive CC session. Evidence that chat-surfacing wasn't out-performing this: asks staled across 3 retros regardless of surface.
- **Design governance is unchanged.** Role separation (design vs execution) becomes a session-type distinction in CC (a `design-session` skill), not a runtime distinction. Intent-judge, design-audit-pipeline, three-pillar rule, canon pages all stay.

## Engine pillar

Engine: N/A — process/infrastructure change; no engine code touched.

## Content pillar

Content: N/A — no game content touched.

## UI pillar

UI: N/A — no player-facing surfaces touched. Browser-verify exempt: process/docs/skills/workflows only.

## Migration phases

### Phase 0 — Foundations (Day 1)

1. Create Linear project **Pure Claude Code Migration** + the issues in the breakdown below.
2. **Export Cowork memory to the repo.** The Threadbare space's Cowork memory (60+ durable decision/preference facts) becomes invisible to the CC-only workflow once Threadbare sessions stop running in Cowork. Distill into `Docs/ways-of-working.md` (working-agreement facts) and confirm nothing load-bearing exists only in Cowork memory. CC's auto-memory picks up from the repo doc.
3. Snapshot the current scheduled-task registry (both runtimes) into the migration issue for rollback reference.

### Phase 1 — Build CC equivalents (Days 1–3)

4. **`design-session` skill in `.claude/skills/`.** Encodes the current Cowork role: plan-doc authoring per governance checklist, canon-page Step 0, Linear state transitions, handoff comment format. Key difference: the session commits plan docs directly via a `docs/plan-*` PR (CI-gated, merged immediately) — no label, no hourly flush, no auto-flush fallback. Update `Docs/plans/2026-04-13-linear-coordination-protocol.md` in the same PR: "Cowork" role sections become "design session (CC)".
5. **`keep-work-flowing` CC equivalent.** Hourly headless CC run (reuse the :45 slot): queue nudges, stale-issue refresh, freshness ping (retro E1), writes `Design/briefing.md` (things needing Christian, in plain language) and refreshes `Design/user-actions.md`. No chat surfacing — the briefing file is the inbox.
6. **Skill-tree audit.** For each `.agents/skills/`-only skill, decide port / retire: `design-council` (port — used), `playtest-interface` (port after verifying browser MCP works from CC; see fail-soft), `content-catalog-manager` (port if used in last 60 days, else retire), `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli`, `obsidian-markdown` (retire — CC reads/writes the vault via filesystem directly; `vault-log` already has the filesystem path via `OBSIDIAN_VAULT_PATH`).

### Phase 2 — Parallel run (Days 3–5)

7. **One full design cycle through the CC path:** pick a real small design task; run it as a CC `design-session`; verify plan doc → PR → CI → merge → Ready for Dev → hourly pickup → Done, with zero Cowork involvement. This is the go/no-go gate for Phase 3.
8. Verify `Design/briefing.md` updates hourly and reads correctly for two consecutive days.
9. Cowork tasks stay enabled during this window; both paths write to the same Linear queue (WIP rules unchanged).

### Phase 3 — Cutover and demolition (Days 5–7)

10. **Disable Cowork scheduled tasks:** `keep-work-flowing`, `weekly-workflow-retro`, plus the already-disabled `daily-backlog-grooming` / `weekly-project-hygiene` (recreate any still-wanted ones as CC tasks). `weekly-invoice-check` is not Threadbare scope — Christian decides its home separately.
11. **Delete the flush pipeline:** `flush-plan-docs` scheduled task + skill, `plan-pending-commit` label and all CLAUDE.md references, `.github/workflows/flush-close-guard.yml` (its threat vector no longer exists).
12. **Collapse the skill trees:** move ported skills into `.claude/skills/`, delete `.agents/skills/`, delete `scripts/check-skill-sync.js` + the THR-192 pre-commit hook + `check:skill-sync*` npm scripts. THR-540 (skill-sync gitignore fix) closes as won't-fix/moot.
13. **CLAUDE.md rewrite** (coordinate with THR-575's diet if still open — mutex): delete "Cowork vs Claude Code" section (replace with a short "Session types: design vs execution" paragraph), delete Cowork-specific Known Sandbox Limitations entries (keep any that apply to CC automation sandboxes), update the scheduled-task table, update Session Workflow (remove Cowork board-scan and plan-doc-label steps), update Skill Tree Layout section to single-tree.
14. **Close impediment classes** in `Docs/impediments.md`: mount corruption (#11 + config truncation), flush false-close family (#162), skill-sync family, Obsidian-MCP-unreachable family — each with a one-line "structurally closed by Cowork retirement" note.

### Rollback

Phases 0–2 add things; nothing is removed until Phase 3, and Phase 3 runs only after the Phase 2 go/no-go passes. Rollback at any point before Phase 3 = disable the new CC tasks and continue as-is. After Phase 3, rollback = re-enable Cowork tasks and `git revert` the demolition PRs (all deletions land as ordinary reverted-able commits).

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| N/A — process change; no engine modules | — | — | — | — | — |

Process wiring instead: `design-session` skill → Linear states → `tb-opus-pickup` (unchanged); `keep-work-flowing` CC task → `Design/briefing.md` + `Design/user-actions.md` → Christian's morning session.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| Parallel-run window | 2 days green | Phase 2 go/no-go before any deletion |
| Briefing refresh cadence | hourly (:45) | `Design/briefing.md` update frequency (reuses retired Cowork slot) |
| Post-cutover observation | 1 week | Window before declaring impediment classes closed (Phase 3 step 14 lands after it) |

## Tracing

N/A — no engine traces. Process observability: scheduled-task heartbeats (`lastRunAt`) for the new CC tasks; `Design/briefing.md` carries a generated-at timestamp so staleness is self-evident.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| CC scheduled run can't reach Linear | Known-good: `LINEAR_API_KEY` confirmed set 2026-06-23 and CC lanes ship daily. If it regresses, briefing file logs the failure loudly; Cowork tasks still enabled until Phase 3. |
| `playtest-interface` browser MCP unavailable from CC | Do not retire the Cowork copy until a CC run passes; if blocked >1 week, keep skill parked in repo and file a follow-up — not a migration blocker. |
| Christian misses briefing-file asks | Same failure mode as today (asks staled across 3 retros in chat too). If worse after 2 weeks, add a notification channel (email via connector) — additive fix, no rollback needed. |
| Design-session PR blocked by red CI on unrelated main breakage | Same exposure as any docs PR today; wait for green or land via retro process. No special handling. |
| THR-575 (CLAUDE.md diet) collides with Phase 3 step 13 | Mutex declared in coordination block; whichever lands second rebases. |

## Three-pillar check

- [x] Engine pillar present (N/A with rationale)
- [x] Content pillar present (N/A with rationale)
- [x] UI pillar present (N/A with rationale)
- [x] Wiring section connects them (process wiring)

## Vision audit

- [x] This plan does not contradict any Vision premise — it touches ways-of-working only; no game-design surface.

## Rulebook impact

- [x] This plan does not change a rule of play.

> Brainstorm companion: `Docs/plans/2026-07-17-pure-claude-code-migration-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Process constants named above; no magic numbers in code (no code). |
| 2. Inspectability | PASS with note | No engine traces; process observability via task heartbeats + timestamped briefing file. |
| 3. Determinism | PASS | N/A — no random code. |
| 4. Fail-soft | PASS | Fallback table covers auth, browser MCP, inbox, CI, and mutex risks; nothing deleted before its replacement is verified. |
| 5. Narrative over mechanical perfection | PASS | N/A to game narrative; frees agent time for content work. |
| 6. Additive over destructive | PASS with note | Deliberately destructive in Phase 3 — but only after Phase 2 verification, and every deletion is a revertable commit. The destruction *is* the value. |
| 7. Performance budget | PASS | Removes hourly flush task + per-session CLAUDE.md token tax; net negative overhead. |

## Done when

- [ ] One design task has flowed design → merge → auto-close entirely inside CC (Phase 2 gate evidence linked)
- [ ] All Cowork scheduled tasks disabled; CC replacements have ≥3 days of heartbeats
- [ ] `flush-plan-docs`, `flush-close-guard.yml`, `plan-pending-commit`, `.agents/skills/`, skill-sync scripts/hook all deleted from main
- [ ] CLAUDE.md contains no Cowork role/limitation content; scheduled-task table matches reality
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` pass on every landing PR
- [ ] Closing commits include `Fixes THR-XX` (per-issue) — and in PR bodies
- [ ] Browser-verify exempt: process/docs/skills change, no UI surface

## Issue breakdown (create under project "Pure Claude Code Migration")

| # | Title | Phase | Depends on |
|---|-------|-------|-----------|
| 1 | Export Cowork memory + working agreements to `Docs/ways-of-working.md` | 0 | — |
| 2 | `design-session` skill + coordination-protocol update (direct plan-doc PR flow) | 1 | — |
| 3 | `keep-work-flowing` CC equivalent → `Design/briefing.md` (+freshness ping, retro E1) | 1 | — |
| 4 | Skill-tree audit: port/retire `.agents/skills/`-only skills | 1 | — |
| 5 | Parallel-run verification: one full design cycle through CC path (go/no-go gate) | 2 | 2, 3 |
| 6 | Cutover: disable Cowork tasks, register CC tasks, update task table | 3 | 5 |
| 7 | Demolition: flush pipeline, skill-sync, `.agents/`, CLAUDE.md rewrite, close impediment classes | 3 | 6 |
| 8 | Post-migration retro (1 week after cutover): confirm impediment classes stay closed | 3 | 7 |

## Coordination block

**Suggested model:** opus — cross-cutting workflow surgery touching CI workflows, hooks, skills, and CLAUDE.md; misjudged deletions are expensive.

**Parallel-safe with:** all game-feature work (engine/content/UI) — zero `src/` overlap.

**Mutex with:** THR-575 (CLAUDE.md diet) — both rewrite CLAUDE.md; whichever is second rebases. Also mutex with any open issue editing `.claude/skills/` shared skills during Phase 3 step 12.

**Files to touch:**
- Create: `.claude/skills/design-session/SKILL.md`, `Design/briefing.md`, `Docs/ways-of-working.md`
- Edit: `CLAUDE.md` (role/sandbox/task-table/session-workflow sections), `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- Delete (Phase 3 only): `.github/workflows/flush-close-guard.yml`, `.claude/skills/flush-plan-docs/`, `.agents/skills/` (after porting), `scripts/check-skill-sync.js` + hook + npm scripts

## Notes for the executor

- **Do not start Phase 3 without the Phase 2 go/no-go evidence** (linked in issue 5). The whole plan's safety comes from deletion-last.
- The authoring Cowork session could not reach Linear (connector unauthenticated) — project + issues must be created by the first CC session that picks this up, or by Christian's next authenticated session. This plan doc was committed via a direct PR rather than the flush pipeline for the same reason (fitting, given the subject).
- Design-audit-pipeline (Step 8.6) intentionally skipped: all three audit axes (NFP/pillar/Vision) are N/A-with-rationale for a pure process change; run `/design-audit` post-hoc if desired.
- `weekly-invoice-check` and other personal (non-Threadbare) Cowork tasks are out of scope — flag them to Christian at cutover, don't touch them.
- When closing impediment classes (step 14), append closure notes; never rewrite history in `Docs/impediments.md`.

## Forked-audit verdicts

<!-- design-audit-pipeline intentionally not run — see Notes for the executor -->

### Intent-judge verdict (Step 8.5)

**Allow** — 2026-07-17, Opus judge, 0 GAPs / 0 VIOLATIONs across all 10 dimensions. High-risk auto-Escalate overridden by valid explicit user sign-off (verbatim "yes" + two AskUserQuestion confirmations, same day). Carried-forward conditions: (1) the Phase 2 go/no-go gate is what keeps the sign-off valid through Phase 3 demolition — executor must not start Phase 3 without linked Phase 2 evidence, and the demolition list should be surfaced to Christian in plain-language chat (THR-608) before landing; (2) the inbox pull-model regression is the monitored risk for the post-cutover retro (issue 8); (3) first CC pickup must create the Linear project + issues before touching any work.
