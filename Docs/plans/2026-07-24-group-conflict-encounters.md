> **title:** `Group-vs-group conflict encounters — THR-731`
> **linear_issue:** THR-731
> **author:** `Claude Code`
> **created:** 2026-07-24
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Group-vs-group conflict encounters — THR-731

*Companies get enemies their own size: NPC bands that roam, defend, and fight back — resolved as two sides of one contested encounter, not a war and not a stat check.*

**Origin (user, 2026-07-23 grill Q5/Q11):** the assassins-guild fantasy — "the player encourages a group of adventurers where they are threaded to a member to topple a local assassins guild through conflict with the group of NPC assassins that represent that guild" — split from THR-74 with the schema seam and NPC spawner deferred here.

## Substrate inventory

*(Step 0.6 — grep evidence 2026-07-24. The substrate check flipped this design's two biggest assumptions:)*

- **Opposed resolution ALREADY EXISTS:** the contested-pair machinery (TB-044) — `detectContestations(completing, templates)` finds attacker/defender pairs among completing actions, `resolveContestationPair` resolves both sides, and the outcome ladder already carries **`contested_won` / `contested_lost`** (`unifiedActionResolution.ts:2355–2435, 2134–2157`). Group-vs-group is **an extension of contested pairs**, not a new resolution system.
- **The band's node shape ALREADY EXISTS:** `groupType: 'faction_band'` shipped in THR-74 PR 1 (`groupQueries.ts:GroupNodeProperties`), and `createGroup` (`groupFormation.ts:187`) is composition-agnostic — THR-74's plan carried a grep-honest note that nothing assumes threaded members. NPC bands are `faction_band` groups of existing NPC agents; **no new groupType, node type, or edge type**.
- **Spawner hooks exist:** monster factions with lairs (`monsterFactionSeed.ts:39` writes `monsterFactionId` onto lairs) and a live escalation phase (`phaseLairEscalation`, `lairEscalation.ts:244`, 423 lines); guild/faction membership + `phaseFactionActions` for mortal-faction response. Both spawner triggers are thin calls into the shipped `createGroup`.
- **Standing group rivalry:** `hostile_to` edge (inter-actor hostility, `graph.ts:67`) — groups are actor nodes, so it applies as-is. **No `opposes` edge type needed** (the ticket's "if traversal is needed" question resolves to reuse).
- **The `opposingGroupId` seam was NEVER IMPLEMENTED:** grep across `src/` returns **zero hits** — THR-74's plan specified it but no PR added it. This plan **adds** the typed optional field (it does not "populate" an existing one) as the pairing hint on seeds/action context.
- **Company-side strength math shipped:** best-member + capped assist (`resolveGroupStep`, PR 2a) — the contested extension reuses it for *both* sides.
- Systems-inventory cross-check: War/Armies is the only conflict subsystem listed (army-scale, hex-anchored battle nodes with momentum — `battleResolution.ts`); company-scale conflict per the grill verdict composes with the sigmoid → d100 encounter ladder instead. Armies untouched.

**Verdict: extends** contested pairs, the group layer, lair escalation, and faction actions; **adds** the seed-level pairing field and thin spawner triggers; **replaces nothing**; armies and battles untouched.

## Why this is load-bearing

THR-74 shipped companies that delve, travel, and fray — but their world contains no opposition at their scale: monsters are encounter furniture, hostile factions act through abstract actions or full armies. The user's founding fantasy for this arc is company-vs-band conflict. This ticket makes companies *contested*: bands roam out of lairs, guard what the player's mortals covet, and strike back — turning the company layer from a traversal mechanic into a stakes engine, and giving Sunder (THR-732) and the drama catalog (THR-733) enemies worth the name.

## Engine pillar

### Systems design

**1. Band spawner (two thin triggers into `createGroup`):**
- **Lair bands:** `phaseLairEscalation` gains a stage-gated trigger — a lair at/above `BAND_SPAWN_LAIR_STAGE` with ≥`GROUP_MIN_MEMBERS` living monster-faction members spawns a `faction_band` group (`bandRole: 'raider'`), leader = highest-capability member, `pursues` the lair faction's ambition. Cap: `MAX_ACTIVE_BANDS_PER_FACTION`. Roaming rides shipped `faction_band` movement (faction-objective mode).
- **Guild response bands:** when a mortal faction's holding (guild hall, controlled location) is targeted by a company's hostile action (see pairing), `phaseFactionActions` may form a defender band from colocated members (`bandRole: 'defender'`), roll-gated by `GUILD_BAND_RESPONSE_CHANCE`. This is the assassins-guild half: the guild fights through its people, and the band's members are *real named agents* — killing them is killing the guild.

**2. Opposed pairing (the seam, implemented):** `PendingEncounterSeed` and the unified action context gain typed optional `opposingGroupId?: string`. Written by: (a) confrontation-template seeding when a hostile band shares the hex (hex-granular awareness, existing rule); (b) guild-response formation (the defender band pairs against the triggering action); (c) lair-assault templates seeded with the lair's band. `detectContestations` gains a group-opposition detector: a completing group-action whose context carries a living, active `opposingGroupId` synthesizes the opposing side (the band's counter-action from `BAND_COUNTER_TEMPLATES` by `bandRole`) and emits a contested pair.

**3. Opposed resolution:** `resolveContestationPair` composes each side's per-step strength via the shipped company math (best member for the step's Reach + capped assist — bands use the identical path; they are groups). Margin lands on the existing `contested_won`/`contested_lost` outcomes; step ops fire per side as today. Consequences: winner `GROUP_COHESION_CONTEST_WON_DELTA`, loser `GROUP_COHESION_CONTEST_LOST_DELTA`; losing side's acting member takes the existing step-consequence path (injury/condition — the same channel solo failures use); on decisive loss (`contested_lost` at crit band) a band member may die (`BAND_CASUALTY_CHANCE`, seeded roll) — real named agents, real graph deaths. Mutual `hostile_to` edge written between the groups on first engagement (standing rivalry; read by future pairing for grudge-priority).

