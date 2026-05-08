---
name: encounter-pipeline
description: Automated encounter pipeline v2. Runs draft → editorial+revision → systems+merge → implementation for complete encounter delivery. Triggers on "encounter pipeline", "draft encounter", "run encounter pipeline", "author encounter", or "/encounter-pipeline".
model: opus
last_validated_against: 2026-05-08
---

# Encounter Pipeline v2

Automated 4-pass encounter pipeline: premise → deployed code. Each agent pass produces its own outputs — no manual orchestrator assembly between passes.

```
Premise → Draft (Opus) → Editorial+Revised (Opus) → Systems+Final (Sonnet) → Implementation (Sonnet)
```

## Scope

This pipeline produces **branching encounters** in `UnifiedActionTemplate` format — encounters with authored player-choice branches (`ActionStepBranch`) and full aftermath reaction suites. These go into `src/data/encounters/`.

For **linear template encounters** (guild, social, tavern, combat, borderland — single-step or multi-step without player-choice branches), use the `template-encounter-rewrite` skill instead. The migration to `UnifiedActionTemplate` is complete as of THR-108; `EncounterTemplate` no longer exists. Both encounter types now use the same unified format.

**Vault and documentation:** All encounter documentation lives in the Obsidian vault (`TheFantasyWorldSimulator/Systems/`). There are no Notion encounter pages; Notion content was migrated to Obsidian in April 2026.

## Step 0 — Read the Canon page first

Before any other reference material, read `Docs/canon/encounters.md`. It is the per-domain Step-0 entrypoint and points to the current spec, current rejected approaches, and current open questions. Everything below ("Systemic Wiring", "Game Design Direction Enforcement", etc.) is material the Canon page links to, and should be read after the Canon page, not instead of it.

If `Docs/canon/encounters.md` is missing or inaccessible, fall back to the pre-read list below and log the missing Canon page as a drift signal (open a `drift-scan`-labeled Linear issue per the canonical-documentation-strategy plan).

---

## Systemic Wiring — READ BEFORE AUTHORING

**Before running the pipeline, read `Docs/authoring-brief.md`** — the compiled preamble covering all 7 engine capabilities and the editorial rejection triggers. It is faster to read and more consistent than the full source. If `Docs/authoring-brief.md` is missing or `npm run check:authoring-brief` reports it stale, fall back to reading `Docs/plans/2026-04-16-systemic-wiring-guide.md` directly.

**Wounds and conditions in aftermath (THR-117):** To apply a physical or mental condition (wound, exhaustion, disease, blessing, …) in a `UnifiedActionTemplate` aftermath reaction, use the `condition_attachment` effect kind — not a legacy `content_grant` (which is not an aftermath effect kind) and not `appliesWound` (which is `EncounterTemplate`-only). Example: `{ kind: 'condition_attachment', templateId: 'trait.condition.wounded' }`. Applying the wound condition automatically triggers mid-encounter tier promotion from `background → shaping` (so the combat failure becomes visible in the chronicle) and feeds into the overflow pipeline (third wound → incapacitation check). You do not need to wire the overflow — it fires automatically. See the "Conditions and wounds" subsection of `Docs/plans/2026-04-16-systemic-wiring-guide.md` for all five subcategories and relevant constants.

**Exemplar encounters to study:** Read `Docs/exemplars.md` and study the top `Encounter` rows before drafting. This keeps exemplar promotion centralized and prevents skill-level drift.

## Game Design Direction Enforcement

**Before running the pipeline, read the issue's design doc in `Docs/plans/`.** If the design doc has Section 9 benchmark moments, inject them into the draft agent's prompt as the quality bar. Every encounter authored in this pipeline must meet or exceed the benchmark's emotional specificity and forward-hook quality.

**Inject the design direction principles into the draft agent's context.** The principles are compiled into `Docs/authoring-brief.md` (Section C). Prefer the brief; fall back to `Docs/plans/2026-04-16-game-design-direction.md` when the brief is absent.

**Player-as-god framing constraint.** The player is a god who observes through threads and intervenes indirectly. They NEVER make choices for the character. When writing encounter choices, intervention options, or any player-facing decision point: the choices must be what the *god* does (whisper, send vision, steady, strengthen, withdraw), never what the *mortal* does (say this, go there, fight). The mortal acts according to their personality and the god's influence. "Let them handle it" must always be a valid option.

**The editorial agent must check against these principles.** If a draft has structurally correct encounters but emotionally inert prose — if failure is just "you failed" with a number change, if choices have obvious right answers, if the player wouldn't care about the outcome — the editorial agent should REVISE, not PASS. **Additionally, any encounter where the player "chooses how the character responds" must be rejected and reframed as divine intervention.**

## Quality Exemplar

Every encounter must meet the quality standard demonstrated by "Gate Duty" (Clearance Gate):

