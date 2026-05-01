# THR-294 — UL Drift Triage (2026-05-01 scan)

**Date:** 2026-05-01
**Status:** Plan — handoff to Claude Code
**Parent issue:** [THR-294](https://linear.app/threadbare/issue/THR-294) — Drift scan [2026-05-01]: UL drift — 0 canonical-unused, 15 used-uncanonical
**Project:** Continuous Improvement
**Author:** Cowork
**Type:** Continuous-improvement / vocabulary governance

## 1. Why

The 2026-05-01 weekly drift scan flagged 15 PascalCase / Title-Case tokens that appear ≥4 times across the doc + source corpus but match no canonical UL term or alias. UL governance commits us to triaging every drift-scan signal weekly so the canonical glossary stays the live authority on vocabulary, not a museum piece. Letting these candidates pile up across scans creates a quietly expanding gap between what the codebase calls things and what the UL says they should be called — exactly the drift the scan exists to prevent.

The 15 candidates fall into three natural buckets:

- **Synonyms of existing canonical terms** that the UL's `Aliases:` line never spelled the no-space TypeScript form for, so the lookup misses them. Mechanical fix: add the literal codebase identifier as an alias.
- **Genuinely new canonical concepts** that the codebase relies on but the UL doesn't yet define. Worth promoting.
- **Implementation details** (component names, doc-meta phrases) that aren't domain concepts and shouldn't dilute the UL. Add to the drift-scan stopword set.

This is a small, well-scoped maintenance pass — exactly the kind of work the weekly continuous-improvement cycle is designed to absorb.

## 2. Scope

**In scope:**

- Edit five UL shard files (`Cosmology.md`, `Agents.md`, `Graph.md`, `Prose.md`, `Process.md`) — add aliases on existing entries, add new canonical entries.
- Edit `Docs/ubiquitous-language/README.md` — append the six new term-index links so the always-load surface stays comprehensive.
- Edit `scripts/drift-scan/index.ts` — extend `UL_STOPWORDS` with four implementation-detail terms.
- Run `npm run mirror-ul` to push the updated shards to the Obsidian vault.
- Close THR-294 once the next manual drift scan (or a CI re-run) reports green for S4.

**Out of scope (deferred / separate issue):**

- Building the in-app `?view=ul` dashboard (THR-289) — the dashboard is its own design.
- Re-running the full drift-scan pipeline as part of this work — drift-scan is automated and runs on Fridays via `flush-plan-docs` cycle. Manual re-run only required if we want to verify-after-write before next Friday's scan.
- Editing any code that uses the now-canonical terms — terms become canonical by being defined in UL; no source-code rename is needed.
- Vault `Index.md` rebuild — `mirror-ul` already touches the vault `log.md`; the existing UL pointer entry in `Index.md` (added by the 2026-04-28 mirror plan) is unchanged by adding term-level entries to shards.

## 3. Three Pillars

| Pillar | Status | Notes |
|---|---|---|
| Engine | N/A | No tick-loop, graph, or runtime change. The TypeScript types being canonicalized (`GameState`, `HexTile`, `TerrainType`, `AxiologicalProfile`, `ValuePair`, `TickEvent`) already exist; we are documenting them, not creating them. |
| Content | ✅ | The UL itself is content (terminology is content). Five shard markdown files plus the README index get edits. |
| UI | N/A | No surface changes. The Obsidian vault mirror is updated by `npm run mirror-ul` as a tooling step, not a UI change. |

## 4. Triage table — what each candidate becomes

| Term (occurrences) | Decision | Target | Rationale |
|---|---|---|---|
| `GameState` (413) | **B. New canonical** | `Graph.md` | The central per-session state object; referenced by virtually every subsystem. Documenting it pins its role and contents at the UL level. |
| `SphereName` (240) | **A. Add alias** | `Cosmology.md` → "Sphere" | TypeScript literal-union type for sphere identifiers. Same concept as canonical "Sphere". |
| `ReachDomain` (233) | **A. Add alias** | `Cosmology.md` → "Reach" | TypeScript literal-union type for reach identifiers. Same concept as canonical "Reach". The existing alias "Domain" is the human term; "ReachDomain" is the code identifier. |
| `HexTile` (128) | **B. New canonical** | `Graph.md` | The fundamental spatial unit — one cell on the world's hex grid. Holds terrain, divine influence, corruption, exploration attraction, danger level. Distinct from `Node` (graph) and `Hex` (already used informally). |
| `GameView` (124) | **C. Stopword** | drift-scan `UL_STOPWORDS` | UI route enum (`?view=game`, `?view=codex`, etc). Implementation surface, not a domain concept. |
| `TickEvent` (121) | **A. Add alias** | `Prose.md` → "Narrative Event" | The TypeScript interface behind the canonical "Narrative Event" term. The existing alias "Tick Event" (with space) doesn't match the no-space code identifier. |
| `GraphNode` (117) | **A. Add alias** | `Graph.md` → "Node" | The TypeScript interface behind the canonical "Node" term. The existing alias "Graph Node" (with space) doesn't match the no-space code identifier. |
| `DebugPanel` (111) | **C. Stopword** | drift-scan `UL_STOPWORDS` | Specific React component name. Discussed in CLAUDE.md as a debug surface, but not a domain concept. |
| `HexMapV2` (104) | **C. Stopword** | drift-scan `UL_STOPWORDS` | Specific React component name with version suffix. Implementation detail; the canonical term for the surface is "hex map" (informal). |
| `TerrainType` (95) | **B. New canonical** | `Graph.md` | The 42-value biome enum (`forest`, `mountain`, `glacier`, etc.) on every `HexTile`. Content vocabulary worth canonicalizing. |
| `Implementation Plan` (91) | **B. New canonical** | `Process.md` | The artifact Cowork produces in `Docs/plans/`; cited in handoffs, commits, retros, and the design-governance checklist. Distinct from the Linear state "Implementation Planning". |
| `Tech Stack` (89) | **C. Stopword** | drift-scan `UL_STOPWORDS` | Generic title-case doc phrase appearing in CodeSight output and READMEs. Not a Threadbare-specific concept. |
| `AxiologicalProfile` (85) | **B. New canonical** | `Agents.md` | An agent's value-pair scores (e.g. `mercy_ruthlessness: +0.7`). Drives epithet generation, reaction selection, ambition matching. Foundational agent-psychology concept. |
| `ValuePair` (82) | **B. New canonical** | `Agents.md` | The atomic unit of `AxiologicalProfile`: a virtue/flaw axis (e.g. `mercy_ruthlessness`). One per Reach plus the meta pair `courage_prudence`. Defined in `src/types/agent.ts`. |
| `CosmologyProfile` (81) | **A. Add alias** | `Cosmology.md` → "Cosmology Profile" | The TypeScript interface behind the canonical "Cosmology Profile" term. Existing canonical name has a space; codebase identifier doesn't. |

**Buckets:**
- A. Aliases on existing canonical entries: **5** (SphereName, ReachDomain, TickEvent, GraphNode, CosmologyProfile)
- B. New canonical promotions: **6** (GameState, HexTile, TerrainType, Implementation Plan, AxiologicalProfile, ValuePair)
- C. Stopwords: **4** (GameView, DebugPanel, HexMapV2, Tech Stack)

Total = 15. ✓

## 5. Concrete shard edits

### 5.1 `Docs/ubiquitous-language/Cosmology.md`

**Add aliases on three existing entries.** Locate the `**Aliases:**` line of each, append the listed token (comma-separated, before the trailing newline).

| Entry heading | Existing aliases | Add |
|---|---|---|
| `### Reach` | `Action Domain, Domain` | `, ReachDomain` |
| `### Sphere` | `Cosmic Energy, Sphere of Influence` | `, SphereName` |
| `### Cosmology Profile` | `World Cosmology, Seeded Cosmology` | `, CosmologyProfile` |

### 5.2 `Docs/ubiquitous-language/Graph.md`

**Add one alias** on the existing `### Node` entry:

| Entry heading | Existing aliases | Add |
|---|---|---|
| `### Node` | `Graph Node, World Node` | `, GraphNode` |

**Insert three new canonical entries** at the end of the file (after `### SimulationRuntime`), separated by `---`:

```markdown
### GameState

**Aliases:** Game State, Session State
**Also see:** `[[WorldGraph]]`, `[[Cosmology Profile]]`, `[[HexTile]]`
**Status:** canonical

The per-session container for everything the simulation needs to advance one tick. Holds meta (`tick`, `cycle`, `phase`, `seed`), the world graph, the cosmology profile, all hex tiles, the simulation clock, the player's Ascendant identity and essence pool, the mandate, the doom track, encounter queues, and tick-event buffers. `GameState` is mutated in place by the orchestrator each tick; UI selectors read it via `worldVersion` rather than object reference. Definition: `src/types/gameState.ts`.

---

### HexTile

**Aliases:** Hex, Tile, Hex Cell
**Also see:** `[[Three-tier Position Model]]`, `[[TerrainType]]`, `[[GameState]]`
**Status:** canonical

One cell on the world's hex grid — the top tier of the three-tier position model. A `HexTile` carries its axial coordinate, geographic parameters (elevation, moisture, temperature), terrain biome, optional river flag, region assignment, plus mutable per-tick state: divine influence, corruption, exploration attraction, base terrain (for restoration), and positional danger. Stored in `GameState.tiles`. Agents resolve their hex by walking up the `located_at` edge chain to the first hex they reach.

---

### TerrainType

**Aliases:** Biome, Terrain Biome
**Also see:** `[[HexTile]]`
**Status:** canonical

The 42-value biome enum on every `HexTile.terrain`. Categories include water (`ocean`, `lake`, `river`, `reef`), lowlands (`grassland`, `farmland`, `savanna`), forest (`temperate_forest`, `dense_forest`, `boreal_forest`, `jungle`), wet (`swamp`, `marsh`, `moor_bog`), elevated (`hills`, `mountains`, `plateau`, `badlands`), special (`great_home_trees`, `broken_lands`, `oasis`), and extreme (`desert`, `tundra`, `glacier`, `volcano`). Used by encounter scoring, awareness rules, sublocation eligibility, and prose tier biasing. Definition: `src/types/index.ts`.
```

### 5.3 `Docs/ubiquitous-language/Agents.md`

**Insert two new canonical entries** at the end of the file, separated by `---`:

```markdown
### AxiologicalProfile

**Aliases:** Axiological Profile, Value Profile, Agent Values
**Also see:** `[[ValuePair]]`, `[[Reach]]`, `[[Agent]]`
**Status:** canonical

An actor's signed score across every `ValuePair` — `Record<ValuePair, number>` ranging from −1.0 (flaw pole) to +1.0 (virtue pole). Drives epithet generation, social-encounter responses, ambition selection, and cross-agent compatibility scoring. The eight Reach-bound pairs plus the meta pair `courage_prudence` make nine slots per profile. Definition: `src/types/agent.ts`.

---

### ValuePair

**Aliases:** Axiological Pair, Virtue/Flaw Axis
**Also see:** `[[AxiologicalProfile]]`, `[[Reach]]`
**Status:** canonical

A single virtue-flaw axis composing an `AxiologicalProfile`. The eight Reach-bound pairs are: `mercy_ruthlessness` (Iron), `asceticism_extravagance` (Gold), `honesty_cunning` (Shadow), `tradition_novelty` (Veil), `loyalty_ambition` (Heart), `revelation_discretion` (Eye), `preservation_transformation` (Stone), `sacrifice_survival` (Star). Plus one meta pair: `courage_prudence`. Convention: +1.0 = first pole (virtue), −1.0 = second pole (flaw). The pre-TB-075 pairs `frankness_propriety`, `humility_pride`, and `stoicism_passion` are deprecated; do not reintroduce them.
```

### 5.4 `Docs/ubiquitous-language/Prose.md`

**Add one alias** on the existing `### Narrative Event` entry:

| Entry heading | Existing aliases | Add |
|---|---|---|
| `### Narrative Event` | `Tick Event, World Event` | `, TickEvent` |

### 5.5 `Docs/ubiquitous-language/Process.md`

**Insert one new canonical entry** at the end of the file, separated by `---`:

```markdown
### Implementation Plan

**Aliases:** Plan Doc, Design Doc, Plan
**Also see:** `[[Design Governance]]`, `[[Definition of Done]]`, `[[Coordination Block]]`
**Status:** canonical

The Cowork-authored design artifact in `Docs/plans/YYYY-MM-DD-<topic>.md` that turns a Linear issue into something an executor can implement. Each plan covers all three pillars (Engine, Content, UI), runs the NFP audit, lists constants and traces, marks fail-soft cases, and produces the wiring section that connects new modules to orchestrator phases, UI components, and trace categories. The plan-pending-commit label gates an hourly scheduled task that commits the file to `origin/main`. Distinct from the Linear state **Implementation Planning**, which is the workflow phase where the plan is being written.
```

### 5.6 `Docs/ubiquitous-language/README.md`

**Append six entries to the term index.** Insert each in its corresponding shard subsection, alphabetically where natural:

- Under `### Cosmology` — no new canonical entries (only alias additions); README already names "Sphere", "Reach", "Cosmology Profile". No README change needed for §5.1.
- Under `### Agents` — append:
  - `- **[AxiologicalProfile](./Agents.md#axiologicalprofile)** — signed score across every ValuePair; drives epithet, social response, ambition selection`
  - `- **[ValuePair](./Agents.md#valuepair)** — a single virtue/flaw axis (e.g. mercy_ruthlessness); nine pairs total, eight Reach-bound plus one meta`
- Under `### Graph` — append:
  - `- **[GameState](./Graph.md#gamestate)** — per-session simulation container; mutated in place per tick; UI reads via worldVersion`
  - `- **[HexTile](./Graph.md#hextile)** — one cell on the world's hex grid; top tier of the three-tier position model`
  - `- **[TerrainType](./Graph.md#terraintype)** — 42-value biome enum on every HexTile; drives encounter scoring and awareness`
- Under `### Process` — append:
  - `- **[Implementation Plan](./Process.md#implementation-plan)** — Cowork-authored design artifact in Docs/plans/; the executor's input`
- No README change needed for §5.4 alias-only edit on Narrative Event (already indexed).

**Update the closing line** of the README from:

```
*v1 — 73 canonical terms. Coverage expands via the propose-new-term flow. UL wins on terminology disagreements.*
```

to:

```
*v1.1 — 79 canonical terms (THR-294 added GameState, HexTile, TerrainType, Implementation Plan, AxiologicalProfile, ValuePair). Coverage expands via the propose-new-term flow. UL wins on terminology disagreements.*
```

### 5.7 `scripts/drift-scan/index.ts`

**Extend `UL_STOPWORDS`** (line 41–74). The set is alphabetically ordered; insert each new entry in the right place. The set entries are lowercased; multi-word phrases keep their internal spaces.

| Add | Position |
|---|---|
| `"debugpanel"` | After `"content"`, before `"coordination"` |
| `"gameview"` | After `"github"` (alphabetically: gameview comes before github) — actually after `"docs"`, before `"graphql"`. |
| `"hexmapv2"` | After `"graphql"`, before `"issue"`. |
| `"tech stack"` | After `"team"`, before `"todo"` |

Final sorted entries (relevant slice):

```ts
const UL_STOPWORDS = new Set([
  "api",
  "backlog",
  "build",
  "ci",
  "claude",
  "codex",
  "content",
  "coordination",
  "debugpanel",       // ← new (THR-294)
  "docs",
  "gameview",          // ← new (THR-294)
  "graphql",
  "github",
  "hexmapv2",          // ← new (THR-294)
  "issue",
  "issues",
  "json",
  "linear",
  "mcp",
  "nfp",
  "process",
  "project",
  "readme",
  "repo",
  "skill",
  "state",
  "status",
  "team",
  "tech stack",        // ← new (THR-294)
  "todo",
  "typescript",
  "ul",
  "utc",
  "vite",
  "vitest",
  "workflow",
]);
```

Note: alphabetical ordering above shifts `gameview` to between `docs` and `graphql` per actual `g`-letter sort (`d-o-c-s` < `g-a-m` < `g-i-t` < `g-r-a` < `h`). Apply ordering as written.

## 6. Wiring

| Surface | Touch | Why |
|---|---|---|
| Repo `Docs/ubiquitous-language/*.md` | edits per §5.1–5.6 | Authoritative source. |
| Repo `scripts/drift-scan/index.ts` | edit per §5.7 | Stop the four implementation-detail terms from re-flagging on next scan. |
| Obsidian vault `Ubiquitous-Language/` | regenerated by `npm run mirror-ul` | Human read surface. The mirror script reads the shards verbatim and writes to the vault; our shard edits propagate automatically. |
| Vault `log.md` | one entry, appended automatically by `mirror-ul` | Change-audit-trail per CLAUDE.md. |
| `Docs/changelog.md` | one row | Content-policy change record. |
| Linear THR-294 | close on completion | Verification: re-running drift-scan locally (or waiting for next Friday's CI run) should show 0 used-uncanonical. |

## 7. Constants

No new tunable constants. `UL_UNCANONICAL_MIN_OCCURRENCES = 4` already exists in the drift scan (line 22) and stays unchanged. The four stopword additions are data, not tunables.

## 8. Tracing

N/A — no engine work, no traces emitted. The closest analog is the drift-scan output itself (signal status: green / red / skipped), and that already exists.

## 9. Fail-soft

| Case | Behavior |
|---|---|
| `mirror-ul` fails because Obsidian MCP is unreachable | Falls back to filesystem write at `OBSIDIAN_VAULT_PATH/Ubiquitous-Language/` per the existing pattern (impediment #66 et al.). Already implemented in the mirror script. |
| Editor leaves a malformed `**Aliases:**` line on a shard | `parseUlShardTerms` (drift-scan line 427) ignores entries with no aliases match — no parse crash, just a silently empty alias list. Verify after edit by running `node --experimental-strip-types scripts/drift-scan/index.ts` locally and checking that the previously-flagged candidates fall out of the report. |
| README index entry links to a non-existent anchor | Obsidian renders the broken link as plain text; `vault-lint` flags it on next run. Mitigation: the headings in §5.2/5.3/5.5 are the literal entries we're adding, so anchors will resolve. |
| Stopword name collision with a future legitimate term | Unlikely for the four chosen tokens (`gameview`, `debugpanel`, `hexmapv2`, `tech stack`). If the simulation ever introduces a domain concept literally named "Game View", the stopword set will shadow it; the fix is to remove the stopword and add the term canonically. |

## 10. NFP Compliance

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All four stopwords are data in a single named `Set`; no magic numbers introduced. |
| 2. Inspectability | PASS | The triage table (§4) makes every decision auditable. The drift-scan re-run (verification step) makes the outcome inspectable. |
| 3. Determinism | PASS | UL parsing is deterministic (regex + heading split). No PRNG involved. |
| 4. Fail-soft | PASS | Mirror falls back to filesystem on Obsidian MCP failure; broken anchors render as plain text; malformed alias lines parse to empty. |
| 5. Narrative over mechanical | PASS with note | Vocabulary clarity is narrative infrastructure — when terms drift, prose drifts. The new canonical entries (especially `AxiologicalProfile`, `ValuePair`) lock in the agent-psychology vocabulary that prose resolvers consume. |
| 6. Additive over destructive | PASS | All edits are additions: new aliases, new entries, new stopwords. Nothing is renamed or removed. |
| 7. Performance budget | PASS | UL parsing runs once per drift-scan execution (weekly); doc corpus regex pass scales linearly with `Docs/` + `src/` size. Adding six terms adds 6 string lookups in the canonical set per candidate token — negligible. |

## 11. Test plan

No automated tests added — UL changes are content. Manual verification:

1. **Local drift-scan re-run** (optional pre-merge): `node --experimental-strip-types scripts/drift-scan/index.ts` — expect S4 to report green, or a smaller used-uncanonical list with the 15 triaged candidates absent. (`LINEAR_API_KEY` is required; if running locally without it, gate the issue-creation phase by setting it to a dummy and trapping the throw — or simply read the printed signal status.)
2. **`npm run mirror-ul`** — confirm vault mirror updates without errors and `log.md` gets a new entry.
3. **`npm run check:process`** — advisory workflow lint should still pass.
4. **`npx tsc --noEmit`** — no TypeScript change but standard pre-commit step.
5. **Visual check** — open one of the edited shards in Obsidian (or just `cat`) and confirm headings render and anchors are intact.

## 12. Done when

- [ ] `Docs/ubiquitous-language/Cosmology.md` has the three alias additions in §5.1.
- [ ] `Docs/ubiquitous-language/Graph.md` has the GraphNode alias and the three new canonical entries (GameState, HexTile, TerrainType).
- [ ] `Docs/ubiquitous-language/Agents.md` has the two new canonical entries (AxiologicalProfile, ValuePair).
- [ ] `Docs/ubiquitous-language/Prose.md` has the TickEvent alias on Narrative Event.
- [ ] `Docs/ubiquitous-language/Process.md` has the Implementation Plan canonical entry.
- [ ] `Docs/ubiquitous-language/README.md` index has six new term-link rows; closing line updated to v1.1 / 79 terms.
- [ ] `scripts/drift-scan/index.ts` `UL_STOPWORDS` includes the four new tokens.
- [ ] `npm run mirror-ul` runs clean; vault `Ubiquitous-Language/` shards updated; `log.md` appended.
- [ ] `Docs/changelog.md` has one row for the UL drift triage.
- [ ] Closing commit message body includes `Fixes THR-294`.
- [ ] Linear THR-294 auto-closes on merge to main; CC adds a completion comment listing the buckets and term counts.

## 13. Risks and notes

- **Drift-scan baseline**: the scan stores `s4CanonicalLastSeen` in `drift-scan-baseline.json`. Adding new canonical terms means they get tracked from the first run after merge — they'll start the 30-day clock fresh, so they won't cause spurious "canonical-unused" flags. No baseline reset needed.
- **Alias case-sensitivity**: `parseUlShardTerms` lowercases aliases via `toLowerToken`. The literal codebase identifiers (`SphereName`, `ReachDomain`, etc.) end up lowercased in the lookup, matching candidates regardless of the casing they appear in. No case-related edge cases.
- **Multi-word stopwords**: `UL_STOPWORDS` already supports them (the lookup uses `set.has(lower)` on the trimmed lowercase form, which preserves internal spaces). `"tech stack"` is the first multi-word stopword in the set; it works the same as single-word entries.
- **Future drift signals**: this triage closes a single Friday's signal. Next week the scan will rerun; if anything new shows up, it gets a new `drift-scan`-labeled issue and the same triage protocol applies. This plan can be cited as the precedent for shape (Aliases / Promote / Stopword) when triaging future signals.
- **No Vision audit needed**: UL is below Vision in the documentation stack. Vocabulary changes don't update Vision premises. Nothing in the triage contradicts Vision.

---

*Plan authored by Cowork. Three-pillar exit criteria satisfied (Engine/UI N/A with rationale, Content active). Ready for Claude Code pickup.*
