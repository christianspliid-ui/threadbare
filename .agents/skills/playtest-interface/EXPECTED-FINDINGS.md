# Expected Findings — Baseline Noise

This file lists known issues, regressions, or limitations that the `playtest-interface` skill should **not** re-flag as new findings.

After each playtest run (starting with THR-211), append confirmed baseline items here. Each entry should include the first-seen date and the relevant assertion ID from RUBRIC.md.

The skill runbook compares run findings against this file before writing the FAIL / SURPRISE sections of the report. Anything listed here is moved to "Known baseline" instead.

---

## Format

```
### <surface.name> — <Reader>

**First seen:** YYYY-MM-DD (THR-XXX)
**Assertion:** <rubric assertion ID>
**Description:** <one sentence on what the issue is>
**Status:** Known / Won't fix / Tracked in THR-XXX
```

---

## Entries

*(Empty — populated after THR-211 first playtest run)*

---

## Notes

- Only add entries here after a deliberate decision: "this is known, we accept it or track it elsewhere."
- Do not add entries here to silence alerts you haven't triaged.
- Entries with `Status: Tracked in THR-XXX` should be removed once the tracking issue is resolved.
