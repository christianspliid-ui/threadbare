> **title:** `Reunite + Sunder — company-arc ascendant actions — THR-732`
> **linear_issue:** THR-732
> **author:** `Claude Code`
> **created:** 2026-07-24
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Reunite + Sunder — company-arc ascendant actions — THR-732

*The god's two remaining company verbs: draw a broken fellowship back together, or crack a living one apart — completing the nurture/cause/destroy triangle around companies.*

**Origin (user, verbatim, 2026-07-23 grill Q8):** "influencing reforming and splitup is also great candidates for ascendant actions, get those noted and in the backlog alongside the connect threaded agents action we talked about above."

## Pre-flight (action-catalog-design skill)

### Substrate Honesty table

| Verb | Substrate | Exists? (grep evidence 2026-07-24) | Verdict |
| --- | --- | --- | --- |
| Reunite | Disbanded-company persistence (`groupStatus: 'disbanded'`, `roster`, `disbandedAtTick`) | Yes — `groupQueries.ts` (`GroupStatus`, `roster`, `disbandedAtTick`), persisted by `dissolveGroup` (THR-74 PR 1) | rides existing |
| Reunite | Formation compatibility + scan (`computeCompatibility`, `runFormationScan`, `createGroup`) | Yes — `groupFormation.ts` (symbol-verified) | rides existing (adds one bias term) |
| Reunite | Convergence pull on movement candidates | **Ships with THR-74 remainder** (Draw Together machinery; constants `DRAW_TOGETHER_PULL_WEIGHT`/`_DURATION_TICKS` already in `group-constants.ts`) | rides commissioned substrate — hence blocked-by THR-74; **no new substrate commissioned here** |
| Sunder | Cohesion delta API | Yes — `applyCohesionDelta` (`groupCohesion.ts`) | rides existing |
| Sunder | Leave-decision evaluation | Yes — `runGroupUpkeep` (`groupDissolution.ts`) | rides existing (adds one multiplier read) |
| Sunder | Dissent registration | Yes — group movement dissent (THR-74 PR 1) | rides existing (adds one multiplier read) |
| Both | Timed-window property + query pattern | Yes — `blessedUntilTick` + `isGroupBlessed` (`groupQueries.ts`) is the exact precedent to mirror | rides existing pattern |
| Both | Beat-grant path for new UATs | Yes — THR-613 beat grants; verified live via `listUnreachableActions()` | rides existing |

**No entry needs new substrate.** Both verbs are timed-window properties + one bias/multiplier read each, inside systems shipped by THR-74 PRs 1–2b. The one dependency (convergence pull) is substrate already commissioned to THR-74's remaining scope — this plan consumes it, it does not commission it.

### Mortal-Loop Bridges

