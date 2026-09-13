---
lane: tb-orchestrator
run: 2026-09-13k
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-13 (run k, ~17:31Z)

## Needs Christian

**One ask, and it is the first time this week it has been a real one: the build queue has run down to a single piece of programme work, and the two design questions that would refill it have been waiting unstarted for two and three days.**

The queue is not empty — twelve items sit on it — but eleven of those are small repairs filed by builders as they finished other things. Genuine *programme* work, the kind that moves a system forward rather than patching one, is down to one item. That number was three two hours ago; two of the three shipped this afternoon, and nothing replaced them, because the things that would replace them are stuck one step earlier.

Two designs are staged and waiting for a session. Neither needs a decision from you in the sense of a fork — the direction on both is already yours, on the record. They need someone to sit down and write the plan:

- **[A held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)** — when a faction holds a town, that should open up that faction's encounters there and steer what its people choose to work on. This is the second half of your own sentence from 2026-09-10: *"it is a commitment and probably also a faction position?. it could open up specific encounters within that factions and influence what undertakings are prioritized."* The first half shipped three days ago. **This one has been staged and waiting for 59 hours**, which is past the point where this lane is supposed to stop quietly re-counting it and put it in front of you.
- **[A mortal keeps or misses a meeting](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by)** — the appointment primitive, your direction from 2026-09-12. Waiting since yesterday evening.

**The ask: open a chat session and say "design THR-1448".** It is the older of the two and the one whose direction is most fully settled. The second can follow. If you would rather they waited, saying so is also an answer — the point of surfacing it is that nothing else will start them, and this lane is barred from writing plans itself.

Nothing else on your list changed. What moved: **three location conditions were found that show the player a state the game never acts on, and the fix is now queued.** A place can be marked *under watch* or *tended shrine*, the words appear on screen, and nothing anywhere reads them — so a watched place is not actually watched. That is the thing you ruled against yesterday when you said a chip may not promise what the engine cannot enact; this is the sweep that found where it was still happening.

## T1 — unblock sweep

Shelf at scan: **11** in `Ready for Dev`, **1** of them non-`Deferral`. Well below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available; **1 was spent**, leaving the shelf at 12.

**The shelf's composition changed underneath a flat total, and that is what fires T2 below.** Since [run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13j.md) at 15:30Z the count has stayed at 11 while three items left and three arrived — and the two sets do not have the same shape:

