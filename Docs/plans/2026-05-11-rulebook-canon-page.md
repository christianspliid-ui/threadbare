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

Per-phase, since each phase has different surface area:

**Phase 1 (this ticket):**
- **Engine:** N/A. Documentation only. No runtime code, no orchestrator phases, no traces.
- **Content:** Primary pillar. The rulebook canon page and the quick-reference are both content; they synthesize and document the rules of play that other content (encounters, attachments, prose) must obey.
- **UI:** Deferred. Phase 4 (future project) renders the rulebook as an in-game Codex/Help surface. Phase 1 prose is written from the player's perspective so it can render in-app later without a rewrite.

**Phase 2 (drift detection, follow-up):**
- **Engine:** N/A.
- **Content:** N/A.
- **Infrastructure (the actual primary pillar — adjacent to but distinct from Engine):** extends the existing weekly drift scan in `.github/workflows/drift-scan.yml`; new lint script `scripts/lint-rulebook.ts`; emits Linear issues. No runtime engine code, but a CI script that reads engine constants.
- **UI:** N/A.

**Phase 3 (maintenance cadence, follow-up):**
- **Engine:** N/A.
- **Content:** Process documentation — `CLAUDE.md` § Design Governance edit, architecture-assessment template.
- **Infrastructure:** new `monthly-rulebook-review` scheduled task.
- **UI:** N/A.

Each follow-up ticket runs its own three-pillar pass at filing time.

## 5. Phase 1 — The canon page (and its always-loaded reference card)

**Two-file structure**, mirroring the board-game pattern of full rulebook + always-at-hand reference card:

| File | Length | Loaded |
|------|--------|--------|
| `Docs/canon/rulebook.md` | 400-600 lines | On rules-of-play work (encounter, action, prerequisite, resource, clock, win/loss) |
| `Docs/canon/rulebook-quick-reference.md` | 50-100 lines | Always — added to `CLAUDE.md` always-load list next to UL index |

The quick-reference exists because a 600-line rulebook is too heavy to auto-load on every session, but agents (and the user) need *some* synthesized rules-of-play context always within reach. The quick reference is the "reference card" — essentials only, one line per rule, pointer to the full rulebook for depth. The full rulebook is the manual.

### `Docs/canon/rulebook.md` — the full manual

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

**Open questions section at the end.** Anything that surfaces during drafting as a rule with no clear answer goes into a final `Open Questions` section. Each entry is referenced from the body via an inline `[OPEN]` flag. **Only `[OPEN]` questions that block Phase 1 completion get filed as separate user-verdict Linear issues.** Non-blocking questions stay inside the rulebook's Open Questions section and are surfaced to the user at the first quarterly architecture-assessment pass — this avoids issue-spam if the drafting pass surfaces 10+ questions.

### `Docs/canon/rulebook-quick-reference.md` — the always-loaded reference card

**Target length:** 50-100 lines. Loaded by `CLAUDE.md` always-load list, alongside the UL index.

**Frontmatter:**

```yaml
---
domain: rulebook
subtype: quick-reference
last_reviewed: 2026-05-11
reviewer: user
parent: Docs/canon/rulebook.md
status: live
---
```

**Section structure (~one paragraph each, ~5-10 lines total per section):**

1. **What you are.** One sentence. ("You are an Ascendant — a god making indirect interventions on mortals you find interesting. Not a protagonist.")
2. **The turn.** Three beats in two-three lines: scan → moment → aftermath.
3. **The five verbs.** One line each: Create, Find, Change, Destroy, Control. Plus the "you can't Update what you haven't Read" rule.
4. **Resources.** One line each: Influence Essence, Control slots, Influence Tiers, Stealth.
5. **Encounters and aftermath.** One paragraph: dilemma → sigmoid→d100 → cool failure.
6. **The clocks.** One paragraph: Doom vs. Mandate; Unmaking opens the next cycle.
7. **Win / loss.** Two lines. Both produce content for the next cycle.

