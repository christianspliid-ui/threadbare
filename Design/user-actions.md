# User actions — moved to the `ops` branch

**The live action list is not this file.** Since 2026-08-02 (THR-947) it is
published to the unprotected `ops` branch, so the hourly refresh no longer
advances `main`'s tip and re-stales every open PR.

Read the current copy:

```bash
git fetch origin ops --quiet && git show origin/ops:Design/user-actions.md
```

Companion file: `git show origin/ops:Design/briefing.md`.

Why, what else moved, and what deliberately did not: [`Docs/ops/README.md`](../Docs/ops/README.md).
This file's own history up to the cutover stays on `main`, frozen.
