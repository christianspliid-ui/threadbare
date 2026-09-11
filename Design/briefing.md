# Briefing
**Generated:** 2026-09-11 01:58 local (2026-09-10 23:58 UTC) · keep-work-flowing-cc

## The one thing

**Name the thing your red borders draw — [Realm, or Nation](https://linear.app/threadbare/issue/THR-1453/ul-proposal-realm-nation-the-landed-faction-that-holds-a-territory-of).**

Same ask as an hour ago, and it just stopped being hypothetical. [The mint landed at 23:38](https://github.com/christianspliid-ui/threadbare/pull/1888): the world now actually contains three of these things, minted one per culture, each named by the map's own name generator, seated at a capital, holding towns, with a court to climb — and one of them is already pursuing territorial expansion.

Their names on seed 42, straight out of the run: **hold of Witness Skyfield** (17 towns) · **march of Shadow-Kept light** (10) · **sovereignty of Open Earth** (6).

The write-up proposes **Realm** over **Nation** and says outright you may veto the headword. A nation is a modern political word; a realm is what a fantasy map draws and what a court sits over. Same object either way — only the word the player reads changes.

**The cost of waiting went up tonight, and that is the only thing that changed.** The code now says *realm* in its own filenames and identifiers. That is cheap to rename tonight while nothing reads it; it gets steadily less cheap as the [realm content](https://linear.app/threadbare/issue/THR-1454) queued behind it — court summons, border levy, tithe — starts being authored against the word.

Two smaller ones want a yes rather than a decision: [**hold**](https://linear.app/threadbare/issue/THR-1449) — your own ruling from yesterday, and already the first word of a realm's name above — and [**cast**](https://linear.app/threadbare/issue/THR-1445).

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

**Starved — 1 job ready, 1 building.** [THR-1155](https://linear.app/threadbare/issue/THR-1155) (realms) holds the single work slot correctly and is moving fast: slice 2's [sweep](https://github.com/christianspliid-ui/threadbare/pull/1887) and [mint](https://github.com/christianspliid-ui/threadbare/pull/1888) both landed in the last 100 minutes, two of slice 2's three parts. The one item behind it is [THR-1053](https://linear.app/threadbare/issue/THR-1053) — the same ticket also-waiting item 3 invites you to veto.

- **One finding worth knowing, no action needed.** The mint run found that **nobody is a subject of a nation** — a realm has no members, so it cannot field an army, because membership is handed out from the old fixed roster that cannot see a realm. The executor wrote it down and made it the next step of its own slice. Caught by running the world for 150 ticks rather than by reading the plan.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) is unblocked work that nothing can reach** — `In Dev` + parked + unowned, so the pickup lane never sees it, for ~10 hours now. No decision is left in it. The grooming lane fixes exactly this and runs at 09:16; an attended session could free it sooner. No action from you either way.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380)** parked awaiting your Done click — also-waiting item 4.

## Health

All green. Deploy is serving the newest commit (`4f0d33ba`), CI and the post-merge heavy-test lane both green on main, no PRs waiting to merge, all nine scheduled lanes on schedule, the worktree reaper ran 18 minutes ago. Engine tick cost **79 ms/tick, 9% below** its 7-day median — the +34% spike two days ago is fully unwound.

Two overnight quiet gaps (18.6 h, 18.1 h) are covered by your "overnight quiet is normal" ruling and are noted, not raised; the unruled weekend one is also-waiting item 12.
