# THR-443 — Purge Slack from ways-of-working (Linear is the only coordination channel)

**Issue:** [THR-443](https://linear.app/threadbare/issue/THR-443) · **Project:** Continuous Improvement · **Status:** Ready for Dev
**Plan author:** Cowork, 2026-05-15 (`keep-work-flowing` run) · **Supersedes the open A/B/C question in [THR-442](https://linear.app/threadbare/issue/THR-442)**

---

## 1. Context — why this exists

Christian's directive (2026-05-15): **Slack is no longer used to coordinate.** Linear is the single source of truth — state transitions plus Coordination Block handoff comments, polled hourly by the executors. THR-442 surfaced the trigger: the `session-handoff` skill file does not exist in either skill tree, and the connected Slack MCP is read-only (no message-posting tool). The verdict on THR-442's A/B/C question is now in — **option B: drop Slack entirely, coordinate via Linear.** This ticket purges every remaining Slack reference from the ways-of-working surfaces.

This is a ways-of-working / process-documentation cleanup. It touches no runtime code, no game content, no player-facing surface.

## 2. Scope — verified against the repo (2026-05-15)

A live `grep -rniE 'slack'` sweep confirmed the issue body's file list and surfaced **one addition the issue body missed: `AGENTS.md:235`** (the non-CC-agent equivalent of `CLAUDE.md`, same vestigial-negative-mention category). The eval-review.html hits flagged by the issue body are confirmed false positives — "SLACK" appears inside a base64 blob, not as a tool reference.

### 2a. Active Slack dependencies — rewire to Linear

These instruct an agent to *do* something with Slack. Replace the action with a Linear-comment handoff.

| File | Lines (approx) | Current | Rewrite to |
|------|----------------|---------|------------|
| `Docs/plans/cowork-session-start-prompt.md` | 14 (job step 4) | "Run /session-handoff to notify the channel what CC should pick up next" | "Post the CC-pickup summary as a comment on the handed-off Linear issue, and surface the next Ready-for-Dev item." |
| `Docs/plans/cowork-session-start-prompt.md` | 40–61 (`## Session handoff` section + message-format block) | Run `/session-handoff`; skill at `.agents/skills/session-handoff/SKILL.md`; "Send a plain-text message to Slack channel C0AT5DYGJ8P" | Replace the whole section with a "## Session handoff (always last)" section that says: post the CC-pickup summary **as a comment on the handed-off Linear issue** (or, if no issue was handed off this session, as a comment on the most relevant In-Design/blocked issue). Keep the existing plain-text message-format block — it is good structure — but reframe it as "the body of that Linear comment" and drop the Slack channel line. Delete the `.agents/skills/session-handoff/SKILL.md` reference. |
| `Docs/drafts/weekly-project-hygiene-SKILL.md` | 12 | "End with `/session-handoff` to post the results to Slack." | "End by posting the consolidated findings summary as a comment on the Continuous Improvement project (or the most relevant filed issue) in Linear." |
| `Docs/drafts/weekly-project-hygiene-SKILL.md` | 139 | "Run `/session-handoff` at session end. The skill lives at `.agents/skills/session-handoff/SKILL.md` … post a Slack message … fall back to manual Slack." | Replace with a "Session end" step: post a single plain-text summary comment to Linear (the Continuous Improvement project or the issue cluster filed this run). No skill dependency, no Slack. |

### 2b. Vestigial negative mentions — rewrite, do not just delete

These only say "don't use Slack." They are guardrails in rejected-approaches lists. Deleting the word outright risks a future agent re-introducing Slack. Rewrite to drop "Slack" while keeping the Linear-only guardrail intact.

| File | Line | Current (verbatim fragment) | Rewrite to |
|------|------|------------------------------|------------|
| `CLAUDE.md` | 9 | "…no Slack message, no out-of-band notification, nothing else required." | "…no out-of-band notification of any kind — the Linear state transition plus the handoff comment is the entire handoff." |
| `CLAUDE.md` | 398 | "…The Linear state transition IS the closeout — no Slack, no DM, nothing out of band." | "…The Linear state transition IS the closeout — no out-of-band notification of any kind." |
| `AGENTS.md` | 235 | "…and let the auto-close fire. No Slack, no DM, nothing out of band." | "…and let the auto-close fire. No out-of-band notification of any kind — the Linear state transition is the handoff." |
| `Docs/canon/process.md` | 80 | "❌ Ad-hoc handoffs (Slack DMs, file pings, out-of-band messages) — replaced by Linear state transitions…" | "❌ Ad-hoc / out-of-band handoffs (file pings, DMs, side-channel messages) — replaced by Linear state transitions…" |

### 2c. The `session-handoff` skill reference

The `session-handoff` skill **does not exist** in `.claude/skills/` or `.agents/skills/` (confirmed by `ls`). It is referenced only by the two active-dependency files above. Resolution: **delete every reference** as part of the 2a rewrites. Do not author the skill — option B removes the need for it. THR-442 is closed as absorbed (see §5).

### 2d. Explicitly leave alone — verify, do not edit

- **Append-only historical records:** `Docs/impediments.md`, `Docs/changelog.md`, `Docs/project-history.md`, `Docs/ops/repo-automation-log.md`, `Docs/retrospectives/*` — immutable logs; Slack appears as a matter of historical record.
- `Docs/research/slack-thoughts-2026-03-11.md` — raw research material, not a ways-of-working doc.
- **Encounter-prose / design false positives** — `Docs/plans/encounters/road-ambush-*.md`, `pick-pocket-skill-test.md`, `2026-04-24-thr-253-chain-weakens-prose-polish.md`, `v7-design-pass/*`, attention-tier plans — "slack" is the ordinary English word (slack rope, slack jaw).
- `.claude/skills/image-manipulation-workspace/iteration-1/eval-review.html` and its `.agents/` mirror — "SLACK" appears inside a base64 blob. **Confirmed false positive.** Verify, do not edit.
- `.claude/worktrees/**` — stale CC worktree copies; ignore.

### 2e. Out of repo scope — split to a separate issue

The scheduled-task `SKILL.md` files live in OneDrive (`C:\Users\chris\OneDrive\Dokumenter\Claude\Scheduled\<taskId>\SKILL.md`), **outside the repo and outside the mounted Cowork workspace.** A repo executor cannot reach them. This portion is split out as its own issue (filed alongside this plan — see §5) and is **not** part of THR-443's Done-when. THR-443 is now cleanly, fully executor-completable.

## 3. Three-pillar coverage

- **Engine:** N/A — no runtime code, tick phases, graph schema, or PRNG touched.
- **Content:** N/A — no game content touched. The encounter-prose "slack" hits are explicitly excluded as English-word false positives (§2d).
- **UI:** N/A — no player-facing surface, component, modal, or HexMap signifier touched.

Rationale: this is a ways-of-working / process-documentation cleanup. The three-pillar rule is satisfied by explicit N/A with rationale per the Design Governance section of `CLAUDE.md`.

## 4. NFP compliance

| NFP | Verdict | Note |
|-----|---------|------|
| 1 — Tunability | N/A | No magic numbers; docs-only change. |
| 2 — Inspectability | N/A | No runtime behaviour; nothing to trace. |
| 3 — Determinism | N/A | No PRNG or simulation surface. |
| 4 — Fail-soft | N/A | No tick-loop path. (Process fail-soft: the handoff already degrades safely — the Linear state transition is authoritative regardless of any notification, which is precisely why Slack can be dropped.) |
| 5 — Narrative over mechanical | N/A | No content. |
| 6 — Additive over destructive | PASS with note | The 2b rewrites are edits-in-place of guardrail text, not deletions — guardrail intent is preserved, only the obsolete tool name is removed. The 2a rewrites replace a dead dependency with a working one. The `session-handoff` references are deleted because the skill never existed; nothing functional is lost. |
| 7 — Performance budget | N/A | No runtime path. |

## 5. Companion issue (filed with this plan)

**[THR-444](https://linear.app/threadbare/issue/THR-444) — Purge Slack from OneDrive scheduled-task SKILL.md files** — filed in Continuous Improvement, **Todo** state, as a child of THR-443 (not Ready for Dev — it is not executor-doable; it needs Christian or an interactive session with OneDrive filesystem access). Scope: check all scheduled-task `SKILL.md` files for `/session-handoff` and Slack references — `keep-work-flowing` (confirmed affected), `weekly-project-hygiene`, `daily-backlog-grooming`, `weekly-workflow-retro`, `keep-codex-flowing`, `threadbearer-load-balance-work-between-development-agents`, `update-product-strategy` — and rewrite affected ones to the Linear-comment handoff. THR-443's executor does **not** own this.

**THR-442 disposition:** absorbed into THR-443. THR-442's open A/B/C question is resolved (option B). The executor should add a closing comment to THR-442 noting it is absorbed; leave the terminal-state transition to backlog grooming / Christian per the existing THR-442 comment. (THR-443's Done-when does not gate on THR-442's state.)

## 6. Done when

- [ ] `grep -rniE 'slack'` across `CLAUDE.md`, `AGENTS.md`, `Docs/canon/`, `Docs/plans/cowork-session-start-prompt.md`, `Docs/drafts/`, `.claude/skills/`, `.agents/skills/` returns only the confirmed false positives (the two `eval-review.html` base64 hits) or zero.
- [ ] `grep -rniE 'session-handoff'` across the repo returns zero hits (all references deleted with the 2a rewrites).
- [ ] Active dependencies (`cowork-session-start-prompt.md`, `weekly-project-hygiene-SKILL.md` draft) rewired to Linear-comment handoffs per the §2a table.
- [ ] Vestigial negative mentions in `CLAUDE.md` (×2), `AGENTS.md` (×1), and `Docs/canon/process.md` (×1) rewritten per the §2b table — guardrail intent preserved, "Slack" removed.
- [ ] Historical logs, the research doc, and encounter-prose false positives confirmed untouched (§2d).
- [ ] A closing comment added to THR-442 noting it is absorbed into THR-443 (no state change — leave to grooming).
- [ ] `npm run check:process` advisory lint still passes. Docs-only change — no test/build gate applies; state that explicitly in the closing commit body (`Browser-verify exempt: docs-only, no runtime UI`).
- [ ] Closing commit body includes `Fixes THR-443`.

## 7. Coordination block

- **Suggested model:** sonnet — mostly mechanical find-and-rewrite, but the §2b negative-mention rewrites need light judgment to preserve guardrail intent, and the §2a section rewrite of `cowork-session-start-prompt.md` needs care to keep the message-format block useful. (`model:sonnet` label applied on handoff.)
- **Parallel-safe with:** THR-383, THR-425, THR-163, THR-434, THR-406 — no shared files.
- **Mutex with:** none currently. Note: this issue edits `CLAUDE.md` and `AGENTS.md` — any future in-flight issue editing either file becomes mutex with this one until it lands.
- **Codex review:** no — docs-only, no code paths.