**Footer pointer:**

```
For depth, definitions, status flags, and authority footers, read Docs/canon/rulebook.md.
For terminology authority, read Docs/ubiquitous-language/README.md.
```

No status flags inline in the quick reference — it states current rules only. The full rulebook carries the IMPL/DESIGN/OPEN tracking. The quick reference is regenerated from the full rulebook whenever rulebook ships a rule change (per-change trigger in Phase 3).

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

| Surface | Change | Phase |
|--------|-------|-------|
| `Docs/canon/rulebook.md` | Created — full manual. | 1 |
| `Docs/canon/rulebook-quick-reference.md` | Created — always-loaded reference card. | 1 |
| `Docs/canon/README.md` | Add both files to the canon page index table. | 1 |
| `CLAUDE.md` § Session Workflow | Add `rulebook-quick-reference.md` to the **always-load** list (alongside the UL index). Add `rulebook.md` to the **load-when** list, gated on "work touches rules of play (encounter, action, prerequisite, resource, clock, win/loss)" — NOT on all game design. | 1 |
| `.claude/skills/state-of-game-design/SKILL.md` | Add a header reference: agents loading this skill for rules-of-play work should also load `Docs/canon/rulebook.md`. State-of-game-design itself is not narrowed — it stays loaded for all game design work as today. | 1 |
| `CLAUDE.md` § Design Governance | Add "Rulebook impact?" checkbox. | 3 |
| `.github/workflows/drift-scan.yml` | Extend with four rulebook lint signals + new lint enforcing that quick-reference stays in sync with the full rulebook. | 2 |
| Scheduled tasks (`mcp__scheduled-tasks__create_scheduled_task`) | Add `monthly-rulebook-review`. | 3 |
| `Docs/audits/_rulebook-architecture-assessment-template.md` | New template file for quarterly assessment output. | 3 |

**Auto-load behaviour (the load-budget refinement).** The quick reference is always loaded because it is small (~50-100 lines) and contains essentials every agent needs. The full rulebook is loaded only when the work touches rules of play — encounter / action / prerequisite / resource / clock / win-or-loss. For all other game design work (worldbuilding, UI, hex-map work, prose authoring not touching rules), agents load state-of-game-design + the quick reference only. This mirrors how a tabletop game group keeps the reference card on the table and pulls out the manual only when a rule question arises.

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

- [ ] `Docs/canon/rulebook.md` written, 8 sections, status flags throughout, authority-boundary footers
- [ ] `Docs/canon/rulebook-quick-reference.md` written, 7 sections, no status flags, footer pointer to full rulebook
- [ ] `Docs/canon/README.md` updated with both index entries
- [ ] `.claude/skills/state-of-game-design/SKILL.md` references the rulebook as primary synthesis source
- [ ] `CLAUDE.md` § Session Workflow updated: quick-reference added to always-load; full rulebook added to load-when (rules-of-play work only)
- [ ] **Blocking `[OPEN]` questions only** (questions that prevent Phase 1 from being marked done) get filed as separate user-verdict Linear issues. Non-blocking open questions sit in the rulebook's Open Questions section for the first quarterly architecture-assessment pass to surface
- [ ] First architecture-assessment pass run at Phase 1 closeout; output written to `Docs/audits/2026-XX-XX-rulebook-architecture-assessment.md`

**Follow-up issues (filed 2026-05-11 as `Idea` state, `blockedBy THR-403`):**

- **THR-404** — Phase 2: extend drift scan with 5 rulebook lint signals (4 against authoritative sources + 1 quick-reference-vs-rulebook sync check). Labels: `Infrastructure`, `model:sonnet`.
- **THR-405** — Phase 3: `monthly-rulebook-review` scheduled task; `CLAUDE.md` § Design Governance "Rulebook impact?" checkbox; `Docs/audits/_rulebook-architecture-assessment-template.md`. Labels: `Infrastructure`, `model:sonnet`.

