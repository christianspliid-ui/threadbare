> **title:** `Item on-use triggers as effect primitives — THR-719`
> **linear_issue:** THR-719
> **author:** `Claude Code`
> **created:** 2026-07-24
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Item on-use triggers as effect primitives — THR-719

*Breakage, curses-on-critical-failure, and consumption finally fire — by extending the production-wired `action_trigger` primitive instead of resurrecting the orphaned legacy resolver.*

**User verdict (chat review 2026-07-23, recorded in the issue):** re-express on-use triggers as **effect primitives** (extend the effects[] vocabulary with on-outcome triggers) and port the authored content. Do NOT wire the legacy resolver as-is — that recreates a parallel path beside the 2026-03-31 effects[] architecture. Retire `attachmentTriggers.ts` + its test suite once ported (dead-contract test rule).

## Why this is load-bearing

`src/engine/attachmentTriggers.ts` is complete, tested, and has **zero production importers** — a sword that says it snaps on a critical failure never snaps; a cursed eye that drains resolve never drains. Tooltips read the raw `onUseTriggers` data and promise behavior the engine never delivers — the exact "green tests on a dead contract" pathology the interface map exists to kill. Items are mid-remediation (THR-718 tiers, THR-737 trait grants); this closes the on-use half so the effects[] substrate becomes the single, whole item-behavior channel.

## Substrate inventory

