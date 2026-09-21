> **title:** `Attention follows ambition — a strategic ambition pulls its holder into the spotlight — THR-1348`
> **linear_issue:** THR-1348
> **author:** `Claude Code`
> **created:** 2026-09-21
> **three_pillars:** Engine `done` · Content `done — one ambition template repaired, two mint sites stamped, one chronicle line, one rulebook sentence` · UI `done — no component edit; the hex map and LocationView already split by tier, so a pulled mortal appears where deciders appear; evidence by CLI census and jsdom, not capture`

# Attention follows ambition — THR-1348

*The world's builders should be the people the player can watch. Today a merchant with the trade ambition sits below the spotlight tier on eleven of twelve seeds, and the whole merchant-expansion family is unreachable because nothing carries a silenced holder to the board. This plan pulls the holder up instead of widening the loop.*

## Why this is load-bearing

THR-1329's instrument (`npm run census:reachability`) measured it and this plan re-measured it on `main` `df1cf66c` (40 ticks, medium): seed 42 has one autonomous `ambition_dominate_trade` holder and the family is reachable; seeds 99 and 7 have **zero autonomous and 2 / 1 silenced** holders — the ambition was assigned, to mortals the decision loop never visits. `ambition_forge_legend` has **zero holders of any tier on all three seeds**. The route economy, the masterwork kind and eight strategic templates have been validated on the one seed in twelve where they happen to be reachable.

**The ruling (Christian, attended chat 2026-09-10, superseding the 2026-08-29 Discord note):** reading 1 in its *attention follows ambition* form. The spotlight aperture is the intended attention budget and is not widened; notable and ambient mortals do not run the loop. **An ambition whose profile is strategic pulls its holder into the spotlight.** Reading 2 (notables carry undertakings off-screen at reduced cadence) is declined for its unmeasured per-tick cost and because it builds things nobody sees; reading 3 (report only) is declined because the gap is real. Four things the ruling said the plan must settle — the pull mechanism, the budget, `forge_legend`, and the census counters — are settled below. Two of the ticket's premises moved before this plan was written and are recorded so the executor does not re-fix them: **the lair-elite stamp shipped** (`lairEscalation.ts:235` writes `spotlightTier: 'ambient'`, pinned by `lairEscalation.test.ts:301-308`, THR-1403), and **both cutovers are done** (`UNDERTAKING_MODEL = 'cells'`, `strategic-action-constants.ts:1023`; `UNIFIED_DECISION_BOARD_MODE = 'live'`, `:558`).

The one warning carried from the ticket: **do not widen a gate until routes appear.** THR-1329 proved the route pipeline healthy; the defect is who reaches the board, and that is the only thing this plan changes.

## Substrate inventory

