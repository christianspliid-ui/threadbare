---
name: game-design-direction
description: >
  Experience-direction skill for design-phase work on Threadbearer. Loads the
  Vision/ notebook (north-star, core-loop, non-negotiables, design-tensions)
  and the taste profile (strong opinions, soft patterns, anti-patterns),
  prompts Brainstorm-companion drafting alongside the plan, runs a pre-design
  debate when direction is uncertain, and runs a Vision audit at plan
  finalization. Load alongside state-of-game-design for any In Design phase
  work on player-facing features. Skip for pure-infrastructure design passes
  where Vision premises are not in scope.
last_validated_against: 2026-05-08
---

# Game Design Direction

This skill runs **on top of** `state-of-game-design`. Load that skill first for cosmology, reaches, spheres, and architectural decisions. This skill assumes you already know the engine and focuses on *experience direction* — what the player feels, why each design decision matters to them, and how to keep the design coherent with the game's long-term target.

---

## When to Load This Skill

Load it at the start of any **In Design phase** work on a player-facing feature. Concretely:

- Any design that produces encounters, attachments, UI elements, or player choices
- Any design that touches the portfolio scan → encounter → aftermath rhythm
- Any design that modifies how the player influences mortals or receives narrative feedback

**Skip it for pure-infrastructure passes** — engine cache rebuilds, test harness changes, refactors with no player-facing surface. The Vision premises are not in scope there. If you are unsure, read `Vision/README.md` (two minutes) and judge from it.

---

## Vision/ — The Designer's Notebook

The `Vision/` folder lives at `TheFantasyWorldSimulator/Vision/` in the vault. It is a designer's notebook — reflective, iterable, written in dialogue voice. It is not spec. `Systems/` is spec. Vision/ is the reasoning behind the spec, including the arguments that have already been had.

**Read these six files before drafting a design. Each answers a different question:**

| File | Read when... |
|------|-------------|
| `Vision/README.md` | First — orients you to the folder's purpose and voice. Two minutes. |
| `Vision/00-north-star.md` | Your design produces a moment — check whether it moves sessions toward the seventh-hour experience we are building toward. |
| `Vision/01-core-loop.md` | Your design touches portfolio scan, encounter pacing, or aftermath. Read why each beat exists before you modify the rhythm. |
| `Vision/02-non-negotiables.md` | You feel pressure against a load-bearing decision — especially the god/protagonist distinction, mortal sovereignty, or intervention mechanics. This file tells you why the pressure is familiar and what to check. |
| `Vision/03-design-tensions.md` | Your design is pulling between two legitimate goods — legibility vs. realism, expansive brainstorm vs. tight plan, player agency vs. world autonomy. Read it to name the tension before you resolve it. |
| `Vision/taste-profile.md` | Always. The persistent aesthetic voice of the project — strong opinions, soft patterns, anti-patterns. See the Taste Profile section below. |

These files are short and deliberately iterable. Read them as live documents, not as settled truth. If a design pass reveals that a Vision premise is wrong, that update is part of your ticket's scope, not a follow-up.

---

## The Taste Profile

The taste profile is the project's **persistent aesthetic voice**, accumulated across design passes. It lives at `TheFantasyWorldSimulator/Vision/taste-profile.md` in the vault and is the canonical source for what the project considers beautiful, correct, and rejected. Memory entries are session-scoped scratch; the taste profile is durable.

**Load it at the start of every design pass**, alongside the other Vision files. Reference it before proposing visual, prose, or interaction directions. Update it when a design pass confirms a pattern, hypothesises a new one, or formally rejects an approach.

### Three layers

The profile has three sections. Each entry has a concrete example and a source reference.

**Strong opinions** — confirmed across two or more design passes (or one design pass plus explicit user confirmation). These are load-bearing for the game's voice; contradicting one requires a Vision audit and either a revision of the opinion or a flagged trade-off. Example: *prose-first UI, no numbers visible to the player.*

**Soft patterns** — hypotheses. Aesthetic instincts that feel right but have not yet been stress-tested across multiple designs. Treat them as working defaults that can flip into strong opinions (on repeat confirmation) or anti-patterns (on failure). Example: *marketing copy sparks imagination through concrete scenes, not mechanics explanation.*

**Anti-patterns** — formally rejected approaches, with the rejection reason recorded. Do not silently reintroduce. Example: *classical STR/DEX/INT stats — replaced by Domain Capability across Nine Reaches.*

### Update protocol

Update the taste profile **in the same pass** as the design it emerged from — not as a separate retrofit. Otherwise the reason for the entry is lost.

