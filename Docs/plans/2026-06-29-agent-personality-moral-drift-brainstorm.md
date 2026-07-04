# Brainstorm companion — Agent Personality & Moral Drift

Companion to `2026-06-29-agent-personality-moral-drift.md`. Captures the dialogue, alternatives, and tensions behind the settled design.

## Origin of the design

Followed directly from the cosmology virtue/vice work (THR-524). Once each reach had a named virtue↔vice axis, the creative director wanted those axes to become *lived* — choices that push agents along them, personalities that emerge and show, and behavior that visibly reflects them. The discovery pass found that ~60–70% of the substrate already existed (`AxiologicalProfile`, `ArchetypeDrift`, the trait system with per-reach `scoringModifiers`, branching encounters with deep aftermath effects), so the work is mostly unification + completion, not greenfield.

## Decisions the creative director verdicted in-session

- **Personality origin: hybrid, predefined at birth, normal distribution.** Not fully-emergent-from-neutral (agents would feel blank early) and not purely innate. Resolved further into the **origin-vignette stack** so the baseline is *legible*, not an opaque roll.
- **Strength: strong & legible.** Personality should clearly steer behavior, not just nudge odds. This drove the high selection/reaction weights and the near-argmax in-encounter chooser.
- **Scope: all at once.** Build the full loop (scalar → traits → selection → autonomous in-encounter choice) as one project rather than phasing.
- **Birth baseline = visible backstory traits**, each a tiny vignette with a small ± axis delta. Sums approximate normal for free.
- **Personality ≠ capability.** Explicit separation — a load-bearing invariant, new `axisContributions` field distinct from `domainContributions`.
- **Rare permanent marks.** Most experiences fade; defining ones leave a permanent baseline shift. Author-gated.

## Alternatives considered and rejected

- **Fully emergent from neutral** — rejected: agents feel personality-less in early game; selection bias flat until choices accumulate.
- **Conflate personality with reach capability/affinity** — rejected explicitly by the creative director; collapses the orthogonality that lets "skilled but cruel" vs "skilled and noble" exist.
- **Opaque normal-distribution baseline (raw roll)** — rejected in favor of the origin-vignette stack so the player can *read why* an agent leans as they do.
- **All drift permanent** — rejected: removes the "tendency vs defining moment" texture; everything would calcify. Resolved as temporary drift + rare permanent marks.
- **Reuse the `reputation` trait subcategory for personality** — rejected to keep "who you are" (personality) distinct from "how the world sees you" (reputation), though personality reuses the same scoring-bonus consumer.
- **Subtle/probabilistic behavior influence** — considered and rejected by the strength verdict (strong & legible chosen).

## Tensions surfaced

- **Strong & legible vs "living, not scripted."** Near-argmax in-encounter choice maximizes readability but reduces surprise. Mitigation: personality is one input; capability still decides success/failure, and the variety of agents/baselines keeps the *aggregate* world unpredictable even if each agent is individually legible. Tunable via the weight constants if it reads as too deterministic in playtest.
- **Content volume.** The origin-vignette library (130+ one-liners) and formative-mark encounters are a real authoring load. Accepted — aligns with the project's appetite for high-volume generative content, and vignettes are cheap one-liners.
- **Scale reconciliation.** Creative director thinks in 0–1 (0.5 neutral); engine drift is −1…+1. Resolved: canonical author/UI scale is 0–1; implementation maps.
- **Refactor risk.** Unifying two parallel scalars is the one destructive change in an otherwise additive design; isolated to issue #1 and gated behind THR-524.

## Vision premises invoked

- Agents as a Malazan-style portfolio of distinct, deep characters whose personalities express through behavior.
- Prose-first / show-don't-tell: personality surfaces through vignettes and choices, not stat dumps.
- Narrative-over-mechanical: the entire feature exists to make the world feel authored and alive.
