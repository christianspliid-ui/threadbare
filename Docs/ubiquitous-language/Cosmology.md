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

### Domain Capability

**Aliases:** Capability Tier, Domain Tier
**Also see:** `[[Reach]]`, `[[Prerequisite]]`
**Status:** canonical

A tiered measure of how proficient an actor is across a Reach. Domain Capability gates access to actions — an actor must meet the capability tier plus sphere alignment check to perform certain actions. Ascendants use the same prerequisite system as mortal agents; power level is tunable, not structurally special-cased.

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

A guard on action availability combining a Domain Capability tier threshold and a Sphere alignment check. Applied uniformly to Ascendants and mortal agents — there is no special-cased eligibility logic for the Ascendant. Both conditions must pass for the action to appear in the action pool.
