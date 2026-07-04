> **title:** `Encounter density vision & Chapter Ledger — THR-603`
> **linear_issue:** THR-603
> **author:** Cowork
> **created:** 2026-07-04
> **three_pillars:** Engine `done` · Content `done (doc/prose edits; no new templates)` · UI `done`

# Encounter density vision & Chapter Ledger — THR-603

*Settles the encounter-density open question (player-authored density, not a ration) and builds the surface that makes many concurrent encounters manageable: a persistent, always-readable Chapter Ledger.*

## Why this is load-bearing

The manual shipped "three to six encounters per session" as doctrine. It was never a decision — Vision `01-core-loop.md` carries it as an explicit *suspicion* pending playtests, and the rulebook flags it `[DESIGN]`. The creative director's verdict (2026-07-04, in chat): encounters are the **payoff** — of threads woven, of divine actions taken — and their density is largely **player-authored**: a player who weaves many threads and manipulates the world will and should generate many encounters. The world adds a gentle lean toward more encounters as the doom clock climbs. The design problem is therefore not rationing encounter count; it is **cognitive load**: when several encounters run concurrently, the player must be able to read and navigate all of them — every completed step, every active step, every choice already made — at any time.

Today that is structurally impossible: `RESOLVED_ACTION_RETENTION_TICKS = 20` (orchestrator.ts) prunes resolved `UnifiedAction`s, discarding `stepOutcomes`, `choiceHistory`, `stepComplications`, and `aftermathSummary` twenty ticks after resolution. The chronicle keeps one-line event entries; the full chapter is gone. Without this plan, the encounter — the game's central payoff — evaporates from the record, and any future "manage many encounters" UX has nothing to stand on.

## Settled decisions (this plan writes them into canon)

1. **Density is player-authored.** No system caps or rations encounters per run or per sitting. More threads, more interventions → more encounters. The curator's job is triage and framing, never suppression of player-provoked moments.
2. **Gentle world ramp.** As doom progresses, the curator grows more generous (a crumbling world crests more crises). This is a lean, not a curve the player is forced through — implemented as one small multiplier table, tunable to flat.
3. **"Three to six" is retired as doctrine.** It survives only as a *texture observation* about a comfortable single sitting, explicitly marked untuned. Manual, rulebook, and Vision all get the corrected language.
4. **Every encounter is always fully readable.** Active or resolved, an encounter's chapter — steps done, step active, choices made, complications, aftermath — is available and navigable at all times, for the whole run. This extends the settled 2026-05-07 "no visibility gating of encounter content" direction from *candidates* to *records*.

## Engine pillar

### Systems design

Two engine pieces:

**A. Chapter archive.** At the orchestrator cleanup step where `completedAtTick` is stamped (before pruning), build a compact `ChapterRecord` from each resolving encounter-category `UnifiedAction` and append it to a new `gameState.chapterArchive` array. Records are self-contained prose+outcome snapshots — pruning of the heavyweight `UnifiedAction` then proceeds unchanged (retention constant untouched). Active encounters need no new storage; the ledger reads live `unifiedActions` directly.

`ChapterRecord` (new type, own file `src/types/chapterRecord.ts` — deliberately NOT added to `unifiedAction.ts` to avoid its 278-importer blast radius):

```ts
interface ChapterRecord {
  readonly actionId: string;
  readonly templateId: string;
  readonly templateName: string;
  readonly actorId: string;
  readonly actorName: string;          // snapshot — actor may die later
  readonly targetId: string;
  readonly scale: ActionScale;
  readonly startTick: number;
  readonly resolvedTick: number;
  readonly outcome: UnifiedActionOutcome;
  readonly threaded: boolean;          // actor threaded at resolution time
  readonly participants: readonly { id: string; name: string }[]; // support cast from supportBindings, snapshotted — enables per-entity Chapters tab filtering
  readonly steps: readonly ChapterStepRecord[]; // name, prose (enriched, as shown), outcome, complication prose, choice made
  readonly aftermathProse?: string;
  readonly aftermathSummary?: EncounterAftermathSummary;
  readonly eventNodeId?: string;       // bridge to the graph event node (THR-143)
}
```

**Graph-decision note (pre-empting the audit):** the archive is a state array following the existing `chronicleEntries` / `digestBuffer` precedent — it is a *narrative record for the UI*, not a relational entity. Relationships already live in the graph via `eventNodeId` / `caused_by` edges (THR-143); each record carries the bridge id so graph traversal is never blocked. No new node or edge types.

