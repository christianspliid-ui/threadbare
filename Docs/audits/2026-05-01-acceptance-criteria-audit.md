# Acceptance Criteria Audit — 2026-05-01

**Audit type:** Pattern-extraction across delivered work to inform per-category acceptance-criteria templates.
**Window:** 211 Done issues across 19 projects (Threadbare team).
**Sample:** 51 issues, stratified across all projects, deep-investigated (issue body + handoff comment + completion comment + plan doc).
**Intended consumer:** Next retrospective. Concrete proposals at the end.
**Author:** Cowork (audit pass).

---

## 1. Headline findings

1. **AC quality is bimodal.** Numerically-verifiable AC (`≥8 verbs`, `scrollDelta=0`, `4/4 phase activations in order`, `parity output byte-identical to main`) closes cleanly with confidence. Aspirational/feel-based AC ("feel-oriented features", "next session drafts companion without being reminded", "polished") never gets verified — the closing comment goes silent on the soft items.
2. **Visual correctness is systematically unchecked.** Of nine UI-pillar issues investigated, only one (`THR-211`, the playtest-skill itself) actually exercised the live UI. Two issues had explicit "screenshots attached" AC items that closed without screenshots (`THR-173`, `THR-174`). Even the styleguide page (`THR-47`) shipped without a screenshot of itself. Tests + build + tsc are doing duty for visual review.
3. **Self-applicability gap for process work.** Skills, hooks, scheduled tasks, and CLAUDE.md governance edits routinely close on "shipped, claim AC met" without a "watched-it-fire-once" check. `THR-218` ships a skill whose AC includes a deferred behavioral signal ("next session drafts a companion without being reminded") that is never confirmed at close. `THR-273` ships a scheduled task; the auto-close keyword for that very issue did not fire on its own merge.
4. **Codex review consistently catches 1–3 architectural issues per multi-pillar feature**, but is run inconsistently. `THR-15`, `THR-19`, `THR-30`, `THR-148`, `THR-159` all had Codex catches that were addressed pre-merge. The features that *didn't* have Codex review on the path don't have a comparable safety net.
5. **Quality-gate iteration is already its own protocol** — but it isn't codified. `THR-29`, `THR-30`, and `THR-22` all failed an initial three-pillar / vibe gate, came back with a "quality-gate addendum" doc adding 4 player-experience benchmark scenes + an emotional-architecture section, and then signed off. This pattern works. It belongs in the AC template for narrative-heavy features, not as one-off retrofits.
6. **Reopens are usually coordination-automation failures, not work-quality reopens.** `THR-238` reopened because a plan-doc PR with the issue ID in its title triggered premature auto-close. `THR-271` stayed In Dev because LINEAR_API_KEY was unset. `THR-159` and `THR-190` reopened because `Fixes THR-XX` was missing from the closing commit. The reopen rate driven by "what we shipped wasn't right" is approximately zero in the sample.
7. **Handoff comments are doing real work that plan docs aren't.** Across nearly every multi-pillar feature, the Linear handoff re-states AC, resolves grey zones, embeds the coordination block, and frequently corrects the issue description's premise. The handoff is the de facto "ready to build" gate. Several issues (e.g. `THR-181`) explicitly ship without a separate plan doc, with the entire change inlined in the handoff — and this is appropriate for trivial doctrinal patches.

These seven findings drive the templates in §7 and the reviewer wiring in §8.

---

## 2. Method

Two passes.

**Distribution pass.** Pulled all 211 Done issues for the Threadbare team via Linear MCP, parsed into a per-project distribution. 19 projects represented; Encounter Format Migration (44) and Continuous Improvement (29) dominate; long tail of 1–3 issues across a dozen smaller projects.

**Deep-investigation pass.** Selected 51 issues stratified across all 19 projects, weighted toward larger and more recent ones but with at least one issue from every project. Three parallel research agents read each issue's body, handoff comment, completion comment, and (where referenced) the plan doc in `Docs/plans/`. Each agent returned a 12-line structured summary per issue plus a cross-batch pattern section. Patterns were synthesized in this audit.

**What was checked per issue.** Issue type, plan-doc presence, plan-doc shape (NFP table / three-pillar coverage / constants / fail-soft / traces / AC checklist), stated AC at handoff, verification evidence in completion comment, reopen status, defer-outs spawned, three-pillar actually delivered, and any standout pattern (positive or negative).

**What was *not* checked.** Source diff quality, post-merge regressions, downstream user satisfaction. The audit is on the *acceptance gate*, not the work itself.

---

## 3. Sample distribution

