---
lane: tb-orchestrator
run: 2026-08-26j
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-26 (run j, ~14:30Z)

## Needs Christian

**The builder has stopped. Not "will stop" — has.**

At 13:47 the last thing on the shelf
([the ambition-edge bug](https://linear.app/threadbare/issue/THR-1285/some-pursues-edges-point-at-ambition-nodes-with-no-templateid))
finished and [merged](https://github.com/christianspliid-ui/threadbare/pull/1650). Nothing was
behind it. Every hour, on the hour, a build session wakes up, looks for work, and finds an empty
list. The last run said this would happen when that ticket landed; it landed, and this is the run
that records it as fact rather than forecast.

Three things are waiting on you, and the first one alone would restart it.

**1 — Approve the camp seven.** One word puts seven encounters of work on the shelf immediately,
and it is still the only thing that can do so today.
[Read the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) ·
[the ticket](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine).
Three ways to close it, unchanged: *"batch 2, seven is fine"*, *"keep it six"*, or *"same rule —
judge batch 2 on one first"*. Fifth day. `shrine_offering` is encounter #1 of
[the play session you asked for](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with),
which cannot invite you while that encounter is below standard.

**2 — The design slot has been held seven days, and it is the second-order cause of the stop.**
[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)
has sat untouched since 19 August. The machinery that turns waiting ideas into buildable tickets
tried to run again this hour and could not, because that one slot is full. Behind it, three agreed
candidates ready to go, strongest first:
[the shared anchor machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)
(keystone of the typed-game-state program — it unblocks two more design tickets on its own),
[beasts as real scene actors](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor),
and [control upkeep](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets)
(right now a grip on anything you hold decays on a fixed timer no matter what you do, because
nothing can renew it). Either sit the card-grammar session, or say "park it" and the next one
goes through.

**3 — Your maps: ten questions left, and no agent can answer any of them.** Every survey and
inventory on all four maps is finished — I checked, and there is not one research or fact-finding
ticket left open anywhere. What remains is entirely yours.

* [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — **seven**, and the two that open the other five are
  [how a fight against a monster runs](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton)
  and [how a fight between two people runs](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs).
  The other five are open now too:
  [what losing looks like when it isn't death](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum),
  [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands),
  [what counts as a monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster),
  [what starts a fight nobody wrote](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over),
  and [whether a whole company can fight together](https://linear.app/threadbare/issue/THR-1271/companies-in-fights).
  On that last one the research has changed the question in your favour: companies **are** live —
  13–16 form by tick 120 across seeds — so the fallback answer of "1-v-1 only, revisit when
  companies exist" is off the table and the choice is a real one.
* [Proactive Agent Actions](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map) — **two**:
  [who wants revenge after a project is destroyed](https://linear.app/threadbare/issue/THR-1282/the-reactive-loop-how-outcomes-mint-new-drives)
  and [a mock of an agent's arc on screen](https://linear.app/threadbare/issue/THR-1279/mock-following-an-agents-arc-the-project-moments-surface).
  You cleared the two hardest on this map yesterday afternoon.
* [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) and
  [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) — **one each**, and both are
  [thirty generated items](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to) /
  [twenty generated spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to)
  for you to react to. **Worth knowing: these two are half-and-half.** Making the sketches is agent
  work; reacting to them is yours. Nobody has made them, so both maps are stalled on a step that
  does not actually need you. Say the word in an attended session and the sketches get generated
  for you to look at — that is the cheapest map progress available right now.

## T1 — unblock sweep

Scanned **40** `Todo` issues against a `Ready for Dev` shelf of **0**. **Promoted 0. Filed 0.**

**The material change since [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-26i.md):
the executor went idle.** Run i measured the shelf at 0 with THR-1285 still in flight, and called
the stop a forecast. `THR-1285.stateHistory` now reads `Ready for Dev` (09:26:22Z) → `In Dev`
(13:02:02Z) → `Done` (**13:47:55Z**), merged as PR #1650. `In Dev` fell 4 → 3 and the remaining
three are all `Parked` (THR-1130, THR-1133, THR-1168), so there is no live claim anywhere on the
board. Clean completion, not a stall or a bounce — the mechanism is healthy throughput with no
input.

**The candidate set is unchanged at 40.** No issue entered or left `Todo` since run i; the only
board movement in the hour was THR-1285 completing out of `In Dev`.

**Nothing was promotable, and the reason is uniform rather than incidental.** Every one of the 40
falls into exactly one of four buckets, and none of the four is a promotion:

| Bucket | Count | Why not promoted |
|---|---|---|
| Wayfinder decision tickets | 18 | `wayfinder:*` — decisions, never executor work. T1.5's input by construction |
| Needs a design decision first | 9 | Wrong destination — met blockers do not make these dev-ready, they make them T2's |
| Gated on Christian | 4 | THR-1222 (approval), THR-1220 (he plays it), THR-1043 + THR-791 (assigned to him) |
| Unmet blocker or time gate | 3 | Named below with evidence |
| Program epics / parked direction | 6 | THR-1156, THR-789, THR-870 and children — decomposition or direction, not pickup |

**Declines carrying a named blocker, each re-checked against this run's scan:**

* `skip THR-1024` ([DetailModal forks its own overlay](https://linear.app/threadbare/issue/THR-1024/detailmodal-forks-its-own-overlay-instead-of-composing-modal-no)) —
  **unmet blocker.** Prose gate in its own text: *"Sequencing — do not start this before
  THR-966."* [THR-966](https://linear.app/threadbare/issue/THR-966/detail-page-tts-is-unreachable-the-detailmodaldetailpage-cluster-is)
  is `Idea`, not `Done`, and is itself a mount-vs-prune decision. If that cluster is pruned this
  ticket dies with it, so promoting now risks buying work that gets deleted.
* `skip THR-1255` ([tighten `NUDGE_NAME_MAX_WORDS` 6 → 4](https://linear.app/threadbare/issue/THR-1255/tighten-nudge-name-max-words-6-4-once-the-corpus-can-meet-it)) —
  **unmet blocker.** Native Linear relation: blocked by THR-1222, which is `Todo` pending
  Christian's approval. Gated on the same word as the camp seven.
* `skip THR-1256` ([flip `check:guidance-freshness` to blocking](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn)) —
  **unmet time gate.** Its own text sets the review date at **2026-09-08**; today is 2026-08-26,
  so the window opens in 13 days. The gate shipped this morning with THR-1253 and run b's T3
  confirmed it running in `mode=advisory` — the burn-in is genuinely mid-flight, not forgotten.

**Two wrong-destination declines re-derived in full rather than carried,** because on an idle shelf
these are the two that most look like ordinary executor work and most deserve a fresh look:

* `skip THR-1114` ([two templates carry a `sphereAffinity` that is not a Sphere](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere)) —
  its third Done-when (a corpus-wide invariant test) *is* executor-sized, but it cannot ship alone:
  the test fails against the current corpus until the two offenders are re-aligned, and choosing
  which of the twelve Spheres each becomes is a cosmology call read by prerequisites and scoring,
  not only the Codex. Not splittable as filed. `blockedBy` empty — mis-destined, not blocked.
* `skip THR-1189` ([`taxRate` is stamped and read by nothing](https://linear.app/threadbare/issue/THR-1189/taxrate-is-stamped-on-trades-with-routes-and-read-by-nothing-the-toll)) —
  its Done-when offers an executor-sized branch (retire the field and its player-facing
  description), but choosing *retire* over *wire* is a game-design call about whether this world
  levies tolls at all. Same shape: unblocked, mis-destined.

Two further design-first declines, both filed within the last day and both correctly routed by
their authors rather than by me: `skip THR-1287` (*"Design decision recorded first — this is a
rules-of-play question, not a defect with one right answer"*) and `skip THR-1274` (*"This is a
design ticket, not a patch"*). Both are named in § Needs Christian as staging candidates.

**Promotion ceiling: not reached** — nothing was eligible, so neither `ORCH_PROMOTE_BATCH_MAX` (5)
nor the backed-up-shelf throttle bound anything this run. Plan-doc liveness: not exercised, since
no candidate reached the promotion step.

**Rule-0 / process-vs-product ratio.** Zero process tickets promoted, zero filed — this lane files
none by standing rule. The product/process question does not arise this hour because nothing was
promoted at all. The headline finding is the one the throttle rule names for exactly this case:
**shelf empty, feature pipeline needs design/Christian**, not another process promotion.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 10, all HITL. AFK tickets resolved: 0 — because there are none left
anywhere.**

This is the run's cleanest structural fact, and it is new enough to state plainly: I queried
`wayfinder:research` and `wayfinder:task` across the whole team without a state filter. **Every
single one is `Done`** — 18 research tickets and 3 task tickets, spanning all four open maps and
the two closed ones. The AFK half of the wayfinder machine has run to completion. There is nothing
left for this tier to burn down, this hour or any hour, until a map grows a new research child.

| Map | Frontier | Composition |
|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | **7** of 10 open children | THR-1263, THR-1264, THR-1266, THR-1267, THR-1268, THR-1270, THR-1271 |
| [Proactive Agent Actions](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map) | **2** of 2 | THR-1279, THR-1282 |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | **1** of 1 | THR-1236 |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 0 (1 open child) | THR-1232 — off-frontier: carries an assignee (Christian) |

Frontier computed per the skill: open children minus any with an assignee, minus any with an open
native blocking relation, read via `get_issue(includeRelations:true)` per candidate rather than
inferred. The three Physical Conflict children held off-frontier are THR-1265, THR-1269 and
THR-1272, each blocked by THR-1263 and/or THR-1264 — which is why those two are named in
§ Needs Christian as the ones that open the rest. Every blocker that resolved to `Done` on the
frontier tickets is a research ticket completed today or yesterday (THR-1259, THR-1261, THR-1262,
THR-1277).

**Nothing touched.** No claim, no comment, no state change on any wayfinder issue this run — the
tier had no eligible work, and `wayfinder:grilling` / `wayfinder:prototype` are never this lane's
to resolve.

## T2 — design staging

**Trigger fired. Bound blocked it. Nothing staged.**

* **Trigger:** non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR`
  of 2. Fired, and by the widest margin the constant allows.
* **Bound:** `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` of 1. Already over. No staging
  was permissible.

The two occupants, and both are stale past the 48h re-surface threshold by a wide margin:

* [THR-1002 — unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card),
  `In Design` since **2026-08-19**, unassigned. **7 days, 12 hours.** This is the slot the previous
  four runs have named.
* [THR-790 — traits wave 2](https://linear.app/threadbare/issue/THR-790), `In Design` since
  **2026-08-15**, assigned to Christian. **11 days.** Runs f–i counted the staging slot as held by
  THR-1002 alone; on a literal reading of the constant the bound is doubly exceeded. Recorded as a
  fact rather than a complaint — THR-790 is Christian's own design work, not lane-staged, and
  whether it should count against a lane bound is a question for the constant, not for this run.

**Re-surfaced, not re-staged** (skill: an item unpicked after 48h is re-surfaced). The three
candidates that would be staged the moment a slot frees, in order:
[THR-1212](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)
— strongest by a clear margin: High priority, zero blockers, its wayfinder map (THR-1157) closed
with Decisions-so-far settled, Step-0 loads already enumerated in the ticket, and it blocks
THR-1213 so staging it unjams two designs rather than one. Then
[THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor),
then [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets).
All three are agreed under D2 — two are bugs, one is the keystone of a director-ratified program
epic — so none of this is direction-setting.

**This lane stages; it does not author.** Per Christian's 2026-08-06 ruling, `tb-orchestrator` runs
Sonnet deliberately and plan-doc authoring is attended Opus work. Even with a free slot, the output
would be a design-request comment plus a `design session wanted` line — never the plan doc itself.

## T3 — architecture health

**Skipped — already discharged today.** Run b owned the daily sweep at 06:27 local (past
`ORCH_HEALTH_SWEEP_HOUR` of 6) and invoked all four detectors; this run fired at 16:30 local,
eighth past the gate. Results stand at
[`orchestrator-2026-08-26b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-26b.md)
§ T3 and are deliberately not restated.

**Nothing in this section is a clean result.** No detector was invoked this sweep:
`generate-interface-map:dry`, `sweep:rank-reach`, `check:process` and `check:canon-staleness` were
**not run**. **Redundancy: not assessed this sweep** — that is the judgement half, and it did not
happen. `__DEBUG.validateTraitRefs()` is browser-only and cannot run from a headless scheduled
context — not run, and not reported as clean.

**Stalled work: no dedicated sweep, but T1's scan reached the facts.** `In Dev` holds **3**, all
`Parked`, all unassigned — THR-1130, THR-1133, THR-1168, unchanged in membership since run b.
`ORCH_STALLED_PICKUP_THRESHOLD` is 3 repeated `Ready for Dev → In Dev` transitions without a
`Done`; nothing on the board approaches it. The one issue that moved through `In Dev` this hour
(THR-1285) did so exactly once and completed. **No stall. The idleness is starvation, not
blockage** — and those two conditions want opposite remedies, which is why the distinction is
stated rather than left implied.

**Weekly test-suite health does not apply** — `ORCH_TESTHEALTH_DOW` is Monday (1); today is
**Wednesday**. Monday's result stands unchanged at
[`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md)
and is deliberately not restated.

## Escalations

**None asked, nothing parked, no Discord post made — and the call was re-taken on this run's own
evidence, not carried from run i.**

Runs g, h and i each staged a condition for escalating and each declined on the same finding: the
escalation channel is `keep-work-flowing-cc`'s doorbell, not this lane's private line, and it
already carries these exact asks six times in 48 hours. That reasoning still holds, and this run
adds a fact that strengthens rather than weakens it: **the briefing lane's next fire is at :45,
fifteen minutes out, and § Needs Christian above is its input.** The single new fact this run
carries — that the builder has now actually stopped — reaches him through the channel that owns
the framing, in that lane's voice, within the quarter hour. A second voice would add a channel,
not an ask, and would risk contradicting the briefing lane on identical facts.

**The strict skill trigger — *agreed work exhausted* — has still not fired,** and it is worth being
precise about why, because the surface reading says otherwise. Agreed work is not exhausted:
THR-1212, THR-1274 and THR-1287 are all agreed and all ready to stage. The binding constraint is
`ORCH_MAX_IN_DESIGN` against a slot idle for seven and a half days. That is a **deadlock to report,
not a question to ask** — and § Needs Christian already puts it to him as two options, either of
which he can close in one sentence. Asking him what to do about it would be asking a question the
report already answers.

**One judgement recorded so a later reader can weigh it.** I considered whether the builder going
genuinely idle changes the escalation calculus, since that is the concrete harm the previous three
runs were forecasting. It does not, for a reason specific to today: Christian was working the board
directly this afternoon — two map tickets closed at 13:10 and 13:14, and THR-1285 merged at 13:47.
He is present and active. Nothing here needs to shout to reach him.
