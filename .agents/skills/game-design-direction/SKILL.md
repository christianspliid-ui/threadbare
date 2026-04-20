---
name: game-design-direction
description: >
  Experience-direction skill for design-phase work on Threadbearer. Loads the
  Vision/ notebook (north-star, core-loop, non-negotiables, design-tensions),
  prompts Brainstorm-companion drafting alongside the plan, and runs a Vision
  audit at plan finalization. Load alongside state-of-game-design for any
  In Design phase work on player-facing features. Skip for pure-infrastructure
  design passes where Vision premises are not in scope.
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

**Read these five files before drafting a design. Each answers a different question:**

| File | Read when... |
|------|-------------|
| `Vision/README.md` | First — orients you to the folder's purpose and voice. Two minutes. |
| `Vision/00-north-star.md` | Your design produces a moment — check whether it moves sessions toward the seventh-hour experience we are building toward. |
| `Vision/01-core-loop.md` | Your design touches portfolio scan, encounter pacing, or aftermath. Read why each beat exists before you modify the rhythm. |
| `Vision/02-non-negotiables.md` | You feel pressure against a load-bearing decision — especially the god/protagonist distinction, mortal sovereignty, or intervention mechanics. This file tells you why the pressure is familiar and what to check. |
| `Vision/03-design-tensions.md` | Your design is pulling between two legitimate goods — legibility vs. realism, expansive brainstorm vs. tight plan, player agency vs. world autonomy. Read it to name the tension before you resolve it. |

These files are short and deliberately iterable. Read them as live documents, not as settled truth. If a design pass reveals that a Vision premise is wrong, that update is part of your ticket's scope, not a follow-up.

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

## Tensions surfaced

[Which of the Vision/03-design-tensions.md tensions appeared? How did this
design navigate them? Be specific — "expansive vs. tight" is fine; "we chose
X because Y" is better.]

## Vision premises this plan leans on

[Which non-negotiables from Vision/02-non-negotiables.md does this plan invoke?
Restate them in one sentence each, then add the *this plan's version* of them.]

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

Go through each of the five Vision files and ask:
1. Does this design still move sessions toward the north-star moment? (`00-north-star.md`)
2. Does this design preserve or improve the portfolio scan → encounter → aftermath rhythm? (`01-core-loop.md`)
3. Does this design stay inside the non-negotiables — especially god/protagonist separation and mortal sovereignty? (`02-non-negotiables.md`)
4. Is this design leaning too hard in one direction on any known tension? (`03-design-tensions.md`)

**If any premise is contradicted:** the Vision edit is part of this ticket's scope, not a follow-up. Write the update to the relevant Vision file alongside the plan. Note in the Brainstorm companion what changed and why.

**If any premise is merely reinforced:** no action needed. The audit is the check, not the output.

---

## Relationship to `state-of-game-design`

`state-of-game-design` covers **what exists**: cosmology, reaches, spheres, graph architecture, CRUD actions, tick loop, architectural decisions. It is the mechanical foundation.

This skill covers **what we are aiming for**: the experience target, the reasoning behind the non-negotiables, the tensions that recur across designs. It assumes you already know the foundation.

Load order: `state-of-game-design` first, then this skill. Never this skill alone — a design that is experience-coherent but mechanically wrong is still wrong.

The Vision premises in this skill **do not duplicate** Systems/ content. They narrate the *why* behind decisions that Systems/ records as settled. If a Vision premise and a Systems/ page appear to contradict, the Systems/ page is current spec; the Vision premise may need updating. Flag it in the Vision audit.
