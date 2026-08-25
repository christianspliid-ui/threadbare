---
lane: tb-orchestrator
run: 2026-08-25d
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-25 (run d, ~06:26Z)

## Needs Christian

**The one ask is unchanged and is not re-argued here:** [batch 2, the camp seven](https://linear.app/threadbare/issue/THR-1222). *"Batch 2, seven is fine"* runs it; *"keep it six"* splits it 6+1. It has been waiting ~10½ hours and the build has been stopped for four.

**What is new is why nothing else can substitute for it.** Earlier runs said the shelf was empty and left open whether there was buildable work further down the backlog that we simply had not looked at. This run looked properly, and there is not — but the reason is worth a minute of yours, because it is fixable and some of it is fixable cheaply.

**Every buildable thing left is waiting on a decision, not on work.** Four candidates were opened and read in full. All four say, in their own text, that the next step is a call somebody has to make — and three of the four are calls only you can make, because they change what the player sees. None of them is a big sitting. In plain terms:

- **[Where does a run's story come from?](https://linear.app/threadbare/issue/THR-1198)** Forty-eight lines of written campaign prose exist and no game ever reaches them, because the code decides a run's purpose from *what your god remembers*, while the writing assumes *a named campaign the world offers you*. Both are coherent games. Only one is the one you want. Whichever you say, the other half gets cleaned up.
- **[Three pairs of factions fly identical banners.](https://linear.app/threadbare/issue/THR-854)** The Underking's Court currently reads as the Thieves Guild, and the Lorekeepers as the Adventuring Guild — an alliance the world never claims. The fix is easy; what is *not* decided is what should tell two similar factions apart on a shield. That is a look-and-feel call.
- **[Keep or cut the old choice plumbing.](https://linear.app/threadbare/issue/THR-964)** An earlier way of making encounter choices is still wired into the engine and has never once run — the nudge system replaced it. Cutting it is tidy-up. Keeping it means finishing it. It is genuinely one or the other and nobody has said which.
- **[Five opening-scene pictures need remaking.](https://linear.app/threadbare/issue/THR-876)** They were pulled for breaking your own art rules (painted-in buttons, captions, individual faces). Remaking them spends image credits, which is why it stopped and waited for you. This is the cheapest yes on the list.

You do not need to answer any of these to unstick today — batch 2 does that alone. They are here because "the shelf is empty" now has a specific cause, and this is it.

**Still standing, unchanged, no reply needed:**

- **Four things want a design sitting with you**, not a queue slot: [card grammar](https://linear.app/threadbare/issue/THR-1002) (6 days), [traits wave 2](https://linear.app/threadbare/issue/THR-790) (10 days), and the two wave-1 documents you chartered ([A](https://linear.app/threadbare/issue/THR-1212), [B](https://linear.app/threadbare/issue/THR-1213)).
- **The two new encounters are still worth two minutes** — [The Unclaimed Relic](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.the_unclaimed_relic) and [One Body Short](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.border.one_body_short).

## T1 — unblock sweep

Scanned `Ready for Dev` (**0**), `Todo` (**18**), `In Dev` (**4**, all four `Parked`), `In Design` (**2**), `Idea` (**60+**, paginated — assessment below is a targeted read, not a sweep).

**Promoted — 0. Filed — 0. No state write of any kind was made by this lane this run.**

**Board movement since run c (05:26Z): none.** `list_issues(team:"Threadbare", updatedAt:"-PT75M")` returned exactly one issue — [THR-1088](https://linear.app/threadbare/issue/THR-1088), and that is this lane's own 05:31Z comment from run c. No state change, no filing, no third-party comment, no relation edit anywhere on the board. `Todo` is the same 18-item set; [THR-1222](https://linear.app/threadbare/issue/THR-1222) still carries one comment, the 2026-08-24T19:24:54Z coordination block, with no approval recorded.

The 18 `Todo` declines are unchanged from [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-25.md); that evidence table stands and is not restated. Executor has had nothing to claim since 2026-08-25T02:31:40Z — **~3h 55m** at this run's start. Promotion ceiling never engaged.

### New finding — the `Idea` backlog is a decision queue, not a work queue, so no scan change can refill the shelf

[Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-25c.md) extended the scan to `Idea` — the state T1's candidate rule names and its scan spec omits — assessed two items, and correctly declined to generalise from them: *"this is a spot-check, not a sweep, and nothing below should be read as coverage."* That left the open question this run set out to close: **is the exhaustion verdict an artifact of an incomplete scan?**

It is not, and the reason is structural rather than a matter of coverage. Four product-shaped `Idea` candidates were selected — the ones whose subject is player-visible content or engine behaviour rather than tooling — and each was opened and read in full. **All four are gated on a recorded decision, stated in the ticket's own Done-when by the author, deliberately:**

| Issue | Gate, quoted from the ticket | Class |
|---|---|---|
| [THR-1198](https://linear.app/threadbare/issue/THR-1198) | *"Christian rules which of the two paths (or both) the spine takes"* — Done-when #1 | Creative fork: remembrance-derived vs template-picked mandate |
| [THR-964](https://linear.app/threadbare/issue/THR-964) | *"A decision is recorded: wire the producer, or retire the pipeline"* — Done-when #1. *"Do not tune the constants before this is decided"* | Wire-vs-retire; the wire half changes player-facing behaviour |
| [THR-854](https://linear.app/threadbare/issue/THR-854) | *"the fix is a design question, not a mechanical one — what* should *distinguish two factions with the same reach profile and type?... picking one by improvisation inside an art batch would have been the wrong call"* | Heraldic vocabulary — a look-and-feel call |
| [THR-876](https://linear.app/threadbare/issue/THR-876) | *"this ticket spends image-generation credits (5 images, plus retries). Worth confirming with Christian before running the batch"* | Cost confirmation (cheapest of the four) |

**Why this closes the question rather than extending the spot-check.** T1 is a *blocker-clearing* tier: it reads the `Blocked by` half of a coordination block and promotes when the named blockers reach `Done`. None of these four is blocked. They are **undecided** — a different failure mode, and one no promotion mechanism reaches, because there is no state transition anywhere on the board that would ever make them ready. Widening the scan, adding `Idea` to the scan spec, or raising the promotion ceiling would each return the same four tickets and the same four gates. **The shelf is not under-scanned; it is under-decided.** That is the finding, and it is a mechanism, not a fifth restatement of "nothing moved".

Two honest limits on it. First, this is four candidates selected by judgement out of 60+, not a census — the claim is about the *shape* of what product work in `Idea` looks like, and four for four is a pattern rather than a proof. Second, the remaining `Idea` mass is overwhelmingly `Deferral`/`Low` tooling and `drift-scan`/`No priority` rows, which CLAUDE.md § Prioritization bars this lane from promoting to manufacture depth regardless of what a fuller read would find — *"a starved shelf is not a licence to binge... the fix for an empty shelf is upstream supply, never downstream tidying."*

**Nothing was filed for this.** The process-work throttle bars scheduled lanes from filing infrastructure tickets, and no above-bar loss is demonstrated — the four gates are working as designed, not failing. Recorded here so the weekly retro has the instance.

**Headline, as the starved-shelf rule requires it be stated: shelf empty — the feature pipeline needs Christian.** Not a design session, in this case: four specific decisions, listed above in plain language.

### Still open from run c, unchanged

[THR-1088](https://linear.app/threadbare/issue/THR-1088) is verified resolved (by THR-1121, 2026-08-15) with the evidence posted to the ticket, and still needs **one state write to `Done`** from a lane permitted to make it. This lane's `Done` carve-out is `wayfinder:*` only and THR-1088 carries no wayfinder label, so it cannot close it. It sits in `Idea`, which the executor does not read — so the routing has no consumer and will not self-resolve. Re-stated, not re-derived.

## T1.5 — wayfinder sweep

**No open maps.** `list_issues(label:"wayfinder:map", state:"Todo")` returned zero — both maps closed 2026-08-24. Tier skipped; nothing claimed, nothing resolved, nothing surfaced. Chartering a new map is Christian's to start.

## T2 — design staging

**Triggered but bound-blocked — no staging, unchanged from runs a, b and c.**

- **Trigger:** 0 non-`Deferral` items in `Ready for Dev`, below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **2** against `ORCH_MAX_IN_DESIGN` (1) — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (`startedAt` 2026-08-19, 6 days) and [THR-790](https://linear.app/threadbare/issue/THR-790) (`startedAt` 2026-08-15, 10 days). Both far past 48h, so per the skill they are **re-surfaced, not re-staged** — done above.

Staging a third would not refill the shelf regardless: staging moves a ticket to `In Design` and asks for an attended session, and four already await one. Top candidate when a slot frees remains [THR-1134](https://linear.app/threadbare/issue/THR-1134).

## T3 — architecture health

**Not due — no detectors ran this run, and none are reported as clean.**

- The daily sweep already ran today, at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-25b.md) (04:26Z, first run past `ORCH_HEALTH_SWEEP_HOUR`). Its four detector results and two findings stand; re-running them two hours later on an unchanged tree would produce identical output and train the reader to skip the tier.
- Weekly test-suite health: today is **Tuesday**; `ORCH_TESTHEALTH_DOW` is Monday. Not due, and deliberately not reported from Monday's stale result.
- Redundancy judgement pass: **not assessed this run.**

The `Idea` finding above sits in T1 rather than here because it is a board and promotion-mechanism result, not an architecture-detector result — the two must not be conflated.

## Escalations

**Nothing posted to Discord this run.** `fetch_messages` on the escalation channel confirms the last message is this lane's own 2026-08-25T01:58Z post; **the last reply from Christian is 2026-08-24T16:08Z** (*"Go agenda" / "Ahead"*, approving the border-perils batch). The batch-2 ask has been live ~10½ hours unanswered.

The escalation trigger — agreed work exhausted — is met and has been for four runs. It was **not** re-fired: a fourth message into an unanswered thread competes with the briefing that already carries the same ask, and `keep-work-flowing-cc` owns the doorbell. The four decisions surfaced under `## Needs Christian` this run go the same way — into the briefing, not into a new Discord ping.

One item parked: **THR-1222's approval**. The next run re-checks the channel and the ticket's comments rather than re-asking.

One item routed, not parked, and still without a consumer: **THR-1088 needs closing** by a lane permitted to write `Done`.

No detector failed, no tool errored, and no gate was skipped for a reason other than its own schedule.
