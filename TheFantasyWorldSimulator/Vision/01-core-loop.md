---
tags: [vision, core-loop, rhythm]
aliases: [Core Loop, Loop Rhythm]
status: draft
created: 2026-04-20
updated: 2026-04-20
---

# Core Loop — the loop as a rhythm, not a flowchart

> The settled loop is **portfolio scan → curated encounter → aftermath**. This page is not about its mechanics — those live in `Systems/`. This page is about the *rhythm* we want a session to have, and the reasoning behind each beat.

## The loop, in one breath

The player looks across their mortals. One of them is about to do something that matters. The game pulls that mortal's situation into focus. The player — with some small supply of divine essence — makes a choice about whether and how to intervene. The world resolves. The mortal, and the world around them, lives with what happened. Then the player looks across their mortals again.

That is it. That is the game.

## Why scan → encounter → aftermath, in that order

**The scan exists so the player has a portfolio.** Without the scan, we are a visual novel — one story, in sequence, with choices. With the scan, the player is holding a living cast and choosing whose moment we stop at. The portfolio is the thing that makes this a *god game* rather than a choose-your-own-adventure. The scan is where the Malazan feeling lives: "oh, *her* — I haven't checked in on her in a while."

**The encounter exists so attention gets rewarded.** When the game zooms in on a mortal, the prose earns that attention — concrete, particular, sourced from what this mortal actually is and who they are entangled with. The encounter is the *chapter*. If a session has three or four chapters, the player finishes feeling like they read something.

**The aftermath exists so consequences compound.** A decision at tick 47 should echo at tick 130. Without aftermath, interventions feel like isolated rolls. With aftermath, the player starts to *see their own hand* in the shape of the world, and that is what turns a simulation into a story they told. This is the loop beat where threads thicken.

Order matters. Scan before encounter means the player chose to look. Encounter before aftermath means consequences are anchored in a moment the player witnessed. Aftermath before the next scan means the world has moved before the player looks again — they do not get to freeze it.

## Rhythm: cadence, not pacing

We think a lot about pacing in games — how quickly events happen, how often decisions arrive. We want to think about Threadbearer in terms of **cadence** instead.

Pacing implies a curve: tutorial ramp, rising action, climax, resolution. That is the shape of a protagonist-led story, and Threadbearer is not a protagonist-led story.

Cadence implies a **rhythm of emphasis**: long stretches of quiet simmer punctuated by moments the game specifically frames as *this matters*. The set-pieces. The aftermaths of choices that cost something. The rare intervention where the player spends essence they cannot easily replace.

The loop's job is to produce that cadence automatically. The scan picks *when* to emphasize. The encounter *is* the emphasis. The aftermath is the breath afterward before the next emphasis. If a session's rhythm feels like a drumbeat — encounter, encounter, encounter, encounter — the scan is broken, because the scan is supposed to leave most mortals alone and pull the camera only where it should be.

## One complex story at a time

The hardest discipline in the core loop is that **at any given time, there is one story front-of-stage, and the game knows it.**

We have a portfolio of mortals. Dozens. Eventually hundreds. That portfolio is not parallel content — it is the *pool from which one story gets selected at a time*. The scan's job is triage. The encounter's job is to do that one story well enough that when the player returns to the portfolio, they have moved.

This is the guard against Threadbearer collapsing into a dashboard. Dashboards are what happens when every mortal is always available and every update is always visible. Threadbearer has to push the dashboard behaviour away and toward the chapter. That is what the scan is *for*.

It is also what keeps us Malazan-shaped rather than 4X-shaped. Malazan tracks dozens of threads, but the reader is only in one at a time, and the transitions between threads are the rhythm of the book. Threadbearer wants the same reader experience, delivered procedurally.

## What the player is doing at each beat

**Scanning:** the player is looking at their world and forming an intuition about where attention is warranted. The game helps — it will surface mortals whose situations have crossed thresholds — but the *choice* of whose story to witness is the player's. Scanning is low-effort, high-texture: the player takes in a lot of small signals and picks one.

**Encounter:** the player is reading, deciding, and spending. Reading, because the prose is dense and particular. Deciding, because at the critical moment an intervention menu appears and the player must choose (including "do nothing"). Spending, because essence is the economy and every intervention draws from it.

**Aftermath:** the player is witnessing. This is the beat with the lowest player action load. The world resolves. Threads thicken or fray. The prose closes the chapter. The player sits with what just happened — and only then do they scan again.

We think the balance of effort across the three beats matters. Scan is about taste. Encounter is about judgment. Aftermath is about presence. All three must be present, and the order must be preserved, for the game to feel like Threadbearer rather than something adjacent.

## Turn-based is load-bearing

The loop does not tick on a clock. The world advances when the player says so (see `project_turn_based` memory and `Systems/Design Direction.md`). This is a settled decision.

The reason is the rhythm. If time advances while the player reads an encounter, the encounter's gravity leaks out into frustration about the clock. If time advances while the player scans their portfolio, the player cannot actually *look* — they can only *react*. The scan → encounter → aftermath rhythm demands that the player be the metronome. Turn-based is not a genre choice; it is a rhythm choice.

## Density

*Settled 2026-07-04 (creative-director verdict). This section replaces the old "how many encounters per session?" open question, which had hardened — wrongly — into a "three to six per session" ration in the manual.*

Encounters are the **payoff**, not a budget. They are what threads woven and interventions made *pay out into*. So their density is largely **player-authored**: a god who weaves many threads and manipulates the world hard will, and should, generate many chapters. A god who keeps a quiet portfolio will go many ticks between them. The game never rations chapters. On top of the player's own authorship, the world adds a **gentle lean** toward more encounters as the doom clock climbs — a crumbling world crests more crises. That is world-pressure texture, not a pacing curve the player is marched along; it is a small tunable lean, flat if we want it flat.

The cadence framing still holds, but it is about **texture, not a count ceiling**. Between emphases the world simmers quietly; an encounter is an emphasis. "A comfortable single sitting feels like a handful of chapters" is a fine *observation* about the felt rhythm — it is not a dial the game enforces and never was.

The real design problem was never *how many*. It is **cognitive load**: when several chapters run at once, the player must be able to read and navigate all of them — every completed step, every active step, every choice already made — at any time, for the whole run. That is what the **Chapter Ledger** is for (`Systems/` · shipped THR-603): a persistent, always-readable archive of every encounter, running or finished. It extends the settled "no visibility-gating of encounter content" direction from *candidates* to *records*.

Two things this does **not** change:

- **The scan still leaves most mortals alone.** The ledger holds many chapters; the *camera* still emphasises one story front-of-stage at a time. "Always readable" is not "always surfaced" — the bookshelf is full, but the stage still holds a single scene. The dashboard guard in "one story front-of-stage" above stands.
- **A drumbeat of *volunteered* encounters still means the scan is broken.** Player-*provoked* density is healthy — the player chose it. Encounters the scan surfaces *unbidden*, tick after tick, are still a bug: over-surfacing, not authorship. The distinction is who asked for the chapter.

## Open question that remains

*Should the game tell the player when a good stopping point is?* Sitting with aftermath is a beat. Pushing past aftermath into another scan is also a beat. The game's posture toward closing a session — a soft "good place to stop" signal — is still not settled, and is deliberately left open pending playtest data. Note this is now a *stopping-point* question only; the density question underneath it is answered above.

---

*last iterated 2026-07-04 — Density section settled (THR-603, creative-director verdict). Previously 2026-04-20 bootstrap, drawn from `project_core_loop`, `project_turn_based`, `feedback_god_not_protagonist`, `feedback_prose_first_ui`, `Systems/Design Direction.md`*
