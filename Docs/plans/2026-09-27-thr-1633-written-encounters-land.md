> **title:** Let written encounters land — a fair shortlist, deciders who join guilds, the uncached faction and anomaly templates, and The First's quiet stretches — THR-1633
> **linear_issue:** THR-1633
> **author:** Claude Code (design lane, run 2026-09-27c)
> **created:** 2026-09-27
> **three_pillars:** Engine `done` · Content `done — no new prose; id repairs, cache registration and a tag rekey over existing templates` · UI `N/A — no new surface; the player meets more of the existing encounters in the existing views, and the debug read is a trace field plus one __DEBUG accessor`

# Let written encounters land — THR-1633

*About 400 of 514 written encounters still never reach a mortal. This plan makes the existing writing reachable before anyone commissions more: the shortlist a mortal chooses from stops favouring whatever was registered first, mortals who make their own decisions can actually join a guild, two families of templates that no path ever offers get one, the place-trait bonus tags get bearers, and a mortal walking to a chosen encounter keeps it as its goal.*

## Why this is load-bearing

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) split its content program into a **reach half** (let existing writing land) and a **volume half** (write where the dice land, [THR-1634](https://linear.app/threadbare/issue/THR-1634)). This is the reach half, carve-up plan 4 of 7. It comes first because every completion slice in THR-1634 is ranked by what fires, and this plan changes what fires. Writing prose for a template no mortal can reach, or polishing the five that crowd out the rest, spends authoring on the wrong targets.

**Settled input — not reopened here.**

- [Reach before volume](https://linear.app/threadbare/issue/THR-1597) (research, 2026-09-25): most dead content is gated by *who decides*, not what is written. It ranked eight fixes; fixes 4 and 5 shipped as [THR-1612](https://linear.app/threadbare/issue/THR-1612) and [THR-1613](https://linear.app/threadbare/issue/THR-1613). This plan designs fixes 1, 2, 3, 6 and 7. Fix 8 (more off-settlement places) stays out, as the ticket says, unless fix 1's numbers call for it — they do not (§ Re-measured).
- [What the player actually meets](https://linear.app/threadbare/issue/THR-1590) (task, 2026-09-25): The First could travel up to 90 ticks before its first encounter. *"Fix the First's reach and the social cap before writing story-beat content."* The social cap shipped as [THR-1614](https://linear.app/threadbare/issue/THR-1614).
- The [THR-814](https://linear.app/threadbare/issue/THR-814) membership ruling: guild work for ambient members resolves faction-side (`factionMemberWork`, THR-815); members are **not** promoted to spotlight, and membership is **not** re-seeded onto spotlight mortals. The ticket's boundary adds: no new deciding protagonists (the map rules them out — the tick budget binds). This plan takes the one route both leave open: **existing** deciders joining guilds through the join encounters.

Both research tickets were resolved by `tb-orchestrator` T1.5 on 2026-09-25, more than 48 hours before this plan, and neither was vetoed.

**Decided in this plan by the design lane under delegation** (process.md rule 4 — the *how* of an agreed outcome; each marked *Lane decision* where it appears, each vetoable in chat): fix 1 is closed with no work because the dice refit already retired it (§ Re-measured); the shortlist cap becomes the new first fix (§ S1); a join is scored by how well the guild fits the mortal (§ S3); the bonus-tag table is rekeyed onto tags templates actually carry, rather than hand-tagging 434 templates (§ S4); The First's quiet stretches are fixed through the general reroute defect, not a First-only rule (§ S2).

**Words.** A *decider* in this plan is a spotlight mortal — an `individual` that runs the full decision loop (`isAutonomousDecisionActor`, `decisionTier.ts:34-37`). It is shorthand used by the map's research, not a UL term; code-facing names in this plan use *spotlight* instead. The *shortlist* is the capped candidate list (`MAX_SCORED_CANDIDATES` = 40) a mortal scores each decision.

## Re-measured on current `main` (2026-09-27)

The ticket asked for `readers/reach.ts` and `readers/prereq.ts` to be re-run before designing, because the outgrowth numbers predated the dice refit ([Re-fit the dice](https://linear.app/threadbare/issue/THR-1581), shipped 2026-09-26). Run on `main` @ `3abbba8a`, seeds 42 and 99, medium, 200 ticks, the same commands as the audit README. `readers/attended.ts` (150 ticks) was re-run too, and one new reader, `readers/guild-join.ts`, was written for fix 2. Raw outputs sit beside the originals in `Docs/audits/2026-09-25-living-world-data/output/` with a `-2026-09-27` suffix.

| Measure (seeds 42 + 99) | 2026-09-25 (`32d974ca` / `4aacaafc`) | 2026-09-27 (`3abbba8a`) | Source |
|---|---|---|---|
| Drawable templates that fired (of 514) | 100 | **121** | `reach-gates*.json` |
| Encounter firings, 200 ticks | 918 | **1,712** | same |
| Top-10 share of firings | 49.7% | **26.3%** | same |
| Outgrowth drops (decider-samples, `prereq.ts`) | 46,805 | **0** | `reach-prereq*.json` |
| Median decider capability (dice curve) | 0.990 | **0.305** | same |
| Templates whose first gate is the 40-slot shortlist cap | 2 · 0 | **67 · 68** | `reach-gates*.json` |
| Templates with no deciding guild member | 87 | 82 | same |
| Deciders holding a guild membership (not a Realm, not Mercenary Company) | 0 | **0** | same, and `guild-join-2026-09-27.json` |
| Templates never registered in the encounter cache | 48 · 50 | 45 · 43 | `reach-gates*.json` |
| Withered follow-up seeds | 24 · 46 | 22 · 21 | same (THR-1613 shipped) |
| Bonus-table tags with zero bearers | 9 of 21 | **9 of 21** (plus `#combat` 1, `#loss` 0, `#fear` 0) | `bonusBearers` |
| The First: firings in 150 ticks (attended) | 14 | **40** | `attended-medium*.txt` |
| The First: first encounter tick (42 · 99) | 90 · 19 | **18 · 14** | `attended-medium-2026-09-27.json` |
| The First: longest gap between encounters (42 · 99) | not measured | **11 · 44** | same |
| Social-path firings (attended, 150 ticks) | 0 | **12** | same (THR-1614 shipped) |

**What changed, in game terms.**

1. **Fix 1 is already done.** The dice refit turned the outgrowth filter off (`OUTGROWTH_FILTER_ENABLED = false`, `src/data/agent-behavior-constants.ts:569`, commit `dce29c72`) and replaced it with the too-easy side of the forecast window, which scores easy content down instead of removing it. Outgrowth drops fell from 46,805 to 0. *Lane decision:* fix 1 is recorded as closed by THR-1581; this plan does no work on it.
2. **The world is already far more varied.** Firings nearly doubled and the top 10 fell from half of all firings to a quarter. The old top five (`confront_the_unknown`, `master_local_craft`, `arcane_resonance_study`, `plague_outbreak`, `weave_political_alliance`) are now mostly outscored: mortals choose challenges near their own level. This matters for [THR-1634](https://linear.app/threadbare/issue/THR-1634), whose slice 1 was "the top 10" — that list is different now (flagged on that ticket).
3. **A new first gate appeared: the shortlist cap.** With outgrowth gone, more candidates survive the filters, and the 40-slot cap now cuts 67 · 68 templates before they are ever scored — 88 distinct templates on at least one seed. This is the same *positional* cut THR-814 and THR-1614 fixed for faction and social offers: `capWithDiversity` fills its free slots by walking the candidate list from the head (`src/engine/encounterFilterPipeline.ts:790-800`), and the list arrives in cache insertion order — hexes in the order the cache first saw them, templates in registration order within a hex (`encounterCache.ts:659-697`). A template late in both orders is never looked at. Median registry position of the cap-cut templates is 152, against 110 for templates that fire.
4. **Guild membership for deciders is still zero** — and the reason is new. See § S3.
5. **The First is mostly fixed.** Its first encounter moved from tick 90 to tick 18 on seed 42 and it reads 40 encounters instead of 14. One seed still leaves it idle for 44 ticks at a stretch (§ S2).

## Substrate inventory

Grepped `Docs/canon/systems-inventory.md` for encounter, cache, faction, guild, social, anomaly, location trait, movement and reroute. Every system this plan touches exists and is active; nothing here is green-field.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Encounters & Dilemmas** — `encounterFilterPipeline.ts` (`capWithDiversity`), `encounterCache.ts`, `encounterScoring.ts` | 🟢 ACTIVE | **extends** — the cap's free-slot fill becomes template-fair (S1); the join entry gets a guild-fit score term (S3); anomaly templates join the cache's regional list (S4) |
| **Movement & Colocation** — `phaseAgentDecision.ts` reroute (lines 635-742), `phaseMovement.ts` reroute (388-482), `movementExecution.ts` `initMovementState` | 🟢 ACTIVE | **extends** — a queued journey records the pull that chose it, and a reroute keeps an encounter target (S2) |
| **Factions & Succession** — `factionQuestGeneration.ts` `generateFactionLifecycleCandidates`, `factionOutcome.ts` `processFactionJoinOutcome`, `factionMemberWork.ts` | 🟢 ACTIVE | **extends** — every hall at a Location is considered, not only the first; the chosen-join-to-membership path is repaired (S3). `factionMemberWork` is **preserved** untouched (THR-814 ruling) |
| **Encounters & Dilemmas** — `socialEncounterGeneration.ts` `getSharedFactionSocialTemplates` | 🟢 ACTIVE | **extends** — resolves the per-guild `.social.` templates from the unified registry and reads repaired id lists (S4) |
| **Location Traits** (tick phase `6.6385`, THR-790) — `location-trait-constants.ts` `LOCATION_TRAIT_ENCOUNTER_BONUS`, `locationTraitBonus.ts` | 🟢 ACTIVE | **extends** — the bonus table is rekeyed onto tags with bearers (S4) |
| **Ruins, Clues & Delves** — anomaly places (`worldSeed.ts:1109-1131`, `ANOMALY_FRACTION`) | 🟢 ACTIVE | **preserves** — places are already seeded; only their templates were unreachable |

**Population counts consumed (runtime, not grep):** 53 faction halls with a `factionDefId` on seed 42 at t0 (plus 34 `guild-hall` places that carry none, which `generateFactionLifecycleCandidates` cannot use); deciders stand on a Location with a faction hall on 169 of 677 decider-samples (seed 42) and 127 of 465 (seed 99); 10 anomaly templates, of which 6 have their place on these seeds; 39 faction `.social.` templates (6 `ag.social.*` in `FACTION_ENCOUNTER_TEMPLATES`, 33 in per-guild arrays registered only in the unified registry).

## Engine pillar

The plan ships as four slices (§ Slicing). Each slice below names its measured "before", its mechanism, and its expected "after" as a gate the executor re-measures with the same reader.

### S1 — A fair shortlist (the new fix 1)

**Before:** 67 · 68 templates die at the 40-slot cap, unscored (`reach-gates-2026-09-27.json`, gate `funnel:cap`).

**Mechanism.** `capWithDiversity` keeps its four reserve phases (1a diversity per `encounterType`, 1b branching, 1c personally offered, 1d social) unchanged. Only **Phase 2, the free-slot fill,** changes. Today it walks `entries` from index 0 and takes the first `remaining` entries not already reserved. The new fill:

1. **Distinct templates first.** Pass one takes at most one entry per `templateId` (the pattern Phase 1d already uses for social offers). Pass two, only if slots remain, fills from the rest as today.
2. **A rotating start.** Each pass starts at offset `hashString(agentId + ':' + tick) mod entries.length` and wraps, instead of at 0 (`hashString` already exists, `factionAmbitions.ts:57`; move or re-export it rather than writing a second hash). The hash is a pure function of the two inputs — no PRNG stream is consumed, so no other system's draws shift (NFP #3). Same seed, same agent, same tick → same shortlist.

*Lane decision:* rotation plus distinct-first, not "nearest hex first". Nearest-first would still starve late-registered templates on a busy settlement hex, which on a city can hold more than 40 entries by itself; rotation removes the ordering bias at its root, and distinct-first stops one template registered at many locations from filling the free slots with copies of itself. Scoring still decides which shortlisted encounter a mortal takes, so no template is favoured — each simply gets looked at.

**Cost:** unchanged by construction — the cap stays 40, and the fill is one extra pass over a list the stage already walks.

**After (gate):** templates whose first gate is `funnel:cap` ≤ `CAP_CUT_TEMPLATES_MAX` (10) per seed on seeds 42 and 99; drawable templates fired ≥ 121 (no regression); top-10 share ≤ 0.30. The existing `branching`, `personallyOffered` and `socialOffer` survival tests stay green unchanged.

### S2 — A journey keeps its goal (The First's quiet stretches)

**Before:** The First's longest gap between encounters is 44 ticks on seed 99 (11 on seed 42); 15 · 12 templates are selected but never become an action (`selected_not_spawned`).

**Mechanism — a defect, measured in code.** When a mortal picks an encounter at another Location, the `queue_movement` branch (`phaseAgentDecision.ts:1786-1840`) builds a movement state and stamps `targetEncounterId`, but never sets `motivationPull`. Every `DECISION_REEVALUATION_TICKS` (4), the reroute check compares alternatives against `movementState.motivationPull ?? 0` (`phaseAgentDecision.ts:648`) — so the first check compares against **zero**, and any cache entry at any other Location wins. The rerouted state (`:713-737`) and the movement-phase reroute (`phaseMovement.ts:388-482`) both drop `targetEncounterId`. A mortal walking to a chosen encounter therefore abandons it at the first re-check and wanders — the "travels and changes destination on arrival" loop THR-1590 recorded for The First.

**Fix:**

1. The `queue_movement` branch sets `movState.motivationPull` to the chosen candidate's final score (`selCandidate.finalScore`, already in hand at `:1517`).
2. Both reroutes carry the new target's `templateId` into `targetEncounterId`, and the decision-phase reroute keeps its existing `REROUTE_SCORE_MULTIPLIER` (1.5) rule — now meaningful, because the comparison has a real score on the left.
3. Appointment journeys (`phaseAgentDecision.ts:397`, `APPOINTMENT_JOURNEY_PULL`) are unaffected: they already set the pull.

*Lane decision:* fix the general defect, not a First-only rule. Court position deliberately has no effect on selection or movement today (`getThreadContext` feeds only balance fields), and the rulebook's mortal-autonomy premise wants it that way: The First should feel quiet because its life is quiet, never because a god-side rule nudged it.

**After (gate):** on seeds 42, 99 and 11 (attended, 150 ticks), The First's first encounter ≤ `FIRST_FIRST_ENCOUNTER_MAX_TICK` (30) and its longest gap ≤ `FIRST_ENCOUNTER_MAX_GAP_TICKS` (30); `selected_not_spawned` first-gate templates fall on both seeds; no rise in decision-phase ms per tick beyond noise (±5% on the `liveness-cost` reader's steady-state figure).

### S3 — Deciders who join guilds (fix 2)

**Before:** 82 senior/elite faction templates have no deciding member; deciders hold 0 guild memberships at t200 on both seeds (1 · 2 in Mercenary Company only).

**Measured, stage by stage** (`readers/guild-join.ts`, every 10 ticks, seeds 42 · 99):

| Stage | Seed 42 | Seed 99 |
|---|---|---|
| Decider-samples | 677 | 465 |
| …standing on a Location with a faction hall | 169 | 127 |
| …first hall is a guild it may join and it passes the reach requirements | 109 | 115 |
| …offerable only at a hall past the first | 51 | 8 |
| Join reaches the decider's top board (`engagement_decision` trace, every tick) | 66 | 17 |
| …and is the one chosen | 2 | 1 |
| Guild memberships at t200 | 0 | 0 |

So the join is offered, passes its gates and reaches the shortlist; three things lose it:

1. **Only the first hall counts.** `generateFactionLifecycleCandidates` reads `sublocations[0]` (`factionQuestGeneration.ts:289`). 51 of seed 42's offerable samples were offerable only at a second or later hall. **Fix:** emit one join candidate per hall whose guild the mortal may join (and one promotion per hall of a guild it belongs to), each keyed to its own hall.
2. **A join is scored as worthless.** Every join meta carries `reputationReward: 0.0`, and the lifecycle entry sets `successRewardEstimate: 0.05` and `questPriority: 6.0`, so a join loses to almost any ordinary encounter: chosen 3 times in 83 appearances. **Fix (*Lane decision*):** add a **guild-fit** term to the join's score — `FACTION_JOIN_FIT_BONUS × fit`, where `fit` is the mortal's mean reach share across the guild's primary reaches (the same `computeReachShare` the join requirements read). A mortal whose reaches match a guild wants to belong to it; a poor fit still can, but rarely. This keeps the choice the mortal's (scoring, not a forced join) and makes membership follow character.
3. **A chosen join did not become a membership.** The 3 chosen joins produced 0 memberships. The executor diagnoses this first, on the same seeds, by following each chosen `.join` from selection through `createUnifiedAction`, resolution, and `processFactionJoinOutcome` (`orchestrator.ts:636` → `factionOutcome.ts:83`), and fixes the break. Candidate causes to check in order: the join is a two-step template at `FACTION_JOIN_DIFFICULTY` (20) on both steps and the resolution band lands `failure` (legitimate — then the fit term's rate is what matters); the completion hook does not match the lifecycle entry's `sublocationTypeId: 'sublocation-type.guild-hall'` versus the hall's `faction-hall` type; the outcome resolves the wrong faction for a class-scoped meta. **Do not guess — log what the trace shows in the PR body.**

**Boundary kept:** no new deciders, no spotlight promotion of members, no re-seeding, `factionMemberWork` untouched. Deciders are ~14–20 at medium; they join *in addition to* the 9–57 ambient members each guild already has.

**After (gate):** by t200 on seeds 42 and 99, deciders hold memberships in ≥ `GUILD_SPOTLIGHT_COVERAGE_MIN` (5) of the 10 non-Realm guilds per seed; templates with first gate `no_deciding_member` ≤ 50 per seed (from 82); decider count at t200 within +10% of baseline (THR-1592's budget line).

### S4 — Templates no path offers, and tags nothing carries (fixes 3, 6, 7)

Three data-path repairs, one slice because each is small and none touches the tick loop's order.

**(a) Faction `.social.` templates (fix 3).** Before: 39 templates, 0 offered (reader gate `supply:rank_access`; no rank's `encounterAccess` names `.social.`, and the location cache never reads them). The path built for them, `getSharedFactionSocialTemplates` (`socialEncounterGeneration.ts:618-665`), fires when two mortals share a guild — but looks ids up in `FACTION_ENCOUNTER_TEMPLATES` (`:657`), which holds only the 6 `ag.*` ones, and most definitions' `socialTemplateIds` name ids that do not exist (e.g. `arcane-circle-definition.ts:111` lists `ac.social.lecture`, `magical_debate`, `shared_research`; the file defines `lecture_hall`, `spell_exchange`, `library_browse`; only Mercenary Company matches 3 of 3). **Fix:** resolve through `getUnifiedTemplateById`; repair each definition's `socialTemplateIds` to the defined ids; add a contract test that every listed id resolves to a drawable template and every `<prefix>.social.*` template is listed by its guild. Also check the lookup's `locationSubtypes` match: the social generator resolves a place to its parent's `locationType` (`:196-203`), so a template keyed only to a `sublocation-type.*` subtype cannot match there — widen the check to the place's own subtype too. Depends on S3: shared guild membership between a decider and a colocated member is the trigger, and deciders hold none today.

**(b) Anomaly templates (fix 6).** Before: 10 templates in `ANOMALY_ENCOUNTER_TEMPLATES` (`encounter-anomaly-content.ts:42`), registered only in the unified registry, never in the cache (the cache's subtype lookup reads `ENCOUNTER_TEMPLATES` only, `encounter-content.ts:14135`); 6 of their 10 place subtypes exist on these seeds. **Fix:** add the 10 ids to `CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS` (`unified-action-templates.ts:5815-5839`) — the exact THR-779 pattern (commit `4904b494`). The four whose places were not rolled on these seeds stay place-limited by `ANOMALY_FRACTION`; that is rarity, not a defect.

**(c) Bonus tags (fix 7).** Before: 9 of the table's tags (`#social`, `#trade`, `#commercial`, `#stealth`, `#arcane`, `#anomaly`, `#mystical`, `#supernatural`, `#fate`) plus `#loss` and `#fear` have 0 bearers among drawable templates, so whole rows of `LOCATION_TRAIT_ENCOUNTER_BONUS` (`location-trait-constants.ts:170-214`) move nothing. **Fix (*Lane decision*):** rekey rather than hand-tag 434 templates.
   1. Add one projection to the encounter kind in `content-objects.ts:181`: `encounterType → tag`, so every template with an `encounterType` (`explore` 47, `assist` 30, `duel` 28, `lead` 25, `build` 21, `trade` 19, `steal` 16, `create` 15, `acquire` 14, `hire` 11) carries `#<type>` through `effectiveTags`. Register the new tags in the tag vocabulary (THR-1481).
   2. Rekey each row onto tags with bearers, keeping its meaning: *welcoming* → `#gold`, `#heart`, `#trade`, `#assist`, `#tavern_night`; *lawless* → `#shadow`, `#iron`, `#steal`, `#duel`, `#thieves_errand`; *veilThin* → `#veil`, `#star`, `#explore`, `#anomaly`; *haunted* → `#veil`, `#shadow`, `#anomaly`, `#delve`; *bloodSoaked* → `#duel`, `#iron`, `#lead`. The executor sets the weights inside the existing cap (`LOCATION_TRAIT_ENCOUNTER_BONUS_CAP = 0.15`) and may substitute a tag if a projected count differs from this grep.
   3. Author `#anomaly` on the 10 anomaly templates (they carry it today only on their reward items).
   4. A test pins that every tag in the table has ≥ `LOCATION_TRAIT_TAG_MIN_BEARERS` (5) drawable bearers, so a row cannot silently go dead again.

**After (gate):** faction `.social.` templates fired ≥ 10 distinct across seeds 42 + 99 in 200 ticks (after S3 lands); anomaly templates with a place on the seed fire ≥ 3 distinct; zero table tags below the bearer floor; `npm run census:location-traits` shows a non-flat bonus column.

### Graph nodes / edges

None new. S3 writes more `member_of` edges through the existing `processFactionJoinOutcome`; S2 writes two existing fields on the existing movement state.

### Tick phases

No phase is added or reordered. S1 runs inside the filter pipeline in `phaseAgentDecision`; S2 in `phaseAgentDecision` and `phaseMovement`; S3 in `phaseAgentDecision` (candidate generation, scoring) and the orchestrator's existing join-outcome hook; S4 at cache build and in social candidate generation.

### Resolution logic

Unchanged. No slice touches the dice, the forecast window or the band ladder. S3's term is a scoring input, like every other term in `scoreAndSelect`, and still passes through the engagement fit.

### PRNG callouts

None consumed. S1's rotation is `hashString(agentId + ':' + tick)` — a pure hash, deliberately not a PRNG draw, so no seeded stream shifts and existing determinism tests keep their expectations except where the shortlist itself changes.

## Content pillar

No new prose and no new template. The content work is repair over existing templates:

- **S4a:** `socialTemplateIds` repaired in up to 11 faction definitions (`src/data/factions/*-definition.ts`) to the ids their encounter files already define.
- **S4b:** 10 anomaly ids added to `CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS`; `#anomaly` authored on those 10 templates.
- **S4c:** `LOCATION_TRAIT_ENCOUNTER_BONUS` rows rekeyed; new projected tags registered in the tag vocabulary.
- The 39 `.social.` and 10 anomaly templates were written against the pre-Doctrine-v2 spec in part. **They are not rewritten here** — reachability first, then THR-1634 ranks them by what fires. If one reads badly once it lands, that is a THR-1634 completion target, not a blocker.

### Encounter templates

Existing only (above).

### Prose tables · Attachment content

N/A — no prose table or attachment changes; reach work only.

### Data tables

The constants in § Constants table; the id lists and tag table above.

## UI pillar

UI: N/A — no component, modal or HexMapV2 layer changes. The player meets more of the existing encounters, in the existing encounter veil and chronicle. **Screenshot tool:** none required; every slice's evidence is headless (the THR-688 rule C pillar match — engine and content work is accepted via CLI/headless sweeps). UI Laws engaged: none, since no surface changes; the chip and sheet words for guild membership already exist and gain members, not wording.

### Debug inspection (DebugPanel)

- **S1:** the `encounter_filter` trace gains `capCutTemplates: number` (distinct templates entering the cap stage minus distinct templates leaving it). This closes impediment #239's blind spot for the cap: a positional cut becomes a count instead of an absence.
- **S3:** `window.__DEBUG.getGuildJoinFunnel()` returns the per-tick counters behind the S3 table (offered, on board, chosen, resolved, joined) so a browser session can read the same funnel. JSDoc in `src/debug-bridge.d.ts`.

### Player-facing display · Event notifications · Visual presence (HexMapV2)

N/A — existing join events already reach the chronicle through `processFactionJoinOutcome`; no new notification.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md` — each slice checks its new trace field, debug accessor and interface row against it at closeout.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `capWithDiversity` fill (S1) | `phaseAgentDecision` → `runFilterPipeline` | — | — | `encounter_filter.capCutTemplates` | trace viewer |
| reroute pull + target (S2) | `phaseAgentDecision`, `phaseMovement` | — | `movementState.motivationPull`, `.targetEncounterId` (existing) | existing `movement` trace (`event: 'reroute'`) | agent timeline |
| lifecycle per hall + guild fit (S3) | `phaseAgentDecision` (generation, scoring); orchestrator join hook | chronicle (existing) | `member_of` edges (existing) | existing `engagement_decision`; `guild_join_resolved` (new) | `__DEBUG.getGuildJoinFunnel()` |
| social id resolve (S4a) | `phaseAgentDecision` → `generateSocialCandidates` | encounter veil (existing) | — | existing | — |
| anomaly cache registration (S4b) | cache build (`encounterCache.ts:380-385`) | encounter veil (existing) | — | — | `reach.ts` |
| bonus-tag rekey (S4c) | scoring (`encounterScoring.ts:1396`) | — | — | — | `census:location-traits` |

## Interface impact

Encounters & Dilemmas (core) and Movement & Colocation are ⚪ UNAUDITED; per protocol §4 this plan writes their first rows for the contracts it touches. The executor registers each `add` row in `scripts/interface-contracts.ts` in the slice that ships it.

| Contract | Action | Detail |
|---|---|---|
| `engagement-forecast-gates-choice` | **preserve** | The forecast window still multiplies every score; S3's term passes through it |
| `seed-only-sequels-never-drawn` | **preserve** | S4b adds cache registrations; `isDrawable` still skips `drawable: false` |
| `shortlist-reaches-every-template` | **add** (S1) | Encounters → Encounters: every template that survives the filters has a fair chance at a shortlist slot. Producer `capWithDiversity`; reader `scoreAndSelect`. Evidence: `reach.ts` `funnel:cap` count |
| `journey-keeps-encounter-target` | **add** (S2) | Encounters → Movement: a queued journey carries its chosen encounter and pull; reroutes compare against it. Producer `phaseAgentDecision` `queue_movement`; readers both reroutes |
| `spotlight-mortal-joins-guild` | **add** (S3) | Encounters → Factions: a chosen `.join` becomes a `member_of` edge. Producer `generateFactionLifecycleCandidates`; reader `processFactionJoinOutcome`. Evidence: `guild-join.ts` memberships at t200 |
| `guild-social-templates-reach-shared-members` | **add** (S4a) | Factions → Encounters: shared guild membership offers that guild's `.social.` templates. Producer `socialTemplateIds`; reader `getSharedFactionSocialTemplates` |
| `location-trait-tags-have-bearers` | **add** (S4c) | Location Traits → Encounters: every bonus-table tag has drawable bearers. Producer `LOCATION_TRAIT_ENCOUNTER_BONUS`; reader `locationTraitBonusFor` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `CAP_FILL_DISTINCT_FIRST` | `true` | S1: the free-slot fill takes one entry per template before any repeats. `false` restores the old fill (NFP #6) |
| `CAP_FILL_ROTATE` | `true` | S1: the fill starts at `hashString(agentId + ':' + tick) mod n`. `false` restores index 0 |
| `CAP_CUT_TEMPLATES_MAX` | `10` | S1 acceptance gate: templates per seed whose first gate is the cap (test/census side, not runtime) |
| `FACTION_JOIN_FIT_BONUS` | `0.6` | S3: score added to a join at full guild fit (fit 0–1). Calibrated by the executor so the gate below is met without joins crowding boards: a join should be chosen on roughly 15–40% of the boards it reaches |
| `FACTION_LIFECYCLE_ALL_HALLS` | `true` | S3: consider every hall at the Location. `false` restores first-hall-only |
| `GUILD_SPOTLIGHT_COVERAGE_MIN` | `5` | S3 acceptance gate: guilds (of 10 non-Realm) with at least one deciding member at t200 per seed |
| `FIRST_FIRST_ENCOUNTER_MAX_TICK` | `30` | S2 acceptance gate: The First's first encounter tick (attended, per seed) |
| `FIRST_ENCOUNTER_MAX_GAP_TICKS` | `30` | S2 acceptance gate: The First's longest gap between encounters (attended, 150 ticks) |
| `LOCATION_TRAIT_TAG_MIN_BEARERS` | `5` | S4c: floor of drawable bearers for every bonus-table tag (test-side) |
| `REROUTE_SCORE_MULTIPLIER` | `1.5` (existing, unchanged) | S2: an alternative must beat the recorded pull by this factor |

The acceptance-gate constants live with the census scripts (`scripts/`), not in the client bundle.

## Tracing

```ts
// S1 — field added to the existing encounter_filter trace
interface FilterPipelineTrace {
  // …existing fields…
  /** Distinct templates entering the cap stage minus distinct templates leaving it. */
  capCutTemplates: number;
}

// S3 — emitted when a chosen `.join` resolves, whatever the band
interface GuildJoinResolvedTrace {
  category: 'guild_join_resolved';
  agentId: string;
  factionDefId: string;
  hallId: string;
  outcome: string;            // StepOutcome band of the action
  joined: boolean;            // a member_of edge was written
  reason?: 'failed_roll' | 'already_member' | 'no_faction' | 'hook_miss';
  fit: number;                // the guild-fit value the score used
}
```

Both are registered in `TRACE_CATEGORIES` / `src/types/trace.ts` as usual.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| S1: `entries.length` is 0 or ≤ the cap | Existing early return (`entries.length <= MAX_SCORED_CANDIDATES`); the rotation is never computed |
| S1: hash input missing (no agent id) | Offset 0 — the old fill |
| S2: chosen candidate has no `finalScore` | `motivationPull` stays unset — today's behaviour |
| S2: rerouted target template no longer exists | Existing GUARD 5 (`getAnyEncounterById`) treats it as drift |
| S3: hall has no `factionDefId`, or the definition does not resolve | Skip that hall (today's per-hall early return, applied per hall) |
| S3: `computeReachShare` throws | fit = 0 — the join is still offered, just not favoured |
| S4a: a listed social id does not resolve | Skipped at runtime; the contract test fails in CI so it cannot ship |
| S4b: anomaly place subtype absent from the map | Nothing registered there; no error |
| S4c: a projected tag is missing from the vocabulary | `effectiveTags` omits it; the bearer-floor test fails in CI |

## Blast Radius

`src/data/unified-action-templates.ts` is imported by 189 files (`.codesight/graph.md`). S4b touches it only by appending ten ids to `CACHE_REGISTERED_REGIONAL_TEMPLATE_IDS`, a list read by one consumer (`encounterCache.ts:380`). No type or export shape changes; `regionalCacheRegistration.test.ts:51` pins the list at `toHaveLength(17)` and moves to 27 with S4b.

S4c's new `encounterType → tag` projection is below the importer line but wide in effect: it adds a tag to roughly 226 templates, and `effectiveTags` is read by about ten modules, among them `contentQuery.ts`, `contentEntryResolver.ts`, `contentCatalogView.ts`, `contentEntryTags.ts`, `contentCatalogs.ts`, `locationTraitBonus.ts` and `attachmentContract.ts`. `#trade` already exists in the tag vocabulary as a family tag (`content-tags.ts:232`); its current uses are on items and reward pools (`tagFilters: ['#trade']` in `encounter-content.ts:10462` filters possessions, not encounters). **Before merging S4, the executor greps every ContentQuery and card-router query over `encounter_template` for the ten projected tag names and records in the PR body that none changes its match set** — or, if one does, names it and states the effect. If a projected name collides with a family tag in a way that changes a query, prefix the projection (`#type:trade`) instead.

## Slicing

| Slice | Scope | Files (main) | Depends on | Size |
|---|---|---|---|---|
| **S1** — a fair shortlist (this ticket) | Phase 2 fill, `capCutTemplates` trace field, `shortlist-reaches-every-template` row | `encounterFilterPipeline.ts`, `agent-behavior-constants.ts`, `src/types/trace.ts`, `scripts/interface-contracts.ts` | — | small |
| **S2** — a journey keeps its goal | `motivationPull` on queue, target kept on both reroutes, First gate | `phaseAgentDecision.ts`, `phaseMovement.ts`, census script | S1 (stable baseline) | small |
| **S3** — deciders who join guilds | per-hall lifecycle, guild-fit term, join-to-membership repair, trace, debug accessor | `factionQuestGeneration.ts`, `encounterScoring.ts`, `factionOutcome.ts` (if the break is there), `debug-bridge.ts`/`.d.ts`, `faction-constants.ts` | S1 | medium |
| **S4** — social, anomaly, tags | S4a–c | `socialEncounterGeneration.ts`, faction definitions, `unified-action-templates.ts`, `encounter-anomaly-content.ts`, `location-trait-constants.ts`, `content-objects.ts`, tag vocabulary | S3 (for S4a's gate) | medium |

This ticket carries **S1**. S2–S4 are filed as their own tickets at handoff, each blocked as above.

## Three-pillar check

- [x] Engine pillar present — four mechanisms, each with a measured before, a code-cited cause and a re-measurable after
- [x] Content pillar present — repair-only, named per slice; no prose authored, by design (the reach half precedes the volume half)
- [x] UI pillar present — N/A with rationale (no surface changes); debug reads specified
- [x] Wiring section connects them — every new field has a named reader

## Vision audit

- [x] This plan does not contradict any Vision premise. **Mortal autonomy:** nothing here makes a mortal do anything — S1 widens what a mortal *considers*, S3 makes joining attractive when the guild fits, S2 lets a mortal finish the trip it chose, and The First gets no special rule. **Variety** ("the same encounter twice should be rare"): S1 removes an ordering bias that let registration order decide which writing ever appears. **Failure is plot:** a join can still fail its roll, and that failure is a traced reason, not a silent drop.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. The rulebook already says mortals take on challenges near their level and that guilds are joined through play; this plan makes both true in more places.
- [x] No rulebook edit (`Docs/canon/rulebook.md` and the quick reference are untouched).

> Brainstorm companion: `Docs/plans/2026-09-27-thr-1633-written-encounters-land-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | How |
|---|---|---|
| 1. Tunability | PASS | Every new number is a named constant (§ Constants); each behaviour has an off-switch |
| 2. Inspectability | PASS | `capCutTemplates` makes the positional cut visible; `guild_join_resolved` explains every join; `__DEBUG.getGuildJoinFunnel()` |
| 3. Determinism | PASS | S1 rotation is a pure hash of (agent, tick); no PRNG stream consumed; no `Math.random` |
| 4. Fail-soft | PASS | § Fail-soft table; every new branch falls back to today's behaviour |
| 5. Narrative over mechanics | PASS | Membership follows character (guild fit); journeys end where they were meant to |
| 6. Additive over destructive | PASS | Reserves untouched; old fill and first-hall rule kept behind switches; no field removed |
| 7. Performance budget | PASS | Cap size unchanged; one extra pass over an already-walked list; per-hall candidates add at most 4 entries on the busiest hall town; S2 gate checks decision ms |

## Kill criteria

- **S1:** if rotation makes the top-10 share *rise* above 0.30, or a determinism test shows run-to-run drift, turn `CAP_FILL_ROTATE` off and ship distinct-first alone; report.
- **S3:** if no `FACTION_JOIN_FIT_BONUS` in 0.2–1.0 reaches the coverage gate without joins taking more than 40% of the boards they reach, stop and report the join funnel — that would mean the join encounter itself needs design, which is a Christian-facing fork (what belonging should cost), not a tuning call.
- **Any slice:** decider count at t200 above +10% of baseline, or steady-state ms per tick above +10% (THR-1592's line) → stop and report.

## Done when

**S1 (this ticket):**
- [ ] Phase 2 fill is distinct-first with a rotating start, behind `CAP_FILL_DISTINCT_FIRST` / `CAP_FILL_ROTATE`.
- [ ] `encounter_filter` traces carry `capCutTemplates`.
- [ ] `readers/reach.ts 42,99 200` on the slice branch: `funnel:cap` first-gate templates ≤ 10 per seed; drawable fired ≥ 121; top-10 share ≤ 0.30 — before/after table in the PR body.
- [ ] Existing reserve tests (branching, personally offered, social) green unchanged; a new test pins that a template placed last in a 200-entry list reaches the shortlist on some tick within 40 ticks.
- [ ] `shortlist-reaches-every-template` registered in `scripts/interface-contracts.ts`; interface map regenerated.
- [ ] Code gate (`npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` for the engine touch, 30-tick CLI smoke) green.

**S2–S4:** the gates in each slice's § After, carried verbatim into their tickets.

## Coordination block

**Suggested model:** opus — S1 is small but sits on the shortlist every mortal decision passes through; the determinism reasoning wants care.
**Parallel-safe with:** [THR-1570](https://linear.app/threadbare/issue/THR-1570) (item generator — disjoint files); [THR-1635](https://linear.app/threadbare/issue/THR-1635) (culture openings — prose layer, disjoint files).
**Mutex with:** any ticket editing `src/engine/encounterFilterPipeline.ts` or the cap constants in `src/data/agent-behavior-constants.ts` (both S1 surfaces). [THR-1635](https://linear.app/threadbare/issue/THR-1635)'s plan names this ticket as a possible mutex on `encounter-content.ts`; S1 does not touch that file (S4b edits `unified-action-templates.ts` only), so the two are parallel-safe for S1.

**Files to touch:**
- Edit (S1, this ticket): `src/engine/encounterFilterPipeline.ts` (Phase 2 fill; `capCutTemplates` in `buildTrace`), `src/data/agent-behavior-constants.ts` (`CAP_FILL_DISTINCT_FIRST`, `CAP_FILL_ROTATE`), `src/engine/factionAmbitions.ts` or a shared util (export `hashString` from one home), `src/types/trace.ts` (field), `scripts/interface-contracts.ts` + `Docs/canon/interface-map.md` (row), tests beside `encounterFilterPipeline`.
- S2–S4 carry their own lists (§ Slicing); S4 also edits `Docs/plans/2026-04-16-systemic-wiring-guide.md` (the new `encounterType` tag projection is a content-facing capability).

## Notes for the executor

- **Re-run the readers, do not trust this doc's numbers blindly.** Commands are in `Docs/audits/2026-09-25-living-world-data/README.md`; bundle with esbuild and strip the `[WorldGen]` log lines before parsing (they print to stdout ahead of the JSON).
- **The eligibility funnel cannot see a positional cut** (impediment #239). `reach.ts` attributes the cap by diffing ids entering and leaving the stage; keep that method when you verify S1.
- **Five slice encounters** (`encounter.slice.*`) are under Christian's playthrough ([THR-1220](https://linear.app/threadbare/issue/THR-1220)). S1 changes which encounters mortals *consider*, not those five templates, and a `?spawn=` review link bypasses the draw. No hold is needed — but if a slice encounter's firing count moves by more than half on either seed, say so in the PR body.
- `readers/guild-join.ts` is new with this plan; `getAgentLocation` returns a **node**, not an id — the first draft of that reader got it wrong and reported zero halls everywhere.

## Intent-judge verdict

**Allow** — impact class Reversible (judge-confirmed), 2026-09-27, cold spawn on fable, ~175 s, anti-correlation guard held. Action proposal: `Docs/plans/.intent-proposals/2026-09-27-thr-1633-written-encounters-land.md`.

- Dimension 1 (intent fidelity) PASS: substituting the shortlist cap for fix 1 "is the ticket's own instruction followed, not drift"; every boundary kept.
- Two GAPs, both folded in before the PR: **UL** — "decider" is not a UL term; code-facing names now say *spotlight* (`GUILD_SPOTLIGHT_COVERAGE_MIN`, `spotlight-mortal-joins-guild`) and the **Words** note defines the shorthand. **Blast radius** — S4c's projection reaches about ten `effectiveTags` readers; § Blast Radius now names them and requires a ContentQuery/card-router match check before S4 merges, and notes the `regionalCacheRegistration.test.ts` pin moving 17 → 27.
- Advisory folded in: `factionQuestGeneration.ts:289`, not `:288`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-27 (three cold auditors, sonnet, run in parallel).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | § Constants table: 10 named constants (`CAP_FILL_DISTINCT_FIRST`, `FACTION_JOIN_FIT_BONUS`, `GUILD_SPOTLIGHT_COVERAGE_MIN`, etc.), each tied to a specific behavior with an off-switch |
| 2. Inspectability | PASS | New `capCutTemplates` trace field, new `GuildJoinResolvedTrace` interface, new `__DEBUG.getGuildJoinFunnel()`; Wiring table names orchestrator phase/trace/debug visibility per slice |
| 3. Determinism | PASS | S1 rotation is `hashString(agentId + ':' + tick)` — explicitly "a pure hash... not a PRNG draw, so no seeded stream shifts"; PRNG callouts section states "None consumed" |
| 4. Fail-soft | PASS | § Fail-soft table enumerates 9 failure cases (missing hash input, no `finalScore`, drifted template id, etc.), each with a stated fallback to "today's behaviour" |
| 5. Narrative over mechanical | PASS | Vision audit: "S3 makes joining attractive when the guild fits"; "membership follows character (guild fit)"; failure-is-plot preserved via `guild_join_resolved` reason field |
| 6. Additive over destructive | PASS | "Reserves untouched; old fill and first-hall rule kept behind switches; no field removed"; `FACTION_LIFECYCLE_ALL_HALLS`/`CAP_FILL_ROTATE` restore prior behavior when false |
| 7. Performance budget | PASS | Blast Radius section scopes S4b to one 189-importer file touched via a single list append; cost stated as "unchanged by construction"; kill criteria include a steady-state ms regression stop condition |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | 4 slices (S1-S4), each with measured before/mechanism/gate, tick-phase and PRNG callouts filled |
| Content | present-and-substantive | Repair-only content work named per slice with explicit rationale (id/tag repairs, no new prose) |
| UI | N/A-with-rationale | "no component, modal or HexMapV2 layer changes... debug reads specified" — one-line reason given |

No missing required sections. Wiring section present and complete — table maps each of the 6 modules (S1 fill, S2 reroute, S3 lifecycle, S4a/b/c) to orchestrator phase, UI component, GameState field, trace emitted, and debug visibility. Substrate inventory cross-checked against `Docs/canon/systems-inventory.md`: Encounters & Dilemmas, Movement & Colocation, Factions & Succession, Location Traits, and Ruins Clues & Delves all exist as 🟢 ACTIVE entries — no green-field duplication; each row correctly states extends/preserves.

PILLAR AUDIT: PASS

### Vision audit

- `01-core-loop.md` → "one story at a time" / no drumbeat — [confirmed] S1 changes which templates enter the shortlist scoring pool, not encounter frequency or the scan→encounter→aftermath rhythm.
- `02-non-negotiables.md` → #1 god-not-protagonist — [confirmed] S2 explicitly rejects a First-only nudge rule; #4 graph edges — [confirmed] S3 writes `member_of`, an existing edge type; #7 three pillars — [confirmed] UI marked N/A with rationale.
- `03-design-tensions.md` → tension 2 (emergence vs. authored moments) — [extended] "reach before volume" makes existing authored content reachable through the emergent selection system rather than authoring more.
- `taste-profile.md` → "narrative over mechanical perfection" — [confirmed] stale pre-Doctrine-v2 prose in the 39/10 unblocked templates is deliberately left unedited pending THR-1634.

Vision contradictions: none. North star not directly advanced or harmed (reachability plumbing beneath the moment); core loop preserved; non-negotiables kept, including the refusal of a First-only exception; taste profile respected by deferring prose fixes to the correct downstream ticket.

VISION AUDIT: PASS
