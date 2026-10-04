> **companion to:** `Docs/plans/2026-10-03-thr-1714-show-the-roll.md`
> **created:** 2026-10-03 · tb-design-lane run 2026-10-03d

# Show the roll — brainstorm companion

## The tension

The nudge model's promise is *"you nudge; fate rolls; the ending is fate's alone"* (`ui.nudge_forecast`). Its risk is the one the veteran named: when fate overrides you and nothing says so, the price you paid looks decorative. The cure cannot be to make fate obey (that is the rejected "choosing between authored futures", THR-772), and it cannot be numbers (ruling 6). It has to be **telling**: what the odds were with your hand, and what fate did with it.

## Vision premises engaged

- *The god acts in physics; fate decides* (THR-868 Vision audit). Kept: nothing about the roll changes.
- *Game prose, not novel prose* (prose canon rule zero; memory: prose register is GAME not novel). The fate line is GM narration, short, declarative.
- *Every consequence is state-backed* (Law 56) — the fate line reports a band and a pole the engine actually wrote, never fiction.

## Alternatives considered

| Option | Why not taken |
|---|---|
| Show the odds and the roll as numbers ("62 %, rolled 71") — the veteran's literal ask | Ruling 6 / Law 13 / UL *Forecast tier*: numerals stay in traces and the designer view. The forecast word *is* the probability surface. |
| Show the d100 as a die face animation | A die face is a numeral in disguise; it also invites the reading "I lost a coin flip" instead of "fate turned the moment". |
| Make leaned hands always write the leaned pole, varying only magnitude | Changes the agreed design (grill verdict 1: *"you nudged toward mercy, fate landed ruthlessness"* must be reachable). Out of bounds for a legibility ticket. |
| Fate line only, no lean tag on cards | Leaves "you leaned toward Brave" untraceable to the cards played; the story tester never knew which way a card argued. Kept the tag, with a kill criterion if it reads as a promise. |
| Lean tag only, no fate line | Fixes "which way did my card lean" but not "what did fate do". The veteran's ask is the second. |
| Fate line in-world as well | The 3/3 evidence is the meeting; in-world steps carry outcome colours and band prose. Recorded as D7 with a round-3 trigger. |
| "Let fate answer" alone as the commit | Fixes "skip" but still says nothing about silence vs a whisper. The two-state label makes silence a visible act, which the measured 35–53 % silent good bands make worth naming. |
| Keep "was Perilous", add "before your hand" | Longer and still past tense; "your hand: Perilous → Uncertain" names cause and direction in five words. |

## Census source (throwaway, not committed)

Run on `354e407e`, `npx vitest run` on a temporary file under `src/engine/__tests__/`, deleted after the run:

```ts
const tests = ENRICHED_DILEMMA_LIBRARY.filter((d) => d.test && d.test.nudges?.length); // 64
// per test, 200 seeds: hand = every poleLean 'a' card → resolveFormativeTest(t, 0, id, hand, 1000+s)
//   overridden = writtenPole !== netLean; tally bands
// per test, 200 seeds: silent hand → resolveFormativeTest(t, 0, id, [], 5000+s); good = shift-table sign > 0
// bond: 1000 seeds silent / all cards → resolveBondTest(MEETING_BOND_TEST, hand, 9000+s)
```

Output: overridden 0.385 · success 7036 / failure 3596 / critical_success 833 / near_miss 760 / critical_failure 575 / success_at_cost 0 · silent formative good 0.349 · bond silent good 0.527 · bond all-cards good 0.887.

## Open threads handed to others

- `success_at_cost` never occurs in the meeting (0 / 12,800). `MEETING_TEMPERED_BAND` and the `tempered` prose slot for that band are dead in practice; `near_miss` is the only path into `tempered`. Whoever next tunes the meeting owns it.
- `meeting.test_resolved` / `meeting.bond_resolved` were declared at THR-868 and never emitted. This plan activates them.
