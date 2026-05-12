# THR-421: Move upstream-shipped check forward in `pull-work`

**Date:** 2026-05-12
**Author:** Cowork (keep-work-flowing scheduled task)
**Status:** Ready for Dev
**Linear:** THR-421
**Source retro:** `Design/retros/retro-2026-05-11.md` (Experiment #2)

## Summary

Both executor pickup paths — fresh-claim from Ready-for-X and resume-from-In-Dev — must run an upstream-shipped check before drafting code. Today only the fresh-claim path is partially protected (via the WIP=1 gate that exits cleanly when an In Dev exists), and the resume path bypasses the check entirely. Five cross-executor collisions in two weeks (impediments #99, #114, #121, #122, #127) — average loss ~30–45 min of redundant CC implementation + an abandoned PR per collision.

This plan defines the exact text edits in two surfaces (the `pull-work` skill that CC loads, and the coordination protocol doc that Codex follows) plus a manual rehearsal so the executor can confirm the check actually fires on a real "already landed" condition before commit.

This is a process / skill text change. Engine, Content, and UI are **N/A**.

## Problem

Linear's `assignee` claim is non-atomic. Two executors can each successfully claim the same issue, verify their claim, and start work — race-conditioned on the post-claim verification window. The check that actually proves the work is still open is `git log origin/main --grep "Fixes <issue-id>"` against fresh `origin/main`. That check is not currently part of either pickup path:

| Path | Today | Gap |
|---|---|---|
| **Fresh claim** (Ready for Dev → In Dev) | Step 4 verifies the claim stuck; Steps 5–7 read plan doc and start work. | No `git log` check on `origin/main` after claim. Race window: executor A claims, then B claims; A verifies and starts; B ships before A; A's work is wasted. |
| **Resume from In Dev** (already-mine) | Documented in `Docs/plans/2026-04-13-linear-coordination-protocol.md` (CC Session Start step 1, Codex Session Start step 1) as "resume your own active implementation first." Pull-work's Step 1.5 EXITS when In Dev is detected — there is no documented resume path inside pull-work. | If the agent's last session's work was merged by the other executor in the interim, the resume path skips that detection and re-writes the same change. Impediment #127 is the documented failure. |

### Why the WIP=1 gate doesn't already solve this

Step 1.5 of `pull-work` (WIP=1 gate) exits cleanly when an In Dev assignment is detected for the executor's own assignee. That exit is correct under normal conditions (CI in flight, merge auto-close pending). But it never runs `git log` against `origin/main` to confirm the In Dev issue is genuinely still open. The result: an issue can sit in In Dev while its commit has already landed (e.g., the merge keyword was wrong and the auto-close webhook never fired, or the webhook is lagging). The resume path then re-implements landed work.

The fix is small: add one ~5-line `git log` block at two well-defined insertion points. Mirror to `.agents/`. Edit the Codex Session Start prose.

## Fix

### Edit 1 — `.claude/skills/pull-work/SKILL.md` (canonical)

#### 1a. Add the check inside `pullNextReadyForDev` wrapper

Between current step 3 ("Verify") and current step 4 ("Fetch latest comment"), insert a new step 3.5:

```markdown
3.5. **Upstream-shipped check (Rule 9: don't re-do shipped work)** — run:

    git fetch origin main
    git log origin/main --grep="Fixes ${id}" --grep="Closes ${id}" --grep="Resolves ${id}" --regexp-ignore-case --extended-regexp --oneline

If the result is non-empty, the work has already landed but Linear's auto-close
either lagged or failed. Do NOT proceed to read the plan doc or write code.
Release the claim, post a one-line comment on the issue noting the upstream
commit hash + first-line message, and exit cleanly. Update the trace output to
reflect the upstream-shipped path (see Trace output format below).

    save_issue(id, assignee: null, state: "Ready for Dev")
    save_comment(issueId: id, body: "Upstream-shipped check found commit {sha} on origin/main: \"{first-line}\". Auto-close did not fire — please verify the keyword in the merge commit body and close manually if appropriate.")
```

Update the trace-output block to include the upstream-shipped path:

```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
[pullNextReadyForDev] Upstream check: found commit a1b2c3d "feat(thr-247): ..." — releasing claim, posting comment. Exiting clean.
```

#### 1b. Add a parallel check inside Step 4 (fallback path)

Step 4 currently ends after the verify retry loop. Add a new Step 4.4 between current Step 4 and Step 4.5 (worktree isolation):

```markdown
### Step 4.4 — Upstream-shipped check (Rule 9)

After the claim is verified (Step 4) and before worktree isolation (Step 4.5), run:

    git fetch origin main
    git log origin/main --grep="Fixes <issue-id>" --grep="Closes <issue-id>" --grep="Resolves <issue-id>" --regexp-ignore-case --extended-regexp --oneline

If the result is non-empty, the work has already landed. Do not proceed.

1. Release the claim: `save_issue(id, assignee: null, state: "Ready for Dev")`.
2. Post a one-line comment on the issue noting the upstream commit hash + first-line message and that the auto-close did not fire.
3. Exit cleanly.

**Trace lines** (NFP #2):

    [pull-work] Step 4.4: upstream-clean. Continuing to worktree isolation.
    [pull-work] Step 4.4: upstream-shipped — commit a1b2c3d "feat(thr-247): ..." on origin/main. Releasing claim, exit.

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue,
sandbox limitation), log the error and proceed to Step 4.5 anyway. The
upstream-shipped check is best-effort — a fetch failure must not block
pickup of genuinely open work. Surface a one-line warning in the session log.
```

#### 1c. Add a new Step 1.7 — Resume-from-In-Dev path

Currently Step 1.5 exits clean when the executor's "In Dev" slice is non-empty. Replace the single-entry case (`WIP_GATE_EXIT_CODE_SINGLE = 0` — "exit clean") with a resume sub-step. The multi-entry case (Rule 6 cross-session leak) stays unchanged.

Update Step 1.5 to read:

```markdown
### Step 1.5 — WIP=1 gate (Rule 6 enforcement) + resume routing

If the Step 1 board scan's "In Dev" slice filtered to `assignee:"me"` is empty,
continue to Step 2.

If the slice has more than one entry, this is a Rule 6 violation. Output the
surface message and exit 1.

    [pull-work] Step 1.5: WIP=1 gate — multiple In Dev assigned to me ({issueIds}). Cross-session leak. Surface and stop.

If the slice has exactly one entry, route to Step 1.7 (resume-from-In-Dev) instead of exiting clean. The resumed issue may have shipped while the session was paused; the upstream-shipped check decides whether to resume work or stand down.
```

Add a new Step 1.7 after Step 1.5:

```markdown
### Step 1.7 — Resume-from-In-Dev — upstream-shipped check

When Step 1.5 detects exactly one In Dev issue assigned to the executor,
run the upstream-shipped check on that issue before doing any other work
(including reading comments or plan doc).

    git fetch origin main
    git log origin/main --grep="Fixes <resumed-issue-id>" --grep="Closes <resumed-issue-id>" --grep="Resolves <resumed-issue-id>" --regexp-ignore-case --extended-regexp --oneline

**If the result is empty:** the work is genuinely still in flight. Continue from
Step 5 (Reopened safety check) — skip Steps 2–4 (cross-executor parallel,
coordination block, claim) because the claim already exists.

**If the result is non-empty:** the commit landed but the auto-close did not fire.
1. Post a comment on the issue: `Upstream-shipped check during resume found commit {sha} \"{first-line}\". Auto-close did not fire — please verify the merge keyword in the commit body and close manually if appropriate.`
2. Do NOT release the claim (leaving the issue In Dev preserves the audit
   trail; the human reviewer can close it manually after verifying the
   commit). Do NOT call `save_issue(state: "Done")` — Rule 3 forbids it.
3. Exit cleanly.

**Trace lines** (NFP #2):

    [pull-work] Step 1.7: resume THR-247 — upstream-clean. Continuing to Step 5.
    [pull-work] Step 1.7: resume THR-247 — upstream-shipped, commit a1b2c3d. Posting comment, exit.

**Fail-soft:** same as Step 4.4 — a `git fetch` failure logs a warning and
proceeds to Step 5 (resume in flight). The check is best-effort and must
not strand a real in-flight issue when the network is unavailable.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `UPSTREAM_GREP_KEYWORDS` | `Fixes\|Closes\|Resolves` | Auto-close keywords accepted by Linear |
| `RESUME_UPSTREAM_FAIL_SOFT` | `true` | If `git fetch` fails, proceed to Step 5 rather than refusing resume |
```

#### 1d. Update the "Refuses To Proceed When" section

Append two bullets:

```markdown
- The upstream-shipped check (Step 4.4 fresh-claim or Step 1.7 resume) finds a `Fixes <issue-id>` / `Closes <issue-id>` / `Resolves <issue-id>` commit on `origin/main`. Pickup exits with a comment noting the upstream commit hash; the human reviewer closes the issue manually if appropriate.
```

### Edit 2 — `.agents/skills/pull-work/SKILL.md` (mirror)

Same edits as Edit 1, applied via `npm run check:skill-sync:sync` after editing the canonical `.claude/` copy. No manual editing of the `.agents/` file — it is regenerated from the canonical.

### Edit 3 — `Docs/plans/2026-04-13-linear-coordination-protocol.md`

Codex follows the prose protocol, not the pull-work skill. Two insertions:

#### 3a. CC Session Start (replaces existing step 1 ordering)

The CC Session Start section currently bullet-lists state queries but doesn't make resume-after-shipped-check explicit at the protocol level (only inside the pull-work skill). Add a note at the end of the CC Session Start subsection pointing readers at the pull-work skill's Step 1.7 for the canonical resume path:

```markdown
**Resume-from-In-Dev safety:** When `list_issues state:"In Dev" assignee:"me"` returns a single entry, the `pull-work` skill's Step 1.7 runs an upstream-shipped check (`git log origin/main --grep "Fixes <issue-id>"`) before continuing. If the commit landed but auto-close didn't fire, pickup exits cleanly with a comment on the issue. See `.claude/skills/pull-work/SKILL.md` § Step 1.7 for the exact commands and fail-soft semantics.
```

#### 3b. Codex Session Start — insert step between current 1 and 2

Codex follows the prose protocol verbatim. Current step 1 ("resume your own active implementation first") is the unsafe path; add a new step 1.5 before continuing to step 2:

```markdown
1.5. **Upstream-shipped check on the resumed issue (Rule 9).** If step 1 returned an `In Dev` issue assigned to me, before reading any handoff comment or plan doc, run:

    git fetch origin main
    git log origin/main --grep="Fixes <issue-id>" --grep="Closes <issue-id>" --grep="Resolves <issue-id>" --regexp-ignore-case --extended-regexp --oneline

If the result is non-empty, the work has already landed but Linear's auto-close did not fire. Post a comment noting the upstream commit hash + first-line message and that the auto-close did not fire. Do not call `save_issue(state: "Done")` (Rule 3). Do not continue to step 2. Exit cleanly.

If the result is empty, continue resuming. If `git fetch` errors (network down, sandbox limitation), log a warning and continue resuming — the check is best-effort and must not strand a real in-flight issue.

Surface in cron log:

    [codex-pickup] Step 1.5: resume THR-XXX — upstream-clean. Continuing to step 2.
    [codex-pickup] Step 1.5: resume THR-XXX — upstream-shipped, commit a1b2c3d. Posted comment, exit.
```

#### 3c. Codex Pickup Protocol — insert step between current 2 (verify) and 3 (read latest comment)

Add a step 2.5 mirroring the pull-work Step 4.4:

```markdown
2.5. **Upstream-shipped check (Rule 9).** Before reading the latest comment, run:

    git fetch origin main
    git log origin/main --grep="Fixes <issue-id>" --grep="Closes <issue-id>" --grep="Resolves <issue-id>" --regexp-ignore-case --extended-regexp --oneline

If the result is non-empty, the work has already landed. Release the claim (`save_issue(id, assignee: null, state: "Ready for Codex")`), post a comment noting the upstream commit, and exit cleanly. See `.claude/skills/pull-work/SKILL.md` § Step 4.4 for the equivalent path on the CC side.

Fail-soft on `git fetch` errors (log warning, proceed to step 3).
```

#### 3d. Add "Rule 9" to the Hard Rules section

The existing Hard Rules are numbered 1–9 (per CLAUDE.md reference to "Rules 1–10" but the doc currently shows up through Rule 8 plus an unnumbered codex-reviewer rule). Add an explicit Rule 9 entry capturing the upstream-shipped invariant:

```markdown
### Rule 9: An executor must never write code for work that has already shipped

Before reading a plan doc or writing any file in either pickup path
(fresh-claim from Ready for X, or resume-from-In-Dev), the executor must
run `git log origin/main --grep "Fixes <issue-id>"` (plus Closes / Resolves
variants) against a freshly fetched `origin/main` and confirm the result is
empty. If a matching commit exists, the work has landed and the only
remaining task is to surface the auto-close failure to the human reviewer.

**Why:** Linear's `assignee` claim is non-atomic; two executors can each
successfully claim the same issue and verify their claim, then race on
implementation. The merged commit on `origin/main` is the only sanctioned
proof that the work is genuinely done. Five collisions in two weeks
documented this gap (impediments #99, #114, #121, #122, #127).

**Where implemented:**
- CC fresh-claim: `pull-work` Step 4.4 (and the `pullNextReadyForDev` wrapper's step 3.5)
- CC resume: `pull-work` Step 1.7
- Codex fresh-claim: Codex Pickup Protocol step 2.5
- Codex resume: Codex Session Start step 1.5

**Fail-soft:** a `git fetch` failure logs a warning and proceeds (resume) or
continues to coordination check (fresh-claim). The check is best-effort.
```

(If the Hard Rules section turns out to already top out at Rule 10 — verify in the implementation pass — renumber accordingly. The canonical rule text stays the same.)

## Done when

- [ ] `.claude/skills/pull-work/SKILL.md` has Steps 1.7 (resume upstream check), 3.5 (inside `pullNextReadyForDev`), and 4.4 (fallback path), each with the trace lines specified above.
- [ ] `.agents/skills/pull-work/SKILL.md` is the byte-for-byte mirror after `npm run check:skill-sync:sync`.
- [ ] `Docs/plans/2026-04-13-linear-coordination-protocol.md` has CC Session Start resume note, Codex Session Start step 1.5, Codex Pickup Protocol step 2.5, and Rule 9.
- [ ] `last_validated_against` in `.claude/skills/pull-work/SKILL.md` bumped to today's date (2026-05-12).
- [ ] **Manual rehearsal:** in a throwaway worktree, create a commit on a feature branch with `Fixes THR-999999` in the body, merge it to a local `main`, then invoke pull-work targeting THR-999999. Confirm Step 4.4 detects the commit and exits cleanly with the expected trace line. Document the rehearsal output in the commit body.
- [ ] `npm test` passes.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] `npm run check:process` clean (advisory).
- [ ] Browser-verify: **exempt — types-only / process / docs change, no runtime UI surface touched.** State this exemption in the commit body.
- [ ] Closing commit body includes `Fixes THR-421` keyword for auto-close.

## Three-pillar check

- **Engine:** N/A — skill text + protocol doc edits only.
- **Content:** N/A.
- **UI:** N/A — no player-facing surface, no debug bridge, no HexMap signifier.
- **Wiring:** `.claude/skills/pull-work/SKILL.md` (canonical), `.agents/skills/pull-work/SKILL.md` (mirror via `check:skill-sync:sync`), `Docs/plans/2026-04-13-linear-coordination-protocol.md` (Codex source-of-truth). No code module wiring.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | New constants `UPSTREAM_GREP_KEYWORDS`, `RESUME_UPSTREAM_FAIL_SOFT` documented in Step 1.7. |
| 2. Inspectability | PASS | Explicit trace lines added for happy path, upstream-shipped path, and fail-soft path on both resume and fresh-claim. |
| 3. Determinism | PASS | `git log` on a fetched `origin/main` is deterministic given the same commit graph. |
| 4. Fail-soft | PASS | `git fetch` failure logs a warning and proceeds — pickup is never blocked by a network/sandbox issue. |
| 5. Narrative over mechanical perfection | N/A | Process change. |
| 6. Additive over destructive | PASS | New steps inserted; existing steps unchanged except Step 1.5's single-entry case is rerouted to Step 1.7 (which is the only behavioral subtraction — and it adds back a richer outcome, not removes safety). |
| 7. Performance budget | PASS | Two extra commands per session (`git fetch`, `git log`) — negligible. |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `UPSTREAM_GREP_KEYWORDS` | `Fixes\|Closes\|Resolves` | Auto-close keywords accepted by Linear's merge integration. Must match Linear's documented keyword set. |
| `RESUME_UPSTREAM_FAIL_SOFT` | `true` | When `true`, a `git fetch` failure during Step 1.7 logs a warning and proceeds to Step 5 (resume). When `false`, treats fetch failure as an abort condition. Default `true` so network/sandbox issues never strand in-flight work. |
| `FRESH_CLAIM_UPSTREAM_FAIL_SOFT` | `true` | Same semantic for Step 4.4 fresh-claim path. |

## Tracing

All new behavior emits trace lines on stdout in the existing `[pull-work] Step X.X:` format (NFP #2). No new structured trace type added — these are session-log lines, not engine traces. See SKILL.md edits above for exact format.

## Fail-soft table

| Failure | Behavior |
|---|---|
| `git fetch origin main` fails (network, auth, sandbox) | Log warning, proceed (resume → Step 5; fresh-claim → Step 4.5). The upstream-shipped check is best-effort. |
| `git log` returns empty | Continue normally — issue is genuinely open. |
| `git log` returns a match but `save_comment` errors | Log error, surface to session, exit anyway (do not proceed to write code). |
| `save_issue(assignee:null)` errors when releasing claim on fresh-claim path | Log error, surface to session, exit. The next executor will retry and silent-drop retry logic in Step 4 will eventually reassign. |
| Multiple matching commits on `origin/main` (unusual) | Use the most recent commit (`--max-count=1`) for the comment body; treat as shipped regardless. |

## Files to touch

- `.claude/skills/pull-work/SKILL.md` — add Steps 1.7, 3.5 (inside `pullNextReadyForDev`), 4.4, update Step 1.5 routing, append "Refuses To Proceed When" bullet, bump `last_validated_against`.
- `.agents/skills/pull-work/SKILL.md` — regenerated via `npm run check:skill-sync:sync`. Do NOT hand-edit.
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — add Rule 9, CC Session Start resume note, Codex Session Start step 1.5, Codex Pickup Protocol step 2.5.
- (closing) `Docs/changelog.md` — append the THR-421 row per Definition of Done.

## Out of scope

- Authoring an automated test for the upstream-shipped check. The behaviour is a `bash`/`git` invocation gated by `if` — there is no codepath to unit-test inside the repo. The manual rehearsal (see "Done when") is the documented verification.
- Changing Linear MCP behaviour (the `save_issue` silent-drop is impediment #48; the workaround is already in place via verify-after-write).
- Adding a Slack notification when Step 1.7 / 4.4 fires. Out of scope; the comment on the Linear issue is the canonical notification.
- THR-422's session-handoff skill restore. Tracked separately; not blocking this work.

## Suggested executor

**Sonnet (CC).** The work is mechanical skill-text + protocol-doc editing with one manual rehearsal — sonnet handles it cleanly. Apply `model:sonnet` label to the issue. **Codex-review: yes** — process changes to pickup paths benefit from a second pair of eyes; queue a `/codex:review` after the implementation commit.

## Related

- Linear: THR-421
- Retro: `Design/retros/retro-2026-05-11.md` (Experiment #2)
- Impediments: #99 (THR-102), #114 (THR-311), #121 (THR-345), #122 (THR-353), #127 (THR-360)
- Coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- Companion experiment: THR-420 (`.gitattributes` — already in working tree per Cowork status comment 2026-05-12, awaiting verify-and-close commit)
- Companion experiment: THR-422 (recreate session-handoff skill — independent; tracks separately)
