---
status: proposal
domain: documentation-architecture
created: 2026-05-11
author: cowork
linear: THR-403 (Content Architecture project)
related_canon: Docs/canon/README.md, Docs/canon/cosmology.md, Docs/canon/process.md
related_ul: Docs/ubiquitous-language/README.md
related_skills: state-of-game-design, game-design-direction, retrospective
---

# Rulebook Canon Page — Synthesis Layer for Threadbearer Rules of Play

> A new canon page (`Docs/canon/rulebook.md`) that synthesizes the rules of play from the player's perspective, plus the maintenance instruments around it: drift detection in the weekly scan, monthly review cadence, and a quarterly architecture-assessment pass. The rulebook owns synthesis only. UL owns terms. Per-domain canon pages own current spec. Vision owns why.

## 1. Problem

The "rules of play" — what the player does on a turn, what their resources are, how encounters work, how clocks pressure each other, how winning and losing produce content for the next cycle — are not synthesized anywhere. They are distributed across:

- `state-of-game-design` (mechanical foundation, system-by-system)
- `game-design-direction` + `Vision/` (experience direction, in Obsidian)
- `Docs/canon/*.md` (per-domain current-spec pointers)
- `Docs/ubiquitous-language/` (term definitions)
- `Docs/plans/` (rationale history)

To answer "what does the game do to the player on a turn?" an agent (or the user) has to reassemble from five sources. This produces three failure modes:

1. **Assembly errors.** Every agent reassembles the rules independently. Silent drift between agents and between agents and code is the default. The Cosmology canon page's `STALE-SOURCE WARNING` listing 7 stale surfaces is the precedent.
2. **Architecture invisibility.** With no synthesized view, it is hard to ask "do these rules combine into a coherent game?" The rules look fine subsystem-by-subsystem and incoherent only when stitched together.
3. **Maintenance gap.** As the game evolves, no surface forces the question "did this change affect rules of play, and does the player-facing rule still hold?" Drift accumulates.

The game is not fully functioning yet — which makes (2) and (3) more acute, not less. We need a way to see the rules-as-architecture as the architecture evolves.

## 2. Goals and non-goals

**Goals.**

1. Single synthesis surface for "what the game does to the player and what the player does back."
2. Status flag per rule (`[IMPL]` / `[DESIGN]` / `[OPEN]`) so the gap between implemented and intended is structurally visible.
3. Automated drift detection between the rulebook and its authoritative sources (UL, canon pages, code, Vision).
4. Cadence for architecture assessment as the game evolves — per-change trigger plus monthly review plus quarterly written audit.
5. Authority boundary made structural in the page itself: every section ends with "Owns: synthesis only. Definitions: UL. Spec: canon/&lt;domain&gt;.md. Why: Vision/&lt;file&gt;.md."

**Non-goals.**

1. Replacing UL, canon pages, Vision, or state-of-game-design. Each retains its existing role.
2. Player-facing in-game rulebook surface. Deferred to a future project; the canon page's prose is designed so it *could* render in-app later, but no UI work in this scope.
3. A new `rulebook-keeper` skill. Deferred until Phases 1-3 have run for a quarter and we have evidence about what workflow wrapping (if any) is needed.

## 3. Authority boundary (the load-bearing decision)

The rulebook owns **synthesis only** — how the systems combine into a game. It owns:

- The integration narrative (what a turn looks like end-to-end)
- The cross-system rules (how resources flow into actions flow into encounters flow into aftermath)
- The implementation-vs-design status of each rule

The rulebook does NOT own:

- **Term definitions.** UL wins. If the rulebook needs to define a term, that term goes into UL first; the rulebook references it.
- **Per-domain current spec.** The relevant canon page wins (e.g. `canon/cosmology.md` owns the Reaches table; the rulebook references it).
- **Rationale / why.** Vision and plan docs win.

