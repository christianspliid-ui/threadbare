# Ubiquitous Language — Cosmology

Content-adjacent shard. Terms covering the cosmic system: Reaches, Spheres, domain capability, prerequisites.

---

### Reach

**Aliases:** Action Domain, Domain, ReachDomain
**Also see:** `[[Domain Capability]]`, `[[Sphere]]`, `[[mentor]]` (domain-specific teaching)
**Status:** canonical

One of eight axes along which actors develop capability. Reaches classify *what* an actor does, not what fuels it.

The eight Reaches are: **iron** (martial/force), **gold** (commerce/resources), **shadow** (stealth/deception), **veil** (magic/perception), **heart** (social/emotional), **eye** (intelligence/knowledge), **stone** (endurance/construction), **star** (faith/divine).

The ninth Reach, Flesh, was absorbed into the Quintessence system in TB-075. Do not reintroduce it.

---

### Sphere

**Aliases:** Cosmic Energy, Sphere of Influence, SphereName
**Also see:** `[[Foundation]]`, `[[Creation]]`, `[[Sphere Alignment]]`, `[[Sphere Attunement]]`
**Status:** canonical

One of the cosmic energies that *fuel* action. Spheres are orthogonal to Reaches — the same Reach action can be performed with different Sphere colorings, producing different flavors and eligibility. Sphere ≠ Reach. Neither subsumes the other.

There are **twelve Spheres**, in two groups of opposed pairs. The four **Foundation** Spheres: **Chaos ↔ Order**, **Light ↔ Darkness**. The eight **Creation** Spheres: **Force ↔ Mind**, **Matter ↔ Time**, **Energy ↔ Spirit**, **Life ↔ Entropy**. Code source of truth: `src/engine/cosmology.ts` (`SPHERE_ALLIES`, `SPHERE_OPPOSITES`); spec: `Docs/canon/cosmology.md`.

A god's standing in a Sphere is read two independent ways, and they are not interchangeable: `[[Sphere Alignment]]` is an actor's *affinity* for the Sphere (an `aligned_with` edge), while `[[Sphere Attunement]]` is the lifetime essence the god has *drawn through* it. Alignment is who you are; attunement is what you have practised.

---

### Tradition

**Aliases:** Magic Tradition, school of magic, `magic-tradition` (catalog category)
**Also see:** `[[Spell]]`, `[[Sphere]]`, `[[Power]]`
**Status:** canonical (seated by delegation 2026-10-04, THR-1701)

The **school of magic a caster belongs to**. A tradition decides which spells its casters can learn and how that magic is paid for: a priest of the Dawn and a marsh hedge-witch carry different spells because they were taught by different traditions, and those spells are priced the way each tradition prices its magic. A `[[Spell]]` is always learned *from* a tradition; the tradition is what the sheet names when it says who taught a spell.

A tradition is **not a Sphere**. Each tradition draws on one or more Spheres (`primarySpheres`, `sphereWeights`), and a spell's Sphere follows from its tradition — never the other way round. Two casters aligned with the same Sphere can belong to different traditions.

**Code anchor.** The 34 catalog entries with `category: 'magic-tradition'` in `src/data/world-model.json` (ids such as `magic.fire`, `magic.holy`), read through `src/engine/taxonomy.ts`. A tradition is a **catalog id, not a graph node**: it is never minted into the world graph, and no edge points at it — where a caster's tradition is recorded, it is a property on their `knows_spell` edge (the per-bearer pattern), as the seeded spell generator does ([THR-1572](https://linear.app/threadbare/issue/THR-1572), plan `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md`). Until that generator lands, the sheet's known-spell row still fills its `tradition` field from the spell node's `sphereAffinity` (`agentAttachments.ts`) — a Sphere standing in for the tradition, which is exactly the conflation this entry rules out.

---

### Foundation

**Aliases:** Foundation Sphere
**Also see:** `[[Sphere]]`, `[[Creation]]`
**Status:** canonical

One of the two Sphere *groups* — not itself a Sphere. Holds the four Foundation Spheres in two opposed pairs: **Chaos ↔ Order**, **Light ↔ Darkness** ("elder magic," discovered through ruins, not chosen at chargen). The group anchors stability, permanence, memory, and continuity; Foundation-aligned cosmologies tend toward order, preservation, and deep time.

---

### Creation

**Aliases:** Creation Sphere
**Also see:** `[[Sphere]]`, `[[Foundation]]`
**Status:** canonical

One of the two Sphere *groups* — not itself a Sphere. Holds the eight Creation Spheres in four opposed pairs: **Force ↔ Mind**, **Matter ↔ Time**, **Energy ↔ Spirit**, **Life ↔ Entropy**. The group drives change, generativity, transformation, and emergence; Creation-aligned cosmologies tend toward dynamism, experimentation, and renewal.

---

