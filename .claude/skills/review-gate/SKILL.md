---
name: review-gate
description: The automatic code-review gate (THR-1691). Run before arming auto-merge on any code PR — a cold, suspicious reviewer subagent reviews the diff against the Threadbare rubric, a second subagent tries to refute each finding, the author fixes or rebuts what survives (max 2 rounds), and a receipt is written. The PreToolUse hook `.claude/hooks/review-gate.sh` denies `gh pr merge` on a code diff without a clean receipt. Triggers on "review gate", "code review before merge", "review receipt", "the merge was blocked by the review gate".
last_validated_against: 2026-10-04
---

# Review gate

Nobody reviews code before it merges here — Christian is chat-only and does not read diffs (THR-608), and the pickup lane writes, tests and ships its own work. Tests certify what they assert; they do not see a reader with no writer, a bare location sweep, an id in a property bag. This gate is that reader. It **blocks**: the hook refuses `gh pr merge` until a clean receipt exists. (The last review gate was advisory and was deleted as decorative — THR-487, THR-269.)

**When:** every code PR, after the local gates pass and the closeout edits are committed, **immediately before `gh pr merge --auto --merge`**. A docs-only diff (`npm run classify:diff`) skips the gate — the hook allows it.

**Cost:** two to four subagent runs per PR. **Sunset:** the weekly retro renews the gate at six weeks (from 2026-10-02) only by citing confirmed defects it caught, counted from the PR comments (`gh search prs "review-gate-receipt" --repo christianspliid-ui/threadbare`); otherwise it is deleted.

## Procedure

1. **Freeze the diff.** Commit everything. `git diff origin/main...HEAD > "$SCRATCH/review.diff"` and note `git rev-parse HEAD`.
2. **Round 1 — cold reviewer.** Spawn a fresh `general-purpose` Agent (foreground) with the *Reviewer prompt* below, the diff path and the repo root. Give it **nothing else** — no ticket, no plan doc, no PR body, no commit messages, no summary of what you meant. Confident framing is what fools reviewers (88% in the study this gate is built on), and every one of our summaries is confident.
3. **Verify.** If the reviewer returned findings, spawn a second fresh Agent with the *Verifier prompt* and the findings JSON. It tries to refute each one. Only `CONFIRMED` findings survive; drop the rest.
4. **Fix or rebut.** For each confirmed finding: fix it (new commit), or write a one-line rebuttal grounded in code (`file:line` that proves the scenario cannot happen). A rebuttal goes back to the verifier with the finding; if the verifier still confirms it, it stays `open`.
5. **Round 2 (only if step 4 changed code or had rebuttals).** Re-run steps 1–3 on the new diff. **Two rounds maximum — never loop.**
6. **Write the receipt.** Build `findings.json` — `{"rounds": N, "findings": [{"severity","file","line","summary","disposition"}]}`, disposition `fixed | rebutted | open`, one row per confirmed finding (an empty list is a valid, clean receipt) — then:
   ```bash
   node --experimental-strip-types scripts/review-gate.ts write-receipt "$SCRATCH/findings.json" > "$SCRATCH/review-comment.md"
   ```
   It stamps `.claude/review-receipts/<HEAD>.json` (gitignored) and prints the PR comment.