Grep evidence 2026-09-21. `spotlightTier` is a bare `properties` key (`SpotlightTier = 'ambient' | 'notable' | 'spotlight'`, `npc.ts:22`); eight readers spell `?? 'spotlight'`, the canonical one `isAutonomousDecisionActor` (`strategicKindReachability.ts:55-58`), shared with `phaseAgentDecision.ts:304-306` since THR-1329. **Promotion exists; demotion does not**: `hydrateToTier` (`npcGraduation.ts:251-265`) returns early when the current tier is at or above the target (*"Does not downgrade"*, `:249`). Its callers: `phaseNpcGraduation` (phase 2.38, importance-thresholded) and `hydrateThreadedIndividual` (`graphOpExecutor.ts:87-102`, a god's thread promotes straight to spotlight). Court positions are a property of the `thread` edge (`influence.ts:54`), orthogonal to tier — *followed / retinue* is an incoming `thread` edge whose `courtPosition` is not `'dormant'`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Ambitions & Undertakings** — `assignAmbitionToActor` (`ambitionAssignment.ts:71-126`, the extracted single funnel, THR-885), `assignInitialAmbitions` (`:24-39`), `passesEligibility` / `scoreDesirability` (`ambitionSelection.ts:66-154`), `ambitionTick`'s actor walk over **every** individual regardless of tier (`ambitionTick.ts:616-618`) with **two** inline `pursues` writers that bypass the helper — the mint-to-holder write (`:955`, fed by the mint lane's `selectAmbitions` call at `:562`) and the re-evaluation write (`:1023`) | 🟢 ACTIVE | **extends** — the pull runs after a successful assignment; the two inline writers are routed through the helper so a card-planted, world-minted, birth-assigned and re-evaluated ambition all pass the one hook |
| **Agent Lifecycle** — `hydrateToTier` (`npcGraduation.ts:251`), `TIER_ORDER`, `generateRoleCapabilities` keyed on `npcRole` (`:167`, `:277-278`), `NPC_CONSTANTS.SPOTLIGHT_THRESHOLD` / `SPOTLIGHT_MIN_EDGES` (`npc.ts:511-514`) | 🟢 ACTIVE | **extends** — the pull promotes *through* `hydrateToTier` (capabilities, profile, wealth, reputation) and a sibling `demoteToTier` is added; `phaseNpcGraduation` is untouched |
| **Strategic Projects & Control** — `isAutonomousDecisionActor` (`strategicKindReachability.ts:55`), `measureStrategicReachability` (`:110`, defaults to `AMBITION_TEMPLATES` only), `scripts/kind-reachability.ts` (`:73` no avatar exclusion; `:112` summary counts rows against families) | 🟢 ACTIVE | **extends** — the census measures all three template pools, excludes avatars, counts pulls and demotions; the summary line is corrected |
| **World Generation** — `AGENT_COUNT_BY_MAP_SIZE` (`agent-behavior-constants.ts:576-581`, medium 14–20; **one consumer, a worldgen seeding range** `worldSeed.ts:1595`, never a runtime cap); the +25 % tick-cost kill criterion recorded at `:570-575` (medium 18–24 measured +26 % / +39 %) | 🟢 ACTIVE | **preserves** — no runtime cap is introduced; the pull is a swap by default so the deciding population is flat by construction |
| Mint sites without a tier — mercenary commanders (`worldSeed.ts:1907-1924`; THR-1437 credits them with undertakings), dev agreement counterparties (`gameInit.ts:966`, no capabilities, no location), the avatar (`ascendant.ts:152,234`, excluded from the loop by name but counted by the census) | 🟢 ACTIVE | **stamps** — commanders `'spotlight'` (explicit, intended), dev counterparties `'ambient'`; the avatar is excluded from the census |
| `ambition_forge_legend` (`ambition-templates.ts:300-373`) — `requiredTraits: ['master_smith']` (`:304`), the **only** non-empty `requiredTraits` in the pool; `master_smith`'s sole producer is a tier-4 cursed artifact's `trait_grant` (`artifact-templates.ts:62`) that `seedPossessions` (`seedLivingWorld.ts:376`) can never deal; milestone `forge_materials` names `rare_ore_secured`, a trait the repo classifies dead (`traitRefReconciliation.test.ts:126-128`) | 🟢 ACTIVE (unreachable) | **repairs** — an assignment defect, not scoring: `passesEligibility` rejects on the missing trait before scoring runs, which is why the census reads 0 / 0 |
| Traces — `ambition_displaced` (`trace.ts:126,566,2261,3705` — the four registration sites), `ambition_minted` (aggregate per pass); `NpcGraduatedEvent` is a `TickEvent`, not a trace | 🟢 ACTIVE | **extends** — one aggregate `spotlight_pull` trace per tick |

Runtime counts this plan consumes (census, 40 ticks, medium, avatar included): autonomous actors 20 / 23 / 22 on seeds 42 / 99 / 7. Silenced trade holders 1 / 2 / 1.

## Engine pillar

### Systems design

**The rule.** When an ambition whose template carries a `strategicProfile` is assigned to an individual whose tier is below `spotlight`, the holder is pulled into the spotlight — promoted through `hydrateToTier(graph, id, 'spotlight', rng)` — and, to hold the deciding population flat, one spotlight mortal is demoted to `notable`. The pull happens **at assignment**, in one function, `pullHolderIntoSpotlight` (`src/engine/spotlightPull.ts`, new), called from `assignAmbitionToActor` immediately after the `pursues` edge is written. Assignment is the simpler and deterministic site the ruling preferred: it fires once per holder, and every route an ambition takes onto the graph already passes it — once the two inline `pursues` writers in `ambitionTick` (`:955`, the mint-to-holder write the mint lane's `selectAmbitions` at `:562` feeds; `:1023`, the re-evaluation write) are routed through the helper, which THR-885 extracted for exactly this purpose and which this plan finishes.

**Pulled once.** The pull stamps `spotlightPulledTick` and `spotlightPullDemotedId` (or `null`) on the pulled actor. A mortal carrying `spotlightPulledTick` is never pulled again — the mark is what stops the promote / demote churn the re-eval loop would otherwise drive, and it is the ledger the census reads.

**The budget is a swap.** The demotion candidate set is every spotlight individual that (a) is not the avatar, (b) has no incoming `thread` edge whose `courtPosition` is not `'dormant'` — *never a followed or retinue mortal*, the ruling's hard line — (c) holds no active ambition whose template carries a `strategicProfile`, (d) is not mid-encounter and holds no running undertaking, and (e) was not itself pulled. Ordered by **least recently witnessed**, then lowest `importance`, then id. There is no witness timestamp on the mortal today — the curator's recency read (`curator.ts:127-128`) is `lastTugAgentTicks`, a thread-*tug* tick that exists only for threaded mortals, which rule (b) excludes; and `visibility.ts`'s `lastSeenTick` is per hex, not per mortal. So the plan **adds the field**: `lastWitnessedTick`, written on the actor (and every bound cast member) at encounter resolution in `unifiedActionResolution.ts`, the site that already mints the encounter's Event node. A mortal never resolved in an encounter sorts first for demotion, which is the ruling's order made reachable rather than a fail-soft default. If the set is empty, the pull may run **net-additive** up to `SPOTLIGHT_AMBITION_PULL_MAX` outstanding overflow pulls (counted as pulled actors with `spotlightPullDemotedId === null` still in the spotlight); past that the pull is refused with reason `budget`, the holder stays silenced, and the census reports it.

**Demotion** — `demoteToTier(graph, id, 'notable')` writes `spotlightTier` only. Everything `hydrateToTier` minted on the way up (profile, capabilities, wealth, reputation) stays — additive, and a later re-promotion is a no-op on those fields. The demoted mortal keeps their ambitions (none strategic, by the candidate rule) and their place on the hex map (`HEXMAP_VISIBLE_NPC_TIERS` admits `notable`).

**A pull that cannot decide is refused.** `hydrateToTier` generates capabilities only for a mortal whose `npcRole` maps in `NPC_ROLE_REACH_MAP`; a pulled mortal with no capability path would sit in the loop failing every reach floor silently (the elite defect in another coat). So the pull checks that the holder has `domainCapabilities` after hydration and, if not, demotes nobody, reverts the tier, and refuses with reason `no_capability_path`.

**`forge_legend`.** The template's gate is retired: `requiredTraits: []`; `master_smith` moves to `boostingTraits` beside `trait.mastery.spell-weaver`, so the Worldforge Anvil's `trait_grant` keeps a consumer (`grantedTraitConsumers.test.ts:105-106` and the `trait_grant` contract's evidence at `interface-contracts.ts:861` cite that pairing — both are repointed to the boosting side in the same PR, never left asserting a gate that no longer exists); the abandonment trigger `agent_lacks_trait master_smith` becomes `agent_reach_below iron 0.3` (the reach-floor mirror); the dead `forge_materials` milestone becomes `agent_reach_above stone 0.3` (*the right metal, found at last* — Stone is the finding reach). The reach floors `iron 0.4 · veil 0.3` stay: they are what makes it a mastery ambition.

**Unstamped mints.** `worldSeed.ts:1907` stamps mercenary commanders `'spotlight'` — they decide today by accident and THR-1437 counts on them; making it explicit is the fix. `gameInit.ts:966` stamps the three dev agreement counterparties `'ambient'`. The global `?? 'spotlight'` default is **not** flipped: eight readers and `strategicKindReachability.test.ts:82` pin it, and worldgen-era fixtures depend on it.

**The census.** `measureStrategicReachability` measures `AMBITION_TEMPLATES ∪ GRIEVANCE_AMBITION_TEMPLATES ∪ EVENT_MINTED_AMBITION_TEMPLATES` by default (three more strategic profiles live in the second and third pools, invisible today); `scripts/kind-reachability.ts` passes the avatar ids as `excludedActorIds` and fixes the summary line (`:112` divides rows by families). `scripts/undertaking-census.ts` reports `spotlightPulls`, `spotlightDemotions`, `pullsRefused` by reason, beside `meanAutonomousMortals` (`:146-147`).

**What does not change.** The decision loop's membership predicate, `phaseNpcGraduation`, `hydrateThreadedIndividual`, the eligibility funnel, the board, the strategic scorer, every existing trace.

### Graph nodes / edges

None new. Four properties on actor nodes: `spotlightTier` (existing, now also written down), `spotlightPulledTick`, `spotlightPullDemotedId`, and `lastWitnessedTick` (written at encounter resolution). Two mint sites gain a `spotlightTier` literal.

### Tick phases

None new. The pull runs inside whichever phase assigns the ambition (worldgen, `2.4` births, the ambition re-evaluation pass, aftermath `assign_ambition`). Demotion runs in the same call.

### Resolution logic

Deterministic: the demotion candidate order is a total order (witness tick, importance, id) — never graph iteration order.

### PRNG callouts

`hydrateToTier` draws for the axiological profile and archetype of a mortal that lacks them. The pull passes the calling phase's seeded stream (`ambitionTick` and `worldSeed` already hold one; `assignAmbitionToActor` gains an `rng` option and the aftermath caller passes the aftermath stream). No `Math.random`.

## Content pillar

### Encounter templates

N/A — no encounter is authored or edited.

### Prose tables

One chronicle line on a pull, low significance (`SPOTLIGHT_PULL_EVENT_SIGNIFICANCE`): *`${name} sets their mind to ${ambition displayName}`* — the mortal steps into the story the player can watch. None on demotion (a mortal fading from attention is not an event; Law 13's parity clause — the quantity has no player surface).

### Attachment content

N/A.

### Data tables

`ambition_forge_legend` repaired as above (`ambition-templates.ts:300-373`). Constants below. **Rulebook** (`Docs/canon/rulebook.md`, § The World at Work): *A mortal whose ambition is to build something the world can see — a trade route, a masterwork, a chapter — steps into the spotlight when they take it up, and one who has nothing to build steps back; the number of mortals the world simulates in full does not grow.* `[IMPL]` on ship. **UL** (`Agents.md`): there is **no** spotlight-tier headword today (the word appears once, inside the Calling entry), so the slice PR **seats a new one** — **Spotlight tier**: *ambient · notable · spotlight; only spotlight mortals run the decision loop; a strategic ambition pulls its holder up and swaps out the least-recently-witnessed spotlight mortal with no strategic ambition; a threaded mortal is never demoted* — under the delegated-seating rule (Process.md: seating is delegated to agents with Christian's veto retained), the same path THR-1479's **Appointment** takes. **Canon** `Docs/canon/undertakings.md`: one paragraph.

## UI pillar

*Screenshot tool: none owed — no file under `src/components/`, `src/hooks/`, `src/contexts/` or `src/index.css` is edited. Evidence: the CLI census and a jsdom assertion that `hexMapAgentVisibility` admits the pulled mortal. If the executor edits a component after all, the Playwright route on `?view=game&seeded&size=medium` applies with the four-part evidence.*

### Player-facing display

No new surface. A pulled mortal moves from LocationView's *NPCs* column to *Agents Present* (`LocationView.tsx:1466-1470`) and, if they were ambient, appears on the hex map (`hexMapAgentVisibility.ts:3`); a demoted mortal stays on the map as notable. The chronicle line is the one place the player hears it.

### Event notifications

The chronicle line above. No toast.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getSpotlightLedger()` → `{ pulled: [{ id, templateId, tick, demotedId }], overflow: number, refused: [{ id, reason }] }`; CLI `spotlight` (sibling of `agents`).
- The `spotlight_pull` trace in the viewer.

### Visual presence (HexMapV2)

N/A — existing tier filter; no new signifier.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/spotlightPull.ts` (new: `pullHolderIntoSpotlight`, `demotionCandidates`, `demoteToTier`) | called from `assignAmbitionToActor` | — | actor properties (`spotlightTier`, `spotlightPulledTick`, `spotlightPullDemotedId`) | `spotlight_pull` (aggregate per tick) | `__DEBUG.getSpotlightLedger`, CLI `spotlight` |
| `engine/ambitionAssignment.ts` (calls the pull; gains `rng` option) · `engine/ambitionTick.ts` (two writers, `:955` and `:1023`, routed through the helper) | worldgen · `2.4` · re-eval · aftermath | — | `pursues` edges (unchanged shape) | existing `ambition_*` | — |
| `engine/npcGraduation.ts` (`demoteToTier` beside `hydrateToTier`) | — | — | — | — | — |
| `engine/strategicKindReachability.ts` · `scripts/kind-reachability.ts` · `scripts/undertaking-census.ts` | instrument | — | — | — | census output |
| `data/ambition-templates.ts` (`forge_legend`) · `engine/worldSeed.ts:1907` · `engine/gameInit.ts:966` | worldgen | — | — | — | — |

Prose pipeline: none. Player controls: none — the pull is the world's; the god's lever stays the Kindled Ambition card (which now also pulls, through the same helper).

## Constants table

In `src/data/agent-behavior-constants.ts` beside `AGENT_COUNT_BY_MAP_SIZE` (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `SPOTLIGHT_AMBITION_PULL_ENABLED` | `true` | the lever; `false` restores today's behaviour byte for byte |
| `SPOTLIGHT_AMBITION_PULL_MAX` | `2` | outstanding net-additive pulls allowed when no demotion candidate exists; past it the pull is refused |
| `SPOTLIGHT_WITNESS_WINDOW_TICKS` | `36` | ticks beyond which a mortal counts as *not recently witnessed* (three days); ties inside the window fall to `importance` |
| `SPOTLIGHT_PULL_EVENT_SIGNIFICANCE` | `0.3` | the chronicle line's significance |

## Tracing

Register at all four sites (`TraceCategory` union, `TRACE_CATEGORIES`, the payload interface, the all-traces union); never duck-type.

```ts
// spotlight_pull — one aggregate per tick in which at least one pull ran or was refused
interface SpotlightPullTrace extends TraceBase {
  category: 'spotlight_pull';
  pulled: ReadonlyArray<{ agentId: string; templateId: string; fromTier: SpotlightTier; demotedId: string | null }>;
  refused: ReadonlyArray<{ agentId: string; templateId: string; reason: 'budget' | 'no_capability_path' | 'already_pulled' | 'disabled' }>;
  autonomousAfter: number; // the deciding population after this tick's pulls
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Template has no `strategicProfile` | no pull; nothing traced |
| Holder is already spotlight | no pull; nothing traced |
| Holder has no `npcRole` mapping → no capabilities after hydration | tier reverted, nobody demoted, `refused: no_capability_path` |
| No demotion candidate and overflow exhausted | `refused: budget`; holder stays silenced; census reports it |
| `spotlightPulledTick` already set | `refused: already_pulled` |
| `lastWitnessedTick` absent on a candidate (never resolved in an encounter, or a saved world from before this plan) | treated as never witnessed (sorts first for demotion) — correct for the first case; for a saved world every candidate ties and `importance` then id decide |
| `rng` not supplied to `assignAmbitionToActor` | the pull still runs; `hydrateToTier` receives a stream derived from `(seed, tick, actorId)` so the profile is reproducible |
| `SPOTLIGHT_AMBITION_PULL_ENABLED = false` | no pull; `refused: disabled` traced once per assignment so the census can see the lever |

## Interface impact

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `ambition-acquisition` (`interface-contracts.ts:971`) | **extend** | symbols gain `assignAmbitionToActor`, `pullHolderIntoSpotlight`; read sites unchanged; evidence re-verified after the two inline writers route through the helper |
| `strategic-ambition-pulls-holder-into-spotlight` | **add** | producer `spotlightPull.ts` (`spotlightTier` write) → consumers `isAutonomousDecisionActor` (the loop), `hexMapAgentVisibility`, `LocationView`, the census; registered 🟢 on landing with the census hit as evidence |
| `trait_grant` non-vacuity evidence (`interface-contracts.ts:861`) | **repoint** | from the `requiredTraits` pairing to the `boostingTraits` pairing on `forge_legend`; `grantedTraitConsumers.test.ts` asserts the new side |
| Decision-board contract (`:3010`) | **preserve** | untouched |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 125 (`.codesight/graph.md`, 2026-09-21) | one union member + one interface; ratchet covers it |
| `src/engine/gameInit.ts` | 122 | one `spotlightTier: 'ambient'` literal on the three dev counterparty nodes at `:966`; no signature or export changes; ratchet covers it |
| `src/data/ambition-templates.ts` | 40 | one template's fields; below the cutoff |
| `src/engine/graph.ts` / `src/types/gameState.ts` | 913 / 599 | **not edited** — the ledger is actor properties, not a state field |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (no edit; surfaces and evidence named)
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. `00-north-star.md`: a mortal must be witnessed before their crisis lands — the pull is that premise applied to ambition: the builders become the watched. The attention budget (the number the world simulates in full) is preserved, not inflated. The god steers nothing here.
- [x] No Vision edit required.

## Rulebook impact

- [x] **Changes a rule of play** (who is simulated in full). The sentence in § Data tables lands in `Docs/canon/rulebook.md` in the same PR, `[IMPL]` on ship.
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the code — the executor re-verdicts § The World at Work when the tag flips to `[IMPL]`.

> Brainstorm companion: `Docs/plans/2026-09-21-thr-1348-attention-follows-ambition-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | four constants; the lever restores today's behaviour |
| 2. Inspectability | PASS | aggregate trace with reasons, ledger on the node, `getSpotlightLedger`, census counters |
| 3. Determinism | PASS | total order on demotion; seeded hydration stream |
| 4. Fail-soft | PASS | eight rows; every refusal is a reason, never a throw |
| 5. Narrative over mechanical perfection | PASS | the mortal who takes up a great work steps into the story; the one with nothing to build steps back |
| 6. Additive over destructive | PASS | demotion strips nothing hydration minted; the default is not flipped; the gate on `forge_legend` moves to boosting rather than vanishing |
| 7. Performance budget | PASS | swap keeps the deciding population flat; `measure:tick-cost` is the Done-when's instrument |

## Done when

- [ ] Unit, on fixtures that falsify: a strategic-profiled assignment to an ambient holder promotes through `hydrateToTier` and demotes exactly one candidate in the defined order; a followed / retinue / avatar / strategic-holder / mid-encounter mortal is never demoted; a second assignment to a pulled mortal is refused `already_pulled`; a holder with no capability path is reverted and refused; overflow stops at `SPOTLIGHT_AMBITION_PULL_MAX`; the lever off traces `disabled`; the trace carries `autonomousAfter`
- [ ] The two inline `pursues` writers in `ambitionTick.ts` (`:955`, `:1023`) route through `assignAmbitionToActor` and a shared-path test asserts the edges are byte-identical before and after
- [ ] `lastWitnessedTick` is written at encounter resolution for the actor and bound cast, and the demotion order on a fixture with three candidates of distinct witness ticks is the ruling's order (least recent first), never `importance` alone
- [ ] `npm run census:reachability -- --seeds 42,99,7`: `merchant-expansion` reachable on **≥ 2 of 3** (baseline 1 of 3); `ambition_forge_legend` has ≥ 1 holder on ≥ 2 of 3 (baseline 0 of 3); the report names pulls, demotions and refusals per seed; avatars excluded; all three template pools measured
- [ ] `npm run census:undertakings` on seeds 42 and 99: `startsPerMortalPer100Ticks` at or above the floor (the swap keeps the denominator flat — a net-additive run that reds this gate is the plan's own kill criterion)
- [ ] `npm run measure:tick-cost` at medium: ≤ +25 % over the pre-change baseline on seeds 42 and 99 (expected ≈ 0 with swaps)
- [ ] Mercenary commanders and dev counterparties stamped; `grantedTraitConsumers.test.ts` and the `trait_grant` contract evidence repointed to the boosting pairing; `traitRefReconciliation.test.ts` ratchet updated for the retired `rare_ore_secured` reference
- [ ] Rulebook sentence, UL paragraph, canon paragraph; wiki freshness green; interface contracts registered
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; 30-tick CLI smoke; `npm run test:heavy` locally
- [ ] Closing commit body and PR body include `Fixes THR-1348`

## Kill criteria

- Tick cost at medium rises above +25 % → the overflow constant goes to `0` before anything else; if it is still over, the pull is disabled and the finding goes on the ticket — the ruling declined reading 2 for exactly this cost.
- `startsPerMortalPer100Ticks` reds after landing → pulled mortals are entering the loop without generating candidates; check the capability path before the budget.
- A followed or retinue mortal is ever demoted → the candidate filter regressed; fix there, never by widening the overflow.
- Promote / demote churn appears in the ledger (a mortal pulled, demoted, pulled) → the `already_pulled` mark is not being read on the second path.

## Coordination block

**Suggested model:** opus — the demotion order and the capability refusal are judgment seams; the routing of the two inline writers through the helper is the delicate refactor.
**Parallel-safe with:** [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointments — `encounterSeeding.ts`, `phaseAgentDecision.ts`, `encounterScoring.ts`; this plan edits none of them), [THR-1448](https://linear.app/threadbare/issue/THR-1448) (held-town position — `decisionBoard.ts`, `encounterFilterPipeline.ts`, `factionMetaScope.ts`; disjoint), [THR-790](https://linear.app/threadbare/issue/THR-790) (traits — disjoint).
**Mutex with:** any ticket editing `src/engine/ambitionTick.ts` or `src/engine/ambitionAssignment.ts` (the writer routing) — none queued at handoff; `src/data/ambition-templates.ts` (the `forge_legend` repair) — THR-1448's plan may add a cell to an ambition template; sequence either order, the edits are on different templates.
**Files to touch:** `src/engine/spotlightPull.ts` (new), `src/engine/ambitionAssignment.ts`, `src/engine/ambitionTick.ts` (two writers, `:955` and `:1023`), `src/engine/unifiedActionResolution.ts` (`lastWitnessedTick` write at resolution), `src/engine/npcGraduation.ts` (`demoteToTier`), `src/engine/strategicKindReachability.ts`, `scripts/kind-reachability.ts`, `scripts/undertaking-census.ts`, `src/data/agent-behavior-constants.ts`, `src/data/ambition-templates.ts`, `src/engine/worldSeed.ts` (`:1907`), `src/engine/gameInit.ts` (`:966`), `src/types/trace.ts` (+ three sites), `src/debug-bridge.ts` + `.d.ts`, `scripts/cli.ts`, `scripts/interface-contracts.ts`, `src/engine/__tests__/grantedTraitConsumers.test.ts`, `src/engine/__tests__/traitRefReconciliation.test.ts`, `Docs/canon/{rulebook.md,undertakings.md}`, `Docs/ubiquitous-language/Agents.md`, wiki page per manifest; tests: `src/engine/__tests__/spotlightPull.test.ts` (new), `ambitionAssignment-routing.test.ts` (new), the census scripts' tests.

## Notes for the executor

- **Pull at assignment, once.** Not in the decision loop, not per tick. The mark on the node is the guarantee; write it before the demotion so a throw between the two cannot leave a mortal pullable twice.
- **Route the inline writers first.** Until `ambitionTick`'s two `pursues` writers (`:955` mint-to-holder, `:1023` re-evaluation) go through the helper, the world-mint and re-eval lanes — which produce most silenced holders — never reach the hook. `:562` is the mint lane's `selectAmbitions` call that feeds `:955`, not a third writer. This is the refactor the plan is about; the pull is the smaller half.
- **Write `lastWitnessedTick` at resolution, not at spawn.** A mortal is witnessed when their encounter resolves and the player could have seen it, which is where the Event node is minted. Do not stamp it on ambient scene cast at bind time — that would make every extra in a town "recently witnessed".
- **Never demote a threaded mortal.** Read incoming `thread` edges, not a tier, not a `follow` edge (none exists). `'dormant'` is the one court position that does not protect.
- **Do not flip the `?? 'spotlight'` default.** Stamp the two mint sites instead. The default is pinned by name in `strategicKindReachability.test.ts:82` for a reason.
- **Demotion strips nothing.** Write `spotlightTier` and stop. A demoted mortal's profile and capabilities are theirs.
- **The census denominator is `meanAutonomousMortals`.** A net-additive pull lowers `startsPerMortalPer100Ticks` mechanically; the swap is not a nicety, it is what keeps the acceptance gate honest.
- **`forge_legend` is content, and it has a UL dimension.** `master_smith` stays real (the Anvil still grants it, and it still boosts); what goes is the gate. Repoint the two assertions that cite the old pairing in the same PR — a green test on a dead contract is the pathology the interface map exists to kill.
- **The commanders are deciders on purpose now.** Stamping them `'spotlight'` records what THR-1437 measured; do not stamp them `'ambient'` to "clean up".

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-21): Revise** — Reversible confirmed; eight dimensions PASS, three GAPs, all author-fixable: the plan counted three inline `pursues` writers where the source has two (`ambitionTick.ts:955`, `:1023`; `:562` is the mint lane's `selectAmbitions` call); the witness field it cited (`curator.ts`) is `lastTugAgentTicks`, a thread-tug map absent on every eligible demotion candidate, so the ruling's order degenerated to `importance`; `gameInit.ts` (122 importers) was missing from Blast Radius and the counts were stale; the UL entry the plan promised to extend does not exist. All four fixed in this revision: two writers named by line; `lastWitnessedTick` committed, written at encounter resolution in `unifiedActionResolution.ts`; Blast Radius refreshed from `.codesight/graph.md`; **Spotlight tier** seated as a new headword under delegated seating.

**Run 2 (fable, cold, 2026-09-21): Allow** — ten dimensions PASS, one GAP (three residual "three writers" strings in the wiring row, the interface-impact row and the proposal), fixed in this revision. All four run-1 actions confirmed satisfied by the judge against source.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-21 (sonnet, three auditors spawned in one message). The auditors ran on the run-1 draft in parallel with the judge's run 1; the run-2 revision changed anchors, one field commitment and the UL seat, none of which alters an NFP, a pillar section or a Vision premise, so the verdicts stand.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 4 named constants (`SPOTLIGHT_AMBITION_PULL_ENABLED/_MAX`, `SPOTLIGHT_WITNESS_WINDOW_TICKS`, `SPOTLIGHT_PULL_EVENT_SIGNIFICANCE`); "the lever restores today's behaviour byte for byte" |
| 2. Inspectability | PASS | aggregate `spotlight_pull` trace with `pulled`/`refused`/`autonomousAfter`; `getSpotlightLedger()`; CLI `spotlight`; census counters |
| 3. Determinism | PASS | demotion order is a total order (witness tick, importance, id), "never graph iteration order"; seeded stream named, derived-stream fallback for a missing `rng`, "No `Math.random`" |
| 4. Fail-soft | PASS | 8-row fail-soft table, every failure mode maps to a `refused: reason` rather than a throw |
| 5. Narrative over mechanical | PASS | chronicle line authored; "the mortal who takes up a great work steps into the story" |
| 6. Additive over destructive | PASS | demotion "strips nothing hydration minted"; default `?? 'spotlight'` not flipped; `forge_legend` gate moved to `boostingTraits` rather than deleted |
| 7. Performance budget | PASS | swap-based budget keeps the deciding population flat; kill criterion at +25 % tick cost with `measure:tick-cost` as the instrument and an explicit rollback lever (overflow → 0) |

**NFP AUDIT: PASS.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, and PRNG callouts all filled with module/line-level detail |
| Content | present-and-substantive | Encounter templates and Attachment content correctly N/A with rationale; Prose tables and Data tables carry real content (chronicle line, rulebook/UL/canon updates, `forge_legend` repair) |
| UI | present-and-substantive | All four subsections filled; no component edit is made but the N/A-equivalent is justified (tier split already surfaces the pulled mortal) with named evidence substitution (CLI census + jsdom) |

No missing required sections. Wiring table maps each module to call sites, property fields, the `spotlight_pull` trace and debug visibility. Substrate check: four subsystems, all 🟢 ACTIVE in the inventory, dispositions stated per row; no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → "a mortal has to feel like a person… witnessed… before the crisis arrived" — extended: the pull is the mechanism that gets a strategic-ambition holder witnessed. `01-core-loop.md` → the attention budget — confirmed: swap-based demotion keeps the deciding population flat and declines widening the loop. `02-non-negotiables.md` → three pillars confirmed; no player-control change; new fields are node-internal data, not relationships. `03-design-tensions.md` → Tension 5 (one perfect story vs portfolio breadth) engaged deliberately, resolved toward "stage narrow, portfolio broad". `taste-profile.md` → prose-first, no numbers surfaced, demotion has no player-facing event (Law 13 parity). No contradictions. **VISION AUDIT: PASS.**
