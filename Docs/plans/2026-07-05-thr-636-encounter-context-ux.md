> **title:** `Encounter context UX — structured notification cards, step navigation with full replay, outcome/reach/location context — THR-636`
> **linear_issue:** THR-636
> **author:** Cowork
> **created:** 2026-07-05
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Encounter context UX — THR-636

*The player currently cannot answer "whose encounter is this, where is it, how is it going?" without reading a wall of prose — this plan makes every encounter surface answer those questions at a glance.*

## Why this is load-bearing

Encounters are the payoff of the whole game loop (THR-603 density vision), but their two delivery surfaces undercut them. The right-rail boxes render the encounter's full prose as the toast body (`useEncounterNotifications.ts:62` — `message: notif.prose`), so the player sees undifferentiated text instead of "Kael's encounter advanced." Inside `EncounterVeil`, the character is a faint italic subtitle, step position is 6px non-interactive dots, past steps are unreachable, success/failure is buried in a below-the-fold readout, reaches are never named, and `header.locationLabel` — already built by the adapter — is never rendered. The data exists (`EncounterNotification` carries `agentName`/`encounterName`/`stepIndex`/band; `EncounterStageModel` carries `history[]`, `resolutionReadout`, cast, location). This is a surfacing fix that every future encounter (and the Chapter Ledger, THR-603) inherits. Direction settled with Christian in chat 2026-07-05: **structured cards** in the rail, **full past-step replay** in the modal, **location line + camera-focus link** (mini-map explicitly rejected for now).

## Engine pillar

### Systems design

Two additive capabilities:

**1. Step prose records (replay substrate).** At the moment a step resolves, capture what the player actually saw into a new optional field on the active unified action record (and mirrored on legacy `EncounterProgress` for the legacy path):

```ts
/** Captured at step resolution — the replay record for one resolved step. */
export interface StepProseRecord {
  readonly stepIndex: number;
  readonly stepLabel: string;
  readonly narrativeProse: string;      // enriched prose as rendered at resolution tick
  readonly afterimage: string;          // enriched success/failure afterimage
  readonly outcomeBand: string;         // stepOutcomeToOutcomeBand(outcome)
  readonly reach: ReachDomain;
  readonly choiceId?: string;           // player god-action taken on this step, if any
  readonly choiceLabel?: string;
  readonly complication?: { prose: string; name: string; severity: 'minor' | 'standard' | 'severe'; category: string };
  readonly tick: number;
}
```

Capture-at-resolution (not re-render-at-view) is deliberate: `enrichProse` placeholders (`{ally}`, `{artifact}`) resolve against live world state, so re-rendering later could show a *different* past than the player experienced. The record freezes the truth. Fallback for records missing (old saves, cap overflow): re-render via the existing `resolveStepDefinition(template, index, choiceHistory)` + `enrichProse` path used by `buildUnifiedEncounterStageModel.ts:295` — degraded but never empty.

