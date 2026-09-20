---
lane: tb-orchestrator
run: 2026-09-20b
promoted: 0
filed: 1
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-20 (run b, ~13:33Z)

## Needs Christian

**Good news first: the build queue is no longer empty.** This run found a real bug in the game and put it on the shelf, so the machine has something to build while you decide the bigger things. Nothing about it needs you — it is an ordinary fix.

**What it is, in plain terms.** In conversation scenes — recruiting someone, negotiating a truce, making a confession — a line of prose is supposed to pick up a phrase coloured by the character's sphere. Instead the raw placeholder `{sphere_flavor}` is printed on screen, as literal curly braces. It reads like this today:

> *"The offer is laid out plainly: purpose, pay, and place in something larger. {sphere_flavor}."*

The phrases it was meant to print were written months ago — a whole table of them, twelve approaches × eight spheres — and nothing was ever wired up to use them. So the writing exists, it just never reaches the page. It is now [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver), and it matters for the sitting below: this is the kind of seam you should not have to look past while judging whether the encounter experience is good.

**The two asks from this morning are unchanged and still yours.**

**1. One design chat.** Start with [THR-1479, the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) — say *"design THR-1479"*. [THR-1448, a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) comes after it. Both have been waiting since 11–12 September with nothing blocking them.

**2. The encounter sitting you started on 12 September and never finished.** You gave feedback in four batches that morning; all seven tickets that came out of it were fixed the same day. The question it exists to answer — *is the integrated encounter experience at an acceptable state?* — has now been open nine days, and a "yes" is what unlocks the next large chunk of work. The five links are on [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with).

## T1 — unblock sweep

Shelf at start of run: **0** in `Ready for Dev`, **0** in `In Dev`, **0** in `Implementation Planning`. Re-queried this run, not inherited from run a. Last completion is still THR-1503 at 2026-09-19T09:12:55Z — **28.3 hours** before this run.

`Todo`: **26**, byte-identical to run a's set — every item's `updatedAt` predates run a's 10:30Z sweep, so run a's eleven declines stand on unchanged evidence and are not re-listed here (re-printing an unchanged decline table hourly is the dump this report forbids). **15 are wayfinder-labelled** and skip unconditionally to T1.5. **Promotions: 0.** Neither ceiling bound.

**This run did not stop there, because "nothing promotable in `Todo`" is not the same claim as "nothing executable exists".** The documented T1 scan queries only `Todo` and `Ready for Dev`; promotable work also sits in `Implementation Planning` (empty) and `Idea` (~50 items). The `Idea` tail has three shapes that belong to this lane, and all three were checked:

| Shape | Result |
|---|---|
| A prior run's own hold (native `blockedBy` + release condition) | None outstanding |
| Gated on a human act (`UL-proposal` above all) | **Clear** — every `UL-proposal` issue is `Done`; the class was cleared 2026-09-11 under the blanket delegation. Nothing to surface |
| A sibling already satisfied it | **One hit — and it paid.** See below |

### Filed: THR-1516 — `{sphere_flavor}` leaks raw into social-scene step prose

The shape-3 check ran against **THR-716** (`{actor}` renders literally, `Idea` since 2026-07-23). It *had* been satisfied: THR-933 shipped `{actor}` as an alias in `enrichProse` on 2026-08-01 (`src/engine/proseEnrichment.ts:593` on `origin/main`), which is THR-716's own option 1 verbatim.

Rather than take the grep as proof, I ran THR-716's own CLI evidence command — and it both confirmed the fix and exposed a second live leak on the same corpus:

```
> "The Unchained listens more than talks, watching for what the target wants but hasn't said."   ← {actor} fixed
> "The offer is laid out plainly: purpose, pay, and place in something larger. {sphere_flavor}."  ← still leaking
```

