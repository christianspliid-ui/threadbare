> **title:** `Player-cast outcome variance with a safety floor — THR-728`
> **linear_issue:** THR-728
> **author:** `Claude Code`
> **created:** 2026-07-24
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Player-cast outcome variance with a safety floor — THR-728

*Player action cards roll on the same outcome ladder mortals use — but a paid cast can never outright fail: the worst outcome is success-at-cost, "the miracle lands crooked," and the Divine Receipt (THR-727) becomes a tense reveal instead of a report.*

## Why this is load-bearing

Every player cast currently auto-succeeds (`unifiedActionResolution.ts` — the `source === 'player'` early-return returns `{ outcome: 'success', probability: 1 }` before any capability, difficulty, or shaper is consulted). The Divine Receipt shipped (THR-727, Done 2026-07-23) and can render all six outcome bands with authored frame lines — but for player casts only two bands are reachable (`neutral`, and `surge` never, since no roll happens at all). Meanwhile **82 of 136 ascendant-castable templates carry authored positive step difficulties (0.1–0.6)** that the player branch silently discards — content authors have been pricing risk into cards for months and the engine throws the price away. Christian's verdict (chat, 2026-07-24): **"Yes, with a safety floor"** — casts roll, but a paid cast never hard-fails; worst case is success-at-cost. This changes a rule of play, so `Docs/canon/rulebook.md` §4 is updated in this ticket's scope.

## Substrate inventory

This plan **extends** existing, ACTIVE substrate at every point; nothing green-field:

- **The resolution ladder + floor-upgrade mechanism** — `unifiedActionResolution.ts` already implements exactly the needed shape for NPCs: `FLOOR_UPGRADE_OUTCOME: OutcomeType = 'success_at_cost'` (line ~159, THR-571) upgrades sub-floor failing rolls to success-at-cost, and `isStepSuccess('success_at_cost') === true` (`types/unifiedAction.ts:1152`) means **success ops still run** on an upgraded outcome. The player floor is the same transform with a different predicate (source-based, unconditional).
- **Authored difficulties** — grep evidence (esbuild-bundled probe over `UNIFIED_ACTION_TEMPLATES`, 2026-07-24): 136 templates carry `actorAffinities` including `'ascendant'`; 82 have max step difficulty > 0 (range 0.1–0.6: e.g. `hex.rend_earth:0.6`, `hex.seed_life:0.5`, `artifact.curse:0.35`, `loc.ward:0.25`); 54 are all-zero (the `divine.*` intimacy verbs, `invest.*`, observation). The existing rule "difficulty 0 always succeeds" (line ~245) is preserved and becomes the per-template opt-out.
- **Ascendant capability input** — "Ascendants use the same prerequisite system as agents" (load-bearing decision); THR-503 persisted `domainAffinities` on the ascendant node and `getAscendantDomainAffinities` is live. `computeCapability(graph, ascendantId, step.reach)` is the same call the NPC path makes.
- **The display surface** — THR-727's `DivineReceiptModal` + toast tier are band-keyed; `RECEIPT_FRAME_LINES` in `src/data/receipt-content.ts` is **already authored for all six bands** (verified on `main`), including `strained` ("It held, but the world charged you for the holding") and `surge`. Zero receipt changes needed.
- **Consequence machinery** — `computeOutcomeConsequence` (quintessence deltas, significance boosts, complication severity) applies per outcome tier and flows into `aftermathChanges` → the receipt, unchanged.

## Engine pillar

### Systems design

One edit site: `resolveUncontestedStep` in `src/engine/unifiedActionResolution.ts`.

