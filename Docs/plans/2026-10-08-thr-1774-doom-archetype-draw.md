> **title:** Every run draws its doom — the seven doom archetypes reach the player — THR-1774
> **linear_issue:** THR-1774
> **author:** Claude Code (design lane, run 2026-10-08b)
> **created:** 2026-10-08
> **three_pillars:** Engine done · Content done · UI done

# Every run draws its doom — the seven doom archetypes reach the player — THR-1774

*Six of the seven authored catastrophes have never run; this makes every world draw one, says which, and makes the doom bar agree with the doom.*

## Why this is load-bearing

The rulebook promises that *"every run starts with one of seven archetypes — Breach, Convergence, Changing, Sundering, Failing, Ascension, Reckoning — each named for the shape of its catastrophe"* (`Docs/canon/rulebook.md` §8). The code keeps the promise for exactly one of them. `initializeGameState` resolves the archetype as `doomArchetype ?? 'breach'` (`src/engine/gameInit.ts:326`), and **no production path passes the argument**: the remembrance path (`initializeGameStateFromIdentity`, `gameInit.ts:495-502`) calls it with six arguments, and the bare quick-start path (`useSimulation.ts:79`) the same. The only caller that ever passes a seventh argument is one test (`doomIdentityMilestones.test.ts:96-97`, passing `'breach'`). Every player has played Breach.

Everything downstream of the archetype is already authored and already wired. It reads `doomDef.archetype`, so it would light up the moment the archetype varied:

- **Stage names:** 5 per archetype, all 7 complete, validated by `doom-loader.ts:65`.
- **Doom cards:** `DOOM_CARD_BLUEPRINTS`, `src/engine/doomClock.ts:55`, 7 archetypes × 5 stages.
- **Identity matrix:** `getDoomIdentityMatrix(doomDef.archetype)` at `gameInit.ts:381`, read by `orchestrator.ts`, `phaseAgentDecision.ts`, `proseEnrichment.ts`, `unifiedActionResolution.ts`, `doomIdentityMilestones.ts`, `complicationEffects.ts` and `cycleEnd.ts`. It covers encounter tilt, rival tilt, prosperity pressure, complication tilt, prose vocabulary, chronicle titles and milestones.
- **Omens:** 4 templates per archetype, 28 in all (`src/data/omenTemplates.ts`, filtered at :1625).
- **Wake lines:** one per archetype (`src/data/doom-wake-lines.ts`).
- **Volume titles:** `getVolumeTitle`.

So the fix is one selection function plus the surfaces that tell the player which doom they drew. While surveying, two faults surfaced that only stay invisible because the doom never varies:

1. **The doom bar's sphere sigil contradicts the doom's own cards.** `DoomBar.tsx:20-25` maps Breach → Order, Convergence → Matter, Changing → Life and Ascension → Force. The engine's doom cards press Convergence → **Force** (`doomClock.ts:158,210`), Changing → **Chaos** (:224,266), Ascension → **Spirit** (:448,490) and Reckoning → **Mind** (:544,586). Breach, Sundering and Failing press no sphere at all. The first non-Breach run would show a Matter sigil over a doom that pushes Force: complaint class PC-6, *one fact told two ways*.
2. **The player never reads the doom's name, except as a raw id.** The wake toast evokes without naming (`phaseDoom.ts:319-328`). The stage pop-up names it as the lowercase key, *"The breach intensifies — Reality Cracks"* (`phaseDoom.ts:379-393`), and the doom bar's tooltip does the same (`DoomBar.tsx:80`). That is complaint class PC-3 (*developer text in player prose*) and Law 14. No `doom.<archetype>` tooltip exists: `tooltipResolver.ts:186-205` answers only `doom.unmaking` and `doom.clock`.

## The call this plan makes (by delegation — design lane, 2026-10-08; veto in chat)

**The doom is drawn at the world's making, at even odds across all seven, from the world's seed and the god's hunger. It is not fixed by who the god is.** The ticket left this open: derive the archetype from the god's identity, or draw it seeded as rulebook §8 implies. The evidence decides it:

