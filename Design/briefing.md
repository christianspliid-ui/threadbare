# Briefing
**Generated:** 2026-09-11 02:57 local (00:57 UTC) · keep-work-flowing-cc

## The one thing

**Name the thing your red borders draw — [Realm, or Nation](https://linear.app/threadbare/issue/THR-1453/ul-proposal-realm-nation-the-landed-faction-that-holds-a-territory-of).**

Third hour with the same ask, and each hour it has cost a little more. This hour the word reached the map.

[The political map moved for the first time](https://github.com/christianspliid-ui/threadbare/pull/1889), merged 02:50. The red border used to be a picture painted before the world started — a decision taken at tick 0 that nothing in the running game could change. It is now drawn from who actually holds which towns: retarget one town to a different holder and **17 hexes of border move on the next frame**. Alongside it, the map's label tier was rewritten and now reads **realm · area · river**.

That is the change since the last brief: *realm* is no longer only in filenames an agent reads. It is the word the map labels itself with.

**The write-up proposes _Realm_ over _Nation_ and says outright you may veto the headword.** The argument is register — a nation is a modern political word; a realm is what a fantasy map draws and what a court sits over. Same object either way; only the word the player reads changes. Vetoing it tonight is a rename. Vetoing it after the [realm content](https://linear.app/threadbare/issue/THR-1454) queued behind it — court summons, border levy, tithe — is a rewrite of shipped prose.

Two smaller ones want a yes rather than a decision: [**hold**](https://linear.app/threadbare/issue/THR-1449) — your own ruling from yesterday, and already the first word of *hold of Witness Skyfield* — and [**cast**](https://linear.app/threadbare/issue/THR-1445).

## Also waiting (12)

- [Delegate the glossary seat, keep a veto?](https://linear.app/threadbare/issue/THR-1453) — seven words wait; three are the ask above. One word retires this permanently.
- [Traits wave 2 — still yours?](https://linear.app/threadbare/issue/THR-790) — the design bench is idle and this is the only thing on it, untouched 27 days.
- [A veto is invited on an encounter quality rule](https://linear.app/threadbare/issue/THR-1053) — the sole reason two written encounters keep being binned; also the only item on the build shelf.
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

**Starved — 1 job ready, 1 building.** [THR-1155](https://linear.app/threadbare/issue/THR-1155) (realms) holds the single work slot and is the fastest-moving thing on the board: three pull requests merged in the last four hours ([sweep](https://github.com/christianspliid-ui/threadbare/pull/1887) 00:28, [mint](https://github.com/christianspliid-ui/threadbare/pull/1888) 01:46, [moving borders](https://github.com/christianspliid-ui/threadbare/pull/1889) 02:50). The one item behind it is [THR-1053](https://linear.app/threadbare/issue/THR-1053) — the same ticket also-waiting item 3 invites you to veto.

- **What is left before realms are finished**, in the executor's own order: conquest (a victor takes the loser's ground), then **subjects** — nobody currently belongs to a realm, so a realm cannot raise an army — then the counts and the sheet lines. That is the rest of slice 2; slice 3 follows. No action from you.
- **One defect fixed on the way, worth a sentence**: seizing a rival's capital silently carried the *court* along with it, so a conquest would have moved a throne it never meant to move. Caught by running the world, not by reading the plan.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) is unblocked work that nothing can reach** — `In Dev` + parked + unowned, so the pickup lane cannot see it, ~12 hours now. No decision left in it. The grooming lane fixes exactly this and runs at 09:16. No action from you.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380)** parked awaiting your Done click — also-waiting item 4.

## Health

All green. Deploy is serving the newest commit (`e7eac1ee`), CI and the post-merge heavy-test lane both green on main, no pull requests waiting to merge, all nine scheduled lanes on schedule, the worktree reaper ran 14 minutes ago. Engine tick cost **87 ms/tick, 1% above** its 7-day median across 74 measurements — flat, and the spike two days ago stays unwound.

The three quiet gaps the lane probe still reports are unchanged from last hour: two overnight-shaped ones covered by your ruling, and the 44.9-hour weekend one that is also-waiting item 12.
