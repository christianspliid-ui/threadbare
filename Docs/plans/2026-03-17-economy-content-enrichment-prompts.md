# Economy Content Enrichment — Claude Code Prompts

Copy-paste in order. Each is independent but builds narrative density cumulatively.

---

## Prompt 1: Wealth Prose Resolver

The biggest visibility gap — agents have wealth numbers but the player can't see it in how they're described.

```
Add a `wealthResolver` to proseResolvers.ts that colors agent descriptions based on their wealth tier. Follow the existing resolver pattern (pure function, fail-soft, PRNG-seeded fragment selection).

Add a WEALTH_PROSE table to prose-layer-content.ts with 3–4 fragments per wealth tier:

- Magnate (≥80): descriptions of visible opulence, political weight, silk and gold
- Wealthy (≥60): comfortable excess, well-fed retinue, fine but not ostentatious
- Comfortable (≥40): solid merchant class, clean hands, ledger-minded
- Getting by (≥20): patched cloaks, careful coin-counting, one bad season from trouble
- Destitute (<20): threadbare, hollow-eyed, desperate, the economy's casualties

The resolver should emit a ProseLayer with category 'economic' and priority that places it after identity but before trait descriptions in the agent prose composition. Wealth fragments should be tonally consistent with the Threadbare aesthetic.

Wire it into the agent prose pipeline so it fires for any actor with a wealth property. Fail-soft: missing wealth → skip silently. Tests for the resolver and prose table. Follow Definition of Done.
```

---

## Prompt 2: Trade Route Prose Resolver

Players can't see the economic network — trade routes are edges with no narrative surface.

```
Add a `tradeRouteResolver` to proseResolvers.ts that describes active trade routes as part of location descriptions.

Add a TRADE_ROUTE_PROSE table to prose-layer-content.ts organized by:

**Volume tiers** (3–4 fragments each):
- High volume (≥7): "Caravans arrive before the last ones leave", "The road is rutted deep by merchant wheels"
- Medium volume (4–6): "A steady flow of trade goods changes hands each week"
- Low volume (1–3): "A thin trickle of commerce connects this place to the wider world"

**Goods type color** (1–2 fragments per resource type, composable with volume):
- ore: "ore carts", "iron-heavy wagons", "the clang of raw metal"
- timber: "lumber trains", "the scent of fresh-cut pine"
- grain: "grain barges", "flour-dusted merchants"
- fish: "salt-packed crates", "the harbour reeks of prosperity"
- stone: "quarry blocks on slow oxen"

**Route status modifiers:**
- threatened: "though bandits have grown bold along the route"
- controlled: "under the watchful eye of [controller name]"
- decaying: "though fewer carts make the journey each season"

The resolver walks all `trades_with` edges connected to the location, picks the highest-volume route, and composes a sentence from volume + goods + status fragments. For locations with 2+ routes, add a summary line ("A crossroads of commerce" / "Trade flows in from [count] directions").

Wire into location prose pipeline. Fail-soft: no trade routes → skip. PRNG for fragment selection. Tests. Follow Definition of Done.
```

---

## Prompt 3: Economic Traits

Agents who engage in economic activity should gain visible traits that shape their identity and future behavior.

