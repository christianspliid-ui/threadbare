# Action Proposal — Warm playtest (THR-1744)

## intent_quote

The ticket was filed by Christian (attended chat, 2026-10-05). Its description records his ask: an attended meta-analysis "concluded that nothing checks the player's experience past the first ten minutes. He answered \"yes\" to filing a warm playtest alongside the narrow judge check."

The ticket title is the agreed outcome:

> Warm playtest — no-knowledge testers start a few hundred ticks into a world with The First already bonded, so factions, undertakings and ambitions finally get played

The ticket delegates the design questions explicitly:

> A design session writes the plan doc. It decides these questions; the answers are not prescribed here.
> * **Start state.** How the tester enters a world a few hundred ticks in with The First bonded. One route is the existing dev levers (`?seeded`, `?spawn=`, debug ticks). Whether these work on the deployed build has not been checked. The other is a saved-world snapshot.
> * **The brief and personas.** These differ from cold: the tester is told they are mid-game, and the persona is someone who has played an hour.
> * **Coverage predicates.** The round must check that each tester actually touched the mid-game surfaces: faction, undertaking or ambition, and thread history.
> * **Lane shape.** Whether it is a mode of the `cold-playtest` skill and lane, or its own lane. Trigger rule, cost per round, and where reports and the scorecard live on `ops`.
> * **Filing.** It files into its own round milestone, verified against source the way cold rounds are.

Done when (ticket, verbatim):

> * A plan doc for the warm playtest is merged and this ticket is in Ready for Dev with a coordination block.
> * At least one warm round has run against the deployed build. Its report is on the `ops` branch in the cold-round shape: verdict table, findings filed, a "Not filed" section with reasons.
> * The report shows, per tester, which mid-game surfaces they reached. A tester who reached none counts as a coverage failure, not a clean pass.
> * `Docs/ops/scheduled-tasks-registry.md` records the lane's cron and first observed fire time, if it runs as a scheduled lane.

## scope (what this plan does)

It answers the five delegated questions with measured substrate:

- **Start state:** a new production URL lever, `?warm=<ticks>`, layered on the existing `?view=game&seeded&size=medium` quick-start. It advances the seeded world through the existing `runTicksSync` → `runTickBatch` path in chunks, behind a loading overlay. During the warm-up The First is set to the existing **Lives on** attention mode, and it is restored afterwards.
- **Brief and personas:** a warm brief file that keeps the cold playtest-log wording verbatim, with the same three personas.
- **Coverage:** snapshot-text markers per surface, read from the `.yml` snapshot files the harness already writes.
- **Lane shape:** a `--warm` mode of the existing `cold-playtest` skill and `tb-cold-playtest` lane, running at most one round per fire, cold first.
- **Filing:** its own `Warm playtest · round N` milestones and a `warm-playtest` label, with reports and a scorecard on `ops`.

It also owes the ticket's second half: a warm dry run, then warm round 1 against the deployed build.

## scope (what this plan does NOT do — explicit non-goals)

- No save/load or world import. It is rejected as a test fixture; that is a player feature in its own right.
- No change to rules of play. The warm-up runs existing rules unchanged. The only engine-file edit is one additive pure helper in the moment queue's single-writer module (`settleUndertakingMomentsAsBadges`), added after judge round 2.
- No fix to the faction, ambition or undertaking weaknesses the ticket cites. Those are what warm rounds will surface and file.
- No new scheduled lane, and no change to cold-round behaviour, brief or personas.
- No "while you were away" recap for real players. That is parked as a product question for warm findings to raise.
- No production coverage recorder or `__DEBUG` in production.

## impact_class

External (corrected from Reversible on judge round 1). Affected systems:

- the `tb-cold-playtest` scheduled lane (prompt and registry row);
- the `cold-playtest` and `keep-work-flowing-cc` skills, which change other agents' behaviour;
- the production game bundle, which gains a new ungated `?warm` URL param in the same family as the existing ungated `?seeded` / `?spawn`;
- Linear milestones and a label in Thematic Pressure & Living World.

It spends ~$12–15 notional per round on the subscription plan. Every piece is reversible: the param is additive, and the mode can be removed from the skill.

## evidence cited

- **Linear issue:** THR-1744 (siblings THR-1743, THR-1610)
- **Vision premises invoked:** the store-page premise (god follows mortals' lives in a living world), via the cold brief
- **UL terms touched:** The First, thread, attention mode (Asks you / Lives on), undertaking, ambition, faction. No new UL term. "Warm playtest" is a harness name, like "cold playtest"
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 1, 13, 14, 17, 21, 33, 37, 42, 55); `Docs/ops/player-complaint-classes.md`; `Docs/canon/verification-gates.md` (by reference)
- **Prior plan docs this builds on:** `Docs/plans/2026-09-25-thr-1610-cold-playtest-loop.md`
- **Rejected approaches considered and dismissed:**
  - Playing to tick 300 at 20×: interrupts stop the clock, and setup eats the budget.
  - Saved-world import: no save exists, and it is a feature in itself.
  - CDP pre-warmed browser: `__DEBUG` is absent in production, the warm-up would need fragile clicking, and it breaks `--isolated`.

Measurements quoted in the plan:

- The live site at `?view=game&seeded&size=medium` lands with The First bonded (the Threads panel lists KAEL THORNWEAVER).
- `typeof window.__DEBUG` is `"undefined"` on the live site.
- Speed steps top out at 20×.
- A headless CLI run of 300 ticks took 93 s, and the world is still `playing` at doom stage 1.
- The cold round-2 snapshot marker counts are tabled in the plan.

## load-bearing decisions touched

