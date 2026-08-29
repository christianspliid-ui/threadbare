---
domain: prose
last_reviewed: 2026-08-25
reviewer: claude-code
ul_shards: [Prose, Encounters]
status: live
---

# Canon — Prose

> Prose is where systemic state becomes story. The same engine signal — a faction shift, a reach roll, a thread under stress — must read like a moment a god is overhearing, not a row in a database. The prose canon is the navigation layer over four pipelines, three authoring skills, and one aesthetic. It does not define terms (the UL does) or argue for design choices (plans do); it tells you *which surface answers your question right now*.

## How to use this page

Load this page once at session start when authoring prose, encounter narrative, vignettes, or content tables. Every link below is a pointer; the linked target is authoritative. When a pointer disagrees with the target, the target wins and the pointer needs an update — open a `drift-scan`-labeled Linear issue.

**Prose is a broad domain.** Three skills divide the work. Pick one before you write — running the wrong skill fights the right one.

## Authoring entrypoint — pick the skill that matches your task

| If you are doing… | Load skill | Lives at |
|---|---|---|
| Writing encounter templates, narrative event prose, faction content, spell flavor, or any content-table entry (the high-volume daily work) | [`prose-content-systems`](../../.claude/skills/prose-content-systems/SKILL.md) | `src/data/*-content.ts`, encounter and faction content files |
| Authoring or editing vignettes (Scene/Lens/Stakes/Forecast), enrichment placeholders (`{name}`, `{artifact}`, `{ally}`, conditional blocks), backstory strata, or encounter-history → prose wiring | [`prose-vignettes-and-enrichment`](../../.claude/skills/prose-vignettes-and-enrichment/SKILL.md) | `src/engine/vignetteProse.ts`, `src/engine/proseEnrichment.ts`, `src/data/backstory-content.ts` |
| Implementing a *new* graph-walking resolver, modifying the prose pipeline, or shipping a new ProseLayer category | [`prose-pipeline`](../../.claude/skills/prose-pipeline/SKILL.md) | `src/engine/proseGenerator.ts`, `proseResolvers.ts`, `proseComposer.ts`, `src/data/prose-layer-content.ts` |

If your task crosses two skills (e.g. authoring a new resolver *and* its content table), load `prose-pipeline` first — architecture before content.

## Current spec — pipelines

Prose generation runs through four pipelines, each with a clear input → output contract:

- **Graph-walking resolvers** ([`src/engine/proseGenerator.ts`](../../src/engine/proseGenerator.ts), [`proseResolvers.ts`](../../src/engine/proseResolvers.ts), [`proseComposer.ts`](../../src/engine/proseComposer.ts)) — entity descriptions for locations, actors, factions. Resolvers walk graph edges from a target node and emit `ProseLayer[]`; the composer caps per category and joins. Content lives in [`src/data/prose-layer-content.ts`](../../src/data/prose-layer-content.ts). Design: [`Docs/plans/2026-03-09-prose-generator-framework-design.md`](../plans/2026-03-09-prose-generator-framework-design.md).
- **Narrative engine** ([`src/engine/narrative.ts`](../../src/engine/narrative.ts), [`culturalProse.ts`](../../src/engine/culturalProse.ts)) — three-tier event prose (Routine / Notable / Chronicle). Sphere vocabulary (`SPHERE_VOCABULARY`) flavors verbs and adjectives; cultural palettes substitute at 30%. Content: [`src/data/narrative-content.ts`](../../src/data/narrative-content.ts), [`culture-content.ts`](../../src/data/culture-content.ts).
- **Vignette prose** ([`src/engine/vignetteProse.ts`](../../src/engine/vignetteProse.ts)) — encounter step narratives in the four-part Scene / Lens / Stakes / Forecast structure. Forecast tier maps from success probability (`doomed | perilous | uncertain | favorable | fated`).
- **Prose enrichment** ([`src/engine/proseEnrichment.ts`](../../src/engine/proseEnrichment.ts), implemented as `enrichProse()`) — runs at generation time, walks the graph for a `NarrativeContext`, resolves placeholders and conditional blocks. Required reading: [Capability 1 of the systemic wiring guide](../plans/2026-04-16-systemic-wiring-guide.md).

