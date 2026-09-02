# Briefing
**Generated:** 2026-09-02 11:55 local (09:55 UTC) · keep-work-flowing-cc

> **Nothing new needs you this hour.** Same list as last hour, same lead ask. One correction below: the reactive loop is longer than the last two briefings said — it has **seven** slices, not five, and six are done or in flight.

## The one thing

**Say one word about two design tickets, and the design shelf unjams.**

Unchanged, and now **14 and 18 days** old. Two items sit in the design column with nobody working them, and the rule that stops agents piling more in is a limit of one — so the shelf stays jammed by two things that are not moving.

- [Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — 14 days, nobody assigned. Your own 6 August note.
- [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — 18 days, **assigned to you**.

**Either sit one of them, or say *"drop them back to the queue"* and an agent clears the jam.** One word either way. Neither asks what the game should *be* — both just need an attended session.

**The machine has started building its own release valve, and it does not replace your word.** An agent filed [a fix for the jam itself](https://linear.app/threadbare/issue/THR-1382/a-dead-in-design-item-consumes-the-design-staging-budget-forever) — nothing currently times out the design column the way an abandoned build claim gets swept after a few days, so a dead item holds the slot forever. That is a sensible piece of plumbing and it is High priority. But it only stops the *next* jam; these two tickets are not dead, they are yours, and a timeout would either wrongly bin your work or correctly leave it exactly where it is.

## Also waiting (10)

- **[Approve encounter batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)** · seven written encounters unable to start, standing 9 days. Play [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) and [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) (~5 min), then read [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) and say *"seven is fine"*, *"keep it six"*, or *"judge batch 2 on one first"*. Full detail: [user-actions §1](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **[THR-1314](https://linear.app/threadbare/issue/THR-1314/ul-proposal-work-holding-kind-row-christening-failure-name-register)** · **shipped** — what a character owns now reads **freehold** to the player; *holding* keeps every other sense. Veto still open, four lines to reverse.
- **[Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** · nine questions open, all yours, every research question finished. Say *"work the fight map"*.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) / [thirty items](https://linear.app/threadbare/issue/THR-1236)** · two sketches to build for you to react to. Say *"work the powers map"* or *"work the item map"*.
- **[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** · the real question is whether image spends should be gated on you at all, or decided by a lane and reported after.
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)** · does a run's spine come from what your god remembers, or from a named campaign? No urgency.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** · one attended dev-server sitting; nineteen owed screenshots. Bundles into whichever sitting you approve a brief in.
- **[THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)** · should committing a nudge be followed by a ~1.6s held breath? Two lanes recommend no; retired unless you say otherwise.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** · advice is to wait one cycle — your slice checkpoint is its entry condition.
- **A Tenacious-style trait** · parked, no ticket, nothing waits on it. Listed so it is not silently forgotten.

## Queue

**Two items on the build shelf, one being built, nothing needing you.**

- **Being built now:** [the reactive loop](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) — how outcomes give mortals new drives: grudges, grievances, the culprit who caused it. **A correction to the last two briefings:** this is a seven-slice build, not five. Slices 1–5 are merged and live; [slice 6](https://github.com/christianspliid-ui/threadbare/pull/1768) is in a pull request, armed and set to merge itself on green. Slice 6 is the one that lets a feud *end* — until now nothing could satisfy a grievance and every reprisal minted a fresh one, so a vendetta could only grow. One slice remains after it.
- **On the shelf, unclaimed:** [the calling & the surfaces](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56), plus the design-column timeout named in the lead ask. Neither has been claimed because an agent is already building the reactive loop and the rule is one job at a time — that is the rule working, not a miss.
- Three items sit In Dev and all three are **deliberately parked**, not stalled: [the pixel-pass sweep](https://linear.app/threadbare/issue/THR-1133) (waits on your dev-server sitting), [the batch-2 sibling volume ticket](https://linear.app/threadbare/issue/THR-1130) (waits on the batch-2 approval), [the audio moments](https://linear.app/threadbare/issue/THR-1168) (waits on your feel call). Each is already on the list above; none needs freeing.
- Nothing stale beyond the two design-column items in the lead ask, and no In-Dev item is silently blocked.

## Health

**Green.** The live site is up to date — the commits since the last publish touched only notes and docs, so no rebuild was needed. Automated checks and both background jobs are healthy, the one open pull request is armed and waiting on green, and all nine scheduled tasks are on schedule. The branch reaper ran at 11:40. This week's [workflow retro](https://github.com/christianspliid-ui/threadbare/pull/1767) merged at 11:22.

- **The lane-silence probe still reads red for two closed sleep gaps.** The 58-hour gap (Sunday morning → Tuesday evening) and Monday night's 11.7 hours are the same cause: the machine was off. Per your 8 August ruling that overnight quiet is normal, **neither is a question for you** — this line is visibility only, and it will keep appearing until the agent-side tidying below is done.
- One piece of agent-side tidying, still outstanding: the pause marker the probe reads holds an expired window from 3 August, which is why it keeps reporting *"no pause recorded"* against sleeps that were never pauses. Housekeeping for a lane, not a decision for you.
