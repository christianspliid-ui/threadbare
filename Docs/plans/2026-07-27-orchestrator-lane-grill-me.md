# Grill-me — Orchestrator lane

**Date:** 2026-07-27
**Interrogator:** Claude Code (Opus 5), interactive session
**Subject:** Christian Spliid, creative director
**Status:** complete — input artifact for plan-doc drafting
**Questions asked:** 3 (converged early; the boundary answer collapsed most of the planned budget — see § Why this ran short)

---

## 1. Scope under interrogation

An **orchestrator lane**: a scheduled routine that decides *what happens next* and drives it into the pipeline, closing the gap between Christian's agreement on a design and the executor lane picking work up.

**The gap that prompted it.** Threadbare has a routine executor (`tb-opus-pickup`, hourly at :01, WIP=1) which shipped ~15 tickets in the 19 hours before this conversation, unattended. It has no orchestrator. Every other scheduled lane is downstream of a decision someone else made:

| Lane | Cadence | Role |
| -- | -- | -- |
| `tb-opus-pickup` | hourly :01 | executes top of Ready for Dev |
| `keep-work-flowing-cc` | hourly :45 | observes, reports; **read-mostly by design** |
| `daily-backlog-grooming` | daily 09:16 | hygiene; may not promote or claim |
| `weekly-*`, `monthly-*` | weekly/monthly | retros, hygiene, rulebook review |

**Nothing decides what happens next.** That role is Christian, in hand-started sessions.

**The closed loop this produces.** The executor drains Ready for Dev and refills it itself — each closed ticket tends to file a deferral underneath it, entering *directly* at Ready for Dev. `daily-backlog-grooming`'s only starvation rule fires when Ready for Dev **and** In Dev are both empty (verified in its prompt, § 2 line 72), which is unreachable while the executor keeps stocking its own shelf. Result: depth stays healthy (19–23 all week), the one check that could object never fires, and authored program work waits in `Todo` indefinitely. Measured at the time of this grill: **0 High, 4 Medium, 15 Low on the shelf, every arrival that day a self-found housekeeping deferral.**

**The triggering incident.** Christian authorised releasing four Nudge Model workstreams on Discord at 14:38Z. `keep-work-flowing-cc` recorded the authorisation correctly within a minute, wrote "routed to an executor", and **nothing happened for four hours** — no lane reads that sentence. They were promoted manually at 17:21Z only because he asked in chat whether it had been done. THR-778's own description had said *"Blocked by: WS0, WS1, WS3"*, and all three had been Done since that morning.

---

## 2. Confirmed decisions

Christian's verdicts, verbatim where they carry nuance.

**D1 — The orchestrator may promote to `Ready for Dev` autonomously.**
> *"yes it should be able to promote to ready for dev."*

**D2 — The remit is bounded by agreement, not by a marker.**
> *"expanding on already agreed designs and patterns and fixing bugs is within the remit of the orchestrator, we create the vision, the patterns, the overarching architecture, the prototypes, the game systems together, but when that context is clear i am not interested in second guessing. i am ready to clarify if the orchestrator is unsure though."*

Joint (Christian + agents): vision, patterns, overarching architecture, prototypes, game systems. Agent-owned once that context is clear: **expanding agreed designs and patterns, and fixing bugs.** Agreement is reached through grilling and often a brainstorm and a prototype; it is *not* recorded as a machine-readable flag. **There is deliberately no `agreed` label or state gate** — see § 3 R1 for the recommendation this overruled.

**D3 — Christian's role is creative director; agreement means "ready for design *and* implementation".**
Design authoring sits **downstream** of his agreement, inside the orchestrator's remit. The lane runs design sessions, not just promotions.

**D4 — Never block on him. Ask and keep moving.**
An unanswered question parks the one item it concerns; the lane proceeds to the next unblocked thing. Accepted with explicit awareness of the cost (work may proceed past a question he would have answered "no").

**D5 — Risk posture: exploration over caution.**
> *"i need to get good at guiding through context and patterns, and i will take the risk that some of the deliveries might be not spot on. remember we are making a game, and so we are exploring and some features will be killed again, thats just how it goes. we are not building mission critical software. we are building creative games."*

Cheap reversal beats expensive prevention. Ratification gates and prevention-heavy guard rails are not to be proposed unless a genuinely irreversible cost exists.

**D6 — Kill authority splits three ways.**