```
Add economic trait definitions to the trait system. These are mastery/reputation traits that emerge from economic activity patterns, following the existing trait pattern (graph nodes with `has_trait` edges).

**New trait definitions (add to trait content):**

| Trait | Category | Acquisition pattern | Domain contribution | Prose flavor |
|-------|----------|-------------------|-------------------|-------------|
| `trade-baron` | mastery | 3+ controlled trade routes AND wealth ≥ WEALTH_TIER_WEALTHY | Gold +15 | "Commands trade routes like a general commands armies" |
| `guild-sworn` | cultural | Member of a guild faction for 10+ ticks | Gold +10, Heart +5 | "Bears the mark of their guild in every transaction" |
| `bankrupt` | scar | Wealth dropped below 5 from above WEALTH_TIER_COMFORTABLE | Gold -10 | "Carries the hollow look of someone who once had everything" |
| `monopolist` | reputation | Successfully established a monopoly | Gold +20, Heart -10 | "Whispered about in markets — feared more than respected" |
| `smuggler` | mastery | 3+ successful Smuggler's Den encounters | Shadow +10, Gold +5 | "Knows every back door and unwatched dock" |
| `debt-laden` | condition | Has 2+ active debt agreement attachments | Gold -5 | "Owes more than they own; every coin is already spoken for" |
| `patron` | reputation | 2+ successful fund-construction actions | Stone +5, Heart +10 | "Known for building up what others merely exploit" |
| `coin-cursed` | scar | Lost wealth 3+ times to disruption or broken agreements | Gold -5 | "Money slips through their fingers like water through sand" |

**Trait acquisition phase:** Add a `phaseEconomicTraits` to the orchestrator (after phaseProsperity). It scans actors with wealth properties and checks acquisition patterns against graph state. Trait assignment uses existing `has_trait` edge with standard properties (level, source, visibility: 'public' for reputation traits, 'discoverable' for mastery/scar).

**Trait loss:** `bankrupt` clears when wealth rises above WEALTH_TIER_GETTING_BY. `debt-laden` clears when debt count drops to 0. Others are permanent or decay via existing trait decay system.

Constants: all acquisition thresholds as named exports. Traces: `economic_trait_acquired` with actorId, traitId, acquisition reason. Fail-soft: missing wealth/edges → skip actor. Tests for each acquisition pattern. Follow Definition of Done.
```

---

## Prompt 4: Guild Identity Prose

Guilds are factions but they all read the same in location descriptions. Give each guild type a distinct narrative voice.

```
Add guild-type-specific prose to prose-layer-content.ts and wire it into location and faction prose resolvers.

**GUILD_IDENTITY_PROSE table** — 3–4 fragments per guild type, used when describing a location that contains a guild or when describing the guild faction itself:

- **Miners' guild:** gruff, pragmatic, earth-stained. "The Miners' Guild keeps its own counsel, emerging from the shafts with ore and silence." "Their hall smells of stone dust and tallow." "They measure wealth in veins, not coins."
- **Artisans' guild:** precise, proud, craft-obsessed. "Every surface in the Artisans' Hall bears the mark of someone's best work." "They argue about grain direction the way soldiers argue about sword technique." "Apprentices sweep the floors for years before touching raw material."
- **Traders' guild:** shrewd, cosmopolitan, restless. "The Traders' Guild hall is never quiet — someone is always arriving or departing." "They speak three languages badly and haggle in all of them." "Maps cover every wall, routes marked in red for profit and black for loss."
- **Bankers' guild:** quiet, powerful, unsettling. "The counting house is the quietest building in town, and somehow the most frightening." "They lend with a smile that never reaches their eyes." "Debts are recorded in ink that doesn't fade."
- **Merchants' guild:** broad, civic-minded, political. "The Merchants' Guild sits at the center of town life, funding festivals and collecting favours." "They know everyone's name and everyone's price." "The guild master attends every council meeting uninvited and leaves having shaped every decision."

Add a `guildIdentityResolver` that fires for locations containing guild_hall sublocations. It reads the guild faction's `guildType` property and selects fragments accordingly. Also wire into faction prose for when guilds are described directly in agent/faction views.

PRNG for selection. Fail-soft: missing guildType → use merchants' fragments as fallback. Tests. Follow Definition of Done.
```

---

## Prompt 5: Deeper Prosperity Prose (Cultural Variants)

The existing 18 prosperity fragments will repeat. Expand them with terrain and culture variations.

