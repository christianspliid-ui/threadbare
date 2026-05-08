# THR-265 — Skill freshness metadata + validation mechanic

**Status:** Plan finalized 2026-05-08. Awaiting executor pickup (Codex queue).
**Parent project:** Continuous Improvement
**Parent brainstorm:** ARC-60 — *Recurring process to keep codebase health from degrading (Farley × Pocock)* (Done 2026-04-27). Direction blessed by user.
**Source:** ARC-60 brainstorm §5.2 item 6 + §8 open question.
**Companion plans (drift-scan family):**
- `Docs/plans/2026-04-24-codebase-health-first-wave.md` — drift-scan + UL foundation.
- `Docs/plans/2026-05-01-thr-294-ul-drift-triage.md` — S4 (UL drift) pattern this design mirrors.

---

## 0. TL;DR

Add `last_validated_against: YYYY-MM-DD` frontmatter to every `SKILL.md` in `.claude/skills/` and `.agents/skills/`, then extend the existing weekly drift scan with a new **S5: Skill freshness** signal that surfaces stale skills as Linear issues in Continuous Improvement. The validation mechanic is **convention-driven, not auto-mutating**: when an editor (human or agent) makes a meaningful content change to a skill, they bump the date as part of that edit. The drift scan provides the visibility layer that keeps the convention honest.

Out of scope for v1: agent-on-load auto-bumping, never-loaded-skill archive detection (both deferred — see §12).

---

## 1. Why

The skill tree is the discipline-enforcement layer for an agent-primary codebase (per ARC-60). Skills go stale silently — the underlying systems they document evolve, but the skill text doesn't catch up unless someone notices. Two failure modes today:

1. **Stale skills lie to agents.** A skill that says "use `EncounterTemplate` format" after the THR-108 migration to `UnifiedActionTemplate` actively misleads the next authoring pass. We have already eaten this cost (THR-292 cleaned up the residue).
2. **Drift is invisible.** No mechanism surfaces "the encounter-pipeline skill hasn't been touched in 90 days, but the encounter pipeline shipped THR-117 condition wiring 30 days ago — is the skill still accurate?". Agents only discover staleness by writing wrong code from it.

The drift scan (THR-260 first wave) shipped with four signals (S1 coupling creep, S2 broken windows, S3 test runtime/flake, S4 UL drift). Skill freshness is the missing fifth — it watches the discipline layer the same way S4 watches the vocabulary layer.

The brainstorm flagged this for elevated priority because it should land *close in time* to the drift scan, not "years later" — the scan exists to surface rot, freshness metadata is the rot indicator the scan needs.

---

## 2. Goals / non-goals

### Goals
- Every skill file has a machine-readable last-validated date.
- A weekly drift signal surfaces skills past a tunable staleness threshold.
- Stale skills produce a single Linear issue per scan in Continuous Improvement (matching S1–S4 cadence).
- The convention is documented in CLAUDE.md so editors know to bump the date.
- The shared-skill mirror (`.claude/` ↔ `.agents/`) stays byte-identical via the existing `check:skill-sync` hook with no schema changes.

### Non-goals
- **Auto-mutating skill files on load.** Tempting (cheap "validation as side-effect of use") but adds implicit file mutation to read paths and complicates determinism. Defer until the simpler mechanism proves insufficient — see §12.
- **Tracking skill-load frequency for archive detection.** Requires usage-tracking infrastructure that does not exist; "skills never loaded >90 days = archive candidates" is a separate problem space. Defer.
- **Schema-validating individual frontmatter fields beyond presence/format.** S5 only checks the date is parsable and within range.
- **Replacing the existing skill review process.** Editors still own correctness; freshness metadata is just the visibility layer.

---

## 3. Design

### 3.1 Frontmatter schema

Add one optional field to the existing skill frontmatter:

```yaml
---
name: encounter-pipeline
description: >
  ...
model: opus
last_validated_against: 2026-05-08
---
```

