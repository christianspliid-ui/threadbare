# Ascendant Reach-Gated Signature Powers — Grill-Me Synthesis

**Date:** 2026-06-30
**Author:** Cowork (grill-me with Christian)
**Feeds:** the upcoming design doc for the reach-gated `invest.*` card set (unblocks THR-523)
**Project:** Ascendant Beats — Divine Cadence
**Related plan:** `Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md` §3.5, §4.3, §4.4

---

## 1. Scope under interrogation

The `reach-gated` bucket of the Ascendant action system is an empty, fully-wired socket: the `'reach-gated'` `ActionBucket` type, the `requiresReach?: ReachDomain` field, and the reach gate in `getTargetActionSlots()` all ship, but **zero `invest.*` card templates are authored** (THR-523). This grill defines *what those cards are* — the creative payload that turns "an iron-god" and "a veil-god" into mechanically distinct identities.

Hard constraint — the **two-domain lock**: every ascendant has a fixed primary + secondary reach (and primary + secondary sphere) for the whole run. A reach-gated card outside the player's two reaches is **permanently hidden, never surfaced**. Reach-gated cards are therefore the *signature powers of an identity*, and **coverage must be complete (all 8 reaches)** or some identities get a dead bucket.

Dimensions: **8 Reaches** (iron, gold, shadow, veil, heart, eye, stone, star) × **Spheres** (8 Creation: force/matter/energy/life/mind/spirit/time/entropy; 4 Foundation: chaos/order/light/darkness — elder/ruin-discovered).

---

## 2. Confirmed decisions

1. **New named powers, not variants.** Reach-gated cards are *new named signature powers*, not reach-locked premium versions of the generic four (imbue/consecrate/bestow/anoint). They reuse shared primitives but each carries an individualized layer.

