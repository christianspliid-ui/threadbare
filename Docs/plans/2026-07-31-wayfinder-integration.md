> **title:** `Wayfinder integration — multi-session design maps — THR-900`
> **linear_issue:** THR-900
> **author:** `Claude Code (attended session with Christian)`
> **created:** 2026-07-31
> **three_pillars:** Engine `N/A — process/workflow change, no runtime code` · Content `N/A — same` · UI `N/A — same`

# Wayfinder integration — multi-session design maps — THR-900

*Gives Threadbare a first-class way to design efforts too big for one session — large game systems and webs of connected systems — instead of one heroic plan doc or an ad-hoc pile of workstream tickets.*

## Why this is load-bearing

Threadbare's design machinery is sized to **one session, one plan doc**: `design-session` grills, drafts, audits, and hands off in a single pass. Large connected efforts (Nudge Model scale — five workstreams, dozens of decisions, months of sessions) don't fit that shape. What actually happens today: either a giant plan doc that goes stale as decisions land, or a cluster of THR tickets whose *decision state* lives nowhere — each new session re-derives what's settled, and Christian repeats answers he already gave. The [wayfinder skill](https://github.com/mattpocock/skills/tree/main/skills/engineering/wayfinder) (Matt Pocock) solves exactly this: a **shared map of decision tickets** on the tracker, worked one at a time until the way is clear. This plan adapts it to Linear and wires it into the two lanes that touch design: `design-session` (suggests charting; resolves HITL tickets) and `orchestrator` (burns down AFK tickets, surfaces the HITL frontier to Christian).

## Decision record (Christian, chat, 2026-07-31)

1. **Orchestrator auto-resolves AFK tickets** (`wayfinder:research`, agent-doable `wayfinder:task`) via subagents — fact-finding, not direction-setting, so it fits the D1–D7 mandate.
2. **HITL tickets reach Christian via the hourly briefing** — the orchestrator report's `## Needs Christian` section → `keep-work-flowing-cc` step 2.6. No new plumbing, no per-ticket Discord pings.
3. **Scale gate is suggest-and-ask** — design sessions recommend charting when an effort exceeds one session; nothing auto-charts; `/wayfinder` is also explicitly invokable.

## Design

### Linear representation