- `{sphere_flavor}` is authored **28 times** in `src/data/social-scene-templates.ts` (measured today; the ticket states the predicate, not the count).
- `enrichProse` has no such token, and no other site on the path substitutes one.
- Its intended resolver — `getSphereFlavorPhrase` in `src/data/social-scene-sphere-coloring.ts`, a 12 × 8 table whose own header documents the placeholder — has **zero importers**. Write-without-consumer: content authored, wiring never landed.
- The path is live: `src/engine/socialEncounterGeneration.ts` runs on the per-tick path.
- Law 43 violation, same class as THR-933 and THR-1036.

**Why it survived:** THR-716's second Done-when asked for a no-raw-braces lock over the social-scene pool. THR-933 extended the lock to `buildSimpleEncounterStageModel` only. With no pool-wide lock, a second token sat leaking for the ~50 days since the first half shipped.

Filed as [THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver) → `Ready for Dev`, priority High, project Encounter Experience. Three-write create sequence followed: create → separate `assignee:null` → **verified by `get_issue` showing no `assignee` key** (absence on the create response proves nothing — THR-845/THR-859) → coordination block posted as the first comment. Evidence shape recorded as CLI/headless; no browser-verify is owed.

THR-716 got the evidence as a comment and was **deliberately not closed** — it is only half-satisfied, and closing another party's ticket is not this lane's call. Disposition suggested for a human: park or close once THR-1516 lands.

**Rule 0 / materiality:** THR-1516 is product work, not process — a player-facing defect on the live path — so the process throttle does not apply to it. No process work was promoted this run; none was eligible. The 48h product:process completion ratio is unchanged at 4:3 (product THR-1503/1515/1501/1511; process THR-1513/1512/1514).

**The headline changes, but only by half.** Run a's finding — *"the queue has no executable work in it by construction, and only a design session converts any of it"* — was right about `Todo` and wrong as a claim about the board. One hour of `Idea`-column survey produced a shipped-ready ticket. That is a supply of one, though: **it relieves this hour, it does not replace the design session.** The eleven `Todo` items still all decline, nine of them because their own bodies forbid promotion.

## T1.5 — wayfinder sweep

Three open maps ([Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258)), none updated since 2026-09-11.

**AFK frontier: 0** — re-verified by label this run, not inherited: `list_issues label:"wayfinder:research" state:"Todo"` and the same for `wayfinder:task` both return empty. Nothing to burn down; `ORCH_WAYFINDER_AFK_MAX` did not bind.

**HITL frontier: 12** grilling/prototype tickets, unchanged since 2026-08-26 and already carried on the briefing. Not re-listed.

## T2 — design authoring

**Not triggered this run on its own terms, and barred regardless.** The non-`Deferral` shelf read 0 at scan (below the floor of 2) and reads 1 after THR-1516; either way `In Design` classifies as **2 live, 0 excluded** against a bound of 1, so nothing could be staged. Nothing mutated.

Both `In Design` items are unassigned and have sat 9 days (THR-1448) and 8 days (THR-1479) on the intended predicate — but each reads under a day old to the classifier, for the self-referential reason run a documented this morning. Practical cost today remains nil: staging a third item would produce a third unanswered design ask.

## T3 — architecture health

**Not due — the daily sweep already ran today** (run a, local 12:30, all four detectors green-or-unchanged). Not re-run, and nothing from it is restated here.

The one finding above (`getSphereFlavorPhrase`: authored table, zero importers, live placeholder leaking through it) is a **redundancy/unreachability finding of exactly the class T3 owns** — no detector produces it, because both halves are individually reachable and the leak only shows at render. It surfaced through T1's `Idea` survey rather than the detector pass, and is recorded here rather than held for tomorrow's sweep. Counted as this run's one new finding.

**Redundancy: not assessed this sweep** beyond that single module.

**Stalled work:** none — `In Dev` is empty. **Hand-created `In Dev` tickets:** none, same reason.

**In Design: 2 live, 0 excluded** (THR-1448 and THR-1479, both unassigned, both reading <1.2d to the classifier and 9d/8d in truth).

Weekly test-suite health: not due. Today is Sunday; next run is Monday 2026-09-21.

## Escalations

None opened. Nothing was parked. The two standing asks are Christian's to schedule and are carried in the section above rather than posted to Discord, where they would add noise to a question already asked twice.
