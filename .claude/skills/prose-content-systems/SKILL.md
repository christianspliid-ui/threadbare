---
name: prose-content-systems
description: >
  Content tables, encounter templates, and existing systems you add prose to.
  The "add content here" skill. Covers narrative engine (sphere vocabulary,
  cultural prose), generic effect system (spell flavorText, backlash
  narrativeTemplate), encounter content packages (115 templates + 10 faction
  files), faction reputation system (prose impact), movement content
  (terrain/location taxes — prose relevance), and receipt-driven foreshadowing
  clause authoring (typed slots, agreement sweep). Also pointers to content-files-reference.md.
  Load for day-to-day content work: encounter templates, narrative event prose,
  faction-specific content, spell flavor text, content tables. Triggers on
  "encounter content", "encounter template", "faction encounter", "narrative
  content", "sphere vocabulary", "cultural prose", "spell flavor", "effect
  prose", "movement content", "content table", "write prose", "foreshadowing
  clause", "motive receipt".
model: opus
last_validated_against: 2026-07-27
---

> **Load before authoring:** `Docs/canon/rulebook-quick-reference.md` (always — the synthesis layer for rules of play). Load `Docs/canon/rulebook.md` (full rulebook) when the work touches a specific rule of play and you need depth, status flags, or source citations.

# Prose Content Systems — Content Authoring Reference

High-volume, day-to-day prose work: adding encounter templates, writing narrative event prose, authoring faction content, adding spell flavor text. Load `prose-pipeline` when you need to understand resolver architecture or implement a new resolver. Load `prose-vignettes-and-enrichment` for enrichment placeholders and vignettes.

---

## Step 0 — Canon-First Pre-Read

Before any other reference, read `Docs/canon/prose.md`. It is the live navigation layer for this domain — it lists the current spec pointers, rejected approaches, and active design plans. Linked targets are authoritative; this skill follows the Canon page's pointers, not parallel ones.

If the Canon page disagrees with this skill, the Canon page wins until this skill is rewritten. File a `drift-scan`-labeled Linear issue when you see disagreement.

---

## Content Quality Enforcement — READ FIRST

**Prerequisite 1:** Load the `state-of-game-design` router, then `reference/cosmology.md` (which contains Part 0: Game Design Direction) before authoring any content. Every template, prose line, and content table entry is a player experience, not a data record.

**Prerequisite 2:** Read `Docs/plans/2026-04-16-systemic-wiring-guide.md` — the systemic wiring guide. This document explains the seven engine capabilities (enrichment placeholders, encounter seeding, hidden marks, reputation flow, graph ops, intelligence, divine intervention) that should shape what you decide to write. If a narrative field contains no `{placeholder}` syntax, no conditional blocks, and the aftermath has no seeds or marks — ask whether you're writing game content or a book page. The guide includes a wiring checklist and worked example.

**Before authoring a batch of content, check for benchmark moments.** If the issue you're implementing has a design doc in `Docs/plans/`, read it and find the Section 9 benchmark moments. These are the quality bar — every template you author must meet or exceed the benchmark's emotional specificity, forward-hook quality, and prose texture. If no benchmarks exist, flag it as a gap before proceeding.

**Player-as-god framing constraint.** The player is a god who observes through threads and intervenes indirectly. They NEVER make choices for the character. When writing encounter choices, intervention options, or any player-facing decision point: the choices must be what the *god* does (whisper, send vision, steady, strengthen, withdraw), never what the *mortal* does (say this, go there, fight). The mortal acts according to their personality and the god's influence. "Let them handle it" must always be a valid option.

**Per-template quality check** — ask these questions for every piece of content you write:

1. **Does this create a human condition the player recognizes?** Not "trust_decay -0.02" but "exposed" or "indebted" or "unexpectedly grateful." If the prose describes a mechanical change without evoking a human experience, rewrite it.
2. **Does this make the player want to know what happens next?** Every prose line should open a question, create a tension, or imply a future consequence. "The negotiation failed" is a dead end. "The negotiation failed — and the merchant's apprentice heard every word" is a hook.
3. **Does this work as a *moment*, not just a label?** A complication prose that says "A rival noticed" is a label. "A figure at the edge of the market — one of the Thornweave scouts — paused mid-stride. Their eyes met. Then the scout turned and walked quickly toward the guild quarter" is a moment.
4. **Would the player sometimes prefer this outcome over success?** (For failure/complication content specifically.) The best complications make the player think "oh no — oh, that's actually interesting." If the failure content is just punishment, it's not cool failure.
5. **Does this serve the three-beat loop?** Content surfaces during portfolio scan (Beat 1), curated moments (Beat 2), or aftermath (Beat 3). Which beat does this content serve? Is it pulling its weight in that beat?

