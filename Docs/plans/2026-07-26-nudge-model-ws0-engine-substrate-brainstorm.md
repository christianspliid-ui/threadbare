# Brainstorm companion — Nudge Model WS0 engine substrate

**Plan:** `2026-07-26-nudge-model-ws0-engine-substrate.md` (THR-773). Alternatives considered and tensions surfaced during the design pass (largely litigated live with Christian across the 2026-07-25/26 session; grill-me skipped with rationale — the session itself was a multi-hour adversarial extraction, recorded in the program plan's verdicts).

## Alternatives considered

- **Persisted `broken` flag on the agent node** — rejected: a stored boolean drifts from the ratio it summarizes (the interface-map audit is a museum of stored-state-vs-derived-state leaks). Chosen: derive from threshold state per check + one `brokenSince` tick property for hysteresis only.
- **Nudges in background encounters too** — rejected: multiplies tick-loop cost for encounters nobody watches, and dilutes the curated-moment identity (Three-Beat Turn). The god's hand is where the god's attention is.
- **Riders modifying the d100 roll** — rejected: re-rolling or shifting the die breaks replay determinism guarantees; band-mapping riders keep same-seed-same-outcome while still being felt.
- **A new `nudge` node type** — rejected outright: no graph identity needed; nudges are template data + a transient id list on the in-flight action. Load-bearing rule "no new node types without verification" upheld.
- **Erosion redesign from scratch** — rejected: `quintessenceActions` already owns spend/erosion; we scale its existing call, preserving the balance-telemetry phase untouched.
- **Wiring all 61 orphans** — rejected: 44 are verbs no system ever dispatched (three paths checked by the audit); wiring them means *designing* a fourth dispatch system for content nobody missed. Wire only the progression-reward tier + the two monster/three faction pieces that have an obvious existing path.
- **Delete the 44 in this ticket** — rejected: deletion is WS5's kill batch with the audit citation; WS0 stays additive (NFP #6).

## Tensions surfaced

- **Brutal vs gentle breaking.** The mockup broke Kael in one catastrophe (0.5 erosion); the shipped default lands at 0.48 for an attended dire catastrophe — deliberately kept near the mockup's drama, because success-at-cost dominance means catastrophes are rare. The dial is four constants; Christian reviews the pacing, not the formula.
- **Hidden options vs learnability.** Hiding unavailable nudges entirely (ruling 4) risks the player never learning other spheres exist. Resolution: that is a WS2/codex concern (the codex can show the full vocabulary); the engine keeps hidden semantics.
- **Trait variants vs requiredTraits overlap.** Two mechanisms could collide (a trait both gating a template and varying it). Resolution: variants reuse the same `has_trait` resolution and apply after gating; a template gated away never reaches variant application.

## Vision premises invoked

Player-as-god (diegetic action, strengthened), Failure-is-plot (misfire bandProse mandated), capability-poor world (forecast words keep dread legible), the Two-Way Thread (mortal response to the god's nudge is the texture).
