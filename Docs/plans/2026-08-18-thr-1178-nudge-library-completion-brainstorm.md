# Brainstorm companion — Nudge library completion (THR-1178)

Companion to `Docs/plans/2026-08-18-thr-1178-nudge-library-completion.md`. Alternatives considered, tensions carried, and the Vision premises the plan leans on. Grill-me was skipped with rationale: the direction arrived settled from Christian in chat (2026-08-18) against a system already ratified and half-built (THR-883/885/887); the open decisions were completion phasing, enumerated below rather than extracted adversarially.

## The originating tension

Christian: *"a god who nudges the physics of the scene (a stumble, a spark, a surge of strength) is too specific… the current guidance over constrains the nudges. i think it would be interesting to have a nudge library… a set of generic nudge types that unlock based on the sphere scores of the god."*

The investigation found the library already exists (THR-887's Repertoire). So the honest framing of the work is **completion, not pivot** — which changed everything downstream: no new data model, no new access system, four gaps instead of one green-field.

## Alternatives considered and dismissed

1. **Deal hands from the repertoire now (full pivot).** The end-state where the library deals 4–6 generic cards into any encounter and per-encounter authoring shrinks to grounding. Dismissed *for now*: the locked format requires every card to pay off in prose at every outcome band, and that payoff prose is per-encounter (`bandProse`). A dealt hand needs generic per-type payoff fragments plus an enrichment seam — a real prose-architecture design, not a wiring ticket — and it would land mid-flight on THR-1130's 15-encounter retrofit. **Recorded as the likely next design** once B/C land: with authored faces and live mechanics for all 21 types, the fragment problem is the only remaining blocker. Revisit when THR-1130 closes.
2. **Essence *pool* as the sphere score.** Rejected: the pool is spendable, so playing cards would lock the cards — a punitive feedback loop. The score must be monotonic. Lifetime-earned essence per sphere is monotonic, deterministic, and matches THR-870's "passive accretion" language.
3. **Sphere-affinity ranking as the score.** The identity's affinities are a static ranking (THR-728: ranking only, not units) — static means no progression, so nothing to unlock against mid-run. Rejected.
4. **Re-keying base access to scores (identity becomes irrelevant).** This is THR-870's actual pivot — re-key gating from reach/identity to sphere requirements, flip signature matrices, clash trials. Christian parked that project by sequencing on 2026-07-30, and one chat message about nudge flavor is not an un-park. The contained version (attunement adds members; identity stays the door) delivers the felt experience — "my god's hand deepens along my spheres" — without touching the parked scope. The repertoire plan already called itself THR-870's first live surface; this is the second.
5. **One ticket per unbuilt card type (nine tickets).** Rejected as board noise; a single predicate ticket (`status !== 'impl'`) with independent per-type PRs matches THR-688 rule A and lets the executor land them incrementally.
6. **Minting new image-library slots for card art in B.** Rejected — THR-832 and THR-1170 already own image-library gaps; B assigns tags only where rows exist.

## Tensions carried into the plan

- **Spec edit mid-retrofit.** THR-1130 (In Dev) authors 15 encounters against the spec A rewords. Resolution: A is additive (widens lawful space, changes no gate), lands first, and the retrofit's batch cadence means each batch reads the spec at draft time. Mutex noted on both tickets.
- **The live-layer trap on attunement.** The `god_trait` unlock kind ships live-but-inert awaiting THR-791. A second inert unlock kind would be a lever that can't fail (nobody notices it broke). Hence the hard requirement: ≥2 attunement members seeded at the first threshold on spheres with shipped mechanics.
- **Guidance rewording is calibration, not new law.** "Influence, never authorship" is what the nudge pivot always meant — the rejected model was *choosing endings for mortals*, never *non-physical influence*. The physical example set was drift from the original THR-772 intent ("concrete, sphere-flavoured"), which always included dreams and omens (Compulsion and Omen are launch-vocabulary types).

## Vision premises invoked

- **Sphere-governed direction** (THR-870 decision record): spheres are the god's identity and power grammar; the hand should feel like *your* god's hand.
- **Roguelite variation over power** (Repertoire plan Decision 7.2): attunement members are siblings with twists, never strictly stronger — the anti-boredom engine, preserved.
- **Generated-within-constraints**: a generic library authored once, grounded per-scene by prose — the communication pivot's whole point, now with the library half actually authored.

## Open questions deliberately left to the executor

- Exact attunement threshold values (constants, wiki-iterated like `SPHERE_SIGNATURES`).
- Which two spheres get the seed attunement members (pick from C's earliest-shipped types).
- Whether Whisper's reveal needs a grant-vocabulary extension in `unifiedAction.ts` or fits the existing factor-line surface (both paths additive; executor decides at the seam).
