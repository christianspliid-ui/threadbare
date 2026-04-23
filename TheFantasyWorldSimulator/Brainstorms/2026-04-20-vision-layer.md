---
tags: [brainstorm, process, workflow, meta]
aliases: [Vision Layer Brainstorm]
status: active
created: 2026-04-20
updated: 2026-04-20
---

# Vision Layer & Design Dialogue — Brainstorm Companion

> Companion to `Docs/plans/2026-04-20-vision-layer-and-design-dialogue.md`. This is the dialogue that produced that plan. Alternatives considered, tensions surfaced, premises invoked, branches not taken. Written alongside the plan, not after it — the whole point of the pattern we are establishing is that retrofitted dialogue is fiction.

## How this started

The user noticed a pattern in our brainstorm-to-plan flow: rich vision dialogue during brainstorming gets compressed out when moving to plan docs, and when the design does not land on first contact with implementation, the context that would let us revise well is already gone. Their words:

> "i often feel that we compact the overarching direction too much as part of creating the design document, leading to a loss of a great vision dialogue when the design doesn't land first time around... i would love for us to better catch our co-op brainstorming work in a separate section or separate brainstorm document that keeps the long term game experience outcome clear for us. its a complex game and keeping a full abstract of 'the game rules and loops and how it should feel for the player' to iterate on is needed."

Two distinct concerns in that message:
1. **Per-design dialogue loss** — when *this* plan doc fails, the argument that produced it is gone.
2. **Overarching vision drift** — without a *persistent abstract* of long-term game experience, every plan is re-deriving the target from memory.

Both concerns are real, and they want different answers. The first wants a per-plan companion. The second wants a persistent living vision artifact. We ended up designing both and linking them.

## First-pass framing I considered

My initial instinct was to solve only concern #1 — "just write a brainstorm companion for every plan, problem solved." That framing would have been a mistake. It assumes each plan can articulate its vision premises in isolation. But the user's message explicitly calls out "a full abstract of the game rules and loops and how it should feel for the player" — a *shared, persistent* document, not per-plan prose.

<AI>
The per-plan companion alone would have produced a fast convergence to a lightweight workflow change, which would have felt productive. It would also have missed the actual ask. This is exactly the pattern Vision/02-non-negotiables.md item 5 is about — premature convergence builds the wrong product fast. Noting it here because the brainstorm itself exemplified why the brainstorm exists.
</AI>

## The three-surface structure we landed on

