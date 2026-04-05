---
name: encounter-pipeline
description: Automated encounter pipeline. Runs draft -> editorial -> systems audit -> final merge -> implementation for complete encounter delivery. Use when authoring a new encounter, revising an encounter, or running the full pipeline. Triggers on "encounter pipeline", "draft encounter", "run encounter pipeline", "author encounter", or "/encounter-pipeline".
model: opus
---

# Encounter Pipeline

Automated 5-pass encounter pipeline that takes an encounter from premise to deployed code: draft → editorial review → systems audit → final merge → implementation. Enforces scale discipline, branch-count restraint, editorial quality gates, systems feasibility, and verified TypeScript implementation.

## Quality Exemplar

Every encounter produced by this pipeline must meet the quality standard demonstrated by "Gate Duty" (Clearance Gate). This is the floor, not the ceiling. A passing encounter has:

- **Opening with concept art + literary scene prose.** The player sees a composed image and reads prose with its own voice — cadence, rhythm, atmosphere. Not a briefing. A moment already in motion.
- **Threads discovered inside the prose.** The scene names the people, objects, and tensions that later become player choices. The player finds them by reading, not by scrolling to a menu.
- **Graduated approach cards with prose bodies.** Each choice has a full paragraph describing what the intervention feels like from the god's perspective. Each explains its cost narratively ("barely a breath of essence" vs "five times the essence, and the thread fights you"). Each carries a narrative risk preview.
- **Scene-specific choice labels.** "Steady the Courier" / "Force the Captain" / "Keep Your Hand Folded" — not "Help them" / "Let it play out."
- **Multi-scene structure** with a narrative arc tracked in the Scene So Far panel.
- **Aftermath with reflective prose** that wraps the experience before showing mechanics. Consequence outcomes are actor-centered with names and faces ("Ashara gained Ill Luck"), not anonymous stat deltas ("Heart grew 0.05").
- **Aftermath reaction choices** where the player decides which consequence thread to carry forward. Each choice represents a different philosophical stance about consequence — "Follow the Rumor" / "Keep the Captain in Your Sights" / "Let the District Decide" — not mechanical variants.

If a draft reads like a functional encounter template with the right structural bones but none of this experiential flesh, it has not passed. The editorial agent will reject it.

## Invocation

The user provides:
- **scale** (short / medium / long) — required
- **premise** — a sentence or two describing what the encounter is about
- **optional constraints** — specific faction, location, branching template, or tone

Examples:
```
/encounter-pipeline medium encounter about a plague ship quarantine at a port city
/encounter-pipeline short encounter about a tax collector pressured by two factions
/encounter-pipeline long signature encounter about a contested divine relic emerging from a collapsed shrine
```

If the user says only "draft" (e.g., `/encounter-pipeline draft short about X`), run only Pass 1 and stop. If the user says "design" or "design only", run passes 1-4 (no implementation). Otherwise run all 5 passes — the default is full delivery including implementation.

## Slug Generation

Derive a kebab-case slug from the premise. Examples:
- "plague ship quarantine" → `plague-ship-quarantine`
- "tax collector's dilemma" → `tax-collector-dilemma`

All output files go to `Docs/plans/encounters/<slug>-<pass>.md`.

## Pipeline Passes

### Pass 1: Draft

**Agent type:** `general-purpose`
**Model:** `opus` — prose quality is the primary output; smaller models produce structurally valid but experientially flat encounters
**Persona:** Encounter author — fiction-first, high prose quality
**Reads:** encounter-building-checklist.md, encounter-branching-templates.md, Notion inspiration library (Tonal Bible, Thematic Pillars, Anti-Patterns, relevant archetypes), Notion Dilemma Content Library if choice-heavy
**Writes:** `Docs/plans/encounters/<slug>-draft.md`

Dispatch this as a sub-agent with the prompt from `agents/draft-prompt.md`, injecting the user's scale, premise, and constraints.

The draft agent must produce every section from the encounter packet template in the checklist. It must also include:
- sample opening paragraph (continuous prose, not a summary)
- one branch-dependent later paragraph **per declared branch** (so a 2-branch encounter has 2 variants, a 3-branch has 3 — every branch must prove itself in prose)
- for linear encounters (branch count 0): a single continuation paragraph, no branching profile/map sections required
- aftermath paragraph
- self-audit against the checklist's Definition of Done

### Pass 2: Editorial Review