| Trigger | Action |
|---------|--------|
| A design pass invokes a previously unstated aesthetic instinct that the user confirms | Add to **soft patterns** with the source design-pass reference |
| A soft pattern recurs in a second design pass and is confirmed again | Promote to **strong opinions** — update the existing entry, note both sources |
| A design pass rejects an approach with reasoning | Add to **anti-patterns** with the rejection reason recorded in one line |
| A strong opinion is contradicted by a new design | Do not quietly amend. Run a Vision audit. Either the opinion revises (record the revision) or the new design has to flex |
| An entry has gone a year without invocation and isn't referenced by any current design | Consider archiving to `Vision/taste-profile-archive.md` — dormant taste is still history, not deletion |

### What not to record

The taste profile is the **aesthetic voice of the project**. It is not:

- Session-scoped reactions — put those in memory, not here.
- Mechanical constants — those are named numbers in code (NFP #1).
- Architectural decisions — those belong in `CLAUDE.md` under Load-Bearing Architectural Decisions.
- Documentation of what exists — that is `Systems/` spec. The profile documents *what the project considers correct*, not what is implemented.

If an entry would fit equally well in `Systems/` or `CLAUDE.md`, it does not belong in the taste profile.

---

## Pre-Design Debate

When brainstorming a design and the direction is genuinely contested — two or more viable paths, each with real cost — run a **pre-design debate** before drafting the plan. Debate surfaces trade-offs. It is not a decision ritual.

### Debate vs. design-council

Both are multi-perspective, but they operate at different points in the design loop and produce different artifacts.

| Axis | Pre-design debate | `design-council` |
|------|-------------------|------------------|
| When | Brainstorming, before a plan exists | On a concrete proposal, when direction is already drafted |
| Decides by | User reads the trade-off card and chooses | Sociocratic consent among agents |
| Outputs | A trade-off card in the Brainstorm companion | A `DEC-N` decision logged on the council page |
| Length | 2–3 exchanges per side | Up to 12 turns |
| Lives at | `TheFantasyWorldSimulator/Brainstorms/YYYY-MM-DD-<slug>.md` (inside the companion) | `Docs/design-councils/YYYY-MM-DD-<slug>.md` |

Rule of thumb: **debate surfaces options, council consents on proposals.** If you are arguing about what to build, debate. If you are arguing about whether a written proposal is good enough to ship, council.

### When to run a debate

Good fit:

- Two or more viable directions and you cannot tell which the project's voice favours.
- A design pulls against a tension from `Vision/03-design-tensions.md` and the resolution is non-obvious.
- The user has signalled uncertainty ("not sure which way to go on X").

Not a fit (skip the debate, just draft):

- One clearly-correct direction and the alternatives are straw men. Do not manufacture debate for ceremony.
- A question the user has already answered. Do not re-litigate.
- Pure-infrastructure choices with no experience implications.

### Protocol

1. **Frame the split.** Write one sentence per position. Each position must be something a thoughtful designer could actually advocate — no straw men. If you cannot frame position B seriously, there is no debate.
2. **Spawn two advocates in parallel** (one Agent call each, single message). Each gets:
   - The question as framed.
   - Their assigned position (one sentence).
   - Instruction to cite evidence from **Vision/** (north-star, core-loop, non-negotiables, tensions, taste-profile) — not general game-design principles.
   - Output contract: 200–300 words. Strongest-form argument for their position, plus an honest acknowledgement of one thing the other side gets right.
3. **Run one round of cross-examination.** Each advocate reads the other's opening and writes 150–200 words responding to the single strongest claim from the other side. No new arguments — only response.
4. **Write the trade-off card.** You (not the advocates) synthesize: *Path A costs X, buys Y. Path B costs P, buys Q. Vision premises that favour each. Open questions either path has to answer.* 6–10 lines. Put it in the Brainstorm companion under a **Trade-off Card** section.
5. **Hand to user.** The user reads the card and decides. Their decision goes in the companion under **Decision** with a one-line reason. If the user declines to decide ("I want the council to look at this"), escalate to `design-council`.

### Anti-patterns

- **Manufactured debate.** Running a debate when one side is obviously right — produces ceremony, not information.
- **Letting advocates drift.** Each agent must argue its assigned position. If an advocate hedges into both sides, respawn it with a stricter frame.
- **Skipping the Vision citations.** If advocates argue from general principle instead of the project's premises, the debate produces generic output. Re-run requiring citations.
- **Collapsing debate into council.** Debate does not seek consent; do not add `CONSENT`/`OBJECT` lines. The user decides from the card.
- **Retrofitting the trade-off card from a plan.** Write the card *before* the plan exists. If the plan has already been drafted, a debate at this point is post-hoc rationalisation.

---

## The Brainstorm-Companion Pattern

Every design pass has **two artifacts**: the plan doc (`Docs/plans/YYYY-MM-DD-name.md`) and the Brainstorm companion (`TheFantasyWorldSimulator/Brainstorms/YYYY-MM-DD-name.md`). Draft them **in the same pass** — not sequentially, not as retrofit. The companion's job is to preserve the dialogue that the plan compresses out. Retrofitted dialogue is fiction.

**The companion is not a form.** It is a record of actual dialogue. The template below is a starting point, not a schema. Use the sections that matter; skip the ones that do not.

**Reference example:** `TheFantasyWorldSimulator/Brainstorms/2026-04-20-vision-layer.md` — the self-applied companion for the Vision Layer & Design Dialogue project. Read it before authoring your first companion.

### Minimal Template

```markdown
---
tags: [brainstorm, <domain>]
aliases: [<Plan Name> Brainstorm]
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <Plan Name> — Brainstorm Companion

> Companion to `Docs/plans/YYYY-MM-DD-plan-name.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

[What problem or opportunity prompted the design? One paragraph of context.]

## First-pass framing I considered

[Your initial instinct. Was it right? Too narrow? What it would have missed.]

## Alternatives considered

**A. [Name].** [What it was and why it was rejected.]
**B. [Name].** [...]

## Trade-off Card (if a debate was run)

[6–10 lines. Path A costs / buys. Path B costs / buys. Vision premises that
favour each. Open questions each path has to answer.]

## Decision (if a debate was run)

[User's chosen path plus one-line reason.]

## Tensions surfaced

[Which of the Vision/03-design-tensions.md tensions appeared? How did this
design navigate them? Be specific — "expansive vs. tight" is fine; "we chose
X because Y" is better.]

## Vision premises this plan leans on

[Which non-negotiables from Vision/02-non-negotiables.md does this plan invoke?
Restate them in one sentence each, then add the *this plan's version* of them.]

## Taste profile touchpoints

[Which strong opinions or soft patterns from Vision/taste-profile.md does this
plan invoke or confirm? Any new soft patterns added? Any anti-patterns dodged?]

## Branches not taken

[Specific branches that were live options but cut. Not vague alternatives —
named choices with named rejection reasons.]

## Open questions

[What did not resolve cleanly? What would change the design if answered differently?]

## Brainstorm Status

[One line: "Complete enough to hand off." / "Active — open questions outstanding." / "Deferred — unblocked by X."]

---
*captured YYYY-MM-DD — [session type, agent]*
```

---

## Vision Audit at Plan Finalization

Before marking any design Ready for Dev or Ready for Codex, run this check:

> **Does this plan contradict or update any Vision premise?**

Go through each of the Vision files and ask:
1. Does this design still move sessions toward the north-star moment? (`00-north-star.md`)
2. Does this design preserve or improve the portfolio scan → encounter → aftermath rhythm? (`01-core-loop.md`)
3. Does this design stay inside the non-negotiables — especially god/protagonist separation and mortal sovereignty? (`02-non-negotiables.md`)
4. Is this design leaning too hard in one direction on any known tension? (`03-design-tensions.md`)
5. Does this design respect the taste profile's strong opinions, or does it require revising one? (`taste-profile.md`)

**If any premise is contradicted:** the Vision edit is part of this ticket's scope, not a follow-up. Write the update to the relevant Vision file (including `taste-profile.md`) alongside the plan. Note in the Brainstorm companion what changed and why.

**If any premise is merely reinforced:** no action needed. The audit is the check, not the output. Still update the taste profile if a soft pattern was confirmed twice (promote to strong opinion) or a new aesthetic instinct emerged.

---

## Relationship to Other Skills

`state-of-game-design` covers **what exists**: cosmology, reaches, spheres, graph architecture, CRUD actions, tick loop, architectural decisions. It is the mechanical foundation.

This skill covers **what we are aiming for**: the experience target, the reasoning behind the non-negotiables, the tensions that recur across designs. It assumes you already know the foundation.

Load order: `state-of-game-design` first, then this skill. Never this skill alone — a design that is experience-coherent but mechanically wrong is still wrong.

The Vision premises in this skill **do not duplicate** Systems/ content. They narrate the *why* behind decisions that Systems/ records as settled. If a Vision premise and a Systems/ page appear to contradict, the Systems/ page is current spec; the Vision premise may need updating. Flag it in the Vision audit.

**Relationship to `design-council`:** Pre-design debate (this skill) surfaces options during brainstorming. `design-council` runs consent-based deliberation on concrete proposals. A debate may escalate to a council when the user wants agent consent on a written proposal; a council may trigger a debate when a proposal surfaces a direction the current brainstorm did not consider. They are complementary stages, not alternatives.

**Relationship to `threadbearer-design` (design system):** The design system is the *render* of the taste profile's strong opinions into CSS tokens, type, and assets. When a taste-profile entry changes, check whether the design system needs an update too.
