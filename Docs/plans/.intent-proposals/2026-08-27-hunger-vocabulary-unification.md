# Action Proposal — Hunger vocabulary unification (THR-1213)

## intent_quote

> **Design-session ticket** — second of the three wave-1 plan docs ruled at the wave-1 sitting (THR-1163 resolution, 2026-08-22). Runs after the shared-machinery doc (native blocker) so the machinery is proven on this small engine seam before the region-identity design.

> Design the single hunger vocabulary: which catalog survives, which key scheme, how the resonance reader and the dilemma themes are brought into one id space, and the migration for shipped content. Apply the shared machinery's typed-seam pattern (paired live resolver + no-op gate) — this seam is the machinery's first real generalization proof, which is why it runs second.

> Done-when: Plan doc in `Docs/plans/` per design governance, linking the map decision tickets inline where used; moved to Ready for Dev with a coordination block. Strangler, never big-bang.

(Ticket authored by Christian; session started from his chat ask: "hey lets get some design work promoted to ready for dev".)

## scope (what this plan does)

Designs the single hunger vocabulary: one merged `HUNGER_CATALOG` (field union of the two same-named exports, living in `src/data/hunger-catalog.ts`), bare `HungerId` canonical with a template-literal `StoredHungerId` for the persisted dotted form (`toHungerId` remains the sole bridge — no save migration), and a closed `ResonanceTag` union for all thematic tag fields. Splits the ambiguous `hungerResonance` field into its two honest meanings (vignettes keep id-membership, re-typed; the dilemma-side field retires with its 10 measured-dead entries). Wires the resonance weight into the **live** `selectDilemmas` path with an identity-derived lens (the V2 module and the stub-lens memo are production-dead, verified this session), and charters the content pass (labeling `emotionalRegister` on 157 empty dilemmas from the closed union) that makes the weight actually fire, gated by a non-vacuous no-op contract test.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT activate the dormant lens-overlay prose engine (`resolveLensOverlay` / `shouldFireMortalEcho`, authored `lensOverlays`, echo prose) — keys are re-typed only; activation is chartered as a Deferral.
- Does NOT change any meeting-flow surface, prose string, slot structure, or THR-868 formative-test behavior — only *which* eligible template wins a slot.
- Does NOT consume the `WorldRef` type from THR-1212 — deliberately (hunger ids are committed concept literals, not world-object references); the doc records the machinery kill-criterion check as PASS-no-shape-change.
- Does NOT migrate stored `AscendantIdentity.hungerId` values — the dotted persisted form stays; typing tightens around it.
- Does NOT rewrite dilemma prose — the content pass labels tags from a closed union only.
- Does NOT touch encounter templates, the tick loop, graph node/edge types, or HexMapV2.

## impact_class

Reversible. (All runtime changes are additive-parameter or measured-dead deletions inside one feature flow; no CI-blocking gate is added in the design itself — the no-op gate lands advisory and flips blocking only when the content pass completes, within the executor ticket.)

## evidence cited

- **Linear issue:** THR-1213
- **Vision premises invoked:** hunger-as-obsessive-lens (remembrance design, THR-891 header prose); no-numerals-on-player-surfaces (selection-side only)
- **UL terms touched:** Hunger, Ascendant Lens, Resonance (no new UL terms minted; `ResonanceTag` is a type name, not a glossary term — if the executor disagrees, a UL-proposal is the route)
- **Canon pages consulted:** `Docs/canon/systems-inventory.md` (no hunger row; meeting/dilemma/remembrance rows located), `Docs/canon/interface-map.md` (no audited hunger contract — UNAUDITED, audit-on-touch table included), `Docs/canon/process.md` (session rules), rulebook-quick-reference
- **Prior plan docs this builds on:** `Docs/plans/2026-08-27-shared-anchor-machinery.md` (THR-1212 — the typed-seam pattern, the followOnTags deletion precedent, the build-time fail-loud exception)
- **Rejected approaches considered and dismissed:** all-dotted and all-bare key schemes (save-migration / mass-rename for zero gain); tags-everywhere and ids-everywhere resonance semantics (each re-creates the mismatch or duplicates the theme channel); value-pair-derived resonance term (measured constant-within-pool — differentiates nothing); wiring `selectDilemmasV2` in (would re-port eligibility the live picker already has). Full table in the brainstorm companion.

## load-bearing decisions touched

- **"Everything is a graph node/edge"** — respected; no new node/edge types, no property-bag relationships. Hunger ids are catalog literals, not graph state.
- **"No inventing node types without verification"** — none invented.
- **Seeded PRNG everywhere (NFP #3)** — the plan adds a draw-count discipline note so the additive lens param cannot perturb existing seeded outcomes.
- No load-bearing decision is changed.

## high-impact files touched (from Codesight)

None ≥100 importers. `src/types/index.ts` (225) and `src/types/traits.ts` (250) are imported, not modified. Highest touched: `src/types/remembrance.ts` (bounded consumer set). The plan doc carries a short Blast Radius note stating this rather than a full table.

## kill criteria

In the plan doc (`## Kill criteria`): (1) coverage unreachable without prose rewrites → stop the content pass, comment measured cost on the doc, re-scope; (2) draw-count discipline impossible without forking the picker → surface on the doc before any V3 picker; (3) `ResonanceTag` union churns weekly → propose the string+lint fallback as an amendment. Plus the inherited THR-1212 kill-criterion check, answered in-doc (PASS, no shape change).

## explicit user sign-off

(Not required — Reversible class.)

## author notes for the judge

- The session's re-measurement materially extended the ticket's premise: the reader module (`selectDilemmasV2`), the lens memo, and the overlay engine are ALL production-dead, and only 10/167 dilemmas carry any resonance data. The plan therefore includes reader *wiring* and a content *labeling pass* — both defensible as inside "a resonance weight that can actually fire" (the ticket's own title) and "migration for shipped content", but a strict reading of "design the vocabulary" could call the content pass scope growth. I judged the ticket title decisive: without data, no vocabulary fix makes the weight fire.
- The machinery doc's coordination block declared "Mutex with: THR-1213 … it consumes slice 1's type and slice 2's catalog". This plan reverses that mutex with the recorded reason (the design consumes neither — file-disjoint), per THR-688 rule B's verifiably-inapplicable clause. If the judge reads the map's ordering as binding *execution* order regardless, say so — the fallback (keep the mutex, THR-1213 execution waits for THR-1212 slices 1–2) costs only latency, not design.
- Deletions (second catalog, V2 module, dead memo, dead field, dead-vocabulary fixtures) each carry measured zero-consumer evidence in the doc; NFP #6 is scored PASS-with-note on the followOnTags precedent.