| Project | Done count | Sampled | Notes |
|---|---:|---:|---|
| Encounter Format Migration | 44 | 8 | Multi-phase migration; pilot, content, plumbing, removal |
| Continuous Improvement | 29 | 5 | Skills, scheduled tasks, hygiene |
| Social Systems Expansion | 24 | 5 | Full-stack features (Secrets, Faction Agency, etc.) |
| Content Architecture | 20 | 4 | Procedural primitives, choice_set, stateful shells |
| Repo Health | 17 | 4 | Test-suite stabilization v1 + v2, CI setup |
| Thematic Pressure & Living World | 16 | 3 | Omen system, doom identity, intent visibility |
| Elder Magic & Ruins | 10 | 3 | PR0/PR4/PR8 — portfolio-pinning, Delve, guild quests |
| Agent Coordination Protocol | 9 | 2 | Pull-work wrapper, codex read-only doctrine |
| Interface Playtest & IA Audit | 8 | 3 | IA manifest, playtest run, sidebar bug |
| UI Visual Overhaul — Design System v1 | 8 | 3 | Tokens, Thread panel redesign, viewport audit |
| Attention Tier Model | 6 | 2 | Phase 6 UI, wound detection |
| UI/UX Design Infrastructure | 5 | 2 | frontend-ui skill, styleguide page |
| Vision Layer & Design Dialogue | 4 | 2 | game-design-direction skill, Designpowers integration |
| Linear setup for Cowork & CC | 3 | 1 | DoD hook enforcement |
| Rarity Model | 3 | 1 | Hex map rarity signifiers |
| Repo & Deploy Hygiene | 2 | 0 | (Out of sample — small overlap with Repo Health) |
| Code Hygiene | 1 | 1 | Raw event feed → DebugPanel |
| Marketing Site | 1 | 1 | Voice-rule copy pass |
| Procedural Hex Vignettes | 1 | 1 | Phase 2 chunked filler |
| **Total** | **211** | **51** | **24% sample, all 19 projects represented** |

---

## 4. Empirical categories

These nine categories emerged from the sample. They are not mutually exclusive — a Phase 1 pilot of a content migration is both a "multi-phase content port" and a "full-stack systemic feature" because it pioneers the migration shape. The category that gets applied is the *primary* one for AC purposes.

### 4.1 Full-stack systemic feature

**Definition.** Adds or significantly extends a game system across Engine + Content + UI in one ship (or one program with explicit splits across follow-on issues).
**Sample examples.** `THR-19` (Omen Agenda System), `THR-22` (Intent & Activity Visibility), `THR-29` (Faction Agency), `THR-30` (Secrets & Favors), `THR-53` (Stateful Shells), `THR-152` (Delve encounter variant), `THR-225` (Event recipe phased activation).
**Prevalence in sample.** 12/51 (~24%).
**Distinctive AC traits.**
- Plan doc with NFP table + three-pillar sections + constants + fail-soft + traces (the canonical shape; `THR-53` is the cleanest example).
- Concrete numbered AC list, frequently with quality-gate addendum after first review pass.
- Codex pre-merge review catches 1–3 issues consistently when it runs.

### 4.2 Multi-phase content migration

**Definition.** Mechanical port of many similar templates from one format to another, with each batch a separate Linear issue under an umbrella plan doc.
**Sample examples.** `THR-89` (thieves guild Phase 1), `THR-99` (Temple of Spheres Phase 2), `THR-107` (borderland Phase 4), `THR-100`–`THR-108` (the full migration sequence).
**Prevalence in sample.** 8/51 (~16%) — but ~44/211 (~21%) of total Done issues — under-sampled to make room for diversity.
**Distinctive AC traits.**
- Shared umbrella plan; per-issue handoff re-states AC and adds per-batch coverage targets (`≥8 dual-axis`, `≥7 hidden marks`, `≥6 encounter seeds`, etc.).
- Voice-bible invariant (e.g. "the word 'god' is forbidden").
- Verification gates standardized across the program: tsc + tests + vite build + CLI smoke + browser visual.
- Defer-out spawning is a normal closing step ("ActionStepBranch deferred to follow-on").

### 4.3 Engine plumbing / observability / refactor

**Definition.** Restructures, instruments, or removes engine-side machinery without adding a new player-facing system.
**Sample examples.** `THR-108` (remove EncounterTemplate), `THR-110` (wire enrichProse into adapter), `THR-111` (instrument aftermath tracing), `THR-156` (guild quest hook plumbing), `THR-238` (declarative phase registry).
**Prevalence in sample.** 6/51 (~12%).
**Distinctive AC traits.**
- AC framed around *parity with legacy* + *regression lock*. `THR-238` shipped a byte-identical CLI output baseline test.
- Drift tests (a test that *prevents the bug class from recurring*) appear here regularly; `THR-111` adding a TRACE_CATEGORIES drift test is the model.
- Three-pillar usually Engine-only with explicit N/A rationale for Content and UI.
- Risk profile is "broke something quiet that we won't notice for a week" — verification needs to be paranoid.

### 4.4 UI component / panel / token system

**Definition.** Builds or redesigns a player-visible surface, or extends the design-system token tree.
**Sample examples.** `THR-26` (hex map rarity signifiers), `THR-47` (styleguide page), `THR-168` (design tokens), `THR-173` (Thread/Retinue redesign), `THR-174` (viewport audit), `THR-184` (ascendant bar), `THR-190` (raw event feed → DebugPanel).
**Prevalence in sample.** 9/51 (~18%).
**Distinctive AC traits.**
- References shared primitives (SectionHeading, Card, ListRow, ProgressBand, ActivityIcon, SphereIcon) and tokens (`--sphere-*`, `--type-*`).
- Frequent "screenshots required" AC item that goes unsatisfied.
- Viewport contract (1920×1080) explicit in `THR-174` only; not standard.
- Accessibility AC almost never present.
- Visual-correctness check is the systematic gap.

