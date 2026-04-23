# Linear Coordination Protocol

> **Date:** 2026-04-13
> **Type:** Process infrastructure
> **Status:** Active — migration complete, workflow live
> **Supersedes:** BACKLOG.md as source of truth, HANDOVER.md as handoff mechanism

---

## Problem

Two agents (Cowork and Claude Code) coordinate via markdown files: BACKLOG.md for kanban state, HANDOVER.md for handoffs, project-status.md and changelog.md for audit trail. This is convention-enforced — agents are *told* to update files but nothing prevents them from skipping steps, and nothing prevents Cowork from writing code instead of planning.

**What breaks:**
- BACKLOG.md kanban emojis don't get updated (agents forget or skip)
- HANDOVER.md entries don't get written (context lost between agents)
- No audit trail for who moved what and when
- No role enforcement — Cowork can write to `src/` because it's all just files
- No dependency tracking beyond "Depends on: TB-XXX" text in markdown

## Solution

**Linear replaces BACKLOG.md as the single source of truth.** Both agents query and update Linear via MCP. State transitions are atomic, timestamped, and auditable. Role ownership is encoded in the workflow — certain states belong to Cowork, others to Claude Code.

---

## Workflow States

Eight custom states organized into two swimlanes with two handoff lanes (one per executor agent). **Review** is a label (not a state) that can be applied to any issue in any column.

| State | Linear Type | Swimlane | Owner | Meaning |
|-------|-------------|----------|-------|---------|
| **Idea** | backlog | — | Anyone | Raw idea, not committed. Equivalent to 💡 |
| **Todo** | unstarted | — | Cowork | Committed to doing, needs design/planning. Equivalent to 📋 |
| **In Design** | started | Discovery & Design | Cowork | Cowork is actively designing or researching. Equivalent to 🎨 |
| **Implementation Planning** | started | Discovery & Design | Cowork | Cowork is writing the specific implementation plan and action items for the executor agent. Equivalent to 📐 |
| **Ready for Dev** | started | Handoff (CC) | Cowork → CC | Plan complete, handoff comment written. **Claude Code** pulls from here. |
| **Ready for Codex** | started | Handoff (Codex) | Cowork → Codex | Plan complete, handoff comment written. **Codex** pulls from here. Structurally separate from Ready for Dev so CC's hourly poll never grabs Codex work. |
| **In Dev** | started | Implementation | CC or Codex | An executor agent is implementing. Equivalent to 🏗️ |
| **Done** | completed | — | — | Shipped, documented, deployed. Equivalent to ✅ |

### Two Swimlanes, Two Handoff Lanes

**Discovery & Design (Cowork):** Idea → Todo → In Design → Implementation Planning → {Ready for Dev | Ready for Codex}
**Implementation (CC or Codex):** In Dev → Done

The two handoff states are mutually exclusive queues. Cowork picks one when moving an issue out of Implementation Planning based on which executor is the better fit (see "Choosing the executor" below). The executor agent then pulls from its own queue only.

- **CC pulls from Ready for Dev** (`list_issues state:"Ready for Dev" assignee:null`) on an hourly cycle.
- **Codex pulls from Ready for Codex** (`list_issues state:"Ready for Codex" assignee:null`) on an hourly cycle.
- Neither agent's pull query includes the other queue — queue separation is structural, not discipline-based.

**Review** is orthogonal — apply the "Review" label to any issue in any state when it needs review (design review in In Design, code review in In Dev, etc.). Filter by label to see everything awaiting review.

### Choosing the executor (Cowork decision)

When Cowork finishes an Implementation Planning doc, it picks the handoff queue:

- **Ready for Codex** when the work is pattern-following execution with low design judgment: mechanical refactors, rename/extract-helper passes, data-row additions, tests to a spec, narrow bug fixes with clear repro, boilerplate scaffolding following an established module shape, engine wiring at a pinpointed hook line.
- **Ready for Dev** when the work needs taste or judgment: prose that must meet the quality bar, new graph node/edge types, cross-cutting refactors, UI requiring design judgment, novel systems, or anything where "correct" is under-specified.

When in doubt, pick Ready for Dev — CC has higher capability ceiling and can handle Codex-shaped work fine. The split exists to make Codex's workload safe, not to offload CC.

### State Transition Rules

```
                                          ┌─→ Ready for Dev ─→ In Dev (CC)    ─┐
Idea → Todo → In Design → Implementation ─┤                                    ├─→ Done
                          Planning        └─→ Ready for Codex ─→ In Dev (Codex)┘
  │                                                                              │
  └──────────────────────── Canceled ◄──────────────────────────────────────────┘
```

**Forward-only flow.** Backward transitions (e.g., In Dev → In Design) indicate a plan gap — they should be accompanied by a comment explaining why.

**Re-routing between handoff lanes.** If Cowork routes to Ready for Codex but realizes the work is too judgment-heavy, move it to Ready for Dev (and vice versa). This is a lateral move, not a backward transition, and doesn't need justification beyond a one-line comment noting the reroute. Never have an issue simultaneously in both handoff states — Linear enforces single-state so this is structural.

**WIP limit: 1 In Dev issue per executor per project.** Each executor (CC and Codex) must finish and ship its current In Dev issue before pulling another from the same project. This prevents merge conflicts and write collisions from parallel work in overlapping files. Issues from *different* projects can be In Dev simultaneously if they don't share files, but same-project work is strictly serial per executor. **Cross-executor WIP:** CC and Codex can each have 1 In Dev issue at the same time *if* those issues are listed as `Parallel-safe with` each other and neither appears in the other's `Mutex with`.