Every section of the rulebook ends with an explicit footer:

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/<Shard>.md
Spec: Docs/canon/<domain>.md
Why: TheFantasyWorldSimulator/Vision/<file>.md
```

This makes the boundary structural, not aspirational. The drift checks in Phase 2 enforce it.

## 4. Three-pillar coverage

- **Engine:** N/A. This is a documentation architecture change. No runtime code touched in Phase 1. Phase 2 touches the existing drift scan workflow (build infrastructure), not engine code.
- **Content:** This IS the content change. The canon page is content; it documents and synthesizes the rules of play that other content (encounters, attachments, prose) must obey.
- **UI:** Deferred. Phase 4 (future project) would render the rulebook as an in-game Codex/Help surface. The canon page's prose is written from the player's perspective specifically so it can render in-app later without a rewrite.

## 5. Phase 1 — The canon page

**Path:** `Docs/canon/rulebook.md`.
**Target length:** 400-600 lines (longer than other canon pages because synthesis is its job).

**Frontmatter:**

```yaml
---
domain: rulebook
last_reviewed: 2026-05-11
reviewer: user
ul_shards: [Cosmology, Agents, Encounters, Prose, Graph]
status: live
---
```

**Status flags.** Every rule statement carries one of three flags inline:

- `[IMPL]` — implemented in current code; behaviour matches description
- `[DESIGN]` — designed in a plan doc; not yet implemented, or partially implemented
- `[OPEN]` — open question; the rule is not yet decided

The flag is mechanical, not aspirational. The drift check in Phase 2 (`lint-rulebook-vs-code`) enforces that `[IMPL]` claims match the named code constant or function. `[DESIGN]` and `[OPEN]` are user-verdicted.

**Section structure** (verdicted in conversation 2026-05-11):

1. **What You Are.** The Ascendant — a former mortal who transcended. You are a god making indirect interventions on mortals you find interesting. You are not a protagonist; you do not choose mortal character actions.
2. **What the World Is.** Hex map. Factions. Cultures. Agents who pursue their own goals. The Doom Clock ticking toward the Unmaking. The World-Soul carrying echoes from prior cycles.
3. **The Three-Beat Turn.** Portfolio scan → curated moment → aftermath. What each beat does, where the player's attention sits, how time advances. Turn-based: each tick is a turn the player controls.
4. **What You Can Do.** The five verbs (Create / Find / Change / Destroy / Control) as player actions. The ActionDrawer flow. Prerequisites (Reach tier + Sphere alignment, both optional per template). Generalized Action Targeting in one paragraph.
5. **Your Resources.** Influence Essence (sphere-typed). Control slots (limited, scaling with Domain Capability tier). Influence Tiers (Unaware → Curious → Recognized → Devoted → Enthralled → Aspect). Stealth's two-audience detection (mortals + rival gods). How they feed each other.
6. **Encounters and Aftermath.** What an encounter is from the player's seat (a curated moment with a real dilemma, not a flat success/fail roll). How resolution works (sigmoid → d100). What aftermath does (reshapes the protagonist's trajectory). The "cool failure" rule (failure is plot, not punishment).
7. **The Clocks.** Doom Clock (7 archetypes, 5 stages). Victory Mandate (3 stages). How they pressure each other. The Twilight Phase. The Unmaking. The World-Soul update.
8. **Winning and Losing.** Mandate completion vs. Doom expiration. Why both produce content for the next cycle. The metaprogression promise (legacy / monument / relic echoes inject thematic content into the next cycle).

**Per-section format:**

```markdown
## 3. The Three-Beat Turn

[Rulebook prose written from the player's perspective. 100-200 words per section.
Rules stated with status flags inline.]

Example rule: The world advances exactly one tick per player turn [IMPL].
Each turn the player can perform any number of Find actions but must commit
essence to Change and Control actions [DESIGN — Control sustain model in
`Docs/plans/2026-03-17-world-state-and-hex-actions-design.md` Phase 2].