### 4.5 Audit / triage

**Definition.** Produces a structured findings document and spawns child issues for the items it surfaces. Output IS the deliverable; no in-issue fixing.
**Sample examples.** `THR-129` (post-pilot encounter migration audit), `THR-232` (game-node audit), `THR-279` (orphan triage), `THR-281` (test-suite triage).
**Prevalence in sample.** 4/51 (~8%).
**Distinctive AC traits.**
- AC = "report exists at path X with N rows in Y categories + spawned tickets per cluster".
- "No fixing in this issue" is an explicit guardrail.
- Each row of the report has Result + Evidence columns. UNABLE/SKIP markers are valid.
- Surprises section is part of the format — items that don't fit the rubric get captured anyway.

### 4.6 Process / coordination / governance improvement

**Definition.** Skills, hooks, scheduled tasks, slash commands, or doctrine patches that change *how work happens* rather than what ships in-game.
**Sample examples.** `THR-181` (Codex read-only doctrine), `THR-218` (game-design-direction skill), `THR-243` (exemplars index), `THR-244` (Designpowers integration), `THR-247` (atomic pull-work wrapper), `THR-271` (UL skill), `THR-273` (drift scan), `THR-287` (flush-plan-docs scheduled task).
**Prevalence in sample.** 8/51 (~16%).
**Distinctive AC traits.**
- Plan doc often *absent* — handoff serves as plan, sometimes inlining the entire edit verbatim (`THR-181`, `THR-244`).
- AC is binary-checkable: file exists, hook fires, test command runs.
- Self-applicability check almost always missing — the thing built to improve the process never gets exercised in the process before close.

### 4.7 Test-suite / sandbox / CI work

**Definition.** Keeps the repo healthy: red-suite stabilization, CI setup, sandbox limitation workarounds, branch-protection rollouts.
**Sample examples.** `THR-160` (suite repair v1), `THR-161` (CI setup), `THR-280` (suite stabilization v2), `THR-281` (triage report).
**Prevalence in sample.** 4/51 (~8%).
**Distinctive AC traits.**
- AC = "suite green + 3-day green watch + branch protection re-enabled".
- Closeout often partial-honest ("closed despite branch protection still blocked, tracked in `THR-282`").
- Tabular per-day CI status table is a strong reusable output format.

### 4.8 Bug fix

**Definition.** Narrow mechanical fix from a triage report, playtest finding, or impediment log.
**Sample examples.** `THR-17` (wound flag), `THR-275` (HexSidebar click handler), `THR-118` (wiring guide corrections).
**Prevalence in sample.** 4/51 (~8%).
**Distinctive AC traits.**
- AC is implementation-shaped: "add prop, wire in GameView, expected behavior X".
- Often no plan doc; issue body lists line numbers and fix sketch.
- Test count is small but specifically targeted at the bug shape.

### 4.9 Marketing / public-facing copy

**Definition.** Voice-rule copy passes, marketing site content, public landing pages.
**Sample examples.** `THR-159` (voice-rule pass on `public/the-game.html`).
**Prevalence in sample.** 1/51 (~2%) — small slice, but distinct discipline.
**Distinctive AC traits.**
- AC = grep-based mechanical compliance + verbatim before/after diffs in plan + Codex review for tone.
- Visual asset wiring (image paths) evades grep — needs a second reviewer pass.
- User signoff on tone implicit via Codex "yes" review flag.

---

## 5. Implicit acceptance criteria — what was actually checked

The 51-issue investigation surfaced 13 cross-cutting patterns. Many recur in multiple categories.

1. **Plan-doc shape varies by category but isn't codified.** Multi-phase content has umbrella docs; full-stack features have full canonical docs; infra/governance often has no separate doc; audits have rubric-shaped docs. Plans without the right shape for their category get retrofitted via handoff comments.
2. **Handoff comment as de facto build gate.** Re-states AC, resolves grey zones, embeds coordination block. For trivial doctrinal patches, handoff *is* the plan (legitimate pattern).
3. **Bimodal AC quality.** Numerically-verifiable AC closes cleanly. Aspirational/feel-based AC never gets verified.
4. **Verification evidence wildly inconsistent.** Best practice (raw output + per-AC parity script output, e.g. `THR-79`, `THR-99`, `THR-225`, `THR-244`) is a small minority. Most issues claim test counts; some are silent. The Definition-of-Done allows "raw output OR linked CI run" but the form drifts.
5. **Three-pillar discipline mostly works at design time** but degrades at close — UI pillar in particular ships without visual proof.
6. **Quality-gate iteration is its own protocol.** Player-experience scenarios + benchmark scenes + emotional architecture. Used for narrative-heavy features in Social Systems Expansion. Should be category-codified.
7. **Visual correctness systematically unchecked.** See finding #2 in §1.
8. **Audit issues have a sharper AC pattern** than feature issues. Reusable: "report at path X with N rows in Y buckets + spawned child issues".
9. **Self-applicability gap for process work.** Skill/hook/script ships without a "fired once in the wild" check.
10. **Codex review catches consistently when run, but isn't run consistently.** No standing rule for which categories require it.
11. **Reopens are coordination-automation failures.** Premature auto-close from PR title; missing Fixes keyword; LINEAR_API_KEY unset. Not "shipped wrong", "shipped right but Linear didn't notice".
12. **Marketing/copy work needs visual + grep AC.** Grep alone misses image paths.
13. **Behavioral AC ("agent does X next time") never verified at close.** Skill ships, AC is claimed, behavior is never demonstrated in the same issue.

