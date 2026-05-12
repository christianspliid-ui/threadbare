# Intent-Judge Calibration Run — Plan

**Linear issue:** [THR-412](https://linear.app/threadbare/issue/THR-412/intent-judge-calibration-run-score-eval-set-against-ground-truth)
**Authored:** 2026-05-12 (Cowork, scheduled session)
**Parent skill:** [THR-411](https://linear.app/threadbare/issue/THR-411) — intent-judge skill (shipped 2026-05-11)
**Parent plan doc:** `Docs/plans/2026-05-11-intent-judge-skill.md`
**Source brief:** User filed THR-412 alongside THR-411 as the cold-start calibration check. *"Does the judge work at all, before we trust it in the handoff path?"*

## Why this plan doc exists

THR-411 left two verdicts open before THR-412 could move to Ready for Dev:

1. **Eval set composition** — the body names 3 known-good fixtures and 1 named known-bad (THR-400's pre-audit plan). Two more known-bad picks are listed as `TBD — user pick`.
2. **v1.1 rubric proposal placement** — inline update to THR-411's plan doc, or a separate THR-XXX issue?

This plan resolves both verdicts so the executor can pick up cleanly. Both decisions are scoped so CC does not need a follow-up user ping mid-run.

## Verdict resolutions

### Verdict 1 — Eval set composition: proceed with 3-good + 1-named-bad, with an optional discovery window for 1–2 more bad fixtures

**Decision:** Run the calibration with the existing fixture set as the **floor**:

| Slot | Path / source | Ground truth | Source |
|------|---------------|--------------|--------|
| Good 1 | `Docs/plans/2026-05-08-thr-265-skill-freshness-metadata.md` | Allow | shipped clean |
| Good 2 | `Docs/plans/2026-05-04-encounter-build-toolkit.md` | Allow | Encounter Experience anchor |
| Good 3 | `Docs/plans/2026-04-13-linear-coordination-protocol.md` | Allow | still in active use |
| Bad 1 | THR-400 original plan (issue body as drafted 2026-05-11 07:47 UTC, before vision audit) | Block | audit doc `Docs/audits/2026-05-11-thr-400-vision-audit.md` |

**Discovery window for additional bad fixtures (optional, ≤15 minutes):** the executor may search `Docs/audits/` and Linear (`label:Reopened` + completed in the last 30 days) for **1–2 additional plan docs** that satisfy both: (a) the plan was either reopened or audited post-handoff, and (b) the original plan-doc text is still recoverable in git history. If found, add to the eval set as bad fixtures with ground truth derived from the audit/reopen comment. If not found within 15 minutes, proceed with 3-good + 1-bad — do not block on this.

**Rationale.** Three goods plus one bad is asymmetric — but it isn't broken, and the asymmetry itself is signal. A judge that flags any of the three known-goods is producing false positives, which is exactly the failure mode Nate B. Jones's pattern warns about ("a judge that humans learn to bypass"). False-positive rate on the known-goods is therefore a load-bearing metric even when the bad-fixture count is low. The user wrote: *"a known-good that gets a Revise verdict is also signal — false positives matter."* The 15-minute discovery window gives the executor a chance to broaden the bad-side without forcing a user ping.

**Why this is autonomous-safe.** The user explicitly authorized this fallback in the THR-412 body: *"If you don't have two more picks readily available, the calibration run can proceed with the THR-400 fixture plus stricter scoring on the three known-goods... But 3+3 is the cleaner shape."* I am invoking that fallback explicitly.

### Verdict 2 — v1.1 rubric proposal placement: default inline; escalate to a new issue only for material changes

**Decision:** the executor writes the v1.1 proposal **inline** in `Docs/judge-metrics/eval-run-<date>.md` (a "Proposed v1.1 adjustments" section after the analysis). They file a **separate Linear issue** only if the proposed changes meet **any** of these escalation triggers:

- Changes touch **more than one dimension's rubric** (i.e., the cross-dimension aggregation rule needs to move, or two or more PASS/GAP/VIOLATION thresholds shift)
- Changes alter the **aggregation rubric** (the first-match-wins ladder that turns dimension scores into the four verdicts)
- A **new constant** is added to the SKILL.md constants block
- An **invocation trigger** is added or removed
- The **impact-classification table** changes

If none of those fire, the proposal stays inline in the eval-run doc. If the v1.1 changes are "no changes needed", the eval-run doc says so explicitly with the evidence.

**Rationale.** Small adjustments (one dimension's threshold, one finding template tweak) are cheap to merge inline and don't justify a separate ticket. Material changes that touch the rubric architecture deserve their own Linear issue because they need a re-eval — and they cross the line where the v1.1 spec is itself a separable artifact that the next calibration run will compare against. The user's open verdict explicitly named this trade-off; this rule picks the cheap default and names the trip-wire for the expensive path.

## Procedure (final)

The 4-step procedure in THR-412's body stands. Two clarifications:

1. **Reverse-engineered action proposals** — file each to `Docs/plans/.intent-proposals/<plan-slug>.eval.md`. The `.eval.md` suffix keeps these distinguishable from real runtime proposals at a glance. The proposal format is the existing `proposal-template.md` from the intent-judge skill — fill it in from the originating Linear issue's body, comments, and (for bad fixtures) the audit doc.
2. **Judge spawn** — use the verbatim spawn template from `.claude/skills/intent-judge/SKILL.md` (Agent tool, `general-purpose`, `model: "opus"`). Do NOT inline the judging logic in the executor's own session — that defeats anti-correlation and the calibration becomes a self-grading exercise.

After all fixtures have been run:

3. **Confusion matrix.** Rows = ground truth; columns = judge verdict. Cells = fixture identifiers. A clean diagonal is the success shape.
4. **Cluster analysis.** For each off-diagonal cell, write at least one paragraph naming (a) which dimensions agreed/disagreed, (b) which evidence the judge under- or over-weighted, (c) whether the mismatch is rubric drift, intent-fidelity miss, or judge-side hallucination.
5. **v1.1 proposal** — written inline per Verdict 2 above, or escalated to a new issue per the trip-wires.
6. **Comment on THR-411** with the eval-run doc path so the skill maintainer has the calibration record beside the spec.

## Three-pillar coverage

| Pillar | Coverage |
|--------|----------|
| Engine | **N/A.** Calibration is a process exercise; no runtime engine code is touched. |
| Content | **N/A.** No content tables, encounter templates, or prose involved. |
| UI | **N/A in code; YES in operator-facing output.** The eval-run doc (confusion matrix + analysis) is the surface. Format constrained by the procedure above. |

Process exercise. N/A is the honest answer; explicit rationale per CLAUDE.md design governance.

## Non-functional priorities

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | Eval-set size, discovery-window length, and escalation trip-wires are all named constants in this plan. |
| 2. Inspectability | PASS | Per-fixture verdict block recorded; confusion matrix lets us trace why a v1.1 change was proposed weeks later. |
| 3. Determinism | PASS w/note | Aggregation in the judge is deterministic; the per-dimension PASS/GAP/VIOLATION scoring uses LLM judgment, which is non-deterministic by design. Calibration measures that non-determinism's stability across the eval set. |
| 4. Fail-soft | PASS | Missing audit doc, missing plan doc, or judge spawn failure are all handled in the procedure: mark the fixture as `skipped` with reason, continue the run. |
| 5. Narrative over mechanical perfection | N/A | Process skill; no narrative surface. |
| 6. Additive over destructive | PASS | Only new files (`.eval.md` proposals, eval-run doc). No edits to the intent-judge skill itself unless a separate v1.1 issue is filed. |
| 7. Performance budget | PASS w/note | Target latency per judge run is the skill's 90s constant. Six runs ≈ 9 min of judge wall time. The cluster-analysis write-up is the cost driver, not the judge spawns. |

## Constants

- `CALIBRATION_BAD_FIXTURE_FLOOR = 1` — minimum bad fixtures; THR-400 satisfies
- `CALIBRATION_GOOD_FIXTURE_FLOOR = 3` — minimum good fixtures; the three named in the issue body
- `CALIBRATION_DISCOVERY_WINDOW_MINUTES = 15` — executor may search for additional bad fixtures within this budget; do not exceed
- `CALIBRATION_DISCOVERY_BAD_FIXTURE_CAP = 2` — at most 2 additional bad fixtures may be added via discovery (4 total)
- `V11_PROPOSAL_INLINE_DIMENSION_CAP = 1` — proposals touching ≤1 dimension's rubric stay inline; >1 escalates to a new issue

## Files to touch

| Path | Source | Notes |
|------|--------|-------|
| `Docs/plans/.intent-proposals/<plan-slug>.eval.md` × 4–6 | Reverse-engineered from each fixture | New files; `.eval.md` suffix is the marker |
| `Docs/judge-metrics/eval-run-2026-05-XX.md` | Calibration write-up | New file; date stamp set by executor at run start |
| (Conditional) New Linear issue if v1.1 changes meet escalation triggers | Per Verdict 2 trip-wires | Filed against `Content Architecture` or `Agent Coordination Protocol` project as appropriate |

No `src/` changes. No CLAUDE.md changes. No edits to `.claude/skills/intent-judge/SKILL.md` (mutex per the issue body).

## Done when

- [ ] All fixtures have a verdict block recorded in `Docs/judge-metrics/eval-run-<date>.md`
- [ ] Confusion-matrix table (rows = ground truth, columns = judge verdict)
- [ ] At least one paragraph of analysis per mismatch (off-diagonal cell)
- [ ] v1.1 rubric proposal written — inline if the escalation triggers don't fire; new Linear issue filed and linked if they do
- [ ] Comment posted on THR-411 with the eval-run doc path
- [ ] `Fixes THR-412` in the closing commit body

## Coordination

- **Suggested model:** `model:opus-4-7` for the judge spawns themselves (load-bearing — anti-correlation requires frontier). `model:sonnet` is fine for the orchestration, the reverse-engineering of action proposals, and the cluster-analysis write-up. Tag the issue with `model:opus-4-7` because the load-bearing portion sets the floor.
- **Parallel-safe with:** anything that doesn't edit `.claude/skills/intent-judge/SKILL.md` or `Docs/plans/.intent-proposals/` (which this run will be writing into).
- **Mutex with:** any concurrent edit to `.claude/skills/intent-judge/SKILL.md` — we need a stable rubric to score against. If a v1.1 issue is filed mid-run, it must wait until this calibration completes before landing.
- **Files to touch:** see the table above.
- **Codex review:** no. This is judgment-heavy calibration analysis — Codex's mechanical-pattern strength doesn't help here. CC handles it.
- **Browser-verify exempt:** yes. No UI surface; this is workflow infrastructure.

## Risks

1. **Asymmetric eval set inflates judge specificity.** With only 1–3 bad fixtures, a judge that's biased toward Allow will look fine. The 15-minute discovery window partially mitigates; explicit acknowledgement in the write-up's "limitations" section is the other half. Recommend a follow-up calibration in 30 days once the judge has accumulated real handoff signal.
2. **Reverse-engineering action proposals introduces author-side framing bias.** The proposal is supposed to be written *before* the judge sees the doc; here, we're reconstructing it after the fact, with knowledge of how each plan turned out. To partially mitigate, write each proposal **before** reading the audit/reopen comment for that fixture, and resist the urge to phrase the intent quote in ways that telegraph the ground truth.
3. **The THR-400 fixture is "easy mode" for the judge.** Five vision/NFP violations is a fat-pitch fixture. A passing judgment on THR-400 doesn't prove the judge catches subtle drift. The eval-run write-up must call this out as a known limit; the field-signal calibration in 30 days is where subtle drift gets tested.