**When in doubt, write the scene first.** Before filling in template fields (ID, severity, effects, reach affinity), write the moment as a paragraph of prose. What is the protagonist doing? What goes wrong (or right)? What does the player read? What do they feel? Then extract the template fields from the scene. This is the reverse of the usual workflow — and it produces dramatically better content.

**Register (plainspoken Malazan, THR-609): write baseline unless the surface is a designated peak.** Plainness is the default and the large majority of what you author. **baseline** — plain, concrete, one idea per sentence, dry wit over ornament; no archaic diction, no stacked metaphor, no word that sends the reader to a dictionary. **character** — dialogue only; wit over ornament. **peak** — rationed lyricism, only on doom transitions, Twilight, encounter climax steps, major aftermath, World-Soul prose. **Interactive text (labels, action-card names, IPK keywords, tooltips) is always plain.** Declare a non-default register with the additive `register?: 'baseline' | 'character' | 'peak'` field (absent → baseline). Canon: [`Docs/canon/prose.md` § the register model](../../../Docs/canon/prose.md). Deterministic floor: `registerCompliance` in `window.__DEBUG.proseQualityReport()` — measures sentence length, rare-word density, figurative density, label plainness.

## Content Tables Reference

All prose content lives in `src/data/`. Read **`content-files-reference.md`** (in this skill directory) for the complete file → key tables → system map when you need to locate a specific content table or verify what exists before adding new content.

---

## System 2: Narrative Engine (Event Prose)

**Files:** `src/engine/narrative.ts`, `src/engine/culturalProse.ts`
**Content:** `src/data/narrative-content.ts`, `src/data/culture-content.ts`
**Types:** `src/types/narrative.ts`

### Three-Tier Model

| Tier | Name | When | Source |
|------|------|------|--------|
| 1 | Routine | Common events | Template-stitched from `ROUTINE_TEMPLATES` |
| 2 | Notable | Significant events | Enhanced templates with conditional clauses from `NOTABLE_TEMPLATES` |
| 3 | Chronicle | Major events | Structured prompts for LLM generation (future) |

### Sphere Vocabulary

Each of the **Nine Spheres** provides vocabulary flavoring via `SPHERE_VOCABULARY`:
- **Verbs, adjectives, nouns** per sphere
- Used by `pickSphereWord()` to flavor event descriptions
- Cultural prose palettes can override (30% substitution chance via `culturalProse.ts`)

### Cultural Prose Integration

`src/engine/culturalProse.ts` extracts vocabulary from a culture's prose palette:
- Palette selection: **foundation bias → primary venerated sphere → default fallback**
- `getCulturalFlavorWords()` returns `{ verbs, adjectives, nouns?, phrases? }`
- `pickCulturalWord()` substitutes with 30% probability per word slot

Content palettes live in `src/data/culture-content.ts` → `CULTURAL_PROSE_PALETTES` (keyed by sphere/foundation).

### Value Flavors

`VALUE_FLAVORS` in `narrative-content.ts` maps axiological value pairs to narrative tone:
- Each value pair gets `{ positive, negative }` flavor strings
- Used to color event prose based on the agent's axiological alignment

---

## System 7: Generic Effect System (Prose-Relevant)

**Types:** `src/types/effects.ts`
**Content:** `src/data/effect-constants.ts`, `src/data/spell-templates.ts`, `src/data/reward-attachment-catalog.ts`
**Design doc:** `Docs/plans/2026-03-31-generic-effect-system-design.md`

### Why Effects Matter for Prose

The generic effect system introduces **29 composable effect primitives** on attachments (items, blessings, curses, spells). These are prose-relevant because:

1. **Spell templates have `flavorText` and `mechanicalSummary`** — displayed in UI
2. **Backlash effects have `narrativeTemplate`** — with `{actor}` placeholder for prose injection
3. **Attachments in `reward-attachment-catalog.ts`** carry names, descriptions, and effect arrays
4. **Effect conditions** (`in_combat`, `health_low`, `near_water`, `biome:*`, `has_trait:*`) can trigger narrative variation

