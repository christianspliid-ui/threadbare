> **title:** Terms explain themselves where the player meets them — THR-1807
> **linear_issue:** THR-1807
> **author:** Claude Code (tb-design-lane, unattended, 2026-10-11)
> **created:** 2026-10-11
> **three_pillars:** Engine done (one additive agent property) · Content done (registry copy, setup and hand lines) · UI done

# Terms explain themselves where the player meets them — THR-1807

*Three cold-playtest rounds in a row, all three testers list the same words under "never understood". This plan stops fixing terms one at a time and gives the game one rule for where a term is learned.*

## Why this is load-bearing

Complaint class PC-1 (unexplained resources, terms and odds) is the oldest open class in [`Docs/ops/player-complaint-classes.md`](../ops/player-complaint-classes.md). Round 1 filed THR-1607, round 2 filed THR-1713, and both shipped: about 40 registry tooltips, essence rows that hover, card marks that hover. Round 3 (2026-10-10) still logged 12–13 never-understood terms per tester. The survey below shows why. The registry exists and is mostly correct. What fails is **reach** and **timing**:

- Two top-bar terms (World-Soul, Omen) bypass the registry with a raw `title`. That breaks Law 17 and gives a one-line hint, not an explanation.
- The whole right-hand group (Doom, Omen, World-Soul, Attention) goes `inert` while any encounter veil is open. Hover does nothing, and it looks disabled. Testers spend most of their first ten minutes inside veils, so for them Doom and Omen were "disabled during play".
- Two side-bar sections (Signatures, Hooks) carry no tooltip at all, and three (Signatures, Covenants, Hooks) render as empty headers with a placeholder line before the player holds anything.
- Four things the game does are never said *before* they happen: what the sphere pour changes, that a miss can write the opposite trait, which sphere a Reach bills, and who is holding the clock.
- Two things are said in a way that contradicts another surface: the aftermath names a domain tier-up that the mortal's card does not list (PC-6), and the picker shows a portrait with no name.

The design question on the ticket was: *what is the one consistent way a new player learns a term the first time it matters, and which terms must be learned in the first ten minutes versus hidden until they matter?* The answer is § The rule below, and every action item is an instance of it.

## The rule

1. **Every word the player reads as a game concept explains itself in place.** It explains itself on hover and on keyboard focus, through the one registry (`resolveTooltip`, Law 17), with copy that says *what it does to your game*, not only what it is (Law 18). It still explains itself when the control cannot be clicked: a surface that is not clickable stays hoverable and says why (Law 25).
2. **A risk or a price is said before the player commits to it, on the surface where they commit.** It is never said only afterwards, and never only in a tooltip.
3. **A rank word shows that it is a rank.** Where a word is one rung of a ladder, a visible rung marker sits beside it, so "Blinkered" reads as "first of five" without a hover (Law 13 amendment: a visual magnitude, not a numeral).
4. **A section with nothing in it does not render** (Laws 25 and 53). The term arrives with the first thing it names.
5. **Two surfaces never disagree** (PC-6). If the aftermath names it, the card that lists that mortal's domains shows it.

