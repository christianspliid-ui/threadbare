> **title:** A world with a past — brainstorm companion — THR-1631
> **linear_issue:** THR-1631
> **author:** Claude Code (design lane, run 2026-09-28a)
> **created:** 2026-09-28

# A world with a past — brainstorm companion

Companion to `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md`. It records the alternatives the plan weighed, the tensions it holds, and the Vision premises it leans on.

## The shape Christian chose

Option A of [A world with a past](https://linear.app/threadbare/issue/THR-1591): *explain the map*. Option B (flavor only) was rejected because the past then feeds nothing. Option C (a simulated deep history) was rejected because it costs worldgen time and produces facts no system reads. This plan does not reopen that choice; everything below is the *how*.

## Alternatives weighed

### Where the past lives

- **A new `GameState.worldPast` field.** Simple to read, but it edits `gameState.ts` (hundreds of importers), must be threaded through saves, and duplicates facts that are already graph-shaped (a war is an event; a dead commander is an actor). Rejected.
- **The Great Chronicle, as volume zero.** The decision allowed it. But its only writer is cycle end and no component reads it, so using it would mean building a volume UI to show one chapter. Rejected for now; nothing here prevents a later volume UI from reading `readWorldPast`.
- **The graph plus a pure selector (chosen).** Events, dead actors and edges already exist as shapes; the selector is the one place that assembles the chapter, and the UI and the debug bridge read the same selector, so they cannot drift.

### How ages read

- **Numerals** ("456 years ago"), as in the decision's example. Law 13 forbids raw magnitudes on player surfaces, and the THR-1426 ruling already turned tick timestamps into elapsed spans.
- **An adverb ladder** ("long ago", "in living memory"). Christian's verdict on `grew steadily` rules out adverb ladders for "how much?".
- **A unit that stays inside `countWord` (chosen):** years under ten, then decades, then centuries, rounded. "About four centuries ago" is a bound in a unit, which is the reading `elapsedLabel` already uses.

### Who founded what

- **A named founder for every settlement:** 47–67 dead actors, breaking the decided 5–10.
- **Founders for capitals only (chosen):** 3–4 founders, the ones the chronicle names first. Every other settlement still gets its date.

### What counts as "found"

- **A new visited-places store.** More state, and a second answer to a question fog already answers.
- **Fog's own memory (chosen):** `visible` or `remembered` is a visit; `hexRevelation.ruins` (Find actions) and Perceive are the other route. A specific never un-learns itself because `remembered` persists.

### Past-fed ambitions

- **Mint on ordinary townsfolk.** They have no agency path, so the ambition would sit inert, and a pull into the spotlight would widen the deciding headcount against THR-1348. Rejected.
- **Mint on protagonists only, with free slots (chosen).** They already decide; the ambition becomes something they act on.
- **`reclaim_homeland` from descent.** Its rule needs a living culprit who seized a holding. A dead empire has none, and inventing one (the Realm that holds the land now) is a creative stretch the decision did not make. Descent is written so a future rule can read it; the rule is a deferral.

## Tensions held

- **Common knowledge vs discovery.** The outline is public so the first screen has a past; the specifics are found so Perceive and exploring have something to reward. The line between them is the delegated sub-call, implemented as stated.
- **Liveness vs budget.** Every per-tick event scanner walks all events, so the past stays at six. The elder war carries its 21 sites as edges on one event.
- **Dead among the living.** Seeding dead actors into settlements risks every sweep that forgets `deceased`. The plan writes the same shape as run-time death, and S1's heavy test proves no seeded dead is ever treated as living.

## Vision premises invoked

- The north star's "a handful of mortals they know by name": the past gives some of them a reason (revenge, a legend to chase).
- Fog of war as a design pillar: specifics are found.
- Game prose, not novel prose: every line is plain, past tense, GM register.
- Everything is a graph node or edge.
