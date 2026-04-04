# Encounter Pipeline: The Healer at the Ward-Gate

> Scale: short | Slug: wandering-healer-shrine-access | Pass: final
> Date: 2026-04-04 | Pipeline version: 1.0

---

## Status: READY WITH CAVEATS

### Caveats (acceptable v1 approximations)

1. **Thornwall Ward is not a distinct graph entity.** Bind to settlement location node. Ward-level governance exists only in prose. Ward reputation approximated via `reputation_tally` key.
2. **NPC disposition is scalar, not directional.** Maret's disposition stored as global `reputationScore`, not per-relationship.
3. **No `future_hook` consumer.** Critical success "precedent" can be recorded but nothing seeds follow-on encounters from it.
4. **Maret's itinerant status is not modeled.** She appears as a standard NPC in all systems except encounter prose.
5. **Family social standing has no mechanical surface.** Critical failure shame is narrative-only.

### Backlog items created

- Sub-settlement political units (wards/districts) — route to settlement model design
- Directional NPC disposition — route to TB-104 or social fabric enhancement
- `future_hook` consumer — route to TB-104 or encounter follow-on seeding

### Implementation file map

| Action | File |
|--------|------|
| Create | `src/data/encounter-healer-shrine-access.ts` — encounter template, support bundle, aftermath |
| Modify | `src/data/unified-action-templates.ts` — register in canonical unified registry |

---

## Editorial Notes Summary

**Verdict:** PASS WITH REVISIONS (two prose rewrites applied, no structural changes)

- **Linear Continuation:** Replaced narrator-commentary sentence ("as if she had always known the door would open") with character-rooted composure ("the way she gathered everything -- without haste, without thanks, as if haste and thanks were luxuries she had stopped carrying").
- **Aftermath Paragraph:** Replaced rhythmically monotonous tricolon about Jorik's mother with fragmentary declarative sentences conveying grief as thought rather than eulogy.
- **Linearity confirmed correct.** Outcome ladder does the work branching would do. Doctrine Split rejected — would flatten thematic ambiguity.
- **All inspiration anchors confirmed load-bearing.** None cosmetic.

---

## Encounter Packet

### 1. Inspiration Anchors

**Foundation references:**

- **Tonal Bible** -- "Cultural Mosaic with Internal Contradictions" shaped the district. The distrust is a wound, not a character trait. "Wonder Layered Over Grief" informed the healer's presentation.
- **Thematic Pillars** -- "Compassion vs. Power" is the central axis. "Order vs. Freedom" is secondary.
- **Anti-Patterns** -- Avoiding #8 (Helpful Exposition NPC), #9 (Clean Moral Binaries), #10 (Player as Savior).
- **Event Archetypes -- "Plague Wind"** -- Historical plague shaped the ward-gate's existence, Jorik's personal history, and community institutional memory.

**Dilemma Library:** Not consulted -- linear encounter, dilemma energy lives in outcome ladder.

### 2. Scale Justification

**Short.** Common world texture, not story-central. Seeds a reputation thread, gives the player a small act of compassion-versus-authority, establishes a named NPC who may recur. One intervention, one outcome ladder, modest consequence.

### 3. Pressure Knot

Maret (wandering healer, six years on the road) has arrived at a settlement where a child has bone-fever. Treatment requires moonwort from a shrine garden inside Thornwall Ward. The ward-gate has been closed to outsiders for 19 years since a plague killed 31 people. Gate-warden Jorik lost his mother to that plague. Maret asked; Jorik refused. She sits on a bench outside the gate. The child's family watches from a second-floor window. The district assembly meets in four days. The child may not have four days.

### 4. Intervention Fantasy

God-as-tender: nudging a social knot, not smashing a gate. Threading a needle between mercy and respect for community autonomy. The compelling part is the smallness — world-*tending*, not world-shaking.

### 5. Cast and World Objects

- **Maret** — wandering healer, mid-forties, unaffiliated
- **Jorik** — ward gate-warden, late fifties, lost mother to plague
- **Sick child's family** — visible from upper window, mother has spoken to Jorik
- **Thornwall Ward** — self-governing residential district
- **Ward-gate** — physical boundary with warden's alcove
- **Shrine garden** — inside ward, contains moonwort
- **Reputation channels:** Ward disposition, Maret disposition

### 6. Beat Structure

**One beat** — The Nudge. Player's agent encounters the standoff. Single divine intervention, outcome ladder determines result. No second beat.

### 7. Branching Profile

- **Branch depth:** `linear`
- **Branch count:** `0`
- **Linear — no branching.**

### 8. Branching Map

N/A — linear encounter.

### 9. Outcome Ladder

**Critical Success:** Jorik is moved — not overridden. Community consent. Maret treats child, invited to stay overnight. Quiet exception remembered. Positive reputation with both Maret and ward. Precedent created.

**Success:** Maret permitted under escort. Tense but functional. Child treated. Ward remembers an outsider was let in without incident. No lasting warmth.

**Success at Cost:** Maret gets through but Jorik's authority is visibly undermined. Child treated. Ward politics destabilized. Jorik becomes suspicious of divine interference. The cost of mercy was paid in someone else's authority.

**Failure:** Social fabric holds. Maret turned away, finds moonwort elsewhere (two-day detour). Child suffers longer but survives. Ward remembers a god tried and failed. Outsider ban feels validated.

