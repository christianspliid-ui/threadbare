# Action Proposal — THR-265 skill freshness metadata (eval fixture)

> **Calibration fixture.** Reconstructed for THR-412. Ground truth not visible to the judge — see eval-run write-up for outcome comparison.

## intent_quote

> "Add `last_validated_against: YYYY-MM-DD` frontmatter to every skill in `.claude/skills/` and `.agents/skills/`. Weekly drift scan surfaces skills >60 days stale. Skills never loaded >90 days = archive candidates."
>
> "Open sub-question: what mechanism confirms a skill is still accurate? Options: Agent confirms on load (cheapest; validation is side-effect of use) · Periodic manual review (highest accuracy, highest cost) · Automated check against code signatures (brittle, hard to design). Likely: agent-on-load as default, with weekly scan surfacing stale candidates for human review of a short shortlist."
>
> "Priority slightly elevated (3) vs. other deferrals because it interacts with the drift-scan work in THR-260 scope — the scan surfaces staleness, so freshness metadata should land close in time, not years later."
>
> (From THR-265 description, deferred from THR-260 brainstorm §5.2 item 6 and §8 open question.)

## scope (what this plan does)

Adds a single optional YAML frontmatter field `last_validated_against: YYYY-MM-DD` to every `SKILL.md` in `.claude/skills/` and `.agents/skills/`. Wires a fifth signal (S5) into the weekly drift scan that flags skills past 60 days unvalidated (stale) and 180 days unvalidated (archive candidate). Surfaces stale skills as a single Linear issue per scan in Continuous Improvement, matching the S1–S4 cadence. Documents the convention in CLAUDE.md so editors bump the date on meaningful edits. Includes a one-time bootstrap script that idempotently inserts the field on every existing SKILL.md and the existing `check:skill-sync` hook keeps shared-skill copies byte-identical.

## scope (what this plan does NOT do — explicit non-goals)

- Auto-mutating skill files on load (the cheapest "validation as side-effect of use" path). Deferred — adds implicit mutation to read paths and complicates determinism. Reconsider after one drift-scan cycle if convention adoption is poor.
- Tracking skill-load frequency for archive detection. The brainstorm's "skills never loaded >90 days = archive candidates" idea requires usage telemetry that does not exist today. Replaced for v1 with a strictly age-based 180-day heuristic.
- Schema-validating frontmatter fields beyond presence/format. S5 only checks the date is parsable and within range.
- Replacing the existing skill review process. Editors still own correctness; freshness metadata is the visibility layer.

## impact_class

External. Skill edits change other agents' behavior (per impact-classification table in the judge spec); the new convention in CLAUDE.md changes the contract between skill editors and the drift-scan tooling. The Linear issue produced by S5 weekly affects every agent's pickup queue (Continuous Improvement project).

## evidence cited

- **Linear issue:** THR-265 (description quoted above; status Done as of 2026-05-08).
- **Vision premises invoked:** none — this is process / tooling infrastructure, not a game-feature plan. Three-pillar status all explicitly N/A in §4 of the plan doc.
- **UL terms touched:** none — no game-domain terminology in scope.
- **Canon pages consulted:** none required for process-tooling work.
- **Prior plan docs this builds on:** `Docs/plans/2026-04-24-codebase-health-first-wave.md` (drift-scan v1 + UL foundation); `Docs/plans/2026-05-01-thr-294-ul-drift-triage.md` (S4 triage pattern this design mirrors); ARC-60 brainstorm (the parent rec).
- **Rejected approaches considered and dismissed:** auto-on-load mutation (deferred per §12); load-frequency-based archive (deferred until usage telemetry exists).

## load-bearing decisions touched

None of the Load-Bearing Architectural Decisions in CLAUDE.md are altered. The plan touches process tooling only (drift scan, SKILL.md frontmatter convention) and does not alter graph schema, tick-loop semantics, encounter/awareness model, world-version semantics, or any other LBAD entry. CLAUDE.md gains a one-paragraph convention note in §Skill Tree Layout; this is process discipline, not architecture.

## high-impact files touched (from Codesight)

None. The plan touches `scripts/drift-scan/index.ts` (CI tooling, not in the importer graph), `scripts/skill-freshness-bootstrap.ts` (new), every `SKILL.md` (frontmatter only — these files are not imported as code), `CLAUDE.md` (docs), and `Docs/changelog.md` (docs). No file with ≥100 importers is touched.

## kill criteria

The plan names two: (a) if convention adoption is poor (S5 stays red across two consecutive scans without convention bumps closing it), revisit auto-on-load mutation per §12 follow-up #1. (b) If the bootstrap script malforms frontmatter on any skill, the unit test that parses every SKILL.md after bootstrap and asserts the field's presence catches it. The risk table in §11 names mitigation for each.

## explicit user sign-off

Not required — impact class is External, not High-risk. The plan operates within an existing tooling system (drift scan) extending it by analogy with an existing signal (S4).

## author notes for the judge

The plan is process tooling. All three game-pillars are explicitly N/A with rationale (precedent: ARC-60 itself, THR-294). The interesting design call is the convention-driven vs auto-on-load choice — the plan picks convention-driven for v1 (cheaper, explicit, no implicit mutation), names the kill criterion (two-cycle red without convention closure), and defers the alternative. The 60/180-day thresholds differ from the brainstorm's 60/90 — §3.7 explains the change rationale (180 is age-based archive avoiding load-frequency telemetry that does not exist). The plan is well-scoped to a single PR's worth of work; Codex-friendly mechanical pattern-following per the coordination block.
