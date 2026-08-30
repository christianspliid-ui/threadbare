---
lane: tb-orchestrator
run: 2026-08-30b
promoted: 0
filed: 0
resolved: 0
newFindings: 6
needsChristian: true
---
# Orchestrator — 2026-08-30 (run b, ~04:26–05:15Z)

## Needs Christian

**Nothing new this hour, and the queue is still empty.** The three things waiting on you are the same three the 02:27Z briefing carried. Restated in one line each so they do not drop out of the next briefing — deliberately not re-argued:

1. **Approve encounter batch 2** — seven new encounters written and unable to start. One read, one word. [Ticket](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) · [Brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). Standing 6 days.
2. **The merchants-and-trade-routes fork** — should a mortal pursue work their nature doesn't value? Right now the answer is no, and the consequence is that no merchant in the world ever builds a trade route. [THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) and its sibling [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the). Standing ~20 hours.
3. **Eleven fight-and-magic questions** on your three maps, unchanged (T1.5 below).

**One thing that is genuinely new, and it is good news rather than an ask.** Yesterday I reported the biggest duplicated system in the engine — two complete scoring engines running side by side on every decision — as finally having a clear path to deletion. That turned out to be half-right, and the correction is worth a sentence: a session took the work, found the real problem was not what the ticket said it was, shipped the parts that were genuinely ready, and stopped at the design question rather than guessing past it. That is the machine working. The design question is item 2 above.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers cleared by this lane: 0.** No write of any kind was made this run.

Board at the sweep, re-read fresh: **44 `Todo`** (`hasNextPage: false`), **0 `Ready for Dev`**, **2 `In Design`**, **3 `In Dev`** (all `Parked`, all unassigned). Neither ceiling bound — shelf 0 against the backed-up threshold of 15, zero promotions against `ORCH_PROMOTE_BATCH_MAX` of 5. The constraint is supply.

**The board has not moved since run — (02:27Z).** Every `Todo` item's `updatedAt` predates that sweep; the most recent is THR-1156 at 2026-08-29T14:38Z. `In Dev` and `In Design` membership is identical. So run —'s decline set stands unchanged and is not re-listed here; re-printing fourteen unchanged decline lines is the dump this tier forbids. What follows is only what I read that it did not.

### One candidate re-read in full, because an empty shelf is when a wrong decline costs most

[**THR-1349**](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) is the single most promotable-*looking* item on the board and it is **correctly declined**. It deserves the paragraph because everything a dependency sweep reads says promote:

- `relations.blockedBy` is **`[]`**, and always was.
- It is a `Deferral` in an active project — priority rule 1, the top of the ordering.
- It has a PR attached and a full evidence block.