Rules:
- ISO 8601 date only — `YYYY-MM-DD`. No time, no timezone.
- Field is optional in the type sense (legacy skills without it are tolerated for one drift-scan cycle, then surfaced as needing bootstrap), but **required by convention** for any skill that has been touched after this issue ships.
- The date represents "an editor confirmed this skill is accurate against the current codebase on this date." Not file-mtime, not git-commit-date — an explicit human/agent affirmation.

### 3.2 Bootstrap (one-time)

Add a small script `scripts/skill-freshness-bootstrap.ts` that:
1. Walks `.claude/skills/*/SKILL.md` and `.agents/skills/*/SKILL.md`.
2. Inserts `last_validated_against: <today's date>` into the frontmatter block immediately after the existing `description:` line (or after `model:` if present).
3. Skips files that already have the field.
4. Idempotent: re-running has no effect.
5. After running, executes `node scripts/check-skill-sync.js --sync` to keep shared skills byte-identical.

The bootstrap runs once at delivery time. The committed value is the merge-commit date — a fair "we last looked at every skill *as a sweep* on this date" baseline.

### 3.3 Convention: when to bump the date

Append a one-paragraph rule to **CLAUDE.md** under "Skill Tree Layout":

> **When you edit a skill, bump `last_validated_against` to today's date** if the edit changed instructions, examples, or referenced systems — not for pure formatting/typo fixes. The date answers "when did someone last confirm this is current against the codebase?" It is not a file-modification timestamp; it is a human/agent affirmation. If you read a skill and confirm it's still accurate without changing anything, you may also bump the date in a one-line commit (this is the "agent-on-confirm" lightweight path).

Mirror this rule in:
- `.claude/skills/skill-creator/SKILL.md` (if it exists — defer if not present; primary normative source is CLAUDE.md).
- The drift-scan signal's emitted Linear issue body (so the human triaging the issue sees the rule inline).

### 3.4 New drift-scan signal — S5: Skill freshness

Extend `scripts/drift-scan/index.ts` with a fifth signal modeled on S4.

**Inputs:**
- Frontmatter `last_validated_against` field from every `SKILL.md` under `.claude/skills/` and `.agents/skills/` (deduplicated by skill name — shared skills count once).
- `runDate` (already passed through the runner).

**Logic:**
- Parse each skill's frontmatter. If `last_validated_against` is missing or unparsable, classify as **bootstrap-needed**.
- For skills with a parsable date, compute `daysSinceValidated = runDate - last_validated_against`.
- A skill is **stale** if `daysSinceValidated > SKILL_FRESHNESS_STALE_DAYS` (default 60 days, see Constants).
- A skill is **archive-candidate-by-age** if `daysSinceValidated > SKILL_FRESHNESS_ARCHIVE_DAYS` (default 180 days). This is the age-based archive path (load-frequency-based archive is deferred — §12). 180 ≠ "never loaded for 90 days" from the brainstorm; it is the conservative age cap that doesn't require usage tracking.

**Signal output:**
- **Green:** zero stale, zero bootstrap-needed.
- **Skipped:** skills directory not present (CI sandbox missing repo files).
- **Red** if any skill is stale, archive-candidate, or bootstrap-needed. Red issue body lists three sections (omitting empty ones):
  - `### Stale skills (>60 days unvalidated)` — table of skill name, last validated, days unvalidated.
  - `### Archive-candidate skills (>180 days unvalidated)` — same shape, sorted by days unvalidated descending.
  - `### Skills missing freshness metadata` — table of skill name, path. Flags newly-added skills that forgot frontmatter.

The issue title and label conventions match S1–S4: `Drift scan [YYYY-MM-DD]: Skill freshness — N stale, M archive-candidate, K bootstrap-needed`, label `drift-scan`, opens in Continuous Improvement.

### 3.5 Skill-sync hook integration

