---
lane: tb-orchestrator
run: 2026-08-17g
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-17 (run g, ~10:28Z)

## Needs Christian

**One ask, unchanged from this morning and still the only live one:** [What counts as a change the world *acts on*, versus one it merely writes down](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions).

Three classes are on the table: things a system reads today (the player sees them in full), things recorded now for a story to pick up later (the player is told it was recorded, and something must eventually use it or it lapses), and pure bookkeeping the player never sees. You have half-ruled this twice in opposite directions already — reach-reputation tallies invisible everywhere, but plot-hook-worthy recordings *"we need to make it clear to the player that that is what has happened"* — and this is the sitting that reconciles them into one rule the code can carry rather than a habit reviewers remember. It is a chat session, no prep, nothing built or waiting on it. Say **"work the map"** when you have the time.

**Progress you did not have to chase, for context rather than action.** The chip work you filed at breakfast has half landed: [prose and chips are one package](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) merged at 09:40 — the anchoring rule is now law, and the catalog of what a chip is *allowed* to point at exists as a written table instead of a habit. The other half — sweeping the 65 chips that name something the world does not have, and the gate that keeps new ones out — was correctly paused this morning because it needed that table, and this run handed it back to the build queue now that the table exists. Nothing needed from you on it.

**The map's other three questions are still not asks.** The second-seam prototype now has half its input (the catalog) but not the other half — the pilot's actual 65-chip migration, which is the thing that would tell us whether the type survives contact. The remaining two wait behind that. You will hear about them when reacting to them is worth your hour.

## T1 — unblock sweep

**Promoted 1** — [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) (Urgent) → `Ready for Dev`. **This is the re-promotion the executor explicitly asked this lane for**, which is the whole point of the tier and the cleanest instance of it yet.

```
[orchestrator] T1 scan: Todo 20, Implementation Planning 0, Idea 1 (96h filter), Ready for Dev 1, In Design 1, In Dev 1
[orchestrator] T1 promote THR-1153: blocker THR-1154(Done 2026-08-17T09:40:06Z, PR #1521) → Ready for Dev; verified stuck, assignee key absent (null); coordination block posted
[orchestrator] T1 skip THR-1160: blocker THR-1153 now Ready for Dev, not Done → still blocked, stays T1.5's input not T1's
[orchestrator] T1 skip THR-1157/1161/1162/1163, THR-902/907: wayfinder:* labels → T1.5, never Ready for Dev
[orchestrator] T1 skip THR-1156: program epic, body says "no execution ticket files directly against it" — container, not queue work
[orchestrator] T1 skip THR-1155: wrong destination — body says "this is a design ticket — plan doc before code" → T2
[orchestrator] T1 skip THR-1024: prose gate "do not start before THR-966"; THR-966 re-queried, still Idea
[orchestrator] T1 skip THR-1140: Idea, Low, dead-read finding → process throttle, retro batch not queue
[orchestrator] T1 hold: promotion ceiling not reached and not binding — nothing held back
```

**The promotion, with its evidence.** At 09:03Z the executor parked THR-1153 from `In Dev` back to `Todo` rather than finishing it, and recorded `blockedBy: THR-1154` as a **native Linear relation** specifically so this lane would see it — its own words: *"so `tb-orchestrator`'s T1 pass can re-promote this ticket automatically once the catalog merges."* THR-1154 completed at **09:40:06Z** ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)). Blocker re-read live this run: THR-1154 was the sole entry and now resolves `Done`. State re-queried after the write and confirmed stuck; the `assignee` key is absent on the re-query, so `pull-work`'s `assignee:null` filter will see it.

That park was a good call and worth recording as such: the remaining work is a 65-chip sort into *anchored / fold / bind*, and doing it before the catalog existed would have meant inventing the anchor vocabulary against CLAUDE.md's standing rule on not inventing node types — then re-doing the sort when the real one landed. The blocker was real, it was recorded in the field the machinery reads, and it cleared in 37 minutes.

**Latest-comment check ran and mattered here (T1 step 3a).** THR-1153's newest comment is a park *with a re-promotion instruction*, not a retire verdict — the two are easy to confuse from the state alone, since both leave an Urgent ticket sitting in `Todo` with a merged PR attached. Reading it is what distinguished "promote this, it was waiting for you" from "leave it, it was judged dead."

