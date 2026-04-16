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

Seven custom states organized into two swimlanes. **Review** is a label (not a state) that can be applied to any issue in any column.

| State | Linear Type | Swimlane | Owner | Meaning |
|-------|-------------|----------|-------|---------|
| **Idea** | backlog | — | Anyone | Raw idea, not committed. Equivalent to 💡 |
| **Todo** | unstarted | — | Cowork | Committed to doing, needs design/planning. Equivalent to 📋 |
| **In Design** | started | Discovery & Design | Cowork | Cowork is actively designing or researching. Equivalent to 🎨 |
| **Implementation Planning** | started | Discovery & Design | Cowork | Cowork is writing the specific implementation plan and action items for Claude Code. Equivalent to 📐 |
| **Ready for Dev** | started | Handoff | Cowork → CC | Plan complete, handoff comment written. CC pulls from here. |
| **In Dev** | started | Implementation | Claude Code | Claude Code is implementing. Equivalent to 🏗️ |
| **Done** | completed | — | — | Shipped, documented, deployed. Equivalent to ✅ |

### Two Swimlanes

**Discovery & Design (Cowork):** Idea → Todo → In Design → Implementation Planning → Ready for Dev
**Implementation (Claude Code):** In Dev → Done

The handoff between lanes is **Ready for Dev → In Dev**. When Cowork finishes the implementation plan, it moves the issue to Ready for Dev with a comment containing the plan doc link and action items. CC pulls from Ready for Dev, sorted by priority.

**Review** is orthogonal — apply the "Review" label to any issue in any state when it needs review (design review in In Design, code review in In Dev, etc.). Filter by label to see everything awaiting review.

### State Transition Rules

```
Idea → Todo → In Design → Implementation Planning → Ready for Dev → In Dev → Done
  │                                                                          │
  └──────────────────────────── Canceled ◄────────────────────────────────────┘
```

**Forward-only flow.** Backward transitions (e.g., In Dev → In Design) indicate a plan gap — they should be accompanied by a comment explaining why.

**WIP limit: 1 In Dev issue per project.** CC must finish and ship the current In Dev issue before pulling another from the same project. This prevents merge conflicts and write collisions from parallel work in overlapping files. Issues from *different* projects can be In Dev simultaneously if they don't share files, but same-project work is strictly serial.

**Handoff point:**
- **Implementation Planning** is where Cowork writes the plan. **Ready for Dev** is the handoff — Cowork moves issues here when the plan is complete and the handoff comment is written. This is the CC pull queue.
- **Done** is the Claude Code closeout. When Claude Code moves an issue here, the DoD hooks have already enforced tests/build/docs.

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
- [ ] **If `Codex review: yes`**, run Codex review against the branch diff after build and before push. Address findings or add a commit with rationale for accepting each one. Re-run if changes were made.
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
| Cowork | Idea, Todo, In Design, Implementation Planning, Ready for Dev | In Dev, Done |
| Claude Code | In Dev, Done | Idea, Todo, In Design, Implementation Planning, Ready for Dev |
| User | Any state | — |

This makes role violations visible: if an issue is In Design but code changes appear, something went wrong.

**Note:** Linear doesn't enforce these role boundaries programmatically — it's still convention-based in terms of *who* can change state. But the audit trail makes violations immediately visible (Linear records who changed what and when), which is a significant improvement over markdown where changes are invisible.

---

## Agent Session Protocols

### Cowork Session Start
1. Query Linear: `list_issues state:"In Design"` → resume active design work
2. Query Linear: `list_issues state:"Implementation Planning"` → resume active planning work
3. Query Linear: `list_issues state:"Ready for Dev"` → verify handoffs are being picked up
4. Query Linear: `list_issues state:"Todo" priority:1` + `priority:2` → see what's next
5. Check if any "Ready for Dev" items have been sitting >2 sessions → flag to user