**Handoff point:**
- **Implementation Planning** is where Cowork writes the plan. **Ready for Dev** is the CC handoff queue; **Ready for Codex** is the Codex handoff queue. Cowork moves issues to the appropriate queue when the plan is complete and the handoff comment is written.
- **Done** is the executor closeout. When the executor finishes and pushes with `Fixes THR-XX` in the commit body, merge to `main` triggers Linear's auto-close.

### Exit Criteria (per transition)

Every feature in this project touches three pillars: **Engine** (systems, tick loop, graph), **Content** (encounters, prose, templates, data), and **UI** (components, modals, HexMap, player controls). Designs and plans that cover only one or two pillars produce incomplete features that get deferred indefinitely. The exit criteria below enforce coverage of all three.

**In Design → Implementation Planning** (Cowork gate — design completeness + quality)

*Structural gate (all issues):*
- [ ] **Engine pillar** — systems design covers all engine changes (graph nodes/edges, tick phases, resolution, tracing)
- [ ] **Content pillar** — content design covers templates, prose, data tables, encounter content, attachment content
- [ ] **UI pillar** — UI design covers player-facing display, modals, panels, HexMap signifiers/overlays, player controls, event notifications
- [ ] **Wiring** — how the three pillars connect: orchestrator → UI, GameState flow, trace → debug panel, prose pipeline
- [ ] **NFP compliance table** — PASS / PASS-with-note for all 7 priorities
- [ ] **Fail-soft table** — failure cases and fallback behavior listed
- [ ] If a pillar is genuinely N/A (e.g., pure infrastructure), document why — "N/A: no player-facing UI" is fine, silence is not

*Design quality gate (player-facing features — see `Docs/plans/2026-04-16-design-quality-gate.md`):*
- [ ] **Player experience scenarios** — golden, mundane, and failure scenarios described concretely
- [ ] **Emotional architecture** — emotional read, resonant conditions, stakes framing in human terms
- [ ] **Choice and dilemma quality** — dilemma inventory, knowledge-dependent choices, agency vs. living world balance
- [ ] **System connections** — connection map, emergent possibilities, turn-pace compatibility
- [ ] **Design alternatives** — at least two alternatives with tradeoff analysis
- [ ] **UI and presentation vision** — concrete player experience, not structural descriptions
- [ ] **Depth progression** — newcomer, expert, and mastery experiences described
- [ ] **Value justification** — which core loop beat it serves, standalone value, opportunity cost
- [ ] Infrastructure-only issues may skip quality gate with explicit "N/A — infrastructure only" note

**Implementation Planning → Ready for Dev** (Cowork gate — plan completeness)
- [ ] Plan doc exists in `Docs/plans/` (named `YYYY-MM-DD-topic.md`)
- [ ] **Engine action items** — numbered, specific steps for engine/systems implementation
- [ ] **Content action items** — numbered steps for templates, prose tables, encounter packets, data
- [ ] **UI action items** — numbered steps for components, modals, HexMap layers, player controls, event display
- [ ] **Wiring action items** — orchestrator integration, GameState flow, trace registration, debug panel, prose enrichment
- [ ] Constants table — every tunable number named with default and purpose
- [ ] Tracing — trace types defined with TypeScript interfaces
- [ ] If a pillar is N/A, the plan explicitly says so with rationale — CC should never have to guess whether UI was forgotten or intentionally excluded
- [ ] Handoff comment on the issue — plan doc link, all action item sections, files changed, grey zones noted

**⚠️ Hard gate:** Do NOT move an issue to Ready for Dev if any pillar's action items are missing without an explicit N/A rationale. An incomplete plan produces deferrals — the whole point of this gate is to prevent that. If you're unsure whether UI or content is needed, **ask the user** before moving forward.

**In Dev → Done** (Claude Code gate — mechanically enforced by hooks)
- [ ] `npm test` — all tests pass
- [ ] `npx tsc --noEmit` — type check clean
- [ ] `npx vite build` — production build succeeds
- [ ] **All pillar action items completed** — engine, content, UI, wiring. If any were deferred, deferral issues exist with rationale.
- [ ] `project-status.md`, `project-history.md`, `changelog.md` updated
- [ ] No orphan deferrals — every `// TODO`/`// DEFERRED` has a `THR-XX` reference
- [ ] Wiring verified against `Docs/plans/wiring-checklist.md`
- [ ] Impediments logged to `Docs/impediments.md`
- [ ] Linear issue moved to Done with completion comment (commit hashes, what shipped, deferrals created)

---

## Role Boundaries (encoded in workflow)

| Agent | Can move TO | Cannot move TO |
|-------|-----------|----------------|
| Cowork | Idea, Todo, In Design, Implementation Planning, Ready for Dev, Ready for Codex | In Dev, Done |
| Claude Code | In Dev (from Ready for Dev only), Done (via merge-keyword only) | Idea, Todo, In Design, Implementation Planning, Ready for Dev, Ready for Codex |
| Codex | In Dev (from Ready for Codex only), Done (via merge-keyword only) | Idea, Todo, In Design, Implementation Planning, Ready for Dev, Ready for Codex |
| User | Any state | — |

This makes role violations visible: if an issue is In Design but code changes appear, something went wrong. **Cross-queue claims are the most important boundary** — CC must never claim from Ready for Codex and vice versa. Queue separation is enforced structurally by each agent's polling filter targeting only its own state name; never widen a filter to `state:"Ready*"` or similar.