**Agent type:** `general-purpose`
**Model:** `opus` — must catch prose weakness and enforce the Experience Differentiator Gate; a smaller model may rubber-stamp flat prose
**Persona:** Editorial reviewer — reads for quality, temptation, and variety, NOT for systems correctness
**Reads:** `<slug>-draft.md`, encounter-branching-templates.md (for editorial questions)
**Writes:** `Docs/plans/encounters/<slug>-editorial.md`

Dispatch this as a sub-agent with the prompt from `agents/editorial-prompt.md`.

The editorial agent must assess:
1. Prose quality — cadence, imagery, tension, atmosphere
2. Branch seduction — are all branches genuinely tempting?
3. Branch count — should a weak branch be cut?
4. Inspiration anchor honesty — did the anchors materially change the encounter?
5. Aftermath payoff — does the ending land?
6. Dilemma energy — do choices reveal divine posture?

The editorial agent must:
- Quote specific weak passages and explain why they're weak
- Rewrite weak passages inline (marked as `[EDITORIAL REWRITE]`)
- Give a clear verdict: `PASS`, `PASS WITH REVISIONS` (revisions included inline), or `REVISE BEFORE CONTINUING`
- If `REVISE BEFORE CONTINUING`, list exactly what needs to change

### Pass 2b: Revision Consolidation

**Run by the orchestrator (this skill), not a sub-agent.**

If editorial verdict is `REVISE BEFORE CONTINUING`:
- Stop the pipeline. Do not produce a revised file or run the systems audit.
- Tell the user what needs manual revision before re-running.

If editorial verdict is `PASS` (no revisions needed):
- Copy the draft as-is to `<slug>-revised.md`.

If editorial verdict is `PASS WITH REVISIONS`:
1. Read `<slug>-draft.md` and the **Revision Manifest** section from `<slug>-editorial.md`
2. Start from a copy of the draft
3. Apply manifest changes mechanically, in this order:
   a. **Section replacements** — for each `section_replacements` entry: locate the section by name in the draft and replace its entire content with `full_replacement`. This handles branch cuts, scale changes, and other structural edits that affect non-row-structured sections (Outcome Ladder, Aftermath Kit Summary, Branching Map, Support Bundle Contract, etc.).
   b. **Branching profile updates** — if `branching_profile_update` is set: replace the branching profile section fields. If `branch_count_change` is set: update the branch count.
   c. **Scale/beat changes** — if `scale_change` or `beat_count_change` is set: update the scale justification, beat structure, and header metadata.
   d. **Prose rewrites** — for each `prose_rewrites` entry: locate the passage by section name and `original_starts_with`, replace with `rewritten_text`.
4. Update the self-audit section: re-check items affected by the changes, mark as REVISED.
5. Write the result to `Docs/plans/encounters/<slug>-revised.md`

**If the manifest is missing or incomplete when the verdict is PASS WITH REVISIONS:** Treat this as an editorial-agent error. Stop the pipeline and tell the user the editorial pass needs to be re-run — do not improvise the structural changes.

**The systems agent always reads `<slug>-revised.md`, never the original draft.** This guarantees the systems audit evaluates the encounter as editorial approved it — with branches cut, prose rewritten, and structure adjusted.

### Pass 3: Systems Audit

**Agent type:** `general-purpose`
**Model:** `sonnet` — systems audit is structural/code analysis, not prose judgment; Sonnet is strong at codebase awareness and faster/cheaper at scale
**Persona:** Systems auditor — runtime-focused, honest about gaps
**Reads:** `<slug>-revised.md` (the editorially-approved version), `<slug>-editorial.md` (for context on what changed), relevant source files (encounter types, unified action types, game state)
**Writes:** `Docs/plans/encounters/<slug>-systems.md`

Dispatch this as a sub-agent with the prompt from `agents/systems-prompt.md`.

**Critical:** Pass `<slug>-revised.md` as the primary design input, NOT `<slug>-draft.md`. The revised file incorporates all editorial changes — branch cuts, prose rewrites, scale adjustments. The systems agent should audit what will actually be implemented.

The systems agent must check:
1. Support bundle honesty — are delivery modes realistic?
2. Missing primitives — what doesn't exist yet?
3. Runtime feasibility — can the current engine carry this?
4. Aftermath supportability — are the consequences wirable?
5. New hooks needed — shells, state fields, reveal hooks, etc.
6. Unified registration path — if this will be a unified encounter

