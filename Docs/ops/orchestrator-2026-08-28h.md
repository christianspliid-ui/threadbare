---
lane: tb-orchestrator
run: 2026-08-28h
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-28 (run h, ~17:29Z)

## Needs Christian

**The job shelf is now empty of game work — every item left on it is a small cleanup.** Four jobs are queued and all four are deferrals: leftover tidying split off from finished work. Nothing on the shelf builds, changes or fixes anything a player would meet. That is the state the project's own rule says to raise with you rather than paper over by queueing more cleanup.

**The cause is the same one as the last twenty-one hours, and it is one decision wide.** Two designs sit in the design column waiting for a person, and while they sit there nothing new can be prepared for the builders:

1. [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — **9 days** waiting.
2. [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — **13 days** waiting.

Pick either one up, or park it and say so, and the design lane starts moving again. Until one moves, this lane is barred from staging a third.

**And the one queued item that would put real content work back on the shelf is still waiting on your yes:** [approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)).

Nothing else needs you. The builders are working — two jobs are mid-flight and both look healthy this hour.

## T1 — unblock sweep

**Promoted: 0. Held: 2. Filed: 0. Declined: no set re-derived.** Board state at the sweep: **4 `Ready for Dev`** (`hasNextPage: false`), **5 `In Dev`** — THR-1307 and THR-1309 claimed, plus the same three `Parked` umbrellas (THR-1130 / THR-1133 / THR-1168) — **2 `In Design`**, `Todo` returning 50 with `hasNextPage: true`. `Idea` and `In Design` were **queried by hand** again, as runs f and g did; `Idea` is where this run's finding came from, for the third consecutive run.

**All four `Ready for Dev` items carry the `Deferral` label. Non-`Deferral` program work on the shelf: zero.** That is a threshold crossing, not a rounding of run g's "4" — see § T2.

### The run's finding — a ticket whose own coordination block certifies a premise that has not landed

[**THR-1330**](https://linear.app/threadbare/issue/THR-1330/ascendant-bar-hook-chips-carry-a-tooltip-but-no-image-and-no-link-law) was filed at 17:18:30Z, eleven minutes before this sweep, as the UI-Laws deferral off THR-1307. It is a well-made ticket: coordination block authored at filing per THR-836, specific Done-when, mutex reason stated and correctly marked inapplicable. `get_issue(includeRelations:true)` returned `blockedBy: []`, it names no plan doc so the THR-921 liveness gate passes trivially, and its latest comment is that block rather than a retire verdict. **On every check T1 performs, it promotes clean.**

It should not, and the reason is one sentence in its own block: *"Blocked by: nothing. THR-1307 shipped the repoint this rests on."* **THR-1307 has not shipped.** It is `In Dev`; PR [#1697](https://github.com/christianspliid-ui/threadbare/pull/1697) was armed for auto-merge at 17:24:31Z and sits `BLOCKED` on required check `Test · Typecheck · Build`, `IN_PROGRESS` since 17:26:18Z.

**Measured against `origin/main` rather than inferred from the PR state:**

```
$ git show origin/main:src/components/Game/ascendant-bar/HooksBlock.tsx | grep -n has_attachment
119:  const attachmentEdges = graph.getOutgoingEdges(ascendantId, 'has_attachment');

$ git ls-tree -r --name-only origin/main -- src/components/Game/ascendant-bar/__tests__/
ascendantBarTooltipConformance.test.tsx
covenantRows.test.ts
hoverTimerCleanup.test.tsx
reachRows.test.ts
signaturePaths.test.ts
```

On `main` today the chip source still reads the writerless `has_attachment`, so the Conditions / Clues / Vows rows still render nothing in any world — and `hooksBlockCarrier.test.tsx`, the file THR-1330's own Repro block invokes, **does not exist**. An executor claiming it from a worktree cut off `main` gets a repro command that errors on a missing path and an empty surface to assess against Law 1. That is the THR-887 shape — unsatisfiable by construction, discovered after the claim.

**Why this is a class the existing gates do not cover.** The THR-921 liveness gate checks *plan docs*; here the stranded artifact is a **source file**, and the ticket names no plan doc at all, so the gate passes by not applying. The dependency half reads `blockedBy: []` and a `Blocked by: nothing` line, both of which are literally what the field says. The trap is that a deferral filed *from inside* an unmerged PR describes the world that PR creates, in the shipped tense, and every signal T1 consumes agrees with it.

**Action taken — a gate, not a note.** Native `blockedBy` → THR-1307 set on THR-1330 this run and **verified by `get_issue` re-query** (`blockedBy: [THR-1307]`; the same write moved THR-1307 out of `relatedTo`). The native relation is the one signal every sweep honours, so the hold releases mechanically when #1697 merges rather than depending on a future run repeating this file check. [Evidence posted to the ticket.](https://linear.app/threadbare/issue/THR-1330/ascendant-bar-hook-chips-carry-a-tooltip-but-no-image-and-no-link-law) Nothing is wrong with the ticket and no orchestrator action is owed once THR-1307 is `Done`.

**Not filed as a ticket.** The pattern is real and worth a rule — *a deferral filed from an open PR must be gated on that PR's ticket* — but scheduled lanes do not file process tickets (CLAUDE.md § Process-work throttle), the loss here was prevented rather than incurred, and it is below the materiality bar as a single instance. It belongs in the weekly retro's log alongside the `Idea`-scan-gap amendment already carried by [PR #1694](https://github.com/christianspliid-ui/threadbare/pull/1694). Recorded here as the third consecutive run on which **`Idea` is where this lane's live work appeared** while T1's documented step 1 does not query it.

### Held

| Issue | Evidence |
|---|---|
| [THR-1330](https://linear.app/threadbare/issue/THR-1330/ascendant-bar-hook-chips-carry-a-tooltip-but-no-image-and-no-link-law) — hook chips carry no image and no link (Law 1) | Premise artifact not on `origin/main` (file listing above). `blockedBy` → THR-1307 set and verified this run; releases when [#1697](https://github.com/christianspliid-ui/threadbare/pull/1697) merges. **Whichever run promotes it owes the separate `assignee: null` write** (THR-845) — it was born assigned by the create-path default |
| [THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-undertakings-ignore-their-stage-until) — `requiresLocation` defaults off | Unchanged: native `blockedBy` → THR-1309, which is `In Dev` on [#1690](https://github.com/christianspliid-ui/threadbare/pull/1690). Mechanical release, no re-derivation |

**THR-1321, THR-1322 and THR-1329 are not re-listed as holds** — all three carry native `blockedBy` → THR-1309 and release with the same merge. Run g set the last of those gates; the set is now fully mechanical and needs no hourly restatement.

### Declined

**Nothing re-derived, by design.** Runs c–g's classification of the `Todo` set stands and no member has moved: THR-1222 (unmet chat-approval gate — see § Needs Christian), THR-1195 (standing verdict on record), THR-1256 (unmet time gate, opens 2026-09-08), THR-1255 and THR-1218 (gated on content density that has not arrived), THR-1220 (HITL review session, never promotable), the design-gated tickets routed to T2, and the program epics and plan-doc sessions. All `wayfinder:*` items skipped unconditionally — T1.5's input, never `Ready for Dev`. Re-listing this set hourly with identical evidence is the dump this lane forbids.

### Board movement since run g, read but not acted on

[#1693](https://github.com/christianspliid-ui/threadbare/pull/1693) merged 17:17:18Z (THR-1313) and [#1696](https://github.com/christianspliid-ui/threadbare/pull/1696) merged 16:48:45Z (THR-1320) — both `DIRTY` closeout-docs conflicts at run g, both resolved by the executor without escalation, as predicted. **[#1690](https://github.com/christianspliid-ui/threadbare/pull/1690) has been re-pushed and its CI is `IN_PROGRESS` at 17:26:56Z**, so run g's red — the real `trades_with` regression at `edgeIntegrity.test.ts:318` — is being addressed rather than sitting. No verdict on the fix: the run is not finished and the branch was not checked out. Both open PRs now read `BLOCKED` on an in-flight required check, which is the healthy waiting state, not the THR-969 shape run g diagnosed.

## T1.5 — wayfinder sweep

Three open maps, unchanged: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator).

**AFK burn-down: 0, re-proved independently rather than inherited from run g.** Two direct label queries this run: `wayfinder:research` returns **19 issues, every one `Done`**; `wayfinder:task` returns **3, every one `Done`**. The zero therefore means *every agent-doable ticket these maps have ever carried is finished* — not "none happens to sit in `Todo`". Those two read identically in a report and only one is healthy, which is why it is re-proved each run rather than copied forward. Nothing claimed, nothing assigned, no guessed resolution posted.

**HITL frontier deliberately not re-listed.** Every open child across the three maps carries `wayfinder:grilling` or `wayfinder:prototype`, which an agent must not resolve. The set is unchanged since 2026-08-26 and has been surfaced; re-surfacing it hourly is the same dump. It is subsumed by the design-column ask in § Needs Christian, which is the same bottleneck wearing a different label.

## T2 — design staging

**Triggered, bound out — for a twenty-first consecutive run. Nothing staged; the bound was not overridden.**

The trigger is `ORCH_PROGRAM_WORK_FLOOR` (2) non-`Deferral` items in `Ready for Dev`. **This run that count is 0** — the shelf holds four items and all four are labelled `Deferral`. Previous runs read 4–5 shelf items with the same zero underneath; this is the first run where the shelf is small *and* uniformly deferral, so the two numbers no longer disagree about the state.

The bound is `ORCH_MAX_IN_DESIGN` (1) and `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (untouched since 2026-08-19, **9 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (2026-08-15, **13 days**). Both are past the 48-hour re-surface threshold by an order of magnitude and are re-surfaced in § Needs Christian rather than re-staged, which is what the rule prescribes.

**Per CLAUDE.md § Process-work throttle, the headline finding when the product shelf is empty is "feature pipeline needs design/Christian" — never another process promotion.** That is stated as this run's headline and is the reason § Needs Christian leads with it. This lane deliberately runs Sonnet and does not author plan docs (Christian's ruling 2026-08-06); the unblock is an attended Opus session picking up one of the two, and no amount of orchestrator activity substitutes for it.

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6): [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it.

**No detector ran this run, and none is reported as clean.** The `newFindings: 1` in this report's frontmatter is the THR-1330 promotion trap in § T1 — reached by reading a ticket and two `git` queries against `origin/main`, **not** by any detector. It is counted because the run materially changed the board (a gate set and verified), and named here explicitly so it is not mistaken for detector output. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: **not run, not reported as clean.**

**Redundancy: not assessed this sweep.** Run b's judgement pass over the interface map and systems inventory stands. Nothing above amends it — the THR-1330 finding is a coordination-protocol defect, not a redundancy one.

**Stalled work: not re-assessed, and run g's caveat stands unchanged** — no `In Dev` issue meets `ORCH_STALLED_PICKUP_THRESHOLD` (3 `Ready for Dev → In Dev` transitions without a `Done`), because the detector counts re-claims and is therefore blind to a first claim that never lands. THR-1309 is ~6h58m `In Dev`, but with CI actively re-running on a re-pushed branch that is progress, not a stall. The observation that the detector needs a duration signal belongs to the weekly retro and is not re-filed here.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

## Escalations

**None raised, none parked.** No question needed the Discord channel this run: the one finding was actionable by this lane inside its own remit (a native relation on an unclaimed ticket, plus the evidence comment), and the one thing that is genuinely stuck — the design column — is a standing ask already carried to Christian by the hourly briefing rather than a new question.

**One sandbox friction, already documented, recorded not re-filed.** Writing this report via a Bash quoted heredoc failed with `unexpected EOF while looking for matching '` — the known Bash-heredoc corruption class (CLAUDE.md § Known Sandbox Limitations; impediments #211 ×2, #329, #352). Re-authored with the Write tool as that entry prescribes, at a cost of one call. No new impediment row: the limitation is logged, the workaround is documented, and it is the workaround that succeeded.

**Non-negotiables honoured:** nothing claimed, no issue set to `In Dev`, no assignee written, no priority written, `Design/briefing.md` and `Design/user-actions.md` untouched, no direction chosen. The one write this run was a dependency relation recording a fact measured against `origin/main`.
