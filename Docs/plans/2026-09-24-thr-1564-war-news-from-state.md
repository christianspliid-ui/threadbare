> **title:** War news from state — the war reaches the chronicle whether or not the debug panel is open — THR-1564
> **linear_issue:** THR-1564
> **author:** Claude Code
> **created:** 2026-09-24
> **three_pillars:** Engine `done` · Content `done — one authored line per war event, in the game's register, with no numbers` · UI `N/A — no component change; the lines reach the existing Chronicle panel`

# War news from state — THR-1564

*The player is told a war is happening only when the debug panel happens to be open. After this, the war reports itself.*

## Why this is load-bearing

`phaseArmyNotifications` (`src/engine/armyNotifications.ts:75-276`) turns the war into player lines by reading the trace buffer. Tracing is off unless the debug panel is open (`traceBuffer.ts:53`, `:100`; `useAvatarData.ts:112-120`), so in normal play it writes nothing. The design research (2026-09-24, seed 42, medium, 200 ticks) found the problem is wider than the trace gate:

- **Tracing off, five threads: zero war lines** (the ticket's defect, confirmed).
- **Tracing on, no threads: 31 war lines, and none reached the player.** The only surface a war line can reach is the Chronicle panel (`GameView.tsx:5130-5133`), which takes significance ≥ 0.8 (`phaseNarrative`, `orchestrator.ts:2526`). Lines about strangers are written at 0.2, and a town changing hands at 0.7 (`realm-content.ts:139`). Nothing player-facing renders the lower tiers: `NarrativeFeed` and `EventLog` are not mounted, and `recentEvents` is read only by the debug panel.
- **Three line kinds are dead even with tracing on:**
  - *Army raised:* `spawnArmy` runs in `faction_ambitions` and `notable_agendas`, after the notification phase (2.358). The next tick filters for its own tick number, so 13 raisings in the run produced 0 lines.
  - *Army disbanded:* the army node is removed before the visibility set is built.
  - *Siege breach:* its writer has no production caller.
- **Visibility is judged too late.** A battle's visibility is checked after the loser's army is disbanded inside the aftermath (`battleAftermath.ts:672-674`). So a threaded mortal's army that loses reads as unthreaded.
- **The lines are debug text.** Messages are raw trace summaries, e.g. *Battle "Siege of X" resolved: stalemate (final momentum: -5.4)*. That breaks UI Law 13 (no numbers) the moment one reaches the player.

**What the canon promises.** The rulebook says the war *"surfaces to you as tiered notifications"* (`rulebook.md:384`), that *"a war among strangers reaches you only as chronicle"* (`:382`), and that a seizure *"surfaces as a chronicle line"* (`:386`). None of the three is true today.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| War, Armies & Battles (`systems-inventory.md:37`): the army, battle, siege, attrition and aftermath writers | 🟢 ACTIVE | **extends:** each writer reports its event to one function, `reportWar`, at the site where it happens |
| War notifications (`armyNotifications.ts`, phase 2.358, `orchestrator.ts:3259-3264`) | 🟢 ACTIVE, but reads traces | **replaces its input:** the module becomes the home of `reportWar`, the visibility set and the line builders. The trace-reading phase is retired, and traces stay emitted for the debug surfaces |
| Tick events and the chronicle (`TickEvent`, `gameState.ts:79-172`; `state.tickEvents` reset each tick at `orchestrator.ts:2805`; promotion at ≥ 0.8 in `phaseNarrative`, `:2520-2562`) | 🟢 ACTIVE | **reuses:** writers push into `state.tickEvents` in place, the pattern `revelationEmitter.ts` and `phaseLocationTraits.ts:233-244` already use, with deterministic ids |
| Chronicle panel (`ChroniclePanel`, `GameView.tsx:5130-5133`) | 🟢 ACTIVE | **reuses**, unchanged |
| Realm projection (the map border and seat markers from `controls` edges) | 🟢 ACTIVE | **unchanged:** the map already moves without traces |

## Engine pillar

### Systems design

**1. One reporter, called where the war happens.** `reportWar(state, news)` in `src/engine/armyNotifications.ts`:
- `news` is a small discriminated union, `WarNews`, one kind per line (§ Content). Each carries the ids the line needs (factions, commanders, armies, the place) and the words it needs (names are read at the site, while the nodes still exist).
- **It decides visibility** at the site, with the existing `buildThreadedAgentSet` and `checkFactionThreaded`, before anything is removed. A line is *threaded* when any participant's commander is in the threaded set or any participant's faction is threaded.
- **It builds the line** from the prose table and **pushes one `TickEvent`** into `state.tickEvents`:
  - a deterministic id, `evt_war_${kind}_${subjectId}_${tick}`;
  - the existing war event types (`gameState.ts:103-105`), so no type union changes;
  - `refs` for the place and the factions (UI Law 2), and `hexCoords` when known.
- **Fail-soft:**
  - If `state.tickEvents` is missing, it returns without writing. Worldgen and test fixtures call `spawnArmy` with `{ graph, tick: 0 }` (`seedLivingWorld.ts:658`, `worldSeed.ts:1952`).
  - A missing name falls back to a generic word ("an army", "a town").
  - Every call is wrapped in try/catch, so a failed report never breaks the war it reports.

**2. Where it is called.** Every site has `state` in scope and runs before `phaseNarrative` promotes the tick's events, so a line reported at tick N reaches the chronicle at tick N.

| Event | Call site | Replaces the trace read of |
|---|---|---|
| An army is raised | `spawnArmy` (`armySpawning.ts:297-310`) | `army_raised` (dead by phase order today) |
| An army breaks apart | `disbandArmy` (`armyAttrition.ts:229-252`), before `removeNode` | `army_disbanded` (dead today) |
| An army is fraying | `phaseArmyAttrition` threshold crossing (`armyAttrition.ts:163-175`) | `attrition` with `thresholdCrossed` |
| Battle is joined | `createBattleNode` (`battleResolution.ts:244-256`) | `started` |
| A siege is laid | `createSiegeNode` (`siegeResolution.ts:282-293`) | `siege_established` |
| A battle or siege ends | `resolveBattle` (`battleResolution.ts:463-503`). Participants and the besieged town's holder are captured **before** `applyAftermath`; the report is made **after** it, so it knows whether the town changed hands | `resolved` |
| A town changes hands | `emitConquestTrace` / `applyConquestOrVacuum` (`battleAftermath.ts:285-420`) | `realm_territory_change` |

**3. One line per event, not two.**
- **A siege that takes a town.** The territory line tells it (*Realm A takes Town from Realm B*), and `resolveBattle` does not add a battle line. It compares the holder captured before the aftermath with the holder after it; if the holder changed, it skips its line.
- **An army destroyed in battle.** The aftermath disbands the loser (`battleAftermath.ts:672-674`), and the battle's ending line already tells it. `disbandArmy` gains an optional `reason: 'battle' | 'attrition' | 'other'` (default `'other'`), and reports only when the reason is not `'battle'`. The aftermath passes `'battle'`.

**4. The trace-reading phase is retired.**
- `phaseArmyNotifications` and its orchestrator call (`orchestrator.ts:128`, `:3259-3264`) are removed.
- Every trace at every site stays exactly as it is: traces are the debug layer.
- The CLI, which always traces, shows the same war through the new lines. It no longer prints the debug summaries as events.
- **Per-phase event counts shift.** With the phase gone, `phaseEventCounts['army_notifications']` (`orchestrator.ts:3263`) disappears, and lines pushed inside the war phases are counted under the next inline phase's event delta. That is debug-only attribution and is accepted; the `war.reported` trace is the precise count.

**5. The dead siege-breach line stays dead.** Its writer has no caller, and wiring the breach is not this ticket. The builder keeps the kind in the union with a comment, so the day a caller exists it reports through the same door.

### Graph nodes / edges

None. News is tick events, not world state.

### Tick phases

- One phase is removed: `army_notifications` (2.358).
- Reporting happens inside the existing phases that do the war: army movement and attrition (2.35x), battle detection and tick (2.356–2.357), faction ambitions, notable agendas.

### Resolution logic

Unchanged. Reporting reads the war; it never changes it.

### PRNG callouts

None. Line choice is by event kind and outcome, never by a draw.

## Content pillar

### Prose tables

- **Register:** GAME, narrator mode, one line each, **no numbers** (UI Law 13), names as chips through `refs` (Law 2).
- **The one authored choice** is the wording. The executor finalizes it against the voice scorer and keeps the facts.

| Kind | Line |
|---|---|
| Army raised | *{Faction} raises an army under {commander}.* |
| Army breaks apart | *{Faction}'s army under {commander} breaks apart.* |
| Army fraying (strained / breaking) | *{Faction}'s army under {commander} is starting to fray.* / *…is falling apart.* |
| Battle joined | *{Faction A} and {Faction B} meet in battle at {place}.* |
| Siege laid | *{Faction} lays siege to {town}.* |
| Field battle won | *{Victor} broke {loser} at {place}.* |
| Siege failed | *{Town} held against {attacker}.* |
| Siege won, town not taken | *{Attacker} broke into {town} but could not hold it.* |
| Stalemate | *{Faction A} and {Faction B} fought to a standstill at {place}.* |
| Mutual destruction | *{Faction A} and {Faction B} destroyed each other at {place}.* |
| Town changes hands | the existing lines: *{A} takes {Town} from {B}* / *{A} takes {Town}* / *{B} loses {Town}* |

**One wording for a battle's ending.** THR-1528 (blood-soaked ground, Ready for Dev) writes a `summary` sentence on its `battle_fought` record for the place's memory. Both describe the same battle, so they share one builder, `battleOutcomeSentence`.
- **If THR-1528 lands first,** this slice reuses its builder.
- **If this lands first,** THR-1528 reuses this one.

It is the executor's call which file holds it; there must be one.

### Encounter templates, attachment content, data tables

N/A. No templates, items or data rows change. The significance values below are constants, not content.

## UI pillar

UI: N/A. No component changes: the lines reach the existing Chronicle panel through the existing promotion.
- **What the player sees change:** the war appears in the chronicle during normal play.
- **Toasts** stay out of scope. No war line carries a `notification` directive today, and adding one is a separate decision about interrupting the player.
- **UI Laws engaged:** Law 13 (no numbers; a test pins it), Law 2 (names are chips through `refs`), Law 56 (every line reports something the engine wrote that tick).
- **Browser evidence:** exempt under THR-688 rule C, since no `src/components` file changes. The proof is headless: a run with tracing **off** counts the lines in `chronicleEntries`.

### How loud the war is (decided here, veto invited)

This is the ticket's one creative choice. It is decided under process.md rule 4 and presented to Christian in chat with a veto invited. The rulebook already states the intent: a war among strangers reaches you as chronicle, and a seizure is a chronicle line. The plan makes that true, and no louder.

| Line | Threaded (you have a thread in it) | Strangers |
|---|---|---|
| Army raised, battle joined, siege laid, army breaks apart | chronicle | not shown |
| **A battle or siege ends** | chronicle | **chronicle** |
| **A town changes hands** | chronicle | **chronicle** |
| Army fraying | not shown (event record only) | not shown |

**Volume.** Measured on seed 42, medium, 200 ticks: about 14 battle and siege endings and 1 town taken, so roughly one war line a day in the chronicle, plus the beginnings of wars you are threaded into. The research found no tick with more than 3 war events.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `reportWar` + line builders (`armyNotifications.ts`) | inside the war phases (2.35x), faction ambitions, notable agendas | ChroniclePanel (via `phaseNarrative`) | `state.tickEvents` → `chronicleEntries` | the existing war traces, unchanged; plus `war.reported` (below) | the debug panel's recent events; `getWarNews` on the debug bridge |
| the seven call sites (§ 2) | their existing phases | — | — | — | — |

**Player controls:** none.
**Prose:** the table above, built at the call site.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `WAR_NEWS_CHRONICLE_SIGNIFICANCE` | `0.85` | A line that reaches the chronicle (replaces `ARMY_NOTIFICATION_SIGNIFICANCE_THREADED`) |
| `WAR_NEWS_QUIET_SIGNIFICANCE` | `0.2` | A line recorded but not shown (replaces `_UNTHREADED`) |
| `WAR_NEWS_ATTRITION_SIGNIFICANCE` | `0.5` | Army fraying, recorded only (unchanged) |
| `WAR_NEWS_STRANGERS_ENDINGS_IN_CHRONICLE` | `true` | The lever: false puts strangers' battle endings back to quiet |
| `REALM_TERRITORY_EVENT_SIGNIFICANCE` | `0.85` (was `0.7`) | A town changing hands reaches the chronicle |

## Tracing

```ts
// war.reported — one per reportWar call, whether or not a line was written
interface WarReportedTrace extends TraceBase {
  category: 'war.reported';
  kind: WarNewsKind;
  threaded: boolean;
  eventId?: string;              // absent when nothing was written
  skipped?: 'no_tick_events' | 'territory_line_instead' | 'error';
  error?: string;
}
```

The trace is for the debug layer only. **Nothing player-facing reads a trace.** That is the lesson of this ticket, and a test pins it (§ Done when).

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `state.tickEvents` missing (worldgen, fixtures) | No line; traced `no_tick_events` |
| A name cannot be read | The generic word ("an army", "a town"); the line is still written |
| Building a line throws | Caught in `reportWar`, traced `error`; the war carries on |
| A faction or commander node is already gone | Visibility falls back to the ids captured before the aftermath; if none survive, the line is quiet |

## Interface impact

| Contract | Change |
|---|---|
| **add** `war-news-reaches-chronicle` | Writers: the seven call sites through `reportWar`. Reader: `phaseNarrative` → `chronicleEntries` → `ChroniclePanel`. Asserting tests: the tracing-off suite below |
| `trace-ring-to-incident-bundle` | **preserve:** traces stay off by default and stay the debug layer |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/trace.ts` | 135 importers (`.codesight/graph.md:15`, 2026-09-24) | one additive trace member (`war.reported`); no member changes shape; the typecheck ratchet shows zero net-new errors |

`src/types/gameState.ts` (624 importers) and the `TickEvent` type are read, not edited; the war event types already exist.

## Three-pillar check

- [x] Engine: the reporter, seven call sites, one-line-per-event, the retired phase.
- [x] Content: the line table, in register, with no numbers.
- [x] UI: N/A with rationale (the existing Chronicle panel).
- [x] Wiring connects them.

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `00-north-star.md:43`, *"a story the player can tell in prose"*: a war the player never heard of is a story they cannot tell.
  - `02-non-negotiables.md:23`, narrative over mechanical perfection: debug summaries become sentences.
  - The war stays *witnessed*, never commanded (rulebook `:372`). This plan adds reports, not controls.
- [x] **Design tension** `03-design-tensions.md:55-64` (one story vs portfolio breadth): strangers' wars reach the chronicle only at their endings and turnings, so breadth stays a background hum.

## Rulebook impact

- [x] **The rule becomes true.** Three sentences change in the implementation PR:
  - `:382`: "a war among strangers reaches you only as chronicle" gains *"when a battle ends or a town changes hands"*.
  - `:384`: "tiered notifications" becomes *"lines in your chronicle: the beginnings of wars you are threaded into, and the endings of every battle"*.
  - `:386`: the seizure's chronicle line keeps its sentence, and the `[IMPL]` note points at `reportWar`.
- [x] **UL correction** (`Prose.md`, *Narrative Event*): the entry says high significance makes alerts and low significance lands in the chronicle. The code does the opposite: the chronicle takes ≥ 0.8, and alerts need a `notification` directive. The implementation PR corrects the entry under delegated UL seating.

> Brainstorm companion: `Docs/plans/2026-09-24-thr-1564-war-news-from-state-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Five named constants, including a lever for strangers' endings |
| 2. Inspectability | PASS | `war.reported` trace per call; the existing war traces unchanged; `getWarNews` on the debug bridge |
| 3. Determinism | PASS | Deterministic ids; no draws; lines depend on event kind and outcome only |
| 4. Fail-soft | PASS | See the table; a failed report never breaks the war |
| 5. Narrative over mechanical perfection | PASS | Debug summaries with momentum numbers become sentences |
| 6. Additive over destructive | PASS-with-note | One phase is retired, deliberately: it read a buffer that is off in play, and keeping it would double the lines whenever tracing is on |
| 7. Performance budget | PASS | About 0.15 reports per tick; one threaded-set build per report |

## Kill criteria

- **Too loud.** If strangers' battle endings exceed three a day on a large map, or the chronicle becomes mostly war, set the lever off and report the count.
- **A line with a number.** Any war line containing a digit fails the Law 13 test. Fix the line, never the test.
- **Tracing on and off disagree.** If the two runs produce different war lines, a report depends on a trace. That is a defect in the slice.

## Done when

- [ ] **Tests:**
  - **With tracing disabled**, each kind (a raising, a battle joined, a siege laid, each ending, a disbanding, a town taken) writes its `TickEvent` in the same tick, with the significance from the loudness table.
  - **Visibility is judged before the aftermath:** a threaded mortal's army that loses still produces a threaded line.
  - **One line per event:** a siege that takes a town produces the territory line and no battle line.
  - **No numbers:** no war line contains a digit (Law 13), across every kind and outcome.
  - **Fail-soft:** `spawnArmy` with a `{ graph, tick: 0 }` state writes nothing and does not throw.
  - **Tracing on equals tracing off:** the same seeded run produces identical war lines.
  - The repointed reader tests (`armyVisibility.test.ts:305-480`, `battleAftermath.conquest.test.ts:252-296`) drive the real writers, not hand-fed traces.
- [ ] **Headless run:** seed 42, medium, 150 ticks, with tracing **off**. Count war lines in `chronicleEntries`, check them against the kill criteria and report the count per kind.
- [ ] **Docs:**
  - the rulebook at `:382`, `:384` and `:386`;
  - the UL *Narrative Event* correction;
  - the interface-map row;
  - wiki pages the blocking gate owes:
    - `armies-battles-reference` (`sources` include every war file this edits);
    - `tick-cycle-reference` and `turn-structure-reference` (both sourced from `src/engine/orchestrator.ts`); drop the 2.358 *Army Notifications* row at `public/tick-cycle-reference.html:656`;
    - `system-interface-map`, regenerated by `prebuild` and committed.
- [ ] **THR-1528's chronicle line:**
  - If THR-1528 has landed, set its rule's `chronicleSignificance` back to `LOCATION_TRAIT_EVENT_SIGNIFICANCE` (0.4) in this PR. Battle endings now reach the chronicle themselves.
  - If it has not, leave a comment on THR-1528 telling its executor to ship 0.4 directly.
- [ ] **Every gate:** `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke. `Browser-verify exempt: no src/components change; the lines reach the existing Chronicle panel, proved headlessly`.
- [ ] The close keyword for this issue, alone on its own line, in the closing commit body and the PR body.

## Coordination block

**Suggested model:** opus. Seven call sites across the war files, and a visibility rule that must be judged before the aftermath deletes the loser.

**Parallel-safe with:**
- THR-1523, THR-1526, THR-1562, THR-1568 and THR-1569: no shared files.

**Mutex with:**
- **THR-1528:** both edit `src/engine/battleResolution.ts` (`resolveBattle`), and they share the battle-ending sentence. Run them in sequence, whichever is first.
- **THR-1566:** both edit `src/engine/battleAftermath.ts`. Either order works.
- Any slice editing `src/engine/armySpawning.ts`, `armyAttrition.ts`, `siegeResolution.ts` or `armyNotifications.ts`.

**Files to touch:**
- Edit:
  - `src/engine/armyNotifications.ts` (`reportWar`, the line builders; retire the phase)
  - `src/engine/orchestrator.ts` (remove the phase call)
  - `src/engine/armySpawning.ts`, `src/engine/armyAttrition.ts`, `src/engine/battleResolution.ts`, `src/engine/siegeResolution.ts`, `src/engine/battleAftermath.ts` (the call sites)
  - `src/data/realm-content.ts` (the territory significance)
  - `src/types/trace.ts` (`war.reported`)
  - `src/debug-bridge.ts`/`.d.ts` (`getWarNews`)
- Tests:
  - `src/engine/__tests__/armyVisibility.test.ts`
  - `src/engine/__tests__/battleAftermath.conquest.test.ts`
  - a new `src/engine/__tests__/warNews.test.ts` (the tracing-off suite)
- Docs:
  - `Docs/canon/rulebook.md`
  - `Docs/ubiquitous-language/Prose.md`
  - `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts`
  - `Docs/plans/wiring-checklist.md` (a war-news row)

## Notes for the executor

- **Capture before the aftermath.** `applyAftermath` disbands the loser and, on a conquest, moves the town. Read participants, commanders and the town's holder first.
- **Push in place.** The war phases mutate state; push into `state.tickEvents`. Never return a partial state from a call site.
- **Never read a trace for a player line.** If you find yourself calling `getTraces`, stop.
- **Siege breach has no caller.** Leave it dead, with its kind in the union.

## Intent-judge verdict

*One pass, 2026-09-24.* **Allow**, impact class Reversible.
- **The GAP:** the plan owed two more wiki pages, `tick-cycle-reference` and `turn-structure-reference`, both sourced from `orchestrator.ts`. They are added to the Done-when.
- **Advisories applied:**
  - the wiring-checklist row;
  - a note that per-phase event counts shift once the phase goes;
  - the proposal now names the third deviation from the ticket (two significance tiers raised, with a lever).
- **The loudness decision:** the judge confirmed it is volume calibration toward an outcome the rulebook already states. So it is decided under rule 4 with a veto, and toasts stay out as the one genuine meaning-fork.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-09-24.*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | Five named constants table (`WAR_NEWS_CHRONICLE_SIGNIFICANCE`, `WAR_NEWS_QUIET_SIGNIFICANCE`, `WAR_NEWS_ATTRITION_SIGNIFICANCE`, `WAR_NEWS_STRANGERS_ENDINGS_IN_CHRONICLE`, `REALM_TERRITORY_EVENT_SIGNIFICANCE`); loudness lever explicitly named as a kill-criteria escape hatch. |
| 2. Inspectability | PASS | New `war.reported` trace per call site (kind, threaded, eventId/skipped/error); existing war traces preserved unchanged; `getWarNews` added to debug bridge; wiring table filled against `wiring-checklist.md` columns. |
| 3. Determinism | PASS | Deterministic event ids (`evt_war_${kind}_${subjectId}_${tick}`); explicitly "no draws — line choice is by event kind and outcome only"; Done-when requires tracing-on/off runs to produce identical lines. |
| 4. Fail-soft | PASS | Dedicated fail-soft table covers missing `state.tickEvents`, missing name, throw-in-builder (caught, traced `error`), and stale node refs; every call wrapped in try/catch per the plan text. |
| 5. Narrative over mechanical perfection | PASS | Directly replaces raw trace summaries with numbers ("stalemate, final momentum: -5.4") with authored no-number lines; Law 13 pinned by a dedicated test. |
| 6. Additive over destructive | PASS-with-note | One phase (`phaseArmyNotifications`, 2.358) is deliberately removed rather than left dormant — plan's own table flags this as the exception, justified because leaving it would double-emit lines whenever tracing is on. This is a real destructive change, but it is disclosed and reasoned, not silent. |
| 7. Performance budget | PASS | Estimated ~0.15 reports/tick from measured data (seed 42, medium, 200 ticks), one threaded-set build per report — reasoned from measurement rather than premature optimization. |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | Systems design, graph nodes/edges (N/A, justified), tick phases, resolution logic, PRNG callouts (N/A, justified) all filled with specific call sites and a call-site table. |
| Content | present-and-substantive | Prose table with register/law compliance is thorough; the other three template subsections are collapsed into one merged N/A line rather than kept separate — a structural deviation from `_template.md`, not a content gap (all three are legitimately inapplicable here). |
| UI | N/A-with-rationale | UI: N/A stated with reason (existing ChroniclePanel reused, no component edits). Includes Browser-verify exemption rationale. |

No missing required sections. Content pillar's three N/A subsections are merged rather than itemized — a minor template-conformance note, not a missing section.

**Wiring connectivity:** Yes — the Wiring table ties the Engine pillar's `reportWar` + seven call sites to their orchestrator phases, the reused `ChroniclePanel` via `phaseNarrative`, `state.tickEvents`/`chronicleEntries`, the existing plus new `war.reported` trace, and debug-panel/`getWarNews` visibility.

**Substrate-existence check (THR-658):** `## Substrate inventory` is present and cross-checks cleanly against `systems-inventory.md`: War, Armies & Battles (ACTIVE) — extends; War notifications — replaces its input; Attention, Chronicle & Narrative (ACTIVE) — reuses. No green-field duplication.

PILLAR AUDIT: PASS-with-notes

### Vision audit

**Vision premises touched:**
- `00-north-star.md` → *"a story the player can tell in prose"* (line 43) — confirmed.
- `01-core-loop.md` → scan → encounter → aftermath — silent. Chronicle news is ambient background texture, not a framed encounter.
- `02-non-negotiables.md` → god/protagonist separation (#1) — confirmed. The feature adds reporting only.
- `03-design-tensions.md` → tension #5, one story vs. portfolio breadth (lines 55–64) — confirmed, explicitly engaged.
- `taste-profile.md` → "Numbers in UI" anti-pattern, "Narrative over mechanical perfection" — confirmed.

**Vision contradictions:** No contradictions found.

**Five qualitative checks:** North star PASS; core loop PASS; non-negotiables PASS; design tensions PASS; taste profile PASS.

**VISION AUDIT: PASS**

**Author's response to the notes:**
- **NFP #6:** the removal is the design. A phase that reads a buffer that is off in play either does nothing or doubles the lines.
- **The pillar note:** the three inapplicable Content subsections are merged into one N/A line. Their rationale is the same for all three.
