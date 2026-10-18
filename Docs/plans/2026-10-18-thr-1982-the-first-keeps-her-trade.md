> **title:** `The First keeps her trade — THR-1982`
> **linear_issue:** THR-1982
> **author:** `Claude Code` (design lane, run 2026-10-18c, unattended)
> **created:** 2026-10-18
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The First keeps her trade — THR-1982

*The meeting shows the player a healer and then forgets it; this plan makes the meeting write the trade the player read, lets the chapter engine weigh it, and keeps the five chapters built around a fixed job for mortals whose trade fits.*

## Why this is load-bearing

Cold playtest round 4 (2026-10-18, deployed `07a83918`): 2 of 3 testers said the game forgot who their First was. *"Elara changed identity between events: herb-healer, then a smithing guild applicant working iron, then a forty-year archivist."* The same testers named the bonding scenes as the best part of the game (3/3 again). The meeting is where the player chooses a person; the chapters are where that person is supposed to become theirs. When the next chapter recasts her, the promise breaks at the exact point the game is strongest. Complaint class PC-6 (one fact told two ways), recurring in round 4.

The cause is measured, not guessed (§ Substrate). The meeting shows an epithet that names a trade (`"healer who feels too much, cracked hands, kind eyes"`), saves none of it, and gives The First no `npcRole`. Every system that knows what a mortal does for a living reads `npcRole`. So for the chapter engine, her Means, and her spell tradition, The First has no trade at all, and five regional chapters whose premise *is* a job (an archivist, a prophet, a magistrate, a mason-lord, a merchant-prince) run on whoever has the right Reach.

**Decided by the design lane under delegation (process.md rule 4), invited for veto in the run report:**

