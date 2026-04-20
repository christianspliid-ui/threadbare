---
tags: [vision, tensions, tradeoffs]
aliases: [Design Tensions, Unresolved Tradeoffs]
status: draft
created: 2026-04-20
updated: 2026-04-20
---

# Design Tensions — unresolved tradeoffs we navigate continuously

> These are *not* problems to be solved. They are tensions that live in the game and that we re-balance with almost every design pass. Writing them down explicitly means we can tell when a proposal is pulling too hard in one direction and self-correct before we ship something lopsided.

## 1. Expansive ideation vs. tight plans

**The pull:** brainstorming wants to expand. Plans want to compress. Implementation wants to compress further.

**Why it is a tension:** the expansive side is where the game's identity lives — the texture, the emotional target, the reasons behind the reasons. The compressed side is where the game gets built. If we over-expand, nothing ships. If we over-compress, what ships is structurally sound and emotionally hollow.

**How we navigate it:** brainstorm expansively. Plan conservatively. Keep the expansive artifact alive via the Brainstorm companion habit so the plan can stay tight without losing context. This Vision folder itself is part of that navigation — it is the permanent expansive layer above the per-plan companions.

**Drift signal:** we are drifting toward over-compression when plan docs stop citing reasoning and just list deliverables. We are drifting toward over-expansion when the Implementation Planning queue grows faster than the Ready-for-Dev queue clears.

## 2. Systemic emergence vs. authored moments

**The pull:** on one side, we want the world to *produce* stories — faction pressures, agent agendas, threads crossing, surprises neither designer nor player predicted. On the other side, we want the game to deliver *chapters* — specific framed encounters with deliberate emotional beats, authored prose, and earned climaxes.

**Why it is a tension:** pure emergence tends toward the flat and incomprehensible. The simulation produces events, but without curation they read like a log file, not a story. Pure authorship tends toward the scripted and replayable-once — the player finds the moments, then the moments stop being surprising.

**How we navigate it:** the core loop is the answer. Systemic emergence generates the *situations*; the encounter pipeline curates which situation gets framed; authored prose tables plus enrichment placeholders fill the frame with specificity. Emergence is the ingredient, authorship is the kitchen. Neither is enough alone.

**Drift signal:** we are drifting toward pure emergence when the prose is generic — "the agent did the thing" rather than "Serafina did *this* thing because of *that*". We are drifting toward pure authorship when the same encounter fires twice in a run with the same beats.

## 3. Divine remove vs. player attachment

**The pull:** the player is a god looking down — distant, cosmic, measured in centuries. But the game only works if the player *cares* — about specific mortals, about specific threads, enough to grieve when a mortal dies.

**Why it is a tension:** the two pulls seem to cancel. Distance undercuts attachment. Attachment undercuts distance. Neither fully wins because the emotional register we want ("nostalgic form, adult substance", wonder layered over grief) needs *both*. The player must feel like a god *and* feel the cost of being one.

**How we navigate it:** the distance is structural — the player cannot direct-control mortals, cannot save them unconditionally, cannot rewind. The attachment is earned through accumulation — the scan shows the portfolio, the encounter zooms in, the aftermath echoes. Attachment does not come from cinematics. It comes from time spent watching someone choose things the player did not control.

**Drift signal:** we are drifting toward pure remove when the player has no mortals they could name. We are drifting toward pure attachment when the player treats a mortal's death as a reason to reload — at that point we have become a character game pretending to be a god game.

## 4. Mechanical legibility vs. narrative mystery

**The pull:** the player needs to understand the consequences of their choices enough to choose meaningfully. The game wants the world to feel bigger than the player's model of it.

**Why it is a tension:** full legibility reduces the world to a spreadsheet — the player solves it, the mystery evaporates. Full mystery reduces the world to slot machines — the player cannot form judgment and starts guessing. Both undercut agency.

**How we navigate it:** mechanics surface *through prose and keywords*, not numbers. IPKs teach concepts through accumulation — the player learns "Favor" by seeing it in twenty contexts, and their understanding grows organically rather than being handed to them as a rule. Elder magic is discovered in ruins, not picked at character creation. The game shows its hand slowly, and some parts of the hand stay hidden.

This is a tension we are still calibrating. Some systems (essence economy, intervention costs) probably need to be more legible than we currently surface. Others (foundation-sphere interactions, deep cosmology) probably should stay mysterious longer than we instinctively want to reveal them.

**Drift signal:** we are drifting toward too much legibility when players start talking about "optimal strategy". We are drifting toward too much mystery when players cannot form *any* model of why their last intervention produced the outcome it did.

## 5. Scope: one perfect story vs. portfolio breadth

**The pull:** on one side, the game could focus very hard on a small number of deeply authored mortals — each one a main character. On the other side, it could spread thin across many mortals so the portfolio feels like a living world.

**Why it is a tension:** the deep-few option risks becoming a visual novel with extra steps — the emergence buys nothing if only three characters ever matter. The wide-many option risks the dashboard problem — the player loses track of everyone and cares about no one.

**How we navigate it:** the core loop is "one complex story at a time, selected from a portfolio". The portfolio is broad. The stage is narrow. The scan decides whose turn it is. This is supposed to get us both — a living world *and* a focused chapter — but the balance is ongoing work. How large is the portfolio before it stops feeling like people? How often should the same mortal return to the stage before the player feels their arc? These are tuning questions we have not settled.

**Drift signal:** we are drifting toward too-deep-too-few when the scan always picks the same three mortals. We are drifting toward too-wide-too-many when the player cannot recall who they were just with, at the encounter's start.

---

## Using this page

When drafting a design, read this page and ask: *which tension is this design pulling on?* If the design pulls hard in one direction, check whether the counter-pull is still present somewhere in the plan. If not, either the counter-pull has been deliberately relaxed (note why) or the design has drifted (pull it back).

When reviewing a design, the tensions are a checklist of directions the design could be wrong in. Proposals that fail by drifting too hard on one axis are the most common kind of failure this page is trying to catch.

---

*last iterated 2026-04-20 — bootstrap, drawn from `feedback_design_expansiveness`, `feedback_narrative_tiebreaker`, `feedback_god_not_protagonist`, `feedback_prose_first_ui`, `project_core_loop`, `project_elder_magic`*