### Claude Code Session Start
1. Query Linear: `list_issues state:"In Dev"` → resume active implementation first (finish before starting)
2. Query Linear: `list_issues state:"Ready for Dev"` → pick up handoffs, sorted by priority — **pull from the top**
3. **WIP check:** before pulling a Ready for Dev issue, verify no other issue from the same project is already In Dev. WIP limit is 1 per project — finish the current one first.
4. **Model check:** read the `Suggested model` line in the handoff comment (or the `model:*` label) and use that model unless there's a specific reason to override.
5. **Parallel check** (only when considering a concurrent worktree): confirm the second issue appears in the first issue's `Parallel-safe with:` list *and* does not collide with either issue's `Mutex with:` description. If unsure, run them serially.
6. **Codex review check:** note whether the handoff comment says `Codex review: yes`. If so, run Codex review on the branch diff after tests/tsc/build pass and before push (see In Dev → Done exit criteria).
7. Move picked-up issue: Ready for Dev → In Dev
8. After completion: In Dev → Done (DoD hooks enforce pre-conditions)

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
**Codex review:** yes | no — one-line rationale. If yes, Claude Code runs Codex review against the branch diff after tests pass and before push.
```

4. This comment IS the handoff — no separate HANDOVER.md needed. **Every section must be present.** Empty sections without N/A rationale = incomplete plan.

#### Claude Code coordination lines — what they mean

- **Suggested model** — Cowork's recommendation on which Claude model Claude Code should use. Default is `sonnet`. Use `haiku` for mechanical work with low blast radius (renames, data-row additions, doc updates, boilerplate tests for existing patterns). Use `opus` for architectural judgment or cross-cutting work (touching high-impact files like `engine/graph.ts` or `types/index.ts`, novel node/edge types, new mechanics surface, multi-system refactors, debugging spanning 3+ subsystems). Also apply the matching `model:haiku` / `model:sonnet` / `model:opus` label so the suggestion is visible in list view and queryable.
- **Parallel-safe with** — which other Ready for Dev issues this can run alongside in a separate worktree without merge conflicts. Based on file-surface analysis: do the two issues edit disjoint files? If yes, list the identifiers. If no, list "none." This is a soft signal — Claude Code still verifies before pulling a second issue into a concurrent worktree.
- **Mutex with** — the files or surfaces this issue will make concurrent work collide on. Free-text (e.g., "any issue touching `src/types/trace.ts`" or "the legacy/unified enrichment boundary"). Used by Cowork when sizing up *future* handoffs — if an issue's Mutex description matches the new issue's surface, they can't parallelize.
- **Codex review** — whether Claude Code should run Codex review on the branch diff after tests/tsc/build pass and before push. Apply this rubric:
  - **yes** when any of: touches high-impact files (`engine/graph.ts`, `types/index.ts`, `types/gameState.ts`, `types/traits.ts`, `engine/traceBuffer.ts`); subtle correctness matters (parity between two paths, determinism-critical code, resolver/pipeline logic where tests can pass while intent diverges); first-in-pattern (code establishes a precedent others will copy); cross-cutting refactor across 10+ files; architectural judgment made during implementation that the plan couldn't fully anticipate. Opus-tagged issues almost always qualify.
  - **no** when: doc-only updates; adding rows to an existing data table with no new shape; Nth implementation of an established pattern; mechanical renames or find-and-replace; boilerplate test scaffolding. Haiku-tagged issues almost always qualify.
  - **Default: no.** The `yes` case should be explicit. Target roughly 30–40% `yes` at steady state — nearly all opus, a meaningful slice of sonnet, almost no haiku.
  - **Rationale matters.** A `yes` with a specific concern ("placeholder parity in nested conditional blocks") tells Claude Code what to pay attention to in Codex's output and whether to escalate ambiguous findings back to the user.

**Why a convention, not a label.** File-surface collisions can't be expressed as structured metadata in Linear (there's no `touchesFiles` field, and `blockedBy` means hard sequencing, not "shares-surface-with"). A handover-comment convention keeps the signal present without abusing the schema. Promote to `area:*` labels only if querying parallel-safe slices by area becomes a frequent need.

### Claude Code Pickup Protocol
When CC picks up a Ready for Dev issue:
1. Read the handoff comment — verify all four action item sections are present (Engine, Content, UI, Wiring)
2. **If any section is missing without N/A rationale:** Do not start work. Add a comment flagging the gap and move the issue back to Implementation Planning. This is not optional — an incomplete plan produces incomplete work.
3. If all sections present: move to In Dev and begin implementation
4. **Check the Claude Code coordination block** — use the `Suggested model` (or the `model:*` label) unless you have reason to override. If you're considering pulling a second issue into a concurrent worktree, verify the target issue is listed in this issue's `Parallel-safe with` line *and* doesn't collide with the `Mutex with` description. If `Codex review: yes`, plan to run Codex review against the branch diff after tests pass and before push.

### Claude Code Closeout (replaces Definition of Done doc updates)
When Claude Code finishes implementation:
1. DoD hooks enforce: tests pass, types clean, build succeeds, docs updated, no orphan deferrals
2. **Create Linear issues for any deferrals** — every `// TODO`/`// DEFERRED` comment must have a `THR-XX` reference. Label `Deferral`, assign to same project, set dependencies.
3. Move issue: In Dev → Done
4. Add comment on the issue with:
   - Commit hash(es)
   - What was shipped
   - Deferral issues created (if any), with brief rationale for each deferral

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

### Final Workflow States (completed 2026-04-13)

| Order | State name | Category |
|-------|-----------|----------|
| 1 | **Idea** | Backlog |
| 2 | **Todo** | Unstarted |
| 3 | **In Design** | Started |
| 4 | **Implementation Planning** | Started |
| 5 | **In Dev** | Started |
| 6 | **Done** | Completed |
| — | Canceled | Canceled |
| — | Duplicate | Canceled |

**Review** is a label (not a state) — apply it to any issue in any column when it needs review.

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