**Note:** Linear doesn't enforce these role boundaries programmatically — it's still convention-based in terms of *who* can change state. But the audit trail makes violations immediately visible (Linear records who changed what and when), which is a significant improvement over markdown where changes are invisible.

---

## Coordination Failure Modes — Hard Rules

Each rule below maps to a specific incident that has actually happened in this project. **These are not best practices — they are required rules.** Treat them like type-check errors: if you find yourself about to violate one, stop. Read them as suggestions and the failures recur.

### Rule 1 — Claim before read

**Rule:** When pulling an issue from Ready for Dev, the very first tool call is `save_issue(id, assignee: "me", state: "In Dev")`. Reading the description, plan doc, comments, or code happens *only after* the claim is confirmed.

**Why:** Two CC instances pulled the same issue because the first one read first, claimed later (or never). The second instance saw `Ready for Dev` with empty assignee, took it as fair game, and started duplicate work.

**How to apply:**
- First action on any new issue: claim. No exceptions, no "let me just check the description first."
- Then re-fetch the issue and verify `assignee` is you. If not, an earlier agent won the race — clear your (not-really-yours) claim with `assignee: null` and move to the next candidate.
- Only after the claim is confirmed do you read the description, plan doc, or comments.

### Rule 2 — Pull queries filter out claimed issues

**Rule:** Any Ready-for-Dev scan adds `assignee: null` to the filter. Issues with an assignee are invisible to other agents until the assignee clears.

**Why:** Closes the race window between query and save. Even with Rule 1, two agents that query at the same moment can both see the same unclaimed issue. Filtering claimed issues out of the pull queue narrows the window further.

**How to apply:** When listing Ready-for-Dev candidates, the query is `list_issues state:"Ready for Dev" assignee:null`. Sort by priority client-side per the Linear MCP limitations note above.

### Rule 3 — CC never manually transitions to Done

**Rule:** Claude Code does not call `save_issue(state: "Done")` directly. Closure happens through exactly two paths: (1) the `Fixes THR-XX` keyword in a commit body that lands on `main`, which Linear auto-closes; (2) explicit human or Cowork action. If CC believes an issue is wrong, malformed, or already complete, it adds a comment and stops — it does not change the state.

**Why:** A CC instance encountered a reopened issue, interpreted the reopen as a Cowork mistake, and closed it without reading the latest comment that explained the reason for the reopen. Removing the manual-close authority makes this failure mode impossible — not merely unlikely.

**How to apply:**
- After implementation, push the commit with `Fixes THR-XX` in the body. Don't touch the issue state — the merge to `main` triggers the close automatically.
- If you think an issue shouldn't exist or the description is wrong: comment explaining why, leave the state as-is, surface it for human review.

### Rule 4 — Read the most recent comment before acting

**Rule:** Before claiming or otherwise acting on a Ready-for-Dev issue, read the most recent comment. If the latest comment is newer than the description's last update, that comment is the authoritative instruction set — the description is the frozen original spec.

**Why:** Same reopen incident as Rule 3. The reopen comment contained the actual remaining work (cherry-pick, audit trail, merge to main). The description still showed the original handoff. Acting on the description alone either re-does finished work or, in the failure case, closes a still-active issue.

**How to apply:** Right after the claim is confirmed (Rule 1), the next call is `list_comments(issue: THR-XX, sort: -createdAt, limit: 5)`. If the top comment is a reopen, correction, or scope change, it's the brief — read it before the description.

### Rule 5 — Reopens get a `Reopened` label

**Rule:** When an issue moves Done → Ready for Dev (or any transition that puts a previously-completed issue back into the work queue), add the `Reopened` label. The label is a visible signal in list views that this is not a fresh handoff and that the latest comment is authoritative.

**Why:** CC had no visible signal in its list view that a reopened issue was different from a fresh one. State alone (`Ready for Dev`) didn't carry the history. The label makes the reopen visible without opening the issue.

**How to apply:**
- Cowork or human applies the `Reopened` label when reopening.
- CC, when scanning Ready for Dev, treats `Reopened`-labeled issues as a flag to read all comments back to the original handoff before acting.
- The label stays until the merge keyword closes the issue — don't strip it during implementation.

### Rule 6 — WIP=1 across all sessions

**Rule:** Even across separate worktrees, machines, or agent instances, only one CC has a given issue In Dev at a time. Parallel work happens on *different* issues, never the same one. Parallel candidates come from the current issue's `Parallel-safe with` line, not from re-pulling a duplicate.

**Why:** The previous WIP=1 wording was per-project and per-session, leaving the cross-instance dimension implicit. Combined with claim-before-read, this makes the rule explicit and removes the "I thought the other session crashed" failure mode.

**How to apply:** Trust the assignee field. If an issue has an assignee that isn't you, it's not yours regardless of how stale the claim looks. If a claim genuinely needs to be transferred (the original session is dead), a human releases the assignee first.

### Rule 7 — Verify state changes stuck

