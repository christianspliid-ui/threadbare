---
tags: [vision, taste, aesthetic]
aliases: [Taste Profile, Design Taste, Aesthetic Voice]
status: draft
created: 2026-04-23
updated: 2026-08-29
---
<!-- frontmatter `updated` was stuck at 2026-05-07 while the body carried amendments through 2026-08-25 (THR-868, THR-1247, prose-doctrine v2) — corrected at THR-1335; keep this date honest when amending the body. -->


# Taste Profile

> The persistent aesthetic voice of Threadbearer. What the project considers
> beautiful, correct, and rejected. Loaded at the start of every design pass
> alongside the rest of `Vision/`. Canonical source of the project's taste —
> memory entries are session-scoped scratch; this page is durable.
>
> Seeded 2026-04-23 from accumulated memory entries and load-bearing
> architectural decisions. Expect revisions as design passes confirm,
> hypothesise, or reject aesthetic instincts.

## How to use this page

Three layers. Each entry has a concrete example and a source reference.

- **Strong opinions** — confirmed across two or more design passes (or one
  pass plus explicit user confirmation). Load-bearing. Contradicting one
  triggers a Vision audit.
- **Soft patterns** — hypotheses. Working defaults until stress-tested. Can
  promote to strong opinions on re-confirmation or fall to anti-patterns on
  failure.
- **Anti-patterns** — formally rejected, with rejection reason recorded. Do
  not silently reintroduce.

**Updating:** see `.claude/skills/game-design-direction/SKILL.md` § The Taste Profile
for the update protocol. In short: update in the same pass as the design that
triggered the entry; do not retrofit.

---

## Strong opinions

### Prose-first UI — no numbers visible to the player

Mechanics are communicated as sentences, never as numeric values. Labels use
prose bands ("a quiet certainty"), never percentages or bars with numbers.
IPK (in-prose keywords) are the player's learning engine — they discover
mechanics by reading, not by reading a tooltip with a stat block.

- **Example:** attachment tooltips never show `+3 resolve`; they say *"her
  resolve holds through the third watch without fraying."*
- **Source:** memory `feedback_prose_first_ui.md`; `threadbearer-design`
  essentials; repeated across encounter/attachment pipelines.

### Narrative over mechanical perfection

When mechanics and story diverge, lean toward the story. NFP #5. The game's
value proposition is the fiction it produces, not the simulation's numeric
rigour. Mechanical neatness that flattens narrative is a regression, not an
improvement.

- **Example:** if a rule would force two agents into a visibly fake
  interaction to preserve symmetry, break the rule. Log the asymmetry.
- **Source:** `CLAUDE.md` NFP #5; memory `feedback_narrative_tiebreaker.md`;
  invoked across multiple plans.

### Player is a god, never a protagonist

Interventions are divine acts — today, essence-priced nudge cards played into
a mortal's attended moments. The player never directly controls a mortal:
cards bend the odds, fate rolls the outcome, and forks are decided by the
mortal. Mortal sovereignty is the source of the game's texture; collapsing it
into character control destroys the distinction. *(Wording updated 2026-08-28,
THR-1342 — this entry previously named the fixed "nudge, whisper, vision" verb
trio as current, which the entry "Encounter-specific intervention verbs" below
records as retired 2026-05-04; the premise itself is unchanged.)*

- **Example:** the player cannot choose a mortal's dialogue. They can play a
  card that plants a doubt; the mortal may or may not act on it, and fate
  picks the band.
- **Source:** memory `feedback_god_not_protagonist.md`; `Vision/02-non-negotiables.md`;
  core loop memory.

### Real time, halting for every moment (the Stellaris model)

Time runs between moments and stops for every one that asks for you. Reading
never leaks time; a paused god stays paused after a moment closes.

- **Example:** an encounter, a choice or the Chapter Ledger halts the clock;
  closing it restores whatever state the clock was in before.
- **Source:** Christian's ruling 2026-09-27 (onboarding design session),
  superseding "Turn-based, not auto-advancing" (settled 2026-04-16), which
  described a single-step game the code never was.