**B. Doom-phase curation generosity.** A per-journey-phase multiplier applied to `BRANCHING_CURATOR_BIAS_WEIGHT` at the single site where the curator boosts nearly-eligible branching templates for threaded agents (`branchingCurator.ts`). Journey phase is already derivable from doom fraction (`PHASE_BOUNDARIES`, `game-config.ts`). Defaults are gentle and may be tuned to `1.0` across the board to disable.

### Graph nodes / edges

None added or modified. `ChapterRecord.eventNodeId` references existing event nodes.

### Tick phases

Archive append runs inside the existing orchestrator resolved-action cleanup (same pass that stamps `completedAtTick`), before pruning. No new phase. Curation multiplier is read inside the existing agent-decision scoring path — no phase change.

### Resolution logic

None changed. Step resolution, outcome ladder, aftermath — all untouched. This plan only *records* and *biases surfacing*.

### PRNG callouts

No random calls. Archive is deterministic bookkeeping; the multiplier is a deterministic lookup.

## Content pillar

No new encounter templates (the 2026-06-22 assessment: supply is healthy; July-3 KPI: distribution green). Content work is prose/doc edits:

- **`public/encounters-manual-reference.html`** (shipped THR-592): replace the "three to six encounters per session" sentence with player-authored-density + ramp language. Suggested replacement (editor may polish, meaning fixed): *"Encounters are the payoff of the threads you weave. A quiet early world may go many turns between chapters; a god with a dozen threads in motion — or a world deep into its doom — will find them cresting far more often. The game never rations your chapters; it helps you hold them. Every encounter, running or finished, stays readable in the Chapter Ledger."*
- **`public/turn-structure-reference.html`** (shipped THR-588): same claim appears ("3–6 per session target — flagged planned/[DESIGN]"); update to match.
- **`Docs/canon/rulebook.md`** §3: replace the "three to six per session, not three to six per tick" sentence with the settled stance (player-authored density, gentle doom lean, ledger as the load-management answer); update §Open-questions item 4 — density stance is now settled `[DESIGN→IMPL pending this ticket]`; the *stopping-point signal* question remains open and stays.
- **`TheFantasyWorldSimulator/Vision/01-core-loop.md`**: rewrite the "Open question we keep returning to" section into a settled "Density" section carrying decisions 1–4 above. Keep the cadence framing (quiet simmer punctuated by emphasis) but scope it: cadence describes *texture between emphases*, not a count ceiling. Note the 2026-07-04 verdict and date it.
- **UL:** propose **Chapter Ledger** and **Chapter Record** via a `UL-proposal` Linear issue if absent from `Docs/ubiquitous-language/Encounters.md` (executor: check, then file — do not silently add).

## UI pillar

*Screenshot tool: Playwright (DOM surface — no WebGL content).*

### Player-facing display

**Chapter Ledger** — new drill-in surface (`game.chapter-ledger`), opened from the right bar / threads area and from agent profiles. One list, two sources merged: active encounters (live `unifiedActions`, encounter categories) and archived chapters (`chapterArchive`), newest first.

- **Row:** actor name, template name, status (step 2 of 4 · active / resolved-outcome), start→resolved ticks, threaded marker. Default filter: threaded + watched actors; "all visible" toggle honors the settled no-visibility-gating direction.
- **Chapter view** (`game.chapter-view`, drill-in from a row): full reading surface — per-step prose as originally enriched, step outcomes in the narrative lexicon (never raw numbers, per prose-first UI), the player's own choices (`choiceHistory`) rendered as "you whispered…" beats, complication prose, aftermath prose. Active encounters show completed steps plus the live step; resolved ones read as a finished chapter.
- **Navigation:** every participant/place named in a chapter is clickable (Rule 4 — every primitive is clickable), linking to existing profile modals. Chronicle entries and thread-detail story-so-far link into the matching chapter via `actionId`/`eventNodeId`.
- **Character-sheet Chapters tab (user directive 2026-07-04):** the agent profile modal (`game.agent-profile-modal`, AgentProfileModal) gains a **Chapters** tab listing that entity's chapters — active encounters where they are the actor, plus archived records where they are the actor (`actorId`) or a bound support participant (`supportBindings`). Rows open the same Chapter view. This is the per-entity entry point; the ledger is the global one. Same read path, no new state.
- **Viewport contract:** panel uses `flex-1 overflow-y-auto` internal scroll; nothing below the fold at 1920×1080; pagination beyond `CHAPTER_LEDGER_PAGE_SIZE`.