---

## 6. Gaps surfaced

Distilled from §5 into things to fix:

**G1. No category-aware AC template.** Every issue invents its AC. The good ones converge to similar shapes per category (audit-rubric, parity-baseline, full-stack-feature). There's no shared template per category for the handoff to start from.

**G2. Visual proof is optional but should be category-required.** UI-pillar work that closes without screenshots or a playtest run should not pass acceptance.

**G3. Quality-gate addendum protocol is undocumented.** It exists, it works, it's not in CLAUDE.md or any skill. New designers won't apply it.

**G4. Codex review (or its replacement) is undocumented as a per-category requirement.** Multi-pillar features benefit from it consistently but it's invoked by individual judgment.

**G5. Self-applicability check missing for process work.** A skill that ships should fire once in-session before close. A scheduled task that ships should fire once and the trace should be visible.

**G6. Verification evidence formatting drifts.** Raw output is the gold standard, claim-only is the floor, link-to-PR is in between. Should be more uniform.

**G7. Behavioral AC items are unverifiable at the issue scope.** Either drop them or convert to a proxy ("I exercised the skill once and it produced output X").

**G8. Accessibility AC absent everywhere.** Not a finding from any single issue — a finding from *no* issue having one.

**G9. Reopen coordination-automation fragility.** `Fixes` keyword discipline depends on memory; plan-doc PR titles can falsely auto-close issues. Out of scope for this audit but flagged.

---

## 7. Proposed acceptance criteria templates per category

Each template gives a **must-have checklist** (binary, falsifiable items) and a **rubric** (severity tiers explaining what counts as PASS / NEEDS-WORK / FAIL when judgment is required). Each item is tagged by who or what verifies it:

- 🤖 **Automated** — CI, lint, hook, or shell command
- 👤 **Human judgment** — only the user can decide
- 🧠 **Single-agent review** — one reviewer pass (codex review, code-review skill, prose voice check, etc.)
- 🎭 **Multi-agent council** — multiple reviewers / multi-pass workflow

---

### 7.1 Full-stack systemic feature

**Plan-doc preconditions** *(checked at design time, before handoff):*

- [ ] 🤖 Plan doc exists at `Docs/plans/YYYY-MM-DD-<topic>.md`.
- [ ] 🧠 Plan doc has Engine + Content + UI sections (or N/A with explicit rationale).
- [ ] 🧠 Plan doc has Constants Table (every tunable named with default + purpose).
- [ ] 🧠 Plan doc has Fail-Soft Table (failure modes + fallbacks).
- [ ] 🧠 Plan doc has Trace Contract (categories emitted + interface defs).
- [ ] 🧠 Plan doc has Wiring section (orchestrator phase, UI mount, debug visibility, prose pipeline).
- [ ] 🧠 Plan doc has NFP Compliance Summary (PASS / PASS-with-note per priority).
- [ ] 🎭 If narrative-heavy (story beats, dilemmas, social scenes): Quality-Gate Addendum present (4 benchmark player scenes + emotional architecture + intended-feeling map). *See §7.10.*

**Implementation AC** *(checked at completion):*

- [ ] 🤖 `npm test` green — paste raw output OR link to CI run for the merge SHA.
- [ ] 🤖 `npx tsc --noEmit` green — paste output.
- [ ] 🤖 `npx vite build` green — paste output.
- [ ] 🤖 CLI smoke (`npm run cli -- --seed 42 --map medium`, ≥30 ticks) — paste status + events sample.
- [ ] 🤖 Constants table in code matches plan-doc constants table (no magic numbers introduced).
- [ ] 🤖 Traces emitted match Trace Contract (drift test exists or `npm run check:process` passes).
- [ ] 🧠 Codex review (or replacement reviewer) run; findings categorized CRITICAL / MEDIUM / LOW; CRITICAL items addressed pre-merge.
- [ ] 🧠 Three-pillar delivered as designed (Engine / Content / UI all shipped, or split-shipping documented with follow-on Linear issues).
- [ ] 🧠 If UI pillar in scope: visual proof — screenshot at 1920×1080 OR playtest skill run with PASS verdict for affected surface.
- [ ] 👤 User-facing prose passes voice review (no "god", no jargon dumps, IPK keywords used correctly).

**Rubric severity** *(when judgment is required):*

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Plan-doc completeness | All 7 sections present | 1 section missing or thin | 2+ sections missing |
| Three-pillar coverage | All 3 shipped or N/A justified | E+C shipped, UI debug-only with rationale | UI not addressed |
| Verification evidence | Raw output for all 3 gates | Counts claimed, no raw | Silent on verification |
| Codex review | Run, no CRITICAL pending | Run, CRITICAL deferred with rationale | Not run on multi-pillar feature |

---

### 7.2 Multi-phase content migration

**Plan-doc preconditions:**