### Graph nodes / edges

No new node types, edge types, groupTypes, or ActorTypes (see Substrate inventory). New documented property-bag fields: `bandRole: 'raider' | 'defender'` on band group nodes; `opposingGroupId?` on seeds/action context (typed, this plan's addition).

### Tick phases

**None added.** Spawner triggers live inside existing `phaseLairEscalation` and `phaseFactionActions`; pairing and resolution live inside existing `phaseUnifiedActionProgress` (Phase 3 contestation). Band upkeep/movement/dissolution ride existing `phaseGroups` (bands are groups).

### Resolution logic

Contested pairs as above. Threat interaction: bands carry threat ratings via the existing threat system reads on their members (no new threat machinery); company decision-making already weighs threat in movement — a band on a hex is visible danger. Fail-soft: a pair whose opposing group dissolved/emptied before resolution degrades to the uncontested path (PR 2a behavior) — conflict never blocks resolution.

### PRNG callouts

Seeded streams for: spawn rolls (`bands.spawn`), counter-template pick (`bands.counter`), casualty roll (`bands.casualty`). No `Math.random()`.

## Content pillar

### Encounter templates

**Confrontation family (4 authored, group-exclusive via the shipped converter override — `actorAffinities: ['group']`, `minGroupMembers: 2`, each carrying opposed-pairing eligibility):**
1. **The Ambush** — band-initiated on a travelling company (raider bands)
2. **Den Assault** — company assaults a lair band in its lair
3. **The Guild Falls** — company vs guild defender band at the guild's holding (the assassins-guild capstone; on `contested_won`, existing faction-consequence machinery degrades the guild: leader exposure, holding loss via existing graph ops)
4. **The Standoff** — non-lethal contest (drive-off/intimidation) — the low-violence rung so conflict isn't only slaughter

**Band counter-templates (2):** `band.defend` / `band.raid` — the synthesized opposing actions, per `bandRole`.

### Prose tables

Confrontation prose written multi-protagonist (best-member substitution puts different companions in `{actor}` per step, opposing band named via `{target}`/cast slots — declared keys always resolve, THR-696). Band name generation rides the shipped group name generator with faction-flavored grammars ("The {faction}'s Knives"). Chronicle entries for band spawn (rumor-flavored), engagements, band destruction.

### Attachment content

N/A — no new items (loot from band defeats rides existing reward-pool machinery untouched).

### Data tables

Constants below in `group-constants.ts` (band section). Counter-templates in the confrontation content file, not the CRUD registry.

## UI pillar

*Screenshot tools: **Claude-in-Chrome** for the map (WebGL — bands render via THR-74 PR 3's cluster with the neutral glyph already specced for unthreaded groups); **Playwright** for encounter/DOM surfaces. 1920×1080.*

### Player-facing display

- **Map:** bands are clusters with the **neutral** bond glyph (the gold-vs-neutral split was designed into PR 3 precisely for this — no new visual language). Fog rules as usual.
- **Encounters:** confrontations read as normal encounters with the opposing band named throughout; contested outcomes render via the existing outcome bands (`contested_won`/`lost` already have display strings, `unifiedActionResolution.ts:2156–2157`).
- **Company panel (PR 3's Company section):** a "Rivals" line when a `hostile_to` group edge exists — prose ("Blood between them and the Ashen Knives"), no numbers.

### Event notifications

Existing channels: band-spawn chronicle/rumor entry, engagement narrative events, band-destroyed chronicle beat. Threaded-company engagements surface in the event feed (existing significance routing).

### Debug inspection (DebugPanel)

`getGroups()` already lists bands (they are groups) — add `bandRole` passthrough. CLI `groups` likewise. `spawn band <factionDefId> --hex c r` debug/CLI command for deterministic testing (mirrors `spawn npc`).

### Visual presence (HexMapV2)

Covered above — reuses PR 3's cluster with the neutral glyph; no new layers.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new phases or GameState fields; one new CLI/debug spawn command (player-controls row unchanged).

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Lair band trigger | existing `phaseLairEscalation` | map cluster (neutral) | — | `band_spawned` (event-scale) | `getGroups()` |
| Guild response trigger | existing `phaseFactionActions` | map cluster | — | `band_spawned` | `getGroups()` |
| Pairing (`opposingGroupId` + detector) | existing `phaseUnifiedActionProgress` Phase 3 | encounter surfaces | — | existing contested traces + `opposingGroupId` field | trace viewer |
| Opposed strength + consequences | `resolveContestationPair` | outcome display (existing bands) | — | existing resolution traces | `getGroups()` cohesion |
| Confrontation content | via seeding/candidates | encounter UI | — | — | CLI `encounters` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `BAND_SPAWN_LAIR_STAGE` | `3` | Minimum lair escalation stage before raider bands spawn |
| `BAND_SPAWN_CHANCE` | `0.15` | Per-eligible-tick spawn roll at/above the stage |
| `MAX_ACTIVE_BANDS_PER_FACTION` | `2` | Cap on concurrent bands per monster/guild faction |
| `BAND_SIZE_MIN` / `BAND_SIZE_MAX` | `3` / `6` | Members drawn into a spawned band |
| `GUILD_BAND_RESPONSE_CHANCE` | `0.5` | Chance a targeted guild forms a defender band |
| `GROUP_COHESION_CONTEST_WON_DELTA` | `+0.08` | Winner cohesion gain |
| `GROUP_COHESION_CONTEST_LOST_DELTA` | `-0.12` | Loser cohesion hit |
| `BAND_CASUALTY_CHANCE` | `0.35` | Chance a decisive loss kills a losing-side member |

## Tracing

One new event-scale trace type (rare events — same class as `group_formed`):

```ts
// BandSpawnedTrace — one per band spawn (lair or guild response)
interface BandSpawnedTrace {
  type: 'band_spawned';
  tick: number;
  groupId: string;
  factionId: string;
  bandRole: 'raider' | 'defender';
  memberIds: string[];
  sourceLairId?: string;
}
```

Contested engagements ride the existing contested/resolution traces with the `opposingGroupId` context field added (extend existing interfaces; verify with `tsc -b` — Omit-collapse quirk). No per-tick aggregate needed (band upkeep is inside the existing `group_phase` aggregate).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `opposingGroupId` names a dissolved/missing/empty group at resolution | Degrade to uncontested resolution (PR 2a path); log once |
| Band spawn with < `GROUP_MIN_MEMBERS` eligible NPCs | No spawn; retry next eligible tick |
| Counter-template missing for a `bandRole` | Default to `band.defend`; warn once |
| Casualty roll selects an already-dead member | Skip; no double-death |
| Both groups dissolve mid-engagement | Pair dropped; actions resolve uncontested |
| Guild response trigger with no colocated members | No band; the action proceeds uncontested (a hollow guild cannot fight) |

## Interface impact

*(Step 0.7 — Companies contracts are registered; Encounters core still audit-on-touch. Executor updates `scripts/interface-contracts.ts` in the same PR.)*

| Contract | Action | Producer → Consumer | Notes |
|---|---|---|---|
| `company-gates-exclusive-content-reachability` (🟢 LIVE) | **preserve/extend** | confrontation family joins the delves | Same predicate path |
| Contested-pair resolution (TB-044, unaudited) | **extend + write rows** | group-opposition detector (new producer) → existing pair resolver | Audit-on-touch: this plan's rows; grep keys `detectContestations`, `opposingGroupId` |
| `opposingGroupId` seam | **add (implemented here — never shipped by THR-74)** | seeding/formation writers → contestation detector | The THR-74 plan's deferred row lands as LIVE with both-side symbols in this PR |
| Lair escalation (unaudited) | **extend + write row** | band trigger (new consumer of stage state) | Audit-on-touch |
| `hostile_to` edges | **extend** | engagement writer → pairing grudge-priority + Rivals line | Existing edge, new group-scale writers/readers |
| Beat grants / UATs | **preserve** | — | No new player cards in this ticket |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | Additive optional `opposingGroupId?` on seed/context types only — compile-safe by construction; verify with `tsc -b` net-new diff |

*(All other touched files — group modules, lair/faction phases, `unifiedActionResolution.ts`, content files — are below the 100-importer bar.)*

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No premise contradicted. **Mortal-loop bridge (the check that matters for a conflict system):** every engagement is mortal-scale — spotlight steps name company members, casualties are named agents, the fray/Parting drama machinery fires on threaded members after losses, and The Guild Falls resolves the player's founding fantasy through their mortal's hands. Bands never become abstract armies; the player fights people, not bars.
- [x] No Vision edit required. (Soft-power preserved: the player still acts through Bless/Draw Together/Sunder and their mortals' choices — this ticket adds no direct-command surface.)

## Rulebook impact

- [x] Adds a rule of play: contested group engagements (`contested_won`/`contested_lost` extended to company scale) and NPC bands. Executor extends the rulebook's company subsection (`[IMPL]`) in the same PR.
- [x] `Docs/canon/rulebook.md` update in executor scope.

> Brainstorm companion: `Docs/plans/2026-07-24-group-conflict-encounters-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 9 named constants; counter-template choice is data |
| 2. Inspectability | PASS | `band_spawned` trace + existing contested traces with pairing context; `getGroups()` covers bands |
| 3. Determinism | PASS | Three named seeded streams; contested math deterministic |
| 4. Fail-soft | PASS | 6-row table; every degenerate pair degrades to uncontested, never blocks |
| 5. Narrative over mechanical perfection | PASS | Standoff rung (`Vision/02-non-negotiables.md` #2), named casualties, grudge edges, guild-falls capstone — conflict always narrates |
| 6. Additive over destructive | PASS | No schema changes beyond additive optional fields/properties; armies/battles untouched |
| 7. Performance budget | PASS with note | Pairing detector is O(completing group-actions); spawner is stage-gated + capped; verify via 60-tick CLI smoke (bands need runway to spawn) |

## Done when

- [ ] 60-tick CLI run (medium map) shows ≥1 `band_spawned` (or via `spawn band` if base rates make 60 flaky — predicate: the trigger fires, evidence pasted) and a band roaming as a group in `groups`
- [ ] A contested engagement resolves: company action + band counter-action produce `contested_won`/`contested_lost` with both sides' company math visible in the trace (`opposingGroupId`, both `groupId`s); cohesion deltas + consequence (injury/casualty) observed
- [ ] Degenerate pair (opposing group dissolved pre-resolution) degrades to uncontested — test-locked
- [ ] The Guild Falls: full loop demonstrated headlessly (guild band forms on threat → company wins → faction consequence ops fire)
- [ ] Map: band cluster renders with neutral glyph (Claude-in-Chrome screenshot at 1920×1080); company panel Rivals line (Playwright); console output; sim via `window.__DEBUG.tick(n)` only
- [ ] Interface rows written (contested-pair + lair rows are audit-on-touch firsts); `opposingGroupId` row LIVE with both-side symbols
- [ ] 30-tick smoke + `npm test` + `npx vite build` + typecheck ratchet + generated-freshness + rulebook update
- [ ] Closing commit + PR body carry the closing keyword for THR-731 (line-anchored, THR-738 discipline)

## Coordination block

**Suggested model:** opus — cross-cutting engine extension (contestation, two phase triggers) + content + WebGL verification.

**Parallel-safe with:** docs/UL/infra tickets.

**Mutex with:** **THR-74 remainder (hard blocked-by — needs PR 3's cluster for band rendering and benefits from the fray pool)**; THR-732 (both extend group modules — preferred order 74 → 731 → 732 or 74 → 732 → 731, either works, not simultaneous); THR-736/719/737 (template/effects surfaces).

**Files to touch:**
- Create: confrontation content file (4 templates + 2 counter-templates), band prose/name grammars, tests (pairing, degradation, spawner, casualty determinism), CLI `spawn band`
- Edit: `src/types/unifiedAction.ts` (optional `opposingGroupId?`), `unifiedActionResolution.ts` (detector + opposed strength in `resolveContestationPair`), `lairEscalation.ts` + `phaseFactionActions.ts` (thin triggers), `groupQueries.ts` (`bandRole` field), `group-constants.ts` (band section), trace interfaces, `src/debug-bridge.ts` (+`.d.ts`), `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`, wiring checklist

## Notes for the executor

- **Do not touch armies/battles** — company conflict composes with the encounter ladder (grill verdict); the momentum-battle system is the wrong scale and stays untouched.
- **Do not invent an opposed-resolution system** — extend `detectContestations`/`resolveContestationPair` (TB-044). The outcomes already exist.
- Bands are ordinary groups: they fray, dissolve, and Part like companies (all shipped machinery) — resist special-casing them out of `phaseGroups`.
- `opposingGroupId` never shipped despite the THR-74 plan naming it — you are *adding* the field, not finding it.
- The Standoff exists so band conflict has a non-lethal rung — don't cut it for scope; cut The Ambush first if squeezed (raider aggression can arrive via a follow-up).

## Intent-judge verdict

**Allow** (2026-07-24, cold-boot Opus judge). All 11 dimensions PASS, 0 GAPs, 0 VIOLATIONs; impact class confirmed Reversible. All three core substrate claims independently verified: contested-pair machinery confirmed in source; the `opposingGroupId` zero-hits negative confirmed ("the 'never implemented' claim is correct"); `faction_band`/`createGroup`/spawner hook files confirmed. Substrate dimension rated "exemplary — this is the dimension that caught THR-614." Two non-blocking observations recorded (the ticket description's stale seam assumption is corrected in-plan; the `opposes`-edge question resolves to `hostile_to` reuse). Proposal: `Docs/plans/.intent-proposals/2026-07-24-group-conflict-encounters.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-24*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | 8-row constants table, each named with default + purpose; counter-template choice is data |
| 2. Inspectability | PASS | `BandSpawnedTrace` in full; contested traces extended with pairing context; `getGroups()`/CLI cover bands |
| 3. Determinism | PASS | Three named seeded streams; explicit no-`Math.random()`; reuses deterministic company-strength path |
| 4. Fail-soft | PASS | 6-row table; every degenerate case degrades to the uncontested path, never blocks |
| 5. Narrative over mechanical | PASS | Non-lethal Standoff scope-protected; named casualties; Guild Falls ties outcome to prose consequence |
| 6. Additive over destructive | PASS | Zero new node/edge/groupTypes; additive optional fields; armies untouched |
| 7. Performance budget | PASS with note | Reasoned not profiled — appropriate pre-implementation; 60-tick smoke is the check |

NFP AUDIT: PASS-with-notes [design-brief-stale — audited against CLAUDE.md § NFPs]

### Three-pillar audit

| Pillar | Verdict | Note |
|---|---|---|
| Engine | PASS | All five subsections present incl. 3 named PRNG streams |
| Content | PASS | 4 + 2 templates, prose tables, N/A justified, data tables |
| UI | PASS | All four subsections; screenshot tools named per surface |

No missing required sections (Blast Radius present for the 278-importer file). Wiring: every new module points at an existing phase, no orphans. Substrate check: section opens the doc with file:line evidence; independently cross-checked against the systems inventory — only War/Armies carries "conflict" in its synonyms; the plan's claim verified accurate.

PILLAR AUDIT: PASS

### Vision audit

Premises: mortal-as-person (named casualties, spotlight steps), core loop (ordinary curated encounters, no new beat), non-negotiables #1/#4/#6/#7, design tensions #2/#3 — all confirmed or consistent. No contradictions found. Scale discipline PASS (armies excluded, both sides company-scale); world-runs-without-you PASS (autonomous spawners); citation note applied (non-negotiable #2 pointer added to the NFP table).

VISION AUDIT: PASS-with-notes
