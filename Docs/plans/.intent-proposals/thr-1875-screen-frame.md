# Action Proposal — THR-1875 the screen frame

## intent_quote

THR-1875's description (the carve-up ticket of the closed map THR-1823):

> Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used.

> **Also owed:** list the tutorial and first-run copy that points at surfaces this moves (map fog item "Onboarding references").

> **Added 2026-10-14 (from THR-1820's plan):** THR-1828's fixed cap of 12 Needs-you rows breaks the new Law 57 (a panel grows to its size limit before it scrolls or truncates) at 1440p. Decided (technical, rule 4): the Needs-you list shows as many rows as its container fits at the current screen size, and folds to *and N more* only at that limit. Name the row height and the limit as constants.

> **Binding (UI Law 58, Christian 2026-10-14):** the UI grows by adding entries, not by writing screens. Top-bar buttons, god-rail rows, Ledger tabs and Needs-you producers are each one list. A missing entry fails a named test. Each list gets a row in `Docs/design-system/extending.md`.

Christian, chat 2026-10-14, the Law 58 source (`laws.md` § XVI):

> it is important that the UI is simple and easy for agents to expand and change as we iterate on the game, add new actions, fields, and so on.

Christian, 2026-10-11 UI review (THR-1823):

> design primarily for minimum 1440p landscape

The spawning session's brief, recording Christian's 2026-10-14 chat request: the five carve-up plan docs are written now, in parallel, and that waives the design lane's one-day veto window on THR-1828 / THR-1829 / THR-1830 / THR-1831 / THR-1832 / THR-1833. His veto stays open in chat.

## scope (what this plan does)

It specifies the screen frame decided in THR-1828: the one-row top bar (time with pause and speed, Needs you, a reserved slot for Find, Doom, Omen, labelled Rivals / Notables / Read the Threads / Settings); the Needs-you pill and list as UI, with its view model and producers; the god rail (identity, essence with Attention, the hand's place and size and its fit rule, folded rows); the Ledger rail (Threads, the Chronicle with the World-Soul line and *Now · Years · Ledger*) and its 56 px strip and fold. It covers what retires (World Pulse, the AlertBar, the floating offer pill, the arrival toast, the Actions section), the keys `N` and `L`, the map-share budget at 1920×1080 and 2560×1440, which THR-1881 host each part builds into, the onboarding and guide copy that points at moved surfaces, and the four Law 58 lists with their tests and `extending.md` rows. It splits the build into three slices by home (THR-1893 Ledger rail, THR-1894 god rail, THR-1875 top bar and Needs you) and files one deferral (THR-1896).

## scope (what this plan does NOT do — explicit non-goals)

- It does not design the Inspector, Find's box and results, card arming or target lighting (THR-1876). The frame reserves Find's slot and exposes a hand-press seam and an Inspector-open input.
- It does not decide the Stage's hold rule (which moments wait and in what order; THR-1877). It shows the held rows and ships today's registry holds as the interim rule.
- It does not vendor icons or fill the icon registry (THR-1879). It names the concepts it needs.
- It does not re-decide THR-1828's slots, order, widths, or the two map-share floors, nor THR-1819's tokens.
- It does not move notification state into GameState (THR-1825's Law 55 gap; out of scope per THR-1822 D13).
- It does not make every alert write a Chronicle line (deferred to THR-1896).
- It does not rewrite the ActionDrawer guide and rulebook lines (THR-1876 retires the drawer).
- It does not change any rule of play.

## impact_class

Reversible. A plan doc for UI code that rebuilds and deletes presentation components behind tests; no state, save format, tick behaviour or canon rule changes. The engine edits are pure view models, a module move with a re-export, and the alert router's trim rule (presentation state).

## evidence cited

- **Linear issue:** THR-1875 (+ new THR-1893, THR-1894 slices; THR-1896 deferral)
- **Vision premises invoked:** `Vision/01-core-loop.md` ("one story at a time, not a dashboard"), `Vision/02-non-negotiables.md` (prose over numbers), THR-1823 direction B ("the map is the table")
- **UL terms touched:** Needs you, the Stage, the Inspector (THR-1882 proposes them). God rail, Ledger rail, the strip and the rail's card set (shown as "Your cards"; the "hand" naming question) were filed on THR-1882 on 2026-10-14, with a correction comment. Location / Place are unchanged. Hand / Repertoire / Dealt Hand (`Encounters.md`) are respected.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`, `Docs/design-system/laws.md` (Laws 1–58), `Docs/design-system/extending.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `2026-10-14-thr-1819-1440p-layout-contract.md`, `2026-10-14-thr-1820-dialog-size-tiers.md`, `2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`, `2026-10-14-thr-1822-view-model-seam.md`; decision records `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`, `2026-10-11-thr-1827-inspector-decision.md`, `2026-10-14-thr-1829-encounter-stage-decision.md`, `2026-10-12-thr-1832-find-anything-decision.md`, `2026-10-13-thr-1833-type-system-decision.md`, `2026-10-14-thr-1834-icon-family-decision.md`; THR-1825's research comment
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's rejected list is touched (no R3F, no AgentWheel, no fixed action slots: the hand lists every revealed card, data-driven)

## load-bearing decisions touched

- "Engine caches are owned per session (`SimulationRuntime`)": the three VMs use THR-1822's per-session `viewCache`, never module singletons. Respected.
- "The world graph is mutated in place — never key change detection on graph identity": the VMs key on `worldVersion`; the god-rail VM stops keying on the undeclared `state.worldVersion`. Respected.
- "Everything is a graph node/edge" / "No inventing node types": no node, edge or GameState field is added. Respected.

## high-impact files touched (from Codesight)

None with ≥ 100 importers. The widest is `src/data/ui-content.ts` (24 importing files); `src/types/notification.ts` has 31. No Blast Radius section is needed.

## kill criteria

The plan's § Kill criteria: the top bar wraps at 1920 after real-font measurement (tighten caps; never a second row, never drop labels); testers miss offers (a one-time ring on the pill, never the floating pill back); a real hand groups so often the armed card hides (THR-1827's strip fallback at 1080p); News lapses unread (raise one constant); the strip flyout confuses (strip press closes the Inspector instead).

## explicit user sign-off

Not required (Reversible). The settled inputs carry their own sign-offs: THR-1827 (Christian "yes" to 18 calls), Laws 57 and 58 (ratified 2026-10-14), the icon family (Christian, 2026-10-14), the Needs-you row-limit ruling (THR-1875 description), and the veto-window waiver (Christian's 2026-10-14 chat request, recorded in the brief).

## author notes for the judge

- Four places where the plan departs from THR-1828's literal words, each for a measured reason:
  1. **No calendar day** in the date: the game has none, and THR-1747 forbids deriving one from `TICKS_PER_DAY`.
  2. **Avatar arrival is a named pause, not an interrupt-registry entry**: the registry's contract (a rendering surface, auto-resume on close) does not fit a pause with no surface. Both goals the decision states (the clock names it, the queue lists it) are met.
  3. **"Lives on in the Chronicle" is not promised** until THR-1896 makes it true: three alert producers write no Chronicle line.
  4. **The hand groups by sphere at the rail's limit instead of scrolling first**, because Law 57 (ratified after THR-1828) puts grow → progressive → scroll in that order.
- One amendment to a settled foundation plan: THR-1822 D13's `NEEDS_YOU_NEWS_MAX` and `newsOverflowLine` are removed, because today's ruling on THR-1875 replaces the fixed cap. D13 is not built yet (THR-1822 Ready for Dev), so nothing is undone.
- "Years" was named by THR-1828 without a definition. The plan defines it (the whole Chronicle by calendar year, shown once the Chronicle spans two years), as a "how" of an agreed design with Christian's veto open.
- **Revision 2 (after the first verdict, Revise, 6 findings):**
  - **Dim 4:** the worst reachable top-bar state is now measured (2,103 px). The plan adds § F3's yield order (centre → time status → doom name → omen name → direction short form; 1,713 px after), a fail-soft row for overflow at a supported width, and a three-state one-row browser check, state (c) being that worst state.
  - **Dim 5:** the taste-profile edit now has an owner: THR-1879's build (comment posted), with slice 1 as the fallback in its Done-when.
  - **Dim 6:** "works" is gone. The rail's section is "Your cards" on screen. § F6 states the set (ascendant-castable map cards behind `unlockedActionIds`) and its relation to the UL's Repertoire / Dealt Hand. THR-1829's rest line is replaced (PC-6), and the correction is posted on THR-1882 and THR-1877.
  - **Dim 12:** Doom and Omen rows are added with their tooltips. News de-duplication is specified: the router appends instead of overwriting, a repeated `sourceEventId` is dropped, and the VM coalesces a same-kind burst into one row with "and {n} more like it".
- **Revision 3 (after the second verdict, Revise, 5 findings):**
  - **Keys:** adopted THR-1878's single `TOP_BAR_KEYS` array and its overlap test; `TIME_HOTKEYS` is gone; the frame's keys are spread in from the frame lists (`FRAME_HOTKEYS`). THR-1878 moved from Parallel-safe to Mutex on `useTopBarHotkeys.ts`, and § F10 lists THR-1878's map keys. Replied on THR-1875's thread.
  - **Elapsed words:** the sample is now "two days ago" / "less than a day ago" (what `elapsedLabel` renders).
  - **News tooltip:** built at render from `NEEDS_YOU_NEWS_KEEP_DAYS` through `durationLabel`.
  - **Strip:** the Threads count uses the thread pip's predicate and words ("1 chapter waits"), never "waiting on you".
  - **Kill criterion 1:** rewritten for the post-yield case.
  - **Also from the forked auditors:** the taste profile already carries today's rules (vault checked, `taste-profile.md:107-110, 228-235`), so no Vision edit is owed (THR-1879 comment withdrawn). The gold budget is stated. `attentionPool` is in the substrate table. A blast-radius line is added. The wiring-checklist row is in slice 3's files. NFP 7 gets a build-time reading.
  - **New coordination from THR-1877:** the Ledger rail takes a `hidden` state during a Stage moment (§ F8).
- **Revision 4 (after the third verdict, Revise, 4 findings):**
  - **Identity block:** quoted in § Player-facing text. It names the god's tooltip `ui.ascendant_quintessence` (not the mortal's `ui.quintessence`), keeps THR-1713 D8's `showOnStrip` rule, and adds "Your First: {name}". The decision's "state ('Rooted')" has no source, so the archetype title keeps its place. The essence header is quoted.
  - **Notables tooltip:** uses THR-1860's words, with THR-1860 named as the owner of the drop reason.
  - **Fixture:** `pushNeedsYouFixture` stamps `news` at distinct ticks and has a separate `burst` option.
  - **Worst-state check:** a dev-only `setFrameFixture({ revealAll, omenName, heldBy })` lifts the Rivals and Omen gates. The check asserts all ten items rendered before reading `yielded`.
  - **Two fold rows:** settled in § F4.
- **Revision 5 (after the fourth verdict, Revise, 4 findings):**
  - **Counts:** every frame count string is a `{ one, other }` pair through one helper, and `frameCountWords.test.ts` tests them at n = 1 and n = 2 (pill, strip, Years).
  - **Done-when (c):** reads "every entry of `TOP_BAR_ITEMS` (nine; ten once THR-1876 adds `find`)". The width row counts the centre slot as width, not as an item.
  - **`ui.chronicle`:** built from `CHRONICLE_NOW_SEASONS`.
  - **Doom:** every part of today's `DoomBar` has a disposition in § F3 / § F9 (sigil kept, "Unmade" in sentence case, the journey and next-stage lines moved to the tooltip and kept in the dialog, the fixed min-width gone). THR-1860 item 4 is cited.
  - **Samples:** the doom, omen and popup samples now use real game data (Breach / "Reality Cracks" / "The Thinning"; omen "Thin Places").
- **Revision 6 (after the fifth verdict, Revise, one GAP on dimension 12):**
  - **Target words dropped.** The hand row's line 2 is "{Sphere} · {price}": no target-word source exists (`CardFace` has none, and the mock invented one). A § F12 seam row says THR-1876 may add target words from one table.
  - **Samples now render from today's code:**
    - the hand row is "Inspire" / "Life · 2 essence" (`divine.inspire`);
    - the receipt row uses a real `toastMessage` ("The fever breaks before dawn.");
    - Attention shows the gauge alone while focused, and words otherwise;
    - quintessence is "Resonant", which renders under the `showOnStrip` rule;
    - the World-Soul sentence is the real `WORLD_SOUL_PROSE.spirit.murmur`;
    - the arrival line is the real `phaseMovement.ts` message.
- **Revision 7 (after the sixth verdict, Revise, one GAP on dimension 12, Dominion pricing):**
  - **The hand row's price is the par price**, `dominionScaledEssenceCost(…, undefined)` at `DOMINION_PAR_BAND`. A new `ui.hand_price` tooltip says so in THR-1750's own `DOMINION_CAST_CLAUSE` words. PC-6 agreement is named: the Codex shows the same par number, and the target price at arming is THR-1876's (seam row).
  - **`payable` is measured at the sovereign price**, so no castable card ever looks uncastable. The reason uses the sibling form "Not enough Life essence".
  - **`targetWords` is removed** from `HandCardVM`.
  - **Dominion pricing** is added to the substrate table, and slice 2 has a test for all of the above.
- **Revision 8 (after the seventh verdict, Revise, one GAP on dimension 12, the hand row's empty slots):**
  - **One key per card row,** `paySphere = sphereAffinity ?? primary sphere` (the cast path's rule). It decides the tint, sort, group, `payable` pool and reason.
  - **Free cards read "Free"** through one `essencePriceLabel` shared with the Codex.
  - **Real samples for the empty-slot cases:** Stillness "Free", Focus "Spirit · 5 essence".
  - **`ui.hand_price`** opens with the Foreign band's own words, and the two tier-scaled cards add "A rarer target costs more."
  - **Slice 2's tests** cover the free, no-sphere and tier-scaled cases.
- **Revision 9 (after the eighth verdict, Revise, one GAP on dimension 12; the judge checked all 27 player-facing rows and named three):**
  - **Folded rows:** Reaches reads "Veil · Thinning", from the god's own `ASCENDANT_REACH_REGISTER` word with its tooltip and rung marker. The cap is 24, and the test runs every reach × word (longest "Eye · Before It Happens", 23); past the cap the row shows the word alone. Mandate reads "Kindling", from `MANDATE_TREND_WORD`, the same table the body reads.
  - **News samples are real producer lines** (`factionOutcome.ts:408`, `orchestrator.ts:2832`), with the right click target.
  - **The mandate milestone fallback's raw `MandateStage` id is fixed at the producer** in slice 3 (`phaseMandate.ts`, E6), with a test.
- **Revision 10 (after the ninth verdict, Revise, one GAP on dimension 12):**
  - **News click targets now follow `deriveNavigationTarget`.** The promotion opens the Civic Guard's page, "story deepens" opens Kael Thorne's, and the burst's links open each alert's own faction.
  - **The mandate fallback names no stage**, because no stage display word exists. It reads "Mandate "The Builder's Legacy" enters its next stage." and has its own table row (a plain row, since `mandate_progress` carries no target).
- The plan reverses no Christian ruling. The places where it chose (slicing, fold order, the strip flyout, the hand's default press) are agent-owned "how" calls under process.md rule 4.
