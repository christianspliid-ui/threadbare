# Agent Personality & Moral Drift

**Date:** 2026-06-29
**Author:** Cowork (with Christian Spliid, creative director)
**Status:** Design complete — ready for implementation breakdown
**Project:** Agent Personality & Moral Drift
**Depends on:** THR-524 (canonical virtue/vice axis vocabulary)

## Summary

Make each agent's personality legible and self-shaping: agents are *born* with moral leanings composed of visible backstory vignettes, their *choices* push those leanings, defining moments can *permanently* reshape them, and the resulting personality **strongly and visibly** steers which encounters they seek and which choices they make inside them. The outcome is that an agent's personality shines through in their behavior.

This is largely a **unification and completion** of systems that already exist (`AxiologicalProfile`, `ArchetypeDrift`, the trait system, encounter scoring, branching encounters), plus one genuinely new subsystem (autonomous in-encounter choice) and one content workstream (origin-vignette library).

## The model

### Two orthogonal per-reach numbers (load-bearing invariant)

Every agent carries **two distinct numbers per reach**, and **neither is derived from the other**:

1. **Domain Capability / affinity** — how good and inclined the agent is at the reach's *actions*. Drives prerequisites and success/failure. (Existing system — `domainContributions`, capability meters.)
2. **Personality axis** — where the agent sits on the reach's **virtue↔vice** moral pole. Drives the *moral flavor* of choices, never competence.

> A fearsome Iron warrior (high capability) may be **Brave/Protector** or **Power-Hungry/Conqueror** — identical competence, opposite soul. Capability decides whether they succeed; personality decides which path they reach for.

**Invariant for implementers:** personality-axis values and capability values are stored, mutated, displayed, and consumed through separate fields and separate scoring terms. Origin/personality traits contribute to the axis via a **new `axisContributions` field**, kept entirely separate from the existing `domainContributions`.

### Canonical scale

Personality axes use a **0–1 scale, 0.5 = neutral**, virtue pole at 1.0, vice pole at 0.0. This matches the creative-director framing (baseline 0.5, trait thresholds 0.8 / 0.2, deltas in 0.05 increments). The existing `ArchetypeDrift` scalar is −1…+1; the unification normalizes everything to the 0–1 representation (internal storage may remain signed, but the canonical/author/UI scale is 0–1).

The 8 axes and their pole labels are the canonical set defined in THR-524:

| Reach | Vice (0.0) ← → Virtue (1.0) |
|-------|------------------------------|
| Iron | Power-Hungry ← Conqueror · Protector → Brave |
| Gold | Greedy ← Extractor · Patron → Generous |
| Shadow | Scheming ← Manipulator · Broker → Fair |
| Veil | Impatient ← Unraveller · Weaver → Patient |
| Heart | Disloyal ← Renegade · Sworn → Loyal |
| Eye | Judgemental ← Inquisitor · Seer → Perceptive |
| Stone | Reckless ← Destroyer · Keeper → Dependable |
| Star | Discouraging ← Anchor · Beacon → Inspiring |

### The layered personality stack

An agent's personality on each axis is built in three layers:

1. **Baseline** = sum of all **permanent axis-contributing traits**:
   - **Origin vignettes** — assigned at birth, small signed deltas, each a one-line pre-history vignette ("Grew up poor in a heartless city" → −0.10 toward Greedy). Drawing several small ± deltas yields a roughly normal distribution of baselines for free (central-limit). Permanent.
   - **Formative marks** — rarely earned mid-life from a defining encounter that flags a permanent shift. Same machinery as origin vignettes, but `source: encounter`, author-gated to be rare. Permanent. These *move the baseline itself*.
2. **Drift** — the running sum of temporary deltas from ordinary encounter choices (±0.05…±0.20). Decays slowly **toward the current baseline**, so a streak of behavior fades if unreinforced but defining marks persist.
3. **Live position** = clamp(baseline + drift), 0–1. This is what behavior and trait-emergence read.

4. **Emergent personality traits** flare when the live position crosses a threshold: **≥0.8 → virtue trait** (e.g. "Generous"), **≤0.2 → vice trait** (e.g. "Greedy"). They appear and disappear as the position moves, with a hysteresis dead-band (grant at 0.8/0.2, release only after falling back inside ~0.65/0.35) so they don't flicker.

The character sheet then tells a layered story: **who they were born as** (origins) → **what marked them** (formative marks) → **what their recent choices are making them** (drift/live position) → **who they currently are** (emergent traits).

## Engine pillar

