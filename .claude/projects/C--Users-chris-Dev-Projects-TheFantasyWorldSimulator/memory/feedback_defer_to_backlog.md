---
name: Deferrals must be backlogged immediately
description: Never defer work without creating a backlog entry in the same session — the user will not track it for you
type: feedback
---

When deferring part of a feature to a later pass, ALWAYS create a concrete backlog entry in `.planning/BACKLOG.md` in the same session. Do not say "we'll do this later" without writing it down.

**Why:** Deferred chunk-2 work that isn't backlogged gets forgotten. The user should never have to remember what was deferred — that's the system's job. Shipping chunk 1 without tracking chunk 2 is worse than not shipping at all, because it leaves a half-finished primitive in the codebase.

**How to apply:** Before completing any session where work was deferred, check: is every deferral represented by a backlog entry? If not, create one before closing out.