1. **Master switch:** `PLAYER_CAST_VARIANCE_ENABLED` (new constant). When `false`, the current early-return behavior is restored verbatim — a one-flag revert (kill criterion below).
2. **Replace the `source === 'player'` auto-success early-return** with fall-through to the shared rolled path. The pre-existing `step.difficulty === 0` early-return (above it) is untouched — zero-difficulty templates (all `divine.*` soul-work) remain guaranteed. This is the thematic line: *workings on the world can land crooked; whispers into a soul do not.*
3. **Player exclusions inside the shared path:** push (spends actor quintessence pre-roll) and resist (post-roll Q-spend downgrade) are both **skipped** for `source === 'player'` (`PLAYER_CAST_PUSH_ENABLED = false` constant). With an unconditional floor, resist is redundant, and push's quintessence economy belongs to mortals; opening it to the ascendant is a separate design if ever wanted.
4. **Player safety floor (the core change):** after the existing scale-floor logic produces `result`, if `action.source === 'player'` and the outcome is `failure` or `critical_failure`, upgrade to `PLAYER_CAST_OUTCOME_FLOOR` (`'success_at_cost'`) and execute `step.onSuccess`. Mirrors the THR-571 `floorUpgradeApplied` transform one block above it; sets a `playerFloorApplied` flag surfaced in the resolution trace (`[player-floor↑]` in the summary line). `critical_success` and `near_miss` pass through untouched — the full upside of the ladder is live.

Reachable bands for player casts after this change: `surge`, `neutral`, `fortunate` (near-miss), `strained` (success-at-cost, incl. floored failures). `setback`/`catastrophe` stay unreachable by construction — their frame lines remain for a future full-ladder variant (declined for v1 by user verdict).

### Graph nodes / edges

None. No new node or edge types; capability reads existing ascendant-node state (THR-503).

### Tick phases

No new phase. `resolveUncontestedStep` runs inside the existing unified-action progress/resolution phases; only its internal branching changes.

### Resolution logic

Probability comes from the shared resolver exactly as for NPCs: capability (ascendant, per step reach) vs authored step difficulty, shapers included, scale floors included. The only player-specific deltas are the two exclusions (push/resist) and the terminal floor. No refunds: the floor guarantees the effect lands, so the essence always bought something (settled with Christian — the "safety floor" option explicitly traded refund mechanics away). Focus/Recede buffs (THR-416) are untouched — they act at dispatch (cost, rarity tier) and are orthogonal to the roll.

### PRNG callouts

No new PRNG. Player casts now **consume draws from the existing per-resolution rng stream** that they previously skipped — same-seed replays diverge across this change (build-boundary divergence, acceptable; within a build, same seed + same inputs = same outputs holds). No `Math.random()`.

## Content pillar

### Encounter templates

None modified structurally. A **difficulty audit pass** over the 82 positive-difficulty templates: spot-check that authored values sit in sane bands per rarity tier (guideline table below, advisory not enforced — authored intent wins). The 54 zero-difficulty templates are **deliberately left at 0** in v1 (guaranteed casts); any future re-pricing is per-template tuning, not code.

| Rarity tier | Suggested difficulty band |
|---|---|
| 1 (common) | 0.10–0.25 |
| 2 | 0.20–0.40 |
| 3 (Mythic) | 0.30–0.50 |
| 4 | 0.40–0.65 |

> **THR-998 (2026-08-12) — this table is cosmetic for most of the slot list, and was already cosmetic when it was written.** `applyScaleDifficultyAdjust` caps authored difficulty at `capability − MIN_PROBABILITY_BY_SCALE[scale]`, which for a fresh god is **0** at `personal` and `local` — 85% of the actor-target slot list. Every band above therefore resolves identically there: pricing a tier-4 card at 0.65 rather than 0.10 changes nothing a player can observe. The bands do bite at `regional` and `cosmic`, and they progressively bite at `local` as `reachPractice` walks a god's capability up, so this is **advisory guidance for authored intent and for the deepened-god end of the curve — not a lever on a fresh god's odds**.
>
> This is left as guidance rather than re-grounded on the new signal deliberately. Re-pricing templates to chase the effective number would burn authored intent for no mechanical gain (the THR-736 anti-pattern), and the effective number is not a per-template property at all — it is a function of the reading god's capability, so no static table can express it. THR-998 fixed the *card* (it now reports the difficulty that reaches the roll, and names the scale where the floor capped the price away) and changed no template price and no cut-point.

