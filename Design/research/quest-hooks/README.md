# Hook Corpus — 1,200 situations for encounter authoring

**Status:** research corpus, not content data. Nothing here is wired to the engine.
**Purpose:** a wide, tagged idea bank to draw from when authoring encounter templates, nudge cards, and scene families. Read it, steal from it, argue with it.

## What these are — and what they are not

Every published RPG hook list assumes a **party**: four people who arrive, investigate, and resolve. Threadbare has no party. The player is a god; the world is full of mortals who have their own reasons and keep having them whether or not anyone is watching.

So each entry here is written as a **situation with pressure in it**, not a quest. The test each one has to pass:

1. **It resolves without the god.** If nobody intervenes, something still happens — usually the worse thing.
2. **A mortal is already inside it.** Not "someone could investigate" but "the miller's second son is in trouble and does not know it yet."
3. **There is a fork.** Two directions a person could be pushed. That fork is where a nudge card attaches.
4. **It is legible at a distance.** A god sees pressure, movement, and consequence — not interior monologue.

Hooks that fail test 1 are quest-giver fiction and were rewritten or cut.

## The tag line

Each entry ends with a tag line. Fixed column order, separated by ` · `:

```
SETTING/PLACE · REACH · PRESSURE · FORM · SCALE · TONE · MOVEMENT · OBJECTIVE
```

### SETTING — the eight live setting classes
`rural` `urban` `stronghold` `sacred` `arcane` `ruin` `wayside` `battlefield`

Matches `SETTING_CLASS_MAP` in the generated coverage matrix, so a hook can be pointed straight at a thin cell.

### PLACE — the concrete site, freeform but reused
`farm` `mill` `well` `market` `tavern` `temple` `shrine` `guildhall` `keep` `gate` `harbour` `bridge` `crossroads` `mine` `quarry` `graveyard` `library` `court` `camp` `ford` `pass` `barrow` `orchard` `kiln` `dock` `bathhouse` `granary` `smithy` `tannery` `caravanserai` `watchtower` `cellar` `moor` `fen` `treeline` `scree` …

### REACH — which divine reach the obvious nudge would run through
`iron` `gold` `shadow` `veil` `heart` `eye` `stone` `star`

Advisory. Most good hooks admit two.

### PRESSURE — what is squeezing
`hunger` `debt` `plague` `war` `feud` `grief` `ambition` `faith` `secret` `love` `oath` `exile` `succession` `weather` `rumour` `boredom` `shame` `duty` `fear` `greed`

### FORM — the shape of the event
`disappearance` `apparition` `discovery` `arrival` `accusation` `bargain` `betrayal` `omen` `transformation` `siege` `migration` `ritual` `theft` `contest` `birth` `death` `refusal` `return` `infestation` `collapse` `secret` `rumour` `rescue` `escort` `research` `reveal` `conceal` `restore` `inherit` `prove` `settle` `endure` `fulfil` `release` `imprison` `hunt` `negotiate` `exchange` `spreading` `trailblaze`

`secret` and `rumour` are separate forms on purpose: a secret is *held* and the pressure is on whoever holds it; a rumour is *loose* and the pressure is on whoever it lands on. They fail in opposite directions and want different cards.

### SCALE
`personal` `household` `village` `region` `realm` `cosmic`

### TONE
`quiet` `uncanny` `grim` `warm` `absurd` `cruel` `wondrous` `bleak-funny`

### MOVEMENT — does the situation travel?
`static` (fixed to one place) · `travel` (someone is going somewhere) · `migration` (a population is moving) · `spreading` (the situation itself moves outward)

### OBJECTIVE — what the *mortal* is trying to do

This is the classic quest-objective axis (the one every generator uses), but **rotated**. In a party game the objective belongs to the players: *recover the artifact, clear the monsters, escape*. In Threadbare the player is a god and cannot want things on a mortal's behalf — so the objective belongs to the person inside the situation, and the god's move is to *push that objective one way or the other*.

36 values, all in use, none used fewer than 3 times:

