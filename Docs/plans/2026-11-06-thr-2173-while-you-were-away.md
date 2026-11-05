> **title:** While you were away — the warm-up card ends on a short recap led by The First's chapters, with one button into the Ledger, and its time-left line steps in half minutes below three minutes (THR-2173, slice 1)
> **linear_issue:** THR-2173
> **author:** Claude Code (design lane, unattended, 2026-11-06 — run dl-20261105T2319)
> **created:** 2026-11-06
> **three_pillars:** Engine done (one pure view module, no rule, no tick phase) · Content done (player-facing words, listed exactly) · UI done

# While you were away (THR-2173, slice 1)

*A warm tester waits about two minutes behind "The world moves on", then lands on the map with nothing to say what happened. The story lives in a 56-entry Ledger three clicks away. The fix is the standard "since you were gone" pattern of idle and strategy games: the card the player has already been staring at does not vanish when the warm-up ends. It turns into a short recap of at most five lines. The First's finished chapters come first, then what The First is doing now, then the god's places that slipped or grew. Two buttons follow: **Begin**, and **Read it in the Ledger**, which opens the Ledger at The First's newest chapter. The time-left line also stops sitting on "About 2 minutes" for a whole minute.*

## Why this is load-bearing

[Warm playtest round 3](https://linear.app/threadbare/issue/THR-2173), 3 of 3 testers. It is the skimmer's quit point and the story tester's "one thing to tell the designer". The ticket's Fixed-when: a tester names something that happened while they were away within their first ten actions. Christian's period focus (chat, 2026-11-01) is the *legibility and usability of the different UI modules*. [The rail rows plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-05-thr-2175-rail-rows-say-what-they-are.md) deferred one item to this ticket: re-running first-use captions on a warm arrival. This plan decides it (decision 6).

## Substrate inventory

Measured on `main` @ `7a3da16b`, 2026-11-06.

| What | Where | What it gives the recap |
|---|---|---|
| The warm-up card | `components/Game/WarmStartOverlay.tsx` (114 lines). An `Overlay`, S tier, no controls, closes itself when `warmStart.running` goes false (`hosts/DialogHost.tsx:245`) | The container. No new surface |
| Its interrupt entry | `engine/views/interruptRegistry.ts:136` `'warm-start': s => s.warmStartRunning === true`; `data/homed-surfaces.ts:66` (`stopsTime: true`) | Holds time and the other dialogs while it is up |
| The done line | `useWarmStart.ts` effect after arrival. It logs `[warm-start] done {...}` and drops `WarmStartOverlay` from `openInterruptsAtArrival` | The harness reads it (`scripts/cold-playtest/extract.mjs`) |
| The time-left words | `formatWarmRemaining` (`useWarmStart.ts:177-180`): `Math.ceil(ms / 60_000)` whole minutes | Anything from 61 to 120 s reads "2 minutes" |
| Chapter records | `gameState.chapterArchive` (`types/chapterRecord.ts:62`): `actorId`, `actorName`, `templateName`, `outcome`, `startTick`, `resolvedTick`, `threaded`, `routine`, `actionId` | Which chapters finished inside the warm window, and whose |
| Live chapters | `activeLedgerEncounters(gameState)` (`engine/threadedChapters.ts:77`) | What The First is in the middle of |
| The ending as a sentence | `outcomeSentence(actorName, templateName, outcome)` (`engine/aftermathWords.ts`, THR-1964), e.g. *"Kael won Bridge Toll, at a price."* | Each finished-chapter line, in the words the Aftermath already uses |
| The god's hold on places | `readDominionLedger(graph, ascendantId).bands` (`engine/phaseDominion.ts:98`), rewritten after each sphere-pressure pass; `DOMINION_BAND_WORDS` / `DOMINION_BAND_RANK` (`data/dominion-content.ts`) | Places whose band changed between the start and the end of the warm-up |
| Day lines about places | `composeDominionChronicle` → `tickEvents` only (`phaseDominion.ts:~495`) | **Not usable.** `recentEvents` keeps about 100 events, so a 300-tick warm-up has dropped most of them. The recap diffs the bands instead |
| Ledger at a row | `ChapterLedger initialRecordKey` (`DialogHost.tsx:255-259`, THR-1893) | The button opens the Ledger at a chosen chapter |
| Names as links | `ChronicleSegment { text, ref? }` (`types/narrative.ts:166`) rendered with `EntityLink` (`ChronicleEntryCard.tsx:99-102`) | Law 2 / Law 21 for the names in the recap |

Every row is 🟢 ACTIVE on `main`. Disposition: the warm-up card, its interrupt entry, the done line and the time-left words are **extended**; every other row is **read only**, and nothing is replaced or activated.

**Blast Radius:** N/A. No touched file has ≥100 importers (measured: `data/ui-content.ts` 44, `engine/views/interruptRegistry.ts` 15, `GameView.tsx` 7, `dialogSize.ts` 7, `useWarmStart.ts` 7; `DialogHost.tsx` 2, `GameView.tsx` and `map/GameMap.tsx`).

Two things follow:

- **Every line can be built from records that already exist.** Nothing new has to be stored, and no tick phase changes. The god's places are the one gap (the day lines expire), and two reads of the band table, one before the warm-up and one after, close it.
- **Rival moves cannot be named reliably yet.** The rival behind a slipped place is looked up as a graph node, and rivals are not graph nodes ([rival gods you can see but not answer](https://linear.app/threadbare/issue/THR-2172) records this side defect). The recap says a place slipped and does not say who did it. That ticket owns rival causes.

## Decisions (made by the design lane under delegation, 2026-11-06 — veto in chat)

1. **The returning god sees the mortal's story first, then the world as it touches them.** This answers the ticket's design question from settled direction: The First is the god's first threaded mortal and the spine of the game, and the Chapter Ledger is the story's record. It is also the ticket's recommended direction. A world summary of strangers' events is what the toasts already give, and testers called those noise ("Miamia's succession settled…").
2. **The recap lives on the warm-up card, not on a new screen.** When the warm-up ends, the same card swaps its waiting lines for the recap and gains two buttons. No fourth container type ([the map is the table](https://linear.app/threadbare/issue/THR-1823)). The card grows from S to M tier for the recap.
3. **What it says, at most five lines, kept by priority and shown in story order.**
   - **The First's finished chapters** in the warm window (`resolvedTick > startTick`, not routine), newest first. Each is one `outcomeSentence`. Up to `WARM_RECAP_FIRST_CHAPTERS` (2). If more finished, one more line says how many: *"Kael finished three more chapters."*
   - **What The First is doing now**, when a live chapter is theirs: *"Kael is in the middle of The Gallows Pardon."*
   - **Places of yours that slipped**, if any. These are places that were Touched or better at the start and are lower now: *"Iron Glade slipped from Held to Touched."* If there are several: *"Three of your places slipped: Iron Glade, Ashford and others."*
   - **Places that grew**, if any. These are places now Held or Sovereign that were lower at the start (the bands the chronicle already names, `DOMINION_RISE_LINE_BANDS`): *"Ashford is Held now."* If there are several: *"Ashford and Mere Hollow are more yours now."*
   - **Keep order when over five:** the newest finished chapter, the slipped line, the doing-now line, the second finished chapter, the grew line, then the "more chapters" line. They are **shown** in the order of the list above. **Empty:** *"Nothing in your story changed while you were away."*
4. **Names are links.** The First, each chapter name and each place are segments with a `WorldRef`, rendered with `EntityLink` (Law 2, Law 21). Clicking one closes the recap and opens that thing, as **Begin** would.
5. **Two buttons.** **Begin** (primary, focused) closes the card, and the game is left paused as today. **Read it in the Ledger** closes the card and opens the Ledger at The First's newest chapter in the window, or at the Ledger's default view when there is none. Escape is Begin (Law 23). Decisions held during the warm-up open after the card closes, as they do now.
6. **No re-run of first-use captions on arrival.** The recap tells what happened; it does not teach words. The opened-row definition line in [the rail rows say what they are](https://linear.app/threadbare/issue/THR-2183) is how a warm player learns the rail words. Ten captions after a recap would be the pile-up [THR-2060](https://linear.app/threadbare/issue/THR-2060) removed.
7. **The time-left line steps in half minutes below three minutes:** *"About 3 minutes left."* → *"About 2½ minutes left."* → *"About 2 minutes left."* → *"About 1½ minutes left."* → *"About a minute left."* → *"About half a minute left."* → *"Almost there."* (under 20 s, unchanged). Each step still rounds up, so the wait never overruns its words. At three minutes and above the line stays in whole minutes.

Rejected, one line each: **opening the Ledger on arrival** (the story tester's ask). The Ledger is a 56-row archive, and the skimmer quit on length, so a five-line digest with a button into it serves both. **A toast or a Chronicle tab badge.** Toasts are the noise testers already skip, and a badge is a click they did not make. **Naming the rival behind a slipped place.** The lookup is broken today ([THR-2172](https://linear.app/threadbare/issue/THR-2172)). **Shortening the warm-up itself** (127 s this round). It is under the 180 s kill line in [the warm playtest plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1744-warm-playtest.md#kill-criteria), and tick cost is engine performance work, not this surface.

**Not in this slice:** a recap anywhere outside the warm arrival. The game has no saved worlds. The warm playtest plan names a saved-world feature as a product decision. Nothing in ordinary play today is a return after time away.

## Content pillar

New entries in `data/ui-content.ts`, beside the `ui.warm_start.*` keys (`:974-1002`). Each is one sentence and passes `tooltipValidation.test.ts`:

| Key | Words | Fills |
|---|---|---|
| `ui.warm_recap.title` | "While you were away" | — |
| `ui.warm_recap.first_now` | "{first} is in the middle of {chapter}." | segments |
| `ui.warm_recap.first_more` | "{first} finished {count} more chapters." / one: "{first} finished one more chapter." | count in words (`countWord`, `engine/aftermathWords.ts:268`: "two" … "nine", then "many"; Law 13) |
| `ui.warm_recap.slipped_one` | "{place} slipped from {from} to {to}." | `DOMINION_BAND_WORDS` |
| `ui.warm_recap.slipped_many` | "{count} of your places slipped: {list}." | `countWord`, capitalised at the start of the sentence; list as `formatList` in `phaseDominion.ts:395` (export it; three names, then "and others") |
| `ui.warm_recap.grew_one` | "{place} is {to} now." (the same words as `DOMINION_CHRONICLE_TEMPLATES.rise`) | — |
| `ui.warm_recap.grew_many` | "{list} are more yours now." | — |
| `ui.warm_recap.empty` | "Nothing in your story changed while you were away." | — |
| `ui.warm_recap.next_held` | "It opens when you begin." (after `ui.warm_start.held`) | shown when `pendingInterruptsAtArrival > 0` or a held decision is queued |
| `ui.warm_recap.next_paused` | "The world is paused. Press play when you are ready." | shown otherwise |
| `ui.warm_recap.begin` | "Begin" | button |
| `ui.warm_recap.open_ledger` | "Read it in the Ledger" | button |
| `ui.warm_start.remaining_half` | "About {time} left." with `{time}` ∈ "2½ minutes", "1½ minutes", "half a minute" | — |

The finished-chapter lines take `outcomeSentence` as it is. No new outcome words.

## Engine pillar

**New pure module `src/engine/views/warmRecap.ts`.** It reads only and writes nothing. It has no tick phase and no PRNG.

```ts
export interface WarmRecapSnapshot { startTick: number; firstId: string | null; bands: Readonly<Record<string, DominionBand>>; }
export type WarmRecapLineKind = 'first_finished' | 'first_more' | 'first_now' | 'slipped' | 'grew' | 'empty';
export interface WarmRecapLine { kind: WarmRecapLineKind; segments: readonly ChronicleSegment[]; }
export interface WarmRecapVM { lines: readonly WarmRecapLine[]; ledgerKey: string | null; }
export function snapshotWarmRecap(state: GameState, firstId: string | null): WarmRecapSnapshot;
export function buildWarmRecap(state: GameState, before: WarmRecapSnapshot): WarmRecapVM;
```

`buildWarmRecap` applies decision 3. It filters `chapterArchive` by `actorId === firstId && !routine && resolvedTick > startTick`, finds the live chapter with `activeLedgerEncounters`, and diffs `readDominionLedger(...).bands` against `before.bands` by `DOMINION_BAND_RANK`. `ledgerKey` is the newest finished chapter's `actionId`, else The First's live chapter's, else null.

## UI pillar

- **U1 — `useWarmStart`.** Add `snapshotRecap: () => WarmRecapSnapshot` and `buildRecap: (s) => WarmRecapVM` to its args. Take the snapshot after `settleOpening` and before the first chunk, so the opening gifts are not counted as news. On arrival, build the recap and keep it in state. Add `recap: WarmRecapVM | null` and `dismissRecap(): void` to `UseWarmStartResult`. Add `recapLines: number` and `recapCut: WarmRecapLineKind[]` (the kinds the keep order dropped; additive) to the done line.
- **U2 — the interrupt entry.** `'warm-start': s => s.warmStartRunning === true || s.warmRecapOpen === true`. Same kind, same `WarmStartOverlay` id, so the done line's exclusion still holds and held decisions still wait behind it.
- **U3 — `WarmStartOverlay`.** It takes `recap?: WarmRecapVM`, `onBegin` and `onOpenLedger`. With a recap it draws the title, the lines as a left-aligned list at `--measure-ui` (band words as tooltip terms), the muted next-step line, then the two buttons in a `Modal.Footer`-order act row. It closes on Escape and moves focus to Begin (Law 50). It switches to `dialogSizeStyle('m')` and its `dialogSize.ts` row becomes `sizes: ['s', 'm']`. Without a recap it is today's card exactly.
- **U4 — `DialogHost` / `GameView`.** Render while `running && progress` **or** `recap`. **Read it in the Ledger** sets `chapterLedgerInitialKey = recap.ledgerKey` and opens the Ledger. `EntityLink` routes through the one router.
- **U5 — `formatWarmRemaining`.** Below `WARM_START_FINE_BELOW_MS`, round up to `WARM_START_FINE_STEP_MS` and use the half-minute words.

### Player-facing text

| Surface | Exact text | Complaint class | How the player understands it |
|---|---|---|---|
| Recap title | "While you were away" | PC-7 (no direction) | This card is what happened, before I act |
| Finished-chapter line | `outcomeSentence`, e.g. "Kael won Bridge Toll, at a price." | PC-6 (one fact two ways) | The same words the Aftermath and the Ledger row use for that chapter, so the recap and the Ledger agree word for word |
| More-chapters line | "Kael finished three more chapters." | PC-7 | There is more; the Ledger button has it |
| Doing-now line | "Kael is in the middle of The Silver Drift." | PC-7 | What to look at first |
| Slipped / grew lines | "Iron Glade slipped from Held to Touched." / "Ashford is Held now." | PC-1 (terms) | Each band word is a segment carrying its existing hover, `ui.dominion.<band>` (`ui-content.ts:197-201`, words from `DOMINION_BAND_LINES`): Held = *"Yours, and holding. Cheaper works, richer threads."*, Touched = *"Your mark is on it. A little cheaper."*, Sovereign = *"Wholly yours. Your works come easiest here."* Each place is a link |
| Next-step line (always last, muted) | With a held decision waiting: today's `ui.warm_start.held`, *"Anything that needs your choice has waited for you."* followed by the new `ui.warm_recap.next_held`: *"It opens when you begin."* Otherwise the new `ui.warm_recap.next_paused`: *"The world is paused. Press play when you are ready."* | PC-7 | What happens on Begin and what to do after it: the paused clock is named (Law 52), and a waiting decision is promised before it appears |
| Empty line | "Nothing in your story changed while you were away." | PC-7 | Nothing was missed |
| Buttons | "Begin" / "Read it in the Ledger" | PC-8 (nothing answers) | Begin closes the card at once and the map is there; the Ledger opens on Kael's newest chapter |
| Time left | "About 2½ minutes left." … "About half a minute left." | PC-7 | The wait moves every half minute instead of sitting on one number. The half-minute words are the existing estimate's pattern made finer, not a new magnitude (Law 13 governs mortal-facing magnitudes; this is chrome about real time) |

Every rendered sentence fills its slots from records; a slot that cannot fill drops its line (fail-soft table), so no raw `{token}` reaches the card (Law 43).

### Player-facing display

On a warm arrival, the card titled *"While you were away"* reads, for example: *"Kael won Bridge Toll, at a price."* / *"Kael lost The Gallows Pardon."* / *"Kael is in the middle of The Silver Drift."* / *"Iron Glade slipped from Held to Touched."* / *"Ashford is Held now."* Under the lines are **Begin** and **Read it in the Ledger**.

### UI Laws engaged

Law 2 and Law 21 (the producer declares names, and each name is a link), Law 13 (counts in words, no ticks), Law 14 (no raw keys: band and outcome words come from their tables), Law 17/18 (one registry, sentences under 200 characters), Law 23 and Law 50 (Escape and focus), Law 26 (the existing `Overlay` and dialog tiers, no new primitive), Law 33 (M tier fits at 1920×1080, nothing scrolls), Law 42 (game prose, plain register), Law 49 (one card, not a toast storm), Law 52 (the card names why time is held: `holderName` "the world settling" stays), Law 54 (the wait is a designed state with an honest estimate).

### Playtest signal

- A warm round-4 tester names something from the recap, or from the Ledger it opened, within their first ten actions (the ticket's Fixed-when).
- No tester says the time-left line was stuck.

### Event notifications · Debug inspection · Visual presence (HexMapV2)

No new events. Nothing changes on the map. Debug: the done line's `recapLines`, and test ids `warm-recap`, `warm-recap-line-{kind}`, `warm-recap-begin`, `warm-recap-open-ledger`.

## Canon pillar (lands in the same PR)

`Docs/design-system/layout-zones.md`, z-band 50 row (`:156`), after "S card, THR-1880": "M card for the recap. On arrival the warm-up card becomes the recap (title, ≤5 lines, Begin / Read it in the Ledger) before the game is handed back (THR-2173)."

## Interface impact

| Contract | Change |
|---|---|
| `chapterArchive` → `warmRecap` | add (read only) |
| `readDominionLedger().bands` → `warmRecap` | add (read only) |
| `useWarmStart` → `DialogHost` / interrupt registry | extend (`recap`, `warmRecapOpen`) |
| `[warm-start] done` line → `extract.mjs` | extend (additive `recapLines`) |

These are new cross-system reads with a production read site (the overlay). The executor adds them to `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `engine/views/warmRecap.ts` | none (read at warm start and arrival) | `WarmStartOverlay` via `DialogHost` | reads `chapterArchive`, `unifiedActions`, the god's dominion ledger | none | done line `recapLines`; test ids |

Wiki: grep `public/*.html` for `useWarmStart.ts` / `WarmStartOverlay.tsx` as `sources` and update the matching page. Run `check:wiki-freshness:blocking` either way.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `WARM_RECAP_MAX_LINES` | 5 | Most lines the recap shows | `engine/views/warmRecap.ts` |
| `WARM_RECAP_FIRST_CHAPTERS` | 2 | The First's finished chapters named one by one | same |
| `WARM_RECAP_KEEP_ORDER` | `['first_finished#1','slipped','first_now','first_finished#2','grew','first_more']` | Which lines survive the cap | same |
| `WARM_RECAP_LIST_NAMES` | 3 | Place names before "and others" | same |
| `WARM_RECAP_SLIPPED_FROM_BAND` | `'touched'` | A place counts as slipped only if it was at least this band at the start (as `composeDominionChronicle`'s drop rule) | same |
| `WARM_START_FINE_BELOW_MS` | 180 000 | Below this, the time left steps in half minutes | `useWarmStart.ts` |
| `WARM_START_FINE_STEP_MS` | 30 000 | The half-minute step | same |

## Tracing

N/A — the recap reads records that already exist and changes nothing in the simulation. The done line is its evidence.

## Fail-soft table

| Failure | Fallback |
|---|---|
| No First bonded (`firstId` null) | Only the place lines; empty line if none |
| `buildWarmRecap` throws | The card closes as today (no recap). One `console.error` |
| The snapshot was not taken (the warm-up stopped early, or it threw) | The hook builds a fallback snapshot from its own `startTick` arg (the tick the warm-up began at) with `bands: {}` and The First's id, so the recap has chapter lines only |
| A place or chapter no longer resolves | The segment keeps its stored name with no `ref`, so it shows as text, not a link |
| `ledgerKey` is not in the Ledger | `initialRecordKey` already falls back to the default view |

## Kill criteria

- At 1920×1080 the M-tier card scrolls or clips with five lines: drop to `WARM_RECAP_MAX_LINES = 4` and say so in the PR.
- Warm round 4 shows a tester clicking Begin with no line read, and asking later what happened: the card is the wrong place. Note it on the ticket for the next round's plan, and do not add a second surface in this slice.

## Three-pillar check

- [x] Engine pillar present (one pure view module)
- [x] Content pillar present (every word in the table)
- [x] UI pillar present (U1–U5 plus one canon line)
- [x] Wiring connects them

## Vision audit

- [x] No Vision premise is contradicted. The mortal's story leads, prose comes before numbers, and the map is still the table. The card adds no container.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-06-thr-2173-while-you-were-away-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Caps, order and steps are named constants; words in the registry |
| 2. Inspectability | PASS | `recapLines` on the done line; test ids per line kind |
| 3. Determinism | PASS | No simulation input; pure reads in a fixed order |
| 4. Fail-soft | PASS | Table above; a throw falls back to today's card closing |
| 5. Narrative over mechanical perfection | PASS | Story sentences the Aftermath already uses |
| 6. Additive over destructive | PASS | New module, new keys, additive hook fields |
| 7. Performance budget | PASS | One archive filter and one band diff, once per warm arrival |

## Done when

- [ ] On `?view=game&seeded&size=medium&warm=150` at 1920×1080, after the warm-up, `[data-testid="warm-recap"]` shows the title and 1–5 `warm-recap-line-*` rows, and the done line carries `recapLines` equal to that count.
- [ ] Unit tests for `buildWarmRecap`: First chapters newest first and capped at two plus the "more" line; the doing-now line; slipped one and many; grew one and many (Held/Sovereign only); the keep order at the cap; the empty line; no First; the snapshot missing.
- [ ] Unit test: `formatWarmRemaining` gives "3 minutes" at 180 000 ms, "2½ minutes" at 150 000, "2 minutes" at 120 000, "1½ minutes" at 61 000, "a minute" at 60 000, "half a minute" at 25 000.
- [ ] Begin and Escape close the card; held decisions then open as today. Read it in the Ledger opens `ChapterLedger` at `ledgerKey`.
- [ ] Every name in a line with a `ref` renders as `EntityLink`, and each band word carries its `ui.dominion.<band>` hover.
- [ ] `warm-recap-next` shows the held-decision sentence when one waits, else "The world is paused. Press play when you are ready."
- [ ] The card does not scroll at 1920×1080 (`scrollHeight <= clientHeight`).
- [ ] Browser evidence, four parts: a 1920×1080 screenshot of the recap, console output with the done line, the `recapLines` assertion, and a UI-Laws line covering Laws 1, 13/14, 17, 21, 33, 37.
- [ ] `layout-zones.md` carries the Canon pillar line; `interface-map.md` and `scripts/interface-contracts.ts` carry the new reads.
- [ ] `npm run gate` is green; the review gate has passed (engine file).

## Coordination block

**Suggested model:** sonnet. One pure selector with clear inputs, an additive hook, and one existing dialog's second state.
**Parallel-safe with:** [the rail rows say what they are](https://linear.app/threadbare/issue/THR-2183) and [room for the god-rail hand](https://linear.app/threadbare/issue/THR-2177) (the god rail, not the warm card).
**Mutex with:** ["Waits for you" / "Theirs alone"](https://linear.app/threadbare/issue/THR-2178), because both may edit `hosts/DialogHost.tsx` and `ChapterLedger` (it adds a word to Ledger rows; this plan opens the Ledger at a key). Build after it.

**Files to touch:**
- New: `src/engine/views/warmRecap.ts` and its test.
- Edit: `src/components/Game/hooks/useWarmStart.ts`, `src/components/Game/WarmStartOverlay.tsx`, `src/components/Game/hosts/DialogHost.tsx`, `src/components/Game/GameView.tsx` (the hook args), `src/engine/views/interruptRegistry.ts`, `src/components/shared/dialogSize.ts`, `src/data/ui-content.ts`, their tests, `Docs/design-system/layout-zones.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`.

## Notes for the executor

- Line numbers are from `main` @ `7a3da16b`. Anchor on the test ids.
- `extract.mjs` parses the done line as JSON. The new field is additive, so no harness edit is needed.
- Do not name the rival in the slipped line, even when `ledger.rivals[placeId]` is set (see [THR-2172](https://linear.app/threadbare/issue/THR-2172)).

## Forked-audit verdicts

| Axis | Verdict | Note |
|---|---|---|
| NFP | PASS-with-notes → fixed | The slipped floor had no named constant (now `WARM_RECAP_SLIPPED_FROM_BAND`). Lines dropped by the cap left no record (the done line now carries `recapCut`). The missing-snapshot row did not say where `startTick` comes from (now the hook's own arg). All code claims spot-checked accurate |
| Three-pillar | PASS-with-notes → fixed | Player-facing text was a pointer, not the Surface / Exact text / Complaint class table (now present, PC-1/6/7/8). The substrate had no status or disposition (now stated: all ACTIVE; four extended, the rest read only). Blast Radius was unaddressed (now N/A with measured importer counts) |
| Vision | PASS-with-notes | No contradictions. The place lines lean slightly toward a world summary, held by the five-line cap and story-first order. "2½ minutes" is finer chrome precision about real time, not a mortal-facing magnitude; stated in the Player-facing text table. Nothing goes to Christian |

### Intent-judge verdict

**Allow** (Reversible), on the second run. The first run said **Revise** on player legibility: no complaint class was named, the card did not say what to do next (PC-7), and nothing showed where the band words are explained (PC-1). All three were fixed with the next-step line and the band hovers. Advisory from the re-run: the next-step line sits outside `WARM_RECAP_MAX_LINES`, so a full card has six rows. The executor tests that case against the no-scroll Done-when.
