---
domain: cosmology
last_reviewed: 2026-05-05
reviewer: user
ul_shards: [Cosmology, Agents]
status: live
---

# Canon — Cosmology

> The cosmological system governs how divine energy flows through the world: 8 Reaches (action domains) × 12 Spheres (cosmic energy flavors) = the full space of divine action. Quintessence is a separate meta-property, not a Reach.

## ⚠️ STALE-SOURCE WARNING

Several widely-read documentation surfaces still present the **old 9-Reach + Flesh framing** as current. These are **stale**. Do not use them as authoritative:

- `vault/Systems/Domain Word Scales.md` — says "Nine Reaches ... Flesh". **Stale.** Last updated 2026-03-08, before the 2026-03-28 decision.
- `.claude/skills/state-of-game-design/SKILL.md` lines 71, 357, 367, 415, 423 — Flesh row in reach table, "9 Reaches" references. **Stale.**
- `vault/CLAUDE.md` — "Nine Reaches (Action Domains)". **Stale.**
- `vault/Systems Overview.md` — Flesh row, 16× `[[Nine Reaches]]` wikilinks. **Stale.**
- `STYLE.md` lines 251–264 — "Nine Reaches ... Flesh" table. **Stale.**
- `vault/Index.md` — Flesh listed under Reaches. **Stale.**
- `Docs/ubiquitous-language/Cosmology.md` Quintessence definition — "Manages vitality, life force, and physical existence." **Stale.** The correct definition is below.

**The canonical source is `src/types/traits.ts` `ReachDomain` type and the user verdict recorded here (2026-05-05). When any surface disagrees with this page, this page is correct.**

Full remediation list: `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md`.

---

## Current spec

### The Eight Reaches (action domains)

| Reach | Domain |
|-------|--------|
| **Iron** | Strength, force, martial action, direct confrontation |
| **Gold** | Wealth, influence, social capital, patronage, trade |
| **Shadow** | Stealth, deception, sabotage, hidden action |
| **Veil** | Magic, divination, supernatural perception, ritual |
| **Heart** | Emotion, loyalty, persuasion, personal bonds |
| **Eye** | Knowledge, observation, judgment, intelligence |
| **Stone** | Endurance, craftsmanship, building, preservation |
| **Star** | Travel, fate, navigation, survival, long-distance |

**Source:** `src/types/traits.ts` → `ReachDomain` type (TB-075 Phase 1, shipped).

```typescript
export type ReachDomain =
  | 'iron' | 'gold' | 'shadow' | 'veil' | 'heart'
  | 'eye' | 'stone' | 'star';
```

Flesh was the 9th Reach in an earlier design. It was removed and its content migrated to Quintessence (a separate meta-property) in TB-075 Phase 1. The code is correct. **Do not re-introduce Flesh as a Reach.**

Content migration: healing → Gold, athletics → Iron, body modification → Stone, survival → Star.

### Quintessence — the narrative meta-property

Quintessence is **not a Reach**. It is a separate meta-axis that tracks an actor's **integrity of self, centrality to the story, and threadbare-ness**.

- **High Quintessence** — sovereign, confident, hard to manipulate, central to the story, fully present.
- **Low Quintessence** — thinning confidence, threadbare, easier to bend through indirect manipulation, at risk of being written out of the story.

**User-verdicted framing (2026-05-05):**
> Quintessence is a meta-reach about whether the actor is a strong, confident presence, or whether they are starting to become threadbare and potentially losing influence, or maybe even dying or transforming, moving out of the story. It's a strength indicator for how central they are to the story and whether we want to write them out or write them in more things. Flesh was a little more old-school and more focused on whether you're going to die or not. Quintessence is a more abstract, more narrative-driven approach.

**What Quintessence is NOT:** it is not about flesh, biology, or dying. The deprecated Flesh Reach had that framing (D&D-flavored survival). Quintessence replaced it with a narrative-abstract concept.

**Source of the iteration:** `Brainstorms/brainstorm-cosmological-symmetry.md` (2026-03-28, Spliid + Claude).

### The Twelve Spheres (cosmic energy flavors)

Reaches and Spheres are **orthogonal axes**. Spheres flavor *how* a reach's action is powered — the same Reach action at different sphere alignments produces different narrative textures.

**Foundation Spheres (4):**

| Sphere | Alignment |
|--------|-----------|
| Chaos | Change, disruption, entropy-as-creation |
| Order | Stability, law, structure |
| Light | Illumination, truth, clarity |
| Darkness | Mystery, shadow, concealment |

**Creation Spheres (8):**

