---
lane: tb-orchestrator
run: 2026-09-20f
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-20 (run f, ~17:30Z)

## Needs Christian

**Everything that was being built is now built. The machine has run out of work.**

Run e, an hour ago, said the build queue had one job on it. Both that job and the one ahead of it landed while this run was reading the board — at 17:18Z and 17:27Z. Nothing is being built, nothing is waiting to be built, and nothing can be started without you. This is the first moment today that is true of all three at once.

I checked the whole shelf rather than trusting this morning's verdict, including the two oldest items nobody had read in weeks. **All eleven candidates say the same thing: they need a design conversation before anyone can build them.** That is not a queue that can be unstuck by working harder at it.

**So the two standing asks are now the only things on the board. Both are unchanged, and either one restarts the machine.**

**1. One design chat — this is the one that matters.** Say *"design THR-1479"* — [the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) (a mortal keeps, or misses, a meeting at a place by a time). [THR-1448, a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) comes after it. Both have been waiting since 11–12 September with nothing blocking them but the conversation.

**2. Finish the encounter sitting** you started on 12 September — the five links are on [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Nine days open.

Nothing else here needs you. The two fixes that landed this afternoon were both technical and both are done.

## T1 — unblock sweep

Shelf on arrival: **0** in `Ready for Dev`. **1** in `In Dev` — [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver), which went `Done` at 17:27:57Z mid-run. **Shelf on departure: 0 / 0.** The board is empty in both columns for the first time today.

`Todo`: **26**, unchanged set. **15 wayfinder-labelled** → skipped unconditionally to T1.5. **Promotions: 0.** Neither ceiling bound engaged (batch max 5; backed-up threshold 15).

### The T1 audit is now complete — all 11 non-wayfinder candidates have recorded decline evidence

Runs a–e carried four candidates with fresh evidence and the rest by inheritance. With the shelf at zero, inheritance is not good enough, so this run read **the two the lane had never opened** — both `Deferral`-labelled, which CLAUDE.md § Prioritization ranks *first*, ahead of new work by priority. If either were dev-ready it would have been the single most valuable thing on the board.

| Candidate | Blocker resolves? | Declines because |
|---|---|---|
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) intelligence object type | No named blocker | Body requires the design first: *"Pick one, design the `knows_of`-or-successor schema"*; Done-when 2 demands *"no new node type without the full design the load-bearing rule requires"*. Its own body calls the graph-shape half *"a THR-1348-class repair… a design decision, not an executor's call."* **→ T2 input** |
| [THR-175](https://linear.app/threadbare/issue/THR-175) agent.sphere field | Unmet trigger gate | Body: *"intentionally deferred… not actively claimable."* Neither unblock trigger has fired (creation-sphere content shipping; a template needing `sphere` independent of `reach`). Also *"When unblocked, write a full design doc before coding."* **→ unmet gate, then T2** |

The four re-verified in run e (THR-790, THR-1348, THR-1274, THR-1218) are unchanged and are not reprinted. The remaining five — THR-1220, THR-1381, THR-870, THR-791, THR-789 — are a play-checkpoint for Christian, a design-specification ticket, a parked pivot, an item assigned to Christian, and a program epic, respectively; none is executor-shaped.

**The finding, now proven across the whole set rather than a sample of four: every single non-wayfinder candidate on this board declines for needing design, not development.** Six runs have said this; this is the first that has read all eleven to say it.

**Rule 0 / materiality:** nothing filed this run. **Product-vs-process completion ratio, trailing 48h: 5 product : 4 process** — both of today's completions counted, one each side. **Headline, unchanged and now fully evidenced: the feature pipeline needs a design session.** Nothing an agent lane is permitted to do changes that.

### Run e's Rule-0 filing decision, judged by outcome

Run e filed [THR-1517](https://linear.app/threadbare/issue/THR-1517/the-multi-tick-arms-in-orchestratortestts-have-no-explicit-timeout-and) against the process-work throttle's default, and set out its reasoning so the retro could overrule it. The outcome is now on record, and tomorrow's retro should have it:

| | |
|---|---|
| Filed | 16:31Z |
| Claimed | 17:01Z |
| Merged ([#1970](https://github.com/christianspliid-ui/threadbare/pull/1970)) | 17:17:55Z |
| THR-1516's PR [#1968](https://github.com/christianspliid-ui/threadbare/pull/1968), blocked ~2h on that exact arm, merged | **17:27:37Z** |

**47 minutes from filing to fixed; the ~2h-stuck PR cleared ten minutes later.** The predicted mechanism held exactly — the borderline arm was the only thing holding a green tree out of `main`. Recording the outcome rather than the argument, so the retro judges the throttle exception on evidence. This is not a defence of filing more process tickets: the shelf was at zero, which is precisely the condition run e named as making the throttle's own purpose unserveable by waiting.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258). None updated since 2026-09-11.

**AFK frontier: 0** — verified directly this run rather than inherited, and by a cheaper route than run e's: the state-filtered `Todo` scan T1 already ran carries every open Todo's labels, and **not one of the 15 wayfinder items is `wayfinder:research` or `wayfinder:task`**. All 15 are map (3), `wayfinder:prototype` (6) or `wayfinder:grilling` (6). There is no agent-resolvable ticket on any map. `ORCH_WAYFINDER_AFK_MAX` did not bind; nothing was claimed, resolved or closed.

**HITL frontier: 12** (11 unassigned; THR-1232 is Christian's), unchanged since 2026-08-26 and already carried on the briefing — not re-listed, and deliberately **not** re-surfaced under `## Needs Christian`, where it would compete with the two asks that actually unblock the pipeline. Method note, as in runs c–e: with no AFK ticket to gate, per-candidate `includeRelations` reads were **not** run, so "frontier" here means *open and unassigned*, not *relation-unblocked*.

## T2 — design authoring

**Triggered, and barred — sixth consecutive run.** Non-`Deferral` `Ready for Dev` was **0** (floor is 2). `In Design` classifies **2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1, so nothing could be staged.

**Nothing was mutated.** Neither In Design item was parked, demoted or commented on; classification was by hand against the documented predicate, and `scripts/stale-claim-sweep/index.ts` was **not** executed, because it posts warning comments as a side effect and a read-only tier must not mutate issues in order to measure them.

THR-1448 (last activity 2026-09-19T15:45Z) and THR-1479 (2026-09-19T07:18Z) read ~1.1d and ~1.4d to the classifier and 9d/8d in truth — run a's self-referential-clock finding, not re-counted here. Both sit far inside the 7-day threshold either way, so the classification is unaffected by it this run.

**THR-1348 remains the queued next stage** the moment either In Design item leaves the column — THR-790's 2026-09-11 comment (Christian: *"you are approved to unblock everything here"*) hands the freed slot to it explicitly. Carried forward from run e so the instruction does not have to be re-derived from a comment five screens deep.

Practical cost this run: **nil**. A third staged item would produce a third unanswered design ask, not a third design.

## T3 — architecture health

**Detector sweep not due** — the daily pass ran at run a (~10:30Z, all four detectors). Not re-run, and none of its results are restated. `__DEBUG.validateTraitRefs()` is browser-only, **was not run, and is not reported clean.**

**Redundancy: not assessed this sweep.**

**Stalled work:** none. Both of today's issues went `Ready for Dev → In Dev → Done` on a single claim each.

**In Design: 2 live, 0 excluded** (THR-1448 unassigned 1.1d; THR-1479 unassigned 1.4d — neither stale, both counted).

**Hand-created `In Dev` (never in `Ready for Dev`): none.** `In Dev` is empty; both of today's issues passed through `Ready for Dev` on their `stateHistory`.

Weekly test-suite health: **not due.** Today is Sunday; `ORCH_TESTHEALTH_DOW` is Monday, so the next pass is tomorrow, 2026-09-21.

### New finding (1): THR-716's scope has now shipped entirely under two siblings, and nothing will ever notice

This came out of the T1 pass, not a detector — stated plainly because a finding attributed to a sweep that did not run is the pathology this tier exists to catch.

[THR-716](https://linear.app/threadbare/issue/THR-716/actor-token-renders-literally-in-encounter-step-prose-resolve-or) (`{actor}` renders literally, `Idea`, Medium, open since 2026-07-23) has three Done-whens. Two are now demonstrably satisfied by work done under *other* ticket numbers:

| Done-when | Status | Shipped under |
|---|---|---|
| 2 — *"a regression test asserts no raw `{token}` survives `enrichProse` for the social-scene pool"* | **Satisfied** | THR-1516, merged 17:27Z today — `src/engine/__tests__/socialScenePlaceholders.test.ts`, 274 lines, new in commit `70a98569` |
| 3 — decision (alias vs migration) recorded in a commit body | **Satisfied** | THR-933 |
| 1 — no literal `{actor}`, proven on a social-scene template **and** an `encounter.*` template | **Half-verified** | THR-933 fixed it; THR-1516's own CLI evidence confirms `{actor}` resolves on `social_scene.recruitment_pitch`. **The `encounter.*` half is unverified** — I did not run it, and the new lock is scoped to the social-scene pool by name |

**Why this matters beyond one ticket.** THR-716 was the *origin* of both siblings — THR-1516's body says so outright (*"its unshipped regression-lock half is carried here"*) — and neither closed it, because neither could: a close keyword for a ticket you are not closing is forbidden, and correctly so. So the parent sits open in `Idea` with its work done, and the only two sessions that knew it were finishing it have both ended.

**Not acted on, deliberately.** This lane never closes issues, and a ticket whose scope shipped under siblings is a **park**, never a cancel — that is Christian's call or the grooming lane's, not a sequencer's. It is also in `Idea`, so it blocks nothing. What it needs is **one CLI spot-check on an `encounter.*` template**; if that renders clean, THR-716 is complete and should be parked with the two sibling ids as its evidence. Recorded here so the next reader inherits the evidence instead of re-deriving it in fifty days, which is how long the last half of this ticket sat unnoticed.

## Escalations

**None opened, nothing parked.** Both of today's blockages resolved themselves within the hour and were technical verdicts with known fixes — Discord would have added nothing.

The two standing asks are Christian's to schedule and are carried in the briefing section above. This is the sixth run today to carry them and the first that can say the board is empty behind them; that change is why this report exists rather than being skipped as a no-op. **It will not be repeated as news again today** — a seventh identical ping would be the noise this lane's reporting rules exist to prevent.