The four pipelines compose: a vignette step calls enrichment; an entity description from resolvers may seed a vignette's Scene; a Notable-tier event reuses the same enrichment context. **Author content for the pipeline that owns it; the others compose without your help.**

## Current spec — pointers

- **UL terms (canonical):** [Docs/ubiquitous-language/Prose.md](../ubiquitous-language/Prose.md) — IPK, Enrichment Placeholder, Resolver, Strata, Narrative Lexicon, Chronicle Entry, Narrative Event, Thread Tug.
- **Engine wiring (required reading before authoring):** [Docs/plans/2026-04-16-systemic-wiring-guide.md](../plans/2026-04-16-systemic-wiring-guide.md). Capability 1 (Enrichment Placeholders) is the prose-author chapter; Capabilities 2–9 explain what aftermath, marks, seeds, intel, and intervention do that prose must respect.
- **Encounters Canon (sibling domain):** [Docs/canon/encounters.md](encounters.md) — encounter format (`UnifiedActionTemplate`), the four load-bearing rules, the reach × archetype-axis table.
- **Cosmology Canon (terminology authority for reach/sphere terms):** [Docs/canon/cosmology.md](cosmology.md) — 8 Reaches, 12 Spheres, Quintessence as meta-property (not a Reach).
- **Compiled brief:** [Docs/authoring-brief.md](../authoring-brief.md) — sha-pinned preamble regenerated via `npm run build-authoring-brief`; staleness check `npm run check:authoring-brief`.
- **Narrative Lexicon (10-tier per-Reach vocabulary):** `NARRATIVE_LEXICON` in [src/types/traits.ts](../../src/types/traits.ts).
- **Exemplars:** [Docs/exemplars.md](../exemplars.md) — the encounter-prose exemplar is `swollen-ford-exemplar.ts`; `rival-shrine-betrayal.ts` (10/10) and `flawed-steel.ts` (9/10) were **demoted to wiring-only exemplars** in THR-1250 with their register verdicts recorded there (past tense, encoded facts, similes in baseline — do not copy their prose; their choice model also predates the nudge pivot). Plus inline **baseline-register** and **peak-register** exemplars (THR-609) showing the register contrast.

## Threadbare voice rules (read once, hold throughout)

The aesthetic is a hard constraint, not a stylistic suggestion. Drift is the most common reason editorial passes reject drafts.

- **Dark world, hidden magic, threads that break through.** Magic is uncanny, not pyrotechnic.
- **Short, declarative sentences with one vivid detail.** One image earns its keep; three become noise.
- **No exclamation marks. No breathless enthusiasm.** Cool failure beats bombast.
- **Wear and age over polish and perfection.** Surfaces are worn, weathered, frayed.
- **The uncanny over the fantastic.** Strange is colder than spectacular.
- **Dry wit over comedy. Irony over sentimentality.**

The full voice articulation lives in `Obsidian → Systems/Tonal Bible.md` and `Systems/Narrative Engine.md` (verify freshness — vault Systems pages can lag code; if these pages contradict UL or this Canon page, the UL/Canon wins and the vault page needs a `drift-scan` issue).

## The register model (settled — plainspoken Malazan, THR-609)

The voice rules above say *what* the texture is. The register model says *how plain* — and it is enforced, because content has been drifting lyrical in practice despite the rules. **Plainness is the baseline; lyricism is the rationed exception, not the default.** Malazan is not high lyrical literature all the time — its funniest, most human beats are plain-spoken squad banter. That is the default voice here. This is a diction calibration, not a length cut: long prose stays a feature.

Every player-facing string belongs to exactly one of three registers.

**1. Baseline narration — the default, the large majority of words the player reads.**
Plain, concrete, active. Short-to-medium sentences, one idea each. Concrete nouns and verbs over abstractions. Dry understatement and deadpan humor are the preferred texture — soldiers talking around a fire, not the Kharkanas high register. Stacked metaphors, archaic diction, and ornamental subordinate clauses are drift. If a word would send a reader to a dictionary, it does not belong in baseline.

**2. Character voice — dialogue and agent-attributed lines.**
Idiosyncratic per persona, but comprehension-first: wit over ornament. A character may be florid *as characterization* — sparingly, at most one such voice per scene (the Kruppe allowance) — but the narration around them stays baseline.

