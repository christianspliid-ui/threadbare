> **Decision audit for THR-1870** (wayfinder map THR-1863, *Mortal economy*; project M3: Dynamic Economy). Design lane run 2026-10-15a, unattended; decided by delegation (process.md rule 4) with a veto invited.
>
> Mock: [`economy-mock.html`](2026-10-15-thr-1870-economy-visibility/economy-mock.html), five 1920×1080 screens selected by `#place`, `#trouble`, `#trade`, `#faction`, `#receipt`, on the same map, god and towns as the [THR-1830 lens mock](2026-10-14-thr-1830-map-lenses/lens-mock.html). Screenshots:
> [place page](2026-10-15-thr-1870-economy-visibility/place.png) · [Trouble lens](2026-10-15-thr-1870-economy-visibility/trouble.png) · [Trade lens](2026-10-15-thr-1870-economy-visibility/trade.png) · [faction purse](2026-10-15-thr-1870-economy-visibility/faction.png) · [cast receipts](2026-10-15-thr-1870-economy-visibility/receipt.png)

# THR-1870 — what the player sees of the economy

**Question (the ticket):** what must the player see to *play* the economy, in words, never numbers or prices: the map look, the place page, the faction sheet, and receipt chips for the economic verbs.

**Destination test (the map):** *does this give factions something worth fighting over?* — and settlements must stay diverse. A surface earns its place when it lets the player see what is worth fighting over, or see that their hand changed it.

## Settled input (not re-opened)