`scripts/check-skill-sync.js` does byte-exact comparison. Shared-skill copies must agree on `last_validated_against`. Two implications:
- The bootstrap script writes the same value to both copies.
- When an editor bumps the date in a shared skill, they must run `npm run check:skill-sync:sync` before committing (already standard practice).
- No code change to `check-skill-sync.js` itself is needed.

Audit: shared skills (visible in both `.claude/skills/` and `.agents/skills/`) currently number ~30 of the ~33 in `.claude/`. The bootstrap covers all of them in one pass.

### 3.6 Executor mechanics

Codex-friendly because every step is mechanical pattern-following:
1. **Bootstrap script** — one new TypeScript file in `scripts/`, deterministic frontmatter mutation. Pattern matches existing scripts in `scripts/` (e.g., `enhance-frontmatter.ts`).
2. **Drift-scan S5** — extend `scripts/drift-scan/index.ts` by analogy with `evaluateUlDrift` (§S4). Add `SKILL_FRESHNESS_STALE_DAYS`, `SKILL_FRESHNESS_ARCHIVE_DAYS` to the named-constants block at the top.
3. **CLAUDE.md edit** — single paragraph append, well-localized.
4. **One-line commit** — convention-bump example in the issue closeout.

No judgment-heavy decisions remain; all open questions are resolved here.

### 3.7 Resolved open questions (from brainstorm §8)

- **Mechanism: agent-on-load vs. periodic vs. automated?** → **Convention-driven (agent/human bumps on meaningful edit) + weekly drift scan visibility.** Reasons: (a) cheapest; (b) keeps file mutation explicit; (c) builds on the drift-scan infra that already exists. Auto-mutating on load is deferred — re-evaluate after one drift-scan cycle if convention adoption is poor.
- **What counts as "validating"?** → A meaningful content edit, OR an explicit no-change "I read this and confirmed it's accurate" date bump (small commit). Both bump the date.
- **What counts as "stale"?** → 60 days. Less than the 30-day UL window because skills are larger artifacts and don't churn as fast as terms; more than the 90-day brainstorm suggestion because we want signal early enough to act, not at the cliff.
- **Is "never loaded for 90 days" still the archive trigger?** → Replaced for v1 with "180 days unvalidated" — a strictly age-based heuristic that avoids needing usage telemetry. Re-add the load-frequency variant as a follow-up once usage tracking exists (THR-270 candidate `agent-cost-audit` would surface this).

---

## 4. Three-pillar mapping

This is process/tooling infrastructure, not a game feature. **All three pillars are explicitly N/A** with the rationale below — per design-governance Three-Pillar Rule, marking N/A is required, not optional.

| Pillar | Status | Rationale |
|---|---|---|
| Engine | N/A | No tick-loop, graph, PRNG, or simulation surface touched. Drift scan runs in CI on cron, not at game runtime. Engine state is unaffected. |
| Content | N/A | No game content authored or modified. Skill files are agent instructions, not player-visible content. |
| UI | N/A | No player-facing surface, no DebugPanel surface, no Linear app UI work beyond the existing drift-scan issue creation that already lands in CI. |

This matches the precedent set by ARC-60 itself ("Three-pillar status: This is process/tooling infrastructure, not a game feature. Three-pillar rule does not apply.") and by THR-294 (UL drift triage).

---

## 5. Constants table (NFP #1: Tunability)

Every magic number is a named constant. All live at the top of `scripts/drift-scan/index.ts` next to the existing `S1`/`S2`/`S3`/`S4` thresholds.

| Constant | Default | Purpose |
|---|---|---|
| `SKILL_FRESHNESS_STALE_DAYS` | `60` | Skills with `last_validated_against` older than this surface as **stale** in S5. |
| `SKILL_FRESHNESS_ARCHIVE_DAYS` | `180` | Skills with `last_validated_against` older than this surface as **archive candidate** (stronger signal — review or retire). |
| `SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS` | `7` | Skills missing the field that were created within this many days do not red-flag yet — covers the first weekly scan after a new skill ships. After this window expires, missing-field skills surface in the bootstrap-needed section. |

