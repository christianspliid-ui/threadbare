---
plan: THR-414
type: verdict-prep
authored: 2026-06-12
author: Cowork (keep-work-flowing)
related: THR-403, THR-404, THR-405, THR-402, THR-400
status: ready-for-verdict-session
---

# THR-414 Rulebook Phase 1 — Verdict Prep

Pre-loaded context for the dialogue session described in THR-414. For each of the six open questions and the manual↔card cosmology drift, this doc supplies: **current code/design state with evidence**, **resolution options A/B/C**, **Cowork's recommended verdict + rationale**, and **impact if deferred**. Goal: turn the verdict session into ~30 minutes of decisions rather than ~3 hours of re-discovery.

Process from the issue: **Resolve** (decision recorded, rulebook flag upgraded), **Defer** (decision deferred to next quarterly assessment with `last_considered: 2026-06-12`), or **Spawn implementation ticket**.

---

## Q1. Influence Tier — six-name ladder vs. five-integer code

**This is the highest-leverage verdict in the batch.** The architecture assessment missed a third divergence inside this question; new evidence below.

### Current state (evidence)

- **Code, type:** `InfluenceTier = 0 | 1 | 2 | 3 | 4` — five integer tiers (`src/types/influence.ts:35`).
- **Code, names:** `TIER_NAMES` constant in `src/data/influence-content.ts:34-40` already supplies five display names — `0: Unaware, 1: Touched, 2: Devoted, 3: Champion, 4: Aspect`.
- **Design (`state-of-game-design` SKILL Part 2):** six-name ladder — `Unaware → Curious → Recognized → Devoted → Enthralled → Aspect`.
- **The actual divergence is three-way**, not two-way:
  - Code TIER_NAMES uses `Touched`, `Champion` — names that appear in **neither** design nor rulebook.
  - Code has five tiers; design has six names.
  - Two design names (`Curious`, `Recognized`, `Enthralled`) appear nowhere in code; two code names (`Touched`, `Champion`) appear nowhere in design.

This is real. The architecture assessment treated this as a 5-vs-6 cardinality question; in fact code's names already drift from the design vocabulary independently of the tier count.

### Options

- **(A) Promote design ladder; expand to 6 tiers.** Change `InfluenceTier = 0|1|2|3|4|5`; rewrite TIER_NAMES to the six-name ladder; add a sixth promotion threshold + maintenance row in `influence-content.ts`. Touches `TIER_NAMES`, `TIER_MAINTENANCE`, `TIER_PROMOTION_THRESHOLDS`, every consumer of those (`src/components/CMS/registry.ts:896`, codex registry, every UI label, every test that asserts a tier-name). Wide blast radius; semantically clean.
- **(B) Promote code ladder; rewrite design to five names.** Drop `Curious / Recognized / Enthralled` from the SKILL Part 2 narrative ladder; canonise `Unaware / Touched / Devoted / Champion / Aspect`. Update `state-of-game-design` and rulebook §5. Zero code change.
- **(C) Hybrid — keep five tiers, rename to design's first five.** Rewrite TIER_NAMES to `Unaware, Curious, Recognized, Devoted, Enthralled`. `Aspect` becomes a separate **ascendant attainment** (edge type or boolean flag), not a tier. Five tiers preserved; the sixth design step becomes a different kind of relationship.

### Cowork's recommended verdict — **(C) Hybrid**

`Aspect` reads narratively as a *transformation* (the mortal becomes part of you), not as a *deeper investment level*. Modeling it as a separate edge type (`mortal -[became_aspect]-> ascendant`) is structurally cleaner than a sixth tier and explains why the design ladder felt six-wide while everything else in code stayed five. Also smallest blast radius among the three: rename five strings in TIER_NAMES + a small migration where `Aspect` consumers move to checking the new edge.

### Impact if deferred

UI prose and the codex panel currently render `Touched` and `Champion` — names the design vocabulary does not contain. Every time the player sees a thread, they see a word the rulebook does not use. Cosmetic until tutorial work begins; blocking the day the first onboarding pass lands.

### Spawn?

Yes, on Resolve under any option. Suggested spawn: **"Influence Tier alignment — code↔design vocabulary"** in Continuous Improvement, model:sonnet, 3-5 points.

---

## Q2. Five verbs vs. CRUD-ish surface

### Current state (evidence)

- **Rulebook §4 / quick-ref:** five verbs — `Create, Find, Change, Destroy, Control`.
- **Code:** `StrategicVerb = 'gather_info' | 'create' | 'change' | 'control' | 'destroy'` (`src/types/strategicAction.ts:12-17`). Five verbs, but **`Find` is `gather_info`** — a vocabulary divergence the assessment missed.
- **Player-facing surface:** `ActionDrawer.tsx` (`src/components/Game/ActionDrawer.tsx`) does not expose verb as a filter or label. The player sees template names, not verb categories.