- [ ] 🤖 Umbrella plan doc exists and lists the phase index, per-phase scope, and program-wide voice/coverage standards.
- [ ] 🧠 Umbrella plan declares per-phase coverage targets (e.g. `≥8 dual-axis`, `≥30% encounter seeds`, `≥6 hidden marks`).
- [ ] 🧠 Umbrella plan declares voice invariants (forbidden words, required IPK tags, forbidden tropes).

**Per-phase implementation AC:**

- [ ] 🤖 Phase plan/handoff lists per-template coverage (table: template → marks-count, seeds-count, branches, conditional outcomes).
- [ ] 🤖 `npm test` + `tsc` + `vite build` green with raw output.
- [ ] 🤖 Voice-bible grep returns 0 matches for forbidden words.
- [ ] 🤖 Coverage table (Min vs Achieved) shows Achieved ≥ Min for every metric.
- [ ] 🧠 Encounter-pipeline review (or template-encounter-rewrite review) passed at editorial + systems-audit + final-merge tiers.
- [ ] 🧠 Spot-check: 2 random templates manually read for prose quality bar (meeting encounter prose is the benchmark).
- [ ] 👤 User signoff on phase quality (or sample-tier review label `review:sample` applied for next retro).
- [ ] 🤖 Defer-outs filed as Linear issues with `Deferral` label and parent-project assignment.

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Coverage targets | All metrics Achieved ≥ Min | 1 metric below Min, rationale given | 2+ below Min |
| Voice compliance | Grep clean + 2-template manual read clean | Grep clean, manual read flags 1 issue | Grep dirty |
| Defer-out hygiene | All deferrals filed with parent project | Deferrals listed but not all filed | Deferrals only in commit message |

---

### 7.3 Engine plumbing / observability / refactor

**Plan-doc preconditions:**

- [ ] 🤖 Plan doc exists OR issue body declares "no plan doc, scope is single-file mechanical" with rationale.
- [ ] 🧠 Parity baseline declared (e.g. byte-identical CLI output, snapshot test, or "no behavior change observable in tests").
- [ ] 🧠 Drift test plan declared (a test that prevents the bug class this work fixes from recurring).

**Implementation AC:**

- [ ] 🤖 `npm test` + `tsc` + `vite build` green with raw output.
- [ ] 🤖 Parity baseline holds (e.g. CLI byte-identical, snapshot unchanged, or named pre/post comparison).
- [ ] 🤖 Drift test exists, fails on the regression case, passes on the fix.
- [ ] 🤖 Old code paths actually removed (grep confirms no orphan references).
- [ ] 🧠 No new magic numbers introduced; constants named.
- [ ] 🧠 Three-pillar marked Engine-only with explicit N/A rationale for Content and UI.
- [ ] 🧠 Codex review for multi-file refactors >100 lines.

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Parity | Baseline exists + holds | Baseline declared but only manual check | No parity baseline |
| Drift test | Present and named | Implied by existing test | Absent |
| Removal | grep clean | 1 dead reference left | Dead path still callable |

---

### 7.4 UI component / panel / token system

**Plan-doc preconditions:**

- [ ] 🤖 Plan doc references shared primitives, tokens, and (if redesign) a data-surface preservation list.
- [ ] 🧠 Viewport contract declared (1920×1080 default; explicit if other resolution).
- [ ] 🧠 Modal/overlay max-height declared (default 85vh) if applicable.
- [ ] 🧠 Accessibility checklist included: contrast, keyboard navigation, ARIA roles, touch-target size.

**Implementation AC:**

- [ ] 🤖 `npm test` + `tsc` + `vite build` green.
- [ ] 🤖 Token usage lint (no hardcoded sphere/type colors or font sizes outside the token tree).
- [ ] 🤖 Viewport scrollDelta = 0 at 1920×1080 (`browser_evaluate scrollHeight - clientHeight`).
- [ ] 🧠 **Visual proof attached to completion comment**: at least one screenshot at 1920×1080 of the changed surface (full panel, hover state, selected state if applicable).
- [ ] 🧠 Playtest-interface skill run if surface is in IA manifest; report attached or PASS verdict cited.
- [ ] 🧠 Accessibility audit: contrast WCAG 2.1 AA, keyboard nav reachable, focus visible.
- [ ] 🧠 Design-critique skill run for redesigns.
- [ ] 👤 User-facing tone/voice judgment for any prose strings introduced.

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Visual proof | Screenshot(s) at correct viewport attached | "Visually verified in browser" claim only | No visual evidence |
| Token discipline | All colors/type via tokens | 1–2 hardcoded values, justified | Hardcoded values without justification |
| Accessibility | Contrast + keyboard + ARIA all checked | 1 of 3 missing | Not addressed |
| Viewport | scrollDelta=0 measured | "Looks fine" claim | Scrolls at 1920×1080 |

---

### 7.5 Audit / triage

**Plan-doc preconditions:**

- [ ] 🤖 Issue body declares: scope of audit, output deliverable path, classification rubric, "no fixing in this issue" guardrail.
- [ ] 🧠 Rubric tiers defined upfront (e.g. PASS / FAIL / SKIP / SURPRISE; or GREEN / AMBER / RED).

**Implementation AC:**

