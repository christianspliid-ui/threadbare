> **title:** A rival's move has a place and an answer — the raid toast names the place it pressed and how to tend it, a rival's temper says why and cools, and the Chronicle names the rival instead of its id (THR-2172, slice 1)
> **linear_issue:** THR-2172
> **author:** Claude Code (design lane, unattended, 2026-11-06 — run dl-20261106-0219)
> **created:** 2026-11-06
> **three_pillars:** Engine done (two local changes inside the rival phase, one additive state field, one name lookup) · Content done (every word listed) · UI done (rival panel entry, toast routing)

# A rival's move has a place and an answer (THR-2172, slice 1)

*All three warm testers saw rival gods "waging war upon my dominion" and never found where, how bad, or what to do. The game already has an answer: a place the god tends (claimed, the seat, threaded through someone there, or held by an anointed faction) absorbs a rival's pressure. Nothing tells the player so. The toast is a random flavour line picked before anything lands, even when nothing lands at all. This slice uses the standard strategy-game pattern of the attack alert that names its place and opens it. A rival toast fires only when the rival's hand lands. It names the place and the sphere, says whether your tending held, and opens the place on click. A rival's temper starts lower, cools when nothing new happens, and says what it is about. The rival's entry in the panel stops pretending to be a link and shows where it last pressed.*

## Why this is load-bearing

