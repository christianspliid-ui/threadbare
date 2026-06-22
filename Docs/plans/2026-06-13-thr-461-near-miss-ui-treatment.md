# THR-461 — Slice C: `near_miss` band UI treatment

**Date:** 2026-06-13
**Type:** UI (Phase 6 — Reward & Attachment Economy Expansion, Slice C)
**Origin:** THR-461 (deferred from THR-63 Slice A, follows THR-460 Slice B shipped 2026-06-13 15:57)
**Status:** Ready for Dev (handoff after this doc lands)
**Project:** Agent Success Redesign

## Summary

Make the `near_miss` outcome band **visually legible** at the three UI surfaces where outcomes surface to the player: the toast strip (`useEncounterNotifications`), the chronicle entry card (`ChronicleEntryCard`), and the MTG-style action card outcome face (`ActionCard.tsx`). After Slice B, the engine and prose layer differentiate `near_miss` upstream; this slice closes the loop so the player can tell a near-miss apart from a clean failure or a fortunate success at a glance.

The work is small, additive, and constrained to `src/components/Game/`. No engine changes. No new schema. The deliberate scope of this slice is to **wire band semantics into existing UI seams**, not introduce a new outcome surface.

## Step 0 — Codebase reality check (read before writing code)

The original THR-461 issue description (drafted 2026-06-12) makes two claims that **do not match `main` as of 2026-06-13 16:00 UTC** and would mislead an executor that takes them at face value. Verify and correct before designing fixes:

1. **"`(±0.00Q)` suffix on `agent_action_resolved` messages (shipped in Slice A)"** — the canonical message format in `src/engine/unifiedActionResolution.ts` (lines 1709–1716, 1725–1732) is:
   ```
   ${currentActorName} ${outcomeMsg} ${template.name}${metadataSuffix}${clearanceSuffix}.
   ```
   `metadataSuffix` (defined at `unifiedActionResolution.ts:813` `summarizeMetadataConsequences`) emits reputation/reward/promotion text — **never** a Q delta. No `(±0.00Q)` substring exists anywhere under `src/` (verified via `grep -rn "Q)" src/`). The "shipped in Slice A" claim appears to be aspirational. **Do not assume the suffix is present.** Either (a) confirm via `git log -p` on the THR-63 / PR #332 merge that the suffix landed and was reverted, or (b) treat this work item as **new** — author the Q delta annotation as part of this slice (recommended scope: economic chronicle entries only — see §UI Pillar §3).

2. **"`near_miss` is the band vocabulary"** — `near_miss` is not a `StepOutcome` value (`src/engine/unifiedActionResolution.ts` `describeStepOutcome` only handles `critical_success | success | success_at_cost | failure | critical_failure`). The near-miss band is expressed via `narrativeTag: 'fortunate'` returned by `computeOutcomeConsequence` in `src/engine/outcomeConsequences.ts`. **Treat `narrativeTag === 'fortunate'` as the input signal for this slice.** Slice B's `OUTCOME_BAND_PROSE` table is keyed on these narrative tags — confirm by reading `src/data/narrative-content.ts` after the Slice B merge.

If either invariant is broken on `main` at pickup, post a comment on THR-461 with what you found and bounce the issue back to In Design. Don't ship UI against a phantom upstream.

## Three-pillar coverage