---
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Encounters.md, Docs/ubiquitous-language/Cosmology.md
Spec: Docs/canon/encounters.md
Why: TheFantasyWorldSimulator/Vision/01-core-loop.md
```

**Open questions section at the end.** Anything that surfaces during drafting as a rule with no clear answer goes into a final `Open Questions` section. Each entry becomes a `[OPEN]` reference somewhere in the body and a user-verdict request.

## 6. Phase 2 — Drift detection

Extend the existing weekly drift scan with four rulebook-specific lint signals. Each emits a `drift-scan`-labeled Linear issue in the Continuous Improvement project (matching the existing weekly drift-scan pattern).

**`lint-rulebook-vs-ul`.** Every term used in the rulebook that appears in a UL shard must use the UL's canonical spelling and definition. If the rulebook uses a term not in UL, that is a `UL-proposal` candidate (auto-open issue with label, do not auto-merge).

**`lint-rulebook-vs-canon`.** Every `Spec: Docs/canon/<file>.md` footer pointer must resolve. Every per-domain rule statement in the rulebook should reference a canon page that exists.

**`lint-rulebook-vs-code`.** Every rule statement flagged `[IMPL]` that cites a named code constant or function must match the actual code value. Example: if the rulebook says "divineInfluence decays 0.02/tick [IMPL — DIVINE_INFLUENCE_DECAY in src/engine/...]" the lint reads the constant and verifies the rulebook number matches. The reference is structured: `[IMPL — <CONSTANT_NAME> in <path>]` is parseable.

**`lint-rulebook-vs-vision`.** Every `Why: Vision/<file>.md` pointer must resolve (the Vision file exists in the Obsidian vault).

**Implementation.** New script `scripts/lint-rulebook.ts` or extension to existing drift-scan script in `.github/workflows/drift-scan.yml`. Output is the same per-signal Linear issue format the weekly drift scan already produces. The weekly retrospective reads these as input alongside the existing signals.

## 7. Phase 3 — Maintenance and architecture review cadence

Three triggers, increasing in scope.

**Per-change trigger (every plan touching rules of play).** Add a checkbox to the Design Governance workflow in `CLAUDE.md`:

```
- [ ] **Rulebook impact?** — does this plan change a rule of play
      (turn structure, action verb, prerequisite, resource, encounter,
      clock, win/loss)? If yes, the rulebook update is part of this
      ticket's scope, not a follow-up. Update `Docs/canon/rulebook.md`
      in the same PR and re-verdict the affected section.