**First ten minutes vs later.** Learned now, so explained the first time they show: the clock (TIME), essence and the spheres, Doom, The First's thread, and the hand's odds. Arrive later, and explained when they arrive: Omen (already hidden until the first omen, THR-1648), the Reaches tiers (shown from the start, but readable as ranks under rule 3), and Signatures, Covenants and Hooks (rule 4). *Investiture* and the order in which the post-bond dashboard reveals itself belong to [THR-1808](https://linear.app/threadbare/issue/THR-1808). Rule 4 is the baseline that THR-1808's reveal table extends; it does not replace it.

## Substrate inventory

Measured on `origin/main` 1ed28336 (2026-10-11). Commands and output are in the brainstorm companion § Measurements.

| Existing subsystem | Status | This plan |
|---|---|---|
| Tooltip registry (`src/engine/tooltipResolver.ts:97`, `src/data/ui-content.ts:50` `UI_TOOLTIPS`, ~183 entries; `src/components/shared/Tooltip.tsx`, 175 call sites in 79 files) | 🟢 ACTIVE | **extends**: seven new `ui.*` entries, three rewritten. Two raw-`title` call sites move onto it. |
| Reach tier words + tooltips (`src/data/ascendant-reach-register.ts:41,116,125`) | 🟢 ACTIVE | **extends**: a rung marker beside the word in `ReachesBlock.tsx:84-94` and `AscendantSheet.tsx:430-436`. Copy unchanged. |
| Top-bar inert group (`GameViewTopBar.tsx:261-265`, `TOPBAR_INERT_OPACITY` :33) | 🟢 ACTIVE | **replaces** `inert` with a click guard. Hover stays live, and the tooltip names why it can't open. |
| Clock-hold label (`SimulationControls.tsx:83-84`; `heldBy` set only for a veil, `GameView.tsx:5389-5391`) | 🟢 ACTIVE | **extends**: `heldBy` is filled for every interrupt from a holder-name table. |
| Side-bar sections (`AscendantBar.tsx:195-265`) | 🟢 ACTIVE | **extends**: Signatures, Covenants and Hooks render only when their count > 0. Signatures and Hooks get `tooltipId`s. |
| Sphere point-buy (`src/components/Remembrance/SpheresStep.tsx`; copy `src/data/sphere-points-content.ts:72-83`; income `spherePoints.ts:135-147`; upkeep `essenceIncome.ts:96`) | 🟢 ACTIVE | **extends**: one consequence line. No rule changes. |
| Meeting formative test (`meetingEncounter.ts:768-784` `resolveWrittenPole`; hand `NudgePhaseShell.tsx:446-500`; host `FormativeTestBeat.tsx:249-254`) | 🟢 ACTIVE | **extends**: a pre-commit line in the hand bar. No rule changes. |
| Premonition cost (`PremonitionModal.tsx:110-114` `premonitionCostLabel`; `REACH_TO_SPHERE` `premonition-constants.ts:151-160`) | 🟢 ACTIVE | **extends**: names the Reach's sphere. |
| Mortal picker (`src/components/MeetTheFirst/SensingBeat.tsx:129-182`; `NarrativeCandidate.name`/`epithet` `types/meetingEncounter.ts:225-262`) | 🟢 ACTIVE | **extends**: name + epithet on focus. |
| Capability growth + info card (`unifiedActionResolution.ts:2341-2375`, `encounter.ts:609-628`; `agentDetail.ts:1697-1709`) | 🟢 ACTIVE | **extends**: the resolution site records the last tier crossing on the agent, and the info card always includes that domain while it is recent. |

No new system, node type or edge type.

## Engine pillar

### Systems design

One additive write and one additive read. Both keep the card and the aftermath telling the same fact (rule 5).

- **Write.** At both growth call sites (`unifiedActionResolution.ts` inside `if (growthResult.tierCrossed)` near :2368, and the legacy road inside `if (growth.tierCrossed)` at `encounter.ts:628`), set the actor node property `lastTierCross = { domain, tick }` and call `touchWorld()`. `applyEncounterGrowth` itself is not changed (it has no `tick`, and [THR-1580](https://linear.app/threadbare/issue/THR-1580) is re-fitting its readers).
- **Read.** `getAgentInfoCard` (`agentDetail.ts:1697-1709`) builds `sortedDomains.slice(0, domainCount)` as today. If `lastTierCross` exists, `tick - lastTierCross.tick <= RECENT_TIER_CROSS_WINDOW_TICKS`, and the domain is not already in the slice, it **appends** that domain as an extra row. It does not replace the lowest row. The extra row carries `recentTierCross: true` so the UI can mark it.
- This applies at every knowledge level that shows domains at all (`recognised` and above). It also applies at `recognised`, where `domainCount` is 1, because the aftermath names the domain regardless of knowledge level.

### Graph nodes / edges

No new node or edge type. One new optional **node property** on agent nodes, `lastTierCross?: { domain: ReachDomain; tick: number }`. It is a fact about the agent, not a relationship, so it is a property (the load-bearing decision on edges does not apply). Register it beside the other agent properties in `src/types/graph.ts` if agent properties are typed there.

### Tick phases

The write happens during step resolution, which is the same phase as the growth it records. The read happens on render. No new phase.

### Resolution logic

None changed. Growth amounts, tiers, the pole written by a meeting test, the income split and upkeep billing are all untouched.

### PRNG callouts

None. No random draw is added or moved. In particular, `resolveWrittenPole`'s coin keeps its branch-only draw (`meetingEncounter.ts:776-779`).

## Content pillar

### Data tables

All copy lives in data files. Components pass ids or read constants (Law 17).

**Registry entries (`src/data/ui-content.ts`), new or rewritten.** Each is ≤200 characters (Law 18, gated by `tooltipValidation.test.ts`):

| Id | Label | Desc |
|---|---|---|
| `ui.doom_bar` *(rewrite)* | Doom | `A slow clock toward the world's unmaking, in five stages. It wakes when you bond The First and cannot end the world early. Open it to see what it is building toward.` |
| `ui.omen` *(new)* | Omen | `A passing sign of what presses on the world, most often an echo of the doom. It lasts a few days and colours what the world brings up while it does.` |
| `ui.world_soul` *(new)* | World-Soul | `The world's mood right now: the sphere its people and places lean toward most. It shifts as the world changes. You read it; you do not spend it.` |
| `ui.attention` *(new; replaces the inline `ATTENTION_TOOLTIP_DESC` label/desc pair at `AttentionPoolIndicator.tsx:96`)* | Attention | `How much of your notice is free. Attending a moment draws on it, and it refills on its own as time passes. Nothing to click: it is a gauge.` (today's `ATTENTION_TOOLTIP_DESC`, `AttentionPoolIndicator.tsx:17-18`, moved verbatim into the registry; the live label stays a per-render override, so the hover reads exactly as today) |
| `ui.signatures` *(new)* | Signatures | `The powers your Reaches have settled into. A path settles as you act in its Reach; open one to see what it lets you do.` |
| `ui.hooks` *(new)* | Hooks | `Marks, clues and vows that tie you to something unfinished. Each one points at a thread you can still pull.` |
| `ui.essence.row` *(rewrite: one clause appended)* | (unchanged) | existing text + ` What you pour decides which pools refill fastest.` (the setup line's exact words, PC-6). Rendered in full (≈180 characters): `The power you have to spend in this sphere. Casting a card of this sphere draws it down, and the pool refills slowly with time. What you pour decides which pools refill fastest.` If that pushes the copy over 200 characters, trim the existing sentence rather than dropping the clause. |
| `ui.clock_held` *(new)* | Held | `Time stops while you read. It runs again when this closes, at the speed you left it.` |
| `ui.step_test` *(new)* | This step's test | `Which of her skills this step tests, and how good she is at it. It is not a change: her skill only moves in the aftermath.` |

**Holder names (`src/data/nudge-stage-content.ts`, beside the other clock strings).** `INTERRUPT_HOLDER_NAMES: Record<InterruptKey, string>`, one row per key in `resolveInterrupts` (`GameView.tsx:4930-4948`): `meetingPending: 'meeting The First'`, `threadingRitePending: 'the threading rite'`, `premonitionPending: 'a premonition'`, `vignettePending: 'a vision'`, `storyBeatPending: 'a story beat'`, `ascendantBeatEntered: 'a beat of your story'`, `choiceSetPending: 'a choice'`, `emergenceDecisionPending: 'a new power'`, `divineReceiptPending: 'what your act bought'`, `momentPending: 'a moment'`, `chapterLedgerOpen: 'the Chapter Ledger'`, `courtOpen: 'your court'`, `popupQueued: 'a message'`, `warmStartRunning: 'the world settling'`. An encounter veil uses its header title, as today.

**Clock label templates (same file):**
- `CLOCK_HELD_RUNS_ON = 'held by {holder} · runs on when it closes'`
- `CLOCK_HELD_STAYS_PAUSED = 'held by {holder} · stays paused'`
- `CLOCK_HELD_FALLBACK_HOLDER = 'this window'`

**Setup line (`src/data/sphere-points-content.ts`):**
- `pourMeaning: 'Every pool starts the same. What you pour decides which pools refill fastest, and your deepest sphere pays your upkeep.'`

**Hand line (`src/data/meeting-nudge-constants.ts` or the nudge stage content file the hand already reads):**
- `MEETING_MISS_FLIPS_LINE = 'On a miss, she may become {opposite} instead.'`
- `MEETING_MISS_FLIPS_LINE_UNLEANED = 'With no lean, fate picks which way she goes.'`

**Premonition cost (`src/data/premonition-content.ts`):**
- `PREMONITION_REACH_SPHERE_NOTE = '{Reach} draws on {Sphere}'`

### Encounter templates / Prose tables / Attachment content

N/A. No encounter, prose table or attachment changes. Every line above is UI microcopy (Law 42: it explains mechanism).

## UI pillar

*Screenshot tool: Playwright (DOM). Every surface here is DOM. The hex map is not touched.*

### Player-facing display

1. **Top bar stays explainable inside a veil** (`GameViewTopBar.tsx:261-265`). Drop `inert`. Keep `aria-disabled` and the dimmed opacity. Guard each click handler (`setDoomDetailOpen`, `OmenIndicator`'s `setDetailOpen`) with `if (encounterOpen) return;`. Hover and focus tooltips still render: the tooltip portal sits at `zIndex: 70+` (`Tooltip.tsx:471,476`), above the veil's 50. While `encounterOpen`, the Doom and Omen tooltips append the line from rule 1: `Opens when this chapter closes.` (`TOPBAR_LOCKED_SUFFIX` in `ui-content.ts`). A guarded press opens nothing; the focused tooltip with that line is its reply, shown within the same second (PC-8). The panels themselves still do not open under the veil, which keeps the reason at `GameViewTopBar.tsx:49-53`.
2. **World-Soul and Omen use the registry.** `WorldSoulIndicator.tsx:59` and `OmenIndicator.tsx:110` replace their raw `title` with `<Tooltip id="ui.world_soul">` / `<Tooltip id="ui.omen">`. The omen's live name goes in as the tooltip `label` override (`Omen — {name}`), and the desc comes from the registry. `AttentionPoolIndicator.tsx:97` switches to `<Tooltip id="ui.attention" label={tooltipTitle}>`: the desc comes from the registry, and the live label (`Attention: {pool} / {cap} ({State})`, built at :94) stays as the override, the same pattern as Omen.
3. **Reach tiers read as ranks** (`ReachesBlock.tsx:84-94`, `AscendantSheet.tsx:430-436`). After the tier word, render a five-step rung marker: filled steps up to and including the current rung, hollow after it (`●○○○○` for the first rung). Use the existing delta-cluster styling family from the THR-1082 amendment; no numeral. The marker sits inside the same `<Tooltip id={reachTierTooltipId(...)}>`, so the existing "The first of five rungs…" copy explains it.
4. **Empty sections do not render** (`AscendantBar.tsx`). Signatures, Covenants and Hooks render only when `count > 0` (`yourSignatureCount`, `covenantRows.length`, `hookCount`). Signatures gets `tooltipId="ui.signatures"`, Hooks `tooltipId="ui.hooks"`. Their `placeholder` props become dead and are removed. Their fold defaults (`ASCENDANT_BAR_SECTION_DEFAULT_OPEN`) are unchanged.
5. **The clock names who holds it** (`SimulationControls.tsx:83-84`, threaded through `GameViewTopBar.tsx:215` as today). GameView computes `clockHeldBy` for *every* held state. It uses the veil title when a veil holds the clock; otherwise `INTERRUPT_HOLDER_NAMES[interruptResolution.open[0]]`; otherwise `CLOCK_HELD_FALLBACK_HOLDER`. `SimulationControls` renders `CLOCK_HELD_RUNS_ON` when the clock was running before the hold, and `CLOCK_HELD_STAYS_PAUSED` when it was paused. The label carries `<Tooltip id="ui.clock_held">`. The old `paused · {title}` / `held · runs on after` / `held · stays paused` strings go away. [THR-1806](https://linear.app/threadbare/issue/THR-1806)'s `answerStatus` slot applies only when the clock is *not* held, so the two do not overlap. See § Coordination for build order.
6. **The pour says what it does** (`SpheresStep.tsx`). `pourMeaning` renders as one line directly under the `prompt`, always visible, in the step's secondary text style.
7. **The hand says a miss can flip her** (`NudgePhaseShell.tsx` hand bar, :446-500). A new optional prop `missLine?: string` renders one line directly above the commit button (`data-testid="nudge-commit"`, :481), in the same style as the forecast shift note. `FormativeTestBeat.tsx` passes it:
   - When the played hand leans to pole *X*, it renders `MEETING_MISS_FLIPS_LINE` with `{opposite}` as the other pole's player-facing label. That is the same label the reveal writes, which is `data-written-pole` at `FormativeTestBeat.tsx:279`.
   - When the hand leans nowhere, it renders `MEETING_MISS_FLIPS_LINE_UNLEANED`.
   - The line updates as cards are played. Compute the lean with the engine's own lean helper; export it if it is module-private (additive).
   - Other hosts (`ThreadingRite`, `BondBeat`, chapter steps) pass nothing, because they write no pole.
8. **The cost names the Reach's sphere** (`PremonitionModal.tsx:110-114`). `premonitionCostLabel(cost, sphere, reach?)` appends ` · {Reach} draws on {Sphere}` when the row came from a Reach and its sphere is that Reach's (`REACH_TO_SPHERE`). The sphere word is wrapped in `<Tooltip id="sphere.{sphere}">`.
9. **The picker names the person** (`SensingBeat.tsx:129-182`). A focused candidate shows `{name}` as a title line and `{epithet}` under it, above `vignetteText`. Every candidate button gets `aria-label="{name}, {epithet}"`. An unfocused portrait shows nothing new: the sensing stays a first look, and a name arrives with focus.
10. **The card shows the domain the aftermath named** (`agentDetail.ts` row flag `recentTierCross`). The mortal's info card renders the appended row with a small "new tier" mark, using the same word the aftermath uses (`aftermathWords.ts:662-673`).
11. **The per-step test chip says it is a test, not a change.** The THR-1724 layout's step chip (e.g. "Eye · Seer"; locate via `src/components/Game/__tests__/encounterLayoutPassThr1724.test.tsx`) wraps in `<Tooltip id="ui.step_test">`.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Top bar Doom (hover, during play) | "**Doom** — A slow clock toward the world's unmaking, in five stages. It wakes when you bond The First and cannot end the world early. Open it to see what it is building toward." | PC-1 | It answers the testers' question ("is Doom a game-over timer?") honestly: it is a slow clock, and it cannot end the world early. |
| Top bar Doom (hover, veil open) | the same + "Opens when this chapter closes." | PC-1, PC-8 | The control is not broken; it waits on the chapter. |
| Top bar Omen | "**Omen — The Drowned Bell** — A passing sign of what presses on the world, most often an echo of the doom. It lasts a few days and colours what the world brings up while it does." | PC-1 | It says what an omen is, how long it lasts and that it echoes the doom; the live omen's name stays in the label. |
| Top bar World-Soul | "**World-Soul** — The world's mood right now: the sphere its people and places lean toward most. It shifts as the world changes. You read it; you do not spend it." | PC-1 | It says it is a reading of the world, not a resource to manage. |
| Top bar Attention | "**Attention: 3.0 / 5.0 (Focused)** — How much of your notice is free. Attending a moment draws on it, and it refills on its own as time passes. Nothing to click: it is a gauge." | PC-1 | It says what fills and drains it, and that it is a gauge, not a button. |
| Side bar Reaches | "Eye · Blinkered ●○○○○" (hover: existing "Eye — Blinkered · The first of five rungs of your hold on Eye. Every working you cast in Eye deepens it; at Watching, new workings open to you.") | PC-1 | The rung marker shows the rank without a hover; the hover says how to climb. |
| Side bar Signatures / Hooks | the header appears only once one exists; hover text quoted in § Data tables | PC-1, PC-7 | Nothing to puzzle over before it means anything. |
| TIME readout | "held by the Chapter Ledger · runs on when it closes" / "held by Decipher Old Markings · stays paused" (hover: "Time stops while you read. It runs again when this closes, at the speed you left it.") | PC-1, PC-4 | It names who stopped time and what happens next, so the player does not read it as their own pause being undone. |
| Spheres setup | "Every pool starts the same. What you pour decides which pools refill fastest, and your deepest sphere pays your upkeep." | PC-1, PC-6 | It answers "I poured into Mind but every pool started at 50"; the essence-row hover ends with the same sentence, "What you pour decides which pools refill fastest." (PC-6). |
| Meeting hand, above commit | "On a miss, she may become Judgemental instead." / "With no lean, fate picks which way she goes." | PC-1, PC-2 | The stake is read before the roll; the reveal then names the same pole word (PC-2: the result follows from the stake). |
| Premonition cost | "1 Life essence · Gold draws on Life" | PC-1, PC-6 | The cost row names both halves; the sphere word hovers the sphere. |
| Mortal picker (focused) | "**Elara** / merchant's daughter, sharp-tongued, restless" then the vignette | PC-1, PC-7 | The player picks a person, not a painting. |
| Mortal info card | an extra row "Gold · Bartering — new tier" right after the aftermath said her Gold reached a new tier | PC-6 | The two surfaces now agree. |
| Encounter step chip (hover) | "**This step's test** — Which of her skills this step tests, and how good she is at it. It is not a change: her skill only moves in the aftermath." | PC-1, PC-6 | "Eye · Seer" then "Gold · Naive" reads as two tests, not as her changing. |

PC-3 (developer text) is not touched: every string above is authored, and the two templates fill only `{holder}`, `{opposite}`, `{Reach}` and `{Sphere}`. Each slot has a fallback in § Fail-soft, so no raw token can render (Law 43).

### Playtest signal

A round-4 tester who poured into a sphere can say what the pour changed. A tester who hovered Doom can say whether it can end the game early. A tester who saw "Judgemental" after leaning "Perceptive" can say why. Equivalently, the ticket's own **Fixed when**: at most one round-4 tester lists the sphere pour, the Reaches tiers, Doom, Omen, the opposite-trait miss or the picker portraits under "never understood".

### Event notifications

None. No toast, alert or chronicle line is added. Guarded top-bar clicks reply through their tooltip (item 1).

### Debug inspection

- `window.__DEBUG.getClockHold()` (new, in `src/debug-bridge.ts` + `.d.ts`, async like its neighbours). It returns `{ held: boolean, holder: string | null, runsOnAfter: boolean | null }`, the same values the readout renders.
- The agent info card's `recentTierCross` row is visible through the existing agent-card accessor. No new accessor is needed for it.

### Visual presence (HexMapV2)

N/A. No map signifier changes.

## Interface impact

| Contract | Action | Notes |
|---|---|---|
| step resolution → agent node property `lastTierCross` → `agentDetail.getAgentInfoCard` | **add** | Producer: `unifiedActionResolution.ts` / `encounter.ts`. Production read site: `agentDetail.ts:1697-1709` (named, same change). Register the row in `scripts/interface-contracts.ts` and `Docs/canon/interface-map.md`. |
| `resolveInterrupts().open` → `clockHeldBy` → `SimulationControls` | **extend** | It was veil-only; now every interrupt key maps to a name. |
| `UI_TOOLTIPS` registry → top bar / side bar / readout | **extend** | Seven new ids, three rewritten. `conceptTooltipIds.test.ts` gates them. |
| `REACH_TO_SPHERE` → premonition cost label | **extend** | The same mapping the bill already uses (`phaseDivinePremonition.ts:379`), now also read for display. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| tier-cross record | step resolution | `AgentInfoCard` (via `getAgentInfoCard`) | agent node `lastTierCross` | existing growth trace gains `tierCrossRecorded: true` | agent card accessor |
| holder names | none (render) | `SimulationControls` via `GameViewTopBar` | none (derived from `interruptResolution.open`) | none: render-only | `getClockHold()` |
| registry entries | none | `DoomBar`, `OmenIndicator`, `WorldSoulIndicator`, `AttentionPoolIndicator`, `AscendantBar`, step chip | none | none | tooltip `data-tooltip-id` attributes |
| top-bar click guard | none | `GameViewTopBar` | none | none | `aria-disabled` |
| rung marker | none | `ReachesBlock`, `AscendantSheet` | none | none | DOM |
| pour line, miss line, cost note, picker names | none | `SpheresStep`, `NudgePhaseShell` + `FormativeTestBeat`, `PremonitionModal`, `SensingBeat` | none | none | DOM |

No orchestrator phase is added. `enrichProse()` is not involved, because these are UI microcopy strings filled by simple slot replacement with fallbacks. Wiring-checklist rows to add: the new GameState-adjacent node property (`lastTierCross`) and the new debug accessor.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `RECENT_TIER_CROSS_WINDOW_TICKS` | `48` | How long after a tier crossing the info card keeps the crossed domain listed beyond its normal top N. 48 ticks is two of the 24-tick days the aftermath and Chapter Ledger cover. |
| `REACH_RUNG_COUNT` | derived: `tierWords.length` (5) | Steps in the rung marker. Not a literal; it follows the register. |
| `TOPBAR_INERT_OPACITY` | `0.4` (existing) | Kept; it now dims a hoverable group rather than an inert one. |
| `INTERRUPT_HOLDER_NAMES` | table above | Who the readout names for each interrupt. |
| `CLOCK_HELD_FALLBACK_HOLDER` | `'this window'` | Name used when no holder resolves. |

## Tracing

```ts
// Existing capability-growth trace payload, extended (additive field).
interface CapabilityGrowthTraceExtension {
  tierCrossRecorded?: true; // set when the resolution site wrote lastTierCross this step
}
```

No new trace type. The clock-hold label is derived on render and is inspectable through `getClockHold()`.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| An interrupt key has no row in `INTERRUPT_HOLDER_NAMES` | `CLOCK_HELD_FALLBACK_HOLDER` ("held by this window · …"). A unit test asserts every `resolveInterrupts` key has a row, so this is a guard, not a path. |
| The veil header title is empty | the holder-name table, then the fallback |
| The opposite pole's label can't be resolved | render `MEETING_MISS_FLIPS_LINE_UNLEANED`'s sibling generic `'On a miss, fate may push her the other way.'` (`MEETING_MISS_FLIPS_LINE_GENERIC`) |
| A candidate has no `name` / `epithet` | show the one that exists; with neither, show nothing new (today's behaviour) |
| `lastTierCross.domain` is not a known Reach domain, or the tick is in the future | ignore it; the card renders as today |
| `REACH_TO_SPHERE` has no row for the reach, or the bill's sphere differs from the reach's sphere (an explicit `targetSphere`) | omit the `· {Reach} draws on {Sphere}` note; the cost reads as today |
| A tooltip id fails to resolve | `Tooltip` already renders its children with no popup; `conceptTooltipIds.test.ts` fails CI first |

## Three-pillar check

- [x] Engine pillar: one additive agent property, written at the two growth sites and read by the info card
- [x] Content pillar: the registry entries, holder names, setup line, hand lines and cost note, all as data
- [x] UI pillar: eleven surface changes, each quoted, with Playwright DOM evidence
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It adds no mechanic and changes no outcome. It says aloud what the game already does. The opposite-trait line keeps "forks are decided by the mortal, never by you" (quick reference § Your Resources): it tells the player the mortal can break the other way, which is that premise, stated.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play: no resource, verb, prerequisite, clock or outcome is altered. Doom's existing rule (sleeps until the bond, floor before it can end the world, rulebook quick reference § The Clocks) is what the new tooltip says.
- [x] No `Docs/canon/rulebook.md` edit is owed, because no rule changes.

> Brainstorm companion: `Docs/plans/2026-10-11-thr-1807-terms-explain-themselves-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Every string is a data constant; one window constant; the holder table is data |
| 2. Inspectability | PASS | `lastTierCross` is a flat property; the growth trace field records it; `getClockHold()` exposes the readout's inputs |
| 3. Determinism | PASS | No random draw added or moved; `resolveWrittenPole`'s coin is untouched |
| 4. Fail-soft | PASS | Every slot has a fallback (table above); the engine write is a property set behind the existing `tierCrossed` branch |
| 5. Narrative over mechanical perfection | PASS | The meeting line keeps the mortal's agency in the player's words ("she may become…") |
| 6. Additive over destructive | PASS with note | Removes the `inert` attribute and three `placeholder` lines, which is what rules 1 and 4 require. Everything else is additive. |
| 7. Performance budget | PASS | One property write on tier crossings only; render-time lookups are O(1) |

## Done when

Each bullet is a predicate (THR-688 rule A).

- [ ] Every id in the § Data tables registry list resolves through `resolveTooltip`, and `tooltipValidation.test.ts` passes (≤200 chars, no numerals).
- [ ] A new unit test asserts every key `resolveInterrupts` can return has a row in `INTERRUPT_HOLDER_NAMES`.
- [ ] A component test: with `encounterOpen`, hovering the Doom item shows `ui.doom_bar`'s desc plus "Opens when this chapter closes.", and clicking it does not open `DoomClockDetail`. Without a veil, the click opens it.
- [ ] A component test: `AscendantBar` with zero signatures, covenants and hooks renders none of the three headers; with one hook it renders Hooks with `data-tooltip-id="ui.hooks"`.
- [ ] A component test: `NudgePhaseShell` with `missLine` renders it above `nudge-commit`; `FormativeTestBeat` with a hand leaning to pole A renders pole B's label in the line.
- [ ] A unit test: `getAgentInfoCard` with `lastTierCross` set to a 4th-ranked domain inside the window lists it as an extra row with `recentTierCross: true`; outside the window it does not.
- [ ] Browser evidence at 1920×1080 on `?view=game&firstunmet&size=medium` (Playwright, DOM):
  - Spheres setup shows the pour line, then screenshot.
  - In the picker, focusing a portrait shows a name and an epithet, then screenshot.
  - In the meeting test, play one card, read the miss line above commit, then screenshot.
  - After the bond, open the Chapter Ledger: `await window.__DEBUG.getClockHold()` returns `holder: 'the Chapter Ledger'`, and the TIME readout text matches the template.
  - While a chapter veil is open, hover Doom and screenshot the tooltip above the veil.
  - Reaches rows show rung markers.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; engine files touched, so a 30-tick CLI smoke and `npm run test:heavy` pass.
- [ ] Console clean. The UI-Laws judgment line names Laws 1, 13/14, 17, 18, 20, 21, 25, 33, 37, 52, 53.
- [ ] `scripts/interface-contracts.ts` + `Docs/canon/interface-map.md` carry the `lastTierCross` row; `Docs/design-system/laws.md` Law 17 is untouched (no new prefix).

## Kill criteria

- A round-4 tester still lists Doom or Omen as never understood. Check the tester's log for a hover on the top bar. If there was none, the gap is discovery, not copy: escalate to [THR-1808](https://linear.app/threadbare/issue/THR-1808)'s first-use reveal rather than adding more tooltip text.
- A tester reads the rung marker as a numeric score, or as a health bar. Swap the marker glyph; the rule stays.

## Coordination block

**Implementation tickets:** two, filed into the *Cold playtest · round 3* milestone (Onboarding & First-Run Experience) at handoff, as the design ticket's Done-when requires:

- **A — "The map's words explain themselves"**: UI items 1–5 and 11, the registry entries, the holder names, `getClockHold()`.
- **B — "Say it before it happens"**: UI items 6–10, the Engine pillar, the interface-contract row.

**Suggested model:** sonnet for both. Every edit is anchored to a file and line; B's engine write is two property sets behind an existing branch.

**Parallel-safe with:** [THR-1810](https://linear.app/threadbare/issue/THR-1810), which only touches ambition prose data. A and B are parallel-safe with each other: A touches the top bar, side bar and readout; B touches setup, the meeting hand, premonition, the picker and the agent card.

**Mutex with:**
- **A** with [THR-1812](https://linear.app/threadbare/issue/THR-1812), THR-1806's implementation ticket. Both edit the `SimulationControls.tsx` status line and `GameViewTopBar.tsx`'s clock props; build THR-1806 first.
- **A** with [THR-1808](https://linear.app/threadbare/issue/THR-1808) once planned. Both decide what `AscendantBar` renders after the bond; rule 4 lands first, and THR-1808's reveal table extends it.
- **B** with [THR-1580](https://linear.app/threadbare/issue/THR-1580) while it is In Dev. Both edit `agentDetail.ts` and sit next to `unifiedActionResolution.ts`'s growth block.

**Files to touch:**
- A: `src/components/Game/GameView/GameViewTopBar.tsx`, `src/components/Game/GameView.tsx` (clockHeldBy), `src/components/Game/SimulationControls.tsx`, `WorldSoulIndicator.tsx`, `OmenIndicator.tsx`, `AttentionPoolIndicator.tsx`, `DoomBar.tsx`, `src/components/Game/ascendant-bar/{AscendantBar,ReachesBlock}.tsx`, `AscendantSheet.tsx`, the THR-1724 step chip component, `src/data/ui-content.ts`, `src/data/nudge-stage-content.ts`, `src/debug-bridge.ts` + `.d.ts`, tests
- B: `src/components/Remembrance/SpheresStep.tsx`, `src/data/sphere-points-content.ts`, `src/components/encounter-stage/.../NudgePhaseShell.tsx` (path as in repo), `src/components/MeetTheFirst/{FormativeTestBeat,SensingBeat}.tsx`, `src/data/meeting-nudge-constants.ts`, `src/components/.../PremonitionModal.tsx`, `src/data/premonition-content.ts`, `src/engine/unifiedActionResolution.ts`, `src/engine/encounter.ts`, `src/engine/agentDetail.ts`, the info-card component, `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`, tests

## Notes for the executor

- Do **not** change any rule: not the starting pools (`INITIAL_ESSENCE_PER_SPHERE` stays flat), not the pole write, not the bill. This plan only says aloud what the game already does.
- Do **not** open Doom or Omen panels under a veil. The guard keeps today's z-band reason; only hover comes back.
- Keep `applyEncounterGrowth`'s signature unchanged (THR-1580 is re-fitting around it). Record the crossing at the two call sites.
- The picker deliberately shows no name until a portrait is focused. Do not add names to the resting cluster.
- A design-lane decision underlies this plan (§ Decisions made by delegation), so both tickets carry `Claimable from:` 24 h after the handoff.

## Decisions made by delegation

All of the following were decided by `tb-design-lane` on 2026-10-11 under the 2026-09-11 delegation (process.md rule 4), with a veto invited in chat. None is reserved for Christian. Each one says aloud what is already built and changes no meaning.

1. The rule (§ The rule) is the answer to the ticket's design question.
2. Doom's tooltip says plainly that it is a clock toward an ending that cannot end the world early. This is honest to the rulebook, and it answers the testers' fear by stating the floor rather than hiding the clock.
3. Empty Signatures, Covenants and Hooks sections are hidden. The order of everything else after the bond is left to THR-1808.
4. The picker names a person on focus only.
5. The step chip gets a tooltip rather than a redesign.

## Intent-judge verdict

**Allow** on the third run (opus, cold context, 2026-10-11). Impact class confirmed Reversible. Runs 1–2 returned **Revise**, both on dimension 12 (player legibility), and both are folded in. Run 1 found that the essence-row clause did not match the setup line word for word (PC-6) and that the Attention tooltip text was unquoted; it also corrected the legacy growth anchor to `encounter.ts:628`. Run 2 found that moving Attention onto the registry would have dropped its live pool/cap/state label; it now stays as a label override, and the rendered sample is quoted.

## Forked-audit verdicts

### NFP audit

**NFP AUDIT: PASS-with-notes.**

- **1–5 and 7: PASS.**
  - 1: copy, `INTERRUPT_HOLDER_NAMES`, the clock templates and `RECENT_TIER_CROSS_WINDOW_TICKS` are named constants, and the rung count follows the register.
  - 2: `lastTierCross` is flat, the growth trace gains `tierCrossRecorded`, and `getClockHold()` exposes the readout.
  - 3: no random draw is added or moved.
  - 4: the fail-soft table covers every slot.
  - 5: the miss line keeps the mortal's agency.
  - 7: the write happens on tier crossings only, and lookups are O(1).
- **6: PASS-with-note.** The plan removes `inert`, the placeholders, the old clock strings and the inline Attention desc, and rewrites three registry entries. All of this is justified by rules 1 and 4, and `applyEncounterGrowth`'s signature is kept.
- **Caveat.** The home of the `lastTierCross` type is left to the executor ("if agent properties are typed there").

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.**

- **Engine: present and substantive.** One additive property, written at two growth sites and read by `getAgentInfoCard`. PRNG: none added.
- **Content: present and substantive.** The registry table, holder names, clock templates and setup/hand/cost lines, each with a fallback. Encounter, prose and attachment sections are N/A with a reason.
- **UI: present and substantive.** Eleven surfaces, a Player-facing text table mapped to PC classes, a playtest signal, `getClockHold()`, and HexMapV2 N/A with a reason.
- **Wiring and substrate.** Wiring maps each module and flags the checklist rows to add. The substrate rows all say "extends" or "replaces".
- **Notes (checks the auditor could not complete):** a full read of the 507 KB wiring checklist, and an inventory cross-check of the interrupt and clock-hold surfaces, which have no inventory row.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No direct contradiction.

- **Confirmed premises:**
  - the north star (outcome partly in the player's hands, pressure the player cannot pause);
  - the core loop (the aftermath agrees with the card);
  - non-negotiable #1 (god, not protagonist: the miss line states that the mortal decides);
  - non-negotiable #2 (narrative over mechanical perfection);
  - the taste profile's Stellaris clock (a held clock restores its prior state).
- **Soft pressure points:**
  - Non-negotiable #3 / taste profile "prose-first, no numbers": the rung marker (●○○○○) reads close to a progress bar. The plan cites the Law 13 visual-magnitude amendment but not the Vision text.
  - The Attention label "3.0 / 5.0" is numeric. This is existing behaviour, kept under the Law 13 persistent-chrome exception.
  - Design tension #4 (legibility vs mystery) is pushed toward legibility by stating the miss flip and the Doom floor before the roll. The plan frames this as stating existing rules.

**Author's disposition of the notes.**

- **The rung marker** is the visual-magnitude form Christian ratified in the THR-1082 amendment to Law 13. It replaces no word: the tier word stays the headline. The kill criterion already covers a tester reading it as a bar.
- **The Attention numerals** are unchanged existing behaviour.
- **Legibility over mystery.** The tension resolves toward legibility here because PC-1 has recurred three rounds running with 3/3 testers. What stays mysterious is the roll, not the rule.
- **The `lastTierCross` type home** is an executor decision.
- **The two auditor reading gaps** are recorded, not blocking. The wiring-checklist rows to add are named in § Wiring.