### Options

- **(A) Surface five verbs as ActionDrawer filter chips.** Five chips, each filters templates by `StrategicVerb`. Teaches the taxonomy explicitly. Rename `gather_info → find` in code as part of this.
- **(B) Keep verbs as implicit substrate.** No UI surface. Templates remain self-describing. Still rename `gather_info → find` to match the rulebook vocabulary so prose and code agree.
- **(C) Status quo.** Don't surface, don't rename. Accept ongoing vocabulary drift; verdict re-deferred next quarter.

### Cowork's recommended verdict — **(B) Implicit substrate + vocabulary fix**

Filter chips read mechanically — exactly the "real-time action game with god-mode HUD" failure mode the assessment flagged. The five-verb taxonomy is more useful as a **design rule for template authors** (every template must justify which of the five it is) than as a player-facing taxonomy. The `gather_info → find` rename is cheap and removes the rulebook drift independently. Reconsider (A) if Attention Tier Model surfaces an organic need for verb filtering.

### Impact if deferred

Templates can be authored against the wrong verb forever without the player noticing; prose and code keep diverging on `Find` / `gather_info`. Low immediate cost, higher refactor cost the longer it sits.

### Spawn?

Yes if Verdict (B): **"Rename `gather_info → find` across `StrategicVerb`, templates, traces, content"** — Codex-friendly mechanical refactor, model:haiku, ~3 points. No spawn if (A) or (C).

---

## Q3. Find gates Change/Control — hard or soft?

### Current state (evidence)

- **Rulebook §4:** *"You can't Update what you haven't Read"* presented as foundational.
- **Code:** gating is per-template via `prerequisites` field (Domain Capability + Sphere). No engine-level invariant refuses a Change/Control action against an unread target. Authors can omit the prerequisite and the engine will fire the action.
- **Cross-link:** the Three-Pillar Rule design discipline does call out prerequisites but does not enforce the Find-gate transitively.

### Options

- **(A) Harden — runtime invariant.** Add a tick-time refusal: `StrategicVerb in {'change', 'control'}` against a target the actor has not gathered info on within N ticks returns `not_eligible: needs_find_first` and fails soft. Touches resolution pipeline.
- **(B) Soft — author discipline + lint.** Keep per-template; add a content-lint that flags any Change/Control template missing a Find-style prerequisite, fail CI on drift. Touches lint + every existing template that's currently non-compliant (audit first).
- **(C) Status quo.** Re-defer to next quarter; rely on review discipline only.

### Cowork's recommended verdict — **(B) Soft + lint**

(A) introduces an engine-level rule that has to know about every actor's prior-knowledge-of-target state across all kinds of targets (mortal / location / faction / artifact). That state model doesn't exist consistently yet. (B) gets the rulebook's design promise honoured at author-time, lets templates that have a legitimate "skip Find" reason opt out with a comment-justification, and ships in days rather than a quarter. Promote to (A) when actor-knowledge state lands as a real system.

### Impact if deferred

Authors keep relying on memory; the next prose-content-systems pass risks shipping a `change.faction.reform` (or similar) without a `find` prerequisite, and the rulebook's foundational rule quietly becomes a lie.

### Spawn?

Yes on (B): **"Find-gate lint — fail-CI for missing find prerequisites on change/control templates"** model:sonnet, 3 points, after an audit pass of current templates.

---

## Q4. Session length

### Current state (evidence)

- **Vision §`01-core-loop`:** "three to six encounters per session" tracked as a *suspicion*, not a tuned number.
- **Rulebook §3:** repeats the suspicion verbatim ("three to six per session, not three to six per tick") with a `[DESIGN]` flag pointing at `Docs/plans/2026-05-04-encounter-experience-design-plan.md`.
- **Code:** no stopping-point signal, no encounter-per-session accounting, no "you've played a session" UX. Tick count is open-ended.

### Options

- **(A) Tune now — pick a number, instrument it.** Pick 4 (centre of 3–6). Add an `encountersSinceSessionStart` counter; surface a "good stopping point" toast / dim signal at 3 / 4 / 5 encounters. Doesn't force a stop; nudges.
- **(B) Defer — wait for playtest signal.** Resolves naturally when real player sessions exist. Audit notes this as the right answer.
- **(C) Reframe — session is a Twilight beat, not a meta-construct.** A "session" is whatever the player decided was one; the Twilight Phase is the *run's* ending, not a session's. Remove the number from Vision/01.

### Cowork's recommended verdict — **(B) Defer**