**Rule:** After any `save_issue` that changes `state` or `assignee`, re-query the issue with `get_issue` and confirm the change took. The Linear MCP has returned 200-success with no actual write before (impediment #48).

**Why:** A claim that the MCP silently dropped is worse than no claim — you think you've claimed the issue, but the next agent sees it as fair game and Rules 1–2 don't fire. The verify step catches the silent-drop case before any other agent acts.

**How to apply:** `save_issue(...)` → `get_issue(THR-XX)` → confirm `state` and `assignee` fields match what you wrote. If they don't, retry once, then surface to the user. Verify-after-write is the agent's responsibility on every state move — no skill or helper exempts you from it.

### Rule 8 — The codex *reviewer* is read-only

> **Disambiguation.** "Codex" refers to two distinct things in this codebase. This rule is about **codex-the-reviewer** (the `/codex:*` slash commands inside a CC session). **Codex-the-executor** — the Codex CLI running as its own agent loop polling the Ready for Codex queue — is a separate integration introduced 2026-04-19 and is governed by the Codex Session Protocols below, not this rule. The two share a name but are different tools.

**Rule:** The codex *review* integration is a review tool only. CC must never invoke codex slash-commands that modify code — specifically `/codex:rescue`, and any future codex command whose effect is a code change. Review produces findings; CC, Cowork, or Codex-the-executor act on the findings.

**Why:** During the original inline-codex-review rollout (retired 2026-04-18), CC instances sometimes stalled on `/codex:review` calls — UI went silent for long stretches while the review ran, and when progress felt indeterminate CC reached for `/codex:rescue` as an escape hatch. Using the reviewer to fix the code defeats the purpose of independent review and was one of the proximate causes of the stalls that led to retiring the whole loop. The rule must be doctrinally bright-lined regardless of whether codex ever returns to the standard workflow — any future review shape must preserve it.

**How to apply:**
- Never call `/codex:rescue` from CC, in any context. The command exists but is not part of the CC toolkit.
- If a codex review is stalled, ambiguous, or hit a timeout, exit via `/codex:cancel` and bounce to Cowork with a comment containing whatever partial findings exist. Do not try to unstick via any codex write-capable command.
- Any future tooling that reinstates codex in the loop must be designed so the reviewer is structurally read-only: no write credentials to the repo, PR-comment-only output. Read-only in capability, not just in convention.
- **See also:** `Docs/plans/2026-04-19-cc-review-replacement.md` — the heartbeat wrapper and PR-gated GitHub Action that replace the retired inline review. The Action enforces Rule 8 structurally (scope-restricted `GITHUB_TOKEN`, no `contents:write`).

### Rule 9 — Verification evidence is required before completion (bridge discipline)

**Rule:** Executor agents (CC, Codex) must not claim completion on an issue without verification evidence. Before posting a completion comment or using a close keyword (`Fixes THR-XX`, `Closes THR-XX`, `Resolves THR-XX`), include either raw terminal output for the required checks or a link to a green CI run for the same commit.

**Why:** "Tests pass" claims are otherwise unverifiable and can be hallucinated or stale. This rule creates an auditable artifact until hard CI merge gates are enforced.

**How to apply:**
- Capture and paste output from `npm test`, `npx tsc --noEmit`, and `npx vite build` in the closing commit body or completion comment.
- A green CI URL is acceptable evidence if it clearly corresponds to the same commit that contains the close keyword.
- Treat this as a bridge discipline until branch protection + CI hard gates land (tracked by THR-183); then this manual requirement can be revisited.

Example commit-message format:

```
feat(encounters): wire hidden marks through aftermath

Fixes THR-XXX

Verification:
$ npm test
… 412 passed
$ npx tsc --noEmit
(clean)
$ npx vite build
✓ built in 4.2s
```

---

## Agent Session Protocols

### Cowork Session Start
1. **Board scan (single Linear MCP call):** `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)`. Bucket results in memory by `status` to cover In Design, Implementation Planning, Ready for Dev, and Todo (priority 1 + 2) at once.
2. Check if any "Ready for Dev" items have been sitting >2 sessions → flag to user.

### Claude Code Session Start
1. Query Linear: `list_issues state:"In Dev" assignee:"me"` → resume your own active implementation first (finish before starting).
2. Query Linear: `list_issues state:"Ready for Dev" assignee:null` → the `assignee:null` filter is **required** — it excludes issues another agent has already claimed (Rule 2). Sort by priority in memory (impediment #49 rejects `orderBy:priority` at runtime); pull from the top.
3. **Claim immediately (Rule 1):** before reading anything but the title, run `save_issue(id, assignee: "me", state: "In Dev")`. Then `get_issue(id)` to verify the write stuck (Rule 7 / impediment #48). Only after the claim is confirmed do you read the handoff comment and plan doc.
4. **WIP check:** confirm no other issue is In Dev under your assignee across all projects (Rule 6 — WIP=1 is cross-session, not per-project-per-session). If you find one, finish or hand it off before claiming the next.
5. **Reopened check (Rule 5):** if the issue carries a `Reopened` label, read all comments back to the original handoff *before* starting work — the latest comment supersedes the original plan (Rule 4).
6. **Model check:** read the `Suggested model` line in the handoff comment (or the `model:*` label) and use that model unless there's a specific reason to override.
7. **Parallel check** (only when considering a concurrent worktree): confirm the second issue appears in the first issue's `Parallel-safe with:` list *and* does not collide with either issue's `Mutex with:` description. If unsure, run them serially.
8. On completion: commit with `Fixes THR-XX` in the body and push — the merge-to-main keyword auto-closes the issue. **Do not manually transition In Dev → Done (Rule 3).**

### Cowork Handoff (replaces HANDOVER.md)
When Cowork finishes a design and writes the implementation plan:
1. **Verify exit criteria** — check all items in "Implementation Planning → Ready for Dev" above. Every pillar must have action items or an explicit N/A.
2. Move issue: Implementation Planning → Ready for Dev
3. Add handoff comment using this template:

```
## Handoff: [Issue title]

**Plan doc:** `Docs/plans/YYYY-MM-DD-topic.md`

### Engine action items
1. ...
2. ...

### Content action items
1. ...
(or: N/A — [rationale])

### UI action items
1. ...
2. ...
(or: N/A — [rationale])

### Wiring action items
1. ...

### Files changed by Cowork
- ...

### Grey zones / CC decisions needed
- ...

### Claude Code coordination
**Suggested model:** sonnet | haiku | opus — one-line rationale.
**Parallel-safe with:** THR-XX, THR-YY (file-surface analysis) — or "none" if no other Ready for Dev issue is safe to run concurrently.
**Mutex with:** free-text description of files / surfaces this issue will conflict on.
```

4. This comment IS the handoff — no separate HANDOVER.md needed. **Every section must be present.** Empty sections without N/A rationale = incomplete plan.

#### Claude Code coordination lines — what they mean

- **Suggested model** — Cowork's recommendation on which Claude model Claude Code should use. Default is `sonnet`. Use `haiku` for mechanical work with low blast radius (renames, data-row additions, doc updates, boilerplate tests for existing patterns). Use `opus` for architectural judgment or cross-cutting work (touching high-impact files like `engine/graph.ts` or `types/index.ts`, novel node/edge types, new mechanics surface, multi-system refactors, debugging spanning 3+ subsystems). Also apply the matching `model:haiku` / `model:sonnet` / `model:opus` label so the suggestion is visible in list view and queryable.
- **Parallel-safe with** — which other Ready for Dev issues this can run alongside in a separate worktree without merge conflicts. Based on file-surface analysis: do the two issues edit disjoint files? If yes, list the identifiers. If no, list "none." This is a soft signal — Claude Code still verifies before pulling a second issue into a concurrent worktree.
- **Mutex with** — the files or surfaces this issue will make concurrent work collide on. Free-text (e.g., "any issue touching `src/types/trace.ts`" or "the legacy/unified enrichment boundary"). Used by Cowork when sizing up *future* handoffs — if an issue's Mutex description matches the new issue's surface, they can't parallelize.

**Codex review retired (2026-04-18).** Running an automated Codex review against every branch diff stalled agents without a proportional quality gain. Reviews now happen on demand — if the user or Cowork wants a second-pair-of-eyes pass on a specific change, ask explicitly. The `Codex review: yes | no` line has been removed from the handoff template. See Rule 8 for the bright-line doctrine that applies regardless of whether codex is ever reintroduced to the workflow.

**Why a convention, not a label.** File-surface collisions can't be expressed as structured metadata in Linear (there's no `touchesFiles` field, and `blockedBy` means hard sequencing, not "shares-surface-with"). A handover-comment convention keeps the signal present without abusing the schema. Promote to `area:*` labels only if querying parallel-safe slices by area becomes a frequent need.

### Claude Code Pickup Protocol
When CC picks up a Ready for Dev issue, the order is **claim → verify → read → decide**:
1. **Claim first (Rule 1).** First tool call after selecting the issue is `save_issue(id, assignee: "me", state: "In Dev")`. Do not read the handoff comment, the plan doc, or anything else first. Claim-before-read is how concurrent agents avoid duplicate work.
2. **Verify the claim stuck (Rule 7).** Immediately `get_issue(id)` and confirm both `assignee` and `state` match what you wrote. If they don't, retry once; if still wrong, surface to the user and stop — do not proceed on an unverified claim.
3. **Read the latest comment first (Rule 4).** The most recent comment on the issue is the authoritative brief. If it's a reopen with a cleanup plan, it supersedes the original handoff. If the issue has a `Reopened` label (Rule 5), read all comments back to the original handoff to understand what changed.
4. **Verify the handoff is complete.** All four action-item sections present (Engine, Content, UI, Wiring). If any section is missing without N/A rationale, do not start work — add a comment flagging the gap and move the issue back to Implementation Planning. (Release your claim by setting `assignee: null` when you do.) An incomplete plan produces incomplete work.
5. **Check the Claude Code coordination block.** Use the `Suggested model` (or the `model:*` label) unless you have reason to override. If considering a concurrent worktree, verify the target is listed in `Parallel-safe with` *and* doesn't collide with `Mutex with`.

### Commit Trailer Vocabulary

Commit trailers are single-word annotations in the commit message body (one per line, after a blank line) that document the review outcome for audit purposes. Three trailers are defined for the CC review system (see `Docs/plans/2026-04-19-cc-review-replacement.md`):

| Trailer | Meaning |
|---------|---------|
| `review:ok` | Review ran to clean completion; verdict was `none` or `minor` |
| `review:major-findings` | Review ran to clean completion; verdict was `major` (findings attached in trace) |
| `review:skipped:<reason>` | Review did not complete — `<reason>` is `heartbeat-timeout`, `wall-clock-timeout`, `nonzero-exit`, or `wrapper-crash` |

The wrapper writes the trailer automatically to the trace. CC reads the trace and includes the trailer in the closing commit body:

```
feat(thr-XX): my change description

Fixes THR-XX
review:ok
```

If review was skipped, the trailer documents why — this preserves the audit trail even for incomplete reviews. The `Fixes THR-XX` keyword must always be present regardless of review outcome.

### Claude Code Closeout (replaces Definition of Done doc updates)
When Claude Code finishes implementation:
1. DoD hooks enforce: tests pass, types clean, build succeeds, docs updated, no orphan deferrals.
2. **Create Linear issues for any deferrals** — every `// TODO`/`// DEFERRED` comment must have a `THR-XX` reference. Label `Deferral`, assign to same project, set dependencies.
3. **Commit with the close keyword, don't manually transition (Rule 3).** The closing commit's body must include `Fixes THR-XX` (or `Closes THR-XX` / `Resolves THR-XX`). Merging to `main` triggers Linear's auto-close, which also records the commit reference on the issue. **Never `save_issue(state: "Done")` from CC** — that pathway has caused premature closes of reopened issues and bypasses the merge-gated invariant that Done means shipped.
4. Add a completion comment on the issue with:
   - Commit hash(es) and the branch they landed on
   - What was shipped (one-line summary matching the Linear issue title)
   - Deferral issues created (if any), with brief rationale for each deferral
5. If the merge didn't fire the auto-close (wrong keyword, merge blocked, feature branch not yet on `main`), the issue **stays** in In Dev until the merge lands. Fix the merge situation rather than force-transitioning the issue.

### Codex Session Start
Codex is an executor agent introduced 2026-04-19 to absorb well-specified, pattern-following work. It runs as a separate automation on an hourly cycle, querying its own queue only. All nine Hard Rules above apply to Codex identically to CC — claim-before-read, verify-after-write, WIP=1, no manual Done transitions.
1. Query Linear: `list_issues state:"In Dev" assignee:"me"` → resume your own active implementation first (finish before starting).
2. Query Linear: `list_issues state:"Ready for Codex" assignee:null` → the `assignee:null` filter is **required** (Rule 2). Sort by priority in memory (impediment #49); pull from the top. **Never query Ready for Dev** — that queue belongs to CC. Expanding the filter across queues defeats the separation the two-queue design exists to provide.
3. **Claim immediately (Rule 1):** before reading anything but the title, run `save_issue(id, assignee: "me", state: "In Dev")`. Then `get_issue(id)` to verify the write stuck (Rule 7 / impediment #48). Only after the claim is confirmed do you read the handoff comment and plan doc.
4. **WIP check (Rule 6):** confirm no other issue is In Dev under your assignee across all projects. If you find one, finish or hand it off before claiming the next.
5. **Reopened check (Rule 5):** if the issue carries a `Reopened` label, read all comments back to the original handoff before starting work.
6. **Cross-executor parallel check:** if CC has an In Dev issue, verify this Codex issue appears in CC's `Parallel-safe with:` and does not collide with CC's `Mutex with:`. If uncertain, wait for CC to finish — correctness beats throughput.
7. On completion: commit with `Fixes THR-XX` in the body and push — the merge-to-main keyword auto-closes the issue. **Do not manually transition In Dev → Done (Rule 3).**

### Codex Handoff (Cowork → Codex)
When Cowork finishes a design and writes the implementation plan and determines Codex is the right executor:
1. **Verify exit criteria** — same three-pillar + constants + tracing gate as CC handoffs. Codex-shaped work still needs all three pillars covered in the plan, even when the surface is narrow.
2. Move issue: Implementation Planning → **Ready for Codex**
3. Add handoff comment using this template:

```
## Codex Handoff: [Issue title]

**Plan doc:** `Docs/plans/YYYY-MM-DD-topic.md`

### Engine action items
1. ...
(or: N/A — [rationale])

### Content action items
1. ...
(or: N/A — [rationale])

### UI action items
1. ...
(or: N/A — [rationale])

### Wiring action items
1. ...

### Files to touch
- `path/to/file.ts` — what changes
- `path/to/test.ts` — what tests cover this

### Done when
- [ ] Acceptance checklist copied from plan doc
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` succeeds
- [ ] Deferrals (if any) have Linear issues with `THR-XX` references

### Codex coordination
**Parallel-safe with:** THR-XX, THR-YY (file-surface analysis) — or "none".
**Mutex with:** free-text description of files / surfaces this issue will conflict on.
```

4. The handoff comment is the brief — Codex reads it after claiming. **No `Suggested model` line** — Codex runs on its own model configured at the automation level, not at the handoff.
5. **No codex-review line** — the review integration (Rule 8) is separate. Reviews are requested on demand by CC or Cowork, not scheduled as part of a Codex handoff.

### Codex Pickup Protocol
Same order as CC: **claim → verify → read → decide**. Every step mirrors the CC pickup protocol; only the source queue name differs.
1. **Claim first (Rule 1).** `save_issue(id, assignee: "me", state: "In Dev")`.
2. **Verify the claim stuck (Rule 7).** `get_issue(id)` and confirm `assignee` and `state`.
3. **Read the latest comment first (Rule 4).** If `Reopened` label is present (Rule 5), read all comments back to the original handoff.
4. **Verify the handoff is complete.** All four action-item sections present (Engine, Content, UI, Wiring). If any section is missing without N/A rationale, do not start work — add a comment flagging the gap, release the claim with `assignee: null`, and move the issue back to Implementation Planning. An incomplete plan produces incomplete work regardless of which executor picks it up.
5. **Check the Codex coordination block.** Verify `Parallel-safe with` and `Mutex with` against any In Dev issues across both executors.

### Codex Closeout
Identical to CC closeout with one clarification: Codex commits and pushes through the same `Fixes THR-XX` keyword path. The merge-to-main auto-close fires regardless of which executor opened the PR. **Codex must never call `save_issue(state: "Done")` (Rule 3 applies).** Deferrals, impediment logs, changelog / project-status / project-history updates are all the executor's responsibility — no different from CC.

---

## Labels

Created in Linear (team: Threadbare):

| Label | Color | Use for |
|-------|-------|---------|
| Engine | #F2994A | Tick loop, orchestrator, resolution, graph |
| UI | #4EA7FC | Components, HexMap, frontend, modals |
| Content | #BB87FC | Encounters, prose, attachments, worldbuilding |
| Infrastructure | #95A2B3 | CI, hooks, tooling, testing infra |
| Game Design | #27B5A0 | Systems design, mechanics, balance |
| HexMap | #F2C94C | Three.js renderer, vignettes, shaders |
| Bug | #EB5757 | (default) Bug fixes |
| Feature | #BB87FC | (default) New features |
| Improvement | #4EA7FC | (default) Improvements to existing |
| Review | #E2E2E2 | Apply to any issue in any state when it needs review |
| Deferral | #E8590C | Work deferred during implementation — must be completed before parent project is done |
| model:haiku | #E8C547 | Cowork's suggested Claude model — mechanical, low blast radius |
| model:sonnet | #6366F1 | Cowork's suggested Claude model — default; most engine/content work with a written plan |
| model:opus | #8B5CF6 | Cowork's suggested Claude model — architectural judgment or cross-cutting work |
| review:required | #e11d48 | PR must pass structural review before merge (gated once GitHub Pro + branch protection lands) |
| review:sample | #f59e0b | Advisory review — runs for signal but never blocks merge |

---

## Known Linear MCP Limitations

The Linear MCP has a few rough edges that have bitten sessions repeatedly. **Read this before scripting batch operations.** (Added 2026-04-18 from retro impediments #48, #49.)

- **`save_issue` silently fails to update state.** A `save_issue` call with `statusId` or `status` can return a 200 success response while leaving the issue in its previous state — no error surfaced, no indication that the write didn't stick. **Workaround:** always verify-after-write. After any `save_issue` that changes state, re-query the issue with `get_issue` and confirm the state field matches what you asked for. If it doesn't, retry or surface the discrepancy in the session log. Verify-after-write is the agent's responsibility on every state move.
- **`list_issues orderBy: 'priority'` is rejected at runtime.** The `orderBy` field only accepts `createdAt` or `updatedAt`, even though the TypeScript schema exposes `priority` as a valid string. **Workaround:** omit `orderBy` (or use a timestamp sort) and sort by priority in memory from the returned array — Linear returns the `priority` numeric field on every issue, so sorting client-side is cheap.
- **Linear MCP has a rate limit that is easy to hit with the default protocol.** Session-start fan-outs, per-state loops in plan docs, and overlapping CC + Codex hourly pollers compound into a query storm. **Workaround:** (a) collapse multi-state scans into a single `list_issues(limit:250)` call with client-side bucketing by `status`; (b) in pull-work / Codex pickup, guard the first call with a rate-limit check and back off 2 min on 429 before retrying once; (c) CC polls at :00, Codex polls at :30 — never both at the same instant. See `Docs/plans/2026-04-23-linear-mcp-rate-limits.md` for the full rationale. (Impediment #79, 2026-04-23.)

If you hit a new Linear MCP quirk, log it via `impediment-reporter` and add it here in the next retro.

---

## Deferral Tracking

When Claude Code defers work during implementation (writes a `// TODO`, `// DEFERRED`, or `// PHASE-X-DEFERRED` comment), it **must** create a Linear issue for the deferral before pushing:

1. **Create the issue** with a clear title describing the deferred work
2. **Label it `Deferral`** so it's visible in priority queries
3. **Assign it to the same project** as the parent issue the deferral came from
4. **Use format `// TODO(THR-XX): description`** in the code comment so the link back to Linear is in the source
5. **Set `blockedBy`** if the deferral depends on other work

The pre-push hook (Gate 2 in `Docs/plans/2026-04-13-definition-of-done-hooks-design.md`) scans for new TODO/DEFERRED comments without a `THR-XX` reference and blocks the push. This is mechanism-enforced.

**Why this matters:** Deferrals without issues become invisible tech debt. The project never closes because nobody knows what's left.

---

## Prioritization: Finish Before You Start

When choosing what to work on, apply this priority order:

1. **Deferrals from active projects** — `list_issues label:"Deferral" state:"Ready for Dev"`. Finish what you started.
2. **Remaining issues in active projects** — if a project has issues in Ready for Dev, complete them before pulling from a different project.
3. **New work by priority** — only start a fresh project when active projects have no remaining Ready for Dev items.

**Every issue must belong to a project.** No orphan issues. Deferrals inherit the parent issue's project. New issues that don't fit an existing project require user input on project assignment.

---

## Projects (Roadmap Milestones)

Linear Projects group issues into larger initiatives. Each project has its own lifecycle status that tracks the milestone's overall progress independently of individual issue states.

| Project | Status | Issues | Description |
|---------|--------|--------|-------------|
| **Linear setup for Cowork & CC** | Urgent | THR-6, 39, 40 | Hook enforcement, orphan TODO backfill, project assignment cleanup |
| **UI/UX Design Infrastructure** | Now | THR-45, 46, 47, 48, 49 | frontend-ui skill, component guide, visual reference, patterns, layout zones |
| **Procedural Hex Vignettes** | Now | THR-10, 11, 12, 13 | Chunked instanced rendering, landmarks, interaction, profiling |
| **Content Architecture** | Now | THR-7, 14, 23 | Reusable content grammar — primitives, shells, encounter packets |
| **Attention Tier Model** | Discovery | THR-8, 16, 17, 18 | Thread tugs, story beats, ambient activity, character sheet |
| **Thematic Pressure & Living World** | Research | THR-19, 20, 21, 22 | Omens, cool failure, doom identity, intent visibility |
| **Social Systems Expansion** | Research | THR-27, 28, 29, 30 | Taverns, deep social scenes, faction agency, information economy |
| **Rarity Model** | Next | THR-24, 25, 26 | Prose tier bias, divine proximity, hex map signifiers |

### Project Status Lifecycle

| Status | Type | Meaning |
|--------|------|---------|
| **Idea** | backlog | Brainstorming candidate, not committed |
| **Next** | planned | Committed, coming after current work |
| **Research** | in progress | Actively exploring the milestone (early Cowork) |
| **Discovery** | in progress | Deeper design, writing implementation plans (late Cowork) |
| **Now** | in progress | Actively being implemented (Claude Code working) |
| **Done** | completed | All issues shipped |
| **Canceled** | canceled | Dropped |

**Unassigned issues:** THR-9 strategic UI, THR-15 name gen, THR-31–38 content/reputation/ideas are standalone — tracked in THR-40 for project assignment.

---

## Dependencies

Linear's `blocks`/`blockedBy` relations replace the "Depends on: TB-XXX" lines in BACKLOG.md.

When creating an issue that depends on another:
```
save_issue(title: "...", blockedBy: ["THR-42"])
```

This creates a visible dependency graph in Linear's UI.

---

## Plan Doc Links

When a design doc exists for an issue, attach it via the `links` field:
```
save_issue(id: "THR-42", links: [{url: "https://github.com/.../Docs/plans/2026-04-13-foo.md", title: "Design doc"}])
```

---

## What This Retires

| Old mechanism | Replacement | Migration |
|---------------|------------|-----------|
| `.planning/BACKLOG.md` | Linear issues + states | ✅ Migrated 2026-04-13 |
| `.planning/BACKLOG_HISTORY.md` | Linear "Done" state (searchable) | No migration needed — historical |
| `.planning/HANDOVER.md` | Comments on Linear issues at Implementation Planning | ✅ Retired 2026-04-13 |
| BACKLOG.md kanban emojis | Linear workflow states | ✅ Encoded in issue state |
| TB-XXX IDs | THR-XXX identifiers (Linear auto-assigns) | ✅ Mapping in issue descriptions |

### What Stays

| Mechanism | Why it stays |
|-----------|-------------|
| `Docs/plans/` design docs | These are content, not coordination — they belong in the repo |
| `Docs/changelog.md` | Git-tracked audit trail, referenced by DoD hooks |
| `Docs/project-status.md` | High-level summary, referenced by DoD hooks |
| `Docs/project-history.md` | Append-only archive, referenced by DoD hooks |
| `.planning/ROADMAP.md` | Milestone-level roadmap (could move to Linear Projects later) |
| CLAUDE.md | Session instructions — updated to reference Linear |

---

## Relationship to Hooks Design (TB-129)

The hooks design (Gates 1-3) and the Linear protocol are complementary:

- **Hooks** enforce the *mechanical* DoD: tests pass, build succeeds, docs updated, no loose ends
- **Linear** enforces the *coordination* protocol: who owns what, what state it's in, handoff context

Gate 4 (Cowork role boundary) remains as a speculative hook — if hooks fire in Cowork, it adds defense-in-depth. If not, Linear's audit trail at least makes violations visible.

The pre-push hook (Gate 2) still checks that `changelog.md`, `project-status.md`, and `project-history.md` are updated. These docs stay in the repo. The hook no longer needs to check BACKLOG.md since that's retired.

---

## Setup Instructions (User Action Required)

### Final Workflow States (updated 2026-04-19 with Ready for Codex)

| Order | State name | Category |
|-------|-----------|----------|
| 1 | **Idea** | Backlog |
| 2 | **Todo** | Unstarted |
| 3 | **In Design** | Started |
| 4 | **Implementation Planning** | Started |
| 5 | **Ready for Dev** | Started |
| 6 | **Ready for Codex** | Started |
| 7 | **In Dev** | Started |
| 8 | **In Review** | Started |
| 9 | **Done** | Completed |
| — | Canceled | Canceled |
| — | Duplicate | Canceled |

**Review** is a label (not a state) — apply it to any issue in any column when it needs review. (The separate "In Review" state exists for PRs under structural review via the claude-review Action.)

### Adding Ready for Codex (user action, 2026-04-19)

Linear's MCP does not expose workflow-state creation. To add the Ready for Codex state:

1. Linear → Threadbare team → Settings → Workflow.
2. Add a new status named `Ready for Codex` with category `Started` (matches Ready for Dev).
3. Position it immediately below Ready for Dev in the ordering so the board reads left-to-right by handoff order.
4. No other config needed — Cowork's `save_issue(state: "Ready for Codex")` calls will start resolving the moment the state exists.

---

## Migration (completed 2026-04-13)

All ~25 active BACKLOG.md items migrated to Linear as THR-6 through THR-38. Each issue has: title, description, current state (mapped from kanban emoji), labels, priority, and blockedBy dependency relations. Original TB-XXX IDs preserved in issue descriptions for cross-reference.

State mapping used:
- 🏗️ (dev) → In Dev
- 📐▶ (plan ready) → Implementation Planning
- 🎨 (design) → In Design
- 📋 (todo) → Todo
- 💡 (idea) → Idea

BACKLOG.md and HANDOVER.md are tombstoned with headers pointing to Linear.