```
Expand PROSPERITY_PROSE in prose-layer-content.ts from 18 fragments to ~50 by adding terrain-specific and culture-biased variants.

Keep the existing 5-tier × 3–4 generic fragments as the base. Add terrain-keyed variants:

**Coastal settlements:**
- Flourishing: "Ships crowd the harbour three-deep, their flags from ports no one here can name"
- Destitute: "The fishing boats rot at their moorings. The sea gives, and the sea has stopped giving"

**Mountain settlements:**
- Flourishing: "The mines run day and night; lantern light leaks from every shaft"
- Destitute: "The mountain swallowed their fortune. Now it swallows their hope"

**Farmland settlements:**
- Flourishing: "Granaries overflow and children grow fat on butter and idleness"
- Destitute: "The fields lie fallow. Even the crows have moved on"

**Forest settlements:**
- Flourishing: "Timber wealth has built this place twice over; the sawmills never rest"
- Destitute: "They cut the last good tree a season ago. Now they burn green wood and cough"

Add 2–3 fragments per tier per terrain type (5 tiers × 4 terrains × 2–3 = 40–60 new fragments). The prosperityResolver should check the location's terrain type and prefer terrain-specific fragments when available, falling back to generic.

Fragment selection: PRNG-seeded, terrain-specific pool first, generic fallback. Fail-soft: unknown terrain → generic only. Tests for terrain-specific selection. Follow Definition of Done.
```

---

## Prompt 6: Economic Chronicle Entries

Major economic events should leave permanent marks in the chronicle that the player can read back later.

```
Add economic chronicle entry templates to the narrative system. These fire on significant economic state changes and persist in the chronicle for the player to review.

**New chronicle templates (add to chronicle/narrative content):**

| Trigger | Chronicle entry template | Significance |
|---------|------------------------|-------------|
| Settlement promotion | "[Settlement] has grown from a [old type] into a [new type], its prosperity drawing settlers from across the region" | 0.9 |
| Settlement demotion | "[Settlement] has withered. What was once a [old type] is now barely a [new type]" | 0.8 |
| Trade route established | "A new trade route opens between [A] and [B], carrying [goods type]" | 0.5 |
| Trade route dies | "The road between [A] and [B] falls silent. The last caravan passed [N] ticks ago" | 0.6 |
| Guild founded | "The [guild name] establishes itself in [settlement], raising their hall where [flavor]" | 0.7 |
| Monopoly established | "[Actor] seizes control of the [resource] supply in [settlement]. Prices climb; murmurs of resistance begin" | 0.9 |
| Monopoly broken | "The [resource] monopoly in [settlement] collapses. Markets breathe again" | 0.8 |
| Mercenary hire | "[Actor] hires a band of sellswords. The reason, they say, is protection. The reason, others say, is ambition" | 0.6 |
| Assassination commissioned | "Someone in [settlement] has paid for blood. The target is [known/unknown to player based on visibility]" | 0.8 |
| Agreement broken | "[Actor] breaks their pact with [target]. Trust, once spent, is not easily earned back" | 0.7 |
| Wealth tier change (up) | "[Actor] has risen to [tier label]. [tier-appropriate flavor]" | 0.5 |
| Wealth tier change (down) | "[Actor] has fallen to [tier label]. [tier-appropriate flavor]" | 0.6 |

Wire these into the existing chronicle/TickEvent system. Each template should resolve actor and location names from graph state. PRNG for variant selection where multiple templates exist per trigger. Fail-soft: missing names → use generic descriptors ("a settlement", "a merchant"). Tests. Follow Definition of Done.
```

---

## Suggested Order

1. **Wealth Prose Resolver** — immediate visibility, tiny scope
2. **Trade Route Prose Resolver** — makes the network visible, medium scope
3. **Economic Traits** — gives agents economic identity, medium scope
4. **Guild Identity Prose** — differentiates guild types, small scope
5. **Deeper Prosperity Prose** — reduces repetition, medium scope
6. **Economic Chronicle Entries** — gives economic events permanence, medium scope

Each prompt is self-contained. Total across all 6: roughly 50+ new prose fragments, 8 new traits, 12 chronicle templates, 3 new resolvers, 1 new orchestrator phase.