It is still not dev-ready, and its own latest comment (2026-08-29T09:30Z, written by this lane) says so outright: ***"Do not re-promote this on the `Blocked by` half."*** Three of its six Done-when items are falsified by its own measurement — the prescribed remedy shipped in [PR #1724](https://github.com/christianspliid-ui/threadbare/pull/1724) and moved `trades_with` from 0 to 0 on both seeds, and `trades_with > 0` cannot be an acceptance signal at all, because the currently-shipped `'shadow'` board writes zero on seed 99. **Wrong-destination decline**, not an unmet blocker: met blockers do not make a ticket dev-ready when the remaining work is a design fork.

This is the THR-990 rule earning its place a second time. A sweep that read only the dependency field would promote this every hour, and an executor would bounce it every hour.

### What actually happened to yesterday's promotion — verified, and it corrects the T3 record

Run b yesterday promoted [THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) (the decision-board cutover) at 04:30Z. It is in `Todo` today, which reads like a bounce and is not one. Read from its own comments:

| When | What |
|---|---|
| 2026-08-29 04:30Z | Promoted to `Ready for Dev` by this lane |
| — | Claimed; Done-when 1, 2 and 4 satisfied and shipped via [PR #1721](https://github.com/christianspliid-ui/threadbare/pull/1721) |
| 05:54Z | Moved to `Todo`, unassigned, **deliberately**, marked blocked by the new THR-1349 |

The session found two real defects while measuring the flip rather than shipping it — `BOARD_SCORE_FLOOR` was a units error sitting at ~the 92nd percentile of what it gated (`0.08` against a median winning board score of `0.0006`), and the census reported `idle 0.0% — PASS` while 2646 of 2882 decisions idled. Both fixed and shipped. The flip itself was declined because a live board takes `trades_with` from non-zero to zero while every §4 criterion reads green.

**So the promotion did its job and the ticket is correctly parked.** Recorded because run d's T3 claimed *"the biggest known duplicate in the engine has had a blocked retirement path for weeks, and it is unblocked as of 03:42Z today"* — that was true for about 90 minutes. See T3 finding 5.

```
[orchestrator] T1 shelf 0 — board unchanged since run — (02:27Z); no Todo item's
               updatedAt is newer than 2026-08-29T14:38Z
[orchestrator] T1 decline THR-1349: wrong destination — blockedBy:[] but latest
               comment (08-29 09:30Z) is a standing "do not re-promote on the
               Blocked by half"; 3 of 6 Done-when falsified by its own measurement
[orchestrator] T1 note THR-1301: Todo is a deliberate park (partial ship, PR #1721,
               re-blocked behind THR-1349), not a failed pickup
[orchestrator] T1 decline (unchanged, not re-derived): the 14 lines in run —
[orchestrator] T1 skip 15 wayfinder:* items unconditionally → T1.5
```

**Week's product-vs-process ratio.** Unchanged from run — and worth stating in its sharper form: of the items an executor could claim right now there are **none at all**, product or process. The headline finding is not "promote process work to fill the gap" — it is that **the feature pipeline needs design or Christian**. Rule 0 / materiality was not the binding constraint this run and is not offered as one: nothing was declined *for* being process work.

## T1.5 — wayfinder sweep

**Three open maps, 12 open children, frontier 11, all HITL. AFK resolved: 0 — for want of supply, not for want of trying.**

Membership is byte-identical to run — two hours ago (no wayfinder issue has an `updatedAt` newer than 2026-08-26), so the table is not reprinted. Summary: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) frontier 10 (6 grilling, 4 prototype), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) frontier 0 (its one child is assigned), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) frontier 1.

The AFK pool is exhausted board-wide and was measured as such last run: `wayfinder:research` 19/19 `Done`, `wayfinder:task` 3/3 `Done`. `ORCH_WAYFINDER_AFK_MAX` (2) is unreachable because there is nothing left to reach. Everything on the frontier is `grilling` or `prototype` — Christian, live, in chat — so nothing was claimed and nothing was touched.

```
[orchestrator] T1.5 3 open maps, frontier 11, AFK available 0, HITL surfaced 11
               (membership unchanged since 2026-08-26)
```

## T2 — design staging

**Triggered by the shelf, barred by the bound. Not staged. Twenty-second consecutive run.**

- **Shelf:** **0** non-`Deferral` items in `Ready for Dev`, against `ORCH_PROGRAM_WORK_FLOOR` of 2.
- **Bound:** `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (11 days) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (15 days) — against `ORCH_MAX_IN_DESIGN` of 1. Already over by one.

Both re-surfaced, not re-staged. The item that would be staged if a slot opened is unchanged: [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in), unblocked, High, filed at Christian's own request.

**The structural note run — logged is now on its twenty-second run**, and this run adds one fact to it for the retro's batch: the *reason* T2 is barred and the *reason* T1 has nothing to promote are the same reason. THR-1349's own decline comment says it was routed to T2 on 2026-08-29 at 09:27Z and T2 could not take it — so the design fork at the head of the three-deep chain (THR-1349 → THR-1301 → THR-1303) has now been refused by both tiers on the same bound. That is not an argument for changing the bound; it is the measurement the retro would need to decide either way.

## T3 — architecture health

**Due and run** — first run past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started **06:26 local**). Run — at 02:27Z correctly declined it on the hour gate. Diffed against [`orchestrator-2026-08-29d.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-29d.md), yesterday's sweep.