**One thing carried into the coordination block rather than decided here.** The executor recommended the remainder is plausibly its own ticket — a 65-chip sweep plus a gate is not the single-chip defect this was filed for — and deliberately left that split to the re-scope pass. This lane does not make it either. It is the claiming executor's call, and the block says so.

Unchanged declines, each re-checked this run rather than carried: **THR-1024** (blocker THR-966 still `Idea`), **THR-1148** (decision-complete; its revisit trigger is authored volume, not a merge), **THR-1114** / **THR-1002** / **THR-1155** (wrong destination, T2 input), **THR-175** (unmet trigger gate), **THR-1140** (`Idea`, `Low`, sub-bar under the process throttle — a log row, not a queue item), **THR-789 / THR-791 / THR-1043** (tracking epics or assigned to Christian), **THR-870** (parked by creative-director sequencing).

**Shelf: 0 non-`Deferral` items at scan, 1 after the promotion.** The executor was one hour from idle on program work — THR-1130 is a park, not active work (see below), so the shelf was the only thing standing between the lane and nothing to do. The promotion ceiling did not bind and held nothing back.

**Scan-hole note, carried, tenth consecutive run.** The skill's § T1 step 1 issues two calls (`Todo`, `Ready for Dev`) while step 2 says *"for each `Todo` / `Idea` candidate"*, so `Implementation Planning` and `Idea` are in neither. Both arms run again this hour: `Implementation Planning` **empty**, `Idea` surfaced only THR-1140, correctly declined. Stays **logged, not filed** under the process throttle; the retro's membership predicate is unchanged — `Implementation Planning` unconditionally, plus `Idea` filtered to recent issues in a project with active work.

**Product-vs-process ratio, week of 2026-08-10 → 08-17: roughly 3:1 product, holding.** Every completion since run d's measurement (THR-1145, THR-1147, THR-1152, THR-1154) is product, which moves the sample further in the product direction. No corrective action indicated; this run promoted product work and filed no process ticket.

## T1.5 — wayfinder sweep

**Two open maps. Children re-listed live this run rather than carried, and one relation moved.**

**[THR-1157 — Typed game-state architecture: machinery + first wave](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map).** Six children: **2 `Done`, 4 open**, none assigned. Frontier is **2 tickets, both HITL**:

- **[THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)** (`wayfinder:grilling`) — `blockedBy: []` confirmed live. Genuinely ready. **Surfaced above; this is the live ask, and it is restated deliberately** — `keep-work-flowing-cc` reads only the *newest* sibling report, so an ask omitted here would drop out of the briefing entirely rather than persist from run f.
- **[THR-1162](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots)** (`wayfinder:prototype`) — its only declared blocker THR-1159 is `Done`, so it is frontier by the relation graph. **Held rather than surfaced, and the reason has shifted since run f:** the catalog half of its input now exists (THR-1154), but the pilot's actual 65-chip migration does not — THR-1153 was re-promoted this run and has not landed. The ticket asks whether the anchor type *survives contact* with a second seam; asking that before it has made contact with the first one would produce a reaction to a guess.

Off the frontier and correctly so: **THR-1160** (`wayfinder:research`) is blocked by THR-1153, which is now queued rather than parked — so this is the next ticket to unlock, and it is AFK, meaning this lane resolves it without Christian once the pilot lands. **THR-1163** (`wayfinder:grilling`, wave-1 selection) is blocked behind THR-1160. The sequencing chain that carves this map up still runs through the pilot.

**[THR-902 — Encounter experience redesign, vertical slice](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map).** Children re-listed live: **8 total, 7 `Done`, 1 open.** Frontier is **1 ticket** — [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) (`wayfinder:prototype`, HITL), the standing slice-verdict ask. **Not restated to Christian this run.** It has been the standing ask for over two weeks and is already carried in the briefing; leading with two asks in one report is how both get skipped, and THR-1161 is the newer and cheaper of the two.

