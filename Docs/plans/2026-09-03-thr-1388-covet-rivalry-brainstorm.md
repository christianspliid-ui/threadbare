# The covet rivalry — Brainstorm Companion

> Companion to `Docs/plans/2026-09-03-thr-1388-covet-rivalry.md`. Alternatives considered, tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

THR-1383's acceptance run found zero culprit-carrying harms on seeds 42 and 99 in 300 ticks. The ticket asked one question — does the live board fail to *start* harm-capable undertakings, or fail to *finish* them? — and named three suspects: a motive gate too tight, the variety penalty, the per-mortal cap. The design pass started by refusing to guess: four probes on the real tick pipeline, the last two re-run after the first pair read `actorId` off a trace that names `agentId`.

## First-pass framing I considered

"The gate is too tight now that grudges are the loop's output as well as its input" — the ticket's own hypothesis. It survived exactly until the refusal histogram: the refused pairs were conquerors in factions aiming at holdings of factions that were simply not their rivals. Nothing about the gate's *reading* was wrong; the world had written no quarrel for it to read.

## Alternatives considered

**A. Loosen `faction_war` to "any rival faction owns it".** Rejected: it licenses raids against strangers on the strength of a war the actor is not in. The gate's whole design (THR-1296 slice 2) is that a destroy needs *this* mortal's reason.

**B. Leader-as-owner** — mirror THR-1383's faction → leader victim routing on the read side, so a faction's leader counts as an owner the actor might hold a quarrel with. Run as a controlled arm on seed 42: zero of 624 refusals would have passed under any motive. Rejected on measurement.

**C. Faction-level covet** — after N refusals, the actor's *faction* becomes rival to the owning faction. Rejected: it escalates one conqueror's frustration into a war, feeds the army system, and would move the census envelope the plan is forbidden to move.

**D. Accept quiet seeds** — move the reactive loop's acceptance surface to seed 123, which has organic supply. Rejected: the two default seeds are the ones every review opens, and THR-1300's pilot adds four motive-gated destroys that would ship into the same silence. Recorded here as the fallback if the acceptance re-run stays at zero after the one permitted threshold retry.

**E. The covet rivalry (chosen).** A mortal refused a destroy against the same owner a day running comes to hold a rivalry with that owner. One existing edge, one new cause, read by the gate as it reads every rivalry.

## Tensions surfaced

- **Systemic emergence vs. authored moments** (`03-design-tensions.md` §2): the rule manufactures a quarrel from a *count*. It stays on the emergent side because the count is of things the mortal actually did on the board — kept reaching for another's holding — and because the edge is a rivalry, not a grudge: the world says "these two are in each other's way", not "one has wronged the other".
- **Legibility vs. realism:** twelve refusals is a day; a real grudge takes longer. The threshold is the constant that carries the feel, named so it can move.

## Vision premises this plan leans on

- **Mortal sovereignty** — the quarrel is written from the mortal's own conduct, never from the god's intervention. *This plan's version:* the god can only watch a conqueror talk themselves into a war.
- **Narrative over mechanical perfection** — the rule is a sentence a player can say: *what he could not take, he came to hate.*

## Taste profile touchpoints

- Confirms the soft pattern *every part of a name is something that happened* extended to relationships: the rivalry names its cause (`covets`) and its target, so the sheet can say what it is made of.
- No anti-pattern dodged narrowly; the nearest was "a stat that ticks up" — avoided by keeping the count internal and rendering only the edge.

## Branches not taken

- A `covet` **motive kind** (fifth gate value). Not taken: the gate reads edges, not counters; adding a motive that reads a property would give the gate two shapes of input.
- Writing the edge at world-gen (every conqueror seeded with a rival). Not taken: a rivalry with no history is exactly the "chosen from a list of pretty words" the christening rule refuses.

## Open questions

None left to the executor. One creative fork goes to Christian with a veto invitation rather than a question: **should coveting breed hatred at all?** The plan says yes; if the answer is no, alternative D is the recorded fallback.

## Brainstorm Status

Complete enough to hand off.

---
*captured 2026-09-03 — execution session running the design pass, Claude Code*