### Spell Template Structure (Prose Fields)

```typescript
interface SpellTemplate {
  id: string;
  name: string;
  flavorText: string;           // Narrative description
  mechanicalSummary: string;     // Player-facing mechanical explanation
  backlash?: {
    narrativeTemplate: string;   // e.g. "The veil tears — {actor} stumbles..."
    // ...
  };
}
```

### Effect Tiers for Content Authors

| Tier | Types | Scope | Content Examples |
|------|-------|-------|-----------------|
| 1 (Gear) | 1–14 | Mundane-to-mythic items | Stat boosts, resistances, resource bonuses |
| 2 (Spell) | 15–23 | Rule benders | Teleport, scry, spawn, compel — each needs flavor text |
| 3 (God-tier) | 24–29 | World-reshaping | Transform biome, create structure, override rules |

### Existing Spell Templates (5 worked examples)

Located in `src/data/spell-templates.ts`:
- **Veilwalk** (T2): Teleport 3 hexes + shadow bonus
- **Soulfire** (T3): Swap iron→star for combat + stacking
- Plus 3 more — check the file for current list

---

## Encounter Runtime Contract (Phase 2)

**North star doc:** `Docs/plans/2026-04-02-encounter-redesign-guidelines.md`
**Resolution service:** `src/engine/resolutionService.ts`
**Quintessence hooks:** `src/engine/quintessenceActions.ts`

When authoring or revising encounter content, these are the runtime rules your content will resolve against.

### Difficulty normalization

All resolution uses normalized difficulty in `0..1`. Legacy encounter step difficulty (integer-like: 12, 25, 30) is divided by 100 at the caller boundary via `normalizeLegacyDifficulty()`. When authoring new unified action templates, use `0..1` directly.

### Outcome ladder

Every step resolves to one of: `critical_success | success | success_at_cost | failure | critical_failure`. Doubles under threshold = crit success; doubles over = crit failure. Crit frequency scales with actor competence — skilled actors rarely crit-fail, unskilled actors rarely crit-succeed.

`success_at_cost` exists in the contract but is not yet fully wired (Phase 3). Author content with it in mind.

### Step success bands (target)

| Band | Intended step success | Author guidance |
|------|----------------------|-----------------|
| `trivial` | 85–95% | Bread-and-butter, confidence-building |
| `easy` | 75–85% | Hero feels capable |
| `moderate` | 60–75% | Meaningful risk |
| `hard` | 40–60% | Tense, costly |
| `deadly` | 25–45% | Serious danger |
| `epic` | 10–25% before resources | Late-game / ascension |

### Quintessence pressure per band

Encounter failure erodes quintessence via `pendingQuintessenceEvents`. Current constant: `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION = 0.03`. Target magnitudes from the guidelines (on a `0–1` scale):

| Band | Typical spend | Failure hit | Success recovery |
|------|--------------|-------------|-----------------|
| `trivial` | 0.005–0.010 | 0–0.010 | 0–0.010 |
| `easy` | 0.010–0.020 | 0.010–0.020 | 0.005–0.015 |
| `moderate` | 0.020–0.040 | 0.020–0.050 | 0.010–0.030 |
| `hard` | 0.040–0.080 | 0.050–0.100 | 0.020–0.050 |
| `deadly` | 0.080–0.150 | 0.100–0.200 | 0.030–0.080 |
| `epic` | 0.150–0.250 | 0.200–0.350 | 0.050–0.120 |

These are Phase 5 tuning targets — current runtime uses one flat erosion constant. But author new content with these bands in mind.

### Fail-forward defaults

When authoring unified action templates:
- Step 1: `continue_weakened` (not `fail_action`)
- Step 2: `continue_weakened` unless fiction truly collapses
- Final step: `fail_action` only when the action cannot proceed

Current catalog ratio is 10 `continue_weakened` : 74 `fail_action` — Phase 5 will migrate, but new content should follow the target ratio now.

---

## System 8: Encounter Content Packages

**Main:** `src/data/encounter-content.ts` (115 templates, 408KB)
**Faction-specific:** 10 files in `src/data/` named `{faction-name}-encounter-content.ts`
**Type-specific:** `social-`, `faction-`, `army-`, `monster-`, `mercenary-`, `borderland-`, `siege-`, `anomaly-`, `battle-spotlight-encounter-content.ts`

