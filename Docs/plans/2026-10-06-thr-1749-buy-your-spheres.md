> **title:** `Buy your spheres — point-buy across the eight Creation spheres at Remembrance replaces the fixed primary/secondary pair as the god's identity vector — THR-1749`
> **linear_issue:** THR-1749
> **author:** `Claude Code (design lane, unattended run 2026-10-06b)`
> **created:** 2026-10-06
> **three_pillars:** Engine `done — one additive ascendant field, one pure module, the two private income splits replaced by one shared split; no new node, edge or phase` · Content `done — budget/cap/preset constants, eight buy-screen lines, three hunger alignments brought into canon` · UI `done — one new sub-step inside the existing Remembrance Transformation beat; reveal prose reads the bought vector`

# Buy your spheres — THR-1749

*Christian ruled that a god's identity is a set of sphere points bought at the start of the run. Today the god gets exactly two spheres, handed over by the hunger it picks. This plan adds the buy, keeps every existing reader of "primary / secondary" working off the two largest buys, and makes income follow the whole vector.*

## Why this is load-bearing

Christian's ruling 3 on [THR-1745](https://linear.app/threadbare/issue/THR-1745) (human gate satisfied via chat review 2026-10-05), in his words:

> *you buy sphere points in the beginning of the game, and you score based on your affinity to all spheres summed up and factored by your sphere score.*

The ruling comment records the consequence: *"This replaces the fixed primary/secondary pair as the god's identity vector."*