### Event notifications

None new. Existing encounter toasts/tugs gain a "read the chapter" affordance where an `actionId` is present (link into the ledger).

### Debug inspection (DebugPanel)

- `window.__DEBUG.getChapterArchive(filter?)` → `{ count, records }` (compact).
- DebugPanel: archive count + last-10 list in the existing encounter debug area.
- CLI: `chapters [agent|@hero]` — list archived + active chapter records headlessly.

### Visual presence (HexMapV2)

N/A — no map-layer change. (Ledger rows may deep-link to `gotoAgent`-style camera moves later; out of scope.)

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `chapterArchive.ts` (engine) | resolved-action cleanup (existing) | ChapterLedger, ChapterView | `chapterArchive` | `encounter.chapter_archived` | `__DEBUG.getChapterArchive`, DebugPanel, CLI `chapters` |
| `branchingCurator.ts` (edit) | agent-decision scoring (existing) | — (affects surfacing rate) | — | existing curator traces + `curationPhaseMultiplier` field | DebugPanel encounter cache view |
| `ChapterLedger.tsx` | — | mounted as drill-in in GameView | reads `chapterArchive` + `unifiedActions` | — | IA manifest `game.chapter-ledger` |
| `ChapterView.tsx` | — | drill-in from ledger row | reads one record/action | — | IA manifest `game.chapter-view` |
| `AgentProfileModal.tsx` (edit — Chapters tab) | — | tab within existing modal | reads `chapterArchive` + `unifiedActions` filtered by agent | — | IA manifest `game.agent-profile-modal` reads[] updated |

IA manifest: add `game.chapter-ledger` and `game.chapter-view` entries with reads[] as above. Update `Docs/plans/wiring-checklist.md` (new GameState field + new drill-in surfaces). Wiki-freshness: `encounters-manual-reference.html` and `interface-reference.html` sources globs will match — update both pages in the same PR (Definition of Done §Design Reference Wiki).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CHAPTER_ARCHIVE_CAP` | `2000` | Max archived chapter records per run; eviction begins above this |
| `CHAPTER_ARCHIVE_EVICT_BATCH` | `100` | Records evicted per overflow pass (oldest non-threaded first, then oldest) |
| `CHAPTER_LEDGER_PAGE_SIZE` | `25` | Ledger rows per page |
| `CURATION_PHASE_MULTIPLIERS` | `{ call: 0.9, road_of_trials: 1.0, crisis: 1.15, ordeal: 1.3, return: 1.5 }` | Per-journey-phase multiplier on `BRANCHING_CURATOR_BIAS_WEIGHT`; set all to 1.0 to disable the ramp |
| `RESOLVED_ACTION_RETENTION_TICKS` | `20` (unchanged) | Heavyweight `UnifiedAction` retention — archive decouples readability from retention |

## Tracing

```ts
// ChapterArchived — emitted when a resolved encounter is archived
interface ChapterArchivedTrace {
  type: 'encounter.chapter_archived';
  actionId: string;
  templateId: string;
  actorId: string;
  outcome: string;      // UnifiedActionOutcome
  tick: number;
  archiveSize: number;  // post-append count (inspectability of eviction pressure)
}
```

Curator traces gain an optional `curationPhaseMultiplier: number` field on the existing boost trace (additive, no breaking change). Add `encounter.chapter_archived` to `TRACE_CATEGORIES` (impediment from the THR-96 review: missing category registrations).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Step prose missing on a resolving action | Archive record with placeholder line ("The record of this step has faded."); never throw |
| Actor node already dead/pruned at archive time | Use snapshotted `actorName` (captured at record build); if unavailable, "a departed mortal" |
| Archive at cap | Evict per policy, emit trace with `archiveSize`; never block resolution |
| `chapterArchive` missing on old saves | Treat as empty array; ledger renders active encounters only |
| Journey phase unresolvable (no doom state) | Multiplier 1.0 (neutral) |
| Ledger render with malformed record | Skip row, `console.warn`, render remainder |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 345 importers | One additive optional field (`chapterArchive?: readonly ChapterRecord[]`); no existing field changed — additive-only keeps ripple to type-widening |
| `src/engine/orchestrator.ts` | high-traffic (not ≥100 importers itself) | Touch limited to the existing cleanup block; archive build is pure and try/caught |

`src/types/unifiedAction.ts` (278 importers) is deliberately **not** touched — `ChapterRecord` lives in its own file and imports from it one-way.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (doc/prose edits; no new templates — supply confirmed healthy)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan **edits** a Vision premise deliberately: `01-core-loop.md`'s open density question is settled (player-authored density + gentle doom lean + ledger). The anti-pacing-curve cadence framing is retained but scoped to texture, not count. The Vision edit is in this ticket's scope per governance.

## Rulebook impact

- [x] Changes a rule-of-play statement (encounter pacing in §3). `Docs/canon/rulebook.md` §3 and the open-questions register are updated in the same PR; affected section re-verdicted.

> Brainstorm companion: `Docs/plans/2026-07-04-encounter-density-and-chapter-ledger-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | All five levers named constants; ramp disable = set multipliers to 1.0 |
| 2. Inspectability | PASS | `encounter.chapter_archived` trace with archiveSize; curator trace field; `__DEBUG` + CLI readers |
| 3. Determinism | PASS | No PRNG; archive append and multiplier lookup are pure functions of state |
| 4. Fail-soft | PASS | See table; archive build wrapped, resolution never blocked |
| 5. Narrative over mechanical perfection | PASS | The whole plan serves narrative: chapters persist as readable story; prose-first (narrative lexicon, no raw numbers in ledger) |
| 6. Additive over destructive | PASS | New optional GameState field, new files, one additive multiplier at one call site; retention constant unchanged |
| 7. Performance budget | PASS with note | Archive append O(1)/resolution; compact records (~1–4 KB) × 2000 cap ≈ few MB worst case; ledger paginates. No per-tick iteration over the archive |

