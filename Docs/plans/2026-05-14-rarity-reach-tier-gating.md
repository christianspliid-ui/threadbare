# Rarity → Reach-Tier Gating

**Date:** 2026-05-14
**Author:** Cowork (keep-work-flowing scheduled run)
**Linear:** THR-XXX (child of THR-390 — Action System Curation audit)
**Audit anchor:** `Docs/audits/2026-05-09-ascendant-actions-audit.md` §5 opportunity #8, §7 recommendation #6
**Status:** Ready for Dev

---

## 1. Why this exists

The THR-390 audit's recommendation #6 — the last un-filed quick/medium win from the audit's 1–6 batch (recs #1–#5, #7, #8, #9 all shipped via THR-396/397/398/399/400/401/418/419).

> "Wire rarity → reach-tier gating. Each rarity tier requires a corresponding reach tier in the action's primary reach (tier-2 actions need reach tier 1, tier-3 need reach tier 2, etc.) — gives natural difficulty progression." — audit §7 rec #6, ~half a day.

Today, an action's `rarityTier` (1–4, recurved by THR-397) is a *display* property — it colours the action card and feeds the Starter-12 reveal floor (THR-419). It is **not** a *capability* gate. A freshly-spawned ascendant with shallow Domain Capability in every reach can still see — and attempt — a tier-3 Mythic verb the moment it is unlocked. There is no felt sense that mastery in a reach *earns* access to that reach's deeper magic.

This plan wires a single deterministic rule: **a non-starter action of rarity tier N requires the ascendant to hold Domain Capability tier ≥ (N−1) in the action's primary `reach`.** It is a *progression floor*, not a redesign — it reuses `computeTier` thresholds, the existing `handFilter` staged-prereq pipeline, and the existing `lockedReason` rendering. No new node types, no new GameState fields, no new orchestrator phase.

**Verdict-independent:** none of THR-390 Appendix B's open questions (reach drift — *done* via THR-396; inspire cost; `sanctify_tavern`; sustained-controls UI — *done* via THR-418; first-run archetype; per-run vs per-account unlocks) touch this rule. This is safe to ship now.

---

## 2. The rule

| Rarity tier | Name | Required reach tier in `template.reach` |
|---|---|---|
| 1 | Mundane | 0 (no gate — every ascendant qualifies) |
| 2 | Storied | 1 |
| 3 | Mythic | 2 |
| 4 | Legendary | 3 |

- The gate reads the ascendant's Domain Capability **tier** in the template's primary `reach` (`computeTier(computeCapability(graph, ascendantId, reach))`), compares it to the table, and **dims** (does not hide) the action when the ascendant falls short.
- **`starter: true` templates are exempt.** The Starter 12 (THR-419) is the always-available floor; this gate is a progression gate for the *non-starter* catalog. Exempting starters makes the two systems compose without ordering fragility — and means a starter tagged rarity 2+ for display reasons is never accidentally locked.
- The gate is a **floor**, not an override. If a template ever carries a stricter explicit per-template prerequisite, that stays authoritative; this rule never *loosens* access, only sets a minimum.

### Design calls made (grey areas resolved — autonomous run)

| Question | Call | Rationale |
|---|---|---|
| Dim or hide tier-insufficient actions? | **Dim** (show as locked with a reason) | The sphere gate already shows-as-locked (`targetActions.ts` gate 4 comment: "Still show as locked slot rather than hiding entirely"). Dimming *teaches* the progression — the player sees the Mythic verb and learns Iron mastery unlocks it. Hiding would make the catalog feel arbitrarily small. |
| Override or supplement explicit prereqs? | **Floor only** | Additive over destructive (NFP #6). Never weakens an authored gate. |
| Starters exempt? | **Yes** | Composes cleanly with THR-419; removes a Starter-12-rarity ordering hazard. |
| Where does the ascendant's reach tier come from? | Precomputed `Partial<Record<ReachDomain, number>>` passed into the pure filters | Keeps `handFilter.ts` pure (no graph access). `phaseAscendantHandFilter` and the `useTargetActions` hook each compute it once via `computeCapability`+`computeTier`. |

---

## 3. Engine pillar

### 3.1 Constant

`RARITY_REACH_TIER_GATE: Readonly<Record<1 | 2 | 3 | 4, number>> = { 1: 0, 2: 1, 3: 2, 4: 3 }`

Placement: a small new module `src/data/action-gating-constants.ts` (or appended to an existing action-constants surface — executor's call; it must be importable by both `handFilter.ts` and `targetActions.ts`). Reuse `computeTier`'s existing thresholds — **do not** redefine tier cutoffs (NFP #1: one source of truth).

### 3.2 `handFilter.ts` — the in-encounter ascendant hand

`src/engine/encounters/handFilter.ts` already partitions the deck into `playable` / `dimmed` / `hidden` through a clean staged-prereq pipeline. Extend it additively:

- `HandFilterStage` gains `'reach_prereq'`.
- `HandFilterPrereqCode` gains `'reach_tier_too_low'`.
- `FilterAscendantHandContext` gains `ascendantReachTiers: Partial<Record<ReachDomain, number>>`.
- New stage in `evaluateTemplateVisibility()`, placed **after** `sphere_prereq` and **before** `bond_tier`:
  - If `template.starter === true` → skip (exempt).
  - `required = RARITY_REACH_TIER_GATE[template.rarityTier ?? 1] ?? 0`. If `required === 0` → pass.
  - `actual = context.ascendantReachTiers[template.reach] ?? 0`.
  - If `actual < required` → return `{ visible: true, prereq: { stage: 'reach_prereq', code: 'reach_tier_too_low', message: <flavored, see §4> } }`.
- `filterAscendantHand` needs no change — it already routes any `prereq` to `dimmed`.

### 3.3 `phaseAscendantHandFilter.ts` — wire the context

`src/engine/orchestrator/phaseAscendantHandFilter.ts` already imports `computeCapability`. Add: compute the ascendant's tier for all 8 canonical reaches once per phase invocation —

```
const ascendantReachTiers = Object.fromEntries(
  REACH_DOMAINS.map(r => [r, computeTier(computeCapability(state.graph, state.ascendantId, r))])
);
```

— and pass it into the `filterAscendantHand(deck, { ...existing, ascendantReachTiers })` call. (`REACH_DOMAINS` / the 8-reach list lives in `traits.ts` — executor confirms the export name.)

### 3.4 `targetActions.ts` — the ActionDrawer surface

`getTargetActionSlots()` in `src/engine/targetActions.ts` is the focused-node ActionDrawer pipeline (gates 1–7). Add a reach-tier gate so the drawer and the in-encounter hand agree:

- `TargetActionParams` gains `ascendantReachTiers?: Partial<Record<ReachDomain, number>>` (optional → fail-soft, see §6).
- `FilterCounts` gains `byReachTier: number`.
- New gate, placed after the sphere gate (gate 4) and before the essence gate (gate 5), mirroring the sphere gate's **show-as-locked** behaviour rather than `continue`:
  - Skip if `template.starter === true` or `RARITY_REACH_TIER_GATE[rarity] === 0`.
  - If `(ascendantReachTiers?.[template.reach] ?? 0) < required` → `available = false`, `lockedReason = <flavored, see §4>`, increment `counts.byReachTier`.
- The slot already carries `rarityTier`; no slot-shape change needed beyond `lockedReason` (already a field).

### 3.5 `useTargetActions.ts` — thread the hook

`src/components/Game/hooks/useTargetActions.ts` calls `getTargetActionSlots`. It must compute `ascendantReachTiers` for the ascendant (same `computeCapability`+`computeTier` pattern, memoised on `worldVersion` — see CLAUDE.md "mutated in place" decision) and pass it through.

### 3.6 Determinism / purity

`computeCapability` and `computeTier` are pure. The gate is a pure comparison. Same seed + same graph → same partition. No PRNG involved. ✓ (NFP #3)

### 3.7 Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `RARITY_REACH_TIER_GATE` | `{1:0, 2:1, 3:2, 4:3}` | Rarity tier → minimum Domain Capability tier in the action's primary reach |
| `REACH_TIER_LOCK_MESSAGES` | 8 strings (§4) | Per-reach Threadbare-voice lock reason shown on dimmed/locked slots |

No tier *thresholds* are redefined — `computeTier` remains the single source.

---

## 4. Content pillar

The gate's lock reason is player-facing prose, not a code string — "content is design" (game-design-direction principle 6). Author **`REACH_TIER_LOCK_MESSAGES: Record<ReachDomain, string>`**, one short line per reach, in Threadbare voice. The line teaches the progression in-world: *this verb exists, and deepening this reach is how you reach it.* Suggested copy (executor may polish):

| Reach | Lock message |
|---|---|
| iron | "Your Iron is not yet forged deep enough to bear this." |
| gold | "This work wants a richer vein of Gold than you have struck." |
| shadow | "The Shadow does not yet fold thick enough around your hand." |
| veil | "The Veil parts only for those who have studied it longer than you." |
| heart | "Your Heart has not yet learned the depth this asking demands." |
| eye | "Your Eye is not yet practised enough to hold this clearly." |
| stone | "The Stone answers slow, and you have not yet earned its deeper word." |
| star | "The Star is still distant — this calling waits beyond your reach." |

Optional refinement (executor's call, low cost): prefix with the rarity-tier name so the player learns the vocabulary — e.g. *"A Mythic working — the Veil parts only for those who have studied it longer than you."* The rarity-tier names (Mundane / Storied / Mythic / Legendary) are already the canonical labels per the audit legend.

No encounter templates, prose tables, or attachment content change. This is the entire Content footprint — small, but real, and it carries the teaching weight.

---

## 5. UI pillar

**Verify-not-build — the rendering surfaces already exist.**

- **ActionDrawer:** slots already render `lockedReason` (the sphere and range gates use it today). The reach-tier `lockedReason` renders automatically with the flavored §4 message. No component change.
- **In-encounter ascendant hand:** `phaseAscendantHandFilter` already emits the `hand_filtered` trace with `dimmedTemplateIds[].prereq.code`; the hand UI that renders dimmed entries already surfaces `prereq.message`. The new `reach_tier_too_low` entries flow through with their flavored message. No component change.
- **DebugPanel:** the `hand_filtered` trace now carries `reach_tier_too_low` in its dimmed reasons; the slot-filter trace gains `byReachTier`. Both are visible in the existing Trace tab — no new DebugPanel surface, but the executor should confirm the count renders.
- **Codex view (`?view=codex`):** *optional / deferral candidate* — the action codex could show "Requires {reach} tier N" alongside the rarity badge. Nice-to-have; not required for this issue. File as a follow-up if there is appetite.
- **Hex map signifiers:** N/A — this gate changes action *availability*, not world state; nothing new to draw on the map.

**Browser-verify artifact (Definition of Done):** at 1920×1080, screenshot the ActionDrawer with the seeded ascendant (`?view=game&seeded`) focused on a target that offers a tier-2+ non-starter action the ascendant cannot yet afford by reach tier — the slot must show locked with the flavored reason. Capture console (errors+warnings). `__DEBUG` assertion: query the focused target's slots and assert one slot's `lockedReason` matches a `REACH_TIER_LOCK_MESSAGES` value, and at least one tier-1/starter slot remains `available: true`.

---

## 6. Wiring & fail-soft

### Wiring checklist

| Module | Change | Notes |
|---|---|---|
| `src/data/action-gating-constants.ts` (new, small) | `RARITY_REACH_TIER_GATE`, `REACH_TIER_LOCK_MESSAGES` | Importable by both filter surfaces |
| `src/engine/encounters/handFilter.ts` | `reach_prereq` stage + `reach_tier_too_low` code + check + context field | Additive — follows the existing staged-prereq pattern exactly |
| `src/engine/orchestrator/phaseAscendantHandFilter.ts` | Compute `ascendantReachTiers`, pass to `filterAscendantHand` | Already imports `computeCapability` |
| `src/engine/targetActions.ts` | Reach-tier gate, `FilterCounts.byReachTier`, `TargetActionParams.ascendantReachTiers` | Show-as-locked, mirroring the sphere gate |
| `src/components/Game/hooks/useTargetActions.ts` | Compute + thread `ascendantReachTiers` | Memoise on `worldVersion` |
| `src/engine/encounters/__tests__/handFilter.test.ts` | Reach-tier stage cases | Below-tier → dimmed; at-tier → playable; starter exempt; rarity-1 ungated |
| `src/engine/__tests__/targetActions.test.ts` | Reach-tier gate cases | Below-tier → locked w/ reason; starter exempt; missing `ascendantReachTiers` → fail-soft |

- **No GameState field added.** No orchestrator phase added (`phaseAscendantHandFilter` already runs). No `wiring-checklist.md` update needed (no new modal / phase / GameState field / trace category / player control).
- **Systemic wiring guide:** the executor should add a one-line note to `Docs/plans/2026-04-16-systemic-wiring-guide.md` Part 2 (prerequisites) — "actions are now reach-tier-gated by rarity" is content-facing knowledge an author should have when picking a `rarityTier`.

### Fail-soft table (NFP #4)

| Failure case | Behaviour |
|---|---|
| `ascendantReachTiers` missing/undefined | All reaches treated as tier 0 → only rarity-1 + starter actions pass; rest dimmed/locked. No throw. Matches `targetActions.ts` "missing hexRevelation → treat as unrevealed" precedent. |
| `template.rarityTier` undefined / out of 1–4 | Treated as rarity 1 → gate 0 → always passes. No throw. |
| `template.reach` not a canonical `ReachDomain` | Lookup miss → `?? 0` → gate compares against 0; rarity-1 passes, higher dims. `console.warn` once. (Post-THR-396 this should not occur.) |
| `REACH_TIER_LOCK_MESSAGES[reach]` missing | Fall back to a generic `"Your mastery of this reach is not yet deep enough."` constant. No throw. |

### Tracing (NFP #2)

No new `TraceEntry` interface. Both surfaces ride existing traces:
- `hand_filtered` trace: `dimmedTemplateIds[].prereq.code` now includes `'reach_tier_too_low'` — already structured to carry it.
- `targetActions.ts` slot-filter: `FilterCounts` gains `byReachTier`. If `FilterCounts` is not currently emitted as a trace, the executor adds a minimal `target_action_filter` count line — confirm during pickup.

### Blast radius

No high-impact file touched (none of `handFilter.ts`, `phaseAscendantHandFilter.ts`, `targetActions.ts`, `useTargetActions.ts` is on the ≥100-importer list). The change adds **no** field to `UnifiedActionTemplate` — the gate is *derived* from the existing `reach` + `rarityTier` + `starter`. No Blast Radius section required.

---

## 7. NFP compliance

| NFP | Verdict | Note |
|---|---|---|
| 1 — Tunability | PASS | `RARITY_REACH_TIER_GATE` + `REACH_TIER_LOCK_MESSAGES` named; tier game-feel = editing the map |
| 2 — Inspectability | PASS | Rides `hand_filtered` trace + `byReachTier` filter count; every dim/lock carries a `code` + `message` |
| 3 — Determinism | PASS | Pure `computeTier`/`computeCapability` comparison; no PRNG |
| 4 — Fail-soft | PASS | §6 table — every missing-input path degrades gracefully, never throws |
| 5 — Narrative over mechanical | PASS | Lock reason is Threadbare-voice prose that *teaches*, not a code string |
| 6 — Additive over destructive | PASS | New stage / code / optional fields only; floor-not-override; no interface field added |
| 7 — Performance budget | PASS | One `Object.fromEntries` over 8 reaches per phase invocation + per hook memo; negligible |

## 8. Three-pillar check

- **Engine** — §3: constant, `handFilter` stage, `phaseAscendantHandFilter` wiring, `targetActions` gate, hook threading. ✓
- **Content** — §4: 8 Threadbare-voice per-reach lock messages (+ optional rarity-name prefix). ✓
- **UI** — §5: `lockedReason` rendering (verify-not-build), DebugPanel trace count, browser-verify artifact + `__DEBUG` assertion specified. ✓
- **Wiring** — §6: every module's change named; trace path identified; fail-soft tabled. ✓

## 9. Out of scope / deferral candidates

- Codex-view "Requires {reach} tier N" badge (§5) — file a follow-up if there is appetite.
- Audit recommendations still open after this ships: **#10** (5-action discovery template per layer — note: the recon landscape changed under THR-398's Survey collapse; needs a fresh look before scoping), **#11** (persona/archetype unlock paths — blocked on THR-390 Appendix B open questions), **#12** (earned actions from mortal milestones — brainstorm-first). These remain THR-390's open tail.
