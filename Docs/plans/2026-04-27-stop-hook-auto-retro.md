# Stop-Hook Auto-Retro — Append friction to impediments.md on session end

**Linear:** [THR-214](https://linear.app/threadbare/issue/THR-214)
**Project:** Continuous Improvement
**Date:** 2026-04-27
**Status:** Design complete; ready for executor pickup
**Source:** Issue body (THR-214) is the primary brief; this doc adds NFP/fail-soft/wiring/constants required by the design-governance checklist.

---

## 1. Summary

Install a Claude Code session-end hook that prompts the agent for a short reflection ("what slowed you down?"), appends non-empty entries to `Docs/impediments.md`, and conditionally drafts a retro stub when friction is significant. Closes the gap between "skill exists" (`impediment-reporter`, `retrospective`) and "skill is used."

Cowork-PM written; this is a thin wrapper around two skills already battle-tested in the repo. No new domain logic.

## 2. Why now

Three weeks of impediment data show under-reporting: the log shows ~3–5 entries per week against an observed friction surface several times that. The drift scan (THR-273, shipped 2026-04-26) consumes the impediments log indirectly via the retro pipeline. Starving that pipeline starves Continuous Improvement's ability to see itself.

This is also the highest-WSJF item among the THR-260 deferral cohort:

| Issue | Cost of Delay | Job Size | WSJF |
|---|---|---|---|
| THR-214 (this) | M-H — every silent-friction session degrades the loop | S | **HIGH** |
| THR-215 (memory grooming) | M | XS | HIGH |
| THR-238 (orchestrator registry) | M | M-L | MEDIUM |
| THR-265 (skill freshness) | L (until drift-scan S5 lands) | M | MEDIUM |

Picking THR-214 first because (a) impediment-loop starvation has compounding harm and (b) it's a thin, clearly bounded wrapper that fits Sonnet capacity well.

## 3. Three-pillar status

**Engine: N/A.** Content: N/A. UI: N/A. This is process/tooling infrastructure (per the design-governance N/A-with-rationale rule). The hook writes markdown into the repo; no in-game surface, no engine systems, no template content. The same explicit-N/A pattern was used by THR-260 / first-wave (`Docs/plans/2026-04-24-codebase-health-first-wave.md` §3) and accepted at handoff.

## 4. Vision audit

No Vision premises contradicted. The hook reinforces three already-stated stances:

- `feedback_user_verdicts_agent_recommends` — hook produces *data* (impediment entries) for retros to consume; it does not auto-classify or auto-act.
- `feedback_design_expansiveness` — captures friction broadly so retros can pattern-match.
- Continuous Improvement project charter (Permanent, high-priority) — this is the hygiene compounding mechanism the project exists to install.

No edits to `Vision/` required.

## 5. Cowork's recommended answers to THR-214 open questions

The issue body lists three open questions. Cowork's recommended answers (executor may override with rationale):

### 5.1 Stop vs PreCompact hook — pick **Stop**

Stop fires once at session end (deterministic). PreCompact fires whenever Claude compacts context, which can happen mid-task — the agent's recall would be richest then but the cadence is unpredictable, and we'd risk multiple appends per session that look like duplicates.

Stop hook gives one entry per session, cleanly correlated to a session-id, easy to deduplicate in retros. Start there. If empirical data shows recall is too thin at Stop time, we can graduate to a hybrid (PreCompact captures provisional notes → Stop synthesizes one entry).

### 5.2 Per-agent vs CC-only — **CC-only in v1, Cowork/Codex as follow-ups**

The Stop hook API is well-documented for Claude Code; for Cowork (running on top of Claude Code) it should fire transparently. For Codex, the `.codex/` automation is a different surface — defer until the v1 hook is observed working in CC and we can write a parallel hook for Codex's loop.

If the executor finds the hook fires for Cowork sessions automatically (because Cowork is a Claude Code application), great — log a note in impediments and proceed. If it doesn't, a follow-up issue can extend it.

### 5.3 Stub-drafting threshold tunability — **start with default, retro decides**

Three entries OR a "significant friction" keyword (error, blocked, workaround, hack) is a reasonable v1 default. Make `STOP_HOOK_STUB_THRESHOLD` and `STOP_HOOK_FRICTION_KEYWORDS` named constants near the top of the script. The first weekly retro that sees the hook running can decide whether to tune them.

## 6. Wiring

### 6.1 Artifact flow

```
session ends (Stop event)
    ↓
.claude/hooks/stop-retro.{sh|ts} fires
    ↓
agent prompt: "What slowed you down? 1–3 entries or 'none'."
    ↓
parse response → append non-empty entries to Docs/impediments.md
                 (table row format per existing log convention)
    ↓
if entries ≥ STOP_HOOK_STUB_THRESHOLD or contains friction keyword:
    write Docs/retrospectives/YYYY-MM-DD-<session-id>.md stub
    ↓
hook exits non-blocking — session closes regardless of outcome
```

### 6.2 Files touched

- `.claude/hooks/stop-retro.{sh|ts}` — new — hook script (thin)
- `.claude/hooks/README.md` — new — what's installed, how to disable per-session
- `.claude/settings.json` (or `settings.local.json` if hook config is local) — register the Stop hook
- `scripts/session-end-retro.{ts|sh}` — new — append + stub logic (where the brain lives)
- `Docs/impediments.md` — appends only; **no schema change** — existing column structure used as-is
- `Docs/retrospectives/` — stub output directory; format mirrors existing entries

### 6.3 Existing artifact contracts to preserve

- **Impediments log column count** — 10 columns exactly (`# | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround Description | Session Context`). The hook MUST emit rows that match this structure or the next retrospective parse breaks.
- **Date format** — `YYYY-MM-DD` (existing rows use this consistently).
- **Categories** — restrict to the existing closed set (`tool-failure | api-quirk | permission | environment | skill-gap | process-friction | dependency | unclear-requirements | flaky-test | code-bug | other`). If the agent's free-text response doesn't fit, the hook defaults to `other` and notes the original phrasing in the Description column.
- **Impact codes** — `S | M | L | Blocked` (per existing comment in impediments.md line 13). The hook can ask the agent to self-rate or default to `S` and let retros re-rate.
- **`# / Count`** — `#` is the row number (auto-increment from current max). `Count` is "occurrences of this same friction"; default new rows to 1 and let the retro merge duplicates by incrementing existing rows.

### 6.4 Codesight pre-flight

None of the touched files appear in `.codesight/graph.md` high-impact list. Blast radius is local: `.claude/hooks/`, `Docs/`, `scripts/`. No imports from `src/**`. Safe to ship.

### 6.5 Skill-tree audience routing

`.claude/hooks/` is CC-only territory. No `.agents/` mirror needed in v1 (Cowork hooks are a follow-up per §5.2). No skill-sync hook trigger expected.

## 7. Constants

All tunable values named per NFP #1.

| Constant | Default | Location | Purpose |
|---|---|---|---|
| `STOP_HOOK_STUB_THRESHOLD` | 3 | `scripts/session-end-retro.*` | Number of impediment entries that triggers retro-stub drafting |
| `STOP_HOOK_FRICTION_KEYWORDS` | `["error", "blocked", "workaround", "hack"]` | same | Keywords in entries that also trigger stub drafting |
| `STOP_HOOK_PROMPT_MAX_ENTRIES` | 3 | same | Cap on entries the agent is asked to produce per session |
| `STOP_HOOK_DEFAULT_IMPACT` | `S` | same | Default impact code if agent didn't self-rate |
| `STOP_HOOK_DEFAULT_CATEGORY` | `other` | same | Default category if agent's category is outside the closed set |

## 8. Tracing

Per NFP #2.

- The impediment row IS the trace — append-only, dated, session-id-tagged.
- The retro stub IS the secondary trace — `Docs/retrospectives/YYYY-MM-DD-<session>.md`.
- Hook runtime errors logged to `.claude/hooks/stop-retro.log` (append-only) so failures are inspectable without breaking the session close.
- No new categories added to `traceBuffer.ts` — this is repo-side, not engine-side.

## 9. Fail-soft

Per NFP #4. **Critical:** the hook MUST be non-blocking. A hook crash must never prevent session close.

| Failure | Degraded behavior |
|---|---|
| Hook script throws | Log to `.claude/hooks/stop-retro.log`, exit 0, session closes cleanly |
| Agent returns empty / "none" | Append nothing; do not draft stub; exit 0 |
| Agent returns malformed response | Best-effort parse; if unparseable, write a single row with category `other` and the raw response in the Description column; exit 0 |
| `Docs/impediments.md` missing | Log warning, do not create the file (it's load-bearing for retros — surfacing the missing-file is more useful than silent recreation), exit 0 |
| `Docs/retrospectives/` missing | `mkdir -p` on first stub write |
| Append race (two sessions ending simultaneously) | Acceptable to use a simple file lock or to accept the race — duplicate rows can be merged in the next retro |
| Friction-keyword detection produces zero matches and entries < threshold | No stub drafted (intended behavior, not a failure) |

## 10. NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Five named constants in §7. |
| 2. Inspectability | PASS | Append-only impediment rows + retro stubs + hook runtime log. |
| 3. Determinism | PASS | Hook output is deterministic given the same agent response; agent responses are user-data, not hook-data. |
| 4. Fail-soft | PASS | Fail-soft table §9 covers all identified failure modes; non-blocking exit guaranteed. |
| 5. Narrative over mechanical | N/A | Process infrastructure; no in-game narrative. |
| 6. Additive over destructive | PASS | New script + new hook config + new README. The single existing-file modification (`.claude/settings.json`) is additive (registers a new hook, doesn't replace anything). |
| 7. Performance budget | PASS | Hook fires once at session end; runtime budget ~1–2s for prompt + append. No dev-loop impact. |

## 11. Done when

(Mirrors THR-214 issue body; included here for self-containment.)

- [ ] Hook registered and fires on session end in Claude Code
- [ ] `Docs/impediments.md` receives a new row after a session that hit friction
- [ ] Retro stub is drafted when threshold met (`≥ STOP_HOOK_STUB_THRESHOLD` entries OR a friction keyword present)
- [ ] Hook is non-blocking — verified by deliberately crashing the script and confirming session still closes
- [ ] `.claude/hooks/README.md` documents what's installed and how to disable per-session
- [ ] One real session-end run captured in `Docs/impediments.md` as proof-of-life — the executor's own session ending the THR-214 work is a reasonable canary
- [ ] `Docs/changelog.md` row added per Definition of Done
- [ ] Closing commit body contains `Fixes THR-214`

## 12. Out of scope (deferred)

- **Cowork/Codex parity** — v1 is CC-only. If the hook fires transparently when Cowork runs on CC, log it; otherwise, follow-up issue.
- **Hook frontmatter / freshness validation tie-in** — THR-265 (skill freshness) covers the broader question; this hook doesn't need its own freshness contract.
- **Auto-merging duplicate impediment rows** — `Count` column merges happen in `/retrospective`, not in the hook.
- **In-session friction capture** (PreCompact path) — only revisit if Stop-hook recall proves too thin.

## 13. Risks

- **Agent response quality drifts.** If agents quickly learn to type "none" reflexively, the hook becomes ceremony. Mitigation: the first three weekly retros explicitly review hook-generated rows for signal density. If signal stays high, keep. If it drops to zero, retire (the retro decides — P3 from the first-wave principles).
- **Settings.json conflict.** Other Continuous Improvement issues that touch `.claude/settings.json` would mutex with this — flagged in the coordination block. None currently in flight.
- **Append race on parallel sessions.** Acceptable; retros merge duplicates. Re-evaluate if observed in the wild.

---

*This is a thin design over a clear scope. Implementation risk is low; the win is making impediment capture automatic rather than aspirational.*