Architecture assessment §3 already flagged this. The number has no design weight that pressures any other system; it's a suspicion held lightly. The only useful verdict here is **"defer with rationale recorded"** and a date-stamp to revisit. (C) is a tempting reframe but would cost a Vision/01 edit for a question we're not pressed to answer.

### Impact if deferred

Zero immediate; the suspicion stays alive.

### Spawn?

No.

---

## Q5. Doom + Mandate dual-clock interplay

### Current state (evidence)

- **Code primitives exist:**
  - `decelerateDoomClock(state, amount)` — `src/engine/doomClock.ts:718`
  - `accelerateDoomClock(state, amount)` — `src/engine/doomClock.ts:711`
  - `mandateState.progress` accessed in `src/engine/orchestrator.ts:2544`
- **What's missing:** the wiring between mandate progress and doom deceleration is a one-way read (orchestrator reads `mandateProgress`, does not call `decelerateDoomClock` from it). No exchange-rate formula exists.
- **Rulebook §7:** "Pushing the Mandate harder consumes essence that could have decelerated Doom." This describes a *trade-off through essence economics*, not necessarily a direct exchange rate. The current system implements the essence-budget half implicitly (essence spent on mandate progress is essence not spent on doom-deflection actions) but does not implement explicit mandate→doom coupling.

### Options

- **(A) Direct formula.** e.g. each `+0.1` mandate progress calls `decelerateDoomClock(state, 0.05)`. Tunable constant. Tightens the dual-clock pressure as a hard arithmetic relationship.
- **(B) Indirect via essence — already implemented.** Recognise that the trade-off the rulebook describes (essence allocation) is *already in the engine*; the rulebook sentence describes the emergent property, not an additional formula. Mark `[IMPL]` and remove the `[OPEN]` flag.
- **(C) One-shot deflection.** Specific actions (e.g. `divine.intervene.delay_doom`) explicitly decelerate Doom on use. Scattered, narrative-flavoured, no general formula.

### Cowork's recommended verdict — **(B) Already implemented via essence economics**

This is the verdict the assessment hinted at but did not state. The rulebook sentence "Pushing the Mandate harder consumes essence that could have decelerated Doom" is a *description of the existing essence-budget trade-off*, not a specification of an additional coupling. Confirming this closes the question without any new code and corrects the rulebook flag from `[OPEN]` to `[IMPL]`. (A) and (C) remain available as future tuning levers; both can be deferred behind real playtest pressure.

### Impact if deferred

The clock interplay continues to exist *as an emergent essence-allocation pressure*, which is what the rulebook actually describes. No design loss. The `[OPEN]` flag misleads future agents into thinking a formula needs writing.

### Spawn?

Small — **"Reclassify rulebook §7 dual-clock from `[OPEN]` to `[IMPL]` with cross-ref to essence economics"** — model:haiku, ~1 point. Combined with the manual-card cosmology fix below as a single small Codex ticket.

---

## Q6. Twilight authorship vs. emergence

### Current state (evidence)

- **Code:** `src/engine/echo.ts` exists; harvest pipeline partially wired per architecture-assessment §2 ("largest gap #2: Twilight Phase → World-Soul → next-cycle thematic injection").
- **Design:** Twilight is the most authored beat of the run (the closing chapter) but harvests from emergent play. The split is not specified.

### Options

- **(A) Specify now — full Twilight Phase plan-doc.** Big design pass: authored beats, procedural echo selection criteria, ordering, prose pipeline. Spawns a project's worth of work.
- **(B) Defer — block on metaprogression project's next phase.** Architecture assessment §2 already recommended this. The question becomes a blocker only when the metaprogression project re-enters Now.
- **(C) Sketch only.** Write a one-page brainstorm of the authored/emergent split *without* committing to a plan. Stays in `Brainstorms/`, not `plans/`. Light forward motion without lock-in.

### Cowork's recommended verdict — **(B) Defer**

Architecture assessment §2 nominated Twilight as the second-largest implementation gap; assessment §3 nominated this question as a blocker for metaprogression-project Phase 2. Both routes point at "design this when the metaprogression project re-enters Now." Verdict it deferred *with explicit dependency annotation* on the metaprogression project, so the question surfaces when that project advances rather than continuing to sit on the rulebook quarterly list.

### Impact if deferred

None until metaprogression Phase 2 starts. The `[OPEN]` flag should gain a `blocked-by: metaprogression-project-phase-2` annotation so future quarterly scans skip it cleanly.

### Spawn?

No. Update annotation in rulebook only.

---

## Manual ↔ Card structural drift — Cosmology section

### Current state (evidence)