- Opening with concept art + literary scene prose — a moment already in motion
- Threads discovered inside the prose, not in a separate menu
- Graduated approach cards with prose bodies at EVERY player-facing step
- Scene-specific choice labels ("Steady the Courier" not "Help them")
- Aftermath with reflective prose, actor-centered consequences, and reaction choices (medium+)
- **Cool failure at every branch** — the failure path must be as narratively interesting as the success path. If the failure outcome reads like punishment, it's not done.
- **Human conditions, not mechanical labels** — aftermath prose describes what the protagonist *feels* and *becomes*, not what numbers changed

If a draft reads like a functional template with structural bones but no experiential depth, the editorial agent will reject it.

## Invocation

The user provides:
- **scale** (short / medium / long) — required
- **premise** — a sentence or two
- **optional constraints** — faction, location, branching template, tone

```
/encounter-pipeline short about a ferryman who charges souls instead of coin
/encounter-pipeline medium about a plague ship quarantine at a port city
/encounter-pipeline long about a contested divine relic emerging from a collapsed shrine
```

**Modes:**
- Default → full pipeline (all 4 passes), encounter deployed to code
- `draft` → Pass 1 only
- `design` → Passes 1-3 only (no implementation)

## Slug Generation

Derive a kebab-case slug from the premise:
- "plague ship quarantine" → `plague-ship-quarantine`
- "tax collector's dilemma" → `tax-collector-dilemma`

All output files go to `Docs/plans/encounters/<slug>-<pass>.md`.

---

## Orchestration Protocol

The orchestrator (this skill) follows this state machine. No manual file editing, no assembly, no text surgery.

### Step 0: Canon-First Pre-Read

Before dispatching any agent, the orchestrator reads `Docs/canon/encounters.md` first. This Canon page is the Step 0 entrypoint for encounter authoring and establishes the current format, rejected approaches, and active-plan pointers.

Then the orchestrator reads the files the Canon page links to and injects them as context into agent prompts:

0. `Docs/authoring-brief.md` — compiled capability + principle preamble (preferred). If missing or stale, fall back: read `Docs/plans/2026-04-16-systemic-wiring-guide.md` and `Docs/plans/2026-04-16-game-design-direction.md` instead.
1. `Docs/encounter-building-checklist.md`
2. `Docs/encounter-branching-templates.md`
3. Obsidian vault pages via MCP:
   - `TheFantasyWorldSimulator/Systems/Thematic Pillars.md`
   - `TheFantasyWorldSimulator/Systems/Anti-Patterns.md`
   - `TheFantasyWorldSimulator/Systems/Content Creator Cheat Sheet.md`
   - At least one relevant archetype: `Character Archetypes.md`, `Ordeal Archetypes.md`, `Event Archetypes.md`, etc.

If Obsidian MCP is unavailable, note it and proceed. The draft agent should not need to read these files itself.

### Step 1: Dispatch Pass 1 (Draft)

Dispatch sub-agent with `agents/draft-prompt.md`, model `opus`.
Inject: scale, premise, constraints, pre-read reference material.
Agent writes: `<slug>-draft.md`

### Step 2: Dispatch Pass 2 (Editorial + Revision)

Dispatch sub-agent with `agents/editorial-prompt.md`, model `opus`.
Agent writes: `<slug>-editorial.md` AND `<slug>-revised.md`

**Check verdict in agent output:**
- `PASS` or `PASS WITH REVISIONS` → the agent produced both files. Proceed to Step 3.
- `REVISE BEFORE CONTINUING` → the agent produced only the editorial file (no revised file).

**On REVISE — auto-retry once:**
1. Re-dispatch the draft agent with the editorial feedback appended to the prompt: "The editorial agent returned REVISE BEFORE CONTINUING. Address these issues: [editorial feedback]"
2. Re-dispatch the editorial agent on the new draft.
3. If the second editorial also returns REVISE → **stop the pipeline** and tell the user.

### Step 3: Dispatch Pass 3 (Systems + Final Merge)

Dispatch sub-agent with `agents/systems-prompt.md`, model `sonnet`.
Agent writes: `<slug>-systems.md` AND `<slug>-final.md`

**Check verdict in agent output:**
- `READY FOR IMPLEMENTATION` or `READY WITH CAVEATS` → proceed to Step 4.
- `BLOCKED` → **stop the pipeline** and tell the user. The final file is produced but marked BLOCKED.

### Step 4: Dispatch Pass 4 (Implementation)

Dispatch sub-agent with `agents/implementation-prompt.md`, model `sonnet`.
Agent creates: `src/data/encounters/<slug>.ts`, `src/data/encounters/__tests__/<slug>.test.ts`
Agent modifies: `src/data/unified-action-templates.ts`
Agent generates: concept art (if design doc has art direction)
Agent runs: `npx tsc --noEmit`, `npm test`, `npx vite build`

**On completion:** commit and push. Report to user.

### Step 5: Done

Tell the user: encounter deployed. Provide the spawn command: `spawn encounter @hero <template-id>`

---

## Pipeline Passes (Detail)

### Pass 1: Draft

