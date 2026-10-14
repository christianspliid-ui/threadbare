# Brainstorm companion — the view-model seam (THR-1822)

Companion to [`2026-10-14-thr-1822-view-model-seam.md`](2026-10-14-thr-1822-view-model-seam.md). Design session, 2026-10-14, run as a sub-session of the attended groundwork session (Christian present in the parent; the brief's decisions are settled input). No grill-me pass: the open questions were technical *how* under an agreed outcome (process.md rule 4), and every creative question had already been answered by the THR-1823 map's decision records.

## Vision premises engaged

- **Prose carries mechanics; numbers never reach the player.** The seam is where a magnitude becomes a word, once. Today each component bands (or fails to band) its own numbers — the actor card's raw rank "0.16" is the example THR-1827 measured.
- **The map is the table.** The land page, the lenses, Find and the Stage all ask "what is on this hex". One index answering that question is what keeps them agreeing.
- **Knowledge is part of play** (fog, familiarity, revealed possessions). Christian deferred the gating itself; the seam guarantees it lands in one function when he wants it.

## Alternatives considered

### Where the derivations live

| Option | For | Against | Verdict |
|---|---|---|---|
| Leave model builders in `src/components/` (where ten pure ones already sit) | No moves | The UI layer keeps owning game meaning; builders import component modules and drift toward React; nothing stops the next one being written inside a component | Rejected |
| **Pure selectors in `src/engine/views/`, no React, Node-tested** | The brief's settled call; testable without a DOM; one import direction (engine → components) | Moves files; some render-data types must move or be aliased | **Chosen** |
| A read-only graph proxy handed to components | Small diff | Components still hold graph semantics and re-derive meaning; the ratchet would count nothing real | Rejected |

### How view models reach React

| Option | Verdict |
|---|---|
| Eager push: build every VM at the end of each tick into a store | Rejected — most VMs are for one open surface; building all of them each tick is waste, and the tick loop would start depending on presentation code |
| Per-component `useMemo` keyed on `worldVersion` | Rejected — the cache would not be shared with the debug bridge or tests, and memo keys on the wrong counter are exactly the GameState-`worldVersion` hazard measured today |
| **Lazy pull through one `readView`, cached per session on the runtime, keyed on the runtime counters** | **Chosen** — zero cost while paused, at most one rebuild per tick per read VM, identical answer for the screen, the debug bridge and a Node test |
| An external state library (Redux / Zustand) | Rejected — a second state system beside GameState, and module-scope stores are a rejected approach for engine caches |

### What the cache keys on

`worldVersion` moves every tick; `structuralCacheVersion` moves on structural change. Each selector declares one. Graph identity is never a key (load-bearing decision; the graph mutates in place). The undeclared `state.worldVersion` some UI code bumps is not a key either: it lives on a React state copy, not on the runtime, and it misses most writes.

### Build every view-model family now, or with its surface?

| Option | For | Against | Verdict |
|---|---|---|---|
| THR-1822 builds every family (subject pages, Connections, land index, Find, lenses, Stage, Needs-you) up front | One ticket "finishes" the seam | Modules only tests read (`wiring-checklist.md` calls that not integrated); the families' shapes would be guessed before their surfaces exist; one huge PR | Rejected |
| **THR-1822 builds the core plus the map data it can switch over today; each family lands with, or just before, its surface — all typed here** | Every module has a consumer when it ships; the first slice proves the cache on a real, surviving surface | The seam is "finished" over several tickets | **Chosen** |

The map was chosen as the first consumer because it survives the overhaul unchanged, its derivations are GameView's largest block of graph queries (23), and the lenses build directly on them.

### The knowledge filter

| Option | Verdict |
|---|---|
| Build Christian's gating now | Out of scope: he deferred it ("we can build the gating functionality later") |
| Ship Find unfiltered | Rejected by THR-1832: search would name every agent and treasure in the world |
| **One `knowledgeFilterFor(surface)`: open for Connections and *In this land*, the seen floor for Find, the floor's hex rule for lens marks** | **Chosen** — today's behaviour exactly as decided, and gating later edits one function |

Lens marks use the hex rule because a hover line on a fogged hex would name what the fog hides, which THR-1830's "fog covers every lens mark" already forbids visually.

### Which ratchet pattern

| Option | Verdict |
|---|---|
| Count imports of `src/engine` from UI files | Rejected — imports of pure helpers (`wordedKey`, constants) are fine; the count would punish the wrong thing |
| Count `WorldGraph` references (graph handles) | Tracked, not ratcheted — import lines and pass-through props make it noisy, but it shows handles disappearing |
| **Count direct `WorldGraph` method calls, reads and writes separately** | **Chosen** — the brief's pattern; it measures game meaning computed in the UI. Writes get their own line because a UI write that forgets `touchWorld` breaks every cache |
| Include the debug panels | Rejected — they exist to show raw state; forcing them through view models has no player value. Their count is printed beside the ratchet |

### The GameView split

| Option | Verdict |
|---|---|
| Big-bang rewrite into frame / Inspector / Stage / map | Rejected by the brief (no migration of surfaces about to be deleted) and by risk: the file is a merge-conflict magnet |
| Let each new surface build cut its own piece out | Rejected — every build would edit the same 6,862-line file, so the lens, Inspector and Stage builds would queue on one mutex |
| **Seam first (derivations out), then one moves-only split into hosts (debug levers, dialogs, ceremony, Stage host, map, rails), then the new surfaces land in their own files; the Inspector deletes the legacy detail code instead of moving it** | **Chosen** — the split moves only what survives, and it unlocks parallel lanes |

Extraction order inside the split goes smallest-risk first: the debug levers are ~1,400 lines with no rendering; dialogs and ceremony are self-contained mounts at the tail of the JSX; the Stage host and the map follow; the rails last because the frame build will rebuild them anyway.

### Lens order relative to the Inspector

Lenses could wait for the land page (a lit hex opens it). They do not need to: THR-1830 says a hex click opens the land page *when it exists*, and until then the existing hex click stands. Lenses ride entirely on slice 1's map sources, so they go first and are the smallest build.

## Tensions surfaced

- **"Every page ends in Connections" vs the land page ending in "Around it".** Resolved as one thing: the land page's Connections block *is* "Around it" (where → region; the six neighbours), built by the same builder with the hex recipe.
- **Card counts on rows vs a cacheable Connections.** Counts depend on the hand, essence and range; folding them into Connections would make every page world-keyed and expensive. Split into `actOnCounts`, computed only for visible rows.
- **Dominion's VM carries a CSS variable name.** New VMs carry semantic keys instead; Dominion's is kept as built because the brief forbids forking it.
- **Notification state is React-only** (THR-1825's Law 55 gap). The Needs-you VM takes it as plain input rather than moving it into GameState — that move is its own ticket, not this one.

## Open forks for Christian

None. Every choice here is technical *how* under agreed outcomes. A few player-facing words are proposed rather than taken from a record — "No one holds this land", the heading "Holds and knows", and the headcount band ("a dozen or so", "scores", "a multitude") — and the surface tickets that render them may refine them.

## Revision after the first intent-judge pass (Revise)

The judge found three gaps, all fixed without a question to Christian: (1) player-facing text missing exact words for the rank band, the "last seen" line, Needs-you, kind words, sizes and lens legends — now quoted; (2) the `view_fallback` trace had no registration or sink, and slice 1 created a data file nothing read — now registered in the THR-928 trio, emitted through `emitTrace`, and the data file moved to the first family that needs it; (3) the surface nouns had no UL entries — proposed in THR-1882. It also raised the impact class to External (the plan changes the gate every executor runs), and two unscored notes were taken: the kill criteria now sit in the plan's executor notes, and the stale-write row now says "indefinitely while paused".

A member *count* ("15 members") was also replaced by a headcount word: the existing `networkSizeWord` precedent says a god does not count, and Law 13 forbids the numeral.

## Revision after the second intent-judge pass (Revise)

Two gaps, both fixed without a question to Christian. (1) The rank word had been taken from `member_of.rank`, but every surface that shows rank today (`getAgentInfoCard.factionRank`) and the mechanics take it from `member_of.reputation` through `computeRankFromReputation` — two sources would tell one fact two ways (PC-6). The person page now uses that same call, and the one producer that still prints the raw number (the DetailPage Faction Allegiances chip) is fixed at its source in step 4. (2) `src/types/trace.ts` (119 importers) joined the Blast Radius table.