**Critical Failure:** Intervention backfires visibly. Jorik rallies ward against both Maret and player's agent. Maret driven from entire settlement. Family shamed. Ward-gate policy hardens.

### 10. Sample Opening Paragraph

The healer had been sitting on the bench outside the Thornwall gate for three hours when the god noticed her. She was not dramatic about it. Her mule stood tethered to the bench's iron ring, its panniers half-open, bundles of dried comfrey and willow-bark visible in neat rolls. She had her hands in her lap and she was watching the gate the way a woman watches rain she cannot stop. Above her, in a second-story window framed by cracked plaster, a woman held a damp cloth to a child's forehead and looked down at the healer with the particular stillness of someone who has run out of things to try. The gate-warden stood at his post in the alcove beside the heavy oak doors, arms folded, jaw set. He was not enjoying this. He was a man who had buried his mother nineteen years ago because someone from outside the ward had brought a sickness through these same doors, and the rules he enforced were written in a language older than policy. They were written in grief. The healer knew it. She had not argued. She had simply sat down and waited, as if patience were a kind of medicine too, and perhaps it was, but the child upstairs was five years old and bone-fever does not wait.

### 11. Linear Continuation

The god leaned into the moment the way wind leans into a flame -- not enough to extinguish, just enough to bend. Inside the ward, something shifted. A neighbor who had been watching from her doorway for the past hour crossed the square and spoke to Jorik in a voice too low to carry. She touched his arm. He looked at her, and then at the bench where Maret sat, and his jaw worked like he was chewing something he could not swallow. The neighbor said something else. Jorik closed his eyes. When he opened them, he pulled the iron bolt and swung the ward-gate six inches open -- no wider -- and looked at the healer with an expression that was not welcome and was not refusal but was something more honest than either. "The shrine garden," he said. "Moonwort. Nothing else. I walk with you." Maret stood and gathered her satchel the way she gathered everything -- without haste, without thanks, as if haste and thanks were luxuries she had stopped carrying somewhere on the road between her fourth village and her fortieth. The mule stayed at the bench. She followed Jorik through the narrow gap in the gate and into the Thornwall Ward, and overhead the mother in the window pressed her hand against the glass and did not breathe.

### 12. Aftermath Paragraph

By evening, the child's fever had broken. Maret had ground the moonwort into a paste with something from her own kit -- a grey powder she did not name -- and applied it to the joints where the bone-fever settled. The child slept. Maret packed her satchel in the shrine garden while the shrine-keeper watched her from a distance that was not hostile but was not warm. Jorik waited at the gate. He had not spoken to her since the walk in. When she passed through the ward-gate on her way out, he pulled it shut behind her with more force than was necessary, and the bolt rang like a bell in the quiet street. Maret untethered her mule. The family did not come down to thank her; the mother would find her later, at the crossroads market, and press a bag of dried apricots into her hands without speaking, and Maret would accept them the same way. In the ward, Jorik sat in his alcove and stared at the closed gate. His mother had been kind to strangers. His mother had died for it. She would have opened the gate three hours earlier than he did, and she would have been wrong to do it, and she would have saved the child anyway, and he missed her.

### 13. Aftermath Reaction Choices

No reaction choices — consequence is clean.

### 14. Aftermath Kit Summary

**Curated visible changes:**
- Maret departs (or is driven out on critical failure). Disposition set by outcome tier.
- Ward outsider policy slightly tested (success) or hardened (failure). Ward-level reputation shift.
- Child recovers (success) or suffers longer (failure). On critical failure, family standing damaged.

**Notable marks/conditions:**
- Jorik's authority intact (success, failure), undermined (success at cost), or reinforced (critical failure).
- Maret's settlement access varies by outcome tier.

**What the world remembers:**
- Ward remembers whether a god pushed their gate. Colors future ward/divine/outsider encounters.
- Maret remembers whether she was helped. Carries into future encounters.
- Child's family carries quiet gratitude or quiet shame.

### 15. Support Bundle Contract

| Support object | Delivery mode | Source | Persistence | Future refs | Status |
|---|---|---|---|---|---|
| Maret (healer NPC) | lazy-materialize | Healer role. Spawn as encounter-specific support cast. | must-persist | Recurs as named NPC | author-now |
| Jorik (gate-warden NPC) | lazy-materialize | Guard/guard_captain at gatehouse. Reuse-first. | must-persist | Ward authority encounters | author-now |
| Thornwall Ward | pre-seeded (approx) | Bind to settlement node. Ward identity is narrative-only. | must-persist | Future ward encounters | live |
| Ward-gate | pre-seeded (approx) | Bind to gatehouse sublocation. | must-persist | Gate/boundary encounters | live |
| Shrine garden | pre-seeded | Garden sublocation at shrine/temple. | must-persist | Shrine access encounters | live |
| Moonwort | scene-only | Narrative prop, consumed. | scene-only | N/A | live |
| Ward reputation | pre-seeded (approx) | `reputation_tally` key on player agent. | must-persist | Ward disposition tracking | live |
| Maret disposition | lazy-materialize | Maret's `reputationScore` (scalar). | must-persist | Future Maret encounters | author-now |

---

## Systems Verdict Detail

See `wandering-healer-shrine-access-systems.md` for full audit including:
- Support bundle honesty assessment per object
- Missing primitive analysis (3 confirmed gaps, all non-blocking)
- Runtime feasibility confirmation (single-beat unified action, standard resolution pipeline)
- Aftermath supportability matrix
- Complete implementation file map