- **"The world graph is mutated in place — never key change detection on graph identity."** The warm-up uses `runTicksSync`, which already sets `gameStateRef` and `setGameState`. No new change detection is added.
- **"Engine caches are owned per session (`SimulationRuntime` in `useSimulation`)."** The warm-up uses the session's `runtimeRef` via `runTicksSync`. No module-scope state is added.

Neither decision is changed.

## high-impact files touched (from Codesight)

None ≥100 importers. Measured by grepping import sites under `src/`:

| File | Importers |
|---|---|
| `src/data/ui-content.ts` | 9 |
| `src/components/Game/GameView.tsx` | 7 |
| `src/components/Game/hooks/useSimulation.ts` | 2 |
| `src/App.tsx` | 0 |

No Blast Radius section.

## kill criteria

- **Warm round 1 has ≥2 coverage failures with the v1 brief.** The curiosity line is not enough. The next step is a `warmBriefVersion` bump, never loosening the bar. If v2 also fails, the finding is that the mid-game is unreachable from the main screen, and it is filed as a design finding.
- **The warm-up on the live build exceeds 180 s at any `warmTicks` ≥ 100, or leaves pending pop-ups at arrival.** The lever is wrong. Pull the param, and revisit a save/import feature as a product decision.
- **Two consecutive warm rounds file only findings that cold rounds already filed.** Warm is not adding signal. The weekly retro retires it under the six-week sunset rule.

## explicit user sign-off

Not required (Reversible).

## round-1 judge findings and fixes

- **Impact class** → External. Done above.
- **Wiring (dim 3).** The invented `WARM_START_SUPPRESS_BEATS` switch is gone. The plan now reuses the production `interruptSuppressedUntilTick` and `dismissOpenBeatInterrupts()`. It also traces the ungated moment consumer: the First's moments are interrupt-tier by `isFollowed`, not by attention mode, so they would accumulate. The fix acknowledges them into badges via `acknowledgeUndertakingMoment` (constant `WARM_START_SETTLE_MOMENTS`). The overlay registers in `INTERRUPT_SURFACES`. A fail-soft row covers moments queued at arrival, and the done line reports `pendingInterruptsAtArrival`.
- **Kill criteria (dim 10)** → a `## Kill criteria` section in the plan.
- **PC-7 (dim 12)** → the overlay wait line "Catching up on the seasons you were away. This takes a minute or two." and the progress form "{now} — catching up to {target}", registered as `ui.warm_start.*`.

## round-2 judge findings and fixes

- **Moments settle path (dims 3a and 12).** Acknowledging a record removes it from the badge (`momentBadgeModel.ts:84-85`). The plan now re-tiers the warm-up's interrupt moments to `presentation: 'badge'` and leaves them unacknowledged, through a new pure helper `settleUndertakingMomentsAsBadges` in `undertakingMoments.ts`. Records from the last 48 ticks badge (`MOMENT_BADGE_RETENTION_TICKS`); all records appear under "The Arc So Far" (`agentArc.ts:98-108`), which is the "read them afterwards" home for PC-4. Done-when items 1 and 3 assert both.
- **Arrival cue (dims 3b and 12, PC-7).** `runTicksSync` gains `{ markClock?: boolean }`, and the warm path passes `false`, so `FIRST_RUN_PROMPT_CAPTION` ("Time is still. Press Play or Space to let the world move.") still renders on arrival. Done-when item 1 checks it in the arrival screenshot.
- **Minor fixes.** Suppression is set from the clamped `requested`. The done line also records `openInterruptsAtArrival`, which covers ChoiceSet, EmergenceDilemma and DivineReceipt.

## round-3 judge findings and fixes

- **Global queue cap (dims 3 and 12).** `MOMENT_QUEUE_MAX = 8` is world-wide. Every "all / every / the rest" claim is gone. The settle helper re-tiers only the **surviving** First records. The durable home for "read them afterwards" is now the chronicle (`undertakingCheckpoints.ts:648`), read on The First's Chronicle tab. The badge and "The Arc So Far" are named as holding the most recent survivors only.
- **Trace (dims 4 and 9).** The new `settled` trace event is dropped. `src/types/trace.ts` is not edited, so no Blast Radius applies. The done line's `momentsSettled` carries the count.
- **PC-4 auto-resolved beats.** Reading `dismissOpenBeatInterrupts` (`GameView.tsx:4887+`) showed it resolves ascendant beats with a default choice and withdraws vignettes, which makes the player's decisions. It is dropped entirely. Decisions raised during the warm-up wait for the player, one at a time (`WARM_START_MAX_ARRIVAL_DECISIONS = 1` flags a pile-up). A unit test proves nothing was resolved.
- **Cosmetic.** The substrate intro now matches the Engine header, and the JourneyTab line numbers are corrected to 202 and 214.

## author notes for the judge

- This is an unattended design-lane run. The five design questions are delegated by the ticket text itself, so the lane decides them and lists them in the plan's Appendix A for veto.
- The biggest judgement is **steering**. The warm brief adds one curiosity line in player words (power, what my mortal is working towards, what happened while away) and names no UI. I chose this over no steering, because an unsteered warm tester likely repeats the cold path. I chose it over explicit steering, because that makes the tester not a player.
- I also **tightened** the ticket's coverage-failure definition. The ticket says "reached none" of "faction, undertaking or ambition, and thread history". I count only faction / undertaking / ambition, because thread history is already reached by 3/3 cold testers (measured). Counting it would make the bar unable to fail. This is flagged as a lane decision.
- The registry Done-when line ("if it runs as a scheduled lane") is met by updating the existing `tb-cold-playtest` row, not by adding a new lane.
- The UI pillar's player-facing text appears only through the `?warm` lever (testers, not store-page players). It is quoted in full anyway, and it reuses the existing Lives-on tooltip so the overlay and the toggle say the same thing.
