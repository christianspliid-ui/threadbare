# Ubiquitous Language — Traits

Content-adjacent shard. Terms covering the trait layer: definitions and assignments, the twelve category contracts, how an authored ref resolves to a definition, and the hooks content authors write against — plus the parallel **attachment** layer that shares its borne-by-a-bearer shape: the Attachment umbrella, the Effect substrate, and the Power family (spell, bestowal, innate power) seated here at THR-1238 because two of the three power variants collide by name with a trait category (`bestowed`, `innate`) and are best read beside the categories they are not.

---

### Trait

**Aliases:** Trait Definition, Mark
**Also see:** `[[Trait Assignment]]`, `[[Trait Category]]`, `[[Trait Ref]]`, `[[Trait Hook]]`, `[[Node]]`
**Status:** canonical

A named piece of identity carried by an object — who a mortal is, what a company has become, the character of a place. Definitions are graph nodes (`type: 'trait'`, properties typed `TraitDefinitionProperties` in `src/types/traits.ts`); a bearer holds one through a `has_trait` edge, never a property field. Sixty-four definitions ship statically across the trait content files; more are minted at runtime (cultural/innate formative traits at worldgen, bestowed traits at tier promotion and reward grants).

A trait is **inert on its bearer**. It carries no behavior of its own — every effect lives in the system that references it. Reading a trait is the connection; the trait itself is only a name the world can recognize. This is the load-bearing separation that lets any system adopt traits at a seam it already owns, with no central rules engine.

The player-facing word for a trait is the trait's own display name, never the category or the id. Trait **levels are never surfaced as numerals** — words only, per the game's legibility law.

**Also a content kind.** Since THR-1520 (2026-09-22) the five mortal-trait content files are the `trait_template` kind of the content-object registry (game word *Trait*, becomes the world object `trait`), so a trait is a thing an author may write into a catalog, gated by `check:attachment`, and findable by kind and tag (`{ kind: 'trait_template', tags: ['#mastery'] }`). Conditions and scars stay the Condition kind even where they share a file. A **bearer-trait term** on a content query (`requiresBearerTrait`, a `[[TraitPredicate]]`) says only a bearer holding the trait may be dealt the content; it is judged at the call site through the one trait gate, never by the resolver.

---

### Trait Assignment

**Aliases:** has_trait Edge, Trait Edge
**Also see:** `[[Trait]]`, `[[Trait Visibility]]`, `[[Edge]]`, `[[Trait Category]]`
**Status:** canonical

The `has_trait` edge binding a bearer to a trait definition. Edge properties (`TraitAssignmentProperties`) carry `level`, `acquiredTick`, `lastReinforcedTick`, `source` (what caused acquisition), `visibility`, an optional `ticksRemaining` countdown, and optional `modifiers`. The definition is shared; the assignment is per-bearer, which is why level, expiry, and provenance live on the edge and not on the node.

Legal bearers are fixed by the edge schema: `actor` (individual, group, faction, culture, god, ascendant), `location`, `sublocation`, and — since THR-1521 (2026-09-22) — `artifact` and `artifact_legendary` (see `[[Artifact Trait]]`; a holding face is type-legal but refused by the one writer, because a freehold is bookkeeping, not a thing). Reified relationships are named as bearers by the design but are not yet schema-legal — they arrive with their own wave as an additive `sourceNodeType` extension.

`ticksRemaining` is the live countdown the condition decay phase decrements; absent means the assignment never expires. It is distinct from the authored `durationTicks` provenance value, which is kept but never decremented.

---

### Location Trait

**Aliases:** Place Trait, Location Condition
**Also see:** `[[Trait]]`, `[[Trait Assignment]]`, `[[Trait Category]]`, `[[Location]]`
**Status:** canonical

A `condition`-category `[[Trait]]` whose bearer is a place — a `has_trait` edge from a place-tier `[[Location]]` to a definition under the id prefix `trait.condition.location.*`. The prefix is the declaration: a definition under it is a place's, everything else is a person's (`LOCATION_CONDITION_ID_PREFIX`, `src/data/condition-trait-content.ts`). No new category, no new field.

