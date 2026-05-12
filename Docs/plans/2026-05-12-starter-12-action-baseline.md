# THR-XXX — Starter 12: always-available action baseline

**Date:** 2026-05-12
**Linear:** to be filed as child of [THR-390](https://linear.app/threadbare/issue/THR-390) — *Action System Curation & Unlock Roadmap*
**Project:** Content Architecture (Now / High)
**Audit anchor:** `Docs/audits/2026-05-09-ascendant-actions-audit.md` §6 Tier S + §7 recommendation #2
**Brainstorm companion:** inline in §2 (the audit is the brainstorm; this plan is the implementation pass against settled verdicts)

## 0. Reading the issue forward

The audit recommendation: *"Pick the 12 starter-tier actions, hard-gate the rest behind a `revealed_at_start: true` flag (or equivalent). Single PR. ~3 hours of curation + small engine change. This is the single change with the biggest legibility payoff."*

Three Round 2 verdicts on THR-390 (2026-05-11) made this scopable:

1. **Unlock model is per-account permanent.** Once a player unlocks an action, it stays unlocked across runs forever. Saved as load-bearing memory `project_unlock_model.md`.
2. **Ascendant-identity covers archetype.** No separate archetype selector. A run-start picker selects N additional actions from the player's unlocked pool, where N is run-mutator configurable.
3. **Sustained controls extend right-bar threads display** (already filed as THR-418). They are not actions in the drawer; the Starter 12 is exclusively *active* divine verbs.

The Starter 12 is the **floor**: the actions every player sees in every run on turn 1, regardless of unlocks, regardless of ascendant identity, regardless of run mutator. The run-start picker (separate issue, future phase) adds N more on top from the player's unlocked pool. Total visible at run start = 12 + N.

This plan ships **only the floor**. The picker, unlock pool, and meta-progression UI are explicitly out of scope and tracked separately (THR-390 §6.E/M/L/X tiers, recommendation #11).

## 1. Codesight pre-flight (Blast Radius)

**Files to touch:**

| File | Importer count | Risk note |
|------|---------------:|-----------|
| `src/data/unified-action-templates.ts` | not in CLAUDE.md high-impact list (~30) | mostly tag-only edits — add `starter: true` to 12 templates, no schema overhaul |
| `src/types/unifiedAction.ts` | high (interface widely consumed) | **additive** — one new optional readonly field `starter?: boolean` |
| `src/engine/targetActions.ts` | ~20 | new Gate 8 (`starter/unlock`) added in `getTargetActionSlots()` |
| `src/engine/actionUnlock.ts` | new file | new pure module — `isActionRevealed(template, unlockState)` predicate + `STARTER_ACTION_IDS` constant set |
| `src/types/gameState.ts` | **176 importers — high-impact** | additive — one new `runState.unlockedActionIds: readonly string[]` field (initialised to STARTER_ACTION_IDS by default) |
| `src/engine/initialState.ts` *(or equivalent)* | ~3 | seed `unlockedActionIds` at game-init |
| `src/components/ActionDrawer/*.tsx` | ~4 | no behaviour change — the existing slot pipeline already filters; ActionDrawer just renders what it gets |
| `src/components/DebugPanel/*.tsx` | ~6 | new sub-view: "Action Unlocks" — shows starter / unlocked / locked counts and lists |
| `src/debug-bridge.ts` | small | new method `listLockedActions()` and `listStarterActions()` |
| `src/data/__tests__/unified-action-templates.test.ts` | n/a | new test: STARTER_ACTION_IDS resolves to exactly 12 templates that exist and pass schema |
| `src/engine/__tests__/targetActions.test.ts` | n/a | new test: locked actions are filtered when not in `unlockedActionIds`; starters bypass |

**One high-impact file is touched** (`src/types/gameState.ts`, 176 importers). The change is **additive only** — a new optional readonly field on a nested runState property bag, no removal or rename of existing fields. The cascade risk is zero for code paths that don't read the new field, and a default value path ensures new playthroughs and existing save shapes both work.

**No Blast Radius section needs to escalate to a structural review** — the change matches the "extend with optional field, default safely" pattern already used for `mandateState`, `doomIdentityMatrix`, and other GameState nullable extensions.

## 2. Substrate rideability check

Every claim verified before authoring:

| Claim | Where it lives | Verified |
|------|----------------|----------|
| `UnifiedActionTemplate` interface accepts new optional readonly fields without disturbing existing templates | `src/types/unifiedAction.ts:626` | ✅ |
| `getTargetActionSlots()` is a single linear gate pipeline (gates 1, 2, 2b, 3, 3b, 7, 4, etc.) and a new gate can be inserted as gate 8 by `continue`-ing on no-match | `src/engine/targetActions.ts:88–270` | ✅ |
| The 12 audit-proposed starter templates all exist by ID | grep verification, this session | ✅ — all 12 IDs resolved (see §6) |
| Existing pattern for "hard-gate by default, can be overridden by data" is used by `narrativeLayer` + `bypassRevelationGate` | `src/engine/targetActions.ts:171–195` | ✅ |
| GameState carries nullable / defaulted top-level fields without breaking the type system | `src/types/gameState.ts:189–197` (e.g. `mandateDefinition: MandateDefinition \| null`) | ✅ |
| `ascendantTray.classifyTrayTier` is the only place tray-tier is currently computed (no separate "is starter" predicate yet) | `src/engine/ascendantTray.ts:42–62` | ✅ |
| Debug bridge supports `window.__DEBUG.listActions()` already → adding adjacent inspection methods is the existing pattern | `CLAUDE.md` §Debug Bridge | ✅ |

**Substrate that does NOT exist and is NOT built in this issue:**

- The **run-start action picker UI** (the modal that lets the player choose N actions from their unlocked pool at the start of each run). This is a separate Phase-2 issue.
- The **meta-progression unlock mechanism** (achievements, deeds, sphere mastery → unlock specific actions across runs). Tracked by THR-390 §11 as its own project candidate.
- A **codex view of unlock conditions**. The audit recommends every action have an unlock hint string; ships only as a `// TODO(THR-XX): unlock hint` comment in the data file, with the hint string itself authored in a follow-up.
- **Run-mutator integration.** The `N` configurable count for the picker waits on the run-mutator system to exist.

## 3. Vision audit

Three Vision premises bear on this design:

### 3.1 `Vision/00-north-star.md` — *"The moment we're building toward is one mortal in a crisis the player came to care about."*

**Reads as PASS.** The starter set explicitly leads with `bind_thread_agent`, `observe_agent`, and the four agent-nudge verbs (Dream / Persuade / Deceive / Intimidate). Six of twelve starter actions are agent-targeting. The first turn's experience surface is *"see mortals, bond, nudge"* — which is exactly the mortal-loop on-ramp. No drift.

### 3.2 `Vision/02-non-negotiables.md` §1 — *"The player is a god, not a protagonist."*

**Reads as PASS.** Every starter action is observation, nudging, marking, or claiming — none are direct combat, none are character-stat manipulations, none are RPG-genre verbs. The four classic nudges (Dream / Persuade / Deceive / Intimidate) push mortals toward decisions without taking the decisions on the player's behalf. The two cosmic-presence verbs (`hex.bless_land`, `hex.mark_ground`) write the god's fingerprint into the world but do not promote the player to a participant in scenes.

### 3.3 `Vision/03-design-tensions.md` §3 — *legibility vs depth*

This is the **load-bearing Vision tension** the Starter 12 exists to resolve. Currently the catalog of ~99 ascendant actions presents as a single flat drawer (or paginated drawer) of all-cards. That fails legibility for first-contact play — the player sees a wall of verbs and has no notion of *where to start*. The audit's chase outcome (Christian's brief, verbatim): *"a fun, well-balanced action system, with a great generic base, easy to understand and use, hard to master, that slowly unlocks more and more advanced options as you progress through the game."*

**The Starter 12 is the "great generic base."** It is the visible-on-turn-1 surface. Everything else is hidden until earned. The design choice — *which 12* — should optimise for: (a) coverage of all major target types, (b) coverage of the four classic god-personas (subtle / kind / wrathful / devious), (c) prose-rich actions that lead by example for what every later action will feel like.

**Vision-edit candidate:** none. The Starter 12 is an *implementation* of `03-design-tensions.md` §3, not a revision of it. No Vision doc edit is part of this issue's scope.

## 4. The Starter 12 — selected set

Selection criteria (in priority order):
1. **Coverage of target types** — at least one verb each for agent, location/hex, sublocation. (Faction, army, artifact intentionally absent from starters — those targets are themselves unlocks.)
2. **Coverage of god-personas** — subtle (dream/coincidence), kind (bless_land), wrathful (intimidate), devious (deceive), perceiving (survey/observe), claiming (bind_thread).
3. **Prose density** — each starter has rich `narrativeTemplates` and ideally `spellName` + `description`.
4. **Mechanical simplicity** — no starter requires a deep prerequisite chain or specific game state to be useful.
5. **Existing as canonical, not stale** — every ID in the set is currently a live, exercised template.

The Audit (§6 Tier S) proposes exactly this 12. Verified against `src/data/unified-action-templates.ts` this session:

| # | Template ID | Player-facing name | Target | Persona | Notes |
|---|---|---|---|---|---|
| 1 | `bind_thread_agent` | Bind Thread — Agent | agent | claiming | The bonding gate. Mortal-loop on-ramp. |
| 2 | `bind_thread_location` | Bind Thread — Location | location/hex | claiming | The place-as-character bonding gate. |
| 3 | `hex.survey` | Survey | hex | perceiving | **The unified Survey verb** (post-THR-398). Reveals layer state in prose. |
| 4 | `observe_agent` | Observe | agent | perceiving | Cheap shallow read. The agent-equivalent of Survey. |
| 5 | `hex.whisper_intuition` | Whisper Intuition | hex | perceiving | Reads a hex's mood/disposition in prose. |
| 6 | `divine.dream` | Dream | agent | subtle | Plant a desire in a sleeping mortal. |
| 7 | `divine.persuade` | Persuade | agent | kind/direct | Whisper a sudden certainty. |
| 8 | `divine.deceive` | Deceive | agent | devious | Drape a divine illusion. |
| 9 | `divine.intimidate` | Intimidate | agent | wrathful | Press divine fear; they comply but resent. |
| 10 | `divine.coincidence` | Coincidence | agent | subtle (signature) | Arrange events so chance favors them. Plausible deniability. |
| 11 | `hex.bless_land` | Bless Land | hex | kind (signature) | The cosmic-presence verb. Marks territory in prose. |
| 12 | `hex.mark_ground` | Mark Ground | hex | claiming | Inscribe a divine mark on a ruined site. Companion to Bless Land. |

**One known divergence from the audit text:** the audit listed `Inspire` as one of the "four classic agent nudges" in early prose but uses Dream/Persuade/Deceive/Intimidate as the canonical four in the Tier S list. Inspire (`divine.inspire`) drifts to Tier E because Persuade and Inspire overlap mechanically — keeping Inspire starter doubles up on the same player goal. Audit recommendation #6 will distinguish them in a later pass (rename Inspire → "Forge Resolve" or similar, refocus on initiative-system integration).

**One template ID still being settled by THR-398:** `hex.survey`. THR-398 collapses six hex-recon verbs into a unified Survey. This issue **blocks on THR-398 landing first**. Once THR-398 ships, the unified `hex.survey` is the canonical Survey verb that gets `starter: true`.

## 5. Engine pillar

### 5.1 New optional field on `UnifiedActionTemplate`

```typescript
// src/types/unifiedAction.ts
export interface UnifiedActionTemplate {
  // ...existing fields...

  /**
   * If true, this template is part of the always-available Starter 12 baseline.
   * Visible to every ascendant in every run, regardless of unlocks.
   * Defaults to false (template is gated by the unlock pool).
   *
   * Exactly STARTER_ACTION_COUNT templates should carry this flag — enforced by test.
   */
  readonly starter?: boolean;
}
```

### 5.2 New pure module `src/engine/actionUnlock.ts`

```typescript
import type { UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Tunable constants (NFP #1) ──────────────────────────────────────

/** The size of the Starter 12 baseline. Enforced by template-data test. */
export const STARTER_ACTION_COUNT = 12;

/**
 * The canonical Starter 12 IDs.
 * Order is presentation order for the action drawer (top-left to bottom-right).
 * Templates carrying these IDs MUST be tagged with `starter: true`.
 */
export const STARTER_ACTION_IDS: readonly string[] = [
  'bind_thread_agent',
  'bind_thread_location',
  'hex.survey',
  'observe_agent',
  'hex.whisper_intuition',
  'divine.dream',
  'divine.persuade',
  'divine.deceive',
  'divine.intimidate',
  'divine.coincidence',
  'hex.bless_land',
  'hex.mark_ground',
] as const;

const STARTER_ID_SET: ReadonlySet<string> = new Set(STARTER_ACTION_IDS);

// ─── Predicates ──────────────────────────────────────────────────────

/**
 * Returns true if the template should be visible in the action drawer
 * given the player's current unlock state.
 *
 * Rules (tunable — NFP #1):
 *   1. If template.starter === true → always visible (starter floor).
 *   2. Else if unlockedActionIds includes template.id → visible.
 *   3. Else → hidden.
 *
 * Fail-soft: if unlockedActionIds is undefined or empty, only starters appear
 * (matches Phase 1 first-run behaviour).
 */
export function isActionRevealed(
  template: Pick<UnifiedActionTemplate, 'id' | 'starter'>,
  unlockedActionIds: readonly string[] | undefined,
): boolean {
  if (template.starter === true) return true;
  if (STARTER_ID_SET.has(template.id)) return true; // data fail-soft
  if (!unlockedActionIds || unlockedActionIds.length === 0) return false;
  return unlockedActionIds.includes(template.id);
}
```

The fail-soft (line "data fail-soft") ensures that even if a content editor forgets to tag a starter template with `starter: true`, the runtime still surfaces it. The template-data test catches the missing tag at CI time, but the runtime never throws on first contact.

### 5.3 New gate in `getTargetActionSlots()`

Inserted as **Gate 8** (after the existing essence/range gates, before the gate-tally output). Gates are pure additive — no existing gate behaviour changes.

```typescript
// 8. Unlock gate — hide non-starter, non-unlocked templates entirely.
//    The drawer never shows a "?" silhouette — locked actions are simply
//    absent. Unlock prompts surface elsewhere (Codex / Unlock notifications).
if (!isActionRevealed(template, unlockedActionIds)) {
  counts.byUnlock++;
  continue;
}
```

`unlockedActionIds` flows into `TargetActionParams` as a new optional readonly field. Existing call sites that don't yet pass it get the safe default behaviour (only starters visible).

### 5.4 GameState field

```typescript
// src/types/gameState.ts
export interface GameState {
  // ...existing fields...

  /**
   * Action IDs unlocked for this player account, persisted across runs.
   * Starters are NOT included here — they are always-available regardless.
   * Empty array = brand new account / no unlocks earned.
   */
  unlockedActionIds: readonly string[];
}
```

Initialisation: `initializeGameState()` seeds `unlockedActionIds: []`. The starter floor handles turn-1 visibility through the gate logic, not through any prepopulated unlock state.

Persistence: `unlockedActionIds` is the first per-account meta state field. The plan does **not** define the persistence layer (LocalStorage, Cowork-managed save, whatever) — that's a deliberate Phase-2 dependency. Phase 1 ships the in-memory shape and a known place for the persistence shim to land later.

### 5.5 Traces (NFP #2)

| Trace event | Emitted when | Shape |
|---|---|---|
| `action.gate.unlock_filter` | A template is filtered out by Gate 8 | `{ templateId: string; reason: 'not_starter_not_unlocked' }` |
| `action.unlock.granted` | A new action ID is added to `unlockedActionIds` *(future Phase 2)* | `{ templateId: string; source: 'meta' \| 'run' \| 'debug' }` |

Phase 1 only emits `action.gate.unlock_filter`. The `action.unlock.granted` shape is reserved for Phase 2's unlock mechanism — defined now so traces are stable from day one.

### 5.6 Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `STARTER_ACTION_COUNT` | 12 | Enforced size of the Starter 12. Tests assert exact match. |
| `STARTER_ACTION_IDS` | (the 12 IDs in §4) | The canonical starter set. Single source of truth. |
| `ACTION_DRAWER_DEFAULT_VISIBLE_MAX` | (existing) | Unchanged. Starter floor is well within this cap. |

### 5.7 Fail-soft (NFP #4)

| Failure mode | Behaviour |
|---|---|
| `unlockedActionIds` is undefined or missing from GameState | Only starters surface (data fail-soft via predicate). |
| A starter template is missing `starter: true` flag | Predicate falls back to the canonical ID set; runtime still surfaces the starter. CI test fails noisily so the missing tag is caught at PR time, not at player runtime. |
| A starter template's ID is in `STARTER_ACTION_IDS` but the template doesn't exist in the data file | Test fails at CI. No player-runtime impact. |
| `unlockedActionIds` references an ID that doesn't exist in templates | Silently ignored — no template matches, no surface. |

## 6. Content pillar

### 6.1 Tag the 12 templates

Single-line edits to `src/data/unified-action-templates.ts` adding `starter: true` to the 12 templates listed in §4. No prose changes. No mechanical changes.

### 6.2 No new prose required

This issue is intentionally a **structural** change, not a content authoring pass. The 12 starter templates already have prose. If quality gaps surface during browser-verify, file follow-up issues against `prose-content-systems`; do not block this issue on prose polish.

### 6.3 Codex view of the Starter 12

`?view=codex` reads from `src/components/Codex/codexRegistry.ts`. The codex view will get a new top-level filter chip "Starter" that shows exactly the 12 templates. This is the entry point for the future unlock-hint system, but Phase 1 just adds the filter chip — no per-template unlock hints yet.

## 7. UI pillar

### 7.1 ActionDrawer — no component change required

`ActionDrawer` already renders whatever the slot pipeline returns. Gate 8 in `getTargetActionSlots()` filters out non-revealed actions before the drawer ever sees them. So Phase 1 ships with **zero ActionDrawer changes**.

The drawer presentation order is determined by the existing slot pipeline. Audit recommendation: starter actions appear before locked actions when both exist, but Phase 1 only has starters visible, so this ordering question is deferred until Phase 2.

### 7.2 DebugPanel — new "Actions" sub-tab

A new sub-view in DebugPanel exposes:
- **Starter** count (always 12)
- **Unlocked** count and list (from `gameState.unlockedActionIds`)
- **Locked** count and list (every template ID not in starter or unlocked, with rarityTier)
- A "Grant action" debug action that pushes an ID into `unlockedActionIds` for testing

Component sits at `src/components/DebugPanel/ActionUnlocksView.tsx` (consistent with existing pattern from THR's DebugPanel split).

### 7.3 Codex view — Starter filter chip

`?view=codex` gets a new top-level filter chip "Starter" between existing chips ("All", category chips, etc.). Selecting it filters to the 12 starter templates. The chip count badge reads `12`.

### 7.4 Notifications — first-run welcome toast (optional, low-priority)

If trivially wired through the existing chronicle/toast pipeline, emit a one-time toast on first run:

> *"Twelve actions are yours by birthright. The rest await earning."*

If wiring this is more than a 5-minute insertion, defer to a follow-up `// TODO(THR-XX): first-run toast`. The starter floor is self-explanatory through the drawer surface.

### 7.5 HexMap signifiers — N/A

No hex-map visual changes. The Starter 12 doesn't introduce new entity types.

### 7.6 Browser-verify artefact (Definition of Done)

The closing commit/Linear comment MUST include:
1. **Screenshot of ActionDrawer at 1920×1080** showing exactly 12 starter actions visible when hovering a hex-with-mortals (Playwright `preview_resize` + `preview_screenshot`).
2. **Screenshot of DebugPanel "Actions" sub-tab** showing the Starter/Unlocked/Locked counts.
3. **Console output** captured via `mcp__playwright__browser_console_messages` — empty result is valid; embed `(no errors or warnings)`.
4. **State assertion via `__DEBUG`** — call `window.__DEBUG.listStarterActions()` and confirm 12 IDs returned; call `window.__DEBUG.listLockedActions()` and confirm > 80 entries.

Playwright is sufficient — this is DOM only, no WebGL.

## 8. Wiring section (cross-pillar checklist)

| Capability | Where it wires |
|---|---|
| Orchestrator phase | None new. Gate 8 fires at slot read time. |
| GameState field | `unlockedActionIds: readonly string[]` |
| Initial seed | `initializeGameState()` seeds `unlockedActionIds: []` |
| Slot pipeline | New Gate 8 in `getTargetActionSlots()` |
| ActionDrawer | Renders what slot pipeline returns (no component change) |
| DebugPanel | New "Action Unlocks" sub-tab |
| Debug bridge | New `__DEBUG.listStarterActions()`, `__DEBUG.listLockedActions()`, `__DEBUG.grantAction(id)` |
| Codex view | New "Starter" filter chip |
| Traces | `action.gate.unlock_filter` emitted per filtered candidate |
| Prose pipeline | None new — starter templates already have prose |
| Tests | Template-data fixture (`starter` flag count = 12 ∧ IDs match `STARTER_ACTION_IDS`); slot-pipeline test (locked template hidden, unlocked surfaces) |

## 9. Phasing

This issue is **Phase 1 only**: the floor.

- **Phase 1 (this issue)** — `starter` flag, `STARTER_ACTION_IDS`, Gate 8, GameState field, DebugPanel sub-tab, Codex chip. Ships the floor.
- **Phase 2 (separate issue, future)** — Run-start picker UI + meta-progression unlock mechanism (achievements / deeds → push IDs into `unlockedActionIds`). Requires the run-mutator system to exist.
- **Phase 3 (separate issue, future)** — Persistence layer for `unlockedActionIds` across browser sessions.
- **Phase 4 (separate issue, future)** — Per-template unlock-hint strings in the codex ("Earn by: completing a Ruins discovery; reaching reach.heart tier 2; …").

## 10. NFP compliance

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | All numbers named in §5.6. The 12 IDs are themselves a tunable constant (`STARTER_ACTION_IDS`). |
| 2 | Inspectability | PASS | New trace `action.gate.unlock_filter` per filtered candidate; DebugPanel sub-tab gives live read of state. |
| 3 | Determinism | PASS | No PRNG. Gate is a pure predicate over template metadata + state. |
| 4 | Fail-soft | PASS | §5.7 table covers all four failure modes. Runtime never throws on missing flags or missing state. |
| 5 | Narrative over mechanical perfection | PASS | The chosen 12 are selected for prose density and persona coverage, not mechanical efficiency. |
| 6 | Additive over destructive | PASS | One new field on UnifiedActionTemplate (optional). One new field on GameState (defaulted). One new gate in the slot pipeline (additive). No deletions. |
| 7 | Performance budget | PASS | Gate 8 is O(1) per template per slot generation (set lookup + array.includes). The action-set sizes are small enough that no profiling is required. |

## 11. Dependencies

**Hard (blocks):**
- **THR-398** (Survey collapse) — `hex.survey` is one of the 12 starters and must be the post-collapse unified verb. Starter 12 must land **after** THR-398.
- **THR-396** (`trayTier` field + classifier fix) — both this and Starter 12 add fields to `UnifiedActionTemplate`. To avoid merge conflicts and so the executor can verify the field interaction (a starter is by definition a `trayTier: 'core'` candidate), land THR-396 first.
- **THR-397** (rarity recurve) — same file, mutex by content. Land THR-397 first so the rarity assignments on the 12 starters are settled before they get tagged.

**Soft (coordinate, not block):**
- **THR-399** (self-actions), **THR-400** (faction expansion), **THR-401** (location expansion) — also touch `unified-action-templates.ts`. Mutex with all three at the file level; executor sequencing required. Recommend Starter 12 lands **after** all four if at all possible, so the catalog is at its post-curation shape when the starter floor is tagged.

**Soft (informational):**
- **THR-418** (sustained controls in right-bar) — adjacent UI work; the Starter 12 explicitly does NOT include sustained-control verbs because Christian's verdict moved those to the right-bar surface. Verified consistency: no starter in §4 is a `durationMode: 'sustained'` template.

## 12. Coordination block

- **Suggested model:** opus-4-7 (multi-pillar coordination + content selection judgement + UI verification)
- **Parallel-safe with:** THR-412 (intent-judge calibration — independent), THR-409 (worktree graveyard — independent)
- **Mutex with:** THR-396, THR-397, THR-398, THR-399, THR-400, THR-401 (all touch `unified-action-templates.ts`); THR-418 (overlaps on action-system framing — coordinate)
- **Codex review:** yes (touches `gameState.ts` schema + `targetActions.ts` slot pipeline + `unifiedAction.ts` interface)

## 13. Definition of done

- [ ] `starter?: boolean` field added to `UnifiedActionTemplate`
- [ ] `src/engine/actionUnlock.ts` created with `STARTER_ACTION_COUNT`, `STARTER_ACTION_IDS`, `isActionRevealed()`
- [ ] All 12 IDs in §4 carry `starter: true` in `unified-action-templates.ts`
- [ ] `getTargetActionSlots()` Gate 8 in place; `byUnlock` field added to `FilterCounts`
- [ ] `unlockedActionIds: readonly string[]` field added to `GameState`; `initializeGameState()` seeds `[]`
- [ ] Trace `action.gate.unlock_filter` emitted from Gate 8
- [ ] DebugPanel "Action Unlocks" sub-tab renders Starter / Unlocked / Locked counts and lists; `Grant` button works
- [ ] `__DEBUG.listStarterActions()`, `__DEBUG.listLockedActions()`, `__DEBUG.grantAction(id)` exposed
- [ ] Codex view ("Starter" filter chip) renders exactly 12 templates
- [ ] Tests pass: starter count = 12; all 12 IDs resolve to live templates; gate filters non-starter-non-unlocked
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green (paste raw output)
- [ ] Browser-verify artefact (§7.6) attached to closing commit/Linear comment
- [ ] Engine smoke (CLI 30-tick) included — Starter 12 is engine-touching so the smoke applies
- [ ] `Docs/changelog.md`, `project-status.md`, `project-history.md` updated
- [ ] `Docs/plans/wiring-checklist.md` updated if any new orchestrator/UI/state surface introduced
- [ ] Commit message includes `Fixes THR-XXX`
- [ ] Closing Linear comment posted with verification evidence

---

*Authored by Cowork, 2026-05-12. Foundation locked by THR-390 Round 2 verdicts (per-account unlocks; ascendant-identity covers archetype; sustained controls live in right-bar, not the drawer). The Starter 12 ships the floor of the action-system unlock curve — everything that comes after rides on this baseline.*
