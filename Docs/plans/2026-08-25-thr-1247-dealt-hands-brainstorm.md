# Brainstorm companion — Dealt hands (THR-1247)

Companion to `Docs/plans/2026-08-25-thr-1247-dealt-hands.md`. Grill-me skipped with rationale: the direction and the hybrid constraint were settled with Christian in chat (2026-08-18 "worth revisiting once the card faces and mechanics exist" → 2026-08-24 "are we ready for that now?" → 2026-08-25 "ok lets try"); the open decisions were architectural, enumerated and resolved below.

## The decision that shaped everything: where do a dealt card's mechanics live?

Three candidates:

1. **Per-type defaults** (21 profiles). Rejected as primary: members within a family exist precisely to differ ("same verb, different twist/cost channel" — Repertoire plan Decision 7.2); per-type numbers would flatten the progression the library was built to carry.
2. **Per-member profiles** (~40). **Chosen.** Matches `CARD_CONTENT`'s member-keyed shape, keeps structure/content/mechanics as three parallel tables joined at assembly (the file's own stated architecture), and makes every dealt number data.
3. **Synthesized from type + sphere at runtime.** Rejected: numbers computed by formula are not tunable per card (NFP #1) and produce profiles nobody authored or play-tested.

Same shape for band fragments: per-member, with the per-type fallback explicitly *rejected for v1* but named in the kill criteria as the retreat position if seam echoes prove unmanageable — per-type fragments with member inserts is the halfway house we retreat to, not forward to.

## Alternatives considered and dismissed

- **Deal with a seeded PRNG stream** (shuffle feel). Rejected: WS0's zero-PRNG hand property is load-bearing (replayability, saves, the attended ladder's determinism contract), and a new stream perturbs nothing only if nobody else ever draws from it — a guarantee that decays. Score-and-select with id tie-breaks gives identical hands for identical states, which is also the *inspectable* behavior ("why this hand" has an answer). Variety comes from repertoire growth and context tags.
- **Replace authored hands outright** (pure dealing). Rejected: kills the encounter-specific card — the Swollen Ford's rope, the apotheosis's capstone choices — and would invalidate THR-1130's in-flight retrofit. Hybrid was also the explicitly agreed constraint in chat.
- **Extend `buildNudgeHand` itself to deal.** Rejected: it is a pure partition function with seven callers and a locked contract; composing upstream (mint, concatenate, then partition as today) keeps its semantics and tests untouched.
- **A `dealtHand` field on the template rather than the step.** Rejected: hands are per-step (nudge-bearing steps differ in reach and stakes); the declaration belongs where the hand lives.
- **Free-text context tags.** Rejected: free text rots into a folksonomy no selector can score; a closed union documented in the spec is the same call the setting-envelope classes made (THR-884).
- **Emitting a `nudge.hand_dealt` trace.** Rejected for v1: assembly runs on the render path (double-fire risk), and the deal is pure/replayable — the same argument that leaves `buildRepertoire` traceless. The `__DEBUG` deal report + TSV column carry inspectability; post-commit causality already flows through dispatch traces.

## Tensions carried

- **Seam echoes** (spec trigger 22): a generic fragment abutting authored band prose is the highest prose risk. Mitigations: fragments authored to describe the god's influence (a register lane authored band prose rarely occupies), editorial pass on the six exemplar seams, kill criterion with a named retreat design.
- **THR-1130 mid-flight:** engine ticket parallel-safe; content ticket mutexed on the spec and lands between batches; remaining batches may opt into composed hands per batch brief — director samples them exactly as before.
- **Convergent hands:** if every god sees the same fill, dealing failed at its own purpose. Measurable (TSV column), kill criterion attached, weights tunable.

## Vision premises invoked

- North star's intervention menu — the god's known toolkit present in every scene.
- Roguelite loop — repertoire progression (attunement members, echo cards) finally *visible* in ordinary play, not just in the collection.
- Generated-within-constraints — authored-once generics, grounded per-scene by prose and binding.

## Open questions deliberately left to the executor

- Whether the dealer lives in `nudges.ts` or a sibling `dealHand.ts` (both additive; pick for test ergonomics).
- Exact `DealContextTag` first-cut membership beyond the 8 reaches (the plan suggests 4; trim or extend against the shipped corpus's actual step shapes).
- Which 2 members serve as the engine ticket's reference profiles (pick from universal core + one signature so both access paths are exercised).
