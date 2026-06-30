# The Core — Quintessence Foundation Personality Layer

**Date:** 2026-06-29
**Author:** Cowork (with Christian Spliid, creative director)
**Status:** Design complete — ready as a user story in the Agent Personality epic
**Project:** Agent Personality & Moral Drift
**Depends on:** THR-525 (canonical axis registry + scalar unification)
**Touches:** THR-524 / `Docs/canon/cosmology.md` (Star reach axis re-scope)

## Summary

A second, more fundamental personality layer — **the Core** — sits *beneath* the 8 reach-linked moral axes. Where the reach axes describe how an agent acts in a domain, the Core describes **who the agent fundamentally is**: their bedrock orientation toward others and toward their own continuity. The Core is the foundation; the reach traits build on top of it.

This design is the synthesis of three independent proposals that converged strongly (5 traits, near-identical set, same framing, same seed/colour/no-cap relationship, same overlap findings).

## The Core continuum set (5)

Plain virtue↔vice pole words, house style:

| Continuum | Governs | (Seed) |
|-----------|---------|--------|
| **Warm ↔ Cold** | care for others' wellbeing vs treating them as instruments | compassionate |
| **Hopeful ↔ Bitter** | expects things can improve vs expects ruin | optimistic |
| **Forgiving ↔ Vengeful** | releases a wrong vs keeps the ledger | forgiving |
| **Humble ↔ Proud** | right-sized, correctable self vs inflated, uncorrectable | humility |
| **True ↔ False** | inner self matches outer / keeps word vs wears a face | trustworthiness |

Five because it matches the five creative-director seeds and stays small enough to read as *bedrock* (a five-word character fingerprint) without rivaling the 8-axis reach layer — if it had 8 it would read as a parallel reach layer, defeating "more fundamental."

## Framing — Core vs Quintessence (canon-safe)

**Do NOT make goodness a pole of the Quintessence scalar.** Canon Quintessence = narrative presence / integrity-of-self / threadbare-ness (sovereign-and-central vs thinning-and-written-out). Wiring "goodness raises Quintessence" would make villains mechanically thin out of the story — breaking canon and tone (a powerful villain is high-presence AND morally bankrupt).

Instead: **the Core and Quintessence are co-resident on the same foundation layer, beneath the reaches, but are different things.**
- **Quintessence (scalar)** = *how much of the self is left* — how present, sovereign, hard-to-bend.
- **The Core (5 continuums)** = *who that self is.*

They couple **directionally, not evaluatively**: Quintessence sets *how bendable* a thinning agent is; the Core sets *which direction they bend*. A Vengeful, Proud, Bitter agent at low Quintessence is bent toward escalation; a Warm, Hopeful, Forgiving agent at the same low Quintessence is bent toward over-trust and being used. **True ↔ False** is the most Quintessence-native trait — integrity-of-self literally *is* the canon definition — so a False self (shown ≠ real) leaks Quintessence and a True self banks it. Morality and presence stay orthogonal; all four corners of the (presence × goodness) grid produce real characters (vivid central villain; fading saint nobody listens to).

**Naming guard:** call the layer **the Core**; never call it "Quintessence traits" in UI/UL — that invites the conflation. In prose, Core surfaces as *character* ("a warm, unforgiving woman"); Quintessence surfaces as *presence* ("she filled the room").

## Layered relationship — Core → reach (mechanical)

The Core **seeds** and **colours** the reach traits; it never **caps** them.

1. **Seed (birth).** Core is rolled first; each reach axis is then drawn with a *pull* toward the pole its linked Core trait implies (a probability tilt, not assignment — preserves variety). Warm seeds Gold→Generous and Heart→Loyal; Humble seeds Iron away from Power-Hungry; True seeds Shadow→Fair and Eye→Perceptive; etc. Tunable `CORE_SEED_WEIGHT`.
2. **Colour (runtime).** Same reach value reads differently by Core: a Brave (Iron) act reads as courage on a True self, as swagger on a Proud/False self. The reach trait decides *what*; the Core decides *how it reads* — a prose/enrichment tint, no extra mechanical axis.
3. **Bend-direction (low Quintessence).** As Quintessence falls, the Core sets which way the agent can be manipulated (above). Optionally Core traits themselves drift toward vice as the self thins.
4. **No cap.** A Cold agent is not forbidden high Gold-Generosity; the cold philanthropist and the honest schemer are exactly the characters that make the world feel alive.

**Invariant:** the Core does not duplicate the reaches and is never auto-derived from them (or vice versa). It is a separate field set; capability remains a third, separate thing ([[2026-06-29-agent-personality-moral-drift]] personality≠capability invariant extends to Core≠reach≠capability).

## Overlap resolutions (the switching analysis)

- **Star — re-scoped (creative-director verdict, 2026-06-29).** Star's old axis (Inspiring↔Discouraging) was an *inner disposition* masquerading as a reach behavior. The inner outlook moves to the Core as **Hopeful ↔ Bitter**; Star's reach axis re-points to its real domain — wayfinding/fate. **New Star reach pole: Beacon (Guiding) ↔ Wrecker (Misleading)** (a beacon guides ships home; a wrecker's false lantern lures them onto the rocks). This updates the THR-524 canon table and the axis registry.
- **Iron — clarify, no rename.** "Power-Hungry" keeps only the Iron-domain *appetite for force/dominance*; the *inflated, uncorrectable ego* belongs to the Core's **Humble↔Proud**, which seeds Iron toward Power-Hungry. 
- **Shadow vs True↔False — keep both, orthogonal.** Shadow's Fair↔Scheming = covert *method*; True↔False = self-presentation. The test cases: a **True schemer** (honest fixer who works angles, keeps his word) and a **False fair-dealer** (deals openly, breaks promises). Document the seam in the systemic-wiring guide so content authors don't collapse them.
- **Warm vs Gold/Heart — keep.** Warm = general care; Generous/Loyal = domain expressions Warm seeds. Assert non-derivation.

## Three-pillar

**Engine** — 5 Core continuums as a separate per-agent field (0–1, 0.5 neutral) in the unified personality model (THR-525); the seed/colour/bend mechanics; Core origin-vignettes feeding the baseline (same machinery as reach origin vignettes, [[2026-06-29-agent-personality-moral-drift]]); the Star reach-axis re-scope in the registry. **Content** — Core origin-vignette library (pre-history one-liners tagged to Core axes), Core emergent-trait definitions (at threshold), the Beacon/Wrecker Star content + reconciliation of old Inspiring/Discouraging references, seam documentation. **UI** — character-sheet Core section rendered *above/beneath* the reach section so the layering reads (who they fundamentally are → how they act per domain); browser-verified at 1920×1080.

## NFP

Tunability (seed weight, thresholds = named constants) · Inspectability (traces for Core seeding, emergence, bend-direction) · Determinism (seeded birth draw) · Fail-soft (missing Core → neutral 0.5, no bias) · Additive (new field set; the one destructive edit is the Star re-scope, coordinated with THR-525's registry work) · Narrative-over-mechanical (the whole point).

## Rulebook impact

None (autonomous agent character, not a player rule of play). The Star re-scope changes a cosmology *label*, not a rule.

## Open items for the executor

- Land after THR-525 (uses the unified 0–1 model + registry).
- Re-scope Star in the registry + `Docs/canon/cosmology.md` table (Beacon/Wrecker, Guiding/Misleading) and reconcile old Inspiring/Discouraging references — coordinate with THR-524's shipped behavioral-word layer.
- Author the Core origin-vignette + emergent-trait content; document the Shadow/True-False and Forgiving/Shadow seams.
