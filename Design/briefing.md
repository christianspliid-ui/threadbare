# Briefing
**Generated:** 2026-08-17 21:57 local (19:57 UTC) · keep-work-flowing-cc

## The one thing

**Play two encounters and say whether they are worth meeting a second time. Your condition is met — this lane checked rather than took anyone's word for it.**

You said the sample does not come back until the prose re-pass and the state-first chip copy are visibly live on these two. That landed and deployed while you were away. The live site is serving the build that contains it.

**The Grateful Kin** — the one whose bond chip you said did not communicate a state change.
[Play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [the good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [the bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)

**The Unsafe Bridge** — the one that prompted your "prose and chips are one package" ruling.
[Play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [the good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [the costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

What is different since you last played them. The bond chip said "the roof they are owed" and, when clicked, opened *you* rather than the person who owes the favour — it now says a favour is owed and opens the debtor. Fifteen chips that reported numbers you cannot see anywhere in the game are gone; you flagged one, and the hunt for the pattern found fourteen more. And the prose carries fewer things at once — one named person on stage, objects only where you can actually act on them.

**The question is just: are these two worth meeting a second time?** A yes releases the next nine encounters. A no tells the writer what the bar is still missing before nine more get written against it. Either answer moves it; the ticket is [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), and it is sitting parked waiting on exactly this.

## Also waiting (3)

- **One attended design hour — [the shared machinery](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) (Urgent).** Last hour's lead ask, unchanged and still true: your acted-on ruling needs writing up as the plan builders work from, and [wave-1 ordering](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) plus [the second-seam prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) are queued behind it. Say *"design the shared machinery."* It is demoted this hour only because the encounter verdict costs you five minutes and unparks work already in flight — not because it matters less.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one dev-server session, ~30 min, six surfaces, 13 screenshots.** Unchanged. Still the only ticket a scheduled run structurally cannot discharge.
- **A Tenacious-style trait stays parked** — an open design option, no ticket, nothing downstream waiting. Listed so it is not silently forgotten.

## Queue

**4 ready, 1 in dev.** Two changes this hour, both healthy.

- [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (High) — **in dev, unassigned since 20:03 local (~1h50m).** Batch 1 shipped and merged; the park is the ticket waiting on your verdict above, not a stall.
- [THR-1032](https://linear.app/threadbare/issue/THR-1032/two-debug-aftermath-accessors-cannot-see-the-ascendant-avatar) (Low) — **new this hour.** Two review tools cannot find the avatar. Re-checked before promoting and found *wider* than filed: the name-match path is dead for every character in the game, not just the avatar.
- [THR-1091](https://linear.app/threadbare/issue/THR-1091/converted-reach-specific-templates-have-no-polarity-guard) (Low) — 24 converted templates with no machine check on their pole binding.
- [THR-1049](https://linear.app/threadbare/issue/THR-1049/prototype-disposition-encounterscreen-castrail-casttile) (Low) — four styleguide-only prototype components: wire or retire.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) (Low) — the attended sweep above.

[THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) shipped this hour — the lair rule that excluded itself is fixed. Supply is still thin on program work and healthy on cleanup: every ready item is Low-priority cleanup, and the one substantive ticket in flight is waiting on you rather than on an executor. That is the shape the design-hour ask above describes.

## Health

- **All probes green.** The live site serves the newest merge (`076e5146`), automated checks, background jobs, scheduled-task heartbeats and the merge queue are all normal; no PRs are waiting. The git reaper ran 17 minutes ago. Home tree is on `main`, current and clean.
- **Lane silence:** the probe still reports the same historical overnight gaps (worst 20.6 h, 10–11 Aug), unchanged. Declined per your 2026-08-08 ruling that overnight quiet is normal; visibility only, nothing ongoing.