- **An identity table would have to invent meaning for three of the seven.** Only four archetypes carry a sphere anywhere in the engine (Convergence Force, Changing Chaos, Ascension Spirit, Reckoning Mind). Breach, Sundering and Failing are systemic, with no sphere key (measured: `grep -n "sphere:" src/engine/doomClock.ts` hits only those four archetypes' blocks). The `doom-identity-matrices.ts` the ticket names as "already mapping archetype × sphere" carries no sphere field at all. `grep -cw sphere src/data/doom-identity-matrices.ts` and `grep -c 'sphere:' …` both return 0. A plain `grep -n sphere` returns 7 hits, but all of them are the substring in `atmospheres: [`. A hunger → doom table would be authored meaning with nothing in canon to anchor it.
- **A fixed table recreates the cookie cutter this map just measured as a defect.** [THR-1770](https://linear.app/threadbare/issue/THR-1770) found two different gods sharing 3.8 of their first 5 powers and treated sameness as the thing to remove. A fixed table makes every Witness run the same catastrophe forever. Under the draw, a Witness god meets all seven dooms within 70 seeds (measured below).
- **Canon frames the doom as the world's catastrophe, not the god's.** §8: *"each named for the shape of its catastrophe"*. §1: the World-Soul *"seeds the next world's generation"*. The 2026-03-04 vertical-slice plan (line 168) already said *"new archetype from world-soul state"*. A seeded draw is that intent at its simplest. The World-Soul's own say (a world that grieved last time leaning toward Reckoning) is cross-run design. It stays out of scope, behind a named seam.
- **Keying the draw on the hunger as well as the seed** keeps it deterministic per (seed, god) (NFP #3), and lets the ticket's Done-when (*four distinct archetypes across the twelve hungers at a fixed seed*) be a real test. The hunger gives no doom an edge; it only reshuffles which one a given seed lands on.

Four smaller calls follow from it, each also by delegation:

- **The showcase stays Breach.** `?view=game&seeded` and `?firstunmet` pass `DEV_SHOWCASE_DOOM_ARCHETYPE = 'breach'` explicitly, so every evidence route, the warm playtest and every existing screenshot stay comparable. A `?doom=<archetype>` review lever reaches the other six.
- **A new cycle keeps its doom** (unchanged). Whether a second cycle redraws is World-Soul/Twilight design ([THR-1381](https://linear.app/threadbare/issue/THR-1381)), not this ticket.
- **The doom bar's sigil follows the doom's own cards.** One `DOOM_ARCHETYPE_SPHERE` table in `src/data/`, read by both the engine's card authoring check and `DoomBar`. Dooms that press no sphere show their own glyph. Breach therefore changes from the Order sigil to its ◈ glyph.
- **The doom is named once, plainly, when it wakes.** The wake toast gains a second sentence, *"The Age of the Breach has begun."*. It matches the Chronicle's existing *"Volume I: The Age of the Breach"* title word for word, capital A included. Stage pop-ups use the display name.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Doom Clock & Journey (`doomClock.ts`, `phaseDoom.ts`, `doom-content.ts`, `doom/*.json`) | 🟢 ACTIVE | **extends**: selection at init; wake line and stage pop-up name the doom |
| Doom identity matrices (`doom-identity-matrices.ts`, `getDoomIdentityMatrix`) | 🟢 ACTIVE for Breach only | **activates** the six authored, never-run matrices; no edit |
| Omen templates (`omenTemplates.ts`) | 🟢 ACTIVE for Breach's 4 | **activates** the other 24 archetype omens; no edit |
| World-Soul (`worldSoul.ts`) | 🟠 partial | **untouched**; the draw takes a weights vector so a later World-Soul tilt edits weights, not this function |
| Tooltip registry (`tooltipResolver.ts` `doom.*` branch) | 🟢 ACTIVE (2 ids) | **extends** with `doom.<archetype>` × 7 |
| Debug bridge (`getOpeningState`) | 🟢 ACTIVE | **extends** additively with `doomArchetype` |

Runtime population: 7 archetypes, 12 hungers, 1 draw per world. No per-tick cost.

## Engine pillar

### Systems design

New module **`src/engine/doomArchetypeSelection.ts`**:

```ts
export function selectDoomArchetype(
  seed: number,
  identityKey: string,                       // stored hunger id ('hunger.witness'), or the archetype id on the bare path
  weights: Readonly<Record<DoomClockArchetype, number>> = DOOM_ARCHETYPE_DRAW_WEIGHTS,
): { archetype: DoomClockArchetype; roll: number; weights: Record<DoomClockArchetype, number> }
```

- The RNG is `mulberry32(((seed + DOOM_ARCHETYPE_DRAW_SEED_OFFSET) ^ hashString(identityKey)) | 0)`. Import `mulberry32` from `src/lib/prng.ts`, the dependency-free module `gameInit.ts:44` already uses. **Do not import `hashString` from `src/engine/factionAmbitions.ts:57`.** That module imports `armySpawning`, `factionNetwork` and `traceBuffer`, and pulling it into world creation risks a module load cycle (the intent judge flagged it, and memory records the same trap for the detection recorder). Instead, add `export function hashString(str: string): number` to `src/lib/prng.ts` with the identical algorithm (`h = ((h << 5) - h + charCode) | 0`, start 0). Optionally have `factionAmbitions.ts` re-export it rather than keep its own copy. The measured numbers below were taken with exactly this algorithm. `naming/workNames.ts`'s `hashSeed` is FNV-1a: a different function, so it would invalidate them.
- **Weighted pick in `DOOM_CLOCK_ARCHETYPES` order** (`src/types/doomClock.ts:13`). Negative weights clamp to 0. All-zero weights fall back to `DOOM_ARCHETYPE_FALLBACK` (`'breach'`) with a trace.
- **`initializeGameState`:** when `doomArchetype` is undefined, the archetype becomes `selectDoomArchetype(seed, archetype.id).archetype`. On the remembrance path `archetype.id` *is* `identity.hungerId` (`gameInit.ts:485`), so one call site covers both paths. An explicit `doomArchetype` still wins: tests, the showcase pin and the `?doom=` lever.
- **`initializeGameStateFromIdentity`** gains an optional trailing `doomArchetypeOverride?: DoomClockArchetype` and passes it through as the 7th argument (additive, NFP #6).
- **Dev routes:** `App.tsx`'s `seeded` / `firstunmet` identity path passes `DEV_SHOWCASE_DOOM_ARCHETYPE`. A valid `?doom=<archetype>` param replaces it on any route. An invalid one is ignored with one `console.warn`. Thread the value through `useSimulation`'s params; the param object already carries `ascendantIdentity`.
- **`DOOM_ARCHETYPE_SPHERE`** moves to `src/data/doom-archetype-presentation.ts` as `Partial<Record<DoomClockArchetype, SphereName>>`: convergence `force`, changing `chaos`, ascension `spirit`, reckoning `mind`. A unit test asserts that every blueprint `sphere:` in `DOOM_CARD_BLUEPRINTS` for an archetype equals its entry here, and that archetypes with no entry have no blueprint sphere. That makes PC-6 a build failure, not a playtest finding. `DOOM_CARD_BLUEPRINTS` is module-private; export a read-only accessor `getDoomCardSpheres(archetype): SphereName[]` for the test.

### Graph nodes / edges

None. The archetype lives on `GameState.doomDefinition.archetype` and `doomClock.definitionArchetype`, as now.

### Tick phases

None new. Selection runs once at world creation. `phaseDoom`'s wake and stage events change their message text only.

### Resolution logic

Weighted categorical draw, uniform by default. Measured on a prototype that mirrors this exact function (scratch script, not committed; recipe in Notes for the executor). Twelve hungers × seeds 1–1000:

| Measure | Result |
|---|---|
| Share per archetype | breach 14.1% · convergence 14.3% · changing 14.8% · sundering 14.8% · failing 14.0% · ascension 13.9% · reckoning 14.0% |
| Seed 42, twelve hungers | 6 distinct: gather sundering, witness convergence, reclaim reckoning, reshape ascension, preserve sundering, kindle ascension, sever changing, bind changing, wander breach, consume changing, haunt reckoning, illuminate reckoning |
| Seeds with < 4 distinct across the twelve | 1 of 1,000 (minimum 3) |
| `hunger.witness` over seeds 1–70 | every archetype met (8–12 each) |

The seed-42 row depends on `DOOM_ARCHETYPE_DRAW_SEED_OFFSET = 194087` and the stored-id form `hunger.<id>`. If the executor changes either, re-run the recipe and re-pin the test to a seed with ≥ 4 distinct. Never loosen the predicate.

### PRNG callouts

One seeded draw per world through `mulberry32`, keyed as above. No `Math.random()`. The draw uses its own offset stream, so it does not perturb any existing world-generation stream (culture, rarity, latent source). World geography for a given seed is unchanged; only the doom (and what the doom tilts) differs.

## Content pillar

### Data tables

- **`DOOM_ARCHETYPE_DISPLAY_NAMES`** (`src/data/doom-archetype-presentation.ts`): Breach, Convergence, Changing, Sundering, Failing, Ascension, Reckoning. These are the rulebook's own words, so no UL change is needed. The volume title already renders *"The Age of the Breach"* from the same words.
- **`DOOM_ARCHETYPE_GLYPHS`** for all seven, from `DoomBar.tsx`'s recorded originals: breach ◈, convergence ⬡, changing ∿, sundering ⚡, failing ◇, ascension ✦, reckoning ⚔. A glyph shows only when the archetype has no `DOOM_ARCHETYPE_SPHERE` entry.
- **`doom.<archetype>` tooltips:** label = display name. Description = the archetype JSON's existing `description` plus one plain-register clause of what the player will feel. Seven entries, each ≤ 200 characters (Law 18, enforced by `tooltipValidation.test.ts`):

| id | Tooltip text |
|---|---|
| `doom.breach` | "An outside force breaking through reality. The edges of the world suffer first, and rivals grow bold. It presses no single sphere." |
| `doom.convergence` | "All forces drawn to a single point. The heart of the world prospers, and people are drawn together. It presses {{sphere.force}}." |
| `doom.changing` | "A new cosmic order replacing the old. Old loyalties are rewritten, and the world's edges flourish strangely. It presses {{sphere.chaos}}." |
| `doom.sundering` | "The world itself breaking apart. No ground is safe, and bonds shatter with the land. It presses no single sphere." |
| `doom.failing` | "A core force of creation weakening. Cities cannot sustain themselves, and none can spare strength for war. It presses no single sphere." |
| `doom.ascension` | "Something approaching godhood. People gather around a rising power, and fighting it no longer works. It presses {{sphere.spirit}}." |
| `doom.reckoning` | "Past debts coming due. Unrest grows where blood was spilt, and old debts and betrayals surface. It presses {{sphere.mind}}." |

Lengths with the chain markup: 113–137 characters, all under the Law 18 cap of 200. The closing sentence is what tells the player what the doom bar's sigil means. `{{sphere.<name>}}` renders as a nested hoverable link to the existing `sphere.*` tooltip (Law 19; entries in `src/data/sphereTooltips.ts`). That way the Mind sigil reads as "this doom presses Mind", with Mind itself explained one hover deeper. *"It presses no single sphere"* is what explains a glyph in place of a sigil. It is true of the three systemic dooms (their cards carry no `sphere:` key), and it is the same fact the consistency test enforces.

The second clause of each was checked against that archetype's identity matrix (`src/data/doom-identity-matrices.ts`, read 2026-10-08), and each is backed by a value:

| Archetype | Values backing the clause |
|---|---|
| Breach | `frontierDelta -1`, rival `attack +0.30` |
| Convergence | `centerDelta +1`, `familiarityGainModifier 1.4` (its `frontierDelta` is 0, so no "edges" claim) |
| Changing | `broken_trust +0.20`, `frontierDelta +1` |
| Sundering | `frontierDelta -1` and `centerDelta -1` ("the only archetype with no safe geography"), `familiarityGainModifier 0.6` |
| Failing | `centerDelta -1`, rival `attack -0.30` / `expand -0.25` |
| Ascension | `familiarityGainModifier 1.3`, encounter `combat -0.20` / `threat -0.20`, rival `recruit +0.30` |
| Reckoning | `deathSiteUnrestBonus 3`, complication `debt +0.25` / `broken_trust +0.25` |

A tooltip must not promise what the engine does not write (the spirit of Law 56). If a matrix value is retuned, its clause is re-checked.

### Encounter templates / Prose tables / Attachment content

N/A. All seven archetypes' omens, cards, stage names, wake lines and matrix vocabularies are already authored (the 2026-04-15 and 2026-04-29 doom identity passes). The plan wires them; it writes no new encounter or prose table.

## UI pillar

*Screenshot tool: Playwright (the doom bar, toast and pop-up are DOM surfaces). The map is unchanged.*

### Player-facing display

- **DoomBar** (`src/components/Game/DoomBar.tsx`) reads `DOOM_ARCHETYPE_SPHERE` / `DOOM_ARCHETYPE_GLYPHS` from the new data module and deletes its local copies. The archetype sigil is wrapped in `<Tooltip id={`doom.${archetype}`}>` (Laws 1, 12, 17). The `aria-label` / tooltip string uses the display name, never the key (Law 14).
- **Stage pop-up and wake toast:** text changes only (below). Same channels (`popup`, `toast`), so the interrupt registry is untouched (Law 37 does not apply; Law 33 is unchanged: no new surface).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Wake toast and its Chronicle line (`phaseDoom.ts` wake event) | "Far below the world, something that was sleeping turns over. The Age of the Breach has begun." (on a Reckoning world: "An old ledger opens. What the world owes is about to be counted. The Age of the Reckoning has begun.") | PC-1 | "Breach" is the same word the doom bar's sigil tooltip names ("An outside force breaking through reality…"), so the name is learnable at first contact |
| Stage pop-up message (`phaseDoom.ts:385`, body fallback :391) | "The Breach intensifies — Reality Cracks" | PC-3 (was "The breach intensifies", raw key) | the capitalised display name, matching the toast and the Chronicle volume title |
| DoomBar `aria-label` / tooltip (`DoomBar.tsx:80`) | "Breach — Stage 2: Reality Cracks" | PC-3 | as above |
| DoomBar sigil tooltip | label "Reckoning"; body "Past debts coming due. Unrest grows where blood was spilt, and old debts and betrayals surface. It presses Mind." (Mind is a nested link to the `sphere.mind` tooltip). On a Breach world: label "Breach", body ending "It presses no single sphere." | PC-1, PC-6 | **PC-1:** the closing sentence says what the sigil means, and the sphere word chains to its own tooltip. **PC-6:** the doom's sphere is told in three places — the sigil, this tooltip's last sentence, and the doom cards' pressure — and all three read from the one `DOOM_ARCHETYPE_SPHERE` table, held equal by the consistency test. The doom's *name* is told in four places (wake line, stage pop-up, doom bar label, volume title), all through `DOOM_ARCHETYPE_DISPLAY_NAMES`, word for word |

### Playtest signal

A tester asked what is threatening the world can name the doom by its word ("the Breach", "the Reckoning"). No tester quotes a lowercase doom key.

### Event notifications

No new events. Two message strings change: the wake (`type: 'narrative'`, toast) and the stage escalation (`type: 'doom_escalation'`, popup).

**Executor check:** confirm the wake event lands in the Chronicle feed the player can scroll back through. If the narrative toast is not persisted there, add a Chronicle entry with the same text at the same site. The Done-when says *"named in the Chronicle's first doom line"*.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getOpeningState()` gains `doomArchetype: DoomClockArchetype` (additive; update `src/debug-bridge.d.ts`).
- The Omens debug tab already shows `Doom Identity — <archetype>` (`DebugTabContent.tsx:598`); no change.
- `npm run cli` → `doom` already prints the archetype (`scripts/cli.ts:607-609`).

### Visual presence (HexMapV2)

N/A. The plan adds no map layer. The six newly reachable matrices already move prosperity and pressure through existing phases, which the map already renders.

## Interface impact

Doom/Journey is ⚪ UNAUDITED in `Docs/canon/interface-map.md`, so it is audited on touch:

| Contract | Disposition | Note |
|---|---|---|
| `GameState.doomDefinition.archetype` → identity matrix readers (orchestrator, phaseAgentDecision, proseEnrichment, unifiedActionResolution, doomIdentityMilestones, complicationEffects, cycleEnd) | **preserve** | shape unchanged; six more values now reach these readers. Each was authored for all seven (`doom-identity-matrices.ts` header: "All 7 archetypes are fully authored") |
| `doomDefinition.archetype` → omen selection (`omenTemplates.ts:1625`) | **preserve** | 4 templates per archetype exist for all seven |
| Doom card sphere ↔ DoomBar sigil | **add** | new single source `DOOM_ARCHETYPE_SPHERE`, consistency test |
| `getOpeningState` → debug bridge | **extend** | `doomArchetype` field |

No new cross-system write. Update `Docs/canon/interface-map.md`'s Doom/Journey row to name the selection and presentation modules; `scripts/interface-contracts.ts` changes only if that row is mirrored there.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `doomArchetypeSelection.ts` | init (`initializeGameState`) | — | `doomDefinition.archetype`, `doomClock.definitionArchetype` | `doom.archetype_drawn` | `getOpeningState().doomArchetype`; CLI `doom` |
| `doom-archetype-presentation.ts` | — | `DoomBar`, `phaseDoom` text | — | — | tooltip registry |
| `tooltipResolver.ts` `doom.<archetype>` | — | `Tooltip` | — | — | `resolveTooltip('doom.breach')` |
| `App.tsx` / `useSimulation` `?doom=` lever | init | — | (override only) | `doom.archetype_drawn` with `source: 'override'` | URL |

Wiring checklist (`Docs/plans/wiring-checklist.md`): no new phase, no new graph write, no prose pipeline change (`enrichProse` already reads the matrix vocabulary). The systemic wiring guide does not apply, because nothing new is content-facing.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `DOOM_ARCHETYPE_DRAW_SEED_OFFSET` | `194087` | Separates the doom draw's PRNG stream from every other world-gen stream |
| `DOOM_ARCHETYPE_DRAW_WEIGHTS` | `1` for each of the 7 | Relative odds of each doom; the seam a later World-Soul tilt edits |
| `DOOM_ARCHETYPE_FALLBACK` | `'breach'` | Used only when every weight is ≤ 0 |
| `DEV_SHOWCASE_DOOM_ARCHETYPE` | `'breach'` | Pins the `?seeded` / `?firstunmet` evidence routes |
| `DOOM_WAKE_NAMING_TEMPLATE` | `'The Age of the {name} has begun.'` | The naming sentence appended to the wake line |

## Tracing

```ts
// doom.archetype_drawn: emitted once at world creation
interface DoomArchetypeDrawnTrace {
  category: 'doom.archetype_drawn';
  tick: 0;
  archetype: DoomClockArchetype;
  source: 'draw' | 'override' | 'fallback';  // override = explicit argument (tests, showcase, ?doom=)
  identityKey: string;
  seed: number;
  roll?: number;                              // present when source === 'draw'
  summary: string;                            // "doom.archetype_drawn: reckoning (draw, hunger.witness, seed 42)"
}
```

Add `'doom.archetype_drawn'` beside `'doom.wake'` in `src/types/trace.ts` (union and category list, :403 and :945), and its interface beside :5325. Tracing at init follows the existing init-trace pattern. If init runs before tracing is enabled, the trace is dropped harmlessly and `getOpeningState().doomArchetype` remains the inspection path.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `?doom=` value not an archetype | ignored; one `console.warn`; the route's normal archetype (showcase pin or draw) |
| All draw weights ≤ 0 (a future tilt bug) | `DOOM_ARCHETYPE_FALLBACK`, trace `source: 'fallback'` |
| `identityKey` empty / undefined | hash of `''` (0): still deterministic per seed |
| Archetype missing from display names / glyphs | display falls back to the capitalised key, glyph to `◈`; warns once (Law 4, Law 14) |
| `doom.<archetype>` tooltip unresolvable | `Tooltip` renders its child without a popover (existing behaviour) |
| An old save/fixture whose `doomDefinition.archetype` is a non-Breach value | already supported, since every reader keys on the archetype |

## Blast Radius

`src/engine/gameInit.ts` is imported widely (fixtures, scripts, CLI). The signature change is additive (an optional trailing parameter on `initializeGameStateFromIdentity`), and `initializeGameState`'s signature is unchanged. **Behaviour change:** every caller that omits the 7th argument now gets a drawn doom instead of Breach. This covers census scripts, `balance-eval`, CLI worlds and any test fixture built through init. A survey of `__tests__` found no test that builds through init without the argument and then asserts Breach (matched by pattern, not run). Census/KPI numbers can move, because six matrices now tilt encounters, rivals and prosperity. That is the intended effect, but see Notes for the executor on `test:heavy`.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (data tables, tooltips; encounter/prose N/A with rationale)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The metaprogression promise stays intact. Rulebook §8 line ~600 reads *"The next world is not a sequel — it is a response"* and cites `Vision/00-north-star.md` as its source. The Vision auditor found no verbatim phrase there, so the quote is attributed to the rulebook. The World-Soul tilt is left as a named weights seam, not decided here.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes no rule of play: no turn, verb, prerequisite, resource, encounter, clock or win/loss change. It makes the code honour an existing rule.
- [x] The rule already says every run starts with one of seven archetypes. The code now honours it. The executor edits `Docs/canon/rulebook.md` §8 (line ~380) in the same PR. After *"each named for the shape of its catastrophe"*, add: *"The doom is drawn when the world is made, at even odds, and named to you when it wakes [IMPL — THR-1774, `selectDoomArchetype` in `src/engine/doomArchetypeSelection.ts`]."* Then re-tag the archetype sentence `[IMPL]`.

> Brainstorm companion: `Docs/plans/2026-10-08-thr-1774-doom-archetype-draw-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | draw weights, seed offset, fallback, showcase pin and naming template are named constants |
| 2. Inspectability | PASS | `doom.archetype_drawn` trace with source and roll; `getOpeningState().doomArchetype`; CLI `doom` |
| 3. Determinism | PASS | one `mulberry32` draw on its own offset stream, keyed on seed and identity; asserted by test |
| 4. Fail-soft | PASS | see table; bad lever, zero weights and missing presentation all degrade to a valid doom |
| 5. Narrative over mechanical perfection | PASS | the doom is named once, in the GM voice of the authored wake lines; tooltips stay in plain register |
| 6. Additive over destructive | PASS with note | optional params and new modules; DoomBar's local maps move to data (the one deletion), and Breach's sigil changes from Order to ◈ |
| 7. Performance budget | N/A | one draw per world, no per-tick cost |

## Kill criteria

How we would know this plan was wrong, and what to do:

1. **A playtest finds the dooms indistinguishable across runs.** Testers on different worlds describe the same pressures. The identity matrices' tilts are too weak. File a content ticket to sharpen them. **Do not revert the draw.**
2. **`test:heavy` or a run shows a non-Breach archetype breaking a world** (a crash, a stalled clock, an empty omen pool, a stage with no cards). That archetype's authored data is defective. Set its entry in `DOOM_ARCHETYPE_DRAW_WEIGHTS` to `0` (one constant), file the defect as a `Deferral` linked here, and keep the others live. **Revert to always-Breach (all other weights 0) only if two or more archetypes fail.**
3. **Christian vetoes "drawn, not by the god".** Keep `selectDoomArchetype`. Change only how the weights are computed (identity-tilted), or reserve a curated table for him to author. Neither requires undoing this plan's surfaces.

## Done when

- [ ] At seed 42 the twelve hungers (`hunger.<id>`) draw ≥ 4 distinct archetypes. Asserted by a test that builds through `initializeGameStateFromIdentity` for each hunger, or through `selectDoomArchetype` plus one init-path test proving init calls it.
- [ ] `selectDoomArchetype(s, k)` is deterministic for every (seed, key) pair it is called with in the test, and an explicit `doomArchetype` argument always wins. Both asserted.
- [ ] `?view=game&seeded&size=medium` and `?firstunmet` boot on Breach: `(await window.__DEBUG.getOpeningState()).doomArchetype === 'breach'`.
- [ ] `?view=game&seeded&size=medium&doom=reckoning` boots on Reckoning (same accessor), and its doom bar shows the Mind sigil with tooltip "Reckoning".
- [ ] The wake line names the archetype ("…The Age of the Reckoning has begun.") and is visible in the Chronicle after the bond. Verified on `?view=game&firstunmet&size=medium&doom=reckoning` by bonding and reading the Chronicle.
- [ ] No player-facing string contains a lowercase doom key: the stage pop-up message and body fallback and the DoomBar label use display names. A unit test on the `phaseDoom` stage event message asserts it.
- [ ] The consistency test passes: `DOOM_ARCHETYPE_SPHERE` equals the blueprint spheres for every archetype.
- [ ] Seven `doom.<archetype>` tooltips resolve, each ≤ 200 characters (`tooltipValidation.test.ts`).
- [ ] `rulebook.md` §8 updated as in Rulebook impact. `interface-map.md` Doom/Journey row updated. Wiki page whose `sources` include `phaseDoom.ts` / `DoomBar.tsx` updated (blocking gate).
- [ ] Gates: `npm run gate` green (code track: `npm test`, `check:typecheck`, `vite build`, freshness). Engine files touched, so add a 30-tick CLI smoke and `npm run test:heavy`.
- [ ] UI four-part evidence: 1920×1080 screenshot of the doom bar on a `?doom=reckoning` route with the sigil tooltip open; console output; the `getOpeningState` assertion above; a UI-Laws line for Laws 1, 12, 13/14, 17, 21, 33, 37.
- [ ] The closing commit body and PR body carry the line-anchored closer for this ticket.

## Coordination block

**Suggested model:** opus. One selection module, two text edits, a data module, seven tooltips, and a test sweep across init callers.

**Parallel-safe with:** [THR-1770](https://linear.app/threadbare/issue/THR-1770) and the rest of the Dominion map (design only); [THR-1781](https://linear.app/threadbare/issue/THR-1781), [THR-1777](https://linear.app/threadbare/issue/THR-1777) and [THR-1778](https://linear.app/threadbare/issue/THR-1778) (aftermath / God's Will surfaces, disjoint files).

**Mutex with:**
- [THR-1768](https://linear.app/threadbare/issue/THR-1768) and [THR-1749](https://linear.app/threadbare/issue/THR-1749): both edit `gameInit.ts` initialisation (sphere seeding, point-buy at Remembrance). Land one, rebase the other.
- [THR-1744](https://linear.app/threadbare/issue/THR-1744) (warm playtest, In Dev): it reads `?seeded` worlds; the Breach pin keeps those worlds identical, but `App.tsx` param parsing is shared.

**Files to touch:**
- Edit: `src/lib/prng.ts` (add the dependency-free `hashString`)
- Create: `src/engine/doomArchetypeSelection.ts`, `src/data/doom-archetype-presentation.ts`, `src/engine/__tests__/doomArchetypeSelection.test.ts`, `src/data/__tests__/doomArchetypePresentation.test.ts`
- Edit: `src/engine/gameInit.ts` (default → draw; optional override on the identity path; `getOpeningState` source data if it lives here)
- Edit: `src/engine/phaseDoom.ts` (wake naming sentence; display names in stage text)
- Edit: `src/engine/doomClock.ts` (export `getDoomCardSpheres`)
- Edit: `src/engine/tooltipResolver.ts` (`doom.<archetype>`)
- Edit: `src/components/Game/DoomBar.tsx` (read the data module; tooltip on the sigil; display name in label)
- Edit: `src/App.tsx`, `src/components/Game/hooks/useSimulation.ts` (showcase pin, `?doom=` lever)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (`doomArchetype` on `getOpeningState`)
- Edit: `src/types/trace.ts` (`doom.archetype_drawn`)
- Edit: `Docs/canon/rulebook.md` §8, `Docs/canon/interface-map.md`, `Docs/ops/dev-quickstart.md` (add `?doom=` to the lever table), the matching Design Reference Wiki page

## Notes for the executor

- **Do not make the doom depend on the god's spheres or hunger beyond the RNG key.** That was weighed and rejected (see The call this plan makes). The weights constant is where a later World-Soul tilt goes.
- **Do not redraw on "Begin Next Cycle"** (`cycleEnd.ts:255-268`). That is Twilight/World-Soul design.
- **`test:heavy` and census baselines may move**, because six identity matrices now tilt encounters, rivals and prosperity on non-Breach worlds. If a heavy test pins a number on a world built without a doom argument, first check whether the doom is the cause: run the same seed with `doomArchetype: 'breach'` passed explicitly. If it is, pin the test's world to Breach (it was always a Breach measurement) and say so in the commit body. Do not loosen a threshold. A failure that persists under Breach is a real defect; report it.
- **Measurement recipe** for re-pinning the seed-42 test if the offset changes: import `selectDoomArchetype` and `DOOM_CLOCK_ARCHETYPES`; for seeds 1..1000 × the twelve `hunger.<id>` keys, count distinct archetypes per seed and the share per archetype. Expect ~14.3% ± 1 each. Pick a test seed with ≥ 4 distinct, preferring 42.
- The two-copy trap: `DoomBar.tsx`'s comment glyphs are the originals; keep them as the glyph table.
- Wake-line sentence: append to the authored line, never rewrite the seven authored lines (GM narration doctrine; they were written in that voice).

## Intent-judge verdict

**Round 1: Revise** (Reversible). Three GAPs:

- **Dimension 10:** kill criteria lived only in the proposal.
- **Dimension 11:** a stated grep (`grep -n "sphere"` → 0) returned 7 substring hits in `atmospheres`.
- **Dimension 12:** the wake sentence's lowercase "age" differed from the volume title, and the tooltips did not say what the sphere sigil means.

All three were fixed inline: a `## Kill criteria` section, a corrected measurement (`grep -cw sphere` = 0), "The Age of the …" word for word, and a closing *"It presses {{sphere.x}}." / "It presses no single sphere."* on every tooltip.

**Round 2 (cold re-run): Allow.** No GAPs and no VIOLATIONs; dimension 11 verified against source. Two advisory notes, both folded in. First, avoid a load cycle on `hashString`: the plan now puts it in `src/lib/prng.ts`. Second, verify Chronicle persistence in the browser; this is already a Done-when.

## Forked-audit verdicts

### NFP audit

The verdict is **PASS-with-notes**:

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | — |
| 2. Inspectability | PASS-with-note | The init trace may drop if tracing is off; `getOpeningState().doomArchetype` and CLI `doom` are the reliable paths |
| 3. Determinism | PASS | — |
| 4. Fail-soft | PASS | — |
| 5. Narrative over mechanical | PASS | — |
| 6. Additive over destructive | PASS-with-note | DoomBar maps deleted, Breach sigil changes, default behaviour changes for callers that omit the doom argument |
| 7. Performance budget | N/A | — |

The auditor could not read `wiring-checklist.md` (507 KB, over its read limit). It judged inspectability from the plan's own wiring table.

### Three-pillar audit

**PASS.**

- **Pillars:** Engine, Content and UI are all present and substantive.
- **Sections:** no required section is missing; Blast Radius is present.
- **Wiring:** connects each module to its phase, UI, GameState field, trace and debug surface.
- **Substrate:** the inventory is upfront. The plan extends or activates Doom Clock & Journey (🟢 ACTIVE), the identity matrices, the omen templates and the tooltip registry, with no green-field rebuild. Runtime population is given.

### Vision audit

**PASS-with-notes.** No contradictions.

| Premise or area | Finding |
|---|---|
| North star | Extended: a varied doom gives the god a different catastrophe to witness |
| Non-negotiables | Confirmed: prose-first, no numbers on surfaces |
| Taste profile | Confirmed: prose tooltips, GM voice |
| Design tensions | Reduces the Breach-only sameness drift signal |

Notes:

1. The quoted premise "The next world is a response" is not verbatim in `Vision/`. It is rulebook §8 citing the north star. Fixed in the Vision audit section above.
2. The risk that the matrices' tilts are too weak to tell the dooms apart is covered only by the kill criteria. Accepted: kill criterion 1 routes it to a content ticket.