> **Encounters are nudge-native as of 2026-07-27 (THR-772/774).** If you are writing or
> rewriting a whole encounter — not just touching a prose field on an existing one — the
> authoring contract is
> [`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`](../encounter-pipeline/reference/nudge-authoring-spec.md),
> and the pipeline skills (`encounter-pipeline`, `template-encounter-rewrite`) are the
> right entrypoints. **This skill covers the prose fields; it does not cover the hand.**
>
> The two rules most likely to bite a prose-only pass:
> 1. **Nudge payoffs live in `bandProse` fragments, never in the step's base text.** The
>    base band text must read correctly with *any* subset of the hand active — including
>    none. Editing a `narrativeTemplate` to mention a card breaks that.
> 2. **No percentages, no digits, on any mortal-facing field.** Odds are words: the five
>    forecast tier words and `severe / steep / fair / gentle`.

### Template Structure

Each encounter template has:
- **Steps** (2-4) with escalating difficulty and narrative
- **A nudge hand** per nudge-bearing step (4–8 cards; see the spec above)
- **Location specificity** (location-specific: 3 steps, universal: 2 steps, reach-agnostic: 2 steps)
- **Difficulty tiers**: early (0.8×), mid (1.0×), late (1.3×)
- **Tone adjectives** per difficulty tier

### Faction-Specific Content

10 faction content files provide faction-gated encounters:
- `arcane-circle-encounter-content.ts`
- `builders-fellowship-encounter-content.ts`
- `civic-guard-encounter-content.ts`
- `holy-order-dawn-encounter-content.ts`
- `lorekeepers-covenant-encounter-content.ts`
- `merchant-consortium-encounter-content.ts`
- `rangers-brotherhood-encounter-content.ts`
- `temple-of-spheres-encounter-content.ts`
- `thieves-guild-encounter-content.ts`
- `underking-court-encounter-content.ts`

These encounters require faction membership and scale with reputation rank.

---

## System 9: Faction Reputation System (Prose Impact)

**Files:** `src/engine/factionReputation.ts`
**Content:** `src/data/faction-definitions.ts`, `src/data/faction-encounter-content.ts`

### How Reputation Affects Prose

- `factionResolver` reads `controlled_by` edges to describe faction presence at locations
- `agentFactionResolver` reads `member_of` edges with reputation/rank properties
- Faction rank affects encounter eligibility (higher ranks unlock more content)
- `FACTION_CONTROL_PROSE` in `prose-layer-content.ts` provides faction-presence flavor

### Reputation Constants (from `agent-behavior-constants.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `FACTION_NETWORK_AWARENESS` | true | Enable faction intel sharing |
| `FACTION_NETWORK_MAX_ENTRIES` | 20 | Max shared encounters |
| `FACTION_SECONDARY_THRESHOLD` | 0.3 | Secondary faction interest threshold |
| `FACTION_MIN_RANK_FOR_INTEL` | 0.05 | Minimum rank for intel access |
| `FACTION_DEFAULT_RANK` | 0.1 | Starting reputation for new members |

---

## System 10: Movement Content

**Files:** `src/data/movement-content.ts`

### Prose Relevance

Movement taxes influence where agents go, which determines what encounters they face and what prose is generated for their descriptions. Key constants:

| Constant | Value | Purpose |
|----------|-------|---------|
| `TERRAIN_TAXES` | 27 entries | Per-terrain traversal cost |
| `LOCATION_ENTRY_TAXES` | 23 entries | Per-location-subtype entry cost |
| `BASE_EDGE_TRAVERSAL_COST` | 1 | Default edge cost |
| `DISTANCE_DECAY_FACTOR` | 0.15 | Score decay per hex of distance |
| `ROAD_MAJOR_COST_MULTIPLIER` | 0.4 | Major road discount |
| `ROAD_TRAIL_COST_MULTIPLIER` | 0.7 | Trail discount |

---

## System 11: Receipt-Driven Foreshadowing Clauses (THR-631)

**Files:** `src/data/foreshadowing-content.ts` (clause tables) · `src/engine/foreshadowing/` (composer, realizer)

Foreshadowing is the 2–4 sentences the player reads about an encounter an agent is *moving toward* — written from inside the agent's head, before anything has happened. Two paths produce it:

- **Authored variants** — per-encounter, hand-written. Use when a specific encounter's fiction matters. See Capability 10 in the systemic wiring guide.
- **Receipt-driven clauses** — systemic, composed from the **Motive Receipt** (the real decision causality the scorer computed). This is the long tail, and it is where most of your clause-authoring effort goes.

