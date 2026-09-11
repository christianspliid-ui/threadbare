---
lane: tb-orchestrator
run: 2026-09-11b
promoted: 0
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Orchestrator — 2026-09-11 (run b, ~04:30Z)

## Needs Christian

**One word, and it is now holding a checkbox on work that is finishing this morning.**

The realm build has been landing all night — a nation is now a real political thing with a seat, a territory, a court ladder and a border that moves when a town is taken. Its third and last stage merged nine minutes into this run. One of its remaining boxes reads *"the UL entries **once approved**"*, and that approval is yours alone.

| The word | What it names | Where |
|---|---|---|
| **Realm** — or **Nation**, your pick | The political thing the red borders draw: a landed faction, seated at a capital, holding a territory of towns, with a court to climb | [THR-1453](https://linear.app/threadbare/issue/THR-1453) |
| **hold** | A town a mortal keeps by *working* it — your own ruling from yesterday morning | [THR-1449](https://linear.app/threadbare/issue/THR-1449) |
| **cast** and **Forecast tier** | A god playing a divine action card; and the odds-reading shown *before* the dice, as words rather than numbers | [THR-1445](https://linear.app/threadbare/issue/THR-1445) |

Only the first genuinely wants your taste — *Realm* over *Nation* on register grounds, and the write-up says outright you may veto the headword. The other two are settled in substance and need a yes.

**What changed since this was last put to you.** It was a timing argument before; it is a named unsatisfiable box now. The realm ticket cannot be fully closed out against its own plan until the three words are seated, so the word is the last thing standing between a finished system and a finished ticket.

**One thing was deliberately *not* added to your list.** The design tier has been blocked for five runs straight by a single 27-day-old item, and the previous run said it would become this hour's ask. On a closer read it does not need you at all — the exit is a label, and applying it is the grooming lane's job, not yours. It is routed there instead, in § T2. Your list stays one item long.

## T1 — unblock sweep

Scanned `Todo` (**32**) and `Ready for Dev` (**3**) — two state-filtered calls, bucketed in memory, never one unfiltered sweep (THR-686). The `Idea` column was also read this run (60 rows) to confirm no candidate had arrived there; none had.

**Promoted — 0.** No candidate's gate cleared in the two hours since [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11.md). Declines are the healthy steady state and are not re-listed in full here; run a's table stands and was re-derived, not inherited. One decline did change character and is worth its own entry.

### The decline that is now hours away rather than days — [THR-1454](https://linear.app/threadbare/issue/THR-1454)

Realm encounters (court summons, border levy, tithe) is the **only non-`Deferral` program item** waiting in `Todo` whose blocker is actively being worked. Its gate: *"Pick up after its slice 3 is Done."*

| Check | Result |
|---|---|
| Native relation | `blockedBy: THR-1155`, which is **`In Dev`**, not `Done` |
| Prose gate — slice 3 | **Partly met, not met.** Slice 3's sentinel half merged as [PR #1893](https://github.com/christianspliid-ui/threadbare/pull/1893) at **04:36:01Z**, nine minutes into this run (`thr-1155-slice3-sentinels`, now `f93a601d` on `main`) |
| Why that is not enough | Slice 3's own checklist in [the plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-10-thr-1155-realms-and-areas.md) has boxes left after the sentinels: the registry/canon/wiki/UL/interface-map item, the browser-verify capture of a border visibly moving, the gate stack, and *"Closing commit body and PR body include `Fixes THR-1155`"* — which has not fired, which is why the ticket is still `In Dev` |
| Precedent for not guessing | Slice 2 took **six** PRs (#1887–#1892). A branch named `slice3-*` merging is not the slice ending |

**Verdict: decline, and queue it by name.** The moment THR-1155 reaches `Done`, THR-1454 is the next promotion and needs no fresh judgement — its plan doc is live on `main`, it carries no other gate, and it is real content work rather than a deferral. Recorded this precisely so the next run promotes in one step instead of re-deriving the slice state.

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These never enter `Ready for Dev`.

**The three UL-proposals stay in `Idea`.** Unchanged reasoning: their first gate is a human approval no executor can obtain (`Docs/ubiquitous-language/Process.md:133` — *"Approval is always human — no auto-merge"*). Promoting them would put unstartable work at the top of the queue. They reach Christian through § Needs Christian instead, which is the only channel that can actually move them.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available — re-measured this run, not inherited.** Two all-state label queries: all **21** `wayfinder:research` and all **5** `wayfinder:task` issues in the team are `Done`. `ORCH_WAYFINDER_AFK_MAX` (2) is not the constraint; **supply is zero**. There is no agent-doable wayfinder work anywhere on the board, and there has not been for days.

**Frontier: 12 open decision tickets, 11 unclaimed, all HITL** (`wayfinder:grilling` / `wayfinder:prototype`; [THR-1232](https://linear.app/threadbare/issue/THR-1232) carries an assignee and so is off the frontier). **None touched** — resolving a grilling or prototype ticket is the broken-HITL failure mode the wayfinder skill exists to prevent.

**Not surfaced by name to Christian this hour, deliberately.** These have stood in front of him for over two weeks; re-listing twelve of them hourly is how a standing ask stops being read. This run's single ask is the one word that is blocking a box today.

## T2 — design authoring

**Triggered, and barred — fifth consecutive run.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0** of 3 at scan ([THR-1456](https://linear.app/threadbare/issue/THR-1456), [THR-1053](https://linear.app/threadbare/issue/THR-1053), [THR-1455](https://linear.app/threadbare/issue/THR-1455) all carry `Deferral`), below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

| Occupant | Classification | Evidence |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) — Traits wave 2 | `stale-assigned` → **counts against the bound**, warn-only | `Todo` → `In Design` 2026-08-15T20:29:32Z, never further; assigned; **27 days** |

**The bound was tested against the executable predicate, not just the prose.** `classifyInDesignItem` ([`scripts/stale-claim-sweep/index.ts:362`](https://github.com/christianspliid-ui/threadbare/blob/main/scripts/stale-claim-sweep/index.ts)) returns `stale-assigned` → `countsAgainstBound: true` for this shape. The skill is explicit that the function is what actually ran; it agrees with the prose here, so the bar is real and I obey it.

### A theory tested and discarded rather than acted on

The tempting move was to argue THR-790's assignee is an artifact — the way [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11.md) correctly argued for THR-1455 — which would flip it to `stale-unassigned`, exclude it, and free the tier. **The evidence does not support that, and [THR-1382](https://linear.app/threadbare/issue/THR-1382) already ruled on this exact issue by name:** *"THR-790 is assigned to Christian and genuinely awaits him — the correct shape is `Parked`."* Its Done-when even pins the classification. Overriding a recorded judgement to unblock myself would be the lane inventing permission.

What *is* true, and worth one line rather than a finding: `assignee: Christian Spliid` cannot distinguish "Christian is waiting on this" from "an agent session claimed it", because `pull-work` claims with `assignee:"me"` and the Linear connector authenticates as him. [THR-1155](https://linear.app/threadbare/issue/THR-1155) is the live proof — an agent has been shipping it all night and the field reads his name. That ambiguity is general; it does **not** make THR-790 specifically an artifact, since he created it, moved it, and its body says *"Needs its own design finalization before Ready for Dev."*

### So the bar is routed, not escalated

The exit is the `Parked` label, and the skill assigns that to *"the grooming lane's remit and Christian's call"* — which means it does **not** require him. `daily-backlog-grooming` can apply it; THR-1382's own item 1 then excludes it from the bound automatically, and the design tier opens without spending any of his attention.

**Routed to `daily-backlog-grooming`:** apply `Parked` to THR-790. It is `In Design`, assigned, 27 days idle, and is the sole bar on design staging for the fifth run running. This lane does not apply it — mutating another party's staged item on an inference is the shape that let a lane strip a live session's assignee twice (impediment #755).

**What the bar defers, in order:** [THR-1348](https://linear.app/threadbare/issue/THR-1348) (director ruling on record, and it invites this tier — and see § T3, where this run's own detector output independently corroborates its premise), then [THR-1448](https://linear.app/threadbare/issue/THR-1448) (blocker met, but sequenced after THR-1155 per that plan's mutex line), then [THR-1274](https://linear.app/threadbare/issue/THR-1274).

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis.

## T3 — architecture health

**Due and run in full.** Local hour at scan **06:27**, past `ORCH_HEALTH_SWEEP_HOUR` (6); run a at 04 local correctly skipped. Baseline for the diff is [run c of 2026-09-10](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md), the last sweep that executed detectors.

| Detector | Result | vs. 2026-09-10c |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, 96 LIVE, each LEAKED row carrying a remediation ticket | **Unchanged** — the same seven |
| `check:canon-staleness` | **29 warnings** | **28 → 29** (+1) — Finding 3 |
| `sweep:rank-reach` | **`PASS`** — 60 gated templates reachable, 0 blocked, 0 unowned | Verdict unchanged. Apex holders at tick 900 **23 → 13** |
| `check:process` | **`passed-with-gaps`** — 1 warning, 3 sub-checks dark | **Unchanged** — run c's Finding 1, not re-filed |

The seven LEAKED contracts are the same seven: `attachment-activated-effects` · `attachment-edge-modifiers` · `branch-decision-writes-archetype-drift` · `compulsion-card-plants-agent-decision-bias` · `nudge-card-cost-channels-detection-and-doom` · `trait-ref-authoring-vocabulary` · `undertow-card-drifts-mortal-values`.

**`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. Not run, and not reported as clean.**

**`check:process`'s three dark sub-checks are the same three, and the precheck now corroborates the cause.** `[WARN] linear-auth global LINEAR_API_KEY is unset; skipped Linear-backed checks (recent plan references, orphan issues, Ready-for-Dev handoff keywords)` — exit code still 0. This run's `session-precheck` independently reported `linear=nokey` from the same root. Not counted as new; recorded so the pairing is on the record for the retro.

**Redundancy: assessed this sweep.** First actual judgement pass in several sweeps rather than the honest "not assessed" line — method and result below.

### Finding 1 (new) — the redundancy pass: a general-looking field that only ever means one thing

**Method.** Grouped all 92 generated contract rows by `Producer → Consumer` and read every cluster for pairs whose intents overlap, then checked the suspicious pairs against the actual read paths in source. One pair was examined and **cleared**: `agent-grudge-reaches-the-mortal-sheet` and `grievance-reaches-the-mortal-sheet` look like duplicates and are not — one is the grudge *edge* rendering into the Bonds tab, the other a grievance-flavoured *ambition* rendering into `IntentSection`, with different writers and different UL terms. A negative result, stated so the pass is legible.

**The pair that did not clear** is `attachment-grants-trait-while-held` (🟢 LIVE) beside `attachment-trait-grant-effects` (🟢 LIVE) — both under *Attachments, Items & Possessions → Encounters & Dilemmas*, both claiming that an item grants its bearer a trait that gates encounter eligibility. Both reachable, which is exactly why no reachability sweep can see this.

Measured on `origin/main`:

| | Channel A — the property | Channel B — the effect |
|---|---|---|
| Declared as | `grantsTraitWhileHeld?: string` — [`src/types/attachments.ts:95`](https://github.com/christianspliid-ui/threadbare/blob/main/src/types/attachments.ts), an **open** string | `effect.type === 'trait_grant'`, `effect.grantedTrait` |
| Writers | **6**, every one of them the single value `'ruin_seeker'` (5 × `reward-attachment-catalog.ts`, 1 × `strategicGraphOps.ts:630`) | the catalogs, `starter-attachments.ts`, `gameInit.ts`, `worldSeed.ts` |
| Readers | **1** — [`encounterScoring.ts:396`](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/encounterScoring.ts), an **equality test against one constant**, `RUINS_SEEKER_TRAIT_TAG` | `collectGrantedTraits` → `encounterFilterPipeline`, `ambitionTick`, `spellActivation`, `effectPredicates`, `hasGrantedTrait` |

**The defect is the over-claim, not the scorer.** `computeRuinsBonus` is right to test for one tag — a ruins bonus only cares about `ruin_seeker`. What is wrong is that the field's *type* promises any trait, the interface map's row promises *"gating encounter eligibility"* in general, and neither is true: **no reader anywhere honours any other value**, because the one consumer is hard-scoped to one constant and every unified trait reader is blind to the property channel. The code already half-knows — [`effectQueries.ts:134`](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/effects/effectQueries.ts) calls it *"the sibling `grantsTraitWhileHeld` path"*.

**Failure it sets up:** an author writes `grantsTraitWhileHeld: 'veil_touched'` on a new item and gets silence — no warning, no gate, no effect, and a passing test suite. Two honest repairs: narrow the field and the contract row to the ruins case it actually is, or route the property channel through `collectGrantedTraits` so the generality becomes real.

**Not filed, and that is the call rather than an omission.** No recorded loss — nobody has yet written a second value. CLAUDE.md lists *"hardening against failures that have not happened"* as explicitly non-qualifying, so manufacturing a ticket for it would be this lane inflating a starved board with work it invented. Logged for the retro, which may weigh it against the interface-map row it also touches.

### Finding 2 (new) — a `Parked` label is losing an argument with something, weekly

[THR-1130](https://linear.app/threadbare/issue/THR-1130) now shows **5** `Ready for Dev → In Dev` transitions with no `Done` (2026-08-15, 08-17, 08-22, 09-04, **09-10**), against `ORCH_STALLED_PICKUP_THRESHOLD` (3). Run c measured four; the fifth arrived at **09-10T08:04:57Z**, after that sweep.

The shape is not a stall, and it is not healthy either:

| Released to `Ready for Dev` | Restored to `In Dev` | Gap |
|---|---|---|
| 2026-08-17T17:27Z | 18:03Z | 36 min |
| 2026-08-22T12:51Z | 14:02Z | 71 min |
| 2026-09-04T05:51Z | 06:02Z | 11 min |
| 2026-09-10T07:19Z | 08:04Z | 45 min |

**Something releases the park and something else puts it straight back, four times, roughly weekly.** The issue carries the `Parked` label throughout — which is precisely the marker [THR-1283](https://linear.app/threadbare/issue/THR-1283) added so the stale-claim sweep would stop destroying parks it can see are parks. Either that fix does not cover this path or a second actor is releasing it. Per-occurrence cost is minutes, but it permanently poisons the stalled-pickup signal: the only issue this detector ever flags is the one issue that is not stalled.

**This lane does not lift or re-apply the park** — same reason as THR-790. Logged for the retro with the transition table as the quotable evidence; not filed, being process work below the materiality bar on any single occurrence.

### Finding 3 (new, and it repairs tomorrow's diff) — a quarter of the canon count can never be cleared

28 → 29 warnings. But **7 of the 29 are `missing or invalid frontmatter field: last_reviewed`**, and six of those are on pages that are *generated*: `interface-map.generated.md`, `setting-coverage.generated.md`, `undertaking-grid.generated.md`, `world-objects.generated.md`, plus `systems-inventory.md` and `world-objects.md`. A generated page has no human review date by construction, so those rows cannot be cleared by reviewing anything. Roughly a quarter of this detector's output is structurally permanent.

**The consequence for this tier is that the bare count is a weak diff signal** — which bit this run. Run c recorded "28" and nothing else, so a net +1 could not be resolved into composition, and three plan-doc edits landed yesterday *after* that sweep (`systemic-wiring-guide` 09:33Z, `wiring-checklist` 15:12Z, `INDEX.md` 19:47Z) that each touch several rows. **Repair, applied here:** the 29 rows are enumerated below so tomorrow's sweep can diff composition instead of a scalar.

<details>
<summary>The 29 rows, by page (so the next sweep can diff)</summary>

`attachments` ×1 · `consumption-ledger.generated` ×1† · `cosmology` ×2 · `design-governance` ×2 · `encounters` ×6 · `engine` ×1 · `interface-map.generated` ×1† · `interface-map` ×1 · `process` ×2 · `prose` ×3 · `rulebook` ×1 · `setting-coverage.generated` ×1† · `systems-inventory` ×1† · `undertaking-grid.generated` ×1† · `undertakings` ×2 · `verification-gates` ×1 · `world-objects.generated` ×1† · `world-objects` ×1†

† = `missing last_reviewed`, structurally unclearable (7).

</details>

### Noted, not findings

- **`sweep:rank-reach` apex holders 23 → 13** at tick 900, with memberships 17. The sweep's verdict is unchanged (`PASS`, 60 reachable, 0 blocked, 0 unowned) and template reachability is what it exists to measure, so this is movement, not a defect. The realm slices landing overnight are the obvious cause; not asserted without measurement.
- **The same run output independently corroborates [THR-1348](https://linear.app/threadbare/issue/THR-1348)**, the top item T2 cannot stage: *"Draw-path eligibility: 2 of 17 members are individual+spotlight… 15 members are off the decision loop entirely. No scoring or reward change can reach them."* That ticket's premise is not a hypothesis — the detector prints it. Recorded because it strengthens the case for staging it the moment the tier opens.

### Standing sub-duties

- **Hand-created `In Dev`: swept, none found — measured, not inherited.** All three `In Dev` issues passed through `Ready for Dev` on `stateHistory`: [THR-1155](https://linear.app/threadbare/issue/THR-1155) (09-10 19:52Z → 20:02Z), [THR-1380](https://linear.app/threadbare/issue/THR-1380) (09-10 18:13Z → 19:02Z), [THR-1130](https://linear.app/threadbare/issue/THR-1130) (five times over, Finding 2).
- **Stalled work:** one trip, THR-1130, worked as Finding 2.
- **`In Design`: 1 live, 0 excluded** — THR-790 (assigned, 27d → warned, still counted). Worked in § T2.
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

### Product vs process — the week

This run promoted nothing and **filed nothing**, which is the notable number: three findings surfaced and none became a ticket. Two are process work below the materiality bar on any single occurrence (Findings 2 and 3); one is a real engine over-claim that has not yet cost anything (Finding 1). The process-ticket budget (at most one per three runs) stays untouched, and the trailing-week ratio is unmoved from run c's **~30 product / 7 process (~81% product)**.

**Headline: the builder is not the constraint and is about to run out of road.** Three realm slices shipped overnight and the last one merged inside this run. Behind it: zero non-`Deferral` items on the shelf, one content ticket ([THR-1454](https://linear.app/threadbare/issue/THR-1454)) that unblocks the instant THR-1155 closes, a design tier blocked five runs by one label, three wayfinder maps at zero agent-doable legwork, and one word awaiting approval. Every one of those is upstream of the executor, and none of them is the executor's fault.

## Escalations

- **Nothing asked on Discord.** The one Christian-facing item is low-stakes and goes via `## Needs Christian` → the hourly briefing, which is the prescribed interface.
- **One prior-run commitment deliberately not honoured as written.** Run a said THR-790's disposition *"becomes the next run's single ask"*. It is not asked, because on examination it does not need him: the exit is a label inside the grooming lane's remit. Routed there in § T2 rather than spending his attention — recorded here so this is a decision and not a drift.
- **One tempting unblock declined.** Reclassifying THR-790 as unassigned would have freed the design tier this run. THR-1382 ruled on that issue by name; the lane does not overturn a recorded judgement to unblock itself. Reasoning in § T2.
- **No Linear writes this run.** Read-only: eight queries, zero mutations, nothing to verify.