The ARC-60 brainstorm proposed 60/90; this design uses 60/180 (see §3.7 for the change rationale). Tune by editing the constants and re-running drift-scan; no rebuild needed beyond `tsc`.

---

## 6. Tracing / observability (NFP #2: Inspectability)

S5 follows the S1–S4 trace pattern:
- **Console output during scan:** `[S5] Skill freshness — red: N stale, M archive-candidate, K bootstrap-needed` (or `green` / `skipped`).
- **Linear issue body** is the human-readable trace — three tables (stale / archive / bootstrap), each row carries the data point that triggered it.
- **`drift-scan-baseline.json`** gains a `s5SkillFreshness` field recording per-skill `lastValidatedAt` so future runs can detect regressions (e.g., a skill's date moved backwards — should never happen but we'll catch it if it does).

No new TypeScript types required beyond extending the existing `Baseline` interface in `scripts/drift-scan/index.ts`. Match the pattern of `nextCanonicalLastSeen` from S4.

---

## 7. Fail-soft (NFP #4)

| Failure | Behavior |
|---|---|
| Skills directory missing (sandbox without repo) | S5 returns `skipped` with reason. Drift scan continues. |
| Frontmatter parse failure on a single skill | Skill is classified as **bootstrap-needed**. S5 does not abort. Body row carries the parse error. |
| Date string unparsable | Same as parse failure — bootstrap-needed. |
| Linear issue creation fails (e.g., LINEAR_API_KEY missing) | Existing drift-scan resilience already handles this; S5 inherits. |
| Bootstrap script run twice | Idempotent — second run is a no-op (skips files that already have the field). |
| Bootstrap script fails partway | Each file is written atomically; partial run leaves a mix of bootstrapped and non-bootstrapped files. Re-running completes the rest. |

No new throw paths in the drift-scan runner; S5 maps onto the existing `SignalResult` discriminated union (`green` / `skipped` / `red`).

---

## 8. NFP audit

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | Three named constants in the existing drift-scan constants block. |
| #2 Inspectability | PASS | Scan emits structured Linear issues; baseline JSON gains s5SkillFreshness. |
| #3 Determinism | PASS | Bootstrap is idempotent. Scan output is a pure function of (frontmatter dates, runDate). |
| #4 Fail-soft | PASS | See §7. No exceptions thrown into the runner. |
| #5 Narrative over mechanical | N/A | No narrative surface. |
| #6 Additive over destructive | PASS | Adds a frontmatter field (optional) and a new signal. No removals, no schema breaks. Existing skills without the field are tolerated for one cycle, then bootstrap-flagged. |
| #7 Performance budget | PASS | Drift scan already iterates the repo; adding ~33 frontmatter parses is negligible against the existing S1 (370-importer scan) and S2 (full-source corpus walk) work. |

---

## 9. Implementation plan

Single-PR scope, executable in one Codex session (~ ½ day).

**Phase 1 — Bootstrap script + run.**
1. Create `scripts/skill-freshness-bootstrap.ts`:
   - Walks `.claude/skills/*/SKILL.md` and `.agents/skills/*/SKILL.md`.
   - Inserts `last_validated_against: <runDate>` into each frontmatter block (after `description:` or `model:`, whichever is later).
   - Idempotent — skips files that already have the field.
   - Runs `node scripts/check-skill-sync.js --sync` at the end.
2. Run the script once. Commit the resulting frontmatter changes in a single mechanical commit (`chore: bootstrap last_validated_against frontmatter on all SKILL.md (THR-265)`).

