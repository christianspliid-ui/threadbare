# Influence Tier Name-Map — implementation spec (Codex handoff)

**Author:** Cowork · **Date:** 2026-06-23 · **Status:** implementation-ready
**Origin:** THR-414 verdict #1 (2026-06-23) — Influence Tier stays **five integer tiers** (`InfluenceTier = 0|1|2|3|4`), each renamed to the design ladder's first five names. "Aspect" is **removed from the tier scale** and becomes a separate apex state — that apex flag is a **separate design follow-up**, out of scope here.
**Project:** Content Architecture

## Goal

Rename the five `InfluenceTier` display names in `src/data/influence-content.ts` to the canonical
design-ladder names, and update the one test that asserts the old strings. Pure data/value change —
no schema change, no new field, no engine-logic change.

## Background (read once)

The design ladder is six names: **Unaware → Curious → Recognized → Devoted → Enthralled → Aspect.**
THR-414's verdict keeps the engine's five integer tiers and assigns them the **first five** names.
The sixth name, **Aspect**, is *not* a sixth rung — it becomes a distinct apex milestone/flag,
designed separately (see "Out of scope" below). Today `TIER_NAMES[4]` happens to be `'Aspect'`; this
ticket moves tier 4 to `'Enthralled'` and removes `'Aspect'` from the tier vocabulary entirely.

The tier names are consumed **only as display strings** — every reader is `tierName: TIER_NAMES[tier]`
(retinue.ts, agentDetail.ts, GameView.tsx). No engine code branches on the string value, so the
rename is runtime-safe; the only coupling is one unit test that asserts the produced `tierName`.

## Exact change

### 1. `src/data/influence-content.ts` (lines 34–40)

Replace the `TIER_NAMES` record values:

```ts
export const TIER_NAMES: Record<InfluenceTier, string> = {
  0: 'Unaware',     // unchanged
  1: 'Curious',     // was 'Touched'
  2: 'Recognized',  // was 'Devoted'
  3: 'Devoted',     // was 'Champion'
  4: 'Enthralled',  // was 'Aspect'
};
```

Do **not** touch `TIER_MAINTENANCE`, `TIER_PROMOTION_THRESHOLDS`, or any other export in the file.
Keys stay `0|1|2|3|4`. Only the five string values change.

### 2. `src/engine/__tests__/retinue.test.ts` (test "includes tier name based on tier number")

This test builds threads at tiers 1–4 and asserts the resulting `tierName` (sorted tier-descending).
Update the four assertions to the new names:

- Line ~280: `expect(result[0].tierName).toBe('Aspect');` → `'Enthralled'` (tier 4)
- Line ~282: `expect(result[1].tierName).toBe('Champion');` → `'Devoted'` (tier 3)
- Line ~284: `expect(result[2].tierName).toBe('Devoted');` → `'Recognized'` (tier 2)
- Line ~286: `expect(result[3].tierName).toBe('Touched');` → `'Curious'` (tier 1)

Also update the local fixture array at line ~245 for consistency (it is currently unused by the
assertions but should not lie):
`const tierNames = ['', 'Touched', 'Devoted', 'Champion', 'Aspect'];`
→ `const tierNames = ['', 'Curious', 'Recognized', 'Devoted', 'Enthralled'];`

## Do NOT touch (verified non-influence string reuse)

The strings `'Touched'`, `'Devoted'`, `'Champion'` appear in unrelated systems — these are
coincidental name reuse, **not** influence tiers, and must be left alone:

- `src/types/traits.ts` (veil/heart/star trait ladders), `src/engine/tierPromotion.ts` (domain
  capability tier names), `src/data/meeting-content.ts`, `src/data/scry-content.ts`,
  `src/data/ui-content.ts`, `src/data/candidate-vignettes.ts`,
  `src/data/sustained-control-status-prose.ts` (champion badge labels).
- Component test fixtures that pass `tierName: 'Champion'` / `'Devoted'` / `'Touched'` as **mock prop
  inputs** (RetinuePanel.test.tsx, ThreadsPanel.test.tsx, ThreadDetailView.test.tsx,
  ScryOverlay.test.tsx, agentDetail-integration.test.ts, scry-integration.test.ts) — these construct
  their own literal strings and do not read `TIER_NAMES`, so they stay green regardless. Leave them.
- `src/data/__tests__/influence-content.test.ts` — only asserts `TIER_NAMES[0] === 'Unaware'`
  (unchanged) and `TIER_NAMES[4]` is defined. No edit needed; confirm it still passes.

## Out of scope (separate design follow-up)

The **"Aspect" apex flag** (mortal becomes an aspect of the god as a distinct beyond-tier-4
milestone) is a new concept with live design questions — what sets it, what it grants, how it
surfaces. It is filed as its own In-Design issue and must NOT be implemented here. This ticket only
relocates the five tier *names*.

## Coordination block (Codex handoff)

- **Parallel-safe with:** THR-476 (find-first lint — disjoint files: `scripts/`), all
  content-authoring work (does not read `TIER_NAMES` values), THR-475.
- **Mutex with:** none. Touches `src/data/influence-content.ts` (one record) and one test file —
  if another in-flight issue is editing `influence-content.ts`, sequence after it.
- **Files to touch:** `src/data/influence-content.ts` (5 values), `src/engine/__tests__/retinue.test.ts`
  (4 assertions + 1 fixture array).
- **Suggested executor:** Codex (settled-target value change + a coupled test to update).

## Done when

- `TIER_NAMES` reads `Unaware / Curious / Recognized / Devoted / Enthralled` for keys `0–4`.
- `retinue.test.ts` assertions updated to the new names; `npm test` green (the influence + retinue
  suites in particular).
- `npx tsc --noEmit` clean; `npx vite build` succeeds.
- No occurrence of `'Aspect'` remains in `src/data/influence-content.ts`.
- Closing commit body: `Fixes <this-id>`. Paste the `npm test` tail (influence + retinue suites) and
  tsc output as evidence.

## Three pillars

**Engine/data** — the `TIER_NAMES` content constant (display only; no logic change). **Content** —
the five tier display names are content-package values; this aligns them to canon. **UI** — N/A:
display strings flow unchanged through existing readers (no component, layout, or interaction change;
no new surface). Pillar table N/A-with-rationale is correct — this is a data-value alignment, not a
new feature.

## NFP

Tunability: the names are already the single named constant (`TIER_NAMES`) — this ticket just sets
correct values. Determinism / fail-soft / inspectability: unaffected (no logic touched). Additive:
this is a value edit, not a refactor.
