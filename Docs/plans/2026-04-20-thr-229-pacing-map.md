# Codex brief — THR-229: Pacing system map (precursor to event integration)

## Context

Threadbare already has a universal pacing system that handles beat tempo, breath, and narrative rhythm across quest and encounter content. THR-229 pushes back on building a bespoke "event tempo" knob for doom-clock events — events should plug into the existing pacing system rather than get a parallel tempo mechanism. Before wiring events in (which is THR-225's job), we need a clear map of the existing pacing system: its hooks, its knobs, where new composition types can attach.

This is a **mapping/documentation task**. Read-only — no changes to pacing code.

## Goal

Produce a technical map of the existing pacing system with enough detail that the doom-clock event integration in THR-225 is a straightforward wire-up rather than an archaeology expedition.

## Approach

1. **Find the pacing system.** Grep for `pacing`, `tempo`, `beat`, `rhythm`, `cadence`, `breath`. Identify the files that implement the core logic (not just the ones that consume it).

2. **Map the public surface.** What hooks or APIs do other systems use to register content into pacing? How is pacing weight computed — authored, procedural, hybrid? Where are the knobs?

3. **Identify integration points.** If doom-clock events want to plug in, where would they hook? Single registration point, or multiple? What does existing content pass in?

4. **Trace 2-3 concrete consumers.** Pick two or three existing content types (e.g., a quest, an encounter, a mandate) and walk through how they register with pacing end-to-end. This surfaces implicit assumptions that aren't documented.

5. **Call out misalignments.** If the current pacing API assumes quest-shaped content and events would need a different shape, document it — that's valuable context for THR-225, not a failure.

## Output

Write `docs/pacing-system-map.md` (adjust to repo conventions).

Structure:
- **Overview** — one paragraph: what pacing does, where it lives, who owns it
- **Core files** — annotated list of the key implementation files with one-line purposes
- **Public API** — hooks and registration points, with signatures and one-line purposes
- **How existing content uses it** — 2-3 worked examples, file-referenced
- **Where events would plug in** — proposed integration points for doom-clock events, concrete enough to implement from
- **Misalignments** — anything about the existing API that makes event integration awkward; if events don't fit cleanly, explain why

## Acceptance criteria

- Every public entry point of the pacing system is documented.
- At least two existing consumers are walked through end-to-end.
- The "where events would plug in" section is concrete enough that THR-225's implementer doesn't need to re-read the whole pacing codebase.
- Misalignments are honest — "events don't fit cleanly, here's why" is a valid finding, not a failure.

## Non-goals

- Do **not** implement event-pacing integration. That's THR-225.
- Do **not** refactor the pacing system.
- Do **not** propose bespoke event-pacing knobs — the whole point of THR-229 is that we don't build those. If your map suggests events can't plug into existing pacing without bespoke knobs, that's a design finding to surface — not a license to design one.

## Linear

- This brief: THR-229 — https://linear.app/threadbare/issue/THR-229/pacing-integration-for-events-no-bespoke-tempo-knob
- Related: THR-225 (event phased activation) — https://linear.app/threadbare/issue/THR-225/event-recipe-phased-activation-tied-to-doom-clock-tiers
- Source: THR-219 — https://linear.app/threadbare/issue/THR-219/actors-procedural-floor-authored-layer-for-threaded-agents-brainstorm
