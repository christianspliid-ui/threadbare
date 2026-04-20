---
tags: [vision, notebook, meta]
aliases: [Vision Layer, Designer's Notebook]
status: draft
created: 2026-04-20
updated: 2026-04-20
---

# Vision — the designer's notebook

This folder is where we think out loud about **what Threadbearer is trying to be, as an experience, in the long run**. Not what it is today. Not what the code does. What we want the player to walk away with, and why.

> It is a notebook, not a spec. `Systems/` is the spec.

## How this differs from `Systems/`

`Systems/` contains canonical reference: Executive Vision, Design Direction, Thematic Pillars, Tonal Bible, and the hundred-plus system pages that describe the machine we are building. Those pages are written as settled facts. They earn their authority by being stable.

`Vision/` is the opposite. It is written as dialogue — *"we think"*, *"this is why"*, *"this is the tension we are navigating"*, *"last time we looked at this, we believed X"*. Its authority is that it **remembers the reasoning** behind the settled facts, including the arguments we already had and don't want to re-have.

When a design doesn't land — the implementation surfaces a tension we hadn't seen, the playtest reveals the feel is wrong, the plan produces a feature nobody cares about — we come *here* first. Not to check what the system does, but to check whether the **premise** was right. If the premise was right, fix the design. If the premise was wrong, update the premise in this notebook, then the design.

## How to use it

**If you are reading:** start with `00-north-star.md`. Then skim `02-non-negotiables.md` to understand what is load-bearing. `01-core-loop.md` tells you the rhythm. `03-design-tensions.md` is the live debate — the tradeoffs we are consciously navigating, none of them fully resolved.

**If you are designing:** read all five before drafting a plan doc. Cite back to the premises your design leans on (by filename + section). If your design contradicts a premise, that is a signal — either your design is wrong, or the premise has drifted and needs updating. Either outcome is legitimate; both require you to write the tension down before moving on.

**If you are implementing (CC / Codex):** you probably do not need to read this. The plan doc you were handed is the contract. This folder exists so the plan doc can stay tight.

## How it gets maintained

Slowly, with intent.

- Each file gets a dated `*last iterated YYYY-MM-DD*` signature at the bottom when it is substantively updated.
- Each file links **down** to `Systems/` pages (the canonical spec) but never the reverse — `Systems/` does not need to know this folder exists.
- When a plan doc in `Docs/plans/` invokes a Vision premise and then the implementation surfaces a reason to revise that premise, **the Vision edit is part of the same ticket's scope**. Not a follow-up. This is what prevents the notebook from going stale.
- The voice is first-person-plural and reflective. If a section starts sounding like a spec — bullets without reasoning, rules without rationale — we have drifted. Pull it back.

## What lives here (index)

- [[00-north-star]] — what the game feels like to play at its best
- [[01-core-loop]] — the loop as a rhythm, not a flowchart
- [[02-non-negotiables]] — the load-bearing decisions, narrated
- [[03-design-tensions]] — unresolved tradeoffs we navigate continuously

## Why this exists

We kept losing vision context between brainstorm and plan. The brainstorm would contain a rich dialogue — alternatives considered, emotional target, why certain things were off the table — and then the plan doc would compress it into a clean specification the executor could implement. When the design didn't land first time around, we'd come back to revise and find the argument was gone. Rediscovering it cost hours. Sometimes we rediscovered it incorrectly and the revision drifted off the original target.

This folder, combined with the Brainstorm companion habit in `Brainstorms/YYYY-MM-DD-topic.md`, is the fix. Vision lives here, dialogue lives alongside each plan, and the plan itself stays tight.

---

*last iterated 2026-04-20 — bootstrap*