### Prose tables

None. `RECEIPT_FRAME_LINES` covers all six bands already (verified). `OUTCOME_BAND_WORDS` covers all bands. Success-at-cost consequence prose rides the existing consequence machinery.

### Attachment content

N/A — no attachment templates touched.

### Data tables

New constants file `src/data/player-cast-constants.ts` (table below). Rulebook: `Docs/canon/rulebook.md` §4 (divine actions) updated in the same PR — the "player casts always succeed" rule becomes "player casts on zero-difficulty templates always succeed; positive-difficulty castings roll with a success-at-cost floor," tagged `[IMPL]` once shipped.

## UI pillar

*Screenshot tool: **Playwright** (DOM surfaces — focused card + receipt modal; no WebGL changes).*

### Player-facing display

The rule change must be legible **before** the cast, not discovered in the receipt:

1. **Risk hint on the focused card** — when a player-castable template's max step difficulty > 0, the focused-card effect block (THR-610 surface in `ActionDrawer.tsx`) gains one line rendering the risk qualitatively via `RISK_HINT_THRESHOLDS`: difficulty < 0.25 → "steady working", < 0.45 → "uncertain working", else "perilous working" — plain-register words per THR-609, no percentages (taste profile: data in prose). Zero-difficulty cards show nothing (unchanged face).
   > **Superseded by THR-998 (2026-08-12).** The cut-points and words are unchanged, but they are applied to the **effective** difficulty (`effectiveCastDifficulty`, `src/engine/playerCastReadout.ts`) rather than the authored one, and where the per-scale floor has capped the authored price away the card names the template's scale instead of claiming a risk (`SCALE_HINT_LINES`). Bucketing the authored number made two cards with identical odds read "steady" and "perilous". Zero-difficulty cards still show nothing.
2. **Receipt** — no changes; bands flow automatically, `strained` receipts now occur and read "It held, but the world charged you for the holding."
3. **Chronicle/toast** — band accents flow automatically via the THR-727 plumbing.

### Design-system conformance (required)

- Risk hint uses existing effect-block typography tokens (`var(--text-tertiary)`, `var(--font-body)`) inside the existing `action-effect-block` container — no new container, no new colors beyond band tokens.
- Viewport contract unaffected (one added line inside an existing bounded block).

### Event notifications

No new event types. Existing `player_action_receipt` events now carry varied bands.

### Debug inspection (DebugPanel)

- Resolution traces gain the `[player-floor↑]` marker and `playerFloorApplied` field — visible in the existing trace viewer.
- `__DEBUG.listPlayerReceipts()` (shipped) now shows varied `band` values — the headless assertion surface for this change.

### Visual presence (HexMapV2)

N/A — no map-layer changes.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|------------------|
| `unifiedActionResolution.ts` (edit) | existing resolution phases | — | none new | `resolution.input` gains `playerFloorApplied` | trace viewer; `__DEBUG.getTraces()` |
| `data/player-cast-constants.ts` (new) | — | — | — | — | — |
| `ActionDrawer.tsx` (edit: risk hint) | — | focused-card effect block | reads template difficulty | — | DOM testid `action-risk-hint` |
| `Docs/canon/rulebook.md` §4 (edit) | — | — | — | — | — |

Prose pipeline: unchanged. Player controls: unchanged (the cast flow is identical; only its resolution varies).

## Constants table

