# Briefing
**Generated:** 2026-09-11 00:57 local (2026-09-10 22:57 UTC) · keep-work-flowing-cc

## The one thing

**Name the thing your red borders draw — [Realm, or Nation](https://linear.app/threadbare/issue/THR-1453/ul-proposal-realm-nation-the-landed-faction-that-holds-a-territory-of).**

Unchanged from an hour ago, and more load-bearing now than it was then: the realm code kept building while you were away. Slice 1 shipped tonight; [slice 2's first half merged at 22:20](https://github.com/christianspliid-ui/threadbare/pull/1887) — a realm can now carry a real faction identity, which is what lets the world act on it at all.

The write-up proposes **Realm** over **Nation** and says outright you may veto the headword. A nation is a modern political word; a realm is what a fantasy map draws and what a court sits over. Same object either way — only the word the player reads changes. Two smaller ones want a yes rather than a decision: [**hold**](https://linear.app/threadbare/issue/THR-1449) (your own ruling this morning, written up) and [**cast**](https://linear.app/threadbare/issue/THR-1445).

The realm content — court summons, border levy, tithe — is queued directly behind the code. A word seated now costs a minute; a word seated after that content is authored means re-reading prose that already shipped.

## Also waiting (12)

- [Delegate the glossary seat, keep a veto?](https://linear.app/threadbare/issue/THR-1453) — seven words wait; three of them are the ask above. One word retires this permanently.
- [Traits wave 2 — still yours?](https://linear.app/threadbare/issue/THR-790) — the design bench is idle and this is the only thing on it, untouched 27 days.
- [A veto is invited on an encounter quality rule](https://linear.app/threadbare/issue/THR-1053) — it is the sole reason two written encounters keep being binned; it is also the only item on the build shelf.
- [One Done click, no work behind it](https://linear.app/threadbare/issue/THR-1380) — the three words you approved had already shipped; nothing is left in it.
- [Sample two of the camp six](https://linear.app/threadbare/issue/THR-1130) — your standing 2-of-6 rule still owes a verdict. Blocking nothing.
- [Rule on the backlog — one sitting, smallest first](https://linear.app/threadbare/issue/THR-1189) — ~10 items stop at a question rather than a developer.
- [The screenshot sweep wants an attended hour](https://linear.app/threadbare/issue/THR-1133) — 19 captures, one dev-server session; unstuck since 4 September.
- [The fight map — ten open, every one yours](https://linear.app/threadbare/issue/THR-1258) — all research done; two are the head.
- [Two sketches ready to build for you to react to](https://linear.app/threadbare/issue/THR-1232) — [spells](https://linear.app/threadbare/issue/THR-1232) and [items](https://linear.app/threadbare/issue/THR-1236); your reaction is the decision.
- [Image credits — should the spend be gated on you at all?](https://linear.app/threadbare/issue/THR-876) — five quarantined plates, everything settled but the credit spend.
- [What is a run *about*?](https://linear.app/threadbare/issue/THR-1198) — remembrance, or named campaigns. Nothing downstream waits.
- [Are weekend-long quiet spells normal too?](https://linear.app/threadbare/issue/THR-1077) — you ruled overnight quiet normal; weekends are still unruled, so the probe keeps raising them.

## Queue

**Starved — 1 job ready, 1 building.** [THR-1155](https://linear.app/threadbare/issue/THR-1155) (realms) is mid-build on slice 2 of 3 and holding the single work slot correctly. The one item behind it is [THR-1053](https://linear.app/threadbare/issue/THR-1053) — the same ticket also-waiting item 3 invites you to veto.

- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) is unblocked work that nothing can reach.** Its park was discharged by events at 13:32Z — the ticket it waited on shipped, and both answers to its question now lead to the same action, so no decision is left in it. But it sits `In Dev` + parked + unowned, and the pickup lane only reads the ready queue, so it has been invisible for ~9 hours. The grooming lane fixes exactly this and runs at 09:16 tomorrow; an attended session could free it sooner. No action from you either way.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380)** parked awaiting your Done click — also-waiting item 4.

## Health

All green. The post-merge heavy-test lane that was red an hour ago is green on the latest main. Deploy is serving `135a1de0`, CI green, no PRs waiting to merge, all nine scheduled lanes on schedule, the worktree reaper ran 17 minutes ago. Engine tick cost 91 ms/tick, +5% against its 7-day median — normal.
