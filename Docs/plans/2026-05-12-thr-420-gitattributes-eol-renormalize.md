# THR-420 — `.gitattributes` EOL fix and full index renormalization

**Status:** Ready for Codex
**Project:** Continuous Improvement
**Author:** Cowork (scheduled keep-work-flowing run, 2026-05-12)
**Related:** Retro 2026-05-11 Experiment #1; impediments #118 / #124 / #125

## TL;DR

`.gitattributes` already exists at repo root with `* text=auto eol=lf` (committed 2026-04-28). Despite this, three skill-sync pre-commit blocks occurred 2026-05-07 → 2026-05-08 (impediments #118, #124, #125). The structural file is in place — the **missing step** is forcing git to re-apply `.gitattributes` to existing blobs in the index via `git add --renormalize .`. Without that, Windows clones with `core.autocrlf=true` keep flipping `.agents/skills/**` to CRLF on checkout because the underlying blob objects were committed before `.gitattributes` existed.

This plan ships the renormalization commit and verifies it sticks across a fresh-clone simulation.

## Discovery (what changed since the issue was written)

The issue description (THR-420) frames the fix as "add `.gitattributes` with `* eol=lf` (one line, one file, one commit) + re-run `npm run check:skill-sync:sync`". On inspection that's not quite accurate:

| Claim in issue | Reality on `main` (2026-05-12) |
|---|---|
| `.gitattributes` missing | Already present since 2026-04-28; contains `* text=auto eol=lf` plus binary overrides for png/jpg/woff/etc. |
| `npm run check:skill-sync:sync` will fix it once `.gitattributes` lands | `:sync` only rewrites `.agents/skills/**` to match `.claude/skills/**` byte-for-byte. It does NOT trigger blob renormalization. |
| Drift will stop after merge | Has not stopped — `.gitattributes` has been on `main` for two weeks and the drift has recurred three times in 24 hours. |

So the issue title is correct in spirit but the implementation step is incomplete.

## Root cause (as diagnosed in impediment #125, confirmed by sandbox check)

1. `.gitattributes` only governs working-tree ↔ index conversion at **add-time** and at **checkout-time**.
2. Files committed BEFORE `.gitattributes` existed retain whatever line endings were in their blob at the time of the commit (likely a mix on Windows-authored content).
3. On a fresh Windows clone with `core.autocrlf=true`:
   - Checkout reads the blob as-stored.
   - `.gitattributes` says "LF in working tree" — git applies that conversion.
   - BUT some files end up flipped to CRLF on subsequent operations because their blob is still pre-normalization, and `core.autocrlf` re-converts on `git status` / `git stash` / branch switches.
4. Result: `.agents/skills/**` working-tree shows CRLF, `.claude/skills/**` shows LF (or vice-versa, depending on which side last got touched by `:sync`).
5. `npm run check:skill-sync` does byte-strict equality (`Buffer.compare`), so the mismatch surfaces as 128+ line-ending errors and the pre-commit hook blocks.
6. Running `:sync` rewrites `.agents/` working-tree to match `.claude/` — but the COMMIT of that change becomes a no-op because git normalizes the staged diff back through `.gitattributes` rules against the original blob, and the resulting tree object equals the parent's tree object. The commit lands empty.
7. On the next checkout, the blob is still pre-normalization → drift returns.

The structural fix is to force every text file's blob to be re-stored using current `.gitattributes` rules. That is what `git add --renormalize .` does.

## The fix

Two-step, single PR:

1. **Run `git add --renormalize .`** on a clean working tree. This walks every tracked file, re-applies `.gitattributes` rules, and stages the result. Files whose blobs were already LF-correct will be skipped (no diff). Files whose blobs carried CRLF or mixed endings will be re-staged with LF.
2. **Commit the renormalization diff.** Commit message body must include `Fixes THR-420` to trigger the Linear auto-close on merge to main.

Sandbox observations that constrain step 1:
- The Linux sandbox copy under `/sessions/magical-dreamy-shannon/mnt/TheFantasyWorldSimulator/` has `.claude/skills/**` and `.agents/skills/**` byte-identical (md5 matches on `pull-work/SKILL.md`, no CRLF detected by `od -c`). Renormalization in the sandbox would be a no-op.
- The 321-file "CRLF" hit from `grep -rlU $'\r'` matched embedded `\r` characters inside file content (likely lookups like `$'\r'` in script files, or example regex patterns), not line-end terminators. Confirmed by `od -c` output showing `\n`-only line terminators on `pull-work/SKILL.md`.
- **The renormalization commit must therefore be made from a Windows checkout** (or a Linux checkout that has been seeded by `git clone` with `core.autocrlf=true` in the global config) for it to produce a non-empty diff that actually fixes the problem on Windows. Codex runs on Windows, which is exactly the right environment.

## Done when

- [ ] `git add --renormalize .` has been run on a fresh worktree of `main` after this plan doc lands.
- [ ] The resulting diff is committed with `Fixes THR-420` in the body. Diff size expected to be non-trivial (likely several hundred files touched).
- [ ] `npm run check:skill-sync` exits 0 immediately after a fresh `git clone` of the post-merge `main`, **without** running `:sync`.
- [ ] Husky pre-commit hook on the next unrelated commit does not flag any `.claude/skills` ↔ `.agents/skills` mismatch.
- [ ] Verification evidence (raw terminal output) pasted in the closeout commit body or Linear comment, per Definition of Done.

## Three-pillar check

- **Engine:** N/A (repo config only)
- **Content:** N/A
- **UI:** N/A
- **Wiring:** N/A — this affects every text file in the repo via a one-time renormalization; no module-level wiring changes.

Three-pillar exemption is appropriate: this is pure repo-infrastructure hygiene with no game-state or runtime impact.

## Files to touch

- No `.gitattributes` edit needed (already correct).
- Tracked text files repo-wide may be re-staged by `git add --renormalize .`. The expected concentration is `.agents/skills/**` and any other paths that pre-date `.gitattributes`.
- **Do not touch** any binary file the explicit overrides cover (png, jpg, jpeg, gif, ico, woff, woff2, ttf, eot). `.gitattributes` already exempts them.

## Coordination concerns

- **Mutex with all currently-In-Dev work.** A bulk renormalization commit will create merge conflicts against any feature branch that touches text files. Coordinate with the queue: ideally wait for `In Dev` to be empty before merging, or merge late at night when no other executor is mid-work.
- **Sandbox limitation:** the renormalization diff cannot be produced from the Linux sandbox (sandbox files are already LF-only, so the diff would be empty and useless). Codex must run this on the Windows host.
- **Verification asymmetry:** even after the renormalization commit lands, agents on Linux will see no change in `npm run check:skill-sync` results (they were already passing). The real test is on Windows. The closeout evidence must therefore include `npm run check:skill-sync` output captured from a Windows shell post-clone, not just from the sandbox.

## Risks and rollback

- **Risk: false-positive renormalization on files that should retain CRLF.** Mitigated by `.gitattributes`' existing binary overrides. No additional overrides anticipated; if Codex finds any binary file is touched in the staged diff, revert that one file with `git checkout -- <file>` before committing.
- **Risk: merge conflicts on existing PRs.** Communicate via Slack handoff that the renormalization commit is imminent; ask in-flight executors to rebase against the post-renormalization tip. Conflicts will be trivial — git's merge handles LF/CRLF mismatches gracefully when `.gitattributes` is consistent on both sides.
- **Rollback:** `git revert <renormalization-commit>` would restore the prior blob state. Drift would return but no data is lost.

## Why this lands in Ready for Codex, not Ready for Dev

Per the issue's stated routing ("Suggested executor: Codex") and the Cowork ↔ executor protocol in `Docs/plans/2026-04-13-linear-coordination-protocol.md`: this is mechanical, pattern-following work — run one git command, commit the result, verify the pre-commit hook clears. No judgment-heavy design, no novel-system work, no prose. Codex is the right queue.

Per impediment #121 (cross-executor collision when Codex-handed issues carry a `model:*` label and get pulled into CC's queue): **do not apply any `model:*` label to this issue**. Codex routing is queue-based, not label-based.

## NFP compliance

This is a config-only change; the seven NFPs (tunability, inspectability, determinism, fail-soft, narrative-over-mechanical, additive-over-destructive, performance-budget) apply to runtime systems. PASS by N/A for all seven.

## Open questions

None. The fix is structurally simple; the only judgment call (whether to renormalize repo-wide vs scoped to `.agents/skills/**`) is settled by the fact that `.gitattributes` is repo-wide and the existing blobs in any other path that pre-dates the file would have the same latent CRLF risk. Renormalize once, repo-wide, done.