| Sphere | Alignment | Opposite |
|--------|-----------|---------|
| Force | Physical power, momentum | Mind |
| Matter | Substance, crafting, physicality | Time |
| Energy | Vitality, fire, kinetic power | Spirit |
| Life | Growth, biology, healing | Entropy |
| Mind | Thought, intelligence, will | Force |
| Spirit | Soul, essence, divine nature | Energy |
| Time | Duration, memory, causality | Matter |
| Entropy | Decay, dissolution, transformation | Life |

**Source:** `src/engine/cosmology.ts` → `SPHERE_ALLIES`, `SPHERE_OPPOSITES`.

### Cosmological Pattern — reach × archetype-axis

Each of the 8 Reaches maps to an archetype-pair axis (the moral dimension in the Cosmological Pattern). These axes drive encounter tilt in the encounter experience design:

| Reach | Archetype axis |
|-------|----------------|
| Iron | Protector ↔ Conqueror |
| Gold | Patron ↔ Extractor |
| Shadow | Saboteur ↔ Deceiver |
| Veil | Seer ↔ Manipulator |
| Heart | Sworn ↔ Renegade |
| Eye | Witness ↔ Judge |
| Stone | Keeper ↔ Destroyer |
| Star | Wanderer ↔ Anchor |

**Source:** `Brainstorms/brainstorm-cosmological-symmetry.md` (2026-03-28).

### Key sources

- **Canonical iteration record:** `Brainstorms/brainstorm-cosmological-symmetry.md` (2026-03-28) — the session where Flesh was removed and Quintessence was defined
- **Implementation plan:** `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md` (TB-075) — Phase 1 shipped; Phases 4–5 (documentation propagation) pending
- **Code source of truth:** `src/types/traits.ts` (`ReachDomain`), `src/engine/cosmology.ts` (`SPHERE_ALLIES`, `SPHERE_OPPOSITES`)
- **UL terms:** [Docs/ubiquitous-language/Cosmology.md](../ubiquitous-language/Cosmology.md)
- **Drift audit:** [Docs/audits/2026-05-05-cosmological-canon-drift-audit.md](../audits/2026-05-05-cosmological-canon-drift-audit.md) — full list of stale surfaces and remediation plan

## Active design plans

- [2026-03-28-cosmological-symmetry-refactor.md](../plans/2026-03-28-cosmological-symmetry-refactor.md) — TB-075 refactor plan; Phase 1 (types/engine) shipped. Phases 4–5 (docs/vault propagation) are the input for Phase 5 of the canonical documentation strategy (THR-307 / the Cosmological Pattern page Cowork session).
- [2026-05-05-canonical-documentation-strategy.md](../plans/2026-05-05-canonical-documentation-strategy.md) — Phase 5 will create `vault/Cosmology/The Cosmological Pattern.md` as the canonical vault destination for the missing `[[The Cosmological Pattern]]` wikilink.

## Rejected approaches

- ❌ Flesh as the 9th Reach — replaced by Quintessence (TB-075). Any `reach: 'flesh'` literal in content data is stale. Use the content migration map above.
- ❌ Spirit as a Reach — Spirit is a **Creation Sphere**, not a Reach. Any encounter citing "Spirit reach" is a drift error.
- ❌ Voice as a Reach — does not exist. Persuasion/communication maps to Gold or Heart depending on the action.
- ❌ Old 5-force cosmology — replaced by Foundation + Creation Sphere model (CLAUDE.md Rejected Approaches).
- ❌ Fixed rival pantheon — replaced by generated rivals from World-Soul.

## Open questions

- **`[[The Cosmological Pattern]]` wikilink resolves to nothing** — dozens of vault pages cite this page and get a 404. Fix: create `vault/Cosmology/The Cosmological Pattern.md`. Tracked in Phase 5 of canonical documentation strategy (THR-307). Until then, agents following this wikilink must fall back to `Brainstorms/brainstorm-cosmological-symmetry.md`.
- **`[[Nine Reaches]]` wikilink resolves to nothing** — cited 16× in `vault/Systems Overview.md` and 10+ other vault files. Fix: bulk-rename to `[[Reaches]]` once `vault/Cosmology/Reaches.md` exists. Tracked in Phase 5 / THR-307.
- **Stale documentation propagation** — all Category A sources listed in the drift audit still carry old framing. Phase 5 (THR-307) is the remediation plan. Until Phase 5 lands, treat all documentation surfaces as potentially stale; this Canon page is the authoritative override.

## Last-reviewed

2026-05-05 by user (Quintessence framing directly verdicted). Review trigger: monthly, or when any linked plan's status changes.
