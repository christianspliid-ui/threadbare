> **title:** Unwatched builders step back — the spotlight follows who is building — THR-1523
> **linear_issue:** THR-1523
> **author:** Claude Code
> **created:** 2026-09-24
> **three_pillars:** Engine `done` · Content `N/A — no templates, prose or data tables change; the pull already writes its one chronicle line` · UI `N/A — no component changes; the spotlight's player surface (Agents Present, the pull's chronicle line) reads the new membership as it is`

# Unwatched builders step back — THR-1523

*Attention follows ambition only while someone can make room; today no one can, so after the first two newborns the spotlight freezes.*

## Why this is load-bearing

THR-1348 shipped "attention follows ambition", under the ruling of 2026-09-10. When a mortal below the spotlight takes up a strategic want, they are pulled into the deciding tier. The least-recently-witnessed spotlight mortal **with no strategic ambition** steps back, so the deciding population stays flat. The ruling's intent was *"the world's builders become the people the player can watch"*, with a flat population, a followed or retinue mortal never demoted, and acceptance by `census:reachability` and `census:undertakings`.

The census after landing measured the pull stalling. This session's research found why. The pool of mortals who can step back is **empty from tick 0**:
- Nine of the ten standard ambition templates carry a `strategicProfile`; only `ambition_greatest_healer` does not (`ambition-templates.ts:942`).
- Every mortal takes two wants (`ambitionAssignment.ts:31`), so every worldgen protagonist is a builder protected for life.
- The only ambition-less deciders are the mercenary commanders and garrison captains, and `holdsSeat` protects them (`spotlightPull.ts:177-193`).

So every pull is net-additive until the overflow allowance (two on a medium map) is spent, and after that every newborn's want is refused. A refused newborn is **never retried**: the pull fires only at assignment, and the refusal's only reader is the ledger (`spotlightPull.ts:464`). The practical shape is that the first two newborns after worldgen are pulled and then the spotlight is frozen for the rest of the run. The rulebook's *"one who has nothing to build steps back"* (`rulebook.md:419`) almost never fires.