| Case | Owner | Who initiates |
| -- | -- | -- |
| 1. **Redundant, unused, or unreachable systems** — a technical/architectural judgement | **Agent** | **Agent**, as a standing obligation (D7) |
| 2. **Direction change** — the game should stop doing this | **Christian** | Christian |
| 3. **Works, wired, not fun** | **Christian** | **Christian**, from a gameplay point of view |

> *"i own 2 and 3. ai owns 1."*

**Refined 2026-07-27, same session** — Christian will **initiate case-3 dialogues himself**, on gameplay grounds. The orchestrator is therefore **not** obliged to nominate features as unfun; that judgement and its timing are his. This resolves § 5 G1 against the interrogator's carried assumption, and the correction matters: "not earning its place" had been treated as one bucket, when it is two independent axes — *is it fun* (his) and *is it redundant or unreachable* (the agent's, per D7).

**Case 1 is wider than first recorded.** It was scoped as "provably nothing routes to it" — a reachability proof. Christian's wording extends it to **redundant** systems: two implementations doing one job, which no reachability check can flag because both are reachable.

**D7 — Code and architecture quality is fully delegated to the agent, as a continuous duty.**
> *"i will initiate dialogues around 3 from a gameplay point of view, however if from a code and technical point of view we have redundant systems or unused systems the ai is obliged to surface this if it sees them. this should be under the umbrella that I am not responsible for code and architecture quality as I dont have the skills. so the agent must continuosly make sure that is surfaced when relevant."*

Three things follow, and they are stronger than D2's general remit:

1. **Christian explicitly disclaims capability here**, so there is no fallback reviewer. Unsurfaced architectural decay is not caught later by anyone.
2. The duty is **continuous and unprompted** — "must continuously make sure that is surfaced when relevant" — not a response to a request, and not a periodic audit someone must remember to schedule.
3. It is an **obligation to surface**, not unilateral authority to delete. Case 1 removals are the agent's call; the *reporting* duty stands whether or not a removal follows.

---

## 3. Agent recommendations (`⚡`)

**R1 — `⚡` OVERRULED, and correctly.** Recommended that "agreed" be an explicit act Christian performs (label, epic state), so no agent could ever infer approval from enthusiasm. Overruled per D2: a marker he must remember to apply is friction at the moment he is most done with the conversation, and it fails silently when forgotten. **Retracted by the interrogator during the session.** The weight moves from bookkeeping to *asking well when unsure*.

**R2 — `⚡` ACCEPTED.** Escalation is non-blocking: ask on Discord, park the item, continue. Accepted per D4.

**R3 — `⚡` PARTIALLY ACCEPTED.** A kill path is mandatory, not optional. Accepted as a requirement; ownership split per D6 rather than assigned wholesale to Christian.

**Evidence R3 rested on** — the dominant defect class in this repo is authored capability that nothing routes to, which is invisible to every automated gate *because it exhibits no wrong behaviour*: 61 templates with no draw path (44 confirmed KILL, THR-779), 62 dead trait refs (THR-800), 22 more with no producer (THR-808), 13 unproducible ambition keys (THR-813), a chain subsystem with zero production callers (THR-803), ~150 faction templates drawn 0 times by a member (THR-814). Exploration without retirement industrialises exactly this.

---

## 4. Parked-then-resolved questions

None. No question was parked; all three were answered on first ask.

---

## 5. Unresolved grey zones

**G1 — RESOLVED, against the carried assumption.** *Was: is surfacing case-3 kill candidates an obligation or a courtesy?* Christian answered unprompted (D6 refinement / D7): **he initiates case-3 dialogues himself, on gameplay grounds**, so the orchestrator carries no duty to nominate features as unfun. The obligation he *does* impose is a different one — continuous surfacing of **redundant and unused systems** on technical grounds, where he disclaims the skills to judge.

The assumption was wrong in an instructive direction. It had collapsed two axes into one: *unfun* and *redundant* both read as "not earning its place", but only the second is assessable from the code, and only the first is his to feel. Recording it because the flagged-assumption discipline is what made the correction cheap — it was written down as an assumption rather than as a decision, so overturning it cost one exchange.

**G2 — What "unsure" means in practice.**
D2 grants the orchestrator judgement plus an escalation path, but the threshold is undefined. Too low and it nags; too high and it builds the wrong thing confidently. No verdict sought — this is a calibration to be tuned from observed behaviour rather than specified upfront, consistent with D5.

---

## 6. Open risks and assumptions