**Reunite:** fired on a disbanded company with ≥1 living threaded former member. That mortal receives the sphere-flavored vision (narrative event on cast: the dream of the old fire, the glimpse of a companion's face in a crowd); the convergence pull bends their movement candidates toward the reunion point across the window, so the player *watches their mortal travel* — the journey is the story. When former members co-locate, the boosted compatibility clears the formation threshold and the re-formation fires as a formation moment carrying reunion context ("The Grey Wardens, re-formed at Ashford — older, fewer, unfinished"). The mortal the player cared about gets their people back on screen, or the window lapses and the vision becomes a chronicle entry about a road not taken — either way, a mortal-scale beat.

**Sunder:** fired on an active company — canonical target: a company the player's rival nurtured, or the player's own company gone wrong (a betrayer inside). The window amplifies dissent and leave-pressure; the first mechanical consequence the player sees is the **fray drama pool firing on a member** (The Shared Spoils / Old Wounds — THR-74 remainder wires this pool; if a threaded mortal is in the company, they take the scene). Dissolution, when it comes, fires the already-shipped **The Parting** (bitter variant — cohesion-floor reason) on the threaded member. Sunder's entire visible output is mortal-scale drama scenes; the group node's numbers only ever surface through them.

### Surface-Shape Verdict

**Global `UnifiedActionTemplate`s** for both, targeting `group` actor nodes from the drawer (Reunite valid only on `groupStatus: 'disbanded'` targets; Sunder only on `'active'`). Reasoning: identical shape to Bless this Company (THR-74-designed, same target class) — company-scale interventions fired against a focused target from its detail surface, with no anchor encounter to host a per-scene verb (Reunite's whole point is that no encounter exists yet — it *causes* one). The 2026-05-04 direction preserves global templates for scopes the encounter pipeline cannot host; this is that case.

## Why this is load-bearing

THR-74 gives the player two company verbs: cause (Draw Together) and nurture (Bless). Without Reunite and Sunder the arc has no *memory* and no *teeth*: a disbanded company — the graph's carefully persisted history — is inert nostalgia the god cannot act on, and a hostile band (rival-nurtured, or the player's own gone rotten) can only be opposed by waiting. These two verbs close the loop: history becomes actionable, and the company layer becomes contested space ahead of THR-731's open conflict.

## Substrate inventory

*(Step 0.6 — consolidated in the Pre-flight table above, per the action-catalog-design skill: every substrate row carries grep evidence. Verdict: **extends** the shipped THR-74 group subsystem with two timed-window properties and three bias/multiplier reads; **consumes** the Draw Together convergence machinery commissioned to THR-74's remainder; **replaces nothing**; commissions **no** new substrate.)*

## Engine pillar

### Systems design

Both verbs follow the `blessedUntilTick` pattern — a timestamp property on the group node written at cast, read by existing phase code during the window:

- **Reunite** (cast on a disbanded company): writes `reuniteUntilTick = tick + REUNITE_DURATION_TICKS` + `reuniteSphereFlavor` (caster's sphere, for prose). During the window, `phaseGroups`' formation sub-step: (a) former members (roster ∩ living ∩ ungrouped) receive the Draw Together convergence pull toward the reunion anchor (the living former leader's position, else the most-central former member); (b) `computeCompatibility` gains `REUNITE_COMPAT_BONUS` for pairs sharing that disbanded group's roster. Re-formation via the existing `createGroup` path, with `formationContext` recording the reunion and the name generator producing a re-formed variant of the old name. Window lapse → nothing breaks; a chronicle entry closes the beat.
- **Sunder** (cast on an active company): immediate `applyCohesionDelta(SUNDER_COHESION_DELTA)` + writes `sunderedUntilTick = tick + SUNDER_DURATION_TICKS`. During the window: movement-dissent cohesion hits are multiplied by `SUNDER_DISSENT_MULT`; `runGroupUpkeep`'s leave-decision probability is multiplied by `SUNDER_LEAVE_MULT`; the fray drama pool (THR-74 remainder) treats the company as frayed regardless of threshold. `isGroupSundered(node, tick)` mirrors `isGroupBlessed`. Bless and Sunder windows may coexist — they pull opposite directions through independent multipliers (no special-case cancellation; the tug-of-war is the story).

**Wiring path:** both effects apply via the established custom-ascendant-GraphOp route (graph-executor case — the THR-605 pattern), through the same UAT resolution path as other divine actions, with `touchWorld()` after property writes.

### Graph nodes / edges

None added. Two new documented property-bag fields on group nodes (`reuniteUntilTick`/`reuniteSphereFlavor`, `sunderedUntilTick`) — same class as the shipped `blessedUntilTick`.

### Tick phases

None added. Existing `phaseGroups` sub-steps read the windows (formation sub-step for Reunite; upkeep + cohesion for Sunder).

### Resolution logic

Casts are player-sourced UATs and follow whatever player-cast resolution rule is current at implementation time (THR-728 — player-cast variance with a success-at-cost floor — is queued; if it has landed, these casts roll the ladder like every other card; if not, they auto-succeed like today's casts. No special-casing either way.) Target validity is an eligibility predicate on the template: Reunite requires `groupStatus === 'disbanded'` ∧ ≥`GROUP_MIN_MEMBERS` living un-grouped roster members; Sunder requires `groupStatus === 'active'`.

### PRNG callouts

No new rolls beyond the (possibly THR-728-governed) cast resolution. Window effects are deterministic multipliers on existing seeded rolls (formation scan, leave decisions).

## Content pillar

### Encounter templates

None authored here. Reunite's re-formation rides the formation moment (Seeking Companions machinery, THR-74 remainder); Sunder's drama rides the fray pool + The Parting (shipped). This is deliberate — the verbs *route into* existing moments rather than adding parallel ones.

### Prose tables

- Cast-moment narrative lines per verb × sphere flavor bucket (visions/dreams/omens/coincidence — the Draw Together flavor table pattern), in `group-parting-content.ts`'s sibling style: `group-reunite-content.ts` (~8 lines), Sunder lines (~8) — `{company}` token, "party" never used.
- Re-formed name variant grammar ("The {old-name}, re-formed" / "{old-name} Reborn") in the existing name generator.

### Attachment content

N/A — no items.

### Data tables

Two new UAT entries in `src/data/unified-action-templates.ts` (Reunite, Sunder) — group-targeting, essence-costed, beat-granted. Constants below in `group-constants.ts`.

## UI pillar

*Screenshot tool: **Playwright** (ActionDrawer + modal surfaces are DOM). 1920×1080.*

### Player-facing display

- Two action cards in the existing ActionDrawer when a company detail surface is the target context (the Company surfaces ship in THR-74 PR 3 — sequencing note below). Reunite appears only on disbanded-company views (history surfaces), Sunder only on active ones. Card art via the established action-card recipe (two parallel maps — `ActionCard.tsx` + `codexRegistry.ts` — must both carry the entries).
- Cast feedback rides the Divine Receipt path (THR-727, shipped) like every player card.

### Event notifications

Cast-moment narrative event (sphere-flavored); window-lapse chronicle entry for Reunite; all downstream drama uses existing channels.

### Debug inspection (DebugPanel)

`getGroups()` readout gains `reuniteUntilTick`/`sunderedUntilTick` passthrough (one-line each); `listActions()`/`fireAction()` work on the new templates automatically; `listUnreachableActions()` must NOT list them post-grant.

### Visual presence (HexMapV2)

N/A beyond PR 3's cluster (no new map layer; a sundered company's fray is visible through the existing cohesion prose states).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new phases, GameState fields, or trace types; two new player controls (cards) ride existing drawer/grant machinery.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| UAT entries + graph-op cases | existing UAT resolution | ActionDrawer cards | — | existing action traces | `listActions()` |
| Window reads (formation/upkeep/cohesion) | existing `phaseGroups` sub-steps | — (drama surfaces downstream) | — | existing `group_phase` aggregate fields | `getGroups()` passthrough |
| Prose lines | — | narrative events | — | — | event feed |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `REUNITE_DURATION_TICKS` | `36` | Convergence + compat window (3 in-game days; matches `DRAW_TOGETHER_DURATION_TICKS`) |
| `REUNITE_COMPAT_BONUS` | `+0.3` | Compatibility bonus for pairs sharing the disbanded roster |
| `SUNDER_DURATION_TICKS` | `24` | Amplification window (matches Bless duration — symmetric counterpart) |
| `SUNDER_COHESION_DELTA` | `-0.15` | Immediate cohesion hit at cast (mirror-magnitude of Bless +0.2, slightly gentler) |
| `SUNDER_DISSENT_MULT` | `2.0` | Dissent cohesion-hit multiplier during the window |
| `SUNDER_LEAVE_MULT` | `2.0` | Leave-decision probability multiplier during the window |

*(Essence costs + reach/sphere prerequisites set by the executor against the divine-economy scale, mirroring Bless/Draw Together's costs for symmetry: Reunite ≈ Draw Together, Sunder ≈ Bless.)*

## Tracing

N/A — no new trace types: casts emit existing action traces; window effects surface through existing `group_phase` aggregate fields and event-scale formation/dissolution traces. If the aggregate needs a `sunderedGroups`/`reuniteWindows` count field, extend the existing interface (verify with `tsc -b`, Omit-collapse quirk).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Reunite target's roster has < `GROUP_MIN_MEMBERS` living un-grouped members | Template eligibility filters the target out — card not offered; if state changes mid-window, window continues harmlessly (formation threshold simply never clears) |
| Reunion anchor dies mid-window | Re-anchor to next roster member; if none, window lapses with chronicle entry |
| Sunder cast on a company that dissolves the same tick | Window property written to an already-disbanded node is inert — reads gate on `groupStatus: 'active'` |
| Both windows on one node (Bless + Sunder) | Independent multipliers both apply; no cancellation logic |
| Re-cast during an open window | Timestamp refreshes (extend), deltas do not re-apply beyond the cast-time hit |
| Missing/NaN window timestamp | Treated as no window (existing `isGroupBlessed` guard pattern) |

## Interface impact

*(Step 0.7 — Companies subsystem contracts registered by THR-74. Executor updates `scripts/interface-contracts.ts` in the same PR.)*

| Contract | Action | Producer → Consumer | Notes |
|---|---|---|---|
| Company cohesion/dissolution/formation contracts (LIVE, THR-74) | **extend** | two new writers (cast effects) → existing phase reads | Window properties documented in `GroupNodeProperties`; grep keys `isGroupSundered`, `reuniteUntilTick` |
| Beat grants → UAT availability (LIVE) | **extend** | two new grant rows → drawer | Verified via `listUnreachableActions()` |
| Fray drama pool (ships with THR-74 remainder) | **extend (consumer note)** | Sunder window → pool eligibility | If THR-74's pool lands first (expected — sequencing), this is one extra eligibility read; the dependency is the reason for the blocked-by |

## Blast Radius

*Omitted — no ≥100-importer file touched (`group-constants.ts`, `groupQueries/Formation/Cohesion/Dissolution.ts`, `unified-action-templates.ts` data, prose content files, `debug-bridge.ts` — none on the CLAUDE.md list; `unified-action-templates.ts` is a data file, not `src/types/unifiedAction.ts`).*

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No premise contradicted — both verbs are probability-tilting (bias windows, never commands: mortals still choose to walk the road or stay), the exact test `Vision/02-non-negotiables.md` #1 (god-not-protagonist / soft power) prescribes; the cast-vision-then-watch-them-travel texture implements `Vision/00-north-star.md`'s "intervention shifts odds, not outcome" moment; memory-as-actionable-history deepens persistence; Sunder keeps failure-is-plot (its output IS drama scenes).
- [x] No Vision edit required.

## Rulebook impact

- [x] Adds two action verbs — a rules-of-play touch. The rulebook's company subsection (written by THR-74's remainder) gains the two verbs; executor adds them `[IMPL]` in the same PR. If THR-74's subsection hasn't landed yet at pickup, this PR writes the verbs into wherever that subsection lives by then (sequencing makes this moot — blocked-by THR-74).
- [x] `Docs/canon/rulebook.md` update in executor scope.

> Brainstorm companion: `Docs/plans/2026-07-24-reunite-sunder-company-actions-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 6 named constants; costs data-side |
| 2. Inspectability | PASS | Windows visible in `getGroups()`; effects flow through existing traced phases |
| 3. Determinism | PASS | Deterministic multipliers on existing seeded rolls; no new RNG streams |
| 4. Fail-soft | PASS | 6-row table; window properties inert on wrong-status nodes |
| 5. Narrative over mechanical perfection | PASS | Both verbs route into authored moments; sphere-flavored cast prose; the tug-of-war (Bless vs Sunder) is deliberately un-resolved mechanically |
| 6. Additive over destructive | PASS | Two properties + reads; nothing modified destructively |
| 7. Performance budget | PASS | Window reads are O(1) property checks inside already-running sub-steps |

## Done when

- [ ] CLI/`fireAction` probe: Reunite on a disbanded company (spawn/dissolve one via eval if needed) shows convergence + re-formation (or window-lapse chronicle) across a `tick N` run; Sunder on an active company shows the cohesion hit + amplified leave/dissent in `getGroups()` — paste output
- [ ] Both cards beat-granted; `listUnreachableActions()` does not list them; both castable in-browser (Playwright screenshot of the drawer cards at 1920×1080 + console; sim via `window.__DEBUG.tick(n)` only)
- [ ] Card art present in both parallel maps (`ActionCard.tsx` + `codexRegistry.ts`)
- [ ] Interface rows extended with both-side symbol hits; rulebook verbs added `[IMPL]`
- [ ] 30-tick CLI smoke clean; `npm test`, `npx vite build`, typecheck ratchet, generated-freshness pass
- [ ] Closing commit + PR body carry the closing keyword for THR-732 (line-anchored, per the THR-738 discipline)

## Coordination block

**Suggested model:** sonnet — pattern-following extension work (window properties mirroring Bless) with all design calls made.

**Parallel-safe with:** docs/UL/infra tickets.

**Mutex with:** **THR-74 remainder (hard blocked-by — do not pick up until THR-74 is Done):** needs Draw Together's convergence machinery, the fray drama pool, the Company UI surfaces (PR 3), and the rulebook subsection. Also THR-736/THR-719/THR-737 (template registry / effects surface overlap).

**Files to touch:**
- Create: `src/data/group-reunite-content.ts` (+ Sunder lines), tests for windows/eligibility
- Edit: `src/data/unified-action-templates.ts` (2 UATs), `src/data/group-constants.ts` (6 constants), `src/engine/groups/groupQueries.ts` (`isGroupSundered`, window fields in `GroupNodeProperties`), `groupFormation.ts` (compat bonus + convergence read), `groupDissolution.ts`/`groupCohesion.ts` (multiplier reads), beat-grant data, graph-executor case, `src/debug-bridge.ts` (+`.d.ts`) passthrough, `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`, action-card art maps

## Notes for the executor

- **Kill criteria (tuning tripwires):** if playtest shows Reunite re-forming companies near-instantly, halve `REUNITE_COMPAT_BONUS` / lengthen the window — the journey is the story. If Sunder dissolves companies within a couple of ticks, soften `SUNDER_LEAVE_MULT` — its output should be scenes first, dissolution second. If THR-74's fray pool lands with a different eligibility shape than assumed, adapt the one Sunder read site to whatever shipped.
- **Re-grep substrate symbols at pickup** — the pre-flight cites symbols, not line offsets (they rot); all were source-verified 2026-07-24.
- File the Reunite/Sunder UL terms into the THR-734 authoring batch (or a follow-up UL-proposal) at implementation.
- **Do not build a separate convergence mechanism** — Reunite consumes Draw Together's (that machinery shipping first is what the blocked-by guarantees).
- **No Bless/Sunder cancellation logic** — coexisting windows are intended (the tug-of-war reads as divine contest).
- Player-cast resolution: follow whatever THR-728 has made current — no special-casing these two cards either way.
- "Party" never appears player-facing; the generated name + "company" only (THR-734 terms).

## Intent-judge verdict

**Allow** (2026-07-24, cold-boot Opus judge). All 11 dimensions PASS, 0 GAPs, 0 VIOLATIONs; impact class confirmed Reversible; all 11 substrate symbols independently verified against source; the action-catalog-design three gates each confirmed satisfied ("the anti-THR-614 pattern done correctly"). Non-blocking notes applied: stale line-number citations replaced with symbol-only refs; kill criteria lifted into the executor notes. Proposal: `Docs/plans/.intent-proposals/2026-07-24-reunite-sunder-company-actions.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-24*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | 6 named constants; essence costs deferred with an explicit mirroring rule, not left unspecified |
| 2. Inspectability | PASS | `getGroups()` window passthrough; effects flow through existing traced sub-steps and aggregate fields |
| 3. Determinism | PASS | No new PRNG streams — deterministic multipliers read by existing seeded rolls |
| 4. Fail-soft | PASS | 6-row table; window properties inert on wrong-status nodes (`blessedUntilTick`/`isGroupBlessed` precedent verified) |
| 5. Narrative over mechanical | PASS | Verbs route into existing authored moments; Bless/Sunder coexistence deliberately unresolved narrative tension |
| 6. Additive over destructive | PASS | Two property fields + read-only hooks; no signature changes |
| 7. Performance budget | PASS | O(1) property checks inside already-running sub-steps |

NFP AUDIT: PASS [design-brief-stale — audited against CLAUDE.md § NFPs]

### Three-pillar audit

| Pillar | Verdict | Note |
|---|---|---|
| Engine | PASS | Systems design, phase reuse, resolution, PRNG all present and honest ("none added") |
| Content | PASS | Prose + data tables present; templates/attachments N/A with rationale (routes into existing moments) |
| UI | PASS | Playwright named; display/notifications/debug present; map N/A with rationale |

No missing required sections; Blast Radius correctly omitted (auditor-verified against the high-impact list); Substrate inventory correctly points at the Pre-flight table. Substrate check: every cited symbol independently grep-verified. Auditor note: `Docs/canon/systems-inventory.md` carries **no Companies/Groups row** (generator coverage gap, not a plan defect) — follow-up filed as its own ticket.

PILLAR AUDIT: PASS-with-notes

### Vision audit

No contradictions found. Mechanism is bias-only (compat bonus, multipliers, convergence pull) — mortals retain choice, matching non-negotiable #1 (soft power) and the north-star "shifts odds, not outcome" line; core loop untouched (no new encounter templates — routes into existing moments); design tensions consistent; taste-profile unverifiable (absent from worktree). Citation note applied: Vision paths now cited in the plan's Vision-audit section.

VISION AUDIT: PASS-with-notes