Two ways a place comes to carry one. **Planted**: an encounter aftermath writes it with a term (`apply_condition` with `targetLocationId` / `$here`) — *Closed for the Season*, *Festival*, *Plague Scare*, *Under Watch*, *Blighted Harvest*, *A Tended Shrine* — and `ticksRemaining` counts it down. **Minted** (THR-790): `phaseLocationTraits` reads the world's own scalars every tick and, when one has held past its threshold for `LOCATION_TRAIT_SUSTAIN_TICKS`, writes the edge with no term — *Welcoming* (prosperity), *Lawless* (unrest), *Veil-thin* (magical saturation), *Haunted* (saturation and the dead) — and removes it when the reading falls below release. A minted location trait has a cause, not a duration.

What reads it: the movement tax (`LOCATION_CONDITION_MOVEMENT_TAX`), the per-reach step modifier on work done at the place (`LOCATION_CONDITION_STEP_MODIFIER`), target-action gating, the encounter pool's `locationTraitBonus` (trait × content tag, `LOCATION_TRAIT_ENCOUNTER_BONUS`), and the location page, which shows the trait's name with the effect line derived from those same rows. Every shipped location trait carries at least one such row — a location trait with no reader is the gate theatre THR-800 named. A `condition_template` content query excludes location traits unless it names `classes: ['location']`.

The player-facing word is the definition's display name, never the category, the id, or *location condition*; *location trait* is the design word for the family.

---

### Artifact Trait

**Aliases:** Thing's Trait, Item Trait
**Also see:** `[[Trait]]`, `[[Trait Assignment]]`, `[[Location Trait]]`, `[[Attachment]]`, `[[TraitPredicate]]`
**Status:** canonical

A `condition`-category `[[Trait]]` whose bearer is a *thing* — a `has_trait` edge from an `artifact` or `artifact_legendary` node to a definition under the id prefix `trait.artifact.*` (`ARTIFACT_TRAIT_ID_PREFIX`, `src/data/artifact-trait-content.ts`). The prefix is the declaration, the `[[Location Trait]]` rule carried one object family further: no new category, no new field. A **holding face** — the `artifact` node `holdings.ts` mints to mirror an `owns` edge — is never a bearer; the one writer (`src/engine/artifactTraits.ts`) refuses it.

Two definitions, and only two, because only per-bearer *state* justifies an edge; `#masterwork` / `#heirloom` / `#stolen` stay family tags. **Storied** — the thing has been where things happened: stamped at level one when a masterwork is made, and climbing a level every `ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL` encounters its bearer resolves with it about them, to `maxLevel`; the level is shown in words, never a numeral. **Cursed** — a curse rides in the thing: written beside the `curse_artifact` verb's untyped `properties.cursed` flag (THR-661), which nothing ever read, so that the one trait gate (`[[TraitPredicate]]`) sees a cursed blade the way it sees a wounded mortal; removed by `nullify_artifact`. The bearer-side hidden mark is unchanged.

What reads it: `resolveTraitPredicate` with the artifact as bearer (`requiredTraits: [{ traitId: '#cursed' }]`), the artifact sheet's *Traits* chips, `__DEBUG.getArtifactTraits` and CLI `traits`. A `condition_template` content query excludes artifact traits unless it names `classes: ['artifact']`, so the reward pool never deals a mortal *Storied*.

The player-facing word is the definition's display name; *artifact trait* is the design word for the family.

---

### Trait Category

**Aliases:** Trait Subcategory
**Also see:** `[[Trait]]`, `[[Destiny]]`, `[[Selection-Competence Separation]]`, `[[Trait Assignment]]`
**Status:** canonical