**Why this plan decides rather than asks.** The ticket put four options (A as shipped, B witness beats want, C newborns are not builders yet, D raise the overflow) and wrote *"not the executor's to settle"*. That makes it a design session's work, and this is that session. It is not a fork in what the game should *mean*: the 2026-09-10 ruling is an agreed outcome, and every option can be tested against it. So under `Docs/canon/process.md` § User review interface rule 4 (*"A ticket author writing 'this needs a decision' does not make it Christian's decision"*), the session decides and presents the decision in chat, in game terms, with a veto invited. It takes **B, with five guards**:
- **A** freezes the spotlight, against the ruling's intent.
- **C** needs a non-strategic pool that does not exist. It also loses the pull that makes merchant-expansion reachable on seed 99 (the ruling's own acceptance test), and newborns have no age to grow out of.
- **D** does nothing at medium unless the share is pushed past its documented range. Its tick cost breaks the +25% ceiling at six.
- **B** keeps the population flat, protects every mortal the player follows or has threaded, and lets the spotlight follow the mortals actually building.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Spotlight pull (`src/engine/spotlightPull.ts`: `pullHolderIntoSpotlight` `:354-427`, `demotionCandidates` `:239-258`, `compareDemotionCandidates` `:216-233`, `witnessAge` `:211-214`, `countOverflowPulls` / `overflowAllowance` `:260-283`, the node-property ledger `:60-80`, `readSpotlightLedger` `:448-481`) | 🟢 ACTIVE | **extends**: a second candidate class (unwatched builders), five guards, one ledger key, and two corrections (one pull per holder per batch; the retained dead never count) |
| Ambition assignment (`ambitionAssignment.ts:165-171`, the pull's one caller). `assignAmbitionToActor` has seven callers; § 7 lists them and says which pass the follow list | 🟢 ACTIVE | **extends**: births and re-evaluation call the pull once per holder per batch; the four in-play call sites pass the follow list and the projects |
| Follow state (`state.followedAgentIds`, optional on `GameState` at `src/types/gameState.ts:285`, set at world start by `defaultFollowedAgentIds`, `gameInit.ts:357`; `followedAgents.ts:139-143`; written by `followAgent`, `:198`, from `FollowToggle`) | 🟢 ACTIVE | **reads**: a followed mortal is never an unwatched builder |
| Movement (`properties.movementState.movementQueue`, `phaseMovement.ts:78-81`) | 🟢 ACTIVE | **reads**: a travelling mortal is never an unwatched builder (only spotlight mortals move, `phaseMovement.ts:64-66`, so a demoted traveller would freeze mid-route) |
| Witnessing (`markWitnessed` in `recordStepEventNode`, `unifiedActionResolution.ts:2949-2957`, its one call site) | 🟢 ACTIVE | **reads**, with a floor and the undertaking-progress term below |
| Undertakings (`strategicState.projects[].lastProgressTick`, `src/types/strategicAction.ts:858`; written at `strategicActionLifecycle.ts:612`, `:1120` and `undertakingCheckpoints.ts:436`, `:618`, `:787`, `:802`) | 🟢 ACTIVE | **reads**: undertaking progress counts as activity, so a builder working off-screen is not "unwatched and idle". Finished projects are carried forward (`strategicActionLifecycle.ts:769-771`), so a work completed inside the window still counts |

## Engine pillar

### Systems design

**1. The unwatched-builder class.** A spotlight mortal who holds an active strategic ambition becomes a demotion candidate when **all** of the following hold:
- **Every existing non-ambition filter passes** (`demotionCandidates`: deciding tier; not busy, which already means no unresolved action and no active undertaking; not the avatar; no non-dormant thread; commands no army; holds no seat).
- **Not travelling:** `properties.movementState.movementQueue` is empty.
- **Not followed:** not in the follow list. The Follow button is the player's own attention tool, and today only a thread protects. Callers pass `state.followedAgentIds ?? []`: the field is optional on `GameState`, and an absent list must never read as "follows nobody" by accident (§ Fail-soft).
- **Not deceased.**
- **Unwatched past the threshold:** `tick − lastActive ≥ SPOTLIGHT_UNWATCHED_BUILDER_TICKS`, where `lastActive` is the maximum of:
  - `lastWitnessedTick` (any encounter they resolved, as actor, actor target or bound cast);
  - `spotlightPulledTick` (a pulled mortal counts from their pull);
  - the latest `lastProgressTick` among their undertakings, so a builder whose work advanced off-screen inside the threshold is active. `strategicState` lives on `GameState` (`gameState.ts:515`), not on the graph, and `demotionCandidates` takes only `(graph, tick, options)`. So the projects arrive as a pull option, `projects: state.strategicState?.projects ?? []`, passed beside the follow list by the same four call sites (§ 7). **Omitting the option fails closed**, exactly as the follow list does: no unwatched builder is offered. Only an absent `strategicState`, passed as `[]`, reads as "no progress";
  - `0`. **Guard 1, the floor:** the existing order treats never-witnessed as infinitely stale (`witnessAge`, `:211-214`), which is right for ambition-less candidates, but for builders it would demote the whole worldgen cast on day one.
- **Guard 4, pulled mortals can go unwatched too.** The existing `spotlightPulledTick` exclusion (`:248`) stays for the ambition-less class. A pulled mortal who has stopped building and gone unwatched steps back like anyone else. The pulled-once mark still forbids pulling them again, so there is no pull → demote → pull cycle.
- **A pulled mortal with no active strategic want is in neither class, on purpose.** When a pulled mortal's strategic ambition completes or is abandoned, they are not a builder (so the unwatched class skips them), and the `:248` exclusion keeps them out of the ambition-less class. They stay until re-evaluation gives them a new want (every mortal holds two), and from then on the unwatched rule applies to them. Lifting `:248` instead would let the pull demote its own newcomers the moment their first work finished.

**2. Ordering.** The existing candidates (no strategic ambition) always come first, in their existing order. Unwatched builders come after them, the longest-unwatched first; ties fall to `importance`, then id (a total order, NFP #3). A pull therefore reaches a builder only when no ambition-less candidate exists, which is the ruling's preference kept intact.

**3. Guard 5, bounded turnover.** At most `SPOTLIGHT_UNWATCHED_SWAPS_PER_WINDOW` unwatched-builder demotions per `SPOTLIGHT_UNWATCHED_SWAP_WINDOW_TICKS`.
- The demoted mortal carries one new ledger key, `spotlightUnwatchedDemotedTick`.
- The cap counts the nodes whose key falls inside the window. It is one pass over actors, as `demotionCandidates` already makes.
- Once the cap is reached, the pull behaves exactly as today: overflow, then a `budget` refusal.

**4. What the stepped-back builder keeps.** Their ambition (the `pursues` edge) stays; nothing is deleted. Below the spotlight the want is silent until they re-enter, through a god's thread (the existing route) or a later pull.
- **No chronicle line** is written for the demotion. This holds the existing parity: *"A demotion writes none (Law 13 parity: no player surface)"* (`agent-behavior-constants.ts`, `SPOTLIGHT_PULL_EVENT_SIGNIFICANCE`).
- By construction, nobody was watching them.

**4b. A mortal the player kindled is treated like any pulled mortal (decided here).** The Kindled Ambition card (`src/data/nudge-card-library.ts:1006`, `:1065`) pulls its target through the same door (`assign_ambition`, `encounterAftermath.ts:2425`; rulebook `:419`). Under guard 4 that mortal can step back like any other pulled mortal, and the pulled-once mark means only a thread returns them.
- **The alternative, rejected:** mark a pull by its source and exempt player-kindled pulls. The source would have to be the reaction's provenance, not the effect kind, because authored content also plants `assign_ambition` (`src/data/encounter-content.ts:8665`, `src/data/encounters/the-broken-seal.ts:308`). That is plumbing for a case the Follow button already covers.
- **What the player gets:**
  - a kindled mortal is guaranteed six days from the pull (the floor counts from `spotlightPulledTick`);
  - any progress on their work extends that;
  - following them keeps them for good.
- **Stated where the player reads rules:** the rulebook and UL sentences below say this plainly, and the chat presentation names it, so the veto covers it.

**5. Two corrections the research found**, in the same module, independent of the option chosen, declared here rather than smuggled in:
- **One pull per holder per batch.** Births call the pull once for each of a newborn's two wants (`agentLifecycle.ts:584-591`), and `refuse()` does not set the pulled mark (`spotlightPull.ts:342-346`), so the second call refuses again. The census counts every trace entry (`undertaking-census.ts:302-307`), so its refusal count is about twice the number of mortals. Births and re-evaluation call the pull once, with the first strategic want in the batch.
- **The retained dead never count.** `isAutonomousDecisionActor` (`decisionTier.ts:34-37`) and `countOverflowPulls` (`:261-270`) do not read `deceased`, and a retained death keeps the node with `deceased: true` (`agentLifecycle.ts:276-277`). So `countOverflowPulls`, `overflowAllowance`'s deciding count and both candidate classes skip `deceased`. A dead pulled mortal would otherwise hold an overflow slot forever. **This correction is not gated by the lever:** a corpse holding a slot is a defect in any mode.

**6. The lever.** `SPOTLIGHT_UNWATCHED_BUILDERS_ENABLED` gates the unwatched class, its guards and its cap, and nothing else. When false, the candidate set is today's **less the retained dead** (the §5 correction stands). Two tests pin this:
- on a fixture world that holds no retained dead, the lever-off set equals today's byte for byte;
- the dead exclusion has its own test, with the lever on and off.

**7. The callers.** `assignAmbitionToActor` has seven callers.
- **Four in-play call sites pass the follow list:**
  - births, `agentLifecycle.ts:585`;
  - the mint lane, `ambitionTick.ts:966`;
  - re-evaluation, `ambitionTick.ts:1014`;
  - the `assign_ambition` effect, `encounterAftermath.ts:2425`.
- **The four pass two options**: the follow list (`state.followedAgentIds ?? []`) and the projects (`state.strategicState?.projects ?? []`). Omitting either fails closed.
- **Three are exempt:**
  - `src/engine/binding/mintInhabitant.ts:378` passes `skipSpotlightPull` and never pulls;
  - `gameInit.ts:686` and `worldSeed.ts:1763` run at tick 0, where the floor means no builder can be unwatched, so the unwatched class is empty whatever they pass.
- A test pins the four and names the three exemptions.

### Graph nodes / edges

No new node or edge types. One new node **property** on a demoted mortal, `spotlightUnwatchedDemotedTick`, beside the existing ledger keys (`spotlightPulledTick`, `spotlightPullDemotedId`, `spotlightPullRefusedReason`), written through `graph.updateNode` as they are. It is internal bookkeeping read by the ledger and the cap, not a relationship.

### Tick phases

No new phase. The pull runs where it already runs:
- births in `agent_lifecycle`;
- mint and re-evaluation in `ambition_progress`;
- the `assign_ambition` effect at aftermath.

### Resolution logic

As above. Selection is a deterministic total order, and the cap is a count.

### PRNG callouts

None added. The hydration draw keeps its existing derived stream (`deriveSpotlightPullRng`, `:136-138`).

## Content pillar

Content: N/A. No template, prose, attachment or data table changes. The pull's existing chronicle line (*"sets their mind to…"*, significance 0.3) is the only content the mechanism has, and it is unchanged.

## UI pillar

UI: N/A. No component changes. What the player sees shift:
- **LocationView's "Agents Present" / "NPCs" split** (`src/components/Game/LocationView.tsx:1465-1472`) reads the tier, so an unwatched builder who steps back moves from the first list to the second.
- **The pull's chronicle line** now keeps firing past the first two newborns.

The mortals the player watches by thread or by Follow are never moved. A mortal the player kindled can step back after six unwatched, idle days (§ 4b). DebugPanel: the ledger gains the unwatched-demotion entries (below).

**The Follow button's words are filed separately, as THR-1573.** After this lands, Follow is the player's lever for keeping an unthreaded mortal in the spotlight, and its tooltip should say so. That is a `src/components` change with its own browser evidence, so it is its own ticket, blocked by this one, rather than folded into an engine slice.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: every module below names its orchestrator phase, UI surface, GameState field, trace and debug visibility.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `demotionCandidates` (unwatched class, guards) | wherever the pull runs (`agent_lifecycle`, `ambition_progress`, aftermath) | LocationView tier split | node property `spotlightUnwatchedDemotedTick` | `spotlight_pull`: each `pulled` entry gains `demotedReason` / `demotedUnwatchedTicks` | `getSpotlightLedger` (debug bridge) and CLI `spotlight` |
| the four in-play pull call sites (§ 7) | as above | — | pass `state.followedAgentIds ?? []` and `state.strategicState?.projects ?? []` | — | — |
| `countOverflowPulls` / `overflowAllowance` (deceased excluded) | as above | — | — | — | ledger |

**Prose pipeline:** none. **Player controls:** none. The Follow button already exists; this plan makes it protect.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `SPOTLIGHT_UNWATCHED_BUILDERS_ENABLED` | `true` | The lever. False restores today's candidate set exactly |
| `SPOTLIGHT_UNWATCHED_BUILDER_TICKS` | `72` | Ticks without an encounter or any undertaking progress (floored at tick 0, or the pull) before a builder may step back: six days, three times the census's typical gap between a mortal's encounter starts |
| `SPOTLIGHT_UNWATCHED_SWAPS_PER_WINDOW` | `1` | Most unwatched-builder demotions per window: bounded turnover |
| `SPOTLIGHT_UNWATCHED_SWAP_WINDOW_TICKS` | `12` | The window, one day |

`SPOTLIGHT_AMBITION_PULL_MAX` (2) and `SPOTLIGHT_AMBITION_PULL_OVERFLOW_SHARE` (0.1) are **unchanged**. The early pulls that carry the merchant-expansion evidence on seed 99 must survive.

## Tracing

The existing `SpotlightPullTrace` (`src/types/trace.ts:2362-2374`) keeps its shape. Each `pulled` entry (`agentId`, `templateId`, `fromTier`, `demotedId`) **gains** two optional fields:

```ts
// spotlight_pull — each `pulled` entry gains, beside the existing agentId / templateId / fromTier / demotedId:
interface SpotlightPullEntryAdditions {
  /** Which candidate class stepped back; absent for a net-additive pull (demotedId null). */
  demotedReason?: 'no_strategic_want' | 'unwatched_builder';
  /** For an unwatched builder: ticks since their lastActive when they stepped back. */
  demotedUnwatchedTicks?: number;
}
```

The ledger (`SpotlightLedger`, `readSpotlightLedger`) gains `unwatchedDemotions: ReadonlyArray<{ agentId; tick; unwatchedTicks }>`. Its JSDoc (`src/debug-bridge.d.ts:1408-1416`) and the CLI `spotlight` printer (`scripts/cli.ts:305-311`) report it. That is the census's kill-criterion input.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A caller omits the follow-list option | That call fails **closed**: with the unwatched class on and the option omitted, no unwatched builder is offered. The existing class is unaffected. Every in-play call site passes it (a test pins the four, § 7) |
| `state.followedAgentIds` is absent on the state | Callers pass `state.followedAgentIds ?? []`, so an absent list is an empty one, not an omitted option. Only omitting the option fails closed |
| `movementState` is malformed | Treated as travelling (never demoted). A stuck mover is left alone rather than frozen |
| `lastWitnessedTick`, or every project tick, is missing | The floor applies (tick 0, or the pull tick) |
| A caller omits the projects option | That call fails **closed**: no unwatched builder is offered, as with the follow list. A test pins that the four in-play call sites pass it |
| `state.strategicState` is absent | Callers pass `[]`, so the undertaking term reads "no progress" (true: there are no projects), and the witness and pull terms still apply |
| The cap's scan finds a malformed ledger value | That node is ignored for the count (never demoted twice by accident) |

## Interface impact

| Contract | Change |
|---|---|
| `strategic-ambition-pulls-holder-into-spotlight` (`scripts/interface-contracts.ts:1081`) | **extend**: the intent gains the unwatched-builder class and its guards; `symbols` gains `spotlightUnwatchedDemotedTick`; the evidence line is refreshed from the post-landing census (pulls, unwatched demotions, refusals per mortal). Its asserting tests are the spotlight-pull suite, extended |

No contract is retired or rerouted.

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/trace.ts` | 135 importers (`.codesight/graph.md`, 2026-09-24) | two optional fields on one existing entry; no member changes shape; the typecheck ratchet covers it |

## Three-pillar check

- [x] Engine pillar present: the unwatched class, five guards, two corrections, the lever.
- [x] Content pillar: N/A with rationale (the mechanism carries no content; its one chronicle line is unchanged).
- [x] UI pillar: N/A with rationale (no component change; tier readers pick up the new membership). The Follow button's words are filed as THR-1573, blocked by this issue.
- [x] Wiring connects them.

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `00-north-star.md:15`, *"The player has a handful of mortals they know by name"*, and `:47`, *"The player who saw one mortal's full arc is having a better time than the player who touched fifty."* The arc the player is watching is safe by construction: any scene the player saw inside six days stamps the witness tick, and threads and follows protect outright. Only arcs nobody watched, and in which nothing advanced, can end off-screen. That includes a mortal the player kindled and then left: they get six days from the pull, and following them keeps them (§ 4b).
  - `01-core-loop.md:51`: *the choice of whose story to witness is the player's*. It still is.
- [x] **Tension named.** A familiar-but-unfollowed protagonist can leave the spotlight. That is the cost of a living cast, bounded to one per day, and the player keeps anyone by following them.

## Rulebook impact

- [x] **A rule of play changes, in one sentence** (`Docs/canon/rulebook.md:419`): *"…and one who has nothing to build steps back"* becomes *"…and one who has nothing to build, or has stopped building and gone unwatched for six days, steps back, even one you kindled; a mortal you follow or have threaded never does."* The `[IMPL]` note names the unwatched class and its guards.
- [x] **UL Spotlight tier** (`Docs/ubiquitous-language/Agents.md:37-47`) gets the matching clause. *Unwatched* is the game word, defined against the UL's existing *witnessed* (`:43`): a mortal is unwatched when they have not been witnessed **and** their undertakings have not progressed for the threshold. The two words are not synonyms: a builder whose work advances is not unwatched, even if no scene of theirs resolved.
- [x] Both are updated in the implementation PR.

> Brainstorm companion: `Docs/plans/2026-09-24-thr-1523-idle-builders-step-back-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Four named constants and a lever; the existing two unchanged |
| 2. Inspectability | PASS | Pull entries carry `demotedReason` and unwatched ticks; the ledger reports unwatched demotions; the CLI and debug bridge print them |
| 3. Determinism | PASS | No new random draws; a total order on candidates; the cap is a count |
| 4. Fail-soft | PASS | See the table: missing inputs fail closed (never demote) |
| 5. Narrative over mechanical perfection | PASS | The spotlight follows who is building; a watched mortal is never moved |
| 6. Additive over destructive | PASS | New candidate class behind a lever; one property added; nothing deleted; the want survives the demotion |
| 7. Performance budget | PASS | The population stays flat (a swap is one-in, one-out), so tick cost should stay within a few percent. Measured as a Done-when |

## Kill criteria

- **More than 30% of worldgen protagonists stepped back by tick 150** on seed 42 or 99: raise `SPOTLIGHT_UNWATCHED_BUILDER_TICKS` or lower the per-window cap, and re-measure. Constants first, never code.
- **Any followed or threaded mortal demoted, or any mortal whose undertaking progressed inside the threshold:** a filter bug. Fix it before tuning.
- **`census:undertakings` fails** on starts per mortal or variety: set the lever to false and bring the numbers back to THR-1523.
- **Tick cost more than +5% over `main`** at medium on either seed: the population is not flat. Find the leak (for example the dead counting) before tuning.

## Done when

- [ ] **Tests** (every unwatched fixture sets `followedAgentIds: []` explicitly, so "never offered" cannot pass by the omitted-option fail-closed path):
  - **The lever:**
    - with the lever off, on a fixture world with no retained dead, the candidate set equals today's, byte for byte;
    - with the lever on and off alike, a deceased pulled mortal does not count toward overflow and is never a candidate.
  - **The class:** an unwatched builder (not travelling, not followed, not threaded, no encounter and no undertaking progress past the threshold) is offered after every ambition-less candidate, and a fresher builder is not.
  - **Activity:** a builder whose undertaking progressed inside the threshold is never offered, including one whose project finished inside it.
  - **The floor:** a never-witnessed protagonist is not unwatched before `SPOTLIGHT_UNWATCHED_BUILDER_TICKS` from tick 0.
  - **Protection:** a travelling mortal is never offered, and neither is a followed one.
  - **Pulled mortals:** a pulled mortal can go unwatched and is never pulled again.
  - **Kindled mortals:** a mortal pulled by the Kindled Ambition card's `assign_ambition` is offered only after the threshold from their pull, and never while followed.
  - **The cap:** a second unwatched demotion inside the window falls through to overflow or refusal.
  - **One pull per batch:** a newborn with two strategic wants produces one pull call.
  - **The callers:** the four in-play call sites pass both options (the follow list and the projects), omitting either fails closed, and the three exemptions are named in the test (§ 7).
  - **Neither class:** a pulled mortal whose strategic ambition completed is offered by neither class until they hold a new strategic want.
- [ ] **CLI, seeds 42 and 99, medium, 150 ticks:**
  - report pulls (swapped by reason, net-additive) and refusals **per mortal**, before and after;
  - report unwatched demotions and their share of worldgen protagonists (the kill criterion);
  - `npm run census:undertakings` passes on both;
  - `npm run census:reachability -- --seeds 42,99,7` keeps merchant-expansion reachable on at least 2 of 3;
  - `npm run measure:tick-cost` at medium is within +5% of `main` on both seeds.
- [ ] Rulebook `:419` and UL Spotlight tier are updated; the interface contract is updated per § Interface impact.
- [ ] **Wiki pages** the blocking `check:wiki-freshness:blocking` gate owes, because their `sources` in `public/wiki-manifest.json` match files this slice edits:
  - `agents-reference` (`src/engine/agentLifecycle.ts`): the spotlight rule as the player now meets it;
  - `encounters-manual-reference` (`src/engine/encounter*.ts`, which matches `encounterAftermath.ts`): the change there only passes two options, so a `Wiki-freshness-exempt: <reason>` line in a commit body is the honest answer unless the page describes the pull.
  - `system-interface-map` (`Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`): regenerated by `npm run generate-interface-map` (part of `prebuild`); commit the regenerated `public/system-interface-map-reference.html`.
- [ ] **Every gate:** `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, 30-tick CLI smoke. `Browser-verify exempt: engine only`.
- [ ] The close keyword for this issue, alone on its own line, in the closing commit body and the PR body.

## Coordination block

**Suggested model:** opus. The guards interact, and the census is the evidence.

**Parallel-safe with:**
- the Physical Conflict slices (THR-1537..THR-1561): disjoint files.
- THR-1526, THR-1528, THR-1563, THR-1564, THR-1565 and THR-1566: disjoint files.
- THR-1525 (the desire score) has merged. Its mutex line assumed this fix would land in `src/engine/decisionBoard.ts`, and this plan does not touch that file.
- THR-1568 and THR-1569 (the item defects): disjoint files.

**Follows this one:** THR-1573 (the Follow button's words) is blocked by this issue and runs after it.

**Mutex with:**
- THR-1562 (ambition reach floors read raw capability): both change who holds strategic wants, and the census numbers each reports depend on the other. Run them in sequence. Whichever lands second re-measures its census against the first.
- any slice editing `src/engine/spotlightPull.ts`, `src/engine/agentLifecycle.ts`'s births block, or `src/engine/ambitionTick.ts`'s re-evaluation pull.

**Files to touch:**
- Edit:
  - `src/engine/spotlightPull.ts` (unwatched class, guards, cap, ledger key and `unwatchedDemotions`, corrections, trace fields)
  - `src/data/agent-behavior-constants.ts` (four constants)
  - `src/engine/agentLifecycle.ts` (one pull per newborn; pass the follow list)
  - `src/engine/ambitionTick.ts` (one pull per holder in re-evaluation; pass the follow list)
  - `src/engine/encounterAftermath.ts` (`assign_ambition`: pass the follow list)
  - `src/types/trace.ts` (two optional entry fields)
  - `src/debug-bridge.d.ts` (the `getSpotlightLedger` JSDoc)
  - `scripts/cli.ts` (the `spotlight` printer)
  - `scripts/undertaking-census.ts` (report unwatched demotions and refusals per mortal)
  - `scripts/interface-contracts.ts` + `Docs/canon/interface-map.md`
- Tests:
  - `src/engine/__tests__/spotlightPull.test.ts`
- Docs:
  - `Docs/canon/rulebook.md`
  - `Docs/ubiquitous-language/Agents.md`

## Notes for the executor

- **Do not raise `SPOTLIGHT_AMBITION_PULL_MAX` or the share.** Option D was rejected, and the early pulls carry seed 99's merchant-expansion evidence.
- **The floor and the undertaking term are what keep the cast from churning.** Test them first.
- **Protagonist demotions are the number to watch.** The census reports it, and the kill criterion reads it.
- **THR-1562 will change eligibility** (the reach floors start gating). Do not tune this plan's constants against numbers THR-1562 is about to move. If THR-1562 lands first, re-baseline before measuring.
- **Pulled mortals do not appear on the hex map** (only threaded ones do, `src/components/Game/GameView.tsx:754`), contrary to THR-1348's plan. That is out of scope here, and noted so nobody expects it.
- **Pass `state.followedAgentIds ?? []`**, never the raw optional field, at each of the four call sites.
- **The decision was presented to Christian in chat on 2026-09-24**, in game terms and including the kindled-mortal case, with a veto invited, and the presentation is recorded on THR-1523. A veto arrives in chat and becomes a plan revision.

## Intent-judge verdict

*Three passes, 2026-09-24.*

1. **Revise.**
   - The authority was mis-cited (the 2026-09-11 delegation does not cover this); it is now process.md rule 4.
   - The veto was routed to the ticket; it now goes to chat.
   - The Interface impact section and the Blast Radius count were missing.
   - Several anchors were wrong.

   All were applied by a rewrite.
2. **Revise.** Every required action is applied:
   - the Follow-button text is filed as THR-1573;
   - the lever gates the class only, and the deceased correction is ungated, with two pinning tests;
   - an absent follow list is not an omitted option;
   - all seven callers are listed;
   - the kindled-mortal case is decided (§ 4b);
   - the paths carry their directories;
   - the UL clause defines *unwatched* against *witnessed*.
3. **Allow.** Impact class Reversible, with one GAP and three recommendations, all applied before commit:
   - **The projects travel as a named pull option** (`state.strategicState?.projects ?? []`), and omitting it fails closed like the follow list.
   - **A pulled mortal with no active strategic want sits in neither class, on purpose** (§ 1).
   - **The `binding/` path** is corrected.
   - **The chat record** of the decision is posted on THR-1523 before the transition.
- **Added after the pass:** the wiki pages the blocking freshness gate owes (`agents-reference`, `encounters-manual-reference`, `system-interface-map`).

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-09-24.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 4 named constants (`SPOTLIGHT_UNWATCHED_*`) + a lever (`_ENABLED`); existing `SPOTLIGHT_AMBITION_PULL_MAX`/`_OVERFLOW_SHARE` explicitly left unchanged |
| 2. Inspectability | PASS | `SpotlightPullTrace` gains `demotedReason`/`demotedUnwatchedTicks`; ledger gains `unwatchedDemotions`; `debug-bridge.d.ts` JSDoc + CLI `spotlight` printer updated; § Wiring table maps module→phase→UI→GameState→trace→debug per checklist convention |
| 3. Determinism | PASS | "No PRNG added"; selection is a stated total order (unwatched-longest, then `importance`, then id); cap is a count, not a roll |
| 4. Fail-soft | PASS | Explicit Fail-soft table: omitted follow-list/projects options fail *closed* (never demote); malformed `movementState` → treated as travelling; malformed ledger value ignored by the cap scan |
| 5. Narrative over mechanical | PASS | Vision audit ties the mechanism to north-star quotes; rulebook `:419` sentence rewritten; UL Spotlight tier gets a matching *unwatched* clause distinguishing it from *witnessed* |
| 6. Additive over destructive | PASS-with-note | New class is lever-gated and nothing is deleted (want persists silently); but §5's two "corrections" (one-pull-per-batch, retained-dead exclusion) change existing behavior for **every** world unconditionally, not gated by the lever — justified in-doc as bugfixes ("a defect in any mode"), which is reasonable but is a behavior change outside the lever's stated scope |
| 7. Performance budget | PASS | Population held flat by design (one-in-one-out swap); Done-when requires `measure:tick-cost` within +5% of `main`; kill criterion also gates on tick cost |

**NFP AUDIT: PASS-with-notes (see row 6)**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All five subsections filled (Systems design, Graph nodes/edges, Tick phases, Resolution logic, PRNG callouts) with concrete file:line citations, guards, corrections, and a kill lever. |
| Content | N/A-with-rationale | One-line rationale: no template/prose/attachment/data-table changes; the pull's existing chronicle line is unchanged. |
| UI | N/A-with-rationale | No component changes; existing tier-readers (LocationView split, chronicle line, DebugPanel ledger) pick up new membership automatically — rationale given, plus a follow-on ticket (THR-1573) named for the one UI-facing gap (Follow tooltip copy). |

No missing required sections. All template-required sections present: Substrate inventory, Engine subsections, Content/UI N/A stubs with rationale, Wiring, Constants, Tracing, Fail-soft, Blast Radius, Three-pillar check, Vision audit, Rulebook impact, NFP table, Done when, Coordination block, Notes for executor.

Wiring section check: Present and connects each active module (`demotionCandidates`, the four call sites, `countOverflowPulls`) to orchestrator phase (`agent_lifecycle`/`ambition_progress`/aftermath), UI component (LocationView tier split), GameState field (node property), trace emitted (`spotlight_pull` entry additions), and debug visibility (`getSpotlightLedger`, CLI `spotlight`) — satisfies the wiring-checklist contract.

Substrate-existence check (THR-658): Plan opens with a `## Substrate inventory` section (present, not missing). It correctly identifies `spotlightPull.ts` — the file backing the curated "Attention, Chronicle & Narrative" ACTIVE subsystem in `Docs/canon/systems-inventory.md` (aliases include "attention") — and states disposition **extends** for every row (spotlight pull, ambition assignment, follow state, movement, witnessing, undertakings), each with precise function/line anchors. No green-field duplication: the plan explicitly builds on existing code rather than proposing a parallel system.

PILLAR AUDIT: PASS

### Vision audit

**Vision premises touched**

- `00-north-star.md` → "The player has a handful of mortals they know by name" / "the player who saw one mortal's full arc" (:15, :47) — [confirmed]. Plan's floor (never-witnessed protagonists are safe until the threshold) and Follow/thread protection directly defend this premise.
- `01-core-loop.md` → "the choice of whose story to witness is the player's" (:51) — [confirmed]. Spotlight membership shift only; scan→encounter→aftermath order untouched.
- `02-non-negotiables.md` → god/protagonist separation (§1) — not referenced; plan touches attention allocation, not intervention mechanics.
- `03-design-tensions.md` → Tension #5, scope: one perfect story vs. portfolio breadth (:55-64) — [extended]. Plan explicitly names the trade ("the cost of a living cast, bounded to one per day") rather than hiding it.
- `taste-profile.md` → not referenced. No UI, no prose, no numbers exposed; N/A pillars correctly flagged.

**Vision contradictions**

No contradictions found.

**Five qualitative checks**

- North star: yes — keeps the "handful of mortals" premise intact via the witness/undertaking floor and Follow/thread protection; a stepped-back builder's arc isn't erased, just off-stage.
- Core loop: yes — scan → encounter → aftermath rhythm is unaffected; this only changes who occupies the deciding tier between scans.
- Non-negotiables: yes — no change to intervention mechanics or god/mortal distance; sovereignty untouched.
- Design tensions: leans on Tension #5 (portfolio breadth) but names it and bounds it (one swap/day, floor, follow/thread immunity) rather than drifting unchecked.
- Taste profile: yes — no numbers surfaced to the player, no UI changes; engine-only.

**VISION AUDIT: PASS**

**Author's response to the notes:** NFP #6's note is deliberate. The two corrections are defects in any mode, so gating them behind the lever would keep a known bug available to switch back on. The lever gates the new rule, which is a design choice; the corrections are not. § 6 says so, and two tests pin the difference.