| Source | What it fixes here |
|---|---|
| [THR-1830 lenses](2026-10-14-thr-1830-map-lenses-decision.md) (lane, veto window closed) | One lens at a time, none by default. The plain map is the table: **no hue wash**; trade roads, unrest and rival marks live in their lenses. Trouble ink is red; Trade is caravan gold, red when threatened. |
| [THR-1878 lenses plan](../plans/2026-10-14-thr-1878-map-lenses-and-chrome.md) (Ready for Dev) | Trouble lights a hex for a Lawless place or the survey mood `agitated`+, hover *"Unrest: Ferris is lawless."*; Trade hover adds *"Millbrook is prosperous; Hesk Crossing is struggling and short of iron."* from `getProsperityTier` lower-cased. |
| [THR-1876 Inspector plan](../plans/2026-10-14-thr-1876-the-inspector.md) (Ready for Dev) | The place page is a section registry (`livelihood` at ord 20, `conditions_here` at 40); the faction page opens wide. |
| [THR-1923 settlement economy plan](../plans/2026-10-14-thr-1923-settlement-economy.md) (Ready for Dev) | Already owns: the place-page **size line** and **livelihood sentences**, building cards, the **Restless** chip (enter 30, release 15), the cast-receipt **land line** for Blight, Bless the Harvest, Sour Mine and Reveal Vein, and the rule *"the economy is weather; Needs you stays for the god's choices"*. |
| [THR-1869 hunger and unrest](https://linear.app/threadbare/issue/THR-1869) (lane, veto open) | Unrest bands 30 Restless · 50 Lawless · 70 On the edge (the town may defect) · 90 Rising (it throws off its holder); inputs hunger, poverty, siege, sickness, a death. Its comment on this ticket asks for the trouble line, band words on the lens, chronicle lines for 70 / defect / rise / empty, and a Needs-you call. |
| [THR-1867 faction purse](https://linear.app/threadbare/issue/THR-1867) (attended, Christian present) | Faction Means word = days of upkeep in hand. |
| [THR-1868 war aims](https://linear.app/threadbare/issue/THR-1868), [THR-1871 god's stake](https://linear.app/threadbare/issue/THR-1871) (lane, veto open) | Regional monopoly, `embargo` faction action; a hungry town on the god's ground **prays** through Needs you. |
| Rulebook / plan canon | *"The player never sees prices"* (2026-07-04 resource-web plan); Vision non-negotiable § 3 *all mechanics surface through prose, never numbers*; UI Laws 13/14 (no magnitudes, no keys), 15 (delta triangles are the glyph for realised change), 17 (one tooltip registry), 21 (names route), 56 (a chip only for written state). |

## What the game shows today (measured, worktree @ `origin/main` 18e3b039)

- **Receipts never carry the economy.** The cast diff reads only `divineInfluences` and `has_trait` edges (`castTargetChanges.ts:96-111`); change kinds are `growth | trait | item | reputation | faction_reputation | reputation_tally | shell_state | future_hook` (`types/unifiedAction.ts:180-188`). Bless the Harvest writes prosperity, health and staple stock (`unified-action-templates.ts:1917-1923`, `graphOpExecutor.ts:1773-1812`); Guide the Caravan writes lane volume and clears `threatened` (`graphOpExecutor.ts:1688-1714`). Neither produces a change row.
- **Two prosperity ladders disagree.** `getProsperityTier` (`phaseProsperity.ts:205-211`): ≥80 Flourishing, ≥60 Prosperous, ≥40 Modest, ≥20 Struggling, else Destitute. `deriveProsperityLabel` (`retinue.ts:344-350`): ≥70 Prosperous, ≥40 Stable, ≥10 Struggling, else Destitute — shown on Threads (`ThreadsPanel.tsx:484`, `ThreadDetailView.tsx:933`).
- **No unrest on any player surface** except the Lawless condition chip (`condition-trait-content.ts:610-615`, enter 50 / release 30) and the hex survey's mood sentence. No Restless chip exists yet (THR-1923 adds it).
- **Monopolies are debug-only** (`EconomyDebugTab.tsx:61-62`); `faction.properties.monopolies` has no reader (`economicPower.ts:200`).
- **Faction Means** is `getWealthTier(faction.wealth)` (`FactionSheet.tsx:416-421`; Destitute · Getting by · Comfortable · Wealthy · Magnate, `wealth.ts:82-88`) and reads Destitute everywhere because faction wealth is 0 (audit § 2).
- **A prosperity tier change is not chronicled** — `tierChanged` goes only to a trace (`phaseProsperity.ts:883, 938, 957`).

## Decisions

### 1. One word ladder per quantity, the same on every surface

| Quantity | Words | Source | Surfaces |
|---|---|---|---|
| How well a place lives | Destitute · Struggling · Modest · Prosperous · Flourishing | `getProsperityTier` (unchanged) | Fortunes line, Trade hover, receipts, Threads |
| A town's trouble | Restless · Lawless · On the edge · (Rising is an event) | THR-1869 bands | chips, Fortunes line, Trouble hover, receipts, chronicle |
| A purse | Destitute · Getting by · Comfortable · Wealthy · Magnate | `getWealthTier`; faction reads THR-1867's days of upkeep | mortal and faction sheets, receipts |

`deriveProsperityLabel` retires and Threads reads `getProsperityTier` (THR-1862 item 6 fixes the read; this decision fixes the ladder). **On the edge** becomes a condition chip like Lawless (enter 70, release 55); **Rising** is an event, so it is a chronicle line and never a chip (Law 56).

### 2. The place page gains one row: Fortunes

One sentence at ord 18 in the Inspector's place registry (LocationView until the Inspector lands), between the past line and THR-1923's livelihood:

- *"Millbrook is struggling, and its people are restless with hunger."* — the prosperity word, then, **only when a band is crossed**, the band with its largest THR-1869 input (hunger · poverty · an army at the walls · sickness · a death that still weighs on them).
- Calm: *"Millbrook is modest and quiet."* — and nothing more (equilibrium is silence).
- On the edge, held: *"…and it is on the edge of turning from House Ashfold."* Unheld: *"…and its people are on the edge of leaving."*

The prosperity word carries a registry tooltip (`ui.econ.prosperity`, Law 17). The row never repeats the size, livelihood or building lines (THR-1923 owns them). No number, no "trend" arrow.

### 3. The map: no tint; a Hunger mark in Trouble, three new lines in Trade

- **No famine tint, no boom bustle on the plain map.** THR-1830's grammar rules out a hue wash, and the plain map keeps your people. A famine is something you ask the map about.
- **Trouble gains a `hunger` mark** (red, one badge, never a number): a settlement lights while its food falls short (THR-1923's starving state). Hover: *"Hunger: Millbrook's fields cannot feed its people."*
- **Trouble's unrest hover speaks the band words.** THR-1878's lighting rule stays as planned (a Lawless place, or survey mood agitated+); its hover uses the band word when the place has one: *"Unrest: Ferris is on the edge. It may turn from House Ashfold to a lord who can feed it."* Restless alone does not light a hex (7–12 Restless towns per seed against 3–7 Lawless in THR-1869's runs would light most of the map); it appears as a second hover line on a hex already lit.
- **Trade's hover gains three lines**, each from state the economy decisions write: *"Tolled by the Saltmarch Guild."* (the lane's controlling faction); *"Embargoed by House Varr: nothing moves on it."* (THR-1868's embargo; the road draws red and dashed, legend mark *Embargoed*); *"The Saltmarch Guild holds the salt of this region."* (a regional monopoly on a good the road carries).

### 4. The faction sheet gains a Purse panel

- The Means chip reads THR-1867's purse, so it stops saying Destitute for everyone. Tooltip: *"How long a faction could pay its soldiers from what it holds now…"*
- **Income:** one sentence naming the two largest sources by name, never an amount — *"Most of its coin comes from the salt pans of Saltmarch Hold and the toll on the Millbrook road. A share goes to House Ashfold."* (the crown's share, THR-1917).
- **Spending:** what it pays for and for how long — *"It pays for one warband, and has coin to spare for a month of it."* Broke: *"Its purse is empty. Its soldiers go unpaid and begin to slip away."* (the desertion path THR-1867 switched on).
- **Monopoly chip**, state-backed: *"Holds the region's salt"*; it clears the day the share drops (Law 56).

### 5. Receipts: every economic verb answers in words

- A new change kind, **`economy`**, from an extended cast snapshot that also reads the target's prosperity tier, unrest band, staple stock tiers, touching lanes (volume tier, threatened, embargoed) and, for a mortal, the Means band.
- **A crossed band says the new word** (*"Ferris has gone lawless."*, *"Millbrook is no longer struggling: it is modest again."*, *"Millbrook is no longer short of grain."*). **A change inside a band says only the direction** (*"Its people's anger cools."*, *"Trade on the roads from Millbrook picks up."*). Unchanged things are not listed. Delta triangles per Law 15; no number.
- A lasting effect that fades ends with its fade clause (*"The plenty will ease over the coming season."*, *"Left alone, its anger will cool."*), reading the same record as THR-1923's land line.
- **A crossed band (or a road freed of threat) opens the receipt dialog; a change inside a band rides the toast.** So a nudge stays light and a turn of fortune is seen.
- The lines sit **under THR-1923's land line** in the same receipt and the same second; one diff feeds the receipt and the Fortunes row, so they cannot disagree.

| Card | Lines it can write |
|---|---|
| Bless the Harvest | land line (THR-1923); short-of-good cleared; prosperity word; anger cools |
| Blight | land line (THR-1923); short of a staple; prosperity word down; anger rises |
| Open the Markets | prosperity word or "trade quickens"; anger cools / no longer lawless |
| Guide the Caravan | each touching road: no longer threatened / trade picks up |
| Reveal the Vein / Sour Mine | land line (THR-1923); "now has iron" / "its mines give little"; monopoly broken when it is |
| Incite Unrest | band crossed, else "anger rises" |
| Sicken the Wells | sickness clause; band crossed, else "anger rises" |
| Curse the Roads | "trade on its roads falters"; band crossed, else "anger rises" |
| Fortune's Favour / Ruin (THR-1871) | the mortal's Means band crossed, else "fortunes turn up / down" |
| Bless the Holding (THR-1871) | "the holder's yield swells this season" + fade clause |

### 6. Chronicle lines for the unrest bands (THR-1869's ask)

Four new Great Chronicle triggers, three variants each, game register, full-detail settlements only (the THR-1923 `ECON_PHASE_SPOTLIGHT_CAP` rule): **crosses On the edge** (*"Ferris mutters against House Ashfold; men count the days since the last cart of grain."*), **defects** (*"Ferris has turned from House Ashfold and opened its gates to Saltmarch Hold."*), **rises** (*"Ferris has risen. Its people burned the reeve's hall and named their own captains."*), **empties** (*"The last carts have left Ferris. No one tends its fields now."*). A prosperity tier change stays unchronicled — the Fortunes row and receipts carry it, and equilibrium is silence.

### 7. Needs you: no new entry

A town On the edge does **not** get a Needs-you entry of its own. THR-1871's prayer is already the one Needs-you entry for a hungry town on the god's ground, and THR-1923 keeps Needs you for the god's choices. When a praying town is also On the edge, the prayer's line says so: *"Millbrook prays for bread, and is on the edge of turning from House Ashfold."* A town on the edge for other reasons (siege, poverty) reaches the player through the Trouble lens and the chronicle — it is the world's weather, not a call to the god.

(The ticket comment cites "Law 15" for this question; Law 15 is the pip and delta-glyph law, used in § 5. The Needs-you rules are THR-1825/THR-1828's.)

## Options weighed

- **A famine tint or boom bustle on the plain map.** Rejected: THR-1830 rules out a hue wash and keeps the plain map for your people; it would also re-open the all-at-once noise THR-1808 recurs on.
- **Prosperity as a meter or pips on the place page.** Rejected: Law 13 and the prices-never canon; Law 15 sanctions pips only for odds and price.
- **Renaming Modest to "getting by".** Rejected: "Getting by" is already a Means word (`wealth.ts`), and THR-1878 already prints the tier word in Trade hovers.
- **Lighting Restless towns in Trouble.** Rejected: it would light most settlements and drown Lawless and On the edge.
- **A Needs-you entry for every town on the edge on your ground.** Rejected: duplicates THR-1871's prayer and breaks THR-1923's "Needs you is for the god's choices".
- **Receipt rows for every economic field that moved.** Rejected: a band-crossing-first rule keeps the receipt short and true; a list of small direction lines would be noise.

## Would change the call

- Christian: *"show me famine on the map without a lens"*, *"I want to see how rich a town is at a glance"*, or *"every town about to turn should ask me first"*.
- A warm playtest where testers miss a famine on their own ground because the plain map is quiet — then a hunger badge returns to the plain map for towns on the god's Held+ ground only.
- A census showing Restless is rare (fewer than one town in ten) — then Restless lights in Trouble too.

## UI-Laws judgement (for the plan doc)

| Law | Verdict |
|---|---|
| 1 / 17 | Every new word (Fortunes, On the edge, Hunger, Embargoed, Means) needs a `ui.econ.*` / `ui.lens.mark.*` registry tooltip. Build obligation. |
| 13 / 14 | Words only; no prices, amounts or keys on any surface in the mock. ✓ |
| 15 | Delta triangles are the receipt's change glyph; no pips. ✓ |
| 21 | Every name in a Fortunes, hover, Purse or receipt line routes through `useRefRouter`. Build obligation. |
| 33 | Inspector, wide faction page, lens hovers and receipt dialog fit 1920×1080 in the mock. ✓ |
| 37 | N/A — no multi-beat flow. |
| 56 | Every chip (On the edge, the monopoly chip, Means) reads written state; the monopoly chip clears when the share drops. ✓ |

## Outputs

- This record; the mock and its five screenshots.
- **Feeds the map's carve-up.** The new pieces here (Fortunes row, Hunger mark and band hovers, Trade hover lines, Purse panel, `economy` receipt kind, four chronicle triggers, the ladder unification) belong to an economy-visibility plan doc that builds after THR-1923, THR-1878 (Lenses II) and the Inspector, and alongside the purse, war-aims, unrest and god's-stake plans whose state it reads. New engine data: the `economy` change kind and the extended cast snapshot; everything else reads state those plans write.