- **Quick-ref `Docs/canon/rulebook-quick-reference.md`:** has a dedicated *"The Cosmology"* section listing eight Reaches (Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star) and twelve Spheres.
- **Full rulebook `Docs/canon/rulebook.md`:** does not headline cosmology as its own section. References appear inline within §4 *"What You Can Do"* (prerequisites — Reach + Sphere).
- **Drift severity:** structural — the synthesis layer (full rulebook) is missing a section the synthesis-card surfaces.

### Options

- **(A) Add Cosmology section to full rulebook between §4 and §5.** Synthesise from `Docs/canon/cosmology.md`. New ~30-line section: eight Reaches one-liner, twelve Spheres one-liner, orthogonality rule, Quintessence-is-not-a-Reach note.
- **(B) Remove Cosmology section from quick-ref.** Argument: the card should be *current rules of play only*, and Cosmology is content-substrate, not rules. Reach + Sphere prerequisites stay; the standalone list moves to per-domain canon.
- **(C) Leave as-is, accept synthesis convenience.** The card legitimately surfaces what players need; the manual legitimately defers to the per-domain canon. The drift is *intentional*, mark as such.

### Cowork's recommended verdict — **(A) Add to full rulebook**

The manual is the *synthesis layer*; if a topic warrants always-load-card surfacing, the synthesis layer should headline it too. Cosmology is foundational enough that a §4.5 "The Cosmology" section reading "Eight Reaches: ... Twelve Spheres: ... Orthogonal: ... Quintessence is meta, not a ninth Reach" is a 30-line addition that closes the structural seam permanently. Cheap, defensive against future card↔manual drift in either direction.

### Impact if deferred

Card and manual continue to disagree structurally. A new agent loading manual + UL but skipping the card might author content that assumes a Reach count or Sphere taxonomy that the manual doesn't headline. Already an impediment of the kind retrospectives surface.

### Spawn?

Small — bundled with the Q5 reclassification as a **single Codex content ticket**: "Rulebook Phase 1 verdict outcomes — add Cosmology section, reclassify §7 dual-clock, update §5 tier ladder per Q1 verdict, rename `gather_info → find` per Q2 verdict." Model:sonnet, ~5 points, all in `Docs/canon/` + `state-of-game-design` SKILL.

---

## Recommended batch outcome (for the verdict session)

If Christian accepts Cowork's recommended verdicts wholesale, the batch produces:

| Q | Verdict | Spawn | Notes |
|---|---------|-------|-------|
| Q1 Tier ladder | Resolve (C — hybrid: 5 tiers + Aspect-as-edge) | THR-XXX Continuous Improvement, model:sonnet, ~5pt | Code rename + Aspect edge migration |
| Q2 Five verbs | Resolve (B — implicit + vocabulary fix) | THR-XXX, model:haiku, ~3pt | `gather_info → find` rename only |
| Q3 Find-gate | Resolve (B — soft + lint) | THR-XXX, model:sonnet, ~3pt | Lint after audit |
| Q4 Session length | Defer with `last_considered: 2026-06-12` | None | |
| Q5 Doom+Mandate | Resolve (B — already implemented) | Bundled with cosmology fix | |
| Q6 Twilight | Defer with `blocked-by: metaprogression-P2` | None | |
| Card↔manual cosmology | Resolve (A — add §4.5) | Bundled with Q5 | |

**Three follow-up Linear tickets total**, plus one bundled rulebook-update ticket. Q4 and Q6 deferred with rationale.

If Christian disagrees on any single verdict, the prep above gives him every option's evidence inline so the call can be made without re-research.

---

## Process this prep doc follows

- **Stays In Design** — THR-414 is a dialogue session, not a CC handoff. Per the issue's own *"Why this isn't Ready for Dev"* clause, do **not** transition.
- **`plan-pending-commit` label applied to THR-414** so this prep doc reaches `origin/main` via the hourly `flush-plan-docs` task.
- **Christian's verdict session**, once it lands, becomes the closeout for THR-414 — the issue moves to Done once spawned tickets are filed.
- **No three-pillar table here.** This is a governance/dialogue prep doc, not a feature plan. The three-pillar rule applies to spawned tickets, not to the dialogue itself.

---

## NFP compliance summary

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | N/A | No new constants introduced by this doc itself |
| 2. Inspectability | N/A | No new traces by this doc itself |
| 3. Determinism | N/A | No PRNG-touching changes |
| 4. Fail-soft | N/A | No engine code touched |
| 5. Narrative over mechanical | PASS — Q5 verdict actively de-mechanises ("essence-economics emergent" beats arithmetic formula) |
| 6. Additive | PASS — Q1 (C) adds an edge type rather than renaming a five-state enum to a six-state enum |
| 7. Performance budget | N/A |