The Dominion read ([THR-1748](https://linear.app/threadbare/issue/THR-1748)) multiplies by the god's affinity in **every** sphere, and that vector does not exist today. The god holds a `{ primary, secondary }` pair (`src/types/influence.ts:180-183`) copied from the hunger it picks. Until this ships, Dominion can only fall back to a two-sphere approximation (UL `Cosmology.md` § Dominion: *"Until the point-buy ticket lands, it falls back to today's `sphereAlignment` primary/secondary pair"*). The buy is also the first time a player shapes their god numerically rather than by flavour pick, which is the character-creation moment THR-1644's direction asks for.

**Settled inputs.** Ruling 3 (above) and the agent decisions recorded on the same THR-1745 comment, made by an attended session under the 2026-09-11 delegation:

- Point-buy covers the eight Creation spheres only; the four Foundation spheres stay ruin-discovered (rulebook §5: *"elder magic," discovered through ruins, not chosen at chargen*).
- One pole per opposed pair: a god cannot buy both Life and Entropy.
- "Primary / secondary" survive as prose for the two highest buys; the 35/25/4 income split is re-keyed to the vector.
- The hunger catalog's twelve cells become presets that pre-fill the buy (THR-1749 description).

None of these inputs is a design-lane decision, so no lane veto window gates *starting* this plan. The calls this plan adds are listed under § Decided by delegation and carry their own window at handoff.

## Substrate inventory

| System | File | What this plan does with it |
|---|---|---|
| Sphere taxonomy | `src/types/index.ts:2-18` | reads `CREATION_SPHERE_NAMES`, `FOUNDATION_SPHERE_NAMES`, `SPHERE_NAMES` |
| Opposites | `src/engine/cosmology.ts:62-77` (`SPHERE_OPPOSITES`) | reads, to pair the buy rows and validate one pole per pair |
| Ascendant properties | `src/types/influence.ts:188-266` | adds optional `spherePoints` beside `sphereAlignment` |
| Ascendant identity | `src/types/remembrance.ts:62` (`AscendantIdentity`) | adds optional `spherePoints` |
| Ascendant creation | `src/engine/ascendant.ts:131` (`createAscendant`) | writes `spherePoints` and the derived `sphereAlignment` |
| Identity → game | `src/engine/gameInit.ts:468-507` | passes `spherePoints` through `compatArchetype` |
| Income ledger | `src/engine/influence.ts:83, 163` | private `distributeByAlignment` replaced by the shared split |
| Income readout | `src/engine/essenceIncome.ts:28, 93` | same replacement (the essence bar's income words) |
| Hunger catalog | `src/data/hunger-catalog.ts` | three `sphereAlignment` values brought into canon; presets derived |
| Remembrance UI | `src/components/Remembrance/TransformationBeat.tsx`, `RevealBeat.tsx`, `RemembranceFlow.tsx` | new `spheres` sub-step; reveal prose reads the bought vector |
| Showcase identity | `src/engine/gameInit.ts:863-887` (`DEV_ASCENDANT_IDENTITY`) | gains an explicit preset vector |

## Measured substrate (Grep/Read over `origin/main` @ `5e0bcb60`, 2026-10-06)

| Claim | Evidence |
|---|---|
| The god's sphere identity is one pair, and the pair has one live writer | `sphereAlignment: SphereAlignment` (`types/influence.ts:191`), `{ primary; secondary }` (`:180-183`); written at `engine/ascendant.ts:131` in `createAscendant` from `config.archetype.sphereAlignment` (the other writer, `createAscendantFromIdentity` at `:208`, has no non-test caller) |
| Remembrance picks no spheres directly; the hunger hands them over | `RemembranceFlow.tsx:102` sets `sphereAlignment: hunger.sphereAlignment`; `remembrance.ts` only reads the pair in `deriveCosmologyFromIdentity` (`:369`) |
| The income split is two private copies of the same literals | `function distributeByAlignment` at `engine/influence.ts:83` and `engine/essenceIncome.ts:28`, neither exported; `total * 0.35` / `0.25` / `0.40`, the rest over `SPHERE_NAMES.filter(...)` = **10 spheres at 4%, Foundation included**. The comment at `influence.ts:81` ("remaining 6 … ≈6.67%") is stale |
| Thread upkeep is charged from the primary sphere only | `essenceIncome.ts:103` (`net[alignment.primary] = gross[primary] - totalMaintenance`); live path `influence.ts:240-256` |
| `influence.ts` throws without an alignment; the readout returns empty | `influence.ts:119` throws; `essenceIncome.ts:57-58` returns an empty pool |
| The beat identity bias reads the pair | `computeIdentityBias`, `engine/ascendantBeat.ts:163-179`; `BEAT_SPHERE_BIAS_PRIMARY = 1.5`, `_SECONDARY = 1.25`, `_NONE = 1` (`data/ascendant-beat-content.ts:87-91`) |
| ~95 code sites read the pair directly | `(sphereAlignment|alignment)?.(primary|secondary)` over non-test `src/`: 95 hits in 32 files (a lower bound: aliased reads such as `ascendantBeat.ts:174` are missed); `getAscendantPrimarySphere` (`ascendantExpression.ts:81-88`) has 7 non-test call sites in 4 files |
| **Three of the twelve hungers break the settled rules** | `hunger-catalog.ts`: `haunt` = spirit / **darkness** (`:316`), `illuminate` = **light / order** (`:345`) use Foundation spheres, which rulebook §5 says are "not chosen at chargen"; `reshape` = **force / mind** (`:113`), and `SPHERE_OPPOSITES` pairs force↔mind (`cosmology.ts:62-77`) |
| Two of the four Foundation spheres reach Remembrance at all | no hunger carries chaos; order and light only via `illuminate`, darkness only via `haunt` |
| Four Foundation-signed card types are identity-reachable only through those two hungers | `SPHERE_SIGNATURES` (`data/nudge-card-library.ts:299-312`): chaos → gambit, stumble; order → favor, insurance; light → whisper; darkness → veil, undertow. Access is primary = full, secondary = discounted (`nudgeCardRepertoire.ts:111-117, 137-143`). Insurance is also universal core, so the loss is the order-signed member, not the type |
| The name `sphereAffinities` is taken twice over | as `SphereName[]` on ambitions, echoes, dreams, resources and mandates (`types/ambition.ts:193`, `types/echo.ts:59`, `types/dream.ts:64`, `types/resource.ts:43`, `data/mandate-loader.ts:40`), and `sphereAffinity` is the `{ scores, progress }` sphere-score object on actors, places and factions (`types/sphereAffinity.ts:19-24`) |
| There is no save format to migrate | no `schemaVersion` / `migrateSave` / `loadGame` for game state; absent fields are defaulted at read time (pattern at `ascendantBeat.ts:589`, `doomClock.ts:686`) |
| Showcase and Meet-The-First share one identity | `App.tsx:63-66` returns `DEV_ASCENDANT_IDENTITY` (`gameInit.ts:863-887`, mind / spirit) for both `?seeded` and `?firstunmet` |
| A bare `?view=game` draws a random pair from all twelve spheres | `generateArchetypes`, `engine/ascendant.ts:56` |
| No debug accessor exposes the god's sphere identity | `debug-bridge.d.ts` has `listSignatures().primarySphere` (`:377-385`) only |

## Decided by delegation (design lane, 2026-10-06 — veto in chat)

1. **Five points, at most three in one sphere.** Every legal buy names at least two spheres (3 + 2), so "primary and secondary" always exist. The shapes a player can make are 3/2, 3/1/1, 2/2/1 and 2/1/1/1: a specialist, a specialist with two leanings, a pair of equals, or a generalist. Small numbers keep every level nameable in words (Law 13), which ten or twenty points would not.
2. **A hunger's preset is three points in its first sphere and two in its second.** With the income split below, a preset god earns almost exactly what it earns today (first sphere 35.2% against 35%, second 24.8% against 25%, every other sphere 4% as today). The showcase run does not change economically.
3. **Every sphere keeps a 4% floor of income, Foundation included.** The rest is shared in proportion to the points. This is the ticket's "never zero" trickle, and it matches today's 4% for an unchosen sphere, so the floor is not a new number, only a newly named one.
4. **Three hungers move into canon.** Rulebook §5 already says Foundation spheres are not chosen at chargen, and the one-pole rule forbids force with mind. So: **Haunt** becomes spirit / entropy (the restless dead: the spirit that will not let go, the decay it clings to); **Illuminate** becomes mind / energy (truth seen, and the light that burns away the hiding places); **Reshape** becomes force / matter (force's ally per `SPHERE_ALLIES`: the will to remake the world, and the stuff it remakes). Their prose, courts and reach biases are untouched; only the two sphere words change. Rejected: keeping a free Foundation "lean" on two hungers, which contradicts the rulebook line, and dropping the one-pole rule, which would let a player buy two poles whose Dominion terms cancel (THR-1745's formula subtracts the opposite pole's score).
5. **The buy is four opposed-pair rows, not eight sliders.** Each row is one track with a pole at each end (Force ←→ Mind). Points go to one side or the other, so the one-pole rule is the shape of the control, not a refusal message. This also teaches the opposition the Dominion loop is built on, at the moment the player first meets the spheres.
6. **Ties between the two largest buys break in canonical sphere order**: the index in `SPHERE_NAMES`, which lists Foundation first and then Creation in `CREATION_SPHERE_NAMES` order (force, matter, energy, life, mind, spirit, time, entropy). A bought vector holds only Creation keys, so in practice this is the Creation order. The fallback path can carry a Foundation key, and the same rule stays deterministic there. This is deterministic and invisible in a 3/2 buy. In a 2/2/1 buy the reveal names both twos, so the order only decides which one thread upkeep is charged from (today's primary rule, unchanged).
7. **The field is named `spherePoints`, not `sphereAffinities`.** That name already means a `SphereName[]` on five other node kinds, and `sphereAffinity` means the grown sphere score. A third meaning of one word on the ascendant is the collision UL exists to prevent. "Sphere points" is Christian's own phrase.

## Engine pillar

### Systems design

**E1 — The vector.** `AscendantProperties.spherePoints?: Partial<Record<SphereName, number>>` (`src/types/influence.ts`, additive, optional) and `AscendantIdentity.spherePoints?` (`src/types/remembrance.ts`). The doc comment names it the god's bought sphere affinities (UL § Dominion), fixed for the run. Keyed by `SphereName` so a legacy fallback can carry a Foundation sphere. The buy itself only ever writes Creation spheres.

**E2 — One pure module, `src/engine/spherePoints.ts`.** No graph writes, no PRNG.

- `presetFromAlignment(a: SphereAlignment): Partial<Record<SphereName, number>>` returns `{ [a.primary]: HUNGER_PRESET_PRIMARY_POINTS, [a.secondary]: HUNGER_PRESET_SECONDARY_POINTS }`.
- `validateSpherePoints(p): { ok: true } | { ok: false; reason: SpherePointsInvalidReason }`. It checks that every key is a Creation sphere, every value is a whole number from 0 to `SPHERE_POINT_CAP`, the sum equals `SPHERE_POINT_BUDGET`, and no pair has points on both poles. Reasons: `'foundation_sphere' | 'over_cap' | 'not_whole' | 'wrong_total' | 'both_poles'`.
- `getSpherePoints(props): Partial<Record<SphereName, number>>`. **The one read every consumer uses.** It returns the stored `spherePoints` when present and non-empty. Otherwise it returns `presetFromAlignment(props.sphereAlignment)`, the fallback for the bare `?view=game` archetype, hand-built fixtures and states created before this ships. With neither present it returns `{}`.
- `deriveAlignmentFromPoints(p): SphereAlignment | null`. The two largest entries, ties broken by `SPHERE_NAMES` order (Creation spheres come after Foundation in that array, but a bought vector never holds Foundation keys; the fallback path can, and canonical order is still deterministic). It returns `null` for fewer than two non-zero entries.
- `distributeBySpherePoints(total: number, p): Record<SphereName, number>`. Each of the twelve spheres gets `total × UNBOUGHT_SPHERE_INCOME_SHARE`, and the remainder `total × (1 − 12 × UNBOUGHT_SPHERE_INCOME_SHARE)` is shared in proportion to `p[s] / Σp`. With `Σp = 0` the remainder is shared equally across all twelve (fail-soft: income is never lost). The sum always equals `total`; a test pins it.

**E3 — Creation writes both fields.** `createAscendant` (`engine/ascendant.ts:131`) reads `config.archetype.spherePoints`. If it passes `validateSpherePoints`, it writes `spherePoints` and sets `sphereAlignment = deriveAlignmentFromPoints(points)`. If it is missing or invalid, it writes `spherePoints = presetFromAlignment(archetype.sphereAlignment)`, keeps the archetype's pair, and emits `sphere_points.fallback` with the reason. **`sphereAlignment` stays on the node as a derived field.** That keeps all ~95 readers of the pair (mandates, repertoire access, beat bias, maintenance, prose, wheel, `deriveCosmologyFromIdentity`) working unchanged: they now read the two largest buys, which is ruling 3's "primary / secondary survive as prose". `gameInit.ts:489` adds `compatArchetype.spherePoints = identity.spherePoints`; `App.tsx:196`'s parallel compat archetype adds the same line.

**E4 — Income follows the vector.** Delete both private `distributeByAlignment` copies. `computeEssenceGeneration` (`influence.ts:163`) and `computeEssenceIncome` (`essenceIncome.ts:93`) call `distributeBySpherePoints(total, getSpherePoints(props))`. Maintenance stays charged from `sphereAlignment.primary` (`essenceIncome.ts:103`, `influence.ts:240-256`), now the largest buy. Typed source income and control-effect income are untouched (they are added per sphere after the split). The `influence.ts:119` throw stays as it is; `getSpherePoints` cannot run without the props that line already requires. The stale `:81` comment goes with the function.

**E5 — The showcase keeps its god.** `DEV_ASCENDANT_IDENTITY` (`gameInit.ts:863`) gains `spherePoints: { mind: 3, spirit: 2 }`, the Witness preset, identical to its current pair. `generateArchetypes` (bare `?view=game`) is unchanged; its random pair reaches the node through the E3 fallback.

**E6 — Hunger alignments.** `hunger-catalog.ts`: `haunt` → `{ primary: 'spirit', secondary: 'entropy' }`, `illuminate` → `{ primary: 'mind', secondary: 'energy' }`, `reshape` → `{ primary: 'force', secondary: 'matter' }`, with their section-divider comments updated to match. A catalog test asserts every hunger's pair passes `validateSpherePoints(presetFromAlignment(pair))`, so a future hunger cannot reintroduce a Foundation sphere or an opposed pair.

### Graph nodes / edges

No new node type, edge type or edge. One additive optional property on the existing ascendant node (`spherePoints`); `sphereAlignment` keeps its type and becomes derived. The god's grown sphere score (`sphereAffinity.scores`) is not touched; THR-1748 owns how the Dominion read combines the two.

### Tick phases

None added or reordered. `phaseEssence` (`orchestrator.ts:2620` → `computeEssenceGeneration`) reads the vector through E4. Creation happens once at game init.

### Resolution logic

N/A — no roll changes. Resolution's sphere factor is THR-1748's.

### PRNG callouts

None. The buy is a player choice, presets are derived, and the split is arithmetic. `generateArchetypes`' existing seeded draw is unchanged.

## Content pillar

### Encounter templates

N/A — no encounter reads the vector directly; encounters keep reading the derived pair.

### Prose tables

**`SPHERE_BUY_LINES: Record<CreationSphereName, string>`**, new in `src/data/remembrance-content.ts` (or beside the Remembrance copy the executor finds; one table). One plain-register line per sphere, shown under each pole on the buy rows, ≤ 60 characters, no numbers (Laws 13, 18). Draft, for the executor to keep or tighten:

| Sphere | Line |
|---|---|
| force | Strength, struggle, the push that moves the world |
| matter | Stone and craft, the things that last |
| energy | Fire, storm and swiftness |
| life | Growth, healing and the hunger to live |
| mind | Thought, knowing and the will to command |
| spirit | Faith, dreams and what lingers after death |
| time | Memory, patience and what is fated |
| entropy | Decay, endings and the bargains made with them |

**Buy-screen words** (`REMEMBRANCE_SPHERE_COPY`, same file):

- prompt: *"What are you made of? Pour yourself into the spheres."* (no resource noun on purpose: "power" is UL's family name for spells and bestowals, Traits.md § Power, and the grown sphere score; the step names no new resource, PC-1)
- per-pole level words, 1 / 2 / 3: **a trace of / a current of / a flood of** — read as "a current of Mind" (`SPHERE_LEVEL_WORDS`)
- what is left, banded off the remaining points (5 / 4–3 / 2 / 1 / 0): **all of you / most of you / some / a little / nothing**, read as "Left to pour: some"
- disabled Continue reason: *"Pour all of yourself before you go on."*
- a full-row reason, on a position you cannot afford: *"Not enough of you left. Take some back from another sphere."*
- the pair caption under each row: *"{Left} and {Right} pull against each other. You can hold only one."*
- the preset link: *"As my hunger shaped me"* (resets to the hunger's preset)

**Reveal prose.** `TransformationBeat.tsx:382` and `RevealBeat.tsx:101` keep their sentence (*"{primary} and {secondary} pour through you."*), but the two words come from `deriveAlignmentFromPoints(points)`, not `hunger.sphereAlignment`. A buy with three or four spheres adds one clause after it: *"{third}[ and {fourth}] stir beneath."* (`SPHERE_REVEAL_STIR_CLAUSE`). Sphere names render through the existing sphere display vocabulary, never the raw key (Law 14).

### Attachment content

N/A — no attachment reads sphere identity.

### Data tables

The constants below, plus `HUNGER_CATALOG`'s three pair edits (E6). Presets are derived, not authored, so the twelve "preset" cells cannot drift from the catalog.

## UI pillar

**Browser-verify tool:** Playwright (DOM). The Remembrance flow is plain React, no WebGL.

**UI Laws engaged:** 1 (every sphere carries image, tooltip, link: `SphereIcon` + `resolveTooltip('sphere.<id>')`), 9 (spheres → `SphereIcon` only), 10 / 15 (the track is a control, not a magnitude glyph row; its state reads in words, and no pip row is used), 11 (each row's `aria-label` states its reading, e.g. "Force and Mind: a current of Mind"), 13 (no numerals: level and what is left to pour are words), 14 (no raw keys), 17 / 18 (sphere tooltips from the one registry), 21 (sphere names here are concepts, not entities; the tooltip is the link tier, as on every Remembrance surface today), 23 (Escape on the step = "Choose again", the THR-1716 behaviour), 25 (positions you cannot afford render dimmed with the reason; Continue is disabled with its reason), 30 / 31 (sphere tint via `--sphere-color` tokens; a category tint, not polarity), 32 (dark), 33 (fits 1920×1080; nothing scrolls), 37 (the step wears the Transformation beat's existing chrome and fade timing).

### Player-facing display

**New sub-step `'spheres'`** in `TransformationBeat` (`TransformationStep = 'hunger' | 'court' | 'spheres' | 'sphere-reveal'`). Court's Continue now goes to `'spheres'`, not straight to the reveal. The step opens pre-filled with the chosen hunger's preset, so a player who only clicks Continue gets today's god.

Layout, centred column on the `#0a0a0f` ground, same fade-in as the court step:

1. The prompt line (top, the court prompt's style).
2. **Four pair rows**, in `SPHERE_OPPOSITES` order for Creation (Force ↔ Mind, Matter ↔ Time, Energy ↔ Spirit, Life ↔ Entropy). Each row: left pole (`SphereIcon`, name, buy line) · a **seven-position track** (three positions toward each pole, one in the middle for neither) · right pole. The occupied side glows in its sphere colour (Christian loves sphere-tinted choice cards; never strip). Under the track, the row's reading in words ("a current of Mind", or "neither" in the middle) and the pair caption.
3. "Left to pour: {band}".
4. **Continue** (disabled with its reason until nothing is left) · **"As my hunger shaped me"** (reset to preset; hidden when the buy already equals the preset) · the existing `ChooseAgainButton` (back to the hunger row).

Clicking a position sets that row to it. A position that would overspend renders dimmed and carries the "Not enough of you left" reason; it never silently clamps. Keyboard: each track is a `role="slider"` with arrow keys, `aria-valuetext` = the row's reading in words.

Continue goes to the existing `'sphere-reveal'` (orb in the **largest buy's** colour, reveal prose per § Prose tables), then `onSelect(hunger, court, points)`.

`RemembranceFlow.handleTransformationSelect` gains the `points` argument, stores it, passes the derived pair to `RevealBeat`, and writes `spherePoints: points` and `sphereAlignment: deriveAlignmentFromPoints(points) ?? hunger.sphereAlignment` into the `AscendantIdentity` at `:102`.

### Player-facing text

All copy is in § Prose tables. Nothing new appears on the game screen; the essence bar's income words already read per-sphere net income, and E4 makes them follow the vector.

**Complaint classes touched** (`Docs/ops/player-complaint-classes.md`):

- **PC-7, no direction / setup runs long.** This step adds one more setup screen. It stays short in three ways. It opens already filled in from the hunger the player just chose, so one click on Continue keeps today's god. The prompt says what to do in one line. The only blocker, "Pour all of yourself before you go on", names the exact thing to do.
- **PC-1, unexplained resources and terms.** The step introduces no resource noun: the player pours *themselves*, in words ("a current of Mind"). Every sphere name carries its existing `sphere.*` tooltip and its one-line meaning beside it, and every row says what it reads. On the game screen nothing new is named. The 4% floor is not shown as a number; it only means a sphere you left empty still trickles in the essence bar.

### Playtest signal

The next cold playtest round (THR-1610 lane) sees the step on its first run. Signal: a tester can say in their own words which spheres their god holds and why. Also, no tester reports being unable to tell what the **four opposed tracks on the spheres step** do. Kill signal: see § Kill criteria.

### Event notifications

None. Creation emits a trace, not a player event.

### Debug inspection (DebugPanel)

New debug-bridge accessor `getAscendantSpheres(): Promise<{ spherePoints: Partial<Record<SphereName, number>>; derived: SphereAlignment | null; source: 'bought' | 'fallback' } | null>` in `src/debug-bridge.ts` + `debug-bridge.d.ts`. It is the `__DEBUG` assertion for the UI evidence and for Done-when 1. No DebugPanel tab change.

### Visual presence (HexMapV2)

N/A — the map shows Dominion, not the buy; that is [THR-1750](https://linear.app/threadbare/issue/THR-1750).

## Wiring

| Module | Orchestrator phase | UI component | GameState flow | Traces | Debug visibility | Prose pipeline | Player controls |
|---|---|---|---|---|---|---|---|
| `engine/spherePoints.ts` | read in `phaseEssence` via E4 | `TransformationBeat`, `RemembranceFlow`, `RevealBeat` (derive + validate) | ascendant node `properties.spherePoints`; `state.ascendantIdentity.spherePoints` | `sphere_points.fallback` at creation | `getAscendantSpheres` | reveal prose reads derived pair | the buy rows |
| `createAscendant` | game init | — | writes both fields | `sphere_points.fallback` | same | — | — |
| `influence.ts` / `essenceIncome.ts` | `phaseEssence` / view readout | essence bar income words (`GameView.tsx:1892`) | unchanged pool shape | existing essence traces | existing | — | — |
| `hunger-catalog.ts` | — | Transformation hunger row (unchanged look) | three pairs change | — | — | hunger prose untouched | — |

New-module check against `Docs/plans/wiring-checklist.md`: one pure module, read by two existing call sites and the UI; no orphan.

## Interface impact

| Contract | Change | Production read site |
|---|---|---|
| Remembrance → game init (`AscendantIdentity`) | **extend** — optional `spherePoints` | `gameInit.ts` `initializeGameStateFromIdentity` → `createAscendant` |
| Ascendant node → essence economy | **extend** — income reads `spherePoints` through `getSpherePoints` | `influence.ts` `computeEssenceGeneration`, `essenceIncome.ts` `computeEssenceIncome` |
| Ascendant node → every pair reader | **preserve** — `sphereAlignment` keeps its shape; its writer now derives it | the ~95 existing reads |
| Ascendant node → Dominion read | **add (future)** — THR-1748 reads `getSpherePoints`; its plan owns that row | THR-1748 |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain the economy row (the executor updates both, per CLAUDE.md DoD).

## Constants table

| Constant | Default | File | Purpose |
|---|---|---|---|
| `SPHERE_POINT_BUDGET` | 5 | `src/data/sphere-points-content.ts` (new) | points every god buys at Remembrance |
| `SPHERE_POINT_CAP` | 3 | same | most points in one sphere; forces at least two spheres |
| `HUNGER_PRESET_PRIMARY_POINTS` | 3 | same | a hunger's first sphere in its preset |
| `HUNGER_PRESET_SECONDARY_POINTS` | 2 | same | a hunger's second sphere in its preset |
| `UNBOUGHT_SPHERE_INCOME_SHARE` | 0.04 | same | income share every sphere keeps regardless of points (the "never zero" floor); 12 × share must stay < 1, guarded by a test |
| `REMEMBRANCE_SPHERE_BUY_ENABLED` | `true` | `src/data/sphere-points-content.ts` | shows the spheres sub-step; `false` passes the hunger preset straight through (the § Kill criteria lever) |
| `SPHERE_LEVEL_WORDS` | `['', 'a trace of', 'a current of', 'a flood of']` | `src/data/remembrance-content.ts` | words for 1–3 points (Law 13) |
| `SPHERE_LEFT_TO_POUR_WORDS` | 5 → "all of you", 4–3 → "most of you", 2 → "some", 1 → "a little", 0 → "nothing" | same | band for the points not yet poured |

Budget, cap and preset constants get CMS registry rows (`src/components/CMS/registry.ts`). Invariant tests: preset primary + secondary = budget; preset primary ≤ cap; 12 × floor < 1.

**Measured effect of the split (arithmetic, `total` = 1):**

| Buy | Largest | Second | Third/fourth | Every other sphere |
|---|---|---|---|---|
| today (pair) | 0.35 | 0.25 | — | 0.04 |
| 3/2 (any preset) | 0.352 | 0.248 | — | 0.04 |
| 3/1/1 | 0.352 | 0.144 | 0.144 | 0.04 |
| 2/2/1 | 0.248 | 0.248 | 0.144 | 0.04 |
| 2/1/1/1 | 0.248 | 0.144 | 0.144 ×2 | 0.04 |

Thread upkeep comes from the largest buy, so a generalist's upkeep pool earns 0.248 of income instead of 0.352. That is the specialist/generalist trade-off: wider identity, thinner upkeep pool. Under THR-1747's retuned upkeep (0.1 / 0.2 / 0.35 / 0.5) and today's gross of base 1.0 + seat 1.0 + 0.1 for the thread itself (`influence-content.ts:15,18,33`), a generalist's largest sphere earns 2.1 × 0.248 ≈ 0.52 a tick, which just keeps one Aspect-tier thread (0.5); a specialist earns 2.1 × 0.352 ≈ 0.74. The trade-off bites (a generalist has almost no slack), but does not bankrupt.

## Tracing

```ts
// Emitted once, by createAscendant, only when the archetype's spherePoints are
// missing or fail validation and the preset fallback is used.
interface SpherePointsFallbackTrace {
  category: 'sphere_points.fallback';
  tick: number;
  ascendantId: string;
  reason: 'missing' | SpherePointsInvalidReason;
  fallbackFrom: SphereAlignment;              // the pair the preset came from
  written: Partial<Record<SphereName, number>>;
  summary: string;
}
```

`sphere_points.fallback` is added to the trace-category union. The bought vector itself is inspectable on the node and through `getAscendantSpheres`; it is not traced per tick.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Identity has no `spherePoints` (bare `?view=game`, old fixture, test-built archetype) | preset from the archetype's pair; `sphere_points.fallback` reason `missing` |
| `spherePoints` fails validation (Foundation key, over cap, wrong total, both poles, fraction) | same preset fallback; the trace names the reason; the game never refuses to start |
| Node has neither `spherePoints` nor `sphereAlignment` | `getSpherePoints` returns `{}`; `distributeBySpherePoints` shares income equally across all twelve; `influence.ts:119`'s existing guard is unchanged |
| Fallback pair contains a Foundation sphere (random bare-view archetype) | accepted on the fallback path only (it is today's behaviour); the buy UI never produces one |
| Fewer than two non-zero buys (unreachable through the UI; possible in a hand-built state) | `deriveAlignmentFromPoints` returns `null`; `createAscendant` keeps the archetype's pair |
| A sphere name in the vector the display vocabulary cannot resolve | plain-English fallback + one warning (Law 14's existing behaviour) |
| `points` missing on the Transformation callback (an older caller) | `RemembranceFlow` uses `presetFromAlignment(hunger.sphereAlignment)` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/influence.ts` | 135 (import-path grep) | one additive optional property on `AscendantProperties`; no existing field changes shape; no reader is forced to change |

`engine/ascendant.ts` (~96) and `engine/gameInit.ts` (~98) sit just under the 100 bar by the same grep (which over-counts on name collisions). Their edits are additive: one property passed through, and one derived write in `createAscendant`.

## Deferrals

- **Foundation-signed card types lose their only identity route.** After E6 no god holds order, light or darkness as an identity sphere, so the signed members of favor, insurance⁺, whisper, veil and undertow (and, already today, chaos's gambit and stumble) are unreachable through sphere access. This follows from the canon line (Foundation is found in ruins, not chosen), so it is not a fork. Giving those cards a ruin-discovery route is filed as its own `Deferral` ticket in this project at handoff, blocked by this one, with the options laid out.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise
- [x] If it does, the Vision edit is part of this ticket's scope (N/A: no contradiction)

Premises touched, by file (the game-design-direction Vision notebook): `Vision/00-north-star.md` (a god deciding what kind of god to be this run): extended, since the buy gives that choice a mechanical form. `Vision/02-non-negotiables.md` #3 (mechanics surface through prose, never numbers), #6 (additive) and #7 (three pillars): confirmed. `Vision/03-design-tensions.md` #4 (legibility vs. mystery): the plan leans to legibility by showing the four opposed pairs at minute one. That is offset by words-only levels and a one-click preset, and it is watched by the § Kill criteria playtest trigger; its drift signal is players talking optimal builds. `Vision/taste-profile.md` (prose-first UI, always dark, elder magic discovered not selected): confirmed, and E6 enforces the last of these.

In short, the premise is **identity as a choice the player owns**. Today the hunger pick doubles as the sphere pick, so the player chooses a story and gets a mechanical identity as a side effect. The buy keeps the story pick first (the hunger, the court) and then hands the mechanics to the player with the story's answer already filled in. That matches the "generated-within-constraints with player iteration" stance (CLAUDE.md, Rejected Approaches: pure template and pure LLM content both rejected). The opposed-pair rows put the cosmology's opposition in front of the player at minute one, which the Dominion loop (ruling 2) depends on. No premise changes, so no Vision edit is owed.

## Rulebook impact

- [ ] This plan does not change a rule of play (it does: chargen gains the sphere buy)
- [x] If it does, `Docs/canon/rulebook.md` is updated in the same PR as the code (executor scope, Done-when 9)

`Docs/canon/rulebook.md` § 1 *What You Are* (the "remembered identity" paragraph, line 41, which today says "a sphere that fuels you") gains one sentence, in this ticket's scope: *"After choosing your hunger and court, you pour yourself into the Creation spheres, five measures in all, never more than three into one and never into both of an opposed pair. Your hunger suggests a split; the two spheres you pour most into are your primary and secondary."* `rulebook-quick-reference.md` mirrors it in one line. §5's Foundation line is unchanged and is now enforced, not just stated.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | budget, cap, preset split and income floor are named constants with CMS rows; the split's arithmetic lives in one function |
| 2. Inspectability | PASS | the vector sits on the node; `getAscendantSpheres` exposes bought vs fallback; fallback emits a trace with the reason |
| 3. Determinism | PASS | no PRNG; tie-break in canonical order |
| 4. Fail-soft | PASS | every invalid or missing input falls back to the preset; the split never loses income; the game never refuses to start |
| 5. Narrative over mechanical perfection | PASS | presets come from the hunger's story; reveal prose names the result in the existing voice; three hungers are brought into canon by changing two words each, keeping all their prose |
| 6. Additive over destructive | PASS with note | one optional field; `sphereAlignment` kept, now derived; ~95 readers untouched. Two private split copies are replaced by one shared function, and three hunger pairs are rewritten (targeted replacements) |
| 7. Performance budget | PASS | one arithmetic split per tick, same cost as today's |

## Done when

- [ ] A new Remembrance run stores the bought vector on the ascendant node: `await window.__DEBUG.getAscendantSpheres()` returns the points the player poured, `source: 'bought'`, and `derived` equal to the two largest.
- [ ] `?view=game&seeded&size=medium` boots with `spherePoints` `{ mind: 3, spirit: 2 }` and `derived` mind / spirit (the showcase preset), and `?firstunmet` the same.
- [ ] Per-sphere income follows `distributeBySpherePoints`: a unit test pins each row of the § Constants measured-effect table; the essence bar's income words in a 2/1/1/1 run show income in four bought spheres above the floor.
- [ ] A sphere with no points earns `UNBOUGHT_SPHERE_INCOME_SHARE` of gross income, never zero, Foundation included (unit test).
- [ ] Every surface that names "primary / secondary" names the two largest buys: the reveal sentence in a 2/2/1 buy names both twos in canonical order and adds the "stir beneath" clause for the one.
- [ ] `validateSpherePoints(presetFromAlignment(h.sphereAlignment))` passes for all twelve hungers (catalog test); Haunt, Illuminate and Reshape carry their new pairs.
- [ ] The buy screen cannot produce an illegal vector: opposed poles share one track, overspending positions are disabled with the reason, Continue is disabled until nothing is left (component test with Testing Library).
- [ ] Browser evidence: 1920×1080 screenshot of the spheres step, console clean, the `__DEBUG` assertion from item 1, and the UI-Laws line (Laws 1, 9, 13/14, 17, 21, 25, 33, 37).
- [ ] Rulebook and quick reference carry the § Rulebook impact sentence; the Foundation-access Deferral ticket exists and is linked.

## Kill criteria

- **The step is noise.** The next cold playtest round shows testers clicking straight through without reading, or unable to say which spheres they hold. Then flip `REMEMBRANCE_SPHERE_BUY_ENABLED` (built with this ticket, default `true`) to `false`, and Remembrance passes the hunger's preset straight through. Keep the vector and the split.
- **The budget is the wrong grain.** THR-1748's Dominion read cannot tell 3/1/1 from 3/2 at band granularity. Then retune `SPHERE_POINT_BUDGET` / `SPHERE_POINT_CAP` (constants only; the level words grow with the cap).
- **Generalists starve.** A 2/1/1/1 god cannot keep its threads under THR-1747's upkeep in a scripted full-window run. Then raise the floor, or charge upkeep across the bought spheres in proportion. That is a design follow-up on this ticket's project, never a silent constant bump.

## Coordination block

**Suggested model:** opus — a new Remembrance sub-step with keyboard sliders, plus the income split shared by ledger and readout.
**Parallel-safe with:** [THR-1748](https://linear.app/threadbare/issue/THR-1748) (reads the vector only through `getSpherePoints`, whose fallback covers either landing order), [THR-1750](https://linear.app/threadbare/issue/THR-1750).
**Mutex with:** [THR-1747](https://linear.app/threadbare/issue/THR-1747): both edit `src/engine/essenceIncome.ts` and `src/engine/influence.ts` (that one adds the source-upkeep term; this one replaces the split). Land THR-1747 first and rebase. Also anything editing `src/components/Remembrance/` or `src/data/hunger-catalog.ts` (THR-1644, threading as character creation, if it reaches Ready for Dev).
**Blocked by:** nothing.

**Files to touch:**
- Create: `src/engine/spherePoints.ts` (E2 pure module) and its test
- Create: `src/data/sphere-points-content.ts` (budget, cap, presets, floor, enable flag)
- Edit: `src/types/influence.ts` (optional `spherePoints` on `AscendantProperties`)
- Edit: `src/types/remembrance.ts` (optional `spherePoints` on `AscendantIdentity`)
- Edit: `src/engine/ascendant.ts` (`createAscendant` writes vector + derived pair)
- Edit: `src/engine/gameInit.ts`, `src/App.tsx` (pass-through; `DEV_ASCENDANT_IDENTITY` preset)
- Edit: `src/engine/influence.ts`, `src/engine/essenceIncome.ts` (shared split)
- Edit: `src/data/hunger-catalog.ts` (three pairs)
- Edit: `src/data/remembrance-content.ts` (or the Remembrance copy file; buy lines and words)
- Edit: `src/components/Remembrance/TransformationBeat.tsx`, `RemembranceFlow.tsx`, `RevealBeat.tsx` (spheres sub-step, reveal prose)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (`getAscendantSpheres`)
- Edit: `src/components/CMS/registry.ts` (constant rows)
- Edit: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`

## Notes for the executor

- Replace the two `distributeByAlignment` copies in one commit, so ledger and readout can never disagree (the THR-1652 lesson).
- `nudgeCardRepertoire` tests that pin a hunger's sphere access for haunt / illuminate / reshape will move with E6; update them to the new pairs, and do not add Foundation spheres back to make a test pass.
- `deriveCosmologyFromIdentity` keeps reading the derived pair, so a Haunt world now leans spirit / entropy instead of spirit / darkness. That is intended.
- Do not seed the god's grown sphere score (`sphereAffinity.scores`) from the points here; that is THR-1748's call.

## Intent-judge verdict

*2026-10-06, opus, cold boot.* First pass **Revise** with five findings:
- UL clash: "power" on the buy screen collides with Traits.md § Power.
- Kill criteria only in the proposal.
- PC-7 / PC-1 not named.
- The ruling was quoted as a paraphrase.
- Veto wording owed at handoff.

All five were fixed. Second pass **Allow**: 12/12 dimensions PASS, and 8 substrate claims were spot-checked against `src/` and held.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-06*

### NFP audit

PASS-with-notes. Tunability, inspectability, narrative, performance: PASS. Determinism: PASS-with-note (E2 and decision 6 worded the tie-break differently; both deterministic). *Fixed:* decision 6 now states the one rule, the `SPHERE_NAMES` index. Fail-soft: PASS-with-note (`influence.ts:119` throw retained, argued unreachable). Additive: PASS-with-note (two private functions replaced and three hunger pairs rewritten are targeted replacements, not purely additive).

### Three-pillar audit

PASS-with-notes. Engine, Content and UI are each present and substantive. Wiring ties every module to phase, component, GameState, trace and debug. The substrate check against `Docs/canon/systems-inventory.md` found no duplicated subsystem: the two income-split copies are replaced by one shared function. Cosmetic: the substrate table uses its own columns rather than the template's status column.

### Vision audit

PASS-with-notes. No contradictions found:
- north-star: extended
- non-negotiables #3, #6, #7: confirmed
- taste-profile, elder magic discovered not selected: confirmed and enforced by E6

Note: design tension #4 (legibility vs. mystery) leans toward legibility. The point-buy invites build-optimising, partly offset by words-only levels and the one-click preset. *Fixed:* § Vision audit now cites each Vision file by path and names that tension and its watch.
