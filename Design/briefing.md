# Briefing
**Generated:** 2026-09-10 23:58 local (21:58 UTC) · keep-work-flowing-cc

## The one thing

**Name the thing your red borders draw — [Realm, or Nation](https://linear.app/threadbare/issue/THR-1453/ul-proposal-realm-nation-the-landed-faction-that-holds-a-territory-of).** One word, and two smaller ones behind it.

Tonight your nations pass stopped being a drawing. [Slice one shipped and is live](https://github.com/christianspliid-ui/threadbare/pull/1886) — the borders on the map are now a political thing the world can act on. Two slices to go, and the first realm content — a court summons, a border levy, a tithe — is queued behind them.

That content has to be written in *some* word. The write-up proposes **Realm** over **Nation** on register grounds: a nation is a modern political word, a realm is what a fantasy map draws and what a court sits over. Same object either way — only the word the player reads changes, and the write-up says outright you may veto the headword.

Two more are already settled in substance and just want a yes: [**hold**](https://linear.app/threadbare/issue/THR-1449) — a town a mortal keeps by *working* it, which is your own ruling from this morning — and [**cast**](https://linear.app/threadbare/issue/THR-1445), a god playing an action card, plus the odds-reading the player sees before the dice.

*— raised by the orchestrator lane, 21:35Z*

## Also waiting (12)

- **Do you still intend to design Traits wave 2 yourself?** — [THR-790](https://linear.app/threadbare/issue/THR-790). Yours, untouched, since 15 August (26 days); the design bench is idle behind it. *(Only the `Parked` label frees it; unassigning does not.)*
- **Should agents be allowed to seat a word in the glossary, keeping you a veto?** The ask above is three of seven waiting words. Say *"delegate it"* and the rest stop reaching you.
- **A veto is invited on an encounter quality rule that fails all 191 encounters** — [THR-1053](https://linear.app/threadbare/issue/THR-1053). The orchestrator judged it gate calibration and queued the fix. Say the word and it comes back out.
- **One Done click, no work behind it** — [THR-1380](https://linear.app/threadbare/issue/THR-1380). Verified against live code, no diff written, parked for the close.
- **Sample two of the camp six** — [Ward the Camp](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) · [Tend to Wounds](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds). Not blocking anything.
- **Rule on the backlog** — roughly ten items stop at a question, not a developer. Say *"rule on the backlog"*.
- **The screenshot sweep wants an attended hour** — [THR-1133](https://linear.app/threadbare/issue/THR-1133). Nineteen captures, one dev-server session, nothing technical blocking it.
- **The fight map — ten open, every one yours** — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258). Best ways in: [fighting a monster](https://linear.app/threadbare/issue/THR-1263), [two people fighting](https://linear.app/threadbare/issue/THR-1264).
- **Two sketches ready to be built** — [twenty spells](https://linear.app/threadbare/issue/THR-1232), [thirty items](https://linear.app/threadbare/issue/THR-1236). Your reaction is the design decision.
- **Should image-credit spend be gated on you at all?** — [THR-876](https://linear.app/threadbare/issue/THR-876). Same question as the glossary one, in a second queue.
- **What is a run *about*?** — [THR-1198](https://linear.app/threadbare/issue/THR-1198). Remembrance, or named campaigns. Nothing downstream waits.
- **Are weekend-long quiet spells normal too?** You ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising them. One word retires it.

Detail and links for all of these: [Design/user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**Starved — 1 ready.** One job in flight, correctly; this is a bench problem, not a queue problem.

- **In flight:** [THR-1155](https://linear.app/threadbare/issue/THR-1155) (nations and named areas). **Slice 1 of 3 merged and deployed** since the last brief — [PR #1886](https://github.com/christianspliid-ui/threadbare/pull/1886) is live on the site. Slices 2 and 3 to come.
- **On the shelf:** [THR-1053](https://linear.app/threadbare/issue/THR-1053) only — the item under veto above. It has sat through two executor windows unclaimed, which the orchestrator checked and cleared: not a refusal, just WIP = 1 behind a live build.
- **Unreachable, and it should not be:** [THR-1130](https://linear.app/threadbare/issue/THR-1130) is High-priority, its blocker cleared this morning and its park was discharged at 15:32 — but it still sits `In Dev` + `Parked` + unassigned, the one shape the pickup queue never looks at. The daily grooming lane owns that unpark and runs tomorrow morning. Nothing is owed by you.

## Health

- **"Heavy simulation tests" is red on the latest `main`** (~1 h). This is the non-required post-merge lane, so nothing is blocked and no PR is held; a session owes a follow-up fix. Last night's brief recorded it as cleared — it has since gone red again. **Not yours** — flagged here so it is not lost.
- Everything else green: site serving the latest commit (`716eddde`), CI green on `main`, all three background jobs running, no PRs waiting, all nine scheduled lanes on time, worktree reaper fresh (23:40, 3 items needing disposition).
- Engine tick cost **89 ms/tick, +3%** on its week's median — down from +16% last hour, well under the flag line.
