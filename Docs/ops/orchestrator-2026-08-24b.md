---
lane: tb-orchestrator
run: 2026-08-24b
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-24 (run b, ~07:31Z)

## Needs Christian

**One ask, and it is a 30-second one: may the hook corpus be published to the repo?**

The 12 quest-hook research files you wrote on 31 July — 1,200 tagged story situations, about 330 KB — sit on your machine only. They are invisible to every agent, because one line in the repo's ignore list (`Design/*`) hides the whole `Design/` folder from git, and nothing re-includes the research folder. Nobody noticed because the files are right there on your disk when *you* look.

This matters right now because of what you chartered this morning. The encounter authoring instructions tell every factory run to *"cite the hook"* from that corpus and aim at a thin coverage cell; with the folder invisible, every run silently falls back to *"original"* and the corpus stops steering anything. And the [portfolio assessment you filed](https://linear.app/threadbare/issue/THR-1215) names those same files as the reference for what the encounter range is supposed to look like.

**It needs you rather than an agent for one reason: the repo is public, so publishing 330 KB of your design research is your call, not ours.** If you say yes, an agent adds the re-include line and commits the files — a few minutes. If you would rather they stay private, say so and the tickets get written to work without them.

The assessment ticket has been sent to the dev queue either way, with a note telling whoever picks it up not to hunt for the missing folder.

**Two smaller things, no reply needed unless you want to act:**

- **Your board work this morning landed.** The typed game-state map is closed, the second-seam prototype question is retired with it, and the three wave-1 tickets are filed. This morning's earlier brief asked you to look at that prototype question — **ignore that; you have already answered it.**
- **Still waiting, unchanged from earlier:** the [card grammar](https://linear.app/threadbare/issue/THR-1002) (5 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790) (9 days) both need a design session before anything downstream can start; the [slice verdict session](https://linear.app/threadbare/issue/THR-907) is the last open question on the encounter map (9 days). Design work is now stacked four deep with nothing drawing it down — that is the standing constraint, not a new one.

## T1 — unblock sweep

Scanned `Todo` (20) and `Ready for Dev` (2). **Shelf depth: 2, both `Deferral`-labelled — non-`Deferral` program work: zero**, against a floor of 2. Promotion ceiling not engaged.

Four issues entered `Todo` after the 05:39Z run's scan (THR-1212, THR-1213, THR-1214, THR-1215, all Christian-filed 05:53–06:30Z). They are this run's entire candidate delta; everything else was assessed at 05:39Z and is unchanged.

**Promoted — 1.**

- **THR-1215** (encounter portfolio assessment) → `Ready for Dev`. `blockedBy` empty, no gate in the description; filed by Christian 06:30Z as step 1 of a director rule made the same morning, whose ordering clause landed in PR #1589 (merged, `54b21561`). Latest-comment check (THR-990): **zero comments** at promotion, so no standing verdict could exist. Plan-doc liveness (THR-921): names no plan doc, passes trivially; primary input `Docs/canon/encounter-catalogs.md` resolves on `origin/main` — **LIVE**. State write verified by `get_issue` re-query, **no `assignee` key present**. Coordination block posted, mirroring the one Christian wrote into the description (`pull-work` Step 3 reads the latest *comment*, not the description) and adding the mutex reason inline — THR-1043 and THR-1130 both edit `nudge-authoring-spec.md`, neither is live. The block also carries the stranded-input warning below, so the executor does not burn a session hunting a folder that is not there.

**Declined — 2 of the new arrivals.**

| Issue | Reason | Evidence |
|---|---|---|
| THR-1212 (wave-1 design A — shared anchor machinery) | **Wrong destination — design, not execution** | Opens *"Design-session ticket"*; Done-when is *"Plan doc in `Docs/plans/` per design governance… moved to Ready for Dev with a coordination block."* Promoting it would put plan-doc authoring in the executor queue. T2 input — but see below, T2 is bound-blocked |
| THR-1213 (wave-1 design B — hunger vocabulary) | **Unmet blocker** | Native Linear relation: THR-1212 `blocks` THR-1213, and THR-1212 is `Todo`. Its own text: *"This doc runs first: the other two wave-1 designs are blocked on it"* |

**Resolved without lane action — 1.** THR-1214 (wire mandate milestone prose) was filed straight into `Ready for Dev` at 05:54Z and re-pointed to `Duplicate` of THR-1197 at 05:58Z, four minutes later, by Christian. THR-1197 shipped 2026-08-22 (PR #1572, `44182b87`). Correctly self-resolved before this run reached it; recorded so the state history is not misread later as a lane promotion that vanished.

**Carried forward unchanged — the 7 declines and 4 wayfinder skips** recorded in [`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md). None of them moved: no comments, no state changes, no `updatedAt` movement beyond the relation writes THR-1215's creation stamped on THR-1043 and THR-1182 at 06:30:35–36Z. Not re-listed — re-deriving a decline hourly is what trains the reader to skip this file.

### Rule-0 discipline

**Nothing process-shaped was promoted, and nothing was filed.** The one promotion is director-filed design/content work. The run's one finding (below) is a process/infrastructure defect and is **logged, not ticketed** — the process-work throttle bars scheduled lanes from filing, and this one's fix is Christian's decision rather than an executor's anyway.

Week's product-vs-process completion ratio unchanged from the 05:39Z measurement (~42 product : 3 process); no completions landed in the intervening two hours.

## T1.5 — wayfinder sweep

**One open map now, down from two. Frontier: 1 ticket, HITL. AFK tickets resolved: 0 — none open.**

| Map | State | Frontier |
|---|---|---|
| [THR-1157](https://linear.app/threadbare/issue/THR-1157) — Typed game-state architecture | **`Done` 2026-08-24T05:52:54Z** | Closed by Christian **13 minutes after the previous run scanned it**. Its last open question, THR-1162 (second-seam prototype), is retired with the map — THR-1212 records it as *"the canceled second-seam prototype"*, kept only as optional input |
| [THR-902](https://linear.app/threadbare/issue/THR-902) — Encounter experience redesign, vertical slice | `Todo` | **1** — THR-907, `wayfinder:prototype`, HITL, open since 2026-08-15. Seven of eight children `Done` |

**This tier's one job this run was catching a stale ask.** The 05:39Z brief asked Christian to look at THR-1162; he had already answered it by closing the map, and that brief reaches him at :45. Left uncorrected, the next briefing would have asked him again for something he had just finished — so the retraction is stated explicitly under § Needs Christian rather than by silently dropping the line.

THR-907 is surfaced again for the second consecutive run, with the same deviation recorded: it carries Christian's assignee, which step 2 would normally drop from the frontier, and is surfaced anyway because he is the only person who can answer it.

**No ticket was claimed, resolved, or closed by this lane this run.**

## T2 — design staging

**Triggered by shelf depth, blocked by its own bound. Nothing staged — unchanged from 05:39Z.**

- **Trigger: met.** Non-`Deferral` program work in `Ready for Dev` was **0** at scan (**1** after this run's promotion), floor is 2.
- **Bound: exceeded.** `In Design` holds **2** — THR-1002 and THR-790 — against `ORCH_MAX_IN_DESIGN` (1).

**What changed is the shape of the problem, and it is worth stating plainly.** The 05:39Z run's headline was *"the design step has no throughput"* and read as a supply problem. Two hours later Christian had filed three design tickets himself (THR-1212, THR-1213, and the now-duplicate THR-1214) plus the assessment ticket promoted above. **Supply is not the constraint — drawdown is.** The design backlog now stands at four:

| Issue | State | Waiting |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) — traits wave 2 | `In Design` | 9 days |
| [THR-1002](https://linear.app/threadbare/issue/THR-1002) — unify the card grammar | `In Design` | 5 days |
| [THR-1212](https://linear.app/threadbare/issue/THR-1212) — wave-1 design A, shared anchor machinery | `Todo` | filed today |
| [THR-1213](https://linear.app/threadbare/issue/THR-1213) — wave-1 design B, hunger vocabulary | `Todo`, blocked on THR-1212 | filed today |

Four authored design tickets, zero attended sessions drawing them down, and this lane is structurally forbidden from supplying that step (Sonnet by direction, 2026-08-06). **THR-1212 and THR-1213 were deliberately left in `Todo` rather than moved to `In Design`** — they are Christian's own filings, so staging them would be bookkeeping that consumes the bound without adding information he does not have, and would push `In Design` to four while the drawdown rate stays zero.

## T3 — architecture health

**Not due — skipped, and no detector was run this run.** The daily sweep already ran today at 05:39Z (its findings are in [`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md)), and the weekly test-suite health pass ran with it — Monday is `ORCH_TESTHEALTH_DOW`, and [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops`.

Nothing below is a detector result. The finding is a T1 by-product: it surfaced while checking whether THR-1215's named inputs resolve on `origin/main` before promoting it.

### New finding — the 1,200-hook corpus is invisible to git, and three surfaces point at it

`Design/research/quest-hooks/` holds **13 files, ~330 KB, written 2026-07-31**, present in the home tree's working directory and **absent from `origin/main` and `origin/ops` alike**. Cause, confirmed by `git check-ignore -v`:

```
.gitignore:73:Design/*	Design/research/quest-hooks/01-village-and-rural.md
```

`Design/*` ignores the folder wholesale. `.gitignore` re-includes `briefing.md`, `user-actions.md`, `retros/`, `mockups/` and the mockup PNGs — **there is no `!Design/research/`**, so the corpus has been invisible since the day it was written. `git status` is clean and `git ls-tree origin/main -- Design/` returns nothing, which is why no sweep has ever flagged it.

**This exact class is already recorded in the same file it happened in.** `.gitignore:81–92` explains that `Design/mockups/2026-07-26-nudge-model-encounters.html` *"had sat on disk since 2026-07-26 while `Design/*` hid it from every git query"*, and re-includes `mockups/` for that reason. The rule was fixed for one folder and the folder next door repeated it five days later.

**Three surfaces on `main` point at the invisible path:**

| Surface | Reference | Consequence |
|---|---|---|
| `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md:354` | Step **0d**, *"Cite the hook: `Hook: #NNN` from `Design/research/quest-hooks/` or `Hook: original`"* | **Degraded, not blocked** — the `or Hook: original` fallback always passes, so every factory run silently takes it. What is lost is the steering the step exists for: *"a hook aimed at a thin coverage cell beats an original aimed at a fat one."* The gate reports success while the corpus it exists to consult is unreadable |
| `Docs/canon/encounter-catalogs.md:22,50,61` | *"Companion idea bank… 1,200 tagged situations"*; § FORM and § OBJECTIVE defer to `quest-hooks/README.md` | **Smaller than it looks.** The file enumerates all 20 `pressure`, 40 `form` and 36 `objective` values **inline**. Only two annotations — the secret-vs-rumour distinction and the objective rotation notes — live solely in the invisible README |
| `Docs/canon/encounters.md:45` | Same companion pointer | Navigation-layer pointer to a path no agent can open |

**Honesty caveats, both directions.** The design-block vocabularies THR-1215's census needs are fully available on `main`; I checked before promoting, and the census is not blocked. And I am not claiming a regression — the corpus has never been in the repo, so this is a condition being noticed, not one that changed.

**Not filed.** The process-work throttle bars scheduled lanes from filing process/infrastructure tickets, and this one is Christian's call regardless: the repo is public, so publishing 330 KB of his design research is a disclosure decision rather than a mechanical fix. Surfaced as this run's one ask, with the caveat mirrored into THR-1215's coordination block so the promotion does not cost an executor a hunt. If he declines publication, the standing remedy is to correct the three surfaces above so they stop pointing at a path agents cannot reach — which would be a legitimate retro ticket rather than a lane filing.

### Redundancy pass

**Not assessed this run** — the judgement pass over the interface map and systems inventory was done at 05:39Z (it produced the `reputationScore` finding) and is not re-run within the same day. Stated rather than omitted, so the absent section is not read as a clean result.

### Stalled work

Not re-derived; the 05:39Z scan found no issue at or past `ORCH_STALLED_PICKUP_THRESHOLD` (3), and no issue changed state in the interval except THR-1214 (filed and duplicated within 4 minutes, by Christian) and THR-1215 (promoted by this run).

## Escalations

**No question was asked on Discord and nothing was parked.** Agreed work is not exhausted — this run promoted some, and the constraint is the attended design step, which reaches Christian through the briefing rather than as a Discord escalation.

One correction recorded against this lane's own output, since it is the kind that compounds: the 05:39Z brief's second ask (THR-1162, the second-seam prototype) was **already stale when written** — Christian closed the map at 05:52Z, 13 minutes after that run's wayfinder scan and before the brief reached him at :45. No fault in that run, which read a live board. It is a timing hazard worth naming: an ask assembled at :39 and delivered at :45 can be answered in between, so a repeat surfacing must re-check the frontier rather than carry the previous run's list forward. This run did, and retracted it explicitly.

Bare `THR-XXX` references throughout — nothing in this report is intended to close anything.