## Done when

- [ ] Resolved encounters produce `ChapterRecord`s; records survive past `RESOLVED_ACTION_RETENTION_TICKS` (test: resolve at tick N, assert readable at N+40)
- [ ] Chapter Ledger lists active + archived chapters, filtered/paginated; Chapter view renders steps, choices, complications, aftermath for both active and resolved encounters
- [ ] Agent profile modal has a Chapters tab showing that entity's active + archived chapters (actor or support participant), opening the Chapter view
- [ ] Manual pages (`encounters-manual-reference.html`, `turn-structure-reference.html`), `Docs/canon/rulebook.md` §3, and `Vision/01-core-loop.md` carry the settled density language; "three to six" no longer appears as doctrine anywhere
- [ ] `CURATION_PHASE_MULTIPLIERS` wired at the curator boost site with trace field
- [ ] IA manifest + wiring checklist updated; `npm run check:wiki-freshness` clean for touched pages
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass; 30-tick CLI engine smoke (engine touched)
- [ ] Closing commit body AND PR body include `Fixes THR-603`
- [ ] Browser-verify: Playwright screenshot of Chapter Ledger + Chapter view at 1920×1080, console output block, `__DEBUG.getChapterArchive()` assertion

## Coordination block

**Suggested model:** `opus` — cross-cutting: orchestrator touch, new state field on a 345-importer type, new UI surface, canon edits.

**Parallel-safe with:** THR-594/595/596/597 (remaining Game Manual Wiki pages other than the two named below), hex-map work, faction work — no shared files.

**Mutex with:** any issue editing `public/encounters-manual-reference.html` or `public/turn-structure-reference.html` (THR-592/588 are Done — safe unless reopened); any issue touching the orchestrator cleanup block or `branchingCurator.ts` (none currently in Ready for Dev).

**Files to touch:**
- Create: `src/types/chapterRecord.ts`, `src/engine/chapterArchive.ts`, `src/components/Game/ChapterLedger.tsx`, `src/components/Game/ChapterView.tsx`, tests for archive + ledger
- Edit: `src/types/gameState.ts` (additive field), `src/engine/orchestrator.ts` (cleanup block), `src/engine/encounter/branchingCurator.ts` + `branchingConstants.ts` (multiplier), `src/components/Game/AgentProfileModal.tsx` (Chapters tab — locate actual component name via IA manifest reader `AgentProfileModal`), `src/debug-bridge.ts` + `.d.ts`, CLI command registry, `src/data/ia-manifest.ts` (two new surfaces + agent-profile-modal reads[]), `public/encounters-manual-reference.html`, `public/turn-structure-reference.html`, `Docs/canon/rulebook.md`, `TheFantasyWorldSimulator/Vision/01-core-loop.md`, `Docs/plans/wiring-checklist.md`

## Notes for the executor