### Sphere Alignment

**Aliases:** Alignment
**Also see:** `[[Sphere]]`, `[[Cosmology Profile]]`
**Status:** canonical

The affinity of an actor or location for a particular Sphere, stored as an `aligned_with` edge in the world graph. Sphere alignment affects which actions an actor can perform, how those actions resolve, and how NPCs perceive the actor. Alignment is not binary — strength is a property on the edge.

---

### Dominion

**Aliases:** home turf, the god's ground
**Also see:** `[[Dominion Band]]`, `[[Opposing Dominion]]`, `[[Sphere]]`, `[[Sphere Alignment]]`
**Status:** canonical (Christian's word, ruled 2026-10-05 on [THR-1745](https://linear.app/threadbare/issue/THR-1745); seated by delegation 2026-10-05, [THR-1746](https://linear.app/threadbare/issue/THR-1746)). The read is built: [THR-1748](https://linear.app/threadbare/issue/THR-1748).

How much a world object is the god's. It is the graded match between the object's sphere scores (a hex, place, mortal, faction, artifact or army) and the god's bought sphere points, averaged by points. A sphere the object holds that is the *opposite* of one the god bought counts against it, weighted by the pair's strength, following `SPHERE_OPPOSITES`. The god's power (its own bought-sphere scores over their starting sum, capped at double) then widens friendly ground only; it sits outside the match, not inside it (THR-1760, corrected by THR-1748). Same-dominion objects are cheaper and stronger to influence. They are the god's home turf, and the player's power loop is spreading it.

Dominion is graded and is **always read as a [Dominion Band](#dominion-band) word, never a number** (Laws 4/13).

**Code anchor:** `dominionOf(graph, ascendantId, objectId)` in `src/engine/dominion.ts` (THR-1748). The bought vector is read through `getSpherePoints`, whose fallback is the preset from `sphereAlignment` ([THR-1749](https://linear.app/threadbare/issue/THR-1749)).

**Other uses of the word, reconciled (THR-1746):**

* **The god sheet's Reach section** was headed "Dominion". It is now **"Reaches"** (`AscendantSheet.tsx`).
* **The mortal ambition category.** The engine literal `dominion` (`AmbitionCategory`, `VERBS_BY_CATEGORY`, premonition keys) stays as it is. The player says **Supremacy** (`CATEGORY_LABELS`, `AMBITION_CATEGORY_WORDS`). This is the Freehold pattern: an engine literal kept, a player word chosen so the two never collide.
* **Claim Dominion / Shift Dominion** (`hex.claim_dominion`, `hex.shift_dominion`) keep their names. They are the plain Dominion verbs. THR-1748 re-keyed their effects and re-targeted both from hexes to places: Claim is a hold that pushes the god's bought vector into a place each tick, and Shift breaks the opposing pole there. The ids keep their `hex.` names.
* **Proper nouns stay as they are:** the mandate *Dominion of Stone*, the spell *Word of Dominion*, and the remembrance title word "Dominion" (`remembrance.ts`). Each is a name, not the term.
* **Narrative prose** ("asserting dominion", "share dominion over this place") is ordinary English, not the term. Leave it alone.

---

### Dominion Band

**Aliases:** dominion word
**Also see:** `[[Dominion]]`
**Status:** canonical (seated by delegation 2026-10-05, THR-1746). The five words are proposed on THR-1745; THR-1748 names the thresholds as constants.

The five words a [Dominion](#dominion) is read through, lowest to highest: **Hostile · Foreign · Touched · Held · Sovereign**. Foreign is neutral. The band is the one read that every consumer uses: card cost, cast odds, thread yield, source income, and where tending, neglect and raids land. Effect magnitude is **not** a band consumer; it stays on the god's power (THR-1761, corrected by THR-1748). No consumer reads the underlying number. Code anchor: `DominionBand` in `src/data/dominion-content.ts`, with the thresholds as named constants.

---

### Opposing Dominion

**Aliases:** the opposition
**Also see:** `[[Dominion]]`, `[[Sphere]]`
**Status:** canonical (seated by delegation 2026-10-05, THR-1746)

The opposite pole of each sphere the god holds, as the designed cosmology pairs them (`SPHERE_OPPOSITES`: Chaos ↔ Order, Light ↔ Darkness, Force ↔ Mind, Matter ↔ Time, Energy ↔ Spirit, Life ↔ Entropy). Objects steeped in it read Hostile. Since THR-1748 rivals take their spheres from the opposites of the god's buy, and their probes and schemes press on the god's Touched-or-better places.

---

### Domain Capability

**Aliases:** Capability Tier, Domain Tier
**Also see:** `[[Reach]]`, `[[Prerequisite]]`
**Status:** canonical

A tiered measure of how proficient an actor is across a Reach. Domain Capability gates access to actions — an actor must meet the capability tier plus sphere alignment check to perform certain actions. Ascendants use the same prerequisite system as mortal agents; power level is tunable, not structurally special-cased.

**Two scales, one store (THR-1562, delegated seating 2026-09-24).** Capability is stored as a raw score and read on two scales. The **dice** read the capability curve (a sigmoid, `computeCapability`), which is what a resolution roll and a forecast see. Every **requirement** — an ambition's floor and milestones, a spell's minimum reach, a guild's join requirement, a `reach_above:` condition — reads the **reach share** (`computeReachShare`: the effective raw score ÷ `REACH_SHARE_FULL_RAW`, capped at 1), so 1.0 means as good as the best ordinary protagonist starts. Authored requirement numbers are always shares (0–1), never raw scores. Fights, sieges and journeys read the raw score with thresholds authored raw.

---

### Cosmology Profile

**Aliases:** World Cosmology, Seeded Cosmology, CosmologyProfile
**Also see:** `[[Sphere]]`, `[[Foundation]]`, `[[Creation]]`
**Status:** canonical

The seeded configuration of Sphere weights, alignments, and relationships for a particular world instance. Generated at world creation from the seed and the Ascendant's identity choices. Different profiles produce different gameplay and encounter ecosystems. Stored in `GameState.cosmology`.

---

### Quintessence

**Aliases:** Flesh Reach (deprecated), Quintessence Reach (deprecated naming — Quintessence is not a Reach)
**Also see:** `[[Reach]]`
**Status:** canonical

The derived meta-property tracking an actor's integrity-of-self and centrality to the simulated story. Quintessence is not a Reach domain. Higher Quintessence signals sovereignty, resilience, and resistance to being owned, reduced, or written out; lower Quintessence signals thinning confidence, narrower options, and rising risk of becoming a vessel, symbol, or tool. It functions as a threshold meter for *narrative* phase shifts — transformation, symbolic capture, being written out of the story — not as a personality axis and **not as a death meter**: death stays owned by the zero-state rules, and Quintessence erosion alone never kills (`QUINTESSENCE_RATIO_FLOOR`). The biology/survival framing belonged to the deprecated Flesh Reach; Quintessence replaced it with the narrative-abstract concept (user verdict 2026-05-05, `Docs/canon/cosmology.md`). Replaces the deprecated Flesh Reach (TB-075, 2026-03-28); do not reintroduce Flesh as a ninth Reach.

---

### Prerequisite

**Aliases:** Action Prerequisite, Eligibility Check
**Also see:** `[[Domain Capability]]`, `[[Sphere Alignment]]`
**Status:** canonical

A guard on action availability combining a Domain Capability tier threshold and a Sphere alignment check. Applied uniformly to Ascendants and mortal agents — there is no special-cased eligibility logic for the Ascendant. Both conditions must pass for the action to appear in the action pool. A prerequisite's capability number is a **reach share** (0–1), read against the actor's full standing in the Reach — training, traits, items and company — never against the raw store or the dice curve (THR-1562; see `[[Domain Capability]]`).

---

### Offering

**Aliases:** the world's offering; *Three powers stir* (player-facing title)
**Also see:** `[[Rung]]`, `[[Card Progression]]`, `[[Key Card]]`
**Status:** canonical (proposed [THR-1838](https://linear.app/threadbare/issue/THR-1838), seated with the build, [THR-1811](https://linear.app/threadbare/issue/THR-1811))

The beat in which the world offers a god three cards, about once a day. The god takes up one, paid in essence it has *earned* through the card's sphere (or from its first sphere at double), or lets them pass; an offering not entered passes when the day turns. Spending on an offering never lowers the earned counter. Code: `beat.offering`, beat kind `offering`; `src/engine/godProgression.ts`.

**Collisions, reconciled:** *Omen* stays the omen track (`[[Omen]]` in Encounters.md), the card `divine.omen` and the Omens panel; the offering is never called an omen on screen. *Within reach* stays the Codex badge ("you may yet hold this", `codexRunState.ts`); the offering's price phrases avoid it: *Paid from {sphere}* · *From {primary}, at double* · *Beyond you yet*.

---

### Rung

**Aliases:** the god's ladder step; prose words *touch / hand / will / wonder*
**Also see:** `[[Offering]]`, `[[Key Card]]`, `[[Dominion]]`
**Status:** canonical (THR-1838 / THR-1811)

One of four steps of a run's card ladder, opened by the god's attunement marks summed over its bought spheres (`PROGRESSION_RUNG_MARKS` 0 / 3 / 6 / 8; rung 1 also waits for the opening spine). A rung only rises. It is never shown as a number. Distinct from `rarityTier` (`[[Rarity Band]]`) and from forecast and spotlight tiers. Code anchor: `rungMarks` / `rungForMarks` in `src/engine/godProgression.ts`.

---

### Key Card

**Aliases:** rung gift
**Also see:** `[[Rung]]`, `[[Card Progression]]`
**Status:** canonical (THR-1838 / THR-1811)

A card gifted when a rung opens, because it opens a card family, drives the Dominion loop, or tends the god's threads (`progression.giftBy: 'rung'`). Keys arrive one at a time, `RUNG_GIFT_SPACING` apart; the second rung's first key is the god's secondary reach signature. A key the god already holds is skipped.

---

### Card Progression

**Aliases:** the `progression` block
**Also see:** `[[Rung]]`, `[[Offering]]`
**Status:** canonical (THR-1838 / THR-1811)

The data on a god card that places it on the ladder: `tier` (1–4), `offer` (market / gift), `giftBy` (spine / milestone / rung / signature), `generic`, `pricedIn`, `offerWeight`, `flags`. Required on every ascendant-castable template (`npm run check:god-card-progression`). The distribution is tuned by editing the card, never code.

---

### Run

**Aliases:** age (player-facing), cycle (engine field: `GameState.cycle`, `AccountRecord.cycleCount`)
**Also see:** `[[Echo]]`, `[[Account Record]]`, `[[World Tilt]]`
**Status:** canonical (seated 2026-10-16, THR-1845 via THR-1813; design-lane delegation, Christian's veto retained)

One god's life in one world, from Remembrance to the harvest. Each run wakes in a **new world** (Christian, 2026-10-11, THR-1773): a new map, never a continuation of the last. The screen says *age*; the code keeps *cycle*. The god starts every run as strong as the first; what carries is the world's memory (`[[Echo]]`, `[[World Tilt]]`) and the choices open to the player.

**Collision — Harvest.** *Harvest* is also the economic verb (the active harvest of a staple, `Agents.md`). The run-end screen keeps the name in code (`HarvestScreen`, `computeHarvest`); in prose, the run-end is *the end of an age*.

**Collision — Remembrance.** *Remembrance* is the opening flow that makes the god (and a title word in `remembrance.ts`). Its new first step from run 2 on is *The world remembers* — a step of Remembrance, not a separate flow.

---

### Echo

**Aliases:** `EchoDefinition` (`src/types/echo.ts`)
**Also see:** `[[Run]]`, `[[Memory Word]]`, `[[Account Record]]`
**Status:** canonical (seated 2026-10-16, THR-1845 via THR-1813)

Something a run leaves for the next world: a **Monument** (a place), a **Legacy** (a mortal's line), a **Relic** (an artifact), or a **card echo** (a nudge card in the next repertoire, THR-887). **Divine** echoes are the god's own, picked at harvest by rule (the places it held most surely, the mortals it raised highest, the relics its chosen carried); **cosmic** echoes are the world's most significant nodes. Both carry the god's bought primary and secondary spheres. One formatter names an echo everywhere: `echoDisplayName` (*The Long Barrow*, *the line of Maren Ashfold*, *the Hollow Bell*).

---

### Memory Word

**Also see:** `[[Echo]]`
**Status:** canonical (seated 2026-10-16, THR-1845 via THR-1813)

How faded an echo is, never a number: *still warm* / *fading* / *almost gone* (degradation below 0.3 / 0.6 / 0.9; at 0.9 the echo is gone). Each run an echo ages one step (`ECHO_DEGRADATION_RATE`). Code: `memoryWord` in `src/data/account-content.ts`.

---

### Account Record

**Aliases:** the account, `AccountRecord` (`src/types/account.ts`)
**Also see:** `[[Run]]`, `[[Echo]]`, `[[World Tilt]]`
**Status:** canonical (seated 2026-10-16, THR-1845 via THR-1813)

The small versioned record that carries between runs: runs completed, the next world's seed, awake hungers, stirring hungers, open second courts, unsealed cards, live echoes, the World-Soul's fundament and resonance. **Not a world save.** It lives outside `GameState`; only `src/engine/accountStore.ts` reads or writes it to storage (browser storage, key `threadbare.account.v1`), so a cleared browser forgets it. Nothing in it touches the god's sphere points, essence, power, reaches or tiers.

---

### World Tilt

**Also see:** `[[Account Record]]`, `[[Cosmology Profile]]`, `[[Run]]`
**Status:** canonical (seated 2026-10-16, THR-1845 via THR-1813)

How far a new world leans toward the spheres earlier gods drew on. Each run end blends the account's fundament toward the god's bought spheres (`FUNDAMENT_BLEND_PER_RUN`) and back toward even (`FUNDAMENT_REVERT`); the next world's `[[Cosmology Profile]]` is multiplied sphere by sphere by the result (`WORLD_TILT_GAIN`). Read through the cosmology profile because the fundament's own weights are overwritten every tick. Player-facing it is a sentence, never a number: *"This world leans a little toward Life and Spirit."*
