# Action Proposal — the incident snapshot (THR-1134)

## intent_quote

> "lets get some more design ready for development" — Christian, attended chat, 2026-09-09.

> The ticket, filed by Christian on 2026-08-16 at his explicit request: *"Christian plays long simulation runs and periodically sees a game state that looks wrong. Today he has no way to hand that state to an agent for diagnosis. This ticket adds one."* Decisions already made, verbatim: *"Snapshot only. No replay/intervention log."* · *"It must work on the deployed build … This forces a small always-on collector rather than an extension of the `import.meta.env.DEV` bridge."* · *"Output is a downloaded `.json` file, not a clipboard string and not a URL."*

> The hourly briefing of 2026-09-09 22:05 listed it under *Also waiting*: *"The incident-capture button — you filed it on 16 August; 24 days idle, nothing blocking it. Yes puts it at the front of the design queue."* Christian's ask for more design ready for development is taken as that yes.

## scope (what this plan does)

Designs a production-safe incident recorder (two head-indexed rings: the last thousand tick events and a per-tick census row), a pure bundle assembler with a Map/Set-aware serializer and a self-checking manifest, a build-SHA `define`, a TROUBLE section in the existing settings popover (record toggle, include-the-world checkbox, save button), a debounced crash-time toast that names the door, a shared download helper that replaces two inline copies, and two `__DEBUG` accessors that call the same modules. Hands off to Ready for Dev with a coordination block.

## scope (what this plan does NOT do — explicit non-goals)

- No replay or intervention log (Christian's ruling).
- No save/load, no `toJSON` on `WorldGraph`, no new `GameState` field.
- Tracing is not turned on by default in production; the toggle is the design.
- No compression in v1; no URL-based sharing; no clipboard path.
- No `?seed=` URL parameter (noted as a possible follow-up, not built).
- No wiki page; no player-facing numerals anywhere on the surface.
- No change to the tick loop beyond one guarded O(1) append at the existing tick-end site.

## impact_class

Reversible — two new leaf modules, one hook, one helper, one `define`, one popover section, one added trace category; every existing behaviour is preserved and the one edit to an existing call (`exportDiagnostics` receiving state) is additive.

## evidence cited

- **Linear issue:** THR-1134
- **Vision premises invoked:** `Vision/02-non-negotiables.md` (#3 prose not numbers — the surface carries two sentences and no figure; #7 three pillars — Content N/A with rationale), `Vision/taste-profile.md` (prose-first UI; austere voice; the *Numbers in UI* anti-pattern)
- **UL terms touched:** none new; the bundle is named in plain words (*snapshot*) on the surface
- **Canon pages consulted:** `Docs/canon/process.md`, `Docs/canon/design-governance.md`, `Docs/canon/verification-gates.md` § Browser-verify, `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `2026-03-26-encounter-log-exporter-design.md` (the formatter/trigger split and the append-only accumulator precedent); `2026-07-23-thr-727-divine-receipt.md` (toast path); the four docs whose save/load claims this plan corrects (`2026-04-17`, `2026-04-18`, `2026-05-11`, `2026-05-12`) and `2026-03-04-vertical-slice-design.md:69`
- **Rejected approaches considered and dismissed:** extend `__DEBUG` (dead in prod); naive `JSON.stringify` (measured lossy); always-on tracing (measured O(n) eviction); gzip by default; a second top-bar icon; the DebugPanel; widening `MAX_RECENT_EVENTS` (nine writers); a modal crash prompt; editing `graph.ts` / `gameState.ts`

## load-bearing decisions touched

- *Engine caches must be owned per session, not stored at module scope* — respected by the decision's own mechanism: the recorder is a field on `SimulationRuntime`, created per playthrough, so it can never carry a previous run's events (revised after the first judge run, which asked why the prescribed home was not used).
- *The world graph is mutated in place* — irrelevant to a read-only capture; the bundle reads through the public getters at capture time.
- *Everything is a graph node/edge* — nothing written; the world tier serializes nodes and edges as they are.
- *Fail-soft (NFP #4)* — the append and every section are isolated; a toast, never a modal.

## high-impact files touched (from Codesight)

`src/engine/simulationRuntime.ts` (184 importers) — one added optional field; `src/types/trace.ts` (120 importers) — one added category at the four registration sites; the plan carries a `## Blast Radius` section with both rows. Deliberately untouched: `src/engine/graph.ts` (865), `src/types/gameState.ts` (563), `src/engine/traceBuffer.ts` (358), `src/engine/gameInit.ts` (105).

## kill criteria

- The incident-tier file exceeds what Christian's chat client attaches → halve the event ring first; record the limit.
- A cold agent given three real bundles cannot name the subsystem in any → name the missing signal and add it as a section.
- Tick cost rises measurably with the recorder on → the census row moves to every nth tick.
- Anyone proposes always-on tracing → measure the saturated eviction first.

## explicit user sign-off

Not required (Reversible). The ticket itself was filed at Christian's explicit request with the three decisions above recorded verbatim.

## author notes for the judge

- The two facts that most changed the design were measured, not inferred: the lossy stringify (1,661,839 bytes with an empty graph) and the trace ring's eviction cost. The plan is shaped around them.
- The browser-verify contract's requirement 3 (`__DEBUG` assertion) contradicts the feature's purpose on the production build; the plan resolves it with a named substitution (`vite preview` + Playwright download event + `window.__DEBUG === undefined`) rather than leaving it for the executor to discover at the gate.
- I chose the settings popover over a new top-bar control on Laws 21/26/27 grounds; the crash toast is what makes it discoverable on the day it matters.
- The four stale save/load claims in older plan docs are corrected as a docs-only line each; that is documentation honesty, not scope creep, and the plan says so.
