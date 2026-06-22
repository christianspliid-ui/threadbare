<!--
Plan doc for THR-442 — small infrastructure fix.
Three pillars all N/A (governance/process ticket, no game-state change).
-->

> **title:** `keep-work-flowing scheduled-task SKILL.md drops Slack notification (Option B)`
> **linear_issue:** THR-442
> **author:** Cowork (scheduled `keep-work-flowing` run, 2026-06-12)
> **created:** 2026-06-12
> **three_pillars:** Engine `N/A — process/skill change, no game state` · Content `N/A — no game content` · UI `N/A — operator-facing skill, no player surface`

# keep-work-flowing scheduled-task SKILL.md drops Slack notification — THR-442

*One sentence: the scheduled task's instructions still tell the agent to post to Slack, but the skill it invokes refuses to — the two have drifted and every `keep-work-flowing` run reports a partial failure as a result.*

## Why this is load-bearing

`keep-work-flowing` is the Sunday-and-hourly Cowork PM run that keeps CC's and Codex's queues fed. Its final step (5) says "run /session-handoff … send a plain-text message to Slack channel C0AT5DYGJ8P". The `session-handoff` skill it invokes was rewritten on 2026-05-12 to explicitly drop the Slack step (the skill body now contains the guardrail `Do not send Slack messages from this skill`). The two instructions contradict each other: the scheduled task asks for Slack output the skill refuses to produce, so every run logs a partial failure even though the actual handoff (the Linear state transition + comment) has succeeded.

Without the fix, every `keep-work-flowing` invocation reports broken even when the handoff completed cleanly. That noise erodes the signal value of the run — over time the human stops trusting the report, and real failures get lost in the wash. Fixing it is a ~25-line edit to a single SKILL.md.

This issue (THR-442) was filed on 2026-05-15 with three resolution options. Cowork's recommendation in the issue body was **Option B — drop the Slack dependency entirely; replace step 5 with a Linear comment.** The `session-handoff` skill was unilaterally fixed three days later (2026-05-12 was an old `last_validated_against`; actual session-handoff rewrite happened around 2026-05-15–17). The scheduled-task SKILL.md (the upload attached to the cron task definition) was never updated — that is what this ticket finalises.

## Resolution decision

**Option B — drop Slack, use Linear comments.** Recorded in THR-442 description; reinforced here.

Rationale:
- Linear is already the authoritative handoff channel per `Docs/plans/2026-04-13-linear-coordination-protocol.md` and `CLAUDE.md` ("the state transition plus the handoff comment IS the handoff").
- Slack ping was only a convenience notification for the human's at-a-glance view.
- CC and Codex poll Linear hourly regardless of any Slack message.
- The connected Slack MCP (`mcp__a47921aa-…__slack_*`) is read-only in the scheduled-run environment; the writeable alternative (`plugin:legal:slack`) requires interactive OAuth that can't complete in an unattended cron run.
- Option A (restore Slack + interactive OAuth) trades a small convenience for an ongoing connector dependency the environment can't satisfy.
- Option C (best-effort + graceful degrade) keeps the dead code path alive and the contradiction unresolved.

## Engine pillar

Engine: N/A — no tick-loop, graph, or game-state change.

## Content pillar

Content: N/A — no encounter templates, prose, attachments, or world-model data touched.

## UI pillar

UI: N/A — operator-facing skill, no player view or HexMapV2 surface. Browser-verify exempt.

## What changes

Two files in the repo:

1. **`.agents/skills/keep-work-flowing/SKILL.md`** (canonical — Cowork-only audience per `CLAUDE.md` skill-tree rules; not mirrored to `.claude/skills/` because Claude Code does not run scheduled `keep-work-flowing`).
   - **Create the file** if it does not yet exist. The existing copy is an upload attached to the scheduled-task definition (under the user's AppData), not in the repo. This plan makes the repo the canonical home so future edits flow through PR review.
   - Replace step 5 ("Run /session-handoff to notify the channel what CC should pick up next") with: "Run /session-handoff to produce a handoff summary, then post that summary as a Linear comment on the handed-off issue (the same issue you just moved to Ready for Dev / Ready for Codex)."
   - Remove the "Send to Slack channel C0AT5DYGJ8P" message-format block.
   - Replace it with the Linear-comment template (see § Comment template below).
   - Remove the stray duplicate frontmatter block at the top (lines 1–9 of the current upload contain the YAML header twice — likely a copy-paste artefact; harmless but confusing).
   - Fix the "Your job this session" numbering — it currently starts at `2.` with no `1.` (Step 0 is the stale-In-Review scan; renumber the rest 1–4 or convert Step 0 into Step 1 explicitly).

2. **`.agents/skills/session-handoff/SKILL.md`** (already correct as of 2026-05-12 rewrite — no edit).
   - Add a one-line note in the Guardrails section: `When invoked from a scheduled task (keep-work-flowing), the summary template should be posted to Linear as a comment on the handed-off issue, not surfaced only in-session.`
   - Bump `last_validated_against` to 2026-06-12.

### Comment template (replaces the old Slack message)

The new handoff-comment body, posted via `save_comment(issueId: <handoff issue>, body: <below>)`:

```
**Cowork handoff — what CC/Codex picks up next**

Done this session: THR-XXX — <one-line summary>
Plan doc: Docs/plans/<filename>

Next ready in queue → THR-YYY: <title>
State: <Ready for Dev | Ready for Codex>
Priority: <urgent | high | medium | low>
Model: <haiku | sonnet | opus> (CC handoffs only)
Mutex with: <issue IDs or "none">
Parallel-safe with: <issue IDs or "none">
Codex review: <yes | no>

Suggested executor prompt: "pull thr YYY"
```

Note: the comment is posted on **the handed-off issue** (the one moved to Ready for Dev / Ready for Codex), so the next executor finds it the moment they read the latest comment of the issue they claim. That preserves the "claim before you read, then read the latest comment" discipline encoded in CLAUDE.md.

Edge case: if `keep-work-flowing` declines to hand off any issue this cycle (all In Design items blocked on Christian's verdict, queue genuinely empty, etc.), the skill instead posts the handoff-comment body on the **most recent active project** as a coordination note, so the run still leaves a discoverable trail. This collapses the "no work flowed" report into the same surface — no Slack, no out-of-band notification.

## After the repo edit lands

The scheduled-task definition still points at the AppData upload, not the repo file. Christian must run the following **once, interactively** (only Christian can re-attach a new SKILL.md upload to a scheduled task — Codex/CC cannot do this from a session):

```
mcp__scheduled-tasks__update_scheduled_task(
  taskId: "keep-work-flowing",
  // attach the new .agents/skills/keep-work-flowing/SKILL.md as the task body
)
```

The plan doc explicitly notes this final step. Codex's `Done when` does NOT include the re-attachment — Codex can't perform it and we shouldn't gate close on it. Christian's re-attachment is a separate one-line follow-up in the closing comment after the repo PR merges.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| n/a | n/a | n/a | n/a | n/a | n/a |

No runtime wiring — pure SKILL.md edit + new operator skill file.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| n/a | n/a | No tunable game constants introduced. |

## Tracing

n/a — no runtime code path; the skill produces an operator-facing Linear comment, not a trace.

## Fail-soft table

| Failure | Fallback |
|---------|---------|
| Linear MCP `save_comment` fails (network, auth) | Skill emits the comment body in the agent's session output as a fenced code block, prefixed with `LINEAR COMMENT UNAVAILABLE — paste manually onto THR-XXX:`. The handoff itself (state transition) has already succeeded — the comment is the readable supplement. |
| No work to hand off (all queues empty / all candidates blocked on verdict) | Skill posts the standard handoff template on the most recent active project as a coordination note with `Status: idle cycle — see project board for blockers`. Run still produces a discoverable artefact. |
| `session-handoff` skill missing | Skill exists as of 2026-05-12 — if it goes missing again, the orchestrator emits a session-output warning naming the missing path, and falls back to inlining the comment template directly in `keep-work-flowing/SKILL.md`. Prevents the chain-of-skills failure mode that THR-442 originally tripped on. |

## NFP compliance

| NFP | Status |
|-----|--------|
| 1. Tunability | PASS — no game numbers introduced; skill is editorial. |
| 2. Inspectability | PASS — Linear comment is the inspection surface; survives across sessions and is queryable. |
| 3. Determinism | PASS — no PRNG, no game state. |
| 4. Fail-soft | PASS — fail-soft table covers Linear failure, empty queue, and missing-skill regression. |
| 5. Narrative over mechanical perfection | N/A — operator skill, not player-facing. |
| 6. Additive over destructive | PASS — adds new repo SKILL.md, removes one Slack-specific block; no other deletions. |
| 7. Performance | PASS — one extra `save_comment` per run. Negligible. |

## Three-pillar check

| Pillar | Status |
|--------|--------|
| Engine | N/A — no game-state change. |
| Content | N/A — no encounter / prose / attachment / world-model touched. |
| UI | N/A — operator-facing skill; the Linear comment is its only surface. |
| Wiring | All N/A — no module integration. |

## Rulebook impact

None. This does not change any rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss).

## Vision impact

None. No Vision premise touched.

## Done when (for executor)

- [ ] `.agents/skills/keep-work-flowing/SKILL.md` created in the repo with the content described above (Linear-comment template replacing Slack block; numbering fixed; duplicate frontmatter removed).
- [ ] `.agents/skills/session-handoff/SKILL.md` updated with the Guardrails one-liner clarifying scheduled-task behavior; `last_validated_against: 2026-06-12`.
- [ ] No `.claude/skills/` mirror created — `keep-work-flowing` is Cowork-audience-only per the `CLAUDE.md` skill-tree split; CC and Codex don't load it. (If `npm run check:skill-sync` blocks because a `keep-work-flowing` directory exists in only one tree, the script's shared-skill detection should already skip single-tree skills — verify by running the script; if it doesn't, the skill is genuinely Cowork-only and the script needs no change.)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green (paste evidence in closing comment — this is an editorial change so all three should be unaffected; verify nothing accidentally broke).
- [ ] Closing commit body includes `Fixes THR-442`.
- [ ] Closing Linear comment includes the one-line instruction for Christian: `Re-attach the new .agents/skills/keep-work-flowing/SKILL.md to the keep-work-flowing scheduled task via mcp__scheduled-tasks__update_scheduled_task. The repo edit alone does not propagate to the cron runtime until you re-upload.`

## Coordination block

- **Parallel-safe with:** any non-skill-edit work — this only touches `.agents/skills/keep-work-flowing/` and `.agents/skills/session-handoff/`. Safe to interleave with engine, content, or UI work.
- **Mutex with:** any other in-flight edit to `.agents/skills/keep-work-flowing/` or `.agents/skills/session-handoff/` (none open at the moment).
- **Files to touch:**
  - `.agents/skills/keep-work-flowing/SKILL.md` (NEW — create)
  - `.agents/skills/session-handoff/SKILL.md` (EDIT — one-line guardrail + date bump)
- **Codex review:** no — this is a doc edit small enough that the pre-commit hooks (skill-sync, type check, tests) catch all the structural failure modes.
