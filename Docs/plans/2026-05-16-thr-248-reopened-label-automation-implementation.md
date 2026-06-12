# THR-248 — Linear Automation: apply `Reopened` label on Done → Started transitions

**Status:** Ready for Dev (CC handoff)
**Project:** Agent Coordination Protocol
**Parent design:** `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 3
**Sibling in flight:** THR-249 (Investigation 1 — auto-close repoint to In Review). The two are independent (different Linear settings, different protocol edits) and can land in parallel.

## Purpose

Make Rule 5 of the coordination protocol (`Reopened` label on Done → Started transitions) structural rather than disciplinary. Today an agent or human who moves an issue Done → Ready for Dev has to remember to add the label by hand; a forgotten label compounds with Rule 4 (read latest comment first) failure and is what produced the 2026-04-18 premature-close incident. Native Linear Automation eliminates the "I forgot" path.

## What ships

1. **Linear Automation** (user action — Christian, ~30s in Linear Settings):
   ```
   TRIGGER: Issue state changed
   CONDITION: previous state category = "Completed" AND new state category = "Started"
   ACTION 1: Add label "Reopened"
   ACTION 2: Post comment "This issue was reopened on {now} by {actor}. Read the latest comment and all comments back to the original handoff before acting."
   ```
   Configured in Linear Settings → Threadbare team → Automations → New Rule. Standard tier or above required (Threadbare already uses automations elsewhere — confirmed available).

2. **Rule 5 protocol-doc update** (CC action — `Docs/plans/2026-04-13-linear-coordination-protocol.md`):
   - Append a structural-reinforcement note to the Rule 5 paragraph: "Automated via Linear Automation on Done → Started transitions; manual application is a fallback only."
   - In the "Coordination Failure Modes — Hard Rules" section, change the Rule 5 enforcement column from "Doctrine" to "Doctrine + Linear Automation" (or equivalent wording — keep parallel structure with Rule 3 after THR-249 lands).
   - Reference this issue (`THR-248`) and the parent doc (`Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 3) inline.

3. **Audit query / weekly-hygiene note** (CC action — minor protocol-doc addition):
   - Document the detection query for Rule 5 violations: `list_issues(state: started-category, label: "Reopened"=false)` filtered to issues with `completedAt != null` (i.e. they were Done at some point) catches missed labels. Park as a one-liner in the Rules section; no code needed for it to be useful.

## Sequencing

**Christian must enable the Automation before this PR merges**, OR after the merge but before the next reopen event — either works because Rule 5 wording survives the order swap. The PR description should:

- Say which Linear settings step Christian needs to take (with screenshot if practical).
- Note that the Rule 5 doc edit doesn't depend on the Automation existing yet — the doc reflects the target state.

If Christian wants to verify the Automation before believing the doc edit, the verification step (below) covers that.

## Verification

The acceptance is binary and the test is short:

1. After Christian configures the Automation: pick any low-stakes Done issue (e.g. a closed retrospective drift issue), transition it Done → Ready for Dev manually.
2. Within seconds, the Automation should add the `Reopened` label and post the configured comment.
3. Transition the issue back to Done to leave it in its original state. The label can be left on (or removed manually) — it's not consequential on a closed audit issue.
4. Paste the Linear issue-history block as evidence in the PR/closing comment.

If the Automation doesn't fire: check Linear Settings → Threadbare → Automations to confirm the rule is enabled, and that the `Reopened` label exists in the team (if missing, Christian creates it; the Automation will fail silently otherwise).

## Three-pillar coverage

- **Engine:** N/A — coordination-layer infrastructure, no game-surface touch.
- **Content:** N/A — same.
- **UI:** N/A in the game sense; Linear's own UI surfaces the Automation comment to humans. No work needed.
- **Wiring:** Linear Settings → Automations → state-change trigger → label + comment actions. Protocol doc reflects new enforcement reality.

## NFP compliance