**Phase 2 — S5 signal in drift-scan.**
1. Add the three constants to `scripts/drift-scan/index.ts` near the existing thresholds.
2. Add `extractSkillFreshness()` helper that walks the two skills directories, dedupes by skill name, and returns `Array<{ skillName, path, lastValidatedAt: string | null }>`.
3. Add `evaluateSkillFreshness()` modeled on `evaluateUlDrift()` — pure function from inputs to a `SignalResult` plus a baseline-update record.
4. Wire it into the runner step list as `S5`. Title format: `Drift scan [YYYY-MM-DD]: Skill freshness — N stale, M archive-candidate, K bootstrap-needed`.
5. Extend `Baseline` type with `s5SkillFreshness?: { lastValidatedAt: Record<string, string> }`.
6. Add unit tests under `scripts/drift-scan/__tests__/` (or wherever the existing S1–S4 tests live — match precedent) covering: green path, all-stale, archive-candidate, missing-field with grace window, missing-field past grace, baseline regression detection.

**Phase 3 — Doc updates.**
1. CLAUDE.md: add the convention paragraph in §"Skill Tree Layout" (insertion point near the existing canonical-vs-mirror discussion).
2. `Docs/changelog.md`: append a row.
3. `Docs/plans/wiring-checklist.md`: no entry needed — drift-scan signals aren't part of the engine wiring registry.
4. Linear: close THR-265 with `Fixes THR-265` on the merge commit; merge-to-main auto-close handles state.

**Verification (CC pre-commit minimum, full set):**
- `npm test` — drift-scan unit tests pass, no other suite regressions.
- `npx tsc --noEmit` — clean.
- `npx vite build` — clean.
- `npm run check:process` — advisory.
- `npm run check:skill-sync` — byte-identical post-bootstrap.
- Manual sanity run of the drift scan: `node --experimental-strip-types scripts/drift-scan/index.ts` (stub `LINEAR_API_KEY=` to bypass issue creation; should print `[S5] Skill freshness — green` if bootstrap completed cleanly).

---

## 10. Done-when