- [ ] 🤖 Audit doc exists at declared path.
- [ ] 🤖 Doc has per-row Result + Evidence columns (verifiable per-row).
- [ ] 🤖 Doc has Summary table (counts per tier).
- [ ] 🧠 "Surprises / unexpected findings" section present (items not predicted by the rubric).
- [ ] 🤖 Defer-out Linear issues filed for FAIL / NEEDS-FIX rows; issue IDs linked from audit.
- [ ] 🧠 Honest UNABLE / SKIP markers for items not runnable in current sandbox or scope.
- [ ] 👤 User reviews and acknowledges before any execution of recommended actions (audits do not auto-act).

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Rubric application | Every row has Result + Evidence | Some rows missing Evidence column | No rubric |
| Spawned tickets | All FAIL rows have Linear issues | Mentioned but not all filed | Not filed |
| Surprises | Section present, items captured | Section present, empty | Section absent |

---

### 7.6 Process / coordination / governance improvement

**Plan-doc preconditions:**

- [ ] 🤖 Issue declares: file(s) being added/changed, expected behavior change, rollback plan.
- [ ] 🧠 If skill: skill name, audience (CC / Cowork / Codex / both trees), routing in CLAUDE.md / AGENTS.md.
- [ ] 🧠 If hook / scheduled task: trigger condition, frequency, fail-soft behavior, observability (where does the trace land?).
- [ ] 🧠 If governance edit: bright-line rule stated, contradicting passages (in CLAUDE.md, skills, plan docs) located and remediated in same change.

**Implementation AC:**

- [ ] 🤖 File(s) at expected paths.
- [ ] 🤖 `check:skill-sync` passes (if shared skill).
- [ ] 🤖 `check:process` passes (if process governance).
- [ ] 🤖 `npm test` + `tsc` + `vite build` green if any code touched.
- [ ] 🧠 **Self-applicability check**: skill loaded once in-session OR hook fired once in-session OR scheduled task triggered once and trace observed. *Paste the trace or describe the observed firing.*
- [ ] 🧠 If governance: Index/log/changelog updated; downstream skills / docs swept for contradictions.
- [ ] 👤 User signoff for doctrinal changes (not just process automation).

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Self-applicability | Fired once, trace pasted | Manual code review only, no firing | Shipped without firing |
| Doctrine sweep | Contradictions located + fixed | Located but deferred to next issue | Not searched |
| Skill-sync | check:skill-sync clean | Not run | Run and dirty |

---

### 7.7 Test-suite / sandbox / CI work

**Plan-doc preconditions:**

- [ ] 🤖 Triage report exists or referenced (e.g. `THR-281` for `THR-280`).
- [ ] 🧠 Per-bucket scope declared (which clusters of failures this issue addresses; explicit out-of-scope list).
- [ ] 🧠 Watch-period defined (e.g. "3 consecutive green runs over 3 days").

**Implementation AC:**

- [ ] 🤖 Per-day CI status table populated (date | run | pass count | fail count | skip count).
- [ ] 🤖 Watch-period satisfied (3-day green or whatever was declared).
- [ ] 🤖 Branch protection state declared (re-enabled, or blocked-on-X with `X` named and tracked).
- [ ] 🧠 Honest closeout: items not satisfied at close are explicitly marked ❌ in completion comment with follow-on issue.
- [ ] 🤖 No new `it.skip` introduced (or skips are listed and justified).

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Watch period | Full period satisfied | Partial green watch (1–2 days) | No watch |
| Closeout honesty | Unmet items marked ❌ with follow-on | Unmet items mentioned in prose | Closed implying full success |

---

### 7.8 Bug fix

**Plan-doc preconditions:**

- [ ] 🤖 Issue body declares: reproduction steps, expected vs observed, fix sketch.
- [ ] 🧠 If discovered by playtest / triage: link to the report row.

**Implementation AC:**

- [ ] 🤖 New test exists that fails on `main` and passes on the fix.
- [ ] 🤖 `npm test` + `tsc` + `vite build` green.
- [ ] 🧠 If fix came from a playtest finding: re-run the playtest path that originally exposed the bug; confirm fix.
- [ ] 🧠 No regression on adjacent surfaces (named scope of "adjacent" in the issue).

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Repro test | Targeted test added | Existing test happens to cover | No new test |
| Playtest re-run | Original path re-exercised | "Behavior should now be correct" claim | Not checked |

---

### 7.9 Marketing / public-facing copy

**Plan-doc preconditions:**

- [ ] 🤖 Plan doc lists voice rules, verbatim before/after diffs, asset risks, non-goals.
- [ ] 🧠 Tone target declared (e.g. "spark imagination through concrete scenes, not explain mechanics").

**Implementation AC:**

- [ ] 🤖 Voice-rule grep returns 0 violations.
- [ ] 🤖 Visual asset wiring verified (image paths resolve, page renders).
- [ ] 🤖 Vercel deploy preview green; render confirmed at 1920×1080 + mobile.
- [ ] 🧠 Codex (or copy-review skill) catches asset-path issues grep misses.
- [ ] 👤 User signoff on tone — explicit, not "Codex said yes".
- [ ] 🤖 Project-history entry + changelog row.

**Rubric:**