The systems agent must produce:
- An implementation-readiness verdict: `READY FOR IMPLEMENTATION`, `READY WITH CAVEATS` (list caveats), or `BLOCKED` (list blockers)
- A concrete list of files that would need to be created or modified
- A **primitive disposition** for every missing primitive: either BUILD NOW (with a development spec concrete enough to implement from) or BACKLOG (with a spec concrete enough to implement later without re-deriving requirements). Small-to-medium reusable primitives should be built now; large or design-heavy primitives should be backlogged with actionable specs.

### Pass 4: Final Merge

**Run by the orchestrator (this skill), not a sub-agent.**

Read `<slug>-revised.md`, `<slug>-editorial.md`, and `<slug>-systems.md`. Then:

**If editorial verdict was `REVISE BEFORE CONTINUING`:**
- The pipeline already stopped at Pass 2b. This pass should not run.

**If systems verdict is `BLOCKED`:**
- Produce the final file but mark it clearly as `STATUS: BLOCKED — not ready for implementation`.
- Include the blocker list prominently at the top.

**If both pass:**
- Produce `Docs/plans/encounters/<slug>-final.md` containing:
  - Status: READY FOR IMPLEMENTATION (or READY WITH CAVEATS)
  - The encounter packet (from `<slug>-revised.md` — the editorially-approved version)
  - Editorial notes summary (what was changed and why)
  - Systems verdict and file list
  - Any caveats or backlog items

### Pass 5: Implementation

**Agent type:** `general-purpose`
**Model:** `sonnet` — implementation is code translation, not creative writing; the prose is already authored and editorially reviewed. Sonnet is fast, accurate at TypeScript, and cost-efficient for high-volume encounter production.
**Persona:** Implementation engineer — faithful translator of design into code
**Reads:** `<slug>-final.md`, canonical examples (`src/data/encounters/flawed-steel.ts`, `src/data/encounters/rival-shrine-betrayal.ts`), type definitions (`src/types/unifiedAction.ts`)
**Creates:** `src/data/encounters/<slug>.ts`, `src/data/encounters/__tests__/<slug>.test.ts`
**Modifies:** `src/data/unified-action-templates.ts` (import + array entry)

Dispatch this as a sub-agent with the prompt from `agents/implementation-prompt.md`, injecting the slug.

**Only run this pass when:**
- The final merge (Pass 4) produced a status of `READY FOR IMPLEMENTATION` or `READY WITH CAVEATS`
- The user has NOT specified "design only" or "design"

**Do NOT run this pass when:**
- Systems verdict was `BLOCKED`
- Editorial verdict was `REVISE BEFORE CONTINUING`
- The user explicitly requested design-only output

The implementation agent must:
1. Create the encounter template file with all prose copied verbatim from the design doc
2. Register it in the unified action template array
3. Write structural tests
4. Run verification: `npx tsc --noEmit`, `npm test`, `npx vite build`
5. Fix any issues and re-verify

**Prose fidelity rule:** The implementation agent copies prose from the design document verbatim. It does not rewrite, summarize, or "improve" authored prose. The prose was the most expensive part of the pipeline (Opus draft + Opus editorial). Sonnet's job is to wrap it in correct TypeScript, not to touch it.

**Verification gate:** The encounter is not implemented until all three checks pass (type check, tests, build). If any fail, the implementation agent must fix the issue and re-run. The orchestrator should report failures to the user if the agent cannot self-correct.

## Re-running Individual Passes

The user can re-run a single pass:
- `/encounter-pipeline draft <slug>` — re-run only the draft pass (overwrites draft file, deletes revised file if it exists)
- `/encounter-pipeline editorial <slug>` — re-run only editorial (reads existing draft), then re-run revision consolidation to produce updated revised file
- `/encounter-pipeline systems <slug>` — re-run only systems audit (reads existing revised file; errors if no revised file exists — run editorial first)
- `/encounter-pipeline merge <slug>` — re-run only the merge (reads revised + editorial + systems files)
- `/encounter-pipeline implement <slug>` — re-run only implementation (reads existing final file; errors if no final file exists or if status is BLOCKED)

## Scale Enforcement

The orchestrator validates scale before dispatching:
- `short`: 1-2 beats, 0 or 2 branches, compact aftermath
- `medium`: 2-3 beats, 0, 2, or 3 branches, curated aftermath
- `long`: 3-5 beats, 2-3 branches, full aftermath + reaction choices

Branch count 1 is not a valid state. Encounters are either linear (0 — no player choices between beats) or branching (2-3 — a genuine fork with meaningfully different paths). A "single choice" encounter should be modeled as linear with a good outcome ladder.

