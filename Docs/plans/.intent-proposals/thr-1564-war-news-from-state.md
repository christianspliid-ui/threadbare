# Action Proposal — War news from state (THR-1564)

## intent_quote

> go

(Christian, chat, 2026-09-24, answering the session's recommendation: *"I do the first two now on my own"*, the first two being THR-1562 and THR-1564 in the list of next designs.) The ticket (filed by this session this morning, from the THR-1528 research) states the scope: *"Write war news from state, not traces … Pick the one source of truth per line … Keep the visibility rules … Tests: with tracing disabled, a seeded battle and a territory change each produce their player-facing TickEvent."*

## scope (what this plan does)

- **Report at the site.** Every war writer reports its event through one function, `reportWar`, which judges visibility with the existing threaded set, builds a line in the game's register, and pushes a `TickEvent` in the same tick.
- **Seven sites:** army raised, army breaks apart, army fraying, battle joined, siege laid, battle or siege ends, town changes hands.
- **Retire the trace-reading phase.** Traces stay for debug.
- **Loudness, decided under rule 4 with a veto invited:** every battle ending and every town changing hands reaches the chronicle; beginnings reach it only when threaded.
- **The canon becomes true:** three rulebook sentences, and one UL correction.

## scope (what this plan does NOT do — explicit non-goals)

- No toasts or modals for war lines.
- It does not wire the dead siege-breach writer.
- It does not report warhosts (`raiseWarhostForce` emits nothing today).
- It does not unify the three "threaded" predicates.
- No new `GameState` field, and no new event types.

## impact_class

Reversible. A lever returns strangers' endings to quiet; the retired phase can be restored from git; no data shape changes.

## evidence cited

- **Linear issue:** THR-1564 (and THR-1528, whose chronicle line interacts).
- **Vision premises:** `Vision/00-north-star.md:43`, `Vision/02-non-negotiables.md:23`, `03-design-tensions.md:55-64`.
- **UL terms touched:**
  - *Narrative Event* and *Chronicle Entry* (`Docs/ubiquitous-language/Prose.md`): the first is corrected;
  - *Realm* (read).
- **Canon consulted:** `Docs/canon/rulebook.md:372`, `:382`, `:384`, `:386`; `Docs/canon/rulebook-quick-reference.md`.
- **Research measurements** (seed 42, medium, 200 ticks, four arms): tracing off gives 0 lines; tracing on gives 31 lines with 0 visible; 13 army raisings produce 0 lines.
- **Rejected approaches:**
  - always-on tracing (performance, ring eviction, keeps the other defects);
  - a `pendingWarNews` queue (a `GameState` field, a one-tick delay, and the visibility snapshot still needed at the site).

## load-bearing decisions touched

- "The world graph is mutated in place": the call sites push into `state.tickEvents` in place, like `revelationEmitter`.
- "Everything is a graph node/edge": not touched. News is tick events, not world state.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (135 importers): one additive member. Blast Radius section present.

## kill criteria

- More than three strangers' battle endings a day on a large map, or a chronicle mostly of war: turn the lever off and report.
- Any war line with a digit: fix the line.
- Tracing on and off produce different lines: a report depends on a trace; that is a defect.

## explicit user sign-off

Not required (Reversible). The loudness choice is presented to Christian in chat with a veto invited, and recorded on THR-1564.

## author notes for the judge

- The ticket said *"keep the visibility rules"*. The plan keeps `buildThreadedAgentSet` but judges it at the site, before the aftermath removes the loser. That is the one place the old rule was wrong.
- The ticket said *"significance tiers stay"*. Two tiers rise instead: strangers' battle endings go from 0.2 to the chronicle's 0.85, and a town changing hands from 0.7 to 0.85, with a lever to turn the first back. Kept as they were, those lines reach no surface at all, so the rulebook's promise could not be kept. It is the veto-invited loudness decision.
- The ticket's Done-when said *"The CLI output is unchanged"*. That cannot hold: the CLI printed the debug summaries as events, and those become sentences. The plan's replacement is "tracing on equals tracing off", which is the invariant the old wording was reaching for.
