# Action Proposal — 2026-05-04 encounter build toolkit (eval fixture)

> **Calibration fixture.** Reconstructed for THR-412. Ground truth not visible to the judge — see eval-run write-up for outcome comparison.

## intent_quote

> "The v7 UI is a single scaffold. An encounter is not a one-off bespoke design — it is a selection of primitives from the world graph, composed into the v7 slots. Variety comes from primitive selection, not parallel UI systems. The toolkit's job is to make every primitive in the codebase a candidate the encounter author can pull from, render in a known slot, and animate in a predictable way."
>
> (Cowork's framing of the analysis brief, from §1 Premise of the plan doc. The plan doc is positioned as "companion to `2026-05-04-encounter-experience-v7.html` and the player-journey analysis" — i.e. the brief was set by the v7 UI direction the user had just blessed and the player-journey work already in flight.)
>
> No single Linear THR was filed for this analysis pass; it was the third doc in a same-day Cowork session converging the encounter-experience design (the player-journey analysis and `encounter-experience-v7.html` are the other two). The intent quote is the doc's own framing rather than a user message because the user-facing direction at this point was "explore and synthesize" rather than "ship a feature."

## scope (what this plan does)

Enumerates the 28 implemented primitives in the codebase plus 3 confirmed gaps, groups them by what they contribute to a scene (actors / place / state-that-travels / social fabric / narrative scaffolding / cosmic-rare). Maps every region of the v7 encounter UI to which primitives fill which slots, with the filter rules and reflow behavior named per slot. Names the three load-bearing rules the encounter authoring agent must respect (Path over adjective; Moral axis is structural; Encounter-specific verbs not a fixed vocabulary). Specifies the encounter authoring contract — the structured document an author writes and the renderer fills into v7 slots. Walks four worked examples (gate, tavern, court, ritual) exercising different primitive subsets. Names the seven variety levers an author tunes per encounter.

## scope (what this plan does NOT do — explicit non-goals)

- Does not ship encounter content — this is the toolkit specification, not authored encounters.
- Does not commit to the three proposed gap primitives (`encounter_template` as graph node, `relationship` reified node, `blessing/curse/mark` as distinct nodes) — flagged as desirable but explicitly not blocking.
- Does not finalize the seven still-open questions (encounter templates as graph nodes, relationship state primitive, item consumption in leans, etc.) — those are deferred to a long-form plan ticket.
- Does not update canonical docs (`Systems/Domain Word Scales.md`, `Systems/Fate Forecast.md`, `Systems/Action Narrative System.md`, `Vision/taste-profile.md`, new `Systems/Encounter UI.md`) — listed as required updates that happen in the long-form plan ticket scope.
- Does not pick the encounter-authoring agent's actual implementation (which is its own future ticket).

## impact_class

Read-only. The doc is labeled "Status: Analysis" and explicitly positions itself as a synthesis pass that feeds a future long-form design plan. No code is written; no decisions outside the analysis itself are committed; the doc names "Verdict question for the user" at the end (§9) as the gate before any forward-binding decisions are made. The judge spec maps "audits, research syntheses, retros with no proposed change" to Read-only.

## evidence cited

- **Linear issue:** none — this is a Cowork-initiated synthesis pass that fed the long-form plan ticket scope. (See author_notes for why this happens for some autonomous analysis docs.)
- **Vision premises invoked:** `Vision/taste-profile.md` "Three intervention verbs" (resolved as encounter-specific verbs); the cosmological pattern from `Brainstorms/brainstorm-cosmological-symmetry.md` (8 reaches + Quintessence, 1:1 sphere↔reach pairs, archetype pole pairs per reach).
- **UL terms touched:** Reach, Sphere, Quintessence, Reach Domain, Lean, Lean Card, Sphere Influence, Archetype Pole, IPK (in-prose-knowledge), Encounter, Beat — all canonical UL terms; the doc reads from the UL and does not propose new terms.
- **Canon pages consulted:** `Docs/canon/cosmology.md` (Reaches and Spheres), `Docs/canon/encounters.md` (encounter pipeline canon).
- **Prior plan docs this builds on:** `2026-05-04-encounter-experience-v7.html` (the v7 UI mock); the player-journey analysis (same day, Cowork session predecessor); `Brainstorms/brainstorm-cosmological-symmetry.md` (cosmological pattern); `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §10.4 (the catalog-surface direction).
- **Rejected approaches considered and dismissed:** AgendaPicker as a player-facing menu (dissolved into engine prose-lookup, per Rule 1); fixed three-verb vocabulary (replaced by encounter-author-written per-scene verbs, per Rule 3); Flesh as a ninth reach (retired and replaced by Quintessence as a meta-property).

## load-bearing decisions touched

The cosmological-symmetry pattern (8 reaches + Quintessence, 1:1 sphere↔reach pairs) is a load-bearing design decision and the plan respects it strictly: Rule 2 (Moral axis is structural) is the load-bearing application; the reach→sphere→archetype-pole table in §1.1 quotes the canonical mapping. CLAUDE.md's Rejected Approaches §"Intervention wheel (AgentWheel) — replaced by ActionDrawer with context-filtered cards via Generalized Action Targeting" is also relevant — the plan honors it (the hand panel filters by scene relevance; no AgendaPicker step). No load-bearing decision is being changed; the plan reads from and reinforces them.

## high-impact files touched (from Codesight)

None. The plan touches zero `src/` files — it is an analysis doc in `Docs/plans/`. The doc references high-impact files (e.g. `src/types/graph.ts`, `src/types/effects.ts`) only to enumerate the primitives those files implement; no changes to them are proposed in this pass.

## kill criteria

The plan's "Verdict question for the user" (§9) is the kill criterion: if the user disagrees with the primitive enumeration, the slot mapping, or the worked-example coverage, the synthesis is sent back for revision before the long-form design plan is written. The §8 Resolved-during-Vision-audit items name what was already validated; the Still Open items are explicit deferrals to be resolved in the next plan ticket — not implicit punts.

## explicit user sign-off

Not required. Impact class is Read-only; this is analysis the user can accept, redirect, or reject without code consequences.

## author notes for the judge

Two limits the judge should weigh fairly: (1) **No Linear issue.** This doc was authored as the third in a same-day synthesis pass (`encounter-experience-v7.html`, player-journey analysis, this doc). The author's instruction was to converge the encounter direction across all three. There is no single user message that maps to "Cowork, write this exact doc." The intent quote in this proposal is therefore the doc's own framing of its task; the judge should score Intent Fidelity (dim. 1) against that brief, not penalize the absence of a quoted user line. (2) **No three-pillar scope.** This is a synthesis / analysis pass on a UI direction; the plan doc explicitly does not ship engine work, content, or new UI surfaces. The judge should map "three-pillar status" to "all three explicitly out of scope — synthesis only" per the Read-only impact class, not penalize for missing implementation sections. The interesting calls in this doc are: the three load-bearing rules (Rule 1–3), the explicit dissolution of AgendaPicker into engine prose-lookup, and the cosmological-pattern anchoring of every lean. The four worked examples exercise meaningfully different primitive subsets — they are the doc's evidence that the toolkit covers the variety the v7 scaffold needs.