7. **Publish and arm.** After `gh pr create`: `gh pr comment <N> --body-file "$SCRATCH/review-comment.md"`, then `gh pr merge --auto --merge`. The comment carries a `<!-- review-gate-receipt sha=… open=… -->` marker, so a later session in another worktree passes the hook from the comment alone.
8. **Findings still open after round 2:** do **not** arm. **Still write the receipt and post its comment** (step 6–7's `write-receipt` with the open rows; the marker reads `open=N`, N > 0) — that marker is how the next session recognises the park. Leave the PR open and unarmed, post a ticket comment naming each open finding (`file:line` — summary) and the head reviewed, and take pull-work's park disposition (unassign, state stays In Dev). **Do not write a `Hold:` line into the PR body** — a held PR is invisible to the duty that resumes it. The "fresh session" that picks it up is the pickup lane's Step 0.8 unstick duty (THR-1735), which treats an `idle` PR whose newest receipt marker has `open > 0` as its own: the first run whose liveness test finds the branch idle merges `origin/main`, runs a **new review cycle** on the head (the two-round cap is per cycle, not per PR), fixes or rebuts what survives, writes the receipt and arms. `keep-work-flowing-cc` lists the park under § Health, never as a Christian ask.

**What the hook accepts** (`scripts/review-gate.ts`, `decideReviewGate`): a docs-only diff; a `Review-gate exempt: <reason>` line alone on a line in a commit body of the range (audited by the weekly retro — for reverts and emergencies, not convenience); a receipt for the PR head with zero `open` findings; a receipt for an **ancestor** whose delta to head is docs-only, counting only files in the PR's own diff (closeout docs written after the review, or a `git merge origin/main` — main's code is not this PR's); a PR-comment marker for the head with `open=0`. Anything else is denied, including a named PR whose head is not in the repo even after a fetch. A gate that errors **allows with a loud warning** and logs to `.claude/review-receipts/gate-errors.log` — fail-soft, never silent. Commands are tokenised, and each line, `;`, `&&` or `|` segment is checked: the words `gh pr merge` inside a quoted commit message or PR body are not a merge, while a re-arm after a disarm on the same line is. A bare `gh pr merge` is judged against the PR's **remote** head, because that is what GitHub merges, not this tree's HEAD.

**Code changed after the review?** The receipt is stale and the hook denies. Re-run the review on the new head (it counts as a round).

**Pushing to a PR that is already armed** (the resume path after a red CI): that push merges with no further `gh pr merge`, so the hook judges a `git push` to an armed PR exactly like a merge of the pushed commit. Review the new head and write its receipt **before** pushing, or disarm first (`gh pr merge <N> --disable-auto`) and re-arm after the review. Pushes to unarmed or PR-less branches are never judged. `git push -u origin HEAD` and `git -C <dir> push` are both recognised.

## Reviewer prompt

> You are a code reviewer for Threadbare, a TypeScript god-game simulation. You have no context on why this change was made, and you must not look for it: do **not** read commit messages, PR descriptions, Linear tickets, plan docs, or status files until you have written your findings. **Assume this diff contains defects** — it was written by an agent that ships confidently and has no other reviewer. Your job is to find the ones that matter.
>
> Read the rubric at `.claude/skills/review-gate/rubric.md`, then the diff at `<DIFF_PATH>` (repo root `<REPO>`). For every changed hunk, open the surrounding source and the callers/readers you need — a diff alone hides the defects this repo ships (a field read nowhere written, a sweep that catches the wrong tier). Grep for writers and readers; do not assume.
>
> Report only findings that meet the rubric's bar: a `file:line` inside the diff, the rubric check number, a severity, and a **concrete failure scenario** (specific input or state → specific wrong result). No style, naming, or "consider" notes. If you find nothing that meets the bar, return an empty list — that is a valid result, not a failure.
>
> Return JSON only: `{"findings":[{"check":<n>,"severity":"high|medium|low","file":"…","line":<n>,"summary":"one sentence","scenario":"…"}]}`

## Verifier prompt

> You are verifying code-review findings for Threadbare. Each finding below claims a defect. **Your job is to refute them** — most review findings are false positives, and a false positive costs a fix loop for nothing. For each finding, open the cited `file:line` in `<REPO>`, trace the claimed scenario through the real code (callers, writers, guards, tests), and decide:
>
> - `CONFIRMED` — you traced the scenario and it really happens in production code paths.
> - `REFUTED` — you found the guard, writer, caller or invariant that makes it impossible; cite its `file:line`.
> - `UNCERTAIN` — you could not decide. Treat as refuted for gating, but say why.
>
> Where the author supplied a rebuttal, test the rebuttal as hard as the finding. Return JSON only: `{"verdicts":[{"index":<n>,"verdict":"CONFIRMED|REFUTED|UNCERTAIN","evidence":"file:line — one sentence"}]}`
>
> Findings: `<FINDINGS_JSON>`

## Related

- Gate law: `Docs/canon/verification-gates.md` § Review gate.
- Where it sits in the ship sequence: `.claude/skills/pull-work/SKILL.md` § Closeout — ship with auto-merge.
- Hook: `.claude/hooks/review-gate.sh` (registered in `.claude/settings.json`, PreToolUse `Bash|PowerShell`); logic and tests: `scripts/review-gate.ts`, `scripts/__tests__/review-gate.test.ts`.
