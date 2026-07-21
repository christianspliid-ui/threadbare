# THR-439 — Survey: HexChronicle dynamic people-layer swap on `survey_completed`

**Date:** 2026-05-14
**Linear:** [THR-439](https://linear.app/threadbare/issue/THR-439) — *Survey: HexChronicle dynamic people-layer swap on survey_completed*
**Project:** Content Architecture (Now / High)
**Parent:** [THR-398](https://linear.app/threadbare/issue/THR-398) — Hex-Recon Verb Collapse (Survey). Label: `Deferral`.
**Sibling deferral:** [THR-440](https://linear.app/threadbare/issue/THR-440) — Survey named-mortals band (parallel-safe; see §8).
**Brainstorm companion:** inline §2 — this is the "own small design pass" THR-415 plan §2 Option C / §12.1 explicitly deferred for the staleness model (live reference view vs. point-in-time cast snapshot). The §2 analysis is the brainstorm record. No new vision call.

## 0. Reading the issue forward

THR-415 shipped `composeSurveyPeopleProse` + the `survey_completed` TickEvent — a dynamically composed, hex-scoped, Threadbare-voice people-layer prose band, emitted on `hex.survey` success and surfaced in the **event feed**. THR-415 deliberately did **not** touch HexChronicle: its plan §2 Option C named the staleness ambiguity — "is the band 'what Survey showed you at tick 40' or 'what the hex is right now'?" — and deferred the HexChronicle swap as needing "its own small design pass." THR-439 **is** that design pass.

Today HexChronicle's "THE PEOPLE" section renders **static** prose: `cultureProse` from `CULTURE_LOCATION_PROSE` and `factionProse` from `FACTION_CONTROL_PROSE`, picked by a hex-seeded PRNG (`HexChronicle.tsx:291–323, 793–819`). That prose is *live* — it re-derives every render from current graph state — but it is generic table prose, not the dynamic Survey band. The `survey_completed` event already carries a richer, hex-specific band; HexChronicle just does not read it.

THR-439 wires HexChronicle's people-layer **prose paragraphs** to swap to the most-recent `survey_completed` band for the displayed hex when one exists, falling back to the static table prose for un-surveyed hexes. The structured lists below the prose ("Factions Present", "Souls Present") are **live reference** and stay untouched — only the lead prose paragraphs swap.

## 1. Substrate check — verify before authoring

> **⚠ Stale-tree caveat (read first).** This plan was authored by a Cowork `keep-work-flowing` session whose local working tree was at commit `62146dc0` (~2026-05-12) — **before THR-415 shipped (2026-05-14)**. The THR-415-shipped substrate below (the `survey_completed` TickEvent shape, `hexCoords` on the event, `message` carrying the band) is derived from the THR-415 plan doc (`Docs/plans/2026-05-14-THR-415-survey-people-layer-prose-wiring.md`) and the THR-439 issue body — **not verified against shipped code**. The HexChronicle / GameView rows below were verified against the stale tree and are stable (THR-415 did not touch HexChronicle). The executor pulls fresh from `origin/main` and **must verify the THR-415-shipped rows before authoring.**

| Claim | Where it lives | Verified by Cowork |
|------|----------------|--------------------|
| HexChronicle's "THE PEOPLE" section renders `cultureProse` (or a fallback line) + `cultureMoresProse` + `factionProse` (or a fallback line), then "Factions Present" + "Souls Present" lists | `src/components/Game/HexChronicle.tsx:781–999` | ✅ (stale tree — stable, THR-415 didn't touch it) |
| `cultureProse` ← `CULTURE_LOCATION_PROSE`, `factionProse` ← `FACTION_CONTROL_PROSE`, both hex-seeded picks | `HexChronicle.tsx:291–323`, imports `:15–20` | ✅ |
| HexChronicle is `memo`'d; props are scalar/array refs; `hexCol`/`hexRow`/`seed`/`tick` already passed | `HexChronicle.tsx:117–138` | ✅ |
| HexChronicle does **not** currently receive `tickEvents` / `recentEvents` / any event prop | `HexChronicle.tsx:90–115` (`HexChronicleProps`) | ✅ |
| HexChronicle is rendered by `GameView.tsx`; GameView holds game state and already derives HexChronicle's props | `grep "HexChronicle" src` → `src/components/Game/GameView.tsx` | ✅ |
| `survey_completed` TickEvent carries `message` (the composed band), `hexCoords: { col, row }`, `tick`, `type: 'survey_completed'` | `src/types/gameState.ts` union member + builder (THR-415) | ⚠ **derived from THR-415 plan §3.2 — executor must verify the event shape, esp. the `hexCoords` field name** |
| `survey_completed` events land in `state.tickEvents` → roll into `state.recentEvents` (cap `MAX_RECENT_EVENTS` = 100) | `src/types/gameState.ts` (THR-415 plan §3.2 / §8) | ⚠ **derived from THR-415 plan — executor must verify which array GameView can read** |
| `hexRevelation` is already a HexChronicle prop (`hexRevelation?.people`, `hexRevelation?.ruins`) | `HexChronicle.tsx:113–114, 137, 1121` | ✅ |

**Substrate that does NOT exist and IS built here:** the `surveyPeopleProse` derivation in `GameView.tsx` (most-recent `survey_completed` band for the displayed hex), the new `surveyPeopleProse?: string` + `surveyPeopleProseTick?: number` props on `HexChronicleProps`, and the conditional swap in HexChronicle's "THE PEOPLE" prose block.

**No high-impact file from the CLAUDE.md list is touched.** `HexChronicle.tsx` and `GameView.tsx` are components, not in the ≥100-importer list. No Blast Radius section required.

## 2. The design fork — settled (brainstorm record)

THR-415 plan §2 Option C deferred this issue precisely because the live-vs-snapshot model needed deciding. Three questions, settled:

**Q1 — How does HexChronicle get the event?** Three shapes:
- *A — pass the whole `recentEvents` array as a prop.* Rejected. HexChronicle is `memo`'d; `recentEvents` changes nearly every tick (THR-415 and every other event source push to it), so the array reference churns constantly and HexChronicle re-renders every tick even when the displayed hex's survey band has not changed. Defeats the memo boundary.
- *B — pass a derived `surveyPeopleProse: string | undefined` prop.* **Chosen.** GameView already derives every HexChronicle prop from game state. It computes the most-recent `survey_completed` event whose `hexCoords` match the displayed hex and passes just that event's `message` (plus its `tick` for the attribution caption — Q3). A `string` prop only changes reference when the band actually changes → memo boundary stays clean. This mirrors how GameView already derives `cultures`, `factions`, `controlEffects` for HexChronicle.
- *C — generate inside HexChronicle at render time by re-running `composeSurveyPeopleProse`.* Rejected. The composer is engine-side and consumes the seeded resolution `rng`; re-running it at render time is non-deterministic relative to the cast and duplicates engine logic in the UI. THR-415 §2 already rejected this for the same reason.

**Q2 — Swap or augment?** The issue says "swap to the `survey_completed` event's `message`." Settled: the dynamic band **replaces the `cultureProse` + `factionProse` prose paragraphs** (and their fallback lines) in "THE PEOPLE". It does **not** touch `cultureMoresProse`, the "Factions Present" list, or the "Souls Present" list — those are live structured reference, not narrative prose, and the player still wants them current. So: surveyed hex → dynamic band paragraph + (unchanged) mores + lists; un-surveyed hex → static `cultureProse`/`factionProse` paragraphs + (unchanged) mores + lists. One prose block swaps; everything else is untouched.

**Q3 — Live view vs. cast snapshot — the honest model.** The `survey_completed` band is a **point-in-time snapshot** ("what Survey showed you at tick 40"); HexChronicle is otherwise a **live reference view**. THR-415 §2 said keeping them separate is the honest model — so when the dynamic band is shown, HexChronicle must **make the snapshot legible**: a small, dim attribution caption beneath the band — *"— surveyed, turn 40"* (turn = the event's `tick`). This is the one genuine design addition in THR-439, and it resolves the staleness ambiguity THR-415 flagged: the player is never confused about whether the band is current, because it says when it was taken. Without the caption, a stale band silently masquerades as live state — exactly the failure §2 Option C was deferred to avoid.

## 3. Engine pillar — N/A

THR-439 reads existing GameState (`survey_completed` events already produced by THR-415). No engine module, no tick phase, no graph mutation, no new constant on the engine side. **N/A with rationale:** the producing system shipped in THR-415; THR-439 is pure consumption.

## 4. Content pillar — N/A

No new prose, no new content table. The dynamic band content is authored by THR-415 (`composeSurveyPeopleProse`) and enriched by THR-440 (named-mortals clause). The static fallback prose (`CULTURE_LOCATION_PROSE`, `FACTION_CONTROL_PROSE`) already exists and is unchanged. **N/A with rationale:** THR-439 displays content others author; it authors none. The one new user-visible string — the attribution caption format — is UI chrome (§5), not prose content.

## 5. UI pillar

### 5.1 `GameView.tsx` — derive the prop

GameView already computes HexChronicle's props for the selected hex. Add a derivation: from `state.recentEvents` (or `tickEvents` — whichever GameView already reads; verify §1), find `survey_completed` events with `hexCoords.col === selectedHexCol && hexCoords.row === selectedHexRow`, take the most-recent by `tick`, pass its `message` and `tick`:

```ts
const surveyPeopleEvent = useMemo(() => {
  // most-recent survey_completed event for the displayed hex, or undefined
  let latest: TickEvent | undefined;
  for (const ev of state.recentEvents) {
    if (ev.type !== 'survey_completed') continue;
    if (ev.hexCoords?.col !== hexCol || ev.hexCoords?.row !== hexRow) continue;
    if (!latest || ev.tick > latest.tick) latest = ev;
  }
  return latest;
}, [state.recentEvents, hexCol, hexRow]);
```

Pass `surveyPeopleProse={surveyPeopleEvent?.message}` and `surveyPeopleProseTick={surveyPeopleEvent?.tick}`. **Memo note:** this `useMemo` keys on `state.recentEvents` — which churns per tick — so the memo recomputes per tick, but it returns a *stable event reference* (or `undefined`) unless a new matching event appears. The two scalar props passed to HexChronicle therefore only change reference when the band actually changes → HexChronicle's `memo` is not defeated. (If profiling later shows the per-tick `useMemo` recompute is costly — it is an O(100) scan — switch the dependency to a survey-events-only selector. Not needed for v1; `recentEvents` is capped at 100.)

### 5.2 `HexChronicleProps` — two new optional props

```ts
interface HexChronicleProps {
  // … existing …
  /** Most-recent survey_completed band for this hex (THR-439). Undefined ⇒ hex not surveyed ⇒ static fallback. */
  surveyPeopleProse?: string;
  /** Tick the survey band was composed (THR-439) — drives the snapshot attribution caption. */
  surveyPeopleProseTick?: number;
}
```

Both optional — HexChronicle renders identically to today when they are absent (no behaviour change for any non-GameView caller, e.g. styleguide/CMS previews).

### 5.3 `HexChronicle.tsx` — the swap in "THE PEOPLE"

In the "THE PEOPLE" section (`HexChronicle.tsx:781–999`), replace **only** the `cultureProse`/`factionProse` prose-paragraph block (`:793–819`) with a conditional:

```tsx
{surveyPeopleProse ? (
  <>
    <p className="chronicle-prose drop-cap" style={proseStyle}>
      {renderProseWithIPK(surveyPeopleProse)}
    </p>
    {surveyPeopleProseTick != null && (
      <p style={surveyAttributionStyle}>— surveyed, turn {surveyPeopleProseTick}</p>
    )}
  </>
) : (
  <>
    {/* existing static cultureProse / factionProse paragraphs + their fallback lines — unchanged */}
  </>
)}
```

- `cultureMoresProse` (`:804–808`), "Factions Present" (`:822–852`), and "Souls Present" (`:855–998`) stay **exactly as they are**, outside the conditional.
- `surveyAttributionStyle`: a small dim caption — `fontFamily: var(--font-body)`, `fontSize: var(--text-xs)`, `color: var(--text-muted)`, `fontStyle: italic`, `margin: '-8px 0 16px 0'`, `textAlign: 'right'` (executor's call on exact values — match existing chronicle caption conventions; the "quote-attr" class at `:1108` is a precedent).
- `renderProseWithIPK` is already imported (`:27`) and used on soul prose (`:1028`) — running the survey band through it keeps sphere/IPK keywords interactive if the band contains any. Low-risk; if the band never contains IPK keywords it is a no-op.
- The band is a single composed string (mood + faction + named-mortals sentences from THR-415/THR-440). Render it as one `<p>`. THR-415 already guarantees the band is a grammatical, capitalised, terminally-punctuated Threadbare paragraph.

### 5.4 Narration

The "THE PEOPLE" section has a narration ref (`peopleRef`, `:144`, `:789`). The dynamic band sits inside that ref's subtree, so the existing "Narrate The People" button picks it up automatically — no narration wiring needed. Verify in the browser pass that narrating the people chapter reads the dynamic band.

### 5.5 Fail-soft posture (NFP #4)

| Failure surface | Behaviour | Why |
|-----------------|-----------|-----|
| No `survey_completed` event for this hex | `surveyPeopleProse` is `undefined` → static `cultureProse`/`factionProse` path renders | Un-surveyed hexes read exactly as today |
| `survey_completed` event exists but `message` is empty string | `surveyPeopleProse` is `''` → falsy → static path renders | An empty band should never blank the people layer |
| `surveyPeopleProseTick` undefined but `surveyPeopleProse` present | band renders, attribution caption omitted | Band without a tick is still worth showing; just no caption |
| `hexCoords` missing on the event (THR-415 shape divergence) | the GameView filter `ev.hexCoords?.col !== hexCol` excludes it → static path | Optional-chained — never throws |
| HexChronicle rendered by a non-GameView caller (styleguide, CMS) that passes neither prop | both `undefined` → static path → identical to today | Props are optional; zero behaviour change for other callers |

### 5.6 Determinism (NFP #3)

THR-439 introduces no PRNG. The band is composed deterministically upstream (THR-415); GameView's selection is a pure `max-by-tick` over a filtered array; HexChronicle's render is pure over props. No `Math.random`, no `Date.now`.

### 5.7 Performance budget (NFP #7)

GameView's `useMemo` is an O(`recentEvents`) = O(≤100) scan per tick while a hex is selected — negligible. HexChronicle gains one conditional branch and (when surveyed) one extra `<p>` — no new render cost. The `memo` boundary is preserved (§5.1).

## 6. Constants table (NFP #1)

THR-439 adds **no engine constants**. The one tunable surface is the attribution caption style (`surveyAttributionStyle`) — a CSS object using existing design tokens (`--text-xs`, `--text-muted`, `--font-body`), not magic numbers. The caption *text format* (`"— surveyed, turn {tick}"`) is a single inline template; if the executor prefers it as a named constant (`SURVEY_ATTRIBUTION_PREFIX`) co-located in `HexChronicle.tsx` or a UI constants file, that is acceptable and mildly preferred for NFP #1, but not required for a one-use UI string.

## 7. Tracing (NFP #2)

THR-439 emits **no new traces** — it is a pure UI consumer. Inspectability is already covered: the `survey_prose_composed` trace (THR-415, enriched by THR-440) shows the band was composed; the `survey_completed` TickEvent shows in the DebugPanel event log. The closeout's `__DEBUG` assertion (§9) is how THR-439's own wiring is proven — that the event the trace describes actually reaches HexChronicle.

## 8. Wiring section

| Wiring point | How THR-439 connects |
|--------------|----------------------|
| Orchestrator phase | None — pure UI consumption of existing GameState |
| Engine module | None — N/A (§3) |
| GameState flow | Reads `state.recentEvents` (or `tickEvents`) `survey_completed` events in `GameView.tsx`; no writes |
| GameView → HexChronicle | New derivation in `GameView.tsx` → two new optional props `surveyPeopleProse` / `surveyPeopleProseTick` on `HexChronicleProps` |
| UI component | `HexChronicle.tsx` "THE PEOPLE" section — conditional swap of the `cultureProse`/`factionProse` prose block (§5.3); structured lists untouched |
| Notification | None — THR-415 already routes `survey_completed` toasts; THR-439 only changes the chronicle render |
| Traces | None new (§7) |
| Debug visibility | Existing — `survey_completed` event + `survey_prose_composed` trace in DebugPanel; THR-439 wiring proven via `__DEBUG` assertion (§9) |
| Player controls | None new — Survey is already in the action drawer (THR-398); narration "The People" button auto-covers the dynamic band (§5.4) |
| Content tables | None — `CULTURE_LOCATION_PROSE`/`FACTION_CONTROL_PROSE` unchanged, still the fallback |

**Update `Docs/plans/wiring-checklist.md`** — add "HexChronicle people-layer reads `survey_completed` band, falls back to static tables" under the chronicle/revelation surface, and note the GameView event-derivation → optional-prop pattern as a covered way to feed events into a `memo`'d panel.

## 9. Closeout evidence required

THR-439 touches the UI pillar (`HexChronicle.tsx`, `GameView.tsx`). Per Definition of Done §Browser-verify, the closing commit body or Linear completion comment **must** include:

1. **Screenshot at 1920×1080** of HexChronicle's "THE PEOPLE" section showing the **dynamic band + attribution caption** after firing Survey on a populated hex — and (ideally a second shot, or the same hex pre-survey) the **static fallback** for an un-surveyed hex, to prove both branches. HexChronicle is DOM (not WebGL) → Playwright `preview_resize(1920,1080)` → `preview_screenshot`.
2. **Console output** via `mcp__playwright__browser_console_messages` (errors + warnings) — fenced block; `(no errors or warnings)` if clean.
3. **`__DEBUG` state assertion** — fire Survey on a hex (via the action drawer or `window.__DEBUG.fireAction`), then confirm: (a) a `survey_completed` event for that hex is in `recentEvents`, and (b) opening that hex's HexChronicle shows the event's `message` as the people-layer band. Use the `__DEBUG` bridge (`getTraces`/event inspection) per CLAUDE.md §Debug Bridge; `window.__DEBUG.gotoAgent` or hex selection to open the chronicle.

**Not required:** 30-tick CLI smoke — THR-439 touches no file under `src/engine/`, `src/types/gameState.ts`, or any tick-loop/orchestrator/phase file. CLI smoke is engine-change-gated; THR-439 is UI-only. State this exemption explicitly in the closing comment.

## 10. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | **PASS** | No engine constants; caption style uses design tokens. Optional `SURVEY_ATTRIBUTION_PREFIX` named constant suggested (§6) — mild plus, not required |
| 2 | Inspectability | **PASS** | No new trace needed — THR-415's `survey_prose_composed` trace + `survey_completed` event already cover it; THR-439 wiring proven via `__DEBUG` (§9) |
| 3 | Determinism | **PASS** | No PRNG; GameView selection is pure max-by-tick; HexChronicle render is pure over props (§5.6) |
| 4 | Fail-soft | **PASS** | §5.5 table — missing event / empty message / missing tick / missing `hexCoords` / non-GameView caller all degrade to the static path or a graceful partial render; optional-chained throughout |
| 5 | Narrative over mechanical | **PASS** | Swaps generic table prose for the hex-specific Survey band; the attribution caption makes the snapshot honest rather than masquerading as live state |
| 6 | Additive over destructive | **PASS** | Two **optional** props; the static path is preserved verbatim as the fallback branch; `cultureMoresProse` + both structured lists untouched. No caller breaks; no behaviour removed |
| 7 | Performance budget | **PASS** | O(≤100) memo scan per tick while a hex is selected; one conditional + one `<p>` in render; `memo` boundary preserved (§5.1) |

## 11. Vision audit

- **`Vision/02-non-negotiables.md` §3 (prose-first UI):** directly served — THR-439 replaces generic table prose with the hex-specific Survey band in the chronicle. No drift.
- **`Vision/00-north-star.md` (mortal-loop bridge):** THR-398 §3.2 framed Survey's people layer as the mortal-loop on-ramp. THR-439 is what makes that band *land in the chronicle* — the surface the player actually dwells in — not just flash by in the event feed. The attribution caption ("surveyed, turn 40") reinforces that Survey is an *act with a result you carry forward*, consistent with the action-as-narrative framing. No Vision premise contradicted or updated; no Vision edit in this ticket's scope.

## 12. Coordination with THR-440

THR-440 enriches the `survey_completed` band content (named-mortals sentence). THR-439 displays the band. **File-level parallel-safe:**

- THR-439 touches: `HexChronicle.tsx`, `GameView.tsx`, `HexChronicle.test.tsx`, `wiring-checklist.md`.
- THR-440 touches: `surveyProseComposer.ts`, `survey-prose-tables.ts`, `trace.ts`, `surveyProseComposer.test.ts`, `wiring-checklist.md`.
- **Only overlap: `Docs/plans/wiring-checklist.md`** — both add a one-line addendum. Trivial, non-conflicting in practice; if both land close together one rebases the one-liner. Not a code mutex.
- Logical note: THR-439 renders whatever the band contains, so it works whether THR-440 has landed or not. Land order does not matter.

## 13. Coordination block

- **Suggested model:** `model:sonnet` — UI wiring with one genuine design call already settled in this plan (the snapshot-attribution caption, §2 Q3) plus memo-boundary care in `GameView.tsx` and a mandatory browser-verify closeout. Mechanical enough to be near-haiku, but the `memo` boundary reasoning and the two-branch browser proof push it to sonnet.
- **Parallel-safe with:** [THR-440](https://linear.app/threadbare/issue/THR-440) (sibling deferral — only `wiring-checklist.md` one-liner overlap, §12), [THR-425](https://linear.app/threadbare/issue/THR-425) (Linear infra — no overlap).
- **Mutex with:** none currently on the board. **Executor must check the live board** for any other in-flight issue touching `src/components/Game/HexChronicle.tsx` or `src/components/Game/GameView.tsx` before claiming — `GameView.tsx` is a busy file and the most likely collision point.
- **Codex review:** yes — touches `GameView.tsx` (a busy integration file) and `HexChronicle.tsx`; the PR-gated review Action will pick it up.
- **Files to touch:** `src/components/Game/GameView.tsx` (derive `surveyPeopleProse` / `surveyPeopleProseTick`, pass as props), `src/components/Game/HexChronicle.tsx` (add the two optional props to `HexChronicleProps`; conditional swap in "THE PEOPLE" §5.3; add `surveyAttributionStyle`), `src/components/Game/__tests__/HexChronicle.test.tsx` (extend — see §14), `Docs/plans/wiring-checklist.md` (one-line addendum).
- **Done when:** §14 checklist passes.

## 14. Done when

- [ ] **First step: verify the §1 stale-tree substrate rows** against shipped `origin/main` code — the `survey_completed` event shape (esp. `hexCoords` field name and `message`), and which array (`recentEvents` vs `tickEvents`) GameView reads. Note any divergence in the closing comment.
- [ ] `GameView.tsx` derives the most-recent `survey_completed` event for the displayed hex (filter by `hexCoords`, max by `tick`) and passes `surveyPeopleProse` + `surveyPeopleProseTick` to HexChronicle
- [ ] `HexChronicleProps` gains `surveyPeopleProse?: string` and `surveyPeopleProseTick?: number` — both optional
- [ ] HexChronicle "THE PEOPLE" section: when `surveyPeopleProse` is present, renders it (via `renderProseWithIPK`) as the lead people-layer paragraph + a dim attribution caption "— surveyed, turn {tick}"; when absent, renders the existing static `cultureProse`/`factionProse` paragraphs unchanged
- [ ] `cultureMoresProse`, "Factions Present" list, and "Souls Present" list are **untouched** in both branches
- [ ] `memo` boundary preserved — the two new props are scalar and only change reference when the band changes (§5.1)
- [ ] Non-GameView callers (styleguide / CMS) that pass neither prop render identically to today
- [ ] `src/components/Game/__tests__/HexChronicle.test.tsx` extended — covers: dynamic band renders when `surveyPeopleProse` present; attribution caption shows the tick; static fallback renders when prop absent; static fallback renders when `surveyPeopleProse` is `''`; structured lists render in both branches
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] `npx vite build` succeeds
- [ ] Browser evidence per §9: 1920×1080 screenshot(s) showing both the dynamic band + caption (surveyed hex) and the static fallback (un-surveyed hex); console output (errors+warnings) fenced block; `__DEBUG` assertion proving a `survey_completed` event reaches HexChronicle
- [ ] CLI-smoke exemption stated in the closing comment (UI-only change — no `src/engine/` file touched)
- [ ] `Docs/plans/wiring-checklist.md` updated
- [ ] `Fixes THR-439` in the closing commit body

---

*Filed by Cowork (`keep-work-flowing`), 2026-05-14. Deferral child of [THR-398](https://linear.app/threadbare/issue/THR-398) via [THR-415](https://linear.app/threadbare/issue/THR-415) §12.1, project Content Architecture. This plan IS the "own small design pass" THR-415 §2 Option C deferred for the staleness model — settled in §2 Q3 (the snapshot-attribution caption). Three-pillar: Engine N/A (§3), Content N/A (§4), UI primary (§5). Vision audit run inline (§11). Authored against a stale local tree — see the §1 caveat; executor verifies THR-415-shipped substrate first.*