- **Scalar unification.** Collapse `AxiologicalProfile` (standing position, biases selection) and `ArchetypeDrift` (per-choice accumulator) into one coherent model: the profile holds the **live position** per axis; the drift mechanism (`applyDriftMagnitude`) is the *applicator*; the threshold/announce layer reads the profile. Normalize to the 0–1 canonical scale. Retire the duplicated/parallel representation.
- **Canonical axis registry.** A single constants module mapping each reach → axis id → virtue/vice pole labels (from THR-524), replacing the fragmented names across `AxiologicalProfile` ValuePairs, `archetypeDrift` axisId, reputation-trait names, and `EncounterArchetypePole`.
- **`axisContributions` field** on trait definitions — per-axis signed personality delta, separate from `domainContributions`. Consumed only by the baseline computation.
- **Birth seeding phase / generation hook.** At agent generation, draw origin-vignette traits such that the per-axis sums approximate the desired normal distribution; compute the baseline as their sum. Only nonzero contributions produce a visible trait.
- **Drift application from choices.** Choices apply a signed delta to the live position via the existing applicator. Default deltas are *temporary* (decay toward baseline).
- **Formative-mark primitive.** A `permanent: true` variant (a new aftermath/choice effect, e.g. `axiological_mark_apply { axisId, signedMagnitude }`) that mints a permanent axis-contributing trait instead of temporary drift — raising/lowering the baseline. Author-gated; rare by content discipline.
- **Decay toward baseline.** Extend the existing decay phase to pull drift toward the (now mutable) baseline rather than toward a fixed zero.
- **Threshold → emergent-trait phase.** New tick phase (sibling to `processEncounterMastery`): for each agent × axis, grant/release the personality trait at the hysteresis thresholds; emit a trace and a "becoming" chronicle event.
- **Personality → selection (strong & legible).** Strengthen the existing `axiologicalProfile → computeDesireScore → desireMultiplier` path with a high weight so agents clearly gravitate to encounters matching their dominant axes; emergent-trait `scoringModifiers` reinforce it. Add a labeled `personalityBias` signal to the score assembly + `ScoringTrace` for inspectability.
- **Autonomous in-encounter choice (new subsystem).** Today only the player branches; non-hero agents pass/fail or take `reactions[0]`. Replace the `reactions[0]` default in `resolveAftermathContextForAgent` with a **deterministic, profile-aligned chooser** (rank branches/reactions by alignment between the agent's profile and each option's reach-pole; "strong & legible" → near-argmax with deterministic tie-break). Add a tick-loop caller so non-hero agents walk authored choices in-character, apply drift, and resolve aftermath. Emit a `reaction_selected` trace with per-option alignment scores.

## Content pillar

- **Origin-vignette library** — the major content workstream. One-line pre-history vignettes, each tagged `(axisId, signed magnitude)` at granularities 0.05 / 0.10 / 0.15 / 0.20, both poles, all 8 axes. Minimum viable ≈ 8 axes × 2 poles × ~8 vignettes ≈ 130+; more is better for variety (fits the context-multiplication / encounter-volume appetite). Plain, evocative, generic enough to attach to many agents.
- **Authored choice poles.** Add explicit `moralAxis` + `pole` + `magnitude` to `AuthoredChoiceCard`, replacing the inferred `toEncounterArchetypePole` heuristic — authors declare which pole a choice tilts and how hard.
- **Formative-mark authoring.** A small set of defining-moment encounters/choices that use the `permanent` flag — rare by design. Authoring guidance + the systemic-wiring-guide entry.
- **Personality trait definitions** (8 × 2) for the emergent traits, carrying `scoringModifiers` (behavior bias). New `personality` subcategory (kept distinct from `reputation` = how the world sees you), reusing the existing scoring-bonus consumer.
- **Prose readability pass** on the 23 branching encounters — shorten sentences, retire the recurring "the particular X of Y" tic — folding in the creative director's "too literary" note. Plus fix the stale `reach: 'flesh'` value in tavern content.

## UI pillar

- **Character-sheet personality section** in `AgentDetailPanel` — render the live position per axis (virtue/vice leaning), the emergent traits, and the contributing origin vignettes + formative marks as their own styled, tooltip-rich rows. Add the new `personality`/`origin` subcategories to `TRAIT_CATEGORY_COLORS` / `LABELS`. Reuse `DriftVisualiser` / `MoralAxisTilt` components.
- **"Becoming" notification** — a chronicle/alert beat when a trait crystallizes ("Kael has become Greedy"); the "becoming" prose already exists.
- **Browser-verify** at 1920×1080 (DOM via Playwright for the sheet; screenshot + console per Definition of Done).

## Wiring

| Module | Orchestrator phase | UI surface | GameState flow | Traces |
|--------|-------------------|-----------|----------------|--------|
| Birth seeding | generation hook | sheet origin rows | `axisContributions` traits on node | `personality_origin_seeded` |
| Drift apply | choice resolution / aftermath | drift visualiser | live position on profile | existing drift traces |
| Formative mark | aftermath effect | sheet mark rows | permanent trait on node, baseline ↑/↓ | `axiological_mark_applied` |
| Threshold trait | new personality phase | sheet trait row + notification | `has_trait` edge | `personality_trait_emerged` |
| Selection bias | `phaseAgentDecision` | (none) | read profile | `ScoringTrace.personalityBias` |
| In-encounter choice | new caller in agent decision | (chronicle) | aftermath applied | `reaction_selected` |

Update `Docs/plans/wiring-checklist.md` for the new phase, effect kind, GameState fields, traces, and the personality sheet section.

