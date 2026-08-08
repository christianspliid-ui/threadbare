---
lane: daily-backlog-grooming
run: 2026-08-08
promoted: 0
filed: 0
resolved: 2
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-08

## Needs Christian
- **The encounter-format sitting (THR-883) is the single largest blocker on the board.** Twelve content tickets — the whole WS5 rewrite programme — are held in Todo waiting for it, plus one finished PR (#1114) parked eight days. The sitting needs one decision from you: *what does an author write for the aftermath of an encounter?* Today's answer is "a paragraph and a button", which you rejected on 2026-08-02 against the approved mockup. **Recommendation:** settle the aftermath half first, then the rest — otherwise the twelve held tickets unblock into a format missing its back half. Nothing else on the board unblocks this much work.
- **Does the aftermath now pop by itself when you play?** You reported on 2026-08-06 that it didn't. Both halves of the cause have since shipped and been browser-verified on your exact repro (opening modals left stacked, multi-step encounter). I closed the ticket on that evidence. **Recommendation:** next time you play a pause-tier encounter, watch whether the ending appears on its own. If it still doesn't, say so and it gets a fresh ticket — the old one's four investigations all describe defects that are now fixed.

## Work in flight
- **THR-818** (GuildQuestPanel hardcodes one faction) — claimed 06:59Z today, 20 minutes old. Healthy, active pickup.
- **THR-860** (WS5 civic seats) — `Parked` behind THR-883's format lock, PR #1114 `DIRTY` and unarmed on purpose. Ninth day; correct, no action.
- **Yesterday's delivery outage is over.** Twelve merges landed since, all six stranded PRs cleared, and the repo now has exactly one open PR (#1114, the deliberate park). THR-1014 — the probe that could not see a run that was never created — shipped as #1330 and is Done.

## Technical gates resolved this run
- **THR-1007** (UI Laws) In Design → **Done**. Its close condition was Christian's ratification of the [P] laws; that happened 2026-08-06 and is recorded three ways — `laws.md:7`'s ratification line, zero laws still marked [P] (all three `[P]` greps are meta-text), and CLAUDE.md binding the Laws into every UI Done-when. The ratification commits named the ticket in prose only, so nothing auto-closed it.
- **THR-1005** (aftermath does not pop) Todo → **Done**. Seam A shipped as #1322 (`main` `15ed6b66`), Seam B as THR-1017 / #1337 (`main` `0d8a8045`, confirmed with `git branch -r --contains`). The previous lane recommended exactly this close and could not perform it; the blocker it was parked behind has since gone Done while still carrying a live `blocks` relation, which is what kept it reading as parked.

## Counts by state
In Dev 2 · Ready for Dev 33 · Todo 29 · In Design 1 · Implementation Planning 0 · Idea 72

## Problems found and fixed
- **Two projects sat in "Now" with zero issues in any active state** — *Encounter Format Migration* (Urgent) and *Agent Success Redesign*. Flagged yesterday, unactioned; both moved to **Next**. Their remaining items are Idea-state follow-ups, so "every issue Done" never fires, but leaving them in "Now" inflates the active-project set that "Finish Before You Start" rule 2 sorts on. Reversible if either restarts.
- **No orphan issues** — every issue across In Dev, Ready for Dev, Todo, In Design and Idea carries a project.
- **Coordination blocks are clean.** Spot-checked the two newest Ready-for-Dev deferrals (THR-1023, THR-1022, both filed 08-07 out of THR-1009); each carries the full three-line block with reasons, plus Done-whens and pillars. THR-836's filing discipline is holding.
- **Roadmap cross-reference: nothing to file.** `.planning/ROADMAP.md` Future Work is fully tracked — Phases 3–5 → THR-54/55/56, TB-095…099 shipped under THR-74/724, M3 → THR-37/68/729, cross-cutting → THR-70/67/68/72, Codex → THR-52.
- **THR-871's defect is dormant, not fixed.** Re-derived its predicate rather than trusting the filed snapshot: today every Ready-for-Dev item is priority Low, deferrals and non-deferrals alike, so no deferral is outranked and the membership set is **empty**. The rule-1 inversion it describes returns the moment a Medium item is promoted. Left in Idea; recording the re-derivation so a future run does not read the stale count of 25.

## Pipeline status
Queue is deep and unblocked: 33 Ready for Dev, none missing a coordination block, one active claim. But note the shape — **every Ready-for-Dev item is Low priority**, because the orchestrator has promoted only deferral and hygiene tail work while all High/Medium feature work waits in Todo behind THR-883. The executor is therefore working a correct queue that contains none of the programme. That is a consequence of the format lock, not a board defect, and it resolves when the sitting happens.

**Recommended next pickup: THR-1022** (RetinuePanel has zero renderers) — rule-1 deferral in the most active project, evidence already gathered, mechanical, and it removes a false claim the IA manifest currently makes about a surface that does not exist. Land it before THR-951/952, which it declares a mutex with. **THR-1023** (ArmySheet / LocationProfileModal dead links) is the next after it.
