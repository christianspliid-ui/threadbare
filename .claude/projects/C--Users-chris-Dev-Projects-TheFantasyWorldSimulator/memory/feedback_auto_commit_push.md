---
name: Auto commit and push small validated changes
description: When working directly on main with small validated changes, commit and push automatically without asking
type: feedback
---

When working directly on main and changes are small and validated (tests pass, build clean), commit and push automatically without stopping to ask "ready to push?" or "want me to commit?".

**Why:** User doesn't want to wait for confirmation on routine commits — the validation step (tests + build) is the gate, not a human approval step.

**How to apply:** After validating changes (tsc, build, tests), go straight to commit + push without pausing. Only stop if something is wrong or the change is risky/large/ambiguous.
