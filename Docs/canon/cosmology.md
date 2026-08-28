---
domain: cosmology
last_reviewed: 2026-05-05
reviewer: user
ul_shards: [Cosmology, Agents]
status: live
---

# Canon — Cosmology

> The cosmological system governs how divine energy flows through the world: 8 Reaches (action domains) × 12 Spheres (cosmic energy flavors) = the full space of divine action. Quintessence is a separate meta-property, not a Reach.

## ⚠️ STALE-SOURCE WARNING (re-verified 2026-08-28, THR-1333)

> **History lesson this list now carries:** the previous seven-row version of this list was **100% false by 2026-08-28** — every named surface had been fixed on 2026-05-05 (THR-307), one no longer existed in the named shape, and the list itself was never re-verified, so for months it sent remediators at ghosts while missing the live pollution. A stale-source list is itself a source that can go stale: **re-verify every row whenever this page is reviewed**, and date the verification in this heading.

Live stale surfaces as verified 2026-08-28:

- `vault/Domains/reach.flesh.md` + the four `vault/Actions/Flesh/action.flesh.*.md` pages — the retired ninth Reach, now **bannered deprecated** (2026-08-28, THR-1333) but still **regenerable**: `src/data/world-model.json` still carries the `reach.flesh` node (12 refs), so `npm run generate-vault` would recreate the pages banner-less. The model-side removal is scoped to the content round of the 2026-08-28 context-cleanup program — until it lands, treat any regenerated Flesh page as stale on sight.
- `vault/Index.md` — lists the four Flesh actions without retirement markers; regeneration + banner-check scoped to THR-1335.

Everything else previously listed here (vault `Domain Word Scales`, vault `CLAUDE.md`, vault `Systems Overview` reach rows, `STYLE.md`, the old monolithic `state-of-game-design/SKILL.md`, the UL Quintessence definition) is **verified fixed** — say Eight Reaches, carry no Flesh rows.

**The canonical source is `src/types/traits.ts` `ReachDomain` type and the user verdict recorded here (2026-05-05). When any surface disagrees with this page, this page is correct.**

Historical remediation record: `Docs/audits/2026-05-05-cosmological-canon-drift-audit.md`.

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

Each of the 8 Reaches maps to an archetype-pair axis (the moral dimension in the Cosmological Pattern). The **virtue pole** (left) and **vice pole** (right) each carry a plain behavioral word that names how that pole shows up in a character. These axes drive encounter tilt in the encounter experience design.

| Reach | Virtue pole | Vice pole |
|-------|-------------|-----------|
| Iron | Protector (Brave) | Conqueror (Power-Hungry) |
| Gold | Patron (Generous) | Extractor (Greedy) |
| Shadow | Broker (Fair) | Manipulator (Scheming) |
| Veil | Weaver (Patient) | Unraveller (Impatient) |
| Heart | Sworn (Loyal) | Renegade (Disloyal) |
| Eye | Seer (Perceptive) | Inquisitor (Judgemental) |
| Stone | Keeper (Careful) | Destroyer (Reckless) |
| Star | Beacon (Guiding) | Wrecker (Misleading) |

**Behavioral words are deliberately plain** (not literary) for in-game readability — see the change note below.

**Note on 2026-06-29 revision:** Four pole names changed from the original 2026-03-28 brainstorm, and two terms relocated between reaches:
- Shadow: Saboteur → **Broker**, Deceiver → **Manipulator** (Shadow redefined around covert social leverage — the chaotic-good thieves-guild fixer — not just stealth/sabotage).
- Veil: Seer → **Weaver**, Manipulator → **Unraveller** (thread-motif: weaving vs unravelling the threads of fate/magic).
- Eye: Witness → **Seer**, Judge → **Inquisitor**.
- Star: Wanderer → **Beacon**.
- **`Manipulator` relocated Veil → Shadow** and **`Seer` relocated Veil → Eye.** Any content/code referencing these archetype names by reach must be checked against this table.

**Note on 2026-08-16 revision (THR-1135):** Stone's virtue *word* changed **Dependable → Careful**; the role name `Keeper` and the whole vice pole are unchanged. "Dependable" means *people can rely on you* — an interpersonal-trust reading that overlaps Heart's `Loyal`, so an agent legitimately holding both `Disloyal` (Heart) and `Dependable` (Stone) read as a contradiction wherever the chips appeared together. `Careful ↔ Reckless` is a clean antonym pair with no interpersonal-trust connotation. The registry (`src/types/axisRegistry.ts`) is the single source of truth, so chips, slider pole labels, the "has become X" event line and trait descriptions all follow from it.

**Source:** approved by user (creative director), 2026-06-29 — supersedes the archetype-pole names in `Brainstorms/brainstorm-cosmological-symmetry.md` (2026-03-28). See `Docs/plans/2026-06-29-archetype-virtue-vice-layer.md` for the full decision record and wiring spec. The 2026-08-16 Stone-word revision is likewise a creative-director decision, recorded in THR-1135.

### Key sources

- **Canonical iteration record:** `Brainstorms/brainstorm-cosmological-symmetry.md` (2026-03-28) — the session where Flesh was removed and Quintessence was defined
- **Implementation plan:** `Docs/plans/2026-03-28-cosmological-symmetry-refactor.md` (TB-075) — Phase 1 shipped; Phases 4–5 (documentation propagation) pending
- **Code source of truth:** `src/types/traits.ts` (`ReachDomain`), `src/engine/cosmology.ts` (`SPHERE_ALLIES`, `SPHERE_OPPOSITES`)
- **UL terms:** [Docs/ubiquitous-language/Cosmology.md](../ubiquitous-language/Cosmology.md)
- **Drift audit:** [Docs/audits/2026-05-05-cosmological-canon-drift-audit.md](../audits/2026-05-05-cosmological-canon-drift-audit.md) — full list of stale surfaces and remediation plan

## Active design plans

- [2026-07-30-sphere-governed-ascendant-decision-record.md](../plans/2026-07-30-sphere-governed-ascendant-decision-record.md) — **Sphere-Governed Ascendant pivot, parked (Idea).** Verdicted 2026-07-30: the god is sphere-governed; reaches demote to mortal-past echo; mortal magic is Veil-gated, sphere-bestowed ("Mortals reach through the Veil; gods are what's behind it"). **Interim guardrail: before authoring any new reach-keyed ascendant-facing content, read that decision record** — extend nothing the pivot (THR-870) would immediately unwind. Mortal-facing reach content is unaffected.
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
- ~~**`[[Nine Reaches]]` wikilink resolves to nothing**~~ — **resolved by THR-307** (verified 2026-08-28: `vault/Systems Overview.md` carries zero `[[Nine Reaches]]` links; `vault/Cosmology/Reaches.md` exists and carries the migration map).
- ~~**Stale documentation propagation**~~ — **Phase 5 (THR-307) landed 2026-05-05**; the Category-A sources were fixed. The residue that outlived it is in the § STALE-SOURCE WARNING above (vault Flesh pages + their `world-model.json` source), re-verified 2026-08-28 (THR-1333).

## Last-reviewed

2026-05-05 by user (Quintessence framing directly verdicted). Review trigger: monthly, or when any linked plan's status changes.
