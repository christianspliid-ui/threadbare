---
name: game-design-laws
description: >
  Loads the Game Design Laws (Docs/game-design/laws.md) and runs the law check on
  any design OR implementation pass that changes how the game behaves — odds, dice,
  forecasts, luck and streaks, loot and reward draws, rarity, progression and growth,
  what failure costs, quintessence and Broken, the god's powers and cards, nudge
  riders, essence prices and upkeep, the economy, Dominion, the doom clock and the
  Mandate, interrupts and time, fights, spells, items, undertakings, cross-run carry.
  Also loads when adding, amending or ratifying a game design law, and when
  Christian asks for a change to how the game plays. Triggers on "game design law",
  "design law", "law check", "odds", "probability", "forecast", "d100", "roll",
  "luck", "streak", "loot", "reward", "drop rate", "rarity", "Legendary",
  "progression", "growth", "level up", "XP", "failure", "penalty", "punish",
  "retry", "difficulty", "success rate", "balance", "tuning", "nudge card",
  "rider", "essence cost", "price", "economy", "upkeep", "Dominion", "doom",
  "mandate", "god power", "divine action", "new mechanic", "rule of play".
  Sibling of frontend-ui, which loads the UI Laws.
last_validated_against: 2026-10-24
---

# Game Design Laws

[`Docs/game-design/laws.md`](../../../Docs/game-design/laws.md) is the numbered law book for **how the game behaves**: the fundamentals every mechanic keeps. It is the sibling of the UI Laws (`Docs/design-system/laws.md`, loaded by `frontend-ui`), which govern how the game is shown. The rulebook holds the rules of play; the laws are what those rules must keep.

## When to load

- **Design:** any plan doc that adds or changes a mechanic. Load it beside `state-of-game-design` and `game-design-direction`; it does not replace the Vision audit.
- **Implementation:** any diff that changes something a player feels — an odds formula, a draw, a reward table, a growth rate, a failure cost, a price, a clock, a card's effect — even when a plan doc already exists. The executor checks the diff, not only the plan.
- **Director asks:** when Christian asks for a change to how the game plays, check the ask against the laws first.
- **Skip:** pure presentation (that is the UI Laws), pure infrastructure with no change in behaviour, prose register work (`Docs/canon/prose.md`).

## Which chapter

| § | Chapter | Laws | Read it when the change… |
|---|---|---|---|
| I | Randomness and luck | 1–8 | rolls, draws or picks at random; loot; streaks |
| II | The god and the mortal | 9–15 | changes what the god can do to a mortal, who decides a fork, what interrupts the player |
| III | The odds | 16–21 | touches resolution, forecasts, card prices, dealt hands, how mortals pick challenges |
| IV | Failure | 22–26 | changes what failing costs or leaves behind |
| V | Time and the run | 27–32 | touches the clock, pacing, encounter density, doom, endings |
| VI | Power, growth and the economy | 33–39 | touches capability, progression, essence, Dominion, god cards, cross-run carry |
| VII | Building systems and content | 40–45 | adds a framework, an effect, a player-facing concept or a content kind |

## The law check (one internal pass, before you present or ship)

1. **Read** the chapters the change touches, and § I whenever anything is random.
2. **Name** each law the change touches and say which it does: *conforms*, *extends* (a new instance of the law), or *would break*.
3. **Measure** where a law is measurable rather than asserting it: the rate players actually get (Law 1), forecast against roll (Law 18), level success by band (Law 20), the two failure traps (Law 24). The gate tests are listed in the book's Enforcement section; run the ones the change touches.
4. **A change that would break an [E] law stops there.** Do not ship it and do not reword the law to fit. Take it to Christian as one plain-language yes/no in game terms: what changes for the player, what the law protects, your recommendation, with direct links to the law and the plan (CLAUDE.md Rule Zero). Record his answer on the ticket. If he says yes, amend the law in the same PR (protocol below).
5. **A [P] law binds until Christian rules.** If your change is right and the [P] law is wrong, propose the amendment in the same ask rather than working around it.
6. **Record one line** where the work lives — the plan doc's governance summary, or the PR body: `Game Design Laws: 18, 20 conform; 24 extended (failed hunts cool down like failed templates).`

How a conforming design is built is the agent's call (CLAUDE.md, THR-608). Breaking an [E] law is a creative fork, and those go to Christian.

## Adding or amending a law

- **Source first.** A law enters as **[P]** with its source: a rule already in canon, an `[IMPL]` rulebook rule, or Christian's own words. A law with no source does not go in. Never write a law to justify the design in front of you.
- **Shape.** One checkable statement in bold, a short *Why* when it is not obvious, and *Source:* with the date and ticket. Plain words; match the existing chapters.
- **Numbers are permanent.** A new law takes the next free number, in its chapter or in a new chapter at the end. A retired law keeps its number, struck through, with the date and the reason. Never renumber: code comments and the rulebook cite the numbers.
- **Ratification.** Christian ratifies or vetoes [P] laws in chat. On a yes, change the mark to **[E]** and add *Ratified by Christian in chat YYYY-MM-DD (THR-XXX)*.
- **Record it.** One row in the PR's new `Docs/changelog/YYYY-MM-DD-thr-XXXX.md` file naming the law number(s) and why (`Docs/changelog.md` is a frozen archive since 2026-10-24). If the rule of play changes too, update the rulebook rule that cites the law in the same PR. If a machine can check the law, add the check in that PR and list it under Enforcement.
- **Never as a side effect.** An [E] law changes only with Christian's yes, never inside an unrelated ticket.

## Related

- `state-of-game-design` (router) and `game-design-direction` (Vision, taste profile) — load first on design passes.
- `Docs/canon/design-governance.md` — its checklist names this book.
- `.claude/skills/review-gate/rubric.md` check 20 — the code reviewer flags a broken [E] law.
- `Docs/canon/rulebook.md` — when a rule and a law disagree, that is a finding, not a choice.