*(Step 0.6 — grep evidence 2026-07-24. The on-outcome trigger seam ALREADY EXISTS in production; this plan extends it. The THR-718 judge's lesson — grep wide before claiming absence — applied deliberately here.)*

- **Legacy (LEAKED side):** `OnUseTrigger` (`src/types/attachments.ts:51–76`): `triggerCondition` (five-band outcome values + `any_use`/`first_use`), `probability` (0–1), `effect` (`add_condition` / `remove_condition` / `remove_possession` / `spawn_actor` / `add_possession` / `modify_relationship`), `narrativeTemplate` (`{actor}`/`{item_name}`/`{target}`/`{location}`), `tags`. Resolver `attachmentTriggers.ts` (pure, tested, **zero production importers**). Authored content: `starter-attachments.ts` + `anomaly-reward-catalog.ts` (`onUseTriggers` blocks — breakage on crit-failure, condition-drain on any_use, etc.). Display reads raw data: `resolveAttachmentTooltip` / `ProwessTab` pass `onUseTriggers` through.
- **The production-wired sibling (the seam to extend):** `ActionTriggerEffect` (`effects.ts:439–460`, TB-104 Phase 1B) — fires when the owning agent *does* things: `on: 'encounter_success' | 'encounter_failure' | 'movement_complete' | 'rest' | 'spell_cast' | 'action_complete'`, with `condition?: EffectPredicate`, `maxFires?` (= `first_use` semantics), `cooldownTicks?`. Resolver `src/engine/effects/actionTrigger.ts` (`checkAndFireActionTriggers`), **called from the orchestrator** (`orchestrator.ts:854`). Payloads today: `resource_delta` / `content_grant` / `trace_only`.
- **What the wired primitive lacks vs the legacy shape** (the gap this plan fills): (1) outcome-band granularity — no critical-success/critical-failure events; (2) `probability`; (3) item-behavior payload kinds (condition grant, breakage, possession grant, relationship delta); (4) `narrativeTemplate` prose on firing.
- **Not the same thing:** `ReactiveEffect` (`effects.ts:276–282`, consumed by `checkReactiveEffects` in `effectAura.ts`) fires on things happening **TO** the agent (`attacked`/`damaged`/…) — the actionTrigger.ts header states the distinction explicitly. On-use triggers are things the agent *does*; `action_trigger` is the correct seam, `reactive` is untouched.
- **Payload building blocks already exist elsewhere in the vocabulary:** `SpawnEffect` (spell tier), condition attachments machinery, possession grant/removal graph ops — the new payload kinds reuse these execution paths via `effectExecutors.ts`, not new machinery.
- Related contracts deliberately out of scope: `attachment-activated-effects` (THR-720, parked), edge modifiers (THR-723), `trait_grant` consumer (THR-737), stat contributions (THR-718).
- Systems-inventory cross-check: **0 hits** for `action_trigger` / `checkAndFireActionTriggers` / `onUseTriggers` in `Docs/canon/systems-inventory.md` — the trigger machinery lives below the inventory's subsystem granularity; the source-level greps above are the substrate evidence.

**Verdict: extends** the production-wired `action_trigger` primitive + its resolver; **ports** authored `onUseTriggers` content onto it; **retires** the legacy `attachmentTriggers.ts` resolver, its tests, and the `onUseTriggers` field; **replaces** the tooltip read path; adds **no** new parallel resolution path (the verdict's exact requirement).

## Engine pillar

### Systems design

All changes extend `action_trigger` in place:

1. **Outcome-band events** — extend `ActionTriggerEvent` with `'encounter_critical_success' | 'encounter_critical_failure' | 'encounter_at_cost'`. The resolution call site maps the five-band ladder onto events (clean → `encounter_success`, at-cost → `encounter_at_cost`, failure → `encounter_failure`, crits → their events). Authored triggers that want "any use" use the existing `action_complete`.
2. **`probability?: number`** (default 1.0) on `ActionTriggerEffect` — rolled with the seeded PRNG stream at the existing fire-check (one added guard in `checkAndFireActionTriggers`; the roll is passed in via context like the legacy resolver did, keeping the function pure).
3. **New payload kinds** on `ActionTriggerPayload` — **only the kinds authored content actually uses** (predicate: kinds present in shipped `onUseTriggers` blocks; executor enumerates during the port): `condition_grant` (attach a condition node, with `modifiers`/`ticksRemaining`), `self_remove` (breakage/consumption — removes the owning possession), `possession_grant`, `relationship_delta`. Unused legacy kinds (`spawn_actor` if unauthored) are **not** ported — dead vocabulary is the disease, not the cure. Payload execution reuses existing executor paths in `effectExecutors.ts`.
4. **`narrativeTemplate?: string`** on `ActionTriggerEffect` — on fire, substituted (`{actor}`/`{item_name}`/`{target}`/`{location}`, same tokens as legacy) and emitted as a narrative event through the existing event path, then `enrichProse()`-compatible downstream.
5. **Retirement:** delete `attachmentTriggers.ts` + `attachmentTriggers.test.ts` + the `onUseTriggers` field from `PossessionNodeProperties` after the port (dead-contract rule; the tooltip path switches first — see UI).

### Graph nodes / edges

None added or modified. Payload executions use existing condition-attachment and possession machinery (existing node/edge shapes); `self_remove` uses existing possession-removal graph ops with `touchWorld()`.

### Tick phases

None added. The orchestrator already calls `checkAndFireActionTriggers` (`orchestrator.ts:854`); the call site gains the ladder→event mapping and passes the PRNG roll + fired-narrative plumbing. No ordering changes.

### Resolution logic

Fire condition (unchanged shape): event match ∧ predicate ∧ probability roll ∧ not-on-cooldown ∧ fires-remaining. `maxFires: 1` reproduces legacy `first_use`. Item-scoped gating (legacy "tags overlap") is served by the existing `condition?: EffectPredicate` field — v1 ports authored content without tag gating (none of the shipped entries meaningfully used it; executor verifies during the port and flags any that did).

### PRNG callouts

The probability roll uses the seeded per-system stream (`effects.actionTrigger` or the existing effect-roll stream at the call site) — **no `Math.random()`**; the legacy resolver's deterministic-roll-via-context pattern is preserved.

## Content pillar

### Encounter templates

None touched.

### Prose tables

Legacy `narrativeTemplate` strings are ported verbatim onto the new field (they are authored prose worth keeping — "The Eye drinks deep of {actor}'s resolve."). No new tables.

### Attachment content

**The port (predicate, not a list):** every catalog entry carrying an `onUseTriggers` block (`starter-attachments.ts`, `anomaly-reward-catalog.ts` — grep `onUseTriggers` for the live set) has each trigger re-expressed as an `action_trigger` entry in the same item's `effects[]`: outcome condition → event, probability → probability, effect → payload kind, narrativeTemplate → narrativeTemplate. The legacy `onUseTriggers` blocks are deleted in the same pass. Executor records the ported-trigger count as closeout evidence and justifies any entry that cannot map 1:1 (expected: none — the payload-kind predicate is derived from this exact content set).

### Data tables

`ACTION_TRIGGER_DEFAULT_COOLDOWN` already exists (`data/effect-constants.ts`). New constant only if the port surfaces one (none anticipated — probabilities are per-entry data).

## UI pillar

*Screenshot tool: **Playwright** (tooltip/ProwessTab is DOM). 1920×1080.*

### Player-facing display

- **Tooltip path switch:** `resolveAttachmentTooltip` (and the `ProwessTab`/vignette callers passing `onUseTriggers`) read the item's `action_trigger` effects instead of the retired field — same rendered strings (the tooltip's job is unchanged: tell the truth about the item, which after this ticket it finally does).
- No new surfaces; trigger firings surface as narrative events through the existing event feed/chronicle path (that is the point — item drama becomes visible).

### Event notifications

Fired triggers emit narrative events with the substituted template prose (existing channel, no new notification machinery).

### Debug inspection (DebugPanel)

Firings appear in the existing action-trigger trace details (`ActionTriggerFiredTraceDetails` already exists); no new bridge. CLI/`eval` probe in Done-when.

### Visual presence (HexMapV2)

N/A — no map surface.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new orchestrator phases, GameState fields, or player controls; one existing trace-details type gains fields if needed.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `effects.ts` (event/payload/probability/narrative extensions) | — (data) | tooltips | — | — | `eval` on `effects[]` |
| `actionTrigger.ts` (probability guard + narrative return) | existing call at `orchestrator.ts:854` (+ ladder→event map) | event feed (narrative events) | — | existing `ActionTriggerFiredTraceDetails` | trace viewer |
| `effectExecutors.ts` (new payload kinds → existing executors) | same call path | — | — | existing executor traces | trace viewer |
| Tooltip read switch | — | `resolveAttachmentTooltip` / `ProwessTab` | — | — | Playwright screenshot |
| Retirement (`attachmentTriggers.ts`, `onUseTriggers`) | — | — | — | — | grep returns zero hits |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ACTION_TRIGGER_DEFAULT_COOLDOWN` | existing value (unchanged) | Cooldown when an entry omits `cooldownTicks` |
| `ACTION_TRIGGER_DEFAULT_PROBABILITY` | `1.0` | Fire chance when an entry omits `probability` (new, named) |

*(Per-trigger probabilities are authored data, not constants — tunable per item.)*

## Tracing

N/A — no new trace types: `ActionTriggerFiredTraceDetails` already exists and covers firings; if the narrative/payload extensions need extra fields, they are added to that existing interface (executor verifies with `tsc -b` — the Omit-collapse quirk means editor squiggles prove nothing).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Malformed `action_trigger` entry (missing event/payload) | Skipped by the existing type-guard walk; no throw |
| Probability present but non-numeric | Treated as `ACTION_TRIGGER_DEFAULT_PROBABILITY` |
| `self_remove` on an already-removed possession | Graph op no-ops; log once |
| `condition_grant` when condition machinery rejects (cap/duplicate) | Payload skipped; other payloads still fire |
| Narrative template with unknown token | Token renders empty (legacy substitution behavior preserved) |
| Legacy `onUseTriggers` block found post-port (drift) | Content test fails the build — the field is deleted from the type, so `tsc`/tests catch stragglers |

## Interface impact

*(Step 0.7 — Attachments/Possessions is audited; this is the row the ticket exists to remediate. Executor updates `scripts/interface-contracts.ts` in the same PR.)*

| Contract | Action | Producer → Consumer | Notes |
|---|---|---|---|
| on-use triggers row (🔴 LEAKED, deferral THR-719 — the row naming `attachmentTriggers`/`onUseTriggers`) | **extend → LIVE, then re-point** | catalog `action_trigger` entries → `checkAndFireActionTriggers` (orchestrator call) → executors + narrative events | Re-badge with dated `verifiedLive`; **replace the row's grep symbols** with the live ones (`action_trigger`, `checkAndFireActionTriggers`) — the retired symbols must not remain as evidence keys (dead-contract rule) |
| `attachment-character-sheet-display` (🟢 LIVE) | **extend** | tooltip reads `action_trigger` effects | Display-side switch, same rendered promise |
| `attachment-effects-shape-resolution` (🟢 LIVE) | **preserve** | untouched | — |
| `attachment-activated-effects` (🔴 LEAKED, THR-720 parked) | **preserve (do not touch)** | — | Separate, user-parked |

**Retirement clause (DoD):** `attachmentTriggers.ts` + its test suite are deleted in the same PR; tests asserting the dead side are removed with them, per the interface-map dead-contract test rule.

## Blast Radius

*Omitted — no ≥100-importer file is touched (`effects.ts`, `actionTrigger.ts`, `effectExecutors.ts`, `attachments.ts`, two catalogs, tooltip files — none on the CLAUDE.md high-impact list).*

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted — "failure is plot" is the whole feature: critical failures now produce story artifacts (the blade snaps, the curse bites) with authored prose; one-substrate effects[] architecture reinforced.
- [x] No Vision edit required.

## Rulebook impact

- [x] Marginal rule-of-play touch: item on-use consequences (breakage/curse/consumption) become live encounter-resolution behavior. Executor adds a one-line note to the rulebook's encounter/items area (`[IMPL]` once shipped) in the same PR.
- [x] `Docs/canon/rulebook.md` one-liner is in the executor's scope.

> Brainstorm companion: `Docs/plans/2026-07-24-on-use-triggers-as-effects-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Probabilities/cooldowns are per-entry data; defaults are named constants |
| 2. Inspectability | PASS | Existing `ActionTriggerFiredTraceDetails` covers firings; narrative events make item drama player-visible |
| 3. Determinism | PASS | Seeded stream for probability rolls; pure fire-check preserved |
| 4. Fail-soft | PASS | 6-row table; post-port stragglers caught at build time by the deleted type field |
| 5. Narrative over mechanical perfection | PASS | Authored narrative templates ported verbatim; failure produces story ("failure is plot") |
| 6. Additive over destructive | PASS with note | The retirement (resolver + field + tests) is deliberate and user-verdicted — the old shape blocks the one-substrate goal, which is the sanctioned reason for destructive change |
| 7. Performance budget | PASS | Fire-check already runs in production; extensions are O(triggers-per-item) on the same walk |

## Done when

- [ ] CLI probe: a seeded run (or `eval`-driven action) shows an `action_trigger` firing on an outcome band with probability + narrative event emitted; paste trace/event output
- [ ] Port complete: grep `onUseTriggers` returns zero hits in `src/` (type field, catalogs, resolver, tests all gone); ported-trigger count in closeout
- [ ] Tooltip renders trigger promises from `action_trigger` effects (Playwright screenshot at 1920×1080 + console; sim via `window.__DEBUG.tick(n)` only)
- [ ] Interface row re-badged LIVE with dated `verifiedLive` + live grep symbols; dead symbols removed from the row
- [ ] 30-tick CLI smoke clean (engine files touched); `npm test`, `npx vite build`, `npm run check:typecheck` (ratchet — expect a *decrease* if the deleted legacy code removes baseline errors; refresh with `-- --update` if so), `npm run check:generated-freshness` pass
- [ ] Rulebook one-liner added; closing commit + PR body include `Fixes THR-719`

## Coordination block

**Suggested model:** opus — engine extension + destructive retirement + content port across two catalogs.

**Parallel-safe with:** UL tickets, THR-738, THR-721 — disjoint files.

**Mutex with:** THR-718 and THR-737 (all three edit `src/types/effects.ts` / the attachment catalogs — the converging effects[] substrate). Preferred order: **718 → 719 → 737**. Also touches the orchestrator resolution call area — coordinate with THR-74 remainder if simultaneous (single-lane WIP makes this sequencing).

**Files to touch:**
- Edit: `src/types/effects.ts` (event union + payload kinds + probability + narrativeTemplate), `src/engine/effects/actionTrigger.ts`, `src/engine/effectExecutors.ts` (payload execution), orchestrator call site (ladder→event map), `src/types/attachments.ts` (delete `onUseTriggers` field + trigger types after port), `src/data/starter-attachments.ts` + `src/data/anomaly-reward-catalog.ts` (port), `src/engine/attachmentTooltip.ts` + callers (read switch), `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`, `src/data/effect-constants.ts` (new default-probability constant)
- Delete: `src/engine/attachmentTriggers.ts`, its test suite, **and every other test importing `resolveOnUseTriggers`** (judge-verified: `src/engine/__tests__/attachment-lifecycle-integration.test.ts` also imports it — port or delete its dead-side assertions)
- Create: tests for outcome-band mapping, probability guard, payload kinds, port-completeness content test

## Notes for the executor

- **Do NOT wire `attachmentTriggers.ts` into production** — the user verdict explicitly forbids it; it gets deleted, not adopted.
- **Do not extend `ReactiveEffect`** — it is the "things done TO the agent" channel; on-use is "things the agent does" (`actionTrigger.ts` header states the boundary).
- Port payload kinds only for shapes the authored content uses — do not port `spawn_actor` etc. speculatively if no entry uses it.
- The typecheck ratchet may legitimately *decrease* when the legacy code is deleted — refresh the baseline with `-- --update` and explain in the commit body.
- THR-720 (`activatedEffects`) is user-parked — resist the temptation to "fix it while in there."

## Intent-judge verdict

**Allow** (2026-07-24, cold-boot Opus judge). All 11 dimensions PASS, 0 GAPs, 0 VIOLATIONs; impact class confirmed Reversible; the core claim (extend the production-wired `action_trigger`, don't resurrect the orphan) independently verified against source, substrate check rated "exemplary — the THR-614-class check working as designed." Two advisory notes applied: orchestrator call is line 854 (fixed), and `attachment-lifecycle-integration.test.ts` also imports the dead resolver (named in the retirement clause). Proposal: `Docs/plans/.intent-proposals/2026-07-24-on-use-triggers-as-effects.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-24*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | New `ACTION_TRIGGER_DEFAULT_PROBABILITY` named constant; per-trigger probabilities/cooldowns are authored data |
| 2. Inspectability | PASS | Reuses `ActionTriggerFiredTraceDetails`; firings surface as narrative events through existing channels |
| 3. Determinism | PASS | Seeded per-system stream; fire-check stays pure via context-passed roll |
| 4. Fail-soft | PASS | 6-row table incl. post-port drift caught at build time |
| 5. Narrative over mechanical | PASS | Templates ported verbatim; "failure is plot" — crits/breakage produce story artifacts |
| 6. Additive over destructive | PASS-with-note | Real destruction, bar met: zero production importers (dead code, not live functionality), user-verdicted deletion, dead-contract-test rule requires it — legitimate exception, narrow scope |
| 7. Performance budget | PASS | Extends an already-running walk by O(triggers-per-item); no new tick phase |

NFP AUDIT: PASS-with-notes [design-brief-stale — audited against CLAUDE.md § NFPs]

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | PASS | 5 numbered changes, explicit N/As, resolution logic + PRNG concrete and line-numbered |
| Content | PASS | Predicate-based port across two catalogs; verbatim prose port; data tables addressed |
| UI | PASS | Tooltip read-switch, existing event channel, existing trace type; HexMapV2 N/A with reason; Playwright named |

No missing required sections; Blast Radius correctly omitted. Wiring maps every module to the existing orchestrator call site — extension, not a new subsystem. Substrate check: independently verified — `checkAndFireActionTriggers` imported at `orchestrator.ts:90`, called at exactly line 854; `attachmentTriggers.ts` has exactly the three importers the retirement clause names; core claim substantiated by source, not narrative. (Minor note applied: systems-inventory 0-hit citation added to the substrate section.)

PILLAR AUDIT: PASS

### Vision audit

Premises: non-negotiable #2 (narrative over mechanics) **confirmed**; #3 (prose not numbers) **extended** via narrative-event path; #4 (single substrate) **reinforced** by retiring the orphaned parallel resolver; north star / core loop not engaged (plumbing below the loop); design tension #2 sits inside the settled "emergence generates, authorship frames" navigation; taste-profile.md absent from worktree — unverifiable.

No contradictions found.

VISION AUDIT: PASS