**K1 — The initiative mandate is not written down anywhere.** `Docs/ways-of-working.md` covers the *decision* split thoroughly (who verdicts what, technical calls are agent calls, Christian steers and does not micromanage) but contains **no clause granting an agent authority to begin work unprompted**. The closest, "propose automations proactively," explicitly stops at *propose* — "rather than either executing silently or waiting to be asked." **This is assessed as the root cause of the orchestrator's absence**: it was never forgotten, it was never authorised. Every documented lane is downstream of a decision because the working agreements describe a review interface and a decision split, and nothing else. **D1–D6 must land in `Docs/ways-of-working.md` or the orchestrator runs on authority that exists only in one chat transcript.**

**K2 — Coordination blocks are half-consumed.** Every handoff since April carries `Blocked by` / `Parallel-safe with` / `Mutex with` (THR-688). The executor consumes the **mutex** half at claim time and does so well — it deferred THR-800 four times in one day on a single authored mutex line. **Nothing consumes the dependency half**, because nothing promotes. The substrate an orchestrator needs is already authored and already maintained; it has simply never had a reader.

**K3 — Program work will compete with self-filed housekeeping.** Once the orchestrator promotes program work, it lands on a shelf holding ~15 Low deferrals. Whether program work outranks the executor's own by-products is a sequencing policy, and per D2/D3 it is **agent-owned** — to be decided in the design doc, not escalated.

**K4 — Non-blocking escalation means work proceeds past unanswered questions.** Accepted explicitly under D4/D5. Mitigation is cheap reversal (D5) plus the kill path (D6), not a gate.

**K5 — Unbounded initiative has a cost dimension not discussed.** A lane that authors designs, promotes, and feeds an hourly executor increases spend. Not raised with Christian; assumed acceptable and to be bounded in design by cadence and WIP rather than by approval.

**A1 — Assumed:** when agreed work runs out, the orchestrator **stops and asks** rather than falling through to un-agreed roadmap items. Stated as an inference from D2 during the session and not contradicted; picking un-agreed work would be choosing direction, which D2 reserves.

---

## 7. Inputs for the upcoming design doc

1. **Write D1–D6 into `Docs/ways-of-working.md`** as an initiative mandate (K1). This is the authorising act and should land whether or not the lane ships.
2. **Build the dependency-half consumer** the coordination blocks have always deserved (K2): read `Blocked by`, resolve against issue states, promote what is unblocked.
3. **The lane's shape**: decide what happens next → run or dispatch design for agreed-but-undesigned work → promote to Ready for Dev → keep `tb-opus-pickup` fed → stop and ask when agreed work is exhausted (A1).
4. **Kill path as a first-class output** (D6/R3): the agent retires redundant, unused and unreachable systems on its own authority. It does **not** nominate case-3 (unfun) candidates — Christian initiates those.
4b. **The D7 duty needs a mechanism, not an intention.** "Continuously surface redundant/unused systems" stated only as a standing instruction will decay exactly the way this repo has already documented: *advisory gates nobody reads are indistinguishable from gates that do not exist* (`Design/user-actions.md` finding 4), and *a subsystem with no callers exhibits no wrong behaviour, so no sweep looking for wrong behaviour can see it* (finding 2, eleven instances in four days). **Design must give the obligation a scheduled owner and a reporting surface**, and should reuse the detectors already built rather than adding a new sweep: the interface map (THR-717, `LEAKED` badges + `npm run generate-interface-map`), `validateTraitRefs`, `sweep:rank-reach`, `check:generated-freshness`. Several already exist and are advisory — the gap is a lane obliged to *read* them and put the result in front of Christian in plain language.
5. **Escalation**: Discord, non-blocking, park-one-item-and-continue (D4/R2).
6. **Interactions to settle in design, not with Christian** (K3): sequencing policy vs self-filed deferrals; cadence; WIP interaction with the executor's single slot; repeated-failure handling.
7. **Relationship to `keep-work-flowing-cc`**: it already performs the observation half and is deliberately unauthorised to act. Decide whether the orchestrator absorbs it, supersedes it, or runs beside it — the two share Discord, the briefing, and the board scan.

---

## Why this ran short

Budget was ~27 questions; three were asked. D2 arrived as a single unprompted statement of the whole authority boundary, which pre-answered most of the planned budget (what counts as agreed, who owns design authoring, what needs ratification, how much autonomy). The remaining planned questions — cadence, sequencing policy, failure handling — were reclassified as **agent-owned by D2 itself** and moved to § 7 item 6 rather than asked. Continuing to ask them would have been the second-guessing D2 explicitly rules out.

One question (Q1) produced a **retraction rather than an answer**, which `Docs/ways-of-working.md` names as a first-class outcome: *"Be honest when your own work needs retraction."*