### Always dark, one gold emphasis per panel

The UI is `--bg-abyss` (#0a0a0e) to `--bg-raised` (#222228). Never a light
background. One gold emphasis per panel — `--accent-gold` (#d4a040) means
*important*, not *pretty*. Gold is attention currency; spending it often
spends it to nothing.

- **Example:** a panel with three gold accents is a bug. Pick one.
- **Source:** `threadbearer-design` essentials; design system v1.

### Austere, Malazan-adjacent voice

Sentence-case body prose. ALL CAPS letter-spaced section labels. Title Case
for names. No emoji in the UI. No decorative flourishes. The prose does
the emotional work; ornamentation competes with it.

- **Example:** a section header reads `THE FIRST`, not `🌑 The First ✨`.
- **Source:** `threadbearer-design`; memory `feedback_prose_quality_bar.md`
  (meeting-encounter prose is the quality bar).

### Meeting-encounter prose is the quality bar — plain register, not lyrical

All narrative content — vignettes, dilemmas, aftermath — is evaluated
against the meeting-encounter prose as the reference quality. Content that
falls below that bar is editorial-pass work, not ship-ready.

**Updated 2026-07-30 (THR-868 WS6).** The bar still points at the meeting
prose, but the meeting prose itself moved. Christian's verdict: the game's
prose was *too lyrical* game-wide, and the register is now **simple and
descriptive of events, people, and motivations**. The old meeting text was
the exemplar of the register being retired, so citing "the meeting prose" as
the bar without this note now points at the wrong thing.

- **Reconciled 2026-08-29 (THR-1324 guidance audit):** Prose Doctrine v2
  (Christian, 2026-08-25) retired the **picturable-anchor** rule by name, and
  this entry was still mandating it to every design pass — the THR-1247 audit
  amended the verbs entry below on the same day and walked past this one. The
  bar itself is unchanged: meeting-encounter prose, plain register. What moved
  is *how* you hit it. The failure was never vocabulary, it was **mode** — the
  border-perils read named it: *"you are still writing in situ instead of just
  describing."* Authority: `Docs/canon/prose.md` § Narrator mode.

What the bar means concretely:

- **Narrate, never inhabit.** Write as a game master reading a module aloud —
  a narrator reporting from outside the scene. No interior sensation, no
  camera work, no atmosphere without a job.
- **State facts, never encode them.** If the fact is "no one dares approach
  it," write that sentence — not the physical evidence a reader must decode.
  *(This replaces the retired picturable-anchor rule, which read: "Every
  sentence carries a picturable anchor. If the reader cannot see it, rewrite
  it." It trained the encoding habit — evidence in place of the fact.)*
- **Tell.** *Show-don't-tell* and *foreshadow-never-announce* are both
  explicitly **reversed** under v2: announce the stake plainly.
- Abstractions may be **staked but must be cashed in-sentence** — name what
  the abstraction looks like here.
- **No closing abstraction.** Ending a paragraph on the meaning of the scene
  is the tell.
- The **vagueness lexicon is scoped, not flat** (THR-899, 2026-08-01 — this
  bullet previously cited a flat `AUDIT_VAGUENESS_TERMS` catching `someone`,
  `very` and `deeply` everywhere, which is the version that failed
  Christian's canonical example of *correct* prose): **evasive** terms
  (`something`, hedges) target zero in every field class; **natural
  indefinites** (`someone`, `somewhere`, `thing`) are policed in outcome
  prose only; **intensifiers** are a warning, nowhere enforced. Single
  authority: `src/data/content-eval/nudgeAuditDetectors.ts`.

- **Example (retired):** "Something inside them settles into place like a
  stone dropped into still water." · "…a loneliness that no amount of being
  right can cure."
- **Example (current):** "She has given the village three predictions and
  two have already come true. The third was about the harvest, and since
  then no one has asked her to dinner."
- **Enforcement:** `src/data/__tests__/meetingProseRegister.test.ts` scores
  the whole meeting corpus with the real scorer and carries negative
  controls, so the bar is executable rather than remembered.
- **Source:** Christian, chat 2026-07-30; memory
  `feedback_prose_register_game_wide.md`;
  `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`
  § Prose rubric; `Docs/canon/encounters.md` § Rejected approaches.

### Graph edges, not property-bag relationships

Meaningful relationships are graph edges, never string ID fields inside
property bags. This is mechanical *and* aesthetic: the game reads the world
by traversing it, and content written against edges stays honest to the
simulation.

- **Example:** "commands" between two agents is an edge type, not a
  `"commander": "agent-id"` field.
- **Source:** `CLAUDE.md` load-bearing architectural decisions; memory
  `feedback_graph_edges_not_properties.md`.

### Encounter-specific intervention verbs

Verbs are encounter-specific, anchored in the cosmological pattern of reach + sphere + moral axis. The hypothesis that there are three fixed verbs (nudge / whisper / vision) was retired 2026-05-04 — encounter authors write per-scene god-verbs underpinned by the 8 reaches.

- **Example:** `Stir her resolve` and `Speak when not asked` can both map to structural metadata without sharing a fixed global verb taxonomy.
- **Source:** `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §10.4.
- **Reconciled 2026-08-25 (THR-1247 vision audit):** the THR-883 communication pivot (locked 2026-07-30) moved card *faces* to a generic, library-wide vocabulary — prose does the scene, cards do the rules — and the dealt-hand design extends that. What survives of this entry: the **scene prose** stays encounter-specific (openings, spine, band prose, and the 0–2 authored *specials* per encounter), and there is still no fixed three-verb taxonomy — the 21-type card library is open-ended and data-driven. What is superseded: "encounter authors write per-scene god-verbs" as a rule about *card text*. The taste — bespoke, scene-anchored expression of divine influence — now lives in the prose layer, not the card faces.

---

## Soft patterns

### Marketing copy sparks imagination through concrete scenes

Public-facing copy (store page, trailer text, web) uses scenes and sensory
detail, not mechanics explanation. Manual-style prose stays in docs. The
marketing surface's job is to make the reader *see* a moment, not understand
the system that produced it.

- **Example:** "A fisher sets down her lantern and listens." ✓ / "A
  systemic RPG with faction simulation." ✗
- **Status:** soft — applied once in a deliberate pass. Promote on next
  confirmation.
- **Source:** memory `feedback_marketing_copy_voice.md`.

### Elder magic — cosmology discovered, not selected

Foundation spheres are *elder magic* in-game. Players do not pick them at
character creation; they discover them through ruins, texts, and encounters.
The asymmetry between the engine's schema and the player's knowledge is
itself a texture source.

- **Example:** a sphere's name appears in prose before the player can
  invoke it intentionally.
- **Status:** soft — established in direction but implementation is still
  maturing.
- **Source:** memory `project_elder_magic.md`.

### Cinzel + Alegreya Sans typography

Display, names, and labels in Cinzel. Body and prose in Alegreya Sans.
16px minimum. Felt right across early UI; not yet stress-tested across
long-form prose contexts.

- **Status:** soft — may flip to strong on confirmation across more
  surfaces, or revise if long-form reading surfaces an issue.
- **Source:** `threadbearer-design` essentials.

### Motion — 150/200/400ms, ease-out in, ease-in out

No spring. No bounce. Motion communicates transition, not personality.
Established in the design system but not yet stress-tested across motion
signifiers on the map.

- **Status:** soft. Validate on hex-map overlay motion and encounter
  transition animations.
- **Source:** `threadbearer-design` essentials.

### IPK (in-prose keywords) as the teaching surface

Mechanics are taught by highlighting words inside prose, not by separate
tutorials. The keyword *is* both the word and the tooltip; hovering reveals
the mechanical meaning of the narrative word.

- **Status:** soft — design direction is set but coverage is partial.
- **Source:** memory `feedback_prose_first_ui.md`; frontend-ui work.

---

## Anti-patterns

### Classical stats (STR/DEX/INT)

Replaced by Domain Capability across Eight Reaches. Classical stats force
agents into legible archetypes (fighter/rogue/mage) that collapse the
narrative dimension we are building toward.

- **Rejected because:** the game is about *what someone can do*, not *what
  class they are*.
- **Source:** `CLAUDE.md` Rejected Approaches.

### Pure LLM-generated content

Replaced by generated-within-constraints with player iteration. Pure-LLM
content fails the quality bar: it drifts in voice, invents node types, and
cannot honour the graph's constraints.

- **Rejected because:** voice coherence and systemic honesty both fail.
- **Source:** `CLAUDE.md` Rejected Approaches.

### Pure template-based prose

Replaced by the hybrid layered engine. Pure templates produce visibly
identical output and cannot inflect to context.

- **Rejected because:** voice flattens across instances.
- **Source:** `CLAUDE.md` Rejected Approaches.

### AgentWheel / fixed action count

Replaced by ActionDrawer with context-filtered cards via Generalized Action
Targeting. The wheel imposed a cap that the action vocabulary always
exceeded; capping the UI capped the game.

- **Rejected because:** the open-ended, data-driven template pool must be
  filterable per-target, not cardinality-limited.
- **Source:** `CLAUDE.md` Rejected Approaches.

### Choose-your-own-adventure framing

Direct character-control framing collides with god-not-protagonist. The
player's choices are divine interventions, not character choices.

- **Rejected because:** collapses mortal sovereignty and removes the core
  tension the game is built on.
- **Source:** memory `feedback_god_not_protagonist.md`; `Vision/02-non-negotiables.md`.

### Time that runs while you read

Real time is right (Stellaris model, 2026-09-27); real time that keeps
running while an encounter, a choice or the ledger is open is not.

- **Rejected because:** reading while the clock runs turns gravity into
  clock anxiety, and attention stops being yours to spend.
- **Source:** Christian's ruling 2026-09-27, narrowing the earlier rejection
  of all auto-advancing time (memory `project_turn_based.md`).

### Manual-style explanatory marketing copy

Described above under the positive pattern. Manual prose in marketing
surfaces flattens the imagination the work does elsewhere.

- **Rejected because:** marketing's job is a scene, not a schema.
- **Source:** memory `feedback_marketing_copy_voice.md`.

### Numbers in UI

Percentages, bars with labels, stat blocks. All forbidden in player-visible
surfaces. Developers see numbers in the debug panel; players see prose.

- **Rejected because:** numbers collapse the voice and short-circuit the
  prose-first learning loop.
- **Source:** prose-first-UI strong opinion; design system.

### Emojis, springs, bounces in UI

Emojis in UI content. Spring physics in motion. Bouncy easing curves. All
incompatible with the austere voice.

- **Rejected because:** ornamentation competes with the prose.
- **Source:** `threadbearer-design` essentials.

### Inventing node types without verification

If a conversation references a node type that does not exist in the graph
schema, stop and ask before creating it. A new node type requires full
design before code — category, properties, edges, tick participation,
traces.

- **Rejected because:** silently minted node types fragment the graph and
  defeat the audit trail.
- **Source:** `CLAUDE.md` Load-Bearing Architectural Decisions.

### Relational-table thinking

Everything is a graph node/edge. No separate relational tables, no
join-style lookups in game logic.

- **Rejected because:** relational thinking produces property-bag
  relationships (see strong opinion) and fragments the world model.
- **Source:** `CLAUDE.md` Load-Bearing Architectural Decisions.

---

## Archive

*No archived entries yet. When a taste entry has gone a year without
invocation and isn't referenced by any current design, move it here with
the date it was archived. Archived entries remain readable but are not
loaded by default.*



*last iterated 2026-08-28 — the "Player is a god" entry updated off the retired nudge/whisper/vision verb trio (which line 161 already recorded as retired — the file contradicted itself); this dated signature added per the README mandate. THR-1342, context-cleanup round 2.*