[Warm playtest round 3](https://linear.app/threadbare/issue/THR-2172), 3 of 3 testers. It is the story tester's named worst moment, and the skimmer's "one thing to tell the designer" (*"give … the rival threats a single button that lets me act on them"*). Fixed when: a warm round-4 tester names one thing they did about a rival, and none says they could see rival threats but could not act on them.

## Substrate inventory

Measured on `main` @ `1c67e898`, 2026-11-06. Headless numbers are `npm run cli -- --seed 42 --map medium`.

| What | Where | Status · disposition |
|---|---|---|
| The probe toast | `rivalProbeMove` (`engine/orchestrator.ts:2037-2073`). It picks a flavour line from `RIVAL_ACTION_TEMPLATES` (`data/rival-content.ts:113-153`) with one `rng()` draw and pushes a `rival_action` toast **before** `landRivalProbe` runs. It pushes even when the probe is throttled and lands nothing | 🟢 ACTIVE · **extended** (moved after the landing, reworded) |
| The landing | `landRivalProbe` (`orchestrator.ts:2118-2160`). Picks a Touched-or-better place (untended weighted `DOMINION_RAID_UNTENDED_WEIGHT`:1), pushes `RIVAL_PRESSURE_MAGNITUDE` (4) sphere pressure, throttled to one landing a day per `DOMINION_RAID_PLACES_PER_DAILY_BURST` (10) places, all rivals together. Records the place only in a `dominion.raid` trace | 🟢 ACTIVE · **extended** (returns what it landed) |
| Tending | `buildTendingIndex` / `isTended` (`engine/dominion.ts:367-409`); `TendedBy = 'claim' \| 'seat' \| 'carry' \| 'anointed'` (`:81`). A tended place absorbs the pressure (`phaseSpherePressure`) | 🟢 ACTIVE · read only. **This is the answer the player already has** |
| The claim card | `hex.claim_dominion` (`DOMINION_CLAIM_TEMPLATE_ID`, `data/dominion-content.ts:98`), granted by a milestone beat (`data/ascendant-milestone-beats.ts:164`) | 🟢 ACTIVE · read only |
| Toast routing | `deriveNavigationTarget` (`engine/notificationRouter.ts:46`). A `narrative` event with a `location` ref already opens that place (`:59-62`); `rival_action` has no branch | 🟢 ACTIVE · **extended** |
| Hostility | Starts at 0.5 (`createRivalState`, `engine/rival.ts:174`), which `hostilityLabel` (`data/uiColorPalette.ts:198-203`) already calls "aggressive". **Measured:** all three rivals read 0.5 at ticks 0, 120 and 360 in the headless world. The one persisted writer is +`RIVAL_SCHEME_HOSTILITY_PER_MOVE` (0.03) per scheme beat (`orchestrator.ts:2453-2458`); four beats a scheme, never decays. The +0.05 per attack in `updateRivalState` (`rival.ts:239`) has **no production caller** (grep: only tests). The awareness term (`orchestrator.ts:2054`) is a transient copy, never stored | 🟢 ACTIVE · **extended** (start, cause, decay) |
| Rival panel | `RivalPanel.tsx` (209 lines). The name is a gold underlined button (`RIVAL_NAME_STYLE`, `:19-29`) that toggles a two-line disclosure: "God of X and Y, temper." / "Toward you: {word}." Scheme cards below (`:138-190`) | 🟢 ACTIVE · **extended** |
| The raid chronicle line | `composeDominionChronicle` (`engine/phaseDominion.ts:405-423`) fills `{rival}` with `nameOf(graph, id)` (`:239-242`), which falls back to the raw id. `dropLine` (`engine/dominionProjection.ts:281-298`) uses `graph.getNode(rivalId)?.name`. **Measured:** `state.graph.getNode("actor_rival_1")` is `null`; the names live in `state.rivalDefinitions` ("The Veiled Architect"). So the day line reads *"actor_rival_1's hand has pressed on Iron Glade"*, and the hex drop line always says "No one tends it" | 🔴 DEFECT · **fixed** |

**Blast Radius:** `engine/orchestrator.ts` has 163 importers. The edits stay inside `rivalProbeMove`, `landRivalProbe` and the rival phase's once-a-day block. No exported signature changes except `landRivalProbe`, which gains a return value (callers: its own test only). No other touched file has ≥100 importers (`engine/rival.ts` 29, `types/rival.ts` 29, `data/ui-content.ts` 46, `data/uiColorPalette.ts` 19, `engine/notificationRouter.ts` 9, `engine/phaseDominion.ts` 8, `engine/dominionProjection.ts` 7, `RivalPanel.tsx` 2).

## Decisions (made by the design lane under delegation, 2026-11-06 — veto in chat)

1. **The god's answer to a rival is tending, and the game says so.** Tending already decides whether a rival's hand lands, so this slice shows it and adds no new verb. This is "extend before green-field" (CLAUDE.md, [systems inventory](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/systems-inventory.md)), and it is the ticket's recommended direction ("offers the existing cards that answer it there"). A new counter-card would be catalog design ([action-catalog-design](https://github.com/christianspliid-ui/threadbare/blob/main/.claude/skills/action-catalog-design/SKILL.md)) for a later slice.
2. **A rival toast fires only when its hand lands, and names the place.** The probe toast moves after `landRivalProbe`. A throttled probe, or one with no turf, is silent (the trace still records it). Its words come from what happened, not from a random flavour line. The flavour lines promised plague and broken followers that never occur (Vision: narrative over mechanics, but never a false effect). The flavour table stays (the CMS reads it); only the toast stops using it. **The template `rng()` draw is kept and discarded**, so every other seeded draw in the run stays the same (NFP 3).
3. **The toast opens the place.** The event carries `refs: [{ kind: 'location', id }]`, and `deriveNavigationTarget` gains a `rival_action` branch that opens it. The place page's Act block is where the god's cards for that place already are. Scheme launch toasts get the same ref when their target is a place.
4. **Temper starts at "hostile", rises with cause, cools without one.** Start `RIVAL_HOSTILITY_START` 0.3, which reads "hostile". At 0.5 every rival read "aggressive" before it had done anything (measured). Rises: the existing +0.03 per scheme beat, plus `RIVAL_HOSTILITY_ON_COUNTER` (0.08) when the god breaks one of its schemes (`detectSchemeCounter` hit). That is the player-caused rise the ticket asks for (*"wrathful since you took Iron Glade"*). Cooling: once a day with no rise, temper falls by `RIVAL_HOSTILITY_COOL_PER_DAY` (0.02) toward the start value, never below it. The selection rule (`> 0.7` biases toward raids, `rival.ts:194`) is untouched.
5. **Temper says why.** `RivalState.hostilityCause` (additive) holds the latest rise: `{ kind: 'scheme' | 'countered', placeId?, tick }`. The panel line reads *"Toward you: aggressive. Its scheme against Ashford is under way."* or *"Toward you: wrathful. You broke its scheme against Iron Glade."* After `RIVAL_HOSTILITY_CAUSE_STALE_DAYS` (3) days with no rise: *"Toward you: hostile, and cooling."* With no cause yet: *"Toward you: hostile, as rival gods are."*
6. **The name stops pretending to be a link.** Rivals are run state, not graph nodes, so the name has no sheet to open. It becomes a plain disclosure: primary text colour, no underline, a ▸/▾ chevron. It stays clickable (Law 21), and it opens the only surface a rival has. The gold underline was the router's cross-link look, and it promised a page that does not exist. The opened entry becomes the rival's sheet. It holds its spheres and temper, the cause line, the last place it pressed (a place link with "today" / "yesterday" / "{n} days ago"), and the answer line: *"Places you tend shrug off its hand. Your seat, your threaded, a claim, or an anointed faction tends one."* The line names all four ways the engine tends (`TendedBy`, `engine/dominion.ts:81`), in the same words as the held toast. Claim is kept even though Claim Dominion (`hex.claim_dominion`) comes only with the held-ground milestone, at `MILESTONE_HELD_GROUND_FLOWERING` (2) flowering sources (`data/ascendant-milestone-beats.ts:154-165`). The seat and the threaded First are what every god has from the start.
7. **The Chronicle names the rival.** `composeDominionChronicle` and `dropLine` look rival names up in `rivalDefinitions` first, then the graph. Unknown → the line falls back to the untended wording, never a raw id (Law 14).

Rejected, one line each. **A new "ward against rival" card:** green-field while the existing answer is invisible; a later slice if round 4 still finds no answer. **A rival graph node with its own Inspector page:** a new node type needs Christian (load-bearing decision), and the disclosure carries what a page would. **Removing rival toasts entirely:** the ticket's testers wanted more about rivals, not less. **Hostility decaying to zero:** a rival god is never a friend; the floor is "hostile".

**Not in this slice:** the scheme cards' counter hint ("break it by threading someone at Ashford"), which `detectSchemeCounter` could feed. It waits for round 4, so we learn whether the raid answer alone lands first. Filed as a follow-up note on the ticket, not a deferral in code.

## Content pillar

New entries in `data/rival-content.ts` (`RIVAL_LANDING_LINES`) and `data/ui-content.ts` (`ui.rival.*`). Each is one or two sentences of at most 15 words and passes `tooltipValidation.test.ts`.

| Key | Words |
|---|---|
| `landed` | "{rival} pressed {Sphere} on {place}. Tend it and the next blow breaks." |
| `absorbed` | "{rival} pressed on {place}, but your {tender} held it." |
| tender words | claim → "claim", seat → "seat", carry → "thread", anointed → "anointed faction" |
| `ui.rival.cause_scheme` | "Its scheme against {place} is under way." |
| `ui.rival.cause_countered` | "You broke its scheme against {place}." |
| `ui.rival.cause_cooling` | "and cooling" (joins the temper word: "hostile, and cooling.") |
| `ui.rival.cause_none` | "as rival gods are" |
| `ui.rival.last_pressed` | "Last pressed {place}, {when}." |
| `ui.rival.answer` | "Places you tend shrug off its hand. Your seat, your threaded, a claim, or an anointed faction tends one." |
| `ui.rival.temper` (hover) | "How this god feels about you. It rises when its schemes run or you break them, and cools when nothing happens." |
| `ui.rival.cause_scheme_noplace` | "Its scheme is under way." (fallback when the place no longer resolves) |
| place fallback | "a place of yours" (reuses `dropLine`'s existing words) |

`{Sphere}` is the sphere's display word. `{when}` uses "today", "yesterday", and day counts in words via `countWord` (`engine/aftermathWords.ts`) (Law 13).

## Engine pillar

- **E1 — `landRivalProbe`** returns `{ placeId, sphere, tendedBy: TendedBy[] | null } | null`. It is null when throttled, without turf, or on a throw. `tendedBy` comes from the tending index it already builds.
- **E2 — `rivalProbeMove`** keeps the flavour `rng()` draw (discarded), calls `landRivalProbe`, and pushes the toast only on a non-null result. It writes `RIVAL_LANDING_LINES.landed` or `.absorbed` with `refs: [{ kind: 'location', id: placeId }]`, and sets `rivalState.lastPressed = { placeId, tick }` (additive).
- **E3 — temper.** `createRivalState` uses `RIVAL_HOSTILITY_START`. The scheme-beat rise also sets `hostilityCause = { kind: 'scheme', placeId: target, tick }`. A `detectSchemeCounter` hit that stalls or fails a scheme adds `RIVAL_HOSTILITY_ON_COUNTER` and sets `{ kind: 'countered', placeId, tick }`. Once a day (`tick % TICKS_PER_DAY === 0`), a rival with no rise that day cools by `RIVAL_HOSTILITY_COOL_PER_DAY`, floored at the start value. Pure helper `coolRivalHostility(state, tick)` in `engine/rival.ts`.
- **E4 — names.** `composeDominionChronicle` takes a `rivalName(id)` lookup built from `state.rivalDefinitions`. `diffDominionDrops` / `dropLine` take the same lookup (from `simulationRuntime.ts:818`). An unresolved name uses the untended template.

No new tick phase, no new node or edge type, no new PRNG draw.

## UI pillar

- **U1 — `notificationRouter.deriveNavigationTarget`:** `rival_action` with a `location` ref opens `{ kind: 'location', locationNodeId }`.
- **U2 — `RivalPanel`:** replace `RIVAL_NAME_STYLE` with the disclosure style (primary text, chevron, `aria-expanded` kept). The opened entry draws, in reading order: the spheres line, the temper line with its cause (decision 5), the last-pressed line with the place as an `EntityLink`, then the muted answer line. Test ids `rival-cause`, `rival-last-pressed`, `rival-answer`.
- **U3 — temper hover:** the temper word carries `ui.rival.temper` hover: *"How this god feels about you. It rises when its schemes run or you break them, and cools when nothing happens."*

### Player-facing text

| Surface | Exact text | Complaint class | How the player understands it |
|---|---|---|---|
| Raid toast | "The Hollow Warden pressed Death on Iron Glade. Tend it and the next blow breaks." | PC-9 (a threat seen but not answered) | Where it landed, which sphere, and what stops it. Click opens Iron Glade's page. Its Act block lists the god's cards that target that place: **Bind Thread — Location** if held, and **Claim Dominion** once the held-ground milestone has granted it. Before then, the answer is to have someone you thread stand there, or the seat |
| Held toast | "The Hollow Warden pressed on Ashford, but your thread held it." | PC-9 / PC-6 | Tending works, and which kind of tending it was |
| Temper line | "Toward you: wrathful. You broke its scheme against Iron Glade." | PC-9 (why it is aimed at me) / PC-1 | Why it is angry |
| Temper hover | "How this god feels about you. It rises when its schemes run or you break them, and cools when nothing happens." | PC-1 | What the temper word measures |
| Cooling | "Toward you: hostile, and cooling." | PC-7 | Leaving it alone calms it |
| Scheme cause / no cause | "Toward you: aggressive. Its scheme against Ashford is under way." / "Toward you: hostile, as rival gods are." | PC-9 / PC-1 | What it is doing to me now; with no cause, that hostility is a rival god's nature |
| Scheme fallback | "Its scheme is under way." | PC-7 | Shown when the scheme's place no longer resolves |
| Last pressed | "Last pressed Iron Glade, two days ago." | PC-9 | Where it lands, as a link |
| Answer | "Places you tend shrug off its hand. Your seat, your threaded, a claim, or an anointed faction tends one." | PC-9 | The four ways a place is tended (`TendedBy`), the same words the held toast uses, so the two never disagree |
| Place fallback | "a place of yours" | PC-7 | A landing whose place lost its name still reads as a sentence |

### UI Laws engaged

Law 1 (the place in the toast and the panel carries its link and tooltip), Law 2 (the producer declares the ref), Law 13 (no raw numbers; temper stays a word and days are words), Law 14 (no raw ids, the Chronicle fix), Law 17 (the temper word's hover comes from the one registry), Law 21 (every named place routes through the one router; the rival's name stays clickable and opens its entry), Law 33 (the opened entry fits the panel at 1920×1080), Law 49 (fewer toasts: silent when nothing lands). Law 37 is N/A: no encounter flow is touched.

### Playtest signal

- A warm round-4 tester opens a place from a rival toast, and names one thing they did about a rival: tended a place, claimed it, or broke a scheme (the ticket's Fixed-when). No tester says they could see rival threats but not act.
- No tester says every rival is "wrathful" without a reason.

### Browser-verify tool

Playwright DOM (`mcp__playwright__*`) for the panel and toast assertions; nothing in this slice is WebGL.

### Event notifications · Debug · Map

Toast: `rival_action`, now with a location ref; at most one per landing (already throttled). Debug: `window.__DEBUG.getRivalSchemes()` already exists; add `hostilityCause` and `lastPressed` to its rival rows. Map: N/A. The raid overlay (`RivalInfluenceMesh`) is unchanged; the toast's click is the map link.

## Interface impact

| Contract | Change |
|---|---|
| `landRivalProbe` → `rivalProbeMove` | extend (return value) |
| `RivalState` → `RivalPanel` | extend (`hostilityCause`, `lastPressed`) |
| `rivalDefinitions` → `composeDominionChronicle` / `diffDominionDrops` | add (read only, name lookup) |
| `rival_action` event → `notificationRouter` | extend (location ref) |

The executor adds these to `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| rival probe toast | `phaseRivalActions` (existing) | toast → place Inspector | `rivalStates[].lastPressed` | `dominion.raid` (existing) | `getRivalSchemes()` rows |
| temper cause + cooling | `phaseRivalActions` daily block | `RivalPanel` | `rivalStates[].hostilityCause` | `rival.hostility_changed` (new) | same |
| chronicle rival names | `phaseDominion` / runtime drop diff | Chronicle, hex drop line | reads `rivalDefinitions` | none | Chronicle text |

Wiki: update the Design Reference Wiki page whose `sources` include `orchestrator.ts` rival phase or `RivalPanel.tsx`; run `check:wiki-freshness:blocking`. The systemic wiring guide's "Rival schemes (THR-66)" section gains one line: the counter rise and its cause.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `RIVAL_HOSTILITY_START` | 0.3 | A new rival's temper ("hostile"), and the cooling floor | `data/rival-scheme-config.ts` |
| `RIVAL_HOSTILITY_ON_COUNTER` | 0.08 | Rise when the god breaks one of its schemes | same |
| `RIVAL_HOSTILITY_COOL_PER_DAY` | 0.02 | Daily cooling with no rise | same |
| `RIVAL_HOSTILITY_CAUSE_STALE_DAYS` | 3 | Days without a rise before the line says "cooling" | same |

## Tracing

```ts
interface RivalHostilityChangedTrace {
  category: 'rival.hostility_changed';
  tick: number;
  rivalId: string;
  from: number;
  to: number;
  cause: 'scheme' | 'countered' | 'cooled';
  placeId?: string;
  summary: string; // "The Hollow Warden: 0.62 → 0.70 (countered at Iron Glade)"
}
```

Emitted through `emitRivalTrace`. The existing `dominion.raid` trace is unchanged.

## Fail-soft table

| Failure | Fallback |
|---|---|
| `landRivalProbe` throws | Returns null; no toast this tick (as today, nothing lands) |
| Landed place has no name | Toast uses "a place of yours" (`dropLine`'s existing fallback words) |
| `hostilityCause.placeId` no longer resolves | Cause line drops the place clause ("Its scheme is under way.") |
| `lastPressed` place gone | Line hidden |
| Rival name not in `rivalDefinitions` | Chronicle uses the untended line, never the id |
| Old save / state without the new fields | Read as undefined; panel shows the "as rival gods are" line |

## Kill criteria

- Warm round 4 still has a tester saying they could see rival threats but not act: the answer must be a card, not a sentence. Take the counter-card slice next.
- Rival toasts drop to zero in a warm run because every landing is throttled: lower `DOMINION_RAID_PLACES_PER_DAILY_BURST` in that slice, with a measured run, not here.

## Three-pillar check

- [x] Engine pillar present (E1–E4)
- [x] Content pillar present (every word in the table)
- [x] UI pillar present (U1–U3)
- [x] Wiring connects them

## Vision audit

- [x] No Vision premise is contradicted. Rivals stay generated, never a fixed pantheon. The god's answer is the existing tending verbs, and prose describes only what happened.
- [x] No Vision edit is needed.
- [x] Design tension 4 (mechanical legibility vs narrative mystery) is resolved toward legibility here, on purpose. All three testers named not knowing the answer as the problem. The rival's *intent* stays hidden: its schemes, its next target and its temper's number are not shown. Only the god's own counter-play is named.

## Rulebook impact

- [x] This plan changes a rule of play: a rival's temper now cools, and breaking a rival's scheme angers it.
- [x] The `Docs/canon/rulebook.md` edit lands in the build PR (scope of this ticket, not a follow-up). The build PR adds two sentences to the **Dominion — your home turf** paragraph of `Docs/canon/rulebook.md` (`:210`, after "rival gods press on it"): *"A place you tend shrugs off their hand. A rival's temper rises when its schemes run or you break them, and cools when nothing happens."* `rulebook-quick-reference.md` gets the same line if it lists rivals.

> Brainstorm companion: `Docs/plans/2026-11-06-thr-2172-a-rival-move-has-a-place-and-an-answer-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Four named constants; words in the registries |
| 2. Inspectability | PASS | New `rival.hostility_changed` trace; debug rows carry cause and last place |
| 3. Determinism | PASS | No new draw; the flavour draw is kept and discarded so the stream is unchanged |
| 4. Fail-soft | PASS | Table above |
| 5. Narrative over mechanical perfection | PASS | Toast prose says what happened, not invented plague |
| 6. Additive over destructive | PASS | Additive state fields; flavour table kept |
| 7. Performance budget | PASS | One daily loop over three rivals |

## Done when

- [ ] Unit: `rivalProbeMove` pushes no `rival_action` toast when `landRivalProbe` returns null, and one toast with a `location` ref when it lands. The absorbed case names the tender word.
- [ ] Unit: the seeded rng stream after `rivalProbeMove` matches main's (the discarded draw is kept).
- [ ] Unit: `createRivalState` starts at 0.3; a scheme beat sets `hostilityCause.kind === 'scheme'`; a counter adds 0.08 and sets `'countered'`; `coolRivalHostility` lowers by 0.02 a quiet day and never below 0.3.
- [ ] Unit: `composeDominionChronicle` with a rival drop prints the rival's definition name; an unknown id gives the untended line; no output contains `actor_rival_`.
- [ ] Unit: `deriveNavigationTarget` on a `rival_action` with a location ref returns that location.
- [ ] Browser evidence, four parts, on `?view=game&seeded&size=medium&warm=300` at 1920×1080: screenshot of the Rival gods panel with one entry open showing `rival-cause`, `rival-last-pressed` (if a landing happened) and `rival-answer`; console output; `await window.__DEBUG.getRivalSchemes()` rows carrying `hostilityCause`; a UI-Laws line covering Laws 1, 13/14, 17, 21, 33, 37.
- [ ] Warm-300 measurement recorded in the PR body: each rival's temper on main and on the branch. On the branch, no rival reads "wrathful" unless `hostilityCause.kind === 'countered'` was set at least once.
- [ ] The rival name in the panel has no underline (`getComputedStyle(...).textDecorationLine === 'none'`).
- [ ] `rulebook.md`, `interface-map.md`, `scripts/interface-contracts.ts` and the wiring guide carry their lines.
- [ ] `npm run gate` green; the review gate has passed (engine files).

## Coordination block

**Suggested model:** opus. It edits the 163-importer orchestrator, and the stream-preserving draw is easy to get wrong.
**Parallel-safe with:** [the rail rows say what they are](https://linear.app/threadbare/issue/THR-2183), [room for the god-rail hand](https://linear.app/threadbare/issue/THR-2177) and [a good-odds step that misses says so](https://linear.app/threadbare/issue/THR-2180). None touches the rival phase, the rival panel or the dominion chronicle.
**Mutex with:** ["While you were away"](https://linear.app/threadbare/issue/THR-2184), because both read the dominion drop records and that plan says not to name the rival until this lands. Build this one after it, then the recap may name rivals in a later pass.

**Files to touch:** `src/engine/orchestrator.ts`, `src/engine/rival.ts`, `src/types/rival.ts`, `src/data/rival-scheme-config.ts`, `src/data/rival-content.ts`, `src/data/ui-content.ts`, `src/engine/notificationRouter.ts`, `src/engine/phaseDominion.ts`, `src/engine/dominionProjection.ts`, `src/engine/simulationRuntime.ts`, `src/components/Game/RivalPanel.tsx`, `src/debug-bridge.d.ts` + its implementation, their tests, `Docs/canon/rulebook.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`.

## Notes for the executor

- Line numbers are from `main` @ `1c67e898`.
- The headless world (no bonded First) never launches schemes or lands probes in 360 ticks, so measure in the browser warm build.
- **Measure the warm climb first, before changing numbers.** On main, run `?view=game&seeded&size=medium&warm=300` and record each rival's `hostilityToPlayer`. Grep finds one stored writer: the scheme beat, +0.03 (`orchestrator.ts:2453-2458`). From 0.5, "wrathful" (≥ 0.75) takes nine beats, about two and a quarter schemes. If the warm build shows a climb that nine beats cannot explain, a writer is missing from this plan. Find it, add it to E3 and note it in the PR. From the new 0.3 start, "wrathful" takes fifteen beats, or fewer counters, with cooling between them.
- The god's cards for a place: check that the place page opened from the toast lists Bind Thread — Location and Claim Dominion when the god holds them. If the page shows neither when the god holds them, that is a routing bug in this slice, not a follow-up.
- `detectSchemeCounter` has a source-family branch (THR-621) whose target is the player's own property. The counter rise applies there too (the Defend leg is the god's act).

## Forked-audit verdicts

| Axis | Verdict | Note |
|---|---|---|
| NFP | PASS-with-notes | Two existing behaviours change on purpose: the start temper goes from 0.5 to 0.3, and the toast moves after the landing. Both are stated as decisions, and stored saves keep their temper. All other rows PASS |
| Three-pillar | PASS-with-notes → fixed | No Playtest signal subsection and no browser-verify tool named. Both are added (Playwright DOM). Wiring connects every pillar; it extends Rival Gods & Schemes and Dominion tending, with no green-field |
| Vision | PASS-with-notes → recorded | It leans on legibility over mystery (design tension 4) by stating the counter-play flatly. Recorded in the Vision audit as deliberate: the rival's intent stays hidden and only the god's own answer is named. Nothing goes to Christian |

### Intent-judge verdict

First run: **Revise** (Reversible). There were three player-legibility gaps. The ticket's own complaint class PC-9 was not cited, and the card on the opened place was not quoted. The temper hover and the fallback words were missing from the tables. There was no Playtest signal. The substrate gap: the warm-build hostility climb was not measured. All four are fixed: PC-9 rows naming Bind Thread — Location and Claim Dominion (milestone-granted), an honest answer line, the table rows, Playtest signal, and an executor measure-first note with a Done-when row.

Second run: **Revise**. The answer line named three ways to tend, while the held toast can name a fourth (an anointed faction), so one fact read two ways (PC-6). Fixed: the line now names all four `TendedBy` kinds in the toast's words, and the scheme-cause and no-cause temper lines joined the table. Third run: **Allow** (Reversible). Advisory: the executor records Law 37 as N/A in the UI-Laws line.