**3. Peak register — rationed lyricism.**
Reserved for designated **non-encounter** surfaces: doom stage transitions, the Twilight Phase, and World-Soul / Echo prose. Here the cosmic-melancholy lyric is earned. Budget: at most one figurative image per paragraph; sentence rhythm may stretch. Rare vocabulary is allowed only when the sentence glosses it in context. *(Encounter climax steps and major aftermath beats were peak surfaces until 2026-08-25 — Doctrine v2 retired peak lyricism for every encounter surface; see § Narrator mode below.)*

**Hard rule — interactive text is always plain.** Choice labels, action-card names, buttons, IPK keywords, tooltips, panel headings: no metaphor, no archaic words, no ambiguity about what a click does. A player must never misread an affordance because the label was being literary. IPK keywords are the learning engine — they stay mechanical-plain.

### Declaring a register in content

Register is an **additive optional field** on content entries / template prose fields: `register?: 'baseline' | 'character' | 'peak'`. **Absent → `baseline`** (the strictest common case). Only declare `peak` on the designated surfaces above; only declare `character` on dialogue-attributed lines. Do not reach for `peak` to license a lyrical impulse in baseline narration — that is exactly the drift this model exists to stop.

### The scorer is the floor, not the ceiling

The prose-QA audit ([`registerCompliance`](../../src/engine/content-eval/registerCompliance.ts) in the THR-490 harness — `window.__DEBUG.proseQualityReport()`) measures register drift deterministically: average sentence length, rare-word density, figurative-image density per paragraph, and interactive-label plainness. A `warn` with editorial sign-off may still ship (NFP #5 — the scorer serves the voice, not the reverse); a `fail` requires either a rewrite or an honest register re-declaration. Thresholds are named constants in [`registerRubric.ts`](../../src/data/content-eval/registerRubric.ts) — tune the constant, never special-case the prose.

**Calibration verdict, 2026-08-25 (THR-1250): `registerCompliance` stays report-only and does not become a blocking metric in `check:encounter`.** Recorded here so the question is not re-litigated per batch. Four reasons:

1. **It ranks, it does not identify defects.** All four metrics are continuous measures with tuned thresholds. THR-1224 already set the bar for this class in `check-encounter.ts`: right most of the time is the bar for a warning, not for a gate — which is why the abstraction and intensifier detectors were demoted to `[warn]` rather than promoted.
2. **A gate was not the missing part.** THR-1250's demonstrated loss was a *polluted preamble*, not an absent gate: the register model was canonical and correct the whole time, and the compiled brief every draft agent read first opened on April-era principles with zero register guidance. That is now fixed at source. Adding a downstream gate would be hardening against a failure that has not recurred since — rule 3 work, not rule 0.
3. **A false-positive register gate damages the prose it protects.** Precedent is THR-899 in this same file: the flat vagueness detector failed the director's canonical example of *correct* prose and produced contortions written solely to dodge a banned word. A blocking sentence-length or rare-word threshold reproduces exactly that.
4. **The higher-signal promotion candidate is elsewhere and is campaign-sized.** `doctrineV2Checks.ts` (opening skeleton, card-name shape) is structural rather than statistical and is the right thing to make blocking — but it reported 302 warnings across the corpus at ship, so promoting it needs the retrofit campaign (THR-1130) plus a `RETROFIT_PENDING` ratchet entry per template. It belongs to that campaign.

**Re-open the question when** the corpus's doctrine-v2 warning count reaches zero *and* a register regression is observed shipping through a clean brief — i.e. when the preamble fix is proven insufficient rather than untested.

### The vagueness detectors are scoped, not flat (THR-899, 2026-08-01)

A second, narrower detector family runs beside the register scorer — the nudge-spec
vagueness lexicon in [`nudgeAuditDetectors.ts`](../../src/data/content-eval/nudgeAuditDetectors.ts),
which is the **single authority** for those term lists. Read it in three parts, because
which part applies depends on what the field is doing:

| Term set | Enforced in | Example |
|---|---|---|
| **Evasive** — hedges, nominalised placeholders, `something` | every field class, at zero | *"it cost them something"* ✗ |
| **Natural indefinites** — `someone`, `somewhere`, `way`, `nothing`, `thing`, … | **outcome prose only** | *"someone is asking around after the agent"* ✓ in scene, ✗ in an afterimage |
| **Intensifiers** — `very`, `deeply`, `utterly`, … | nowhere — reported as a **warning** | weak, not a failure |

"Outcome prose" is what the player reads *after* the roll: band base text and fragments,
afterimages, aftermath overviews, `narrativeTemplates.success`/`.failure`. Everything else
— openings, step narratives, vignettes, a card's `fiction` — is scene prose and holds only
to the evasive set.

**This exists because the flat version damaged the prose it was protecting.** It failed
Christian's canonical example of *correct* prose and produced contortions like "the
stranger is asking the room for them by name" written solely to dodge a banned `someone`.
Rule zero governs: write the plain sentence. `countVagueness(text, fieldClass)` defaults to
the strictest scope, so pass the real class.

- **Label** — wrong: *"Beseech the Sundered Veil."* right: *"Part the Veil."*
- **Baseline** — wrong: *"The merchant's ambit had grown parlous, freighted with the weight of unspoken covenants."* right: *"The merchant owed too many people too much. He'd started checking the door."*
- **Peak** (allowed, doom transition): *"The bells stopped. Whatever had been holding its breath beneath the city let it out."*

### Narrator mode — Prose Doctrine v2 (Christian, 2026-08-25; supersedes the three plainness moves)

The 08-15 plainness moves fixed sentences inside a mode that was wrong. The border-perils read named it: *"you are still writing in situ instead of just describing."* The recurring failure was never vocabulary — it was **mode**. The standard now, for every encounter surface:

- **Narrate, never inhabit.** Write as a game master reading a module aloud — a narrator reporting events from outside the scene. No interior sensation, no camera work, no atmosphere without a job.
- **State facts, never encode them.** If the fact is "no one dares approach it," write that sentence — never the physical evidence the reader must decode.
- **The opening skeleton:** three short paragraphs — arrival (real graph names) · situation & complication (events, costs already paid) · the problem (one stake shape from the seed-dice table). ≤80 words total.
- **Everything serves challenge → test → outcome.** A sentence doing none of those jobs is cut.
- **Cards read like spells:** imperative verb + noun names ("Inspire Courage"), one or two direct sentences of effect. The flavor quote is retired.

**The authoritative full text lives in the nudge authoring spec** — [`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`](../../.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md) § Prose doctrine v2, with the calibration exemplar (the director's rewrite of The Unclaimed Relic), the survives/retired lists, and the five Seed Dice. This binds every encounter prose pass from 2026-08-25 on, including the Encounter Factory critic loop; the plainness moves' subject-first and abstract-noun content is folded into it, and two v1 rules are explicitly **reversed**: foreshadow-never-announce (now: announce plainly) and show-don't-tell (now: tell).

## Per-template quality bar (5 questions, ask every time)

Every prose line must answer yes to all five:

1. **Does this create a human condition the player recognizes?** Not "trust_decay -0.02" but "exposed," "indebted," "unexpectedly grateful." Mechanical changes without human texture get rewritten.
2. **Does this make the player want to know what happens next?** Every line opens a question, creates a tension, or implies a consequence. *"The negotiation failed"* is dead. *"The negotiation failed — and the merchant's apprentice heard every word"* is a hook.
3. **Is every fact stated, in narrator mode?** (Amended 2026-08-25 — this question used to demand "a moment, not a label," which trained the in-situ mode Doctrine v2 retired. A plainly stated fact is not a defect: *"A Thornweave scout saw it happen and has left for the guild quarter"* is the standard now — named, direct, consequential.)
4. **Would the player sometimes prefer this outcome over success?** (Failure/complication content.) The best complications make the player think *"oh no — oh, that's actually interesting."* If failure is just punishment, it isn't cool failure.
5. **Does this serve the three-beat loop?** Portfolio scan (Beat 1) / curated moments (Beat 2) / aftermath (Beat 3). Which beat does this content serve, and is it pulling its weight?

**The scene-first workflow is retired** (2026-08-25, with Doctrine v2 — and the authoring order was already game-design-first per the 2026-08-24 ruling): design the mechanics, roll the dice, then write the three-paragraph opening directly in narrator mode. Writing a scene and extracting fields from it is how in-situ prose got in.

## Player-as-god framing (hard rule)

The player is a god who observes through threads and intervenes indirectly. They never make choices for the character. Every encounter choice, intervention option, or player-facing decision must be a *god action* (whisper, send vision, steady, strengthen, withdraw), never a *mortal action* (say this, go there, fight). The mortal acts according to their personality and the god's influence. **"Let them handle it" is always a valid option.**

If a draft has the player choosing what the mortal does, it is wrong even if the prose is gorgeous. Reframe the choice as god intervention or reject it.

## Verification probes over the corpus (hard rules, 2026-08-14)

The THR-1101 rewrite campaign logged ~13 false-signal impediments in one week from sweep probes that looked right and measured the wrong thing (impediments #552, #559 ×2, #560 ×2, #563 ×2, #565, #568, #569, #571–#573, #575, #577). Before writing any corpus sweep or render probe:

- **Probe the converted corpus, never the authored shape.** Sweeps run over the exported `ENCOUNTER_TEMPLATES` (post-converter). The converter is a field *allowlist*: raw authored field names silently cover ~half the corpus and read as a clean pass (#552, #559, #565, #572). The converter also mirrors step prose onto `narrativeTemplates.*`, so per-string duplicate checks double-count (#573).
- **Pronoun tokens are actor-bound.** `{they}`/`{their}` always resolve to the *actor* — using one for any other subject renders the actor's pronoun for someone else (#563 ×2). `{es}` is not a token; there is no verb-agreement token to reach for (#569). Build `NarrativeContext.pronouns` from the real field names or `enrichProse` throws (#560).
- **A removal pass needs a baseline diff.** A pass whose purpose is removing a pattern can add new hits of it invisibly; run the same detector before and after and diff the *sets*, not the counts (#575). Prefer generic-rule detectors over hand-written allowlists — the allowlist reported zero and was wrong (#568).
- **CLI `aftermath pick` double-applies** any reaction that already auto-applied during `tick`, duplicating every effect kind — treat duplicate edges/seeds in a pick-driven run as tool-induced until proven otherwise (#553, #577).

## Active design plans

- [2026-03-09-prose-generator-framework-design.md](../plans/2026-03-09-prose-generator-framework-design.md) — the four-system pipeline architecture. Status: `current` (de-facto; pre-frontmatter convention).
- [2026-04-16-systemic-wiring-guide.md](../plans/2026-04-16-systemic-wiring-guide.md) — Capability 1 (enrichment placeholders + conditional blocks) is the prose-author chapter; the other capabilities define what prose must respect.
- [2026-04-19-rarity-prose-tier-bias.md](../plans/2026-04-19-rarity-prose-tier-bias.md) — rarity-tier bias in prose generation.
- [2026-04-24-thr-253-chain-weakens-prose-polish.md](../plans/2026-04-24-thr-253-chain-weakens-prose-polish.md) — chain-weakening prose polish.
- [2026-04-17-thr-132-mark-reveal-prose.md](../plans/2026-04-17-thr-132-mark-reveal-prose.md) — hidden-mark reveal prose.
- [2026-04-18-faction-encounter-prose-enrichment.md](../plans/2026-04-18-faction-encounter-prose-enrichment.md) — faction-encounter prose enrichment.
- [2026-05-05-canonical-documentation-strategy.md](../plans/2026-05-05-canonical-documentation-strategy.md) — the three-layer model (UL → Canon → Plans) this page is part of.

## Rejected approaches

- ❌ **Pure template-based prose** — replaced by the hybrid layered engine with enrichment placeholders. Static templates without `{placeholder}` syntax produce dead prose; the resolver pipeline exists to make every line graph-aware.
- ❌ **Pure LLM-generated prose at runtime** — replaced by generated-within-constraints with player iteration. Runtime LLM calls violate Determinism (NFP #3) and Tunability (NFP #1).
- ❌ **Hardcoded entity names in templates** — names always come from `{name}` / `{ally:strongest}` / `{rival:strongest}` / `{artifact:weapon}`. A template that bakes in "Kael" is broken.
- ❌ **Single-variant content** — minimum 3–5 variants per key in any content table to avoid repetition. Resolvers use `pickTemplate(templates, seed + offset)` for deterministic selection across variants.
- ❌ **Player chooses what the mortal does** — replaced by player-as-god framing (above). Drafts that put the player inside the character's head must be reframed.
- ❌ **`{actor}` placeholder in routine templates** — replaced by `{name}` (THR-86). All new routine templates use `{name}` for consistency.
- ❌ **The scene-then-fields workflow** — reversed twice over (2026-08-24 game-design-first ruling; 2026-08-25 Doctrine v2). Mechanics and dice first, then the opening written directly in narrator mode.
- ❌ **In-situ scene prose** — sensory immersion, camera work, facts encoded as physical evidence ("the sweepings pile against the chalk"). Retired 2026-08-25 (Doctrine v2): narrate like a game master, state facts directly.
- ❌ **Foreshadow-never-announce** — reversed 2026-08-25: stakes and situations are announced plainly ("Its freezing aura has already sent three guards to the infirmary"), not hidden in the scene's furniture.
- ❌ **The card flavor quote (`fiction`)** — retired 2026-08-25; a card's only prose is its spell-style effect description.

## Open questions

- **Prose exemplar** — *resolved (THR-609):* `Docs/exemplars.md` now carries inline baseline-register and peak-register prose exemplars showing the register contrast. A promoted *content-table* exemplar (e.g. a single high-quality `BIOME_PROSE` entry, an enrichment-aware vignette) is still welcome when one ships, but the standalone-prose row is no longer a placeholder.
- **Vault Systems freshness** — *resolved (THR-1252, 2026-08-25):* `Tonal Bible.md` carries a supersede banner on its tone samples (+ v2 replacement samples) and amended tone bullets; `Narrative Engine.md` and `Encounter System.md` carry supersede banners pointing here and at the encounters canon; the Cheat Sheet's prose style guide is deleted in favor of this page. The vault pages are historical context; this page and the spec are the live authority.
- **`success_at_cost` outcome wiring** — *resolved (recorded 2026-08-29, THR-1372):* the five-band ladder is fully live, `success_at_cost` included — the architecture doctrine (round 4, THR-1367) swept the last surfaces still teaching it as unbuilt. Author against it freely; the "partial (Phase 3)" caveat this row used to carry was itself the drift.
- **Routine prose `ShapedTemplate` coverage** — target is 5 shapes (`svo | aftermath | inverted | compound | fragment`) per event type. Current pool coverage is uneven; new templates should fill the gap.

## Last-reviewed

2026-08-29 (round-5 context-cleanup, THR-1372) by Claude Fable — resolved the `success_at_cost` open question (the ladder is fully live per the architecture doctrine; the "partial Phase 3" caveat was the drift). Previous: 2026-08-25 (third pass, THR-1251 sweep) by Claude Code — peak register narrowed to non-encounter surfaces (resolving the internal contradiction with § Narrator mode). Previous: 2026-08-25 by Claude Code (THR-1250 — recorded the registerCompliance calibration verdict: report-only, with a named re-open condition; exemplars demoted to wiring-only). Previous: 2026-08-25 by Claude Code (Prose Doctrine v2 — narrator mode replaces the plainness moves; in-situ prose, foreshadow-never-announce, scene-first workflow and the card flavor quote retired; authoritative text in the nudge authoring spec). Previous: 2026-08-15 by Claude Code (THR-974 ruling — added the three plainness moves to the register model). Previous: 2026-08-14 by Claude Code (weekly retro — added the corpus-verification-probe rules distilled from the THR-1101 campaign's false-signal cluster). Previous: 2026-08-01 by Claude Code (THR-899 — recorded the scoped vagueness model: evasive terms everywhere, natural indefinites in outcome prose only, intensifiers at warn; `nudgeAuditDetectors.ts` named the single authority). Previous edit: 2026-07-05 by Claude Code (THR-609 — added the register model section). Review trigger: monthly, or when any linked plan moves to `superseded`, or when the systemic wiring guide gains a new capability that prose authors must respect.