| Detector | Result | vs. 2026-08-29d |
|---|---|---|
| `generate-interface-map:dry` | **8 LEAKED**, 67 LIVE, 18 UNVERIFIED-OK, 2 PARTIAL, **95 total** (exit 0) | **Identical in every cell, LEAKED membership byte-for-byte.** Seventh consecutive day at eight |
| `check:canon-staleness` | **25 warnings** (exit 0) | **18 → 25.** 8 new, 1 departed, 17 carried — all attributed, findings 1–3 |
| `check:process` | exit 0. `check-design-wiki` OK; `check-wiki-freshness` OK (24 pages); `check-guidance-freshness` OK (`mode=advisory`, 8 doctrines); four generators up to date; `check:authoring-brief` up to date | **Unchanged in every row.** Its `[WorldGen] Ocean fraction too low: 7.4%` incidental fires a **sixth** consecutive day at the identical value — recurring, not new, not drifting |
| `sweep:rank-reach` | See the note below — it did not finish inside this run's window | Deliberately **not** carried forward from yesterday |

`__DEBUG.validateTraitRefs()` is browser-only and cannot be invoked from a headless scheduled context. **Not run, and not reported as clean.**

**`sweep:rank-reach` — not measured this sweep.** It was still executing after ~30 minutes when this report was written (it took ~35 minutes on 08-29d and ~40 on 08-28b, the same sibling-contention shape). Its verdict is therefore **unknown**, not `PASS`. Yesterday's `PASS — 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900` is **not** restated as today's result: carrying a stale green forward is precisely the pathology this tier exists to catch. If it lands before the next run, that run diffs it.

### The eight LEAKED contracts, listed again so tomorrow's diff stays real

`attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertaking-checkpoint-events` · `undertow-card-drifts-mortal-values`

Identical to yesterday, member for member. LIVE 67, UNVERIFIED-OK 18 and PARTIAL 2 are likewise unchanged, so the whole 95 is a fixed point across the two sweeps. Counting method unchanged: unique `^### \`name\` — badge` headings.

### New finding 1 — **correction: `check:canon-staleness` reads git commit dates, not filesystem mtime.** Yesterday's finding 2 is wrong, and acting on it would have been wasted work

Run d recorded, as a standing finding for the weekly retro to batch:

> *"The detector's comparison is `plan mtime > canon last_reviewed`, and mtime is a property of this checkout, not of the repository… The cheap remediation, for whoever picks it up: compare against `git log -1 --format=%ct` for the source rather than `stat` mtime."*

**That remediation is already implemented, and has been since the file was written.** `scripts/check-canon-staleness.ts:97` resolves the source date through `execFileSync('git', ['log', '-1', '--format=%cI', '--', planRepoPath])` and uses `fs.statSync(...).mtime` **only as a fallback when that call returns empty or throws**. `git log --format="%h %cI" -- scripts/check-canon-staleness.ts` returns exactly one commit, `9807475e` (2026-05-07) — the file has never been changed since, so the git-date path was there for both sweeps.

**Falsified rather than argued.** This run executed the detector in a worktree created **minutes before**, where every file's `mtime` is the checkout time:

```
Docs/plans/2026-04-16-systemic-wiring-guide.md
  git : 2026-08-29T22:53:00+02:00      ← what the detector reported
  fs  : 2026-08-30 06:27:41 +0200      ← what it would have reported off mtime
```