| left the shelf | | arrived on the shelf | |
| -- | -- | -- | -- |
| [THR-1482](https://linear.app/threadbare/issue/THR-1482) one card, one router | 15:39Z, **non-`Deferral`** | [THR-1508](https://linear.app/threadbare/issue/THR-1508) FactionSheet network diagram | 16:10Z, `Deferral` |
| [THR-1495](https://linear.app/threadbare/issue/THR-1495) six content kinds, no codex category | 15:39Z, `Deferral` | [THR-1509](https://linear.app/threadbare/issue/THR-1509) authored-band coverage per variant | 17:16Z, `Deferral` |
| [THR-1460](https://linear.app/threadbare/issue/THR-1460) FactionSheet duplicate key | 16:32Z, **non-`Deferral`** | [THR-1505](https://linear.app/threadbare/issue/THR-1505) 24 endings tell one fact twice | 17:21Z, `Deferral` |

Two of the three departures were the non-`Deferral` ones and all three arrivals are `Deferral`s, so the programme count fell **3 → 1** while the headline total did not move. Reconciles to the item; nothing is unaccounted for. Worth stating plainly because a lane watching only shelf depth would have seen a flat, healthy 11 and missed it entirely — which is the exact measurement error `ORCH_PROGRAM_WORK_FLOOR` was written to catch.

### The `Todo` slice: 28 candidates, 0 promotions

Fifteen carry a `wayfinder:*` label (skipped unconditionally to T1.5), one is assigned ([THR-791](https://linear.app/threadbare/issue/THR-791)), one is a programme epic that is a container rather than work ([THR-789](https://linear.app/threadbare/issue/THR-789)). Ten are the **same ten destination declines [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13h.md) tabulated with the declining sentence quoted from each** — THR-1503, THR-1501, THR-1348, THR-1274, THR-1393, THR-790, THR-1381, THR-1218, THR-175, THR-1220.

**One of the ten was re-read live rather than inherited, chosen because today's closes made it the likeliest to have changed.** Three issues went `Done` at 15:39Z, and if any Todo candidate's gate had just cleared it would most plausibly be [THR-1393](https://linear.app/threadbare/issue/THR-1393) (the `intelligence` object type), which sits downstream of the undertakings programme. It has not changed: native `blockedBy` still empty, and its declining sentence stands verbatim — *"a design decision, not an executor's call"* — reinforced by the load-bearing rule that gates new graph shapes behind full design. Since all ten decline on **destination** rather than on a blocker, a blocker clearing cannot convert any of them; that is the structural reason the table did not need re-deriving in full.

The twenty-eighth is **[THR-870](https://linear.app/threadbare/issue/THR-870)** (sphere-governance pivot), which the last two runs' arithmetic did not name. Declining it is unambiguous and it is recorded here so a future run does not have to look again: its own description reads *"Blocked by nothing mechanically; **parked by creative-director sequencing**"*, and it activates *"only when Christian moves the Sphere-Governed Ascendant project out of Idea"* — his verdict of 2026-07-30. A direction park is the one decline this lane may never reverse on its own judgement.

### The `Idea` slice — where the promotion came from

**Promoted — 1.**

- **[THR-1483](https://linear.app/threadbare/issue/THR-1483/three-location-conditions-have-no-live-mechanical-effect-under-watch)** (Low, `Deferral`/`Content`/`Engine`, *Encounter Experience*) — three location conditions carry a state nothing reads. `under_watch` and `tended_shrine` are written by encounters and named as chip nouns with **no engine reader anywhere**; `standing_welcome` was retired to read-tolerance by THR-1206 and has had zero writers for three weeks.

  **Blocked by: nothing** — native `blockedBy` empty, no prose gate, no time gate. Its three `relatedTo` links are provenance, not dependencies. It names no plan doc, so the THR-921 liveness gate passes trivially. Its latest comment (the THR-836 filing block) carries no retire verdict, so the THR-990 gate passes.

  **Claims re-verified on `origin/main` before the write, not taken on the ticket's word.** `CONDITION_IDS_WITHOUT_EFFECT` is at `src/data/condition-trait-content.ts:560` holding exactly the three ids named; `src/engine/__tests__/conditionEffectLine.test.ts` exists, so the both-directions gate the Done-when leans on is real.

  **One verification nearly went the other way, and the trap is worth recording.** A grep for `standing_welcome` returns **14 hits in `src/data/encounters/vertical-slice.ts`**, which reads as a flat contradiction of the ticket's zero-writers claim. Every one of them is either a comment or a **change id** — `slice.kin.a_standing_welcome`, `…_well`, `…_dearly` — that merely shares the word; the trait id itself has no writer, and that file's own comment at :4504 says so. This is the recurring-change-id shape that has bitten this repo before, and an executor who greps the bare word will reach the opposite conclusion in about ten seconds, so it is called out explicitly in the coordination block.

  **Why this is a promotion and not an eleventh destination decline — the judgement call of the run.** The filing block contains the sentence *"the work is a design call per condition"*, which is as close to a self-routing to T2 as a ticket gets. It was promoted anyway, on three grounds. First, that sentence sits under **`Suggested model:`**, whose job is calibrating model choice for a judgement-heavy edit, not choosing a queue. Second, the ticket contains none of the *"this is not the executor's to settle"* sentences that decline all ten of the `Todo` items — it contains the opposite, an instruction on how to close it (*"The closing diff must cite a new engine reader by file and line, or delete the condition"*) and a warning about the one wrong way (*"Do not close this by authoring a sentence"*). Third, the *that* is already settled by a director ruling the ticket itself quotes — a chip may not promise what the engine cannot enact, 2026-09-12 — leaving only the *how*, which is the executor's under `Docs/canon/process.md` § User review interface rule 4. The three arms are also not equally open: `standing_welcome` is pure retirement with zero judgement, `tended_shrine` needs a duration row either way, and only `under_watch` involves a choice, between two shapes the ticket names.

  Recorded at this length because it could have gone the other way. **The escape hatch is written into the coordination block:** if `under_watch`'s reader turns out to need a new scoring term or graph shape, that arm has left the *how* and become design — bounce that arm to T2 and close the other two, rather than attempt a heroic PR.

  Coordination block posted at promotion with the three required lines. This one mattered more than usual: the ticket's *latest* comment was already a valid THR-836 block, and `pull-work` Step 3 validates the latest comment — so a promotion comment omitting the three lines would have **broken** a gate that was passing. **`Mutex with`: nothing live on `src/data/condition-trait-content.ts`** (the filing block asked for that check at claim time; it is now done — neither `In Dev` issue touches it), plus one conditional mutex against [THR-1468](https://linear.app/threadbare/issue/THR-1468) stated with its reason and its reversal condition, since that ticket is live in `vertical-slice.ts` where the `standing_welcome` arm may want comment edits. **Evidence shape: engine/content, so CLI or headless** — the edits land in `src/data/` and `src/engine/` and touch nothing under `src/components/`, so the browser-verify gate does not fire.

**Rule-0 discipline.** Product work, not process — three conditions show the player a state the game never enacts — so the materiality bar did not need applying and no process ticket was filed. **Week's product-vs-process ratio: strongly product.** Today's closes (THR-1482, THR-1495, THR-1460, THR-1455, THR-1462, THR-1026, THR-1156) are programme slices and player-facing repairs, with one process item among them (THR-1471). The process-ticket budget of at most one per three runs remains untouched.

### Held by the ceiling — 0

Fifteenth consecutive run with zero held, from real headroom (shelf 11 against a threshold of 15) rather than a throttle.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets anywhere — re-proved this run, not inherited.** Both AFK labels were queried workspace-wide rather than inferred from the `Todo` column:

- `label:"wayfinder:research"` → **21 issues, all 21 `Done`.**
- `label:"wayfinder:task"` → **5 issues, all 5 `Done`.**

So `ORCH_WAYFINDER_AFK_MAX` (2) went unspent for the **"AFK work is finished"** cause, not the "found nothing I could do" cause. Re-run rather than carried, because it is the claim the whole tier turns on.

The twelve open children of [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) and [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) all carry `wayfinder:grilling` or `wayfinder:prototype` — HITL by construction, which this lane must not touch. Unchanged set, every child last touched 2026-08-26 or earlier; not re-enumerated, and deliberately **not** raised under `## Needs Christian` this run. They are already on his list via the briefing, and adding twelve standing items beside a live one-ask would bury it.

## T2 — design authoring

**Triggered for the first time since staging began — and barred.** Both halves matter, so both are stated.

**The trigger fired.** `Ready for Dev` holds **1** non-`Deferral` item ([THR-1470](https://linear.app/threadbare/issue/THR-1470)) against `ORCH_PROGRAM_WORK_FLOOR` of 2. Run j read the same column two hours ago and recorded *"Not triggered… 3 non-`Deferral` items"*; the T1 table above accounts for the drop to the item. This is a real state change, not a re-reading of the same board. The promotion this run does not lift it — THR-1483 is `Deferral`-labelled, so it deepens the shelf without touching the programme figure.

**The bound bars it.** `In Design` holds **2 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1:

- [THR-1479](https://linear.app/threadbare/issue/THR-1479) — appointment primitive. Unassigned, last touched 2026-09-12T22:26Z (≈19h). Inside `ORCH_IN_DESIGN_STALE_DAYS` (7), no `Parked` label → **counts**.
- [THR-1448](https://linear.app/threadbare/issue/THR-1448) — a held town is a faction position. Unassigned, last touched 2026-09-12T07:23Z (≈34h). Inside the window, no `Parked` label → **counts**.

**No state was mutated.** The predicate is warn-only and the exits (`Parked`, or back to `Todo`) are a human's or the grooming lane's.

**THR-1448 is past the 48-hour re-surface threshold and has been re-surfaced accordingly.** It was staged by this lane on [2026-09-11 run d](https://linear.app/threadbare/issue/THR-1448) at 06:36Z — **59 hours ago** — and the skill is explicit that an item still unpicked after 48h is *re-surfaced, not re-staged*. That is the one ask at the top of this report, and it is the first time that clause has fired. No second staging comment was posted on the ticket; re-staging an already-staged item would add noise to the ticket without adding information.

**The standing tension is now load-bearing rather than theoretical.** For several days this lane has recorded that T2 was barred while ten `Todo` tickets each said they needed a design pass, and each time the note ended *"a weekly-retro input, not an hourly finding"* — correctly, because the build shelf still held programme work. It no longer does. The gap between "design work is queued" and "design work is happening" has now reached the thing it was always going to reach, which is the builders. Still not re-argued here, but it has stopped being a background observation.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md) executed the full sweep at 04:27Z with four detectors. The tier is once-daily; **no detector ran this hour and none is reported as clean.** The redundancy judgement pass was likewise **not performed this run** — run c's result stands, and this line exists so the gap is not mistaken for coverage. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless: not run, not reported clean. `newFindings: 0` is a consequence of the tier not running, not of a sweep that found nothing.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow, and it will be the first since the `Heavy simulation tests` lane split — worth knowing in advance that its timing section reads from the required check only, which no longer runs the 13 world-simulation files.

Two checks made outside the tier, because the queue scan surfaced them directly and both cost nothing:

- **Stalled work — none.** `In Dev` holds two issues. [THR-1468](https://linear.app/threadbare/issue/THR-1468) is assigned and demonstrably live — it filed THR-1509 and THR-1505 within the last fifteen minutes. [THR-876](https://linear.app/threadbare/issue/THR-876) has one clean `Ready for Dev` → `In Dev` transition. Neither approaches `ORCH_STALLED_PICKUP_THRESHOLD` (3).
- **Hand-created `In Dev` tickets — none.** Both `In Dev` issues have a `Ready for Dev` state in their history, so the THR-1325 class is absent.

**`In Design`: 2 live, 0 excluded** (THR-1479 unassigned ≈19h → live; THR-1448 unassigned ≈34h → live). Printed per the THR-1382 rule even though neither arm of the sweep's warning applies — both are well inside the staleness window, so this is a column that is genuinely occupied rather than one silted up with dead items, which is a materially different reading of the same "over bound" verdict.

[THR-876](https://linear.app/threadbare/issue/THR-876) remains `In Dev` and unassigned since 10:03Z, unchanged and already written up in full on the ticket at 14:33Z. **Not re-surfaced to Christian** — the briefing has carried the verdict since ~13:57Z. `stale-claim-sweep` auto-releases it around 2026-09-16 if no attended session takes it first. No state touched; the THR-1325 ruling (report, never normalise) holds.

## Escalations

**None.** No question was asked on Discord, no item parked. Agreed work was not exhausted — one promotable item existed and was promoted, so the "stop and ask" clause did not fire.

The one thing that would ordinarily be an escalation is instead the report's lead: T2 is barred by two items that only an attended session can clear, and the mechanism for that is `## Needs Christian` via the briefing, not a Discord question. Asking on Discord as well would double-deliver the same ask through two channels, which is how a one-ask briefing stops being one.
