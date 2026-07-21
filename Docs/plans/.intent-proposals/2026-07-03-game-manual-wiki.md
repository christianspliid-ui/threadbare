# Action Proposal — 2026-07-03-game-manual-wiki

## intent_quote

> expanding on file:///C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator/Design/tick-cycle-reference.html and the other pages
> I would like a full wiki of all the major game systems described as a basic game manual for the player and for me as a creative director.
> can you assess the full game architecture from a game design point of view, and create the game domain model and tickets for CC to create the individual pages. if you think smaller models can read, understand and describe a system well enough, feel free to delegate, if the system is complex, feel free to do most of the specification and investigation yourself.

> also add to our ways of working that when the code of core game systems is changed, the relevant wiki must be updated

## scope (what this plan does)

Assesses the game architecture from a design POV (plan §1); maps all major systems into a seven-domain model (§2); defines a 17-page dual-layer (player manual + designer notes) extension of the existing Design Reference Wiki with per-page specs, sources globs, complexity, and suggested models (§3, §5); adds a wiki-freshness working agreement made mechanical via a manifest `sources` field, an advisory `check:wiki-freshness` lint, and a CLAUDE.md Definition-of-Done bullet (§4); and breaks the work into 18 tiered Linear tickets (W0 infra + W1–W9 core loop + W10–W17 living world) in a new Game Manual Wiki project. Cowork writes no page HTML and no code — CC executes all tickets.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change any rule of play, engine behavior, or game content.
- Does not rewrite or split the existing deep pages (tick-cycle, encounters-agents, action-catalog) — they are re-sectioned in the manifest only, plus one blurb drift fix (Nine→Eight Reaches).
- Does not build an in-game help/manual UI surface — the wiki stays a served static reference; an in-game entry point would be a separate design.
- Does not make the freshness lint blocking — advisory-first per `check:process` convention; flipping is a later user verdict.
- Does not mirror pages into the Obsidian vault (rejected with user).

## impact_class

Reversible — static docs, additive manifest fields, one advisory lint script, one CLAUDE.md DoD bullet. All removable without engine impact.

## evidence cited

- **Linear issue:** THR-585 (W0, plan-doc carrier, Game Manual Wiki project; W1–W17 page tickets created after judge verdict)
- **Vision premises invoked:** Vision/00-north-star.md, Vision/01-core-loop.md, Vision/02-non-negotiables.md (quoted via rulebook, not edited)
- **UL terms touched:** none changed; pages are UL-consumers (Reach, Sphere, Thread, Court Position, Encounter, Aftermath, Doom Clock, Mandate, World-Soul, Echo). No new terms → no UL-proposal needed.
- **Canon pages consulted:** rulebook.md, rulebook-quick-reference.md, process.md; cosmology/encounters/prose/hex-map named as per-page authorities in ticket specs.
- **Prior plan docs this builds on:** Docs/design-reference-wiki.md (THR-521 pattern), 2026-05-05-canonical-documentation-strategy.md (UL → Canon → Plans layering; wiki sits as a presentation surface, not a new authority).
- **Rejected approaches considered and dismissed:** vault-as-surface, dual page tracks, blocking lint day-one, mega-page (plan §8).

## load-bearing decisions touched

None modified. Pages *document* several (hexes-not-graph-nodes, hex-granular awareness, orthogonal Reaches/Spheres, ascendants-same-prereqs, three-tier position) and must state them exactly as CLAUDE.md words them.

## high-impact files touched (from Codesight)

None. Tickets touch `public/`, `scripts/`, `Docs/`, `CLAUDE.md` only. (Codesight MCP not queried — no `src/` files in scope; fallback rationale per Step 0.5 skip rule for non-src changes.)

## kill criteria

If the first three shipped pages are not consulted (no drift catches, no user references to them within a month) or the freshness lint produces mostly false positives (sources globs too broad), stop the Tier 2 wave, narrow the globs or fold pages into fewer documents, and re-verdict with the user. Cheap to stop: each page is independent.

## explicit user sign-off

Declared Reversible, but the plan includes one CLAUDE.md edit (a High-risk trigger per the impact table). The user's verbatim directive mandating exactly that edit, 2026-07-03: "also add to our ways of working that when the code of core game systems is changed, the relevant wiki must be updated". The edit is a single additive Definition-of-Done bullet implementing that directive word-for-word; no other CLAUDE.md content is touched. Scoping verdicts captured via AskUserQuestion 2026-07-03 (surface, layering, scope, project — all "Recommended" options confirmed).

## author notes for the judge

The architecture assessment (§1) is Cowork's synthesis, marked as such — it drives page prioritization but asserts no new canon. The manual will honestly flag [DESIGN]-heavy areas (Twilight/World-Soul, Mandate stages) rather than describing unshipped behavior as real; this follows the rulebook's status-flag convention. CLAUDE.md was edited by Cowork (docs edit, not code) to record the user's ways-of-working directive immediately; the commit rides the plan-pending-commit flush. Delegation guidance (Suggested model per ticket) is advisory only — single-executor CC automation runs Opus regardless; the user's "delegate to smaller models" ask is honored via the advisory line and via Cowork having used Sonnet scouts for investigation.
