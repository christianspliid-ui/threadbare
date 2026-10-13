> **title:** `The world remembers — an account record, a new world each run, echoes that stand in it, and choices that widen — THR-1813`
> **linear_issue:** THR-1813
> **author:** `Claude Code (design lane, unattended run 2026-10-14a)`
> **created:** 2026-10-14
> **three_pillars:** Engine `done — a versioned account record behind one storage seam, a run-end fold that activates the dormant cycle-transition code, a post-worldgen echo pass that writes place scores, notables and relics, and a sealed-set read for hungers, courts and cards; no new node type, edge type or tick phase` · Content `done — divine echo selection rules, echo landmark and lineage words, the Remembrance step's prose, chronicle lines for each echo` · UI `done — the harvest button wakes a new world, a new first Remembrance step "The world remembers", the hunger awakening choice, debug bridge + DebugPanel readout`

# The world remembers — THR-1813

*Christian ruled that the god never grows stronger between runs; the world remembers, and the choices widen. Today nothing carries at all: "Begin Next Cycle" keeps the same map and the same god, and a new game inherits nothing. This plan builds the carry.*

## Why this is load-bearing

Christian's ruling, chat 2026-10-11, recorded on [How a player's gods grow across runs](https://linear.app/threadbare/issue/THR-1773): **"World remembers + wider"** — the god starts every run equally strong; what carries is in the world (Monuments, Legacy mortals' descendants, Relics, the World-Soul's tilt) and in the player's choices (hungers, courts and cards that unlock for later runs). **"New world, shaped by echoes"** — each run wakes in a fresh map, *"a response, not a sequel"* (rulebook §11, `rulebook.md:605`).

Three things stand between that ruling and the game, all measured below:

1. **No memory exists.** There is no save, account or profile module; every `localStorage` use under `src/` is a UI preference. Close the tab and the next game knows nothing.
2. **The next run is the same world.** `transitionToNewCycle` (`src/engine/cycleEnd.ts:200`) spreads `...state`: same graph, god, tiles and seed.
3. **The cross-run code is written but never called.** `executeCycleTransition`, `buildHarvestOutcome` and `collectInjections` have no production caller; `seedWorld` is always handed `injections = undefined`; the harvest fills no divine echo except the card.

This is the build ticket filed by the THR-1773 decision. The [Dominion map](https://linear.app/threadbare/issue/THR-1758) is closed; [Buy your spheres](https://linear.app/threadbare/issue/THR-1749) is Done; the [god-card offering plan](https://linear.app/threadbare/issue/THR-1811) is in Ready for Dev and only slice 3 waits on its build.

## Settled inputs

None is re-opened. Each is cited where used.

| Ticket | Who decided, when | What it settled |
|---|---|---|
| [How a player's gods grow across runs](https://linear.app/threadbare/issue/THR-1773) | **Christian, chat, 2026-10-11** (direction); the *how* by delegation, attended, same day | World remembers + wider; a new world per run; no god stat grows. The axes (Monument / Legacy / Relic / card echo / World-Soul tilt / hungers / courts / cards); `MAX_SEEDED_ECHOES` 6; `FUNDAMENT_BLEND_PER_RUN` 0.1, `FUNDAMENT_REVERT` 0.05; run 1 offers 4 hungers and 70 market cards; one hunger (the player's pick of two) and 2 cards unlock a run; a second court after one run with a hunger; the never-grows list; the Remembrance step; a small account record, not a full save. Decision record: [`2026-10-11-thr-1773-cross-run-growth-prototype.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1773-cross-run-growth-prototype.md); mock: [`remembrance-mock.html`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-11-thr-1773-remembrance-mock/remembrance-mock.html) |
| [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811) | design lane, 2026-10-13 (veto window closed ~22:15Z 2026-10-13, no veto) | The `progression` block and `offerableCards(state, rung)`, the one function a sealed card must be filtered out of |
| [God-card tiers and the generic set](https://linear.app/threadbare/issue/THR-1794) | attended, 2026-10-11 | The tiers and the generic verdict that define the run-1 market (every Tier 1–2 card, every generic card, each sphere's cheapest Tier 3) |
| [Buy your spheres](https://linear.app/threadbare/issue/THR-1749) | shipped 2026-10-09 | The bought sphere vector, read through `getSpherePoints`, that decides kin and opposed |
| [Dominion core](https://linear.app/threadbare/issue/THR-1748) and [the opposing dominion](https://linear.app/threadbare/issue/THR-1763) | shipped 2026-10-12 | The one band read (`dominionOf`) and neglect relaxing a place toward its seeded scores |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Cycle end (`cycleEnd.ts`: twilight, `computeHarvest`, `transitionToNewCycle`) | 🟢 ACTIVE (same-world only) | **extends** `computeHarvest` with divine echo picks; **replaces** the production caller of `transitionToNewCycle` (the function stays for its tests) |
| World-Soul (`worldSoul.ts`: `blendFundaments`, `executeCycleTransition`) | 🟠 DORMANT | **activates** `blendFundaments` in the run-end fold |
| Echoes (`echo.ts`, `types/echo.ts`) | 🟠 DORMANT past the card echo | **activates** degradation across runs and `collectInjections`; adds a placed seeding pass |
| Spheres & Quintessence (aggregation) | 🟢 ACTIVE | **preserves** — the per-tick aggregate keeps overwriting `fundament.sphereWeights`; the tilt rides the cosmology profile instead (§ Measured) |
| Dominion (`dominion.ts`, `phaseDominion.ts`) | 🟢 ACTIVE | **reads** `dominionOf` to size a monument's imprint; neglect applies unchanged |
| Living world seeding (`seedLivingWorld.ts`: notables, ties) | 🟢 ACTIVE | **reuses** `hydrateToTier` and the tie shape for a Legacy's descendant |
| Remembrance (`remembrance.ts`, `components/Remembrance/`) | 🟢 ACTIVE | **extends** — `filterHungers` reads the awake set; one new first step from run 2 |
| Card repertoire echo (`nudgeCardRepertoire.ts`) | 🟢 ACTIVE | **preserves** — `echoCardsFromDefinitions` now finds the carried card echo after a new world |
| God-card offering (`godProgression.ts`, THR-1811) | ⚪ PLANNED | **extends** `offerableCards` with one sealed-set filter (slice 3 only) |

Populations consumed: 12 hungers (`HUNGER_CATALOG`, `src/data/hunger-catalog.ts:12`), 24 courts (two each), 93 market cards (THR-1794 table; 70 open on run 1, 23 sealed), and per seed 234–246 top-level places (measured below).

## Measured substrate

Read over `origin/main` @ `98ce7128`, 2026-10-14. A read-only survey subagent produced the file:line inventory; every row below was re-read by hand.

| Claim | Evidence |
|---|---|
| No persistence beyond UI preferences | `localStorage` hits only in audio channels, `SettingsModal.tsx:39`, `TerrainTextureLab.tsx`, `ChroniclePanel.tsx:39`, `EncounterVeil.tsx:528`, `NudgeStageHeader.tsx:340`, `openingReveal.ts:43`, `useNotificationPreferences.ts:13`; no `sessionStorage`, no `indexedDB`, no save/account module |
| The next cycle is the same world | `transitionToNewCycle` (`cycleEnd.ts:200`) returns `{ ...state, cycle+1, tick 0 }`; its one production caller is `handleBeginNextCycle` (`useSimulation.ts:240-258`), behind "Begin Next Cycle" (`HarvestScreen.tsx:105,113`) |
| A new world is built once per mount | `useSimulation.ts:80-107` builds the world in a `useMemo` keyed on seed and identity; tiles, rivers and lakes are `useState` set once (`:110-112`). A new run must re-enter through `App`'s phase, not mutate in place |
| The new game always starts empty | `gameInit.ts:149` `createDefaultFundament()`; `:447-456` `echoDefinitions: []`, `echoStates: []`, `createResonanceState()` |
| The World-Soul's sphere weights do not survive a tick | `phaseSphereAggregation.ts:202-213` mirrors the normalised aggregate into `fundament.sphereWeights` every tick, and `gameInit.ts:450` overwrites it at init. Worldgen reads them only in `cultureGenerator.ts:63-76` (`selectFoundation`, Foundation spheres only) |
| The cosmology profile is what shapes a world's spheres | `initializeGameStateFromIdentity` derives it (`remembrance.ts:369` `deriveCosmologyFromIdentity`) and hands it to `generateWorld` and `seedWorld` (`gameInit.ts:157,169`) |
| The dormant injection hooks are global, not placed | `worldSeed.ts:906` takes the *first* `location_feature` and applies its biases to every settlement; `:1803-1816` applies the first `cultural_template` to every individual; `:2001-2010` flags every artifact `echoOrigin` when any `quest_seed` exists |
| Divine echoes are counted but never filled | `computeHarvest` (`cycleEnd.ts:104-198`) returns `divineEchoSlots` 3/2/1 and fills only `cardEcho`; its cosmic candidates take the cosmology's top two spheres, not the god's |
| The band is derived, never stored | `dominionOf` (`dominion.ts:276`) reads the god's bought points against the place's `sphereAffinity.scores`; Touched ≥ 0.5, Held ≥ 1.5, Hostile < −1.5 (`dominion-content.ts:25-31`) |
| Neglect relaxes only bought spheres above the seed | `phaseDominion.ts:318-339` → `relaxTowardSeed(..., DOMINION_UNTENDED_DECAY_PER_TICK 0.01)`; the seed is snapshotted by `recordSeededScores` (`gameInit.ts:334`) |
| Hungers are filtered from the whole catalog | `filterHungers(origin, drive, allHungers, seed)` (`remembrance.ts:226`) returns 2–3; one caller, `RemembranceFlow.tsx:57` |
| Each hunger has a default court | `CourtOption.isDefault` (`src/types/hunger.ts:217`); `courtOptions: [CourtOption, CourtOption]` (`:245`) |
| The `progression` field and `godProgression.ts` are not on `main` | grep `progression?:` in `src/types/unifiedAction.ts` → none; `src/engine/godProgression.ts` absent |

### The monument imprint, measured

Script `measure-echoes*.ts` (design-lane scratchpad, bundled with esbuild, not committed), seeds 42 / 99 / 7, `--map medium`, balanced cosmology, tick 0. A Life/Spirit past god (points 3/2) and three echo sphere pairs.

**One fixed imprint cannot do both jobs.** Adding Δ to each echo sphere of a host that reads Foreign for the past god:

| Δ | Kin god (same pair) reads | Opposed god (Entropy/Energy) reads |
|---|---|---|
| +1 | Touched 65–86% | Foreign 71–90%, Hostile 0% |
| +2 | Held 65–86% | Foreign 98–99%, Hostile 0% |
| +3 | Held 29–49%, **Sovereign 51–71%** | Hostile 52–68% |
| +4 | Sovereign 92–95% | Hostile 64–85% |

Weak sphere pairs (Matter/Mind vs Time/Force, opposition weight 0.4) reach Hostile only 7–14% at +3.

**Lifting until the new god reads the decided band does both**, because the new god is known when its world is built (Remembrance runs before `initializeGameStateFromIdentity`). Imprint needed, in steps of 0.5 (median / max over all Foreign hosts, nine seed × pair cells):

| Target | Median | Max | Missed at cap 6 |
|---|---|---|---|
| Kin god → Held | 1.5–2 | 3 | 0% |
| Kin god → Touched | 0.5–1 | 2 | 0% |
| Half-kin god (one sphere shared) → Held | 2–3 | 5.5 | 0% |
| Opposed god → Hostile | 2.5–4.5 | 6 | 0% in 8 cells, 8% in 1 (Time/Force against Matter/Mind) |

**The best-matching place is the wrong host.** On all three seeds the place that best matches the past god already reads Sovereign for a kin god, so a monument there changes nothing (imprint 0). The host is chosen among places that read Foreign for the new god.

For scale, a kin god already holds 41 / 53 / 52 places at Touched or better at tick 0 (seeds 42 / 99 / 7). One or two monuments are landmarks, not a balance shift; the decision record's "0–1 Held or Touched for a kin god" holds.

## Decided by delegation (design lane, 2026-10-14 — veto in chat)

1. **A monument is lifted until the new god reads the decided band, read through the one Dominion read.** At world creation, for each Monument echo: relation = sign of the new god's `matchOfScores` against the echo's spheres (kin > 0, opposed < 0, unrelated = 0). Target: kin → **Held** while the echo is *still warm* (degradation < 0.3), **Touched** while *fading* (< 0.6), none after; opposed → **Hostile** at any memory, as the mock shows (*"almost gone… It will stand against a god of Life"*); unrelated → no imprint (a named landmark only). The imprint adds `MONUMENT_IMPRINT_STEP` 0.5 to each echo sphere until the god's read reaches the target, capped at `MONUMENT_IMPRINT_MAX` 6. A cap miss stands as it reads and traces why. *Why:* measured above — one fixed size makes kin gods Sovereign or opposed gods Foreign. This refines THR-1773 Decided 2 ("Held < 0.3 / Touched < 0.6 when kin, Hostile when opposed"), whose words it keeps.
2. **The imprint is written after the seed snapshot.** `seedEchoes` runs after `recordSeededScores` (`gameInit.ts:334`), so a kin monument's lift sits above its seed and THR-1763 neglect fades it untended (each 1.0 of lift lasts about 100 ticks, roughly 8 days). An opposed monument's lift is in spheres the god did not buy, which neglect never touches: it stands against the god until **Shift Dominion** breaks it. *Why:* the decision record says neglect applies; the shipped neglect rule already gives the brake and the remedy.
3. **The host is ordinary ground near the god's own story.** Candidates: top-level places that read Foreign for the new god, not the seat, not `loc.start`, not hosting another echo. Ranked by the place's match to the echo's spheres (highest first: where those spheres already linger), then id. The monument is a named sublocation (`locationSubtype: 'ruins'`, `parentLocationId` the host, name the echo's name), so it has a place page and a Codex/Chronicle link (Law 21). The lift is on the host, because the band reads the place tier.
4. **The god's own echoes are picked at harvest, by rule, never rolled.** `computeHarvest` fills its `divineEchoSlots` (3 / 2 / 1) in rotation Monument → Legacy → Relic, each from the best candidate of its kind: a Monument is a place the god reads Sovereign, else Held, at harvest; a Legacy is a threaded mortal at the highest thread tier (an Aspect or Champion first); a Relic is an artifact borne by one of the god's threaded mortals. Ties break on significance, then id. Divine echoes carry the god's bought primary and secondary as their spheres. A kind with no candidate yields its slot to the next kind. *Why:* the decision record's earners, made deterministic (NFP 3).
5. **Six live echoes at most, the god's own first.** Seeded order: divine before cosmic, then by strength × significance (strength = 1 − degradation), then id; `MAX_SEEDED_ECHOES` 6. Card echoes do not count against the six (they live in the repertoire, not the map). Cosmic candidates keep today's rule but take the god's bought pair as spheres, not the cosmology's top two.
6. **A Legacy is a descendant notable, promoted, never minted.** The highest-wealth ambient resident of the best-matching settlement (its culture's or its own scores against the echo's spheres) is hydrated to `notable` through `hydrateToTier`, stamped `notableOrigin: 'echo'` and `echoLineageOf: <echo name>`, its scores lifted by `LEGACY_SPHERE_LIFT` × strength in the echo's spheres, and tied as `kin` (a `relates_to` pair, the THR-1589 tie shape) to one other resident. *Why:* reuses the living-world seeding verbs; a minted mortal would need the whole agent pipeline.
7. **A Relic lies unborne.** One `artifact` node named after the echo, its sphere the echo's primary, `echoOrigin: true`, `echoId`, placed at a ruin or wilderness place (sorted by the echo-sphere match, then id), with no bearer — so the Dominion read is Foreign until a mortal takes it up (THR-1764).
8. **The tilt rides the cosmology profile.** The account keeps a `FundamentState`; each run end blends it toward the god's earned spheres with `blendFundaments(f, earnedAsFundament, FUNDAMENT_BLEND_PER_RUN)`, then back toward even with `blendFundaments(f, even, FUNDAMENT_REVERT)`. At the next world, the derived cosmology profile is multiplied sphere by sphere by `1 + WORLD_TILT_GAIN × (12 × f.sphereWeights[s] − 1)` (12 = the sphere count, so an even fundament multiplies by 1) and renormalised, and the same `FundamentState` is passed to culture generation in place of `createDefaultFundament()`. *Why:* `fundament.sphereWeights` is overwritten every tick (measured); the cosmology profile is what actually shapes a world's spheres. *Owed in the build:* the tick-0 home-turf census with and without the tilt (THR-1813's own "owed" line).
9. **The account record is small, versioned and lives outside `GameState`.** One pure module (`accountRecord.ts`: shape, `emptyAccount()`, `migrateAccount()`, `concludeRun()`) and one storage seam (`accountStore.ts`: `loadAccount()` / `saveAccount()` over `localStorage` key `threadbare.account.v1`). A cleared browser resets it. Nothing in the tick loop reads storage; the record enters at world creation and leaves at run end. *Why:* the decision record's "small versioned record behind one read/write seam"; outside `GameState` so the 723-importer type gains no field.
10. **Each run wakes on a new seed, derived, not random.** `nextWorldSeed = mulberry32(prevSeed + ACCOUNT_SEED_PRIME × cycleCount)()` scaled to an integer. Same account, same choices → same next world (NFP 3).
11. **Two hungers stir; the player wakes one, in Remembrance.** At run end the two sealed hungers that share most spheres with the god's bought pair stir (ties by catalog order); the first is the one *the old god's echoes favour*. The choice is made at the top of the next Remembrance, on *The world remembers* step, and the woken hunger is offered at once. Run 1 wakes Gather, Witness, Reclaim and Sever (the decision record's four). `filterHungers` is handed the awake set instead of the whole catalog; if fewer than two awake hungers score, it tops up from the awake set in catalog order. *Why the choice lives in Remembrance, not the harvest screen:* that is where the mock puts it, and the player sees the god it unlocks immediately.
12. **A hunger's second court opens after one run played with it.** Run 1 offers each hunger's `isDefault` court only.
13. **Two cards unseal a run, weighted to the god's spheres.** At run end, `ACCOUNT_CARD_UNLOCKS_PER_RUN` 2 cards are drawn without replacement from the sealed set, weight `ACCOUNT_UNSEAL_PRIMARY_WEIGHT` 3 for the god's primary (by `progression.pricedIn ?? sphereAffinity`), 2 for its secondary, 1 otherwise, on `mulberry32(worldSeed + ACCOUNT_UNSEAL_PRIME)`. The run-1 sealed set is computed from the catalog at load, not stored: every `market` card that is not Tier 1–2, not generic, and not its sphere's cheapest Tier 3. A card authored later joins the sealed set automatically.
14. **"Begin Next Cycle" becomes *Wake in a new world*.** The in-tab same-world continuation goes, as Christian ruled ("Today's in-tab 'Begin Next Cycle'… changes"). `transitionToNewCycle` keeps its tests and loses its caller.

## Engine pillar

### Systems design

Three build slices. Each is one ticket, built and merged on its own; the order is the dependency order.

**Slice 1 — the account and a new world each run** ([The world remembers](https://linear.app/threadbare/issue/THR-1813), this ticket).

- **E1 — `src/types/account.ts` (new):**

```ts
/** THR-1813 — what carries between runs. Not a world save. */
export interface AccountRecord {
  readonly version: 1;
  /** Runs completed (0 before the first harvest). */
  cycleCount: number;
  /** The seed the next world wakes on. */
  nextWorldSeed: number;
  awakeHungerIds: string[];
  /** Hungers whose second court has opened. */
  secondCourtHungerIds: string[];
  /** Hunger ids that stir at the next Remembrance (0 or 2); the first is favoured. */
  stirringHungerIds: string[];
  /** Cards unsealed beyond the run-1 market (THR-1811 ids). */
  unsealedCardIds: string[];
  echoDefinitions: EchoDefinition[];
  echoStates: EchoState[];
  fundament: FundamentState;
  resonance: ResonanceState;
  /** For the Remembrance step's words: the last god's name, spheres and hunger. */
  lastRun?: { divineName: string; primary: SphereName; secondary: SphereName; hungerId: string; harvestType: HarvestType };
}
```

- **E2 — `src/engine/accountRecord.ts` (new, pure):** `emptyAccount(seed)`; `migrateAccount(raw): AccountRecord | null` (unknown version → `null`); `concludeRun(account, state, harvest): AccountRecord` — degrade carried echoes (`degradeAllEchoes`), drop the faded, append this harvest's divine and cosmic echoes plus the card echo, blend the fundament (Decided 8), set `stirringHungerIds` (Decided 11), add the played hunger to `secondCourtHungerIds`, unseal cards (Decided 13, a no-op until slice 3), copy `worldSoul.resonance`, `cycleCount + 1`, `nextWorldSeed` (Decided 10), `lastRun`. `wakeHunger(account, hungerId)` moves a stirring hunger to awake and clears `stirringHungerIds`.
- **E3 — `src/engine/accountStore.ts` (new, the only file that touches storage):** `loadAccount(): AccountRecord` (missing, unparsable or unmigratable → `emptyAccount`, with the raw kept under `threadbare.account.v1.unreadable`), `saveAccount(a)` (a failed write is traced and the run continues). `?account=fresh` ignores the stored record for the session; `?account=sample` loads `SAMPLE_ACCOUNT` (a fixture with one echo of each kind, for browser verification).
- **E4 — harvest picks** (`cycleEnd.ts` `computeHarvest`): fill the divine slots (Decided 4) and return `divineEchoes: EchoDefinition[]` beside `cosmicEchoCandidates`; cosmic echoes take the god's bought pair (Decided 5).
- **E5 — world creation reads the account** (`initializeGameStateFromIdentity`, `gameInit.ts:507`): a new optional `account?: AccountRecord` argument. When present: tilt the derived cosmology (Decided 8), pass `account.fundament` to culture generation and seeding, and load `echoDefinitions`, `echoStates` and `resonance` into the new state (so the card echo reaches the repertoire through the shipped `echoCardsFromDefinitions`). Absent → today's behaviour, byte for byte (the seeded dev routes and every test).
- **E6 — the run-end path** (`useSimulation.ts` `handleBeginNextCycle` → `handleWakeNewWorld`): when the harvest result is computed (the harvest screen mounts), `concludeRun` → `saveAccount` run at once and the result (`ok`) is held beside `harvestResult`, so a failed save is shown on the harvest screen before the player wakes. The *Wake in a new world* press then only calls `onWakeNewWorld(account)` up to `App`, which sets `{ phase: 'remembrance', seed: account.nextWorldSeed }`. The current world unmounts; `App`'s `playing-remembrance` phase passes the account to `initializeGameStateFromIdentity`.

**Slice 2 — echoes stand in the new world** ([Echoes stand in the new world](https://linear.app/threadbare/issue/THR-1843), filed by this plan; blocked by slice 1).

- **E7 — `src/engine/seedEchoes.ts` (new):** `seedEchoes(graph, ascendantId, account, seed): SeededEchoesSummary`, called in `initializeGameState` after `recordSeededScores(graph)` and before `computeFactionSphereAggregates` (`gameInit.ts:334-335`). Takes the live echoes in Decided 5's order up to `MAX_SEEDED_ECHOES`, and per kind: Monument → Decided 1–3; Legacy → Decided 6; Relic → Decided 7. One `mulberry32(seed + ECHO_SEEDING_PRIME)` stream is used only inside `hydrateToTier`; every choice of where and who is a sort (NFP 3). Each seeded echo records `{ echoId, kind, hostId, band, imprint }` on the summary and writes one "before you woke" chronicle line (Content).
- The dormant global hooks in `seedWorld` stay unused (`injections` stays `undefined`): they would bias every place and every mortal by the first echo, which is not what an echo is. A code comment at `worldSeed.ts:906` points to `seedEchoes`.

**Slice 3 — choices that widen and *The world remembers*** ([Choices widen across runs](https://linear.app/threadbare/issue/THR-1844), filed by this plan; blocked by slice 1 and by the [god-card offering](https://linear.app/threadbare/issue/THR-1811) build).

- **E8 — the sealed sets (`accountRecord.ts`):** `awakeHungers(account)`, `openCourts(account, hungerId)`, `sealedCardIds(account, catalog)` (Decided 13's run-1 rule minus `unsealedCardIds`), `isCardSealed(account, id)`.
- **E9 — readers:** `filterHungers` receives `awakeHungers(account)` (Decided 11); the court step offers `openCourts`; `offerableCards` (THR-1811 E2) gains `&& !isCardSealed(account, id)`, with the account's sealed set copied onto `GameState.sealedCardIds` at world creation (a plain `string[]`, optional, so the tick loop never reads storage).

### Graph nodes / edges

No new node or edge type. Slice 2 writes existing shapes: `type: 'location'` sublocations with `parentLocationId` (THR-1183), `relates_to` tie pairs with `basis: 'kin'`, and `type: 'artifact'` nodes; plus properties `echoId`, `echoOrigin`, `notableOrigin: 'echo'`, `echoLineageOf`. Checked against `src/types/graph.ts` and `world-model.json` vocabulary: `locationSubtype: 'ruins'` exists (`src/types/index.ts:69`).

### Tick phases

None added; nothing in this plan runs per tick. The account is read at world creation and written at run end.

### Resolution logic

Monument imprint: `while (rank(band(god, host)) short of target && lift < MONUMENT_IMPRINT_MAX) lift += MONUMENT_IMPRINT_STEP` over the echo spheres, clamped at `MAX_SPHERE_SCORE`. Relation: `sign(matchOfScores(godPoints, echoVector))` where `echoVector` gives each echo sphere 10. Unseal draw: weighted without replacement, two picks.

### PRNG callouts

Three seeded streams, each called a fixed number of times: the next-world seed (one call per run end), the unseal draw (two calls), and the Legacy hydration (inside `hydrateToTier`, its own prime). Host, heir, relic site, divine picks and stirring hungers are total orderings. No `Math.random`.

## Content pillar

### Data tables

`src/data/account-content.ts` (new): every constant below, `RUN_ONE_AWAKE_HUNGERS = ['gather', 'witness', 'reclaim', 'sever']`, the memory-word ladder, and the step's words.

### Words

| Where | Text (rendered for a Life/Spirit past god) |
|---|---|
| Memory words (degradation < 0.3 / < 0.6 / < 0.9) | *still warm* / *fading* / *almost gone* |
| Monument card, kin | "The Long Barrow at Hesk. Raised by the Shepherd who came before you. The ground around it still answers to the old prayers." + "If your spheres are kin to it, it wakes as ground already yours. Left untended, it fades." |
| Monument card, opposed | "The Salt Spire. Raised by a god of endings, three worlds ago. Nothing grows in its shadow." + "It will stand against a god of Life." |
| Legacy card | "The line of Maren Ashfold. Maren became an Aspect of the old god. Her grandchildren walk this world, and they remember a voice in the dark." |
| Relic card | "The Hollow Bell. It rang for a god who watched. Now it lies unclaimed somewhere in the hills, waiting for a hand." |
| Chronicle, before you woke (one per seeded echo) | "The Long Barrow still stands near {host}." · "The line of Maren Ashfold lives on in {heir}." · "The Hollow Bell lies somewhere near {site}, unclaimed." |
| Hunger choice | "Two hungers stir. The old god's echoes favour one; you choose which wakes." Buttons: "Let Kindle wake" / "Let Reshape wake" |
| Powers | "Because the last god drew on Spirit, more of Spirit's powers can rise for whoever comes next." |
| Closing line | "The kind of god you were is part of this world now." |
| Harvest button | "Wake in a new world" (tooltip `ui.harvest_wake`: "This world ends. A new one wakes, shaped by what this one leaves behind.") |

Names come from the echo (`EchoDefinition.name`, the old node's name), so a monument keeps the name the player knew. Gender words for a Legacy follow the origin node's pronoun data where present, else they/them.

### Encounter templates / attachment content

N/A — no encounter or attachment changes. A seeded relic is an ordinary unborne artifact that the existing artifact verbs and encounters already reach.

## UI pillar

*Screenshot tool: Playwright (every surface here is DOM: the harvest screen, the Remembrance steps, the place page). The map's sublocation signifier is the existing generic one.*

### Player-facing display

- **Harvest screen** (`HarvestScreen.tsx`): the button reads *Wake in a new world*; the divine echo line names what the god leaves ("Your age leaves behind: The Long Barrow, the line of Maren Ashfold.") instead of a slot count.
- **The world remembers** (slice 3; `src/components/Remembrance/WorldRemembersBeat.tsx`, new): the first step of Remembrance from run 2 on, before the Stirring; a first run skips it. Three sections per the mock: *What still stands* (one sphere-tinted card per live echo, kind, name, story line, memory word, and for monuments the kin or against line — shown before the god is chosen, so the choice carries weight), *Gods who may wake* (twelve hunger chips: awake / stirs / asleep, and the two-button choice), *Powers that may now rise among the omens* (the two unsealed cards as `CardFace`s). One *Go on to the stirring* button, disabled until a hunger is chosen when two stir (Law 25 reason: "Choose which hunger wakes").
- **Transformation step** (`TransformationBeat.tsx`): unchanged layout; it offers only awake hungers and open courts.
- **In the world** (slice 2): the monument appears on its host's place page as a sublocation; the heir's sheet shows "Of the line of Maren Ashfold" under their name; the relic shows on its place like any artifact.

### Player-facing text

Every new or changed surface, with the exact words and where the explanation lives. The story lines per echo are in § Content › Words; this table adds the tooltips, chips and automatic-step lines. **One name everywhere (PC-6):** an echo is always named by `EchoDefinition.name` with its kind's phrasing — *The Long Barrow*, *the line of Maren Ashfold*, *the Hollow Bell* — on the harvest screen, on *The world remembers*, in the Chronicle and on the place page, from one formatter (`echoDisplayName(def)` in `account-content.ts`).

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Harvest screen, what the god leaves | "Your age leaves behind: The Long Barrow, the line of Maren Ashfold." | PC-4, PC-6 | Replaces the slot count. Tooltip `ui.harvest_leaves`: "The world chose what remembers you: the places you held most surely, the mortals you raised highest, the relics your chosen carried. They will be waiting in the next world." This is the line that says the game picked them (PC-4) |
| Harvest button | "Wake in a new world" | PC-4 | Tooltip `ui.harvest_wake`: "This world ends. A new one wakes, shaped by what this one leaves behind." |
| Step heading | "The world remembers" + "Before you wake, a new world settles around what the old ones left behind." | PC-1 | The step's own sentence; a first run never sees it |
| World tilt line (top of the step) | "This world leans a little toward Life and Spirit, the spheres the last god drew on most." | PC-1 | Sphere words carry their `sphere.*` tooltips. Tooltip `ui.world_tilt`: "Each world leans a little toward the spheres earlier gods drew on, and drifts back toward balance over time." No number |
| Echo kind label, Monument | "Monument · Life and Spirit" | PC-1 | Tooltip `ui.echo.monument`: "A place an earlier god made its own. A god of kindred spheres finds it already theirs; a god of opposed spheres finds it standing against them." |
| Echo kind label, Legacy | "Legacy · Spirit" | PC-1 | Tooltip `ui.echo.legacy`: "A mortal line an earlier god raised. Their descendants live in this world and are easier to reach for a kindred god." |
| Echo kind label, Relic | "Relic · Mind" | PC-1 | Tooltip `ui.echo.relic`: "Something an earlier god's chosen carried. It lies unclaimed in this world until someone takes it up." |
| Memory word | "Memory: still warm" / "fading" / "almost gone" | PC-1 | Tooltip `ui.memory`: "How strongly the world still remembers. Each new world remembers less; when a memory is gone, the echo is gone." |
| Hunger chips | "awake" / "stirs" / "asleep" | PC-1 | Tooltip `ui.hunger.awake`: "You may wake as this god." · `ui.hunger.stirs`: "This hunger is waking. Choose one of the two that stir." · `ui.hunger.asleep`: "Not yet. Each age wakes one more." |
| Hunger choice | "Two hungers stir. The old god's echoes favour one; you choose which wakes." · "Let Kindle wake" / "Let Reshape wake" | PC-4 | The favoured one carries the line "The old god's echoes favour Kindle." The game chose *which two* stir; the player chooses the one that wakes. On the click the chosen chip turns *awake* with the line "Kindle wakes.", the other returns to *asleep*, and the choice stays changeable until *Go on to the stirring* (PC-8) |
| Powers section | "Powers that may now rise among the omens" + "Because the last god drew on Spirit, more of Spirit's powers can rise for whoever comes next." | PC-4 | Tooltip `ui.powers_unsealed`: "Each age, the world opens a few more powers it may offer, leaning to the spheres the last god drew on." This is the line that says the game unsealed them |
| Step button | "Go on to the stirring"; disabled with "Choose which hunger wakes" | PC-4 | Law 25 |
| Chronicle, before you woke | per § Content › Words | PC-3 | A line whose slot (`{host}` / `{heir}` / `{site}`) is empty is not written: an echo that could not be placed is skipped with `echo.seed_skipped` and has no line (fail-soft row) |
| Heir's sheet | "Of the line of Maren Ashfold" | PC-6 | Same name as the step and the Chronicle |
| Harvest, no divine echo picked | "Your age leaves little the next world will remember." | PC-3 | Replaces the *leaves behind* line; the card echo, if any, still carries (it is listed in the repertoire, not here) |
| *What still stands*, no live echo | "Nothing of the old worlds still stands. This one begins clean." | PC-3 | The section stays, so the step's shape is the same every run |
| *Gods who may wake*, nothing stirs | Chips only, no choice prompt; the line reads "Every hunger is awake." (or, when stirring ids were dropped, "No hunger stirs this age.") | PC-3 | *Go on to the stirring* is enabled at once |
| *Powers that may now rise*, none unsealed | The section is hidden | PC-3 | True on the slice-1 → slice-3 boundary and after every card is unsealed (about run 14); a hidden section says nothing false |
| The account could not be saved (harvest) | Under the button: "This world's memory could not be kept on this device. The next world will wake as if for the first time." | PC-4 | Shown only when `saveAccount` returns `ok: false`; the player learns before waking |
| The account could not be read (Remembrance) | On the Stirring (the first step for an empty account, from slice 1), small line: "The memory of earlier worlds could not be read on this device. This world wakes as if for the first time." | PC-4 | Shown only when `account.loaded` has `source: 'unreadable'`; the raw record is kept (fail-soft row) |

### Playtest signal

A tester on their second run can say what the last god left behind and where it is, and names the hunger they woke.

### Event notifications

Chronicle "before you woke" lines (slice 2), in the existing *Before you woke* group (`ChroniclePanel.tsx:39`). No toast, no interrupt.

### Debug inspection (DebugPanel)

`window.__DEBUG.getAccountRecord()` (async; the loaded record), `window.__DEBUG.getSeededEchoes()` (slice 2; the summary with host, band, imprint), `window.__DEBUG.previewRunEnd()` (the record `concludeRun` would write now, without saving), and `window.__DEBUG.endAge()` (slice 1; starts the twilight now, so a browser test can reach the harvest — no such lever exists today: grep of `src/debug-bridge.d.ts` for twilight / harvest finds nothing). DebugPanel gains an *Account* readout on its world tab with the same fields.

### Visual presence (HexMapV2)

N/A — no new signifier. The monument is a sublocation (drawn as today's sublocations are, inside its host); a band change already shows through the shipped Dominion lens.

### UI Laws engaged

1 / 17 (every sphere word and echo kind gets a registry tooltip: the eleven `ui.*` ids quoted in § Player-facing text), 13 (no number on the step: memory and tilt are words), 21 (every echo name opens its Chronicle entry or the host's place page; every card name its Codex entry), 25 (the disabled step button says why), 26–27 (`CardFace` and the existing Remembrance beat frame; no new primitive), 30 (sphere tint through tokens), 33 (the step fits 1920×1080 with six echoes, twelve chips and two cards — six echo cards in a 3×2 grid at 75vh max), 37 (not engaged: no multi-step encounter), 42 (plain register).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `accountRecord.ts` / `accountStore.ts` | none (world creation, run end) | `App.tsx` phases, `HarvestScreen` | none (the record lives outside `GameState`) | `account.loaded`, `account.saved`, `account.unreadable` | `getAccountRecord`, DebugPanel *Account* |
| Harvest picks | twilight → harvest (`computeHarvest`) | `HarvestScreen` | `HarvestResult.divineEchoes` | `harvest.divine_echo_picked` | traces tab |
| New world from account | `initializeGameStateFromIdentity` | `App` → `GameView` | `echoDefinitions`, `echoStates`, `worldSoul.resonance`, `sealedCardIds` (slice 3) | `account.world_shaped` (seed, tilt, echo count) | `getAccountRecord` |
| `seedEchoes.ts` | world creation, after `recordSeededScores` | place page, mortal sheet, Chronicle | graph nodes/properties; `chronicleEntries` (before you woke) | `echo.seeded`, `echo.seed_skipped` | `getSeededEchoes` |
| Sealed sets | world creation; Remembrance | `TransformationBeat`, `WorldRemembersBeat`, offering modal | `sealedCardIds` | `account.hunger_woken`, `account.cards_unsealed` | `getAccountRecord` |

## Interface impact

The cycle-end, World-Soul and echo code is not on `Docs/canon/interface-map.md` (no row mentions cycle, echo, fundament or remembrance; `interface-map.generated.md:115` carries `twilight-harvest-preserves-defining-card`). This plan audits on touch and adds:

| Contract row | Producer → consumer | Disposition |
|---|---|---|
| `twilight-harvest-preserves-defining-card` | Cycle end → card repertoire | **preserve** — the card echo now crosses a new world through the account |
| `account-carries-echoes-to-the-next-world` | Cycle end (`concludeRun`) → world creation (`initializeGameStateFromIdentity`) | **add** — read site `gameInit.ts` echo load; write site `concludeRun` |
| `echo-lift-reads-dominion` | Dominion (`dominionOf`) → echo seeding | **add** — read only |
| `echo-seeding-writes-place-scores` | echo seeding → Dominion, neglect, rivals (every reader of place `sphereAffinity`) | **add** — written once at world creation, after the seed snapshot |
| `world-tilt-shapes-cosmology` | account fundament → world generation (cosmology profile, culture foundation draw) | **add** |
| `awake-hungers-gate-remembrance` | account → `filterHungers`, court step | **add** (slice 3) |
| `sealed-cards-gate-the-offering` | account (`GameState.sealedCardIds`) → `offerableCards` | **add** (slice 3) |
| Same-world next cycle | `transitionToNewCycle` → `useSimulation` | **retire** the production caller |

`scripts/interface-contracts.ts` and `Docs/canon/interface-map.md` gain the rows in the slice that ships each.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ACCOUNT_STORAGE_KEY` | `'threadbare.account.v1'` | The one storage key |
| `ACCOUNT_VERSION` | `1` | Record shape version; `migrateAccount` reads it |
| `ACCOUNT_SEED_PRIME` | `70001` | Derives the next world's seed from the last (Decided 10) |
| `MAX_SEEDED_ECHOES` | `6` | Live map echoes seeded into one world (THR-1773) |
| `FUNDAMENT_BLEND_PER_RUN` | `0.1` | How far each run tilts the World-Soul toward the god's earned spheres (THR-1773) |
| `FUNDAMENT_REVERT` | `0.05` | How far it relaxes back toward even each run (THR-1773) |
| `WORLD_TILT_GAIN` | `1` | How strongly the account's tilt bends the next world's cosmology profile (Decided 8); the census's lever beside `FUNDAMENT_BLEND_PER_RUN` |
| `MONUMENT_IMPRINT_STEP` | `0.5` | Lift per step in each echo sphere (Decided 1) |
| `MONUMENT_IMPRINT_MAX` | `6` | Most lift a monument may add (measured: opposed → Hostile within 6 in 8 of 9 cells) |
| `MONUMENT_KIN_BANDS` | `{ stillWarm: 'held', fading: 'touched' }` | Target for a kin god by memory (THR-1773) |
| `MONUMENT_OPPOSED_BAND` | `'hostile'` | Target for an opposed god at any memory |
| `MEMORY_WORD_THRESHOLDS` | `[0.3, 0.6, 0.9]` | still warm / fading / almost gone (0.9 = `ECHO_FADE_THRESHOLD`) |
| `LEGACY_SPHERE_LIFT` | `2` | Lift on the heir's echo-sphere scores, × strength |
| `ECHO_SEEDING_PRIME` | `70003` | The Legacy hydration stream |
| `RUN_ONE_AWAKE_HUNGERS` | `gather, witness, reclaim, sever` | One per court shape (THR-1773) |
| `STIRRING_HUNGER_COUNT` | `2` | Hungers offered to wake each run (THR-1773) |
| `ACCOUNT_CARD_UNLOCKS_PER_RUN` | `2` | Cards unsealed per run (THR-1773) |
| `ACCOUNT_UNSEAL_PRIMARY_WEIGHT` / `_SECONDARY_WEIGHT` | `3` / `2` | Unseal weights by the god's spheres (THR-1773) |
| `ACCOUNT_UNSEAL_PRIME` | `70007` | The unseal draw's stream |

## Tracing

```ts
// account.loaded — the record a world was created from
interface AccountLoadedTrace { category: 'account.loaded'; tick: 0; source: 'stored' | 'empty' | 'fresh_param' | 'sample_param' | 'unreadable'; cycleCount: number; liveEchoes: number; awakeHungers: number; sealedCards: number; }
// account.saved / account.unreadable — the run-end write, or a record that could not be read
interface AccountSavedTrace { category: 'account.saved'; tick: number; cycleCount: number; ok: boolean; error?: string; }
interface AccountUnreadableTrace { category: 'account.unreadable'; tick: 0; reason: 'parse' | 'version' | 'shape'; }
// harvest.divine_echo_picked — one per divine slot
interface HarvestDivineEchoPickedTrace { category: 'harvest.divine_echo_picked'; tick: number; slot: number; kind: 'monument' | 'legacy' | 'relic' | 'none'; nodeId?: string; reason: string; }
// account.world_shaped — a world built from an account
interface AccountWorldShapedTrace { category: 'account.world_shaped'; tick: 0; seed: number; tilt: Partial<Record<SphereName, number>>; echoesLoaded: number; }
// echo.seeded / echo.seed_skipped — one per live echo considered
interface EchoSeededTrace { category: 'echo.seeded'; tick: 0; echoId: string; kind: 'monument' | 'legacy' | 'relic'; hostId: string; relation?: 'kin' | 'opposed' | 'unrelated'; targetBand?: DominionBand | null; band?: DominionBand; imprint?: number; capped?: boolean; }
interface EchoSeedSkippedTrace { category: 'echo.seed_skipped'; tick: 0; echoId: string; reason: 'over_cap' | 'no_host' | 'no_heir' | 'no_site' | 'faded'; }
// account.hunger_woken / account.cards_unsealed
interface AccountHungerWokenTrace { category: 'account.hunger_woken'; tick: 0; hungerId: string; favoured: boolean; }
interface AccountCardsUnsealedTrace { category: 'account.cards_unsealed'; tick: number; cardIds: string[]; weights: number[]; }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Storage unavailable (private window, quota, blocked) | `loadAccount` returns `emptyAccount`; `saveAccount` traces `ok: false` and the harvest screen says so (§ Player-facing text); the next run is run 1 again. The game never blocks on storage |
| Stored record unparsable or unknown version | Kept under `…v1.unreadable`, treated as empty, `account.unreadable` traced |
| An echo's origin data is missing (no name, no spheres) | Skipped with `echo.seed_skipped`; the rest seed |
| No Foreign host / no settlement resident / no relic site | Skipped with the reason; no node is minted to force it |
| A monument hits `MONUMENT_IMPRINT_MAX` short of its target | It stands as it reads; `capped: true` on the trace |
| A stirring hunger id no longer exists | Dropped; if none remain, nothing stirs this run |
| Fewer than two awake hungers score in `filterHungers` | Topped up from the awake set in catalog order |
| A sealed or unsealed card id no longer exists | Ignored; the sealed set is recomputed from the catalog at every load |
| `account` absent at world creation (dev routes, tests, CLI) | Today's behaviour exactly |
| `seedEchoes` throws | Caught at the call site; the world starts with no echoes and one `echo.seed_skipped` per echo |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 723 | One optional field (`sealedCardIds`, slice 3); the account itself stays outside `GameState` |
| `src/types/trace.ts` | 127 | Nine trace types; additive |

Counted with `grep -rl "<module path>'" src scripts | wc -l` on the worktree.

## Deferrals

None filed. Resonance memories ride the record (`worldSoul.resonance`), but nothing writes them today (`captureMemory` has no caller); writing them belongs to [Twilight authorship vs emergence](https://linear.app/threadbare/issue/THR-1381), which already owns Twilight's authored beats.

## Three-pillar check

- [x] Engine pillar present (E1–E9, three slices)
- [x] Content pillar present (echo picks, words, chronicle lines)
- [x] UI pillar present (harvest button, the Remembrance step, in-world presence, debug)
- [x] Wiring section connects them

## Vision audit

- [x] **A response, not a sequel** (rulebook §11). Each run is a new map with the old god's marks in it; the same world never continues.
- [x] **The god never grows; the world and the choices do.** Nothing in the record touches sphere points, essence, power, reaches or tiers (THR-1773 §3).
- [x] **Prose carries mechanics.** Memory is a word, kin or against is a sentence, the tilt is "leans a little toward Life and Spirit"; no number on the step.
- [x] **Sphere-tinted cards are loved.** Every echo card and power card is sphere-tinted.
- [x] **The player is a god, not a protagonist** (`02-non-negotiables.md`). A Legacy's heir is an ordinary notable mortal the god may reach, never a carried avatar; the god's own vessel is new each run.
- Vision files (vault `Vision/`): `00-north-star.md` (a run is one god's age; the next is a response), `02-non-negotiables.md` #2–#3 (narrative first; prose, not numbers), `03-design-tensions.md` #4 (legibility vs mystery: the opposed monument is shown before the choice, so the player sees the stakes), `taste-profile.md` (prose-first UI).

## Rulebook impact

- [x] This plan changes rules of play. The slice-1 build PR updates `Docs/canon/rulebook.md`: §8 *The Clocks* (`:393-395`) and §11 *Winning and Losing* (`:603-605`) move from `[DESIGN — partial wiring]` to IMPL — *"When an age ends, a new world wakes. It is not the same map: it is a response to the one before, carrying the marks your god left — its monuments, its line, its relics — and leaning a little toward the spheres it drew on. Your next god starts as strong as your first. What grows is the world's memory and the choices open to you."* Slice 3 adds to §1 (*Becoming a god*): *"Your first age offers four hungers; each age wakes another, and you choose which of two stirs."* `rulebook-quick-reference.md` gains both in one sentence each.
- [x] No other rule changes: verbs, essence, the tier ladder and prices are untouched.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Twenty named constants; the run-1 hunger list is data |
| 2. Inspectability | PASS | Nine trace types; three debug accessors; every seeded echo traces its host, band and lift |
| 3. Determinism | PASS | Derived next seed; three seeded streams with fixed call counts; every placement a total ordering |
| 4. Fail-soft | PASS | Table above; storage failure degrades to run 1, never a crash |
| 5. Narrative over mechanical perfection | PASS with note | The lift is sized to the new god so the story ("it wakes as ground already yours" / "it will stand against you") is true for that god; a cap miss is accepted rather than forcing it |
| 6. Additive over destructive | PASS with note | All new fields optional; absent account = today. The same-world continuation's caller is removed, which is Christian's ruling, not a refactor |
| 7. Performance budget | PASS | Nothing per tick; `seedEchoes` reads ≤ 250 places × ≤ 12 steps once per world |

## Done when

**Slice 1 — [The world remembers](https://linear.app/threadbare/issue/THR-1813):**
- [ ] A test drives `concludeRun` on a seed-42 harvest: the record's `cycleCount` is 1, it holds the divine echoes `computeHarvest` picked (traced kinds), the card echo, a fundament blended per Decided 8 (`cycleCount` on it rose by 2 — one per `blendFundaments`), and a `nextWorldSeed` that equals a second call's.
- [ ] `migrateAccount` round-trips the record; an unknown version, a non-object and a truncated JSON each yield `emptyAccount` with `account.unreadable` traced (tests).
- [ ] `initializeGameStateFromIdentity(identity, seed)` with no account produces a world equal to today's (a hash test over graph node ids and sphere scores, seed 42); with an account it loads the echoes, and the card echo appears in `buildRepertoire`'s output with `source: 'echo'`.
- [ ] Browser (Playwright, 1920×1080): end a run through `?view=game&seeded&size=medium` with `await window.__DEBUG.endAge()` and `window.__DEBUG.tick(n)` through the twilight, press *Wake in a new world*, and land in Remembrance; finish it and `await window.__DEBUG.getAccountRecord()` reports `cycleCount: 1`; the map differs (a different seed); console clean; UI-Laws line for 1, 13, 17, 21, 25, 33, 37.
- [ ] The rulebook §8/§11 text and the quick reference carry the new lines; the glossary carries the entries from [UL-proposal: Run, Echo and the account record](https://linear.app/threadbare/issue/THR-1845).

**Slice 2 — [Echoes stand in the new world](https://linear.app/threadbare/issue/THR-1843):**
- [ ] On seeds 42 / 99 / 7 with `SAMPLE_ACCOUNT` and a kin god: the still-warm monument's host reads Held and the fading one's Touched at tick 0; with an opposed god (e.g. Entropy/Energy against a Life/Spirit monument) the host reads Hostile, or `capped: true` is traced. `getSeededEchoes()` matches the traces.
- [ ] After 300 untended ticks the kin monument's host has fallen at least one band; the opposed monument's host still reads Hostile until a Shift Dominion breaks it (a test).
- [ ] The heir is a notable with `echoLineageOf` and one `kin` tie; the relic has no bearer and reads Foreign.
- [ ] The **tilt census** (owed by the ticket): tick-0 Touched-or-better count for the new god with and without the account's tilt, seeds 42 / 99 / 7, written to `Docs/audits/` with the command.
- [ ] Browser: the host's place page lists the monument; the Chronicle's *Before you woke* group carries one line per seeded echo, each name linking (Law 21).

**Slice 3 — [Choices widen across runs](https://linear.app/threadbare/issue/THR-1844):**
- [ ] With an empty account, Remembrance offers only Gather, Witness, Reclaim and Sever, each with its default court; no sealed card is ever offered (a 2,000-tick headless run, seeds 42 / 99 / 7, against THR-1811's `offering.offered` traces).
- [ ] With `SAMPLE_ACCOUNT` (cycle 1): *The world remembers* shows first; it lists every live echo with its memory word, the twelve hunger chips and the two unsealed cards; choosing a hunger enables *Go on to the stirring* and that hunger is offered in Transformation.
- [ ] Browser (1920×1080): the step fits one viewport with six echoes; every echo and card name opens its Chronicle or Codex entry; no number on screen; console clean; UI-Laws line for 1, 13, 17, 21, 25, 26–27, 30, 33.

**Every slice:** `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy`, a 30-tick CLI smoke.

## Kill criteria

- **The head start becomes a lead.** If the tilt census (slice 2) shows the tilt adds more than 5 Touched-or-better places at tick 0 for a kin god, the tilt is too strong; `FUNDAMENT_BLEND_PER_RUN` is the lever.
- **Monuments read as decoration.** If a run-2 cold playtester never notices a monument or reads the opposed one as an ordinary place, the words failed; the step's *against* line and the chronicle line are rewritten. The mechanics stand.
- **Run 1 feels thin.** If run-1 cold playtesters say the god choice is too narrow with four hungers, that is the veto line *"run 1 should offer all 12 hungers"* coming true; surface it, do not quietly widen.

## Coordination block

**Suggested model:** opus — slice 1 crosses `App`, `useSimulation`, world creation and the harvest; slice 2 writes place scores the Dominion read depends on.

**Parallel-safe with:** [Master work reaches masters' boards](https://linear.app/threadbare/issue/THR-1757) (content files only) and [Two in five mortals belong to no people](https://linear.app/threadbare/issue/THR-1793) for slice 1 (`worldSeed.ts` culture pass vs `gameInit.ts` and `cycleEnd.ts`).

**Mutex with:**
- [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811) — slice 3 edits `godProgression.ts`, which that ticket creates; slice 3 is blocked by it.
- [Two in five mortals belong to no people](https://linear.app/threadbare/issue/THR-1793) — slice 2 only: both write `gameInit.ts`'s world-creation tail and read settlement residents.

**Files to touch:** (slice 1; slices 2 and 3 list theirs in § Engine pillar)
- Create: `src/types/account.ts`, `src/engine/accountRecord.ts`, `src/engine/accountStore.ts`, `src/data/account-content.ts`, tests beside each.
- Edit: `src/engine/cycleEnd.ts` (`computeHarvest`), `src/engine/gameInit.ts` (`initializeGameStateFromIdentity` account argument), `src/components/Game/hooks/useSimulation.ts`, `src/components/Game/HarvestScreen.tsx`, `src/components/Game/GameView.tsx` (prop), `src/App.tsx` (phase carries the seed and account), `src/types/trace.ts`, the tooltip registry, `src/debug-bridge.ts` + `.d.ts`, DebugPanel world tab, `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`.

## Notes for the executor

- **Never read storage from the engine.** Only `accountStore.ts` touches `localStorage`; the CLI and tests pass an account object or none.
- **Order matters in `gameInit.ts`.** `seedEchoes` goes after `recordSeededScores` and before `computeFactionSphereAggregates`. Before the snapshot, a kin monument would never fade; after the aggregates, factions would not see it.
- **Do not route echoes through `seedWorld`'s `injections`.** Those hooks apply the first echo to every place and every mortal (`worldSeed.ts:906,1803,2001`).
- **The dev routes stay deterministic.** `?view=game&seeded` passes no account; only `?account=sample` loads the fixture.
- **The cosmic candidates' sphere change** (cosmology top two → the god's bought pair) alters which spheres the harvest screen lists; the harvest tests that pin those spheres update in the same PR.

## Intent-judge verdict

**Round 1 — Revise** (opus, cold, ~77 s). Dimensions 1–11 PASS; the judge confirmed the three departures from the ticket's wording (monument lift sized to the new god, the hunger choice in Remembrance, no global injection hooks) as *how*, not meaning. Dimension 12 VIOLATION: no `### Player-facing text` subsection; five tooltips named but not quoted; chip states, the tilt line, same-words across surfaces (PC-6) and the automatic-step lines (PC-4) missing. All applied: § Player-facing text added with eleven quoted tooltips and one echo-name formatter.

**Round 2 — Revise** (~120 s). Every dimension PASS except a dimension-12 GAP: empty-state words (PC-3) for the harvest line with no divine echo, *Gods who may wake* when nothing stirs, *Powers that may now rise* when none unsealed, and (advised, PC-4) a line when the account cannot be saved or read. All applied as six rows.

**Round 3 — Allow** (~73 s). Every dimension PASS except one dimension-3 GAP (under the threshold): the save-failure line could never render, because the save ran after the button that unmounts the world. Fixed in E6: the account is concluded and saved when the harvest screen opens. Two advisories applied: the unreadable-account line names the Stirring (the first step for an empty account), and the hunger choice states its reply (the chip turns *awake*).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14 (three sonnet auditors, independent, run against the round-2 draft)*

### NFP audit

PASS-with-notes. Tunability PASS-with-note: the tilt's scale factor was a bare expression — **fixed** as `WORLD_TILT_GAIN` (now twenty constants); the stirring rule is a total ordering, not a number. Inspectability PASS (nine traces, three accessors, DebugPanel). Determinism PASS (derived seed, fixed call counts, total orderings). Fail-soft PASS. Narrative PASS (the lift makes the story line true for the god who wakes). Additive PASS-with-note (removing `transitionToNewCycle`'s caller is Christian's ruling; the function keeps its tests). Performance PASS (nothing per tick).

### Three-pillar audit

PASS-with-notes. Engine, Content and UI present and substantive; no missing required sections; Wiring connects all three. Substrate inventory present; activates the dormant echo, World-Soul and cycle-transition code rather than rebuilding it; the account record is genuinely new (no persistence subsystem exists). Note on Blast Radius: `gameInit.ts` (60 importers) and `cycleEnd.ts` (3) are edited but sit under the 100-importer bar, so they are not listed.

### Vision audit

PASS-with-notes. No contradictions. North star (a fresh map, the god never grows), non-negotiables (prose not numbers, graph-only, additive), tension #4 (the opposed monument shown before the choice), taste profile (words only, sphere tint) confirmed; the core loop is untouched. Note: the god-not-protagonist premise was not cited — **added** to § Vision audit.
