# Linear MCP Rate Limits — Query Dedupe & Backoff

> **Date:** 2026-04-23
> **Type:** Process infrastructure (coordination protocol tuning)
> **Status:** Plan — ready for executor
> **Related:** THR-164 (coordination workflow tightening), impediments #48, #49

---

## Problem

Every agent that talks to Linear (Cowork, Claude Code, Codex) has started hitting Linear MCP rate limits. The limit itself is not documented in the MCP tool descriptions, but user-visible symptom is: tool calls fail or stall, sessions lose time retrying, and multiple agents compound the problem because their protocols were designed for correctness under concurrency, not for query economy.

There is no prior impediment logged for this — it is newly-visible friction. This plan adds one (impediment #59 proposed) alongside the protocol edits.

## Diagnosis

Five patterns, ranked by contribution to call volume:

### 1. Session-start fan-out (biggest single contributor)

The Cowork session-start checklist in `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Cowork Session Start issues five separate `list_issues` calls (In Design, Implementation Planning, Ready for Dev, Todo priority:1, Todo priority:2) plus an implicit `list_projects`. Every Cowork session opens with 6+ Linear requests in the first ~30 seconds. Claude Code and Codex each fire at least 2 `list_issues` on their pickup cycles (In Dev + the handoff queue). With two pollers (CC + Codex) hitting the API on the hour plus interactive Cowork sessions, the first minute of each hour is a query storm.

### 2. Per-state loops encoded into plans

`Docs/plans/2026-04-23-opus-46-vs-47-label-split.md` (THR-234) instructs the executor to run `list_issues label:"model:opus"` **five times** (once per workflow state). This is a common pattern because the MCP does not accept `state: ["A", "B"]` — authors substitute a loop. The draft weekly-hygiene skill (`Docs/drafts/weekly-project-hygiene-SKILL.md`) does the same thing (7+ state queries per run) and additionally runs a "duplicate check" that issues one `list_issues project:X state:"Done"` per suspect title.

### 3. Verify-after-write amplification (Rule 7)

Every `save_issue` that changes state or assignee is followed by a `get_issue`. This is load-bearing under impediment #48 (silent dropped writes) and must not be weakened. But a typical Cowork session moving 3–4 issues through states racks up 6–8 calls from this alone, and the pull-work skill adds another `save_issue → get_issue` round-trip for every pickup.

### 4. Hourly pollers overlapping

CC and Codex both poll "on an hourly cycle" per `Docs/plans/2026-04-13-linear-coordination-protocol.md` and `Docs/plans/2026-04-19-codex-automation-prompt.md`. Cadence is documented as hourly but the minute offset is not. Both pollers firing at :00 is plausible and produces the spike pattern above. Staggering reduces peak rate without changing total volume.

### 5. Greedy pagination and comment fan-out

`list_issues` returns up to 250 per call (default 50). Queries that iterate with `cursor` without a stop condition walk all pages even when the caller only needs the top few. Rule 4 ("read the most recent comment first") is typically served by `list_comments(limit: 5)`, but the Reopened rule says "read all comments back to the original handoff" — a long comment chain produces unbounded paginated calls.

## Solution — Conservative Dedupe & Backoff

Four mechanical changes, in descending order of expected relief. No webhook architecture, no protocol weakening — Rules 1, 2, 3, 7 stay intact.

### Change A — Single board-scan helper (replaces per-state loops)

Replace multi-state `list_issues` fan-outs with **one** `list_issues` call that returns everything needed, bucketed client-side.

The MCP schema supports `orderBy: "updatedAt"` and `limit: 250`. A single call ordered by `updatedAt` descending, with `includeArchived: false`, returns the working-set of recently-touched issues. The caller then filters in memory by `status.name` (available on every returned issue). Five state-specific calls collapse to one.

Where to apply:

- **Cowork Session Start** (5 calls → 1): `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)`. Bucket by `status` in memory. Replace the "Query Linear: `list_issues state:X`" list with "Run one board-scan call, then slice."
- **THR-234 label-split plan** (5 calls → 1): `list_issues(label:"model:opus", limit:250)`. Filter states in memory.
- **Weekly hygiene SKILL draft** (7+ calls → 1–2): same pattern.
- **CC pickup / pull-work skill Step 1** (2 calls → 1): `list_issues(team:"Threadbare", limit:250)` and bucket to get both "In Dev assignee:me" and "Ready for Dev assignee:null" from the same result set. (Keep the explicit `assignee:null` semantics — just apply them client-side against the single result.)

### Change B — Stagger hourly pollers

Codify minute offsets so CC and Codex never fire at the same instant:
- **CC hourly poll:** :00 of each hour
- **Codex hourly poll:** :30 of each hour

Update `Docs/plans/2026-04-19-codex-automation-prompt.md` and the relevant CC automation scheduler. This spreads the peak and leaves 30 minutes for Cowork interactive work to clear before the next poller fires.

### Change C — Rate-limit backoff guard in pull-work skill

Add a `Step 0` to `.claude/skills/pull-work/SKILL.md` (and its `.agents/` mirror):

> **Step 0 — Rate-limit guard.** If any Linear MCP call returns a rate-limit error (HTTP 429 or equivalent MCP error surface), pause the session for 2 minutes, retry once, then if still limited log an impediment in `Docs/impediments.md` via `impediment-reporter` and exit cleanly without claiming. Do not retry in tight loops — each retry makes the problem worse.

Same note goes into the Codex automation prompt.

### Change D — Document the limit in Known Linear MCP Limitations

Add a third bullet to the "Known Linear MCP Limitations" section in `Docs/plans/2026-04-13-linear-coordination-protocol.md` capturing: (a) the observed rate limit, (b) the session-start pattern that triggers it, (c) the board-scan workaround, (d) the impediment number once logged.

---

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | No magic numbers introduced. Poller minute offsets (:00, :30) are documented in plain markdown; tunable by editing docs. |
| 2. Inspectability | PASS | Rate-limit events get logged to `Docs/impediments.md` via existing skill; no new trace surface needed. |
| 3. Determinism | PASS | No engine PRNG touched. |
| 4. Fail-soft | PASS | Step 0 guard exits cleanly rather than hammering. See fail-soft table. |
| 5. Narrative | PASS-with-note | N/A — process change, no game content touched. |
| 6. Additive | PASS | Adds a Step 0; edits existing bullets. No deletions of rules. |
| 7. Performance | PASS | Reduces external-API call volume; no engine perf impact. |

## Three-pillar audit

- **Engine pillar — N/A.** Rationale: no engine code edited. The fix is exclusively to agent-facing docs (CLAUDE.md, coordination protocol, pull-work skill, Codex automation prompt) and the executable behaviour changes are in how agents call the Linear MCP, not in the simulator.
- **Content pillar — N/A.** Rationale: no game content or prose touched.
- **UI pillar — N/A.** Rationale: no player-facing UI. The "interface" affected here is the agent-to-Linear-MCP interface, which is not a user surface.
- **Wiring pillar — required.** See the cross-reference action items below — same guidance needs to land in three places (CLAUDE.md, coordination protocol, pull-work skill) plus the Codex automation prompt, or agents will only learn it from whichever doc they happen to read first.

## Fail-soft table

| Failure | Fallback |
|---------|----------|
| Rate-limit error mid-query | Step 0 guard: pause 2 min, retry once, then log impediment and exit cleanly. |
| Single board-scan returns >250 issues | Accept the truncation — oldest `updatedAt` issues drop off first; all active-workflow states comfortably fit under 250 in current state (verified: current Threadbare issue count across all started states <120). If volume grows, bump to paginated single-cursor walk with an explicit stop at `limit: 500`. |
| Stagger misconfiguration (both pollers at :00) | Queries still succeed; just loses the staggering benefit. Monitor via impediment log. |
| Agent reads CLAUDE.md but not the protocol doc | Three cross-referenced surfaces (CLAUDE.md, coordination protocol, pull-work skill) all point to the same bullet — no single-doc blind spot. |

## Constants

None. Poller minute offsets (:00, :30) are documented values, not runtime constants. If future tuning is needed, a config file can be added; premature here.

---

## Action items

### Engine action items

N/A — infrastructure only. Rationale above.

### Content action items

N/A — infrastructure only. Rationale above.

### UI action items

N/A — infrastructure only. Rationale above.

### Wiring action items (edits to docs and skills)

1. **Edit `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Cowork Session Start (lines 265–269).** Replace the five-item bulleted list with a single board-scan instruction:

   ```markdown
   ### Cowork Session Start
   1. **Board scan (single Linear MCP call):** `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)`. Bucket results in memory by `status` to cover In Design, Implementation Planning, Ready for Dev, and Todo (priority 1 + 2) at once.
   2. Check if any "Ready for Dev" items have been sitting >2 sessions → flag to user.
   ```