| Pillar | Status | Notes |
| --- | --- | --- |
| Engine | **N/A (verify-don't-omit)** | No engine changes. This slice consumes the `narrativeTag` field already returned by `computeOutcomeConsequence`. Verify the field is propagated to the tick event / notification — if not, file a follow-up Engine deferral; do not silently add propagation in this slice. |
| Content | **Small** | If the `OUTCOME_BAND_PROSE['fortunate']` pool is sparse after Slice B, add 3–5 near-miss copy fragments (toast verbs, chronicle adverbs). Keep the executor's runtime dependency: read what Slice B shipped first; only top up if a pool has fewer than 3 entries. |
| UI | **In scope** | Three deliverables: (1) toast styling/icon for `fortunate` band; (2) chronicle Q-delta annotation color coding (green / red / grey); (3) MTG card outcome face variant for the near-miss band with a progress-counter indicator. |

## Pillar 1 — Engine (verify, do not modify)

**Verification step (run before any UI work):**

1. `grep -n "narrativeTag" src/engine/outcomeConsequences.ts` — confirm `'fortunate'` is one of the returned tags. If absent, this slice is blocked: file `Engine: surface 'fortunate' narrativeTag for near-miss band` as a deferral, set THR-461 back to In Design with the gap noted.
2. `grep -rn "narrativeTag" src/engine/unifiedActionResolution.ts src/engine/notificationRouter.ts` — confirm the tag flows into the `agent_action_resolved` `TickEvent` (likely via metadata) and into the `EncounterNotification` shape (`src/types/encounterVisibility.ts`). If the tag is computed but never reaches the UI, this slice cannot do its job. Likely fix: add a `narrativeTag?: NarrativeTag` field to the relevant carrier types. **But:** if propagation is missing, that's a one-line engine change that belongs in a separate follow-up ticket — don't bundle it here.

Constants stay where they are (`src/data/encounter-experience-constants.ts` for UI tuning numbers, `src/engine/outcomeConsequences.ts` for engine constants). No new constants required by this slice.

## Pillar 2 — Content

After verifying Slice B's `OUTCOME_BAND_PROSE` table shape, add (only if missing or below pool minimums):

* **`OUTCOME_BAND_PROSE['fortunate']` toast verb fragments** — 3–5 entries with `phraseId`s, each ~3–6 words, evoking "nearly had it" without numbers. Examples (style only, do not copy verbatim — author in Threadbare voice): "the cut almost landed," "a hair from her mark," "the moment slipped past her grasp." Avoid the verb `stumbles` (already used for `failure`).
* **`OUTCOME_BAND_Q_FLAVOR['fortunate']`** — 3 entries describing a small partial-progress Q gain or stable Q. Examples (style): "a thread held," "she did not lose her foothold."
* **MTG card face flavor line for near-miss** — one short line authored in `OUTCOME_BAND_PROSE['fortunate'].cardFlavor` (new key — see UI §3 schema).

**Anti-noise cap:** do not add `OUTCOME_BAND_PROSE` entries that duplicate existing `OUTCOME_BAND_PROSE['setback']` phrasing. The `phraseId` dedup guard introduced in Slice B (`src/engine/proseSelection.ts` if Slice B wired it; otherwise still the open lint from THR-460) catches accidental repetition.

## Pillar 3 — UI

Three independent UI deliverables. They can ship as one commit or three; CC's call.

### UI-1 — Toast differentiation (`useEncounterNotifications.ts`)

**Current shape:** every encounter notification becomes a single `ToastItem` with `message: notif.prose`. No band differentiation at the toast layer. Toast styling is the toast-stack component's concern.

**Target:** `near_miss` (`fortunate`) toasts read distinctly from `failure` (`setback`) toasts.

**Recommended approach:** add an optional `band?: NarrativeTag` field to `ToastItem` (in `src/types/notification.ts`), populated from `notif.narrativeTag` when present (fail-soft if absent → no band, current behavior). The `ToastStack` component (the renderer that consumes `ToastItem[]`) maps `band` to icon + accent colour via a small constants table:

| `band` | Icon (lucide) | Accent var | Toast verb hint |
|--------|---------------|------------|-----------------|
| `surge` | `Sparkles` | `--accent-success` | "surges through" |
| `fortunate` | `CornerUpLeft` | `--accent-near-miss` (new) | "nearly had it" |
| `neutral` | (none) | `--text-secondary` | (default) |
| `strained` | `AlertTriangle` | `--accent-warning` | "pushed through at cost" |
| `setback` | `XCircle` | `--accent-failure` | "stumbles" |
| `catastrophe` | `Skull` | `--accent-critical-failure` | "falters badly" |

`--accent-near-miss` is the only new design token. Place it next to existing sphere/state tokens in `src/styles/tokens.css` (or wherever the THR-282-era token file lives — verify path before editing). Value: a desaturated amber distinct from both `--accent-success` (green) and `--accent-failure` (red). Suggested hex: `#c9a14a` (golden-brown); confirm against the active theme.

**Fail-soft:** missing `band` → render the current default toast (no icon, no accent border). No throw.

**Files to touch:** `src/types/notification.ts` (+1 field), `src/components/Game/hooks/useEncounterNotifications.ts` (populate `band`), `src/components/Toast/ToastStack.tsx` or equivalent renderer (apply band styling). Verify the renderer path with `grep -rn "ToastItem" src/components`.

### UI-2 — Chronicle Q-delta colour coding (`ChronicleEntryCard.tsx`)

**Current state:** `ChronicleEntryCard` (76 lines, dual-voice poet/witness layout) does **not currently render a Q-delta annotation at all** — the issue description's claim that the `(±0.00Q)` suffix exists is unsubstantiated on `main`. See §Step 0.

**Two-track resolution:**

* **Track A — verified absent.** If §Step 0 confirms the suffix never landed, this UI work expands into: (1) thread a `quintessenceDelta?: number` field through `ChronicleEntry` (`src/types/narrative.ts`), (2) populate it in `phaseEconomicChronicle.ts` when it builds entries from `agent_action_resolved` events, (3) render the suffix in `ChronicleEntryCard` with colour coding. This is meaningfully larger than the issue description framed it as — consider splitting into **THR-461a (this slice, UI only)** and **THR-461b (engine + content threading)**. Default recommendation: split.

* **Track B — verified present.** If a hidden source for the Q-delta annotation exists, the UI work is small: read `entry.quintessenceDelta` (or whatever field carries it), render an inline `<span>` with class/style keyed on sign — `>0 var(--accent-success)`, `<0 var(--accent-failure)`, `=0 var(--text-tertiary)`. Append to the witness bullet line, not the poet line.

**Recommended scope for this slice:** Track A — split. Do the UI in this ticket, file the engine/content threading as a follow-up. The split keeps the slice mechanical (UI only) and preserves the "is the engine actually producing this?" check as a single follow-up question rather than a bundled assumption.

**Files to touch (UI-only track):**
* `src/types/narrative.ts` — add `quintessenceDelta?: number` to `ChronicleEntry` (forward-compatible with future engine work).
* `src/components/Game/ChronicleEntryCard.tsx` — render the suffix when `entry.quintessenceDelta != null`. Place at the end of the title line (`t{entry.tick} · {entry.title} +0.5Q`) since the witness bullets vary in length; the title line is the stable spot.
* `src/components/Game/__tests__/ChronicleEntryCard.test.tsx` — three test cases (positive, negative, zero, absent).

### UI-3 — MTG card near-miss face (`ActionCard.tsx`)

**Current state:** `ActionCard.tsx` (684 lines) renders the action card in two layouts: "focused" (MTG-classic frame, line 415) and the default layout. The outcome face is rendered after resolution. `grep -n "outcome\|near_miss" src/components/Game/ActionCard.tsx` returns only the MTG-frame comment — there is **no existing `near_miss` face variant**.

**Target:** add a `fortunate`-band outcome face that reads distinct from both `success` (the card resolves clean, ribbon green) and `failure` (the card resolves struck, ribbon red).

**Visual spec:**
* **Ribbon colour:** new `--accent-near-miss` (same token as UI-1).
* **Iconography:** small "progress counter" indicator — a +1 / +2 numeric chip in the corner of the outcome face, populated from `metadata.progressDelta` if Slice A's `near_miss` band emits one; otherwise omit the chip and rely on the ribbon + flavor text alone.
* **Flavor text band:** read from `OUTCOME_BAND_PROSE['fortunate'].cardFlavor` (the new content key in §Pillar 2). Italic, ~14px, one line.

**Anti-pattern to avoid:** do not introduce a fourth full layout. The `fortunate` face is a colour/icon/flavor variant on the existing failure face, not a new layout. Reuse the failure face's structural CSS; only swap the band-keyed colour token and flavor text source.

**Files to touch:**
* `src/components/Game/ActionCard.tsx` (around the existing outcome face render path — find via `grep -n "outcome" src/components/Game/ActionCard.tsx` and follow the data flow from props).
* If a `--accent-near-miss` token wasn't added in UI-1 yet, add it now.
* `src/components/Game/__tests__/ActionCard.test.tsx` — add a `fortunate` face render assertion.

## Constants

| Constant | Default | Location | Purpose |
|----------|---------|----------|---------|
| `--accent-near-miss` | `#c9a14a` (golden-brown) | CSS tokens file | Toast accent + card ribbon + chronicle Q-delta tint for near-miss band. Tune against active theme before merge. |
| `NEAR_MISS_TOAST_DURATION_MULTIPLIER` | 1.0 (no change) | `src/types/notification.ts` adjacent to `TOAST_DURATION_MS` | Decision: do not extend toast duration for near-miss. Encounter toasts already get `× 2` (`useEncounterNotifications.ts:65`); a near-miss isn't categorically more important than a clean failure. Recorded here for future tuning. |

No engine constants. Reuse `outcomeConsequences.ts` thresholds as-is.

## Tracing

No new traces. The narrative-tag origin is already traced by Slice B's prose pipeline. Adding traces at the UI layer would duplicate without adding diagnostic value.

If a regression surfaces during browser-verify (UI element shows the wrong band), use `window.__DEBUG.getTraces()` filtered to category `outcome_consequence` to confirm the engine emitted the expected tag, then check whether the tag survived propagation to `EncounterNotification.narrativeTag`. The split is diagnostic by inspection of state, not by trace.

## Fail-soft table

| Failure case | Fallback behavior | Notes |
|--------------|-------------------|-------|
| `narrativeTag` absent on `EncounterNotification` | Render current default toast (no icon, no accent) | Current behavior; no regression. |
| `narrativeTag` is an unknown string | Render current default toast | Tag is a string at the boundary; defensive Map lookup with `.get(tag) ?? defaultStyle`. |
| `entry.quintessenceDelta` absent | Render title line without suffix | Current behavior; new field is opt-in. |
| `OUTCOME_BAND_PROSE['fortunate'].cardFlavor` missing | Card face renders without flavor text band | Don't crash, don't substitute a `setback` line. |
| `--accent-near-miss` token absent at runtime | Falls through to browser's default (transparent) — toast still readable | Pin token addition in the same commit as the consumer to avoid this. |

## NFP compliance

| NFP | Status | Notes |
|-----|--------|-------|
| 1. Tunability | PASS | One new colour token; no magic numbers introduced. |
| 2. Inspectability | PASS | Band routing is read from existing `narrativeTag`; no new opaque state. |
| 3. Determinism | PASS | UI selection is deterministic-on-input. |
| 4. Fail-soft | PASS | Five explicit fallback cases in §Fail-soft table. |
| 5. Narrative over mechanical perfection | PASS | The whole slice is in service of "the player feels a near miss differently." |
| 6. Additive over destructive | PASS | All new fields are optional. No deletions, no renames. |
| 7. Performance budget | PASS | UI-layer styling change. No render-loop cost. |

## Wiring checklist

* **Orchestrator phase:** N/A — UI consumes engine output, no new phase.
* **UI component:** new band styling in `ToastStack` + `ChronicleEntryCard` + `ActionCard` outcome face.
* **GameState flow:** `narrativeTag` already flows via `computeOutcomeConsequence`; this slice consumes it. If propagation is broken (see §Engine pillar verification), file a follow-up.
* **Traces:** none added.
* **Debug visibility:** `window.__DEBUG.getTraces()` filtered to existing categories suffices.
* **Prose pipeline:** new `cardFlavor` key consumed by `ActionCard` directly — does not pass through `enrichProse`.
* **Player controls:** none added.

## Vision audit

Touches none of the Vision non-negotiables. The slice makes existing legibility tighter; it does not introduce a new player surface or a new agent capability.

## Rulebook impact

None. The five-band outcome ladder is already canon in the rulebook (Slice A and B). This slice makes the existing ladder legible to the player; rules of play unchanged.

## Intent-judge proposal hook

Proposal at `Docs/plans/.intent-proposals/thr-461.md` (write before running `intent-judge`):
* **Verbatim ask** (from THR-461 description): "Slice C adds a distinct visual presentation for the `near_miss` band and ensures the toast and chronicle entry reflect the new band vocabulary."
* **Plan claim:** delivers (1) toast band styling, (2) chronicle Q-delta colour-coded suffix, (3) MTG card near-miss face. Splits the Q-delta engine-threading into a follow-up rather than bundling.
* **Known divergences from issue body:** (a) re-frames `near_miss` as `narrativeTag === 'fortunate'` (StepOutcome union doesn't carry `near_miss`); (b) treats the `(±0.00Q)` suffix as not-yet-existent on `main`, recommends splitting the engine-threading into a follow-up.

## Coordination block

* **Suggested model:** sonnet (mechanical UI work, well-scoped, no novel architecture).
* **Required label:** `model:sonnet`.
* **Parallel-safe with:** any non-UI engine work; any other Phase 6 follow-up; THR-414 verdict pass (different surface).
* **Mutex with:** any in-flight work touching `ActionCard.tsx`, `ChronicleEntryCard.tsx`, `useEncounterNotifications.ts`, `src/types/notification.ts`, or `src/data/narrative-content.ts`. As of pickup time, none — Slice B just landed at 15:57 today and the touched files are now stable.
* **Codex review:** no — slice is small, UI-focused, and Sonnet is the right cost band.
* **Files to touch:** `src/types/notification.ts`, `src/types/narrative.ts`, `src/components/Game/hooks/useEncounterNotifications.ts`, `src/components/Game/ChronicleEntryCard.tsx`, `src/components/Game/ActionCard.tsx`, `src/components/Toast/ToastStack.tsx` (or wherever the toast renderer is — verify), `src/data/narrative-content.ts` (content top-up if needed), one CSS tokens file. Plus three test files: `ChronicleEntryCard.test.tsx`, `ActionCard.test.tsx`, and a new or extended `useNotifications.test.ts` case.

## Done when

- [ ] Step 0 reality check executed and findings posted to THR-461 as a comment before any code is written.
- [ ] Engine verification (`narrativeTag` produced, propagated to UI) confirmed or follow-up filed.
- [ ] `near_miss` toast is visually distinct from `failure` toast (different icon, accent colour, verb).
- [ ] Chronicle Q-delta suffix renders colour-coded (green / red / grey) **OR** the Q-delta engine threading is filed as a follow-up ticket and the UI hook for it lives in `ChronicleEntryCard` as a no-op-when-absent path.
- [ ] Action card shows near-miss outcome face with `fortunate`-band ribbon and flavor text (and progress chip if `metadata.progressDelta` is available; otherwise omit).
- [ ] `--accent-near-miss` token defined exactly once, consumed by the three UI surfaces.
- [ ] Three test files extended; `npm test` green.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npx vite build` succeeds.
- [ ] Browser-verify per Definition of Done §Browser-verify UI changes: screenshot at 1920×1080 showing all three band faces in the action card resolution panel, captured via Playwright (DOM) since `ActionCard` is DOM not WebGL; console errors+warnings filter posted as fenced block; one `window.__DEBUG.*` assertion proving the band routes from engine output to UI state.
- [ ] Closing commit body includes `Fixes THR-461` plus raw verification output (or green CI link).