| # | Status | Note |
|---|--------|------|
| 1 Tunability | N/A | No numeric tuning surface. |
| 2 Inspectability | PASS | Automation runs are logged in Linear's built-in audit trail; the auto-posted comment makes the reopen visible at-a-glance in the comment timeline. |
| 3 Determinism | N/A | Coordination layer; determinism concerns are per-session, not global. |
| 4 Fail-soft | PASS | If the Automation breaks or the team tier changes, Rule 5 doctrine remains as fallback — agents continue to label manually. Weekly hygiene sweep detects missed labels via the audit query (item 3 above). |
| 5 Narrative over mechanical | N/A | No narrative surface. |
| 6 Additive over destructive | PASS | Adds automation; Rule 5 doctrine softens, doesn't retire. The discipline still works in the fallback case. |
| 7 Performance budget | PASS | Event-driven, fires on individual state transitions; no polling, no cron. |

## Fail-soft table

| Failure case | Detection | Fallback behaviour |
|--------------|-----------|---------------------|
| Linear Automation disabled | Weekly hygiene sweep finds reopened issues missing `Reopened` label | Manual label per Rule 5 doctrine (already in place today) |
| `Reopened` label missing from team | Automation logs an error in Linear's automation audit log; weekly sweep also catches it | Recreate the label; doctrine carries until label restored |
| Comment-action permission failure | Same — Linear audit log surfaces it | Label action still fires (independent action); doctrine carries on the comment side |

## Action items for the executor

The plan above is the breakdown. Concretely:

1. **Read** `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 3 for the analysis that motivated this design.
2. **Edit** `Docs/plans/2026-04-13-linear-coordination-protocol.md`:
   - Append the structural-reinforcement note to the Rule 5 prose paragraph.
   - Update the Rule 5 row in the enforcement table (if it exists) — column should now read "Doctrine + Linear Automation" or equivalent.
   - Add the one-line audit-query note for Rule 5 violations.
3. **Write the PR description** to include:
   - Sequencing note (Christian's settings step before merge — see "Sequencing" above).
   - A bulleted list of the four Automation fields (TRIGGER / CONDITION / ACTION 1 / ACTION 2) verbatim, so Christian can copy-paste them into Linear's Automation builder without reading the parent design doc.
   - The verification protocol (item 4 in "Verification" above).
4. **Closing commit** references `Fixes THR-248` and includes the Linear issue-history block from the verification test as evidence. Per the merge-to-main auto-close pattern, do NOT manually transition to Done.

## Done when

- [ ] Christian has configured the Linear Automation in Threadbare team settings (one-time user action; coordinate via PR description).
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` Rule 5 prose updated with structural-reinforcement note.
- [ ] Rule 5 enforcement-table row updated (if the table exists in the doc; check the "Coordination Failure Modes" section).
- [ ] Audit-query for Rule 5 violations documented in the same protocol doc.
- [ ] Closing commit references `Fixes THR-248` and includes verification evidence (Linear issue-history block from the test transition).

## Coordination block

- **Suggested model:** haiku (matches existing `model:haiku` label on the issue — Rule 10 gate; this is a config + protocol-doc edit, no engine work, well within haiku capability).
- **Parallel-safe with:** THR-249 (Investigation 1 — auto-close repoint to In Review; sibling work, different files, different Linear settings), THR-406 (different files), any non-protocol-doc work.
- **Mutex with:** none on the code side. The Linear settings change is a user action; CC's doc-edit doesn't conflict with anything in flight.
- **Codex review:** no (single protocol-doc edit + PR-description authoring; well below review threshold; sibling THR-249 also opted out for the same reason).

## Related

- Parent doc: `Docs/plans/2026-04-23-linear-workflow-hardening.md` § Investigation 3.
- Sibling in flight: THR-249 (Investigation 1).
- Future sibling (deferred): THR-250 (Investigation 4 — stale-claim auto-release; relies on this Automation to apply `Reopened` after auto-release transitions).
- Coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md` Rule 5.
