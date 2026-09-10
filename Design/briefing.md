# Briefing
**Generated:** 2026-09-10 21:00 local (19:00 UTC) · keep-work-flowing-cc

## The one thing

**Should agents be allowed to seat a word in the glossary, with you keeping a veto?**

Say **"delegate it"** — or **"send me the six"** if you'd rather keep the call.

You seated three words yourself in chat at **18:13** today (*calling*, *moment*, *follow* — [THR-1380](https://linear.app/threadbare/issue/THR-1380)). Thirteen minutes later, at **18:26**, your own nations design pass filed a new one: [**Realm**](https://linear.app/threadbare/issue/THR-1453) — the landed faction that holds a territory and gets drawn as a border on the map.

That is the whole argument, and it is measured rather than asserted. **The queue refills faster than a sitting drains it.** Seven now wait, and only a human may seat one, so they cannot clear themselves:

[**Realm**](https://linear.app/threadbare/issue/THR-1453) (today) · [**hold**](https://linear.app/threadbare/issue/THR-1449) (1 day) · [**cast**](https://linear.app/threadbare/issue/THR-1445) (1 day) · [**agreement**](https://linear.app/threadbare/issue/THR-1441) (2 days) · [**motive gate**](https://linear.app/threadbare/issue/THR-1408) (6 days) · [**composition contract**](https://linear.app/threadbare/issue/THR-1406) (7 days) · [**motive receipt**](https://linear.app/threadbare/issue/THR-633) (67 days)

The glossary is the tie-breaker when the code, the docs and an agent disagree about a word — so an unseated word is a word the project cannot settle an argument about. You have already delegated gate calibration and test calibration on exactly this shape: *the lane decides, you keep a veto*. One word here retires this ask permanently instead of hourly.

## Also waiting (9)

- **[THR-790](https://linear.app/threadbare/issue/THR-790) — do you still intend to design Traits wave 2 yourself?** *Correcting what the last eight briefs told you:* this is **not** blocking anything today. You put [nations](https://linear.app/threadbare/issue/THR-1155) into the design seat at 18:26 and it is being worked. THR-790 becomes the blocker again when that finishes — possibly within the day — but not now.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) — sample two of the camp six.** A review, not a gate. [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds).
- **Rule on the backlog** — ~eleven items stop at a question, not a developer. Say *"rule on the backlog"*. (One more settled itself today: [the spotlight tier](https://linear.app/threadbare/issue/THR-1348) — you ruled it yourself at 18:12.)
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133) — nineteen screen captures owed**, one attended dev-server hour. Nothing technical blocks it.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258) — ten open, all yours.** Best two ways in: [fighting a monster](https://linear.app/threadbare/issue/THR-1263), [two people fighting](https://linear.app/threadbare/issue/THR-1264).
- **Two sketches waiting to be built for you to react to** — [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236).
- **[THR-876](https://linear.app/threadbare/issue/THR-876) — should image-credit spends be gated on you at all?** The same question as the lead ask, in a different queue. If you answer one, say whether it settles both.
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198) — what is a run *about*?** Remembrance, or a named campaign the world offers.
- **Are weekend-long quiet spells normal?** You ruled overnight quiet normal; weekends are unruled, so the probe keeps raising the 44.9 h gap from 09-04.

Detail and links for each: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**The shelf is empty in substance, and nothing is in flight.** [THR-1452](https://linear.app/threadbare/issue/THR-1452) went Done at 18:34 — the last buildable item.

- **One item on the shelf, and it is not work.** [THR-1380](https://linear.app/threadbare/issue/THR-1380) is the three words you approved at 18:13 — but the orchestrator checked `main` and the entries are **already there**, shipped eight days ago under another ticket. The pickup is a verify-and-close with no diff, not an authoring pass. Nothing is owed by you; your approval was real and is what lets it close.
- **Real work exists but no lane can see it.** [THR-1130](https://linear.app/threadbare/issue/THR-1130) — batch 3 of the encounter retrofit, High, genuinely unblocked since [THR-1446](https://linear.app/threadbare/issue/THR-1446) shipped at 09:52 — sits as `In Dev` + `Parked` + unassigned (~11 h). The executor lane only looks at `Ready for Dev`, so it is invisible where it stands. **Nothing is owed by you** — a session or tomorrow morning's grooming pass unparks it. Flagged for the second hour running.
- New program supply is coming from the nations design pass you started at 18:26.

## Health

- **Engine tick cost is drifting again.** Probe's words: *"tick cost 114 ms/tick steady, 34% above the 7-day median (85, 68 rows since d8861ca6); top phase agent_decision, 492 agents. Name the merges between d8861ca6 and 4d0b3bee: `git log --oneline --merges d8861ca6..4d0b3bee`"* — a session's job, not yours. Four readings crossed this line earlier today and then came back clean, so this may again be a busy machine rather than a regression; it needs one look, not a decision.
- **The red heavy-test run cleared itself.** Last hour's amber is gone — "Heavy simulation tests" is green on the latest `main`.
- Everything else green: the live site is serving `main` ([`4d0b3bee`](https://github.com/christianspliid-ui/threadbare/commit/4d0b3bee418b4ed2b34b9338c99a2fef1e110556)), automated checks healthy, no PRs waiting to merge, all 9 scheduled lanes on schedule, the stale-git reaper ran 20 minutes ago.
