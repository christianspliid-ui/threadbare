# Action Proposal — 2026-07-30-sphere-governed-ascendant-decision-record

## intent_quote

> "what is going on here? the reaches in the ascendant character sheet does not correspond to the reaches in the left menu? check the code. as i player i dont understand the reaches in the left menu. why are they there? what are they for?"

> "well the issue is that the ascendant is a god, a being of magic, a force of nature, and as such does not work under the same rules as mortals. they have ascended to be able to shape the world in some sense, and so have become avatars of the spheres. this is from the core vision. […] almost everything an ascendant does through their cards will be defined as magic by a mortal, and i think should therefore better be governed by the spheres when we are in an ascendant context (i am still uncertain and would like to discuss). the ascendant also does not roll tests and do encounters, the agents do, which is what the reaches currently govern."

> "1. agreed. however make ascendant specific descriptions instead of reusing the mortals. make them more epic. remember they are ascendants and so as they ascended they were larger than life in many ways."
> "2. yes growth happens from threads (early design), sources (early design), worship (undesigned as far as i know). also we should discuss whether we should let the omen or doom system with ascendant unlocks/quests which can bestow godly power when completed."

> "1. lets be open to both / 2. i dont think we want sphere specific trials. all trials are about shaping the world and so should be about spheres clashing. / 3. i agree the whole area of power curve for ascendant growth is still rudimentary as we build the world and the mortals."

> (To the proposal "I write this up as a decision record in the repo, file one design issue for the sphere-governance pivot as future work carrying these verdicts, and one near-term UI ticket … Want me to go ahead with that write-up and those two tickets?") — "yes"

## scope (what this plan does)

Part A records the verdicted design direction (sphere-governed god, Veil-gated sphere-bestowed mortal magic, accretion + clash-trial progression) as a decision record feeding the parked THR-870, including the reversal of the "same rules as mortals" settled decision and an interim guardrail. Part B specs THR-869: a conservative two-surface legibility fix — label the sphere axis, rebuild the sheet's Dominion on the same live progression read the bar uses, and replace mortal tier words with a new god-register content table shared by both surfaces.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT implement any part of the sphere-governance pivot (no gating changes, no signature re-keying, no trial/worship systems) — all parked in THR-870.
- Does NOT edit CLAUDE.md's settled-decisions list now — that edit rides THR-870 activation, by design.
- Does NOT touch `DomainCard`, mortal surfaces, the Essence or Divine Threads sheet sections, encounter content, or any engine module.
- Does NOT design the mortal spell system or bestowal verb.

## impact_class

High-risk — Part A changes a load-bearing architectural decision's future direction (recorded, not yet implemented). Part B alone would be Reversible.

## evidence cited

- **Linear issue:** THR-869 (fix), THR-870 (deferred pivot), Sphere-Governed Ascendant project (Idea)
- **Vision premises invoked:** "avatars of the spheres" per Christian's core-vision statement (quoted above); `Docs/canon/cosmology.md` (8 Reaches × 12 Spheres orthogonal)
- **UL terms touched:** Reach, Sphere, Dominion, Signature (no new terms in Part B; pivot vocabulary rides THR-870 with UL-proposals)
- **Canon pages consulted:** `Docs/canon/cosmology.md`
- **Prior plan docs this builds on:** `2026-06-30-ascendant-reach-signatures.md` (THR-548/549), THR-613 player-action-progression lineage
- **Rejected approaches considered and dismissed:** sphere-specific trials (Christian verdict — clashes instead); relabel-only sheet fix (still drifts); immediate CLAUDE.md edit (canon and code must move together)

## load-bearing decisions touched

- "Ascendants use the same prerequisite system as agents… not a special-cased entity type. Power level is tunable, not structurally different." — Part A records its future reversal for the god's governing axis; no code changes it yet. High-risk class + user sign-off below.
- "Reaches and Spheres are orthogonal axes." — respected and sharpened (mortals: reach-gated access, sphere-flavored substance; gods: sphere-governed).

## high-impact files touched (from Codesight)

None. `AscendantSheet.tsx`, `ascendant-bar/selectors.ts`, and the new data file are leaf/near-leaf; no file on the ≥100-importer list is in scope. No Blast Radius section needed.

## kill criteria

- Part B: if playtest shows the god's reach rows reading as *less* legible than before (e.g., the epic register obscures tier meaning), revert to the shared read with plain rank labels — the data-source fix stands regardless of wording.
- Part A: the pivot is parked precisely because it may be wrong; the kill path is Christian marking the Sphere-Governed Ascendant project canceled, at which point the decision record's guardrail lapses and THR-870 closes unstarted. Nothing implemented needs unwinding.

## explicit user sign-off

Christian, 2026-07-30 (this chat): "yes" — in direct reply to "I write this up as a decision record in the repo, file one design issue for the sphere-governance pivot as future work carrying these verdicts, and one near-term UI ticket for the original bug you found… Want me to go ahead with that write-up and those two tickets?"

## author notes for the judge

The unusual shape: one doc serves two issues — a decision record for a deliberately parked pivot (THR-870) and a Ready-for-Dev spec (THR-869). The verdicts are verbatim from a live creative-director session, so intent fidelity risk is low; the main judgment call I made alone is the **interim guardrail** wording and deferring the CLAUDE.md settled-decision edit to THR-870 activation — Christian approved the banking plan generically, not that specific sequencing. The THR-869 scope line ("no pivot pre-build") is my conservative interpretation of his "still rudimentary… as we build" sequencing verdict.
