---
tags: [brainstorm, composition-dsl, social-systems-expansion, doom-events]
aliases: [THR-225 brainstorm, event phased activation brainstorm]
status: companion
created: 2026-04-23
updated: 2026-04-23
related:
  - "[[Docs/plans/2026-04-23-thr-225-event-recipe-phased-activation]]"
  - "[[Brainstorms/2026-04-20-vision-layer]]"
---

# Event Phased Activation — Brainstorm Companion (THR-225)

Working notes alongside `Docs/plans/2026-04-23-thr-225-event-recipe-phased-activation.md`. Source: autonomous Cowork session 2026-04-23.

## The premise, stated from first principles

An event in Threadbare is not a scene — it's an **arc**. The authored brainstorms (Chain Weakens, Winnowing of Luck) don't describe a moment; they describe a curve. A rumor seeds in tier 1. A materialization lands in tier 2. A counter-force rises in tier 3. The structure cracks in tier 4. The event is the arc. The recipe must express the arc.

The prior DSL shape treated a composition as a one-shot instantiation: preconditions pass, the network resolves, effects apply, done. That shape can encode a scene. It can't encode an arc.

Phased activation is the minimum addition that lets one recipe encode an arc.

## Tensions surfaced

**Tension 1: Where does the tempo live?**
The instinct during the April 20 brainstorm was to add a per-event tempo parameter (`pacing: 'cosmic-slow' | 'standard' | 'fast'`). THR-229 rejected that correctly: pacing is a universal concern; events shouldn't have a bespoke knob. But that left a gap — how does an event express "advance every 20 ticks" vs "advance when doom clock hits tier 3"? The resolution in the THR-225 plan is: **events inherit pacing from the clock they're tied to**. A doom-clock event paces by doom-clock tiers. A (future) economic event would pace by economic-clock tiers. The clock IS the tempo. Events are passive consumers.

This means the `activatesAt` predicate is the tempo expression. No separate pacing knob. The Winnowing of Luck's retrofit uses `doom-clock tier >= 2` as tempo; if we ever author a famine event that paces on harvest seasons, it'll use a harvest-clock predicate. Same mechanism, different clock. The **vocabulary** is the pacing system's existing tier enum (per-clock). The composition DSL doesn't invent one.

**Tension 2: Ownership (clock calls event, or event watches clock)?**

Both shapes work. The decision was driven by existing architecture, not first principles:
- `phaseJourneyBeat` already threshold-triggers on `doomClock.progress`.
- `phaseMandate` already threshold-triggers on `doomClock.progress`.
- Adding `phaseComposition` as a third consumer of the same signal is architecturally consistent.

The alternative (event self-watches) felt tempting because it localizes phase logic to the event object. But it couples every live event to the tick pipeline's internal ordering, and it fragments tracing across N events. The phase runner centralizes it.

**Tension 3: Per-node `activatesAt` vs. phase-level membership.**

Initial sketch: put `activatesAt: WorldPredicate` on each `NodeSpec`. Clean in principle, but composes badly. A node might be atmospheric flavor that appears in phase 1 AND serves a structural role in phase 3. Expressing that on the node field requires saying "activates at any of [tier 1, tier 3]", which obscures the dramatic structure. The array-on-composition shape with `phase.activates: string[]` lets each phase name the nodes it wants, and a node can be named by two phases without ambiguity — first-satisfying-phase wins.

The shape is also how a playwright thinks about it: not "node X's tier is 3" but "phase 3 brings in X".

**Tension 4: Essential vs. flavor vs. atmospheric within a phase.**

Inherits cleanly from THR-222. An essential node in phase 3 failing to resolve makes the composition `failed` (not the phase — the whole composition). A flavor node failing is dropped; composition continues. Atmospheric failures are silent. This propagates the THR-222 semantics naturally.

One edge case: what if an essential node in phase 1 resolves fine, but then an essential node in phase 3 can't be resolved (world state changed — the wizard tower got destroyed)? Composition transitions to `failed` at phase 3 evaluation. Phase 1's resolved nodes remain in place (they're real graph entities now). The composition is failed but its footprint persists. This is correct behavior — a real event that half-happened is canonically a half-happened event, not a retroactively-erased one.

## Why this matters beyond THR-225

The phase-runner is the template for any future authored-content arc:

- **Quest arcs**: quests are compositions with kind `quest`. A multi-phase quest gets phases without any DSL change.
- **Faction arcs**: a faction's rise-and-fall could be encoded as phases on a `faction` composition.
- **Character arcs**: agent compositions could carry phases keyed to world-flags (meet-cute phase, betrayal phase, reconciliation phase).

The DSL is one substrate for authored arcs. THR-225 ships the first runtime that understands arcs.

## What was NOT decided

**Chain Weakens prose.** The recipe names four story-beat template IDs; the prose itself is placeholder. Polishing to quality bar is a separate encounter-pipeline pass. The plan doc defers this explicitly.

**Cleanup of completed compositions.** v1 retains indefinitely. Deferral #1 in the plan doc.

**Runner support for non-doom-clock predicates.** Schema-accepted, runner-whitelisted. Deferral #2.

**Authoring UX.** Authors write recipes as TypeScript objects. No surface syntax yet. Per THR-222 carry-over — surface-syntax is a v1 call, not v0.

**Cross-phase dependencies.** Phase 3 can reference nodes resolved in phase 1 (via `resolvedNodes` on `ActiveComposition`). Whether phase 3 can reference nodes _not yet activated_ but declared in `nodes` is not explicitly specified — the plan assumes phase-ordering is the dependency graph (earlier phases resolve first). If an author needs a phase that references a later-phase node, they need to author it as activated in an earlier phase even if mechanically dormant. This is probably fine but untested in practice.

## Vision premises invoked

From `TheFantasyWorldSimulator/Vision/` (per game-design-direction):

- **"Content is design."** A phase structure is dramatic structure. Codifying it in the DSL makes the dramatic pattern cheap to reproduce.
- **"Turn-based pacing."** Phases are the event's tempo in turns. Players scan each tick; when a phase activates, they get a notable or story-beat moment to stop and engage.
- **"Cool failure."** A `failed` composition's footprint persists. The world carries the scar of a half-happened event. This is the engine honoring failure as plot.

No Vision premise is contradicted. The premise that's *strengthened* is "content is design" — making the dramatic arc the authoring primitive, not the execution primitive.

## Brainstorm questions parked for Christian review

None blocking this session — all required decisions resolved in the plan doc. Questions to raise at next sync, if the design goes into In Dev without his review:

1. Is the four-phase shape (rumor → materialization → response → crack) prescriptive enough that it belongs in authoring guidance? Or would we rather each event find its own shape?
2. Should phase story beats default to `tier: notable` or `tier: story_beat`? The recipe shows mixed. Is there a house rule?
3. For the dual-voice Chronicle surface (THR-155), do we want authored phases to always specify voice, or is divine-default OK?

## Sources

- Linear: THR-225, THR-222, THR-229, THR-219
- Plan: `Docs/plans/2026-04-23-thr-225-event-recipe-phased-activation.md`
- Prior DSL: `Docs/plans/2026-04-20-thr-222-composition-dsl.md`
- Pacing: `Docs/pacing-system-map.md`
- Code: `src/composition-dsl/schema.ts`, `src/engine/doomClock.ts`
- Prior brainstorm: `Brainstorms/2026-04-20-vision-layer.md`