| Upstream concept | Threadbare/Linear form |
|---|---|
| Map | One issue labelled `wayfinder:map`, in the effort's project, state `Todo` while open |
| Decision ticket | Sub-issue (`parentId` = map) with exactly one `wayfinder:<type>` label (`grilling` / `prototype` / `research` / `task`), state `Todo` |
| Blocking | **Native Linear relations** (`save_issue blockedBy:[…]`, read via `get_issue includeRelations:true`) — UI-visible, no prose duplication. The MCP supports this; the prose `Blocked by:` convention stays the executor-queue dialect and is not used on wayfinder tickets |
| Claim | Assignee (set before any work, verify-after-write per impediment #48) |
| Resolve | Resolution comment + `state:"Done"` + gist line appended to the map's `## Decisions so far` |
| Frontier | Open ∧ unassigned ∧ no open blocker, computed per map |
| Out-of-scope ticket | State `Canceled` (so it never reads as a resolved decision) + one line in the map's `## Out of scope` |

### Skill/lane changes (shipped in this PR)

- **New `.claude/skills/wayfinder/SKILL.md`** — full adapted skill: map/ticket schemas, Linear operations table, ticket types mapped to existing skills (`grill-me`, `ubiquitous-language`, background research subagents, project prototype surfaces), fog-of-war and out-of-scope disciplines, chart/work/close invocation modes, lane table.
- **`orchestrator/SKILL.md`** — new **T1.5 wayfinder sweep** (find open maps → compute frontier → burn down ≤ `ORCH_WAYFINDER_AFK_MAX` AFK tickets → surface HITL frontier under `## Needs Christian`); T1 gains an unconditional **skip for `wayfinder:*` issues** (fifth decline reason); non-negotiables note the scoped claim exception; report template gains a T1.5 section.
- **`design-session/SKILL.md`** — scale gate (suggest-and-ask) in *When to use*; a note that resolving a wayfinder ticket follows the work-the-map flow, not the full plan-doc pipeline.
- **Labels created in Linear** (2026-07-31): `wayfinder:map`, `wayfinder:grilling`, `wayfinder:research`, `wayfinder:prototype`, `wayfinder:task` — each description states "Never enters Ready for Dev".

### Process-rule deltas (the two deliberate carve-outs)

1. **`Done` from a non-executor session** — the standing rule ("never `save_issue(state:"Done")` from CC") protects *merge-gated* work from phantom closes. A wayfinder ticket has no merge gate; its Done is decision-recorded, evidenced by the resolution comment. Carve-out is scoped to issues carrying a `wayfinder:*` label.
2. **Orchestrator claiming an issue** — scoped to AFK wayfinder tickets in T1.5. The original non-negotiable exists to protect the executor's WIP=1 slot; wayfinder tickets can never reach that queue, so the claim starves nothing.

Both carve-outs are stated at their rule sites (wayfinder + orchestrator skills), not just here.

### Guards against cross-lane contamination

- T1 never promotes a `wayfinder:*` issue (explicit decline reason).
- Wayfinder tickets never enter `Ready for Dev`, so `pull-work`'s state filter never sees them — no pickup-side change needed.
- No `Fixes`/`Closes`/`Resolves` keyword anywhere in wayfinder bodies/comments (THR-738 discipline restated in the skill).
- HITL tickets are orchestrator-untouchable; only surfaced.

### Rejected alternatives

- **Prose `Blocked by:` lines on wayfinder tickets** — the MCP's native relations are UI-visible and machine-readable; two representations would drift (rejected for the same reason double bookkeeping always is).
- **Per-ticket Discord pings** — Christian chose the briefing route; the change-gated ping already covers arrival.
- **Auto-charting when a design session detects scale** — charting a map is a scoping act with Christian's time on the line; suggest-and-ask only.
- **A dedicated Linear state for wayfinder tickets** — label + parentage carries the semantics; a new state would leak into every state-filtered query in every lane.

## Engine pillar

Engine: N/A — process/workflow change; no runtime code, no tick loop, no graph.

## Content pillar

Content: N/A — no game content; the skill governs how *future* content-bearing designs are planned.

## UI pillar

UI: N/A — no player-facing or debug surface. (Linear's own UI renders the map/blocking graph.)

## Wiring

Process wiring (in place of the module table — no code modules):

| Piece | Producer | Consumer |
|---|---|---|
| `wayfinder:map` issues + children | attended `/wayfinder` sessions | attended sessions, orchestrator T1.5 |
| Native blocking relations | charting/graduating sessions | frontier computation (T1.5 + work-mode step 2) |
| `## Needs Christian` T1.5 lines | orchestrator run report | `keep-work-flowing-cc` step 2.6 → `Design/briefing.md` → Christian |
| Cleared map's Decisions-so-far | closing session | per-plan-doc `design-session`s (settled input) |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ORCH_WAYFINDER_AFK_MAX` | `2` | Frontier AFK tickets resolved per orchestrator run — caps subagent spend and the blast radius of a bad frontier computation |

(HITL cadence is structurally 1 ticket/session — a rule, not a tunable.)

## Tracing

No engine traces. The orchestrator's T1.5 emits its one-line-per-decision report entries (`[orchestrator] T1.5 …`), same discipline as T1; resolution comments are the per-ticket audit trail.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Linear unreachable during a sweep | T1.5 skipped, noted in report; next run reconciles (inherits orchestrator fail-soft) |
| Research subagent fails/times out | Unassign, leave ticket open, log — never post a guessed resolution |
| `save_issue` 200 but write didn't stick | Verify-after-write on every claim/close/append (impediment #48); on mismatch leave for next session |
| Two sessions race a ticket | Claim-before-work + verify; the loser sees the assignee and picks the next frontier ticket |
| Map body patch anchor missing (concurrent edit) | Re-read map, re-apply patch against current body; Decisions-so-far is append-only so ordering conflicts are benign |
| A decision invalidates existing tickets | Work-mode step 5: update or cancel them in the same session that made the decision |

## Three-pillar check

- [x] Engine pillar present (N/A with rationale)
- [x] Content pillar present (N/A with rationale)
- [x] UI pillar present (N/A with rationale)
- [x] Wiring section connects the process pieces

## Vision audit

- [x] No Vision premise touched — pure process. (If anything, it strengthens the "we create the vision together" mandate: HITL tickets are structurally Christian's.)

## Rulebook impact

- [x] No rule of play changed.

> Brainstorm companion: N/A — process integration; the decision exchange happened live in chat and is recorded verbatim in § Decision record.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | The one magic number (`ORCH_WAYFINDER_AFK_MAX`) is named |
| 2. Inspectability | PASS | Every decision leaves a resolution comment + map index line; every T1.5 action a report line |
| 3. Determinism | N/A | No random code |
| 4. Fail-soft | PASS | See table; inherits orchestrator fail-soft posture |
| 5. Narrative over mechanical perfection | N/A | No game-facing behavior |
| 6. Additive over destructive | PASS | New skill + additive edits; no lane removed; both rule carve-outs scoped, originals intact |
| 7. Performance budget | PASS | T1.5 is a handful of filtered Linear calls per run, gated on an open map existing |

## Done when

- [x] `wayfinder` skill exists and registers; `orchestrator` + `design-session` updated; labels created
- [x] Guards in place: T1 skip, no Ready-for-Dev path, HITL untouchable by scheduled lanes
- [ ] PR green on `Test · Typecheck · Build` and merged (closing PR carries the auto-close keyword for THR-900)
- [ ] First real map charted on the next large design effort (the live validation — not gated here)

## Forked-audit verdicts

Skipped with rationale (design-session Step 3.2 skip clause): pure process change — all three audit axes (NFP / three-pillar / Vision) are N/A-by-construction as recorded above, and the human gate was satisfied live: **human gate satisfied via chat review 2026-07-31** (Christian selected all three integration decisions in-session). Intent-judge likewise N/A: no Ready-for-Dev handoff occurs — the change ships from the attended session itself.
