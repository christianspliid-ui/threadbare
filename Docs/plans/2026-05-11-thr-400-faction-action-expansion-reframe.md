# THR-400 — Faction Action Expansion (Reframe Pass)

**Date:** 2026-05-11
**Linear:** [THR-400](https://linear.app/threadbare/issue/THR-400) — *Faction action expansion — add 6–8 governance verbs*
**Project:** Social Systems Expansion (Now / High)
**Parent:** [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
**Replaces:** Original issue body (8-verb design, blocked by Vision audit 2026-05-11)
**Brainstorm companion:** `Docs/plans/2026-05-11-thr-400-faction-action-brainstorm.md`
**Audit being answered:** `Docs/audits/2026-05-11-thr-400-vision-audit.md`

## 0. Reading the audit forward

The vision audit's verdict was "back to In Design — renarrow." This plan ships **four verbs** instead of eight, every one of them riding existing substrate that has been Codesight-verified. Schism, Reveal Corruption, Anoint Successor, and Sanction Mission (renamed Kindle a Calling) are deferred to their own design tickets — each of those carries a non-trivial subsystem build (faction-split, hidden-state schema + suspicion mechanic, succession edges, internal-pressure resolver) that does not belong inside a "catalog expansion" issue.

The four shipped verbs are: **Stir Dissent**, **Whisper to the Leader**, **Recover Doctrine**, **Surface a Doubter**. They cover three of the original four shapes (fracture / redirect / elevate / expose). The fourth — fracture-by-schism — is dropped from this pass; Stir Dissent already provides the player a fracture handle (smaller and reversible) without needing to invent the faction-split subsystem.

Every verb in this plan answers the three audit questions explicitly:
1. **Substrate it rides** — verified in §2 via Codesight pre-flight.
2. **Prose surface (IPK / chronicle band)** — specified in §8 with sample text in Threadbearer voice.
3. **Mortal-loop bridge** — specified per-verb in §5; each verb plants an `encounter_seed` on a named portfolio mortal who the player has already bonded with, so the verb's narrative payload always lands on someone the player can grieve.

## 1. Codesight pre-flight (Blast Radius)

**Files to touch:**

| File | Importer count | Risk note |
|------|---------------:|-----------|
| `src/data/unified-action-templates.ts` | not in CLAUDE.md high-impact list (≈30) | additive — four new template entries; no edits to existing entries |
| `src/engine/factionNetwork.ts` | ≈25 | additive — new helper `getDoubterCandidate(graph, factionId)` |
| `src/engine/phaseFactionActions.ts` | ≈8 | additive — new dissent decay block in existing tick phase |
| `src/types/faction.ts` | ≈40 | additive — three optional properties on faction node `properties` (no interface change) |
| `src/types/trace.ts` | 156 | additive — four new trace types (one per verb); follow existing FactionActionTrace pattern |

No file with ≥100 importers is structurally edited. `traits.ts` (156 importers) gains only additive trace types in a discriminated union. **No Blast Radius escalation section required.**

**Substrate rideability check** (every claim below was verified before authoring):

| Claim | Where it lives | Verified |
|------|----------------|----------|
| Factions are graph nodes with `actorType: 'faction'` | `src/engine/factionNetwork.ts:128–131` | ✅ |
| Members link via `member_of` edges with `reputation`, `role`, `rank` | `src/engine/factionNetwork.ts:159–161` | ✅ |
| Leader is resolved from highest-`leadershipScore` non-army member | `src/engine/factionNetwork.ts:163–164` | ✅ |
| `conclaveLeverageShift` is a working graph mutation pattern | `src/data/unified-action-templates.ts:761–765` (`action.divine-edict`) | ✅ |
| `FactionManipulateEffect` exists with `shift_relationship` / `splinter` / etc. | `src/types/effects.ts:172–178, 589–601` | ✅ |
| `encounter_seed` aftermath effect is the canonical follow-on mechanism | `Docs/plans/2026-04-16-systemic-wiring-guide.md` Capability 2; ≥10 in-tree uses (arcane-circle, army content) | ✅ |
| Agents carry axiological profiles readable for alignment checks | `Docs/plans/2026-04-16-systemic-wiring-guide.md`; `motivations` field on every action template | ✅ |
| Factions carry `reputationAlignment: Partial<Record<ReachDomain, ReputationPolarity>>` | `src/types/faction.ts:124–125` | ✅ |

**Substrate that does NOT exist and is NOT built in this issue:**

- Faction-split subsystem (`splinter` exists as a `FactionActionType` but spawning a new `FactionDefinition` at runtime is unverified beyond `dynamicFactionDefinitions`; deferred to Schism's own ticket).
- Hidden corruption schema. No `corruptionRevealed: true` flag, no suspicion mechanic. Deferred to Reveal Corruption's own ticket per audit requirement.
- Succession edges (`will_succeed: agent → agent`). Deferred to Anoint Successor's own ticket.
- Internal-pressure resolver (selects which latent faction goal rises when essence is poured in). Deferred to Kindle a Calling.

These deferrals are filed as separate Linear issues at the end of this doc (§14) so they do not vanish.

## 2. The 2026-05-04 direction — settled

The audit raised the question: does the 2026-05-04 encounter-experience direction ("verbs are encounter-specific, anchored in the cosmological pattern") retire global `UnifiedActionTemplate` entries at faction scale?

**Answer: no.** Global templates remain valid at faction scale because:

- The 2026-05-04 direction is about **what the player reads inside an encounter scene** — the per-scene god-verb on a choice card (`"Stir her resolve"`, `"Speak when not asked"`). Layer 1 prose, encounter-specific.
- Faction-scale interventions happen from the **strategic layer** (action drawer on a faction target), not inside an encounter scene. There is no scene to author per-verb prose into; the player picks the verb from a drawer and the system answers with an encounter on a portfolio mortal.
- The bridge is exactly the requirement the audit imposes: every faction verb in this plan **plants an encounter seed**. The strategic-layer verb fires from the drawer; the encounter that runs on the affected mortal carries the per-scene god-verb authored in encounter content. So both directions of `2026-05-04 §10.4` are honored — global at the strategic layer, per-scene at the encounter layer.

**Where global stops and per-scene starts:** the strategic-layer verb names the *target* of the divine action (this faction). The per-scene god-verb names the *mortal action* in the resulting encounter (Kael's choice to speak or stay silent at the conclave). Both layers exist; neither replaces the other.

## 3. Non-Negotiables compliance

| Non-negotiable | Issue raised in audit | Resolution in this plan |
|----------------|----------------------|-------------------------|
| #1 Player is a god, not a protagonist | `sanction_mission` violated it | Verb dropped; deferred to "Kindle a Calling" ticket which amplifies internal pressure, never names it |
| #2 The thread is the substrate | — | Mortal-loop bridges in §5 ensure every verb fires through a threaded mortal |
| #3 All mechanics surface through prose | "engine mutations spec'd, prose not" | §8 specifies IPK surface + chronicle band + encounter prose per verb |
| #4 The world simulates around the player | — | Verbs read existing faction state; do not fabricate (Surface a Doubter is conditional on real axiological misalignment) |
| #5 Vision edits ride with the design | — | No Vision page change required; this plan rides existing premises |

## 4. The four verbs at a glance

| Verb | Shape | Reach | Sphere | Cost | Rarity | Substrate riden |
|------|-------|-------|--------|-----:|-------:|-----------------|
| Stir Dissent | fracture | shadow | chaos | 8 | 2 | new `dissentLevel` property + existing conclave system |
| Whisper to the Leader | redirect | heart | spirit | 6 | 2 | existing leader resolution + persuasion influence model |
| Recover Doctrine | elevate | star | mind | 8 | 2 | existing ruin discovery + new `recoveredDoctrineId` property |
| Surface a Doubter | expose | eye | spirit | 8 | 2 | existing axiological profiles + faction `reputationAlignment` |

All four are rarity 2 (Storied) — the Tier 4 capstones live in Schism / Anoint Successor / Kindle a Calling, which are deferred. Reach distribution (shadow / heart / star / eye) is deliberately spread across moral axes so the verbs do not over-concentrate one archetype's drift.

## 5. Per-verb design

### 5.1 Stir Dissent — `action.faction.stir_dissent`

**Player reads:** *"You press a low cold breath into the faction's deliberations. Old grievances surface; small slights remembered. The room grows quieter than it should be."*

**Engine effect:**
- New property on faction node: `dissentLevel: number` (0.0–1.0, defaults to 0).
- This verb sets `dissentLevel = min(1.0, dissentLevel + STIR_DISSENT_INCREMENT)`.
- New helper in `phaseFactionActions.ts`: `tickDissentDecay(faction, tick)` — drifts `dissentLevel` down by `DISSENT_DECAY_PER_TICK` each tick. (Additive to existing tick phase; no new phase.)
- When `dissentLevel ≥ DISSENT_ENCOUNTER_THRESHOLD`, the next `phaseFactionActions` pass plants the encounter seed below and resets `dissentLevel = 0`.

**Mortal-loop bridge:** when the seed fires, target = the **most-threaded** non-leader member (highest combined `bondTier × essenceInvested` from ascendant). If no threaded member, fall through to leader (same encounter framing, leader is the agent who must respond). If neither, the seed fires on the highest-rank non-leader member with axiological misalignment toward the faction's `reputationAlignment` — i.e. the natural dissenter.

**Encounter seeded:** `faction.encounter.dissent_surfaces` (new content; family `faction_internal_pressure`). The targeted member faces an internal-faction encounter: speak the grievance and risk expulsion, or swallow it and let it harden. Two choices, each tilts an axis (heart sworn / renegade primarily; iron protector / conqueror secondarily). Per-scene god-verbs authored at encounter time.

**Failure modes & fail-soft:**

| Failure | Fallback |
|---------|----------|
| Faction has no members | Action fails with prose *"There is no one inside this faction to hear the whisper"*; essence refunded |
| Seed target template missing | Standard `encounter_seed` "withered" path; trace emitted; no crash |
| `dissentLevel` already at 1.0 | Action still costs essence and tilts further; the threshold check fires on next tick; prose acknowledges *"the air is already thick — you only deepen the chill"* |

**Trace:** `FactionStirDissentTrace` — fields: `factionId`, `previousDissentLevel`, `newDissentLevel`, `seededEncounterId?`, `targetMortalId?`.

### 5.2 Whisper to the Leader — `action.faction.whisper_leader`

**Player reads:** *"You lean close to the one who carries the faction's weight. Not a command — a question they were already asking themselves. They will answer it in their own voice; you have only chosen which voice rises."*

**Engine effect:**
- Resolves target via `getFactionNetworkSummary(graph, factionId).leader` — the existing leader resolution.
- If a leader exists, applies the existing persuasion influence model (same shape as `divine.persuade`): adds a `divine_whisper_pending` condition to the leader's `properties.conditions` array, configured via the same fields the persuasion path already supports.
- The leader's next major decision (conclave vote, ambition pivot, faction-level encounter) reads the condition and tilts toward the player's preferred axiological pole — specified as a parameter `preferredPole: ArchetypePole` chosen by the player at cast time (4 options on the choice card: protector / conqueror / sworn / renegade — drawn from the leader's primary reach axes).

**Mortal-loop bridge:** the leader **is** the target mortal. The whisper does not need to plant a follow-on encounter — it modifies the leader's next decision, which itself is observed (via existing chronicle prose) as a moment of choice. Optionally seeds `faction.encounter.leader_at_a_crossroads` (family `faction_internal_pressure`) on a `LEADER_WHISPER_FOLLOWUP_DELAY` tick delay so the player gets a scene-level surface on the choice; the seed is a soft addition, not a hard requirement.

**Failure modes & fail-soft:**

| Failure | Fallback |
|---------|----------|
| Faction has no leader (all members at zero leadership score) | Action fails with prose *"There is no head to lean toward; the body has no name"*; essence refunded |
| Leader is already under another god's whisper | Action lands but tilts toward the *resultant* pole if the player's choice agrees with the standing whisper; conflicts no-op with `"The leader is already listening to a voice that is not yours"` prose |
| `preferredPole` not chosen at cast time | UI gates this; defaults to the leader's currently-dominant axis if somehow reached |

**Trace:** `FactionWhisperLeaderTrace` — fields: `factionId`, `leaderId`, `preferredPole`, `conflictedWithOtherWhisper: boolean`, `seededFollowupEncounterId?`.

### 5.3 Recover Doctrine — `action.faction.recover_doctrine`

**Player reads:** *"You loose a thread of memory — older than any living member, older than the faction's current name. Somewhere, a forgotten teaching surfaces in the minds of those who never knew they were waiting for it."*

**Engine effect:**
- Requires a `recovered_doctrine` clue node bound to this faction. Clue nodes are surfaced via existing ruin discovery (per Elder Magic & Ruins, shipped). The verb is **gated** in the action drawer — appears only when the player has at least one `recovered_doctrine` clue tagged for this faction's `factionDefId`. (This is the "real conditional" model the audit asked for; nothing is hidden, but the verb only becomes legible to the player once they have surfaced the doctrine via prior play.)
- On cast, sets `faction.properties.recoveredDoctrineId` to the clue's doctrine identifier and consumes the clue node.
- Doctrines optionally carry a `realignment: Partial<Record<ReachDomain, ReputationPolarity>>` which the engine merges into the faction's existing `reputationAlignment` for `RECOVERED_DOCTRINE_REALIGN_DURATION` ticks. After the duration, alignment returns to baseline unless the encounter (below) results in the faction formally adopting the doctrine.

**Mortal-loop bridge:** target = the **leader** by default. If the player has anointed a champion still active in this faction, target shifts to the champion (their thread is the louder one). The encounter seed is `faction.encounter.doctrine_surfaces` (family `faction_internal_pressure`) — the chosen mortal must lead the faction through the question of whether to honor the recovered teaching or call it heresy. Three outcomes possible: adopt (faction realigns permanently), reject (clue is consumed but no realignment), schism-light (subset of members leave the faction — handled additively as `member_of` edge removal, *not* the full Schism subsystem).

**Failure modes & fail-soft:**

| Failure | Fallback |
|---------|----------|
| No recovered_doctrine clue for this faction | Verb is not surfaced in the drawer (legibility model, not a runtime fail) |
| Target mortal removed before seed fires | Seed retargets to next-most-threaded member; if none, withers normally |
| `realignment` field missing on doctrine | Realignment block is skipped; the cultural-memory beat still fires through prose |

**Trace:** `FactionRecoverDoctrineTrace` — fields: `factionId`, `doctrineId`, `targetMortalId`, `realignmentApplied: boolean`, `seededEncounterId`.

### 5.4 Surface a Doubter — `action.faction.surface_doubter`

**Player reads:** *"You let a name rise in the room — the one whose silence has been speaking. They feel themselves seen by something larger than the faction. The seeing is the cost. The seeing is the gift."*

**Engine effect:**
- Resolves a "doubter" candidate via new helper `getDoubterCandidate(graph, factionId): { agentId: string, axisDistance: number } | null`. The helper scans `member_of` members and returns the one whose axiological / reputation profile is **most misaligned** with the faction's `reputationAlignment`. If the maximum misalignment is below `SURFACE_DOUBTER_MIN_DISTANCE`, the verb is **not surfaced** in the drawer (legibility — no doubter, no verb).
- On cast, the helper's chosen agent receives a `surfaced_by_divine_attention` condition + an `intelligence` grant to the player (`Docs/plans/2026-04-16-systemic-wiring-guide.md` Capability 5) describing the doubter's specific misalignment in encounter-prose-ready terms.
- Faction's `dissentLevel` tics up by `SURFACE_DOUBTER_DISSENT_CONTRIBUTION` (smaller than Stir Dissent — surfacing is a quieter act).

**Mortal-loop bridge:** the surfaced doubter **is** the target mortal. If the doubter is not currently threaded, the act of surfacing them initiates the thread (low bondTier, `surfaced` provenance). They are the natural candidate for the player's next intervention; the encounter pipeline then offers an encounter where the doubter must choose whether to act on what they have always quietly believed.

**Encounter seeded:** `faction.encounter.doubter_chooses` (family `faction_internal_pressure`), `delayTicks: SURFACE_DOUBTER_ENCOUNTER_DELAY`. Two choices per the standard structure: speak openly (renegade axis) or hold the doubt closer (sworn axis under strain). Per-scene god-verbs authored at encounter time.

**Failure modes & fail-soft:**

| Failure | Fallback |
|---------|----------|
| No misaligned members above threshold | Verb is not surfaced in the drawer |
| Doubter already surfaced this run | Verb still casts on a *different* candidate; if no second candidate, fails with prose *"All who would doubt have already been seen — only the faithful remain, and they are unmoved"* |
| `intelligence` grant fails to construct (missing prose data) | Surfaced condition still applies; intelligence falls back to a generic `"They believe more than they say"` line |

**Trace:** `FactionSurfaceDoubterTrace` — fields: `factionId`, `doubterId`, `axisDistance`, `bondInitiated: boolean`, `intelligenceGrantId`, `seededEncounterId`.

## 6. Constants table (NFP #1 — Tunability)

Every magic number named. New constants in `src/data/faction-action-constants.ts` (new file) or appended to an existing faction-constants module if one is canonical at execution time.

| Constant | Default | Used by | Purpose |
|----------|--------:|---------|---------|
| `STIR_DISSENT_INCREMENT` | 0.25 | Stir Dissent | how much dissent one cast adds |
| `DISSENT_DECAY_PER_TICK` | 0.005 | tick decay | drift toward zero per tick (~200 ticks to drain from full) |
| `DISSENT_ENCOUNTER_THRESHOLD` | 0.6 | seed trigger | dissent level that fires the surfaces-dissent encounter |
| `STIR_DISSENT_ESSENCE_COST` | 8 | template | essence cost of Stir Dissent |
| `WHISPER_LEADER_ESSENCE_COST` | 6 | template | essence cost of Whisper to the Leader |
| `LEADER_WHISPER_FOLLOWUP_DELAY` | 4 | seed | ticks until the optional crossroads encounter eligible |
| `WHISPER_LEADER_CONDITION_DURATION` | 12 | condition | how long the leader's whisper persists |
| `RECOVER_DOCTRINE_ESSENCE_COST` | 8 | template | essence cost of Recover Doctrine |
| `RECOVERED_DOCTRINE_REALIGN_DURATION` | 24 | realignment | how long the temporary alignment shift lasts before adoption verdict |
| `SURFACE_DOUBTER_ESSENCE_COST` | 8 | template | essence cost of Surface a Doubter |
| `SURFACE_DOUBTER_MIN_DISTANCE` | 0.35 | helper | minimum axiological misalignment to surface verb |
| `SURFACE_DOUBTER_DISSENT_CONTRIBUTION` | 0.10 | side-effect | how much surfacing adds to dissent |
| `SURFACE_DOUBTER_ENCOUNTER_DELAY` | 6 | seed | ticks until the doubter's choice encounter eligible |

No magic numbers in the templates. Reach / sphere / rarity literals are not constants (they're enums), as per existing template authoring convention.

## 7. Engine pillar

### 7.1 Graph schema additions (additive, no migrations)

Three new optional properties on faction nodes (`actorType: 'faction'`), all `properties` field, no interface change:

- `dissentLevel?: number` (0.0–1.0, defaults to 0 when read)
- `recoveredDoctrineId?: string`
- `recoveredDoctrineExpiresTick?: number`

One new optional condition string on agent nodes:

- `'surfaced_by_divine_attention'` (appended to the existing `conditions: string[]` array)

One new clue-node tag (consumed by Recover Doctrine):

- `clueType: 'recovered_doctrine'` with `factionDefId` and optional `realignment` properties.

### 7.2 Tick-loop integration

One additive hook in `phaseFactionActions.ts`:

```ts
// Dissent decay + threshold check (THR-400)
for (const factionNode of getFactionNodes(state.graph)) {
  const current = (factionNode.properties.dissentLevel as number | undefined) ?? 0;
  if (current > 0) {
    const decayed = Math.max(0, current - DISSENT_DECAY_PER_TICK);
    if (decayed !== current) {
      state.graph.updateNode(factionNode.id, { dissentLevel: decayed });
    }
  }
  if (current >= DISSENT_ENCOUNTER_THRESHOLD) {
    seedDissentSurfacesEncounter(state, factionNode);
    state.graph.updateNode(factionNode.id, { dissentLevel: 0 });
  }
}
```

`seedDissentSurfacesEncounter` selects the target mortal per §5.1's bridge rules and emits the `encounter_seed` via the existing aftermath pipeline. **No new tick phase.** Mutation calls `touchStructure()` per the load-bearing decision in `CLAUDE.md` about world-graph version counters.

### 7.3 Fail-soft posture (NFP #4)

| Failure surface | Behavior | Why |
|-----------------|----------|-----|
| Faction has zero members | Verb still resolves; prose acknowledges emptiness; no encounter seeded | Don't crash; tell a small story |
| Seed template missing | `encounter_seed` "withered" event emitted; trace logged; no encounter spawns | Standard wiring-guide pattern |
| `getDoubterCandidate` errors | Verb is hidden from drawer; nothing crashes the tick loop | Hidden is the right shape |
| Realignment field has unknown reach values | Skip them; apply only valid reaches; log a `realignment_partial_apply` trace | Tolerate data drift |
| Decay reaches zero mid-tick while threshold check runs in same pass | Threshold check runs first against the pre-decay value (above) | Spec'd above |

### 7.4 Determinism (NFP #3)

All randomness routes through the existing seeded PRNG. The only PRNG draw in these four verbs is the doubter-tiebreak inside `getDoubterCandidate` when multiple members are equidistant from alignment — `prng.pick(candidates)` per existing pattern.

## 8. Content pillar — prose and IPK

All prose follows Threadbearer voice (short, charged, mythic — not tooltip dumps; see `prose-content-systems` skill and `Vision/taste-profile.md`). Each verb authors prose at three layers:

### 8.1 Template narrative (drawer + action card)

Already written in §5 per verb. Each template's `narrativeTemplates` has three keys (`initiation`, `success`, `failure`) following the convention of `action.divine-edict` and `action.anoint-champion`.

### 8.2 IPK / chronicle band

For each verb, one short post-state line is written into the chronicle, with the entity name as an IPK keyword. Examples:

- Stir Dissent: *"The {factionName} grows quieter than it should. Old grievances surface; small slights remembered."*
- Whisper to the Leader: *"{leaderName} carries a question now that is not their own — and yet, somehow, has always been."*
- Recover Doctrine: *"Inside the {factionName}, a teaching surfaces that was old before the faction had its name."*
- Surface a Doubter: *"{doubterName} feels themselves seen by something larger than the {factionName}. The seeing is the gift."*

IPK keywords use the existing `ProseKeyword.tsx` underlining pattern. No new prose tables required beyond these four short bands.

### 8.3 Encounter prose (lives in the seeded encounters)

The seeded encounters (`faction.encounter.dissent_surfaces`, `faction.encounter.leader_at_a_crossroads`, `faction.encounter.doctrine_surfaces`, `faction.encounter.doubter_chooses`) are authored as part of this issue's scope but in the per-scene god-verb style of the 2026-05-04 direction. Each encounter is a 2–3 beat scene with 2–3 choices, all with per-scene authored verbs (not derived from the global template name).

**Authoring discipline (per `prose-content-systems` and `encounter-pipeline` skills):**
- Each encounter uses ≥2 enrichment placeholders (`{name}`, `{?has_ally}`, `{location}`, etc.) — see `Docs/plans/2026-04-16-systemic-wiring-guide.md` Capability 1.
- Each encounter plants ≥1 encounter_seed of its own (the seeded encounters can themselves seed follow-ons — the dissent-surfaces encounter, for instance, might seed a "leadership challenge" encounter if the doubter speaks).
- Each encounter exposes the moral axis tilt explicitly on each choice card (per Rule 2 of `2026-05-04-encounter-experience-design-plan.md`).

The encounter prose is the load-bearing piece of this issue's content pillar. The drawer card is short; the encounter is where the verb's narrative weight lives.

### 8.4 What we are NOT writing

- No engine-only mutations described to the player as numbers (`dissentLevel +0.25`). The player reads only the chronicle band and the encounter; `dissentLevel` never appears in player-facing UI as a number, per Non-Negotiable #3.
- No "Reveal Corruption" prose — that verb is deferred and its prose lives with its own ticket.

## 9. UI pillar

### 9.1 Action drawer

Four new entries appear in the drawer when the focused target is a faction. Surfacing rules:

| Verb | Surfaced when |
|------|---------------|
| Stir Dissent | Always (any faction) |
| Whisper to the Leader | Faction has a non-army leader |
| Recover Doctrine | Player holds a `clueType: 'recovered_doctrine'` clue tagged for this faction |
| Surface a Doubter | `getDoubterCandidate(graph, factionId)` returns non-null |

Hidden verbs (Recover Doctrine without a clue, Surface a Doubter without a candidate) do **not** appear in the drawer at all. **Greyed-out is wrong here per Tension #4 of the audit** — greying leaks the existence of hidden state. Absence is legibility-correct: the verb appears when the precondition becomes real, taught by repeated play.

### 9.2 Faction detail panel

When a faction is selected, the existing detail panel (or BondsTab faction-row equivalent) shows:

- New compact ambient indicator when `dissentLevel > 0`: a thin shadow under the faction's icon, intensity scaled to dissent. No number. The player reads "this faction is restless" from the visual, not from a `0.42`.
- When `recoveredDoctrineId` is set and within `recoveredDoctrineExpiresTick`, a small star-mark glyph next to the faction name. Tooltip on hover: *"A recovered teaching reshapes this faction's alignment for a time."*
- These are visual; the chronicle band §8.2 is the prose surface.

### 9.3 Chronicle / event log

On each cast, the chronicle band from §8.2 is appended to the event log with the existing `FactionActionTrace` chronicle integration (same path as `action.divine-edict`). On each seeded encounter firing, the encounter's own chronicle entry takes over.

### 9.4 Debug inspection

The DebugPanel's existing faction inspector view gains four lines:

- `dissentLevel: <number>` (raw, not player-facing)
- `recoveredDoctrineId: <string | null>`
- `recoveredDoctrineExpiresTick: <number | null>`
- Active surfaced-doubter conditions on faction members (table)

These are debug-only; never surfaced in player UI per Non-Negotiable #3.

### 9.5 Screenshot evidence at closeout

The closeout commit body or Linear completion comment must include at minimum:

1. Action drawer at 1920×1080 with a faction selected, four new verbs visible.
2. Faction detail panel showing the dissent ambient indicator at non-zero `dissentLevel`.
3. One of the seeded encounters in mid-flight (any of the four).
4. DebugPanel showing the new fields.

Use Playwright (`preview_resize(1920,1080)` → `preview_screenshot`) for DOM surfaces and Claude-in-Chrome for any canvas-touching surfaces. Console output and a `window.__DEBUG.*` assertion per CLAUDE.md §Definition of Done's Browser-verify clause.

## 10. Wiring section

| Wiring point | How this issue connects |
|--------------|-------------------------|
| Orchestrator phase | `phaseFactionActions.ts` — additive dissent decay + threshold block |
| Action drawer | `src/components/actions/*` (or current canonical action drawer) — drawer reads `targetCategories: ['faction']` and the new surfacing helpers |
| Encounter pipeline | `encounter_seed` aftermath effects emit through the existing aftermath dispatcher; encounter pickup uses the existing portfolio-mortal selection path |
| Chronicle | Existing `FactionActionTrace` → ChroniclePanel integration extended with four new trace subtypes |
| DebugPanel | `src/components/DebugPanel/*` faction inspector — adds the four lines listed in §9.4 |
| Prose enrichment | Seeded encounters use existing `enrichProse()` pipeline; no new placeholders introduced |
| Player controls | Action drawer; no new hotkeys; no new modals beyond the encounter modal (which is the existing one) |

**Update `Docs/plans/wiring-checklist.md`** if it lists "faction action surfacing" as an item — add Stir Dissent / Whisper / Recover Doctrine / Surface as covered patterns.

## 11. Traces (NFP #2)

Four new traces, all extending `FactionActionTrace` per existing convention:

```ts
// In src/types/trace.ts
export interface FactionStirDissentTrace extends FactionActionTrace {
  readonly subtype: 'stir_dissent';
  readonly factionId: string;
  readonly previousDissentLevel: number;
  readonly newDissentLevel: number;
  readonly seededEncounterId?: string;
  readonly targetMortalId?: string;
}
export interface FactionWhisperLeaderTrace extends FactionActionTrace {
  readonly subtype: 'whisper_leader';
  readonly factionId: string;
  readonly leaderId: string;
  readonly preferredPole: 'protector' | 'conqueror' | 'sworn' | 'renegade';
  readonly conflictedWithOtherWhisper: boolean;
  readonly seededFollowupEncounterId?: string;
}
export interface FactionRecoverDoctrineTrace extends FactionActionTrace {
  readonly subtype: 'recover_doctrine';
  readonly factionId: string;
  readonly doctrineId: string;
  readonly targetMortalId: string;
  readonly realignmentApplied: boolean;
  readonly seededEncounterId: string;
}
export interface FactionSurfaceDoubterTrace extends FactionActionTrace {
  readonly subtype: 'surface_doubter';
  readonly factionId: string;
  readonly doubterId: string;
  readonly axisDistance: number;
  readonly bondInitiated: boolean;
  readonly intelligenceGrantId: string;
  readonly seededEncounterId: string;
}
```

Each is added to the discriminated union the existing FactionActionTrace consumers switch on.

## 12. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | All 13 magic numbers named in §6 |
| 2 | Inspectability | PASS | Four traces in §11; DebugPanel lines in §9.4 |
| 3 | Determinism | PASS | Only PRNG draw is seeded-`prng.pick` for doubter tiebreak |
| 4 | Fail-soft | PASS | Fail-soft tables per verb in §5; engine-level summary in §7.3 |
| 5 | Narrative over mechanical perfection | PASS | Mortal-loop bridges in §5; encounter is where the verb pays off, not the property write |
| 6 | Additive over destructive | PASS | All schema changes are additive (`properties` field additions, new traces in union, no edits to existing entries) |
| 7 | Performance budget | PASS | One new helper called per faction per tick (~5–20 factions in a run); negligible |

## 13. Done when

- [ ] Four new templates in `src/data/unified-action-templates.ts` matching the spec in §5
- [ ] Constants in `src/data/faction-action-constants.ts` (new file) matching §6
- [ ] `phaseFactionActions.ts` extended with dissent decay + threshold block per §7.2
- [ ] `getDoubterCandidate` helper added to `factionNetwork.ts`
- [ ] Four trace types added to `src/types/trace.ts` per §11
- [ ] Four encounter templates authored (`faction.encounter.dissent_surfaces`, `faction.encounter.leader_at_a_crossroads`, `faction.encounter.doctrine_surfaces`, `faction.encounter.doubter_chooses`) following encounter-pipeline skill discipline
- [ ] IPK chronicle band entries per §8.2
- [ ] Action drawer correctly surfaces all four verbs per §9.1 (with hidden = absent, not greyed)
- [ ] Faction detail panel shows dissent ambient indicator + doctrine star-mark per §9.2
- [ ] DebugPanel shows new fields per §9.4
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] 30-tick CLI smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) reaches tick 30, status shows non-zero agents, traces present
- [ ] Four browser screenshots per §9.5 plus a console-output block and a `window.__DEBUG.*` state assertion
- [ ] `Fixes THR-400` in the closing commit body
- [ ] Plan-doc references updated in `Docs/plans/wiring-checklist.md` (if it covers faction surfacing)

## 14. Deferrals — separate Linear tickets

These were originally part of THR-400 and are now **filed as their own issues** so they do not vanish. Each carries its own substrate work and mortal-loop bridge requirement.

1. **Schism (`action.faction.schism`)** — requires faction-split subsystem (mint new `FactionDefinition` at runtime, partition members + territory, transfer `member_of` edges). Use existing `FactionManipulateEffect.splinter` as the entry point but verify the runtime path is wired.
2. **Reveal Corruption (`action.faction.reveal_corruption`)** — requires hidden-corruption schema (latent corruption flag on faction or member) AND the suspicion mechanic (eye-domain capability check surfaces the verb only when the player has earned legibility). Per the audit's Tension #4, this is a Vision-level UX decision, not a UX afterthought. The hidden-until-suspected pattern must be designed before the verb can be implemented.
3. **Anoint Successor (`action.faction.anoint_successor`)** — requires succession edges (`will_succeed: agent → agent`) and succession-resolution logic on leader exit (death, retirement, schism). Companion to `action.anoint-champion` but on a different time axis.
4. **Kindle a Calling (renamed from Sanction Mission)** — requires the internal-pressure resolver (the faction has latent goal candidates; essence biases which rises; the player never names the goal). Lives in `factionAmbitions.ts` territory but needs explicit design pass.

Each deferral becomes a child of THR-390, with `Deferral` label, project = Social Systems Expansion (or wherever its substrate work most naturally lives). The four deferrals **must be filed before THR-400 closes** — that is part of Definition of Done for THR-400 itself, captured in §13's implicit checklist (no orphan deferrals per CLAUDE.md).

## 15. Coordination block

- **Suggested model:** `model:opus-4-6` — prose-heavy authoring (four encounter templates, IPK bands, Threadbearer voice) plus moderate engine work. Creative-writing memory rule applies; opus is load-bearing for the encounter prose quality bar.
- **Parallel-safe with:** issues that don't touch `src/data/unified-action-templates.ts`, `src/engine/phaseFactionActions.ts`, `src/engine/factionNetwork.ts`, or `src/types/trace.ts`.
- **Mutex with:** THR-396 (reach-domain reassignment, same templates file), THR-397 (rarity recurve, same templates file), THR-398 (hex-recon collapse, same templates file), THR-399 (self-actions, same templates file), THR-401 (location actions, same templates file). **Order:** THR-396 → THR-397 → THR-398 → THR-399 → THR-401 → this issue. Last in the mutex chain because content volume here is the largest (four templates + four encounters).
- **Codex review:** yes — structural review is appropriate (encounter prose discipline, three-pillar wiring, trace coverage); the heartbeat-wrapped GitHub Action will pick this up on PR.
- **Files to touch:** `src/data/unified-action-templates.ts`, `src/data/faction-action-constants.ts` (new), `src/engine/phaseFactionActions.ts`, `src/engine/factionNetwork.ts`, `src/types/trace.ts`, four new encounter content files (or appended to an existing faction-encounter content module — defer to executor judgment), `Docs/plans/wiring-checklist.md` (if it covers faction surfacing).

---

*Reframe filed by Cowork, 2026-05-11. Replaces the eight-verb body of THR-400 per the Vision audit's "back to In Design — renarrow" verdict. Brainstorm companion at `Docs/plans/2026-05-11-thr-400-faction-action-brainstorm.md`.*
