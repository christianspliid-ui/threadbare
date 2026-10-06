> **title:** Threading as character creation — every thread plays a rite; The First is simply the first — THR-1644
> **linear_issue:** THR-1644
> **author:** Claude Code (design lane, unattended, 2026-10-06)
> **created:** 2026-10-06
> **three_pillars:** Engine done · Content done · UI done

# Threading as character creation — THR-1644

*The bonding scenes are the one part of the game every new player has called its best moment; today the player gets that scene exactly once, and every later thread is a one-line toast.*

## Why this is load-bearing

Christian, 2026-09-27 (recorded on [THR-1605](https://linear.app/threadbare/issue/THR-1605)): *"from a design perspective this is as close as you get to character creation on this game, and people LOOOOVE character creation. so in the near future the first is simply just your first threaded agent, that might start with some extra traits that mean they will have a larger chance of being a protagonist agent."*

The ticket waited for evidence from cold playtest round 2 ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md)). That round reported: **3/3 testers met and bonded their First, and all three named the bonding dilemma scenes as their best moment** (round 1: none met a mortal). The meeting works; the problem is that it happens once. Threading anyone else today (the *Agent Thread* card, `bind_thread_agent`, `src/data/unified-action-templates.ts:5421-5470`) shows only the generic cast receipt (`castReceipt.ts:47-63`): *"Agent Thread. You set it upon X: it draws a slender thread…"*. And "The First" and "first threaded agent" are two unconnected mechanisms: threading someone before the meeting does not make them The First.

This plan makes the meeting the first and richest instance of one **threading rite**, plays a shorter rite every time the god threads a mortal, makes The First literally whoever the god threads first, and gives The First a visible mark that leans them toward being the run's protagonist.

## Decisions this plan makes (design lane, under the 2026-09-11 delegation — veto in chat)

Christian's direction above is the agreed outcome; these are the *how* calls it left open. Each is recorded on [THR-1644](https://linear.app/threadbare/issue/THR-1644) with the veto words.

| # | Decision | Why | Veto words |
|---|---|---|---|
| D1 | **One rite, one writer.** The meeting's outcomes (value-pole shift, spark reach investment, scar, bond reception) are applied by one function that works on *any* mortal, new or existing. The meeting keeps creating its soul, then calls it. | Today the only writer, `createAgentFromMeeting` (`meetingEncounter.ts:958-1068`), always creates a new node; the resolvers (`resolveFormativeTest` `:806`, `resolveBondTest`) are already pure and agent-agnostic. One writer makes "every thread plays a ceremony" true without a second ceremony engine. | — (mechanism) |
| D2 | **The rite scales down by how many mortals the god has threaded.** 1st thread: the full meeting (sense three souls, two or three tests, a spark, the bond). If the 1st thread comes from the card instead: everything but sensing. 2nd–3rd thread: one formative test and the bond. 4th onward: the bond alone. | Christian asked "how does it scale down for the 5th thread vs the 1st"; the Stellaris clock halts the world for every rite, so a full four-beat rite on every cheap card would stall play (complaint class PC-5, piled-up interruptions). The First stays "the first and richest instance" (THR-1605 ruling). | "every thread gets the full rite" · "no rite after the third" |
| D3 | **The First is whoever the god threads first.** When the god holds no First, the next mortal it threads with *Agent Thread* becomes The First (and the meeting then never fires). After a Return clears the First, the next thread or the meeting names the next one. | That is the sentence Christian wrote. Every First perk already keys on `courtPosition === 'the_first'` (22 sites, below), so the rule carries all of them with no per-perk change. | "the meeting is the only way to get a First" |
| D4 | **The meeting keeps its three invented souls.** It does not switch to picking real mortals near the player. | The three authored souls are the scenes testers loved, and their vignettes are the prose quality bar (taste profile, *Meeting-encounter prose is the quality bar*). A real mortal has a fixed face, values and history the authored sensing prose cannot describe at that bar. D3 already gives the player the "real mortal" route: thread one before the meeting. | "pick the First from real people" |
| D5 | **The First carries a god's mark.** At the bond The First gains one visible trait, the god's blessing for their spark's reach (*Iron Will*, *Golden Tongue*, … the eight already written in `GOD_GIVEN_TRAITS`, `meeting-content.ts:632-642`), worth a companion's worth of skill in that reach. Later threads do not get one. | Christian: "extra traits that mean they will have a larger chance of being a protagonist agent." Threaded mortals are already never demoted from the spotlight, so the lean has to come from *competence*: more successes in their own reach mean a longer, richer story. The mark also makes "why is my First special" readable on the sheet, where today it is an invisible court flag. | "no mark" · "every rite gives a mark" |
| D6 | **A rite can be waved through.** Every rite has *Bond without a hand*: the bond still rolls, with no cards played. | The thread is the player's own act; a rite they cannot leave would turn the card into a trap. Words chosen to avoid "Let fate decide", which round-2 testers read as *skip* ([THR-1714](https://linear.app/threadbare/issue/THR-1714)). | — |