| Item | PASS | NEEDS-WORK | FAIL |
|---|---|---|---|
| Voice compliance | Grep + manual read clean | Grep clean, manual read flags vibe issue | Grep dirty |
| Visual review | Screenshot of live deploy + mobile | Live deploy URL only | Not checked |
| Tone signoff | User explicit "yes" | Codex review yes only | Neither |

---

### 7.10 Cross-category baseline (applies to all)

These items apply to **every** issue regardless of category.

- [ ] 🤖 Issue belongs to a Linear project (no orphan issues).
- [ ] 🤖 Coordination block in handoff: `Suggested model` (with matching `model:*` label), `Parallel-safe with`, `Mutex with`, `Codex review` lines.
- [ ] 🤖 Closing commit body contains `Fixes THR-XX` (or `Closes` / `Resolves`) — auto-close fires.
- [ ] 🤖 `Definition of Done` items (CLAUDE.md): docs updated, deferrals filed, impediments logged, wiring guide updated if applicable.
- [ ] 🤖 Verification evidence in completion comment: raw output for tests/tsc/build OR linked CI run with green status.
- [ ] 🧠 Three-pillar coverage stated explicitly (Engine / Content / UI delivered, or N/A with rationale).
- [ ] 🧠 Reopened issues: latest comment supersedes original handoff; full comment chain read.

**Quality-gate addendum protocol** (for narrative-heavy and player-experience-critical features):

- [ ] 🎭 If first design pass fails: Quality-Gate Addendum doc with 4 benchmark player scenes (concrete moments where player sees the system in action) + emotional architecture (what the player should feel at each beat) + systemic-vs-authored ratio.
- [ ] 🎭 Council (Cowork + 1 reviewer agent + user) re-reviews against benchmarks before sign-off.

---

## 8. Reviewer wiring — what the four review modes look like in practice

The 🤖 / 👤 / 🧠 / 🎭 tags above are answered by specific surfaces. Below is the proposed mapping. Existing surfaces are marked **EXISTS**; gaps are marked **PROPOSE**.

### 8.1 Automated (🤖) — CI, lint, hook, shell command

| AC item | Surface | Status |
|---|---|---|
| `npm test` / `tsc` / `vite build` green | GitHub Actions CI workflow | **EXISTS** (`.github/workflows/ci.yml`) — advisory until branch protection lands (`THR-282`) |
| Skill-sync | `npm run check:skill-sync` + pre-commit hook | **EXISTS** (`THR-192`) |
| Process lint | `npm run check:process` | **EXISTS** (`THR-240`) |
| Coverage targets / voice-rule grep | Per-phase verification commands in handoff | **EXISTS** (run manually) — **PROPOSE** wrap into `npm run check:phase-coverage` for content migrations |
| Constants table parity (no magic numbers) | grep for numeric literals outside constants files | **PROPOSE** — `npm run check:constants` |
| Token usage lint (no hardcoded sphere/type colors) | grep for `#[0-9a-f]{6}` outside token files | **PROPOSE** — `npm run check:tokens` |
| Viewport scrollDelta=0 | Playwright + `browser_evaluate` | **EXISTS** (used ad-hoc in `THR-174`) — **PROPOSE** as `npm run check:viewport` covering all manifest URLs |
| `Fixes THR-XX` keyword present | GitHub Action commit-body check | **EXISTS** (auto-close workflow) — fragility is upstream of acceptance |
| Drift scan | Weekly GitHub Action | **EXISTS** (`THR-273`) |
| IA manifest parity | `npm run check:ia` (audit script) | **EXISTS** (`THR-209`) |
| Coordination block presence | **PROPOSE** — `check:process` extension to lint handoff comments for required headers |

### 8.2 Single-agent review (🧠) — one reviewer pass

| AC item | Surface | Status |
|---|---|---|
| Plan-doc completeness (NFP / three-pillar / constants / fail-soft / traces) | `Plan doc audit` slash command | **PROPOSE** — invokable reviewer that scores a plan doc against the canonical shape and emits a structured rubric (PASS / NEEDS-WORK / FAIL per section) |
| Code review (correctness, security, performance) | `engineering:code-review` skill | **EXISTS** — should be required for multi-file refactors >100 lines |
| Encounter prose voice | `encounter-pipeline` skill (4-pass) | **EXISTS** — already required for branching encounters; **PROPOSE** require for content migrations Phase ≥2 |
| Visual / design critique | `design:design-critique` skill | **EXISTS** — should be required for UI-pillar issues |
| Accessibility audit | `design:accessibility-review` skill | **EXISTS** — should be required for UI-pillar issues |
| Live UI exercise | `playtest-interface` skill | **EXISTS** (`.agents/skills/playtest-interface/`) — **PROPOSE** require for IA-manifest surface changes |
| Three-pillar gap audit | **PROPOSE** — `three-pillar-audit` slash command that reads plan doc + code diff and reports if Engine/Content/UI explicitly addressed or N/A-with-rationale |
| Self-applicability check (process work) | **PROPOSE** — `self-applicability-check` reviewer that runs the new skill/hook/script in a sandbox session and reports the trace. Specifically tailored for category 7.6. |
| Codex pre-merge review | Codex review surface (read-only per Rule 8) | **EXISTS** but unstable; replacement at `.github/workflows/claude-review.yml` (advisory) — **PROPOSE** flip to blocking once branch protection lands |
| Marketing copy — voice | `design:ux-copy` skill | **EXISTS** — should be required for marketing-site work |