- [ ] Every `SKILL.md` in `.claude/skills/` and `.agents/skills/` has a `last_validated_against: YYYY-MM-DD` line in its frontmatter.
- [ ] `npm run check:skill-sync` passes — shared-skill copies byte-identical including the new field.
- [ ] `scripts/drift-scan/index.ts` exports a S5 signal step that produces green/skipped/red per the rules in §3.4.
- [ ] Three new constants (`SKILL_FRESHNESS_STALE_DAYS`, `SKILL_FRESHNESS_ARCHIVE_DAYS`, `SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS`) declared at the top of `scripts/drift-scan/index.ts`.
- [ ] Drift-scan baseline JSON gains a `s5SkillFreshness` block.
- [ ] Unit tests cover green, stale, archive-candidate, missing-with-grace, missing-past-grace, baseline-regression cases — all green.
- [ ] CLAUDE.md "Skill Tree Layout" section gains the convention paragraph.
- [ ] `Docs/changelog.md` row appended.
- [ ] All four pre-commit checks (`npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:skill-sync`) pass; verification evidence (terminal output or green CI link) included in the closing commit body or Linear closeout comment.
- [ ] Closing commit includes `Fixes THR-265` so merge-to-main auto-close fires.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Bootstrap script malforms YAML frontmatter | Cover with a unit test that parses every SKILL.md after bootstrap with a YAML library and asserts presence of `last_validated_against`. |
| Convention not adopted (editors don't bump dates) | Drift scan surfaces this within 60 days. The Linear issue is the forcing function — same pressure that keeps S4 healthy. If adoption is still poor after two scan cycles, re-evaluate the agent-on-load alternative (see §12). |
| Shared-skill drift across `.claude/`/`.agents/` after manual edits | Existing `check:skill-sync` pre-commit hook catches this — no new tooling needed. |
| Drift scan runtime regression | S5 adds a small directory walk + ~33 frontmatter parses. Expected runtime delta <100ms on a runner that already takes minutes for S1/S2. Acceptable. |
| First scan after merge floods Linear with "stale" issues | Bootstrap sets the date to merge-commit-day. First scan fires 7 days later — every skill is well within the 60-day stale window. No flood. |
| Skill files without frontmatter at all (legacy or hand-rolled) | Audit pass during Phase 1 confirms every existing skill already uses YAML frontmatter (verified — see §3.1). New skills authored without frontmatter will fail the existing skill-sync hook independently. |

---

## 12. Follow-ups (deferrals — open Linear issues if/when triggered)

1. **Agent-on-load auto-bumping** — implicit "validation as side-effect of use." Defer until convention adoption proves insufficient (i.e., S5 stays red across two consecutive scans without convention bumps closing it). When triggered, file as a child of THR-265 with a design pass on (a) which read paths trigger the bump, (b) how to keep mutation deterministic in tests, (c) interaction with shared-skill mirror.
2. **Load-frequency-based archive detection** — the brainstorm's original "skills never loaded >90 days = archive candidates." Requires usage telemetry that does not exist today (see deferred THR-270 `agent-cost-audit` skill candidate). Re-evaluate once telemetry is available.
3. **Per-domain freshness budgets** — a hot domain (e.g., encounter-pipeline during the migration) might want a tighter staleness window than a cold one (image-manipulation). Defer; current uniform 60/180 is good enough for v1.
4. **Skill-creator tooling stamp** — when `skill-creator` generates a new skill, it should write `last_validated_against: <today>` automatically. Small, but file under skill-creator maintenance, not THR-265.

---

## 13. Coordination block

- **Suggested executor:** Codex (mechanical pattern-following — bootstrap script + new S5 signal mirroring S4 + small CLAUDE.md edit). No content authoring, no novel system, no judgment-heavy reads.
- **Parallel-safe with:** game-content issues, engine feature work, UI work. S5 only touches `scripts/drift-scan/`, `scripts/skill-freshness-bootstrap.ts`, every `SKILL.md`, and CLAUDE.md.
- **Mutex with:** any open issue that touches `scripts/drift-scan/index.ts` (currently none). Any open issue editing `.claude/skills/*/SKILL.md` or `.agents/skills/*/SKILL.md` frontmatter — a bulk frontmatter mutation would conflict with concurrent skill content edits. Practically: no in-flight skill edits today (verified against current Linear board). Coordinate before claiming if anything lands in In Dev that touches skill files.
- **Codex review needed:** no — single-PR, mechanical, well-tested.

### Files to touch

- `scripts/skill-freshness-bootstrap.ts` *(new)*
- `scripts/drift-scan/index.ts` *(extend)*
- `scripts/drift-scan/__tests__/` *(new tests, match existing pattern)*
- `.claude/skills/*/SKILL.md` *(bootstrap pass — frontmatter only)*
- `.agents/skills/*/SKILL.md` *(bootstrap pass — frontmatter only)*
- `CLAUDE.md` *(convention paragraph in Skill Tree Layout)*
- `Docs/changelog.md` *(row)*
- `package.json` *(optional — add `skill-freshness-bootstrap` script if convenient; not required)*

---

## 14. Sources

- ARC-60 — *Recurring process to keep codebase health from degrading (Farley × Pocock)* (Done 2026-04-27). [Linear](https://linear.app/threadbare/issue/ARC-60)
- `Docs/plans/2026-04-24-codebase-health-recurring-process-brainstorm.md` §5.2 item 6, §8 open question.
- `Docs/plans/2026-04-24-codebase-health-first-wave.md` — drift-scan v1.
- `Docs/plans/2026-05-01-thr-294-ul-drift-triage.md` — S4 triage pattern.
- `scripts/drift-scan/index.ts` — current signal implementations (S1–S4).
- `scripts/check-skill-sync.js` — shared-skill mirror enforcement.
- CLAUDE.md "Skill Tree Layout" — canonical/mirror policy.