All in `src/data/player-cast-constants.ts` (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `PLAYER_CAST_VARIANCE_ENABLED` | `true` | Master switch; `false` restores auto-success verbatim (one-flag revert) |
| `PLAYER_CAST_OUTCOME_FLOOR` | `'success_at_cost'` | Worst outcome a paid player cast can produce |
| `PLAYER_CAST_PUSH_ENABLED` | `false` | Player casts never push/resist (Q economy stays mortal) |
| `RISK_HINT_THRESHOLDS` | `[0.25, 0.45]` | Difficulty cut-points for steady / uncertain / perilous wording |
| `RISK_HINT_WORDS` | `['steady', 'uncertain', 'perilous']` | The three qualitative risk words on the focused card |

## Tracing

Extend the existing `resolution.input` trace (registered type in `src/types/trace.ts` — same Omit-collapse caution as THR-727: register the field, don't duck-type):

```ts
// resolution.input (extended) — playerFloorApplied added
interface ResolutionInputTrace {
  category: 'resolution.input';
  // ...existing fields unchanged...
  playerFloorApplied?: boolean; // true when a player cast's failure was upgraded to the floor
}
```

Summary line gains `[player-floor↑]` when applied (mirrors the existing `[floor↑]` marker).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `computeCapability` returns 0 / ascendant node lacks capability inputs | Roll proceeds at capability 0 → scale floor + player floor still guarantee success-at-cost; never a crash, never a hard fail |
| Ascendant node missing entirely | Existing resolver guards return failure → player floor upgrades to success_at_cost; trace records it |
| `PLAYER_CAST_VARIANCE_ENABLED = false` | Exact pre-change behavior (auto-success early-return) |
| Template difficulty undefined | Treated as 0 (existing `?? 0` semantics) → guaranteed cast |
| Risk-hint rendering with missing difficulty | Hint omitted; card face unchanged |
| Trace field missing on old snapshots | Optional field; consumers null-safe |

## Interface impact

Touched subsystem (Encounters & Dilemmas core resolution) is ⚪ UNAUDITED; the THR-727 rows already registered in `scripts/interface-contracts.ts` cover the aftermath→receipt contract. Per audit-on-touch:

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `UnifiedAction.outcome` ladder for player-sourced actions | **extend** (player casts now produce `success_at_cost` / `near_miss` / `critical_success`, not only `success`) | `resolveUncontestedStep` → Divine Receipt (THR-727 rows; update row notes, no new row) |
| `aftermathSummary` → receipt band | **preserve** | unchanged plumbing; band values now vary |
| Step difficulty (authored) → player resolution | **extend** (previously produced-and-dropped for player casts; now consumed) | `unified-action-templates.ts` → `resolveUncontestedStep`; register this row in `scripts/interface-contracts.ts` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it strengthens "the player has to want to see what happens next" (the receipt becomes a reveal) and keeps mechanics surfacing through prose (qualitative risk words, band frame lines; no percentages on player surfaces).
- [x] No Vision edit required — no premise is changed.

## Rulebook impact

- [x] This plan **changes a rule of play** (player action resolution): the rulebook update is **in this ticket's scope** — `Docs/canon/rulebook.md` §4 is edited in the same implementation PR and the section re-verdicted.
- [x] The specific edit: "player casts always succeed" → "zero-difficulty castings always succeed; positive-difficulty castings roll on the outcome ladder with a success-at-cost floor (no hard failure, no refunds)." Tag `[IMPL]` on ship.

> Brainstorm companion: `Docs/plans/2026-07-24-thr-728-player-cast-variance-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Five constants incl. a one-flag master revert; per-template risk is the authored difficulty number |
| 2. Inspectability | PASS | `playerFloorApplied` trace field + `[player-floor↑]` marker; receipts show band; `__DEBUG.listPlayerReceipts()` asserts headlessly |
| 3. Determinism | PASS with note | No new PRNG; player casts now consume existing rng draws they previously skipped — same-seed replays diverge across the build boundary only |
| 4. Fail-soft | PASS | Six-row table; the floor itself is a fail-soft (incapable ascendant still progresses) |
| 5. Narrative over mechanical perfection | PASS | Risk in prose words, outcome in band frame lines; zero-difficulty soul-verbs stay certain as a thematic statement |
| 6. Additive over destructive | PASS with note | The auto-success early-return is removed (behavior change by design, user-verdicted); revert is one flag |
| 7. Performance budget | PASS | Player casts add one shared-resolver call per step — a handful per session |

## Done when

- [ ] A player cast of a positive-difficulty template (e.g. `hex.rend_earth`, difficulty 0.6) produces varied outcomes across seeds: at least `strained` (floored or rolled success-at-cost) and `neutral`/`surge` observable via `__DEBUG.listPlayerReceipts()` band values; `setback`/`catastrophe` never occur for player casts.
- [ ] A zero-difficulty player cast (any `divine.*`) still always succeeds (band `neutral`/`surge` only).
- [ ] `PLAYER_CAST_VARIANCE_ENABLED = false` restores auto-success (test asserts the early-return path).
- [ ] Push/resist never trigger for `source === 'player'` (test).
- [ ] Focused card shows the qualitative risk line for positive-difficulty templates and nothing for zero-difficulty ones (Playwright DOM assertion + screenshot at 1920×1080).
- [ ] `Docs/canon/rulebook.md` §4 updated in the same PR; wiki page(s) matching changed sources updated or `Wiki-freshness-exempt` justified (check `public/wiki-manifest.json` — the divine-actions manual page documents guaranteed success and must be corrected).
- [ ] Engine smoke: 30-tick CLI run clean; `npm test`, `npx vite build`, typecheck ratchet zero net-new; `npm run check:generated-freshness` LAST.
- [ ] Closing commit body and PR body include `Fixes THR-728`.

## Coordination block

**Suggested model:** opus — single-file engine surgery in the densest resolution module plus a rulebook rewrite; advisory only.

**Parallel-safe with:** issues not touching `unifiedActionResolution.ts`, `ActionDrawer.tsx`, or the rulebook.

**Mutex with:** any issue editing `src/engine/unifiedActionResolution.ts` (this plan's core edit site) or `src/components/Game/ActionDrawer.tsx`.

**Files to touch:**
- Create: `src/data/player-cast-constants.ts`, `src/engine/__tests__/playerCastVariance.test.ts`
- Edit: `src/engine/unifiedActionResolution.ts` (remove player early-return behind master switch; player floor; push/resist exclusions), `src/types/trace.ts` (`playerFloorApplied`), `src/components/Game/ActionDrawer.tsx` (risk hint line), `Docs/canon/rulebook.md` §4, `scripts/interface-contracts.ts` (difficulty-consumption row), `Docs/plans/wiring-checklist.md`

## Notes for the executor

- The player floor goes **after** the existing THR-571 scale-floor block so the two markers (`[floor↑]`, `[player-floor↑]`) stay distinguishable in traces; do not merge them.
- Verify `computeCapability(graph, ascendantId, reach)` returns a sane value for the ascendant node before relying on it (verify-the-noun). If it reads inputs the ascendant node lacks, the THR-503 persisted `domainAffinities` are the intended capability source — wire through `getAscendantDomainAffinities` rather than special-casing capability to a constant.
- Do NOT touch the receipt, `receipt-content.ts`, or band content — all bands are pre-authored; if a band renders wrong, the bug is in the outcome value, not the display.
- The 54 zero-difficulty templates stay at 0 — do not "fix" them; certainty on soul-verbs is a design statement.
- `beat.*` templates are unaffected by construction (they resolve via the beat path; and the receipt scan already excludes them).

## Intent-judge verdict

*2026-07-24 — cold-context Opus subagent; proposal `Docs/plans/.intent-proposals/thr-728-player-cast-variance.md`.*

**Verdict: Allow.** Impact class confirmed Reversible (borderline High-risk as a rules-of-play change, but the explicit user sign-off — "Yes, with a safety floor (Recommended)", chat 2026-07-24 — is present and recorded, so no user gate triggers). All 11 dimensions PASS, 0 findings. Handoff note: record `human gate satisfied via chat review 2026-07-24` in the Linear handoff comment.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-24*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | 5 named constants in `src/data/player-cast-constants.ts` incl. `PLAYER_CAST_VARIANCE_ENABLED` one-flag revert; risk-word cut-points also constants (`RISK_HINT_THRESHOLDS`) |
| 2. Inspectability | PASS | New `playerFloorApplied` trace field + `[player-floor↑]` marker registered in `trace.ts`; `__DEBUG.listPlayerReceipts()` cited as headless assertion surface |
| 3. Determinism | PASS-with-note | Plan states "no new PRNG... same-seed replays diverge across the build boundary only" — self-disclosed regression to same-seed reproducibility for player casts, acceptable per plan's own framing but not zero-cost |
| 4. Fail-soft | PASS | Six-row fail-soft table covers missing capability, missing ascendant node, flag-off, undefined difficulty, missing risk-hint data, old-snapshot trace field |
| 5. Narrative over mechanical | PASS | Qualitative risk words ("steady/uncertain/perilous"), no percentages on player surface; zero-difficulty soul-verbs stay certain as explicit thematic choice |
| 6. Additive over destructive | PASS-with-note | Core mechanism removes the `source === 'player'` auto-success early-return (a real behavior change, user-verdicted) rather than adding alongside it; mitigated by a one-flag verbatim revert switch |
| 7. Performance budget | PASS | Adds one shared-resolver call per player-cast step, reusing the existing NPC resolution path already in the tick budget — no new phase, no new per-tick sweep |

NFP AUDIT: PASS-with-notes (see rows above) [design-brief-stale]

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | All five subsections filled with real detail — exact edit site (`resolveUncontestedStep`), named constants, explicit PRNG-consumption note. |
| Content | present-and-substantive | Encounter-templates, prose-tables, attachment-content, data-tables subsections all filled (attachment marked N/A with one-line reason). |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection, visual presence (N/A-with-rationale) all present; names Playwright as the screenshot tool. |

No missing required sections. Blast Radius correctly omitted — none of the six touched files appear on the ≥100-importer list. Wiring check: yes — the Wiring table maps each module in the exact template schema. Substrate-existence check (THR-658): PASS — `## Substrate inventory` opens the plan with line-numbered citations and an esbuild-bundled template grep (82/136/54 split), cross-checked against `systems-inventory.md` (`unifiedActionResolution.ts` registered under the `unified` system group, ACTIVE); an **extends** claim supported by evidence, no duplicated subsystem.

PILLAR AUDIT: PASS

### Vision audit

Vision premises touched: `00-north-star.md` → "the player shifts probabilities... sometimes the world resolves against them" — extended (variance replaces auto-success; "against them" is now cost/complication, never hard failure — a deliberate, user-verdicted softening). `01-core-loop.md` → not referenced (resolution only; scan → encounter → aftermath rhythm unchanged). `02-non-negotiables.md` → #1 god-not-protagonist, #2 narrative-over-mechanics, #3 prose-not-numbers — confirmed; #6 additive — extended, behavior change flagged with one-flag revert. `03-design-tensions.md` → tension 4 (legibility vs. mystery) — confirmed via qualitative risk words. `taste-profile.md` → file not found in worktree; unassessed. [design-brief-stale]

Vision contradictions: No contradictions found — the north-star "sometimes resolves against them" vs. the floor is an explicit user chat verdict cited in the plan, not silent drift; "against them" is preserved via complication severity/cost.

Qualitative checks: North star — partial fit (floor caps downside, documented trade); Core loop — not implicated; Non-negotiables — intact (probability-shifting, not outcome-dictating; prose-only risk); Design tensions — handled correctly; Taste profile — not assessable (file missing).

VISION AUDIT: PASS-with-notes — softened "never hard-fail" is a documented user trade-off, not drift; taste-profile.md absent from repo, unassessed.