`avenge` `conceal` `cure` `depose` `destroy` `dispose` `elevate` `endure` `enrich` `escape` `escort` `exchange` `fulfil` `gohome` `hunt` `imprison` `inherit` `negotiate` `overthrow` `prevent` `protect` `prove` `recover` `refuse` `release` `repay` `rescue` `research` `restore` `reveal` `sanctify` `settle` `solve` `survive` `trailblaze` `unbind`

A few notes on the rotation, because it changes what gets written:

- **`clear out monsters` does not survive the rotation.** It is a party verb with no mortal inside it. What survives is the shepherd who has to take the flock up anyway, which is `survive` or `endure`.
- **`get gold` splits into six.** `enrich`, `repay`, `dispose`, `conceal`, `return`, `give` are six different people with six different problems, and the interesting ones are the last four.
- **`prevent apocalypse` is a scale tag, not an objective.** Nobody in the world knows the world is ending. They know the river is wrong. Write the river.
- **`find a way home` is the best one on the list** for this game, because it is the only objective that is inherently `travel`, generates its own complications, and never completes.

Christian's standing note is that nomadic stories and movement carry the game, so the corpus leans harder on `travel` / `migration` / `spreading` than published hook lists do — but be honest about how far: **297 of 1,200 (25%) are non-static.** That is a large multiple of what a typical published list carries, and it is still a minority. If movement needs to be the spine rather than a quarter of the material, files 03 and 12 are the pattern to extend, and the next tranche should be built movement-first.

## Measured distributions

All 1,200 entries validate against the closed vocabularies above (setting, reach, scale, tone, movement — 0 violations).

| axis | distribution |
|---|---|
| setting | rural 299 · urban 233 · wayside 202 · ruin 156 · battlefield 108 · sacred 102 · arcane 100 · **stronghold 0** |
| movement | static 903 · travel 154 · migration 90 · spreading 53 |
| reach | gold 255 · veil 220 · heart 200 · eye 173 · stone 121 · shadow 99 · star 80 · **iron 52** |

Two gaps worth naming rather than hiding:

- **`stronghold` is empty.** It is one of the eight live setting classes, and the corpus routed every keep, fort, and watchtower into `battlefield`, `ruin`, or `urban` instead. A stronghold hook that is *not* about a war is a genuinely different thing — garrison boredom, a lord's household, the politics of a place where forty people live behind one door — and none of it got written.
- **`iron` is the thinnest reach at 52.** That is a direct consequence of the design rule in the README: force resolves a situation instead of prolonging it, so hooks built on force kept collapsing into single beats and getting cut. Worth checking whether that is correct or whether it starves the Iron reach of content.

## Files

| file | theme | count |
|---|---|---|
| `01-village-and-rural.md` | farms, mills, small holdings, the rural year | 100 |
| `02-city-and-crowd.md` | urban density, anonymity, institutions | 100 |
| `03-road-and-wayside.md` | travel, inns, fords, the space between places | 100 |
| `04-faith-and-the-sacred.md` | temples, shrines, belief, heresy | 100 |
| `05-veil-and-the-arcane.md` | magic, divination, ritual, leakage | 100 |
| `06-ruins-and-the-buried.md` | the past surfacing | 100 |
| `07-war-and-borderland.md` | frontier, siege, aftermath | 100 |
| `08-guild-trade-and-gold.md` | craft, contracts, money, patronage | 100 |
| `09-blood-love-and-feud.md` | household, kin, inheritance, marriage | 100 |
| `10-omen-weather-and-uncanny.md` | the world behaving wrongly | 100 |
| `11-mountain-and-underground.md` | stone, depth, cold, mines | 100 |
| `12-nomads-and-the-far-road.md` | migration, herds, caravans, exile | 100 |

## Provenance

Subject-matter breadth was informed by surveying the public hook-list landscape (D&D Compendium, Kassoon, Donjon, Story Shack, Nerds on Earth, Tribality and similar) for *what categories of situation people reach for* — not for text. Every entry below is original writing in Threadbare register. No list was copied.
