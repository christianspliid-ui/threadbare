---
tags: [vision, non-negotiables, load-bearing]
aliases: [Non-Negotiables, Load-Bearing Decisions]
status: draft
created: 2026-04-20
updated: 2026-04-20
---

# Non-Negotiables — the load-bearing decisions, narrated

> These are the decisions that, if revisited, would make Threadbearer into a different game. Each one is written as *why*, not *what*. The "what" lives in `CLAUDE.md` (Load-Bearing Architectural Decisions, Rejected Approaches) and in `Systems/`. This page exists so that when a design pass surfaces pressure against one of these, we can tell whether the pressure is a real signal worth listening to or a familiar temptation to drift.

## 1. The player is a god, not a protagonist

**The decision:** player choices are divine interventions — nudges, whispers, visions — that shift probabilities and surface context. They are never direct character control.

**Why it is load-bearing:** the entire emotional register of the game depends on the distance between player and mortal. A god who can move a mortal like a chess piece has no moral weight when they do. A god who can *influence but not command* has to choose — every intervention is a small claim on another being's sovereignty, and the game never lets that choice disappear into mechanics. Sovereignty vs. Consumption (the canonical moral doctrine in `Systems/Executive Vision.md`) only exists if the god is distant enough that consumption is a temptation, not the default.

**How to apply:** when a design wants to add direct control — "the player clicks here and the mortal does X" — flag it. Either the design wants to become choose-your-own-adventure (which is a different game) or the design needs to be reframed as a *kind of intervention* the god can buy with essence, with an uncertain outcome.

## 2. Narrative over mechanical perfection

**The decision:** when mechanics and story diverge, we lean toward story. (NFP #5 in `CLAUDE.md`.)

**Why it is load-bearing:** Threadbearer's value proposition is that the player finishes a run with a *story they can tell in prose*. Mechanical perfection — balanced numbers, solved tactics, symmetric information — is what makes a game reviewable on YouTube. Story is what makes a game *remembered*. We chose story. A slightly unbalanced moment that produces a character beat is worth more than a perfectly balanced encounter that produces nothing memorable.

**How to apply:** in design review, ask "does this produce a moment the player could tell someone about?" If yes, keep it even if a number feels off. If no, no amount of balance will save it.

## 3. All mechanics surface through prose, never numbers

**The decision:** player-facing communication is narrative. The player learns the world through Invocable Proper Keywords (IPKs) encountered in prose, not stats.

**Why it is load-bearing:** the "nostalgic form, adult substance" tonal principle collapses the moment the player sees floating damage numbers or percentage bars. It also unlocks compound effects: the same IPK ("Favor") appearing in a dozen different encounters teaches the player the *concept* by accumulation, which is how the world becomes a thing the player has real intuition about rather than a thing they read a manual for.

**How to apply:** if a design surfaces a raw number to the player, the design is wrong. The information still exists under the hood — it must, for tunability (NFP #1) — but the prose layer is what the player meets. Debug panel numbers for us, prose for them.

## 4. Everything is a graph node/edge

**The decision:** no separate relational tables. No property-bag relationships. If two entities have a meaningful relationship (commands, owns, trusts, grieves-for), it is an edge type. Properties are for data internal to a node.

**Why it is load-bearing:** the game's claim to emergence lives or dies on the graph being the single substrate. The moment we add "oh but *this* kind of connection is a field on a record", traversal breaks. When traversal breaks, the simulation starts producing worlds where the threads we care about are invisible to the engine that is supposed to weave them. Emergent narrative from a graph needs the graph to actually be a graph.

**How to apply:** before adding a string ID field to a node's properties, check `src/types/graph.ts` for an existing edge that fits. If nothing fits, design a new edge type. Never encode a relationship as a property. This is one of the few places we are strict — the cost of ignoring it is invisible drift and half the game's planned systems not working.

## 5. Expansive design, conservative implementation

**The decision:** we design expansively and implement conservatively. Brainstorms cast wide nets. Plan docs are tight. Implementation pulls from the tight plan, not the wide brainstorm. (`feedback_design_expansiveness` memory.)

**Why it is load-bearing:** premature convergence builds the wrong product very fast. Threadbearer is a complex game — we do not know in advance which systems will carry the emotional load. The expansive brainstorm is where we find out. The conservative plan is where we commit to what we can actually ship. The *dialogue between the two* is the art.

This Vision folder exists because we were losing the expansive half. That loss is what this non-negotiable is defending.

**How to apply:** every plan doc has a Brainstorm companion. The plan is terse. The companion is where alternatives, tensions, and "why we rejected this" live. When a design fails on first contact with implementation, we go back to the companion, not just the plan.

## 6. Additive over destructive changes

**The decision:** add new fields and functions. Only refactor when the old shape blocks progress. (NFP #6 in `CLAUDE.md`.)

**Why it is load-bearing:** this is a solo-dev project with a long horizon. The value of additive change is compounding: every field and module that stays put is a piece of mental load we have already paid for. Destructive refactors reset that investment. We only pay the reset cost when the old shape is actively in the way of something we are trying to build — not when it is merely aesthetically wrong.

**How to apply:** when tempted to rename, consolidate, or restructure, ask whether the restructure is *unblocking* a concrete piece of work. If yes, do it. If no, leave it. The debt of a slightly-awkward name is trivial compared to the debt of half-completed refactors strewn across a codebase.

## 7. The three pillars are always present

**The decision:** every feature covers Engine, Content, and UI. A plan doc that addresses only one or two pillars is incomplete. (Design Governance, `CLAUDE.md`.)

**Why it is load-bearing:** the most common failure mode in this project is *the invisible feature* — engine code that works perfectly in isolation but never reaches the player. A system only exists in Threadbearer when a mortal does something because of it, in prose, that the player can witness through the UI. Engine without content is a mechanism with no story. Content without UI is fiction with no surface.

**How to apply:** design reviews gate on this. If the plan does not say how the player sees the feature, the plan is not ready. Pure infrastructure (like this Vision folder itself) may legitimately be N/A on all three, but that has to be flagged explicitly with rationale — not skipped.

---

*last iterated 2026-04-20 — bootstrap, drawn from `CLAUDE.md` Load-Bearing Decisions and NFPs, plus memories: feedback_god_not_protagonist, feedback_prose_first_ui, feedback_narrative_tiebreaker, feedback_design_expansiveness, feedback_graph_edges_not_properties, feedback_ui_phase_required*