## Constants (tunable, NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `PERSONALITY_NEUTRAL` | 0.5 | Axis midpoint |
| `PERSONALITY_TRAIT_VIRTUE_THRESHOLD` | 0.8 | Grant virtue trait at/above |
| `PERSONALITY_TRAIT_VICE_THRESHOLD` | 0.2 | Grant vice trait at/below |
| `PERSONALITY_TRAIT_RELEASE_BAND` | 0.15 | Hysteresis dead-band |
| `PERSONALITY_DRIFT_DELTA_*` | 0.05–0.20 | Per-choice temporary deltas |
| `PERSONALITY_DRIFT_DECAY_PER_TICK` | tune | Drift→baseline decay rate |
| `PERSONALITY_SELECTION_WEIGHT` | high | Strength of selection bias (strong & legible) |
| `PERSONALITY_REACTION_WEIGHT` | high | Strength of in-encounter choice bias |
| `ORIGIN_VIGNETTES_PER_AGENT` | tune | Draw count at birth (controls baseline spread) |
| `FORMATIVE_MARK_MAX_MAGNITUDE` | tune | Cap on a single permanent mark |

## Fail-soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| Agent missing a profile | Treat all axes as 0.5 neutral; no bias |
| Axis id not in registry | Skip the contribution, emit `personality_unknown_axis` trace |
| No origin vignettes match | Agent born fully neutral (valid) |
| In-encounter chooser finds no aligned option | Fall back to deterministic `reactions[0]` (today's behavior) |
| Trait def missing for emerged threshold | Skip grant, log; position still tracked |

## NFP compliance

- **Tunability** — PASS: all magnitudes/weights/thresholds named constants.
- **Inspectability** — PASS: new traces for seeding, marks, emergence, selection bias, reaction choice.
- **Determinism** — PASS: birth draw uses seeded PRNG; choosers are deterministic with index tie-break.
- **Fail-soft** — PASS: table above; tick loop never depends on personality being present.
- **Narrative over mechanical** — PASS: the whole feature is narrative legibility.
- **Additive over destructive** — PASS with note: scalar unification retires a duplicated representation (the one structural refactor); everything else is additive (`axisContributions`, new phase, new effect, new content).
- **Performance** — PASS: per-agent per-axis work is small; the in-encounter chooser runs only for engaging agents.

## Three-pillar check

Engine ✓ · Content ✓ · UI ✓ · Wiring ✓ — all present above.

## Kill criteria / wrong-signal

"Strong & legible" is a deliberate, reversible tuning stance. Watch for it overshooting into *scripted*: if playtest/observability shows the aggregate world reading as predictable (agents always taking the obvious in-character branch, encounter variety collapsing, or KPI variety metrics dropping), the response is graduated — first dial down `PERSONALITY_SELECTION_WEIGHT` / `PERSONALITY_REACTION_WEIGHT`, and if that is insufficient, soften the in-encounter chooser from near-argmax to a deterministic weighted pick (personality shifts odds rather than dictating). The weight constants are the lever; this is a knob turn, not a redesign.

## Rulebook impact

Minimal. This governs *autonomous simulation behavior* (how NPC agents choose), not a player-facing rule of play (turn structure, action verbs, prerequisites, resources, clocks, win/loss). No rulebook rule changes. If the player-facing reading of agent personality is later codified as a teachable concept, revisit.

## Dependency

Hard dependency on **THR-524** — the canonical virtue/vice axis vocabulary. The axis registry here consumes those pole names; THR-524 should be expanded (or this project's first issue should own) the canonical reach→axis-id→pole-label registry that all four legacy naming sites reconcile to.

## Implementation breakdown (issues)

1. **Canonical axis registry + scalar unification** (Engine) — consolidate AxiologicalProfile/ArchetypeDrift to one 0–1 model; build the registry; reconcile the four naming sites. *Depends on THR-524. Foundational — blocks the rest.*
2. **`axisContributions` + origin-vignette system + birth seeding** (Engine + Content) — schema field, birth-draw phase, and the vignette library (the large content piece; can split content authoring into its own sub-issue).
3. **Threshold → emergent personality traits + hysteresis** (Engine + UI) — new phase, personality trait defs, sheet rows, becoming notification.
4. **Choice → drift authoring + apply** (Content + Engine) — authored choice poles, drift application, decay-toward-baseline.
5. **Formative-mark primitive** (Engine + Content) — permanent-mark effect + authoring + a starter set of defining-moment encounters.
6. **Autonomous in-encounter choice** (Engine) — the new subsystem; profile-aligned chooser + tick-loop caller + traces.
7. **Personality selection weighting** (Engine) — strengthen the selection path, add labeled signal + trace.
8. **Character-sheet personality UI** (UI) — the layered personality section, browser-verified.
9. **Prose readability pass on branching encounters** (Content) — house-style calibration + `flesh` fix. Orthogonal; parallel-safe.

Sequencing: 1 → (2,3,4 in parallel) → (5,6,7) → 8; 9 anytime.
