# Briefing
**Generated:** 2026-09-10 22:00 local (20:00 UTC) · keep-work-flowing-cc

## The one thing

**The design seat you were holding is now empty. Do you still intend to design Traits wave 2 yourself?** — [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Last hour this brief said THR-790 was *not* blocking anything, because your [nations and named areas](https://linear.app/threadbare/issue/THR-1155) pass was sitting in the design seat. **That pass finished at 19:52** — plan doc written, three audits passed, handed off as buildable work. The seat is free, and the condition we named has fired.

The design bench takes one job at a time, and this seat has been yours, untouched, since **15 August — 26 days**.

- **"Yes, I'll do it"** — nothing changes and the asking stops.
- **"Not getting to it"** — the seat frees and the next design job starts immediately. *(Only the `Parked` label frees it; unassigning does not.)*

Everything else that could occupy that bench also needs you — the [fight map](https://linear.app/threadbare/issue/THR-1258), the [powers](https://linear.app/threadbare/issue/THR-1232) and [items](https://linear.app/threadbare/issue/THR-1236) sketches. So this one word decides whether design work continues tonight or waits for you.

## Also waiting (11)

- **Should agents be allowed to seat a word in the glossary, with you keeping a veto?** Say *"delegate it"* — or *"send me the six"* to keep the call. Still seven unseated: [Realm](https://linear.app/threadbare/issue/THR-1453) · [hold](https://linear.app/threadbare/issue/THR-1449) · [cast](https://linear.app/threadbare/issue/THR-1445) · [agreement](https://linear.app/threadbare/issue/THR-1441) · [motive gate](https://linear.app/threadbare/issue/THR-1408) · [composition contract](https://linear.app/threadbare/issue/THR-1406) · [motive receipt](https://linear.app/threadbare/issue/THR-633). The queue refills faster than a sitting drains it.
- **NEW — a veto is invited on a quality-rule call.** [THR-1053](https://linear.app/threadbare/issue/THR-1053) — a rule that fails all 191 encounters has binned two written encounters from two batches over three weeks. The orchestrator judged it miscalibrated on measured evidence and put it in the build queue. Full reasoning below under *From the orchestrator*. Nothing is lost if you'd rather rule it yourself.
- **NEW — one Done click, no work behind it.** [THR-1380](https://linear.app/threadbare/issue/THR-1380) — the three words you approved at 18:13 were already shipped eight days ago under another ticket. An executor verified every line against live code, wrote no diff, and parked it. No automated lane may close a ticket, so the click is genuinely yours.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) — sample two of the camp six.** A review, not a gate. [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds).
- **Rule on the backlog** — roughly ten items stop at a question, not a developer. Say *"rule on the backlog"*.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133) — nineteen screen captures owed**, one attended dev-server hour. Nothing technical blocks it.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258) — ten open, all yours.** Best two ways in: [fighting a monster](https://linear.app/threadbare/issue/THR-1263), [two people fighting](https://linear.app/threadbare/issue/THR-1264).
- **Two sketches waiting to be built for you to react to** — [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236).
- **[THR-876](https://linear.app/threadbare/issue/THR-876) — should image-credit spends be gated on you at all?** The same question as the glossary ask, in a different queue.
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198) — what is a run *about*?** Remembrance, or a named campaign the world offers.
- **Are weekend-long quiet spells normal?** You ruled overnight quiet normal; weekends are unruled, so the probe keeps raising the 44.9 h gap from 09-04.

Detail and links for each: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## From the orchestrator

*Folded verbatim from [run o](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10o.md) — its words, not this lane's:*

> **The build queue emptied this hour, and then refilled — with a piece of work that has been sitting one comment away from ready for 26 days.**
>
> There is a quality check that every encounter must pass before it ships. One of its rules demands that authors hand-label every game concept mentioned in an aftermath — the little "here's what changed in the world" panel at the end of an encounter. **That one rule fails all 191 encounters in the game**, and it is the single reason two written encounters — *Snow on the Pass* and *Riders Behind the Caravan* — have been thrown out of two consecutive content batches over about three weeks.
>
> **It probably is not right.** Back on 15 August someone checked the actual code and found the game *already* does that labelling automatically — the rule is asking authors to hand-write something the machine does for free. They wrote that finding on the ticket, with the exact file and line numbers, and then stopped, because changing the rule brushes up against a ruling you made and they did not want to overstep.
>
> **The call you may want to veto:** I treated "is this quality rule calibrated correctly?" as a *tuning* question the agents can settle from evidence, not a *creative* question about what the game should be. That matches what you told us on 12 August — calibration is ours, decide and invite a veto rather than block. But it does touch your earlier "no exemptions" ruling, so you should know I made it. **If you would rather rule on this one yourself, say so and it comes straight back out of the queue.** Nothing is lost either way — the ticket is not claimed yet.

## Queue

**The shelf refilled from empty this hour — two items, both real work.**

- **[THR-1155](https://linear.app/threadbare/issue/THR-1155) — nations and named areas, High.** Your 18:26 design pass landed at 19:52: [plan doc merged](https://github.com/christianspliid-ui/threadbare/pull/1885), intent judge Allow, all three audits passed, three ordered build slices. Buildable now; nothing owed by you.
- **[THR-1053](https://linear.app/threadbare/issue/THR-1053) — the encounter quality rule, Medium.** Promoted 19:32 with the veto invitation above.
- **Still unreachable where it stands:** [THR-1130](https://linear.app/threadbare/issue/THR-1130) — batch 3 of the encounter retrofit, High, genuinely unblocked — sits as `In Dev` + `Parked` + unassigned (~14 h). The executor lane only reads `Ready for Dev`, so no lane can see it. **Nothing is owed by you** — a session or tomorrow's grooming pass unparks it. Flagged for the third hour running.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380)** is parked awaiting your Done click, not awaiting work.

## Health

- **Engine tick cost came back clean.** Last hour's 114 ms / +34% reading was the busy machine, not a regression: this hour measures **97 ms/tick, +14% above the 7-day median** — under the line that raises a flag. No look needed.
- Everything else green: the live site is serving `main`, automated checks healthy, no PRs waiting to merge, all 9 scheduled lanes on schedule, the stale-git reaper ran 20 minutes ago, and "Heavy simulation tests" is green on the latest `main`.