### 8.3 Multi-agent council (🎭) — multi-pass workflow

| AC item | Surface | Status |
|---|---|---|
| Quality-gate addendum for narrative-heavy features | **PROPOSE** — `quality-gate-council` slash command that runs three passes: (1) **player-scenarios pass** — produces 4 concrete player moments; (2) **emotional-architecture pass** — produces intended-feeling map; (3) **systemic-vs-authored pass** — produces ratio analysis. User signs off after the three reports converge. |
| Three-pillar pre-implementation audit | Already exists as a manual design-time check — **PROPOSE** as a council pass: pillar reviewers (engine + content + UI specialist agents) each emit "Y / N / N/A-with-rationale" and the council reconciles. Triggers automatically for full-stack-feature category. |
| Encounter authoring pipeline | `encounter-pipeline` skill | **EXISTS** — already a 4-pass council (draft → editorial → systems audit → final merge). |
| Attachment authoring pipeline | `attachment-pipeline` skill | **EXISTS** — same shape as encounter-pipeline. |

### 8.4 Human judgment (👤)

| AC item | Surface |
|---|---|
| Tone / vibe / "feels right" | User direct, no agent substitute |
| Strategic direction (does this serve the Vision?) | User; Cowork can surface trade-offs |
| Hard tradeoff resolution between NFPs | User; Cowork applies the "narrative tiebreaker" rule |
| Doctrinal changes (CLAUDE.md edits, governance) | User; agent can draft but cannot ratify |
| Marketing tone signoff | User direct |

---

## 9. Recommendations for retro consumption

Five concrete proposals. Each is a candidate Linear issue if the retro accepts it.

**R1. Codify the per-category templates from §7 in a new skill: `acceptance-criteria` (or fold into `pull-work`).** Skill loads on session start when an executor claims an issue; selects the template by category (auto-detect from labels + plan doc + body); pre-populates the AC checklist in the closing commit / completion comment. Removes "every issue invents its AC" pattern.

**R2. Make visual proof a hard requirement for UI-pillar work.** A 1920×1080 screenshot OR a `playtest-interface` PASS report goes in the completion comment, or the issue does not close. Codify in CLAUDE.md Definition of Done. This is the single largest gap in §1.

**R3. Document the quality-gate addendum protocol** (currently only exists as evidence in `THR-29`, `THR-30`, `THR-22`). Add to `game-design-direction` skill. Make it auto-trigger for Social Systems Expansion / Thematic Pressure / Onboarding categories.

**R4. Build the proposed reviewer surfaces in §8.2 / §8.3.** Priority order:
1. **`three-pillar-audit` slash command** — biggest leverage; closes G2 + part of G1.
2. **`self-applicability-check` reviewer** — closes G5; small implementation.
3. **`quality-gate-council` multi-agent pass** — closes G3; biggest scope but largest impact on narrative work.
4. **`plan-doc-audit` reviewer** — closes G1; useful at Implementation Planning gate.

**R5. Tighten verification evidence formatting.** Definition of Done already says "raw output OR linked CI run". Add: "*paste raw output for the test, tsc, and build commands, OR link to the green CI check for the merge SHA*. Claim-only test counts are not acceptable for any work that touches `src/`." Audit retroactively: was the issue closed with verification at the level its category requires?

**Out-of-scope for this audit but worth flagging:**

- **Reopen automation fragility.** `Fixes THR-XX` discipline + plan-doc-PR-title false-positives are real reopens. Different problem from acceptance criteria but worth its own retro item.
- **Behavioral AC items** ("next session drafts companion without reminder") should either be dropped from AC or converted to in-issue proxies. Currently they ship as theatrical AC items that nobody verifies.

---

## 10. Appendix — sampled issues by category

**Full-stack systemic feature (12):** THR-19, THR-22, THR-29, THR-30, THR-53, THR-152, THR-225, THR-15, THR-14, THR-27, THR-7, THR-117

**Multi-phase content migration (8):** THR-89, THR-99, THR-110, THR-111, THR-108, THR-118, THR-156, THR-129

**Engine plumbing / observability / refactor (6):** THR-238, THR-148, THR-79 (content-port adjacent), THR-110, THR-111, THR-108

*(Note: some issues fall in multiple categories — `THR-110` and `THR-111` are both "engine plumbing" and "multi-phase content migration" Phase 0 work; `THR-148` is a small-scope engine feature inside the Elder Magic full-stack program.)*

**UI component / panel / token system (9):** THR-168, THR-173, THR-174, THR-184, THR-8, THR-26, THR-47, THR-190, THR-10

**Audit / triage (4):** THR-129, THR-232, THR-279, THR-281

**Process / coordination / governance (8):** THR-181, THR-218, THR-243, THR-244, THR-247, THR-271, THR-273, THR-287

**Test-suite / sandbox / CI (4):** THR-160, THR-161, THR-280, THR-281

**Bug fix (3):** THR-17, THR-275, THR-118

**Marketing / public-facing copy (1):** THR-159

**Live exercise / playtest (1):** THR-211

---

*End of audit.*