- **Vision/** (new) — persistent notebook, designer's voice, long-term experience target, slowly mutated
- **Brainstorm companion** (habit change on an existing folder) — per-plan dialogue, written in parallel with the plan
- **Docs/plans/** (unchanged in shape) — tight, implementable, with two new header links up to Vision and sideways to the companion

Why three and not two: a plan-level companion cannot carry cross-plan context. The north-star, the core loop feel, the non-negotiables — those are cross-cutting and should not have to be re-explained per plan. A persistent Vision layer is where they live. The per-plan companion then gets to focus on *this plan's* alternatives and tensions, citing Vision premises by reference.

## Alternatives considered

**A. Put vision content at the top of each plan doc.** Rejected because it bloats plans, creates drift between plan copies (the same premise restated twenty times, each slightly different), and does not solve the "shared abstract to iterate on" problem.

**B. Expand `Systems/Executive Vision.md` to be the living vision layer.** Tempting — the file already exists. Rejected because `Systems/` pages read as canonical spec. The user specifically asked for something "closer to a designer's notebook". Mixing spec voice and notebook voice in the same page, or the same folder, would dilute both. Keep `Systems/` as canonical reference; add `Vision/` as the iterable layer above.

**C. Use a single `Vision/notebook.md` file.** Rejected because one file grows into a wall of text that nobody rereads. Small focused files (north-star, core-loop, non-negotiables, tensions) each answer a specific question a designer might need answered, and are short enough to re-read before a design pass.

**D. Skip the Brainstorm companion and only add Vision/.** Rejected because the per-plan dialogue loss is a distinct problem. Vision/ is cross-cutting; the companion is plan-specific. You need both. Vision premises are *invoked* in companions; companions capture *this plan's* branches. Different artifacts, different jobs.

**E. Retrofit companions onto existing plans.** Explicitly out of scope. Retrofitted dialogue is fiction — it would be me reconstructing an argument that did not happen, which is exactly the failure mode we are trying to prevent. Pattern applies forward only.

## Tensions surfaced

### Notebook voice vs. agent consumption

A designer's notebook is reflective, exploratory, admits uncertainty — good for human reading, good for seeding later design passes. But agents (CC, Codex) also read project docs, and they do better with declarative spec-like content.

We resolved this by role separation: **Vision/ is not for executors**. The plan doc is the executor's contract. Vision/ exists to inform *design*, which is Cowork's job and mine and the user's. When I (or a future Cowork instance) sit down to draft a design, I read Vision/ first. When CC picks up a Ready-for-Dev ticket, it does not need to. The README.md says this explicitly.

### Where vision-adjacent content already lives

Four vision-adjacent pages already exist in `Systems/`: Executive Vision, Design Direction, Thematic Pillars, Tonal Bible. Do we move them into `Vision/`? Do we duplicate them? Do we leave them alone and just *link* to them?

Landed on: **leave them, link down to them from Vision/**. They are read as settled canon, which is fine — canon is useful. Vision/ sits above them as the iterable notebook. If `Vision/` proves to have gravity over time, we can reshuffle later. Starting by moving pages would risk breaking a lot of wikilinks and would confuse "canonical" and "notebook" voice before we have demonstrated either works.

The open-questions section of the plan captures this explicitly as a deferred decision.

### Frequency of Vision edits

If Vision/ is too stable, it becomes ignored canonical spec (what Systems/ already is). If Vision/ is edited with every plan, it is noise and loses its "slowly mutated, designer's intent" character.

Landed on: **Vision edits are scoped into the ticket that revealed the need to revise.** Not a follow-up. Not ad-hoc. When a design pass surfaces a reason to update a Vision premise, the Vision edit is part of that ticket's scope. This ties Vision maintenance to the dialogue that would naturally update it, rather than scheduling a "Vision review" cadence that would feel artificial.

### Three-pillar check on a pure-infrastructure ticket

The three-pillar rule says every design covers Engine + Content + UI. This one covers *none* — it is process and doc infrastructure. We flagged this explicitly in the plan rather than hiding it, because the three-pillar rule exists to catch invisible features, and infrastructure is genuinely a different category.

<AI>
This is the second pattern-exemplifying moment in this brainstorm. The three-pillar rule was designed to prevent the common failure of "engine module with no UI". But applied mechanically to *any* design including pure infrastructure, it would either be ignored (bad — precedent for ignoring governance) or cause us to invent fake Engine/Content/UI slots for process changes (worse — governance drift by dilution). Explicit N/A with rationale is the right handling and worth preserving as a pattern.
</AI>

## Vision premises this plan leans on

Captured in the plan doc's "Non-negotiables this plan leans on" section, but restated here with dialogue:

- **Expansive design, conservative implementation** — a Vision layer is the expansive-thinking artifact made durable. Without it, the conservative plan layer loses context. This plan is the infrastructure that makes that non-negotiable sustainable.
- **Narrative over mechanical perfection** — the companion pattern exists to preserve narrative-level reasoning that plan docs strip. Plan docs are correct to strip it — they need to be implementable — but the reasoning needs to live somewhere.
- **Additive over destructive changes** — we add `Vision/` above `Systems/` rather than moving pages. This is the cautious version.

## Branches not taken

**Automated Vision generation from brainstorm content.** Briefly considered generating Vision pages programmatically from Brainstorms/ entries. Rejected — Vision is supposed to be slowly mutated with intent. Automation would produce noise and would defeat the "designer's notebook" voice. The point of Vision is that it is hand-tended.

**Structured template for Brainstorm companions.** Considered providing a rigid template. Left loose on purpose. The companion's job is to capture dialogue, and dialogue does not fit templates well. The only required piece is that it exist alongside the plan, drafted in the same pass. The `game-design-direction` skill will include a minimal template in its skill body but explicitly as a starting point, not a schema.

**Versioning Vision files.** Considered adding proper version numbers or changelog entries to each Vision file. Rejected — the dated `*last iterated*` signature at the bottom of each page, plus git history, is enough. Over-structuring Vision defeats the notebook feel.

## Open questions

Most are captured in the plan doc. Two that did not make it in:

- **Should the `game-design-direction` skill also load Brainstorms/ into context when drafting plans?** Could be useful — seeing recent brainstorm dialogue in the neighborhood of the current design might sharpen reasoning. Could also be noise. Defer until the skill is authored and we have a few companions to test with.
- **When an implementation reveals a Vision premise was wrong, what does the update look like in practice?** We have the rule ("Vision edit is part of that ticket's scope") but not a worked example. The first time this actually happens we should capture it as a case study and add a pointer from README.md.

## Brainstorm Status

**Complete enough to hand off.** Plan doc drafted, five Vision seed files drafted, three Linear issues scoped for the Vision Layer & Design Dialogue project. The pattern is self-applied (this brainstorm exists alongside the plan for this very design). Further refinement happens through use, not more upfront design.

---

*captured 2026-04-20 — brainstorm session, Cowork*