2. **Edit `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Known Linear MCP Limitations.** Append a third bullet:

   ```markdown
   - **Linear MCP has a rate limit that is easy to hit with the default protocol.** Session-start fan-outs, per-state loops in plan docs, and overlapping CC + Codex hourly pollers compound into a query storm. **Workaround:** (a) collapse multi-state scans into a single `list_issues(limit:250)` call with client-side bucketing by `status`; (b) in pull-work / Codex pickup, guard the first call with a rate-limit check and back off 2 min on 429 before retrying once; (c) CC polls at :00, Codex polls at :30 — never both at the same instant. See `Docs/plans/2026-04-23-linear-mcp-rate-limits.md` for the full rationale.
   ```

3. **Edit `.claude/skills/pull-work/SKILL.md` — insert Step 0 before Step 1** and update Step 1 to use the single-scan pattern:

   ```markdown
   ### Step 0 — Rate-limit guard

   If any Linear MCP call in this session returns a rate-limit error (HTTP 429 / MCP rate-limit response), pause 2 minutes, retry once, then if still limited log an impediment via `impediment-reporter` and exit cleanly without claiming. Do not retry in tight loops.

   ### Step 1 — Single board scan

   Fire one call: `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)`. In memory, bucket the response by `status` to produce:
   - The "In Dev" slice (filter by assignee:"me" for WIP check)
   - The "Ready for Dev" slice (filter assignee:null for pickup candidates)
   - The "In Dev" slice across all assignees (for cross-executor parallel check)

   Sort the Ready-for-Dev candidates by priority in memory (impediment #49 rejects `orderBy:priority` at runtime); oldest `createdAt` is tie-break. Pick the top.
   ```

4. **Mirror the Step 0 + Step 1 changes into `.agents/skills/pull-work/SKILL.md`** so the hook in THR-192 doesn't flag skill drift between the two trees. (The npm run check:skill-sync hook enforces this.)

5. **Edit `Docs/plans/2026-04-19-codex-automation-prompt.md` § Session checklist.** Change items 2 and 3 (the two-call WIP + pickup pattern) to the single board-scan pattern, and add a rate-limit guard before item 2. Add a new operational note under "Operational notes for the human" codifying the :30 offset:

   ```markdown
   **Cadence minute offset:** Schedule Codex at :30 of each hour. Claude Code polls at :00. Never both at the same instant.
   ```

6. **Edit `Docs/plans/2026-04-23-opus-46-vs-47-label-split.md` § Backfill audit.** Replace the "Run `list_issues label:"model:opus"` with each of these states individually" instruction with a single `list_issues(label:"model:opus", limit:250)` call and client-side state filtering. THR-234 has not yet shipped so this edit updates the plan before execution.

7. **Edit `Docs/drafts/weekly-project-hygiene-SKILL.md`** — rewrite the per-state queries to a single board-scan plus in-memory bucketing. The skill is in `drafts/` and not installed yet; editing it now prevents the pattern from shipping.

8. **Edit `CLAUDE.md` § Session Workflow.** Where the Cowork bullet lists `list_issues state:"In Design"` / `Implementation Planning` / `Ready for Dev` / `Todo`, replace with a pointer to the Cowork Session Start § in the coordination protocol doc (now single-call) to avoid drift between the two files.

9. **Log impediment #59 in `Docs/impediments.md`** with category `api-quirk`, impact `M`, description pointing to this plan doc. Use the `impediment-reporter` skill format.

### Grey zones / CC decisions needed

- **Whether to bump `limit` above 250.** The MCP schema max is 250. Current Threadbare active-workflow issue count is <120, so 250 is safe. If the project grows beyond that, the single-scan pattern will need pagination. Not in scope for this plan; revisit when the count approaches 200.
- **Whether the `:00 / :30` split should be configurable.** For now it's documented-in-prose. If scheduling is ever orchestrated from a repo file, promote to config — but today CC and Codex are scheduled on the user's machine, not in the repo.
- **The `includeArchived: false` default.** Linear MCP defaults this to `true`, which pulls in archived issues and inflates payload. Explicitly set `false` in every board-scan call.

### Files changed by Cowork

- `Docs/plans/2026-04-23-linear-mcp-rate-limits.md` (this plan, new)

### Files executor will edit

- `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- `.claude/skills/pull-work/SKILL.md`
- `.agents/skills/pull-work/SKILL.md`
- `Docs/plans/2026-04-19-codex-automation-prompt.md`
- `Docs/plans/2026-04-23-opus-46-vs-47-label-split.md`
- `Docs/drafts/weekly-project-hygiene-SKILL.md`
- `CLAUDE.md`
- `Docs/impediments.md`
- `Docs/changelog.md` (append closing row)
- `Docs/project-history.md` (append one-line entry)
- `Docs/project-status.md` (≤60-line refresh)

No source code changes. No tests affected directly; CI should still run to confirm doc changes don't break any tooling.

---

## Non-goals

- **Webhooks.** Replacing polling with Linear webhooks → event queue is the obvious longer-term answer; deferred to a separate research issue (file if rate limits persist after this lands).
- **Weakening claim-before-read / verify-after-write (Rules 1, 7).** Those are load-bearing for correctness under concurrency. Keep.
- **Eliminating the `assignee:null` filter (Rule 2).** Same. Apply client-side against the single scan result.
- **Manual Done transitions or skipping the `Fixes THR-XX` merge path.** Rule 3 stays.
- **Reducing the `Reopened` label comment scan.** That rule is rare-fire; not a hot path.

## Coordination notes

Acceptance is binary — each action item is verifiable by reading the target file. The rate-limit relief is measurable by watching for 429 errors in subsequent sessions; if they persist, escalate to the webhook path as a follow-up.

After this plan lands, the next Cowork session should notice roughly a 5× drop in `list_issues` calls at session start, and CC/Codex pickup cycles should drop from ~3 calls to ~1 (excluding the mandatory claim→verify pair, which stays at 2).