**2. Notification context fields.** Additive optional fields on `EncounterNotification` (`src/types/encounterVisibility.ts`): `totalSteps?: number`, `outcomeBand?: string` (the just-resolved step's band; distinct from the existing whole-notification `narrativeTag`), `hexCol?: number`, `hexRow?: number`, `locationLabel?: string`. Hex resolved at emission time via the three-tier position model (sublocation → parent location → hex), same resolution every spatial system uses.

### Graph nodes / edges

None. No new node or edge types; position is read via the existing `located_at` resolution helpers. (Load-bearing decision "relationships are edges" untouched — `StepProseRecord` is data internal to an action record, not a relationship.)

### Tick phases

No new phases. Step-record capture happens inside the existing step-resolution site in `unifiedActionResolution.ts` (and the legacy encounter resolution site in `engine/encounter.ts`); notification-context enrichment happens where `EncounterNotification`s are already constructed (encounter visibility/notification phase). Ordering unchanged.

### Resolution logic

None changed. Zero gameplay-math impact — this plan reads outcomes, it never computes them.

### PRNG callouts

**`enrichProse` is a PRNG consumer and falls back to `Math.random` when `opts.rng` is absent (`proseEnrichment.ts:270, 310`)** — and the existing adapter call at `buildUnifiedEncounterStageModel.ts:301` passes only `{ runtime }`, i.e. unseeded. The capture site MUST NOT copy that pattern: thread the seeded resolution-context PRNG into `enrichProse` via `opts.rng` at capture time (new draws on the seeded stream; sequence shift accepted and noted). The fallback re-render path must do the same. Same seed + same capture tick = same stored record. (Finding from forked NFP audit — this is the one determinism trap in the plan.)

## Content pillar

### Encounter templates

No new templates. Existing `successAfterimage` / `failureAfterimage` authoring is the replay's summary layer; templates missing afterimages fall back to band words (below) — a lint follow-up is *not* needed since fallback is fail-soft.

### Prose tables

**Outcome-band word lexicon** — one small authored table mapping outcome band → prose word used on cards and step-nav states (plain register per THR-609: interactive text always plain): e.g. `critical_success → "triumphed"`, `success → "held"`, `partial → "faltered"`, `failure → "broke"`, `critical_failure → "collapsed"`, unknown → `"unfolded"`. Reuse/extend the THR-461/THR-462 band vocabulary if an equivalent mapping already ships; do not fork a second lexicon — single source, exported constant.

### Attachment content

N/A — no attachment content touched.

### Data tables

N/A — no world-model.json changes.

## UI pillar

*Screenshot tool: Playwright (both surfaces are DOM — toast rail and EncounterVeil portal; no WebGL content changes).*

### Player-facing display

**A. Structured notification card (ToastStack + encounter alerts in AlertBar).** Replace prose-body toasts for encounter notifications with a card:

- Line 1 (headline): **agent name** — *encounter name* (name plain and prominent, not ghost-opacity).
- Line 2 (meta): `step {stepIndex+1} of {totalSteps} · {band word}` for beats; `concluded · {band word}` for `kind: 'aftermath'`. Plain text, no numbers beyond the step counter (counters are structure, not mechanics — consistent with step dots' existing "2 of 4" label).
- Line 3 (tease): first sentence of `notif.prose`, clamped to `NOTIF_TEASER_MAX_CHARS` with ellipsis.
- Whole card clickable → existing `onOpenEncounter` path. Full prose lives only in the modal.
- Card left-edge tint keyed by band word tone (gain/loss/neutral), consistent with existing band styling from THR-461.

**B. EncounterVeil context strip** (new block between title and prose):
- **Character**: **portrait + agent name** rendered as the primary element (promoted from ghost subtitle) — portrait via the existing `getPortraitUrl(archetypeId)` helper (`src/data/portrait-assets.ts`), the same system the aftermath actor-moments already use (`EncounterStageAftermathActorModel.portraitUrl`). Court-position/thread-tier tag kept; clickable per encounters-canon Rule 4 ("every primitive is clickable") → opens the agent detail surface via the existing `onSelectAgent`-style callback. Requires adding `portraitUrl?: string | null` (and the focal actor id) to `EncounterStageHeaderModel`, populated in the adapters. Portrait opacity may follow the existing `ART_OPACITY` thread-tier treatment so watched-tier encounters stay veiled.
- **Cast**: cast tiles gain the same small portrait treatment where an archetype resolves (`EncounterStageCastModel` + adapter); tiles without a resolvable portrait render name-only, unchanged (addition confirmed by Christian in chat 2026-07-05).
- **Location**: `header.locationLabel` (already built, currently dropped) + a **"Show on map"** focus affordance (plain register per THR-609 — interactive text names what the click does): veil closes (Disregard semantics, no state change) and camera pans to the encounter hex via the existing focus-hex pattern (same family as `__DEBUG.gotoAgent` / `onFocusHex`). Hidden when hex is unresolvable.
- **Reach**: current step's `reachLabel` (already in `EncounterStageResolutionCheckModel`) shown as a plain keyword chip; on resolved-step replay, that step's reach.

**C. Step navigator (replaces passive dots).** Same visual language, made legible and interactive:
- Resolved dots colored by outcome band (warm success / ember failure) instead of uniform faint green — success/failure at a glance.
- Hit area ≥ `STEP_NAV_MIN_HIT_PX` (visual dot stays small; padding grows); hover/focus tooltip: `Step 2 — {band word}`.
- Clicking a **resolved** dot enters replay: the prose area shows the `StepProseRecord` — narrative prose, afterimage, outcome word, reach chip, the god-action taken (choiceLabel), complication block if fired. Choices/footer are hidden in replay; a single "Return to the present" control (and clicking the current dot) exits. Future dots inert.
- Replay is read-only — no re-choosing, no state writes.

### Event notifications

Covered by (A) — this plan *is* the notification redesign. Chronicle entries unchanged (ChroniclePanel already curates prose; out of scope).

### Debug inspection (DebugPanel)

New bridge method `window.__DEBUG.getStepProse(agentRef)` → `{ actionId, records: StepProseRecord[] } | { error }` (partial name/id match, same resolution notes as `gotoAgent`). Documented in CLAUDE.md §Debug Bridge in the closing PR.

### Visual presence (HexMapV2)

No renderer changes. The focus link reuses the existing camera-pan API; hex pulse on threaded encounters already shipped (THR-340).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Step prose capture | existing step-resolution (unified + legacy) | EncounterVeil replay view | `stepProseHistory` on action record / `EncounterProgress` | `encounter.step_prose_recorded` | `__DEBUG.getStepProse()` |
| Notification context | existing notification emission | ToastStack card, AlertBar | `encounterNotifications[].totalSteps/outcomeBand/hex*/locationLabel` | existing notification traces (fields added) | DebugPanel notification tab (existing) |
| Card renderer | n/a (pure UI) | `ToastStack.tsx` (+ shared card sub-component) | reads above | n/a | n/a |
| Context strip + step nav | n/a (pure UI) | `EncounterVeil.tsx` | reads `EncounterStageModel` | n/a | n/a |
| Focus-map link | n/a | EncounterVeil → GameView camera callback | n/a | n/a | n/a |

`enrichProse()`: yes — at capture time and in the fallback re-render path, with runtime context.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `NOTIF_TEASER_MAX_CHARS` | `90` | Clamp length of the card's one-line prose tease |
| `ENCOUNTER_TOAST_DURATION_MULT` | `2` | Names the existing magic `* 2` in `useEncounterNotifications.ts:65` |
| `STEP_NAV_MIN_HIT_PX` | `24` | Minimum clickable hit area per step dot |
| `STEP_PROSE_HISTORY_MAX` | `24` | Cap on retained step records per action (drop-oldest on overflow) |
| `OUTCOME_BAND_WORDS` | table | Band → prose word lexicon (single exported source) |

## Tracing

```ts
// StepProseRecordedTrace — emitted when a resolved step's replay record is captured
interface StepProseRecordedTrace {
  type: 'encounter.step_prose_recorded';
  actionId: string;
  actorId: string;
  stepIndex: number;
  outcomeBand: string;
  reach: ReachDomain;
  proseLength: number; // capture health signal without duplicating prose into traces
  tick: number;
}
```

Register in `TRACE_CATEGORIES` (known gap pattern from the encounter-migration Codex review — do not skip).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `StepProseRecord` missing for a resolved step (old save, cap overflow) | Re-render via `resolveStepDefinition` + `enrichProse`; if that throws, show afterimage-only summary; never block navigation |
| `totalSteps` absent on a notification | Card meta shows `step 3` without `of Y` |
| `outcomeBand` absent / unknown band | Neutral word `"unfolded"`, neutral tint |
| Hex unresolvable (agent off-map, stale location) | Hide the focus-map affordance; location text still shown if `locationLabel` present, else omit line |
| `locationLabel` empty | Omit location line entirely (no "Unknown place" placeholder) |
| Portrait unresolvable (`getPortraitUrl` returns null / archetype unknown / asset 404) | Name-only chip; no broken-image placeholder; layout must not shift |
| Legacy-path encounter without unified record | Legacy `EncounterProgress.stepProseHistory` mirror; if absent, summary-only replay from `resolutionHistory` + `history[]` |
| `enrichProse` throws at capture time | Store raw un-enriched template prose; log trace; tick loop never crashes |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | One additive optional field (`stepProseHistory?`) on the action record type — no signature changes, no consumer breaks; risk is compile-time only if the interface is widened carelessly |
| `src/types/gameState.ts` | 345 importers | Touched only if `EncounterProgress` lives here rather than `types/encounter.ts` — same additive-optional rule applies; verify actual home before editing |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (outcome-band lexicon; templates/attachments N/A with rationale)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. Reinforces prose-first UI (mechanics as band words, not numbers), player-as-god framing (replay shows *the god-action taken*, not character choices), Rule 4 clickability (character chip, location link), and THR-603's cognitive-load priority (cards reduce rail load; replay substrate feeds the future Chapter Record).
- [x] No Vision edit required.

## Rulebook impact

- [x] No rule of play changes — presentation and navigation only. Replay is read-only; no new verbs, resources, prerequisites, or clocks.

> Brainstorm companion: `Docs/plans/2026-07-05-thr-636-encounter-context-ux-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | All five tunables named in constants table, incl. naming an existing magic number |
| 2. Inspectability | PASS | New trace type + `__DEBUG.getStepProse`; capture health visible without prose duplication |
| 3. Determinism | PASS | No new PRNG; capture-at-resolution makes replay *more* deterministic than re-render |
| 4. Fail-soft | PASS | Seven-row fallback table; every miss degrades to summary or omission, never throws |
| 5. Narrative over mechanical perfection | PASS | Band words over numbers everywhere player-facing; frozen replay preserves the story as experienced |
| 6. Additive over destructive | PASS with note | All engine fields optional-additive. UI: toast body layout is *replaced* for encounter notifications (intended — the prose dump is the bug) |
| 7. Performance budget | PASS | Capture is O(1) per step resolution; records capped at `STEP_PROSE_HISTORY_MAX`; no per-tick work added |

## Done when

- [ ] Encounter toasts render the structured card (headline / meta / tease), click-through preserved
- [ ] EncounterVeil shows context strip (character **portrait + name** clickable, location + working camera-focus link, reach chip); cast tiles show portraits where resolvable
- [ ] Step dots are outcome-colored and resolved steps navigate to full replay incl. choice taken; "Return to the present" works
- [ ] `window.__DEBUG.getStepProse()` returns records; trace type registered in `TRACE_CATEGORIES`
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass; engine smoke (30-tick CLI) since `src/engine/` is touched
- [ ] Browser-verify: Playwright screenshots at 1920×1080 of (a) card in rail, (b) context strip, (c) a replayed past step; console output block
- [ ] Closing commit body and PR body include `Fixes THR-636`
- [ ] Design Reference Wiki page covering encounters updated if its `sources` globs match touched files

## Coordination block

**Suggested model:** sonnet — surfacing/plumbing work with settled design; no novel systems math (advisory; automation runs Opus regardless)

**Parallel-safe with:** THR-607 (UL-proposal, doc-only); content-authoring pipeline issues (no template format changes)

**Mutex with:** Any issue touching `EncounterVeil.tsx`, `ToastStack.tsx`, `useEncounterNotifications.ts`, or Chapter Ledger follow-on issues from THR-603 (shared record substrate — see mandatory alignment note below)

**Files to touch:**
- Create: `src/components/Game/EncounterNotificationCard.tsx` (shared card renderer)
- Edit: `src/components/Game/ToastStack.tsx` (render card for encounter toasts)
- Edit: `src/components/Game/hooks/useEncounterNotifications.ts` (build card model, name duration constant)
- Edit: `src/components/Game/EncounterVeil.tsx` (context strip, step navigator, replay view)
- Edit: `src/components/Game/encounter-stage/types.ts` (+ replay model fields on history entries)
- Edit: `src/components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts` (populate replay + reach/location context)
- Edit: `src/types/encounterVisibility.ts` (notification context fields)
- Edit: `src/types/encounter.ts` / `src/types/unifiedAction.ts` (`StepProseRecord`, `stepProseHistory?`)
- Edit: `src/engine/unifiedActionResolution.ts` + legacy `src/engine/encounter.ts` (capture at resolution)
- Edit: `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (`getStepProse`)
- Edit: trace registry (`TRACE_CATEGORIES`)

## Notes for the executor

- **Do not** re-render past prose at view time as the primary path — capture-at-resolution is the design; re-render is fallback only (see Engine §1 rationale).
- **Do not** surface probability/roll numbers on cards or in the replay body — band words only; the existing `resolutionReadout` block stays where it is for players who scroll, numbers stay in DebugPanel.
- The step-dot visual language is liked — enlarge hit areas and add color/interaction, don't redesign the dots into a wizard/stepper bar.
- `narrativeTag` (whole-notification band, THR-462) and the new per-step `outcomeBand` are different things; don't collapse them.
- **Chapter Record alignment is mandatory scope, not conditional** (forked pillar-audit finding): `ChapterStepRecord` + `chapterArchive` already shipped 2026-07-04 (`src/types/chapterRecord.ts`, `src/engine/chapterArchive.ts`, THR-603). `StepProseRecord` serves a different moment (per-step capture on *active* encounters vs. capture-at-completion) so it is not redundant — but align field names/shapes with `ChapterStepRecord` in this PR, reuse shared sub-shapes where they exist, and note the alignment in the completion comment.
- Optional polish, not required scope: the reach chip may be rendered as an IPK keyword linking to the codex reach entry (Vision-audit suggestion); a dead plain chip is acceptable for v1.
- Portrait addition (2026-07-05, post-audit, user-requested): reuse `getPortraitUrl` exactly as the aftermath actor-moments path does — do not introduce a second portrait-resolution mechanism. Scope delta is presentation-only (header/cast model fields + adapter population + render); no engine or determinism impact, so the forked-audit verdicts stand.

## Forked-audit verdicts

*Run 2026-07-05 (three forked subagents). Intent-judge verdict: **Allow** (0 GAPs, 0 VIOLATIONs, impact class Reversible confirmed). Both REVISE findings below were integrated into this doc in the same pass — see §PRNG callouts and §Player-facing display.*

### NFP audit

**REVISE → resolved.** All cited code sites verified (`useEncounterNotifications.ts:62/65`, `encounterVisibility.ts:42–68`, `buildUnifiedEncounterStageModel.ts:295–301`, `encounter-stage/types.ts`, `TRACE_CATEGORIES` in `traceBuffer.ts`; `EncounterProgress` confirmed in `types/encounter.ts`, so the conditional `gameState.ts` blast-radius row is moot; band lexicon `OUTCOME_BAND_PROSE` in `src/data/outcome-band-content.ts` exists to extend). One finding: `enrichProse` falls back to `Math.random` when `opts.rng` is absent, and the adapter pattern the plan cited passes no rng — a capture site copying it would store nondeterministic prose into persistent state (NFP #3 violation). **Fix applied:** §PRNG callouts now mandates threading the seeded resolution PRNG into `enrichProse` at capture and in the fallback path. NFPs #1/#2/#4/#5/#6/#7: PASS.

### Three-pillar audit

**PASS-with-notes.** All three pillars substantive; N/A subsections carry rationale; wiring table connects every module (phase / component / GameState field / trace / debug); all four UI surfaces addressed; screenshot tool (Playwright) named with correct DOM-only justification; no missing required sections. Note: the plan originally treated Chapter Record alignment as conditional-future, but `ChapterStepRecord` + `chapterArchive` shipped 2026-07-04 (THR-603). **Fix applied:** alignment promoted to mandatory scope in Notes for the executor; `StepProseRecord` confirmed non-redundant (active-encounter per-step capture vs. capture-at-completion).

### Vision audit

**REVISE → resolved.** Card design does not drain narrative flavour (ticker rejected for exactly that; teaser retained; full prose lives in the modal; creative-director sign-off in chat 2026-07-05). Replay respects god-framing (shows the god-action taken, read-only, no re-choosing). Prose-first upheld (band words, no rolls/percentages). Rule 4 extended correctly. THR-603 aligned. One violation: "look upon it" affordance breached THR-609's plain-interactive-text rule. **Fix applied:** renamed to "Show on map". Minor suggestion (reach chip as IPK codex link) recorded as optional polish in executor notes.
