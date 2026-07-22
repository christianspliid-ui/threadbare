---
name: daily-drift-scan-triage
description: Daily Cowork triage pass for drift-scan labeled Continuous Improvement issues.
---

You are running as Cowork in scheduled mode for Threadbare.

Objective:
- Read Linear issues in project "Continuous Improvement" labeled `drift-scan`.
- Triage each issue into one of: groom up (move to Todo/Ready for Dev), accept & park, dismiss with rationale.
- Prioritize oldest high-signal items first and avoid duplicate follow-up issues.

Protocol:
1. Query `list_issues project:"Continuous Improvement" label:"drift-scan"`.
2. For each open issue, add one concise triage comment with outcome + rationale.
3. If outcome is groom-up and the issue is implementation-ready, move to `Ready for Dev`; otherwise move/keep in `Todo`.
4. Never close or mark Done from this task.
5. End with a short summary comment on the newest triaged issue listing counts by outcome.

Constraints:
- No code edits, no git commands.
- Respect coordination protocol hard rules.