1. **The meeting writes a trade.** Each of the 24 candidate vignettes carries an authored trade: a `role` (from the existing 56-role vocabulary) and the plain word the player sees (`"Healer"`). Choosing the candidate writes both onto The First. The role is authored per vignette, never worked out from her Reaches: the reach grid gives the veil/heart empath *bard*, which is exactly the recast this fixes.
2. **The trade weighs, it does not wall.** The existing role-affinity multiplier (`computeRoleAffinityMultiplier`, ×1.4 for the role's primary Reach, ×1.15 for its secondary) starts working for The First the moment she has a role. Nothing is filtered by it; every chapter she could draw before, she can still draw.
3. **Five chapters keep their job.** The five regional chapters that cast their protagonist as a fixed job gain an optional `protagonistRoles` list. A mortal whose role is outside the list does not draw that chapter; a mortal with **no** role passes (fail-open), so no worldgen mortal loses anything it has today. Each list names at least one role a First can start with, so every one of the five stays reachable by some First.
4. **The sheet names the trade once.** The person sheet's identity block gains one line, the trade word (`Healer`), with a tooltip. The calling line ("Called Mender") stays as it is: the calling is what the world calls her *now* and is allowed to change with her life (UL `Calling`); the trade is what she was when the god found her.

## Substrate inventory

Measured on `origin/main` @ `80b719a9` (2026-10-18). Every claim below quotes file:line.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Meet The First (`meetingEncounter.ts`, `candidate-vignettes.ts`) and the dev seed (`gameInit.ts` `devSeedTheFirst`) | 🟢 ACTIVE | **extends.** `CandidateVignette` (`candidate-vignettes.ts:5-41`) gains `trade`; `NarrativeCandidate` (`types/meetingEncounter.ts:225-262`, built in `generateNarrativeCandidates`, `meetingEncounter.ts:1238-1255`) and `MeetingEncounterResult` (`:528-573`) carry it; `createAgentFromMeeting` (`meetingEncounter.ts:961-1096`) and `devSeedTheFirst` (`gameInit.ts:740-787`) write it. Today the result type has no `epithet`/`vignetteText` field and the two builders (`:1392-1409`, `:1614-1630`) drop both. |
| NPC roles (`types/npc.ts`, `NpcRole`, `NPC_ROLE_REACH_MAP`) | 🟢 ACTIVE | **reused, unchanged.** 56 roles (`npc.ts:34-92`). Writers today: `binding/applyBinding.ts:46`, `binding/creationEffects.ts:232`, `binding/mintInhabitant.ts:311`, `npcSeeding.ts:252`, `encounterSupportBundle.ts:244,301`, `debugWorldSpawnTools.ts:531`. The meeting becomes the eighth writer. |
| Encounter scoring, role affinity (`encounterScoring.ts:1165-1182`, called `:1476`) | 🟢 ACTIVE | **activates for The First.** `if (!role) return 1.0;` is the line that makes it a no-op for her today. Constants `ROLE_PRIMARY_AFFINITY_BONUS = 0.4`, `ROLE_SECONDARY_AFFINITY_BONUS = 0.15` (`agent-behavior-constants.ts:1094,1099`). No code change. |
| Encounter filter pipeline (`encounterFilterPipeline.ts:1104-1163`) | 🟢 ACTIVE | **extends** with one stage, `protagonist_role_fit`. Chapters for The First go `runFilterPipeline` (`phaseAgentDecision.ts:992`) → retirement/cooldown (`:1012-1029`) → `scoreAndSelect` (`:1066`). Encounter seeding bypasses the pipeline by design (`encounterFilterPipeline.ts:633-634`); see § Fail-soft. |
| Mortal Means (`mortalMeans.ts`, `giveBirthMeans`) | 🟢 ACTIVE | **activates for The First.** `giveBirthMeans` is called from the meeting at `meetingEncounter.ts:1093` and reads `npcRole` (`mortalMeans.ts:107`) for `ROLE_WEALTH` (`npcGraduation.ts:91-121`). Writing the role before that call gives a healer First a healer's Means (30) instead of `DEFAULT_WEALTH` (20). |
| Caster identity (`casterIdentity.ts:56-62`, `casterRoleOf`) | 🟢 ACTIVE | **activates for The First**, read side only. `casterTradition.ts:54` reads the role when it picks a tradition. Starting spells are seeded at world creation (`seedAttachments.ts:341`), before The First exists, so **no spell is granted by this plan**; a healer First's later spell learning follows a healer's tradition. |
| Prose enrichment (`proseEnrichment.ts`, tokens `:818-951`) | 🟢 ACTIVE | **extends** with `{trade}` and `{?has_trade}…{/has_trade}`. No occupation token exists today (`{occupation}`, `{role}`, `{trade}` not found in the resolver; `{role}` exists only in `scry.ts:299-300`). |
| The calling (`calling.ts`, `calling-content.ts`) | 🟢 ACTIVE | **untouched.** Derived from reaches, ambition and temperament (UL `Calling`). No encounter gate reads it (readers `agentDetail.ts:1966`, `debug-bridge.ts:477`). |
| Person sheet identity block (`OverviewTab.tsx:387-403`) | 🟢 ACTIVE | **extends** with one trade line between the archetype label and "Called …". |
| Binder cast reuse (`binding/binder.ts:146-212,239,396`, `reuseNpcRoles`) | 🟢 ACTIVE | **extends — The First joins the census.** Measured by the intent judge: `enumerateCandidates` (`binder.ts:146-212`) has no threaded-mortal or `courtPosition` exclusion. A role changes her binder eligibility both ways: she enters census reach for slots accepting her role (`roleCensus.ts:47`, `binder.ts:189-208`), and she is excluded from slots that don't (`computeCastRoleFit` → `-1`, `binder.ts:394`). Today, roleless, she is mid-band for any slot (`:234-236`). That is the trade being true in the world; no `the_first` exclusion is added (see Notes). |
| Role display on other surfaces (`LocationView.tsx:1746`, `HexChronicle.tsx:970-1064`) | 🟢 ACTIVE | **extends.** Both print raw `npcRole` today; both switch to `displayTradeWord`. |

**Runtime population.** The First is one node per run. The roles readers above fire on her from the bond onward. The five gated chapters are the only templates in `src/data` whose prose opens "A threaded <job>" or whose `targetLabel` is a literal job (`grep "A threaded " src/data/encounters` → 5 files; `targetLabel: 'The <job>'` → the same 5, 2 each); 37 files in `src/data` mention `story_beat`.

## Engine pillar

### Systems design

**1. The trade travels from vignette to node.** `CandidateVignette` gains:

```ts
/** What this person did before the god found them (THR-1982). `role` feeds every
 *  system that reads npcRole; `word` is what the player reads on the sheet. */
trade: { role: NpcRole; word: string };
```

`NarrativeCandidate` and `MeetingEncounterResult` gain `trade?: { role: NpcRole; word: string }` and `vignetteId?: string` (optional: a save or fixture built before this ships has neither). `generateNarrativeCandidates` copies both from the vignette beside `epithet: vignette.epithet` (`meetingEncounter.ts:1247`); both result builders (`:1392-1409`, `:1614-1630`) copy them from the chosen candidate. `createAgentFromMeeting` (`:961-1096`) writes `properties.npcRole = trade.role` and `properties.tradeWord = trade.word` **before** its `giveBirthMeans` call (`:1093`), and emits `first.trade.written`. The epithet the player read stays where it is (meeting screens only); this plan carries the trade, not the whole epithet.

**The dev seed agrees.** The First has a second writer, `devSeedTheFirst` (`gameInit.ts:740-787`, Kael Thornweaver, heart/shadow, `true_believer`), which backs `?seeded`, the primary dev view; main already keeps the two writers in step (`gameInit.ts:813-815`). It writes `npcRole: 'priest'`, `tradeWord: 'Shrine-keeper'` before its own `giveBirthMeans` (`:982`). Priest is chosen because it sits in two of the five gate lists, so the seeded world can exercise both sides of the gate.

**Every surface that prints a role reads the trade word first.** Two player surfaces already print raw `npcRole`: the location's people list (`LocationView.tsx:1746`, `npcRole.replace(/_/g, ' ')`) and the chronicle's soul cards (`HexChronicle.tsx:970-1064`, `role={npcRole}`). Both switch to one helper, `displayTradeWord(node)` in `agentDetail.ts`: `tradeWord ?? NPC_ROLE_WORD[npcRole] ?? null`. Without this, a Saboteur First would read "burglar" in the location list and "Saboteur" on her sheet.

**2. Role affinity starts working.** No code. With `npcRole` set, `computeRoleAffinityMultiplier` returns 1.4 / 1.15 / 1.0 for her as it does for every roled mortal. A multiplier ≥ 1 on some chapters and 1.0 on the rest is the floor the ticket asked for: nothing she could draw is removed.

**3. One new filter stage: `protagonist_role_fit`.** `UnifiedActionTemplate` gains an optional field:

```ts
/** THR-1982 — the protagonist roles this template's premise casts. When set, an actor
 *  whose npcRole is outside the list does not draw it; an actor with no npcRole passes. */
protagonistRoles?: NpcRole[];
```

The stage runs in `runFilterPipeline` as **Stage 3c**, directly after story breath (`encounterFilterPipeline.ts:1142-1151`), wrapped in the same `try { … } catch { /* keep previous stage's output */ }` as its neighbours. It is an eligibility gate, so it is counted inside the prerequisites funnel bucket exactly as story breath is ("the funnel's gate set is fixed", `:1142-1143`): `afterStoryBreath` moves below it, and no new funnel bucket is added. Rule: `!template.protagonistRoles?.length || !actorRole || template.protagonistRoles.includes(actorRole)`. Each rejection is traced (`encounter.filter.role_fit`). Master switch `PROTAGONIST_ROLE_FIT_ENABLED`; off, the stage passes everything.

**4. Prose token.** `proseEnrichment.ts` resolves `{trade}` to the actor's `tradeWord`, lower-cased (`healer`), falling back to `NPC_ROLE_WORD[npcRole]` (the role with `_` as space, the formatting `LocationView.tsx:1746` already uses), and to `person` when neither exists. `{?has_trade}…{/has_trade}` renders only when a trade exists. No content uses the token in this plan; it is the seam future chapters use to name her work instead of inventing one (Law 42).

### Graph nodes / edges

None new. `npcRole` and `tradeWord` are node properties on The First's actor node. `npcRole` is already a property on every roled mortal; a trade is a label, not a relationship (no traversal wants it), so the edge rule is not engaged.

### Tick phases

None new. The write happens once, at the bond (UI-driven `meetingBond.ts:38` → `createAgentFromMeeting`). The filter stage runs inside the existing decision phase (`phaseAgentDecision.ts:992`).

### Resolution logic

Untouched. Forecasts, odds and bands do not read the trade (Law 20: weighing what a mortal chooses never touches the odds). Role affinity multiplies the board score, never the forecast.

### PRNG callouts

None. The trade is a table lookup from the chosen vignette; the filter is a list membership test. No `Math.random()`, no new stream.

## Content pillar

### Data tables

**`src/data/candidate-vignettes.ts` — one `trade` per vignette.** The role is the one the epithet names; where the epithet names no trade, the closest trade the vignette's prose supports. The word is what the player reads.

| Vignette | Epithet (as authored) | `role` | `word` |
|---|---|---|---|
| `iron.sentinel` | wall-watcher, scarred hands | `guard` | Wall-watcher |
| `iron.champion` | pit fighter, loyal to a fault | `mercenary` | Pit fighter |
| `iron.tactician` | young officer, cold eyes | `commander` | Officer |
| `gold.merchant` | merchant's daughter, ink-stained fingers | `merchant` | Merchant |
| `gold.patron` | aging benefactor | `noble` | Benefactor |
| `gold.smuggler` | river rat, quick hands | `trader` | Smuggler |
| `shadow.infiltrator` | a face for every room | `spy` | Spy |
| `shadow.saboteur` | quiet hands, a grudge that burns cold | `burglar` | Saboteur |
| `shadow.manipulator` | the one who listens | `broker` | Go-between |
| `veil.diviner` | touched since birth | `hermit` | Diviner |
| `veil.runecaster` | ink under her nails, speaks to the rock | `scribe` | Rune-carver |
| `veil.empath` | healer who feels too much | `healer` | Healer |
| `heart.demagogue` | speaks fire, the crowd hangs on every word | `herald` | Street orator |
| `heart.counselor` | the one they come to after midnight | `sage` | Counsellor |
| `heart.martyr` | the one who stays | `priest` | Shrine-keeper |
| `eye.cartographer` | map-maker, restless feet | `scout` | Mapmaker |
| `eye.oracle` | sees too far, speaks in riddles | `oracle` | Oracle |
| `eye.scout` | light-footed, sharp-eyed | `scout` | Scout |
| `stone.mason` | builds to outlast himself | `mason` | Mason |
| `stone.elder` | village anchor | `elder` | Village elder |
| `stone.geomancer` | knows where the water runs | `wanderer` | Dowser |
| `star.templar` | faith made flesh, armored | `paladin` | Templar |
| `star.seer` | reads the stars | `oracle` | Star-reader |
| `star.apostle` | wandering preacher | `pilgrim` | Wandering preacher |

A completeness test asserts every vignette has a `trade`, every `role` is in `NPC_ROLES`, and every `word` is ≤ 3 words.

**`NPC_ROLE_WORD`** (new, `src/data/npc-role-words.ts`): the fallback word for each of the 56 roles (`faction_rep` → `envoy`, `guard_captain` → `captain`, `warrior_priest` → `warrior-priest`, others the role with `_` as space). Completeness test over `NPC_ROLES`.

### Encounter templates

The five regional chapters whose premise is a job gain `protagonistRoles`. Each list includes at least one role a First can start with (the **bold** role), so each stays reachable by some First.

| Template | Premise job | `protagonistRoles` | First who can draw it |
|---|---|---|---|
| `the-page-beneath-the-saint.ts` | archivist (`:475`, "forty years" `:135`, `:508`) | **`scribe`**, `librarian`, `scholar`, `researcher`, `sage`, `clerk`, `acolyte`, `priest` | Rune-carver, Counsellor, Shrine-keeper |
| `the-comet-at-the-turning.ts` | prophet | **`oracle`**, `priest`, `acolyte`, **`pilgrim`**, `hermit`, `herald`, `chaplain`, `warrior_priest` | Oracle, Star-reader, Wandering preacher, Diviner, Shrine-keeper, Street orator |
| `the-verdict-that-burns.ts` | magistrate | `noble`, **`elder`**, `steward`, `sage`, `commander`, `guard_captain`, `marshal`, `faction_rep` | Village elder, Benefactor, Counsellor, Officer |
| `the-wall-of-the-mason-lord.ts` | mason-lord | **`mason`**, `smith`, `noble`, `steward`, `quartermaster`, `commander` | Mason, Benefactor, Officer |
| `the-granaries-in-the-famine-year.ts` | merchant-prince | **`merchant`**, `trader`, `broker`, `noble`, `quartermaster`, `appraiser` | Merchant, Smuggler, Go-between, Benefactor |

Their prose is **not** rewritten: inside the gate, "the archivist" is now true of the mortal it runs on. A content test asserts that any template whose `initiation` prose opens "A threaded " or whose `authoredChoices` carry a literal `targetLabel: 'The <word>'` (not `{name}` / `{cast:…}`) declares `protagonistRoles`, so a sixth such chapter cannot ship without one.

### Prose tables

No new prose beyond the trade words above and the tooltip in § Player-facing text. `{trade}` ships unused by content.

### Attachment content

N/A — no attachments touched.

## UI pillar

*Screenshot tool: Playwright (DOM — the person sheet's identity block; no WebGL in scope).*

### Player-facing display

- **Person sheet, identity block** (`OverviewTab.tsx`, between the archetype label `:387-395` and the calling `:397-403`): one line, the trade word, shown when `tradeWord` exists and the knowledge level is `recognised` or above (the same gate as the archetype and calling lines). Built through `agentDetail.ts`'s card read model (`card.tradeWord`), never read off raw properties in the component.
- UI Laws engaged: **1** (words, not numbers), **13/14** (no numerals, banded words only — there are none here), **17** (the tooltip explains the term where it is met), **21** (nothing new to click; the line is text with a tooltip, like its neighbours), **33** (one fact, one place: the trade appears once on the sheet), **37** (identity chrome order kept: name, archetype, trade, calling, mark). Law 56 is not engaged: the line is a state read, not a consequence chip.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Person sheet, identity block | "Healer" (rendered for an empath First; the word comes from the vignette table) | PC-6 | Tooltip `ui.trade`, authored `"The work {name} did before your thread. The world still knows {name} by it."` and rendered "The work Elara did before your thread. The world still knows Elara by it." The copy names the mortal rather than guessing a pronoun, as the registry's convention says (`ui-content.ts:833-835`). The word matches the meeting's epithet, which named "healer", word for word. |
| Location people list (`LocationView.tsx:1746`) | "Elara · Healer" — the role column renders `displayTradeWord` ("Healer"; a Saboteur First reads "Saboteur", not "burglar") | PC-6 | Same word as the sheet. |
| Chronicle soul card (`HexChronicle.tsx:970-1064`, `SoulCard role=`) | "Healer" | PC-6 | Same word as the sheet. |
| Chapter choice (no new text) | The five gated chapters simply stop appearing for a First whose trade does not fit. | PC-6 | Nothing to read: the recast no longer happens. |

PC-6 check — every other surface that already shows this fact: the meeting's epithet (`SensingBeat.tsx:206-218`, `BondBeat.tsx:355`) names the trade in its own words ("healer who feels too much"); the sheet's word is the trade alone ("Healer"). Every surface that prints a mortal's role reads the trade word first, so the sheet, the location list and the chronicle agree word for word. For mortals without a `tradeWord` (everyone but The First), `NPC_ROLE_WORD` gives the same words those two surfaces print today, apart from the three cleaned-up role words (`faction_rep` → envoy, `guard_captain` → captain, `warrior_priest` → warrior-priest). The calling ("Called Mender") is a different fact (what the world calls her now) and keeps its own tooltip `ui.calling`; the two can differ when her life changes, and that difference is the calling's job to narrate (`calling_changed`).

### Playtest signal

A round-5 tester who reads their First's sheet can say what she did before the god found her, in the meeting's word; and no round-5 tester reports a story chapter recasting their First's occupation. (Ordinary guild and trade scenes that assume a trade in their prose are the follow-up ticket's ground, § Done when.)

### Event notifications

None. The trade is written once, at the bond, inside the meeting's existing flow.

### Debug inspection (DebugPanel)

`window.__DEBUG.getFirstTrade()` → `Promise<{ role: NpcRole; word: string } | null>`, declared in `src/debug-bridge.d.ts`. The filter stage's rejections are read from the `encounter.filter.role_fit` traces (`await window.__DEBUG.getTraces()` with tracing enabled); in the funnel they count inside the prerequisites bucket, as story breath does.

### Visual presence (HexMapV2)

N/A — no map signifier; a trade is not a place-level fact.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `candidate-vignettes.ts` `trade` → `createAgentFromMeeting` | bond (UI-driven, `meetingBond.ts:38`) | MeetTheFirst flow (unchanged) | First node `npcRole`, `tradeWord` | `first.trade.written` | `__DEBUG.getFirstTrade()` |
| `encounterFilterPipeline.ts` `protagonist_role_fit` | decision phase (`phaseAgentDecision.ts:992`) | none | none | `encounter.filter.role_fit` | traces; prerequisites funnel bucket |
| `proseEnrichment.ts` `{trade}` | prose render | any prose surface | reads `tradeWord` / `npcRole` | none (pure render) | none |
| `agentDetail.ts` `card.tradeWord`, `displayTradeWord` | read model | `OverviewTab.tsx` identity block, `LocationView.tsx` people list, `HexChronicle.tsx` soul card | reads `tradeWord` / `npcRole` | none | Playwright DOM `data-testid="identity-trade"` |
| `gameInit.ts` `devSeedTheFirst` | world init (`?seeded`) | none | dev First `npcRole`, `tradeWord` | `first.trade.written` | `__DEBUG.getFirstTrade()` |

## Interface impact

Per `Docs/canon/interface-map.md` (design workflow Step 0.7):

| Contract | Disposition |
|---|---|
| Meeting → The First's node | **extend** — two new properties written |
| Binder census (`roleCensus.ts`, `binder.ts`) | **extend** — The First joins the census; her cast eligibility follows her role (in for her role's slots, out of others') |
| Other `npcRole` readers (scoring, Means, caster tradition, prose, social generation, views) | **preserve** — readers unchanged; The First joins their population. Production read sites already exist (`encounterScoring.ts:1169`, `mortalMeans.ts:107`, `casterTradition.ts:54`). |
| Template → filter pipeline | **add** — `protagonistRoles` read by `protagonist_role_fit` |
| Actor → prose enrichment | **extend** — `{trade}` reads `tradeWord` |

Update `scripts/interface-contracts.ts` (row `meeting-writes-first-trade`) and regenerate the interface map; add the `protagonistRoles` field to `Docs/canon/encounters.md`'s template-field list; rulebook § Meet The First gains one clause (§ Rulebook impact).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FIRST_TRADE_ENABLED` | `true` | Master switch for writing the trade at the bond. Off: The First is written as on main (no role, no word). |
| `PROTAGONIST_ROLE_FIT_ENABLED` | `true` | Master switch for the `protagonist_role_fit` filter stage. Off: the stage passes every template. |
| `TRADE_WORD_MAX_WORDS` | `3` | Content-test cap on a vignette's trade word. |
| `TRADE_TOKEN_FALLBACK_WORD` | `'person'` | What `{trade}` renders for an actor with no trade and no role. |
| `ROLE_PRIMARY_AFFINITY_BONUS` (existing) | `0.4` | Reused, unchanged. |
| `ROLE_SECONDARY_AFFINITY_BONUS` (existing) | `0.15` | Reused, unchanged. |

## Tracing

```ts
// FirstTradeWrittenTrace — emitted once, when the bond writes The First's trade
interface FirstTradeWrittenTrace {
  type: 'first.trade.written';
  agentId: string;
  vignetteId: string;     // the chosen candidate's vignette
  role: NpcRole;
  word: string;
  tick: number;
}

// RoleFitRejectTrace — emitted when protagonist_role_fit drops a template for an actor
interface RoleFitRejectTrace {
  type: 'encounter.filter.role_fit';
  actorId: string;
  templateId: string;
  actorRole: NpcRole;
  allowedRoles: NpcRole[];
  tick: number;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A vignette has no `trade` (content gap, old fixture) | No role or word written; The First behaves as on main; the completeness test fails the build, so this only happens in a hand-built fixture. |
| A save made before this ships (First with no `npcRole`) | No migration. She keeps passing every filter (fail-open) and her sheet shows no trade line. |
| `trade.role` not in `NPC_ROLES` (typo) | Typed `NpcRole`, so it fails typecheck; at runtime a non-role string is still written and readers that look it up (`NPC_ROLE_REACH_MAP[role]`) already return 1.0 on a miss (`encounterScoring.ts:1172`). |
| Actor has no `npcRole` | `protagonist_role_fit` passes. Every worldgen mortal without a role keeps today's draws. |
| Template lists `protagonistRoles: []` | Treated as unset (passes). The content test rejects an empty list. |
| Encounter seeding places a gated chapter directly (pipeline bypass, `encounterFilterPipeline.ts:633-634`) | Seeding keeps its bypass. Measured: no file outside `src/data/encounters/` that mentions "seed" names any of the five templates (grep of `src/data` and `src/engine` for the five slugs, filtered to lines containing "seed" → 0 hits). If one is ever seeded, the seed author owns the cast. |
| `{trade}` on an actor with nothing to read | Renders `person`; `{?has_trade}` blocks render empty. |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 663 importers (`grep -rln "types/unifiedAction'" src`) | One optional field added to `UnifiedActionTemplate`. Additive; no existing shape changes; no default written. Typecheck ratchet is the guard. |

`encounterFilterPipeline.ts` (17 importers) and `proseEnrichment.ts` (38 importers) are below the 100 line.

## Three-pillar check

- [x] Engine pillar present — trade write, one filter stage, one prose token
- [x] Content pillar present — 24 vignette trades, 56 role words, five `protagonistRoles` lists, two content tests
- [x] UI pillar present — one sheet line with tooltip, debug accessor
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves "the story becomes yours": the person the player chose stays that person. The god still never chooses what she does (Law 9): the trade is who she was, not an instruction.
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **unticked:** it changes which chapters a mortal can draw, which is an encounter rule.
- [x] `Docs/canon/rulebook.md` is updated in the build PR (not this docs PR, because the rule is not live until the build ships): rulebook § Meet The First and the quick reference gain "**The First keeps the trade you met her in** — a healer stays a healer to the world, and the chapters that need a particular trade wait for a mortal who has it." Updated in the build PR.

> Brainstorm companion: `Docs/plans/2026-10-18-thr-1982-the-first-keeps-her-trade-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Two master switches, two content caps; the weight reuses the existing affinity constants. The 24 trades and five role lists are data. |
| 2. Inspectability | PASS | Two traces (the write, each rejection), a debug accessor, the stage name in the existing filter tally. |
| 3. Determinism | PASS | No randomness; table lookup and list membership. |
| 4. Fail-soft | PASS | Fail-open on a missing role; old saves unchanged; see table. |
| 5. Narrative over mechanical perfection | PASS with note | The trade is chosen for the story the epithet tells, even where its reach pair differs from the vignette's (the healer's role leans gold/star; the empath is veil/heart). That costs a mild pull toward chapters she is less skilled at, which the forecast window (50–65%) already filters. Story wins, as NFP 5 says. |
| 6. Additive over destructive | PASS | New optional fields and one stage; nothing deleted; no prose rewritten. |
| 7. Performance budget | PASS | One `includes` on a ≤ 8-item list per candidate template per decision, and only for the five templates that carry a list. |