**Model:** `opus` — prose quality is the primary output
**Writes:** `<slug>-draft.md`

The draft agent produces a complete encounter packet with:
- All structural sections (inspiration anchors, pressure knot, cast, beat structure, branching profile, outcome ladder, support bundle, self-audit)
- Sample opening paragraph (continuous prose, fiction-grade)
- One branch-dependent later paragraph per branch
- Aftermath paragraph
- **Approach cards for EVERY player-facing step** — not just the branch-selection step
- Concept art direction
- Experience Differentiator Gate (14 YES/NO)

### Pass 2: Editorial + Revision

**Model:** `opus` — must catch prose weakness and enforce quality gates
**Writes:** `<slug>-editorial.md` + `<slug>-revised.md`

The editorial agent:
1. Reviews prose quality, branch seduction, scale discipline, inspiration honesty, aftermath payoff, dilemma energy
2. Runs the Experience Differentiator Gate (14 questions)
3. Issues a verdict
4. **If PASS or PASS WITH REVISIONS:** produces the revised file directly with all edits applied inline. No manifest. No orchestrator text surgery.
5. **If REVISE BEFORE CONTINUING:** produces only the editorial file. Pipeline auto-retries once.

**Automatic REVISE triggers** (non-negotiable):
1. No approach prose
2. Generic god-verbs
3. No thread integration
4. Missing aftermath reaction choices (medium+)
5. Reporter prose
6. No concept art recommendation
7. Missing per-step approach cards

### Pass 3: Systems Audit + Final Merge

**Model:** `sonnet` — code/systems analysis, not prose judgment
**Writes:** `<slug>-systems.md` + `<slug>-final.md`

The systems agent:
1. Audits support bundle honesty, missing primitives, runtime feasibility, aftermath supportability
2. Lists new hooks needed with scope estimates
3. Produces implementation file map
4. Issues a verdict (READY / READY WITH CAVEATS / BLOCKED)
5. **Produces the final merged document** with pipeline summary + full encounter packet from the revised file

### Pass 4: Implementation

**Model:** `sonnet` — code translation of already-authored prose
**Creates:** `src/data/encounters/<slug>.ts`, tests, concept art
**Modifies:** `src/data/unified-action-templates.ts`

The implementation agent:
1. Creates the encounter template file (prose copied verbatim from final doc)
2. Registers it in the unified action template array
3. Writes structural tests
4. Generates concept art (if art direction present)
5. Runs verification: tsc + tests + build
6. Commits and pushes

**Prose fidelity rule:** Sonnet copies prose verbatim. It does not rewrite Opus's work.

---

## Re-running Individual Passes

- `/encounter-pipeline draft <slug>` — re-run draft only
- `/encounter-pipeline editorial <slug>` — re-run editorial+revision (reads existing draft)
- `/encounter-pipeline systems <slug>` — re-run systems+merge (reads existing revised)
- `/encounter-pipeline implement <slug>` — re-run implementation (reads existing final)

## Scale Enforcement

- `short`: 1-2 beats, 0 or 2 branches, compact aftermath
- `medium`: 2-3 beats, 0, 2, or 3 branches, curated aftermath
- `long`: 3-5 beats, 2-3 branches, full aftermath + reaction choices

Branch count 1 is invalid. Encounters are linear (0) or branching (2-3).

## Branch Count Enforcement

- 3 is a ceiling, not a target
- 2 strong branches > 3 weak branches
- The editorial agent must evaluate whether each branch earns its place

## Model Assignment

| Pass | Model | Why |
|------|-------|-----|
| 1: Draft | **Opus** | Prose quality is the primary output |
| 2: Editorial + Revision | **Opus** | Must catch prose weakness, enforce quality gates, apply its own edits |
| 3: Systems + Final Merge | **Sonnet** | Code/systems analysis + mechanical assembly |
| 4: Implementation | **Sonnet** | Code translation of already-authored prose |

Opus where creative judgment matters. Sonnet where code/systems matters. 2 of 4 passes use the cheaper model.

## File Dependencies

```
Reference material (pre-read by orchestrator)
    │
    ▼
Pass 1 (Draft, Opus) ──→ <slug>-draft.md
    │
    ▼
Pass 2 (Editorial+Revision, Opus) ──→ <slug>-editorial.md + <slug>-revised.md
    │
    ├── REVISE? → auto-retry once → still REVISE? → STOP
    │
    ▼
Pass 3 (Systems+Merge, Sonnet) ──→ <slug>-systems.md + <slug>-final.md
    │
    ├── BLOCKED? → STOP (final file marked BLOCKED)
    │
    ▼
Pass 4 (Implementation, Sonnet) ──→ src/data/encounters/<slug>.ts
                                     src/data/encounters/__tests__/<slug>.test.ts
                                     public/concept-art/encounters/<slug>.jpg
                                     src/data/unified-action-templates.ts (modified)
    │
    ▼
Commit + Push → Vercel auto-deploys
```
