# Brainstorm — the incident snapshot (THR-1134)

*Companion to `2026-09-09-thr-1134-incident-snapshot.md`. What was weighed, in the order it came up, 2026-09-09.*

**How this started.** Christian filed it himself on 16 August: he plays long runs on the deployed site, sees a state that looks wrong, and can send a screenshot and a sentence. Three decisions were already his — snapshot only, must work in production, a downloaded file — so the design question was never *whether* but *what goes in, and how it gets out of a build that has no debug bridge*.

**First framing, wrong.** Extend `window.__DEBUG` with an `exportBundle()` and let Christian call it from the console. Dead on the ticket's own terms: the bridge is `if (import.meta.env.DEV)` at line 8, and Christian is chat-only — a console is a keyboard shortcut with extra steps.

**The trap that reshaped everything.** The survey measured `JSON.stringify(state)`: 1.66 MB, no error, and the graph inside it is four empty objects. Every `Map` on the state is `{}`. Four plan docs since April say fields "survive save/load via the existing graph-snapshot serialization"; there is no such thing. So the assembler owes a replacer *and* a manifest that proves it ran — a bundle that looks whole and is hollow is worse than no bundle, because it would be trusted.

**Tiers, not one file.** Full fidelity is ~4.9 MB (the graph alone is 3.26 MB, 66%). The things that answer *why* — crash stacks, health reports, the event trail, the drift of node counts over time, what was open — are ~50 KB. So the default is the small tier and the world is a checkbox. Rejected: gzip by default via `CompressionStream` — it makes the file unreadable without a tool, and the small tier does not need it. Kept as the first move if the world tier ever exceeds what chat attaches.

**What answers "why did it drift".** `recentEvents` is 100 entries — three to five ticks. By the time a world looks wrong the cause is gone. Two rings, kept by a recorder that runs in prod the way `tickHealthMonitor` already does: a thousand tick events, and a per-tick census row (node and edge counts, action and notification queue depths). The census ring is the cheap one and the revealing one — a graph that grew by four hundred nodes in ten ticks is a line on a chart, not an inference. Rejected: widening `MAX_RECENT_EVENTS` — nine writers re-apply that cap independently and one hardcodes 99; touching it is nine edits for a worse result.

**Traces stay opt-in.** The obvious move is to turn the trace ring on in production so the causal trail is always there. Measured against it: `emitTrace` evicts with `shift()` and renumbers all 2000 entries per evicted entry, and a saturated tick evicts thousands. NFP #7 says profile before optimizing, and the profile says no. So the settings popover gets a *record* toggle that says out loud that it slows the world, and the bundle takes the ring only when it was armed. Rejected: a smaller always-on ring — same O(n) shape, smaller n, still a cost paid by every player for a file one player downloads.

**Where the button lives.** The ⚙ popover is the only prod-reachable home of global controls and already holds the debug toggle, fog, palette, notifications and audio. A second top-bar icon costs permanent real estate for a rarely used affordance and would need a Laws argument it cannot win. Rejected: the DebugPanel — DEV-gated in practice, and forty-one tabs deep.

**Discoverability without a shortcut.** Christian will not remember a button in a popover on the day he needs it. The engine already knows the moment: `appendCrashLog` fires when a tick throws. One toast, debounced, that names the door. Rejected: a modal — the crash may have happened mid-encounter and an interrupt would destroy the state he is trying to capture.

**Build SHA.** No runtime source exists; `vite.config.ts` has no `define`. Vercel exposes `VERCEL_GIT_COMMIT_SHA` at build time, so it is one line. A bundle that says `local` is itself a finding (it was captured on a dev server, not the site).

**The tiles are regenerable.** `mulberry32` is constructed per call from seed and tick; there is no advancing generator. `seed` + map preset + the flags reproduce tick 0 exactly, so 150 KB of tiles is left out and the key is kept in. The ticket is right that a seed gets an agent *near* the world, not *to* it — but near plus the small tier is the whole point of the small tier.

**Numbers on the surface.** The first draft of the toast said *saved (312 KB)*. Law 13. The file carries every number; the surface carries two sentences.

**The browser-verify contradiction.** The contract demands a `__DEBUG` assertion for a feature whose point is working where `__DEBUG` is undefined. Settled in the plan rather than at the gate: the dev capture proves the button and uses `__DEBUG.buildIncidentBundle()`; a `vite preview` run with Playwright's download event and a `window.__DEBUG === undefined` check proves the production path, recorded as a named substitution.

**Not taken.** A `?seed=` URL parameter so an agent can regenerate tick 0 without the CLI — useful, small, and not this ticket; the bundle records the seed and the executor may file it. A replay log — Christian ruled it out. Any edit to `graph.ts` or `gameState.ts` — the two largest hubs in the repo, and the leaf-module shape gets the same capability for free.