## Done when

- [ ] Choosing any of the 24 candidates writes `npcRole` and `tradeWord` on The First; `await window.__DEBUG.getFirstTrade()` returns `{ role: 'healer', word: 'Healer' }` after choosing the empath (constructed via `?view=game&firstunmet&size=medium`).
- [ ] The empath First's Means is born from `ROLE_WEALTH.healer` (trace `economy.means.birth` carries `role: 'healer'`).
- [ ] A unit test: a healer actor does not draw *The Page Beneath the Saint*; a scribe actor and a roleless actor do; `encounter.filter.role_fit` is emitted for the healer.
- [ ] Content tests: every vignette has a trade; every role has a word; every job-cast template declares `protagonistRoles`, each list naming at least one role in the vignette table.
- [ ] Person sheet shows "Healer" with the `ui.trade` tooltip at 1920×1080 (four-part browser evidence: screenshot, console, the `__DEBUG` assertion above, UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37).
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, freshness); engine files touched → 30-tick CLI smoke and `npm run test:heavy`.
- [ ] `?view=game&seeded&size=medium`: `await window.__DEBUG.getFirstTrade()` returns `{ role: 'priest', word: 'Shrine-keeper' }` (the dev seed agrees with the bond).
- [ ] The location people list and the chronicle soul card render "Healer" for the empath First (Playwright DOM read), and a unit test pins `displayTradeWord` over `tradeWord`, role-only and empty nodes.
- [ ] Rulebook clause, quick reference, `encounters.md` field list, interface contract row.
- [ ] A `UL-proposal` issue for **Trade** — what The First did before the thread; fixed; distinct from Calling — is filed with the build PR.
- [ ] Follow-up already filed by the design pass (not this build's work): [Ordinary scenes still hand The First a trade she never had](https://linear.app/threadbare/issue/THR-1983) (THR-1983), in the *Cold playtest · round 4* milestone. It owns the round-4 "smithing guild applicant" recast (`encounter-content.ts:6319-6320`, an ordinary guild scene outside the five gates).

## Coordination block

**Suggested model:** sonnet — additive fields, one filter stage, one table and a sheet line; the only ordering trap (role before `giveBirthMeans`) is named here.

**Parallel-safe with:** [THR-1981](https://linear.app/threadbare/issue/THR-1981) (the opening picks — its design pass edits the picker's display, not `candidate-vignettes.ts`'s data shape; if it lands first and adds fields, merge additively); [THR-1980](https://linear.app/threadbare/issue/THR-1980) (top-bar words; no shared files).

**Mutex with:** any build editing `candidate-vignettes.ts` or `createAgentFromMeeting` (the trade write shares both); any build adding a stage to `encounterFilterPipeline.ts` (stage order list); [THR-1911](https://linear.app/threadbare/issue/THR-1911) only if it is still moving the person sheet's identity block into the Inspector's page-layout table when this lands — the trade line then lands in the table's identity row instead of `OverviewTab.tsx`.

**Files to touch:**
- Create: `src/data/npc-role-words.ts`; tests beside the vignette table and the filter pipeline.
- Edit: `src/data/candidate-vignettes.ts` (24 `trade` entries), `src/types/meetingEncounter.ts` (`trade?` and `vignetteId?` on `NarrativeCandidate` and `MeetingEncounterResult`), `src/engine/meetingEncounter.ts` (copy `trade` and `vignetteId` in `generateNarrativeCandidates` beside `:1247`, in both builders; write before `:1093`), `src/engine/gameInit.ts` (`devSeedTheFirst` writes priest / Shrine-keeper before `:982`), `src/components/Game/LocationView.tsx` (`:1746` → `displayTradeWord`), `src/components/Game/HexChronicle.tsx` (`:970-1064` soul-card `role` → `displayTradeWord`), `src/types/unifiedAction.ts` (`protagonistRoles?`), `src/engine/encounterFilterPipeline.ts` (stage), `src/engine/proseEnrichment.ts` (`{trade}`), `src/engine/agentDetail.ts` (`card.tradeWord`), `src/components/Game/tabs/OverviewTab.tsx` (line), the tooltip registry (`ui.trade`), five encounter files (`protagonistRoles`), `src/debug-bridge.ts` + `.d.ts`, `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/encounters.md`.

## Notes for the executor

- **Write the role before `giveBirthMeans`** (`meetingEncounter.ts:1093`), or her Means is born from `DEFAULT_WEALTH` and the Done-when line fails.
- **Do not derive the role from the reach pair.** `NPC_ROLE_REACH_MAP` would give the empath `bard`. The table is authored on purpose.
- **Binder reuse — no exclusion, pin the delta.** A role changes her binder eligibility both ways. She enters census reach for slots accepting her role (`roleCensus.ts:47`, `binder.ts:189-208`), and she is excluded from slots that don't (`binder.ts:394`). Today, roleless, she is mid-band for any slot (`:234-236`). That is the trade being true in the world; no `the_first` exclusion is added (excluding her changes scene casting for every run, a separate decision). A unit test pins the actual delta: a priest First is a candidate for a `priest` slot via census and is excluded from an `innkeeper` slot.
- **No spell grant.** A healer First does not gain a starting spell from this plan; starting spells are a world-creation pass. If someone asks for it, that is a separate ticket.
- **Do not rewrite the five chapters' prose.** Inside the gate it is true.
- **`{trade}` ships unused.** Do not convert existing prose to it in this PR.

## Intent-judge verdict

- **Pass 1: Revise** (Reversible). Six findings: the dev-seed First writer was missing; the candidate copy site and `vignetteId` carrier were missing; two surfaces print raw `npcRole` (a PC-6 split); the citation drifted (`:961`, not `:973`); the binder claim was unmeasured; the round-4 guild recast needed an owner now; and Trade needed a UL proposal. All applied. The suggested `the_first` binder exclusion was deliberately not taken, for the reason in § Notes.
- **Pass 2: Allow** (Reversible), with one pre-PR fix: the binder note understated the eligibility change (she joins the census for her role's slots and is excluded from others). The fix was applied verbatim; per the judge, that edit needed no re-judge.

## Forked-audit verdicts

### NFP audit

**PASS-with-notes.** Tunability, Inspectability, Determinism, Fail-soft and Performance pass. Note on 5: the trade follows the epithet rather than the reach pair, at the cost of a mild pull toward weaker chapters; the gate lists each keep a First-reachable role. Note on 6: The First joins binder casting both ways, which is stated openly and pinned by a test.

*Author response:* both notes are deliberate and already in the NFP table and § Notes for the executor. No change.

### Three-pillar audit

**PASS-with-notes.** All three pillars are present and substantive, the Wiring table connects every module, and the substrate inventory cites code for every row. Note: `systems-inventory.md` has no entries for NPC roles, role affinity, Meet The First or Mortal Means, so the rows rest on code citations instead of inventory names.

*Author response:* this is a gap in the inventory, not in the plan. The build PR's wiring step adds inventory rows if the generator (`generate-systems-inventory`) picks them up from code; no hand edit is owed here.

### Vision audit

**PASS-with-notes.** It extends north-star "the mortal has to feel like a person, not a unit"; it confirms non-negotiables #1 (god, not protagonist), #2 (narrative over mechanics) and #3 (prose, never numbers); and it contradicts nothing. Notes: the encounter pool for a First whose trade does not fit loses the five gated chapters (core loop untouched); the plan leans toward authored determinism (tension #2); binder eligibility shifts.

*Author response:* the pool shrink is bounded to five regional chapters, and each stays reachable by some First. The kill criterion in the intent proposal switches the gate off if a measured First is left with nothing to draw. Taste-profile citation added to the reasoning here: the single plain word on the sheet follows "prose-first UI".