```

This shifts maintenance left. The current Cosmology drift exists because nothing forced the rulebook-style update when TB-075 Phase 1 shipped.

**Monthly review (scheduled task).** A new `monthly-rulebook-review` scheduled task that runs on the 1st of each month:

- Loads `Docs/canon/rulebook.md`.
- Runs all four Phase 2 lint signals on-demand and includes any new drift in the review.
- Checks every `last_reviewed` date on the rulebook itself and on per-section footers.
- Surfaces any `[OPEN]` questions that have been open >60 days.
- Posts a Linear issue tagged `rulebook-review` with the findings.

The user verdicts the review by closing the issue or by spawning sub-issues for the surfaced drift.

**Quarterly architecture-assessment pass (Cowork session, on-demand).** Output: `Docs/audits/YYYY-MM-DD-rulebook-architecture-assessment.md`. The assessment answers three questions in writing:

1. **Synthesis check.** Do the rules combine into a coherent game? Are there sections that read fine in isolation but contradict each other when stitched? Are there gaps where the rulebook says "and then..." with no rule for what comes next?
2. **Implementation gap analysis.** Where is the gap between `[IMPL]` and `[DESIGN]` largest? What does that gap imply for prioritization? Which `[DESIGN]` rules have been designed for the longest without implementation?
3. **Open question blockers.** Which `[OPEN]` questions are blocking the next phase of work? Which can be closed with a user verdict in the assessment session itself?

The first assessment runs at Phase 1 closeout (since the act of writing the rulebook surfaces all three signals naturally). Subsequent assessments quarterly or on-demand when the user senses architectural drift.

## 8. Phase 4 — Deferred to future project

Two follow-ups not in scope for this plan:

- **`rulebook-keeper` skill.** Wraps the Phase 3 workflows. Defer until Phases 1-3 have run for a quarter — at that point we know whether the workflow is mechanical enough to deserve a skill wrapper or whether the canon page + drift scan + cadence is sufficient on its own.
- **In-game player-facing rulebook surface.** Codex/Help/Onboarding UI that renders the rulebook for the player. Defer until the game has a Codex view design and the rulebook prose has stabilized.

## 9. Wiring

| Surface | Change |
|--------|-------|
| `Docs/canon/rulebook.md` | Created (Phase 1). |
| `Docs/canon/README.md` | Add `rulebook` to the canon page index table. |
| `.claude/skills/state-of-game-design/SKILL.md` | Add a header reference pointing at the rulebook as the primary synthesis surface; agents should load rulebook alongside this skill for any rules-of-play work. |
| `CLAUDE.md` § Design Governance | Add "Rulebook impact?" checkbox. |
| `CLAUDE.md` § Session Workflow | Add the rulebook to the "for design work" load order: state-of-game-design → rulebook → game-design-direction → relevant canon page. |
| `.github/workflows/drift-scan.yml` | Extend with four rulebook lint signals (Phase 2). |
| Scheduled tasks (`mcp__scheduled-tasks__create_scheduled_task`) | Add `monthly-rulebook-review` (Phase 3). |
| `Docs/audits/_rulebook-architecture-assessment-template.md` | New template file for quarterly assessment output. |

No engine modules, no tick phases, no traces — this is documentation architecture.

## 10. NFP audit

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | The rulebook documents constants by reference to code (`[IMPL — CONST_NAME in path]`), never hardcodes values. Changing a tuning number doesn't require rulebook edit; the drift check (Phase 2) catches any silent divergence. |
| 2. Inspectability | PASS | Every rule cites its current-spec source. Reader can trace any claim to UL (terms), canon (spec), Vision (why), or code (constants). |
| 3. Determinism | N/A | No runtime code. |
| 4. Fail-soft | N/A | No runtime code. The drift scan signals are advisory; they emit Linear issues, they don't break builds. |
| 5. Narrative over mechanical perfection | PASS | The rulebook is written from the player's experience first, mechanical accuracy second. Status flags exist precisely so the prose can stay narrative while the mechanical accuracy is enforced separately. |
| 6. Additive over destructive | PASS | New file. No existing surface deleted or rewritten. State-of-game-design, Vision, UL, and the existing canon pages retain their full current scope. |
| 7. Performance budget | N/A | Documentation, not runtime. The drift scan runs weekly and is bounded by repository scan time (negligible). |

## 11. Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| Rulebook drifts faster than the weekly drift scan catches | Per-change trigger in Design Governance (Phase 3, lifted left); weekly drift scan is a backstop, not the primary defence. |
| Status flags (`[IMPL]`/`[DESIGN]`/`[OPEN]`) themselves drift | `lint-rulebook-vs-code` catches `[IMPL]` claims that don't match code constants. `[DESIGN]`/`[OPEN]` are user-verdicted and reviewed monthly. |
| 600-line page is too heavy for agents to load on every design task | Load only when state-of-game-design loads (which already gates on "any game design work"). Net cost is small because the rulebook replaces 3-4 scattered loads that agents already do today. |
| The synthesis itself is wrong (rules combine in a way that isn't a coherent game) | This is the architecture-assessment material — exactly the failure mode Phase 3's quarterly assessment is designed to surface. The risk is the *value* of the document, not a risk against it. |
| `[OPEN]` questions accumulate and never get verdicted | Monthly review surfaces any `[OPEN]` >60 days as a Linear issue. User verdicts in the review session or escalates. |

## 12. Definition of done

**Phase 1 (this ticket):**

- [ ] `Docs/canon/rulebook.md` written, 8 sections, status flags throughout
- [ ] `Docs/canon/README.md` updated with index entry and reviewed page count
- [ ] `.claude/skills/state-of-game-design/SKILL.md` references the rulebook as primary synthesis source
- [ ] `CLAUDE.md` § Session Workflow updated to include the rulebook in load order
- [ ] All `[OPEN]` questions surfaced during drafting collected in the rulebook's Open Questions section AND filed as separate user-verdict Linear issues
- [ ] First architecture-assessment pass run at Phase 1 closeout; output written to `Docs/audits/2026-XX-XX-rulebook-architecture-assessment.md`

**Phases 2 and 3 (split to follow-up Linear issues at Phase 1 closeout):**

- Phase 2 issue (`Infrastructure`, `model:sonnet`): extend drift scan with 4 rulebook lint signals; CLAUDE.md § Design Governance updated with "Rulebook impact?" checkbox
- Phase 3 issue (`Infrastructure`, `model:sonnet`): `monthly-rulebook-review` scheduled task created; `Docs/audits/_rulebook-architecture-assessment-template.md` written

Both follow-ups inherit this project (Content Architecture) and link back to the Phase 1 issue.

## 13. Executor handoff

**Phase 1 only — Phases 2 and 3 file as follow-ups at Phase 1 closeout.**

- **Suggested model:** model:opus-4-6 — this is creative writing work. The rulebook is prose from the player's perspective, and the eight sections need to be coherent, sourced, and synthesizing across systems. Opus 4.6 (per project memory: creative writing uses Opus 4.6, not 4.7).
- **Parallel-safe with:** any plan that does not touch `Docs/canon/`, `.claude/skills/state-of-game-design/SKILL.md`, or `CLAUDE.md` § Session Workflow / § Design Governance.
- **Mutex with:** any concurrent edit to `Docs/canon/README.md`, `state-of-game-design` SKILL, or `CLAUDE.md`.
- **Codex review:** not required for the canon page itself (prose work). The Phase 2 follow-up (drift scan extension) should request Codex review when filed.

**Files to touch (Phase 1):**

- Create: `Docs/canon/rulebook.md`
- Edit: `Docs/canon/README.md`, `.claude/skills/state-of-game-design/SKILL.md`, `CLAUDE.md`
- Create (at closeout): `Docs/audits/2026-XX-XX-rulebook-architecture-assessment.md`
- Create (follow-up Linear issues): Phase 2 and Phase 3 tickets

**Action items for the executor:**

1. Read `Docs/canon/README.md`, `Docs/canon/cosmology.md` (for the canonical canon-page format and the stale-source warning pattern), `Docs/canon/process.md` (for footer format).
2. Read `state-of-game-design` SKILL end-to-end and `game-design-direction` SKILL § Vision/ section.
3. Read the Vision files via Obsidian MCP: `Vision/00-north-star.md`, `Vision/01-core-loop.md`, `Vision/02-non-negotiables.md`.
4. Draft the rulebook, section by section, with status flags inline.
5. Before each section's footer, verify the UL shards, canon page, and Vision file paths exist; if a referenced canon page doesn't exist, mark the rule `[OPEN]` and flag in the Open Questions section.
6. At end of draft, run the first architecture-assessment pass (answer the three questions from Phase 3) and write the audit doc.
7. File Phase 2 and Phase 3 Linear issues with the executor handoff blocks per the templates in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.
8. Commit with `Fixes THR-403` and let the merge-to-main auto-close fire.

## 14. Brainstorm companion

To be drafted alongside this plan at `TheFantasyWorldSimulator/Brainstorms/2026-05-11-rulebook-canon-page.md` (Obsidian). The companion records the conversation that produced this plan: the user's verdict on Option B over Options A and C, the synthesis-only authority boundary, the expansion to include drift detection + maintenance + assessment cadence, and the `[IMPL]/[DESIGN]/[OPEN]` status flag idea that emerged from the user's note that "we don't have a fully functioning game yet."
