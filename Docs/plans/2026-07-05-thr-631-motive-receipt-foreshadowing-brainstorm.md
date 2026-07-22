# Brainstorm companion — Motive-Receipt Foreshadowing (THR-631)

*Captures the design dialogue behind `2026-07-05-thr-631-motive-receipt-foreshadowing.md`. Sources marked.*

## The trigger (user, verbatim)

> "the feature that shows an agents motivation for choosing the encounter they have chosen does not work really well. the prose is not interesting or relevant enough, and breaks in certain situations. help me design a better prose resolving algorithm for his, and in general for our encounters for generating interesting contextually relevant prose"

Screenshot evidence: "Kael has heard of trouble in Weave a Political Alliance. They believes they can be useful there…" — title in place slot, agreement failure, tooltip overlapping the Auto chip.

## Alternatives considered

1. **Quick repair only** (fix grammar, typed slots, stub signals; keep architecture). Rejected by user — prose would stay generic; the motive signal would still be fake.
2. **Authoring-first** (double down on per-encounter variants, the original THR-389 bet). Rejected by user + evidence: 1 of ~40+ templates backfilled in ~2 months. Betting on authoring throughput that historically doesn't materialize.
3. **Runtime LLM prose.** Not considered seriously — canon rejected approach (determinism, NFP #3).
4. **Reconstruct motive at read time from richer heuristics** (improve the funnel-drop analysis). Rejected: any read-time reconstruction is a guess; the decision-time scorer already has the ground truth. Emitting a receipt at the moment of choice is strictly more honest and cheaper.
5. **Chosen: motive receipts + clause composition, authored overrides on top.** (Cowork proposal, user verdict 2026-07-05.)

## Tensions surfaced

- **Composition ceiling vs authoring ceiling.** Composed prose will never hit the 10/10 exemplar bar of hand-written encounter prose. Accepted: composition is the *floor* (always true, always grammatical, combinatorially varied); authored variants remain the ceiling for marquee encounters. Mirrors the settled hybrid-layered-engine decision.
- **Receipt as property vs edge.** "Relationships are edges" rule pressure-tested: the receipt is decision-internal data about *why*, not a relationship; nothing needs to traverse encounter→choosers-by-reason today. Property chosen; promotion to edge named as the future path if traversal need appears.
- **Truth vs belief.** Should expectation prose reflect actual success probability or the agent's intel-limited belief? Belief chosen — dramatic irony is the point of the surface (original THR-389 goal, preserved).
- **Tooltip legitimacy.** Original plan said "not a tooltip"; one shipped anyway. Rather than relitigate, user chose: keep both surfaces, one source, tooltip = single plain-register sentence (THR-609 voice).

## Vision premises invoked

- Player-as-god reads mortal minds through threads (portfolio Beat 1).
- Prose-first UI: mechanics through narrative, never numbers.
- Narrative tiebreaker: resolve toward living/complex over flat/numeric.
- Plainspoken Malazan voice (THR-609): plain baseline, rationed lyricism, interactive text always plain.