One of twelve classes on a trait definition, stored as the `subcategory` property (the field is named `subcategory`, not `category` — code reading `properties.category` reads `undefined`). The twelve (`TraitCategory`, `src/types/traits.ts`) are: `innate`, `cultural`, `personality`, `mastery`, `reputation`, `condition`, `scar`, `bestowed`, `destiny`, `core`, `spell` (THR-1429, the Power kind's learned class) and `temper` (THR-1544, see `[[Temper]]`). *(Corrected 2026-09-24, THR-1544: this entry said "ten" after `spell` had already made eleven.)*

**A category is a lifecycle contract, not a label.** It defines how traits in it are acquired, how they are removed, and when they trigger — every trait in a category obeys its category's rules, and the individual definition only supplies flavor. In contract terms: `innate` is worldgen-minted and permanent; `cultural` is inherited from a culture and permanent; `personality` is threshold-minted from the axiological axes and drifts as those axes drift; `mastery` is earned through encounters and promotion and decays when not reinforced; `reputation` is minted by the reputation phase and fades with standing; `condition` is inflicted and expires on its countdown or is mended; `scar` is minted by aftermath and overflow and is permanent save rare rites; `bestowed` is granted by a god or an item and is revocable by its grantor; `destiny` is a world-minted promise; `core` is reserved for run-defining identity such as The First bond; `spell` is learned from a tradition and held until forgotten; and `temper` is minted at `createNamedElite`, permanent, changed only by `trait_grant` or removal, and read at the fight's temper checkpoint.

Shipped static coverage is uneven by design and worth knowing before authoring against a category: reputation (19), personality (16), core (10), mastery (9), condition (7), scar (2), cultural (1). `innate` and `bestowed` have no static definitions — they are minted at runtime. `destiny` has none of either.

---

### Destiny

**Aliases:** Destiny Trait, Destiny Category
**Also see:** `[[Trait Category]]`, `[[Trait]]`, `[[Trait Visibility]]`
**Status:** canonical

The forward-contract trait category: a promise the world has made about a bearer, which fires when the system that minted it keeps the promise. Where every other category records something that has already happened, a destiny records something that has not happened yet.

Its contract: world-minted, removable only by rare rites, and **always visible** — a destiny the bearer cannot see is not a promise, so the category never takes `discoverable` or `divine_only` visibility.

The category is currently **reserved and empty**: it is declared in `TraitCategory` and honored by the agent sheet's display ordering, but no definition carries it and no producer mints it. Nothing reads a destiny trait today. This is the category's first definition — it establishes the wording ahead of the wave that fills it, so content authored later has a settled term to author against rather than minting a rival one.

---

### Trait Ref

**Aliases:** Ref, Trait Reference
**Also see:** `[[TraitPredicate]]`, `[[Trait]]`, `[[Trait Hook]]`
**Status:** canonical

How authored content **names** a trait. A ref is not necessarily a node id: it may name a trait by full node id (`trait.mastery.smithing`), by short id (`mastery.smithing`), by display name (`Master Smith`), or by tag (`#craft`). All four forms are legal and interchangeable at every trait read site.

Refs resolve through the `TraitRefIndex`, which maps one ref to the **set** of trait definitions carrying it, and predicates pass on **ANY-match** — a ref shared by several definitions is satisfied by a bearer holding any one of them. A ref resolving to more than one definition is therefore legal, not a conflict.

A ref no definition can satisfy is a gate that is silently, permanently false. Because that failure is invisible at runtime, the dev-only `__DEBUG.validateTraitRefs()` sweep exists to name every dead ref across all six authored surfaces. **Authoring rule: a hook must reference a trait some producer actually mints** — a ref that names a trait nothing creates is an authoring defect, not a missing engine feature.

---

### TraitPredicate

**Aliases:** Trait Gate
**Also see:** `[[Trait Ref]]`, `[[Trait Hook]]`, `[[Trait Assignment]]`
**Status:** canonical

The canonical trait gate shape: `{ traitId: string; minLevel?: number }`, where `traitId` is a `[[Trait Ref]]` and an absent `minLevel` means any level satisfies. Every trait read site in the engine resolves through the single `resolveTraitPredicate` in `src/engine/traits.ts` — the encounter filter pipeline, the `has_trait:` effect predicates, ambition graph conditions, ambition eligibility snapshots, spell prerequisites, and item-granted traits.

**Name collision (settled here).** Two different fields are both spelled `requiredTraits`: ambition templates carry `requiredTraits: string[]` — bare refs — while `UnifiedActionTemplate.requiredTraits` is a `TraitPredicate[]`. Both route through the same resolver, so behavior agrees; only the declaration differs. When the distinction matters, say **ambition trait keys** for the bare-string form and **template trait predicates** for the structured form. Do not "unify" them by renaming either field — the shapes are load-bearing, and the resolver already reconciles them.

---

### Trait Visibility

**Aliases:** TraitVisibility
**Also see:** `[[Trait Assignment]]`, `[[Trait]]`, `[[Destiny]]`
**Status:** canonical

Whether the player knows a bearer carries a trait: `public` (known on sight), `discoverable` (learnable through play), or `divine_only` (visible to the god alone). Declared on the definition and copied onto each assignment, so a single definition can be public on one bearer and discoverable on another.

Visibility governs **whether the trait is known yet — never whether a known trait is shown**. Canon: an object's traits are always visible in its interface *once known*. There is no known-but-hidden state; the mystery layer lives entirely in the discovery gate. The bearer's own modal owns the display, per the everything-clickable ruling.

---

### Trait Hook

**Aliases:** Hook
**Also see:** `[[TraitPredicate]]`, `[[Trait Ref]]`, `[[Trait]]`, `[[Encounter]]`
**Status:** canonical

The umbrella term for any authored place where content reacts to a trait. Four shapes ship: a **gate** (a `[[TraitPredicate]]` that shows or hides a template, option, or action), a **variant** (`TraitVariant` — a forecast or difficulty shift plus a player-facing factor line, applied when the acting agent holds the trait), a **trait-only nudge** (a `StepNudge` carrying `requiredTrait`, a card that only enters the hand for a bearer), and a **trait fragment** (prose that fires because the trait is present).

**Every hook names its trait to the player.** A hook that changes an outcome without saying which trait did it is not a hook, it is a hidden modifier — the canon rule exists so the world's reaction to who you are is legible as story rather than felt as noise. A trait reaction colors the curated moment it belongs to and never raises an independent notification of its own.

---

### Selection-Competence Separation

**Aliases:** Capability-Selection Separation, Competence Law
**Also see:** `[[Trait Category]]`, `[[Domain Capability]]`, `[[Trait]]`
**Status:** canonical

The law governing what a trait is allowed to change. **Selection steering** — which encounters and ambitions a bearer reaches for — flows through `scoringModifiers` and is competence-free for every category. **Competence** — how well the bearer does the thing — flows only through the existing capped channels: `domainContributions` (≤0.10 scale) and the resolution-bonus cap.

Stated precisely, because the shorthand "never crossed" is wrong: `personality`-category traits never gain competence effects at all, and `reputation` traits **do** carry capped `domainContributions` today. The rule is not that reputation never touches competence — it is that competence only ever moves through the capped channels. A trait reaction may add a competence modifier only through those channels, never as a bespoke uncapped bonus.

A third field is separate from both: `axisContributions` steers the *moral flavor* of an agent's personality baseline at birth and is read only by the baseline computation. It is neither selection nor competence, and nothing reads it for prerequisites or resolution.

---

### Attachment

**Aliases:** Attachment System
**Also see:** `[[Effect]]`, `[[Power]]`, `[[Companion]]`, `[[Trait]]`
**Status:** canonical

The broad **code umbrella** for anything that connects to a bearer and modifies what they can do, unlock, or experience. `AttachmentCategory` (`src/types/attachments.ts`) has eight members: `possession`, `condition`, `blessing`, `curse`, `bestowed_power`, `agreement`, `spell`, `companion`.

**Disambiguation.** Attachment is a code word, not a player-facing family name — no surface says "you gained an attachment." `[[Power]]` names a *subset* of the umbrella (spells, bestowals, innate powers), never a replacement for it; the possession, condition, agreement and `[[Companion]]` members stay outside that subset. Distinguish also from `[[Trait]]`, which sits on a parallel layer with the same node-plus-edge shape: a trait is **inert on its bearer** and carries no behavior of its own, while an attachment carries `[[Effect]]`s directly.

---

### Effect

**Aliases:** AttachmentEffect
**Also see:** `[[Attachment]]`, `[[Power]]`, `[[Trait]]`
**Status:** canonical

The **substrate** word: the primitives of the `AttachmentEffect` union (`src/types/effects.ts`), from which powers, items, blessings and curses are all built. The union is tiered — Gear, Spell, God-tier — and its members are atoms such as `PassiveEffect`, `TestShaperEffect`, `TraitGrantEffect`, `TeleportEffect`.

**One capability, one spelling (THR-1242).** A member of this union is a promise that content can author it and the engine will run it. Nine members were retired in the effect-vocabulary consolidation because they were *second spellings* of a live mechanism, and in every case the spelling without an executor was the one shipped content used — so an artifact could promise haste and nothing would hasten. Retired: `graph_mutation`, `outcome_shift`, `auto_succeed` (no content at all), `reroll` → `test_shaper`, `swap_reach` → the `encounter_reach_override` rule key, `haste`/`slow`/`freeze_duration` → rule-override multiplier keys, `create_barrier` → `alter_terrain` with the `shrouded`/`warded` overlays. When a new primitive is proposed, the first question is whether an existing member already means it.

**`choice_set` is the one member content must not author.** It renders a nested decision for a human; an agent has no surface to make one on. It stays in the union for the existing GameView use and is excluded from the agent-facing vocabulary and from the powers and item generators' envelopes.

**Disambiguation — Effect is never player-facing as a family name.** It names the atoms only. The two-level ambiguity, where "effects" means both the primitives *and* the family of things assembled from them, is exactly what `[[Power]]` was minted to prevent: **"Effects" was considered as the family name and rejected** (ratified 2026-08-25). When you mean the things a bearer holds, say power, possession, or attachment; reserve *effect* for the primitive.

---

### Power

**Aliases:** the Power family
**Also see:** `[[Spell]]`, `[[Bestowal]]`, `[[Innate Power]]`, `[[Attachment]]`, `[[Effect]]`
**Status:** canonical

The **player-facing family name** for a carried, capability-granting thing an entity holds — an `[[Agent]]`, `[[The First]]`, a monster, a faction. A power expands what its bearer can do. Three variants: `[[Spell]]` (learned from a tradition), `[[Bestowal]]` (god-given), `[[Innate Power]]` (anatomy).

A power is **not** a possession, a condition, or an agreement, though it shares the `[[Attachment]]` substrate with all three and is built from the same `[[Effect]]` primitives.

**Power is a conceptual family, not a code identifier — there is no `'power'` `AttachmentCategory`.** Its variants sit as *sibling* category members (`'spell'`, `'bestowed_power'`), so nothing in the union corresponds to the family as a whole; code that means "any power" enumerates the variants rather than reaching for one name. Content and UI say *power*; the type layer keeps the variants.

---

### Spell

**Aliases:** the `'spell'` `AttachmentCategory`
**Also see:** `[[Power]]`, `[[Bestowal]]`, `[[Innate Power]]`, `[[Attachment]]`
**Status:** canonical

A `[[Power]]` a caster **learns from a magic tradition**. Casters are an earned identity, never a starting class — a mortal becomes one through the world, which is what keeps spells story-priced rather than character-sheet-priced.

Three authored axes carry a spell's design: **agency** (fate-woven or deliberate), **arena** (encounter or map), and **price** (free → strain → gamble → transgression). Code anchor: the `'spell'` member of `AttachmentCategory`.

**Shape (THR-1429).** A spell is a graph node: **one shared `trait` definition node per spell**, `subcategory: 'spell'`, minted once at seeding from `SPELL_TEMPLATES` — never one node per bearer (THR-1395). A mortal's relationship to it is two edges to that same node, and they mean different things: **`knows_spell`** is *known* — the biography, unlimited — and **`has_trait`** is *wielded*, what they are carrying now, capped by `SLOT_CAPS.spell`. Learning past the cap leaves a spell known and not carried, which is a fact the sheet states rather than a failure. `'spell'` is also a member of `[[Trait Category]]`, which is what makes the Power kind's discriminator `subcategory: bestowed | spell`.

---

### Bestowal

**Aliases:** bestowed power, the `'bestowed_power'` `AttachmentCategory`
**Also see:** `[[Power]]`, `[[Spell]]`, `[[Innate Power]]`, `[[Trait Category]]`
**Status:** canonical

A **god-given** `[[Power]]`. This is the player-facing rename of the existing `bestowed_power` attachment kind: **the code identifier stays**, and this entry is the mapping between them. Prose and UI say *bestowal*; the union member is still `'bestowed_power'`, so a rename ticket is not implied by this vocabulary landing.

**Do not confuse a bestowal with the `bestowed` `[[Trait Category]]`.** They share the god-grants-it-and-can-revoke-it fiction but sit on different layers: a bestowed *trait* is a name the world recognizes, inert on its bearer; a bestowal is a power carrying `[[Effect]]`s of its own.

---

### Innate Power

**Aliases:** innate ability
**Also see:** `[[Power]]`, `[[Spell]]`, `[[Bestowal]]`, `[[Trait Category]]`
**Status:** canonical

A `[[Power]]` that is **anatomy**: stamped at seeding on monsters and unusual beings, with no learning fiction behind it. Nothing was taught and nothing was granted — the bearer simply is the kind of thing that can do this.

**No code anchor yet.** Unlike its two siblings there is no `AttachmentCategory` member for it as of this entry's landing (2026-08-25); the term is ratified vocabulary awaiting implementation, so content that means it should not reach for an existing category as a stand-in.

**Do not confuse it with the `innate` `[[Trait Category]]`**, which is a worldgen-minted, permanent *trait* class. The collision is exact in wording and empty in substance: one is a name minted at worldgen, the other a capability stamped at seeding.

**Nor with `[[Temper]]`.** A monster's temper is also stamped when it is minted, but it is how the creature *breaks*, not something it can *do*. The mint in `createNamedElite` is the seam where innate powers will later be stamped; the temper edge written there does not stand in for them.

---

### Temper

**Aliases:** monster temper, `trait.temper.*`
**Also see:** `[[Trait Category]]`, `[[Innate Power]]`, `[[Trait]]`, `[[Opponent Card]]`
**Status:** canonical — seated by delegation 2026-09-24 (THR-1544)

How a creature breaks when a fight turns. One of four trait definitions: *stubborn* (digs in and fights on), *berserk* (goes wild and hits harder), *skittish* (looks for a way out and may flee) and *bargains* (offers terms instead of dying; the id is `trait.temper.bargainer`). Each lair monster is minted with its family's temper as a `has_trait` edge (`createNamedElite` → `mintMonsterCard`, `src/engine/monsters/monsterCard.ts`); the fight block reads it by id prefix (`readTemper`) at the temper checkpoint, once the opponent's clock is half full. An opponent with no temper edge fights as stubborn.

Temper is a **trait**, not a property, so later spells, items and cards can calm or enrage a creature through `trait_grant` with no new writer. Its class is `temper` (`subcategory: 'temper'`), its class word the `#temper` tag, and it contributes no capability. The definitions live in `src/data/temper-trait-content.ts` and belong to the Trait content kind.

**Not an `[[Innate Power]]`** (something a creature can *do*) **and not the `innate` class** (a worldgen-minted mark). The fight's own type for it is `FightTemper` (`src/types/fight.ts`).

---

### Tag Namespace

**Aliases:** `#`-tag, content tag
**Also see:** `[[Effect]]`, `[[Attachment]]`, `[[Trait]]`
**Status:** canonical

**Every content tag is written `#`-prefixed.** Condition trait definitions, attachment tag lists, reward tag filters, and `tag_immunity` tag lists all share one namespace, and `#` is its spelling: `['#condition', '#combat', '#negative']`, not `['condition', 'combat', 'negative']`.

**Ratified 2026-08-26 (THR-1242) because the mismatch was live and silent.** Condition trait nodes had always carried `#`-prefixed tags; most `tag_immunity` content wrote them bare. `isImmuneToTag` compared the two with `Array.includes`, so `'fear'` could never match `'#fear'` — a ward against terror would have run its check, found nothing, and let the terror land. That is worse than a dead primitive, because the trace shows the comparison happening.

**Comparison normalizes anyway.** `normalizeTag` (`src/engine/effects/effectQueries.ts`) strips one leading `#` from both sides before comparing, so a bare tag still matches. The convention is the rule; the normalization is the safety net, because a convention enforced only by every author remembering it is not enforced. Write the `#`.

**One level only.** `normalizeTag('##fear')` is `'#fear'`, not `'fear'` — a doubled prefix is a content typo and should surface as a non-match rather than be silently repaired.