Both follow-ups inherit Content Architecture and unblock automatically when THR-403 closes.

**Adjacent issue resolved 2026-05-11:** **THR-406** — Vision/ files were located in the THR-308 Codex worktree (not in main vault) and promoted via Option A. All 5 Vision files (`README`, `00-north-star`, `01-core-loop`, `02-non-negotiables`, `03-design-tensions`) plus `Brainstorms/2026-04-20-vision-layer.md` are now in the canonical `TheFantasyWorldSimulator` Obsidian vault. The rulebook executor can reference `Vision/*` paths in `Why:` footers normally — no fallback required.

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

1. Read `Docs/canon/README.md`, `Docs/canon/cosmology.md` (canonical format + stale-source warning pattern), `Docs/canon/process.md` (footer format).
2. Read `state-of-game-design` SKILL end-to-end and `game-design-direction` SKILL § Vision/ section.
3. **Vision/ available:** the numbered Vision files (`Vision/00-north-star.md`, `01-core-loop.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `README.md`) are present in the canonical TheFantasyWorldSimulator vault as of 2026-05-11 (promoted from THR-308 worktree, see THR-406). Read them via Obsidian MCP. The Vision Layer brainstorm companion (`Brainstorms/2026-04-20-vision-layer.md`) is also available and worth reading for the *why* behind the Vision-layer structure itself.
4. Draft the full rulebook (`Docs/canon/rulebook.md`), section by section, with status flags (`[IMPL]`/`[DESIGN]`/`[OPEN]`) inline and authority-boundary footers per the template in § 5.
5. Draft the quick-reference (`Docs/canon/rulebook-quick-reference.md`) by reducing each rulebook section to the single-line essentials per the template in § 5.
6. Before each section's footer, verify the UL shards, canon page, and Vision (or plan-doc fallback) paths exist; if a referenced canon page doesn't exist, mark the rule `[OPEN]`.
7. **OPEN-question discipline:** only `[OPEN]` questions that prevent Phase 1 from being marked done get filed as separate Linear issues. The rest stay in the rulebook's Open Questions section for the first quarterly architecture-assessment to surface.
8. Update wiring per § 9: `Docs/canon/README.md`, `state-of-game-design` SKILL, `CLAUDE.md` § Session Workflow (always-load + load-when split).
9. At end of draft, run the first architecture-assessment pass (answer the three questions from § 7 Phase 3) and write the audit doc.
10. **Phase 2 and Phase 3 follow-up Linear issues are already filed** as THR-404 (Phase 2) and THR-405 (Phase 3), both `Idea` blocked by THR-403. Do not re-create. Update their state to `Ready for Dev` only after Phase 1 closes — they unblock automatically. THR-406 tracks the adjacent Vision/ files issue.
11. Pre-commit verification per CLAUDE.md § Pre-commit minimum (Steps 1, 2, 3 — `npm test`, `npx tsc --noEmit`, `npx vite build`). Step 6 (engine smoke) not required — no engine changes.
12. Commit with `Fixes THR-403` and let the merge-to-main auto-close fire.

## 14. Brainstorm companion

Drafted alongside this plan at `TheFantasyWorldSimulator/Brainstorms/2026-05-11-rulebook-canon-page.md` (Obsidian — written 2026-05-11 via Obsidian MCP). The companion records: the gap diagnosis ("synthesis layer missing, not a missing skill"); the three options (strengthen state-of-game-design / new canon page / new skill) and the Option B verdict; the synthesis-only authority boundary; the scope expansion to include drift detection + maintenance + assessment cadence; the `[IMPL]/[DESIGN]/[OPEN]` flag idea that emerged from "we don't have a fully functioning game yet"; the quick-reference card pattern from the user's board-game analogy on review; and the Vision/ drift surfaced during planning.
