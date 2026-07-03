# Action Proposal — Ascendant Reach-Gated Signature Powers

## intent_quote

> "grill me on the invest card set. first get me up to speed"

> "new named powers. we can use the same primitives, but every power must have an individualized layer. as inspiration look at the magic system from Ars Magica."

> (on grammar/individualization, count, acquisition, cost) "i agree with you recommendations" / "lets go with your recommendations." / "agree with these to start"

> Iron: "i like A and C because they play on influencing conflict behavior. A prefferred."

> Veil: "how about manipulating the spheres more effectively, being able to rend open a gate to the spheres home plane and so strengthening the spheres influence in the area? I also like C."

> Eye/Stone: "eye should be more focused on knowledge of the prehistoric layer, insights into cultures, ability to find hidden places or people and understand more about them, stone should probably give the ability to build unique locations and artifacts (a unique forge or mine, extra powerful artifacts)."

> Heart: "hold on Heart until party and retinue, or maybe just put in placeholder stubs"

> Q13 scaling: "i think in general we want most actions to scale with sphere power (effect) and cost"

> "sure lets go." (proceed to full three-pillar plan doc + epic restructure)

## scope (what this plan does)

Designs the `reach-gated` `invest.*` signature card set for the Ascendant action system: one named signature power per Reach (8), built on an Ars Magica Reach=Technique × Sphere=Form grammar, individualized + scaled by the ascendant's primary sphere. Specifies three net-new engine effects (`signature_warhost`, `sphere_influence_amplify`, `spawn_unique_location`), a reusable sphere-power scaling helper, a sphere-individualization matrix, the bucket catalogue (unblocking THR-523), acquisition beats, UI signifiers, and a 10-issue epic structure under THR-499. It deliberately does NOT author the second-card-per-reach spellbook, the per-account meta layer, or the full Heart retinue.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT add per-reach spellbooks (multiple signatures per reach) — v1 is one-per-reach.
- Does NOT build the full Heart retinue signature — ships a loyalty-aura stub; full version is a Deferral gated on Tavern & Party.
- Does NOT touch the per-account/points unlock meta (THR-480 seam) — within-run unlocks only.
- Does NOT rebuild shipped primitives (THR-509) or the reach gate (THR-503) — reuses them.
- Does NOT add Foundation spheres to chargen — sphere matrix is Creation-only (8×8) per verified chargen.
- Does NOT key scaling on secondary sphere or thread tier in v1 — primary-sphere only.

## impact_class

Reversible — additive engine union extensions + new leaf modules + content data + Linear issues. No destructive migration; no load-bearing decision changed.

## evidence cited

- **Linear issue:** THR-523 (unblocked), parent epic THR-499; siblings THR-500/503/505/508/509/516/517 (Done — reused).
- **Vision premises invoked:** two-domain lock (settled 2026-06-26, parent plan §3.12); "Reaches = what you do / Spheres = what fuels it" (orthogonal axes).
- **UL terms touched:** Reach, Sphere, Ascendant, signature (new term candidate — may warrant a `UL-proposal`).
- **Canon pages consulted:** `Docs/canon/cosmology.md` (reach meanings + virtue/vice poles), `Docs/canon/rulebook.md` (rules-of-play impact, §9).
- **Prior plan docs this builds on:** `Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md` (§3.5/§4.3/§4.4); `Docs/plans/2026-06-30-ascendant-reach-signatures-grill-me.md` (the grill synthesis / brainstorm companion).
- **Rejected approaches considered and dismissed:** reach-locked premium *variants* of the generic four (rejected — user chose new powers); bespoke-per-cell authoring (rejected — grammar-compositional chosen); Iron Fortify-Bloodline (rejected — too slow/genetic); Veil Seed-Prophecy (rejected — foresight migrates to Eye/Star).

## load-bearing decisions touched

- **"No inventing node types."** Respected — warhost = faction-owned force on existing node forms; throne/unique-location/gate are `location` nodes with property flags + edges, not new node types.
- **"Relationships are graph edges, not property fields."** Respected — `controls`/`commands`/`thread` edges for warhost, seat, unique location; `chosen`/`mobilized`/`unique` are node-internal status properties (legitimate per-node data).
- **"Everything is a graph node/edge."** Respected.
- **Mutated-in-place / version counters.** Plan calls `worldVersion`/`structuralCacheVersion` touches on spawn/mutate (§6).

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (high importers) — additive union extension (3 effect kinds); Blast Radius §3.12 present.
- `src/engine/targetActions.ts` (high importers) — no change (reach gate shipped).
- `src/types/gameState.ts` (~176) — no new fields expected; flagged to confirm.

## kill criteria

- If sphere-power scaling makes signatures swingy/unbalanced in CLI smoke (a strong-sphere warhost trivializes the map, or rift-leak griefs the player), revert to flat magnitude (constants already isolate this — `SIGNATURE_SCALE_CEIL → 1.0`).
- If the three new engine effects each balloon beyond one executor-day, ship the 5 content-only signatures (Gold/Shadow/Star/Eye/Heart-stub) first so the bucket is non-empty for those identities, and stage Iron/Veil/Stone behind their effect issues.
- If playtest shows reach-gated cards don't read as identity-defining, the grammar (skeleton × sphere) is wrong before the flavor is — revisit the Technique/Form split, not the card list.

## explicit user sign-off

Not High-risk; not required. (User did say "sure lets go" to drafting + epic restructure, 2026-06-30.)

## author notes for the judge

- The local checkout was stale (behind `origin/main`); code-existence claims are grounded in the Linear Done record + worktree copies, not the stale main tree (plan §2.1). The three net-new effects are net-new regardless of tree freshness.
- The trickiest creative call the user made is Veil = "Rend the Gate" (open a rift to the primary sphere's home plane to amplify local sphere influence). I designed it so sphere-individualization is intrinsic (the rift opens onto *your* sphere), with a seeded leak downside as the individualized condition. Flagging in case the judge reads it as scope creep — it is directly the user's words.
- Heart is deliberately a stub to avoid an empty reach-gated bucket for Heart-identity players under the two-domain lock; the user offered "hold or stub" and I recommended stub, which they OK'd.
- Coverage completeness (all 8 reaches) is treated as a correctness property, not a nicety, because the two-domain lock makes a missing reach = a broken identity.
