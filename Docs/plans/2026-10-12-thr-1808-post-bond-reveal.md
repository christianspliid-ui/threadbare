> **title:** The god's screen fills one gift at a time, and one line says what to do first — THR-1808
> **linear_issue:** THR-1808
> **author:** Claude Code (tb-design-lane, run 2026-10-12c, under delegation)
> **created:** 2026-10-12
> **three_pillars:** Engine `done — one pure reveal selector over beat history, one additive arrival flag` · Content `done — one reveal table, one direction line in two states, one sentence added to The Seat and one clause to A Path Opens, one "new beside the map" line per gift` · UI `done — panels mount behind the selector, a standing direction line, a one-time highlight, a "Show every panel" setting; Playwright DOM`

# The god's screen fills one gift at a time — THR-1808

*After the bond the screen shows The First, her chapter, your essence and your hand; every other panel arrives with the gift whose words introduce it, and one line says what to do first until the first chapter is seen through.*

## Why this is load-bearing

Cold playtest round 3 (2026-10-10, [THR-1808](https://linear.app/threadbare/issue/THR-1808)) found PC-7 (*no direction*) recurring. [THR-1716](https://linear.app/threadbare/issue/THR-1716) removed the press-Play wall, and every tester went straight from the bonding scenes into play. What met them there was everything at once. The skimmer: *"About 30 panels and labels … a flat yellow hex map, no prompt."* The story tester: *"Once I reached the main map, I lost track of my goal."* Both designer notes ask for the same fix: *"teach me the god-dashboard one word at a time"* and *"hide most of those 30 panels until I actually need them."*

The cause is measured. [THR-1648](https://linear.app/threadbare/issue/THR-1648) gates exactly five surfaces, and four of them switch on together on the bond tick:

```
$ sed -n 42,58p src/components/Game/GameView/firstScreenReveal.ts
  return {
    bonded,
    doom: bonded,
    mandate: bonded,
    notables: bonded,
    rivals: bonded && hasRivalActed(gameState),
    omens: bonded && !!gameState.omenState?.primary,
  };
```

Every other surface has no gate at all. Time controls and Attention (`GameViewTopBar.tsx:247,273`), World-Soul (`:265`), the Reaches, Essence and the Actions hand (`ascendant-bar/AscendantBar.tsx:174,182,213,224`), the Threads panel (`GameView.tsx:6016`), the Chapter Ledger button (`:6046`) and World Pulse with its "Active Agents" and "Cultures" counts (`:6084`, `WorldPulse.tsx:150,154`) all render from the first screen. The bond is a single cliff.

The opening gifts are already paced as the ticket wants. Spine beats 1–4 come one player act apart (`SPINE_PLAYER_ACTS_BETWEEN_GIFTS = 1`, `ascendant-beat-content.ts:48`), with an idle fallback after 36 ticks (`SPINE_IDLE_FALLBACK_TICKS`, `:54`). Their state already lives in `GameState.ascendantBeats.history` (`types/ascendantBeat.ts:169-185`). Nothing reads that history to decide what the screen shows. **This plan hangs the reveal on the pacing that already exists.**

The outcome is agreed. The ticket states the Fixed-when, its recommended direction and its Done-when, and the orchestrator staged it as agreed work ([staging comment](https://linear.app/threadbare/issue/THR-1808)). This plan is the *how*, which process.md rule 4 makes an agent decision. The design lane made each call under delegation; they are listed below with a veto invited.

**Siblings in this milestone.** [The opening gifts open on top of whatever the player just clicked](https://linear.app/threadbare/issue/THR-1805) and [A ready opening gift waits for a quiet moment](https://linear.app/threadbare/issue/THR-1809) shipped the gift hold this plan relies on; the reveal toast fires on gift *resolution*, after the hold. [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1807) shipped its fixes as [The map's words explain themselves](https://linear.app/threadbare/issue/THR-1814) and [Say it before it happens](https://linear.app/threadbare/issue/THR-1815). This plan keeps essence and the hand on the bond screen, so those spend-legibility fixes land on surfaces the player sees from the start. Every staged panel keeps its THR-1814 tooltip when it appears, and THR-1807's note that a first-run walkthrough "belongs to THR-1808's reveal order" is answered here by the reveal itself, not a walkthrough.

**This plan does not build on any lane decision still inside its veto window.** In particular it does not draw on [The screen frame](https://linear.app/threadbare/issue/THR-1828) (decided 2026-10-12 ~06:20Z). The reveal table is keyed to **surface ids**, not screen positions, so a panel the frame later moves keeps its row (see § Notes for the executor).

## Decisions made by delegation (veto in chat)

1. **What shows at the bond: The First's screen.** The bond shows the time controls, your identity, your essence and Attention, your hand of cards (with Move), The First's thread, the Chronicle, Settings and Read the Threads. Everything else waits. *Why:* these are the things the first act on the map uses (casting a card, following The First, moving your avatar). That is the ticket's "The First, her current chapter and the essence bars", plus the hand that spends the essence. Her current chapter is reached through the direction line (decision 5) until the ledger arrives. *Rejected:* essence alone, without the hand. The hand holds Beat 0's granted cards, and the gifts are paced on *player acts*, so hiding the cards would stall the pacing.
2. **Each gift brings what its words are about.** A row appears when the gift that introduces it resolves:
   - **The Seat** brings **Doom**, **Mandates** and **Investiture** (the ticket's own example: "the seat brings Investiture"). The Seat's prose gains one sentence naming Doom and mandates (Content C2): your seat gathers power, and that power is what holds the Doom back. Investiture is "Manage your divine court" (`ActionsBlock.tsx:190`), and a seat is where a court sits.
   - **The First's first chapter** brings the **Chapter Ledger** button (the ticket's second example). It appears as soon as The First has a threaded, non-routine chapter, active or resolved, after the bond.
   - **The First Word** brings **Notables**. Its prose is about letting your word *"fall into a mortal mind"*, the first time the player looks past The First.
   - **A Path Opens** brings the **Reaches**, **World Pulse**, **World-Soul** and the **Omen** indicator. Its prose gains the word "omens" (Content C2b). It grants the primary Reach signature (`grantsReachSignature: 'primary'`), and its prophet *"writes warnings across the waking sky"*. It is the moment the god learns what kind of god it is.
   - **A Thing Left Behind** brings no panel. Its artifact lands in the hand that is already on screen.

   *Why:* the taste profile teaches *"by highlighting words inside prose, not by separate tutorials"* (IPK). A panel that arrives right after a sentence about it is taught by that sentence. *Rejected:* Doom at the bond (the ticket asks for it "with the first beat that names it"; no beat names it today, so C2 adds the naming sentence); time-based reveal (PC-4: things appearing for no visible reason); a coach-mark tutorial (an interrupt to explain interrupts, already rejected by THR-1716's plan).
3. **Some rows keep their own "has something to show" gate as well.** Rivals still wait for a rival's first act. Omen still needs a live omen. Signatures, Covenants and Hooks still wait for a count above 0 (`AscendantBar.tsx:197,236,264`). The table adds a *floor*; it never forces an empty panel on screen.
4. **A ceiling, so nothing stays hidden forever.** If the spine stalls (a beat suppressed, a dev lever, a bug), every staged row reveals `OPENING_REVEAL_CEILING_TICKS` (200) ticks after the bond. The worst honest spine is four gifts at the 36-tick idle fallback, about 144 ticks, so the ceiling never preempts a working spine.
5. **One standing direction line until the first chapter is seen through.** From the bond until The First's first non-routine chapter after the bond has resolved, the top bar carries one line:
   - when a chapter of hers is open or offered: *"Watch over Elara. A chapter of her story is waiting →"*, which opens it;
   - otherwise: *"Watch over Elara. Let time run, and her next chapter will come to you."*

   It clears when the chapter *resolves*, not when the player acts in it. A chapter of a threaded First always asks the player for its steps since [THR-1715](https://linear.app/threadbare/issue/THR-1715) removed autopilot, so a resolved chapter is one the player has played through.

   It is a caption, never an interrupt, and never pauses the clock (taste profile: *Real time, halting for every moment*). *Rejected:* a line that lasts for the whole spine (the goal becomes noise once the player has done it once); a permanent goal banner (Law 53).

   The pronoun comes from The First's own gender through the existing `getPronouns` helper (`src/data/domain-prose.ts:96`), which falls back to "their", so the line never guesses (PC-3).
6. **When a row reveals, the game says so once.** The gift that brings it adds one toast-tier line, *"New beside the map: Doom, Mandates and Investiture."*, and the new panel carries a soft gold ring for `OPENING_REVEAL_HIGHLIGHT_MS`. One line per gift (and one when the first chapter brings the ledger), never per panel (PC-5). *Rejected:* a modal "new panel" card (an interrupt for a panel).
7. **Only a world that arrives unbonded is staged.** Pre-bonded dev routes (`?seeded`, `?spawn=`, `?testavatar`) and warm starts keep today's full screen. A warm start ([THR-1787](https://linear.app/threadbare/issue/THR-1787)) settles three gifts before its first tick anyway, so its screen is mostly full. A Settings toggle, **"Show every panel"**, turns the staging off for players who want every panel now. *Why:* every verification route and every other ticket's screenshots keep working, and a veteran is one click from the old screen.

**Would change the calls:**
- "Show me the Doom straight away" → move the `doom` row to `bond`.
- "The Reaches should be there from the start" → move the `reaches` row to `bond`.
- "No gold ring" → set `OPENING_REVEAL_HIGHLIGHT_MS` to 0.
- A round-4 tester who misses a panel they needed before its gift → move that row one gift earlier.
- Round-4 testers who still describe the screen as overwhelming at the bond → move World Pulse and World-Soul behind the end of the spine *plus* the first chapter.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ascendant Beats & Progression (`ascendantBeat.ts`, `ascendant-beat-content.ts`) | 🟢 ACTIVE | **reads** `ascendantBeats.history` (which spine beats resolved) and `spineCursor`. No change to pacing, gates or grants. |
| First-screen reveal (UI module `firstScreenReveal.ts`, THR-1648; not an inventory subsystem) | 🟢 ACTIVE | **extends**: `selectFirstScreenReveal` becomes one consumer of the new selector; its latch and the omen exception stay. |
| Doom clock wake (`phaseDoom.ts:311-354`, THR-1646) | 🟢 ACTIVE | **reads** `doomClock.wokeAtTick` as the bond tick (it is set on the bond tick and never unsets, `:311-321`). No change to the clock. |
| Chapter archive (`chapterArchive.ts`, `ChapterRecord`) | 🟢 ACTIVE | **reads** `chapterArchive` filtered to The First, `!isRoutineChapter` (`chapterArchive.ts:84`), `resolvedTick >= wokeAtTick`. |
| Tooltip registry (`ui-content.ts` `UI_TOOLTIPS`, THR-1814) | 🟢 ACTIVE | **preserved**: every revealed panel keeps its existing tooltip. No new tooltip ids. |
| Gift delivery hold (`giftDelivery.ts`, THR-1809) | 🟢 ACTIVE | **preserved**: the "New beside the map" toast fires on gift *resolution*, after the hold has already let the gift open. |
| Debug bridge `getOpeningState()` (`debug-bridge.ts:2944`) | 🟢 ACTIVE | **extends**: a sibling accessor `getOpeningReveal()`. |

Population: one First per world, five spine beats (`ASCENDANT_SPINE`, `ascendant-beat-content.ts:167-214`), 18 surfaces in the reveal table.

## Engine pillar

### Systems design

**E1 — `selectOpeningReveal(state: GameState): OpeningReveal`**, a pure function in a new module `src/engine/openingReveal.ts`. For each row of `OPENING_REVEAL_TABLE` (Content C1) it returns `{ revealed: boolean, reason: OpeningRevealReason }`:

- `reason: 'not_staged'` → revealed. Used when `state.openingRevealStaged !== true`, or when the player has turned staging off (the UI passes `showAll`).
- `reason: 'pre_bond'` → hidden. The First is not bonded (`getFirstId(graph, ascendantId) === null`, the same `thread` edge `isFirstBonded` reads). This matches THR-1648's pre-bond quiet: rows at `bond` also wait for the bond.
- **The bond tick** (the anchor for the ceiling and for "after the bond") is `resolveDoomWokeAtTick(state.doomClock)` (`src/engine/doomClock.ts:708`), the documented reader for the clock's three `wokeAtTick` readings. The doom wakes on the first tick after the bond, so for the one render where the edge exists and the clock has not woken yet, the anchor is `state.tick`. The bond itself is always read from the edge, never from the clock.
- `reason: 'at_bond'` → revealed. The row's trigger is `{ kind: 'bond' }` and the bond has happened.
- `reason: 'gift:<beatId>'` → revealed. The trigger is `{ kind: 'gift', beatId }` and `ascendantBeats.history` holds a resolved record for that beat.
- `reason: 'waiting:<beatId>'` → hidden. The same trigger, not yet resolved.
- `reason: 'first_chapter'` / `'waiting:first_chapter'` → the trigger is `{ kind: 'first_chapter' }`: revealed once The First has a threaded, non-routine chapter after the bond — resolved in `chapterArchive`, active, or offered as a pending threaded offer (the same set that puts the direction line in `chapter_waiting` mode).
- `reason: 'no_beat_state'` → revealed. A gift row when `state.ascendantBeats` is absent.
- `reason: 'unknown_beat'` → revealed at the bond. A gift row whose `beatId` is not in `ASCENDANT_SPINE` (a test also fails on this at build time).
- `reason: 'ceiling'` → revealed. `state.tick - wokeAtTick >= OPENING_REVEAL_CEILING_TICKS`.
- `reason: 'spine_done'` → revealed. `spineCursor === -1` (the spine is finished, by any route, including a warm start or a skipped beat).

It also returns `direction: { show: boolean, mode: 'chapter_waiting' | 'let_time_run', firstId?: string }`:

- `show` is true while staged, bonded, and no `ChapterRecord` exists with `actorId === firstId`, `resolved`, `!isRoutineChapter(rec)` and `resolvedTick >= wokeAtTick`; and the ceiling has not passed.
- `mode` is `chapter_waiting` when The First has an active encounter or a pending threaded offer (the same check the Chapter Ledger uses for its active rows), else `let_time_run`.
- `firstId` comes from scanning the god's `thread` edges for `courtPosition === 'the_first'`, the predicate `isFirstBonded` already uses (`meetingEncounter.ts:1450`). Add an exported `getFirstId(graph, ascendantId): string | null` beside it, and make `isFirstBonded` call it.

No PRNG. No graph writes. Fail-soft: any throw yields every row `revealed: true, reason: 'not_staged'` and `direction.show: false` (an unreadable state shows the full HUD, as `selectFirstScreenReveal` already does at `firstScreenReveal.ts:46-48`).

**E2 — `GameState.openingRevealStaged?: boolean`**, additive and optional. It is set to `true` in `useSimulation.ts`'s arrival memo (the THR-1716 E2 site, `useSimulation.ts:90-97`) when The First is **not** bonded at arrival. It is never set in `initializeGameState`, so the CLI and every fixture keep a byte-identical tick-0 state and the full screen. It is never unset. An absent field means not staged.

### Graph nodes / edges

None. No new node or edge type. The First is found through the existing `thread` edge (`courtPosition: 'the_first'`).

### Tick phases

None. The selector is derived on read; nothing runs per tick.

### Resolution logic

None changed. Beats resolve through the existing `resolveBeat` path.

### PRNG callouts

None. The selector draws nothing.

## Content pillar

### Data tables

**C1 — `OPENING_REVEAL_TABLE`** in a new `src/data/opening-reveal-table.ts`. Each row is `{ surface: OpeningRevealSurfaceId, trigger: { kind: 'bond' } | { kind: 'first_chapter' } | { kind: 'gift', beatId: string }, newLabel: string }`. `newLabel` is the noun the "New beside the map" line uses. Each `beatId` must be a real `ASCENDANT_SPINE` id (asserted in a test).

| Surface id | Today's mount | Trigger | `newLabel` |
|---|---|---|---|
| `time_controls` | `GameViewTopBar` | bond | — |
| `identity` | `AscendantBar` identity block | bond | — |
| `essence` | `AscendantBar` Essence + Seat line | bond | — |
| `attention` | `GameViewTopBar` | bond | — |
| `hand` | `AscendantBar` Actions (cards and Move) | bond | — |
| `threads` | right sidebar Threads panel | bond | — |
| `chapter_ledger` | right sidebar ledger button | first chapter | "the Chapter Ledger" |
| `investiture` | `ActionsBlock` Investiture button | gift `beat.spine.the_seat` | "Investiture" |
| `chronicle` | right sidebar Chronicle | bond | — |
| `settings` | `GameViewTopBar` | bond | — |
| `read_threads` | `GameViewTopBar` | bond | — |
| `doom` | `GameViewTopBar` DoomBar | gift `beat.spine.the_seat` | "Doom" |
| `mandate` | `AscendantBar` MandateTracker | gift `beat.spine.the_seat` | "Mandates" |
| `notables` | `GameViewTopBar` NotablesButton | gift `beat.spine.the_first_word` | "Notables" |
| `reaches` | `AscendantBar` Reaches (and Signatures) | gift `beat.spine.a_path_opens` | "your Reaches" |
| `world_pulse` | right sidebar World Pulse | gift `beat.spine.a_path_opens` | "World Pulse" |
| `world_soul` | `GameViewTopBar` World-Soul | gift `beat.spine.a_path_opens` | "the World-Soul" |
| `omen` | `GameViewTopBar` OmenIndicator | gift `beat.spine.a_path_opens` | "Omens" |

Surfaces that are not in the table (the map, the LiveLocationBar, Rivals, Covenants, Hooks) keep their current behaviour. Rivals keeps THR-1648's "first rival act" gate; it is not staged further, because a rival acting against you is news the player needs whenever it comes.

### Prose tables

**C2 — The Seat names the Doom and the Mandates.** `SPINE_BEAT_PRESENTATION['beat.spine.the_seat'].prose` gains one closing sentence. The full new text:

> "A god adrift is only weather. But the world has left a hollow shaped to your absence — these stones, this height, this hush between walls. Bind a place to yourself and call it your seat, and the faith that gathers there will rise back to you as power, tide after patient tide. You will need it. This age has begun its slow slide toward its Doom, and every mandate you complete holds it back."

The register is game narration, not a novel (the game-wide prose register).

**C2b — A Path Opens names Omens.** `SPINE_BEAT_PRESENTATION['beat.spine.a_path_opens'].prose`: the prophet's clause gains the word. The full new text:

> "Three shapes of devotion lie before you, and the world is still soft enough to take any of them. The dreamer reads the deep water of sleeping minds; the prophet writes warnings across the waking sky, the omens every god must learn to read; the patron lifts the worthy higher than they could ever climb alone. Choose what kind of god you will be — for now."

The Omen indicator's existing tooltip then says the rest: *"A passing sign of what presses on the world, most often an echo of the doom."* (`ui.omen`, `ui-content.ts:80-83`). It names two words the player will see a moment later, and says the one thing a player needs about each: Doom is slow, and completing mandates holds it back. The verb is "complete", the same verb the shipped mandate tooltip uses. That matches the shipped tooltips (`ui.doom_bar`: *"A slow clock toward the world's unmaking … cannot end the world early"*; `ui.mandate_tracker`: *"complete them to gain essence and slow the Doom"*), so one fact is told one way (PC-6).

**C3 — The direction line** (new strings in `src/data/ui-content.ts`, next to `FIRST_RUN_PROMPT_CAPTION`):

- `OPENING_DIRECTION_CHAPTER_WAITING = 'Watch over {firstName}. A chapter of {theirPossessive} story is waiting →'`
- `OPENING_DIRECTION_LET_TIME_RUN = 'Watch over {firstName}. Let time run, and {theirPossessive} next chapter will come to you.'`

`{theirPossessive}` is `getPronouns(first.gender).their` (`src/data/domain-prose.ts:96`), which is "their" when the gender is unknown. The rendered line never shows a raw `{…}` token: an unresolvable name falls back to "The First".

**C4 — The reveal line** (toast tier): `OPENING_REVEAL_TOAST = 'New beside the map: {labels}.'`. `{labels}` joins the gift's `newLabel`s with ", " and a final " and ". Rendered for The Seat: *"New beside the map: Doom, Mandates and Investiture."* For the first chapter: *"New beside the map: the Chapter Ledger."* For A Path Opens: *"New beside the map: your Reaches, World Pulse, the World-Soul and Omens."* A gift with no staged rows (A Thing Left Behind) emits no line.

**C5 — The setting** (Settings panel): label *"Show every panel"*, help line *"Skip the slow reveal and put every panel on screen now."*

### Encounter templates

N/A — no encounter is added or changed.

### Attachment content

N/A — no attachments.

## UI pillar

*Screenshot tool: Playwright (DOM: top bar, left rail, right sidebar, toasts, Settings). No WebGL surface changes. UI Laws engaged: 1, 12, 13/14, 17, 21, 33, 37, 47, 53.*

### Player-facing display

**U1 — One hook, every mount.** `useOpeningReveal(gameState)` in `src/components/Game/GameView/openingReveal.ts` wraps `selectOpeningReveal`. It latches each `revealed` flag in a `useRef`, as `useFirstScreenReveal` does, so a shown panel never hides again in a session. It reads the "Show every panel" setting. `GameView` computes it once and passes a `reveal` object down to `GameViewTopBar`, `AscendantBar` and the right sidebar.
- `useFirstScreenReveal` keeps its contract for its two current readers, now ANDed with the staged rows for `doom`, `mandate`, `notables` and `omen`. The bond gate and the staged gate cannot disagree, because both require the bond.
- The Omen exception stays: the indicator still hides between omens.

**U2 — Mount sites honour the flag.** Each surface in the table renders only when its row is revealed. A hidden surface takes no space (no placeholder, no empty header), so the bond screen is visibly short: the top bar shows time, Attention, the direction line, Read the Threads and Settings; the left rail shows identity, essence and the hand; the right sidebar shows Threads and the Chronicle.

**U3 — The direction line.** A new `OpeningDirectionLine` in the top bar's centre group, after the time controls.
- Body text size, not uppercase (Law 37), one line, truncating with an ellipsis rather than wrapping.
- In `chapter_waiting` mode the whole line is a button. It opens The First's waiting chapter through the same handler as her Chapter Ledger row (Law 21, one action one path).
- In `let_time_run` mode it is plain text; the THR-1716 first-run Play caption still owns "press Play" while the clock has never run, and the direction line hides while that caption shows so the two never stack.
- It hides for good once `direction.show` is false.

**U4 — The highlight.** A surface whose row flips to revealed carries `data-newly-revealed="true"` and a 1px `--accent-gold` ring for `OPENING_REVEAL_HIGHLIGHT_MS`, then drops it. It is the one gold emphasis on that panel while it lasts (taste profile: one gold emphasis per panel). Nothing else moves.

**U5 — The toast.** On the render where rows flip, `GameView` pushes C4 once through the existing imperative toast channel, `setActionToasts` (`GameView.tsx:632`, merged into `ToastStack`; toast tier never pauses). The toast is keyed by the trigger (`beatId`, `first_chapter` or `ceiling`), so a re-render cannot duplicate it.
- **Collapse rule (PC-5).** All rows that flip on the same render share **one** line, with every new label in table order. Two gifts and the first chapter landing together read: *"New beside the map: the Chapter Ledger, Doom, Mandates and Investiture."* The player never sees more than one reveal toast at a time, however many triggers fire.
- **The ceiling says so (PC-4).** When the ceiling reveals rows, the line names them and says why: *"New beside the map: Notables, your Reaches, World Pulse, the World-Soul and Omens. Nothing more is hidden."* (`OPENING_REVEAL_CEILING_SUFFIX = ' Nothing more is hidden.'`). "Show every panel" stays silent, because the player asked for it.

**U6 — The setting.** "Show every panel" in the Settings panel, stored in `localStorage` under `OPENING_REVEAL_SHOW_ALL_KEY` (wrapped in try/catch; a throw reads as off). Turning it on reveals every row at once with no toast and no highlights.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Direction line, chapter waiting | "Watch over Elara. A chapter of her story is waiting →" | PC-7 | It names the first job and the arrow opens it. Clicking lands on the chapter. |
| Direction line, idle | "Watch over Elara. Let time run, and her next chapter will come to you." | PC-7, PC-4 | It names the job and the one control that moves it (time). |
| The Seat (gift modal) | "…tide after patient tide. You will need it. This age has begun its slow slide toward its Doom, and every mandate you complete holds it back." | PC-1, PC-6 | The two words arrive in a sentence first. The Doom tooltip that follows says the same thing in more detail: *"A slow clock toward the world's unmaking … cannot end the world early."* |
| Reveal toast | "New beside the map: Doom, Mandates and Investiture." | PC-1, PC-5 | It names exactly the panels that just appeared, one line per gift. Each panel's existing tooltip explains it on hover (THR-1814). |
| Reveal toast | "New beside the map: your Reaches, World Pulse, the World-Soul and Omens." | PC-1, PC-5 | The same; it arrives right after the player chose what kind of god to be. |
| A Path Opens (gift modal) | "…the prophet writes warnings across the waking sky, the omens every god must learn to read…" | PC-1 | The word arrives in the gift's sentence. When the indicator appears, its hover reads: "A passing sign of what presses on the world, most often an echo of the doom. It lasts a few days and colours what the world brings up while it does." |
| Reveal toast, first chapter | "New beside the map: the Chapter Ledger." | PC-1, PC-5 | It appears as The First's first chapter starts, and the ledger is where that chapter is listed. |
| Reveal toast, several at once | "New beside the map: the Chapter Ledger, Doom, Mandates and Investiture." | PC-5 | One merged line, never a stack. |
| Reveal toast, ceiling | "New beside the map: Notables, your Reaches, World Pulse, the World-Soul and Omens. Nothing more is hidden." | PC-4 | The game says it revealed the rest on its own, and that nothing more is hidden. |
| Settings | "Show every panel" / "Skip the slow reveal and put every panel on screen now." | PC-4 | The staging is a default the player can switch off, and the setting says so. |

PC-8 check: the direction line's arrow is the only new control. Its reply within one second is the chapter opening. If the chapter has already closed, the line has already switched to idle on the same render, so there is never a dead arrow.

### Playtest signal

- A round-4 tester who reaches the main map can say, in their debrief, what their first job was ("watch over Elara" or their own words for it).
- No round-4 tester describes the post-bond screen as "overwhelming", "a dashboard" or "no prompt".
- A tester who meets Doom can say it is slow and cannot end the world early.

### Event notifications

One toast-tier line per gift that reveals rows (C4). No chronicle line (the gift itself is already the chronicle's moment), no interrupt.

### Debug inspection (DebugPanel)

`window.__DEBUG.getOpeningReveal()` returns a Promise of `{ staged: boolean, showAll: boolean, rows: Record<OpeningRevealSurfaceId, { revealed: boolean, reason: string }>, direction: { show: boolean, mode: string, firstId: string | null } }`. Declared in `src/debug-bridge.d.ts` beside `getOpeningState`. While there, fix the dangling `getAscendantBeats()` reference in `debug-bridge.d.ts:2320` to point at `listBeats()`.

### Visual presence (HexMapV2)

N/A — no map layer changes. The map is never hidden.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `openingReveal.ts` (engine selector) | — (derived on read) | `GameView` via `useOpeningReveal` | reads `openingRevealStaged`, `ascendantBeats`, `doomClock.wokeAtTick`, `chapterArchive`, `graph` | — (see Tracing) | `getOpeningReveal()` |
| `opening-reveal-table.ts` | — | — | — | — | `getOpeningReveal().rows` |
| arrival flag | `useSimulation` arrival memo | — | writes `openingRevealStaged` | — | `getOpeningReveal().staged` |
| `OpeningDirectionLine` | — | `GameViewTopBar` | — | — | `getOpeningReveal().direction` |
| reveal toast | — | `GameView` toast push | — | — | DOM toast text |

Prose pipeline: none (`enrichProse` is not involved; the strings are plain UI copy with two slots).

## Interface impact

| Contract | Change | Note |
|---|---|---|
| `GameState` shape | **extend** | Optional `openingRevealStaged`; absent means unstaged. |
| `firstScreenReveal` → `GameViewTopBar` / `AscendantBar` | **extend** | The `reveal` prop gains the staged rows; the existing five flags keep their meaning. |
| `meetingEncounter.isFirstBonded` | **preserve** | Now calls the new `getFirstId`; same result. |
| debug bridge | **add** | `getOpeningReveal()`. |

No cross-system engine write is added: the only new write is the arrival flag, read by the selector in the same change.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `OPENING_REVEAL_TABLE` | 18 rows (C1) | Which surface waits for which gift. Moving a row is a one-line change. |
| `OPENING_REVEAL_CEILING_TICKS` | 200 | Ticks after the bond when every staged row reveals regardless (spine worst case ≈ 4 × 36). |
| `OPENING_REVEAL_HIGHLIGHT_MS` | 6000 | How long a newly revealed panel keeps its gold ring. 0 disables. |
| `OPENING_REVEAL_SHOW_ALL_KEY` | `'tb.openingReveal.showAll'` | localStorage key for "Show every panel". |
| `OPENING_DIRECTION_CHAPTER_WAITING` / `_LET_TIME_RUN` | (C3) | The two direction-line strings. |
| `OPENING_REVEAL_TOAST` | (C4) | The "New beside the map" template. |
| `OPENING_REVEAL_CEILING_SUFFIX` | `' Nothing more is hidden.'` | Appended when the ceiling reveals rows. |

## Tracing

No new trace type. The reveal is a pure derivation of state that is already traced: each gift's resolution emits the beat trace, and the doom wake emits `doom.wake`. "Why is this panel hidden?" is answered by `getOpeningReveal().rows[surface].reason`, which names the gift it waits for. A per-render trace would fire on every React render and add noise, not causes.

```ts
// Debug accessor shape (not a trace)
interface OpeningRevealDebug {
  staged: boolean;
  showAll: boolean;
  rows: Record<OpeningRevealSurfaceId, { revealed: boolean; reason: OpeningRevealReason }>;
  direction: { show: boolean; mode: 'chapter_waiting' | 'let_time_run'; firstId: string | null };
}
type OpeningRevealReason =
  | 'not_staged' | 'pre_bond' | 'at_bond' | 'ceiling' | 'spine_done'
  | 'first_chapter' | 'no_beat_state' | 'unknown_beat'
  | `gift:${string}` | `waiting:${string}`;   // waiting:first_chapter included
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The selector throws (bad graph, missing beat state) | Every row revealed, direction hidden: today's full screen. |
| `ascendantBeats` absent | Rows with gift triggers reveal (`spine_done` semantics); bond rows follow the bond. |
| A table `beatId` not in `ASCENDANT_SPINE` | A test fails at build time. At runtime that row reveals at the bond. |
| Bonded by the thread edge, doom clock not yet woken | Bond rows reveal; the ceiling and the chapter filter count from `state.tick` until the clock reports its wake tick. |
| The spine stalls (suppressed beats, dev lever) | The ceiling reveals everything 200 ticks after the bond. |
| The First dies or is un-threaded before the first chapter | `firstId` is null, so the direction line hides; the latched panels stay. |
| `localStorage` throws | "Show every panel" reads as off and the toggle still works for the session. |
| The direction line's chapter closed between render and click | The click opens the Chapter Ledger on The First's row instead. The ledger is already revealed, because `chapter_waiting` mode only shows when The First has an active or offered chapter, and both satisfy the `first_chapter` trigger. |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | ~700 files import it | One optional field. No existing field changes, so nothing that compiles today can stop compiling. |

## Slicing

One implementation ticket. The engine selector, the table and the mount gating are one change, because shipping the gating without the direction line (or the other way round) would leave half of PC-7. The size is M.

## Three-pillar check

- [x] Engine pillar present (E1 selector, E2 arrival flag)
- [x] Content pillar present (C1 table, C2 Seat sentence, C3–C5 strings)
- [x] UI pillar present (U1–U6)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It leans on the taste profile's *IPK as the teaching surface* (a panel arrives after the sentence that introduces it) and *Real time, halting for every moment* (nothing here stops the clock). It also leans on 00-north-star's *"one complex story at a time … the feeling of a chapter, not the feeling of a spreadsheet"*, and on 03-design-tensions § 4, *"the game shows its hand slowly"*. The counter-pull toward legibility is present: the direction line, the naming sentence and the reveal toast.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play. Doom, mandates, pacing and casting are unchanged; only *when a panel is drawn* changes.
- [x] No `Docs/canon/rulebook.md` edit is owed.

> Brainstorm companion: [`2026-10-12-thr-1808-post-bond-reveal-brainstorm.md`](2026-10-12-thr-1808-post-bond-reveal-brainstorm.md).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | The reveal order is a data table; the ceiling, highlight and strings are named constants. |
| 2. Inspectability | PASS with note | No new trace (derived state); `getOpeningReveal()` names the reason for every row. |
| 3. Determinism | PASS | No PRNG; the selector is a pure function of state. |
| 4. Fail-soft | PASS | Every failure falls back to today's full screen (table above). |
| 5. Narrative over mechanical perfection | PASS | Panels arrive with the story sentence that introduces them. |
| 6. Additive over destructive | PASS | One optional GameState field, one new module, one new data file; THR-1648's selector is extended, not replaced. |
| 7. Performance budget | PASS | One pass over 18 rows and a `chapterArchive` filter (capped at 2000 records); no tick cost. `useOpeningReveal` memoises on `worldVersion` and `ascendantBeats.history.length`, and stops filtering the archive once the direction line has hidden for good. |

## Kill criteria

- If a round-4 tester still calls the post-bond screen overwhelming, the table is wrong, not the mechanism: move more rows later (World Pulse and World-Soul first).
- If a round-4 tester is blocked because a panel they needed was hidden, move that row earlier. If two or more rows need that, stage by chapter instead of by gift.
- If the direction line is read as an ad or ignored by all three testers, replace it with a pulse on The First's Threads row and record that in the plan's follow-up.

## Done when

- [ ] On `?view=game&firstunmet&size=medium`, right after the bond, the screen shows the time controls, identity, essence, Attention, the hand with Move, Threads, the Chronicle, Settings and Read the Threads. Doom, Mandates, Investiture, the Chapter Ledger button, Notables, the Reaches, World Pulse, World-Soul and Omen are absent, and `await window.__DEBUG.getOpeningReveal()` reports each with a `waiting:<trigger>` reason.
- [ ] After The Seat resolves, Doom, Mandates and Investiture are on screen and the toast "New beside the map: Doom, Mandates and Investiture." has appeared once.
- [ ] The Chapter Ledger button appears when The First's first post-bond chapter starts.
- [ ] The Seat's and A Path Opens' modals show the new text verbatim (C2, C2b).
- [ ] The direction line shows from the bond and is gone once The First's first non-routine post-bond chapter has resolved (`getOpeningReveal().direction.show === false`).
- [ ] `?view=game&seeded&size=medium` shows today's full screen and `getOpeningReveal().staged === false`.
- [ ] "Show every panel" puts every row on screen at once.
- [ ] Unit tests: the selector over each reason; every table `beatId` exists in `ASCENDANT_SPINE`; the ceiling; the CLI's tick-0 state is unchanged.
- [ ] `npm run gate` green; four-part browser evidence at 1920×1080 (screenshot of the bond screen and of the post-Seat screen, console output, the `getOpeningReveal()` assertion, a UI-Laws judgment line for Laws 1, 13/14, 17, 21, 33, 37, 53).
- [ ] Closing commit body includes the implementation ticket's closer line alone on its own line.

## Coordination block

**Suggested model:** opus — a cross-surface UI change over a wide-blast type file, with copy and a pure selector to test.

**Parallel-safe with:** [Dominion core](https://linear.app/threadbare/issue/THR-1748) — engine-side, it touches cast resolution and world objects, not the top bar, left rail or onboarding state.

**Mutex with:** any implementation ticket from [The screen frame](https://linear.app/threadbare/issue/THR-1828), because both rewrite `GameViewTopBar.tsx`, `AscendantBar.tsx` and the right sidebar in `GameView.tsx`. Whichever lands second re-applies the `reveal` gating to the moved mounts.

**Files to touch:**
- Create: `src/engine/openingReveal.ts` (E1 selector)
- Create: `src/data/opening-reveal-table.ts` (C1)
- Create: `src/components/Game/GameView/openingReveal.ts` (U1 hook)
- Create: `src/components/Game/OpeningDirectionLine.tsx` (U3)
- Edit: `src/types/gameState.ts` (E2 optional field)
- Edit: `src/components/Game/hooks/useSimulation.ts` (E2 arrival flag)
- Edit: `src/engine/meetingEncounter.ts` (export `getFirstId`)
- Edit: `src/components/Game/GameView/firstScreenReveal.ts` (AND with staged rows)
- Edit: `src/components/Game/GameView.tsx` (compute once, pass down, toast, right-sidebar gating)
- Edit: `src/components/Game/GameView/GameViewTopBar.tsx` (gating, direction line)
- Edit: `src/components/Game/ascendant-bar/AscendantBar.tsx` and `ActionsBlock.tsx` (gating, including Investiture)
- Edit: `src/data/ascendant-beat-content.ts` (C2 Seat sentence, C2b A Path Opens clause)
- Edit: `src/data/ui-content.ts` (C3–C5 strings)
- Edit: `src/components/Game/SettingsPanel.tsx` (U6 toggle; it is rendered from `GameViewTopBar.tsx:366`)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (accessor; fix the dangling `getAscendantBeats` reference)

## Notes for the executor

- **Player copy says "beside the map", not "table".** [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823) uses "table" for the map itself, so this plan's toast avoids the word. No new UL term is introduced.

- **Key by surface id, not position.** If [The screen frame](https://linear.app/threadbare/issue/THR-1828) has landed first, find each surface by its component (DoomBar, MandateTracker, WorldPulse and so on) wherever it now mounts. The table does not change. If the frame has dropped World Pulse, drop its row.
- **Do not touch the spine.** Pacing, gates, grants and the gift hold are out of scope. If a gift does not fire, that is a separate bug.
- **Do not set `openingRevealStaged` in `initializeGameState`.** The CLI and the test fixtures must keep a byte-identical tick-0 state (the THR-1716 E2 rule).
- **The latch matters.** A panel that appeared must never vanish in the same session (a First who dies does not re-quiet the screen).
- "Read the Threads" stays at the bond because it is the god's digest of what the threads did; it is how a confused player catches up.

## Intent-judge verdict

**Allow** on the third run (2026-10-12, Reversible). Run 1 Revise: name the Settings path and toast channel, say what the ceiling and simultaneous reveals show (PC-4, PC-5), name the round-3 siblings. Run 2 Revise: "table" collided with [The Map Is the Table](https://linear.app/threadbare/issue/THR-1823) (now "beside the map"), A Path Opens had to name omens (C2b), and the mandate verb had to match the tooltip ("complete"). Run 3 Allow with one dimension-4 GAP, folded in: the bond is read from the thread edge and the doom wake only anchors the tick (`resolveDoomWokeAtTick`), with a fail-soft row for the one render between them.

## Forked-audit verdicts

### NFP audit

**PASS-with-notes.** Tunability, Determinism, Narrative and Additive: PASS. Inspectability: no new trace, justified as derived state; `getOpeningReveal()` names a reason for every row. *Folded in:* the reason union now carries `first_chapter`, `no_beat_state` and `unknown_beat`. Fail-soft: PASS; the two runtime fallbacks it flagged (absent beat state, unknown `beatId`) are now named reasons in E1. Performance: PASS; *folded in:* the hook memoises on `worldVersion` and the beat-history length, and stops filtering the archive once the direction line has hidden.

### Three-pillar audit

**PASS-with-notes.** Engine, Content and UI are all present and substantive, and no required section is missing. The wiring table maps every module to its phase, component, state fields and debug surface. Substrate check PASS: the plan extends THR-1648's `selectFirstScreenReveal` rather than rebuilding it, and it reads the beat history and doom wake that already exist. Note: no new trace type, accepted as derived state.

### Vision audit

**PASS-with-notes.** No contradictions. Confirmed: north-star ("the feeling of a chapter, not the feeling of a spreadsheet"); 03-design-tensions § 4 ("the game shows its hand slowly", balanced by the direction line and the toast); taste profile (IPK as the teaching surface; real time, halting for every moment; one gold emphasis per panel). Soft note: Notables and World Pulse arrive with the third and fifth gifts, so the portfolio-scan half of the core loop shows up later in the first session. The 200-tick ceiling bounds the delay. Recorded as a lever: move those rows earlier if round 4 shows it.
