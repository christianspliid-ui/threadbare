# Brainstorm companion — Hunger vocabulary unification (THR-1213)

Plan doc: `Docs/plans/2026-08-27-hunger-vocabulary-unification.md`. This file records the
alternatives considered, the tensions, and the premises — the thinking the plan's rulings rest on.

## What the session actually found (beyond the ticket)

The ticket ([THR-1213](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key))
names a value-level mismatch: dilemma `hungerResonance` authored as hunger ids, read against theme
tags, zero fires across 167 dilemmas. Re-measuring against the current tree confirmed that and
found the seam is one layer deeper — **the entire enrichment layer around the mismatch is
production-dead**:

- `selectDilemmasV2` / `scoreDilemmaResonance` (`src/engine/dilemmaSelection.ts`) — the module
  containing `HUNGER_RESONANCE_WEIGHT` — is imported **only by its own test**. Both live meeting
  paths (`MeetTheFirstFlow.tsx:159`, `MeetingEncounterModal.tsx:127`) call the old
  `selectDilemmas`, which takes no lens and does no resonance scoring at all.
- `src/engine/ascendantLens.ts` (lens-overlay prose engine: `resolveLensOverlay`,
  `shouldFireMortalEcho`) — imported only by its own test. The 167 dilemmas' authored
  `lensOverlays` and echo prose have no reader.
- `GameView.tsx:609` builds an `ascendantLens` memo from the **archetype stub** — and the variable
  is never consumed. The god's *chosen* remembrance hunger influences dilemma selection nowhere.
- Only **10 of 167** dilemmas carry any resonance data at all (non-empty `emotionalRegister` /
  `hungerResonance` / `driveResonance`) — the original enrichment batch; the other 157 have empty
  blocks.

So "make the weight fire" is not a one-line reader fix. It requires: one vocabulary, a wired
reader, a real lens, and authored data. The plan scopes all four; the overlay prose engine's
*activation* is explicitly deferred (it is a UI/experiential decision about the redesigned
formative-test flow, not a vocabulary question).

## Alternatives considered

### A. Which id scheme is canonical — dotted, bare, or both-typed?

