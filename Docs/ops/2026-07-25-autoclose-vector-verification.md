# Autoclose vector verification — live scratch-issue test (THR-738)

**Date:** 2026-07-25
**Ticket:** THR-738 (Harden linear-autoclose against phantom-Done)
**Scratch target:** THR-765 (throwaway, `Idea` state, assigned so it can never enter the pickup queue)

## Why this record exists

THR-738's repo half shipped in PR #823: `scripts/linearAutoclose.mjs` now line-anchors the
close decision (`CLOSE_KEYWORD_PATTERN = /^(?:Fixes|Closes|Resolves) (THR-\d+)[ \t]*$/gim`), so
our custom workflow closes an issue only when a full line reads exactly the keyword plus the id.

That change alone could not close the ticket, because two of the three known phantom-Done
vectors never came from our workflow at all — they came from Linear's **native** GitHub
integration auto-moving any *linked* issue to Done on PR merge. Christian disabled that
automation on 2026-07-25 (per-team: Settings → Team Threadbare → Workflows & automations →
Pull request and commit automations → "when PRs are merged" = no action).

Two settings changed by two different parties, with no test between them, is exactly the
shape of a fix that looks done and isn't. This document records the **live** end-to-end
verification: two deliberately-shaped PRs merged against a real scratch issue.

## The three vectors under test

| # | Vector | Source | Expected after fix |
|---|--------|--------|--------------------|
| 1 | Close keyword inside a prose sentence / markdown bullet | our workflow (broad substring, pre-THR-738) | **inert** — line-anchored pattern requires the line to hold nothing but keyword + id |
| 2 | `thr-NNN` in the branch name | Linear native integration | **inert** — native auto-close disabled; PR still *links*, which is the intended end state |
| 3 | Bare `THR-NN` token in the PR title | Linear native integration | **inert** — same |

## PR A — negative control (this PR)

Fires all three vectors simultaneously:

- **Branch:** `thr-765-scratch-vector-test` — bare scratch id in the branch name (vector 2).
- **Title:** carries the bare `THR-765` token (vector 3).
- **Body:** writes the close keyword *inside a prose sentence* — non-line-anchored (vector 1).

**Pass criterion:** after this PR merges to `main`, THR-765 is still open
(`status != Done`, `completedAt == null`).

**Result:** _(recorded below once merged)_

## PR B — positive control

A follow-up PR whose body carries the closing keyword **alone on its own line**, which is the
deliberate form the Definition of Done requires.

**Pass criterion:** after PR B merges, THR-765 transitions to **Done**.

**Result:** _(recorded below once merged)_

## Outcome

_(filled in by the follow-up PR that records both results)_
