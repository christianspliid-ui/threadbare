# Briefing
**Generated:** 2026-09-11 06:00 local (04:00 UTC) · keep-work-flowing-cc

## The one thing

**Name the thing your red borders draw — [Realm, or Nation](https://linear.app/threadbare/issue/THR-1453/ul-proposal-realm-nation-the-landed-faction-that-holds-a-territory-of).**

Sixth hour, same ask, and this hour it stopped being a map word. [The map and the sheet say the same thing](https://github.com/christianspliid-ui/threadbare/pull/1892) merged at 05:48 and **closes slice 2**: until now the border was the only thing in the game that knew a realm held a town. Click that town and its own page said nothing; open the hex and it would list four guilds with people standing there and never name the nation whose border it sat inside.

Now both read **Held by — <name>**, with the holder's sigil and a link. Ground nobody holds says *Unclaimed* as a word, because a border stopping is a designed fact, not a blank. Checked headlessly across every held settlement at once: **33 checked, 0 disagreements** between what the map draws and what the sheet says.

So the word you have not yet picked is now printed on the location profile and the hex chronicle, on top of the map's label tier — three player-facing surfaces, plus three named things the world contains: *hold of Witness Skyfield* (17 towns) · *march of Shadow-Kept light* (10) · *sovereignty of Open Earth* (6).

**The write-up proposes _Realm_ over _Nation_ and says outright you may veto the headword.** The argument is register: a nation is a modern political word; a realm is what a fantasy map draws and what a court sits over. Same object either way — only the word the player reads changes. Vetoing now is a rename. Vetoing after the [realm content](https://linear.app/threadbare/issue/THR-1454) queued behind it — court summons, border levy, tithe — is a rewrite of shipped prose.

Two smaller ones want a yes rather than a decision: [**hold**](https://linear.app/threadbare/issue/THR-1449) — your own ruling from 10 September, already the first word of *hold of Witness Skyfield* — and [**cast**](https://linear.app/threadbare/issue/THR-1445).

## Also waiting (12)

- [Delegate the glossary seat, keep a veto?](https://linear.app/threadbare/issue/THR-1453) — seven words wait; three are the ask above. One word retires this permanently.
- [Traits wave 2 — still yours?](https://linear.app/threadbare/issue/THR-790) — the design bench is idle and this is the only thing on it, untouched 27 days.
- [A veto is invited on an encounter quality rule](https://linear.app/threadbare/issue/THR-1053) — the sole reason two written encounters keep being binned. One of three items on the build shelf.
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

**Healthy — 3 jobs ready, 1 building.** Unchanged in count since the last brief; nothing stalled and nothing new was needed.

- **[THR-1155](https://linear.app/threadbare/issue/THR-1155) (realms) holds the single work slot and closed slice 2 this hour** — six pull requests merged in seven hours ([sweep](https://github.com/christianspliid-ui/threadbare/pull/1887) 00:28, [mint](https://github.com/christianspliid-ui/threadbare/pull/1888) 01:46, [moving borders](https://github.com/christianspliid-ui/threadbare/pull/1889) 02:50, [conquest](https://github.com/christianspliid-ui/threadbare/pull/1890) 03:32, [the court](https://github.com/christianspliid-ui/threadbare/pull/1891) 04:56, [map and sheet agree](https://github.com/christianspliid-ui/threadbare/pull/1892) 05:48). Slice 3 next. No action from you.
  - Worth knowing, because it was found rather than predicted: the check written to catch a *future* mistake caught an existing one. A monster faction seizing a lair also takes ground, and nothing told the map — so the border was one rebuild late and the world's distance reasoning was blind to a faction that had just taken a place. It predates the realm work entirely; it is fixed.
- **[THR-1456](https://linear.app/threadbare/issue/THR-1456) is still the most serious thing on the shelf** — monster-raid content meant to knock a town's prosperity down by a few points instead writes the instruction itself into the number, so prosperity and defence come out as nonsense rather than as damage. High priority, queued, unclaimed, no decision in it.
- **[THR-1455](https://linear.app/threadbare/issue/THR-1455)** — the hex sidebar shows an area's type as a raw code word and its size as a bare numeral. Waiting.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130) is unblocked work that nothing can reach** — `In Dev` + parked + unowned, so the pickup lane cannot see it, ~15 hours now. Its park is discharged: the thing it waited on shipped, and both branches of its question now lead to the same action. The grooming lane fixes exactly this and runs at 09:16.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380)** parked awaiting your Done click — also-waiting item 4.

## Health

All green. The live site is already serving the commit that merged eleven minutes ago (`587626f8`); CI and the post-merge heavy-test lane are both green on main; no pull requests are waiting; all nine scheduled lanes are on schedule; the worktree reaper ran at 05:40. Engine tick cost measured **100 ms/tick, 16% above its 7-day median** across 77 measurements — inside the band that would flag it, and no session is needed.

The three quiet gaps the lane probe reports are unchanged: two overnight-shaped ones covered by your ruling, and the 44.9-hour weekend one that is also-waiting item 12.