| Option | Verdict |
|---|---|
| **All-dotted** (`hunger.witness` everywhere; migrate the engine union and every bare-keyed map) | Rejected — touches every engine consumer (`HUNGER_UNIQUE_CARDS`, `godVoiceByHunger`, lens overlays, `SPHERE_TO_HUNGER`) for zero behavioral gain; the bare union is the type TypeScript can narrow on. |
| **All-bare** (migrate the remembrance catalog, prose maps, vignettes, and stored identities) | Rejected — `AscendantIdentity.hungerId` is **persisted dotted in saved worlds**; a stored-form migration buys nothing and breaks saves unless the bridge stays anyway. |
| **Bare-canonical + typed dotted storage** (`HungerId` bare; `` StoredHungerId = `hunger.${HungerId}` `` template-literal type; `toHungerId` stays the single bridge) | **Chosen.** Zero data migration, zero save migration; the dotted form becomes *derived from* the bare union at the type level, so the THR-891 outage class (a form the other side doesn't know) becomes a compile error. This is also the honest description of what the tree already does post-THR-891 — the design names it and closes the untyped gaps. |

### B. What does `hungerResonance` mean?

The field's own doc comment says "Hunger IDs **or** resonance tags" — it was born ambiguous, and
the two shipped usages diverged: vignettes author dotted ids and are read by id-membership
(**works**, the one live usage); dilemmas author bare ids and are read against theme tags
(**dead**). Options:

| Option | Verdict |
|---|---|
| **Ids everywhere** — dilemma `hungerResonance: HungerId[]`, reader compares the god's hunger id | Rejected as the *dilemma* channel — binary per-dilemma, and requires hand-tagging 167 dilemmas with hunger names, duplicating what theme tags already express. Kept as the *vignette* semantics (already live). |
| **Tags everywhere** — retype the field as tags, keep the current reader | Rejected — silently converts the 10 shipped id-entries into never-matching tags again (the same failure class, inverted), and leaves one field name meaning two things across the two data sets. |
| **Split the concepts** — `hungerResonance` *always* means hunger-id membership (vignettes keep it, re-typed `StoredHungerId[]`); dilemma-side resonance runs on **theme-tag overlap** (`emotionalRegister` × the hunger's `dilemmaResonanceTags`) and the dilemma-side `hungerResonance` field **retires** | **Chosen.** One field name, one meaning; the dilemma channel becomes graded rather than binary; the retired field's 10 entries are measured-dead (0 fires ever) — a `followOnTags`-class deletion with the evidence in this doc. |

### C. Where does the firing signal come from, given 157/167 dilemmas have no tags?

- **Derive from dense fields (value-pair affinity)** — score hunger→`targetValuePair` via
  `candidateReachBias` × `REACH_VALUE_PAIR`. Measured against the selector's actual pool
  structure: slot pools are *pre-filtered* by category + value pair / reach, so this term is
  **constant within every pool** and differentiates nothing. Rejected on that measurement — it
  would be a weight that fires and changes no outcome (a subtler form of dead).
- **Author the tags** — a content pass over the 167 from a closed tag union. **Chosen.** It is
  the only channel that differentiates within pools, it also feeds the (deferred) mortal-echo
  threshold, and it is exactly the "migration for shipped content" the ticket names. Cost is
  bounded: 2–4 tags per dilemma from a closed list, mechanical-adjacent authoring.
- **Do both** — rejected; the derived term adds a constant, not a signal (see measurement).

### D. Wire `selectDilemmasV2` in, or fold scoring into `selectDilemmas`?

V2 was written as the replacement but never wired; the live picker has since grown eligibility
the V2 module lacks (archetype gating, `locationSubtypes`, THR-868 `test` carriage at the
instance boundary). Wiring V2 means re-porting all of that into a module whose only advantage is
already-written scoring. **Chosen:** fold the scoring (and the anti-resonance valve, and the two
weights) into the live `selectDilemmas`; retire `src/engine/dilemmaSelection.ts`. One picker,
sunset-by-default on the unwired duplicate — the same shape as the two-catalog kill.

### E. Does this seam consume `WorldRef` (the THR-1212 machinery)?

No — and this is the machinery plan's own kill-criterion check, answered deliberately: a hunger
id is a **committed concept literal** (binding form 1 in that doc), not a reference to a
per-world graph object. There is nothing to resolve against the live graph and nothing for
`resolveWorldRef` to drop. What generalizes is the **pattern**: canonical typed union → single
data authority → one resolver that fails soft (`toHungerId`) → no-op gate proving shipped content
actually fires in a seeded world. The `WorldRef` type's shape needed no change — kill-criterion
**PASS**, recorded on [THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)
at handoff. Consequence: the machinery doc's provisional mutex ("THR-1213 consumes slice 1's type
and slice 2's catalog") is verifiably inapplicable at the file level, and the coordination block
reverses it with this reason (THR-688 rule B).

## Tensions

- **Additive-over-destructive vs. two dead duplicates.** The plan deletes a module
  (`dilemmaSelection.ts`), a catalog export, a field, and a dead memo. Each deletion carries
  measured zero-consumer evidence in the plan doc; NFP #6 yields to sunset-by-default exactly as
  the machinery doc's `followOnTags` precedent established.
- **Scope creep toward the overlay engine.** The authored `lensOverlays` + echo prose are
  tempting (already written, evocative) but activating them is an experiential decision about a
  flow THR-868 has since redesigned. Deferred with a ticket rather than smuggled in.
- **Content pass size.** 167 dilemmas × 2–4 tags is real authoring. Mitigation: closed union
  (no invention), per-dilemma text already states its themes, and the coverage gate makes "done"
  measurable instead of vibes.
- **The stub lens survives.** `?view=game` (identity-less) still needs a lens; the stub stays as
  the fail-soft floor, now clearly labeled as such rather than being the only lens anyone builds.

## Vision premises touched

- **Hunger as the god's obsessive lens** (remembrance design, THR-891): the meeting should feel
  different per hunger. Today that holds for prose (opening/bond lines, vignette bias) but not
  for *which formative tests appear* — the plan closes that gap, which is a Vision-serving change,
  not a Vision edit.
- **No numerals on player surfaces**: resonance is selection-side only; nothing new renders.
- **Player-as-god framing**: untouched; the meeting flow's surfaces are unchanged in layout.
