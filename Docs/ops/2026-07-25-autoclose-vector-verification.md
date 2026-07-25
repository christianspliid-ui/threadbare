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

**Result: PASS.** PR [#836](https://github.com/christianspliid-ui/threadbare/pull/836) merged
2026-07-25 09:05 UTC as `d1820ef4`. THR-765 was **untouched**:

```
status:       Idea          (unchanged)
completedAt:  null
stateHistory: [{ state: Idea, startedAt: 09:04:13, endedAt: null }]   ← single entry, never transitioned
attachments:  PR #836 + commit f742a53a   ← linked, but not moved
```

Both auto-close workflow runs went green and declined to act. From the **push**-triggered run
(30152249074), which scanned the merged commit body carrying the prose keyword:

```
No Linear issues referenced — nothing to close
```

Pre-merge, the same texts were checked against the shipped helper directly:

```
branch is flush-context?  false
OUR workflow would close:  []            ← line-anchored pattern: inert
NATIVE-shaped detector:    ["THR-765"]   ← the pre-fix native behaviour WOULD have closed it
```

That contrast is the point of the test. Our workflow was provably incapable of closing THR-765,
so the issue staying open isolates the **native** integration as genuinely disabled — vectors 2
and 3 are dead, not merely unexercised. The attachments confirm PR linking still works, which is
the intended end state: **links without auto-move.**

## PR B — positive control (this PR)

A PR whose body carries the closing keyword **alone on its own line** — the deliberate form the
Definition of Done requires. Its branch is named `autoclose-verification-positive-control`, with
**no** `thr-` prefix, and its title carries no bare id, so the line-anchored keyword is the only
possible closing signal.

**Pass criterion:** after PR B merges, THR-765 transitions to **Done**.

**Result:** _(recorded by the follow-up closeout PR)_

## Outcome

_(filled in by the follow-up PR that records both results)_