**Not decided here (out of scope):** what a thread *costs* to keep (the lane's [THR-1747](https://linear.app/threadbare/issue/THR-1747) plan owns upkeep), and the court position a carded thread starts at (`watched`, unchanged except for D3). Neither changes.

## Substrate inventory

Measured 2026-10-06 against `origin/main` 522b0c55 (Explore survey + direct reads; file:line below).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `meeting` — `meetingEncounter.ts`, `meetingFateLine.ts` | 🟢 ACTIVE | **extends**: `createAgentFromMeeting` creates the node, then calls the new rite writer. Behaviour identical for the meeting (pinned by test). |
| Formative test / bond test resolvers — `resolveFormativeTest` (`meetingEncounter.ts:806`), `resolveBondTest` | 🟢 ACTIVE, pure | **reused unchanged**; they already roll against a stand-in actor (`MEETING_TEST_ACTOR_ID`, `meeting-nudge-constants.ts:227-240`) and never read the graph |
| `bind_thread_agent` / `_strong` templates + `graphOpExecutor` thread write (`:614-681`) | 🟢 ACTIVE | **extends**: court position resolved by D3 at the write; rite queued after it |
| `hydrateThreadedIndividual` (`graphOpExecutor.ts:90-106`) | 🟢 ACTIVE | unchanged — a threaded mortal is already hydrated to spotlight |
| Trait system — `assignTrait` (`traits.ts:71`), `has_trait` → `domainCapability.ts:72-86` | 🟢 ACTIVE | **reused**; eight `bestowed` trait definitions seeded from the existing `GOD_GIVEN_TRAITS` data (today read only by the CMS registry, `components/CMS/registry.ts:1473`) |
| `MeetTheFirst` components — `FormativeTestBeat`, `BondBeat` (`src/components/MeetTheFirst/`) | 🟢 ACTIVE | **reused** by the rite via a candidate adapter; `BondBeat` gains a no-vision mode |
| `RevealCard` (`src/components/shared/RevealCard.tsx`, THR-799) | 🟢 ACTIVE | **reused** for the 4th-onward bond-only rite (`RevealCard.Frame`) |
| Interrupt registry (`src/components/Game/interruptRegistry.ts`, `useInterruptAutoPause.ts`) | 🟢 ACTIVE | **extends**: one new kind, `threading_rite` |
| `GOD_GIVEN_TRAITS` (`meeting-content.ts:632`), `sparkTraitId` (only the unmounted `MeetingEncounterModal.tsx:372`) | 🟠 DORMANT | **activates**: becomes The First's mark |

**First-only perks that D3 carries automatically** (all key on `courtPosition === 'the_first'`): shaping-tier promotion (`attentionTier.ts:26`), attend cost ×0.5 (`attentionPool.ts:39`), full visibility + pause (`types/encounterVisibility.ts:160-166`, `:386`), the journey engine (`journeyEngine.ts:385-388`, which also needs `storyPhase`), fight-death immunity (`fightEnding.ts:132-136`), harm floor (`fightHarm.ts:93-101`), premonitions (`premonitionCompulsion.ts:69`), curator 1.0 (`curator.ts:63`), court rank 3 (`phaseAgentDecision.ts:1723,1780`), doom wake (`phaseDoom.ts:317` via `isFirstBonded`), the spine `first_bonded` beat (`ascendantBeat.ts:105-131`), the spine artifact (`ascendantBeatSeeding.ts:103-123`), followed-by-default (`followedAgents.ts:62`), the gold thread line (`ThreadLineMesh.ts:30,191`). **The two fields the meeting writes that the card does not:** `storyPhase: 'call'` and `attentionMode: 'pause'` (`meetingEncounter.ts:1036-1063`). D3 writes both.

**Population:** there is no cap on threads (no limit constant found); upkeep is the brake (`TIER_MAINTENANCE`, `influence-content.ts:60-66`). The card costs 10 essence (strong: 25). No measured thread count per game exists; the rite's halting cost is therefore bounded by D2's ladder, not by an assumed count.

**Importers (blast radius check):** `graphOpExecutor.ts` 41, `meetingEncounter.ts` 43, `domainCapability.ts` 66 (read only). `traits.ts` shows 370 by name match (most are `types/traits`); this plan only *calls* `assignTrait` and edits nothing in it. **`src/types/gameState.ts` has 678 importers** (`grep -rlE "from ['\"].*types/gameState(\.ts)?['\"]" src | wc -l`) and this plan adds two optional fields to it → see § Blast Radius.

## Engine pillar

### Systems design

**New module `src/engine/threadingRite.ts`** (pure functions + one graph writer):

```ts
export type RiteShape = 'full_meeting' | 'full_no_sensing' | 'short' | 'bond_only';

/** How many `thread` edges to individuals this god has ever written (survives a thread being cut). */
export function threadsBoundCount(graph: WorldGraph, ascendantId: string): number;

/** D2: ordinal 1 → full (meeting supplies sensing; card skips it), 2..RITE_SHORT_MAX_ORDINAL → short, else bond_only. */
export function riteShapeFor(ordinal: number, viaMeeting: boolean): RiteShape;

/** D3: 'the_first' when the god holds no live the_first thread, else the card's own position. */
export function courtPositionForNewThread(graph: WorldGraph, ascendantId: string, cardPosition: CourtPosition): CourtPosition;

/** D1: the one writer. Applies a rite's outcomes to an EXISTING individual node. */
export function applyThreadingRite(graph: WorldGraph, input: ApplyRiteInput): ApplyRiteResult;

/** Adapter so the MeetTheFirst beat components can render an existing mortal. */
export function candidateFromAgent(graph: WorldGraph, agentId: string): NarrativeCandidate | null;
```

`applyThreadingRite` writes, in order, each step skipped when its outcome is absent:

1. **Value-pole shift** per formative test: `axiologicalProfile[pair] += shift × scale`, clamped to [0,1]. `scale = 1` for a soul the meeting just invented, `RITE_EXISTING_MORTAL_SHIFT_SCALE` (0.5) for anyone else. A grown mortal already has a self; the rite bends it, it does not write it.
2. **Spark reach investment** (full shapes only): `domainCapabilities[reach] += investmentAmount × 100` (the meeting's own arithmetic, `meetingEncounter.ts:1341-1351`).
3. **Scar**: `quintessence -= erosion`, clamped at `MEETING_QUINTESSENCE_FLOOR` (the existing floor; no mortal leaves a rite Broken). Pre-clamp value traced.
4. **Bond reception** onto the thread edge (`bondReception`, the existing field and `BOND_RECEPTION_BY_BAND`).
5. **The First's mark** (D5) when the thread's court position is `the_first`: `assignTrait(graph, agentId, markIdFor(reach), { tick, source: 'threading_rite' })`, `reach` = the spark's reach, else the mortal's `primaryReach`. Guarded: if the trait node is missing it is minted from `GOD_GIVEN_TRAITS` first (the `capabilityGrowth.ts:219` / `castChannel.ts:153` lazy-mint pattern), so `assignTrait` never throws.
6. `touchStructure()` once (THR-1704's lesson: a thread write that skips it leaves panels stale).

**`createAgentFromMeeting` becomes create-then-apply** (additive refactor): it keeps creating the node and the `located_at` and `thread` edges exactly as now, then calls `applyThreadingRite` with `scale = 1` instead of folding outcomes inline. A golden test pins the meeting's output for three seeds before and after.

**Card path (`graphOpExecutor.ts` thread write, `:614-681`).** For a `thread` edge to an `individual` from the ascendant:

- court position = `courtPositionForNewThread(...)` (D3). When it returns `the_first`, the edge also gets `storyPhase: 'call'` and `attentionMode: 'pause'`, the two journey fields the meeting writes; `establishedTick` gets the real tick (the template hard-codes 0, `unified-action-templates.ts:5447`).
- the ascendant node's `threadsBoundCount` property increments (additive; `threadsBoundCount()` falls back to counting live individual threads when the property is absent).
- a **pending rite** is recorded on `GameState.pendingThreadingRite = { agentId, ordinal, shape, tick }` (one slot; a second thread in the same tick queues behind it in `pendingThreadingRiteQueue`, max `RITE_QUEUE_MAX`, overflow resolves as `bond_only` with no hand and is traced). The rite resolves in the UI (below); the thread itself is already written, so closing the game mid-rite loses nothing but the rite's colour.

**Bond-without-a-hand (D6) and fail-soft resolution.** If the rite is dismissed, or the agent dies/vanishes before it opens, the pending rite resolves engine-side: `resolveBondTest` with no played cards on the seeded stream, then `applyThreadingRite` with the bond outcome only. Same writer, same trace.

### Graph nodes / edges

- **No new node types, no new edge types.** Trait definition nodes (`type: 'trait'`) are an existing type; eight are added, **keeping the existing `GOD_GIVEN_TRAITS` ids** (`trait.god.iron_will`, `trait.god.golden_tongue`, … — already used by `meetingEncounter.test.ts:384`); `markIdFor(reach)` looks the id up by the entry's `reach` field (`subcategory: 'bestowed'`, `visibility: 'public'`, `domainContributions: { [reach]: FIRST_MARK_REACH_CONTRIBUTION }`, `importance: FIRST_MARK_IMPORTANCE`, `maxLevel: 1`, `tags: ['god_mark']`, `flavorText` = the existing description).
- `thread` edge: existing fields only (`courtPosition`, `storyPhase`, `attentionMode`, `bondReception`, `establishedTick`). Adds optional `riteShape` (string, inspect-only).
- Ascendant node: optional `threadsBoundCount: number`.
- Individual node: existing `axiologicalProfile`, `domainCapabilities`, `quintessence`; new optional `riteHistory: Array<{ tick, shape, reception }>` (inspect-only, for the sheet's "bound on" line).

### Tick phases

None new. The card's thread write already runs inside action resolution; the rite is player-paced UI that halts the clock through the interrupt registry. The engine-side fallback runs when the pending rite is dismissed or invalid, never on a tick phase.

### Resolution logic

Unchanged ladder: the rite's formative test and bond test call the same `resolveFormativeTest` / `resolveBondTest` the meeting calls, which call the attended five-band ladder. The short rite draws its one test with the meeting's slot-1 predicate (`targetValuePair === REACH_VALUE_PAIR[primaryReach]`, `selectDilemmas` in `meetingEncounter.ts`), so it is always a converted (nudge) test. Pole lean, band → pole, failure → opposite pole + scar: all as in the meeting. **The rite rolls against the meeting's stand-in actor** (`MEETING_TEST_ACTOR_ID`, capability 0.42), not the mortal's real capability, on purpose: the rite is a ceremony whose odds the player can learn once, not a skill check that a master always passes.

### PRNG callouts

- Test and bond rolls: the existing per-test seed (`seed + testIndex`), seed = `hash(worldSeed, agentId, threadTick)` so a reloaded game replays the same rite.
- Dilemma draw for the short rite: `selectDilemmas` with the same seeded stream.
- Bond-without-a-hand: same seed, no played cards → pure fate, deterministic.
- No `Math.random()` anywhere.

## Content pillar

### Encounter templates

No new templates. The short rite draws from the converted Batch A meeting library (64 templates with a `test`, `meeting-dilemma-library.ts`). Their `{agent.location}` lines resolve against the threaded mortal's real location, which is a real place, so they read true. **Executor check:** grep the 40 slot-1 `axiological` templates for wording that assumes a stranger the god has just found ("a soul you sense", "among the crowd"); any line that does gets a rite variant field (`riteText`), not an edit of the meeting text.

### Prose tables

New file `src/data/threading-rite-prose.ts`:

- **Rite openings, one per reach (8 lines, plain register, the meeting quality bar).** Rendered sample for an Iron mortal: *"Your thread finds Hadrel Vosk at the forge in Ketterwell. He does not look up. He feels it all the same."* Template: `"Your thread finds {agent.name} {agent.where}. {reachLine}"`, where `{agent.where}` falls back to "where they stand" if the location has no name (PC-3: never an empty slot).
- **Bond-only reception lines, one per reception (5 lines),** reusing the meeting's reception words: *awe · devotion · bargain · doubt · defiance*. Sample (devotion): *"Mira Hollis takes your thread as a gift. She will carry it gladly."*
- **The First's mark lines (8),** one per god-given trait, used in the reveal and the sheet: *"Iron Will — the god's mark. Their resolve holds where others break."*
- **The "first threaded" line** for D3's card route: *"No mortal has carried your thread before. Hadrel Vosk is your First."*

### Attachment content

N/A — the mark is a trait, not an attachment; no attachment templates change.

### Data tables

- `GOD_GIVEN_TRAITS` (`meeting-content.ts:632`) gains `contribution` and `markLine` fields per entry; seeded into eight trait nodes at world init beside the other trait catalogs in `gameInit.ts`.
- `src/data/threading-rite-constants.ts` (see Constants).

## UI pillar

*Screenshot tool: Playwright (all DOM surfaces; the gold thread line is the existing WebGL line and is not changed).*

**UI Laws engaged** (`Docs/design-system/laws.md`): 1 (one primary action per surface: the rite's *Bond* button), 13/14 (state-backed chips: the mark chip reads the `has_trait` edge, never a cached label), 17 (prose first: the rite opens on a sentence, not a stat block), 21 (modal height ≤ 75vh, Law 33 viewport: nothing below 1080), 33, 37 (one accent colour: the sphere tint the player already loves on choice cards stays), 56 (chips are state).

### Player-facing display

- **`ThreadingRite` modal** (`src/components/ThreadingRite/ThreadingRite.tsx`): opened by the interrupt registry when `pendingThreadingRite` is set. It reuses `FormativeTestBeat` and `BondBeat` with `candidateFromAgent(...)` so the mortal's real name and portrait show (no invented soul; PC-6: one face, one name). Beats by shape:
  - `full_no_sensing`: test(s) → spark → bond (the meeting minus sensing).
  - `short`: opening line → one test → bond.
  - `bond_only`: `RevealCard.Frame`: Title = mortal's name, Medallion = portrait, Body = opening line, a two-card bond hand, Dismiss.
- **Every rite** shows *Bond without a hand* as a secondary button (D6).
- **The mark** shows on the agent sheet in the sheet's trait list under the existing `bestowed` category (`agentDetail.ts:1200` already orders `bestowed` second; no content uses it yet) as a chip with its line as tooltip.
- **The rite line on the sheet:** under the thread row, *"Bound in spring, Year 1 — took your thread in devotion."* from `riteHistory`.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Rite header | "The Rite of the Thread" (subtitle: "Your second thread" / "Your fifth thread") | PC-7 | It says what is happening and that it is the player's own doing (they just played the card) |
| Rite opening | "Your thread finds Hadrel Vosk at the forge in Ketterwell. He does not look up. He feels it all the same." | PC-3 | Rendered with real names; empty-location fallback "where he stands" |
| Short-rite test | The meeting's own test UI: purpose line, difficulty word, factor lines, priced cards, fate reveal, band prose | PC-1, PC-2 | Same words and tooltips as every encounter (THR-1713's tooltips apply); the stakes line before the roll and the result line after it are the existing ones |
| Pole result line | "You leaned toward mercy. Fate agreed: Hadrel bends a little that way." / "…Fate pulled the other way: Hadrel hardens." | PC-2 | The second line names the lean the player chose, then what fate did with it |
| Bond stakes (before the roll), short and bond-only rites | The meeting's own bond test (`MEETING_BOND_TEST`, `meeting-bond-test.ts:168-180`), reused word for word: purpose line "How they take you"; setup "They are alone, doing something ordinary — and they stop, because they can tell they are being looked at. Not by anyone in the room. They stand very still and wait to find out what is looking."; factor lines "They have wanted something to be out there for a long time." (for) · "The last person who watched them this closely wanted something." (against) · "Nobody has come looking for them before." (for) | PC-2 | The stakes say what is being rolled (how the mortal takes the god) before any card is played; the result line below names the reception that roll picked |
| Bond-only hand (2 cards) | "Still the room" — cost 0 — "A quiet room is easier to be spoken to in." · "Say their name" — 3 Mind essence — "Being known by name is hard to argue with." (the first two of `BOND_NUDGES`, `meeting-bond-test.ts:33-57`) | PC-1 | Card costs and essence carry the tooltips THR-1713 added to every hand; no new resource |
| Bond button | "Bond" | — | Primary action |
| Skip button | "Bond without a hand" — tooltip: "The bond still forms. Fate alone decides how they take it." | PC-2, PC-4 | It says the bond is not skipped and who decides |
| Bond result | "Hadrel takes your thread in doubt. He will carry it, and question it." | PC-2 | Names the reception word the sheet later shows |
| D3 line (card route to The First) | "No mortal has carried your thread before. Hadrel Vosk is your First." | PC-6, PC-7 | Matches the existing event "…has been claimed as The First." (`GameView.tsx:4378-4400`) word for word |
| Mark reveal | "Iron Will — the god's mark. Their resolve holds where others break." · chip tooltip: "Your First carries your mark. They are better at Iron work: fighting, standing guard, holding a line." The word "Iron" in the tooltip carries the existing reach tooltip (`tooltipId: 'reach.iron'`, the registry `reachTooltipId` in `engine/aftermathWords.ts` that the Codex already uses) | PC-1 | The tooltip says what the mark does in plain words, and the Reach name opens the same Reach explanation the rest of the game uses |
| Rite resolved without the player (queue overflow) | Chronicle line: "Too many threads at once: Mira Hollis took your thread without a rite — in devotion." | PC-4, PC-5 | Says the rite was skipped, why, and still names the reception |
| Rite resolved without the player (dismissed by Escape / window closed) | Same as *Bond without a hand*; chronicle: "Hadrel Vosk took your thread (doubt). You bonded without a hand." | PC-4 | Says the bond happened with no cards, and its result |
| Rite resolved without the player (mortal died or vanished first) | Chronicle: "Your thread reached Hadrel Vosk too late for a rite." | PC-4 | Says why no rite played; the thread row shows the mortal's state as it does today |
| Sheet rite line | "Bound in spring, Year 1 — took your thread in doubt." | PC-6 | Same reception word as the rite result |

### Playtest signal

- A tester who threads a second mortal can say what happened in the rite (*"I tested them and they took my thread in doubt"*), not only that a card was played.
- A tester can say why their First is different from their other threads, naming the mark or the rite.
- No tester reports the rite as an interruption they could not leave.

### Event notifications

- Chronicle entry per rite: *"Hadrel Vosk took your thread (doubt)."* One entry per rite; the existing generic cast receipt for `bind_thread_agent` is suppressed when a rite opens (PC-5: one fact told once).
- D3 card route: the existing *"…has been claimed as The First."* event (`GameView.tsx:4378-4400`) fires for the card route too, from the same helper.

### Debug inspection (DebugPanel)

- `await window.__DEBUG.getThreadingRite()` → `{ pending, queue, threadsBoundCount, lastRite: { agentId, shape, ordinal, reception, markId } }`.
- `window.__DEBUG.openThreadingRite(agentId)` dev lever (threads the agent through the real card path and opens the rite), for browser verification without a played card.
- DebugPanel Threads section: each thread row shows `riteShape` and `bondReception`.

### Visual presence (HexMapV2)

N/A: no map signifier changes. A card-route First gets the existing gold thread line automatically (`ThreadLineMesh.ts:30`, keyed on `the_first`).

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `threadingRite.ts` `courtPositionForNewThread` | action resolution (thread write in `graphOpExecutor`) | — | — | `thread.court_position_resolved` | `getThreadingRite().threadsBoundCount` |
| `threadingRite.ts` pending rite | action resolution | `ThreadingRite` via `interruptRegistry` kind `threading_rite` | `pendingThreadingRite`, `pendingThreadingRiteQueue` | `rite.queued` | `getThreadingRite().pending/queue` |
| `applyThreadingRite` | called by meeting bond and rite bond (UI) or dismiss fallback | `MeetTheFirstFlow`, `ThreadingRite` | — | `rite.applied` | `getThreadingRite().lastRite`, DebugPanel Threads |
| Mark trait seed | world init (`gameInit.ts`) | `AgentSheet` bestowed chips | — | — | CLI `eval` on `trait.god.*` |
| `threading-rite-prose.ts` | — | `ThreadingRite`, agent sheet | — | — | — |

Checked against `Docs/plans/wiring-checklist.md` (orchestrator phase, UI, GameState, traces, debug, prose pipeline, player controls — all seven rows covered above).

Interface map: add contract rows `thread-write-resolves-first` (graphOpExecutor → threadingRite) and `rite-applies-outcomes` (meeting + rite → individual node); update `scripts/interface-contracts.ts` (two-file edit). The Design Reference Wiki page whose `sources` include `meetingEncounter.ts` updates in the same PR. Systemic wiring guide: one paragraph — "a thread now plays a rite; content can author `riteText` variants on meeting templates".

## Interface impact

Step 0.7 against `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`. The lint names twelve mapped subsystems by file overlap; the contracts this plan actually reads or writes are below. Doom, essence and encounter subsystems are only *reached through* `isFirstBonded` / `courtPosition`, whose readers are unchanged.

| Contract | Disposition | Note |
|---|---|---|
| `meeting-bond-writes-the-first` (`interface-contracts.ts:5840`) | **extend** | The bond still writes `the_first`; the card path now writes it too when the god holds no First (D3). Production read sites unchanged: `isMeetTheFirstAvailable`, `isFirstBonded`, `attentionTier.ts:26`. |
| `thread-write-resolves-first` | **add** | Writer: `graphOpExecutor` thread write via `courtPositionForNewThread`. Read site: every `courtPosition === 'the_first'` consumer listed in § Substrate inventory. |
| `rite-applies-outcomes` | **add** | Writers: `applyThreadingRite` from the meeting and the rite. Read sites: `axiologicalProfile` (encounter scoring and value-pole reads, unchanged), `domainCapabilities` / `has_trait` → `computeRawScore` (`domainCapability.ts:55`), `bondReception` (agent sheet rite line). |
| Trait `has_trait` → capability | **preserve** | `domainCapability.ts:72-86` reads the mark exactly as any trait. |
| Spotlight hydrate on thread (`graphOpExecutor.ts:90-106`) | **preserve** | Unchanged. |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `RITE_SHORT_MAX_ORDINAL` | 3 | Threads 2..N play the short rite (one test + bond); later threads play bond-only |
| `RITE_FULL_TEST_COUNT_CARD_ROUTE` | 2 | Formative tests in a card-route First's rite (the meeting keeps its own 2–3) |
| `RITE_SHORT_TEST_COUNT` | 1 | Formative tests in the short rite |
| `RITE_EXISTING_MORTAL_SHIFT_SCALE` | 0.5 | How far a rite bends an existing mortal's value pole, relative to a newly invented soul |
| `RITE_QUEUE_MAX` | 3 | Pending rites held; overflow resolves bond-only with no hand |
| `RITE_BOND_ONLY_HAND_SIZE` | 2 | Cards offered in the bond-only rite |
| `FIRST_MARK_REACH_CONTRIBUTION` | 2 | Raw capability the mark adds in its reach (the scale of a companion's `domainContributions`, `companion-templates.ts:83-116`) |
| `FIRST_MARK_IMPORTANCE` | 0.8 | Trait importance (feeds NPC importance; harmless for a threaded mortal, legible on the sheet) |
| `FIRST_MARK_ENABLED` | true | Turns D5 off without touching the rite |

## Tracing

```ts
// thread.court_position_resolved — every thread write to an individual from the ascendant
interface ThreadCourtPositionResolvedTrace {
  type: 'thread.court_position_resolved';
  ascendantId: string;
  agentId: string;
  cardPosition: CourtPosition;      // what the template asked for
  resolvedPosition: CourtPosition;  // what was written (the_first when D3 fired)
  reason: 'no_first' | 'first_held';
  threadsBoundCount: number;        // after increment
}

// rite.queued — a pending rite recorded
interface RiteQueuedTrace {
  type: 'rite.queued';
  agentId: string;
  ordinal: number;
  shape: RiteShape;
  queuedBehind: number;             // 0 = opens now
  overflowed: boolean;              // true → resolved bond-only immediately
}

// rite.applied — the one writer ran
interface RiteAppliedTrace {
  type: 'rite.applied';
  agentId: string;
  shape: RiteShape;
  viaMeeting: boolean;
  handPlayed: boolean;              // false = bond without a hand / fallback
  poleShifts: Array<{ pair: string; before: number; after: number; scale: number }>;
  reachInvestment?: { reach: ReachDomain; amount: number };
  quintessence?: { before: number; preClamp: number; after: number };
  reception: BondReception;
  markTraitId?: string;
  fallbackReason?: 'dismissed' | 'agent_missing' | 'queue_overflow';
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Agent deleted or dead before the rite opens | Pending rite dropped; thread stays; `rite.applied` **is** emitted with `fallbackReason: 'agent_missing'`, `handPlayed: false`, empty `poleShifts`, and no graph writes (`reception` is the seeded no-hand roll, recorded for inspection only) |
| Agent node lacks `axiologicalProfile` / `domainCapabilities` | Skip that step, apply the rest (each step guarded) |
| No converted test matches the mortal's primary reach | Short rite degrades to `bond_only`; traced |
| `candidateFromAgent` returns null (missing portrait/name) | Rite renders with the sheet's fallback portrait and the node name; never blocks the bond |
| Trait node `trait.god.<reach>` missing | Lazy-mint from `GOD_GIVEN_TRAITS`; if the reach is unknown, skip the mark and trace |
| Two threads in one tick | Second queues; beyond `RITE_QUEUE_MAX` resolves bond-only immediately |
| Game closed / reloaded mid-rite | Both new GameState fields are optional; wherever GameState is persisted, absence reads as "no pending rite". If the field survives, the rite re-opens with the same seed; if it does not, the thread already exists and only the rite's colour is lost (traced on the next load as nothing — no partial writes ever happened) |
| Thread write refused (duplicate, non-ascendant source) | No rite queued; existing refusal path unchanged |
| A `the_first` thread exists but is `dormant` | It still counts as held (D3 does not fire); only a cleared First (Return) frees the slot |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 678 importers | Two **optional** fields only: `pendingThreadingRite?: PendingThreadingRite` and `pendingThreadingRiteQueue?: PendingThreadingRite[]`, with the `PendingThreadingRite` type declared in `src/engine/threadingRite.ts` and imported as a type. No existing field changes shape, so no importer recompiles to a different type. Every reader uses `?? null` / `?? []`. Pinned by a unit test that builds a GameState without either field and asserts `getThreadingRite()` returns `{ pending: null, queue: [] }`, and by the typecheck ratchet (`npm run check:typecheck`, must not rise). |

## Three-pillar check

- [x] Engine pillar present — one writer, D3 at the thread write, pending rite, mark seeding
- [x] Content pillar present — rite prose tables, mark lines, `riteText` check on the 40 slot-1 templates
- [x] UI pillar present — `ThreadingRite` modal, sheet mark chip and rite line, debug accessors
- [x] Wiring section connects them

## Vision audit

- [x] **God, not protagonist** (`Vision/02-non-negotiables.md` §1): the rite is the meeting's own lean-and-fate grammar — the player leans a value pole, fate decides the band, failure writes the opposite pole. The player never picks who the mortal becomes. The mark is a blessing the god gives, not a choice the mortal makes.
- [x] **Two-way thread** (§1, 2026-05-11): every rite ends in a reception the mortal decides (*doubt*, *defiance* included) and the sheet keeps it.
- [x] **Stellaris clock** (taste profile): each rite halts the world as a moment; D2 bounds how often.
- [x] **Foundation spheres stay elder magic**: the mark is a Reach blessing, not a sphere grant. No Vision premise changes.

## Rulebook impact

- [ ] This plan does not change a rule of play
- [x] This plan changes rules of play (who The First is; what threading does). `Docs/canon/rulebook.md` § *Your first encounter — Meet The First* gains a `[DESIGN — THR-1644]` paragraph in this PR, flipped to `[IMPL]` by the executor; the quick reference's court-positions line notes D3.
- UL: *The First* gains the sense "the first mortal the god threads" — filed as a UL-proposal ticket at handoff (UL changes go through proposals, never the plan PR).

> Brainstorm companion: `Docs/plans/2026-10-06-thr-1644-threading-ceremony-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Nine named constants; the ladder, scale, mark size and switch are numbers |
| 2. Inspectability | PASS | Three traces with typed payloads; `getThreadingRite()`; DebugPanel rows; `riteHistory` on the node |
| 3. Determinism | PASS | All rolls on seeds derived from world seed + agent + tick; reload replays the same rite |
| 4. Fail-soft | PASS | Every write step guarded; the thread is written before the rite, so no rite failure can lose a thread; `assignTrait`'s throw is pre-empted by lazy mint |
| 5. Narrative over mechanical perfection | PASS | Every thread becomes a told moment with a reception the sheet remembers; the mark is a story line before it is a number |
| 6. Additive over destructive | PASS | New module, new optional fields, eight trait nodes; `createAgentFromMeeting` refactor pinned by a golden test |
| 7. Performance budget | PASS | No per-tick work; the rite runs once per thread |

## Done when

Split into three slices, filed as three tickets at handoff:

- [ ] **S1 — one writer and The First is the first (Engine).** `applyThreadingRite`, `courtPositionForNewThread`, `threadsBoundCount`, pending-rite state, engine-side bond-without-a-hand. Done when: (a) a golden test shows `createAgentFromMeeting` output identical for seeds 42/99/2 before and after; (b) a test threads a mortal with `bind_thread_agent` in a world with no First and asserts `courtPosition === 'the_first'`, `storyPhase === 'call'`, `isFirstBonded` true and the doom clock awake; (c) threading a second mortal writes `watched` and `threadsBoundCount === 2`; (d) a dismissed rite applies a reception from the seeded stream identical across two runs; (e) 30-tick CLI smoke + `npm run test:heavy`.
- [ ] **S2 — the rite on screen (UI + Content).** `ThreadingRite` modal, prose tables, interrupt kind, sheet rite line, debug lever. Done when: four-part browser evidence at 1920×1080 on `?view=game&seeded&size=medium` (First already bonded): threading a mortal through the real card path opens the short rite with the mortal's real name and portrait; `await __DEBUG.getThreadingRite()` shows `lastRite.shape === 'short'` and a reception after the bond; the fourth mortal the god has threaded (counting the seeded First) opens the bond-only RevealCard; *Bond without a hand* closes the rite and the sheet shows the rite line; console clean; UI-Laws line (1, 13/14, 17, 21, 33, 37).
- [ ] **S3 — The First's mark (Engine + Content + UI).** Eight `bestowed` trait nodes, the mark granted at the bond on both routes, the sheet chip. Done when: on `?view=game&firstunmet&size=medium` the meeting's First carries exactly one `trait.god.*` edge, the `GOD_GIVEN_TRAITS` entry whose `reach` is the spark's reach (e.g. `trait.god.iron_will` for an Iron spark); a card-route First (S1 test world) carries one matching its primary reach; `computeRawScore` (`domainCapability.ts:55`) for that reach is higher by exactly `FIRST_MARK_REACH_CONTRIBUTION` than the same mortal without it (unit test); the chip and tooltip render (screenshot).
- [ ] All slices: `npm run gate` verdict; closing commit carries the slice ticket's closer.

## Coordination block

**Suggested model:** opus — S1 crosses the thread write, the meeting writer and GameState persistence; S2 is a multi-beat modal reusing two flows.

**Parallel-safe with:** [THR-1749](https://linear.app/threadbare/issue/THR-1749) (Remembrance and hunger catalog; disjoint files), [THR-1740](https://linear.app/threadbare/issue/THR-1740) (forecast window), [THR-1744](https://linear.app/threadbare/issue/THR-1744) (playtest harness).

**Mutex with:** [THR-1747](https://linear.app/threadbare/issue/THR-1747) only if its build touches `graphOpExecutor.ts` thread writes or `unified-action-templates.ts` thread templates (it edits essence income and upkeep; check its diff at claim). Anything editing `src/components/MeetTheFirst/` or `meetingEncounter.ts`. S2 and S3 both touch the agent sheet's trait group: land S3 before S2 or rebase.

**Blocked by:** S2 and S3 are blocked by S1.

**Files to touch:**
- Create: `src/engine/threadingRite.ts` + test; `src/data/threading-rite-constants.ts`; `src/data/threading-rite-prose.ts`; `src/components/ThreadingRite/ThreadingRite.tsx`
- Edit: `src/engine/meetingEncounter.ts` (create-then-apply); `src/engine/graphOpExecutor.ts` (court position + pending rite at the thread write); `src/types/influence.ts` (optional `riteShape` on thread props); GameState type + serializer (`pendingThreadingRite`); `src/engine/gameInit.ts` (seed mark traits); `src/data/meeting-content.ts` (`GOD_GIVEN_TRAITS` fields); `src/components/MeetTheFirst/BondBeat.tsx` (no-vision mode); `src/components/Game/interruptRegistry.ts`; agent sheet trait group; `src/debug-bridge.d.ts` + bridge; `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`; `Docs/canon/rulebook.md` (`[DESIGN]` → `[IMPL]`)

## Notes for the executor

- **Do not touch the meeting's sensing.** D4 keeps the three invented souls; the card route skips sensing because the god already chose.
- **Do not change the card's cost, tier or court position** except D3's first-thread case. Upkeep belongs to THR-1747.
- **The meeting's `isMeetTheFirstAvailable` needs no change**: it already returns false once any `the_first` thread exists (`GameView.tsx:1520`), so a card-route First retires the meeting by itself. Verify this in S1's test (b).
- **`establishedTick: 0` in the template is a latent bug** (`unified-action-templates.ts:5447`); S1 writes the real tick on the thread edge at the write site rather than editing every template.
- **Thread cut / dormant does not decrement `threadsBoundCount`.** The ordinal counts rites the god has performed, not threads it holds.
- **Avatar is never a rite target** (the avatar is a synthetic `the_first` in `encounterVisibility.ts:449-458`; guard with `getAvatarsOf`, `graphQueries.ts:370`).

## Intent-judge verdict

Run 1: **Revise** (dimension 9 VIOLATION: `gameState.ts` has 678 importers and the plan had said no Blast Radius was needed; dimension 4 GAP: the first fail-soft row contradicted the trace; dimension 12 GAP: bond stakes, the bond-only hand, automatic-resolution words and the mark's Reach explanation were not quoted). All three were fixed: the Blast Radius section, the fail-soft row, and five rows in Player-facing text. Run 2: **Allow** (Reversible). Recommended actions were applied: the trait ids keep the existing `GOD_GIVEN_TRAITS` ids, and D1–D6 with their veto words are posted on THR-1644 at handoff.

## Forked-audit verdicts

| Auditor | Verdict |
|---|---|
| NFP | **PASS-with-notes.** All seven NFPs pass. The one note, on determinism: replaying a reload needs the pending-rite field to be persisted, and the fail-soft row covers the case where it is not (the thread survives and only the rite's colour is lost). |
| Three-pillar | **PASS.** All three pillars are present and substantive, the Blast Radius section is present, and the substrate is honest: the only related inventory row is the thread-bind familiarity grant, which this plan does not rebuild. |
| Vision | **PASS-with-notes.** No contradictions. The plan leans toward attachment over divine remove (tension #3), and the mark leans "deep-few" (tension #5). A burst of threading could still crowd the one-story-front-of-stage cadence; D2's ladder and `RITE_QUEUE_MAX` are the brakes. |
