<!-- plan-doc-lint-exempt: brainstorm companion, not a plan doc -->

# Brainstorm companion — Meet The First nudge conversion (THR-868)

Alternatives considered and why they lost. Verdict sources: Christian grill 2026-07-30 (`2026-07-30-meet-the-first-nudge-conversion-grill-me.md`).

## Rejected: success always writes the virtue pole

The obvious band→soul mapping (success = virtue, failure = flaw) is perverse: a god who *wants* a ruthless First must deliberately tank the roll, which turns the failure bands into an optimization target and inverts the model. The pole-lean-on-nudges design keeps direction in the god's hands (physics: which memories/sensations you strengthen) while fate keeps cleanliness — and failure genuinely surprises (opposite pole), which is verdict 1's whole point.

## Rejected: bond can fail

Honest to the model, but a dead end at minute one of a run is a wall, not a story — and the mortal-turns-away beat has no second surface to land on this early (no chronicle reader yet, no second candidate flow). "Bond always forms, failure writes scars" keeps every band a playable First. Revisit only if Meet-The-First recurs mid-run after losing a First (the "once shielded" option), which is out of scope here.

## Rejected: literal WS2 interface with no dressing

Maximum consistency, but the meeting is the game's cold open — losing the cinematic stage (dark screen, portrait, scene art) costs more onboarding warmth than the consistency buys. Dressed WS2 components get both: the player's hands learn the real controls inside the meeting's presentation.

## Rejected: retire the dilemma library / author fresh

167 templates of strong scenario material (the *moments* are good; the prose register and the either/or mechanics are what's wrong). Fresh authoring at spec quality would cost more than conversion and lose scenario breadth. Convert in place with register rewrite; batches with a coverage predicate control the volume risk.

## Rejected: tutorial currency / free nudges

A fake economy teaches a fake game. Real essence with a cost cap (`MEETING_NUDGE_COST_CAP`) delivers the same guarantee without a second currency or an unlearnable exception.

## Rejected: extending `StepNudge` with `poleLean`

Would put a meeting-only concept on a 278-importer type (`src/types/unifiedAction.ts`) and drag a Blast Radius section + regression surface into a ticket that doesn't need it. Structural extension (`MeetingStepNudge`) gives WS2 machinery compatibility for free.

## Rejected: 3–4 formative tests

Each nudge-native test is ~2–3 minutes of reading and deciding. Four rolls before gameplay is onboarding debt; two formative + the bond climax gives an arc (rising stakes, biggest roll last) at ~5–8 minutes.

## Rejected: "unset weave" framing (Christian, post-judge chat gate)

The author's framing for fate-rolled formative moments — the mortal's past settling as the god watches — was offered and rejected. Christian chose present-tense trials instead: the defining moments happen *now*, during the meeting. Costs more conversion work (scenarios re-situated from childhood memories into present situations; irreducibly-childhood templates killed), but the fiction is simpler and matches the register mandate (describe events happening, not memories crystallizing).

## Open thread carried forward

- Whether **Spark** should eventually become a nudge played *into* the bond test rather than a menu — Christian scoped it out (verdict 2: Testing only), but the "Testing + Spark" option is the natural next iteration if the spark's investment ever reads as picking an authored future in playtests.