The detector printed `plan mtime 2026-08-29T20:53:00.000Z`. That is the **git** value. Had it keyed on `stat`, a fresh worktree would have re-staled *every* canon page against *every* source and today's count would be in the hundreds, not 25. The word `mtime` in the output string is a misleading label on a git-derived value — which is very likely what misled yesterday's reading.

**What run d actually saw, then, needs a different explanation, and there is one.** Two rows vanished between 08-28b and 08-29d with no review having happened. The `git log` call is wrapped in a `try` with `stdio: ['ignore','pipe','ignore']`, so **any** git failure — an `index.lock` held by one of the ~180 concurrent worktrees on this box is the obvious candidate — silently drops that one source to `stat` mtime. That produces **spurious extra rows** in whichever sweep hit the failure, which fits: 08-28b's 22 included two rows whose git dates (2026-07-23, 2026-07-30) sit well before `rulebook.md`'s `last_reviewed: 2026-08-19` and which the git path could never have produced. So the defect is real but it is the opposite shape: **not "mtime is the key", but "the git key degrades to mtime silently, in one direction, under contention."**

**Recorded, not filed** — the throttle bars this lane from filing process tickets. For the retro: the fix is one line (drop the silent fallback, or log when it fires), and it is materially smaller than the one yesterday proposed. The more useful correction is to the standing record: this detector's output **is** reproducible across checkouts, which makes its diff trustworthy — the property yesterday's finding retracted.

### New finding 2 — staleness 18 → 25, and the repair run d celebrated lasted about sixteen hours