2. **Ars Magica as the lodestar.** The system is a Technique × Form grammar that yields individually-named spells.
   - **Reach = Technique** — defines the *mechanic skeleton* (which primitive + which graph target).
   - **Sphere = Form** — supplies the *individualized layer* (the bespoke twist/condition, and the scaling — see #7).

3. **Individualization bar.** Every power must carry, on top of the shared primitive: (a) a unique **named effect with bespoke numbers**, and (b) a unique **trigger/condition**. Signature prose/visual and a defining cost/downside are welcome bonuses, not the floor.

4. **Authoring model — grammar-compositional with a bespoke veneer.** Author **8 reach skeletons** + a **sphere-individualization layer** (`sphere → twist/condition/name-fragment`, extending the existing `sphere_flavored_effect` primitive). Any (reach × sphere) composes into a named-feeling power so no player hits an empty cell; hand-author bespoke named spells for the highest-value intersections, expanding over time.

5. **Count — one signature per reach for v1.** 8 skeletons → a player holds exactly **2** reach-gated powers (primary + secondary reach), each sphere-individualized. Per-reach "spellbooks" (2–3 each) are the destination, not v1.

6. **Acquisition & value.**
   - Player gets **both** reach signatures (one per their two reaches), as two earned moments: primary-reach via the onboarding spine (Beat 4 "A Path Opens"), secondary-reach later via a pool `selection` beat. "Selection" = choosing target/flavor, not whether to receive it.
   - Power budget: **higher ceiling, not bigger numbers** — each signature *enables a strategy the generic four can't*, rather than being a stat bump.
   - Cost: **higher one-time essence than a generic verb**; sustained effects carry a per-tick cost or relic-buyout (reusing those primitives). Named constant per power.

7. **Scaling — sphere power drives magnitude.** General principle (broader than these cards): most actions scale **both effect and cost with sphere power**. Signatures hit harder and cost more as the relevant sphere is stronger. (Supersedes the thread-tier/reach-affinity scaling floated during the grill.)

8. **Namespace.** `invest.<reach>.<name>` (e.g. `invest.veil.rend_the_gate`), not the shipped `action.*` prefix — keeps the reach-gated set self-grouping and greppable.

9. **The 8 signature powers (v1):**

| Reach (canon meaning) | Signature (v1) | Target · primitive(s) | Strategy unlocked | Second card (later) |
|---|---|---|---|---|
| **Iron** (force, martial, direct confrontation) | **Warhost / Call to Arms** — raise & lead an army | faction/agent · faction-mobilization (**new effect**) + chosen-status | Military conquest engine; pairs vs Gold's economic snowball | Divine Wrath (empower a champion to win a decisive confrontation outright) |
| **Gold** (wealth, patronage, trade) | **Patronage Network** — a seat that siphons prosperity into divine income | location/faction · sustained `ControlEffect` income | Essence/prosperity snowball | — |
| **Shadow** (covert social leverage) | **The Broker's Web** — covert intel on a faction's plans + invisible nudging | faction · hidden-mark + intelligence grant | Information asymmetry + covert manipulation | — |
| **Veil** (magic, ritual, thread-weaving) | **Rend the Gate** — tear a rift to your sphere's home plane, amplifying that sphere's influence in the area | location/region · sphere-influence amplification (**new effect**), sustained | Reshape local cosmic conditions; sphere-individualization is *intrinsic* | Awaken the Gifted (grant a mortal true arcane spellcasting) |
| **Heart** (loyalty, bonds) | **Sworn Oath** — *stub: loyalty aura on co-located threads* | agent/site · `co_located_thread_aura` | Devoted inner circle (full retinue deferred) | Full retinue version (gated on Tavern & Party) |
| **Eye** (knowledge, judgment) | **The Deep Eye** — elder/prehistoric lore, cultural insight, locate + understand hidden places/people | region/culture · Clue/intelligence grants + reveal | Discovery & understanding of the hidden/elder layer | — |
| **Stone** (endurance, craft, building) | **The Great Work** — build a unique location (legendary forge/deep mine) + forge extra-powerful artifacts | location/artifact · spawn-unique-location (**new effect**) + artifact creation | Construct one-of-a-kind wonders | — |
| **Star** (travel, fate, distance) | **Beacon of Fate** — long-distance influence + a fated quest that draws agents across the map | agent/world · `encounter_seed` (quest) + ranged reach-bonus | Breaks the locality every other verb assumes | — |

---

## 3. Agent recommendations (⚡) carried into design

- ⚡ **Heart stub now, not hold.** Ship the minimal loyalty-aura core so a Heart-identity player never sees an empty bucket; `Deferral` for the full retinue version gated on Tavern & Party. (Confirmed by Christian.)
- ⚡ **Iron expands around "influencing conflict behavior."** Warhost (A) is v1; Divine Wrath (C) is the natural second card — both shape conflict. (Confirmed framing.)
- ⚡ **Veil's gate makes sphere-individualization intrinsic** — the rift opens to *your* sphere's home plane, so the sphere isn't a cosmetic flavor on Veil, it *is* the mechanic. Strongest expression of the Reach×Sphere grammar in the set.

---

## 4. Parked-then-resolved

- **Iron signature** — first proposal (Fortify Bloodline) rejected as too slow/genetic; resolved to Warhost/Call to Arms.
- **Veil signature** — first proposal (Seed Prophecy) rejected (foresight migrates to Eye/Star); resolved to Rend the Gate (sphere-plane rift), with Awaken the Gifted as the second card.
- **Eye** — refocused from generic "all-seeing" to the elder/prehistoric knowledge + discovery niche.
- **Stone** — refocused from "warding aura" to building uniques (locations + superior artifacts).

---

## 5. Unresolved grey zones (verify during design)

1. **Creation-only sphere pool?** Assumed ascendant chargen spheres are the 8 Creation (Foundation = elder/ruin magic), making the live matrix 8×8. **Verify against `src/engine/ascendant.ts` chargen** before sizing the sphere-individualization table. If Foundation spheres can be a chargen sphere, the matrix is 8×12 and Veil's gate can open onto chaos/order/light/darkness.
2. **"Sphere power" — the exact engine quantity.** Confirm the read used for effect/cost scaling (sphere affinity? a derived sphere-strength scalar? `sphereModifiers`). The scaling formula and its constant(s) depend on it.
3. **Veil "Rend the Gate" downside.** Tearing the veil should plausibly carry risk (something comes through — entropy/chaos leakage, a hostile manifestation). Open design detail; candidate for the individualized trigger/condition.
4. **Heart retinue dependency** — confirm the party/retinue feature home (Tavern & Party, Social Systems Expansion) and what the stub→full seam looks like.

---

## 6. Open risks & assumptions

- **Not pure content.** Gold, Shadow, Heart-stub, Star, and most of Eye sit on shipped primitives (content-only, possibly Codex-eligible). But **Iron-Warhost** (army mobilization), **Veil-Rend-the-Gate** (sphere-influence amplification), and **Stone-Great-Work** (build-unique-location) each need at least one **new engine effect**. → This is a small epic spanning Engine + Content + UI, not a single content issue. THR-523 (the catalogue-consumer half) becomes one leaf of it.
- **Sphere-power scaling is a cross-cutting principle**, not local to these cards. Introducing it here should be designed as a reusable scaling helper + constants, mindful of existing cost/balance, not a one-off.
- **Coverage completeness is a correctness property**, not a nicety: the two-domain lock means every one of the 8 reaches must yield at least a composed-default signature on day one, or some identities ship broken.
- **Unlock pacing**: primary-reach signature via spine Beat 4, secondary via a pool selection beat — needs the Director's selection-beat path to surface reach-eligible cards correctly (interacts with THR-516 eligibility predicates already shipped).

---

## 7. Inputs for the upcoming design doc

- **Engine pillar:** three new effects — `faction_mobilize_warhost`, `sphere_influence_amplify` (sustained, sphere-keyed), `spawn_unique_location` + an "extra-powerful artifact" forge path; a reusable **sphere-power scaling helper** (effect + cost) with named constants; the sphere-individualization table primitive (extends `sphere_flavored_effect`).
- **Content pillar:** 8 reach skeletons; the `sphere → twist/condition/name-fragment` individualization layer; bespoke named spells for high-value (reach × sphere) cells; `ASCENDANT_ACTION_BUCKETS` reach-gated entries with `requiresReach` (this is THR-523's surface); pool/selection beats that grant them.
- **UI pillar:** reach-gated card rendering in AscendantHand (already reach-gated by `getTargetActionSlots()`); the unlock-moment card-flight; selection-beat picker showing the player's two eligible reach signatures; HexMap signifiers for built uniques / opened gates / warhosts.
- **Proposed issue structure (epic):** (1) sphere-power scaling helper + constants [Engine]; (2) sphere-individualization table primitive [Engine/Content]; (3–5) the three new engine effects [Engine, one each]; (6) reach-skeleton + bucket catalogue authoring incl. THR-523 [Content]; (7) content-only signatures authoring (Gold/Shadow/Star/Eye/Heart-stub) [Content, Codex-eligible]; (8) selection-beat acquisition wiring [Engine/UI]; (9) Heart full-retinue `Deferral` gated on Tavern & Party.
