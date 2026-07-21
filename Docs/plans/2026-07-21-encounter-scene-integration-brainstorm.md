# Brainstorm Companion — Encounter Scene Integration (2026-07-21)

> Companion to `2026-07-21-encounter-scene-integration.md`. Captures the dialogue that produced the plan: alternatives considered, tensions surfaced, Vision premises invoked. Written in the same pass as the plan, not retrofitted.

## Originating dialogue

Christian (2026-07-21, verbatim core): *"we brainstormed and designed a multi step encounter (guard duty i think) that was focused on integrating encounters better in the game world, by having the encounter spawn things in the world, or use existing world objects (e.g. locations or agents) as part of the encounters. can you please assess how this part of our encounter framework works today as the encounters i have seen recently don't seem to be very dynamic or integrated into the world … at the same time. take a look at the prose of the encounters, since the prose has to be generic enough that it can reference dynamic world objects so that it does not just become prose."*

The assessment (this session) found the guard-duty support-bundle vision **implemented but orphaned**: world-binding works, but prose and aftermath can't reference what got bound, and continuity (seeds) can't carry it forward. The plan is the reconnection.

## The diagnosis, compressed

Three consumption layers never got connected to the binding layer:

1. **Prose** — `NarrativeContext` is actor-only. No `{target}`, no `{cast:*}`. Evidence: `social.forge_alliance` says "the other party" nine times; `flawed-steel.ts` hardcodes its cast names 93 times because there was no other way.
2. **Aftermath** — effects address literal node ids or fall back to the actor. `role:` documented but never implemented; `$target` exists only for three reach signatures (THR-555). `forge_alliance` creates no `relates_to` edge.
3. **Continuity** — 86 of 186 seeds are family-only (v1 stub: one narrative line, no encounter); `templateId` seeds spawn self-targeted, so follow-ups forget who the story was about.

## Alternatives considered and dismissed

**Alt 1 — Runtime LLM prose that "just knows" the scene.** Rejected without deliberation: already on the project's rejected-approaches list (Determinism NFP #3, Tunability NFP #1). The placeholder grammar is the settled answer; this plan widens its vocabulary rather than replacing it.

**Alt 2 — A new `participants[]` array on UnifiedAction with its own role system.** Rejected: `supportBindings` *is* the participant system — keyed, persisted, already consumed by clearance gates, chapter archive, and the linker. A parallel roles array would be the classic duplicate-substrate mistake (the THR-614 lesson). `role:` becomes an alias of `$cast:` instead.

**Alt 3 — Auto-target placeholders resolving "nearest co-located agent" when no explicit target exists.** Rejected in the plan's executor notes: inventing a referent when the engine has none produces prose that asserts relationships the graph can't back — worse than the generic noun. Absence must read as absence.

**Alt 4 — Hand-author support bundles across all ~235 linear templates.** Rejected on cost and on drift risk (235 bespoke bundles to keep honest). Family-level defaults with bind-only (`pre-seeded`) delivery get 80% of the payoff with one data module — and deliberately add zero world population.

**Alt 5 — Make family seeds a scored selection (value-per-tick style) instead of a flat seeded draw.** Deferred, not rejected: v2 keeps the surface minimal. If repetition shows up in play, scoring layers on without changing the seed contract.

**Alt 6 — Full branching-tier sweep (retire all hardcoded cast names) inside this plan.** Deferred: 23 files of careful prose surgery. The gate-duty pilot (Slice C) proves the pattern; the sweep is sized honestly as its own follow-up after the pilot teaches us the per-file cost.

**Alt 7 — Bond edges rendered on the hex map.** Out of scope; noted as N/A in the UI pillar so it reads as a decision, not an omission.

## Tensions surfaced

- **Reuse-first vs. authored cast identity.** Branching encounters *want* specific characters (Maren the smith with her specific shame); reuse-first wants the world's existing smith. `{cast:*}` dissolves most of the tension — prose written against the binding stars whoever the world supplies — but authored *backstory* beats that depend on a specific invented person remain a real cost of reuse. The pilot (gate duty, whose cast is generic by design) dodges this; the branching sweep will have to face it per-encounter. Flagged for the sweep follow-up.
- **Placeholder sprawl vs. authoring ergonomics.** Every new placeholder family grows the grammar authors must hold. Mitigation: the vocabulary mirrors existing idioms exactly (`{target:they}` echoes `{they}`; `{?has_cast:x}` echoes `{?knows_x}`), and the wiring guide's Capability 1 table remains the single inventory.
- **Trace volume vs. inspectability.** Target/cast resolution is high-frequency; tracing it would flood the ring buffer (the per-agent-burst lesson). Resolved: `__DEBUG.inspectSceneContext` carries inspectability; consumption-style traces stay reserved for consumption events.
- **Seed inheritance vs. stale context.** A follow-up 25 ticks later may inherit a dead target or a disbanded cast. Resolved fail-soft: re-validate at spawn, drop the dead, trace the drop, fall back to today's self-target.

## Vision premises invoked

- **Living world / nomadic stories** — encounters starring the world's existing people, who remember (bond edges) and return (seed inheritance), is the encounter-goal memory ("nomadic stories, not busy-ness") made mechanical.
- **Every primitive is clickable (Rule 4)** — targets join cast members as linked, inspectable references.
- **Failure is plot** — `bond_change` negative branches give social failure a persistent relational consequence, not just a reputation decrement.
- **Player-as-god unchanged** — everything here is mortal↔mortal scene fidelity; no new god verbs, no intervention-framing drift.

## UL notes

Candidate terms surfaced: **Scene** (target + cast + place of an action), **Cast** (support-bundle bindings viewed as characters), **Target** (the action's subject node). "Support bundle" itself is used by code and plans but may be undeclared in the UL Encounters shard. A `UL-proposal` issue accompanies the handoff rather than blocking it.