If the draft agent produces a packet that exceeds its scale (e.g., a "short" with 4 beats and 3 branches), the editorial agent must flag this as a scale violation.

## Branch Count Enforcement

Every pass reinforces the branch-count standard:
- 3 is a ceiling, not a target
- 2 strong branches > 3 weak branches
- The editorial agent must explicitly evaluate whether each branch earns its place
- If after editorial review a third branch is still weak, the merge pass removes it

## Output File Format

All output files use this header:

```markdown
# Encounter Pipeline: <Title>
> Scale: <short|medium|long> | Slug: <slug> | Pass: <draft|editorial|systems|final>
> Date: YYYY-MM-DD | Pipeline version: 1.0

---
```

## Inspiration Library Access

The draft agent must consult these Obsidian vault pages via MCP:
- [[Inspirational Catalogue]] (for foundation pages and worldbuilding reference)
- [[Thematic Pillars]]
- [[Anti-Patterns]]
- [[Content Creator Cheat Sheet]] (Threadbare tone guidelines)
- At least one relevant archetype page: [[Character Archetypes]], [[Region Archetypes]], [[Place Archetypes]], [[Event Archetypes]], [[Ordeal Archetypes]]

Use `obsidian_get_file_contents` with paths like `TheFantasyWorldSimulator/Archetypes/Character Archetypes.md` or `TheFantasyWorldSimulator/Systems/Thematic Pillars.md`.

If Obsidian MCP is unavailable, the draft agent should note which pages it would have consulted and proceed with best-effort authoring. The editorial agent should flag any inspiration anchors that feel generic or ungrounded.

## File Dependencies

```
encounter-building-checklist.md ──┐
encounter-branching-templates.md ──┤
Obsidian inspiration library ──────┤──→ Pass 1 (Draft, Opus) ──→ <slug>-draft.md
User premise + scale ──────────────┘                                    │
                                                                         ├──→ Pass 2 (Editorial, Opus) ──→ <slug>-editorial.md
encounter-branching-templates.md ────────────────────────────────────────┘            │
                                                                                      │
<slug>-draft.md + <slug>-editorial.md ───────────────────────────────────────────────→ Pass 2b (Revision, Orchestrator) ──→ <slug>-revised.md
                                                                                                                                  │
<slug>-revised.md ───────────────────────────────────────────────────────────────────────────────────────────────────────────────→ Pass 3 (Systems, Sonnet) ──→ <slug>-systems.md
src/types/unifiedAction.ts ──────────────────────────────────────────────────────────────────────────────────────────────────────┘            │
src/engine/ ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                                                              │
<slug>-revised.md + <slug>-editorial.md + <slug>-systems.md ────────────────────────────────────────────────────────────────────────────────→ Pass 4 (Merge, Orchestrator) ──→ <slug>-final.md
                                                                                                                                                                                    │
<slug>-final.md ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────→ Pass 5 (Implementation, Sonnet)
src/data/encounters/flawed-steel.ts (pattern) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘    │
src/types/unifiedAction.ts ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                                                                                                                          │
                                                                                                                                              Creates: src/data/encounters/<slug>.ts
                                                                                                                                              Creates: src/data/encounters/__tests__/<slug>.test.ts
                                                                                                                                              Modifies: src/data/unified-action-templates.ts
```

## Model Assignment Rationale

| Pass | Model | Why |
|------|-------|-----|
| Pass 1: Draft | **Opus** | Prose quality is the primary output. Smaller models produce structurally valid but experientially flat encounters. |
| Pass 2: Editorial | **Opus** | Must catch prose weakness and enforce the Experience Differentiator Gate. A smaller model may rubber-stamp flat prose. |
| Pass 2b: Revision | Orchestrator | Mechanical text surgery — no model dispatch needed. |
| Pass 3: Systems | **Sonnet** | Structural/code analysis, not prose judgment. Sonnet is strong at codebase awareness and 20% cheaper/faster. |
| Pass 4: Merge | Orchestrator | Assembly — no model dispatch needed. |
| Pass 5: Implementation | **Sonnet** | Code translation of already-authored prose into TypeScript. Fast, accurate, cost-efficient for high-volume production. |

This split puts Opus where creative judgment matters (draft + editorial) and Sonnet where code/systems analysis matters (systems audit + implementation). For a full pipeline run, 2 of 3 agent dispatches use the cheaper model.