You are not writing whole passages here. **You are writing interchangeable clauses that the composer assembles**, so every clause must stand alone and read correctly beside any other.

### The four sentence slots

| Sentence | Table | Keyed on |
|---|---|---|
| S1 knowledge | `KNOWLEDGE_CLAUSES` | Real intel tier (`unknown` / `rumor` / `briefed` / `expert`) |
| S2 pull | `MOTIVE_CLAUSES_BY_REACH` → `MOTIVE_CLAUSES` | Top contribution kind, optionally Reach-flavoured |
| S3 expectation | `EXPECTATION_BY_FORECAST` (+ `LOW_INTEL_HEDGE_TAILS`) | Forecast tier; hedge tail attaches below `briefed` |
| S4 stake *(optional)* | `STAKE_CLAUSES` → `DEFAULT_STAKE_CLAUSES` | Second contribution kind, only if weight ≥ 0.20 |

S2 alone is the tooltip. Write it so it works as a **single standalone sentence** — it is the one the player sees most.

### Typed slots — never write a bare pronoun or verb

Clause templates go through `realizer.ts`. Use the slots; they exist because two specific bugs shipped before:

| Slot | Fills with |
|---|---|
| `{name}` | Agent's first name |
| `{subject}` / `{Subject}` | `he` / `she` / `they` — **subject case only** |
| `{object}` / `{Object}` | `him` / `her` / `them` — **object case** |
| `{place}` | A location name. Never an encounter title. |
| `{matter}` | The thing at stake ("what stirs at Ashmarket") |
| `{v:lemma}` | Verb, conjugated to the subject's number |

```typescript
// ✅ correct
'{Subject} {v:believe} the road ends somewhere worth standing.'
'Something about it {v:move} {object} closer than caution allows.'

// ❌ agreement bug — renders "They believes"
'{Subject} believes the road ends somewhere worth standing.'

// ❌ case bug — renders "moves they closer"
'Something about it moves {subject} closer than caution allows.'

// ❌ category error — {place} is never an encounter title
'{name} has heard of trouble in {place}.'   // ...when {place} got a title
```

### Two tests police this — write to them, not around them

Both live in `composeReceipt.test.ts` and sweep every clause pool:

1. **Agreement sweep** — renders every clause against he/she/they and fails on `"They believes"` *or* `"He believe"`. It derives verb forms from the real `conjugate()`, so a clause using a new verb needs **no test edit** — but a clause with a bare verb fails the suite.
2. **Object-case lint** — statically flags a `{subject}` slot sitting after a copula, transitive verb, or object preposition.

Each clause must also **end in terminal punctuation** and leave **no unresolved `{}`**.

> **If you add a new clause pool, add it to the sweep arrays in `composeReceipt.test.ts`.** A pool that isn't in `RECEIPT_CLAUSES` ships unchecked — that is the one way to reintroduce both bugs.

### Authoring rules specific to this system

- **Never name the encounter.** The agent is projecting, not reading a quest title. The composer deliberately never surfaces the encounter heading.
- **Match the epistemic state.** An `unknown` S1 must feel like hearsay; an `expert` S1 must feel earned. S3 below `briefed` gets a hedge tail — don't also hedge inside the clause, or it double-hedges.
- **Write the kind, not the number.** S2 is keyed on a contribution *kind* (`ambition`, `bond`, `mark`, `divine`…), never a weight. "Because it serves the thing they've been building" — not "because ambition scored 0.4."
- **Keep clauses tense-consistent** (present) and **person-consistent** (third). The composer joins them with a single space; a mismatch reads as a seam.
- **Reach flavour is optional.** `MOTIVE_CLAUSES_BY_REACH` covers the top-4 kinds; anything unflavoured falls back to the base kind pool, then `personality`. Add Reach variants only where the Reach genuinely changes the texture.

### Verifying your clauses

```javascript
window.__DEBUG.getMotiveReceipt('Serafina')          // the live receipt
window.__DEBUG.getForeshadowing('Serafina')          // the rendered passage
```

The `foreshadowing` trace carries `compositionKeys` (which pools fired, e.g. `pull:ambition/iron`, `stake:bond`) and the consumed `receipt` — use it to confirm your clause actually surfaced rather than a fallback.