Attributed, not assumed. Every one of the eight new rows traces to context-cleanup **round 5**, which completed overnight ([`666572e0`](https://github.com/christianspliid-ui/threadbare/commit/666572e0) at 2026-08-29T20:53Z, "R5-T2 repo-docs sweep", and [`9f6749cb`](https://github.com/christianspliid-ui/threadbare/commit/9f6749cb) at 2026-08-29T22:27Z, "round 5 complete, program complete") — both **after** run d's 04:30Z sweep.

**New (8):** `encounters.md` ← encounter-authoring-frameworks · `encounters.md` ← nudge-card-repertoire · `interface-map.md` ← shared-anchor-machinery · **`process.md` ← systemic-wiring-guide** · **`process.md` ← wiring-checklist** · `prose.md` ← prose-generator-framework-design · `prose.md` ← rarity-prose-tier-bias · `verification-gates.md` ← systemic-wiring-guide

**Departed (1):** `engine.md` ← systemic-wiring-guide — a genuine repair. `Docs/canon/engine.md` now reads `last_reviewed: 2026-08-29`, re-stamped by [`8b7d4e8b`](https://github.com/christianspliid-ui/threadbare/commit/8b7d4e8b) ("r4-t1: engine canon rewrite", THR-1362).

**The two bolded rows are the finding.** Run d's headline was that `process.md` had been rewritten and re-stamped to `2026-08-28`, retiring five rows at once — *"the single largest staleness repair this tier has seen."* Sixteen hours later, two of those five are back, because round 5 edited `systemic-wiring-guide.md` and `wiring-checklist.md` again. `verification-gates.md` (also stamped `2026-08-28`) was re-staled by the same commit and had never been on the list before.

This sharpens 08-28b's mechanism rather than repeating it. The generalisation is not "programs add staleness" nor "a program moves it both ways" — it is narrower and more useful: **`systemic-wiring-guide.md` and `wiring-checklist.md` are the two highest-fan-in sources in the canon graph, and any commit touching either re-stales every page that declares them.** `systemic-wiring-guide.md` alone accounts for **5 of today's 25 rows** (`attachments`, `encounters`, `process`, `prose`, `verification-gates`). Re-stamping a canon page against those two buys about a day. That is a property of the graph's shape, not of anyone's diligence, and it is what makes this count uninformative as a quality signal without attribution.

Today's full 25, published so tomorrow's diff is real: `attachments.md` ← systemic-wiring-guide · `consumption-ledger.generated.md` (missing) · `cosmology.md` ← archetype-virtue-vice · `cosmology.md` ← sphere-governed-ascendant · `design-governance.md` ← linear-coordination-protocol · `design-governance.md` ← wiring-checklist · `encounters.md` ← systemic-wiring-guide · `encounters.md` ← encounter-experience-design-plan · `encounters.md` ← encounter-experience-player-journey · `encounters.md` ← nudge-model · `encounters.md` ← encounter-authoring-frameworks **(new)** · `encounters.md` ← nudge-card-repertoire **(new)** · `interface-map.generated.md` (missing) · `interface-map.md` ← shared-anchor-machinery **(new)** · `process.md` ← systemic-wiring-guide **(new)** · `process.md` ← wiring-checklist **(new)** · `prose.md` ← prose-generator-framework-design **(new)** · `prose.md` ← systemic-wiring-guide · `prose.md` ← rarity-prose-tier-bias **(new)** · `rulebook.md` ← encounter-experience-design-plan · `rulebook.md` ← nudge-model · `rulebook.md` ← thr-1206-reputation · `setting-coverage.generated.md` (missing) · `systems-inventory.md` (missing) · `verification-gates.md` ← systemic-wiring-guide **(new)**.

Known-benign floor unchanged at 4 generated files with no meaningful `last_reviewed`.

### New finding 3 — a third way a row can appear, which neither previous sweep had seen

`interface-map.md` ← `2026-08-27-shared-anchor-machinery.md` is new today, and **no source file changed and no stamp moved**. The plan doc's git date is 2026-08-27T19:18Z and `interface-map.md` still reads `last_reviewed: 2026-08-06` — both true yesterday too.

What changed is the *declaration*: commit [`4193db91`](https://github.com/christianspliid-ui/threadbare/commit/4193db91) (2026-08-29T23:20Z) **added that plan doc to `interface-map.md`'s declared sources** without re-stamping the page. Verified with `git log -S "2026-08-27-shared-anchor-machinery" -- Docs/canon/interface-map.md`, which returns exactly that one commit.

So the count moves on three independent mechanisms — source edited, page re-stamped, **and source-list edited** — and only the first two were previously understood. Worth having on record because "a page gained a row" now has a benign explanation that looks identical to decay in the output, and telling them apart needs the `-S` query above.

### Finding 4 — a standing redundancy is **closed**, verified in code rather than inferred from the ticket

Yesterday's redundancy pass named two `getFactionDefinition` implementations — `src/engine/factionNetwork.ts` (dynamic-aware) and `src/data/faction-definition-lookup.ts` (module-eval static map) — as a confirmed duplicate owned by THR-1322, then In Dev.

THR-1322 is **`Done`** (2026-08-29T07:21Z, [PR #1714](https://github.com/christianspliid-ui/threadbare/pull/1714)), and the redundancy is genuinely retired rather than merely ticketed. Read at `origin/main`: `factionNetwork.getFactionDefinition` is now a two-line delegation to the shared lookup, and `getFactionDefinitionForNode` likewise —

```ts
export function getFactionDefinitionForNode(node, dynamicDefs?) {
  const defId = node.properties.factionDefId as string | undefined;
  return lookupFactionDefinition(defId, dynamicDefs);
}
```

Two implementations became one implementation plus two thin adapters, which satisfies THR-1322's Done-when 2 (*"either takes the dynamic map or is retired… the two must not disagree"*) on the *delegate* branch rather than the *retire* branch. The static module additionally grew a real dynamic registry (`registerDynamicFactionDefinition` / `publishDynamicFactionDefinitions` / `clearDynamicFactionDefinitions`), which is what lets the UI's 10 production importers see a run-founded faction.

**This is the second standing T3 finding ever retired**, after the distance-matrix overrun closed on 08-29d.

### Finding 5 — the shadow-board redundancy: correction, and it is no longer a build problem

Yesterday's pass named `UNIFIED_DECISION_BOARD_MODE = 'shadow'` as the largest duplicate in the engine — two complete scoring implementations running on every agent decision every tick — and closed with *"it is unblocked as of 03:42Z today."* **That held for roughly ninety minutes.** Re-measured at `origin/main` this run:

| Yesterday's claim | Today, verified |
|---|---|
| `UNIFIED_DECISION_BOARD_MODE = 'shadow'` at `strategic-action-constants.ts:309` | **Still `'shadow'`**, now at `:338` (line moved, value unchanged) |
| Three scaffolding pieces keep it honest | **Two.** `src/engine/decisionBoardModeGuard.ts` is **deleted** with its test — the branch it warned about is implemented now, so the warning would have fired on the opposite of a true statement |
| `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` | Still present (`0.85`), deliberately — in `'shadow'` contest B is the only thing that selects an undertaking, so the three go in one commit or none |
| Retirement path unblocked | **Re-blocked**, behind [THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade), which is now a **design fork** rather than a build task |

Also shipped and inert since: the live branch itself, `BOARD_VARIETY_PENALTY_WEIGHT = 0.18` with `computeBoardVarietyMultiplier` in `decisionBoard.ts`, and `CENSUS_DISTINCT_TEMPLATE_FLOOR` in `scripts/undertaking-census.ts`.

**The substantive change is the character of the blocker, not its existence.** The prescribed remedy was implemented and measured, and the number it was prescribed to move did not move (`trades_with` 0 → 0 on both seeds). The real mechanism turned out to be that the board introduced axiological desire into undertaking selection, and `strategic_establish_trade_route`'s authored `motivations` mismatch its only proposer's profile — `desireMultiplier` `0.0112` against a winner's `2.7750`, the floor. Desire is a multiplier, so a floored template needs ~90× the EVT of a matched sibling.

**Not this lane's to settle** (non-negotiable #3). Routed as Christian item 2 above. While it stands, the shadow board remains pure telemetry cost on every agent every tick — that cost is now the price of an open design question, which is a materially different thing from the price of unscheduled work.

### New finding 6 — a live redundancy no reachability sweep can see: `getAgentsAtLocation` exists twice, and both copies are in production

Found by the judgement pass, not by a detector. A mechanical scan for exported function names defined in more than one production module under `src/engine` and `src/data` returned twelve candidates; eleven were dismissed on reading (see the trap note below). One is real:

| | `src/engine/graphQueries.ts:23` | `src/engine/hexZoom.ts:40` |
|---|---|---|
| Edge walked | `getIncomingEdges(locationId, 'located_at')` | identical |
| Filter | `actorType === 'individual'` | identical |
| Extra | optional `spotlightTier` narrowing | none |
| Production callers | **6** — `agentLifecycle`, `ascendantExpression`, `hexActionBridge`, `mentorshipUndertaking`, `strategicGraphOps`, `unifiedActionResolution` | **2** — `hexVignette.ts:207`, `surveyProseComposer.ts:104` |

Same name, same signature modulo the optional parameter, semantically identical bodies (`map`/`filter` vs an accumulator loop). **Both reachable — which is exactly why no reachability sweep will ever flag this, and why it belongs to the judgement pass.**

**The concrete future cost, and the reason this is worth a line rather than a shrug:** the split runs *through* one feature area rather than between two. `hexActionBridge.ts` takes the `graphQueries` copy while `hexVignette.ts` and `surveyProseComposer.ts` — its neighbours on the same hex surface — take the `hexZoom` copy. Add a fog check or a tier filter to one and the other silently keeps the old behaviour on the same screen. That is the shape that produces a "why does the panel disagree with the tooltip" bug six months from now.

**Recorded, not filed** — the throttle. For the retro: this is a delete-one-and-repoint-two-imports change with no design content.

**A second pair, different shape, flagged for Monday rather than now.** `getLocationsInRegion` is also defined twice (`graphQueries.ts:65`, `viewLevel.ts:22`) with identical semantics, but the `graphQueries` copy has **zero production callers** — its only references are its own test. That is a dead-coverage question, which belongs to the **weekly** test-suite pass (not due today, § below), and "a general query helper has no caller this month" is weak grounds for deletion. Left alone deliberately.

Both copies do carry one thing worth checking whoever touches them: they filter `node.type === 'location'`, which **since THR-1183 matches sublocations as well as place-tier locations**. The live copy is `viewLevel.ts:103`. Whether that is correct depends on what that call means by "locations" — I am not asserting a defect, only that this is the same class THR-1346 fixed in the distance matrix and that the check is a one-liner (`isPlaceTierLocation`).

**The trap that ate most of this pass, recorded so the next one skips it.** The top hit was `composeDealtStepFromState`, "defined three times" — it is **one function with three TypeScript overload signatures** in a single file (`dealHand.ts:495/499/508`). Six more (`resolveAction`, `classifyForecast`, `readMotiveReceipt`, `getTrackedAgentIds`, `getDominantSphere`, `drawFromPool`) are same-name-different-domain, and `generateGroupName`'s second definition is a test baseline. **Read the bodies, never the name count** — the same lesson as `AgentDots.test.tsx` in THR-941, one layer up.

**The honest limit:** one area probed for duplication plus two standing findings re-verified. Not a clean bill across the map.

### Stalled work

**No stall at or near threshold, and yesterday's watch item is closed.**

- **[THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) — watch closed.** Run d flagged it at **2** `Ready for Dev → In Dev` transitions, one short of `ORCH_STALLED_PICKUP_THRESHOLD` (3), as *"the only issue on the board anywhere near it."* Its full `stateHistory` read this run ends `In Dev 2026-08-28T22:02Z → Done 2026-08-29T07:21Z`. It never reached 3. The flag was correct to raise and correct to drop.
- **`In Dev` holds 3, all `Parked`, all unassigned** — THR-1133, THR-1130, THR-1168. The WIP=1 slot is free with nothing to fill it.
- **No hand-created `In Dev` ticket** (THR-1325 ruling). Membership and `updatedAt` (all 2026-08-28) are unchanged since run d read each one's `stateHistory` in full — and a `stateHistory` cannot change without `updatedAt` changing, so run d's per-issue reading still holds by construction. Stated as inheritance-with-a-reason rather than as fresh measurement.
- **THR-1349 at 1 transition, THR-1301 at 1** — both parked deliberately with written reasons, not failed pickups. Neither is a stall signal; recorded so the next sweep has the baseline.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is **Sunday**. [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands unchanged on `ops` and is deliberately not summarised here. Next pass tomorrow — with one item queued for it: the `getLocationsInRegion` dead-coverage question in finding 6.

## Escalations

**No Discord post, and it is the same decision run — made, for the same reason.** The escalation rule fires on *agreed work exhausted → stop and ask*. The first half is true; the second fails, because there is no **new** question. All three standing asks were carried into the 02:27Z briefing under two hours ago, and posting them again at 06:26 on a Sunday would put a second copy in front of Christian before he has seen the first. Hourly re-asking is the noise pattern that trains a reader to stop reading.

The trigger the next runs should watch for is unchanged and worth restating: **if the shelf is still at zero when work resumes on Monday, the ask stops being a duplicate and becomes a fresh escalation.**

**Parked this run, unchanged:** the two `In Design` items (11 and 15 days), the batch-2 human gate (6 days), the eleven HITL wayfinder questions, the trade-route desire fork.

**One detector did not finish** — `sweep:rank-reach`, recorded above as **not measured**, not as passing. Everything else ran to completion; Linear was reachable for every call. **No write of any kind was made this run** — no promotion, no filing, no claim, no comment. Every Linear fact above is a read.
