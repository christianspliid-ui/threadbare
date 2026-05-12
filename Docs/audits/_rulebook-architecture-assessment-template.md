---
template: rulebook-architecture-assessment
version: 1
created: 2026-05-12
---

# Rulebook Architecture Assessment — YYYY-MM-DD

> **Usage:** Copy this file to `Docs/audits/YYYY-MM-DD-rulebook-architecture-assessment.md` and complete each section. Run on-demand (quarterly or when architectural drift is suspected) in a Cowork session. The first assessment ran at Phase 1 closeout (2026-05-11); subsequent assessments run quarterly or on-demand.

## Context

- **Date:** YYYY-MM-DD
- **Trigger:** quarterly / on-demand (describe what prompted this)
- **Assessor:** (cowork / user / both)
- **Rulebook version checked:** `Docs/canon/rulebook.md` — `last_reviewed` date in frontmatter
- **Phase 2 lint run?** yes / no — if yes, attach or summarise findings

---

## 1. Synthesis Check

> Do the rules combine into a coherent game? Sections that read fine individually may contradict each other when stitched. Answer three sub-questions:

### 1a. Cross-section consistency

Walk through the player's turn end-to-end (portfolio scan → curated moment → aftermath) and verify that every hand-off between rulebook sections is unambiguous.

| Section hand-off | Status | Notes |
|-----------------|--------|-------|
| What You Are → What the World Is | ✅ / ⚠️ / ❌ | |
| What the World Is → Three-Beat Turn | ✅ / ⚠️ / ❌ | |
| Three-Beat Turn → What You Can Do | ✅ / ⚠️ / ❌ | |
| What You Can Do → Your Resources | ✅ / ⚠️ / ❌ | |
| Your Resources → Encounters and Aftermath | ✅ / ⚠️ / ❌ | |
| Encounters and Aftermath → The Clocks | ✅ / ⚠️ / ❌ | |
| The Clocks → Winning and Losing | ✅ / ⚠️ / ❌ | |

### 1b. Gap detection

List any "and then..." transitions in the rulebook where the rule for the next step is absent or vague.

- (example: "aftermath reshapes the trajectory" — does the rulebook state what that looks like mechanically or is it left to future spec?)

### 1c. Contradictions

List any rule statements in different sections that contradict each other.

- (none identified / describe)

---

## 2. Implementation Gap Analysis

> Where is the gap between `[IMPL]` and `[DESIGN]` largest? What does it imply for prioritisation?

### 2a. Current flag counts

Run a quick grep on `Docs/canon/rulebook.md` and tally:

| Flag | Count |
|------|-------|
| `[IMPL]` | |
| `[DESIGN]` | |
| `[OPEN]` | |

```bash
grep -c '\[IMPL\]' Docs/canon/rulebook.md
grep -c '\[DESIGN\]' Docs/canon/rulebook.md
grep -c '\[OPEN\]' Docs/canon/rulebook.md
```

### 2b. Largest gaps

List the 3–5 `[DESIGN]` rules that have been designed the longest without implementation (estimate from plan doc dates or Linear issue creation dates).

| Rule (brief) | Plan doc / Linear ref | Approx. age |
|-------------|----------------------|-------------|
| | | |

### 2c. Prioritisation implication

Based on the gap, what is the recommended next pillar of implementation? (One paragraph.)

---

## 3. Open Question Blockers

> Which `[OPEN]` questions are blocking the next phase of work?

### 3a. Full `[OPEN]` list

Pull all `[OPEN]` entries from `Docs/canon/rulebook.md`:

```bash
grep -n '\[OPEN\]' Docs/canon/rulebook.md
```

| Line | Description | Age (days) | Blocking? |
|------|-------------|-----------|-----------|
| | | | |

### 3b. Verdictable in this session

For each `[OPEN]` entry: can the user verdict it now (yes/no/defer)? Record verdicts inline.

| Question | Verdict | New rule or status flag |
|----------|---------|------------------------|
| | | |

### 3c. Remaining blockers

`[OPEN]` questions still unresolved after 3b:

- (list, or "none")

---

## 4. Recommendations

Brief list of follow-up actions (file Linear issues as appropriate, label `rulebook-review`):

1.
2.
3.

---

## 5. Assessor sign-off

- [ ] Section 1 complete (synthesis check)
- [ ] Section 2 complete (implementation gap analysis)
- [ ] Section 3 complete (open question blockers)
- [ ] Verdicts from 3b written back to `Docs/canon/rulebook.md` (update status flags inline)
- [ ] Follow-up Linear issues filed
- [ ] `last_reviewed` date in `Docs/canon/rulebook.md` frontmatter updated to today