**AFK burn-down: 0 tickets, `ORCH_WAYFINDER_AFK_MAX` (2) unspent.** Across both maps there is not one open `wayfinder:research` or `wayfinder:task` ticket that is unblocked. The only research ticket left, THR-1160, waits on the pilot by design — and this run moved that pilot from parked to queued, which is the fastest available route to spending the budget next time. This lane does not touch grilling or prototype tickets.

## T2 — design staging

**Triggered, and bound — for the seventh consecutive run.** Shelf held **0 non-`Deferral` items** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). The floor fired.

**Nothing staged**, because `In Design` already holds **1** issue — [THR-790, Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — which is exactly `ORCH_MAX_IN_DESIGN` (1). Staged 2026-08-15T20:29Z; the 48h re-surface clock expires **2026-08-17T20:29Z**, so the first run after that re-surfaces it rather than re-staging.

**Candidate ranking, unchanged from run f and re-stated because the top entry carries a caveat that keeps mattering:**

1. **[THR-1155](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to)** (nations and named areas as real game objects) — top candidate. High, director direction, explicitly needs a plan doc, named first expansion beyond the pilot. **Caveat:** the map states its *position in the wave* is THR-1163's call, and THR-1163 is blocked behind the pilot — so staging it today would pre-empt a decision the map deliberately holds. Recorded, not forced forward.
2. **[THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in)** (shareable game-state snapshot) — unchanged and still valid.
3. **[THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** (card grammar) and **[THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere)** (sphereAffinity strays) — feature-class, both below the architecture program by the morning's ruling.

**The observation from run f still stands and is now one step closer to actionable.** The single design slot holds THR-790, feature-class design — the class the architecture-first ruling says can wait. Freeing it still buys nothing today, because THR-1155 waits on the map's wave-order call. But the pilot moved this run, and when it lands THR-1160 resolves and THR-1163 unblocks; that is the moment the swap becomes worth one sentence from Christian. The 20:29Z re-surface will put it in front of a run that can act.

**The constraint is unchanged: the shelf is thin because execution is fast, not because promotion is failing.** This run had exactly one eligible candidate and promoted it within 48 minutes of its blocker clearing. What is genuinely constrained is design supply, and the binding constraint is the `In Design` bound plus the map's own sequencing — not a shortage of candidates. This lane deliberately does not author plan docs (Christian's ruling, 2026-08-06).

## T3 — architecture health

**Not due — already run this UTC day.** Run d at ~04:26Z was the first sweep past `ORCH_HEALTH_SWEEP_HOUR` and carried the full detector pass plus the Monday `ORCH_TESTHEALTH_DOW` weekly test-suite health file, `Docs/ops/test-suite-health-2026-08-17.md`.

**No detectors ran this run, and none are reported as clean.** Run d's standing set is carried explicitly unverified: 7 LEAKED interface contracts, `check:authoring-brief` stale, 21 canon-staleness warnings, `sweep:rank-reach` PASS. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless; not run.

**Redundancy: not assessed this sweep.** Run d assessed it six hours ago (the `SceneStatePanel` encounter-state duplicate, the `*IconGlyph` parallel representation path, the `composition-dsl` validation sub-island). No fresh judgement pass happened this run and none is claimed.

**Stalled-work check ran** — it is cheap and reads the same `stateHistory` this run already fetched. THR-1153 has **one** `Ready for Dev → In Dev` transition against `ORCH_STALLED_PICKUP_THRESHOLD` (3); today's return to `Todo` was a deliberate, documented park, not a failed pickup, and re-promoting it does not make it stalled work. Nothing on the board is at or over the threshold.

## Escalations

None. No question was asked and nothing was parked. Every decline named its evidence, and the one genuine ask went to `## Needs Christian` rather than Discord — it is a design sitting to schedule, not a blocker to unblock.

**One note on THR-1130, carried because it keeps being read wrong from the state alone.** It shows `In Dev` but is a **park** — `assignee: null` ∧ `In Dev`, verified live again this run — waiting solely on Christian's 2-of-6 batch-1 sample verdict. It is not the executor's active claim, which is why the shelf reading 0 non-`Deferral` items this hour meant the lane was genuinely close to idle rather than comfortably busy.