- Do NOT raise `RESOLVED_ACTION_RETENTION_TICKS` as the fix — considered and rejected (heavyweight actions are iterated by per-tick systems; see brainstorm companion).
- Do NOT reconstruct chapters from graph event nodes for v1 — step prose is not stored there; enrichment replay is non-trivial. The `eventNodeId` bridge keeps that door open.
- The ledger reads, never mutates. Respect `worldVersion` selector rules — key ledger memos on `worldVersion`/array length, never on `gameState.graph` identity.
- Snapshot prose at archive time exactly as the player saw it (post-`enrichProse()`); do not re-enrich on render.
- Check `Docs/ubiquitous-language/Encounters.md` for Chapter Ledger / Chapter Record terms; file a `UL-proposal` issue if new (do not silently add to UL).
- The ramp is deliberately gentle and secondary. If tuning debate arises, ship with all multipliers at 1.0 and open a tuning follow-up — do not block the ledger on the ramp.
- **Vision rewrite reconciliation (from Vision audit):** in the `01-core-loop.md` Density section, explicitly distinguish player-*provoked* density (healthy, the player chose it) from scan-over-surfacing (still a bug — "drumbeat means the scan is broken" stays true for *volunteered* encounters). Keep "the scan leaves most mortals alone": the ledger holds many chapters, but the camera still emphasizes one. "Always readable" must not bleed into "always surfaced."
- Wiring reminder: key ledger memos on `worldVersion` + archive array length (also noted in wiring row context).

## Forked-audit verdicts

*Run 2026-07-04 (Cowork orchestrator; three Opus subagents, one message). Intent-judge verdict: **Allow** (all 10 dimensions PASS, impact class Reversible confirmed).*

### NFP audit

**VERDICT: PASS.** Verified against source: `RESOLVED_ACTION_RETENTION_TICKS = 20` (orchestrator.ts:238, correctly untouched); cleanup/stamp block at orchestrator.ts:2658–2678 is exactly where archive-append hooks (before the prune filter — placement accurate); `BRANCHING_CURATOR_BIAS_WEIGHT = 1.75` (branchingConstants.ts:34); `PHASE_BOUNDARIES` phase names match `CURATION_PHASE_MULTIPLIERS` keys 1:1. Per-NFP: (1) Tunability PASS — five named levers, ramp disables at 1.0. (2) Inspectability PASS — `chapter_archived` trace carries `archiveSize`; additive curator trace field; `__DEBUG` + CLI readers; TRACE_CATEGORIES registration included. (3) Determinism PASS — no PRNG, pure lookups. (4) Fail-soft PASS — six-case table, archive try/caught, resolution never blocked. (5) Narrative PASS — prose-first ledger, narrative lexicon. (6) Additive PASS — optional field, new files, one call-site edit; `unifiedAction.ts` untouched. (7) Performance PASS with note — O(1) append, ~few MB cap, paginated, no per-tick archive iteration. No REVISE-level findings.

### Three-pillar audit

**VERDICT: PASS.** Engine: archive at existing cleanup step + multiplier at single curator site; `ChapterRecord` correctly isolated off the 278-importer `unifiedAction.ts`; graph-decision pre-empt sound (verified `chronicleEntries`/`digestBuffer` precedent; `eventNodeId` bridge; no invented node types). Content: no new templates (justified), doc edits enumerated with fixed-meaning replacement, UL via proposal not silent add. UI: screenshot tool named (Playwright, justified); IA manifest additions specified with reads[]; `chapterArchive` consumed by named components (not orphaned); traces registered with typed interface. Wiring: every module reaches orchestrator/UI/GameState/traces/debug; viewport contract, clickable primitives, `worldVersion` discipline addressed; Blast Radius present. Minor non-blocking: memo-dependency reminder added to executor notes (done above). Handoff may proceed.

### Vision audit

**VERDICT: PASS with notes.** The Vision edit is coherent: `01-core-loop.md` carried "three to six" as an unanswered suspicion the page itself invites resolving; the manual hardened a suspicion into a rule and this plan unwinds that drift. Cadence tension handled: the Vision rejects protagonist-arc pacing curves; the doom lean is world-pressure texture, not a forced arc — scoping cadence to "texture between emphases, not a count ceiling" preserves the premise's real content. Dashboard red line respected: the ledger is a reading surface (prose payload, on demand, never interrupting) — "bookshelf not a stage." Two non-blocking notes folded into executor notes above: (1) distinguish player-provoked density from scan-over-surfacing in the rewrite; (2) keep "the scan leaves most mortals alone." No premise contradicted; one open question closed, in scope per governance.
